import { XYZError } from '../../graphics/src/errors.js';
import { assetLimits } from '../../../src/data/assets.js';

export class AssetError extends XYZError {}

/** Owns its decoded bitmap; destroying a Sprite does not destroy its Texture. */
export class Texture {
  readonly kind: 'image' | 'native';
  readonly version = 0;
  readonly width: number;
  readonly height: number;
  private disposed = false;
  private readonly bitmap: ImageBitmap | undefined;

  constructor(
    image:
      | ImageBitmap
      | {
          readonly kind: 'native';
          readonly width: number;
          readonly height: number;
        },
  ) {
    const native = 'kind' in image && image.kind === 'native';
    if (
      !Number.isFinite(image.width) ||
      !Number.isFinite(image.height) ||
      image.width <= 0 ||
      image.height <= 0
    )
      throw new AssetError('A texture must have positive, finite dimensions.');
    if (
      image.width > assetLimits.textureDimension ||
      image.height > assetLimits.textureDimension ||
      (!native && image.width * image.height > assetLimits.texturePixels)
    )
      throw new AssetError(
        'Texture exceeds the decoded image resource budget.',
      );
    this.width = image.width;
    this.height = image.height;
    this.kind = native ? 'native' : 'image';
    this.bitmap = native ? undefined : (image as ImageBitmap);
  }

  get image(): ImageBitmap {
    if (!this.bitmap)
      throw new AssetError('Native textures have no decoded image.');
    return this.bitmap;
  }

  /** Decode owned, straight-alpha texels without implementation-specific color conversion. */
  static async fromImage(source: ImageBitmapSource): Promise<Texture> {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(source, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      });
    } catch (error) {
      throw new AssetError('Unable to decode texture image.', { cause: error });
    }
    try {
      return new Texture(bitmap);
    } catch (error) {
      bitmap.close();
      throw error;
    }
  }

  get destroyed(): boolean {
    return this.disposed;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.bitmap?.close();
  }
}
