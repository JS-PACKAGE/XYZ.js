import type { Geometry } from './geometry.js';

/**
 * Morph target weights. One instance is shared by every primitive of a glTF mesh node,
 * so animating it deforms all of them; `version` advances only when a value changes.
 */
export class MorphWeights {
  private readonly data: Float32Array;
  version = 0;

  constructor(initial: ArrayLike<number>) {
    this.data = new Float32Array(initial.length);
    for (let i = 0; i < initial.length; i++) {
      if (!Number.isFinite(initial[i]))
        throw new RangeError('Morph weights must be finite.');
      this.data[i] = initial[i];
    }
  }

  get count(): number {
    return this.data.length;
  }

  get(index: number): number {
    this.check(index);
    return this.data[index];
  }

  set(index: number, value: number): void {
    this.check(index);
    if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
      throw new RangeError('Morph weight must be finite and fit in Float32.');
    const stored = Math.fround(value);
    if (this.data[index] === stored) return;
    this.data[index] = stored;
    this.version++;
  }

  /** @internal Read-only view for the deformation loop. */
  get values(): Readonly<Float32Array> {
    return this.data;
  }

  private check(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.data.length)
      throw new RangeError('Morph weight index is out of range.');
  }
}

export interface MorphTargetData {
  /** Per-target xyz deltas, length vertexCount * 3. Omitted entries are zero. */
  positions: ReadonlyArray<ArrayLike<number> | undefined>;
  /** Per-target normal deltas. Omitted entries leave the base normal unchanged. */
  normals?: ReadonlyArray<ArrayLike<number> | undefined>;
  weights: MorphWeights;
}

const claimed = new WeakSet<Geometry>();

/**
 * Additive morph targets for one Geometry: `position = base + sum(weight_i * delta_i)`.
 * A Mesh takes ownership of the geometry it morphs, so a Geometry can be claimed once.
 */
export class MorphTargets {
  readonly weights: MorphWeights;
  private readonly positions: (Float32Array | undefined)[];
  private readonly normals: (Float32Array | undefined)[];
  private base?: Float32Array;
  private applied = -1;

  constructor(data: MorphTargetData) {
    const count = data.weights.count;
    if (
      !count ||
      data.positions.length !== count ||
      (data.normals && data.normals.length !== count)
    )
      throw new RangeError(
        'Morph weights must match a non-empty set of targets.',
      );
    this.weights = data.weights;
    this.positions = data.positions.map((delta) => copyDelta(delta));
    this.normals = Array.from({ length: count }, (_, i) =>
      copyDelta(data.normals?.[i]),
    );
  }

  get targetCount(): number {
    return this.weights.count;
  }

  /** @internal Captures the undeformed vertices; called once by the owning Mesh. */
  bind(geometry: Geometry): void {
    const count = geometry.vertices.length / 8;
    if (this.base) throw new Error('MorphTargets are already bound to a Mesh.');
    if (claimed.has(geometry))
      throw new Error('Geometry is already deformed by another Mesh.');
    for (const delta of [...this.positions, ...this.normals])
      if (delta && delta.length !== count * 3)
        throw new RangeError('Morph delta length must be vertexCount * 3.');
    claimed.add(geometry);
    this.base = geometry.vertices.slice();
  }

  /**
   * @internal Rewrites position and normal of `out` (interleaved stride 8) from the
   * base when weights changed since the last call. Returns whether `out` changed.
   */
  apply(out: Float32Array): boolean {
    const base = this.base;
    if (!base || this.applied === this.weights.version) return false;
    this.applied = this.weights.version;
    const weights = this.weights.values;
    const vertexCount = base.length / 8;
    for (let v = 0; v < vertexCount; v++) {
      const o = v * 8;
      for (let j = 0; j < 6; j++) out[o + j] = base[o + j];
    }
    let normalsMoved = false;
    for (let t = 0; t < weights.length; t++) {
      const weight = weights[t];
      if (weight === 0) continue;
      const p = this.positions[t],
        n = this.normals[t];
      if (p)
        for (let v = 0; v < vertexCount; v++) {
          const o = v * 8,
            d = v * 3;
          out[o] += weight * p[d];
          out[o + 1] += weight * p[d + 1];
          out[o + 2] += weight * p[d + 2];
        }
      if (n) {
        normalsMoved = true;
        for (let v = 0; v < vertexCount; v++) {
          const o = v * 8 + 3,
            d = v * 3;
          out[o] += weight * n[d];
          out[o + 1] += weight * n[d + 1];
          out[o + 2] += weight * n[d + 2];
        }
      }
    }
    if (normalsMoved)
      for (let v = 0; v < vertexCount; v++) {
        const o = v * 8 + 3;
        const length = Math.hypot(out[o], out[o + 1], out[o + 2]);
        // A fully cancelled normal falls back to the base direction instead of NaN.
        if (length > 1e-8) {
          out[o] /= length;
          out[o + 1] /= length;
          out[o + 2] /= length;
        } else for (let j = 0; j < 3; j++) out[o + j] = base[o + j];
      }
    return true;
  }
}

function copyDelta(
  delta: ArrayLike<number> | undefined,
): Float32Array | undefined {
  if (!delta) return undefined;
  const copy = Float32Array.from(delta);
  for (const value of copy)
    if (!Number.isFinite(value))
      throw new RangeError('Morph deltas must be finite.');
  return copy;
}
