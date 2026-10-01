import { Quaternion, Vector3 } from '../../math/src/index.js';
import type {
  AnimationAction,
  AnimationClip,
  AnimationLoopMode,
  AnimationMixer,
  KeyframeTrack,
} from './animation.js';
import {
  blendRotation,
  multiplyRotation,
  type AnimationMask,
} from './animation-pose.js';
import type { Object3D } from './object3d.js';

export interface AnimationRootMotionDelta {
  /** Body-local displacement; rotate by the consumer's current orientation before world movement. */
  readonly translation: Readonly<Vector3>;
  /** Local incremental rotation, composed after the consumer's current orientation. */
  readonly rotation: Readonly<Quaternion>;
}
export interface AnimationRootMotionOptions {
  /** Borrowed target. Its local position/rotation are advanced; it is never destroyed. */
  target?: Object3D;
  /** Alternative to a target, for capsule/physics movement. Values are reused; copy if retaining. */
  sink?: (delta: AnimationRootMotionDelta) => void;
}

/** @internal Alias-safe quaternion-vector rotation, without transient vectors. */
export function rotateAnimationVector(
  q: Readonly<Quaternion>,
  v: Readonly<Vector3>,
  out: Vector3,
): void {
  const x = v.x,
    y = v.y,
    z = v.z;
  const tx = 2 * (q.y * z - q.z * y);
  const ty = 2 * (q.z * x - q.x * z);
  const tz = 2 * (q.x * y - q.y * x);
  out.set(
    x + q.w * tx + q.y * tz - q.z * ty,
    y + q.w * ty + q.z * tx - q.x * tz,
    z + q.w * tz + q.x * ty - q.y * tx,
  );
}
class MotionPose {
  readonly translation = new Vector3();
  readonly rotation = new Quaternion();
  identity(): void {
    this.translation.set(0, 0, 0);
    this.rotation.set(0, 0, 0, 1);
  }
  copy(other: MotionPose): void {
    this.translation.copy(other.translation);
    this.rotation.copy(other.rotation);
  }
}
function compose(a: MotionPose, b: MotionPose, out: MotionPose): void {
  const x = a.translation.x,
    y = a.translation.y,
    z = a.translation.z;
  rotateAnimationVector(a.rotation, b.translation, out.translation);
  out.translation.set(
    out.translation.x + x,
    out.translation.y + y,
    out.translation.z + z,
  );
  multiplyRotation(a.rotation, b.rotation, out.rotation);
}
function inverse(a: MotionPose, out: MotionPose): void {
  out.rotation.set(-a.rotation.x, -a.rotation.y, -a.rotation.z, a.rotation.w);
  out.translation.set(-a.translation.x, -a.translation.y, -a.translation.z);
  rotateAnimationVector(out.rotation, out.translation, out.translation);
}
interface Contribution {
  readonly pose: MotionPose;
  translationWeight: number;
  rotationWeight: number;
  additive: boolean;
  active: boolean;
}

/** Share one binding between layered actions to produce one blended output per mixer tick. */
export class AnimationRootMotion {
  private readonly contributions = new Map<AnimationAction, Contribution>();
  private mixer: AnimationMixer | undefined;
  private readonly output = new MotionPose();
  private readonly identity = new Quaternion();
  private readonly weighted = new Quaternion();
  private readonly displacement = new Vector3();
  private readonly target: Object3D | undefined;
  private readonly sink:
    ((delta: AnimationRootMotionDelta) => void) | undefined;
  constructor(
    readonly root: Object3D,
    options: AnimationRootMotionOptions,
  ) {
    if (root.destroyed || !!options.target === !!options.sink)
      throw new RangeError(
        'Root motion requires a live root and exactly one target or sink.',
      );
    if (options.target === root || options.target?.destroyed)
      throw new RangeError(
        'Root motion output must be a live object distinct from the skeleton root.',
      );
    if (root.scale.x !== 1 || root.scale.y !== 1 || root.scale.z !== 1)
      throw new RangeError('Root motion requires unit root scale.');
    const p = root.position,
      q = root.rotation;
    const length = Math.hypot(q.x, q.y, q.z, q.w);
    if (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      !Number.isFinite(p.z) ||
      !Number.isFinite(length) ||
      length === 0
    )
      throw new RangeError(
        'Root motion requires a finite rigid root transform.',
      );
    this.target = options.target;
    this.sink = options.sink;
  }
  /** @internal A binding belongs to one mixer while actions borrow it. */
  attach(action: AnimationAction, mixer: AnimationMixer): void {
    if (this.mixer && this.mixer !== mixer)
      throw new Error(
        'Root motion binding is already attached to another mixer.',
      );
    this.mixer = mixer;
    if (!this.contributions.has(action))
      this.contributions.set(action, {
        pose: new MotionPose(),
        translationWeight: 0,
        rotationWeight: 0,
        additive: false,
        active: false,
      });
  }
  /** @internal */
  detach(action: AnimationAction): void {
    this.contributions.delete(action);
    if (!this.contributions.size) this.mixer = undefined;
  }
  /** @internal */
  cancel(action: AnimationAction): void {
    const value = this.contributions.get(action);
    if (value) value.active = false;
  }
  /** @internal */
  collect(
    action: AnimationAction,
    pose: MotionPose,
    translationWeight: number,
    rotationWeight: number,
    additive: boolean,
  ): void {
    const value = this.contributions.get(action);
    if (!value) throw new Error('Root motion action is not attached.');
    // Reinsert so crossFadeTo/raise follows the same layer order as skeletal channels.
    this.contributions.delete(action);
    this.contributions.set(action, value);
    value.pose.copy(pose);
    value.translationWeight = translationWeight;
    value.rotationWeight = rotationWeight;
    value.additive = additive;
    value.active = true;
  }
  /** @internal */
  reset(): void {
    for (const value of this.contributions.values()) value.active = false;
  }
  /** @internal Flush after action callbacks/constraints, not while partially sampling the mixer. */
  flush(): void {
    if (this.root.destroyed || this.target?.destroyed) return;
    this.output.identity();
    let active = false;
    for (const value of this.contributions.values()) {
      if (!value.active) continue;
      active = true;
      const p = this.output.translation,
        d = value.pose.translation,
        w = value.translationWeight;
      if (value.additive) p.set(p.x + d.x * w, p.y + d.y * w, p.z + d.z * w);
      else
        p.set(
          p.x + (d.x - p.x) * w,
          p.y + (d.y - p.y) * w,
          p.z + (d.z - p.z) * w,
        );
      if (value.additive) {
        blendRotation(
          this.identity,
          value.pose.rotation,
          value.rotationWeight,
          this.weighted,
        );
        multiplyRotation(
          this.output.rotation,
          this.weighted,
          this.output.rotation,
        );
      } else
        blendRotation(
          this.output.rotation,
          value.pose.rotation,
          value.rotationWeight,
          this.output.rotation,
        );
    }
    if (!active) return;
    if (this.target) {
      rotateAnimationVector(
        this.target.rotation,
        this.output.translation,
        this.displacement,
      );
      this.target.position.add(this.displacement);
      multiplyRotation(
        this.target.rotation,
        this.output.rotation,
        this.target.rotation,
      );
    } else this.sink?.(this.output);
  }
}

/** @internal Continuous rigid transforms preserve repeat displacement/turning even across many loops. */
export class AnimationRootMotionSampler {
  private readonly translation: KeyframeTrack | undefined;
  private readonly rotation: KeyframeTrack | undefined;
  private readonly vector = new Float64Array(3);
  private readonly quaternion = new Float64Array(4);
  private readonly restTranslation = new Vector3();
  private readonly restRotation = new Quaternion();
  private readonly start = new MotionPose();
  private readonly inverseStart = new MotionPose();
  private readonly cycle = new MotionPose();
  private readonly power = new MotionPose();
  private readonly factor = new MotionPose();
  private readonly sampled = new MotionPose();
  private readonly before = new MotionPose();
  private readonly after = new MotionPose();
  private readonly delta = new MotionPose();
  constructor(
    readonly binding: AnimationRootMotion,
    private readonly clip: AnimationClip,
  ) {
    this.restTranslation.copy(binding.root.position);
    this.restRotation.copy(binding.root.rotation).normalize();
    let translation: KeyframeTrack | undefined,
      rotation: KeyframeTrack | undefined;
    for (const track of clip.tracks) {
      if (track.target !== binding.root) continue;
      if (track.path === 'scale')
        throw new RangeError(
          'Animated root scale is unsupported for root motion.',
        );
      if (track.path === 'translation') {
        if (translation)
          throw new RangeError('Duplicate root translation track.');
        translation = track;
      } else if (track.path === 'rotation') {
        if (rotation) throw new RangeError('Duplicate root rotation track.');
        rotation = track;
      }
    }
    if (!translation && !rotation)
      throw new RangeError('Clip has no tracks for the explicit root.');
    this.translation = translation;
    this.rotation = rotation;
    this.poseAt(0, this.start);
    inverse(this.start, this.inverseStart);
    this.poseAt(clip.duration, this.sampled);
    compose(this.inverseStart, this.sampled, this.cycle);
  }
  extracts(track: KeyframeTrack): boolean {
    return track === this.translation || track === this.rotation;
  }
  cancel(action: AnimationAction): void {
    this.binding.cancel(action);
  }
  release(action: AnimationAction): void {
    this.binding.detach(action);
  }
  private poseAt(time: number, out: MotionPose): void {
    out.translation.copy(this.restTranslation);
    out.rotation.copy(this.restRotation);
    if (this.translation) {
      this.translation.sampleValues(time, this.vector);
      out.translation.set(this.vector[0], this.vector[1], this.vector[2]);
    }
    if (this.rotation) {
      this.rotation.sampleValues(time, this.quaternion);
      out.rotation.set(
        this.quaternion[0],
        this.quaternion[1],
        this.quaternion[2],
        this.quaternion[3],
      );
    }
  }
  private continuous(
    time: number,
    mode: AnimationLoopMode,
    out: MotionPose,
  ): void {
    const duration = this.clip.duration;
    if (duration === 0) {
      out.identity();
      return;
    }
    if (mode !== 'repeat') {
      let phase = Math.max(0, Math.min(duration, time));
      if (mode === 'pingpong') {
        const period = duration * 2;
        phase = ((time % period) + period) % period;
        if (phase > duration) phase = period - phase;
      }
      this.poseAt(phase, out);
      return;
    }
    let cycles = Math.floor(time / duration);
    if (!Number.isSafeInteger(cycles))
      throw new RangeError(
        'Root motion loop count exceeds safe integer range.',
      );
    this.power.identity();
    this.factor.copy(this.cycle);
    if (cycles < 0) {
      inverse(this.factor, this.factor);
      cycles = -cycles;
    }
    while (cycles > 0) {
      if (cycles % 2 === 1) compose(this.power, this.factor, this.power);
      cycles = Math.floor(cycles / 2);
      if (cycles > 0) compose(this.factor, this.factor, this.factor);
    }
    this.poseAt(((time % duration) + duration) % duration, this.sampled);
    compose(this.inverseStart, this.sampled, this.sampled);
    compose(this.power, this.sampled, out);
    compose(this.start, out, out);
  }
  sample(
    action: AnimationAction,
    previous: number,
    next: number,
    mode: AnimationLoopMode,
    weight: number,
    mask: AnimationMask | undefined,
    additive: boolean,
  ): void {
    this.continuous(previous, mode, this.before);
    this.continuous(next, mode, this.after);
    inverse(this.before, this.before);
    compose(this.before, this.after, this.delta);
    this.binding.collect(
      action,
      this.delta,
      weight * (mask?.weight(this.binding.root, 'translation') ?? 1),
      weight * (mask?.weight(this.binding.root, 'rotation') ?? 1),
      additive,
    );
  }
}
