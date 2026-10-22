import { describe, expect, it, vi } from 'vitest';
import { WebGLUniformCache } from '../packages/graphics/src/webgl-uniform-cache.js';

function context() {
  return {
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform4f: vi.fn(),
    uniform4i: vi.fn(),
    uniform4fv: vi.fn(),
  };
}

describe('WebGLUniformCache', () => {
  it('sends a value only when that location would change', () => {
    const gl = context();
    const cache = new WebGLUniformCache();
    const a = {} as WebGLUniformLocation,
      b = {} as WebGLUniformLocation;
    const raw = gl as unknown as WebGL2RenderingContext;
    cache.uniform1i(raw, a, 5);
    cache.uniform1i(raw, a, 5);
    cache.uniform1i(raw, b, 5);
    cache.uniform1i(raw, a, 6);
    cache.uniform1i(raw, null, 7);
    expect(gl.uniform1i.mock.calls).toEqual([
      [a, 5],
      [b, 5],
      [a, 6],
    ]);
    cache.uniform4f(raw, a, 1, 2, 3, 4);
    cache.uniform4f(raw, a, 1, 2, 3, 4);
    cache.uniform4f(raw, a, 1, 2, 3, 5);
    expect(gl.uniform4f).toHaveBeenCalledTimes(2);
    cache.uniform4i(raw, b, 1, 2, 3, 4);
    cache.uniform4i(raw, b, 1, 2, 3, 4);
    cache.uniform4i(raw, b, 1, 2, 3, 0);
    expect(gl.uniform4i.mock.calls).toEqual([
      [b, 1, 2, 3, 4],
      [b, 1, 2, 3, 0],
    ]);
  });

  it('sends array uniforms when any element changes, even after the caller reuses its buffer', () => {
    const gl = context();
    const cache = new WebGLUniformCache();
    const a = {} as WebGLUniformLocation,
      b = {} as WebGLUniformLocation;
    const raw = gl as unknown as WebGL2RenderingContext;
    const data = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
    cache.uniform4fv(raw, a, data);
    cache.uniform4fv(raw, a, data);
    cache.uniform4fv(raw, b, data);
    data[7] = 9;
    cache.uniform4fv(raw, a, data);
    cache.uniform4fv(raw, a, new Float32Array([1, 2, 3, 4, 5, 6, 7, 9]));
    data[0] = 0;
    cache.uniform4fv(raw, a, data);
    data[0] = -0;
    cache.uniform4fv(raw, a, data);
    cache.uniform4fv(raw, null, data);
    expect(gl.uniform4fv.mock.calls.map(([location]) => location)).toEqual([
      a,
      b,
      a,
      a,
      a,
    ]);
  });

  it('treats signed zero as a different value', () => {
    const gl = context();
    const cache = new WebGLUniformCache();
    const location = {} as WebGLUniformLocation;
    const raw = gl as unknown as WebGL2RenderingContext;
    cache.uniform1f(raw, location, 0);
    cache.uniform1f(raw, location, -0);
    cache.uniform1f(raw, location, -0);
    expect(gl.uniform1f).toHaveBeenCalledTimes(2);
  });

  it('skips a shared array a location already holds, whichever form wrote last', () => {
    const gl = context();
    const cache = new WebGLUniformCache();
    const location = {} as WebGLUniformLocation;
    const raw = gl as unknown as WebGL2RenderingContext;
    const shared = new Float32Array([1, 2, 3, 4]);
    const other = new Float32Array([5, 6, 7, 8]);
    const values = new Float32Array([1, 2, 3, 4]);
    cache.sharedUniform4fv(raw, location, shared);
    cache.sharedUniform4fv(raw, location, shared);
    cache.sharedUniform4fv(raw, location, other);
    cache.sharedUniform4fv(raw, location, shared);
    // A copied write replaces the shared array, and the shared array then replaces it.
    cache.uniform4fv(raw, location, values);
    cache.uniform4fv(raw, location, values);
    cache.sharedUniform4fv(raw, location, shared);
    cache.uniform4fv(raw, location, values);
    cache.sharedUniform4fv(raw, null, shared);
    expect(gl.uniform4fv.mock.calls.map(([, data]) => data)).toEqual([
      shared,
      other,
      shared,
      values,
      shared,
      values,
    ]);
  });
});
