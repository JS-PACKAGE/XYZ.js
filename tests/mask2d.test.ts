import { describe, expect, it } from 'vitest';
import { Mask2D } from '../packages/core/src/rendering2d/mask2d.js';
import { Vector2 } from '../packages/math/src/index.js';

describe('Mask2D affine queries', () => {
  it('transforms rectangle bounds and picking with inverse masks', () => {
    for (const inverse of [false, true]) {
      const mask = Mask2D.rectangle(
        { x: 0, y: 0, width: 8, height: 4 },
        { transform: [0, 2, -3, 0, 10, 20], inverse },
      );
      const out = { x: 0, y: 0, width: 0, height: 0 };
      expect(mask.getBounds(out)).toBe(out);
      expect(out).toEqual({ x: -2, y: 20, width: 12, height: 16 });
      for (const [x, y] of [
        [4, 28],
        [10, 20],
        [-2, 36],
      ])
        expect(mask.containsPoint(new Vector2(x, y))).toBe(!inverse);
      expect(mask.containsPoint(new Vector2(11, 28))).toBe(inverse);
    }
  });
});
