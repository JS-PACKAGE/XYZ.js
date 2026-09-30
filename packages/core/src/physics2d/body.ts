import { Vector2 } from '../../../math/src/index.js';
import type { GameObject } from '../game-object.js';
import { finite, positive, ShapeGeometry } from './collider.js';

export interface RigidBodyOptions {
  type?: 'static' | 'dynamic';
  mass?: number;
  restitution?: number;
  friction?: number;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
  lockRotation?: boolean;
}
function nonnegative(value: number, name: string): number {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} must be nonnegative.`);
  return value;
}

/** Independent state bound by GameObject.body; simulation starts only when its owner has a collider. */
export class RigidBody2D {
  readonly velocity = new Vector2();
  private readonly accumulatedForce = new Vector2();
  private accumulatedTorque = 0;
  private owningObject: GameObject | undefined;
  private geometry: ShapeGeometry | undefined;
  private bodyMass = 1;
  private bounce = 0;
  private surfaceFriction = 0.5;
  private linearDrag = 0;
  private angularDrag = 0;
  private gravityMultiplier = 1;
  private spin = 0;
  readonly type: 'static' | 'dynamic';
  lockRotation: boolean;

  constructor(options: RigidBodyOptions = {}) {
    this.type = options.type ?? 'dynamic';
    if (this.type !== 'static' && this.type !== 'dynamic')
      throw new RangeError('Invalid body type.');
    this.mass = options.mass ?? 1;
    this.restitution = options.restitution ?? 0;
    this.friction = options.friction ?? 0.5;
    this.linearDamping = options.linearDamping ?? 0;
    this.angularDamping = options.angularDamping ?? 0;
    this.gravityScale = options.gravityScale ?? 1;
    this.lockRotation = options.lockRotation ?? false;
  }
  get owner(): GameObject | undefined {
    return this.owningObject;
  }
  get mass(): number {
    return this.bodyMass;
  }
  set mass(value: number) {
    this.bodyMass = positive(value, 'mass');
  }
  get restitution(): number {
    return this.bounce;
  }
  set restitution(value: number) {
    finite(value, 'restitution');
    if (value < 0 || value > 1)
      throw new RangeError('restitution must be in [0, 1].');
    this.bounce = value;
  }
  get friction(): number {
    return this.surfaceFriction;
  }
  set friction(value: number) {
    this.surfaceFriction = nonnegative(value, 'friction');
  }
  get linearDamping(): number {
    return this.linearDrag;
  }
  set linearDamping(value: number) {
    this.linearDrag = nonnegative(value, 'linearDamping');
  }
  get angularDamping(): number {
    return this.angularDrag;
  }
  set angularDamping(value: number) {
    this.angularDrag = nonnegative(value, 'angularDamping');
  }
  get gravityScale(): number {
    return this.gravityMultiplier;
  }
  set gravityScale(value: number) {
    this.gravityMultiplier = finite(value, 'gravityScale');
  }
  get angularVelocity(): number {
    return this.spin;
  }
  set angularVelocity(value: number) {
    this.spin = finite(value, 'angularVelocity');
  }
  get force(): Readonly<Vector2> {
    return this.accumulatedForce;
  }
  get torque(): number {
    return this.accumulatedTorque;
  }
  get inverseMass(): number {
    return this.type === 'dynamic' ? 1 / this.mass : 0;
  }
  get inverseInertia(): number {
    if (this.type !== 'dynamic' || this.lockRotation) return 0;
    const owner = this.owner;
    if (!owner?.collider) return 0;
    if (this.geometry?.collider !== owner.collider)
      this.geometry = new ShapeGeometry(owner.collider);
    this.geometry.refresh(owner);
    return 1 / (this.mass * this.geometry.inertiaPerMass);
  }
  /** @internal The facade binds even detached objects, retaining ownership across scene removal. */
  attach(owner: GameObject): void {
    if (this.owner && this.owner !== owner)
      throw new Error('RigidBody2D already belongs to another GameObject.');
    if (owner.destroyed)
      throw new Error('Cannot attach a body to a destroyed GameObject.');
    if (
      this.type === 'dynamic' &&
      (owner.parent || owner.worldSpace !== 'world')
    )
      throw new Error('Dynamic bodies require root world-space GameObjects.');
    if (owner.worldSpace !== 'world')
      throw new Error('Screen-space physics is unsupported.');
    this.owningObject = owner;
  }
  /** @internal Replacing a facade body releases the previous binding. */
  detach(owner: GameObject): void {
    if (this.owner === owner) {
      this.owningObject = undefined;
      this.geometry = undefined;
    }
  }
  applyForce(force: Vector2, worldPoint?: Vector2): void {
    finite(force.x, 'force.x');
    finite(force.y, 'force.y');
    if (worldPoint) {
      finite(worldPoint.x, 'worldPoint.x');
      finite(worldPoint.y, 'worldPoint.y');
    }
    if (this.type === 'static') return;
    if (worldPoint && !this.owner)
      throw new Error('A world-point force requires a bound body.');
    this.accumulatedForce.add(force);
    if (worldPoint && this.owner) {
      this.accumulatedTorque +=
        (worldPoint.x - this.owner.position.x) * force.y -
        (worldPoint.y - this.owner.position.y) * force.x;
    }
  }
  applyImpulse(impulse: Vector2, worldPoint?: Vector2): void {
    finite(impulse.x, 'impulse.x');
    finite(impulse.y, 'impulse.y');
    if (worldPoint) {
      finite(worldPoint.x, 'worldPoint.x');
      finite(worldPoint.y, 'worldPoint.y');
    }
    if (this.type === 'static') return;
    if (worldPoint && !this.owner)
      throw new Error('A world-point impulse requires a bound body.');
    this.velocity.x += impulse.x * this.inverseMass;
    this.velocity.y += impulse.y * this.inverseMass;
    if (worldPoint && this.owner)
      this.angularVelocity +=
        this.inverseInertia *
        ((worldPoint.x - this.owner.position.x) * impulse.y -
          (worldPoint.y - this.owner.position.y) * impulse.x);
  }
  clearForces(): void {
    this.accumulatedForce.set(0, 0);
    this.accumulatedTorque = 0;
  }
}
