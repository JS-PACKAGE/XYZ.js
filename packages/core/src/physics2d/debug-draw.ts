import {
  Graphics2D,
  GraphicsPath2D,
  type GraphicsInstruction2D,
} from '../graphics2d/index.js';
import { logger } from '../logger.js';
import type { PhysicsDebugSnapshot, PhysicsWorld2D } from './world.js';

export interface PhysicsDebugDrawOptions {
  /** Draw collider outlines (default true). */
  colliders?: boolean;
  /** Draw contact points and normals (default true). */
  contacts?: boolean;
  /** Draw joint anchors and the links between them (default true). */
  joints?: boolean;
  /** Draw each collider's AABB (default false). */
  bounds?: boolean;
  /** zIndex of the overlay sprite (default 10000). */
  zIndex?: number;
  /**
   * Only draw what touches this world-space rectangle. The overlay raster covers everything drawn,
   * so give a region (for example the visible area) when bodies can fly far outside it.
   */
  region?: { x: number; y: number; width: number; height: number };
}

/** Resolved drawing switches shared by {@link PhysicsDebugDraw2D.instructions}. */
export interface PhysicsDebugDrawConfig {
  colliders: boolean;
  contacts: boolean;
  joints: boolean;
  bounds: boolean;
  region: PhysicsDebugDrawOptions['region'];
}

function resolve(options: PhysicsDebugDrawOptions): PhysicsDebugDrawConfig {
  return {
    colliders: options.colliders ?? true,
    contacts: options.contacts ?? true,
    joints: options.joints ?? true,
    bounds: options.bounds ?? false,
    region: options.region ? { ...options.region } : undefined,
  };
}

const colors = Object.freeze({
  staticBody: '#7aa2ff',
  dynamicBody: '#5be37d',
  sleeping: '#8a8f98',
  sensor: '#ffd34a',
  contact: '#ff5a5a',
  joint: '#4de3e3',
  bounds: '#ffffff',
});

/**
 * Overlay of a PhysicsWorld2D drawn through the retained {@link Graphics2D} raster, so it works
 * on every backend. Colours: static blue, awake dynamic green, sleeping gray, sensor yellow,
 * contacts red, joints cyan. It re-rasterizes on {@link refresh}, which is meant for debugging
 * rather than per-frame production use; the raster covers the bounding box of everything drawn,
 * so a world that spans a huge area can exceed the Graphics2D size budget and reject.
 */
export class PhysicsDebugDraw2D {
  readonly display: Graphics2D;
  private readonly options: PhysicsDebugDrawConfig;
  private refreshing = false;
  private disposed = false;

  private constructor(
    private readonly world: PhysicsWorld2D,
    display: Graphics2D,
    options: PhysicsDebugDrawOptions,
  ) {
    this.display = display;
    this.options = resolve(options);
  }

  /** Creates the overlay; add `debug.display` to the Scene and call `refresh()` as needed. */
  static async create(
    world: PhysicsWorld2D,
    options: PhysicsDebugDrawOptions = {},
  ): Promise<PhysicsDebugDraw2D> {
    const config = resolve(options);
    const display = await Graphics2D.create(
      PhysicsDebugDraw2D.instructions(world.debugSnapshot(), config),
      { zIndex: options.zIndex ?? 10000, anchor: [0, 0] },
    );
    return new PhysicsDebugDraw2D(world, display, options);
  }

  get destroyed(): boolean {
    return this.disposed;
  }
  get visible(): boolean {
    return this.display.visible;
  }
  set visible(value: boolean) {
    this.display.visible = value;
  }

  /**
   * Redraws from the world's current state. Calls made while a previous redraw is still
   * rasterizing are skipped (resolving immediately), so calling every frame cannot queue work.
   */
  async refresh(): Promise<void> {
    if (this.disposed || this.refreshing || !this.display.visible) return;
    this.refreshing = true;
    try {
      await this.display.setInstructions(
        PhysicsDebugDraw2D.instructions(
          this.world.debugSnapshot(),
          this.options,
        ),
      );
    } catch (error) {
      if (!this.disposed) logger.error('Physics debug draw failed.', error);
    } finally {
      this.refreshing = false;
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.display.destroy();
  }

  /** Pure conversion from a snapshot to Graphics2D instructions. */
  static instructions(
    snapshot: PhysicsDebugSnapshot,
    options: PhysicsDebugDrawConfig,
  ): GraphicsInstruction2D[] {
    const result: GraphicsInstruction2D[] = [];
    const region = options.region;
    const overlaps = (
      minX: number,
      minY: number,
      maxX: number,
      maxY: number,
    ): boolean =>
      !region ||
      (maxX >= region.x &&
        minX <= region.x + region.width &&
        maxY >= region.y &&
        minY <= region.y + region.height);
    const stroke = (paint: string, width = 1.5) => ({ paint, width });
    const line = (
      points: readonly (readonly [number, number])[],
      paint: string,
      closed = false,
    ): void => {
      const commands: ConstructorParameters<typeof GraphicsPath2D>[0] =
        points.map(([x, y], index) => ({
          op: index === 0 ? 'moveTo' : 'lineTo',
          x,
          y,
        }));
      result.push({
        path: new GraphicsPath2D(
          closed ? [...commands, { op: 'closePath' }] : commands,
        ),
        stroke: stroke(paint),
      });
    };
    if (options.colliders)
      for (const shape of snapshot.shapes) {
        if (!overlaps(...shape.bounds)) continue;
        const paint = shape.sensor
          ? colors.sensor
          : !shape.dynamic
            ? colors.staticBody
            : shape.sleeping
              ? colors.sleeping
              : colors.dynamicBody;
        if (shape.kind === 'circle') {
          result.push({
            path: new GraphicsPath2D([
              { op: 'circle', x: shape.x, y: shape.y, radius: shape.radius },
            ]),
            stroke: stroke(paint),
          });
        } else {
          const points: [number, number][] = [];
          for (let i = 0; i < shape.points.length; i += 2)
            points.push([shape.points[i], shape.points[i + 1]]);
          line(points, paint, true);
        }
      }
    if (options.bounds)
      for (const shape of snapshot.shapes) {
        const [minX, minY, maxX, maxY] = shape.bounds;
        if (!overlaps(minX, minY, maxX, maxY)) continue;
        result.push({
          path: new GraphicsPath2D([
            {
              op: 'rect',
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            },
          ]),
          stroke: stroke(colors.bounds, 1),
          alpha: 0.35,
        });
      }
    if (options.contacts)
      for (const contact of snapshot.contacts)
        for (const [x, y] of contact.points) {
          if (!overlaps(x, y, x, y)) continue;
          result.push({
            path: new GraphicsPath2D([{ op: 'circle', x, y, radius: 2.5 }]),
            fill: colors.contact,
          });
          line(
            [
              [x, y],
              [x + contact.normal[0] * 12, y + contact.normal[1] * 12],
            ],
            colors.contact,
          );
        }
    if (options.joints)
      for (const joint of snapshot.joints) {
        const [ax, ay, bx, by] = joint.anchors;
        if (!overlaps(ax, ay, ax, ay) || !overlaps(bx, by, bx, by)) continue;
        line(
          [
            [ax, ay],
            [bx, by],
          ],
          colors.joint,
        );
        for (const [x, y] of [
          [ax, ay],
          [bx, by],
        ] as const)
          result.push({
            path: new GraphicsPath2D([{ op: 'circle', x, y, radius: 3 }]),
            fill: colors.joint,
          });
      }
    // Graphics2D rejects an empty list and an empty path has no bounds; keep one invisible dot.
    if (!result.length)
      result.push({
        path: new GraphicsPath2D([{ op: 'circle', x: 0, y: 0, radius: 0.5 }]),
        fill: '#ffffff',
        alpha: 0,
      });
    return result;
  }
}
