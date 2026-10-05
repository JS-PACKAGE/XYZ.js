import { assetLimits } from '../../../src/data/assets.js';
import { graphics2dLimits } from '../../../src/data/graphics2d.js';
import { rendering2dLimits } from '../../../src/data/rendering2d.js';
import { textDefaults } from '../../../src/data/text.js';
import { AssetError, Texture, TextureView2D } from '../../assets/src/index.js';
import { Sprite } from './sprite.js';
import {
  paragraphDirection,
  textFont,
  waitForTextFonts,
} from './text-layout.js';
import type { TextDirection } from './text-layout.js';
import { graphemeBoundaries } from './text-graphemes.js';

export interface Text2DOptions {
  fontSize?: number;
  fontFamily?: string;
  /** CSS fallback family list, shared by Canvas and native selection metrics. */
  fontFallback?: string;
  /** Base paragraph direction; auto uses the browser's first-strong resolver. */
  direction?: TextDirection;
  locale?: string;
  /** wait loads declared web fonts; current freezes today's available fallback. */
  fontReadiness?: 'wait' | 'current';
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  color?: string;
  padding?: number;
  wrapWidth?: number;
  breakWords?: boolean;
  align?: 'left' | 'center' | 'right' | 'start' | 'end';
  lineHeight?: number;
  letterSpacing?: number;
  stroke?: Readonly<{ color: string; width: number }>;
  shadow?: Readonly<{
    color: string;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
  }>;
  resolution?: number;
}

export type Text2DStyle = Readonly<
  Required<Omit<Text2DOptions, 'wrapWidth' | 'stroke' | 'shadow'>> &
    Pick<Text2DOptions, 'wrapWidth' | 'stroke' | 'shadow'>
>;

export interface Text2DLineLayout {
  readonly text: string;
  readonly direction: 'ltr' | 'rtl';
  readonly x: number;
  readonly baseline: number;
  readonly width: number;
}
export interface Text2DLayout {
  readonly lines: readonly Text2DLineLayout[];
  readonly width: number;
  readonly height: number;
  readonly fontReadiness: 'ready' | 'current' | 'unavailable';
}
/** @internal An independent raster texture; ownership transfers to the caller. */
export interface RasterizedText {
  readonly texture: Texture;
  readonly layout: Text2DLayout;
}

/** @internal Shared browser-shaped raster style for 2D and 3D labels. */
export function snapshotTextStyle(options: Text2DOptions): Text2DStyle {
  const style = {
    fontSize: options.fontSize ?? textDefaults.fontSize,
    fontFamily: options.fontFamily ?? textDefaults.fontFamily,
    fontFallback: options.fontFallback ?? textDefaults.fontFallback,
    direction: options.direction ?? textDefaults.direction,
    locale: options.locale ?? textDefaults.locale,
    fontReadiness: options.fontReadiness ?? textDefaults.fontReadiness,
    fontWeight: options.fontWeight ?? 'normal',
    fontStyle: options.fontStyle ?? 'normal',
    color: options.color ?? textDefaults.color,
    padding: options.padding ?? textDefaults.padding,
    wrapWidth: options.wrapWidth,
    breakWords: options.breakWords ?? false,
    align: options.align ?? 'left',
    lineHeight:
      options.lineHeight ??
      (options.fontSize ?? textDefaults.fontSize) * textDefaults.lineSpacing,
    letterSpacing: options.letterSpacing ?? 0,
    stroke: options.stroke && Object.freeze({ ...options.stroke }),
    shadow:
      options.shadow &&
      Object.freeze({
        color: options.shadow.color,
        blur: options.shadow.blur ?? 0,
        offsetX: options.shadow.offsetX ?? 0,
        offsetY: options.shadow.offsetY ?? 0,
      }),
    resolution: options.resolution ?? 1,
  };
  if (
    ![style.fontSize, style.lineHeight].every(
      (v) => Number.isFinite(v) && v > 0 && v <= rendering2dLimits.coordinate,
    ) ||
    !Number.isFinite(style.resolution) ||
    style.resolution <= 0 ||
    style.resolution > rendering2dLimits.resolution ||
    !Number.isFinite(style.letterSpacing) ||
    Math.abs(style.letterSpacing) > rendering2dLimits.coordinate ||
    !Number.isSafeInteger(style.padding) ||
    style.padding < 0 ||
    style.padding > rendering2dLimits.coordinate
  )
    throw new RangeError('Invalid text size, spacing, padding or resolution.');
  if (
    !style.fontFamily.trim() ||
    !style.color ||
    !['normal', 'italic', 'oblique'].includes(style.fontStyle) ||
    !['left', 'center', 'right', 'start', 'end'].includes(style.align) ||
    !['ltr', 'rtl', 'auto'].includes(style.direction) ||
    !['wait', 'current'].includes(style.fontReadiness) ||
    !style.fontFallback.trim() ||
    (style.locale !== '' &&
      Intl.getCanonicalLocales(style.locale).length !== 1) ||
    (typeof style.fontWeight === 'number'
      ? !Number.isFinite(style.fontWeight) ||
        style.fontWeight < 1 ||
        style.fontWeight > 1000
      : !/^(normal|bold|bolder|lighter|[1-9]\d{0,2}|1000)$/.test(
          style.fontWeight,
        ))
  )
    throw new RangeError('Invalid text font or alignment.');
  if (
    style.wrapWidth !== undefined &&
    (!Number.isFinite(style.wrapWidth) ||
      style.wrapWidth <= 0 ||
      style.wrapWidth > rendering2dLimits.coordinate)
  )
    throw new RangeError('wrapWidth must be positive, finite and bounded.');
  if (
    style.stroke &&
    (!style.stroke.color ||
      !Number.isFinite(style.stroke.width) ||
      style.stroke.width < 0 ||
      style.stroke.width > rendering2dLimits.coordinate)
  )
    throw new RangeError('Invalid text stroke.');
  if (
    style.shadow &&
    (!style.shadow.color ||
      ![style.shadow.blur, style.shadow.offsetX, style.shadow.offsetY].every(
        (value) =>
          Number.isFinite(value) &&
          Math.abs(value!) <= rendering2dLimits.coordinate,
      ) ||
      style.shadow.blur < 0)
  )
    throw new RangeError('Invalid text shadow.');
  return Object.freeze(style);
}

/** Rasterized browser-shaped full lines, using the ordinary Sprite pipeline. */
export class Text2D extends Sprite {
  private revision = 0;
  private requestedText: string;
  private requestedStyle: Text2DStyle;
  private displayedStyle: Text2DStyle;

  private constructor(
    private content: string,
    style: Text2DStyle,
    private ownedTexture: Texture,
    private displayedLayout: Text2DLayout,
  ) {
    super({
      view: new TextureView2D(ownedTexture, {
        frame: {
          x: 0,
          y: 0,
          width: ownedTexture.width,
          height: ownedTexture.height,
        },
        resolution: style.resolution,
      }),
    });
    this.requestedText = content;
    this.requestedStyle = this.displayedStyle = style;
  }

  static async create(
    text: string,
    options: Text2DOptions = {},
  ): Promise<Text2D> {
    const style = snapshotTextStyle(options);
    const raster = await Text2D.rasterize(text, style);
    return new Text2D(text, style, raster.texture, raster.layout);
  }

  get text(): string {
    return this.content;
  }
  get style(): Text2DStyle {
    return this.displayedStyle;
  }

  get layout(): Text2DLayout {
    return this.displayedLayout;
  }

  /** Explicitly re-resolve fonts after a FontFace/fallback change. */
  async refreshFonts(): Promise<void> {
    if (this.destroyed) throw new AssetError('Cannot update destroyed Text2D.');
    await this.refresh(true);
  }

  async setText(text: string): Promise<void> {
    Text2D.validateText(text);
    if (this.destroyed) throw new AssetError('Cannot update destroyed Text2D.');
    this.requestedText = text;
    await this.refresh();
  }

  /** Merges with the latest requested style and text, not an obsolete display. */
  async setStyle(options: Text2DOptions): Promise<void> {
    const style = snapshotTextStyle({ ...this.requestedStyle, ...options });
    if (this.destroyed) throw new AssetError('Cannot update destroyed Text2D.');
    this.requestedStyle = style;
    await this.refresh();
  }

  private async refresh(force = false): Promise<void> {
    const revision = ++this.revision;
    const text = this.requestedText;
    const style = this.requestedStyle;
    // Returning to the displayed state supersedes any pending raster without redrawing.
    if (!force && text === this.content && style === this.displayedStyle)
      return;
    let raster: RasterizedText;
    try {
      raster = await Text2D.rasterize(text, style);
    } catch (error) {
      if (revision === this.revision) {
        this.requestedText = this.content;
        this.requestedStyle = this.displayedStyle;
      }
      throw error;
    }
    const { texture, layout } = raster;
    if (this.destroyed || revision !== this.revision) {
      texture.destroy();
      return;
    }
    const previous = this.ownedTexture;
    // An externally substituted texture remains borrowed; only our bitmap is released.
    this.view = new TextureView2D(texture, {
      frame: { x: 0, y: 0, width: texture.width, height: texture.height },
      resolution: style.resolution,
    });
    this.ownedTexture = texture;
    this.content = text;
    this.displayedStyle = style;
    this.displayedLayout = layout;
    previous.destroy();
  }

  protected override onDestroy(): void {
    this.revision++;
    this.ownedTexture.destroy();
  }

  private static validateText(text: string): void {
    if (
      typeof text !== 'string' ||
      text.length > graphics2dLimits.textCodeUnits
    )
      throw new RangeError('Text exceeds its input budget.');
  }

  /** @internal Shared raster generation; the caller owns the returned texture. */
  static async rasterize(
    text: string,
    style: Text2DStyle,
  ): Promise<RasterizedText> {
    Text2D.validateText(text);
    if (style.fontReadiness === 'wait' && document.fonts)
      await waitForTextFonts(text, style);
    const canvas = document.createElement('canvas');
    canvas.lang = style.locale;
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context)
      throw new AssetError('Canvas2D is required to rasterize text.');
    const font = textFont(style);
    const configure = () => {
      context.font = font;
      context.textAlign = 'left';
      context.textBaseline = 'alphabetic';
      context.fontKerning = 'auto';
      if ('letterSpacing' in context)
        context.letterSpacing = `${style.letterSpacing}px`;
      else if (style.letterSpacing !== 0)
        throw new AssetError(
          'Native Canvas letterSpacing is required for shaped spaced text.',
        );
    };
    configure();
    const lines: string[] = [];
    const directions: ('ltr' | 'rtl')[] = [];
    for (const paragraph of text.split(/\r\n|\r|\n/)) {
      const direction = paragraphDirection(paragraph, style);
      context.direction = direction;
      const pushLine = (value: string): void => {
        lines.push(value);
        directions.push(direction);
      };
      if (style.wrapWidth === undefined) {
        pushLine(paragraph);
        continue;
      }
      let line = '';
      for (const token of paragraph.match(/\S+|\s+/gu) ?? []) {
        if (line && context.measureText(line + token).width > style.wrapWidth) {
          pushLine(line.trimEnd());
          line = '';
        }
        if (!line && /^\s+$/u.test(token)) continue;
        if (
          style.breakWords &&
          context.measureText(token).width > style.wrapWidth
        ) {
          const boundaries = graphemeBoundaries(token, style.locale);
          for (let index = 1; index < boundaries.length; index++) {
            const point = token.slice(boundaries[index - 1], boundaries[index]);
            if (
              line &&
              context.measureText(line + point).width > style.wrapWidth
            ) {
              pushLine(line);
              line = '';
            }
            line += point;
          }
        } else line += token;
      }
      pushLine(line.trimEnd());
    }
    const widths = lines.map((line, index) => {
      context.direction = directions[index]!;
      return context.measureText(line).width;
    });
    const layoutWidth = style.wrapWidth ?? Math.max(0, ...widths);
    const offsets = widths.map((width, index) => {
      const right =
        style.align === 'right' ||
        (style.align === 'start' && directions[index] === 'rtl') ||
        (style.align === 'end' && directions[index] === 'ltr');
      return style.align === 'center'
        ? (layoutWidth - width) / 2
        : right
          ? layoutWidth - width
          : 0;
    });
    let left = 0,
      right = layoutWidth,
      top = -style.fontSize,
      bottom = (lines.length - 1) * style.lineHeight + style.fontSize * 0.25;
    for (let i = 0; i < lines.length; i++) {
      context.direction = directions[i]!;
      const metrics = context.measureText(lines[i]!);
      left = Math.min(left, offsets[i]! - metrics.actualBoundingBoxLeft);
      right = Math.max(
        right,
        offsets[i]! + Math.max(metrics.width, metrics.actualBoundingBoxRight),
      );
      top = Math.min(
        top,
        i * style.lineHeight - metrics.actualBoundingBoxAscent,
      );
      bottom = Math.max(
        bottom,
        i * style.lineHeight + metrics.actualBoundingBoxDescent,
      );
    }
    const stroke = (style.stroke?.width ?? 0) / 2;
    const shadow = style.shadow;
    const blur = (shadow?.blur ?? 0) * 3;
    const insetLeft = stroke + Math.max(0, blur - (shadow?.offsetX ?? 0));
    const insetRight = stroke + Math.max(0, blur + (shadow?.offsetX ?? 0));
    const insetTop = stroke + Math.max(0, blur - (shadow?.offsetY ?? 0));
    const insetBottom = stroke + Math.max(0, blur + (shadow?.offsetY ?? 0));
    const width = Math.max(
      1,
      Math.ceil(
        (right - left + style.padding * 2 + insetLeft + insetRight) *
          style.resolution,
      ),
    );
    const height = Math.max(
      1,
      Math.ceil(
        (bottom - top + style.padding * 2 + insetTop + insetBottom) *
          style.resolution,
      ),
    );
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
    context.scale(style.resolution, style.resolution);
    configure();
    context.fillStyle = style.color;
    if (style.stroke) {
      context.strokeStyle = style.stroke.color;
      context.lineWidth = style.stroke.width;
      context.lineJoin = 'round';
    }
    if (shadow) {
      context.shadowColor = shadow.color;
      context.shadowBlur = shadow.blur! * style.resolution;
      context.shadowOffsetX = shadow.offsetX! * style.resolution;
      context.shadowOffsetY = shadow.offsetY! * style.resolution;
    }
    const layoutLines: Text2DLineLayout[] = [];
    for (let i = 0; i < lines.length; i++) {
      const x = style.padding + insetLeft - left + offsets[i]!;
      const y = style.padding + insetTop - top + i * style.lineHeight;
      context.direction = directions[i]!;
      layoutLines.push(
        Object.freeze({
          text: lines[i]!,
          direction: directions[i]!,
          x,
          baseline: y,
          width: widths[i]!,
        }),
      );
      if (style.stroke && style.stroke.width)
        context.strokeText(lines[i]!, x, y);
      context.fillText(lines[i]!, x, y);
    }
    try {
      const texture = await Texture.fromImage(canvas);
      return {
        texture,
        layout: Object.freeze({
          lines: Object.freeze(layoutLines),
          width: width / style.resolution,
          height: height / style.resolution,
          fontReadiness: !document.fonts
            ? 'unavailable'
            : style.fontReadiness === 'wait'
              ? 'ready'
              : 'current',
        }),
      };
    } finally {
      canvas.width = canvas.height = 0;
    }
  }
}
