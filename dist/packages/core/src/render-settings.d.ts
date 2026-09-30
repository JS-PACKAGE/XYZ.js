import { Vector3 } from '../../math/src/index.js';
export interface ShadowSettingsOptions {
    enabled?: boolean;
    mapSize?: number;
    /** Full width and height of the directional-light orthographic frustum. */
    extent?: number;
    near?: number;
    far?: number;
    bias?: number;
    target?: Vector3;
}
export type ToneMapping = 'none' | 'aces';
export interface PostProcessingSettingsOptions {
    enabled?: boolean;
    exposure?: number;
    toneMapping?: ToneMapping;
    bloomStrength?: number;
    bloomThreshold?: number;
    /** Neighbor sampling radius in output pixels. */
    bloomRadius?: number;
}
/** Directional shadows only; settings remain mutable and are validated each render. */
export declare class ShadowSettings {
    enabled: boolean;
    mapSize: number;
    extent: number;
    near: number;
    far: number;
    bias: number;
    target: Vector3;
    constructor(options?: ShadowSettingsOptions);
    validate(): void;
}
/** Fullscreen HDR processing after 3D and before the unaffected 2D overlay. */
export declare class PostProcessingSettings {
    enabled: boolean;
    exposure: number;
    toneMapping: ToneMapping;
    bloomStrength: number;
    bloomThreshold: number;
    bloomRadius: number;
    constructor(options?: PostProcessingSettingsOptions);
    validate(): void;
}
