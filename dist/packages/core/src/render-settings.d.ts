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
    /** One keeps the fixed directional frustum; two to four fit camera-depth slices. */
    cascades?: number;
    cascadeDistance?: number;
    /** Blend between uniform (0) and logarithmic (1) cascade splits. */
    cascadeLambda?: number;
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
    /** Screen-space antialiasing after tone mapping, before the 2D overlay. */
    fxaa?: boolean;
    ssao?: boolean;
    /** World-space AO sampling radius. */
    ssaoRadius?: number;
    ssaoStrength?: number;
    ssaoBias?: number;
    depthOfField?: boolean;
    /** View depth in world units, not Euclidean distance to the camera. */
    dofFocusDistance?: number;
    /** View-depth interval over which blur grows to its maximum. */
    dofFocusRange?: number;
    /** Maximum circle radius in backing pixels. */
    dofBlurRadius?: number;
}
/** Directional cascades and point/spot atlas shadows; mutable settings are validated each render. */
export declare class ShadowSettings {
    enabled: boolean;
    mapSize: number;
    extent: number;
    near: number;
    far: number;
    bias: number;
    target: Vector3;
    cascades: number;
    cascadeDistance: number;
    cascadeLambda: number;
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
    fxaa: boolean;
    ssao: boolean;
    ssaoRadius: number;
    ssaoStrength: number;
    ssaoBias: number;
    depthOfField: boolean;
    dofFocusDistance: number;
    dofFocusRange: number;
    dofBlurRadius: number;
    constructor(options?: PostProcessingSettingsOptions);
    validate(): void;
}
export type FogMode = 'linear' | 'exp2';
export interface FogSettingsOptions {
    enabled?: boolean;
    mode?: FogMode;
    /** Display (sRGB) color the scene fades toward, components in 0..1. */
    color?: [number, number, number];
    /** Linear mode: distance where fog begins. */
    near?: number;
    /** Linear mode: distance of full fog. */
    far?: number;
    /** Exp2 mode: coverage is 1 - exp(-(density * distance)^2). */
    density?: number;
}
/** Distance fog for 3D meshes; the skybox and 2D overlay are not fogged. */
export declare class FogSettings {
    enabled: boolean;
    mode: FogMode;
    color: [number, number, number];
    near: number;
    far: number;
    density: number;
    constructor(options?: FogSettingsOptions);
    validate(): void;
}
