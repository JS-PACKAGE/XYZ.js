import { Vector3 } from '../../../math/src/math3d.js';
import { NavigationSearchJob } from './jobs.js';
import { NavigationScheduler, type NavigationScheduledSearch } from './scheduler.js';
export interface NavigationNode3D {
    readonly id: string;
    readonly position: Readonly<Vector3>;
    readonly walkable?: boolean;
    /** Maximum certified radius; omitted on authored nodes means unconstrained. */
    readonly clearance?: number;
    /** Baked support height. Surface followers let the capsule controller climb steps rather than fly. */
    readonly surfaceY?: number;
}
export interface NavigationConnection3D {
    readonly from: string;
    readonly to: string;
    /** Nonnegative finite total edge cost, independent of geometric distance. */
    readonly cost: number;
    /** False (default) installs both directions. */
    readonly directed?: boolean;
    readonly enabled?: boolean;
    /** Authored maximum agent radius in world units; omitted means unconstrained. */
    readonly clearance?: number;
    /** Special links require an explicit follower traversal handler, never straight-line movement. */
    readonly kind?: 'walk' | 'special';
    readonly linkId?: string;
}
export interface NavigationGraphOptions3D {
    readonly nodes: readonly NavigationNode3D[];
    readonly connections: readonly NavigationConnection3D[];
}
export interface NavigationGraphSearchOptions3D {
    readonly agentRadius?: number;
    /** Local exclusions, e.g. connections a character found physically blocked. */
    readonly excludedConnections?: readonly number[];
}
export interface NavigationConnectionEdit3D {
    readonly index: number;
    readonly enabled?: boolean;
    readonly clearance?: number;
}
export interface NavigationGraphPath3D {
    readonly status: 'found' | 'unreachable';
    readonly nodes: readonly NavigationNode3D[];
    readonly cost: number;
    readonly revision: number;
}
export interface NavigationProjectionOptions3D {
    readonly maxDistance: number;
    /** Prevents selecting a bridge deck when projecting a character underneath it. */
    readonly maxVerticalDistance: number;
    readonly agentRadius?: number;
}
export interface NavigationProjection3D {
    readonly node: NavigationNode3D;
    readonly distance: number;
    readonly revision: number;
}
/** Authored waypoint graph with revisioned connection state, not an automatic navmesh. */
export declare class NavigationGraph3D {
    private currentNodes;
    private currentConnections;
    private indices;
    private edges;
    private readonly searches;
    private heuristicScale;
    private currentRevision;
    private disposed;
    private readonly paths;
    constructor(options: NavigationGraphOptions3D);
    get connections(): readonly NavigationConnection3D[];
    get nodes(): readonly NavigationNode3D[];
    get availableSearchSlots(): number;
    /** Atomic sampled-surface rebake; stable IDs keep live followers' route anchors valid. */
    replaceGeometry(options: NavigationGraphOptions3D): void;
    scheduleSearch(scheduler: NavigationScheduler, start: string, goal: string, options?: NavigationGraphSearchOptions3D): NavigationScheduledSearch<NavigationGraphPath3D>;
    get revision(): number;
    get destroyed(): boolean;
    isPathCurrent(path: NavigationGraphPath3D): boolean;
    getConnectionIndex(from: string, to: string): number | undefined;
    setConnection(index: number, state: Omit<NavigationConnectionEdit3D, 'index'>): void;
    /** Atomic edits. Undirected connection state affects both directions. */
    setConnections(edits: readonly NavigationConnectionEdit3D[]): void;
    getNode(id: string): NavigationNode3D;
    /** Bounded nearest certified node, not arbitrary navmesh/geometry projection. */
    project(position: Readonly<Vector3>, options: NavigationProjectionOptions3D): NavigationProjection3D | undefined;
    findPath(start: string, goal: string, options?: NavigationGraphSearchOptions3D): NavigationGraphPath3D;
    createSearch(start: string, goal: string, options?: NavigationGraphSearchOptions3D): NavigationSearchJob<NavigationGraphPath3D>;
    destroy(): void;
    private heuristic;
}
