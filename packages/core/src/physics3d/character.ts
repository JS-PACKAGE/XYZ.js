import { Matrix4, Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import {
  type Collider3D,
  CapsuleCollider3D,
  nonnegative3D,
  positive3D,
  vector3D,
} from './collider.js';
import { RigidBody3D } from './body.js';
import type { PhysicsHit3D, PhysicsQueryOptions3D } from './world.js';
import { PhysicsWorld3D } from './world.js';
import { physics3DDefaults } from '../../../../src/data/physics3d.js';
import { character3DDefaults } from '../../../../src/data/character3d.js';
import { CharacterSupportPose3D } from './character-support.js';
export interface CharacterControllerOptions3D {
  skin?: number;
  stepHeight?: number;
  maxSlopeAngle?: number;
  groundSnap?: number;
  pushStrength?: number;
  maxIterations?: number;
  mask?: number;
  maxRecoveryDistance?: number;
  /** Straight-segment capsule height; radius is unchanged and feet stay fixed. */
  crouchHeight?: number;
  /** Larger observed support motion is treated as a teleport, never a carried move. */
  maxSupportDisplacement?: number;
}
export type CharacterStance3D = 'standing' | 'crouching';
export type CharacterSupportDetachReason3D =
  | 'none'
  | 'jump'
  | 'removed'
  | 'teleport'
  | 'support-teleport'
  | 'lost'
  | 'blocked'
  | 'manual';
export interface CharacterMovementOptions3D {
  /** Repeated calls in one fixed/gameplay epoch consume support motion at most once. */
  epoch?: number;
  detachSupport?: boolean;
}
const defaultMovementOptions3D: CharacterMovementOptions3D = Object.freeze({});
/** Borrowed reusable result, valid until the next stance change. */
export interface CharacterStanceResult3D {
  readonly stance: CharacterStance3D;
  readonly changed: boolean;
  readonly blocked: boolean;
  readonly radius: number;
  readonly height: number;
  readonly displacement: Readonly<Vector3>;
}
/** Borrowed reusable result and vectors, valid until the next move. */
export interface CharacterMoveResult3D {
  readonly displacement: Readonly<Vector3>;
  readonly requestedDisplacement: Readonly<Vector3>;
  readonly recoveryDisplacement: Readonly<Vector3>;
  readonly supportDisplacement: Readonly<Vector3>;
  readonly carriedDisplacement: Readonly<Vector3>;
  readonly locomotionDisplacement: Readonly<Vector3>;
  readonly support: Object3D | undefined;
  readonly supportCollider: Collider3D | undefined;
  /** Foot anchor in last consumed support-local/current world pose; zeroed without support. */
  readonly supportLocalAnchor: Readonly<Vector3>;
  readonly supportWorldAnchor: Readonly<Vector3>;
  readonly supportDetached: CharacterSupportDetachReason3D;
  readonly carryBlocked: boolean;
  /** An externally moved support left no proven collision-free carried placement. */
  readonly unresolvedPenetration: boolean;
  readonly supportYawDelta: number;
  readonly grounded: boolean;
  readonly blocked: boolean;
  readonly contacts: readonly PhysicsHit3D[];
}
/** Upright root capsule sweep/slide controller; caller supplies gravity/jump displacement. */
export class CharacterController3D {
  readonly object: Object3D;
  readonly world: PhysicsWorld3D;
  readonly skin: number;
  readonly stepHeight: number;
  readonly maxSlopeAngle: number;
  readonly groundSnap: number;
  readonly pushStrength: number;
  readonly maxIterations: number;
  readonly maxRecoveryDistance: number;
  readonly maxSupportDisplacement: number;
  readonly crouchHeight: number;
  private readonly standingCapsule: CapsuleCollider3D;
  private readonly crouchingCapsule: CapsuleCollider3D;
  private stanceState: CharacterStance3D = 'standing';
  private supportObject: Object3D | undefined;
  private supportCollider: Collider3D | undefined;
  private supportGeneration = -1;
  private unresolvedCarry = false;
  private supportCandidate: PhysicsHit3D | undefined;
  private lastCarryEpoch: number | undefined;
  private pendingDetach: CharacterSupportDetachReason3D = 'none';
  private readonly supportPose = new CharacterSupportPose3D();
  private readonly nextSupportPose = new CharacterSupportPose3D();
  private readonly inverseSupport = new Matrix4();
  private readonly localAnchor = new Vector3();
  private readonly worldAnchor = new Vector3();
  private readonly carryPoint = new Vector3();
  private readonly previousCarryPoint = new Vector3();
  private readonly carrySegment = new Vector3();
  private readonly expectedPosition = new Vector3();
  private readonly requested = new Vector3();
  private readonly recoveryApplied = new Vector3();
  private readonly supportRequested = new Vector3();
  private readonly carryApplied = new Vector3();
  private readonly locomotionApplied = new Vector3();
  private readonly phaseStart = new Vector3();
  private readonly stancePosition = new Vector3();
  private readonly stanceApplied = new Vector3();
  private readonly stanceResult: {
    stance: CharacterStance3D;
    changed: boolean;
    blocked: boolean;
    radius: number;
    height: number;
    displacement: Vector3;
  };
  private groundedState = false;
  private disposed = false;
  private createdBody: RigidBody3D | undefined;
  private readonly remaining = new Vector3();
  private readonly motion = new Vector3();
  private readonly start = new Vector3();
  private readonly stepStart = new Vector3();
  private readonly applied = new Vector3();
  private readonly stepHorizontal = new Vector3();
  private readonly query: PhysicsQueryOptions3D;
  private readonly carryQuery: PhysicsQueryOptions3D;
  private readonly hit: PhysicsHit3D;
  private readonly contacts: PhysicsHit3D[] = [];
  private readonly contactPool: PhysicsHit3D[] = [];
  private readonly result: {
    displacement: Vector3;
    requestedDisplacement: Vector3;
    recoveryDisplacement: Vector3;
    supportDisplacement: Vector3;
    carriedDisplacement: Vector3;
    locomotionDisplacement: Vector3;
    support: Object3D | undefined;
    supportCollider: Collider3D | undefined;
    supportLocalAnchor: Vector3;
    supportWorldAnchor: Vector3;
    supportDetached: CharacterSupportDetachReason3D;
    carryBlocked: boolean;
    unresolvedPenetration: boolean;
    supportYawDelta: number;
    grounded: boolean;
    blocked: boolean;
    contacts: PhysicsHit3D[];
  };
  constructor(
    object: Object3D,
    world: PhysicsWorld3D,
    options: CharacterControllerOptions3D = {},
  ) {
    this.object = object;
    this.world = world;
    this.skin = positive3D(
      options.skin ?? physics3DDefaults.characterSkin,
      'skin',
    );
    this.stepHeight = nonnegative3D(options.stepHeight ?? 0.3, 'stepHeight');
    this.maxSlopeAngle = nonnegative3D(
      options.maxSlopeAngle ?? Math.PI / 4,
      'maxSlopeAngle',
    );
    if (this.maxSlopeAngle >= Math.PI / 2)
      throw new RangeError('maxSlopeAngle must be < pi/2.');
    this.groundSnap = nonnegative3D(options.groundSnap ?? 0.08, 'groundSnap');
    this.pushStrength = nonnegative3D(
      options.pushStrength ?? 2,
      'pushStrength',
    );
    this.maxRecoveryDistance = positive3D(
      options.maxRecoveryDistance ?? 1,
      'maxRecoveryDistance',
    );
    this.maxIterations =
      options.maxIterations ?? physics3DDefaults.characterIterations;
    if (
      !Number.isInteger(this.maxIterations) ||
      this.maxIterations < 1 ||
      this.maxIterations > 32
    )
      throw new RangeError('Character iterations must be 1..32.');
    this.assertPose();
    this.standingCapsule = object.collider as CapsuleCollider3D;
    this.crouchHeight = nonnegative3D(
      options.crouchHeight ??
        this.standingCapsule.height * character3DDefaults.crouchHeightRatio,
      'crouchHeight',
    );
    if (this.crouchHeight > this.standingCapsule.height)
      throw new RangeError(
        'crouchHeight cannot exceed standing capsule height.',
      );
    this.maxSupportDisplacement = positive3D(
      options.maxSupportDisplacement ??
        character3DDefaults.maxSupportDisplacement,
      'maxSupportDisplacement',
    );
    this.crouchingCapsule = new CapsuleCollider3D(
      this.standingCapsule.radius,
      this.crouchHeight,
      this.standingCapsule,
    );
    this.expectedPosition.copy(object.position);
    this.stanceResult = {
      stance: 'standing',
      changed: false,
      blocked: false,
      radius: this.standingCapsule.radius,
      height: this.standingCapsule.height,
      displacement: this.stanceApplied,
    };
    if (object.body && object.body.type !== 'kinematic')
      throw new Error('Character requires a kinematic body.');
    if (!object.body) {
      const body = new RigidBody3D({ type: 'kinematic', lockRotation: true });
      object.body = body;
      this.createdBody = body;
    }
    this.query = { ignore: object, mask: options.mask ?? 0xffffffff };
    this.carryQuery = { ignore: object, mask: this.query.mask };
    this.hit = {
      object,
      collider: object.collider!,
      point: new Vector3(),
      normal: new Vector3(),
      distance: 0,
    };
    this.result = {
      displacement: this.applied,
      requestedDisplacement: this.requested,
      recoveryDisplacement: this.recoveryApplied,
      supportDisplacement: this.supportRequested,
      carriedDisplacement: this.carryApplied,
      locomotionDisplacement: this.locomotionApplied,
      support: undefined,
      supportCollider: undefined,
      supportLocalAnchor: this.localAnchor,
      supportWorldAnchor: this.worldAnchor,
      supportDetached: 'none',
      carryBlocked: false,
      unresolvedPenetration: false,
      supportYawDelta: 0,
      grounded: false,
      blocked: false,
      contacts: this.contacts,
    };
  }
  get grounded(): boolean {
    return this.groundedState;
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  get stance(): CharacterStance3D {
    return this.stanceState;
  }
  get support(): Object3D | undefined {
    return this.supportObject;
  }
  /** Explicitly detach before application-owned teleports or custom jumping. */
  detachSupport(): void {
    this.clearSupport('manual');
    this.groundedState = false;
    this.pendingDetach = 'manual';
  }
  private assertPose(): void {
    const o = this.object;
    if (o.destroyed || o.parent || !(o.collider instanceof CapsuleCollider3D))
      throw new Error(
        'Character requires a live root CapsuleCollider3D owner.',
      );
    if (
      o.scale.x !== 1 ||
      o.scale.y !== 1 ||
      o.scale.z !== 1 ||
      Math.abs(o.rotation.x) > character3DDefaults.poseTolerance ||
      Math.abs(o.rotation.z) > character3DDefaults.poseTolerance ||
      Math.abs(
        Math.hypot(o.rotation.x, o.rotation.y, o.rotation.z, o.rotation.w) - 1,
      ) > character3DDefaults.poseTolerance
    )
      throw new Error(
        'Character must be upright with unit scale (yaw is supported).',
      );
    vector3D(o.position, 'position');
  }
  private remember(hit: PhysicsHit3D): void {
    const index = this.contacts.length;
    let copy = this.contactPool[index];
    if (!copy)
      this.contactPool[index] = copy = {
        object: hit.object,
        collider: hit.collider,
        point: new Vector3(),
        normal: new Vector3(),
        distance: 0,
      };
    copy.object = hit.object;
    copy.collider = hit.collider;
    copy.point.copy(hit.point);
    copy.normal.copy(hit.normal);
    copy.distance = hit.distance;
    this.contacts.push(copy);
  }
  private clearSupport(reason: CharacterSupportDetachReason3D): void {
    if (this.supportObject) this.result.supportDetached = reason;
    this.supportObject = undefined;
    this.supportCollider = undefined;
    this.supportGeneration = -1;
    this.result.support = undefined;
    this.result.supportCollider = undefined;
    this.localAnchor.set(0, 0, 0);
    this.worldAnchor.set(0, 0, 0);
  }
  private detectTeleport(): void {
    const p = this.object.position,
      expected = this.expectedPosition;
    if (
      Math.hypot(p.x - expected.x, p.y - expected.y, p.z - expected.z) >
      character3DDefaults.poseTolerance
    ) {
      this.clearSupport('teleport');
      this.groundedState = false;
    }
  }
  private assertLive(): void {
    if (this.disposed) throw new Error('CharacterController3D is destroyed.');
    this.assertPose();
    if (!this.world.has(this.object))
      throw new Error('Character must be registered in its PhysicsWorld3D.');
    if (this.object.body?.type !== 'kinematic')
      throw new Error('Character kinematic body was replaced.');
  }
  /** Expansion is a clearance transaction; failure changes neither collider nor feet. */
  setStance(stance: CharacterStance3D): CharacterStanceResult3D {
    this.assertLive();
    if (stance !== 'standing' && stance !== 'crouching')
      throw new TypeError('Character stance must be standing or crouching.');
    this.detectTeleport();
    const previous = this.object.collider as CapsuleCollider3D,
      next =
        stance === 'standing' ? this.standingCapsule : this.crouchingCapsule,
      result = this.stanceResult;
    result.changed = false;
    result.blocked = false;
    this.stanceApplied.set(0, 0, 0);
    this.stancePosition.copy(this.object.position);
    this.stancePosition.y +=
      (next.height - previous.height) / 2 + next.radius - previous.radius;
    if (
      previous !== next &&
      (next.height > previous.height || next.radius > previous.radius) &&
      !this.world.canPlaceCapsule(
        this.object,
        next,
        this.stancePosition,
        this.query,
      )
    ) {
      result.blocked = true;
    } else if (previous !== next) {
      this.stepStart.copy(this.object.position);
      this.object.position.copy(this.stancePosition);
      try {
        this.object.collider = next;
      } catch (error) {
        this.object.position.copy(this.stepStart);
        throw error;
      }
      this.stanceState = stance;
      this.stanceApplied.copy(this.object.position).subtract(this.stepStart);
      result.changed = true;
    } else this.stanceState = stance;
    result.stance = this.stanceState;
    const current = this.object.collider as CapsuleCollider3D;
    result.radius = current.radius;
    result.height = current.height;
    this.expectedPosition.copy(this.object.position);
    return result;
  }
  private noteGround(): void {
    this.supportCandidate = this.contacts[this.contacts.length - 1];
    this.groundedState = true;
  }
  private advance(displacement: Readonly<Vector3>, distance: number): void {
    const len = displacement.length();
    if (len < 1e-12) return;
    const t = Math.max(0, Math.min(1, distance / len)),
      p = this.object.position;
    p.x += displacement.x * t;
    p.y += displacement.y * t;
    p.z += displacement.z * t;
  }
  private probe(distance: number, snap: boolean): boolean {
    if (distance <= 0) return false;
    this.motion.set(0, -distance, 0);
    const h = this.world.sweepCapsule(
      this.object,
      this.motion,
      this.query,
      this.hit,
    );
    if (!h || h.normal.y < Math.cos(this.maxSlopeAngle)) return false;
    if (snap) this.advance(this.motion, Math.max(0, h.distance - this.skin));
    this.remember(h);
    this.noteGround();
    return true;
  }
  private tryStep(horizontal: Readonly<Vector3>): boolean {
    if (this.stepHeight <= 0 || horizontal.length() < 1e-10) return false;
    this.stepHorizontal.set(horizontal.x, 0, horizontal.z);
    this.stepStart.copy(this.object.position);
    this.motion.set(0, this.stepHeight + this.skin, 0);
    const up = this.world.sweepCapsule(
      this.object,
      this.motion,
      this.query,
      this.hit,
    );
    if (up && up.distance < this.motion.y - this.skin) return false;
    this.object.position.y += this.motion.y;
    const forward = this.world.sweepCapsule(
      this.object,
      this.stepHorizontal,
      this.query,
      this.hit,
    );
    if (
      forward &&
      forward.distance < this.stepHorizontal.length() - this.skin
    ) {
      this.object.position.copy(this.stepStart);
      return false;
    }
    this.object.position.x += this.stepHorizontal.x;
    this.object.position.z += this.stepHorizontal.z;
    this.motion.set(0, -(this.stepHeight + this.groundSnap + 2 * this.skin), 0);
    const down = this.world.sweepCapsule(
      this.object,
      this.motion,
      this.query,
      this.hit,
    );
    if (!down || down.normal.y < Math.cos(this.maxSlopeAngle)) {
      this.object.position.copy(this.stepStart);
      return false;
    }
    this.advance(this.motion, Math.max(0, down.distance - this.skin));
    if (
      this.object.position.y - this.stepStart.y >
      this.stepHeight + this.skin
    ) {
      this.object.position.copy(this.stepStart);
      return false;
    }
    this.remember(down);
    this.noteGround();
    return true;
  }
  private sweepMotion(
    displacement: Readonly<Vector3>,
    wasGrounded: boolean,
    carried: boolean,
    query: PhysicsQueryOptions3D,
    padding = 0,
  ): boolean {
    this.remaining.set(displacement.x, displacement.y, displacement.z);
    let blocked = false;
    for (
      let iteration = 0;
      iteration < this.maxIterations && this.remaining.length() > 1e-8;
      iteration++
    ) {
      const h = this.world.sweepCapsule(
        this.object,
        this.remaining,
        query,
        this.hit,
        padding,
      );
      if (!h) {
        this.object.position.add(this.remaining);
        this.remaining.set(0, 0, 0);
        break;
      }
      this.remember(h);
      const length = this.remaining.length(),
        travel = Math.max(0, h.distance - this.skin);
      this.advance(this.remaining, travel);
      const fraction = 1 - Math.min(1, travel / length);
      this.remaining.scale(fraction);
      const n = h.normal;
      if (
        !carried &&
        wasGrounded &&
        displacement.y <= 0 &&
        n.y < Math.cos(this.maxSlopeAngle)
      ) {
        this.motion.set(this.remaining.x, 0, this.remaining.z);
        if (this.tryStep(this.motion)) {
          this.remaining.set(0, 0, 0);
          break;
        }
      }
      // Cache the hit normal before step probes overwrite the reusable hit.
      const contact = this.contacts[this.contacts.length - 1],
        normal = contact.normal;
      if (
        !carried &&
        normal.y >= Math.cos(this.maxSlopeAngle) &&
        displacement.y <= 0
      )
        this.noteGround();
      const into = this.remaining.dot(normal);
      if (into < 0) {
        const body = contact.object.body;
        if (!carried && body?.type === 'dynamic' && this.pushStrength > 0) {
          this.motion.set(
            -normal.x * -into * this.pushStrength,
            -normal.y * -into * this.pushStrength,
            -normal.z * -into * this.pushStrength,
          );
          body.applyImpulse(this.motion, contact.point);
        }
        this.remaining.x -= normal.x * into;
        this.remaining.y -= normal.y * into;
        this.remaining.z -= normal.z * into;
        if (
          !carried &&
          normal.y > 0 &&
          normal.y < Math.cos(this.maxSlopeAngle) &&
          this.remaining.y > Math.max(0, displacement.y)
        )
          this.remaining.y = Math.max(0, displacement.y);
      }
      blocked = true;
    }
    return blocked || this.remaining.length() > 1e-8;
  }
  private inheritSupport(epoch: number | undefined): void {
    const support = this.supportObject;
    if (!support) return;
    if (
      support.destroyed ||
      !this.world.has(support) ||
      support.collider !== this.supportCollider ||
      support.registrationGeneration !== this.supportGeneration
    ) {
      this.clearSupport('removed');
      this.groundedState = false;
      return;
    }
    if (epoch !== undefined && epoch === this.lastCarryEpoch) return;
    this.lastCarryEpoch = epoch;
    const previous = this.supportPose,
      next = this.nextSupportPose;
    const matrix = support.updateWorldMatrix(),
      cached = previous.matrix.elements;
    let changed = false;
    for (let i = 0; i < 16; i++)
      if (matrix.elements[i] !== cached[i]) {
        changed = true;
        break;
      }
    if (!changed) return;
    next.capture(matrix);
    const translation = Math.hypot(
        next.position.x - previous.position.x,
        next.position.y - previous.position.y,
        next.position.z - previous.position.z,
      ),
      angle = previous.angleTo(next),
      radius = Math.hypot(
        this.localAnchor.x * previous.scale.x,
        this.localAnchor.y * previous.scale.y,
        this.localAnchor.z * previous.scale.z,
      ),
      pathBound = translation + angle * radius;
    if (
      pathBound > this.maxSupportDisplacement ||
      Math.abs(previous.scale.x - next.scale.x) >
        character3DDefaults.poseTolerance ||
      Math.abs(previous.scale.y - next.scale.y) >
        character3DDefaults.poseTolerance ||
      Math.abs(previous.scale.z - next.scale.z) >
        character3DDefaults.poseTolerance
    ) {
      this.clearSupport('support-teleport');
      this.groundedState = false;
      return;
    }
    const segments = Math.max(
      1,
      Math.ceil(pathBound / character3DDefaults.supportSweepStep),
      Math.ceil(angle / character3DDefaults.supportRotationStep),
    );
    if (segments > character3DDefaults.maxSupportSegments) {
      this.clearSupport('support-teleport');
      this.groundedState = false;
      return;
    }
    // Inflate each swept chord by its maximum rigid-arc sagitta so even a thin
    // obstacle on the outside of the rotation arc cannot fall between chords.
    const padding = 2 * radius * Math.sin(angle / (4 * segments)) ** 2;
    previous.matrix.transformPoint(this.localAnchor, this.previousCarryPoint);
    next.matrix.transformPoint(this.localAnchor, this.carryPoint);
    this.supportRequested
      .copy(this.carryPoint)
      .subtract(this.previousCarryPoint);
    this.carryQuery.ignoreAlso = support;
    this.phaseStart.copy(this.object.position);
    for (let i = 1; i <= segments; i++) {
      previous.interpolatePoint(
        next,
        this.localAnchor,
        i / segments,
        this.carryPoint,
      );
      this.carrySegment.copy(this.carryPoint).subtract(this.previousCarryPoint);
      if (
        this.sweepMotion(
          this.carrySegment,
          false,
          true,
          this.carryQuery,
          padding,
        )
      )
        this.result.carryBlocked = true;
      this.previousCarryPoint.copy(this.carryPoint);
    }
    this.carryApplied.copy(this.object.position).subtract(this.phaseStart);
    let yawDelta =
      Math.atan2(next.matrix.elements[8], next.matrix.elements[10]) -
      Math.atan2(previous.matrix.elements[8], previous.matrix.elements[10]);
    yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
    const yaw =
      2 * Math.atan2(this.object.rotation.y, this.object.rotation.w) + yawDelta;
    this.object.rotation.setFromEuler(0, yaw, 0);
    this.result.supportYawDelta = yawDelta;
    previous.capture(next.matrix);
    if (this.result.carryBlocked) {
      this.clearSupport('blocked');
      this.groundedState = false;
    }
  }
  private updateSupport(epoch: number | undefined): void {
    const candidate = this.supportCandidate;
    if (
      !this.groundedState ||
      !candidate ||
      candidate.object.destroyed ||
      !this.world.has(candidate.object) ||
      candidate.object.collider !== candidate.collider
    ) {
      this.clearSupport('lost');
    } else {
      if (
        this.supportObject !== candidate.object ||
        this.supportCollider !== candidate.collider ||
        this.supportGeneration !== candidate.object.registrationGeneration
      ) {
        this.supportPose.capture(candidate.object.updateWorldMatrix());
        this.lastCarryEpoch = epoch;
      }
      this.supportObject = candidate.object;
      this.supportCollider = candidate.collider;
      this.supportGeneration = candidate.object.registrationGeneration;
      const capsule = this.object.collider as CapsuleCollider3D;
      this.worldAnchor.copy(this.object.position);
      this.worldAnchor.y -= capsule.height / 2 + capsule.radius;
      // When an epoch was already consumed, keep its snapshot: later platform
      // changes are pending until the next epoch rather than silently discarded.
      this.inverseSupport
        .copy(this.supportPose.matrix)
        .invert()
        .transformPoint(this.worldAnchor, this.localAnchor);
    }
    this.result.support = this.supportObject;
    this.result.supportCollider = this.supportCollider;
  }
  private stopUnresolvedCarry(): CharacterMoveResult3D {
    this.unresolvedCarry = true;
    this.result.unresolvedPenetration = true;
    this.result.carryBlocked = true;
    this.result.blocked = true;
    this.result.grounded = false;
    this.groundedState = false;
    this.clearSupport('blocked');
    this.result.supportDetached = 'blocked';
    this.recoveryApplied.set(0, 0, 0);
    this.locomotionApplied.set(0, 0, 0);
    this.applied.copy(this.object.position).subtract(this.start);
    this.expectedPosition.copy(this.object.position);
    this.carryQuery.ignoreAlso = undefined;
    return this.result;
  }
  move(
    displacement: Readonly<Vector3>,
    options: CharacterMovementOptions3D = defaultMovementOptions3D,
  ): CharacterMoveResult3D {
    this.assertLive();
    vector3D(displacement, 'displacement');
    if (
      options.epoch !== undefined &&
      (!Number.isSafeInteger(options.epoch) || options.epoch < 0)
    )
      throw new RangeError(
        'Character movement epoch must be a nonnegative safe integer.',
      );
    if (this.unresolvedCarry) {
      if (
        !this.world.canPlaceCapsule(
          this.object,
          this.object.collider as CapsuleCollider3D,
          this.object.position,
          this.query,
        )
      )
        throw new Error(
          'Character carried placement is unresolved; restore a collision-free pose before moving.',
        );
      this.unresolvedCarry = false;
    }
    this.requested.set(displacement.x, displacement.y, displacement.z);
    this.contacts.length = 0;
    this.supportCandidate = undefined;
    this.start.copy(this.object.position);
    this.result.blocked = false;
    this.result.carryBlocked = false;
    this.result.unresolvedPenetration = false;
    this.result.supportYawDelta = 0;
    this.result.supportDetached = this.pendingDetach;
    this.pendingDetach = 'none';
    this.supportRequested.set(0, 0, 0);
    this.carryApplied.set(0, 0, 0);
    this.detectTeleport();
    if (options.detachSupport || this.requested.y > 0) {
      this.clearSupport(this.requested.y > 0 ? 'jump' : 'manual');
      this.groundedState = false;
    } else this.inheritSupport(options.epoch);
    const carrier = this.carryQuery.ignoreAlso;
    if (
      carrier &&
      this.result.carryBlocked &&
      !this.world.canPlaceCapsule(
        this.object,
        this.object.collider as CapsuleCollider3D,
        this.object.position,
        this.query,
      )
    )
      return this.stopUnresolvedCarry();
    this.phaseStart.copy(this.object.position);
    if (
      !this.world.recoverCapsule(
        this.object,
        this.maxRecoveryDistance,
        this.query,
      )
    ) {
      if (carrier) return this.stopUnresolvedCarry();
      this.expectedPosition.copy(this.object.position);
      throw new Error(
        'Character initial penetration exceeds bounded recovery.',
      );
    }
    this.recoveryApplied.copy(this.object.position).subtract(this.phaseStart);
    if (carrier && this.recoveryApplied.length() > 1e-12) {
      // Minimum-translation recovery supplies a candidate, not proof of a
      // traversable route. Sweep its correction before committing the pose.
      this.object.position.copy(this.phaseStart);
      const obstruction = this.world.sweepCapsule(
        this.object,
        this.recoveryApplied,
        this.carryQuery,
        this.hit,
      );
      if (obstruction && obstruction.distance < this.recoveryApplied.length()) {
        this.remember(obstruction);
        return this.stopUnresolvedCarry();
      }
      this.object.position.add(this.recoveryApplied);
      if (
        !this.world.canPlaceCapsule(
          this.object,
          this.object.collider as CapsuleCollider3D,
          this.object.position,
          this.query,
        )
      ) {
        this.object.position.copy(this.phaseStart);
        return this.stopUnresolvedCarry();
      }
    }
    const wasGrounded =
      this.requested.y <= 0 &&
      (this.groundedState || this.probe(this.groundSnap + this.skin, false));
    this.groundedState = false;
    this.phaseStart.copy(this.object.position);
    this.result.blocked =
      this.sweepMotion(this.requested, wasGrounded, false, this.query) ||
      this.result.carryBlocked;
    if (this.requested.y <= 0)
      this.groundedState =
        this.probe(
          this.groundSnap + this.skin,
          wasGrounded || this.groundedState,
        ) || this.groundedState;
    this.locomotionApplied.copy(this.object.position).subtract(this.phaseStart);
    this.applied.copy(this.object.position).subtract(this.start);
    this.result.grounded = this.groundedState;
    this.updateSupport(options.epoch);
    this.expectedPosition.copy(this.object.position);
    this.carryQuery.ignoreAlso = undefined;
    return this.result;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.contacts.length = 0;
    this.contactPool.length = 0;
    this.clearSupport('removed');
    this.supportCandidate = undefined;
    this.unresolvedCarry = false;
    this.carryQuery.ignoreAlso = undefined;
    if (
      this.createdBody &&
      this.object.body === this.createdBody &&
      !this.object.destroyed
    )
      this.object.body = undefined;
    this.createdBody = undefined;
  }
}
