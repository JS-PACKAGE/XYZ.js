/** Indexed best-first frontier. Equal scores use stable node order, never insertion timing. */
export declare class NavigationSearch {
    readonly distance: Float64Array;
    readonly parent: Int32Array;
    private readonly score;
    private readonly heap;
    private readonly slot;
    private size;
    constructor(capacity: number);
    reset(): void;
    offer(node: number, distance: number, score: number, parent: number): void;
    take(): number;
    private before;
}
