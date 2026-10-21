import type { TextureMaterial } from '../../core/src/mesh.js';
import type { Geometry } from '../../core/src/geometry.js';
/** Shared GPU/std140 affine ABI: [a,b,c,d], then [tx,ty,UV selector,0]. */
export declare function fillMaterialUV(material: TextureMaterial, geometry: Pick<Geometry, 'uvs1'>, out: Float32Array, offset?: number): void;
/**
 * The packed `fillMaterialUV` layout as a shared array that never changes, or
 * `undefined` when this material must be packed per call. Callers must not write to it;
 * equal arrays mean equal data, so a destination already holding it needs no copy.
 */
export declare function packedMaterialUV(material: TextureMaterial, geometry: Pick<Geometry, 'uvs1'>): Float32Array | undefined;
