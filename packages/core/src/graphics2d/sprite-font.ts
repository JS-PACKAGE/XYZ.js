import {
  AssetError,
  BitmapFontAsset,
  type Texture2DSource,
} from '../../../assets/src/index.js';
import { graphics2dLimits } from '../../../../src/data/graphics2d.js';
import { Group2D } from '../gameplay/group2d.js';
import type { Rect2D } from '../gameplay/contracts.js';
import { Sprite } from '../sprite.js';
import { SpriteSheet } from './sprite-sheet.js';

export interface SpriteFontOptions {
  alphabet: string;
  glyphWidth?: number;
  advance?: number;
  lineHeight: number;
  caseInsensitive?: boolean;
  fallback?: string;
}
export interface SpriteTextOptions {
  letterSpacing?: number;
  lineSpacing?: number;
  align?: 'left' | 'center' | 'right';
  wrapWidth?: number;
  breakWords?: boolean;
}
interface FontGlyph {
  readonly id: number;
  readonly texture: Texture2DSource;
  readonly source: Readonly<Rect2D>;
  readonly width: number;
  readonly xoffset: number;
  readonly yoffset: number;
  readonly advance: number;
}
interface TextMeasurement {
  width: number;
  advance: number;
  first: number | undefined;
  last: number | undefined;
}

/** A metrics snapshot borrowing either a manual sheet or caller-owned bitmap pages. */
export class SpriteFont {
  readonly sheet: SpriteSheet | undefined;
  readonly glyphWidth: number | undefined;
  readonly advance: number;
  readonly lineHeight: number;
  readonly caseInsensitive: boolean;
  private readonly indices = new Map<string, number>();
  private readonly metrics: readonly FontGlyph[];
  private readonly kernings = new Map<string, number>();
  private readonly fallbackIndex: number | undefined;
  private readonly asset: BitmapFontAsset | undefined;

  constructor(source: SpriteSheet, options: SpriteFontOptions);
  constructor(
    source: BitmapFontAsset,
    options?: Pick<SpriteFontOptions, 'caseInsensitive' | 'fallback'>,
  );
  constructor(
    source: SpriteSheet | BitmapFontAsset,
    options: Partial<SpriteFontOptions> = {},
  ) {
    this.caseInsensitive = options.caseInsensitive ?? false;
    if (source instanceof SpriteSheet) {
      if (options.alphabet === undefined || options.lineHeight === undefined)
        throw new RangeError(
          'A sheet font requires an alphabet and lineHeight.',
        );
      const alphabet = Array.from(options.alphabet);
      if (!alphabet.length || alphabet.length !== source.frames.length)
        throw new RangeError(
          'Alphabet must map each sheet frame exactly once.',
        );
      this.sheet = source;
      this.glyphWidth = options.glyphWidth;
      this.advance =
        options.advance ?? options.glyphWidth ?? source.frames[0]!.width;
      this.lineHeight = options.lineHeight;
      for (const value of [
        this.advance,
        this.lineHeight,
        ...(this.glyphWidth === undefined ? [] : [this.glyphWidth]),
      ])
        if (
          !Number.isFinite(value) ||
          value <= 0 ||
          value > graphics2dLimits.dimension
        )
          throw new RangeError(
            'Font metrics must be positive finite bounded values.',
          );
      this.metrics = Object.freeze(
        alphabet.map((character, index) => {
          this.map(character, index);
          const frame = source.getFrame(index);
          return Object.freeze({
            id: character.codePointAt(0)!,
            texture: source.texture,
            source: frame,
            width: this.glyphWidth ?? frame.width,
            xoffset: 0,
            yoffset: 0,
            advance: this.advance,
          });
        }),
      );
    } else {
      if (source.destroyed)
        throw new AssetError('Cannot use a destroyed bitmap font.');
      this.asset = source;
      this.lineHeight = source.lineHeight;
      this.advance = source.glyphs[0]!.xadvance;
      this.metrics = Object.freeze(
        source.glyphs.map((glyph, index) => {
          this.map(String.fromCodePoint(glyph.id), index);
          return Object.freeze({
            id: glyph.id,
            texture: source.pages[glyph.page]!,
            source: Object.freeze({
              x: glyph.x,
              y: glyph.y,
              width: glyph.width,
              height: glyph.height,
            }),
            width: glyph.width,
            xoffset: glyph.xoffset,
            yoffset: glyph.yoffset,
            advance: glyph.xadvance,
          });
        }),
      );
      for (const pair of source.kernings)
        this.kernings.set(`${pair.first}:${pair.second}`, pair.amount);
    }
    if (options.fallback !== undefined) {
      if (Array.from(options.fallback).length !== 1)
        throw new RangeError('Fallback must be one mapped Unicode code point.');
      this.fallbackIndex = this.indices.get(this.key(options.fallback));
      if (this.fallbackIndex === undefined)
        throw new RangeError('Fallback glyph is not mapped.');
    }
    this.assertAvailable();
  }

  private key(character: string): string {
    return this.caseInsensitive ? character.toLowerCase() : character;
  }
  private map(character: string, index: number): void {
    const key = this.key(character);
    const id = character.codePointAt(0)!;
    if (
      character === '\n' ||
      character === '\r' ||
      (id >= 0xd800 && id <= 0xdfff) ||
      this.indices.has(key)
    )
      throw new RangeError(
        'Alphabet contains a duplicate, newline or non-scalar glyph.',
      );
    this.indices.set(key, index);
  }
  getGlyphIndex(character: string): number {
    const index = this.indices.get(this.key(character)) ?? this.fallbackIndex;
    if (index === undefined)
      throw new RangeError(`Unmapped font glyph: ${character}`);
    return index;
  }
  getGlyph(index: number): FontGlyph {
    const glyph = this.metrics[index];
    if (!glyph) throw new RangeError('Font glyph index is out of range.');
    return glyph;
  }
  getKerning(first: number | undefined, second: number): number {
    return first === undefined
      ? 0
      : (this.kernings.get(
          `${this.metrics[first]!.id}:${this.metrics[second]!.id}`,
        ) ?? 0);
  }
  assertAvailable(): void {
    if (
      this.asset?.destroyed ||
      this.metrics.some((glyph) => glyph.texture.destroyed)
    )
      throw new AssetError('Cannot use destroyed bitmap font pages.');
  }
}

/** Owns ordinary Sprite glyph objects, never the font or its atlas pages. Unicode code points, not shaping. */
export class SpriteText extends Group2D {
  private content = '';
  private glyphs: Sprite[] = [];
  private readonly letterSpacing: number;
  private readonly lineSpacing: number;
  private readonly align: 'left' | 'center' | 'right';
  private readonly wrapWidth: number | undefined;
  private readonly breakWords: boolean;

  constructor(
    readonly font: SpriteFont,
    text: string,
    options: SpriteTextOptions = {},
  ) {
    super();
    this.letterSpacing = options.letterSpacing ?? 0;
    this.lineSpacing = options.lineSpacing ?? 0;
    this.align = options.align ?? 'left';
    this.wrapWidth = options.wrapWidth;
    this.breakWords = options.breakWords ?? false;
    if (
      ![this.letterSpacing, this.lineSpacing].every(Number.isFinite) ||
      font.lineHeight + this.lineSpacing <= 0 ||
      !['left', 'center', 'right'].includes(this.align) ||
      (this.wrapWidth !== undefined &&
        (!Number.isFinite(this.wrapWidth) ||
          this.wrapWidth <= 0 ||
          this.wrapWidth > graphics2dLimits.dimension))
    )
      throw new RangeError(
        'Invalid SpriteText spacing, alignment or wrapping.',
      );
    this.setText(text);
  }

  get text(): string {
    return this.content;
  }

  private measure(text: string): TextMeasurement {
    let advance = 0,
      width = 0,
      first: number | undefined,
      last: number | undefined;
    for (const character of text) {
      const index = this.font.getGlyphIndex(character);
      const glyph = this.font.getGlyph(index);
      if (last !== undefined)
        advance += this.letterSpacing + this.font.getKerning(last, index);
      first ??= index;
      width = advance + (this.font.sheet ? glyph.width : glyph.advance);
      advance += glyph.advance;
      last = index;
    }
    return { width, advance, first, last };
  }

  private lines(text: string): string[] {
    const lines: string[] = [];
    for (const paragraph of text.replace(/\r\n?/gu, '\n').split('\n')) {
      if (this.wrapWidth === undefined) {
        lines.push(paragraph);
        continue;
      }
      let line = '',
        advance = 0,
        last: number | undefined;
      const push = () => {
        lines.push(line.trimEnd());
        line = '';
        advance = 0;
        last = undefined;
      };
      const append = (token: string, metrics: TextMeasurement) => {
        if (last !== undefined && metrics.first !== undefined)
          advance +=
            this.letterSpacing + this.font.getKerning(last, metrics.first);
        advance += metrics.advance;
        last = metrics.last;
        line += token;
      };
      for (const token of paragraph.match(/\S+|\s+/gu) ?? []) {
        const metrics = this.measure(token);
        const boundary =
          last !== undefined && metrics.first !== undefined
            ? this.letterSpacing + this.font.getKerning(last, metrics.first)
            : 0;
        if (line && advance + boundary + metrics.width > this.wrapWidth) push();
        if (!line && /^\s+$/u.test(token)) continue;
        if (this.breakWords && metrics.width > this.wrapWidth) {
          for (const character of token) {
            const single = this.measure(character);
            const kern =
              last !== undefined
                ? this.letterSpacing + this.font.getKerning(last, single.first!)
                : 0;
            if (line && advance + kern + single.width > this.wrapWidth) push();
            append(character, single);
          }
        } else append(token, metrics);
      }
      lines.push(line.trimEnd());
    }
    return lines;
  }

  setText(text: string): void {
    if (this.destroyed)
      throw new AssetError('Cannot update destroyed SpriteText.');
    if (
      typeof text !== 'string' ||
      text.length > graphics2dLimits.textCodeUnits
    )
      throw new RangeError('SpriteText exceeds its input budget.');
    this.font.assertAvailable();
    let count = 0;
    for (const character of text)
      if (
        character !== '\r' &&
        character !== '\n' &&
        ++count > graphics2dLimits.glyphs
      )
        throw new RangeError('SpriteText exceeds its glyph budget.');
    const lines = this.lines(text);
    const layouts: { index: number; x: number; y: number }[] = [];
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row]!;
      const width = this.measure(line).width;
      const offset =
        this.align === 'center'
          ? -width / 2
          : this.align === 'right'
            ? -width
            : 0;
      let pen = 0,
        previous: number | undefined;
      const baseline = row * (this.font.lineHeight + this.lineSpacing);
      if (
        !Number.isFinite(baseline) ||
        Math.abs(baseline) > graphics2dLimits.dimension
      )
        throw new RangeError('SpriteText layout exceeds its dimension budget.');
      for (const character of line) {
        const index = this.font.getGlyphIndex(character);
        const glyph = this.font.getGlyph(index);
        if (previous !== undefined)
          pen += this.letterSpacing + this.font.getKerning(previous, index);
        const x = offset + pen + glyph.xoffset,
          y = baseline + glyph.yoffset;
        if (
          ![x, y, x + glyph.width, y + glyph.source.height].every(
            (value) =>
              Number.isFinite(value) &&
              Math.abs(value) <= graphics2dLimits.dimension,
          )
        )
          throw new RangeError(
            'SpriteText layout exceeds its dimension budget.',
          );
        if (glyph.source.width && glyph.source.height)
          layouts.push({ index, x, y });
        pen += glyph.advance;
        previous = index;
      }
    }
    // Preflight every layout/page and allocate growth before changing the displayed glyphs.
    const extra: Sprite[] = [];
    try {
      for (let index = this.glyphs.length; index < layouts.length; index++) {
        const glyph = this.font.getGlyph(layouts[index]!.index);
        extra.push(
          new Sprite({
            texture: glyph.texture,
            source: glyph.source,
            anchor: [0, 0],
          }),
        );
      }
    } catch (error) {
      for (const glyph of extra) glyph.destroy();
      throw error;
    }
    for (const glyph of extra) {
      this.add(glyph);
      this.glyphs.push(glyph);
    }
    for (let index = 0; index < layouts.length; index++) {
      const sprite = this.glyphs[index]!,
        layout = layouts[index]!,
        glyph = this.font.getGlyph(layout.index);
      // Clear the old page's region before changing pages; the new page may be smaller.
      sprite.source = undefined;
      sprite.texture = glyph.texture;
      sprite.source = glyph.source;
      sprite.position.set(layout.x, layout.y);
      sprite.scale.set(glyph.width / glyph.source.width, 1);
    }
    while (this.glyphs.length > layouts.length) {
      const glyph = this.glyphs.pop()!;
      this.remove(glyph);
      glyph.destroy();
    }
    this.content = text;
  }
}
