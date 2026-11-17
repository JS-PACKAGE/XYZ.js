import { navigationLimits } from '../../../../src/data/navigation.js';
import type { NavigationSearchStatus } from './jobs.js';

class HeapEntry {
  node = 0;
  score = 0;
  slot = 0;
  next: HeapEntry | undefined;
}

/** Sparse indexed heap: a query allocates only for visited partition nodes. */
export class PartitionSearch {
  readonly distance = new Map<number, number>();
  readonly parent = new Map<number, number>();
  private readonly entries = new Map<number, HeapEntry>();
  private readonly heap: HeapEntry[] = [];
  /** Removed entries stay query-local and are reused as the frontier grows. */
  private free: HeapEntry | undefined;
  offer(node: number, distance: number, score: number, parent: number): void {
    this.distance.set(node, distance);
    this.parent.set(node, parent);
    const heap = this.heap;
    let entry = this.entries.get(node);
    if (entry) {
      // Map coalesces ±0 keys; take() still retains the last offered node value.
      entry.node = node;
      entry.score = score;
    } else {
      entry = this.free ?? new HeapEntry();
      this.free = entry.next;
      entry.next = undefined;
      entry.node = node;
      entry.score = score;
      entry.slot = heap.length;
      this.entries.set(node, entry);
      heap.push(entry);
    }
    let slot = entry.slot;
    while (slot > 0) {
      const above = (slot - 1) >>> 1;
      const other = heap[above]!,
        otherScore = other.score;
      if (!(score < otherScore || (score === otherScore && node < other.node)))
        break;
      heap[slot] = other;
      other.slot = slot;
      slot = above;
    }
    heap[slot] = entry;
    entry.slot = slot;
  }
  take(): number | undefined {
    const heap = this.heap;
    const first = heap[0];
    if (first === undefined) return undefined;
    const node = first.node;
    this.entries.delete(node);
    const last = heap.pop()!;
    const size = heap.length;
    first.next = this.free;
    this.free = first;
    if (size === 0) return node;
    const lastScore = last.score,
      lastNode = last.node;
    let slot = 0;
    while (slot * 2 + 1 < size) {
      let child = slot * 2 + 1;
      let other = heap[child]!,
        otherScore = other.score;
      if (child + 1 < size) {
        const right = heap[child + 1]!,
          rightScore = right.score;
        if (
          rightScore < otherScore ||
          (rightScore === otherScore && right.node < other.node)
        ) {
          child++;
          other = right;
          otherScore = rightScore;
        }
      }
      if (!(
        otherScore < lastScore ||
        (otherScore === lastScore && other.node < lastNode)
      ))
        break;
      heap[slot] = other;
      other.slot = slot;
      slot = child;
    }
    heap[slot] = last;
    last.slot = slot;
    return node;
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
