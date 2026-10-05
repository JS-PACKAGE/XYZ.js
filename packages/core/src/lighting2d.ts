import type { Texture2DSource } from '../../assets/src/index.js';
import type { Sprite } from './sprite.js';
import { lighting2dLimits } from '../../../src/data/lighting2d.js';
import { validateEffect2D } from './materials2d/material2d.js';
export const MAX_LIGHTS_2D = lighting2dLimits.lightsPerSprite;
export const MAX_OCCLUDERS_2D = lighting2dLimits.occludersPerSprite;
export interface Light2DOptions {
  position?: readonly [number, number];
  height?: number;
  radius?: number;
  intensity?: number;
  color?: readonly [number, number, number];
  space?: 'world' | 'screen';
}
/** Point light in world units (or logical HUD pixels); +Y points down, +Z toward the viewer. */
export class Light2D {
  position: [number, number];
  height: number;
  radius: number;
  intensity: number;
  color: [number, number, number];
  space: 'world' | 'screen';
  enabled = true;
  constructor(options: Light2DOptions = {}) {
    this.position = [...(options.position ?? [0, 0])];
    this.height = options.height ?? 64;
    this.radius = options.radius ?? 256;
    this.intensity = options.intensity ?? 1;
    this.color = [...(options.color ?? [1, 1, 1])];
    this.space = options.space ?? 'world';
    this.validate();
  }
  validate(): void {
    if (
      this.position.length !== 2 ||
      this.color.length !== 3 ||
      !this.position.every(Number.isFinite) ||
      !this.color.every(Number.isFinite) ||
      !Number.isFinite(this.height) ||
      !Number.isFinite(this.radius) ||
      !Number.isFinite(this.intensity) ||
      this.height < 0 ||
      this.radius <= 0 ||
      this.intensity < 0 ||
      this.color.some((v) => v < 0) ||
      (this.space !== 'world' && this.space !== 'screen')
    )
      throw new RangeError(
        'Light2D requires finite coordinates, positive radius and nonnegative height/intensity/color.',
      );
  }
}

export interface Occluder2DOptions {
  a?: readonly [number, number];
  b?: readonly [number, number];
  space?: 'world' | 'screen';
}
/** Finite segment that blocks a 2D light in the sprite's matching space. */
export class Occluder2D {
  a: [number, number];
  b: [number, number];
  space: 'world' | 'screen';
  enabled = true;
  constructor(options: Occluder2DOptions = {}) {
    this.a = [...(options.a ?? [0, 0])];
    this.b = [...(options.b ?? [1, 0])];
    this.space = options.space ?? 'world';
    this.validate();
  }
  validate(): void {
    if (
      this.a.length !== 2 ||
      this.b.length !== 2 ||
      !this.a.every(Number.isFinite) ||
      !this.b.every(Number.isFinite) ||
      (this.space !== 'world' && this.space !== 'screen')
    )
      throw new RangeError(
        'Occluder2D endpoints must be finite 2D points in world or screen space.',
      );
  }
}
/** True when the segment crosses the open 2D segment from the light to the sample. */
export function occluderBlocksLight2D(
  light: readonly [number, number],
  sample: readonly [number, number],
  a: readonly [number, number],
  b: readonly [number, number],
): boolean {
  const rx = sample[0] - light[0];
  const ry = sample[1] - light[1];
  const sx = b[0] - a[0];
  const sy = b[1] - a[1];
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-6) return false;
  const qx = a[0] - light[0];
  const qy = a[1] - light[1];
  const t = (qx * sy - qy * sx) / denom;
  const u = (qx * ry - qy * rx) / denom;
  return t > 0.001 && t < 0.999 && u >= 0 && u <= 1;
}
export interface Lighting2DOptions {
  lights?: readonly Light2D[];
  ambient?: readonly [number, number, number];
  occluders?: readonly Occluder2D[];
  /** Linear RGB added after diffuse, still scaled by sprite opacity. */
  emissive?: readonly [number, number, number];
  /** Highlight strength, 0–1. Default 0 keeps the existing diffuse-only look. */
  specular?: number;
  /** 0 is sharp and 1 is matte. Default 1. */
  roughness?: number;
}
/** Borrowed lights and normal textures: destroying a sprite never destroys either. */
export class Lighting2D {
  readonly lights: Light2D[];
  readonly occluders: Occluder2D[];
  ambient: [number, number, number];
  emissive: [number, number, number];
  specular: number;
  roughness: number;
  constructor(options: Lighting2DOptions = {}) {
    this.lights = [...(options.lights ?? [])];
    this.occluders = [...(options.occluders ?? [])];
    this.ambient = [...(options.ambient ?? [0.1, 0.1, 0.1])];
    this.emissive = [...(options.emissive ?? [0, 0, 0])];
    this.specular = options.specular ?? 0;
    this.roughness = options.roughness ?? 1;
    this.validate();
  }
  validate(): void {
    if (this.lights.length > MAX_LIGHTS_2D)
      throw new RangeError(
        `Lighting2D supports at most ${MAX_LIGHTS_2D} lights per sprite.`,
      );
    if (this.occluders.length > MAX_OCCLUDERS_2D)
      throw new RangeError(
        `Lighting2D supports at most ${MAX_OCCLUDERS_2D} occluders per sprite.`,
      );
    if (
      this.ambient.length !== 3 ||
      !this.ambient.every((v) => Number.isFinite(v) && v >= 0) ||
      this.emissive.length !== 3 ||
      !this.emissive.every((v) => Number.isFinite(v) && v >= 0) ||
      !Number.isFinite(this.specular) ||
      this.specular < 0 ||
      this.specular > 1 ||
      !Number.isFinite(this.roughness) ||
      this.roughness < 0 ||
      this.roughness > 1
    )
      throw new RangeError(
        'Lighting2D ambient/emissive must be finite and nonnegative; specular and roughness must be finite and within 0-1.',
      );
    for (const light of this.lights) {
      if (!(light instanceof Light2D))
        throw new TypeError('Lighting2D lights must be Light2D instances.');
      light.validate();
    }
    for (const occluder of this.occluders) {
      if (!(occluder instanceof Occluder2D))
        throw new TypeError(
          'Lighting2D occluders must be Occluder2D instances.',
        );
      occluder.validate();
    }
  }
}
export function validateSpriteLighting2D(sprite: Sprite): void {
  if (!sprite.lighting) {
    if (sprite.normalTexture)
      throw new RangeError('Sprite.normalTexture requires Sprite.lighting.');
    return;
  }
  if (!(sprite.lighting instanceof Lighting2D))
    throw new TypeError('Sprite.lighting must be Lighting2D.');
  sprite.lighting.validate();
  const normal: Texture2DSource | undefined = sprite.normalTexture;
  if (
    normal &&
    (normal.destroyed || (normal.kind !== 'image' && normal.kind !== 'canvas'))
  )
    throw new RangeError(
      'Normal maps must be live CPU-backed Texture2DSource objects.',
    );
  if (
    normal &&
    (normal.width !== sprite.texture.width ||
      normal.height !== sprite.texture.height)
  )
    throw new RangeError(
      'Normal map must match the albedo atlas dimensions and frame layout.',
    );
  if (sprite.material) {
    validateEffect2D(sprite.material);
    if (
      !/\bfn\s+effect\s*\(/.test(sprite.material.wgsl) ||
      !/\bvec4\s+effect\s*\(/.test(sprite.material.glsl)
    )
      throw new RangeError(
        'A lit Material2D must define effect() in both WGSL and GLSL.',
      );
  }
}
