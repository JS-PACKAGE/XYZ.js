import { Vector3 } from '../../../math/src/math3d.js';
import type { CharacterController3D } from '../physics3d/character.js';
import type { CharacterController2D } from '../physics2d/character.js';
import type { PathFollower3D } from './follower.js';
export interface CrowdOptions {
    maxAgents?: number;
    maxObstacles?: number;
    maxNeighbors?: number;
    neighborDistance?: number;
    timeHorizon?: number;
}
export interface CrowdAgentOptions {
    /** Explicit stable positive integer; registration order does not affect solve order. */
    id: number;
    radius: number;
    maxSpeed: number;
    follower?: PathFollower3D;
    /** Write desired velocity into out. 2D maps world XY onto solver XZ. */
    preferredVelocity?: (deltaSeconds: number, out: Vector3) => void;
}
export type CrowdAgentState = 'moving' | 'idle' | 'blocked' | 'budget-exceeded' | 'removed';
export interface CrowdRegistration {
    readonly id: number;
    readonly velocity: Readonly<Vector3>;
    readonly state: CrowdAgentState;
    remove(): void;
}
/** Bounded disc ORCA on a plane, with exact nearest feasible half-plane/speed-disc solve.
 * No pathfinding or animation ownership. Call once from Scene.fixedUpdate(dt, scene.fixedFrame).
 * Borrowed controllers remain owned by caller. Never also update registered followers/locomotion.
 * Crowded cells fail closed rather than silently discarding nearby agents. Physical geometry
 * remains authoritative via controller sweeps; obstacle discs are explicit conservative proxies.
 */
export declare class CrowdSolver {
    readonly maxAgents: number;
    readonly maxObstacles: number;
    readonly maxNeighbors: number;
    readonly neighborDistance: number;
    readonly timeHorizon: number;
    private readonly agents;
    private readonly obstacles;
    private readonly ordered;
    private readonly grid;
    private readonly buckets;
    private readonly neighbors;
    private readonly lines;
    private readonly displacement;
    private readonly displacement2D;
    private readonly movementOptions;
    private epoch;
    private disposed;
    private updating;
    private readonly candidateScratch;
    constructor(options?: CrowdOptions);
    register3D(controller: CharacterController3D, options: CrowdAgentOptions): CrowdRegistration;
    /** Top-down XY adapter only, not a platformer/navmesh equivalence. Radius must enclose collider. */
    register2D(controller: CharacterController2D, options: CrowdAgentOptions): CrowdRegistration;
    private register;
    addObstacle(id: number, center: Readonly<Vector3>, radius: number): () => void;
    update(deltaSeconds: number, epoch: number): void;
    private insertDisc;
    private solve;
    private candidate;
    destroy(): void;
}
