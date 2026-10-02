import { physicsDefaults } from '../../../../src/data/world2d.js';
import { ShapeGeometry } from './collider.js';
import { collide, Manifold } from './narrowphase.js';
import type { GameObject } from '../game-object.js';
import type { RigidBody2D } from './body.js';

/** @internal A rigid sweep sampled without editing the public mutable owner pose. */
export class ShapeMotion2D {
  readonly sample: ShapeGeometry;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  spin = 0;
  radius = 0;
  constructor(readonly geometry: ShapeGeometry) {
    this.sample = new ShapeGeometry(geometry.collider);
  }
  set(owner: GameObject, body?: RigidBody2D): void {
    const moving = body && body.type !== 'static' && !body.isSleeping;
    this.setExplicit(
      owner.position.x,
      owner.position.y,
      moving ? body.velocity.x : 0,
      moving ? body.velocity.y : 0,
      moving && !body.lockRotation ? body.angularVelocity : 0,
    );
  }
  setExplicit(x: number, y: number, vx: number, vy: number, spin = 0): void {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.spin = spin;
    const g = this.geometry;
    // Circles rotate only their offset center; their radius is rotation invariant.
    this.radius =
      g.collider.kind === 'circle'
        ? Math.hypot(g.x - x, g.y - y)
        : Math.hypot(
            Math.max(Math.abs(g.minX - x), Math.abs(g.maxX - x)),
            Math.max(Math.abs(g.minY - y), Math.abs(g.maxY - y)),
          );
  }
  at(time: number): ShapeGeometry {
    if (time === 0) return this.geometry;
    const g = this.geometry,
      out = this.sample,
      c = Math.cos(this.spin * time),
      s = Math.sin(this.spin * time),
      x = this.x + this.vx * time,
      y = this.y + this.vy * time;
    out.x = x + c * (g.x - this.x) - s * (g.y - this.y);
    out.y = y + s * (g.x - this.x) + c * (g.y - this.y);
    out.radius = g.radius;
    if (g.collider.kind === 'circle') {
      out.minX = out.x - g.radius;
      out.maxX = out.x + g.radius;
      out.minY = out.y - g.radius;
      out.maxY = out.y + g.radius;
    } else {
      out.minX = out.minY = Infinity;
      out.maxX = out.maxY = -Infinity;
      for (let i = 0; i < g.points.length; i += 2) {
        const px = g.points[i] - this.x,
          py = g.points[i + 1] - this.y,
          qx = x + c * px - s * py,
          qy = y + s * px + c * py;
        out.points[i] = qx;
        out.points[i + 1] = qy;
        out.minX = Math.min(out.minX, qx);
        out.maxX = Math.max(out.maxX, qx);
        out.minY = Math.min(out.minY, qy);
        out.maxY = Math.max(out.maxY, qy);
      }
    }
    return out;
  }
}

/** SAT gap is a lower bound on true distance and therefore proves a collision-free prefix. */
export class ShapeSeparation2D {
  distance = -Infinity;
  readonly manifold = new Manifold();
  private axis(
    a: ShapeGeometry,
    b: ShapeGeometry,
    nx: number,
    ny: number,
  ): void {
    const length = Math.hypot(nx, ny);
    if (length < 1e-12) return;
    nx /= length;
    ny /= length;
    let minA = Infinity,
      maxA = -Infinity,
      minB = Infinity,
      maxB = -Infinity;
    if (a.collider.kind === 'circle') {
      const p = a.x * nx + a.y * ny;
      minA = p - a.radius;
      maxA = p + a.radius;
    } else
      for (let i = 0; i < a.points.length; i += 2) {
        const p = a.points[i] * nx + a.points[i + 1] * ny;
        minA = Math.min(minA, p);
        maxA = Math.max(maxA, p);
      }
    if (b.collider.kind === 'circle') {
      const p = b.x * nx + b.y * ny;
      minB = p - b.radius;
      maxB = p + b.radius;
    } else
      for (let i = 0; i < b.points.length; i += 2) {
        const p = b.points[i] * nx + b.points[i + 1] * ny;
        minB = Math.min(minB, p);
        maxB = Math.max(maxB, p);
      }
    const forward = minB - maxA,
      backward = minA - maxB,
      gap = Math.max(forward, backward);
    if (gap > this.distance) {
      this.distance = gap;
      const sign = forward >= backward ? 1 : -1;
      this.manifold.nx = nx * sign;
      this.manifold.ny = ny * sign;
    }
  }
  measure(a: ShapeGeometry, b: ShapeGeometry): number {
    this.distance = -Infinity;
    for (let side = 0; side < 2; side++) {
      const p = (side === 0 ? a : b).points;
      for (let i = 0; i < p.length; i += 2) {
        const j = (i + 2) % p.length;
        this.axis(a, b, p[j + 1] - p[i + 1], p[i] - p[j]);
      }
    }
    if (a.collider.kind === 'circle' && b.collider.kind === 'circle')
      this.axis(a, b, b.x - a.x, b.y - a.y);
    else if (a.collider.kind === 'circle' || b.collider.kind === 'circle') {
      const circle = a.collider.kind === 'circle' ? a : b,
        polygon = circle === a ? b : a;
      let nearest = Infinity,
        dx = 1,
        dy = 0;
      for (let i = 0; i < polygon.points.length; i += 2) {
        const x = polygon.points[i] - circle.x,
          y = polygon.points[i + 1] - circle.y,
          distance = x * x + y * y;
        if (distance < nearest) {
          nearest = distance;
          dx = x;
          dy = y;
        }
      }
      this.axis(a, b, dx, dy);
    }
    if (this.distance === -Infinity) this.axis(a, b, 1, 0);
    this.contact(a, b);
    return this.distance;
  }
  private contact(a: ShapeGeometry, b: ShapeGeometry): void {
    const m = this.manifold;
    if (this.distance <= 0 && collide(a, b, m)) return;
    const nx = m.nx,
      ny = m.ny,
      tx = -ny,
      ty = nx;
    let planeA = -Infinity,
      planeB = Infinity;
    if (a.collider.kind === 'circle') planeA = a.x * nx + a.y * ny + a.radius;
    else
      for (let i = 0; i < a.points.length; i += 2)
        planeA = Math.max(planeA, a.points[i] * nx + a.points[i + 1] * ny);
    if (b.collider.kind === 'circle') planeB = b.x * nx + b.y * ny - b.radius;
    else
      for (let i = 0; i < b.points.length; i += 2)
        planeB = Math.min(planeB, b.points[i] * nx + b.points[i + 1] * ny);
    let minA = Infinity,
      maxA = -Infinity,
      minB = Infinity,
      maxB = -Infinity;
    if (a.collider.kind === 'circle') minA = maxA = a.x * tx + a.y * ty;
    else
      for (let i = 0; i < a.points.length; i += 2) {
        if (Math.abs(a.points[i] * nx + a.points[i + 1] * ny - planeA) > 1e-7)
          continue;
        const p = a.points[i] * tx + a.points[i + 1] * ty;
        minA = Math.min(minA, p);
        maxA = Math.max(maxA, p);
      }
    if (b.collider.kind === 'circle') minB = maxB = b.x * tx + b.y * ty;
    else
      for (let i = 0; i < b.points.length; i += 2) {
        if (Math.abs(b.points[i] * nx + b.points[i + 1] * ny - planeB) > 1e-7)
          continue;
        const p = b.points[i] * tx + b.points[i + 1] * ty;
        minB = Math.min(minB, p);
        maxB = Math.max(maxB, p);
      }
    const low = Math.max(minA, minB),
      high = Math.min(maxA, maxB),
      tangent =
        low <= high
          ? (low + high) / 2
          : (Math.min(maxA, maxB) + Math.max(minA, minB)) / 2,
      normal = (planeA + planeB) / 2;
    m.count = 1;
    m.penetration = Math.max(0, -this.distance);
    m.points[0].set(nx * normal + tx * tangent, ny * normal + ty * tangent);
  }
}

/** Bounded rigid conservative advancement; exhaustion never fabricates a contact. */
export class ContinuousCollision2D {
  readonly separation = new ShapeSeparation2D();
  get manifold(): Manifold {
    return this.separation.manifold;
  }
  iterations = 0;
  exhausted = false;
  safeTime = Infinity;
  private overlaps(
    a: ShapeMotion2D,
    b: ShapeMotion2D,
    duration: number,
  ): boolean {
    const ga = a.geometry,
      gb = b.geometry,
      ma = Math.min(2 * a.radius, Math.abs(a.spin) * a.radius * duration),
      mb = Math.min(2 * b.radius, Math.abs(b.spin) * b.radius * duration),
      tolerance = physicsDefaults.sweepTolerance;
    return (
      ga.minX + Math.min(0, a.vx * duration) - ma <=
        gb.maxX + Math.max(0, b.vx * duration) + mb + tolerance &&
      ga.maxX + Math.max(0, a.vx * duration) + ma + tolerance >=
        gb.minX + Math.min(0, b.vx * duration) - mb &&
      ga.minY + Math.min(0, a.vy * duration) - ma <=
        gb.maxY + Math.max(0, b.vy * duration) + mb + tolerance &&
      ga.maxY + Math.max(0, a.vy * duration) + ma + tolerance >=
        gb.minY + Math.min(0, b.vy * duration) - mb
    );
  }
  timeOfImpact(
    a: ShapeMotion2D,
    b: ShapeMotion2D,
    duration: number,
    budget: number,
    tolerance = physicsDefaults.sweepTolerance,
  ): number {
    this.iterations = 0;
    this.exhausted = false;
    this.safeTime = Infinity;
    if (!this.overlaps(a, b, duration)) return Infinity;
    const vx = a.vx - b.vx,
      vy = a.vy - b.vy,
      rotational = Math.abs(a.spin) * a.radius + Math.abs(b.spin) * b.radius;
    if (Math.hypot(vx, vy) + rotational < 1e-12) return Infinity;
    let time = 0;
    while (this.iterations < budget) {
      this.iterations++;
      const distance = this.separation.measure(a.at(time), b.at(time)),
        m = this.manifold,
        rate = vx * m.nx + vy * m.ny + rotational;
      if (distance <= tolerance) {
        const p = m.points[0],
          relative =
            (b.vx -
              b.spin * (p.y - b.y - b.vy * time) -
              a.vx +
              a.spin * (p.y - a.y - a.vy * time)) *
              m.nx +
            (b.vy +
              b.spin * (p.x - b.x - b.vx * time) -
              a.vy -
              a.spin * (p.x - a.x - a.vx * time)) *
              m.ny;
        if (time > 0 || relative < -1e-8) return time;
        if (rotational <= 1e-12 || rate <= 1e-12) return Infinity;
        this.exhausted = true;
        this.safeTime = time;
        return Infinity;
      }
      if (rate <= 1e-12) return Infinity;
      const advance = (distance - tolerance * 0.5) / rate;
      if (time + advance > duration) return Infinity;
      time += advance;
    }
    this.exhausted = true;
    this.safeTime = time;
    return Infinity;
  }
}
