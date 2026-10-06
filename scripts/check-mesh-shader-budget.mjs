import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import {
  buildMeshFragment,
  meshFragment,
} from '../dist/packages/graphics/src/webgl-feature-shaders.js';
import { buildWebGPUMeshShader } from '../dist/packages/graphics/src/webgpu-mesh-shader.js';
import { meshShaderVariantLimits } from '../dist/src/data/rendering.js';

const plain = {
  pbr: true,
  clearcoat: false,
  sheen: false,
  transmission: false,
  dispersion: false,
  anisotropy: false,
  iridescence: false,
  subsurface: false,
  height: false,
  weathering: false,
  detail: false,
  triplanar: false,
  lightmap: false,
  skinned: false,
  instanced: false,
  morph: false,
  shadows: false,
  environment: false,
  native: false,
};
const fragment = buildMeshFragment(plain);
const bytes = Buffer.byteLength(fragment);
assert(
  bytes < meshShaderVariantLimits.plainFragmentMaxBytes,
  `Plain PBR GLSL ${bytes} exceeds budget ${meshShaderVariantLimits.plainFragmentMaxBytes}`,
);
for (const source of [fragment, buildWebGPUMeshShader(plain)]) {
  for (const disabled of [
    'roughTransmission(',
    'sheenLobe(',
    'thinFilm(',
    'anisotropicGGX(',
    'diffusionProfile(',
  ]) {
    assert(!source.includes(disabled), `Plain PBR still includes ${disabled}`);
  }
}
console.log(
  JSON.stringify({
    plainPBRFragmentBytes: bytes,
    fullPBRFragmentBytes: Buffer.byteLength(meshFragment),
    budget: meshShaderVariantLimits.plainFragmentMaxBytes,
  }),
);
