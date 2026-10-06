import type { MaterialTexture } from '../../assets/src/texture2d.js';
import type { TextureSamplerOptions } from '../../core/src/texture-sampler.js';
import { type PBRMaterial } from '../../core/src/pbr-material.js';
export declare const mappedMaterialTextureSlots: readonly ["texture", "metallicRoughness", "normal", "occlusion", "emissive", "specular", "specularColor", "clearcoat", "clearcoatRoughness", "clearcoatNormal", "sheenColor", "sheenRoughness", "transmission", "thickness", "anisotropy", "iridescence", "iridescenceThickness"];
export declare const mappedMaterialUVFloatCount: number;
/** Five optical layers share one binding inside the 16-slot baseline.
 * Native texels are flattened into compact square layers without resampling;
 * shader texel addressing preserves independent filtering and wrap modes. */
export declare function fillOpticalMapSettings(data: Float32Array, offset: number, texture: MaterialTexture | undefined, sampler: TextureSamplerOptions | undefined, maxAnisotropy?: number): void;
export declare function opticalMapSources(material: PBRMaterial): readonly (MaterialTexture | undefined)[];
export declare function fillMappedOpticalSettings(material: PBRMaterial, data: Float32Array, offset: number, maxAnisotropy?: number): void;
