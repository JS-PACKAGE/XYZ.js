import { Vector3 } from '../../../math/src/math3d.js';
import type { NavigationProjectionOptions3D } from './graph.js';
import { PartitionNavigationJob } from './partition-search.js';
import { NavigationScheduler, type NavigationScheduledSearch } from './scheduler.js';
export interface NavigationPolygon3D {
    readonly id: string;
    /** Ordered convex coplanar vertices. Clockwise or counterclockwise XZ winding. */
    readonly vertices: readonly Readonly<Vector3>[];
    /** Certified free headroom; geometry above the surface is supplied by the author/baker. */
    readonly clearanceHeight: number;
}
export interface NavigationMeshLink3D {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly start: Readonly<Vector3>;
    readonly end: Readonly<Vector3>;
    readonly directed?: boolean;
    readonly clearance: number;
}
export interface NavigationMeshOptions3D {
    readonly polygons: readonly NavigationPolygon3D[];
    readonly links?: readonly NavigationMeshLink3D[];
    readonly tileSize?: number;
}
export interface NavigationMeshSearchOptions3D extends NavigationProjectionOptions3D {
    readonly agentHeight: number;
}
export interface NavigationMeshProjection3D {
    readonly polygon: NavigationPolygon3D;
    readonly position: Readonly<Vector3>;
    readonly distance: number;
    readonly revision: number;
    /** Actual polygon candidates examined, not the total world size. */
    readonly candidates: number;
}
export interface NavigationMeshWaypoint3D {
    readonly position: Readonly<Vector3>;
    /** The transition ending here requires a handler; never move straight through it. */
    readonly link?: NavigationMeshLink3D;
}
export interface NavigationMeshPath3D {
    readonly status: 'found' | 'unreachable';
    readonly polygons: readonly NavigationPolygon3D[];
    readonly waypoints: readonly NavigationMeshWaypoint3D[];
    readonly cost: number;
    readonly revision: number;
    readonly visited: number;
}
/** A true convex polygon surface mesh. Exact shared 3D edges join tiles, never overlapping XZ floors.
 * Queries use a spatial tile index and sparse workspaces; smoothing is clearance-certified in the
 * selected polygon corridor. Noncoplanar seams retain surface waypoints rather than cutting in air.
 */
export declare class NavigationMesh3D {
    readonly polygons: readonly NavigationPolygon3D[];
    readonly tileSize: number;
    private readonly geometry;
    private readonly ids;
    private readonly tiles;
    private readonly vertexTopology;
    private readonly jobs;
    private readonly paths;
    private epoch;
    private disposed;
    private readonly disabled;
    private readonly linkIds;
    private readonly disabledLinks;
    constructor(options: NavigationMeshOptions3D);
    get revision(): number;
    get destroyed(): boolean;
    get availableSearchSlots(): number;
    isPathCurrent(path: NavigationMeshPath3D): boolean;
    /** Polygon topology is immutable; enabled edits atomically invalidate all pending work. */
    setPolygonEnabled(id: string, enabled: boolean): void;
    setLinkEnabled(id: string, enabled: boolean): void;
    project(position: Readonly<Vector3>, options: NavigationMeshSearchOptions3D): NavigationMeshProjection3D | undefined;
    scheduleSearch(scheduler: NavigationScheduler, start: Readonly<Vector3>, goal: Readonly<Vector3>, options: NavigationMeshSearchOptions3D): NavigationScheduledSearch<NavigationMeshPath3D>;
    findPath(start: Readonly<Vector3>, goal: Readonly<Vector3>, options: NavigationMeshSearchOptions3D): NavigationMeshPath3D;
    createSearch(start: Readonly<Vector3>, goal: Readonly<Vector3>, options: NavigationMeshSearchOptions3D): PartitionNavigationJob<NavigationMeshPath3D>;
    destroy(): void;
    private assertLive;
    private validateQuery;
    private candidates;
    private region;
    private portal;
}
