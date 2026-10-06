import type { Renderer } from './index.js';
import type { GpuTimingStats } from './render-stats.js';
export interface ProfilerOptions {
    enabled?: boolean;
    windowFrames?: number;
    hitchMilliseconds?: number;
}
export interface ProfilerDistribution {
    samples: number;
    p50: number | null;
    p95: number | null;
    max: number | null;
}
export interface ProfilerReport {
    frames: number;
    windowFrames: number;
    hitches: number;
    cpuFrameMs: ProfilerDistribution;
    cpuSubmitMs: ProfilerDistribution;
    rafIntervalMs: ProfilerDistribution;
    gpuMs: ProfilerDistribution;
    /** RAF callback cadence, not confirmed presentation. */
    rafFps: number | null;
    /** Neither timestamps nor RAF confirm presentation or GPU throughput. */
    presentationFps: null;
    gpuFps: null;
    /** JavaScript engines do not expose a portable allocation counter. */
    jsAllocations: null;
    gpuTiming: GpuTimingStats;
    latest: {
        drawCalls: number;
        triangles: number;
        uploadBytes: number;
        shadowPasses: number | null;
        textureBytes: number;
        geometryBytes: number;
        /** Sum of tracked residency and render-target estimates, not total driver VRAM. */
        trackedGpuBytes: number;
    };
}
/** Opt-in, bounded CPU/RAF/GPU measurements adjacent to game.graphics.
 * Attach after Game.create; GPU timestamp support must be requested at creation.
 * Disabled collection performs no clock reads, copies or sample allocations.
 */
export declare class Profiler {
    private readonly renderer;
    enabled: boolean;
    private readonly windowFrames;
    private readonly hitchMilliseconds;
    private readonly samples;
    private count;
    private cursor;
    private frames;
    private hitches;
    private previousTimestamp;
    private start;
    private interval;
    private gpuFrame;
    constructor(renderer: Renderer, options?: ProfilerOptions);
    /** Called with the actual RAF timestamp, never the simulation delta. */
    beginFrame(timestamp: number): void;
    endFrame(): void;
    /** Reset cadence across hidden/pause intervals without discarding history. */
    suspend(): void;
    destroy(): void;
    report(): ProfilerReport;
    format(): string;
}
