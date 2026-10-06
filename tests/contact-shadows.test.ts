import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Scene } from '../packages/core/src/scene.js';
import {
  ContactShadows,
  ContactShadowSettings,
} from '../packages/core/src/contact-shadows.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import {
  meshShaderFeatures,
  meshShaderVariantKey,
} from '../packages/graphics/src/mesh-shader-variants.js';
import { buildMeshFragment } from '../packages/graphics/src/webgl-feature-shaders.js';
import { buildWebGPUMeshShader } from '../packages/graphics/src/webgpu-mesh-shader.js';

const texture = new Texture({ width: 1, height: 1, close() {} } as ImageBitmap);

describe('screen-space contact shadows', () => {
  it('is optional and isolated per scene', () => {
    const a = new Scene(),
      b = new Scene();
    expect(ContactShadows.get(a)).toBeUndefined();
    const settings = new ContactShadowSettings();
    ContactShadows.set(a, settings);
    expect(ContactShadows.get(a)).toBe(settings);
    expect(ContactShadows.get(b)).toBeUndefined();
    ContactShadows.set(a, undefined);
    expect(ContactShadows.get(a)).toBeUndefined();
  });

  it('validates bounded samples and mutable world-space parameters', () => {
    for (const steps of [0, 65, 1.5, NaN])
      expect(() => new ContactShadowSettings({ steps })).toThrow(RangeError);
    for (const options of [
      { distance: 0 },
      { thickness: -1 },
      { bias: Infinity },
      { strength: 1.1 },
    ])
      expect(() => new ContactShadowSettings(options)).toThrow(RangeError);
    const settings = new ContactShadowSettings({ steps: 64, strength: 0 });
    settings.bias = -1;
    expect(() => settings.validate()).toThrow(RangeError);
  });

  it('compiles depth raymarching only for the enabled scene feature', () => {
    const scene = new Scene();
    const material = new PBRMaterial({ texture });
    const plain = meshShaderFeatures(material, undefined, scene);
    for (const build of [buildMeshFragment, buildWebGPUMeshShader]) {
      const source = build(plain);
      expect(source).not.toContain('contactDepth');
      expect(source).not.toContain('contactVisibility');
      expect(source).not.toContain('contactParams');
    }
    ContactShadows.set(scene, new ContactShadowSettings());
    const enabled = meshShaderFeatures(material, undefined, scene);
    expect(meshShaderVariantKey(enabled)).not.toBe(meshShaderVariantKey(plain));
    const glsl = buildMeshFragment(enabled),
      wgsl = buildWebGPUMeshShader(enabled);
    expect(glsl).toContain('texelFetch(shadowMap,ivec2(uv*vec2(size))');
    expect(glsl).not.toContain('uniform sampler2D contactDepth');
    expect(wgsl).toContain('contactDepth[pixel.y*size.x+pixel.x]');
    expect(wgsl).toContain('var<storage,read> contactDepth');
    expect(glsl).toContain('i<=64');
    expect(wgsl).toContain('i <= 64u');
    expect(glsl).toContain('contactInvViewProjection*vec4');
    expect(wgsl).toContain('scene.invViewProjection*vec4f');
    expect(glsl).toContain('directionalShadow()*contactVisibility');
    expect(wgsl).toContain(
      'directionalShadow(input.world,input.normal)*contactVisibility',
    );
  });
});
