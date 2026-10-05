import { Texture } from '../texture.js';
export interface DistanceFieldProfile {
    readonly type: 'sdf' | 'msdf';
    readonly range: number;
}
export declare function getTextureDistanceField(texture: Texture): DistanceFieldProfile | undefined;
export declare function registerTextureDistanceField(texture: Texture, profile: DistanceFieldProfile): void;
/** Internal renderer policy: stable cache buckets, never exceed page/pixel bounds. */
export declare function getDistanceFieldRasterScale(texture: Texture, desiredScale: number): number;
/** CPU bilinear distance sampling, not scaling a previously thresholded bitmap. */
export declare function getDistanceFieldCanvas(texture: Texture, scale?: number): HTMLCanvasElement;
