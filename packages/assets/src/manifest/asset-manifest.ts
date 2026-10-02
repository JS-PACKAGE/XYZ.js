import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import { AssetError, type AssetLoader, type Texture } from '../index.js';
import { PreloadBatch, type LoadTask } from '../preload/preload-batch.js';
import {
  BitmapFontLoader,
  type BitmapFontAsset,
} from '../fonts/bitmap-font.js';
import { FontAsset, type FontAssetOptions } from '../fonts/font-asset.js';
import {
  ResourcePool,
  ResourceScope,
  type ResourceLease,
  type ResourceRequest,
} from '../resource-scope.js';

export type ManifestAssetType =
  | 'texture'
  | 'binary'
  | 'text'
  | 'json'
  | 'font'
  | 'bitmapFont'
  | 'model'
  | 'audio'
  | 'custom';
interface ManifestBase {
  readonly aliases: string | readonly string[];
}
export type ManifestEntry = ManifestBase &
  (
    | {
        readonly type: 'texture';
        readonly url: string;
        readonly owned?: boolean;
      }
    | {
        readonly type: 'binary' | 'text' | 'json';
        readonly url: string;
        readonly maxBytes?: number;
      }
    | {
        readonly type: 'font';
        readonly url: string;
        readonly options: Omit<FontAssetOptions, 'signal'>;
      }
    | {
        readonly type: 'bitmapFont';
        readonly url: string;
        readonly format?: 'text' | 'json';
      }
    | {
        readonly type: 'model' | 'audio' | 'custom';
        readonly load: (signal: AbortSignal) => Promise<unknown>;
        readonly owned: boolean;
        readonly dispose?: (value: unknown) => void;
      }
  );
export interface AssetManifestOptions {
  readonly entries: readonly ManifestEntry[];
  readonly bundles?: Readonly<Record<string, readonly string[]>>;
}
export interface ManifestAssetTypes {
  texture: Texture;
  binary: ArrayBuffer;
  text: string;
  json: unknown;
  font: FontAsset;
  bitmapFont: BitmapFontAsset;
  custom: unknown;
  model: unknown;
  audio: unknown;
}

/** An explicit scene/candidate acquisition; releasing does not affect another manifest lease. */
export class ManifestLease {
  constructor(
    readonly resources: ResourceScope,
    private readonly aliases: ReadonlyMap<string, ManifestEntry>,
    private readonly values: ReadonlyMap<ManifestEntry, ResourceLease<unknown>>,
  ) {}

  lease<T extends ManifestAssetType>(
    alias: string,
    type: T,
  ): ResourceLease<ManifestAssetTypes[T]> {
    const entry = this.aliases.get(alias);
    const value = entry && this.values.get(entry);
    if (
      !entry ||
      entry.type !== type ||
      !value ||
      value.released ||
      this.resources.destroyed
    )
      throw new AssetError(
        'Manifest alias is not ready with the requested type.',
      );
    return value as ResourceLease<ManifestAssetTypes[T]>;
  }

  get<T extends ManifestAssetType>(
    alias: string,
    type: T,
  ): ManifestAssetTypes[T] {
    return this.lease(alias, type).value;
  }

  release(): void {
    this.resources.release();
  }
}

/** Aliases compile to the existing Scene-compatible task-count PreloadBatch. */
export class AssetManifest {
  private readonly aliases = new Map<string, ManifestEntry>();
  private readonly bundles: Readonly<Record<string, readonly string[]>>;
  private readonly values = new Map<ManifestEntry, unknown>();
  private active?: PreloadBatch;
  private readonly requests = new WeakMap<
    ResourcePool,
    Map<ManifestEntry, ResourceRequest<unknown>>
  >();

  constructor(options: AssetManifestOptions) {
    if (
      options.entries.length > rendering2dLimits.manifestEntries ||
      Object.keys(options.bundles ?? {}).length >
        rendering2dLimits.manifestBundles
    )
      throw new RangeError('Manifest exceeds its entry/bundle budget.');
    let aliasCount = 0;
    for (const input of options.entries) {
      const names =
        typeof input.aliases === 'string'
          ? [input.aliases]
          : [...input.aliases];
      aliasCount += names.length;
      if (
        !names.length ||
        aliasCount > rendering2dLimits.manifestEntries ||
        names.some((name) => !name.trim() || this.aliases.has(name)) ||
        new Set(names).size !== names.length
      )
        throw new RangeError(
          'Manifest aliases must be unique, nonempty and bounded.',
        );
      if (
        ![
          'texture',
          'binary',
          'text',
          'json',
          'font',
          'bitmapFont',
          'model',
          'audio',
          'custom',
        ].includes(input.type)
      )
        throw new RangeError('Unsupported manifest asset type.');
      if (
        input.type === 'custom' ||
        input.type === 'model' ||
        input.type === 'audio'
          ? typeof input.load !== 'function' ||
            (input.owned && typeof input.dispose !== 'function')
          : !('url' in input) || !input.url.trim()
      )
        throw new RangeError('Invalid manifest acquisition.');
      const entry = Object.freeze({
        ...input,
        aliases: Object.freeze(names),
        ...(input.type === 'font'
          ? {
              options: Object.freeze({
                ...input.options,
                descriptors: Object.freeze({ ...input.options.descriptors }),
              }),
            }
          : {}),
      }) as ManifestEntry;
      for (const name of names) this.aliases.set(name, entry);
    }
    const bundles: Record<string, readonly string[]> = Object.create(
      null,
    ) as Record<string, readonly string[]>;
    for (const [name, members] of Object.entries(options.bundles ?? {})) {
      if (
        !name.trim() ||
        this.aliases.has(name) ||
        members.length > rendering2dLimits.manifestEntries ||
        members.some((alias) => !this.aliases.has(alias))
      )
        throw new RangeError(
          'Bundles require nonempty names and declared aliases.',
        );
      bundles[name] = Object.freeze([...members]);
    }
    this.bundles = Object.freeze(bundles);
  }

  /** A manifest allows one unsettled compiled batch; shared AssetLoader work remains subscriber-safe. */
  compile(loader: AssetLoader, selections: readonly string[]): PreloadBatch {
    if (this.active && ['idle', 'loading'].includes(this.active.state))
      throw new AssetError('A manifest batch is already unsettled.');
    const entries = this.resolve(selections);
    const acquired = new Map<ManifestEntry, unknown>();
    let settled = false;
    let abortSignal: AbortSignal | undefined;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      for (const [entry, value] of acquired) this.release(entry, value);
      acquired.clear();
      abortSignal?.removeEventListener('abort', cleanup);
    };
    const tasks: LoadTask[] = entries.map((entry) => ({
      key:
        typeof entry.aliases === 'string' ? entry.aliases : entry.aliases[0]!,
      load: async (signal) => {
        signal.throwIfAborted();
        if (!abortSignal) {
          abortSignal = signal;
          signal.addEventListener('abort', cleanup, { once: true });
        }
        if (this.values.has(entry)) return this.values.get(entry);
        const value = await this.acquireValue(loader, entry, signal);
        if (signal.aborted || settled) {
          this.release(entry, value);
          signal.throwIfAborted();
          throw new AssetError('Manifest batch no longer accepts results.');
        }
        acquired.set(entry, value);
        return value;
      },
    }));
    const batch = new PreloadBatch(tasks);
    batch.addEventListener('error', cleanup, { once: true });
    batch.addEventListener(
      'complete',
      () => {
        if (settled) return;
        settled = true;
        for (const [entry, value] of acquired) this.values.set(entry, value);
        acquired.clear();
        abortSignal?.removeEventListener('abort', cleanup);
      },
      { once: true },
    );
    this.active = batch;
    return batch;
  }

  get<T extends ManifestAssetType>(
    alias: string,
    type: T,
  ): ManifestAssetTypes[T] {
    const entry = this.aliases.get(alias);
    if (!entry || entry.type !== type || !this.values.has(entry))
      throw new AssetError(
        'Manifest alias is not ready with the requested type.',
      );
    return this.values.get(entry) as ManifestAssetTypes[T];
  }

  /** All-or-nothing lifetime acquisition. Reuse the pool across scene scopes to share owned work. */
  async acquire(
    pool: ResourcePool,
    selections: readonly string[],
    options: { signal?: AbortSignal; scope?: ResourceScope } = {},
  ): Promise<ManifestLease> {
    const entries = this.resolve(selections);
    if (options.scope && options.scope.pool !== pool)
      throw new AssetError('Manifest scope belongs to another ResourcePool.');
    const resources = options.scope
      ? options.scope.fork({ signal: options.signal })
      : pool.createScope({ signal: options.signal });
    const values = new Map<ManifestEntry, ResourceLease<unknown>>();
    let requests = this.requests.get(pool);
    if (!requests) {
      requests = new Map();
      this.requests.set(pool, requests);
    }
    try {
      await Promise.all(
        entries.map(async (entry) => {
          let lease: ResourceLease<unknown>;
          if (entry.type === 'texture' && !entry.owned)
            lease = await resources.acquireTexture(entry.url);
          else {
            let request = requests.get(entry);
            if (!request) {
              request = Object.freeze<ResourceRequest<unknown>>({
                kind:
                  entry.type === 'texture'
                    ? 'texture'
                    : entry.type === 'font' || entry.type === 'bitmapFont'
                      ? 'font'
                      : entry.type === 'model' || entry.type === 'audio'
                        ? entry.type
                        : 'custom',
                ownership: this.isOwned(entry) ? 'owned' : 'borrowed',
                load: (signal: AbortSignal) =>
                  this.acquireValue(pool.loader, entry, signal),
                ...(this.isOwned(entry)
                  ? { dispose: (value: unknown) => this.release(entry, value) }
                  : {}),
              });
              requests!.set(entry, request);
            }
            lease = await resources.acquire(request);
          }
          values.set(entry, lease);
        }),
      );
      resources.signal.throwIfAborted();
      return new ManifestLease(resources, this.aliases, values);
    } catch (error) {
      try {
        resources.release(error);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Manifest acquisition and cleanup failed.',
          { cause: cleanupError },
        );
      }
      throw error;
    }
  }

  /** Explicit caller barrier: detach every borrower before releasing owned acquisitions. */
  unload(
    selections: readonly string[],
    options: { borrowersRemoved: true },
  ): void {
    if (options.borrowersRemoved !== true)
      throw new AssetError('Owned unload requires a borrower-removal barrier.');
    if (this.active && ['idle', 'loading'].includes(this.active.state))
      throw new AssetError('Cannot unload during manifest loading.');
    const entries = this.resolve(selections);
    for (const entry of entries)
      if (!this.isOwned(entry))
        throw new AssetError(
          'Shared or value-only manifest acquisitions cannot be unloaded.',
        );
    for (const entry of entries) {
      if (this.values.has(entry)) this.release(entry, this.values.get(entry));
      this.values.delete(entry);
    }
  }

  private resolve(selections: readonly string[]): ManifestEntry[] {
    if (selections.length > rendering2dLimits.manifestEntries)
      throw new RangeError('Manifest selection exceeds its budget.');
    const entries = new Set<ManifestEntry>();
    for (const name of selections) {
      const members = this.bundles[name] ?? [name];
      for (const alias of members) {
        const entry = this.aliases.get(alias);
        if (!entry)
          throw new AssetError(`Unknown manifest alias or bundle: ${alias}`);
        entries.add(entry);
      }
    }
    return [...entries];
  }

  private isOwned(entry: ManifestEntry): boolean {
    return (
      entry.type === 'font' ||
      entry.type === 'bitmapFont' ||
      ((entry.type === 'texture' ||
        entry.type === 'custom' ||
        entry.type === 'model' ||
        entry.type === 'audio') &&
        entry.owned === true)
    );
  }

  private release(entry: ManifestEntry, value: unknown): void {
    if (!this.isOwned(entry)) return;
    if (
      entry.type === 'custom' ||
      entry.type === 'model' ||
      entry.type === 'audio'
    )
      entry.dispose!(value);
    else (value as Texture | FontAsset | BitmapFontAsset).destroy();
  }

  private acquireValue(
    loader: AssetLoader,
    entry: ManifestEntry,
    signal: AbortSignal,
  ): Promise<unknown> {
    switch (entry.type) {
      case 'texture':
        return entry.owned
          ? loader.loadTextureOwned(entry.url, { signal })
          : loader.loadTexture(entry.url, { signal });
      case 'font':
        return FontAsset.load(loader, entry.url, { ...entry.options, signal });
      case 'bitmapFont':
        return new BitmapFontLoader(loader).load(entry.url, {
          format: entry.format,
          signal,
        });
      case 'binary':
        return loader.loadBinary(entry.url, {
          maxBytes: entry.maxBytes,
          signal,
        });
      case 'text':
        return loader.loadText(entry.url, { maxBytes: entry.maxBytes, signal });
      case 'json':
        return loader.loadJSON(entry.url, { maxBytes: entry.maxBytes, signal });
      case 'custom':
      case 'model':
      case 'audio':
        return entry.load(signal);
    }
  }
}
