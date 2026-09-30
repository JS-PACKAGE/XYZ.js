import { describe, expect, it } from 'vitest';
import {
  Material2D,
  PostProcessor2D,
} from '../packages/core/src/materials2d/material2d.js';
import { GraphicsError } from '../packages/graphics/src/errors.js';
import { materials2dLimits } from '../src/data/materials2d.js';

const source = {
  wgsl: 'fn effect(color:vec4f,uv:vec2f,screen:vec2f)->vec4f { return color; }',
  glsl: 'vec4 effect(vec4 color,vec2 uv,vec2 screen) { return color; }',
};

describe('native 2D effect descriptors', () => {
  it('atomically replaces uniforms and rejects overflow or non-finite GPU floats', () => {
    const material = new Material2D({ ...source, uniforms: [1, 2, 3, 4] });
    expect(() => material.setUniforms([8, Infinity])).toThrow(GraphicsError);
    expect(() => material.setUniforms([8, Number.MAX_VALUE])).toThrow(
      GraphicsError,
    );
    expect(() => material.setUniforms(Array(17).fill(1))).toThrow(
      GraphicsError,
    );
    expect(Array.from(material.uniforms)).toEqual([
      1,
      2,
      3,
      4,
      ...Array(12).fill(0),
    ]);
    material.setUniforms([0.5]);
    expect(Array.from(material.uniforms)).toEqual([0.5, ...Array(15).fill(0)]);
  });

  it('enforces native source bounds without silently selecting another language', () => {
    expect(() => new Material2D({ ...source, wgsl: '' })).toThrow(
      GraphicsError,
    );
    expect(() => new PostProcessor2D({ ...source, glsl: ' ' })).toThrow(
      GraphicsError,
    );
    expect(
      () =>
        new Material2D({
          ...source,
          wgsl: 'x'.repeat(materials2dLimits.sourceCharacters + 1),
        }),
    ).toThrow(GraphicsError);
  });

  it('disposes once and forbids mutation after native resource owners are notified', () => {
    const processor = new PostProcessor2D(source);
    let disposalCount = 0;
    processor.addEventListener('destroy', () => {
      disposalCount++;
    });
    processor.destroy();
    processor.destroy();
    expect(disposalCount).toBe(1);
    expect(processor.destroyed).toBe(true);
    expect(() => processor.setUniforms([1])).toThrow(GraphicsError);
  });
});
