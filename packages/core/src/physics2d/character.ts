import { Vector2 } from '../../../math/src/index.js';
import {
  physicsDefaults,
  world2dLimits,
} from '../../../../src/data/world2d.js';
import type { GameObject } from '../game-object.js';
import { RigidBody2D } from './body.js';
import {
  Collider2D,
  finite,
  nonnegativeFinite,
  positive,
  unsigned,
} from './collider.js';
import {
  PhysicsWorld2D,
  type PhysicsQueryOptions2D,
  type PhysicsSweepResult2D,
} from './world.js';

export interface CharacterControllerOptions2D {
  skin?: number;
  stepHeight?: number;
  maxSlopeAngle?: number;
  groundSnap?: number;
  maxIterations?: number;
  maxRecoveryDistance?: number;
  maxSupportDisplacement?: number;
  mask?: number;
}
export type CharacterSupportDetachReason2D =
  | 'none'
  | 'jump'
  | 'removed'
  | 'teleport'
  | 'support-teleport'
  | 'lost'
  | 'blocked'
  | 'manual';
export interface CharacterMovementOptions2D {
  /** Support motion is consumed once per epoch, even if gameplay makes several moves. */
  epoch?: number;
  detachSupport?: boolean;
}
/** Borrowed reusable result; +Y is down and callers supply fixed-step gravity/jump displacement. */
export interface CharacterMoveResult2D {
  readonly displacement: Readonly<Vector2>;
  readonly requestedDisplacement: Readonly<Vector2>;
  readonly recoveryDisplacement: Readonly<Vector2>;
  readonly supportDisplacement: Readonly<Vector2>;
  readonly carriedDisplacement: Readonly<Vector2>;
  readonly locomotionDisplacement: Readonly<Vector2>;
  readonly supportLocalAnchor: Readonly<Vector2>;
  readonly supportWorldAnchor: Readonly<Vector2>;
  readonly support: GameObject | undefined;
  readonly supportCollider: Collider2D | undefined;
  readonly supportDetached: CharacterSupportDetachReason2D;
  readonly supportRotationDelta: number;
  readonly carryBlocked: boolean;
  readonly unresolvedPenetration: boolean;
  readonly grounded: boolean;
  readonly blocked: boolean;
  readonly exhausted: boolean;
}
interface SupportPose2D {
  x: number;
  y: number;
  angle: number;
  sx: number;
  sy: number;
}
const defaultMovementOptions: CharacterMovementOptions2D = Object.freeze({});

/** Convex root controller using the same exact geometry/filter sweeps as the rigid-body world. */
export class CharacterController2D {
  readonly skin: number;
  readonly stepHeight: number;
  readonly maxSlopeAngle: number;
  readonly groundSnap: number;
  readonly maxIterations: number;
  readonly maxRecoveryDistance: number;
  readonly maxSupportDisplacement: number;
  private readonly collider: Collider2D;
  private readonly createdBody: RigidBody2D | undefined;
  private readonly query: PhysicsQueryOptions2D;
  private readonly hit: PhysicsSweepResult2D = {
    hit: false,
    owner: undefined,
    collider: undefined,
    fraction: 1,
    safeFraction: 1,
    exhausted: false,
    point: new Vector2(),
    normal: new Vector2(),
  };
  private readonly requested = new Vector2();
  private readonly applied = new Vector2();
  private readonly recovery = new Vector2();
  private readonly supportRequested = new Vector2();
  private readonly carried = new Vector2();
  private readonly locomotion = new Vector2();
  private readonly localAnchor = new Vector2();
  private readonly worldAnchor = new Vector2();
  private readonly expected = new Vector2();
  private readonly start = new Vector2();
  private readonly phaseStart = new Vector2();
  private readonly stepStart = new Vector2();
  private readonly slideEnd = new Vector2();
  private stepObstacle = false;
  private readonly remaining = new Vector2();
  private readonly motion = new Vector2();
  private readonly pose: SupportPose2D = { x: 0, y: 0, angle: 0, sx: 1, sy: 1 };
  private readonly nextPose: SupportPose2D = {
    x: 0,
    y: 0,
    angle: 0,
    sx: 1,
    sy: 1,
  };
  private supportOwner: GameObject | undefined;
  private supportShape: Collider2D | undefined;
  private supportMembership = -1;
  private candidate: GameObject | undefined;
  private candidateCollider: Collider2D | undefined;
  private lastEpoch: number | undefined;
  private pendingDetach: CharacterSupportDetachReason2D = 'none';
  private disposed = false;
  private groundedState = false;
  private readonly result: {
    displacement: Vector2;
    requestedDisplacement: Vector2;
    recoveryDisplacement: Vector2;
    supportDisplacement: Vector2;
    carriedDisplacement: Vector2;
    locomotionDisplacement: Vector2;
    supportLocalAnchor: Vector2;
    supportWorldAnchor: Vector2;
    support: GameObject | undefined;
    supportCollider: Collider2D | undefined;
    supportDetached: CharacterSupportDetachReason2D;
    supportRotationDelta: number;
    carryBlocked: boolean;
    unresolvedPenetration: boolean;
    grounded: boolean;
    blocked: boolean;
    exhausted: boolean;
  };
  constructor(
    readonly object: GameObject,
    readonly world: PhysicsWorld2D,
    options: CharacterControllerOptions2D = {},
  ) {
    this.skin = positive(options.skin ?? physicsDefaults.characterSkin, 'skin');
    this.stepHeight = nonnegativeFinite(
      options.stepHeight ?? physicsDefaults.characterStepHeight,
      'stepHeight',
    );
    this.maxSlopeAngle = nonnegativeFinite(
      options.maxSlopeAngle ?? Math.PI / 4,
      'maxSlopeAngle',
    );
    if (this.maxSlopeAngle >= Math.PI / 2)
      throw new RangeError('maxSlopeAngle must be < pi/2.');
    this.groundSnap = nonnegativeFinite(
      options.groundSnap ?? physicsDefaults.characterGroundSnap,
      'groundSnap',
    );
    this.maxRecoveryDistance = positive(
      options.maxRecoveryDistance ?? physicsDefaults.characterMaxRecovery,
      'maxRecoveryDistance',
    );
    this.maxSupportDisplacement = positive(
      options.maxSupportDisplacement ??
        physicsDefaults.characterMaxSupportDisplacement,
      'maxSupportDisplacement',
    );
    this.maxIterations =
      options.maxIterations ?? physicsDefaults.characterIterations;
    if (
      !Number.isInteger(this.maxIterations) ||
      this.maxIterations < 1 ||
      this.maxIterations > world2dLimits.characterIterations
    )
      throw new RangeError('Invalid character iteration budget.');
    if (!object.collider || object.collider.sensor)
      throw new Error('Character requires a solid convex collider.');
    this.collider = object.collider;
    this.assertPose();
    if (!world.has(object))
      throw new Error(
        'Character must be registered with its borrowed PhysicsWorld2D.',
      );
    if (object.body && object.body.type !== 'kinematic')
      throw new Error('Character requires a kinematic body.');
    this.query = { mask: unsigned(options.mask ?? 0xffffffff, 'mask') };
    if (!object.body) {
      this.createdBody = new RigidBody2D({
        type: 'kinematic',
        lockRotation: true,
      });
      object.body = this.createdBody;
      world.register(object);
    }
    this.expected.copy(object.position);
    this.result = {
      displacement: this.applied,
      requestedDisplacement: this.requested,
      recoveryDisplacement: this.recovery,
      supportDisplacement: this.supportRequested,
      carriedDisplacement: this.carried,
      locomotionDisplacement: this.locomotion,
      supportLocalAnchor: this.localAnchor,
      supportWorldAnchor: this.worldAnchor,
      support: undefined,
      supportCollider: undefined,
      supportDetached: 'none',
      supportRotationDelta: 0,
      carryBlocked: false,
      unresolvedPenetration: false,
      grounded: false,
      blocked: false,
      exhausted: false,
    };
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  get grounded(): boolean {
    return this.groundedState;
  }
  private assertPose(): void {
    if (
      this.object.destroyed ||
      this.world.destroyed ||
      this.object.parent ||
      this.object.worldSpace !== 'world'
    )
      throw new Error(
        'Character requires a live world-space root and live world.',
      );
    if (this.object.collider !== this.collider)
      throw new Error('Character collider was replaced.');
    if (
      this.object.rotation !== 0 ||
      this.object.skew.x !== 0 ||
      this.object.skew.y !== 0 ||
      this.object.scale.x <= 0 ||
      this.object.scale.y <= 0
    )
      throw new Error(
        'Character must remain upright with positive scale and no skew.',
      );
  }
  detachSupport(reason: CharacterSupportDetachReason2D = 'manual'): void {
    this.supportOwner = undefined;
    this.supportShape = undefined;
    this.supportMembership = -1;
    this.localAnchor.set(0, 0);
    this.worldAnchor.set(0, 0);
    this.groundedState = false;
    this.pendingDetach = reason;
  }
  private readSupport(owner: GameObject, out: SupportPose2D): boolean {
    const e = owner.updateWorldMatrix().elements,
      sx = Math.hypot(e[0], e[1]),
      sy = (e[0] * e[4] - e[1] * e[3]) / sx,
      tolerance = physicsDefaults.characterSupportTransformTolerance;
    if (
      !Number.isFinite(sx) ||
      !Number.isFinite(sy) ||
      sx <= 1e-8 ||
      Math.abs(sy) <= 1e-8 ||
      Math.abs(e[0] * e[3] + e[1] * e[4]) > tolerance * sx * Math.abs(sy)
    )
      return false;
    out.x = e[6];
    out.y = e[7];
    out.angle = Math.atan2(e[1], e[0]);
    out.sx = sx;
    out.sy = sy;
    return true;
  }
  private sweep(displacement: Readonly<Vector2>): PhysicsSweepResult2D {
    return this.world.sweep(
      this.collider,
      this.object,
      displacement,
      this.query,
      this.hit,
    );
  }
  private recordGround(): void {
    if (this.hit.hit && this.hit.normal.y <= -Math.cos(this.maxSlopeAngle)) {
      this.groundedState = true;
      this.candidate = this.hit.owner;
      this.candidateCollider = this.hit.collider;
    }
  }
  private slide(
    displacement: Readonly<Vector2>,
    allowGround: boolean,
  ): boolean {
    this.remaining.copy(displacement);
    let blocked = false;
    for (let i = 0; i < this.maxIterations; i++) {
      const distance = Math.hypot(this.remaining.x, this.remaining.y);
      if (distance < 1e-9) return blocked;
      const hit = this.sweep(this.remaining),
        fraction = hit.hit
          ? Math.max(0, hit.safeFraction - this.skin / distance)
          : hit.safeFraction;
      this.object.position.x += this.remaining.x * fraction;
      this.object.position.y += this.remaining.y * fraction;
      if (hit.exhausted) {
        this.result.exhausted = true;
        return true;
      }
      if (!hit.hit) return blocked;
      blocked = true;
      if (allowGround) this.recordGround();
      if (
        allowGround &&
        hit.normal.y <= -Math.cos(this.maxSlopeAngle) &&
        Math.abs(displacement.x) < 1e-9 &&
        displacement.y >= 0
      )
        return blocked;
      if (
        allowGround &&
        Math.abs(hit.normal.x) > 0.1 &&
        hit.normal.y > -Math.cos(this.maxSlopeAngle)
      )
        this.stepObstacle = true;
      this.remaining.scale(1 - fraction);
      const into =
        this.remaining.x * hit.normal.x + this.remaining.y * hit.normal.y;
      if (into >= -1e-10) return blocked;
      this.remaining.x -= hit.normal.x * into;
      this.remaining.y -= hit.normal.y * into;
      // Non-walkable slopes may be descended, but horizontal input cannot climb them.
      if (
        allowGround &&
        hit.normal.y < 0 &&
        hit.normal.y > -Math.cos(this.maxSlopeAngle) &&
        this.remaining.y < 0
      )
        this.remaining.set(0, 0);
    }
    this.result.exhausted = true;
    return true;
  }
  private tryStep(displacement: Readonly<Vector2>): boolean {
    if (this.stepHeight === 0 || Math.abs(displacement.x) < 1e-9) return false;
    this.stepStart.copy(this.object.position);
    this.motion.set(0, -this.stepHeight);
    let hit = this.sweep(this.motion);
    if (hit.hit || hit.exhausted) return false;
    this.object.position.y -= this.stepHeight;
    this.motion.set(displacement.x, 0);
    hit = this.sweep(this.motion);
    if (hit.hit || hit.exhausted) {
      this.object.position.copy(this.stepStart);
      return false;
    }
    this.object.position.x += displacement.x;
    this.motion.set(
      0,
      this.stepHeight + Math.max(0, displacement.y) + this.groundSnap,
    );
    hit = this.sweep(this.motion);
    if (
      !hit.hit ||
      hit.exhausted ||
      hit.normal.y > -Math.cos(this.maxSlopeAngle)
    ) {
      this.object.position.copy(this.stepStart);
      return false;
    }
    this.object.position.y +=
      this.motion.y * Math.max(0, hit.fraction - this.skin / this.motion.y);
    this.recordGround();
    return true;
  }
  private recover(): void {
    let distance = 0;
    for (let pass = 0; pass < this.maxIterations; pass++) {
      let depth = this.skin,
        nx = 0,
        ny = 0;
      for (const contact of this.world.overlap(this.collider, this.object)) {
        if (
          contact.sensor ||
          contact.owner === this.query.ignoreOther ||
          !(contact.collider.category & (this.query.mask ?? 0xffffffff)) ||
          contact.penetration <= depth
        )
          continue;
        depth = contact.penetration;
        nx = contact.normal.x;
        ny = contact.normal.y;
      }
      if (nx === 0 && ny === 0) return;
      const amount = Math.min(
        depth + this.skin,
        this.maxRecoveryDistance - distance,
      );
      if (amount <= 0) {
        this.result.unresolvedPenetration = true;
        return;
      }
      this.motion.set(-nx * amount, -ny * amount);
      const hit = this.sweep(this.motion),
        fraction = hit.safeFraction;
      this.object.position.x += this.motion.x * fraction;
      this.object.position.y += this.motion.y * fraction;
      distance += amount * fraction;
      if (fraction < 1) {
        this.result.unresolvedPenetration = true;
        return;
      }
    }
    this.result.unresolvedPenetration = true;
  }
  private carry(epoch: number | undefined): void {
    const support = this.supportOwner;
    if (!support) return;
    if (
      !this.world.has(support, this.supportShape) ||
      this.world.membershipRevision(support) !== this.supportMembership ||
      this.supportShape?.sensor ||
      !(this.collider.category & (this.supportShape?.mask ?? 0)) ||
      !(
        (this.supportShape?.category ?? 0) &
        this.collider.mask &
        (this.query.mask ?? 0xffffffff)
      )
    ) {
      this.detachSupport('removed');
      return;
    }
    if (epoch !== undefined && this.lastEpoch === epoch) return;
    this.lastEpoch = epoch;
    if (!this.readSupport(support, this.nextPose)) {
      this.detachSupport('support-teleport');
      return;
    }
    const old = this.pose,
      next = this.nextPose,
      tolerance = physicsDefaults.characterSupportTransformTolerance;
    if (
      Math.abs(old.sx - next.sx) > tolerance * Math.max(old.sx, next.sx) ||
      Math.abs(old.sy - next.sy) >
        tolerance * Math.max(Math.abs(old.sy), Math.abs(next.sy))
    ) {
      this.detachSupport('support-teleport');
      return;
    }
    const angle = Math.atan2(
        Math.sin(next.angle - old.angle),
        Math.cos(next.angle - old.angle),
      ),
      ax = this.localAnchor.x * old.sx,
      ay = this.localAnchor.y * old.sy,
      c = Math.cos(next.angle),
      s = Math.sin(next.angle),
      targetX = next.x + c * ax - s * ay,
      targetY = next.y + s * ax + c * ay;
    this.supportRequested.set(
      targetX - this.object.position.x,
      targetY - this.object.position.y,
    );
    this.result.supportRotationDelta = angle;
    if (
      Math.hypot(this.supportRequested.x, this.supportRequested.y) >
      this.maxSupportDisplacement
    ) {
      this.detachSupport('support-teleport');
      return;
    }
    // Each chord's arc error is smaller than skin, so swept skin clearance also protects the arc.
    const radius = Math.hypot(ax, ay),
      angleStep = Math.min(
        physicsDefaults.characterCarryAngleStep,
        Math.sqrt((4 * this.skin) / Math.max(radius, this.skin)),
      ),
      segments = Math.max(1, Math.ceil(Math.abs(angle) / angleStep));
    this.query.ignoreOther = support;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments,
        a = old.angle + angle * t,
        ca = Math.cos(a),
        sa = Math.sin(a),
        x = old.x + (next.x - old.x) * t + ca * ax - sa * ay,
        y = old.y + (next.y - old.y) * t + sa * ax + ca * ay;
      this.motion.set(x - this.object.position.x, y - this.object.position.y);
      const hit = this.sweep(this.motion),
        length = Math.hypot(this.motion.x, this.motion.y),
        fraction = hit.hit
          ? Math.max(
              0,
              hit.safeFraction - this.skin / Math.max(length, this.skin),
            )
          : hit.safeFraction;
      this.object.position.x += this.motion.x * fraction;
      this.object.position.y += this.motion.y * fraction;
      if (hit.hit || hit.exhausted) {
        this.result.carryBlocked = true;
        this.result.exhausted ||= hit.exhausted;
        this.detachSupport('blocked');
        break;
      }
    }
    this.query.ignoreOther = undefined;
    old.x = next.x;
    old.y = next.y;
    old.angle = next.angle;
    old.sx = next.sx;
    old.sy = next.sy;
  }
  move(
    displacement: Readonly<Vector2>,
    options: CharacterMovementOptions2D = defaultMovementOptions,
  ): CharacterMoveResult2D {
    if (this.destroyed)
      throw new Error('Cannot move a destroyed CharacterController2D.');
    this.assertPose();
    if (
      !this.world.has(this.object, this.collider) ||
      this.object.body?.type !== 'kinematic'
    )
      throw new Error(
        'Character is no longer registered with its kinematic body.',
      );
    finite(displacement.x, 'displacement.x');
    finite(displacement.y, 'displacement.y');
    if (
      options.epoch !== undefined &&
      (!Number.isSafeInteger(options.epoch) || options.epoch < 0)
    )
      throw new RangeError('epoch must be a nonnegative safe integer.');
    this.start.copy(this.object.position);
    this.requested.copy(displacement);
    this.recovery.set(0, 0);
    this.supportRequested.set(0, 0);
    this.carried.set(0, 0);
    this.locomotion.set(0, 0);
    this.result.blocked =
      this.result.carryBlocked =
      this.result.unresolvedPenetration =
      this.result.exhausted =
        false;
    this.result.supportRotationDelta = 0;
    const wasGrounded = this.groundedState;
    if (
      this.expected.x !== this.object.position.x ||
      this.expected.y !== this.object.position.y
    )
      this.detachSupport('teleport');
    if (options.detachSupport) this.detachSupport('jump');
    this.phaseStart.copy(this.object.position);
    this.carry(options.epoch);
    this.carried.set(
      this.object.position.x - this.phaseStart.x,
      this.object.position.y - this.phaseStart.y,
    );
    this.phaseStart.copy(this.object.position);
    this.recover();
    this.recovery.set(
      this.object.position.x - this.phaseStart.x,
      this.object.position.y - this.phaseStart.y,
    );
    this.phaseStart.copy(this.object.position);
    this.groundedState = false;
    this.candidate = undefined;
    this.candidateCollider = undefined;
    const jumping = options.detachSupport || this.requested.y < 0;
    this.stepObstacle = false;
    this.result.blocked = this.slide(this.requested, !jumping);
    // The floor is often the first hit; stairs are attempted only after slide reaches a real riser.
    if (
      wasGrounded &&
      !jumping &&
      this.stepObstacle &&
      !this.result.exhausted
    ) {
      this.slideEnd.copy(this.object.position);
      const ground = this.groundedState,
        candidate = this.candidate,
        shape = this.candidateCollider;
      this.object.position.copy(this.phaseStart);
      if (this.tryStep(this.requested)) this.result.blocked = false;
      else {
        this.object.position.copy(this.slideEnd);
        this.groundedState = ground;
        this.candidate = candidate;
        this.candidateCollider = shape;
      }
    }
    if (!jumping && this.groundSnap > 0 && !this.result.unresolvedPenetration) {
      this.motion.set(0, this.groundSnap + this.skin);
      const hit = this.sweep(this.motion);
      if (
        hit.hit &&
        !hit.exhausted &&
        hit.normal.y <= -Math.cos(this.maxSlopeAngle)
      ) {
        this.object.position.y +=
          this.motion.y * Math.max(0, hit.fraction - this.skin / this.motion.y);
        this.recordGround();
      }
    }
    this.locomotion.set(
      this.object.position.x - this.phaseStart.x,
      this.object.position.y - this.phaseStart.y,
    );
    if (
      this.candidate &&
      this.candidateCollider &&
      this.readSupport(this.candidate, this.pose)
    ) {
      this.supportOwner = this.candidate;
      this.supportShape = this.candidateCollider;
      this.supportMembership = this.world.membershipRevision(this.candidate);
      const dx = this.object.position.x - this.pose.x,
        dy = this.object.position.y - this.pose.y,
        c = Math.cos(this.pose.angle),
        s = Math.sin(this.pose.angle);
      this.localAnchor.set(
        (c * dx + s * dy) / this.pose.sx,
        (-s * dx + c * dy) / this.pose.sy,
      );
      this.worldAnchor.copy(this.object.position);
    } else if (this.supportOwner) this.detachSupport('lost');
    this.applied.set(
      this.object.position.x - this.start.x,
      this.object.position.y - this.start.y,
    );
    this.expected.copy(this.object.position);
    this.result.support = this.supportOwner;
    this.result.supportCollider = this.supportShape;
    this.result.supportDetached = this.pendingDetach;
    this.pendingDetach = 'none';
    this.result.grounded = this.groundedState;
    return this.result;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.detachSupport();
    this.disposed = true;
    if (
      !this.object.destroyed &&
      this.createdBody &&
      this.object.body === this.createdBody
    ) {
      const registered = !this.world.destroyed && this.world.has(this.object);
      this.object.body = undefined;
      if (registered) this.world.register(this.object);
    }
  }
}
