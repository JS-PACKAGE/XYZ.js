import { Vector3 } from '../../math/src/index.js';
import { lightSelectionLimits } from '../../../src/data/lights.js';
import { PointLight, SpotLight } from './lights.js';
import type { Scene } from './scene.js';
import type { Mesh } from './mesh.js';
import { sphereIsFinite, type BoundingSphere3D } from './render-bounds.js';
import { hypot3 } from '../../math/src/hypot.js';

export interface LightSelectionOptions {
  pointLights?: number;
  spotLights?: number;
  /** 'select' keeps highest priority/contribution; 'error' rejects a draw that exceeds its cap. */
  exceedPolicy?: 'select' | 'error';
}

export interface LightSelectionCount {
  pool: number;
  selected: number;
  /** Out of range/cone, black, or zero intensity. */
  culled: number;
  /** Relevant lights omitted by the per-draw cap (not spatially culled). */
  overflow: number;
}

export interface SelectedLights {
  readonly pointLights: readonly PointLight[];
  readonly spotLights: readonly SpotLight[];
}

export interface LightSelectionStats {
  draws: number;
  readonly points: LightSelectionCount;
  readonly spots: LightSelectionCount;
}

/** Reject unbounded pools and invalid mutable inputs before rendering. */
export function validateLightPool(scene: Scene): void {
  if (!Array.isArray(scene.pointLights) || !Array.isArray(scene.spotLights))
    throw new TypeError('Scene pointLights and spotLights must be arrays.');
  if (
    scene.pointLights.length > lightSelectionLimits.poolPerType ||
    scene.spotLights.length > lightSelectionLimits.poolPerType
  )
    throw new RangeError(
      `Scene light pools cannot exceed ${lightSelectionLimits.poolPerType} lights per type.`,
    );
  for (const light of scene.pointLights) {
    if (!(light instanceof PointLight) || light instanceof SpotLight)
      throw new TypeError(
        'Scene pointLights must contain PointLight objects, not SpotLight objects.',
      );
    light.validate();
  }
  for (const light of scene.spotLights) {
    if (!(light instanceof SpotLight))
      throw new TypeError('Scene spotLights must contain SpotLight objects.');
    light.validate();
  }
}

function capacity(value: number, maximum: number): number {
  if (!Number.isInteger(value) || value < 0 || value > maximum)
    throw new RangeError(
      `Light selection capacity must be an integer in [0, ${maximum}].`,
    );
  return value;
}

/** Pools smaller than this are scanned linearly; the grid would not pay for itself. */
const gridMinimumLights = 32;
/** Queries touching more cells than this scan linearly instead. */
const gridMaximumQueryCells = 64;

/**
 * Uniform hash grid over finite-range light bounds, rebuilt per presentation (when nothing moves
 * lights). Queries return a conservative candidate superset in pool order, so exact selection
 * over the candidates matches a full scan; unbounded/oversized lights are always candidates.
 */
class LightGrid {
  private cell = 0;
  private readonly always: number[] = [];
  private readonly cells = new Map<number, number[]>();
  private readonly spare: number[][] = [];
  private readonly ranges: number[] = [];
  private stamps = new Uint32Array(0);
  private query = 0;
  readonly candidates: number[] = [];

  private static key(x: number, y: number, z: number): number {
    // Collisions only merge buckets: extra candidates, never missed ones.
    return (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  }

  build(lights: readonly PointLight[]): void {
    for (const bucket of this.cells.values()) {
      bucket.length = 0;
      this.spare.push(bucket);
    }
    this.cells.clear();
    this.always.length = this.ranges.length = 0;
    if (this.stamps.length < lights.length) {
      this.stamps = new Uint32Array(lights.length);
      this.query = 0;
    }
    for (const light of lights)
      if (light.range > 0) this.ranges.push(light.range);
    this.ranges.sort((a, b) => a - b);
    // Twice the median range keeps typical lights within 2×2×2 cells.
    this.cell = (this.ranges[this.ranges.length >> 1] ?? 0) * 2;
    const cell = this.cell;
    for (let index = 0; index < lights.length; index++) {
      const light = lights[index]!,
        p = light.position,
        range = light.range;
      if (!(cell > 0 && range > 0 && range <= cell * 2)) {
        this.always.push(index);
        continue;
      }
      const pad =
        (range + Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.z) + cell) * 1e-9;
      const x0 = Math.floor((p.x - range - pad) / cell),
        x1 = Math.floor((p.x + range + pad) / cell),
        y0 = Math.floor((p.y - range - pad) / cell),
        y1 = Math.floor((p.y + range + pad) / cell),
        z0 = Math.floor((p.z - range - pad) / cell),
        z1 = Math.floor((p.z + range + pad) / cell);
      if (
        !Number.isFinite(x0 + x1 + y0 + y1 + z0 + z1) ||
        (x1 - x0 + 1) * (y1 - y0 + 1) * (z1 - z0 + 1) > 64
      ) {
        this.always.push(index);
        continue;
      }
      for (let x = x0; x <= x1; x++)
        for (let y = y0; y <= y1; y++)
          for (let z = z0; z <= z1; z++) {
            const key = LightGrid.key(x, y, z);
            let bucket = this.cells.get(key);
            if (!bucket) this.cells.set(key, (bucket = this.spare.pop() ?? []));
            bucket.push(index);
          }
    }
  }

  /** Fills `candidates` (ascending pool indices); false means scan the whole pool instead. */
  gather(x: number, y: number, z: number, radius: number): boolean {
    const cell = this.cell;
    if (!(cell > 0)) return false;
    const pad =
      (radius + Math.abs(x) + Math.abs(y) + Math.abs(z) + cell) * 1e-9;
    const x0 = Math.floor((x - radius - pad) / cell),
      x1 = Math.floor((x + radius + pad) / cell),
      y0 = Math.floor((y - radius - pad) / cell),
      y1 = Math.floor((y + radius + pad) / cell),
      z0 = Math.floor((z - radius - pad) / cell),
      z1 = Math.floor((z + radius + pad) / cell);
    if (
      !Number.isFinite(x0 + x1 + y0 + y1 + z0 + z1) ||
      (x1 - x0 + 1) * (y1 - y0 + 1) * (z1 - z0 + 1) > gridMaximumQueryCells
    )
      return false;
    if (++this.query === 0xffffffff) {
      this.stamps.fill(0);
      this.query = 1;
    }
    const stamp = this.query,
      stamps = this.stamps,
      out = this.candidates;
    out.length = 0;
    for (const index of this.always) {
      stamps[index] = stamp;
      out.push(index);
    }
    for (let cx = x0; cx <= x1; cx++)
      for (let cy = y0; cy <= y1; cy++)
        for (let cz = z0; cz <= z1; cz++) {
          const bucket = this.cells.get(LightGrid.key(cx, cy, cz));
          if (bucket)
            for (const index of bucket)
              if (stamps[index] !== stamp) {
                stamps[index] = stamp;
                out.push(index);
              }
        }
    // Pool order keeps capped insertion identical to the full scan.
    for (let i = 1; i < out.length; i++) {
      const value = out[i]!;
      let j = i - 1;
      while (j >= 0 && out[j]! > value) {
        out[j + 1] = out[j]!;
        j--;
      }
      out[j + 1] = value;
    }
    return true;
  }
}

/** One scene-pool validation per update; bounded, allocation-free selection for each draw. */
export class SpatialLightSelector implements SelectedLights {
  readonly pointLights: PointLight[] = [];
  readonly spotLights: SpotLight[] = [];
  readonly stats: LightSelectionStats = {
    draws: 0,
    points: { pool: 0, selected: 0, culled: 0, overflow: 0 },
    spots: { pool: 0, selected: 0, culled: 0, overflow: 0 },
  };
  /** Aggregated per-draw work since update; pool is scene count, not a sum over draws. */
  readonly frameStats: LightSelectionStats = {
    draws: 0,
    points: { pool: 0, selected: 0, culled: 0, overflow: 0 },
    spots: { pool: 0, selected: 0, culled: 0, overflow: 0 },
  };
  readonly pointCapacity: number;
  readonly spotCapacity: number;
  readonly exceedPolicy: 'select' | 'error';
  private scene: Scene | undefined;
  private readonly identities = new Set<number>();
  private readonly pointScores = new Float64Array(
    lightSelectionLimits.pointLights,
  );
  private readonly spotScores = new Float64Array(
    lightSelectionLimits.spotLights,
  );
  private readonly sphere: BoundingSphere3D = { x: 0, y: 0, z: 0, radius: 0 };
  private readonly center = new Vector3();
  private readonly pointGrid = new LightGrid();
  private readonly spotGrid = new LightGrid();
  /** Presentation pass the grids were built in; 0 when they must not be used. */
  private gridPass = 0;
  private pointGridded = false;
  private spotGridded = false;

  constructor(options: LightSelectionOptions = {}) {
    this.pointCapacity = capacity(
      options.pointLights ?? lightSelectionLimits.pointLights,
      lightSelectionLimits.pointLights,
    );
    this.spotCapacity = capacity(
      options.spotLights ?? lightSelectionLimits.spotLights,
      lightSelectionLimits.spotLights,
    );
    this.exceedPolicy = options.exceedPolicy ?? 'select';
    if (this.exceedPolicy !== 'select' && this.exceedPolicy !== 'error')
      throw new RangeError('Light exceedPolicy must be select or error.');
  }

  update(scene: Scene): void {
    this.scene = undefined;
    validateLightPool(scene);
    this.identities.clear();
    for (const pool of [scene.pointLights, scene.spotLights])
      for (const light of pool) {
        if (this.identities.has(light.id))
          throw new RangeError(
            'Scene light pools cannot contain duplicate light identities.',
          );
        this.identities.add(light.id);
      }
    this.scene = scene;
    // Rendering moves no lights, so a grid built inside a presentation stays exact until it ends.
    this.gridPass = scene.presentationPass;
    this.pointGridded =
      this.gridPass !== 0 && scene.pointLights.length >= gridMinimumLights;
    this.spotGridded =
      this.gridPass !== 0 && scene.spotLights.length >= gridMinimumLights;
    if (this.pointGridded) this.pointGrid.build(scene.pointLights);
    if (this.spotGridded) this.spotGrid.build(scene.spotLights);
    this.pointLights.length = this.spotLights.length = 0;
    this.stats.draws = this.frameStats.draws = 0;
    for (const stats of [this.stats, this.frameStats]) {
      stats.points.pool = scene.pointLights.length;
      stats.spots.pool = scene.spotLights.length;
      stats.points.selected = stats.points.culled = stats.points.overflow = 0;
      stats.spots.selected = stats.spots.culled = stats.spots.overflow = 0;
    }
  }
  /** Release scene/borrowed light references without destroying caller-owned lights. */
  clear(): void {
    this.scene = undefined;
    this.pointLights.length = this.spotLights.length = 0;
    this.identities.clear();
    this.stats.draws = this.frameStats.draws = 0;
    this.stats.points.pool =
      this.stats.points.selected =
      this.stats.points.culled =
      this.stats.points.overflow =
        0;
    this.stats.spots.pool =
      this.stats.spots.selected =
      this.stats.spots.culled =
      this.stats.spots.overflow =
        0;
    this.frameStats.points.pool =
      this.frameStats.points.selected =
      this.frameStats.points.culled =
      this.frameStats.points.overflow =
        0;
    this.frameStats.spots.pool =
      this.frameStats.spots.selected =
      this.frameStats.spots.culled =
      this.frameStats.spots.overflow =
        0;
  }

  selectMesh(mesh: Mesh): this {
    mesh.getWorldBoundingSphere(this.sphere);
    if (!sphereIsFinite(this.sphere)) {
      // Unreliable bounds must not discard a light that might reach the mesh.
      this.center.set(0, 0, 0);
      return this.select(this.center, Number.MAX_VALUE);
    }
    this.center.set(this.sphere.x, this.sphere.y, this.sphere.z);
    return this.select(this.center, this.sphere.radius);
  }

  select(center: Vector3, radius: number): this {
    if (!this.scene)
      throw new Error('Update the light selector before selecting a draw.');
    if (!(center instanceof Vector3))
      throw new TypeError('Light selection center must be a Vector3.');
    if (
      !Number.isFinite(center.x) ||
      !Number.isFinite(center.y) ||
      !Number.isFinite(center.z) ||
      !Number.isFinite(radius) ||
      radius < 0
    )
      throw new RangeError(
        'Light selection requires a finite world sphere with nonnegative radius.',
      );
    this.selectType(
      this.scene.pointLights,
      this.pointLights,
      this.pointScores,
      this.pointCapacity,
      center,
      radius,
      this.stats.points,
      this.pointGridded ? this.pointGrid : undefined,
    );
    this.selectType(
      this.scene.spotLights,
      this.spotLights,
      this.spotScores,
      this.spotCapacity,
      center,
      radius,
      this.stats.spots,
      this.spotGridded ? this.spotGrid : undefined,
    );
    this.stats.draws = 1;
    this.frameStats.draws++;
    this.frameStats.points.selected += this.stats.points.selected;
    this.frameStats.points.culled += this.stats.points.culled;
    this.frameStats.points.overflow += this.stats.points.overflow;
    this.frameStats.spots.selected += this.stats.spots.selected;
    this.frameStats.spots.culled += this.stats.spots.culled;
    this.frameStats.spots.overflow += this.stats.spots.overflow;
    if (
      this.exceedPolicy === 'error' &&
      (this.stats.points.overflow || this.stats.spots.overflow)
    )
      throw new RangeError(
        'Relevant lights exceed the configured per-draw light capacity.',
      );
    return this;
  }

  private selectType<T extends PointLight>(
    pool: readonly T[],
    out: T[],
    scores: Float64Array,
    cap: number,
    center: Vector3,
    radius: number,
    stats: LightSelectionCount,
    grid: LightGrid | undefined,
  ): void {
    // Ranked in place by count and truncated once: emptying `out` first dropped its storage,
    // which regrew for every selection.
    let size = 0;
    stats.selected = stats.culled = stats.overflow = 0;
    let relevant = 0;
    const indexed =
      grid !== undefined &&
      this.scene!.presentationPass === this.gridPass &&
      grid.gather(center.x, center.y, center.z, radius);
    const candidates = indexed ? grid.candidates : undefined;
    const count = candidates ? candidates.length : pool.length;
    // Lights outside every gathered cell are beyond range + radius, as the exact test finds.
    if (candidates) stats.culled = pool.length - count;
    for (let n = 0; n < count; n++) {
      const light = pool[candidates ? candidates[n]! : n]!;
      const dx = center.x - light.position.x,
        dy = center.y - light.position.y,
        dz = center.z - light.position.z;
      const range = light.range;
      if (range > 0) {
        // Clearly beyond range + radius: the exact test below would cull it too. The relative
        // margin dwarfs hypot/subtraction rounding; overflow or NaN falls through to it.
        const reach = range + radius;
        if (dx * dx + dy * dy + dz * dz > reach * reach * (1 + 1e-9)) {
          stats.culled++;
          continue;
        }
      }
      const distance = hypot3(dx, dy, dz);
      const nearest = Math.max(0, distance - radius);
      const color = Math.max(light.color[0], light.color[1], light.color[2]);
      if (
        !light.intensity ||
        !color ||
        (light.range > 0 && nearest >= light.range)
      ) {
        stats.culled++;
        continue;
      }
      let cone = 1;
      if (light instanceof SpotLight && distance > radius) {
        const directionLength = light.direction.length();
        const cosine =
          (dx * light.direction.x +
            dy * light.direction.y +
            dz * light.direction.z) /
          (distance * directionLength);
        // Angular radius conservatively admits every cone/sphere intersection.
        const angle = Math.max(
          0,
          Math.acos(Math.max(-1, Math.min(1, cosine))) -
            Math.asin(Math.min(1, radius / distance)),
        );
        if (angle >= light.outerAngle) {
          stats.culled++;
          continue;
        }
        const t = Math.max(
          0,
          Math.min(
            1,
            (Math.cos(angle) - Math.cos(light.outerAngle)) /
              (Math.cos(light.innerAngle) - Math.cos(light.outerAngle)),
          ),
        );
        cone = t * t * (3 - 2 * t);
      }
      const falloff =
        light.range > 0
          ? Math.max(0, 1 - (nearest / light.range) ** 4) ** 2
          : 1;
      const score =
        (color * light.intensity * cone * falloff) /
        Math.max(nearest * nearest, 0.01);
      relevant++;
      let index = 0;
      while (
        index < size &&
        (out[index]!.priority > light.priority ||
          (out[index]!.priority === light.priority &&
            (scores[index]! > score ||
              (scores[index] === score && out[index]!.id < light.id))))
      )
        index++;
      if (index >= cap) continue;
      const end = Math.min(size, cap - 1);
      for (let i = end; i > index; i--) {
        out[i] = out[i - 1]!;
        scores[i] = scores[i - 1]!;
      }
      out[index] = light;
      scores[index] = score;
      if (size < cap) size++;
    }
    out.length = size;
    stats.selected = size;
    stats.overflow = relevant - size;
  }
}
