import type { PostProcessingSettings } from '../../core/src/render-settings.js';
import type { FrameStats } from './render-stats.js';
import { TemporalPostState } from './temporal-post.js';
export interface GLTemporalTarget {
    readonly texture: WebGLTexture;
    readonly framebuffer: WebGLFramebuffer;
    readonly depth?: WebGLTexture;
}
/** Renderer-owned HDR post targets; input depth must be a resolved sampleable depth texture. */
export declare class WebGLTemporalPipeline {
    private readonly gl;
    private readonly stats;
    private readonly ssrProgram;
    private readonly taaProgram;
    private readonly uniform;
    private readonly vao;
    private readonly data;
    private scratch;
    private readonly history;
    private width;
    private height;
    private index;
    private state;
    constructor(gl: WebGL2RenderingContext, stats: FrameStats);
    private compile;
    private ensure;
    private allocate;
    applyOpaqueSSR(source: WebGLTexture, depth: WebGLTexture, state: TemporalPostState, settings: PostProcessingSettings): GLTemporalTarget;
    applyTAA(source: WebGLTexture, depth: WebGLTexture, state: TemporalPostState, settings: PostProcessingSettings): GLTemporalTarget;
    private render;
    blit(source: GLTemporalTarget, destination: WebGLFramebuffer): void;
    resize(width: number, height: number): void;
    releaseTarget(): void;
    destroy(): void;
}
