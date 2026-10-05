import type { Scene } from '../../core/src/scene.js';
import { logger } from '../../core/src/logger.js';
import {
  GraphicsBackendUnavailableError,
  UnsupportedGraphicsError,
} from './errors.js';
import type { GpuTimingOptions, RenderStats } from './render-stats.js';
import type {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/index.js';
import type { NativeMaterial3D } from '../../core/src/native-material3d.js';
import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { FrameEffects, RenderSnapshot } from './render2d-contract.js';
import type { Texture, Texture2DSource } from '../../assets/src/index.js';
import type { NativeTextureFormat } from '../../assets/src/native-texture.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import type { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type {
  RenderTexture2D,
  RenderTextureOptions2D,
} from './render-texture2d.js';
import type { Geometry } from '../../core/src/geometry.js';
import type { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import type { GraphicsResidency, ResidencyBudgetOptions } from './residency.js';
import type {
  PreparationResource,
  PreparedResourceLease,
  ResourcePreparationOptions,
} from './preparation.js';
import type { EnvironmentMap } from '../../core/src/environment.js';
import type {
  ReflectionProbe,
  ReflectionProbeCaptureOptions,
} from '../../core/src/reflection-probe.js';
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
export { ComputeBuffer, ComputeProgram } from './compute.js';
export type {
  ComputeScalar,
  ComputeArray,
  ComputeBinding,
  ComputeProgramOptions,
  ComputeDispatchOptions,
  ComputeReadOptions,
  ComputePreparationOptions,
} from './compute.js';
export { RenderGraph } from './render-graph.js';
export type {
  RenderGraphFormat,
  RenderGraphTarget,
  RenderGraphPass,
  RenderGraphOptions,
  RenderGraphPreparationOptions,
} from './render-graph.js';
export type {
  GraphicsResidency,
  ResidencyBudgetOptions,
  ResidencyStats,
} from './residency.js';
export type {
  PreparationResource,
  PreparedResourceLease,
  ResourcePreparationOptions,
} from './preparation.js';
export { RenderTexture2D } from './render-texture2d.js';
export type { RenderTextureOptions2D } from './render-texture2d.js';
export type {
  GpuTimingOptions,
  GpuTimingStats,
  GpuTimingStatus,
  RenderStats,
} from './render-stats.js';

export interface RenderToTextureOptions2D {
  clear?: boolean;
  bounds?: Rect2D;
}
export interface ExtractPixelsOptions2D {
  region?: Rect2D;
}
export interface GenerateTextureOptions2D {
  bounds?: Rect2D;
  resolution?: number;
}
export type {
  FrameEffects,
  RenderSnapshot,
  TransitionFrame,
} from './render2d-contract.js';

export {
  XYZError,
  GraphicsError,
  WebGPUNotSupportedError,
  WebGPUInitializationError,
  WebGPUDeviceLostError,
  GraphicsBackendUnavailableError,
  UnsupportedGraphicsError,
  WebGL2InitializationError,
  WebGL2ContextLostError,
  Canvas2DInitializationError,
} from './errors.js';

export type GraphicsBackend = 'webgpu' | 'webgl2' | 'canvas2d';
export type RendererPreference = GraphicsBackend | 'auto';

export interface GraphicsCapabilities {
  readonly threeD: boolean;
  readonly compute: boolean;
  readonly customShaders: boolean;
  readonly storageBuffers: boolean;
  readonly instancing: boolean;
  /** Optional for existing 1.x renderer implementations; only native backends support it. */
  readonly lighting2D?: boolean;
  readonly maxTextureSize: number;
  readonly supportedTextureFormats: readonly NativeTextureFormat[];
}

export interface Renderer {
  readonly backend: GraphicsBackend;
  readonly capabilities: GraphicsCapabilities;
  /** Counters for the last rendered frame; the object is reused, so copy values to keep them. */
  readonly stats: RenderStats;
  readonly residency: GraphicsResidency;
  configureResidency(options: ResidencyBudgetOptions): void;
  prepareGeometry(source: Geometry | Geometry2D): Promise<void>;
  unloadGeometry(source: Geometry | Geometry2D): void;
  prepareResource(
    source: PreparationResource,
    options?: ResourcePreparationOptions,
  ): Promise<PreparedResourceLease>;
  retainFrameResources(): PreparedResourceLease;
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  beginFrame(): void;
  render(
    scene?: Scene,
    width?: number,
    height?: number,
    effects?: FrameEffects,
  ): void;
  captureScene(
    scene: Scene,
    width: number,
    height: number,
  ): Promise<RenderSnapshot>;
  prepareMaterial(material: Material2D | NativeMaterial3D): Promise<void>;
  /** Optional for 1.x custom renderers; callers must reject unsupported preparation. */
  prepareGpuParticles?(emitter: GPUParticleEmitter3D): Promise<void>;
  /** Optional native extensions retain compatibility with existing 1.x custom renderers. */
  prepareCompute?(
    program: ComputeProgram,
    options?: ComputePreparationOptions,
  ): Promise<void>;
  uploadCompute?(
    buffer: ComputeBuffer,
    data: ComputeArray,
    offset?: number,
  ): void;
  dispatchCompute?(
    program: ComputeProgram,
    options: ComputeDispatchOptions,
  ): Promise<void>;
  readCompute?(
    buffer: ComputeBuffer,
    options?: ComputeReadOptions,
  ): Promise<ComputeArray>;
  prepareRenderGraph?(
    graph: RenderGraph,
    options?: RenderGraphPreparationOptions,
  ): Promise<void>;
  captureReflectionProbe?(
    scene: Scene,
    probe: ReflectionProbe,
    options?: ReflectionProbeCaptureOptions,
  ): Promise<EnvironmentMap>;
  preparePostProcessor(processor: PostProcessor2D): Promise<void>;
  createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D;
  renderToTexture(
    target: RenderTexture2D,
    content: Scene | IsolatedGroup2D,
    options?: RenderToTextureOptions2D,
  ): Promise<void>;
  extractPixels(
    source: RenderTexture2D,
    options?: ExtractPixelsOptions2D,
  ): Promise<Uint8ClampedArray>;
  generateTexture(
    content: Scene | IsolatedGroup2D,
    options?: GenerateTextureOptions2D,
  ): Promise<Texture>;
  prepareTextures(sources: readonly Texture2DSource[]): Promise<void>;
  unloadTexture(source: Texture2DSource): void;
  endFrame(): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

export async function createRenderer(
  canvas: HTMLCanvasElement,
  preference: RendererPreference,
  onError: (error: Error) => void,
  options: {
    antialias?: boolean;
    /** Rebuild WebGL2/WebGPU after context loss instead of failing. Defaults to true. */
    recover?: boolean;
    onLost?(error: Error): void;
    onRecovered?(): void;
    residency?: ResidencyBudgetOptions;
    gpuTiming?: GpuTimingOptions;
  } = {},
): Promise<Renderer> {
  if (!['auto', 'webgpu', 'webgl2', 'canvas2d'].includes(preference))
    throw new GraphicsBackendUnavailableError(
      `Unknown graphics renderer preference ${String(preference)}.`,
    );
  const candidates: GraphicsBackend[] =
    preference === 'auto' ? ['webgpu', 'webgl2', 'canvas2d'] : [preference];
  const failures: unknown[] = [];
  for (const backend of candidates) {
    let published = false;
    let active = true;
    let initializationError: Error | undefined;
    const report = (error: Error): void => {
      if (!active) return;
      if (published) onError(error);
      else initializationError = error;
    };
    const antialias = options.antialias ?? true;
    let renderer: Renderer | undefined;
    // A bound context cannot change type. Failed candidates never bind the user's canvas.
    const target =
      preference === 'auto' ? document.createElement('canvas') : canvas;
    if (target !== canvas) {
      target.width = canvas.width;
      target.height = canvas.height;
    }
    try {
      // Static imports would fetch every backend during Canvas2D startup. Import the selected
      // constructor before wrapping: recovery stays synchronous and uses only that backend.
      let create: (handler: (error: Error) => void) => Renderer;
      if (backend === 'canvas2d') {
        const { Canvas2DRenderer } = await import('./canvas2d-renderer.js');
        create = (handler) => new Canvas2DRenderer(handler, options.gpuTiming);
      } else if (backend === 'webgpu') {
        const { WebGPURenderer } = await import('./webgpu-renderer.js');
        create = (handler) =>
          new WebGPURenderer(handler, antialias, options.gpuTiming);
      } else {
        const { WebGL2Renderer } = await import('./webgl2-renderer.js');
        create = (handler) =>
          new WebGL2Renderer(handler, antialias, options.gpuTiming);
      }
      if (backend === 'canvas2d' || options.recover === false)
        renderer = create(report);
      else {
        const { ResilientRenderer } = await import('./resilient-renderer.js');
        renderer = new ResilientRenderer(backend, create, report, options);
      }
      renderer.configureResidency(options.residency ?? {});
      await renderer.initialize(target);
      if (initializationError) throw initializationError;
    } catch (cause) {
      active = false;
      let failure = cause;
      try {
        renderer?.destroy();
      } catch (cleanup) {
        failure = new AggregateError(
          [cause, cleanup],
          `${backend} initialization and cleanup failed.`,
        );
      }
      if (preference !== 'auto') {
        logger.error(`${backend} initialization failed.`, failure);
        throw failure;
      }
      logger.warn(
        `${backend} unavailable during automatic selection.`,
        failure,
      );
      failures.push(failure);
      continue;
    }
    if (preference === 'auto') {
      let presented: Renderer | undefined;
      try {
        const { PresentedRenderer } = await import('./presented-renderer.js');
        presented = new PresentedRenderer(renderer, target);
        await presented.initialize(canvas);
        if (initializationError) throw initializationError;
      } catch (cause) {
        active = false;
        try {
          (presented ?? renderer).destroy();
        } catch (cleanup) {
          const failure = new AggregateError(
            [cause, cleanup],
            'Presentation cleanup failed.',
          );
          failures.push(failure);
          logger.warn(
            `${backend} presentation failed during automatic selection.`,
            failure,
          );
          continue;
        }
        failures.push(cause);
        logger.warn(
          `${backend} presentation failed during automatic selection.`,
          cause,
        );
        continue;
      }
      published = true;
      logger.info(`Using ${backend} graphics backend.`);
      return presented;
    }
    published = true;
    logger.info(`Using ${backend} graphics backend.`);
    return renderer;
  }
  logger.error('No graphics backend could initialize.', ...failures);
  throw new UnsupportedGraphicsError(
    'No graphics backend could initialize (WebGPU → WebGL2 → Canvas2D).',
    {
      cause: new AggregateError(failures, 'Graphics initialization failures.'),
    },
  );
}
