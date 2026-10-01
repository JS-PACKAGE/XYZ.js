import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import { Bounds3D } from './spatial.js';
export declare function finite3D(value: number, name: string): number;
export declare function positive3D(value: number, name: string): number;
export declare function nonnegative3D(value: number, name: string): number;
export declare function vector3D(value: Readonly<Vector3>, name: string): void;
export interface ColliderOptions3D {
    offset?: Readonly<Vector3>;
    sensor?: boolean;
    category?: number;
    mask?: number;
}
/** Immutable primitive descriptor. One primitive per Object3D; no compound/mesh shapes. */
export declare abstract class Collider3D {
    abstract readonly kind: 'sphere' | 'box' | 'capsule' | 'plane';
    readonly offset: Readonly<Vector3>;
    readonly sensor: boolean;
    readonly category: number;
    readonly mask: number;
    constructor(options?: ColliderOptions3D);
}
export declare class SphereCollider3D extends Collider3D {
    readonly kind = "sphere";
    readonly radius: number;
    constructor(radius: number, options?: ColliderOptions3D);
}
export declare class BoxCollider3D extends Collider3D {
    readonly kind = "box";
    readonly halfExtents: Readonly<Vector3>;
    constructor(halfExtents: Readonly<Vector3>, options?: ColliderOptions3D);
}
/** Y-aligned local capsule: height is the straight segment length, total height = height + 2*radius. */
export declare class CapsuleCollider3D extends Collider3D {
    readonly kind = "capsule";
    readonly radius: number;
    readonly height: number;
    constructor(radius: number, height: number, options?: ColliderOptions3D);
}
/** Infinite two-sided surface; normal is local and normalized, offset locates a point on it. Static only. */
export declare class PlaneCollider3D extends Collider3D {
    readonly kind = "plane";
    readonly normal: Readonly<Vector3>;
    constructor(normal?: Readonly<Vector3>, options?: ColliderOptions3D);
}
/** @internal Reused transformed primitive. Orthogonal positive TRS only: shear/reflection are rejected. */
export declare class Shape3D {
    readonly collider: Collider3D;
    readonly center: Vector3;
    readonly axes: Vector3[];
    readonly half: Vector3;
    readonly start: Vector3;
    readonly end: Vector3;
    readonly normal: Vector3;
    readonly bounds: Bounds3D;
    readonly vertices: Vector3[];
    radius: number;
    constructor(collider: Collider3D);
    refresh(object: Object3D): void;
    updateBounds(): void;
    translate(x: number, y: number, z: number): void;
}
