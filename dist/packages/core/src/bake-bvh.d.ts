import type { Mesh } from './mesh.js';
export interface BakeTriangle {
    mesh: Mesh;
    indices: [number, number, number];
    p: Float64Array;
    n: Float64Array;
}
/** Internal immutable world-space snapshot. Median splits bound depth and storage. */
export declare class BakeBVH {
    private readonly maxRays;
    /** Distance of the nearest hit from the last `hit` call. */
    private distance;
    readonly triangles: BakeTriangle[];
    /** Construction scratch; `flatten` copies it into the typed arrays `hit` walks. */
    private readonly nodes;
    /** Per node: min xyz, then max xyz. */
    private bounds;
    /** Per node: first triangle, end triangle, left child, right child (-1 for a leaf). */
    private links;
    /** Per triangle in leaf order: its nine world-space corner coordinates. */
    private corners;
    private stack;
    rays: number;
    constructor(meshes: readonly Mesh[], maxTriangles: number, maxRays: number);
    private build;
    /** Walks flat arrays instead of node and triangle objects; the arithmetic is unchanged. */
    private flatten;
    hit(o: ArrayLike<number>, d: ArrayLike<number>, far: number, ignore?: BakeTriangle): {
        triangle: BakeTriangle;
        distance: number;
    } | undefined;
    /** Whether `hit` would find any triangle; it stops at the first one rather than the nearest. */
    occluded(o: ArrayLike<number>, d: ArrayLike<number>, far: number, ignore?: BakeTriangle): boolean;
    /** Triangle index of the nearest hit (the first with `anyHit`), or -1; distance in `distance`. */
    private trace;
}
