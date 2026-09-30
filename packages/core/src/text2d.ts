import { assetLimits } from '../../../src/data/assets.js';
import { textDefaults } from '../../../src/data/text.js';
import { AssetError, Texture } from '../../assets/src/index.js';
import { Sprite } from './sprite.js';

export interface Text2DOptions {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  padding?: number;
}

type TextStyle = Readonly<Required<Text2DOptions>>;

/** Rasterized text with scene-owned textures; transforms use the normal Sprite path. */
export class Text2D extends Sprite {
  private revision = 0;

  private constructor(
    private content: string,
    readonly style: TextStyle,
    private ownedTexture: Texture,
  ) {
    super({ texture: ownedTexture });
  }

  static async create(
    text: string,
    options: Text2DOptions = {},
  ): Promise<Text2D> {
    const style: TextStyle = Object.freeze({
      fontSize: options.fontSize ?? textDefaults.fontSize,
      fontFamily: options.fontFamily ?? textDefaults.fontFamily,
      color: options.color ?? textDefaults.color,
      padding: options.padding ?? textDefaults.padding,
    });
    if (!Number.isFinite(style.fontSize) || style.fontSize <= 0)
      throw new RangeError('Text fontSize must be positive and finite.');
    if (!Number.isSafeInteger(style.padding) || style.padding < 0)
      throw new RangeError('Text padding must be a nonnegative integer.');
    if (!style.fontFamily.trim())
      throw new RangeError('Text fontFamily is required.');
    return new Text2D(text, style, await Text2D.rasterize(text, style));
  }

  /** The currently displayed text, not a pending update. */
  get text(): string {
    return this.content;
  }

  /** Latest request wins; obsolete bitmaps are released without changing the display. */
  async setText(text: string): Promise<void> {
    if (this.destroyed) throw new AssetError('Cannot update destroyed Text2D.');
    const revision = ++this.revision;
    if (
      text === this.content &&
      this.texture === this.ownedTexture &&
      !this.texture.destroyed
    )
      return;
    const texture = await Text2D.rasterize(text, this.style);
    if (this.destroyed || revision !== this.revision) {
      texture.destroy();
      return;
    }
    const previous = this.ownedTexture;
    this.texture = texture;
    this.ownedTexture = texture;
    this.content = text;
    previous.destroy();
  }

  protected override onDestroy(): void {
    this.revision++;
    this.ownedTexture.destroy();
  }

  private static async rasterize(
    text: string,
    style: TextStyle,
  ): Promise<Texture> {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context)
      throw new AssetError('Canvas2D is required to rasterize text.');
    const font = `${style.fontSize}px ${style.fontFamily}`;
    context.font = font;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    const lines = text.split(/\r\n|\r|\n/);
    const spacing = style.fontSize * textDefaults.lineSpacing;
    let left = 0;
    let right = 0;
    let top = -style.fontSize;
    let bottom = (lines.length - 1) * spacing + style.fontSize * 0.25;
    for (let i = 0; i < lines.length; i++) {
      const metrics = context.measureText(lines[i]!);
      left = Math.min(left, -metrics.actualBoundingBoxLeft);
      right = Math.max(right, metrics.width, metrics.actualBoundingBoxRight);
      top = Math.min(top, i * spacing - metrics.actualBoundingBoxAscent);
      bottom = Math.max(bottom, i * spacing + metrics.actualBoundingBoxDescent);
    }
    const width = Math.max(1, Math.ceil(right - left + style.padding * 2));
    const height = Math.max(1, Math.ceil(bottom - top + style.padding * 2));
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width > assetLimits.textureDimension ||
      height > assetLimits.textureDimension ||
      width * height > assetLimits.texturePixels
    )
      throw new AssetError('Text exceeds the texture resource budget.');
    canvas.width = width;
    canvas.height = height;
    context.font = font;
    context.fillStyle = style.color;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    for (let i = 0; i < lines.length; i++)
      context.fillText(
        lines[i]!,
        style.padding - left,
        style.padding - top + i * spacing,
      );
    return Texture.fromImage(canvas);
  }
}
