import { AssetError } from './texture.js';
import { CanvasTexture2D } from './texture2d.js';
import { videoTextureLimits } from '../../../src/data/video.js';
import { assetLimits } from '../../../src/data/assets.js';

export interface VideoTextureOptions {
  /** Borrowed elements are not paused, unloaded, or removed on destroy. */
  ownVideo?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  onError?: (error: Error) => void;
}
export interface VideoTextureLoadOptions extends VideoTextureOptions {
  crossOrigin?: 'anonymous' | 'use-credentials';
  muted?: boolean;
  loop?: boolean;
}
function failure(error: unknown): Error {
  return error instanceof Error ? error : new AssetError(String(error));
}
function emptySurface(): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(1, 1);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas;
}

/** One stable source for Sprite and 3D materials; owns its copied pixels, not consumers. */
export class VideoTexture extends CanvasTexture2D {
  private video: HTMLVideoElement | undefined;
  private ownVideo = false;
  private callback: number | undefined;
  private fallback: number | undefined;
  private readonly listeners: Array<[string, EventListener]> = [];
  private abortSignal: AbortSignal | undefined;
  private abortListener: (() => void) | undefined;
  private readonly observers = new Set<(error: Error) => void>();
  private readonly decoders = new Set<VideoTextureDecoder>();
  private lastTime = -1;
  private errorValue: Error | undefined;

  constructor(options: Pick<VideoTextureOptions, 'onError'> = {}) {
    super(emptySurface());
    if (options.onError) this.observers.add(options.onError);
  }
  get lastError(): Error | undefined {
    return this.errorValue;
  }
  get media(): HTMLVideoElement | undefined {
    return this.video;
  }
  onError(listener: (error: Error) => void): () => void {
    if (this.destroyed) throw new AssetError('VideoTexture is destroyed.');
    this.observers.add(listener);
    return () => this.observers.delete(listener);
  }
  /** Consumes an externally decoded frame, closing it even when copying fails. */
  ingest(frame: VideoFrame): void {
    try {
      this.copyFrame(frame);
    } catch (error) {
      this.observe(error);
      throw error;
    } finally {
      frame.close();
    }
  }
  /** Waits for decoded pixels. requestVideoFrameCallback drives subsequent copies. */
  static async fromVideo(
    video: HTMLVideoElement,
    options: VideoTextureOptions = {},
  ): Promise<VideoTexture> {
    const texture = new VideoTexture(options);
    texture.video = video;
    texture.ownVideo = options.ownVideo ?? false;
    const timeout = options.timeoutMs ?? videoTextureLimits.loadTimeoutMs;
    if (
      !Number.isFinite(timeout) ||
      timeout <= 0 ||
      timeout > videoTextureLimits.maxLoadTimeoutMs
    ) {
      texture.destroy();
      throw new RangeError(
        'Video load timeout exceeds its positive finite budget.',
      );
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timer);
          video.removeEventListener('loadeddata', ready);
          video.removeEventListener('error', error);
          options.signal?.removeEventListener('abort', abort);
        };
        const ready = () => {
          cleanup();
          resolve();
        };
        const error = () => {
          cleanup();
          reject(
            new AssetError(
              `Unable to load video: ${video.error?.message ?? 'media error'}.`,
            ),
          );
        };
        const abort = () => {
          cleanup();
          reject(
            options.signal?.reason ??
              new DOMException('Video load aborted.', 'AbortError'),
          );
        };
        const timer = setTimeout(() => {
          cleanup();
          reject(new AssetError('Video load timed out.'));
        }, timeout);
        if (options.signal?.aborted) {
          abort();
          return;
        }
        if (video.error) {
          error();
          return;
        }
        if (video.readyState >= 2) {
          ready();
          return;
        }
        video.addEventListener('loadeddata', ready);
        video.addEventListener('error', error);
        options.signal?.addEventListener('abort', abort, { once: true });
      });
      if (options.signal?.aborted) throw options.signal.reason;
      texture.copyFrame(video);
      texture.lastTime = video.currentTime;
      texture.listen('play', () => texture.schedule());
      texture.listen('pause', () => texture.cancelDelivery());
      texture.listen('ended', () => texture.cancelDelivery());
      texture.listen('seeked', () => texture.capture());
      texture.listen('error', () => {
        texture.cancelDelivery();
        texture.observe(
          new AssetError(
            `Video playback failed: ${video.error?.message ?? 'media error'}.`,
          ),
        );
      });
      if (options.signal) {
        texture.abortSignal = options.signal;
        texture.abortListener = () => texture.destroy();
        options.signal.addEventListener('abort', texture.abortListener, {
          once: true,
        });
      }
      texture.schedule();
      return texture;
    } catch (error) {
      try {
        texture.observe(error);
      } finally {
        texture.destroy();
      }
      throw error;
    }
  }
  /** Browser media loading, not container demuxing for WebCodecs. CORS is set before src. */
  static async load(
    url: string | URL,
    options: VideoTextureLoadOptions = {},
  ): Promise<VideoTexture> {
    const video = document.createElement('video');
    video.crossOrigin = options.crossOrigin ?? 'anonymous';
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = options.muted ?? true;
    video.loop = options.loop ?? false;
    video.src = String(url);
    video.load();
    return VideoTexture.fromVideo(video, { ...options, ownVideo: true });
  }
  async play(): Promise<void> {
    if (this.destroyed || !this.video)
      throw new AssetError('VideoTexture has no live media element.');
    const video = this.video;
    try {
      await video.play();
      if (!this.destroyed) this.schedule();
      else if (this.ownVideo) video.pause();
    } catch (error) {
      if (!this.destroyed) this.observe(error);
      throw error;
    }
  }
  pause(): void {
    this.video?.pause();
    this.cancelDelivery();
  }
  async createDecoder(
    config: VideoDecoderConfig,
  ): Promise<VideoTextureDecoder> {
    if (this.destroyed) throw new AssetError('VideoTexture is destroyed.');
    for (const decoder of this.decoders)
      if (decoder.destroyed) this.decoders.delete(decoder);
    if (this.decoders.size >= 4)
      throw new RangeError('VideoTexture supports at most four live decoders.');
    const adapter = await VideoTextureDecoder.create(this, config);
    if (this.destroyed || this.decoders.size >= 4) {
      adapter.destroy();
      throw new AssetError(
        'VideoTexture was destroyed or reached its decoder budget while configuring.',
      );
    }
    this.decoders.add(adapter);
    return adapter;
  }
  private listen(name: string, callback: () => void): void {
    const listener: EventListener = callback;
    this.listeners.push([name, listener]);
    this.video!.addEventListener(name, listener);
  }
  private capture(): void {
    if (this.destroyed || !this.video || this.video.readyState < 2) return;
    try {
      this.copyFrame(this.video);
      this.lastTime = this.video.currentTime;
    } catch (error) {
      this.cancelDelivery();
      this.observe(error);
    }
  }
  private schedule(): void {
    const video = this.video;
    if (
      this.destroyed ||
      !video ||
      video.paused ||
      video.ended ||
      this.callback !== undefined ||
      this.fallback !== undefined
    )
      return;
    if (typeof video.requestVideoFrameCallback === 'function') {
      this.callback = video.requestVideoFrameCallback(() => {
        this.callback = undefined;
        if (this.destroyed || video.paused) return;
        this.capture();
        if (!this.errorValue) this.schedule();
      });
    } else {
      this.fallback = requestAnimationFrame(() => {
        this.fallback = undefined;
        if (this.destroyed) return;
        if (video.currentTime !== this.lastTime) this.capture();
        if (!this.errorValue) this.schedule();
      });
    }
  }
  private cancelDelivery(): void {
    if (this.callback !== undefined)
      this.video?.cancelVideoFrameCallback(this.callback);
    if (this.fallback !== undefined) cancelAnimationFrame(this.fallback);
    this.callback = this.fallback = undefined;
  }
  /** Decoder errors are also observable through the owning source. */
  observe(error: unknown): void {
    this.errorValue = failure(error);
    for (const listener of this.observers) listener(this.errorValue);
  }
  override destroy(): void {
    if (this.destroyed) return;
    this.cancelDelivery();
    for (const [name, listener] of this.listeners)
      this.video?.removeEventListener(name, listener);
    this.listeners.length = 0;
    if (this.abortListener)
      this.abortSignal?.removeEventListener('abort', this.abortListener);
    for (const decoder of this.decoders) decoder.destroy();
    this.decoders.clear();
    if (this.ownVideo && this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.srcObject = null;
      this.video.load();
    }
    this.video = undefined;
    this.observers.clear();
    super.destroy();
  }
}

/** Explicit elementary encoded chunks only. Callers demux containers and provide timestamps. */
export class VideoTextureDecoder {
  private decoder: VideoDecoder;
  private pending: VideoFrame | undefined;
  private queuedBytes = 0;
  private disposed = false;
  private scheduled = false;
  private errorValue: Error | undefined;
  private constructor(
    private readonly texture: VideoTexture,
    config: VideoDecoderConfig,
  ) {
    this.decoder = new VideoDecoder({
      output: (frame) => {
        if (this.disposed || texture.destroyed) {
          frame.close();
          return;
        }
        this.pending?.close();
        this.pending = frame;
        if (!this.scheduled) {
          this.scheduled = true;
          queueMicrotask(() => {
            this.scheduled = false;
            const latest = this.pending;
            this.pending = undefined;
            if (!latest) return;
            if (this.disposed || texture.destroyed) {
              latest.close();
              return;
            }
            try {
              texture.ingest(latest);
            } catch (error) {
              this.fail(error);
            }
          });
        }
      },
      error: (error) => this.fail(error),
    });
    try {
      this.decoder.configure(config);
    } catch (error) {
      this.decoder.close();
      throw error;
    }
    this.decoder.addEventListener('dequeue', () => {
      if (this.decoder.decodeQueueSize === 0) this.queuedBytes = 0;
    });
  }
  static async create(
    texture: VideoTexture,
    config: VideoDecoderConfig,
  ): Promise<VideoTextureDecoder> {
    if (typeof VideoDecoder === 'undefined')
      throw new AssetError(
        'WebCodecs VideoDecoder is unavailable (secure context required).',
      );
    const width = config.codedWidth,
      height = config.codedHeight;
    if (
      !width ||
      !height ||
      width < 1 ||
      height < 1 ||
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width > assetLimits.textureDimension ||
      height > assetLimits.textureDimension ||
      width * height > assetLimits.texturePixels ||
      (config.description &&
        config.description.byteLength > videoTextureLimits.decoderChunkBytes)
    )
      throw new RangeError(
        'Video decoder requires explicit bounded codedWidth/codedHeight and description.',
      );
    const bounded = {
      ...config,
      hardwareAcceleration: config.hardwareAcceleration ?? 'prefer-hardware',
    } satisfies VideoDecoderConfig;
    const supported = await VideoDecoder.isConfigSupported(bounded);
    if (!supported.supported)
      throw new AssetError('WebCodecs decoder configuration is unsupported.');
    if (texture.destroyed)
      throw new AssetError(
        'VideoTexture was destroyed while configuring decoder.',
      );
    return new VideoTextureDecoder(texture, supported.config ?? bounded);
  }
  get lastError(): Error | undefined {
    return this.errorValue;
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  get decodeQueueSize(): number {
    return this.disposed ? 0 : this.decoder.decodeQueueSize;
  }
  /** Throws on backpressure; never retains an unbounded caller chunk queue. */
  decode(chunk: EncodedVideoChunk): void {
    if (this.disposed || this.texture.destroyed)
      throw new AssetError('Video decoder is destroyed.');
    if (this.errorValue) throw this.errorValue;
    if (
      chunk.byteLength > videoTextureLimits.decoderChunkBytes ||
      this.queuedBytes + chunk.byteLength >
        videoTextureLimits.decoderQueuedBytes ||
      this.decoder.decodeQueueSize >= videoTextureLimits.decoderQueue
    )
      throw new RangeError(
        'Video decoder input exceeds its bounded queue; await flush before supplying more chunks.',
      );
    this.decoder.decode(chunk);
    this.queuedBytes += chunk.byteLength;
  }
  async flush(): Promise<void> {
    if (this.disposed) throw new AssetError('Video decoder is destroyed.');
    await this.decoder.flush();
    await Promise.resolve();
    this.queuedBytes = 0;
    if (this.disposed)
      throw new AssetError('Video decoder was destroyed while flushing.');
    if (this.errorValue) throw this.errorValue;
  }
  private fail(error: unknown): void {
    if (this.disposed) return;
    this.errorValue = failure(error);
    this.destroy();
    this.texture.observe(this.errorValue);
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pending?.close();
    this.pending = undefined;
    if (this.decoder.state !== 'closed') this.decoder.close();
    this.queuedBytes = 0;
  }
}
