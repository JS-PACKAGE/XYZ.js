export interface MotionBlurOptions {
    enabled?: boolean;
    strength?: number;
    samples?: number;
    maxRadius?: number;
}
/** Camera-only depth reprojection; does not invent per-object motion vectors. */
export declare class MotionBlurSettings {
    enabled: boolean;
    strength: number;
    samples: number;
    maxRadius: number;
    constructor(options?: MotionBlurOptions);
    validate(): void;
}
