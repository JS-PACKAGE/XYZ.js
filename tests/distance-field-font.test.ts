import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BitmapFontAsset,
  BitmapFontLoader,
} from '../packages/assets/src/fonts/bitmap-font.js';
import {
  getDistanceFieldCanvas,
  getTextureDistanceField,
  getDistanceFieldRasterScale,
  registerTextureDistanceField,
} from '../packages/assets/src/fonts/distance-field.js';
import { Texture } from '../packages/assets/src/texture.js';
import {
  SpriteFont,
  SpriteText,
} from '../packages/core/src/graphics2d/sprite-font.js';
import type { Sprite } from '../packages/core/src/sprite.js';

const descriptor = {
  info: { size: 16 },
  common: {
    lineHeight: 20,
    base: 15,
    scaleW: 32,
    scaleH: 32,
    pages: 1,
    packed: 0,
  },
  pages: ['page-0.png'],
  chars: [
    {
      id: 65,
      page: 0,
      x: 1,
      y: 1,
      width: 16,
      height: 18,
      xoffset: -3,
      yoffset: -2,
      xadvance: 12,
      chnl: 15,
    },
  ],
  kernings: [],
  distanceField: { fieldType: 'msdf', distanceRange: 8 },
};

describe('distance-field font import and metrics ownership', () => {
  it('quantizes fallback scale and caps aggregate native page pixels', () => {
    const texture = new Texture({ kind: 'native', width: 2048, height: 2048 });
    expect(getDistanceFieldRasterScale(texture, 1.1)).toBe(2);
    expect(getDistanceFieldRasterScale(texture, 64)).toBe(2);
    expect(getDistanceFieldRasterScale(texture, 0.3)).toBe(0.5);
    expect(() => getDistanceFieldRasterScale(texture, NaN)).toThrow();
    texture.destroy();
    expect(() => getDistanceFieldRasterScale(texture, 1)).toThrow();
  });
  it('preserves border-offset metrics through real SpriteText layout and page ownership', () => {
    const parsed = BitmapFontLoader.parse(JSON.stringify(descriptor), 'json');
    const texture = new Texture({ kind: 'native', width: 32, height: 32 });
    const font = new BitmapFontAsset([texture], parsed);
    expect(getTextureDistanceField(texture)).toEqual({
      type: 'msdf',
      range: 8,
    });
    const spriteFont = new SpriteFont(font);
    const text = new SpriteText(spriteFont, 'AA');
    const children = [...text.children];
    expect(children[0]!.position.x).toBe(-3);
    expect(children[1]!.position.x).toBe(9);
    text.destroy();
    expect(texture.destroyed).toBe(false);
    font.destroy();
    expect(texture.destroyed).toBe(true);
    expect(() => spriteFont.assertAvailable()).toThrow(/destroyed/);
  });
  it('applies kerning only in its authored order and rejects text once any page is destroyed', () => {
    const parsed = BitmapFontLoader.parse(
      JSON.stringify({
        ...descriptor,
        common: { ...descriptor.common, pages: 2 },
        pages: ['page-0.png', 'page-1.png'],
        chars: [
          descriptor.chars[0],
          { ...descriptor.chars[0], id: 86, page: 1 },
        ],
        kernings: [{ first: 65, second: 86, amount: -4 }],
      }),
      'json',
    );
    const pages = [0, 1].map(
      () => new Texture({ kind: 'native', width: 32, height: 32 }),
    );
    const spriteFont = new SpriteFont(new BitmapFontAsset(pages, parsed));
    const x = (text: string) =>
      [...new SpriteText(spriteFont, text).children].map(
        (glyph) => glyph.position.x,
      );
    expect(x('AV')).toEqual([-3, 5]);
    expect(x('VA')).toEqual([-3, 9]);
    // Reused glyph sprites follow their glyph onto another page.
    const label = new SpriteText(spriteFont, 'A');
    label.setText('V');
    expect(([...label.children][0] as Sprite).texture).toBe(pages[1]);
    label.setText('A');
    expect(([...label.children][0] as Sprite).texture).toBe(pages[0]);
    pages[1]!.destroy();
    expect(() => new SpriteText(spriteFont, 'A')).toThrow(/destroyed/);
  });
  it('rejects invalid field profiles, clipped glyph borders and foreign channels', () => {
    for (const field of [
      null,
      { fieldType: 'rgb', distanceRange: 8 },
      { fieldType: 'sdf', distanceRange: 0 },
      { fieldType: 'msdf', distanceRange: 257 },
    ])
      expect(() =>
        BitmapFontLoader.parse(
          JSON.stringify({ ...descriptor, distanceField: field }),
          'json',
        ),
      ).toThrow();
    expect(() =>
      BitmapFontLoader.parse(
        JSON.stringify({
          ...descriptor,
          chars: [{ ...descriptor.chars[0], x: 30 }],
        }),
        'json',
      ),
    ).toThrow(/exceeds/);
    expect(() =>
      BitmapFontLoader.parse(
        JSON.stringify({
          ...descriptor,
          chars: [{ ...descriptor.chars[0], chnl: 1 }],
        }),
        'json',
      ),
    ).toThrow(/Channel/);
  });
});

/** Per-tap clamped bilinear reference, written independently of the table-driven raster. */
function referenceAlpha(
  pixels: Uint8ClampedArray,
  size: { width: number; height: number },
  scale: number,
  profile: { type: 'sdf' | 'msdf'; range: number },
): number[] {
  const width = Math.ceil(size.width * scale),
    height = Math.ceil(size.height * scale);
  const read = (x: number, y: number, channel: number): number =>
    pixels[
      (Math.max(0, Math.min(size.height - 1, y)) * size.width +
        Math.max(0, Math.min(size.width - 1, x))) *
        4 +
        channel
    ]! / 255;
  const sample = (ix: number, iy: number, fx: number, fy: number, c: number) =>
    (read(ix, iy, c) * (1 - fx) + read(ix + 1, iy, c) * fx) * (1 - fy) +
    (read(ix, iy + 1, c) * (1 - fx) + read(ix + 1, iy + 1, c) * fx) * fy;
  const alpha: number[] = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const px = (x + 0.5) / scale - 0.5,
        py = (y + 0.5) / scale - 0.5,
        ix = Math.floor(px),
        iy = Math.floor(py);
      const red = sample(ix, iy, px - ix, py - iy, 0);
      let value = red;
      if (profile.type === 'msdf') {
        const green = sample(ix, iy, px - ix, py - iy, 1),
          blue = sample(ix, iy, px - ix, py - iy, 2);
        value = Math.max(
          Math.min(red, green),
          Math.min(Math.max(red, green), blue),
        );
      }
      alpha.push(
        Math.round(
          Math.max(
            0,
            Math.min(1, (value - 0.5) * profile.range * scale + 0.5),
          ) * 255,
        ),
      );
    }
  return alpha;
}

describe('distance-field fallback raster', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('samples every channel bilinearly with clamped page edges', () => {
    const size = { width: 5, height: 3 };
    const pixels = new Uint8ClampedArray(size.width * size.height * 4);
    let seed = 12345;
    for (let i = 0; i < pixels.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels[i] = seed >>> 24;
    }
    // The first canvas holds the source page, the second receives the raster.
    const canvases: { data?: Uint8ClampedArray }[] = [];
    vi.stubGlobal('document', {
      createElement: () => {
        const canvas = {
          width: 0,
          height: 0,
          data: undefined as Uint8ClampedArray | undefined,
          getContext: () => ({
            drawImage: () => undefined,
            getImageData: () => ({ data: pixels }),
            createImageData: (width: number, height: number) => ({
              data: new Uint8ClampedArray(width * height * 4),
            }),
            putImageData: (image: { data: Uint8ClampedArray }) => {
              canvas.data = image.data;
            },
          }),
        };
        canvases.push(canvas);
        return canvas;
      },
    });
    for (const profile of [
      { type: 'sdf', range: 4 },
      { type: 'msdf', range: 6 },
    ] as const)
      for (const scale of [0.5, 1, 1.5, 2]) {
        const texture = new Texture({
          ...size,
          close: () => undefined,
        } as unknown as ImageBitmap);
        registerTextureDistanceField(texture, profile);
        canvases.length = 0;
        getDistanceFieldCanvas(texture, scale);
        const output = canvases[1]!.data!;
        const alpha = Array.from(
          { length: output.length / 4 },
          (_, i) => output[i * 4 + 3]!,
        );
        expect(alpha).toEqual(referenceAlpha(pixels, size, scale, profile));
        expect(
          output.filter((_, i) => i % 4 !== 3).every((v) => v === 255),
        ).toBe(true);
      }
  });
});
