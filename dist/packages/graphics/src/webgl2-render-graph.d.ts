import { RenderGraph, type RenderGraphPreparationOptions } from './render-graph.js';
export interface GLGraphTarget {
    texture: WebGLTexture;
    framebuffer: WebGLFramebuffer;
    depth?: WebGLRenderbuffer;
    width: number;
    height: number;
}
/** Engine-only native graph resources. The public descriptor exposes no GL handles. */
export declare class WebGL2RenderGraph {
    private readonly gl;
    private readonly owners;
    private scene;
    private blit;
    private disposed;
    private readonly vao;
    private readonly sampler;
    constructor(gl: WebGL2RenderingContext);
    private live;
    prepare(graph: RenderGraph, options?: RenderGraphPreparationOptions): Promise<void>;
    private compile;
    private target;
    private releaseTarget;
    /** Normal backend 3D, world-2D and HUD composite into this target before graph evaluation. */
    sceneTarget(graph: RenderGraph, width: number, height: number): GLGraphTarget;
    /** Native fullscreen passes and presentation; restores backend GL state, including sampling bindings. */
    encode(graph: RenderGraph, destination: WebGLFramebuffer | null): void;
    private draw;
    destroy(): void;
}
