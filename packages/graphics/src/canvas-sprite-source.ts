import type { Texture } from '../../assets/src/index.js';
import type { Sprite } from '../../core/src/sprite.js';
import { GraphicsError } from './errors.js';

interface OpaqueTexture {
  canvas: HTMLCanvasElement;
  seen: number;
}

/** One reusable source-frame scratch, never a per-color or per-particle Texture. */
export class CanvasSpriteSource {
  private scratch: HTMLCanvasElement | undefined;
  private context: CanvasRenderingContext2D | undefined;
  private readonly opaqueTextures = new Map<Texture, OpaqueTexture>();
  private frame = 0;

  beginFrame(): void {
    this.frame++;
  }

  image(sprite: Sprite): CanvasImageSource {
    const texture = sprite.texture;
    const source = sprite.source;
    const tint = sprite.worldTint;
    const tinted = tint[0] !== 1 || tint[1] !== 1 || tint[2] !== 1;
    if (!source && !tinted) return texture.image;
    if (!this.scratch) {
      this.scratch = document.createElement('canvas');
      this.context = this.scratch.getContext('2d') ?? undefined;
      if (!this.context)
        throw new GraphicsError('Canvas2D sprite scratch is unavailable.');
    }
    const scratch = this.scratch;
    const context = this.context!;
    const width = sprite.width;
    const height = sprite.height;
    const pixelWidth = Math.ceil(width);
    const pixelHeight = Math.ceil(height);
    if (scratch.width !== pixelWidth) scratch.width = pixelWidth;
    if (scratch.height !== pixelHeight) scratch.height = pixelHeight;
    const x = source?.x ?? 0;
    const y = source?.y ?? 0;
    context.globalCompositeOperation = 'copy';
    context.drawImage(
      tinted ? this.opaque(texture) : texture.image,
      x,
      y,
      width,
      height,
      0,
      0,
      pixelWidth,
      pixelHeight,
    );
    if (tinted) {
      context.globalCompositeOperation = 'multiply';
      context.fillStyle = `rgb(${tint[0] * 255} ${tint[1] * 255} ${tint[2] * 255})`;
      context.fillRect(0, 0, pixelWidth, pixelHeight);
      context.globalCompositeOperation = 'destination-in';
      context.drawImage(
        texture.image,
        x,
        y,
        width,
        height,
        0,
        0,
        pixelWidth,
        pixelHeight,
      );
    }
    context.globalCompositeOperation = 'source-over';
    return scratch;
  }

  private opaque(texture: Texture): HTMLCanvasElement {
    const existing = this.opaqueTextures.get(texture);
    if (existing) {
      existing.seen = this.frame;
      return existing.canvas;
    }
    const canvas = document.createElement('canvas');
    canvas.width = texture.width;
    canvas.height = texture.height;
    const context = canvas.getContext('2d');
    if (!context)
      throw new GraphicsError('Canvas2D tint source is unavailable.');
    context.drawImage(texture.image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    // Multiplying a translucent image directly unions its alpha with the opaque tint,
    // contaminating edge RGB. Retain straight RGB first, then restore original alpha.
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = 255;
    context.putImageData(pixels, 0, 0);
    this.opaqueTextures.set(texture, { canvas, seen: this.frame });
    return canvas;
  }

  endFrame(): void {
    for (const [texture, entry] of this.opaqueTextures) {
      if (texture.destroyed || entry.seen !== this.frame) {
        entry.canvas.width = entry.canvas.height = 1;
        this.opaqueTextures.delete(texture);
      }
    }
  }

  destroy(): void {
    for (const entry of this.opaqueTextures.values())
      entry.canvas.width = entry.canvas.height = 1;
    this.opaqueTextures.clear();
    if (this.scratch) this.scratch.width = this.scratch.height = 1;
    this.context = undefined;
    this.scratch = undefined;
  }
}
