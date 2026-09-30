import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import { AssetError, Texture } from '../index.js';
import { subscribeLoad } from '../preload/subscribe-load.js';
import {
  BitmapFontAsset,
  type BitmapGlyph,
  type BitmapKerning,
} from './bitmap-font.js';
import { FontAsset } from './font-asset.js';

export interface DynamicBitmapFontOptions {
  alphabet: string;
  fontSize: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  pageSize?: number;
  padding?: number;
  color?: string;
  kerning?: boolean;
  signal?: AbortSignal;
}

/** Native measured code-point RGBA atlas, not shaping, SDF or MSDF. Pages belong to caller. */
export async function generateBitmapFont(
  font: FontAsset,
  options: DynamicBitmapFontOptions,
): Promise<BitmapFontAsset> {
  const signal = options.signal;
  signal?.throwIfAborted();
  if (font.destroyed)
    throw new AssetError('Cannot generate from a destroyed FontAsset.');
  if (
    typeof options.alphabet !== 'string' ||
    options.alphabet.length > rendering2dLimits.fontGlyphs * 2
  )
    throw new RangeError('Alphabet exceeds its code-point budget.');
  const characters = Array.from(options.alphabet);
  const pageSize = options.pageSize ?? 512;
  const padding = options.padding ?? 1;
  if (
    !characters.length ||
    characters.length > rendering2dLimits.fontGlyphs ||
    new Set(characters).size !== characters.length ||
    characters.some(
      (character) =>
        character === '\n' ||
        character === '\r' ||
        (character.codePointAt(0)! >= 0xd800 &&
          character.codePointAt(0)! <= 0xdfff),
    )
  )
    throw new RangeError(
      'Alphabet must contain unique bounded Unicode scalar glyphs.',
    );
  if (
    !Number.isFinite(options.fontSize) ||
    options.fontSize <= 0 ||
    options.fontSize > rendering2dLimits.coordinate ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > rendering2dLimits.targetDimension ||
    pageSize * pageSize > rendering2dLimits.targetPixels ||
    !Number.isSafeInteger(padding) ||
    padding < 0 ||
    padding * 2 >= pageSize
  )
    throw new RangeError('Invalid dynamic font dimensions.');
  if (
    !['normal', 'italic', 'oblique'].includes(options.fontStyle ?? 'normal') ||
    (typeof options.fontWeight === 'number'
      ? !Number.isFinite(options.fontWeight) ||
        options.fontWeight < 1 ||
        options.fontWeight > 1000
      : !/^(normal|bold|bolder|lighter|[1-9]\d{0,2}|1000)$/u.test(
          options.fontWeight ?? 'normal',
        ))
  )
    throw new RangeError('Invalid dynamic font style or weight.');
  if (
    options.kerning &&
    characters.length * characters.length > rendering2dLimits.atlasFrames
  )
    throw new RangeError(
      'Dynamic kerning pairs exceed their measurement budget.',
    );
  await subscribeLoad(font.ready, signal);
  signal?.throwIfAborted();
  if (font.destroyed)
    throw new AssetError('FontAsset was destroyed during generation.');
  const measureCanvas = document.createElement('canvas');
  const context = measureCanvas.getContext('2d');
  if (!context)
    throw new AssetError('Canvas2D is required for RGBA font generation.');
  if (
    options.color !== undefined &&
    (typeof options.color !== 'string' || !CSS.supports('color', options.color))
  )
    throw new RangeError('Invalid dynamic font color.');
  const canvases: HTMLCanvasElement[] = [];
  const pages: Texture[] = [];
  try {
    const fontString = `${options.fontStyle ?? 'normal'} ${options.fontWeight ?? 'normal'} ${options.fontSize}px "${font.family}"`;
    context.font = fontString;
    context.textBaseline = 'alphabetic';
    const measurements = characters.map((character) =>
      context.measureText(character),
    );
    let base = Math.ceil(options.fontSize),
      descent = Math.ceil(options.fontSize * 0.25);
    for (const metrics of measurements) {
      base = Math.max(base, Math.ceil(metrics.actualBoundingBoxAscent));
      descent = Math.max(descent, Math.ceil(metrics.actualBoundingBoxDescent));
    }
    const glyphs: BitmapGlyph[] = [];
    let x = padding,
      y = padding,
      rowHeight = 0;
    let pageContext: CanvasRenderingContext2D;
    const addPage = () => {
      if (canvases.length >= rendering2dLimits.fontPages)
        throw new AssetError('Generated font exceeds its page budget.');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = pageSize;
      canvases.push(canvas);
      const drawing = canvas.getContext('2d');
      if (!drawing)
        throw new AssetError('Canvas2D is required for RGBA font generation.');
      drawing.font = fontString;
      drawing.textBaseline = 'alphabetic';
      drawing.fillStyle = options.color ?? '#ffffff';
      pageContext = drawing;
      x = padding;
      y = padding;
      rowHeight = 0;
    };
    addPage();
    for (let index = 0; index < characters.length; index++) {
      signal?.throwIfAborted();
      const metrics = measurements[index]!;
      const left = Math.ceil(metrics.actualBoundingBoxLeft),
        right = Math.ceil(metrics.actualBoundingBoxRight);
      const ascent = Math.ceil(metrics.actualBoundingBoxAscent),
        below = Math.ceil(metrics.actualBoundingBoxDescent);
      const width = Math.max(0, left + right),
        height = Math.max(0, ascent + below);
      if (width + padding * 2 > pageSize || height + padding * 2 > pageSize)
        throw new AssetError('A generated glyph exceeds its atlas page.');
      if (width && height) {
        if (x + width + padding > pageSize) {
          x = padding;
          y += rowHeight + padding * 2;
          rowHeight = 0;
        }
        if (y + height + padding > pageSize) addPage();
        pageContext!.fillText(characters[index]!, x + left, y + ascent);
      }
      glyphs.push({
        id: characters[index]!.codePointAt(0)!,
        page: canvases.length - 1,
        x,
        y,
        width,
        height,
        xoffset: -left,
        yoffset: base - ascent,
        xadvance: metrics.width,
      });
      if (width && height) {
        x += width + padding * 2;
        rowHeight = Math.max(rowHeight, height);
      }
    }
    const kernings: BitmapKerning[] = [];
    if (options.kerning) {
      for (let first = 0; first < characters.length; first++)
        for (let second = 0; second < characters.length; second++) {
          const amount =
            context.measureText(characters[first]! + characters[second]!)
              .width -
            measurements[first]!.width -
            measurements[second]!.width;
          if (Math.abs(amount) > 1e-6)
            kernings.push({
              first: characters[first]!.codePointAt(0)!,
              second: characters[second]!.codePointAt(0)!,
              amount,
            });
        }
    }
    for (const canvas of canvases) {
      signal?.throwIfAborted();
      pages.push(await Texture.fromImage(canvas));
      if (font.destroyed)
        throw new AssetError('FontAsset was destroyed during generation.');
    }
    signal?.throwIfAborted();
    return new BitmapFontAsset(pages, {
      size: options.fontSize,
      lineHeight: base + descent,
      base,
      glyphs,
      kernings,
    });
  } catch (error) {
    for (const page of pages) page.destroy();
    throw error;
  } finally {
    measureCanvas.width = measureCanvas.height = 0;
    for (const canvas of canvases) {
      canvas.width = canvas.height = 0;
    }
  }
}
