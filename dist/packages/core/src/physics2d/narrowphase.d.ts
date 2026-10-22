import { Vector2 } from '../../../math/src/index.js';
import { ShapeGeometry } from './collider.js';
/** Mutable manifold is owned by one contact and never exposed directly in events. */
export declare class Manifold {
    nx: number;
    ny: number;
    penetration: number;
    count: number;
    readonly points: Vector2[];
    readonly normalImpulses: Float64Array<ArrayBuffer>;
    readonly tangentImpulses: Float64Array<ArrayBuffer>;
    readonly bounceVelocities: Float64Array<ArrayBuffer>;
    readonly clip: Float64Array<ArrayBuffer>;
}
export declare function collide(a: ShapeGeometry, b: ShapeGeometry, out: Manifold): boolean;
/**
 * True only when `rayDistance` with the same arguments would miss: the ray's segment misses
 * the AABB grown past every point that function can report. A hit (or contained origin) lies
 * within `rayEdgeTolerance` (contains) plus `maxDistance * EPSILON` (drift along an edge
 * treated as parallel) of the edge lines beside each extreme vertex, so at most that times
 * `rayAmplification` past the AABB; the margin takes four times that, plus a relative slack
 * far above the rounding of either test. Without a usable bound it never claims a miss.
 */
export declare function rayMissesBounds(shape: ShapeGeometry, x: number, y: number, dx: number, dy: number, maxDistance: number): boolean;
/** Exact circle/convex ray intersection. Inside starts hit at distance zero. */
export declare function rayDistance(shape: ShapeGeometry, x: number, y: number, dx: number, dy: number, maxDistance: number, normal: Vector2): number | undefined;
