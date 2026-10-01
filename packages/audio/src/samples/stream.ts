import { gameplayAssetLimits } from '../../../../src/data/gameplay-assets.js';
import type { AudioPlayOptions } from '../audio-manager.js';
import { AudioError } from '../errors.js';

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

  /** @internal */
  constructor(
    private readonly media: HTMLAudioElement,
    private readonly source: MediaElementAudioSourceNode,
    private readonly gain: GainNode,
    private readonly release: (stream: AudioStream) => void,
    options: AudioStreamOptions,
  ) {
    super();
    this.level = options.volume ?? 1;
    checkVolume(this.level);
    gain.gain.value = this.level;
    media.loop = options.loop ?? false;
    media.playbackRate = options.playbackRate ?? 1;
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

  /** Resolves once playback has started; rejects if the browser refuses (for example autoplay). */
  async play(): Promise<void> {
    if (this.status === 'stopped')
      throw new AudioError('Cannot play a stopped audio stream.');
    try {
      await this.media.play();
    } catch (error) {
      throw new AudioError('Unable to start audio stream playback.', {
        cause: error,
      });
    }
    if (this.status === 'paused' || this.status === 'ended')
      this.status = 'playing';
  }

  pause(): void {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.media.pause();
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
    this.status = 'stopped';
    this.media.removeEventListener('ended', this.onEnded);
    this.media.removeEventListener('error', this.onError);
    this.media.pause();
    // Dropping the source cancels any download still in flight.
    this.media.removeAttribute('src');
    this.media.load();
    this.source.disconnect();
    this.gain.disconnect();
    this.release(this);
  }

  private readonly onEnded = (): void => {
    if (this.status !== 'playing') return;
    this.status = 'ended';
    this.dispatchEvent(new Event('ended'));
  };

  private readonly onError = (): void => {
    if (this.status === 'stopped') return;
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
    media.addEventListener('canplay', ready);
    media.addEventListener('error', failed);
    signal?.addEventListener('abort', aborted);
    lifetime.addEventListener('abort', aborted);
  });
}
