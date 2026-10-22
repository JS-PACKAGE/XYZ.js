import type { Geometry } from './geometry.js';
import { hypot3 } from '../../math/src/hypot.js';

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
  /** Per-target tangent xyz deltas. Handedness remains on the base tangent. */
  tangents?: ReadonlyArray<ArrayLike<number> | undefined>;
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
  private readonly tangents: (Float32Array | undefined)[];
  private base?: Float32Array;
  private baseTangents?: Float32Array;
  private tangentOutput?: Float32Array;
  private applied = -1;
  /**
   * Per stream (positions, normals, tangents) and target, the vertices whose delta is not
   * zero, so accumulation skips the rest; undefined where the delta is absent or dense.
   * Empty while `sparse` is false. See accumulate for when skipping is exact.
   */
  private readonly touched: (Uint32Array | undefined)[][] = [[], [], []];
  private sparse = false;

  constructor(data: MorphTargetData) {
    const count = data.weights.count;
    if (
      !count ||
      data.positions.length !== count ||
      (data.normals && data.normals.length !== count) ||
      (data.tangents && data.tangents.length !== count)
    )
      throw new RangeError(
        'Morph weights must match a non-empty set of targets.',
      );
    this.weights = data.weights;
    this.positions = data.positions.map((delta) => copyDelta(delta));
    this.normals = Array.from({ length: count }, (_, i) =>
      copyDelta(data.normals?.[i]),
    );
    this.tangents = Array.from({ length: count }, (_, i) =>
      copyDelta(data.tangents?.[i]),
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
    for (let channel = 0; channel < 3; channel++) {
      const deltas =
        channel === 0
          ? this.positions
          : channel === 1
            ? this.normals
            : this.tangents;
      for (const delta of deltas)
        if (delta && delta.length !== count * 3)
          throw new RangeError('Morph delta length must be vertexCount * 3.');
    }
    claimed.add(geometry);
    this.base = geometry.vertices.slice();
    this.baseTangents = geometry.tangents.slice();
    this.tangentOutput = geometry.tangents;
    // Adding a zero delta changes a value only when it is -0 (-0 + 0 is +0); bases holding
    // -0 therefore always accumulate densely, and accumulate checks for any later -0.
    if (
      !hasNegativeZero(this.base, 8, 6) &&
      !hasNegativeZero(this.baseTangents, 4, 3)
    )
      for (let channel = 0; channel < 3; channel++) {
        const deltas =
          channel === 0
            ? this.positions
            : channel === 1
              ? this.normals
              : this.tangents;
        for (let t = 0; t < deltas.length; t++) {
          const list = nonzeroVertices(deltas[t], count);
          this.touched[channel]![t] = list;
          if (list) this.sparse = true;
        }
      }
  }

  /** @internal Retargets writes to the native skin bind stream without copying it per update. */
  setTangentOutput(output: Float32Array): void {
    if (!this.baseTangents || output.length !== this.baseTangents.length)
      throw new RangeError(
        'Morph tangent output must match the bound Geometry.',
      );
    this.tangentOutput = output;
  }

  /**
   * @internal Rewrites position, normal and tangent from their captured bases when
   * weights changed. The tangent stream keeps its original handedness. Returns
   * whether either stream changed.
   */
  apply(out: Float32Array): boolean {
    const base = this.base;
    const baseTangents = this.baseTangents;
    const tangents = this.tangentOutput;
    if (!base || !baseTangents || this.applied === this.weights.version)
      return false;
    this.applied = this.weights.version;
    const weights = this.weights.values;
    const vertexCount = base.length / 8;
    copyBase(base, baseTangents, out, tangents, vertexCount);
    let moved = this.accumulate(
      out,
      tangents,
      weights,
      vertexCount,
      this.sparse,
    );
    if (moved & NEGATIVE_ZERO) {
      // A -0 appeared, which a skipped zero delta would have turned into +0: redo densely.
      copyBase(base, baseTangents, out, tangents, vertexCount);
      moved = this.accumulate(out, tangents, weights, vertexCount, false);
    }
    const normalsMoved = (moved & NORMALS_MOVED) !== 0,
      tangentsMoved = (moved & TANGENTS_MOVED) !== 0;
    if (normalsMoved)
      for (let v = 0; v < vertexCount; v++) {
        const o = v * 8 + 3;
        const length = hypot3(out[o], out[o + 1], out[o + 2]);
        // A fully cancelled normal falls back to the base direction instead of NaN.
        if (length > 1e-8) {
          out[o] /= length;
          out[o + 1] /= length;
          out[o + 2] /= length;
        } else for (let j = 0; j < 3; j++) out[o + j] = base[o + j];
      }
    if ((tangentsMoved || normalsMoved) && tangents)
      for (let v = 0; v < vertexCount; v++) {
        const o = v * 4;
        const normalLength = hypot3(
          out[v * 8 + 3],
          out[v * 8 + 4],
          out[v * 8 + 5],
        );
        const nx = normalLength > 0 ? out[v * 8 + 3] / normalLength : 0;
        const ny = normalLength > 0 ? out[v * 8 + 4] / normalLength : 0;
        const nz = normalLength > 0 ? out[v * 8 + 5] / normalLength : 1;
        const projection =
          tangents[o] * nx + tangents[o + 1] * ny + tangents[o + 2] * nz;
        const tx = tangents[o] - nx * projection;
        const ty = tangents[o + 1] - ny * projection;
        const tz = tangents[o + 2] - nz * projection;
        const length = hypot3(tx, ty, tz);
        if (length > 1e-8) {
          tangents[o] = tx / length;
          tangents[o + 1] = ty / length;
          tangents[o + 2] = tz / length;
        } else {
          const fx = Math.abs(nx) < 0.9 ? 0 : nz;
          const fy = Math.abs(nx) < 0.9 ? -nz : 0;
          const fz = Math.abs(nx) < 0.9 ? ny : -nx;
          const fallbackLength = hypot3(fx, fy, fz);
          tangents[o] = fx / fallbackLength;
          tangents[o + 1] = fy / fallbackLength;
          tangents[o + 2] = fz / fallbackLength;
        }
      }
    return true;
  }

  /**
   * Adds every weighted delta in target order. `sparse` walks only the touched vertices of
   * listed deltas: skipping a zero delta matches adding it unless the value is -0, so the
   * sparse pass reports any -0 it stores and the caller redoes the work densely.
   */
  private accumulate(
    out: Float32Array,
    tangents: Float32Array | undefined,
    weights: Readonly<Float32Array>,
    vertexCount: number,
    sparse: boolean,
  ): number {
    let flags = 0;
    const touched = this.touched;
    for (let t = 0; t < weights.length; t++) {
      const weight = weights[t]!;
      if (weight === 0) continue;
      const p = this.positions[t],
        n = this.normals[t],
        tangent = this.tangents[t];
      // Dense morphs keep the literal-stride loops, which V8 compiles tighter than addDelta.
      if (p) {
        if (sparse)
          flags |= addDelta(out, 8, 0, weight, p, touched[0]![t], vertexCount);
        else
          for (let v = 0; v < vertexCount; v++) {
            const o = v * 8,
              d = v * 3;
            out[o] += weight * p[d]!;
            out[o + 1] += weight * p[d + 1]!;
            out[o + 2] += weight * p[d + 2]!;
          }
      }
      if (n) {
        flags |= NORMALS_MOVED;
        if (sparse)
          flags |= addDelta(out, 8, 3, weight, n, touched[1]![t], vertexCount);
        else
          for (let v = 0; v < vertexCount; v++) {
            const o = v * 8 + 3,
              d = v * 3;
            out[o] += weight * n[d]!;
            out[o + 1] += weight * n[d + 1]!;
            out[o + 2] += weight * n[d + 2]!;
          }
      }
      if (tangent && tangents) {
        flags |= TANGENTS_MOVED;
        if (sparse)
          flags |= addDelta(
            tangents,
            4,
            0,
            weight,
            tangent,
            touched[2]![t],
            vertexCount,
          );
        else
          for (let v = 0; v < vertexCount; v++) {
            const o = v * 4,
              d = v * 3;
            tangents[o] += weight * tangent[d]!;
            tangents[o + 1] += weight * tangent[d + 1]!;
            tangents[o + 2] += weight * tangent[d + 2]!;
          }
      }
    }
    return flags;
  }
}

/**
 * Sparse-mode accumulation: adds `weight * delta` to the xyz at `first` of each
 * `stride`-sized record, the listed vertices or (unlisted delta) all of them, and reports
 * NEGATIVE_ZERO when any stored value is -0.
 */
function addDelta(
  target: Float32Array,
  stride: number,
  first: number,
  weight: number,
  delta: Float32Array,
  list: Uint32Array | undefined,
  vertexCount: number,
): number {
  let flags = 0;
  const count = list ? list.length : vertexCount;
  for (let k = 0; k < count; k++) {
    const v = list ? list[k]! : k,
      o = v * stride + first,
      d = v * 3;
    target[o] += weight * delta[d]!;
    target[o + 1] += weight * delta[d + 1]!;
    target[o + 2] += weight * delta[d + 2]!;
    if (
      isNegativeZero(target[o]!) ||
      isNegativeZero(target[o + 1]!) ||
      isNegativeZero(target[o + 2]!)
    )
      flags = NEGATIVE_ZERO;
  }
  return flags;
}

const NORMALS_MOVED = 1,
  TANGENTS_MOVED = 2,
  NEGATIVE_ZERO = 4;
/** Deltas touching more of the vertices than this accumulate densely. */
const sparseShare = 0.5;

function isNegativeZero(value: number): boolean {
  return value === 0 && 1 / value < 0;
}

/** Whether any of the first `components` values of a `stride`-sized record is -0. */
function hasNegativeZero(
  values: Float32Array,
  stride: number,
  components: number,
): boolean {
  for (let o = 0; o < values.length; o += stride)
    for (let j = 0; j < components; j++)
      if (isNegativeZero(values[o + j]!)) return true;
  return false;
}

/** Vertices whose xyz delta is not all zero; undefined for absent or mostly nonzero deltas. */
function nonzeroVertices(
  delta: Float32Array | undefined,
  vertexCount: number,
): Uint32Array | undefined {
  if (!delta) return undefined;
  let count = 0;
  for (let v = 0; v < vertexCount; v++)
    if (delta[v * 3] !== 0 || delta[v * 3 + 1] !== 0 || delta[v * 3 + 2] !== 0)
      count++;
  if (count > vertexCount * sparseShare) return undefined;
  const list = new Uint32Array(count);
  for (let v = 0, k = 0; v < vertexCount; v++)
    if (delta[v * 3] !== 0 || delta[v * 3 + 1] !== 0 || delta[v * 3 + 2] !== 0)
      list[k++] = v;
  return list;
}

/** Resets positions, normals and tangents (handedness included) to the captured base. */
function copyBase(
  base: Float32Array,
  baseTangents: Float32Array,
  out: Float32Array,
  tangents: Float32Array | undefined,
  vertexCount: number,
): void {
  for (let v = 0; v < vertexCount; v++) {
    const o = v * 8;
    for (let j = 0; j < 6; j++) out[o + j] = base[o + j]!;
    if (tangents) {
      const offset = v * 4;
      for (let j = 0; j < 4; j++)
        tangents[offset + j] = baseTangents[offset + j]!;
    }
  }
}

function copyDelta(
  delta: ArrayLike<number> | undefined,
): Float32Array | undefined {
  if (!delta) return undefined;
  const copy = Float32Array.from(delta);
  for (let i = 0; i < copy.length; i++)
    if (!Number.isFinite(copy[i]))
      throw new RangeError('Morph deltas must be finite.');
  return copy;
}
