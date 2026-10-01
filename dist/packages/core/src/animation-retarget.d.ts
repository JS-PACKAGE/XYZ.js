import { AnimationClip } from './animation.js';
import type { Object3D } from './object3d.js';
export interface AnimationBindTransform {
    translation: readonly number[];
    rotation: readonly number[];
    scale: readonly number[];
}
export interface AnimationRetargetMapping {
    source: Object3D;
    target: Object3D;
    /** Local bind transforms, explicitly supplied rather than read from an animated pose. */
    sourceBind: AnimationBindTransform;
    targetBind: AnimationBindTransform;
    /** Non-root default is the target/source bind offset length ratio; zero locks translation. */
    translationScale?: number;
}
export interface AnimationRetargetOptions {
    sourceRoot: Object3D;
    targetRoot: Object3D;
    /** Root displacement scale is explicit, independent of character scene placement. Default 1. */
    rootTranslationScale?: number;
}
/**
 * Explicit skeletal-space rest correction. Offline baking and runtime clip adaptation use the
 * same immutable output clip, which plays through AnimationMixer (including skinning/root motion).
 * Every animated source must be mapped; direct mapped parents must correspond. Scene placement
 * outside the two declared skeleton roots is intentionally not part of their bind space.
 */
export declare class AnimationRetargeter {
    private readonly mappings;
    private readonly sourceRoot;
    private readonly targetRoot;
    constructor(entries: readonly AnimationRetargetMapping[], options: AnimationRetargetOptions);
    private validateHierarchy;
    retarget(clip: AnimationClip, name?: string): AnimationClip;
}
