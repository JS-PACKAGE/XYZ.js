import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import { type Collider3D } from './collider.js';
import type { PhysicsHit3D } from './world.js';
import { PhysicsWorld3D } from './world.js';
export interface CharacterControllerOptions3D {
    skin?: number;
    stepHeight?: number;
    maxSlopeAngle?: number;
    groundSnap?: number;
    pushStrength?: number;
    maxIterations?: number;
    mask?: number;
    maxRecoveryDistance?: number;
    /** Straight-segment capsule height; radius is unchanged and feet stay fixed. */
    crouchHeight?: number;
    /** Larger observed support motion is treated as a teleport, never a carried move. */
    maxSupportDisplacement?: number;
}
export type CharacterStance3D = 'standing' | 'crouching';
export type CharacterSupportDetachReason3D = 'none' | 'jump' | 'removed' | 'teleport' | 'support-teleport' | 'lost' | 'blocked' | 'manual';
export interface CharacterMovementOptions3D {
    /** Repeated calls in one fixed/gameplay epoch consume support motion at most once. */
    epoch?: number;
    detachSupport?: boolean;
}
/** Borrowed reusable result, valid until the next stance change. */
export interface CharacterStanceResult3D {
    readonly stance: CharacterStance3D;
    readonly changed: boolean;
    readonly blocked: boolean;
    readonly radius: number;
    readonly height: number;
    readonly displacement: Readonly<Vector3>;
}
/** Borrowed reusable result and vectors, valid until the next move. */
export interface CharacterMoveResult3D {
    readonly displacement: Readonly<Vector3>;
    readonly requestedDisplacement: Readonly<Vector3>;
    readonly recoveryDisplacement: Readonly<Vector3>;
    readonly supportDisplacement: Readonly<Vector3>;
    readonly carriedDisplacement: Readonly<Vector3>;
    readonly locomotionDisplacement: Readonly<Vector3>;
    readonly support: Object3D | undefined;
    readonly supportCollider: Collider3D | undefined;
    /** Foot anchor in last consumed support-local/current world pose; zeroed without support. */
    readonly supportLocalAnchor: Readonly<Vector3>;
    readonly supportWorldAnchor: Readonly<Vector3>;
    readonly supportDetached: CharacterSupportDetachReason3D;
    readonly carryBlocked: boolean;
    /** An externally moved support left no proven collision-free carried placement. */
    readonly unresolvedPenetration: boolean;
    readonly supportYawDelta: number;
    readonly grounded: boolean;
    readonly blocked: boolean;
    readonly contacts: readonly PhysicsHit3D[];
}
/** Upright root capsule sweep/slide controller; caller supplies gravity/jump displacement. */
export declare class CharacterController3D {
    readonly object: Object3D;
    readonly world: PhysicsWorld3D;
    readonly skin: number;
    readonly stepHeight: number;
    readonly maxSlopeAngle: number;
    readonly groundSnap: number;
    readonly pushStrength: number;
    readonly maxIterations: number;
    readonly maxRecoveryDistance: number;
    readonly maxSupportDisplacement: number;
    readonly crouchHeight: number;
    private readonly standingCapsule;
    private readonly crouchingCapsule;
    private stanceState;
    private supportObject;
    private supportCollider;
    private supportGeneration;
    private unresolvedCarry;
    private supportCandidate;
    private lastCarryEpoch;
    private pendingDetach;
    private readonly supportPose;
    private readonly nextSupportPose;
    private readonly inverseSupport;
    private readonly localAnchor;
    private readonly worldAnchor;
    private readonly carryPoint;
    private readonly previousCarryPoint;
    private readonly carrySegment;
    private readonly expectedPosition;
    private readonly requested;
    private readonly recoveryApplied;
    private readonly supportRequested;
    private readonly carryApplied;
    private readonly locomotionApplied;
    private readonly phaseStart;
    private readonly stancePosition;
    private readonly stanceApplied;
    private readonly stanceResult;
    private groundedState;
    private disposed;
    private createdBody;
    private readonly remaining;
    private readonly motion;
    private readonly start;
    private readonly stepStart;
    private readonly applied;
    private readonly stepHorizontal;
    private readonly query;
    private readonly carryQuery;
    private readonly hit;
    private readonly contacts;
    private readonly contactPool;
    private readonly result;
    constructor(object: Object3D, world: PhysicsWorld3D, options?: CharacterControllerOptions3D);
    get grounded(): boolean;
    get destroyed(): boolean;
    get stance(): CharacterStance3D;
    get support(): Object3D | undefined;
    /** Explicitly detach before application-owned teleports or custom jumping. */
    detachSupport(): void;
    private assertPose;
    private remember;
    private clearSupport;
    private detectTeleport;
    private assertLive;
    /** Expansion is a clearance transaction; failure changes neither collider nor feet. */
    setStance(stance: CharacterStance3D): CharacterStanceResult3D;
    private noteGround;
    private advance;
    private probe;
    private tryStep;
    private sweepMotion;
    private inheritSupport;
    private updateSupport;
    private stopUnresolvedCarry;
    move(displacement: Readonly<Vector3>, options?: CharacterMovementOptions3D): CharacterMoveResult3D;
    destroy(): void;
}
