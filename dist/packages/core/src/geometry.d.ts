export interface GeometryData {
    positions: ArrayLike<number>;
    normals: ArrayLike<number>;
    uvs: ArrayLike<number>;
    indices: ArrayLike<number>;
    /** Optional linear RGB or RGBA per vertex, multiplied into the base color. */
    colors?: ArrayLike<number>;
}
/** CPU-only indexed triangles. Input arrays are copied; call markUpdated after changing vertices. */
export declare class Geometry {
    /** xyz, normal xyz, uv, interleaved at a stride of eight floats. */
    readonly vertices: Float32Array;
    readonly indices: Uint32Array;
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
