import { Texture } from '../../assets/src/index.js';
import { proceduralMaterialLimits } from '../../../src/data/materials.js';
import { PBRMaterial, type PBRMaterialOptions } from './pbr-material.js';
import { generateProceduralMaps } from './procedural-material-maps.js';

export type ProceduralMaterialKind =
  'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble';

export interface ProceduralMaterialOptions {
  size?: number;
  seed?: number;
}

interface ProceduralTextures {
  readonly baseColor: Texture;
  readonly normal: Texture;
  readonly metallicRoughness: Texture;
  readonly occlusion: Texture;
}

const kinds: readonly ProceduralMaterialKind[] = [
  'wood',
  'brick',
  'stone',
  'metal',
  'fabric',
  'marble',
];
const repeatSampler = Object.freeze({
  addressModeU: 'repeat',
  addressModeV: 'repeat',
} as const);

/** Owns four generated maps. Materials, meshes and scenes only borrow them. */
export class ProceduralMaterial {
  readonly kind: ProceduralMaterialKind;
  readonly textures: Readonly<ProceduralTextures>;
  readonly material: PBRMaterial;
  private disposed = false;

  private constructor(
    kind: ProceduralMaterialKind,
    textures: ProceduralTextures,
  ) {
    this.kind = kind;
    this.textures = Object.freeze(textures);
    this.material = this.createMaterial();
  }

  static async create(
    kind: ProceduralMaterialKind,
    options: ProceduralMaterialOptions = {},
  ): Promise<ProceduralMaterial> {
    if (!kinds.includes(kind))
      throw new RangeError('Unknown procedural material kind.');
    if (!options || typeof options !== 'object' || Array.isArray(options))
      throw new TypeError('Procedural material options must be an object.');
    const size =
      options.size === undefined
        ? proceduralMaterialLimits.defaultSize
        : options.size;
    const seed =
      options.seed === undefined
        ? proceduralMaterialLimits.defaultSeed
        : options.seed;
    if (
      !Number.isInteger(size) ||
      size < proceduralMaterialLimits.minSize ||
      size > proceduralMaterialLimits.maxSize
    )
      throw new RangeError(
        'Procedural material size must be an integer between 32 and 1024.',
      );
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
      throw new RangeError(
        'Procedural material seed must be an unsigned 32-bit integer.',
      );
    const maps = generateProceduralMaps(kind, size, seed);
    const acquired: Texture[] = [];
    // Sequential acquisition keeps cleanup deterministic even when decoding a later map fails.
    try {
      for (const pixels of [
        maps.baseColor,
        maps.normal,
        maps.metallicRoughness,
        maps.occlusion,
      ]) {
        const image = new ImageData(size, size);
        image.data.set(pixels);
        acquired.push(await Texture.fromImage(image));
      }
      return new ProceduralMaterial(kind, {
        baseColor: acquired[0],
        normal: acquired[1],
        metallicRoughness: acquired[2],
        occlusion: acquired[3],
      });
    } catch (error) {
      for (const texture of acquired) texture.destroy();
      throw error;
    }
  }

  /** Creates an independent material borrowing these maps; overrides never transfer ownership. */
  createMaterial(options: Partial<PBRMaterialOptions> = {}): PBRMaterial {
    if (this.disposed)
      throw new Error(
        'Cannot create a material from a destroyed procedural preset.',
      );
    return new PBRMaterial({
      texture: this.textures.baseColor,
      normalTexture: this.textures.normal,
      metallicRoughnessTexture: this.textures.metallicRoughness,
      occlusionTexture: this.textures.occlusion,
      metallic: this.kind === 'metal' ? 1 : 0,
      roughness: 1,
      alphaMode: 'OPAQUE',
      textureSampler: repeatSampler,
      normalSampler: repeatSampler,
      metallicRoughnessSampler: repeatSampler,
      occlusionSampler: repeatSampler,
      ...options,
    });
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  /** Remove every consumer before releasing this preset's maps. Does not destroy materials. */
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.textures.baseColor.destroy();
    this.textures.normal.destroy();
    this.textures.metallicRoughness.destroy();
    this.textures.occlusion.destroy();
  }
}
