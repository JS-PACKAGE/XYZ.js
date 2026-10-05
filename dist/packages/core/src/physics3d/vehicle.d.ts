import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { PhysicsWorld3D } from './world.js';
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
export declare class Vehicle3D {
    readonly world: PhysicsWorld3D;
    readonly chassis: Object3D;
    readonly wheels: readonly VehicleWheelState3D[];
    private readonly descriptors;
    private readonly origin;
    private readonly down;
    private readonly forward;
    private readonly lateral;
    private readonly velocity;
    private readonly groundVelocity;
    private readonly offset;
    private readonly impulse;
    private readonly driveForce;
    private readonly drivenCount;
    private readonly brakeForce;
    private readonly lateralGrip;
    private readonly maxForce;
    private throttle;
    private brake;
    private steering;
    private disposed;
    constructor(world: PhysicsWorld3D, options: VehicleOptions3D);
    setControls(throttle: number, brake?: number, steering?: number): void;
    private speed;
    update(dt: number): void;
    destroy(): void;
}
