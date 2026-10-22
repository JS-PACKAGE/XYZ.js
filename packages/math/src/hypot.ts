/**
 * @internal Fixed-arity `Math.hypot`. V8's builtin copies its arguments into a fresh
 * array on every call; these repeat its algorithm in the same operation order (the
 * largest magnitude, ignoring NaN; Infinity wins over NaN; then a compensated sum of
 * squares scaled by that magnitude), so on V8 they return the identical double.
 */
/**
 * NaN read from an object, not the global `NaN` or `Number.NaN`: in Chrome, returning the
 * global made every non-inlined call of these allocate (the sampling heap profiler showed
 * about 200 bytes per hypot2 call from a physics refresh), and the minifier folds
 * `Number.NaN` back into the global. The value is the same NaN either way.
 */
const special = { nan: Number.NaN };
export function hypot2(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  let max = 0;
  if (a > max) max = a;
  if (b > max) max = b;
  if (max === Infinity) return Infinity;
  if (a !== a || b !== b) return special.nan;
  if (max === 0) return 0;
  let sum = 0,
    compensation = 0,
    n: number,
    summand: number;
  n = a / max;
  summand = n * n - compensation;
  const next = sum + summand;
  compensation = next - sum - summand;
  sum = next;
  n = b / max;
  summand = n * n - compensation;
  sum += summand;
  return Math.sqrt(sum) * max;
}

/** @internal See {@link hypot2}. */
export function hypot3(a: number, b: number, c: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  c = Math.abs(c);
  let max = 0;
  if (a > max) max = a;
  if (b > max) max = b;
  if (c > max) max = c;
  if (max === Infinity) return Infinity;
  if (a !== a || b !== b || c !== c) return special.nan;
  if (max === 0) return 0;
  let sum = 0,
    compensation = 0,
    n: number,
    summand: number,
    next: number;
  n = a / max;
  summand = n * n - compensation;
  next = sum + summand;
  compensation = next - sum - summand;
  sum = next;
  n = b / max;
  summand = n * n - compensation;
  next = sum + summand;
  compensation = next - sum - summand;
  sum = next;
  n = c / max;
  summand = n * n - compensation;
  sum += summand;
  return Math.sqrt(sum) * max;
}

/** @internal See {@link hypot2}. */
export function hypot4(a: number, b: number, c: number, d: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  c = Math.abs(c);
  d = Math.abs(d);
  let max = 0;
  if (a > max) max = a;
  if (b > max) max = b;
  if (c > max) max = c;
  if (d > max) max = d;
  if (max === Infinity) return Infinity;
  if (a !== a || b !== b || c !== c || d !== d) return special.nan;
  if (max === 0) return 0;
  let sum = 0,
    compensation = 0,
    n: number,
    summand: number,
    next: number;
  n = a / max;
  summand = n * n - compensation;
  next = sum + summand;
  compensation = next - sum - summand;
  sum = next;
  n = b / max;
  summand = n * n - compensation;
  next = sum + summand;
  compensation = next - sum - summand;
  sum = next;
  n = c / max;
  summand = n * n - compensation;
  next = sum + summand;
  compensation = next - sum - summand;
  sum = next;
  n = d / max;
  summand = n * n - compensation;
  sum += summand;
  return Math.sqrt(sum) * max;
}
