import type { PostProcessingSettings } from '../../core/src/render-settings.js';
import type { FrameStats } from './render-stats.js';
import { beginTimedRenderPass } from './gpu-timing.js';
import { temporalWGSL } from './temporal-post-shaders.js';
import { TemporalPostState, writeTemporalUniforms } from './temporal-post.js';

/** Native linear HDR SSR and ping-pong TAA, with sampled single/MSAA scene depth. */
export class WebGPUTemporalPipeline {
  private readonly ssrPipeline: GPURenderPipeline;
  private readonly taaPipeline: GPURenderPipeline;
  private readonly uniform: GPUBuffer;
  private readonly taaUniform: GPUBuffer;
  private readonly data = new Float32Array(60);
  private readonly blitPipelines = new Map<number, GPURenderPipeline>();
  private scratch: GPUTexture | undefined;
  private readonly history: GPUTexture[] = [];
  private readonly depths: GPUTexture[] = [];
  private width = 0;
  private height = 0;
  private index = 0;
  private state: TemporalPostState | undefined;

  constructor(
    private readonly device: GPUDevice,
    sampleCount: number,
    private readonly stats: FrameStats,
  ) {
    const ssr = device.createShaderModule({
      code: temporalWGSL(sampleCount, false),
    });
    const taa = device.createShaderModule({
      code: temporalWGSL(sampleCount, true),
    });
    const entries: GPUBindGroupLayoutEntry[] = [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'unfilterable-float' },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'depth', multisampled: sampleCount > 1 },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      },
    ];
    const ssrLayout = device.createPipelineLayout({
      bindGroupLayouts: [device.createBindGroupLayout({ entries })],
    });
    entries.push(
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'unfilterable-float' },
      },
      {
        binding: 4,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'unfilterable-float' },
      },
    );
    const taaLayout = device.createPipelineLayout({
      bindGroupLayouts: [device.createBindGroupLayout({ entries })],
    });
    this.ssrPipeline = device.createRenderPipeline({
      layout: ssrLayout,
      vertex: { module: ssr, entryPoint: 'vertexMain' },
      fragment: {
        module: ssr,
        entryPoint: 'fragmentMain',
        targets: [{ format: 'rgba16float' }],
      },
    });
    this.taaPipeline = device.createRenderPipeline({
      layout: taaLayout,
      vertex: { module: taa, entryPoint: 'vertexMain' },
      fragment: {
        module: taa,
        entryPoint: 'fragmentMain',
        targets: [{ format: 'rgba16float' }, { format: 'r32float' }],
      },
    });
    this.uniform = device.createBuffer({
      size: 240,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.taaUniform = device.createBuffer({
      size: 240,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private ensure(state: TemporalPostState): void {
    if (
      this.width === state.width &&
      this.height === state.height &&
      this.scratch
    ) {
      this.state = state;
      return;
    }
    this.releaseTarget();
    state.invalidate();
    this.state = state;
    this.width = state.width;
    this.height = state.height;
    try {
      this.scratch = this.allocate('rgba16float');
      for (let i = 0; i < 2; i++) {
        this.history.push(this.allocate('rgba16float'));
        this.depths.push(this.allocate('r32float'));
      }
    } catch (error) {
      this.releaseTarget();
      throw error;
    }
  }

  private allocate(format: GPUTextureFormat): GPUTexture {
    const texture = this.device.createTexture({
      size: [this.width, this.height],
      format,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC |
        GPUTextureUsage.COPY_DST,
    });
    this.stats.target(
      this.width * this.height * (format === 'r32float' ? 4 : 8),
    );
    return texture;
  }

  applyOpaqueSSR(
    encoder: GPUCommandEncoder,
    source: GPUTexture,
    depth: GPUTextureView,
    state: TemporalPostState,
    settings: PostProcessingSettings,
  ): GPUTexture {
    if (!settings.ssr) return source;
    this.ensure(state);
    this.render(encoder, source, depth, state, settings, false);
    return this.scratch!;
  }

  applyTAA(
    encoder: GPUCommandEncoder,
    source: GPUTexture,
    depth: GPUTextureView,
    state: TemporalPostState,
    settings: PostProcessingSettings,
  ): GPUTexture {
    if (!settings.taa) {
      state.invalidate();
      return source;
    }
    this.ensure(state);
    this.render(encoder, source, depth, state, settings, true);
    const result = this.history[this.index]!;
    this.index = 1 - this.index;
    return result;
  }

  private render(
    encoder: GPUCommandEncoder,
    source: GPUTexture,
    depth: GPUTextureView,
    state: TemporalPostState,
    settings: PostProcessingSettings,
    taa: boolean,
  ): void {
    writeTemporalUniforms(this.data, state, settings);
    // Separate persistent buffers keep opaque SSR and final TAA uniforms independent.
    const buffer = taa ? this.taaUniform : this.uniform;
    this.device.queue.writeBuffer(buffer, 0, this.data);
    this.stats.upload(240);
    const pipeline = taa ? this.taaPipeline : this.ssrPipeline;
    const entries: GPUBindGroupEntry[] = [
      { binding: 0, resource: source.createView() },
      { binding: 1, resource: depth },
      { binding: 2, resource: { buffer } },
    ];
    if (taa)
      entries.push(
        { binding: 3, resource: this.history[1 - this.index]!.createView() },
        { binding: 4, resource: this.depths[1 - this.index]!.createView() },
      );
    const group = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries,
    });
    const attachments: GPURenderPassColorAttachment[] = [
      {
        view: (taa ? this.history[this.index]! : this.scratch!).createView(),
        loadOp: 'clear',
        storeOp: 'store',
      },
    ];
    if (taa)
      attachments.push({
        view: this.depths[this.index]!.createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 1, g: 0, b: 0, a: 0 },
      });
    const pass = beginTimedRenderPass(encoder, {
      colorAttachments: attachments,
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.draw(3);
    pass.end();
  }

  blit(
    encoder: GPUCommandEncoder,
    source: GPUTexture,
    destination: GPUTextureView,
    sampleCount = 1,
  ): void {
    let pipeline = this.blitPipelines.get(sampleCount);
    if (!pipeline) {
      const module = this.device.createShaderModule({
        code: `@group(0) @binding(0) var source:texture_2d<f32>; @vertex fn vertexMain(@builtin(vertex_index) i:u32)->@builtin(position) vec4f { let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));return vec4f(p[i],0,1); } @fragment fn fragmentMain(@builtin(position) p:vec4f)->@location(0) vec4f {return textureLoad(source,vec2i(p.xy),0);}`,
      });
      pipeline = this.device.createRenderPipeline({
        layout: 'auto',
        vertex: { module, entryPoint: 'vertexMain' },
        fragment: {
          module,
          entryPoint: 'fragmentMain',
          targets: [{ format: 'rgba16float' }],
        },
        multisample: { count: sampleCount },
      });
      this.blitPipelines.set(sampleCount, pipeline);
    }
    const group = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: source.createView() }],
    });
    const pass = beginTimedRenderPass(encoder, {
      colorAttachments: [
        { view: destination, loadOp: 'load', storeOp: 'store' },
      ],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.draw(3);
    pass.end();
  }

  resize(width: number, height: number): void {
    if (width !== this.width || height !== this.height) this.releaseTarget();
  }

  releaseTarget(): void {
    this.state?.invalidate();
    this.state = undefined;
    const count =
      (this.scratch ? 8 : 0) + this.history.length * 8 + this.depths.length * 4;
    this.scratch?.destroy();
    for (const texture of this.history) texture.destroy();
    for (const texture of this.depths) texture.destroy();
    this.stats.target(-this.width * this.height * count);
    this.scratch = undefined;
    this.history.length = 0;
    this.depths.length = 0;
    this.width = 0;
    this.height = 0;
    this.index = 0;
  }

  destroy(): void {
    this.releaseTarget();
    this.uniform.destroy();
    this.taaUniform.destroy();
    this.blitPipelines.clear();
  }
}
