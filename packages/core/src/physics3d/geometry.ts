import { Vector3 } from '../../../math/src/index.js';
import { Shape3D } from './collider.js';

/** @internal Signed separation and B-to-A normal. Reused for solver and conservative advancement. */
export class Manifold3D {
  readonly normal = new Vector3();
  readonly points = Array.from({ length: 8 }, () => new Vector3());
  readonly depths = new Float64Array(8);
  count = 0;
  distance = Infinity;
  add(point: Readonly<Vector3>, depth: number): void {
    if (this.count === 8) return;
    this.points[this.count].set(point.x, point.y, point.z);
    this.depths[this.count++] = depth;
  }
}
const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));
function cross(
  a: Readonly<Vector3>,
  b: Readonly<Vector3>,
  out: Vector3,
): Vector3 {
  return out.set(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}
/** @internal No mutable global scratch: each world/query owns a narrowphase context. */
export class Narrowphase3D {
  private readonly p = new Vector3();
  private readonly q = new Vector3();
  private readonly axis = new Vector3();
  private readonly local = new Float64Array(3);
  private readonly delta = new Float64Array(3);
  private readonly half = new Float64Array(3);
  private readonly breaks = new Float64Array(8);
  private readonly polygonA = Array.from({ length: 16 }, () => new Vector3());
  private readonly polygonB = Array.from({ length: 16 }, () => new Vector3());
  private readonly edgeA0 = new Vector3();
  private readonly edgeA1 = new Vector3();
  private readonly edgeB0 = new Vector3();
  private readonly edgeB1 = new Vector3();
  /** Exact closest points between two finite line segments, including point segments. */
  segment(
    a: Readonly<Vector3>,
    b: Readonly<Vector3>,
    c: Readonly<Vector3>,
    d: Readonly<Vector3>,
    p: Vector3,
    q: Vector3,
  ): void {
    const ux = b.x - a.x,
      uy = b.y - a.y,
      uz = b.z - a.z,
      vx = d.x - c.x,
      vy = d.y - c.y,
      vz = d.z - c.z;
    const wx = a.x - c.x,
      wy = a.y - c.y,
      wz = a.z - c.z;
    const aa = ux * ux + uy * uy + uz * uz,
      bb = ux * vx + uy * vy + uz * vz,
      cc = vx * vx + vy * vy + vz * vz,
      dd = ux * wx + uy * wy + uz * wz,
      ee = vx * wx + vy * wy + vz * wz;
    let s = 0,
      t = 0;
    if (aa < 1e-16) t = cc < 1e-16 ? 0 : clamp(ee / cc, 0, 1);
    else if (cc < 1e-16) s = clamp(-dd / aa, 0, 1);
    else {
      const den = aa * cc - bb * bb;
      s = den > 1e-16 ? clamp((bb * ee - cc * dd) / den, 0, 1) : 0;
      t = (bb * s + ee) / cc;
      if (t < 0) {
        t = 0;
        s = clamp(-dd / aa, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((bb - dd) / aa, 0, 1);
      }
    }
    p.set(a.x + ux * s, a.y + uy * s, a.z + uz * s);
    q.set(c.x + vx * t, c.y + vy * t, c.z + vz * t);
  }
  /** Segment-to-OBB closest pair via exact piecewise quadratic minimization, not an AABB proxy. */
  private segmentBox(a: Shape3D, b: Shape3D, out: Manifold3D): void {
    const l = this.local,
      d = this.delta,
      h = this.half,
      ts = this.breaks;
    let n = 2;
    ts[0] = 0;
    ts[1] = 1;
    h[0] = b.half.x;
    h[1] = b.half.y;
    h[2] = b.half.z;
    for (let i = 0; i < 3; i++) {
      const ax = b.axes[i];
      l[i] =
        (a.start.x - b.center.x) * ax.x +
        (a.start.y - b.center.y) * ax.y +
        (a.start.z - b.center.z) * ax.z;
      d[i] =
        (a.end.x - a.start.x) * ax.x +
        (a.end.y - a.start.y) * ax.y +
        (a.end.z - a.start.z) * ax.z;
      if (Math.abs(d[i]) > 1e-16)
        for (let sign = -1; sign <= 1; sign += 2) {
          const t = (sign * h[i] - l[i]) / d[i];
          if (t > 0 && t < 1) ts[n++] = t;
        }
    }
    for (let i = 1; i < n; i++) {
      const v = ts[i];
      let j = i;
      while (j > 0 && ts[j - 1] > v) {
        ts[j] = ts[j - 1];
        j--;
      }
      ts[j] = v;
    }
    let best = Infinity,
      bestT = 0;
    for (let j = 0; j < n - 1; j++) {
      const lo = ts[j],
        hi = ts[j + 1],
        mid = (lo + hi) / 2;
      let aa = 0,
        bb = 0;
      for (let i = 0; i < 3; i++) {
        const v = l[i] + d[i] * mid;
        if (v > h[i] || v < -h[i]) {
          aa += d[i] * d[i];
          bb += d[i] * (l[i] - (v > 0 ? h[i] : -h[i]));
        }
      }
      const t = aa > 0 ? clamp(-bb / aa, lo, hi) : mid;
      let dist = 0;
      for (let i = 0; i < 3; i++) {
        const v = l[i] + d[i] * t - clamp(l[i] + d[i] * t, -h[i], h[i]);
        dist += v * v;
      }
      if (dist < best) {
        best = dist;
        bestT = t;
      }
    }
    const p = this.p,
      q = this.q;
    p.set(
      a.start.x + (a.end.x - a.start.x) * bestT,
      a.start.y + (a.end.y - a.start.y) * bestT,
      a.start.z + (a.end.z - a.start.z) * bestT,
    );
    q.copy(b.center);
    for (let i = 0; i < 3; i++) {
      const v = clamp(l[i] + d[i] * bestT, -h[i], h[i]),
        ax = b.axes[i];
      q.x += ax.x * v;
      q.y += ax.y * v;
      q.z += ax.z * v;
    }
    if (best > 1e-16) {
      const dist = Math.sqrt(best);
      out.normal.set(
        (p.x - q.x) / dist,
        (p.y - q.y) / dist,
        (p.z - q.z) / dist,
      );
      out.distance = dist - a.radius;
    } else {
      // Interior segment: select the minimum translation face using the full segment support.
      let depth = Infinity,
        index = 0,
        sign = 1;
      for (let i = 0; i < 3; i++) {
        const min = Math.min(l[i], l[i] + d[i]),
          max = Math.max(l[i], l[i] + d[i]);
        const plus = h[i] - min,
          minus = h[i] + max;
        if (plus < depth) {
          depth = plus;
          index = i;
          sign = 1;
        }
        if (minus < depth) {
          depth = minus;
          index = i;
          sign = -1;
        }
      }
      const ax = b.axes[index];
      out.normal.set(ax.x * sign, ax.y * sign, ax.z * sign);
      out.distance = -depth - a.radius;
      const t = d[index] * sign > 0 ? 0 : 1;
      p.set(
        a.start.x + (a.end.x - a.start.x) * t,
        a.start.y + (a.end.y - a.start.y) * t,
        a.start.z + (a.end.z - a.start.z) * t,
      );
      q.set(
        p.x + out.normal.x * depth,
        p.y + out.normal.y * depth,
        p.z + out.normal.z * depth,
      );
    }
    out.add(q, -out.distance);
  }
  private roundRound(a: Shape3D, b: Shape3D, out: Manifold3D): void {
    this.segment(a.start, a.end, b.start, b.end, this.p, this.q);
    const dx = this.p.x - this.q.x,
      dy = this.p.y - this.q.y,
      dz = this.p.z - this.q.z,
      dist = Math.hypot(dx, dy, dz);
    if (dist > 1e-10) out.normal.set(dx / dist, dy / dist, dz / dist);
    else {
      out.normal.set(
        a.center.x - b.center.x,
        a.center.y - b.center.y,
        a.center.z - b.center.z,
      );
      if (out.normal.length() < 1e-10) out.normal.set(1, 0, 0);
      out.normal.normalize();
    }
    out.distance = dist - a.radius - b.radius;
    this.q.x += out.normal.x * b.radius;
    this.q.y += out.normal.y * b.radius;
    this.q.z += out.normal.z * b.radius;
    out.add(this.q, -out.distance);
  }
  private plane(a: Shape3D, b: Shape3D, out: Manifold3D): void {
    const n = b.normal;
    const side =
      (a.center.x - b.center.x) * n.x +
        (a.center.y - b.center.y) * n.y +
        (a.center.z - b.center.z) * n.z >=
      0
        ? 1
        : -1;
    out.normal.set(n.x * side, n.y * side, n.z * side);
    out.distance = Infinity;
    const vertices = a.collider.kind === 'box' ? a.vertices : undefined;
    const count = vertices
      ? 8
      : a.start.x === a.end.x && a.start.y === a.end.y && a.start.z === a.end.z
        ? 1
        : 2;
    for (let i = 0; i < count; i++) {
      const p = vertices ? vertices[i] : i === 0 ? a.start : a.end;
      const d =
        (p.x - b.center.x) * out.normal.x +
        (p.y - b.center.y) * out.normal.y +
        (p.z - b.center.z) * out.normal.z -
        (vertices ? 0 : a.radius);
      out.distance = Math.min(out.distance, d);
    }
    for (let i = 0; i < count; i++) {
      const p = vertices ? vertices[i] : i === 0 ? a.start : a.end;
      const d =
        (p.x - b.center.x) * out.normal.x +
        (p.y - b.center.y) * out.normal.y +
        (p.z - b.center.z) * out.normal.z -
        (vertices ? 0 : a.radius);
      if (d <= out.distance + 0.004) {
        this.p.set(
          p.x - out.normal.x * (d + (vertices ? 0 : a.radius)),
          p.y - out.normal.y * (d + (vertices ? 0 : a.radius)),
          p.z - out.normal.z * (d + (vertices ? 0 : a.radius)),
        );
        out.add(this.p, -d);
      }
    }
  }
  private radius(b: Shape3D, n: Readonly<Vector3>): number {
    return (
      Math.abs(b.axes[0].dot(n)) * b.half.x +
      Math.abs(b.axes[1].dot(n)) * b.half.y +
      Math.abs(b.axes[2].dot(n)) * b.half.z
    );
  }
  private face(b: Shape3D, index: number, sign: number, out: Vector3[]): void {
    const u = (index + 1) % 3,
      v = (index + 2) % 3,
      axis = b.axes[index],
      hu = index === 0 ? b.half.x : index === 1 ? b.half.y : b.half.z;
    const uu = b.axes[u],
      vv = b.axes[v],
      uh = u === 0 ? b.half.x : u === 1 ? b.half.y : b.half.z,
      vh = v === 0 ? b.half.x : v === 1 ? b.half.y : b.half.z;
    for (let i = 0; i < 4; i++) {
      const us = (i === 0 || i === 3 ? -1 : 1) * uh,
        vs = (i < 2 ? -1 : 1) * vh;
      out[i].set(
        b.center.x + axis.x * hu * sign + uu.x * us + vv.x * vs,
        b.center.y + axis.y * hu * sign + uu.y * us + vv.y * vs,
        b.center.z + axis.z * hu * sign + uu.z * us + vv.z * vs,
      );
    }
  }
  private supportEdge(
    b: Shape3D,
    index: number,
    n: Readonly<Vector3>,
    p: Vector3,
    q: Vector3,
  ): void {
    p.copy(b.center);
    for (let i = 0; i < 3; i++)
      if (i !== index) {
        const ax = b.axes[i],
          h =
            (i === 0 ? b.half.x : i === 1 ? b.half.y : b.half.z) *
            (ax.dot(n) >= 0 ? 1 : -1);
        p.x += ax.x * h;
        p.y += ax.y * h;
        p.z += ax.z * h;
      }
    q.copy(p);
    const ax = b.axes[index],
      h = index === 0 ? b.half.x : index === 1 ? b.half.y : b.half.z;
    p.x -= ax.x * h;
    p.y -= ax.y * h;
    p.z -= ax.z * h;
    q.x += ax.x * h;
    q.y += ax.y * h;
    q.z += ax.z * h;
  }
  private boxes(a: Shape3D, b: Shape3D, out: Manifold3D): void {
    const dx = a.center.x - b.center.x,
      dy = a.center.y - b.center.y,
      dz = a.center.z - b.center.z;
    let best = -Infinity,
      kind = 0,
      ia = 0,
      ib = 0;
    for (let i = 0; i < 15; i++) {
      const n =
        i < 3
          ? a.axes[i]
          : i < 6
            ? b.axes[i - 3]
            : cross(
                a.axes[Math.floor((i - 6) / 3)],
                b.axes[(i - 6) % 3],
                this.axis,
              );
      const len = n.length();
      if (len < 1e-8) continue;
      const signed = (dx * n.x + dy * n.y + dz * n.z) / len,
        sep = Math.abs(signed) - (this.radius(a, n) + this.radius(b, n)) / len;
      if (sep > best) {
        best = sep;
        const sign = signed >= 0 ? 1 : -1;
        out.normal.set(
          (n.x / len) * sign,
          (n.y / len) * sign,
          (n.z / len) * sign,
        );
        kind = i;
        ia = Math.floor((i - 6) / 3);
        ib = (i - 6) % 3;
      }
    }
    out.distance = best;
    if (kind >= 6) {
      this.axis.copy(out.normal).scale(-1);
      this.supportEdge(a, ia, this.axis, this.edgeA0, this.edgeA1);
      this.supportEdge(b, ib, out.normal, this.edgeB0, this.edgeB1);
      this.segment(
        this.edgeA0,
        this.edgeA1,
        this.edgeB0,
        this.edgeB1,
        this.p,
        this.q,
      );
      this.p.add(this.q).scale(0.5);
      out.add(this.p, -best);
      return;
    }
    const ref = kind < 3 ? a : b,
      inc = kind < 3 ? b : a,
      index = kind < 3 ? kind : kind - 3;
    this.axis.copy(out.normal).scale(kind < 3 ? -1 : 1);
    const normal = this.axis;
    let incident = 0,
      dot = 0;
    for (let i = 0; i < 3; i++) {
      const d = Math.abs(inc.axes[i].dot(normal));
      if (d > dot) {
        dot = d;
        incident = i;
      }
    }
    this.face(
      inc,
      incident,
      inc.axes[incident].dot(normal) > 0 ? -1 : 1,
      this.polygonA,
    );
    let src = this.polygonA,
      dst = this.polygonB,
      count = 4;
    for (let i = 0; i < 3; i++)
      if (i !== index)
        for (let side = -1; side <= 1; side += 2) {
          const ax = ref.axes[i],
            h = i === 0 ? ref.half.x : i === 1 ? ref.half.y : ref.half.z;
          let next = 0;
          for (let j = 0; j < count; j++) {
            const p = src[j],
              q = src[(j + 1) % count];
            const dp =
                side *
                  ((p.x - ref.center.x) * ax.x +
                    (p.y - ref.center.y) * ax.y +
                    (p.z - ref.center.z) * ax.z) -
                h,
              dq =
                side *
                  ((q.x - ref.center.x) * ax.x +
                    (q.y - ref.center.y) * ax.y +
                    (q.z - ref.center.z) * ax.z) -
                h;
            if (dp <= 1e-8) dst[next++].copy(p);
            if (dp < 0 !== dq < 0) {
              const t = dp / (dp - dq);
              dst[next++].set(
                p.x + (q.x - p.x) * t,
                p.y + (q.y - p.y) * t,
                p.z + (q.z - p.z) * t,
              );
            }
          }
          count = next;
          const tmp = src;
          src = dst;
          dst = tmp;
        }
    const h = index === 0 ? ref.half.x : index === 1 ? ref.half.y : ref.half.z;
    for (let i = 0; i < count; i++) {
      const p = src[i],
        d =
          (p.x - ref.center.x) * normal.x +
          (p.y - ref.center.y) * normal.y +
          (p.z - ref.center.z) * normal.z -
          h;
      if (d <= 0.004) {
        this.p.set(
          p.x - (normal.x * d) / 2,
          p.y - (normal.y * d) / 2,
          p.z - (normal.z * d) / 2,
        );
        out.add(this.p, -d);
      }
    }
    if (out.count === 0) {
      this.p.set(
        (a.center.x + b.center.x) / 2,
        (a.center.y + b.center.y) / 2,
        (a.center.z + b.center.z) / 2,
      );
      out.add(this.p, -best);
    }
  }
  collide(a: Shape3D, b: Shape3D, out: Manifold3D): void {
    out.count = 0;
    out.distance = Infinity;
    const ak = a.collider.kind,
      bk = b.collider.kind;
    if (ak === 'plane' && bk === 'plane') return;
    if (bk === 'plane') this.plane(a, b, out);
    else if (ak === 'plane') {
      this.plane(b, a, out);
      out.normal.scale(-1);
    } else if (ak === 'box' && bk === 'box') this.boxes(a, b, out);
    else if (bk === 'box') this.segmentBox(a, b, out);
    else if (ak === 'box') {
      this.segmentBox(b, a, out);
      out.normal.scale(-1);
    } else this.roundRound(a, b, out);
  }
}
