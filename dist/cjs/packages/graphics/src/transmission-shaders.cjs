const require_rendering = require("../../../src/data/rendering.cjs");
//#region dist/packages/graphics/src/transmission-shaders.js
var transmissionWGSL = `
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
fn opticalFiltered(uv: vec2f, settings: vec4f, layer: i32, linear: bool) -> vec4f {
  let dimensions = vec2i(settings.xy);
  let address = i32(settings.z);
  let modes = vec2i(address%3,address/3);
  let wrappedUV = vec2f(opticalWrapUV(uv.x,modes.x),opticalWrapUV(uv.y,modes.y));
  let p = wrappedUV*settings.xy-0.5;
  if (!linear) { return opticalTexel(vec2i(floor(p+0.5)),dimensions,modes,layer); }
  let first = vec2i(floor(p));
  let fraction = fract(p);
  return mix(mix(opticalTexel(first,dimensions,modes,layer),opticalTexel(first+vec2i(1,0),dimensions,modes,layer),fraction.x),mix(opticalTexel(first+vec2i(0,1),dimensions,modes,layer),opticalTexel(first+vec2i(1,1),dimensions,modes,layer),fraction.x),fraction.y);
}
fn opticalSample(uv: vec2f, settings: vec4f, layer: i32) -> vec4f {
  if (settings.x < 1.0) { return vec4f(1.0); }
  let dx = dpdx(uv)*settings.xy;
  let dy = dpdy(uv)*settings.xy;
  let filters = i32(settings.w)&3;
  let linear = select(filters/2,filters%2,max(length(dx),length(dy)) > 1.0) != 0;
  let maximum = i32(settings.w)/4+1;
  if (maximum <= 1 || !linear) { return opticalFiltered(uv,settings,layer,linear); }
  // Flattened rows cannot use a hardware sampler across unrelated texels.
  // The principal footprint axis also handles sheared UVs.
  let a = dx.x*dx.x+dy.x*dy.x;
  let b = dx.x*dx.y+dy.x*dy.y;
  let c = dx.y*dx.y+dy.y*dy.y;
  let discriminant = sqrt(max((a-c)*(a-c)+4.0*b*b,0.0));
  let major = max((a+c+discriminant)*0.5,0.0);
  let minor = max((a+c-discriminant)*0.5,1.0);
  let count = clamp(i32(ceil(sqrt(major/minor))),1,maximum);
  if (count == 1) { return opticalFiltered(uv,settings,layer,linear); }
  var direction = vec2f(1.0,0.0);
  if (abs(b) > 0.00001) { direction = normalize(vec2f(b,major-a)); }
  else if (c > a) { direction = vec2f(0.0,1.0); }
  let axis = direction*sqrt(major)/settings.xy;
  var result = vec4f(0.0);
  for (var i = 0; i < count; i++) {
    result += opticalFiltered(uv+axis*((f32(i)+0.5)/f32(count)-0.5),settings,layer,true);
  }
  return result/f32(count);
}
fn opaqueColor(uv: vec2f) -> vec3f {
  let edge = 0.5/vec2f(textureDimensions(backgroundMap));
  return textureSampleLevel(backgroundMap,environmentSampler,clamp(uv,edge,vec2f(1.0)-edge),0.0).rgb;
}
fn roughTransmission(uv: vec2f, rough: f32, ior: f32) -> vec3f {
  let size = vec2f(textureDimensions(backgroundMap));
  let radius = rough*rough*min(size.x,size.y)*${require_rendering.transmissionBlurFraction}*clamp(ior*2.0-2.0,0.0,1.0);
  if (radius < 0.01) { return opaqueColor(uv); }
  let step = vec2f(radius)/size;
  var color = opaqueColor(uv)*0.25;
  color += (opaqueColor(uv+vec2f(step.x,0.0))+opaqueColor(uv-vec2f(step.x,0.0))+opaqueColor(uv+vec2f(0.0,step.y))+opaqueColor(uv-vec2f(0.0,step.y)))*0.125;
  color += (opaqueColor(uv+step)+opaqueColor(uv-step)+opaqueColor(uv+vec2f(step.x,-step.y))+opaqueColor(uv+vec2f(-step.x,step.y)))*0.0625;
  return color;
}
`;
var transmissionGLSL = `
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
vec4 opticalFiltered(vec2 uv, vec4 settings, int layer, bool linear) {
  ivec2 dimensions = ivec2(settings.xy);
  int address = int(settings.z);
  ivec2 modes = ivec2(address%3,address/3);
  vec2 wrappedUV = vec2(opticalWrapUV(uv.x,modes.x),opticalWrapUV(uv.y,modes.y));
  vec2 p = wrappedUV*settings.xy-.5;
  if (!linear) return opticalTexel(ivec2(floor(p+.5)),dimensions,modes,layer);
  ivec2 first = ivec2(floor(p));
  vec2 fraction = fract(p);
  return mix(mix(opticalTexel(first,dimensions,modes,layer),opticalTexel(first+ivec2(1,0),dimensions,modes,layer),fraction.x),mix(opticalTexel(first+ivec2(0,1),dimensions,modes,layer),opticalTexel(first+ivec2(1,1),dimensions,modes,layer),fraction.x),fraction.y);
}
vec4 opticalSample(vec2 uv, vec4 settings, int layer) {
  if (settings.x < 1.0) return vec4(1.0);
  vec2 dx = dFdx(uv)*settings.xy;
  vec2 dy = dFdy(uv)*settings.xy;
  int filters = int(settings.w)&3;
  bool linear = (max(length(dx),length(dy)) > 1.0 ? filters%2 : filters/2) != 0;
  int maximum = int(settings.w)/4+1;
  if (maximum <= 1 || !linear) return opticalFiltered(uv,settings,layer,linear);
  float a = dx.x*dx.x+dy.x*dy.x;
  float b = dx.x*dx.y+dy.x*dy.y;
  float c = dx.y*dx.y+dy.y*dy.y;
  float discriminant = sqrt(max((a-c)*(a-c)+4.0*b*b,0.0));
  float major = max((a+c+discriminant)*.5,0.0);
  float minor = max((a+c-discriminant)*.5,1.0);
  int count = clamp(int(ceil(sqrt(major/minor))),1,maximum);
  if (count == 1) return opticalFiltered(uv,settings,layer,linear);
  vec2 direction = vec2(1.0,0.0);
  if (abs(b) > .00001) direction = normalize(vec2(b,major-a));
  else if (c > a) direction = vec2(0.0,1.0);
  vec2 axis = direction*sqrt(major)/settings.xy;
  vec4 result = vec4(0.0);
  for (int i = 0; i < count; i++)
    result += opticalFiltered(uv+axis*((float(i)+.5)/float(count)-.5),settings,layer,true);
  return result/float(count);
}
vec3 opaqueColor(vec2 uv) {
  vec2 edge = .5/vec2(textureSize(opaqueScene,0));
  return textureLod(opaqueScene,clamp(uv,edge,1.0-edge),0.0).rgb;
}
vec3 roughTransmission(vec2 uv, float rough, float ior) {
  vec2 size = vec2(textureSize(opaqueScene,0));
  float radius = rough*rough*min(size.x,size.y)*${require_rendering.transmissionBlurFraction}*clamp(ior*2.0-2.0,0.0,1.0);
  if (radius < .01) return opaqueColor(uv);
  vec2 step = vec2(radius)/size;
  vec3 color = opaqueColor(uv)*.25;
  color += (opaqueColor(uv+vec2(step.x,0.0))+opaqueColor(uv-vec2(step.x,0.0))+opaqueColor(uv+vec2(0.0,step.y))+opaqueColor(uv-vec2(0.0,step.y)))*.125;
  color += (opaqueColor(uv+step)+opaqueColor(uv-step)+opaqueColor(uv+vec2(step.x,-step.y))+opaqueColor(uv+vec2(-step.x,step.y)))*.0625;
  return color;
}
`;
//#endregion
exports.transmissionGLSL = transmissionGLSL;
exports.transmissionWGSL = transmissionWGSL;

//# sourceMappingURL=transmission-shaders.cjs.map