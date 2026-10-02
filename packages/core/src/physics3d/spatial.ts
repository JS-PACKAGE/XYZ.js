import { Vector3 } from '../../../math/src/index.js';

/** @internal Conservative bounds; infinite planes remain valid leaves. */
export class Bounds3D {
  readonly min = new Vector3(Infinity, Infinity, Infinity);
  readonly max = new Vector3(-Infinity, -Infinity, -Infinity);
  reset(): void {
    this.min.set(Infinity, Infinity, Infinity);
    this.max.set(-Infinity, -Infinity, -Infinity);
  }
  add(p: Readonly<Vector3>): void {
    this.min.x = Math.min(this.min.x, p.x);
    this.min.y = Math.min(this.min.y, p.y);
    this.min.z = Math.min(this.min.z, p.z);
    this.max.x = Math.max(this.max.x, p.x);
    this.max.y = Math.max(this.max.y, p.y);
    this.max.z = Math.max(this.max.z, p.z);
  }
  union(a: Bounds3D, b: Bounds3D): void {
    this.min.set(
      Math.min(a.min.x, b.min.x),
      Math.min(a.min.y, b.min.y),
      Math.min(a.min.z, b.min.z),
    );
    this.max.set(
      Math.max(a.max.x, b.max.x),
      Math.max(a.max.y, b.max.y),
      Math.max(a.max.z, b.max.z),
    );
  }
  swept(a: Bounds3D, d: Readonly<Vector3>, margin = 0): void {
    this.min.set(
      a.min.x + Math.min(0, d.x) - margin,
      a.min.y + Math.min(0, d.y) - margin,
      a.min.z + Math.min(0, d.z) - margin,
    );
    this.max.set(
      a.max.x + Math.max(0, d.x) + margin,
      a.max.y + Math.max(0, d.y) + margin,
      a.max.z + Math.max(0, d.z) + margin,
    );
  }
  overlaps(b: Bounds3D, margin = 0): boolean {
    return (
      this.min.x <= b.max.x + margin &&
      this.max.x + margin >= b.min.x &&
      this.min.y <= b.max.y + margin &&
      this.max.y + margin >= b.min.y &&
      this.min.z <= b.max.z + margin &&
      this.max.z + margin >= b.min.z
    );
  }
}
export interface SpatialItem3D {
  readonly bounds: Bounds3D;
  readonly order: number;
}
class Node3D<T extends SpatialItem3D> {
  readonly bounds = new Bounds3D();
  left: Node3D<T> | undefined;
  right: Node3D<T> | undefined;
  item: T | undefined;
  parent: Node3D<T> | undefined;
}
/** @internal Deterministic balanced AABB hierarchy. Refit supports directly mutable transforms; queries reuse caller buffers. */
export class SpatialIndex3D<T extends SpatialItem3D> {
  private root: Node3D<T> | undefined;
  private readonly nodes: Node3D<T>[] = [];
  private readonly leaves: T[] = [];
  private readonly stack: Node3D<T>[] = [];
  private readonly leafNodes = new Map<T, Node3D<T>>();
  private used = 0;
  rebuild(items: readonly T[]): void {
    this.leaves.length = 0;
    this.leafNodes.clear();
    for (const item of items) this.leaves.push(item);
    this.used = 0;
    this.root = this.build(0, items.length);
    this.nodes.length = this.used;
  }
  private build(
    lo: number,
    hi: number,
    parent?: Node3D<T>,
  ): Node3D<T> | undefined {
    if (lo === hi) return undefined;
    const slot = this.used++,
      node = this.nodes[slot] ?? (this.nodes[slot] = new Node3D<T>());
    node.item = undefined;
    node.left = undefined;
    node.right = undefined;
    node.parent = parent;
    if (hi - lo === 1) {
      node.item = this.leaves[lo];
      this.leafNodes.set(node.item, node);
      node.bounds.union(node.item.bounds, node.item.bounds);
      return node;
    }
    // Sort only during topology changes; stable ties use registration/triangle order.
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity,
      maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let i = lo; i < hi; i++) {
      const b = this.leaves[i].bounds;
      if (Number.isFinite(b.min.x + b.max.x)) {
        const x = (b.min.x + b.max.x) / 2,
          y = (b.min.y + b.max.y) / 2,
          z = (b.min.z + b.max.z) / 2;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }
    }
    const axis =
      maxX - minX >= maxY - minY && maxX - minX >= maxZ - minZ
        ? 'x'
        : maxY - minY >= maxZ - minZ
          ? 'y'
          : 'z';
    const sorted = this.leaves.slice(lo, hi).sort((a, b) => {
      const ac = (a.bounds.min[axis] + a.bounds.max[axis]) / 2,
        bc = (b.bounds.min[axis] + b.bounds.max[axis]) / 2;
      return (
        (Number.isFinite(ac) ? ac : 0) - (Number.isFinite(bc) ? bc : 0) ||
        a.order - b.order
      );
    });
    for (let i = lo; i < hi; i++) this.leaves[i] = sorted[i - lo];
    const mid = (lo + hi) >>> 1;
    node.left = this.build(lo, mid, node);
    node.right = this.build(mid, hi, node);
    node.bounds.union(node.left!.bounds, node.right!.bounds);
    return node;
  }
  refit(): void {
    for (let i = this.used - 1; i >= 0; i--) {
      const n = this.nodes[i];
      if (n.item) n.bounds.union(n.item.bounds, n.item.bounds);
      else n.bounds.union(n.left!.bounds, n.right!.bounds);
    }
  }
  update(item: T): number {
    let node = this.leafNodes.get(item);
    if (!node) return 0;
    let count = 0;
    while (node) {
      const b = node.bounds,
        left = node.item ? item.bounds : node.left!.bounds,
        right = node.item ? item.bounds : node.right!.bounds;
      const x0 = Math.min(left.min.x, right.min.x),
        y0 = Math.min(left.min.y, right.min.y),
        z0 = Math.min(left.min.z, right.min.z),
        x1 = Math.max(left.max.x, right.max.x),
        y1 = Math.max(left.max.y, right.max.y),
        z1 = Math.max(left.max.z, right.max.z);
      if (
        b.min.x === x0 &&
        b.min.y === y0 &&
        b.min.z === z0 &&
        b.max.x === x1 &&
        b.max.y === y1 &&
        b.max.z === z1
      )
        break;
      b.min.set(x0, y0, z0);
      b.max.set(x1, y1, z1);
      ++count;
      node = node.parent;
    }
    return count;
  }
  query(bounds: Bounds3D, out: T[], margin = 0): void {
    out.length = 0;
    this.stack.length = 0;
    if (this.root) this.stack.push(this.root);
    while (this.stack.length) {
      const n = this.stack.pop()!;
      if (!n.bounds.overlaps(bounds, margin)) continue;
      if (n.item) out.push(n.item);
      else {
        this.stack.push(n.right!, n.left!);
      }
    }
    out.sort(compareOrder);
  }
  clear(): void {
    this.root = undefined;
    this.nodes.length = 0;
    this.leaves.length = 0;
    this.stack.length = 0;
    this.leafNodes.clear();
    this.used = 0;
  }
}
function compareOrder(a: SpatialItem3D, b: SpatialItem3D): number {
  return a.order - b.order;
}
