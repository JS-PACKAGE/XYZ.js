import { Material2D, PostProcessor2D } from '../../../core/src/materials2d/material2d.js';
import type { RenderSnapshot, TransitionFrame } from '../render2d-contract.js';
export declare const premultipliedBlend: GPUBlendState;
export declare function createSpritePipeline(device: GPUDevice, module: GPUShaderModule, format: GPUTextureFormat, layout: GPUPipelineLayout): GPURenderPipeline;
export interface GPUColorTarget {
    readonly texture: GPUTexture;
    readonly view: GPUTextureView;
    readonly bindGroup: GPUBindGroup;
    readonly width: number;
    readonly height: number;
}
export declare class GPUSnapshot implements RenderSnapshot {
    readonly owner: WebGPU2DEffects;
    readonly target: GPUColorTarget;
    readonly backend: "webgpu";
    private disposed;
    constructor(owner: WebGPU2DEffects, target: GPUColorTarget);
    get width(): number;
    get height(): number;
    get destroyed(): boolean;
    destroy(): void;
}
interface PreparedEffect {
    direct: GPURenderPipeline;
    layer: GPURenderPipeline;
    buffer: GPUBuffer;
    bindGroup: GPUBindGroup;
    values: Float32Array;
    dispose: () => void;
}
/** Renderer-owned native pipelines, immutable captures and bounded mutable color targets. */
export declare class WebGPU2DEffects {
    private readonly device;
    private readonly format;
    private readonly cancelled;
    readonly snapshots: Set<GPUSnapshot>;
    readonly spriteViewportLayout: GPUBindGroupLayout;
    readonly spriteTextureLayout: GPUBindGroupLayout;
    readonly uniformLayout: GPUBindGroupLayout;
    readonly spriteLayout: GPUPipelineLayout;
    readonly defaultUniforms: GPUBindGroup;
    private readonly textureLayout;
    private readonly transitionTextureLayout;
    private readonly fullscreenLayout;
    private readonly transitionLayout;
    private readonly sampler;
    private readonly frameBuffer;
    private readonly frameBindGroup;
    private readonly frameValues;
    private readonly uploadedFrameValues;
    private readonly materials;
    private readonly processors;
    private readonly pending;
    private preparation;
    private compositePipeline;
    private transitionPipeline;
    private frameTarget;
    private layerTargets;
    private transitionBindGroup;
    private transitionIncoming;
    private transitionOutgoing;
    private disposed;
    private readonly attachment;
    private readonly passDescriptor;
    constructor(device: GPUDevice, format: GPUTextureFormat, cancelled: () => boolean);
    initialize(): Promise<void>;
    private module;
    private fullscreenPipeline;
    prepare(effect: Material2D | PostProcessor2D): Promise<void>;
    private prepared;
    material(material: Material2D): PreparedEffect;
    validate(material: Material2D | PostProcessor2D): void;
    target(width: number, height: number, format?: GPUTextureFormat): GPUColorTarget;
    frame(width: number, height: number): GPUColorTarget;
    layers(width: number, height: number): [GPUColorTarget, GPUColorTarget];
    releaseLayers(): void;
    settings(width: number, height: number, transition?: TransitionFrame): void;
    process(encoder: GPUCommandEncoder, input: GPUColorTarget, effects: readonly PostProcessor2D[]): GPUColorTarget;
    composite(encoder: GPUCommandEncoder, input: GPUColorTarget, output: GPUTextureView): void;
    transition(encoder: GPUCommandEncoder, input: GPUColorTarget, output: GPUTextureView, frame: TransitionFrame): void;
    snapshot(snapshot: RenderSnapshot): GPUSnapshot;
    private draw;
    releaseFrame(): void;
    resize(): void;
    destroy(): void;
}
export {};
