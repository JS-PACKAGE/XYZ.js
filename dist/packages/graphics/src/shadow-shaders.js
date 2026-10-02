import{LIGHTING_POINT_ID_OFFSET as e,SPOT_LIGHT_OFFSET as t,SPOT_LIGHT_STRIDE as n,shadowLimits as r}from"../../../src/data/rendering.js";export const atlasWGSL=`
struct ShadowUniforms {
  params: vec4f, splits: vec4f, forward: vec4f, camera: vec4f,
  points: array<vec4f, 2>, spots: array<vec4f, 2>,
  pointIds: array<vec4f, 2>, spotIds: array<vec4f, 2>,
  matrices: array<mat4x4f, ${r.maps}>,
};
@group(0) @binding(5) var<uniform> atlas: ShadowUniforms;
@group(3) @binding(0) var<uniform> shadowProjection: mat4x4f;
fn atlasVisibility(index: i32, world: vec3f) -> f32 {
  if (index < 0 || f32(index) >= atlas.params.x || mesh.settings.z < 0.5) { return 1.0; }
  let p = atlas.matrices[u32(index)] * vec4f(world, 1.0);
  if (p.w <= 0.0) { return 1.0; }
  let projected = p.xyz / p.w;
  let uv = vec2f(projected.x * 0.5 + 0.5, 0.5 - projected.y * 0.5);
  if (projected.z <= 0.0 || projected.z >= 1.0 || any(uv < vec2f(0.0)) || any(uv > vec2f(1.0))) { return 1.0; }
  let grid = i32(atlas.params.y);
  let tileSize = i32(atlas.params.z);
  let origin = vec2i(index % grid, index / grid) * tileSize;
  let pixel = origin + vec2i(uv * f32(tileSize));
  var visibility = 0.0;
  for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) {
    let coord = clamp(pixel + vec2i(x,y), origin, origin + vec2i(tileSize-1));
    let depth = textureLoad(shadowMap, coord, 0);
    visibility += select(0.0,1.0,projected.z-atlas.params.w <= depth);
  }}
  return visibility / 9.0;
}
fn directionalShadow(world: vec3f) -> f32 {
  let count = i32(atlas.forward.w);
  let depth = dot(world-atlas.camera.xyz, atlas.forward.xyz);
  var index = 0;
  if (count > 1) {
    if (depth > atlas.splits[u32(count-1)]) { return 1.0; }
    for (var i = 0; i < count-1; i++) { if (depth > atlas.splits[u32(i)]) { index = i+1; } }
  }
  return atlasVisibility(index,world);
}
fn cubeFace(delta: vec3f) -> i32 {
  let a = abs(delta);
  if (a.x >= a.y && a.x >= a.z) { return select(1,0,delta.x >= 0.0); }
  if (a.y >= a.z) { return select(3,2,delta.y >= 0.0); }
  return select(5,4,delta.z >= 0.0);
}
fn pointShadow(index: u32, world: vec3f, position: vec3f) -> f32 {
  let id = scene.pointIds[index/4u][index%4u];
  for (var slot = 0u; slot < ${r.pointLights}u; slot++) {
    if (atlas.pointIds[slot/4u][slot%4u] == id) {
      let base = i32(atlas.points[slot/4u][slot%4u]);
      if (base < 0) { return 1.0; }
      return atlasVisibility(base+cubeFace(world-position),world);
    }
  }
  return 1.0;
}
fn spotShadow(index: u32, world: vec3f) -> f32 {
  let id = scene.spots[index].inner.y;
  for (var slot = 0u; slot < ${r.spotLights}u; slot++) {
    if (atlas.spotIds[slot/4u][slot%4u] == id) {
      return atlasVisibility(i32(atlas.spots[slot/4u][slot%4u]),world);
    }
  }
  return 1.0;
}
`;export const atlasGLSL=`
layout(std140) uniform ShadowData {
  vec4 atlasParams, atlasSplits, atlasForward, atlasCamera;
  vec4 atlasPoints[2], atlasSpots[2];
  vec4 atlasPointIds[2], atlasSpotIds[2];
  mat4 atlasMatrices[${r.maps}];
};
float atlasVisibility(int index) {
  if (index < 0 || float(index) >= atlasParams.x || !receiveShadow) return 1.0;
  vec4 p = atlasMatrices[index] * vec4(vPosition,1.0);
  if (p.w <= 0.0) return 1.0;
  vec3 projected = p.xyz/p.w;
  vec2 uv = projected.xy*.5+.5;
  if (projected.z <= 0.0 || projected.z >= 1.0 || any(lessThan(uv,vec2(0.0))) || any(greaterThan(uv,vec2(1.0)))) return 1.0;
  int grid = int(atlasParams.y), tileSize = int(atlasParams.z);
  ivec2 origin = ivec2(index%grid,index/grid)*tileSize;
  ivec2 pixel = origin+ivec2(uv*float(tileSize));
  float visibility = 0.0;
  for (int y=-1;y<=1;y++) for (int x=-1;x<=1;x++) {
    ivec2 coord = clamp(pixel+ivec2(x,y),origin,origin+ivec2(tileSize-1));
    float depth = texelFetch(shadowMap,coord,0).r;
    visibility += projected.z-atlasParams.w <= depth ? 1.0 : 0.0;
  }
  return visibility/9.0;
}
float directionalShadow() {
  int count = int(atlasForward.w), index = 0;
  float depth = dot(vPosition-atlasCamera.xyz,atlasForward.xyz);
  if (count > 1) {
    if (depth > atlasSplits[count-1]) return 1.0;
    for (int i=0;i<3;i++) { if (i>=count-1) break; if(depth>atlasSplits[i]) index=i+1; }
  }
  return atlasVisibility(index);
}
int cubeFace(vec3 delta) {
  vec3 a = abs(delta);
  if (a.x >= a.y && a.x >= a.z) return delta.x >= 0.0 ? 0 : 1;
  if (a.y >= a.z) return delta.y >= 0.0 ? 2 : 3;
  return delta.z >= 0.0 ? 4 : 5;
}
float pointShadow(int index, vec3 position) {
  float id = lighting[${e/4} + index/4][index%4];
  for (int slot=0;slot<${r.pointLights};slot++) {
    if (atlasPointIds[slot/4][slot%4] == id) {
      int base = int(atlasPoints[slot/4][slot%4]);
      if (base < 0) return 1.0;
      return atlasVisibility(base+cubeFace(vPosition-position));
    }
  }
  return 1.0;
}
float spotShadow(int index) {
  float id = lighting[${t/4} + index * ${n/4} + 3].y;
  for (int slot=0;slot<${r.spotLights};slot++) {
    if (atlasSpotIds[slot/4][slot%4] == id)
      return atlasVisibility(int(atlasSpots[slot/4][slot%4]));
  }
  return 1.0;
}
`;
//# sourceMappingURL=shadow-shaders.js.map
