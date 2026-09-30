import { Vector2 } from '../../../math/src/index.js';
import type { Rect2D } from './contracts.js';
import { rendering2dLimits } from '../../../../src/data/rendering2d.js';

export type HitAreaKind2D = 'rectangle' | 'circle' | 'polygon';

/** Immutable local-space picking geometry. Polygon edges are included. */
export class HitArea2D {
  readonly kind: HitAreaKind2D;
  readonly bounds: Readonly<Rect2D>;
  readonly points: readonly (readonly [number, number])[];
  private readonly radius: number;
  private constructor(
    kind: HitAreaKind2D,
    bounds: Rect2D,
    points: readonly (readonly [number, number])[],
    radius = 0,
  ) {
    this.kind = kind;
    this.bounds = Object.freeze(bounds);
    this.points = Object.freeze(points);
    this.radius = radius;
    Object.freeze(this);
  }
  static rectangle(rect: Rect2D): HitArea2D {
    if (
      ![
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        rect.x + rect.width,
        rect.y + rect.height,
      ].every(
        (value) =>
          Number.isFinite(value) &&
          Math.abs(value) <= rendering2dLimits.coordinate,
      ) ||
      rect.width < 0 ||
      rect.height < 0
    )
      throw new RangeError(
        'Hit area rectangle must have finite coordinates and nonnegative dimensions.',
      );
    return new HitArea2D('rectangle', { ...rect }, []);
  }
  static circle(x: number, y: number, radius: number): HitArea2D {
    if (
      ![x, y, radius, x - radius, y - radius, x + radius, y + radius].every(
        (value) =>
          Number.isFinite(value) &&
          Math.abs(value) <= rendering2dLimits.coordinate,
      ) ||
      radius < 0
    )
      throw new RangeError(
        'Hit area circle must have finite coordinates and a nonnegative radius.',
      );
    return new HitArea2D(
      'circle',
      { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 },
      [],
      radius,
    );
  }
  static polygon(points: readonly (readonly [number, number])[]): HitArea2D {
    if (points.length < 3 || points.length > rendering2dLimits.pathCommands)
      throw new RangeError(
        `Hit area polygon requires 3–${rendering2dLimits.pathCommands} points.`,
      );
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    const snapshot = points.map((point) => {
      if (!Array.isArray(point) || point.length !== 2)
        throw new TypeError(
          'Hit area polygon points must be coordinate pairs.',
        );
      const [x, y] = point;
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        Math.abs(x) > rendering2dLimits.coordinate ||
        Math.abs(y) > rendering2dLimits.coordinate
      )
        throw new RangeError(
          'Hit area polygon coordinates must be bounded and finite.',
        );
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      return Object.freeze([x, y] as const);
    });
    return new HitArea2D(
      'polygon',
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      snapshot,
    );
  }
  containsPoint(point: Vector2): boolean {
    const { x, y } = point;
    const b = this.bounds;
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < b.x ||
      y < b.y ||
      x > b.x + b.width ||
      y > b.y + b.height
    )
      return false;
    if (this.kind === 'rectangle') return b.width > 0 && b.height > 0;
    if (this.kind === 'circle')
      return (
        this.radius > 0 &&
        (x - b.x - this.radius) ** 2 + (y - b.y - this.radius) ** 2 <=
          this.radius ** 2
      );
    let inside = false;
    for (
      let i = 0, j = this.points.length - 1;
      i < this.points.length;
      j = i++
    ) {
      const [ax, ay] = this.points[j],
        [bx, by] = this.points[i];
      const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
      if (
        cross === 0 &&
        x >= Math.min(ax, bx) &&
        x <= Math.max(ax, bx) &&
        y >= Math.min(ay, by) &&
        y <= Math.max(ay, by)
      )
        return true;
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
        inside = !inside;
    }
    return inside;
  }
}
