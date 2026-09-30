import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import {
  AssetError,
  type Texture2DSource,
  type TextureView2D,
} from '../../../assets/src/index.js';

export type FilterKind2D =
  'alpha' | 'color-matrix' | 'blur' | 'noise' | 'displacement';
/** Caller-owned validated native filter data. Destroying a layer never destroys its filters. */
export abstract class Filter2D extends EventTarget {
  private disposed = false;
  readonly uniforms: readonly number[];
  protected constructor(
    readonly kind: FilterKind2D,
    uniforms: readonly number[],
    readonly padding: number,
  ) {
    super();
    if (
      !uniforms.every(Number.isFinite) ||
      !Number.isFinite(padding) ||
      padding < 0 ||
      padding > rendering2dLimits.coordinate
    )
      throw new RangeError('Invalid Filter2D uniforms or padding.');
    this.uniforms = Object.freeze([...uniforms]);
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dispatchEvent(new Event('destroy'));
  }
}
export class AlphaFilter2D extends Filter2D {
  constructor(readonly alpha: number) {
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)
      throw new RangeError('AlphaFilter2D alpha must be in [0,1].');
    super('alpha', [alpha], 0);
  }
}
export class ColorMatrixFilter2D extends Filter2D {
  readonly matrix: readonly number[];
  constructor(matrix: ArrayLike<number>) {
    if (matrix.length !== 20)
      throw new RangeError(
        'ColorMatrixFilter2D requires twenty finite row-major 4x5 values.',
      );
    const values = Array.from({ length: 20 }, (_, index) => matrix[index]!);
    if (values.length !== 20 || !values.every(Number.isFinite))
      throw new RangeError(
        'ColorMatrixFilter2D requires twenty finite row-major 4x5 values.',
      );
    super('color-matrix', values, 0);
    this.matrix = this.uniforms;
  }
}
export class BlurFilter2D extends Filter2D {
  readonly radius: number;
  readonly quality: number;
  constructor(options: { radius: number; quality?: number }) {
    const radius = options.radius,
      quality = options.quality ?? 4;
    if (
      !Number.isFinite(radius) ||
      radius < 0 ||
      radius > rendering2dLimits.filterRadius ||
      !Number.isInteger(quality) ||
      quality < 1 ||
      quality > rendering2dLimits.filterQuality
    )
      throw new RangeError(
        'BlurFilter2D radius/quality exceeds its bounded profile.',
      );
    super('blur', [radius, quality], Math.ceil(radius * 2));
    this.radius = radius;
    this.quality = quality;
  }
}
export class NoiseFilter2D extends Filter2D {
  readonly amount: number;
  readonly seed: number;
  constructor(options: { amount: number; seed?: number }) {
    const amount = options.amount,
      seed = options.seed ?? 0;
    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 1 ||
      !Number.isSafeInteger(seed) ||
      seed < 0 ||
      seed > 0xffffffff
    )
      throw new RangeError(
        'NoiseFilter2D requires amount in [0,1] and a uint32 seed.',
      );
    super('noise', [amount, seed], 0);
    this.amount = amount;
    this.seed = seed;
  }
}
export class DisplacementFilter2D extends Filter2D {
  readonly texture: Texture2DSource;
  readonly view: TextureView2D | undefined;
  readonly scale: readonly [number, number];
  constructor(options: {
    texture?: Texture2DSource;
    view?: TextureView2D;
    scale: readonly [number, number];
  }) {
    const source = options.texture ?? options.view?.source,
      scale = options.scale;
    if (
      !source ||
      source.destroyed ||
      (options.view && options.view.source !== source)
    )
      throw new AssetError(
        'DisplacementFilter2D requires a live matching map.',
      );
    options.view?.validate();
    if (
      scale.length !== 2 ||
      !scale.every(
        (v) =>
          Number.isFinite(v) && Math.abs(v) <= rendering2dLimits.coordinate,
      )
    )
      throw new RangeError(
        'DisplacementFilter2D requires bounded finite scale.',
      );
    super(
      'displacement',
      [scale[0], scale[1]],
      Math.ceil(Math.max(Math.abs(scale[0]), Math.abs(scale[1]))),
    );
    this.texture = source;
    this.view = options.view;
    this.scale = Object.freeze([scale[0], scale[1]]);
  }
}
