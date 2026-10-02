export const gpuParticles3DWGSL=`
struct Uniforms {
  vp: mat4x4<f32>, model: mat4x4<f32>, right: vec4<f32>, up: vec4<f32>,
  clock: vec4<f32>, velocityMin: vec4<f32>, velocityMax: vec4<f32>,
  gravity: vec4<f32>, startColor: vec4<f32>, endColor: vec4<f32>, sizes: vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;
fn hash(input: u32) -> u32 {
  var x = input;
  x = (x ^ (x >> 16u)) * 2146121005u;
  x = (x ^ (x >> 15u)) * 2221713035u;
  return x ^ (x >> 16u);
}
fn random(input: u32) -> f32 { return f32(hash(input) >> 8u) / 16777216.0; }
struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>, @location(1) color: vec4<f32>,
};
@vertex fn vertexMain(
  @builtin(vertex_index) vertex: u32,
  @location(0) birth: f32, @location(1) sequence: u32,
  @location(2) m0: vec4<f32>, @location(3) m1: vec4<f32>,
  @location(4) m2: vec4<f32>, @location(5) m3: vec4<f32>,
) -> VertexOut {
  let corners = array<vec2<f32>, 6>(vec2(-1.0,-1.0),vec2(1.0,-1.0),vec2(-1.0,1.0),vec2(-1.0,1.0),vec2(1.0,-1.0),vec2(1.0,1.0));
  let age = u.clock.x - birth;
  let progress = clamp(age / u.clock.y, 0.0, 1.0);
  let seed = sequence ^ bitcast<u32>(u.sizes.z);
  let sample = vec3(random(seed), random(seed ^ 2654435769u), random(seed ^ 2246822507u));
  let velocity = mix(u.velocityMin.xyz, u.velocityMax.xyz, sample);
  let offset = velocity * age + u.gravity.xyz * (0.5 * age * age);
  var model = u.model;
  if (u.clock.z > 0.5) { model = mat4x4(m0, m1, m2, m3); }
  let center = (model * vec4(offset, 1.0)).xyz;
  let corner = corners[vertex];
  let radius = mix(u.sizes.x, u.sizes.y, progress) * 0.5;
  var out: VertexOut;
  out.position = u.vp * vec4(center + (u.right.xyz * corner.x + u.up.xyz * corner.y) * radius, 1.0);
  out.uv = corner;
  out.color = mix(u.startColor, u.endColor, progress);
  if (age < 0.0 || age >= u.clock.y) { out.color.a = 0.0; }
  return out;
}
fn encode(color: vec3<f32>) -> vec3<f32> {
  return select(1.055 * pow(max(color, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, color * 12.92, color <= vec3(0.0031308));
}
@fragment fn fragmentMain(in: VertexOut) -> @location(0) vec4<f32> {
  let alpha = in.color.a * (1.0 - smoothstep(0.7, 1.0, dot(in.uv, in.uv)));
  if (alpha <= 0.0) { discard; }
  var color = in.color.rgb;
  if (u.clock.w < 0.5) { color = encode(color); }
  return vec4(color * alpha, alpha);
}
`;export const gpuParticles3DVertexGLSL=`#version 300 es
precision highp float;
precision highp int;
layout(location=0) in float birth;
layout(location=1) in uint sequence;
layout(location=2) in vec4 m0;
layout(location=3) in vec4 m1;
layout(location=4) in vec4 m2;
layout(location=5) in vec4 m3;
layout(std140) uniform Uniforms {
  mat4 vp; mat4 model; vec4 right; vec4 up; vec4 clock;
  vec4 velocityMin; vec4 velocityMax; vec4 gravity;
  vec4 startColor; vec4 endColor; vec4 sizes;
};
out vec2 uv;
out vec4 color;
uint hash(uint x) {
  x = (x ^ (x >> 16u)) * 2146121005u;
  x = (x ^ (x >> 15u)) * 2221713035u;
  return x ^ (x >> 16u);
}
float random(uint x) { return float(hash(x) >> 8u) / 16777216.0; }
void main() {
  vec2 corners[6] = vec2[6](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(-1,1),vec2(1,-1),vec2(1,1));
  float age = clock.x - birth;
  float progress = clamp(age / clock.y, 0.0, 1.0);
  uint seed = sequence ^ floatBitsToUint(sizes.z);
  vec3 sampleValue = vec3(random(seed), random(seed ^ 2654435769u), random(seed ^ 2246822507u));
  vec3 velocity = mix(velocityMin.xyz, velocityMax.xyz, sampleValue);
  vec3 offsetValue = velocity * age + gravity.xyz * (0.5 * age * age);
  mat4 pose = clock.z > 0.5 ? mat4(m0,m1,m2,m3) : model;
  vec3 center = (pose * vec4(offsetValue, 1.0)).xyz;
  uv = corners[gl_VertexID];
  float radius = mix(sizes.x, sizes.y, progress) * 0.5;
  gl_Position = vp * vec4(center + (right.xyz * uv.x + up.xyz * uv.y) * radius, 1.0);
  // Engine camera depth is [0,1]; OpenGL's clip depth is [-1,1].
  gl_Position.z = gl_Position.z * 2.0 - gl_Position.w;
  color = mix(startColor, endColor, progress);
  if (age < 0.0 || age >= clock.y) color.a = 0.0;
}
`;export const gpuParticles3DFragmentGLSL=`#version 300 es
precision highp float;
layout(std140) uniform Uniforms {
  mat4 vp; mat4 model; vec4 right; vec4 up; vec4 clock;
  vec4 velocityMin; vec4 velocityMax; vec4 gravity;
  vec4 startColor; vec4 endColor; vec4 sizes;
};
in vec2 uv;
in vec4 color;
out vec4 fragColor;
vec3 encode(vec3 value) {
  return mix(1.055 * pow(max(value, vec3(0)), vec3(1.0 / 2.4)) - 0.055, value * 12.92, lessThanEqual(value, vec3(0.0031308)));
}
void main() {
  float alpha = color.a * (1.0 - smoothstep(0.7, 1.0, dot(uv,uv)));
  if (alpha <= 0.0) discard;
  vec3 rgb = clock.w > 0.5 ? color.rgb : encode(color.rgb);
  fragColor = vec4(rgb * alpha, alpha);
}
`;
//# sourceMappingURL=gpu-particles3d-shaders.js.map
