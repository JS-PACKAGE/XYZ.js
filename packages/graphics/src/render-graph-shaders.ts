import { postWGSL } from './webgpu-2d/shaders.js';
import { layerVertex, processorFragment } from './webgl-2d/shaders.js';

/** Preserve the existing PostProcessor2D ABI and add named ordered attachments. */
export function graphWGSL(source: string, inputCount: number): string {
  let inputs = '';
  for (let index = 1; index < inputCount; index++)
    inputs += `@group(0) @binding(${index + 1}) var inputTexture${index}: texture_2d<f32>;\nfn sampleInput${index}(uv: vec2f) -> vec4f { return textureSampleLevel(inputTexture${index}, inputSampler, uv, 0.0); }\n`;
  return postWGSL(inputs + source);
}
export function graphGLSL(
  source: string,
  inputCount: number,
): { vertex: string; fragment: string } {
  let inputs = '';
  for (let index = 1; index < inputCount; index++)
    inputs += `uniform sampler2D image${index};\nvec4 sampleInput${index}(vec2 uv) { return texture(image${index}, vec2(uv.x, 1.0-uv.y)); }\n`;
  return { vertex: layerVertex, fragment: processorFragment(inputs + source) };
}
export const graphIdentityWGSL =
  'fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f { return color; }';
export const graphIdentityGLSL =
  'vec4 effect(vec4 color, vec2 uv, vec2 screen) { return color; }';
