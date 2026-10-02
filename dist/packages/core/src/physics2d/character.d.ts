import { Vector2 } from '../../../math/src/index.js';
import type { GameObject } from '../game-object.js';
import { Collider2D } from './collider.js';
import { PhysicsWorld2D } from './world.js';
export interface CharacterControllerOptions2D {
    skin?: number;
    stepHeight?: number;
    maxSlopeAngle?: number;
    groundSnap?: number;
    maxIterations?: number;
    maxRecoveryDistance?: number;
    maxSupportDisplacement?: number;
    mask?: number;
}
export type CharacterSupportDetachReason2D = 'none' | 'jump' | 'removed' | 'teleport' | 'support-teleport' | 'lost' | 'blocked' | 'manual';
export interface CharacterMovementOptions2D {
    /** Support motion is consumed once per epoch, even if gameplay makes several moves. */
    epoch?: number;
    detachSupport?: boolean;
}
/** Borrowed reusable result; +Y is down and callers supply fixed-step gravity/jump displacement. */
export interface CharacterMoveResult2D {
    readonly displacement: Readonly<Vector2>;
    readonly requestedDisplacement: Readonly<Vector2>;
    readonly recoveryDisplacement: Readonly<Vector2>;
    readonly supportDisplacement: Readonly<Vector2>;
    readonly carriedDisplacement: Readonly<Vector2>;
    readonly locomotionDisplacement: Readonly<Vector2>;
    readonly supportLocalAnchor: Readonly<Vector2>;
    readonly supportWorldAnchor: Readonly<Vector2>;
    readonly support: GameObject | undefined;
    readonly supportCollider: Collider2D | undefined;
    readonly supportDetached: CharacterSupportDetachReason2D;
    readonly supportRotationDelta: number;
    readonly carryBlocked: boolean;
    readonly unresolvedPenetration: boolean;
    readonly grounded: boolean;
    readonly blocked: boolean;
    readonly exhausted: boolean;
}
/** Convex root controller using the same exact geometry/filter sweeps as the rigid-body world. */
export declare class CharacterController2D {
    readonly object: GameObject;
    readonly world: PhysicsWorld2D;
    readonly skin: number;
    readonly stepHeight: number;
    readonly maxSlopeAngle: number;
    readonly groundSnap: number;
    readonly maxIterations: number;
    readonly maxRecoveryDistance: number;
    readonly maxSupportDisplacement: number;
    private readonly collider;
    private readonly createdBody;
    private readonly query;
    private readonly hit;
    private readonly requested;
    private readonly applied;
    private readonly recovery;
    private readonly supportRequested;
    private readonly carried;
    private readonly locomotion;
    private readonly localAnchor;
    private readonly worldAnchor;
    private readonly expected;
    private readonly start;
    private readonly phaseStart;
    private readonly stepStart;
    private readonly slideEnd;
    private stepObstacle;
    private readonly remaining;
    private readonly motion;
    private readonly pose;
    private readonly nextPose;
    private supportOwner;
    private supportShape;
    private supportMembership;
    private candidate;
    private candidateCollider;
    private lastEpoch;
    private pendingDetach;
    private disposed;
    private groundedState;
    private readonly result;
    constructor(object: GameObject, world: PhysicsWorld2D, options?: CharacterControllerOptions2D);
    get destroyed(): boolean;
    get grounded(): boolean;
    private assertPose;
    detachSupport(reason?: CharacterSupportDetachReason2D): void;
    private readSupport;
    private sweep;
    private recordGround;
    private slide;
    private tryStep;
    private recover;
    private carry;
    move(displacement: Readonly<Vector2>, options?: CharacterMovementOptions2D): CharacterMoveResult2D;
    destroy(): void;
}
