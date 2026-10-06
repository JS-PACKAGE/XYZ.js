export interface VolumetricFogOptions {
    enabled?: boolean;
    density?: number;
    baseHeight?: number;
    heightFalloff?: number;
    maxDistance?: number;
    color?: [number, number, number];
    shaftStrength?: number;
    fogSamples?: number;
    shaftSamples?: number;
}
/** Depth-reconstructed exponential height fog and directional screen-space shafts. */
export declare class VolumetricFogSettings {
    enabled: boolean;
    density: number;
    baseHeight: number;
    heightFalloff: number;
    maxDistance: number;
    color: [number, number, number];
    shaftStrength: number;
    fogSamples: number;
    shaftSamples: number;
    constructor(options?: VolumetricFogOptions);
    validate(): void;
}
