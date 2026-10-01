import { Quaternion, Vector3 } from '../../math/src/index.js';
import type { AnimationAction, AnimationClip, AnimationLoopMode, AnimationMixer, KeyframeTrack } from './animation.js';
import { type AnimationMask } from './animation-pose.js';
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
export declare function rotateAnimationVector(q: Readonly<Quaternion>, v: Readonly<Vector3>, out: Vector3): void;
declare class MotionPose {
    readonly translation: Vector3;
    readonly rotation: Quaternion;
    identity(): void;
    copy(other: MotionPose): void;
}
/** Share one binding between layered actions to produce one blended output per mixer tick. */
export declare class AnimationRootMotion {
    readonly root: Object3D;
    private readonly contributions;
    private mixer;
    private readonly output;
    private readonly identity;
    private readonly weighted;
    private readonly displacement;
    private readonly target;
    private readonly sink;
    constructor(root: Object3D, options: AnimationRootMotionOptions);
    /** @internal A binding belongs to one mixer while actions borrow it. */
    attach(action: AnimationAction, mixer: AnimationMixer): void;
    /** @internal */
    detach(action: AnimationAction): void;
    /** @internal */
    cancel(action: AnimationAction): void;
    /** @internal */
    collect(action: AnimationAction, pose: MotionPose, translationWeight: number, rotationWeight: number, additive: boolean): void;
    /** @internal */
    reset(): void;
    /** @internal Flush after action callbacks/constraints, not while partially sampling the mixer. */
    flush(): void;
}
/** @internal Continuous rigid transforms preserve repeat displacement/turning even across many loops. */
export declare class AnimationRootMotionSampler {
    readonly binding: AnimationRootMotion;
    private readonly clip;
    private readonly translation;
    private readonly rotation;
    private readonly vector;
    private readonly quaternion;
    private readonly restTranslation;
    private readonly restRotation;
    private readonly start;
    private readonly inverseStart;
    private readonly cycle;
    private readonly power;
    private readonly factor;
    private readonly sampled;
    private readonly before;
    private readonly after;
    private readonly delta;
    constructor(binding: AnimationRootMotion, clip: AnimationClip);
    extracts(track: KeyframeTrack): boolean;
    cancel(action: AnimationAction): void;
    release(action: AnimationAction): void;
    private poseAt;
    private continuous;
    sample(action: AnimationAction, previous: number, next: number, mode: AnimationLoopMode, weight: number, mask: AnimationMask | undefined, additive: boolean): void;
}
export {};
