import { Vector3 } from '../../../math/src/math3d.js';
import { NavigationSearchJob } from './jobs.js';
export interface NavigationNode3D {
    readonly id: string;
    readonly position: Readonly<Vector3>;
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
/** Authored waypoint graph with revisioned connection state, not an automatic navmesh. */
export declare class NavigationGraph3D {
    readonly nodes: readonly NavigationNode3D[];
    private currentConnections;
    private readonly indices;
    private readonly edges;
    private readonly searches;
    private readonly heuristicScale;
    private currentRevision;
    private disposed;
    private readonly paths;
    constructor(options: NavigationGraphOptions3D);
    get connections(): readonly NavigationConnection3D[];
    get revision(): number;
    get destroyed(): boolean;
    isPathCurrent(path: NavigationGraphPath3D): boolean;
    getConnectionIndex(from: string, to: string): number | undefined;
    setConnection(index: number, state: Omit<NavigationConnectionEdit3D, 'index'>): void;
    /** Atomic edits. Undirected connection state affects both directions. */
    setConnections(edits: readonly NavigationConnectionEdit3D[]): void;
    getNode(id: string): NavigationNode3D;
    findPath(start: string, goal: string, options?: NavigationGraphSearchOptions3D): NavigationGraphPath3D;
    createSearch(start: string, goal: string, options?: NavigationGraphSearchOptions3D): NavigationSearchJob<NavigationGraphPath3D>;
    destroy(): void;
    private heuristic;
}
