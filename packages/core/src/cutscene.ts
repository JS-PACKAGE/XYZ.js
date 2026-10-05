import { GameObject } from './game-object.js';
import type { Tweenable } from './tween.js';
import type { AnimationClip } from './animation.js';
import { MorphWeights } from './morph.js';
import { narrativeLimits } from '../../../src/data/narrative.js';

export type CutsceneStatus =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'waiting'
  | 'completed'
  | 'cancelled'
  | 'error';
/** Samples must be pure/idempotent state writes. Side effects belong in cues, never samples. */
export interface CutsceneAction {
  sample(time: number, duration: number): void;
  reset(): void;
  pause?(): void;
  resume?(): void;
  dispose?(): void;
}
export interface CutsceneTrack {
  readonly id: string;
  readonly start: number;
  readonly duration: number;
  readonly action: CutsceneAction;
}
export interface CutsceneCue {
  readonly id: string;
  readonly at: number;
  /** Returning a promise creates an instruction/choice barrier. AbortSignal invalidates stale UI. */
  readonly run: (context: {
    director: CutsceneDirector;
    signal: AbortSignal;
    pass: number;
  }) => void | Promise<unknown>;
  /** Default once for the entire run; opt in to one invocation per loop pass. */
  readonly repeat?: boolean;
}
export interface CutsceneOptions {
  readonly duration: number;
  readonly tracks?: readonly CutsceneTrack[];
  readonly cues?: readonly CutsceneCue[];
  /** Extra passes, or Infinity. */
  readonly repeat?: number;
  readonly onComplete?: () => void;
  readonly onError?: (error: unknown) => void;
}
/** Uses Scene's existing GameObject simulation update; also supports manual update(dt).
 * Seek samples tracks but never invokes cues; past cues are consumed. Cancel resets borrowed
 * track state and disposes owned resources; destruction always cancels pending barriers. */
export class CutsceneDirector extends GameObject {
  readonly duration: number;
  private readonly tracks: readonly CutsceneTrack[];
  private readonly cues: readonly CutsceneCue[];
  private readonly repeat: number;
  private state: CutsceneStatus = 'idle';
  private clock = 0;
  private passNumber = 0;
  private readonly fired = new Set<string>();
  private barrier: AbortController | undefined;
  private readonly cueLifetimes = new Map<string, AbortController>();
  private generation = 0;
  private paused = false;
  private updating = false;
  private disposedActions = false;
  error: unknown;
  constructor(private readonly options: CutsceneOptions) {
    super();
    if (!Number.isFinite(options.duration) || options.duration <= 0)
      throw new RangeError('Cutscene duration must be positive and finite.');
    this.duration = options.duration;
    this.repeat = options.repeat ?? 0;
    if (
      this.repeat !== Infinity &&
      (!Number.isInteger(this.repeat) || this.repeat < 0)
    )
      throw new RangeError('Invalid cutscene repeat.');
    this.tracks = (options.tracks ?? []).map((track) => ({ ...track }));
    this.cues = (options.cues ?? [])
      .map((cue) => ({ ...cue }))
      .sort((a, b) => a.at - b.at);
    const ids = new Set<string>();
    for (const track of this.tracks) {
      if (
        !track.id ||
        ids.has(track.id) ||
        !Number.isFinite(track.start) ||
        track.start < 0 ||
        !Number.isFinite(track.duration) ||
        track.duration <= 0 ||
        track.start + track.duration > this.duration
      )
        throw new Error('Invalid cutscene track.');
      ids.add(track.id);
    }
    ids.clear();
    for (const cue of this.cues) {
      if (
        !cue.id ||
        ids.has(cue.id) ||
        !Number.isFinite(cue.at) ||
        cue.at < 0 ||
        cue.at > this.duration ||
        typeof cue.run !== 'function'
      )
        throw new Error('Invalid cutscene cue.');
      ids.add(cue.id);
    }
  }
  get status(): CutsceneStatus {
    return this.state;
  }
  get time(): number {
    return this.clock;
  }
  get pass(): number {
    return this.passNumber;
  }
  play(): void {
    if (this.destroyed || this.state !== 'idle')
      throw new Error('Cutscene can only start once.');
    this.state = 'playing';
    try {
      this.sample();
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }
  pause(): void {
    if (this.state !== 'playing' && this.state !== 'waiting') return;
    this.paused = true;
    this.state = 'paused';
    for (const track of this.tracks) track.action.pause?.();
  }
  resume(): void {
    if (
      !this.paused ||
      this.destroyed ||
      !['paused', 'waiting'].includes(this.state)
    )
      return;
    this.paused = false;
    this.state = this.barrier ? 'waiting' : 'playing';
    for (const track of this.tracks) track.action.resume?.();
  }
  seek(time: number): void {
    if (
      this.destroyed ||
      ['completed', 'cancelled', 'error'].includes(this.state)
    )
      throw new Error('Cannot seek a finished cutscene.');
    if (!Number.isFinite(time) || time < 0 || time > this.duration)
      throw new RangeError('Invalid cutscene seek.');
    this.invalidate();
    this.clock = time;
    for (const cue of this.cues)
      if (cue.at <= time) this.fired.add(this.cueKey(cue));
    if (this.state !== 'idle') this.state = this.paused ? 'paused' : 'playing';
    try {
      this.sample();
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }
  override update(delta: number): void {
    if (!Number.isFinite(delta) || delta < 0)
      throw new RangeError('Invalid cutscene delta.');
    if (this.updating) throw new Error('Cutscene update is not reentrant.');
    if (this.state !== 'playing') return;
    this.updating = true;
    try {
      let remaining = delta;
      let steps = 0;
      while (this.state === 'playing') {
        if (++steps > narrativeLimits.cutsceneUpdateSteps)
          throw new RangeError(
            'Cutscene update exceeded its bounded cue/pass work budget.',
          );
        const generation = this.generation;
        const target = Math.min(this.duration, this.clock + remaining);
        const cue = this.cues.find(
          (item) => item.at <= target && !this.fired.has(this.cueKey(item)),
        );
        if (cue) {
          const elapsed = Math.max(0, cue.at - this.clock);
          this.clock = Math.max(this.clock, cue.at);
          remaining = Math.max(0, remaining - elapsed);
          this.sample();
          if (generation !== this.generation || this.state !== 'playing') break;
          this.fired.add(this.cueKey(cue));
          const controller = new AbortController();
          this.cueLifetimes.get(cue.id)?.abort();
          this.cueLifetimes.set(cue.id, controller);
          this.barrier = controller;
          const result = cue.run({
            director: this,
            signal: controller.signal,
            pass: this.passNumber,
          });
          if (generation !== this.generation) {
            if (result) void Promise.resolve(result).catch(() => undefined);
            break;
          }
          if (result && typeof result.then === 'function') {
            this.state = 'waiting';
            for (const track of this.tracks) track.action.pause?.();
            void Promise.resolve(result)
              .then(() => {
                if (
                  generation !== this.generation ||
                  controller.signal.aborted ||
                  this.destroyed
                )
                  return;
                this.barrier = undefined;
                this.state = this.paused ? 'paused' : 'playing';
                try {
                  if (!this.paused)
                    for (const track of this.tracks) track.action.resume?.();
                } catch (error) {
                  this.fail(error);
                }
              })
              .catch((error) => {
                if (
                  generation === this.generation &&
                  !controller.signal.aborted
                )
                  this.fail(error);
              });
            break;
          }
          this.barrier = undefined;
          continue;
        }
        remaining -= target - this.clock;
        this.clock = target;
        this.sample();
        if (generation !== this.generation || this.state !== 'playing') break;
        if (this.clock < this.duration) break;
        if (this.passNumber < this.repeat) {
          for (const cue of this.cues)
            if (cue.repeat) this.fired.delete(this.cueKey(cue));
          this.passNumber++;
          this.clock = 0;
          for (const track of this.tracks) track.action.reset();
          if (remaining === 0) break;
        } else {
          this.state = 'completed';
          for (const track of this.tracks) track.action.pause?.();
          this.options.onComplete?.();
          break;
        }
      }
    } catch (error) {
      this.fail(error);
      throw error;
    } finally {
      this.updating = false;
    }
  }
  cancel(): void {
    if (this.state === 'cancelled') return;
    this.invalidate();
    this.state = 'cancelled';
    try {
      for (const track of this.tracks) track.action.reset();
    } finally {
      this.disposeActions();
    }
  }
  protected override onDestroy(): void {
    this.cancel();
  }
  private cueKey(cue: CutsceneCue): string {
    return cue.repeat ? `${this.passNumber}:${cue.id}` : `once:${cue.id}`;
  }
  private sample(): void {
    const generation = this.generation;
    // Reset first so backward seeks before a track undo its previous state. Declaration order
    // defines priority for overlapping writes to the same target.
    for (const track of this.tracks) {
      track.action.reset();
      if (generation !== this.generation || this.destroyed) return;
    }
    for (const track of this.tracks) {
      if (this.clock >= track.start)
        track.action.sample(
          Math.min(track.duration, this.clock - track.start),
          track.duration,
        );
      if (generation !== this.generation || this.destroyed) return;
    }
  }
  private invalidate(): void {
    this.generation++;
    for (const controller of this.cueLifetimes.values()) controller.abort();
    this.cueLifetimes.clear();
    this.barrier = undefined;
  }
  private fail(error: unknown): void {
    this.invalidate();
    this.error = error;
    this.state = 'error';
    try {
      for (const track of this.tracks) track.action.pause?.();
    } finally {
      this.options.onError?.(error);
    }
  }
  private disposeActions(): void {
    if (this.disposedActions) return;
    this.disposedActions = true;
    const errors: unknown[] = [];
    for (const track of this.tracks) {
      try {
        track.action.dispose?.();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Cutscene action cleanup failed.');
  }
}
/** Reuses Tween/Timeline state sampling for actual camera or UI numeric properties.
 * Use callback-free tweenables: cue callbacks belong to the director's side-effect ledger. */
export function cutsceneTween(item: Tweenable): CutsceneAction {
  return { sample: (time) => item.seek(time), reset: () => item.reset() };
}
/** Renderer-independent clip sampling, without playing a second mixer clock. */
export function cutsceneAnimation(
  clip: AnimationClip,
  weight = 1,
): CutsceneAction {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1)
    throw new RangeError('Invalid animation weight.');
  const restore = clip.tracks.map((track) => {
    const target = track.target;
    if (target instanceof MorphWeights) {
      const values = Array.from({ length: target.count }, (_, i) =>
        target.get(i),
      );
      return () => {
        for (let i = 0; i < values.length; i++) target.set(i, values[i]);
      };
    }
    if (track.path === 'rotation') {
      const { x, y, z, w } = target.rotation;
      return () => {
        target.rotation.set(x, y, z, w);
      };
    }
    const vector =
      track.path === 'translation' ? target.position : target.scale;
    const { x, y, z } = vector;
    return () => {
      vector.set(x, y, z);
    };
  });
  return {
    sample: (time) => {
      for (const track of clip.tracks)
        track.sample(Math.min(time, clip.duration), weight);
    },
    reset: () => {
      for (const reset of restore) reset();
    },
  };
}
/** A UI state adapter captures its original value and restores it on cancel/backward seek. */
export function cutsceneValue<T>(
  read: () => T,
  write: (value: T) => void,
  value: T,
): CutsceneAction {
  const original = read();
  return { sample: () => write(value), reset: () => write(original) };
}
/** Cue-owned audio playback: cancellation abort stops real sample/OPM/stream playback.
 * Playback is borrowed; use a factory cue for each loop if audio should repeat. */
export function cutsceneAudio(
  play: () => { stop(): void } | Promise<{ stop(): void }>,
): CutsceneCue['run'] {
  return async ({ signal }) => {
    const playback = await play();
    if (signal.aborted) playback.stop();
    else
      signal.addEventListener('abort', () => playback.stop(), { once: true });
  };
}
