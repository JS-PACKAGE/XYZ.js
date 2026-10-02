import { audioDefaults } from '../../../src/data/audio.js';
import { AudioError } from './errors.js';
import type { AudioChannelName } from './audio-manager.js';
import {
  applyPannerOptions,
  type SpatialAudioOptions,
  type AudioVec3,
} from './samples/spatial.js';

export interface OPMOperator {
  ratio: number;
  level: number;
  detune: number;
  adsr: { a: number; d: number; s: number; r: number };
}

export interface OPMVoice {
  version?: 1;
  name?: string;
  algorithm: number;
  feedback: number;
  ops: [OPMOperator, OPMOperator, OPMOperator, OPMOperator];
  lfo?: { rate: number; amDepth: number; pmDepth: number };
  modIndex?: number;
}

interface OfficialOPM {
  context: AudioContext | null;
  node: AudioWorkletNode | null;
  voices: Map<string, OPMVoice>;
  loadVoice(name: string, voice: unknown): void;
  start(): Promise<void>;
  playNote(options: {
    voice?: string | OPMVoice;
    note: number;
    time?: number;
    duration: number;
  }): number;
  stop(id: number): void;
  close(): Promise<void>;
}

type OPMConstructor = new () => OfficialOPM;

interface Slot {
  opm: OfficialOPM;
  gain?: GainNode;
  noteId?: number;
  panner?: PannerNode;
}

type OutputRouter = (
  context: AudioContext,
  channel: AudioChannelName,
) => AudioNode;

async function loadOPM(): Promise<OPMConstructor> {
  // The vendored OPM tree is copied unchanged beside compiled output, so a static bundled import would break its processor URL.
  const module = (await import(
    /* @vite-ignore */ new URL(
      '../../../vendor/opm/dist/api/index.js',
      import.meta.url,
    ).href
  )) as {
    OPM: OPMConstructor;
  };
  return module.OPM;
}

/** Eight live AudioContexts/worklets isolate voice stealing at the cost of idle resources; destroy closes them. */
export class OPMAdapter {
  private slots: Slot[] = [];
  private pendingSlots: Slot[] | undefined;
  private unlocking: Promise<void> | undefined;
  private destroyed = false;
  private frozen = false;
  private readonly contextTransitions = new Map<AudioContext, Promise<void>>();
  private contextList: readonly AudioContext[] = [];

  constructor(private readonly output?: OutputRouter) {}

  /** Context-local graphs cannot share native nodes across these eight clocks. */
  get contexts(): readonly AudioContext[] {
    return this.contextList;
  }

  setPaused(paused: boolean): void {
    this.frozen = paused;
    for (const context of this.contexts) this.transitionContext(context);
  }

  private transitionContext(context: AudioContext): void {
    const previous = this.contextTransitions.get(context) ?? Promise.resolve();
    const next = previous
      .catch(() => {})
      .then(async () => {
        if (context.state === 'closed' || this.destroyed) return;
        if (this.frozen) await context.suspend();
        else await context.resume();
      });
    this.contextTransitions.set(context, next);
    void next.catch(() => {});
  }

  static async validateVoice(value: unknown): Promise<OPMVoice> {
    const OPM = await loadOPM();
    const opm = new OPM();
    opm.loadVoice('validated', value);
    return opm.voices.get('validated')!;
  }

  get unlocked(): boolean {
    return !this.destroyed && this.slots.length === audioDefaults.voiceCount;
  }

  get now(): number {
    return performance.now() / 1000;
  }

  get opm(): OfficialOPM | undefined {
    return this.unlocked ? this.slots[0].opm : undefined;
  }

  /** @internal Native PCM shares the first existing context; worklet reset leaves it alive. */
  get sampleContext(): AudioContext | undefined {
    return this.unlocked ? (this.slots[0].opm.context ?? undefined) : undefined;
  }

  unlock(): Promise<void> {
    if (this.destroyed)
      return Promise.reject(new AudioError('Audio adapter has been destroyed'));
    if (this.unlocked) return Promise.resolve();
    if (!this.unlocking) {
      this.unlocking = this.initialize().finally(() => {
        this.unlocking = undefined;
      });
    }
    return this.unlocking;
  }

  private async initialize(): Promise<void> {
    const OPM = await loadOPM();
    if (this.destroyed)
      throw new AudioError('Audio adapter has been destroyed');

    const slots: Slot[] = Array.from(
      { length: audioDefaults.voiceCount },
      () => ({ opm: new OPM() }),
    );
    this.pendingSlots = slots;
    let failed = false;
    try {
      await Promise.all(
        slots.map(async (slot) => {
          try {
            await slot.opm.start();
            if (failed || this.destroyed) {
              this.dispose(slot);
              return;
            }
            const context = slot.opm.context!;
            const node = slot.opm.node!;
            const gain = context.createGain();
            slot.gain = gain;
            node.disconnect();
            node.connect(gain);
            gain.connect(context.destination);
          } catch (error) {
            failed = true;
            for (const pending of slots) this.dispose(pending);
            throw error;
          }
        }),
      );
      if (this.destroyed)
        throw new AudioError('Audio adapter has been destroyed');
      // Publish graphs in slot order, not network/worklet startup completion order.
      for (const slot of slots) {
        const context = slot.opm.context!;
        slot.gain!.disconnect();
        slot.gain!.connect(
          this.output?.(context, 'sfx') ?? context.destination,
        );
      }
      this.slots = slots;
      this.contextList = Object.freeze(slots.map((slot) => slot.opm.context!));
      for (const context of this.contexts) this.transitionContext(context);
    } catch (error) {
      failed = true;
      for (const slot of slots) this.dispose(slot);
      this.slots = [];
      this.contextList = [];
      throw error;
    } finally {
      this.pendingSlots = undefined;
    }
  }

  play(
    slot: number,
    voice: OPMVoice,
    note: number,
    delay: number,
    duration: number,
    gain: number,
    bus: AudioChannelName = 'sfx',
    spatial?: Required<SpatialAudioOptions>,
  ): void {
    const channel = this.getSlot(slot);
    channel.gain!.gain.value = gain;
    channel.gain!.disconnect();
    channel.panner?.disconnect();
    channel.panner = undefined;
    const output =
      this.output?.(channel.opm.context!, bus) ??
      channel.opm.context!.destination;
    if (spatial) {
      const panner = channel.opm.context!.createPanner();
      applyPannerOptions(panner, spatial);
      channel.gain!.connect(panner);
      panner.connect(output);
      channel.panner = panner;
    } else channel.gain!.connect(output);
    channel.noteId = channel.opm.playNote({
      voice,
      note,
      time: delay,
      duration,
    });
  }

  stop(slot: number): void {
    const channel = this.getSlot(slot);
    if (channel.noteId !== undefined) {
      channel.opm.stop(channel.noteId);
      channel.noteId = undefined;
    }
  }

  setPosition(slot: number, position: Readonly<AudioVec3>): void {
    const panner = this.getSlot(slot).panner;
    if (!panner) return;
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;
  }

  reset(slot: number): void {
    const channel = this.getSlot(slot);
    const context = channel.opm.context!;
    const node = channel.opm.node;
    // Replacing the worklet discards both queued notes and releasing voices in this slot.
    const replacement = new AudioWorkletNode(context, 'opm-processor', {
      outputChannelCount: [2],
    });
    try {
      node?.disconnect();
      node?.port.close();
      channel.opm.node = null;
      channel.noteId = undefined;
      replacement.connect(channel.gain!);
      channel.opm.node = replacement;
    } catch (error) {
      replacement.disconnect();
      replacement.port.close();
      throw error;
    }
  }

  setGain(slot: number, value: number): void {
    this.getSlot(slot).gain!.gain.value = value;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const slot of this.slots) this.dispose(slot);
    for (const slot of this.pendingSlots ?? []) this.dispose(slot);
    this.slots = [];
    this.contextList = [];
    this.pendingSlots = undefined;
    this.contextTransitions.clear();
  }

  private getSlot(index: number): Slot {
    if (!this.unlocked) throw new AudioError('Unlock audio before playing');
    if (!Number.isInteger(index) || index < 0 || index >= this.slots.length) {
      throw new AudioError(`Invalid audio slot: ${index}`);
    }
    return this.slots[index];
  }

  private dispose(slot: Slot): void {
    const node = slot.opm.node;
    slot.opm.node = null;
    if (node) {
      try {
        node.disconnect();
      } catch {
        /* Already disconnected or closed. */
      }
      try {
        node.port.close();
      } catch {
        /* Already closed. */
      }
    }
    if (slot.gain) {
      try {
        slot.gain.disconnect();
      } catch {
        /* Already disconnected or closed. */
      }
      slot.gain = undefined;
    }
    slot.panner?.disconnect();
    slot.panner = undefined;
    slot.noteId = undefined;
    const context = slot.opm.context;
    slot.opm.context = null;
    if (context) {
      try {
        void context.close().catch(() => {});
      } catch {
        /* Context already closed. */
      }
    }
  }
}
