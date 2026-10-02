import { Vector3 } from '../../math/src/index.js';
import { shadowLimits } from '../../../src/data/rendering.js';

let nextLightId = 1;

function allocateLightId(): number {
  if (nextLightId > 0xffffff)
    throw new RangeError('Light identity space exhausted.');
  return nextLightId++;
}

export interface PointLightOptions {
  position?: Vector3 | [number, number, number];
  color?: [number, number, number];
  intensity?: number;
  /** Zero means no finite range cutoff. */
  range?: number;
  /** Higher values win bounded shading and shadow allocation before contribution. */
  priority?: number;
  castShadow?: boolean;
  shadowNear?: number;
  /** Shadow far plane when range is zero; otherwise range sets the far plane. */
  shadowFar?: number;
}

export interface SpotLightOptions extends PointLightOptions {
  /** Points from the light toward the illuminated surface, unlike directionalLight. */
  direction?: Vector3 | [number, number, number];
  innerAngle?: number;
  outerAngle?: number;
}

function finite(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
    throw new RangeError(`${name} must be finite and fit in Float32.`);
}

function vector(value: Vector3, name: string): void {
  if (!(value instanceof Vector3))
    throw new TypeError(`${name} must be a Vector3.`);
  finite(value.x, name);
  finite(value.y, name);
  finite(value.z, name);
}

function copyVector(
  value: Vector3 | [number, number, number] | undefined,
  defaultX: number,
  defaultY: number,
  defaultZ: number,
  name: string,
): Vector3 {
  if (value === undefined) return new Vector3(defaultX, defaultY, defaultZ);
  if (value instanceof Vector3) return value.clone();
  if (!Array.isArray(value) || value.length !== 3)
    throw new TypeError(`${name} must be a Vector3 or three-component tuple.`);
  return new Vector3(value[0], value[1], value[2]);
}

function validatePoint(light: PointLight): void {
  vector(light.position, 'Light position');
  if (!Array.isArray(light.color) || light.color.length !== 3)
    throw new RangeError('Light color must contain three components.');
  for (let i = 0; i < 3; i++) {
    finite(light.color[i], 'Light color component');
    if (light.color[i] < 0)
      throw new RangeError('Light color components cannot be negative.');
  }
  finite(light.intensity, 'Light intensity');
  finite(light.range, 'Light range');
  finite(light.priority, 'Light priority');
  if (light.intensity < 0 || light.range < 0)
    throw new RangeError('Light intensity and range cannot be negative.');
  if (typeof light.castShadow !== 'boolean')
    throw new TypeError('Light castShadow must be boolean.');
  finite(light.shadowNear, 'Light shadow near');
  finite(light.shadowFar, 'Light shadow far');
  if (
    light.shadowNear <= 0 ||
    light.shadowFar <= light.shadowNear ||
    (light.castShadow && light.range > 0 && light.range <= light.shadowNear)
  )
    throw new RangeError('Light shadow clipping requires 0 < near < far.');
}

/** World-space inverse-square light. Mutated inputs are revalidated when rendering. */
export class PointLight {
  /** Stable, exactly representable in Float32; independent of scene array order. */
  private readonly identity = allocateLightId();
  get id(): number {
    return this.identity;
  }
  position: Vector3;
  color: [number, number, number];
  intensity: number;
  range: number;
  priority: number;
  castShadow: boolean;
  shadowNear: number;
  shadowFar: number;

  constructor(options: PointLightOptions = {}) {
    this.position = copyVector(options.position, 0, 0, 0, 'Light position');
    const color = options.color ?? [1, 1, 1];
    if (!Array.isArray(color) || color.length !== 3)
      throw new RangeError('Light color must contain three components.');
    this.color = [color[0], color[1], color[2]];
    this.intensity = options.intensity ?? 1;
    this.range = options.range ?? 0;
    this.priority = options.priority ?? 0;
    this.castShadow = options.castShadow ?? false;
    this.shadowNear = options.shadowNear ?? shadowLimits.near;
    this.shadowFar = options.shadowFar ?? shadowLimits.far;
    validatePoint(this);
  }

  validate(): void {
    validatePoint(this);
  }
}

/** Cone angles are radians: 0 <= innerAngle < outerAngle <= PI / 2. */
export class SpotLight extends PointLight {
  direction: Vector3;
  innerAngle: number;
  outerAngle: number;

  constructor(options: SpotLightOptions = {}) {
    super(options);
    this.direction = copyVector(options.direction, 0, -1, 0, 'Spot direction');
    this.innerAngle = options.innerAngle ?? 0;
    this.outerAngle = options.outerAngle ?? Math.PI / 4;
    this.validate();
  }

  override validate(): void {
    super.validate();
    vector(this.direction, 'Spot direction');
    if (this.direction.length() === 0)
      throw new RangeError('Spot direction cannot be zero.');
    finite(this.innerAngle, 'Spot inner angle');
    finite(this.outerAngle, 'Spot outer angle');
    if (
      this.innerAngle < 0 ||
      this.innerAngle >= this.outerAngle ||
      this.outerAngle > Math.PI / 2
    )
      throw new RangeError(
        'Spot angles must satisfy 0 <= innerAngle < outerAngle <= PI / 2.',
      );
    if (
      Math.fround(Math.cos(this.innerAngle)) <=
      Math.fround(Math.cos(this.outerAngle))
    )
      throw new RangeError('Spot cone angles must remain distinct in Float32.');
    if (this.castShadow && this.outerAngle >= Math.PI / 2)
      throw new RangeError(
        'A shadow-casting spot cone must be narrower than PI / 2.',
      );
  }
}
