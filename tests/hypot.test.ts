import { describe, expect, it } from 'vitest';
import { hypot2, hypot3, hypot4 } from '../packages/math/src/hypot.js';

const special = [
  0,
  -0,
  NaN,
  Infinity,
  -Infinity,
  Number.MIN_VALUE,
  Number.MAX_VALUE,
  1,
  -1,
];

/** Deterministic magnitudes from 1e-300 to 1e300 plus the special values above. */
function* samples(count: number): Generator<number> {
  let state = 0x2545f491;
  for (let i = 0; i < count; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    if (state % 23 === 0) {
      yield special[state % special.length]!;
      continue;
    }
    const mantissa = state / 0x1_0000_0000 - 0.5;
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    yield mantissa * 10 ** ((state % 601) - 300);
  }
}

describe('fixed-arity hypot', () => {
  it('returns exactly what Math.hypot returns, including NaN, Infinity and signed zeros', () => {
    const values = [...samples(60000)];
    let mismatches = 0;
    for (let i = 0; i + 3 < values.length; i++) {
      const [a, b, c, d] = [
        values[i]!,
        values[i + 1]!,
        values[i + 2]!,
        values[i + 3]!,
      ];
      if (!Object.is(hypot2(a, b), Math.hypot(a, b))) mismatches++;
      if (!Object.is(hypot3(a, b, c), Math.hypot(a, b, c))) mismatches++;
      if (!Object.is(hypot4(a, b, c, d), Math.hypot(a, b, c, d))) mismatches++;
    }
    expect(mismatches).toBe(0);
    for (const a of special)
      for (const b of special) {
        expect(hypot2(a, b)).toBe(Math.hypot(a, b));
        expect(hypot3(a, b, a)).toBe(Math.hypot(a, b, a));
        expect(hypot4(b, a, b, a)).toBe(Math.hypot(b, a, b, a));
      }
  });
});
