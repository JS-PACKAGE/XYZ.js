import type { Scene } from '../../core/src/scene.js';
import type { Texture, Texture2DSource } from '../../assets/src/index.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import type { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type {
  RenderTexture2D,
  RenderTextureOptions2D,
} from './render-texture2d.js';
import { WebGPURender2D, type WebGPURender2DHooks } from './webgpu-render2d.js';
import { defaults } from '../../../src/data/defaults.js';
import {
  GraphicsError,
  WebGPUInitializationError,
  WebGPUDeviceLostError,
  WebGPUNotSupportedError,
} from './errors.js';
import type { Renderer } from './index.js';
import { WebGPUMeshPipeline } from './webgpu-mesh-pipeline.js';
import { FrameStats, type RenderStats } from './render-stats.js';
import {
  collectRenderCommands2D,
  RenderCommandBuffer2D,
  type FrameEffects,
  type RenderSnapshot,
} from './render2d-contract.js';
import {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/material2d.js';
import {
  WebGPU2DEffects,
  GPUSnapshot,
  type GPUColorTarget,
} from './webgpu-2d/effects.js';

const triangleShader = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
};

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(0.0, 0.7),
    vec2f(-0.7, -0.6),
    vec2f(0.7, -0.6),
  );
  var colors = array<vec3f, 3>(
    vec3f(1.0, 0.3, 0.25),
    vec3f(0.25, 0.9, 0.5),
    vec3f(0.3, 0.5, 1.0),
  );
  var output: VertexOutput;
  output.position = vec4f(positions[index], 0.0, 1.0);
  output.color = colors[index];
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
`;

interface CachedTexture {
  resource: GPUTexture;
  seen: number;
  version: number;
  prepared: boolean;
}

export class WebGPURenderer implements Renderer {
  readonly backend = 'webgpu' as const;
  private readonly idleStats = new FrameStats();

  get stats(): RenderStats {
    return this.meshPipeline?.stats ?? this.idleStats;
  }
  readonly capabilities = {
    threeD: true,
    compute: true,
    customShaders: true,
    storageBuffers: true,
    instancing: true,
    maxTextureSize: 0,
  };
  private canvas: HTMLCanvasElement | undefined;
  private context: GPUCanvasContext | undefined;
  private device: GPUDevice | undefined;
  private pipeline: GPURenderPipeline | undefined;
  private render2D: WebGPURender2D | undefined;
  private effectsPipeline: WebGPU2DEffects | undefined;
  private captureOutput: GPUColorTarget | undefined;
  private meshPipeline: WebGPUMeshPipeline | undefined;
  private readonly commands = new RenderCommandBuffer2D();
  private readonly textures = new Map<
    Exclude<Texture2DSource, RenderTexture2D>,
    CachedTexture
  >();
  private textureFrame = 0;
  private encoder: GPUCommandEncoder | undefined;
  private readonly colorAttachment: Omit<
    GPURenderPassColorAttachment,
    'view'
  > & { view?: GPUTextureView } = {
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: defaults.clearColor,
  };
  private readonly renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [this.colorAttachment as GPURenderPassColorAttachment],
  };
  private readonly submissions: GPUCommandBuffer[] = [];
  private viewportX = 0;
  private viewportY = 0;
  private viewportSide = 1;
  private frameRendered = false;
  private configured = false;
  private initializing = false;
  private destroyed = false;
  private lostError: WebGPUDeviceLostError | undefined;

  private readonly render2DHooks: WebGPURender2DHooks = {
    owner: this,
    upload: (source) => {
      const entry = this.cacheTexture(this.requireDevice(), source);
      entry.seen = this.textureFrame;
      return entry.resource;
    },
    assertIdle: () => {
      this.requireDevice();
      if (this.encoder)
        throw new GraphicsError(
          'WebGPU offscreen APIs cannot run during an active frame.',
        );
    },
    assertAlive: () => {
      this.requireDevice();
    },
  };

  constructor(
    private readonly onError: (error: Error) => void,
    private readonly antialias = true,
  ) {}

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.destroyed || this.device || this.initializing) {
      throw new GraphicsError(
        'WebGPU renderer cannot be initialized more than once.',
      );
    }
    this.initializing = true;

    try {
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        throw new WebGPUNotSupportedError(
          'WebGPU is unavailable: this browser or security context does not expose navigator.gpu.',
        );
      }
      const adapter = await navigator.gpu.requestAdapter();
      if (this.destroyed)
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      if (!adapter) {
        throw new WebGPUNotSupportedError(
          'WebGPU is unavailable: the browser could not provide a GPU adapter.',
        );
      }
      const device = await adapter.requestDevice();
      if (this.destroyed) {
        device.destroy();
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      }
      this.device = device;
      this.capabilities.maxTextureSize = device.limits.maxTextureDimension2D;
      // Install this before any asynchronous shader validation, so initialization-time loss is detected.
      void device.lost.then((info) => {
        if (this.destroyed) return;
        const error = new WebGPUDeviceLostError(
          `WebGPU device lost (${info.reason}): ${info.message || 'the GPU or driver became unavailable'}.`,
        );
        const wasInitialized = this.pipeline !== undefined;
        this.lostError = error;
        this.releaseResources();
        if (wasInitialized) this.onError(error);
      });
      device.addEventListener(
        'uncapturederror',
        (event: GPUUncapturedErrorEvent) => {
          if (!this.destroyed)
            this.onError(
              new GraphicsError(
                `WebGPU uncaptured error: ${event.error.message}`,
                { cause: event.error },
              ),
            );
        },
      );

      const context = canvas.getContext('webgpu');
      if (!context) {
        throw new WebGPUInitializationError(
          'WebGPU canvas context is unavailable: canvas.getContext("webgpu") returned null.',
        );
      }
      this.context = context;
      this.canvas = canvas;
      this.resize(Math.max(canvas.width, 1), Math.max(canvas.height, 1));
      const format = navigator.gpu.getPreferredCanvasFormat();

      device.pushErrorScope('validation');
      let shaderErrors: string[] = [];
      let pipeline: GPURenderPipeline | undefined;
      let meshPipeline: WebGPUMeshPipeline | undefined;
      let validationError: GPUError | null = null;
      try {
        context.configure({ device, format, alphaMode: 'opaque' });
        this.configured = true;
        const shader = device.createShaderModule({ code: triangleShader });
        const compilation = await shader.getCompilationInfo();
        if (this.destroyed)
          throw new GraphicsError(
            'WebGPU renderer was destroyed during initialization.',
          );
        shaderErrors = compilation.messages
          .filter((message) => message.type === 'error')
          .map(
            (message) =>
              `${message.lineNum}:${message.linePos} ${message.message}`,
          );
        if (shaderErrors.length === 0) {
          pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: shader, entryPoint: 'vertexMain' },
            fragment: {
              module: shader,
              entryPoint: 'fragmentMain',
              targets: [{ format }],
            },
            primitive: { topology: 'triangle-list' },
          });
          const effectsPipeline = new WebGPU2DEffects(
            device,
            format,
            () => this.destroyed || !!this.lostError,
          );
          this.effectsPipeline = effectsPipeline;
          await effectsPipeline.initialize();
          this.render2D = await WebGPURender2D.create(
            device,
            effectsPipeline,
            this.render2DHooks,
          );
          meshPipeline = await WebGPUMeshPipeline.initialize(
            device,
            format,
            () => this.destroyed,
            this.antialias ? 4 : 1,
          );
        }
      } finally {
        validationError = await device.popErrorScope();
      }
      if (this.destroyed)
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      if (shaderErrors.length) {
        throw new WebGPUInitializationError(
          `WebGPU shader compilation failed: ${shaderErrors.join('; ')}`,
        );
      }
      if (validationError) {
        throw new WebGPUInitializationError(
          `WebGPU canvas/shader/pipeline validation failed: ${validationError.message}`,
          { cause: validationError },
        );
      }
      if (this.lostError) throw this.lostError;
      this.pipeline = pipeline;
      this.meshPipeline = meshPipeline;
    } catch (error) {
      const destroyed = this.destroyed;
      this.destroy();
      if (destroyed && !(error instanceof GraphicsError))
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
          { cause: error },
        );
      if (error instanceof GraphicsError) throw error;
      throw new WebGPUInitializationError(
        `WebGPU initialization failed while requesting a device or configuring the canvas and triangle pipeline${error instanceof Error ? `: ${error.message}` : '.'}`,
        { cause: error },
      );
    } finally {
      this.initializing = false;
    }
  }

  async prepareMaterial(material: Material2D): Promise<void> {
    this.requireDevice();
    if (!(material instanceof Material2D))
      throw new GraphicsError('WebGPU prepareMaterial requires a Material2D.');
    await this.effectsPipeline!.prepare(material);
  }

  async preparePostProcessor(effect: PostProcessor2D): Promise<void> {
    this.requireDevice();
    if (!(effect instanceof PostProcessor2D))
      throw new GraphicsError(
        'WebGPU preparePostProcessor requires a PostProcessor2D.',
      );
    await this.effectsPipeline!.prepare(effect);
  }

  createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D {
    this.requireDevice();
    return this.render2D!.createRenderTexture(options);
  }

  async renderToTexture(
    target: RenderTexture2D,
    content: Scene | IsolatedGroup2D,
    options?: { clear?: boolean; bounds?: Rect2D },
  ): Promise<void> {
    this.requireDevice();
    return this.render2D!.renderToTexture(target, content, options);
  }

  async extractPixels(
    target: RenderTexture2D,
    options?: { region?: Rect2D },
  ): Promise<Uint8ClampedArray> {
    this.requireDevice();
    return this.render2D!.extractPixels(target, options);
  }

  async generateTexture(
    content: Scene | IsolatedGroup2D,
    options?: { bounds?: Rect2D; resolution?: number },
  ): Promise<Texture> {
    this.requireDevice();
    return this.render2D!.generateTexture(content, options);
  }

  async prepareTextures(sources: readonly Texture2DSource[]): Promise<void> {
    const device = this.requireDevice();
    if (this.encoder)
      throw new GraphicsError(
        'Cannot prepare textures during an active frame.',
      );
    for (const source of sources) {
      if (source.kind === 'render') this.render2D!.source(source);
      else {
        const entry = this.cacheTexture(device, source);
        entry.prepared = true;
        entry.seen = this.textureFrame;
      }
    }
    await device.queue.onSubmittedWorkDone();
    this.requireDevice();
  }

  unloadTexture(source: Texture2DSource): void {
    this.requireDevice();
    if (this.encoder)
      throw new GraphicsError('Cannot unload textures during an active frame.');
    if (source.kind === 'render') {
      this.render2D!.source(source);
      throw new GraphicsError(
        'Renderer-owned render targets must be destroyed rather than unloaded.',
      );
    }
    const entry = this.textures.get(source);
    if (entry) {
      entry.resource.destroy();
      this.textures.delete(source);
    }
  }

  async captureScene(
    scene: Scene,
    width: number,
    height: number,
  ): Promise<RenderSnapshot> {
    this.requireDevice();
    if (this.encoder)
      throw new GraphicsError(
        'WebGPU captureScene cannot nest an active frame.',
      );
    const target = this.effectsPipeline!.target(
      this.canvas!.width,
      this.canvas!.height,
    );
    this.captureOutput = target;
    try {
      this.beginFrame();
      this.render(scene, width, height);
      this.endFrame();
      const snapshot = new GPUSnapshot(this.effectsPipeline!, target);
      this.effectsPipeline!.snapshots.add(snapshot);
      return snapshot;
    } catch (error) {
      this.encoder = undefined;
      target.texture.destroy();
      throw error;
    } finally {
      this.captureOutput = undefined;
    }
  }

  beginFrame(): void {
    const device = this.requireDevice();
    if (this.encoder)
      throw new GraphicsError(
        'WebGPU beginFrame called before the preceding frame ended.',
      );
    this.encoder = device.createCommandEncoder();
    this.frameRendered = false;
  }

  render(
    scene?: Scene,
    width?: number,
    height?: number,
    effects?: FrameEffects,
  ): void {
    this.requireDevice();
    const encoder = this.encoder;
    const context = this.context;
    const pipeline = this.pipeline;
    if (!encoder || !context || !pipeline || this.frameRendered)
      throw new GraphicsError(
        'WebGPU render requires an active frame and may be called only once per frame.',
      );
    const canvas = this.canvas!;
    const logicalWidth = width ?? (canvas.clientWidth || canvas.width);
    const logicalHeight = height ?? (canvas.clientHeight || canvas.height);
    if (
      !Number.isFinite(logicalWidth) ||
      !Number.isFinite(logicalHeight) ||
      logicalWidth <= 0 ||
      logicalHeight <= 0
    )
      throw new RangeError(
        'WebGPU rendering requires positive finite logical width and height.',
      );
    const native = this.effectsPipeline!;
    const transition = effects?.transition;
    if (transition?.snapshot) native.snapshot(transition.snapshot);
    const processors = scene?.effects2D;
    const processLayer = !!processors?.length;
    const chain3D = scene?.effects3D;
    const process3D = !!chain3D?.length;
    if (processLayer || process3D || transition)
      native.settings(logicalWidth, logicalHeight, transition);
    if (scene) {
      collectRenderCommands2D(
        scene,
        logicalWidth,
        logicalHeight,
        this.commands,
      );
      this.textureFrame++;
      this.render2D!.preflight(
        this.commands,
        scene,
        logicalWidth,
        logicalHeight,
        Math.max(canvas.width / logicalWidth, canvas.height / logicalHeight),
      );
    } else {
      this.commands.clear();
      this.textureFrame++;
    }
    const has2D = !!scene && (this.commands.items.length > 0 || processLayer);
    if (!has2D && !process3D) native.releaseLayers();
    if (!process3D) native.releaseScene();
    if (!transition) native.releaseFrame();
    const incoming = transition
      ? native.frame(canvas.width, canvas.height)
      : undefined;
    const presentationView = this.captureOutput
      ? undefined
      : context.getCurrentTexture().createView();
    const output =
      this.captureOutput?.view ?? incoming?.view ?? presentationView!;
    this.colorAttachment.view = output;
    try {
      let drewMeshes: boolean;
      if (process3D) {
        // Render the 3D image into a target, run the effect chain, then replace the output.
        const layers = native.layers(canvas.width, canvas.height);
        const source = native.scene3D(canvas.width, canvas.height);
        drewMeshes = this.meshPipeline!.render(
          scene,
          encoder,
          source.view,
          canvas.width,
          canvas.height,
          logicalWidth / logicalHeight,
          defaults.clearColor,
        );
        if (!drewMeshes) {
          this.colorAttachment.view = source.view;
          this.colorAttachment.loadOp = 'clear';
          encoder.beginRenderPass(this.renderPassDescriptor).end();
          this.colorAttachment.view = output;
        }
        native.composite(
          encoder,
          native.process(encoder, layers, chain3D!, source),
          output,
          true,
        );
        drewMeshes = true;
      } else
        drewMeshes = this.meshPipeline!.render(
          scene,
          encoder,
          output,
          canvas.width,
          canvas.height,
          logicalWidth / logicalHeight,
          defaults.clearColor,
        );
      if (has2D) {
        if (!drewMeshes) {
          this.colorAttachment.loadOp = 'clear';
          encoder.beginRenderPass(this.renderPassDescriptor).end();
        }
        const layers = native.layers(canvas.width, canvas.height);
        this.render2D!.draw(
          this.commands,
          scene!,
          encoder,
          layers[0],
          logicalWidth,
          logicalHeight,
        );
        native.composite(
          encoder,
          processLayer
            ? native.process(encoder, layers, processors!)
            : layers[0],
          output,
        );
      } else if (!drewMeshes || !scene) {
        this.colorAttachment.loadOp = drewMeshes ? 'load' : 'clear';
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        if (scene) {
          pass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        } else {
          pass.setViewport(
            this.viewportX,
            this.viewportY,
            this.viewportSide,
            this.viewportSide,
            0,
            1,
          );
          pass.setPipeline(pipeline);
          pass.draw(3);
        }
        pass.end();
      }
      if (transition)
        native.transition(encoder, incoming!, presentationView!, transition);
      this.frameRendered = true;
    } finally {
      this.colorAttachment.view = undefined;
      this.colorAttachment.loadOp = 'clear';
      this.colorAttachment.clearValue = defaults.clearColor;
    }
  }

  endFrame(): void {
    const device = this.requireDevice();
    if (!this.encoder || !this.frameRendered) {
      throw new GraphicsError('WebGPU endFrame requires a rendered frame.');
    }
    const commandBuffer = this.encoder.finish();
    this.encoder = undefined;
    this.submissions.push(commandBuffer);
    try {
      device.queue.submit(this.submissions);
    } finally {
      this.submissions.length = 0;
      this.render2D?.flushRetired();
      this.releaseUnusedTextures();
    }
  }

  resize(width: number, height: number): void {
    if (this.lostError) throw this.lostError;
    const canvas = this.canvas;
    const device = this.device;
    if (!canvas || !device || this.destroyed)
      throw new GraphicsError(
        'WebGPU resize requires an initialized renderer.',
      );
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 0 ||
      height < 0
    ) {
      throw new RangeError(
        'WebGPU canvas pixel width and height must be finite, nonnegative numbers.',
      );
    }
    const pixelWidth = Math.max(1, Math.round(width));
    const pixelHeight = Math.max(1, Math.round(height));
    const limit = device.limits.maxTextureDimension2D;
    if (
      !Number.isSafeInteger(pixelWidth) ||
      !Number.isSafeInteger(pixelHeight) ||
      pixelWidth > limit ||
      pixelHeight > limit
    ) {
      throw new GraphicsError(
        `WebGPU canvas backing size ${pixelWidth}×${pixelHeight} exceeds this device's maximum texture dimension of ${limit} pixels per side. Reduce the canvas size or pixel ratio.`,
      );
    }
    const changed =
      canvas.width !== pixelWidth || canvas.height !== pixelHeight;
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const side = Math.min(pixelWidth, pixelHeight);
    this.viewportX = (pixelWidth - side) / 2;
    this.viewportY = (pixelHeight - side) / 2;
    this.viewportSide = side;
    this.meshPipeline?.resize(pixelWidth, pixelHeight);
    if (changed) this.effectsPipeline?.resize();
  }

  private cacheTexture(
    device: GPUDevice,
    texture: Exclude<Texture2DSource, RenderTexture2D>,
  ): CachedTexture {
    if (texture.destroyed)
      throw new GraphicsError('Cannot upload a destroyed texture.');
    const existing = this.textures.get(texture);
    if (existing?.version === texture.version) return existing;
    const { width, height } = texture;
    const limit = device.limits.maxTextureDimension2D;
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > limit ||
      height > limit
    ) {
      throw new GraphicsError(
        `WebGPU texture size ${width}×${height} exceeds this device's maximum texture dimension of ${limit} pixels per side.`,
      );
    }
    const resource = device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    try {
      device.queue.copyExternalImageToTexture(
        { source: texture.image },
        { texture: resource, premultipliedAlpha: true },
        [width, height],
      );
    } catch (error) {
      resource.destroy();
      throw error;
    }
    existing?.resource.destroy();
    const entry: CachedTexture = existing ?? {
      resource,
      seen: this.textureFrame,
      version: texture.version,
      prepared: false,
    };
    entry.resource = resource;
    entry.version = texture.version;
    this.textures.set(texture, entry);
    return entry;
  }

  private releaseUnusedTextures(): void {
    for (const [texture, entry] of this.textures) {
      if (
        texture.destroyed ||
        (!entry.prepared && entry.seen !== this.textureFrame)
      ) {
        entry.resource.destroy();
        this.textures.delete(texture);
      }
    }
  }

  private releaseResources(): void {
    this.encoder = undefined;
    this.colorAttachment.view = undefined;
    this.submissions.length = 0;
    this.effectsPipeline?.destroy();
    this.effectsPipeline = undefined;
    this.render2D?.destroy();
    this.render2D = undefined;
    this.captureOutput = undefined;
    this.meshPipeline?.destroy();
    this.meshPipeline = undefined;
    this.commands.destroy();
    for (const entry of this.textures.values()) entry.resource.destroy();
    this.textures.clear();
    this.pipeline = undefined;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const context = this.context;
    const device = this.device;
    this.releaseResources();
    this.context = undefined;
    this.canvas = undefined;
    this.device = undefined;
    try {
      if (this.configured) context?.unconfigure();
    } finally {
      device?.destroy();
    }
  }

  private requireDevice(): GPUDevice {
    if (this.lostError) throw this.lostError;
    if (this.destroyed || !this.device || !this.pipeline) {
      throw new GraphicsError(
        'WebGPU renderer is not initialized or has already been destroyed.',
      );
    }
    return this.device;
  }
}
