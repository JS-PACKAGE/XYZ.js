import { Matrix4 } from '../../math/src/index.js';
import type { Mesh } from './mesh.js';

export interface BakeTriangle {
  mesh: Mesh;
  indices: [number, number, number];
  p: Float64Array;
  n: Float64Array;
}
interface Node {
  min: number[];
  max: number[];
  start: number;
  end: number;
  left: number;
  right: number;
}

/** Internal immutable world-space snapshot. Median splits bound depth and storage. */
export class BakeBVH {
  /** Distance of the nearest hit from the last `hit` call. */
  private distance = 0;
  readonly triangles: BakeTriangle[] = [];
  /** Construction scratch; `flatten` copies it into the typed arrays `hit` walks. */
  private readonly nodes: Node[] = [];
  /** Per node: min xyz, then max xyz. */
  private bounds = new Float64Array(0);
  /** Per node: first triangle, end triangle, left child, right child (-1 for a leaf). */
  private links = new Int32Array(0);
  /** Per triangle in leaf order: its nine world-space corner coordinates. */
  private corners = new Float64Array(0);
  private stack = new Int32Array(0);
  rays = 0;
  constructor(
    meshes: readonly Mesh[],
    maxTriangles: number,
    private readonly maxRays: number,
  ) {
    let count = 0;
    for (const mesh of meshes) count += mesh.geometry.indices.length / 3;
    if (count > maxTriangles)
      throw new RangeError('Bake triangle budget exceeded.');
    const normal = new Matrix4();
    for (const mesh of meshes) {
      if (mesh.morph || mesh.renderGeometry !== mesh.geometry)
        throw new RangeError('Bake requires undeformed static meshes.');
      const matrix = mesh.updateWorldMatrix();
      normal.copy(matrix).invert();
      const e = matrix.elements,
        ne = normal.elements,
        g = mesh.geometry;
      for (let t = 0; t < g.indices.length; t += 3) {
        const indices: [number, number, number] = [
          g.indices[t],
          g.indices[t + 1],
          g.indices[t + 2],
        ];
        const p = new Float64Array(9),
          n = new Float64Array(9);
        for (let i = 0; i < 3; i++) {
          const v = indices[i] * 8;
          for (let c = 0; c < 3; c++) {
            p[i * 3 + c] =
              e[c] * g.vertices[v] +
              e[c + 4] * g.vertices[v + 1] +
              e[c + 8] * g.vertices[v + 2] +
              e[c + 12];
            n[i * 3 + c] =
              ne[c * 4] * g.vertices[v + 3] +
              ne[c * 4 + 1] * g.vertices[v + 4] +
              ne[c * 4 + 2] * g.vertices[v + 5];
            if (
              !Number.isFinite(p[i * 3 + c]) ||
              !Number.isFinite(n[i * 3 + c])
            )
              throw new RangeError('Nonfinite bake transform.');
          }
        }
        this.triangles.push({ mesh, indices, p, n });
      }
    }
    if (count) {
      this.build(0, count);
      this.flatten();
    }
  }
  private build(start: number, end: number): number {
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (let i = start; i < end; i++)
      for (let v = 0; v < 3; v++)
        for (let c = 0; c < 3; c++) {
          min[c] = Math.min(min[c], this.triangles[i].p[v * 3 + c]);
          max[c] = Math.max(max[c], this.triangles[i].p[v * 3 + c]);
        }
    const id = this.nodes.length;
    const node: Node = { min, max, start, end, left: -1, right: -1 };
    this.nodes.push(node);
    if (end - start > 8) {
      let axis = 0;
      for (let c = 1; c < 3; c++)
        if (max[c] - min[c] > max[axis] - min[axis]) axis = c;
      const sorted = this.triangles
        .slice(start, end)
        .sort(
          (a, b) =>
            a.p[axis] +
            a.p[axis + 3] +
            a.p[axis + 6] -
            (b.p[axis] + b.p[axis + 3] + b.p[axis + 6]),
        );
      for (let i = 0; i < sorted.length; i++)
        this.triangles[start + i] = sorted[i];
      const middle = (start + end) >>> 1;
      node.left = this.build(start, middle);
      node.right = this.build(middle, end);
    }
    return id;
  }
  /** Walks flat arrays instead of node and triangle objects; the arithmetic is unchanged. */
  private flatten(): void {
    const nodes = this.nodes,
      triangles = this.triangles;
    const bounds = (this.bounds = new Float64Array(nodes.length * 6)),
      links = (this.links = new Int32Array(nodes.length * 4)),
      corners = (this.corners = new Float64Array(triangles.length * 9));
    // Every node is pushed at most once per ray.
    this.stack = new Int32Array(nodes.length + 1);
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      for (let c = 0; c < 3; c++) {
        bounds[i * 6 + c] = node.min[c];
        bounds[i * 6 + 3 + c] = node.max[c];
      }
      links[i * 4] = node.start;
      links[i * 4 + 1] = node.end;
      links[i * 4 + 2] = node.left;
      links[i * 4 + 3] = node.right;
    }
    for (let i = 0; i < triangles.length; i++)
      corners.set(triangles[i].p, i * 9);
    nodes.length = 0;
  }
  hit(
    o: ArrayLike<number>,
    d: ArrayLike<number>,
    far: number,
    ignore?: BakeTriangle,
  ): { triangle: BakeTriangle; distance: number } | undefined {
    const found = this.trace(o, d, far, ignore, false);
    return found >= 0
      ? { triangle: this.triangles[found], distance: this.distance }
      : undefined;
  }
  /** Whether `hit` would find any triangle; it stops at the first one rather than the nearest. */
  occluded(
    o: ArrayLike<number>,
    d: ArrayLike<number>,
    far: number,
    ignore?: BakeTriangle,
  ): boolean {
    return this.trace(o, d, far, ignore, true) >= 0;
  }
  /** Triangle index of the nearest hit (the first with `anyHit`), or -1; distance in `distance`. */
  private trace(
    o: ArrayLike<number>,
    d: ArrayLike<number>,
    far: number,
    ignore: BakeTriangle | undefined,
    anyHit: boolean,
  ): number {
    if (++this.rays > this.maxRays)
      throw new RangeError('Bake ray budget exceeded.');
    const { bounds, links, corners, stack, triangles } = this;
    const o0 = o[0],
      o1 = o[1],
      o2 = o[2],
      d0 = d[0],
      d1 = d[1],
      d2 = d[2];
    const flat0 = Math.abs(d0) < 1e-15,
      flat1 = Math.abs(d1) < 1e-15,
      flat2 = Math.abs(d2) < 1e-15;
    let top = 0;
    if (links.length) stack[top++] = 0;
    let nearest = far,
      found = -1;
    while (top) {
      const node = stack[--top],
        b = node * 6;
      let lo = 0,
        hi = nearest;
      if (flat0) {
        if (o0 < bounds[b] || o0 > bounds[b + 3]) hi = -1;
      } else {
        const a = (bounds[b] - o0) / d0,
          c = (bounds[b + 3] - o0) / d0;
        lo = Math.max(lo, Math.min(a, c));
        hi = Math.min(hi, Math.max(a, c));
      }
      if (flat1) {
        if (o1 < bounds[b + 1] || o1 > bounds[b + 4]) hi = -1;
      } else {
        const a = (bounds[b + 1] - o1) / d1,
          c = (bounds[b + 4] - o1) / d1;
        lo = Math.max(lo, Math.min(a, c));
        hi = Math.min(hi, Math.max(a, c));
      }
      if (flat2) {
        if (o2 < bounds[b + 2] || o2 > bounds[b + 5]) hi = -1;
      } else {
        const a = (bounds[b + 2] - o2) / d2,
          c = (bounds[b + 5] - o2) / d2;
        lo = Math.max(lo, Math.min(a, c));
        hi = Math.min(hi, Math.max(a, c));
      }
      if (hi < lo) continue;
      const link = node * 4;
      if (links[link + 2] >= 0) {
        stack[top++] = links[link + 2];
        stack[top++] = links[link + 3];
        continue;
      }
      for (let i = links[link], end = links[link + 1]; i < end; i++) {
        if (ignore !== undefined && triangles[i] === ignore) continue;
        const p = i * 9;
        const ax = corners[p + 3] - corners[p],
          ay = corners[p + 4] - corners[p + 1],
          az = corners[p + 5] - corners[p + 2];
        const bx = corners[p + 6] - corners[p],
          by = corners[p + 7] - corners[p + 1],
          bz = corners[p + 8] - corners[p + 2];
        const px = d1 * bz - d2 * by,
          py = d2 * bx - d0 * bz,
          pz = d0 * by - d1 * bx;
        const det = ax * px + ay * py + az * pz;
        if (Math.abs(det) < 1e-12) continue;
        const tx = o0 - corners[p],
          ty = o1 - corners[p + 1],
          tz = o2 - corners[p + 2];
        const u = (tx * px + ty * py + tz * pz) / det;
        if (u < 0 || u > 1) continue;
        const qx = ty * az - tz * ay,
          qy = tz * ax - tx * az,
          qz = tx * ay - ty * ax;
        const v = (d0 * qx + d1 * qy + d2 * qz) / det;
        if (v < 0 || u + v > 1) continue;
        const distance = (bx * qx + by * qy + bz * qz) / det;
        if (distance > 1e-7 && distance < nearest) {
          nearest = distance;
          found = i;
          if (anyHit) return i;
        }
      }
    }
    this.distance = nearest;
    return found;
  }
}
