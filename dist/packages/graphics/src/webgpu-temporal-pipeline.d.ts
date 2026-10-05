import type { PostProcessingSettings } from '../../core/src/render-settings.js';
import type { FrameStats } from './render-stats.js';
import { TemporalPostState } from './temporal-post.js';
/** Native linear HDR SSR and ping-pong TAA, with sampled single/MSAA scene depth. */
export declare class WebGPUTemporalPipeline {
    private readonly device;
    private readonly stats;
    private readonly ssrPipeline;
    private readonly taaPipeline;
    private readonly uniform;
    private readonly taaUniform;
    private readonly data;
    private readonly blitPipelines;
    private scratch;
    private readonly history;
    private readonly depths;
    private width;
    private height;
    private index;
    private state;
    constructor(device: GPUDevice, sampleCount: number, stats: FrameStats);
    private ensure;
    private allocate;
    applyOpaqueSSR(encoder: GPUCommandEncoder, source: GPUTexture, depth: GPUTextureView, state: TemporalPostState, settings: PostProcessingSettings): GPUTexture;
    applyTAA(encoder: GPUCommandEncoder, source: GPUTexture, depth: GPUTextureView, state: TemporalPostState, settings: PostProcessingSettings): GPUTexture;
    private render;
    blit(encoder: GPUCommandEncoder, source: GPUTexture, destination: GPUTextureView, sampleCount?: number): void;
    resize(width: number, height: number): void;
    releaseTarget(): void;
    destroy(): void;
}
