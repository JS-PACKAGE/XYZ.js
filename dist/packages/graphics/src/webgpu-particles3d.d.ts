import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { Camera3D } from '../../core/src/orthographic-camera.js';
import type { FrameStats } from './render-stats.js';
/** Native analytic vertex simulation; renderer owns this module per GPUDevice. */
export declare class WebGPUParticles3D {
    private readonly device;
    private readonly layout;
    private readonly pipeline;
    private readonly hdrPipeline;
    private readonly stats;
    private readonly buffers;
    private readonly uniforms;
    private frame;
    private disposed;
    private constructor();
    static initialize(device: GPUDevice, format: GPUTextureFormat, sampleCount: number, stats: FrameStats): Promise<WebGPUParticles3D>;
    get nativeBufferCount(): number;
    prepare(emitter: GPUParticleEmitter3D): void;
    /** Main color/depth pass only, never a shadow or weighted accumulation pass. */
    draw(pass: GPURenderPassEncoder, emitters: Iterable<GPUParticleEmitter3D>, camera: Camera3D, aspect: number, linear?: boolean): void;
    /** Retire scene-excluded resources even when no color pass is opened. */
    synchronize(emitters: Iterable<GPUParticleEmitter3D>): void;
    /** Release emitter allocations while keeping the reusable native pipelines. */
    clear(): void;
    /** Device loss discards every native handle; reinitialize against the new device. */
    destroy(): void;
    private allocate;
    private release;
}
