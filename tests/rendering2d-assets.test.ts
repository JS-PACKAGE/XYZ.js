import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AssetError,
  AssetLoader,
  AssetManifest,
  BitmapFontLoader,
  Texture,
  TextureView2D,
} from '../packages/assets/src/index.js';
import { AtlasLoader } from '../packages/core/src/graphics2d/atlas-loader.js';
import { ColorMatrixFilter2D } from '../packages/core/src/rendering2d/filters2d.js';
import { Geometry2D } from '../packages/core/src/rendering2d/geometry2d.js';
import { PerspectiveQuad2D } from '../packages/core/src/rendering2d/mesh2d.js';

const bitmaps: { closed: number }[] = [];
function stubImages(width = 32, height = 32): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(new Uint8Array([1]), { status: 200 })),
  );
  vi.stubGlobal('createImageBitmap', async () => {
    const bitmap = {
      width,
      height,
      closed: 0,
      close() {
        this.closed++;
      },
    };
    bitmaps.push(bitmap);
    return bitmap;
  });
}
afterEach(() => {
  vi.unstubAllGlobals();
  bitmaps.length = 0;
});

/** Drains chained promise reactions without a wall clock. */
async function flush(): Promise<void> {
  for (let turn = 0; turn < 16; turn++) await Promise.resolve();
}

describe('unique texture acquisition ownership', () => {
  it('never leaks a decoded bitmap however late cancellation lands', async () => {
    // Sweep the abort across every microtask boundary between decoding and publication.
    for (let depth = 0; depth < 10; depth++) {
      bitmaps.length = 0;
      const abort = new AbortController();
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(new Uint8Array([1]))),
      );
      vi.stubGlobal('createImageBitmap', async () => {
        const bitmap = {
          width: 2,
          height: 2,
          closed: 0,
          close() {
            this.closed++;
          },
        };
        bitmaps.push(bitmap);
        const schedule = (remaining: number): void => {
          queueMicrotask(() =>
            remaining ? schedule(remaining - 1) : abort.abort('late'),
          );
        };
        schedule(depth);
        return bitmap;
      });
      const loader = new AssetLoader();
      let texture: Texture | undefined;
      try {
        texture = await loader.loadTextureOwned('https://example.test/a.png', {
          signal: abort.signal,
        });
      } catch (error) {
        expect(error).toBe('late');
      }
      await flush();
      // Either the caller now owns the bitmap or the loader already closed it: never a leak.
      texture?.destroy();
      expect(
        bitmaps.map((bitmap) => bitmap.closed),
        `abort depth ${depth}`,
      ).toEqual([1]);
      loader.destroy();
    }
  });
});

describe('TextureView2D', () => {
  it('rejects trims that disagree with the unpacked frame and views outside the source', () => {
    stubImages();
    const source = new Texture({
      width: 32,
      height: 32,
      close() {},
    } as unknown as ImageBitmap);
    expect(
      () =>
        new TextureView2D(source, {
          frame: { x: 30, y: 0, width: 8, height: 8 },
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new TextureView2D(source, {
          frame: { x: 0, y: 0, width: 8, height: 4 },
          rotation: 90,
          originalSize: [8, 8],
          trim: { x: 0, y: 0, width: 8, height: 4 },
        }),
    ).toThrow(RangeError);
    const view = new TextureView2D(source, {
      frame: { x: 0, y: 0, width: 8, height: 4 },
      rotation: 90,
      originalSize: [10, 10],
      trim: { x: 1, y: 2, width: 4, height: 8 },
      resolution: 2,
    });
    expect([view.width, view.height]).toEqual([5, 5]);
  });
});

describe('bounded parsers and transactional loaders', () => {
  it('reports malformed bitmap-font kerning records as domain errors', () => {
    const json = JSON.stringify({
      distanceField: undefined,
      info: { size: 10 },
      common: { lineHeight: 10, base: 8, scaleW: 16, scaleH: 16, pages: 1 },
      pages: ['a.png'],
      chars: [
        {
          id: 65,
          x: 0,
          y: 0,
          width: 4,
          height: 4,
          xoffset: 0,
          yoffset: 0,
          xadvance: 5,
          page: 0,
        },
      ],
      kernings: [null],
    });
    expect(() => BitmapFontLoader.parse(json, 'json')).toThrow(AssetError);
    // Numeric strings are not coerced into metrics.
    expect(() =>
      BitmapFontLoader.parse(
        json
          .replace('"kernings":[null]', '"kernings":[]')
          .replace('"size":10', '"size":"10"'),
        'json',
      ),
    ).toThrow(AssetError);
  });

  it('frees every already-acquired atlas page when a later page fails validation', async () => {
    stubImages(16, 16);
    const page = (name: string, image: string): string =>
      JSON.stringify({
        frames: { [name]: { frame: { x: 0, y: 0, w: 4, h: 4 } } },
        meta: {
          image,
          related_multi_packs: image === 'p0.png' ? ['p1.json'] : undefined,
        },
      });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('atlas.json'))
          return new Response(page('same', 'p0.png'));
        if (url.endsWith('p1.json'))
          return new Response(page('same', 'p1.png'));
        return new Response(new Uint8Array([1]));
      }),
    );
    await expect(
      new AtlasLoader('https://example.test/').load('atlas.json'),
    ).rejects.toThrow(AssetError);
    expect(bitmaps.length).toBeGreaterThan(0);
    expect(bitmaps.every((bitmap) => bitmap.closed === 1)).toBe(true);
  });

  it('releases owned manifest acquisitions when the compiled batch fails', async () => {
    stubImages();
    const disposed: unknown[] = [];
    const loader = new AssetLoader();
    const manifest = new AssetManifest({
      entries: [
        {
          aliases: 'image',
          type: 'texture',
          url: 'https://example.test/a.png',
          owned: true,
        },
        {
          aliases: 'custom',
          type: 'custom',
          owned: true,
          load: async () => ({ id: 1 }),
          dispose: (value) => {
            disposed.push(value);
          },
        },
        {
          aliases: 'bad',
          type: 'custom',
          owned: false,
          load: async () => {
            throw new Error('boom');
          },
        },
      ],
    });
    await expect(
      manifest.compile(loader, ['image', 'custom', 'bad']).load(),
    ).rejects.toThrow('boom');
    await flush();
    expect(disposed).toEqual([{ id: 1 }]);
    expect(bitmaps.every((bitmap) => bitmap.closed === 1)).toBe(true);
    expect(() => manifest.get('image', 'texture')).toThrow(AssetError);
    loader.destroy();
  });
});

describe('native geometry validation', () => {
  it('rejects oversized filter arrays before reading them and out-of-range mesh indices', () => {
    const huge = { length: 0xffffffff };
    expect(() => new ColorMatrixFilter2D(huge as ArrayLike<number>)).toThrow(
      RangeError,
    );
    expect(
      () =>
        new Geometry2D({
          positions: [0, 0, 1, 0, 0, 1],
          uvs: [0, 0, 1, 0, 0, 1],
          indices: [0, 1, 3],
        }),
    ).toThrow(RangeError);
  });

  it('keeps the previous projective quad when a replacement is invalid', () => {
    stubImages();
    const texture = new Texture({
      width: 8,
      height: 8,
      close() {},
    } as unknown as ImageBitmap);
    const quad = new PerspectiveQuad2D({
      texture,
      corners: [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    });
    const before = Array.from(quad.geometry.positions);
    const version = quad.geometry.version;
    expect(() =>
      quad.setCorners([
        [0, 0],
        [10, 10],
        [10, 0],
        [0, 10],
      ]),
    ).toThrow(RangeError);
    expect(() =>
      quad.setCorners([
        [0, 0],
        [10, 0],
        [10, 0],
        [0, 10],
      ]),
    ).toThrow(RangeError);
    expect(Array.from(quad.geometry.positions)).toEqual(before);
    expect(quad.geometry.version).toBe(version);
  });
});
