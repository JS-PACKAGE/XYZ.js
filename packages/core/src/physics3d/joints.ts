import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { RigidBody3D } from './body.js';
import { finite3D, nonnegative3D, vector3D } from './collider.js';
import { physics3DDefaults } from '../../../../src/data/physics3d.js';

export interface JointOptions3D {
  bodyA: Object3D;
  /** Omit to connect bodyA to the fixed world. */
  bodyB?: Object3D;
  /** World anchors are captured as rigid local anchors when added to a world. */
  anchor: Readonly<Vector3>;
  anchorB?: Readonly<Vector3>;
  collideConnected?: boolean;
  breakForce?: number;
  breakTorque?: number;
}

class Frame3D {
  readonly position = new Vector3();
  readonly axes = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1),
  ];
  read(object: Object3D | undefined): void {
    if (!object) return;
    const e = object.updateWorldMatrix().elements;
    this.position.set(e[12], e[13], e[14]);
    for (let i = 0; i < 3; i++)
      this.axes[i].set(e[i * 4], e[i * 4 + 1], e[i * 4 + 2]).normalize();
  }
  local(world: Readonly<Vector3>, out: Vector3): void {
    out.set(
      this.axes[0].dot(world as Vector3),
      this.axes[1].dot(world as Vector3),
      this.axes[2].dot(world as Vector3),
    );
  }
  world(local: Readonly<Vector3>, out: Vector3): void {
    const a = this.axes;
    out.set(
      a[0].x * local.x + a[1].x * local.y + a[2].x * local.z,
      a[0].y * local.x + a[1].y * local.y + a[2].y * local.z,
      a[0].z * local.x + a[1].z * local.y + a[2].z * local.z,
    );
  }
}
class Row3D {
  readonly axis = new Vector3();
  readonly angularA = new Vector3();
  readonly angularB = new Vector3();
  readonly responseA = new Vector3();
  readonly responseB = new Vector3();
  angular = false;
  mass = 0;
  bias = 0;
  gamma = 0;
  impulse = 0;
  lower = -Infinity;
  upper = Infinity;
}

/** Sequential impulses with world-space inverse inertia, compliant spring rows and bounded bias. */
export abstract class Joint3D {
  abstract readonly type: 'distance' | 'ball-socket' | 'hinge';
  readonly bodyA: Object3D;
  readonly bodyB: Object3D | undefined;
  readonly collideConnected: boolean;
  breakForce: number;
  breakTorque: number;
  onBreak: ((joint: Joint3D) => void) | undefined;
  private worldOwner: object | undefined;
  private active = true;
  private readonly anchorA = new Vector3();
  private readonly anchorB = new Vector3();
  protected readonly localA = new Vector3();
  protected readonly localB = new Vector3();
  protected readonly frameA = new Frame3D();
  protected readonly frameB = new Frame3D();
  protected objectA: Object3D | undefined;
  protected objectB: Object3D | undefined;
  protected solverA: RigidBody3D | undefined;
  protected solverB: RigidBody3D | undefined;
  protected readonly rA = new Vector3();
  protected readonly rB = new Vector3();
  protected readonly pointA = new Vector3();
  protected readonly pointB = new Vector3();
  protected readonly error = new Vector3();
  protected readonly scratch = new Vector3();
  protected readonly rows = Array.from({ length: 8 }, () => new Row3D());
  protected rowCount = 0;
  private stepRate = 0;
  private readonly reaction = new Vector3();
  private readonly angularReaction = new Vector3();

  constructor(options: JointOptions3D) {
    if (options.bodyA === options.bodyB)
      throw new RangeError('A joint requires distinct bodies.');
    this.bodyA = options.bodyA;
    this.bodyB = options.bodyB;
    vector3D(options.anchor, 'anchor');
    vector3D(options.anchorB ?? options.anchor, 'anchorB');
    this.anchorA.set(options.anchor.x, options.anchor.y, options.anchor.z);
    const b = options.anchorB ?? options.anchor;
    this.anchorB.set(b.x, b.y, b.z);
    this.collideConnected = options.collideConnected ?? false;
    this.breakForce = options.breakForce ?? Infinity;
    this.breakTorque = options.breakTorque ?? Infinity;
    if (!(this.breakForce > 0) || !(this.breakTorque > 0))
      throw new RangeError('Joint break thresholds must be positive.');
  }
  get attached(): boolean {
    return this.worldOwner !== undefined;
  }
  /** @internal Ownership check used during callbacks that mutate the world's joint list. */
  belongsTo(world: object): boolean {
    return this.worldOwner === world;
  }
  get enabled(): boolean {
    return this.active;
  }
  set enabled(value: boolean) {
    this.active = value;
    this.wake();
  }
  get reactionForce(): number {
    return this.reaction.length() * this.stepRate;
  }
  get reactionTorque(): number {
    return this.angularReaction.length() * this.stepRate;
  }
  /** @internal Prepared row count for finite-work measurement. */
  get solverRowCount(): number {
    return this.rowCount;
  }
  /** @internal The world validates registrations before binding. */
  attach(world: object): void {
    if (this.attached) throw new Error('Joint3D is already attached.');
    this.objectA = this.bodyB ? this.bodyA : undefined;
    this.objectB = this.bodyB ?? this.bodyA;
    this.solverA = this.objectA?.body;
    this.solverB = this.objectB.body;
    this.frameA.read(this.objectA);
    this.frameB.read(this.objectB);
    const a = this.bodyB ? this.anchorA : this.anchorB,
      b = this.bodyB ? this.anchorB : this.anchorA;
    this.scratch.set(
      a.x - this.frameA.position.x,
      a.y - this.frameA.position.y,
      a.z - this.frameA.position.z,
    );
    this.frameA.local(this.scratch, this.localA);
    this.scratch.set(
      b.x - this.frameB.position.x,
      b.y - this.frameB.position.y,
      b.z - this.frameB.position.z,
    );
    this.frameB.local(this.scratch, this.localB);
    this.bindFrames();
    this.worldOwner = world;
    this.wake();
  }
  /** @internal Removal/replacement of either attachment invalidates the joint. */
  detach(): void {
    this.wake();
    this.worldOwner = undefined;
    this.solverA = undefined;
    this.solverB = undefined;
    this.rowCount = 0;
    this.reaction.set(0, 0, 0);
    this.angularReaction.set(0, 0, 0);
  }
  wake(): void {
    this.bodyA.body?.wake();
    this.bodyB?.body?.wake();
  }
  /** World-space anchor snapshots, allocated only on explicit caller request. */
  anchors(): readonly [Vector3, Vector3] {
    this.readAnchors();
    return [this.pointA.clone(), this.pointB.clone()];
  }
  protected bindFrames(): void {}
  protected readAnchors(): void {
    this.frameA.read(this.objectA);
    this.frameB.read(this.objectB);
    this.frameA.world(this.localA, this.rA);
    this.frameB.world(this.localB, this.rB);
    this.pointA.copy(this.frameA.position).add(this.rA);
    this.pointB.copy(this.frameB.position).add(this.rB);
    this.error.copy(this.pointB).subtract(this.pointA);
  }
  /** @internal Captures this tick's Jacobians and clears accumulated impulses. */
  prepare(dt: number): void {
    this.rowCount = 0;
    this.reaction.set(0, 0, 0);
    this.angularReaction.set(0, 0, 0);
    this.stepRate = 1 / dt;
    if (!this.enabled) return;
    if (!(this.breakForce > 0) || !(this.breakTorque > 0))
      throw new RangeError('Joint break thresholds must be positive.');
    this.readAnchors();
    this.prepareRows(dt);
    const a = this.solverA,
      b = this.solverB;
    const awakeA = !!a && a.type !== 'static' && !a.isSleeping,
      awakeB = !!b && b.type !== 'static' && !b.isSleeping;
    let driven = awakeA || awakeB;
    for (let i = 0; i < this.rowCount; i++)
      if (Math.abs(this.rows[i].bias) > physics3DDefaults.sleepVelocity)
        driven = true;
    if (driven) {
      if (a?.isSleeping) a.wake();
      if (b?.isSleeping) b.wake();
    }
  }
  protected abstract prepareRows(dt: number): void;
  protected row(
    axis: Readonly<Vector3>,
    error: number,
    dt: number,
    angular = false,
    lower = -Infinity,
    upper = Infinity,
    frequencyHz = 0,
    dampingRatio = 0,
  ): Row3D {
    const row = this.rows[this.rowCount++];
    row.axis.set(axis.x, axis.y, axis.z);
    row.angular = angular;
    row.lower = lower;
    row.upper = upper;
    row.impulse = 0;
    row.gamma = 0;
    if (angular) {
      row.angularA.copy(row.axis);
      row.angularB.copy(row.axis);
    } else {
      row.angularA.copy(this.rA).cross(row.axis);
      row.angularB.copy(this.rB).cross(row.axis);
    }
    this.solverA?.inverseInertia(row.angularA, row.responseA);
    this.solverB?.inverseInertia(row.angularB, row.responseB);
    if (!this.solverA) row.responseA.set(0, 0, 0);
    if (!this.solverB) row.responseB.set(0, 0, 0);
    const k =
      (angular
        ? 0
        : (this.solverA?.inverseMass ?? 0) + (this.solverB?.inverseMass ?? 0)) +
      row.angularA.dot(row.responseA) +
      row.angularB.dot(row.responseB);
    row.mass = k > 1e-12 ? 1 / k : 0;
    row.bias = Math.max(
      -physics3DDefaults.jointMaxBias,
      Math.min(
        physics3DDefaults.jointMaxBias,
        (physics3DDefaults.jointBias * error) / dt,
      ),
    );
    if (frequencyHz > 0 && row.mass > 0) {
      const omega = 2 * Math.PI * frequencyHz,
        damping = 2 * row.mass * dampingRatio * omega,
        stiffness = row.mass * omega * omega;
      row.gamma = 1 / (dt * (damping + dt * stiffness));
      row.bias = error * dt * stiffness * row.gamma;
      row.mass = 1 / (k + row.gamma);
    }
    return row;
  }
  protected pointRows(dt: number): void {
    this.scratch.set(1, 0, 0);
    this.row(this.scratch, this.error.x, dt);
    this.scratch.set(0, 1, 0);
    this.row(this.scratch, this.error.y, dt);
    this.scratch.set(0, 0, 1);
    this.row(this.scratch, this.error.z, dt);
  }
  protected axialSpeed(axis: Readonly<Vector3>): number {
    const a = this.solverA?.angularVelocity,
      b = this.solverB?.angularVelocity;
    return (
      ((b?.x ?? 0) - (a?.x ?? 0)) * axis.x +
      ((b?.y ?? 0) - (a?.y ?? 0)) * axis.y +
      ((b?.z ?? 0) - (a?.z ?? 0)) * axis.z
    );
  }
  protected angularLimit(
    axis: Readonly<Vector3>,
    angle: number,
    lower: number,
    upper: number,
    dt: number,
    anticipatedSpeed = this.axialSpeed(axis),
  ): void {
    const predicted = angle + anticipatedSpeed * dt;
    if (angle < lower || predicted < lower) {
      const r = this.row(
        axis,
        Math.min(0, angle - lower),
        dt,
        true,
        0,
        Infinity,
      );
      if (angle >= lower) r.bias = (angle - lower) / dt;
    } else if (angle > upper || predicted > upper) {
      const r = this.row(
        axis,
        Math.max(0, angle - upper),
        dt,
        true,
        -Infinity,
        0,
      );
      if (angle <= upper) r.bias = (angle - upper) / dt;
    }
  }
  /** @internal One deterministic sequential-impulse pass; no pose-only constraint substitute. */
  solveVelocity(): void {
    if (!this.enabled || !this.attached) return;
    const a = this.solverA,
      b = this.solverB;
    if (
      (!a || a.type !== 'dynamic' || a.isSleeping) &&
      (!b || b.type !== 'dynamic' || b.isSleeping)
    )
      return;
    for (let i = 0; i < this.rowCount; i++) {
      const row = this.rows[i],
        n = row.axis;
      let speed = this.axialSpeed(row.angularB);
      // Point rows have different angular Jacobians on the two anchors.
      if (!row.angular) {
        const va = a?.velocity,
          vb = b?.velocity,
          wa = a?.angularVelocity,
          wb = b?.angularVelocity;
        speed =
          ((vb?.x ?? 0) - (va?.x ?? 0)) * n.x +
          ((vb?.y ?? 0) - (va?.y ?? 0)) * n.y +
          ((vb?.z ?? 0) - (va?.z ?? 0)) * n.z +
          (wb ? wb.dot(row.angularB) : 0) -
          (wa ? wa.dot(row.angularA) : 0);
      }
      const previous = row.impulse;
      row.impulse = Math.max(
        row.lower,
        Math.min(
          row.upper,
          previous - row.mass * (speed + row.bias + row.gamma * previous),
        ),
      );
      const impulse = row.impulse - previous;
      if (a?.type === 'dynamic') {
        if (!row.angular) {
          a.velocity.x -= n.x * impulse * a.inverseMass;
          a.velocity.y -= n.y * impulse * a.inverseMass;
          a.velocity.z -= n.z * impulse * a.inverseMass;
        }
        a.angularVelocity.x -= row.responseA.x * impulse;
        a.angularVelocity.y -= row.responseA.y * impulse;
        a.angularVelocity.z -= row.responseA.z * impulse;
      }
      if (b?.type === 'dynamic') {
        if (!row.angular) {
          b.velocity.x += n.x * impulse * b.inverseMass;
          b.velocity.y += n.y * impulse * b.inverseMass;
          b.velocity.z += n.z * impulse * b.inverseMass;
        }
        b.angularVelocity.x += row.responseB.x * impulse;
        b.angularVelocity.y += row.responseB.y * impulse;
        b.angularVelocity.z += row.responseB.z * impulse;
      }
      const reaction = row.angular ? this.angularReaction : this.reaction;
      reaction.x += n.x * impulse;
      reaction.y += n.y * impulse;
      reaction.z += n.z * impulse;
    }
  }
}

export interface DistanceJointOptions3D extends JointOptions3D {
  length?: number;
  /** Zero makes the distance rigid; positive values produce a compliant suspension spring. */
  frequencyHz?: number;
  dampingRatio?: number;
}
export class DistanceJoint3D extends Joint3D {
  readonly type = 'distance';
  length: number;
  frequencyHz: number;
  dampingRatio: number;
  constructor(options: DistanceJointOptions3D) {
    super(options);
    const b = options.anchorB ?? options.anchor;
    this.length = nonnegative3D(
      options.length ??
        Math.hypot(
          b.x - options.anchor.x,
          b.y - options.anchor.y,
          b.z - options.anchor.z,
        ),
      'length',
    );
    this.frequencyHz = nonnegative3D(options.frequencyHz ?? 0, 'frequencyHz');
    this.dampingRatio = nonnegative3D(
      options.dampingRatio ?? 0,
      'dampingRatio',
    );
  }
  protected prepareRows(dt: number): void {
    nonnegative3D(this.length, 'length');
    nonnegative3D(this.frequencyHz, 'frequencyHz');
    nonnegative3D(this.dampingRatio, 'dampingRatio');
    const distance = this.error.length();
    this.scratch.copy(this.error);
    if (distance > 1e-10) this.scratch.scale(1 / distance);
    else this.scratch.set(0, 1, 0);
    this.row(
      this.scratch,
      distance - this.length,
      dt,
      false,
      -Infinity,
      Infinity,
      this.frequencyHz,
      this.dampingRatio,
    );
  }
}

interface AxisJointOptions3D extends JointOptions3D {
  /** World axis at attachment. Defaults to +Y. */
  axis?: Readonly<Vector3>;
}
abstract class AxisJoint3D extends Joint3D {
  private readonly bindAxis = new Vector3();
  private readonly bindTangent = new Vector3();
  private readonly localAxisA = new Vector3();
  private readonly localAxisB = new Vector3();
  private readonly localTangentA = new Vector3();
  private readonly localTangentB = new Vector3();
  protected readonly axisA = new Vector3();
  protected readonly axisB = new Vector3();
  protected readonly tangentA = new Vector3();
  protected readonly tangentB = new Vector3();
  protected readonly bitangentA = new Vector3();
  protected readonly bitangentB = new Vector3();
  protected readonly swingAxis = new Vector3();
  protected readonly twistJacobian = new Vector3();
  protected swing = 0;
  protected twist = 0;
  constructor(options: AxisJointOptions3D) {
    super(options);
    const axis = options.axis ?? new Vector3(0, 1, 0);
    vector3D(axis, 'axis');
    if (!(axis.length() > 0))
      throw new RangeError('Joint axis must be nonzero.');
    this.bindAxis.set(axis.x, axis.y, axis.z).normalize();
    this.bindTangent
      .set(
        Math.abs(this.bindAxis.x) < 0.8 ? 1 : 0,
        Math.abs(this.bindAxis.x) < 0.8 ? 0 : 1,
        0,
      )
      .cross(this.bindAxis)
      .normalize();
  }
  protected override bindFrames(): void {
    this.frameA.local(this.bindAxis, this.localAxisA);
    this.frameB.local(this.bindAxis, this.localAxisB);
    this.frameA.local(this.bindTangent, this.localTangentA);
    this.frameB.local(this.bindTangent, this.localTangentB);
  }
  protected readAxes(): void {
    this.frameA.world(this.localAxisA, this.axisA);
    this.frameB.world(this.localAxisB, this.axisB);
    this.frameA.world(this.localTangentA, this.tangentA);
    this.frameB.world(this.localTangentB, this.tangentB);
    this.bitangentA.copy(this.axisA).cross(this.tangentA);
    this.bitangentB.copy(this.axisB).cross(this.tangentB);
    this.swingAxis.copy(this.axisA).cross(this.axisB);
    const sine = this.swingAxis.length(),
      cosine = Math.max(-1, Math.min(1, this.axisA.dot(this.axisB)));
    // Twist differentiation uses the bisector, not axisA when the limb is also swung.
    this.twistJacobian.copy(this.axisA).add(this.axisB);
    if (1 + cosine > 1e-6) this.twistJacobian.scale(1 / (1 + cosine));
    else this.twistJacobian.copy(this.axisA);
    this.swing = Math.atan2(sine, cosine);
    if (sine > 1e-10) this.swingAxis.scale(1 / sine);
    else this.swingAxis.copy(this.tangentA);
    // Relative frame quaternion; its Z component yields the swing/twist decomposition about axisA.
    const m00 = this.tangentA.dot(this.tangentB),
      m11 = this.bitangentA.dot(this.bitangentB),
      m22 = this.axisA.dot(this.axisB),
      m01 = this.tangentA.dot(this.bitangentB),
      m10 = this.bitangentA.dot(this.tangentB),
      m02 = this.tangentA.dot(this.axisB),
      m20 = this.axisA.dot(this.tangentB),
      m12 = this.bitangentA.dot(this.axisB),
      m21 = this.axisA.dot(this.bitangentB);
    let z: number, w: number;
    const trace = m00 + m11 + m22;
    if (trace > 0) {
      const s = 2 * Math.sqrt(trace + 1);
      w = s / 4;
      z = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
      const s = 2 * Math.sqrt(Math.max(0, 1 + m00 - m11 - m22));
      w = (m21 - m12) / s;
      z = (m02 + m20) / s;
    } else if (m11 > m22) {
      const s = 2 * Math.sqrt(Math.max(0, 1 + m11 - m00 - m22));
      w = (m02 - m20) / s;
      z = (m12 + m21) / s;
    } else {
      const s = 2 * Math.sqrt(Math.max(0, 1 + m22 - m00 - m11));
      w = (m10 - m01) / s;
      z = s / 4;
    }
    let twist = Math.hypot(z, w) > 1e-10 ? 2 * Math.atan2(z, w) : 0;
    if (twist > Math.PI) twist -= 2 * Math.PI;
    if (twist < -Math.PI) twist += 2 * Math.PI;
    this.twist = twist;
  }
}
export interface BallSocketJointOptions3D extends AxisJointOptions3D {
  swingLimit?: number;
  lowerTwist?: number;
  upperTwist?: number;
}
/** Three anchor rows plus an optional cone and twist interval for articulated limbs. Angles are radians. */
export class BallSocketJoint3D extends AxisJoint3D {
  readonly type = 'ball-socket';
  swingLimit: number;
  lowerTwist: number;
  upperTwist: number;
  constructor(options: BallSocketJointOptions3D) {
    super(options);
    this.swingLimit = options.swingLimit ?? Math.PI;
    this.lowerTwist = options.lowerTwist ?? -Infinity;
    this.upperTwist = options.upperTwist ?? Infinity;
    this.validateLimits();
  }
  private validateLimits(): void {
    nonnegative3D(this.swingLimit, 'swingLimit');
    if (this.lowerTwist !== -Infinity) finite3D(this.lowerTwist, 'lowerTwist');
    if (this.upperTwist !== Infinity) finite3D(this.upperTwist, 'upperTwist');
    if (
      this.swingLimit > Math.PI ||
      (this.lowerTwist !== -Infinity && this.lowerTwist < -Math.PI) ||
      (this.upperTwist !== Infinity && this.upperTwist > Math.PI) ||
      this.lowerTwist > this.upperTwist
    )
      throw new RangeError('Invalid ball/socket angular limits.');
  }
  get swingAngle(): number {
    this.readAnchors();
    this.readAxes();
    return this.swing;
  }
  get twistAngle(): number {
    this.readAnchors();
    this.readAxes();
    return this.twist;
  }
  protected prepareRows(dt: number): void {
    this.validateLimits();
    this.readAxes();
    this.pointRows(dt);
    const predicted = this.swing + this.axialSpeed(this.swingAxis) * dt;
    if (
      this.swingLimit < Math.PI &&
      (this.swing > this.swingLimit || predicted > this.swingLimit)
    ) {
      const r = this.row(
        this.swingAxis,
        Math.max(0, this.swing - this.swingLimit),
        dt,
        true,
        -Infinity,
        0,
      );
      if (this.swing <= this.swingLimit)
        r.bias = (this.swing - this.swingLimit) / dt;
    }
    this.angularLimit(
      this.twistJacobian,
      this.twist,
      this.lowerTwist,
      this.upperTwist,
      dt,
    );
  }
}
export interface HingeJointOptions3D extends AxisJointOptions3D {
  lowerAngle?: number;
  upperAngle?: number;
  enableMotor?: boolean;
  motorSpeed?: number;
  maxMotorTorque?: number;
}
/** Pivot and axis alignment constraints, a torque-limited motor and an angular stop interval. */
export class HingeJoint3D extends AxisJoint3D {
  readonly type = 'hinge';
  lowerAngle: number;
  upperAngle: number;
  enableMotor: boolean;
  motorSpeed: number;
  maxMotorTorque: number;
  constructor(options: HingeJointOptions3D) {
    super(options);
    this.lowerAngle = options.lowerAngle ?? -Infinity;
    this.upperAngle = options.upperAngle ?? Infinity;
    this.enableMotor = options.enableMotor ?? false;
    this.motorSpeed = options.motorSpeed ?? 0;
    this.maxMotorTorque = options.maxMotorTorque ?? 0;
    this.validateMotor();
  }
  private validateMotor(): void {
    if (this.lowerAngle !== -Infinity) finite3D(this.lowerAngle, 'lowerAngle');
    if (this.upperAngle !== Infinity) finite3D(this.upperAngle, 'upperAngle');
    finite3D(this.motorSpeed, 'motorSpeed');
    nonnegative3D(this.maxMotorTorque, 'maxMotorTorque');
    if (
      (this.lowerAngle !== -Infinity && this.lowerAngle < -Math.PI) ||
      (this.upperAngle !== Infinity && this.upperAngle > Math.PI) ||
      this.lowerAngle > this.upperAngle
    )
      throw new RangeError('Invalid hinge angular limits.');
  }
  get angle(): number {
    this.readAnchors();
    this.readAxes();
    return this.twist;
  }
  protected prepareRows(dt: number): void {
    this.validateMotor();
    this.readAxes();
    this.pointRows(dt);
    this.row(
      this.tangentA,
      this.swing * this.swingAxis.dot(this.tangentA),
      dt,
      true,
    );
    this.row(
      this.bitangentA,
      this.swing * this.swingAxis.dot(this.bitangentA),
      dt,
      true,
    );
    if (this.enableMotor && this.maxMotorTorque > 0) {
      if (this.motorSpeed !== 0) this.wake();
      const limit = this.maxMotorTorque * dt,
        row = this.row(this.axisA, 0, dt, true, -limit, limit);
      row.bias = -this.motorSpeed;
    }
    const speed = this.axialSpeed(this.axisA),
      anticipated =
        this.enableMotor && this.maxMotorTorque > 0
          ? this.motorSpeed > 0
            ? Math.max(speed, this.motorSpeed)
            : Math.min(speed, this.motorSpeed)
          : speed;
    this.angularLimit(
      this.axisA,
      this.twist,
      this.lowerAngle,
      this.upperAngle,
      dt,
      anticipated,
    );
  }
}
