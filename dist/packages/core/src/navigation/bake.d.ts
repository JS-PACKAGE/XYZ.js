import { Vector2, Vector3 } from '../../../math/src/index.js';
import type { PhysicsWorld2D } from '../physics2d/world.js';
import type { PhysicsQueryOptions3D, PhysicsWorld3D } from '../physics3d/world.js';
import { NavigationGrid2D, type NavigationCell2D } from './grid.js';
import { NavigationGraph3D } from './graph.js';
import type { NavigationSearchStatus } from './jobs.js';
export interface NavigationLatticeOptions {
    readonly columns: number;
    readonly rows: number;
    readonly cellSize: number;
    /** Rotation in radians: XY in 2D, around world Y in 3D. */
    readonly rotation?: number;
}
export interface NavigationGridBakeOptions2D extends NavigationLatticeOptions {
    readonly origin?: Readonly<Vector2>;
    readonly agentRadius?: number;
    readonly mask?: number;
    readonly target?: NavigationGrid2D;
    /** Revision of authored tile occupancy or other external geometry inputs. */
    readonly geometryRevision?: () => number;
    /** Optional authored tile occupancy, combined with exact physics collision. */
    readonly blockedCell?: (column: number, row: number) => boolean;
}
export interface NavigationSurfaceBakeOptions3D extends NavigationLatticeOptions {
    /** XZ lattice origin; Y is ignored. Bounds are sampling bounds, never inferred walkable geometry. */
    readonly origin?: Readonly<Vector3>;
    readonly minY: number;
    readonly maxY: number;
    readonly agentRadius: number;
    /** Total capsule height, including both hemispheres. */
    readonly agentHeight: number;
    readonly maxSlopeAngle?: number;
    readonly stepHeight?: number;
    readonly query?: PhysicsQueryOptions3D;
    readonly target?: NavigationGraph3D;
    /** Additional authored geometry revision, alongside the physics world revision. */
    readonly geometryRevision?: () => number;
}
/** Mapping uses cell centers and snapshots its transform; caller owns the returned vector. */
export declare class NavigationLatticeMapping {
    readonly originX: number;
    readonly originZ: number;
    readonly columns: number;
    readonly rows: number;
    readonly cellSize: number;
    private readonly cosine;
    private readonly sine;
    constructor(options: NavigationLatticeOptions, originX?: number, originZ?: number);
    cellToWorld(column: number, row: number, out?: Vector2): Vector2;
    worldToCell(x: number, z: number): NavigationCell2D | undefined;
    nodeId(column: number, row: number): string;
}
/** One exact inflated-cell collision query per work unit; publication is atomic. */
export declare class NavigationGridBakeJob2D {
    private readonly world;
    private readonly options;
    readonly mapping: NavigationLatticeMapping;
    private state;
    private count;
    private cursor;
    private readonly edits;
    private readonly probe;
    private readonly shape;
    private readonly radius;
    private readonly revision;
    private readonly worldRevision;
    private readonly sourceRevision;
    private value;
    constructor(world: PhysicsWorld2D, options: NavigationGridBakeOptions2D);
    get status(): NavigationSearchStatus;
    get expansions(): number;
    get result(): NavigationGrid2D | undefined;
    step(budget: number): NavigationSearchStatus;
    cancel(): void;
}
/** Finite single-layer sampled surface graph, not a polygon navmesh. Each work unit is one public physics query. */
export declare class NavigationSurfaceBakeJob3D {
    private readonly world;
    private readonly options;
    readonly mapping: NavigationLatticeMapping;
    private state;
    private count;
    private cursor;
    private phase;
    private edgeCursor;
    private edgePhase;
    private readonly nodes;
    private readonly connections;
    private readonly probe;
    private readonly shape;
    private readonly point;
    private readonly ray;
    private readonly down;
    private readonly motion;
    private readonly slope;
    private readonly stepHeight;
    private readonly offset;
    private readonly query;
    private readonly revision;
    private readonly worldRevision;
    private readonly sourceRevision;
    private value;
    constructor(world: PhysicsWorld3D, options: NavigationSurfaceBakeOptions3D);
    get status(): NavigationSearchStatus;
    get expansions(): number;
    get result(): NavigationGraph3D | undefined;
    step(budget: number): NavigationSearchStatus;
    cancel(): void;
    private release;
}
