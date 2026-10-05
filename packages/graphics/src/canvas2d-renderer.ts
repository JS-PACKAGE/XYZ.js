import type { Scene } from '../../core/src/scene.js';
import { Mesh } from '../../core/src/mesh.js';
import type {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/material2d.js';
import { NativeMaterial3D } from '../../core/src/native-material3d.js';
import { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import { defaults } from '../../../src/data/defaults.js';
import {
  Canvas2DInitializationError,
  GraphicsBackendUnavailableError,
  GraphicsError,
  UnsupportedGraphicsError,
} from './errors.js';
import type { GraphicsCapabilities, Renderer } from './index.js';
import {
  collectRenderCommands2D,
  RenderCommandBuffer2D,
  type FrameEffects,
  type RenderSnapshot,
  type TransitionFrame,
} from './render2d-contract.js';
import { CanvasSpriteSource } from './canvas-sprite-source.js';
import type { Texture, Texture2DSource } from '../../assets/src/index.js';
import { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import { CanvasRender2D } from './canvas-render2d.js';
import {
  FrameStats,
  type RenderStats,
  type GpuTimingOptions,
} from './render-stats.js';
import { configureGpuTiming } from './gpu-timing.js';
import {
  RenderTexture2D,
  assertRenderTextureOwner2D,
  type RenderTextureOptions2D,
} from './render-texture2d.js';
import { CanvasRender2DTargets } from './canvas-render2d-targets.js';
import { Geometry } from '../../core/src/geometry.js';
import { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import { EnvironmentMap } from '../../core/src/environment.js';
import {
  Material2D as NativeMaterial,
  PostProcessor2D as NativePost,
} from '../../core/src/materials2d/material2d.js';
import { NativeResidency } from './residency.js';
import type { ResidencyBudgetOptions } from './residency.js';
import { residencyLease } from './preparation.js';
import type {
  PreparationResource,
  PreparedResourceLease,
  ResourcePreparationOptions,
} from './preparation.js';
import { ParticleLayer2D } from '../../core/src/particles2d/particle-layer2d.js';
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
import type {
  ReflectionProbe,
  ReflectionProbeCaptureOptions,
} from '../../core/src/reflection-probe.js';

const MAX_SIZE = 8192;
const background = defaults.clearColor;
const backgroundStyle = `rgba(${Math.round(background.r * 255)}, ${Math.round(background.g * 255)}, ${Math.round(background.b * 255)}, ${background.a})`;

/** Sprite-only fallback; visible 3D meshes are deliberately unsupported. */
export class Canvas2DRenderer implements Renderer {
  readonly backend = 'canvas2d' as const;
  private readonly frameStats = new FrameStats();
  readonly stats: RenderStats = this.frameStats;
  readonly residency = new NativeResidency();
  configureResidency(options: ResidencyBudgetOptions): void {
    // There are no native GPU cache allocations on Canvas; CPU source caches are separate.
    this.residency.configure(options);
  }
  retainFrameResources(): PreparedResourceLease {
    this.requireIdle();
    return residencyLease([]);
  }
  async prepareGeometry(_source: Geometry | Geometry2D): Promise<void> {
    void _source;
    throw new UnsupportedGraphicsError(
      'Canvas2D does not support native geometry preparation.',
    );
  }
  unloadGeometry(_source: Geometry | Geometry2D): void {
    void _source;
    throw new UnsupportedGraphicsError(
      'Canvas2D does not support native geometry residency.',
    );
  }
  async prepareResource(
    source: PreparationResource,
    options: ResourcePreparationOptions = {},
  ): Promise<PreparedResourceLease> {
    options.signal?.throwIfAborted();
    if (source instanceof ParticleLayer2D) {
      this.requireIdle();
      if (source.destroyed)
        throw new GraphicsError('Cannot prepare a destroyed ParticleLayer2D.');
      for (let i = 0; i < source.activeCount; i++)
        this.spriteSource.prepare(
          source.getSlot(source.activeSlotAt(i)).texture,
        );
      options.signal?.throwIfAborted();
      return residencyLease([]);
    }
    if (
      source instanceof Geometry ||
      source instanceof Geometry2D ||
      source instanceof Mesh ||
      source instanceof GPUParticleEmitter3D ||
      source instanceof EnvironmentMap
    )
      throw new UnsupportedGraphicsError(
        'Canvas2D does not support native 3D or mesh preparation.',
      );
    if (source instanceof NativePost) await this.preparePostProcessor(source);
    else if (
      source instanceof NativeMaterial ||
      source instanceof NativeMaterial3D
    )
      await this.prepareMaterial(source);
    else await this.prepareTextures([source]);
    options.signal?.throwIfAborted();
    return residencyLease([]);
  }
  prepareGpuParticles(emitter: GPUParticleEmitter3D): Promise<void>;
  async prepareGpuParticles(): Promise<void> {
    this.requireIdle();
    throw new UnsupportedGraphicsError(
      'Canvas2D does not support GPU 3D particles.',
    );
  }
  prepareCompute(
    program: ComputeProgram,
    options?: ComputePreparationOptions,
  ): Promise<void>;
  async prepareCompute(): Promise<void> {
    throw new UnsupportedGraphicsError('Canvas2D does not support compute.');
  }
  uploadCompute(
    buffer: ComputeBuffer,
    data: ComputeArray,
    offset?: number,
  ): void;
  uploadCompute(): void {
    throw new UnsupportedGraphicsError('Canvas2D does not support compute.');
  }
  dispatchCompute(
    program: ComputeProgram,
    options: ComputeDispatchOptions,
  ): Promise<void>;
  async dispatchCompute(): Promise<void> {
    throw new UnsupportedGraphicsError('Canvas2D does not support compute.');
  }
  readCompute(
    buffer: ComputeBuffer,
    options?: ComputeReadOptions,
  ): Promise<ComputeArray>;
  async readCompute(): Promise<ComputeArray> {
    throw new UnsupportedGraphicsError('Canvas2D does not support compute.');
  }
  prepareRenderGraph(
    graph: RenderGraph,
    options?: RenderGraphPreparationOptions,
  ): Promise<void>;
  async prepareRenderGraph(): Promise<void> {
    throw new UnsupportedGraphicsError(
      'Canvas2D does not support render graphs.',
    );
  }
  captureReflectionProbe(
    scene: Scene,
    probe: ReflectionProbe,
    options?: ReflectionProbeCaptureOptions,
  ): Promise<EnvironmentMap>;
  async captureReflectionProbe(): Promise<EnvironmentMap> {
    throw new UnsupportedGraphicsError(
      'Canvas2D does not support reflection capture.',
    );
  }
  readonly capabilities: GraphicsCapabilities = Object.freeze({
    threeD: false,
    compute: false,
    customShaders: false,
    storageBuffers: false,
    instancing: false,
    lighting2D: false,
    textureAnisotropy: Object.freeze({ maxRequest: 16, maxEffective: 1 }),
    alphaToCoverage: Object.freeze({ rgba8Samples: 1, hdrSamples: 1 }),
    maxTextureSize: MAX_SIZE,
    supportedTextureFormats: Object.freeze([]),
  });
  private canvas: HTMLCanvasElement | undefined;
  private context: CanvasRenderingContext2D | undefined;
  private readonly commands = new RenderCommandBuffer2D();
  private readonly spriteSource: CanvasSpriteSource = new CanvasSpriteSource(
    (source): CanvasImageSource => {
      assertRenderTextureOwner2D(source as RenderTexture2D, this);
      return this.targetOperations.canvases.get(source as RenderTexture2D)!;
    },
  );
  private readonly render2D: CanvasRender2D = new CanvasRender2D(
    this.spriteSource,
    this.frameStats,
  );
  private readonly targetOperations: CanvasRender2DTargets =
    new CanvasRender2DTargets(
      this,
      () => this.requireIdle(),
      this.render2D,
      () => !this.destroyed,
    );
  private layerCanvas: HTMLCanvasElement | undefined;
  private readonly snapshots = new Set<CanvasRenderSnapshot>();
  private transitionCanvas: HTMLCanvasElement | undefined;
  private transitionContext: CanvasRenderingContext2D | undefined;
  private frameActive = false;
  private frameRendered = false;
  private destroyed = false;

  private readonly onContextLost = (): void => {
    if (this.destroyed) return;
    this.destroy();
    this.onError(new GraphicsError('Canvas2D rendering context was lost.'));
  };

  constructor(
    private readonly onError: (error: Error) => void,
    gpuTiming: GpuTimingOptions = {},
  ) {
    if (configureGpuTiming(this.frameStats.gpuTiming, gpuTiming))
      this.frameStats.gpuTiming.unavailable(
        'unsupported',
        'Canvas2D exposes no GPU timer queries.',
      );
  }

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.destroyed || this.context)
      throw new GraphicsError(
        'Canvas2D renderer cannot be initialized more than once.',
      );
    const context = canvas.getContext('2d');
    if (!context)
      throw new Canvas2DInitializationError(
        'Canvas2D canvas context is unavailable.',
      );
    this.canvas = canvas;
    this.context = context;
    try {
      this.resize(Math.max(canvas.width, 1), Math.max(canvas.height, 1));
      canvas.addEventListener('contextlost', this.onContextLost);
    } catch (error) {
      this.canvas = undefined;
      this.context = undefined;
      throw error;
    }
  }

  beginFrame(): void {
    this.requireContext();
    if (this.frameActive)
      throw new GraphicsError(
        'Canvas2D beginFrame called before the preceding frame ended.',
      );
    this.frameActive = true;
    this.frameRendered = false;
    this.frameStats.begin();
  }

  async prepareMaterial(
    _material: Material2D | NativeMaterial3D,
  ): Promise<void> {
    void _material;
    this.requireContext();
    throw new UnsupportedGraphicsError(
      'Canvas2D does not support native 2D or 3D materials.',
    );
  }

  async preparePostProcessor(_effect: PostProcessor2D): Promise<void> {
    void _effect;
    this.requireContext();
    throw new UnsupportedGraphicsError(
      'Canvas2D does not support native 2D post processors.',
    );
  }

  createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D {
    return this.targetOperations.create(options);
  }
  renderToTexture(
    target: RenderTexture2D,
    content: Scene | IsolatedGroup2D,
    options?: { clear?: boolean; bounds?: Rect2D },
  ): Promise<void> {
    return this.targetOperations.render(target, content, options);
  }
  extractPixels(
    target: RenderTexture2D,
    options?: { region?: Rect2D },
  ): Promise<Uint8ClampedArray> {
    return this.targetOperations.extract(target, options);
  }
  generateTexture(
    content: Scene | IsolatedGroup2D,
    options?: { bounds?: Rect2D; resolution?: number },
  ): Promise<Texture> {
    return this.targetOperations.generate(content, options);
  }
  async prepareTextures(sources: readonly Texture2DSource[]): Promise<void> {
    this.requireIdle();
    for (const source of sources) this.spriteSource.prepare(source);
  }
  unloadTexture(source: Texture2DSource): void {
    this.requireIdle();
    if (source.kind === 'render') assertRenderTextureOwner2D(source, this);
    else this.spriteSource.unload(source);
  }
  private requireIdle(): void {
    this.requireContext();
    if (this.frameActive)
      throw new GraphicsError(
        'Canvas2D target operation cannot run during an active frame.',
      );
  }

  async captureScene(
    scene: Scene,
    width: number,
    height: number,
  ): Promise<RenderSnapshot> {
    this.requireContext();
    if (this.frameActive)
      throw new GraphicsError(
        'Canvas2D captureScene cannot run during an active frame.',
      );
    this.frameActive = true;
    let capture: HTMLCanvasElement | undefined;
    try {
      this.prepareScene(scene, width, height);
      capture = document.createElement('canvas');
      this.render2D.resizeCanvas(
        capture,
        this.canvas!.width,
        this.canvas!.height,
      );
      const context = capture.getContext('2d');
      if (!context)
        throw new Canvas2DInitializationError(
          'Canvas2D capture context is unavailable.',
        );
      // This redraw finishes before the Promise yields; it never reads a presented frame.
      this.drawFrame(
        context,
        capture.width,
        capture.height,
        scene,
        width,
        height,
      );
      const snapshot = new CanvasRenderSnapshot(
        this,
        capture,
        this.snapshots,
        this.render2D,
      );
      this.snapshots.add(snapshot);
      return snapshot;
    } catch (error) {
      if (capture) this.render2D.releaseCanvas(capture);
      throw error;
    } finally {
      this.commands.clear();
      this.frameActive = false;
    }
  }

  render(
    scene?: Scene,
    width?: number,
    height?: number,
    effects?: FrameEffects,
  ): void {
    const context = this.requireContext();
    if (!this.frameActive || this.frameRendered)
      throw new GraphicsError(
        'Canvas2D render requires an active frame and may be called only once per frame.',
      );
    const canvas = this.canvas!;
    const logicalWidth = width ?? (canvas.clientWidth || canvas.width);
    const logicalHeight = height ?? (canvas.clientHeight || canvas.height);
    const transition = effects?.transition;
    if (transition) this.validateTransition(transition);
    this.prepareScene(scene, logicalWidth, logicalHeight);
    if (transition) {
      const target = this.requireTransitionContext();
      this.drawFrame(
        target,
        canvas.width,
        canvas.height,
        scene,
        logicalWidth,
        logicalHeight,
      );
      this.composeTransition(context, transition);
    } else {
      this.releaseTransitionTarget();
      this.drawFrame(
        context,
        canvas.width,
        canvas.height,
        scene,
        logicalWidth,
        logicalHeight,
      );
    }
    this.frameRendered = true;
  }

  private prepareScene(
    scene: Scene | undefined,
    width: number,
    height: number,
  ): void {
    const commands = this.commands;
    commands.clear();
    if (!scene) return;
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      throw new RangeError(
        'Canvas2D sprite rendering requires positive finite logical width and height.',
      );
    if (scene.renderGraph)
      throw new UnsupportedGraphicsError(
        'Canvas2D does not support render graphs.',
      );
    if (scene.effects2D.length || scene.effects3D.length)
      throw new UnsupportedGraphicsError(
        'Canvas2D does not support native 2D post processors.',
      );
    for (const object of scene.objects) {
      if (object instanceof Mesh && object.worldVisible)
        throw new GraphicsBackendUnavailableError(
          'Canvas2D does not support visible 3D meshes.',
        );
    }
    const gpuEmitters = scene.gpuParticleEmitters;
    if (gpuEmitters)
      for (const emitter of gpuEmitters)
        if (emitter.worldVisible && emitter.activeCount > 0)
          throw new UnsupportedGraphicsError(
            'Canvas2D does not support visible GPU 3D particles.',
          );
    collectRenderCommands2D(scene, width, height, commands);
    this.render2D.preflight(commands);
  }

  private drawFrame(
    context: CanvasRenderingContext2D,
    pixelWidth: number,
    pixelHeight: number,
    scene: Scene | undefined,
    logicalWidth: number,
    logicalHeight: number,
  ): void {
    const commands = this.commands;
    this.frameStats.pass2D();
    const scaleX = pixelWidth / logicalWidth;
    const scaleY = pixelHeight / logicalHeight;
    try {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = backgroundStyle;
      context.fillRect(0, 0, pixelWidth, pixelHeight);
      this.frameStats.draw2D();
      if (scene) {
        const layer = (this.layerCanvas ??= document.createElement('canvas'));
        this.render2D.resizeCanvas(layer, pixelWidth, pixelHeight);
        const layerContext = layer.getContext('2d')!;
        layerContext.setTransform(1, 0, 0, 1, 0, 0);
        layerContext.globalAlpha = 1;
        layerContext.globalCompositeOperation = 'source-over';
        layerContext.clearRect(0, 0, pixelWidth, pixelHeight);
        this.render2D.draw(layerContext, commands, scene, scaleX, scaleY);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = 1;
        context.drawImage(layer, 0, 0);
        this.frameStats.draw2D();
      } else {
        const side = Math.min(pixelWidth, pixelHeight);
        const centerX = pixelWidth / 2;
        const centerY = pixelHeight / 2;
        // Canvas gradients approximate the WebGPU triangle's interpolated vertex colors.
        const gradient = context.createLinearGradient(
          centerX,
          centerY - side * 0.35,
          centerX,
          centerY + side * 0.3,
        );
        gradient.addColorStop(0, 'rgb(255 77 64)');
        gradient.addColorStop(1, 'rgb(70 180 190)');
        context.fillStyle = gradient;
        context.beginPath();
        context.moveTo(centerX, centerY - side * 0.35);
        context.lineTo(centerX - side * 0.35, centerY + side * 0.3);
        context.lineTo(centerX + side * 0.35, centerY + side * 0.3);
        context.closePath();
        context.fill();
        this.frameStats.draw2D();
      }
    } finally {
      commands.clear();
      this.spriteSource.endFrame();
    }
  }

  private validateTransition(transition: TransitionFrame): void {
    if (!Number.isFinite(transition.progress))
      throw new RangeError('Canvas2D transition progress must be finite.');
    const snapshot = transition.snapshot;
    if (snapshot) {
      if (!(snapshot instanceof CanvasRenderSnapshot))
        throw new GraphicsError(
          'Canvas2D transition snapshot belongs to another renderer.',
        );
      snapshot.assertOwner(this);
    }
  }

  private requireTransitionContext(): CanvasRenderingContext2D {
    if (!this.transitionCanvas) {
      const canvas = document.createElement('canvas');
      this.render2D.resizeCanvas(
        canvas,
        this.canvas!.width,
        this.canvas!.height,
      );
      const context = canvas.getContext('2d');
      if (!context) {
        this.render2D.releaseCanvas(canvas);
        throw new Canvas2DInitializationError(
          'Canvas2D transition context is unavailable.',
        );
      }
      this.transitionCanvas = canvas;
      this.transitionContext = context;
    }
    return this.transitionContext!;
  }

  private composeTransition(
    context: CanvasRenderingContext2D,
    transition: TransitionFrame,
  ): void {
    const width = this.canvas!.width;
    this.frameStats.pass2D();
    const height = this.canvas!.height;
    const progress = Math.max(0, Math.min(1, transition.progress));
    const color = transition.color;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, width, height);
    context.fillStyle = `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${color[3]})`;
    if (transition.kind === 'slide') {
      const horizontal =
        transition.direction === 'left' || transition.direction === 'right';
      const distance = horizontal ? width : height;
      const sign =
        transition.direction === 'left' || transition.direction === 'up'
          ? -1
          : 1;
      const outgoing = sign * progress * distance;
      const incoming = -sign * (1 - progress) * distance;
      const boundary = Math.round(sign < 0 ? distance + outgoing : outgoing);
      const outgoingEdge = horizontal
        ? sign < 0
          ? 'right'
          : 'left'
        : sign < 0
          ? 'down'
          : 'up';
      context.save();
      context.beginPath();
      if (horizontal)
        context.rect(
          sign < 0 ? 0 : boundary,
          0,
          sign < 0 ? boundary : width - boundary,
          height,
        );
      else
        context.rect(
          0,
          sign < 0 ? 0 : boundary,
          width,
          sign < 0 ? boundary : height - boundary,
        );
      context.clip();
      this.drawOutgoing(
        context,
        transition,
        horizontal ? outgoing : 0,
        horizontal ? 0 : outgoing,
        outgoingEdge,
      );
      context.restore();
      context.save();
      context.beginPath();
      if (horizontal)
        context.rect(
          sign < 0 ? boundary : 0,
          0,
          sign < 0 ? width - boundary : boundary,
          height,
        );
      else
        context.rect(
          0,
          sign < 0 ? boundary : 0,
          width,
          sign < 0 ? height - boundary : boundary,
        );
      context.clip();
      drawSlidingImage(
        context,
        this.transitionCanvas!,
        horizontal ? incoming : 0,
        horizontal ? 0 : incoming,
        width,
        height,
        transition.direction,
        this.frameStats,
      );
      context.restore();
    } else {
      // Add weighted premultiplied planes: source-over would darken the midpoint.
      if (transition.kind === 'crossfade') {
        context.globalAlpha = 1 - progress;
        this.drawOutgoing(context, transition, 0, 0);
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = progress;
        context.drawImage(this.transitionCanvas!, 0, 0);
        this.frameStats.draw2D();
      } else if (progress < 0.5) {
        const amount = progress * 2;
        context.globalAlpha = 1 - amount;
        this.drawOutgoing(context, transition, 0, 0);
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = amount;
        context.fillRect(0, 0, width, height);
        this.frameStats.draw2D();
      } else {
        const amount = progress * 2 - 1;
        context.globalAlpha = 1 - amount;
        context.fillRect(0, 0, width, height);
        this.frameStats.draw2D();
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = amount;
        context.drawImage(this.transitionCanvas!, 0, 0);
        this.frameStats.draw2D();
      }
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
  }

  private drawOutgoing(
    context: CanvasRenderingContext2D,
    transition: TransitionFrame,
    x: number,
    y: number,
    edge?: TransitionFrame['direction'],
  ): void {
    const width = this.canvas!.width;
    const height = this.canvas!.height;
    if (transition.snapshot)
      (transition.snapshot as CanvasRenderSnapshot).draw(
        this,
        context,
        x,
        y,
        width,
        height,
        edge,
      );
    else {
      context.fillRect(edge ? 0 : x, edge ? 0 : y, width, height);
      this.frameStats.draw2D();
    }
  }

  private releaseTransitionTarget(): void {
    if (this.transitionCanvas)
      this.render2D.releaseCanvas(this.transitionCanvas);
    this.transitionCanvas = undefined;
    this.transitionContext = undefined;
  }

  endFrame(): void {
    this.requireContext();
    if (!this.frameActive || !this.frameRendered)
      throw new GraphicsError('Canvas2D endFrame requires a rendered frame.');
    this.frameActive = false;
    this.frameStats.submit();
  }

  resize(width: number, height: number): void {
    this.requireContext();
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      throw new RangeError(
        'Canvas2D canvas pixel width and height must be positive finite numbers.',
      );
    const pixelWidth = Math.max(1, Math.round(width));
    const pixelHeight = Math.max(1, Math.round(height));
    if (
      !Number.isSafeInteger(pixelWidth) ||
      !Number.isSafeInteger(pixelHeight) ||
      pixelWidth > MAX_SIZE ||
      pixelHeight > MAX_SIZE
    )
      throw new GraphicsError(
        `Canvas2D canvas backing size ${pixelWidth}×${pixelHeight} exceeds the maximum of ${MAX_SIZE} pixels per side.`,
      );
    const canvas = this.canvas!;
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight)
      this.releaseTransitionTarget();
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const snapshot of this.snapshots) snapshot.destroy();
    this.snapshots.clear();
    this.releaseTransitionTarget();
    this.canvas?.removeEventListener('contextlost', this.onContextLost);
    this.commands.destroy();
    this.spriteSource.destroy();
    this.render2D.destroy();
    this.targetOperations.destroy();
    if (this.layerCanvas) this.render2D.releaseCanvas(this.layerCanvas);
    this.layerCanvas = undefined;
    this.frameActive = false;
    this.context = undefined;
    this.canvas = undefined;
  }

  private requireContext(): CanvasRenderingContext2D {
    if (this.destroyed || !this.context)
      throw new GraphicsError(
        'Canvas2D renderer is not initialized or has already been destroyed.',
      );
    return this.context;
  }
}

/** Pixel storage is never exposed; disposing the old Scene cannot alter this frame. */
class CanvasRenderSnapshot implements RenderSnapshot {
  readonly #width: number;
  readonly #height: number;
  #canvas: HTMLCanvasElement | undefined;
  readonly #owner: Canvas2DRenderer;
  readonly #snapshots: Set<CanvasRenderSnapshot>;

  constructor(
    owner: Canvas2DRenderer,
    canvas: HTMLCanvasElement,
    snapshots: Set<CanvasRenderSnapshot>,
    private readonly engine: CanvasRender2D,
  ) {
    this.#owner = owner;
    this.#canvas = canvas;
    this.#width = canvas.width;
    this.#height = canvas.height;
    this.#snapshots = snapshots;
    Object.freeze(this);
  }

  get backend(): 'canvas2d' {
    return 'canvas2d';
  }
  get width(): number {
    return this.#width;
  }
  get height(): number {
    return this.#height;
  }
  get destroyed(): boolean {
    return !this.#canvas;
  }

  assertOwner(owner: Canvas2DRenderer): void {
    if (this.#owner !== owner)
      throw new GraphicsError(
        'Canvas2D transition snapshot belongs to another renderer.',
      );
    if (!this.#canvas)
      throw new GraphicsError(
        'Canvas2D transition snapshot has been destroyed.',
      );
  }

  draw(
    owner: Canvas2DRenderer,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    edge?: TransitionFrame['direction'],
  ): void {
    this.assertOwner(owner);
    if (edge)
      drawSlidingImage(
        context,
        this.#canvas!,
        x,
        y,
        width,
        height,
        edge,
        this.engine.stats,
      );
    else {
      context.drawImage(this.#canvas!, x, y, width, height);
      this.engine.stats.draw2D();
    }
  }

  destroy(): void {
    if (!this.#canvas) return;
    this.engine.releaseCanvas(this.#canvas);
    this.#canvas = undefined;
    this.#snapshots.delete(this);
  }
}

function drawSlidingImage(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  edge: TransitionFrame['direction'],
  stats: FrameStats,
): void {
  context.drawImage(image, x, y, width, height);
  stats.draw2D();
  const horizontal = edge === 'left' || edge === 'right';
  const trailing = edge === 'right' || edge === 'down';
  const origin = horizontal ? x : y;
  const length = horizontal ? width : height;
  const position = origin + (trailing ? length : 0);
  const boundary = Math.round(position);
  if (trailing ? boundary <= position : boundary >= position) return;
  // Canvas clips fractional image geometry, unlike a clamped GPU sampler. Restore
  // the single pixel-center-covered border without rounding the moving content.
  const destination = trailing ? boundary - 1 : boundary;
  const sourceLength = horizontal ? image.width : image.height;
  const source = Math.max(
    0,
    Math.min(
      sourceLength - 1,
      ((destination + 0.5 - origin) * sourceLength) / length - 0.5,
    ),
  );
  if (horizontal) {
    context.clearRect(destination, y, 1, height);
    context.drawImage(
      image,
      source,
      0,
      1,
      image.height,
      destination,
      y,
      1,
      height,
    );
  } else {
    context.clearRect(x, destination, width, 1);
    context.drawImage(
      image,
      0,
      source,
      image.width,
      1,
      x,
      destination,
      width,
      1,
    );
  }
  stats.draw2D();
}
