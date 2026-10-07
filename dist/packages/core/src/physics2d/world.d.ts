import { Vector2 } from '../../../math/src/index.js';
import type { GameObject } from '../game-object.js';
import { Collider2D } from './collider.js';
import type { Joint2D } from './joints.js';
export interface CollisionDetail {
    readonly self: GameObject;
    readonly other: GameObject;
    readonly normal: Vector2;
    readonly points: readonly Vector2[];
    readonly penetration: number;
    readonly sensor: boolean;
    cancelResponse(): void;
}
export interface ContactQuery {
    readonly owner: GameObject;
    readonly collider: Collider2D;
    readonly normal: Vector2;
    readonly points: readonly Vector2[];
    readonly penetration: number;
    readonly sensor: boolean;
}
export interface PhysicsRayHit {
    readonly owner: GameObject;
    readonly collider: Collider2D;
    readonly distance: number;
    readonly point: Vector2;
    readonly normal: Vector2;
}
export interface PhysicsQueryOptions2D {
    ignore?: GameObject;
    ignoreOther?: GameObject;
    mask?: number;
    includeSensors?: boolean;
}
/** Sweep normal points away from the obstacle, unlike pair contact normals. */
export interface PhysicsSweepResult2D {
    hit: boolean;
    owner: GameObject | undefined;
    collider: Collider2D | undefined;
    fraction: number;
    safeFraction: number;
    exhausted: boolean;
    readonly point: Vector2;
    readonly normal: Vector2;
}
export interface PhysicsWorldOptions {
    gravity?: [number, number];
    fixedDelta?: number;
    maxSubSteps?: number;
    velocityIterations?: number;
    positionIterations?: number;
    ccdIterations?: number;
    ccdImpacts?: number;
}
export interface PhysicsDebugShape {
    readonly kind: 'circle' | 'polygon';
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    /** Flat world-space x,y pairs of a polygon; empty for circles. */
    readonly points: readonly number[];
    /** `[minX, minY, maxX, maxY]`. */
    readonly bounds: readonly [number, number, number, number];
    readonly dynamic: boolean;
    readonly sensor: boolean;
    readonly sleeping: boolean;
}
export interface PhysicsDebugContact {
    readonly points: readonly (readonly [number, number])[];
    readonly normal: readonly [number, number];
    readonly sensor: boolean;
}
export interface PhysicsDebugJoint {
    readonly type: string;
    readonly anchors: readonly [number, number, number, number];
}
export interface PhysicsDebugSnapshot {
    readonly shapes: readonly PhysicsDebugShape[];
    readonly contacts: readonly PhysicsDebugContact[];
    readonly joints: readonly PhysicsDebugJoint[];
}
/** Bounded fixed-step 2D impulse solver. */
export declare class PhysicsWorld2D {
    readonly gravity: Vector2;
    private readonly owners;
    private readonly proxies;
    private readonly sorted;
    private readonly activeContacts;
    private readonly solveContacts;
    /** Number of registered colliders, static ones included. */
    get colliderCount(): number;
    private readonly sleepGroup;
    private readonly continuous;
    private readonly impactManifold;
    /** Diagnostics for the most recently simulated fixed tick; velocity is never clamped. */
    readonly ccdStats: {
        iterations: number;
        impacts: number;
        budgetExhaustions: number;
        stoppedTime: number;
    };
    private continuousIterations;
    private continuousImpacts;
    private readonly jointSet;
    private readonly activeJoints;
    private readonly forces;
    private readonly queryManifold;
    private readonly positionManifold;
    private readonly queryNormal;
    private readonly queryGeometries;
    private readonly queryMotions;
    private continuation;
    private accumulator;
    private stepToken;
    private stepping;
    private disposed;
    private timeStep;
    private stepLimit;
    private velocityPasses;
    private positionPasses;
    droppedTime: number;
    private geometryVersion;
    private registrationVersion;
    /** Collision-bake snapshot token, including direct mutable transforms and query filters. */
    get geometryRevision(): number;
    constructor(options?: PhysicsWorldOptions);
    get destroyed(): boolean;
    get fixedDelta(): number;
    set fixedDelta(value: number);
    get maxSubSteps(): number;
    set maxSubSteps(value: number);
    get velocityIterations(): number;
    set velocityIterations(value: number);
    get positionIterations(): number;
    set positionIterations(value: number);
    get ccdIterations(): number;
    set ccdIterations(value: number);
    get ccdImpacts(): number;
    set ccdImpacts(value: number);
    /** Membership and replacement token for borrowed character supports. */
    has(owner: GameObject, collider?: Collider2D | undefined): boolean;
    /** Removed/replaced/re-registered supports invalidate borrowed local anchors. */
    membershipRevision(owner: GameObject): number;
    /** @internal Called transactionally by Scene and facade body/collider setters. */
    register(owner: GameObject): void;
    unregister(owner: GameObject): void;
    private alive;
    private emit;
    private end;
    private forceState;
    /** @internal Sample frame forces even when no fixed tick is due. */
    sampleForces(delta: number): void;
    /** @internal Forces from fixed gameplay are impulses over that exact tick. */
    sampleFixedForces(delta: number): void;
    /** @internal Discard only simulation time omitted by the scene catch-up limit. */
    discardFrameTime(delta: number): void;
    get interpolationAlpha(): number;
    update(deltaTime: number, canContinue?: () => boolean, sampleFrame?: boolean): void;
    private advanceBodies;
    private activate;
    private integrateContinuous;
    private simulate;
    private wakeContactGroups;
    private prepareBounce;
    private solveVelocity;
    private impulse;
    private solvePosition;
    overlap(collider: Collider2D, owner: GameObject): readonly ContactQuery[];
    /** Shape-accurate rigid translation sweep against current poses, with a proven-free prefix. */
    sweep(collider: Collider2D, owner: GameObject, displacement: Readonly<Vector2>, options?: PhysicsQueryOptions2D, out?: PhysicsSweepResult2D): PhysicsSweepResult2D;
    raycast(origin: Vector2, direction: Vector2, maxDistance: number, mask?: number): readonly PhysicsRayHit[];
    /** Attaches a joint between registered bodies (or one body and a fixed world anchor). */
    addJoint<T extends Joint2D>(joint: T): T;
    removeJoint(joint: Joint2D): boolean;
    get joints(): readonly Joint2D[];
    private prepareJoints;
    private breakJoints;
    private jointsBlockContact;
    /** Copies the current colliders, active contacts and joints for visualization. */
    debugSnapshot(): PhysicsDebugSnapshot;
    clear(): void;
    destroy(): void;
}
