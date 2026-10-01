import { Vector3 } from '../../math/src/index.js';
import type { AnimationConstraint, AnimationMixer } from './animation.js';
import type { AnimationPoseChannel } from './animation-pose.js';
import type { Object3D } from './object3d.js';
export interface TwoBoneIKOptions {
    root: Object3D;
    middle: Object3D;
    tip: Object3D;
    /** Borrowed world-space target: an object origin or mutable world-space vector. */
    target: Object3D | Readonly<Vector3>;
    pole?: Object3D | Readonly<Vector3>;
    weight?: number;
    /** Angle between successive segment directions: 0 is straight, PI fully folded. */
    minBend?: number;
    maxBend?: number;
}
export type TwoBoneIKStatus = 'idle' | 'solved' | 'clamped' | 'singular' | 'invalid-target' | 'invalid-hierarchy';
/**
 * Analytic two-bone world-space solver, applied by the existing mixer after sampled actions.
 * The direct root→middle→tip chain and ancestors require positive uniform scales (no shear or
 * reflection). Only local rotations change; segment offsets and borrowed targets are never owned.
 */
export declare class TwoBoneIKConstraint implements AnimationConstraint {
    enabled: boolean;
    weight: number;
    readonly minBend: number;
    readonly maxBend: number;
    readonly channels: readonly AnimationPoseChannel[];
    status: TwoBoneIKStatus;
    private target;
    private pole;
    private readonly root;
    private readonly middle;
    private readonly tip;
    private readonly origin;
    private readonly joint;
    private readonly end;
    private readonly goal;
    private readonly polePoint;
    private readonly direction;
    private readonly bend;
    private readonly desiredJoint;
    private readonly desiredEnd;
    private readonly from;
    private readonly to;
    private readonly swing;
    private readonly world;
    private readonly parentInverse;
    private readonly desiredRotation;
    private readonly unregister;
    private readonly removed;
    private destroyed;
    constructor(mixer: AnimationMixer, options: TwoBoneIKOptions);
    setTarget(target: Object3D | Readonly<Vector3> | undefined): this;
    setPole(pole: Object3D | Readonly<Vector3> | undefined): this;
    private watch;
    private unwatch;
    private worldPoint;
    solve(): void;
    private rotateBone;
    destroy(): void;
}
