import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import {
  NativeMaterial3D,
  isNativeMaterial3D,
} from '../../core/src/native-material3d.js';
import { NativePBRMaterial } from '../../core/src/native-pbr-material.js';
import { beginTimedRenderPass } from './gpu-timing.js';
import type { Scene } from '../../core/src/scene.js';
import type { Texture, Texture2DSource } from '../../assets/src/index.js';
import { NativeTexture2D } from '../../assets/src/native-texture.js';
import type { NativeTextureFormat } from '../../assets/src/native-texture.js';
import {
  compressionFeatures,
  nativeUploadFormat,
  uploadNativeWebGPU,
  validateNativeWebGPU,
  webgpuTextureFormats,
} from './native-texture-upload.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import type { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type {
  RenderTexture2D,
  RenderTextureOptions2D,
} from './render-texture2d.js';
import { WebGPURender2D, type WebGPURender2DHooks } from './webgpu-render2d.js';
import { defaults } from '../../../src/data/defaults.js';
import { materialQuality } from '../../../src/data/rendering.js';
import {
  GraphicsError,
  WebGPUInitializationError,
  WebGPUDeviceLostError,
  WebGPUNotSupportedError,
} from './errors.js';
import type { AlphaToCoverageCapabilities, Renderer } from './index.js';
import { WebGPUMeshPipeline } from './webgpu-mesh-pipeline.js';
import {
  FrameStats,
  type RenderStats,
  type GpuTimingOptions,
} from './render-stats.js';
import { configureGpuTiming, WebGpuTimer } from './gpu-timing.js';
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
import type { Geometry } from '../../core/src/geometry.js';
import { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import { NativeResidency } from './residency.js';
import type {
  ResidencyAllocation,
  ResidencyBudgetOptions,
} from './residency.js';
import { prepareNativeResource, residencyLease } from './preparation.js';
import type {
  PreparationResource,
  PreparedResourceLease,
  ResourcePreparationOptions,
} from './preparation.js';
import type {
  ReflectionProbe,
  ReflectionProbeCaptureOptions,
} from '../../core/src/reflection-probe.js';
import type { EnvironmentMap } from '../../core/src/environment.js';
import { ProbeCaptureScheduler } from './reflection-capture.js';
import { WebGPUCompute } from './webgpu-compute.js';
import { WebGPURenderGraph } from './webgpu-render-graph.js';
import type {
  ComputeArray,
  ComputeBuffer,
  ComputeProgram,
  ComputeDispatchOptions,
  ComputeReadOptions,
  ComputePreparationOptions,
} from './compute.js';
import type {
  RenderGraph,
  RenderGraphPreparationOptions,
} from './render-graph.js';

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
  allocation: ResidencyAllocation;
  resource: GPUTexture;
  width: number;
  height: number;
  seen: number;
  version: number;
  prepared: boolean;
}

export class WebGPURenderer implements Renderer {
  readonly backend = 'webgpu' as const;
  private readonly frameStats = new FrameStats();
  private readonly gpuTimingEnabled: boolean;
  private gpuTimer: WebGpuTimer | undefined;
  readonly residency = new NativeResidency();
  private readonly preparedGeometry = new Set<ResidencyAllocation>();
  private readonly probeCaptures = new ProbeCaptureScheduler();
  private probeCaptureActive = false;
  private compute: WebGPUCompute | undefined;
  private graphs: WebGPURenderGraph | undefined;
  async prepareCompute(
    program: ComputeProgram,
    options?: ComputePreparationOptions,
  ): Promise<void> {
    this.requireDevice();
    return this.compute!.prepare(program, options);
  }
  uploadCompute(
    buffer: ComputeBuffer,
    data: ComputeArray,
    offset?: number,
  ): void {
    this.requireDevice();
    this.compute!.upload(buffer, data, offset);
  }
  async dispatchCompute(
    program: ComputeProgram,
    options: ComputeDispatchOptions,
  ): Promise<void> {
    this.requireDevice();
    return this.compute!.dispatch(program, options);
  }
  async readCompute(
    buffer: ComputeBuffer,
    options?: ComputeReadOptions,
  ): Promise<ComputeArray> {
    this.requireDevice();
    return this.compute!.read(buffer, options);
  }
  async prepareRenderGraph(
    graph: RenderGraph,
    options?: RenderGraphPreparationOptions,
  ): Promise<void> {
    this.requireDevice();
    return this.graphs!.prepare(graph, options);
  }
  async captureReflectionProbe(
    scene: Scene,
    probe: ReflectionProbe,
    options: ReflectionProbeCaptureOptions = {},
  ): Promise<EnvironmentMap> {
    this.requireDevice();
    if (this.probeCaptureActive || (this.encoder && this.frameRendered))
      throw new GraphicsError(
        'Capture requires an idle capture slot and must precede rendering or follow endFrame.',
      );
    this.probeCaptureActive = true;
    try {
      const map = await this.meshPipeline!.captureReflectionProbe(
        scene,
        probe,
        options,
      );
      try {
        this.requireDevice();
        return map;
      } catch (error) {
        map.destroy();
        throw error;
      }
    } finally {
      this.probeCaptureActive = false;
    }
  }
  configureResidency(options: ResidencyBudgetOptions): void {
    if (this.encoder)
      throw new GraphicsError(
        'Cannot change residency budgets during an active frame.',
      );
    this.residency.configure(options);
  }
  retainFrameResources(): PreparedResourceLease {
    this.requireDevice();
    return residencyLease(this.residency.retainFrameResources());
  }
  async prepareGeometry(source: Geometry | Geometry2D): Promise<void> {
    const device = this.requireDevice();
    if (this.encoder)
      throw new GraphicsError(
        'Cannot prepare geometry during an active frame.',
      );
    const allocation =
      source instanceof Geometry2D
        ? this.render2D!.prepareGeometry(source)
        : this.meshPipeline!.prepareGeometry(source);
    if (!this.preparedGeometry.has(allocation)) {
      allocation.retain();
      this.preparedGeometry.add(allocation);
    }
    await device.queue.onSubmittedWorkDone();
    this.requireDevice();
  }
  unloadGeometry(source: Geometry | Geometry2D): void {
    this.requireDevice();
    if (this.encoder)
      throw new GraphicsError('Cannot unload geometry during an active frame.');
    if (source instanceof Geometry2D) this.render2D!.unloadGeometry(source);
    else this.meshPipeline!.unloadGeometry(source);
    for (const allocation of this.preparedGeometry)
      if (allocation.destroyed) this.preparedGeometry.delete(allocation);
  }
  async prepareResource(
    source: PreparationResource,
    options?: ResourcePreparationOptions,
  ): Promise<PreparedResourceLease> {
    const device = this.requireDevice();
    if (this.encoder)
      throw new GraphicsError(
        'Cannot prepare resources during an active frame.',
      );
    return prepareNativeResource(
      this.residency,
      source,
      {
        texture: (texture) => {
          if (texture.kind === 'render') this.render2D!.source(texture);
          else this.cacheTexture(device, texture);
        },
        geometry: (geometry) => {
          if (geometry instanceof Geometry2D)
            this.render2D!.prepareGeometry(geometry);
          else this.meshPipeline!.prepareGeometry(geometry);
        },
        mesh: (mesh) => this.meshPipeline!.prepareMesh(mesh),
        particles: (layer) => {
          this.render2D!.prepareParticles(layer);
          for (let i = 0; i < layer.activeCount; i++) {
            const source = layer.getSlot(layer.activeSlotAt(i)).texture;
            if (source.kind === 'render') this.render2D!.source(source);
            else this.cacheTexture(device, source);
          }
        },
        environment: (map) => this.meshPipeline!.prepareEnvironment(map),
        material: (material) => this.prepareMaterial(material),
        gpuParticles: (emitter) => this.prepareGpuParticles(emitter),
        post: (post) => this.preparePostProcessor(post),
        complete: async () => {
          await device.queue.onSubmittedWorkDone();
          this.requireDevice();
        },
      },
      options,
    );
  }

  get stats(): RenderStats {
    return this.frameStats;
  }
  readonly capabilities = {
    threeD: true,
    compute: true,
    customShaders: true,
    lighting2D: true,
    storageBuffers: true,
    instancing: true,
    textureAnisotropy: Object.freeze({ maxRequest: 16, maxEffective: null }),
    alphaToCoverage: undefined as
      Readonly<AlphaToCoverageCapabilities> | undefined,
    maxTextureSize: 0,
    supportedTextureFormats: [] as readonly NativeTextureFormat[],
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
    residency: this.residency,
    get stats(): FrameStats {
      return (this.owner as WebGPURenderer).frameStats;
    },
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
    gpuTiming: GpuTimingOptions = {},
  ) {
    const samples = antialias ? materialQuality.samples : 1;
    this.capabilities.alphaToCoverage = Object.freeze({
      rgba8Samples: samples,
      hdrSamples: samples,
    });
    this.gpuTimingEnabled = configureGpuTiming(
      this.frameStats.gpuTiming,
      gpuTiming,
    );
  }

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
      const requiredFeatures = compressionFeatures.filter((feature) =>
        adapter.features.has(feature),
      );
      if (this.gpuTimingEnabled) {
        if (adapter.features.has('timestamp-query'))
          requiredFeatures.push('timestamp-query');
        else
          this.frameStats.gpuTiming.unavailable(
            'unsupported',
            'WebGPU adapter does not expose timestamp-query.',
          );
      }
      const device = await adapter.requestDevice({ requiredFeatures });
      if (this.destroyed) {
        device.destroy();
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      }
      this.device = device;
      if (this.gpuTimingEnabled && device.features.has('timestamp-query'))
        this.gpuTimer = new WebGpuTimer(this.frameStats.gpuTiming, device);
      this.capabilities.maxTextureSize = device.limits.maxTextureDimension2D;
      this.capabilities.supportedTextureFormats = webgpuTextureFormats(device);
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
      this.compute = new WebGPUCompute(device);
      this.graphs = new WebGPURenderGraph(device, format);

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
            () => this.frameStats,
            () => !!this.encoder,
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
            this.antialias ? materialQuality.samples : 1,
            this.frameStats,
            this.residency,
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

  async prepareMaterial(
    material: Material2D | NativeMaterial3D | NativePBRMaterial,
  ): Promise<void> {
    this.requireDevice();
    if (isNativeMaterial3D(material)) {
      await this.meshPipeline!.prepareMaterial(material);
      return;
    }
    if (!(material instanceof Material2D))
      throw new GraphicsError(
        'WebGPU prepareMaterial requires a Material2D or native 3D material.',
      );
    await this.effectsPipeline!.prepare(material);
  }
  async prepareGpuParticles(emitter: GPUParticleEmitter3D): Promise<void> {
    this.requireDevice();
    this.meshPipeline!.prepareGpuParticles(emitter);
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
    this.render2DHooks.assertIdle();
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
    this.render2DHooks.assertIdle();
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
        if (!entry.prepared) entry.allocation.retain();
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
      entry.allocation.destroy();
    }
    this.meshPipeline!.unloadTexture(source);
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
      this.endFrame(false);
      const snapshot = new GPUSnapshot(this.effectsPipeline!, target);
      this.effectsPipeline!.snapshots.add(snapshot);
      return snapshot;
    } catch (error) {
      this.gpuTimer?.abort();
      this.encoder = undefined;
      this.residency.abortFrame();
      this.effectsPipeline!.destroyTexture(target.texture);
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
    this.residency.beginFrame();
    this.frameStats.begin();
    this.gpuTimer?.begin(this.encoder, this.frameStats.frame);
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
    if (scene?.has3DContent)
      this.probeCaptures.schedule(
        scene,
        (probe) => this.captureReflectionProbe(scene, probe),
        (error) =>
          this.onError(
            error instanceof GraphicsError
              ? error
              : new GraphicsError('Automatic reflection capture failed.', {
                  cause: error,
                }),
          ),
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
    const graphDestination =
      this.captureOutput?.view ?? incoming?.view ?? presentationView!;
    const graph = scene?.renderGraph;
    const output = graph
      ? this.graphs!.sceneTarget(graph, canvas.width, canvas.height)
      : graphDestination;
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
          logicalHeight,
        );
        if (!drewMeshes) {
          this.colorAttachment.view = source.view;
          this.colorAttachment.loadOp = 'clear';
          beginTimedRenderPass(encoder, this.renderPassDescriptor).end();
          this.frameStats.pass2D();
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
          logicalHeight,
        );
      if (has2D) {
        if (!drewMeshes) {
          this.colorAttachment.loadOp = 'clear';
          beginTimedRenderPass(encoder, this.renderPassDescriptor).end();
          this.frameStats.pass2D();
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
        const pass = beginTimedRenderPass(encoder, this.renderPassDescriptor);
        this.frameStats.pass2D();
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
          this.frameStats.draw2D();
        }
        pass.end();
      }
      if (graph) this.graphs!.encode(graph, encoder, graphDestination);
      if (transition)
        native.transition(encoder, incoming!, presentationView!, transition);
      this.frameRendered = true;
    } finally {
      if (!this.frameRendered) this.meshPipeline!.invalidateTemporalHistory();
      this.colorAttachment.view = undefined;
      this.colorAttachment.loadOp = 'clear';
      this.colorAttachment.clearValue = defaults.clearColor;
    }
  }

  endFrame(publishFrame = true): void {
    const device = this.requireDevice();
    if (!this.encoder || !this.frameRendered) {
      throw new GraphicsError('WebGPU endFrame requires a rendered frame.');
    }
    this.gpuTimer?.end(this.encoder);
    const commandBuffer = this.encoder.finish();
    this.encoder = undefined;
    this.submissions.push(commandBuffer);
    let submitted = false;
    try {
      device.queue.submit(this.submissions);
      this.meshPipeline?.afterSubmit();
      submitted = true;
      this.gpuTimer?.submitted();
    } finally {
      this.submissions.length = 0;
      if (!submitted) this.gpuTimer?.abort();
      this.render2D?.flushRetired();
      this.releaseUnusedTextures();
      if (submitted && publishFrame) this.residency.endFrame();
      else this.residency.abortFrame();
      this.frameStats.submit();
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
    if (existing?.version === texture.version) {
      existing.allocation.touch();
      return existing;
    }
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
    const native = texture instanceof NativeTexture2D;
    if (native) validateNativeWebGPU(device, texture);
    const bytes = native ? texture.byteLength : width * height * 4;
    const allocation =
      existing?.allocation ??
      this.residency.textures.allocate(bytes, () => {
        this.textures.get(texture)?.resource.destroy();
        this.textures.delete(texture);
      });
    if (existing) allocation.resize(bytes);
    const reuse =
      !!existing && existing.width === width && existing.height === height;
    let resource: GPUTexture | undefined;
    try {
      if (existing && !reuse) existing.resource.destroy();
      resource = reuse
        ? existing!.resource
        : device.createTexture({
            size: [width, height],
            mipLevelCount: native ? texture.levels.length : 1,
            format: native ? nativeUploadFormat(texture.format) : 'rgba8unorm',
            usage:
              GPUTextureUsage.TEXTURE_BINDING |
              GPUTextureUsage.COPY_DST |
              (native ? 0 : GPUTextureUsage.RENDER_ATTACHMENT),
          });
      if (native) uploadNativeWebGPU(device, resource, texture);
      else
        device.queue.copyExternalImageToTexture(
          { source: texture.image },
          { texture: resource, premultipliedAlpha: true },
          [width, height],
        );
      this.frameStats.upload(bytes);
    } catch (error) {
      if (!reuse) {
        resource?.destroy();
        allocation.destroy();
      }
      throw error;
    }
    const entry: CachedTexture = existing ?? {
      resource,
      allocation,
      width,
      height,
      seen: this.textureFrame,
      version: texture.version,
      prepared: false,
    };
    entry.resource = resource;
    entry.width = width;
    entry.height = height;
    entry.version = texture.version;
    this.textures.set(texture, entry);
    return entry;
  }

  private releaseUnusedTextures(): void {
    for (const [texture, entry] of this.textures)
      if (
        texture.destroyed ||
        (this.residency.textures.budgetBytes === Infinity &&
          !entry.allocation.references &&
          entry.seen !== this.textureFrame)
      )
        entry.allocation.destroy();
  }

  private releaseResources(): void {
    this.compute?.destroy();
    this.compute = undefined;
    this.graphs?.destroy();
    this.graphs = undefined;
    this.gpuTimer?.destroy(!!this.lostError);
    this.gpuTimer = undefined;
    this.encoder = undefined;
    this.colorAttachment.view = undefined;
    this.submissions.length = 0;
    this.residency.clear();
    this.preparedGeometry.clear();
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
