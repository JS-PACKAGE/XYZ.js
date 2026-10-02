import type { Matrix4 } from '../../math/src/index.js';
import type { Mesh } from '../../core/src/mesh.js';
import type { OcclusionCandidate, OcclusionProofSource } from '../../core/src/render-visibility.js';
/** Native depth proof, never a CPU bounding-overlap approximation. */
export declare class WebGPUOcclusionBackend implements OcclusionProofSource {
    private readonly device;
    private readonly frames;
    private readonly results;
    private readonly activeMeshes;
    private readonly pipelines;
    private readonly layout;
    private readonly pipelineLayout;
    private readonly shader;
    private readonly vertex;
    private readonly index;
    private destroyed;
    private generation;
    /** Readback failure disables optional culling and leaves all objects visible. */
    failure: unknown;
    constructor(device: GPUDevice);
    visible(mesh: Mesh, epoch: number): boolean;
    /**
     * Encode AFTER opaque depth, before its attachment is discarded. No color/depth writes.
     * Call afterSubmit immediately AFTER queue.submit; otherwise no readback is scheduled.
     */
    encode(encoder: GPUCommandEncoder, depth: GPUTextureView, matrix: Matrix4, candidates: readonly OcclusionCandidate[], width: number, height: number, sampleCount?: number, depthFormat?: GPUTextureFormat): void;
    afterSubmit(): void;
    clear(): void;
    destroy(): void;
}
