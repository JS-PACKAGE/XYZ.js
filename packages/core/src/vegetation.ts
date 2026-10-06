import {
  vegetationDefaults,
  vegetationLimits,
} from '../../../src/data/vegetation.js';
import { Matrix4 } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import { InstancedMesh } from './instanced-mesh.js';
import { TextureMaterial } from './mesh.js';
import { Group } from './group.js';
import type { Object3D } from './object3d.js';
import { LOD } from './objects3d.js';
import type { Camera3D } from './orthographic-camera.js';

export interface VegetationSurfaceSample {
  height: number;
  /** Upward-facing normal; need not be normalized. */
  normal: readonly [number, number, number];
}
export interface VegetationDensityMap {
  width: number;
  height: number;
  /** Row-major density in [0,1], mapped across the scatter rectangle. */
  data: ArrayLike<number>;
}
export interface VegetationLODLevel {
  distance: number;
  geometry: Geometry;
  material?: TextureMaterial;
}
export interface VegetationScatterOptions {
  geometry: Geometry;
  material: TextureMaterial;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Number of deterministic candidate positions, before density/filter rejection. */
  count: number;
  seed?: number;
  density?: number;
  densityMap?: VegetationDensityMap;
  sampleSurface?: (x: number, z: number) => VegetationSurfaceSample;
  minHeight?: number;
  maxHeight?: number;
  /** Maximum slope in radians, in [0, pi/2]. */
  maxSlope?: number;
  scale?: readonly [number, number];
  /** Spatial tiles keep culling/LOD local instead of fading an entire field at once. */
  tileSize?: number;
  batchSize?: number;
  lod?: readonly VegetationLODLevel[];
  fadeStart?: number;
  fadeEnd?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Existing visibility sees this as an LOD, including native color/shadow coverage fade. */
export class VegetationBatch extends LOD {
  readonly meshes: readonly InstancedMesh[];
  private fade = 1;

  constructor(
    meshes: readonly InstancedMesh[],
    distances: readonly number[],
    readonly fadeStart: number,
    readonly fadeEnd: number,
  ) {
    super();
    if (
      meshes.length === 0 ||
      meshes.length !== distances.length ||
      !Number.isFinite(fadeStart) ||
      fadeStart < 0 ||
      !(fadeEnd > fadeStart) ||
      distances.some(
        (distance, index) =>
          !Number.isFinite(distance) ||
          distance < 0 ||
          (index > 0 && distance <= distances[index - 1]!),
      )
    )
      throw new RangeError(
        'Vegetation batch requires meshes, increasing distances and a valid fade interval.',
      );
    this.meshes = meshes;
    for (let i = 0; i < meshes.length; i++)
      this.addLevel(meshes[i]!, distances[i]!);
  }

  override updateForRender(
    camera: Camera3D,
    viewportHeight: number,
    timeSeconds: number,
  ): void {
    super.updateForRender(camera, viewportHeight, timeSeconds);
    this.updateFade(camera);
  }

  override updateForCamera(
    camera: Camera3D,
    viewportHeight?: number,
    timeSeconds?: number,
  ): void {
    super.updateForCamera(camera, viewportHeight, timeSeconds);
    this.updateFade(camera);
  }

  override renderWeight(object: Object3D): number {
    return super.renderWeight(object) * this.fade;
  }

  private updateFade(camera: Camera3D): void {
    const e = this.updateWorldMatrix().elements;
    const distance = Math.hypot(
      e[12]! - camera.position.x,
      e[13]! - camera.position.y,
      e[14]! - camera.position.z,
    );
    this.fade =
      this.fadeEnd === Infinity
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (this.fadeEnd - distance) / (this.fadeEnd - this.fadeStart),
            ),
          );
    for (const mesh of this.meshes)
      mesh.visible = super.renderWeight(mesh) > 0 && this.fade > 0;
  }
}

export interface VegetationScatterResult {
  /** Add this root to a Scene; it owns LOD nodes, but not geometry/material/maps. */
  root: Group;
  batches: readonly VegetationBatch[];
  /** All actual native instanced draws, including alternate LOD meshes. */
  meshes: readonly InstancedMesh[];
  acceptedCount: number;
}

/** Deterministic scatter for grass or caller-provided foliage geometry. */
export function scatterVegetation(
  options: VegetationScatterOptions,
): VegetationScatterResult {
  const { bounds } = options;
  const seed = options.seed ?? vegetationDefaults.seed;
  const density = options.density ?? 1;
  const slope = options.maxSlope ?? Math.PI / 2;
  const minHeight = options.minHeight ?? -Infinity;
  const maxHeight = options.maxHeight ?? Infinity;
  const scales = options.scale ?? [1, 1];
  const tileSize = options.tileSize ?? vegetationDefaults.tileSize;
  const batchSize = options.batchSize ?? vegetationDefaults.batchSize;
  const fadeStart = options.fadeStart ?? vegetationDefaults.fadeStart;
  const fadeEnd = options.fadeEnd ?? vegetationDefaults.fadeEnd;
  if (
    !(options.geometry instanceof Geometry) ||
    !(options.material instanceof TextureMaterial)
  )
    throw new TypeError('Vegetation requires Geometry and TextureMaterial.');
  if (
    !Number.isSafeInteger(options.count) ||
    options.count < 0 ||
    options.count > vegetationLimits.candidates ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff
  )
    throw new RangeError(
      'Vegetation count must be in [0,1000000] and seed must be uint32.',
    );
  if (
    ![
      bounds.minX,
      bounds.maxX,
      bounds.minZ,
      bounds.maxZ,
      density,
      slope,
      tileSize,
      scales[0],
      scales[1],
      fadeStart,
    ].every(Number.isFinite) ||
    bounds.minX >= bounds.maxX ||
    bounds.minZ >= bounds.maxZ ||
    density < 0 ||
    density > 1 ||
    slope < 0 ||
    slope > Math.PI / 2 ||
    tileSize <= 0 ||
    scales.length !== 2 ||
    scales[0] <= 0 ||
    scales[1] < scales[0] ||
    !Number.isSafeInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 1000000 ||
    Number.isNaN(minHeight) ||
    Number.isNaN(maxHeight) ||
    minHeight > maxHeight ||
    fadeStart < 0 ||
    !(fadeEnd > fadeStart)
  )
    throw new RangeError(
      'Invalid vegetation scatter bounds, filters, scale, batching or fade.',
    );
  const map = options.densityMap;
  if (map) {
    if (
      !Number.isSafeInteger(map.width) ||
      !Number.isSafeInteger(map.height) ||
      map.width < 1 ||
      map.height < 1 ||
      map.data.length !== map.width * map.height
    )
      throw new RangeError('Density map dimensions must match its data.');
    for (let i = 0; i < map.data.length; i++)
      if (!Number.isFinite(map.data[i]) || map.data[i]! < 0 || map.data[i]! > 1)
        throw new RangeError('Density map samples must be in [0,1].');
  }
  const levels = [
    { distance: 0, geometry: options.geometry, material: options.material },
    ...(options.lod ?? []),
  ];
  for (let i = 1; i < levels.length; i++) {
    const level = levels[i]!;
    if (
      !Number.isFinite(level.distance) ||
      level.distance <= levels[i - 1]!.distance ||
      !(level.geometry instanceof Geometry) ||
      (level.material !== undefined &&
        !(level.material instanceof TextureMaterial))
    )
      throw new RangeError(
        'Vegetation LOD levels require increasing positive distances and render resources.',
      );
  }
  let state = seed;
  const random = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const tiles = new Map<
    string,
    { x: number; z: number; placements: number[] }
  >();
  let acceptedCount = 0;
  for (let candidate = 0; candidate < options.count; candidate++) {
    const u = random(),
      v = random(),
      rejection = random(),
      yaw = random() * Math.PI * 2;
    const scale = scales[0] + random() * (scales[1] - scales[0]);
    let probability = density;
    if (map) {
      const px = u * (map.width - 1),
        pz = v * (map.height - 1);
      const x0 = Math.floor(px),
        z0 = Math.floor(pz),
        x1 = Math.min(x0 + 1, map.width - 1),
        z1 = Math.min(z0 + 1, map.height - 1);
      const a = map.data[z0 * map.width + x0]!,
        b = map.data[z0 * map.width + x1]!;
      const c = map.data[z1 * map.width + x0]!,
        d = map.data[z1 * map.width + x1]!;
      probability *=
        (a + (b - a) * (px - x0)) * (1 - (pz - z0)) +
        (c + (d - c) * (px - x0)) * (pz - z0);
    }
    if (rejection >= probability) continue;
    const x = bounds.minX + u * (bounds.maxX - bounds.minX),
      z = bounds.minZ + v * (bounds.maxZ - bounds.minZ);
    const sample = options.sampleSurface?.(x, z) ?? {
      height: 0,
      normal: [0, 1, 0] as const,
    };
    const n = sample.normal,
      length = Math.hypot(...n);
    if (
      !Number.isFinite(sample.height) ||
      n.length !== 3 ||
      !n.every(Number.isFinite) ||
      !Number.isFinite(length) ||
      length === 0
    )
      throw new RangeError(
        'Surface samples require finite height and a nonzero finite normal.',
      );
    if (
      sample.height < minHeight ||
      sample.height > maxHeight ||
      n[1] / length < Math.cos(slope)
    )
      continue;
    const tx = Math.floor((x - bounds.minX) / tileSize),
      tz = Math.floor((z - bounds.minZ) / tileSize),
      key = `${tx},${tz}`;
    let tile = tiles.get(key);
    if (!tile) {
      tile = {
        x: bounds.minX + (tx + 0.5) * tileSize,
        z: bounds.minZ + (tz + 0.5) * tileSize,
        placements: [],
      };
      tiles.set(key, tile);
    }
    tile.placements.push(x - tile.x, sample.height, z - tile.z, yaw, scale);
    acceptedCount++;
  }
  const root = new Group(),
    batches: VegetationBatch[] = [],
    meshes: InstancedMesh[] = [];
  const matrix = new Matrix4();
  for (const tile of tiles.values()) {
    const total = tile.placements.length / 5;
    for (let start = 0; start < total; start += batchSize) {
      const count = Math.min(batchSize, total - start);
      const draws: InstancedMesh[] = [];
      for (const level of levels) {
        const mesh = new InstancedMesh({
          geometry: level.geometry,
          material: level.material ?? options.material,
          count,
          castShadow: options.castShadow,
          receiveShadow: options.receiveShadow,
        });
        for (let i = 0; i < count; i++) {
          const offset = (start + i) * 5,
            p = tile.placements;
          const yaw = p[offset + 3]!,
            scale = p[offset + 4]!,
            c = Math.cos(yaw) * scale,
            s = Math.sin(yaw) * scale;
          const e = matrix.elements;
          e[0] = c;
          e[1] = 0;
          e[2] = -s;
          e[3] = 0;
          e[4] = 0;
          e[5] = scale;
          e[6] = 0;
          e[7] = 0;
          e[8] = s;
          e[9] = 0;
          e[10] = c;
          e[11] = 0;
          e[12] = p[offset]!;
          e[13] = p[offset + 1]!;
          e[14] = p[offset + 2]!;
          e[15] = 1;
          mesh.setMatrixAt(i, matrix);
        }
        draws.push(mesh);
        meshes.push(mesh);
      }
      const batch = new VegetationBatch(
        draws,
        levels.map((level) => level.distance),
        fadeStart,
        fadeEnd,
      );
      batch.transform.position.set(tile.x, 0, tile.z);
      batches.push(batch);
      root.add(batch);
    }
  }
  return { root, batches, meshes, acceptedCount };
}

/** Upright tapered grass blade with enough vertical segments to visibly bend. */
export function createGrassGeometry(
  width = 0.1,
  height = 1,
  segments = 4,
): Geometry {
  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(height) ||
    height <= 0 ||
    !Number.isSafeInteger(segments) ||
    segments < 1 ||
    segments > vegetationLimits.grassSegments
  )
    throw new RangeError(
      'Grass requires positive width/height and 1–1024 segments.',
    );
  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let row = 0; row <= segments; row++) {
    const t = row / segments,
      halfWidth = (width * (1 - t * 0.95)) / 2;
    positions.push(-halfWidth, t * height, 0, halfWidth, t * height, 0);
    normals.push(0, 0, 1, 0, 0, 1);
    uvs.push(0, t, 1, t);
    if (row < segments) {
      const a = row * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  return new Geometry({ positions, normals, uvs, indices });
}
