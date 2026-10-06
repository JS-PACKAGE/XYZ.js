import { terrainLimits } from '../../../src/data/terrain.js';
import { Texture } from '../../assets/src/index.js';
import { NativePBRMaterial } from './native-pbr-material.js';
import {
  terrainChannel,
  terrainImageData,
  type TerrainImageData,
  type TerrainImageSource,
} from './terrain-data.js';

export interface TerrainSplatLayer {
  /** Opaque color source; alpha-bearing layers are rejected, not silently discarded. */
  readonly baseColor: TerrainImageSource;
  readonly normal?: TerrainImageSource;
  /** G roughness / B metallic, following the PBR texture contract. */
  readonly metallicRoughness?: TerrainImageSource;
  readonly occlusion?: TerrainImageSource;
  readonly emissive?: TerrainImageSource;
  readonly color?: readonly [number, number, number];
  readonly metallic?: number;
  readonly roughness?: number;
  readonly normalScale?: number;
  readonly emissiveFactor?: readonly [number, number, number];
  readonly scale?: readonly [number, number];
}
export interface TerrainSplatOptions {
  readonly layers: readonly TerrainSplatLayer[];
  /** RGBA gives the weights of layers 0..3; zero total weight selects layer zero. */
  readonly weights: TerrainImageSource;
  readonly size?: number;
}
export interface TerrainSplatImageData extends TerrainImageData {
  readonly data: Uint8ClampedArray<ArrayBuffer>;
}
export interface TerrainSplatMaps {
  readonly baseColor: TerrainSplatImageData;
  readonly normal: TerrainSplatImageData;
  /** R occlusion / G roughness / B metallic, consumed by the physical hook. */
  readonly metallicRoughness: TerrainSplatImageData;
  readonly emissive: TerrainSplatImageData;
}
function linear(x: number): number {
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
function srgb(x: number): number {
  return x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055;
}
function unit(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1)
    throw new RangeError(`${name} must be in [0,1].`);
  return value;
}
function byte(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 255);
}

/** Deterministic static splat bake. No browser/GPU resources are created by this function. */
export function bakeTerrainSplat(
  options: TerrainSplatOptions,
): TerrainSplatMaps {
  const size = options.size ?? terrainLimits.splatSize;
  if (
    !Number.isInteger(size) ||
    size < 2 ||
    size > terrainLimits.maxSplatSize ||
    !options.layers.length ||
    options.layers.length > terrainLimits.maxSplatLayers
  )
    throw new RangeError(
      'Terrain splat requires 1..4 layers and a bounded integer size.',
    );
  const weights = terrainImageData(options.weights);
  const layers = options.layers.map((layer) => {
    const color = layer.color ?? [1, 1, 1],
      emission = layer.emissiveFactor ?? [1, 1, 1],
      scale = layer.scale ?? [1, 1];
    if (
      color.length !== 3 ||
      emission.length !== 3 ||
      scale.length !== 2 ||
      scale.some((x) => !Number.isFinite(x) || x <= 0)
    )
      throw new RangeError('Invalid terrain layer color or UV scale.');
    color.forEach((x) => unit(x, 'Terrain layer color'));
    emission.forEach((x) => unit(x, 'Terrain layer emission'));
    const normalScale = layer.normalScale ?? 1;
    if (!Number.isFinite(normalScale) || normalScale < 0)
      throw new RangeError(
        'Terrain normal scale must be nonnegative and finite.',
      );
    const base = terrainImageData(layer.baseColor);
    for (let i = 3; i < base.data.length; i += 4)
      if (base.data[i] !== 255)
        throw new RangeError('Terrain splat layers must be opaque.');
    return {
      base,
      normal: layer.normal ? terrainImageData(layer.normal) : undefined,
      mr: layer.metallicRoughness
        ? terrainImageData(layer.metallicRoughness)
        : undefined,
      ao: layer.occlusion ? terrainImageData(layer.occlusion) : undefined,
      emission: layer.emissive ? terrainImageData(layer.emissive) : undefined,
      color,
      emissionFactor: emission,
      scale,
      normalScale,
      metallic: unit(layer.metallic ?? 0, 'Terrain metallic'),
      roughness: unit(layer.roughness ?? 1, 'Terrain roughness'),
    };
  });
  const base = new Uint8ClampedArray(size * size * 4),
    normal = new Uint8ClampedArray(base.length),
    mr = new Uint8ClampedArray(base.length),
    emission = new Uint8ClampedArray(base.length);
  const layerWeights = new Float64Array(layers.length);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1),
        v = y / (size - 1),
        offset = (y * size + x) * 4;
      let total = 0;
      for (let i = 0; i < layers.length; i++) {
        layerWeights[i] = terrainChannel(weights, u, v, i);
        total += layerWeights[i]!;
      }
      if (total === 0) {
        layerWeights[0] = 1;
        total = 1;
      }
      let r = 0,
        g = 0,
        b = 0,
        nx = 0,
        ny = 0,
        nz = 0,
        roughness = 0,
        metallic = 0,
        ao = 0,
        er = 0,
        eg = 0,
        eb = 0;
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]!,
          weight = layerWeights[i]! / total;
        const lu = u * layer.scale[0]!,
          lv = v * layer.scale[1]!;
        r +=
          linear(terrainChannel(layer.base, lu, lv, 0, true)) *
          layer.color[0]! *
          weight;
        g +=
          linear(terrainChannel(layer.base, lu, lv, 1, true)) *
          layer.color[1]! *
          weight;
        b +=
          linear(terrainChannel(layer.base, lu, lv, 2, true)) *
          layer.color[2]! *
          weight;
        let tx = 0,
          ty = 0,
          tz = 1;
        if (layer.normal) {
          tx =
            (terrainChannel(layer.normal, lu, lv, 0, true) * 2 - 1) *
            layer.normalScale;
          ty =
            (terrainChannel(layer.normal, lu, lv, 1, true) * 2 - 1) *
            layer.normalScale;
          tz = terrainChannel(layer.normal, lu, lv, 2, true) * 2 - 1;
        }
        const length = Math.hypot(tx, ty, tz) || 1;
        nx += (tx / length) * weight;
        ny += (ty / length) * weight;
        nz += (tz / length) * weight;
        roughness +=
          layer.roughness *
          (layer.mr ? terrainChannel(layer.mr, lu, lv, 1, true) : 1) *
          weight;
        metallic +=
          layer.metallic *
          (layer.mr ? terrainChannel(layer.mr, lu, lv, 2, true) : 1) *
          weight;
        ao +=
          (layer.ao ? terrainChannel(layer.ao, lu, lv, 0, true) : 1) * weight;
        if (layer.emission) {
          er +=
            linear(terrainChannel(layer.emission, lu, lv, 0, true)) *
            layer.emissionFactor[0]! *
            weight;
          eg +=
            linear(terrainChannel(layer.emission, lu, lv, 1, true)) *
            layer.emissionFactor[1]! *
            weight;
          eb +=
            linear(terrainChannel(layer.emission, lu, lv, 2, true)) *
            layer.emissionFactor[2]! *
            weight;
        }
      }
      const length = Math.hypot(nx, ny, nz);
      if (length === 0) {
        nx = 0;
        ny = 0;
        nz = 1;
      }
      base[offset] = byte(srgb(r));
      base[offset + 1] = byte(srgb(g));
      base[offset + 2] = byte(srgb(b));
      base[offset + 3] = 255;
      normal[offset] = byte((nx / (length || 1)) * 0.5 + 0.5);
      normal[offset + 1] = byte((ny / (length || 1)) * 0.5 + 0.5);
      normal[offset + 2] = byte((nz / (length || 1)) * 0.5 + 0.5);
      normal[offset + 3] = 255;
      mr[offset] = byte(ao);
      mr[offset + 1] = byte(roughness);
      mr[offset + 2] = byte(metallic);
      mr[offset + 3] = 255;
      emission[offset] = byte(srgb(er));
      emission[offset + 1] = byte(srgb(eg));
      emission[offset + 2] = byte(srgb(eb));
      emission[offset + 3] = 255;
    }
  return {
    baseColor: { width: size, height: size, data: base },
    normal: { width: size, height: size, data: normal },
    metallicRoughness: { width: size, height: size, data: mr },
    emissive: { width: size, height: size, data: emission },
  };
}

/** Owns four baked maps, never input textures. Static layers can be rebaked by creating another preset. */
export class TerrainSplatMaterial {
  readonly material: NativePBRMaterial;
  readonly textures: readonly Texture[];
  private disposed = false;
  private constructor(textures: readonly Texture[]) {
    this.textures = textures;
    this.material = new NativePBRMaterial({
      texture: textures[0]!,
      normalTexture: textures[1]!,
      metallicRoughnessTexture: textures[2]!,
      emissiveTexture: textures[3]!,
      metallic: 1,
      roughness: 1,
      emissive: [1, 1, 1],
      deformationBounds: 0,
      shadowCache: 'tracked',
      label: 'Terrain splat (four-map budget)',
      wgsl: 'fn xyzPhysical(world:vec3f,normal:vec3f,uv:vec2f,surface:XYZPhysical)->XYZPhysical { var s=surface; s.occlusion=textureSample(metallicRoughnessMap,metallicRoughnessSampler,uv).r; return s; }',
      glsl: 'XYZPhysical xyzPhysical(vec3 world,vec3 normal,vec2 uv,XYZPhysical surface) {\n#if defined(XYZ_FRAGMENT) && !defined(XYZ_SHADOW)\nsurface.occlusion=texture(metallicRoughnessMap,uv).r;\n#endif\nreturn surface; }',
    });
  }
  static async create(
    options: TerrainSplatOptions,
  ): Promise<TerrainSplatMaterial> {
    const maps = bakeTerrainSplat(options);
    const textures: Texture[] = [];
    try {
      for (const map of [
        maps.baseColor,
        maps.normal,
        maps.metallicRoughness,
        maps.emissive,
      ]) {
        textures.push(
          await Texture.fromImage(
            new ImageData(map.data, map.width, map.height),
          ),
        );
      }
      return new TerrainSplatMaterial(textures);
    } catch (error) {
      for (const texture of textures) texture.destroy();
      throw error;
    }
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    try {
      this.material.destroy();
    } finally {
      for (const texture of this.textures) texture.destroy();
    }
  }
}
