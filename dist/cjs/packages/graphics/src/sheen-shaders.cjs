const require_rendering = require("../../../src/data/rendering.cjs");
//#region dist/packages/graphics/src/sheen-shaders.js
var n = 256;
var r = Array.from({ length: require_rendering.materialQuality.sheenSamples }, (e, n) => {
	let r = n, i = 0, a = .5;
	for (; r;) i += (r & 1) * a, r >>>= 1, a *= .5;
	let o = (n + .5) / require_rendering.materialQuality.sheenSamples * Math.PI * 2;
	return [
		Math.cos(o),
		Math.sin(o),
		i
	];
});
var sheenWGSL = `
@group(0) @binding(6) var<uniform> sheenLookup: array<vec4f, ${n}>;
fn sheenSample(x: u32, y: u32) -> f32 {
  let index = y*32u+x;
  return sheenLookup[index/4u][index%4u];
}
fn sheenAlbedo(nv: f32, rough: f32) -> f32 {
  let p = clamp(vec2f(nv,rough)*32.0-0.5,vec2f(0.0),vec2f(31.0));
  let low = vec2u(p); let high = min(low+vec2u(1u),vec2u(31u));
  let f = fract(p);
  return mix(mix(sheenSample(low.x,low.y),sheenSample(high.x,low.y),f.x),
    mix(sheenSample(low.x,high.y),sheenSample(high.x,high.y),f.x),f.y);
}
fn sheenLogLambda(x: f32, alpha: f32) -> f32 {
  let t = (1.0-alpha)*(1.0-alpha);
  let a = mix(21.5473,25.3245,t); let b = mix(3.82987,3.32435,t);
  let c = mix(0.19823,0.16801,t); let d = mix(-1.97760,-1.27393,t);
  let e = mix(-4.32054,-4.85967,t);
  return a/(1.0+b*pow(x,c))+d*x+e;
}
fn sheenLambda(x: f32, alpha: f32) -> f32 {
  if (x < 0.5) { return exp(sheenLogLambda(x,alpha)); }
  return exp(2.0*sheenLogLambda(0.5,alpha)-sheenLogLambda(1.0-x,alpha));
}
fn sheenLobe(n: vec3f, v: vec3f, l: vec3f, rough: f32) -> f32 {
  let nv = clamp(dot(n,v),0.000001,1.0); let nl = clamp(dot(n,l),0.0,1.0);
  let nh = clamp(dot(n,safeNormal(v+l)),0.0,1.0);
  let alpha = rough*rough; let inverse = 1.0/alpha;
  let distribution = (2.0+inverse)*pow(max(1.0-nh*nh,0.0),inverse*0.5)/6.28318530718;
  return distribution/(4.0*nv*(1.0+sheenLambda(nv,alpha)+sheenLambda(nl,alpha)))*select(0.0,1.0,nl > 0.0);
}
fn sheenLightRetention(nl: f32, rough: f32, tint: f32, viewEnergy: f32) -> f32 {
  if(tint<=0.0) {return 1.0;}
  return 1.0-tint*max(viewEnergy,sheenAlbedo(clamp(nl,0.0,1.0),rough));
}
`;
var sheenGLSL = `
layout(std140) uniform SheenLookup { vec4 sheenLookup[${n}]; };
float sheenSample(int x, int y) {
  int index = y*32+x;
  return vec4Component(sheenLookup[index/4],index%4);
}
float sheenAlbedo(float nv, float rough) {
  vec2 p = clamp(vec2(nv,rough)*32.0-.5,vec2(0.0),vec2(31.0));
  ivec2 low = ivec2(p), high = min(low+ivec2(1),ivec2(31));
  vec2 f = fract(p);
  return mix(mix(sheenSample(low.x,low.y),sheenSample(high.x,low.y),f.x),
    mix(sheenSample(low.x,high.y),sheenSample(high.x,high.y),f.x),f.y);
}
float sheenLogLambda(float x, float alpha) {
  float t = (1.0-alpha)*(1.0-alpha);
  float a = mix(21.5473,25.3245,t), b = mix(3.82987,3.32435,t);
  float c = mix(.19823,.16801,t), d = mix(-1.97760,-1.27393,t);
  float e = mix(-4.32054,-4.85967,t);
  return a/(1.0+b*pow(x,c))+d*x+e;
}
float sheenLambda(float x, float alpha) {
  return exp(x < .5 ? sheenLogLambda(x,alpha) : 2.0*sheenLogLambda(.5,alpha)-sheenLogLambda(1.0-x,alpha));
}
float sheenLobe(vec3 n, vec3 v, vec3 l, float rough) {
  float nv = clamp(dot(n,v),.000001,1.0), nl = clamp(dot(n,l),0.0,1.0);
  vec3 h = (v+l)/max(length(v+l),.000001);
  float nh = clamp(dot(n,h),0.0,1.0), alpha = rough*rough, inverse = 1.0/alpha;
  float distribution = (2.0+inverse)*pow(max(1.0-nh*nh,0.0),inverse*.5)/(2.0*PI);
  return nl > 0.0 ? distribution/(4.0*nv*(1.0+sheenLambda(nv,alpha)+sheenLambda(nl,alpha))) : 0.0;
}
float sheenLightRetention(float nl,float rough,float tint,float viewEnergy) {
  if(tint<=0.0) return 1.0;
  return 1.0-tint*max(viewEnergy,sheenAlbedo(clamp(nl,0.0,1.0),rough));
}
`;
var sheenEnvironmentWGSL = `
const charlieSamples=array<vec3f,${require_rendering.materialQuality.sheenSamples}>(
  ${r.map((e) => `vec3f(${e.map((e) => e.toFixed(15)).join(`,`)})`).join(`,
  `)}
);
fn sheenEnvironment(position: vec3f,n: vec3f,v: vec3f,rough: f32,weights: vec4f) -> vec3f {
  let nv=min(dot(n,v),1.0);
  if(nv<=0.0) {return vec3f(0.0);}
  let axis=select(vec3f(1.0,0.0,0.0),vec3f(0.0,0.0,1.0),abs(n.z)<0.999);
  let t=normalize(cross(axis,n));
  let b=cross(n,t);
  let alpha=rough*rough;
  let viewLambda=sheenLambda(nv,alpha);
  var radiance=vec3f(0.0);
  var total=0.0;
  for(var i=0u;i<${require_rendering.materialQuality.sheenSamples}u;i++) {
    let sample=charlieSamples[i];
    let sine=pow(sample.z,alpha/(1.0+2.0*alpha));
    let cosine=sqrt(max(1.0-sine*sine,0.0));
    let h=t*(sine*sample.x)+b*(sine*sample.y)+n*cosine;
    let vh=min(dot(v,h),1.0);
    let l=2.0*vh*h-v;
    let nl=min(dot(n,l),1.0);
    if(vh>0.0 && nl>0.0) {
      let weight=vh/(cosine*nv*(1.0+viewLambda+sheenLambda(nl,alpha)));
      radiance+=reflectionRadiance(position,l,0.0,weights)*weight;
      total+=weight;
    }
  }
  return radiance/total;
}
`;
var sheenEnvironmentGLSL = `
const vec3 charlieSamples[${require_rendering.materialQuality.sheenSamples}]=vec3[${require_rendering.materialQuality.sheenSamples}](
  ${r.map((e) => `vec3(${e.map((e) => e.toFixed(15)).join(`,`)})`).join(`,
  `)}
);
vec3 sheenEnvironment(vec3 position,vec3 n,vec3 v,float rough,vec4 weights) {
  float nv=min(dot(n,v),1.0);
  if(nv<=0.0) return vec3(0.0);
  vec3 axis=abs(n.z)<.999?vec3(0.0,0.0,1.0):vec3(1.0,0.0,0.0);
  vec3 t=normalize(cross(axis,n)),b=cross(n,t);
  float alpha=rough*rough,viewLambda=sheenLambda(nv,alpha),total=0.0;
  vec3 radiance=vec3(0.0);
  for(int i=0;i<${require_rendering.materialQuality.sheenSamples};i++) {
    vec3 point=charlieSamples[i];
    float sine=pow(point.z,alpha/(1.0+2.0*alpha));
    float cosine=sqrt(max(1.0-sine*sine,0.0));
    vec3 h=t*(sine*point.x)+b*(sine*point.y)+n*cosine;
    float vh=min(dot(v,h),1.0);
    vec3 l=2.0*vh*h-v;
    float nl=min(dot(n,l),1.0);
    if(vh>0.0 && nl>0.0) {
      float weight=vh/(cosine*nv*(1.0+viewLambda+sheenLambda(nl,alpha)));
      radiance+=reflectionRadiance(position,l,0.0,weights)*weight;
      total+=weight;
    }
  }
  return radiance/total;
}
`;
//#endregion
exports.sheenEnvironmentGLSL = sheenEnvironmentGLSL;
exports.sheenEnvironmentWGSL = sheenEnvironmentWGSL;
exports.sheenGLSL = sheenGLSL;
exports.sheenWGSL = sheenWGSL;

//# sourceMappingURL=sheen-shaders.cjs.map