import { volumetricPostDefaults } from '../../../src/data/rendering.js';
import { validatePostNumber } from './color-grading.js';

export interface VolumetricFogOptions {
  enabled?: boolean;
  density?: number;
  baseHeight?: number;
  heightFalloff?: number;
  maxDistance?: number;
  color?: [number, number, number];
  shaftStrength?: number;
  fogSamples?: number;
  shaftSamples?: number;
}

/** Depth-reconstructed exponential height fog and directional screen-space shafts. */
export class VolumetricFogSettings {
  enabled: boolean;
  density: number;
  baseHeight: number;
  heightFalloff: number;
  maxDistance: number;
  color: [number, number, number];
  shaftStrength: number;
  fogSamples: number;
  shaftSamples: number;
  constructor(options: VolumetricFogOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.density = options.density ?? volumetricPostDefaults.density;
    this.baseHeight = options.baseHeight ?? 0;
    this.heightFalloff =
      options.heightFalloff ?? volumetricPostDefaults.heightFalloff;
    this.maxDistance =
      options.maxDistance ?? volumetricPostDefaults.maxDistance;
    const c = options.color ?? [0.65, 0.75, 0.9];
    this.color = [c[0], c[1], c[2]];
    this.shaftStrength =
      options.shaftStrength ?? volumetricPostDefaults.shaftStrength;
    this.fogSamples = options.fogSamples ?? volumetricPostDefaults.fogSamples;
    this.shaftSamples =
      options.shaftSamples ?? volumetricPostDefaults.shaftSamples;
    this.validate();
  }
  validate(): void {
    if (typeof this.enabled !== 'boolean')
      throw new TypeError('Volumetric fog enabled must be boolean.');
    validatePostNumber(this.baseHeight, 'Fog base height');
    validatePostNumber(this.density, 'Volumetric density');
    validatePostNumber(this.heightFalloff, 'Volumetric height falloff');
    validatePostNumber(this.maxDistance, 'Volumetric maximum distance');
    validatePostNumber(this.shaftStrength, 'Volumetric shaft strength');
    if (
      this.density < 0 ||
      this.heightFalloff < 0 ||
      this.maxDistance < 0 ||
      this.shaftStrength < 0
    )
      throw new RangeError(
        'Volumetric density, falloff, distance and strength must be nonnegative.',
      );
    if (this.maxDistance === 0 || this.shaftStrength > 4)
      throw new RangeError(
        'Volumetric maximum distance must be positive and shaft strength <= 4.',
      );
    if (this.color.length !== 3)
      throw new RangeError(
        'Volumetric color must contain three 0..1 components.',
      );
    for (let i = 0; i < 3; i++) {
      const component = this.color[i]!;
      if (!Number.isFinite(component) || component < 0 || component > 1)
        throw new RangeError(
          'Volumetric color must contain three 0..1 components.',
        );
    }
    if (
      !Number.isInteger(this.fogSamples) ||
      this.fogSamples < 1 ||
      this.fogSamples > volumetricPostDefaults.maximumSamples ||
      !Number.isInteger(this.shaftSamples) ||
      this.shaftSamples < 1 ||
      this.shaftSamples > volumetricPostDefaults.maximumSamples
    )
      throw new RangeError(
        'Volumetric sample counts must be integers in 1..64.',
      );
  }
}
