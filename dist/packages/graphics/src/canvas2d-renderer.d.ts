import type { Scene } from '../../core/src/scene.js';
import type { GraphicsCapabilities, Renderer } from './index.js';
/** Sprite-only fallback; visible 3D meshes are deliberately unsupported. */
export declare class Canvas2DRenderer implements Renderer {
    readonly backend: "canvas2d";
    readonly capabilities: GraphicsCapabilities;
    private canvas;
    private context;
    private readonly sprites;
    private frameActive;
    private frameRendered;
    private destroyed;
    constructor(_onError: (error: Error) => void);
    initialize(canvas: HTMLCanvasElement): Promise<void>;
    beginFrame(): void;
    render(scene?: Scene, width?: number, height?: number): void;
    endFrame(): void;
    resize(width: number, height: number): void;
    destroy(): void;
    private requireContext;
}
