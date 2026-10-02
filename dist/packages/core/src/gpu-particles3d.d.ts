import { Object3D } from './object3d.js';
export type GPUParticleVector3 = readonly [number, number, number];
export type GPUParticleColor = readonly [number, number, number, number];
export interface GPUParticleEmitter3DOptions {
    readonly capacity: number;
    readonly rate?: number;
    /** Fixed seconds per emission command; expiry is exclusive. */
    readonly lifetime?: number;
    readonly seed?: number;
    readonly space?: 'local' | 'world';
    readonly velocityMin?: GPUParticleVector3;
    readonly velocityMax?: GPUParticleVector3;
    readonly gravity?: GPUParticleVector3;
    /** Linear RGB, straight alpha. */
    readonly startColor?: GPUParticleColor;
    readonly endColor?: GPUParticleColor;
    /** Billboard diameters in world units (not pixels). */
    readonly startSize?: number;
    readonly endSize?: number;
}
/**
 * A bounded emission-command ring, never a CPU position/velocity pool.
 * Native vertex shaders derive motion and appearance from seed and birth time.
 * Rate admission is chronological drop-new, with no overflow backlog. World
 * commands snapshot the emitter's affine transform; local commands follow it.
 * A moving emitter is sampled at the current Scene tick (not interpolated births).
 */
export declare class GPUParticleEmitter3D extends Object3D {
    readonly capacity: number;
    readonly rate: number;
    readonly lifetime: number;
    readonly seed: number;
    readonly space: 'local' | 'world';
    readonly velocityMin: GPUParticleVector3;
    readonly velocityMax: GPUParticleVector3;
    readonly gravity: GPUParticleVector3;
    readonly startColor: GPUParticleColor;
    readonly endColor: GPUParticleColor;
    readonly startSize: number;
    readonly endSize: number;
    private commands;
    private commandWords;
    private births;
    private head;
    private count;
    private clock;
    private epoch;
    private fraction;
    private sequence;
    private running;
    private frozen;
    private revision;
    private dropped;
    private readonly resourceOwners;
    constructor(options: GPUParticleEmitter3DOptions);
    get activeCount(): number;
    get droppedCount(): number;
    get time(): number;
    get emitting(): boolean;
    get paused(): boolean;
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    /** Explicit bursts are allowed while stopped/paused; return accepted commands. */
    burst(requested: number): number;
    clear(): void;
    /** @internal Scene advances once after physics; Game pause never advances it. */
    updateSimulation(delta: number): void;
    /** @internal Immutable emission metadata consumed by the two native modules. */
    get commandData(): Float32Array;
    /** @internal */
    get commandVersion(): number;
    /** @internal */
    get commandHead(): number;
    /** @internal */
    get shaderTime(): number;
    /** @internal Native owners release synchronously on clear/destroy/removal. */
    ownNative(release: () => void): () => void;
    detach(scene: Parameters<Object3D['detach']>[0]): void;
    protected onDestroy(): void;
    private expire;
    private admit;
    private releaseNative;
    private assertAlive;
}
