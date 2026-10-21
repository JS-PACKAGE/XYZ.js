import type { NavigationSearchStatus } from './jobs.js';
/** Sparse indexed heap: a query allocates only for visited partition nodes. */
export declare class PartitionSearch {
    readonly distance: Map<number, number>;
    readonly parent: Map<number, number>;
    private readonly slots;
    private readonly heap;
    /** Score of `heap[i]` at index `i`: sifting compares slots without map lookups. */
    private readonly scores;
    offer(node: number, distance: number, score: number, parent: number): void;
    take(): number | undefined;
}
/** Each invocation is one bounded primitive, including path reconstruction/smoothing. */
export declare class PartitionNavigationJob<Path> {
    private operation;
    private readonly current;
    private release;
    private readonly found;
    private state;
    private count;
    private value;
    constructor(operation: (() => Path | undefined) | undefined, current: () => boolean, release: (() => void) | undefined, found: (path: Path) => boolean);
    get status(): NavigationSearchStatus;
    get expansions(): number;
    get result(): Path | undefined;
    step(budget: number): NavigationSearchStatus;
    cancel(): void;
    invalidate(): void;
    private finish;
}
