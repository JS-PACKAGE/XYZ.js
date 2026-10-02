import type { TiledAsset } from '../../../assets/src/tiled-loader.js';
import { type TiledTileset } from '../../../assets/src/tiled-parser.js';
import { Group2D } from '../gameplay/group2d.js';
import { TileMap, type Tile } from './tile-map.js';
/** Editable atlas plane; GID flags are applied after TileMap's normal cell publication. */
export declare class TiledTileMap extends TileMap {
    /** @internal Importer-supplied atlas animation definitions. */
    tileset?: TiledTileset;
    setTile(column: number, row: number, partial: Partial<Tile>): void;
}
export declare class TiledContent extends Group2D {
    readonly asset: TiledAsset;
    readonly layers: Map<number, Group2D>;
    readonly tileMaps: Map<number, ReadonlyMap<TiledTileset, TiledTileMap>>;
    constructor(asset: TiledAsset);
    private addObjects;
    setGid(layerId: number, column: number, row: number, gid: number): void;
    destroy(): void;
}
export declare function createTiledContent(asset: TiledAsset): TiledContent;
