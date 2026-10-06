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
    bounds: {
        minX: number;
        maxX: number;
        minZ: number;
        maxZ: number;
    };
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
export declare class VegetationBatch extends LOD {
    readonly fadeStart: number;
    readonly fadeEnd: number;
    readonly meshes: readonly InstancedMesh[];
    private fade;
    constructor(meshes: readonly InstancedMesh[], distances: readonly number[], fadeStart: number, fadeEnd: number);
    updateForRender(camera: Camera3D, viewportHeight: number, timeSeconds: number): void;
    updateForCamera(camera: Camera3D, viewportHeight?: number, timeSeconds?: number): void;
    renderWeight(object: Object3D): number;
    private updateFade;
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
export declare function scatterVegetation(options: VegetationScatterOptions): VegetationScatterResult;
/** Upright tapered grass blade with enough vertical segments to visibly bend. */
export declare function createGrassGeometry(width?: number, height?: number, segments?: number): Geometry;
