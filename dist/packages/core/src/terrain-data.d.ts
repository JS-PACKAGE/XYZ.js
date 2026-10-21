import { Texture } from '../../assets/src/index.js';
export interface TerrainImageData {
    readonly width: number;
    readonly height: number;
    readonly data: ArrayLike<number>;
}
export type TerrainImageSource = TerrainImageData | Texture;
/** Reads decoded images only; native/compressed sources cannot be sampled on the CPU. */
export declare function terrainImageData(source: TerrainImageSource): TerrainImageData;
/**
 * Bilinear samples of channels `0..count-1` at (u, v), scaled to [0,1], into `out`;
 * `repeat` wraps the coordinates instead of clamping them.
 */
export declare function terrainChannels(image: TerrainImageData, u: number, v: number, count: number, repeat: boolean, out: Float64Array): void;
