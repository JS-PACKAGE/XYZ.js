import type { Mesh } from '../../core/src/mesh.js';
import type { TemporalPostState } from './temporal-post.js';
import type { FrameStats } from './render-stats.js';
/** Renderer-owned velocity attachment; borrows current opaque depth and cached geometry. */
export declare class WebGPUObjectMotion {
    private readonly device;
    private readonly stats;
    private readonly history;
    private readonly pipeline;
    private readonly layout;
    private readonly stride;
    private groupForPass?;
    private texture?;
    private view?;
    private buffer?;
    private data;
    private width;
    private height;
    constructor(device: GPUDevice, samples: number, stats: FrameStats);
    render(encoder: GPUCommandEncoder, meshes: readonly Mesh[], state: TemporalPostState, depth: GPUTextureView, geometry: (mesh: Mesh) => {
        vertex: GPUBuffer;
        index: GPUBuffer;
    }): GPUTextureView;
    resize(width: number, height: number): void;
    releaseTarget(): void;
    destroy(): void;
}
