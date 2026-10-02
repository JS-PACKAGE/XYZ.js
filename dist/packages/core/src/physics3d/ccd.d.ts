import { Quaternion, Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { RigidBody3D } from './body.js';
import { Shape3D } from './collider.js';
import { Manifold3D } from './geometry.js';
import { Bounds3D } from './spatial.js';
export interface CcdEntry3D {
    readonly object: Object3D;
    readonly shape: Shape3D;
    readonly body: RigidBody3D | undefined;
    ccdShape: Shape3D | undefined;
    ccdStopped: boolean;
}
/** @internal Exact constant world-angular-velocity exponential, shared by the CCD path and integration. */
export declare function integrateRotation3D(rotation: Readonly<Quaternion>, angular: Readonly<Vector3>, dt: number, out: Quaternion): void;
/** @internal Upper bound on every point's distance to the moving root's center of mass. */
export declare function motionRadius3D(entry: CcdEntry3D): number;
/** @internal Rotating round radii are invariant; only box vertices and round centers/segment ends sweep. */
export declare function rotationalSweepSpeed3D(entry: CcdEntry3D): number;
/** @internal Translation plus an arc-length bound, capped by the diameter, encloses the entire rigid sweep. */
export declare function rigidSweptBounds3D(entry: CcdEntry3D, dt: number, out: Bounds3D, displacement: Vector3): void;
/** @internal Bounded conservative advancement. SAT separation is a safe lower bound, never an AABB proxy hit. */
export declare class ContinuousCollision3D {
    private readonly matrixA;
    private readonly matrixB;
    private readonly position;
    private readonly rotation;
    private readonly narrow;
    private readonly leaf;
    readonly manifold: Manifold3D;
    private readonly triangles;
    private readonly boundsA;
    private readonly boundsB;
    private readonly displacement;
    iterations: number;
    exhausted: boolean;
    safeTime: number;
    private sample;
    private keep;
    private distance;
    private contactClosing;
    timeOfImpact(a: CcdEntry3D, b: CcdEntry3D, duration: number, limit: number): number;
}
