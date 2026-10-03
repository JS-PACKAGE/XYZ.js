import { SHEEN_LUT_SIZE } from '../../../src/data/sheen.js';

const vectors = (SHEEN_LUT_SIZE * SHEEN_LUT_SIZE) / 4;

export const sheenWGSL = /* wgsl */ `
@group(0) @binding(6) var<uniform> sheenLookup: array<vec4f, ${vectors}>;
fn sheenSample(x: u32, y: u32) -> f32 {
  let index = y*${SHEEN_LUT_SIZE}u+x;
  return sheenLookup[index/4u][index%4u];
}
fn sheenAlbedo(nv: f32, rough: f32) -> f32 {
  let p = clamp(vec2f(nv,rough)*${SHEEN_LUT_SIZE}.0-0.5,vec2f(0.0),vec2f(${SHEEN_LUT_SIZE - 1}.0));
  let low = vec2u(p); let high = min(low+vec2u(1u),vec2u(${SHEEN_LUT_SIZE - 1}u));
  let f = fract(p);
  return mix(mix(sheenSample(low.x,low.y),sheenSample(high.x,low.y),f.x),
    mix(sheenSample(low.x,high.y),sheenSample(high.x,high.y),f.x),f.y);
}
fn sheenLogLambda(x: f32, alpha: f32) -> f32 {
  let t = (1.0-alpha)*(1.0-alpha);
  let a = mix(21.5473,25.3245,t); let b = mix(3.82987,3.32435,t);
  let c = mix(0.19823,0.16801,t); let d = mix(-1.97760,-1.27393,t);
  let e = mix(-4.32054,-4.85967,t);
  return a/(1.0+b*pow(x,c))+d*x+e;
}
fn sheenLambda(x: f32, alpha: f32) -> f32 {
  if (x < 0.5) { return exp(sheenLogLambda(x,alpha)); }
  return exp(2.0*sheenLogLambda(0.5,alpha)-sheenLogLambda(1.0-x,alpha));
}
fn sheenLobe(n: vec3f, v: vec3f, l: vec3f, rough: f32) -> f32 {
  let nv = clamp(dot(n,v),0.000001,1.0); let nl = clamp(dot(n,l),0.0,1.0);
  let nh = clamp(dot(n,safeNormal(v+l)),0.0,1.0);
  let alpha = rough*rough; let inverse = 1.0/alpha;
  let distribution = (2.0+inverse)*pow(max(1.0-nh*nh,0.0),inverse*0.5)/6.28318530718;
  return distribution/(4.0*nv*(1.0+sheenLambda(nv,alpha)+sheenLambda(nl,alpha)))*select(0.0,1.0,nl > 0.0);
}
`;

export const sheenGLSL = /* glsl */ `
layout(std140) uniform SheenLookup { vec4 sheenLookup[${vectors}]; };
float sheenSample(int x, int y) {
  int index = y*${SHEEN_LUT_SIZE}+x;
  return vec4Component(sheenLookup[index/4],index%4);
}
float sheenAlbedo(float nv, float rough) {
  vec2 p = clamp(vec2(nv,rough)*${SHEEN_LUT_SIZE}.0-.5,vec2(0.0),vec2(${SHEEN_LUT_SIZE - 1}.0));
  ivec2 low = ivec2(p), high = min(low+ivec2(1),ivec2(${SHEEN_LUT_SIZE - 1}));
  vec2 f = fract(p);
  return mix(mix(sheenSample(low.x,low.y),sheenSample(high.x,low.y),f.x),
    mix(sheenSample(low.x,high.y),sheenSample(high.x,high.y),f.x),f.y);
}
float sheenLogLambda(float x, float alpha) {
  float t = (1.0-alpha)*(1.0-alpha);
  float a = mix(21.5473,25.3245,t), b = mix(3.82987,3.32435,t);
  float c = mix(.19823,.16801,t), d = mix(-1.97760,-1.27393,t);
  float e = mix(-4.32054,-4.85967,t);
  return a/(1.0+b*pow(x,c))+d*x+e;
}
float sheenLambda(float x, float alpha) {
  return exp(x < .5 ? sheenLogLambda(x,alpha) : 2.0*sheenLogLambda(.5,alpha)-sheenLogLambda(1.0-x,alpha));
}
float sheenLobe(vec3 n, vec3 v, vec3 l, float rough) {
  float nv = clamp(dot(n,v),.000001,1.0), nl = clamp(dot(n,l),0.0,1.0);
  vec3 h = (v+l)/max(length(v+l),.000001);
  float nh = clamp(dot(n,h),0.0,1.0), alpha = rough*rough, inverse = 1.0/alpha;
  float distribution = (2.0+inverse)*pow(max(1.0-nh*nh,0.0),inverse*.5)/(2.0*PI);
  return nl > 0.0 ? distribution/(4.0*nv*(1.0+sheenLambda(nv,alpha)+sheenLambda(nl,alpha))) : 0.0;
}
`;
