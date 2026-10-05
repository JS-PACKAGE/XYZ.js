import { Geometry } from './geometry.js';
export interface MikkTangentsOptions {
    /** glTF uses the normal-map handedness conversion recommended by mikktspace. */
    convention?: 'uv' | 'gltf';
    texCoord?: 0 | 1;
}
export interface MikkTangentsResult {
    readonly geometry: Geometry;
    /** New vertex index → original vertex index, including tangent seam splits. */
    readonly sourceVertices: Uint32Array;
}
/** @internal Copies a vertex stream through an explicit seam map. */
export declare function remapVertexData(source: ArrayLike<number>, sourceVertices: Uint32Array, components: number, stride?: number, offset?: number): Float32Array;
export declare function generateMikkTangents(geometry: Geometry, options?: MikkTangentsOptions): MikkTangentsResult;
