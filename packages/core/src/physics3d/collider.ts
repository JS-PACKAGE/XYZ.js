import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import { Bounds3D } from './spatial.js';

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
/** Immutable primitive descriptor. One primitive per Object3D; no compound/mesh shapes. */
export abstract class Collider3D {
  abstract readonly kind: 'sphere' | 'box' | 'capsule' | 'plane';
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
  radius = 0;
  constructor(readonly collider: Collider3D) {}
  refresh(object: Object3D): void {
    const e = object.updateWorldMatrix().elements;
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
    this.updateBounds();
  }
  updateBounds(): void {
    const b = this.bounds;
    b.reset();
    if (this.collider.kind === 'plane') {
      b.min.set(-Infinity, -Infinity, -Infinity);
      b.max.set(Infinity, Infinity, Infinity);
    } else if (this.collider.kind === 'box') {
      for (const p of this.vertices) b.add(p);
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
