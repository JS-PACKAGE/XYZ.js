import { loadTiledMap } from '../../../assets/src/tiled-loader.js';
import { TiledError, tiledRecord } from '../../../assets/src/tiled-parser.js';
import type { ResourcePool } from '../../../assets/src/resource-scope.js';
import { defineFactory } from '../factories.js';
import type { ContentNodeDefinition } from '../content.js';
import type { SceneObject } from '../scene-object.js';
import { TiledContent } from './tiled-map.js';
export interface TiledFactoryOptions {
  url: string;
  allowedOrigins?: readonly string[];
}
function descendants(root: TiledContent): Record<string, SceneObject> {
  const result: Record<string, SceneObject> = Object.create(null) as Record<
    string,
    SceneObject
  >;
  const visit = (parent: SceneObject, prefix: string): void => {
    if (!('children' in parent)) return;
    let index = 0;
    for (const child of (parent as TiledContent).children) {
      const alias = `${prefix}${index++}`;
      result[alias] = child;
      visit(child, `${alias}.`);
    }
  };
  visit(root, '');
  return result;
}
export const tiledContentFactory = defineFactory<
  TiledFactoryOptions,
  TiledContent,
  ResourcePool
>({
  parse(value) {
    const o = tiledRecord(value, 'factory.options');
    if (typeof o.url !== 'string' || !o.url || o.url.length > 4096)
      throw new TiledError('factory.url', 'expected a bounded URL');
    if (
      o.allowedOrigins !== undefined &&
      (!Array.isArray(o.allowedOrigins) ||
        o.allowedOrigins.length > 64 ||
        !o.allowedOrigins.every(
          (v) => typeof v === 'string' && v.length <= 4096,
        ))
    )
      throw new TiledError(
        'factory.allowedOrigins',
        'expected bounded origins',
      );
    return {
      url: o.url,
      ...(o.allowedOrigins
        ? { allowedOrigins: [...(o.allowedOrigins as string[])] }
        : {}),
    };
  },
  async create(options, context) {
    const asset = await loadTiledMap(context.services, options.url, {
      signal: context.signal,
      ...(options.allowedOrigins
        ? { allowedOrigins: options.allowedOrigins }
        : {}),
    });
    try {
      return context.own(new TiledContent(asset));
    } catch (error) {
      asset.destroy();
      throw error;
    }
  },
  children: descendants,
});
export type TiledContentNode = ContentNodeDefinition<{
  readonly tiled: typeof tiledContentFactory;
}>;
/** Produce the exact prefab stable-ID ledger, then feed it to parseContentScene/buildContentScene. */
export async function produceTiledContentNode(
  pool: ResourcePool,
  id: string,
  options: TiledFactoryOptions,
  signal?: AbortSignal,
): Promise<TiledContentNode> {
  const parsed = tiledContentFactory.parse(options);
  const asset = await loadTiledMap(pool, parsed.url, {
    ...(signal ? { signal } : {}),
    ...(parsed.allowedOrigins ? { allowedOrigins: parsed.allowedOrigins } : {}),
  });
  const root = new TiledContent(asset);
  try {
    const children: Record<string, string> = Object.create(null) as Record<
      string,
      string
    >;
    for (const alias of Object.keys(descendants(root)))
      children[alias] = `${id}:${alias}`;
    return { id, kind: 'tiled' as const, options: parsed, children };
  } finally {
    root.destroy();
  }
}
