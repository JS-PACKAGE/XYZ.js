import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { RigidBody3D } from './body.js';
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
declare class Frame3D {
    readonly position: Vector3;
    readonly axes: Vector3[];
    read(object: Object3D | undefined): void;
    local(world: Readonly<Vector3>, out: Vector3): void;
    world(local: Readonly<Vector3>, out: Vector3): void;
}
declare class Row3D {
    readonly axis: Vector3;
    readonly angularA: Vector3;
    readonly angularB: Vector3;
    readonly responseA: Vector3;
    readonly responseB: Vector3;
    angular: boolean;
    mass: number;
    bias: number;
    gamma: number;
    impulse: number;
    lower: number;
    upper: number;
}
/** Sequential impulses with world-space inverse inertia, compliant spring rows and bounded bias. */
export declare abstract class Joint3D {
    abstract readonly type: 'distance' | 'ball-socket' | 'hinge';
    readonly bodyA: Object3D;
    readonly bodyB: Object3D | undefined;
    readonly collideConnected: boolean;
    breakForce: number;
    breakTorque: number;
    onBreak: ((joint: Joint3D) => void) | undefined;
    private worldOwner;
    private active;
    private readonly anchorA;
    private readonly anchorB;
    protected readonly localA: Vector3;
    protected readonly localB: Vector3;
    protected readonly frameA: Frame3D;
    protected readonly frameB: Frame3D;
    protected objectA: Object3D | undefined;
    protected objectB: Object3D | undefined;
    protected solverA: RigidBody3D | undefined;
    protected solverB: RigidBody3D | undefined;
    protected readonly rA: Vector3;
    protected readonly rB: Vector3;
    protected readonly pointA: Vector3;
    protected readonly pointB: Vector3;
    protected readonly error: Vector3;
    protected readonly scratch: Vector3;
    protected readonly rows: Row3D[];
    protected rowCount: number;
    private stepRate;
    private readonly reaction;
    private readonly angularReaction;
    constructor(options: JointOptions3D);
    get attached(): boolean;
    /** @internal Ownership check used during callbacks that mutate the world's joint list. */
    belongsTo(world: object): boolean;
    get enabled(): boolean;
    set enabled(value: boolean);
    get reactionForce(): number;
    get reactionTorque(): number;
    /** @internal Prepared row count for finite-work measurement. */
    get solverRowCount(): number;
    /** @internal The world validates registrations before binding. */
    attach(world: object): void;
    /** @internal Removal/replacement of either attachment invalidates the joint. */
    detach(): void;
    wake(): void;
    /** World-space anchor snapshots, allocated only on explicit caller request. */
    anchors(): readonly [Vector3, Vector3];
    protected bindFrames(): void;
    protected readAnchors(): void;
    /** @internal Captures this tick's Jacobians and clears accumulated impulses. */
    prepare(dt: number): void;
    protected abstract prepareRows(dt: number): void;
    protected row(axis: Readonly<Vector3>, error: number, dt: number, angular?: boolean, lower?: number, upper?: number, frequencyHz?: number, dampingRatio?: number): Row3D;
    protected pointRows(dt: number): void;
    protected axialSpeed(axis: Readonly<Vector3>): number;
    protected angularLimit(axis: Readonly<Vector3>, angle: number, lower: number, upper: number, dt: number, anticipatedSpeed?: number): void;
    /** @internal One deterministic sequential-impulse pass; no pose-only constraint substitute. */
    solveVelocity(): void;
}
export interface DistanceJointOptions3D extends JointOptions3D {
    length?: number;
    /** Zero makes the distance rigid; positive values produce a compliant suspension spring. */
    frequencyHz?: number;
    dampingRatio?: number;
}
export declare class DistanceJoint3D extends Joint3D {
    readonly type = "distance";
    length: number;
    frequencyHz: number;
    dampingRatio: number;
    constructor(options: DistanceJointOptions3D);
    protected prepareRows(dt: number): void;
}
interface AxisJointOptions3D extends JointOptions3D {
    /** World axis at attachment. Defaults to +Y. */
    axis?: Readonly<Vector3>;
}
declare abstract class AxisJoint3D extends Joint3D {
    private readonly bindAxis;
    private readonly bindTangent;
    private readonly localAxisA;
    private readonly localAxisB;
    private readonly localTangentA;
    private readonly localTangentB;
    protected readonly axisA: Vector3;
    protected readonly axisB: Vector3;
    protected readonly tangentA: Vector3;
    protected readonly tangentB: Vector3;
    protected readonly bitangentA: Vector3;
    protected readonly bitangentB: Vector3;
    protected readonly swingAxis: Vector3;
    protected readonly twistJacobian: Vector3;
    protected swing: number;
    protected twist: number;
    constructor(options: AxisJointOptions3D);
    protected bindFrames(): void;
    protected readAxes(): void;
}
export interface BallSocketJointOptions3D extends AxisJointOptions3D {
    swingLimit?: number;
    lowerTwist?: number;
    upperTwist?: number;
}
/** Three anchor rows plus an optional cone and twist interval for articulated limbs. Angles are radians. */
export declare class BallSocketJoint3D extends AxisJoint3D {
    readonly type = "ball-socket";
    swingLimit: number;
    lowerTwist: number;
    upperTwist: number;
    constructor(options: BallSocketJointOptions3D);
    private validateLimits;
    get swingAngle(): number;
    get twistAngle(): number;
    protected prepareRows(dt: number): void;
}
export interface HingeJointOptions3D extends AxisJointOptions3D {
    lowerAngle?: number;
    upperAngle?: number;
    enableMotor?: boolean;
    motorSpeed?: number;
    maxMotorTorque?: number;
}
/** Pivot and axis alignment constraints, a torque-limited motor and an angular stop interval. */
export declare class HingeJoint3D extends AxisJoint3D {
    readonly type = "hinge";
    lowerAngle: number;
    upperAngle: number;
    enableMotor: boolean;
    motorSpeed: number;
    maxMotorTorque: number;
    constructor(options: HingeJointOptions3D);
    private validateMotor;
    get angle(): number;
    protected prepareRows(dt: number): void;
}
export {};
