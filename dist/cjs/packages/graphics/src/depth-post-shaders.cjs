const require_rendering = require("../../../src/data/rendering.cjs");
//#region dist/packages/graphics/src/depth-post-shaders.js
var t = Array.from({ length: require_rendering.depthPostDefaults.dofSamples }, (t, n) => {
	let r = n * require_rendering.depthPostDefaults.dofGoldenAngle, i = Math.sqrt((n + .5) / require_rendering.depthPostDefaults.dofSamples);
	return `vec2f(${(Math.cos(r) * i).toFixed(8)},${(Math.sin(r) * i).toFixed(8)})`;
}).join(`,`);
var n = Array.from({ length: require_rendering.depthPostDefaults.ssaoDirections }, (t, n) => {
	let r = (n + .5) * Math.PI * 2 / require_rendering.depthPostDefaults.ssaoDirections;
	return `vec2f(${Math.cos(r).toFixed(8)},${Math.sin(r).toFixed(8)})`;
}).join(`,`);
function depthPostWGSL(r) {
	return `
@group(0) @binding(2) var depthImage: ${r > 1 ? `texture_depth_multisampled_2d` : `texture_depth_2d`};
const DOF_OFFSETS = array<vec2f,${require_rendering.depthPostDefaults.dofSamples}>(${t});
const AO_OFFSETS = array<vec2f,${require_rendering.depthPostDefaults.ssaoDirections}>(${n});
fn depthAt(pixel: vec2i) -> f32 {
  let size = vec2i(textureDimensions(depthImage));
  let p = clamp(pixel,vec2i(0),size-vec2i(1));
  ${r > 1 ? `var depth = 1.0; for (var sample = 0; sample < ${r}; sample++) { depth = min(depth,textureLoad(depthImage,p,sample)); } return depth;` : `return textureLoad(depthImage,p,0);`}
}
fn viewDepth(depth: f32) -> f32 {
  if (settings.clip.z > 0.5) { return mix(settings.clip.x,settings.clip.y,depth); }
  return settings.clip.x*settings.clip.y/max(settings.clip.y-depth*(settings.clip.y-settings.clip.x),0.000001);
}
fn worldAt(pixel: vec2i, depth: f32) -> vec3f {
  let size = vec2f(textureDimensions(source));
  let ndc = ((vec2f(pixel)+0.5)/size)*vec2f(2.0,-2.0)+vec2f(-1.0,1.0);
  let p = settings.inverseVP*vec4f(ndc,depth,1.0);
  return p.xyz/p.w;
}
fn ambientOcclusion(pixel: vec2i) -> f32 {
  if (settings.ssao.x < 0.5 || settings.ssao.z == 0.0) { return 1.0; }
  let depth = depthAt(pixel);
  if (depth >= 1.0) { return 1.0; }
  let world = worldAt(pixel,depth);
  let right = worldAt(pixel+vec2i(1,0),depthAt(pixel+vec2i(1,0)))-world;
  let left = world-worldAt(pixel-vec2i(1,0),depthAt(pixel-vec2i(1,0)));
  let down = worldAt(pixel+vec2i(0,1),depthAt(pixel+vec2i(0,1)))-world;
  let up = world-worldAt(pixel-vec2i(0,1),depthAt(pixel-vec2i(0,1)));
  let dx = select(left,right,dot(right,right) < dot(left,left));
  let dy = select(up,down,dot(down,down) < dot(up,up));
  // A derivative crossing empty space cannot define a surface normal.
  if (dot(dx,dx) > settings.ssao.y*settings.ssao.y || dot(dy,dy) > settings.ssao.y*settings.ssao.y) { return 1.0; }
  var normal = cross(dx,dy);
  normal /= max(length(normal),0.000001);
  if (dot(normal,worldAt(pixel,0.0)-worldAt(pixel,1.0)) < 0.0) { normal = -normal; }
  let size = vec2i(textureDimensions(source));
  let scale = select(max(viewDepth(depth),0.000001),1.0,settings.clip.z > 0.5);
  let radius = min(settings.ssao.y*f32(size.y)*0.5*settings.clip.w/scale,f32(max(size.x,size.y)));
  var occlusion = 0.0;
  for (var ring = 0; ring < ${require_rendering.depthPostDefaults.ssaoRings}; ring++) {
    for (var i = 0; i < ${require_rendering.depthPostDefaults.ssaoDirections}; i++) {
      let offset = vec2i(round(AO_OFFSETS[i]*radius*f32(ring+1)/${require_rendering.depthPostDefaults.ssaoRings.toFixed(1)}));
      let p = pixel+offset;
      if (any(p < vec2i(0)) || any(p >= size)) { continue; }
      let sampled = depthAt(p);
      if (sampled >= 1.0) { continue; }
      let delta = worldAt(p,sampled)-world;
      let distance = length(delta);
      let elevation = dot(normal,delta);
      if (distance > 0.000001 && distance < settings.ssao.y && elevation > settings.ssao.w) {
        occlusion += (elevation/distance)*(1.0-distance/settings.ssao.y);
      }
    }
  }
  return clamp(1.0-settings.ssao.z*occlusion/${(require_rendering.depthPostDefaults.ssaoRings * require_rendering.depthPostDefaults.ssaoDirections / 2).toFixed(1)},0.0,1.0);
}
fn focusedSample(pixel: vec2i) -> vec4f {
  let size = vec2i(textureDimensions(source));
  let center = textureLoad(source,pixel,0);
  if (settings.dof.x < 0.5 || settings.dof.w == 0.0) { return center; }
  let centerDepth = viewDepth(depthAt(pixel));
  let radius = settings.dof.w*clamp(abs(centerDepth-settings.dof.y)/settings.dof.z,0.0,1.0);
  if (radius < 0.5) { return center; }
  var color = center*0.2;
  var weight = 0.2;
  for (var i = 0; i < ${require_rendering.depthPostDefaults.dofSamples}; i++) {
    let offset = vec2i(round(DOF_OFFSETS[i]*radius));
    let p = clamp(pixel+offset,vec2i(0),size-vec2i(1));
    let neighborDepth = viewDepth(depthAt(p));
    let neighborBlur = settings.dof.w*clamp(abs(neighborDepth-settings.dof.y)/settings.dof.z,0.0,1.0);
    // A sharp foreground must not spread into the defocused background.
    if (neighborDepth+settings.dof.z < centerDepth && neighborBlur < 0.5) { continue; }
    color += textureLoad(source,p,0)*${(.8 / require_rendering.depthPostDefaults.dofSamples).toFixed(8)};
    weight += ${(.8 / require_rendering.depthPostDefaults.dofSamples).toFixed(8)};
  }
  return color/weight;
}
`;
}
var depthPostGLSL = `
uniform sampler2D depthImage;
uniform mat4 inverseVP;
uniform vec4 clip;
uniform vec4 ssao;
uniform vec4 dof;
const vec2 DOF_OFFSETS[${require_rendering.depthPostDefaults.dofSamples}] = vec2[${require_rendering.depthPostDefaults.dofSamples}](${t.replaceAll(`vec2f`, `vec2`)});
const vec2 AO_OFFSETS[${require_rendering.depthPostDefaults.ssaoDirections}] = vec2[${require_rendering.depthPostDefaults.ssaoDirections}](${n.replaceAll(`vec2f`, `vec2`)});
float depthAt(ivec2 pixel) {
  return texelFetch(depthImage,clamp(pixel,ivec2(0),textureSize(depthImage,0)-1),0).r;
}
float viewDepth(float depth) {
  return clip.z > .5 ? mix(clip.x,clip.y,depth) : clip.x*clip.y/max(clip.y-depth*(clip.y-clip.x),.000001);
}
vec3 worldAt(ivec2 pixel,float depth) {
  vec2 ndc=(vec2(pixel)+.5)/vec2(textureSize(image,0))*2.0-1.0;
  vec4 p=inverseVP*vec4(ndc,depth,1.0);
  return p.xyz/p.w;
}
float ambientOcclusion(ivec2 pixel) {
  if(ssao.x < .5 || ssao.z == 0.0) return 1.0;
  float depth=depthAt(pixel);
  if(depth >= 1.0) return 1.0;
  vec3 world=worldAt(pixel,depth);
  vec3 right=worldAt(pixel+ivec2(1,0),depthAt(pixel+ivec2(1,0)))-world;
  vec3 left=world-worldAt(pixel-ivec2(1,0),depthAt(pixel-ivec2(1,0)));
  vec3 up=worldAt(pixel+ivec2(0,1),depthAt(pixel+ivec2(0,1)))-world;
  vec3 down=world-worldAt(pixel-ivec2(0,1),depthAt(pixel-ivec2(0,1)));
  vec3 dx=dot(right,right)<dot(left,left)?right:left;
  vec3 dy=dot(up,up)<dot(down,down)?up:down;
  if(dot(dx,dx)>ssao.y*ssao.y||dot(dy,dy)>ssao.y*ssao.y)return 1.0;
  vec3 normal=cross(dx,dy);
  normal/=max(length(normal),.000001);
  if(dot(normal,worldAt(pixel,0.0)-worldAt(pixel,1.0))<0.0)normal=-normal;
  ivec2 size=textureSize(image,0);
  float scale=clip.z>.5?1.0:max(viewDepth(depth),.000001);
  float radius=min(ssao.y*float(size.y)*.5*clip.w/scale,float(max(size.x,size.y)));
  float occlusion=0.0;
  for(int ring=0;ring<${require_rendering.depthPostDefaults.ssaoRings};ring++)for(int i=0;i<${require_rendering.depthPostDefaults.ssaoDirections};i++) {
    ivec2 p=pixel+ivec2(round(AO_OFFSETS[i]*radius*float(ring+1)/${require_rendering.depthPostDefaults.ssaoRings.toFixed(1)}));
    if(any(lessThan(p,ivec2(0)))||any(greaterThanEqual(p,size)))continue;
    float sampled=depthAt(p);
    if(sampled>=1.0)continue;
    vec3 delta=worldAt(p,sampled)-world;
    float distance=length(delta),elevation=dot(normal,delta);
    if(distance>.000001&&distance<ssao.y&&elevation>ssao.w)
      occlusion+=(elevation/distance)*(1.0-distance/ssao.y);
  }
  return clamp(1.0-ssao.z*occlusion/${(require_rendering.depthPostDefaults.ssaoRings * require_rendering.depthPostDefaults.ssaoDirections / 2).toFixed(1)},0.0,1.0);
}
vec4 focusedSample(ivec2 pixel) {
  vec4 center=texelFetch(image,pixel,0);
  if(dof.x<.5||dof.w==0.0)return center;
  float centerDepth=viewDepth(depthAt(pixel));
  float radius=dof.w*clamp(abs(centerDepth-dof.y)/dof.z,0.0,1.0);
  if(radius<.5)return center;
  vec4 color=center*.2;
  float weight=.2;
  ivec2 size=textureSize(image,0);
  for(int i=0;i<${require_rendering.depthPostDefaults.dofSamples};i++) {
    ivec2 offset=ivec2(round(DOF_OFFSETS[i]*radius));
    ivec2 p=clamp(pixel+offset,ivec2(0),size-1);
    float neighborDepth=viewDepth(depthAt(p));
    float neighborBlur=dof.w*clamp(abs(neighborDepth-dof.y)/dof.z,0.0,1.0);
    if(neighborDepth+dof.z<centerDepth&&neighborBlur<.5)continue;
    color+=texelFetch(image,p,0)*${(.8 / require_rendering.depthPostDefaults.dofSamples).toFixed(8)};
    weight+=${(.8 / require_rendering.depthPostDefaults.dofSamples).toFixed(8)};
  }
  return color/weight;
}
`;
//#endregion
exports.depthPostGLSL = depthPostGLSL;
exports.depthPostWGSL = depthPostWGSL;

//# sourceMappingURL=depth-post-shaders.cjs.map