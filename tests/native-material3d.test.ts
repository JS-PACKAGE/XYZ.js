import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { NativeMaterial3D } from '../packages/core/src/native-material3d.js';
import { Mesh } from '../packages/core/src/mesh.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Frustum } from '../packages/core/src/frustum.js';
import { Matrix4 } from '../packages/math/src/index.js';
import { nativeMaterial3DLimits } from '../src/data/rendering.js';

function texture(): Texture {
  return new Texture({ width: 1, height: 1, close() {} } as ImageBitmap);
}
const hooks = {
  wgsl: 'fn xyzDeform(p:vec3f,n:vec3f,uv:vec2f)->XYZVertex { return XYZVertex(p,n); } fn xyzSurface(p:vec3f,n:vec3f,uv:vec2f,c:vec4f)->vec4f { return c; }',
  glsl: 'XYZVertex xyzDeform(vec3 p,vec3 n,vec2 uv) { return XYZVertex(p,n); } vec4 xyzSurface(vec3 p,vec3 n,vec2 uv,vec4 c) { return c; }',
};

describe('native per-mesh material ownership and payload boundaries', () => {
  it('preserves the previous uniform payload on rejected updates and checks direct mutations', () => {
    const image = texture(),
      material = new NativeMaterial3D({
        texture: image,
        ...hooks,
        uniforms: [2, 3],
      });
    const previous = material.uniforms.slice();
    expect(() => material.setUniforms([7, Number.MAX_VALUE])).toThrow(
      RangeError,
    );
    expect(() => material.setUniforms([7, NaN])).toThrow(RangeError);
    expect(() => material.setUniforms([7], 64)).toThrow(RangeError);
    expect(() => material.setUniforms({ length: -1 })).toThrow(RangeError);
    expect(material.uniforms).toEqual(previous);
    material.setUniforms([9], 63);
    expect(material.uniforms[63]).toBe(9);
    material.uniforms[0] = Infinity;
    expect(() => material.validate()).toThrow(RangeError);
    material.destroy();
    image.destroy();
  });

  it('rejects a destroyed borrowed map without taking ownership of other maps', () => {
    const base = texture(),
      map = texture();
    const material = new NativeMaterial3D({
      texture: base,
      textures: [map],
      ...hooks,
    });
    map.destroy();
    expect(() => material.validate()).toThrow();
    material.destroy();
    expect(base.destroyed).toBe(false);
    base.destroy();
  });

  it('notifies all native owners even if one cleanup fails and never re-disposes', () => {
    const image = texture(),
      material = new NativeMaterial3D({ texture: image, ...hooks });
    const released: string[] = [];
    material.onDestroy(() => {
      released.push('first');
      throw new Error('cleanup failure');
    });
    material.onDestroy(() => {
      released.push('second');
    });
    expect(() => material.destroy()).toThrow(AggregateError);
    material.destroy();
    expect(released).toEqual(['first', 'second']);
    expect(image.destroyed).toBe(false);
    expect(() => material.setUniforms([1])).toThrow();
    image.destroy();
  });

  it('bounds authored code and map counts while allowing conservative unbounded deformation', () => {
    const image = texture();
    expect(
      () =>
        new NativeMaterial3D({
          texture: image,
          ...hooks,
          wgsl: 'x'.repeat(nativeMaterial3DLimits.sourceCharacters + 1),
        }),
    ).toThrow(TypeError);
    expect(
      () =>
        new NativeMaterial3D({
          texture: image,
          ...hooks,
          textures: Array(5).fill(image),
        }),
    ).toThrow(TypeError);
    expect(
      () =>
        new NativeMaterial3D({
          texture: image,
          ...hooks,
          deformationBounds: -1,
        }),
    ).toThrow(RangeError);
    const material = new NativeMaterial3D({ texture: image, ...hooks });
    const frustum = new Frustum().setFromMatrix(new Matrix4());
    const unbounded = new Mesh({
      geometry: Geometry.cube(),
      material,
      position: [1000, 0, 0],
    });
    const boundedMaterial = new NativeMaterial3D({
      texture: image,
      ...hooks,
      deformationBounds: 0,
    });
    const bounded = new Mesh({
      geometry: Geometry.cube(),
      material: boundedMaterial,
      position: [1000, 0, 0],
    });
    expect(unbounded.isInFrustum(frustum)).toBe(true);
    expect(bounded.isInFrustum(frustum)).toBe(false);
    unbounded.destroy();
    bounded.destroy();
    boundedMaterial.destroy();
    material.destroy();
    image.destroy();
  });
});
