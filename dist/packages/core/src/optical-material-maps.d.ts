import { Texture } from '../../assets/src/index.js';
import { CanvasTexture2D } from '../../assets/src/texture2d.js';
import type { PBRMaterial, MaterialTextureSlot, TextureCoordinates } from './pbr-material.js';
import { type TextureSamplerOptions } from './texture-sampler.js';
export type MaterialOpticalTextureSlot = 'anisotropy' | 'iridescence' | 'iridescenceThickness';
export type MaterialMappedTextureSlot = MaterialTextureSlot | MaterialOpticalTextureSlot;
/** Combined UV view without broadening the published material member's type. */
export declare function materialTextureCoordinates(material: PBRMaterial): Readonly<Partial<Record<MaterialMappedTextureSlot, TextureCoordinates>>>;
/** Borrowed linear maps; thickness bounds are in nanometers. */
export interface OpticalMaterialMapsOptions {
    anisotropyTexture?: Texture | CanvasTexture2D;
    anisotropySampler?: TextureSamplerOptions;
    iridescenceTexture?: Texture | CanvasTexture2D;
    iridescenceSampler?: TextureSamplerOptions;
    iridescenceThicknessTexture?: Texture | CanvasTexture2D;
    iridescenceThicknessSampler?: TextureSamplerOptions;
    iridescenceThicknessMinimum?: number;
    iridescenceThicknessMaximum?: number;
}
export interface OpticalMaterialMaps {
    readonly anisotropyTexture?: Texture | CanvasTexture2D;
    readonly anisotropySampler?: Readonly<TextureSamplerOptions>;
    readonly iridescenceTexture?: Texture | CanvasTexture2D;
    readonly iridescenceSampler?: Readonly<TextureSamplerOptions>;
    readonly iridescenceThicknessTexture?: Texture | CanvasTexture2D;
    readonly iridescenceThicknessSampler?: Readonly<TextureSamplerOptions>;
    readonly iridescenceThicknessMinimum: number;
    readonly iridescenceThicknessMaximum: number;
}
export declare function opticalMaterialMaps(material: PBRMaterial): OpticalMaterialMaps;
/** Distinguishes authored nm bounds from legacy scalar-only film thickness. */
export declare function hasOpticalMaterialMaps(material: PBRMaterial): boolean;
/** Constructor hook, kept outside the published material class shape. */
export declare function registerOpticalMaterialMaps(material: PBRMaterial, options: OpticalMaterialMapsOptions | undefined): void;
