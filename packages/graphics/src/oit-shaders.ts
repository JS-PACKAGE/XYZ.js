import { oitSettings } from '../../../src/data/rendering.js';

export const oitWeightWGSL = /* wgsl */ `
fn transparencyWeight(alpha: f32, depth: f32) -> f32 {
  return clamp(pow(alpha+0.01,3.0)*${oitSettings.scale}.0*pow(1.0-depth*0.9,3.0),${oitSettings.minWeight},${oitSettings.maxWeight}.0);
}
`;
export const oitWeightGLSL = /* glsl */ `
float transparencyWeight(float alpha, float depth) {
  return clamp(pow(alpha+0.01,3.0)*${oitSettings.scale}.0*pow(1.0-depth*0.9,3.0),${oitSettings.minWeight},${oitSettings.maxWeight}.0);
}
`;
export const oitCompositeWGSL = /* wgsl */ `
@group(0) @binding(0) var accumulation: texture_2d<f32>;
@group(0) @binding(1) var revealage: texture_2d<f32>;
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let p=vec2f(f32((index<<1u)&2u),f32(index&2u));
  return vec4f(p*2.0-1.0,0.0,1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let p=vec2i(position.xy);
  let sum=textureLoad(accumulation,p,0);
  let alpha=1.0-textureLoad(revealage,p,0).r;
  return vec4f(sum.rgb/max(sum.a,0.00001)*alpha,alpha);
}
`;
export const oitCompositeGLSL = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D accumulation;
uniform sampler2D revealage;
out vec4 color;
void main() {
  ivec2 p=ivec2(gl_FragCoord.xy);
  vec4 sum=texelFetch(accumulation,p,0);
  float alpha=1.0-texelFetch(revealage,p,0).r;
  color=vec4(sum.rgb/max(sum.a,0.00001)*alpha,alpha);
}
`;
