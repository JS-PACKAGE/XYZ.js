import type { Texture } from '../../assets/src/index.js';
import { Mesh, type MeshOptions } from './mesh.js';
import { NativePBRMaterial } from './native-pbr-material.js';
import type { PBRMaterialOptions } from './pbr-material.js';
export interface WaterWave3D {
    /** Mesh-local X/Z direction; normalized at construction. */
    readonly direction: readonly [number, number];
    readonly amplitude: number;
    readonly wavelength: number;
    /** Angular phase speed in radians per second (signed). */
    readonly speed?: number;
    readonly phase?: number;
}
export interface WaterFoam3DOptions {
    /** Mesh-local crest height at which foam starts. */
    readonly threshold?: number;
    /** Positive height interval over which foam reaches full strength. */
    readonly fade?: number;
    readonly strength?: number;
}
export interface Water3DOptions extends Omit<MeshOptions, 'geometry' | 'material' | 'morph'> {
    /** Borrowed base-color texture, typically a solid white texture. */
    readonly texture: Texture;
    readonly width?: number;
    readonly depth?: number;
    /** Grid subdivisions per axis, 1–512; defaults to 64. */
    readonly segments?: number;
    /** Geometry waves; combined wave and normal-wave count must not exceed eight. */
    readonly waves?: readonly WaterWave3D[];
    /** Additional analytic normal ripples, without geometry displacement. */
    readonly normalWaves?: readonly WaterWave3D[];
    readonly foam?: boolean | WaterFoam3DOptions;
    /** Existing PBR factors/maps, including transmission and volume attenuation. */
    readonly materialOptions?: Omit<PBRMaterialOptions, 'texture'>;
}
export interface WaterSurface3D {
    height: number;
    normalX: number;
    normalY: number;
    normalZ: number;
    foam: number;
}
/**
 * Native PBR water on a mesh-local X/Z grid. Environment Fresnel and opaque-scene
 * refraction use the existing renderer; no scene depth texture is exposed for shoreline fade.
 * Call update(deltaSeconds) or setTime(elapsedSeconds) from the scene update.
 * Owns its material; textures remain borrowed. CPU vertices stay undeformed.
 */
export declare class Water3D extends Mesh {
    readonly material: NativePBRMaterial;
    readonly width: number;
    readonly depth: number;
    private readonly phases;
    private readonly speeds;
    private elapsed;
    constructor(options: Water3DOptions);
    get time(): number;
    setTime(seconds: number): void;
    update(deltaSeconds: number): void;
    /** Analytic shader-equivalent local surface; caller supplies reusable output. */
    sampleSurface(x: number, z: number, out: WaterSurface3D): WaterSurface3D;
    destroy(): void;
}
