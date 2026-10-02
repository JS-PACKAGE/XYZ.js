import type { ResourcePool, ResourceScope } from './resource-scope.js';
import { type Texture2DSource } from './index.js';
import { type TiledMapData, type TiledTileset } from './tiled-parser.js';
export interface TiledLoadOptions {
    signal?: AbortSignal;
    allowedOrigins?: readonly string[];
    /** Borrowed images are never destroyed by the importer. */ textures?: ReadonlyMap<string, Texture2DSource>;
}
export declare class TiledAsset {
    readonly data: TiledMapData;
    readonly textures: ReadonlyMap<TiledTileset, Texture2DSource>;
    readonly scope: ResourceScope;
    constructor(data: TiledMapData, textures: ReadonlyMap<TiledTileset, Texture2DSource>, scope: ResourceScope);
    destroy(): void;
}
export declare function loadTiledMap(pool: ResourcePool, url: string, options?: TiledLoadOptions): Promise<TiledAsset>;
