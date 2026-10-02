import { Matrix4, Vector3 } from '../../math/src/index.js';
import {
  SHADOW_FLOAT_COUNT,
  shadowLimits,
} from '../../../src/data/rendering.js';
import { computeShadowMatrix } from './render-data.js';
import { OrthographicCamera } from './orthographic-camera.js';
import { PerspectiveCamera } from './perspective-camera.js';
import type { Scene } from './scene.js';
import type { PointLight, SpotLight } from './lights.js';
import { validateLightPool } from './light-selection.js';

const faces: readonly (readonly [number, number, number])[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/** Shared camera fitting and atlas metadata; no backend handles or per-frame allocation. */
export class ShadowAtlas {
  readonly matrices = Array.from(
    { length: shadowLimits.maps },
    () => new Matrix4(),
  );
  /** std140-compatible header followed by matrices. */
  readonly data = new Float32Array(SHADOW_FLOAT_COUNT);
  /** One matrix per 256-byte dynamic uniform slot for WebGPU shadow draws. */
  readonly projections = new Float32Array(shadowLimits.maps * 64);
  count = 0;
  grid = 1;
  size = 0;
  readonly stats = {
    points: { requested: 0, allocated: 0, overflow: 0 },
    spots: { requested: 0, allocated: 0, overflow: 0 },
  };
  private readonly points: PointLight[] = [];
  private readonly spots: SpotLight[] = [];
  private readonly identities = new Set<number>();
  private readonly inverse = new Matrix4();
  private readonly perspective = new PerspectiveCamera();
  private readonly orthographic = new OrthographicCamera();
  private readonly nearCorners = Array.from({ length: 4 }, () => new Vector3());
  private readonly farCorners = Array.from({ length: 4 }, () => new Vector3());
  private readonly corners = Array.from({ length: 8 }, () => new Vector3());
  private readonly center = new Vector3();
  private readonly target = new Vector3();
  private readonly forward = new Vector3();

  update(scene: Scene, aspect: number): void {
    if (!Number.isFinite(aspect) || aspect <= 0)
      throw new RangeError('Shadow atlas aspect must be positive and finite.');
    validateLightPool(scene);
    this.identities.clear();
    for (const pool of [scene.pointLights, scene.spotLights])
      for (const light of pool) {
        if (this.identities.has(light.id))
          throw new RangeError(
            'Scene light pools cannot contain duplicate identities.',
          );
        this.identities.add(light.id);
      }
    const settings = scene.shadows;
    settings.validate();
    this.count = 0;
    this.points.length = this.spots.length = 0;
    this.stats.points.requested =
      this.stats.points.allocated =
      this.stats.points.overflow =
        0;
    this.stats.spots.requested =
      this.stats.spots.allocated =
      this.stats.spots.overflow =
        0;
    this.data.fill(0);
    this.data.fill(-1, 16, 48);
    if (!settings.enabled) {
      this.size = 0;
      return;
    }
    const camera = scene.camera3D;
    const q = camera.rotation;
    this.forward
      .set(
        -2 * (q.x * q.z + q.w * q.y),
        -2 * (q.y * q.z - q.w * q.x),
        -(1 - 2 * (q.x * q.x + q.y * q.y)),
      )
      .normalize();
    this.data[8] = this.forward.x;
    this.data[9] = this.forward.y;
    this.data[10] = this.forward.z;
    this.data[11] = settings.cascades;
    this.data[12] = camera.position.x;
    this.data[13] = camera.position.y;
    this.data[14] = camera.position.z;
    if (settings.cascades === 1) {
      computeShadowMatrix(scene, this.matrices[0]!);
      this.count = 1;
      this.data[4] = camera.far;
    } else this.fitCascades(scene, aspect);
    this.selectShadows(
      scene.pointLights,
      this.points,
      shadowLimits.pointLights,
    );
    this.selectShadows(scene.spotLights, this.spots, shadowLimits.spotLights);
    this.stats.points.requested = this.countRequested(scene.pointLights);
    this.stats.spots.requested = this.countRequested(scene.spotLights);
    this.stats.points.allocated = this.points.length;
    this.stats.spots.allocated = this.spots.length;
    this.stats.points.overflow =
      this.stats.points.requested - this.points.length;
    this.stats.spots.overflow = this.stats.spots.requested - this.spots.length;
    for (let i = 0; i < this.points.length; i++) {
      const light = this.points[i]!;
      this.data[16 + i] = this.count;
      this.data[32 + i] = light.id;
      for (const face of faces) {
        this.target.set(
          light.position.x + face[0],
          light.position.y + face[1],
          light.position.z + face[2],
        );
        this.projectLight(light, Math.PI / 2);
      }
    }
    for (let i = 0; i < this.spots.length; i++) {
      const light = this.spots[i]!;
      this.data[24 + i] = this.count;
      this.data[40 + i] = light.id;
      this.target.copy(light.position).add(light.direction);
      this.projectLight(light, light.outerAngle * 2);
    }
    this.grid = Math.ceil(Math.sqrt(this.count));
    this.size = this.grid * settings.mapSize;
    this.data[0] = this.count;
    this.data[1] = this.grid;
    this.data[2] = settings.mapSize;
    this.data[3] = settings.bias;
    const quality = 48 + shadowLimits.maps * 16;
    this.data[quality] = settings.cascadeBlend;
    this.data[quality + 1] = Math.max(camera.near, settings.near);
    this.data[quality + 2] = settings.slopeBias;
    for (let i = 0; i < this.count; i++) {
      this.data.set(this.matrices[i]!.elements, 48 + i * 16);
      this.projections.set(this.matrices[i]!.elements, i * 64);
    }
  }

  /** A missing/budget-exceeded identity is unshadowed, regardless of shading order. */
  pointBase(id: number): number {
    for (let i = 0; i < this.points.length; i++)
      if (this.points[i]!.id === id) return this.data[16 + i]!;
    return -1;
  }

  spotBase(id: number): number {
    for (let i = 0; i < this.spots.length; i++)
      if (this.spots[i]!.id === id) return this.data[24 + i]!;
    return -1;
  }

  private countRequested(pool: readonly PointLight[]): number {
    let count = 0;
    for (const light of pool)
      if (light.castShadow && light.intensity > 0) count++;
    return count;
  }

  private selectShadows<T extends PointLight>(
    pool: readonly T[],
    out: T[],
    cap: number,
  ): void {
    for (const light of pool) {
      if (!light.castShadow || light.intensity === 0) continue;
      let index = 0;
      while (
        index < out.length &&
        (out[index]!.priority > light.priority ||
          (out[index]!.priority === light.priority &&
            (out[index]!.intensity > light.intensity ||
              (out[index]!.intensity === light.intensity &&
                out[index]!.id < light.id))))
      )
        index++;
      if (index >= cap) continue;
      for (let i = Math.min(out.length, cap - 1); i > index; i--)
        out[i] = out[i - 1]!;
      out[index] = light;
    }
  }

  private projectLight(light: PointLight, fov: number): void {
    const camera = this.perspective;
    camera.position.copy(light.position);
    camera.lookAt(this.target);
    camera.fov = fov;
    camera.near = light.shadowNear;
    camera.far = light.range || light.shadowFar;
    this.matrices[this.count++]!.copy(camera.updateMatrix(1));
  }

  private fitCascades(scene: Scene, aspect: number): void {
    const camera = scene.camera3D;
    const settings = scene.shadows;
    const near = Math.max(camera.near, settings.near);
    const far = Math.min(camera.far, settings.cascadeDistance);
    if (far <= near)
      throw new RangeError(
        'Cascade distance must exceed the camera near plane.',
      );
    this.inverse.copy(camera.updateMatrix(aspect)).invert();
    for (let i = 0; i < 4; i++) {
      const x = i & 1 ? 1 : -1,
        y = i & 2 ? 1 : -1;
      this.nearCorners[i]!.set(x, y, 0);
      this.farCorners[i]!.set(x, y, 1);
      this.inverse.transformPoint(this.nearCorners[i]!, this.nearCorners[i]!);
      this.inverse.transformPoint(this.farCorners[i]!, this.farCorners[i]!);
    }
    let previous = near;
    for (let cascade = 0; cascade < settings.cascades; cascade++) {
      const fraction = (cascade + 1) / settings.cascades;
      const uniform = near + (far - near) * fraction;
      const logarithmic = near * (far / near) ** fraction;
      const split = uniform + (logarithmic - uniform) * settings.cascadeLambda;
      this.data[4 + cascade] = split;
      this.center.set(0, 0, 0);
      for (let i = 0; i < 8; i++) {
        const a = this.nearCorners[i % 4]!,
          b = this.farCorners[i % 4]!;
        const t =
          ((i < 4
            ? previous -
              (previous - (cascade > 1 ? this.data[2 + cascade]! : near)) *
                settings.cascadeBlend
            : split) -
            camera.near) /
          (camera.far - camera.near);
        const corner = this.corners[i]!;
        corner.set(
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t,
          a.z + (b.z - a.z) * t,
        );
        this.center.add(corner);
      }
      this.center.scale(1 / 8);
      let radius = 0;
      for (const corner of this.corners)
        radius = Math.max(
          radius,
          Math.hypot(
            corner.x - this.center.x,
            corner.y - this.center.y,
            corner.z - this.center.z,
          ),
        );
      radius = Math.ceil(radius * 16) / 16;
      const light = this.orthographic;
      const direction = scene.directionalLight.direction;
      const length = direction.length();
      if (length === 0)
        throw new RangeError(
          'Directional shadow light direction cannot be zero.',
        );
      const depth = Math.max(settings.far, radius * 4);
      light.position.set(
        this.center.x + ((direction.x / length) * depth) / 2,
        this.center.y + ((direction.y / length) * depth) / 2,
        this.center.z + ((direction.z / length) * depth) / 2,
      );
      light.lookAt(this.center);
      light.near = settings.near;
      light.far = depth;
      light.height = radius * 2;
      const matrix = this.matrices[this.count++]!.copy(light.updateMatrix(1));
      // Stabilize the directional texel grid as the camera moves.
      matrix.elements[12] =
        (Math.round((matrix.elements[12] * settings.mapSize) / 2) * 2) /
        settings.mapSize;
      matrix.elements[13] =
        (Math.round((matrix.elements[13] * settings.mapSize) / 2) * 2) /
        settings.mapSize;
      previous = split;
    }
  }
}
