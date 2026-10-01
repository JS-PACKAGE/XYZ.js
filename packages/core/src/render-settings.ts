import { Vector3 } from '../../math/src/index.js';
import {
  shadowLimits,
  fxaaDefaults,
  depthPostDefaults,
} from '../../../src/data/rendering.js';

export interface ShadowSettingsOptions {
  enabled?: boolean;
  mapSize?: number;
  /** Full width and height of the directional-light orthographic frustum. */
  extent?: number;
  near?: number;
  far?: number;
  bias?: number;
  target?: Vector3;
  /** One keeps the fixed directional frustum; two to four fit camera-depth slices. */
  cascades?: number;
  cascadeDistance?: number;
  /** Blend between uniform (0) and logarithmic (1) cascade splits. */
  cascadeLambda?: number;
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
  /** Screen-space antialiasing after tone mapping, before the 2D overlay. */
  fxaa?: boolean;
  ssao?: boolean;
  /** World-space AO sampling radius. */
  ssaoRadius?: number;
  ssaoStrength?: number;
  ssaoBias?: number;
  depthOfField?: boolean;
  /** View depth in world units, not Euclidean distance to the camera. */
  dofFocusDistance?: number;
  /** View-depth interval over which blur grows to its maximum. */
  dofFocusRange?: number;
  /** Maximum circle radius in backing pixels. */
  dofBlurRadius?: number;
}

function finite(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
    throw new RangeError(`${name} must be finite and fit in Float32.`);
}

function nonnegative(value: number, name: string): void {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} cannot be negative.`);
}

/** Directional cascades and point/spot atlas shadows; mutable settings are validated each render. */
export class ShadowSettings {
  enabled: boolean;
  mapSize: number;
  extent: number;
  near: number;
  far: number;
  bias: number;
  target: Vector3;
  cascades: number;
  cascadeDistance: number;
  cascadeLambda: number;

  constructor(options: ShadowSettingsOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.mapSize = options.mapSize ?? shadowLimits.mapSize;
    this.extent = options.extent ?? 10;
    this.near = options.near ?? shadowLimits.near;
    this.far = options.far ?? shadowLimits.far;
    this.bias = options.bias ?? 0.002;
    this.cascades = options.cascades ?? 1;
    this.cascadeDistance =
      options.cascadeDistance ?? shadowLimits.cascadeDistance;
    this.cascadeLambda = options.cascadeLambda ?? shadowLimits.cascadeLambda;
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
    if (
      !Number.isInteger(this.cascades) ||
      this.cascades < 1 ||
      this.cascades > shadowLimits.cascades
    )
      throw new RangeError(
        `Shadow cascades must be an integer in 1..${shadowLimits.cascades}.`,
      );
    finite(this.cascadeDistance, 'Cascade distance');
    finite(this.cascadeLambda, 'Cascade lambda');
    if (
      this.cascadeDistance <= 0 ||
      this.cascadeLambda < 0 ||
      this.cascadeLambda > 1
    )
      throw new RangeError(
        'Cascade distance must be positive and lambda within 0..1.',
      );
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
  fxaa: boolean;
  ssao: boolean;
  ssaoRadius: number;
  ssaoStrength: number;
  ssaoBias: number;
  depthOfField: boolean;
  dofFocusDistance: number;
  dofFocusRange: number;
  dofBlurRadius: number;

  constructor(options: PostProcessingSettingsOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.exposure = options.exposure ?? 1;
    this.toneMapping = options.toneMapping ?? 'aces';
    this.bloomStrength = options.bloomStrength ?? 0;
    this.bloomThreshold = options.bloomThreshold ?? 1;
    this.bloomRadius = options.bloomRadius ?? 2;
    this.fxaa = options.fxaa ?? fxaaDefaults.enabled;
    this.ssao = options.ssao ?? depthPostDefaults.ssao;
    this.ssaoRadius = options.ssaoRadius ?? depthPostDefaults.ssaoRadius;
    this.ssaoStrength = options.ssaoStrength ?? depthPostDefaults.ssaoStrength;
    this.ssaoBias = options.ssaoBias ?? depthPostDefaults.ssaoBias;
    this.depthOfField = options.depthOfField ?? depthPostDefaults.depthOfField;
    this.dofFocusDistance =
      options.dofFocusDistance ?? depthPostDefaults.dofFocusDistance;
    this.dofFocusRange =
      options.dofFocusRange ?? depthPostDefaults.dofFocusRange;
    this.dofBlurRadius =
      options.dofBlurRadius ?? depthPostDefaults.dofBlurRadius;
    this.validate();
  }

  validate(): void {
    if (typeof this.enabled !== 'boolean')
      throw new TypeError('Postprocessing enabled setting must be boolean.');
    if (typeof this.fxaa !== 'boolean')
      throw new TypeError('Postprocessing fxaa setting must be boolean.');
    if (
      typeof this.ssao !== 'boolean' ||
      typeof this.depthOfField !== 'boolean'
    )
      throw new TypeError('SSAO and depthOfField settings must be boolean.');
    nonnegative(this.ssaoRadius, 'SSAO radius');
    nonnegative(this.ssaoStrength, 'SSAO strength');
    nonnegative(this.ssaoBias, 'SSAO bias');
    nonnegative(this.dofFocusDistance, 'DOF focus distance');
    nonnegative(this.dofFocusRange, 'DOF focus range');
    nonnegative(this.dofBlurRadius, 'DOF blur radius');
    if (
      this.ssaoRadius === 0 ||
      this.ssaoStrength > 2 ||
      this.dofFocusDistance === 0 ||
      this.dofFocusRange === 0 ||
      this.dofBlurRadius > depthPostDefaults.maximumBlurRadius
    )
      throw new RangeError(
        `SSAO requires radius > 0 and strength <= 2; DOF requires positive focus distance/range and blur radius <= ${depthPostDefaults.maximumBlurRadius}.`,
      );
    if (this.toneMapping !== 'none' && this.toneMapping !== 'aces')
      throw new RangeError('Tone mapping must be none or aces.');
    nonnegative(this.exposure, 'Exposure');
    nonnegative(this.bloomStrength, 'Bloom strength');
    nonnegative(this.bloomThreshold, 'Bloom threshold');
    nonnegative(this.bloomRadius, 'Bloom radius');
  }
}

export type FogMode = 'linear' | 'exp2';

export interface FogSettingsOptions {
  enabled?: boolean;
  mode?: FogMode;
  /** Display (sRGB) color the scene fades toward, components in 0..1. */
  color?: [number, number, number];
  /** Linear mode: distance where fog begins. */
  near?: number;
  /** Linear mode: distance of full fog. */
  far?: number;
  /** Exp2 mode: coverage is 1 - exp(-(density * distance)^2). */
  density?: number;
}

/** Distance fog for 3D meshes; the skybox and 2D overlay are not fogged. */
export class FogSettings {
  enabled: boolean;
  mode: FogMode;
  color: [number, number, number];
  near: number;
  far: number;
  density: number;

  constructor(options: FogSettingsOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.mode = options.mode ?? 'linear';
    const color = options.color ?? [0.7, 0.75, 0.8];
    this.color = [color[0], color[1], color[2]];
    this.near = options.near ?? 10;
    this.far = options.far ?? 100;
    this.density = options.density ?? 0.02;
    this.validate();
  }

  validate(): void {
    if (typeof this.enabled !== 'boolean')
      throw new TypeError('Fog enabled setting must be boolean.');
    if (this.mode !== 'linear' && this.mode !== 'exp2')
      throw new RangeError('Fog mode must be linear or exp2.');
    if (!Array.isArray(this.color) || this.color.length !== 3)
      throw new RangeError('Fog color must contain three components.');
    for (let i = 0; i < 3; i++) {
      finite(this.color[i], 'Fog color component');
      if (this.color[i] < 0 || this.color[i] > 1)
        throw new RangeError('Fog color components must be within 0..1.');
    }
    nonnegative(this.near, 'Fog near');
    nonnegative(this.far, 'Fog far');
    nonnegative(this.density, 'Fog density');
    if (this.mode === 'linear' && this.far <= this.near)
      throw new RangeError('Fog far must exceed near.');
  }
}
