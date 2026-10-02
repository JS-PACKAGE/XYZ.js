import { Matrix4 } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import { Mesh } from './mesh.js';
import type { MeshOptions } from './mesh.js';
import { Object3D } from './object3d.js';
export interface SkinnedMeshOptions extends MeshOptions {
    joints: readonly Object3D[];
    inverseBindMatrices?: readonly Matrix4[];
    jointIndices: ArrayLike<number>;
    weights: ArrayLike<number>;
    /** Four preserves the 1.x stream contract; eight consumes both glTF influence sets. */
    influencesPerVertex?: 4 | 8;
}
/** Native bind-pose streams and an on-demand exact CPU picking mirror; joints remain borrowed. */
export declare class SkinnedMesh extends Mesh {
    readonly joints: readonly Object3D[];
    readonly inverseBindMatrices: readonly Matrix4[];
    readonly jointIndices: Uint32Array;
    readonly weights: Float32Array;
    readonly influencesPerVertex: 4 | 8;
    readonly jointPalette: Float32Array;
    paletteVersion: number;
    private readonly skinGeometry;
    private readonly bindVertices;
    private readonly matrices;
    private readonly influenceBounds;
    private readonly sphere;
    private readonly inverse;
    private readonly blend;
    private initialized;
    private deformationVersion;
    private mirrorVersion;
    protected get cullable(): boolean;
    get renderGeometry(): Geometry;
    get boundingSphere(): Readonly<{
        x: number;
        y: number;
        z: number;
        radius: number;
    }>;
    constructor(options: SkinnedMeshOptions);
    /** Morphs the bind pose first, then skins it. */
    updateDeformation(): void;
    /** Updates only the palette and conservative bounds; joint motion never deforms all vertices. */
    updateRenderDeformation(): void;
    updateSkin(): void;
    private refreshInfluenceBounds;
    private refreshAnimatedBounds;
}
