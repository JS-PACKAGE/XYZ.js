import { Group2D } from '../gameplay/group2d.js';
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
export declare class SpriteFont {
    readonly sheet: SpriteSheet;
    private readonly indices;
    readonly glyphWidth: number | undefined;
    readonly advance: number;
    readonly lineHeight: number;
    readonly caseInsensitive: boolean;
    private readonly fallbackIndex;
    constructor(sheet: SpriteSheet, options: SpriteFontOptions);
    private key;
    getGlyphIndex(character: string): number;
}
/** Owns glyph objects, but never the atlas texture. */
export declare class SpriteText extends Group2D {
    readonly font: SpriteFont;
    private content;
    private glyphs;
    private readonly letterSpacing;
    private readonly lineSpacing;
    private readonly align;
    constructor(font: SpriteFont, text: string, options?: SpriteTextOptions);
    get text(): string;
    setText(text: string): void;
}
