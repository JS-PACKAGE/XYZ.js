import { XYZError } from '../../graphics/src/errors.js';

export class AssetError extends XYZError {}

/** Owns its decoded bitmap; destroying a Sprite does not destroy its Texture. */
export class Texture {
  readonly width: number;
  readonly height: number;
  private disposed = false;

  constructor(readonly image: ImageBitmap) {
    if (
      !Number.isFinite(image.width) ||
      !Number.isFinite(image.height) ||
      image.width <= 0 ||
      image.height <= 0
    )
      throw new AssetError('A texture must have positive, finite dimensions.');
    this.width = image.width;
    this.height = image.height;
  }

  /** Decode into a separately owned bitmap with straight (not premultiplied) alpha. */
  static async fromImage(source: ImageBitmapSource): Promise<Texture> {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(source, { premultiplyAlpha: 'none' });
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
    this.image.close();
  }
}

interface CachedTexture {
  readonly promise: Promise<Texture>;
  readonly controller: AbortController;
  texture?: Texture;
}

/** One decoded CPU bitmap and one in-flight request per canonical URL. */
export class AssetLoader {
  private readonly cache = new Map<string, CachedTexture>();
  private disposed = false;

  constructor(private readonly baseURL?: string) {}

  loadTexture(url: string): Promise<Texture> {
    if (this.disposed)
      return Promise.reject(
        new AssetError('Cannot load from a destroyed AssetLoader.'),
      );

    let canonical: string;
    try {
      const base =
        this.baseURL ??
        (typeof document !== 'undefined' ? document.baseURI : undefined) ??
        (typeof location !== 'undefined' ? location.href : undefined);
      const resolved = new URL(url, base);
      // URL fragments never reach fetch; they must not generate duplicate downloads.
      resolved.hash = '';
      canonical = resolved.href;
    } catch (error) {
      return Promise.reject(
        new AssetError('Invalid texture URL.', { cause: error }),
      );
    }

    const cached = this.cache.get(canonical);
    if (cached && !cached.texture?.destroyed) return cached.promise;
    if (cached) this.cache.delete(canonical);

    const controller = new AbortController();
    const operation = this.fetchTexture(canonical, controller.signal);
    let cancel!: () => void;
    const cancellation = new Promise<never>((_, reject) => {
      cancel = () =>
        reject(
          new AssetError('AssetLoader was destroyed while loading a texture.'),
        );
    });
    controller.signal.addEventListener('abort', cancel, { once: true });
    const entry: CachedTexture = {
      controller,
      promise: Promise.race([operation, cancellation])
        .then(
          (texture) => {
            if (this.disposed) {
              texture.destroy();
              throw new AssetError(
                'AssetLoader was destroyed while loading a texture.',
              );
            }
            entry.texture = texture;
            return texture;
          },
          (error: unknown) => {
            if (this.cache.get(canonical) === entry)
              this.cache.delete(canonical);
            throw error;
          },
        )
        .finally(() => controller.signal.removeEventListener('abort', cancel)),
    };
    this.cache.set(canonical, entry);
    return entry.promise;
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.cache.values()) {
      entry.controller.abort();
      entry.texture?.destroy();
    }
    this.cache.clear();
  }

  private async fetchTexture(
    url: string,
    signal: AbortSignal,
  ): Promise<Texture> {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok)
        throw new AssetError(
          `Texture request failed (HTTP ${response.status}).`,
        );
      if (this.disposed)
        throw new AssetError(
          'AssetLoader was destroyed while loading a texture.',
        );
      const blob = await response.blob();
      if (this.disposed)
        throw new AssetError(
          'AssetLoader was destroyed while loading a texture.',
        );
      const bitmap = await createImageBitmap(blob, {
        premultiplyAlpha: 'none',
      });
      if (this.disposed) {
        bitmap.close();
        throw new AssetError(
          'AssetLoader was destroyed while loading a texture.',
        );
      }
      try {
        return new Texture(bitmap);
      } catch (error) {
        bitmap.close();
        throw error;
      }
    } catch (error) {
      if (error instanceof AssetError) throw error;
      throw new AssetError('Unable to load texture.', { cause: error });
    }
  }
}
