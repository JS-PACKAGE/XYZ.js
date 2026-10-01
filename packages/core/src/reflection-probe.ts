import { Vector3 } from '../../math/src/index.js';
import { EnvironmentMap } from './environment.js';
import type { Mesh } from './mesh.js';
import type { Scene } from './scene.js';

export interface ReflectionProbeOptions {
  environment: EnvironmentMap;
  position: Vector3 | [number, number, number];
  min: Vector3 | [number, number, number];
  max: Vector3 | [number, number, number];
  intensity?: number;
  enabled?: boolean;
  boxProjection?: boolean;
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

  constructor(options: ReflectionProbeOptions) {
    this.environment = options.environment;
    this.position = copy(options.position);
    this.min = copy(options.min);
    this.max = copy(options.max);
    this.intensity = options.intensity ?? 1;
    this.enabled = options.enabled ?? true;
    this.boxProjection = options.boxProjection ?? true;
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
}

/** Object-origin selection: closest containing capture position wins; equal distances keep Scene order. */
export function selectReflectionProbe(
  scene: Scene,
  object: Mesh,
): ReflectionProbe | undefined {
  const e = object.updateWorldMatrix().elements;
  const x = e[12],
    y = e[13],
    z = e[14];
  let selected: ReflectionProbe | undefined,
    distance = Infinity;
  for (const probe of scene.reflectionProbes) {
    if (
      !probe.enabled ||
      probe.environment.destroyed ||
      !probe.contains(x, y, z)
    )
      continue;
    const dx = x - probe.position.x,
      dy = y - probe.position.y,
      dz = z - probe.position.z;
    const squared = dx * dx + dy * dy + dz * dz;
    if (squared < distance) {
      selected = probe;
      distance = squared;
    }
  }
  return selected;
}
