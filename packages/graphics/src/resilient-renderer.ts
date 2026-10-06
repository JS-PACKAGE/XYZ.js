import type { Scene } from '../../core/src/scene.js';
import type {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/material2d.js';
import { isNativeMaterial3D } from '../../core/src/native-material3d.js';
import type { NativeMaterial3D } from '../../core/src/native-material3d.js';
import {
  NativePBRMaterial,
  type NativeMeshMaterial,
} from '../../core/src/native-pbr-material.js';
import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type { Texture, Texture2DSource } from '../../assets/src/index.js';
import type { FrameEffects, RenderSnapshot } from './render2d-contract.js';
import type {
  Renderer,
  GraphicsBackend,
  GraphicsCapabilities,
  RenderToTextureOptions2D,
  ExtractPixelsOptions2D,
  GenerateTextureOptions2D,
} from './index.js';
import type {
  RenderTexture2D,
  RenderTextureOptions2D,
} from './render-texture2d.js';
import {
  GraphicsError,
  UnsupportedGraphicsError,
  WebGL2ContextLostError,
  WebGPUDeviceLostError,
} from './errors.js';
import { graphicsRecoveryLimits } from '../../../src/data/rendering.js';

import type { RenderStats } from './render-stats.js';
import type { Geometry } from '../../core/src/geometry.js';
import type { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import type { GraphicsResidency, ResidencyBudgetOptions } from './residency.js';
import { preparationResourceDestroyed } from './preparation.js';
import type {
  PreparationResource,
  PreparedResourceLease,
  ResourcePreparationOptions,
} from './preparation.js';
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
import type { EnvironmentMap } from '../../core/src/environment.js';
import type { PlanarReflection } from '../../core/src/planar-reflection.js';

export interface ResilientRendererHooks {
  /** Called once when the GPU context/device is lost and recovery begins. */
  onLost?(error: Error): void;
  /** Called after a replacement renderer has taken over. */
  onRecovered?(): void;
}

interface PreparationRegistration {
  pending: number;
  completed: boolean;
}

interface TexturePreparation {
  readonly source: Texture2DSource;
  readonly registration: PreparationRegistration;
}

/**
 * Rebuilds a WebGL2 or WebGPU renderer after context/device loss. Scenes, Textures and
 * geometry are CPU-owned and otherwise upload lazily. Explicit preparations and live
 * resource leases are restored on the replacement. Renderer-owned handles
 * (RenderTexture2D targets and snapshots) do not survive a loss.
 */
export class ResilientRenderer implements Renderer {
  readonly backend: GraphicsBackend;
  private current: Renderer;
  private canvas: HTMLCanvasElement | undefined;
  private destroyed = false;
  private ready = false;
  private recovering = false;
  private readonly abort = new AbortController();
  private replacement: Renderer | undefined;
  private readonly materials = new Map<
    Material2D | NativeMeshMaterial,
    () => void
  >();
  private readonly processors = new Set<PostProcessor2D>();
  private readonly graphs = new Set<RenderGraph>();
  private size: { width: number; height: number } | undefined;
  private residencyOptions: ResidencyBudgetOptions = {};
  private readonly prepared = new Set<{
    source: PreparationResource;
    lease: PreparedResourceLease;
  }>();
  private readonly textures = new Map<
    Texture2DSource,
    PreparationRegistration
  >();
  private readonly geometry = new Map<
    Geometry | Geometry2D,
    PreparationRegistration
  >();
  private readonly gpuParticles = new Map<GPUParticleEmitter3D, () => void>();
  /** Completed recoveries, for diagnostics. */
  recoveries = 0;

  constructor(
    backend: GraphicsBackend,
    private readonly create: (onError: (error: Error) => void) => Renderer,
    private readonly report: (error: Error) => void,
    private readonly hooks: ResilientRendererHooks = {},
  ) {
    this.backend = backend;
    this.current = create(this.handleError);
  }

  get stats(): RenderStats {
    return this.current.stats;
  }
  get residency(): GraphicsResidency {
    return this.current.residency;
  }
  configureResidency(options: ResidencyBudgetOptions): void {
    this.requireReady().configureResidency(options);
    this.residencyOptions = { ...options };
  }
  async prepareGeometry(source: Geometry | Geometry2D): Promise<void> {
    const backend = this.requireReady();
    const registration = this.geometry.get(source) ?? {
      pending: 0,
      completed: false,
    };
    this.geometry.set(source, registration);
    registration.pending++;
    try {
      await backend.prepareGeometry(source);
      if (this.geometry.get(source) === registration)
        registration.completed = true;
    } finally {
      registration.pending--;
      if (
        !registration.pending &&
        !registration.completed &&
        this.geometry.get(source) === registration
      )
        this.geometry.delete(source);
    }
  }
  unloadGeometry(source: Geometry | Geometry2D): void {
    this.geometry.delete(source);
    if (this.recovering) this.replacement?.unloadGeometry(source);
    else this.current.unloadGeometry(source);
  }
  async prepareResource(
    source: PreparationResource,
    options?: ResourcePreparationOptions,
  ): Promise<PreparedResourceLease> {
    const entry = {
      source,
      lease: await this.requireReady().prepareResource(source, options),
    };
    if (options?.signal?.aborted) {
      entry.lease.release();
      options.signal.throwIfAborted();
    }
    if (this.destroyed) {
      entry.lease.release();
      throw new GraphicsError('Renderer was destroyed during preparation.');
    }
    this.prepared.add(entry);
    return {
      get released() {
        return entry.lease.released;
      },
      release: () => {
        this.prepared.delete(entry);
        entry.lease.release();
      },
    };
  }
  retainFrameResources(): PreparedResourceLease {
    return this.requireReady().retainFrameResources();
  }

  get capabilities(): GraphicsCapabilities {
    return this.current.capabilities;
  }

  /** True while a lost context is being rebuilt; frames are skipped meanwhile. */
  get isRecovering(): boolean {
    return this.recovering;
  }

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    await this.current.initialize(canvas);
    this.ready = true;
  }

  private readonly handleError = (error: Error): void => {
    if (this.destroyed) return;
    const lost =
      error instanceof WebGL2ContextLostError ||
      error instanceof WebGPUDeviceLostError;
    if (!lost || this.recovering || !this.ready) {
      this.report(error);
      return;
    }
    this.recovering = true;
    try {
      this.hooks.onLost?.(error);
    } catch (cause) {
      this.recovering = false;
      this.report(cause instanceof Error ? cause : error);
      return;
    }
    void this.recover(error);
  };

  private async recover(cause: Error): Promise<void> {
    const canvas = this.canvas!;
    try {
      try {
        this.current.destroy();
      } catch {
        /* The lost renderer can only fail because its context is already gone. */
      }
      // A lost WebGL context is unusable until the browser restores it.
      if (this.backend === 'webgl2') await this.contextRestored(canvas);
      if (this.destroyed) return;
      const next = this.create(this.handleError);
      try {
        next.configureResidency(this.residencyOptions);
        await next.initialize(canvas);
        this.replacement = next;
        for (const material of this.materials.keys())
          if (!material.destroyed) await this.prepareOn(next, material);
        for (const emitter of this.gpuParticles.keys()) {
          if (emitter.destroyed) continue;
          if (!next.prepareGpuParticles)
            throw new UnsupportedGraphicsError(
              'The replacement renderer does not support GPU particle preparation.',
            );
          await next.prepareGpuParticles(emitter);
        }
        for (const processor of this.processors)
          if (!processor.destroyed) await next.preparePostProcessor(processor);
        for (const graph of this.graphs) {
          if (graph.destroyed) continue;
          if (!next.prepareRenderGraph)
            throw new UnsupportedGraphicsError(
              'The replacement renderer does not support render graphs.',
            );
          await next.prepareRenderGraph(graph);
        }
        for (const [texture, registration] of this.textures) {
          if (texture.destroyed || texture.kind === 'render') continue;
          await next.prepareTextures([texture]);
          if (this.textures.get(texture) !== registration)
            next.unloadTexture(texture);
          else registration.completed = true;
        }
        for (const [geometry, registration] of this.geometry) {
          await next.prepareGeometry(geometry);
          if (this.geometry.get(geometry) !== registration)
            next.unloadGeometry(geometry);
          else registration.completed = true;
        }
        for (const entry of this.prepared) {
          if (preparationResourceDestroyed(entry.source)) {
            entry.lease.release();
            this.prepared.delete(entry);
            continue;
          }
          const lease = await next.prepareResource(entry.source);
          if (this.prepared.has(entry)) entry.lease = lease;
          else lease.release();
        }
        if (this.destroyed) {
          next.destroy();
          return;
        }
        if (this.size) next.resize(this.size.width, this.size.height);
      } catch (error) {
        try {
          next.destroy();
        } catch {
          /* Report the recovery failure below. */
        }
        throw error;
      }
      this.current = next;
      this.recovering = false;
      this.recoveries++;
      this.hooks.onRecovered?.();
    } catch (error) {
      if (this.destroyed) return;
      this.recovering = false;
      this.report(
        new GraphicsError(`Graphics recovery failed after ${cause.message}`, {
          cause: error,
        }),
      );
    } finally {
      this.replacement = undefined;
    }
  }

  private contextRestored(canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const signal = this.abort.signal;
      if (signal.aborted) return resolve();
      const finish = (): void => {
        clearTimeout(timer);
        canvas.removeEventListener('webglcontextrestored', restored);
        signal.removeEventListener('abort', aborted);
      };
      const restored = (): void => {
        finish();
        resolve();
      };
      const aborted = (): void => {
        finish();
        resolve();
      };
      // A browser may never restore the context (for example after repeated losses).
      const timer = setTimeout(() => {
        finish();
        reject(
          new GraphicsError(
            `The WebGL2 context was not restored within ${graphicsRecoveryLimits.restoreTimeoutMs} ms.`,
          ),
        );
      }, graphicsRecoveryLimits.restoreTimeoutMs);
      canvas.addEventListener('webglcontextrestored', restored, { once: true });
      signal.addEventListener('abort', aborted, { once: true });
    });
  }

  private requireReady(): Renderer {
    if (this.recovering)
      throw new GraphicsError(
        'The graphics context was lost and is being restored; retry after it recovers.',
      );
    return this.current;
  }

  beginFrame(): void {
    if (!this.recovering) this.current.beginFrame();
  }

  render(
    scene?: Scene,
    width?: number,
    height?: number,
    effects?: FrameEffects,
  ): void {
    if (!this.recovering) this.current.render(scene, width, height, effects);
  }

  endFrame(): void {
    if (!this.recovering) this.current.endFrame();
  }

  resize(width: number, height: number): void {
    this.size = { width, height };
    if (!this.recovering) this.current.resize(width, height);
  }

  captureScene(
    scene: Scene,
    width: number,
    height: number,
  ): Promise<RenderSnapshot> {
    return this.requireReady().captureScene(scene, width, height);
  }
  async prepareCompute(
    program: ComputeProgram,
    options?: ComputePreparationOptions,
  ): Promise<void> {
    const renderer = this.requireReady();
    if (!renderer.prepareCompute)
      throw new UnsupportedGraphicsError(
        'This renderer does not support compute.',
      );
    // Compute output is renderer-owned and cannot be replayed after loss.
    return renderer.prepareCompute(program, options);
  }
  uploadCompute(
    buffer: ComputeBuffer,
    data: ComputeArray,
    offset?: number,
  ): void {
    const renderer = this.requireReady();
    if (!renderer.uploadCompute)
      throw new UnsupportedGraphicsError(
        'This renderer does not support compute.',
      );
    renderer.uploadCompute(buffer, data, offset);
  }
  async dispatchCompute(
    program: ComputeProgram,
    options: ComputeDispatchOptions,
  ): Promise<void> {
    const renderer = this.requireReady();
    if (!renderer.dispatchCompute)
      throw new UnsupportedGraphicsError(
        'This renderer does not support compute.',
      );
    return renderer.dispatchCompute(program, options);
  }
  async readCompute(
    buffer: ComputeBuffer,
    options?: ComputeReadOptions,
  ): Promise<ComputeArray> {
    const renderer = this.requireReady();
    if (!renderer.readCompute)
      throw new UnsupportedGraphicsError(
        'This renderer does not support compute.',
      );
    return renderer.readCompute(buffer, options);
  }
  async prepareRenderGraph(
    graph: RenderGraph,
    options?: RenderGraphPreparationOptions,
  ): Promise<void> {
    const renderer = this.requireReady();
    if (!renderer.prepareRenderGraph)
      throw new UnsupportedGraphicsError(
        'This renderer does not support render graphs.',
      );
    await renderer.prepareRenderGraph(graph, options);
    if (
      this.destroyed ||
      graph.destroyed ||
      this.current !== renderer ||
      this.recovering
    )
      throw new GraphicsError(
        'Render graph ownership ended during preparation.',
      );
    if (!this.graphs.has(graph)) {
      this.graphs.add(graph);
      graph.addEventListener('destroy', () => this.graphs.delete(graph), {
        once: true,
      });
    }
  }
  async captureReflectionProbe(
    scene: Scene,
    probe: ReflectionProbe,
    options?: ReflectionProbeCaptureOptions,
  ): Promise<EnvironmentMap> {
    const renderer = this.requireReady();
    if (!renderer.captureReflectionProbe)
      throw new UnsupportedGraphicsError(
        'This renderer does not support reflection capture.',
      );
    return renderer.captureReflectionProbe(scene, probe, options);
  }
  async capturePlanarReflection(
    scene: Scene,
    reflection: PlanarReflection,
  ): Promise<void> {
    const renderer = this.requireReady();
    if (!renderer.capturePlanarReflection)
      throw new UnsupportedGraphicsError(
        'This renderer does not support planar reflection capture.',
      );
    return renderer.capturePlanarReflection(scene, reflection);
  }
  async prepareGpuParticles(emitter: GPUParticleEmitter3D): Promise<void> {
    const renderer = this.requireReady();
    if (!renderer.prepareGpuParticles)
      throw new UnsupportedGraphicsError(
        'This renderer does not support GPU particle preparation.',
      );
    const existing = this.gpuParticles.get(emitter);
    const registration =
      existing ??
      emitter.ownNative(() => {
        this.gpuParticles.delete(emitter);
      });
    if (!existing) this.gpuParticles.set(emitter, registration);
    try {
      await renderer.prepareGpuParticles(emitter);
      if (
        this.destroyed ||
        emitter.destroyed ||
        this.gpuParticles.get(emitter) !== registration
      )
        throw new GraphicsError(
          'GPU particle ownership ended during preparation.',
        );
    } catch (error) {
      if (!existing && this.gpuParticles.get(emitter) === registration) {
        this.gpuParticles.delete(emitter);
        registration();
      }
      throw error;
    }
  }

  private async prepareOn(
    renderer: Renderer,
    material: Material2D | NativeMeshMaterial,
  ): Promise<void> {
    if (material instanceof NativePBRMaterial) {
      if (!renderer.prepareNativePBRMaterial)
        throw new UnsupportedGraphicsError(
          'The selected renderer does not support native physical materials.',
        );
      await renderer.prepareNativePBRMaterial(material);
    } else await renderer.prepareMaterial(material);
  }

  prepareNativePBRMaterial(material: NativePBRMaterial): Promise<void> {
    return this.trackMaterial(material);
  }

  prepareMaterial(material: Material2D | NativeMaterial3D): Promise<void> {
    return this.trackMaterial(material);
  }

  private async trackMaterial(
    material: Material2D | NativeMeshMaterial,
  ): Promise<void> {
    await this.prepareOn(this.requireReady(), material);
    if (this.destroyed || material.destroyed)
      throw new GraphicsError(
        'Renderer or material was destroyed during preparation.',
      );
    if (!this.materials.has(material)) {
      const forget = (): void => {
        this.materials.delete(material);
      };
      if (isNativeMaterial3D(material))
        this.materials.set(material, material.onDestroy(forget));
      else {
        material.addEventListener('destroy', forget, { once: true });
        this.materials.set(material, () =>
          material.removeEventListener('destroy', forget),
        );
      }
    }
  }

  async preparePostProcessor(processor: PostProcessor2D): Promise<void> {
    await this.requireReady().preparePostProcessor(processor);
    if (!this.processors.has(processor)) {
      this.processors.add(processor);
      processor.addEventListener(
        'destroy',
        () => this.processors.delete(processor),
        { once: true },
      );
    }
  }

  createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D {
    return this.requireReady().createRenderTexture(options);
  }

  renderToTexture(
    target: RenderTexture2D,
    content: Scene | IsolatedGroup2D,
    options?: RenderToTextureOptions2D,
  ): Promise<void> {
    return this.requireReady().renderToTexture(target, content, options);
  }

  extractPixels(
    source: RenderTexture2D,
    options?: ExtractPixelsOptions2D,
  ): Promise<Uint8ClampedArray> {
    return this.requireReady().extractPixels(source, options);
  }

  generateTexture(
    content: Scene | IsolatedGroup2D,
    options?: GenerateTextureOptions2D,
  ): Promise<Texture> {
    return this.requireReady().generateTexture(content, options);
  }

  async prepareTextures(sources: readonly Texture2DSource[]): Promise<void> {
    const backend = this.requireReady();
    const registrations: TexturePreparation[] = [];
    for (const source of sources) {
      if (source.kind === 'render') continue;
      const registration = this.textures.get(source) ?? {
        pending: 0,
        completed: false,
      };
      this.textures.set(source, registration);
      registration.pending++;
      registrations.push({ source, registration });
    }
    try {
      await backend.prepareTextures(sources);
      for (const { source, registration } of registrations)
        if (this.textures.get(source) === registration)
          registration.completed = true;
    } finally {
      for (const { source, registration } of registrations) {
        registration.pending--;
        if (
          !registration.pending &&
          !registration.completed &&
          this.textures.get(source) === registration
        )
          this.textures.delete(source);
      }
    }
  }

  unloadTexture(source: Texture2DSource): void {
    this.textures.delete(source);
    if (this.recovering) this.replacement?.unloadTexture(source);
    else this.current.unloadTexture(source);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    for (const unsubscribe of this.materials.values()) unsubscribe();
    this.materials.clear();
    for (const unsubscribe of this.gpuParticles.values()) unsubscribe();
    this.gpuParticles.clear();
    this.processors.clear();
    this.graphs.clear();
    for (const entry of this.prepared) entry.lease.release();
    this.prepared.clear();
    this.textures.clear();
    this.geometry.clear();
    this.current.destroy();
    this.replacement?.destroy();
  }
}
