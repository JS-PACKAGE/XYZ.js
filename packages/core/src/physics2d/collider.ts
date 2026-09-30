import { Vector2 } from '../../../math/src/index.js';
import type { GameObject } from '../game-object.js';
import {
  physicsDefaults,
  world2dLimits,
} from '../../../../src/data/world2d.js';

const EPSILON = physicsDefaults.geometryEpsilon;
const TRANSFORM_INDICES = [0, 1, 3, 4, 6, 7] as const;
export type ColliderKind = 'circle' | 'polygon';
export interface ColliderOptions {
  offset?: [number, number];
}

export function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
  return value;
}
export function positive(value: number, name: string): number {
  finite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be positive.`);
  return value;
}
export function unsigned(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
    throw new RangeError(`${name} must be an unsigned 32-bit integer.`);
  return value >>> 0;
}

function boundedCoordinate(value: number, name: string): number {
  finite(value, name);
  if (Math.abs(value) > world2dLimits.geometryExtent)
    throw new RangeError(`${name} exceeds the physics geometry extent limit.`);
  return value;
}

/** Reusable local geometry. Bodies and scene membership belong to the owner, not the shape. */
export class Collider2D {
  readonly offset: Readonly<Vector2>;
  readonly vertices: readonly (readonly [number, number])[];
  sensor = false;
  private categoryBits = 1;
  private maskBits = 0xffffffff;
  private queryGeometry: ShapeGeometry | undefined;

  /** Prefer Colliders factories; construction validates and snapshots geometry. */
  constructor(
    readonly kind: ColliderKind,
    readonly radius: number,
    vertices: readonly (readonly [number, number])[],
    options: ColliderOptions = {},
  ) {
    const offset = options.offset ?? [0, 0];
    this.offset = Object.freeze(
      new Vector2(
        boundedCoordinate(offset[0], 'offset.x'),
        boundedCoordinate(offset[1], 'offset.y'),
      ),
    );
    if (kind === 'circle') {
      positive(radius, 'radius');
      boundedCoordinate(radius, 'radius');
      this.vertices = Object.freeze([]);
      return;
    }
    if (vertices.length < 3 || vertices.length > world2dLimits.polygonVertices)
      throw new RangeError('Convex polygons require 3–32 vertices.');
    const points = vertices.map(
      ([x, y]) =>
        [
          boundedCoordinate(x, 'vertex.x'),
          boundedCoordinate(y, 'vertex.y'),
        ] as [number, number],
    );
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i],
        q = points[(i + 1) % points.length];
      area += p[0] * q[1] - p[1] * q[0];
    }
    if (!Number.isFinite(area) || Math.abs(area) <= EPSILON)
      throw new RangeError('Polygon must have finite nonzero area.');
    if (area < 0) points.reverse();
    // Every vertex lies strictly inside every directed edge: rejects concavity and star polygons.
    for (let i = 0; i < points.length; i++) {
      const p = points[i],
        q = points[(i + 1) % points.length];
      for (let j = 0; j < points.length; j++) {
        if (j === i || j === (i + 1) % points.length) continue;
        const r = points[j];
        if (
          (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]) <=
          EPSILON
        )
          throw new RangeError(
            'Polygon must be strictly convex with distinct vertices.',
          );
      }
    }
    this.vertices = Object.freeze(points.map((point) => Object.freeze(point)));
  }
  get category(): number {
    return this.categoryBits;
  }
  set category(value: number) {
    this.categoryBits = unsigned(value, 'category');
  }
  get mask(): number {
    return this.maskBits;
  }
  set mask(value: number) {
    this.maskBits = unsigned(value, 'mask');
  }

  containsPoint(point: Vector2, owner: GameObject): boolean {
    finite(point.x, 'point.x');
    finite(point.y, 'point.y');
    const geometry = (this.queryGeometry ??= new ShapeGeometry(this));
    geometry.refresh(owner);
    return geometry.contains(point.x, point.y);
  }
}

export const Colliders = Object.freeze({
  circle(radius: number, options?: ColliderOptions): Collider2D {
    return new Collider2D('circle', radius, [], options);
  },
  box(width: number, height: number, options?: ColliderOptions): Collider2D {
    positive(width, 'width');
    positive(height, 'height');
    const x = width / 2,
      y = height / 2;
    return new Collider2D(
      'polygon',
      0,
      [
        [-x, -y],
        [x, -y],
        [x, y],
        [-x, y],
      ],
      options,
    );
  },
  polygon(
    vertices: readonly [number, number][],
    options?: ColliderOptions,
  ): Collider2D {
    return new Collider2D('polygon', 0, vertices, options);
  },
});

/** Reused world geometry and AABB. Polygon winding stays counterclockwise after reflection. */
export class ShapeGeometry {
  readonly points: Float64Array;
  x = 0;
  y = 0;
  radius = 0;
  minX = 0;
  minY = 0;
  maxX = 0;
  maxY = 0;
  inertiaPerMass = 0;
  private readonly matrixSnapshot = new Float64Array(6).fill(NaN);
  constructor(readonly collider: Collider2D) {
    this.points = new Float64Array(collider.vertices.length * 2);
  }
  refresh(owner: GameObject): void {
    const e = owner.updateWorldMatrix().elements;
    let changed = false;
    for (let i = 0; i < TRANSFORM_INDICES.length; i++)
      if (this.matrixSnapshot[i] !== e[TRANSFORM_INDICES[i]]) {
        changed = true;
        break;
      }
    if (!changed) return;
    for (const index of TRANSFORM_INDICES) finite(e[index], 'world transform');
    const determinant = e[0] * e[4] - e[1] * e[3];
    if (Math.abs(determinant) <= EPSILON)
      throw new RangeError('Physics requires a nonsingular world transform.');
    const offset = this.collider.offset;
    this.x = e[0] * offset.x + e[3] * offset.y + e[6];
    this.y = e[1] * offset.x + e[4] * offset.y + e[7];
    if (this.collider.kind === 'circle') {
      const sx = Math.hypot(e[0], e[1]),
        sy = Math.hypot(e[3], e[4]);
      if (
        Math.abs(sx - sy) > EPSILON * Math.max(sx, sy) ||
        Math.abs(e[0] * e[3] + e[1] * e[4]) > EPSILON * sx * sy
      )
        throw new RangeError(
          'Circle colliders require uniform absolute world scale without shear.',
        );
      this.radius = this.collider.radius * sx;
      this.minX = this.x - this.radius;
      this.maxX = this.x + this.radius;
      this.minY = this.y - this.radius;
      this.maxY = this.y + this.radius;
      this.inertiaPerMass =
        (this.radius * this.radius) / 2 +
        (this.x - e[6]) ** 2 +
        (this.y - e[7]) ** 2;
      positive(this.inertiaPerMass, 'world geometry inertia');
      for (let i = 0; i < TRANSFORM_INDICES.length; i++)
        this.matrixSnapshot[i] = e[TRANSFORM_INDICES[i]];
      return;
    }
    this.minX = this.minY = Infinity;
    this.maxX = this.maxY = -Infinity;
    const vertices = this.collider.vertices,
      count = vertices.length;
    for (let i = 0; i < count; i++) {
      const vertex = vertices[determinant < 0 ? count - 1 - i : i];
      const lx = vertex[0] + offset.x,
        ly = vertex[1] + offset.y;
      const x = e[0] * lx + e[3] * ly + e[6],
        y = e[1] * lx + e[4] * ly + e[7];
      this.points[i * 2] = x;
      this.points[i * 2 + 1] = y;
      this.minX = Math.min(this.minX, x);
      this.maxX = Math.max(this.maxX, x);
      this.minY = Math.min(this.minY, y);
      this.maxY = Math.max(this.maxY, y);
    }
    let crossSum = 0,
      moment = 0;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const ax = this.points[i * 2] - e[6],
        ay = this.points[i * 2 + 1] - e[7];
      const bx = this.points[j * 2] - e[6],
        by = this.points[j * 2 + 1] - e[7];
      const cross = ax * by - ay * bx;
      crossSum += cross;
      moment +=
        cross * (ax * ax + ax * bx + bx * bx + ay * ay + ay * by + by * by);
    }
    this.inertiaPerMass = moment / (6 * crossSum);
    positive(this.inertiaPerMass, 'world geometry inertia');
    for (let i = 0; i < TRANSFORM_INDICES.length; i++)
      this.matrixSnapshot[i] = e[TRANSFORM_INDICES[i]];
  }
  contains(x: number, y: number): boolean {
    if (this.collider.kind === 'circle')
      return (x - this.x) ** 2 + (y - this.y) ** 2 <= this.radius ** 2;
    const p = this.points;
    for (let i = 0; i < p.length; i += 2) {
      const j = (i + 2) % p.length;
      if (
        (p[j] - p[i]) * (y - p[i + 1]) - (p[j + 1] - p[i + 1]) * (x - p[i]) <
        -EPSILON
      )
        return false;
    }
    return true;
  }
}
