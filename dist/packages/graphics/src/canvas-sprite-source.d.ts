import { type Texture2DSource } from '../../assets/src/index.js';
import type { TextureQuad2D } from './sprite-instance.js';
/** Renderer-owned source snapshots; views borrow a single versioned upload. */
export declare class CanvasSpriteSource {
    private readonly renderImage;
    private readonly sources;
    private scratch;
    constructor(renderImage: (source: Texture2DSource) => CanvasImageSource);
    endFrame(): void;
    prepare(source: Texture2DSource): CanvasImageSource;
    /**
     * `transform` supplies the destination scale; only distance-field textures read
     * it, because `getTransform()` allocates a DOMMatrix per sprite.
     */
    image(source: Texture2DSource, quad: TextureQuad2D, tint: ArrayLike<number>, transform?: CanvasRenderingContext2D): HTMLCanvasElement;
    unload(source: Texture2DSource): void;
    destroy(): void;
}
