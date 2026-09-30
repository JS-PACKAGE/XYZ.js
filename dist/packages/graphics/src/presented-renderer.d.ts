import type { Scene } from '../../core/src/scene.js';
import type { Material2D, PostProcessor2D } from '../../core/src/materials2d/material2d.js';
import type { FrameEffects, RenderSnapshot } from './render2d-contract.js';
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
    prepareMaterial(material: Material2D): Promise<void>;
    preparePostProcessor(effect: PostProcessor2D): Promise<void>;
    captureScene(scene: Scene, width: number, height: number): Promise<RenderSnapshot>;
    render(scene?: Scene, width?: number, height?: number, effects?: FrameEffects): void;
    endFrame(): void;
    resize(width: number, height: number): void;
    destroy(): void;
    private requireContext;
}
