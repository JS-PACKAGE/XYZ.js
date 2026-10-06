import { terrainLimits } from '../../../src/data/terrain.js';
import { Vector3 } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import { Group } from './group.js';
import { Mesh, type TextureMaterial } from './mesh.js';
import { HLOD, LOD } from './objects3d.js';
import { Raycaster, type RaycastHit } from './raycaster.js';
import { terrainImageData, type TerrainImageSource } from './terrain-data.js';
import type {
  WorldStreamingCell,
  WorldStreamingLoadContext,
} from './world-streaming.js';

export interface TerrainHeightArray {
  readonly width: number;
  readonly height: number;
  readonly heights: ArrayLike<number>;
}
export interface Terrain3DOptions {
  readonly heightmap: TerrainHeightArray | TerrainImageSource;
  readonly material: TextureMaterial;
  readonly width?: number;
  readonly depth?: number;
  readonly heightScale?: number;
  readonly heightOffset?: number;
  readonly heightChannel?: 0 | 1 | 2 | 3;
  /** Number of source-grid cells along a chunk edge. */
  readonly chunkSize?: number;
  /** Increasing world-distance boundaries; each level doubles the grid stride. */
  readonly lodDistances?: readonly number[];
  readonly skirtDepth?: number;
  readonly hysteresis?: number;
  readonly crossFadeDuration?: number;
  /** Optional aggregate proxy switch in logical pixels, using the native HLOD facade. */
  readonly hlodScreenSize?: number;
  readonly castShadow?: boolean;
  readonly receiveShadow?: boolean;
}
interface TerrainChunk {
  readonly x: number;
  readonly z: number;
  readonly endX: number;
  readonly endZ: number;
  readonly node: LOD | HLOD;
  readonly meshes: readonly Mesh[];
}
function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} must be positive and finite.`);
  return value;
}

/** XZ heightfield. Queries are terrain-local; ordinary Object3D transforms affect rendering/picking. */
export class Terrain3D extends Group {
  readonly width: number;
  readonly depth: number;
  readonly columns: number;
  readonly rows: number;
  /** Editable source heights in local world units; call markUpdated after edits. */
  readonly heights: Float32Array;
  readonly chunks: readonly (LOD | HLOD)[];
  private readonly records: TerrainChunk[] = [];
  private readonly picker = new Raycaster();
  private readonly hits: RaycastHit[] = [];
  private readonly normal = new Vector3();
  private readonly skirtDepth: number;

  constructor(private readonly options: Terrain3DOptions) {
    super();
    this.width = positive(
      options.width ?? terrainLimits.width,
      'Terrain width',
    );
    this.depth = positive(
      options.depth ?? terrainLimits.depth,
      'Terrain depth',
    );
    this.skirtDepth = positive(
      options.skirtDepth ?? terrainLimits.skirtDepth,
      'Terrain skirt depth',
    );
    const scale = options.heightScale ?? 1,
      offset = options.heightOffset ?? 0;
    const channel = options.heightChannel ?? 0;
    if (
      !Number.isFinite(scale) ||
      !Number.isFinite(offset) ||
      !Number.isInteger(channel) ||
      channel < 0 ||
      channel > 3
    )
      throw new RangeError('Invalid terrain height conversion.');
    const source = options.heightmap;
    const array = 'heights' in source ? source : undefined;
    const image = array
      ? undefined
      : terrainImageData(source as TerrainImageSource);
    this.columns = array?.width ?? image!.width;
    this.rows = array?.height ?? image!.height;
    if (
      !Number.isInteger(this.columns) ||
      !Number.isInteger(this.rows) ||
      this.columns < 2 ||
      this.rows < 2 ||
      this.columns * this.rows > terrainLimits.heightSamples ||
      (array && array.heights.length !== this.columns * this.rows)
    )
      throw new RangeError(
        'Terrain requires a bounded height grid with at least two samples per axis.',
      );
    this.heights = new Float32Array(this.columns * this.rows);
    for (let i = 0; i < this.heights.length; i++) {
      const h =
        (array ? array.heights[i]! : image!.data[i * 4 + channel]! / 255) *
          scale +
        offset;
      if (!Number.isFinite(h) || !Number.isFinite(Math.fround(h)))
        throw new RangeError('Terrain heights must fit finite Float32.');
      this.heights[i] = h;
    }
    const size = options.chunkSize ?? terrainLimits.chunkSize;
    const distances = options.lodDistances ?? terrainLimits.lodDistances;
    if (
      !Number.isInteger(size) ||
      size < 1 ||
      size > terrainLimits.maxChunkSize ||
      !distances.length ||
      distances.length > terrainLimits.maxLODLevels ||
      distances[0] !== 0 ||
      distances.some(
        (d, i) =>
          !Number.isFinite(d) || d < 0 || (i > 0 && d <= distances[i - 1]!),
      ) ||
      Math.ceil((this.columns - 1) / size) * Math.ceil((this.rows - 1) / size) >
        terrainLimits.chunks
    )
      throw new RangeError('Invalid terrain chunk size or LOD distances.');
    if (options.hlodScreenSize !== undefined)
      positive(options.hlodScreenSize, 'Terrain HLOD screen size');
    for (let z = 0; z < this.rows - 1; z += size)
      for (let x = 0; x < this.columns - 1; x += size) {
        const endX = Math.min(x + size, this.columns - 1),
          endZ = Math.min(z + size, this.rows - 1);
        const meshes: Mesh[] = [];
        const lod = new LOD({
          hysteresis: options.hysteresis,
          crossFadeDuration: options.crossFadeDuration,
        });
        for (let level = 0; level < distances.length; level++) {
          const mesh = new Mesh({
            geometry: this.buildGeometry(x, z, endX, endZ, 2 ** level),
            material: options.material,
            castShadow: options.castShadow,
            receiveShadow: options.receiveShadow,
          });
          meshes.push(mesh);
          lod.addLevel(mesh, distances[level]!);
        }
        const node =
          options.hlodScreenSize === undefined
            ? lod
            : new HLOD({
                children: [lod],
                proxy: new Mesh({
                  geometry: meshes[meshes.length - 1]!.geometry,
                  material: options.material,
                  castShadow: options.castShadow,
                  receiveShadow: options.receiveShadow,
                }),
                screenSize: options.hlodScreenSize,
                hysteresis: options.hysteresis,
                crossFadeDuration: options.crossFadeDuration,
              });
        node.position.set(
          ((x + endX) / 2 / (this.columns - 1) - 0.5) * this.width,
          0,
          ((z + endZ) / 2 / (this.rows - 1) - 0.5) * this.depth,
        );
        this.add(node);
        this.records.push({ x, z, endX, endZ, node, meshes });
      }
    this.chunks = this.records.map((record) => record.node);
  }

  /** Exact full-resolution triangle height, undefined outside the terrain rectangle. */
  heightAt(x: number, z: number): number | undefined {
    if (!Number.isFinite(x) || !Number.isFinite(z))
      throw new RangeError('Terrain coordinates must be finite.');
    const gx = (x / this.width + 0.5) * (this.columns - 1),
      gz = (z / this.depth + 0.5) * (this.rows - 1);
    if (gx < 0 || gz < 0 || gx > this.columns - 1 || gz > this.rows - 1)
      return undefined;
    const ix = Math.min(Math.floor(gx), this.columns - 2),
      iz = Math.min(Math.floor(gz), this.rows - 2);
    const u = gx - ix,
      v = gz - iz;
    const a = this.heights[iz * this.columns + ix]!,
      b = this.heights[iz * this.columns + ix + 1]!,
      c = this.heights[(iz + 1) * this.columns + ix]!,
      d = this.heights[(iz + 1) * this.columns + ix + 1]!;
    return u + v <= 1
      ? a + (b - a) * u + (c - a) * v
      : d + (c - d) * (1 - u) + (b - d) * (1 - v);
  }

  /** Smooth finite-difference normal used by all LOD meshes, in terrain-local space. */
  normalAt(x: number, z: number, out = new Vector3()): Vector3 | undefined {
    if (this.heightAt(x, z) === undefined) return undefined;
    const dx = this.width / (this.columns - 1),
      dz = this.depth / (this.rows - 1);
    const left = Math.max(-this.width / 2, x - dx),
      right = Math.min(this.width / 2, x + dx);
    const back = Math.max(-this.depth / 2, z - dz),
      front = Math.min(this.depth / 2, z + dz);
    return out
      .set(
        -(this.heightAt(right, z)! - this.heightAt(left, z)!) / (right - left),
        1,
        -(this.heightAt(x, front)! - this.heightAt(x, back)!) / (front - back),
      )
      .normalize();
  }

  /** Picks visible native LOD/HLOD triangles (including skirts), in world units. */
  raycast(
    origin: Readonly<Vector3>,
    direction: Readonly<Vector3>,
    far = Infinity,
  ): RaycastHit | undefined {
    this.picker.origin.set(origin.x, origin.y, origin.z);
    this.picker.direction.set(direction.x, direction.y, direction.z);
    this.picker.far = far;
    return this.picker.intersectObjects([this], true, this.hits)[0];
  }

  markUpdated(): void {
    if (this.destroyed) throw new Error('Terrain is destroyed.');
    for (const h of this.heights)
      if (!Number.isFinite(h))
        throw new RangeError('Terrain heights must be finite.');
    for (const record of this.records)
      for (const mesh of record.meshes) {
        const vertices = mesh.geometry.vertices;
        for (let i = 0; i < vertices.length; i += 8) {
          const x = (vertices[i + 6]! - 0.5) * this.width,
            z = (vertices[i + 7]! - 0.5) * this.depth;
          const skirt = this.skirtVertices.get(mesh.geometry)!.has(i / 8);
          vertices[i + 1] =
            this.heightAt(x, z)! - (skirt ? this.skirtDepth : 0);
          this.normalAt(x, z, this.normal);
          vertices[i + 3] = this.normal.x;
          vertices[i + 4] = this.normal.y;
          vertices[i + 5] = this.normal.z;
          const tangent = i / 2;
          const length = Math.hypot(this.normal.y, this.normal.x);
          mesh.geometry.tangents[tangent] = this.normal.y / length;
          mesh.geometry.tangents[tangent + 1] = -this.normal.x / length;
          mesh.geometry.tangents[tangent + 2] = 0;
          mesh.geometry.tangents[tangent + 3] = -1;
        }
        mesh.geometry.markUpdated();
      }
  }
  private readonly skirtVertices = new Map<Geometry, Set<number>>();

  private buildGeometry(
    x: number,
    z: number,
    endX: number,
    endZ: number,
    stride: number,
  ): Geometry {
    const xs: number[] = [],
      zs: number[] = [];
    for (let i = x; i < endX; i += stride) xs.push(i);
    xs.push(endX);
    for (let i = z; i < endZ; i += stride) zs.push(i);
    zs.push(endZ);
    const positions: number[] = [],
      normals: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    const skirts = new Set<number>();
    const centerX = ((x + endX) / 2 / (this.columns - 1) - 0.5) * this.width;
    const centerZ = ((z + endZ) / 2 / (this.rows - 1) - 0.5) * this.depth;
    for (const iz of zs)
      for (const ix of xs) {
        const wx = (ix / (this.columns - 1) - 0.5) * this.width,
          wz = (iz / (this.rows - 1) - 0.5) * this.depth;
        positions.push(
          wx - centerX,
          this.heights[iz * this.columns + ix]!,
          wz - centerZ,
        );
        this.normalAt(wx, wz, this.normal);
        normals.push(this.normal.x, this.normal.y, this.normal.z);
        uvs.push(ix / (this.columns - 1), iz / (this.rows - 1));
      }
    const columns = xs.length;
    for (let row = 0; row < zs.length - 1; row++)
      for (let col = 0; col < columns - 1; col++) {
        const a = row * columns + col,
          b = a + 1,
          c = a + columns,
          d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    const edge: number[] = [];
    for (let col = 0; col < columns; col++) edge.push(col);
    for (let row = 1; row < zs.length; row++)
      edge.push(row * columns + columns - 1);
    for (let col = columns - 2; col >= 0; col--)
      edge.push((zs.length - 1) * columns + col);
    for (let row = zs.length - 2; row > 0; row--) edge.push(row * columns);
    const start = positions.length / 3;
    for (const vertex of edge) {
      skirts.add(positions.length / 3);
      positions.push(
        positions[vertex * 3]!,
        positions[vertex * 3 + 1]! - this.skirtDepth,
        positions[vertex * 3 + 2]!,
      );
      normals.push(
        normals[vertex * 3]!,
        normals[vertex * 3 + 1]!,
        normals[vertex * 3 + 2]!,
      );
      uvs.push(uvs[vertex * 2]!, uvs[vertex * 2 + 1]!);
    }
    for (let i = 0; i < edge.length; i++) {
      const next = (i + 1) % edge.length;
      indices.push(
        edge[i]!,
        start + i,
        edge[next]!,
        edge[next]!,
        start + i,
        start + next,
      );
    }
    const geometry = new Geometry({ positions, normals, uvs, indices });
    this.skirtVertices.set(geometry, skirts);
    return geometry;
  }

  /** Fresh detached chunk roots borrowing this terrain's geometry/material, for WorldStreamingController.
   * Catalog requires an unparented translation-only source; destroy consumers before its material.
   */
  createStreamingCells(prefix = 'terrain'): readonly WorldStreamingCell[] {
    if (
      this.destroyed ||
      this.parent ||
      this.rotation.x !== 0 ||
      this.rotation.y !== 0 ||
      this.rotation.z !== 0 ||
      Math.abs(this.rotation.w) !== 1 ||
      this.scale.x !== 1 ||
      this.scale.y !== 1 ||
      this.scale.z !== 1
    )
      throw new Error(
        'Terrain streaming catalogs require a live unparented translation-only source.',
      );
    const translation = new Vector3().copy(this.position);
    return this.records.map((record, index) => {
      let minY = Infinity,
        maxY = -Infinity;
      for (let z = record.z; z <= record.endZ; z++)
        for (let x = record.x; x <= record.endX; x++) {
          const h = this.heights[z * this.columns + x]!;
          minY = Math.min(minY, h);
          maxY = Math.max(maxY, h);
        }
      return {
        id: `${prefix}:${index}`,
        bounds: {
          min: {
            x:
              (record.x / (this.columns - 1) - 0.5) * this.width +
              translation.x,
            y: minY - this.skirtDepth + translation.y,
            z: (record.z / (this.rows - 1) - 0.5) * this.depth + translation.z,
          },
          max: {
            x:
              (record.endX / (this.columns - 1) - 0.5) * this.width +
              translation.x,
            y: maxY + translation.y,
            z:
              (record.endZ / (this.rows - 1) - 0.5) * this.depth +
              translation.z,
          },
        },
        load: (context: WorldStreamingLoadContext) => {
          if (context.signal.aborted || this.destroyed)
            throw new Error('Terrain streaming source is unavailable.');
          const root = context.own(new Group());
          root.position.copy(translation);
          const lod = new LOD({
            hysteresis: this.options.hysteresis,
            crossFadeDuration: this.options.crossFadeDuration,
          });
          record.meshes.forEach((mesh, level) =>
            lod.addLevel(
              new Mesh({
                geometry: mesh.geometry,
                material: mesh.material,
                castShadow: mesh.castShadow,
                receiveShadow: mesh.receiveShadow,
              }),
              (this.options.lodDistances ?? terrainLimits.lodDistances)[level]!,
            ),
          );
          const chunk =
            this.options.hlodScreenSize === undefined
              ? lod
              : new HLOD({
                  children: [lod],
                  proxy: new Mesh({
                    geometry: record.meshes[record.meshes.length - 1]!.geometry,
                    material: this.options.material,
                  }),
                  screenSize: this.options.hlodScreenSize,
                });
          chunk.position.copy(record.node.position);
          root.add(chunk);
          return { root };
        },
      };
    });
  }
}

export type { TerrainImageData, TerrainImageSource } from './terrain-data.js';
