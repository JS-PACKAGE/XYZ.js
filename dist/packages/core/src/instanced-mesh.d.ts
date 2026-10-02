import { Matrix4 } from '../../math/src/index.js';
import { Mesh, type MeshOptions } from './mesh.js';
import { type BoundingSphere3D } from './render-bounds.js';
export interface InstancedMeshOptions extends MeshOptions {
    count: number;
}
/** One geometry/material draw with mesh.worldMatrix * each local instance matrix. */
export declare class InstancedMesh extends Mesh {
    readonly count: number;
    /** Column-major matrices; use setMatrixAt to notify renderer upload caches. */
    readonly matrices: Float32Array;
    version: number;
    private instanceColors;
    /** Bumped by every color change so renderer upload caches refresh. */
    colorVersion: number;
    /**
     * Per-instance linear RGB (three floats each), or undefined while no color was ever set, in
     * which case every instance is white. Multiplied into the base color like vertex colors.
     */
    get colors(): Float32Array | undefined;
    private boundsVersion;
    private geometryBoundsVersion;
    private readonly aggregate;
    private readonly instanceSphere;
    private readonly instanceDeformationSphere;
    /** Bounds include every local instance, not just the mesh's base geometry. */
    get boundingSphere(): Readonly<BoundingSphere3D>;
    constructor(options: InstancedMeshOptions);
    setMatrixAt(index: number, matrix: Matrix4): void;
    /** Sets one instance's color; components are finite and nonnegative (above 1 brightens). */
    setColorAt(index: number, r: number, g: number, b: number): void;
    getColorAt(index: number, out: [number, number, number]): [number, number, number];
    getMatrixAt(index: number, out: Matrix4): Matrix4;
    private validateIndex;
}
