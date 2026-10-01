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

function finite(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
    throw new RangeError(`${name} must be finite and fit in Float32.`);
}

function unit(value: number, name: string): void {
  finite(value, name);
  if (value < 0 || value > 1)
    throw new RangeError(`${name} must be between 0 and 1.`);
}

function textureSlot(value: Texture | undefined, name: string): void {
  if (value !== undefined && !(value instanceof Texture))
    throw new TypeError(`${name} must be a Texture.`);
}

function samplerOptions(
  value: TextureSamplerOptions | undefined,
): Readonly<TextureSamplerOptions> | undefined {
  if (value === undefined) return undefined;
  if (
    (value.minFilter !== undefined &&
      value.minFilter !== 'nearest' &&
      value.minFilter !== 'linear') ||
    (value.magFilter !== undefined &&
      value.magFilter !== 'nearest' &&
      value.magFilter !== 'linear')
  )
    throw new RangeError('Texture sampler filters must be nearest or linear.');
  for (const mode of [value.addressModeU, value.addressModeV])
    if (
      mode !== undefined &&
      mode !== 'clamp-to-edge' &&
      mode !== 'repeat' &&
      mode !== 'mirror-repeat'
    )
      throw new RangeError(
        'Texture sampler address modes must be clamp-to-edge, repeat or mirror-repeat.',
      );
  return Object.freeze({ ...value });
}

/** Metallic-roughness material; all texture slots borrow, never own, their Texture. */
export class PBRMaterial extends TextureMaterial {
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
  readonly clearcoatRoughnessSampler:
    Readonly<TextureSamplerOptions> | undefined;
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
  readonly metallicRoughnessSampler:
    Readonly<TextureSamplerOptions> | undefined;
  readonly normalSampler: Readonly<TextureSamplerOptions> | undefined;
  readonly occlusionSampler: Readonly<TextureSamplerOptions> | undefined;
  readonly emissiveSampler: Readonly<TextureSamplerOptions> | undefined;

  constructor(options: PBRMaterialOptions) {
    super(options);
    const metallic = options.metallic ?? 0;
    const roughness = options.roughness ?? 0.5;
    const emissive = options.emissive ?? [0, 0, 0];
    const ior = options.ior ?? 1.5;
    const specular = options.specular ?? 1;
    const specularColor = options.specularColor ?? [1, 1, 1];
    finite(ior, 'Index of refraction');
    if (ior !== 0 && ior < 1)
      throw new RangeError('Index of refraction must be zero or at least one.');
    unit(specular, 'Specular strength');
    if (!Array.isArray(specularColor) || specularColor.length !== 3)
      throw new RangeError('Specular color must contain three components.');
    for (const value of specularColor) {
      finite(value, 'Specular color component');
      if (value < 0)
        throw new RangeError('Specular color components cannot be negative.');
    }
    textureSlot(options.specularTexture, 'Specular texture');
    textureSlot(options.specularColorTexture, 'Specular color texture');
    const clearcoat = options.clearcoat ?? 0;
    const clearcoatRoughness = options.clearcoatRoughness ?? 0;
    const clearcoatNormalScale = options.clearcoatNormalScale ?? 1;
    unit(clearcoat, 'Clearcoat factor');
    unit(clearcoatRoughness, 'Clearcoat roughness');
    finite(clearcoatNormalScale, 'Clearcoat normal scale');
    textureSlot(options.clearcoatTexture, 'Clearcoat texture');
    textureSlot(
      options.clearcoatRoughnessTexture,
      'Clearcoat roughness texture',
    );
    textureSlot(options.clearcoatNormalTexture, 'Clearcoat normal texture');
    const sheenColor = options.sheenColor ?? [0, 0, 0];
    const sheenRoughness = options.sheenRoughness ?? 0;
    if (!Array.isArray(sheenColor) || sheenColor.length !== 3)
      throw new RangeError('Sheen color must contain three components.');
    for (const value of sheenColor) unit(value, 'Sheen color component');
    unit(sheenRoughness, 'Sheen roughness');
    textureSlot(options.sheenColorTexture, 'Sheen color texture');
    textureSlot(options.sheenRoughnessTexture, 'Sheen roughness texture');
    const transmission = options.transmission ?? 0;
    const thickness = options.thickness ?? 0;
    const attenuationDistance = options.attenuationDistance ?? Infinity;
    const attenuationColor = options.attenuationColor ?? [1, 1, 1];
    unit(transmission, 'Transmission factor');
    finite(thickness, 'Volume thickness');
    if (thickness < 0)
      throw new RangeError('Volume thickness cannot be negative.');
    if (
      !(attenuationDistance > 0) ||
      (attenuationDistance !== Infinity &&
        !Number.isFinite(attenuationDistance))
    )
      throw new RangeError(
        'Attenuation distance must be positive or Infinity.',
      );
    if (!Array.isArray(attenuationColor) || attenuationColor.length !== 3)
      throw new RangeError('Attenuation color must contain three components.');
    for (const value of attenuationColor)
      unit(value, 'Attenuation color component');
    textureSlot(options.transmissionTexture, 'Transmission texture');
    textureSlot(options.thicknessTexture, 'Thickness texture');
    const normalScale = options.normalScale ?? 1;
    const occlusionStrength = options.occlusionStrength ?? 1;
    const alphaCutoff = options.alphaCutoff ?? 0;
    const alphaMode = options.alphaMode ?? (alphaCutoff > 0 ? 'MASK' : 'BLEND');
    const doubleSided = options.doubleSided ?? true;
    unit(metallic, 'Metallic factor');
    unit(roughness, 'Roughness factor');
    unit(occlusionStrength, 'Occlusion strength');
    if (!Array.isArray(emissive) || emissive.length !== 3)
      throw new RangeError('Emissive color must contain three components.');
    for (let i = 0; i < 3; i++) {
      finite(emissive[i], 'Emissive color component');
      if (emissive[i] < 0)
        throw new RangeError('Emissive color components cannot be negative.');
    }
    // glTF permits signed normal scales and alpha cutoffs above one.
    finite(normalScale, 'Normal scale');
    finite(alphaCutoff, 'Alpha cutoff');
    if (alphaCutoff < 0)
      throw new RangeError('Alpha cutoff cannot be negative.');
    if (alphaMode !== 'OPAQUE' && alphaMode !== 'MASK' && alphaMode !== 'BLEND')
      throw new RangeError(
        'Material alpha mode must be OPAQUE, MASK, or BLEND.',
      );
    if (typeof doubleSided !== 'boolean')
      throw new TypeError('Double-sided material setting must be boolean.');
    textureSlot(options.metallicRoughnessTexture, 'Metallic-roughness texture');
    textureSlot(options.normalTexture, 'Normal texture');
    textureSlot(options.occlusionTexture, 'Occlusion texture');
    textureSlot(options.emissiveTexture, 'Emissive texture');
    this.metallic = metallic;
    this.roughness = roughness;
    this.emissive = [emissive[0], emissive[1], emissive[2]];
    this.ior = ior;
    this.specular = specular;
    this.specularColor = [...specularColor] as [number, number, number];
    this.specularTexture = options.specularTexture;
    this.specularColorTexture = options.specularColorTexture;
    this.specularSampler = samplerOptions(options.specularSampler);
    this.specularColorSampler = samplerOptions(options.specularColorSampler);
    this.clearcoat = clearcoat;
    this.clearcoatRoughness = clearcoatRoughness;
    this.clearcoatNormalScale = clearcoatNormalScale;
    this.clearcoatTexture = options.clearcoatTexture;
    this.clearcoatRoughnessTexture = options.clearcoatRoughnessTexture;
    this.clearcoatNormalTexture = options.clearcoatNormalTexture;
    this.clearcoatSampler = samplerOptions(options.clearcoatSampler);
    this.clearcoatRoughnessSampler = samplerOptions(
      options.clearcoatRoughnessSampler,
    );
    this.clearcoatNormalSampler = samplerOptions(
      options.clearcoatNormalSampler,
    );
    this.sheenColor = [...sheenColor] as [number, number, number];
    this.sheenRoughness = sheenRoughness;
    this.sheenColorTexture = options.sheenColorTexture;
    this.sheenRoughnessTexture = options.sheenRoughnessTexture;
    this.sheenColorSampler = samplerOptions(options.sheenColorSampler);
    this.sheenRoughnessSampler = samplerOptions(options.sheenRoughnessSampler);
    this.transmission = transmission;
    this.transmissionTexture = options.transmissionTexture;
    this.transmissionSampler = samplerOptions(options.transmissionSampler);
    this.thickness = thickness;
    this.thicknessTexture = options.thicknessTexture;
    this.thicknessSampler = samplerOptions(options.thicknessSampler);
    this.attenuationDistance = attenuationDistance;
    this.attenuationColor = [...attenuationColor] as [number, number, number];
    this.metallicRoughnessTexture = options.metallicRoughnessTexture;
    this.normalTexture = options.normalTexture;
    this.normalScale = normalScale;
    this.occlusionTexture = options.occlusionTexture;
    this.occlusionStrength = occlusionStrength;
    this.emissiveTexture = options.emissiveTexture;
    this.alphaCutoff = alphaCutoff;
    this.alphaMode = alphaMode;
    this.doubleSided = doubleSided;
    this.textureSampler = samplerOptions(options.textureSampler);
    this.metallicRoughnessSampler = samplerOptions(
      options.metallicRoughnessSampler,
    );
    this.normalSampler = samplerOptions(options.normalSampler);
    this.occlusionSampler = samplerOptions(options.occlusionSampler);
    this.emissiveSampler = samplerOptions(options.emissiveSampler);
  }
}
