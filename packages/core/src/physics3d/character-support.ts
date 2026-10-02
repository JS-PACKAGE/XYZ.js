import { Matrix4, Quaternion, Vector3 } from '../../../math/src/index.js';

/** Controller-owned rigid support snapshot; no Object3D pose is temporarily replaced. */
export class CharacterSupportPose3D {
  readonly matrix = new Matrix4();
  readonly position = new Vector3();
  readonly rotation = new Quaternion();
  readonly scale = new Vector3();

  capture(matrix: Matrix4): void {
    this.matrix.copy(matrix);
    const e = matrix.elements;
    this.position.set(e[12], e[13], e[14]);
    const sx = Math.hypot(e[0], e[1], e[2]),
      sy = Math.hypot(e[4], e[5], e[6]),
      sz = Math.hypot(e[8], e[9], e[10]);
    this.scale.set(sx, sy, sz);
    const m00 = e[0] / sx,
      m01 = e[4] / sy,
      m02 = e[8] / sz,
      m10 = e[1] / sx,
      m11 = e[5] / sy,
      m12 = e[9] / sz,
      m20 = e[2] / sx,
      m21 = e[6] / sy,
      m22 = e[10] / sz,
      trace = m00 + m11 + m22;
    const q = this.rotation;
    if (trace > 0) {
      const s = Math.sqrt(trace + 1) * 2;
      q.set((m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4);
    } else if (m00 > m11 && m00 > m22) {
      const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
      q.set(s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s);
    } else if (m11 > m22) {
      const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
      q.set((m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s);
    } else {
      const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
      q.set((m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s);
    }
    q.normalize();
  }

  angleTo(next: CharacterSupportPose3D): number {
    const a = this.rotation,
      b = next.rotation;
    return (
      2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      )
    );
  }

  /** Shortest quaternion arc, with linear translation and fixed support scale. */
  interpolatePoint(
    next: CharacterSupportPose3D,
    local: Vector3,
    t: number,
    out: Vector3,
  ): void {
    const a = this.rotation,
      b = next.rotation;
    const dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w,
      sign = dot < 0 ? -1 : 1,
      cosine = Math.min(1, Math.abs(dot));
    let wa = 1 - t,
      wb = t * sign;
    if (cosine < 0.9995) {
      const theta = Math.acos(cosine),
        sine = Math.sin(theta);
      wa = Math.sin((1 - t) * theta) / sine;
      wb = (Math.sin(t * theta) / sine) * sign;
    }
    let x = a.x * wa + b.x * wb,
      y = a.y * wa + b.y * wb,
      z = a.z * wa + b.z * wb,
      w = a.w * wa + b.w * wb;
    const inverse = 1 / Math.hypot(x, y, z, w);
    x *= inverse;
    y *= inverse;
    z *= inverse;
    w *= inverse;
    const px = local.x * this.scale.x,
      py = local.y * this.scale.y,
      pz = local.z * this.scale.z,
      tx = 2 * (y * pz - z * py),
      ty = 2 * (z * px - x * pz),
      tz = 2 * (x * py - y * px);
    out.set(
      this.position.x +
        (next.position.x - this.position.x) * t +
        px +
        w * tx +
        y * tz -
        z * ty,
      this.position.y +
        (next.position.y - this.position.y) * t +
        py +
        w * ty +
        z * tx -
        x * tz,
      this.position.z +
        (next.position.z - this.position.z) * t +
        pz +
        w * tz +
        x * ty -
        y * tx,
    );
  }
}
