import { beginTimedRenderPass } from './gpu-timing.js';
import type { PostProcessingSettings } from '../../core/src/render-settings.js';
import { GraphicsError, WebGPUInitializationError } from './errors.js';
import { fxaaWGSL } from './fxaa-shaders.js';
import { depthPostWGSL } from './depth-post-shaders.js';
import { gradingWGSL } from './color-grading-shaders.js';
import type { ColorLUT3D } from '../../core/src/color-grading.js';
import { getPostEffects } from '../../core/src/post-effects.js';
import type { Scene } from '../../core/src/scene.js';
import { volumetricWGSL, writeVolumetricUniforms } from './volumetric-post.js';
import {
  OrthographicCamera,
  type Camera3D,
} from '../../core/src/orthographic-camera.js';
import type { Matrix4 } from '../../math/src/index.js';
import type { FrameStats } from './render-stats.js';

const postShader = (sampleCount: number): string => /* wgsl */ `
struct Settings { values: vec4f, viewport: vec4f, inverseVP: mat4x4f, clip: vec4f, ssao: vec4f, dof: vec4f, grading: vec4f, fog: vec4f, fogColor: vec4f, shaft: vec4f, shaftColor: vec4f };
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var<uniform> settings: Settings;
${depthPostWGSL(sampleCount)}
${gradingWGSL}
${volumetricWGSL}
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f,3>(vec2f(-1.0,-1.0),vec2f(3.0,-1.0),vec2f(-1.0,3.0));
  return vec4f(positions[index],0.0,1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let size = vec2i(textureDimensions(source));
  let pixel = clamp(vec2i(position.xy),vec2i(0),size-vec2i(1));
  let radius = i32(min(floor(settings.viewport.z+0.5),f32(max(size.x,size.y))));
  let sample = focusedSample(pixel);
  var color = sample.rgb/max(sample.a,0.000001)*ambientOcclusion(pixel);
  color = volumetric(color,pixel);
  var bloom = vec3f(0.0);
  if (settings.values.z > 0.0) {
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let offset = vec2i(x,y)*radius;
        let neighbor = textureLoad(source,clamp(pixel+offset,vec2i(0),size-vec2i(1)),0);
        bloom += max(neighbor.rgb/max(neighbor.a,0.000001)-vec3f(settings.values.w),vec3f(0.0));
      }
    }
  }
  color = max((color+bloom*(settings.values.z/9.0))*settings.values.x,vec3f(0.0));
  color = tone(color);
  color = select(1.055*pow(color,vec3f(1.0/2.4))-0.055,color*12.92,color <= vec3f(0.0031308));
  color = grade(color);
  return vec4f(color*sample.a,sample.a);
}
`;

/** A linear rgba16float scene target, resolved before the 2D overlay. */
export class WebGPUPostPipeline {
  private texture: GPUTexture | undefined;
  private view: GPUTextureView | undefined;
  private bindGroup: GPUBindGroup | undefined;
  private depthView: GPUTextureView | undefined;
  private buffer: GPUBuffer | undefined;
  private fxaaTexture: GPUTexture | undefined;
  private fxaaView: GPUTextureView | undefined;
  private fxaaGroup: GPUBindGroup | undefined;
  private readonly fxaaSampler: GPUSampler;
  private width = 0;
  private height = 0;
  private lutTexture: GPUTexture | undefined;
  private lut: ColorLUT3D | undefined;
  private readonly data = new Float32Array(56);
  private readonly attachment: Omit<GPURenderPassColorAttachment, 'view'> & {
    view?: GPUTextureView;
  } = {
    loadOp: 'clear',
    storeOp: 'store',
  };
  private readonly descriptor: GPURenderPassDescriptor = {
    colorAttachments: [this.attachment as GPURenderPassColorAttachment],
  };

  private constructor(
    private readonly device: GPUDevice,
    private readonly pipeline: GPURenderPipeline,
    private readonly fxaaPipeline: GPURenderPipeline,
    private readonly format: GPUTextureFormat,
    readonly stats: FrameStats,
  ) {
    this.fxaaSampler = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
    });
  }

  static async initialize(
    device: GPUDevice,
    format: GPUTextureFormat,
    isDestroyed: () => boolean,
    sampleCount: number,
    stats: FrameStats,
  ): Promise<WebGPUPostPipeline> {
    const module = device.createShaderModule({ code: postShader(sampleCount) });
    const fxaaModule = device.createShaderModule({ code: fxaaWGSL });
    const [info, fxaaInfo] = await Promise.all([
      module.getCompilationInfo(),
      fxaaModule.getCompilationInfo(),
    ]);
    if (isDestroyed())
      throw new GraphicsError(
        'WebGPU renderer was destroyed during initialization.',
      );
    const errors = [...info.messages, ...fxaaInfo.messages].filter(
      (message) => message.type === 'error',
    );
    if (errors.length)
      throw new WebGPUInitializationError(
        `WebGPU post shader compilation failed: ${errors.map((message) => `${message.lineNum}:${message.linePos} ${message.message}`).join('; ')}`,
      );
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vertexMain' },
      fragment: { module, entryPoint: 'fragmentMain', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
    const fxaaPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: fxaaModule, entryPoint: 'vertexMain' },
      fragment: {
        module: fxaaModule,
        entryPoint: 'fragmentMain',
        targets: [{ format }],
      },
      primitive: { topology: 'triangle-list' },
    });
    return new WebGPUPostPipeline(
      device,
      pipeline,
      fxaaPipeline,
      format,
      stats,
    );
  }

  target(width: number, height: number, depth: GPUTextureView): GPUTextureView {
    if (this.texture && this.width === width && this.height === height)
      return this.view!;
    this.releaseTarget();
    if (!this.buffer) {
      this.buffer = this.device.createBuffer({
        size: this.data.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }
    const texture = this.device.createTexture({
      size: [width, height],
      format: 'rgba16float',
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC,
    });
    this.stats.target(width * height * 8);
    try {
      const view = texture.createView();
      this.depthView = depth;
      this.bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: view },
          { binding: 1, resource: { buffer: this.buffer } },
          { binding: 2, resource: depth },
          { binding: 3, resource: this.ensureLUT().createView() },
        ],
      });
      this.texture = texture;
      this.view = view;
      this.width = width;
      this.height = height;
      return view;
    } catch (error) {
      texture.destroy();
      this.stats.target(-width * height * 8);
      throw error;
    }
  }

  copyColor(encoder: GPUCommandEncoder, destination: GPUTexture): void {
    encoder.copyTextureToTexture(
      { texture: this.texture! },
      { texture: destination },
      [this.width, this.height],
    );
  }

  get colorTexture(): GPUTexture {
    return this.texture!;
  }

  private ensureFxaa(): void {
    if (this.fxaaTexture) return;
    const texture = this.device.createTexture({
      size: [this.width, this.height],
      format: this.format,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.stats.target(this.width * this.height * 4);
    try {
      const view = texture.createView();
      const group = this.device.createBindGroup({
        layout: this.fxaaPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: view },
          { binding: 1, resource: this.fxaaSampler },
        ],
      });
      this.fxaaTexture = texture;
      this.fxaaView = view;
      this.fxaaGroup = group;
    } catch (error) {
      texture.destroy();
      this.stats.target(-this.width * this.height * 4);
      throw error;
    }
  }

  private releaseFxaa(): void {
    this.fxaaTexture?.destroy();
    if (this.fxaaTexture) this.stats.target(-this.width * this.height * 4);
    this.fxaaTexture = undefined;
    this.fxaaView = undefined;
    this.fxaaGroup = undefined;
  }

  render(
    encoder: GPUCommandEncoder,
    view: GPUTextureView,
    settings: PostProcessingSettings,
    camera: Camera3D,
    inverseVP: Matrix4,
    source?: GPUTexture,
    depth?: GPUTextureView,
    scene?: Scene,
  ): void {
    const enabled = settings.enabled;
    const fxaa = enabled && settings.fxaa;
    const effects = getPostEffects(settings);
    effects?.validate();
    const tone = effects?.toneMapper ?? settings.toneMapping;
    const lut = effects?.colorGrading?.lut;
    if (this.lut !== lut) this.bindGroup = undefined;
    let group = this.bindGroup!;
    if (source || !group) {
      group = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: (source ?? this.texture!).createView() },
          { binding: 1, resource: { buffer: this.buffer! } },
          { binding: 2, resource: depth ?? this.depthView! },
          { binding: 3, resource: this.ensureLUT(lut).createView() },
        ],
      });
      if (!source) this.bindGroup = group;
    }
    this.data[0] = enabled ? settings.exposure : 1;
    this.data[1] = enabled ? tone === 'aces' ? 1 : tone === 'agx' ? 2 : tone === 'reinhard' ? 3 : tone === 'neutral' ? 4 : 0 : 0;
    this.data[2] = enabled ? settings.bloomStrength : 0;
    this.data[3] = settings.bloomThreshold;
    this.data[4] = this.width;
    this.data[5] = this.height;
    this.data[6] = settings.bloomRadius;
    this.data.set(inverseVP.elements, 8);
    this.data[24] = camera.near;
    this.data[25] = camera.far;
    this.data[26] = camera instanceof OrthographicCamera ? 1 : 0;
    const e = camera.matrix.elements;
    this.data[27] = Math.hypot(e[1]!, e[5]!, e[9]!);
    this.data[28] = enabled && settings.ssao ? 1 : 0;
    this.data[29] = settings.ssaoRadius;
    this.data[30] = settings.ssaoStrength;
    this.data[31] = settings.ssaoBias;
    this.data[32] = enabled && settings.depthOfField ? 1 : 0;
    this.data[33] = settings.dofFocusDistance;
    this.data[34] = settings.dofFocusRange;
    this.data[35] = settings.dofBlurRadius;
    this.data[36] = effects?.colorGrading?.lut.size ?? 1;
    this.data[37] = enabled ? effects?.colorGrading?.strength ?? 0 : 0;
    writeVolumetricUniforms(this.data, 40, scene);
    this.device.queue.writeBuffer(this.buffer!, 0, this.data);
    this.stats.upload(this.data.byteLength);
    if (fxaa) this.ensureFxaa();
    else this.releaseFxaa();
    this.attachment.view = fxaa ? this.fxaaView : view;
    try {
      const pass = beginTimedRenderPass(encoder, this.descriptor);
      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, group);
      pass.draw(3);
      pass.end();
      if (fxaa) {
        this.attachment.view = view;
        const fxaa = beginTimedRenderPass(encoder, this.descriptor);
        fxaa.setPipeline(this.fxaaPipeline);
        fxaa.setBindGroup(0, this.fxaaGroup!);
        fxaa.draw(3);
        fxaa.end();
      }
    } finally {
      this.attachment.view = undefined;
    }
  }

  resize(width: number, height: number): void {
    if (this.width !== width || this.height !== height) this.releaseTarget();
  }

  releaseTarget(): void {
    this.texture?.destroy();
    if (this.texture) this.stats.target(-this.width * this.height * 8);
    this.releaseFxaa();
    this.texture = undefined;
    this.view = undefined;
    this.bindGroup = undefined;
    this.depthView = undefined;
  }

  private ensureLUT(lut?: ColorLUT3D): GPUTexture {
    if (this.lutTexture && this.lut === lut) return this.lutTexture;
    this.lutTexture?.destroy();
    this.lut = lut;
    const size = lut?.size ?? 1;
    this.lutTexture = this.device.createTexture({
      size: [size * size, size],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.device.queue.writeTexture({ texture: this.lutTexture }, lut?.strip ?? new Uint8Array([255,255,255,255]), { bytesPerRow: size * size * 4 }, [size * size, size]);
    return this.lutTexture;
  }

  destroy(): void {
    this.lutTexture?.destroy();
    this.releaseTarget();
    this.buffer?.destroy();
    this.buffer = undefined;
  }
}
