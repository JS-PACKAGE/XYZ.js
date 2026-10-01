import{transmissionBlurFraction as e}from"../../../src/data/rendering.js";export const transmissionWGSL=`
fn opticalWrapUV(x: f32, mode: i32) -> f32 {
  if (mode == 1) { return fract(x); }
  if (mode == 2) { return 1.0-abs(1.0-(x-floor(x*0.5)*2.0)); }
  return clamp(x,0.0,1.0);
}
fn opticalAddress(x: i32, size: i32, mode: i32) -> i32 {
  if (mode == 0) { return clamp(x,0,size-1); }
  let period = select(size,size*2,mode == 2);
  let wrapped = ((x%period)+period)%period;
  return select(wrapped,period-1-wrapped,mode == 2 && wrapped >= size);
}
fn opticalTexel(p: vec2i, dimensions: vec2i, modes: vec2i, layer: i32) -> vec4f {
  let addressed = vec2i(opticalAddress(p.x,dimensions.x,modes.x),opticalAddress(p.y,dimensions.y,modes.y));
  let index = addressed.y*dimensions.x+addressed.x;
  let side = i32(textureDimensions(opticalMaps).x);
  return textureLoad(opticalMaps,vec2i(index%side,index/side),layer,0);
}
fn opticalSample(uv: vec2f, settings: vec4f, layer: i32) -> vec4f {
  if (settings.x < 1.0) { return vec4f(1.0); }
  let dimensions = vec2i(settings.xy);
  let address = i32(settings.z);
  let modes = vec2i(address%3,address/3);
  let footprint = max(length(dpdx(uv)*settings.xy),length(dpdy(uv)*settings.xy));
  let filters = i32(settings.w);
  let linear = select(filters/2,filters%2,footprint > 1.0) != 0;
  let wrappedUV = vec2f(opticalWrapUV(uv.x,modes.x),opticalWrapUV(uv.y,modes.y));
  let p = wrappedUV*settings.xy-0.5;
  if (!linear) { return opticalTexel(vec2i(floor(p+0.5)),dimensions,modes,layer); }
  let first = vec2i(floor(p));
  let fraction = fract(p);
  return mix(mix(opticalTexel(first,dimensions,modes,layer),opticalTexel(first+vec2i(1,0),dimensions,modes,layer),fraction.x),mix(opticalTexel(first+vec2i(0,1),dimensions,modes,layer),opticalTexel(first+vec2i(1,1),dimensions,modes,layer),fraction.x),fraction.y);
}
fn opaqueColor(uv: vec2f) -> vec3f {
  let edge = 0.5/vec2f(textureDimensions(backgroundMap));
  return textureSampleLevel(backgroundMap,environmentSampler,clamp(uv,edge,vec2f(1.0)-edge),0.0).rgb;
}
fn roughTransmission(uv: vec2f, rough: f32, ior: f32) -> vec3f {
  let size = vec2f(textureDimensions(backgroundMap));
  let radius = rough*rough*min(size.x,size.y)*${e}*clamp(ior*2.0-2.0,0.0,1.0);
  if (radius < 0.01) { return opaqueColor(uv); }
  let step = vec2f(radius)/size;
  var color = opaqueColor(uv)*0.25;
  color += (opaqueColor(uv+vec2f(step.x,0.0))+opaqueColor(uv-vec2f(step.x,0.0))+opaqueColor(uv+vec2f(0.0,step.y))+opaqueColor(uv-vec2f(0.0,step.y)))*0.125;
  color += (opaqueColor(uv+step)+opaqueColor(uv-step)+opaqueColor(uv+vec2f(step.x,-step.y))+opaqueColor(uv+vec2f(-step.x,step.y)))*0.0625;
  return color;
}
`;export const transmissionGLSL=`
float opticalWrapUV(float x, int mode) {
  if (mode == 1) return fract(x);
  if (mode == 2) return 1.0-abs(1.0-(x-floor(x*.5)*2.0));
  return clamp(x,0.0,1.0);
}
int opticalAddress(int x, int size, int mode) {
  if (mode == 0) return clamp(x,0,size-1);
  int period = mode == 2 ? size*2 : size;
  int wrapped = ((x%period)+period)%period;
  return mode == 2 && wrapped >= size ? period-1-wrapped : wrapped;
}
vec4 opticalTexel(ivec2 p, ivec2 dimensions, ivec2 modes, int layer) {
  ivec2 addressed = ivec2(opticalAddress(p.x,dimensions.x,modes.x),opticalAddress(p.y,dimensions.y,modes.y));
  int index = addressed.y*dimensions.x+addressed.x;
  int side = textureSize(opticalMaps,0).x;
  return texelFetch(opticalMaps,ivec3(index%side,index/side,layer),0);
}
vec4 opticalSample(vec2 uv, vec4 settings, int layer) {
  if (settings.x < 1.0) return vec4(1.0);
  ivec2 dimensions = ivec2(settings.xy);
  int address = int(settings.z);
  ivec2 modes = ivec2(address%3,address/3);
  float footprint = max(length(dFdx(uv)*settings.xy),length(dFdy(uv)*settings.xy));
  int filters = int(settings.w);
  bool linear = (footprint > 1.0 ? filters%2 : filters/2) != 0;
  vec2 wrappedUV = vec2(opticalWrapUV(uv.x,modes.x),opticalWrapUV(uv.y,modes.y));
  vec2 p = wrappedUV*settings.xy-.5;
  if (!linear) return opticalTexel(ivec2(floor(p+.5)),dimensions,modes,layer);
  ivec2 first = ivec2(floor(p));
  vec2 fraction = fract(p);
  return mix(mix(opticalTexel(first,dimensions,modes,layer),opticalTexel(first+ivec2(1,0),dimensions,modes,layer),fraction.x),mix(opticalTexel(first+ivec2(0,1),dimensions,modes,layer),opticalTexel(first+ivec2(1,1),dimensions,modes,layer),fraction.x),fraction.y);
}
vec3 opaqueColor(vec2 uv) {
  vec2 edge = .5/vec2(textureSize(opaqueScene,0));
  return textureLod(opaqueScene,clamp(uv,edge,1.0-edge),0.0).rgb;
}
vec3 roughTransmission(vec2 uv, float rough, float ior) {
  vec2 size = vec2(textureSize(opaqueScene,0));
  float radius = rough*rough*min(size.x,size.y)*${e}*clamp(ior*2.0-2.0,0.0,1.0);
  if (radius < .01) return opaqueColor(uv);
  vec2 step = vec2(radius)/size;
  vec3 color = opaqueColor(uv)*.25;
  color += (opaqueColor(uv+vec2(step.x,0.0))+opaqueColor(uv-vec2(step.x,0.0))+opaqueColor(uv+vec2(0.0,step.y))+opaqueColor(uv-vec2(0.0,step.y)))*.125;
  color += (opaqueColor(uv+step)+opaqueColor(uv-step)+opaqueColor(uv+vec2(step.x,-step.y))+opaqueColor(uv+vec2(-step.x,step.y)))*.0625;
  return color;
}
`;
//# sourceMappingURL=transmission-shaders.js.map
