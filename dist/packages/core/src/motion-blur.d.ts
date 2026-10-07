export interface MotionBlurOptions {
    enabled?: boolean;
    strength?: number;
    samples?: number;
    maxRadius?: number;
    perObject?: boolean;
}
/** Depth reprojection, with optional rigid per-object motion on native backends. */
export declare class MotionBlurSettings {
    enabled: boolean;
    strength: number;
    samples: number;
    maxRadius: number;
    perObject: boolean;
    constructor(options?: MotionBlurOptions);
    validate(): void;
}
