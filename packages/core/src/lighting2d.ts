import type { Texture2DSource } from '../../assets/src/index.js';
import type { Sprite } from './sprite.js';
import { lighting2dLimits } from '../../../src/data/lighting2d.js';

export const MAX_LIGHTS_2D = lighting2dLimits.lightsPerSprite;
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
export interface Lighting2DOptions {
  lights?: readonly Light2D[];
  ambient?: readonly [number, number, number];
}
/** Borrowed lights and normal textures: destroying a sprite never destroys either. */
export class Lighting2D {
  readonly lights: Light2D[];
  ambient: [number, number, number];
  constructor(options: Lighting2DOptions = {}) {
    this.lights = [...(options.lights ?? [])];
    this.ambient = [...(options.ambient ?? [0.1, 0.1, 0.1])];
    this.validate();
  }
  validate(): void {
    if (this.lights.length > MAX_LIGHTS_2D)
      throw new RangeError(
        `Lighting2D supports at most ${MAX_LIGHTS_2D} lights per sprite.`,
      );
    if (
      this.ambient.length !== 3 ||
      !this.ambient.every((v) => Number.isFinite(v) && v >= 0)
    )
      throw new RangeError(
        'Lighting2D ambient must contain three finite nonnegative components.',
      );
    for (const light of this.lights) {
      if (!(light instanceof Light2D))
        throw new TypeError('Lighting2D lights must be Light2D instances.');
      light.validate();
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
  if (sprite.material)
    throw new RangeError(
      'Lighting2D cannot be combined with a custom Material2D.',
    );
}
