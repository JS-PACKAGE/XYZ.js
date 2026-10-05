import { RenderGraph, type RenderGraphPreparationOptions } from './render-graph.js';
import { GraphicsError } from './errors.js';
/** Private native frame graph. Full scene and HUD are rendered into sceneTarget before encode. */
export declare class WebGPURenderGraph {
    private readonly device;
    private readonly format;
    private readonly owners;
    private scene;
    private blit;
    private blitReady;
    private readonly emptyUniforms;
    private readonly sampler;
    private failure;
    private readonly lifetime;
    private rejectLifetime;
    constructor(device: GPUDevice, format: GPUTextureFormat);
    private live;
    prepare(graph: RenderGraph, options?: RenderGraphPreparationOptions): Promise<void>;
    private compile;
    private target;
    /** Internal native target: renderer routes its normal 3D+2D output here, never the transition. */
    sceneTarget(graph: RenderGraph, width: number, height: number): GPUTextureView;
    /** Encodes true DAG attachment reads/writes, then presents to the caller's frame/transition target. */
    encode(graph: RenderGraph, encoder: GPUCommandEncoder, destination: GPUTextureView): void;
    private draw;
    destroy(error?: GraphicsError): void;
}
