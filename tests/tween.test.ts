import { describe, expect, it, vi } from 'vitest';
import { Timeline, Tween, TweenGroup } from '../packages/core/src/tween.js';
import { Vector2 } from '../packages/math/src/index.js';

describe('Tween', () => {
  it('interpolates nested numeric properties with easing and reports completion once', () => {
    const target = { opacity: 1, position: new Vector2(0, 0) };
    const complete = vi.fn();
    const tween = Tween.to(
      target,
      { 'position.x': 100, opacity: 0 },
      { duration: 2, easing: 'quadIn', onComplete: complete },
    ).play();
    tween.update(1);
    expect(target.position.x).toBeCloseTo(25);
    expect(target.opacity).toBeCloseTo(0.75);
    tween.update(5);
    expect(target.position.x).toBe(100);
    expect(target.opacity).toBe(0);
    expect(complete).toHaveBeenCalledTimes(1);
    tween.update(1);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(tween.completed).toBe(true);
  });

  it('honors delay, repeat and yoyo, ending at the right side', () => {
    const target = { x: 0 };
    const tween = Tween.to(
      target,
      { x: 10 },
      { duration: 1, delay: 1, repeat: 2, yoyo: true },
    ).play();
    tween.update(0.5);
    expect(target.x).toBe(0);
    tween.update(1);
    expect(target.x).toBeCloseTo(5);
    tween.update(1);
    expect(target.x).toBeCloseTo(5);
    tween.update(0.5);
    // The second pass runs backwards and has just come home.
    expect(target.x).toBeCloseTo(0);
    tween.update(0.5);
    expect(target.x).toBeCloseTo(5);
    tween.update(10);
    // Three passes with yoyo: forward, back, forward.
    expect(target.x).toBe(10);
    expect(tween.totalDuration).toBe(4);
  });

  it('reads start values when it first runs, so chained tweens continue where the last ended', () => {
    const target = { x: 0 };
    const timeline = new Timeline()
      .add(Tween.to(target, { x: 10 }, { duration: 1 }))
      .then(Tween.to(target, { x: 30 }, { duration: 1 }));
    timeline.seek(0.5);
    expect(target.x).toBeCloseTo(5);
    timeline.seek(1.5);
    expect(target.x).toBeCloseTo(20);
    // Scrubbing back restores earlier values.
    timeline.seek(0.25);
    expect(target.x).toBeCloseTo(2.5);
    timeline.seek(2);
    expect(target.x).toBe(30);
  });

  it('tweens from given values to the current ones and restores on stop', () => {
    const target = { x: 7 };
    const tween = Tween.from(target, { x: 0 }, { duration: 1 }).play();
    tween.update(0.5);
    expect(target.x).toBeCloseTo(3.5);
    tween.stop();
    // Stopping restores what the property held before the tween first ran.
    expect(target.x).toBe(7);
    tween.play().update(1);
    expect(target.x).toBe(7);
  });

  it('validates properties up front and stops quietly when its target is destroyed', () => {
    expect(() => Tween.to({ x: 1 }, { y: 2 }, { duration: 1 })).toThrow(
      TypeError,
    );
    expect(() => Tween.to({ x: 'a' }, { x: 2 }, { duration: 1 })).toThrow(
      TypeError,
    );
    expect(() =>
      Tween.to({ x: 1 }, { x: Number.NaN }, { duration: 1 }),
    ).toThrow(RangeError);
    expect(() => Tween.to({ x: 1 }, {}, { duration: 1 })).toThrow(RangeError);
    expect(() => Tween.to({ x: 1 }, { x: 2 }, { duration: -1 })).toThrow(
      RangeError,
    );
    expect(() =>
      Tween.to({ x: 1 }, { x: 2 }, { duration: 1, repeat: 1.5 }),
    ).toThrow(RangeError);
    expect(() =>
      Tween.to({ x: 1 }, { x: 2 }, { duration: 1, easing: 'nope' as never }),
    ).toThrow(RangeError);
    const target = { x: 0, destroyed: false };
    const tween = Tween.to(target, { x: 1 }, { duration: 1 }).play();
    target.destroyed = true;
    expect(tween.update(0.5)).toBe(false);
    expect(target.x).toBe(0);
  });

  it('completes instantly for zero duration', () => {
    const target = { x: 0 };
    const done = vi.fn();
    const tween = Tween.to(
      target,
      { x: 5 },
      { duration: 0, onComplete: done },
    ).play();
    tween.update(0);
    expect(target.x).toBe(5);
    expect(done).toHaveBeenCalledTimes(1);
  });
});

describe('Timeline', () => {
  it('overlaps items by label, fires callbacks on forward crossings and nests', () => {
    const a = { x: 0 };
    const b = { y: 0 };
    const log: string[] = [];
    const inner = new Timeline().add(Tween.to(b, { y: 10 }, { duration: 1 }));
    const timeline = new Timeline({ onComplete: () => log.push('done') })
      .label('start', 0)
      .add(Tween.to(a, { x: 10 }, { duration: 2 }), 'start')
      .add(inner, 'start', 1)
      .call(() => log.push('half'), 1)
      .call(() => log.push('zero'), 0)
      .call(() => log.push('end'));
    expect(timeline.duration).toBe(2);
    timeline.play();
    timeline.update(0.5);
    expect(log).toEqual(['zero']);
    timeline.update(0.75);
    expect(log).toEqual(['zero', 'half']);
    expect(a.x).toBeCloseTo(6.25);
    expect(b.y).toBeCloseTo(2.5);
    timeline.seek(1.9);
    expect(log).toEqual(['zero', 'half']);
    timeline.update(1);
    expect(log).toEqual(['zero', 'half', 'end', 'done']);
    expect(a.x).toBe(10);
    expect(b.y).toBe(10);
    expect(timeline.playing).toBe(false);
  });

  it('repeats the whole span, running callbacks each pass, and honors timeScale and reset', () => {
    const target = { x: 0 };
    const calls = vi.fn();
    const timeline = new Timeline({ repeat: 1 })
      .add(Tween.to(target, { x: 4 }, { duration: 1 }))
      .call(calls, 1);
    timeline.timeScale = 2;
    timeline.play();
    timeline.update(0.25);
    expect(calls).toHaveBeenCalledTimes(0);
    expect(target.x).toBeCloseTo(2);
    timeline.update(0.5);
    // Clock 1.5 is halfway through the second pass; the first pass's callback has run.
    expect(calls).toHaveBeenCalledTimes(1);
    expect(target.x).toBeCloseTo(2);
    timeline.update(1);
    expect(calls).toHaveBeenCalledTimes(2);
    expect(timeline.completed).toBe(true);
    timeline.stop();
    expect(target.x).toBe(0);
    expect(timeline.time).toBe(0);
  });

  it('rejects unknown labels, negative times and endless children', () => {
    const timeline = new Timeline();
    expect(() =>
      timeline.add(Tween.to({ x: 0 }, { x: 1 }, { duration: 1 }), 'missing'),
    ).toThrow(RangeError);
    expect(() =>
      timeline.add(Tween.to({ x: 0 }, { x: 1 }, { duration: 1 }), -1),
    ).toThrow(RangeError);
    expect(() =>
      timeline.add(
        Tween.to({ x: 0 }, { x: 1 }, { duration: 1, repeat: Infinity }),
      ),
    ).toThrow(RangeError);
    expect(() => new Timeline({ repeat: -1 })).toThrow(RangeError);
  });
});

describe('TweenGroup', () => {
  it('starts, advances and drops finished items, and clears without finishing', () => {
    const group = new TweenGroup();
    const target = { x: 0 };
    const other = { x: 0 };
    group.to(target, { x: 10 }, { duration: 1 });
    group.to(other, { x: 10 }, { duration: 4 });
    expect(group.size).toBe(2);
    group.update(1);
    expect(group.size).toBe(1);
    expect(target.x).toBe(10);
    expect(other.x).toBeCloseTo(2.5);
    group.clear();
    group.update(1);
    expect(other.x).toBeCloseTo(2.5);
    group.destroy();
    expect(() => group.to(target, { x: 1 }, { duration: 1 })).toThrow();
  });
});
