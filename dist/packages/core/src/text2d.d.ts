import { Sprite } from './sprite.js';
import type { TextDirection } from './text-layout.js';
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
    stroke?: Readonly<{
        color: string;
        width: number;
    }>;
    shadow?: Readonly<{
        color: string;
        blur?: number;
        offsetX?: number;
        offsetY?: number;
    }>;
    resolution?: number;
}
export type Text2DStyle = Readonly<Required<Omit<Text2DOptions, 'wrapWidth' | 'stroke' | 'shadow'>> & Pick<Text2DOptions, 'wrapWidth' | 'stroke' | 'shadow'>>;
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
/** Rasterized browser-shaped full lines, using the ordinary Sprite pipeline. */
export declare class Text2D extends Sprite {
    private content;
    private ownedTexture;
    private displayedLayout;
    private revision;
    private requestedText;
    private requestedStyle;
    private displayedStyle;
    private constructor();
    static create(text: string, options?: Text2DOptions): Promise<Text2D>;
    get text(): string;
    get style(): Text2DStyle;
    get layout(): Text2DLayout;
    /** Explicitly re-resolve fonts after a FontFace/fallback change. */
    refreshFonts(): Promise<void>;
    setText(text: string): Promise<void>;
    /** Merges with the latest requested style and text, not an obsolete display. */
    setStyle(options: Text2DOptions): Promise<void>;
    private refresh;
    protected onDestroy(): void;
    private static validateText;
    private static rasterize;
}
