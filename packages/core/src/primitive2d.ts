import { Texture } from '../../assets/src/index.js';
import { Sprite } from './sprite.js';

/** A rasterized shape using the same texture and rendering path as every Sprite. */
export class Primitive2D extends Sprite {
  private constructor(private readonly ownedTexture: Texture) {
    super({ texture: ownedTexture });
  }

  static async rectangle(
    width: number,
    height: number,
    color: string,
  ): Promise<Primitive2D> {
    Primitive2D.validateDimension(width, 'width');
    Primitive2D.validateDimension(height, 'height');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error(
        'Canvas2D context is unavailable for rasterizing a primitive.',
      );
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    return new Primitive2D(await Texture.fromImage(canvas));
  }

  static async circle(radius: number, color: string): Promise<Primitive2D> {
    Primitive2D.validateDimension(radius, 'radius');
    const diameter = radius * 2;
    if (!Number.isSafeInteger(diameter) || diameter > 8192)
      throw new RangeError(
        'Primitive circle diameter must be at most 8192 pixels.',
      );
    const canvas = document.createElement('canvas');
    canvas.width = diameter;
    canvas.height = diameter;
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error(
        'Canvas2D context is unavailable for rasterizing a primitive.',
      );
    context.fillStyle = color;
    context.beginPath();
    context.arc(radius, radius, radius, 0, Math.PI * 2);
    context.fill();
    return new Primitive2D(await Texture.fromImage(canvas));
  }

  protected override onDestroy(): void {
    this.ownedTexture.destroy();
  }

  private static validateDimension(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value <= 0 || value > 8192)
      throw new RangeError(
        `Primitive ${name} must be a positive integer of at most 8192 pixels.`,
      );
  }
}
