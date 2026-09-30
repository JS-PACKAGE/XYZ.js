import type { Scene } from '../../core/src/scene.js';
import { Mesh } from '../../core/src/mesh.js';
import { Sprite } from '../../core/src/sprite.js';
import { defaults } from '../../../src/data/defaults.js';
import {
  Canvas2DInitializationError,
  GraphicsBackendUnavailableError,
  GraphicsError,
} from './errors.js';
import type { GraphicsCapabilities, Renderer } from './index.js';

const MAX_SIZE = 8192;
const background = defaults.clearColor;
const backgroundStyle = `rgba(${Math.round(background.r * 255)}, ${Math.round(background.g * 255)}, ${Math.round(background.b * 255)}, ${background.a})`;

/** Sprite-only fallback; visible 3D meshes are deliberately unsupported. */
export class Canvas2DRenderer implements Renderer {
  readonly backend = 'canvas2d' as const;
  readonly capabilities: GraphicsCapabilities = Object.freeze({
    threeD: false,
    compute: false,
    customShaders: false,
    storageBuffers: false,
    instancing: false,
    maxTextureSize: MAX_SIZE,
  });
  private canvas: HTMLCanvasElement | undefined;
  private context: CanvasRenderingContext2D | undefined;
  private readonly sprites: Sprite[] = [];
  private frameActive = false;
  private frameRendered = false;
  private destroyed = false;

  constructor(_onError: (error: Error) => void) {
    void _onError;
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
  }

  render(scene?: Scene, width?: number, height?: number): void {
    const context = this.requireContext();
    if (!this.frameActive || this.frameRendered)
      throw new GraphicsError(
        'Canvas2D render requires an active frame and may be called only once per frame.',
      );
    const canvas = this.canvas!;
    const sprites = this.sprites;
    sprites.length = 0;
    let scaleX = 1;
    let scaleY = 1;
    if (scene) {
      const logicalWidth = width ?? (canvas.clientWidth || canvas.width);
      const logicalHeight = height ?? (canvas.clientHeight || canvas.height);
      if (
        !Number.isFinite(logicalWidth) ||
        !Number.isFinite(logicalHeight) ||
        logicalWidth <= 0 ||
        logicalHeight <= 0
      )
        throw new RangeError(
          'Canvas2D sprite rendering requires positive finite logical width and height.',
        );
      scaleX = canvas.width / logicalWidth;
      scaleY = canvas.height / logicalHeight;
      for (const object of scene.objects) {
        if (object instanceof Mesh && object.worldVisible)
          throw new GraphicsBackendUnavailableError(
            'Canvas2D does not support visible 3D meshes.',
          );
        if (
          object instanceof Sprite &&
          object.visible &&
          object.opacity > 0 &&
          !object.texture.destroyed
        )
          sprites.push(object);
      }
      // Stable sort preserves Scene insertion order for sprites with equal z-index.
      sprites.sort((a, b) => a.zIndex - b.zIndex);
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = backgroundStyle;
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (scene) {
      const camera = scene.camera2D;
      const zoom = camera.zoom;
      const cameraX = camera.position.x;
      const cameraY = camera.position.y;
      for (const sprite of sprites) {
        const matrix = sprite.transform.updateMatrix().elements;
        const texture = sprite.texture;
        context.setTransform(
          matrix[0] * zoom * scaleX,
          matrix[1] * zoom * scaleY,
          matrix[3] * zoom * scaleX,
          matrix[4] * zoom * scaleY,
          (matrix[6] - cameraX) * zoom * scaleX,
          (matrix[7] - cameraY) * zoom * scaleY,
        );
        context.globalAlpha = sprite.opacity;
        context.drawImage(
          texture.image,
          -sprite.anchor.x * texture.width,
          -sprite.anchor.y * texture.height,
        );
      }
    } else {
      const side = Math.min(canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
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
    }
    sprites.length = 0;
    this.frameRendered = true;
  }

  endFrame(): void {
    this.requireContext();
    if (!this.frameActive || !this.frameRendered)
      throw new GraphicsError('Canvas2D endFrame requires a rendered frame.');
    this.frameActive = false;
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
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sprites.length = 0;
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
