import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import {
  isNativeMaterial3D,
  NativeMaterial3D,
} from '../packages/core/src/native-material3d.js';
import { NativePBRMaterial } from '../packages/core/src/native-pbr-material.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import { nativeMeshGLSL } from '../packages/graphics/src/webgl-feature-shaders.js';
import { nativeMeshWGSL } from '../packages/graphics/src/webgpu-mesh-shader.js';
import { GraphicsError } from '../packages/graphics/src/errors.js';

function texture(): Texture {
  return new Texture({ width: 1, height: 1, close() {} } as ImageBitmap);
}

const hooks = {
  wgsl: 'fn xyzPhysical(w:vec3f,n:vec3f,uv:vec2f,s:XYZPhysical)->XYZPhysical { return s; }',
  glsl: 'XYZPhysical xyzPhysical(vec3 w,vec3 n,vec2 uv,XYZPhysical s) { return s; }',
};

describe('native physical material hooks', () => {
  it('shares uniform validation and does not own borrowed maps', () => {
    const image = texture();
    const material = new NativePBRMaterial({
      texture: image,
      ...hooks,
      uniforms: [1],
    });
    expect(isNativeMaterial3D(material)).toBe(true);
    expect(isNativeMaterial3D(new PBRMaterial({ texture: image }))).toBe(false);
    expect(
      isNativeMaterial3D(
        new NativeMaterial3D({
          texture: image,
          wgsl: 'fn xyzSurface(w:vec3f,n:vec3f,uv:vec2f,c:vec4f)->vec4f { return c; }',
          glsl: 'vec4 xyzSurface(vec3 w,vec3 n,vec2 uv,vec4 c) { return c; }',
        }),
      ),
    ).toBe(true);
    material.uniforms[0] = NaN;
    expect(() => material.validate()).toThrow(RangeError);
    material.uniforms[0] = 1;
    image.destroy();
    expect(() => material.validate()).toThrow(/destroyed borrowed texture/);
    const released: string[] = [];
    material.onDestroy(() => released.push('gone'));
    material.destroy();
    expect(released).toEqual(['gone']);
    expect(material.destroyed).toBe(true);
  });

  it('keeps deform and opacity hooks in color, shadow and transparency stages', () => {
    const vertex = nativeMeshGLSL(hooks.glsl, 'vertex', true);
    const surface = nativeMeshGLSL(hooks.glsl, 'surface', true);
    const shadow = nativeMeshGLSL(hooks.glsl, 'shadow', true);
    const wgsl = nativeMeshWGSL(hooks.wgsl, true);
    expect(vertex).toContain('xyzDeform(');
    expect(vertex.match(/xyzDeform\s*\(/g)).toHaveLength(2);
    expect(surface).toContain('xyzSurface(');
    expect(surface).toContain('xyzPhysical(');
    expect(surface).toContain('metallicRoughnessMap');
    expect(surface).not.toContain('xyzMap0');
    expect(shadow).toContain('XYZ_SHADOW');
    expect(shadow).toContain('xyzSurface(');
    expect(shadow).toContain('struct XYZPhysical');
    expect(wgsl).toContain('fn xyzDeform');
    expect(wgsl).toContain('fn xyzSurface');
    expect(wgsl).toContain('metallicRoughnessMap');
    expect(wgsl).not.toContain('xyzMap0');
    const masked = nativeMeshGLSL(
      `vec4 xyzSurface(vec3 world,vec3 normal,vec2 uv,vec4 texel) { return vec4(texel.rgb,0.2); }\n${hooks.glsl}`,
      'shadow',
      true,
    );
    expect(masked).toContain('0.2');
    expect(masked.match(/xyzSurface\s*\(/g)?.length).toBeGreaterThan(1);
    expect(masked).not.toContain('return texel;');
    const moved = nativeMeshWGSL(
      `fn xyzDeform(position: vec3f, normal: vec3f, uv: vec2f) -> XYZVertex { return XYZVertex(position+vec3f(1.0,0.0,0.0), normal); }\n${hooks.wgsl}`,
      true,
    );
    expect(moved.match(/fn xyzDeform\s*\(/g)).toHaveLength(1);
    expect(moved).toContain('position+vec3f(1.0,0.0,0.0)');
    expect(() =>
      nativeMeshGLSL('vec4 xyzSurface(){return vec4(1.0);}', 'surface', true),
    ).toThrow(GraphicsError);
    expect(() =>
      nativeMeshWGSL('fn xyzSurface()->vec4f { return vec4f(1.0); }', true),
    ).toThrow(GraphicsError);
    expect(
      nativeMeshWGSL('fn xyzSurface()->vec4f { return vec4f(1.0); }'),
    ).toContain('xyzMap0');
  });

  it('dispatches authored instance deformation and preserves legacy fallback', () => {
    const glsl = nativeMeshGLSL(
      `XYZVertex xyzDeformInstance(vec3 p,vec3 n,vec2 uv,mat4 instance) { return XYZVertex(p+instance[3].xyz,n); }\n${hooks.glsl}`,
      'vertex',
      true,
    );
    expect(glsl).toContain('instanced ? instanceMatrix : mat4(1.0)');
    expect(glsl.match(/XYZVertex xyzDeformInstance\s*\(/g)).toHaveLength(1);
    const wgsl = nativeMeshWGSL(
      `fn xyzDeformInstance(p:vec3f,n:vec3f,uv:vec2f,instance:mat4x4f)->XYZVertex { return XYZVertex(p+instance[3].xyz,n); }\n${hooks.wgsl}`,
      true,
    );
    expect(wgsl.match(/fn xyzDeformInstance\s*\(/g)).toHaveLength(1);
    expect(wgsl).toContain(
      'xyzDeformInstance(input.position, input.normal, input.uv, instance)',
    );
    expect(nativeMeshWGSL(hooks.wgsl, true)).toContain(
      'return xyzDeform(position, normal, uv);',
    );
  });
});
