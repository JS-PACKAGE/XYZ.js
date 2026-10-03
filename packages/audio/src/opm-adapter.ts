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

interface NativeVoice extends Omit<OPMVoice, 'version'> {
  version: 7;
}

interface NativeOPM extends Omit<OfficialOPM, 'voices' | 'playNote'> {
  voices: ReadonlyMap<string, NativeVoice>;
  playNote(options: {
    voice?: string | OPMVoice | NativeVoice;
    note: number;
    time?: number;
    duration: number;
  }): number;
  panic(): number;
  dispose(): Promise<void>;
}

type OPMConstructor = new () => NativeOPM;

// Keep the published engine schema while retaining all upstream expressive fields.
const normalizedVoices = new WeakMap<OPMVoice, NativeVoice>();

function engineVoice(voice: NativeVoice): OPMVoice {
  const result: OPMVoice = {
    ...voice,
    version: 1,
    ops: voice.ops.map((op) => ({
      ...op,
      adsr: { ...op.adsr },
    })) as OPMVoice['ops'],
    lfo: voice.lfo ? { ...voice.lfo } : undefined,
  };
  normalizedVoices.set(result, { ...result, version: 7 });
  return result;
}

function nativeVoice(voice: OPMVoice): OPMVoice | NativeVoice {
  const normalized = normalizedVoices.get(voice);
  if (!normalized) return voice;
  // Assets are frozen; mutable escape-hatch patches must retain caller edits.
  return Object.isFrozen(voice) ? normalized : { ...voice, version: 7 };
}

/** User-approved 1.x escape-hatch compatibility; vendor instances stay untouched. */
function legacyOPM(native: NativeOPM): OfficialOPM {
  const voices = new Map(
    [...native.voices].map(([name, voice]) => [name, engineVoice(voice)]),
  );
  return {
    get context() {
      return native.context;
    },
    set context(value) {
      native.context = value;
    },
    get node() {
      return native.node;
    },
    set node(value) {
      native.node = value;
    },
    voices,
    loadVoice(name, voice) {
      native.loadVoice(
        name,
        typeof voice === 'object' &&
          voice !== null &&
          normalizedVoices.has(voice as OPMVoice)
          ? nativeVoice(voice as OPMVoice)
          : voice,
      );
      voices.set(name, engineVoice(native.voices.get(name)!));
    },
    start: () => native.start(),
    playNote(options) {
      const voice =
        typeof options.voice === 'string'
          ? voices.get(options.voice)
          : options.voice;
      if (typeof options.voice === 'string' && !voice)
        throw new AudioError(`Unknown voice: ${options.voice}`);
      return native.playNote({
        ...options,
        voice: voice ? nativeVoice(voice) : undefined,
      });
    },
    stop: (id) => {
      native.stop(id);
    },
    close: () => native.close(),
  };
}

interface Slot {
  opm: NativeOPM;
  legacy?: OfficialOPM;
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
  private contextList: readonly AudioContext[] = [];

  constructor(private readonly output?: OutputRouter) {}

  /** Context-local graphs cannot share native nodes across these eight clocks. */
  get contexts(): readonly AudioContext[] {
    return this.contextList;
  }

  /** Native calls happen in the caller's turn, including a trusted resume gesture. */
  async setPaused(paused: boolean): Promise<void> {
    this.frozen = paused;
    await Promise.all(
      this.contexts.map((context) => {
        if (context.state === 'closed' || this.destroyed) return;
        return paused ? context.suspend() : context.resume();
      }),
    );
  }

  static async validateVoice(value: unknown): Promise<OPMVoice> {
    const OPM = await loadOPM();
    const opm = new OPM();
    opm.loadVoice('validated', value);
    return engineVoice(opm.voices.get('validated')!);
  }

  get unlocked(): boolean {
    return !this.destroyed && this.slots.length === audioDefaults.voiceCount;
  }

  get now(): number {
    return performance.now() / 1000;
  }

  get opm(): OfficialOPM | undefined {
    if (!this.unlocked) return undefined;
    const slot = this.slots[0];
    return (slot.legacy ??= legacyOPM(slot.opm));
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
      await this.setPaused(this.frozen);
      if (this.destroyed)
        throw new AudioError('Audio adapter has been destroyed');
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
      voice: nativeVoice(voice),
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
    // Official panic discards queued notes and release tails without replacing its managed node.
    channel.opm.panic();
    channel.noteId = undefined;
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
  }

  private getSlot(index: number): Slot {
    if (!this.unlocked) throw new AudioError('Unlock audio before playing');
    if (!Number.isInteger(index) || index < 0 || index >= this.slots.length) {
      throw new AudioError(`Invalid audio slot: ${index}`);
    }
    return this.slots[index];
  }

  private dispose(slot: Slot): void {
    void slot.opm.dispose().catch(() => {});
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
    // OPM owns its context, processor port and pending command lifecycle.
  }
}
