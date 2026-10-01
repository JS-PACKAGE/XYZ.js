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
}
export interface NavigationGraphOptions3D {
    readonly nodes: readonly NavigationNode3D[];
    readonly connections: readonly NavigationConnection3D[];
}
export interface NavigationGraphPath3D {
    readonly status: 'found' | 'unreachable';
    readonly nodes: readonly NavigationNode3D[];
    readonly cost: number;
}
/** Owned immutable waypoint graph, not a navmesh. Explicit edges describe traversable routes. */
export declare class NavigationGraph3D {
    readonly nodes: readonly NavigationNode3D[];
    readonly connections: readonly NavigationConnection3D[];
    private readonly indices;
    private readonly edges;
    private readonly searches;
    private readonly heuristicScale;
    constructor(options: NavigationGraphOptions3D);
    getNode(id: string): NavigationNode3D;
    findPath(start: string, goal: string): NavigationGraphPath3D;
    createSearch(start: string, goal: string): NavigationSearchJob<NavigationGraphPath3D>;
    destroy(): void;
    private heuristic;
}
