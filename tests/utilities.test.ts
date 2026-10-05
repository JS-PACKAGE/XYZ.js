import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../packages/core/src/seeded-random.js';
import {
  ObjectPool,
  ObjectPoolExhaustedError,
} from '../packages/core/src/object-pool.js';

describe('SeededRandom', () => {
  it('replays uint32 streams from seed, clone and restored state', () => {
    const a = new SeededRandom(0xffffffff);
    const b = new SeededRandom(0xffffffff);
    for (let i = 0; i < 100; i++) expect(a.nextUint32()).toBe(b.nextUint32());
    const state = a.state;
    const clone = a.clone();
    const draws = Array.from({ length: 20 }, () => a.next());
    expect(Array.from({ length: 20 }, () => clone.next())).toEqual(draws);
    a.restore(state);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(draws);
    for (const invalid of [-1, 0x100000000, 0.5, NaN, Infinity]) {
      expect(() => new SeededRandom(invalid)).toThrow(RangeError);
      expect(() => a.restore(invalid)).toThrow(RangeError);
    }
  });

  it('rejects the modulo tail instead of biasing integer ranges', () => {
    class Scripted extends SeededRandom {
      draws = 0;
      override nextUint32(): number {
        return [0xffffffff, 0xfffffffe, 7][this.draws++]!;
      }
    }
    const random = new Scripted();
    expect(random.int(-2, 1)).toBe(0);
    expect(random.draws).toBe(2);
    expect(random.int(0, 10)).toBe(7);
    expect(random.draws).toBe(3);
    const full = new SeededRandom(17);
    expect(full.int(0, 0x100000000)).toBe(new SeededRandom(17).nextUint32());
  });

  it('defines empty/singleton consumption and matches Fisher–Yates draws', () => {
    const random = new SeededRandom(91);
    const state = random.state;
    expect(() => random.choose([])).toThrow(RangeError);
    expect(random.choose(['only'])).toBe('only');
    expect(random.int(5, 6)).toBe(5);
    expect(random.shuffle([])).toEqual([]);
    expect(random.shuffle([4])).toEqual([4]);
    for (const bounds of [
      [2, 2],
      [3, 2],
      [0, 0x100000001],
      [0.1, 2],
    ])
      expect(() => random.int(bounds[0]!, bounds[1]!)).toThrow(RangeError);
    expect(random.state).toBe(state);
    const expected = [0, 1, 2, 3, 4];
    const reference = random.clone();
    for (let i = expected.length - 1; i > 0; i--) {
      const j = reference.int(0, i + 1);
      [expected[i], expected[j]] = [expected[j]!, expected[i]!];
    }
    const values = [0, 1, 2, 3, 4];
    expect(random.shuffle(values)).toBe(values);
    expect(values).toEqual(expected);
    expect(random.state).toBe(reference.state);
    expect([...values].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('ObjectPool', () => {
  it('bounds lazy allocation and reuses only released/reset objects', () => {
    let creates = 0;
    const pool = new ObjectPool({
      capacity: 2,
      create: () => ({ id: ++creates, value: 0 }),
      reset: (value) => {
        value.value = 0;
      },
    });
    const a = pool.borrow();
    const b = pool.borrow();
    expect(() => pool.borrow()).toThrow(ObjectPoolExhaustedError);
    a.value = 10;
    pool.release(a);
    expect(() => pool.release(a)).toThrow();
    expect(() => pool.release({ id: 9, value: 0 })).toThrow();
    expect(pool.borrow()).toBe(a);
    expect(a.value).toBe(0);
    expect(creates).toBe(2);
    expect(pool.borrowedCount).toBe(2);
    expect(pool.size).toBe(2);
    pool.release(b);
    expect(pool.availableCount).toBe(1);
    expect(() => new ObjectPool({ capacity: -1, create: () => ({}) })).toThrow(
      RangeError,
    );
    expect(() =>
      new ObjectPool({ capacity: 0, create: () => ({}) }).borrow(),
    ).toThrow(ObjectPoolExhaustedError);
  });

  it('keeps capacity available after create/reset failures and rejects duplicate factory objects', () => {
    let fail = true;
    const destroyed: object[] = [];
    const pool = new ObjectPool({
      capacity: 1,
      create: () => {
        if (fail) throw new Error('create');
        return {};
      },
      reset: () => {
        throw new Error('reset');
      },
      destroy: (value) => {
        destroyed.push(value);
      },
    });
    expect(() => pool.borrow()).toThrow('create');
    expect(pool.size).toBe(0);
    fail = false;
    const value = pool.borrow();
    expect(() => pool.release(value)).toThrow('reset');
    expect(destroyed).toEqual([value]);
    expect(pool.size).toBe(0);
    expect(pool.borrowedCount).toBe(0);
    expect(() => pool.release(value)).toThrow();
    expect(pool.borrow()).not.toBe(value);
    const singleton = {};
    const duplicate = new ObjectPool({ capacity: 2, create: () => singleton });
    duplicate.borrow();
    expect(() => duplicate.borrow()).toThrow('already owned');
    expect(duplicate.size).toBe(1);
    expect(duplicate.borrowedCount).toBe(1);
  });

  it('evicts on dual callback failure and destroys all owned objects exactly once', () => {
    const failed = new ObjectPool({
      capacity: 1,
      create: () => ({}),
      reset: () => {
        throw new Error('reset');
      },
      destroy: () => {
        throw new Error('destroy');
      },
    });
    expect(() => failed.release(failed.borrow())).toThrow(AggregateError);
    expect(failed.size).toBe(0);
    const seen: object[] = [];
    const pool = new ObjectPool({
      capacity: 2,
      create: () => ({}),
      destroy: (value) => {
        seen.push(value);
        throw new Error('destroy');
      },
    });
    const a = pool.borrow();
    const b = pool.borrow();
    pool.release(a);
    expect(() => pool.destroy()).toThrow(AggregateError);
    expect(seen).toEqual([a, b]);
    pool.destroy();
    expect(seen).toHaveLength(2);
    expect(pool.destroyed).toBe(true);
    expect(pool.size).toBe(0);
    expect(() => pool.borrow()).toThrow('destroyed');
    expect(() => pool.release(b)).toThrow('destroyed');
  });

  it('rejects callback reentrancy without corrupting ownership', () => {
    const pool: ObjectPool<object> = new ObjectPool({
      capacity: 1,
      create: () => {
        expect(() => pool.borrow()).toThrow('callbacks');
        return {};
      },
      reset: () => {
        expect(() => pool.destroy()).toThrow('callbacks');
      },
    });
    const value = pool.borrow();
    pool.release(value);
    expect(pool.borrow()).toBe(value);
  });
});
