import type { Scene } from '../../core/src/scene.js';
import type { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import { RenderCommandBuffer2D } from './render2d-contract.js';
import { CanvasSpriteSource } from './canvas-sprite-source.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import type { FrameStats } from './render-stats.js';
export declare class CanvasRender2D {
    readonly sources: CanvasSpriteSource;
    readonly stats: FrameStats;
    private readonly caches;
    private readonly canvasBytes;
    private readonly quad;
    private readonly appearance;
    private readonly matrix;
    private readonly inverses;
    private readonly product;
    private readonly placement;
    private readonly tile;
    private readonly tinted;
    private readonly maskCanvas;
    private tileMatrix;
    private readonly paths;
    constructor(sources: CanvasSpriteSource, stats: FrameStats);
    /** RGBA backing-store estimates exclude browser/driver overhead. */
    resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): void;
    releaseCanvas(canvas: HTMLCanvasElement): void;
    preflight(commands: RenderCommandBuffer2D, depth?: number): void;
    private validateBounds;
    draw(context: CanvasRenderingContext2D, commands: RenderCommandBuffer2D, scene: Scene, scaleX: number, scaleY: number, root?: IsolatedGroup2D, bounds?: Rect2D): void;
    /** Multiplies unpremultiplied RGB by the current appearance into `target`. */
    private tint;
    /** Computes the target transform of one object into the reused `placement`. */
    private place;
    /**
     * Draws a local rectangle at `placement`. Positive axis-aligned placements fold into the
     * destination rectangle under an identity transform: a per-object `setTransform` costs about
     * as much as the `drawImage` itself. Returns the new identity state.
     */
    private drawPlaced;
    private mask;
    destroy(): void;
}
