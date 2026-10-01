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
export interface PhysicsWorldOptions {
  gravity?: [number, number];
  fixedDelta?: number;
  maxSubSteps?: number;
  velocityIterations?: number;
  positionIterations?: number;
}
class Proxy {
  readonly geometry: ShapeGeometry;
  readonly contacts = new Map<Proxy, Contact>();
  inverseMass = 0;
  inverseInertia = 0;
  sleepVisited = 0;
  sleepReady = false;
  constructor(
    readonly owner: GameObject,
    readonly collider: Collider2D,
    readonly body: RigidBody2D | undefined,
  ) {
    this.geometry = new ShapeGeometry(collider);
  }
  refresh(): void {
    if (this.owner.worldSpace !== 'world')
      throw new Error('Screen-space colliders are unsupported.');
    if (this.body?.type === 'dynamic' && this.owner.parent)
      throw new Error('Dynamic bodies require root world-space GameObjects.');
    const oldX = this.geometry.x,
      oldY = this.geometry.y,
      oldMinX = this.geometry.minX,
      oldMinY = this.geometry.minY,
      oldMaxX = this.geometry.maxX,
      oldMaxY = this.geometry.maxY;
    this.geometry.refresh(this.owner);
    if (!this.body || this.body.type === 'static') {
      if (
        oldX !== this.geometry.x ||
        oldY !== this.geometry.y ||
        oldMinX !== this.geometry.minX ||
        oldMinY !== this.geometry.minY ||
        oldMaxX !== this.geometry.maxX ||
        oldMaxY !== this.geometry.maxY
      )
        for (const contact of this.contacts.values()) {
          const other = contact.a === this ? contact.b : contact.a;
          other.body?.wake();
        }
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
  private readonly sleepGroup: Proxy[] = [];
  private readonly forceBodies = new Set<RigidBody2D>();
  private readonly queryManifold = new Manifold();
  private readonly positionManifold = new Manifold();
  private readonly queryNormal = new Vector2();
  private readonly queryGeometries = new WeakMap<Collider2D, ShapeGeometry>();
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
  }
  unregister(owner: GameObject): void {
    const proxy = this.owners.get(owner);
    if (!proxy) return;
    this.owners.delete(owner);
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
  update(
    deltaTime: number,
    canContinue: () => boolean = continueSimulation,
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
      for (const body of this.forceBodies) body.clearForces();
      this.forceBodies.clear();
      this.solveContacts.length = 0;
      this.stepping = false;
      this.continuation = continueSimulation;
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
      const body = proxy.body;
      if (body?.type === 'dynamic' && !body.isSleeping) {
        finite(body.velocity.x, 'velocity.x');
        finite(body.velocity.y, 'velocity.y');
        body.velocity.x +=
          (this.gravity.x * body.gravityScale +
            body.force.x * proxy.inverseMass) *
          dt;
        body.velocity.y +=
          (this.gravity.y * body.gravityScale +
            body.force.y * proxy.inverseMass) *
          dt;
        body.velocity.scale(1 / (1 + body.linearDamping * dt));
        body.setSolverAngularVelocity(
          body.lockRotation
            ? 0
            : (body.angularVelocity + body.torque * proxy.inverseInertia * dt) /
                (1 + body.angularDamping * dt),
        );
        proxy.owner.position.x += body.velocity.x * dt;
        proxy.owner.position.y += body.velocity.y * dt;
        proxy.owner.rotation += body.angularVelocity * dt;
        this.forceBodies.add(body);
        proxy.refresh();
      }
      this.sorted.push(proxy);
    }
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
        let contact = a.contacts.get(b);
        if (!contact) {
          // The scratch manifold avoids allocating a contact for AABB-only candidates.
          if (!collide(a.geometry, b.geometry, this.queryManifold)) continue;
          contact = new Contact(a, b);
        }
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
        contact.cancelled = false;
        contact.manifold.normalImpulses.fill(0);
        contact.manifold.tangentImpulses.fill(0);
        if (!contact.active) {
          contact.active = true;
          a.contacts.set(b, contact);
          b.contacts.set(a, contact);
          this.activeContacts.add(contact);
          this.emit(contact, 'collisionstart');
        }
        if (!this.continuation()) return;
        if (!contact.active || !this.alive(a) || !this.alive(b)) continue;
        this.emit(contact, 'precollision');
        if (!this.continuation()) return;
        if (!contact.active || !this.alive(a) || !this.alive(b)) continue;
        this.prepareBounce(contact);
        this.solveContacts.push(contact);
      }
    }
    for (const contact of this.activeContacts) {
      if (contact.seen !== token) this.end(contact);
      if (!this.continuation()) return;
    }
    this.wakeContactGroups(token);
    for (let iteration = 0; iteration < this.velocityIterations; iteration++) {
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
    for (const contact of this.solveContacts) {
      if (contact.active) this.emit(contact, 'postcollision');
      if (!this.continuation()) return;
    }
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
          if (!other.inverseMass || other.sleepVisited === token) continue;
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
      }
    }
  }
  private prepareBounce(contact: Contact): void {
    const { a, b, manifold: m } = contact;
    const restitution = Math.max(
      a.body?.restitution ?? 0,
      b.body?.restitution ?? 0,
    );
    for (let i = 0; i < m.count; i++) {
      const point = m.points[i];
      const av = a.body?.velocity,
        bv = b.body?.velocity;
      const aw = a.inverseMass ? (a.body?.angularVelocity ?? 0) : 0;
      const bw = b.inverseMass ? (b.body?.angularVelocity ?? 0) : 0;
      const ax = point.x - a.owner.position.x,
        ay = point.y - a.owner.position.y;
      const bx = point.x - b.owner.position.x,
        by = point.y - b.owner.position.y;
      const vx =
        (b.inverseMass ? (bv?.x ?? 0) : 0) -
        bw * by -
        ((a.inverseMass ? (av?.x ?? 0) : 0) - aw * ay);
      const vy =
        (b.inverseMass ? (bv?.y ?? 0) : 0) +
        bw * bx -
        ((a.inverseMass ? (av?.y ?? 0) : 0) + aw * ax);
      const speed = vx * m.nx + vy * m.ny;
      m.bounceVelocities[i] =
        speed < -physicsDefaults.restitutionThreshold
          ? -restitution * speed
          : 0;
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
      let aw = a.inverseMass ? (a.body?.angularVelocity ?? 0) : 0;
      let bw = b.inverseMass ? (b.body?.angularVelocity ?? 0) : 0;
      let vx =
        (b.inverseMass ? (bv?.x ?? 0) : 0) -
        bw * by -
        ((a.inverseMass ? (av?.x ?? 0) : 0) - aw * ay);
      let vy =
        (b.inverseMass ? (bv?.y ?? 0) : 0) +
        bw * bx -
        ((a.inverseMass ? (av?.y ?? 0) : 0) + aw * ax);
      const previous = m.normalImpulses[i];
      m.normalImpulses[i] = Math.max(
        0,
        previous +
          (m.bounceVelocities[i] - vx * m.nx - vy * m.ny) / denominator,
      );
      const impulse = m.normalImpulses[i] - previous;
      this.impulse(a, b, impulse * m.nx, impulse * m.ny, ax, ay, bx, by);
      aw = a.inverseMass ? (a.body?.angularVelocity ?? 0) : 0;
      bw = b.inverseMass ? (b.body?.angularVelocity ?? 0) : 0;
      vx =
        (b.inverseMass ? (bv?.x ?? 0) : 0) -
        bw * by -
        ((a.inverseMass ? (av?.x ?? 0) : 0) - aw * ay);
      vy =
        (b.inverseMass ? (bv?.y ?? 0) : 0) +
        bw * bx -
        ((a.inverseMass ? (av?.y ?? 0) : 0) + aw * ax);
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
