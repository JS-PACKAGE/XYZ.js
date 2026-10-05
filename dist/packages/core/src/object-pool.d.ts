export interface ObjectPoolOptions<T extends object> {
    readonly capacity?: number;
    readonly create: () => T;
    /** Called before a released object is made available again. */
    readonly reset?: (value: T) => void;
    /** Called once on eviction or pool destruction, including borrowed objects. */
    readonly destroy?: (value: T) => void;
}
export declare class ObjectPoolExhaustedError extends Error {
    constructor();
}
/** Lazy bounded pool. Callbacks may inspect the pool, but cannot mutate it reentrantly. */
export declare class ObjectPool<T extends object> {
    private readonly options;
    readonly capacity: number;
    private readonly owned;
    private readonly borrowed;
    private readonly available;
    private busy;
    private disposed;
    constructor(options: ObjectPoolOptions<T>);
    get size(): number;
    get borrowedCount(): number;
    get availableCount(): number;
    get destroyed(): boolean;
    /** Throws on exhaustion; create failures leave the pool unchanged. */
    borrow(): T;
    /** Foreign or double releases throw. Failed reset evicts the object permanently. */
    release(value: T): void;
    /** Terminal and idempotent. All owned objects are destroyed even if some callbacks throw. */
    destroy(): void;
    private assertMutable;
}
