import { Vector2 } from '../../../math/src/index.js';
import type { GameObject } from '../game-object.js';
export type ColliderKind = 'circle' | 'polygon';
export interface ColliderOptions {
    offset?: [number, number];
}
export declare function finite(value: number, name: string): number;
export declare function positive(value: number, name: string): number;
export declare function nonnegativeFinite(value: number, name: string): number;
export declare function unsigned(value: number, name: string): number;
/** Reusable local geometry. Bodies and scene membership belong to the owner, not the shape. */
export declare class Collider2D {
    readonly kind: ColliderKind;
    readonly radius: number;
    readonly offset: Readonly<Vector2>;
    readonly vertices: readonly (readonly [number, number])[];
    sensor: boolean;
    private categoryBits;
    private maskBits;
    /**
     * @internal `[category, mask]` as int32 for the pair filters, whose bit tests are unchanged
     * by it: an element load stays inline, while a getter call V8 does not inline returns these
     * (mostly above the small-integer range) as freshly boxed numbers.
     */
    readonly filterBits: Int32Array<ArrayBuffer>;
    private queryGeometry;
    /** Prefer Colliders factories; construction validates and snapshots geometry. */
    constructor(kind: ColliderKind, radius: number, vertices: readonly (readonly [number, number])[], options?: ColliderOptions);
    get category(): number;
    set category(value: number);
    get mask(): number;
    set mask(value: number);
    containsPoint(point: Vector2, owner: GameObject): boolean;
}
export declare const Colliders: Readonly<{
    circle(radius: number, options?: ColliderOptions): Collider2D;
    box(width: number, height: number, options?: ColliderOptions): Collider2D;
    polygon(vertices: readonly [number, number][], options?: ColliderOptions): Collider2D;
}>;
/**
 * Polygon `Collider2D` from the convex hull of 3-256 input points (Andrew's
 * monotone chain). Exposed top-level so the 1.x `Colliders` surface stays
 * structurally additive; duplicate points collapse before the sweep.
 */
export declare function convexHull(points: readonly (readonly [number, number])[], options?: ColliderOptions): Collider2D;
/** Reused world geometry and AABB. Polygon winding stays counterclockwise after reflection. */
export declare class ShapeGeometry {
    readonly collider: Collider2D;
    readonly points: Float64Array;
    x: number;
    y: number;
    radius: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    inertiaPerMass: number;
    area: number;
    /** @internal Changes only after a successful world-geometry refresh. */
    revision: number;
    private readonly matrixSnapshot;
    private edges;
    private edgesRevision;
    /** @internal Valid after `rayAmplification`; see there. */
    rayEdgeTolerance: number;
    private rayBound;
    private rayBoundRevision;
    /** Transform inputs `refresh` last composed the pose from; NaN when unknown. */
    private readonly poseInputs;
    /**
     * A child's parent world matrix (indices 0, 1, 3, 4, 6, 7) then its transform inputs, as
     * `poseInputs` is for a root. Each form invalidates the other when it refreshes.
     */
    private readonly childInputs;
    constructor(collider: Collider2D);
    /**
     * @internal Per polygon edge `i -> i + 1`: unit normal `(ey, -ex) / |e|` and length `|e|`
     * (`hypot2(ex, ey)`), three floats each, computed on first use after each world-geometry
     * refresh. Code that writes `points` otherwise must call `invalidateEdges`.
     */
    edgeData(): Float64Array;
    /** @internal For writers of `points` outside `refresh` (motion samples). */
    invalidateEdges(): void;
    /**
     * @internal Bounds how far outside the AABB `rayDistance` can report a hit, contained
     * origins included. Every such point lies within some tolerance `e` of the two edge lines
     * beside each extreme vertex (`a·(p − v) ≤ e`), so it lies at most `e` times the returned
     * factor past that vertex along the axis: the summed nonnegative weights expressing the
     * axis direction in those two edge normals. Infinity where that decomposition fails.
     * `rayEdgeTolerance` is `contains`'s own tolerance as a distance: EPSILON over the shortest
     * edge. Circles return 1 (and 0), and are computed once per world-geometry refresh.
     */
    rayAmplification(): number;
    refresh(owner: GameObject): void;
    private childUnchanged;
    private recordChild;
    private refreshPose;
    contains(x: number, y: number): boolean;
}
