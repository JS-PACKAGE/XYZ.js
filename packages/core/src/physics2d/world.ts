import { Vector2 } from '../../../math/src/index.js';
import type { GameObject } from '../game-object.js';
import {
  physicsDefaults,
  world2dLimits,
} from '../../../../src/data/world2d.js';
import {
  Collider2D,
  finite,
  positive,
  ShapeGeometry,
  unsigned,
} from './collider.js';
import { RigidBody2D } from './body.js';
import { collide, Manifold, rayDistance } from './narrowphase.js';
import { ContinuousCollision2D, ShapeMotion2D } from './ccd.js';
import type { Joint2D } from './joints.js';
import { PhysicsForceAccumulator } from '../physics-force.js';

export interface CollisionDetail {
  readonly self: GameObject;
  readonly other: GameObject;
  readonly normal: Vector2;
  readonly points: readonly Vector2[];
  readonly penetration: number;
  readonly sensor: boolean;
  cancelResponse(): void;
}
export interface ContactQuery {
  readonly owner: GameObject;
  readonly collider: Collider2D;
  readonly normal: Vector2;
  readonly points: readonly Vector2[];
  readonly penetration: number;
  readonly sensor: boolean;
}
export interface PhysicsRayHit {
  readonly owner: GameObject;
  readonly collider: Collider2D;
  readonly distance: number;
  readonly point: Vector2;
  readonly normal: Vector2;
}
export interface PhysicsQueryOptions2D {
  ignore?: GameObject;
  ignoreOther?: GameObject;
  mask?: number;
  includeSensors?: boolean;
}
/** Sweep normal points away from the obstacle, unlike pair contact normals. */
export interface PhysicsSweepResult2D {
  hit: boolean;
  owner: GameObject | undefined;
  collider: Collider2D | undefined;
  fraction: number;
  safeFraction: number;
  exhausted: boolean;
  readonly point: Vector2;
  readonly normal: Vector2;
}
export interface PhysicsWorldOptions {
  gravity?: [number, number];
  fixedDelta?: number;
  maxSubSteps?: number;
  velocityIterations?: number;
  positionIterations?: number;
  ccdIterations?: number;
  ccdImpacts?: number;
}
export interface PhysicsDebugShape {
  readonly kind: 'circle' | 'polygon';
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  /** Flat world-space x,y pairs of a polygon; empty for circles. */
  readonly points: readonly number[];
  /** `[minX, minY, maxX, maxY]`. */
  readonly bounds: readonly [number, number, number, number];
  readonly dynamic: boolean;
  readonly sensor: boolean;
  readonly sleeping: boolean;
}
export interface PhysicsDebugContact {
  readonly points: readonly (readonly [number, number])[];
  readonly normal: readonly [number, number];
  readonly sensor: boolean;
}
export interface PhysicsDebugJoint {
  readonly type: string;
  readonly anchors: readonly [number, number, number, number];
}
export interface PhysicsDebugSnapshot {
  readonly shapes: readonly PhysicsDebugShape[];
  readonly contacts: readonly PhysicsDebugContact[];
  readonly joints: readonly PhysicsDebugJoint[];
}
class Proxy {
  readonly geometry: ShapeGeometry;
  readonly contacts = new Map<Proxy, Contact>();
  inverseMass = 0;
  inverseInertia = 0;
  sleepVisited = 0;
  sleepReady = false;
  registration = 0;
  ccdStopped = false;
  ccdUnproven = false;
  readonly joints: Joint2D[] = [];
  readonly motion: ShapeMotion2D;
  private observedGeometry = -1;
  private observedCategory = -1;
  private observedMask = -1;
  private observedSensor = false;
  geometryChanged(): boolean {
    const changed =
      this.observedGeometry !== this.geometry.revision ||
      this.observedCategory !== this.collider.category ||
      this.observedMask !== this.collider.mask ||
      this.observedSensor !== this.collider.sensor;
    this.observedGeometry = this.geometry.revision;
    this.observedCategory = this.collider.category;
    this.observedMask = this.collider.mask;
    this.observedSensor = this.collider.sensor;
    return changed;
  }
  constructor(
    readonly owner: GameObject,
    readonly collider: Collider2D,
    readonly body: RigidBody2D | undefined,
  ) {
    this.geometry = new ShapeGeometry(collider);
    this.motion = new ShapeMotion2D(this.geometry);
  }
  refresh(): void {
    if (this.owner.worldSpace !== 'world')
      throw new Error('Screen-space colliders are unsupported.');
    if (this.body && this.body.type !== 'static' && this.owner.parent)
      throw new Error('Moving bodies require root world-space GameObjects.');
    const revision = this.geometry.revision;
    this.geometry.refresh(this.owner);
    if (
      (!this.body || this.body.type !== 'dynamic') &&
      revision !== this.geometry.revision
    ) {
      for (const contact of this.contacts.values()) {
        const other = contact.a === this ? contact.b : contact.a;
        if (!contact.sensor && !contact.cancelled) other.body?.wake();
      }
      for (const joint of this.joints) joint.partner(this)?.body?.wake();
    }
    this.inverseMass = this.body?.inverseMass ?? 0;
    this.inverseInertia =
      this.body && this.inverseMass && !this.body.lockRotation
        ? 1 / (this.body.mass * this.geometry.inertiaPerMass)
        : 0;
  }
}
class Contact {
  readonly manifold = new Manifold();
  cancelled = false;
  sensor = false;
  seen = 0;
  active = false;
  constructor(
    readonly a: Proxy,
    readonly b: Proxy,
  ) {}
}
function boundedInteger(value: number, maximum: number, name: string): number {
  if (!Number.isInteger(value) || value < 1 || value > maximum)
    throw new RangeError(`${name} must be an integer in [1, ${maximum}].`);
  return value;
}
const compareBounds = (a: Proxy, b: Proxy): number =>
  a.geometry.minX - b.geometry.minX;
const continueSimulation = (): boolean => true;
function snapshotPoints(manifold: Manifold): readonly Vector2[] {
  const points = new Array<Vector2>(manifold.count);
  for (let i = 0; i < manifold.count; i++)
    points[i] = manifold.points[i].clone();
  return Object.freeze(points);
}

/** Bounded fixed-step 2D impulse solver. */
export class PhysicsWorld2D {
  readonly gravity = new Vector2(0, physicsDefaults.gravityY);
  private readonly owners = new Map<GameObject, Proxy>();
  private readonly sorted: Proxy[] = [];
  private readonly activeContacts = new Set<Contact>();
  private readonly solveContacts: Contact[] = [];

  /** Number of registered colliders, static ones included. */
  get colliderCount(): number {
    return this.owners.size;
  }
  private readonly sleepGroup: Proxy[] = [];
  private readonly continuous = new ContinuousCollision2D();
  private readonly impactManifold = new Manifold();
  /** Diagnostics for the most recently simulated fixed tick; velocity is never clamped. */
  readonly ccdStats = {
    iterations: 0,
    impacts: 0,
    budgetExhaustions: 0,
    stoppedTime: 0,
  };
  private continuousIterations: number = physicsDefaults.ccdIterations;
  private continuousImpacts: number = physicsDefaults.ccdImpacts;
  private readonly jointSet = new Set<Joint2D>();
  private readonly activeJoints: Joint2D[] = [];
  private readonly forces = new WeakMap<RigidBody2D, PhysicsForceAccumulator>();
  private readonly queryManifold = new Manifold();
  private readonly positionManifold = new Manifold();
  private readonly queryNormal = new Vector2();
  private readonly queryGeometries = new WeakMap<Collider2D, ShapeGeometry>();
  private readonly queryMotions = new WeakMap<Collider2D, ShapeMotion2D>();
  private continuation: () => boolean = continueSimulation;
  private accumulator = 0;
  private stepToken = 0;
  private stepping = false;
  private disposed = false;
  private timeStep: number = physicsDefaults.fixedDelta;
  private stepLimit: number = physicsDefaults.maxSubSteps;
  private velocityPasses: number = physicsDefaults.velocityIterations;
  private positionPasses: number = physicsDefaults.positionIterations;
  droppedTime = 0;
  private geometryVersion = 0;
  private registrationVersion = 0;
  /** Collision-bake snapshot token, including direct mutable transforms and query filters. */
  get geometryRevision(): number {
    for (const proxy of this.owners.values()) {
      if (!this.alive(proxy)) continue;
      proxy.refresh();
      if (proxy.geometryChanged()) this.geometryVersion++;
    }
    return this.geometryVersion;
  }

  constructor(options: PhysicsWorldOptions = {}) {
    if (options.gravity)
      this.gravity.set(
        finite(options.gravity[0], 'gravity.x'),
        finite(options.gravity[1], 'gravity.y'),
      );
    this.fixedDelta = options.fixedDelta ?? this.fixedDelta;
    this.maxSubSteps = options.maxSubSteps ?? this.maxSubSteps;
    this.velocityIterations =
      options.velocityIterations ?? this.velocityIterations;
    this.positionIterations =
      options.positionIterations ?? this.positionIterations;
    this.ccdIterations = options.ccdIterations ?? this.ccdIterations;
    this.ccdImpacts = options.ccdImpacts ?? this.ccdImpacts;
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  get fixedDelta(): number {
    return this.timeStep;
  }
  set fixedDelta(value: number) {
    this.timeStep = positive(value, 'fixedDelta');
  }
  get maxSubSteps(): number {
    return this.stepLimit;
  }
  set maxSubSteps(value: number) {
    this.stepLimit = boundedInteger(
      value,
      world2dLimits.maxSubSteps,
      'maxSubSteps',
    );
  }
  get velocityIterations(): number {
    return this.velocityPasses;
  }
  set velocityIterations(value: number) {
    this.velocityPasses = boundedInteger(
      value,
      world2dLimits.solverIterations,
      'velocityIterations',
    );
  }
  get positionIterations(): number {
    return this.positionPasses;
  }
  set positionIterations(value: number) {
    this.positionPasses = boundedInteger(
      value,
      world2dLimits.solverIterations,
      'positionIterations',
    );
  }
  get ccdIterations(): number {
    return this.continuousIterations;
  }
  set ccdIterations(value: number) {
    this.continuousIterations = boundedInteger(
      value,
      world2dLimits.ccdIterations,
      'ccdIterations',
    );
  }
  get ccdImpacts(): number {
    return this.continuousImpacts;
  }
  set ccdImpacts(value: number) {
    this.continuousImpacts = boundedInteger(
      value,
      world2dLimits.ccdImpacts,
      'ccdImpacts',
    );
  }
  /** Membership and replacement token for borrowed character supports. */
  has(owner: GameObject, collider = owner.collider): boolean {
    const proxy = this.owners.get(owner);
    return !!proxy && proxy.collider === collider && this.alive(proxy);
  }
  /** Removed/replaced/re-registered supports invalidate borrowed local anchors. */
  membershipRevision(owner: GameObject): number {
    return this.owners.get(owner)?.registration ?? -1;
  }

  /** @internal Called transactionally by Scene and facade body/collider setters. */
  register(owner: GameObject): void {
    if (this.destroyed)
      throw new Error('Cannot register with a destroyed PhysicsWorld2D.');
    if (owner.destroyed)
      throw new Error('Cannot register a destroyed GameObject.');
    const previous = this.owners.get(owner);
    if (!owner.collider) {
      this.unregister(owner);
      return;
    }
    if (previous?.collider === owner.collider && previous.body === owner.body) {
      previous.refresh();
      return;
    }
    if (!previous && this.owners.size >= world2dLimits.physicsBodies)
      throw new RangeError('Physics body budget exceeded.');
    const proxy = new Proxy(owner, owner.collider, owner.body);
    proxy.refresh();
    owner.body?.attach(owner);
    this.unregister(owner);
    if (
      owner.destroyed ||
      owner.collider !== proxy.collider ||
      owner.body !== proxy.body ||
      this.destroyed
    )
      return;
    this.owners.set(owner, proxy);
    proxy.registration = ++this.registrationVersion;
    this.geometryVersion++;
  }
  unregister(owner: GameObject): void {
    const proxy = this.owners.get(owner);
    if (!proxy) return;
    this.owners.delete(owner);
    this.geometryVersion++;
    if (proxy.body) this.forces.delete(proxy.body);
    for (const joint of [...proxy.joints]) this.removeJoint(joint);
    // Delete membership before callback dispatch: recursive unregister is harmless.
    for (const contact of proxy.contacts.values()) this.end(contact);
    proxy.contacts.clear();
  }
  private alive(proxy: Proxy): boolean {
    return (
      !this.destroyed &&
      !proxy.owner.destroyed &&
      this.owners.get(proxy.owner) === proxy &&
      proxy.owner.collider === proxy.collider &&
      proxy.owner.body === proxy.body
    );
  }
  private emit(contact: Contact, name: string): void {
    for (let receiver = 0; receiver < 2; receiver++) {
      if (name !== 'collisionend' && !this.continuation()) return;
      const self = receiver ? contact.b : contact.a,
        other = receiver ? contact.a : contact.b;
      if (!this.alive(self)) continue;
      if (name !== 'collisionend' && (!contact.active || !this.alive(other)))
        continue;
      const sign = receiver ? -1 : 1,
        m = contact.manifold;
      const step = this.stepToken;
      const detail: CollisionDetail = {
        self: self.owner,
        other: other.owner,
        normal: new Vector2(sign * m.nx, sign * m.ny),
        points: snapshotPoints(m),
        penetration: m.penetration,
        sensor: contact.sensor,
        cancelResponse: () => {
          if (
            name === 'precollision' &&
            this.stepping &&
            this.stepToken === step
          )
            contact.cancelled = true;
        },
      };
      self.owner.dispatchEvent(
        new CustomEvent<CollisionDetail>(name, { detail }),
      );
    }
  }
  private end(contact: Contact): void {
    if (!contact.active) return;
    contact.active = false;
    this.activeContacts.delete(contact);
    contact.a.contacts.delete(contact.b);
    contact.b.contacts.delete(contact.a);
    contact.a.body?.wake();
    contact.b.body?.wake();
    this.emit(contact, 'collisionend');
  }
  private forceState(body: RigidBody2D): PhysicsForceAccumulator {
    let state = this.forces.get(body);
    if (!state) this.forces.set(body, (state = new PhysicsForceAccumulator()));
    return state;
  }
  /** @internal Sample frame forces even when no fixed tick is due. */
  sampleForces(delta: number): void {
    for (const proxy of this.owners.values())
      if (proxy.body?.type === 'dynamic')
        this.forceState(proxy.body).sample(proxy.body, delta);
  }
  /** @internal Forces from fixed gameplay are impulses over that exact tick. */
  sampleFixedForces(delta: number): void {
    for (const proxy of this.owners.values())
      if (proxy.body?.type === 'dynamic')
        this.forceState(proxy.body).sampleFixed(proxy.body, delta);
  }
  /** @internal Discard only simulation time omitted by the scene catch-up limit. */
  discardFrameTime(delta: number): void {
    for (const proxy of this.owners.values())
      if (proxy.body) this.forces.get(proxy.body)?.discard(delta);
  }
  get interpolationAlpha(): number {
    return Math.min(1, Math.max(0, this.accumulator / this.fixedDelta));
  }
  update(
    deltaTime: number,
    canContinue: () => boolean = continueSimulation,
    sampleFrame = true,
  ): void {
    finite(deltaTime, 'deltaTime');
    if (deltaTime < 0) throw new RangeError('deltaTime must be nonnegative.');
    if (this.destroyed) return;
    if (this.stepping)
      throw new Error('PhysicsWorld2D cannot update recursively.');
    if (!canContinue()) {
      this.accumulator = 0;
      return;
    }
    finite(this.gravity.x, 'gravity.x');
    finite(this.gravity.y, 'gravity.y');
    if (sampleFrame) this.sampleForces(deltaTime);
    const total = finite(this.accumulator + deltaTime, 'accumulated time');
    const available = Math.floor(
      (total + this.fixedDelta * 1e-9) / this.fixedDelta,
    );
    const steps = Math.min(available, this.maxSubSteps);
    const remainder =
      available > this.maxSubSteps ? total % this.fixedDelta : 0;
    const discarded =
      available > this.maxSubSteps
        ? Math.max(0, total - this.maxSubSteps * this.fixedDelta - remainder)
        : 0;
    this.droppedTime += discarded;
    if (discarded > 0)
      for (const proxy of this.owners.values())
        if (proxy.body) this.forces.get(proxy.body)?.discard(discarded);
    this.accumulator =
      available > this.maxSubSteps
        ? this.maxSubSteps * this.fixedDelta + remainder
        : total;
    this.stepping = true;
    this.continuation = canContinue;
    try {
      for (let step = 0; step < steps && !this.destroyed; step++) {
        if (!canContinue()) {
          this.accumulator = 0;
          break;
        }
        this.accumulator = Math.max(0, this.accumulator - this.fixedDelta);
        this.simulate(this.fixedDelta);
        if (!canContinue()) {
          this.accumulator = 0;
          break;
        }
      }
    } finally {
      this.solveContacts.length = 0;
      this.stepping = false;
      this.continuation = continueSimulation;
    }
  }
  private advanceBodies(dt: number): void {
    for (const proxy of this.sorted) {
      const body = proxy.body;
      if (
        !this.alive(proxy) ||
        !body ||
        body.type === 'static' ||
        body.isSleeping ||
        proxy.ccdStopped
      )
        continue;
      proxy.owner.position.x += body.velocity.x * dt;
      proxy.owner.position.y += body.velocity.y * dt;
      if (!body.lockRotation) proxy.owner.rotation += body.angularVelocity * dt;
      proxy.refresh();
    }
  }
  private activate(contact: Contact, token: number): boolean {
    const { a, b, manifold: m } = contact;
    contact.sensor = a.collider.sensor || b.collider.sensor;
    contact.seen = token;
    contact.cancelled = false;
    m.normalImpulses.fill(0);
    m.tangentImpulses.fill(0);
    if (!contact.active) {
      contact.active = true;
      a.contacts.set(b, contact);
      b.contacts.set(a, contact);
      this.activeContacts.add(contact);
      a.body?.wake();
      b.body?.wake();
      this.emit(contact, 'collisionstart');
    }
    if (
      !this.continuation() ||
      !contact.active ||
      !this.alive(a) ||
      !this.alive(b)
    )
      return false;
    this.emit(contact, 'precollision');
    if (
      !this.continuation() ||
      !contact.active ||
      !this.alive(a) ||
      !this.alive(b)
    )
      return false;
    this.prepareBounce(contact);
    this.solveContacts.push(contact);
    return true;
  }
  private integrateContinuous(dt: number, token: number): void {
    const stats = this.ccdStats;
    stats.iterations =
      stats.impacts =
      stats.budgetExhaustions =
      stats.stoppedTime =
        0;
    let remaining = dt;
    while (remaining > 1e-12 && this.continuation()) {
      let first = Infinity,
        safe = Infinity,
        impactA: Proxy | undefined,
        impactB: Proxy | undefined;
      for (const proxy of this.sorted) {
        proxy.ccdUnproven = false;
        if (proxy.ccdStopped)
          proxy.motion.setExplicit(
            proxy.owner.position.x,
            proxy.owner.position.y,
            0,
            0,
          );
        else proxy.motion.set(proxy.owner, proxy.body);
      }
      for (let i = 0; i < this.sorted.length; i++) {
        const a = this.sorted[i];
        if (!this.alive(a) || !a.body?.ccd) continue;
        for (let j = 0; j < this.sorted.length; j++) {
          const b = this.sorted[j];
          if (
            a === b ||
            (b.body?.ccd && j <= i) ||
            !this.alive(b) ||
            (!a.inverseMass && !b.inverseMass) ||
            a.collider.sensor ||
            b.collider.sensor ||
            !(a.collider.category & b.collider.mask) ||
            !(b.collider.category & a.collider.mask) ||
            this.jointsBlockContact(a, b)
          )
            continue;
          const existing = a.contacts.get(b);
          if (existing?.seen === token && existing.cancelled) continue;
          const time = this.continuous.timeOfImpact(
            a.motion,
            b.motion,
            remaining,
            stats.impacts >= this.ccdImpacts
              ? 0
              : Math.max(0, this.ccdIterations - stats.iterations),
          );
          stats.iterations += this.continuous.iterations;
          if (this.continuous.exhausted) {
            safe = Math.min(safe, this.continuous.safeTime);
            a.ccdUnproven = b.ccdUnproven = true;
          }
          if (time < first) {
            first = time;
            impactA = a;
            impactB = b;
            const m = this.continuous.manifold,
              out = this.impactManifold;
            out.nx = m.nx;
            out.ny = m.ny;
            out.penetration = m.penetration;
            out.count = m.count;
            for (let k = 0; k < m.count; k++) out.points[k].copy(m.points[k]);
          }
        }
      }
      if (Number.isFinite(safe) && safe <= first) {
        const proven = Math.min(remaining, safe);
        this.advanceBodies(proven);
        remaining -= proven;
        stats.stoppedTime = Math.max(stats.stoppedTime, remaining);
        stats.budgetExhaustions++;
        for (const proxy of this.sorted)
          if (proxy.ccdUnproven && proxy.body?.type !== 'static')
            proxy.ccdStopped = true;
        continue;
      }
      if (!impactA || !impactB || first > remaining) {
        this.advanceBodies(remaining);
        return;
      }
      this.advanceBodies(first);
      remaining -= first;
      const contact =
          impactA.contacts.get(impactB) ?? new Contact(impactA, impactB),
        m = contact.manifold,
        hit = this.impactManifold;
      const sign = contact.a === impactA ? 1 : -1;
      m.nx = hit.nx * sign;
      m.ny = hit.ny * sign;
      m.penetration = hit.penetration;
      m.count = hit.count;
      for (let k = 0; k < hit.count; k++) m.points[k].copy(hit.points[k]);
      if (contact.seen !== token) {
        if (!this.activate(contact, token)) {
          if (!this.continuation()) return;
          continue;
        }
      } else this.prepareBounce(contact);
      if (!contact.cancelled && contact.active) {
        impactA.body?.wake();
        impactB.body?.wake();
        for (let pass = 0; pass < this.velocityIterations; pass++)
          this.solveVelocity(contact);
      }
      stats.impacts++;
      if (stats.impacts >= this.ccdImpacts) {
        stats.budgetExhaustions++;
        stats.stoppedTime = Math.max(stats.stoppedTime, remaining);
        impactA.ccdStopped = impactB.ccdStopped = true;
      }
    }
  }
  private simulate(dt: number): void {
    this.sorted.length = 0;
    this.solveContacts.length = 0;
    const token = ++this.stepToken;
    for (const proxy of this.owners.values()) {
      if (!this.alive(proxy)) {
        this.unregister(proxy.owner);
        continue;
      }
      proxy.refresh();
      proxy.ccdStopped = false;
      const body = proxy.body;
      if (body?.type === 'dynamic') {
        const force = this.forceState(body);
        force.consume(body, dt);
        if (!body.isSleeping) {
          finite(body.velocity.x, 'velocity.x');
          finite(body.velocity.y, 'velocity.y');
          proxy.owner.capturePhysicsPose();
          body.velocity.x +=
            (this.gravity.x * body.gravityScale +
              force.value[0] * proxy.inverseMass) *
            dt;
          body.velocity.y +=
            (this.gravity.y * body.gravityScale +
              force.value[1] * proxy.inverseMass) *
            dt;
          body.velocity.scale(1 / (1 + body.linearDamping * dt));
          body.setSolverAngularVelocity(
            body.lockRotation
              ? 0
              : (body.angularVelocity +
                  force.value[5] * proxy.inverseInertia * dt) /
                  (1 + body.angularDamping * dt),
          );
        }
      } else if (body?.type === 'kinematic') {
        finite(body.velocity.x, 'velocity.x');
        finite(body.velocity.y, 'velocity.y');
        finite(body.angularVelocity, 'angularVelocity');
        proxy.owner.capturePhysicsPose();
      }
      this.sorted.push(proxy);
    }
    this.integrateContinuous(dt, token);
    if (!this.continuation()) return;
    this.sorted.sort(compareBounds);
    for (let i = 0; i < this.sorted.length; i++) {
      const a = this.sorted[i];
      if (!this.alive(a)) continue;
      for (let j = i + 1; j < this.sorted.length; j++) {
        const b = this.sorted[j];
        if (b.geometry.minX > a.geometry.maxX) break;
        if (
          !this.alive(b) ||
          !(a.collider.category & b.collider.mask) ||
          !(b.collider.category & a.collider.mask)
        )
          continue;
        const sensor = a.collider.sensor || b.collider.sensor;
        if (!sensor && !a.inverseMass && !b.inverseMass) continue;
        if (a.joints.length && this.jointsBlockContact(a, b)) continue;
        let contact = a.contacts.get(b);
        if (!contact) {
          // The scratch manifold avoids allocating a contact for AABB-only candidates.
          if (!collide(a.geometry, b.geometry, this.queryManifold)) continue;
          contact = new Contact(a, b);
        }
        if (contact.seen === token) continue;
        if (!collide(a.geometry, b.geometry, contact.manifold)) continue;
        contact.sensor = sensor;
        contact.seen = token;
        if (!contact.active || sensor) {
          if (a.body?.isSleeping) a.body.wake();
          if (b.body?.isSleeping) b.body.wake();
        } else if (a.body?.type === 'dynamic' && b.body?.type === 'dynamic') {
          if (!a.body.isSleeping && b.body.isSleeping) b.body.wake();
          if (!b.body.isSleeping && a.body.isSleeping) a.body.wake();
        }
        if (!this.activate(contact, token) && !this.continuation()) return;
      }
    }
    for (const contact of this.activeContacts) {
      if (contact.seen !== token) this.end(contact);
      if (!this.continuation()) return;
    }
    this.wakeContactGroups(token);
    this.prepareJoints(dt);
    for (let iteration = 0; iteration < this.velocityIterations; iteration++) {
      for (const joint of this.activeJoints) joint.solveVelocity(dt);
      for (const contact of this.solveContacts) {
        if (
          contact.active &&
          !contact.cancelled &&
          !contact.sensor &&
          this.alive(contact.a) &&
          this.alive(contact.b) &&
          !(contact.a.body?.isSleeping || contact.b.body?.isSleeping)
        )
          this.solveVelocity(contact);
      }
    }
    for (let iteration = 0; iteration < this.positionIterations; iteration++) {
      for (const joint of this.activeJoints) joint.solvePosition();
      for (const contact of this.solveContacts) {
        if (
          contact.active &&
          !contact.cancelled &&
          !contact.sensor &&
          this.alive(contact.a) &&
          this.alive(contact.b) &&
          !(contact.a.body?.isSleeping || contact.b.body?.isSleeping)
        )
          this.solvePosition(contact);
      }
    }
    this.breakJoints();
    for (const contact of this.solveContacts) {
      if (contact.active) this.emit(contact, 'postcollision');
      if (!this.continuation()) return;
    }
    for (const proxy of this.sorted)
      if (this.alive(proxy)) proxy.owner.sealPhysicsPose();
    for (const proxy of this.sorted)
      proxy.sleepReady = proxy.body?.updateSleep(dt) ?? false;
    for (const start of this.sorted) {
      if (!start.inverseMass || start.sleepVisited === token) continue;
      this.sleepGroup.length = 0;
      this.sleepGroup.push(start);
      start.sleepVisited = token;
      let ready = true;
      for (let i = 0; i < this.sleepGroup.length; i++) {
        const proxy = this.sleepGroup[i];
        ready &&= proxy.sleepReady;
        for (const contact of proxy.contacts.values()) {
          if (contact.sensor || contact.cancelled) continue;
          const other = contact.a === proxy ? contact.b : contact.a;
          if (
            other.body?.type === 'kinematic' &&
            (other.body.velocity.x !== 0 ||
              other.body.velocity.y !== 0 ||
              other.body.angularVelocity !== 0)
          )
            ready = false;
          if (!other.inverseMass || other.sleepVisited === token) continue;
          other.sleepVisited = token;
          this.sleepGroup.push(other);
        }
        for (const joint of proxy.joints) {
          const view = joint.partner(proxy);
          const other = view && this.owners.get(view.owner);
          if (
            view?.body?.type === 'kinematic' &&
            (view.body.velocity.x !== 0 ||
              view.body.velocity.y !== 0 ||
              view.body.angularVelocity !== 0)
          )
            ready = false;
          if (!other?.inverseMass || other.sleepVisited === token) continue;
          other.sleepVisited = token;
          this.sleepGroup.push(other);
        }
      }
      if (ready) for (const proxy of this.sleepGroup) proxy.body?.sleep();
    }
  }
  private wakeContactGroups(token: number): void {
    // Propagate through a whole stack before solving any contact.
    for (const start of this.sorted) {
      if (
        !start.inverseMass ||
        start.body?.isSleeping ||
        start.sleepVisited === -token
      )
        continue;
      this.sleepGroup.length = 0;
      this.sleepGroup.push(start);
      start.sleepVisited = -token;
      for (let i = 0; i < this.sleepGroup.length; i++) {
        const proxy = this.sleepGroup[i];
        for (const contact of proxy.contacts.values()) {
          if (contact.sensor || contact.cancelled) continue;
          const other = contact.a === proxy ? contact.b : contact.a;
          if (!other.inverseMass || other.sleepVisited === -token) continue;
          if (other.body?.isSleeping) other.body.wake();
          other.sleepVisited = -token;
          this.sleepGroup.push(other);
        }
        for (const joint of proxy.joints) {
          const view = joint.partner(proxy);
          const other = view && this.owners.get(view.owner);
          if (!other?.inverseMass || other.sleepVisited === -token) continue;
          if (other.body?.isSleeping) other.body.wake();
          other.sleepVisited = -token;
          this.sleepGroup.push(other);
        }
      }
    }
  }
  private prepareBounce(contact: Contact): void {
    const { a, b, manifold: m } = contact;
    const restitution = Math.max(
      a.body?.restitution ?? 0,
      b.body?.restitution ?? 0,
    );
    // A body resting under gravity approaches at about gravity * dt each step; bouncing on that
    // would keep it awake forever, so the threshold never drops below a couple of gravity steps.
    const threshold = Math.max(
      physicsDefaults.restitutionThreshold,
      Math.hypot(this.gravity.x, this.gravity.y) *
        this.fixedDelta *
        physicsDefaults.restitutionGravitySteps,
    );
    for (let i = 0; i < m.count; i++) {
      const point = m.points[i];
      const av = a.body?.velocity,
        bv = b.body?.velocity;
      const aw =
        a.body && a.body.type !== 'static' && !a.body.lockRotation
          ? a.body.angularVelocity
          : 0;
      const bw =
        b.body && b.body.type !== 'static' && !b.body.lockRotation
          ? b.body.angularVelocity
          : 0;
      const ax = point.x - a.owner.position.x,
        ay = point.y - a.owner.position.y;
      const bx = point.x - b.owner.position.x,
        by = point.y - b.owner.position.y;
      const vx =
        (b.body?.type !== 'static' ? (bv?.x ?? 0) : 0) -
        bw * by -
        ((a.body?.type !== 'static' ? (av?.x ?? 0) : 0) - aw * ay);
      const vy =
        (b.body?.type !== 'static' ? (bv?.y ?? 0) : 0) +
        bw * bx -
        ((a.body?.type !== 'static' ? (av?.y ?? 0) : 0) + aw * ax);
      const speed = vx * m.nx + vy * m.ny;
      m.bounceVelocities[i] = speed < -threshold ? -restitution * speed : 0;
    }
  }
  private solveVelocity(contact: Contact): void {
    const { a, b, manifold: m } = contact;
    const friction = Math.sqrt(
      (a.body?.friction ?? 0.5) * (b.body?.friction ?? 0.5),
    );
    for (let i = 0; i < m.count; i++) {
      const p = m.points[i],
        ax = p.x - a.owner.position.x,
        ay = p.y - a.owner.position.y;
      const bx = p.x - b.owner.position.x,
        by = p.y - b.owner.position.y;
      const an = ax * m.ny - ay * m.nx,
        bn = bx * m.ny - by * m.nx;
      const denominator =
        a.inverseMass +
        b.inverseMass +
        an * an * a.inverseInertia +
        bn * bn * b.inverseInertia;
      if (denominator <= 0) continue;
      const av = a.body?.velocity,
        bv = b.body?.velocity;
      let aw =
        a.body && a.body.type !== 'static' && !a.body.lockRotation
          ? a.body.angularVelocity
          : 0;
      let bw =
        b.body && b.body.type !== 'static' && !b.body.lockRotation
          ? b.body.angularVelocity
          : 0;
      let vx =
        (b.body?.type !== 'static' ? (bv?.x ?? 0) : 0) -
        bw * by -
        ((a.body?.type !== 'static' ? (av?.x ?? 0) : 0) - aw * ay);
      let vy =
        (b.body?.type !== 'static' ? (bv?.y ?? 0) : 0) +
        bw * bx -
        ((a.body?.type !== 'static' ? (av?.y ?? 0) : 0) + aw * ax);
      const previous = m.normalImpulses[i];
      m.normalImpulses[i] = Math.max(
        0,
        previous +
          (m.bounceVelocities[i] - vx * m.nx - vy * m.ny) / denominator,
      );
      const impulse = m.normalImpulses[i] - previous;
      this.impulse(a, b, impulse * m.nx, impulse * m.ny, ax, ay, bx, by);
      aw =
        a.body && a.body.type !== 'static' && !a.body.lockRotation
          ? a.body.angularVelocity
          : 0;
      bw =
        b.body && b.body.type !== 'static' && !b.body.lockRotation
          ? b.body.angularVelocity
          : 0;
      vx =
        (b.body?.type !== 'static' ? (bv?.x ?? 0) : 0) -
        bw * by -
        ((a.body?.type !== 'static' ? (av?.x ?? 0) : 0) - aw * ay);
      vy =
        (b.body?.type !== 'static' ? (bv?.y ?? 0) : 0) +
        bw * bx -
        ((a.body?.type !== 'static' ? (av?.y ?? 0) : 0) + aw * ax);
      const tx = -m.ny,
        ty = m.nx,
        at = ax * ty - ay * tx,
        bt = bx * ty - by * tx;
      const tangentMass =
        a.inverseMass +
        b.inverseMass +
        at * at * a.inverseInertia +
        bt * bt * b.inverseInertia;
      const limit = friction * m.normalImpulses[i],
        oldTangent = m.tangentImpulses[i];
      m.tangentImpulses[i] = Math.max(
        -limit,
        Math.min(limit, oldTangent - (vx * tx + vy * ty) / tangentMass),
      );
      const tangent = m.tangentImpulses[i] - oldTangent;
      this.impulse(a, b, tangent * tx, tangent * ty, ax, ay, bx, by);
    }
  }
  private impulse(
    a: Proxy,
    b: Proxy,
    x: number,
    y: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): void {
    if (a.body && a.inverseMass) {
      a.body.velocity.x -= x * a.inverseMass;
      a.body.velocity.y -= y * a.inverseMass;
      a.body.setSolverAngularVelocity(
        a.body.angularVelocity - (ax * y - ay * x) * a.inverseInertia,
      );
    }
    if (b.body && b.inverseMass) {
      b.body.velocity.x += x * b.inverseMass;
      b.body.velocity.y += y * b.inverseMass;
      b.body.setSolverAngularVelocity(
        b.body.angularVelocity + (bx * y - by * x) * b.inverseInertia,
      );
    }
  }
  private solvePosition(contact: Contact): void {
    const { a, b } = contact,
      m = this.positionManifold;
    a.refresh();
    b.refresh();
    if (!collide(a.geometry, b.geometry, m)) return;
    const error = Math.max(0, m.penetration - physicsDefaults.penetrationSlop);
    if (!error) return;
    for (let i = 0; i < m.count; i++) {
      const p = m.points[i];
      const ax = p.x - a.owner.position.x,
        ay = p.y - a.owner.position.y;
      const bx = p.x - b.owner.position.x,
        by = p.y - b.owner.position.y;
      const an = ax * m.ny - ay * m.nx,
        bn = bx * m.ny - by * m.nx;
      const denominator =
        a.inverseMass +
        b.inverseMass +
        an * an * a.inverseInertia +
        bn * bn * b.inverseInertia;
      const correction =
        (error * physicsDefaults.positionCorrection) / (denominator * m.count);
      if (a.inverseMass) {
        a.owner.position.x -= m.nx * correction * a.inverseMass;
        a.owner.position.y -= m.ny * correction * a.inverseMass;
        a.owner.rotation -= an * correction * a.inverseInertia;
      }
      if (b.inverseMass) {
        b.owner.position.x += m.nx * correction * b.inverseMass;
        b.owner.position.y += m.ny * correction * b.inverseMass;
        b.owner.rotation += bn * correction * b.inverseInertia;
      }
    }
  }
  overlap(collider: Collider2D, owner: GameObject): readonly ContactQuery[] {
    if (this.destroyed)
      throw new Error('Cannot query a destroyed PhysicsWorld2D.');
    let geometry = this.queryGeometries.get(collider);
    if (!geometry) {
      geometry = new ShapeGeometry(collider);
      this.queryGeometries.set(collider, geometry);
    }
    geometry.refresh(owner);
    const results: ContactQuery[] = [];
    for (const proxy of this.owners.values()) {
      if (
        proxy.owner === owner ||
        !this.alive(proxy) ||
        !(collider.category & proxy.collider.mask) ||
        !(proxy.collider.category & collider.mask)
      )
        continue;
      proxy.refresh();
      if (!collide(geometry, proxy.geometry, this.queryManifold)) continue;
      const m = this.queryManifold;
      results.push({
        owner: proxy.owner,
        collider: proxy.collider,
        normal: new Vector2(m.nx, m.ny),
        points: snapshotPoints(m),
        penetration: m.penetration,
        sensor: collider.sensor || proxy.collider.sensor,
      });
    }
    return results;
  }
  /** Shape-accurate rigid translation sweep against current poses, with a proven-free prefix. */
  sweep(
    collider: Collider2D,
    owner: GameObject,
    displacement: Readonly<Vector2>,
    options: PhysicsQueryOptions2D = {},
    out: PhysicsSweepResult2D = {
      hit: false,
      owner: undefined,
      collider: undefined,
      fraction: 1,
      safeFraction: 1,
      exhausted: false,
      point: new Vector2(),
      normal: new Vector2(),
    },
  ): PhysicsSweepResult2D {
    if (this.destroyed)
      throw new Error('Cannot query a destroyed PhysicsWorld2D.');
    finite(displacement.x, 'displacement.x');
    finite(displacement.y, 'displacement.y');
    const mask = unsigned(options.mask ?? 0xffffffff, 'mask');
    let motion = this.queryMotions.get(collider);
    if (!motion) {
      motion = new ShapeMotion2D(new ShapeGeometry(collider));
      this.queryMotions.set(collider, motion);
    }
    motion.geometry.refresh(owner);
    motion.setExplicit(
      owner.position.x,
      owner.position.y,
      displacement.x,
      displacement.y,
    );
    out.hit = false;
    out.owner = undefined;
    out.collider = undefined;
    out.fraction = out.safeFraction = 1;
    out.exhausted = false;
    out.normal.set(0, 0);
    out.point.set(0, 0);
    for (const proxy of this.owners.values()) {
      if (
        proxy.owner === owner ||
        proxy.owner === options.ignore ||
        proxy.owner === options.ignoreOther ||
        !this.alive(proxy) ||
        (!options.includeSensors && proxy.collider.sensor) ||
        !(collider.category & proxy.collider.mask) ||
        !(proxy.collider.category & collider.mask & mask)
      )
        continue;
      proxy.refresh();
      proxy.motion.setExplicit(
        proxy.owner.position.x,
        proxy.owner.position.y,
        0,
        0,
      );
      const time = this.continuous.timeOfImpact(
        motion,
        proxy.motion,
        1,
        this.ccdIterations,
      );
      if (this.continuous.exhausted) {
        out.exhausted = true;
        out.safeFraction = Math.min(out.safeFraction, this.continuous.safeTime);
      }
      if (time < out.fraction) {
        const m = this.continuous.manifold;
        out.hit = true;
        out.owner = proxy.owner;
        out.collider = proxy.collider;
        out.fraction = time;
        out.normal.set(-m.nx, -m.ny);
        out.point.copy(m.points[0]);
      }
    }
    out.safeFraction = Math.min(out.safeFraction, out.fraction);
    if (out.safeFraction < out.fraction) {
      out.hit = false;
      out.owner = undefined;
      out.collider = undefined;
      out.normal.set(0, 0);
      out.point.set(0, 0);
    }
    return out;
  }
  raycast(
    origin: Vector2,
    direction: Vector2,
    maxDistance: number,
    mask = 0xffffffff,
  ): readonly PhysicsRayHit[] {
    if (this.destroyed)
      throw new Error('Cannot query a destroyed PhysicsWorld2D.');
    finite(origin.x, 'origin.x');
    finite(origin.y, 'origin.y');
    finite(direction.x, 'direction.x');
    finite(direction.y, 'direction.y');
    finite(maxDistance, 'maxDistance');
    unsigned(mask, 'mask');
    if (maxDistance < 0)
      throw new RangeError('maxDistance must be nonnegative.');
    const length = positive(direction.length(), 'direction length'),
      dx = direction.x / length,
      dy = direction.y / length;
    const results: PhysicsRayHit[] = [];
    for (const proxy of this.owners.values()) {
      if (!this.alive(proxy) || !(proxy.collider.category & mask)) continue;
      proxy.refresh();
      const distance = rayDistance(
        proxy.geometry,
        origin.x,
        origin.y,
        dx,
        dy,
        maxDistance,
        this.queryNormal,
      );
      if (distance !== undefined)
        results.push({
          owner: proxy.owner,
          collider: proxy.collider,
          distance,
          point: new Vector2(
            origin.x + dx * distance,
            origin.y + dy * distance,
          ),
          normal: this.queryNormal.clone(),
        });
    }
    results.sort((a, b) => a.distance - b.distance);
    return results;
  }
  /** Attaches a joint between registered bodies (or one body and a fixed world anchor). */
  addJoint<T extends Joint2D>(joint: T): T {
    if (this.destroyed)
      throw new Error('Cannot add a joint to a destroyed PhysicsWorld2D.');
    if (joint.attached || this.jointSet.has(joint))
      throw new Error('Joint is already attached to a PhysicsWorld2D.');
    if (this.jointSet.size >= world2dLimits.physicsJoints)
      throw new RangeError('Physics joint budget exceeded.');
    const a = this.owners.get(joint.bodyA);
    const b = joint.bodyB ? this.owners.get(joint.bodyB) : undefined;
    if (!a || (joint.bodyB && !b))
      throw new Error(
        'Joint bodies must be registered with this PhysicsWorld2D.',
      );
    if (!a.inverseMass && !b?.inverseMass)
      throw new Error('A joint needs at least one dynamic body.');
    joint.attach(this, a, b);
    this.jointSet.add(joint);
    a.body?.wake();
    b?.body?.wake();
    return joint;
  }
  removeJoint(joint: Joint2D): boolean {
    if (!this.jointSet.delete(joint)) return false;
    const [a, b] = joint.views;
    joint.detach();
    a.body?.wake();
    b.body?.wake();
    return true;
  }
  get joints(): readonly Joint2D[] {
    return [...this.jointSet];
  }
  private prepareJoints(dt: number): void {
    this.activeJoints.length = 0;
    for (const joint of this.jointSet) {
      const [a, b] = joint.views;
      if (joint.resting) continue;
      if (a.body?.isSleeping) a.body.wake();
      if (b.body?.isSleeping) b.body.wake();
      joint.prepare(dt);
      this.activeJoints.push(joint);
    }
  }
  private breakJoints(): void {
    for (const joint of [...this.activeJoints]) {
      if (
        joint.attached &&
        joint.reactionForce > joint.breakForce &&
        this.removeJoint(joint)
      )
        joint.onBreak?.(joint);
    }
    this.activeJoints.length = 0;
  }
  private jointsBlockContact(a: Proxy, b: Proxy): boolean {
    for (const joint of a.joints)
      if (!joint.collideConnected && joint.partner(a) === b) return true;
    return false;
  }
  /** Copies the current colliders, active contacts and joints for visualization. */
  debugSnapshot(): PhysicsDebugSnapshot {
    const shapes: PhysicsDebugShape[] = [];
    for (const proxy of this.owners.values()) {
      const g = proxy.geometry;
      shapes.push({
        kind: proxy.collider.kind,
        x: g.x,
        y: g.y,
        radius: g.radius,
        points: Array.from(g.points),
        bounds: [g.minX, g.minY, g.maxX, g.maxY],
        dynamic: proxy.body?.type === 'dynamic',
        sensor: proxy.collider.sensor,
        sleeping: proxy.body?.isSleeping ?? false,
      });
    }
    const contacts: PhysicsDebugContact[] = [];
    for (const contact of this.activeContacts) {
      const m = contact.manifold;
      contacts.push({
        points: snapshotPoints(m).map((p): [number, number] => [p.x, p.y]),
        normal: [m.nx, m.ny],
        sensor: contact.sensor,
      });
    }
    const joints = [...this.jointSet].map((joint): PhysicsDebugJoint => ({
      type: joint.type,
      anchors: joint.anchors(),
    }));
    return { shapes, contacts, joints };
  }
  clear(): void {
    for (const owner of this.owners.keys()) this.unregister(owner);
    this.sorted.length = 0;
    this.accumulator = 0;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.clear();
    this.disposed = true;
  }
}
