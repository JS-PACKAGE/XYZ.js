import { describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Sprite } from '../packages/core/src/sprite.js';
import {
  NineSlice,
  SpriteFont,
  SpriteSheet,
  SpriteText,
} from '../packages/core/src/graphics2d/index.js';
import { graphics2dLimits } from '../src/data/graphics2d.js';

function texture(width = 32, height = 16): Texture {
  return new Texture({
    width,
    height,
    close: vi.fn(),
  } as unknown as ImageBitmap);
}
function sprites(group: SpriteText | NineSlice): Sprite[] {
  return [...group.children].filter(
    (child): child is Sprite => child instanceof Sprite && child.visible,
  );
}

describe('atlas graphics', () => {
  it('snapshots sparse regions and respects grid origin, spacing and bounds', () => {
    const image = texture();
    const region = { x: 7, y: 3, width: 9, height: 6 };
    const sheet = new SpriteSheet(image, [region]);
    region.width = 1;
    const frame = sheet.getFrame(0);
    expect(() => Object.assign(frame, { x: 0 })).toThrow(TypeError);
    expect(sheet.createSprite(0).source).toEqual({
      x: 7,
      y: 3,
      width: 9,
      height: 6,
    });
    const grid = SpriteSheet.grid(image, {
      frameWidth: 5,
      frameHeight: 4,
      origin: [2, 1],
      spacing: [1, 2],
      columns: 3,
      rows: 2,
    });
    expect(grid.getFrame(5)).toEqual({ x: 14, y: 7, width: 5, height: 4 });
    expect(() => grid.getFrame(-1)).toThrow(RangeError);
    expect(() =>
      SpriteSheet.grid(image, { frameWidth: 5, frameHeight: 4, columns: 8 }),
    ).toThrow(RangeError);
    expect(
      () => new SpriteSheet(image, [{ x: 31, y: 0, width: 2, height: 1 }]),
    ).toThrow(RangeError);
  });

  it('maps Unicode, case and fallback with multiline alignment and transactional replacement', () => {
    const image = texture();
    const sheet = SpriteSheet.grid(image, {
      frameWidth: 8,
      frameHeight: 8,
      columns: 3,
      rows: 1,
    });
    const font = new SpriteFont(sheet, {
      alphabet: 'A😀?',
      lineHeight: 10,
      advance: 9,
      caseInsensitive: true,
      fallback: '?',
    });
    const text = new SpriteText(font, 'a😀\n!', {
      align: 'center',
      letterSpacing: 1,
      lineSpacing: 2,
    });
    expect(
      sprites(text).map((g) => [g.source!.x, g.position.x, g.position.y]),
    ).toEqual([
      [0, -9, 0],
      [8, 1, 0],
      [16, -4, 12],
    ]);
    const old = sprites(text);
    expect(() => text.setText('a'.repeat(graphics2dLimits.glyphs + 1))).toThrow(
      RangeError,
    );
    expect(text.text).toBe('a😀\n!');
    expect(sprites(text)).toEqual(old);
    text.setText('?');
    expect(old[0]!.destroyed).toBe(false);
    expect(old.slice(1).every((g) => g.destroyed)).toBe(true);
    text.destroy();
    expect(image.destroyed).toBe(false);
    expect(
      () =>
        new SpriteFont(sheet, {
          alphabet: 'Aa?',
          lineHeight: 10,
          caseInsensitive: true,
        }),
    ).toThrow(RangeError);
    const strict = new SpriteText(
      new SpriteFont(sheet, { alphabet: 'A😀?', lineHeight: 10 }),
      'A😀',
    );
    const reused = sprites(strict);
    expect(() => strict.setText('😀!')).toThrow(RangeError);
    expect(strict.text).toBe('A😀');
    expect(
      sprites(strict).map((g) => [g.source!.x, g.position.x, g.position.y]),
    ).toEqual([
      [0, 0, 0],
      [8, 8, 0],
    ]);
    strict.setText('😀\nA');
    expect(sprites(strict)).toEqual(reused);
    expect(
      sprites(strict).map((g) => [g.source!.x, g.position.x, g.position.y]),
    ).toEqual([
      [8, 0, 0],
      [0, 0, 10],
    ]);
  });

  it('keeps stretch corners fixed, shrinks opposing margins proportionally and reuses children', () => {
    const image = texture(12, 12);
    const nine = new NineSlice(image, {
      left: 3,
      right: 3,
      top: 3,
      bottom: 3,
      width: 24,
      height: 20,
    });
    const first = sprites(nine)[0]!;
    expect([first.width * first.scale.x, first.height * first.scale.y]).toEqual(
      [3, 3],
    );
    const identities = [...nine.children];
    nine.resize(4, 2);
    expect([...nine.children]).toEqual(identities);
    expect(
      sprites(nine).map((s) => [
        s.position.x,
        s.position.y,
        s.width * s.scale.x,
        s.height * s.scale.y,
      ]),
    ).toEqual([
      [0, 0, 2, 1],
      [2, 0, 2, 1],
      [0, 1, 2, 1],
      [2, 1, 2, 1],
    ]);
    const bounds = nine.getLocalBounds();
    expect(bounds.x).toBe(0);
    expect(bounds.y).toBe(0);
    expect(bounds.width).toBeCloseTo(4);
    expect(bounds.height).toBeCloseTo(2);
    nine.resize(24, 20);
    expect([...nine.children]).toEqual(identities);
    nine.destroy();
    expect(identities.every((child) => child.destroyed)).toBe(true);
    expect(image.destroyed).toBe(false);
  });

  it('clips last tiles and fits complete tiles without drawing omitted center', () => {
    const image = texture(12, 12);
    const tiled = new NineSlice(image, {
      left: 3,
      right: 3,
      top: 3,
      bottom: 3,
      width: 16.5,
      height: 12,
      mode: 'tile',
      drawCenter: false,
    });
    const top = sprites(tiled).filter(
      (s) => s.position.y === 0 && s.position.x >= 3 && s.position.x < 13.5,
    );
    expect(
      top.map((s) => [s.position.x, s.source!.width, s.width * s.scale.x]),
    ).toEqual([
      [3, 6, 6],
      [9, 4.5, 4.5],
    ]);
    expect(
      sprites(tiled).some(
        (s) => s.position.y === 3 && s.position.x >= 3 && s.position.x < 13.5,
      ),
    ).toBe(false);
    const fit = new NineSlice(image, {
      left: 3,
      right: 3,
      top: 3,
      bottom: 3,
      width: 16.5,
      height: 12,
      mode: 'tile-fit',
    });
    expect(
      sprites(fit)
        .filter(
          (s) => s.position.y === 0 && s.position.x >= 3 && s.position.x < 13.5,
        )
        .map((s) => [s.source!.width, s.width * s.scale.x]),
    ).toEqual([
      [6, 5.25],
      [6, 5.25],
    ]);
    const before = sprites(tiled);
    expect(() =>
      tiled.resize(graphics2dLimits.dimension, graphics2dLimits.dimension),
    ).toThrow(RangeError);
    expect(tiled.width).toBe(16.5);
    expect(sprites(tiled)).toEqual(before);
  });
});
