import { Sprite } from './sprite.js';
export interface Text2DOptions {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    padding?: number;
}
type TextStyle = Readonly<Required<Text2DOptions>>;
/** Rasterized text with scene-owned textures; transforms use the normal Sprite path. */
export declare class Text2D extends Sprite {
    private content;
    readonly style: TextStyle;
    private ownedTexture;
    private revision;
    private constructor();
    static create(text: string, options?: Text2DOptions): Promise<Text2D>;
    /** The currently displayed text, not a pending update. */
    get text(): string;
    /** Latest request wins; obsolete bitmaps are released without changing the display. */
    setText(text: string): Promise<void>;
    protected onDestroy(): void;
    private static rasterize;
}
export {};
