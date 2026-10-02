import type { Matrix4 } from '../../math/src/index.js';
export interface BoundingSphere3D {
    x: number;
    y: number;
    z: number;
    radius: number;
}
/** Conservative even when nested nonuniform scales introduce shear. */
export declare function transformSphere(sphere: Readonly<BoundingSphere3D>, matrix: Matrix4, out: BoundingSphere3D): BoundingSphere3D;
export declare function transformSphereElements(sphere: Readonly<BoundingSphere3D>, e: ArrayLike<number>, offset: number, out: BoundingSphere3D): BoundingSphere3D;
export declare function sphereIsFinite(sphere: Readonly<BoundingSphere3D>): boolean;
