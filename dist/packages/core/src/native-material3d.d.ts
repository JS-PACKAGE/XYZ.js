import { Texture } from '../../assets/src/index.js';
import { type MaterialTexture } from '../../assets/src/texture2d.js';
import { TextureMaterial, type TextureMaterialOptions } from './mesh.js';
import { NativePBRMaterial } from './native-pbr-material.js';
/** Effective maps (canvas/video overrides applied) that renderers bind. */
export declare function nativeMaterialSources(material: NativeMaterial3D): readonly MaterialTexture[];
export interface NativeMaterial3DOptions extends TextureMaterialOptions {
    /** Native declarations defining xyzDeform and xyzSurface. No entry points or transpilation. */
    readonly wgsl: string;
    readonly glsl: string;
    readonly uniforms?: ArrayLike<number>;
    /** Four borrowed maps, available as xyzMap0..3 and xyzSampler0..3 (WGSL). */
    readonly textures?: readonly Texture[];
    /** Additive per-index canvas/video overrides for `textures` (or extra maps when absent). */
    readonly textureSources?: readonly MaterialTexture[];
    readonly label?: string;
    /** Maximum final mesh-local vertex displacement; absent means unbounded and disables bounds culling. */
    readonly deformationBounds?: number;
    /** Tracked hooks promise deterministic output from vertex inputs, uniforms and borrowed maps only. */
    shadowCache?: 'dynamic' | 'tracked';
}
/** Per-mesh native shader hooks; resources remain caller-owned, including on loss. */
export declare class NativeMaterial3D extends TextureMaterial {
    private readonly state;
    readonly label: string;
    private readonly borrowedMaps;
    readonly deformationBounds: number | undefined;
    readonly uniforms: Float32Array<ArrayBuffer>;
    readonly shadowCache: 'dynamic' | 'tracked';
    constructor(options: NativeMaterial3DOptions);
    get wgsl(): string;
    /** GLSL may branch on XYZ_VERTEX / XYZ_FRAGMENT / XYZ_SHADOW for stage-only intrinsics. */
    get glsl(): string;
    get textures(): readonly Texture[];
    get destroyed(): boolean;
    setUniforms(values: ArrayLike<number>, offset?: number): void;
    /** Validate the public mutable uniform view before native preparation/submission. */
    validate(): void;
    onDestroy(listener: () => void): () => void;
    destroy(): void;
}
export declare function isNativeMaterial3D(material: object): material is NativeMaterial3D | NativePBRMaterial;
