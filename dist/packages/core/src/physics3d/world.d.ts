import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { Collider3D } from './collider.js';
export interface PhysicsStats3D {
    readonly candidatePairs: number;
    readonly narrowphaseTests: number;
    readonly queryCandidates: number;
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
/** Deterministic primitive/mesh/compound solver; optional bounded static-target translation CCD. No joints or rotational/dynamic-pair CCD. */
export declare class PhysicsWorld3D {
    readonly gravity: Vector3;
    readonly fixedDelta: number;
    readonly maxSubSteps: number;
    readonly solverIterations: number;
    /** Disabling freezes fixed-step time and contacts without accumulating catch-up work. */
    enabled: boolean;
    private readonly entries;
    private readonly ordered;
    private readonly index;
    private readonly pairCandidates;
    private readonly queryCandidates;
    private readonly queryBounds;
    private readonly sweepTriangles;
    private readonly leafBounds;
    private indexDirty;
    private nextOrder;
    private readonly counters;
    readonly stats: PhysicsStats3D;
    private readonly contacts;
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
    private readonly ccdDisplacement;
    private readonly ccdOptions;
    private ccdHit;
    private sweepSafeFraction;
    private readonly torque;
    private readonly forces;
    private accumulator;
    private stepId;
    private disposed;
    private destroying;
    private stepping;
    droppedTime: number;
    constructor(options?: PhysicsWorldOptions3D);
    has(object: Object3D): boolean;
    get size(): number;
    /** @internal Preflight before changing either attachment or hierarchy. */
    validate(object: Object3D): void;
    /** @internal Transactional attachment replacement; old contacts end only after validation succeeds. */
    register(object: Object3D): void;
    unregister(object: Object3D): void;
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
    private step;
    private velocityAt;
    private movingAtContact;
    private effective;
    private solverImpulse;
    private solve;
    private refreshIndex;
    private candidates;
    private accepts;
    /** Exact primitive overlap; transformed query owner is not registered. Caller owns returned hits. */
    overlap(collider: Collider3D, object: Object3D, options?: PhysicsQueryOptions3D): PhysicsHit3D[];
    /** Closest world-distance ray hit. Inside starts report distance 0; normalized direction is not required. */
    raycast(origin: Readonly<Vector3>, direction: Readonly<Vector3>, maxDistance: number, options?: PhysicsQueryOptions3D): PhysicsHit3D | undefined;
    /** Translation-only conservative advancement against exact primitive distance. No AABB-expanded corner proxy. */
    sweepSphere(center: Readonly<Vector3>, radius: number, displacement: Readonly<Vector3>, options?: PhysicsQueryOptions3D, out?: PhysicsHit3D): PhysicsHit3D | undefined;
    sweepCapsule(object: Object3D, displacement: Readonly<Vector3>, options?: PhysicsQueryOptions3D, out?: PhysicsHit3D): PhysicsHit3D | undefined;
    /** @internal Bounded minimum-translation recovery from primitive overlaps; failure restores the original pose. */
    recoverCapsule(object: Object3D, limit: number, options: PhysicsQueryOptions3D): boolean;
    /** Exact shape translation query. Mesh/plane query shapes are static-only and rejected. */
    sweep(collider: Collider3D, object: Object3D, displacement: Readonly<Vector3>, options?: PhysicsQueryOptions3D, out?: PhysicsHit3D): PhysicsHit3D | undefined;
    private sweepShape;
    private sweepPair;
    destroy(): void;
}
