import type { ResourcePool } from '../../../assets/src/resource-scope.js';
import type { ContentNodeDefinition } from '../content.js';
import { TiledContent } from './tiled-map.js';
export interface TiledFactoryOptions {
    url: string;
    allowedOrigins?: readonly string[];
}
export declare const tiledContentFactory: import("../factories.js").FactoryDefinition<TiledFactoryOptions, TiledContent, ResourcePool>;
export type TiledContentNode = ContentNodeDefinition<{
    readonly tiled: typeof tiledContentFactory;
}>;
/** Produce the exact prefab stable-ID ledger, then feed it to parseContentScene/buildContentScene. */
export declare function produceTiledContentNode(pool: ResourcePool, id: string, options: TiledFactoryOptions, signal?: AbortSignal): Promise<TiledContentNode>;
