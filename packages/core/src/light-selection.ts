import { Vector3 } from '../../math/src/index.js';
import { lightSelectionLimits } from '../../../src/data/lights.js';
import { PointLight, SpotLight } from './lights.js';
import type { Scene } from './scene.js';
import type { Mesh } from './mesh.js';
import { sphereIsFinite, type BoundingSphere3D } from './render-bounds.js';

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
    );
    this.selectType(
      this.scene.spotLights,
      this.spotLights,
      this.spotScores,
      this.spotCapacity,
      center,
      radius,
      this.stats.spots,
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
  ): void {
    out.length = 0;
    stats.selected = stats.culled = stats.overflow = 0;
    let relevant = 0;
    for (const light of pool) {
      const dx = center.x - light.position.x,
        dy = center.y - light.position.y,
        dz = center.z - light.position.z;
      const distance = Math.hypot(dx, dy, dz);
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
        index < out.length &&
        (out[index]!.priority > light.priority ||
          (out[index]!.priority === light.priority &&
            (scores[index]! > score ||
              (scores[index] === score && out[index]!.id < light.id))))
      )
        index++;
      if (index >= cap) continue;
      const end = Math.min(out.length, cap - 1);
      for (let i = end; i > index; i--) {
        out[i] = out[i - 1]!;
        scores[i] = scores[i - 1]!;
      }
      out[index] = light;
      scores[index] = score;
    }
    stats.selected = out.length;
    stats.overflow = relevant - out.length;
  }
}
