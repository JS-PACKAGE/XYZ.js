import { AssetError } from './index.js';
import { CanvasTexture2D, type TextureRect2D } from './texture2d.js';
import { assetLimits } from '../../../src/data/assets.js';
import { graphics2dLimits } from '../../../src/data/graphics2d.js';

export interface AnimatedImageOptions {
  /** Total plays, including the first; Infinity repeats forever. Defaults to file metadata. */
  plays?: number;
  signal?: AbortSignal;
}
interface ImageDecoderInstance {
  tracks: {
    ready: Promise<void>;
    selectedTrack?: { frameCount: number; repetitionCount: number };
  };
  completed: Promise<void>;
  decode(options: {
    frameIndex: number;
    completeFramesOnly: boolean;
  }): Promise<{
    image: VideoFrame;
    complete: boolean;
  }>;
  close(): void;
}
interface ImageDecoderConstructor {
  new (options: {
    data: Uint8Array;
    type: string;
    preferAnimation: boolean;
  }): ImageDecoderInstance;
  isTypeSupported(type: string): Promise<boolean>;
}
function decoderAPI(): ImageDecoderConstructor {
  const api = (
    globalThis as typeof globalThis & { ImageDecoder?: ImageDecoderConstructor }
  ).ImageDecoder;
  if (!api)
    throw new AssetError(
      'Animated images require WebCodecs ImageDecoder; no fallback is provided.',
    );
  return api;
}
function aborted(signal?: AbortSignal): void {
  if (signal?.aborted)
    throw (
      signal.reason ??
      new DOMException('Animated image decoding aborted.', 'AbortError')
    );
}
function validatePlays(plays: number): void {
  if (plays !== Infinity && (!Number.isSafeInteger(plays) || plays < 1))
    throw new RangeError(
      'Animated image plays must be a positive safe integer or Infinity.',
    );
}

/** Simulation-time clock; no RAF, wall-clock accumulation or per-update allocation. */
export class AnimatedImageTimeline {
  readonly durations: readonly number[];
  readonly duration: number;
  readonly plays: number;
  private elapsed = 0;
  private index = 0;
  private active = true;
  private finished = false;
  constructor(durations: readonly number[], plays = Infinity) {
    validatePlays(plays);
    if (
      !durations.length ||
      durations.length > graphics2dLimits.frames ||
      durations.some((value) => !Number.isFinite(value) || value <= 0)
    )
      throw new RangeError(
        'Animated image frame durations must be positive finite seconds within the frame budget.',
      );
    this.durations = Object.freeze([...durations]);
    this.duration = durations.reduce((sum, value) => sum + value, 0);
    if (
      !Number.isFinite(this.duration) ||
      !Number.isFinite(this.duration * (plays === Infinity ? 1 : plays))
    )
      throw new RangeError('Animated image duration overflow.');
    this.plays = plays;
  }
  get frame(): number {
    return this.index;
  }
  get playing(): boolean {
    return this.active;
  }
  get ended(): boolean {
    return this.finished;
  }
  pause(): void {
    this.active = false;
  }
  play(): void {
    if (!this.finished) this.active = true;
  }
  reset(): void {
    this.elapsed = 0;
    this.index = 0;
    this.finished = false;
  }
  update(deltaSeconds: number): number {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
      throw new RangeError(
        'Animated image delta must be finite nonnegative seconds.',
      );
    if (!this.active || deltaSeconds === 0) return this.index;
    const total = this.duration * this.plays;
    if (this.plays !== Infinity && deltaSeconds >= total - this.elapsed) {
      this.elapsed = total;
      this.index = this.durations.length - 1;
      this.finished = true;
      this.active = false;
      return this.index;
    }
    // Subtract across the wrap boundary before addition, including near-MAX_VALUE durations.
    if (this.plays === Infinity) {
      const remainder = deltaSeconds % this.duration;
      const untilWrap = this.duration - this.elapsed;
      this.elapsed =
        remainder >= untilWrap
          ? remainder - untilWrap
          : this.elapsed + remainder;
    } else {
      this.elapsed += deltaSeconds;
    }
    let local = this.elapsed % this.duration;
    this.index = 0;
    while (
      this.index < this.durations.length - 1 &&
      local >= this.durations[this.index]!
    ) {
      local -= this.durations[this.index]!;
      this.index++;
    }
    return this.index;
  }
}

export interface AnimatedImageAtlas {
  readonly texture: CanvasTexture2D;
  readonly frames: readonly Readonly<TextureRect2D>[];
  readonly durations: readonly number[];
  /** Atlas owns only its texture; SpriteSheet and consumers borrow it. */
  destroy(): void;
}

/** GIF/APNG decoded exclusively by ImageDecoder, which supplies fully composited/disposed frames. */
export class AnimatedImageTexture extends CanvasTexture2D {
  private readonly timeline: AnimatedImageTimeline;
  private constructor(
    private readonly snapshots: CanvasTexture2D[],
    durations: number[],
    plays: number,
  ) {
    super(snapshots[0]!.image);
    this.timeline = new AnimatedImageTimeline(durations, plays);
  }
  get frame(): number {
    return this.timeline.frame;
  }
  get durations(): readonly number[] {
    return this.timeline.durations;
  }
  get plays(): number {
    return this.timeline.plays;
  }
  get duration(): number {
    return this.timeline.duration;
  }
  get playing(): boolean {
    return !this.destroyed && this.timeline.playing;
  }
  get ended(): boolean {
    return this.timeline.ended;
  }
  /** Copies input bytes before decoding; caller retains its input. All decoded VideoFrames close immediately. */
  static async decode(
    data: Uint8Array,
    type: 'image/gif' | 'image/png',
    options: AnimatedImageOptions = {},
  ): Promise<AnimatedImageTexture> {
    const api = decoderAPI();
    if (type !== 'image/gif' && type !== 'image/png')
      throw new AssetError(
        'Animated images accept GIF or APNG MIME types only.',
      );
    if (!data.byteLength || data.byteLength > assetLimits.textureBytes)
      throw new RangeError(
        'Animated image encoded bytes exceed the texture budget.',
      );
    if (options.plays !== undefined) validatePlays(options.plays);
    aborted(options.signal);
    if (!(await api.isTypeSupported(type)))
      throw new AssetError(
        `ImageDecoder does not support ${type}; no fallback is provided.`,
      );
    aborted(options.signal);
    const decoder = new api({
      data: new Uint8Array(data),
      type,
      preferAnimation: true,
    });
    const frames: CanvasTexture2D[] = [];
    const durations: number[] = [];
    let closed = false;
    const close = () => {
      if (!closed) {
        closed = true;
        decoder.close();
      }
    };
    options.signal?.addEventListener('abort', close, { once: true });
    // Observe completion rejection even if track selection fails first.
    void decoder.completed.catch(() => {});
    try {
      aborted(options.signal);
      await decoder.tracks.ready;
      await decoder.completed;
      aborted(options.signal);
      const track = decoder.tracks.selectedTrack;
      if (
        !track ||
        !Number.isInteger(track.frameCount) ||
        track.frameCount < 1 ||
        track.frameCount > graphics2dLimits.frames
      )
        throw new AssetError('Animated image frame count exceeds its budget.');
      const plays =
        options.plays ??
        (track.repetitionCount === Infinity
          ? Infinity
          : track.repetitionCount + 1);
      validatePlays(plays);
      let pixels = 0;
      for (let index = 0; index < track.frameCount; index++) {
        aborted(options.signal);
        const result = await decoder.decode({
          frameIndex: index,
          completeFramesOnly: true,
        });
        try {
          aborted(options.signal);
          const frame = result.image;
          pixels += frame.displayWidth * frame.displayHeight;
          if (
            !result.complete ||
            pixels > assetLimits.texturePixels ||
            (frames.length > 0 &&
              (frame.displayWidth !== frames[0]!.width ||
                frame.displayHeight !== frames[0]!.height))
          )
            throw new AssetError(
              'Animated image requires complete, equal-sized composited frames within the total pixel budget.',
            );
          // Still images may have no duration. Animated zero/missing timing is not silently rewritten.
          const duration =
            frame.duration === null && track.frameCount === 1
              ? 1
              : (frame.duration ?? 0) / 1_000_000;
          if (!Number.isFinite(duration) || duration <= 0)
            throw new AssetError(
              'Animated image frame duration must be positive.',
            );
          frames.push(new CanvasTexture2D(frame));
          durations.push(duration);
        } finally {
          result.image.close();
        }
      }
      return new AnimatedImageTexture(frames, durations, plays);
    } catch (error) {
      for (const frame of frames) frame.destroy();
      aborted(options.signal);
      throw error;
    } finally {
      options.signal?.removeEventListener('abort', close);
      close();
    }
  }
  private live(): void {
    if (this.destroyed)
      throw new AssetError('AnimatedImageTexture is destroyed.');
  }
  updateAnimation(deltaSeconds: number): void {
    this.live();
    const previous = this.frame;
    this.timeline.update(deltaSeconds);
    if (previous !== this.frame)
      this.copyFrame(this.snapshots[this.frame]!.image);
  }
  play(): void {
    this.live();
    this.timeline.play();
  }
  pause(): void {
    this.live();
    this.timeline.pause();
  }
  reset(): void {
    this.live();
    const previous = this.frame;
    this.timeline.reset();
    if (previous !== 0) this.copyFrame(this.snapshots[0]!.image);
  }
  /** Independent owned atlas; pass texture/frames to SpriteSheet and durations to FrameAnimation. */
  createAtlas(): AnimatedImageAtlas {
    this.live();
    const columns = Math.min(
      this.snapshots.length,
      Math.floor(assetLimits.textureDimension / this.width),
    );
    const rows = Math.ceil(this.snapshots.length / columns);
    const width = columns * this.width,
      height = rows * this.height;
    if (
      height > assetLimits.textureDimension ||
      width * height > assetLimits.texturePixels
    )
      throw new AssetError('Animated image atlas exceeds the texture budget.');
    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    try {
      const context = canvas.getContext('2d') as
        CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
      if (!context)
        throw new AssetError(
          'Animated image atlas requires a 2D canvas context.',
        );
      const frames = this.snapshots.map((snapshot, index) => {
        const frame = Object.freeze({
          x: (index % columns) * this.width,
          y: Math.floor(index / columns) * this.height,
          width: this.width,
          height: this.height,
        });
        context.drawImage(snapshot.image, frame.x, frame.y);
        return frame;
      });
      const texture = new CanvasTexture2D(canvas);
      return {
        texture,
        frames: Object.freeze(frames),
        durations: this.durations,
        destroy: () => texture.destroy(),
      };
    } finally {
      canvas.width = canvas.height = 0;
    }
  }
  override destroy(): void {
    if (this.destroyed) return;
    this.timeline.pause();
    for (const frame of this.snapshots) frame.destroy();
    super.destroy();
  }
}
