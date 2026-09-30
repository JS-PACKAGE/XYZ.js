import { describe, expect, it } from 'vitest';
import {
  createOwnedRenderTexture2D,
  validateRenderTextureSize2D,
  validateRenderTextureDependencies2D,
  assertRenderTextureOwner2D,
} from '../packages/graphics/src/render-texture2d.js';

describe('renderer-owned mutable targets', () => {
  it('keeps logical dimensions distinct and rejected resizes atomic', () => {
    const owner = {};
    let releases = 0;
    const target = createOwnedRenderTexture2D(
      owner,
      validateRenderTextureSize2D({ width: 3.5, height: 2, resolution: 2 }),
      (size) => {
        if (size.width === 8) throw new Error('allocation failed');
      },
      () => {
        releases++;
      },
    );
    expect([
      target.width,
      target.height,
      target.logicalWidth,
      target.resolution,
    ]).toEqual([7, 4, 3.5, 2]);
    expect(() => target.resize({ width: 4, height: 2 })).toThrow(
      'allocation failed',
    );
    expect(() => target.resize({ width: Infinity, height: 2 })).toThrow(
      RangeError,
    );
    expect([target.width, target.version]).toEqual([7, 0]);
    target.resize({ width: 2, height: 2 });
    expect([target.width, target.logicalWidth, target.version]).toEqual([
      4, 2, 1,
    ]);
    target.destroy();
    target.destroy();
    expect(releases).toBe(1);
    expect(() => target.resize({ width: 1, height: 1 })).toThrow();
  });
  it('rejects foreign sources and indirect self sampling', () => {
    const owner = {};
    const size = validateRenderTextureSize2D({ width: 1, height: 1 });
    const a = createOwnedRenderTexture2D(
      owner,
      size,
      () => {},
      () => {},
    );
    const b = createOwnedRenderTexture2D(
      owner,
      size,
      () => {},
      () => {},
    );
    const c = createOwnedRenderTexture2D(
      owner,
      size,
      () => {},
      () => {},
    );
    b.publish(owner, [a]);
    c.publish(owner, [b]);
    expect(() => validateRenderTextureDependencies2D(a, [c], owner)).toThrow(
      'feedback',
    );
    expect(() => validateRenderTextureDependencies2D(a, [a], owner)).toThrow(
      'feedback',
    );
    expect(() => assertRenderTextureOwner2D(a, {})).toThrow('another renderer');
    b.destroy();
    expect(() => validateRenderTextureDependencies2D(a, [b], owner)).toThrow(
      'destroyed',
    );
    a.destroy();
    c.destroy();
  });
});
