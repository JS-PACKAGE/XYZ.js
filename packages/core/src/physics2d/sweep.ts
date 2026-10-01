import type { ShapeGeometry } from './collider.js';

const TINY = 1e-12;
/** One rounded-polygon vertex buffer; polygon colliders have at most 32 vertices. */
const vertices = new Float64Array(64);

/**
 * Entry time of the ray `t * (dx, dy)`, t in [0,1], into the disk at (cx, cy). Infinity when it
 * misses or the origin is already inside.
 */
function rayDisk(
  cx: number,
  cy: number,
  radius: number,
  dx: number,
  dy: number,
): number {
  const c = cx * cx + cy * cy - radius * radius;
  if (c <= 0) return Infinity;
  const a = dx * dx + dy * dy;
  const b = dx * cx + dy * cy;
  if (b <= 0) return Infinity;
  const discriminant = b * b - a * c;
  if (discriminant < 0) return Infinity;
  const t = (b - Math.sqrt(discriminant)) / a;
  return t >= 0 && t <= 1 ? t : Infinity;
}

/** Ray from the origin along (dx, dy) against segment a-b, t in [0,1]. */
function raySegment(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  dx: number,
  dy: number,
): number {
  const ex = bx - ax,
    ey = by - ay;
  const denominator = dx * ey - dy * ex;
  if (Math.abs(denominator) < TINY) return Infinity;
  const t = (ax * ey - ay * ex) / denominator;
  const u = (ax * dy - ay * dx) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : Infinity;
}

/**
 * First entry of the ray into a convex polygon (counterclockwise) grown by `radius`.
 * Infinity when the origin is already inside or nothing is hit within [0,1].
 */
function rayRoundedPolygon(
  count: number,
  radius: number,
  dx: number,
  dy: number,
): number {
  let inside = true;
  let best = Infinity;
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const ax = vertices[i * 2],
      ay = vertices[i * 2 + 1];
    const ex = vertices[j * 2] - ax,
      ey = vertices[j * 2 + 1] - ay;
    const length = Math.hypot(ex, ey);
    if (length < TINY) continue;
    const nx = ey / length,
      ny = -ex / length;
    const offset = nx * ax + ny * ay + radius;
    if (offset - radius < 0) inside = false;
    if (radius > 0) {
      // The origin may be beside this edge's vertex disk without being past the offset line.
      const t = rayDisk(ax, ay, radius, dx, dy);
      if (t < best) best = t;
    }
    const denominator = nx * dx + ny * dy;
    if (denominator >= 0 || offset > 0) continue;
    const t = offset / denominator;
    if (t > 1 || t < 0) continue;
    const u = ((t * dx - ax) * ex + (t * dy - ay) * ey) / (length * length);
    if (u >= 0 && u <= 1 && t < best) best = t;
  }
  if (inside) return Infinity;
  if (radius > 0) {
    // Origin within `radius` of a vertex or edge is overlapping at the start.
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const ax = vertices[i * 2],
        ay = vertices[i * 2 + 1];
      const ex = vertices[j * 2] - ax,
        ey = vertices[j * 2 + 1] - ay;
      const lengthSquared = ex * ex + ey * ey;
      const u =
        lengthSquared < TINY
          ? 0
          : Math.min(1, Math.max(0, -(ax * ex + ay * ey) / lengthSquared));
      if (Math.hypot(ax + ex * u, ay + ey * u) < radius) return Infinity;
    }
  }
  return best;
}

/**
 * Time of impact in [0,1] of `moving` translating by (dx, dy) against `target`, or Infinity when
 * they do not touch during the move or already overlap at its start. `moving` holds the END
 * pose; the start pose is that shape shifted by (-dx, -dy). Rotation is not swept. The shapes
 * are convex, so contact happens exactly when the origin ray enters target ⊕ (−moving).
 */
export function sweepTimeOfImpact(
  moving: ShapeGeometry,
  dx: number,
  dy: number,
  target: ShapeGeometry,
): number {
  const startX = moving.x - dx,
    startY = moving.y - dy;
  const movingCircle = moving.collider.kind === 'circle';
  const targetCircle = target.collider.kind === 'circle';
  if (movingCircle && targetCircle)
    return rayDisk(
      target.x - startX,
      target.y - startY,
      moving.radius + target.radius,
      dx,
      dy,
    );
  if (movingCircle) {
    const p = target.points;
    for (let i = 0; i < p.length; i += 2) {
      vertices[i] = p[i] - startX;
      vertices[i + 1] = p[i + 1] - startY;
    }
    return rayRoundedPolygon(p.length / 2, moving.radius, dx, dy);
  }
  const m = moving.points;
  if (targetCircle) {
    for (let i = 0; i < m.length; i += 2) {
      vertices[i] = target.x - (m[i] - dx);
      vertices[i + 1] = target.y - (m[i + 1] - dy);
    }
    return rayRoundedPolygon(m.length / 2, target.radius, dx, dy);
  }
  // Every translated edge of one shape lies inside the Minkowski difference, so the earliest
  // ray hit among them is its boundary entry. Overlap at the start gives no earlier hit than 0.
  const p = target.points;
  let best = Infinity;
  let separated = false;
  for (let j = 0; j < p.length; j += 2) {
    const k = (j + 2) % p.length;
    const ex = p[k] - p[j],
      ey = p[k + 1] - p[j + 1];
    const length = Math.hypot(ex, ey);
    const nx = ey / length,
      ny = -ex / length;
    // Separated at the start when the moving shape lies wholly outside this target edge.
    let outer = Infinity;
    for (let i = 0; i < m.length; i += 2) {
      const sx = m[i] - dx,
        sy = m[i + 1] - dy;
      const distance = nx * (sx - p[j]) + ny * (sy - p[j + 1]);
      if (distance < outer) outer = distance;
      const t = raySegment(
        p[j] - sx,
        p[j + 1] - sy,
        p[k] - sx,
        p[k + 1] - sy,
        dx,
        dy,
      );
      if (t < best) best = t;
    }
    if (outer >= 0) separated = true;
  }
  for (let i = 0; i < m.length; i += 2) {
    const l = (i + 2) % m.length;
    const sx = m[i] - dx,
      sy = m[i + 1] - dy;
    const ex = m[l] - m[i],
      ey = m[l + 1] - m[i + 1];
    const length = Math.hypot(ex, ey);
    const nx = ey / length,
      ny = -ex / length;
    let outer = Infinity;
    for (let j = 0; j < p.length; j += 2) {
      const distance = nx * (p[j] - sx) + ny * (p[j + 1] - sy);
      if (distance < outer) outer = distance;
      const t = raySegment(
        p[j] - sx,
        p[j + 1] - sy,
        p[j] - (m[l] - dx),
        p[j + 1] - (m[l + 1] - dy),
        dx,
        dy,
      );
      if (t < best) best = t;
    }
    if (outer >= 0) separated = true;
  }
  return separated ? best : Infinity;
}
