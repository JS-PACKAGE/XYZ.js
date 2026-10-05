import { PostProcessor2D } from '../../core/src/materials2d/material2d.js';
export type RenderGraphFormat = 'rgba8unorm' | 'rgba16float';
export interface RenderGraphTarget {
    readonly name: string;
    readonly format?: RenderGraphFormat;
    /** Fixed pixel dimensions, or scale relative to the frame (default 1). */
    readonly width?: number;
    readonly height?: number;
    readonly scale?: number;
}
export interface RenderGraphPass {
    readonly name: string;
    /** Ordered sampled attachments; '$scene' is the full real 3D+2D frame before transitions. */
    readonly inputs: readonly string[];
    readonly output: string;
    /** Existing native hook ABI: effect(color,uv,screen), uniformValue, sampleInput; extra inputs use sampleInput1..7. */
    readonly effect: PostProcessor2D;
}
export interface RenderGraphOptions {
    readonly targets: readonly RenderGraphTarget[];
    readonly passes: readonly RenderGraphPass[];
    readonly output: string;
    readonly label?: string;
}
export interface RenderGraphPreparationOptions {
    readonly signal?: AbortSignal;
}
/** Immutable resource DAG. Shader descriptors are borrowed, never destroyed by the graph. */
export declare class RenderGraph extends EventTarget {
    readonly targets: readonly RenderGraphTarget[];
    readonly passes: readonly RenderGraphPass[];
    readonly schedule: readonly RenderGraphPass[];
    readonly output: string;
    readonly label: string;
    private disposed;
    constructor(options: RenderGraphOptions);
    get destroyed(): boolean;
    validate(): void;
    /** Resolves dimensions transactionally before any native targets are replaced. */
    resolutions(width: number, height: number, maxDimension?: number): readonly {
        target: RenderGraphTarget;
        width: number;
        height: number;
    }[];
    destroy(): void;
}
