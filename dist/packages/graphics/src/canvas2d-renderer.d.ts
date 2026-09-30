import type { Scene } from '../../core/src/scene.js';
import type { Material2D, PostProcessor2D } from '../../core/src/materials2d/material2d.js';
import type { GraphicsCapabilities, Renderer } from './index.js';
import { type FrameEffects, type RenderSnapshot } from './render2d-contract.js';
/** Sprite-only fallback; visible 3D meshes are deliberately unsupported. */
export declare class Canvas2DRenderer implements Renderer {
    private readonly onError;
    readonly backend: "canvas2d";
    readonly capabilities: GraphicsCapabilities;
    private canvas;
    private context;
    private readonly sprites;
    private readonly spriteSource;
    private readonly snapshots;
    private transitionCanvas;
    private transitionContext;
    private frameActive;
    private frameRendered;
    private destroyed;
    private readonly onContextLost;
    constructor(onError: (error: Error) => void);
    initialize(canvas: HTMLCanvasElement): Promise<void>;
    beginFrame(): void;
    prepareMaterial(_material: Material2D): Promise<void>;
    preparePostProcessor(_effect: PostProcessor2D): Promise<void>;
    captureScene(scene: Scene, width: number, height: number): Promise<RenderSnapshot>;
    render(scene?: Scene, width?: number, height?: number, effects?: FrameEffects): void;
    private prepareScene;
    private drawFrame;
    private validateTransition;
    private requireTransitionContext;
    private composeTransition;
    private drawOutgoing;
    private releaseTransitionTarget;
    endFrame(): void;
    resize(width: number, height: number): void;
    destroy(): void;
    private requireContext;
}
