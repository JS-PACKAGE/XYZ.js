import { Vector2 } from '../../../math/src/index.js';
import { ShapeGeometry } from './collider.js';
import { physicsDefaults } from '../../../../src/data/world2d.js';
const EPSILON = physicsDefaults.geometryEpsilon;

/** Mutable manifold is owned by one contact and never exposed directly in events. */
export class Manifold {
  nx = 1;
  ny = 0;
  penetration = 0;
  count = 0;
  readonly points = [new Vector2(), new Vector2()];
  readonly normalImpulses = new Float64Array(2);
  readonly tangentImpulses = new Float64Array(2);
  readonly bounceVelocities = new Float64Array(2);
  readonly clip = new Float64Array(4);
}

function axis(
  a: ShapeGeometry,
  b: ShapeGeometry,
  x: number,
  y: number,
  out: Manifold,
): boolean {
  const length = Math.hypot(x, y);
  if (length <= EPSILON) return true;
  x /= length;
  y /= length;
  let minA = Infinity,
    maxA = -Infinity,
    minB = Infinity,
    maxB = -Infinity;
  if (a.collider.kind === 'circle') {
    const center = a.x * x + a.y * y;
    minA = center - a.radius;
    maxA = center + a.radius;
  } else
    for (let i = 0; i < a.points.length; i += 2) {
      const projection = a.points[i] * x + a.points[i + 1] * y;
      minA = Math.min(minA, projection);
      maxA = Math.max(maxA, projection);
    }
  if (b.collider.kind === 'circle') {
    const center = b.x * x + b.y * y;
    minB = center - b.radius;
    maxB = center + b.radius;
  } else
    for (let i = 0; i < b.points.length; i += 2) {
      const projection = b.points[i] * x + b.points[i + 1] * y;
      minB = Math.min(minB, projection);
      maxB = Math.max(maxB, projection);
    }
  const positive = maxA - minB,
    negative = maxB - minA;
  if (positive < -EPSILON || negative < -EPSILON) return false;
  const depth = Math.min(positive, negative);
  if (depth < out.penetration) {
    out.penetration = Math.max(0, depth);
    const sign = positive <= negative ? 1 : -1;
    out.nx = x * sign;
    out.ny = y * sign;
  }
  return true;
}

function polygonAxes(
  polygon: ShapeGeometry,
  a: ShapeGeometry,
  b: ShapeGeometry,
  out: Manifold,
): boolean {
  const p = polygon.points;
  for (let i = 0; i < p.length; i += 2) {
    const j = (i + 2) % p.length;
    if (!axis(a, b, p[j + 1] - p[i + 1], p[i] - p[j], out)) return false;
  }
  return true;
}
function closestVertexAxis(
  circle: ShapeGeometry,
  polygon: ShapeGeometry,
  a: ShapeGeometry,
  b: ShapeGeometry,
  out: Manifold,
): boolean {
  let distance = Infinity,
    x = 0,
    y = 0;
  for (let i = 0; i < polygon.points.length; i += 2) {
    const dx = polygon.points[i] - circle.x,
      dy = polygon.points[i + 1] - circle.y;
    const squared = dx * dx + dy * dy;
    if (squared < distance) {
      distance = squared;
      x = dx;
      y = dy;
    }
  }
  return axis(a, b, x, y, out);
}

function bestEdge(polygon: ShapeGeometry, nx: number, ny: number): number {
  let best = -Infinity,
    edge = 0;
  const p = polygon.points;
  for (let i = 0; i < p.length; i += 2) {
    const j = (i + 2) % p.length;
    const dx = p[j] - p[i],
      dy = p[j + 1] - p[i + 1],
      length = Math.hypot(dx, dy);
    const dot = (dy * nx - dx * ny) / length;
    if (dot > best) {
      best = dot;
      edge = i;
    }
  }
  return edge;
}

function clipSegment(
  clip: Float64Array,
  nx: number,
  ny: number,
  limit: number,
): boolean {
  const d0 = clip[0] * nx + clip[1] * ny - limit;
  const d1 = clip[2] * nx + clip[3] * ny - limit;
  if (d0 > EPSILON && d1 > EPSILON) return false;
  if (d0 > EPSILON !== d1 > EPSILON) {
    const fraction = d0 / (d0 - d1);
    const x = clip[0] + fraction * (clip[2] - clip[0]);
    const y = clip[1] + fraction * (clip[3] - clip[1]);
    if (d0 > EPSILON) {
      clip[0] = x;
      clip[1] = y;
    } else {
      clip[2] = x;
      clip[3] = y;
    }
  }
  return true;
}

function polygonContacts(
  a: ShapeGeometry,
  b: ShapeGeometry,
  out: Manifold,
): void {
  const ae = bestEdge(a, out.nx, out.ny),
    be = bestEdge(b, -out.nx, -out.ny);
  const ap = a.points,
    bp = b.points;
  const aj = (ae + 2) % ap.length,
    bj = (be + 2) % bp.length;
  const adx = ap[aj] - ap[ae],
    ady = ap[aj + 1] - ap[ae + 1];
  const bdx = bp[bj] - bp[be],
    bdy = bp[bj + 1] - bp[be + 1];
  const aAlignment = (ady * out.nx - adx * out.ny) / Math.hypot(adx, ady);
  const bAlignment = (-bdy * out.nx + bdx * out.ny) / Math.hypot(bdx, bdy);
  const reference = aAlignment >= bAlignment ? a : b;
  const incident = reference === a ? b : a;
  const edge = reference === a ? ae : be;
  const sign = reference === a ? 1 : -1;
  const nx = out.nx * sign,
    ny = out.ny * sign;
  const p = reference.points,
    j = (edge + 2) % p.length;
  const dx = p[j] - p[edge],
    dy = p[j + 1] - p[edge + 1],
    length = Math.hypot(dx, dy);
  const tx = dx / length,
    ty = dy / length;
  const ie = bestEdge(incident, -nx, -ny),
    ij = (ie + 2) % incident.points.length;
  const c = out.clip;
  c[0] = incident.points[ie];
  c[1] = incident.points[ie + 1];
  c[2] = incident.points[ij];
  c[3] = incident.points[ij + 1];
  if (
    !clipSegment(c, -tx, -ty, -tx * p[edge] - ty * p[edge + 1]) ||
    !clipSegment(c, tx, ty, tx * p[j] + ty * p[j + 1])
  )
    return;
  const plane = nx * p[edge] + ny * p[edge + 1];
  for (let i = 0; i < 4; i += 2) {
    const separation = nx * c[i] + ny * c[i + 1] - plane;
    if (separation <= EPSILON) {
      if (out.count && Math.hypot(c[i] - c[0], c[i + 1] - c[1]) <= EPSILON)
        continue;
      out.points[out.count++].set(
        c[i] - (nx * separation) / 2,
        c[i + 1] - (ny * separation) / 2,
      );
    }
  }
}

export function collide(
  a: ShapeGeometry,
  b: ShapeGeometry,
  out: Manifold,
): boolean {
  out.count = 0;
  out.penetration = Infinity;
  if (a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY)
    return false;
  const ac = a.collider.kind === 'circle',
    bc = b.collider.kind === 'circle';
  if (ac && bc) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      distance = Math.hypot(dx, dy);
    const radius = a.radius + b.radius;
    if (distance > radius) return false;
    out.nx = distance > EPSILON ? dx / distance : 1;
    out.ny = distance > EPSILON ? dy / distance : 0;
    out.penetration = radius - distance;
    out.points[0].set(
      a.x + out.nx * (a.radius - out.penetration / 2),
      a.y + out.ny * (a.radius - out.penetration / 2),
    );
    out.count = 1;
    return true;
  }
  if (
    (!ac && !polygonAxes(a, a, b, out)) ||
    (!bc && !polygonAxes(b, a, b, out))
  )
    return false;
  if (ac && !closestVertexAxis(a, b, a, b, out)) return false;
  if (bc && !closestVertexAxis(b, a, a, b, out)) return false;
  if (!ac && !bc) polygonContacts(a, b, out);
  else {
    const circle = ac ? a : b,
      sign = ac ? 1 : -1;
    out.points[0].set(
      circle.x + sign * out.nx * (circle.radius - out.penetration / 2),
      circle.y + sign * out.ny * (circle.radius - out.penetration / 2),
    );
    out.count = 1;
  }
  return out.count > 0;
}

/** Exact circle/convex ray intersection. Inside starts hit at distance zero. */
export function rayDistance(
  shape: ShapeGeometry,
  x: number,
  y: number,
  dx: number,
  dy: number,
  maxDistance: number,
  normal: Vector2,
): number | undefined {
  if (shape.contains(x, y)) {
    normal.set(-dx, -dy);
    return 0;
  }
  if (shape.collider.kind === 'circle') {
    const ox = x - shape.x,
      oy = y - shape.y;
    const b = ox * dx + oy * dy,
      c = ox * ox + oy * oy - shape.radius * shape.radius;
    const discriminant = b * b - c;
    if (discriminant < 0) return undefined;
    const distance = -b - Math.sqrt(discriminant);
    if (distance < 0 || distance > maxDistance) return undefined;
    normal.set(
      (x + distance * dx - shape.x) / shape.radius,
      (y + distance * dy - shape.y) / shape.radius,
    );
    return distance;
  }
  let near = 0,
    far = maxDistance,
    nx = 0,
    ny = 0;
  const p = shape.points;
  for (let i = 0; i < p.length; i += 2) {
    const j = (i + 2) % p.length;
    const ex = p[j] - p[i],
      ey = p[j + 1] - p[i + 1],
      length = Math.hypot(ex, ey);
    const ax = ey / length,
      ay = -ex / length;
    const numerator = ax * (p[i] - x) + ay * (p[i + 1] - y),
      denominator = ax * dx + ay * dy;
    if (Math.abs(denominator) <= EPSILON) {
      if (numerator < 0) return undefined;
      continue;
    }
    const distance = numerator / denominator;
    if (denominator < 0 && distance > near) {
      near = distance;
      nx = ax;
      ny = ay;
    } else if (denominator > 0) far = Math.min(far, distance);
    if (near > far) return undefined;
  }
  if (near < 0 || near > maxDistance) return undefined;
  normal.set(nx, ny);
  return near;
}
