import {
  LIGHTING_POINT_ID_OFFSET,
  SPOT_LIGHT_OFFSET,
  SPOT_LIGHT_STRIDE,
  shadowLimits,
} from '../../../src/data/rendering.js';

export const atlasWGSL = /* wgsl */ `
struct ShadowUniforms {
  params: vec4f, splits: vec4f, forward: vec4f, camera: vec4f,
  points: array<vec4f, 2>, spots: array<vec4f, 2>,
  pointIds: array<vec4f, 2>, spotIds: array<vec4f, 2>,
  matrices: array<mat4x4f, ${shadowLimits.maps}>, quality: vec4f,
};
@group(0) @binding(5) var<uniform> atlas: ShadowUniforms;
@group(3) @binding(0) var<uniform> shadowProjection: mat4x4f;
fn atlasVisibility(index: i32, world: vec3f, normal: vec3f, filtered: bool) -> f32 {
  if (index < 0 || f32(index) >= atlas.params.x || mesh.settings.z < 0.5) { return 1.0; }
  let matrix = atlas.matrices[u32(index)];
  let p = matrix * vec4f(world, 1.0);
  if (p.w <= 0.0) { return 1.0; }
  let projected = p.xyz / p.w;
  let uv = vec2f(projected.x * 0.5 + 0.5, 0.5 - projected.y * 0.5);
  if (projected.z <= 0.0 || projected.z >= 1.0 || any(uv < vec2f(0.0)) || any(uv > vec2f(1.0))) { return 1.0; }
  let grid = i32(atlas.params.y);
  let tileSize = i32(atlas.params.z);
  let origin = vec2i(index % grid, index / grid) * tileSize;
  let pixel = origin + vec2i(uv * f32(tileSize));
  // Project the geometric receiver plane, not screen derivatives or a normal map.
  let axis = select(vec3f(0.0,0.0,1.0), vec3f(0.0,1.0,0.0), abs(normal.z) > 0.9 * length(normal));
  let tangent = cross(normal, axis);
  let bitangent = cross(normal, tangent);
  let a = matrix * vec4f(tangent,0.0);
  let b = matrix * vec4f(bitangent,0.0);
  let da = (a.xyz - projected * a.w) / p.w;
  let db = (b.xyz - projected * b.w) / p.w;
  let determinant = da.x * db.y - da.y * db.x;
  var slope = 0.0;
  if (abs(determinant) > 0.000000000001) {
    slope = (abs(da.z * db.y - da.y * db.z) + abs(da.x * db.z - da.z * db.x)) / abs(determinant);
  }
  let bias = atlas.params.w + min(${shadowLimits.maximumSlopeBias}, atlas.quality.z * slope * 2.0 / f32(tileSize));
  let radius = select(0, 1, filtered);
  var visibility = 0.0;
  for (var y = -radius; y <= radius; y++) { for (var x = -radius; x <= radius; x++) {
    let coord = clamp(pixel + vec2i(x,y), origin, origin + vec2i(tileSize-1));
    let depth = textureLoad(shadowMap, coord, 0);
    visibility += select(0.0,1.0,projected.z-bias <= depth);
  }}
  return visibility / f32((radius*2+1)*(radius*2+1));
}
fn directionalShadow(world: vec3f, normal: vec3f) -> f32 {
  let count = i32(atlas.forward.w);
  let depth = dot(world-atlas.camera.xyz, atlas.forward.xyz);
  var index = 0;
  if (count > 1) {
    if (depth > atlas.splits[u32(count-1)]) { return 1.0; }
    for (var i = 0; i < count-1; i++) { if (depth > atlas.splits[u32(i)]) { index = i+1; } }
  }
  let visibility = atlasVisibility(index,world,normal,true);
  if (count <= 1 || atlas.quality.x <= 0.0) { return visibility; }
  var previous = atlas.quality.y;
  if (index > 0) { previous = atlas.splits[u32(index-1)]; }
  let split = atlas.splits[u32(index)];
  let width = max((split-previous)*atlas.quality.x,0.000001);
  let blend = smoothstep(split-width,split,depth);
  if (blend <= 0.0) { return visibility; }
  var next = 1.0;
  if (index+1 < count) { next = atlasVisibility(index+1,world,normal,true); }
  return mix(visibility,next,blend);
}
fn cubeFace(delta: vec3f) -> i32 {
  let a = abs(delta);
  if (a.x >= a.y && a.x >= a.z) { return select(1,0,delta.x >= 0.0); }
  if (a.y >= a.z) { return select(3,2,delta.y >= 0.0); }
  return select(5,4,delta.z >= 0.0);
}
fn pointShadow(index: u32, world: vec3f, position: vec3f, normal: vec3f) -> f32 {
  let id = scene.pointIds[index/4u][index%4u];
  for (var slot = 0u; slot < ${shadowLimits.pointLights}u; slot++) {
    if (atlas.pointIds[slot/4u][slot%4u] == id) {
      let base = i32(atlas.points[slot/4u][slot%4u]);
      if (base < 0) { return 1.0; }
      let delta = world-position;
      let distance = length(delta);
      if (distance <= 0.000001) { return 1.0; }
      let direction = delta/distance;
      let axis = select(vec3f(0.0,1.0,0.0),vec3f(1.0,0.0,0.0),abs(direction.y)>0.9);
      let tangent = normalize(cross(direction,axis));
      let bitangent = cross(direction,tangent);
      var visibility = 0.0;
      // Each angular PCF tap selects its own face; no duplicated edge-clamped texels.
      for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) {
        let ray = normalize(direction+(tangent*f32(x)+bitangent*f32(y))*2.0/atlas.params.z);
        visibility += atlasVisibility(base+cubeFace(ray),position+ray*distance,normal,false);
      }}
      return visibility/9.0;
    }
  }
  return 1.0;
}
fn spotShadow(index: u32, world: vec3f, normal: vec3f) -> f32 {
  let id = scene.spots[index].inner.y;
  for (var slot = 0u; slot < ${shadowLimits.spotLights}u; slot++) {
    if (atlas.spotIds[slot/4u][slot%4u] == id) {
      return atlasVisibility(i32(atlas.spots[slot/4u][slot%4u]),world,normal,true);
    }
  }
  return 1.0;
}
`;

export const atlasGLSL = /* glsl */ `
layout(std140) uniform ShadowData {
  vec4 atlasParams, atlasSplits, atlasForward, atlasCamera;
  vec4 atlasPoints[2], atlasSpots[2];
  vec4 atlasPointIds[2], atlasSpotIds[2];
  mat4 atlasMatrices[${shadowLimits.maps}]; vec4 atlasQuality;
};
float atlasVisibility(int index, vec3 world, vec3 normal, bool filtered) {
  if (index < 0 || float(index) >= atlasParams.x || !receiveShadow) return 1.0;
  mat4 matrix = atlasMatrices[index];
  vec4 p = matrix * vec4(world,1.0);
  if (p.w <= 0.0) return 1.0;
  vec3 projected = p.xyz/p.w;
  vec2 uv = projected.xy*.5+.5;
  if (projected.z <= 0.0 || projected.z >= 1.0 || any(lessThan(uv,vec2(0.0))) || any(greaterThan(uv,vec2(1.0)))) return 1.0;
  int grid = int(atlasParams.y), tileSize = int(atlasParams.z);
  ivec2 origin = ivec2(index%grid,index/grid)*tileSize;
  ivec2 pixel = origin+ivec2(uv*float(tileSize));
  vec3 axis = abs(normal.z)>0.9*length(normal) ? vec3(0,1,0) : vec3(0,0,1);
  vec3 tangent = cross(normal,axis), bitangent = cross(normal,tangent);
  vec4 a = matrix*vec4(tangent,0.0), b = matrix*vec4(bitangent,0.0);
  vec3 da = (a.xyz-projected*a.w)/p.w, db = (b.xyz-projected*b.w)/p.w;
  float determinant = da.x*db.y-da.y*db.x;
  float slope = abs(determinant)>0.000000000001 ? (abs(da.z*db.y-da.y*db.z)+abs(da.x*db.z-da.z*db.x))/abs(determinant) : 0.0;
  float bias = atlasParams.w+min(${shadowLimits.maximumSlopeBias},atlasQuality.z*slope*2.0/float(tileSize));
  int radius = filtered ? 1 : 0;
  float visibility = 0.0;
  for (int y=-radius;y<=radius;y++) for (int x=-radius;x<=radius;x++) {
    ivec2 coord = clamp(pixel+ivec2(x,y),origin,origin+ivec2(tileSize-1));
    float depth = texelFetch(shadowMap,coord,0).r;
    visibility += projected.z-bias <= depth ? 1.0 : 0.0;
  }
  return visibility/float((radius*2+1)*(radius*2+1));
}
float directionalShadow() {
  int count = int(atlasForward.w), index = 0;
  float depth = dot(vPosition-atlasCamera.xyz,atlasForward.xyz);
  if (count > 1) {
    if (depth > atlasSplits[count-1]) return 1.0;
    for (int i=0;i<3;i++) { if (i>=count-1) break; if(depth>atlasSplits[i]) index=i+1; }
  }
  float visibility = atlasVisibility(index,vPosition,vNormal,true);
  if (count<=1 || atlasQuality.x<=0.0) return visibility;
  float previous = index>0 ? atlasSplits[index-1] : atlasQuality.y;
  float split = atlasSplits[index];
  float blend = smoothstep(split-max((split-previous)*atlasQuality.x,0.000001),split,depth);
  if (blend<=0.0) return visibility;
  float next = index+1<count ? atlasVisibility(index+1,vPosition,vNormal,true) : 1.0;
  return mix(visibility,next,blend);
}
int cubeFace(vec3 delta) {
  vec3 a = abs(delta);
  if (a.x >= a.y && a.x >= a.z) return delta.x >= 0.0 ? 0 : 1;
  if (a.y >= a.z) return delta.y >= 0.0 ? 2 : 3;
  return delta.z >= 0.0 ? 4 : 5;
}
float pointShadow(int index, vec3 position) {
  float id = lighting[${LIGHTING_POINT_ID_OFFSET / 4} + index/4][index%4];
  for (int slot=0;slot<${shadowLimits.pointLights};slot++) {
    if (atlasPointIds[slot/4][slot%4] == id) {
      int base = int(atlasPoints[slot/4][slot%4]);
      if (base < 0) return 1.0;
      vec3 delta = vPosition-position;
      float distance = length(delta);
      if (distance<=0.000001) return 1.0;
      vec3 direction = delta/distance;
      vec3 axis = abs(direction.y)>0.9 ? vec3(1,0,0) : vec3(0,1,0);
      vec3 tangent = normalize(cross(direction,axis)), bitangent = cross(direction,tangent);
      float visibility = 0.0;
      for (int y=-1;y<=1;y++) for (int x=-1;x<=1;x++) {
        vec3 ray = normalize(direction+(tangent*float(x)+bitangent*float(y))*2.0/atlasParams.z);
        visibility += atlasVisibility(base+cubeFace(ray),position+ray*distance,vNormal,false);
      }
      return visibility/9.0;
    }
  }
  return 1.0;
}
float spotShadow(int index) {
  float id = lighting[${SPOT_LIGHT_OFFSET / 4} + index * ${SPOT_LIGHT_STRIDE / 4} + 3].y;
  for (int slot=0;slot<${shadowLimits.spotLights};slot++) {
    if (atlasSpotIds[slot/4][slot%4] == id)
      return atlasVisibility(int(atlasSpots[slot/4][slot%4]),vPosition,vNormal,true);
  }
  return 1.0;
}
`;
