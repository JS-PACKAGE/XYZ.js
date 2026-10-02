/* global URL, Response, structuredClone */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import {
  AssetLoader,
  ResourcePool,
  Texture,
} from '../packages/assets/src/index.js';
import { loadTiledMap } from '../packages/assets/src/tiled-loader.js';
import {
  parseTiledMap,
  parseTiledTileset,
} from '../packages/assets/src/tiled-parser.js';
import { TiledContent } from '../packages/core/src/maps2d/tiled-map.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { GameObject } from '../packages/core/src/game-object.js';
import {
  Colliders,
  RigidBody2D,
} from '../packages/core/src/physics2d/index.js';
import { Vector2 } from '../packages/math/src/index.js';
const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/tiled/${name}`, import.meta.url), 'utf8'),
  );
const profile = fixture('infinite.tmj');
const atlas = fixture('animated.tsj');
async function withAsset(map, run) {
  const original = globalThis.fetch;
  const pool = new ResourcePool(new AssetLoader());
  const texture = new Texture({ kind: 'native', width: 32, height: 16 });
  globalThis.fetch = vi.fn(
    async (url) =>
      new Response(
        JSON.stringify(
          String(url).endsWith('.tmj')
            ? map
            : String(url).endsWith('.tsj')
              ? atlas
              : fixture('templates/wall.tx'),
        ),
      ),
  );
  try {
    const asset = await loadTiledMap(
      pool,
      'https://example.test/infinite.tmj',
      {
        textures: new Map([['https://example.test/terrain.png', texture]]),
      },
    );
    try {
      await run(asset);
    } finally {
      asset.destroy();
    }
    expect(texture.destroyed).toBe(false);
  } finally {
    globalThis.fetch = original;
    pool.destroy();
    texture.destroy();
  }
}
describe('practical Tiled profiles', () => {
  it.each([
    ['', 'AQAAAAIAAAABAACAAAAAAA=='],
    ['gzip', 'H4sIAAAAAAAAEwXBAQEAAAABoFhuugqKMDhX9KTTEAAAAA=='],
    ['zlib', 'eJwFwQEBAAAAAaBYbroKijA4AsAAhQ=='],
  ])(
    'imports %s negative chunks with inherited groups, templates, animation and physics',
    async (compression, data) => {
      const map = structuredClone(profile);
      const tileLayer = map.layers[0].layers[0].layers[0];
      tileLayer.compression = compression;
      tileLayer.chunks[0].data = data;
      await withAsset(map, (asset) => {
        const content = new TiledContent(asset);
        const scene = new Scene();
        try {
          scene.add(content);
          scene.physics.gravity.set(0, 100);
          const plane = content.tileMaps.get(12).get(asset.data.tilesets[0]);
          const sprite = [...plane.children].find(
            (child) => child instanceof Sprite,
          );
          expect(plane.tileToWorld(-2, -1)).toEqual(new Vector2(16, 16));
          expect(plane.worldToTile(new Vector2(17, 17))).toEqual(
            new Vector2(-2, -1),
          );
          expect(plane.pickTile(new Vector2(17, 17))).toEqual(
            new Vector2(-2, -1),
          );
          expect(sprite.worldOpacity).toBe(0.25);
          content.layers.get(10).visible = false;
          expect(sprite.worldVisible).toBe(false);
          content.layers.get(10).visible = true;
          const object = [...content.layers.get(13).children][0];
          expect(object.collider.sensor).toBe(false);
          expect(object.toWorld(new Vector2())).toEqual(new Vector2(64, 32));
          scene.beginObjectFrame();
          scene.advanceFrameAnimations(0.11, () => true);
          expect(sprite.source.x).toBe(16);
          sprite.animation.pause();
          scene.advanceFrameAnimations(0.2, () => true);
          expect(sprite.source.x).toBe(16);
          sprite.animation.play();
          scene.advanceFrameAnimations(0.1, () => true);
          expect(sprite.source.x).toBe(0);
          const body = new GameObject();
          body.position.set(24, 0);
          body.collider = Colliders.circle(3);
          body.body = new RigidBody2D({ restitution: 0 });
          scene.add(body);
          for (let i = 0; i < 240; i++) scene.physics.update(1 / 120);
          expect(body.position.y).toBeGreaterThan(12);
          expect(body.position.y).toBeLessThan(14);
          const snapshot = plane.getTile(-2, -1);
          expect(() => content.setGid(12, -2, -1, 99)).toThrow();
          expect(plane.getTile(-2, -1)).toBe(snapshot);
          content.setGid(12, -2, -1, 2);
          content.setGid(12, -2, 0, 2);
          expect(sprite.animation).toBeUndefined();
          for (let i = 0; i < 120; i++) scene.physics.update(1 / 120);
          expect(body.position.y).toBeGreaterThan(40);
          scene.camera2D.position.set(40, 20);
          const image = [...content.layers.get(14).children][0];
          image.updateWorldMatrix();
          expect(content.layers.get(14).updateWorldMatrix().elements[6]).toBe(
            20,
          );
          content.destroy();
          expect(
            scene.physics
              .raycast(new Vector2(64, 0), new Vector2(0, 1), 100)
              .filter((hit) => hit.owner === object),
          ).toEqual([]);
          expect(asset.scope.destroyed).toBe(true);
        } finally {
          scene.destroy();
        }
      });
    },
  );
  it('keeps distant sparse chunks editable without allocating rectangular gaps', async () => {
    const map = structuredClone(profile);
    const layer = map.layers[0].layers[0].layers[0];
    delete layer.encoding;
    delete layer.compression;
    layer.chunks = [
      { x: -1000000, y: -1000000, width: 1, height: 1, data: [2] },
      { x: 1000000, y: 1000000, width: 1, height: 1, data: [2] },
    ];
    await withAsset(map, (asset) => {
      const content = new TiledContent(asset);
      const plane = content.tileMaps.get(12).get(asset.data.tilesets[0]);
      expect(plane.getTile(-1000000, -1000000).frame).toBe(1);
      content.setGid(12, 1000000, 1000000, 0);
      expect(plane.getTile(1000000, 1000000).frame).toBeUndefined();
      content.destroy();
    });
  });
  it('rejects overlapping chunks, malformed base64 and declared cell budget overflow', () => {
    const map = structuredClone(profile);
    const layer = map.layers[0].layers[0].layers[0];
    delete layer.compression;
    layer.chunks[0].data = 'AQAAAAIAAAABAACAAAAAAA==';
    const ts = parseTiledTileset(atlas, 1);
    layer.chunks.push(structuredClone(layer.chunks[0]));
    expect(() => parseTiledMap(map, [ts])).toThrow();
    layer.chunks.pop();
    layer.chunks[0].data = '!!!!';
    expect(() => parseTiledMap(map, [ts])).toThrow();
    layer.chunks[0].width = 262145;
    expect(() => parseTiledMap(map, [ts])).toThrow();
  });
  it('rejects native decompression bombs before acquiring any images', async () => {
    const map = structuredClone(profile);
    const layer = map.layers[0].layers[0].layers[0];
    layer.chunks = [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        data: gzipSync(new Uint8Array(1024 * 1024)).toString('base64'),
      },
    ];
    const original = globalThis.fetch;
    const pool = new ResourcePool(new AssetLoader());
    globalThis.fetch = vi.fn(
      async (url) =>
        new Response(
          JSON.stringify(String(url).endsWith('.tmj') ? map : atlas),
        ),
    );
    try {
      await expect(
        loadTiledMap(pool, 'https://example.test/infinite.tmj'),
      ).rejects.toThrow();
      expect(
        globalThis.fetch.mock.calls
          .map((call) => String(call[0]))
          .some((url) => url.endsWith('.png')),
      ).toBe(false);
    } finally {
      globalThis.fetch = original;
      pool.destroy();
    }
  });
  it('rejects recursive templates without waiting on their cached promise', async () => {
    const original = globalThis.fetch;
    const pool = new ResourcePool(new AssetLoader());
    globalThis.fetch = vi.fn(
      async (url) =>
        new Response(
          JSON.stringify(
            String(url).endsWith('.tmj')
              ? profile
              : String(url).endsWith('.tsj')
                ? atlas
                : { object: { template: 'wall.tx' } },
          ),
        ),
    );
    try {
      await expect(
        loadTiledMap(pool, 'https://example.test/infinite.tmj'),
      ).rejects.toThrow();
    } finally {
      globalThis.fetch = original;
      pool.destroy();
    }
  });
});
