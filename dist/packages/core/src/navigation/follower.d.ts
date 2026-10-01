import type { CharacterController3D } from '../physics3d/character.js';
import type { NavigationGraphPath3D } from './graph.js';
export type PathFollowerState3D = 'stopped' | 'following' | 'paused' | 'blocked' | 'finished' | 'destroyed';
export interface PathFollowerOptions3D {
    readonly speed?: number;
    readonly arrivalTolerance?: number;
}
/** Explicitly update from Scene.update. Borrows, never destroys, its physics character. */
export declare class PathFollower3D {
    private character;
    private waypoints;
    private nextWaypoint;
    private currentState;
    private currentSpeed;
    private readonly arrivalTolerance;
    private readonly displacement;
    constructor(controller: CharacterController3D, options?: PathFollowerOptions3D);
    get state(): PathFollowerState3D;
    get waypointIndex(): number;
    get speed(): number;
    set speed(value: number);
    /** Atomically takes an owned snapshot; the route includes its start waypoint. */
    setPath(path: NavigationGraphPath3D): void;
    pause(): void;
    /** Explicit resume also retries a blocked route after its obstacle changes. */
    resume(): void;
    stop(): void;
    update(deltaSeconds: number): void;
    destroy(): void;
    private assertLive;
}
