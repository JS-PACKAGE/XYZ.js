import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { PhysicsWorld3D } from './world.js';
import { finite3D, nonnegative3D, positive3D, vector3D } from './collider.js';
import { physicsProfiles } from '../../../../src/data/physics-profiles.js';

export interface VehicleWheelOptions3D {
  /** Local chassis attachment. Suspension points down local Y; forward is local +Z. */
  position: Readonly<Vector3>;
  radius: number;
  restLength: number;
  travel?: number;
  spring?: number;
  damping?: number;
  friction?: number;
  steer?: boolean;
  drive?: boolean;
}
export interface VehicleOptions3D {
  chassis: Object3D;
  wheels: readonly VehicleWheelOptions3D[];
  driveForce?: number;
  brakeForce?: number;
  lateralGrip?: number;
  maxSuspensionForce?: number;
}
export interface VehicleWheelState3D {
  readonly center: Vector3;
  readonly contact: Vector3;
  grounded: boolean;
  suspensionLength: number;
  suspensionForce: number;
  rotation: number;
}
/** Explicit fixed-step raycast-wheel profile. The existing rigid solver owns chassis motion.
 * Call update(dt) immediately before world.update(dt), once per fixed tick. No chassis ownership. */
export class Vehicle3D {
  readonly chassis: Object3D;
  readonly wheels: readonly VehicleWheelState3D[];
  private readonly descriptors: Required<VehicleWheelOptions3D>[];
  private readonly origin = new Vector3();
  private readonly down = new Vector3();
  private readonly forward = new Vector3();
  private readonly lateral = new Vector3();
  private readonly velocity = new Vector3();
  private readonly groundVelocity = new Vector3();
  private readonly offset = new Vector3();
  private readonly impulse = new Vector3();
  private readonly driveForce: number;
  private readonly drivenCount: number;
  private readonly brakeForce: number;
  private readonly lateralGrip: number;
  private readonly maxForce: number;
  private throttle = 0;
  private brake = 0;
  private steering = 0;
  private disposed = false;
  constructor(
    readonly world: PhysicsWorld3D,
    options: VehicleOptions3D,
  ) {
    if (!world.has(options.chassis) || options.chassis.body?.type !== 'dynamic')
      throw new Error('Vehicle chassis must be a registered dynamic body.');
    if (
      !options.wheels.length ||
      options.wheels.length > physicsProfiles.vehicle.maxWheels
    )
      throw new RangeError('Invalid vehicle wheel count.');
    this.chassis = options.chassis;
    const defaults = physicsProfiles.vehicle;
    this.driveForce = nonnegative3D(
      options.driveForce ?? defaults.driveForce,
      'driveForce',
    );
    this.brakeForce = nonnegative3D(
      options.brakeForce ?? defaults.brakeForce,
      'brakeForce',
    );
    this.lateralGrip = nonnegative3D(
      options.lateralGrip ?? defaults.lateralGrip,
      'lateralGrip',
    );
    this.maxForce = positive3D(
      options.maxSuspensionForce ?? defaults.maxForce,
      'maxSuspensionForce',
    );
    this.descriptors = options.wheels.map((w) => {
      vector3D(w.position, 'wheel position');
      return {
        position: new Vector3(w.position.x, w.position.y, w.position.z),
        radius: positive3D(w.radius, 'radius'),
        restLength: positive3D(w.restLength, 'restLength'),
        travel: nonnegative3D(w.travel ?? w.restLength / 2, 'travel'),
        spring: positive3D(w.spring ?? defaults.spring, 'spring'),
        damping: nonnegative3D(w.damping ?? defaults.damping, 'damping'),
        friction: nonnegative3D(w.friction ?? defaults.friction, 'friction'),
        steer: w.steer ?? false,
        drive: w.drive ?? false,
      };
    });
    this.wheels = this.descriptors.map((w) => ({
      center: new Vector3(),
      contact: new Vector3(),
      grounded: false,
      suspensionLength: w.restLength,
      suspensionForce: 0,
      rotation: 0,
    }));
    this.drivenCount =
      this.descriptors.reduce(
        (count, wheel) => count + (wheel.drive ? 1 : 0),
        0,
      ) || 1;
  }
  setControls(throttle: number, brake = 0, steering = 0): void {
    finite3D(throttle, 'throttle');
    finite3D(brake, 'brake');
    finite3D(steering, 'steering');
    if (
      Math.abs(throttle) > 1 ||
      brake < 0 ||
      brake > 1 ||
      Math.abs(steering) > Math.PI / 2
    )
      throw new RangeError(
        'Controls require throttle [-1,1], brake [0,1], steering radians [-pi/2,pi/2].',
      );
    this.throttle = throttle;
    this.brake = brake;
    this.steering = steering;
  }
  private speed(object: Object3D, point: Vector3, out: Vector3): void {
    const body = object.body;
    if (!body) {
      out.set(0, 0, 0);
      return;
    }
    this.offset.copy(point).subtract(object.position);
    out.copy(body.angularVelocity).cross(this.offset).add(body.velocity);
  }
  update(dt: number): void {
    positive3D(dt, 'delta');
    if (this.disposed) throw new Error('Vehicle3D is destroyed.');
    const body = this.chassis.body;
    if (!body || body.type !== 'dynamic' || !this.world.has(this.chassis))
      throw new Error('Vehicle chassis is no longer registered and dynamic.');
    const matrix = this.chassis.updateWorldMatrix(),
      e = matrix.elements;
    this.down.set(-e[4], -e[5], -e[6]).normalize();
    for (let i = 0; i < this.descriptors.length; i++) {
      const w = this.descriptors[i]!,
        state = this.wheels[i]!;
      matrix.transformPoint(w.position as Vector3, this.origin);
      const reach = w.restLength + w.travel;
      const hit = this.world.raycast(this.origin, this.down, reach + w.radius, {
        ignore: this.chassis,
      });
      state.grounded = !!hit;
      state.suspensionForce = 0;
      state.suspensionLength = hit
        ? Math.max(0, hit.distance - w.radius)
        : reach;
      state.center
        .copy(this.down)
        .scale(state.suspensionLength)
        .add(this.origin);
      if (!hit) continue;
      state.contact.copy(hit.point);
      this.speed(this.chassis, hit.point, this.velocity);
      this.speed(hit.object, hit.point, this.groundVelocity);
      this.velocity.subtract(this.groundVelocity);
      const force = Math.min(
        this.maxForce,
        Math.max(
          0,
          w.spring * (w.restLength - state.suspensionLength) +
            w.damping * this.velocity.dot(this.down),
        ),
      );
      state.suspensionForce = force;
      const angle = w.steer ? this.steering : 0,
        s = Math.sin(angle),
        c = Math.cos(angle);
      this.forward.set(
        e[0] * s + e[8] * c,
        e[1] * s + e[9] * c,
        e[2] * s + e[10] * c,
      );
      const projection = this.forward.dot(hit.normal);
      this.forward.x -= hit.normal.x * projection;
      this.forward.y -= hit.normal.y * projection;
      this.forward.z -= hit.normal.z * projection;
      this.forward.normalize();
      this.lateral.copy(hit.normal).cross(this.forward).normalize();
      const longitudinal = this.velocity.dot(this.forward),
        sideways = this.velocity.dot(this.lateral);
      const brake = Math.min(
        (this.brakeForce * this.brake * dt) / this.wheels.length,
        (Math.abs(longitudinal) * body.mass) / this.wheels.length,
      );
      let fx =
        (w.drive
          ? (this.driveForce * this.throttle * dt) / this.drivenCount
          : 0) -
        Math.sign(longitudinal) * brake;
      let fy =
        ((-sideways * body.mass) / this.wheels.length) *
        Math.min(1, this.lateralGrip * dt);
      const limit = force * w.friction * dt,
        magnitude = Math.hypot(fx, fy);
      if (magnitude > limit && magnitude > 0) {
        fx *= limit / magnitude;
        fy *= limit / magnitude;
      }
      this.impulse.set(
        -this.down.x * force * dt + this.forward.x * fx + this.lateral.x * fy,
        -this.down.y * force * dt + this.forward.y * fx + this.lateral.y * fy,
        -this.down.z * force * dt + this.forward.z * fx + this.lateral.z * fy,
      );
      body.applyImpulse(this.impulse, hit.point);
      if (hit.object.body?.type === 'dynamic') {
        this.impulse.scale(-1);
        hit.object.body.applyImpulse(this.impulse, hit.point);
      }
      state.rotation += (longitudinal * dt) / w.radius;
    }
  }
  destroy(): void {
    this.disposed = true;
  }
}
