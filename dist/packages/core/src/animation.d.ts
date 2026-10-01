import type { Object3D } from './object3d.js';
import { MorphWeights } from './morph.js';
export type AnimationPath = 'translation' | 'rotation' | 'scale' | 'weights';
export type Interpolation = 'STEP' | 'LINEAR' | 'CUBICSPLINE';
/** Cubic values are glTF triplets: incoming tangent, value, outgoing tangent. */
export declare class KeyframeTrack {
    readonly target: Object3D | MorphWeights;
    readonly path: AnimationPath;
    readonly interpolation: Interpolation;
    readonly times: Float32Array;
    readonly values: Float32Array;
    readonly size: number;
    private readonly scratch;
    constructor(target: Object3D | MorphWeights, path: AnimationPath, times: ArrayLike<number>, values: ArrayLike<number>, interpolation?: Interpolation);
    /**
     * Samples the track at `time` into its target. Weights below 1 blend over what the target
     * already holds, so a later, lower-weight track layers over an earlier one.
     */
    sample(time: number, weight?: number): void;
    /** Writes `out` to the target; a weight below 1 layers it over the target's current pose. */
    private apply;
}
export declare class AnimationClip {
    readonly name: string;
    readonly tracks: readonly KeyframeTrack[];
    readonly duration: number;
    constructor(name: string, tracks: readonly KeyframeTrack[]);
}
export type AnimationLoopMode = 'once' | 'repeat' | 'pingpong';
export type AnimationEventType = 'finished' | 'loop';
export type AnimationListener = (action: AnimationAction) => void;
/** Something the mixer consults before advancing actions, such as an AnimationStateMachine. */
export interface AnimationController {
    evaluate(delta: number): void;
}
export declare class AnimationAction {
    readonly clip: AnimationClip;
    timeScale: number;
    playing: boolean;
    /** Base blend weight in [0, 1]; multiplied by the fade factor. */
    weight: number;
    loopMode: AnimationLoopMode;
    private clipTime;
    private elapsed;
    private fade;
    private fadeTarget;
    private fadeRate;
    private readonly listeners;
    /** Action fading in over this one; this action stops once that fade is complete. */
    private successor;
    /** @internal Set by the mixer so crossFadeTo can order the layers. */
    mixer: AnimationMixer | undefined;
    constructor(clip: AnimationClip);
    /** Compatibility switch for `loopMode`: true repeats, false plays once. */
    get loop(): boolean;
    set loop(value: boolean);
    /** Position inside the clip in seconds. Assigning it seeks without sampling until the next update. */
    get time(): number;
    set time(value: number);
    /** Weight after fading; this is what the mixer applies. */
    get effectiveWeight(): number;
    get fading(): boolean;
    /** Clip position as a fraction of the duration, 0 for an empty clip. */
    get normalizedTime(): number;
    on(event: AnimationEventType, listener: AnimationListener): this;
    off(event: AnimationEventType, listener: AnimationListener): this;
    play(): this;
    stop(): this;
    /** Starts playing with the fade factor rising from 0 to 1 over `duration` seconds. */
    fadeIn(duration: number): this;
    /** Fades to 0 over `duration` seconds, then stops (and resets) the action. */
    fadeOut(duration: number): this;
    /**
     * Fades `other` in on top of this action over `duration` seconds; this action keeps playing at
     * full weight underneath, so the pose is a straight mix, and stops when the fade completes.
     */
    crossFadeTo(other: AnimationAction, duration: number): this;
    private fadeTo;
    /** @internal Stops this action once the action cross-faded over it is fully in. */
    supersede(): void;
    /** Advances time and fading, then samples the clip with `effectiveWeight`; false if not playing. */
    update(delta: number): boolean;
}
/**
 * Actions are layered in insertion order: each samples over the pose left by the actions before
 * it, scaled by its weight, so weight 1 replaces (the last full-weight action wins, as before)
 * and partial weights blend. `crossFadeTo` raises the incoming action to the top layer.
 */
export declare class AnimationMixer {
    private readonly actions;
    private readonly controllers;
    private destroyed;
    clipAction(clip: AnimationClip): AnimationAction;
    /** @internal Controllers evaluate before each update so they can start fades. */
    addController(controller: AnimationController): () => void;
    /** @internal Moves an action to the top layer. */
    raise(action: AnimationAction): void;
    update(delta: number): void;
    stopAll(): void;
    destroy(): void;
}
