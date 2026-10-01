import { Texture } from '../../assets/src/index.js';
import { Group } from './group.js';
import { Mesh, TextureMaterial, type MeshOptions, type TextureMaterialOptions } from './mesh.js';
import type { Object3D } from './object3d.js';
import { OrthographicCamera } from './orthographic-camera.js';
import type { PerspectiveCamera } from './perspective-camera.js';
import type { Rect2D } from './gameplay/contracts.js';
type Camera3D = PerspectiveCamera | OrthographicCamera;
/**
 * Objects that need the camera before each draw. The Scene calls `updateForCamera` once per
 * frame, after all simulation and before rendering, for every registered object that has it.
 */
export interface CameraDependent3D {
    updateForCamera(camera: Camera3D): void;
}
export declare function isCameraDependent(object: unknown): object is Object3D & CameraDependent3D;
export interface LODLevel {
    /** Object shown from this distance on; it becomes a child of the LOD. */
    readonly object: Object3D;
    readonly distance: number;
}
/**
 * Shows exactly one child by camera distance. Levels are kept sorted by `distance`; the farthest
 * level whose distance has been reached is visible and the rest are hidden. `hysteresis` (world
 * units) keeps a level from flickering when the camera hovers at a boundary.
 */
export declare class LOD extends Group implements CameraDependent3D {
    private readonly entries;
    private current;
    /** World units a level must be passed by before switching away from the current one. */
    hysteresis: number;
    get levels(): readonly LODLevel[];
    /** Index into `levels` of the visible level, or -1 before the first update. */
    get level(): number;
    addLevel(object: Object3D, distance: number): this;
    updateForCamera(camera: Camera3D): void;
}
export type BillboardMode = 'spherical' | 'cylindrical';
export interface BillboardOptions extends Omit<MeshOptions, 'geometry' | 'material'> {
    material: TextureMaterial;
    /** World units; the quad is scaled by these (further scaled by `scale`). Default 1. */
    width?: number;
    height?: number;
    /** `spherical` faces the camera fully; `cylindrical` only turns around the Y axis. */
    mode?: BillboardMode;
}
/**
 * A textured quad that turns to face the camera each frame. Its own rotation is overwritten, so
 * parent rotation and scale are not compensated: keep billboards in the Scene root or under
 * translation-only groups.
 */
export declare class Billboard extends Mesh implements CameraDependent3D {
    mode: BillboardMode;
    constructor(options: BillboardOptions);
    updateForCamera(camera: Camera3D): void;
}
export interface Sprite3DOptions extends Omit<BillboardOptions, 'material'>, TextureMaterialOptions {
    /** Atlas region in physical pixels. World size does not change with later frames. */
    source?: Rect2D;
}
/** Camera-facing, unlit image in world space; borrows its Texture and owns its atlas quad. */
export declare class Sprite3D extends Mesh implements CameraDependent3D {
    mode: BillboardMode;
    private readonly fullSource;
    private region;
    constructor(options: Sprite3DOptions);
    get texture(): Texture;
    get source(): Readonly<Rect2D>;
    /** Changes UVs without allocating a cropped bitmap or resizing the sprite. */
    setSource(source?: Rect2D): this;
    private applySource;
    updateForCamera(camera: Camera3D): void;
}
export interface Line3DOptions extends Omit<MeshOptions, 'geometry' | 'material'> {
    material: TextureMaterial;
    /** World units across the ribbon. Default 0.05. */
    width?: number;
    /** Join the last point back to the first. */
    closed?: boolean;
}
/**
 * A polyline drawn as a camera-facing ribbon of triangles (renderers have no line primitive).
 * The number of points is fixed at construction; move them with {@link setPoint}. Segments are
 * independent quads, so very sharp corners show a small gap or overlap.
 */
export declare class Line3D extends Mesh implements CameraDependent3D {
    private readonly coordinates;
    private readonly segments;
    readonly closed: boolean;
    width: number;
    private readonly side;
    private readonly view;
    private readonly inverse;
    constructor(points: readonly (readonly [number, number, number])[], options: Line3DOptions);
    get pointCount(): number;
    point(index: number): [number, number, number];
    setPoint(index: number, x: number, y: number, z: number): void;
    updateForCamera(camera: Camera3D): void;
    private check;
    /** Lays each segment's quad flat to the viewer at `(cx, cy, cz)` (local space). */
    private rebuild;
}
export interface Text3DOptions extends Omit<BillboardOptions, 'material' | 'width' | 'height'> {
    /** CSS font size in pixels used to rasterize; default 64. */
    fontSize?: number;
    /** CSS font family; default `system-ui, sans-serif`. */
    fontFamily?: string;
    /** CSS color; default white. */
    color?: string;
    /** World height of one line; the width follows the text. Default 1. */
    height?: number;
    padding?: number;
}
/**
 * Text drawn into a canvas texture and shown on a camera-facing quad. The text is fixed when
 * created (create a new Text3D to change it); it owns its texture and releases it on destroy.
 */
export declare class Text3D extends Billboard {
    private readonly ownedTexture;
    private constructor();
    static create(text: string, options?: Text3DOptions): Promise<Text3D>;
    destroy(): void;
}
export {};
