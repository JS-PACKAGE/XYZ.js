import type { Scene } from './scene.js';
import { Mesh } from './mesh.js';
import { Frustum } from './frustum.js';
import type { Camera3D } from './orthographic-camera.js';
import { type BoundingSphere3D } from './render-bounds.js';
export interface VisibleInstances {
    /** Capacity-sized arrays; only the first count elements/matrices/colors are valid. */
    readonly indices: Uint32Array;
    readonly matrices: Float32Array;
    colors: Float32Array | undefined;
    count: number;
    /** Changes when packed payload or visible membership changes, not merely on a new frame. */
    version: number;
}
export interface RenderVisibilityEntry {
    readonly mesh: Mesh;
    readonly sphere: BoundingSphere3D;
    fade: number;
    instances: VisibleInstances | undefined;
}
/** A solid enclosing world AABB, inflated away from the candidate's own depth. */
export interface OcclusionCandidate {
    readonly mesh: Mesh;
    epoch: number;
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
}
export interface OcclusionProofSource {
    /** False only for a completed native zero-sample query with this exact epoch. */
    visible(mesh: Mesh, epoch: number): boolean;
}
export interface RenderVisibilityOptions {
    viewportHeight?: number;
    timeSeconds?: number;
    occlusion?: OcclusionProofSource;
    /** Invalidate proofs when native vertex deformation, depth state, or target size changes. */
    depthRevision?: number;
}
export declare class RenderVisibilitySet {
    readonly color: Mesh[];
    readonly shadows: Mesh[];
    readonly entries: Map<Mesh, RenderVisibilityEntry>;
    readonly occlusionCandidates: OcclusionCandidate[];
    meshChecks: number;
    poseChecks: number;
    boxTests: number;
    sphereTests: number;
    instanceTests: number;
    frustumCulled: number;
    occlusionCulled: number;
    epoch: number;
}
/**
 * Renderer-owned mesh index. Membership changes rebuild a balanced BVH; mutable poses are
 * checked and bounds refitted every gather. This does NOT promise zero pose work.
 */
export declare class RenderVisibilityCache {
    private scene;
    private revision;
    private epoch;
    private readonly records;
    private readonly leaves;
    private readonly lods;
    private gatherFrame;
    private root;
    private readonly cameraStamp;
    private readonly localSphere;
    private readonly worldSphere;
    private readonly stampValues;
    private readonly baseSphere;
    private frame;
    collect(scene: Scene, camera: Camera3D, frustum: Frustum, out: RenderVisibilitySet, options?: RenderVisibilityOptions): RenderVisibilitySet;
    clear(): void;
    private sync;
    private build;
    private refit;
    private gather;
    private packInstances;
}
