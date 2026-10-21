import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import {
  BoxCollider3D,
  CapsuleCollider3D,
  CompoundCollider3D,
  Shape3D,
  SphereCollider3D,
  finite3D,
  nonnegative3D,
  positive3D,
  vector3D,
} from './collider.js';
import { physics3DDefaults } from '../../../../src/data/physics3d.js';
import { hypot3 } from '../../../math/src/hypot.js';
export interface RigidBodyOptions3D {
  type?: 'static' | 'dynamic' | 'kinematic';
  mass?: number;
  restitution?: number;
  friction?: number;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
  lockRotation?: boolean;
  allowSleep?: boolean;
  /** Opt-in conservative rigid-motion CCD, including rotation and moving-body pairs. */
  continuous?: boolean;
}
/** Root dynamic/kinematic body with analytic primitive or uniform-density compound inertia. */
export class RigidBody3D {
  readonly type: 'static' | 'dynamic' | 'kinematic';
  readonly velocity = new Vector3();
  readonly angularVelocity = new Vector3();
  readonly force = new Vector3();
  readonly torque = new Vector3();
  /** @internal Invalidates queued frame impulses when the caller clears forces. */
  forceEpoch = 0;
  readonly lockRotation: boolean;
  readonly allowSleep: boolean;
  readonly continuous: boolean;
  private owningObject: Object3D | undefined;
  private shape: Shape3D | undefined;
  private bodyMass = 1;
  private bounce = 0;
  private surfaceFriction = 0.5;
  private linearDrag = 0;
  private angularDrag = 0;
  private gravityMultiplier = 1;
  private sleeping = false;
  private idleTime = 0;
  private readonly sleepPose = new Float64Array(10);
  private readonly inverseDiagonal = new Vector3();
  private readonly inverseTensor = new Float64Array(6);
  /** Flat copy of what `inverseInertiaInto` reads; see `addInverseInertia`. */
  private readonly inertiaInputs = new Float64Array(12);
  private inertiaPhase = -1;
  /** 0: no rotation response, 1: compound tensor, 2: primitive axes and diagonal. */
  private inertiaMode = 0;
  private readonly transformed = new Vector3();
  private inertiaRevision = -1;
  private inertiaMass = NaN;
  private readonly inertiaScale = new Vector3(NaN, NaN, NaN);
  private inertiaShape: Shape3D | undefined;
  constructor(options: RigidBodyOptions3D = {}) {
    this.type = options.type ?? 'dynamic';
    if (
      this.type !== 'static' &&
      this.type !== 'dynamic' &&
      this.type !== 'kinematic'
    )
      throw new RangeError('Invalid 3D body type.');
    this.mass = options.mass ?? 1;
    this.restitution = options.restitution ?? 0;
    this.friction = options.friction ?? 0.5;
    this.linearDamping = options.linearDamping ?? 0;
    this.angularDamping = options.angularDamping ?? 0;
    this.gravityScale = options.gravityScale ?? 1;
    this.lockRotation = options.lockRotation ?? false;
    this.allowSleep = options.allowSleep ?? true;
    this.continuous = options.continuous ?? false;
  }
  get owner(): Object3D | undefined {
    return this.owningObject;
  }
  get mass(): number {
    return this.bodyMass;
  }
  set mass(value: number) {
    this.bodyMass = positive3D(value, 'mass');
    this.wake();
  }
  get restitution(): number {
    return this.bounce;
  }
  set restitution(value: number) {
    nonnegative3D(value, 'restitution');
    if (value > 1) throw new RangeError('Restitution must be <= 1.');
    this.bounce = value;
  }
  get friction(): number {
    return this.surfaceFriction;
  }
  set friction(value: number) {
    this.surfaceFriction = nonnegative3D(value, 'friction');
  }
  get linearDamping(): number {
    return this.linearDrag;
  }
  set linearDamping(value: number) {
    this.linearDrag = nonnegative3D(value, 'linearDamping');
  }
  get angularDamping(): number {
    return this.angularDrag;
  }
  set angularDamping(value: number) {
    this.angularDrag = nonnegative3D(value, 'angularDamping');
  }
  get gravityScale(): number {
    return this.gravityMultiplier;
  }
  set gravityScale(value: number) {
    this.gravityMultiplier = finite3D(value, 'gravityScale');
  }
  get inverseMass(): number {
    return this.type === 'dynamic' ? 1 / this.mass : 0;
  }
  get isSleeping(): boolean {
    const o = this.owner,
      s = this.sleepPose,
      v = this.velocity,
      w = this.angularVelocity;
    // A component test is exactly `length() !== 0` (hypot is zero only for all-zero input,
    // and NaN/Infinity compare unequal to zero) without the per-call hypot.
    if (
      this.sleeping &&
      o &&
      (v.x !== 0 ||
        v.y !== 0 ||
        v.z !== 0 ||
        w.x !== 0 ||
        w.y !== 0 ||
        w.z !== 0 ||
        o.position.x !== s[0] ||
        o.position.y !== s[1] ||
        o.position.z !== s[2] ||
        o.rotation.x !== s[3] ||
        o.rotation.y !== s[4] ||
        o.rotation.z !== s[5] ||
        o.rotation.w !== s[6] ||
        o.scale.x !== s[7] ||
        o.scale.y !== s[8] ||
        o.scale.z !== s[9])
    )
      this.wake();
    return this.sleeping;
  }
  wake(): void {
    this.sleeping = false;
    this.idleTime = 0;
  }
  /** @internal */
  updateSleep(dt: number): void {
    if (this.type !== 'dynamic' || !this.allowSleep || this.sleeping) return;
    if (
      this.velocity.length() > physics3DDefaults.sleepVelocity ||
      this.angularVelocity.length() > physics3DDefaults.sleepAngularVelocity
    ) {
      this.idleTime = 0;
      return;
    }
    this.idleTime += dt;
    if (this.idleTime < physics3DDefaults.sleepTime) return;
    this.sleep();
  }
  /** Explicitly sleep a dynamic body, recording its pose for external-mutation wake detection. */
  sleep(): void {
    if (this.type !== 'dynamic' || !this.allowSleep) return;
    this.clearForces();
    this.sleeping = true;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    const o = this.owner;
    if (!o) return;
    const s = this.sleepPose;
    s[0] = o.position.x;
    s[1] = o.position.y;
    s[2] = o.position.z;
    s[3] = o.rotation.x;
    s[4] = o.rotation.y;
    s[5] = o.rotation.z;
    s[6] = o.rotation.w;
    s[7] = o.scale.x;
    s[8] = o.scale.y;
    s[9] = o.scale.z;
  }
  /** @internal Attachment ownership survives Scene removal. */
  attach(owner: Object3D): void {
    if (this.owner && this.owner !== owner)
      throw new Error('RigidBody3D already has an owner.');
    if (owner.destroyed) throw new Error('Cannot bind a destroyed Object3D.');
    if (this.type !== 'static' && owner.parent)
      throw new Error('Dynamic/kinematic bodies require root Object3D.');
    this.owningObject = owner;
  }
  /** @internal */
  detach(owner: Object3D): void {
    if (this.owner === owner) {
      this.owningObject = undefined;
      this.shape = undefined;
      this.inertiaRevision = -1;
      this.inertiaShape = undefined;
    }
  }
  /** @internal Recompute analytic primitive inertia after mutable pose/scale changes. */
  refreshInertia(shape: Shape3D): void {
    const previous = this.inertiaShape;
    this.shape = shape;
    if (this.type !== 'dynamic' || this.lockRotation) return;
    const s = shape.worldScale;
    if (
      previous === shape &&
      this.inertiaMass === this.mass &&
      (shape.collider.kind === 'compound'
        ? this.inertiaRevision === shape.inertiaRevision
        : this.inertiaScale.x === s.x &&
          this.inertiaScale.y === s.y &&
          this.inertiaScale.z === s.z)
    )
      return;
    if (shape.collider instanceof CompoundCollider3D) {
      let xx = 0,
        yy = 0,
        zz = 0,
        xy = 0,
        xz = 0,
        yz = 0;
      for (const child of shape.children) {
        const mass = (this.mass * child.volume) / shape.volume;
        this.primitiveInertia(child, mass);
        const d = this.inverseDiagonal;
        for (let i = 0; i < 3; i++) {
          const axis = child.axes[i],
            inertia = 1 / (i === 0 ? d.x : i === 1 ? d.y : d.z);
          xx += inertia * axis.x * axis.x;
          yy += inertia * axis.y * axis.y;
          zz += inertia * axis.z * axis.z;
          xy += inertia * axis.x * axis.y;
          xz += inertia * axis.x * axis.z;
          yz += inertia * axis.y * axis.z;
        }
        const x = child.center.x - shape.center.x,
          y = child.center.y - shape.center.y,
          z = child.center.z - shape.center.z;
        xx += mass * (y * y + z * z);
        yy += mass * (x * x + z * z);
        zz += mass * (x * x + y * y);
        xy -= mass * x * y;
        xz -= mass * x * z;
        yz -= mass * y * z;
      }
      const determinant =
        xx * (yy * zz - yz * yz) -
        xy * (xy * zz - xz * yz) +
        xz * (xy * yz - xz * yy);
      if (!(determinant > 0) || !Number.isFinite(determinant))
        throw new RangeError('Invalid compound inertia.');
      const d = this.inverseTensor;
      d[0] = (yy * zz - yz * yz) / determinant;
      d[1] = (xx * zz - xz * xz) / determinant;
      d[2] = (xx * yy - xy * xy) / determinant;
      d[3] = (xz * yz - xy * zz) / determinant;
      d[4] = (xy * yz - xz * yy) / determinant;
      d[5] = (xy * xz - xx * yz) / determinant;
    } else this.primitiveInertia(shape, this.mass);
    this.inertiaRevision = shape.inertiaRevision;
    this.inertiaMass = this.mass;
    this.inertiaScale.copy(s);
    this.inertiaShape = shape;
  }
  private primitiveInertia(shape: Shape3D, m: number): void {
    const c = shape.collider;
    if (c instanceof SphereCollider3D) {
      const i = 0.4 * m * shape.radius * shape.radius;
      this.inverseDiagonal.set(1 / i, 1 / i, 1 / i);
    } else if (c instanceof BoxCollider3D) {
      const h = shape.half;
      this.inverseDiagonal.set(
        3 / (m * (h.y * h.y + h.z * h.z)),
        3 / (m * (h.x * h.x + h.z * h.z)),
        3 / (m * (h.x * h.x + h.y * h.y)),
      );
    } else if (c instanceof CapsuleCollider3D) {
      const r = shape.radius,
        h = hypot3(
          shape.end.x - shape.start.x,
          shape.end.y - shape.start.y,
          shape.end.z - shape.start.z,
        );
      const cylinderMass = (m * h) / (h + (4 * r) / 3),
        sphereMass = m - cylinderMass;
      // Uniform-density cylinder plus two hemispheres; hemisphere centroid = 3r/8.
      const axial = (cylinderMass * r * r) / 2 + (sphereMass * 2 * r * r) / 5;
      const transverse =
        (cylinderMass * (3 * r * r + h * h)) / 12 +
        sphereMass * ((2 * r * r) / 5 + (h * h) / 4 + (3 * h * r) / 8);
      this.inverseDiagonal.set(1 / transverse, 1 / axial, 1 / transverse);
    } else this.inverseDiagonal.set(0, 0, 0);
  }
  /** @internal World-space inverse inertia tensor product. */
  inverseInertia(vector: Readonly<Vector3>, out: Vector3): Vector3 {
    this.inverseInertiaInto(vector, out, false);
    return out;
  }
  /**
   * @internal Solver form of `angularVelocity.add(inverseInertia(torque))` without a temporary.
   * Contact iterations pass their solve `phase`, within which pose, mass and shape are
   * fixed, so the inputs are copied once per phase instead of read on every impulse.
   */
  addInverseInertia(torque: Readonly<Vector3>, phase = -1): void {
    this.inverseInertiaInto(torque, this.angularVelocity, true, phase);
  }
  // Vectors, not scalar arguments: a double passed to a call V8 does not inline is boxed,
  // and the solver makes this call for every impulse.
  private inverseInertiaInto(
    vector: Readonly<Vector3>,
    out: Vector3,
    accumulate: boolean,
    phase = -1,
  ): void {
    const x = vector.x,
      y = vector.y,
      z = vector.z;
    const k = this.inertiaInputs;
    if (phase < 0 || this.inertiaPhase !== phase) {
      this.inertiaPhase = phase;
      if (this.type !== 'dynamic' || this.lockRotation || !this.shape)
        this.inertiaMode = 0;
      else if (this.shape.collider.kind === 'compound') {
        this.inertiaMode = 1;
        k.set(this.inverseTensor);
      } else {
        this.inertiaMode = 2;
        const axes = this.shape.axes,
          d = this.inverseDiagonal;
        for (let i = 0; i < 3; i++) {
          k[i * 3] = axes[i].x;
          k[i * 3 + 1] = axes[i].y;
          k[i * 3 + 2] = axes[i].z;
        }
        k[9] = d.x;
        k[10] = d.y;
        k[11] = d.z;
      }
    }
    let rx = 0,
      ry = 0,
      rz = 0;
    if (this.inertiaMode === 1) {
      rx = k[0] * x + k[3] * y + k[4] * z;
      ry = k[3] * x + k[1] * y + k[5] * z;
      rz = k[4] * x + k[5] * y + k[2] * z;
    } else if (this.inertiaMode === 2) {
      // Rows 0-2 are the shape axes, 9-11 the inverse principal diagonal.
      const px = (k[0] * x + k[1] * y + k[2] * z) * k[9],
        py = (k[3] * x + k[4] * y + k[5] * z) * k[10],
        pz = (k[6] * x + k[7] * y + k[8] * z) * k[11];
      rx = k[0] * px + k[3] * py + k[6] * pz;
      ry = k[1] * px + k[4] * py + k[7] * pz;
      rz = k[2] * px + k[5] * py + k[8] * pz;
    }
    if (accumulate) {
      out.x += rx;
      out.y += ry;
      out.z += rz;
    } else {
      out.x = rx;
      out.y = ry;
      out.z = rz;
    }
  }
  applyForce(force: Readonly<Vector3>, worldPoint?: Readonly<Vector3>): void {
    vector3D(force, 'force');
    if (worldPoint) vector3D(worldPoint, 'worldPoint');
    if (this.type !== 'dynamic') return;
    if (worldPoint && !this.owner)
      throw new Error('World-point force requires an attached body.');
    this.wake();
    this.force.x += force.x;
    this.force.y += force.y;
    this.force.z += force.z;
    if (worldPoint && this.owner) {
      const p = this.owner.position,
        x = worldPoint.x - p.x,
        y = worldPoint.y - p.y,
        z = worldPoint.z - p.z;
      this.torque.x += y * force.z - z * force.y;
      this.torque.y += z * force.x - x * force.z;
      this.torque.z += x * force.y - y * force.x;
    }
  }
  applyImpulse(
    impulse: Readonly<Vector3>,
    worldPoint?: Readonly<Vector3>,
  ): void {
    vector3D(impulse, 'impulse');
    if (worldPoint) vector3D(worldPoint, 'worldPoint');
    if (this.type !== 'dynamic') return;
    if (worldPoint && !this.owner)
      throw new Error('World-point impulse requires an attached body.');
    this.wake();
    if (this.owner?.collider) {
      if (this.shape?.collider !== this.owner.collider)
        this.shape = new Shape3D(this.owner.collider);
      this.shape.refresh(this.owner);
      this.refreshInertia(this.shape);
    }
    this.velocity.x += impulse.x * this.inverseMass;
    this.velocity.y += impulse.y * this.inverseMass;
    this.velocity.z += impulse.z * this.inverseMass;
    if (worldPoint && this.owner) {
      const p = this.owner.position,
        x = worldPoint.x - p.x,
        y = worldPoint.y - p.y,
        z = worldPoint.z - p.z;
      this.transformed.set(
        y * impulse.z - z * impulse.y,
        z * impulse.x - x * impulse.z,
        x * impulse.y - y * impulse.x,
      );
      this.inverseInertia(this.transformed, this.transformed);
      this.angularVelocity.add(this.transformed);
    }
  }
  clearForces(): void {
    ++this.forceEpoch;
    this.force.set(0, 0, 0);
    this.torque.set(0, 0, 0);
  }
}
