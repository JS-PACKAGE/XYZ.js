import { Quaternion } from '../../math/src/index.js';
import {
  AnimationRootMotionSampler,
  type AnimationRootMotion,
} from './animation-root-motion.js';
import {
  AnimationPoseOverlay,
  blendRotation,
  multiplyRotation,
} from './animation-pose.js';
import type {
  AnimationMask,
  AnimationPoseChannel,
  AnimationReferencePose,
  AnimationTarget,
} from './animation-pose.js';
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
  private readonly deltaRotation = new Quaternion();
  private readonly referenceRotation = new Quaternion();
  private readonly identityRotation = new Quaternion();
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
  sample(time: number, weight = 1, reference?: Float64Array): void {
    this.sampleValues(time, this.scratch);
    if (reference) this.applyAdditive(this.scratch, weight, reference);
    else this.apply(this.scratch, weight);
  }

  /** Samples without touching the borrowed target; `out` must have exactly `size` elements. */
  sampleValues(time: number, out: Float64Array): void {
    if (!Number.isFinite(time) || out.length !== this.size)
      throw new RangeError('Invalid animation sample time or output size.');
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
    if (this.path === 'rotation') {
      const length = Math.hypot(out[0], out[1], out[2], out[3]);
      if (!length)
        throw new RangeError('Sampled animation quaternion is zero.');
      for (let j = 0; j < 4; j++) out[j] /= length;
    }
  }

  private applyAdditive(
    out: Float64Array,
    weight: number,
    reference: Float64Array,
  ): void {
    if (weight <= 0) return;
    const target = this.target;
    if (target instanceof MorphWeights) {
      for (let i = 0; i < this.size; i++)
        target.set(i, target.get(i) + (out[i] - reference[i]) * weight);
    } else if (this.path === 'rotation') {
      this.referenceRotation.set(
        -reference[0],
        -reference[1],
        -reference[2],
        reference[3],
      );
      this.deltaRotation.set(out[0], out[1], out[2], out[3]).normalize();
      multiplyRotation(
        this.referenceRotation,
        this.deltaRotation,
        this.deltaRotation,
      );
      blendRotation(
        this.identityRotation,
        this.deltaRotation,
        weight,
        this.deltaRotation,
      );
      multiplyRotation(target.rotation, this.deltaRotation, target.rotation);
    } else {
      const v = this.path === 'translation' ? target.position : target.scale;
      if (this.path === 'translation')
        v.set(
          v.x + (out[0] - reference[0]) * weight,
          v.y + (out[1] - reference[1]) * weight,
          v.z + (out[2] - reference[2]) * weight,
        );
      else
        v.set(
          v.x * (1 + (out[0] / reference[0] - 1) * weight),
          v.y * (1 + (out[1] / reference[1] - 1) * weight),
          v.z * (1 + (out[2] / reference[2] - 1) * weight),
        );
    }
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
  destroy?(): void;
}

/** Post-sampling local-pose solver; borrows targets and runs before renderer deformation. */
export interface AnimationConstraint {
  enabled: boolean;
  readonly channels: readonly AnimationPoseChannel[];
  solve(delta: number): void;
  destroy(): void;
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
  mask: AnimationMask | undefined;
  private references: readonly Float64Array[] | undefined;
  private motion: AnimationRootMotionSampler | undefined;

  /** Extracts root TR deltas instead of writing those tracks to the skeleton root. */
  setRootMotion(binding: AnimationRootMotion | undefined): this {
    if (binding && !this.mixer)
      throw new Error('Root motion requires an AnimationMixer.');
    const next = binding
      ? new AnimationRootMotionSampler(binding, this.clip)
      : undefined;
    if (binding) binding.attach(this, this.mixer!);
    if (this.motion?.binding !== binding) this.motion?.release(this);
    else this.motion?.cancel(this);
    this.motion = next;
    return this;
  }

  /** @internal Releases borrowed root bindings when the mixer is cleared. */
  releaseRootMotion(): void {
    this.motion?.release(this);
    this.motion = undefined;
  }

  /** Mixer-owned actions can use explicit reference-relative TRS/morph deltas. */
  setAdditive(reference: AnimationReferencePose | undefined): this {
    if (reference && !this.mixer)
      throw new Error(
        'Additive actions require an AnimationMixer to restore their base pose.',
      );
    this.references = reference
      ? this.clip.tracks.map((track) => reference.channel(track))
      : undefined;
    return this;
  }
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
    this.motion?.cancel(this);
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
    this.motion?.cancel(this);
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
    finiteTime(delta, 'Animation delta');
    if (!this.playing) return false;
    if (this.references && !this.mixer)
      throw new Error('Additive action is detached from its AnimationMixer.');
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
    if (this.motion) {
      if (!this.mixer)
        throw new Error(
          'Root motion action is detached from its AnimationMixer.',
        );
      this.mixer.collectRootMotion(this.motion.binding);
      this.motion.sample(
        this,
        previous,
        this.elapsed,
        this.loopMode,
        this.effectiveWeight,
        this.mask,
        !!this.references,
      );
    }
    const weight = this.effectiveWeight;
    for (let i = 0; i < this.clip.tracks.length; i++) {
      const track = this.clip.tracks[i];
      if (this.motion?.extracts(track)) continue;
      const channelWeight =
        weight * (this.mask?.weight(track.target, track.path) ?? 1);
      if (channelWeight <= 0) continue;
      this.mixer?.captureOverlay(track.target, track.path, !!this.references);
      track.sample(this.clipTime, channelWeight, this.references?.[i]);
      this.mixer?.sealOverlay(track.target, track.path);
    }
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
  paused = false;
  private updating = false;
  private generation = 0;
  private readonly constraints = new Set<AnimationConstraint>();
  private readonly overlays = new Map<
    AnimationTarget,
    Map<AnimationPath, AnimationPoseOverlay>
  >();
  private readonly running: AnimationAction[] = [];
  private readonly evaluating: AnimationController[] = [];
  private readonly rootMotions = new Set<AnimationRootMotion>();

  /** @internal Pending root output is flushed only after callbacks survive the tick. */
  collectRootMotion(binding: AnimationRootMotion): void {
    this.rootMotions.add(binding);
  }

  addConstraint(constraint: AnimationConstraint): () => void {
    if (this.destroyed) throw new Error('AnimationMixer is destroyed.');
    this.constraints.add(constraint);
    return () => this.constraints.delete(constraint);
  }

  /** @internal Captures the base once, even when several overlays affect the same channel. */
  captureOverlay(
    target: AnimationTarget,
    path: AnimationPath,
    create = true,
  ): void {
    let paths = this.overlays.get(target);
    if (!create && !paths?.get(path)?.captured) return;
    if (!paths) this.overlays.set(target, (paths = new Map()));
    let overlay = paths.get(path);
    if (!overlay)
      paths.set(path, (overlay = new AnimationPoseOverlay(target, path)));
    overlay.capture();
  }
  /** @internal Record owned writes before user callbacks can clear or replace their pose. */
  sealOverlay(target: AnimationTarget, path: AnimationPath): void {
    this.overlays.get(target)?.get(path)?.seal();
  }
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
    if (this.destroyed) throw new Error('AnimationMixer is destroyed.');
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
    if (this.destroyed || this.paused) return;
    if (this.updating)
      throw new Error('AnimationMixer update is not reentrant.');
    this.updating = true;
    const generation = this.generation;
    try {
      for (const binding of this.rootMotions) binding.reset();
      this.rootMotions.clear();
      for (const paths of this.overlays.values())
        for (const overlay of paths.values()) overlay.restore();
      this.evaluating.length = 0;
      for (const controller of this.controllers)
        this.evaluating.push(controller);
      for (const controller of this.evaluating) {
        if (this.destroyed || this.paused || this.generation !== generation)
          return;
        if (this.controllers.has(controller)) controller.evaluate(delta);
      }
      this.running.length = 0;
      for (const action of this.actions.values()) this.running.push(action);
      for (const action of this.running) {
        if (this.destroyed || this.paused || this.generation !== generation)
          return;
        if (this.actions.get(action.clip) === action) action.update(delta);
      }
      if (this.destroyed || this.paused || this.generation !== generation)
        return;
      for (const action of this.running) action.supersede();
      for (const constraint of this.constraints) {
        if (this.destroyed || this.paused || this.generation !== generation)
          return;
        if (!constraint.enabled) continue;
        for (const channel of constraint.channels)
          this.captureOverlay(channel.target, channel.path);
        constraint.solve(delta);
        for (const channel of constraint.channels)
          this.sealOverlay(channel.target, channel.path);
      }
      for (const binding of this.rootMotions) {
        if (this.destroyed || this.paused || this.generation !== generation)
          return;
        binding.flush();
      }
    } finally {
      for (const binding of this.rootMotions) binding.reset();
      this.rootMotions.clear();
      this.running.length = this.evaluating.length = 0;
      this.updating = false;
    }
  }
  stopAll(): void {
    for (const action of this.actions.values()) action.stop();
    for (const constraint of this.constraints) constraint.enabled = false;
  }
  /** Stops playback/controllers/constraints and releases their borrowed pose bindings. */
  clear(): void {
    this.generation++;
    for (const binding of this.rootMotions) binding.reset();
    this.rootMotions.clear();
    this.stopAll();
    for (const paths of this.overlays.values())
      for (const overlay of paths.values()) overlay.restore();
    this.overlays.clear();
    for (const constraint of this.constraints) constraint.destroy();
    this.constraints.clear();
    for (const controller of this.controllers) controller.destroy?.();
    this.controllers.clear();
    for (const action of this.actions.values()) {
      action.releaseRootMotion();
      action.mixer = undefined;
    }
    this.actions.clear();
    this.running.length = this.evaluating.length = 0;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clear();
  }
}
