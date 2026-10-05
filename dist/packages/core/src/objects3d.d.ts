import { Texture } from '../../assets/src/index.js';
import { Group } from './group.js';
import { Mesh, TextureMaterial, type MeshOptions, type TextureMaterialOptions } from './mesh.js';
import type { Object3D } from './object3d.js';
import { OrthographicCamera } from './orthographic-camera.js';
import type { PerspectiveCamera } from './perspective-camera.js';
import type { Rect2D } from './gameplay/contracts.js';
import { type BoundingSphere3D } from './render-bounds.js';
import { type Text2DOptions, type Text2DStyle, type Text2DLayout } from './text2d.js';
type Camera3D = PerspectiveCamera | OrthographicCamera;
/**
 * Objects that need the camera before each draw. The Scene calls `updateForCamera` once per
 * frame, after all simulation and before rendering, for every registered object that has it.
 */
export interface CameraDependent3D {
    updateForCamera(camera: Camera3D, viewportHeight?: number, timeSeconds?: number): void;
}
export declare function isCameraDependent(object: unknown): object is Object3D & CameraDependent3D;
export interface LODLevel {
    /** Object becomes an owned child; its geometry/material/texture remain borrowed. */
    readonly object: Object3D;
    readonly distance: number;
    /** Minimum projected diameter in logical viewport pixels, independent of DPR. */
    readonly screenSize?: number;
}
export interface LODOptions {
    hysteresis?: number;
    crossFadeDuration?: number;
    /** Local sphere radius used by screen-size LOD. */
    screenRadius?: number;
}
/** Distance or projected-size selection with native-rendered coverage transitions. */
export declare class LOD extends Group implements CameraDependent3D {
    private readonly entries;
    private current;
    private screenMode;
    private weights;
    private fromWeights;
    private fadeStarted;
    private fading;
    private readonly screenSphere;
    /** World units for distance levels, logical viewport pixels for screen-size levels. */
    hysteresis: number;
    crossFadeDuration: number;
    screenRadius: number;
    constructor(options?: LODOptions);
    get levels(): readonly LODLevel[];
    get level(): number;
    addLevel(object: Object3D, distance: number): this;
    addScreenLevel(object: Object3D, minimumPixels: number): this;
    removeLevel(object: Object3D, destroy?: boolean): boolean;
    private insertLevel;
    private resetSelection;
    /** Native Scene supplies logical viewport/time; one-argument legacy distance LOD still works. */
    updateForCamera(camera: Camera3D, viewportHeight?: number, timeSeconds?: number): void;
    updateForRender(camera: Camera3D, viewportHeight: number, timeSeconds: number): void;
    /** Native color/shadow/picking consumers can inspect the same active branch weight. */
    renderWeight(object: Object3D): number;
    protected projectedDiameter(camera: Camera3D, viewportHeight: number): number;
    private validateSettings;
    private select;
    private advanceFade;
}
/** Conservative projected diameter; near-plane intersections retain highest detail. */
export declare function projectedSphereDiameter(sphere: Readonly<BoundingSphere3D>, camera: Camera3D, viewportHeight: number): number;
export interface HLODOptions extends LODOptions {
    proxy: Object3D;
    children: readonly Object3D[];
    /** Switch to the child aggregate above this logical-pixel diameter. */
    screenSize: number;
}
/** Owns detail/proxy nodes; replacing them retires nodes, never borrowed render resources. */
export declare class HLOD extends LOD {
    readonly detail: Group;
    private proxyObject;
    private readonly aggregateSphere;
    private readonly childSphere;
    private readonly pending;
    readonly screenSize: number;
    constructor(options: HLODOptions);
    get proxy(): Object3D;
    replaceProxy(proxy: Object3D): void;
    replaceChildren(children: readonly Object3D[]): void;
    protected projectedDiameter(camera: Camera3D, viewportHeight: number): number;
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
export interface Text3DOptions extends Omit<BillboardOptions, 'material' | 'width' | 'height'>, Text2DOptions {
    /** World height of one padded, browser-measured line. Default 1. */
    height?: number;
}
export type Text3DStyle = Text2DStyle & Readonly<{
    height: number;
}>;
/**
 * Browser-shaped multiline text on a camera-facing quad. Updates publish atomically;
 * each label owns its raster texture, while externally assigned materials stay borrowed.
 */
export declare class Text3D extends Billboard {
    private content;
    private ownedTexture;
    private displayedLayout;
    /** Replacing this material borrows it; only generated raster textures are owned. */
    material: TextureMaterial;
    private revision;
    private requestedText;
    private requestedStyle;
    private displayedStyle;
    private width;
    private height;
    private constructor();
    static create(text: string, options?: Text3DOptions): Promise<Text3D>;
    get text(): string;
    get style(): Text3DStyle;
    /** Logical-pixel layout including browser glyph overhang and descenders. */
    get layout(): Text2DLayout;
    setText(text: string): Promise<void>;
    /** Merges with the latest requested state, including updates still rasterizing. */
    setStyle(options: Text2DOptions & {
        height?: number;
    }): Promise<void>;
    refreshFonts(): Promise<void>;
    private refresh;
    destroy(): void;
}
export {};
