import type { Scene } from '../../core/src/scene.js';
import type { GpuTimingOptions, RenderStats } from './render-stats.js';
import type { Material2D, PostProcessor2D } from '../../core/src/materials2d/index.js';
import type { NativeMaterial3D } from '../../core/src/native-material3d.js';
import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { FrameEffects, RenderSnapshot } from './render2d-contract.js';
import type { Texture, Texture2DSource } from '../../assets/src/index.js';
import type { NativeTextureFormat } from '../../assets/src/native-texture.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import type { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type { RenderTexture2D, RenderTextureOptions2D } from './render-texture2d.js';
import type { Geometry } from '../../core/src/geometry.js';
import type { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import type { GraphicsResidency, ResidencyBudgetOptions } from './residency.js';
import type { PreparationResource, PreparedResourceLease, ResourcePreparationOptions } from './preparation.js';
import type { EnvironmentMap } from '../../core/src/environment.js';
import type { ReflectionProbe, ReflectionProbeCaptureOptions } from '../../core/src/reflection-probe.js';
import type { ComputeArray, ComputeBuffer, ComputeProgram, ComputeDispatchOptions, ComputeReadOptions, ComputePreparationOptions } from './compute.js';
import type { RenderGraph, RenderGraphPreparationOptions } from './render-graph.js';
export { ComputeBuffer, ComputeProgram } from './compute.js';
export type { ComputeScalar, ComputeArray, ComputeBinding, ComputeProgramOptions, ComputeDispatchOptions, ComputeReadOptions, ComputePreparationOptions, } from './compute.js';
export { RenderGraph } from './render-graph.js';
export type { RenderGraphFormat, RenderGraphTarget, RenderGraphPass, RenderGraphOptions, RenderGraphPreparationOptions, } from './render-graph.js';
export type { GraphicsResidency, ResidencyBudgetOptions, ResidencyStats, } from './residency.js';
export type { PreparationResource, PreparedResourceLease, ResourcePreparationOptions, } from './preparation.js';
export { RenderTexture2D } from './render-texture2d.js';
export type { RenderTextureOptions2D } from './render-texture2d.js';
export type { GpuTimingOptions, GpuTimingStats, GpuTimingStatus, RenderStats, } from './render-stats.js';
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
export type { FrameEffects, RenderSnapshot, TransitionFrame, } from './render2d-contract.js';
export { XYZError, GraphicsError, WebGPUNotSupportedError, WebGPUInitializationError, WebGPUDeviceLostError, GraphicsBackendUnavailableError, UnsupportedGraphicsError, WebGL2InitializationError, WebGL2ContextLostError, Canvas2DInitializationError, } from './errors.js';
export type GraphicsBackend = 'webgpu' | 'webgl2' | 'canvas2d';
export type RendererPreference = GraphicsBackend | 'auto';
export interface TextureAnisotropyCapabilities {
    /** Engine request ceiling, not a claim about native filtering quality. */
    readonly maxRequest: number;
    /** Effective engine ceiling from the driver; null when WebGPU cannot expose it. */
    readonly maxEffective: number | null;
}
export interface AlphaToCoverageCapabilities {
    /** Available opt-in 3D coverage samples; one means unavailable. */
    readonly rgba8Samples: number;
    readonly hdrSamples: number;
}
export interface GraphicsCapabilities {
    readonly threeD: boolean;
    readonly compute: boolean;
    readonly customShaders: boolean;
    readonly storageBuffers: boolean;
    readonly instancing: boolean;
    /** Optional for existing 1.x renderer implementations; only native backends support it. */
    readonly lighting2D?: boolean;
    /** Optional for existing 1.x renderer implementations. */
    readonly textureAnisotropy?: Readonly<TextureAnisotropyCapabilities>;
    readonly alphaToCoverage?: Readonly<AlphaToCoverageCapabilities>;
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
    prepareResource(source: PreparationResource, options?: ResourcePreparationOptions): Promise<PreparedResourceLease>;
    retainFrameResources(): PreparedResourceLease;
    initialize(canvas: HTMLCanvasElement): Promise<void>;
    beginFrame(): void;
    render(scene?: Scene, width?: number, height?: number, effects?: FrameEffects): void;
    captureScene(scene: Scene, width: number, height: number): Promise<RenderSnapshot>;
    prepareMaterial(material: Material2D | NativeMaterial3D): Promise<void>;
    /** Optional for 1.x custom renderers; callers must reject unsupported preparation. */
    prepareGpuParticles?(emitter: GPUParticleEmitter3D): Promise<void>;
    /** Optional native extensions retain compatibility with existing 1.x custom renderers. */
    prepareCompute?(program: ComputeProgram, options?: ComputePreparationOptions): Promise<void>;
    uploadCompute?(buffer: ComputeBuffer, data: ComputeArray, offset?: number): void;
    dispatchCompute?(program: ComputeProgram, options: ComputeDispatchOptions): Promise<void>;
    readCompute?(buffer: ComputeBuffer, options?: ComputeReadOptions): Promise<ComputeArray>;
    prepareRenderGraph?(graph: RenderGraph, options?: RenderGraphPreparationOptions): Promise<void>;
    captureReflectionProbe?(scene: Scene, probe: ReflectionProbe, options?: ReflectionProbeCaptureOptions): Promise<EnvironmentMap>;
    preparePostProcessor(processor: PostProcessor2D): Promise<void>;
    createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D;
    renderToTexture(target: RenderTexture2D, content: Scene | IsolatedGroup2D, options?: RenderToTextureOptions2D): Promise<void>;
    extractPixels(source: RenderTexture2D, options?: ExtractPixelsOptions2D): Promise<Uint8ClampedArray>;
    generateTexture(content: Scene | IsolatedGroup2D, options?: GenerateTextureOptions2D): Promise<Texture>;
    prepareTextures(sources: readonly Texture2DSource[]): Promise<void>;
    unloadTexture(source: Texture2DSource): void;
    endFrame(): void;
    resize(width: number, height: number): void;
    destroy(): void;
}
export declare function createRenderer(canvas: HTMLCanvasElement, preference: RendererPreference, onError: (error: Error) => void, options?: {
    antialias?: boolean;
    /** Rebuild WebGL2/WebGPU after context loss instead of failing. Defaults to true. */
    recover?: boolean;
    onLost?(error: Error): void;
    onRecovered?(): void;
    residency?: ResidencyBudgetOptions;
    gpuTiming?: GpuTimingOptions;
}): Promise<Renderer>;
