import { afterEach, describe, expect, it, vi } from 'vitest';
import { Profiler } from '../packages/graphics/src/profiler.js';
import { FrameStats } from '../packages/graphics/src/render-stats.js';
import { NativeResidency } from '../packages/graphics/src/residency.js';
import type { Renderer } from '../src/index.js';

function fixture() {
  const stats = new FrameStats();
  const residency = new NativeResidency();
  const renderer = { stats, residency } as unknown as Renderer;
  return { renderer, stats, residency };
}
afterEach(() => vi.restoreAllMocks());
describe('Profiler', () => {
  it('uses raw RAF cadence, rolls quantiles and separates CPU/GPU/allocations', () => {
    const { renderer, stats } = fixture();
    const profiler = new Profiler(renderer, { enabled: true, windowFrames: 3 });
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    for (const [timestamp, duration] of [
      [0, 1],
      [500, 9],
      [516, 3],
      [532, 5],
    ]) {
      profiler.beginFrame(timestamp!);
      now += duration!;
      stats.cpuSubmitMs = duration! / 2;
      profiler.endFrame();
    }
    const report = profiler.report();
    expect(report.cpuFrameMs).toEqual({ samples: 3, p50: 5, p95: 9, max: 9 });
    expect(report.rafIntervalMs.max).toBe(500);
    expect(report.rafFps).toBeCloseTo(3000 / 532);
    expect(report.hitches).toBe(1);
    expect(report.presentationFps).toBeNull();
    expect(report.gpuFps).toBeNull();
    expect(report.jsAllocations).toBeNull();
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });
  it('deduplicates asynchronous GPU samples and preserves tracked resource estimates', () => {
    const { renderer, stats, residency } = fixture();
    const profiler = new Profiler(renderer, { enabled: true });
    stats.gpuTiming.sample(1, 4);
    stats.target(256);
    residency.textures.liveBytes = 128;
    for (const timestamp of [0, 16, 32]) {
      profiler.beginFrame(timestamp);
      profiler.endFrame();
    }
    expect(profiler.report().gpuMs.samples).toBe(1);
    expect(profiler.report().latest.trackedGpuBytes).toBe(384);
    profiler.suspend();
    profiler.beginFrame(10000);
    profiler.endFrame();
    expect(profiler.report().rafIntervalMs.max).toBe(16);
  });
  it('preserves signed-zero ranks and independent sparse channel distributions', () => {
    const { renderer, stats } = fixture();
    const profiler = new Profiler(renderer, { enabled: true, windowFrames: 4 });
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    for (const [timestamp, duration, submit, gpu] of [
      [0, 9, -0, 4],
      [1, 3, 0, null],
      [21, 6, -0, 2],
      [51, 12, null, null],
    ]) {
      profiler.beginFrame(timestamp!);
      now += duration!;
      stats.cpuSubmitMs = submit ?? null;
      if (gpu === null)
        stats.gpuTiming.unavailable('pending', 'Waiting for another sample.');
      else stats.gpuTiming.sample(timestamp!, gpu!);
      profiler.endFrame();
    }
    const report = profiler.report();
    expect(report.cpuFrameMs).toEqual({ samples: 4, p50: 6, p95: 12, max: 12 });
    expect(report.cpuSubmitMs.samples).toBe(3);
    expect(report.cpuSubmitMs.p50).toBe(0);
    expect(report.cpuSubmitMs.p95).toBe(-0);
    expect(report.cpuSubmitMs.max).toBe(-0);
    expect(report.rafIntervalMs).toEqual({
      samples: 3,
      p50: 20,
      p95: 30,
      max: 30,
    });
    expect(report.gpuMs).toEqual({ samples: 2, p50: 2, p95: 4, max: 4 });
    expect(report.rafFps).toBe(3000 / 51);
    expect(profiler.report()).toEqual(report);
  });
  it('does no timing work while disabled and detaches without removing a replacement', () => {
    const { renderer } = fixture();
    const profiler = new Profiler(renderer);
    const clock = vi.spyOn(performance, 'now');
    profiler.beginFrame(0);
    profiler.endFrame();
    expect(clock).not.toHaveBeenCalled();
    expect(profiler.report().frames).toBe(0);
    const replacement = new Profiler(renderer);
    profiler.destroy();
    expect(renderer.profiler).toBe(replacement);
    replacement.destroy();
    expect(renderer.profiler).toBeUndefined();
  });
  it('rejects unbounded windows and invalid hitch limits', () => {
    const { renderer } = fixture();
    expect(() => new Profiler(renderer, { windowFrames: 0 })).toThrow(
      RangeError,
    );
    expect(() => new Profiler(renderer, { windowFrames: 65537 })).toThrow(
      RangeError,
    );
    expect(() => new Profiler(renderer, { hitchMilliseconds: NaN })).toThrow(
      RangeError,
    );
  });
});
