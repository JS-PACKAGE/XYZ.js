import type { Object3D } from './object3d.js';

export type AnimationPath = 'translation' | 'rotation' | 'scale';
export type Interpolation = 'STEP' | 'LINEAR' | 'CUBICSPLINE';

/** Cubic values are glTF triplets: incoming tangent, value, outgoing tangent. */
export class KeyframeTrack {
  readonly times: Float32Array;
  readonly values: Float32Array;
  readonly size: number;
  constructor(
    readonly target: Object3D,
    readonly path: AnimationPath,
    times: ArrayLike<number>,
    values: ArrayLike<number>,
    readonly interpolation: Interpolation = 'LINEAR',
  ) {
    if (
      !['translation', 'rotation', 'scale'].includes(path) ||
      !['STEP', 'LINEAR', 'CUBICSPLINE'].includes(interpolation)
    )
      throw new RangeError('Unsupported animation track.');
    this.size = path === 'rotation' ? 4 : 3;
    if (
      !times.length ||
      values.length !==
        times.length * this.size * (interpolation === 'CUBICSPLINE' ? 3 : 1)
    )
      throw new RangeError('Animation keyframe counts do not match.');
    this.times = Float32Array.from(times);
    this.values = Float32Array.from(values);
    for (let i = 0; i < this.times.length; i++) {
      if (
        !Number.isFinite(this.times[i]) ||
        this.times[i] < 0 ||
        (i > 0 && this.times[i] <= this.times[i - 1])
      )
        throw new RangeError(
          'Animation times must be finite, nonnegative, and strictly increasing.',
        );
    }
    for (const value of this.values)
      if (!Number.isFinite(value))
        throw new RangeError('Animation values must be finite.');
    if (path === 'rotation') {
      const stride = this.size * (interpolation === 'CUBICSPLINE' ? 3 : 1);
      const offset = interpolation === 'CUBICSPLINE' ? 4 : 0;
      for (let i = offset; i < this.values.length; i += stride) {
        const length = Math.hypot(
          this.values[i],
          this.values[i + 1],
          this.values[i + 2],
          this.values[i + 3],
        );
        if (length === 0)
          throw new RangeError('Animation quaternion cannot be zero.');
        for (let j = 0; j < 4; j++) this.values[i + j] /= length;
      }
    }
  }

  sample(time: number): void {
    const times = this.times,
      values = this.values,
      size = this.size;
    let low = 0,
      high = times.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (times[mid] <= time) low = mid;
      else high = mid - 1;
    }
    const first = low;
    const second =
      time <= times[0] ||
      first === times.length - 1 ||
      this.interpolation === 'STEP'
        ? first
        : first + 1;
    const dt = times[second] - times[first];
    const t = dt > 0 ? Math.max(0, Math.min(1, (time - times[first]) / dt)) : 0;
    const cubic = this.interpolation === 'CUBICSPLINE';
    const a = first * size * (cubic ? 3 : 1) + (cubic ? size : 0);
    const b = second * size * (cubic ? 3 : 1) + (cubic ? size : 0);
    let wa = 1 - t,
      wb = t,
      sign = 1;
    if (this.path === 'rotation' && !cubic) {
      let dot = 0;
      for (let j = 0; j < 4; j++) dot += values[a + j] * values[b + j];
      if (dot < 0) {
        sign = -1;
        dot = -dot;
      }
      if (dot < 0.9995) {
        const angle = Math.acos(Math.min(1, dot));
        const sine = Math.sin(angle);
        wa = Math.sin((1 - t) * angle) / sine;
        wb = Math.sin(t * angle) / sine;
      }
    }
    let x = 0,
      y = 0,
      z = 0,
      w = 0;
    for (let j = 0; j < size; j++) {
      let value: number;
      if (cubic && first !== second) {
        const t2 = t * t,
          t3 = t2 * t;
        value =
          (2 * t3 - 3 * t2 + 1) * values[a + j] +
          (t3 - 2 * t2 + t) * dt * values[a + size + j] +
          (-2 * t3 + 3 * t2) * values[b + j] +
          (t3 - t2) * dt * values[b - size + j];
      } else value = wa * values[a + j] + wb * sign * values[b + j];
      if (j === 0) x = value;
      else if (j === 1) y = value;
      else if (j === 2) z = value;
      else w = value;
    }
    if (this.path === 'rotation')
      this.target.rotation.set(x, y, z, w).normalize();
    else
      (this.path === 'translation'
        ? this.target.position
        : this.target.scale
      ).set(x, y, z);
  }
}

export class AnimationClip {
  readonly tracks: readonly KeyframeTrack[];
  readonly duration: number;
  constructor(
    readonly name: string,
    tracks: readonly KeyframeTrack[],
  ) {
    this.tracks = [...tracks];
    let duration = 0;
    for (const track of tracks)
      duration = Math.max(duration, track.times[track.times.length - 1]);
    this.duration = duration;
  }
}

export class AnimationAction {
  loop = true;
  timeScale = 1;
  time = 0;
  playing = false;
  constructor(readonly clip: AnimationClip) {}
  play(): this {
    this.playing = true;
    return this;
  }
  stop(): this {
    this.playing = false;
    this.time = 0;
    return this;
  }
  update(delta: number): void {
    if (!this.playing) return;
    if (!Number.isFinite(this.timeScale) || !Number.isFinite(this.time))
      throw new RangeError('Animation time must be finite.');
    const duration = this.clip.duration;
    const next = this.time + delta * this.timeScale;
    if (!Number.isFinite(next))
      throw new RangeError('Animation time overflow.');
    if (this.loop && duration > 0)
      this.time = ((next % duration) + duration) % duration;
    else {
      this.time = Math.max(0, Math.min(duration, next));
      if (
        (this.timeScale >= 0 && next >= duration) ||
        (this.timeScale < 0 && next <= 0)
      )
        this.playing = false;
    }
    for (const track of this.clip.tracks) track.sample(this.time);
  }
}

/** Concurrent actions apply in insertion order; the last action targeting a property wins. */
export class AnimationMixer {
  private readonly actions = new Map<AnimationClip, AnimationAction>();
  private destroyed = false;
  clipAction(clip: AnimationClip): AnimationAction {
    if (this.destroyed) throw new Error('AnimationMixer is destroyed.');
    let action = this.actions.get(clip);
    if (!action) {
      action = new AnimationAction(clip);
      this.actions.set(clip, action);
    }
    return action;
  }
  update(delta: number): void {
    if (!Number.isFinite(delta) || delta < 0)
      throw new RangeError('Animation delta must be nonnegative and finite.');
    if (this.destroyed) return;
    for (const action of this.actions.values()) action.update(delta);
  }
  stopAll(): void {
    for (const action of this.actions.values()) action.stop();
  }
  destroy(): void {
    this.stopAll();
    this.actions.clear();
    this.destroyed = true;
  }
}
