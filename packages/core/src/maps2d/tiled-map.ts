import type { TiledAsset } from '../../../assets/src/tiled-loader.js';
import {
  TiledError,
  type TiledLayer,
  type TiledTileset,
} from '../../../assets/src/tiled-parser.js';
import { GameObject } from '../game-object.js';
import { Group2D } from '../gameplay/group2d.js';
import { FrameAnimation } from '../gameplay/frame-animation.js';
import { TilingSprite2D } from '../graphics2d/tiling-sprite2d.js';
import { Vector2, type Matrix3 } from '../../../math/src/index.js';
import { SpriteSheet } from '../graphics2d/sprite-sheet.js';
import { Colliders } from '../physics2d/index.js';
import { Sprite } from '../sprite.js';
import { TileMap, type Tile } from './tile-map.js';

/** Editable atlas plane; GID flags are applied after TileMap's normal cell publication. */
export class TiledTileMap extends TileMap {
  /** @internal Importer-supplied atlas animation definitions. */
  tileset?: TiledTileset;
  override setTile(column: number, row: number, partial: Partial<Tile>): void {
    super.setTile(column, row, partial);
    const tile = this.getTile(column, row);
    const sprite = this.tileSprite(column, row);
    if (!sprite) return;
    sprite.animation = undefined;
    if (tile.frame === undefined) return;
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
    const animation = this.tileset?.animations?.get(tile.frame);
    if (animation)
      new FrameAnimation(
        sprite,
        animation.map((frame) => ({
          source: this.sheet.getFrame(frame.tileid),
          duration: frame.duration / 1000,
        })),
      ).play();
    if (this.scene) this.updateCulling(this.scene.camera2D);
  }
}

/** Camera displacement is composed at matrix consumption, including final camera follow. */
class TiledLayerGroup extends Group2D {
  imageSprite?: TilingSprite2D;
  private readonly corner = new Vector2();
  constructor(
    private readonly layer: TiledLayer,
    private readonly asset: TiledAsset,
    private readonly parentPX: number,
    private readonly parentPY: number,
  ) {
    super();
  }
  override updateWorldMatrix(): Matrix3 {
    const matrix = super.updateWorldMatrix();
    const camera = this.scene?.camera2D;
    if (!camera) return matrix;
    const e = matrix.elements;
    e[6] +=
      (this.parentPX - (this.layer.parallaxX ?? 1)) *
      (camera.position.x - (this.asset.data.parallaxOriginX ?? 0));
    e[7] +=
      (this.parentPY - (this.layer.parallaxY ?? 1)) *
      (camera.position.y - (this.asset.data.parallaxOriginY ?? 0));
    const sprite = this.imageSprite;
    if (sprite) {
      const det = e[0] * e[4] - e[1] * e[3];
      if (!Number.isFinite(det) || det === 0) return matrix;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (let i = 0; i < 4; i++) {
        camera.screenToWorld(
          this.corner.set(
            i & 1 ? camera.viewportWidth : 0,
            i & 2 ? camera.viewportHeight : 0,
          ),
          this.corner,
        );
        const x = this.corner.x - e[6],
          y = this.corner.y - e[7];
        const lx = (e[4] * x - e[3] * y) / det,
          ly = (e[0] * y - e[1] * x) / det;
        minX = Math.min(minX, lx);
        maxX = Math.max(maxX, lx);
        minY = Math.min(minY, ly);
        maxY = Math.max(maxY, ly);
      }
      const x = this.layer.repeatX
        ? Math.floor(minX / sprite.tileWidth) * sprite.tileWidth
        : 0;
      const y = this.layer.repeatY
        ? Math.floor(minY / sprite.tileHeight) * sprite.tileHeight
        : 0;
      sprite.position.set(x, y);
      sprite.resize(
        this.layer.repeatX ? maxX - x + sprite.tileWidth : sprite.tileWidth,
        this.layer.repeatY ? maxY - y + sprite.tileHeight : sprite.tileHeight,
      );
    }
    return matrix;
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
        const parentLayer = asset.data.layers.find(
          (l) => l.id === layer.parentId,
        );
        const group = new TiledLayerGroup(
          layer,
          asset,
          parentLayer?.parallaxX ?? 1,
          parentLayer?.parallaxY ?? 1,
        );
        group.position.set(layer.x, layer.y);
        group.opacity = layer.opacity;
        group.visible = layer.visible;
        group.zIndex =
          typeof layer.properties.depth === 'number'
            ? layer.properties.depth
            : layer.type === 'group'
              ? 0
              : depth;
        (layer.parentId === undefined
          ? this
          : this.layers.get(layer.parentId)!
        ).add(group);
        this.layers.set(layer.id, group);
        if (layer.type === 'tilelayer') {
          const planes = new Map<TiledTileset, TiledTileMap>();
          const chunks = layer.chunks;
          const originColumn = chunks?.length
            ? Math.min(...chunks.map((c) => c.x))
            : 0;
          const originRow = chunks?.length
            ? Math.min(...chunks.map((c) => c.y))
            : 0;
          const columns = chunks?.length
            ? Math.max(...chunks.map((c) => c.x + c.width)) - originColumn
            : Math.max(1, asset.data.width);
          const rows = chunks?.length
            ? Math.max(...chunks.map((c) => c.y + c.height)) - originRow
            : Math.max(1, asset.data.height);
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
              columns,
              rows,
              originColumn,
              originRow,
              sparse: asset.data.infinite === true,
              tileWidth: asset.data.tileWidth,
              tileHeight: asset.data.tileHeight,
              sheet: new SpriteSheet(asset.textures.get(ts)!, frames),
            });
            plane.tileset = ts;
            group.add(plane);
            planes.set(ts, plane);
          }
          this.tileMaps.set(layer.id, planes);
          if (chunks) {
            for (const chunk of chunks)
              for (let i = 0; i < chunk.data.length; i++)
                if (chunk.data[i])
                  this.setGid(
                    layer.id,
                    chunk.x + (i % chunk.width),
                    chunk.y + Math.floor(i / chunk.width),
                    chunk.data[i]!,
                  );
          } else
            for (let i = 0; i < layer.data.length; i++)
              if (layer.data[i])
                this.setGid(
                  layer.id,
                  i % asset.data.width,
                  Math.floor(i / asset.data.width),
                  layer.data[i]!,
                );
        } else if (layer.type === 'objectgroup') this.addObjects(group, layer);
        else if (layer.type === 'imagelayer') {
          const texture = asset.imageTextures.get(layer.id);
          if (!texture)
            throw new TiledError(layer.name, 'image layer texture is missing');
          if (layer.repeatX || layer.repeatY) {
            group.imageSprite = new TilingSprite2D({
              texture,
              anchor: [0, 0],
              width: texture.width,
              height: texture.height,
            });
            group.add(group.imageSprite);
          } else group.add(new Sprite({ texture, anchor: [0, 0] }));
        }
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
      if (
        other !== ts &&
        (plane.getTile(column, row).frame !== undefined ||
          plane.getTile(column, row).solid)
      )
        plane.clearTile(column, row);
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
