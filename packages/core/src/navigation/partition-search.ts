import { navigationLimits } from '../../../../src/data/navigation.js';
import type { NavigationSearchStatus } from './jobs.js';

/** Sparse indexed heap: a query allocates only for visited partition nodes. */
export class PartitionSearch {
  readonly distance = new Map<number, number>();
  readonly parent = new Map<number, number>();
  private readonly slots = new Map<number, number>();
  private readonly heap: number[] = [];
  /** Score of `heap[i]` at index `i`: sifting compares slots without map lookups. */
  private readonly scores: number[] = [];
  offer(node: number, distance: number, score: number, parent: number): void {
    this.distance.set(node, distance);
    this.parent.set(node, parent);
    const heap = this.heap,
      scores = this.scores;
    const priorSlot = this.slots.get(node);
    let slot: number = priorSlot ?? heap.length;
    if (priorSlot === undefined) {
      heap.push(node);
      scores.push(score);
    }
    while (slot > 0) {
      const above = (slot - 1) >>> 1;
      const other = heap[above]!,
        otherScore = scores[above]!;
      if (!(score < otherScore || (score === otherScore && node < other)))
        break;
      heap[slot] = other;
      scores[slot] = otherScore;
      this.slots.set(other, slot);
      slot = above;
    }
    heap[slot] = node;
    scores[slot] = score;
    this.slots.set(node, slot);
  }
  take(): number | undefined {
    const heap = this.heap,
      scores = this.scores;
    const node = heap[0];
    if (node === undefined) return undefined;
    this.slots.delete(node);
    const last = heap.pop()!,
      lastScore = scores.pop()!;
    const size = heap.length;
    if (size === 0) return node;
    let slot = 0;
    while (slot * 2 + 1 < size) {
      let child = slot * 2 + 1;
      let other = heap[child]!,
        otherScore = scores[child]!;
      if (child + 1 < size) {
        const right = heap[child + 1]!,
          rightScore = scores[child + 1]!;
        if (
          rightScore < otherScore ||
          (rightScore === otherScore && right < other)
        ) {
          child++;
          other = right;
          otherScore = rightScore;
        }
      }
      if (!(
        otherScore < lastScore ||
        (otherScore === lastScore && other < last)
      ))
        break;
      heap[slot] = other;
      scores[slot] = otherScore;
      this.slots.set(other, slot);
      slot = child;
    }
    heap[slot] = last;
    scores[slot] = lastScore;
    this.slots.set(last, slot);
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
