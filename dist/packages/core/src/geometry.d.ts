export interface GeometryData {
    positions: ArrayLike<number>;
    normals: ArrayLike<number>;
    uvs: ArrayLike<number>;
    indices: ArrayLike<number>;
}
/** CPU-only indexed triangles. Input arrays are copied; treat vertices and indices as immutable after construction. */
export declare class Geometry {
    /** xyz, normal xyz, uv, interleaved at a stride of eight floats. */
    readonly vertices: Float32Array;
    readonly indices: Uint32Array;
    constructor(data: GeometryData);
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
