import { Vector2 } from '../../../math/src/index.js';
import type { Camera2D } from '../camera2d.js';
import { Group2D } from '../gameplay/group2d.js';
import { SpriteSheet } from '../graphics2d/sprite-sheet.js';
import { Collider2D } from '../physics2d/index.js';
import type { Sprite } from '../sprite.js';
import type { Scene } from '../scene.js';
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
/** Orthogonal atlas tiles use a top-left anchor. Children borrow the sheet Texture. */
export declare class TileMap extends Group2D {
    readonly columns: number;
    readonly rows: number;
    readonly tileWidth: number;
    readonly tileHeight: number;
    readonly sheet: SpriteSheet;
    readonly originColumn: number;
    readonly originRow: number;
    protected isometric: boolean;
    protected elevationStep: number;
    private readonly slots;
    private readonly sparseSlots;
    private readonly configuredSlots;
    private readonly local;
    private readonly corner;
    private readonly cullMatrix;
    /** State applied by the last full pass; NaN bounds until one runs. */
    private readonly culling;
    private readonly cullingProbe;
    /**
     * Slots keyed by the culling cell of their sprite rectangle's top-left corner; every
     * `cullSlot` files its slot. A slot outside both the old and new viewport stays culled,
     * so a moved viewport re-culls only the cells either one reaches.
     */
    private readonly cullCells;
    private nextInsertion;
    constructor(options: TileMapOptions);
    private index;
    getTile(column: number, row: number): Tile;
    protected tileSprite(column: number, row: number): Sprite | undefined;
    /** Validates the entire edit before publishing a new immutable cell snapshot. */
    setTile(column: number, row: number, partial: Partial<Tile>): void;
    /**
     * Re-culls one edited cell. With an unchanged viewport only that cell can
     * change; re-culling every configured cell per edit made bulk population
     * quadratic. A changed viewport still re-culls every cell.
     */
    protected cullTile(column: number, row: number): void;
    clearTile(column: number, row: number): void;
    protected defaultCollider(): Collider2D;
    private origin;
    private depth;
    tileToLocal(column: number, row: number, out?: Vector2): Vector2;
    tileToWorld(column: number, row: number, out?: Vector2): Vector2;
    private inversePoint;
    /** Returns integer grid coordinates, possibly outside the grid. Isometric inverse uses elevation zero. */
    worldToTile(point: Vector2, out?: Vector2): Vector2;
    /** Picks the topmost rendered graphic rectangle, including elevated tiles; x/y are column/row. */
    pickTile(point: Vector2, out?: Vector2): Vector2 | undefined;
    /**
     * Render-time hook: conservative viewport inverse keeps affine/elevated graphics
     * intact. Edits re-cull their own cells, so an unchanged viewport skips the pass.
     */
    updateCulling(camera: Camera2D, width?: number, height?: number): void;
    private cullingChanged;
    /** Applies the measured probe to every configured cell. */
    private cullAll;
    /**
     * Applies the measured probe. When both it and the last applied state are finite visible
     * rectangles, only cells either rectangle reaches can hold a slot whose result changes;
     * every other slot was culled by the old rectangle and stays culled by the new one.
     */
    private cullMoved;
    private cullCell;
    /** Map-local viewport bounds; every slot's visibility derives from these alone. */
    private measureCulling;
    private cullSlot;
    /** @internal Called only by Scene during registration. */
    attach(scene: Scene): void;
    /** @internal Called only by Scene during removal. */
    detach(scene: Scene): void;
    update(deltaTime: number): void;
    destroy(): void;
}
