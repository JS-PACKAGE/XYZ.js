import { Vector3 } from '../../../math/src/index.js';
import type { Mesh } from '../mesh.js';
import type { PhysicsWorld3D } from './world.js';
export interface SoftBodyParticleOptions3D {
    position: Readonly<Vector3>;
    mass?: number;
    pinned?: boolean;
}
export interface SoftBodySpringOptions3D {
    a: number;
    b: number;
    restLength?: number;
    stiffness?: number;
    damping?: number;
}
export interface SoftBodyOptions3D {
    particles: readonly SoftBodyParticleOptions3D[];
    springs: readonly SoftBodySpringOptions3D[];
    radius?: number;
    drag?: number;
    friction?: number;
    fixedDelta?: number;
    iterations?: number;
    maxStretch?: number;
    /** Exclusive mutable geometry; one particle index per mesh vertex. World positions convert to mesh-local. */
    mesh?: Mesh;
    vertexParticles?: readonly number[];
}
export interface SoftBodyParticle3D {
    readonly position: Vector3;
    readonly velocity: Vector3;
    readonly mass: number;
    pinned: boolean;
}
/** Bounded mass-spring + stretch projection profile, not FEM, volume preservation or self-collision.
 * World owns rigid contacts; particles query swept spheres. Call update in simulation seconds. */
export declare class SoftBody3D {
    readonly world: PhysicsWorld3D;
    readonly particles: readonly SoftBodyParticle3D[];
    readonly fixedDelta: number;
    private readonly springs;
    private readonly forces;
    private readonly anchors;
    private readonly radius;
    private readonly drag;
    private readonly friction;
    private readonly iterations;
    private readonly stretch;
    private readonly mesh;
    private readonly mapping;
    private readonly difference;
    private readonly displacement;
    private readonly old;
    private readonly inverse;
    private readonly local;
    private hit;
    private readonly query;
    private accumulator;
    private disposed;
    constructor(world: PhysicsWorld3D, options: SoftBodyOptions3D);
    private index;
    pin(index: number, position?: Readonly<Vector3>): void;
    unpin(index: number): void;
    update(delta: number): void;
    private step;
    private uploadMesh;
    destroy(): void;
}
