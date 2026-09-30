import {
  Material2D,
  PostProcessor2D,
  validateEffect2D,
} from '../../../core/src/materials2d/material2d.js';
import type { RenderSnapshot, TransitionFrame } from '../render2d-contract.js';
import { GraphicsError } from '../errors.js';
import { SPRITE_BYTES } from '../sprite-instance.js';
import { postWGSL, spriteWGSL, transitionWGSL } from './shaders.js';

export const premultipliedBlend: GPUBlendState = {
  color: {
    srcFactor: 'one',
    dstFactor: 'one-minus-src-alpha',
    operation: 'add',
  },
  alpha: {
    srcFactor: 'one',
    dstFactor: 'one-minus-src-alpha',
    operation: 'add',
  },
};

export function createSpritePipeline(
  device: GPUDevice,
  module: GPUShaderModule,
  format: GPUTextureFormat,
  layout: GPUPipelineLayout,
): GPURenderPipeline {
  return device.createRenderPipeline({
    layout,
    vertex: {
      module,
      entryPoint: 'vertexMain',
      buffers: [
        {
          arrayStride: SPRITE_BYTES,
          stepMode: 'instance',
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x4' },
            { shaderLocation: 1, offset: 16, format: 'float32x4' },
            { shaderLocation: 2, offset: 32, format: 'float32x4' },
            { shaderLocation: 3, offset: 48, format: 'float32x4' },
            { shaderLocation: 4, offset: 64, format: 'float32x4' },
          ],
        },
      ],
    },
    fragment: {
      module,
      entryPoint: 'fragmentMain',
      targets: [{ format, blend: premultipliedBlend }],
    },
    primitive: { topology: 'triangle-list' },
  });
}

export interface GPUColorTarget {
  readonly texture: GPUTexture;
  readonly view: GPUTextureView;
  readonly bindGroup: GPUBindGroup;
  readonly width: number;
  readonly height: number;
}

export class GPUSnapshot implements RenderSnapshot {
  readonly backend = 'webgpu' as const;
  private disposed = false;
  constructor(
    readonly owner: WebGPU2DEffects,
    readonly target: GPUColorTarget,
  ) {}
  get width(): number {
    return this.target.width;
  }
  get height(): number {
    return this.target.height;
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.target.texture.destroy();
    this.owner.snapshots.delete(this);
  }
}

interface PreparedEffect {
  direct: GPURenderPipeline;
  layer: GPURenderPipeline;
  buffer: GPUBuffer;
  bindGroup: GPUBindGroup;
  values: Float32Array;
  dispose: () => void;
}

/** Renderer-owned native pipelines, immutable captures and bounded mutable color targets. */
export class WebGPU2DEffects {
  readonly snapshots = new Set<GPUSnapshot>();
  readonly spriteViewportLayout: GPUBindGroupLayout;
  readonly spriteTextureLayout: GPUBindGroupLayout;
  readonly uniformLayout: GPUBindGroupLayout;
  readonly spriteLayout: GPUPipelineLayout;
  readonly defaultUniforms: GPUBindGroup;
  private readonly textureLayout: GPUBindGroupLayout;
  private readonly transitionTextureLayout: GPUBindGroupLayout;
  private readonly fullscreenLayout: GPUPipelineLayout;
  private readonly transitionLayout: GPUPipelineLayout;
  private readonly sampler: GPUSampler;
  private readonly frameBuffer: GPUBuffer;
  private readonly frameBindGroup: GPUBindGroup;
  private readonly frameValues = new Float32Array(16);
  private readonly uploadedFrameValues = new Float32Array(16).fill(NaN);
  private readonly materials = new Map<Material2D, PreparedEffect>();
  private readonly processors = new Map<PostProcessor2D, PreparedEffect>();
  private readonly pending = new Map<
    Material2D | PostProcessor2D,
    Promise<void>
  >();
  private preparation: Promise<void> = Promise.resolve();
  private compositePipeline: GPURenderPipeline | undefined;
  private transitionPipeline: GPURenderPipeline | undefined;
  private frameTarget: GPUColorTarget | undefined;
  private layerTargets: [GPUColorTarget, GPUColorTarget] | undefined;
  private transitionBindGroup: GPUBindGroup | undefined;
  private transitionIncoming: GPUColorTarget | undefined;
  private transitionOutgoing: GPUColorTarget | undefined;
  private disposed = false;
  private readonly attachment: Omit<GPURenderPassColorAttachment, 'view'> & {
    view?: GPUTextureView;
  } = {
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: { r: 0, g: 0, b: 0, a: 0 },
  };
  private readonly passDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [this.attachment as GPURenderPassColorAttachment],
  };

  constructor(
    private readonly device: GPUDevice,
    private readonly format: GPUTextureFormat,
    private readonly cancelled: () => boolean,
  ) {
    this.spriteViewportLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform', minBindingSize: 16 },
        },
      ],
    });
    this.spriteTextureLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
      ],
    });
    this.uniformLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform', minBindingSize: 64 },
        },
      ],
    });
    this.spriteLayout = device.createPipelineLayout({
      bindGroupLayouts: [
        this.spriteViewportLayout,
        this.spriteTextureLayout,
        this.uniformLayout,
      ],
    });
    this.textureLayout = this.spriteTextureLayout;
    this.transitionTextureLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
      ],
    });
    const frameLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform', minBindingSize: 64 },
        },
      ],
    });
    this.fullscreenLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.textureLayout, this.uniformLayout, frameLayout],
    });
    this.transitionLayout = device.createPipelineLayout({
      bindGroupLayouts: [
        this.transitionTextureLayout,
        this.uniformLayout,
        frameLayout,
      ],
    });
    this.sampler = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
    });
    this.frameBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.frameBindGroup = device.createBindGroup({
      layout: frameLayout,
      entries: [{ binding: 0, resource: { buffer: this.frameBuffer } }],
    });
    // Identity stages ignore effect uniforms, but still require the fixed layout binding.
    this.defaultUniforms = device.createBindGroup({
      layout: this.uniformLayout,
      entries: [{ binding: 0, resource: { buffer: this.frameBuffer } }],
    });
  }

  async initialize(): Promise<void> {
    const blit = await this.module(postWGSL(), '2D composition');
    const transition = await this.module(transitionWGSL, 'transition');
    this.compositePipeline = this.fullscreenPipeline(
      blit,
      this.format,
      this.fullscreenLayout,
      true,
    );
    this.transitionPipeline = this.fullscreenPipeline(
      transition,
      this.format,
      this.transitionLayout,
      false,
    );
  }

  private async module(
    source: string,
    label: string,
  ): Promise<GPUShaderModule> {
    if (this.disposed || this.cancelled())
      throw new GraphicsError(
        `WebGPU ${label} preparation requires an active renderer.`,
      );
    const module = this.device.createShaderModule({ code: source });
    const info = await module.getCompilationInfo();
    if (this.disposed || this.cancelled())
      throw new GraphicsError(
        `WebGPU ${label} preparation was cancelled by renderer teardown.`,
      );
    const errors = info.messages.filter((message) => message.type === 'error');
    if (errors.length)
      throw new GraphicsError(
        `WebGPU ${label} compilation failed: ${errors.map((message) => `${message.lineNum}:${message.linePos} ${message.message}`).join('; ')}`,
      );
    return module;
  }

  private fullscreenPipeline(
    module: GPUShaderModule,
    format: GPUTextureFormat,
    layout: GPUPipelineLayout,
    blend: boolean,
  ): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout,
      vertex: { module, entryPoint: 'vertexMain' },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [{ format, ...(blend ? { blend: premultipliedBlend } : {}) }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  prepare(effect: Material2D | PostProcessor2D): Promise<void> {
    validateEffect2D(effect);
    if (this.disposed || this.cancelled())
      return Promise.reject(
        new GraphicsError('WebGPU 2D preparation requires an active renderer.'),
      );
    const cache =
      effect instanceof Material2D ? this.materials : this.processors;
    if (cache.has(effect)) return Promise.resolve();
    const pending = this.pending.get(effect);
    if (pending) return pending;
    const operation = this.preparation.then(async () => {
      validateEffect2D(effect);
      this.device.pushErrorScope('validation');
      let entry: PreparedEffect | undefined;
      let buffer: GPUBuffer | undefined;
      let scopePending = true;
      try {
        const material = effect instanceof Material2D;
        const shader = await this.module(
          material ? spriteWGSL(effect.wgsl) : postWGSL(effect.wgsl),
          material ? 'Sprite material' : '2D postprocessor',
        );
        validateEffect2D(effect);
        const layer = material
          ? createSpritePipeline(
              this.device,
              shader,
              'rgba8unorm',
              this.spriteLayout,
            )
          : this.fullscreenPipeline(
              shader,
              'rgba8unorm',
              this.fullscreenLayout,
              false,
            );
        const direct = material
          ? createSpritePipeline(
              this.device,
              shader,
              this.format,
              this.spriteLayout,
            )
          : layer;
        buffer = this.device.createBuffer({
          size: 64,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const bindGroup = this.device.createBindGroup({
          layout: this.uniformLayout,
          entries: [{ binding: 0, resource: { buffer } }],
        });
        const ownedBuffer = buffer;
        const dispose = () => {
          ownedBuffer.destroy();
          cache.delete(effect);
          effect.removeEventListener('destroy', dispose);
        };
        entry = {
          direct,
          layer,
          buffer,
          bindGroup,
          values: new Float32Array(16).fill(NaN),
          dispose,
        };
        scopePending = false;
        const error = await this.device.popErrorScope();
        if (error)
          throw new GraphicsError(
            `WebGPU 2D effect pipeline validation failed: ${error.message}`,
          );
        if (this.disposed || this.cancelled())
          throw new GraphicsError(
            'WebGPU 2D effect preparation was cancelled.',
          );
        validateEffect2D(effect);
        cache.set(effect, entry);
        effect.addEventListener('destroy', dispose, { once: true });
      } catch (error) {
        buffer?.destroy();
        throw error;
      } finally {
        if (scopePending) await this.device.popErrorScope();
      }
    });
    this.preparation = operation.catch(() => {});
    const result = operation.finally(() => this.pending.delete(effect));
    this.pending.set(effect, result);
    return result;
  }

  private prepared(effect: Material2D | PostProcessor2D): PreparedEffect {
    validateEffect2D(effect);
    const entry =
      effect instanceof Material2D
        ? this.materials.get(effect)
        : this.processors.get(effect);
    if (!entry)
      throw new GraphicsError(
        'WebGPU 2D effects must be prepared before rendering.',
      );
    let changed = false;
    for (let i = 0; i < 16; i++)
      if (entry.values[i] !== effect.uniforms[i]) {
        changed = true;
        break;
      }
    if (changed) {
      entry.values.set(effect.uniforms);
      this.device.queue.writeBuffer(entry.buffer, 0, entry.values);
    }
    return entry;
  }

  material(material: Material2D): PreparedEffect {
    if (!(material instanceof Material2D))
      throw new GraphicsError('Sprite.material must be a Material2D.');
    return this.prepared(material);
  }

  validate(material: Material2D | PostProcessor2D): void {
    this.prepared(material);
  }

  target(
    width: number,
    height: number,
    format: GPUTextureFormat = this.format,
  ): GPUColorTarget {
    const texture = this.device.createTexture({
      size: [width, height],
      format,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    try {
      const view = texture.createView();
      const bindGroup = this.device.createBindGroup({
        layout: this.textureLayout,
        entries: [
          { binding: 0, resource: view },
          { binding: 1, resource: this.sampler },
        ],
      });
      return { texture, view, bindGroup, width, height };
    } catch (error) {
      texture.destroy();
      throw error;
    }
  }

  frame(width: number, height: number): GPUColorTarget {
    if (
      !this.frameTarget ||
      this.frameTarget.width !== width ||
      this.frameTarget.height !== height
    ) {
      this.frameTarget?.texture.destroy();
      this.frameTarget = this.target(width, height);
      this.transitionBindGroup = undefined;
    }
    return this.frameTarget;
  }

  layers(width: number, height: number): [GPUColorTarget, GPUColorTarget] {
    if (
      !this.layerTargets ||
      this.layerTargets[0].width !== width ||
      this.layerTargets[0].height !== height
    ) {
      this.releaseLayers();
      const first = this.target(width, height, 'rgba8unorm');
      try {
        this.layerTargets = [first, this.target(width, height, 'rgba8unorm')];
      } catch (error) {
        first.texture.destroy();
        throw error;
      }
    }
    return this.layerTargets;
  }

  releaseLayers(): void {
    if (this.layerTargets)
      for (const target of this.layerTargets) target.texture.destroy();
    this.layerTargets = undefined;
  }

  settings(width: number, height: number, transition?: TransitionFrame): void {
    if (transition) {
      const { kind, direction, color } = transition;
      if (
        !Number.isFinite(transition.progress) ||
        (kind !== 'fade' && kind !== 'crossfade' && kind !== 'slide') ||
        (direction !== 'left' &&
          direction !== 'right' &&
          direction !== 'up' &&
          direction !== 'down') ||
        color.length !== 4
      )
        throw new GraphicsError('WebGPU transition settings are invalid.');
      for (const value of color)
        if (!Number.isFinite(value) || value < 0 || value > 1)
          throw new GraphicsError('WebGPU transition settings are invalid.');
    }
    const data = this.frameValues;
    data.fill(0);
    data[0] = width;
    data[1] = height;
    if (transition) {
      data[2] = Math.max(0, Math.min(1, transition.progress));
      data[3] =
        transition.kind === 'fade' ? 1 : transition.kind === 'slide' ? 2 : 0;
      data[4] =
        transition.direction === 'left'
          ? -1
          : transition.direction === 'right'
            ? 1
            : 0;
      data[5] =
        transition.direction === 'up'
          ? -1
          : transition.direction === 'down'
            ? 1
            : 0;
      data[6] = transition.snapshot ? 1 : 0;
      for (let i = 0; i < 3; i++)
        data[8 + i] = transition.color[i] * transition.color[3];
      data[11] = transition.color[3];
    }
    let changed = false;
    for (let i = 0; i < 16; i++)
      if (data[i] !== this.uploadedFrameValues[i]) {
        changed = true;
        break;
      }
    if (changed) {
      this.uploadedFrameValues.set(data);
      this.device.queue.writeBuffer(this.frameBuffer, 0, data);
    }
  }

  process(
    encoder: GPUCommandEncoder,
    input: GPUColorTarget,
    effects: readonly PostProcessor2D[],
  ): GPUColorTarget {
    let current = input;
    for (const effect of effects) {
      if (!(effect instanceof PostProcessor2D))
        throw new GraphicsError(
          'Scene.effects2D must contain PostProcessor2D values.',
        );
      const entry = this.prepared(effect);
      const targets = this.layerTargets!;
      const output = current === targets[0] ? targets[1] : targets[0];
      this.draw(
        encoder,
        output.view,
        current.bindGroup,
        entry.direct,
        entry.bindGroup,
        false,
      );
      current = output;
    }
    return current;
  }

  composite(
    encoder: GPUCommandEncoder,
    input: GPUColorTarget,
    output: GPUTextureView,
  ): void {
    this.draw(
      encoder,
      output,
      input.bindGroup,
      this.compositePipeline!,
      undefined,
      true,
    );
  }

  transition(
    encoder: GPUCommandEncoder,
    input: GPUColorTarget,
    output: GPUTextureView,
    frame: TransitionFrame,
  ): void {
    const old = frame.snapshot ? this.snapshot(frame.snapshot).target : input;
    if (
      !this.transitionBindGroup ||
      this.transitionIncoming !== input ||
      this.transitionOutgoing !== old
    ) {
      this.transitionBindGroup = this.device.createBindGroup({
        layout: this.transitionTextureLayout,
        entries: [
          { binding: 0, resource: input.view },
          { binding: 1, resource: this.sampler },
          { binding: 2, resource: old.view },
        ],
      });
      this.transitionIncoming = input;
      this.transitionOutgoing = old;
    }
    this.draw(
      encoder,
      output,
      this.transitionBindGroup,
      this.transitionPipeline!,
      undefined,
      false,
    );
  }

  snapshot(snapshot: RenderSnapshot): GPUSnapshot {
    if (
      !(snapshot instanceof GPUSnapshot) ||
      snapshot.owner !== this ||
      snapshot.destroyed
    )
      throw new GraphicsError(
        'WebGPU transition snapshot is destroyed or belongs to another renderer.',
      );
    return snapshot;
  }

  private draw(
    encoder: GPUCommandEncoder,
    output: GPUTextureView,
    texture: GPUBindGroup,
    pipeline: GPURenderPipeline,
    uniforms: GPUBindGroup | undefined,
    load: boolean,
  ): void {
    this.attachment.view = output;
    this.attachment.loadOp = load ? 'load' : 'clear';
    try {
      const pass = encoder.beginRenderPass(this.passDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, texture);
      pass.setBindGroup(1, uniforms ?? this.defaultUniforms);
      pass.setBindGroup(2, this.frameBindGroup);
      pass.draw(3);
      pass.end();
    } finally {
      this.attachment.view = undefined;
    }
  }

  releaseFrame(): void {
    this.frameTarget?.texture.destroy();
    this.frameTarget = undefined;
    this.transitionBindGroup = undefined;
    this.transitionIncoming = undefined;
    this.transitionOutgoing = undefined;
  }

  resize(): void {
    this.releaseFrame();
    this.releaseLayers();
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resize();
    for (const snapshot of this.snapshots) snapshot.destroy();
    for (const entry of this.materials.values()) entry.dispose();
    for (const entry of this.processors.values()) entry.dispose();
    this.pending.clear();
    this.frameBuffer.destroy();
    this.compositePipeline = undefined;
    this.transitionPipeline = undefined;
  }
}
