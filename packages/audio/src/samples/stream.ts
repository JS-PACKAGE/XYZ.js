import { gameplayAssetLimits } from '../../../../src/data/gameplay-assets.js';
import type { AudioPlayOptions } from '../audio-manager.js';
import { AudioError } from '../errors.js';
import {
  applyPannerOptions,
  checkSpatialOptions,
  validateVec3,
  type AudioVec3,
} from './spatial.js';

export interface AudioStreamOptions extends AudioPlayOptions {
  volume?: number;
  playbackRate?: number;
  /** Position in seconds to start from. */
  startTime?: number;
  /** Start playing as soon as the media can play. Default true. */
  autoplay?: boolean;
  /**
   * CORS mode of the media element. Defaults to `anonymous` for cross-origin URLs: without CORS
   * headers the Web Audio graph receives silence, so such URLs fail to play instead.
   */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /** Cancels acquisition, including the initial playback request, until `stream()` resolves. */
  signal?: AbortSignal;
}

export type AudioStreamState = 'paused' | 'playing' | 'stopped' | 'ended';

/**
 * A long audio file played through an `HTMLAudioElement` that is routed into the channel bus, so
 * it starts before the whole file is downloaded and is never decoded into memory. Prefer decoded
 * samples for short effects: streams cannot be scheduled sample-accurately, loops can have a
 * gap, and seeking needs a seekable (range-capable) server.
 */
export class AudioStream extends EventTarget {
  private status: AudioStreamState = 'paused';
  private level: number;
  private disposed = false;
  private readonly pauseReasons = new Set<string>();
  private readonly panner?: PannerNode;
  private generation = 0;
  private pending?: { generation: number; promise: Promise<void> };

  /** @internal */
  constructor(
    private readonly media: HTMLAudioElement,
    private readonly source: MediaElementAudioSourceNode,
    private readonly gain: GainNode,
    private readonly release: (stream: AudioStream) => void,
    options: AudioStreamOptions,
    private readonly activity?: (active: boolean) => void,
  ) {
    super();
    this.level = options.volume ?? 1;
    checkVolume(this.level);
    this.playbackRate = options.playbackRate ?? 1;
    gain.gain.value = this.level;
    if (options.spatial) {
      const spatial = checkSpatialOptions(options.spatial);
      this.panner = gain.context.createPanner();
      applyPannerOptions(this.panner, spatial);
      // The engine supplies a gain connected to the selected bus. Insert the emitter before it.
      source.disconnect();
      source.connect(this.panner);
      this.panner.connect(gain);
    }
    media.loop = options.loop ?? false;
    media.addEventListener('ended', this.onEnded);
    media.addEventListener('error', this.onError);
  }

  get state(): AudioStreamState {
    return this.status;
  }

  /** Seconds. */
  get position(): number {
    return this.media.currentTime;
  }

  /** Seconds, `Infinity` for an endless stream, or `undefined` before metadata is known. */
  get duration(): number | undefined {
    const value = this.media.duration;
    return Number.isNaN(value) ? undefined : value;
  }

  get loop(): boolean {
    return this.media.loop;
  }

  set loop(value: boolean) {
    this.media.loop = value;
  }

  get volume(): number {
    return this.level;
  }

  set volume(value: number) {
    checkVolume(value);
    this.level = value;
    this.gain.gain.value = value;
  }

  get position3D(): Readonly<AudioVec3> | undefined {
    return this.panner
      ? {
          x: this.panner.positionX.value,
          y: this.panner.positionY.value,
          z: this.panner.positionZ.value,
        }
      : undefined;
  }
  set position3D(value: Readonly<AudioVec3> | undefined) {
    if (!this.panner || !value)
      throw new AudioError('Stream was not created with spatial options.');
    validateVec3(value, 'Spatial position');
    this.panner.positionX.value = value.x;
    this.panner.positionY.value = value.y;
    this.panner.positionZ.value = value.z;
  }

  get playbackRate(): number {
    return this.media.playbackRate;
  }

  set playbackRate(value: number) {
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      value > gameplayAssetLimits.playbackRate
    )
      throw new AudioError(
        `Stream playback rate must be within (0, ${gameplayAssetLimits.playbackRate}].`,
      );
    this.media.playbackRate = value;
  }

  /**
   * Requests native playback synchronously, preserving the caller's user gesture. Concurrent
   * calls share one request. A pause/stop supersedes it; late completion cannot restart playback.
   */
  play(reason = 'user'): Promise<void> {
    if (this.status === 'stopped')
      return Promise.reject(
        new AudioError('Cannot play a stopped audio stream.'),
      );
    this.pauseReasons.delete(reason);
    if (this.pauseReasons.size || this.status === 'playing')
      return Promise.resolve();
    if (this.pending?.generation === this.generation)
      return this.pending.promise;
    const generation = this.generation;
    let native: Promise<void>;
    try {
      native = this.media.play();
    } catch (error) {
      return Promise.reject(
        new AudioError('Unable to start audio stream playback.', {
          cause: error,
        }),
      );
    }
    const promise = native
      .then(() => {
        if (generation !== this.generation)
          throw new AudioError('Audio stream playback was interrupted.', {
            cause: new DOMException('Playback was superseded.', 'AbortError'),
          });
        this.status = 'playing';
        this.activity?.(true);
      })
      .catch((error: unknown) => {
        if (error instanceof AudioError) throw error;
        throw new AudioError('Unable to start audio stream playback.', {
          cause: error,
        });
      })
      .finally(() => {
        if (this.pending?.generation === generation) this.pending = undefined;
      });
    this.pending = { generation, promise };
    return promise;
  }

  pause(reason = 'user'): void {
    if (this.disposed) return;
    this.pauseReasons.add(reason);
    this.generation++;
    this.media.pause();
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.activity?.(false);
  }

  seek(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0)
      throw new AudioError('Stream position must be finite and nonnegative.');
    if (this.status === 'stopped')
      throw new AudioError('Cannot seek a stopped audio stream.');
    this.media.currentTime = seconds;
    if (this.status === 'ended') this.status = 'paused';
  }

  stop(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation++;
    this.status = 'stopped';
    this.pauseReasons.clear();
    this.activity?.(false);
    this.media.removeEventListener('ended', this.onEnded);
    this.media.removeEventListener('error', this.onError);
    this.media.pause();
    // Dropping the source cancels any download still in flight.
    this.media.removeAttribute('src');
    this.media.load();
    this.source.disconnect();
    this.gain.disconnect();
    this.panner?.disconnect();
    this.release(this);
  }

  private readonly onEnded = (): void => {
    if (this.status !== 'playing') return;
    this.generation++;
    this.status = 'ended';
    this.activity?.(false);
    this.dispatchEvent(new Event('ended'));
  };

  private readonly onError = (): void => {
    if (this.status === 'stopped') return;
    this.generation++;
    this.activity?.(false);
    this.media.pause();
    this.status = 'paused';
    const code = this.media.error?.code;
    this.dispatchEvent(
      new CustomEvent<Error>('error', {
        detail: new AudioError(
          `Audio stream failed${code === undefined ? '' : ` (media error ${code})`}.`,
        ),
      }),
    );
  };
}

function checkVolume(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1)
    throw new AudioError('Stream volume must be finite and within 0..1.');
}

/** Waits until the element can play, rejecting on failure, abort or `stop`. */
export function whenPlayable(
  media: HTMLAudioElement,
  signal: AbortSignal | undefined,
  lifetime: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const cleanup = (): void => {
      media.removeEventListener('canplay', ready);
      media.removeEventListener('error', failed);
      signal?.removeEventListener('abort', aborted);
      lifetime.removeEventListener('abort', aborted);
    };
    const ready = (): void => {
      cleanup();
      resolve();
    };
    const failed = (): void => {
      cleanup();
      reject(
        new AudioError(
          `Unable to load audio stream${media.error ? ` (media error ${media.error.code})` : ''}.`,
        ),
      );
    };
    const aborted = (): void => {
      cleanup();
      reject(signal?.reason ?? lifetime.reason);
    };
    if (signal?.aborted || lifetime.aborted) return aborted();
    if (media.error) return failed();
    if (media.readyState >= 3) return ready();
    media.addEventListener('canplay', ready);
    media.addEventListener('error', failed);
    signal?.addEventListener('abort', aborted);
    lifetime.addEventListener('abort', aborted);
  });
}
