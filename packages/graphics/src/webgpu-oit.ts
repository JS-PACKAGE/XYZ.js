import { oitCompositeWGSL } from './oit-shaders.js';
import type { FrameStats } from './render-stats.js';

/** Owns transient weighted accumulation/revealage, sharing the opaque depth attachment. */
export class WebGPUOIT {
  private readonly textures: GPUTexture[] = [];
  private residentBytes = 0;
  private width = 0;
  private height = 0;
  private group: GPUBindGroup | undefined;
  private readonly colors: GPURenderPassColorAttachment[] = [];
  private readonly composite: GPURenderPipeline;
  private readonly layout: GPUBindGroupLayout;
  constructor(
    private readonly device: GPUDevice,
    private readonly samples: number,
    private readonly stats: FrameStats,
  ) {
    this.layout = device.createBindGroupLayout({
      entries: [0, 1].map((binding) => ({
        binding,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'unfilterable-float' as const },
      })),
    });
    const module = device.createShaderModule({ code: oitCompositeWGSL });
    const component: GPUBlendComponent = {
      srcFactor: 'one',
      dstFactor: 'one-minus-src-alpha',
    };
    this.composite = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.layout] }),
      vertex: { module, entryPoint: 'vertexMain' },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: 'rgba16float',
            blend: { color: component, alpha: component },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    });
  }
  begin(
    encoder: GPUCommandEncoder,
    width: number,
    height: number,
    depth: GPUTextureView,
  ): GPURenderPassEncoder {
    if (this.width !== width || this.height !== height || !this.group)
      this.allocate(width, height);
    return encoder.beginRenderPass({
      colorAttachments: this.colors,
      depthStencilAttachment: { view: depth, depthReadOnly: true },
    });
  }
  resolve(encoder: GPUCommandEncoder, target: GPUTextureView): void {
    const pass = encoder.beginRenderPass({
      colorAttachments: [{ view: target, loadOp: 'load', storeOp: 'store' }],
    });
    try {
      pass.setPipeline(this.composite);
      pass.setBindGroup(0, this.group!);
      pass.draw(3);
    } finally {
      pass.end();
    }
  }
  private allocate(width: number, height: number): void {
    this.release();
    const entries: GPUBindGroupEntry[] = [];
    try {
      for (let index = 0; index < 2; index++) {
        const format: GPUTextureFormat =
          index === 0 ? 'rgba16float' : 'r8unorm';
        const texture = this.device.createTexture({
          size: [width, height],
          format,
          usage:
            GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.textures.push(texture);
        const bytes = width * height * (index === 0 ? 8 : 1);
        this.residentBytes += bytes;
        this.stats.target(bytes);
        const view = texture.createView();
        entries.push({ binding: index, resource: view });
        const attachment: GPURenderPassColorAttachment = {
          view,
          clearValue: index === 0 ? [0, 0, 0, 0] : [1, 1, 1, 1],
          loadOp: 'clear',
          storeOp: 'store',
        };
        if (this.samples > 1) {
          const multisample = this.device.createTexture({
            size: [width, height],
            format,
            sampleCount: this.samples,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
          });
          this.textures.push(multisample);
          this.residentBytes += bytes * this.samples;
          this.stats.target(bytes * this.samples);
          attachment.view = multisample.createView();
          attachment.resolveTarget = view;
          attachment.storeOp = 'discard';
        }
        this.colors.push(attachment);
      }
      this.group = this.device.createBindGroup({
        layout: this.layout,
        entries,
      });
      this.width = width;
      this.height = height;
    } catch (error) {
      this.release();
      throw error;
    }
  }
  resize(width: number, height: number): void {
    if (this.width !== width || this.height !== height) this.release();
  }
  release(): void {
    for (const texture of this.textures) texture.destroy();
    this.stats.target(-this.residentBytes);
    this.residentBytes = 0;
    this.textures.length = this.colors.length = 0;
    this.group = undefined;
    this.width = this.height = 0;
  }
}
