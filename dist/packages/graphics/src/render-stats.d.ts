/**
 * CPU-side counters and render-target estimates for the last rendered frame.
 * The object is reused and overwritten every frame: copy fields to retain them.
 */
export interface RenderStats {
    /** Frames started since the renderer was created. */
    readonly frame: number;
    /** Visible meshes that passed the material/texture filters. */
    readonly meshes: number;
    /** Of those, meshes skipped by frustum culling. */
    readonly culled: number;
    /** Indexed draw calls in the main 3D pass. */
    readonly drawCalls: number;
    /** Triangles submitted by the main 3D pass (instances included). */
    readonly triangles: number;
    /** Indexed draw calls in the shadow pass. */
    readonly shadowDrawCalls: number;
    /** Native 2D draw commands, including local effects and composition. */
    readonly drawCalls2D: number;
    /** Instances submitted by native 2D draws, including effect quads. */
    readonly instances2D: number;
    /** Native 2D target passes, including local effects and composition. */
    readonly renderPasses2D: number;
    /** Bytes of buffer and texture data uploaded during this frame. */
    readonly uploadBytes: number;
    /** Estimated bytes occupied by live native render-target attachments. */
    readonly renderTargetBytes: number;
    /** Highest estimated resident render-target bytes since creation. */
    readonly peakRenderTargetBytes: number;
}
/** Mutable implementation owned by a renderer. */
export declare class FrameStats implements RenderStats {
    frame: number;
    meshes: number;
    culled: number;
    drawCalls: number;
    triangles: number;
    shadowDrawCalls: number;
    drawCalls2D: number;
    instances2D: number;
    renderPasses2D: number;
    uploadBytes: number;
    renderTargetBytes: number;
    peakRenderTargetBytes: number;
    /** Starts a new frame's counters. */
    begin(): void;
    /** Records one indexed main-pass draw. */
    draw(indexCount: number, instances: number): void;
    /** Records a native 2D draw and its submitted instance count. */
    draw2D(instances?: number): void;
    /** Records data transferred to native buffers or textures. */
    upload(bytes: number): void;
    /** Adjusts the resident target estimate; allocation raises the peak. */
    target(delta: number): void;
    /** Records one native 2D target pass. */
    pass2D(): void;
}
