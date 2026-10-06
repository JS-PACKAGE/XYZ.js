import { motionBlurDefaults } from '../../../src/data/rendering.js';
import { validatePostNumber } from './color-grading.js';

export interface MotionBlurOptions {
  enabled?: boolean;
  strength?: number;
  samples?: number;
  maxRadius?: number;
}

/** Camera-only depth reprojection; does not invent per-object motion vectors. */
export class MotionBlurSettings {
  enabled: boolean;
  strength: number;
  samples: number;
  maxRadius: number;
  constructor(options: MotionBlurOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.strength = options.strength ?? motionBlurDefaults.strength;
    this.samples = options.samples ?? motionBlurDefaults.samples;
    this.maxRadius = options.maxRadius ?? motionBlurDefaults.maxRadius;
    this.validate();
  }
  validate(): void {
    if (typeof this.enabled !== 'boolean')
      throw new TypeError('Motion blur enabled must be boolean.');
    validatePostNumber(this.strength, 'Motion blur strength');
    validatePostNumber(this.maxRadius, 'Motion blur radius');
    if (
      this.strength < 0 ||
      this.strength > 2 ||
      this.maxRadius < 0 ||
      this.maxRadius > motionBlurDefaults.maximumRadius ||
      !Number.isInteger(this.samples) ||
      this.samples < 1 ||
      this.samples > motionBlurDefaults.maximumSamples
    )
      throw new RangeError(
        'Motion blur requires strength 0..2, radius 0..64 backing pixels and integer samples 1..32.',
      );
  }
}
