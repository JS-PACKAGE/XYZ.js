import { Vector2 } from '../../../math/src/index.js';
import type { GameObject } from '../game-object.js';
import { GameObject as RuntimeGameObject } from '../game-object.js';
import { SceneObject } from '../scene-object.js';
import { hasObjectEventObservers } from '../event-observers.js';
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
import {
  collide,
  Manifold,
  rayDistance,
  rayMissesBounds,
} from './narrowphase.js';
import { ContinuousCollision2D, ShapeMotion2D } from './ccd.js';
import type { Joint2D } from './joints.js';
import { PhysicsForceAccumulator } from '../physics-force.js';
import { hypot2 } from '../../../math/src/hypot.js';
import { activeMoverSequence } from '../mover-sequence.js';

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
/** Shared read-only stand-in for a proxy without contacts; never written. */
const noContacts: ReadonlyMap<Proxy, Contact> = new Map();
class Proxy {
  readonly geometry: ShapeGeometry;
  /** Created by the first contact: most static colliders (tiles) never touch anything. */
  contacts: Map<Proxy, Contact> | undefined;
  inverseMass = 0;
  inverseInertia = 0;
  sleepVisited = 0;
  sleepReady = false;
  registration = 0;
  /** Step tokens: collected this step, and already kept from the last sweep order. */
  sweepStamp = 0;
  sweepKept = 0;
  /** World liveness epoch for which `live` holds; see PhysicsWorld2D.alive. */
  livenessStamp = -1;
  live = false;
  ccdStopped = false;
  ccdUnproven = false;
  /** Step token in which an existing contact of this piece became Y-separated. */
  separating = -1;
  readonly joints: Joint2D[] = [];
  private motionState: ShapeMotion2D | undefined;
  group!: readonly Proxy[];
  /** Mover snapshot in which a query last refreshed this proxy; see `refreshInSnapshot`. */
  queryEpoch = 0;
  /** Mover snapshot whose mover owns this proxy directly or through an ancestor. */
  movingEpoch = 0;
  /** Position in the world's `proxyList` while that list is current. */
  listIndex = -1;
  private observedGeometry = -1;
  /** int32 `filterBits`, which never equal NaN: the first check always reports a change. */
  private observedCategory = NaN;
  private observedMask = NaN;
  private observedSensor = false;
  geometryChanged(): boolean {
    const changed =
      this.observedGeometry !== this.geometry.revision ||
      this.observedCategory !== this.collider.filterBits[0] ||
      this.observedMask !== this.collider.filterBits[1] ||
      this.observedSensor !== this.collider.sensor;
    this.observedGeometry = this.geometry.revision;
    this.observedCategory = this.collider.filterBits[0]!;
    this.observedMask = this.collider.filterBits[1]!;
    this.observedSensor = this.collider.sensor;
    return changed;
  }
  constructor(
    readonly owner: GameObject,
    readonly collider: Collider2D,
    readonly body: RigidBody2D | undefined,
  ) {
    this.geometry = new ShapeGeometry(collider);
  }
  /** Continuous-collision state, created on first use: most proxies never move or sweep. */
  get motion(): ShapeMotion2D {
    return (this.motionState ??= new ShapeMotion2D(this.geometry));
  }
  refresh(): void {
    if (this.owner.worldSpace !== 'world')
      throw new Error('Screen-space colliders are unsupported.');
    if (this.body && this.body.type !== 'static' && this.owner.parent)
      throw new Error('Moving bodies require root world-space GameObjects.');
    if (this.owner.colliderPieces && this.body?.ccd)
      throw new RangeError('Compound CCD is unsupported.');
    const revision = this.geometry.revision;
    this.geometry.refresh(this.owner);
    if (
      (!this.body || this.body.type !== 'dynamic') &&
      revision !== this.geometry.revision
    ) {
      for (const contact of (this.contacts ?? noContacts).values()) {
        const other = contact.a === this ? contact.b : contact.a;
        if (!contact.sensor && !contact.cancelled) other.body?.wake();
      }
      for (const joint of this.joints) joint.partner(this)?.body?.wake();
    }
    this.inverseMass = this.body ? this.body.inverseMass : 0;
    this.inverseInertia = this.owner.colliderPieces
      ? this.body
        ? this.body.inverseInertia
        : 0
      : this.body && this.inverseMass && !this.body.lockRotation
        ? 1 / (this.body.mass * this.geometry.inertiaPerMass)
        : 0;
  }
}
/** Positions per union block of snapshot query bounds; a power of two. */
const snapshotBlockShift = 5;
const snapshotBlock = 1 << snapshotBlockShift;
/**
 * Query refresh inside a pose snapshot (`epoch` from `queryRefreshEpoch`, nonzero): frozen
 * snapshots refresh nothing; a moving one refreshes each proxy on its first query and the
 * mover's own proxies on every query.
 */
function refreshInSnapshot(proxy: Proxy, epoch: number): void {
  if (epoch < 0 || (proxy.queryEpoch === epoch && proxy.movingEpoch !== epoch))
    return;
  proxy.refresh();
  proxy.queryEpoch = epoch;
}
class Contact {
  readonly manifold = new Manifold();
  cancelled = false;
  sensor = false;
  seen = 0;
  active = false;
  /**
   * Per manifold point: lever arms `ax, ay, bx, by`, normal and tangent effective-mass
   * denominators, plus the pair friction, computed by the first `solveVelocity` of a
   * velocity solve (`armsSolve`); poses and masses are fixed until it ends.
   */
  readonly arms = new Float64Array(12);
  friction = 0;
  armsSolve = 0;
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
// Registration rises along owner order, so the tie-break gives exactly the stable sort of
// owner order by minX (a NaN difference also falls through, as it compared equal before).
const compareBounds = (a: Proxy, b: Proxy): number =>
  a.geometry.minX - b.geometry.minX || a.registration - b.registration;
/**
 * Sorts by compareBounds, a strict total order (finite bounds, unique registrations), so any
 * correct sort yields the one ordering Array#sort would. The sweep order is kept from the
 * last step and nearly sorted: insertion sort runs in about linear time without the merge
 * buffer Array#sort allocated per step, and hands over to it past a shift budget.
 */
function sortSweepOrder(order: Proxy[]): void {
  let budget = order.length * 8;
  for (let i = 1; i < order.length; i++) {
    const value = order[i]!;
    let j = i - 1;
    while (j >= 0 && compareBounds(order[j]!, value) > 0) {
      order[j + 1] = order[j]!;
      j--;
      if (--budget < 0) {
        // Slot j + 1 holds a duplicate of its shifted neighbour; restore the permutation.
        order[j + 1] = value;
        order.sort(compareBounds);
        return;
      }
    }
    order[j + 1] = value;
  }
}
const continueSimulation = (): boolean => true;
// Collision dispatch must remain observable through subclass and prototype overrides.
const dispatchGameObjectEvent = RuntimeGameObject.prototype.dispatchEvent;
const sceneObjectPrototype = SceneObject.prototype;
const dispatchSceneObjectEvent = sceneObjectPrototype.dispatchEvent;
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
  private readonly proxies = new Set<Proxy>();
  private readonly sorted: Proxy[] = [];
  /** Last step's sweep order; re-sorting it is near linear while bodies barely move. */
  private readonly sweepOrder: Proxy[] = [];
  /** Per sorted slot, the first slot at or after it with mass or a sensor; reused across steps. */
  private sweepNextActive = new Int32Array(0);
  private readonly activeContacts = new Set<Contact>();
  private readonly solveContacts: Contact[] = [];
  /** Contacts the velocity iterations solve when no joint can wake a body mid-solve. */
  private readonly velocityContacts: Contact[] = [];

  /** Number of registered colliders, static ones included. */
  get colliderCount(): number {
    return this.proxies.size;
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
  /** `sweep`'s query box from `ContinuousCollision2D.sweptBox`. */
  private readonly sweepBox = new Float64Array(4);
  /** `proxies` in order, rebuilt after liveness changes (every membership change bumps it). */
  private proxyList: Proxy[] = [];
  private proxyListLiveness = -1;
  /**
   * Bounds of the proxies a moving pose snapshot has already refreshed, by position in
   * `proxyList` (`[minX, maxX, minY, maxY]` each), plus their union and count per block of
   * `snapshotBlock` positions. Those proxies stay put until the epoch ends.
   */
  private snapshotBounds = new Float64Array(0);
  private snapshotKnown = new Uint8Array(0);
  private snapshotBlockBounds = new Float64Array(0);
  private snapshotBlockKnown = new Uint8Array(0);
  private snapshotBoundsEpoch = 0;
  private snapshotBoundsLiveness = -1;
  /** Mover sequence the known bounds were recorded in; 0 outside one. */
  private snapshotBoundsSequence = 0;
  private readonly queryMotions = new WeakMap<Collider2D, ShapeMotion2D>();
  private continuation: () => boolean = continueSimulation;
  private accumulator = 0;
  private stepToken = 0;
  /** Identifies one run of velocity iterations; see `Contact.armsSolve`. */
  private velocitySolve = 0;
  private stepping = false;
  /** Bumped by membership changes and user callbacks; caches alive() while stepping. */
  private liveness = 0;
  private disposed = false;
  private timeStep: number = physicsDefaults.fixedDelta;
  private stepLimit: number = physicsDefaults.maxSubSteps;
  private velocityPasses: number = physicsDefaults.velocityIterations;
  private positionPasses: number = physicsDefaults.positionIterations;
  droppedTime = 0;
  private geometryVersion = 0;
  private registrationVersion = 0;
  /** Set inside withPoseSnapshot: poses were refreshed once and nothing can move them. */
  private poseSnapshot = false;
  /** Nonzero inside a moving pose snapshot; see `withPoseSnapshot`. */
  private moverEpoch = 0;
  private moverEpochs = 0;
  /** Collision-bake snapshot token, including direct mutable transforms and query filters. */
  get geometryRevision(): number {
    if (this.poseSnapshot) return this.geometryVersion;
    for (const proxy of this.proxies) {
      if (!this.alive(proxy)) continue;
      proxy.refresh();
      if (proxy.geometryChanged()) this.geometryVersion++;
    }
    return this.geometryVersion;
  }
  /**
   * @internal Runs synchronous queries (no user code runs inside `run`) without rechecking
   * every pose per query. Without `mover` nothing moves: poses are refreshed once up front.
   * With one, only `mover` and its descendants move: each other queried proxy is refreshed
   * on first use only, so validation errors surface exactly where they did before.
   */
  withPoseSnapshot<T>(run: () => T, mover?: GameObject): T {
    if (this.poseSnapshot || this.moverEpoch) {
      if (mover || this.moverEpoch)
        throw new Error('A moving pose snapshot cannot be nested.');
      return run();
    }
    if (mover) {
      // Within a mover sequence the known bounds carry over; only this mover's go stale.
      const forget =
        activeMoverSequence() !== 0 &&
        this.snapshotBoundsSequence === activeMoverSequence() &&
        this.snapshotBoundsLiveness === this.liveness &&
        this.proxyListLiveness === this.liveness;
      this.markMoving(mover, (this.moverEpoch = ++this.moverEpochs), forget);
      try {
        return run();
      } finally {
        this.moverEpoch = 0;
      }
    }
    void this.geometryRevision;
    this.poseSnapshot = true;
    try {
      return run();
    } finally {
      this.poseSnapshot = false;
    }
  }
  private markMoving(object: GameObject, epoch: number, forget: boolean): void {
    const proxy = this.owners.get(object);
    if (proxy)
      for (const piece of proxy.group) {
        piece.movingEpoch = epoch;
        const index = piece.listIndex;
        if (forget && this.snapshotKnown[index]) {
          this.snapshotKnown[index] = 0;
          // The block's union keeps the old bounds: a superset only skips less.
          this.snapshotBlockKnown[index >> snapshotBlockShift]!--;
        }
      }
    for (const child of object.children) this.markMoving(child, epoch, forget);
  }
  /** -1: every pose is current; 0: refresh each queried proxy; else the mover epoch. */
  private get queryRefreshEpoch(): number {
    return this.poseSnapshot ? -1 : this.moverEpoch;
  }
  private orderedProxies(): Proxy[] {
    if (this.proxyListLiveness !== this.liveness) {
      const list = this.proxyList;
      let count = 0;
      for (const proxy of this.proxies) {
        proxy.listIndex = count;
        list[count++] = proxy;
      }
      list.length = count;
      this.proxyListLiveness = this.liveness;
    }
    return this.proxyList;
  }
  /**
   * The known-bounds flags for a moving snapshot `epoch`, else undefined. Inside one, no user
   * code runs, so `proxyList` keeps its order and a refreshed proxy that is not moving keeps
   * its bounds. A mover sequence extends that across its snapshots; `markMoving` forgets
   * each new mover's bounds.
   */
  private knownBounds(epoch: number, count: number): Uint8Array | undefined {
    if (epoch <= 0) return undefined;
    if (
      this.snapshotBoundsLiveness !== this.liveness ||
      (this.snapshotBoundsEpoch !== epoch &&
        (activeMoverSequence() === 0 ||
          this.snapshotBoundsSequence !== activeMoverSequence()))
    ) {
      const blocks = (count + snapshotBlock - 1) >> snapshotBlockShift;
      if (this.snapshotKnown.length < count) {
        this.snapshotKnown = new Uint8Array(count * 2);
        this.snapshotBounds = new Float64Array(count * 8);
        this.snapshotBlockKnown = new Uint8Array(blocks * 2);
        this.snapshotBlockBounds = new Float64Array(blocks * 8);
      } else {
        this.snapshotKnown.fill(0, 0, count);
        this.snapshotBlockKnown.fill(0, 0, blocks);
      }
      this.snapshotBoundsLiveness = this.liveness;
      this.snapshotBoundsSequence = activeMoverSequence();
    }
    this.snapshotBoundsEpoch = epoch;
    return this.snapshotKnown;
  }
  /** A matrix pass on `owner`'s Scene for a query loop, or undefined when one is open. */
  private openMatrixPass(owner: GameObject): GameObject['scene'] {
    const scene = owner.scene;
    return scene?.beginMatrixPass() ? scene : undefined;
  }
  /** Records a proxy refreshed inside moving snapshot `epoch` at `index` in `proxyList`. */
  private recordBounds(proxy: Proxy, index: number, epoch: number): void {
    if (proxy.movingEpoch === epoch || this.snapshotKnown[index]) return;
    const g = proxy.geometry,
      bounds = this.snapshotBounds,
      at = index * 4,
      block = index >> snapshotBlockShift,
      union = this.snapshotBlockBounds,
      b = block * 4;
    bounds[at] = g.minX;
    bounds[at + 1] = g.maxX;
    bounds[at + 2] = g.minY;
    bounds[at + 3] = g.maxY;
    this.snapshotKnown[index] = 1;
    if (this.snapshotBlockKnown[block]++ === 0) {
      union[b] = g.minX;
      union[b + 1] = g.maxX;
      union[b + 2] = g.minY;
      union[b + 3] = g.maxY;
    } else {
      union[b] = Math.min(union[b]!, g.minX);
      union[b + 1] = Math.max(union[b + 1]!, g.maxX);
      union[b + 2] = Math.min(union[b + 2]!, g.minY);
      union[b + 3] = Math.max(union[b + 3]!, g.maxY);
    }
  }
  /** Whether every position of the block starting at `index` has known bounds. */
  private blockKnown(index: number, count: number): boolean {
    return (
      this.snapshotBlockKnown[index >> snapshotBlockShift] ===
      Math.min(snapshotBlock, count - index)
    );
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
    return (
      !!proxy &&
      proxy.group.some(
        (piece) => piece.collider === collider && this.alive(piece),
      )
    );
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
    const colliders = owner.colliderPieces ?? [owner.collider];
    if (colliders[0] !== owner.collider)
      throw new RangeError(
        'The primary collider must be the first compound piece.',
      );
    const previousCount = previous?.group.length ?? 0;
    if (
      this.proxies.size - previousCount + colliders.length >
      world2dLimits.physicsBodies
    )
      throw new RangeError('Physics collider budget exceeded.');
    const group = colliders.map(
      (collider) => new Proxy(owner, collider, owner.body),
    );
    for (const piece of group) {
      piece.group = group;
      piece.refresh();
    }
    const proxy = group[0];
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
    for (const piece of group) {
      this.proxies.add(piece);
      piece.registration = ++this.registrationVersion;
    }
    this.liveness++;
    this.geometryVersion++;
  }
  unregister(owner: GameObject): void {
    const proxy = this.owners.get(owner);
    if (!proxy) return;
    this.owners.delete(owner);
    this.liveness++;
    this.geometryVersion++;
    if (proxy.body) this.forces.delete(proxy.body);
    for (const joint of [...proxy.joints]) this.removeJoint(joint);
    // Delete membership before callback dispatch: recursive unregister is harmless.
    for (const piece of proxy.group) {
      this.proxies.delete(piece);
      for (const contact of (piece.contacts ?? noContacts).values())
        this.end(contact);
      piece.contacts?.clear();
    }
  }
  private alive(proxy: Proxy): boolean {
    if (this.destroyed || proxy.owner.destroyed) return false;
    // Membership and identity change only through register/unregister (the facade
    // collider/body setters and Scene membership) or user callbacks, which all bump the
    // epoch; between steps no other path can, so queries reuse the cache too.
    if (proxy.livenessStamp === this.liveness) return proxy.live;
    const live =
      this.proxies.has(proxy) &&
      this.owners.get(proxy.owner)?.group === proxy.group &&
      proxy.owner.collider === proxy.group[0].collider &&
      proxy.owner.body === proxy.body;
    proxy.livenessStamp = this.liveness;
    proxy.live = live;
    return live;
  }
  /**
   * Dispatches `name` to each observing side and reports whether any listener ran. Only a
   * dispatch can run user code, so without one no simulation or liveness state changed.
   */
  private emit(contact: Contact, name: string): boolean {
    let dispatched = false;
    for (let receiver = 0; receiver < 2; receiver++) {
      const self = receiver ? contact.b : contact.a,
        other = receiver ? contact.a : contact.b;
      // Every check here only skips this receiver and none has side effects, so the cheap
      // unobserved test runs first. The continuation is consulted before a dispatch: with
      // no listener to run, skipping a receiver and stopping are indistinguishable.
      if (
        self.owner.dispatchEvent === dispatchGameObjectEvent &&
        sceneObjectPrototype.dispatchEvent === dispatchSceneObjectEvent &&
        !hasObjectEventObservers(self.owner, name)
      )
        continue;
      if (name !== 'collisionend' && !this.continuation()) return dispatched;
      if (!this.alive(self)) continue;
      if (name !== 'collisionend' && (!contact.active || !this.alive(other)))
        continue;
      dispatched = true;
      this.dispatchCollision(contact, name, self, other, receiver ? -1 : 1);
    }
    return dispatched;
  }
  /**
   * Kept out of `emit`: the `cancelResponse` closure captures its parameters, and a capture
   * inside `emit` made every call (observed or not) allocate a context for them.
   */
  private dispatchCollision(
    contact: Contact,
    name: string,
    self: Proxy,
    other: Proxy,
    sign: number,
  ): void {
    const m = contact.manifold;
    const step = this.stepToken;
    const detail: CollisionDetail = {
      self: self.owner,
      other: other.owner,
      normal: new Vector2(sign * m.nx, sign * m.ny),
      points: snapshotPoints(m),
      penetration: m.penetration,
      sensor: contact.sensor,
      cancelResponse: () => {
        if (name === 'precollision' && this.stepping && this.stepToken === step)
          contact.cancelled = true;
      },
    };
    try {
      self.owner.dispatchEvent(
        new CustomEvent<CollisionDetail>(name, { detail }),
      );
    } finally {
      this.liveness++;
    }
  }
  private end(contact: Contact): void {
    if (!contact.active) return;
    contact.active = false;
    this.activeContacts.delete(contact);
    contact.a.contacts?.delete(contact.b);
    contact.b.contacts?.delete(contact.a);
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
    // Discarding nothing leaves every accumulator unchanged; most frames drop no time.
    if (delta === 0) return;
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
      // Bodiless and static proxies (tiles) skip first: the liveness and owner checks before
      // `isSleeping` (which may wake) have no effects, so only their cost changes.
      if (
        !body ||
        body.type === 'static' ||
        !this.alive(proxy) ||
        this.owners.get(proxy.owner) !== proxy ||
        body.isSleeping ||
        proxy.ccdStopped
      )
        continue;
      proxy.owner.position.x += body.velocity.x * dt;
      proxy.owner.position.y += body.velocity.y * dt;
      if (!body.lockRotation) proxy.owner.rotation += body.angularVelocity * dt;
      proxy.refresh();
      for (const piece of proxy.group) if (piece !== proxy) piece.refresh();
    }
  }
  private activate(contact: Contact, token: number): boolean {
    const { a, b, manifold: m } = contact;
    contact.sensor = a.collider.sensor || b.collider.sensor;
    contact.seen = token;
    contact.cancelled = false;
    // Two slots each; plain stores avoid a builtin call per contact per step.
    m.normalImpulses[0] = m.normalImpulses[1] = 0;
    m.tangentImpulses[0] = m.tangentImpulses[1] = 0;
    if (!contact.active) {
      contact.active = true;
      (a.contacts ??= new Map()).set(b, contact);
      (b.contacts ??= new Map()).set(a, contact);
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
    // The checks above still hold unless a listener ran.
    if (
      this.emit(contact, 'precollision') &&
      (!this.continuation() ||
        !contact.active ||
        !this.alive(a) ||
        !this.alive(b))
    )
      return false;
    if (!contact.sensor) this.prepareBounce(contact);
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
      // Motions feed only the CCD pairs below; without a CCD body there are none to read them.
      let continuous = false;
      for (const proxy of this.sorted)
        if (proxy.body?.ccd) {
          continuous = true;
          break;
        }
      if (continuous)
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
            a.owner === b.owner ||
            (b.body?.ccd && j <= i) ||
            !this.alive(b) ||
            (!a.inverseMass && !b.inverseMass) ||
            a.collider.sensor ||
            b.collider.sensor ||
            !(a.collider.filterBits[0]! & b.collider.filterBits[1]!) ||
            !(b.collider.filterBits[0]! & a.collider.filterBits[1]!) ||
            this.jointsBlockContact(a, b)
          )
            continue;
          const existing = a.contacts?.get(b);
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
          impactA.contacts?.get(impactB) ?? new Contact(impactA, impactB),
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
        this.velocitySolve++;
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
    // Overwritten by index and truncated once: emptying it first dropped its storage, which
    // then regrew every step.
    const sorted = this.sorted;
    let sortedCount = 0;
    // No bump here: every membership or identity change since the last step went through
    // register/unregister or a dispatched callback, each of which already bumped the epoch.
    this.solveContacts.length = 0;
    const token = ++this.stepToken;
    // Nothing in this loop moves an object, so children of one parent (tile colliders under
    // a TileMap) reuse its world matrix instead of composing it once per child.
    let pass: GameObject['scene'];
    try {
      for (const proxy of this.owners.values()) {
        if (!this.alive(proxy)) {
          // Unregistering dispatches callbacks, which may move objects.
          pass?.endMatrixPass();
          pass = undefined;
          this.unregister(proxy.owner);
          continue;
        }
        if (!pass) {
          const scene = proxy.owner.scene;
          if (scene?.beginMatrixPass()) pass = scene;
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
        for (const piece of proxy.group) {
          // The main proxy was refreshed above, and nothing since moved anything.
          if (piece !== proxy || !pass || !piece.geometry.refreshedFromInputs)
            piece.refresh();
          piece.sweepStamp = token;
          sorted[sortedCount++] = piece;
        }
      }
    } finally {
      pass?.endMatrixPass();
      if (sorted.length !== sortedCount) sorted.length = sortedCount;
    }
    this.integrateContinuous(dt, token);
    if (!this.continuation()) return;
    const order = this.sweepOrder;
    let kept = 0;
    for (const proxy of order)
      if (proxy.sweepStamp === token) {
        proxy.sweepKept = token;
        order[kept++] = proxy;
      }
    order.length = kept;
    for (const proxy of this.sorted)
      if (proxy.sweepKept !== token) order.push(proxy);
    sortSweepOrder(order);
    for (let i = 0; i < order.length; i++) this.sorted[i] = order[i]!;
    // Lets a passive entry jump straight to its next possible partner.
    const count = this.sorted.length;
    if (this.sweepNextActive.length <= count)
      this.sweepNextActive = new Int32Array(count * 2 + 1);
    const nextActive = this.sweepNextActive;
    nextActive[count] = count;
    let ordered = true;
    for (let i = count - 1; i >= 0; i--) {
      const proxy = this.sorted[i]!;
      nextActive[i] =
        proxy.inverseMass || proxy.collider.sensor ? i : nextActive[i + 1]!;
      if (i > 0 && !(this.sorted[i - 1]!.geometry.minX <= proxy.geometry.minX))
        ordered = false;
    }
    // Pieces with an existing contact whose bounds no longer overlap in Y. Only those pairs can
    // need the lookup below (collide() resets a separating contact's manifold); other Y-separated
    // candidates would fail collide()'s bounds test without side effects.
    for (const contact of this.activeContacts) {
      const ga = contact.a.geometry,
        gb = contact.b.geometry;
      if (ga.maxY < gb.minY || gb.maxY < ga.minY)
        contact.a.separating = contact.b.separating = token;
    }
    // User callbacks may move geometry; they bump liveness, which disables the shortcut.
    const liveness = this.liveness;
    for (let i = 0; i < this.sorted.length; i++) {
      const a = this.sorted[i];
      if (!this.alive(a)) continue;
      // Two massless non-sensors never pair. Every rejection below only skips the pair, so
      // testing this cheapest one first changes nothing but the cost of static neighbours.
      const passive = !a.inverseMass && !a.collider.sensor;
      for (let j = i + 1; j < this.sorted.length; j++) {
        // Passive neighbours are rejected below anyway. With ascending minX, a skipped slot
        // beyond a's maxX means the next active one is too, so the break still applies.
        // Exact until a user callback (which bumps liveness) could edit bodies or bounds.
        if (passive && ordered && this.liveness === liveness) {
          j = nextActive[j]!;
          if (j === count) break;
        }
        const b = this.sorted[j];
        if (b.geometry.minX > a.geometry.maxX) break;
        if (passive && !b.inverseMass && !b.collider.sensor) continue;
        // Every test from here to the contact lookup only skips the pair and none has side
        // effects, so the Y separation, which rejects most of a sweep's candidates, runs first.
        if (
          (a.geometry.maxY < b.geometry.minY ||
            b.geometry.maxY < a.geometry.minY) &&
          this.liveness === liveness &&
          (a.separating !== token || b.separating !== token)
        )
          continue;
        if (
          a.owner === b.owner ||
          !this.alive(b) ||
          !(a.collider.filterBits[0]! & b.collider.filterBits[1]!) ||
          !(b.collider.filterBits[0]! & a.collider.filterBits[1]!)
        )
          continue;
        const sensor = a.collider.sensor || b.collider.sensor;
        if (a.group[0].joints.length && this.jointsBlockContact(a, b)) continue;
        let contact = a.contacts?.get(b);
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
    // Iterations change only velocities, so each contact's arms and masses hold throughout.
    this.velocitySolve++;
    if (this.activeJoints.length === 0) {
      // Without joints, impulses only reach bodies of contacts that passed this filter
      // (both awake), so no iteration can wake a body, end a contact or change liveness.
      const solvable = this.velocityContacts;
      let count = 0;
      for (const contact of this.solveContacts)
        if (this.solvable(contact)) solvable[count++] = contact;
      for (let iteration = 0; iteration < this.velocityIterations; iteration++)
        for (let i = 0; i < count; i++) this.solveVelocity(solvable[i]!);
    } else
      for (
        let iteration = 0;
        iteration < this.velocityIterations;
        iteration++
      ) {
        for (const joint of this.activeJoints) joint.solveVelocity(dt);
        for (const contact of this.solveContacts)
          if (this.solvable(contact)) this.solveVelocity(contact);
      }
    for (let iteration = 0; iteration < this.positionIterations; iteration++) {
      for (const joint of this.activeJoints) joint.solvePosition();
      for (const contact of this.solveContacts)
        if (this.solvable(contact)) this.solvePosition(contact);
    }
    this.breakJoints();
    for (const contact of this.solveContacts) {
      if (contact.active) this.emit(contact, 'postcollision');
      if (!this.continuation()) return;
    }
    // Only bodies capture a presentation pose (and changing the body drops it), so sealing
    // a bodiless owner's (a tile's) does nothing.
    for (const proxy of this.owners.values())
      if (proxy.body && this.alive(proxy)) proxy.owner.sealPhysicsPose();
    for (const proxy of this.owners.values()) {
      // Only islands read the flag, and they hold only proxies with mass: a bodiless one
      // (a tile) would just store `false` again.
      const body = proxy.body;
      if (!body) continue;
      const ready = body.updateSleep(dt);
      for (const piece of proxy.group) piece.sleepReady = ready;
    }
    // Islands reuse `sleepGroup` by count: emptying it per island dropped its storage.
    const group = this.sleepGroup;
    for (const start of this.sorted) {
      if (!start.inverseMass || start.sleepVisited === token) continue;
      let size = 0;
      group[size++] = start;
      start.sleepVisited = token;
      let ready = true;
      for (let i = 0; i < size; i++) {
        const proxy = group[i]!;
        ready &&= proxy.sleepReady;
        for (const piece of proxy.group) {
          if (piece.sleepVisited === token) continue;
          piece.sleepVisited = token;
          group[size++] = piece;
        }
        for (const contact of (proxy.contacts ?? noContacts).values()) {
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
          group[size++] = other;
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
          group[size++] = other;
        }
      }
      if (ready) for (let i = 0; i < size; i++) group[i]!.body?.sleep();
    }
  }
  private wakeContactGroups(token: number): void {
    // Propagate through a whole stack before solving any contact.
    const group = this.sleepGroup;
    for (const start of this.sorted) {
      if (
        !start.inverseMass ||
        start.body?.isSleeping ||
        start.sleepVisited === -token
      )
        continue;
      let size = 0;
      group[size++] = start;
      start.sleepVisited = -token;
      for (let i = 0; i < size; i++) {
        const proxy = group[i]!;
        for (const piece of proxy.group) {
          if (piece.sleepVisited === -token) continue;
          piece.sleepVisited = -token;
          group[size++] = piece;
        }
        for (const contact of (proxy.contacts ?? noContacts).values()) {
          if (contact.sensor || contact.cancelled) continue;
          const other = contact.a === proxy ? contact.b : contact.a;
          if (!other.inverseMass || other.sleepVisited === -token) continue;
          if (other.body?.isSleeping) other.body.wake();
          other.sleepVisited = -token;
          group[size++] = other;
        }
        for (const joint of proxy.joints) {
          const view = joint.partner(proxy);
          const other = view && this.owners.get(view.owner);
          if (!other?.inverseMass || other.sleepVisited === -token) continue;
          if (other.body?.isSleeping) other.body.wake();
          other.sleepVisited = -token;
          group[size++] = other;
        }
      }
    }
  }
  private prepareBounce(contact: Contact): void {
    const { a, b, manifold: m } = contact;
    const restitution = Math.max(
      a.body ? a.body.restitution : 0,
      b.body ? b.body.restitution : 0,
    );
    // A body resting under gravity approaches at about gravity * dt each step; bouncing on that
    // would keep it awake forever, so the threshold never drops below a couple of gravity steps.
    const threshold = Math.max(
      physicsDefaults.restitutionThreshold,
      hypot2(this.gravity.x, this.gravity.y) *
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
        (b.body?.type !== 'static' ? (bv ? bv.x : 0) : 0) -
        bw * by -
        ((a.body?.type !== 'static' ? (av ? av.x : 0) : 0) - aw * ay);
      const vy =
        (b.body?.type !== 'static' ? (bv ? bv.y : 0) : 0) +
        bw * bx -
        ((a.body?.type !== 'static' ? (av ? av.y : 0) : 0) + aw * ax);
      const speed = vx * m.nx + vy * m.ny;
      m.bounceVelocities[i] = speed < -threshold ? -restitution * speed : 0;
    }
  }
  /** Active, uncancelled, non-sensor, live pair with no sleeping body. */
  private solvable(contact: Contact): boolean {
    return (
      contact.active &&
      !contact.cancelled &&
      !contact.sensor &&
      this.alive(contact.a) &&
      this.alive(contact.b) &&
      !(contact.a.body?.isSleeping || contact.b.body?.isSleeping)
    );
  }
  private solveVelocity(contact: Contact): void {
    const { a, b, manifold: m } = contact;
    // Static bodies and bodiless colliders contribute no velocity; which bodies move or spin
    // cannot change while this contact is solved, so it is decided once, not per term.
    const aBody = a.body,
      bBody = b.body;
    const av = aBody && aBody.type !== 'static' ? aBody.velocity : undefined,
      bv = bBody && bBody.type !== 'static' ? bBody.velocity : undefined;
    const aSpins = av !== undefined && !aBody!.lockRotation,
      bSpins = bv !== undefined && !bBody!.lockRotation;
    const arms = contact.arms;
    if (contact.armsSolve !== this.velocitySolve) {
      contact.armsSolve = this.velocitySolve;
      // `x ? x.f : d`, not `x?.f ?? d`: merging an optional double with `undefined` makes V8
      // box it, which allocated per contact and iteration.
      contact.friction = Math.sqrt(
        (a.body ? a.body.friction : 0.5) * (b.body ? b.body.friction : 0.5),
      );
      for (let i = 0; i < m.count; i++) {
        const p = m.points[i],
          ax = p.x - a.owner.position.x,
          ay = p.y - a.owner.position.y;
        const bx = p.x - b.owner.position.x,
          by = p.y - b.owner.position.y;
        const an = ax * m.ny - ay * m.nx,
          bn = bx * m.ny - by * m.nx;
        const tx = -m.ny,
          ty = m.nx,
          at = ax * ty - ay * tx,
          bt = bx * ty - by * tx;
        const k = i * 6;
        arms[k] = ax;
        arms[k + 1] = ay;
        arms[k + 2] = bx;
        arms[k + 3] = by;
        arms[k + 4] =
          a.inverseMass +
          b.inverseMass +
          an * an * a.inverseInertia +
          bn * bn * b.inverseInertia;
        arms[k + 5] =
          a.inverseMass +
          b.inverseMass +
          at * at * a.inverseInertia +
          bt * bt * b.inverseInertia;
      }
    }
    const friction = contact.friction;
    for (let i = 0; i < m.count; i++) {
      const k = i * 6,
        ax = arms[k]!,
        ay = arms[k + 1]!,
        bx = arms[k + 2]!,
        by = arms[k + 3]!,
        denominator = arms[k + 4]!;
      if (denominator <= 0) continue;
      let aw = aSpins ? aBody!.angularVelocity : 0;
      let bw = bSpins ? bBody!.angularVelocity : 0;
      let vx = (bv ? bv.x : 0) - bw * by - ((av ? av.x : 0) - aw * ay);
      let vy = (bv ? bv.y : 0) + bw * bx - ((av ? av.y : 0) + aw * ax);
      const previous = m.normalImpulses[i];
      m.normalImpulses[i] = Math.max(
        0,
        previous +
          (m.bounceVelocities[i] - vx * m.nx - vy * m.ny) / denominator,
      );
      const impulse = m.normalImpulses[i] - previous;
      this.impulse(a, b, impulse * m.nx, impulse * m.ny, ax, ay, bx, by);
      aw = aSpins ? aBody!.angularVelocity : 0;
      bw = bSpins ? bBody!.angularVelocity : 0;
      vx = (bv ? bv.x : 0) - bw * by - ((av ? av.x : 0) - aw * ay);
      vy = (bv ? bv.y : 0) + bw * bx - ((av ? av.y : 0) + aw * ax);
      const tx = -m.ny,
        ty = m.nx;
      const tangentMass = arms[k + 5]!;
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
    const epoch = this.queryRefreshEpoch,
      list = this.orderedProxies(),
      count = list.length,
      known = this.knownBounds(epoch, count),
      bounds = this.snapshotBounds,
      union = this.snapshotBlockBounds;
    // Nothing in this loop moves an object, so a parent (a TileMap of solid tiles) composes
    // its world matrix once rather than once per child collider.
    const pass = this.openMatrixPass(owner);
    try {
      for (let index = 0; index < count; index++) {
        // collide()'s own bounds test, on bounds this snapshot already refreshed: such a proxy
        // (or a whole block, by its union) is skipped whatever the filters below decide, and
        // they have no effects.
        if (known) {
          if (
            (index & (snapshotBlock - 1)) === 0 &&
            this.blockKnown(index, count)
          ) {
            const at = (index >> snapshotBlockShift) * 4;
            if (
              geometry.maxX < union[at]! ||
              union[at + 1]! < geometry.minX ||
              geometry.maxY < union[at + 2]! ||
              union[at + 3]! < geometry.minY
            ) {
              index += snapshotBlock - 1;
              continue;
            }
          }
          if (known[index]) {
            const at = index * 4;
            if (
              geometry.maxX < bounds[at]! ||
              bounds[at + 1]! < geometry.minX ||
              geometry.maxY < bounds[at + 2]! ||
              bounds[at + 3]! < geometry.minY
            )
              continue;
          }
        }
        const proxy = list[index]!;
        // A frozen snapshot refreshed every live pose up front, so the same bounds test can
        // run on the proxy's own geometry ahead of the filters; a dead proxy is skipped either way.
        if (epoch < 0) {
          const other = proxy.geometry;
          if (
            geometry.maxX < other.minX ||
            other.maxX < geometry.minX ||
            geometry.maxY < other.minY ||
            other.maxY < geometry.minY
          )
            continue;
        }
        if (
          proxy.owner === owner ||
          !this.alive(proxy) ||
          !(collider.category & proxy.collider.mask) ||
          !(proxy.collider.category & collider.mask)
        )
          continue;
        if (epoch === 0) proxy.refresh();
        else refreshInSnapshot(proxy, epoch);
        if (known) this.recordBounds(proxy, index, epoch);
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
    } finally {
      pass?.endMatrixPass();
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
    const epoch = this.queryRefreshEpoch,
      box = this.sweepBox,
      tolerance = physicsDefaults.sweepTolerance,
      list = this.orderedProxies(),
      count = list.length,
      known = this.knownBounds(epoch, count),
      bounds = this.snapshotBounds,
      union = this.snapshotBlockBounds;
    this.continuous.sweptBox(motion, 1, box);
    // Nothing in this loop moves an object, so a parent (a TileMap of solid tiles) composes
    // its world matrix once rather than once per child collider.
    const pass = this.openMatrixPass(owner);
    try {
      for (let index = 0; index < count; index++) {
        // The bounds test below on bounds this snapshot already refreshed; see `overlap`.
        if (known) {
          if (
            (index & (snapshotBlock - 1)) === 0 &&
            this.blockKnown(index, count)
          ) {
            const at = (index >> snapshotBlockShift) * 4;
            if (!(
              box[0]! <= union[at + 1]! + tolerance &&
              box[1]! >= union[at]! &&
              box[2]! <= union[at + 3]! + tolerance &&
              box[3]! >= union[at + 2]!
            )) {
              index += snapshotBlock - 1;
              continue;
            }
          }
          if (known[index]) {
            const at = index * 4;
            if (!(
              box[0]! <= bounds[at + 1]! + tolerance &&
              box[1]! >= bounds[at]! &&
              box[2]! <= bounds[at + 3]! + tolerance &&
              box[3]! >= bounds[at + 2]!
            ))
              continue;
          }
        }
        const proxy = list[index]!;
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
        if (epoch === 0) proxy.refresh();
        else refreshInSnapshot(proxy, epoch);
        if (known) this.recordBounds(proxy, index, epoch);
        // The resting proxy's side of timeOfImpact's bounds test: a proxy outside the swept
        // box gets no impact, so its motion need not be set (CCD sets motions before use).
        const g = proxy.geometry;
        if (!(
          box[0]! <= g.maxX + tolerance &&
          box[1]! >= g.minX &&
          box[2]! <= g.maxY + tolerance &&
          box[3]! >= g.minY
        ))
          continue;
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
          out.safeFraction = Math.min(
            out.safeFraction,
            this.continuous.safeTime,
          );
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
    } finally {
      pass?.endMatrixPass();
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
    const epoch = this.queryRefreshEpoch;
    // In a frozen snapshot every pose is current, so a proven miss (see below) is skipped
    // before the liveness and mask filters, which would skip it too and have no effects.
    const frozen = epoch < 0;
    // As in `overlap`: a shared parent composes its world matrix once for the whole loop.
    let pass: GameObject['scene'];
    try {
      for (const proxy of this.proxies) {
        if (
          frozen &&
          rayMissesBounds(
            proxy.geometry,
            origin.x,
            origin.y,
            dx,
            dy,
            maxDistance,
          )
        )
          continue;
        if (!this.alive(proxy) || !(proxy.collider.category & mask)) continue;
        if (!pass) pass = this.openMatrixPass(proxy.owner);
        if (epoch === 0) proxy.refresh();
        else refreshInSnapshot(proxy, epoch);
        // A proven miss skips the exact test, which on a miss writes nothing.
        const distance =
          !frozen &&
          rayMissesBounds(
            proxy.geometry,
            origin.x,
            origin.y,
            dx,
            dy,
            maxDistance,
          )
            ? undefined
            : rayDistance(
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
    } finally {
      pass?.endMatrixPass();
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
      ) {
        try {
          joint.onBreak?.(joint);
        } finally {
          this.liveness++;
        }
      }
    }
    this.activeJoints.length = 0;
  }
  private jointsBlockContact(a: Proxy, b: Proxy): boolean {
    for (const joint of a.group[0].joints)
      if (!joint.collideConnected && joint.partner(a.group[0]) === b.group[0])
        return true;
    return false;
  }
  /** Copies the current colliders, active contacts and joints for visualization. */
  debugSnapshot(): PhysicsDebugSnapshot {
    const shapes: PhysicsDebugShape[] = [];
    for (const proxy of this.proxies) {
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
    this.sweepOrder.length = 0;
    // Count-reused scratch keeps stale entries past its counts; drop them with the world.
    this.velocityContacts.length = this.sleepGroup.length = 0;
    this.accumulator = 0;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.clear();
    this.disposed = true;
  }
}
