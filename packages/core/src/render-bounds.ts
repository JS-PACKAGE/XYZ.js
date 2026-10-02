import type { Matrix4 } from '../../math/src/index.js';

export interface BoundingSphere3D {
  x: number;
  y: number;
  z: number;
  radius: number;
}

/** Conservative even when nested nonuniform scales introduce shear. */
export function transformSphere(
  sphere: Readonly<BoundingSphere3D>,
  matrix: Matrix4,
  out: BoundingSphere3D,
): BoundingSphere3D {
  return transformSphereElements(sphere, matrix.elements, 0, out);
}

export function transformSphereElements(
  sphere: Readonly<BoundingSphere3D>,
  e: ArrayLike<number>,
  offset: number,
  out: BoundingSphere3D,
): BoundingSphere3D {
  const a = offset;
  const x = sphere.x,
    y = sphere.y,
    z = sphere.z,
    radius = sphere.radius;
  out.x = e[a] * x + e[a + 4] * y + e[a + 8] * z + e[a + 12];
  out.y = e[a + 1] * x + e[a + 5] * y + e[a + 9] * z + e[a + 13];
  out.z = e[a + 2] * x + e[a + 6] * y + e[a + 10] * z + e[a + 14];
  const columns = Math.max(
    Math.abs(e[a]) + Math.abs(e[a + 1]) + Math.abs(e[a + 2]),
    Math.abs(e[a + 4]) + Math.abs(e[a + 5]) + Math.abs(e[a + 6]),
    Math.abs(e[a + 8]) + Math.abs(e[a + 9]) + Math.abs(e[a + 10]),
  );
  const rows = Math.max(
    Math.abs(e[a]) + Math.abs(e[a + 4]) + Math.abs(e[a + 8]),
    Math.abs(e[a + 1]) + Math.abs(e[a + 5]) + Math.abs(e[a + 9]),
    Math.abs(e[a + 2]) + Math.abs(e[a + 6]) + Math.abs(e[a + 10]),
  );
  out.radius = radius * Math.sqrt(columns * rows);
  return out;
}
export function sphereIsFinite(sphere: Readonly<BoundingSphere3D>): boolean {
  return (
    Number.isFinite(sphere.x) &&
    Number.isFinite(sphere.y) &&
    Number.isFinite(sphere.z) &&
    Number.isFinite(sphere.radius) &&
    sphere.radius >= 0
  );
}
