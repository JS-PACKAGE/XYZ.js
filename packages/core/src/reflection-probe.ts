import { Vector3 } from '../../math/src/index.js';
import { EnvironmentMap } from './environment.js';
import type { Mesh } from './mesh.js';
import { reflectionCaptureLimits } from '../../../src/data/rendering.js';

export interface ReflectionProbeCaptureOptions {
  size?: number;
  near?: number;
  far?: number;
  includeBackground?: boolean;
  exclude?: readonly Mesh[];
  signal?: AbortSignal;
  /** Upper bound for temporary native color/depth/readback storage. */
  maxBytes?: number;
}

export interface ReflectionProbeOptions {
  environment: EnvironmentMap;
  position: Vector3 | [number, number, number];
  min: Vector3 | [number, number, number];
  max: Vector3 | [number, number, number];
  intensity?: number;
  enabled?: boolean;
  boxProjection?: boolean;
  blendDistance?: number;
  /** Automatically capture at most one due probe per renderer frame. */
  dynamic?: boolean;
  captureInterval?: number;
  captureSize?: number;
}

function copy(value: Vector3 | [number, number, number]): Vector3 {
  if (value instanceof Vector3) return value.clone();
  if (!Array.isArray(value) || value.length !== 3)
    throw new TypeError(
      'Reflection probe coordinates require a Vector3 or three-component tuple.',
    );
  return new Vector3(...value);
}

function finiteVector(value: Vector3): void {
  if (
    !(value instanceof Vector3) ||
    !finite(value.x) ||
    !finite(value.y) ||
    !finite(value.z)
  )
    throw new RangeError(
      'Reflection probe coordinates must be finite and fit Float32.',
    );
}

function finite(value: number): boolean {
  return Number.isFinite(value) && Number.isFinite(Math.fround(value));
}

function bounds(min: number, max: number, position: number): void {
  if (min >= max || position < min || position > max)
    throw new RangeError(
      'Reflection probe bounds require min < max and must contain the capture position.',
    );
}

/** A borrowed radiance map with world-space influence bounds and parallax-correct reflections. */
export class ReflectionProbe {
  environment: EnvironmentMap;
  readonly position: Vector3;
  readonly min: Vector3;
  readonly max: Vector3;
  intensity: number;
  enabled: boolean;
  boxProjection: boolean;
  blendDistance: number;
  dynamic: boolean;
  captureInterval: number;
  captureSize: number;
  private ownedCapture: EnvironmentMap | undefined;

  constructor(options: ReflectionProbeOptions) {
    this.environment = options.environment;
    this.position = copy(options.position);
    this.min = copy(options.min);
    this.max = copy(options.max);
    this.intensity = options.intensity ?? 1;
    this.enabled = options.enabled ?? true;
    this.boxProjection = options.boxProjection ?? true;
    this.blendDistance = options.blendDistance ?? 1;
    this.dynamic = options.dynamic ?? false;
    this.captureInterval =
      options.captureInterval ?? reflectionCaptureLimits.interval;
    this.captureSize = options.captureSize ?? reflectionCaptureLimits.size;
    this.validate();
  }

  validate(): void {
    if (!(this.environment instanceof EnvironmentMap))
      throw new TypeError(
        'Reflection probe environment must be an EnvironmentMap.',
      );
    finiteVector(this.position);
    finiteVector(this.min);
    finiteVector(this.max);
    bounds(this.min.x, this.max.x, this.position.x);
    bounds(this.min.y, this.max.y, this.position.y);
    bounds(this.min.z, this.max.z, this.position.z);
    if (
      !Number.isFinite(this.intensity) ||
      !Number.isFinite(Math.fround(this.intensity)) ||
      this.intensity < 0
    )
      throw new RangeError(
        'Reflection probe intensity must be finite, nonnegative and fit Float32.',
      );
    if (
      typeof this.enabled !== 'boolean' ||
      typeof this.boxProjection !== 'boolean'
    )
      throw new TypeError(
        'Reflection probe enabled and boxProjection must be boolean.',
      );
    if (typeof this.dynamic !== 'boolean')
      throw new TypeError('Reflection probe dynamic must be boolean.');
    if (
      !finite(this.blendDistance) ||
      this.blendDistance <= 0 ||
      !finite(this.captureInterval) ||
      this.captureInterval <= 0 ||
      !Number.isInteger(this.captureSize) ||
      this.captureSize < 2 ||
      this.captureSize > reflectionCaptureLimits.maximumSize
    )
      throw new RangeError(
        'Probe blending/capture requires positive blend distance/interval and capture size 2..512.',
      );
  }

  contains(x: number, y: number, z: number): boolean {
    return (
      x >= this.min.x &&
      x <= this.max.x &&
      y >= this.min.y &&
      y <= this.max.y &&
      z >= this.min.z &&
      z <= this.max.z
    );
  }

  /** Adopt an automatic capture; only previously adopted maps are released. */
  adoptCapture(map: EnvironmentMap): void {
    if (!(map instanceof EnvironmentMap) || map.destroyed)
      throw new TypeError('Cannot adopt an invalid captured environment.');
    if (this.ownedCapture === map) {
      this.environment = map;
      return;
    }
    this.ownedCapture?.destroy();
    this.ownedCapture = this.environment = map;
  }

  /** Releases automatic captures, never the initially borrowed environment. */
  destroy(): void {
    this.enabled = this.dynamic = false;
    this.ownedCapture?.destroy();
    this.ownedCapture = undefined;
  }
}
