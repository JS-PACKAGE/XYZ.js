import { Vector3 } from '../../../math/src/index.js';
/** @internal Conservative bounds; infinite planes remain valid leaves. */
export declare class Bounds3D {
    readonly min: Vector3;
    readonly max: Vector3;
    reset(): void;
    add(p: Readonly<Vector3>): void;
    union(a: Bounds3D, b: Bounds3D): void;
    swept(a: Bounds3D, d: Readonly<Vector3>, margin?: number): void;
    overlaps(b: Bounds3D, margin?: number): boolean;
}
export interface SpatialItem3D {
    readonly bounds: Bounds3D;
    readonly order: number;
}
/** @internal Deterministic balanced AABB hierarchy. Refit supports directly mutable transforms; queries reuse caller buffers. */
export declare class SpatialIndex3D<T extends SpatialItem3D> {
    private root;
    private readonly nodes;
    private readonly leaves;
    private readonly stack;
    private readonly leafNodes;
    private used;
    rebuild(items: readonly T[]): void;
    private build;
    refit(): void;
    update(item: T): void;
    query(bounds: Bounds3D, out: T[], margin?: number): void;
    clear(): void;
}
