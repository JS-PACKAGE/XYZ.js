import { Texture } from './index.js';
import type { RenderTexture2D } from '../../graphics/src/render-texture2d.js';
export type Texture2DSource = Texture | CanvasTexture2D | RenderTexture2D;
/** Borrowed image sources accepted by 3D materials; render targets remain 2D-only. */
export type MaterialTexture = Texture | CanvasTexture2D;
export interface TextureRect2D {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface TextureBorders2D {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
export interface TextureView2DOptions {
    frame: TextureRect2D;
    originalSize?: readonly [number, number];
    trim?: TextureRect2D;
    rotation?: 0 | 90;
    resolution?: number;
    defaultAnchor?: readonly [number, number];
    defaultBorders?: TextureBorders2D;
}
/** Immutable physical atlas metadata; the source remains borrowed. */
export declare class TextureView2D {
    readonly source: Texture2DSource;
    readonly frame: Readonly<TextureRect2D>;
    readonly originalSize: readonly [number, number];
    readonly trim: Readonly<TextureRect2D>;
    readonly rotation: 0 | 90;
    readonly resolution: number;
    readonly defaultAnchor: readonly [number, number] | undefined;
    readonly defaultBorders: Readonly<TextureBorders2D> | undefined;
    readonly width: number;
    readonly height: number;
    constructor(source: Texture2DSource, options: TextureView2DOptions);
    validate(): void;
}
/** Explicit snapshots, never a live canvas or an automatic per-frame copy. */
export declare class CanvasTexture2D {
    readonly kind = "canvas";
    private canvas;
    private disposed;
    private revision;
    /** The owned surface's size, kept as fields: renderers read it several times per sprite
     * per frame, and a canvas size read is a DOM call. Only this class resizes the surface. */
    private pixelWidth;
    private pixelHeight;
    constructor(source: CanvasImageSource);
    /** The owned snapshot surface; resize it only through `update` (or a subclass frame copy). */
    get image(): HTMLCanvasElement | OffscreenCanvas;
    get width(): number;
    get height(): number;
    get version(): number;
    get destroyed(): boolean;
    update(source: CanvasImageSource): void;
    /**
     * @internal Takes `canvas` itself as the new surface instead of copying it, for a caller that
     * drew it only for this texture and gives it up. A same-size canvas copy is pixel-exact, so
     * the result matches `update(canvas)`. Returns the previous surface, which no longer belongs
     * to the texture: the caller releases (or redraws) it, as `update` would have released it.
     */
    adopt(canvas: HTMLCanvasElement | OffscreenCanvas): HTMLCanvasElement | OffscreenCanvas;
    /** Reuses the owned surface for live sources without decoding a bitmap per frame. */
    protected copyFrame(source: CanvasImageSource): void;
    destroy(): void;
}
