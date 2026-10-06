import { AssetError } from './texture.js';
import { nativeTextureFormats } from './native-texture.js';
import type { NativeTextureFormat } from './native-texture.js';
import { readResponse } from './read-response.js';
import { assetRecipe } from '../../../src/data/asset-recipe.js';
import { modelLimits } from '../../../src/data/models.js';
import {
  AssetBundleRangeReader,
  parseAssetBundleArchive,
} from './range-bundle.js';
export interface AssetBundleFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}
export interface AssetBundleVariant {
  readonly path: string;
  readonly nativeTextures: boolean;
  readonly formats: readonly NativeTextureFormat[];
  readonly codec: 'none' | 'draco';
}
export interface AssetBundleDescriptor {
  readonly version: 2;
  readonly profile: string;
  readonly files: readonly AssetBundleFile[];
  readonly variants: readonly AssetBundleVariant[];
  readonly textures: readonly {
    readonly width: number;
    readonly height: number;
  }[];
}
export interface AssetBundleCapabilities {
  readonly backend: 'webgpu' | 'webgl2' | 'canvas2d';
  readonly capabilities: {
    readonly threeD: boolean;
    readonly maxTextureSize: number;
    readonly supportedTextureFormats: readonly NativeTextureFormat[];
  };
}
export interface AssetBundleLoadOptions<O> {
  readonly renderer: AssetBundleCapabilities;
  readonly loader: {
    parse(
      input: string,
      baseURL?: string,
      options?: O,
    ): Promise<{ dispose(): void }>;
  };
  readonly options?: O & {
    readonly dracoDecoder?: unknown;
    readonly signal?: AbortSignal;
    readonly nativeTextures?: boolean;
  };
  /** Optional trusted manifest pin. Descriptor hashes are integrity checks, not signatures. */
  readonly manifestSHA256?: string;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new AssetError('Invalid asset bundle object.');
  return value as Record<string, unknown>;
}
function safePath(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) ||
    value === '.' ||
    value === '..'
  )
    throw new AssetError('Invalid asset bundle path.');
  return value;
}
function positive(value: unknown, max: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > max
  )
    throw new AssetError('Invalid asset bundle size.');
  return value;
}
export function parseAssetBundle(value: unknown): AssetBundleDescriptor {
  const d = record(value);
  if (
    d.version !== assetRecipe.version ||
    d.profile !== assetRecipe.bundleProfile ||
    !Array.isArray(d.files) ||
    !Array.isArray(d.variants) ||
    !Array.isArray(d.textures) ||
    d.files.length > assetRecipe.outputFiles ||
    d.variants.length < 1 ||
    d.variants.length > 16 ||
    d.textures.length > modelLimits.entries
  )
    throw new AssetError('Unsupported or malformed asset bundle descriptor.');
  const paths = new Set<string>();
  let total = 0;
  const files = d.files.map((value) => {
    const f = record(value),
      path = safePath(f.path);
    if (
      paths.has(path) ||
      typeof f.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(f.sha256) ||
      typeof f.bytes !== 'number' ||
      !Number.isSafeInteger(f.bytes) ||
      f.bytes < 0
    )
      throw new AssetError('Invalid asset bundle file/hash.');
    total += f.bytes;
    if (total > assetRecipe.outputBytes)
      throw new AssetError('Asset bundle exceeds byte budget.');
    paths.add(path);
    return Object.freeze({ path, bytes: f.bytes, sha256: f.sha256 });
  });
  const variants = d.variants.map((value) => {
    const v = record(value),
      path = safePath(v.path);
    if (
      !paths.has(path) ||
      !path.endsWith('.gltf') ||
      typeof v.nativeTextures !== 'boolean' ||
      !Array.isArray(v.formats) ||
      v.formats.length > 8 ||
      new Set(v.formats).size !== v.formats.length ||
      v.formats.some(
        (f) => typeof f !== 'string' || !Object.hasOwn(nativeTextureFormats, f),
      ) ||
      (v.codec !== 'none' && v.codec !== 'draco') ||
      (!v.nativeTextures && v.formats.length !== 0)
    )
      throw new AssetError('Invalid asset bundle model variant.');
    return Object.freeze({
      path,
      nativeTextures: v.nativeTextures,
      formats: Object.freeze(v.formats as NativeTextureFormat[]),
      codec: v.codec,
    });
  });
  if (
    new Set(variants.map((v) => v.path)).size !== variants.length ||
    !variants.some((v) => !v.nativeTextures && v.codec === 'none')
  )
    throw new AssetError('Asset bundle requires a unique raster fallback.');
  const textures = d.textures.map((value) => {
    const t = record(value);
    return Object.freeze({
      width: positive(t.width, 8192),
      height: positive(t.height, 8192),
    });
  });
  return Object.freeze({
    version: 2,
    profile: d.profile as string,
    files: Object.freeze(files),
    variants: Object.freeze(variants),
    textures: Object.freeze(textures),
  });
}
export function selectAssetBundleVariant(
  descriptor: AssetBundleDescriptor,
  renderer: AssetBundleCapabilities,
  codecs: { readonly draco?: boolean } = {},
): AssetBundleVariant {
  if (!renderer.capabilities.threeD)
    throw new AssetError('Renderer does not support bundle 3D models.');
  if (
    descriptor.textures.some(
      (t) =>
        t.width > renderer.capabilities.maxTextureSize ||
        t.height > renderer.capabilities.maxTextureSize,
    )
  )
    throw new AssetError('Bundle textures exceed device dimensions.');
  const supported = new Set(renderer.capabilities.supportedTextureFormats);
  const variant = descriptor.variants.find(
    (v) =>
      (v.codec !== 'draco' || codecs.draco) &&
      v.formats.every((f) => {
        if (!supported.has(f)) return false;
        const [w, h, , , , feature] = nativeTextureFormats[f];
        return (
          renderer.backend !== 'webgpu' ||
          !feature ||
          descriptor.textures.every(
            (t) => t.width % w === 0 && t.height % h === 0,
          )
        );
      }),
  );
  if (!variant) throw new AssetError('No compatible bundle variant.');
  return variant;
}
async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  let result = '';
  for (const byte of digest) result += byte.toString(16).padStart(2, '0');
  return result;
}
async function fetchBytes(
  url: string,
  max: number,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  signal?.throwIfAborted();
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new AssetError(
      `Asset bundle request failed (HTTP ${response.status}).`,
    );
  return (await readResponse(response, max, signal)).arrayBuffer();
}
/** Verified byte snapshots feed the existing loader; its returned asset retains normal ownership. */
async function loadBundle<
  A extends { dispose(): void },
  O extends {
    signal?: AbortSignal;
    dracoDecoder?: unknown;
    nativeTextures?: boolean;
  },
>(
  uri: string,
  configuration: Omit<AssetBundleLoadOptions<O>, 'loader'> & {
    readonly loader: {
      parse(input: string, baseURL?: string, options?: O): Promise<A>;
    };
  },
  rangeRequests: boolean,
): Promise<A & { readonly bundleVariant: AssetBundleVariant }> {
  const manifestURL = new URL(
    uri,
    typeof document === 'undefined' ? undefined : document.baseURI,
  ).href;
  if (!/^https?:/.test(manifestURL))
    throw new AssetError('Asset bundle requires HTTP(S).');
  const signal = configuration.options?.signal ?? new AbortController().signal;
  const manifest = await fetchBytes(
    manifestURL,
    assetRecipe.profileBytes * 64,
    signal,
  );
  if (
    configuration.manifestSHA256 !== undefined &&
    (!/^[a-f0-9]{64}$/.test(configuration.manifestSHA256) ||
      (await sha256(manifest)) !== configuration.manifestSHA256)
  )
    throw new AssetError('Asset bundle manifest hash mismatch.');
  const manifestValue: unknown = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(manifest),
  );
  const descriptor = parseAssetBundle(manifestValue);
  const archive = rangeRequests
    ? parseAssetBundleArchive(record(manifestValue).archive, descriptor)
    : undefined;
  const variant = selectAssetBundleVariant(descriptor, configuration.renderer, {
    draco: !!configuration.options?.dracoDecoder,
  });
  const rangeReader = archive
    ? new AssetBundleRangeReader(
        new URL(archive.path, manifestURL).href,
        archive,
        signal,
      )
    : undefined;
  const entries = new Map(descriptor.files.map((f) => [f.path, f]));
  const verified = async (path: string) => {
    const f = entries.get(safePath(path));
    if (!f)
      throw new AssetError('Model references an untracked bundle resource.');
    const bytes = rangeReader
      ? await rangeReader.read(path)
      : await fetchBytes(new URL(path, manifestURL).href, f.bytes, signal);
    if (bytes.byteLength !== f.bytes || (await sha256(bytes)) !== f.sha256)
      throw new AssetError(`Asset bundle hash mismatch: ${path}`);
    return bytes;
  };
  const objects: string[] = [],
    cache = new Map<string, string>();
  try {
    const model = record(
      JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(
          await verified(variant.path),
        ),
      ),
    );
    for (const key of ['buffers', 'images']) {
      const values = model[key];
      if (values === undefined) continue;
      if (!Array.isArray(values) || values.length > modelLimits.entries)
        throw new AssetError('Invalid bundle model resource table.');
      for (const value of values) {
        const resource = record(value);
        // Embedded bufferView images are already protected by their verified buffer.
        if (
          key === 'images' &&
          resource.uri === undefined &&
          resource.bufferView !== undefined
        )
          continue;
        const path = safePath(resource.uri);
        let url = cache.get(path);
        if (!url) {
          const bytes = await verified(path);
          url = URL.createObjectURL(new Blob([bytes]));
          objects.push(url);
          cache.set(path, url);
        }
        resource.uri = url;
      }
    }
    const asset = await configuration.loader.parse(
      JSON.stringify(model),
      new URL(variant.path, manifestURL).href,
      { ...configuration.options, nativeTextures: variant.nativeTextures } as O,
    );
    if (signal?.aborted) {
      asset.dispose();
      signal.throwIfAborted();
    }
    Object.defineProperty(asset, 'bundleVariant', {
      value: variant,
      enumerable: true,
    });
    return asset as A & { readonly bundleVariant: AssetBundleVariant };
  } finally {
    for (const url of objects) URL.revokeObjectURL(url);
    rangeReader?.destroy();
  }
}

/** Load verified individual files from a manifest's plain byte-offset archive. */
export function loadAssetBundleRange<
  A extends { dispose(): void },
  O extends {
    signal?: AbortSignal;
    dracoDecoder?: unknown;
    nativeTextures?: boolean;
  },
>(
  uri: string,
  configuration: Omit<AssetBundleLoadOptions<O>, 'loader'> & {
    readonly loader: {
      parse(input: string, baseURL?: string, options?: O): Promise<A>;
    };
  },
): Promise<A & { readonly bundleVariant: AssetBundleVariant }> {
  return loadBundle(uri, configuration, true);
}

/** Existing directory bundles retain their original request behavior. */
export function loadAssetBundle<
  A extends { dispose(): void },
  O extends {
    signal?: AbortSignal;
    dracoDecoder?: unknown;
    nativeTextures?: boolean;
  },
>(
  uri: string,
  configuration: Omit<AssetBundleLoadOptions<O>, 'loader'> & {
    readonly loader: {
      parse(input: string, baseURL?: string, options?: O): Promise<A>;
    };
  },
): Promise<A & { readonly bundleVariant: AssetBundleVariant }> {
  return loadBundle(uri, configuration, false);
}
