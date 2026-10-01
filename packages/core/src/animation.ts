import type { Object3D } from './object3d.js';
import { MorphWeights } from './morph.js';

export type AnimationPath = 'translation' | 'rotation' | 'scale' | 'weights';
export type Interpolation = 'STEP' | 'LINEAR' | 'CUBICSPLINE';

/** Cubic values are glTF triplets: incoming tangent, value, outgoing tangent. */
export class KeyframeTrack {
  readonly times: Float32Array;
  readonly values: Float32Array;
  readonly size: number;
  private readonly scratch: Float64Array;
  constructor(
    readonly target: Object3D | MorphWeights,
    readonly path: AnimationPath,
    times: ArrayLike<number>,
    values: ArrayLike<number>,
    readonly interpolation: Interpolation = 'LINEAR',
  ) {
    if (
      !['translation', 'rotation', 'scale', 'weights'].includes(path) ||
      !['STEP', 'LINEAR', 'CUBICSPLINE'].includes(interpolation)
    )
      throw new RangeError('Unsupported animation track.');
    if ((path === 'weights') !== target instanceof MorphWeights)
      throw new TypeError(
        'Weights tracks target MorphWeights; other tracks target Object3D.',
      );
    this.size =
      target instanceof MorphWeights
        ? target.count
        : path === 'rotation'
          ? 4
          : 3;
    this.scratch = new Float64Array(this.size);
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

  /**
   * Samples the track at `time` into its target. Weights below 1 blend over what the target
   * already holds, so a later, lower-weight track layers over an earlier one.
   */
  sample(time: number, weight = 1): void {
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
    const out = this.scratch;
    for (let j = 0; j < size; j++) {
      if (cubic && first !== second) {
        const t2 = t * t,
          t3 = t2 * t;
        out[j] =
          (2 * t3 - 3 * t2 + 1) * values[a + j] +
          (t3 - 2 * t2 + t) * dt * values[a + size + j] +
          (-2 * t3 + 3 * t2) * values[b + j] +
          (t3 - t2) * dt * values[b - size + j];
      } else out[j] = wa * values[a + j] + wb * sign * values[b + j];
    }
    this.apply(out, weight);
  }

  /** Writes `out` to the target; a weight below 1 layers it over the target's current pose. */
  private apply(out: Float64Array, weight: number): void {
    const target = this.target;
    const size = this.size;
    if (weight <= 0) return;
    if (target instanceof MorphWeights) {
      for (let j = 0; j < size; j++) {
        const current = target.get(j);
        target.set(
          j,
          weight >= 1 ? out[j] : current + (out[j] - current) * weight,
        );
      }
    } else if (this.path === 'rotation') {
      const q = target.rotation;
      if (weight < 1) {
        // Shortest-path normalized lerp from the current rotation.
        const dot = q.x * out[0] + q.y * out[1] + q.z * out[2] + q.w * out[3];
        const side = dot < 0 ? -1 : 1;
        out[0] = q.x + (out[0] * side - q.x) * weight;
        out[1] = q.y + (out[1] * side - q.y) * weight;
        out[2] = q.z + (out[2] * side - q.z) * weight;
        out[3] = q.w + (out[3] * side - q.w) * weight;
      }
      q.set(out[0], out[1], out[2], out[3]).normalize();
    } else {
      const vector =
        this.path === 'translation' ? target.position : target.scale;
      if (weight < 1) {
        out[0] = vector.x + (out[0] - vector.x) * weight;
        out[1] = vector.y + (out[1] - vector.y) * weight;
        out[2] = vector.z + (out[2] - vector.z) * weight;
      }
      vector.set(out[0], out[1], out[2]);
    }
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

export type AnimationLoopMode = 'once' | 'repeat' | 'pingpong';
export type AnimationEventType = 'finished' | 'loop';
export type AnimationListener = (action: AnimationAction) => void;

/** Something the mixer consults before advancing actions, such as an AnimationStateMachine. */
export interface AnimationController {
  evaluate(delta: number): void;
}

function finiteTime(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(`${label} must be finite and nonnegative.`);
  return value;
}

export class AnimationAction {
  timeScale = 1;
  playing = false;
  /** Base blend weight in [0, 1]; multiplied by the fade factor. */
  weight = 1;
  loopMode: AnimationLoopMode = 'repeat';
  private clipTime = 0;
  private elapsed = 0;
  private fade = 1;
  private fadeTarget = 1;
  private fadeRate = 0;
  private readonly listeners: Record<
    AnimationEventType,
    Set<AnimationListener>
  > = {
    finished: new Set(),
    loop: new Set(),
  };

  /** Action fading in over this one; this action stops once that fade is complete. */
  private successor: AnimationAction | undefined;

  /** @internal Set by the mixer so crossFadeTo can order the layers. */
  mixer: AnimationMixer | undefined;

  constructor(readonly clip: AnimationClip) {}

  /** Compatibility switch for `loopMode`: true repeats, false plays once. */
  get loop(): boolean {
    return this.loopMode !== 'once';
  }
  set loop(value: boolean) {
    this.loopMode = value ? 'repeat' : 'once';
  }
  /** Position inside the clip in seconds. Assigning it seeks without sampling until the next update. */
  get time(): number {
    return this.clipTime;
  }
  set time(value: number) {
    finiteTime(value, 'Animation time');
    this.clipTime = this.elapsed = value;
  }
  /** Weight after fading; this is what the mixer applies. */
  get effectiveWeight(): number {
    return Math.min(1, Math.max(0, this.weight)) * this.fade;
  }
  get fading(): boolean {
    return this.fadeRate > 0;
  }

  /** Clip position as a fraction of the duration, 0 for an empty clip. */
  get normalizedTime(): number {
    return this.clip.duration > 0 ? this.clipTime / this.clip.duration : 0;
  }
  on(event: AnimationEventType, listener: AnimationListener): this {
    this.listeners[event].add(listener);
    return this;
  }
  off(event: AnimationEventType, listener: AnimationListener): this {
    this.listeners[event].delete(listener);
    return this;
  }

  play(): this {
    this.playing = true;
    return this;
  }
  stop(): this {
    this.playing = false;
    this.successor = undefined;
    this.clipTime = this.elapsed = 0;
    this.fade = this.fadeTarget = 1;
    this.fadeRate = 0;
    return this;
  }
  /** Starts playing with the fade factor rising from 0 to 1 over `duration` seconds. */
  fadeIn(duration: number): this {
    finiteTime(duration, 'Fade duration');
    // An action that is still fading out resumes from its current factor instead of popping to 0.
    const from = this.playing ? this.fade : 0;
    this.play();
    return this.fadeTo(1, duration, from);
  }
  /** Fades to 0 over `duration` seconds, then stops (and resets) the action. */
  fadeOut(duration: number): this {
    finiteTime(duration, 'Fade duration');
    return this.fadeTo(0, duration);
  }
  /**
   * Fades `other` in on top of this action over `duration` seconds; this action keeps playing at
   * full weight underneath, so the pose is a straight mix, and stops when the fade completes.
   */
  crossFadeTo(other: AnimationAction, duration: number): this {
    if (other === this)
      throw new RangeError('Cannot cross-fade an action to itself.');
    finiteTime(duration, 'Fade duration');
    this.mixer?.raise(other);
    other.fadeIn(duration);
    this.successor = other;
    if (duration === 0) this.supersede();
    return this;
  }

  private fadeTo(target: number, duration: number, from = this.fade): this {
    this.fade = from;
    this.fadeTarget = target;
    if (duration === 0) {
      this.fade = target;
      this.fadeRate = 0;
      if (target === 0) this.stop();
    } else this.fadeRate = Math.abs(target - from) / duration;
    return this;
  }

  /** @internal Stops this action once the action cross-faded over it is fully in. */
  supersede(): void {
    const successor = this.successor;
    if (!successor || successor.fading) return;
    this.successor = undefined;
    this.stop();
  }

  /** Advances time and fading, then samples the clip with `effectiveWeight`; false if not playing. */
  update(delta: number): boolean {
    if (!this.playing) return false;
    if (!Number.isFinite(this.timeScale) || !Number.isFinite(this.elapsed))
      throw new RangeError('Animation time must be finite.');
    if (this.fadeRate > 0) {
      const step = this.fadeRate * delta;
      this.fade =
        this.fadeTarget > this.fade
          ? Math.min(this.fadeTarget, this.fade + step)
          : Math.max(this.fadeTarget, this.fade - step);
      if (this.fade === this.fadeTarget) this.fadeRate = 0;
    }
    const duration = this.clip.duration;
    const previous = this.elapsed;
    const next = previous + delta * this.timeScale;
    if (!Number.isFinite(next))
      throw new RangeError('Animation time overflow.');
    let finished = false;
    let wraps = 0;
    if (duration <= 0) this.clipTime = this.elapsed = 0;
    else if (this.loopMode === 'once') {
      this.elapsed = this.clipTime = Math.max(0, Math.min(duration, next));
      finished =
        (this.timeScale >= 0 && next >= duration) ||
        (this.timeScale < 0 && next <= 0);
    } else if (this.loopMode === 'repeat') {
      wraps = Math.abs(
        Math.floor(next / duration) - Math.floor(previous / duration),
      );
      this.elapsed = next;
      this.clipTime = ((next % duration) + duration) % duration;
    } else {
      // Ping-pong runs the clip forward then backward; one wrap is one full turnaround.
      const period = duration * 2;
      wraps = Math.abs(
        Math.floor(next / period) - Math.floor(previous / period),
      );
      this.elapsed = next;
      const phase = ((next % period) + period) % period;
      this.clipTime = phase <= duration ? phase : period - phase;
    }
    const weight = this.effectiveWeight;
    for (const track of this.clip.tracks) track.sample(this.clipTime, weight);
    if (wraps > 0)
      for (const listener of [...this.listeners.loop]) listener(this);
    if (finished) {
      this.playing = false;
      for (const listener of [...this.listeners.finished]) listener(this);
    } else if (
      this.fadeTarget === 0 &&
      this.fadeRate === 0 &&
      this.fade === 0
    ) {
      // A finished fade-out leaves the layer silent; stop it so it stops costing sampling.
      this.stop();
    }
    return true;
  }
}

/**
 * Actions are layered in insertion order: each samples over the pose left by the actions before
 * it, scaled by its weight, so weight 1 replaces (the last full-weight action wins, as before)
 * and partial weights blend. `crossFadeTo` raises the incoming action to the top layer.
 */
export class AnimationMixer {
  private readonly actions = new Map<AnimationClip, AnimationAction>();
  private readonly controllers = new Set<AnimationController>();
  private destroyed = false;
  clipAction(clip: AnimationClip): AnimationAction {
    if (this.destroyed) throw new Error('AnimationMixer is destroyed.');
    let action = this.actions.get(clip);
    if (!action) {
      action = new AnimationAction(clip);
      action.mixer = this;
      this.actions.set(clip, action);
    }
    return action;
  }
  /** @internal Controllers evaluate before each update so they can start fades. */
  addController(controller: AnimationController): () => void {
    this.controllers.add(controller);
    return () => this.controllers.delete(controller);
  }
  /** @internal Moves an action to the top layer. */
  raise(action: AnimationAction): void {
    if (this.actions.get(action.clip) !== action) return;
    this.actions.delete(action.clip);
    this.actions.set(action.clip, action);
  }
  update(delta: number): void {
    if (!Number.isFinite(delta) || delta < 0)
      throw new RangeError('Animation delta must be nonnegative and finite.');
    if (this.destroyed) return;
    for (const controller of [...this.controllers]) controller.evaluate(delta);
    const running = [...this.actions.values()];
    for (const action of running) action.update(delta);
    for (const action of running) action.supersede();
  }
  stopAll(): void {
    for (const action of this.actions.values()) action.stop();
  }
  destroy(): void {
    this.stopAll();
    this.actions.clear();
    this.controllers.clear();
    this.destroyed = true;
  }
}
