import type { Matrix4 } from '../../math/src/index.js';
import { hypot3 } from '../../math/src/hypot.js';

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
    for (let index = 0; index < 6; index++) {
      const row = index >>> 1;
      const sign = index % 2 === 0 ? 1 : -1;
      // The 0..1 near plane is row 2 alone, not row 3 plus row 2.
      const near = index === 4;
      const a = near ? m[2] : m[3] + sign * m[row];
      const b = near ? m[6] : m[7] + sign * m[4 + row];
      const c = near ? m[10] : m[11] + sign * m[8 + row];
      const d = near ? m[14] : m[15] + sign * m[12 + row];
      const length = hypot3(a, b, c);
      const scale = length > 0 ? 1 / length : 0;
      p[index * 4] = a * scale;
      p[index * 4 + 1] = b * scale;
      p[index * 4 + 2] = c * scale;
      p[index * 4 + 3] = d * scale;
    }
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
    const box = boxScratch;
    box.minX = minX;
    box.minY = minY;
    box.minZ = minZ;
    box.maxX = maxX;
    box.maxY = maxY;
    box.maxZ = maxZ;
    return this.intersectsBounds(box);
  }

  /**
   * @internal `intersectsBox` for bounds held in an object. Recursive callers are not
   * inlined into, and six doubles passed to an outlined call were each allocated.
   */
  intersectsBounds(box: Readonly<FrustumBox>): boolean {
    const minX = box.minX,
      minY = box.minY,
      minZ = box.minZ,
      maxX = box.maxX,
      maxY = box.maxY,
      maxZ = box.maxZ;
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

/** @internal Axis-aligned bounds read by `Frustum.intersectsBounds`. */
export interface FrustumBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

const boxScratch: FrustumBox = {
  minX: 0,
  minY: 0,
  minZ: 0,
  maxX: 0,
  maxY: 0,
  maxZ: 0,
};
