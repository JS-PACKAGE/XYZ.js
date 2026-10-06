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
    readonly triangles: BakeTriangle[];
    private readonly nodes;
    private readonly stack;
    rays: number;
    constructor(meshes: readonly Mesh[], maxTriangles: number, maxRays: number);
    private build;
    hit(o: ArrayLike<number>, d: ArrayLike<number>, far: number, ignore?: BakeTriangle): {
        triangle: BakeTriangle;
        distance: number;
    } | undefined;
}
