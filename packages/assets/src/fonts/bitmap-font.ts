import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import { AssetError, Texture, type AssetLoader } from '../index.js';

export interface BitmapGlyph {
  readonly id: number;
  readonly page: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly xoffset: number;
  readonly yoffset: number;
  readonly xadvance: number;
}
export interface BitmapKerning {
  readonly first: number;
  readonly second: number;
  readonly amount: number;
}
export interface BitmapFontData {
  readonly size: number;
  readonly lineHeight: number;
  readonly base: number;
  readonly glyphs: readonly BitmapGlyph[];
  readonly kernings: readonly BitmapKerning[];
}

/** Caller-owned RGBA pages; destroy only after all SpriteText borrowers detach. */
export class BitmapFontAsset implements BitmapFontData {
  readonly size: number;
  readonly lineHeight: number;
  readonly base: number;
  readonly glyphs: readonly BitmapGlyph[];
  readonly kernings: readonly BitmapKerning[];
  readonly pages: readonly Texture[];
  private disposed = false;

  constructor(pages: readonly Texture[], data: BitmapFontData) {
    validate(data, pages.length);
    if (pages.some((page) => page.destroyed))
      throw new AssetError('Bitmap font page is destroyed.');
    for (const glyph of data.glyphs) {
      const page = pages[glyph.page]!;
      if (
        glyph.x + glyph.width > page.width ||
        glyph.y + glyph.height > page.height
      )
        throw new AssetError('Bitmap glyph exceeds its page.');
    }
    this.pages = Object.freeze([...pages]);
    this.size = data.size;
    this.lineHeight = data.lineHeight;
    this.base = data.base;
    this.glyphs = Object.freeze(
      data.glyphs.map((glyph) => Object.freeze({ ...glyph })),
    );
    this.kernings = Object.freeze(
      data.kernings.map((pair) => Object.freeze({ ...pair })),
    );
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const page of this.pages) page.destroy();
  }
}

function validate(data: BitmapFontData, pages: number): void {
  if (
    !data ||
    !Array.isArray(data.glyphs) ||
    !Array.isArray(data.kernings) ||
    !Number.isInteger(pages) ||
    pages < 1 ||
    pages > rendering2dLimits.fontPages ||
    !data.glyphs.length ||
    data.glyphs.length > rendering2dLimits.fontGlyphs ||
    data.kernings.length > rendering2dLimits.atlasFrames
  )
    throw new AssetError('Bitmap font exceeds its page/glyph/kerning budget.');
  if (
    ![data.size, data.lineHeight].every(
      (v) => Number.isFinite(v) && v > 0 && v <= rendering2dLimits.coordinate,
    ) ||
    !Number.isFinite(data.base) ||
    data.base < 0 ||
    data.base > rendering2dLimits.coordinate
  )
    throw new AssetError('Invalid bitmap font metrics.');
  const ids = new Set<number>();
  for (const glyph of data.glyphs) {
    if (!glyph || typeof glyph !== 'object' || Array.isArray(glyph))
      throw new AssetError('Invalid bitmap glyph record.');
    if (
      !Number.isInteger(glyph.id) ||
      glyph.id < 0 ||
      glyph.id > 0x10ffff ||
      (glyph.id >= 0xd800 && glyph.id <= 0xdfff) ||
      ids.has(glyph.id)
    )
      throw new AssetError('Glyph IDs must be unique Unicode scalar values.');
    ids.add(glyph.id);
    if (
      !Number.isInteger(glyph.page) ||
      glyph.page < 0 ||
      glyph.page >= pages ||
      ![glyph.x, glyph.y, glyph.width, glyph.height].every(
        (v) =>
          Number.isSafeInteger(v) &&
          v >= 0 &&
          v <= rendering2dLimits.targetDimension,
      ) ||
      ![glyph.xoffset, glyph.yoffset, glyph.xadvance].every(
        (v) =>
          Number.isFinite(v) && Math.abs(v) <= rendering2dLimits.coordinate,
      )
    )
      throw new AssetError('Invalid bitmap glyph metrics.');
  }
  const pairs = new Set<string>();
  for (const pair of data.kernings) {
    if (!pair || typeof pair !== 'object' || Array.isArray(pair))
      throw new AssetError('Invalid bitmap kerning record.');
    const key = `${pair.first}:${pair.second}`;
    if (
      !ids.has(pair.first) ||
      !ids.has(pair.second) ||
      pairs.has(key) ||
      !Number.isFinite(pair.amount) ||
      Math.abs(pair.amount) > rendering2dLimits.coordinate
    )
      throw new AssetError('Invalid bitmap kerning pair.');
    pairs.add(key);
  }
}

interface FontDescriptor extends BitmapFontData {
  pages: string[];
  width: number;
  height: number;
}

/** AngelCode text and JSON equivalents only; no XML or distance-field fonts. */
export class BitmapFontLoader {
  constructor(private readonly loader: AssetLoader) {}

  static parse(
    source: string,
    format: 'text' | 'json' = 'text',
  ): FontDescriptor {
    if (
      typeof source !== 'string' ||
      source.length > rendering2dLimits.fontBytes
    )
      throw new AssetError('Bitmap font descriptor exceeds its byte budget.');
    let bytes = 0;
    for (const point of source) {
      const code = point.codePointAt(0)!;
      bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
      if (bytes > rendering2dLimits.fontBytes)
        throw new AssetError('Bitmap font descriptor exceeds its byte budget.');
    }
    let record: Record<string, unknown>;
    if (format === 'json') {
      try {
        record = JSON.parse(source) as Record<string, unknown>;
      } catch (error) {
        throw new AssetError('Invalid bitmap font JSON.', { cause: error });
      }
    } else if (format === 'text') {
      record = { pages: [], chars: [], kernings: [] };
      const pages = record.pages as string[];
      const chars = record.chars as unknown[];
      const kernings = record.kernings as unknown[];
      for (const line of source.split(/\r?\n/u)) {
        if (!line.trim()) continue;
        const kind = line.trim().split(/\s/u, 1)[0]!;
        if (
          ![
            'info',
            'common',
            'page',
            'chars',
            'char',
            'kernings',
            'kerning',
          ].includes(kind)
        )
          throw new AssetError('Unsupported bitmap font record.');
        const fields: Record<string, unknown> = {};
        for (const match of line.matchAll(/(\w+)=(?:"([^"\r\n]*)"|([^\s]+))/gu))
          fields[match[1]!] = match[2] ?? Number(match[3]);
        if (kind === 'info' || kind === 'common') record[kind] = fields;
        if (kind === 'page') {
          const id = fields.id as number;
          if (
            !Number.isInteger(id) ||
            id < 0 ||
            id >= rendering2dLimits.fontPages ||
            pages[id] !== undefined ||
            typeof fields.file !== 'string'
          )
            throw new AssetError('Invalid bitmap page record.');
          pages[id] = fields.file;
        }
        if (kind === 'char') chars.push(fields);
        if (kind === 'kerning') kernings.push(fields);
        if (
          chars.length > rendering2dLimits.fontGlyphs ||
          kernings.length > rendering2dLimits.atlasFrames
        )
          throw new AssetError('Bitmap font records exceed their budget.');
      }
    } else throw new AssetError('Unsupported bitmap font format.');
    if (
      !record ||
      typeof record !== 'object' ||
      Array.isArray(record) ||
      record.distanceField !== undefined
    )
      throw new AssetError(
        'Invalid or unsupported distance-field font descriptor.',
      );
    const info = record.info as Record<string, unknown> | undefined;
    const common = record.common as Record<string, unknown> | undefined;
    if (
      !info ||
      typeof info !== 'object' ||
      Array.isArray(info) ||
      !common ||
      typeof common !== 'object' ||
      Array.isArray(common) ||
      (common.packed !== undefined && common.packed !== 0) ||
      !Number.isSafeInteger(info.size) ||
      info.size === 0 ||
      !Array.isArray(record.pages) ||
      !Array.isArray(record.chars) ||
      (record.kernings !== undefined && !Array.isArray(record.kernings))
    )
      throw new AssetError('Invalid or packed bitmap font descriptor.');
    const pages = record.pages as string[];
    if (
      pages.some((page) => typeof page !== 'string' || !page.trim()) ||
      Array.from({ length: pages.length }, (_, i) => pages[i]).some(
        (page) => page === undefined,
      ) ||
      common.pages !== pages.length
    )
      throw new AssetError(
        'Bitmap pages must be contiguous nonempty filenames.',
      );
    const glyphs = (record.chars as Record<string, unknown>[]).map((glyph) => {
      if (
        !glyph ||
        typeof glyph !== 'object' ||
        Array.isArray(glyph) ||
        (glyph.chnl !== undefined && glyph.chnl !== 15)
      )
        throw new AssetError('Channel-packed bitmap glyphs are unsupported.');
      const result = Object.fromEntries(
        [
          'id',
          'page',
          'x',
          'y',
          'width',
          'height',
          'xoffset',
          'yoffset',
          'xadvance',
        ].map((key) => [key, glyph[key]]),
      ) as unknown as BitmapGlyph;
      if (!Object.values(result).every(Number.isSafeInteger))
        throw new AssetError('AngelCode metrics must be integer values.');
      return result;
    });
    const kernings = ((record.kernings ?? []) as BitmapKerning[]).map(
      (pair) => {
        if (
          !pair ||
          typeof pair !== 'object' ||
          Array.isArray(pair) ||
          ![pair.first, pair.second, pair.amount].every(Number.isSafeInteger)
        )
          throw new AssetError('Invalid integer bitmap kerning record.');
        return { first: pair.first, second: pair.second, amount: pair.amount };
      },
    );
    const data = {
      size: Math.abs(info.size as number),
      lineHeight: common.lineHeight as number,
      base: common.base as number,
      glyphs,
      kernings,
      pages,
      width: common.scaleW as number,
      height: common.scaleH as number,
    };
    validate(data, pages.length);
    if (
      ![data.width, data.height].every(
        (v) =>
          Number.isSafeInteger(v) &&
          v > 0 &&
          v <= rendering2dLimits.targetDimension,
      ) ||
      data.width * data.height > rendering2dLimits.targetPixels
    )
      throw new AssetError('Bitmap page dimensions exceed their budget.');
    for (const glyph of glyphs)
      if (
        glyph.x + glyph.width > data.width ||
        glyph.y + glyph.height > data.height
      )
        throw new AssetError('Bitmap glyph exceeds declared dimensions.');
    return data;
  }

  async load(
    url: string,
    options: { format?: 'text' | 'json'; signal?: AbortSignal } = {},
  ): Promise<BitmapFontAsset> {
    const text = await this.loader.loadText(url, {
      signal: options.signal,
      maxBytes: rendering2dLimits.fontBytes,
    });
    const format =
      options.format ?? (/\.json(?:[?#]|$)/iu.test(url) ? 'json' : 'text');
    const data = BitmapFontLoader.parse(text, format);
    const base = new URL(
      url,
      typeof document !== 'undefined' ? document.baseURI : undefined,
    );
    const pages: Texture[] = [];
    try {
      for (const filename of data.pages) {
        options.signal?.throwIfAborted();
        const page = await this.loader.loadTextureOwned(
          new URL(filename, base).href,
          { signal: options.signal },
        );
        pages.push(page);
        if (page.width !== data.width || page.height !== data.height)
          throw new AssetError('Bitmap page size differs from descriptor.');
      }
      options.signal?.throwIfAborted();
      return new BitmapFontAsset(pages, data);
    } catch (error) {
      for (const page of pages) page.destroy();
      throw error;
    }
  }
}
