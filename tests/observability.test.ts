import { describe, expect, it } from 'vitest';
import { BoundedTiming, BoundedTrend } from '../benchmarks/measurement.js';
import { GpuFrameTiming } from '../packages/graphics/src/render-stats.js';
import { configureGpuTiming } from '../packages/graphics/src/gpu-timing.js';

describe('asynchronous GPU sample availability', () => {
  it('never converts disabled, invalid or disjoint samples to successful zero timing', () => {
    const timing = new GpuFrameTiming();
    expect(timing.milliseconds).toBeNull();
    timing.sample(1, 3);
    timing.sample(2, 0);
    expect(timing.status).toBe('pending');
    expect(timing.milliseconds).toBeNull();
    expect(timing.samples).toBe(1);
    expect(timing.invalid).toBe(1);
    timing.sample(3, 2);
    timing.unavailable('disjoint', 'GPU clock changed.');
    expect(timing.milliseconds).toBeNull();
    expect(timing.sampledFrame).toBeNull();
    expect(timing.totalMilliseconds).toBe(5);
  });
  it('counts out-of-order completions without regressing the newest frame result', () => {
    const timing = new GpuFrameTiming();
    timing.sample(8, 4);
    timing.sample(7, 2);
    expect(timing.sampledFrame).toBe(8);
    expect(timing.milliseconds).toBe(4);
    expect(timing.samples).toBe(2);
    expect(timing.totalMilliseconds).toBe(6);
    expect(timing.maximumMilliseconds).toBe(4);
  });
  it.each([0, 33, 1.5, Infinity])(
    'rejects unbounded/invalid in-flight capacity %s',
    (maxInFlight) => {
      expect(() =>
        configureGpuTiming(new GpuFrameTiming(), {
          enabled: true,
          maxInFlight,
        }),
      ).toThrow(RangeError);
    },
  );
});

describe('bounded trend evidence', () => {
  it('does not call small positive slopes leaks or sustained growth', () => {
    const trend = new BoundedTrend();
    for (let index = 0; index < 40; index++)
      trend.add(20_000_000 + index * 1000, index * 5);
    const summary = trend.snapshot();
    expect(summary.classification).toBe('plateau');
    expect(summary.tailSlopeBytesPerMinute).toBeGreaterThan(0);
    expect(summary.tail).toHaveLength(32);
    expect(summary.tailTimesSeconds?.[0]).toBe(40);
  });
  it('requires both sufficient duration and a rising lower envelope before sustained-growth classification', () => {
    const short = new BoundedTrend();
    const sustained = new BoundedTrend();
    for (let index = 0; index < 32; index++) {
      short.add(10_000_000 + index * 2_000_000, index);
      sustained.add(10_000_000 + index * 2_000_000, index * 5);
    }
    expect(short.snapshot().classification).toBe('insufficient-data');
    expect(sustained.snapshot().classification).toBe('sustained-growth');
  });
  it('distinguishes cyclic allocation from a growing memory floor', () => {
    const trend = new BoundedTrend();
    for (let index = 0; index < 32; index++)
      trend.add(10_000_000 + (index % 8) * 5_000_000, index * 5);
    expect(trend.snapshot().classification).toBe('variable');
    expect(trend.snapshot().tailFloorGrowthBytes).toBe(0);
  });
  it('rejects time reversal rather than emitting a misleading per-minute slope', () => {
    const trend = new BoundedTrend();
    trend.add(10, 20);
    expect(() => trend.add(20, 19)).toThrow(RangeError);
    expect(trend.snapshot().count).toBe(1);
  });
  it('reports percentile overflow as null while retaining actual stalls', () => {
    const timing = new BoundedTiming();
    timing.add(1500);
    const result = timing.snapshot();
    expect(result.p95).toBeNull();
    expect(result.max).toBe(1500);
    expect(result.longFramesOver50Ms).toBe(1);
    expect(result.histogramOverflow).toBe(1);
  });
});
