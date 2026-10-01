import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import {
  CapsuleCollider3D,
  nonnegative3D,
  positive3D,
  vector3D,
} from './collider.js';
import { RigidBody3D } from './body.js';
import type { PhysicsHit3D, PhysicsQueryOptions3D } from './world.js';
import { PhysicsWorld3D } from './world.js';
import { physics3DDefaults } from '../../../../src/data/physics3d.js';
export interface CharacterControllerOptions3D {
  skin?: number;
  stepHeight?: number;
  maxSlopeAngle?: number;
  groundSnap?: number;
  pushStrength?: number;
  maxIterations?: number;
  mask?: number;
  maxRecoveryDistance?: number;
}
/** Borrowed reusable result, valid until the next move. */
export interface CharacterMoveResult3D {
  readonly displacement: Readonly<Vector3>;
  readonly grounded: boolean;
  readonly blocked: boolean;
  readonly contacts: readonly PhysicsHit3D[];
}
/** Upright root capsule sweep/slide controller; caller supplies gravity/jump displacement and simulation delta. */
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
  private readonly hit: PhysicsHit3D;
  private readonly contacts: PhysicsHit3D[] = [];
  private readonly contactPool: PhysicsHit3D[] = [];
  private readonly result: {
    displacement: Vector3;
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
    if (object.body && object.body.type !== 'kinematic')
      throw new Error('Character requires a kinematic body.');
    if (!object.body) {
      const body = new RigidBody3D({ type: 'kinematic', lockRotation: true });
      object.body = body;
      this.createdBody = body;
    }
    this.query = { ignore: object, mask: options.mask ?? 0xffffffff };
    this.hit = {
      object,
      collider: object.collider!,
      point: new Vector3(),
      normal: new Vector3(),
      distance: 0,
    };
    this.result = {
      displacement: this.applied,
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
      Math.abs(o.rotation.x) > 1e-8 ||
      Math.abs(o.rotation.z) > 1e-8
    )
      throw new Error(
        'Character must be upright with unit scale (yaw is supported).',
      );
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
    this.groundedState = true;
    return true;
  }
  move(displacement: Readonly<Vector3>): CharacterMoveResult3D {
    if (this.disposed) throw new Error('CharacterController3D is destroyed.');
    this.assertPose();
    vector3D(displacement, 'displacement');
    if (!this.world.has(this.object))
      throw new Error('Character must be registered in its PhysicsWorld3D.');
    if (this.object.body?.type !== 'kinematic')
      throw new Error('Character kinematic body was replaced.');
    this.contacts.length = 0;
    this.start.copy(this.object.position);
    this.remaining.set(displacement.x, displacement.y, displacement.z);
    this.result.blocked = false;
    if (
      !this.world.recoverCapsule(
        this.object,
        this.maxRecoveryDistance,
        this.query,
      )
    )
      throw new Error(
        'Character initial penetration exceeds bounded recovery.',
      );
    const wasGrounded =
      this.groundedState || this.probe(this.groundSnap + this.skin, false);
    this.groundedState = false;
    for (
      let iteration = 0;
      iteration < this.maxIterations && this.remaining.length() > 1e-8;
      iteration++
    ) {
      const h = this.world.sweepCapsule(
        this.object,
        this.remaining,
        this.query,
        this.hit,
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
      if (normal.y >= Math.cos(this.maxSlopeAngle) && displacement.y <= 0)
        this.groundedState = true;
      const into = this.remaining.dot(normal);
      if (into < 0) {
        const body = contact.object.body;
        if (body?.type === 'dynamic' && this.pushStrength > 0) {
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
          normal.y > 0 &&
          normal.y < Math.cos(this.maxSlopeAngle) &&
          this.remaining.y > Math.max(0, displacement.y)
        )
          this.remaining.y = Math.max(0, displacement.y);
      }
      this.result.blocked = true;
    }
    if (this.remaining.length() > 1e-8) this.result.blocked = true;
    if (displacement.y <= 0)
      this.groundedState =
        this.probe(
          this.groundSnap + this.skin,
          wasGrounded || this.groundedState,
        ) || this.groundedState;
    this.applied.copy(this.object.position).subtract(this.start);
    this.result.grounded = this.groundedState;
    return this.result;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.contacts.length = 0;
    this.contactPool.length = 0;
    if (
      this.createdBody &&
      this.object.body === this.createdBody &&
      !this.object.destroyed
    )
      this.object.body = undefined;
    this.createdBody = undefined;
  }
}
