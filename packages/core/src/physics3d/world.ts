import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import {
  Shape3D,
  SphereCollider3D,
  CapsuleCollider3D,
  Triangle3D,
  TriangleMeshCollider3D,
  finite3D,
  positive3D,
  vector3D,
} from './collider.js';
import type { Collider3D } from './collider.js';
import type { RigidBody3D } from './body.js';
import { Manifold3D, Narrowphase3D } from './geometry.js';
import { physics3DDefaults } from '../../../../src/data/physics3d.js';
import { PhysicsForceAccumulator } from '../physics-force.js';
import { Bounds3D, SpatialIndex3D } from './spatial.js';
export interface PhysicsStats3D {
  readonly candidatePairs: number;
  readonly narrowphaseTests: number;
  readonly queryCandidates: number;
}
const alwaysContinue = (): boolean => true;
export interface PhysicsWorldOptions3D {
  gravity?: Readonly<Vector3>;
  fixedDelta?: number;
  maxSubSteps?: number;
  solverIterations?: number;
}
export interface PhysicsQueryOptions3D {
  mask?: number;
  includeSensors?: boolean;
  ignore?: Object3D;
}
export interface PhysicsHit3D {
  object: Object3D;
  collider: Collider3D;
  point: Vector3;
  normal: Vector3;
  distance: number;
}
export interface PhysicsContact3D {
  readonly self: Object3D;
  readonly other: Object3D;
  readonly normal: Readonly<Vector3>;
  readonly point: Readonly<Vector3>;
  readonly sensor: boolean;
}
interface Entry3D {
  object: Object3D;
  shape: Shape3D;
  body: RigidBody3D | undefined;
  readonly bounds: Bounds3D;
  readonly order: number;
}
class Contact3D {
  readonly manifold = new Manifold3D();
  readonly normalImpulses = new Float64Array(8);
  readonly tangentImpulses = new Float64Array(8);
  readonly targets = new Float64Array(8);
  readonly tangent = Array.from({ length: 8 }, () => new Vector3());
  seen = 0;
  started = false;
  ended = false;
  detailA: PhysicsContact3D | undefined;
  detailB: PhysicsContact3D | undefined;
  constructor(
    readonly a: Entry3D,
    readonly b: Entry3D,
  ) {}
}
/** Deterministic primitive/mesh/compound solver; optional bounded static-target translation CCD. No joints or rotational/dynamic-pair CCD. */
export class PhysicsWorld3D {
  readonly gravity = new Vector3(0, -9.81, 0);
  readonly fixedDelta: number;
  readonly maxSubSteps: number;
  readonly solverIterations: number;
  /** Disabling freezes fixed-step time and contacts without accumulating catch-up work. */
  enabled = true;
  private readonly entries = new Map<Object3D, Entry3D>();
  private readonly ordered: Entry3D[] = [];
  private readonly index = new SpatialIndex3D<Entry3D>();
  private readonly pairCandidates: Entry3D[] = [];
  private readonly queryCandidates: Entry3D[] = [];
  private readonly queryBounds = new Bounds3D();
  private readonly sweepTriangles: Triangle3D[] = [];
  private readonly leafBounds = new Bounds3D();
  private indexDirty = true;
  private nextOrder = 0;
  private readonly counters = {
    candidatePairs: 0,
    narrowphaseTests: 0,
    queryCandidates: 0,
  };
  readonly stats: PhysicsStats3D = this.counters;
  private readonly contacts = new Map<Entry3D, Map<Entry3D, Contact3D>>();
  private readonly active: Contact3D[] = [];
  private readonly narrow = new Narrowphase3D();
  private readonly queryNarrow = new Narrowphase3D();
  private readonly queryManifold = new Manifold3D();
  private readonly queryShape = new Shape3D(new SphereCollider3D(1));
  private readonly impulse = new Vector3();
  private readonly crossA = new Vector3();
  private readonly crossB = new Vector3();
  private readonly inertiaA = new Vector3();
  private readonly inertiaB = new Vector3();
  private readonly relative = new Vector3();
  private readonly ccdDisplacement = new Vector3();
  private readonly ccdOptions: PhysicsQueryOptions3D = {};
  private ccdHit: PhysicsHit3D | undefined;
  private sweepSafeFraction = 1;
  private readonly torque = new Vector3();
  private readonly forces = new WeakMap<RigidBody3D, PhysicsForceAccumulator>();
  private accumulator = 0;
  private stepId = 0;
  private disposed = false;
  private destroying = false;
  private stepping = false;
  droppedTime = 0;
  constructor(options: PhysicsWorldOptions3D = {}) {
    if (options.gravity) {
      vector3D(options.gravity, 'gravity');
      this.gravity.set(options.gravity.x, options.gravity.y, options.gravity.z);
    }
    this.fixedDelta = positive3D(
      options.fixedDelta ?? physics3DDefaults.fixedDelta,
      'fixedDelta',
    );
    this.maxSubSteps = options.maxSubSteps ?? physics3DDefaults.maxSubSteps;
    this.solverIterations =
      options.solverIterations ?? physics3DDefaults.solverIterations;
    if (
      !Number.isInteger(this.maxSubSteps) ||
      this.maxSubSteps < 1 ||
      !Number.isInteger(this.solverIterations) ||
      this.solverIterations < 1
    )
      throw new RangeError('Step/iteration counts must be positive integers.');
  }
  has(object: Object3D): boolean {
    return this.entries.has(object);
  }
  get size(): number {
    return this.entries.size;
  }
  /** @internal Preflight before changing either attachment or hierarchy. */
  validate(object: Object3D): void {
    const c = object.collider,
      b = object.body;
    if (b?.type !== 'static' && b && object.parent)
      throw new Error('Dynamic/kinematic bodies require root Object3D.');
    if (c && b && b.type !== 'static') {
      if (c.kind === 'plane' || c.kind === 'mesh')
        throw new Error(
          'PlaneCollider3D/TriangleMeshCollider3D are static only.',
        );
      if (c.offset.x !== 0 || c.offset.y !== 0 || c.offset.z !== 0)
        throw new Error(
          'Moving body collider offsets are unsupported (origin is center of mass).',
        );
    }
    if (c) {
      const previous = this.entries.get(object)?.shape;
      const shape = previous?.collider === c ? previous : new Shape3D(c);
      shape.refresh(object);
      if (b) shape.validateMoving(b.type);
    }
  }
  /** @internal Transactional attachment replacement; old contacts end only after validation succeeds. */
  register(object: Object3D): void {
    if (this.disposed) throw new Error('PhysicsWorld3D is destroyed.');
    this.validate(object);
    const previous = this.entries.get(object),
      c = object.collider;
    if (
      previous &&
      previous.shape.collider === c &&
      previous.body === object.body
    )
      return;
    const scene = object.scene,
      generation = object.registrationGeneration;
    const shape = c ? new Shape3D(c) : undefined;
    const next = shape
      ? {
          object,
          shape,
          body: object.body,
          bounds: shape.bounds,
          order: this.nextOrder++,
        }
      : undefined;
    if (next) {
      next.shape.refresh(object);
      next.body?.refreshInertia(next.shape);
    }
    if (previous) this.unregister(object);
    if (
      next &&
      !object.destroyed &&
      object.collider === c &&
      object.body === next.body &&
      object.scene === scene &&
      object.registrationGeneration === generation &&
      !this.entries.has(object)
    ) {
      this.entries.set(object, next);
      this.ordered.push(next);
      this.indexDirty = true;
    }
  }
  unregister(object: Object3D): void {
    const entry = this.entries.get(object);
    if (!entry) return;
    this.entries.delete(object);
    if (entry.body) this.forces.delete(entry.body);
    const index = this.ordered.indexOf(entry);
    if (index !== -1) this.ordered.splice(index, 1);
    this.indexDirty = true;
    for (const [a, row] of this.contacts) {
      for (const [b, c] of row)
        if (a === entry || b === entry) {
          row.delete(b);
          this.end(c);
        }
      if (row.size === 0) this.contacts.delete(a);
    }
  }
  private valid(entry: Entry3D): boolean {
    return (
      !this.disposed &&
      !entry.object.destroyed &&
      this.entries.get(entry.object) === entry
    );
  }
  private start(c: Contact3D): void {
    c.started = true;
    const m = c.manifold,
      p = m.points[0],
      n = m.normal,
      sensor = c.a.shape.collider.sensor || c.b.shape.collider.sensor;
    c.detailA = Object.freeze({
      self: c.a.object,
      other: c.b.object,
      point: Object.freeze(p.clone()),
      normal: Object.freeze(n.clone()),
      sensor,
    });
    c.detailB = Object.freeze({
      self: c.b.object,
      other: c.a.object,
      point: c.detailA.point,
      normal: Object.freeze(n.clone().scale(-1)),
      sensor,
    });
    c.a.object.dispatchObjectEvent('collisionstart', c.detailA);
    if (this.valid(c.a) && this.valid(c.b))
      c.b.object.dispatchObjectEvent('collisionstart', c.detailB);
  }
  private end(c: Contact3D): void {
    if (c.ended || !c.started) return;
    c.ended = true;
    if (
      !this.destroying &&
      !c.a.shape.collider.sensor &&
      !c.b.shape.collider.sensor
    ) {
      if (
        this.valid(c.a) &&
        c.a.body?.type === 'dynamic' &&
        c.a.body.isSleeping
      )
        c.a.body.wake();
      if (
        this.valid(c.b) &&
        c.b.body?.type === 'dynamic' &&
        c.b.body.isSleeping
      )
        c.b.body.wake();
    }
    if (this.valid(c.a))
      c.a.object.dispatchObjectEvent('collisionend', c.detailA);
    if (this.valid(c.b))
      c.b.object.dispatchObjectEvent('collisionend', c.detailB);
  }
  private forceState(body: RigidBody3D): PhysicsForceAccumulator {
    let state = this.forces.get(body);
    if (!state) this.forces.set(body, (state = new PhysicsForceAccumulator()));
    return state;
  }
  /** @internal Sample once per gameplay frame, even when no fixed tick is due. */
  sampleForces(delta: number): void {
    for (const entry of this.ordered)
      if (entry.body?.type === 'dynamic')
        this.forceState(entry.body).sample(entry.body, delta);
  }
  /** @internal Forces from fixed gameplay are impulses over that exact tick. */
  sampleFixedForces(delta: number): void {
    for (const entry of this.ordered)
      if (entry.body?.type === 'dynamic')
        this.forceState(entry.body).sampleFixed(entry.body, delta);
  }
  /** @internal Discard only simulation time omitted by the scene catch-up limit. */
  discardFrameTime(delta: number): void {
    for (const entry of this.ordered)
      if (entry.body) this.forces.get(entry.body)?.discard(delta);
  }
  get interpolationAlpha(): number {
    return Math.min(1, Math.max(0, this.accumulator / this.fixedDelta));
  }
  update(
    delta: number,
    canContinue: () => boolean = alwaysContinue,
    sampleFrame = true,
  ): void {
    finite3D(delta, 'delta');
    if (delta < 0) throw new RangeError('delta must be nonnegative.');
    if (this.disposed || !this.enabled || !canContinue()) return;
    if (this.stepping) throw new Error('Physics update is not reentrant.');
    if (sampleFrame) this.sampleForces(delta);
    this.accumulator += delta;
    const cap = this.fixedDelta * this.maxSubSteps;
    if (this.accumulator > cap) {
      this.droppedTime += this.accumulator - cap;
      for (const entry of this.ordered)
        if (entry.body)
          this.forces.get(entry.body)?.discard(this.accumulator - cap);
      this.accumulator = cap;
    }
    this.stepping = true;
    try {
      let count = 0;
      while (
        this.accumulator + 1e-12 >= this.fixedDelta &&
        count++ < this.maxSubSteps &&
        this.enabled &&
        canContinue() &&
        !this.disposed
      ) {
        this.accumulator -= this.fixedDelta;
        this.step(this.fixedDelta, canContinue);
      }
    } finally {
      this.stepping = false;
    }
  }
  private step(dt: number, canContinue: () => boolean): void {
    ++this.stepId;
    this.active.length = 0;
    this.refreshIndex();
    for (const e of this.ordered) {
      this.validate(e.object);
      const b = e.body;
      if (!b) continue;
      b.refreshInertia(e.shape);
      vector3D(b.velocity, 'velocity');
      vector3D(b.angularVelocity, 'angularVelocity');
      if (b.type === 'static') continue;
      if (b.type === 'dynamic') {
        const force = this.forceState(b);
        force.consume(b, dt);
        // Sleeping ticks still consume their frame-time share; idle time must not dilute a later force.
        if (b.isSleeping) continue;
        b.velocity.x +=
          (this.gravity.x * b.gravityScale + force.value[0] * b.inverseMass) *
          dt;
        b.velocity.y +=
          (this.gravity.y * b.gravityScale + force.value[1] * b.inverseMass) *
          dt;
        b.velocity.z +=
          (this.gravity.z * b.gravityScale + force.value[2] * b.inverseMass) *
          dt;
        this.torque.set(force.value[3], force.value[4], force.value[5]);
        b.inverseInertia(this.torque, this.torque);
        b.angularVelocity.x += this.torque.x * dt;
        b.angularVelocity.y += this.torque.y * dt;
        b.angularVelocity.z += this.torque.z * dt;
        b.velocity.scale(1 / (1 + b.linearDamping * dt));
        b.angularVelocity.scale(1 / (1 + b.angularDamping * dt));
      }
      const o = e.object;
      o.capturePhysicsPose();
      if (!b.lockRotation) {
        const q = o.rotation,
          w = b.angularVelocity,
          x = q.x,
          y = q.y,
          z = q.z,
          s = q.w,
          h = dt / 2;
        q.set(
          x + h * (w.x * s + w.y * z - w.z * y),
          y + h * (-w.x * z + w.y * s + w.z * x),
          z + h * (w.x * y - w.y * x + w.z * s),
          s - h * (w.x * x + w.y * y + w.z * z),
        ).normalize();
      }
      e.shape.refresh(o);
      this.ccdDisplacement.set(
        b.velocity.x * dt,
        b.velocity.y * dt,
        b.velocity.z * dt,
      );
      let fraction = 1;
      if (b.type === 'dynamic' && b.continuous && !e.shape.collider.sensor) {
        this.ccdOptions.ignore = o;
        this.ccdOptions.mask = e.shape.collider.mask;
        this.ccdHit ??= {
          object: o,
          collider: e.shape.collider,
          point: new Vector3(),
          normal: new Vector3(),
          distance: 0,
        };
        const hit = this.sweepShape(
          e.shape,
          this.ccdDisplacement,
          this.ccdOptions,
          this.ccdHit,
          false,
          true,
        );
        if (hit)
          fraction = Math.min(1, hit.distance / this.ccdDisplacement.length());
        fraction = Math.min(fraction, this.sweepSafeFraction);
      }
      o.position.x += this.ccdDisplacement.x * fraction;
      o.position.y += this.ccdDisplacement.y * fraction;
      o.position.z += this.ccdDisplacement.z * fraction;
      e.shape.refresh(o);
      this.index.update(e);
      b.refreshInertia(e.shape);
    }
    this.counters.candidatePairs = 0;
    this.counters.narrowphaseTests = 0;
    for (const a of this.ordered) {
      this.index.query(
        a.bounds,
        this.pairCandidates,
        physics3DDefaults.contactMargin,
      );
      for (const b of this.pairCandidates) {
        if (b.order <= a.order) continue;
        this.counters.candidatePairs++;
        const ca = a.shape.collider,
          cb = b.shape.collider;
        if (!(ca.category & cb.mask) || !(cb.category & ca.mask)) continue;
        if (!a.body && !b.body && !ca.sensor && !cb.sensor) continue;
        let row = this.contacts.get(a);
        let contact = row?.get(b);
        this.counters.narrowphaseTests++;
        this.narrow.collide(a.shape, b.shape, this.queryManifold);
        if (this.queryManifold.distance > physics3DDefaults.contactMargin)
          continue;
        if (!contact) {
          contact = new Contact3D(a, b);
          if (!row) this.contacts.set(a, (row = new Map()));
          row.set(b, contact);
        }
        const m = contact.manifold,
          q = this.queryManifold;
        m.normal.copy(q.normal);
        m.distance = q.distance;
        m.count = q.count;
        for (let k = 0; k < m.count; k++) {
          m.points[k].copy(q.points[k]);
          m.normals[k].copy(q.normals[k]);
          m.depths[k] = q.depths[k];
          contact.normalImpulses[k] = 0;
          contact.tangentImpulses[k] = 0;
          this.velocityAt(a.body, m.points[k], this.relative);
          this.velocityAt(b.body, m.points[k], this.impulse);
          this.relative.subtract(this.impulse);
          const n = m.normals[k],
            vn = this.relative.dot(n),
            bounce = Math.max(
              a.body?.restitution ?? 0,
              b.body?.restitution ?? 0,
            );
          contact.targets[k] =
            vn < -physics3DDefaults.restitutionThreshold ? -vn * bounce : 0;
          contact.tangent[k].copy(this.relative);
          contact.tangent[k].x -= n.x * vn;
          contact.tangent[k].y -= n.y * vn;
          contact.tangent[k].z -= n.z * vn;
          contact.tangent[k].normalize();
        }
        contact.seen = this.stepId;
        this.active.push(contact);
      }
    }
    for (const [a, row] of this.contacts) {
      for (const [b, c] of row)
        if (c.seen !== this.stepId) {
          row.delete(b);
          this.end(c);
        }
      if (row.size === 0) this.contacts.delete(a);
    }
    for (const c of this.active) {
      if (!this.valid(c.a) || !this.valid(c.b)) continue;
      if (!c.started) this.start(c);
      if (!canContinue() || this.disposed) return;
    }
    for (let iteration = 0; iteration < this.solverIterations; iteration++)
      for (const c of this.active) {
        if (
          c.ended ||
          !this.valid(c.a) ||
          !this.valid(c.b) ||
          c.a.shape.collider.sensor ||
          c.b.shape.collider.sensor
        )
          continue;
        const a = c.a.body,
          b = c.b.body;
        if (
          a?.type === 'dynamic' &&
          a.isSleeping &&
          b &&
          b.type !== 'static' &&
          !b.isSleeping &&
          this.movingAtContact(b, c.manifold)
        )
          a.wake();
        if (
          b?.type === 'dynamic' &&
          b.isSleeping &&
          a &&
          a.type !== 'static' &&
          !a.isSleeping &&
          this.movingAtContact(a, c.manifold)
        )
          b.wake();
        if (
          (!a || a.type !== 'dynamic' || a.isSleeping) &&
          (!b || b.type !== 'dynamic' || b.isSleeping)
        )
          continue;
        for (let k = 0; k < c.manifold.count; k++) this.solve(c, k);
      }
    for (const c of this.active) {
      if (
        c.ended ||
        !this.valid(c.a) ||
        !this.valid(c.b) ||
        c.a.shape.collider.sensor ||
        c.b.shape.collider.sensor
      )
        continue;
      const a = c.a.body,
        b = c.b.body,
        ma = a?.inverseMass ?? 0,
        mb = b?.inverseMass ?? 0,
        sum = ma + mb;
      if (sum === 0) continue;
      if (
        c.a.shape.collider.kind === 'compound' ||
        c.b.shape.collider.kind === 'compound' ||
        c.a.shape.collider.kind === 'mesh' ||
        c.b.shape.collider.kind === 'mesh'
      ) {
        const m = c.manifold;
        for (let k = 0; k < m.count; k++) {
          const correction =
              (Math.max(0, m.depths[k] - physics3DDefaults.contactSlop) *
                physics3DDefaults.correction) /
              (sum * m.count),
            n = m.normals[k];
          if (ma && a && !a.isSleeping) {
            const p = c.a.object.position;
            p.x += n.x * correction * ma;
            p.y += n.y * correction * ma;
            p.z += n.z * correction * ma;
          }
          if (mb && b && !b.isSleeping) {
            const p = c.b.object.position;
            p.x -= n.x * correction * mb;
            p.y -= n.y * correction * mb;
            p.z -= n.z * correction * mb;
          }
        }
        continue;
      }
      const correction =
          (Math.max(0, -c.manifold.distance - physics3DDefaults.contactSlop) *
            physics3DDefaults.correction) /
          sum,
        n = c.manifold.normal;
      if (ma && a && !a.isSleeping) {
        const p = c.a.object.position;
        p.x += n.x * correction * ma;
        p.y += n.y * correction * ma;
        p.z += n.z * correction * ma;
      }
      if (mb && b && !b.isSleeping) {
        const p = c.b.object.position;
        p.x -= n.x * correction * mb;
        p.y -= n.y * correction * mb;
        p.z -= n.z * correction * mb;
      }
    }
    for (const e of this.ordered) {
      if (!this.valid(e)) continue;
      e.object.sealPhysicsPose();
      e.body?.updateSleep(dt);
    }
  }
  private velocityAt(
    body: RigidBody3D | undefined,
    point: Readonly<Vector3>,
    out: Vector3,
  ): void {
    if (!body || !body.owner) {
      out.set(0, 0, 0);
      return;
    }
    const p = body.owner.position,
      w = body.angularVelocity,
      x = point.x - p.x,
      y = point.y - p.y,
      z = point.z - p.z;
    out.set(
      body.velocity.x + w.y * z - w.z * y,
      body.velocity.y + w.z * x - w.x * z,
      body.velocity.z + w.x * y - w.y * x,
    );
  }
  private movingAtContact(body: RigidBody3D, manifold: Manifold3D): boolean {
    const threshold =
      physics3DDefaults.sleepVelocity * physics3DDefaults.sleepVelocity;
    for (let k = 0; k < manifold.count; k++) {
      this.velocityAt(body, manifold.points[k], this.relative);
      if (this.relative.dot(this.relative) > threshold) return true;
    }
    return false;
  }
  private effective(
    body: RigidBody3D | undefined,
    point: Readonly<Vector3>,
    axis: Readonly<Vector3>,
    cross: Vector3,
    inertia: Vector3,
  ): number {
    if (!body?.owner || body.type !== 'dynamic') return 0;
    const p = body.owner.position,
      x = point.x - p.x,
      y = point.y - p.y,
      z = point.z - p.z;
    cross.set(
      y * axis.z - z * axis.y,
      z * axis.x - x * axis.z,
      x * axis.y - y * axis.x,
    );
    body.inverseInertia(cross, inertia);
    return body.inverseMass + cross.dot(inertia);
  }
  private solverImpulse(
    body: RigidBody3D | undefined,
    point: Readonly<Vector3>,
    impulse: Readonly<Vector3>,
    sign: number,
  ): void {
    if (!body?.owner || body.type !== 'dynamic' || body.isSleeping) return;
    body.velocity.x += impulse.x * body.inverseMass * sign;
    body.velocity.y += impulse.y * body.inverseMass * sign;
    body.velocity.z += impulse.z * body.inverseMass * sign;
    const p = body.owner.position,
      x = point.x - p.x,
      y = point.y - p.y,
      z = point.z - p.z;
    this.torque.set(
      (y * impulse.z - z * impulse.y) * sign,
      (z * impulse.x - x * impulse.z) * sign,
      (x * impulse.y - y * impulse.x) * sign,
    );
    body.inverseInertia(this.torque, this.torque);
    body.angularVelocity.add(this.torque);
  }
  private solve(c: Contact3D, k: number): void {
    const a = c.a.body,
      b = c.b.body,
      m = c.manifold,
      p = m.points[k],
      n = m.normals[k];
    this.velocityAt(a, p, this.relative);
    this.velocityAt(b, p, this.impulse);
    this.relative.subtract(this.impulse);
    const den =
      this.effective(a, p, n, this.crossA, this.inertiaA) +
      this.effective(b, p, n, this.crossB, this.inertiaB);
    if (den < 1e-12) return;
    const previous = c.normalImpulses[k],
      next = Math.max(
        0,
        previous + (c.targets[k] - this.relative.dot(n)) / den,
      );
    c.normalImpulses[k] = next;
    this.impulse.set(
      n.x * (next - previous),
      n.y * (next - previous),
      n.z * (next - previous),
    );
    this.solverImpulse(a, p, this.impulse, 1);
    this.solverImpulse(b, p, this.impulse, -1);
    const t = c.tangent[k];
    if (t.length() < 1e-10) return;
    this.velocityAt(a, p, this.relative);
    this.velocityAt(b, p, this.impulse);
    this.relative.subtract(this.impulse);
    const td =
        this.effective(a, p, t, this.crossA, this.inertiaA) +
        this.effective(b, p, t, this.crossB, this.inertiaB),
      mu = Math.sqrt((a?.friction ?? 0.5) * (b?.friction ?? 0.5)),
      limit = mu * next;
    const old = c.tangentImpulses[k],
      value = Math.max(
        -limit,
        Math.min(limit, old - this.relative.dot(t) / td),
      );
    c.tangentImpulses[k] = value;
    this.impulse.set(
      t.x * (value - old),
      t.y * (value - old),
      t.z * (value - old),
    );
    this.solverImpulse(a, p, this.impulse, 1);
    this.solverImpulse(b, p, this.impulse, -1);
  }
  private refreshIndex(): void {
    // Public transforms are mutable; refresh is mandatory even for static/sleeping entries.
    for (const e of this.ordered) e.shape.refresh(e.object);
    if (this.indexDirty) {
      this.index.rebuild(this.ordered);
      this.indexDirty = false;
    } else this.index.refit();
  }
  private candidates(bounds: Bounds3D): void {
    this.refreshIndex();
    this.index.query(bounds, this.queryCandidates);
    this.counters.queryCandidates = this.queryCandidates.length;
  }
  private accepts(e: Entry3D, options: PhysicsQueryOptions3D): boolean {
    return (
      this.valid(e) &&
      e.object !== options.ignore &&
      (options.includeSensors || !e.shape.collider.sensor) &&
      !!(e.shape.collider.category & (options.mask ?? 0xffffffff))
    );
  }
  /** Exact primitive overlap; transformed query owner is not registered. Caller owns returned hits. */
  overlap(
    collider: Collider3D,
    object: Object3D,
    options: PhysicsQueryOptions3D = {},
  ): PhysicsHit3D[] {
    const shape = new Shape3D(collider);
    shape.refresh(object);
    const hits: PhysicsHit3D[] = [];
    this.candidates(shape.bounds);
    for (const e of this.queryCandidates) {
      if (!this.accepts(e, options)) continue;
      this.queryNarrow.collide(shape, e.shape, this.queryManifold);
      if (this.queryManifold.distance <= 0)
        hits.push({
          object: e.object,
          collider: e.shape.collider,
          point: this.queryManifold.points[0].clone(),
          normal: this.queryManifold.normal.clone(),
          distance: 0,
        });
    }
    return hits;
  }
  /** Closest world-distance ray hit. Inside starts report distance 0; normalized direction is not required. */
  raycast(
    origin: Readonly<Vector3>,
    direction: Readonly<Vector3>,
    maxDistance: number,
    options: PhysicsQueryOptions3D = {},
  ): PhysicsHit3D | undefined {
    vector3D(origin, 'origin');
    vector3D(direction, 'direction');
    positive3D(maxDistance, 'maxDistance');
    const len = positive3D(direction.length(), 'direction length');
    this.queryShape.center.set(origin.x, origin.y, origin.z);
    this.queryShape.start.copy(this.queryShape.center);
    this.queryShape.end.copy(this.queryShape.center);
    this.queryShape.radius = 0;
    this.queryShape.updateBounds();
    this.impulse.set(
      (direction.x / len) * maxDistance,
      (direction.y / len) * maxDistance,
      (direction.z / len) * maxDistance,
    );
    return this.sweepShape(
      this.queryShape,
      this.impulse,
      options,
      undefined,
      true,
    );
  }
  /** Translation-only conservative advancement against exact primitive distance. No AABB-expanded corner proxy. */
  sweepSphere(
    center: Readonly<Vector3>,
    radius: number,
    displacement: Readonly<Vector3>,
    options: PhysicsQueryOptions3D = {},
    out?: PhysicsHit3D,
  ): PhysicsHit3D | undefined {
    vector3D(center, 'center');
    positive3D(radius, 'radius');
    vector3D(displacement, 'displacement');
    this.queryShape.center.set(center.x, center.y, center.z);
    this.queryShape.start.copy(this.queryShape.center);
    this.queryShape.end.copy(this.queryShape.center);
    this.queryShape.radius = radius;
    this.queryShape.updateBounds();
    return this.sweepShape(this.queryShape, displacement, options, out, false);
  }
  sweepCapsule(
    object: Object3D,
    displacement: Readonly<Vector3>,
    options: PhysicsQueryOptions3D = {},
    out?: PhysicsHit3D,
  ): PhysicsHit3D | undefined {
    if (!(object.collider instanceof CapsuleCollider3D))
      throw new TypeError('Capsule sweep requires CapsuleCollider3D.');
    vector3D(displacement, 'displacement');
    const registered = this.entries.get(object);
    const shape = registered?.shape ?? new Shape3D(object.collider);
    shape.refresh(object);
    return this.sweepShape(shape, displacement, options, out, false);
  }
  /** @internal Bounded minimum-translation recovery from primitive overlaps; failure restores the original pose. */
  recoverCapsule(
    object: Object3D,
    limit: number,
    options: PhysicsQueryOptions3D,
  ): boolean {
    const entry = this.entries.get(object);
    if (!entry || !(object.collider instanceof CapsuleCollider3D))
      throw new Error('Recovery requires a registered capsule.');
    const p = object.position,
      x = p.x,
      y = p.y,
      z = p.z;
    let total = 0;
    for (
      let iteration = 0;
      iteration < physics3DDefaults.characterIterations;
      iteration++
    ) {
      let recovered = false;
      entry.shape.refresh(object);
      this.candidates(entry.bounds);
      for (const e of this.queryCandidates) {
        if (e === entry || !this.accepts(e, options)) continue;
        entry.shape.refresh(object);
        const m = this.queryManifold;
        this.queryNarrow.collide(entry.shape, e.shape, m);
        if (m.distance >= -physics3DDefaults.sweepTolerance) continue;
        const distance = -m.distance + physics3DDefaults.sweepTolerance;
        total += distance;
        if (total > limit) {
          p.set(x, y, z);
          return false;
        }
        p.x += m.normal.x * distance;
        p.y += m.normal.y * distance;
        p.z += m.normal.z * distance;
        recovered = true;
      }
      if (!recovered) return true;
    }
    p.set(x, y, z);
    return false;
  }
  /** Exact shape translation query. Mesh/plane query shapes are static-only and rejected. */
  sweep(
    collider: Collider3D,
    object: Object3D,
    displacement: Readonly<Vector3>,
    options: PhysicsQueryOptions3D = {},
    out?: PhysicsHit3D,
  ): PhysicsHit3D | undefined {
    vector3D(displacement, 'displacement');
    const entry = this.entries.get(object);
    const shape =
      entry?.shape.collider === collider ? entry.shape : new Shape3D(collider);
    shape.refresh(object);
    shape.validateMoving('kinematic');
    return this.sweepShape(shape, displacement, options, out, false);
  }
  private sweepShape(
    shape: Shape3D,
    displacement: Readonly<Vector3>,
    options: PhysicsQueryOptions3D,
    out: PhysicsHit3D | undefined,
    inside: boolean,
    staticOnly = false,
  ): PhysicsHit3D | undefined {
    const dx = displacement.x,
      dy = displacement.y,
      dz = displacement.z,
      len = Math.hypot(dx, dy, dz);
    if (len < 1e-12) return undefined;
    let nearest = 1 + 1e-10,
      result: PhysicsHit3D | undefined;
    this.sweepSafeFraction = 1;
    this.queryBounds.swept(
      shape.bounds,
      displacement,
      physics3DDefaults.sweepTolerance,
    );
    if (staticOnly) {
      this.index.query(this.queryBounds, this.queryCandidates);
      this.counters.queryCandidates = this.queryCandidates.length;
    } else this.candidates(this.queryBounds);
    for (const e of this.queryCandidates) {
      if (
        !this.accepts(e, options) ||
        e.shape === shape ||
        (staticOnly &&
          ((e.body && e.body.type !== 'static') ||
            e.shape.collider.sensor ||
            !(shape.collider.category & e.shape.collider.mask)))
      )
        continue;
      const movingCount =
        shape.collider.kind === 'compound' ? shape.children.length : 1;
      const targetCount =
        e.shape.collider.kind === 'compound' ? e.shape.children.length : 1;
      for (let i = 0; i < movingCount; i++)
        for (let j = 0; j < targetCount; j++) {
          const moving =
            shape.collider.kind === 'compound' ? shape.children[i] : shape;
          const target =
            e.shape.collider.kind === 'compound'
              ? e.shape.children[j]
              : e.shape;
          if (
            moving.collider.kind === 'mesh' ||
            moving.collider.kind === 'plane'
          )
            continue;
          this.leafBounds.swept(
            moving.bounds,
            displacement,
            physics3DDefaults.sweepTolerance,
          );
          if (!this.leafBounds.overlaps(target.bounds)) continue;
          if (target.collider instanceof TriangleMeshCollider3D)
            target.triangleIndex!.query(this.leafBounds, this.sweepTriangles);
          const triangleCount =
            target.collider.kind === 'mesh' ? this.sweepTriangles.length : 1;
          for (let k = 0; k < triangleCount; k++) {
            const triangle =
              target.collider.kind === 'mesh'
                ? this.sweepTriangles[k]
                : undefined;
            if (
              triangle &&
              (target.collider as TriangleMeshCollider3D).sidedness ===
                'front' &&
              (moving.center.x - triangle.a.x) * triangle.normal.x +
                (moving.center.y - triangle.a.y) * triangle.normal.y +
                (moving.center.z - triangle.a.z) * triangle.normal.z <
                -physics3DDefaults.sweepTolerance
            )
              continue;
            const t = this.sweepPair(
              moving,
              target,
              triangle,
              dx,
              dy,
              dz,
              nearest,
              inside,
              staticOnly,
            );
            if (t >= nearest) continue;
            nearest = t;
            result = out ??
              result ?? {
                object: e.object,
                collider: e.shape.collider,
                point: new Vector3(),
                normal: new Vector3(),
                distance: 0,
              };
            result.object = e.object;
            result.collider = e.shape.collider;
            result.distance = t * len;
            result.point.copy(this.queryManifold.points[0]);
            result.normal.copy(this.queryManifold.normal);
          }
        }
    }
    return result;
  }
  private sweepPair(
    shape: Shape3D,
    target: Shape3D,
    triangle: Triangle3D | undefined,
    dx: number,
    dy: number,
    dz: number,
    limit: number,
    inside: boolean,
    conservative: boolean,
  ): number {
    let t = 0,
      translated = 0;
    try {
      for (
        let iteration = 0;
        iteration < physics3DDefaults.sweepIterations;
        iteration++
      ) {
        const move = t - translated;
        shape.translate(dx * move, dy * move, dz * move);
        translated = t;
        const m = this.queryManifold;
        if (triangle) this.queryNarrow.triangle(shape, triangle, m);
        else this.queryNarrow.collide(shape, target, m);
        const closing = -(dx * m.normal.x + dy * m.normal.y + dz * m.normal.z);
        if (m.distance <= physics3DDefaults.sweepTolerance)
          return inside ||
            closing > 1e-10 ||
            m.distance < -physics3DDefaults.contactSlop
            ? t
            : Infinity;
        if (closing <= 1e-12 || !Number.isFinite(m.distance)) return Infinity;
        t += m.distance / closing;
        if (t > limit || t > 1) return Infinity;
      }
      // Exhaustion is not a fabricated hit. CCD retains only the proven-free translation prefix.
      if (conservative)
        this.sweepSafeFraction = Math.min(this.sweepSafeFraction, translated);
      return Infinity;
    } finally {
      shape.translate(-dx * translated, -dy * translated, -dz * translated);
    }
  }
  destroy(): void {
    if (this.disposed || this.destroying) return;
    this.destroying = true;
    // Ends reach surviving owners before the world becomes inert; mark contacts first for reentry.
    for (const row of this.contacts.values())
      for (const c of row.values()) this.end(c);
    this.disposed = true;
    this.entries.clear();
    this.ordered.length = 0;
    this.contacts.clear();
    this.active.length = 0;
    this.index.clear();
    this.pairCandidates.length = 0;
    this.queryCandidates.length = 0;
    this.sweepTriangles.length = 0;
    this.ccdHit = undefined;
    this.ccdOptions.ignore = undefined;
    this.counters.candidatePairs = 0;
    this.counters.narrowphaseTests = 0;
    this.counters.queryCandidates = 0;
    this.accumulator = 0;
  }
}
