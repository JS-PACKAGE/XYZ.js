import { GameObject } from '../game-object.js';
import { world2dLimits } from '../../../../src/data/world2d.js';
import { Collider2D, Colliders, finite, positive } from './collider.js';
import { RigidBody2D, type RigidBodyOptions } from './body.js';
import { Vector2 } from '../../../math/src/index.js';

type Point = readonly [number, number];

const EPSILON = 1e-9;
/** Cap on input size; decomposition is O(n²) per merge pass. */
export const maxConcaveVertices = 256;

const cross = (a: Point, b: Point, c: Point): number =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

function signedArea(points: readonly Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      q = points[(i + 1) % points.length];
    area += p[0] * q[1] - p[1] * q[0];
  }
  return area / 2;
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(a, b, c),
    d2 = cross(a, b, d),
    d3 = cross(c, d, a),
    d4 = cross(c, d, b);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Throws unless the closed polyline is a simple polygon. */
function assertSimple(points: readonly Point[]): void {
  const n = points.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (
        segmentsCross(
          points[i],
          points[(i + 1) % n],
          points[j],
          points[(j + 1) % n],
        )
      )
        throw new RangeError('Concave polygon must not self-intersect.');
    }
}

/** Counterclockwise copy with repeated and collinear vertices removed. */
function normalized(vertices: readonly Point[]): Point[] {
  if (vertices.length < 3 || vertices.length > maxConcaveVertices)
    throw new RangeError(
      `Concave polygons require 3–${maxConcaveVertices} vertices.`,
    );
  let points: Point[] = vertices.map(([x, y]) => [
    finite(x, 'vertex.x'),
    finite(y, 'vertex.y'),
  ]);
  let changed = true;
  while (changed && points.length >= 3) {
    changed = false;
    for (let i = 0; i < points.length; i++) {
      const previous = points[(i + points.length - 1) % points.length],
        point = points[i],
        next = points[(i + 1) % points.length];
      const repeated =
        Math.hypot(point[0] - previous[0], point[1] - previous[1]) < EPSILON;
      if (repeated || Math.abs(cross(previous, point, next)) < EPSILON) {
        points = points.filter((_, index) => index !== i);
        changed = true;
        break;
      }
    }
  }
  if (points.length < 3)
    throw new RangeError('Polygon must have finite nonzero area.');
  assertSimple(points);
  if (Math.abs(signedArea(points)) < EPSILON)
    throw new RangeError('Polygon must have finite nonzero area.');
  if (signedArea(points) < 0) points.reverse();
  return points;
}

function earClip(points: readonly Point[]): number[][] {
  const remaining = points.map((_, index) => index);
  const triangles: number[][] = [];
  let guard = remaining.length * remaining.length;
  while (remaining.length > 3 && guard-- > 0) {
    let clipped = false;
    for (let i = 0; i < remaining.length; i++) {
      const a = remaining[(i + remaining.length - 1) % remaining.length],
        b = remaining[i],
        c = remaining[(i + 1) % remaining.length];
      if (cross(points[a], points[b], points[c]) <= EPSILON) continue;
      let contains = false;
      for (const other of remaining) {
        if (other === a || other === b || other === c) continue;
        const p = points[other];
        if (
          cross(points[a], points[b], p) >= -EPSILON &&
          cross(points[b], points[c], p) >= -EPSILON &&
          cross(points[c], points[a], p) >= -EPSILON
        ) {
          contains = true;
          break;
        }
      }
      if (contains) continue;
      triangles.push([a, b, c]);
      remaining.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) throw new RangeError('Polygon could not be triangulated.');
  }
  triangles.push([remaining[0], remaining[1], remaining[2]]);
  return triangles;
}

/** The polygon rotated so it starts at `first`, assuming `first` is one of its vertices. */
function rotated(polygon: readonly number[], first: number): number[] {
  const start = polygon.indexOf(first);
  return [...polygon.slice(start), ...polygon.slice(0, start)];
}

/** Merged polygon of `a` and `b` across their shared edge, or undefined. */
function mergeAcross(
  points: readonly Point[],
  a: readonly number[],
  b: readonly number[],
): number[] | undefined {
  for (let i = 0; i < a.length; i++) {
    const u = a[i],
      v = a[(i + 1) % a.length];
    const j = b.indexOf(v);
    if (j < 0 || b[(j + 1) % b.length] !== u) continue;
    const pa = rotated(a, v); // v ... u
    const pb = rotated(b, u); // u ... v
    const merged = [...pa, ...pb.slice(1, pb.length - 1)];
    if (merged.length > world2dLimits.polygonVertices) return undefined;
    // Only the two joint vertices can become reflex.
    const at = (index: number): number =>
      merged[(index + merged.length) % merged.length];
    for (const vertex of [u, v]) {
      const k = merged.indexOf(vertex);
      if (cross(points[at(k - 1)], points[at(k)], points[at(k + 1)]) < -EPSILON)
        return undefined;
    }
    return merged;
  }
  return undefined;
}

/**
 * Splits a simple polygon (either winding, collinear vertices allowed) into strictly convex,
 * counterclockwise pieces with at most 32 vertices: ear clipping, then Hertel–Mehlhorn merging
 * of neighbours while they stay convex. Result pieces are not minimal.
 */
export function decomposeConvex(
  vertices: readonly Point[],
): [number, number][][] {
  const points = normalized(vertices);
  let pieces = earClip(points);
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < pieces.length; i++)
      for (let j = i + 1; j < pieces.length; j++) {
        const combined = mergeAcross(points, pieces[i], pieces[j]);
        if (!combined) continue;
        pieces = pieces.filter((_, index) => index !== i && index !== j);
        pieces.push(combined);
        merged = true;
        break outer;
      }
  }
  return pieces.map((piece) => {
    // Merging can leave collinear vertices that Collider2D rejects.
    const cleaned = piece.filter((index, k) => {
      const previous = piece[(k + piece.length - 1) % piece.length],
        next = piece[(k + 1) % piece.length];
      return (
        Math.abs(cross(points[previous], points[index], points[next])) > EPSILON
      );
    });
    return cleaned.map((index) => [points[index][0], points[index][1]]);
  });
}

export interface StaticShapeOptions {
  friction?: number;
  restitution?: number;
  category?: number;
  mask?: number;
}

function staticPiece(
  collider: Collider2D,
  options: StaticShapeOptions,
): GameObject {
  if (options.category !== undefined) collider.category = options.category;
  if (options.mask !== undefined) collider.mask = options.mask;
  const piece = new GameObject();
  piece.collider = collider;
  piece.body = new RigidBody2D({
    type: 'static',
    friction: options.friction,
    restitution: options.restitution,
  });
  return piece;
}

/**
 * A static, possibly concave polygon: a parent whose children are the convex pieces from
 * {@link decomposeConvex}. Move or scale the parent.
 */
export class StaticConcave2D extends GameObject {
  readonly pieces: readonly GameObject[];
  constructor(vertices: readonly Point[], options: StaticShapeOptions = {}) {
    super();
    this.pieces = decomposeConvex(vertices).map((piece) =>
      this.add(staticPiece(Colliders.polygon(piece), options)),
    );
  }
}

export interface CompoundOptions2D extends Omit<RigidBodyOptions, 'type'> {
  category?: number;
  mask?: number;
  sensor?: boolean;
}

/**
 * One dynamic body with immutable convex polygon pieces. Geometry is copied and recentered
 * at its area-weighted center of mass; position initially preserves the input geometry's pose.
 * Overlapping pieces count their area twice. CCD is unsupported for compound geometry.
 */
export class Compound2D extends GameObject {
  readonly pieces: readonly Collider2D[];
  /** Center of mass in the input geometry's coordinates, before recentering. */
  readonly centerOfMass: Readonly<Vector2>;
  readonly area: number;

  constructor(pieces: readonly Collider2D[], options: CompoundOptions2D = {}) {
    super();
    if (pieces.length < 1 || pieces.length > world2dLimits.compoundPieces)
      throw new RangeError('Compound bodies require 1–256 convex pieces.');
    if (options.ccd) throw new RangeError('Compound CCD is unsupported.');
    let area = 0,
      weightedX = 0,
      weightedY = 0;
    for (const piece of pieces) {
      if (!(piece instanceof Collider2D) || piece.kind !== 'polygon')
        throw new RangeError(
          'Compound pieces must be convex polygon colliders.',
        );
      let twiceArea = 0,
        cx = 0,
        cy = 0;
      for (let i = 0; i < piece.vertices.length; i++) {
        const a = piece.vertices[i],
          b = piece.vertices[(i + 1) % piece.vertices.length];
        const determinant = a[0] * b[1] - a[1] * b[0];
        twiceArea += determinant;
        cx += (a[0] + b[0]) * determinant;
        cy += (a[1] + b[1]) * determinant;
      }
      const pieceArea = twiceArea / 2;
      area += pieceArea;
      weightedX += pieceArea * (cx / (3 * twiceArea) + piece.offset.x);
      weightedY += pieceArea * (cy / (3 * twiceArea) + piece.offset.y);
    }
    this.area = positive(area, 'compound area');
    const x = weightedX / area,
      y = weightedY / area;
    this.centerOfMass = Object.freeze(new Vector2(x, y));
    this.pieces = Object.freeze(
      pieces.map((source) => {
        const collider = new Collider2D('polygon', 0, source.vertices, {
          offset: [source.offset.x - x, source.offset.y - y],
        });
        collider.category = options.category ?? source.category;
        collider.mask = options.mask ?? source.mask;
        collider.sensor = options.sensor ?? source.sensor;
        return collider;
      }),
    );
    this.position.set(x, y);
    this.collider = this.pieces[0];
    this.body = new RigidBody2D({ ...options, type: 'dynamic' });
  }

  override get colliderPieces(): readonly Collider2D[] {
    return this.pieces;
  }
  override get collider(): Collider2D | undefined {
    return super.collider;
  }
  override set collider(value: Collider2D | undefined) {
    if (value && value !== this.pieces[0])
      throw new RangeError(
        'Compound collider must be its first piece, or undefined.',
      );
    super.collider = value;
  }
}

/** A simple concave polygon decomposed into pieces sharing one dynamic body. */
export class DynamicConcave2D extends Compound2D {
  constructor(vertices: readonly Point[], options: CompoundOptions2D = {}) {
    super(
      decomposeConvex(vertices).map((piece) => Colliders.polygon(piece)),
      options,
    );
  }
}

export interface StaticChainOptions extends StaticShapeOptions {
  /** Join the last point back to the first. Default false. */
  closed?: boolean;
  /** Collision thickness of every segment; default 2 world units. */
  thickness?: number;
}

/**
 * Static line strip collision made of thin convex quads, one per segment, each extended by half
 * the thickness at both ends so corners overlap without gaps. The segments are solid, not
 * zero-width edges: bodies thinner than `thickness`, or faster than it per step, can still tunnel
 * unless they use `ccd`.
 */
export class StaticChain2D extends GameObject {
  readonly segments: readonly GameObject[];
  constructor(points: readonly Point[], options: StaticChainOptions = {}) {
    super();
    const thickness = positive(options.thickness ?? 2, 'thickness');
    if (points.length < 2 || points.length > maxConcaveVertices)
      throw new RangeError(`Chains require 2–${maxConcaveVertices} points.`);
    const count = options.closed ? points.length : points.length - 1;
    if (options.closed && points.length < 3)
      throw new RangeError('Closed chains require at least 3 points.');
    const half = thickness / 2;
    const segments: GameObject[] = [];
    for (let i = 0; i < count; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!(length > EPSILON))
        throw new RangeError('Chain points must be distinct.');
      const dx = ((b[0] - a[0]) / length) * half,
        dy = ((b[1] - a[1]) / length) * half;
      // Counterclockwise rectangle around the segment, extended by `half` along it.
      const quad: [number, number][] = [
        [a[0] - dx + dy, a[1] - dy - dx],
        [b[0] + dx + dy, b[1] + dy - dx],
        [b[0] + dx - dy, b[1] + dy + dx],
        [a[0] - dx - dy, a[1] - dy + dx],
      ];
      if (signedArea(quad) < 0) quad.reverse();
      segments.push(this.add(staticPiece(Colliders.polygon(quad), options)));
    }
    this.segments = segments;
  }
}
