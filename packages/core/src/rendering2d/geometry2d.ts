import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import type { Rect2D } from '../gameplay/contracts.js';

export interface Geometry2DOptions {
  positions: ArrayLike<number>;
  uvs: ArrayLike<number>;
  indices: ArrayLike<number>;
  /** Positive homogeneous UV denominator weights; ordinary geometry uses one. */
  uvQ?: ArrayLike<number>;
}

/** Caller-owned, copied geometry. Mutable arrays require explicit markUpdated(). */
export class Geometry2D {
  readonly positions: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;
  readonly uvQ: Float32Array;
  private revision = 0;

  constructor(options: Geometry2DOptions) {
    const count = options.positions.length / 2;
    if (
      !Number.isInteger(count) ||
      count < 3 ||
      count > rendering2dLimits.meshVertices ||
      options.uvs.length !== count * 2 ||
      options.indices.length < 3 ||
      options.indices.length % 3 ||
      options.indices.length > rendering2dLimits.meshIndices ||
      (options.uvQ && options.uvQ.length !== count)
    )
      throw new RangeError(
        'Geometry2D requires bounded matching vertices and complete triangles.',
      );
    // Validate before typed-array conversion, which otherwise truncates invalid indices.
    for (let i = 0; i < options.indices.length; i++) {
      const index = options.indices[i]!;
      if (!Number.isInteger(index) || index < 0 || index >= count)
        throw new RangeError('Geometry2D index is outside its vertices.');
    }
    this.positions = Float32Array.from(options.positions);
    this.uvs = Float32Array.from(options.uvs);
    this.indices = Uint32Array.from(options.indices);
    this.uvQ = options.uvQ
      ? Float32Array.from(options.uvQ)
      : new Float32Array(count).fill(1);
    this.validate();
  }

  get version(): number {
    return this.revision;
  }

  validate(): void {
    for (const value of this.positions)
      if (
        !Number.isFinite(value) ||
        Math.abs(value) > rendering2dLimits.coordinate
      )
        throw new RangeError(
          'Geometry2D positions must be bounded and finite.',
        );
    for (const value of this.uvs)
      if (!Number.isFinite(value))
        throw new RangeError('Geometry2D UVs must be finite.');
    for (const value of this.uvQ)
      if (!Number.isFinite(value) || value <= 0)
        throw new RangeError(
          'Geometry2D homogeneous weights must be positive and finite.',
        );
    for (const index of this.indices)
      if (index >= this.uvQ.length)
        throw new RangeError('Geometry2D index is outside its vertices.');
  }

  markUpdated(): void {
    this.validate();
    this.revision++;
  }

  getBounds(out: Rect2D = { x: 0, y: 0, width: 0, height: 0 }): Rect2D {
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    // Only referenced vertices contribute to the visible geometry.
    for (const index of this.indices) {
      const x = this.positions[index * 2]!,
        y = this.positions[index * 2 + 1]!;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
    out.x = left;
    out.y = top;
    out.width = right - left;
    out.height = bottom - top;
    return out;
  }

  containsPoint(x: number, y: number): boolean {
    for (let i = 0; i < this.indices.length; i += 3) {
      const a = this.indices[i]! * 2,
        b = this.indices[i + 1]! * 2,
        c = this.indices[i + 2]! * 2;
      const ax = this.positions[a]!,
        ay = this.positions[a + 1]!,
        bx = this.positions[b]!,
        by = this.positions[b + 1]!,
        cx = this.positions[c]!,
        cy = this.positions[c + 1]!;
      const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (area === 0) continue;
      const u = ((bx - x) * (cy - y) - (by - y) * (cx - x)) / area;
      const v = ((cx - x) * (ay - y) - (cy - y) * (ax - x)) / area;
      const w = 1 - u - v;
      if (u >= 0 && v >= 0 && w >= 0) return true;
    }
    return false;
  }
}
