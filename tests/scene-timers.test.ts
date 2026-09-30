import { expect, it } from 'vitest';
import { SceneTimers } from '../packages/core/src/scene-timers.js';
import { Scene } from '../packages/core/src/scene.js';

it('fires once at the deadline and cancels independently', () => {
  const timers = new SceneTimers();
  const calls: string[] = [];
  const once = timers.after(1, () => calls.push('once'));
  const cancelled = timers.after(1, () => calls.push('cancelled'));
  cancelled.cancel();
  timers.update(0.75);
  expect(calls).toEqual([]);
  timers.update(0.25);
  timers.update(1);
  expect(calls).toEqual(['once']);
  expect(once.active).toBe(false);
  expect(cancelled.active).toBe(false);
});

it('skips missed periods without bursts or shifting the original cadence', () => {
  const timers = new SceneTimers();
  let calls = 0;
  const repeat = timers.every(1, () => calls++);
  timers.update(3.25);
  expect(calls).toBe(1);
  timers.update(0.5);
  expect(calls).toBe(1);
  timers.update(0.25);
  expect(calls).toBe(2);
  repeat.cancel();
  timers.update(5);
  expect(calls).toBe(2);
});

it('defers nested zero-delay work and permits cancellation during callbacks', () => {
  const timers = new SceneTimers();
  const calls: string[] = [];
  timers.after(0, () => {
    calls.push('first');
    cancelled.cancel();
    timers.after(0, () => calls.push('nested'));
  });
  const cancelled = timers.after(0, () => calls.push('cancelled'));
  timers.update(0);
  expect(calls).toEqual(['first']);
  timers.update(0);
  expect(calls).toEqual(['first', 'nested']);
});

it('scene teardown inside a callback cancels the remaining batch and future work', () => {
  const scene = new Scene();
  const calls: string[] = [];
  scene.timers.after(0, () => {
    calls.push('destroy');
    scene.destroy();
  });
  const repeat = scene.timers.every(1, () => calls.push('repeat'));
  scene.timers.after(0, () => calls.push('late'));
  scene.timers.update(1);
  scene.timers.update(5);
  expect(calls).toEqual(['destroy']);
  expect(repeat.active).toBe(false);
  expect(() => scene.timers.after(0, () => {})).toThrow('destroyed');
});

it('propagates callback errors without replaying a completed one-shot', () => {
  const timers = new SceneTimers();
  const error = new Error('callback failure');
  const task = timers.after(0, () => {
    throw error;
  });
  expect(() => timers.update(0)).toThrow(error);
  expect(task.active).toBe(false);
  let calls = 0;
  timers.after(0, () => calls++);
  timers.update(0);
  expect(calls).toBe(1);
});

it('rejects invalid delays, intervals and recursive advancement', () => {
  const timers = new SceneTimers();
  for (const delay of [-1, NaN, Infinity])
    expect(() => timers.after(delay, () => {})).toThrow(RangeError);
  for (const interval of [0, -1, NaN, Infinity])
    expect(() => timers.every(interval, () => {})).toThrow(RangeError);
  timers.after(0, () => timers.update(0));
  expect(() => timers.update(0)).toThrow('recursively');
  expect(() => timers.update(-1)).toThrow(RangeError);
});
