import type { Matrix4 } from '../../math/src/index.js';

/**
 * Six clip planes extracted from a column-major view-projection matrix whose
 * clip depth is 0..1 (the engine convention for both perspective and orthographic).
 * Reused across frames; `setFromMatrix` and the tests never allocate.
 */
export class Frustum {
  /** left, right, bottom, top, near, far as normalized (nx, ny, nz, d) quadruples. */
  private readonly planes = new Float64Array(24);

  setFromMatrix(viewProjection: Matrix4): this {
    const m = viewProjection.elements;
    const p = this.planes;
    const row = (i: number, j: number): number => m[j * 4 + i];
    const set = (
      index: number,
      a: number,
      b: number,
      c: number,
      d: number,
    ): void => {
      const length = Math.hypot(a, b, c);
      const scale = length > 0 ? 1 / length : 0;
      p[index * 4] = a * scale;
      p[index * 4 + 1] = b * scale;
      p[index * 4 + 2] = c * scale;
      p[index * 4 + 3] = d * scale;
    };
    const plane = (index: number, sign: number, i: number): void =>
      set(
        index,
        row(3, 0) + sign * row(i, 0),
        row(3, 1) + sign * row(i, 1),
        row(3, 2) + sign * row(i, 2),
        row(3, 3) + sign * row(i, 3),
      );
    plane(0, 1, 0);
    plane(1, -1, 0);
    plane(2, 1, 1);
    plane(3, -1, 1);
    set(4, row(2, 0), row(2, 1), row(2, 2), row(2, 3));
    plane(5, -1, 2);
    return this;
  }

  /** True unless the sphere lies completely outside one plane. */
  intersectsSphere(x: number, y: number, z: number, radius: number): boolean {
    const p = this.planes;
    for (let i = 0; i < 24; i += 4)
      if (p[i] * x + p[i + 1] * y + p[i + 2] * z + p[i + 3] < -radius)
        return false;
    return true;
  }

  /** Positive-vertex AABB test; invalid bounds deliberately remain visible. */
  intersectsBox(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
  ): boolean {
    if (!Number.isFinite(minX + minY + minZ + maxX + maxY + maxZ)) return true;
    const p = this.planes;
    for (let i = 0; i < 24; i += 4) {
      const x = p[i] >= 0 ? maxX : minX;
      const y = p[i + 1] >= 0 ? maxY : minY;
      const z = p[i + 2] >= 0 ? maxZ : minZ;
      if (p[i] * x + p[i + 1] * y + p[i + 2] * z + p[i + 3] < 0) return false;
    }
    return true;
  }
}
