import { lensFlareDefaults } from '../../../src/data/rendering.js';
import { validatePostNumber } from './color-grading.js';

export interface LensFlareOptions {
  enabled?: boolean;
  strength?: number;
  threshold?: number;
  ghosts?: number;
  spacing?: number;
  haloRadius?: number;
  haloWidth?: number;
}

/** Bounded screen-space bright-pass ghosts and halo; no occluded/offscreen sources. */
export class LensFlareSettings {
  enabled: boolean;
  strength: number;
  threshold: number;
  ghosts: number;
  spacing: number;
  haloRadius: number;
  haloWidth: number;
  constructor(options: LensFlareOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.strength = options.strength ?? lensFlareDefaults.strength;
    this.threshold = options.threshold ?? lensFlareDefaults.threshold;
    this.ghosts = options.ghosts ?? lensFlareDefaults.ghosts;
    this.spacing = options.spacing ?? lensFlareDefaults.spacing;
    this.haloRadius = options.haloRadius ?? lensFlareDefaults.haloRadius;
    this.haloWidth = options.haloWidth ?? lensFlareDefaults.haloWidth;
    this.validate();
  }
  validate(): void {
    if (typeof this.enabled !== 'boolean') throw new TypeError('Lens flare enabled must be boolean.');
    validatePostNumber(this.strength, 'Lens flare strength');
    validatePostNumber(this.threshold, 'Lens flare threshold');
    validatePostNumber(this.spacing, 'Lens flare spacing');
    validatePostNumber(this.haloRadius, 'Lens flare halo radius');
    validatePostNumber(this.haloWidth, 'Lens flare halo width');
    if (this.strength < 0 || this.strength > 4 || this.threshold < 0 || this.spacing <= 0 || this.spacing > 2 || this.haloRadius <= 0 || this.haloRadius > 1 || this.haloWidth <= 0 || this.haloWidth > 1 || !Number.isInteger(this.ghosts) || this.ghosts < 1 || this.ghosts > lensFlareDefaults.maximumGhosts)
      throw new RangeError('Lens flare requires strength 0..4, nonnegative threshold, spacing (0,2], halo radius/width (0,1], and 1..8 integer ghosts.');
  }
}
