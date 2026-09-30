import type { Scene } from '../../core/src/scene.js';
import type {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/material2d.js';
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
  WebGL2ContextLostError,
  WebGPUDeviceLostError,
} from './errors.js';
import { graphicsRecoveryLimits } from '../../../src/data/rendering.js';

import type { RenderStats } from './render-stats.js';

export interface ResilientRendererHooks {
  /** Called once when the GPU context/device is lost and recovery begins. */
  onLost?(error: Error): void;
  /** Called after a replacement renderer has taken over. */
  onRecovered?(): void;
}

/**
 * Rebuilds a WebGL2 or WebGPU renderer after context/device loss. Scenes, Textures and
 * geometry are CPU-owned, so they re-upload lazily; prepared 2D materials and
 * post-processors are prepared again on the replacement. Renderer-owned handles
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
  private readonly materials = new Set<Material2D>();
  private readonly processors = new Set<PostProcessor2D>();
  private size: { width: number; height: number } | undefined;
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
        await next.initialize(canvas);
        for (const material of this.materials)
          if (!material.destroyed) await next.prepareMaterial(material);
        for (const processor of this.processors)
          if (!processor.destroyed) await next.preparePostProcessor(processor);
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

  async prepareMaterial(material: Material2D): Promise<void> {
    await this.requireReady().prepareMaterial(material);
    if (!this.materials.has(material)) {
      this.materials.add(material);
      material.addEventListener(
        'destroy',
        () => this.materials.delete(material),
        { once: true },
      );
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

  prepareTextures(sources: readonly Texture2DSource[]): Promise<void> {
    return this.requireReady().prepareTextures(sources);
  }

  unloadTexture(source: Texture2DSource): void {
    if (!this.recovering) this.current.unloadTexture(source);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    this.materials.clear();
    this.processors.clear();
    this.current.destroy();
  }
}
