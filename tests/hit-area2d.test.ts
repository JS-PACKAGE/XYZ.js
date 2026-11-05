import { describe, expect, it } from 'vitest';
import { HitArea2D } from '../packages/core/src/gameplay/hit-area2d.js';
import { Vector2 } from '../packages/math/src/index.js';

describe('HitArea2D polygon picking', () => {
  it('includes vertices and edges for either winding', () => {
    const points: [number, number][] = [
      [0, 0],
      [8, 0],
      [8, 8],
      [0, 8],
    ];
    for (const vertices of [points, [...points].reverse()]) {
      const area = HitArea2D.polygon(vertices);
      for (const [x, y] of [...points, [4, 0], [8, 4], [4, 8], [0, 4], [4, 4]])
        expect(area.containsPoint(new Vector2(x, y))).toBe(true);
      for (const [x, y] of [
        [-1, 4],
        [9, 4],
        [4, -1],
        [4, 9],
        [NaN, 4],
      ])
        expect(area.containsPoint(new Vector2(x, y))).toBe(false);
    }
  });

  it('preserves concave polygon crossings', () => {
    const area = HitArea2D.polygon([
      [0, 0],
      [8, 0],
      [8, 3],
      [3, 3],
      [3, 8],
      [0, 8],
    ]);
    expect(area.containsPoint(new Vector2(1, 7))).toBe(true);
    expect(area.containsPoint(new Vector2(7, 1))).toBe(true);
    expect(area.containsPoint(new Vector2(3, 5))).toBe(true);
    expect(area.containsPoint(new Vector2(5, 5))).toBe(false);
  });
});
