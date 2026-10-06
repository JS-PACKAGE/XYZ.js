import { Texture } from '../../assets/src/index.js';
import { CanvasTexture2D } from '../../assets/src/texture2d.js';
import type {
  PBRMaterial,
  MaterialTextureSlot,
  TextureCoordinates,
} from './pbr-material.js';
import {
  samplerOptions,
  type TextureSamplerOptions,
} from './texture-sampler.js';

export type MaterialOpticalTextureSlot =
  'anisotropy' | 'iridescence' | 'iridescenceThickness';
export type MaterialMappedTextureSlot =
  MaterialTextureSlot | MaterialOpticalTextureSlot;

/** Combined UV view without broadening the published material member's type. */
export function materialTextureCoordinates(
  material: PBRMaterial,
): Readonly<Partial<Record<MaterialMappedTextureSlot, TextureCoordinates>>> {
  return material.textureCoordinates;
}

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

const registry = new WeakMap<object, OpticalMaterialMaps>();
const defaults: OpticalMaterialMaps = Object.freeze({
  iridescenceThicknessMinimum: 100,
  iridescenceThicknessMaximum: 400,
});

export function opticalMaterialMaps(
  material: PBRMaterial,
): OpticalMaterialMaps {
  return registry.get(material) ?? defaults;
}
/** Distinguishes authored nm bounds from legacy scalar-only film thickness. */
export function hasOpticalMaterialMaps(material: PBRMaterial): boolean {
  return registry.has(material);
}

/** Constructor hook, kept outside the published material class shape. */
export function registerOpticalMaterialMaps(
  material: PBRMaterial,
  options: OpticalMaterialMapsOptions | undefined,
): void {
  if (options === undefined) return;
  if (!options || typeof options !== 'object' || Array.isArray(options))
    throw new TypeError('Optical maps must be an object.');
  const allowed: Record<string, true> = {
    anisotropyTexture: true,
    anisotropySampler: true,
    iridescenceTexture: true,
    iridescenceSampler: true,
    iridescenceThicknessTexture: true,
    iridescenceThicknessSampler: true,
    iridescenceThicknessMinimum: true,
    iridescenceThicknessMaximum: true,
  };
  for (const key of Object.keys(options))
    if (!Object.hasOwn(allowed, key))
      throw new TypeError(`Unknown optical map option ${key}.`);
  for (const key of [
    'anisotropyTexture',
    'iridescenceTexture',
    'iridescenceThicknessTexture',
  ] as const) {
    const texture = options[key];
    if (
      texture !== undefined &&
      !(texture instanceof Texture) &&
      !(texture instanceof CanvasTexture2D)
    )
      throw new TypeError(`${key} must be a Texture or CanvasTexture2D.`);
  }
  const minimum = options.iridescenceThicknessMinimum ?? 100;
  const maximum = options.iridescenceThicknessMaximum ?? 400;
  if (
    !Number.isFinite(minimum) ||
    minimum < 0 ||
    !Number.isFinite(maximum) ||
    maximum < minimum
  )
    throw new RangeError(
      'Iridescence thickness bounds must be finite, non-negative, and ordered.',
    );
  registry.set(
    material,
    Object.freeze({
      anisotropyTexture: options.anisotropyTexture,
      anisotropySampler: samplerOptions(options.anisotropySampler),
      iridescenceTexture: options.iridescenceTexture,
      iridescenceSampler: samplerOptions(options.iridescenceSampler),
      iridescenceThicknessTexture: options.iridescenceThicknessTexture,
      iridescenceThicknessSampler: samplerOptions(
        options.iridescenceThicknessSampler,
      ),
      iridescenceThicknessMinimum: minimum,
      iridescenceThicknessMaximum: maximum,
    }),
  );
}
