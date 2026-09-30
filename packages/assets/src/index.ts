import { XYZError } from '../../graphics/src/errors.js';
import { assetLimits } from '../../../src/data/assets.js';
import { readResponse } from './read-response.js';
import { gameplayAssetLimits } from '../../../src/data/gameplay-assets.js';
import { subscribeLoad } from './preload/subscribe-load.js';
import type { LoadTask } from './preload/preload-batch.js';

export { PreloadBatch } from './preload/preload-batch.js';
export type {
  LoadTask,
  PreloadProgress,
  PreloadState,
} from './preload/preload-batch.js';

export { CanvasTexture2D, TextureView2D } from './texture2d.js';
export type {
  Texture2DSource,
  TextureView2DOptions,
  TextureBorders2D,
  TextureRect2D,
} from './texture2d.js';
export { FontAsset } from './fonts/font-asset.js';
export type { FontAssetOptions } from './fonts/font-asset.js';
export { BitmapFontAsset, BitmapFontLoader } from './fonts/bitmap-font.js';
export type {
  BitmapGlyph,
  BitmapKerning,
  BitmapFontData,
} from './fonts/bitmap-font.js';
export { generateBitmapFont } from './fonts/generate-bitmap-font.js';
export type { DynamicBitmapFontOptions } from './fonts/generate-bitmap-font.js';
export { AssetManifest } from './manifest/asset-manifest.js';
export type {
  ManifestAssetType,
  ManifestEntry,
  AssetManifestOptions,
  ManifestAssetTypes,
} from './manifest/asset-manifest.js';

export interface ResourceLoadOptions {
  signal?: AbortSignal;
  maxBytes?: number;
}

export class AssetError extends XYZError {}

/** Owns its decoded bitmap; destroying a Sprite does not destroy its Texture. */
export class Texture {
  readonly kind = 'image';
  readonly version = 0;
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
    if (
      image.width > assetLimits.textureDimension ||
      image.height > assetLimits.textureDimension ||
      image.width * image.height > assetLimits.texturePixels
    )
      throw new AssetError(
        'Texture exceeds the decoded image resource budget.',
      );
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
  private readonly requests = new Set<AbortController>();

  constructor(private readonly baseURL?: string) {}

  /** Subscriber cancellation leaves the loader-owned shared request/cache intact. */
  loadTexture(
    url: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<Texture> {
    if (options.signal?.aborted) return Promise.reject(options.signal.reason);
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
    if (cached && !cached.texture?.destroyed)
      return subscribeLoad(cached.promise, options.signal);
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
    return subscribeLoad(entry.promise, options.signal);
  }

  textureTask(key: string, url: string): LoadTask<Texture> {
    return { key, load: (signal) => this.loadTexture(url, { signal }) };
  }

  /** Acquires a unique caller-owned image, never a borrowed cache entry. */
  async loadTextureOwned(
    url: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<Texture> {
    if (this.disposed)
      throw new AssetError('Cannot load from a destroyed AssetLoader.');
    options.signal?.throwIfAborted();
    const base =
      this.baseURL ??
      (typeof document !== 'undefined' ? document.baseURI : undefined) ??
      (typeof location !== 'undefined' ? location.href : undefined);
    let canonical: string;
    try {
      const resolved = new URL(url, base);
      if (!['http:', 'https:', 'data:', 'blob:'].includes(resolved.protocol))
        throw new AssetError('Unsupported texture URL protocol.');
      resolved.hash = '';
      canonical = resolved.href;
    } catch (error) {
      if (error instanceof AssetError) throw error;
      throw new AssetError('Invalid texture URL.', { cause: error });
    }
    const controller = new AbortController();
    this.requests.add(controller);
    const abort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener('abort', abort, { once: true });
    try {
      const signal = controller.signal;
      const operation = this.fetchTexture(canonical, signal);
      return await new Promise<Texture>((resolve, reject) => {
        const cancel = () => reject(signal.reason);
        signal.addEventListener('abort', cancel, { once: true });
        operation.then(
          (texture) => {
            signal.removeEventListener('abort', cancel);
            // Unique acquisitions have no cache owner to reclaim an unpublished result.
            if (signal.aborted) {
              texture.destroy();
              reject(signal.reason);
            } else resolve(texture);
          },
          (error: unknown) => {
            signal.removeEventListener('abort', cancel);
            reject(error);
          },
        );
      });
    } finally {
      this.requests.delete(controller);
      options.signal?.removeEventListener('abort', abort);
    }
  }

  async loadBinary(
    url: string,
    options: ResourceLoadOptions = {},
  ): Promise<ArrayBuffer> {
    if (this.disposed)
      throw new AssetError('Cannot load from a destroyed AssetLoader.');
    options.signal?.throwIfAborted();
    const limit = options.maxBytes ?? gameplayAssetLimits.resourceBytes;
    if (
      !Number.isInteger(limit) ||
      limit <= 0 ||
      limit > gameplayAssetLimits.resourceBytes
    )
      throw new AssetError(
        'Resource byte limit must be a positive integer within the resource budget.',
      );
    let canonical: string;
    try {
      const base =
        this.baseURL ??
        (typeof document !== 'undefined' ? document.baseURI : undefined) ??
        (typeof location !== 'undefined' ? location.href : undefined);
      const resolved = new URL(url, base);
      if (!['http:', 'https:', 'data:', 'blob:'].includes(resolved.protocol))
        throw new AssetError('Unsupported resource URL protocol.');
      resolved.hash = '';
      canonical = resolved.href;
    } catch (error) {
      if (error instanceof AssetError) throw error;
      throw new AssetError('Invalid resource URL.', { cause: error });
    }
    const controller = new AbortController();
    this.requests.add(controller);
    const abort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener('abort', abort, { once: true });
    const signal = controller.signal;
    try {
      const operation = async () => {
        const response = await fetch(canonical, { signal });
        signal.throwIfAborted();
        if (!response.ok)
          throw new AssetError(
            `Resource request failed (HTTP ${response.status}).`,
          );
        const blob = await readResponse(response, limit, signal);
        const bytes = await blob.arrayBuffer();
        signal.throwIfAborted();
        return bytes;
      };
      return await subscribeLoad(operation(), signal);
    } catch (error) {
      if (signal.aborted) throw signal.reason;
      if (error instanceof AssetError) throw error;
      throw new AssetError('Unable to load resource.', { cause: error });
    } finally {
      this.requests.delete(controller);
      options.signal?.removeEventListener('abort', abort);
    }
  }

  async loadText(
    url: string,
    options: ResourceLoadOptions = {},
  ): Promise<string> {
    const bytes = await this.loadBinary(url, {
      ...options,
      maxBytes: options.maxBytes ?? gameplayAssetLimits.textBytes,
    });
    return new TextDecoder().decode(bytes);
  }

  async loadJSON<T = unknown>(
    url: string,
    options: ResourceLoadOptions = {},
  ): Promise<T> {
    const text = await this.loadText(url, options);
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new AssetError('Unable to parse resource JSON.', { cause: error });
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.cache.values()) {
      entry.controller.abort();
      entry.texture?.destroy();
    }
    this.cache.clear();
    for (const controller of this.requests)
      controller.abort(
        new AssetError('AssetLoader was destroyed while loading a resource.'),
      );
    this.requests.clear();
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
      const blob = await readResponse(
        response,
        assetLimits.textureBytes,
        signal,
      );
      signal.throwIfAborted();
      if (this.disposed)
        throw new AssetError(
          'AssetLoader was destroyed while loading a texture.',
        );
      const bitmap = await createImageBitmap(blob, {
        premultiplyAlpha: 'none',
      });
      if (this.disposed || signal.aborted) {
        bitmap.close();
        if (signal.aborted) throw signal.reason;
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
      if (signal.aborted) throw signal.reason;
      if (error instanceof AssetError) throw error;
      throw new AssetError('Unable to load texture.', { cause: error });
    }
  }
}
