import { Texture } from '../../assets/src/index.js';
export interface TerrainImageData {
    readonly width: number;
    readonly height: number;
    readonly data: ArrayLike<number>;
}
export type TerrainImageSource = TerrainImageData | Texture;
/** Reads decoded images only; native/compressed sources cannot be sampled on the CPU. */
export declare function terrainImageData(source: TerrainImageSource): TerrainImageData;
export declare function terrainChannel(image: TerrainImageData, u: number, v: number, channel: number, repeat?: boolean): number;
