import type {
  AnimationAction,
  AnimationClip,
  AnimationController,
  AnimationLoopMode,
  AnimationMixer,
} from './animation.js';
import type { AnimationMask } from './animation-pose.js';

export interface AnimationBlendPoint1D {
  clip: AnimationClip;
  value: number;
}
export interface AnimationBlendPoint2D {
  clip: AnimationClip;
  x: number;
  y: number;
}
export interface AnimationBlendTreeTiming {
  /** Exponential parameter response in seconds; 0 snaps to the requested parameter. */
  smoothing?: number;
  loopMode?: AnimationLoopMode;
  mask?: AnimationMask;
}
export interface AnimationBlendTree1DOptions extends AnimationBlendTreeTiming {
  dimension: '1d';
  points: readonly AnimationBlendPoint1D[];
  parameter?: number;
}
export interface AnimationBlendTree2DOptions extends AnimationBlendTreeTiming {
  dimension: '2d';
  points: readonly AnimationBlendPoint2D[];
  /** Explicit nondegenerate triangles, indexing points. Outside points clamp to nearest edge. */
  triangles: readonly (readonly [number, number, number])[];
  parameter?: Readonly<{ x: number; y: number }>;
}
export type AnimationBlendTreeOptions =
  AnimationBlendTree1DOptions | AnimationBlendTree2DOptions;

/**
 * Synchronized sampled actions, not a second pose pipeline. Leaves must have the same ordered
 * target/property channels and distinct positive-duration clips; this controller owns their
 * time/weight/playback while attached. 2D interpolation uses authored triangle topology.
 */
export class AnimationBlendTree implements AnimationController {
  readonly weights: Float64Array;
  readonly parameter = { x: 0, y: 0 };
  readonly actions: readonly AnimationAction[];
  timeScale = 1;
  loopMode: AnimationLoopMode;
  playing = false;
  private phase = 0;
  private requestedX = 0;
  private requestedY = 0;
  private readonly x: Float64Array;
  private readonly y: Float64Array;
  private readonly triangles: readonly (readonly [number, number, number])[];
  private readonly smoothing: number;
  private readonly dimension: '1d' | '2d';
  private readonly unregister: () => void;
  private destroyed = false;

  constructor(
    private readonly mixer: AnimationMixer,
    options: AnimationBlendTreeOptions,
  ) {
    this.dimension = options.dimension;
    this.smoothing = options.smoothing ?? 0;
    if (
      !Number.isFinite(this.smoothing) ||
      this.smoothing < 0 ||
      options.points.length < 2
    )
      throw new RangeError(
        'Blend trees require at least two points and nonnegative smoothing.',
      );
    this.loopMode = options.loopMode ?? 'repeat';
    this.x = new Float64Array(options.points.length);
    this.y = new Float64Array(options.points.length);
    this.weights = new Float64Array(options.points.length);
    const clips = new Set<AnimationClip>();
    const first = options.points[0].clip.tracks;
    for (let i = 0; i < options.points.length; i++) {
      const point = options.points[i];
      if (
        clips.has(point.clip) ||
        point.clip.duration <= 0 ||
        point.clip.tracks.length !== first.length
      )
        throw new RangeError(
          'Blend leaves require distinct positive-duration clips with identical channels.',
        );
      clips.add(point.clip);
      for (let j = 0; j < first.length; j++)
        if (
          first[j].target !== point.clip.tracks[j].target ||
          first[j].path !== point.clip.tracks[j].path
        )
          throw new RangeError(
            'Blend leaf target/property channels must match.',
          );
      this.x[i] = 'value' in point ? point.value : point.x;
      this.y[i] = 'value' in point ? 0 : point.y;
      if (
        !Number.isFinite(this.x[i]) ||
        !Number.isFinite(this.y[i]) ||
        (this.dimension === '1d' && i > 0 && this.x[i] <= this.x[i - 1])
      )
        throw new RangeError(
          'Blend points must be finite; 1D points must be strictly ordered.',
        );
    }
    this.triangles =
      options.dimension === '2d'
        ? options.triangles.map(
            (triangle) => [...triangle] as [number, number, number],
          )
        : [];
    if (this.dimension === '2d' && !this.triangles.length)
      throw new RangeError(
        '2D blend trees require explicit triangle topology.',
      );
    const covered = new Set<number>();
    for (const [a, b, c] of this.triangles) {
      for (const index of [a, b, c]) {
        if (!Number.isInteger(index) || index < 0 || index >= this.x.length)
          throw new RangeError('Invalid blend triangle index.');
        covered.add(index);
      }
      const area =
        (this.x[b] - this.x[a]) * (this.y[c] - this.y[a]) -
        (this.y[b] - this.y[a]) * (this.x[c] - this.x[a]);
      if (!Number.isFinite(area) || Math.abs(area) < 1e-12)
        throw new RangeError('Blend triangles cannot be degenerate.');
    }
    if (this.dimension === '2d' && covered.size !== this.x.length)
      throw new RangeError('Every 2D blend point must belong to a triangle.');
    const parameter = options.parameter ?? 0;
    this.setParameter(
      typeof parameter === 'number' ? parameter : parameter.x,
      typeof parameter === 'number' ? 0 : parameter.y,
    );
    this.parameter.x = this.requestedX;
    this.parameter.y = this.requestedY;
    this.calculateWeights();
    this.actions = options.points.map((point) => {
      const action = mixer.clipAction(point.clip);
      if (action.playing) throw new Error('Blend leaf is already playing.');
      action.mask = options.mask;
      action.setAdditive(undefined);
      return action;
    });
    this.unregister = mixer.addController(this);
  }
  setParameter(x: number, y = 0): this {
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new RangeError('Blend parameters must be finite.');
    this.requestedX = x;
    this.requestedY = y;
    return this;
  }
  get normalizedTime(): number {
    return this.phase <= 1 ? this.phase : 2 - this.phase;
  }
  set normalizedTime(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new RangeError('Blend normalized time must be in [0, 1].');
    this.phase = value;
  }
  play(): this {
    if (this.destroyed) throw new Error('AnimationBlendTree is destroyed.');
    this.playing = true;
    for (const action of this.actions) {
      action.play();
      this.mixer.raise(action);
    }
    return this;
  }
  pause(): this {
    this.playing = false;
    for (const action of this.actions) action.playing = false;
    return this;
  }
  stop(): this {
    this.pause();
    this.phase = 0;
    for (const action of this.actions) action.stop();
    return this;
  }
  evaluate(delta: number): void {
    if (!this.playing || this.destroyed) return;
    // Mixer.stopAll also stops controller-owned leaves, without resurrecting them next tick.
    let running = false;
    for (let i = 0; i < this.actions.length; i++)
      if (this.actions[i].playing) {
        running = true;
        break;
      }
    if (!running) {
      this.playing = false;
      return;
    }
    if (!Number.isFinite(this.timeScale))
      throw new RangeError('Blend time scale must be finite.');
    const response =
      this.smoothing === 0 ? 1 : -Math.expm1(-delta / this.smoothing);
    this.parameter.x += (this.requestedX - this.parameter.x) * response;
    this.parameter.y += (this.requestedY - this.parameter.y) * response;
    this.calculateWeights();
    let duration = 0;
    for (let i = 0; i < this.actions.length; i++)
      duration += this.weights[i] * this.actions[i].clip.duration;
    let cumulative = 0;
    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      cumulative += this.weights[i];
      // Ordered layers need conditional weights to yield the normalized weighted pose.
      action.weight = cumulative > 0 ? this.weights[i] / cumulative : 0;
      action.loopMode = this.loopMode;
      action.time = this.phase * action.clip.duration;
      action.timeScale = (this.timeScale * action.clip.duration) / duration;
      action.play();
    }
    const next = this.phase + (delta * this.timeScale) / duration;
    if (!Number.isFinite(next)) throw new RangeError('Blend time overflow.');
    if (this.loopMode === 'once') {
      this.phase = Math.max(0, Math.min(1, next));
      if (
        (this.timeScale >= 0 && next >= 1) ||
        (this.timeScale < 0 && next <= 0)
      )
        this.playing = false;
    } else {
      const period = this.loopMode === 'pingpong' ? 2 : 1;
      this.phase = ((next % period) + period) % period;
    }
  }
  private calculateWeights(): void {
    this.weights.fill(0);
    const px = this.parameter.x,
      py = this.parameter.y;
    if (this.dimension === '1d') {
      if (px <= this.x[0]) {
        this.weights[0] = 1;
        return;
      }
      const last = this.x.length - 1;
      if (px >= this.x[last]) {
        this.weights[last] = 1;
        return;
      }
      for (let i = 1; i <= last; i++) {
        if (px > this.x[i]) continue;
        const t = (px - this.x[i - 1]) / (this.x[i] - this.x[i - 1]);
        this.weights[i - 1] = 1 - t;
        this.weights[i] = t;
        return;
      }
    }
    let best = Infinity,
      bestA = 0,
      bestB = 0,
      bestT = 0;
    for (let i = 0; i < this.triangles.length; i++) {
      const triangle = this.triangles[i];
      const a = triangle[0],
        b = triangle[1],
        c = triangle[2];
      const bx = this.x[b] - this.x[a],
        by = this.y[b] - this.y[a];
      const cx = this.x[c] - this.x[a],
        cy = this.y[c] - this.y[a];
      const dx = px - this.x[a],
        dy = py - this.y[a];
      const area = bx * cy - by * cx;
      const wb = (dx * cy - dy * cx) / area;
      const wc = (bx * dy - by * dx) / area;
      const wa = 1 - wb - wc;
      if (wa >= 0 && wb >= 0 && wc >= 0) {
        this.weights[a] = wa;
        this.weights[b] = wb;
        this.weights[c] = wc;
        return;
      }
      for (let edge = 0; edge < 3; edge++) {
        const from = edge === 0 ? a : edge === 1 ? b : c;
        const to = edge === 0 ? b : edge === 1 ? c : a;
        const ex = this.x[to] - this.x[from],
          ey = this.y[to] - this.y[from];
        const t = Math.max(
          0,
          Math.min(
            1,
            ((px - this.x[from]) * ex + (py - this.y[from]) * ey) /
              (ex * ex + ey * ey),
          ),
        );
        const distance = Math.hypot(
          this.x[from] + ex * t - px,
          this.y[from] + ey * t - py,
        );
        if (distance < best) {
          best = distance;
          bestA = from;
          bestB = to;
          bestT = t;
        }
      }
    }
    this.weights[bestA] = 1 - bestT;
    this.weights[bestB] = bestT;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.stop();
    this.unregister();
    this.destroyed = true;
  }
}
