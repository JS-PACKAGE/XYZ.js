import { utilityDefaults } from '../../../src/data/utilities.js';

const UINT32_RANGE = 0x1_0000_0000;

/** Deterministic Mulberry32 stream. State is a portable unsigned 32-bit integer. */
export class SeededRandom {
  private current: number;

  constructor(seed: number = utilityDefaults.randomSeed) {
    this.current = SeededRandom.validateState(seed);
  }

  get state(): number {
    return this.current;
  }

  /** Restore a saved state without drawing a value. */
  restore(state: number): this {
    this.current = SeededRandom.validateState(state);
    return this;
  }

  clone(): SeededRandom {
    return new SeededRandom(this.current);
  }

  nextUint32(): number {
    this.current = (this.current + 0x6d2b79f5) >>> 0;
    let value = this.current;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  }

  /** Uniform value in [0, 1); consumes one uint32 draw. */
  next(): number {
    return this.nextUint32() / UINT32_RANGE;
  }

  /** Unbiased integer in [min, max). Width must not exceed 2^32. */
  int(min: number, max: number): number {
    const width = max - min;
    if (
      !Number.isSafeInteger(min) ||
      !Number.isSafeInteger(max) ||
      width < 1 ||
      width > UINT32_RANGE
    )
      throw new RangeError(
        'Integer bounds must be safe integers with width in [1, 2^32].',
      );
    // A singleton choice does not advance the stream. Rejection avoids modulo bias.
    if (width === 1) return min;
    const limit = UINT32_RANGE - (UINT32_RANGE % width);
    let value: number;
    do {
      value = this.nextUint32();
    } while (value >= limit);
    return min + (value % width);
  }

  /** Empty input throws without consuming randomness; singleton input consumes none. */
  choose<T>(values: readonly T[]): T {
    if (values.length === 0)
      throw new RangeError('Cannot choose from an empty collection.');
    return values[this.int(0, values.length)]!;
  }

  /** In-place Fisher–Yates shuffle; one unbiased choice per index from n-1 down to 1. */
  shuffle<T>(values: T[]): T[] {
    for (let i = values.length - 1; i > 0; i--) {
      const j = this.int(0, i + 1);
      const value = values[i]!;
      values[i] = values[j]!;
      values[j] = value;
    }
    return values;
  }

  private static validateState(state: number): number {
    if (!Number.isInteger(state) || state < 0 || state >= UINT32_RANGE)
      throw new RangeError(
        'Random seed/state must be an unsigned 32-bit integer.',
      );
    return state;
  }
}
