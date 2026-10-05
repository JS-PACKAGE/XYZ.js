export interface GeometryData {
    positions: ArrayLike<number>;
    normals: ArrayLike<number>;
    uvs: ArrayLike<number>;
    /** Optional TEXCOORD_1; UV0 remains in the legacy interleaved vertex stream. */
    uvs1?: ArrayLike<number>;
    /**
     * Optional glTF-style tangent xyz and handedness per vertex. Omitted data is
     * generated from indexed triangles and the selected UV stream; degeneracy uses an
     * orthonormal basis around their normal.
     */
    tangents?: ArrayLike<number>;
    /** UV stream of the tangent basis; defaults to UV0. UV1 requires uvs1. */
    tangentTexCoord?: 0 | 1;
    /** Normal-map Y convention for derivative fallback; defaults to raw 'uv'. */
    tangentConvention?: 'uv' | 'gltf';
    indices: ArrayLike<number>;
    /** Optional linear RGB or RGBA per vertex, multiplied into the base color. */
    colors?: ArrayLike<number>;
}
/** CPU-only indexed triangles. Input arrays are copied; call markUpdated after changing vertices. */
export declare class Geometry {
    /** xyz, normal xyz, uv, interleaved at a stride of eight floats. */
    readonly vertices: Float32Array;
    readonly indices: Uint32Array;
    /** Two floats per vertex; edit in place then call markUpdated, like vertices. */
    readonly uvs1: Float32Array | undefined;
    /** xyz plus glTF handedness; edit in place then call markUpdated, like vertices. */
    readonly tangents: Float32Array;
    readonly tangentTexCoord: 0 | 1;
    readonly tangentConvention: 'uv' | 'gltf';
    version: number;
    private vertexColors;
    /**
     * Per-vertex linear RGBA (four floats per vertex) or undefined. Renderers multiply it into
     * the base color, together with `InstancedMesh` colors and the material tint.
     * Replace the array with {@link setColors}, or edit it in place and call {@link markUpdated}.
     */
    get colors(): Float32Array | undefined;
    /** Copies RGB(A) colors, supplying alpha 1 for RGB input, or removes vertex colors. */
    setColors(colors: ArrayLike<number> | undefined): void;
    markUpdated(): void;
    constructor(data: GeometryData);
    private boundsVersion;
    private readonly sphere;
    /** Bounding sphere of the box around all vertices; recomputed only after `markUpdated`. */
    get boundingSphere(): Readonly<{
        x: number;
        y: number;
        z: number;
        radius: number;
    }>;
    static cube(size?: number): Geometry;
    static sphere(radius?: number, widthSegments?: number, heightSegments?: number): Geometry;
    /** Horizontal XZ plane, facing +Y; UV origin is at the near-left corner. */
    static plane(width?: number, depth?: number): Geometry;
    /** XY quad facing +Z, with texture V increasing downward. */
    static quad(width?: number, height?: number): Geometry;
}
/** Named unit-box factory for scene construction. */
export declare class BoxGeometry {
    static unit(): Geometry;
}
