/** Indexed best-first frontier. Equal scores use stable node order, never insertion timing. */
export class NavigationSearch {
  readonly distance: Float64Array;
  readonly parent: Int32Array;
  private readonly score: Float64Array;
  private readonly heap: Int32Array;
  private readonly slot: Int32Array;
  private size = 0;

  constructor(capacity: number) {
    this.distance = new Float64Array(capacity);
    this.parent = new Int32Array(capacity);
    this.score = new Float64Array(capacity);
    this.heap = new Int32Array(capacity);
    this.slot = new Int32Array(capacity);
  }

  reset(): void {
    this.distance.fill(Infinity);
    this.parent.fill(-1);
    this.slot.fill(-1);
    this.size = 0;
  }

  offer(node: number, distance: number, score: number, parent: number): void {
    this.distance[node] = distance;
    this.parent[node] = parent;
    this.score[node] = score;
    let index = this.slot[node]!;
    if (index < 0) {
      index = this.size++;
      this.heap[index] = node;
      this.slot[node] = index;
    }
    while (index > 0) {
      const above = (index - 1) >>> 1;
      const other = this.heap[above]!;
      if (!this.before(node, other)) break;
      this.heap[index] = other;
      this.slot[other] = index;
      index = above;
    }
    this.heap[index] = node;
    this.slot[node] = index;
  }

  take(): number {
    if (this.size === 0) return -1;
    const node = this.heap[0]!;
    this.slot[node] = -1;
    const last = this.heap[--this.size]!;
    if (this.size === 0) return node;
    let index = 0;
    while (index * 2 + 1 < this.size) {
      let child = index * 2 + 1;
      if (
        child + 1 < this.size &&
        this.before(this.heap[child + 1]!, this.heap[child]!)
      )
        child++;
      const other = this.heap[child]!;
      if (!this.before(other, last)) break;
      this.heap[index] = other;
      this.slot[other] = index;
      index = child;
    }
    this.heap[index] = last;
    this.slot[last] = index;
    return node;
  }

  private before(a: number, b: number): boolean {
    return (
      this.score[a]! < this.score[b]! ||
      (this.score[a] === this.score[b] && a < b)
    );
  }
}
