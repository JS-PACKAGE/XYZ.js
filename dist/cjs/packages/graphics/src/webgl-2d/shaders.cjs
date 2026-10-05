//#region dist/packages/graphics/src/webgl-2d/shaders.js
var e = `uniform vec4 uniforms[4];
vec4 uniformValue(int index) { return uniforms[index]; }
`;
var layerVertex = `#version 300 es
precision highp float;
out vec2 vUV;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  vUV = vec2(p.x, 1.0 - p.y);
}`;
function processorFragment(t) {
	return `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D image;
uniform vec2 viewportSize;
out vec4 color;
${e}
// Render-target storage is bottom-left; the native ABI is top-left.
vec4 sampleInput(vec2 uv) { return texture(image, vec2(uv.x, 1.0 - uv.y)); }
${t}
void main() { color = effect(sampleInput(vUV), vUV, vUV * viewportSize); }
`;
}
var compositeFragment = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D image;
uniform sampler2D previousImage;
uniform bool hasPrevious;
uniform int transitionKind;
uniform float progress;
uniform vec4 transitionColor;
uniform vec2 slideDirection;
out vec4 color;
vec4 sampleFrame(sampler2D frame, vec2 uv) {
  return texture(frame, vec2(uv.x, 1.0 - uv.y));
}
bool inside(vec2 uv) {
  return all(greaterThanEqual(uv, vec2(0.0))) && all(lessThan(uv, vec2(1.0)));
}
vec4 previousAt(vec2 uv) {
  return hasPrevious ? sampleFrame(previousImage, uv) : transitionColor;
}
void main() {
  vec4 incoming = sampleFrame(image, vUV);
  if (transitionKind == 0) { color = incoming; return; }
  if (transitionKind == 1) {
    color = progress < 0.5
      ? mix(previousAt(vUV), transitionColor, progress * 2.0)
      : mix(transitionColor, incoming, progress * 2.0 - 1.0);
  } else if (transitionKind == 2) {
    color = mix(previousAt(vUV), incoming, progress);
  } else {
    vec2 oldUV = vUV - slideDirection * progress;
    vec2 newUV = vUV + slideDirection * (1.0 - progress);
    color = (inside(oldUV) ? previousAt(oldUV) : vec4(0.0))
      + (inside(newUV) ? sampleFrame(image, newUV) : vec4(0.0));
  }
}`;
//#endregion
exports.compositeFragment = compositeFragment;
exports.layerVertex = layerVertex;
exports.processorFragment = processorFragment;

//# sourceMappingURL=shaders.cjs.map