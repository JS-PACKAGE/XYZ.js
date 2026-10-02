import type { TiledAsset } from '../../../assets/src/tiled-loader.js';
import {
  TiledError,
  type TiledLayer,
  type TiledTileset,
} from '../../../assets/src/tiled-parser.js';
import { GameObject } from '../game-object.js';
import { Group2D } from '../gameplay/group2d.js';
import { SpriteSheet } from '../graphics2d/sprite-sheet.js';
import { Colliders } from '../physics2d/index.js';
import { Sprite } from '../sprite.js';
import { TileMap, type Tile } from './tile-map.js';

/** Editable atlas plane; GID flags are applied after TileMap's normal cell publication. */
export class TiledTileMap extends TileMap {
  override setTile(column: number, row: number, partial: Partial<Tile>): void {
    super.setTile(column, row, partial);
    const tile = this.getTile(column, row);
    let sprite: Sprite | undefined;
    for (const child of this.children)
      if (
        child instanceof Sprite &&
        child.position.x === column * this.tileWidth &&
        child.position.y === row * this.tileHeight
      ) {
        sprite = child;
        break;
      }
    if (!sprite || tile.frame === undefined) return;
    const gid =
      typeof tile.metadata === 'object' &&
      tile.metadata !== null &&
      'gid' in tile.metadata
        ? Number(tile.metadata.gid)
        : 0;
    const h = (gid & 0x80000000) !== 0,
      v = (gid & 0x40000000) !== 0,
      d = (gid & 0x20000000) !== 0;
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(
      (column + 0.5) * this.tileWidth,
      (row + 0.5) * this.tileHeight,
    );
    sprite.rotation = d ? Math.PI / 2 : 0;
    const frame = this.sheet.getFrame(tile.frame);
    // Tiled swaps axes first, then mirrors horizontal/vertical in map coordinates.
    sprite.scale.set(
      ((d ? this.tileHeight : this.tileWidth) / frame.width) *
        (d ? (v ? -1 : 1) : h ? -1 : 1),
      ((d ? this.tileWidth : this.tileHeight) / frame.height) *
        (d ? (h ? 1 : -1) : v ? -1 : 1),
    );
  }
}
export class TiledContent extends Group2D {
  readonly layers = new Map<number, Group2D>();
  readonly tileMaps = new Map<
    number,
    ReadonlyMap<TiledTileset, TiledTileMap>
  >();
  constructor(readonly asset: TiledAsset) {
    super();
    if (asset.scope.destroyed)
      throw new TiledError('asset', 'resource owner has been released');
    try {
      for (const [depth, layer] of asset.data.layers.entries()) {
        const group = new Group2D();
        group.position.set(layer.x, layer.y);
        group.opacity = layer.opacity;
        group.visible = layer.visible;
        group.zIndex =
          typeof layer.properties.depth === 'number'
            ? layer.properties.depth
            : depth;
        this.add(group);
        this.layers.set(layer.id, group);
        if (layer.type === 'tilelayer') {
          const planes = new Map<TiledTileset, TiledTileMap>();
          for (const ts of asset.data.tilesets) {
            const frames = Array.from({ length: ts.tileCount }, (_, i) => ({
              x: ts.margin + (i % ts.columns) * (ts.tileWidth + ts.spacing),
              y:
                ts.margin +
                Math.floor(i / ts.columns) * (ts.tileHeight + ts.spacing),
              width: ts.tileWidth,
              height: ts.tileHeight,
            }));
            const plane = new TiledTileMap({
              columns: asset.data.width,
              rows: asset.data.height,
              tileWidth: asset.data.tileWidth,
              tileHeight: asset.data.tileHeight,
              sheet: new SpriteSheet(asset.textures.get(ts)!, frames),
            });
            group.add(plane);
            planes.set(ts, plane);
          }
          this.tileMaps.set(layer.id, planes);
          for (let i = 0; i < layer.data.length; i++)
            if (layer.data[i])
              this.setGid(
                layer.id,
                i % asset.data.width,
                Math.floor(i / asset.data.width),
                layer.data[i]!,
              );
        } else this.addObjects(group, layer);
      }
      asset.scope.attach(() => this.destroy());
    } catch (error) {
      super.destroy();
      asset.destroy();
      throw error;
    }
  }
  private addObjects(group: Group2D, layer: TiledLayer): void {
    for (const object of layer.objects) {
      const owner = new GameObject();
      owner.position.set(object.x, object.y);
      owner.rotation = (object.rotation * Math.PI) / 180;
      owner.visible = object.visible;
      owner.collider = object.polygon
        ? Colliders.polygon(
            object.polygon.map((p) => [p[0], p[1]] as [number, number]),
          )
        : object.ellipse
          ? Colliders.circle(object.width / 2, {
              offset: [object.width / 2, object.height / 2],
            })
          : Colliders.box(object.width, object.height, {
              offset: [object.width / 2, object.height / 2],
            });
      owner.collider.sensor = object.properties.sensor === true;
      group.add(owner);
    }
  }
  setGid(layerId: number, column: number, row: number, gid: number): void {
    if (this.destroyed)
      throw new TiledError('content', 'cannot edit destroyed content');
    const planes = this.tileMaps.get(layerId);
    if (!planes) throw new TiledError('layer', 'not a tile layer');
    if (
      !Number.isInteger(gid) ||
      gid < 0 ||
      gid > 0xffffffff ||
      gid & 0x10000000
    )
      throw new TiledError('gid', 'invalid orthogonal uint32 GID');
    const base = gid & 0x0fffffff,
      ts = this.asset.data.tilesets.find(
        (t) => base >= t.firstgid && base < t.firstgid + t.tileCount,
      );
    if ((base && !ts) || (!base && gid))
      throw new TiledError('gid', 'unresolved tile ID');
    // Validate coordinates before retiring any previous plane.
    for (const plane of planes.values()) plane.getTile(column, row);
    if (ts) {
      const props = ts.tiles.get(base - ts.firstgid);
      planes.get(ts)!.setTile(column, row, {
        frame: base - ts.firstgid,
        solid: props?.solid === true,
        metadata: Object.freeze({ gid, properties: props }),
      });
    }
    for (const [other, plane] of planes)
      if (other !== ts) plane.clearTile(column, row);
  }
  override destroy(): void {
    if (this.destroyed) return;
    super.destroy();
    this.asset.destroy();
  }
}
export function createTiledContent(asset: TiledAsset): TiledContent {
  return new TiledContent(asset);
}
