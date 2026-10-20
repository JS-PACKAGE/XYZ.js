import { type Texture2DSource } from '../../assets/src/index.js';
import type { TextureQuad2D } from './sprite-instance.js';
/** Canvas `setTransform(a, b, c, d, e, f)` operands that place one 2D object on its target. */
export interface CanvasPlacement2D {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}
/** Renderer-owned source snapshots; views borrow a single versioned upload. */
export declare class CanvasSpriteSource {
    private readonly renderImage;
    private readonly sources;
    private scratch;
    constructor(renderImage: (source: Texture2DSource) => CanvasImageSource);
    endFrame(): void;
    prepare(source: Texture2DSource): CanvasImageSource;
    /** `transform` supplies the destination scale; only distance-field textures read it. */
    image(source: Texture2DSource, quad: TextureQuad2D, tint: ArrayLike<number>, transform?: Readonly<CanvasPlacement2D>): HTMLCanvasElement;
    unload(source: Texture2DSource): void;
    destroy(): void;
}
