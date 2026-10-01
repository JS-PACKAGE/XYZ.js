import { describe, expect, it } from 'vitest';
import {
  GestureRecognizer,
  type GestureDetail,
  type GestureType,
} from '../packages/input/src/gestures.js';
import type { PointerSample } from '../packages/input/src/index.js';
import { Vector2 } from '../packages/math/src/index.js';

function harness(thresholds = {}) {
  let time = 0;
  const recognizer = new GestureRecognizer({ now: () => time, thresholds });
  const events: GestureDetail[] = [];
  const types: GestureType[] = [
    'tap',
    'doubletap',
    'longpress',
    'swipe',
    'pan',
    'pinch',
    'rotate',
  ];
  for (const type of types)
    recognizer.on(type, (detail) => events.push(detail));
  let sequence = 0;
  const send = (
    kind: PointerSample['kind'],
    id: number,
    x: number,
    y: number,
    type = 'touch',
  ): void => {
    recognizer.feed({
      id,
      type,
      kind,
      position: new Vector2(x, y),
      button: 0,
      buttons: kind === 'up' ? 0 : 1,
      sequence: ++sequence,
    });
  };
  return {
    recognizer,
    events,
    send,
    advance: (ms: number) => (time += ms),
    summary: () => events.map((e) => `${e.type}:${e.phase}`),
  };
}

describe('GestureRecognizer', () => {
  it('reports a tap, then a double tap on the second tap, and neither for a late or distant one', () => {
    const h = harness();
    h.send('down', 1, 100, 100);
    h.advance(80);
    h.send('up', 1, 101, 100);
    expect(h.summary()).toEqual(['tap:end']);
    h.advance(150);
    h.send('down', 1, 110, 105);
    h.advance(60);
    h.send('up', 1, 110, 105);
    expect(h.summary()).toEqual(['tap:end', 'tap:end', 'doubletap:end']);

    const late = harness();
    late.send('down', 1, 0, 0);
    late.send('up', 1, 0, 0);
    late.advance(400);
    late.send('down', 1, 0, 0);
    late.send('up', 1, 0, 0);
    expect(late.summary()).toEqual(['tap:end', 'tap:end']);

    const far = harness();
    far.send('down', 1, 0, 0);
    far.send('up', 1, 0, 0);
    far.advance(100);
    far.send('down', 1, 200, 0);
    far.send('up', 1, 200, 0);
    expect(far.summary()).toEqual(['tap:end', 'tap:end']);
  });

  it('does not tap after the pointer moved too far or was held too long', () => {
    const h = harness();
    h.send('down', 1, 0, 0);
    h.send('move', 1, 15, 0);
    h.advance(50);
    h.send('up', 1, 15, 0);
    expect(h.summary()).not.toContain('tap:end');
    const held = harness();
    held.send('down', 1, 0, 0);
    held.advance(400);
    held.send('up', 1, 0, 0);
    expect(held.summary()).toEqual([]);
  });

  it('fires one long press from update() and suppresses the tap on release', () => {
    const h = harness();
    h.send('down', 1, 50, 60);
    h.advance(400);
    h.recognizer.update();
    expect(h.summary()).toEqual([]);
    h.advance(150);
    h.recognizer.update();
    h.recognizer.update();
    expect(h.summary()).toEqual(['longpress:end']);
    expect(h.events[0]!.center).toEqual({ x: 50, y: 60 });
    h.send('up', 1, 50, 60);
    expect(h.summary()).toEqual(['longpress:end']);
    // Moving cancels the pending long press.
    const moved = harness();
    moved.send('down', 1, 0, 0);
    moved.send('move', 1, 30, 0);
    moved.advance(900);
    moved.recognizer.update();
    expect(moved.summary()).not.toContain('longpress:end');
  });

  it('runs pan start/change/end with translation and classifies a fast release as a swipe', () => {
    const h = harness();
    h.send('down', 1, 100, 100);
    h.advance(16);
    h.send('move', 1, 104, 100);
    expect(h.summary()).toEqual([]);
    h.advance(16);
    h.send('move', 1, 140, 100);
    h.advance(16);
    h.send('move', 1, 200, 102);
    h.advance(16);
    h.send('up', 1, 200, 102);
    expect(h.summary()).toEqual([
      'pan:start',
      'pan:change',
      'pan:end',
      'swipe:end',
    ]);
    const swipe = h.events.at(-1)!;
    expect(swipe.direction).toBe('right');
    expect(swipe.translation).toEqual({ x: 100, y: 2 });
    expect(swipe.velocity.x).toBeGreaterThan(300);
    expect(h.events[2]!.translation).toEqual({ x: 100, y: 2 });
  });

  it('does not swipe when the drag is slow, short or reversed in speed', () => {
    const slow = harness();
    slow.send('down', 1, 0, 0);
    for (let i = 1; i <= 10; i++) {
      slow.advance(200);
      slow.send('move', 1, i * 10, 0);
    }
    slow.send('up', 1, 100, 0);
    expect(slow.summary()).not.toContain('swipe:end');
    const vertical = harness();
    vertical.send('down', 1, 0, 100);
    vertical.advance(30);
    vertical.send('move', 1, 2, 60);
    vertical.advance(30);
    vertical.send('move', 1, 2, 20);
    vertical.send('up', 1, 2, 20);
    expect(vertical.events.at(-1)).toMatchObject({
      type: 'swipe',
      direction: 'up',
    });
  });

  it('pinches and rotates with two pointers and ends when one lifts, without tapping', () => {
    const h = harness();
    h.send('down', 1, 100, 100);
    h.send('down', 2, 200, 100);
    h.advance(16);
    h.send('move', 2, 250, 100);
    expect(h.summary()).toEqual(['pinch:start']);
    expect(h.events[0]!.scale).toBeCloseTo(1.5);
    expect(h.events[0]!.center).toEqual({ x: 175, y: 100 });
    h.send('move', 2, 150, 200);
    expect(h.summary()).toContain('rotate:start');
    const rotate = h.events.find((e) => e.type === 'rotate')!;
    // From pointing along +x to pointing along (+50, +100): atan2(100, 50) ≈ 1.107 rad.
    expect(rotate.rotation).toBeCloseTo(Math.atan2(100, 50));
    expect(rotate.pointerIds).toEqual([1, 2]);
    h.send('up', 2, 150, 200);
    expect(h.summary().slice(-2)).toEqual(['pinch:end', 'rotate:end']);
    h.advance(10);
    h.send('up', 1, 100, 100);
    expect(h.summary()).not.toContain('tap:end');
    expect(h.summary()).not.toContain('swipe:end');
  });

  it('unwraps rotation across the ±π boundary instead of jumping by 2π', () => {
    const h = harness();
    h.send('down', 1, 100, 100);
    h.send('down', 2, 0, 100);
    // Pointer 2 starts at angle π and sweeps through to -π+0.5.
    h.send('move', 2, 0, 130);
    h.send('move', 2, 0, 70);
    const last = h.events.filter((e) => e.type === 'rotate').at(-1)!;
    // Net change: -0.291 rad, then +0.583 rad across the boundary.
    expect(last.rotation).toBeCloseTo(0.2915, 2);
  });

  it('cancels active gestures on pointercancel and on reset, and ignores extra or hover pointers', () => {
    const h = harness();
    h.send('down', 1, 0, 0);
    h.send('move', 1, 40, 0);
    h.send('cancel', 1, 40, 0);
    expect(h.summary()).toEqual(['pan:start', 'pan:cancel']);
    h.send('move', 9, 5, 5, 'mouse');
    h.send('down', 3, 0, 0);
    h.send('down', 4, 100, 0);
    h.send('down', 5, 50, 50);
    h.advance(16);
    h.send('move', 4, 160, 0);
    h.recognizer.reset();
    expect(h.summary().slice(-2)).toEqual(['pinch:start', 'pinch:cancel']);
    h.send('up', 3, 0, 0);
    expect(h.summary().at(-1)).toBe('pinch:cancel');
  });

  it('uses only the primary mouse button and honors custom thresholds and disposal', () => {
    const h = harness({ tapMaxMs: 50 });
    h.recognizer.feed({
      id: 1,
      type: 'mouse',
      kind: 'down',
      position: new Vector2(),
      button: 2,
      buttons: 2,
      sequence: 1,
    });
    h.recognizer.feed({
      id: 1,
      type: 'mouse',
      kind: 'up',
      position: new Vector2(),
      button: 2,
      buttons: 0,
      sequence: 2,
    });
    expect(h.summary()).toEqual([]);
    h.send('down', 1, 0, 0, 'mouse');
    h.advance(60);
    h.send('up', 1, 0, 0, 'mouse');
    expect(h.summary()).toEqual([]);
    expect(
      () => new GestureRecognizer({ thresholds: { tapSlop: -1 } }),
    ).toThrow(RangeError);
    h.recognizer.destroy();
    h.send('down', 2, 0, 0);
    h.send('up', 2, 0, 0);
    expect(h.summary()).toEqual([]);
  });

  it('unsubscribes through the function returned by on()', () => {
    const h = harness();
    const seen: string[] = [];
    const off = h.recognizer.on('tap', () => seen.push('tap'));
    h.send('down', 1, 0, 0);
    h.send('up', 1, 0, 0);
    off();
    h.advance(1000);
    h.send('down', 1, 0, 0);
    h.send('up', 1, 0, 0);
    expect(seen).toEqual(['tap']);
  });
});
