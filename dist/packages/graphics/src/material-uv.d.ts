import type { TextureMaterial } from '../../core/src/mesh.js';
import type { Geometry } from '../../core/src/geometry.js';
/** Shared GPU/std140 affine ABI: [a,b,c,d], then [tx,ty,UV selector,0]. */
export declare function fillMaterialUV(material: TextureMaterial, geometry: Geometry, out: Float32Array, offset?: number): void;
