export interface NavigationCell2D {
    readonly column: number;
    readonly row: number;
}
export interface NavigationCellState2D {
    readonly walkable: boolean;
    /** Positive traversal multiplier, charged on entering this cell. */
    readonly cost: number;
}
export interface NavigationCellEdit2D extends NavigationCell2D {
    readonly walkable?: boolean;
    readonly cost?: number;
}
export interface NavigationGridOptions2D {
    readonly columns: number;
    readonly rows: number;
}
export interface NavigationGridSearchOptions2D {
    readonly diagonal?: boolean;
    /** When false, both orthogonal neighbors must be walkable for a diagonal. */
    readonly cornerCutting?: boolean;
}
export interface NavigationGridPath2D {
    readonly status: 'found' | 'unreachable';
    readonly cells: readonly NavigationCell2D[];
    readonly cost: number;
    readonly revision: number;
}
/** Finite cell-space weighted A*. Independent of TileMap visuals and collision geometry. */
export declare class NavigationGrid2D {
    readonly columns: number;
    readonly rows: number;
    private readonly walkable;
    private readonly costs;
    private readonly search;
    private readonly paths;
    private minimumCost;
    private currentRevision;
    constructor(options: NavigationGridOptions2D);
    get revision(): number;
    getCell(column: number, row: number): NavigationCellState2D;
    setCell(column: number, row: number, state: Partial<NavigationCellState2D>): void;
    /** All edits preflight before publication; repeated coordinates apply in order. */
    setCells(edits: readonly NavigationCellEdit2D[]): void;
    /** A snapshot remains immutable but is stale after any effective cell edit. */
    isPathCurrent(path: NavigationGridPath2D): boolean;
    findPath(start: NavigationCell2D, goal: NavigationCell2D, options?: NavigationGridSearchOptions2D): NavigationGridPath2D;
    private index;
    private heuristic;
    private result;
}
