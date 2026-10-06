import { Texture } from '../../assets/src/index.js';
import { NativePBRMaterial } from './native-pbr-material.js';
import { type TerrainImageData, type TerrainImageSource } from './terrain-data.js';
export interface TerrainSplatLayer {
    /** Opaque color source; alpha-bearing layers are rejected, not silently discarded. */
    readonly baseColor: TerrainImageSource;
    readonly normal?: TerrainImageSource;
    /** G roughness / B metallic, following the PBR texture contract. */
    readonly metallicRoughness?: TerrainImageSource;
    readonly occlusion?: TerrainImageSource;
    readonly emissive?: TerrainImageSource;
    readonly color?: readonly [number, number, number];
    readonly metallic?: number;
    readonly roughness?: number;
    readonly normalScale?: number;
    readonly emissiveFactor?: readonly [number, number, number];
    readonly scale?: readonly [number, number];
}
export interface TerrainSplatOptions {
    readonly layers: readonly TerrainSplatLayer[];
    /** RGBA gives the weights of layers 0..3; zero total weight selects layer zero. */
    readonly weights: TerrainImageSource;
    readonly size?: number;
}
export interface TerrainSplatImageData extends TerrainImageData {
    readonly data: Uint8ClampedArray<ArrayBuffer>;
}
export interface TerrainSplatMaps {
    readonly baseColor: TerrainSplatImageData;
    readonly normal: TerrainSplatImageData;
    /** R occlusion / G roughness / B metallic, consumed by the physical hook. */
    readonly metallicRoughness: TerrainSplatImageData;
    readonly emissive: TerrainSplatImageData;
}
/** Deterministic static splat bake. No browser/GPU resources are created by this function. */
export declare function bakeTerrainSplat(options: TerrainSplatOptions): TerrainSplatMaps;
/** Owns four baked maps, never input textures. Static layers can be rebaked by creating another preset. */
export declare class TerrainSplatMaterial {
    readonly material: NativePBRMaterial;
    readonly textures: readonly Texture[];
    private disposed;
    private constructor();
    static create(options: TerrainSplatOptions): Promise<TerrainSplatMaterial>;
    get destroyed(): boolean;
    destroy(): void;
}
