//#region dist/packages/graphics/src/webgpu-2d/shaders.js
var e = `
struct FrameSettings { viewport: vec4f, direction: vec4f, color: vec4f, spare: vec4f, };
@group(2) @binding(0) var<uniform> settings: FrameSettings;
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) screen: vec2f,
};
@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  let corners = array<vec2f, 3>(vec2f(0.0, 0.0), vec2f(2.0, 0.0), vec2f(0.0, 2.0));
  let uv = corners[index];
  var output: VertexOutput;
  output.position = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  output.uv = uv;
  output.screen = uv * settings.viewport.xy;
  return output;
}`;
function postWGSL(t) {
	return `${e}
@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var inputSampler: sampler;
struct EffectUniforms { values: array<vec4f, 4>, };
@group(1) @binding(0) var<uniform> uniforms: EffectUniforms;
fn uniformValue(index: u32) -> vec4f { return uniforms.values[index]; }
fn sampleInput(uv: vec2f) -> vec4f { return textureSampleLevel(inputTexture, inputSampler, uv, 0.0); }
${t ?? `fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f { return color; }`}
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return effect(sampleInput(input.uv), input.uv, input.screen);
}`;
}
var transitionWGSL = `${e}
@group(0) @binding(0) var incoming: texture_2d<f32>;
@group(0) @binding(1) var frameSampler: sampler;
@group(0) @binding(2) var outgoing: texture_2d<f32>;
fn oldColor(uv: vec2f) -> vec4f {
  if (settings.direction.z == 0.0) { return settings.color; }
  return textureSampleLevel(outgoing, frameSampler, uv, 0.0);
}
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let progress = settings.viewport.z;
  let mode = settings.viewport.w;
  let current = textureSampleLevel(incoming, frameSampler, input.uv, 0.0);
  if (mode == 0.0) { return mix(oldColor(input.uv), current, progress); }
  if (mode == 1.0) {
    if (progress < 0.5) { return mix(oldColor(input.uv), settings.color, progress * 2.0); }
    return mix(settings.color, current, progress * 2.0 - 1.0);
  }
  let direction = settings.direction.xy;
  let newUV = input.uv + direction * (1.0 - progress);
  let oldUV = input.uv - direction * progress;
  // Select the incoming footprint, not clamped outside texels stretched across the screen.
  if (all(newUV >= vec2f(0.0)) && all(newUV <= vec2f(1.0))) {
    return textureSampleLevel(incoming, frameSampler, newUV, 0.0);
  }
  return oldColor(oldUV);
}`;
//#endregion
exports.postWGSL = postWGSL;
exports.transitionWGSL = transitionWGSL;

//# sourceMappingURL=shaders.cjs.map