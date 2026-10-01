import { Matrix4 } from '../../math/src/index.js';
import type { Scene } from './scene.js';
/** Shared camera fitting and atlas metadata; no backend handles or per-frame allocation. */
export declare class ShadowAtlas {
    readonly matrices: Matrix4[];
    /** std140-compatible header followed by matrices. */
    readonly data: Float32Array<ArrayBuffer>;
    /** One matrix per 256-byte dynamic uniform slot for WebGPU shadow draws. */
    readonly projections: Float32Array<ArrayBuffer>;
    count: number;
    grid: number;
    size: number;
    private readonly inverse;
    private readonly perspective;
    private readonly orthographic;
    private readonly nearCorners;
    private readonly farCorners;
    private readonly corners;
    private readonly center;
    private readonly target;
    private readonly forward;
    update(scene: Scene, aspect: number): void;
    private projectLight;
    private fitCascades;
}
