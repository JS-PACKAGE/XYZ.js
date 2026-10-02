import { navigationLimits } from '../../../../src/data/navigation.js';
import type { NavigationSearchStatus } from './jobs.js';

/** Sparse indexed heap: a query allocates only for visited partition nodes. */
export class PartitionSearch {
  readonly distance = new Map<number, number>();
  readonly parent = new Map<number, number>();
  private readonly scores = new Map<number, number>();
  private readonly slots = new Map<number, number>();
  private readonly heap: number[] = [];
  offer(node: number, distance: number, score: number, parent: number): void {
    this.distance.set(node, distance);
    this.parent.set(node, parent);
    this.scores.set(node, score);
    const priorSlot = this.slots.get(node);
    let slot: number = priorSlot ?? this.heap.length;
    if (priorSlot === undefined) {
      this.heap.push(node);
    }
    while (slot > 0) {
      const above = (slot - 1) >>> 1;
      const other = this.heap[above]!;
      if (!this.before(node, other)) break;
      this.heap[slot] = other;
      this.slots.set(other, slot);
      slot = above;
    }
    this.heap[slot] = node;
    this.slots.set(node, slot);
  }
  take(): number | undefined {
    const node = this.heap[0];
    if (node === undefined) return undefined;
    this.slots.delete(node);
    const last = this.heap.pop()!;
    if (this.heap.length === 0) return node;
    let slot = 0;
    while (slot * 2 + 1 < this.heap.length) {
      let child = slot * 2 + 1;
      if (
        child + 1 < this.heap.length &&
        this.before(this.heap[child + 1]!, this.heap[child]!)
      )
        child++;
      const other = this.heap[child]!;
      if (!this.before(other, last)) break;
      this.heap[slot] = other;
      this.slots.set(other, slot);
      slot = child;
    }
    this.heap[slot] = last;
    this.slots.set(last, slot);
    return node;
  }
  private before(a: number, b: number): boolean {
    return (
      this.scores.get(a)! < this.scores.get(b)! ||
      (this.scores.get(a) === this.scores.get(b) && a < b)
    );
  }
}

/** Each invocation is one bounded primitive, including path reconstruction/smoothing. */
export class PartitionNavigationJob<Path> {
  private state: NavigationSearchStatus = 'pending';
  private count = 0;
  private value: Path | undefined;
  constructor(
    private operation: (() => Path | undefined) | undefined,
    private readonly current: () => boolean,
    private release: (() => void) | undefined,
    private readonly found: (path: Path) => boolean,
  ) {}
  get status(): NavigationSearchStatus {
    if (this.state === 'pending' && !this.current()) this.invalidate();
    return this.state;
  }
  get expansions(): number {
    return this.count;
  }
  get result(): Path | undefined {
    return this.value;
  }
  step(budget: number): NavigationSearchStatus {
    if (
      !Number.isSafeInteger(budget) ||
      budget < 0 ||
      budget > navigationLimits.expansionsPerStep
    )
      throw new RangeError('Invalid navigation work budget.');
    for (let i = 0; i < budget && this.status === 'pending'; i++) {
      this.count++;
      const result = this.operation!();
      if (result !== undefined) {
        this.value = result;
        this.finish(this.found(result) ? 'found' : 'unreachable');
      }
    }
    return this.status;
  }
  cancel(): void {
    this.finish('cancelled');
  }
  invalidate(): void {
    this.finish('invalidated');
  }
  private finish(state: NavigationSearchStatus): void {
    if (this.state !== 'pending') return;
    this.state = state;
    this.operation = undefined;
    this.release?.();
    this.release = undefined;
  }
}
