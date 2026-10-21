import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import { CapsuleCollider3D } from './collider.js';
import type { Collider3D } from './collider.js';
import { Joint3D } from './joints.js';
import { type PhysicsDebugSnapshot3D } from './debug-geometry.js';
export interface PhysicsStats3D {
    readonly candidatePairs: number;
    readonly narrowphaseTests: number;
    readonly queryCandidates: number;
    /** Cumulative geometry refreshes and changed hierarchy nodes, not pose scans. */
    readonly refreshedLeaves: number;
    readonly refits: number;
    readonly poseChecks: number;
    readonly indexGeneration: number;
    readonly ccdTests: number;
    readonly ccdIterations: number;
    readonly ccdImpacts: number;
    readonly ccdExhaustions: number;
    readonly ccdLimitedTime: number;
    readonly jointRows: number;
    readonly jointIterations: number;
}
export interface PhysicsWorldOptions3D {
    gravity?: Readonly<Vector3>;
    fixedDelta?: number;
    maxSubSteps?: number;
    solverIterations?: number;
}
export interface PhysicsQueryOptions3D {
    mask?: number;
    includeSensors?: boolean;
    ignore?: Object3D;
    ignoreAlso?: Object3D;
}
export interface PhysicsRaycastAllOptions3D extends PhysicsQueryOptions3D {
    /** Overflow throws; never returns an incomplete set disguised as complete. */
    readonly maxHits?: number;
    readonly maxTests?: number;
}
export interface PhysicsHit3D {
    object: Object3D;
    collider: Collider3D;
    point: Vector3;
    normal: Vector3;
    distance: number;
}
export interface PhysicsContact3D {
    readonly self: Object3D;
    readonly other: Object3D;
    readonly normal: Readonly<Vector3>;
    readonly point: Readonly<Vector3>;
    readonly sensor: boolean;
}
/** Deterministic primitive/mesh/compound impulses, iterative joints and opt-in rigid-motion CCD. */
export declare class PhysicsWorld3D {
    readonly gravity: Vector3;
    readonly fixedDelta: number;
    readonly maxSubSteps: number;
    readonly solverIterations: number;
    /** Disabling freezes fixed-step time and contacts without accumulating catch-up work. */
    enabled: boolean;
    private readonly entries;
    /** Registration order; read through `ordered`, which drops unregistered entries. */
    private readonly orderedStore;
    /** Unregistered entries still present in the ordered/swept stores. */
    private unregisteredEntries;
    private readonly index;
    private readonly pairCandidates;
    /** Broadphase pairs as (lower order, higher order) plus their visiting sequence. */
    private readonly pairLows;
    private readonly pairHighs;
    private readonly pairSequence;
    private readonly comparePairs;
    private readonly queryCandidates;
    private readonly queryBounds;
    private readonly sweepTriangles;
    private readonly leafBounds;
    private indexDirty;
    /** Set inside withPoseSnapshot: poses were refreshed once and only its mover can move. */
    private poseSnapshot;
    /** Entries of the snapshot mover and its descendants, in `ordered` order. */
    private readonly snapshotMovers;
    private readonly sweptIndex;
    private readonly sweptStore;
    private readonly ccdCandidates;
    private sweptIndexDirty;
    private readonly ccd;
    private readonly constraints;
    private readonly jointSnapshot;
    private readonly jointLinks;
    private readonly placementMatrix;
    private readonly placementPosition;
    private placementShape;
    private capsuleQueryShape;
    private readonly capsuleQueryShapes;
    private sweepQueryShape;
    private nextOrder;
    private readonly counters;
    readonly stats: PhysicsStats3D;
    /** Rows are keyed by the first entry; `contactRow`/`partnerRows` index them in reverse. */
    private readonly contacts;
    private contactRowSerial;
    private readonly active;
    private readonly narrow;
    private readonly queryNarrow;
    private readonly queryManifold;
    private readonly queryShape;
    private readonly impulse;
    private readonly crossA;
    private readonly crossB;
    private readonly inertiaA;
    private readonly inertiaB;
    private readonly relative;
    /** Body A then body B point velocity for `solve`. */
    private readonly contactVelocities;
    private readonly ccdDisplacement;
    private readonly torque;
    private readonly forces;
    private accumulator;
    private stepId;
    /** Bumped whenever contact effective masses must be recomputed. */
    private massEpoch;
    /** Current velocity-iteration phase; keys bodies' solver inertia copies. */
    private solvePhase;
    private disposed;
    private destroying;
    private stepping;
    droppedTime: number;
    constructor(options?: PhysicsWorldOptions3D);
    has(object: Object3D): boolean;
    get size(): number;
    /** Mutation-aware geometry generation; query-only probes never change it. */
    get geometryRevision(): number;
    /**
     * @internal Runs synchronous queries (no user code runs inside `run`) against one pose
     * refresh instead of rechecking every pose per query. Only `mover` and its descendants
     * may move inside `run`; their entries alone are rechecked per query.
     */
    withPoseSnapshot<T>(run: () => T, mover?: Object3D): T;
    get joints(): readonly Joint3D[];
    /** Explicit immutable wireframe snapshot; no collider/body references escape. */
    debugSnapshot(): PhysicsDebugSnapshot3D;
    addJoint<T extends Joint3D>(joint: T): T;
    removeJoint(joint: Joint3D): boolean;
    private connected;
    /** @internal Preflight before changing either attachment or hierarchy. */
    validate(object: Object3D): void;
    /** @internal Transactional attachment replacement; old contacts end only after validation succeeds. */
    register(object: Object3D): void;
    unregister(object: Object3D): void;
    private get ordered();
    private get sweptEntries();
    private compactEntries;
    private valid;
    private start;
    private end;
    private forceState;
    /** @internal Sample once per gameplay frame, even when no fixed tick is due. */
    sampleForces(delta: number): void;
    /** @internal Forces from fixed gameplay are impulses over that exact tick. */
    sampleFixedForces(delta: number): void;
    /** @internal Discard only simulation time omitted by the scene catch-up limit. */
    discardFrameTime(delta: number): void;
    get interpolationAlpha(): number;
    update(delta: number, canContinue?: () => boolean, sampleFrame?: boolean): void;
    private solveJoints;
    private prepareContact;
    private moveBodies;
    private integrateContinuous;
    private step;
    private velocityAt;
    private movingAtContact;
    private effective;
    /** Effective masses depend only on poses/inertia, which velocity iterations never change. */
    private prepareMasses;
    /** Body velocity at `point` (zero without an owner), as `velocityAt` computes it, in scalars. */
    private velocityInto;
    /** Applies `impulse` (scalars, signed by `sign`) at `point` to a dynamic awake body. */
    private applyImpulse;
    private solve;
    private refreshIndex;
    private candidates;
    private accepts;
    /** Exact primitive overlap; transformed query owner is not registered. Caller owns returned hits. */
    overlap(collider: Collider3D, object: Object3D, options?: PhysicsQueryOptions3D): PhysicsHit3D[];
    /** Closest world-distance ray hit. Inside starts report distance 0; normalized direction is not required. */
    raycast(origin: Readonly<Vector3>, direction: Readonly<Vector3>, maxDistance: number, options?: PhysicsQueryOptions3D): PhysicsHit3D | undefined;
    /** Sorted analytic boundary hits, including every intersected triangle/compound child.
     * Solid inside starts return the exit boundary, unlike the nearest raycast API's distance 0.
     * Duplicate mesh seam hits are coalesced; filters and borrowed collider ownership are unchanged.
     */
    raycastAll(origin: Readonly<Vector3>, direction: Readonly<Vector3>, maxDistance: number, options?: PhysicsRaycastAllOptions3D): PhysicsHit3D[];
    /** Translation-only conservative advancement against exact primitive distance. No AABB-expanded corner proxy. */
    sweepSphere(center: Readonly<Vector3>, radius: number, displacement: Readonly<Vector3>, options?: PhysicsQueryOptions3D, out?: PhysicsHit3D): PhysicsHit3D | undefined;
    sweepCapsule(object: Object3D, displacement: Readonly<Vector3>, options?: PhysicsQueryOptions3D, out?: PhysicsHit3D, padding?: number): PhysicsHit3D | undefined;
    /** @internal Bounded minimum-translation recovery from primitive overlaps; failure restores the original pose. */
    recoverCapsule(object: Object3D, limit: number, options: PhysicsQueryOptions3D): boolean;
    /** Transactional stance clearance at a root pose; neither attachment nor owner pose is modified. */
    canPlaceCapsule(object: Object3D, collider: CapsuleCollider3D, position: Readonly<Vector3>, options?: PhysicsQueryOptions3D): boolean;
    /** Exact shape translation query. Mesh/plane query shapes are static-only and rejected. */
    sweep(collider: Collider3D, object: Object3D, displacement: Readonly<Vector3>, options?: PhysicsQueryOptions3D, out?: PhysicsHit3D): PhysicsHit3D | undefined;
    private sweepShape;
    private sweepPair;
    destroy(): void;
}
