import { GpuFrameTiming, type GpuTimingOptions } from './render-stats.js';
/** Shared option validation happens even on unsupported backends. */
export declare function configureGpuTiming(stats: GpuFrameTiming, options: GpuTimingOptions): boolean;
/** Empty timestamp passes bracket all commands in the frame's encoder, not queue wait/present. */
export declare class WebGpuTimer {
    private readonly stats;
    private readonly slots;
    private active;
    private destroyed;
    constructor(stats: GpuFrameTiming, device: GPUDevice);
    begin(encoder: GPUCommandEncoder, frame: number): void;
    end(encoder: GPUCommandEncoder): void;
    submitted(): void;
    abort(): void;
    destroy(lost?: boolean): void;
}
interface DisjointTimerExtension {
    TIME_ELAPSED_EXT: number;
    GPU_DISJOINT_EXT: number;
}
/** EXT_disjoint_timer_query_webgl2 results are polled without blocking or fences. */
export declare class WebGlTimer {
    private readonly stats;
    private readonly gl;
    private readonly extension;
    private readonly slots;
    private active;
    private destroyed;
    private disjoint;
    constructor(stats: GpuFrameTiming, gl: WebGL2RenderingContext, extension: DisjointTimerExtension);
    begin(frame: number): void;
    end(): void;
    poll(): void;
    abort(): void;
    destroy(lost?: boolean): void;
}
export {};
