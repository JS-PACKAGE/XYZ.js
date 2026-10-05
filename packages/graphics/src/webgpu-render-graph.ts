import {
  RenderGraph,
  type RenderGraphPass,
  type RenderGraphPreparationOptions,
} from './render-graph.js';
import { gpuOperation } from './compute.js';
import { graphWGSL, graphIdentityWGSL } from './render-graph-shaders.js';
import { GraphicsError, WebGPUDeviceLostError } from './errors.js';

interface Target {
  texture: GPUTexture;
  view: GPUTextureView;
  width: number;
  height: number;
  format: GPUTextureFormat;
}
interface Pass {
  pipeline: GPURenderPipeline;
  uniforms: GPUBuffer;
  settings: GPUBuffer;
  settingsData: Float32Array<ArrayBuffer>;
  inputs: Target[];
  boundInputs: Target[];
  groups: GPUBindGroup[];
  attachment: GPURenderPassColorAttachment;
  descriptor: GPURenderPassDescriptor;
}
interface GraphOwner {
  passes: Map<RenderGraphPass, Pass>;
  targets: Map<string, Target>;
  ready: Promise<void>;
  release: () => void;
  width: number;
  height: number;
}
/** Private native frame graph. Full scene and HUD are rendered into sceneTarget before encode. */
export class WebGPURenderGraph {
  private readonly owners = new Map<RenderGraph, GraphOwner>();
  private scene: Target | undefined;
  private blit: Pass | undefined;
  private blitReady: Promise<Pass> | undefined;
  private readonly emptyUniforms = new Float32Array(16);
  private readonly sampler: GPUSampler;
  private failure: Error | undefined;
  private readonly lifetime: Promise<never>;
  private rejectLifetime!: (error: Error) => void;
  constructor(
    private readonly device: GPUDevice,
    private readonly format: GPUTextureFormat,
  ) {
    this.sampler = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
    });
    this.lifetime = new Promise<never>((_, reject) => {
      this.rejectLifetime = reject;
    });
    void this.lifetime.catch(() => {});
    void device.lost.then((info) =>
      this.destroy(
        new WebGPUDeviceLostError(`Graph device lost: ${info.message}`),
      ),
    );
  }
  private live(): void {
    if (this.failure) throw this.failure;
  }
  async prepare(
    graph: RenderGraph,
    options: RenderGraphPreparationOptions = {},
  ): Promise<void> {
    this.live();
    graph.validate();
    options.signal?.throwIfAborted();
    let owner = this.owners.get(graph);
    if (!owner) {
      const passes = new Map<RenderGraphPass, Pass>(),
        targets = new Map<string, Target>();
      const release = (): void => {
        graph.removeEventListener('destroy', release);
        for (const pass of graph.passes)
          pass.effect.removeEventListener('destroy', release);
        for (const pass of passes.values()) {
          pass.uniforms.destroy();
          pass.settings.destroy();
        }
        passes.clear();
        for (const target of targets.values()) target.texture.destroy();
        targets.clear();
        this.owners.delete(graph);
      };
      owner = {
        passes,
        targets,
        ready: Promise.resolve(),
        release,
        width: 0,
        height: 0,
      };
      this.owners.set(graph, owner);
      graph.addEventListener('destroy', release, { once: true });
      for (const pass of graph.passes)
        pass.effect.addEventListener('destroy', release, { once: true });
      const record = owner;
      owner.ready = (async () => {
        try {
          for (const pass of graph.schedule) {
            const format = graph.targets.find(
              (target) => target.name === pass.output,
            )!.format!;
            const compiled = await this.compile(
              graphWGSL(pass.effect.wgsl, pass.inputs.length),
              pass.inputs.length,
              format,
            );
            if (
              this.failure ||
              this.owners.get(graph) !== record ||
              graph.destroyed ||
              pass.effect.destroyed
            ) {
              compiled.uniforms.destroy();
              compiled.settings.destroy();
              throw (
                this.failure ??
                new GraphicsError('Graph released during compilation.')
              );
            }
            passes.set(pass, compiled);
          }
          if (!this.blitReady) {
            this.blitReady = this.compile(
              graphWGSL(graphIdentityWGSL, 1),
              1,
              this.format,
            )
              .then((pass) => {
                if (this.failure) {
                  pass.uniforms.destroy();
                  pass.settings.destroy();
                  throw this.failure;
                }
                this.blit = pass;
                return pass;
              })
              .catch((error) => {
                this.blitReady = undefined;
                throw error;
              });
          }
          await this.blitReady;
          this.live();
          graph.validate();
        } catch (error) {
          release();
          throw error;
        }
      })();
      void owner.ready.catch(() => {});
    }
    await gpuOperation(
      Promise.race([owner.ready, this.lifetime]),
      options.signal,
      [graph, ...graph.passes.map((pass) => pass.effect)],
    );
    this.live();
    graph.validate();
  }
  private async compile(
    code: string,
    inputs: number,
    format: GPUTextureFormat,
  ): Promise<Pass> {
    this.device.pushErrorScope('validation');
    let module: GPUShaderModule;
    let validation: Promise<GPUError | null>;
    try {
      module = this.device.createShaderModule({ code });
    } finally {
      validation = this.device.popErrorScope();
    }
    const [info, error] = await Promise.all([
      module.getCompilationInfo(),
      validation,
    ]);
    this.live();
    const errors = info.messages.filter((message) => message.type === 'error');
    if (errors.length)
      throw new GraphicsError(
        `Render graph compilation failed: ${errors.map((message) => `${message.lineNum}:${message.linePos} ${message.message}`).join('; ')}`,
      );
    if (error)
      throw new GraphicsError(
        `Render graph shader validation failed: ${error.message}`,
      );
    const entries: GPUBindGroupLayoutEntry[] = [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
    ];
    for (let index = 1; index < inputs; index++)
      entries.push({
        binding: index + 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      });
    const textures = this.device.createBindGroupLayout({ entries });
    const uniforms = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });
    const settings = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });
    const pipeline = await this.device.createRenderPipelineAsync({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [textures, uniforms, settings],
      }),
      vertex: { module, entryPoint: 'vertexMain' },
      fragment: { module, entryPoint: 'fragmentMain', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
    this.live();
    const uniformBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    try {
      const attachment: GPURenderPassColorAttachment = {
        view: undefined as unknown as GPUTextureView,
        loadOp: 'clear',
        storeOp: 'store',
      };
      return {
        pipeline,
        uniforms: uniformBuffer,
        settings: this.device.createBuffer({
          size: 64,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        }),
        settingsData: new Float32Array(16),
        inputs: [],
        boundInputs: [],
        groups: [],
        attachment,
        descriptor: { colorAttachments: [attachment] },
      };
    } catch (error) {
      uniformBuffer.destroy();
      throw error;
    }
  }
  private target(
    width: number,
    height: number,
    format: GPUTextureFormat,
  ): Target {
    const texture = this.device.createTexture({
      size: [width, height],
      format,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC,
    });
    try {
      return { texture, view: texture.createView(), width, height, format };
    } catch (error) {
      texture.destroy();
      throw error;
    }
  }
  /** Internal native target: renderer routes its normal 3D+2D output here, never the transition. */
  sceneTarget(
    graph: RenderGraph,
    width: number,
    height: number,
  ): GPUTextureView {
    this.live();
    graph.validate();
    const owner = this.owners.get(graph);
    if (!owner || owner.passes.size !== graph.passes.length || !this.blit)
      throw new GraphicsError(
        'Render graph must be prepared before rendering.',
      );
    if (
      owner.width === width &&
      owner.height === height &&
      this.scene?.width === width &&
      this.scene.height === height
    )
      return this.scene.view;
    const resolutions = graph.resolutions(
      width,
      height,
      this.device.limits.maxTextureDimension2D,
    );
    const replacements = new Map<string, Target>();
    let scene: Target | undefined;
    try {
      if (
        !this.scene ||
        this.scene.width !== width ||
        this.scene.height !== height
      )
        scene = this.target(width, height, this.format);
      for (const resolution of resolutions) {
        const previous = owner.targets.get(resolution.target.name);
        if (
          !previous ||
          previous.width !== resolution.width ||
          previous.height !== resolution.height
        )
          replacements.set(
            resolution.target.name,
            this.target(
              resolution.width,
              resolution.height,
              resolution.target.format!,
            ),
          );
      }
    } catch (error) {
      scene?.texture.destroy();
      for (const target of replacements.values()) target.texture.destroy();
      throw error;
    }
    if (scene) {
      this.scene?.texture.destroy();
      this.scene = scene;
    }
    for (const [name, target] of replacements) {
      owner.targets.get(name)?.texture.destroy();
      owner.targets.set(name, target);
    }
    owner.width = width;
    owner.height = height;
    return this.scene!.view;
  }
  /** Encodes true DAG attachment reads/writes, then presents to the caller's frame/transition target. */
  encode(
    graph: RenderGraph,
    encoder: GPUCommandEncoder,
    destination: GPUTextureView,
  ): void {
    this.live();
    graph.validate();
    const owner = this.owners.get(graph);
    if (
      !owner ||
      !this.scene ||
      !this.blit ||
      owner.passes.size !== graph.passes.length ||
      owner.targets.size !== graph.targets.length
    )
      throw new GraphicsError('Graph resources are not prepared/resolved.');
    for (const descriptor of graph.schedule) {
      const target = owner.targets.get(descriptor.output)!;
      const pass = owner.passes.get(descriptor)!;
      for (let index = 0; index < descriptor.inputs.length; index++)
        pass.inputs[index] =
          descriptor.inputs[index] === '$scene'
            ? this.scene!
            : owner.targets.get(descriptor.inputs[index])!;
      this.draw(
        encoder,
        pass,
        target.view,
        target.width,
        target.height,
        descriptor.effect.uniforms,
      );
    }
    this.blit.inputs[0] = owner.targets.get(graph.output)!;
    this.draw(
      encoder,
      this.blit,
      destination,
      this.scene.width,
      this.scene.height,
    );
  }
  private draw(
    encoder: GPUCommandEncoder,
    pass: Pass,
    view: GPUTextureView,
    width: number,
    height: number,
    uniforms = this.emptyUniforms,
  ): void {
    this.device.queue.writeBuffer(
      pass.uniforms,
      0,
      uniforms as Float32Array<ArrayBuffer>,
    );
    pass.settingsData[0] = width;
    pass.settingsData[1] = height;
    this.device.queue.writeBuffer(pass.settings, 0, pass.settingsData);
    if (
      pass.inputs.length !== pass.boundInputs.length ||
      pass.inputs.some((input, index) => input !== pass.boundInputs[index])
    ) {
      const entries: GPUBindGroupEntry[] = [
        { binding: 0, resource: pass.inputs[0].view },
        { binding: 1, resource: this.sampler },
      ];
      for (let index = 1; index < pass.inputs.length; index++)
        entries.push({ binding: index + 1, resource: pass.inputs[index].view });
      pass.groups = [
        this.device.createBindGroup({
          layout: pass.pipeline.getBindGroupLayout(0),
          entries,
        }),
        this.device.createBindGroup({
          layout: pass.pipeline.getBindGroupLayout(1),
          entries: [{ binding: 0, resource: { buffer: pass.uniforms } }],
        }),
        this.device.createBindGroup({
          layout: pass.pipeline.getBindGroupLayout(2),
          entries: [{ binding: 0, resource: { buffer: pass.settings } }],
        }),
      ];
      pass.boundInputs = pass.inputs.slice();
    }
    pass.attachment.view = view;
    const render = encoder.beginRenderPass(pass.descriptor);
    render.setPipeline(pass.pipeline);
    for (let index = 0; index < pass.groups.length; index++)
      render.setBindGroup(index, pass.groups[index]);
    render.draw(3);
    render.end();
  }
  destroy(error = new GraphicsError('Render graph owner destroyed.')): void {
    if (this.failure) return;
    this.failure = error;
    this.rejectLifetime(error);
    for (const owner of this.owners.values()) owner.release();
    this.scene?.texture.destroy();
    this.scene = undefined;
    if (this.blit) {
      this.blit.uniforms.destroy();
      this.blit.settings.destroy();
      this.blit = undefined;
    }
  }
}
