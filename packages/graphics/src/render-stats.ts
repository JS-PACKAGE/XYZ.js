/**
 * Per-frame 3D counters for the last rendered frame. The object is reused and
 * overwritten every frame: copy the fields you need to keep.
 */
export interface RenderStats {
  /** Frames rendered with a Scene since the renderer started (Canvas2D stays 0). */
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
}

/** Mutable implementation owned by a renderer. */
export class FrameStats implements RenderStats {
  frame = 0;
  meshes = 0;
  culled = 0;
  drawCalls = 0;
  triangles = 0;
  shadowDrawCalls = 0;

  /** Starts a new frame's counters. */
  begin(): void {
    this.frame++;
    this.meshes = 0;
    this.culled = 0;
    this.drawCalls = 0;
    this.triangles = 0;
    this.shadowDrawCalls = 0;
  }

  /** Records one indexed main-pass draw. */
  draw(indexCount: number, instances: number): void {
    this.drawCalls++;
    this.triangles += (indexCount / 3) * instances;
  }
}
