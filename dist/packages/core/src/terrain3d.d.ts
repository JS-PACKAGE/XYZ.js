import { Vector3 } from '../../math/src/index.js';
import { Group } from './group.js';
import { type TextureMaterial } from './mesh.js';
import { HLOD, LOD } from './objects3d.js';
import { type RaycastHit } from './raycaster.js';
import { type TerrainImageSource } from './terrain-data.js';
import type { WorldStreamingCell } from './world-streaming.js';
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
/** XZ heightfield. Queries are terrain-local; ordinary Object3D transforms affect rendering/picking. */
export declare class Terrain3D extends Group {
    private readonly options;
    readonly width: number;
    readonly depth: number;
    readonly columns: number;
    readonly rows: number;
    /** Editable source heights in local world units; call markUpdated after edits. */
    readonly heights: Float32Array;
    readonly chunks: readonly (LOD | HLOD)[];
    private readonly records;
    private readonly picker;
    private readonly hits;
    private readonly normal;
    private readonly skirtDepth;
    constructor(options: Terrain3DOptions);
    /** Exact full-resolution triangle height, undefined outside the terrain rectangle. */
    heightAt(x: number, z: number): number | undefined;
    /** Smooth finite-difference normal used by all LOD meshes, in terrain-local space. */
    normalAt(x: number, z: number, out?: Vector3): Vector3 | undefined;
    /** Picks visible native LOD/HLOD triangles (including skirts), in world units. */
    raycast(origin: Readonly<Vector3>, direction: Readonly<Vector3>, far?: number): RaycastHit | undefined;
    markUpdated(): void;
    private readonly skirtVertices;
    private buildGeometry;
    /** Fresh detached chunk roots borrowing this terrain's geometry/material, for WorldStreamingController.
     * Catalog requires an unparented translation-only source; destroy consumers before its material.
     */
    createStreamingCells(prefix?: string): readonly WorldStreamingCell[];
}
export type { TerrainImageData, TerrainImageSource } from './terrain-data.js';
