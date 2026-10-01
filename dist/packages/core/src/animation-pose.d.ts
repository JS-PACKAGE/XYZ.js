import { Quaternion } from '../../math/src/index.js';
import type { AnimationPath, KeyframeTrack } from './animation.js';
import type { Object3D } from './object3d.js';
import { MorphWeights } from './morph.js';
export type AnimationTarget = Object3D | MorphWeights;
export interface AnimationMaskEntry {
    target: AnimationTarget;
    /** Omitted paths includes every channel on this target. */
    paths?: readonly AnimationPath[];
    weight?: number;
}
/** An explicit allow-list of borrowed bones/targets and property channels. */
export declare class AnimationMask {
    private readonly entries;
    constructor(entries: readonly AnimationMaskEntry[]);
    weight(target: AnimationTarget, path: AnimationPath): number;
}
export interface AnimationReferenceEntry {
    target: AnimationTarget;
    translation?: readonly number[];
    rotation?: readonly number[];
    scale?: readonly number[];
    weights?: readonly number[];
}
/** Immutable values of an explicitly supplied local reference pose; targets remain borrowed. */
export declare class AnimationReferencePose {
    private readonly entries;
    constructor(entries: readonly AnimationReferenceEntry[]);
    /** @internal Validated once when an action adopts this reference. */
    channel(track: KeyframeTrack): Float64Array;
}
/** @internal Hamilton product, with alias-safe scalar reads. */
export declare function multiplyRotation(a: Quaternion, b: Quaternion, out: Quaternion): void;
/** @internal Shortest-arc spherical blend, including antipodal representations. */
export declare function blendRotation(a: Quaternion, b: Quaternion, weight: number, out: Quaternion): void;
export interface AnimationPoseChannel {
    target: AnimationTarget;
    path: AnimationPath;
}
/** @internal Reusable base/output pair prevents held additive/constraint poses accumulating. */
export declare class AnimationPoseOverlay {
    readonly target: AnimationTarget;
    readonly path: AnimationPath;
    private readonly base;
    private readonly output;
    private readonly scratch;
    captured: boolean;
    private applied;
    constructor(target: AnimationTarget, path: AnimationPath);
    private read;
    restore(): void;
    capture(): void;
    seal(): void;
}
