import { profilerDefaults } from '../../../src/data/observability.js';
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
export class Profiler {
  enabled: boolean;
  private readonly windowFrames: number;
  private readonly hitchMilliseconds: number;
  private readonly samples: Float64Array;
  private count = 0;
  private cursor = 0;
  private frames = 0;
  private hitches = 0;
  private previousTimestamp: number | undefined;
  private start: number | undefined;
  private interval = NaN;
  private gpuFrame: number | null = null;

  constructor(
    private readonly renderer: Renderer,
    options: ProfilerOptions = {},
  ) {
    this.enabled = options.enabled ?? false;
    this.windowFrames = options.windowFrames ?? profilerDefaults.windowFrames;
    this.hitchMilliseconds =
      options.hitchMilliseconds ?? profilerDefaults.hitchMilliseconds;
    if (
      !Number.isSafeInteger(this.windowFrames) ||
      this.windowFrames < 1 ||
      this.windowFrames > profilerDefaults.maximumWindowFrames
    )
      throw new RangeError(
        'Profiler windowFrames must be an integer from 1 to 65536.',
      );
    if (!Number.isFinite(this.hitchMilliseconds) || this.hitchMilliseconds <= 0)
      throw new RangeError(
        'Profiler hitchMilliseconds must be positive and finite.',
      );
    this.samples = new Float64Array(this.windowFrames * 4);
    this.samples.fill(NaN);
    renderer.profiler = this;
  }

  /** Called with the actual RAF timestamp, never the simulation delta. */
  beginFrame(timestamp: number): void {
    if (!this.enabled) {
      this.suspend();
      return;
    }
    if (!Number.isFinite(timestamp))
      throw new RangeError('RAF timestamp must be finite.');
    this.interval =
      this.previousTimestamp === undefined || timestamp < this.previousTimestamp
        ? NaN
        : timestamp - this.previousTimestamp;
    this.previousTimestamp = timestamp;
    this.start = performance.now();
  }

  endFrame(): void {
    if (!this.enabled || this.start === undefined) return;
    const stats = this.renderer.stats;
    const offset = this.cursor * 4;
    this.samples[offset] = performance.now() - this.start;
    this.samples[offset + 1] = stats.cpuSubmitMs ?? NaN;
    this.samples[offset + 2] = this.interval;
    const gpu = stats.gpuTiming;
    this.samples[offset + 3] =
      gpu.status === 'available' && gpu.sampledFrame !== this.gpuFrame
        ? (gpu.milliseconds ?? NaN)
        : NaN;
    if (gpu.status === 'available') this.gpuFrame = gpu.sampledFrame;
    if (this.interval > this.hitchMilliseconds) this.hitches++;
    this.cursor = (this.cursor + 1) % this.windowFrames;
    this.count = Math.min(this.count + 1, this.windowFrames);
    this.frames++;
    this.start = undefined;
  }

  /** Reset cadence across hidden/pause intervals without discarding history. */
  suspend(): void {
    this.previousTimestamp = undefined;
    this.start = undefined;
  }

  destroy(): void {
    if (this.renderer.profiler === this) delete this.renderer.profiler;
    this.enabled = false;
    this.suspend();
  }

  report(): ProfilerReport {
    const distribution = (channel: number): ProfilerDistribution => {
      const values: number[] = [];
      for (let i = 0; i < this.count; i++) {
        const value = this.samples[i * 4 + channel]!;
        if (Number.isFinite(value)) values.push(value);
      }
      values.sort((a, b) => a - b);
      const quantile = (fraction: number): number | null =>
        values.length
          ? values[Math.max(0, Math.ceil(values.length * fraction) - 1)]!
          : null;
      return {
        samples: values.length,
        p50: quantile(0.5),
        p95: quantile(0.95),
        max: quantile(1),
      };
    };
    const stats = this.renderer.stats;
    const residency = this.renderer.residency;
    let intervalTotal = 0;
    let intervals = 0;
    for (let i = 0; i < this.count; i++) {
      const interval = this.samples[i * 4 + 2]!;
      if (Number.isFinite(interval) && interval > 0) {
        intervalTotal += interval;
        intervals++;
      }
    }
    return {
      frames: this.frames,
      windowFrames: this.count,
      hitches: this.hitches,
      cpuFrameMs: distribution(0),
      cpuSubmitMs: distribution(1),
      rafIntervalMs: distribution(2),
      gpuMs: distribution(3),
      rafFps: intervals ? (intervals * 1000) / intervalTotal : null,
      presentationFps: null,
      gpuFps: null,
      jsAllocations: null,
      gpuTiming: { ...stats.gpuTiming },
      latest: {
        drawCalls: stats.drawCalls + stats.drawCalls2D + stats.shadowDrawCalls,
        triangles: stats.triangles,
        uploadBytes: stats.uploadBytes,
        shadowPasses: stats.shadowPasses ?? null,
        textureBytes: residency.textures.liveBytes,
        geometryBytes: residency.geometry.liveBytes,
        trackedGpuBytes:
          residency.textures.liveBytes +
          residency.geometry.liveBytes +
          stats.renderTargetBytes,
      },
    };
  }

  format(): string {
    const report = this.report();
    const ms = (value: number | null): string =>
      value === null ? 'unavailable' : `${value.toFixed(2)} ms`;
    return (
      `Profiler: ${report.frames} frames, ${report.hitches} hitches\n` +
      `CPU frame p50/p95/max: ${ms(report.cpuFrameMs.p50)} / ${ms(report.cpuFrameMs.p95)} / ${ms(report.cpuFrameMs.max)}\n` +
      `CPU submit p95: ${ms(report.cpuSubmitMs.p95)}; GPU p95: ${ms(report.gpuMs.p95)} (${report.gpuTiming.status})\n` +
      `RAF cadence: ${report.rafFps?.toFixed(2) ?? 'unavailable'} Hz; presentation/GPU FPS and JS allocations: unavailable\n` +
      `Draws: ${report.latest.drawCalls}; triangles: ${report.latest.triangles}; uploads: ${report.latest.uploadBytes} B; tracked GPU: ${report.latest.trackedGpuBytes} B`
    );
  }
}
