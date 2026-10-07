import { motionBlurDefaults } from '../../../src/data/rendering.js';
import { validatePostNumber } from './color-grading.js';

export interface MotionBlurOptions {
  enabled?: boolean;
  strength?: number;
  samples?: number;
  maxRadius?: number;
  perObject?: boolean;
}

/** Depth reprojection, with optional rigid per-object motion on native backends. */
export class MotionBlurSettings {
  enabled: boolean;
  strength: number;
  samples: number;
  maxRadius: number;
  perObject: boolean;
  constructor(options: MotionBlurOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.strength = options.strength ?? motionBlurDefaults.strength;
    this.samples = options.samples ?? motionBlurDefaults.samples;
    this.maxRadius = options.maxRadius ?? motionBlurDefaults.maxRadius;
    this.perObject = options.perObject ?? motionBlurDefaults.perObject;
    this.validate();
  }
  validate(): void {
    if (typeof this.enabled !== 'boolean')
      throw new TypeError('Motion blur enabled must be boolean.');
    if (typeof this.perObject !== 'boolean')
      throw new TypeError('Motion blur perObject must be boolean.');
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
