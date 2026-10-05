import { utilityDefaults } from '../../../src/data/utilities.js';

export interface ObjectPoolOptions<T extends object> {
  readonly capacity?: number;
  readonly create: () => T;
  /** Called before a released object is made available again. */
  readonly reset?: (value: T) => void;
  /** Called once on eviction or pool destruction, including borrowed objects. */
  readonly destroy?: (value: T) => void;
}

export class ObjectPoolExhaustedError extends Error {
  constructor() {
    super('Object pool capacity exhausted.');
    this.name = 'ObjectPoolExhaustedError';
  }
}

/** Lazy bounded pool. Callbacks may inspect the pool, but cannot mutate it reentrantly. */
export class ObjectPool<T extends object> {
  readonly capacity: number;
  private readonly owned = new Set<T>();
  private readonly borrowed = new Set<T>();
  private readonly available: T[] = [];
  private busy = false;
  private disposed = false;

  constructor(private readonly options: ObjectPoolOptions<T>) {
    this.capacity = options.capacity ?? utilityDefaults.poolCapacity;
    if (!Number.isSafeInteger(this.capacity) || this.capacity < 0)
      throw new RangeError('Pool capacity must be a nonnegative safe integer.');
  }

  get size(): number {
    return this.owned.size;
  }
  get borrowedCount(): number {
    return this.borrowed.size;
  }
  get availableCount(): number {
    return this.available.length;
  }
  get destroyed(): boolean {
    return this.disposed;
  }

  /** Throws on exhaustion; create failures leave the pool unchanged. */
  borrow(): T {
    this.assertMutable();
    let value = this.available.pop();
    if (value === undefined) {
      if (this.owned.size >= this.capacity)
        throw new ObjectPoolExhaustedError();
      this.busy = true;
      try {
        value = this.options.create();
        if (
          (typeof value !== 'object' && typeof value !== 'function') ||
          value === null
        )
          throw new TypeError('Pool factory must create an object.');
        if (this.owned.has(value))
          throw new Error('Pool factory returned an already owned object.');
        this.owned.add(value);
      } finally {
        this.busy = false;
      }
    }
    this.borrowed.add(value);
    return value;
  }

  /** Foreign or double releases throw. Failed reset evicts the object permanently. */
  release(value: T): void {
    this.assertMutable();
    if (!this.borrowed.delete(value))
      throw new Error('Object is not borrowed from this pool.');
    this.busy = true;
    try {
      try {
        this.options.reset?.(value);
      } catch (error) {
        this.owned.delete(value);
        try {
          this.options.destroy?.(value);
        } catch (destroyError) {
          throw new AggregateError(
            [error, destroyError],
            'Pool reset and eviction failed.',
            { cause: destroyError },
          );
        }
        throw error;
      }
      this.available.push(value);
    } finally {
      this.busy = false;
    }
  }

  /** Terminal and idempotent. All owned objects are destroyed even if some callbacks throw. */
  destroy(): void {
    if (this.busy) throw new Error('Pool callbacks cannot mutate the pool.');
    if (this.disposed) return;
    this.disposed = true;
    this.borrowed.clear();
    this.available.length = 0;
    const errors: unknown[] = [];
    for (const value of this.owned) {
      try {
        this.options.destroy?.(value);
      } catch (error) {
        errors.push(error);
      }
    }
    this.owned.clear();
    if (errors.length)
      throw new AggregateError(errors, 'Pool destruction failed.');
  }

  private assertMutable(): void {
    if (this.disposed) throw new Error('Object pool is destroyed.');
    if (this.busy) throw new Error('Pool callbacks cannot mutate the pool.');
  }
}
