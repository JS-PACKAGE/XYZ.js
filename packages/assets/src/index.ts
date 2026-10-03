import { AssetError, Texture } from './texture.js';
export { AssetError, Texture } from './texture.js';
export { NativeTexture2D } from './native-texture.js';
export type {
  NativeTextureFormat,
  NativeTextureMip,
  NativeTextureOptions,
} from './native-texture.js';
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
export { AssetManifest, ManifestLease } from './manifest/asset-manifest.js';
export type {
  ManifestAssetType,
  ManifestEntry,
  AssetManifestOptions,
  ManifestAssetTypes,
} from './manifest/asset-manifest.js';
export {
  ResourceLease,
  ResourcePool,
  ResourceScope,
} from './resource-scope.js';
export type {
  ResourceKind,
  ResourceLoadContext,
  ResourceOwnership,
  ResourceRequest,
} from './resource-scope.js';
export {
  loadAssetBundle,
  parseAssetBundle,
  selectAssetBundleVariant,
} from './asset-bundle.js';
export type {
  AssetBundleDescriptor,
  AssetBundleFile,
  AssetBundleVariant,
  AssetBundleCapabilities,
  AssetBundleLoadOptions,
} from './asset-bundle.js';
export {
  TiledError,
  parseTiledMap,
  parseTiledTileset,
} from './tiled-parser.js';
export type {
  TiledProperties,
  TiledObject,
  TiledLayer,
  TiledChunk,
  TiledAnimationFrame,
  TiledTileset,
  TiledMapData,
} from './tiled-parser.js';
export { TiledAsset, loadTiledMap } from './tiled-loader.js';
export type { TiledLoadOptions } from './tiled-loader.js';
export { NativeWorkerPool, WorkerJobError } from './worker-jobs.js';
export type {
  WorkerJobErrorCode,
  WorkerJobDefinition,
  WorkerJobTiming,
  WorkerJobResult,
  WorkerJobStatus,
  WorkerJobHandle,
  NativeWorkerPoolOptions,
  WorkerJobOptions,
  WorkerPoolStats,
} from './worker-jobs.js';
export { installWorkerJobs } from './worker-job-runtime.js';
export type {
  WorkerJobOutput,
  WorkerJobContext,
  TrustedWorkerJob,
  WorkerJobHost,
} from './worker-job-runtime.js';

export interface ResourceLoadOptions {
  signal?: AbortSignal;
  maxBytes?: number;
}

export interface AssetLoaderOptions {
  /** RGBA decoded bitmap estimate; does not bound decoder transient memory. */
  decodedTextureBytes?: number;
}
export interface DecodedTextureResidency {
  readonly budgetBytes: number;
  readonly liveBytes: number;
  readonly peakBytes: number;
  readonly entries: number;
  readonly borrowers: number;
  readonly evictions: number;
}
interface CachedTexture {
  readonly promise: Promise<Texture>;
  readonly controller: AbortController;
  texture?: Texture;
  bytes: number;
  references: number;
  pinned: boolean;
  seen: number;
}
/** A borrower must remove its consumers before releasing this lease. */
export class TextureLease {
  private disposed = false;
  constructor(
    readonly texture: Texture,
    private readonly relinquish: () => void,
  ) {}
  get released(): boolean {
    return this.disposed;
  }
  release(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.relinquish();
  }
}

/** One decoded CPU bitmap and one in-flight request per canonical URL. */
export class AssetLoader {
  private readonly cache = new Map<string, CachedTexture>();
  private disposed = false;
  private readonly requests = new Set<AbortController>();
  private readonly decodedBudget: number;
  private decodedBytes = 0;
  private decodedPeak = 0;
  private evictions = 0;
  private clock = 0;

  constructor(
    private readonly baseURL?: string,
    options: AssetLoaderOptions = {},
  ) {
    const budget = options.decodedTextureBytes ?? Infinity;
    if (budget !== Infinity && (!Number.isSafeInteger(budget) || budget < 0))
      throw new RangeError(
        'Decoded texture budget must be a nonnegative safe integer or Infinity.',
      );
    this.decodedBudget = budget;
  }

  get residency(): DecodedTextureResidency {
    let borrowers = 0,
      entries = 0;
    for (const [url, entry] of this.cache) {
      if (entry.texture?.destroyed) this.removeTexture(url, entry);
      else {
        borrowers += entry.references + (entry.pinned ? 1 : 0);
        if (entry.texture) entries++;
      }
    }
    return {
      budgetBytes: this.decodedBudget,
      liveBytes: this.decodedBytes,
      peakBytes: this.decodedPeak,
      entries,
      borrowers,
      evictions: this.evictions,
    };
  }

  /** Shared legacy borrowers are pinned until explicit unload/destroy, even after subscriber abort. */
  loadTexture(
    url: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<Texture> {
    try {
      options.signal?.throwIfAborted();
      const entry = this.textureEntry(url);
      entry.pinned = true;
      entry.seen = ++this.clock;
      return subscribeLoad(entry.promise, options.signal);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async acquireTexture(
    url: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<TextureLease> {
    options.signal?.throwIfAborted();
    const entry = this.textureEntry(url);
    entry.references++;
    entry.seen = ++this.clock;
    let released = false;
    const release = (): void => {
      if (released) return;
      released = true;
      entry.references--;
      entry.seen = ++this.clock;
      if (!entry.pinned && !entry.references && !entry.texture)
        entry.controller.abort();
    };
    try {
      const texture = await subscribeLoad(entry.promise, options.signal);
      if (options.signal?.aborted || this.disposed || texture.destroyed) {
        options.signal?.throwIfAborted();
        throw new AssetError('Texture acquisition was cancelled.');
      }
      return new TextureLease(texture, release);
    } catch (error) {
      release();
      throw error;
    }
  }

  /** Explicitly ends legacy borrowing; outstanding leases must be released first. */
  unloadTexture(url: string): void {
    const canonical = this.textureURL(url);
    const entry = this.cache.get(canonical);
    if (!entry) return;
    if (entry.references)
      throw new AssetError('Cannot unload a texture with outstanding leases.');
    this.removeTexture(canonical, entry);
    entry.controller.abort();
    entry.texture?.destroy();
  }

  private textureURL(url: string): string {
    try {
      const base =
        this.baseURL ??
        (typeof document !== 'undefined' ? document.baseURI : undefined) ??
        (typeof location !== 'undefined' ? location.href : undefined);
      const resolved = new URL(url, base);
      resolved.hash = '';
      return resolved.href;
    } catch (error) {
      throw new AssetError('Invalid texture URL.', { cause: error });
    }
  }

  private removeTexture(url: string, entry: CachedTexture): void {
    if (this.cache.get(url) !== entry) return;
    this.cache.delete(url);
    this.decodedBytes -= entry.bytes;
    entry.bytes = 0;
  }

  private textureEntry(url: string): CachedTexture {
    if (this.disposed)
      throw new AssetError('Cannot load from a destroyed AssetLoader.');
    const canonical = this.textureURL(url);
    const cached = this.cache.get(canonical);
    if (
      cached &&
      !cached.controller.signal.aborted &&
      !cached.texture?.destroyed
    )
      return cached;
    if (cached) this.removeTexture(canonical, cached);
    const controller = new AbortController();
    const operation = this.fetchTexture(canonical, controller.signal);
    let cancel!: () => void;
    const cancellation = new Promise<never>((_, reject) => {
      cancel = () =>
        reject(new AssetError('Texture acquisition was cancelled.'));
    });
    controller.signal.addEventListener('abort', cancel, { once: true });
    const entry: CachedTexture = {
      controller,
      references: 0,
      pinned: false,
      seen: ++this.clock,
      bytes: 0,
      promise: Promise.race([operation, cancellation])
        .then((texture) => {
          try {
            if (
              this.disposed ||
              controller.signal.aborted ||
              this.cache.get(canonical) !== entry
            )
              throw new AssetError('Texture acquisition was cancelled.');
            const bytes = texture.width * texture.height * 4;
            let available = 0;
            for (const [key, candidate] of this.cache) {
              if (candidate.texture?.destroyed)
                this.removeTexture(key, candidate);
              else if (
                candidate.texture &&
                !candidate.pinned &&
                !candidate.references
              )
                available += candidate.bytes;
            }
            if (this.decodedBytes + bytes - available > this.decodedBudget)
              throw new AssetError(
                'Decoded texture budget is exhausted by borrowed resources.',
              );
            while (this.decodedBytes + bytes > this.decodedBudget) {
              let oldest: [string, CachedTexture] | undefined;
              for (const candidate of this.cache)
                if (
                  candidate[1].texture &&
                  !candidate[1].pinned &&
                  !candidate[1].references &&
                  (!oldest || candidate[1].seen < oldest[1].seen)
                )
                  oldest = candidate;
              this.removeTexture(oldest![0], oldest![1]);
              oldest![1].texture!.destroy();
              this.evictions++;
            }
            entry.texture = texture;
            entry.bytes = bytes;
            this.decodedBytes += bytes;
            this.decodedPeak = Math.max(this.decodedPeak, this.decodedBytes);
            return texture;
          } catch (error) {
            texture.destroy();
            throw error;
          }
        })
        .catch((error: unknown) => {
          this.removeTexture(canonical, entry);
          throw error;
        })
        .finally(() => controller.signal.removeEventListener('abort', cancel)),
    };
    this.cache.set(canonical, entry);
    return entry;
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
    this.decodedBytes = 0;
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
