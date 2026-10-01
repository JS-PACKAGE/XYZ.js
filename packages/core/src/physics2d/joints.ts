import { GameObject } from '../game-object.js';
import { physicsDefaults } from '../../../../src/data/world2d.js';
import { finite, nonnegativeFinite } from './collider.js';
import type { RigidBody2D } from './body.js';

/** The solver-facing view of a registered body; the world's internal proxies satisfy it. */
export interface JointBodyView {
  readonly owner: GameObject;
  readonly body: RigidBody2D | undefined;
  readonly inverseMass: number;
  readonly inverseInertia: number;
  readonly joints: Joint2D[];
}

/** A fixed, massless world anchor used when `bodyB` is omitted. */
const groundOwner = new GameObject();
export const groundView: JointBodyView = Object.freeze({
  owner: groundOwner,
  body: undefined,
  inverseMass: 0,
  inverseInertia: 0,
  joints: [],
});

interface Pose {
  x: number;
  y: number;
  angle: number;
}
function readPose(owner: GameObject, out: Pose): Pose {
  if (!owner.parent) {
    out.x = owner.position.x;
    out.y = owner.position.y;
    out.angle = owner.rotation;
  } else {
    const e = owner.updateWorldMatrix().elements;
    out.x = e[6];
    out.y = e[7];
    out.angle = Math.atan2(e[1], e[0]);
  }
  return out;
}
const poseA: Pose = { x: 0, y: 0, angle: 0 };
const poseB: Pose = { x: 0, y: 0, angle: 0 };
const scratchVelocity = { x: 0, y: 0 };

function angularVelocity(view: JointBodyView): number {
  return view.inverseMass && view.body ? view.body.angularVelocity : 0;
}
function addVelocity(
  view: JointBodyView,
  vx: number,
  vy: number,
  w: number,
): void {
  if (!view.inverseMass || !view.body) return;
  view.body.velocity.x += vx;
  view.body.velocity.y += vy;
  view.body.setSolverAngularVelocity(view.body.angularVelocity + w);
}
function move(view: JointBodyView, x: number, y: number, angle: number): void {
  if (!view.inverseMass) return;
  view.owner.position.x += x;
  view.owner.position.y += y;
  view.owner.rotation += angle;
}
const linearX = (view: JointBodyView): number =>
  view.inverseMass && view.body ? view.body.velocity.x : 0;
const linearY = (view: JointBodyView): number =>
  view.inverseMass && view.body ? view.body.velocity.y : 0;

export interface JointOptions {
  /** Body whose registered collider and RigidBody2D take part in the world. */
  bodyA: GameObject;
  /** Omit to anchor `bodyA` to a fixed world point. */
  bodyB?: GameObject;
  /** World-space anchor on `bodyA`, derived into a local anchor from its pose at creation. */
  anchor: readonly [number, number];
  /** World-space anchor on `bodyB` (or the fixed world). Defaults to `anchor`. */
  anchorB?: readonly [number, number];
  /** Let the two bodies keep colliding with each other. Default false. */
  collideConnected?: boolean;
  /** Reaction force (impulse per second) above which the joint removes itself. Default Infinity. */
  breakForce?: number;
}

/**
 * Sequential-impulse joint. Subclasses implement the constraint math; PhysicsWorld2D owns
 * attachment, ordering and removal. All anchors rotate rigidly with their body and ignore scale.
 */
export abstract class Joint2D {
  readonly bodyA: GameObject;
  readonly bodyB: GameObject | undefined;
  readonly collideConnected: boolean;
  breakForce: number;
  /** Called once, after the world removes a joint whose reaction exceeded `breakForce`. */
  onBreak: ((joint: Joint2D) => void) | undefined;
  protected viewA: JointBodyView = groundView;
  protected viewB: JointBodyView = groundView;
  protected localAx = 0;
  protected localAy = 0;
  protected localBx = 0;
  protected localBy = 0;
  protected referenceAngle = 0;
  // Per-step state shared by the constraints.
  protected rAx = 0;
  protected rAy = 0;
  protected rBx = 0;
  protected rBy = 0;
  protected mA = 0;
  protected mB = 0;
  protected iA = 0;
  protected iB = 0;
  protected reactionX = 0;
  protected reactionY = 0;
  private readonly anchor: readonly [number, number];
  private readonly anchorB: readonly [number, number];
  private attachedWorld: object | undefined;

  constructor(options: JointOptions) {
    this.bodyA = options.bodyA;
    this.bodyB = options.bodyB;
    if (options.bodyA === options.bodyB)
      throw new RangeError('A joint needs two different bodies.');
    this.anchor = [
      finite(options.anchor[0], 'anchor.x'),
      finite(options.anchor[1], 'anchor.y'),
    ];
    this.anchorB = [
      finite((options.anchorB ?? options.anchor)[0], 'anchorB.x'),
      finite((options.anchorB ?? options.anchor)[1], 'anchorB.y'),
    ];
    this.collideConnected = options.collideConnected ?? false;
    this.breakForce = options.breakForce ?? Infinity;
    if (!(this.breakForce > 0))
      throw new RangeError('breakForce must be positive.');
  }

  get attached(): boolean {
    return this.attachedWorld !== undefined;
  }
  /** Total anchor reaction of the last solved step, as a force. */
  get reactionForce(): number {
    return Math.hypot(this.reactionX, this.reactionY) * this.stepRate;
  }
  private stepRate = 0;

  /**
   * @internal Resolves local anchors from the current poses and registers on both bodies. With
   * no second body the fixed world becomes side A and `bodyA` side B, so single-body joints
   * read naturally: angles, translations and motors are the body's, relative to the world.
   */
  attach(world: object, a: JointBodyView, b: JointBodyView | undefined): void {
    if (this.attachedWorld) throw new Error('Joint is already attached.');
    this.viewA = b ? a : groundView;
    this.viewB = b ?? a;
    const pointA = b ? this.anchor : this.anchorB;
    const pointB = b ? this.anchorB : this.anchor;
    const pa = readPose(this.viewA.owner, poseA),
      pb = readPose(this.viewB.owner, poseB);
    const ca = Math.cos(pa.angle),
      sa = Math.sin(pa.angle),
      cb = Math.cos(pb.angle),
      sb = Math.sin(pb.angle);
    this.localAx = ca * (pointA[0] - pa.x) + sa * (pointA[1] - pa.y);
    this.localAy = -sa * (pointA[0] - pa.x) + ca * (pointA[1] - pa.y);
    this.localBx = cb * (pointB[0] - pb.x) + sb * (pointB[1] - pb.y);
    this.localBy = -sb * (pointB[0] - pb.x) + cb * (pointB[1] - pb.y);
    this.referenceAngle = pb.angle - pa.angle;
    this.initialize(pa, pb);
    this.attachedWorld = world;
    if (this.viewA !== groundView) this.viewA.joints.push(this);
    this.viewB.joints.push(this);
  }
  /** @internal */
  detach(): void {
    for (const view of [this.viewA, this.viewB]) {
      const index = view.joints.indexOf(this);
      if (index >= 0) view.joints.splice(index, 1);
    }
    this.attachedWorld = undefined;
  }
  /** @internal The body on the other side of `view`, or undefined for the world anchor. */
  partner(view: JointBodyView): JointBodyView | undefined {
    const other = view === this.viewA ? this.viewB : this.viewA;
    return other === groundView ? undefined : other;
  }
  /** @internal Both ends are static or asleep. */
  get resting(): boolean {
    const asleep = (view: JointBodyView): boolean =>
      !view.inverseMass || (view.body?.isSleeping ?? true);
    return asleep(this.viewA) && asleep(this.viewB);
  }
  /** @internal */
  get views(): readonly [JointBodyView, JointBodyView] {
    return [this.viewA, this.viewB];
  }

  /** Called once at attach with the poses used to derive the local anchors. */
  protected initialize(a: Pose, b: Pose): void {
    void a;
    void b;
  }

  /** @internal Recomputes world lever arms and masses; clears accumulated impulses. */
  prepare(dt: number): void {
    const pa = readPose(this.viewA.owner, poseA),
      pb = readPose(this.viewB.owner, poseB);
    const ca = Math.cos(pa.angle),
      sa = Math.sin(pa.angle),
      cb = Math.cos(pb.angle),
      sb = Math.sin(pb.angle);
    this.rAx = ca * this.localAx - sa * this.localAy;
    this.rAy = sa * this.localAx + ca * this.localAy;
    this.rBx = cb * this.localBx - sb * this.localBy;
    this.rBy = sb * this.localBx + cb * this.localBy;
    this.mA = this.viewA.inverseMass;
    this.mB = this.viewB.inverseMass;
    this.iA = this.viewA.inverseInertia;
    this.iB = this.viewB.inverseInertia;
    this.reactionX = this.reactionY = 0;
    this.stepRate = 1 / dt;
    this.prepareStep(dt, pa, pb);
  }
  protected abstract prepareStep(dt: number, a: Pose, b: Pose): void;
  /** @internal */
  abstract solveVelocity(dt: number): void;
  /** @internal Returns the remaining positional error before this correction. */
  abstract solvePosition(): number;

  // ---- shared building blocks ------------------------------------------------------------
  /** Velocity of anchor B relative to anchor A. */
  protected relativeAnchorVelocity(out: { x: number; y: number }): void {
    const wA = angularVelocity(this.viewA),
      wB = angularVelocity(this.viewB);
    out.x =
      linearX(this.viewB) -
      wB * this.rBy -
      (linearX(this.viewA) - wA * this.rAy);
    out.y =
      linearY(this.viewB) +
      wB * this.rBx -
      (linearY(this.viewA) + wA * this.rAx);
  }
  protected applyImpulse(px: number, py: number): void {
    addVelocity(
      this.viewA,
      -px * this.mA,
      -py * this.mA,
      -this.iA * (this.rAx * py - this.rAy * px),
    );
    addVelocity(
      this.viewB,
      px * this.mB,
      py * this.mB,
      this.iB * (this.rBx * py - this.rBy * px),
    );
    this.reactionX += px;
    this.reactionY += py;
  }
  protected applyAngularImpulse(impulse: number): void {
    addVelocity(this.viewA, 0, 0, -this.iA * impulse);
    addVelocity(this.viewB, 0, 0, this.iB * impulse);
  }
  protected relativeAngularVelocity(): number {
    return angularVelocity(this.viewB) - angularVelocity(this.viewA);
  }
  /** Solves the two-axis point constraint `anchorB == anchorA` for velocity. */
  protected solvePointVelocity(): void {
    const v = scratchVelocity;
    this.relativeAnchorVelocity(v);
    const m = this.mA + this.mB;
    const k11 =
      m + this.rAy * this.rAy * this.iA + this.rBy * this.rBy * this.iB;
    const k12 = -this.rAy * this.rAx * this.iA - this.rBy * this.rBx * this.iB;
    const k22 =
      m + this.rAx * this.rAx * this.iA + this.rBx * this.rBx * this.iB;
    const determinant = k11 * k22 - k12 * k12;
    if (determinant === 0) return;
    this.applyImpulse(
      -(k22 * v.x - k12 * v.y) / determinant,
      -(k11 * v.y - k12 * v.x) / determinant,
    );
  }
  /** Moves the bodies so the two anchors coincide; returns the error before correction. */
  protected solvePointPosition(): number {
    const pa = readPose(this.viewA.owner, poseA),
      pb = readPose(this.viewB.owner, poseB);
    const ca = Math.cos(pa.angle),
      sa = Math.sin(pa.angle),
      cb = Math.cos(pb.angle),
      sb = Math.sin(pb.angle);
    const rAx = ca * this.localAx - sa * this.localAy,
      rAy = sa * this.localAx + ca * this.localAy,
      rBx = cb * this.localBx - sb * this.localBy,
      rBy = sb * this.localBx + cb * this.localBy;
    const cx = pb.x + rBx - (pa.x + rAx),
      cy = pb.y + rBy - (pa.y + rAy);
    const error = Math.hypot(cx, cy);
    const limit = physicsDefaults.jointMaxCorrection;
    const scale = error > limit ? limit / error : 1;
    const m = this.mA + this.mB;
    const k11 = m + rAy * rAy * this.iA + rBy * rBy * this.iB;
    const k12 = -rAy * rAx * this.iA - rBy * rBx * this.iB;
    const k22 = m + rAx * rAx * this.iA + rBx * rBx * this.iB;
    const determinant = k11 * k22 - k12 * k12;
    if (determinant === 0) return error;
    const px = (-(k22 * cx - k12 * cy) / determinant) * scale,
      py = (-(k11 * cy - k12 * cx) / determinant) * scale;
    move(
      this.viewA,
      -px * this.mA,
      -py * this.mA,
      -this.iA * (rAx * py - rAy * px),
    );
    move(
      this.viewB,
      px * this.mB,
      py * this.mB,
      this.iB * (rBx * py - rBy * px),
    );
    return error;
  }
  protected currentAngle(): number {
    return (
      readPose(this.viewB.owner, poseB).angle -
      readPose(this.viewA.owner, poseA).angle -
      this.referenceAngle
    );
  }
}

// ---------------------------------------------------------------------------------------------

export interface DistanceJointOptions extends JointOptions {
  /** Rest length; defaults to the distance between the two anchors at creation. */
  length?: number;
  /** 0 (default) is rigid; otherwise the spring frequency in Hz. */
  frequencyHz?: number;
  dampingRatio?: number;
}

/** Keeps two anchors a fixed distance apart, rigidly or as a damped spring. */
export class DistanceJoint extends Joint2D {
  length: number;
  frequencyHz: number;
  dampingRatio: number;
  private nx = 0;
  private ny = 0;
  private axialMass = 0;
  private gamma = 0;
  private bias = 0;
  private impulse = 0;

  constructor(options: DistanceJointOptions) {
    super(options);
    this.length =
      options.length ??
      Math.hypot(
        (options.anchorB ?? options.anchor)[0] - options.anchor[0],
        (options.anchorB ?? options.anchor)[1] - options.anchor[1],
      );
    this.frequencyHz = nonnegativeFinite(
      options.frequencyHz ?? 0,
      'frequencyHz',
    );
    this.dampingRatio = nonnegativeFinite(
      options.dampingRatio ?? 0,
      'dampingRatio',
    );
    this.length = nonnegativeFinite(this.length, 'length');
  }
  protected prepareStep(dt: number, a: Pose, b: Pose): void {
    const dx = b.x + this.rBx - (a.x + this.rAx),
      dy = b.y + this.rBy - (a.y + this.rAy);
    const distance = Math.hypot(dx, dy);
    this.nx = distance > 1e-9 ? dx / distance : 1;
    this.ny = distance > 1e-9 ? dy / distance : 0;
    const crossA = this.rAx * this.ny - this.rAy * this.nx,
      crossB = this.rBx * this.ny - this.rBy * this.nx;
    const k =
      this.mA + this.mB + this.iA * crossA * crossA + this.iB * crossB * crossB;
    this.axialMass = k > 0 ? 1 / k : 0;
    this.gamma = 0;
    this.bias = 0;
    this.impulse = 0;
    if (this.frequencyHz > 0 && this.axialMass > 0) {
      const omega = 2 * Math.PI * this.frequencyHz;
      const damping = 2 * this.axialMass * this.dampingRatio * omega;
      const stiffness = this.axialMass * omega * omega;
      const h = dt * (damping + dt * stiffness);
      this.gamma = h > 0 ? 1 / h : 0;
      this.bias = (distance - this.length) * dt * stiffness * this.gamma;
      this.axialMass = 1 / (k + this.gamma);
    }
  }
  solveVelocity(): void {
    const v = scratchVelocity;
    this.relativeAnchorVelocity(v);
    const cdot = this.nx * v.x + this.ny * v.y;
    const delta =
      -this.axialMass * (cdot + this.bias + this.gamma * this.impulse);
    this.impulse += delta;
    this.applyImpulse(delta * this.nx, delta * this.ny);
  }
  solvePosition(): number {
    if (this.frequencyHz > 0) return 0;
    const pa = readPose(this.viewA.owner, poseA),
      pb = readPose(this.viewB.owner, poseB);
    const ca = Math.cos(pa.angle),
      sa = Math.sin(pa.angle),
      cb = Math.cos(pb.angle),
      sb = Math.sin(pb.angle);
    const rAx = ca * this.localAx - sa * this.localAy,
      rAy = sa * this.localAx + ca * this.localAy,
      rBx = cb * this.localBx - sb * this.localBy,
      rBy = sb * this.localBx + cb * this.localBy;
    const dx = pb.x + rBx - (pa.x + rAx),
      dy = pb.y + rBy - (pa.y + rAy);
    const distance = Math.hypot(dx, dy);
    if (distance < 1e-9) return 0;
    const nx = dx / distance,
      ny = dy / distance;
    const error = distance - this.length;
    const limit = physicsDefaults.jointMaxCorrection;
    const c = Math.max(-limit, Math.min(limit, error));
    const crossA = rAx * ny - rAy * nx,
      crossB = rBx * ny - rBy * nx;
    const k =
      this.mA + this.mB + this.iA * crossA * crossA + this.iB * crossB * crossB;
    if (k <= 0) return Math.abs(error);
    const impulse = -c / k;
    move(
      this.viewA,
      -impulse * nx * this.mA,
      -impulse * ny * this.mA,
      -this.iA * impulse * crossA,
    );
    move(
      this.viewB,
      impulse * nx * this.mB,
      impulse * ny * this.mB,
      this.iB * impulse * crossB,
    );
    return Math.abs(error);
  }
}

// ---------------------------------------------------------------------------------------------

export interface RevoluteJointOptions extends JointOptions {
  /** Lower/upper relative angle in radians (angle of B minus A minus the creation angle). */
  lowerAngle?: number;
  upperAngle?: number;
  motorSpeed?: number;
  maxMotorTorque?: number;
}

/** A pin: both bodies keep the anchor point together and may rotate around it. */
export class RevoluteJoint extends Joint2D {
  lowerAngle: number;
  upperAngle: number;
  motorSpeed: number;
  /** 0 disables the motor. */
  maxMotorTorque: number;
  private angularMass = 0;
  private motorImpulse = 0;
  private lowerImpulse = 0;
  private upperImpulse = 0;
  private angle = 0;

  constructor(options: RevoluteJointOptions) {
    super(options);
    this.lowerAngle = options.lowerAngle ?? -Infinity;
    this.upperAngle = options.upperAngle ?? Infinity;
    if (!(this.lowerAngle <= this.upperAngle))
      throw new RangeError('lowerAngle must not exceed upperAngle.');
    this.motorSpeed = finite(options.motorSpeed ?? 0, 'motorSpeed');
    this.maxMotorTorque = nonnegativeFinite(
      options.maxMotorTorque ?? 0,
      'maxMotorTorque',
    );
  }
  /** Relative angle of B to A at the last prepared step, radians. */
  get jointAngle(): number {
    return this.angle;
  }
  protected prepareStep(_dt: number, a: Pose, b: Pose): void {
    const k = this.iA + this.iB;
    this.angularMass = k > 0 ? 1 / k : 0;
    this.motorImpulse = this.lowerImpulse = this.upperImpulse = 0;
    this.angle = b.angle - a.angle - this.referenceAngle;
  }
  solveVelocity(dt: number): void {
    if (this.maxMotorTorque > 0 && this.angularMass > 0) {
      const cdot = this.relativeAngularVelocity() - this.motorSpeed;
      const limit = this.maxMotorTorque * dt;
      const old = this.motorImpulse;
      this.motorImpulse = Math.max(
        -limit,
        Math.min(limit, old - this.angularMass * cdot),
      );
      this.applyAngularImpulse(this.motorImpulse - old);
    }
    if (this.angularMass > 0 && Number.isFinite(this.lowerAngle)) {
      const c = this.angle - this.lowerAngle;
      const cdot = this.relativeAngularVelocity();
      const old = this.lowerImpulse;
      this.lowerImpulse = Math.max(
        0,
        old - this.angularMass * (cdot + Math.max(c, 0) / dt),
      );
      this.applyAngularImpulse(this.lowerImpulse - old);
    }
    if (this.angularMass > 0 && Number.isFinite(this.upperAngle)) {
      const c = this.upperAngle - this.angle;
      const cdot = -this.relativeAngularVelocity();
      const old = this.upperImpulse;
      this.upperImpulse = Math.max(
        0,
        old - this.angularMass * (cdot + Math.max(c, 0) / dt),
      );
      this.applyAngularImpulse(-(this.upperImpulse - old));
    }
    this.solvePointVelocity();
  }
  solvePosition(): number {
    let error = 0;
    const k = this.iA + this.iB;
    if (
      k > 0 &&
      (Number.isFinite(this.lowerAngle) || Number.isFinite(this.upperAngle))
    ) {
      const angle = this.currentAngle();
      let correction = 0;
      if (angle < this.lowerAngle) {
        correction = Math.max(
          -physicsDefaults.jointMaxAngularCorrection,
          Math.min(
            0,
            angle - this.lowerAngle + physicsDefaults.jointAngularSlop,
          ),
        );
        error = this.lowerAngle - angle;
      } else if (angle > this.upperAngle) {
        correction = Math.min(
          physicsDefaults.jointMaxAngularCorrection,
          Math.max(
            0,
            angle - this.upperAngle - physicsDefaults.jointAngularSlop,
          ),
        );
        error = angle - this.upperAngle;
      }
      const impulse = -correction / k;
      move(this.viewA, 0, 0, -this.iA * impulse);
      move(this.viewB, 0, 0, this.iB * impulse);
    }
    return Math.max(error, this.solvePointPosition());
  }
}

// ---------------------------------------------------------------------------------------------

/** Glues two bodies together at the anchor, locking their relative angle. */
export class WeldJoint extends Joint2D {
  private angularMass = 0;

  protected prepareStep(): void {
    const k = this.iA + this.iB;
    this.angularMass = k > 0 ? 1 / k : 0;
  }
  solveVelocity(): void {
    if (this.angularMass > 0)
      this.applyAngularImpulse(
        -this.angularMass * this.relativeAngularVelocity(),
      );
    this.solvePointVelocity();
  }
  solvePosition(): number {
    const k = this.iA + this.iB;
    let error = 0;
    if (k > 0) {
      const c = this.currentAngle();
      error = Math.abs(c);
      const limit = physicsDefaults.jointMaxAngularCorrection;
      const impulse = -Math.max(-limit, Math.min(limit, c)) / k;
      move(this.viewA, 0, 0, -this.iA * impulse);
      move(this.viewB, 0, 0, this.iB * impulse);
    }
    return Math.max(error, this.solvePointPosition());
  }
}

// ---------------------------------------------------------------------------------------------

export interface PrismaticJointOptions extends JointOptions {
  /** World-space slide direction at creation. */
  axis: readonly [number, number];
  lowerTranslation?: number;
  upperTranslation?: number;
  motorSpeed?: number;
  /** 0 disables the motor. */
  maxMotorForce?: number;
}

/** Lets B slide along an axis fixed in A while their relative rotation stays locked. */
export class PrismaticJoint extends Joint2D {
  lowerTranslation: number;
  upperTranslation: number;
  motorSpeed: number;
  maxMotorForce: number;
  private readonly worldAxis: readonly [number, number];
  private localAxisX = 1;
  private localAxisY = 0;
  private axisX = 1;
  private axisY = 0;
  private axialMass = 0;
  private a1 = 0;
  private a2 = 0;
  private s1 = 0;
  private s2 = 0;
  private translation = 0;
  private motorImpulse = 0;
  private lowerImpulse = 0;
  private upperImpulse = 0;

  constructor(options: PrismaticJointOptions) {
    super(options);
    const length = Math.hypot(options.axis[0], options.axis[1]);
    if (!(length > 0) || !Number.isFinite(length))
      throw new RangeError('axis must be a finite nonzero vector.');
    this.worldAxis = [options.axis[0] / length, options.axis[1] / length];
    this.lowerTranslation = options.lowerTranslation ?? -Infinity;
    this.upperTranslation = options.upperTranslation ?? Infinity;
    if (!(this.lowerTranslation <= this.upperTranslation))
      throw new RangeError(
        'lowerTranslation must not exceed upperTranslation.',
      );
    this.motorSpeed = finite(options.motorSpeed ?? 0, 'motorSpeed');
    this.maxMotorForce = nonnegativeFinite(
      options.maxMotorForce ?? 0,
      'maxMotorForce',
    );
  }
  /** Translation of anchor B along the axis at the last prepared step. */
  get jointTranslation(): number {
    return this.translation;
  }
  protected override initialize(a: Pose): void {
    const c = Math.cos(a.angle),
      s = Math.sin(a.angle);
    this.localAxisX = c * this.worldAxis[0] + s * this.worldAxis[1];
    this.localAxisY = -s * this.worldAxis[0] + c * this.worldAxis[1];
  }
  protected prepareStep(_dt: number, a: Pose, b: Pose): void {
    const c = Math.cos(a.angle),
      s = Math.sin(a.angle);
    this.axisX = c * this.localAxisX - s * this.localAxisY;
    this.axisY = s * this.localAxisX + c * this.localAxisY;
    const dx = b.x + this.rBx - (a.x + this.rAx),
      dy = b.y + this.rBy - (a.y + this.rAy);
    this.translation = this.axisX * dx + this.axisY * dy;
    const px = -this.axisY,
      py = this.axisX;
    const ax = dx + this.rAx,
      ay = dy + this.rAy;
    this.a1 = ax * this.axisY - ay * this.axisX;
    this.a2 = this.rBx * this.axisY - this.rBy * this.axisX;
    this.s1 = ax * py - ay * px;
    this.s2 = this.rBx * py - this.rBy * px;
    const k =
      this.mA +
      this.mB +
      this.iA * this.a1 * this.a1 +
      this.iB * this.a2 * this.a2;
    this.axialMass = k > 0 ? 1 / k : 0;
    this.motorImpulse = this.lowerImpulse = this.upperImpulse = 0;
  }
  private axialVelocity(): number {
    return (
      this.axisX * (linearX(this.viewB) - linearX(this.viewA)) +
      this.axisY * (linearY(this.viewB) - linearY(this.viewA)) +
      this.a2 * angularVelocity(this.viewB) -
      this.a1 * angularVelocity(this.viewA)
    );
  }
  private applyAxial(impulse: number): void {
    const px = impulse * this.axisX,
      py = impulse * this.axisY;
    addVelocity(
      this.viewA,
      -px * this.mA,
      -py * this.mA,
      -this.iA * impulse * this.a1,
    );
    addVelocity(
      this.viewB,
      px * this.mB,
      py * this.mB,
      this.iB * impulse * this.a2,
    );
    this.reactionX += px;
    this.reactionY += py;
  }
  solveVelocity(dt: number): void {
    if (this.maxMotorForce > 0 && this.axialMass > 0) {
      const limit = this.maxMotorForce * dt;
      const old = this.motorImpulse;
      this.motorImpulse = Math.max(
        -limit,
        Math.min(
          limit,
          old + this.axialMass * (this.motorSpeed - this.axialVelocity()),
        ),
      );
      this.applyAxial(this.motorImpulse - old);
    }
    if (this.axialMass > 0 && Number.isFinite(this.lowerTranslation)) {
      const c = this.translation - this.lowerTranslation;
      const old = this.lowerImpulse;
      this.lowerImpulse = Math.max(
        0,
        old - this.axialMass * (this.axialVelocity() + Math.max(c, 0) / dt),
      );
      this.applyAxial(this.lowerImpulse - old);
    }
    if (this.axialMass > 0 && Number.isFinite(this.upperTranslation)) {
      const c = this.upperTranslation - this.translation;
      const old = this.upperImpulse;
      this.upperImpulse = Math.max(
        0,
        old - this.axialMass * (-this.axialVelocity() + Math.max(c, 0) / dt),
      );
      this.applyAxial(-(this.upperImpulse - old));
    }
    // Perpendicular and angular constraints.
    const px = -this.axisY,
      py = this.axisX;
    const cdot1 =
      px * (linearX(this.viewB) - linearX(this.viewA)) +
      py * (linearY(this.viewB) - linearY(this.viewA)) +
      this.s2 * angularVelocity(this.viewB) -
      this.s1 * angularVelocity(this.viewA);
    const cdot2 = this.relativeAngularVelocity();
    const k11 =
      this.mA +
      this.mB +
      this.iA * this.s1 * this.s1 +
      this.iB * this.s2 * this.s2;
    const k12 = this.iA * this.s1 + this.iB * this.s2;
    let k22 = this.iA + this.iB;
    if (k22 === 0) k22 = 1;
    const determinant = k11 * k22 - k12 * k12;
    if (determinant === 0) return;
    const i1 = -(k22 * cdot1 - k12 * cdot2) / determinant,
      i2 = -(k11 * cdot2 - k12 * cdot1) / determinant;
    addVelocity(
      this.viewA,
      -px * i1 * this.mA,
      -py * i1 * this.mA,
      -this.iA * (i1 * this.s1 + i2),
    );
    addVelocity(
      this.viewB,
      px * i1 * this.mB,
      py * i1 * this.mB,
      this.iB * (i1 * this.s2 + i2),
    );
    this.reactionX += px * i1;
    this.reactionY += py * i1;
  }
  solvePosition(): number {
    const pa = readPose(this.viewA.owner, poseA),
      pb = readPose(this.viewB.owner, poseB);
    const ca = Math.cos(pa.angle),
      sa = Math.sin(pa.angle),
      cb = Math.cos(pb.angle),
      sb = Math.sin(pb.angle);
    const rAx = ca * this.localAx - sa * this.localAy,
      rAy = sa * this.localAx + ca * this.localAy,
      rBx = cb * this.localBx - sb * this.localBy,
      rBy = sb * this.localBx + cb * this.localBy;
    const dx = pb.x + rBx - (pa.x + rAx),
      dy = pb.y + rBy - (pa.y + rAy);
    const axisX = ca * this.localAxisX - sa * this.localAxisY,
      axisY = sa * this.localAxisX + ca * this.localAxisY;
    const ax = dx + rAx,
      ay = dy + rAy;
    const a1 = ax * axisY - ay * axisX,
      a2 = rBx * axisY - rBy * axisX;
    let error = 0;
    // Limit first, along the axis.
    const translation = axisX * dx + axisY * dy;
    const k = this.mA + this.mB + this.iA * a1 * a1 + this.iB * a2 * a2;
    if (k > 0) {
      let c = 0;
      if (translation < this.lowerTranslation)
        c = Math.max(
          -physicsDefaults.jointMaxCorrection,
          translation - this.lowerTranslation,
        );
      else if (translation > this.upperTranslation)
        c = Math.min(
          physicsDefaults.jointMaxCorrection,
          translation - this.upperTranslation,
        );
      if (c !== 0) {
        error = Math.abs(c);
        const impulse = -c / k;
        move(
          this.viewA,
          -impulse * axisX * this.mA,
          -impulse * axisY * this.mA,
          -this.iA * impulse * a1,
        );
        move(
          this.viewB,
          impulse * axisX * this.mB,
          impulse * axisY * this.mB,
          this.iB * impulse * a2,
        );
      }
    }
    // Perpendicular offset and relative angle (recomputed after the limit move).
    const qa = readPose(this.viewA.owner, poseA),
      qb = readPose(this.viewB.owner, poseB);
    const qca = Math.cos(qa.angle),
      qsa = Math.sin(qa.angle),
      qcb = Math.cos(qb.angle),
      qsb = Math.sin(qb.angle);
    const qrAx = qca * this.localAx - qsa * this.localAy,
      qrAy = qsa * this.localAx + qca * this.localAy,
      qrBx = qcb * this.localBx - qsb * this.localBy,
      qrBy = qsb * this.localBx + qcb * this.localBy;
    const qdx = qb.x + qrBx - (qa.x + qrAx),
      qdy = qb.y + qrBy - (qa.y + qrAy);
    const qax = qca * this.localAxisX - qsa * this.localAxisY,
      qay = qsa * this.localAxisX + qca * this.localAxisY;
    const qpx = -qay,
      qpy = qax;
    const qa1x = qdx + qrAx,
      qa1y = qdy + qrAy;
    const t1 = qa1x * qpy - qa1y * qpx,
      t2 = qrBx * qpy - qrBy * qpx;
    const c1 = qpx * qdx + qpy * qdy;
    const c2 = qb.angle - qa.angle - this.referenceAngle;
    error = Math.max(error, Math.abs(c1), Math.abs(c2));
    const k11 = this.mA + this.mB + this.iA * t1 * t1 + this.iB * t2 * t2;
    const k12 = this.iA * t1 + this.iB * t2;
    let k22 = this.iA + this.iB;
    if (k22 === 0) k22 = 1;
    const determinant = k11 * k22 - k12 * k12;
    if (determinant !== 0) {
      const i1 = -(k22 * c1 - k12 * c2) / determinant,
        i2 = -(k11 * c2 - k12 * c1) / determinant;
      move(
        this.viewA,
        -qpx * i1 * this.mA,
        -qpy * i1 * this.mA,
        -this.iA * (i1 * t1 + i2),
      );
      move(
        this.viewB,
        qpx * i1 * this.mB,
        qpy * i1 * this.mB,
        this.iB * (i1 * t2 + i2),
      );
    }
    return error;
  }
}

// ---------------------------------------------------------------------------------------------

export interface MouseJointOptions {
  /** The body to drag; it must be dynamic and registered. */
  body: GameObject;
  /** World-space grab point on the body at creation; also the initial target. */
  target: readonly [number, number];
  /** Maximum pulling force. */
  maxForce: number;
  frequencyHz?: number;
  dampingRatio?: number;
}

/** Soft constraint that pulls a grab point on one body toward a movable world target. */
export class MouseJoint extends Joint2D {
  maxForce: number;
  frequencyHz: number;
  dampingRatio: number;
  private targetX: number;
  private targetY: number;
  private gamma = 0;
  private biasX = 0;
  private biasY = 0;
  private impulseX = 0;
  private impulseY = 0;
  private kXX = 0;
  private kXY = 0;
  private kYY = 0;

  constructor(options: MouseJointOptions) {
    super({
      bodyA: options.body,
      anchor: options.target,
      collideConnected: true,
    });
    this.targetX = finite(options.target[0], 'target.x');
    this.targetY = finite(options.target[1], 'target.y');
    this.maxForce = nonnegativeFinite(options.maxForce, 'maxForce');
    this.frequencyHz = nonnegativeFinite(
      options.frequencyHz ?? 5,
      'frequencyHz',
    );
    this.dampingRatio = nonnegativeFinite(
      options.dampingRatio ?? 0.7,
      'dampingRatio',
    );
    if (this.frequencyHz <= 0)
      throw new RangeError('frequencyHz must be positive.');
  }
  setTarget(x: number, y: number): void {
    this.targetX = finite(x, 'target.x');
    this.targetY = finite(y, 'target.y');
    this.viewB.body?.wake();
  }
  get target(): readonly [number, number] {
    return [this.targetX, this.targetY];
  }
  protected prepareStep(dt: number, _a: Pose, b: Pose): void {
    const mass = this.mB > 0 ? 1 / this.mB : 0;
    const omega = 2 * Math.PI * this.frequencyHz;
    const damping = 2 * mass * this.dampingRatio * omega;
    const stiffness = mass * omega * omega;
    const h = dt * (damping + dt * stiffness);
    this.gamma = h > 0 ? 1 / h : 0;
    const beta = dt * stiffness * this.gamma;
    this.biasX = (b.x + this.rBx - this.targetX) * beta;
    this.biasY = (b.y + this.rBy - this.targetY) * beta;
    this.kXX = this.mB + this.iB * this.rBy * this.rBy + this.gamma;
    this.kXY = -this.iB * this.rBx * this.rBy;
    this.kYY = this.mB + this.iB * this.rBx * this.rBx + this.gamma;
    this.impulseX = this.impulseY = 0;
  }
  solveVelocity(dt: number): void {
    const wB = angularVelocity(this.viewB);
    const cdotX = linearX(this.viewB) - wB * this.rBy,
      cdotY = linearY(this.viewB) + wB * this.rBx;
    const k11 = this.kXX,
      k12 = this.kXY,
      k22 = this.kYY;
    const determinant = k11 * k22 - k12 * k12;
    if (determinant === 0) return;
    const rx = cdotX + this.biasX + this.gamma * this.impulseX,
      ry = cdotY + this.biasY + this.gamma * this.impulseY;
    let px = -(k22 * rx - k12 * ry) / determinant,
      py = -(k11 * ry - k12 * rx) / determinant;
    const oldX = this.impulseX,
      oldY = this.impulseY;
    this.impulseX += px;
    this.impulseY += py;
    const limit = this.maxForce * dt;
    const magnitude = Math.hypot(this.impulseX, this.impulseY);
    if (magnitude > limit) {
      this.impulseX *= limit / magnitude;
      this.impulseY *= limit / magnitude;
    }
    px = this.impulseX - oldX;
    py = this.impulseY - oldY;
    addVelocity(
      this.viewB,
      px * this.mB,
      py * this.mB,
      this.iB * (this.rBx * py - this.rBy * px),
    );
    this.reactionX += px;
    this.reactionY += py;
  }
  solvePosition(): number {
    return 0;
  }
}
