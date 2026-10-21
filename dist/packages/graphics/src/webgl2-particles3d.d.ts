import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { Camera3D } from '../../core/src/orthographic-camera.js';
import type { FrameStats } from './render-stats.js';
/** GLSL ES 3.00 analytic instanced vertices; no CPU simulation/uploaded positions. */
export declare class WebGL2Particles3D {
    private readonly gl;
    private readonly stats;
    private readonly buffers;
    private readonly ranges;
    private readonly uniforms;
    private readonly program;
    private frame;
    private disposed;
    constructor(gl: WebGL2RenderingContext, stats: FrameStats);
    get nativeBufferCount(): number;
    prepare(emitter: GPUParticleEmitter3D): void;
    /**
     * Draw into the renderer's current color/depth framebuffer, before post/2D. Bindings
     * and enable caps are restored. Fixed-function values are not read back: unlike
     * bindings, each such query is a synchronous GPU-process round trip. The engine only
     * binds whole uniform buffers and only ever leaves LESS depth testing and FUNC_ADD
     * blending in place, which this restores; the caller re-establishes depth writes and
     * blend factors.
     */
    draw(emitters: Iterable<GPUParticleEmitter3D>, camera: Camera3D, aspect: number, linear?: boolean): void;
    /** Retire scene-excluded resources even when no color pass is opened. */
    synchronize(emitters: Iterable<GPUParticleEmitter3D>): void;
    /** Release emitter allocations while keeping the reusable native program. */
    clear(): void;
    /** Loss/restoration uses a fresh module/program; retained commands rebuild lazily. */
    destroy(): void;
    /** Sends the slots written since this entry's version into the bound ARRAY_BUFFER. */
    private uploadCommands;
    private drawRange;
    private allocate;
    private release;
}
