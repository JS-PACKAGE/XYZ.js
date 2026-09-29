import type { Scene } from '../../core/src/scene.js';
import type {
  Renderer,
  GraphicsBackend,
  GraphicsCapabilities,
} from './index.js';
import { GraphicsError, UnsupportedGraphicsError } from './errors.js';

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
  get capabilities(): GraphicsCapabilities {
    return this.renderer.capabilities;
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
  render(scene?: Scene, width?: number, height?: number): void {
    this.renderer.render(scene, width, height);
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
