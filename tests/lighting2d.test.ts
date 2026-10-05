import { describe, expect, it } from 'vitest';
import { Texture, TextureView2D } from '../packages/assets/src/index.js';
import { Sprite } from '../packages/core/src/sprite.js';
import {
  Light2D,
  Lighting2D,
  MAX_LIGHTS_2D,
  validateSpriteLighting2D,
} from '../packages/core/src/lighting2d.js';
import { Matrix3 } from '../packages/math/src/index.js';
import { packLighting2D } from '../packages/graphics/src/lighting2d.js';
import {
  createTextureQuad2D,
  getSpriteQuad2D,
} from '../packages/graphics/src/sprite-instance.js';
function texture(width = 64): Texture {
  return new Texture({ width, height: 64, close() {} } as ImageBitmap);
}
function pack(sprite: Sprite, mapping = new Matrix3()): Float32Array {
  const result = new Float32Array(128);
  packLighting2D(
    sprite,
    mapping,
    getSpriteQuad2D(sprite, createTextureQuad2D()),
    result,
  );
  return result;
}
describe('native Lighting2D draw snapshots', () => {
  it('updates moving lights and shared profiles without mutating earlier frame data', () => {
    const light = new Light2D({
      position: [10, 20],
      intensity: 2,
      color: [1, 0.5, 0],
    });
    const lighting = new Lighting2D({
      lights: [light],
      ambient: [0.2, 0.3, 0.4],
    });
    const sprite = new Sprite({ texture: texture(), lighting });
    const old = pack(sprite);
    light.position[0] = 99;
    light.intensity = 4;
    const next = pack(sprite);
    expect(old[32]).toBe(10);
    expect(next[32]).toBe(99);
    expect(old[39]).toBe(2);
    expect(next[39]).toBe(4);
    expect(next[25]).toBeCloseTo(0.3);
    light.enabled = false;
    expect(pack(sprite)[39]).toBe(0);
  });
  it('separates world lighting from HUD lighting and packs inverse target/camera mapping', () => {
    const world = new Light2D({ intensity: 3 });
    const hud = new Light2D({ intensity: 7, space: 'screen' });
    const sprite = new Sprite({
      texture: texture(),
      lighting: new Lighting2D({ lights: [world, hud] }),
      space: 'screen',
    });
    const mapping = new Matrix3();
    mapping.elements[0] = mapping.elements[4] = 0.5;
    mapping.elements[6] = 120;
    mapping.elements[7] = 30;
    const data = pack(sprite, mapping);
    expect(data[39]).toBe(0);
    expect(data[47]).toBe(7);
    expect(data[64]).toBe(0.5);
    expect(data[68]).toBe(120);
    expect(data[69]).toBe(30);
  });
  it('transforms normals as covectors under reflection and shear, not as color overlays', () => {
    const sprite = new Sprite({
      texture: texture(),
      lighting: new Lighting2D(),
      scale: [-2, 3],
      skew: [0.3, 0.1],
      rotation: 0.5,
    });
    const data = pack(sprite),
      e = sprite.updateWorldMatrix().elements;
    // Transformed local X normal remains perpendicular to transformed local Y tangent.
    expect(data[28] * e[3] + data[29] * e[4]).toBeCloseTo(0, 5);
    expect(data[30] * e[0] + data[31] * e[1]).toBeCloseTo(0, 5);
    expect(data[28] * data[31] - data[29] * data[30]).toBeLessThan(0);
    sprite.scale.x = 0;
    expect(() => pack(sprite)).toThrow(/invertible/);
  });
  it('uses the same rotated atlas frame for normal sampling and retains borrowed ownership', () => {
    const albedo = texture(),
      normal = texture();
    const sprite = new Sprite({
      view: new TextureView2D(albedo, {
        frame: { x: 16, y: 8, width: 16, height: 32 },
        rotation: 90,
      }),
      normalTexture: normal,
      lighting: new Lighting2D(),
    });
    const q = getSpriteQuad2D(sprite, createTextureQuad2D()),
      data = pack(sprite);
    expect(Array.from(data.slice(72, 78))).toEqual([
      q.u0,
      q.v0,
      q.ux,
      q.vx,
      q.uy,
      q.vy,
    ]);
    expect(data[27]).toBe(1);
    sprite.destroy();
    expect(normal.destroyed).toBe(false);
    expect(albedo.destroyed).toBe(false);
  });
  it('rejects oversubscribed, invalid or mismatched maps instead of rendering unlit', () => {
    expect(
      () =>
        new Lighting2D({
          lights: Array.from(
            { length: MAX_LIGHTS_2D + 1 },
            () => new Light2D(),
          ),
        }),
    ).toThrow(/at most/);
    const sprite = new Sprite({
      texture: texture(),
      normalTexture: texture(32),
      lighting: new Lighting2D(),
    });
    expect(() => validateSpriteLighting2D(sprite)).toThrow(/dimensions/);
    sprite.normalTexture = texture();
    sprite.normalTexture.destroy();
    expect(() => validateSpriteLighting2D(sprite)).toThrow(/live/);
    const light = new Light2D();
    light.radius = 0;
    expect(() => light.validate()).toThrow(/radius/);
  });
});
