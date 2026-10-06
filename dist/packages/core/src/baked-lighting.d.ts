import { Texture } from '../../assets/src/index.js';
import { Geometry } from './geometry.js';
import { Mesh } from './mesh.js';
import { Scene } from './scene.js';
import { EnvironmentMap } from './environment.js';
import { type PBRMaterialOptions } from './pbr-material.js';
/** Internal distinction: CPU irradiance bakes add diffuse light; authored finish maps modulate it. */
export declare function isBakedLightmap(texture: Texture | undefined): boolean;
export type BakeVector = readonly [number, number, number];
export interface LightingBakeOptions {
    /** Static opaque occluders/receivers; defaults to scene meshes. */
    meshes?: readonly Mesh[];
    maxTriangles?: number;
    maxRays?: number;
    bias?: number;
    samples?: number;
    aoDistance?: number;
}
export interface LightmapBakeOptions extends LightingBakeOptions {
    size?: number;
    padding?: number;
    /** Generate disjoint per-triangle UV1 charts, or validate and use authored UV1. */
    atlas?: 'generate' | 'uv1';
}
export interface BakedLightmap {
    readonly texture: Texture;
    /** Linear irradiance/pi, RGB, top-row-first; texture is sRGB encoded and clamped to [0,1]. */
    readonly pixels: Float32Array;
    readonly geometries: ReadonlyMap<Mesh, Geometry>;
    readonly materialOptions: Pick<PBRMaterialOptions, 'lightmap' | 'lightmapSampler' | 'finish' | 'textureCoordinates'>;
    readonly rays: number;
    destroy(): void;
}
/** CPU bake, no renderer/GPU access. Caller owns the resulting texture and replacement geometries. */
export declare function bakeLightmap(scene: Scene, options?: LightmapBakeOptions): Promise<BakedLightmap>;
export interface IrradianceVolumeBakeOptions extends LightingBakeOptions {
    min: BakeVector;
    max: BakeVector;
    resolution?: readonly [number, number, number];
    order?: 1 | 2;
}
/** Bounded SH irradiance/pi grid. Samples clamp to grid nodes only inside its world-space bounds. */
export declare class BakedIrradianceVolume {
    readonly min: BakeVector;
    readonly max: BakeVector;
    readonly resolution: readonly [number, number, number];
    readonly order: 1 | 2;
    readonly coefficients: Float32Array;
    private gone;
    constructor(options: IrradianceVolumeBakeOptions, coefficients?: ArrayLike<number>);
    get destroyed(): boolean;
    destroy(): void;
    /** Allocation-free 36-float shader ABI output; false leaves it zero outside the volume. */
    sampleSH(x: number, y: number, z: number, out: Float32Array, offset?: number): boolean;
}
/** Bake EnvironmentMap sky or a scene's occluded sky, direct lights and one diffuse surface bounce. */
export declare function bakeIrradianceVolume(source: Scene | EnvironmentMap, options: IrradianceVolumeBakeOptions): BakedIrradianceVolume;
export declare function bindIrradianceVolume(mesh: Mesh, volume: BakedIrradianceVolume | undefined): void;
export declare function meshIrradianceVolume(mesh: Mesh): BakedIrradianceVolume | undefined;
/** Internal renderer bridge: 36 SH floats + volume enabled, generated lightmap,0,0. */
export declare function fillMeshIrradiance(mesh: Mesh, out: Float32Array, offset?: number): void;
