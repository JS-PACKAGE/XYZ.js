import type { AnimationAction, AnimationClip, AnimationController, AnimationLoopMode, AnimationMixer } from './animation.js';
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
    parameter?: Readonly<{
        x: number;
        y: number;
    }>;
}
export type AnimationBlendTreeOptions = AnimationBlendTree1DOptions | AnimationBlendTree2DOptions;
/**
 * Synchronized sampled actions, not a second pose pipeline. Leaves must have the same ordered
 * target/property channels and distinct positive-duration clips; this controller owns their
 * time/weight/playback while attached. 2D interpolation uses authored triangle topology.
 */
export declare class AnimationBlendTree implements AnimationController {
    private readonly mixer;
    readonly weights: Float64Array;
    readonly parameter: {
        x: number;
        y: number;
    };
    readonly actions: readonly AnimationAction[];
    timeScale: number;
    loopMode: AnimationLoopMode;
    playing: boolean;
    private phase;
    private requestedX;
    private requestedY;
    private readonly x;
    private readonly y;
    private readonly triangles;
    private readonly smoothing;
    private readonly dimension;
    private readonly unregister;
    private destroyed;
    constructor(mixer: AnimationMixer, options: AnimationBlendTreeOptions);
    setParameter(x: number, y?: number): this;
    get normalizedTime(): number;
    set normalizedTime(value: number);
    play(): this;
    pause(): this;
    stop(): this;
    evaluate(delta: number): void;
    private calculateWeights;
    destroy(): void;
}
