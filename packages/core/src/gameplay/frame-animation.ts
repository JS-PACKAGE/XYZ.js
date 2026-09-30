import type { Sprite } from '../sprite.js';
import { validateSource, type Rect2D } from './contracts.js';

export interface AnimationFrame2D {
  source: Rect2D;
  duration: number;
}
export interface FrameAnimationOptions {
  strategy?: 'loop' | 'pingpong' | 'freeze' | 'hide';
  speed?: number;
}

/** Sprite atlas playback in simulation seconds; no wall-clock scheduler. */
export class FrameAnimation extends EventTarget {
  readonly frames: readonly AnimationFrame2D[];
  readonly strategy: NonNullable<FrameAnimationOptions['strategy']>;
  speed: number;
  private readonly order: number[] = [];
  private readonly ends: number[] = [];
  private readonly duration: number;
  private phase = 0;
  private direction = 1;
  private currentFrame = 0;
  private active = false;

  constructor(
    readonly sprite: Sprite,
    frames: readonly AnimationFrame2D[],
    options: FrameAnimationOptions = {},
  ) {
    super();
    if (!frames.length || frames.length > 16384)
      throw new RangeError('FrameAnimation requires 1–16384 frames.');
    this.frames = frames.map((frame) => {
      validateSource(frame.source, sprite.texture.width, sprite.texture.height);
      if (!Number.isFinite(frame.duration) || frame.duration <= 0)
        throw new RangeError(
          'Frame durations must be positive finite seconds.',
        );
      return Object.freeze({
        source: Object.freeze({ ...frame.source }),
        duration: frame.duration,
      });
    });
    this.strategy = options.strategy ?? 'loop';
    if (!['loop', 'pingpong', 'freeze', 'hide'].includes(this.strategy))
      throw new RangeError('Unknown animation strategy.');
    this.speed = options.speed ?? 1;
    if (!Number.isFinite(this.speed) || this.speed < 0)
      throw new RangeError('Animation speed must be finite and nonnegative.');
    for (let i = 0; i < frames.length; i++) this.order.push(i);
    if (this.strategy === 'pingpong')
      for (let i = frames.length - 2; i > 0; i--) this.order.push(i);
    let end = 0;
    for (const index of this.order) {
      end += this.frames[index].duration;
      this.ends.push(end);
    }
    if (!Number.isFinite(end))
      throw new RangeError('Animation duration overflow.');
    this.duration = end;
    sprite.animation = this;
    this.applyFrame(0);
  }
  get frame(): number {
    return this.currentFrame;
  }
  get playing(): boolean {
    return this.active;
  }
  play(): this {
    if (this.sprite.destroyed)
      throw new Error('Cannot play an animation on a destroyed Sprite.');
    this.active = true;
    return this;
  }
  pause(): this {
    this.active = false;
    return this;
  }
  reset(): this {
    this.phase = 0;
    this.direction = 1;
    this.sprite.visible = true;
    this.applyFrame(0);
    return this;
  }
  reverse(): this {
    this.direction *= -1;
    return this;
  }
  goToFrame(index: number): this {
    if (!Number.isInteger(index) || index < 0 || index >= this.frames.length)
      throw new RangeError('Invalid animation frame index.');
    this.phase = index === 0 ? 0 : this.ends[index - 1];
    this.applyFrame(index);
    return this;
  }
  stop(): this {
    this.active = false;
    return this.reset();
  }

  /** @internal Scene advances only animations still attached to an owned Sprite. */
  update(deltaTime: number): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0)
      throw new RangeError('Animation delta must be finite and nonnegative.');
    if (!this.active || this.sprite.destroyed || this.sprite.animation !== this)
      return;
    if (!Number.isFinite(this.speed) || this.speed < 0)
      throw new RangeError('Animation speed must be finite and nonnegative.');
    const next = this.phase + deltaTime * this.speed * this.direction;
    if (!Number.isFinite(next))
      throw new RangeError('Animation time overflow.');
    let loops = 0;
    let ended = false;
    if (this.strategy === 'loop' || this.strategy === 'pingpong') {
      loops = Math.abs(
        Math.floor(next / this.duration) -
          Math.floor(this.phase / this.duration),
      );
      this.phase = ((next % this.duration) + this.duration) % this.duration;
    } else {
      this.phase = Math.max(0, Math.min(this.duration, next));
      ended = this.direction > 0 ? next >= this.duration : next <= 0;
      if (ended) this.active = false;
    }
    let low = 0,
      high = this.ends.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.phase < this.ends[mid]) high = mid;
      else low = mid + 1;
    }
    this.applyFrame(this.order[low]);
    if (loops && !this.sprite.destroyed)
      this.emit('animationloop', { count: loops, frame: this.frame });
    if (ended && !this.sprite.destroyed) {
      if (this.strategy === 'hide') this.sprite.visible = false;
      this.emit('animationend', { frame: this.frame });
    }
  }
  private applyFrame(index: number): void {
    this.sprite.setAnimationSource(this.frames[index].source);
    if (this.currentFrame === index) return;
    this.currentFrame = index;
    this.emit('animationframe', { frame: index });
  }
  private emit(type: string, detail: { frame: number; count?: number }): void {
    this.dispatchEvent(new CustomEvent(type, { detail }));
    this.sprite.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
