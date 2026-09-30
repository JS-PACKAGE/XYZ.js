import { Matrix4, Vector3 } from '../../math/src/index.js';
import {
  ENVIRONMENT_FLOAT_COUNT,
  LIGHTING_FLOAT_COUNT,
  MAX_POINT_LIGHTS,
  MAX_SPOT_LIGHTS,
  POINT_LIGHT_OFFSET,
  POINT_LIGHT_STRIDE,
  SPOT_LIGHT_OFFSET,
  SPOT_LIGHT_STRIDE,
} from '../../../src/data/rendering.js';
import { EnvironmentMap } from './environment.js';
import { PointLight, SpotLight } from './lights.js';
import { PostProcessingSettings, ShadowSettings } from './render-settings.js';
import type { Scene } from './scene.js';

function finite(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
    throw new RangeError(`${name} must be finite and fit in Float32.`);
}

function nonnegative(value: number, name: string): void {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} cannot be negative.`);
}

function vector(value: Vector3, name: string): void {
  if (!(value instanceof Vector3))
    throw new TypeError(`${name} must be a Vector3.`);
  finite(value.x, name);
  finite(value.y, name);
  finite(value.z, name);
}

/** Validate mutable settings before either backend allocates frame resources. */
export function validateRenderSettings(scene: Scene): void {
  if (!(scene.shadows instanceof ShadowSettings))
    throw new TypeError('Scene shadows must be ShadowSettings.');
  if (!(scene.postProcessing instanceof PostProcessingSettings))
    throw new TypeError('Scene postProcessing must be PostProcessingSettings.');
  scene.shadows.validate();
  scene.postProcessing.validate();
  for (const [name, map] of [
    ['environment', scene.environment],
    ['background', scene.background],
  ] as const)
    if (map !== undefined && !(map instanceof EnvironmentMap))
      throw new TypeError(`Scene ${name} must be an EnvironmentMap.`);
  nonnegative(scene.environmentIntensity, 'Environment intensity');
  nonnegative(scene.backgroundIntensity, 'Background intensity');
}

/** A destroyed map is treated as absent, like a destroyed Texture on a Mesh. */
export function activeEnvironment(scene: Scene): EnvironmentMap | undefined {
  return scene.environment && !scene.environment.destroyed
    ? scene.environment
    : undefined;
}

export function activeBackground(scene: Scene): EnvironmentMap | undefined {
  return scene.background && !scene.background.destroyed
    ? scene.background
    : undefined;
}

/**
 * Environment block shared by both backends: nine SH vec4 (irradiance / pi), then
 * intensity, enabled, maxLod, background intensity (0 when no background).
 */
export function fillEnvironmentData(scene: Scene, out: Float32Array): void {
  if (!(out instanceof Float32Array) || out.length < ENVIRONMENT_FLOAT_COUNT)
    throw new RangeError(
      `Environment output requires at least ${ENVIRONMENT_FLOAT_COUNT} Float32 values.`,
    );
  const environment = activeEnvironment(scene);
  if (environment) out.set(environment.sh, 0);
  else out.fill(0, 0, 36);
  out[36] = environment ? scene.environmentIntensity : 0;
  out[37] = environment ? 1 : 0;
  out[38] = environment ? environment.mipCount - 1 : 0;
  out[39] = activeBackground(scene) ? scene.backgroundIntensity : 0;
}

/**
 * Allocation-free vec4-aligned lighting block, with offsets in src/data/rendering.ts:
 * direction.xyz/intensity, directional color.rgb/ambient, pointCount/spotCount/0/0;
 * points: position.xyz/range, color.rgb/intensity;
 * spots: point fields, normalized light-to-surface direction.xyz/cosOuter, cosInner/0/0/0.
 * Unused slots are cleared so a reused block never retains lights removed from a Scene.
 */
export function fillLightingData(scene: Scene, out: Float32Array): void {
  if (!(out instanceof Float32Array) || out.length < LIGHTING_FLOAT_COUNT)
    throw new RangeError(
      `Lighting output requires at least ${LIGHTING_FLOAT_COUNT} Float32 values.`,
    );
  if (!Array.isArray(scene.pointLights) || !Array.isArray(scene.spotLights))
    throw new TypeError('Scene pointLights and spotLights must be arrays.');
  const pointCount = scene.pointLights.length;
  const spotCount = scene.spotLights.length;
  if (pointCount > MAX_POINT_LIGHTS || spotCount > MAX_SPOT_LIGHTS)
    throw new RangeError(
      `A Scene supports at most ${MAX_POINT_LIGHTS} point lights and ${MAX_SPOT_LIGHTS} spot lights.`,
    );
  const directional = scene.directionalLight;
  vector(directional.direction, 'Directional light direction');
  nonnegative(directional.intensity, 'Directional light intensity');
  nonnegative(scene.ambientLight, 'Ambient light');
  if (!Array.isArray(directional.color) || directional.color.length !== 3)
    throw new RangeError(
      'Directional light color must contain three components.',
    );
  for (let i = 0; i < 3; i++)
    nonnegative(directional.color[i], 'Directional light color component');
  out[0] = directional.direction.x;
  out[1] = directional.direction.y;
  out[2] = directional.direction.z;
  out[3] = directional.intensity;
  out[4] = directional.color[0];
  out[5] = directional.color[1];
  out[6] = directional.color[2];
  out[7] = scene.ambientLight;
  out[8] = pointCount;
  out[9] = spotCount;
  out[10] = 0;
  out[11] = 0;
  for (let i = 0; i < pointCount; i++) {
    const light = scene.pointLights[i];
    if (!(light instanceof PointLight))
      throw new TypeError('Scene pointLights must contain PointLight objects.');
    light.validate();
    const offset = POINT_LIGHT_OFFSET + i * POINT_LIGHT_STRIDE;
    writePoint(light, out, offset);
  }
  out.fill(
    0,
    POINT_LIGHT_OFFSET + pointCount * POINT_LIGHT_STRIDE,
    SPOT_LIGHT_OFFSET,
  );
  for (let i = 0; i < spotCount; i++) {
    const light = scene.spotLights[i];
    if (!(light instanceof SpotLight))
      throw new TypeError('Scene spotLights must contain SpotLight objects.');
    light.validate();
    const offset = SPOT_LIGHT_OFFSET + i * SPOT_LIGHT_STRIDE;
    writePoint(light, out, offset);
    const direction = light.direction;
    const length = direction.length();
    out[offset + 8] = direction.x / length;
    out[offset + 9] = direction.y / length;
    out[offset + 10] = direction.z / length;
    out[offset + 11] = Math.cos(light.outerAngle);
    out[offset + 12] = Math.cos(light.innerAngle);
    out[offset + 13] = 0;
    out[offset + 14] = 0;
    out[offset + 15] = 0;
  }
  out.fill(
    0,
    SPOT_LIGHT_OFFSET + spotCount * SPOT_LIGHT_STRIDE,
    LIGHTING_FLOAT_COUNT,
  );
}

function writePoint(
  light: PointLight,
  out: Float32Array,
  offset: number,
): void {
  out[offset] = light.position.x;
  out[offset + 1] = light.position.y;
  out[offset + 2] = light.position.z;
  out[offset + 3] = light.range;
  out[offset + 4] = light.color[0];
  out[offset + 5] = light.color[1];
  out[offset + 6] = light.color[2];
  out[offset + 7] = light.intensity;
}

/**
 * Right-handed directional shadow view-projection with depth in [0, 1].
 * WebGL remaps rasterized clip Z to [-W, W], but shadow sampling uses this matrix directly.
 * The light camera is target + normalized surface-to-light direction * far / 2.
 */
export function computeShadowMatrix(scene: Scene, out: Matrix4): Matrix4 {
  if (!(out instanceof Matrix4))
    throw new TypeError('Shadow matrix output must be a Matrix4.');
  const settings = scene.shadows;
  if (!(settings instanceof ShadowSettings))
    throw new TypeError('Scene shadows must be ShadowSettings.');
  settings.validate();
  const direction = scene.directionalLight.direction;
  vector(direction, 'Directional light direction');
  const length = direction.length();
  if (length === 0)
    throw new RangeError('Directional shadow light direction cannot be zero.');
  const zx = direction.x / length;
  const zy = direction.y / length;
  const zz = direction.z / length;
  // Change the up axis near the poles to avoid a singular look-at basis.
  let xx: number;
  let xy: number;
  let xz: number;
  if (Math.abs(zy) > 0.999) {
    xx = -zy;
    xy = zx;
    xz = 0;
  } else {
    xx = zz;
    xy = 0;
    xz = -zx;
  }
  const rightLength = Math.hypot(xx, xy, xz);
  xx /= rightLength;
  xy /= rightLength;
  xz /= rightLength;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  const target = settings.target;
  const distance = settings.far / 2;
  const ex = target.x + zx * distance;
  const ey = target.y + zy * distance;
  const ez = target.z + zz * distance;
  const scale = 2 / settings.extent;
  const depth = 1 / (settings.near - settings.far);
  const e = out.elements;
  e[0] = scale * xx;
  e[1] = scale * yx;
  e[2] = depth * zx;
  e[3] = 0;
  e[4] = scale * xy;
  e[5] = scale * yy;
  e[6] = depth * zy;
  e[7] = 0;
  e[8] = scale * xz;
  e[9] = scale * yz;
  e[10] = depth * zz;
  e[11] = 0;
  e[12] = -scale * (xx * ex + xy * ey + xz * ez);
  e[13] = -scale * (yx * ex + yy * ey + yz * ez);
  e[14] = depth * (settings.near - (zx * ex + zy * ey + zz * ez));
  e[15] = 1;
  for (let i = 0; i < 16; i++) {
    if (!Number.isFinite(e[i]))
      throw new RangeError('Shadow projection must fit in Float32.');
  }
  return out;
}
