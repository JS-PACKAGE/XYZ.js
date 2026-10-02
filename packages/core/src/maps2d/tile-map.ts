import { Matrix3, Vector2 } from '../../../math/src/index.js';
import { world2dLimits } from '../../../../src/data/world2d.js';
import type { Camera2D } from '../camera2d.js';
import { GameObject } from '../game-object.js';
import { Group2D } from '../gameplay/group2d.js';
import { SpriteSheet } from '../graphics2d/sprite-sheet.js';
import { Collider2D, Colliders } from '../physics2d/index.js';
import type { Sprite } from '../sprite.js';

export interface TileMapOptions {
  columns: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
  sheet: SpriteSheet;
  /** Sparse imports can retain far-apart chunks without allocating the gaps. */
  sparse?: boolean;
  originColumn?: number;
  originRow?: number;
}

export interface Tile {
  readonly frame: number | undefined;
  readonly solid: boolean;
  readonly elevation: number;
  readonly collider?: Collider2D;
  readonly metadata?: unknown;
}

const emptyTile: Tile = Object.freeze({
  frame: undefined,
  solid: false,
  elevation: 0,
});
interface TileSlot {
  index: number;
  tile: Tile;
  sprite?: Sprite;
  colliderOwner?: GameObject;
  insertion: number;
}

function gridFloor(value: number): number {
  const nearest = Math.round(value);
  // Affine round-trips can land a few machine epsilon below an exact grid edge.
  return Math.abs(value - nearest) <=
    Number.EPSILON * 8 * Math.max(1, Math.abs(value))
    ? nearest === 0
      ? 0
      : nearest
    : Math.floor(value);
}

/** Orthogonal atlas tiles use a top-left anchor. Children borrow the sheet Texture. */
export class TileMap extends Group2D {
  readonly columns: number;
  readonly rows: number;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly sheet: SpriteSheet;
  readonly originColumn: number;
  readonly originRow: number;
  protected isometric = false;
  protected elevationStep = 0;
  private readonly slots: (TileSlot | undefined)[];
  private readonly sparseSlots: Map<number, TileSlot> | undefined;
  private readonly configuredSlots: TileSlot[] = [];
  private readonly local = new Vector2();
  private readonly corner = new Vector2();
  private readonly cullMatrix = new Matrix3();
  private nextInsertion = 0;

  constructor(options: TileMapOptions) {
    super();
    const { columns, rows, tileWidth, tileHeight, sheet } = options;
    if (
      !Number.isSafeInteger(columns) ||
      !Number.isSafeInteger(rows) ||
      columns <= 0 ||
      rows <= 0 ||
      !Number.isSafeInteger(columns * rows) ||
      (!options.sparse && columns * rows > world2dLimits.mapCells)
    )
      throw new RangeError(
        'Tile grid exceeds the positive integer cell budget.',
      );
    if (
      ![tileWidth, tileHeight].every(
        (value) => Number.isFinite(value) && value > 0,
      ) ||
      !Number.isFinite(columns * tileWidth) ||
      !Number.isFinite(rows * tileHeight)
    )
      throw new RangeError(
        'Tile dimensions must be positive finite logical pixels.',
      );
    if (!(sheet instanceof SpriteSheet) || sheet.texture.destroyed)
      throw new RangeError('A TileMap requires a live SpriteSheet.');
    this.columns = columns;
    this.rows = rows;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.sheet = sheet;
    this.originColumn = options.originColumn ?? 0;
    this.originRow = options.originRow ?? 0;
    if (
      ![
        this.originColumn,
        this.originRow,
        this.originColumn + columns,
        this.originRow + rows,
      ].every(Number.isSafeInteger)
    )
      throw new RangeError(
        'Tile origins must stay within the safe integer range.',
      );
    this.sparseSlots = options.sparse ? new Map() : undefined;
    this.slots = options.sparse
      ? []
      : new Array<TileSlot | undefined>(columns * rows);
  }

  private index(column: number, row: number): number {
    if (
      !Number.isInteger(column) ||
      !Number.isInteger(row) ||
      column < this.originColumn ||
      row < this.originRow ||
      column >= this.originColumn + this.columns ||
      row >= this.originRow + this.rows
    )
      throw new RangeError('Tile coordinates are outside the grid.');
    return (row - this.originRow) * this.columns + column - this.originColumn;
  }

  getTile(column: number, row: number): Tile {
    const index = this.index(column, row);
    return (
      (this.sparseSlots?.get(index) ?? this.slots[index])?.tile ?? emptyTile
    );
  }

  protected tileSprite(column: number, row: number): Sprite | undefined {
    const index = this.index(column, row);
    return (this.sparseSlots?.get(index) ?? this.slots[index])?.sprite;
  }

  /** Validates the entire edit before publishing a new immutable cell snapshot. */
  setTile(column: number, row: number, partial: Partial<Tile>): void {
    if (this.destroyed) throw new Error('Cannot edit a destroyed TileMap.');
    const index = this.index(column, row);
    const existing = this.sparseSlots?.get(index) ?? this.slots[index];
    if (!existing && this.configuredSlots.length >= world2dLimits.mapCells)
      throw new RangeError('Configured tiles exceed the cell budget.');
    const previous = existing?.tile ?? emptyTile;
    const candidate = { ...previous, ...partial };
    if (
      typeof candidate.solid !== 'boolean' ||
      !Number.isFinite(candidate.elevation) ||
      !Number.isFinite(candidate.elevation * this.elevationStep)
    )
      throw new RangeError('Tile solidity and elevation are invalid.');
    const frame =
      candidate.frame === undefined
        ? undefined
        : this.sheet.getFrame(candidate.frame);
    if (frame && this.sheet.texture.destroyed)
      throw new Error('Tile atlas is destroyed.');
    if (
      candidate.collider !== undefined &&
      !(candidate.collider instanceof Collider2D)
    )
      throw new RangeError('Custom tile collider must be a Collider2D.');
    const tile: Tile = Object.freeze(candidate);
    const collider = tile.solid
      ? (tile.collider ??
        (previous.solid && !previous.collider
          ? existing?.colliderOwner?.collider
          : undefined) ??
        this.defaultCollider())
      : undefined;
    if (collider && this.worldSpace !== 'world')
      throw new Error('Solid tiles require world-space maps.');
    const slot: TileSlot = existing ?? { index, tile: previous, insertion: -1 };
    const oldSprite = slot.sprite;
    const oldOwner = slot.colliderOwner;
    const oldCollider = oldOwner?.collider;
    const oldX = oldOwner?.position.x ?? 0;
    const oldY = oldOwner?.position.y ?? 0;
    this.origin(column, row, tile.elevation, this.local);
    if (!Number.isFinite(this.local.x) || !Number.isFinite(this.local.y))
      throw new RangeError('Elevated tile coordinates must remain finite.');
    const x = this.local.x,
      y = this.local.y;
    try {
      if (collider && !slot.colliderOwner) {
        const owner = new GameObject();
        owner.position.set(x, y);
        this.add(owner);
        slot.colliderOwner = owner;
      }
      if (slot.colliderOwner) {
        slot.colliderOwner.position.set(x, y);
        slot.colliderOwner.collider = collider;
      }
      if (frame && !slot.sprite) {
        slot.sprite = this.sheet.createSprite(tile.frame!, {
          anchor: this.isometric ? [0.5, 0] : [0, 0],
        });
        this.add(slot.sprite);
        slot.insertion = this.nextInsertion++;
      }
      if (slot.sprite) {
        if (frame) {
          slot.sprite.source = frame;
          slot.sprite.scale.set(
            this.tileWidth / frame.width,
            this.tileHeight / frame.height,
          );
        }
        slot.sprite.position.set(x, y);
        slot.sprite.zIndex = this.depth(column, row, tile.elevation);
        slot.sprite.renderEnabled = frame !== undefined;
      }
    } catch (error) {
      if (slot.sprite !== oldSprite) {
        slot.sprite?.destroy();
        slot.sprite = oldSprite;
      }
      if (slot.colliderOwner !== oldOwner) {
        slot.colliderOwner?.destroy();
        slot.colliderOwner = oldOwner;
      } else if (oldOwner) {
        oldOwner.position.set(oldX, oldY);
        oldOwner.collider = oldCollider;
      }
      throw error;
    }
    slot.tile = tile;
    if (this.sparseSlots) this.sparseSlots.set(index, slot);
    else this.slots[index] = slot;
    if (!existing) this.configuredSlots.push(slot);
    if (this.scene) this.updateCulling(this.scene.camera2D);
  }

  clearTile(column: number, row: number): void {
    this.setTile(column, row, {
      frame: undefined,
      solid: false,
      elevation: 0,
      collider: undefined,
      metadata: undefined,
    });
  }

  protected defaultCollider(): Collider2D {
    if (!this.isometric)
      return Colliders.box(this.tileWidth, this.tileHeight, {
        offset: [this.tileWidth / 2, this.tileHeight / 2],
      });
    return Colliders.polygon([
      [0, 0],
      [this.tileWidth / 2, this.tileHeight / 2],
      [0, this.tileHeight],
      [-this.tileWidth / 2, this.tileHeight / 2],
    ]);
  }

  private origin(
    column: number,
    row: number,
    elevation: number,
    out: Vector2,
  ): Vector2 {
    return this.isometric
      ? out.set(
          column * (this.tileWidth / 2) - row * (this.tileWidth / 2),
          column * (this.tileHeight / 2) +
            row * (this.tileHeight / 2) -
            elevation * this.elevationStep,
        )
      : out.set(column * this.tileWidth, row * this.tileHeight);
  }

  private depth(column: number, row: number, elevation: number): number {
    // Elevation breaks diagonal ties without crossing the next diagonal's depth.
    return this.isometric
      ? column + row + (Math.atan(elevation) / Math.PI) * 0.5
      : 0;
  }

  tileToLocal(column: number, row: number, out = new Vector2()): Vector2 {
    return this.origin(column, row, this.getTile(column, row).elevation, out);
  }

  tileToWorld(column: number, row: number, out = new Vector2()): Vector2 {
    this.tileToLocal(column, row, out);
    return this.updateWorldMatrix().transformPoint(out, out);
  }

  private inversePoint(point: Vector2, matrix: Matrix3, out: Vector2): Vector2 {
    const e = matrix.elements;
    const determinant = e[0] * e[4] - e[1] * e[3];
    if (!Number.isFinite(determinant) || determinant === 0)
      throw new RangeError(
        'Cannot convert coordinates through a singular map transform.',
      );
    const x = point.x - e[6],
      y = point.y - e[7];
    return out.set(
      (e[4] * x - e[3] * y) / determinant,
      (e[0] * y - e[1] * x) / determinant,
    );
  }

  /** Returns integer grid coordinates, possibly outside the grid. Isometric inverse uses elevation zero. */
  worldToTile(point: Vector2, out = new Vector2()): Vector2 {
    this.inversePoint(point, this.updateWorldMatrix(), this.local);
    if (this.isometric)
      return out.set(
        gridFloor(
          this.local.x / this.tileWidth + this.local.y / this.tileHeight,
        ),
        gridFloor(
          this.local.y / this.tileHeight - this.local.x / this.tileWidth,
        ),
      );
    return out.set(
      gridFloor(this.local.x / this.tileWidth),
      gridFloor(this.local.y / this.tileHeight),
    );
  }

  /** Picks the topmost rendered graphic rectangle, including elevated tiles; x/y are column/row. */
  pickTile(point: Vector2, out = new Vector2()): Vector2 | undefined {
    if (!this.worldVisible) return undefined;
    try {
      this.inversePoint(point, this.updateWorldMatrix(), this.local);
    } catch (error) {
      if (error instanceof RangeError) return undefined;
      throw error;
    }
    let selected = -1,
      depth = -Infinity,
      insertion = -1;
    for (const slot of this.configuredSlots) {
      if (
        !slot.sprite ||
        slot.tile.frame === undefined ||
        !slot.sprite.visible ||
        slot.sprite.destroyed
      )
        continue;
      const sprite = slot.sprite;
      const x = sprite.position.x - sprite.anchor.x * this.tileWidth;
      const y = sprite.position.y - sprite.anchor.y * this.tileHeight;
      if (
        this.local.x < x ||
        this.local.x >= x + this.tileWidth ||
        this.local.y < y ||
        this.local.y >= y + this.tileHeight
      )
        continue;
      if (
        sprite.zIndex > depth ||
        (sprite.zIndex === depth && slot.insertion > insertion)
      ) {
        selected = slot.index;
        depth = sprite.zIndex;
        insertion = slot.insertion;
      }
    }
    return selected < 0
      ? undefined
      : out.set(
          (selected % this.columns) + this.originColumn,
          Math.floor(selected / this.columns) + this.originRow,
        );
  }

  /** Render-time hook: conservative viewport inverse keeps affine/elevated graphics intact. */
  updateCulling(
    camera: Camera2D,
    width = camera.viewportWidth,
    height = camera.viewportHeight,
  ): void {
    this.cullMatrix.copy(this.updateWorldMatrix());
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    let singular = false;
    for (let i = 0; i < 4; i++) {
      this.corner.set(i & 1 ? width : 0, i & 2 ? height : 0);
      if (this.worldSpace === 'world')
        camera.screenToWorld(this.corner, this.corner);
      try {
        this.inversePoint(this.corner, this.cullMatrix, this.corner);
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        singular = true;
        break;
      }
      minX = Math.min(minX, this.corner.x);
      minY = Math.min(minY, this.corner.y);
      maxX = Math.max(maxX, this.corner.x);
      maxY = Math.max(maxY, this.corner.y);
    }
    const visible = this.worldVisible && width > 0 && height > 0;
    // Float32 hierarchy matrices may put a mathematically shared edge just outside the inverse viewport.
    const padding =
      1e-5 *
      Math.max(
        1,
        Math.abs(minX),
        Math.abs(minY),
        Math.abs(maxX),
        Math.abs(maxY),
      );
    for (const slot of this.configuredSlots) {
      if (!slot.sprite) continue;
      const sprite = slot.sprite;
      const x = sprite.position.x - sprite.anchor.x * this.tileWidth;
      const y = sprite.position.y - sprite.anchor.y * this.tileHeight;
      sprite.renderEnabled =
        visible &&
        sprite.visible &&
        slot.tile.frame !== undefined &&
        (singular ||
          (x <= maxX + padding &&
            x + this.tileWidth >= minX - padding &&
            y <= maxY + padding &&
            y + this.tileHeight >= minY - padding));
    }
  }

  override update(deltaTime: number): void {
    void deltaTime;
    if (this.scene) this.updateCulling(this.scene.camera2D);
  }

  override destroy(): void {
    if (this.destroyed) return;
    try {
      super.destroy();
    } finally {
      this.slots.length = 0;
      this.configuredSlots.length = 0;
      this.sparseSlots?.clear();
    }
  }
}
