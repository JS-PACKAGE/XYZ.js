import type { PostProcessingSettings } from '../../core/src/render-settings.js';
import { type Camera3D } from '../../core/src/orthographic-camera.js';
import type { Matrix4 } from '../../math/src/index.js';
import type { FrameStats } from './render-stats.js';
/** A linear rgba16float scene target, resolved before the 2D overlay. */
export declare class WebGPUPostPipeline {
    private readonly device;
    private readonly pipeline;
    private readonly fxaaPipeline;
    private readonly format;
    readonly stats: FrameStats;
    private texture;
    private view;
    private bindGroup;
    private buffer;
    private fxaaTexture;
    private fxaaView;
    private fxaaGroup;
    private readonly fxaaSampler;
    private width;
    private height;
    private readonly data;
    private readonly attachment;
    private readonly descriptor;
    private constructor();
    static initialize(device: GPUDevice, format: GPUTextureFormat, isDestroyed: () => boolean, sampleCount: number, stats: FrameStats): Promise<WebGPUPostPipeline>;
    target(width: number, height: number, depth: GPUTextureView): GPUTextureView;
    copyColor(encoder: GPUCommandEncoder, destination: GPUTexture): void;
    private ensureFxaa;
    private releaseFxaa;
    render(encoder: GPUCommandEncoder, view: GPUTextureView, settings: PostProcessingSettings, camera: Camera3D, inverseVP: Matrix4): void;
    resize(width: number, height: number): void;
    releaseTarget(): void;
    destroy(): void;
}
