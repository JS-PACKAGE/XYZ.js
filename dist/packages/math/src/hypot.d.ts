/**
 * @internal Fixed-arity `Math.hypot`. V8's builtin copies its arguments into a fresh
 * array on every call; these repeat its algorithm in the same operation order (the
 * largest magnitude, ignoring NaN; Infinity wins over NaN; then a compensated sum of
 * squares scaled by that magnitude), so on V8 they return the identical double.
 */
export declare function hypot2(a: number, b: number): number;
/** @internal See {@link hypot2}. */
export declare function hypot3(a: number, b: number, c: number): number;
/** @internal See {@link hypot2}. */
export declare function hypot4(a: number, b: number, c: number, d: number): number;
