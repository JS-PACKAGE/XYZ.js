import type { ProceduralMaterialKind } from './procedural-material.js';
export interface SurfaceSample {
    color: number;
    height: number;
    roughness: number;
    occlusion: number;
    mortar: number;
    metallic: number;
}
/** Internal CPU field sampler; coordinates are periodic in both directions. */
export declare function createSurfaceSampler(kind: ProceduralMaterialKind, seed: number): (u: number, v: number, out: SurfaceSample) => void;
export interface ProceduralMaps {
    baseColor: Uint8ClampedArray;
    normal: Uint8ClampedArray;
    metallicRoughness: Uint8ClampedArray;
    occlusion: Uint8ClampedArray;
}
/** Normal derivatives wrap and divide by UV spacing, not texture resolution. */
export declare function writeNormals(height: Float32Array, size: number, normal: Uint8ClampedArray): void;
export declare function generateProceduralMaps(kind: ProceduralMaterialKind, size: number, seed: number, controls?: {
    contrast?: number;
    roughnessBias?: number;
}): ProceduralMaps;
