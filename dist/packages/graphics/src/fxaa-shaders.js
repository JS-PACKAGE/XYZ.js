import{fxaaDefaults as e}from"../../../src/data/rendering.js";export const fxaaWGSL=`
@group(0) @binding(0) var image: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f,3>(vec2f(-1.0,-1.0),vec2f(3.0,-1.0),vec2f(-1.0,3.0));
  return vec4f(positions[index],0.0,1.0);
}
fn luma(c: vec4f) -> f32 { return dot(c.rgb,vec3f(0.299,0.587,0.114)); }
fn sampleAt(uv: vec2f) -> vec4f { return textureSampleLevel(image,linearSampler,uv,0.0); }
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let pixel = 1.0/vec2f(textureDimensions(image));
  let uv = position.xy*pixel;
  let center = sampleAt(uv);
  let nw = luma(sampleAt(uv+vec2f(-1.0,-1.0)*pixel));
  let ne = luma(sampleAt(uv+vec2f(1.0,-1.0)*pixel));
  let sw = luma(sampleAt(uv+vec2f(-1.0,1.0)*pixel));
  let se = luma(sampleAt(uv+vec2f(1.0,1.0)*pixel));
  let middle = luma(center);
  let minimum = min(middle,min(min(nw,ne),min(sw,se)));
  let maximum = max(middle,max(max(nw,ne),max(sw,se)));
  if (maximum-minimum < max(${e.minimumContrast},maximum*${e.relativeContrast})) { return center; }
  var direction = vec2f(-((nw+ne)-(sw+se)),(nw+sw)-(ne+se));
  let reduction = max((nw+ne+sw+se)*0.25*${e.directionReduction},${e.minimumReduction});
  direction = clamp(direction/(min(abs(direction.x),abs(direction.y))+reduction),vec2f(-${e.maximumSpan.toFixed(1)}),vec2f(${e.maximumSpan.toFixed(1)}))*pixel;
  let a = 0.5*(sampleAt(uv+direction*(-1.0/6.0))+sampleAt(uv+direction*(1.0/6.0)));
  let b = a*0.5+0.25*(sampleAt(uv+direction*(-0.5))+sampleAt(uv+direction*0.5));
  let value = luma(b);
  return select(b,a,value < minimum || value > maximum);
}`;export const fxaaGLSL=`#version 300 es
precision highp float;
uniform sampler2D image;
out vec4 color;
float luma(vec4 c) { return dot(c.rgb,vec3(.299,.587,.114)); }
void main() {
  vec2 pixel = 1.0/vec2(textureSize(image,0));
  vec2 uv = gl_FragCoord.xy*pixel;
  vec4 center = texture(image,uv);
  float nw = luma(texture(image,uv+vec2(-1.0,-1.0)*pixel));
  float ne = luma(texture(image,uv+vec2(1.0,-1.0)*pixel));
  float sw = luma(texture(image,uv+vec2(-1.0,1.0)*pixel));
  float se = luma(texture(image,uv+vec2(1.0,1.0)*pixel));
  float middle = luma(center);
  float minimum = min(middle,min(min(nw,ne),min(sw,se)));
  float maximum = max(middle,max(max(nw,ne),max(sw,se)));
  if (maximum-minimum < max(${e.minimumContrast},maximum*${e.relativeContrast})) { color=center; return; }
  vec2 direction = vec2(-((nw+ne)-(sw+se)),(nw+sw)-(ne+se));
  float reduction = max((nw+ne+sw+se)*.25*${e.directionReduction},${e.minimumReduction});
  direction = clamp(direction/(min(abs(direction.x),abs(direction.y))+reduction),vec2(-${e.maximumSpan.toFixed(1)}),vec2(${e.maximumSpan.toFixed(1)}))*pixel;
  vec4 a = .5*(texture(image,uv+direction*(-1.0/6.0))+texture(image,uv+direction*(1.0/6.0)));
  vec4 b = a*.5+.25*(texture(image,uv+direction*(-.5))+texture(image,uv+direction*.5));
  float value = luma(b);
  color = value < minimum || value > maximum ? a : b;
}`;
//# sourceMappingURL=fxaa-shaders.js.map
