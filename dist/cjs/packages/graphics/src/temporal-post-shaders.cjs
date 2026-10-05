//#region dist/packages/graphics/src/temporal-post-shaders.js
function temporalWGSL(e, t) {
	return `
struct Settings { vp: mat4x4f, inverseVP: mat4x4f, previousVP: mat4x4f, camera: vec4f, trace: vec4f, surface: vec4f };
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var depthImage: ${e > 1 ? `texture_depth_multisampled_2d` : `texture_depth_2d`};
@group(0) @binding(2) var<uniform> settings: Settings;
${t ? `@group(0) @binding(3) var history: texture_2d<f32>;
@group(0) @binding(4) var historyDepth: texture_2d<f32>;` : ``}
@vertex fn vertexMain(@builtin(vertex_index) i:u32)->@builtin(position) vec4f {
  let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3)); return vec4f(p[i],0,1);
}
fn pixel(uv:vec2f)->vec2i { return clamp(vec2i(uv*settings.surface.zw),vec2i(0),vec2i(settings.surface.zw)-vec2i(1)); }
fn depthAt(p:vec2i)->f32 {
 let q=clamp(p,vec2i(0),vec2i(settings.surface.zw)-vec2i(1));
 ${e > 1 ? `var d=1.0; for(var i=0;i<${e};i++){d=min(d,textureLoad(depthImage,q,i));} return d;` : `return textureLoad(depthImage,q,0);`}
}
fn world(uv:vec2f,d:f32)->vec3f {let p=settings.inverseVP*vec4f(uv*vec2f(2,-2)+vec2f(-1,1),d,1); return p.xyz/p.w;}
fn uvOf(clip:vec4f)->vec2f {return clip.xy/clip.w*vec2f(0.5,-0.5)+vec2f(0.5);}
${t ? `
struct Output {@location(0) color:vec4f,@location(1) depth:f32};
@fragment fn fragmentMain(@builtin(position) p:vec4f)->Output {
 let ip=vec2i(p.xy); let uv=p.xy/settings.surface.zw; let d=depthAt(ip); let color=textureLoad(source,ip,0);
 var result=color; let previous=settings.previousVP*vec4f(world(uv,d),1); let huv=uvOf(previous);
 if(settings.camera.w>0 && d<1 && previous.w>0 && all(huv>=vec2f(0)) && all(huv<vec2f(1))) {
  let hp=pixel(huv); let pd=textureLoad(historyDepth,hp,0).r;
  if(abs(pd-previous.z/previous.w)<=settings.trace.x) {
   var lo=color; var hi=color;
   for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){let n=textureLoad(source,clamp(ip+vec2i(x,y),vec2i(0),vec2i(settings.surface.zw)-vec2i(1)),0);lo=min(lo,n);hi=max(hi,n);}}
   result=mix(color,clamp(textureLoad(history,hp,0),lo,hi),settings.camera.w);
  }
 }
 var output:Output; output.color=result;
 // Store this world's clip depth, not a linear or view-space depth.
 let clip=settings.vp*vec4f(world(uv,d),1); output.depth=clip.z/clip.w; return output;
}` : `
@fragment fn fragmentMain(@builtin(position) p:vec4f)->@location(0) vec4f {
 let ip=vec2i(p.xy); let uv=p.xy/settings.surface.zw; let d=depthAt(ip); let base=textureLoad(source,ip,0);
 if(d>=1 || settings.surface.y<=0 || settings.surface.x>=1){return base;}
 let origin=world(uv,d);
 let r=world((vec2f(ip+vec2i(1,0))+vec2f(0.5))/settings.surface.zw,depthAt(ip+vec2i(1,0)))-origin;
 let l=origin-world((vec2f(ip-vec2i(1,0))+vec2f(0.5))/settings.surface.zw,depthAt(ip-vec2i(1,0)));
 let u=world((vec2f(ip+vec2i(0,1))+vec2f(0.5))/settings.surface.zw,depthAt(ip+vec2i(0,1)))-origin;
 let b=origin-world((vec2f(ip-vec2i(0,1))+vec2f(0.5))/settings.surface.zw,depthAt(ip-vec2i(0,1)));
 let dx=select(l,r,dot(r,r)<dot(l,l)); let dy=select(b,u,dot(u,u)<dot(b,b));
 let n0=cross(dx,dy); if(length(n0)<0.000001){return base;}
 let view=normalize(settings.camera.xyz-origin); var normal=normalize(n0); if(dot(normal,view)<0){normal=-normal;}
 let ray=reflect(-view,normal); let step=settings.trace.w/max(settings.trace.y,1); var last=0.0;
 for(var i=1;i<=i32(settings.trace.y);i++) {
  var t=f32(i)*step; let point=origin+normal*settings.trace.z+ray*t; let clip=settings.vp*vec4f(point,1); let hitUV=uvOf(clip);
  if(clip.w<=0 || any(hitUV<=vec2f(0)) || any(hitUV>=vec2f(1))){break;}
  let sd=depthAt(pixel(hitUV)); let delta=clip.z/clip.w-sd;
  if(sd<1 && delta>=0) {
   var low=last; var high=t;
   for(var j=0;j<5;j++){let mid=(low+high)*0.5; let c=settings.vp*vec4f(origin+normal*settings.trace.z+ray*mid,1);let v=uvOf(c);if(c.z/c.w>depthAt(pixel(v))){high=mid;}else{low=mid;}}
   t=(low+high)*0.5; let c=settings.vp*vec4f(origin+normal*settings.trace.z+ray*t,1);let v=uvOf(c);let scenePoint=world(v,depthAt(pixel(v)));
   if(distance(scenePoint,origin+normal*settings.trace.z+ray*t)<=settings.trace.z) {
    let reflected=textureLoad(source,pixel(v),0); let edge=clamp(min(min(v.x,v.y),min(1-v.x,1-v.y))*10,0,1);
    let fresnel=0.04+0.96*pow(1-max(dot(normal,view),0),5);
    return mix(base,vec4f(reflected.rgb,base.a),clamp(settings.surface.y*(1-settings.surface.x)*(1-settings.surface.x)*fresnel*edge*(1-t/settings.trace.w),0,1));
   }
   break;
  }
  last=t;
 }
 // Misses retain the physically shaded source, including its environment reflection.
 return base;
}`}
`;
}
var temporalGLVertex = `#version 300 es
precision highp float;
void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); gl_Position=vec4(p*2.0-1.0,0,1); }`;
function temporalGLFragment(e) {
	return `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D sourceImage, depthImage, historyImage, historyDepth;
layout(std140) uniform Settings { mat4 vp; mat4 inverseVP; mat4 previousVP; vec4 camera; vec4 trace; vec4 surface; };
layout(location=0) out vec4 color;
${e ? `layout(location=1) out float storedDepth;` : ``}
ivec2 pixel(vec2 uv){return clamp(ivec2(uv*surface.zw),ivec2(0),ivec2(surface.zw)-1);}
float depthAt(ivec2 p){return texelFetch(depthImage,clamp(p,ivec2(0),ivec2(surface.zw)-1),0).r;}
vec3 world(vec2 uv,float d){vec4 p=inverseVP*vec4(uv*2.0-1.0,d,1);return p.xyz/p.w;}
vec2 uvOf(vec4 p){return p.xy/p.w*0.5+0.5;}
void main(){
 ivec2 ip=ivec2(gl_FragCoord.xy);vec2 uv=gl_FragCoord.xy/surface.zw;float d=depthAt(ip);vec4 base=texelFetch(sourceImage,ip,0);color=base;
 ${e ? `
 vec3 w=world(uv,d);vec4 clip=vp*vec4(w,1);storedDepth=clip.z/clip.w;vec4 prev=previousVP*vec4(w,1);vec2 huv=uvOf(prev);
 if(camera.w>0.0 && d<1.0 && prev.w>0.0 && all(greaterThanEqual(huv,vec2(0))) && all(lessThan(huv,vec2(1)))){
  ivec2 hp=pixel(huv);if(abs(texelFetch(historyDepth,hp,0).r-prev.z/prev.w)<=trace.x){vec4 lo=base,hi=base;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec4 n=texelFetch(sourceImage,clamp(ip+ivec2(x,y),ivec2(0),ivec2(surface.zw)-1),0);lo=min(lo,n);hi=max(hi,n);}color=mix(base,clamp(texelFetch(historyImage,hp,0),lo,hi),camera.w);}
 }` : `
 if(d>=1.0 || surface.y<=0.0 || surface.x>=1.0)return;
 vec3 origin=world(uv,d);vec3 r=world((vec2(ip+ivec2(1,0))+0.5)/surface.zw,depthAt(ip+ivec2(1,0)))-origin;vec3 l=origin-world((vec2(ip-ivec2(1,0))+0.5)/surface.zw,depthAt(ip-ivec2(1,0)));vec3 u=world((vec2(ip+ivec2(0,1))+0.5)/surface.zw,depthAt(ip+ivec2(0,1)))-origin;vec3 b=origin-world((vec2(ip-ivec2(0,1))+0.5)/surface.zw,depthAt(ip-ivec2(0,1)));
 vec3 n=cross(dot(r,r)<dot(l,l)?r:l,dot(u,u)<dot(b,b)?u:b);if(length(n)<0.000001)return;vec3 view=normalize(camera.xyz-origin);n=normalize(n);if(dot(n,view)<0.0)n=-n;vec3 ray=reflect(-view,n);float stepSize=trace.w/max(trace.y,1.0),last=0.0;
 for(int i=1;i<=int(trace.y);i++){float t=float(i)*stepSize;vec4 clip=vp*vec4(origin+n*trace.z+ray*t,1);vec2 v=uvOf(clip);if(clip.w<=0.0 || any(lessThanEqual(v,vec2(0))) || any(greaterThanEqual(v,vec2(1))))break;float sd=depthAt(pixel(v));if(sd<1.0 && clip.z/clip.w>=sd){float low=last,high=t;for(int j=0;j<5;j++){float mid=(low+high)*0.5;vec4 c=vp*vec4(origin+n*trace.z+ray*mid,1);if(c.z/c.w>depthAt(pixel(uvOf(c))))high=mid;else low=mid;}t=(low+high)*0.5;vec4 c=vp*vec4(origin+n*trace.z+ray*t,1);v=uvOf(c);if(distance(world(v,depthAt(pixel(v))),origin+n*trace.z+ray*t)<=trace.z){vec4 hit=texelFetch(sourceImage,pixel(v),0);float edge=clamp(min(min(v.x,v.y),min(1.0-v.x,1.0-v.y))*10.0,0.0,1.0);float fresnel=0.04+0.96*pow(1.0-max(dot(n,view),0.0),5.0);color=mix(base,vec4(hit.rgb,base.a),clamp(surface.y*(1.0-surface.x)*(1.0-surface.x)*fresnel*edge*(1.0-t/trace.w),0.0,1.0));}break;}last=t;
 }`}
}`;
}
//#endregion
exports.temporalGLFragment = temporalGLFragment;
exports.temporalGLVertex = temporalGLVertex;
exports.temporalWGSL = temporalWGSL;

//# sourceMappingURL=temporal-post-shaders.cjs.map