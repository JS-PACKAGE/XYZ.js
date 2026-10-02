import type { NavigationSearchStatus } from './jobs.js';
export interface NavigationWork {
    readonly status: NavigationSearchStatus;
    readonly expansions: number;
    step(budget: number): unknown;
    cancel(): void;
}
export interface NavigationSearchOwner {
    readonly revision: number;
    readonly destroyed: boolean;
    readonly availableSearchSlots: number;
}
export interface NavigationSchedulerStats {
    work: number;
    expansions: number;
    bakeWork: number;
    queued: number;
    active: number;
    completed: number;
    cancelled: number;
    invalidated: number;
    totalWork: number;
}
export interface NavigationSchedulerOptions {
    readonly workBudget?: number;
}
export interface ScheduledNavigationFollower {
    update(deltaSeconds: number): void;
    stop(): void;
}
/** Admission is lazy: hundreds of NPCs do not allocate hundreds of A* workspaces. */
export declare class NavigationScheduledSearch<Path> implements NavigationWork {
    readonly owner: NavigationSearchOwner;
    private factory;
    private job;
    private terminal;
    private count;
    readonly revision: number;
    constructor(owner: NavigationSearchOwner, factory: (() => NavigationWork & {
        readonly result: Path | undefined;
    }) | undefined);
    get status(): NavigationSearchStatus;
    get result(): Path | undefined;
    get expansions(): number;
    get admitted(): boolean;
    /** @internal Scheduler alone admits queued work. */
    admit(): void;
    step(budget: number): void;
    cancel(): void;
}
/** Deterministic round-robin work and owner-fair admission under one Scene-wide cap. */
export declare class NavigationScheduler {
    readonly workBudget: number;
    private readonly queue;
    private readonly active;
    private readonly followers;
    private cursor;
    private readonly owners;
    private disposed;
    readonly stats: NavigationSchedulerStats;
    constructor(options?: NavigationSchedulerOptions);
    schedule<Path>(owner: NavigationSearchOwner, create: () => NavigationWork & {
        readonly result: Path | undefined;
    }): NavigationScheduledSearch<Path>;
    scheduleBake<T extends NavigationWork>(work: T): T;
    addFollower(follower: ScheduledNavigationFollower): void;
    removeFollower(follower: ScheduledNavigationFollower): void;
    updateFollowers(deltaSeconds: number): void;
    update(workBudget?: number): NavigationSchedulerStats;
    clear(): void;
    destroy(): void;
    private record;
    private checkBudget;
    private assertLive;
}
