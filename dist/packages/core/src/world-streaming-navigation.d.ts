import { NavigationGraph3D, type NavigationGraphOptions3D, type NavigationGraphPath3D } from './navigation/graph.js';
export interface WorldStreamingPortal3D {
    /** Exactly two live cells may share a seam. Unmatched portals do not create edges. */
    readonly seam: string;
    readonly node: string;
    readonly clearance: number;
}
/** World-space authored geometry. Node IDs are local to a cell. */
export interface WorldStreamingNavigationFragment3D extends NavigationGraphOptions3D {
    readonly portals?: readonly WorldStreamingPortal3D[];
}
/** Owns the current streamed graph; every topology change invalidates all old paths and jobs. */
export declare class WorldStreamingNavigation3D {
    private current;
    private generation;
    private disposed;
    get graph(): NavigationGraph3D | undefined;
    get revision(): number;
    nodeId(cell: string, node: string): string;
    isPathCurrent(path: NavigationGraphPath3D): boolean;
    /** Validate/build off-scene. The controller commits only after collider registration succeeds. */
    prepare(fragments: ReadonlyMap<string, WorldStreamingNavigationFragment3D>): NavigationGraph3D | undefined;
    /** @internal Infallible commit, called at Scene's atomic membership boundary. */
    commit(candidate: NavigationGraph3D | undefined): void;
    destroy(): void;
}
