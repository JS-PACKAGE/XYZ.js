import { Texture } from '../../assets/src/index.js';
import { type MaterialTexture } from '../../assets/src/texture2d.js';
import { TextureMaterial, type TextureMaterialOptions } from './mesh.js';
import type { TextureSamplerOptions } from './texture-sampler.js';
import { type OpticalMaterialMapsOptions, type MaterialMappedTextureSlot } from './optical-material-maps.js';
export type MaterialAlphaMode = 'OPAQUE' | 'MASK' | 'BLEND';
export type MaterialTextureSlot = 'texture' | 'metallicRoughness' | 'normal' | 'occlusion' | 'emissive' | 'specular' | 'specularColor' | 'clearcoat' | 'clearcoatRoughness' | 'clearcoatNormal' | 'sheenColor' | 'sheenRoughness' | 'transmission' | 'thickness';
export interface TextureCoordinateOptions {
    texCoord?: 0 | 1;
    offset?: readonly [number, number];
    rotation?: number;
    scale?: readonly [number, number];
}
export interface TextureCoordinates {
    readonly texCoord: 0 | 1;
    /** Affine `[a,b,c,d,tx,ty]`: `u'=a*u+c*v+tx; v'=b*u+d*v+ty`. */
    readonly transform: readonly [number, number, number, number, number, number];
}
export declare const pbrTextureKeys: readonly ["specularTexture", "specularColorTexture", "clearcoatTexture", "clearcoatRoughnessTexture", "clearcoatNormalTexture", "sheenColorTexture", "sheenRoughnessTexture", "transmissionTexture", "thicknessTexture", "metallicRoughnessTexture", "normalTexture", "occlusionTexture", "emissiveTexture"];
export type PBRTextureKey = (typeof pbrTextureKeys)[number];
/** Additive per-slot overrides that may be canvas or video textures; legacy Texture options remain accepted. */
export type PBRTextureSources = Partial<Record<PBRTextureKey, MaterialTexture>>;
/** Effective texture for every populated slot, including canvas/video overrides. Renderers read this. */
export declare function pbrTextureSources(material: PBRMaterial): Readonly<PBRTextureSources>;
export interface PBRMaterialOptions extends TextureMaterialOptions {
    sources?: PBRTextureSources;
    opticalMaps?: OpticalMaterialMapsOptions;
    /** Independent per-map UV selection and affine transform; absent slots use UV0 identity. */
    textureCoordinates?: Partial<Record<MaterialMappedTextureSlot, TextureCoordinateOptions>>;
    metallic?: number;
    roughness?: number;
    /** Bounded normal-footprint/derivative filtering strength [0,1], default zero. */
    specularAntiAliasing?: number;
    /** MASK-only coverage, requiring antialiasing and 0 < cutoff < 1; no transmission. */
    alphaToCoverage?: boolean;
    emissive?: [number, number, number];
    ior?: number;
    specular?: number;
    specularColor?: [number, number, number];
    specularTexture?: Texture;
    specularColorTexture?: Texture;
    specularSampler?: TextureSamplerOptions;
    specularColorSampler?: TextureSamplerOptions;
    clearcoat?: number;
    clearcoatRoughness?: number;
    clearcoatNormalScale?: number;
    clearcoatTexture?: Texture;
    clearcoatRoughnessTexture?: Texture;
    clearcoatNormalTexture?: Texture;
    clearcoatSampler?: TextureSamplerOptions;
    clearcoatRoughnessSampler?: TextureSamplerOptions;
    clearcoatNormalSampler?: TextureSamplerOptions;
    sheenColor?: [number, number, number];
    sheenRoughness?: number;
    sheenColorTexture?: Texture;
    sheenRoughnessTexture?: Texture;
    sheenColorSampler?: TextureSamplerOptions;
    sheenRoughnessSampler?: TextureSamplerOptions;
    transmission?: number;
    transmissionTexture?: Texture;
    transmissionSampler?: TextureSamplerOptions;
    thickness?: number;
    thicknessTexture?: Texture;
    thicknessSampler?: TextureSamplerOptions;
    attenuationDistance?: number;
    attenuationColor?: [number, number, number];
    metallicRoughnessTexture?: Texture;
    normalTexture?: Texture;
    normalScale?: number;
    occlusionTexture?: Texture;
    occlusionStrength?: number;
    emissiveTexture?: Texture;
    /** Borrowed baked illumination. Occupies the emissive sampler; an emissive map is not sampled while this is set. */
    lightmap?: Texture;
    lightmapSampler?: TextureSamplerOptions;
    /**
     * Scalar finish evaluated by the existing mesh shaders. Zero strengths leave
     * the current lighting unchanged. No extra sampled-texture binding is added.
     */
    finish?: PBRFinishOptions;
    textureSampler?: TextureSamplerOptions;
    metallicRoughnessSampler?: TextureSamplerOptions;
    normalSampler?: TextureSamplerOptions;
    occlusionSampler?: TextureSamplerOptions;
    emissiveSampler?: TextureSamplerOptions;
    alphaCutoff?: number;
    alphaMode?: MaterialAlphaMode;
    doubleSided?: boolean;
}
/** Factors packed after material UV coordinates. Defaults are exact lighting no-ops. */
export interface PBRFinishOptions {
    anisotropy?: number;
    /** Radians. Applied only when anisotropy is positive. */
    anisotropyRotation?: number;
    iridescence?: number;
    /** At least 1. glTF default is 1.3. Unused while iridescence is zero. */
    iridescenceIor?: number;
    /** 0..1 maps to 100..800 nanometers; native finish packing carries nanometers. */
    iridescenceThickness?: number;
    subsurface?: number;
    subsurfaceColor?: [number, number, number];
    /** Radius of the bounded three-tap angular diffusion profile, 0..1. */
    subsurfaceRadius?: number;
    /** Non-negative Abbe-like IOR spread; the shader caps strength at 10. */
    dispersion?: number;
    /** 0..1. Four-step parallax uses the normal map Z as height. */
    heightScale?: number;
    wetness?: number;
    snow?: number;
    dirt?: number;
    damage?: number;
    /** Mixes a second sample of the base map. Zero skips the sample. */
    detailStrength?: number;
    /** World-axis blend of the base map. Zero skips the extra samples. */
    triplanar?: number;
    /** Extra UV scale of the detail sample. Requires detailStrength. */
    layerBlend?: number;
    /** Multiplies the lightmap sample. Requires lightmap. */
    lightmapStrength?: number;
}
export interface PBRFinish {
    readonly anisotropy: number;
    readonly anisotropyRotation: number;
    readonly iridescence: number;
    readonly iridescenceIor: number;
    readonly iridescenceThickness: number;
    readonly subsurface: number;
    readonly subsurfaceColor: readonly [number, number, number];
    readonly subsurfaceRadius: number;
    readonly dispersion: number;
    readonly heightScale: number;
    readonly wetness: number;
    readonly snow: number;
    readonly dirt: number;
    readonly damage: number;
    readonly detailStrength: number;
    readonly triplanar: number;
    readonly layerBlend: number;
    readonly lightmapStrength: number;
}
export declare const PBR_FINISH_FLOATS = 20;
/** Metallic-roughness material; all texture slots borrow, never own, their Texture. */
export declare class PBRMaterial extends TextureMaterial {
    readonly textureCoordinates: Readonly<Partial<Record<MaterialTextureSlot, TextureCoordinates>>>;
    readonly metallic: number;
    readonly roughness: number;
    readonly emissive: [number, number, number];
    readonly ior: number;
    readonly specular: number;
    readonly specularColor: [number, number, number];
    /** Linear strength in A; specular color RGB is decoded from sRGB. */
    readonly specularTexture: Texture | undefined;
    readonly specularColorTexture: Texture | undefined;
    readonly specularSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly specularColorSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly clearcoat: number;
    readonly clearcoatRoughness: number;
    readonly clearcoatNormalScale: number;
    /** Linear R intensity, linear G roughness, independent tangent-space normal. */
    readonly clearcoatTexture: Texture | undefined;
    readonly clearcoatRoughnessTexture: Texture | undefined;
    readonly clearcoatNormalTexture: Texture | undefined;
    readonly clearcoatSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly clearcoatRoughnessSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly clearcoatNormalSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly sheenColor: [number, number, number];
    readonly sheenRoughness: number;
    /** Sheen RGB is sRGB; roughness uses linear alpha. */
    readonly sheenColorTexture: Texture | undefined;
    readonly sheenRoughnessTexture: Texture | undefined;
    readonly sheenColorSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly sheenRoughnessSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly transmission: number;
    /** Linear R, independent of alpha coverage. */
    readonly transmissionTexture: Texture | undefined;
    readonly transmissionSampler: Readonly<TextureSamplerOptions> | undefined;
    /** Mesh-local thickness; zero selects a thin wall. */
    readonly thickness: number;
    readonly thicknessTexture: Texture | undefined;
    readonly thicknessSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly attenuationDistance: number;
    readonly attenuationColor: [number, number, number];
    /** Linear texture: roughness in G, metallic in B. */
    readonly metallicRoughnessTexture: Texture | undefined;
    /** Linear tangent-space normal texture, with its own UV selection and transform. */
    readonly normalTexture: Texture | undefined;
    readonly normalScale: number;
    /** Linear occlusion in R; affects indirect illumination only. */
    readonly occlusionTexture: Texture | undefined;
    readonly occlusionStrength: number;
    /** Emissive RGB is decoded from sRGB before applying the linear emissive factor. */
    readonly emissiveTexture: Texture | undefined;
    readonly alphaCutoff: number;
    readonly alphaMode: MaterialAlphaMode;
    readonly doubleSided: boolean;
    readonly specularAntiAliasing: number;
    readonly alphaToCoverage: boolean;
    readonly textureSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly metallicRoughnessSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly normalSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly occlusionSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly emissiveSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly finish: PBRFinish;
    /** Borrowed. When set, renderers bind this to the emissive sampler and do not sample emissiveTexture. */
    readonly lightmap: Texture | undefined;
    readonly lightmapSampler: Readonly<TextureSamplerOptions> | undefined;
    constructor(options: PBRMaterialOptions);
}
/** Emissive sampler occupancy: 0 empty, 1 emission, 2 lightmap. */
export declare function pbrEmissiveSlot(material: PBRMaterial): {
    readonly texture: MaterialTexture | undefined;
    readonly sampler: Readonly<TextureSamplerOptions> | undefined;
    readonly mode: 0 | 1 | 2;
};
/** Writes the 20 finish floats consumed by both mesh shaders. */
export declare function fillPBRFinish(material: PBRMaterial, data: Float32Array, offset: number): void;
export interface MaterialAssetMaps {
    base: ImageBitmapSource | Texture;
    metallicRoughness?: ImageBitmapSource | Texture;
    normal?: ImageBitmapSource | Texture;
    occlusion?: ImageBitmapSource | Texture;
    emissive?: ImageBitmapSource | Texture;
    lightmap?: ImageBitmapSource | Texture;
}
export type MaterialAssetOverrides = Omit<PBRMaterialOptions, 'texture' | 'metallicRoughnessTexture' | 'normalTexture' | 'occlusionTexture' | 'emissiveTexture' | 'lightmap'>;
/**
 * Owns decoded images and borrows caller-supplied Textures.
 * The produced PBRMaterial never owns its slots; destroy the asset only after
 * every consumer has released the material.
 */
export declare class MaterialAsset {
    readonly material: PBRMaterial;
    private released;
    private readonly ownedTextures;
    private constructor();
    get destroyed(): boolean;
    /** Borrows every texture in options. destroy() releases no borrowed slot. */
    static create(options: PBRMaterialOptions): MaterialAsset;
    static fromImages(maps: MaterialAssetMaps, overrides?: MaterialAssetOverrides): Promise<MaterialAsset>;
    /** Destroys textures decoded by fromImages. Borrowed textures stay owned by their creator. */
    destroy(): void;
}
