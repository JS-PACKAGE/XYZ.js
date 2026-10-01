import { Texture } from '../../assets/src/index.js';
import { TextureMaterial, type TextureMaterialOptions } from './mesh.js';
export type MaterialAlphaMode = 'OPAQUE' | 'MASK' | 'BLEND';
export interface TextureSamplerOptions {
    minFilter?: 'nearest' | 'linear';
    magFilter?: 'nearest' | 'linear';
    addressModeU?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
    addressModeV?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
}
export interface PBRMaterialOptions extends TextureMaterialOptions {
    metallic?: number;
    roughness?: number;
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
    textureSampler?: TextureSamplerOptions;
    metallicRoughnessSampler?: TextureSamplerOptions;
    normalSampler?: TextureSamplerOptions;
    occlusionSampler?: TextureSamplerOptions;
    emissiveSampler?: TextureSamplerOptions;
    alphaCutoff?: number;
    alphaMode?: MaterialAlphaMode;
    doubleSided?: boolean;
}
/** Metallic-roughness material; all texture slots borrow, never own, their Texture. */
export declare class PBRMaterial extends TextureMaterial {
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
    /** Linear tangent-space normal texture, using UV0. */
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
    readonly textureSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly metallicRoughnessSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly normalSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly occlusionSampler: Readonly<TextureSamplerOptions> | undefined;
    readonly emissiveSampler: Readonly<TextureSamplerOptions> | undefined;
    constructor(options: PBRMaterialOptions);
}
