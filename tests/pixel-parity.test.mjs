import { describe, expect, it } from 'vitest';
import { comparePixels, comparatorSelfTest } from '../scripts/pixel-parity.mjs';
describe('cross-backend pixel comparator', () => {
  it('computes per-channel mean and nearest-rank p99 without alignment', () => {
    const a = new Uint8Array(400);
    const b = new Uint8Array(400);
    b[0] = 255;
    b[4] = 3;
    expect(comparePixels(a, b, 10, 10).channels[0]).toEqual({
      mean: 2.58,
      p99: 3,
    });
    expect(comparePixels(a, b, 10, 10).pass).toBe(false);
  });
  it('rejects deliberately vertically flipped and wrong-colour renders', () => {
    const image = [
      10, 20, 30, 255, 40, 50, 60, 255, 180, 150, 100, 255, 250, 120, 90, 255,
    ];
    const selfTest = comparatorSelfTest(image, 2, 2);
    expect(selfTest.flip.pass).toBe(false);
    expect(selfTest.colour.pass).toBe(false);
    expect(comparePixels(image, image, 2, 2).pass).toBe(true);
    expect(() => comparePixels(image, image, 3, 2)).toThrow(RangeError);
  });
});
