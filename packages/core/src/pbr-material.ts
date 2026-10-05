import { Texture } from '../../assets/src/index.js';
import {
  CanvasTexture2D,
  type MaterialTexture,
} from '../../assets/src/texture2d.js';
import { TextureMaterial, type TextureMaterialOptions } from './mesh.js';
import { samplerOptions } from './texture-sampler.js';
import type { TextureSamplerOptions } from './texture-sampler.js';

export type MaterialAlphaMode = 'OPAQUE' | 'MASK' | 'BLEND';

export type MaterialTextureSlot =
  | 'texture'
  | 'metallicRoughness'
  | 'normal'
  | 'occlusion'
  | 'emissive'
  | 'specular'
  | 'specularColor'
  | 'clearcoat'
  | 'clearcoatRoughness'
  | 'clearcoatNormal'
  | 'sheenColor'
  | 'sheenRoughness'
  | 'transmission'
  | 'thickness';

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

export const pbrTextureKeys = [
  'specularTexture',
  'specularColorTexture',
  'clearcoatTexture',
  'clearcoatRoughnessTexture',
  'clearcoatNormalTexture',
  'sheenColorTexture',
  'sheenRoughnessTexture',
  'transmissionTexture',
  'thicknessTexture',
  'metallicRoughnessTexture',
  'normalTexture',
  'occlusionTexture',
  'emissiveTexture',
] as const;
export type PBRTextureKey = (typeof pbrTextureKeys)[number];
/** Additive per-slot overrides that may be canvas or video textures; legacy Texture options remain accepted. */
export type PBRTextureSources = Partial<Record<PBRTextureKey, MaterialTexture>>;

const pbrSourceRegistry = new WeakMap<object, Readonly<PBRTextureSources>>();
const emptyPbrSources: Readonly<PBRTextureSources> = Object.freeze({});
/** Effective texture for every populated slot, including canvas/video overrides. Renderers read this. */
export function pbrTextureSources(
  material: PBRMaterial,
): Readonly<PBRTextureSources> {
  return pbrSourceRegistry.get(material) ?? emptyPbrSources;
}

export interface PBRMaterialOptions extends TextureMaterialOptions {
  sources?: PBRTextureSources;
  /** Independent per-map UV selection and affine transform; absent slots use UV0 identity. */
  textureCoordinates?: Partial<
    Record<MaterialTextureSlot, TextureCoordinateOptions>
  >;
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

function textureCoordinates(
  options: PBRMaterialOptions['textureCoordinates'],
): Readonly<Partial<Record<MaterialTextureSlot, TextureCoordinates>>> {
  const result: Partial<Record<MaterialTextureSlot, TextureCoordinates>> = {};
  const slots: readonly MaterialTextureSlot[] = [
    'texture',
    'metallicRoughness',
    'normal',
    'occlusion',
    'emissive',
    'specular',
    'specularColor',
    'clearcoat',
    'clearcoatRoughness',
    'clearcoatNormal',
    'sheenColor',
    'sheenRoughness',
    'transmission',
    'thickness',
  ];
  if (options !== undefined) {
    if (!options || typeof options !== 'object' || Array.isArray(options))
      throw new TypeError('Texture coordinates must be a per-map object.');
    for (const key of Object.keys(options)) {
      if (!slots.includes(key as MaterialTextureSlot))
        throw new RangeError('Unknown material texture coordinate slot.');
      const value = options[key as MaterialTextureSlot];
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new TypeError('Texture coordinate options must be an object.');
      const texCoord = value.texCoord ?? 0;
      if (texCoord !== 0 && texCoord !== 1)
        throw new RangeError('Texture coordinates require UV0 or UV1.');
      const offset = value.offset ?? [0, 0],
        scale = value.scale ?? [1, 1];
      if (offset.length !== 2 || scale.length !== 2)
        throw new RangeError('UV offset and scale require two components.');
      const rotation = value.rotation ?? 0;
      for (const component of [...offset, ...scale, rotation])
        finite(component, 'Texture transform');
      const cos = Math.cos(rotation),
        sin = Math.sin(rotation);
      const transform: [number, number, number, number, number, number] = [
        cos * scale[0],
        sin * scale[0],
        -sin * scale[1],
        cos * scale[1],
        offset[0],
        offset[1],
      ];
      for (const component of transform) finite(component, 'Texture transform');
      result[key as MaterialTextureSlot] = Object.freeze({
        texCoord,
        transform: Object.freeze(transform),
      });
    }
  }
  return Object.freeze(result);
}

/** Metallic-roughness material; all texture slots borrow, never own, their Texture. */
export class PBRMaterial extends TextureMaterial {
  readonly textureCoordinates: Readonly<
    Partial<Record<MaterialTextureSlot, TextureCoordinates>>
  >;
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
  declare readonly textureSampler: Readonly<TextureSamplerOptions> | undefined;
  readonly metallicRoughnessSampler:
    Readonly<TextureSamplerOptions> | undefined;
  readonly normalSampler: Readonly<TextureSamplerOptions> | undefined;
  readonly occlusionSampler: Readonly<TextureSamplerOptions> | undefined;
  readonly emissiveSampler: Readonly<TextureSamplerOptions> | undefined;

  constructor(options: PBRMaterialOptions) {
    super(options);
    this.textureCoordinates = textureCoordinates(options.textureCoordinates);
    const metallic = options.metallic ?? 0;
    const roughness = options.roughness ?? 0.5;
    const specularAntiAliasing = options.specularAntiAliasing ?? 0;
    unit(specularAntiAliasing, 'Specular anti-aliasing strength');
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
    const alphaToCoverage = options.alphaToCoverage ?? false;
    if (typeof alphaToCoverage !== 'boolean')
      throw new TypeError('Alpha-to-coverage must be boolean.');
    if (
      alphaToCoverage &&
      (alphaMode !== 'MASK' ||
        alphaCutoff <= 0 ||
        alphaCutoff >= 1 ||
        transmission > 0)
    )
      throw new RangeError(
        'Alpha-to-coverage requires MASK, 0 < cutoff < 1, and no transmission.',
      );
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
    const sources: PBRTextureSources = {};
    if (options.sources !== undefined) {
      for (const key of Object.keys(options.sources))
        if (!(pbrTextureKeys as readonly string[]).includes(key))
          throw new TypeError(`Unknown PBR texture source ${key}.`);
    }
    for (const key of pbrTextureKeys) {
      const override = options.sources?.[key];
      if (
        override !== undefined &&
        !(override instanceof Texture) &&
        !(override instanceof CanvasTexture2D)
      )
        throw new TypeError(
          `${key} source must be a Texture or CanvasTexture2D.`,
        );
      const value = override ?? options[key];
      if (value !== undefined) sources[key] = value;
    }
    pbrSourceRegistry.set(this, Object.freeze(sources));
    this.alphaCutoff = alphaCutoff;
    this.alphaMode = alphaMode;
    this.doubleSided = doubleSided;
    this.specularAntiAliasing = specularAntiAliasing;
    this.alphaToCoverage = alphaToCoverage;
    this.metallicRoughnessSampler = samplerOptions(
      options.metallicRoughnessSampler,
    );
    this.normalSampler = samplerOptions(options.normalSampler);
    this.occlusionSampler = samplerOptions(options.occlusionSampler);
    this.emissiveSampler = samplerOptions(options.emissiveSampler);
  }
}
