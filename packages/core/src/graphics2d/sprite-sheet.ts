import { AssetError, Texture } from '../../../assets/src/index.js';
import { graphics2dLimits } from '../../../../src/data/graphics2d.js';
import type { Rect2D } from '../gameplay/contracts.js';
import { Sprite, type SpriteOptions } from '../sprite.js';

export interface SpriteSheetGridOptions {
  frameWidth: number;
  frameHeight: number;
  columns?: number;
  rows?: number;
  origin?: [number, number];
  spacing?: [number, number];
}
export type SpriteSheetSpriteOptions = Omit<
  SpriteOptions,
  'texture' | 'source'
>;

export function validatedRegion(
  texture: Texture,
  frame: Rect2D,
): Readonly<Rect2D> {
  if (texture.destroyed)
    throw new AssetError('Cannot use a destroyed Texture.');
  if (
    ![frame.x, frame.y, frame.width, frame.height].every(Number.isInteger) ||
    frame.x < 0 ||
    frame.y < 0 ||
    frame.width <= 0 ||
    frame.height <= 0 ||
    frame.x + frame.width > texture.width ||
    frame.y + frame.height > texture.height
  )
    throw new RangeError(
      'Source region must be positive integer pixels within the Texture.',
    );
  return Object.freeze({
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
  });
}

/** Frame snapshots borrow a single atlas; no cropped bitmap is allocated. */
export class SpriteSheet {
  readonly frames: readonly Readonly<Rect2D>[];
  constructor(
    readonly texture: Texture,
    frames: readonly Rect2D[],
  ) {
    if (texture.destroyed)
      throw new AssetError('Cannot use a destroyed Texture.');
    if (!frames.length || frames.length > graphics2dLimits.frames)
      throw new RangeError('SpriteSheet frame count exceeds its budget.');
    this.frames = Object.freeze(
      frames.map((frame) => validatedRegion(texture, frame)),
    );
  }

  static grid(texture: Texture, options: SpriteSheetGridOptions): SpriteSheet {
    const { frameWidth: width, frameHeight: height } = options;
    const [x, y] = options.origin ?? [0, 0];
    const [sx, sy] = options.spacing ?? [0, 0];
    if (
      ![width, height, x, y, sx, sy].every(Number.isInteger) ||
      width <= 0 ||
      height <= 0 ||
      x < 0 ||
      y < 0 ||
      sx < 0 ||
      sy < 0
    )
      throw new RangeError(
        'Grid dimensions, origin and spacing must be integer pixels.',
      );
    const columns =
      options.columns ?? Math.floor((texture.width - x + sx) / (width + sx));
    const rows =
      options.rows ?? Math.floor((texture.height - y + sy) / (height + sy));
    if (
      !Number.isInteger(columns) ||
      !Number.isInteger(rows) ||
      columns <= 0 ||
      rows <= 0 ||
      columns * rows > graphics2dLimits.frames ||
      x + columns * (width + sx) - sx > texture.width ||
      y + rows * (height + sy) - sy > texture.height
    )
      throw new RangeError('Grid exceeds the Texture or frame budget.');
    const frames: Rect2D[] = [];
    for (let row = 0; row < rows; row++)
      for (let column = 0; column < columns; column++)
        frames.push({
          x: x + column * (width + sx),
          y: y + row * (height + sy),
          width,
          height,
        });
    return new SpriteSheet(texture, frames);
  }

  getFrame(index: number): Readonly<Rect2D> {
    if (!Number.isInteger(index) || index < 0 || index >= this.frames.length)
      throw new RangeError('SpriteSheet frame index is out of range.');
    return this.frames[index]!;
  }

  createSprite(index: number, options: SpriteSheetSpriteOptions = {}): Sprite {
    return new Sprite({
      ...options,
      texture: this.texture,
      source: this.getFrame(index),
    });
  }
}
