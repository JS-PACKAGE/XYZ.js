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
  private readonly stride: number;
  private groupForPass?: GPUBindGroup;
  private texture?: GPUTexture;
  private view?: GPUTextureView;
  private buffer?: GPUBuffer;
  private data = new Float32Array(0);
  private width = 0;
  private height = 0;

  constructor(
    private readonly device: GPUDevice,
    samples: number,
    private readonly stats: FrameStats,
  ) {
    this.stride =
      Math.ceil(128 / device.limits.minUniformBufferOffsetAlignment) *
      device.limits.minUniformBufferOffsetAlignment;
    this.layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
            hasDynamicOffset: true,
            minBindingSize: 128,
          },
        },
        {
          binding: 1,
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
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }
    for (let i = 0; i < draws.length; i++)
      this.data.set(draws[i]!.data, i * floats);
    if (draws.length) {
      this.device.queue.writeBuffer(
        this.buffer!,
        0,
        this.data,
        0,
        draws.length * floats,
      );
      this.stats.upload(draws.length * this.stride);
      // Depth views change on resize; this pass only borrows them for one encoding.
      const group = this.device.createBindGroup({
        layout: this.layout,
        entries: [
          { binding: 0, resource: { buffer: this.buffer!, size: 128 } },
          { binding: 1, resource: depth },
        ],
      });
      this.groupForPass = group;
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
      for (let i = 0; i < draws.length; i++) {
        const mesh = draws[i]!.mesh,
          cached = geometry(mesh);
        pass.setBindGroup(0, this.groupForPass!, [i * this.stride]);
        pass.setVertexBuffer(0, cached.vertex);
        pass.setIndexBuffer(cached.index, 'uint32');
        pass.drawIndexed(mesh.renderGeometry.indices.length);
        this.stats.draw(mesh.renderGeometry.indices.length, 1);
      }
    } finally {
      pass.end();
      this.groupForPass = undefined;
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
    this.groupForPass = undefined;
    this.data = new Float32Array(0);
    this.history.invalidate();
  }
  destroy(): void {
    this.releaseTarget();
  }
}
