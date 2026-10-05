import type { EnvironmentMap } from '../../core/src/environment.js';
/** Same native sampler for the global map and four spatial volumes, preserving texture limits. */
export declare function packProbeTextures(maps: readonly (EnvironmentMap | undefined)[]): {
    width: number;
    height: number;
    mipCount: number;
    levels: {
        width: number;
        height: number;
        data: Uint16Array;
    }[];
    bytes: number;
};
