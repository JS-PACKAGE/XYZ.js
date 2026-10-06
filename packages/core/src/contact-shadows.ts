import { contactShadowDefaults as defaults } from '../../../src/data/contact-shadows.js';
import type { Scene } from './scene.js';

export interface ContactShadowOptions {
  /** World-space ray length toward the directional light. */
  distance?: number;
  /** Maximum world-space separation between the ray and a depth hit. */
  thickness?: number;
  /** World-space normal offset to avoid self-intersections. */
  bias?: number;
  /** Bounded ray samples, 1–64. */
  steps?: number;
  /** Shadow opacity, 0–1. */
  strength?: number;
}

export class ContactShadowSettings {
  distance: number;
  thickness: number;
  bias: number;
  steps: number;
  strength: number;

  constructor(options: ContactShadowOptions = {}) {
    this.distance = options.distance ?? defaults.distance;
    this.thickness = options.thickness ?? defaults.thickness;
    this.bias = options.bias ?? defaults.bias;
    this.steps = options.steps ?? defaults.steps;
    this.strength = options.strength ?? defaults.strength;
    this.validate();
  }

  validate(): void {
    for (const name of ['distance', 'thickness', 'bias', 'strength'] as const) {
      const value = this[name];
      if (
        !Number.isFinite(value) ||
        !Number.isFinite(Math.fround(value)) ||
        value < 0
      )
        throw new RangeError(
          `Contact shadow ${name} must be nonnegative and fit Float32.`,
        );
    }
    if (this.distance === 0 || this.thickness === 0)
      throw new RangeError(
        'Contact shadow distance and thickness must be positive.',
      );
    if (this.strength > 1)
      throw new RangeError(
        'Contact shadow strength must be between zero and one.',
      );
    if (
      !Number.isInteger(this.steps) ||
      this.steps < 1 ||
      this.steps > defaults.maxSteps
    )
      throw new RangeError(
        `Contact shadow steps must be an integer from 1 to ${defaults.maxSteps}.`,
      );
  }
}

const settings = new WeakMap<Scene, ContactShadowSettings>();

/** Optional scene feature. Removing settings releases renderer depth resources next frame. */
export const ContactShadows = Object.freeze({
  set(scene: Scene, value: ContactShadowSettings | undefined): void {
    if (value === undefined) settings.delete(scene);
    else {
      if (!(value instanceof ContactShadowSettings))
        throw new TypeError('Contact shadows require ContactShadowSettings.');
      value.validate();
      settings.set(scene, value);
    }
  },
  get(scene: Scene): ContactShadowSettings | undefined {
    return settings.get(scene);
  },
});
