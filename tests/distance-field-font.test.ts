import { describe, expect, it } from 'vitest';
import {
  BitmapFontAsset,
  BitmapFontLoader,
} from '../packages/assets/src/fonts/bitmap-font.js';
import {
  getTextureDistanceField,
  getDistanceFieldRasterScale,
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
