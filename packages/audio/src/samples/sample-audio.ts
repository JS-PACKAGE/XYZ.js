import { gameplayAssetLimits } from '../../../../src/data/gameplay-assets.js';
import { readResponse } from '../../../assets/src/read-response.js';
import { subscribeLoad } from '../../../assets/src/preload/subscribe-load.js';
import type { Scene } from '../../../core/src/scene.js';
import type { AudioChannelName } from '../audio-manager.js';
import { AudioError } from '../errors.js';
import { SamplePlayback, type SamplePlayOptions } from './sample-playback.js';
import {
  AudioStream,
  whenPlayable,
  type AudioStreamOptions,
} from './stream.js';
import { AudioListenerState } from './spatial.js';
import type { AudioActivity } from '../mixer.js';

interface SampleHost {
  context(): AudioContext | undefined;
  scene(): Scene | undefined;
  bus(context: AudioContext, channel: AudioChannelName): GainNode;
  activity?(channel: AudioChannelName, delay?: number): AudioActivity;
  contexts?(): readonly AudioContext[];
  report?(error: Error): void;
}

interface CachedSample {
  readonly promise: Promise<SampleAudioAsset>;
  readonly controller: AbortController;
}

interface SampleRecord {
  scene?: Scene;
  readonly persistent: boolean;
}

/** Seconds into the decoded buffer; `end` is exclusive of later sprites sharing the file. */
export interface AudioSpriteRange {
  readonly start: number;
  readonly end: number;
}

/** Encoded bytes are loader-owned; decoded metadata stays unavailable before unlock/decode. */
export class SampleAudioAsset {
  private buffer?: AudioBuffer;
  private decoding?: Promise<void>;
  private readonly spriteRanges = new Map<string, AudioSpriteRange>();
  loop = false;
  persistent = false;

  /** @internal */
  constructor(
    private readonly engine: SampleAudioEngine,
    private encoded: ArrayBuffer,
  ) {}

  get decoded(): boolean {
    return this.buffer !== undefined;
  }

  get duration(): number | undefined {
    return this.buffer?.duration;
  }

  get sampleRate(): number | undefined {
    return this.buffer?.sampleRate;
  }

  get channels(): number | undefined {
    return this.buffer?.numberOfChannels;
  }

  /** Names of the defined sprites in definition order. */
  get sprites(): readonly string[] {
    return [...this.spriteRanges.keys()];
  }

  /**
   * Names sections of this one decoded buffer so many short sounds share a single file and
   * decode. Ranges are in seconds, are validated against the decoded duration when played, and
   * may overlap. Redefining a name replaces it.
   */
  defineSprites(ranges: Readonly<Record<string, AudioSpriteRange>>): void {
    const entries = Object.entries(ranges);
    if (
      this.spriteRanges.size + entries.length >
      gameplayAssetLimits.audioSprites
    )
      throw new AudioError('Audio sprite budget is exhausted.');
    for (const [name, range] of entries) {
      if (
        !name ||
        !Number.isFinite(range.start) ||
        !Number.isFinite(range.end) ||
        range.start < 0 ||
        range.start >= range.end
      )
        throw new AudioError(
          `Audio sprite "${name}" must satisfy 0 <= start < end.`,
        );
    }
    for (const [name, range] of entries)
      this.spriteRanges.set(name, { start: range.start, end: range.end });
  }

  /** Plays one defined sprite; `loop` repeats only that section. */
  async playSprite(
    name: string,
    options: Omit<SamplePlayOptions, 'region' | 'offset'> = {},
  ): Promise<SamplePlayback> {
    const range = this.spriteRanges.get(name);
    if (!range) throw new AudioError(`Unknown audio sprite "${name}".`);
    this.engine.requireContext();
    const scene = options.scene ?? this.engine.currentScene;
    await this.decode();
    if (range.end > this.buffer!.duration)
      throw new AudioError(
        `Audio sprite "${name}" ends after the decoded duration.`,
      );
    return this.engine.play(this.buffer!, {
      ...options,
      scene,
      region: range,
      loop: options.loop ?? false,
      persistent: options.persistent ?? this.persistent,
    });
  }

  decode(): Promise<void> {
    let context: AudioContext;
    try {
      context = this.engine.requireContext();
    } catch (error) {
      return Promise.reject(error);
    }
    if (this.buffer) return Promise.resolve();
    if (!this.decoding) {
      // decodeAudioData consumes its input. Keep the cached encoded bytes intact for retry.
      const operation = Promise.resolve()
        .then(() => {
          this.engine.requireContext();
          return context.decodeAudioData(this.encoded.slice(0));
        })
        .then((buffer) => {
          this.engine.requireContext();
          if (
            !Number.isInteger(buffer.length) ||
            buffer.length <= 0 ||
            buffer.length > gameplayAssetLimits.sampleFrames ||
            !Number.isInteger(buffer.numberOfChannels) ||
            buffer.numberOfChannels <= 0 ||
            buffer.numberOfChannels > gameplayAssetLimits.sampleChannels ||
            buffer.length * buffer.numberOfChannels >
              gameplayAssetLimits.sampleValues ||
            !Number.isFinite(buffer.sampleRate) ||
            buffer.sampleRate <= 0 ||
            buffer.sampleRate > gameplayAssetLimits.sampleRate ||
            !Number.isFinite(buffer.duration) ||
            buffer.duration <= 0
          )
            throw new AudioError(
              'Sample exceeds the decoded audio resource budget.',
            );
          this.buffer = buffer;
        });
      this.decoding = subscribeLoad(operation, this.engine.signal)
        .catch((error: unknown) => {
          if (error instanceof AudioError) throw error;
          throw new AudioError('Unable to decode sample audio.', {
            cause: error,
          });
        })
        .finally(() => {
          this.decoding = undefined;
        });
    }
    return this.decoding;
  }

  async play(options: SamplePlayOptions = {}): Promise<SamplePlayback> {
    this.engine.requireContext();
    // Capture ownership before decode awaits: a scene swap must not silently retarget playback.
    const scene = options.scene ?? this.engine.currentScene;
    await this.decode();
    return this.engine.play(this.buffer!, {
      ...options,
      scene,
      loop: options.loop ?? this.loop,
      persistent: options.persistent ?? this.persistent,
    });
  }

  /** @internal */
  dispose(): void {
    this.buffer = undefined;
    this.encoded = new ArrayBuffer(0);
  }
}

/** Owns sampled buses and sources on the first OPM context, independent of the eight OPM slots. */
export class SampleAudioEngine {
  private readonly lifetime = new AbortController();
  private readonly cache = new Map<string, CachedSample>();
  private readonly assets = new Set<SampleAudioAsset>();
  private readonly playbacks = new Map<
    SamplePlayback | AudioStream,
    SampleRecord
  >();
  /** Playbacks paused by the manager's pause policy, resumed together. */
  private readonly suspended = new Set<SamplePlayback | AudioStream>();
  private holding = false;
  private disposed = false;
  readonly listener: AudioListenerState;

  constructor(private readonly host: SampleHost) {
    this.listener = new AudioListenerState(() => host.context(), host.contexts);
  }

  get signal(): AbortSignal {
    return this.lifetime.signal;
  }

  get currentScene(): Scene | undefined {
    return this.host.scene();
  }

  requireContext(): AudioContext {
    if (this.disposed) throw new AudioError('AudioManager has been destroyed.');
    const context = this.host.context();
    if (!context || context.state === 'closed')
      throw new AudioError(
        'Audio must be unlocked from a user gesture before sample decode/playback.',
      );
    return context;
  }

  /** Subscriber abort rejects only that acquisition, never another caller's shared cache. */
  load(
    url: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<SampleAudioAsset> {
    if (this.disposed)
      return Promise.reject(new AudioError('AudioManager has been destroyed.'));
    if (options.signal?.aborted) return Promise.reject(options.signal.reason);
    let canonical: string;
    try {
      const base =
        (typeof document !== 'undefined' ? document.baseURI : undefined) ??
        (typeof location !== 'undefined' ? location.href : undefined);
      const resolved = new URL(url, base);
      if (!['http:', 'https:', 'data:', 'blob:'].includes(resolved.protocol))
        throw new AudioError('Unsupported sample URL protocol.');
      resolved.hash = '';
      canonical = resolved.href;
    } catch (error) {
      return Promise.reject(
        new AudioError('Invalid sample URL.', { cause: error }),
      );
    }
    const cached = this.cache.get(canonical);
    if (cached) return subscribeLoad(cached.promise, options.signal);
    const controller = new AbortController();
    const operation = async () => {
      const response = await fetch(canonical, { signal: controller.signal });
      controller.signal.throwIfAborted();
      if (!response.ok)
        throw new AudioError(
          `Sample request failed (HTTP ${response.status}).`,
        );
      const blob = await readResponse(
        response,
        gameplayAssetLimits.sampleBytes,
        controller.signal,
      );
      const bytes = await blob.arrayBuffer();
      controller.signal.throwIfAborted();
      const asset = new SampleAudioAsset(this, bytes);
      this.assets.add(asset);
      return asset;
    };
    const entry: CachedSample = {
      controller,
      promise: subscribeLoad(operation(), controller.signal).catch(
        (error: unknown) => {
          if (this.cache.get(canonical) === entry) this.cache.delete(canonical);
          if (error instanceof AudioError) throw error;
          throw new AudioError('Unable to load sample audio.', {
            cause: error,
          });
        },
      ),
    };
    this.cache.set(canonical, entry);
    return subscribeLoad(entry.promise, options.signal);
  }

  play(buffer: AudioBuffer, options: SamplePlayOptions): SamplePlayback {
    const context = this.requireContext();
    const channel = options.channel ?? 'sfx';
    if (channel !== 'music' && channel !== 'sfx' && channel !== 'ui')
      throw new AudioError('Unknown audio channel.');
    if (options.scene?.destroyed)
      throw new AudioError('Cannot play audio in a destroyed Scene.');
    if (this.playbacks.size >= gameplayAssetLimits.samplePlaybacks)
      throw new AudioError('Sample playback budget is exhausted.');
    this.listener.apply();
    let activity: AudioActivity | undefined;
    const playback = new SamplePlayback(
      context,
      buffer,
      this.host.bus(context, channel),
      options,
      (finished) => {
        activity?.release();
        this.playbacks.delete(finished);
        this.suspended.delete(finished);
      },
      (active, delay) => {
        if (!active) {
          activity?.release();
          activity = undefined;
        } else if (!activity) activity = this.host.activity?.(channel, delay);
      },
    );
    this.playbacks.set(playback, {
      scene: options.scene,
      persistent: options.persistent ?? false,
    });
    if (this.holding) {
      playback.pause('manager');
      this.suspended.add(playback);
    }
    return playback;
  }

  /**
   * Reserves ownership and the playback budget before waiting for readiness. Autoplay requests
   * native playback before the first await so a caller's gesture belongs to this media element.
   * The signal cancels acquisition through readiness/playback, not the returned stream's lifetime.
   */
  async stream(
    url: string,
    options: AudioStreamOptions = {},
  ): Promise<AudioStream> {
    const context = this.requireContext();
    const channel = options.channel ?? 'music';
    if (channel !== 'music' && channel !== 'sfx' && channel !== 'ui')
      throw new AudioError('Unknown audio channel.');
    const scene = options.scene ?? this.currentScene;
    if (scene?.destroyed)
      throw new AudioError('Cannot play audio in a destroyed Scene.');
    if (this.playbacks.size >= gameplayAssetLimits.samplePlaybacks)
      throw new AudioError('Sample playback budget is exhausted.');
    let resolved: URL;
    try {
      const base =
        (typeof document !== 'undefined' ? document.baseURI : undefined) ??
        (typeof location !== 'undefined' ? location.href : undefined);
      resolved = new URL(url, base);
    } catch (error) {
      throw new AudioError('Invalid stream URL.', { cause: error });
    }
    if (!['http:', 'https:', 'blob:', 'data:'].includes(resolved.protocol))
      throw new AudioError('Unsupported stream URL protocol.');
    const startTime = options.startTime ?? 0;
    if (!Number.isFinite(startTime) || startTime < 0)
      throw new AudioError('Stream startTime must be finite and nonnegative.');
    if (options.signal?.aborted) throw options.signal.reason;
    const media = new Audio();
    const crossOrigin =
      options.crossOrigin ??
      (typeof location !== 'undefined' &&
      resolved.protocol.startsWith('http') &&
      resolved.origin !== location.origin
        ? 'anonymous'
        : undefined);
    if (crossOrigin) media.crossOrigin = crossOrigin;
    media.preload = 'auto';
    const preparation = new AbortController();
    let stream: AudioStream | undefined;
    let source: MediaElementAudioSourceNode | undefined;
    let gain: GainNode | undefined;
    const aborted = (): void => {
      preparation.abort(options.signal?.reason ?? this.lifetime.signal.reason);
      stream?.stop();
    };
    const reportError = (event: Event): void => {
      this.host.report?.((event as CustomEvent<Error>).detail);
    };
    try {
      let activity: AudioActivity | undefined;
      options.signal?.addEventListener('abort', aborted, { once: true });
      this.lifetime.signal.addEventListener('abort', aborted, { once: true });
      this.listener.apply();
      // A media element may only be wrapped once, so the nodes live as long as the stream.
      source = context.createMediaElementSource(media);
      gain = context.createGain();
      source.connect(gain);
      gain.connect(this.host.bus(context, channel));
      stream = new AudioStream(
        media,
        source,
        gain,
        (finished) => {
          if (!preparation.signal.aborted)
            preparation.abort(
              new AudioError('Audio stream acquisition was stopped.', {
                cause: new DOMException('Stream was stopped.', 'AbortError'),
              }),
            );
          finished.removeEventListener('error', reportError);
          this.playbacks.delete(finished);
          this.suspended.delete(finished);
          activity?.release();
        },
        options,
        (active) => {
          if (!active) {
            activity?.release();
            activity = undefined;
          } else if (!activity) activity = this.host.activity?.(channel);
        },
      );
      stream.addEventListener('error', reportError);
      this.playbacks.set(stream, {
        scene,
        persistent: options.persistent ?? false,
      });
      const playable = whenPlayable(media, options.signal, preparation.signal);
      media.src = resolved.href;
      if (startTime > 0) media.currentTime = startTime;
      let playing: Promise<void> | undefined;
      if (options.autoplay ?? true) {
        if (this.holding) {
          stream.pause('manager');
          this.suspended.add(stream);
        } else playing = stream.play();
      }
      await subscribeLoad(Promise.all([playable, playing]), preparation.signal);
      this.requireContext();
      return stream;
    } catch (error) {
      if (stream) stream.stop();
      else {
        source?.disconnect();
        gain?.disconnect();
        media.removeAttribute('src');
        media.load();
      }
      throw error;
    } finally {
      options.signal?.removeEventListener('abort', aborted);
      this.lifetime.signal.removeEventListener('abort', aborted);
    }
  }

  /** Pauses every playing sample and stream; `resume` restarts exactly those. */
  suspend(): void {
    this.holding = true;
    for (const playback of this.playbacks.keys()) {
      if (playback.state === 'stopped' || playback.state === 'ended') continue;
      playback.pause('manager');
      this.suspended.add(playback);
    }
  }

  resume(): void {
    this.holding = false;
    for (const playback of this.suspended) {
      if (playback.state !== 'paused') continue;
      if (playback instanceof AudioStream)
        void playback.play('manager').catch((error: unknown) => {
          playback.dispatchEvent(
            new CustomEvent<Error>('error', {
              detail:
                error instanceof Error
                  ? error
                  : new AudioError('Unable to resume audio stream.', {
                      cause: error,
                    }),
            }),
          );
        });
      else {
        try {
          playback.resume('manager');
        } catch (error) {
          const failure =
            error instanceof Error
              ? error
              : new AudioError('Unable to resume sample audio.', {
                  cause: error,
                });
          if (!this.host.report) throw failure;
          this.host.report(failure);
        }
      }
    }
    this.suspended.clear();
  }

  stopScene(scene: Scene): void {
    for (const [playback, record] of this.playbacks) {
      if (record.scene !== scene) continue;
      if (record.persistent) record.scene = undefined;
      else playback.stop();
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    const error = new AudioError('AudioManager has been destroyed.');
    this.lifetime.abort(error);
    for (const entry of this.cache.values()) entry.controller.abort(error);
    this.cache.clear();
    for (const playback of [...this.playbacks.keys()]) playback.stop();
    this.playbacks.clear();
    this.suspended.clear();
    for (const asset of this.assets) asset.dispose();
    this.assets.clear();
  }
}
