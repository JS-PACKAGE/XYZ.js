import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import { AssetError, type AssetLoader } from '../index.js';
import { subscribeLoad } from '../preload/subscribe-load.js';

export interface FontAssetOptions {
  family: string;
  descriptors?: FontFaceDescriptors;
  signal?: AbortSignal;
  maxBytes?: number;
}

/** Owns exactly one browser FontFace registration, never another family's faces. */
export class FontAsset {
  readonly family: string;
  readonly ready: Promise<void>;
  private readonly controller = new AbortController();
  private face?: FontFace;
  private disposed = false;

  constructor(loader: AssetLoader, url: string, options: FontAssetOptions) {
    if (
      typeof options.family !== 'string' ||
      !options.family.trim() ||
      /[\r\n"\\]/u.test(options.family)
    )
      throw new RangeError('A plain nonempty font family is required.');
    const maxBytes = options.maxBytes ?? rendering2dLimits.fontBytes;
    if (
      !Number.isSafeInteger(maxBytes) ||
      maxBytes <= 0 ||
      maxBytes > rendering2dLimits.fontBytes
    )
      throw new RangeError('Font exceeds its byte budget.');
    this.family = options.family;
    const descriptors = Object.freeze({ ...options.descriptors });
    const abort = () => this.controller.abort(options.signal?.reason);
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    this.ready = this.acquire(loader, url, maxBytes, descriptors)
      .catch((error: unknown) => {
        if (this.face && typeof document !== 'undefined')
          document.fonts.delete(this.face);
        this.face = undefined;
        if (this.controller.signal.aborted) throw this.controller.signal.reason;
        if (error instanceof AssetError) throw error;
        throw new AssetError('Unable to load browser font.', { cause: error });
      })
      .finally(() => options.signal?.removeEventListener('abort', abort));
  }

  static async load(
    loader: AssetLoader,
    url: string,
    options: FontAssetOptions,
  ): Promise<FontAsset> {
    const asset = new FontAsset(loader, url, options);
    try {
      await asset.ready;
      return asset;
    } catch (error) {
      asset.destroy();
      throw error;
    }
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  private async acquire(
    loader: AssetLoader,
    url: string,
    maxBytes: number,
    descriptors: FontFaceDescriptors,
  ): Promise<void> {
    const signal = this.controller.signal;
    signal.throwIfAborted();
    if (
      typeof FontFace === 'undefined' ||
      typeof document === 'undefined' ||
      !document.fonts
    )
      throw new AssetError('Browser FontFace registration is required.');
    const bytes = await loader.loadBinary(url, { signal, maxBytes });
    signal.throwIfAborted();
    const face = new FontFace(this.family, bytes, descriptors);
    this.face = face;
    // Loading cannot be cancelled natively. Registration happens only after our barrier.
    await subscribeLoad(face.load(), signal);
    signal.throwIfAborted();
    document.fonts.add(face);
    try {
      const weight = descriptors.weight ?? 'normal';
      const style = descriptors.style ?? 'normal';
      await subscribeLoad(
        document.fonts.load(`${style} ${weight} 16px "${this.family}"`),
        signal,
      );
      signal.throwIfAborted();
      if (face.status !== 'loaded' || !document.fonts.has(face))
        throw new AssetError('Font registration did not become ready.');
    } catch (error) {
      document.fonts.delete(face);
      throw error;
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.abort(new AssetError('FontAsset was destroyed.'));
    if (this.face && typeof document !== 'undefined')
      document.fonts.delete(this.face);
    this.face = undefined;
  }
}
