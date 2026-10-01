import { GameObject } from '../game-object.js';
import type { RigidBody2D } from './body.js';
/** The solver-facing view of a registered body; the world's internal proxies satisfy it. */
export interface JointBodyView {
    readonly owner: GameObject;
    readonly body: RigidBody2D | undefined;
    readonly inverseMass: number;
    readonly inverseInertia: number;
    readonly joints: Joint2D[];
}
export declare const groundView: JointBodyView;
interface Pose {
    x: number;
    y: number;
    angle: number;
}
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
export declare abstract class Joint2D {
    readonly bodyA: GameObject;
    readonly bodyB: GameObject | undefined;
    readonly collideConnected: boolean;
    abstract readonly type: 'distance' | 'revolute' | 'prismatic' | 'weld' | 'mouse';
    breakForce: number;
    /** Called once, after the world removes a joint whose reaction exceeded `breakForce`. */
    onBreak: ((joint: Joint2D) => void) | undefined;
    protected viewA: JointBodyView;
    protected viewB: JointBodyView;
    protected localAx: number;
    protected localAy: number;
    protected localBx: number;
    protected localBy: number;
    protected referenceAngle: number;
    protected rAx: number;
    protected rAy: number;
    protected rBx: number;
    protected rBy: number;
    protected mA: number;
    protected mB: number;
    protected iA: number;
    protected iB: number;
    protected reactionX: number;
    protected reactionY: number;
    private readonly anchor;
    private readonly anchorB;
    private attachedWorld;
    constructor(options: JointOptions);
    get attached(): boolean;
    /** Total anchor reaction of the last solved step, as a force. */
    get reactionForce(): number;
    private stepRate;
    /**
     * @internal Resolves local anchors from the current poses and registers on both bodies. With
     * no second body the fixed world becomes side A and `bodyA` side B, so single-body joints
     * read naturally: angles, translations and motors are the body's, relative to the world.
     */
    attach(world: object, a: JointBodyView, b: JointBodyView | undefined): void;
    /** @internal */
    detach(): void;
    /** @internal The body on the other side of `view`, or undefined for the world anchor. */
    partner(view: JointBodyView): JointBodyView | undefined;
    /** @internal Both ends are static or asleep. */
    get resting(): boolean;
    /** @internal */
    get views(): readonly [JointBodyView, JointBodyView];
    /** World positions `[ax, ay, bx, by]` of both anchors at the current poses. */
    anchors(): [number, number, number, number];
    /** Called once at attach with the poses used to derive the local anchors. */
    protected initialize(a: Pose, b: Pose): void;
    /** @internal Recomputes world lever arms and masses; clears accumulated impulses. */
    prepare(dt: number): void;
    protected abstract prepareStep(dt: number, a: Pose, b: Pose): void;
    /** @internal */
    abstract solveVelocity(dt: number): void;
    /** @internal Returns the remaining positional error before this correction. */
    abstract solvePosition(): number;
    /** Velocity of anchor B relative to anchor A. */
    protected relativeAnchorVelocity(out: {
        x: number;
        y: number;
    }): void;
    protected applyImpulse(px: number, py: number): void;
    protected applyAngularImpulse(impulse: number): void;
    protected relativeAngularVelocity(): number;
    /** Solves the two-axis point constraint `anchorB == anchorA` for velocity. */
    protected solvePointVelocity(): void;
    /** Moves the bodies so the two anchors coincide; returns the error before correction. */
    protected solvePointPosition(): number;
    protected currentAngle(): number;
}
export interface DistanceJointOptions extends JointOptions {
    /** Rest length; defaults to the distance between the two anchors at creation. */
    length?: number;
    /** 0 (default) is rigid; otherwise the spring frequency in Hz. */
    frequencyHz?: number;
    dampingRatio?: number;
}
/** Keeps two anchors a fixed distance apart, rigidly or as a damped spring. */
export declare class DistanceJoint extends Joint2D {
    readonly type = "distance";
    length: number;
    frequencyHz: number;
    dampingRatio: number;
    private nx;
    private ny;
    private axialMass;
    private gamma;
    private bias;
    private impulse;
    constructor(options: DistanceJointOptions);
    protected prepareStep(dt: number, a: Pose, b: Pose): void;
    solveVelocity(): void;
    solvePosition(): number;
}
export interface RevoluteJointOptions extends JointOptions {
    /** Lower/upper relative angle in radians (angle of B minus A minus the creation angle). */
    lowerAngle?: number;
    upperAngle?: number;
    motorSpeed?: number;
    maxMotorTorque?: number;
}
/** A pin: both bodies keep the anchor point together and may rotate around it. */
export declare class RevoluteJoint extends Joint2D {
    readonly type = "revolute";
    lowerAngle: number;
    upperAngle: number;
    motorSpeed: number;
    /** 0 disables the motor. */
    maxMotorTorque: number;
    private angularMass;
    private motorImpulse;
    private lowerImpulse;
    private upperImpulse;
    private angle;
    constructor(options: RevoluteJointOptions);
    /** Relative angle of B to A at the last prepared step, radians. */
    get jointAngle(): number;
    protected prepareStep(_dt: number, a: Pose, b: Pose): void;
    solveVelocity(dt: number): void;
    solvePosition(): number;
}
/** Glues two bodies together at the anchor, locking their relative angle. */
export declare class WeldJoint extends Joint2D {
    readonly type = "weld";
    private angularMass;
    protected prepareStep(): void;
    solveVelocity(): void;
    solvePosition(): number;
}
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
export declare class PrismaticJoint extends Joint2D {
    readonly type = "prismatic";
    lowerTranslation: number;
    upperTranslation: number;
    motorSpeed: number;
    maxMotorForce: number;
    private readonly worldAxis;
    private localAxisX;
    private localAxisY;
    private axisX;
    private axisY;
    private axialMass;
    private a1;
    private a2;
    private s1;
    private s2;
    private translation;
    private motorImpulse;
    private lowerImpulse;
    private upperImpulse;
    constructor(options: PrismaticJointOptions);
    /** Translation of anchor B along the axis at the last prepared step. */
    get jointTranslation(): number;
    protected initialize(a: Pose): void;
    protected prepareStep(_dt: number, a: Pose, b: Pose): void;
    private axialVelocity;
    private applyAxial;
    solveVelocity(dt: number): void;
    solvePosition(): number;
}
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
export declare class MouseJoint extends Joint2D {
    readonly type = "mouse";
    maxForce: number;
    frequencyHz: number;
    dampingRatio: number;
    private targetX;
    private targetY;
    private gamma;
    private biasX;
    private biasY;
    private impulseX;
    private impulseY;
    private kXX;
    private kXY;
    private kYY;
    constructor(options: MouseJointOptions);
    setTarget(x: number, y: number): void;
    get target(): readonly [number, number];
    anchors(): [number, number, number, number];
    protected prepareStep(dt: number, _a: Pose, b: Pose): void;
    solveVelocity(dt: number): void;
    solvePosition(): number;
}
export {};
