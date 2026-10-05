import { Vector3 } from '../../../math/src/index.js';
import type { Shape3D } from './collider.js';
import { physicsProfiles } from '../../../../src/data/physics-profiles.js';
export type PhysicsDebugSegment3D = Readonly<{
  kind: 'collider' | 'contact' | 'joint';
  from: readonly [number, number, number];
  to: readonly [number, number, number];
}>;
export interface PhysicsDebugSnapshot3D {
  readonly segments: readonly PhysicsDebugSegment3D[];
}
/** Snapshot builder is used only on explicit debug requests, never in the simulation hot path. */
export class PhysicsDebugSnapshotBuilder3D {
  private readonly segments: PhysicsDebugSegment3D[] = [];
  line(
    a: Readonly<Vector3>,
    b: Readonly<Vector3>,
    kind: PhysicsDebugSegment3D['kind'] = 'collider',
  ): void {
    if (this.segments.length >= physicsProfiles.debug.maxSegments)
      throw new RangeError('Physics debug segment bound exceeded.');
    this.segments.push(
      Object.freeze({
        kind,
        from: Object.freeze([a.x, a.y, a.z] as [number, number, number]),
        to: Object.freeze([b.x, b.y, b.z] as [number, number, number]),
      }),
    );
  }
  shape(shape: Shape3D): void {
    if (shape.collider.kind === 'compound') {
      for (const child of shape.children) this.shape(child);
      return;
    }
    if (shape.collider.kind === 'box') {
      for (let i = 0; i < 8; i++)
        for (const bit of [1, 2, 4])
          if (!(i & bit))
            this.line(shape.vertices[i]!, shape.vertices[i | bit]!);
      return;
    }
    if (shape.collider.kind === 'mesh') {
      for (const t of shape.triangles) {
        this.line(t.a, t.b);
        this.line(t.b, t.c);
        this.line(t.c, t.a);
      }
      return;
    }
    if (shape.collider.kind === 'plane') {
      const n = shape.normal,
        u = new Vector3(
          Math.abs(n.y) < 0.9 ? 0 : 1,
          Math.abs(n.y) < 0.9 ? 1 : 0,
          0,
        )
          .cross(n)
          .normalize()
          .scale(physicsProfiles.debug.planeExtent),
        v = n.clone().cross(u);
      const corners = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(
        ([a, b]) =>
          new Vector3(
            shape.center.x + u.x * a! + v.x * b!,
            shape.center.y + u.y * a! + v.y * b!,
            shape.center.z + u.z * a! + v.z * b!,
          ),
      );
      for (let i = 0; i < 4; i++) this.line(corners[i]!, corners[(i + 1) % 4]!);
      return;
    }
    const capsule = shape.collider.kind === 'capsule',
      count = physicsProfiles.debug.circleSegments;
    for (const pair of [
      [0, 1],
      [1, 2],
      [2, 0],
    ]) {
      const u = shape.axes[pair[0]!]!,
        v = shape.axes[pair[1]!]!;
      const points: Vector3[] = [];
      for (let i = 0; i <= count; i++) {
        const angle = (i / count) * Math.PI * 2,
          a = Math.cos(angle),
          b = Math.sin(angle);
        const y = u.y * a + v.y * b;
        const localY = (pair[0] === 1 ? a : 0) + (pair[1] === 1 ? b : 0);
        const center = capsule
          ? localY >= 0
            ? shape.end
            : shape.start
          : shape.center;
        points.push(
          new Vector3(
            center.x + shape.radius * (u.x * a + v.x * b),
            center.y + shape.radius * y,
            center.z + shape.radius * (u.z * a + v.z * b),
          ),
        );
      }
      for (let i = 0; i < count; i++) this.line(points[i]!, points[i + 1]!);
    }
    if (capsule) {
      const u = shape.axes[0]!,
        v = shape.axes[2]!;
      for (let i = 0; i < count; i++) {
        const a = Math.cos((i / count) * Math.PI * 2),
          b = Math.sin((i / count) * Math.PI * 2);
        const offset = new Vector3(
          shape.radius * (u.x * a + v.x * b),
          shape.radius * (u.y * a + v.y * b),
          shape.radius * (u.z * a + v.z * b),
        );
        const p = shape.start.clone().add(offset),
          q = shape.end.clone().add(offset);
        this.line(p, q);
        const next = ((i + 1) / count) * Math.PI * 2;
        const r = new Vector3(
          shape.start.x +
            shape.radius * (u.x * Math.cos(next) + v.x * Math.sin(next)),
          shape.start.y +
            shape.radius * (u.y * Math.cos(next) + v.y * Math.sin(next)),
          shape.start.z +
            shape.radius * (u.z * Math.cos(next) + v.z * Math.sin(next)),
        );
        this.line(p, r);
      }
    }
  }
  finish(): PhysicsDebugSnapshot3D {
    return Object.freeze({ segments: Object.freeze(this.segments) });
  }
}
