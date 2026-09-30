import { AssetError, Texture } from './index.js';
import { assetLimits } from '../../../src/data/assets.js';
import { rendering2dLimits } from '../../../src/data/rendering2d.js';
import type { RenderTexture2D } from '../../graphics/src/render-texture2d.js';

export type Texture2DSource = Texture | CanvasTexture2D | RenderTexture2D;
export interface TextureRect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface TextureBorders2D {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
export interface TextureView2DOptions {
  frame: TextureRect2D;
  originalSize?: readonly [number, number];
  trim?: TextureRect2D;
  rotation?: 0 | 90;
  resolution?: number;
  defaultAnchor?: readonly [number, number];
  defaultBorders?: TextureBorders2D;
}

function dimensions(width: number, height: number): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > assetLimits.textureDimension ||
    height > assetLimits.textureDimension ||
    width * height > assetLimits.texturePixels
  )
    throw new AssetError(
      'Texture dimensions exceed the decoded image resource budget.',
    );
}
function rectangle(
  rect: TextureRect2D,
  width: number,
  height: number,
): Readonly<TextureRect2D> {
  if (
    ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
    rect.x < 0 ||
    rect.y < 0 ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.x + rect.width > width ||
    rect.y + rect.height > height
  )
    throw new RangeError(
      'Texture view rectangle must fit within its source dimensions.',
    );
  return Object.freeze({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  });
}

/** Immutable physical atlas metadata; the source remains borrowed. */
export class TextureView2D {
  readonly frame: Readonly<TextureRect2D>;
  readonly originalSize: readonly [number, number];
  readonly trim: Readonly<TextureRect2D>;
  readonly rotation: 0 | 90;
  readonly resolution: number;
  readonly defaultAnchor: readonly [number, number] | undefined;
  readonly defaultBorders: Readonly<TextureBorders2D> | undefined;
  readonly width: number;
  readonly height: number;

  constructor(
    readonly source: Texture2DSource,
    options: TextureView2DOptions,
  ) {
    if (!source || source.destroyed)
      throw new AssetError(
        'Cannot view a destroyed or missing texture source.',
      );
    this.frame = rectangle(options.frame, source.width, source.height);
    this.rotation = options.rotation ?? 0;
    if (this.rotation !== 0 && this.rotation !== 90)
      throw new RangeError(
        'Texture views support only 0 or 90 degree packing.',
      );
    this.resolution = options.resolution ?? 1;
    if (
      !Number.isFinite(this.resolution) ||
      this.resolution <= 0 ||
      this.resolution > rendering2dLimits.resolution
    )
      throw new RangeError(
        'Texture view resolution exceeds its positive finite budget.',
      );
    const contentWidth =
      this.rotation === 90 ? this.frame.height : this.frame.width;
    const contentHeight =
      this.rotation === 90 ? this.frame.width : this.frame.height;
    const original = options.originalSize ?? [contentWidth, contentHeight];
    if (original.length !== 2)
      throw new RangeError(
        'Texture view originalSize requires two dimensions.',
      );
    dimensions(original[0], original[1]);
    this.originalSize = Object.freeze([original[0], original[1]]);
    this.trim = rectangle(
      options.trim ?? {
        x: 0,
        y: 0,
        width: contentWidth,
        height: contentHeight,
      },
      original[0],
      original[1],
    );
    if (this.trim.width !== contentWidth || this.trim.height !== contentHeight)
      throw new RangeError(
        'Texture view trim dimensions must match the unpacked frame.',
      );
    this.width = original[0] / this.resolution;
    this.height = original[1] / this.resolution;
    if (
      ![this.width, this.height].every(
        (value) =>
          Number.isFinite(value) && value <= rendering2dLimits.coordinate,
      )
    )
      throw new RangeError(
        'Texture view logical dimensions exceed their budget.',
      );
    if (options.defaultAnchor) {
      if (
        options.defaultAnchor.length !== 2 ||
        !options.defaultAnchor.every(Number.isFinite)
      )
        throw new RangeError(
          'Texture view anchor must contain two finite numbers.',
        );
      this.defaultAnchor = Object.freeze([
        ...options.defaultAnchor,
      ]) as readonly [number, number];
    }
    if (options.defaultBorders) {
      const { left, top, right, bottom } = options.defaultBorders;
      if (
        ![left, top, right, bottom].every(
          (value) => Number.isFinite(value) && value >= 0,
        ) ||
        left + right > original[0] ||
        top + bottom > original[1]
      )
        throw new RangeError(
          'Texture view borders must fit the original physical dimensions.',
        );
      this.defaultBorders = Object.freeze({ left, top, right, bottom });
    }
    Object.freeze(this);
  }

  validate(): void {
    if (this.source.destroyed)
      throw new AssetError('Cannot use a view of a destroyed texture source.');
    if (
      this.frame.x + this.frame.width > this.source.width ||
      this.frame.y + this.frame.height > this.source.height
    )
      throw new RangeError('Texture view no longer fits the resized source.');
  }
}

function sourceDimensions(source: CanvasImageSource): [number, number] {
  if ('videoWidth' in source) return [source.videoWidth, source.videoHeight];
  if ('naturalWidth' in source)
    return [source.naturalWidth, source.naturalHeight];
  if ('displayWidth' in source)
    return [source.displayWidth, source.displayHeight];
  const { width, height } = source as { width: number; height: number };
  return [width, height];
}
function snapshot(
  source: CanvasImageSource,
): HTMLCanvasElement | OffscreenCanvas {
  const [width, height] = sourceDimensions(source);
  dimensions(width, height);
  if (!Number.isInteger(width) || !Number.isInteger(height))
    throw new AssetError('Canvas texture dimensions must be integer pixels.');
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  try {
    const context = canvas.getContext('2d') as
      CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context)
      throw new AssetError(
        'A 2D canvas context is required for CanvasTexture2D.',
      );
    context.drawImage(source, 0, 0, width, height);
    return canvas;
  } catch (error) {
    canvas.width = canvas.height = 0;
    throw error;
  }
}

/** Explicit snapshots, never a live canvas or an automatic per-frame copy. */
export class CanvasTexture2D {
  readonly kind = 'canvas';
  private canvas: HTMLCanvasElement | OffscreenCanvas;
  private disposed = false;
  private revision = 0;
  constructor(source: CanvasImageSource) {
    this.canvas = snapshot(source);
  }
  get image(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvas;
  }
  get width(): number {
    return this.canvas.width;
  }
  get height(): number {
    return this.canvas.height;
  }
  get version(): number {
    return this.revision;
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  update(source: CanvasImageSource): void {
    if (this.disposed)
      throw new AssetError('Cannot update a destroyed CanvasTexture2D.');
    if (this.revision === Number.MAX_SAFE_INTEGER)
      throw new RangeError('CanvasTexture2D version overflow.');
    const next = snapshot(source);
    const previous = this.canvas;
    this.canvas = next;
    this.revision++;
    previous.width = previous.height = 0;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.width = this.canvas.height = 0;
  }
}
