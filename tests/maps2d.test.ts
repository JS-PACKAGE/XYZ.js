import { describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Vector2 } from '../packages/math/src/index.js';
import { Camera2D } from '../packages/core/src/camera2d.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Group2D } from '../packages/core/src/gameplay/group2d.js';
import { SpriteSheet } from '../packages/core/src/graphics2d/sprite-sheet.js';
import { IsometricMap, TileMap } from '../packages/core/src/maps2d/index.js';
import {
  Colliders,
  RigidBody2D,
} from '../packages/core/src/physics2d/index.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { world2dLimits } from '../src/data/world2d.js';
import {
  collectRenderCommands2D,
  RenderCommandBuffer2D,
} from '../packages/graphics/src/render2d-contract.js';

function sheet(): SpriteSheet {
  return new SpriteSheet(
    new Texture({
      width: 48,
      height: 24,
      close: vi.fn(),
    } as unknown as ImageBitmap),
    [
      { x: 0, y: 0, width: 16, height: 8 },
      { x: 16, y: 0, width: 8, height: 24 },
    ],
  );
}

function graphics(map: TileMap): Sprite[] {
  return [...map.children].filter(
    (child): child is Sprite => child instanceof Sprite,
  );
}

function options(atlas = sheet()) {
  return { columns: 4, rows: 4, tileWidth: 32, tileHeight: 16, sheet: atlas };
}

describe('bounded atlas maps', () => {
  it('retains snapshots and pooled graphics across validated atomic edits', () => {
    const atlas = sheet();
    const map = new TileMap(options(atlas));
    const metadata = { name: 'floor' };
    map.setTile(1, 2, { frame: 0, solid: true, metadata });
    const first = map.getTile(1, 2);
    const visual = graphics(map)[0]!;
    const collider = [...map.children].find((child) => child.collider)!;
    expect(() => Object.assign(first, { elevation: 7 })).toThrow(TypeError);
    expect(() => map.setTile(1, 2, { frame: 99, solid: false })).toThrow(
      RangeError,
    );
    expect(map.getTile(1, 2)).toBe(first);
    expect(collider.collider).toBeDefined();
    map.setTile(1, 2, { frame: 1, elevation: 2 });
    expect(first.frame).toBe(0);
    expect(map.getTile(1, 2).metadata).toBe(metadata);
    expect(visual.width * visual.scale.x).toBe(32);
    expect(visual.height * visual.scale.y).toBe(16);
    expect(visual.position).toEqual(new Vector2(32, 32));
    expect(visual.anchor).toEqual(new Vector2(0, 0));
    map.clearTile(1, 2);
    expect(visual.renderEnabled).toBe(false);
    expect(collider.collider).toBeUndefined();
    map.setTile(1, 2, { frame: 0 });
    expect(graphics(map)[0]).toBe(visual);
    map.destroy();
    expect(visual.destroyed).toBe(true);
    expect(collider.destroyed).toBe(true);
    expect(atlas.texture.destroyed).toBe(false);
  });

  it('round-trips rotated, reflected and nonuniform nested coordinates and boundaries', () => {
    for (const Map of [TileMap, IsometricMap]) {
      const map = new Map(options());
      const parent = new Group2D();
      parent.position.set(60, -20);
      parent.rotation = 0.63;
      parent.scale.set(-2, 0.6);
      parent.add(map);
      map.position.set(20, 50);
      map.rotation = -0.27;
      map.scale.set(0.8, 1.7);
      const local = map.tileToLocal(2, 1);
      local.x += Map === TileMap ? 16 : 0;
      local.y += 8;
      const world = map.updateWorldMatrix().transformPoint(local);
      expect(map.worldToTile(world)).toEqual(new Vector2(2, 1));
      expect(map.worldToTile(map.tileToWorld(2, 1))).toEqual(new Vector2(2, 1));
      const origin = map.tileToWorld(0, 0);
      const expected = map.updateWorldMatrix().transformPoint(new Vector2());
      expect(origin).toEqual(expected);
      expect(
        map.worldToTile(
          map.updateWorldMatrix().transformPoint(new Vector2(-1, -1)),
        ).x,
      ).toBeLessThan(0);
      map.scale.x = 0;
      expect(() => map.worldToTile(world)).toThrow(RangeError);
      expect(map.pickTile(world)).toBeUndefined();
    }
    const map = new TileMap(options());
    expect(map.worldToTile(new Vector2(32, 16))).toEqual(new Vector2(1, 1));
    expect(map.worldToTile(new Vector2(128, 64))).toEqual(new Vector2(4, 4));
    expect(() => map.getTile(4, 0)).toThrow(RangeError);
    expect(() => map.setTile(0.5, 0, { frame: 0 })).toThrow(RangeError);
  });

  it('picks overlapping elevated graphics by diagonal, elevation and insertion depth', () => {
    const map = new IsometricMap({ ...options(), elevationStep: 8 });
    map.setTile(0, 0, { frame: 0 });
    map.setTile(1, 1, { frame: 0, elevation: 2 });
    expect(map.tileToLocal(1, 1)).toEqual(new Vector2(0, 0));
    expect(graphics(map)[0]!.anchor).toEqual(new Vector2(0.5, 0));
    expect(map.pickTile(new Vector2(0, 4))).toEqual(new Vector2(1, 1));
    map.clearTile(1, 1);
    expect(map.pickTile(new Vector2(0, 4))).toEqual(new Vector2(0, 0));
    map.setTile(1, 0, { frame: 0, elevation: 1 });
    map.setTile(0, 1, { frame: 0, elevation: 1 });
    expect(map.pickTile(new Vector2(-1, 4))).toEqual(new Vector2(0, 1));
    map.setTile(1, 0, { elevation: 1.5 });
    expect(map.pickTile(new Vector2(-1, 4))).toEqual(new Vector2(0, 1));
    expect(map.pickTile(new Vector2(0, 4))).toEqual(new Vector2(1, 0));
    map.visible = false;
    expect(map.pickTile(new Vector2(0, 4))).toBeUndefined();
  });

  it('culls conservatively after final camera offset without hiding or dropping solids', () => {
    const map = new IsometricMap({ ...options(), elevationStep: 30 });
    map.position.set(70, 60);
    map.rotation = 0.7;
    map.scale.set(-1.8, 0.6);
    map.setTile(3, 3, { frame: 0, solid: true, elevation: 4 });
    map.setTile(0, 0, { frame: 0 });
    const camera = new Camera2D();
    camera.resize(30, 30);
    camera.zoom = 1.7;
    camera.renderOffset.set(7, -11);
    const local = map.tileToLocal(3, 3);
    local.y += 8;
    const center = map.updateWorldMatrix().transformPoint(local);
    camera.position.set(
      center.x + (camera.renderOffset.x - 15) / camera.zoom,
      center.y + (camera.renderOffset.y - 15) / camera.zoom,
    );
    map.updateCulling(camera);
    const visual = graphics(map)[0]!;
    const owner = [...map.children].find((child) => child.collider)!;
    expect(visual.renderEnabled).toBe(true);
    camera.position.set(10000, 10000);
    map.updateCulling(camera);
    expect(visual.renderEnabled).toBe(false);
    expect(visual.visible).toBe(true);
    expect(owner.collider).toBeDefined();
    expect(owner.parent).toBe(map);
  });

  it('culls each edited cell against the live viewport and re-culls all cells after camera moves', () => {
    const scene = new Scene();
    const map = scene.add(new TileMap(options()));
    scene.camera2D.resize(16, 8);
    // Viewports sit strictly inside one tile whether position is a corner or the center.
    scene.camera2D.position.set(8, 4);
    map.setTile(0, 0, { frame: 0 });
    map.setTile(2, 2, { frame: 0 });
    map.setTile(3, 3, { frame: 0 });
    const sprite = (column: number, row: number): Sprite =>
      graphics(map).find(
        (child) =>
          child.position.x === column * 32 && child.position.y === row * 16,
      )!;
    expect(sprite(0, 0).renderEnabled).toBe(true);
    expect(sprite(2, 2).renderEnabled).toBe(false);
    // No culling pass runs between the move and the edit of a third cell.
    scene.camera2D.position.set(72, 36);
    map.setTile(3, 3, { frame: 1 });
    expect(sprite(0, 0).renderEnabled).toBe(false);
    expect(sprite(2, 2).renderEnabled).toBe(true);
    expect(sprite(3, 3).renderEnabled).toBe(false);
    // Edits made outside a Scene are culled on return even when the viewport is unchanged.
    scene.remove(map);
    map.setTile(0, 0, { frame: 1 });
    map.setTile(1, 1, { frame: 0 });
    scene.add(map);
    map.updateCulling(scene.camera2D);
    expect(sprite(1, 1).renderEnabled).toBe(false);
    expect(sprite(2, 2).renderEnabled).toBe(true);
    // Visibility is applied by rendering itself, so a sprite hidden during a full pass
    // shows again although the unchanged viewport skips the next pass.
    sprite(2, 2).visible = false;
    scene.camera2D.position.set(73, 37);
    map.updateCulling(scene.camera2D);
    sprite(2, 2).visible = true;
    map.updateCulling(scene.camera2D);
    expect(sprite(2, 2).renderEnabled).toBe(true);
  });

  it('matches a fresh full pass while a scrolling viewport re-culls only the cells it reaches', () => {
    const atlas = sheet();
    // A narrow viewport spans a few cells; a wide one also has cells inside both viewports.
    for (const { tile, view, path } of [
      {
        tile: 8,
        view: [40, 24],
        path: [
          [20, 12],
          [23, 15],
          [60, 30],
          [300, 290],
          [303, 287],
          [24, 300],
          [20, 12],
        ],
      },
      {
        tile: 4,
        view: [200, 160],
        path: [
          [150, 140],
          [153, 143],
          [149, 150],
          [190, 120],
          [330, 310],
          [331, 309],
          [60, 330],
          [150, 140],
        ],
      },
    ]) {
      const scene = new Scene();
      scene.camera2D.resize(view[0]!, view[1]!);
      const columns = 384 / tile;
      const filled = (): TileMap => {
        const map = new TileMap({
          columns,
          rows: columns,
          tileWidth: tile,
          tileHeight: tile,
          sheet: atlas,
        });
        for (let row = 0; row < columns; row++)
          for (let column = 0; column < columns; column++)
            if ((row * 7 + column) % 5) map.setTile(column, row, { frame: 0 });
        return map;
      };
      const enabled = (map: TileMap): string[] =>
        graphics(map)
          .filter((child) => child.renderEnabled)
          .map((child) => `${child.position.x},${child.position.y}`)
          .sort();
      const map = scene.add(filled());
      const reference = scene.add(filled());
      const expectFreshPass = (): void => {
        map.updateCulling(scene.camera2D);
        // A visibility change re-culls every cell of the reference.
        reference.visible = false;
        reference.updateCulling(scene.camera2D);
        reference.visible = true;
        reference.updateCulling(scene.camera2D);
        expect(enabled(map)).toEqual(enabled(reference));
      };
      for (const [x, y] of path) {
        scene.camera2D.position.set(x!, y!);
        expectFreshPass();
      }
      expect(enabled(map).length).toBeGreaterThan(0);
      // An edit far from both viewports, made after an unapplied move, stays culled.
      scene.camera2D.position.set(300, 300);
      map.setTile(1, 1, { frame: 1 });
      reference.setTile(1, 1, { frame: 1 });
      expect(
        graphics(map).find(
          (child) => child.position.x === tile && child.position.y === tile,
        )!.renderEnabled,
      ).toBe(false);
      expectFreshPass();
    }
  });

  it('picks the containing tile on both sides of every culling cell edge', () => {
    const scene = new Scene();
    scene.camera2D.resize(40, 24);
    const map = scene.add(
      new TileMap({
        columns: 48,
        rows: 48,
        tileWidth: 8,
        tileHeight: 8,
        sheet: sheet(),
      }),
    );
    for (let row = 0; row < 48; row++)
      for (let column = 0; column < 48; column++)
        map.setTile(column, row, { frame: 0 });
    map.updateCulling(scene.camera2D);
    const picked = (x: number, y: number): string => {
      const tile = map.pickTile(new Vector2(x, y));
      return tile ? `${tile.x},${tile.y}` : '-';
    };
    for (let edge = 0; edge <= 384; edge += 8) {
      // Last pixel before a tile edge, the edge itself, and the far tile's interior.
      for (const offset of [-0.25, 0, 3]) {
        const x = edge + offset,
          tile = Math.floor(x / 8);
        expect(picked(x, 383 - x)).toBe(
          tile < 0 || tile > 47 || 383 - x < 0
            ? '-'
            : `${tile},${Math.floor((383 - x) / 8)}`,
        );
      }
    }
    // Edits outside a Scene are not yet filed for culling; picking still finds them.
    scene.remove(map);
    map.clearTile(5, 5);
    expect(picked(44, 44)).toBe('-');
    expect(picked(52, 44)).toBe('6,5');
  });

  it('render collection culls exactly the maps currently registered in the Scene', () => {
    const scene = new Scene();
    scene.camera2D.resize(16, 8);
    scene.camera2D.position.set(8, 4);
    const map = scene.add(new TileMap(options()));
    map.setTile(0, 0, { frame: 0 });
    map.setTile(2, 2, { frame: 0 });
    const near = graphics(map).find((child) => child.position.x === 0)!;
    const far = graphics(map).find((child) => child.position.x === 64)!;
    const commands = new RenderCommandBuffer2D();
    // Only the render pass re-culls after this camera move.
    scene.camera2D.position.set(72, 36);
    collectRenderCommands2D(scene, 16, 8, commands);
    expect([near.renderEnabled, far.renderEnabled]).toEqual([false, true]);
    expect(commands.items.map((command) => command.object)).toEqual([far]);
    // A removed map keeps its last culling; re-adding registers it again.
    scene.remove(map);
    scene.camera2D.position.set(8, 4);
    collectRenderCommands2D(scene, 16, 8, commands);
    expect([near.renderEnabled, far.renderEnabled]).toEqual([false, true]);
    scene.add(map);
    scene.camera2D.position.set(9, 4);
    collectRenderCommands2D(scene, 16, 8, commands);
    expect([near.renderEnabled, far.renderEnabled]).toEqual([true, false]);
  });

  it('rejects excess grids and invalid elevations before changing cells', () => {
    expect(
      () => new TileMap({ ...options(), columns: world2dLimits.mapCells + 1 }),
    ).toThrow(RangeError);
    expect(() => new TileMap({ ...options(), tileHeight: 0 })).toThrow(
      RangeError,
    );
    expect(() => new IsometricMap({ ...options(), elevationStep: -1 })).toThrow(
      RangeError,
    );
    const map = new TileMap(options());
    const previous = map.getTile(0, 0);
    expect(() => map.setTile(0, 0, { elevation: NaN })).toThrow(RangeError);
    expect(map.getTile(0, 0)).toBe(previous);
  });

  it('rejects screen-space solid edits without publishing cells or child registrations', () => {
    const scene = new Scene();
    const map = new TileMap(options());
    map.space = 'screen';
    scene.add(map);
    map.setTile(0, 0, { frame: 0 });
    const previous = map.getTile(0, 0);
    const visual = graphics(map)[0]!;
    expect(() => map.setTile(0, 0, { frame: 1, solid: true })).toThrow();
    expect(map.getTile(0, 0)).toBe(previous);
    expect(visual.source).toEqual(map.sheet.getFrame(0));
    expect([...map.children].some((child) => child.collider)).toBe(false);
    expect(
      [...scene.objects].filter((object) => object instanceof GameObject),
    ).toEqual([map, visual]);
    scene.destroy();
  });
});

describe('scene-owned map collisions', () => {
  it.each(['orthogonal', 'isometric', 'custom'] as const)(
    'stops a falling body against %s solid geometry',
    (kind) => {
      const scene = new Scene();
      scene.physics.gravity.set(0, 100);
      const map =
        kind === 'isometric'
          ? new IsometricMap(options())
          : new TileMap(options());
      const custom =
        kind === 'custom'
          ? Colliders.polygon([
              [0, 0],
              [32, 0],
              [32, 16],
              [0, 16],
            ])
          : undefined;
      map.position.set(40, 80);
      scene.add(map);
      map.setTile(0, 0, { solid: true, collider: custom });
      const body = new GameObject();
      body.position.set(kind === 'isometric' ? 40 : 56, 40);
      body.collider = Colliders.circle(3);
      body.body = new RigidBody2D({ restitution: 0, friction: 0.5 });
      scene.add(body);
      for (let i = 0; i < 360; i++) scene.physics.update(1 / 120);
      expect(body.position.y).toBeGreaterThan(65);
      expect(body.position.y).toBeLessThan(81);
      expect(Math.abs(body.body.velocity.y)).toBeLessThan(3);
      map.clearTile(0, 0);
      for (let i = 0; i < 120; i++) scene.physics.update(1 / 120);
      expect(body.position.y).toBeGreaterThan(100);
      scene.destroy();
    },
  );

  it('rolls back collider replacement and new solid cells when transformed geometry is invalid', () => {
    const scene = new Scene();
    const map = new TileMap(options());
    map.scale.set(2, 1);
    scene.add(map);
    map.setTile(0, 0, { frame: 0, solid: true });
    const previous = map.getTile(0, 0);
    const colliderOwner = [...map.children].find((child) => child.collider)!;
    const collider = colliderOwner.collider;
    const invalid = Colliders.circle(3);
    expect(() => map.setTile(0, 0, { frame: 1, collider: invalid })).toThrow(
      RangeError,
    );
    expect(map.getTile(0, 0)).toBe(previous);
    expect(colliderOwner.collider).toBe(collider);
    expect(graphics(map)[0]!.source).toEqual(map.sheet.getFrame(0));
    expect(() =>
      map.setTile(1, 0, { frame: 0, solid: true, collider: invalid }),
    ).toThrow(RangeError);
    expect(map.getTile(1, 0).solid).toBe(false);
    expect([...map.children].filter((child) => child.collider)).toEqual([
      colliderOwner,
    ]);
    const hits = scene.physics.raycast(
      new Vector2(32, -20),
      new Vector2(0, 1),
      100,
    );
    expect(hits.map((hit) => hit.owner)).toEqual([colliderOwner]);
    scene.destroy();
  });

  it('updates collider geometry through hierarchy transforms and scene removal', () => {
    const scene = new Scene();
    const map = new IsometricMap(options());
    map.setTile(1, 1, { solid: true });
    scene.add(map);
    map.position.set(40, 50);
    map.rotation = 0.4;
    map.scale.set(2, 0.7);
    const center = map.updateWorldMatrix().transformPoint(new Vector2(0, 24));
    const hits = scene.physics.raycast(
      new Vector2(center.x, center.y - 100),
      new Vector2(0, 1),
      200,
    );
    expect(hits.some((hit) => hit.owner.parent === map)).toBe(true);
    scene.remove(map);
    expect(
      scene.physics.raycast(
        new Vector2(center.x, center.y - 100),
        new Vector2(0, 1),
        200,
      ),
    ).toEqual([]);
    map.destroy();
    scene.destroy();
  });
});
