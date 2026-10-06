import { Mesh, type TextureMaterial } from './mesh.js';
import { Object3D } from './object3d.js';
export interface RibbonCurveKey {
    /** Normalized age, from zero (new) to one (expired). */
    age: number;
    width: number;
    color: readonly [number, number, number, number];
}
export interface Ribbon3DOptions {
    material: TextureMaterial;
    maxPoints?: number;
    lifetime?: number;
    mode?: 'flat' | 'camera-facing';
    curve?: readonly RibbonCurveKey[];
}
/** Bounded dynamic triangle strip. Points and view direction are mesh-local. */
export declare class Ribbon3D extends Mesh {
    readonly maxPoints: number;
    readonly lifetime: number;
    readonly mode: 'flat' | 'camera-facing';
    private readonly curve;
    private readonly points;
    private start;
    private count;
    private clock;
    constructor(options: Ribbon3DOptions);
    get pointCount(): number;
    /** Timestamps must be nondecreasing, in seconds. Oldest points are overwritten. */
    addPoint(x: number, y: number, z: number, time: number): void;
    clear(): void;
    /** Reuses all vertex/index/color buffers; markUpdated drives native GPU re-upload. */
    update(time: number, viewDirection?: readonly [number, number, number]): void;
}
/** Samples a moving object into an unparented world-space ribbon. */
export declare class Trail3D extends Ribbon3D {
    readonly target: Object3D;
    readonly minimumDistance: number;
    private lastX;
    private lastY;
    private lastZ;
    constructor(options: Ribbon3DOptions & {
        target: Object3D;
        minimumDistance?: number;
    });
    sample(time: number, viewDirection?: readonly [number, number, number]): void;
    clear(): void;
}
