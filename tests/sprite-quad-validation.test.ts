import { describe, expect, it } from 'vitest';
import type { Texture2DSource } from '../packages/assets/src/index.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { TilingSprite2D } from '../packages/core/src/graphics2d/tiling-sprite2d.js';
import {
  createTextureQuad2D,
  getSpriteQuad2D,
  validateSpriteQuad2D,
} from '../packages/graphics/src/sprite-instance.js';

/** A resizable native source: image textures cannot shrink under an assigned source. */
function nativeSource(): { -readonly [K in keyof Texture2DSource]: unknown } {
  return {
    kind: 'native',
    width: 64,
    height: 64,
    destroyed: false,
    version: 0,
    destroy() {
      this.destroyed = true;
    },
  };
}

function outcome(run: () => void): string {
  try {
    run();
    return 'ok';
  } catch (error) {
    return `${(error as Error).constructor.name}: ${(error as Error).message}`;
  }
}

describe('sprite quad validation before drawing', () => {
  it('rejects exactly the sprites whose quad cannot be computed, with the same error', () => {
    const cases: [string, () => Sprite][] = [
      [
        'valid',
        () => new Sprite({ texture: nativeSource() as Texture2DSource }),
      ],
      [
        'destroyed source',
        () => {
          const texture = nativeSource();
          const sprite = new Sprite({ texture: texture as Texture2DSource });
          texture.destroyed = true;
          return sprite;
        },
      ],
      [
        'source outgrown by a shrunk texture',
        () => {
          const texture = nativeSource();
          const sprite = new Sprite({ texture: texture as Texture2DSource });
          sprite.source = { x: 32, y: 0, width: 32, height: 32 };
          texture.width = 48;
          return sprite;
        },
      ],
      [
        'singular tile scale',
        () => {
          const sprite = new TilingSprite2D({
            texture: nativeSource() as Texture2DSource,
            width: 100,
            height: 50,
          });
          sprite.tileScale.set(0, 1);
          return sprite;
        },
      ],
      [
        'throwing bounds override',
        () =>
          new (class extends Sprite {
            override getLocalBounds(): never {
              throw new RangeError('bounds unavailable');
            }
          })({ texture: nativeSource() as Texture2DSource }),
      ],
    ];
    const outcomes = cases.map(([name, create]) => {
      const sprite = create();
      const validated = outcome(() => validateSpriteQuad2D(sprite));
      const computed = outcome(() =>
        getSpriteQuad2D(sprite, createTextureQuad2D()),
      );
      expect(validated, name).toBe(computed);
      return validated === 'ok';
    });
    expect(outcomes).toEqual([true, false, false, false, false]);
  });
});
