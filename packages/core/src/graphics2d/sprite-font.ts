import { AssetError } from '../../../assets/src/index.js';
import { graphics2dLimits } from '../../../../src/data/graphics2d.js';
import { Group2D } from '../gameplay/group2d.js';
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
}

export class SpriteFont {
  private readonly indices = new Map<string, number>();
  readonly glyphWidth: number | undefined;
  readonly advance: number;
  readonly lineHeight: number;
  readonly caseInsensitive: boolean;
  private readonly fallbackIndex: number | undefined;

  constructor(
    readonly sheet: SpriteSheet,
    options: SpriteFontOptions,
  ) {
    const alphabet = Array.from(options.alphabet);
    if (!alphabet.length || alphabet.length !== sheet.frames.length)
      throw new RangeError('Alphabet must map each sheet frame exactly once.');
    this.caseInsensitive = options.caseInsensitive ?? false;
    alphabet.forEach((character, index) => {
      const key = this.key(character);
      if (character === '\n' || character === '\r' || this.indices.has(key))
        throw new RangeError('Alphabet contains a duplicate or newline glyph.');
      this.indices.set(key, index);
    });
    this.glyphWidth = options.glyphWidth;
    this.advance =
      options.advance ?? options.glyphWidth ?? sheet.frames[0]!.width;
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
    if (options.fallback !== undefined) {
      if (Array.from(options.fallback).length !== 1)
        throw new RangeError('Fallback must be one mapped Unicode code point.');
      this.fallbackIndex = this.indices.get(this.key(options.fallback));
      if (this.fallbackIndex === undefined)
        throw new RangeError('Fallback glyph is not mapped.');
    }
  }

  private key(character: string): string {
    return this.caseInsensitive ? character.toLowerCase() : character;
  }

  getGlyphIndex(character: string): number {
    const index = this.indices.get(this.key(character)) ?? this.fallbackIndex;
    if (index === undefined)
      throw new RangeError(`Unmapped font glyph: ${character}`);
    return index;
  }
}

/** Owns glyph objects, but never the atlas texture. */
export class SpriteText extends Group2D {
  private content = '';
  private glyphs: Sprite[] = [];
  private readonly letterSpacing: number;
  private readonly lineSpacing: number;
  private readonly align: 'left' | 'center' | 'right';

  constructor(
    readonly font: SpriteFont,
    text: string,
    options: SpriteTextOptions = {},
  ) {
    super();
    this.letterSpacing = options.letterSpacing ?? 0;
    this.lineSpacing = options.lineSpacing ?? 0;
    this.align = options.align ?? 'left';
    if (
      ![this.letterSpacing, this.lineSpacing].every(Number.isFinite) ||
      !['left', 'center', 'right'].includes(this.align)
    )
      throw new RangeError('Invalid SpriteText spacing or alignment.');
    this.setText(text);
  }

  get text(): string {
    return this.content;
  }

  setText(text: string): void {
    if (this.destroyed) throw new Error('Cannot update destroyed SpriteText.');
    if (text.length > graphics2dLimits.textCodeUnits)
      throw new RangeError('SpriteText exceeds its input budget.');
    if (this.font.sheet.texture.destroyed)
      throw new AssetError('Cannot use a destroyed Texture.');
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const layouts: { index: number; x: number; y: number }[] = [];
    for (let row = 0; row < lines.length; row++) {
      const characters = Array.from(lines[row]!);
      if (layouts.length + characters.length > graphics2dLimits.glyphs)
        throw new RangeError('SpriteText exceeds its glyph budget.');
      const width = characters.length
        ? (characters.length - 1) * (this.font.advance + this.letterSpacing) +
          (this.font.glyphWidth ??
            this.font.sheet.frames[
              this.font.getGlyphIndex(characters[characters.length - 1]!)
            ]!.width)
        : 0;
      const offset =
        this.align === 'center'
          ? -width / 2
          : this.align === 'right'
            ? -width
            : 0;
      const y = row * (this.font.lineHeight + this.lineSpacing);
      if (!Number.isFinite(y) || Math.abs(y) > graphics2dLimits.dimension)
        throw new RangeError('SpriteText layout exceeds its dimension budget.');
      characters.forEach((character, column) => {
        const x = offset + column * (this.font.advance + this.letterSpacing);
        if (!Number.isFinite(x) || Math.abs(x) > graphics2dLimits.dimension)
          throw new RangeError(
            'SpriteText layout exceeds its dimension budget.',
          );
        layouts.push({ index: this.font.getGlyphIndex(character), x, y });
      });
    }
    // Preflight layout and allocate growth before changing any existing glyph.
    const extra: Sprite[] = [];
    try {
      for (let index = this.glyphs.length; index < layouts.length; index++)
        extra.push(
          this.font.sheet.createSprite(layouts[index]!.index, {
            anchor: [0, 0],
          }),
        );
    } catch (error) {
      for (const glyph of extra) glyph.destroy();
      throw error;
    }
    for (const glyph of extra) {
      this.add(glyph);
      this.glyphs.push(glyph);
    }
    for (let index = 0; index < layouts.length; index++) {
      const glyph = this.glyphs[index]!;
      const layout = layouts[index]!;
      glyph.source = this.font.sheet.getFrame(layout.index);
      glyph.position.set(layout.x, layout.y);
      glyph.scale.set(
        this.font.glyphWidth === undefined
          ? 1
          : this.font.glyphWidth / glyph.width,
        1,
      );
    }
    while (this.glyphs.length > layouts.length) {
      const glyph = this.glyphs.pop()!;
      this.remove(glyph);
      glyph.destroy();
    }
    this.content = text;
  }
}
