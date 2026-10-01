import { navigationLimits } from '../../../../src/data/navigation.js';
import { NavigationSearch } from './search.js';

export type NavigationSearchStatus =
  'pending' | 'found' | 'unreachable' | 'cancelled' | 'invalidated';

/** A revision-bound search. Each step consumes at most the supplied node expansions. */
export class NavigationSearchJob<Path> {
  private workspace: NavigationSearch | undefined;
  private plan: SearchPlan<Path> | undefined;
  private currentStatus: NavigationSearchStatus = 'pending';
  private currentResult: Path | undefined;
  private expanded = 0;

  /** @internal Use a grid or graph's createSearch. */
  constructor(
    workspace: NavigationSearch,
    plan: SearchPlan<Path>,
    private release:
      | ((job: NavigationSearchJob<Path>, workspace: NavigationSearch) => void)
      | undefined,
  ) {
    this.workspace = workspace;
    this.plan = plan;
    workspace.reset();
    if (plan.from < 0) this.finish('unreachable');
    else workspace.offer(plan.from, 0, plan.estimate(plan.from), -1);
  }

  get status(): NavigationSearchStatus {
    return this.currentStatus;
  }
  get result(): Path | undefined {
    return this.currentResult;
  }
  get expansions(): number {
    return this.expanded;
  }

  step(expansionBudget: number): NavigationSearchStatus {
    if (
      !Number.isSafeInteger(expansionBudget) ||
      expansionBudget < 0 ||
      expansionBudget > navigationLimits.expansionsPerStep
    )
      throw new RangeError(
        'Navigation expansion budget exceeds its nonnegative integer bound.',
      );
    if (this.currentStatus !== 'pending') return this.currentStatus;
    const plan = this.plan!;
    const search = this.workspace!;
    for (let count = 0; count < expansionBudget; count++) {
      const current = search.take();
      if (current < 0) {
        this.finish('unreachable');
        break;
      }
      this.expanded++;
      if (current === plan.to) {
        this.finish('found');
        break;
      }
      plan.expand(current, search);
    }
    return this.currentStatus;
  }

  cancel(): void {
    this.finish('cancelled');
  }

  /** @internal Edits invalidate rather than mixing revisions in one result. */
  invalidate(): void {
    this.finish('invalidated');
  }

  private finish(status: Exclude<NavigationSearchStatus, 'pending'>): void {
    if (this.currentStatus !== 'pending') return;
    const workspace = this.workspace!;
    if (status === 'found' || status === 'unreachable')
      this.currentResult = this.plan!.result(status === 'found', workspace);
    this.currentStatus = status;
    this.plan = undefined;
    this.workspace = undefined;
    this.release?.(this, workspace);
    this.release = undefined;
  }
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
export class NavigationSearchPool<Path> {
  private readonly free: NavigationSearch[] = [];
  private readonly active = new Set<NavigationSearchJob<Path>>();
  private disposed = false;
  constructor(private readonly capacity: number) {}

  create(plan: SearchPlan<Path>): NavigationSearchJob<Path> {
    if (this.disposed) throw new Error('Navigation owner is destroyed.');
    if (this.active.size >= navigationLimits.concurrentSearches)
      throw new RangeError('Navigation concurrent search budget exhausted.');
    const workspace = this.free.pop() ?? new NavigationSearch(this.capacity);
    const job = new NavigationSearchJob(
      workspace,
      plan,
      (completed, released) => {
        this.active.delete(completed);
        if (!this.disposed) this.free.push(released);
      },
    );
    if (job.status === 'pending') this.active.add(job);
    return job;
  }

  invalidate(): void {
    for (const job of this.active) job.invalidate();
  }

  destroy(): void {
    this.disposed = true;
    for (const job of this.active) job.cancel();
    this.free.length = 0;
  }
}
