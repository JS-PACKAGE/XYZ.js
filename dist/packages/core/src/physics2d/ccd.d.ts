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
    timeOfImpact(a: ShapeMotion2D, b: ShapeMotion2D, duration: number, budget: number, tolerance?: 0.0001): number;
}
