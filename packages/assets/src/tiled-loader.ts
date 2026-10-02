import { tiledLimits } from '../../../src/data/tiled.js';
import { readResponse } from './read-response.js';
import type {
  ResourcePool,
  ResourceScope,
  ResourceRequest,
} from './resource-scope.js';
import { Texture, type Texture2DSource } from './index.js';
import {
  parseTiledMap,
  parseTiledTileset,
  tiledRecord,
  TiledError,
  type TiledMapData,
  type TiledTileset,
} from './tiled-parser.js';
export interface TiledLoadOptions {
  signal?: AbortSignal;
  allowedOrigins?: readonly string[];
  /** Borrowed images are never destroyed by the importer. */ textures?: ReadonlyMap<
    string,
    Texture2DSource
  >;
}
export class TiledAsset {
  constructor(
    readonly data: TiledMapData,
    readonly textures: ReadonlyMap<TiledTileset, Texture2DSource>,
    readonly scope: ResourceScope,
  ) {}
  destroy(): void {
    this.scope.release();
  }
}
/** Game-local shared requests enforce redirect/origin policy before image decoding. */
const imageRequests = new WeakMap<
  ResourcePool,
  Map<string, ResourceRequest<Texture>>
>();
function imageRequest(
  pool: ResourcePool,
  url: string,
): ResourceRequest<Texture> {
  let cache = imageRequests.get(pool);
  if (!cache) {
    cache = new Map();
    imageRequests.set(pool, cache);
  }
  let request = cache.get(url);
  if (!request) {
    request = {
      kind: 'texture',
      ownership: 'owned',
      dispose: (value) => value.destroy(),
      async load(signal, context) {
        const response = await fetch(url, {
          signal,
          redirect: 'error',
          credentials: 'omit',
        });
        if (!response.ok) throw new TiledError(url, `HTTP ${response.status}`);
        const blob = await readResponse(
          response,
          tiledLimits.imageBytes,
          signal,
        );
        const texture = context.own(await Texture.fromImage(blob));
        signal.throwIfAborted();
        return texture;
      },
    };
    cache.set(url, request);
  }
  return request;
}
export async function loadTiledMap(
  pool: ResourcePool,
  url: string,
  options: TiledLoadOptions = {},
): Promise<TiledAsset> {
  const scope = pool.createScope({ signal: options.signal });
  try {
    const root = new URL(
      url,
      typeof document === 'undefined' ? undefined : document.baseURI,
    );
    const origins = options.allowedOrigins ?? [root.origin];
    const resolve = (path: string, base: string): string => {
      const u = new URL(path, base);
      if (
        !['http:', 'https:'].includes(u.protocol) ||
        u.username ||
        u.password ||
        !origins.includes(u.origin)
      )
        throw new TiledError('url', `origin/protocol denied: ${u.origin}`);
      return u.href;
    };
    const json = async (href: string): Promise<unknown> => {
      const response = await fetch(href, {
        signal: scope.signal,
        redirect: 'error',
        credentials: 'omit',
      });
      if (!response.ok) throw new TiledError(href, `HTTP ${response.status}`);
      const blob = await readResponse(
        response,
        tiledLimits.jsonBytes,
        scope.signal,
      );
      const value: unknown = JSON.parse(await blob.text());
      scope.signal.throwIfAborted();
      return value;
    };
    const href = resolve(root.href, root.href),
      raw = tiledRecord(await json(href), 'map');
    if (
      !Array.isArray(raw.tilesets) ||
      raw.tilesets.length > tiledLimits.tilesets
    )
      throw new TiledError('map.tilesets', 'invalid tileset list');
    const sets: TiledTileset[] = [],
      imageURLs = new Map<TiledTileset, string>();
    for (const [i, entry] of raw.tilesets.entries()) {
      const ts = tiledRecord(entry, `map.tilesets[${i}]`);
      if (
        typeof ts.firstgid !== 'number' ||
        !Number.isSafeInteger(ts.firstgid) ||
        ts.firstgid < 1
      )
        throw new TiledError('tileset.firstgid', 'expected a positive integer');
      let base = href,
        source: unknown = ts;
      if (ts.source !== undefined) {
        if (typeof ts.source !== 'string')
          throw new TiledError('tileset.source', 'expected a URL string');
        base = resolve(ts.source, href);
        source = await json(base);
      }
      const parsed = parseTiledTileset(source, ts.firstgid, `tilesets[${i}]`);
      sets.push(parsed);
      imageURLs.set(parsed, resolve(parsed.image, base));
    }
    const data = parseTiledMap(raw, sets),
      textures = new Map<TiledTileset, Texture2DSource>();
    for (const ts of sets) {
      const imageURL = imageURLs.get(ts)!;
      const borrowed = options.textures?.get(imageURL);
      const texture = borrowed
        ? scope.borrow(borrowed).value
        : (await scope.acquire(imageRequest(pool, imageURL))).value;
      if (
        texture.destroyed ||
        texture.width !== ts.imageWidth ||
        texture.height !== ts.imageHeight
      )
        throw new TiledError(
          ts.name,
          'decoded image dimensions differ from tileset',
        );
      textures.set(ts, texture);
    }
    scope.signal.throwIfAborted();
    return new TiledAsset(data, textures, scope);
  } catch (error) {
    scope.release(error);
    throw error;
  }
}
