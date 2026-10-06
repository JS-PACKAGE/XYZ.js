import type { MaterialTexture } from '../../assets/src/texture2d.js';
import type { TextureSamplerOptions } from '../../core/src/texture-sampler.js';
import {
  type PBRMaterial,
  pbrTextureSources,
} from '../../core/src/pbr-material.js';
import { opticalMaterialMaps } from '../../core/src/optical-material-maps.js';
import { materialTextureSlots } from '../../../src/data/rendering.js';

export const mappedMaterialTextureSlots = Object.freeze([
  ...materialTextureSlots,
  'anisotropy',
  'iridescence',
  'iridescenceThickness',
] as const);
export const mappedMaterialUVFloatCount = mappedMaterialTextureSlots.length * 8;

/** Five optical layers share one binding inside the 16-slot baseline.
 * Native texels are flattened into compact square layers without resampling;
 * shader texel addressing preserves independent filtering and wrap modes. */
export function fillOpticalMapSettings(
  data: Float32Array,
  offset: number,
  texture: MaterialTexture | undefined,
  sampler: TextureSamplerOptions | undefined,
  maxAnisotropy = 16,
): void {
  data[offset] = texture?.width ?? 0;
  data[offset + 1] = texture?.height ?? 0;
  const u =
    sampler?.addressModeU === 'repeat'
      ? 1
      : sampler?.addressModeU === 'mirror-repeat'
        ? 2
        : 0;
  const v =
    sampler?.addressModeV === 'repeat'
      ? 1
      : sampler?.addressModeV === 'mirror-repeat'
        ? 2
        : 0;
  data[offset + 2] = u + v * 3;
  data[offset + 3] =
    (sampler?.minFilter === 'nearest' ? 0 : 1) +
    (sampler?.magFilter === 'nearest' ? 0 : 2) +
    4 * (Math.min(sampler?.maxAnisotropy ?? 1, maxAnisotropy) - 1);
}

export function opticalMapSources(
  material: PBRMaterial,
): readonly (MaterialTexture | undefined)[] {
  const legacy = pbrTextureSources(material);
  const maps = opticalMaterialMaps(material);
  return [
    legacy.transmissionTexture,
    legacy.thicknessTexture,
    maps.anisotropyTexture,
    maps.iridescenceTexture,
    maps.iridescenceThicknessTexture,
  ];
}

export function fillMappedOpticalSettings(
  material: PBRMaterial,
  data: Float32Array,
  offset: number,
  maxAnisotropy = 16,
): void {
  const maps = opticalMaterialMaps(material);
  fillOpticalMapSettings(
    data,
    offset,
    maps.anisotropyTexture,
    maps.anisotropySampler,
    maxAnisotropy,
  );
  fillOpticalMapSettings(
    data,
    offset + 4,
    maps.iridescenceTexture,
    maps.iridescenceSampler,
    maxAnisotropy,
  );
  fillOpticalMapSettings(
    data,
    offset + 8,
    maps.iridescenceThicknessTexture,
    maps.iridescenceThicknessSampler,
    maxAnisotropy,
  );
  data[offset + 12] = maps.iridescenceThicknessMinimum;
  data[offset + 13] = maps.iridescenceThicknessMaximum;
  data[offset + 14] = 0;
  data[offset + 15] = 0;
}
