export interface LensFlareOptions {
    enabled?: boolean;
    strength?: number;
    threshold?: number;
    ghosts?: number;
    spacing?: number;
    haloRadius?: number;
    haloWidth?: number;
}
/** Bounded screen-space bright-pass ghosts and halo; no occluded/offscreen sources. */
export declare class LensFlareSettings {
    enabled: boolean;
    strength: number;
    threshold: number;
    ghosts: number;
    spacing: number;
    haloRadius: number;
    haloWidth: number;
    constructor(options?: LensFlareOptions);
    validate(): void;
}
