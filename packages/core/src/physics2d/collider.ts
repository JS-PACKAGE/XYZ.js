import { Vector2, type Transform2D } from '../../../math/src/index.js';
import type { GameObject } from '../game-object.js';
import {
  physicsDefaults,
  world2dLimits,
} from '../../../../src/data/world2d.js';
import { hypot2 } from '../../../math/src/hypot.js';

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
export function nonnegativeFinite(value: number, name: string): number {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} must be nonnegative.`);
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
  /**
   * @internal `[category, mask]` as int32 for the pair filters, whose bit tests are unchanged
   * by it: an element load stays inline, while a getter call V8 does not inline returns these
   * (mostly above the small-integer range) as freshly boxed numbers.
   */
  readonly filterBits = Int32Array.of(1, -1);
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
    this.filterBits[0] = this.categoryBits;
  }
  get mask(): number {
    return this.maskBits;
  }
  set mask(value: number) {
    this.maskBits = unsigned(value, 'mask');
    this.filterBits[1] = this.maskBits;
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

/**
 * Polygon `Collider2D` from the convex hull of 3-256 input points (Andrew's
 * monotone chain). Exposed top-level so the 1.x `Colliders` surface stays
 * structurally additive; duplicate points collapse before the sweep.
 */
export function convexHull(
  points: readonly (readonly [number, number])[],
  options?: ColliderOptions,
): Collider2D {
  if (points.length < 3 || points.length > world2dLimits.hullPoints)
    throw new RangeError('Convex hulls require 3-256 input points.');
  const sorted = points
    .map(
      ([x, y]) =>
        [boundedCoordinate(x, 'point.x'), boundedCoordinate(y, 'point.y')] as [
          number,
          number,
        ],
    )
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const unique = sorted.filter(
    (p, i) => i === 0 || p[0] !== sorted[i - 1][0] || p[1] !== sorted[i - 1][1],
  );
  const turn = (
    a: readonly number[],
    b: readonly number[],
    c: readonly number[],
  ): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const lower: [number, number][] = [],
    upper: [number, number][] = [];
  for (const p of unique) {
    while (
      lower.length >= 2 &&
      turn(lower[lower.length - 2], lower[lower.length - 1], p) <= EPSILON
    )
      lower.pop();
    lower.push(p);
  }
  for (let i = unique.length - 1; i >= 0; i--) {
    const p = unique[i];
    while (
      upper.length >= 2 &&
      turn(upper[upper.length - 2], upper[upper.length - 1], p) <= EPSILON
    )
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return new Collider2D('polygon', 0, lower.concat(upper), options);
}

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
  area = 0;
  /** @internal Changes only after a successful world-geometry refresh. */
  revision = 0;
  private readonly matrixSnapshot = new Float64Array(6).fill(NaN);
  private edges: Float64Array | undefined;
  private edgesRevision = -1;
  /** @internal Valid after `rayAmplification`; see there. */
  rayEdgeTolerance = 0;
  private rayBound = 1;
  private rayBoundRevision = -1;
  /** Transform inputs `refresh` last composed the pose from; NaN when unknown. */
  private readonly poseInputs = new Float64Array(9).fill(NaN);
  /**
   * A child's parent world matrix (indices 0, 1, 3, 4, 6, 7) then its transform inputs, as
   * `poseInputs` is for a root. Each form invalidates the other when it refreshes.
   */
  private readonly childInputs = new Float64Array(15).fill(NaN);
  constructor(readonly collider: Collider2D) {
    this.points = new Float64Array(collider.vertices.length * 2);
  }
  /**
   * @internal Per polygon edge `i -> i + 1`: unit normal `(ey, -ex) / |e|` and length `|e|`
   * (`hypot2(ex, ey)`), three floats each, computed on first use after each world-geometry
   * refresh. Code that writes `points` otherwise must call `invalidateEdges`.
   */
  edgeData(): Float64Array {
    const p = this.points;
    let edges = this.edges;
    if (edges && this.edgesRevision === this.revision) return edges;
    edges ??= this.edges = new Float64Array((p.length >> 1) * 3);
    for (let i = 0, k = 0; i < p.length; i += 2, k += 3) {
      const j = (i + 2) % p.length;
      const ex = p[j]! - p[i]!,
        ey = p[j + 1]! - p[i + 1]!,
        length = hypot2(ex, ey);
      edges[k] = ey / length;
      edges[k + 1] = -ex / length;
      edges[k + 2] = length;
    }
    this.edgesRevision = this.revision;
    return edges;
  }
  /** @internal For writers of `points` outside `refresh` (motion samples). */
  invalidateEdges(): void {
    this.edgesRevision = -1;
  }
  /**
   * @internal Bounds how far outside the AABB `rayDistance` can report a hit, contained
   * origins included. Every such point lies within some tolerance `e` of the two edge lines
   * beside each extreme vertex (`a·(p − v) ≤ e`), so it lies at most `e` times the returned
   * factor past that vertex along the axis: the summed nonnegative weights expressing the
   * axis direction in those two edge normals. Infinity where that decomposition fails.
   * `rayEdgeTolerance` is `contains`'s own tolerance as a distance: EPSILON over the shortest
   * edge. Circles return 1 (and 0), and are computed once per world-geometry refresh.
   */
  rayAmplification(): number {
    if (this.rayBoundRevision === this.revision) return this.rayBound;
    this.rayBoundRevision = this.revision;
    if (this.collider.kind === 'circle') {
      this.rayEdgeTolerance = 0;
      return (this.rayBound = 1);
    }
    const p = this.points,
      edges = this.edgeData(),
      count = p.length >> 1;
    let shortest = Infinity;
    for (let k = 0; k < count; k++)
      shortest = Math.min(shortest, edges[k * 3 + 2]!);
    this.rayEdgeTolerance = EPSILON / shortest;
    let bound = 0;
    for (let axis = 0; axis < 4; axis++) {
      // +x, -x, +y, -y and the matching extreme coordinate.
      const ux = axis === 0 ? 1 : axis === 1 ? -1 : 0,
        uy = axis === 2 ? 1 : axis === 3 ? -1 : 0,
        extreme =
          axis === 0
            ? this.maxX
            : axis === 1
              ? this.minX
              : axis === 2
                ? this.maxY
                : this.minY;
      let vertex = 0;
      while (vertex < count && p[vertex * 2 + (axis >> 1)] !== extreme)
        vertex++;
      const before = ((vertex + count - 1) % count) * 3,
        after = vertex * 3;
      const ax = edges[before]!,
        ay = edges[before + 1]!,
        bx = edges[after]!,
        by = edges[after + 1]!;
      const determinant = ax * by - ay * bx;
      const first = (ux * by - uy * bx) / determinant,
        second = (ax * uy - ay * ux) / determinant;
      // Rounding leaves exact zeros slightly negative; a real negative weight means the
      // normals do not bracket the axis (degenerate geometry), and nothing is bounded.
      if (!(first >= -1e-9 && second >= -1e-9)) {
        bound = Infinity;
        break;
      }
      bound = Math.max(bound, Math.max(0, first) + Math.max(0, second));
    }
    return (this.rayBound = bound);
  }
  refresh(owner: GameObject): void {
    const t = owner.transform,
      k = this.poseInputs;
    const direct = owner.composesFromTransform;
    // A root's world matrix is composed from these values alone; when none changed,
    // the matrix snapshot below would match and nothing would be refreshed.
    if (
      direct &&
      k[0] === t.position.x &&
      k[1] === t.position.y &&
      k[2] === t.rotation &&
      k[3] === t.scale.x &&
      k[4] === t.scale.y &&
      k[5] === t.pivot.x &&
      k[6] === t.pivot.y &&
      k[7] === t.skew.x &&
      k[8] === t.skew.y
    )
      return;
    // A child's matrix is its parent's times its transform, so the parent's matrix stands in
    // for every ancestor input.
    const parent = direct ? undefined : owner.baseComposedParent;
    if (parent && this.childUnchanged(parent, t)) return;
    k[0] = NaN;
    this.childInputs[0] = NaN;
    this.refreshPose(owner);
    if (parent) this.recordChild(parent, t);
    else if (direct) {
      k[0] = t.position.x;
      k[1] = t.position.y;
      k[2] = t.rotation;
      k[3] = t.scale.x;
      k[4] = t.scale.y;
      k[5] = t.pivot.x;
      k[6] = t.pivot.y;
      k[7] = t.skew.x;
      k[8] = t.skew.y;
    }
  }
  private childUnchanged(parent: GameObject, t: Transform2D): boolean {
    const p = parent.updateWorldMatrix().elements,
      c = this.childInputs;
    return (
      c[0] === p[0] &&
      c[1] === p[1] &&
      c[2] === p[3] &&
      c[3] === p[4] &&
      c[4] === p[6] &&
      c[5] === p[7] &&
      c[6] === t.position.x &&
      c[7] === t.position.y &&
      c[8] === t.rotation &&
      c[9] === t.scale.x &&
      c[10] === t.scale.y &&
      c[11] === t.pivot.x &&
      c[12] === t.pivot.y &&
      c[13] === t.skew.x &&
      c[14] === t.skew.y
    );
  }
  private recordChild(parent: GameObject, t: Transform2D): void {
    const p = parent.updateWorldMatrix().elements,
      c = this.childInputs;
    c[0] = p[0];
    c[1] = p[1];
    c[2] = p[3];
    c[3] = p[4];
    c[4] = p[6];
    c[5] = p[7];
    c[6] = t.position.x;
    c[7] = t.position.y;
    c[8] = t.rotation;
    c[9] = t.scale.x;
    c[10] = t.scale.y;
    c[11] = t.pivot.x;
    c[12] = t.pivot.y;
    c[13] = t.skew.x;
    c[14] = t.skew.y;
  }
  private refreshPose(owner: GameObject): void {
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
      const sx = hypot2(e[0], e[1]),
        sy = hypot2(e[3], e[4]);
      if (
        Math.abs(sx - sy) > EPSILON * Math.max(sx, sy) ||
        Math.abs(e[0] * e[3] + e[1] * e[4]) > EPSILON * sx * sy
      )
        throw new RangeError(
          'Circle colliders require uniform absolute world scale without shear.',
        );
      this.radius = this.collider.radius * sx;
      this.area = Math.PI * this.radius * this.radius;
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
      this.revision++;
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
    this.area = crossSum / 2;
    positive(this.inertiaPerMass, 'world geometry inertia');
    for (let i = 0; i < TRANSFORM_INDICES.length; i++)
      this.matrixSnapshot[i] = e[TRANSFORM_INDICES[i]];
    this.revision++;
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
