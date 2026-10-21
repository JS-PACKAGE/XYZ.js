import { ShapeGeometry } from './collider.js';
import { Manifold } from './narrowphase.js';
import type { GameObject } from '../game-object.js';
import type { RigidBody2D } from './body.js';
/** @internal A rigid sweep sampled without editing the public mutable owner pose. */
export declare class ShapeMotion2D {
    readonly geometry: ShapeGeometry;
    readonly sample: ShapeGeometry;
    x: number;
    y: number;
    vx: number;
    vy: number;
    spin: number;
    radius: number;
    constructor(geometry: ShapeGeometry);
    set(owner: GameObject, body?: RigidBody2D): void;
    setExplicit(x: number, y: number, vx: number, vy: number, spin?: number): void;
    at(time: number): ShapeGeometry;
}
/** SAT gap is a lower bound on true distance and therefore proves a collision-free prefix. */
export declare class ShapeSeparation2D {
    distance: number;
    readonly manifold: Manifold;
    private axis;
    measure(a: ShapeGeometry, b: ShapeGeometry): number;
    private contact;
}
/** Bounded rigid conservative advancement; exhaustion never fabricates a contact. */
export declare class ContinuousCollision2D {
    readonly separation: ShapeSeparation2D;
    get manifold(): Manifold;
    iterations: number;
    exhausted: boolean;
    safeTime: number;
    private overlaps;
    /**
     * `a`'s side of `overlaps` as `[minX, maxX, minY, maxY]`, tolerance included on the max
     * sides. Against a shape at rest (no velocity or spin, so no margin of its own) `overlaps`
     * is exactly `minX <= b.maxX + tolerance && maxX >= b.minX` and likewise in y.
     */
    sweptBox(a: ShapeMotion2D, duration: number, out: Float64Array): void;
    timeOfImpact(a: ShapeMotion2D, b: ShapeMotion2D, duration: number, budget: number, tolerance?: 0.0001): number;
}
