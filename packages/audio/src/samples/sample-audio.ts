import { gameplayAssetLimits } from '../../../../src/data/gameplay-assets.js';
import { readResponse } from '../../../assets/src/read-response.js';
import { subscribeLoad } from '../../../assets/src/preload/subscribe-load.js';
import type { Scene } from '../../../core/src/scene.js';
import type { AudioChannelName } from '../audio-manager.js';
import { AudioError } from '../errors.js';
import { SamplePlayback, type SamplePlayOptions } from './sample-playback.js';

interface SampleHost {
  context(): AudioContext | undefined;
  scene(): Scene | undefined;
  volume(channel: AudioChannelName | 'master'): number;
}

interface CachedSample {
  readonly promise: Promise<SampleAudioAsset>;
  readonly controller: AbortController;
}

interface SampleRecord {
  scene?: Scene;
  readonly persistent: boolean;
}

/** Encoded bytes are loader-owned; decoded metadata stays unavailable before unlock/decode. */
export class SampleAudioAsset {
  private buffer?: AudioBuffer;
  private decoding?: Promise<void>;
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
  private readonly playbacks = new Map<SamplePlayback, SampleRecord>();
  private master?: GainNode;
  private buses?: Record<AudioChannelName, GainNode>;
  private disposed = false;

  constructor(private readonly host: SampleHost) {}

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
    this.ensureBuses(context);
    const playback = new SamplePlayback(
      context,
      buffer,
      this.buses![channel],
      options,
      (finished) => this.playbacks.delete(finished),
    );
    this.playbacks.set(playback, {
      scene: options.scene,
      persistent: options.persistent ?? false,
    });
    return playback;
  }

  refreshGains(): void {
    if (this.disposed || !this.master || !this.buses) return;
    this.master.gain.value = this.host.volume('master');
    this.buses.music.gain.value = this.host.volume('music');
    this.buses.sfx.gain.value = this.host.volume('sfx');
    this.buses.ui.gain.value = this.host.volume('ui');
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
    for (const playback of this.playbacks.keys()) playback.stop();
    this.playbacks.clear();
    for (const asset of this.assets) asset.dispose();
    this.assets.clear();
    if (this.buses) {
      this.buses.music.disconnect();
      this.buses.sfx.disconnect();
      this.buses.ui.disconnect();
    }
    this.master?.disconnect();
    this.buses = undefined;
    this.master = undefined;
  }

  private ensureBuses(context: AudioContext): void {
    if (this.buses) return;
    this.master = context.createGain();
    this.master.connect(context.destination);
    this.buses = {
      music: context.createGain(),
      sfx: context.createGain(),
      ui: context.createGain(),
    };
    this.buses.music.connect(this.master);
    this.buses.sfx.connect(this.master);
    this.buses.ui.connect(this.master);
    this.refreshGains();
  }
}
