import { Matrix4, Vector3 } from '../../../math/src/index.js';
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
import { Joint3D } from './joints.js';
import {
  ContinuousCollision3D,
  integrateRotation3D,
  rigidSweptBounds3D,
} from './ccd.js';
import { rayIntersections3D } from './ray-intersections.js';
import { physicsRayLimits } from '../../../../src/data/physics-ray.js';
export interface PhysicsStats3D {
  readonly candidatePairs: number;
  readonly narrowphaseTests: number;
  readonly queryCandidates: number;
  /** Cumulative geometry refreshes and changed hierarchy nodes, not pose scans. */
  readonly refreshedLeaves: number;
  readonly refits: number;
  readonly poseChecks: number;
  readonly indexGeneration: number;
  readonly ccdTests: number;
  readonly ccdIterations: number;
  readonly ccdImpacts: number;
  readonly ccdExhaustions: number;
  readonly ccdLimitedTime: number;
  readonly jointRows: number;
  readonly jointIterations: number;
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
  ignoreAlso?: Object3D;
}
export interface PhysicsRaycastAllOptions3D extends PhysicsQueryOptions3D {
  /** Overflow throws; never returns an incomplete set disguised as complete. */
  readonly maxHits?: number;
  readonly maxTests?: number;
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
  indexedRevision: number;
  ccdShape: Shape3D | undefined;
  ccdStopped: boolean;
}
interface SweptEntry3D {
  readonly entry: Entry3D;
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
/** Deterministic primitive/mesh/compound impulses, iterative joints and opt-in rigid-motion CCD. */
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
  private readonly sweptIndex = new SpatialIndex3D<SweptEntry3D>();
  private readonly sweptEntries: SweptEntry3D[] = [];
  private readonly ccdCandidates: SweptEntry3D[] = [];
  private sweptIndexDirty = true;
  private readonly ccd = new ContinuousCollision3D();
  private readonly constraints: Joint3D[] = [];
  private readonly jointSnapshot: Joint3D[] = [];
  private readonly jointLinks = new Map<Object3D, Joint3D[]>();
  private readonly placementMatrix = new Matrix4();
  private readonly placementPosition = new Vector3();
  private placementShape: Shape3D | undefined;
  private capsuleQueryShape: Shape3D | undefined;
  private sweepQueryShape: Shape3D | undefined;
  private nextOrder = 0;
  private readonly counters = {
    candidatePairs: 0,
    narrowphaseTests: 0,
    queryCandidates: 0,
    refreshedLeaves: 0,
    refits: 0,
    poseChecks: 0,
    indexGeneration: 0,
    ccdTests: 0,
    ccdIterations: 0,
    ccdImpacts: 0,
    ccdExhaustions: 0,
    ccdLimitedTime: 0,
    jointRows: 0,
    jointIterations: 0,
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
  /** Mutation-aware geometry generation; query-only probes never change it. */
  get geometryRevision(): number {
    this.refreshIndex();
    return this.counters.indexGeneration;
  }
  get joints(): readonly Joint3D[] {
    return this.constraints;
  }
  addJoint<T extends Joint3D>(joint: T): T {
    if (this.disposed) throw new Error('PhysicsWorld3D is destroyed.');
    if (!(joint instanceof Joint3D)) throw new TypeError('Invalid Joint3D.');
    if (joint.attached) throw new Error('Joint3D is already attached.');
    const a = this.entries.get(joint.bodyA),
      b = joint.bodyB ? this.entries.get(joint.bodyB) : undefined;
    if (!a?.body || (joint.bodyB && !b))
      throw new Error(
        'Joint bodies must be registered in this PhysicsWorld3D.',
      );
    if (a.body.type !== 'dynamic' && b?.body?.type !== 'dynamic')
      throw new Error('A joint requires at least one dynamic body.');
    this.validate(a.object);
    if (b) this.validate(b.object);
    joint.attach(this);
    this.constraints.push(joint);
    let links = this.jointLinks.get(joint.bodyA);
    if (!links) this.jointLinks.set(joint.bodyA, (links = []));
    links.push(joint);
    if (joint.bodyB) {
      links = this.jointLinks.get(joint.bodyB);
      if (!links) this.jointLinks.set(joint.bodyB, (links = []));
      links.push(joint);
    }
    return joint;
  }
  removeJoint(joint: Joint3D): boolean {
    const index = this.constraints.indexOf(joint);
    if (index < 0) return false;
    this.constraints.splice(index, 1);
    for (let side = 0; side < 2; side++) {
      const object = side === 0 ? joint.bodyA : joint.bodyB;
      if (!object) continue;
      const links = this.jointLinks.get(object);
      if (!links) continue;
      const slot = links.indexOf(joint);
      if (slot >= 0) links.splice(slot, 1);
      if (links.length === 0) this.jointLinks.delete(object);
    }
    joint.detach();
    return true;
  }
  private connected(a: Entry3D, b: Entry3D): boolean {
    const links = this.jointLinks.get(a.object);
    if (!links) return false;
    for (const joint of links)
      if (
        !joint.collideConnected &&
        joint.enabled &&
        ((joint.bodyA === a.object && joint.bodyB === b.object) ||
          (joint.bodyA === b.object && joint.bodyB === a.object))
      )
        return true;
    return false;
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
          indexedRevision: -1,
          ccdShape: undefined,
          ccdStopped: false,
        }
      : undefined;
    if (next) {
      if (next.shape.refresh(object)) ++this.counters.refreshedLeaves;
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
      this.sweptEntries.push({
        entry: next,
        bounds: new Bounds3D(),
        order: next.order,
      });
      this.sweptIndexDirty = true;
      this.indexDirty = true;
    }
  }
  unregister(object: Object3D): void {
    const entry = this.entries.get(object);
    if (!entry) return;
    for (let i = this.constraints.length - 1; i >= 0; i--) {
      const joint = this.constraints[i];
      if (joint.bodyA === object || joint.bodyB === object)
        this.removeJoint(joint);
    }
    this.entries.delete(object);
    if (entry.body) this.forces.delete(entry.body);
    const index = this.ordered.indexOf(entry);
    if (index !== -1) this.ordered.splice(index, 1);
    this.indexDirty = true;
    const swept = this.sweptEntries.findIndex((item) => item.entry === entry);
    if (swept !== -1) this.sweptEntries.splice(swept, 1);
    this.sweptIndexDirty = true;
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
  private solveJoints(): void {
    if (this.jointSnapshot.length === 0) return;
    ++this.counters.jointIterations;
    for (const joint of this.jointSnapshot)
      if (joint.belongsTo(this)) joint.solveVelocity();
  }
  private prepareContact(a: Entry3D, b: Entry3D, q: Manifold3D): Contact3D {
    let row = this.contacts.get(a),
      contact = row?.get(b);
    if (!contact) {
      contact = new Contact3D(a, b);
      if (!row) this.contacts.set(a, (row = new Map()));
      row.set(b, contact);
    }
    const m = contact.manifold;
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
        bounce = Math.max(a.body?.restitution ?? 0, b.body?.restitution ?? 0);
      contact.targets[k] =
        vn < -physics3DDefaults.restitutionThreshold ? -vn * bounce : 0;
      contact.tangent[k].copy(this.relative);
      contact.tangent[k].x -= n.x * vn;
      contact.tangent[k].y -= n.y * vn;
      contact.tangent[k].z -= n.z * vn;
      contact.tangent[k].normalize();
    }
    contact.seen = this.stepId;
    return contact;
  }
  private moveBodies(dt: number): void {
    if (dt <= 0) return;
    for (const e of this.ordered) {
      const b = e.body;
      if (!b || b.type === 'static' || b.isSleeping || e.ccdStopped) continue;
      const o = e.object;
      o.position.x += b.velocity.x * dt;
      o.position.y += b.velocity.y * dt;
      o.position.z += b.velocity.z * dt;
      if (!b.lockRotation)
        integrateRotation3D(o.rotation, b.angularVelocity, dt, o.rotation);
      if (e.shape.refresh(o)) ++this.counters.refreshedLeaves;
      b.refreshInertia(e.shape);
    }
  }
  private integrateContinuous(dt: number, canContinue: () => boolean): void {
    let continuous = false;
    for (const entry of this.ordered)
      if (entry.body?.type === 'dynamic' && entry.body.continuous) {
        continuous = true;
        break;
      }
    if (!continuous) {
      this.moveBodies(dt);
      return;
    }
    let remaining = dt,
      events = 0;
    while (remaining > 1e-12 && events < physics3DDefaults.ccdMaxImpacts) {
      for (const item of this.sweptEntries) {
        rigidSweptBounds3D(
          item.entry,
          remaining,
          item.bounds,
          this.ccdDisplacement,
        );
        if (!this.sweptIndexDirty) this.sweptIndex.update(item);
      }
      if (this.sweptIndexDirty) {
        this.sweptIndex.rebuild(this.sweptEntries);
        this.sweptIndexDirty = false;
      }
      let nearest = Infinity,
        safe = Infinity;
      let hitA: Entry3D | undefined,
        hitB: Entry3D | undefined,
        limitedA: Entry3D | undefined,
        limitedB: Entry3D | undefined;
      for (const item of this.sweptEntries) {
        const continuousEntry = item.entry;
        if (
          continuousEntry.body?.type !== 'dynamic' ||
          !continuousEntry.body.continuous
        )
          continue;
        this.sweptIndex.query(item.bounds, this.ccdCandidates);
        for (const other of this.ccdCandidates) {
          const otherEntry = other.entry;
          if (
            otherEntry === continuousEntry ||
            (otherEntry.body?.type === 'dynamic' &&
              otherEntry.body.continuous &&
              otherEntry.order < continuousEntry.order)
          )
            continue;
          const a =
              continuousEntry.order < otherEntry.order
                ? continuousEntry
                : otherEntry,
            b =
              continuousEntry.order < otherEntry.order
                ? otherEntry
                : continuousEntry,
            ca = a.shape.collider,
            cb = b.shape.collider;
          if (
            !(ca.category & cb.mask) ||
            !(cb.category & ca.mask) ||
            this.connected(a, b)
          )
            continue;
          const sensor = ca.sensor || cb.sensor;
          if (sensor && this.contacts.get(a)?.get(b)?.seen === this.stepId)
            continue;
          ++this.counters.ccdTests;
          const time = this.ccd.timeOfImpact(
            a,
            b,
            remaining,
            Math.min(nearest, safe),
          );
          this.counters.ccdIterations += this.ccd.iterations;
          if (this.ccd.exhausted && !sensor && this.ccd.safeTime < safe) {
            safe = this.ccd.safeTime;
            limitedA = a;
            limitedB = b;
          }
          if (time < nearest) {
            nearest = time;
            hitA = a;
            hitB = b;
          }
        }
      }
      if (safe <= nearest && limitedA && limitedB) {
        this.moveBodies(safe);
        remaining -= safe;
        limitedA.ccdStopped = true;
        limitedB.ccdStopped = true;
        ++this.counters.ccdExhaustions;
        this.counters.ccdLimitedTime += remaining;
        ++events;
        continue;
      }
      if (!hitA || !hitB || nearest > remaining) {
        this.moveBodies(remaining);
        return;
      }
      this.moveBodies(nearest);
      remaining -= nearest;
      this.narrow.collide(hitA.shape, hitB.shape, this.queryManifold);
      if (this.queryManifold.distance > physics3DDefaults.contactMargin) {
        hitA.ccdStopped = true;
        hitB.ccdStopped = true;
        ++this.counters.ccdExhaustions;
        this.counters.ccdLimitedTime += remaining;
        ++events;
        continue;
      }
      const contact = this.prepareContact(hitA, hitB, this.queryManifold);
      if (!contact.started) this.start(contact);
      if (!canContinue() || this.disposed) return;
      if (!this.valid(hitA) || !this.valid(hitB)) {
        ++events;
        continue;
      }
      if (!hitA.shape.collider.sensor && !hitB.shape.collider.sensor) {
        hitA.body?.wake();
        hitB.body?.wake();
        for (
          let iteration = 0;
          iteration < this.solverIterations;
          iteration++
        ) {
          for (let k = 0; k < contact.manifold.count; k++)
            this.solve(contact, k);
          this.solveJoints();
        }
      }
      ++this.counters.ccdImpacts;
      ++events;
    }
    if (remaining > 1e-12) {
      ++this.counters.ccdExhaustions;
      this.counters.ccdLimitedTime += remaining;
    }
  }
  private step(dt: number, canContinue: () => boolean): void {
    ++this.stepId;
    this.active.length = 0;
    this.counters.ccdTests = 0;
    this.counters.ccdIterations = 0;
    this.counters.ccdImpacts = 0;
    this.counters.ccdExhaustions = 0;
    this.counters.ccdLimitedTime = 0;
    this.refreshIndex();
    for (const e of this.ordered) {
      e.ccdStopped = false;
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
      e.object.capturePhysicsPose();
    }
    this.jointSnapshot.length = 0;
    this.counters.jointRows = 0;
    for (const joint of this.constraints) {
      joint.prepare(dt);
      this.counters.jointRows += joint.solverRowCount;
      this.jointSnapshot.push(joint);
    }
    this.counters.jointIterations = 0;
    for (let iteration = 0; iteration < this.solverIterations; iteration++)
      this.solveJoints();
    this.integrateContinuous(dt, canContinue);
    if (!canContinue() || this.disposed) return;
    this.refreshIndex();
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
        if (this.connected(a, b)) continue;
        if (!a.body && !b.body && !ca.sensor && !cb.sensor) continue;
        this.counters.narrowphaseTests++;
        this.narrow.collide(a.shape, b.shape, this.queryManifold);
        if (this.queryManifold.distance > physics3DDefaults.contactMargin)
          continue;
        const contact = this.prepareContact(a, b, this.queryManifold);
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
    for (let iteration = 0; iteration < this.solverIterations; iteration++) {
      this.solveJoints();
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
    }
    for (const joint of this.jointSnapshot) {
      if (!joint.belongsTo(this)) continue;
      if (
        joint.reactionForce > joint.breakForce ||
        joint.reactionTorque > joint.breakTorque
      ) {
        this.removeJoint(joint);
        joint.onBreak?.(joint);
        if (!canContinue() || this.disposed) return;
      }
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
    // Mutable public poses (including ancestors) are checked even for static/sleeping entries.
    let changed = this.indexDirty;
    for (const e of this.ordered) {
      ++this.counters.poseChecks;
      if (e.shape.refresh(e.object)) ++this.counters.refreshedLeaves;
      if (e.indexedRevision !== e.shape.revision) {
        changed = true;
        if (!this.indexDirty) this.counters.refits += this.index.update(e);
        e.indexedRevision = e.shape.revision;
      }
    }
    if (this.indexDirty) {
      this.index.rebuild(this.ordered);
      this.indexDirty = false;
    }
    if (changed) ++this.counters.indexGeneration;
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
      e.object !== options.ignoreAlso &&
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
    const hit = this.sweepShape(
      this.queryShape,
      this.impulse,
      options,
      undefined,
      true,
    );
    // A point exactly on a two-sided plane has no stable signed side after rounding.
    if (
      hit?.collider.kind === 'plane' &&
      hit.normal.x * direction.x +
        hit.normal.y * direction.y +
        hit.normal.z * direction.z >
        0
    )
      hit.normal.set(-hit.normal.x, -hit.normal.y, -hit.normal.z);
    return hit;
  }
  /** Sorted analytic boundary hits, including every intersected triangle/compound child.
   * Solid inside starts return the exit boundary, unlike the nearest raycast API's distance 0.
   * Duplicate mesh seam hits are coalesced; filters and borrowed collider ownership are unchanged.
   */
  raycastAll(
    origin: Readonly<Vector3>,
    direction: Readonly<Vector3>,
    maxDistance: number,
    options: PhysicsRaycastAllOptions3D = {},
  ): PhysicsHit3D[] {
    vector3D(origin, 'origin');
    vector3D(direction, 'direction');
    positive3D(maxDistance, 'maxDistance');
    const length = positive3D(direction.length(), 'direction length');
    const maxHits = options.maxHits ?? physicsRayLimits.hits;
    const maxTests = options.maxTests ?? physicsRayLimits.tests;
    if (
      !Number.isSafeInteger(maxHits) ||
      maxHits < 1 ||
      maxHits > physicsRayLimits.hits ||
      !Number.isSafeInteger(maxTests) ||
      maxTests < 1 ||
      maxTests > physicsRayLimits.tests
    )
      throw new RangeError(
        'Ray intersection limits exceed their bounded integer profile.',
      );
    const unit = this.impulse.set(
      direction.x / length,
      direction.y / length,
      direction.z / length,
    );
    this.queryBounds.reset();
    this.queryBounds.add(origin);
    this.queryBounds.add(
      this.queryShape.center.set(
        origin.x + unit.x * maxDistance,
        origin.y + unit.y * maxDistance,
        origin.z + unit.z * maxDistance,
      ),
    );
    this.candidates(this.queryBounds);
    const hits: PhysicsHit3D[] = [];
    let tests = 0;
    for (const entry of this.queryCandidates) {
      if (!this.accepts(entry, options)) continue;
      const shape = entry.shape;
      const count =
        shape.collider.kind === 'compound' ? shape.children.length : 1;
      const emit = (
        distance: number,
        nx: number,
        ny: number,
        nz: number,
      ): void => {
        if (hits.length === maxHits)
          throw new RangeError('Ray intersection hit limit exceeded.');
        hits.push({
          object: entry.object,
          collider: shape.collider,
          distance,
          point: new Vector3(
            origin.x + unit.x * distance,
            origin.y + unit.y * distance,
            origin.z + unit.z * distance,
          ),
          normal: new Vector3(nx, ny, nz),
        });
      };
      for (let i = 0; i < count; i++) {
        const leaf =
          shape.collider.kind === 'compound' ? shape.children[i]! : shape;
        if (!leaf.bounds.overlaps(this.queryBounds)) continue;
        if (leaf.collider.kind === 'mesh') {
          leaf.triangleIndex!.query(this.queryBounds, this.sweepTriangles);
          for (const triangle of this.sweepTriangles) {
            if (++tests > maxTests)
              throw new RangeError('Ray intersection test limit exceeded.');
            rayIntersections3D(leaf, origin, unit, maxDistance, emit, triangle);
          }
        } else {
          if (++tests > maxTests)
            throw new RangeError('Ray intersection test limit exceeded.');
          rayIntersections3D(leaf, origin, unit, maxDistance, emit);
        }
      }
    }
    hits.sort((a, b) => a.distance - b.distance);
    let write = 0;
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i]!;
      let duplicate = false;
      for (let j = write - 1; j >= 0; j--) {
        const prior = hits[j]!;
        if (hit.distance - prior.distance > physicsRayLimits.tolerance) break;
        if (
          hit.object === prior.object &&
          hit.normal.dot(prior.normal) > 1 - physicsRayLimits.tolerance
        ) {
          duplicate = true;
          break;
        }
      }
      if (!duplicate) hits[write++] = hit;
    }
    hits.length = write;
    return hits;
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
    padding = 0,
  ): PhysicsHit3D | undefined {
    if (!(object.collider instanceof CapsuleCollider3D))
      throw new TypeError('Capsule sweep requires CapsuleCollider3D.');
    vector3D(displacement, 'displacement');
    finite3D(padding, 'padding');
    if (padding < 0) throw new RangeError('padding must be nonnegative.');
    const shape =
      this.capsuleQueryShape?.collider === object.collider
        ? this.capsuleQueryShape
        : (this.capsuleQueryShape = new Shape3D(object.collider));
    shape.refresh(object);
    const radius = shape.radius;
    shape.radius += padding;
    shape.updateBounds();
    try {
      return this.sweepShape(shape, displacement, options, out, false, object);
    } finally {
      shape.radius = radius;
      shape.updateBounds();
    }
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
  /** Transactional stance clearance at a root pose; neither attachment nor owner pose is modified. */
  canPlaceCapsule(
    object: Object3D,
    collider: CapsuleCollider3D,
    position: Readonly<Vector3>,
    options: PhysicsQueryOptions3D = {},
  ): boolean {
    if (object.parent)
      throw new Error('Capsule placement requires a root Object3D.');
    if (!(collider instanceof CapsuleCollider3D))
      throw new TypeError('Capsule placement requires CapsuleCollider3D.');
    vector3D(position, 'position');
    const shape =
      this.placementShape?.collider === collider
        ? this.placementShape
        : (this.placementShape = new Shape3D(collider));
    this.placementPosition.set(position.x, position.y, position.z);
    shape.refreshMatrix(
      this.placementMatrix.compose(
        this.placementPosition,
        object.rotation,
        object.scale,
      ),
    );
    this.candidates(shape.bounds);
    for (const entry of this.queryCandidates) {
      if (entry.object === object || !this.accepts(entry, options)) continue;
      this.queryNarrow.collide(shape, entry.shape, this.queryManifold);
      if (this.queryManifold.distance < -physics3DDefaults.sweepTolerance)
        return false;
    }
    return true;
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
    const shape =
      this.sweepQueryShape?.collider === collider
        ? this.sweepQueryShape
        : (this.sweepQueryShape = new Shape3D(collider));
    shape.refresh(object);
    shape.validateMoving('kinematic');
    return this.sweepShape(shape, displacement, options, out, false, object);
  }
  private sweepShape(
    shape: Shape3D,
    displacement: Readonly<Vector3>,
    options: PhysicsQueryOptions3D,
    out: PhysicsHit3D | undefined,
    inside: boolean,
    ignoreOwner?: Object3D,
  ): PhysicsHit3D | undefined {
    const dx = displacement.x,
      dy = displacement.y,
      dz = displacement.z,
      len = Math.hypot(dx, dy, dz);
    if (len < 1e-12) return undefined;
    let nearest = 1 + 1e-10,
      result: PhysicsHit3D | undefined;
    this.queryBounds.swept(
      shape.bounds,
      displacement,
      physics3DDefaults.sweepTolerance,
    );
    this.candidates(this.queryBounds);
    for (const e of this.queryCandidates) {
      if (
        !this.accepts(e, options) ||
        e.shape === shape ||
        e.object === ignoreOwner
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
      // Iteration exhaustion is not a fabricated query hit.
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
    for (const joint of this.constraints) joint.detach();
    this.constraints.length = 0;
    this.jointLinks.clear();
    ++this.counters.indexGeneration;
    this.jointSnapshot.length = 0;
    this.sweptEntries.length = 0;
    this.ccdCandidates.length = 0;
    this.sweptIndex.clear();
    this.placementShape = undefined;
    this.capsuleQueryShape = undefined;
    this.sweepQueryShape = undefined;
    this.counters.candidatePairs = 0;
    this.counters.narrowphaseTests = 0;
    this.counters.queryCandidates = 0;
    this.accumulator = 0;
  }
}
