import { AssetError, Texture } from '../../../assets/src/index.js';
import { graphics2dLimits } from '../../../../src/data/graphics2d.js';
import type { Rect2D } from '../gameplay/contracts.js';
import { Group2D } from '../gameplay/group2d.js';
import { Sprite } from '../sprite.js';
import { validatedRegion } from './sprite-sheet.js';

export type NineSliceMode = 'stretch' | 'tile' | 'tile-fit';
export interface NineSliceOptions {
  source?: Rect2D;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  mode?: NineSliceMode;
  drawCenter?: boolean;
}
interface Patch {
  source: Rect2D;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Nine ordinary atlas cells, expanded into bounded reusable Sprite tiles. */
export class NineSlice extends Group2D {
  private readonly source: Readonly<Rect2D>;
  private readonly margins: readonly [number, number, number, number];
  readonly mode: NineSliceMode;
  readonly drawCenter: boolean;
  private readonly pool: Sprite[] = [];
  private destinationWidth = 0;
  private destinationHeight = 0;

  constructor(
    readonly texture: Texture,
    options: NineSliceOptions,
  ) {
    super();
    this.source = validatedRegion(
      texture,
      options.source ?? {
        x: 0,
        y: 0,
        width: texture.width,
        height: texture.height,
      },
    );
    this.margins = [options.left, options.right, options.top, options.bottom];
    if (
      !this.margins.every((value) => Number.isInteger(value) && value >= 0) ||
      options.left + options.right > this.source.width ||
      options.top + options.bottom > this.source.height
    )
      throw new RangeError(
        'NineSlice margins must be nonnegative source pixels within the source.',
      );
    this.mode = options.mode ?? 'stretch';
    this.drawCenter = options.drawCenter ?? true;
    if (!['stretch', 'tile', 'tile-fit'].includes(this.mode))
      throw new RangeError('Invalid NineSlice mode.');
    this.resize(options.width, options.height);
  }

  get width(): number {
    return this.destinationWidth;
  }
  get height(): number {
    return this.destinationHeight;
  }

  resize(width: number, height: number): void {
    if (this.destroyed) throw new Error('Cannot resize destroyed NineSlice.');
    if (this.texture.destroyed)
      throw new AssetError('Cannot use a destroyed Texture.');
    if (
      ![width, height].every(
        (value) =>
          Number.isFinite(value) &&
          value >= 0 &&
          value <= graphics2dLimits.dimension,
      )
    )
      throw new RangeError('NineSlice destination exceeds its size budget.');
    const [left, right, top, bottom] = this.margins;
    const horizontal = left + right > width ? width / (left + right) : 1;
    const vertical = top + bottom > height ? height / (top + bottom) : 1;
    const sw = [left, this.source.width - left - right, right];
    const sh = [top, this.source.height - top - bottom, bottom];
    const dw = [
      left * horizontal,
      Math.max(0, width - (left + right) * horizontal),
      right * horizontal,
    ];
    const dh = [
      top * vertical,
      Math.max(0, height - (top + bottom) * vertical),
      bottom * vertical,
    ];
    const patches: Patch[] = [];
    let sy = this.source.y;
    let dy = 0;
    for (let row = 0; row < 3; row++) {
      let sx = this.source.x;
      let dx = 0;
      for (let column = 0; column < 3; column++) {
        const sourceWidth = sw[column]!;
        const sourceHeight = sh[row]!;
        const targetWidth = dw[column]!;
        const targetHeight = dh[row]!;
        if (
          (row !== 1 || column !== 1 || this.drawCenter) &&
          sourceWidth > 0 &&
          sourceHeight > 0 &&
          targetWidth > 0 &&
          targetHeight > 0
        ) {
          const tileX = this.mode !== 'stretch' && column === 1;
          const tileY = this.mode !== 'stretch' && row === 1;
          const columns = tileX
            ? Math.max(1, Math.ceil(targetWidth / sourceWidth))
            : 1;
          const rows = tileY
            ? Math.max(1, Math.ceil(targetHeight / sourceHeight))
            : 1;
          if (patches.length + columns * rows > graphics2dLimits.tiles)
            throw new RangeError('NineSlice exceeds its tile budget.');
          const stepX =
            tileX && this.mode === 'tile' ? sourceWidth : targetWidth / columns;
          const stepY =
            tileY && this.mode === 'tile' ? sourceHeight : targetHeight / rows;
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
              const w = Math.min(stepX, targetWidth - x * stepX);
              const h = Math.min(stepY, targetHeight - y * stepY);
              patches.push({
                source: {
                  x: sx,
                  y: sy,
                  width: tileX && this.mode === 'tile' ? w : sourceWidth,
                  height: tileY && this.mode === 'tile' ? h : sourceHeight,
                },
                x: dx + x * stepX,
                y: dy + y * stepY,
                width: w,
                height: h,
              });
            }
          }
        }
        sx += sourceWidth;
        dx += targetWidth;
      }
      sy += sh[row]!;
      dy += dh[row]!;
    }
    const extra: Sprite[] = [];
    try {
      for (let index = this.pool.length; index < patches.length; index++)
        extra.push(
          new Sprite({
            texture: this.texture,
            source: patches[index]!.source,
            anchor: [0, 0],
          }),
        );
    } catch (error) {
      for (const sprite of extra) sprite.destroy();
      throw error;
    }
    for (const sprite of extra) {
      this.add(sprite);
      this.pool.push(sprite);
    }
    for (let index = 0; index < this.pool.length; index++) {
      const sprite = this.pool[index]!;
      const patch = patches[index];
      sprite.visible = patch !== undefined;
      if (!patch) continue;
      sprite.source = patch.source;
      sprite.position.set(patch.x, patch.y);
      sprite.scale.set(
        patch.width / patch.source.width,
        patch.height / patch.source.height,
      );
    }
    this.destinationWidth = width;
    this.destinationHeight = height;
  }
}
