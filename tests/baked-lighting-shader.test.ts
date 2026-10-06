import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import {
  meshShaderFeatures,
  meshShaderVariantKey,
} from '../packages/graphics/src/mesh-shader-variants.js';
import { buildMeshFragment } from '../packages/graphics/src/webgl-feature-shaders.js';
import { buildWebGPUMeshShader } from '../packages/graphics/src/webgpu-mesh-shader.js';

const texture = new Texture({ width: 1, height: 1, close() {} } as ImageBitmap);

describe('baked irradiance mesh variants', () => {
  it('omits baked evaluation from ordinary source and keys the enabled variant', () => {
    const plain = meshShaderFeatures(new PBRMaterial({ texture }));
    const baked = { ...plain, bakedIrradiance: true };
    expect(meshShaderVariantKey(baked)).not.toBe(meshShaderVariantKey(plain));
    expect(buildMeshFragment(plain)).not.toContain('vec3 bakedIrradiance(');
    expect(buildWebGPUMeshShader(plain)).not.toContain('fn bakedIrradiance(');
    expect(buildMeshFragment(baked)).toContain('vec3 bakedIrradiance(');
    expect(buildWebGPUMeshShader(baked)).toContain('fn bakedIrradiance(');
  });

  it('retains baked diffuse when environment sampling is specialized out', () => {
    const features = {
      ...meshShaderFeatures(new PBRMaterial({ texture })),
      bakedIrradiance: true,
      environment: false,
    };
    const gl = buildMeshFragment(features);
    const gpu = buildWebGPUMeshShader(features);
    expect(gl).toContain('result=bakedIrradiance(n)*base');
    expect(gpu).toContain('color=bakedIrradiance(n)*base');
    expect(gl).not.toContain('vec3 reflectionIrradiance(');
    expect(gpu).not.toContain('fn reflectionIrradiance(');
  });

  it('retains specular reflection but suppresses duplicate environment diffuse', () => {
    const features = {
      ...meshShaderFeatures(new PBRMaterial({ texture })),
      bakedIrradiance: true,
    };
    expect(buildMeshFragment(features)).toContain('radiance*reflected');
    expect(buildMeshFragment(features)).toContain(
      '*(bakedParams.x > .5 ? 0.0 : 1.0)',
    );
    expect(buildWebGPUMeshShader(features)).toContain('radiance*reflected');
    expect(buildWebGPUMeshShader(features)).toContain(
      '*select(1.0,0.0,mesh.bakedParams.x > 0.5)',
    );
  });

  it('adds generated irradiance without changing authored lightmap modulation', () => {
    const legacy = {
      ...meshShaderFeatures(new PBRMaterial({ texture, lightmap: texture })),
      bakedLightmap: false,
    };
    const generated = { ...legacy, bakedLightmap: true };
    expect(meshShaderVariantKey(legacy)).not.toBe(
      meshShaderVariantKey(generated),
    );
    expect(buildMeshFragment(legacy)).toContain(
      'result *= mix(vec3(1.0), baked, finish3.w);',
    );
    expect(buildWebGPUMeshShader(legacy)).toContain(
      'color *= mix(vec3f(1.0), baked, mesh.finish[3].w);',
    );
    expect(buildMeshFragment(legacy)).not.toContain(
      'result += baked*finish3.w*base',
    );
    expect(buildWebGPUMeshShader(legacy)).not.toContain(
      'color += baked*mesh.finish[3].w*base',
    );
    expect(buildMeshFragment(generated)).toContain(
      'result += baked*finish3.w*base',
    );
    expect(buildWebGPUMeshShader(generated)).toContain(
      'color += baked*mesh.finish[3].w*base',
    );
  });
});
