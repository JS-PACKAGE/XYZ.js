/** Indexed best-first frontier. Equal scores use stable node order, never insertion timing. */
export class NavigationSearch {
  readonly distance: Float64Array;
  readonly parent: Int32Array;
  /** Score of `heap[i]` at index `i`: sifting compares adjacent slots without indirection. */
  private readonly score: Float64Array;
  private readonly heap: Int32Array;
  private readonly slot: Int32Array;
  /** Nodes offered since the last reset; reset clears only these instead of every cell. */
  private readonly touched: Int32Array;
  private touchedCount = 0;
  private size = 0;

  constructor(capacity: number) {
    this.distance = new Float64Array(capacity).fill(Infinity);
    this.parent = new Int32Array(capacity).fill(-1);
    this.score = new Float64Array(capacity);
    this.heap = new Int32Array(capacity);
    this.slot = new Int32Array(capacity).fill(-1);
    this.touched = new Int32Array(capacity);
  }

  reset(): void {
    const { distance, parent, slot, touched } = this;
    for (let i = 0; i < this.touchedCount; i++) {
      const node = touched[i]!;
      distance[node] = Infinity;
      parent[node] = -1;
      slot[node] = -1;
    }
    this.touchedCount = 0;
    this.size = 0;
  }

  offer(node: number, distance: number, score: number, parent: number): void {
    // Offered distances are finite, so Infinity marks a node's first offer this search.
    if (this.distance[node] === Infinity)
      this.touched[this.touchedCount++] = node;
    this.distance[node] = distance;
    this.parent[node] = parent;
    const heap = this.heap,
      scores = this.score,
      slots = this.slot;
    let index = slots[node]!;
    if (index < 0) index = this.size++;
    while (index > 0) {
      const above = (index - 1) >>> 1;
      const other = heap[above]!,
        otherScore = scores[above]!;
      if (!(score < otherScore || (score === otherScore && node < other)))
        break;
      heap[index] = other;
      scores[index] = otherScore;
      slots[other] = index;
      index = above;
    }
    heap[index] = node;
    scores[index] = score;
    slots[node] = index;
  }

  take(): number {
    if (this.size === 0) return -1;
    const heap = this.heap,
      scores = this.score,
      slots = this.slot;
    const node = heap[0]!;
    slots[node] = -1;
    const size = --this.size;
    if (size === 0) return node;
    const last = heap[size]!,
      lastScore = scores[size]!;
    let index = 0;
    while (index * 2 + 1 < size) {
      let child = index * 2 + 1;
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
      heap[index] = other;
      scores[index] = otherScore;
      slots[other] = index;
      index = child;
    }
    heap[index] = last;
    scores[index] = lastScore;
    slots[last] = index;
    return node;
  }
}
