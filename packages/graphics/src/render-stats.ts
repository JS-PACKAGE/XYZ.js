export interface GpuTimingOptions {
  /** Disabled by default; WebGPU negotiates timestamp-query during initialization. */
  enabled?: boolean;
  maxInFlight?: number;
  /** Rendered frames excluded before issuing samples. */
  warmupFrames?: number;
  sampleInterval?: number;
}

export type GpuTimingStatus =
  | 'disabled'
  | 'unsupported'
  | 'pending'
  | 'available'
  | 'disjoint'
  | 'lost'
  | 'error';

/** Latest asynchronous result, not necessarily the current rendered frame. */
export interface GpuTimingStats {
  readonly status: GpuTimingStatus;
  readonly source: 'webgpu-timestamp-query' | 'webgl2-disjoint-query' | null;
  /** WebGPU sums recorded real passes; WebGL measures the native query command interval. */
  readonly scope: 'native-pass-sum' | 'native-command-interval' | null;
  readonly reason: string | null;
  readonly milliseconds: number | null;
  readonly sampledFrame: number | null;
  readonly samples: number;
  readonly totalMilliseconds: number;
  readonly maximumMilliseconds: number | null;
  readonly pending: number;
  readonly skipped: number;
  readonly invalid: number;
  readonly warmupFrames: number;
  readonly sampleInterval: number;
  readonly maxInFlight: number;
}

/** Renderer-owned reused record; null is never a successful zero-time sample. */
export class GpuFrameTiming implements GpuTimingStats {
  status: GpuTimingStatus = 'disabled';
  source: GpuTimingStats['source'] = null;
  scope: GpuTimingStats['scope'] = null;
  reason: string | null = 'GPU timing was not requested.';
  milliseconds: number | null = null;
  sampledFrame: number | null = null;
  samples = 0;
  totalMilliseconds = 0;
  maximumMilliseconds: number | null = null;
  pending = 0;
  skipped = 0;
  invalid = 0;
  warmupFrames = 0;
  sampleInterval = 1;
  maxInFlight = 0;

  unavailable(status: GpuTimingStatus, reason: string): void {
    this.status = status;
    this.reason = reason;
    this.milliseconds = null;
    this.sampledFrame = null;
  }

  sample(frame: number, milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      this.invalid++;
      this.unavailable('pending', 'Timestamp was zero, reversed or invalid.');
      return;
    }
    this.status = 'available';
    this.reason = null;
    if (this.sampledFrame === null || frame >= this.sampledFrame) {
      this.milliseconds = milliseconds;
      this.sampledFrame = frame;
    }
    this.samples++;
    this.totalMilliseconds += milliseconds;
    this.maximumMilliseconds = Math.max(
      this.maximumMilliseconds ?? 0,
      milliseconds,
    );
  }
}

/**
 * CPU-side counters, asynchronous GPU samples and render-target estimates.
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
  /** Actual native atlas depth passes; absent on legacy third-party renderers. */
  readonly shadowPasses?: number;
  /** Frames reusing a valid unchanged atlas; absent on legacy third-party renderers. */
  readonly shadowCacheHits?: number;
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
  /** CPU elapsed beginFrame through endFrame; never waits for GPU completion. */
  readonly cpuSubmitMs: number | null;
  readonly gpuTiming: GpuTimingStats;
}

/** Mutable implementation owned by a renderer. */
export class FrameStats implements RenderStats {
  frame = 0;
  meshes = 0;
  culled = 0;
  drawCalls = 0;
  triangles = 0;
  shadowDrawCalls = 0;
  shadowPasses = 0;
  shadowCacheHits = 0;
  drawCalls2D = 0;
  instances2D = 0;
  renderPasses2D = 0;
  uploadBytes = 0;
  renderTargetBytes = 0;
  peakRenderTargetBytes = 0;
  cpuSubmitMs: number | null = null;
  readonly gpuTiming = new GpuFrameTiming();
  private submitStart = 0;

  /** Starts a new frame's counters. */
  begin(): void {
    this.frame++;
    this.submitStart = performance.now();
    this.cpuSubmitMs = null;
    this.meshes = 0;
    this.culled = 0;
    this.drawCalls = 0;
    this.triangles = 0;
    this.shadowDrawCalls = 0;
    this.shadowPasses = 0;
    this.shadowCacheHits = 0;
    this.drawCalls2D = 0;
    this.instances2D = 0;
    this.renderPasses2D = 0;
    this.uploadBytes = 0;
  }

  /** Finishes CPU submission measurement independently of asynchronous GPU results. */
  submit(): void {
    this.cpuSubmitMs = performance.now() - this.submitStart;
  }

  /** Records one indexed main-pass draw. */
  draw(indexCount: number, instances: number): void {
    this.drawCalls++;
    this.triangles += (indexCount / 3) * instances;
  }

  /** Records a native 2D draw and its submitted instance count. */
  draw2D(instances = 1): void {
    this.drawCalls2D++;
    this.instances2D += instances;
  }

  /** Records data transferred to native buffers or textures. */
  upload(bytes: number): void {
    this.uploadBytes += bytes;
  }

  /** Adjusts the resident target estimate; allocation raises the peak. */
  target(delta: number): void {
    this.renderTargetBytes += delta;
    this.peakRenderTargetBytes = Math.max(
      this.peakRenderTargetBytes,
      this.renderTargetBytes,
    );
  }

  /** Records one native 2D target pass. */
  pass2D(): void {
    this.renderPasses2D++;
  }
}
