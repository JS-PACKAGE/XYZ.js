import type { Quaternion, Vector3 } from '../../math/src/index.js';

/** Builds a right-handed camera orientation with world +Y up and local -Z forward. */
export function lookAtRotation(
  position: Vector3,
  target: Vector3,
  rotation: Quaternion,
): void {
  let zx = position.x - target.x;
  let zy = position.y - target.y;
  let zz = position.z - target.z;
  const length = Math.hypot(zx, zy, zz);
  if (!Number.isFinite(length))
    throw new RangeError('Camera lookAt requires finite positions.');
  if (length === 0) return;
  zx /= length;
  zy /= length;
  zz /= length;
  const horizontal = Math.hypot(zx, zz);
  // At a pole the up vector cannot determine roll; retain a deterministic right axis.
  const xx = horizontal === 0 ? 1 : zz / horizontal;
  const xz = horizontal === 0 ? 0 : -zx / horizontal;
  const yx = zy * xz;
  const yy = zz * xx - zx * xz;
  const yz = -zy * xx;
  const trace = xx + yy + zz;
  if (trace > 0) {
    const s = 2 * Math.sqrt(trace + 1);
    rotation.set((yz - zy) / s, (zx - xz) / s, -yx / s, s / 4);
  } else if (xx > yy && xx > zz) {
    const s = 2 * Math.sqrt(1 + xx - yy - zz);
    rotation.set(s / 4, yx / s, (zx + xz) / s, (yz - zy) / s);
  } else if (yy > zz) {
    const s = 2 * Math.sqrt(1 + yy - xx - zz);
    rotation.set(yx / s, s / 4, (zy + yz) / s, (zx - xz) / s);
  } else {
    const s = 2 * Math.sqrt(1 + zz - xx - yy);
    rotation.set((zx + xz) / s, (zy + yz) / s, s / 4, -yx / s);
  }
  rotation.normalize();
}
