import type { Vector3 } from '../../../math/src/index.js';
import { Shape3D, type Triangle3D } from './collider.js';
import { physicsRayLimits } from '../../../../src/data/physics-ray.js';

type Emit = (distance: number, nx: number, ny: number, nz: number) => void;
/** Analytic boundary intersections, not conservative-advancement contacts. Direction is unit length. */
export function rayIntersections3D(
  shape: Shape3D,
  origin: Readonly<Vector3>,
  direction: Readonly<Vector3>,
  maxDistance: number,
  emit: Emit,
  triangle?: Triangle3D,
): void {
  const epsilon = physicsRayLimits.tolerance;
  const ox = origin.x,
    oy = origin.y,
    oz = origin.z;
  const dx = direction.x,
    dy = direction.y,
    dz = direction.z;
  const cx = ox - shape.center.x,
    cy = oy - shape.center.y,
    cz = oz - shape.center.z;
  const publish = (t: number, nx: number, ny: number, nz: number): void => {
    if (t >= -epsilon && t <= maxDistance + epsilon)
      emit(Math.max(0, Math.min(maxDistance, t)), nx, ny, nz);
  };
  if (triangle) {
    const a = triangle.a,
      b = triangle.b,
      c = triangle.c;
    const ux = b.x - a.x,
      uy = b.y - a.y,
      uz = b.z - a.z;
    const vx = c.x - a.x,
      vy = c.y - a.y,
      vz = c.z - a.z;
    const px = dy * vz - dz * vy,
      py = dz * vx - dx * vz,
      pz = dx * vy - dy * vx;
    const determinant = ux * px + uy * py + uz * pz;
    if (
      Math.abs(determinant) <= epsilon ||
      (shape.collider.kind === 'mesh' &&
        'sidedness' in shape.collider &&
        shape.collider.sidedness === 'front' &&
        determinant <= epsilon)
    )
      return;
    const ax = ox - a.x,
      ay = oy - a.y,
      az = oz - a.z;
    const u = (ax * px + ay * py + az * pz) / determinant;
    if (u < -epsilon || u > 1 + epsilon) return;
    const qx = ay * uz - az * uy,
      qy = az * ux - ax * uz,
      qz = ax * uy - ay * ux;
    const v = (dx * qx + dy * qy + dz * qz) / determinant;
    if (v < -epsilon || u + v > 1 + epsilon) return;
    const n = triangle.normal,
      sign = determinant > 0 ? 1 : -1;
    publish(
      (vx * qx + vy * qy + vz * qz) / determinant,
      n.x * sign,
      n.y * sign,
      n.z * sign,
    );
  } else if (shape.collider.kind === 'plane') {
    const n = shape.normal,
      denominator = dx * n.x + dy * n.y + dz * n.z;
    if (Math.abs(denominator) <= epsilon) return;
    const sign = denominator < 0 ? 1 : -1;
    publish(
      -(cx * n.x + cy * n.y + cz * n.z) / denominator,
      n.x * sign,
      n.y * sign,
      n.z * sign,
    );
  } else if (shape.collider.kind === 'box') {
    let near = -Infinity,
      far = Infinity;
    let nx = 0,
      ny = 0,
      nz = 0,
      fx = 0,
      fy = 0,
      fz = 0;
    for (let i = 0; i < 3; i++) {
      const axis = shape.axes[i]!;
      const p = cx * axis.x + cy * axis.y + cz * axis.z;
      const d = dx * axis.x + dy * axis.y + dz * axis.z;
      const h = i === 0 ? shape.half.x : i === 1 ? shape.half.y : shape.half.z;
      if (Math.abs(d) <= epsilon) {
        if (Math.abs(p) > h) return;
        continue;
      }
      const first = (-h - p) / d,
        second = (h - p) / d;
      const lo = Math.min(first, second),
        hi = Math.max(first, second),
        sign = d > 0 ? -1 : 1;
      if (lo > near) {
        near = lo;
        nx = axis.x * sign;
        ny = axis.y * sign;
        nz = axis.z * sign;
      }
      if (hi < far) {
        far = hi;
        fx = -axis.x * sign;
        fy = -axis.y * sign;
        fz = -axis.z * sign;
      }
      if (near > far + epsilon) return;
    }
    publish(near, nx, ny, nz);
    if (far - near > epsilon) publish(far, fx, fy, fz);
  } else if (
    shape.collider.kind === 'sphere' ||
    shape.collider.kind === 'capsule'
  ) {
    const a = shape.start,
      b = shape.end,
      radius = shape.radius;
    const bx = b.x - a.x,
      by = b.y - a.y,
      bz = b.z - a.z;
    const length = Math.hypot(bx, by, bz);
    const ux = length > epsilon ? bx / length : 0,
      uy = length > epsilon ? by / length : 1,
      uz = length > epsilon ? bz / length : 0;
    const ax = ox - a.x,
      ay = oy - a.y,
      az = oz - a.z;
    const along = ax * ux + ay * uy + az * uz,
      speed = dx * ux + dy * uy + dz * uz;
    if (length > epsilon) {
      const rx = ax - ux * along,
        ry = ay - uy * along,
        rz = az - uz * along;
      const vx = dx - ux * speed,
        vy = dy - uy * speed,
        vz = dz - uz * speed;
      const aa = vx * vx + vy * vy + vz * vz,
        bb = rx * vx + ry * vy + rz * vz,
        cc = rx * rx + ry * ry + rz * rz - radius * radius;
      const disc = bb * bb - aa * cc;
      if (aa > epsilon && disc >= -epsilon) {
        const root = Math.sqrt(Math.max(0, disc));
        for (let side = -1; side <= 1; side += 2) {
          const t = (-bb + side * root) / aa,
            at = along + t * speed;
          if (at >= 0 && at <= length)
            publish(
              t,
              (rx + t * vx) / radius,
              (ry + t * vy) / radius,
              (rz + t * vz) / radius,
            );
          if (root === 0) break;
        }
      }
    }
    for (let cap = 0; cap < (length > epsilon ? 2 : 1); cap++) {
      const center = cap === 0 ? a : b;
      const rx = ox - center.x,
        ry = oy - center.y,
        rz = oz - center.z;
      const bb = rx * dx + ry * dy + rz * dz,
        cc = rx * rx + ry * ry + rz * rz - radius * radius;
      const disc = bb * bb - cc;
      if (disc < -epsilon) continue;
      const root = Math.sqrt(Math.max(0, disc));
      for (let side = -1; side <= 1; side += 2) {
        const t = -bb + side * root,
          at = along + t * speed;
        if (length <= epsilon || (cap === 0 ? at < 0 : at > length))
          publish(
            t,
            (rx + t * dx) / radius,
            (ry + t * dy) / radius,
            (rz + t * dz) / radius,
          );
        if (root === 0) break;
      }
    }
  }
}
