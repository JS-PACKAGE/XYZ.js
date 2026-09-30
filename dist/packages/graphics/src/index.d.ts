import type { Scene } from '../../core/src/scene.js';
import type { Material2D, PostProcessor2D } from '../../core/src/materials2d/index.js';
import type { FrameEffects, RenderSnapshot } from './render2d-contract.js';
export type { FrameEffects, RenderSnapshot, TransitionFrame, } from './render2d-contract.js';
export { XYZError, GraphicsError, WebGPUNotSupportedError, WebGPUInitializationError, WebGPUDeviceLostError, GraphicsBackendUnavailableError, UnsupportedGraphicsError, WebGL2InitializationError, WebGL2ContextLostError, Canvas2DInitializationError, } from './errors.js';
export type GraphicsBackend = 'webgpu' | 'webgl2' | 'canvas2d';
export type RendererPreference = GraphicsBackend | 'auto';
export interface GraphicsCapabilities {
    readonly threeD: boolean;
    readonly compute: boolean;
    readonly customShaders: boolean;
    readonly storageBuffers: boolean;
    readonly instancing: boolean;
    readonly maxTextureSize: number;
}
export interface Renderer {
    readonly backend: GraphicsBackend;
    readonly capabilities: GraphicsCapabilities;
    initialize(canvas: HTMLCanvasElement): Promise<void>;
    beginFrame(): void;
    render(scene?: Scene, width?: number, height?: number, effects?: FrameEffects): void;
    captureScene(scene: Scene, width: number, height: number): Promise<RenderSnapshot>;
    prepareMaterial(material: Material2D): Promise<void>;
    preparePostProcessor(processor: PostProcessor2D): Promise<void>;
    endFrame(): void;
    resize(width: number, height: number): void;
    destroy(): void;
}
export declare function createRenderer(canvas: HTMLCanvasElement, preference: RendererPreference, onError: (error: Error) => void): Promise<Renderer>;
