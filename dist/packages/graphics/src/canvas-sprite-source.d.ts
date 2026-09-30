import type { Sprite } from '../../core/src/sprite.js';
/** One reusable source-frame scratch, never a per-color or per-particle Texture. */
export declare class CanvasSpriteSource {
    private scratch;
    private context;
    private readonly opaqueTextures;
    private frame;
    beginFrame(): void;
    image(sprite: Sprite): CanvasImageSource;
    private opaque;
    endFrame(): void;
    destroy(): void;
}
