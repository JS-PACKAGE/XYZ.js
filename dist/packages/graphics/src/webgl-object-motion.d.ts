import type { Mesh } from '../../core/src/mesh.js';
import type { TemporalPostState } from './temporal-post.js';
import type { FrameStats } from './render-stats.js';
/** Renderer-owned velocity target and program; cached geometry and scene depth are borrowed. */
export declare class WebGLObjectMotion {
    private readonly gl;
    private readonly stats;
    private readonly history;
    private readonly program;
    private readonly vao;
    private readonly current;
    private readonly previous;
    private readonly depth;
    private texture?;
    private framebuffer?;
    private width;
    private height;
    constructor(gl: WebGL2RenderingContext, stats: FrameStats);
    render(meshes: readonly Mesh[], state: TemporalPostState, depth: WebGLTexture, geometry: (mesh: Mesh) => {
        vertex: WebGLBuffer;
        index: WebGLBuffer;
    }): WebGLTexture;
    resize(width: number, height: number): void;
    releaseTarget(): void;
    destroy(): void;
}
