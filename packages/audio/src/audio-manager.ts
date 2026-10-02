import { audioDefaults } from '../../../src/data/audio.js';
import type { Scene } from '../../core/src/scene.js';
import { AudioError } from './errors.js';
import { OPMAdapter, type OPMVoice } from './opm-adapter.js';
import { assetLimits } from '../../../src/data/assets.js';
import { readResponse } from '../../assets/src/read-response.js';
import { subscribeLoad } from '../../assets/src/preload/subscribe-load.js';
import type { LoadTask } from '../../assets/src/preload/preload-batch.js';
import {
  SampleAudioEngine,
  type SampleAudioAsset,
} from './samples/sample-audio.js';
import {
  checkSpatialOptions,
  validateVec3,
  type AudioListenerState,
  type SpatialAudioOptions,
  type AudioVec3,
} from './samples/spatial.js';
import {
  AudioMixer,
  type AudioDuckingRule,
  type AudioActivity,
} from './mixer.js';
import { PreparedAudioImpulse, type AudioEffect } from './effects.js';
import type { GainCurve } from './gain-timeline.js';
import type { Object3D } from '../../core/src/object3d.js';
import {
  AudioTransformBinding,
  type SpatialAudioPlayback,
} from './bindings.js';
import type { AudioStream, AudioStreamOptions } from './samples/stream.js';

export type AudioChannelName = 'music' | 'sfx' | 'ui';
export interface AudioNote {
  readonly note: number;
  readonly time: number;
  readonly duration: number;
}

export interface AudioPlayOptions {
  channel?: AudioChannelName;
  scene?: Scene;
  persistent?: boolean;
  loop?: boolean;
  spatial?: SpatialAudioOptions;
}

/** A gain control shared by every playing voice in its channel. */
export class AudioChannel {
  private level = 1;

  constructor(
    readonly name: AudioChannelName | 'master',
    private readonly refresh: () => void,
    private readonly mixer?: AudioMixer,
  ) {}

  get volume(): number {
    return this.level;
  }

  set volume(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new AudioError('Audio volume must be finite and within 0..1.');
    this.level = value;
    this.refresh();
  }

  get effects(): readonly AudioEffect[] {
    return this.mixer?.getEffects(this.name) ?? [];
  }
  setEffects(effects: readonly AudioEffect[]): void {
    if (!this.mixer)
      throw new AudioError('Channel is not attached to an audio manager.');
    this.mixer.setEffects(this.name, effects);
  }
  /** Absolute manager AudioContext time; all independent contexts receive mapped schedules. */
  automate(
    value: number,
    time: number,
    duration = 0,
    curve: GainCurve = 'linear',
  ): void {
    if (!this.mixer)
      throw new AudioError('Channel is not attached to an audio manager.');
    this.mixer.automate(this.name, value, time, duration, curve);
  }
  cancelAutomation(time?: number): number {
    if (!this.mixer)
      throw new AudioError('Channel is not attached to an audio manager.');
    return this.mixer.cancelAutomation(this.name, time);
  }
  analyser(contextIndex = 0): AnalyserNode | undefined {
    return this.mixer?.analyser(this.name, contextIndex);
  }
}

/** Loaded voice and note data are immutable; only playback defaults may change. */
export class AudioAsset {
  loop: boolean;
  persistent = false;
  /** @internal Reservation expiry includes the longest operator release. */
  readonly releaseTime: number;

  constructor(
    private readonly manager: AudioManager,
    readonly voice: OPMVoice,
    readonly notes: readonly AudioNote[],
    readonly duration: number,
    readonly channel: AudioChannelName,
    loop: boolean,
  ) {
    this.loop = loop;
    let release = 0;
    for (const op of voice.ops) release = Math.max(release, op.adsr.r);
    this.releaseTime = release + audioDefaults.releaseGuard;
  }

  play(options?: AudioPlayOptions): AudioPlayback {
    return this.manager.play(this, options);
  }

  stop(): void {
    this.manager.stopAsset(this);
  }

  /** @internal */
  belongsTo(manager: AudioManager): boolean {
    return this.manager === manager;
  }
}

export class AudioPlayback {
  private status: 'playing' | 'stopped' | 'ended' = 'playing';

  constructor(
    private readonly manager: AudioManager,
    private spatial?: Required<SpatialAudioOptions>,
  ) {}

  get position3D(): Readonly<AudioVec3> | undefined {
    return this.spatial?.position;
  }
  set position3D(value: Readonly<AudioVec3> | undefined) {
    if (!this.spatial || !value)
      throw new AudioError('Playback was not created with spatial options.');
    validateVec3(value, 'Spatial position');
    this.spatial.position.x = value.x;
    this.spatial.position.y = value.y;
    this.spatial.position.z = value.z;
    this.manager.movePlayback(this, this.spatial.position);
  }
  /** @internal */
  get spatialOptions(): Required<SpatialAudioOptions> | undefined {
    return this.spatial;
  }

  get state(): 'playing' | 'stopped' | 'ended' {
    return this.status;
  }

  stop(): void {
    this.manager.stopPlayback(this);
  }

  /** @internal */
  finish(state: 'stopped' | 'ended'): void {
    this.status = state;
  }
}

interface PlaybackRecord {
  readonly playback: AudioPlayback;
  readonly asset: AudioAsset;
  readonly channel: AudioChannelName;
  scene: Scene | undefined;
  readonly persistent: boolean;
  readonly loop: boolean;
  readonly startedAt: number;
  cycle: number;
  index: number;
}

interface ReservedSlot {
  playback: AudioPlayback;
  channel: AudioChannelName;
  scene: Scene | undefined;
  persistent: boolean;
  startedAt: number;
  until: number;
  sequence: number;
  activity: AudioActivity;
}

interface CachedAudio {
  promise: Promise<AudioAsset>;
  controller: AbortController;
}

const VOICE_COUNT = audioDefaults.voiceCount;
const LOOKAHEAD = audioDefaults.lookahead;
const TICK_MS = audioDefaults.tickMs;
const CHANNEL_ORDER = ['music', 'ui', 'sfx'] as const;

/** Schedules a bounded lookahead; each slot owns an independent OPM voice. */
export class AudioManager {
  private readonly mixer = new AudioMixer();
  readonly master = new AudioChannel(
    'master',
    () => this.mixer.setGain('master', this.master.volume),
    this.mixer,
  );
  readonly music = new AudioChannel(
    'music',
    () => this.mixer.setGain('music', this.music.volume),
    this.mixer,
  );
  readonly sfx = new AudioChannel(
    'sfx',
    () => this.mixer.setGain('sfx', this.sfx.volume),
    this.mixer,
  );
  readonly ui = new AudioChannel(
    'ui',
    () => this.mixer.setGain('ui', this.ui.volume),
    this.mixer,
  );
  private readonly bindings = new Set<AudioTransformBinding>();
  private listenerBinding?: AudioTransformBinding;

  private readonly adapter: OPMAdapter;
  private readonly samples: SampleAudioEngine;
  private readonly cache = new Map<string, CachedAudio>();
  private readonly playbacks = new Map<AudioPlayback, PlaybackRecord>();
  private readonly slots: (ReservedSlot | undefined)[] =
    Array(VOICE_COUNT).fill(undefined);
  private timer: number | undefined;
  private disposed = false;
  private sequence = 0;
  private readonly pauseReasons = new Set<string>();
  private pausedAt: number | undefined;
  private pausedTotal = 0;

  constructor(
    private readonly getScene: () => Scene | undefined,
    private readonly onError: (error: Error) => void,
  ) {
    this.adapter = new OPMAdapter((context, channel) =>
      this.mixer.input(context, channel),
    );
    this.samples = new SampleAudioEngine({
      context: () => this.adapter.sampleContext,
      scene: this.getScene,
      bus: (context, channel) => this.mixer.input(context, channel),
      activity: (channel, delay) => this.mixer.acquire(channel, delay),
      contexts: () => this.adapter.contexts,
      report: (error) => this.report(error),
    });
  }

  /** Manager-wide 3D listener used by playbacks created with `spatial` options. */
  get listener(): AudioListenerState {
    return this.samples.listener;
  }

  get unlocked(): boolean {
    return this.adapter.unlocked;
  }

  /** True while at least one pause reason is active (see {@link pause}). */
  get paused(): boolean {
    return this.pauseReasons.size > 0;
  }

  /** Clock used by channel gain automation; frozen while the native contexts are paused. */
  get currentTime(): number {
    return this.mixer.currentTime;
  }
  get audioContextCount(): number {
    return this.mixer.contextCount;
  }
  prepareImpulse(buffer: AudioBuffer): PreparedAudioImpulse {
    return new PreparedAudioImpulse(buffer);
  }
  setDucking(rules: readonly AudioDuckingRule[]): void {
    this.mixer.setDucking(rules);
  }
  acquireActivity(channel: AudioChannelName): AudioActivity {
    return this.mixer.acquire(channel);
  }
  bindListener(object: Object3D): AudioTransformBinding {
    const binding = new AudioTransformBinding(
      object,
      this.listener,
      true,
      (value) => {
        this.bindings.delete(value);
        if (this.listenerBinding === value) this.listenerBinding = undefined;
      },
    );
    this.listenerBinding?.unbind();
    this.listenerBinding = binding;
    this.bindings.add(binding);
    return binding;
  }
  bindEmitter(
    object: Object3D,
    playback: SpatialAudioPlayback,
  ): AudioTransformBinding {
    const binding = new AudioTransformBinding(
      object,
      playback,
      false,
      (value) => this.bindings.delete(value),
    );
    this.bindings.add(binding);
    return binding;
  }
  /** Game calls after Scene updates, independently of renderer/backend. */
  updateBindings(): void {
    for (const binding of this.bindings) binding.update();
  }
  /** @internal */
  movePlayback(playback: AudioPlayback, position: Readonly<AudioVec3>): void {
    for (let slot = 0; slot < VOICE_COUNT; slot++)
      if (this.slots[slot]?.playback === playback)
        this.adapter.setPosition(slot, position);
  }

  /**
   * Freezes audio under a named reason (default `user`); it stays frozen until every reason has
   * been {@link resume}d. OPM tracks stop sounding and their timeline stops, then continue at the
   * next note; a note that was sounding when paused is not replayed. Sample and stream playbacks
   * pause at their current position and resume together, and playbacks started while paused wait
   * for the resume.
   */
  pause(reason = 'user'): void {
    if (this.disposed) return;
    this.pauseReasons.add(reason);
    if (this.pausedAt !== undefined) return;
    this.pausedAt = this.adapter.now;
    for (let slot = 0; slot < VOICE_COUNT; slot++) {
      if (!this.slots[slot]) continue;
      try {
        this.adapter.reset(slot);
      } catch (error) {
        this.report(error);
      }
      this.slots[slot]?.activity.release();
      this.slots[slot] = undefined;
    }
    this.samples.suspend();
    void this.adapter
      .setPaused(true)
      .catch((error: unknown) => this.report(error));
  }

  resume(reason = 'user'): void {
    if (this.disposed || !this.pauseReasons.delete(reason)) return;
    if (this.pauseReasons.size > 0 || this.pausedAt === undefined) return;
    this.pausedTotal += this.adapter.now - this.pausedAt;
    this.pausedAt = undefined;
    this.samples.resume();
    void this.adapter
      .setPaused(false)
      .catch((error: unknown) => this.report(error));
    this.tick();
  }

  /** Audio-timeline seconds: wall time minus every paused interval. */
  private clock(): number {
    return (this.pausedAt ?? this.adapter.now) - this.pausedTotal;
  }

  get opm(): OPMAdapter['opm'] {
    return this.adapter.opm;
  }

  async unlock(): Promise<void> {
    if (this.disposed) throw new AudioError('AudioManager has been destroyed.');
    try {
      await this.adapter.unlock();
      if (this.disposed)
        throw new AudioError('AudioManager has been destroyed.');
      this.listener.apply();
      if (this.paused) await this.adapter.setPaused(true);
    } catch (error) {
      if (!this.adapter.unlocked) this.mixer.clearContexts();
      if (error instanceof AudioError) throw error;
      throw new AudioError('Unable to unlock audio.', { cause: error });
    }
  }

  /** Subscriber cancellation does not abort another caller's loader-owned cache request. */
  load(
    url: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<AudioAsset> {
    if (options.signal?.aborted) return Promise.reject(options.signal.reason);
    if (this.disposed)
      return Promise.reject(new AudioError('AudioManager has been destroyed.'));
    let canonical: string;
    try {
      const base =
        (typeof document !== 'undefined' ? document.baseURI : undefined) ??
        (typeof location !== 'undefined' ? location.href : undefined);
      const resolved = new URL(url, base);
      if (!['http:', 'https:', 'data:', 'blob:'].includes(resolved.protocol))
        throw new AudioError('Unsupported audio URL protocol.');
      resolved.hash = '';
      canonical = resolved.href;
    } catch (error) {
      return Promise.reject(
        new AudioError('Invalid audio URL.', { cause: error }),
      );
    }
    const cached = this.cache.get(canonical);
    if (cached) return subscribeLoad(cached.promise, options.signal);

    const controller = new AbortController();
    let cancel!: () => void;
    const cancellation = new Promise<never>((_, reject) => {
      cancel = () =>
        reject(
          new AudioError('AudioManager was destroyed while loading audio.'),
        );
    });
    controller.signal.addEventListener('abort', cancel, { once: true });
    const operation = this.fetchAudio(canonical, controller.signal);
    const entry: CachedAudio = {
      controller,
      promise: Promise.race([operation, cancellation])
        .then(
          (asset) => {
            if (this.disposed)
              throw new AudioError(
                'AudioManager was destroyed while loading audio.',
              );
            return asset;
          },
          (error: unknown) => {
            if (this.cache.get(canonical) === entry)
              this.cache.delete(canonical);
            throw error;
          },
        )
        .finally(() => controller.signal.removeEventListener('abort', cancel)),
    };
    this.cache.set(canonical, entry);
    return subscribeLoad(entry.promise, options.signal);
  }

  opmTask(key: string, url: string): LoadTask<AudioAsset> {
    return { key, load: (signal) => this.load(url, { signal }) };
  }

  loadSample(
    url: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<SampleAudioAsset> {
    return this.samples.load(url, options);
  }

  /** Streams a long file without decoding it; see {@link AudioStream}. */
  stream(url: string, options: AudioStreamOptions = {}): Promise<AudioStream> {
    return this.samples.stream(url, options);
  }

  sampleTask(key: string, url: string): LoadTask<SampleAudioAsset> {
    return { key, load: (signal) => this.loadSample(url, { signal }) };
  }

  play(asset: AudioAsset, options: AudioPlayOptions = {}): AudioPlayback {
    if (this.disposed) throw new AudioError('AudioManager has been destroyed.');
    if (!asset.belongsTo(this))
      throw new AudioError('Audio asset belongs to another manager.');
    if (!this.unlocked)
      throw new AudioError(
        'Audio must be unlocked from a user gesture before playback.',
      );
    const channel = options.channel ?? asset.channel;
    if (channel !== 'music' && channel !== 'sfx' && channel !== 'ui')
      throw new AudioError('Unknown audio channel.');
    const scene = options.scene ?? this.getScene();
    if (scene?.destroyed)
      throw new AudioError('Cannot play audio in a destroyed Scene.');
    const playback = new AudioPlayback(
      this,
      options.spatial && checkSpatialOptions(options.spatial),
    );
    this.playbacks.set(playback, {
      playback,
      asset,
      channel,
      scene,
      persistent: options.persistent ?? asset.persistent,
      loop: options.loop ?? asset.loop,
      startedAt: this.clock(),
      cycle: 0,
      index: 0,
    });
    this.tick();
    if (!this.timer && (this.playbacks.size > 0 || this.slots.some(Boolean)))
      this.timer = setInterval(() => this.tick(), TICK_MS);
    return playback;
  }

  stopScene(scene: Scene): void {
    this.samples.stopScene(scene);
    for (const binding of this.bindings)
      if (binding.scene === scene) binding.unbind();
    for (const record of this.playbacks.values()) {
      if (record.scene !== scene) continue;
      if (record.persistent) record.scene = undefined;
      else this.stopPlayback(record.playback, true);
    }
    // A manually stopped note may still be releasing after its playback left the map.
    for (let slot = 0; slot < VOICE_COUNT; slot++) {
      const reservation = this.slots[slot];
      if (reservation?.scene !== scene || reservation.persistent) continue;
      try {
        this.adapter.reset(slot);
      } catch (error) {
        this.report(error);
      }
      reservation.activity.release();
      this.slots[slot] = undefined;
    }
    this.stopIdleTimer();
  }

  /** @internal */
  stopAsset(asset: AudioAsset): void {
    for (const record of this.playbacks.values())
      if (record.asset === asset) this.stopPlayback(record.playback);
  }

  /** @internal Scene teardown resets queued events, whereas manual stop retains the audible release. */
  stopPlayback(playback: AudioPlayback, immediate = false): void {
    const record = this.playbacks.get(playback);
    if (!record) return;
    this.playbacks.delete(playback);
    playback.finish('stopped');
    const now = this.clock();
    for (let slot = 0; slot < VOICE_COUNT; slot++) {
      const reservation = this.slots[slot];
      if (reservation?.playback !== playback) continue;
      try {
        if (immediate) {
          this.adapter.reset(slot);
          reservation.activity.release();
          this.slots[slot] = undefined;
        } else {
          this.adapter.stop(slot);
          // A queued note was canceled; an active voice still needs its release interval.
          if (reservation.startedAt > now) {
            reservation.activity.release();
            this.slots[slot] = undefined;
          } else {
            reservation.until = Math.min(
              reservation.until,
              now + record.asset.releaseTime,
            );
            reservation.activity.release(record.asset.releaseTime);
          }
        }
      } catch (error) {
        reservation.activity.release();
        this.slots[slot] = undefined;
        this.report(error);
      }
    }
    this.stopIdleTimer();
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    clearInterval(this.timer);
    this.timer = undefined;
    for (const binding of this.bindings) binding.unbind();
    this.bindings.clear();
    this.listenerBinding = undefined;
    this.samples.destroy();
    for (const entry of this.cache.values()) entry.controller.abort();
    this.cache.clear();
    for (const playback of this.playbacks.keys()) playback.finish('stopped');
    this.playbacks.clear();
    this.slots.fill(undefined);
    this.adapter.destroy();
    this.mixer.destroy();
  }

  private async fetchAudio(
    url: string,
    signal: AbortSignal,
  ): Promise<AudioAsset> {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok)
        throw new AudioError(`Audio request failed (HTTP ${response.status}).`);
      const blob = await readResponse(response, assetLimits.audioBytes, signal);
      signal.throwIfAborted();
      const data: unknown = JSON.parse(await blob.text());
      if (this.disposed)
        throw new AudioError('AudioManager was destroyed while loading audio.');
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new AudioError('Audio must be a JSON object.');
      const input = data as Record<string, unknown>;
      if (!Array.isArray(input.notes) || input.notes.length === 0)
        throw new AudioError('Audio notes must be a nonempty array.');
      if (input.notes.length > assetLimits.audioNotes)
        throw new AudioError('Audio exceeds the note count resource budget.');
      const notes: AudioNote[] = input.notes.map((value: unknown) => {
        if (!value || typeof value !== 'object' || Array.isArray(value))
          throw new AudioError('Invalid audio note.');
        const note = value as Record<string, unknown>;
        if (
          typeof note.note !== 'number' ||
          !Number.isInteger(note.note) ||
          note.note < 0 ||
          note.note > 127 ||
          typeof note.time !== 'number' ||
          !Number.isFinite(note.time) ||
          note.time < 0 ||
          typeof note.duration !== 'number' ||
          !Number.isFinite(note.duration) ||
          note.duration <= 0 ||
          note.duration > 60
        )
          throw new AudioError(
            'Invalid audio note: expected MIDI 0..127, time >= 0, duration in (0, 60].',
          );
        return { note: note.note, time: note.time, duration: note.duration };
      });
      notes.sort((a, b) => a.time - b.time);
      let end = 0;
      for (const note of notes) end = Math.max(end, note.time + note.duration);
      const duration = input.duration === undefined ? end : input.duration;
      if (
        typeof duration !== 'number' ||
        !Number.isFinite(duration) ||
        duration < end
      )
        throw new AudioError(
          'Audio loop duration must contain every note and be positive.',
        );
      if (
        input.channel !== undefined &&
        input.channel !== 'music' &&
        input.channel !== 'sfx' &&
        input.channel !== 'ui'
      )
        throw new AudioError('Unknown audio channel.');
      if (input.loop !== undefined && typeof input.loop !== 'boolean')
        throw new AudioError('Audio loop must be a boolean.');
      const voice = await OPMAdapter.validateVoice(input.voice);
      if (this.disposed)
        throw new AudioError('AudioManager was destroyed while loading audio.');
      for (const note of notes) Object.freeze(note);
      Object.freeze(notes);
      for (const op of voice.ops) {
        Object.freeze(op.adsr);
        Object.freeze(op);
      }
      Object.freeze(voice.ops);
      if (voice.lfo) Object.freeze(voice.lfo);
      Object.freeze(voice);
      return new AudioAsset(
        this,
        voice,
        notes,
        duration,
        (input.channel as AudioChannelName | undefined) ?? 'sfx',
        input.loop === true,
      );
    } catch (error) {
      if (error instanceof AudioError) throw error;
      throw new AudioError('Unable to load audio.', { cause: error });
    }
  }

  private tick(): void {
    if (this.disposed || this.pausedAt !== undefined) return;
    const now = this.clock();
    for (let slot = 0; slot < VOICE_COUNT; slot++) {
      const reservation = this.slots[slot];
      if (reservation && reservation.until <= now) {
        reservation.activity.release();
        this.slots[slot] = undefined;
      }
    }
    // Reserve music/UI first; only a playing or releasing SFX may be stolen.
    for (const channel of CHANNEL_ORDER) {
      for (const record of this.playbacks.values()) {
        if (record.channel !== channel) continue;
        try {
          this.schedule(record, now);
        } catch (error) {
          this.stopPlayback(record.playback, true);
          this.report(error);
        }
      }
    }
    for (const record of this.playbacks.values()) {
      if (record.loop || record.index < record.asset.notes.length) continue;
      if (this.slots.some((slot) => slot?.playback === record.playback))
        continue;
      this.playbacks.delete(record.playback);
      record.playback.finish('ended');
    }
    this.stopIdleTimer();
  }

  private schedule(record: PlaybackRecord, now: number): void {
    const notes = record.asset.notes;
    const period = record.asset.duration;
    const elapsed = now - record.startedAt;
    if (record.loop && elapsed >= period) {
      // A throttled timer resumes at the current loop, not at every missed cycle.
      const currentCycle = Math.floor(elapsed / period);
      if (record.cycle < currentCycle) {
        record.cycle = currentCycle;
        record.index = 0;
      }
    }
    // Skip stale notes in logarithmic time even for long, non-looping tracks.
    const cutoff = elapsed - record.cycle * period - LOOKAHEAD;
    if (cutoff > 0) {
      let low = record.index;
      let high = notes.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (notes[middle].time < cutoff) low = middle + 1;
        else high = middle;
      }
      record.index = low;
    }
    // Eight reserved worklets permit only a small, bounded amount of scheduling per tick,
    // even if a malformed or very short loop period spans many cycles in the lookahead.
    for (let examined = 0; examined < VOICE_COUNT * 2; examined++) {
      if (record.index === notes.length) {
        if (!record.loop) break;
        record.cycle++;
        record.index = 0;
      }
      const note = notes[record.index];
      const startsAt = record.startedAt + record.cycle * period + note.time;
      if (startsAt > now + LOOKAHEAD) break;
      record.index++;
      if (startsAt + note.duration <= now || startsAt < now - LOOKAHEAD)
        continue;
      const remaining = note.duration - Math.max(0, now - startsAt);
      const slot = this.reserve(record, startsAt, now, remaining);
      if (slot === undefined) continue; // Saturation skips this note, never the track's future notes.
      const delay = Math.max(0, startsAt - now);
      this.adapter.play(
        slot,
        record.asset.voice,
        note.note,
        delay,
        remaining,
        1,
        record.channel,
        record.playback.spatialOptions,
      );
    }
  }

  private reserve(
    record: PlaybackRecord,
    startsAt: number,
    now: number,
    duration: number,
  ): number | undefined {
    let slot = this.slots.findIndex((entry) => !entry);
    if (slot < 0) {
      // Never steal a music/UI voice, including its release tail.
      let oldest: ReservedSlot | undefined;
      for (let index = 0; index < VOICE_COUNT; index++) {
        const entry = this.slots[index];
        if (entry?.channel !== 'sfx') continue;
        if (!oldest || entry.sequence < oldest.sequence) {
          oldest = entry;
          slot = index;
        }
      }
      if (!oldest) return undefined;
      oldest.activity.release();
      this.adapter.reset(slot);
    }
    this.slots[slot] = {
      playback: record.playback,
      scene: record.scene,
      persistent: record.persistent,
      channel: record.channel,
      startedAt: startsAt,
      until: Math.max(now, startsAt) + duration + record.asset.releaseTime,
      sequence: ++this.sequence,
      activity: this.mixer.acquire(
        record.channel,
        Math.max(0, startsAt - now),
        duration + record.asset.releaseTime,
      ),
    };
    return slot;
  }

  private stopIdleTimer(): void {
    if (
      this.timer &&
      this.playbacks.size === 0 &&
      this.slots.every((slot) => !slot)
    ) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private report(error: unknown): void {
    try {
      this.onError(
        error instanceof Error
          ? error
          : new AudioError('Audio playback failed.', { cause: error }),
      );
    } catch {
      // User event handlers must not break the scheduler.
    }
  }
}
