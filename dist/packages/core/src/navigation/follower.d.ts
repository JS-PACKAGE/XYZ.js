import { Vector3 } from '../../../math/src/math3d.js';
import type { CharacterController3D } from '../physics3d/character.js';
import { NavigationGraph3D } from './graph.js';
import type { NavigationGraphPath3D } from './graph.js';
import { NavigationScheduler, type NavigationScheduledSearch } from './scheduler.js';
export type PathFollowerState3D = 'stopped' | 'following' | 'searching' | 'unreachable' | 'paused' | 'blocked' | 'finished' | 'destroyed';
export interface PathFollowerOptions3D {
    readonly speed?: number;
    readonly arrivalTolerance?: number;
}
/** Explicitly update from Scene.update. Borrows, never destroys, its physics character. */
export declare class PathFollower3D {
    protected character: CharacterController3D | undefined;
    protected waypoints: readonly Readonly<Vector3>[];
    protected nextWaypoint: number;
    protected currentState: PathFollowerState3D;
    private currentSpeed;
    private readonly arrivalTolerance;
    private readonly displacement;
    constructor(controller: CharacterController3D, options?: PathFollowerOptions3D);
    get state(): PathFollowerState3D;
    get waypointIndex(): number;
    get speed(): number;
    set speed(value: number);
    /** Atomically takes an owned snapshot; the route includes its start waypoint. */
    setPath(path: Pick<NavigationGraphPath3D, 'status' | 'nodes' | 'cost'>): void;
    pause(): void;
    /** Explicit resume also retries a blocked route after its obstacle changes. */
    resume(): void;
    stop(): void;
    update(deltaSeconds: number): void;
    destroy(): void;
    protected assertLive(): void;
}
export interface NavigationFollowerOptions3D extends PathFollowerOptions3D {
    /** Standalone scheduler work budget; Scene-bound searches use the Scene aggregate budget. */
    readonly expansionBudget?: number;
    /** Total replans per navigate call, including revision invalidations. */
    readonly maxReplans?: number;
    /** Searches share the Scene scheduler by default; movement remains explicitly updated. */
    readonly scheduler?: NavigationScheduler;
}
export interface NavigationRoute3D {
    readonly graph: NavigationGraph3D;
    /** Explicit authored anchor; the character must be able to return to it. */
    readonly start: string;
    readonly goal: string;
    readonly agentRadius: number;
}
/** Borrowed graph/controller; bounded jobs are owned and cancelled with this follower. */
export declare class NavigationFollower3D extends PathFollower3D {
    private route;
    private path;
    private job;
    private anchor;
    private readonly excluded;
    private observedRevision;
    private retries;
    private physicallyBlocked;
    private pausedState;
    readonly expansionBudget: number;
    readonly maxReplans: number;
    readonly scheduler: NavigationScheduler;
    private readonly ownsScheduler;
    constructor(controller: CharacterController3D, options?: NavigationFollowerOptions3D);
    get replanCount(): number;
    get searchJob(): NavigationScheduledSearch<NavigationGraphPath3D> | undefined;
    /** Starts an incremental query, never computes a complete route synchronously. */
    navigate(route: NavigationRoute3D): void;
    setPath(path: Pick<NavigationGraphPath3D, 'status' | 'nodes' | 'cost'>): void;
    pause(): void;
    resume(): void;
    stop(): void;
    update(deltaSeconds: number): void;
    destroy(): void;
    private beginReplan;
    private clearNavigation;
}
