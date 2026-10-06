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
  readonly triangles: BakeTriangle[] = [];
  private readonly nodes: Node[] = [];
  private readonly stack: number[] = [];
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
    if (count) this.build(0, count);
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
  hit(
    o: ArrayLike<number>,
    d: ArrayLike<number>,
    far: number,
    ignore?: BakeTriangle,
  ): { triangle: BakeTriangle; distance: number } | undefined {
    if (++this.rays > this.maxRays)
      throw new RangeError('Bake ray budget exceeded.');
    const stack = this.stack;
    stack.length = 0;
    if (this.nodes.length) stack.push(0);
    let nearest = far,
      found: BakeTriangle | undefined;
    while (stack.length) {
      const node = this.nodes[stack.pop()!];
      let lo = 0,
        hi = nearest;
      for (let c = 0; c < 3; c++) {
        if (Math.abs(d[c]) < 1e-15) {
          if (o[c] < node.min[c] || o[c] > node.max[c]) hi = -1;
        } else {
          const a = (node.min[c] - o[c]) / d[c],
            b = (node.max[c] - o[c]) / d[c];
          lo = Math.max(lo, Math.min(a, b));
          hi = Math.min(hi, Math.max(a, b));
        }
      }
      if (hi < lo) continue;
      if (node.left >= 0) {
        stack.push(node.left, node.right);
        continue;
      }
      for (let i = node.start; i < node.end; i++) {
        const t = this.triangles[i];
        if (t === ignore) continue;
        const p = t.p;
        const ax = p[3] - p[0],
          ay = p[4] - p[1],
          az = p[5] - p[2];
        const bx = p[6] - p[0],
          by = p[7] - p[1],
          bz = p[8] - p[2];
        const px = d[1] * bz - d[2] * by,
          py = d[2] * bx - d[0] * bz,
          pz = d[0] * by - d[1] * bx;
        const det = ax * px + ay * py + az * pz;
        if (Math.abs(det) < 1e-12) continue;
        const tx = o[0] - p[0],
          ty = o[1] - p[1],
          tz = o[2] - p[2];
        const u = (tx * px + ty * py + tz * pz) / det;
        if (u < 0 || u > 1) continue;
        const qx = ty * az - tz * ay,
          qy = tz * ax - tx * az,
          qz = tx * ay - ty * ax;
        const v = (d[0] * qx + d[1] * qy + d[2] * qz) / det;
        if (v < 0 || u + v > 1) continue;
        const distance = (bx * qx + by * qy + bz * qz) / det;
        if (distance > 1e-7 && distance < nearest) {
          nearest = distance;
          found = t;
        }
      }
    }
    return found ? { triangle: found, distance: nearest } : undefined;
  }
}
