import { describe, expect, it, vi } from 'vitest';
import { AssetError, Texture } from '../packages/assets/src/index.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector2 } from '../packages/math/src/index.js';

function texture(): Texture {
  return new Texture({
    width: 48,
    height: 24,
    close: vi.fn(),
  } as unknown as ImageBitmap);
}

describe('Sprite facade and shared textures', () => {
  it('keeps texture ownership separate from scene and individual sprites', () => {
    const shared = texture();
    const scene = new Scene();
    const first = scene.add(new Sprite({ texture: shared }));
    const second = scene.add(new Sprite({ texture: shared, anchor: [0, 0] }));
    expect(first.position).toBe(first.transform.position);
    expect(first.anchor).toEqual(new Vector2(0.5, 0.5));
    expect(second.anchor).toEqual(new Vector2(0, 0));
    first.destroy();
    expect(shared.destroyed).toBe(false);
    expect((second.texture as Texture).image.width).toBe(48);
    scene.destroy();
    expect(second.destroyed).toBe(true);
    expect(shared.destroyed).toBe(false);
    shared.destroy();
    expect(shared.image.close).toHaveBeenCalledOnce();
    expect(() => new Sprite({ texture: shared })).toThrow(AssetError);
  });

  it('keeps transform facade and validates finite constructor and setter values', () => {
    const image = texture();
    const sprite = new Sprite({
      texture: image,
      position: [7, 11],
      rotation: Math.PI / 4,
      scale: [-2, 3],
      anchor: [1, 0],
      opacity: 0.25,
      visible: false,
      zIndex: -5,
    });
    expect(sprite.position).toEqual(new Vector2(7, 11));
    expect(sprite.rotation).toBe(Math.PI / 4);
    expect(sprite.scale).toEqual(new Vector2(-2, 3));
    expect(sprite.anchor).toEqual(new Vector2(1, 0));
    expect(sprite.opacity).toBe(0.25);
    expect(sprite.visible).toBe(false);
    expect(sprite.zIndex).toBe(-5);
    expect(() => {
      sprite.position = new Vector2(Infinity, 0);
    }).toThrow(RangeError);
    expect(() => {
      sprite.rotation = NaN;
    }).toThrow(RangeError);
    expect(() => {
      sprite.scale = new Vector2(1, -Infinity);
    }).toThrow(RangeError);
    expect(() => {
      sprite.opacity = -0.1;
    }).toThrow(RangeError);
    expect(() => {
      sprite.opacity = Infinity;
    }).toThrow(RangeError);
    expect(() => {
      sprite.zIndex = NaN;
    }).toThrow(RangeError);
    expect(sprite.position).toEqual(new Vector2(7, 11));
    expect(sprite.scale).toEqual(new Vector2(-2, 3));
    expect(() => new Sprite({ texture: image, anchor: [NaN, 0] })).toThrow(
      RangeError,
    );
    expect(
      () => new Sprite({ texture: image, position: [0, Infinity] }),
    ).toThrow(RangeError);
    expect(() => new Sprite({ texture: image, scale: [Infinity, 1] })).toThrow(
      RangeError,
    );
    image.destroy();
  });

  it('allows changing to another live texture but refuses an already destroyed one', () => {
    const first = texture();
    const second = texture();
    const sprite = new Sprite({ texture: first });
    sprite.texture = second;
    first.destroy();
    expect(sprite.texture).toBe(second);
    expect(() => {
      sprite.texture = first;
    }).toThrow(AssetError);
    expect(sprite.texture).toBe(second);
    sprite.destroy();
    expect(second.destroyed).toBe(false);
    second.destroy();
  });
});
