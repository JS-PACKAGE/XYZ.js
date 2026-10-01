import { Vector3 } from '../../../math/src/index.js';
import type { Matrix4 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import { Bounds3D, SpatialIndex3D } from './spatial.js';
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
/** Immutable collider descriptor. Geometry is snapshotted before attachment. */
export declare abstract class Collider3D {
    abstract readonly kind: 'sphere' | 'box' | 'capsule' | 'plane' | 'mesh';
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
export interface TriangleMeshOptions3D extends ColliderOptions3D {
    /** 'front' uses counterclockwise winding; 'double' is a two-sided surface, not a closed solid. */
    sidedness?: 'double' | 'front';
}
/** Static indexed triangle surface. Bake owns copies; replace the attachment to update transactionally. */
export declare class TriangleMeshCollider3D extends Collider3D {
    readonly kind = "mesh";
    readonly positions: readonly number[];
    readonly indices: readonly number[];
    readonly sidedness: 'double' | 'front';
    constructor(positions: ArrayLike<number>, indices: ArrayLike<number>, options?: TriangleMeshOptions3D);
}
/** @internal A transformed BVH leaf, reused across pose changes. */
export declare class Triangle3D {
    readonly order: number;
    readonly a: Vector3;
    readonly b: Vector3;
    readonly c: Vector3;
    readonly normal: Vector3;
    readonly bounds: Bounds3D;
    constructor(order: number);
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
    readonly triangles: Triangle3D[];
    readonly triangleIndex: SpatialIndex3D<Triangle3D> | undefined;
    private readonly meshMatrix;
    radius: number;
    constructor(collider: Collider3D);
    refresh(object: Object3D): void;
    refreshMatrix(matrix: Matrix4): void;
    validateMoving(type: 'dynamic' | 'kinematic' | 'static'): void;
    updateBounds(): void;
    translate(x: number, y: number, z: number): void;
}
