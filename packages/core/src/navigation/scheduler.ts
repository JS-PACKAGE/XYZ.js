import { navigationLimits } from '../../../../src/data/navigation.js';
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
export class NavigationScheduledSearch<Path> implements NavigationWork {
  private job:
    (NavigationWork & { readonly result: Path | undefined }) | undefined;
  private terminal: NavigationSearchStatus | undefined;
  private count = 0;
  readonly revision: number;
  constructor(
    readonly owner: NavigationSearchOwner,
    private factory:
      | (() => NavigationWork & { readonly result: Path | undefined })
      | undefined,
  ) {
    this.revision = owner.revision;
  }
  get status(): NavigationSearchStatus {
    const pending =
      !this.terminal && (!this.job || this.job.status === 'pending');
    if (pending && this.owner.revision !== this.revision) {
      this.count = this.expansions;
      this.job?.cancel();
      this.job = undefined;
      this.factory = undefined;
      this.terminal = 'invalidated';
    } else if (pending && this.owner.destroyed) {
      this.count = this.expansions;
      this.job?.cancel();
      this.factory = undefined;
      this.terminal = 'cancelled';
    }
    return this.terminal ?? this.job?.status ?? 'pending';
  }
  get result(): Path | undefined {
    return this.job?.result;
  }
  get expansions(): number {
    return this.job?.expansions ?? this.count;
  }
  get admitted(): boolean {
    return this.job !== undefined;
  }
  /** @internal Scheduler alone admits queued work. */
  admit(): void {
    if (this.status === 'pending' && !this.job) {
      this.job = this.factory!();
      this.factory = undefined;
    }
  }
  step(budget: number): void {
    this.job?.step(budget);
  }
  cancel(): void {
    if (this.status !== 'pending') return;
    this.count = this.expansions;
    this.job?.cancel();
    this.factory = undefined;
    this.terminal = 'cancelled';
  }
}
interface Entry {
  work: NavigationWork;
  kind: 'search' | 'bake';
  owner: NavigationSearchOwner | undefined;
}

/** Deterministic round-robin work and owner-fair admission under one Scene-wide cap. */
export class NavigationScheduler {
  readonly workBudget: number;
  private readonly queue: Entry[] = [];
  private readonly active: Entry[] = [];
  private readonly followers = new Set<ScheduledNavigationFollower>();
  private cursor = 0;
  private readonly owners: (NavigationSearchOwner | undefined)[] = [];
  private disposed = false;
  readonly stats: NavigationSchedulerStats = {
    work: 0,
    expansions: 0,
    bakeWork: 0,
    queued: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    invalidated: 0,
    totalWork: 0,
  };
  constructor(options: NavigationSchedulerOptions = {}) {
    this.workBudget = options.workBudget ?? navigationLimits.sceneWork;
    this.checkBudget(this.workBudget);
  }
  schedule<Path>(
    owner: NavigationSearchOwner,
    create: () => NavigationWork & { readonly result: Path | undefined },
  ): NavigationScheduledSearch<Path> {
    this.assertLive();
    if (
      this.queue.length + this.active.length >=
      navigationLimits.scheduledWork
    )
      throw new RangeError('Navigation scheduled work limit exceeded.');
    const work = new NavigationScheduledSearch(owner, create);
    this.queue.push({ work, kind: 'search', owner });
    if (!this.owners.includes(owner)) this.owners.push(owner);
    return work;
  }
  scheduleBake<T extends NavigationWork>(work: T): T {
    this.assertLive();
    if (
      this.queue.length + this.active.length >=
      navigationLimits.scheduledWork
    )
      throw new RangeError('Navigation scheduled work limit exceeded.');
    this.queue.push({ work, kind: 'bake', owner: undefined });
    if (!this.owners.includes(undefined)) this.owners.push(undefined);
    return work;
  }
  addFollower(follower: ScheduledNavigationFollower): void {
    this.assertLive();
    this.followers.add(follower);
  }
  removeFollower(follower: ScheduledNavigationFollower): void {
    this.followers.delete(follower);
  }
  updateFollowers(deltaSeconds: number): void {
    this.assertLive();
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
      throw new RangeError('Navigation delta must be finite and nonnegative.');
    for (const follower of this.followers) follower.update(deltaSeconds);
  }
  update(workBudget = this.workBudget): NavigationSchedulerStats {
    this.assertLive();
    this.checkBudget(workBudget);
    const stats = this.stats;
    stats.work =
      stats.expansions =
      stats.bakeWork =
      stats.completed =
      stats.cancelled =
      stats.invalidated =
        0;
    // Charge admission as work too: no frame may reset an unbounded number of large arrays.
    while (stats.work < workBudget) {
      if (
        this.active.length < navigationLimits.concurrentSearches &&
        this.queue.length > 0
      ) {
        let index = -1;
        let lane = -1;
        for (let candidate = 0; candidate < this.owners.length; candidate++) {
          const owner = this.owners[candidate];
          index = this.queue.findIndex(
            (entry) =>
              entry.owner === owner &&
              (entry.work.status !== 'pending' ||
                !owner ||
                owner.availableSearchSlots > 0),
          );
          if (index >= 0) {
            lane = candidate;
            break;
          }
        }
        if (index >= 0) {
          const entry = this.queue.splice(index, 1)[0]!;
          const owner = this.owners.splice(lane, 1)[0];
          if (this.queue.some((queued) => queued.owner === owner))
            this.owners.push(owner);
          stats.work++;
          if (entry.work.status !== 'pending') {
            this.record(entry.work.status);
            continue;
          }
          if (entry.work instanceof NavigationScheduledSearch)
            entry.work.admit();
          if (entry.work.status === 'pending') this.active.push(entry);
          else this.record(entry.work.status);
          continue;
        }
      }
      if (this.active.length === 0) break;
      this.cursor %= this.active.length;
      const entry = this.active[this.cursor]!;
      const before = entry.work.expansions;
      entry.work.step(1);
      const used = entry.work.expansions - before;
      stats.work++;
      if (entry.kind === 'search') stats.expansions += used;
      else stats.bakeWork += used;
      if (entry.work.status !== 'pending') {
        this.record(entry.work.status);
        this.active.splice(this.cursor, 1);
      } else this.cursor++;
    }
    stats.totalWork += stats.work;
    stats.queued = this.queue.length;
    stats.active = this.active.length;
    return stats;
  }
  clear(): void {
    for (const entry of this.queue) entry.work.cancel();
    for (const entry of this.active) entry.work.cancel();
    this.queue.length = this.active.length = this.owners.length = 0;
    this.cursor = 0;
    for (const follower of this.followers) follower.stop();
    this.followers.clear();
    this.stats.queued = this.stats.active = 0;
  }
  destroy(): void {
    if (this.disposed) return;
    this.clear();
    this.disposed = true;
  }
  private record(status: NavigationSearchStatus): void {
    if (status === 'cancelled') this.stats.cancelled++;
    else if (status === 'invalidated') this.stats.invalidated++;
    else this.stats.completed++;
  }
  private checkBudget(value: number): void {
    if (
      !Number.isSafeInteger(value) ||
      value < 0 ||
      value > navigationLimits.expansionsPerStep
    )
      throw new RangeError(
        'Navigation work budget exceeds its nonnegative integer bound.',
      );
  }
  private assertLive(): void {
    if (this.disposed) throw new Error('Navigation scheduler is destroyed.');
  }
}
