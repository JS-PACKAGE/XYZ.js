import { Vector3 } from '../../math/src/index.js';

export interface ShadowSettingsOptions {
  enabled?: boolean;
  mapSize?: number;
  /** Full width and height of the directional-light orthographic frustum. */
  extent?: number;
  near?: number;
  far?: number;
  bias?: number;
  target?: Vector3;
}

export type ToneMapping = 'none' | 'aces';

export interface PostProcessingSettingsOptions {
  enabled?: boolean;
  exposure?: number;
  toneMapping?: ToneMapping;
  bloomStrength?: number;
  bloomThreshold?: number;
  /** Neighbor sampling radius in output pixels. */
  bloomRadius?: number;
}

function finite(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
    throw new RangeError(`${name} must be finite and fit in Float32.`);
}

function nonnegative(value: number, name: string): void {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} cannot be negative.`);
}

/** Directional shadows only; settings remain mutable and are validated each render. */
export class ShadowSettings {
  enabled: boolean;
  mapSize: number;
  extent: number;
  near: number;
  far: number;
  bias: number;
  target: Vector3;

  constructor(options: ShadowSettingsOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.mapSize = options.mapSize ?? 1024;
    this.extent = options.extent ?? 10;
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 50;
    this.bias = options.bias ?? 0.002;
    if (options.target !== undefined && !(options.target instanceof Vector3))
      throw new TypeError('Shadow target must be a Vector3.');
    this.target = options.target?.clone() ?? new Vector3();
    this.validate();
  }

  validate(): void {
    if (typeof this.enabled !== 'boolean')
      throw new TypeError('Shadow enabled setting must be boolean.');
    if (!Number.isSafeInteger(this.mapSize) || this.mapSize < 1)
      throw new RangeError('Shadow map size must be a positive integer.');
    finite(this.extent, 'Shadow extent');
    finite(this.near, 'Shadow near plane');
    finite(this.far, 'Shadow far plane');
    if (this.extent <= 0 || this.near <= 0 || this.far <= this.near)
      throw new RangeError(
        'Shadow extent and near plane must be positive, and far must exceed near.',
      );
    nonnegative(this.bias, 'Shadow bias');
    if (!(this.target instanceof Vector3))
      throw new TypeError('Shadow target must be a Vector3.');
    finite(this.target.x, 'Shadow target');
    finite(this.target.y, 'Shadow target');
    finite(this.target.z, 'Shadow target');
  }
}

/** Fullscreen HDR processing after 3D and before the unaffected 2D overlay. */
export class PostProcessingSettings {
  enabled: boolean;
  exposure: number;
  toneMapping: ToneMapping;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;

  constructor(options: PostProcessingSettingsOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.exposure = options.exposure ?? 1;
    this.toneMapping = options.toneMapping ?? 'aces';
    this.bloomStrength = options.bloomStrength ?? 0;
    this.bloomThreshold = options.bloomThreshold ?? 1;
    this.bloomRadius = options.bloomRadius ?? 2;
    this.validate();
  }

  validate(): void {
    if (typeof this.enabled !== 'boolean')
      throw new TypeError('Postprocessing enabled setting must be boolean.');
    if (this.toneMapping !== 'none' && this.toneMapping !== 'aces')
      throw new RangeError('Tone mapping must be none or aces.');
    nonnegative(this.exposure, 'Exposure');
    nonnegative(this.bloomStrength, 'Bloom strength');
    nonnegative(this.bloomThreshold, 'Bloom threshold');
    nonnegative(this.bloomRadius, 'Bloom radius');
  }
}
