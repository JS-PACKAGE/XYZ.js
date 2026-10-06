import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { Mesh } from '../packages/core/src/mesh.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import { Scene } from '../packages/core/src/scene.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';
import {
  meshShaderFeatures,
  meshShaderVariantKey,
  omitShaderBlock,
  type MeshShaderFeatures,
} from '../packages/graphics/src/mesh-shader-variants.js';
import {
  buildMeshFragment,
  buildMeshVertex,
  meshFragment,
  meshVertex,
} from '../packages/graphics/src/webgl-feature-shaders.js';
import {
  buildWebGPUMeshShader,
  webgpuMeshShader,
} from '../packages/graphics/src/webgpu-mesh-shader.js';
import { meshShaderVariantLimits } from '../src/data/rendering.js';
import {
  fillMappedOpticalSettings,
  opticalMapSources,
  mappedMaterialTextureSlots,
  mappedMaterialUVFloatCount,
} from '../packages/graphics/src/optical-maps.js';
import { opticalPackWGSL } from '../packages/graphics/src/optical-pack-shaders.js';

const texture = new Texture({ width: 1, height: 1, close() {} } as ImageBitmap);

type ShaderLanguage = 'glsl' | 'wgsl';

function shaderFunctionDefinitions(
  source: string,
  language: ShaderLanguage,
): Set<string> {
  const pattern =
    language === 'glsl'
      ? /(?:^|[;{}])\s*(?:(?:lowp|mediump|highp)\s+)?(?!else\b)[A-Za-z_]\w*\s+([A-Za-z_]\w*)\s*\([^{};]*\)\s*\{/g
      : /\bfn\s+([A-Za-z_]\w*)\s*\([^{};]*\)\s*(?:->[^{};]+)?\s*\{/g;
  return new Set(
    Array.from(
      source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '').matchAll(pattern),
      (match) => match[1]!,
    ),
  );
}

function missingEngineDefinitions(
  source: string,
  language: ShaderLanguage,
  engineFunctions: ReadonlySet<string>,
): string[] {
  const definitions = shaderFunctionDefinitions(source, language);
  const references = new Set(
    Array.from(
      source
        .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
        .matchAll(/\b([A-Za-z_]\w*)\s*\(/g),
      (match) => match[1]!,
    ),
  );
  // Full-source definitions identify engine functions without an intrinsic allowlist.
  return [...references]
    .filter((name) => engineFunctions.has(name) && !definitions.has(name))
    .sort();
}

function featureCombinationMatrix(): MeshShaderFeatures[] {
  const template = meshShaderFeatures(new PBRMaterial({ texture }));
  const names = (Object.keys(template) as (keyof MeshShaderFeatures)[]).filter(
    (name) => name !== 'native' && name !== 'pbr',
  );
  const variants = new Map<string, MeshShaderFeatures>();
  const add = (features: MeshShaderFeatures) =>
    variants.set(meshShaderVariantKey(features), features);
  for (const native of [false, true]) {
    for (const pbr of [false, true]) {
      for (const enabled of [false, true]) {
        const baseline = { ...template, native, pbr };
        for (const name of names) baseline[name] = enabled;
        add(baseline);
        for (let i = 0; i < names.length; i++) {
          const first = names[i]!;
          add({ ...baseline, [first]: !enabled });
          for (let j = i + 1; j < names.length; j++)
            add({ ...baseline, [first]: !enabled, [names[j]!]: !enabled });
        }
      }
    }
  }
  return [...variants.values()];
}

describe('mesh shader source variants', () => {
  it('removes expensive disabled physical lobes from a default PBR source', () => {
    const material = new PBRMaterial({ texture });
    const features = meshShaderFeatures(material, undefined, new Scene());
    const glsl = buildMeshFragment(features);
    const wgsl = buildWebGPUMeshShader(features);
    for (const source of [glsl, wgsl]) {
      for (const expensive of [
        'thinFilm(',
        'anisotropicGGX(',
        'diffusionProfile(',
        'roughTransmission(',
        'sheenLobe(',
        'clearcoatLobe(',
        'spectralRay',
      ]) {
        expect(source).not.toContain(expensive);
      }
      expect(source).toContain('ggxDistribution(');
      expect(source).toContain('ggxCompensation(');
    }
    expect(new TextEncoder().encode(glsl).length).toBeLessThan(
      meshShaderVariantLimits.plainFragmentMaxBytes,
    );
    expect(glsl.length).toBeLessThan(meshFragment.length * 0.7);
    expect(wgsl.length).toBeLessThan(webgpuMeshShader.length * 0.8);
  });

  it('retains enabled lobes independently and keys all physical feature switches', () => {
    const plain = meshShaderFeatures(
      new PBRMaterial({ texture }),
      undefined,
      new Scene(),
    );
    const full = meshShaderFeatures(
      new PBRMaterial({
        texture,
        clearcoat: 1,
        sheenColor: [1, 0, 0],
        transmission: 1,
        finish: {
          anisotropy: 1,
          iridescence: 1,
          subsurface: 1,
          dispersion: 1,
          heightScale: 1,
          wetness: 1,
          detailStrength: 1,
          triplanar: 1,
        },
      }),
    );
    for (const source of [
      buildMeshFragment(full),
      buildWebGPUMeshShader(full),
    ]) {
      for (const lobe of [
        'thinFilm(',
        'anisotropicGGX(',
        'diffusionProfile(',
        'roughTransmission(',
        'sheenLobe(',
        'clearcoatLobe(',
      ])
        expect(source).toContain(lobe);
    }
    const keys = new Set([meshShaderVariantKey(plain)]);
    for (const name of Object.keys(plain) as (keyof typeof plain)[]) {
      keys.add(meshShaderVariantKey({ ...plain, [name]: !plain[name] }));
    }
    expect(keys.size).toBe(Object.keys(plain).length + 1);
    const reversed = Object.fromEntries(
      Object.entries(plain).reverse(),
    ) as typeof plain;
    expect(meshShaderVariantKey(reversed)).toBe(meshShaderVariantKey(plain));
  });

  it('requires actual engine function bodies, not prototypes or comments', () => {
    const glslFunctions = shaderFunctionDefinitions(
      'vec3 helper(vec3 v) { return v; }',
      'glsl',
    );
    expect(
      missingEngineDefinitions(
        'vec3 helper(vec3 v); void main() { helper(vec3(1.0)); } // vec3 helper(vec3 v) {}',
        'glsl',
        glslFunctions,
      ),
    ).toEqual(['helper']);
    expect(
      missingEngineDefinitions(
        'vec3 helper(vec3 v) { return normalize(v); } void main() { helper(vec3(1.0)); }',
        'glsl',
        glslFunctions,
      ),
    ).toEqual([]);
    const wgslFunctions = shaderFunctionDefinitions(
      'fn helper(v: vec3f) -> vec3f { return v; }',
      'wgsl',
    );
    expect(
      missingEngineDefinitions(
        'fn helper(v: vec3f) -> vec3f; @fragment fn main() -> @location(0) vec4f { return vec4f(helper(vec3f(1.0)), 1.0); } /* fn helper(v: vec3f) -> vec3f {} */',
        'wgsl',
        wgslFunctions,
      ),
    ).toEqual(['helper']);
    expect(
      missingEngineDefinitions(
        'fn helper(v: vec3f) -> vec3f { return normalize(v); } @fragment fn main() -> @location(0) vec4f { return vec4f(helper(vec3f(1.0)), 1.0); }',
        'wgsl',
        wgslFunctions,
      ),
    ).toEqual([]);
  });

  it('defines every referenced engine function across feature pairs and single-bit changes', () => {
    const glslFunctions = new Set([
      ...shaderFunctionDefinitions(meshVertex, 'glsl'),
      ...shaderFunctionDefinitions(meshFragment, 'glsl'),
    ]);
    const wgslFunctions = shaderFunctionDefinitions(webgpuMeshShader, 'wgsl');
    const variants = featureCombinationMatrix();
    const switches =
      Object.keys(meshShaderFeatures(new PBRMaterial({ texture }))).length - 2;
    expect(variants).toHaveLength(
      2 * 2 * 2 * (1 + switches + (switches * (switches - 1)) / 2),
    );
    for (const features of variants) {
      const key = meshShaderVariantKey(features);
      for (const [stage, source, language, functions] of [
        ['GLSL vertex', buildMeshVertex(), 'glsl', glslFunctions],
        ['GLSL fragment', buildMeshFragment(features), 'glsl', glslFunctions],
        ['WGSL', buildWebGPUMeshShader(features), 'wgsl', wgslFunctions],
      ] as const) {
        expect(
          missingEngineDefinitions(source, language, functions),
          `${stage} variant ${key}: ${JSON.stringify(features)}`,
        ).toEqual([]);
      }
    }
  });

  it('detects actual SkinnedMesh instances without a nonexistent skeleton field', () => {
    const material = new PBRMaterial({ texture });
    const geometry = Geometry.quad(1, 1);
    const mesh = new SkinnedMesh({
      geometry,
      material,
      joints: [new Group()],
      jointIndices: new Uint32Array(16),
      weights: new Float32Array(16).fill(1),
    });
    expect('skeleton' in mesh).toBe(false);
    const features = meshShaderFeatures(material, mesh);
    expect(features.skinned).toBe(true);
    expect(buildMeshVertex()).toContain('mat4 jointMatrix(uint index) {');
    expect(buildWebGPUMeshShader(features)).toContain(
      'let skin = jointPalette[',
    );

    const ordinary = new Mesh({ geometry, material });
    expect(meshShaderFeatures(material, ordinary).skinned).toBe(false);
    Object.assign(ordinary, { skeleton: {} });
    expect(meshShaderFeatures(material, ordinary).skinned).toBe(false);
    expect(meshShaderFeatures(material).skinned).toBe(false);
  });

  it('packs independent optical map settings and all five atlas layers', () => {
    const second = new Texture({
      width: 2,
      height: 3,
      close() {},
    } as ImageBitmap);
    const third = new Texture({
      width: 4,
      height: 5,
      close() {},
    } as ImageBitmap);
    const material = new PBRMaterial({
      texture,
      transmissionTexture: texture,
      thicknessTexture: second,
      opticalMaps: {
        anisotropyTexture: third,
        anisotropySampler: { addressModeU: 'repeat', minFilter: 'nearest' },
        iridescenceTexture: second,
        iridescenceSampler: {
          addressModeV: 'mirror-repeat',
          magFilter: 'nearest',
        },
        iridescenceThicknessTexture: texture,
        iridescenceThicknessMinimum: 50,
        iridescenceThicknessMaximum: 950,
      },
    });
    const packed = new Float32Array(20).fill(-1);
    fillMappedOpticalSettings(material, packed, 4);
    expect(Array.from(packed.subarray(0, 4))).toEqual([-1, -1, -1, -1]);
    expect(Array.from(packed.subarray(4, 8))).toEqual([4, 5, 1, 2]);
    expect(Array.from(packed.subarray(8, 12))).toEqual([2, 3, 6, 1]);
    expect(Array.from(packed.subarray(12, 20))).toEqual([
      1, 1, 0, 3, 50, 950, 0, 0,
    ]);
    expect(opticalMapSources(material)).toEqual([
      texture,
      second,
      third,
      second,
      texture,
    ]);
    for (let layer = 0; layer < 5; layer++)
      expect(opticalPackWGSL).toContain(`pack(id,${layer});`);
  });

  it('keeps mapped optical sampling lazy and shares strengths across lighting paths', () => {
    const material = new PBRMaterial({
      texture,
      finish: { anisotropy: 0.7, iridescence: 0.8 },
      opticalMaps: {
        anisotropyTexture: texture,
        iridescenceTexture: texture,
        iridescenceThicknessTexture: texture,
        iridescenceThicknessMinimum: 50,
        iridescenceThicknessMaximum: 950,
      },
    });
    const features = meshShaderFeatures(material);
    expect(features.anisotropyMap).toBe(true);
    expect(features.iridescenceMap).toBe(true);
    expect(features.iridescenceThicknessMap).toBe(true);
    const mappedGLSL = buildMeshFragment(features);
    const mappedWGSL = buildWebGPUMeshShader(features);
    // Authored tangents remain usable under affine map transforms; UV set
    // mismatches and singular transforms must retain the derivative fallback.
    expect(mappedGLSL).toContain('(t*mapping.w-b*mapping.y)/determinant');
    expect(mappedWGSL).toContain('(t*mapping.w-b*mapping.y)/determinant');
    expect(mappedGLSL).toContain(
      'materialCoordinates[29].z-float(tangentTexCoord)',
    );
    expect(mappedWGSL).toContain('mesh.coordinates[29].z-mesh.fade.y');
    expect(mappedGLSL).toContain('abs(determinant) > .000001');
    expect(mappedWGSL).toContain('abs(determinant) > 0.000001');
    expect(mappedGLSL).toContain('materialNormalFrame(n,14)');
    expect(mappedWGSL).toContain(
      'mappedTangent = cross(dy,n)*du.x+cross(n,dx)*dv.x',
    );
    expect(mappedMaterialTextureSlots.slice(14)).toEqual([
      'anisotropy',
      'iridescence',
      'iridescenceThickness',
    ]);
    expect(mappedMaterialUVFloatCount).toBe(17 * 8);
    expect(buildMeshFragment(features)).toContain('materialCoordinates[34]');
    expect(buildWebGPUMeshShader(features)).toContain(
      'coordinates: array<vec4f, 34>',
    );
    const plain = meshShaderFeatures(new PBRMaterial({ texture }));
    expect(buildWebGPUMeshShader(plain)).toContain(
      'coordinates: array<vec4f, 34>',
    );
    expect(meshShaderVariantKey(features)).not.toBe(
      meshShaderVariantKey({ ...features, anisotropyMap: false }),
    );
    for (const source of [
      buildMeshFragment(features),
      buildWebGPUMeshShader(features),
    ]) {
      expect(source).toContain('opticalSample(');
      expect(source).toContain('iridescenceThicknessRange');
      expect(source).toContain('anisotropyDirection');
      expect(source).not.toContain('roughTransmission(');
    }
    for (const source of [
      buildMeshFragment(plain),
      buildWebGPUMeshShader(plain),
    ]) {
      expect(source).not.toContain('opticalSample(');
      expect(source).not.toContain('anisotropicGGX(');
      expect(source).not.toContain('thinFilm(');
    }
  });

  it('removes nested authored blocks without consuming following statements', () => {
    const source =
      'before; if (disabled) { for (;;) { nested(); } afterNested(); } retained();';
    expect(omitShaderBlock(source, 'if (disabled)')).toBe(
      'before;  retained();',
    );
    expect(
      omitShaderBlock('if (disabled) call(); retained();', 'if (disabled)'),
    ).toBe(' retained();');
    expect(() =>
      omitShaderBlock('if (disabled) { nested();', 'if (disabled)'),
    ).toThrow('Unbalanced');
  });
});
