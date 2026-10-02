import { Matrix4, Quaternion, Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { RigidBody3D } from './body.js';
import { Shape3D, Triangle3D, TriangleMeshCollider3D } from './collider.js';
import { Manifold3D, Narrowphase3D } from './geometry.js';
import { Bounds3D } from './spatial.js';
import { physics3DDefaults } from '../../../../src/data/physics3d.js';

export interface CcdEntry3D {
  readonly object: Object3D;
  readonly shape: Shape3D;
  readonly body: RigidBody3D | undefined;
  ccdShape: Shape3D | undefined;
  ccdStopped: boolean;
}
/** @internal Exact constant world-angular-velocity exponential, shared by the CCD path and integration. */
export function integrateRotation3D(
  rotation: Readonly<Quaternion>,
  angular: Readonly<Vector3>,
  dt: number,
  out: Quaternion,
): void {
  const speed = Math.hypot(angular.x, angular.y, angular.z),
    half = (speed * dt) / 2,
    s = speed > 1e-12 ? Math.sin(half) / speed : dt / 2,
    x = angular.x * s,
    y = angular.y * s,
    z = angular.z * s,
    w = Math.cos(half),
    qx = rotation.x,
    qy = rotation.y,
    qz = rotation.z,
    qw = rotation.w;
  out
    .set(
      w * qx + x * qw + y * qz - z * qy,
      w * qy - x * qz + y * qw + z * qx,
      w * qz + x * qy - y * qx + z * qw,
      w * qw - x * qx - y * qy - z * qz,
    )
    .normalize();
}
/** @internal Upper bound on every point's distance to the moving root's center of mass. */
export function motionRadius3D(entry: CcdEntry3D): number {
  const b = entry.shape.bounds,
    p = entry.object.position;
  return Math.hypot(
    Math.max(Math.abs(b.min.x - p.x), Math.abs(b.max.x - p.x)),
    Math.max(Math.abs(b.min.y - p.y), Math.abs(b.max.y - p.y)),
    Math.max(Math.abs(b.min.z - p.z), Math.abs(b.max.z - p.z)),
  );
}
/** @internal Rotating round radii are invariant; only box vertices and round centers/segment ends sweep. */
export function rotationalSweepSpeed3D(entry: CcdEntry3D): number {
  const body = entry.body;
  if (
    !body ||
    body.type === 'static' ||
    body.lockRotation ||
    body.isSleeping ||
    entry.ccdStopped
  )
    return 0;
  const w = body.angularVelocity,
    shape = entry.shape,
    origin = shape.center;
  let speed = 0;
  const children =
    shape.collider.kind === 'compound' ? shape.children.length : 1;
  for (let i = 0; i < children; i++) {
    const leaf = shape.collider.kind === 'compound' ? shape.children[i] : shape,
      points =
        leaf.collider.kind === 'box'
          ? 8
          : leaf.collider.kind === 'capsule'
            ? 2
            : 1;
    for (let j = 0; j < points; j++) {
      const p =
          leaf.collider.kind === 'box'
            ? leaf.vertices[j]
            : leaf.collider.kind === 'capsule'
              ? j === 0
                ? leaf.start
                : leaf.end
              : leaf.center,
        x = p.x - origin.x,
        y = p.y - origin.y,
        z = p.z - origin.z;
      speed = Math.max(
        speed,
        Math.hypot(w.y * z - w.z * y, w.z * x - w.x * z, w.x * y - w.y * x),
      );
    }
  }
  return speed;
}
/** @internal Translation plus an arc-length bound, capped by the diameter, encloses the entire rigid sweep. */
export function rigidSweptBounds3D(
  entry: CcdEntry3D,
  dt: number,
  out: Bounds3D,
  displacement: Vector3,
): void {
  const b = entry.body;
  if (!b || b.type === 'static' || b.isSleeping || entry.ccdStopped) {
    out.union(entry.shape.bounds, entry.shape.bounds);
    return;
  }
  displacement.set(b.velocity.x * dt, b.velocity.y * dt, b.velocity.z * dt);
  const speed = rotationalSweepSpeed3D(entry),
    margin = speed > 0 ? Math.min(2 * motionRadius3D(entry), speed * dt) : 0;
  out.swept(
    entry.shape.bounds,
    displacement,
    margin + physics3DDefaults.sweepTolerance,
  );
}

/** @internal Bounded conservative advancement. SAT separation is a safe lower bound, never an AABB proxy hit. */
export class ContinuousCollision3D {
  private readonly matrixA = new Matrix4();
  private readonly matrixB = new Matrix4();
  private readonly position = new Vector3();
  private readonly rotation = new Quaternion();
  private readonly narrow = new Narrowphase3D();
  private readonly leaf = new Manifold3D();
  readonly manifold = new Manifold3D();
  private readonly triangles: Triangle3D[] = [];
  private readonly boundsA = new Bounds3D();
  private readonly boundsB = new Bounds3D();
  private readonly displacement = new Vector3();
  iterations = 0;
  exhausted = false;
  safeTime = Infinity;
  private sample(entry: CcdEntry3D, dt: number, matrix: Matrix4): Shape3D {
    const body = entry.body,
      object = entry.object;
    if (!body || body.type === 'static' || body.isSleeping || entry.ccdStopped)
      return entry.shape;
    this.position.set(
      object.position.x + body.velocity.x * dt,
      object.position.y + body.velocity.y * dt,
      object.position.z + body.velocity.z * dt,
    );
    if (body.lockRotation) this.rotation.copy(object.rotation);
    else
      integrateRotation3D(
        object.rotation,
        body.angularVelocity,
        dt,
        this.rotation,
      );
    const shape =
      entry.ccdShape ?? (entry.ccdShape = new Shape3D(entry.shape.collider));
    shape.refreshMatrix(
      matrix.compose(this.position, this.rotation, object.scale),
    );
    return shape;
  }
  private keep(out: Manifold3D): void {
    const m = this.leaf;
    if (m.distance >= out.distance) return;
    out.distance = m.distance;
    out.normal.copy(m.normal);
    out.count = m.count;
    for (let i = 0; i < m.count; i++) {
      out.points[i].copy(m.points[i]);
      out.normals[i].copy(m.normals[i]);
      out.depths[i] = m.depths[i];
    }
  }
  private distance(
    a: Shape3D,
    b: Shape3D,
    initialA: Shape3D,
    initialB: Shape3D,
    out: Manifold3D,
  ): void {
    const ac = a.collider.kind === 'compound' ? a.children.length : 1,
      bc = b.collider.kind === 'compound' ? b.children.length : 1;
    for (let i = 0; i < ac; i++)
      for (let j = 0; j < bc; j++) {
        const sa = a.collider.kind === 'compound' ? a.children[i] : a,
          sb = b.collider.kind === 'compound' ? b.children[j] : b,
          ia =
            initialA.collider.kind === 'compound'
              ? initialA.children[i]
              : initialA,
          ib =
            initialB.collider.kind === 'compound'
              ? initialB.children[j]
              : initialB;
        const mesh =
          sa.collider.kind === 'mesh'
            ? sa
            : sb.collider.kind === 'mesh'
              ? sb
              : undefined;
        if (!mesh) {
          this.narrow.collide(sa, sb, this.leaf);
          this.keep(out);
          continue;
        }
        const moving = mesh === sa ? sb : sa,
          initial = mesh === sa ? ib : ia;
        if (moving.collider.kind === 'mesh' || moving.collider.kind === 'plane')
          continue;
        mesh.triangleIndex!.query(
          mesh === sa ? this.boundsB : this.boundsA,
          this.triangles,
        );
        for (const triangle of this.triangles) {
          if (
            (mesh.collider as TriangleMeshCollider3D).sidedness === 'front' &&
            (initial.center.x - triangle.a.x) * triangle.normal.x +
              (initial.center.y - triangle.a.y) * triangle.normal.y +
              (initial.center.z - triangle.a.z) * triangle.normal.z <
              -physics3DDefaults.sweepTolerance
          )
            continue;
          this.narrow.triangle(moving, triangle, this.leaf);
          if (mesh === sa) this.leaf.flip();
          this.keep(out);
        }
      }
  }
  private contactClosing(a: CcdEntry3D, b: CcdEntry3D, time: number): number {
    let closing = -Infinity;
    const m = this.manifold;
    for (let i = 0; i < m.count; i++) {
      const p = m.points[i],
        n = m.normals[i];
      let speed = 0;
      for (let side = 0; side < 2; side++) {
        const entry = side === 0 ? a : b,
          body = entry.body;
        if (
          !body ||
          body.type === 'static' ||
          body.isSleeping ||
          entry.ccdStopped
        )
          continue;
        const o = entry.object.position,
          v = body.velocity,
          w = body.angularVelocity,
          x = p.x - o.x - v.x * time,
          y = p.y - o.y - v.y * time,
          z = p.z - o.z - v.z * time;
        const angular = body.lockRotation
          ? 0
          : (w.y * z - w.z * y) * n.x +
            (w.z * x - w.x * z) * n.y +
            (w.x * y - w.y * x) * n.z;
        speed += (side === 0 ? -1 : 1) * (v.dot(n) + angular);
      }
      closing = Math.max(closing, speed);
    }
    return closing;
  }
  timeOfImpact(
    a: CcdEntry3D,
    b: CcdEntry3D,
    duration: number,
    limit: number,
  ): number {
    this.iterations = 0;
    this.exhausted = false;
    this.safeTime = Infinity;
    rigidSweptBounds3D(a, duration, this.boundsA, this.displacement);
    rigidSweptBounds3D(b, duration, this.boundsB, this.displacement);
    if (!this.boundsA.overlaps(this.boundsB)) return Infinity;
    const ba = a.body,
      bb = b.body,
      movingA = !!ba && ba.type !== 'static' && !ba.isSleeping && !a.ccdStopped,
      movingB = !!bb && bb.type !== 'static' && !bb.isSleeping && !b.ccdStopped,
      vx = (movingA ? ba.velocity.x : 0) - (movingB ? bb.velocity.x : 0),
      vy = (movingA ? ba.velocity.y : 0) - (movingB ? bb.velocity.y : 0),
      vz = (movingA ? ba.velocity.z : 0) - (movingB ? bb.velocity.z : 0),
      rotational = rotationalSweepSpeed3D(a) + rotationalSweepSpeed3D(b);
    if (Math.hypot(vx, vy, vz) + rotational < 1e-12) return Infinity;
    let t = 0;
    for (; this.iterations < physics3DDefaults.ccdIterations;) {
      ++this.iterations;
      const sa = this.sample(a, t, this.matrixA),
        sb = this.sample(b, t, this.matrixB),
        m = this.manifold;
      m.distance = Infinity;
      m.count = 0;
      this.distance(sa, sb, a.shape, b.shape, m);
      if (!Number.isFinite(m.distance)) return Infinity;
      const rate =
        -(vx * m.normal.x + vy * m.normal.y + vz * m.normal.z) + rotational;
      if (m.distance <= physics3DDefaults.sweepTolerance) {
        if (
          t > 0 ||
          this.contactClosing(a, b, t) > 1e-8 ||
          m.distance < -physics3DDefaults.contactSlop
        )
          return t;
        if (rotational === 0 || rate <= 1e-12) return Infinity;
        // A resting/separating rotational contact has no fabricated impact. Only the prefix with
        // at most the contact tolerance of motion can be certified in this bounded pass.
        this.safeTime = t;
        this.exhausted = true;
        return Infinity;
      }
      if (rate <= 1e-12) return Infinity;
      const advance =
        (m.distance - physics3DDefaults.sweepTolerance * 0.5) / rate;
      if (t + advance > limit || t + advance > duration) return Infinity;
      t += advance;
    }
    // Exhaustion cannot produce a made-up hit or integrate an unproven suffix.
    this.exhausted = true;
    this.safeTime = t;
    return Infinity;
  }
}
