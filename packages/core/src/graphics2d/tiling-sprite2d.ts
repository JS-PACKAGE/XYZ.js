import { Vector2 } from '../../../math/src/index.js';
import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import { Sprite, type SpriteOptions } from '../sprite.js';

export interface TilingSprite2DOptions extends SpriteOptions {
  width: number;
  height: number;
  tilePosition?: [number, number];
  tileScale?: [number, number];
  tileRotation?: number;
}

/** One bounded coverage quad with an independently transformed repeating source. */
export class TilingSprite2D extends Sprite {
  readonly tilePosition = new Vector2();
  readonly tileScale = new Vector2(1, 1);
  private coverageWidth = 0;
  private coverageHeight = 0;
  private patternRotation = 0;

  constructor(options: TilingSprite2DOptions) {
    super(options);
    this.resize(options.width, options.height);
    if (options.tilePosition) {
      if (options.tilePosition.length !== 2)
        throw new RangeError('Tile position requires two coordinates.');
      this.tilePosition.set(...options.tilePosition);
    }
    if (options.tileScale) {
      if (options.tileScale.length !== 2)
        throw new RangeError('Tile scale requires two components.');
      this.tileScale.set(...options.tileScale);
    }
    this.tileRotation = options.tileRotation ?? 0;
    this.validateTileTransform();
  }
  override get width(): number {
    return this.coverageWidth;
  }
  override get height(): number {
    return this.coverageHeight;
  }
  get tileWidth(): number {
    return super.width;
  }
  get tileHeight(): number {
    return super.height;
  }
  get tileRotation(): number {
    return this.patternRotation;
  }
  set tileRotation(value: number) {
    if (!Number.isFinite(value))
      throw new RangeError('Tile rotation must be finite.');
    this.patternRotation = value;
  }
  resize(width: number, height: number): void {
    if (this.destroyed)
      throw new Error('Cannot resize a destroyed TilingSprite2D.');
    if (
      ![width, height].every(
        (value) =>
          Number.isFinite(value) &&
          value >= 0 &&
          value <= rendering2dLimits.coordinate,
      )
    )
      throw new RangeError('Tiling coverage exceeds its dimension budget.');
    this.coverageWidth = width;
    this.coverageHeight = height;
  }
  /** Mutable vectors are validated at submission, not cached behind setters. */
  validateTileTransform(): void {
    if (
      ![
        this.tilePosition.x,
        this.tilePosition.y,
        this.tileScale.x,
        this.tileScale.y,
      ].every(Number.isFinite) ||
      this.tileScale.x === 0 ||
      this.tileScale.y === 0
    )
      throw new RangeError(
        'Tile position and nonsingular scale must be finite.',
      );
    const width = Math.abs(this.tileWidth * this.tileScale.x);
    const height = Math.abs(this.tileHeight * this.tileScale.y);
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width === 0 ||
      height === 0 ||
      !Number.isFinite(1 / width) ||
      !Number.isFinite(1 / height)
    )
      throw new RangeError(
        'Scaled tile dimensions must remain finite and nonzero.',
      );
  }
}
