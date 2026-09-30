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
