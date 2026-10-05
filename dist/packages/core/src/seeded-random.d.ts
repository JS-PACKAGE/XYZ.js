/** Deterministic Mulberry32 stream. State is a portable unsigned 32-bit integer. */
export declare class SeededRandom {
    private current;
    constructor(seed?: number);
    get state(): number;
    /** Restore a saved state without drawing a value. */
    restore(state: number): this;
    clone(): SeededRandom;
    nextUint32(): number;
    /** Uniform value in [0, 1); consumes one uint32 draw. */
    next(): number;
    /** Unbiased integer in [min, max). Width must not exceed 2^32. */
    int(min: number, max: number): number;
    /** Empty input throws without consuming randomness; singleton input consumes none. */
    choose<T>(values: readonly T[]): T;
    /** In-place Fisher–Yates shuffle; one unbiased choice per index from n-1 down to 1. */
    shuffle<T>(values: T[]): T[];
    private static validateState;
}
