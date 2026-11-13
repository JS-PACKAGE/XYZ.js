import type { Mesh } from '../../core/src/mesh.js';
import type { TemporalPostState } from './temporal-post.js';
import type { FrameStats } from './render-stats.js';
import { ObjectMotionHistory, objectMotionWGSL } from './object-motion.js';
import { beginTimedRenderPass } from './gpu-timing.js';

/** Renderer-owned velocity attachment; borrows current opaque depth and cached geometry. */
export class WebGPUObjectMotion {
  private readonly history = new ObjectMotionHistory();
  private readonly pipeline: GPURenderPipeline;
  private readonly layout: GPUBindGroupLayout;
  private readonly stride = 128;
  private texture?: GPUTexture;
  private view?: GPUTextureView;
  private buffer?: GPUBuffer;
  private data = new Float32Array(0);
  private width = 0;
  private height = 0;
  private groups?: WeakMap<GPUTextureView, GPUBindGroup>;

  constructor(
    private readonly device: GPUDevice,
    samples: number,
    private readonly stats: FrameStats,
  ) {
    this.layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'depth', multisampled: samples > 1 },
        },
      ],
    });
    const module = device.createShaderModule({
      code: objectMotionWGSL(samples),
    });
    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.layout] }),
      vertex: {
        module,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 32,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
          },
          {
            arrayStride: this.stride,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 1, offset: 0, format: 'float32x4' },
              { shaderLocation: 2, offset: 16, format: 'float32x4' },
              { shaderLocation: 3, offset: 32, format: 'float32x4' },
              { shaderLocation: 4, offset: 48, format: 'float32x4' },
              { shaderLocation: 5, offset: 64, format: 'float32x4' },
              { shaderLocation: 6, offset: 80, format: 'float32x4' },
              { shaderLocation: 7, offset: 96, format: 'float32x4' },
              { shaderLocation: 8, offset: 112, format: 'float32x4' },
            ],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [{ format: 'rgba16float' }],
      },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
    });
  }

  render(
    encoder: GPUCommandEncoder,
    meshes: readonly Mesh[],
    state: TemporalPostState,
    depth: GPUTextureView,
    geometry: (mesh: Mesh) => { vertex: GPUBuffer; index: GPUBuffer },
  ): GPUTextureView {
    this.resize(state.width, state.height);
    if (!this.texture) {
      try {
        this.texture = this.device.createTexture({
          size: [state.width, state.height],
          format: 'rgba16float',
          usage:
            GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.stats.target(state.width * state.height * 8);
        this.view = this.texture.createView();
      } catch (error) {
        this.releaseTarget();
        throw error;
      }
    }
    const draws = this.history.build(meshes, state);
    const floats = this.stride / 4;
    if (draws.length * floats > this.data.length) {
      this.buffer?.destroy();
      this.data = new Float32Array(
        Math.max(draws.length * floats, this.data.length * 2, floats),
      );
      this.buffer = this.device.createBuffer({
        size: this.data.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
    }
    for (let i = 0; i < draws.length; i++)
      this.data.set(draws[i]!.data, i * floats);
    let group: GPUBindGroup | undefined;
    if (draws.length) {
      this.device.queue.writeBuffer(
        this.buffer!,
        0,
        this.data,
        0,
        draws.length * floats,
      );
      this.stats.upload(draws.length * this.stride);
      // Weak keys do not extend the lifetime of borrowed depth views.
      group = this.groups?.get(depth);
      if (!group) {
        group = this.device.createBindGroup({
          layout: this.layout,
          entries: [{ binding: 0, resource: depth }],
        });
        (this.groups ??= new WeakMap()).set(depth, group);
      }
    }
    const pass = beginTimedRenderPass(encoder, {
      colorAttachments: [
        {
          view: this.view!,
          clearValue: [0, 0, 0, 0],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    try {
      pass.setPipeline(this.pipeline);
      if (draws.length) {
        pass.setBindGroup(0, group!);
        pass.setVertexBuffer(1, this.buffer!);
        let boundVertex: GPUBuffer | undefined;
        let boundIndex: GPUBuffer | undefined;
        let runVertex: GPUBuffer | undefined;
        let runIndex: GPUBuffer | undefined;
        let runIndices = 0;
        let runStart = 0;
        // Preserve pose order: only adjacent draws with the same actual geometry batch.
        for (let i = 0; i <= draws.length; i++) {
          const mesh = draws[i]?.mesh;
          const cached = mesh ? geometry(mesh) : undefined;
          const vertex = cached?.vertex;
          const index = cached?.index;
          const indices = mesh?.renderGeometry.indices.length ?? 0;
          if (
            i > runStart &&
            (vertex !== runVertex ||
              index !== runIndex ||
              indices !== runIndices)
          ) {
            if (runVertex !== boundVertex) {
              pass.setVertexBuffer(0, runVertex!);
              boundVertex = runVertex;
            }
            if (runIndex !== boundIndex) {
              pass.setIndexBuffer(runIndex!, 'uint32');
              boundIndex = runIndex;
            }
            pass.drawIndexed(runIndices, i - runStart, 0, 0, runStart);
            this.stats.draw(runIndices, i - runStart);
            runStart = i;
          }
          runVertex = vertex;
          runIndex = index;
          runIndices = indices;
        }
      }
    } finally {
      pass.end();
    }
    return this.view!;
  }

  resize(width: number, height: number): void {
    if (width !== this.width || height !== this.height) {
      this.releaseTarget();
      this.width = width;
      this.height = height;
    }
  }
  releaseTarget(): void {
    if (this.texture) {
      this.texture.destroy();
      this.stats.target(-this.width * this.height * 8);
    }
    this.texture = undefined;
    this.view = undefined;
    this.buffer?.destroy();
    this.buffer = undefined;
    this.groups = undefined;
    if (this.data.length) this.data = new Float32Array(0);
    this.history.invalidate();
  }
  destroy(): void {
    this.releaseTarget();
  }
}
