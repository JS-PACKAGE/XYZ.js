import { Texture } from '../../assets/src/index.js';
import { type MaterialTexture } from '../../assets/src/texture2d.js';
import { Quaternion } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import type { Frustum } from './frustum.js';
import { MorphTargets } from './morph.js';
import { Object3D } from './object3d.js';
import type { TextureSamplerOptions } from './texture-sampler.js';
import { type BoundingSphere3D } from './render-bounds.js';
export interface TextureMaterialOptions {
    texture: Texture;
    /** Optional canvas/video override; `texture` remains the caller's static fallback. */
    textureSource?: MaterialTexture;
    color?: [number, number, number];
    opacity?: number;
    /** Include texture/vertex alpha in the transparent pass even when opacity is one. */
    transparent?: boolean;
    textureSampler?: TextureSamplerOptions;
}
/** References a shared Texture; destroying a Mesh never destroys its material or texture. */
export declare class TextureMaterial {
    readonly texture: Texture;
    readonly textureSource?: MaterialTexture;
    readonly color: [number, number, number];
    readonly opacity: number;
    readonly transparent: boolean;
    readonly textureSampler?: Readonly<TextureSamplerOptions>;
    /** Maximum final mesh-local vertex displacement; undefined means unbounded native output. */
    readonly deformationBounds: number | undefined;
    constructor(options: TextureMaterialOptions);
}
/** Effective base-color texture: the canvas/video override when present, else `texture`. */
export declare function materialBaseTexture(material: TextureMaterial): MaterialTexture;
export interface MeshOptions {
    geometry: Geometry;
    material: TextureMaterial;
    position?: [number, number, number];
    rotation?: Quaternion | [number, number, number];
    scale?: [number, number, number];
    visible?: boolean;
    castShadow?: boolean;
    receiveShadow?: boolean;
    /** Takes ownership of `geometry`'s vertex data; the geometry must not be shared. */
    morph?: MorphTargets;
}
/** 3D scene facade; Geometry and TextureMaterial remain owned by their creators. */
export declare class Mesh extends Object3D {
    #private;
    readonly geometry: Geometry;
    get material(): TextureMaterial;
    set material(material: TextureMaterial);
    castShadow: boolean;
    receiveShadow: boolean;
    readonly morph?: MorphTargets;
    constructor(options: MeshOptions);
    /** Set false to always submit this mesh even when it lies outside the camera frustum. */
    frustumCulled: boolean;
    /** Opt-in native depth queries. Unsupported, pending, or stale proofs remain visible. */
    occlusionCulled: boolean;
    private readonly worldSphere;
    private readonly deformationSphere;
    /** Native rendering may use bind-pose streams while exact CPU queries use `geometry`. */
    get renderGeometry(): Geometry;
    get boundingSphere(): Readonly<{
        x: number;
        y: number;
        z: number;
        radius: number;
    }>;
    updateRenderDeformation(): void;
    /** CPU morph bounds follow the current weights; skinned meshes override their bounds. */
    protected get cullable(): boolean;
    /** Squared distance from a world-space point to this mesh's bounding-sphere center. */
    distanceSquaredTo(x: number, y: number, z: number): number;
    /**
     * Conservative sphere test against the camera frustum. Refreshes the world matrix
     * so callers may use it before drawing. Non-finite bounds are treated as visible.
     */
    isInFrustum(frustum: Frustum): boolean;
    /** Caller-owned output; mutable poses and pending deformation are refreshed by default. */
    getWorldBoundingSphere(out: BoundingSphere3D, refresh?: boolean): BoundingSphere3D;
    /**
     * Applies pending morph weights to the geometry. Renderers and raycasts call this
     * before reading vertices; unchanged weights cost one integer comparison.
     */
    updateDeformation(): void;
}
