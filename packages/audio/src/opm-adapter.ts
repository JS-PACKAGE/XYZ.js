import { audioDefaults } from '../../../src/data/audio.js';
import { opmVendor } from '../../../src/data/opm.js';
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

type OPMConstructor = new (options?: {
  context?: AudioContext;
  destination?: AudioNode | null;
}) => NativeOPM;

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

/**
 * Validates an alternative official OPM `dist/api/index.js` URL, such as a version-pinned
 * CDN copy: HTTPS, or HTTP(S) on the page's own origin, without credentials or a fragment.
 */
export function resolveOPMModuleURL(input: string | URL): string {
  let url: URL;
  try {
    const base =
      (typeof document !== 'undefined' ? document.baseURI : undefined) ??
      (typeof location !== 'undefined' ? location.href : undefined);
    url = new URL(input, base);
  } catch (cause) {
    throw new AudioError('opmModuleUrl is not a valid URL.', { cause });
  }
  const sameOrigin =
    typeof location !== 'undefined' && url.origin === location.origin;
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && sameOrigin)) ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new AudioError(
      'opmModuleUrl must be an HTTPS (or same-origin HTTP) module URL without credentials or a fragment.',
    );
  return url.href;
}

async function loadOPM(moduleUrl?: string): Promise<OPMConstructor> {
  // The vendored OPM tree is copied unchanged beside compiled output, so a static bundled import
  // would break its processor URL. A configured module resolves its worklet beside itself.
  const module = (await import(
    /* @vite-ignore */ moduleUrl ??
      new URL('../../../vendor/opm/dist/api/index.js', import.meta.url).href
  )) as {
    OPM?: OPMConstructor;
    VERSION?: unknown;
  };
  // Only the vendored version's API and voice schema are supported; a CDN cannot be hash-checked.
  if (module.VERSION !== opmVendor.version || typeof module.OPM !== 'function')
    throw new AudioError(
      `OPM module reports version ${String(module.VERSION)}; XYZ.js requires official OPM.js ${opmVendor.version}.`,
    );
  return module.OPM;
}

async function validateWith(
  OPM: OPMConstructor,
  value: unknown,
): Promise<OPMVoice> {
  const opm = new OPM();
  opm.loadVoice('validated', value);
  return engineVoice(opm.voices.get('validated')!);
}

/**
 * Eight OPM instances isolate voice stealing per slot and share one AudioContext. AudioManager
 * lends its own context; a standalone adapter creates one and closes it on destroy.
 */
export class OPMAdapter {
  private slots: Slot[] = [];
  private pendingSlots: Slot[] | undefined;
  private unlocking: Promise<void> | undefined;
  private destroyed = false;
  private frozen = false;
  private contextList: readonly AudioContext[] = [];
  private owned: AudioContext | undefined;
  private lent: (() => AudioContext | undefined) | undefined;
  private moduleUrl: string | undefined;

  constructor(private readonly output?: OutputRouter) {}

  /** @internal AudioManager lends its context; the adapter never suspends or closes it. */
  lendContext(context: () => AudioContext | undefined): void {
    this.lent = context;
  }

  /** @internal A URL from {@link resolveOPMModuleURL}, used instead of the vendored copy. */
  useModule(url: string): void {
    this.moduleUrl = url;
  }

  /** The single native context shared by every slot, once unlocked. */
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
    return validateWith(await loadOPM(), value);
  }

  /** @internal Validates through the configured module, like {@link validateVoice}. */
  async validate(value: unknown): Promise<OPMVoice> {
    return validateWith(await loadOPM(this.moduleUrl), value);
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

  /** @internal The shared slot context; AudioManager hands samples its own context instead. */
  get sampleContext(): AudioContext | undefined {
    return this.contextList[0];
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
    const OPM = await loadOPM(this.moduleUrl);
    if (this.destroyed)
      throw new AudioError('Audio adapter has been destroyed');

    const slots: Slot[] = [];
    this.pendingSlots = slots;
    let owned: AudioContext | undefined;
    let failed = false;
    try {
      let context = this.lent?.();
      if (this.lent && (!context || context.state === 'closed'))
        throw new AudioError('The lent AudioContext is unavailable.');
      if (!context) {
        owned = new AudioContext();
        this.owned = owned;
        context = owned;
      }
      const shared = context;
      // Borrowed: OPM never closes it, and nothing reaches the destination before routing.
      for (let index = 0; index < audioDefaults.voiceCount; index++)
        slots.push({ opm: new OPM({ context: shared, destination: null }) });
      await Promise.all(
        slots.map(async (slot) => {
          try {
            await slot.opm.start();
            if (failed || this.destroyed) {
              this.dispose(slot);
              return;
            }
            const gain = shared.createGain();
            slot.gain = gain;
            slot.opm.node!.connect(gain);
          } catch (error) {
            failed = true;
            for (const pending of slots) this.dispose(pending);
            throw error;
          }
        }),
      );
      if (this.destroyed)
        throw new AudioError('Audio adapter has been destroyed');
      // Route only after every slot started, so a failed unlock never produced sound.
      for (const slot of slots)
        slot.gain!.connect(this.output?.(shared, 'sfx') ?? shared.destination);
      this.slots = slots;
      this.contextList = Object.freeze([shared]);
      // OPM start resumes its context; only an owned context follows the adapter's pause state.
      if (owned) await this.setPaused(this.frozen);
      if (this.destroyed)
        throw new AudioError('Audio adapter has been destroyed');
    } catch (error) {
      failed = true;
      this.release();
      for (const slot of slots) this.dispose(slot);
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

  /** @internal Drops every slot (closing only an owned context); a later unlock starts afresh. */
  release(): void {
    for (const slot of this.slots) this.dispose(slot);
    this.slots = [];
    this.contextList = [];
    const owned = this.owned;
    this.owned = undefined;
    if (owned && owned.state !== 'closed') void owned.close().catch(() => {});
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const slot of this.pendingSlots ?? []) this.dispose(slot);
    this.pendingSlots = undefined;
    this.release();
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
    // OPM owns its processor port and pending commands; contexts are only borrowed.
  }
}
