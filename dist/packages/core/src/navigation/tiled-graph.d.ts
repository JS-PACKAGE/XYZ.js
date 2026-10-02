import { Vector3 } from '../../../math/src/math3d.js';
import { type NavigationGraphOptions3D, type NavigationGraphPath3D, type NavigationGraphSearchOptions3D, type NavigationConnection3D, type NavigationConnectionEdit3D, type NavigationNode3D, type NavigationProjection3D, type NavigationProjectionOptions3D } from './graph.js';
import { PartitionNavigationJob } from './partition-search.js';
import { NavigationScheduler, type NavigationScheduledSearch } from './scheduler.js';
export interface NavigationGraphTile3D {
    readonly id: string;
    /** Existing authored or collision-baked lattice graph, snapshotted at construction. */
    readonly geometry: NavigationGraphOptions3D;
}
export interface NavigationTiledGraphOptions3D {
    readonly tiles: readonly NavigationGraphTile3D[];
    /** Endpoints use nodeId(tileId, localId); seams are explicit certified connections. */
    readonly seams: readonly NavigationConnection3D[];
    readonly tileSize?: number;
}
/** Partitioned sampled/authored world. Keeps per-tile validation limits and old graph semantics,
 * but local projection and sparse search never initialize a world-sized A* workspace.
 */
export declare class NavigationTiledGraph3D {
    readonly nodes: readonly NavigationNode3D[];
    private currentConnections;
    private readonly ids;
    private readonly spatial;
    private readonly edges;
    private readonly jobs;
    private readonly paths;
    private epoch;
    private disposed;
    readonly tileSize: number;
    /** Length-prefixing preserves arbitrary existing local IDs without separator collisions. */
    static nodeId(tile: string, local: string): string;
    constructor(options: NavigationTiledGraphOptions3D);
    get connections(): readonly NavigationConnection3D[];
    get revision(): number;
    get destroyed(): boolean;
    get availableSearchSlots(): number;
    isPathCurrent(path: NavigationGraphPath3D): boolean;
    getNode(id: string): NavigationNode3D;
    getConnectionIndex(from: string, to: string): number | undefined;
    setConnection(index: number, state: Omit<NavigationConnectionEdit3D, 'index'>): void;
    setConnections(edits: readonly NavigationConnectionEdit3D[]): void;
    project(position: Readonly<Vector3>, options: NavigationProjectionOptions3D): NavigationProjection3D | undefined;
    scheduleSearch(scheduler: NavigationScheduler, start: string, goal: string, options?: NavigationGraphSearchOptions3D): NavigationScheduledSearch<NavigationGraphPath3D>;
    findPath(start: string, goal: string, options?: NavigationGraphSearchOptions3D): NavigationGraphPath3D;
    createSearch(start: string, goal: string, options?: NavigationGraphSearchOptions3D): PartitionNavigationJob<NavigationGraphPath3D>;
    destroy(): void;
    private validate;
}
