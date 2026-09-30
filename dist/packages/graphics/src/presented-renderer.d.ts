import type { Scene } from '../../core/src/scene.js';
import type { Renderer, GraphicsBackend, GraphicsCapabilities } from './index.js';
/** Auto selection keeps backend context binding away from the caller's canvas. */
export declare class PresentedRenderer implements Renderer {
    private readonly renderer;
    private readonly target;
    private canvas;
    private context;
    private destroyed;
    constructor(renderer: Renderer, target: HTMLCanvasElement);
    get backend(): GraphicsBackend;
    get capabilities(): GraphicsCapabilities;
    initialize(canvas: HTMLCanvasElement): Promise<void>;
    beginFrame(): void;
    render(scene?: Scene, width?: number, height?: number): void;
    endFrame(): void;
    resize(width: number, height: number): void;
    destroy(): void;
    private requireContext;
}
