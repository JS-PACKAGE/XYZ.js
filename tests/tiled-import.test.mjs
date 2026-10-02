import { describe, expect, it, vi } from 'vitest';
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
import { Sprite } from '../packages/core/src/sprite.js';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
const map = JSON.parse(
  readFileSync(
    new URL('./fixtures/tiled/orthogonal.tmj', import.meta.url),
    'utf8',
  ),
);
const set = JSON.parse(
  readFileSync(
    new URL('./fixtures/tiled/terrain.tsj', import.meta.url),
    'utf8',
  ),
);
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
describe('finite Tiled import', () => {
  it('preserves GID transforms, atlas regions, colliders and borrower-safe edits', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async (url) =>
        new globalThis.Response(
          JSON.stringify(String(url).endsWith('.tsj') ? set : map),
        ),
    );
    const pool = new ResourcePool(new AssetLoader());
    const texture = new Texture({ kind: 'native', width: 32, height: 16 });
    try {
      const asset = await loadTiledMap(
        pool,
        'https://example.test/orthogonal.tmj',
        { textures: new Map([['https://example.test/terrain.png', texture]]) },
      );
      const content = new TiledContent(asset),
        ts = asset.data.tilesets[0],
        plane = content.tileMaps.get(1).get(ts);
      const sprites = [...plane.children].filter((c) => c instanceof Sprite);
      expect(sprites[0].source).toMatchObject({
        x: 0,
        y: 0,
        width: 16,
        height: 16,
      });
      expect(sprites[1].scale.x).toBe(-1);
      expect(sprites[2].scale.y).toBe(-1);
      expect(sprites[3].rotation).toBe(Math.PI / 2);
      expect(plane.getTile(0, 0).solid).toBe(true);
      expect(
        [...content.layers.get(2).children][0].collider.vertices,
      ).toHaveLength(4);
      content.setGid(1, 0, 0, 2);
      expect(plane.getTile(0, 0).solid).toBe(false);
      expect(sprites[0].source.x).toBe(16);
      content.setGid(1, 1, 0, 0);
      expect(plane.getTile(1, 0).frame).toBeUndefined();
      content.destroy();
      expect(texture.destroyed).toBe(false);
      expect(asset.scope.destroyed).toBe(true);
    } finally {
      globalThis.fetch = original;
      pool.destroy();
      texture.destroy();
    }
  });
  it('rejects unsupported and unresolved input rather than silently dropping it', () => {
    const ts = parseTiledTileset(set, 1);
    expect(() =>
      parseTiledMap({ ...map, orientation: 'isometric' }, [ts]),
    ).toThrow('map.orientation');
    expect(() => parseTiledMap({ ...map, infinite: true }, [ts])).toThrow();
    const bad = globalThis.structuredClone(map);
    bad.layers[0].data[0] = 7;
    expect(() => parseTiledMap(bad, [ts])).toThrow('unresolved GID');
  });
  it('reclaims a decoded bitmap that arrives after cancellation', async () => {
    const originalFetch = globalThis.fetch,
      originalDecode = globalThis.createImageBitmap;
    const decode = deferred(),
      started = deferred(),
      disposed = deferred();
    const close = vi.fn(() => disposed.resolve());
    globalThis.fetch = vi.fn(
      async (url) =>
        new globalThis.Response(
          String(url).endsWith('.png')
            ? new Uint8Array([137, 80, 78, 71])
            : JSON.stringify(String(url).endsWith('.tsj') ? set : map),
        ),
    );
    globalThis.createImageBitmap = vi.fn(() => {
      started.resolve();
      return decode.promise;
    });
    const pool = new ResourcePool(new AssetLoader()),
      controller = new globalThis.AbortController();
    try {
      const pending = loadTiledMap(
        pool,
        'https://example.test/orthogonal.tmj',
        { signal: controller.signal },
      );
      const rejection = expect(pending).rejects.toBeDefined();
      await started.promise;
      controller.abort();
      decode.resolve({ width: 32, height: 16, close });
      await rejection;
      await disposed.promise;
      expect(close).toHaveBeenCalledTimes(1);
    } finally {
      pool.destroy();
      globalThis.fetch = originalFetch;
      globalThis.createImageBitmap = originalDecode;
    }
  });
});
