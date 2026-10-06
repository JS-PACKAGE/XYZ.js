import { Vector3 } from '../../math/src/index.js';
import {
  shadowLimits,
  fxaaDefaults,
  depthPostDefaults,
  advancedPostDefaults,
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
  /** Fraction of each cascade depth interval blended into the following cascade. */
  cascadeBlend?: number;
  /** Receiver-plane depth slope multiplier, in shadow texels. Zero disables it. */
  slopeBias?: number;
  /** Reuse unchanged native depth atlases. Untracked native shaders always redraw. */
  cache?: boolean;
}

export type ToneMapping = 'none' | 'aces' | 'agx' | 'reinhard' | 'neutral';

export interface PostProcessingSettingsOptions {
  enabled?: boolean;
  exposure?: number;
  toneMapping?: ToneMapping;
  colorGrading?: ColorGradingSettings;
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
  /** Jittered HDR temporal accumulation before tone mapping. */
  taa?: boolean;
  taaHistoryWeight?: number;
  taaDepthThreshold?: number;
  taaCameraCutDistance?: number;
  /** Opaque depth ray-march before transparency; misses retain environment shading. */
  ssr?: boolean;
  ssrSteps?: number;
  ssrThickness?: number;
  ssrMaxDistance?: number;
  ssrRoughness?: number;
  ssrStrength?: number;
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
  cascadeBlend: number;
  slopeBias: number;
  cache: boolean;
  private cacheRevision = 0;

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
    this.cascadeBlend = options.cascadeBlend ?? shadowLimits.cascadeBlend;
    this.slopeBias = options.slopeBias ?? shadowLimits.slopeBias;
    this.cache = options.cache ?? true;
    if (options.target !== undefined && !(options.target instanceof Vector3))
      throw new TypeError('Shadow target must be a Vector3.');
    this.target = options.target?.clone() ?? new Vector3();
    this.validate();
  }

  /** Force the next native shadow pass after an external/unversioned resource change. */
  invalidate(): void {
    ++this.cacheRevision;
  }

  /** @internal */
  get revision(): number {
    return this.cacheRevision;
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
    nonnegative(this.slopeBias, 'Shadow slope bias');
    finite(this.cascadeBlend, 'Cascade blend');
    if (this.cascadeBlend < 0 || this.cascadeBlend > 0.5)
      throw new RangeError('Cascade blend must be within 0..0.5.');
    if (typeof this.cache !== 'boolean')
      throw new TypeError('Shadow cache setting must be boolean.');
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
  colorGrading?: ColorGradingSettings;
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
  taa: boolean;
  taaHistoryWeight: number;
  taaDepthThreshold: number;
  taaCameraCutDistance: number;
  ssr: boolean;
  ssrSteps: number;
  ssrThickness: number;
  ssrMaxDistance: number;
  ssrRoughness: number;
  ssrStrength: number;

  constructor(options: PostProcessingSettingsOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.exposure = options.exposure ?? 1;
    this.toneMapping = options.toneMapping ?? 'aces';
    this.colorGrading = options.colorGrading;
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
    this.taa = options.taa ?? false;
    this.taaHistoryWeight =
      options.taaHistoryWeight ?? advancedPostDefaults.taaHistoryWeight;
    this.taaDepthThreshold =
      options.taaDepthThreshold ?? advancedPostDefaults.taaDepthThreshold;
    this.taaCameraCutDistance =
      options.taaCameraCutDistance ?? advancedPostDefaults.taaCameraCutDistance;
    this.ssr = options.ssr ?? false;
    this.ssrSteps = options.ssrSteps ?? advancedPostDefaults.ssrSteps;
    this.ssrThickness =
      options.ssrThickness ?? advancedPostDefaults.ssrThickness;
    this.ssrMaxDistance =
      options.ssrMaxDistance ?? advancedPostDefaults.ssrMaxDistance;
    this.ssrRoughness =
      options.ssrRoughness ?? advancedPostDefaults.ssrRoughness;
    this.ssrStrength = options.ssrStrength ?? advancedPostDefaults.ssrStrength;
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
    if (!['none', 'aces', 'agx', 'reinhard', 'neutral'].includes(this.toneMapping))
      throw new RangeError('Unknown tone mapping operator.');
    this.colorGrading?.validate();
    nonnegative(this.exposure, 'Exposure');
    nonnegative(this.bloomStrength, 'Bloom strength');
    nonnegative(this.bloomThreshold, 'Bloom threshold');
    nonnegative(this.bloomRadius, 'Bloom radius');
    if (typeof this.taa !== 'boolean' || typeof this.ssr !== 'boolean')
      throw new TypeError('TAA and SSR settings must be boolean.');
    nonnegative(this.taaHistoryWeight, 'TAA history weight');
    nonnegative(this.taaDepthThreshold, 'TAA depth threshold');
    nonnegative(this.taaCameraCutDistance, 'TAA camera cut distance');
    nonnegative(this.ssrThickness, 'SSR thickness');
    nonnegative(this.ssrMaxDistance, 'SSR distance');
    nonnegative(this.ssrRoughness, 'SSR roughness');
    nonnegative(this.ssrStrength, 'SSR strength');
    if (
      this.taaHistoryWeight >= 1 ||
      this.taaDepthThreshold === 0 ||
      this.taaCameraCutDistance === 0 ||
      this.ssrThickness === 0 ||
      this.ssrMaxDistance === 0 ||
      this.ssrRoughness > 1 ||
      this.ssrStrength > 1 ||
      !Number.isInteger(this.ssrSteps) ||
      this.ssrSteps < 1 ||
      this.ssrSteps > advancedPostDefaults.maximumSSRSteps
    )
      throw new RangeError(
        'TAA requires weight < 1 and positive thresholds; SSR requires positive distance/thickness, roughness/strength <= 1, and 1..128 integer steps.',
      );
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

/** RGB lattice in .cube order (red changes fastest); uploaded as an RGBA8 strip. */
export class ColorLUT3D {
  readonly strip: Uint8Array;
  constructor(readonly size: number, values: ArrayLike<number>) {
    if (!Number.isInteger(size) || size < 16 || size > 64)
      throw new RangeError('LUT size must be an integer in 16..64.');
    if (values.length !== size ** 3 * 3)
      throw new RangeError('LUT must contain size cubed RGB triples.');
    this.strip = new Uint8Array(size ** 3 * 4);
    for (let i = 0; i < size ** 3; i++) {
      for (let c = 0; c < 3; c++) {
        const value = values[i * 3 + c]!;
        if (!Number.isFinite(value) || value < 0 || value > 1)
          throw new RangeError('LUT output components must be in 0..1.');
        // Horizontal blue slices, red within each slice, green in rows.
        const r = i % size, g = Math.floor(i / size) % size, b = Math.floor(i / size ** 2);
        this.strip[(g * size * size + b * size + r) * 4 + c] = Math.round(value * 255);
      }
      const r = i % size, g = Math.floor(i / size) % size, b = Math.floor(i / size ** 2);
      this.strip[(g * size * size + b * size + r) * 4 + 3] = 255;
    }
  }

  static parseCube(text: string): ColorLUT3D {
    let size = 0;
    const values: number[] = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.split('#')[0]!.trim();
      if (!line || /^TITLE\s/.test(line)) continue;
      const tokens = line.split(/\s+/);
      if (tokens[0] === 'LUT_3D_SIZE') {
        if (size || tokens.length !== 2) throw new RangeError('Duplicate or malformed LUT_3D_SIZE.');
        size = Number(tokens[1]);
      } else if (tokens[0] === 'DOMAIN_MIN' || tokens[0] === 'DOMAIN_MAX') {
        const expected = tokens[0] === 'DOMAIN_MIN' ? 0 : 1;
        if (tokens.length !== 4 || tokens.slice(1).some(v => Number(v) !== expected))
          throw new RangeError('Only the normalized 0..1 .cube domain is supported.');
      } else {
        if (tokens.length !== 3) throw new RangeError('Unsupported .cube directive or malformed RGB triple.');
        values.push(...tokens.map(Number));
      }
    }
    return new ColorLUT3D(size, values);
  }

  static preset(size = 32, kind: 'identity' | 'warm' | 'cool' | 'cinematic' = 'identity'): ColorLUT3D {
    if (!['identity', 'warm', 'cool', 'cinematic'].includes(kind))
      throw new RangeError('Unknown LUT preset.');
    if (!Number.isInteger(size) || size < 16 || size > 64)
      throw new RangeError('LUT size must be an integer in 16..64.');
    const values = new Float32Array(size ** 3 * 3);
    for (let b = 0; b < size; b++) for (let g = 0; g < size; g++) for (let r = 0; r < size; r++) {
      const rgb = [r / (size - 1), g / (size - 1), b / (size - 1)];
      if (kind === 'warm') { rgb[0] = Math.min(1, rgb[0]! * 1.08); rgb[2] = rgb[2]! * .9; }
      if (kind === 'cool') { rgb[2] = Math.min(1, rgb[2]! * 1.08); rgb[0] = rgb[0]! * .9; }
      if (kind === 'cinematic') for (let c = 0; c < 3; c++) rgb[c] = Math.max(0, Math.min(1, (rgb[c]! - .5) * 1.12 + .5));
      values.set(rgb, ((b * size + g) * size + r) * 3);
    }
    return new ColorLUT3D(size, values);
  }
}

export class ColorGradingSettings {
  constructor(public lut: ColorLUT3D, public strength = 1) { this.validate(); }
  validate(): void {
    if (!(this.lut instanceof ColorLUT3D)) throw new TypeError('Color grading requires a ColorLUT3D.');
    finite(this.strength, 'Color grading strength');
    if (this.strength < 0 || this.strength > 1) throw new RangeError('Color grading strength must be in 0..1.');
  }
}
