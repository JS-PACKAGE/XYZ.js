import { describe, expect, it } from 'vitest';
import { Clock } from '../packages/core/src/clock.js';

describe('Clock gameplay time', () => {
  it('converts milliseconds to seconds and clamps long frame gaps', () => {
    const clock = new Clock(0.05);
    clock.tick(1000);
    clock.tick(1020);
    expect(clock.deltaTime).toBeCloseTo(0.02);
    expect(clock.fps).toBeCloseTo(50);
    clock.tick(10000);
    expect(clock.deltaTime).toBe(0.05);
    expect(clock.elapsedTime).toBeCloseTo(0.07);
    expect(clock.frame).toBe(3);
  });

  it('excludes time spent paused or hidden and retains elapsed gameplay time', () => {
    const clock = new Clock();
    clock.tick(0);
    clock.tick(25);
    clock.suspend();
    clock.tick(90000);
    expect(clock.deltaTime).toBe(0);
    expect(clock.elapsedTime).toBe(0.025);
    clock.tick(90020);
    expect(clock.elapsedTime).toBeCloseTo(0.045);
  });

  it('does not double-count time when a timestamp moves backwards', () => {
    const clock = new Clock();
    clock.tick(100);
    clock.tick(90);
    expect(clock.deltaTime).toBe(0);
    clock.tick(110);
    expect(clock.elapsedTime).toBeCloseTo(0.01);
    clock.reset();
    clock.tick(5000);
    expect(clock.elapsedTime).toBe(0);
    expect(clock.frame).toBe(1);
  });

  it('rejects invalid time bounds and timestamps without poisoning the clock', () => {
    for (const value of [0, -1, NaN, Infinity])
      expect(() => new Clock(value)).toThrow(RangeError);
    const clock = new Clock();
    clock.tick(0);
    expect(() => clock.tick(NaN)).toThrow(RangeError);
    clock.tick(10);
    expect(clock.elapsedTime).toBeCloseTo(0.01);
  });
});
