import { Vector3 } from '../../../math/src/index.js';
import type { Matrix4 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import { Bounds3D, SpatialIndex3D } from './spatial.js';
import { physics3DDefaults } from '../../../../src/data/physics3d.js';

export function finite3D(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
  return value;
}
export function positive3D(value: number, name: string): number {
  if (finite3D(value, name) <= 0)
    throw new RangeError(`${name} must be positive.`);
  return value;
}
export function nonnegative3D(value: number, name: string): number {
  if (finite3D(value, name) < 0)
    throw new RangeError(`${name} must be nonnegative.`);
  return value;
}
export function vector3D(value: Readonly<Vector3>, name: string): void {
  finite3D(value.x, `${name}.x`);
  finite3D(value.y, `${name}.y`);
  finite3D(value.z, `${name}.z`);
}
export interface ColliderOptions3D {
  offset?: Readonly<Vector3>;
  sensor?: boolean;
  category?: number;
  mask?: number;
}
/** Immutable collider descriptor. Geometry is snapshotted before attachment. */
export abstract class Collider3D {
  abstract readonly kind: 'sphere' | 'box' | 'capsule' | 'plane' | 'mesh';
  readonly offset: Readonly<Vector3>;
  readonly sensor: boolean;
  readonly category: number;
  readonly mask: number;
  constructor(options: ColliderOptions3D = {}) {
    const offset = options.offset ?? new Vector3();
    vector3D(offset, 'offset');
    this.offset = Object.freeze(new Vector3(offset.x, offset.y, offset.z));
    this.sensor = options.sensor ?? false;
    this.category = options.category ?? 1;
    this.mask = options.mask ?? 0xffffffff;
    for (const value of [this.category, this.mask])
      if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
        throw new RangeError('Collision masks must be uint32.');
  }
}
export class SphereCollider3D extends Collider3D {
  readonly kind = 'sphere';
  readonly radius: number;
  constructor(radius: number, options: ColliderOptions3D = {}) {
    super(options);
    this.radius = positive3D(radius, 'radius');
  }
}
export class BoxCollider3D extends Collider3D {
  readonly kind = 'box';
  readonly halfExtents: Readonly<Vector3>;
  constructor(halfExtents: Readonly<Vector3>, options: ColliderOptions3D = {}) {
    super(options);
    this.halfExtents = Object.freeze(
      new Vector3(
        positive3D(halfExtents.x, 'halfExtents.x'),
        positive3D(halfExtents.y, 'halfExtents.y'),
        positive3D(halfExtents.z, 'halfExtents.z'),
      ),
    );
  }
}
/** Y-aligned local capsule: height is the straight segment length, total height = height + 2*radius. */
export class CapsuleCollider3D extends Collider3D {
  readonly kind = 'capsule';
  readonly radius: number;
  readonly height: number;
  constructor(radius: number, height: number, options: ColliderOptions3D = {}) {
    super(options);
    this.radius = positive3D(radius, 'radius');
    this.height = nonnegative3D(height, 'height');
  }
}
/** Infinite two-sided surface; normal is local and normalized, offset locates a point on it. Static only. */
export class PlaneCollider3D extends Collider3D {
  readonly kind = 'plane';
  readonly normal: Readonly<Vector3>;
  constructor(
    normal: Readonly<Vector3> = new Vector3(0, 1, 0),
    options: ColliderOptions3D = {},
  ) {
    super(options);
    vector3D(normal, 'normal');
    positive3D(normal.length(), 'normal length');
    this.normal = Object.freeze(
      new Vector3(normal.x, normal.y, normal.z).normalize(),
    );
  }
}

export interface TriangleMeshOptions3D extends ColliderOptions3D {
  /** 'front' uses counterclockwise winding; 'double' is a two-sided surface, not a closed solid. */
  sidedness?: 'double' | 'front';
}
/** Static indexed triangle surface. Bake owns copies; replace the attachment to update transactionally. */
export class TriangleMeshCollider3D extends Collider3D {
  readonly kind = 'mesh';
  readonly positions: readonly number[];
  readonly indices: readonly number[];
  readonly sidedness: 'double' | 'front';
  constructor(
    positions: ArrayLike<number>,
    indices: ArrayLike<number>,
    options: TriangleMeshOptions3D = {},
  ) {
    super(options);
    if (
      !Number.isInteger(positions.length) ||
      !Number.isInteger(indices.length) ||
      positions.length < 9 ||
      positions.length % 3 ||
      positions.length > physics3DDefaults.maxMeshTriangles * 9 ||
      indices.length < 3 ||
      indices.length % 3 ||
      indices.length / 3 > physics3DDefaults.maxMeshTriangles
    )
      throw new RangeError('Mesh requires bounded indexed xyz triangles.');
    const p = Array.from(positions),
      ix = Array.from(indices);
    for (const v of p) finite3D(v, 'mesh position');
    for (const i of ix)
      if (!Number.isInteger(i) || i < 0 || i >= p.length / 3)
        throw new RangeError('Mesh index out of range.');
    for (let i = 0; i < ix.length; i += 3) {
      const a = ix[i] * 3,
        b = ix[i + 1] * 3,
        c = ix[i + 2] * 3;
      const ux = p[b] - p[a],
        uy = p[b + 1] - p[a + 1],
        uz = p[b + 2] - p[a + 2];
      const vx = p[c] - p[a],
        vy = p[c + 1] - p[a + 1],
        vz = p[c + 2] - p[a + 2];
      if (
        finite3D(
          Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx),
          'triangle area',
        ) <= physics3DDefaults.geometryTolerance
      )
        throw new RangeError('Degenerate mesh triangle.');
    }
    this.sidedness = options.sidedness ?? 'double';
    if (this.sidedness !== 'front' && this.sidedness !== 'double')
      throw new RangeError('Invalid mesh sidedness.');
    this.positions = Object.freeze(p);
    this.indices = Object.freeze(ix);
  }
}
/** @internal A transformed BVH leaf, reused across pose changes. */
export class Triangle3D {
  readonly a = new Vector3();
  readonly b = new Vector3();
  readonly c = new Vector3();
  readonly normal = new Vector3();
  readonly bounds = new Bounds3D();
  constructor(readonly order: number) {}
}

/** @internal Reused transformed primitive. Orthogonal positive TRS only: shear/reflection are rejected. */
export class Shape3D {
  readonly center = new Vector3();
  readonly axes = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1),
  ];
  readonly half = new Vector3();
  readonly start = new Vector3();
  readonly end = new Vector3();
  readonly normal = new Vector3();
  readonly bounds = new Bounds3D();
  readonly vertices = Array.from({ length: 8 }, () => new Vector3());
  readonly triangles: Triangle3D[] = [];
  readonly triangleIndex: SpatialIndex3D<Triangle3D> | undefined;
  private readonly meshMatrix: Float64Array | undefined;
  radius = 0;
  constructor(readonly collider: Collider3D) {
    if (collider instanceof TriangleMeshCollider3D) {
      this.triangleIndex = new SpatialIndex3D<Triangle3D>();
      this.meshMatrix = new Float64Array(16).fill(NaN);
      for (let i = 0; i < collider.indices.length / 3; i++)
        this.triangles.push(new Triangle3D(i));
    }
  }
  refresh(object: Object3D): void {
    this.refreshMatrix(object.updateWorldMatrix());
  }
  refreshMatrix(matrix: Matrix4): void {
    const e = matrix.elements;
    const x = this.axes[0].set(e[0], e[1], e[2]),
      y = this.axes[1].set(e[4], e[5], e[6]),
      z = this.axes[2].set(e[8], e[9], e[10]);
    const sx = positive3D(x.length(), 'world scale.x'),
      sy = positive3D(y.length(), 'world scale.y'),
      sz = positive3D(z.length(), 'world scale.z');
    x.scale(1 / sx);
    y.scale(1 / sy);
    z.scale(1 / sz);
    if (
      Math.abs(x.dot(y)) > 0.00001 ||
      Math.abs(x.dot(z)) > 0.00001 ||
      Math.abs(y.dot(z)) > 0.00001 ||
      x.x * (y.y * z.z - y.z * z.y) -
        x.y * (y.x * z.z - y.z * z.x) +
        x.z * (y.x * z.y - y.y * z.x) <
        0.9999
    )
      throw new RangeError(
        '3D physics requires positive orthogonal world transforms (no shear/reflection).',
      );
    const o = this.collider.offset;
    this.center.set(
      e[12] + e[0] * o.x + e[4] * o.y + e[8] * o.z,
      e[13] + e[1] * o.x + e[5] * o.y + e[9] * o.z,
      e[14] + e[2] * o.x + e[6] * o.y + e[10] * o.z,
    );
    if (
      !Number.isFinite(this.center.x) ||
      !Number.isFinite(this.center.y) ||
      !Number.isFinite(this.center.z)
    )
      throw new RangeError('Transformed collider center must be finite.');
    if (
      this.collider instanceof SphereCollider3D ||
      this.collider instanceof CapsuleCollider3D
    ) {
      if (
        Math.abs(sx - sy) > 0.00001 * Math.max(sx, sy) ||
        Math.abs(sx - sz) > 0.00001 * Math.max(sx, sz)
      )
        throw new RangeError('Sphere/capsule require uniform world scale.');
      this.radius = this.collider.radius * sx;
      const h =
        this.collider instanceof CapsuleCollider3D
          ? (this.collider.height * sy) / 2
          : 0;
      this.start.set(
        this.center.x - y.x * h,
        this.center.y - y.y * h,
        this.center.z - y.z * h,
      );
      this.end.set(
        this.center.x + y.x * h,
        this.center.y + y.y * h,
        this.center.z + y.z * h,
      );
    } else if (this.collider instanceof BoxCollider3D) {
      const h = this.collider.halfExtents;
      this.half.set(h.x * sx, h.y * sy, h.z * sz);
      for (let i = 0; i < 8; i++) {
        const a = (i & 1 ? 1 : -1) * this.half.x,
          b = (i & 2 ? 1 : -1) * this.half.y,
          c = (i & 4 ? 1 : -1) * this.half.z;
        this.vertices[i].set(
          this.center.x + x.x * a + y.x * b + z.x * c,
          this.center.y + x.y * a + y.y * b + z.y * c,
          this.center.z + x.z * a + y.z * b + z.z * c,
        );
      }
    } else if (this.collider instanceof PlaneCollider3D) {
      const n = this.collider.normal;
      this.normal
        .set(
          (x.x * n.x) / sx + (y.x * n.y) / sy + (z.x * n.z) / sz,
          (x.y * n.x) / sx + (y.y * n.y) / sy + (z.y * n.z) / sz,
          (x.z * n.x) / sx + (y.z * n.y) / sy + (z.z * n.z) / sz,
        )
        .normalize();
    }
    if (this.collider instanceof TriangleMeshCollider3D) {
      let changed = false;
      const cache = this.meshMatrix!,
        index = this.triangleIndex!;
      for (let i = 0; i < 16; i++) if (cache[i] !== e[i]) changed = true;
      if (changed) {
        const c = this.collider,
          p = c.positions,
          ix = c.indices;
        for (const t of this.triangles) {
          for (let j = 0; j < 3; j++) {
            const v = j === 0 ? t.a : j === 1 ? t.b : t.c,
              at = ix[t.order * 3 + j] * 3;
            const px = p[at] + o.x,
              py = p[at + 1] + o.y,
              pz = p[at + 2] + o.z;
            v.set(
              e[12] + e[0] * px + e[4] * py + e[8] * pz,
              e[13] + e[1] * px + e[5] * py + e[9] * pz,
              e[14] + e[2] * px + e[6] * py + e[10] * pz,
            );
            if (
              !Number.isFinite(v.x) ||
              !Number.isFinite(v.y) ||
              !Number.isFinite(v.z)
            )
              throw new RangeError('Transformed mesh vertices must be finite.');
          }
          const ux = t.b.x - t.a.x,
            uy = t.b.y - t.a.y,
            uz = t.b.z - t.a.z;
          const vx = t.c.x - t.a.x,
            vy = t.c.y - t.a.y,
            vz = t.c.z - t.a.z;
          positive3D(
            Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx),
            'transformed triangle area',
          );
          t.normal
            .set(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx)
            .normalize();
          t.bounds.reset();
          t.bounds.add(t.a);
          t.bounds.add(t.b);
          t.bounds.add(t.c);
        }
        if (Number.isNaN(cache[0])) index.rebuild(this.triangles);
        else index.refit();
        for (let i = 0; i < 16; i++) cache[i] = e[i];
        this.updateBounds();
      }
      return;
    }
    this.updateBounds();
  }
  validateMoving(type: 'dynamic' | 'kinematic' | 'static'): void {
    if (
      type !== 'static' &&
      (this.collider.kind === 'plane' || this.collider.kind === 'mesh')
    )
      throw new Error('Triangle mesh/plane geometry is static only.');
  }
  updateBounds(): void {
    const b = this.bounds;
    b.reset();
    if (this.collider.kind === 'plane') {
      b.min.set(-Infinity, -Infinity, -Infinity);
      b.max.set(Infinity, Infinity, Infinity);
    } else if (this.collider.kind === 'box') {
      for (const p of this.vertices) b.add(p);
    } else if (this.collider.kind === 'mesh') {
      for (const t of this.triangles) {
        b.add(t.bounds.min);
        b.add(t.bounds.max);
      }
    } else {
      b.min.set(
        Math.min(this.start.x, this.end.x) - this.radius,
        Math.min(this.start.y, this.end.y) - this.radius,
        Math.min(this.start.z, this.end.z) - this.radius,
      );
      b.max.set(
        Math.max(this.start.x, this.end.x) + this.radius,
        Math.max(this.start.y, this.end.y) + this.radius,
        Math.max(this.start.z, this.end.z) + this.radius,
      );
    }
  }
  translate(x: number, y: number, z: number): void {
    this.center.x += x;
    this.center.y += y;
    this.center.z += z;
    if (this.collider.kind === 'box') {
      for (const p of this.vertices) {
        p.x += x;
        p.y += y;
        p.z += z;
      }
    } else if (
      this.collider.kind === 'sphere' ||
      this.collider.kind === 'capsule'
    ) {
      this.start.x += x;
      this.start.y += y;
      this.start.z += z;
      this.end.x += x;
      this.end.y += y;
      this.end.z += z;
    }

    this.bounds.min.x += x;
    this.bounds.min.y += y;
    this.bounds.min.z += z;
    this.bounds.max.x += x;
    this.bounds.max.y += y;
    this.bounds.max.z += z;
  }
}
