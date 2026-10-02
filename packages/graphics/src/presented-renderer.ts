import type { Scene } from '../../core/src/scene.js';
import type {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/material2d.js';
import type { NativeMaterial3D } from '../../core/src/native-material3d.js';
import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { FrameEffects, RenderSnapshot } from './render2d-contract.js';
import type {
  Renderer,
  GraphicsBackend,
  GraphicsCapabilities,
  RenderToTextureOptions2D,
  ExtractPixelsOptions2D,
  GenerateTextureOptions2D,
} from './index.js';
import { GraphicsError, UnsupportedGraphicsError } from './errors.js';
import type { RenderStats } from './render-stats.js';
import type { Texture, Texture2DSource } from '../../assets/src/index.js';
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

/** Auto selection keeps backend context binding away from the caller's canvas. */
export class PresentedRenderer implements Renderer {
  private canvas: HTMLCanvasElement | undefined;
  private context: CanvasRenderingContext2D | undefined;
  private destroyed = false;
  constructor(
    private readonly renderer: Renderer,
    private readonly target: HTMLCanvasElement,
  ) {}
  get backend(): GraphicsBackend {
    return this.renderer.backend;
  }
  get stats(): RenderStats {
    return this.renderer.stats;
  }
  get capabilities(): GraphicsCapabilities {
    return this.renderer.capabilities;
  }
  get residency(): GraphicsResidency {
    return this.renderer.residency;
  }
  configureResidency(options: ResidencyBudgetOptions): void {
    this.renderer.configureResidency(options);
  }
  prepareGeometry(source: Geometry | Geometry2D): Promise<void> {
    this.requireContext();
    return this.renderer.prepareGeometry(source);
  }
  unloadGeometry(source: Geometry | Geometry2D): void {
    this.requireContext();
    this.renderer.unloadGeometry(source);
  }
  prepareResource(
    source: PreparationResource,
    options?: ResourcePreparationOptions,
  ): Promise<PreparedResourceLease> {
    this.requireContext();
    return this.renderer.prepareResource(source, options);
  }
  retainFrameResources(): PreparedResourceLease {
    this.requireContext();
    return this.renderer.retainFrameResources();
  }
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.destroyed || this.canvas)
      throw new GraphicsError('Presentation renderer cannot be reinitialized.');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context)
      throw new UnsupportedGraphicsError(
        'Auto rendering requires an unbound canvas with a 2D presentation context.',
      );
    this.canvas = canvas;
    this.context = context;
  }
  beginFrame(): void {
    this.requireContext();
    this.renderer.beginFrame();
  }
  async prepareMaterial(
    material: Material2D | NativeMaterial3D,
  ): Promise<void> {
    this.requireContext();
    return this.renderer.prepareMaterial(material);
  }
  async prepareGpuParticles(emitter: GPUParticleEmitter3D): Promise<void> {
    this.requireContext();
    if (!this.renderer.prepareGpuParticles)
      throw new UnsupportedGraphicsError(
        'This renderer does not support GPU particle preparation.',
      );
    return this.renderer.prepareGpuParticles(emitter);
  }
  async preparePostProcessor(effect: PostProcessor2D): Promise<void> {
    this.requireContext();
    return this.renderer.preparePostProcessor(effect);
  }
  async captureScene(
    scene: Scene,
    width: number,
    height: number,
  ): Promise<RenderSnapshot> {
    this.requireContext();
    return this.renderer.captureScene(scene, width, height);
  }
  createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D {
    this.requireContext();
    return this.renderer.createRenderTexture(options);
  }
  async renderToTexture(
    target: RenderTexture2D,
    content: Scene | IsolatedGroup2D,
    options?: RenderToTextureOptions2D,
  ): Promise<void> {
    this.requireContext();
    return this.renderer.renderToTexture(target, content, options);
  }
  async extractPixels(
    source: RenderTexture2D,
    options?: ExtractPixelsOptions2D,
  ): Promise<Uint8ClampedArray> {
    this.requireContext();
    return this.renderer.extractPixels(source, options);
  }
  async generateTexture(
    content: Scene | IsolatedGroup2D,
    options?: GenerateTextureOptions2D,
  ): Promise<Texture> {
    this.requireContext();
    return this.renderer.generateTexture(content, options);
  }
  async prepareTextures(sources: readonly Texture2DSource[]): Promise<void> {
    this.requireContext();
    return this.renderer.prepareTextures(sources);
  }
  unloadTexture(source: Texture2DSource): void {
    this.requireContext();
    this.renderer.unloadTexture(source);
  }
  render(
    scene?: Scene,
    width?: number,
    height?: number,
    effects?: FrameEffects,
  ): void {
    this.requireContext();
    this.renderer.render(scene, width, height, effects);
  }
  endFrame(): void {
    const context = this.requireContext();
    this.renderer.endFrame();
    context.globalCompositeOperation = 'copy';
    context.drawImage(this.target, 0, 0);
  }
  resize(width: number, height: number): void {
    this.requireContext();
    // Backend validates before any backing dimension is changed.
    this.renderer.resize(width, height);
    const canvas = this.canvas!;
    if (canvas.width !== this.target.width) canvas.width = this.target.width;
    if (canvas.height !== this.target.height)
      canvas.height = this.target.height;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.context = undefined;
    this.canvas = undefined;
    try {
      this.renderer.destroy();
    } finally {
      this.target.width = this.target.height = 1;
    }
  }
  private requireContext(): CanvasRenderingContext2D {
    if (!this.context || this.destroyed)
      throw new GraphicsError('Presentation renderer is not initialized.');
    return this.context;
  }
}
