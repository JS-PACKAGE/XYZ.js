import { NavigationSearch } from './search.js';
export type NavigationSearchStatus = 'pending' | 'found' | 'unreachable' | 'cancelled' | 'invalidated';
/** A revision-bound search. Each step consumes at most the supplied node expansions. */
export declare class NavigationSearchJob<Path> {
    private release;
    private workspace;
    private plan;
    private currentStatus;
    private currentResult;
    private expanded;
    /** @internal Use a grid or graph's createSearch. */
    constructor(workspace: NavigationSearch, plan: SearchPlan<Path>, release: ((job: NavigationSearchJob<Path>, workspace: NavigationSearch) => void) | undefined);
    get status(): NavigationSearchStatus;
    get result(): Path | undefined;
    get expansions(): number;
    step(expansionBudget: number): NavigationSearchStatus;
    cancel(): void;
    /** @internal Edits invalidate rather than mixing revisions in one result. */
    invalidate(): void;
    private finish;
}
/** @internal One plan powers both synchronous and budgeted searches. */
export interface SearchPlan<Path> {
    readonly from: number;
    readonly to: number;
    estimate(node: number): number;
    expand(node: number, search: NavigationSearch): void;
    result(found: boolean, search: NavigationSearch): Path;
}
/** @internal Bounded reusable workspaces; terminal jobs retain only their immutable result. */
export declare class NavigationSearchPool<Path> {
    private readonly capacity;
    private readonly free;
    private readonly active;
    private disposed;
    constructor(capacity: number);
    get availableSlots(): number;
    create(plan: SearchPlan<Path>): NavigationSearchJob<Path>;
    invalidate(): void;
    destroy(): void;
}
