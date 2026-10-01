import { describe, expect, it } from 'vitest';
import { BoundedTiming, BoundedTrend } from '../measurement.js';

describe('bounded soak evidence', () => {
  it('keeps exact means/maxima and threshold counts when percentiles overflow', () => {
    const timing = new BoundedTiming(20);
    for (const value of [0, 20, 50, 50.01, 2048]) timing.add(value);
    const result = timing.snapshot();
    expect(result.count).toBe(5);
    expect(result.mean).toBeCloseTo(433.602);
    expect(result.max).toBe(2048);
    expect(result.p50).toBe(50.25);
    expect(result.p95).toBeNull();
    expect(result.histogramOverflow).toBe(1);
    expect(result.overBudget).toBe(3);
    expect(result.longFramesOver50Ms).toBe(2);
  });

  it('distinguishes no observations from a zero-duration observation', () => {
    const timing = new BoundedTiming();
    expect(timing.snapshot().mean).toBeNull();
    expect(timing.snapshot().p50).toBeNull();
    timing.add(0);
    expect(timing.snapshot().mean).toBe(0);
    expect(timing.snapshot().p95).toBe(0.25);
    for (const value of [-1, Infinity, NaN])
      expect(() => timing.add(value)).toThrow(RangeError);
    expect(timing.snapshot().count).toBe(1);
  });

  it('keeps online slope across the complete soak but retains only the last 32 cycles', () => {
    const trend = new BoundedTrend();
    for (let index = 0; index < 100; index++) trend.add(100 + index * 4);
    const result = trend.snapshot();
    expect(result.count).toBe(100);
    expect(result.first).toBe(100);
    expect(result.last).toBe(496);
    expect(result.min).toBe(100);
    expect(result.max).toBe(496);
    expect(result.slopePerCycle).toBeCloseTo(4);
    expect(result.tail).toEqual(
      Array.from({ length: 32 }, (_, index) => 372 + index * 4),
    );
    expect(result.tailRange).toBe(124);
  });

  it('reports a stable cache tail without mistaking lifetime growth for a flat trend', () => {
    const trend = new BoundedTrend();
    for (let index = 0; index < 10; index++) trend.add(index * 64);
    for (let index = 0; index < 40; index++) trend.add(640);
    const result = trend.snapshot();
    expect(result.tailRange).toBe(0);
    expect(result.slopePerCycle).toBeGreaterThan(0);
    expect(result.first).toBe(0);
    expect(result.last).toBe(640);
  });
});
