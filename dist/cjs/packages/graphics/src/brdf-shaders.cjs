//#region dist/packages/graphics/src/brdf-shaders.js
var n = 1024;
var brdfWGSL = `
@group(0) @binding(7) var<uniform> ggxLookup: array<vec4f, ${n}>;
fn ggxSample(x: u32, y: u32) -> vec2f {
  let index=y*64u+x;
  let value=ggxLookup[index/2u];
  return select(value.xy,value.zw,index%2u>0u);
}
fn environmentBRDF(nv: f32, rough: f32) -> vec2f {
  let p=clamp(vec2f(nv,rough),vec2f(0.0),vec2f(1.0))*vec2f(63.0,31.0);
  let low=vec2u(p);let high=min(low+vec2u(1u),vec2u(63u,31u));
  let f=fract(p);
  let value=max(mix(mix(ggxSample(low.x,low.y),ggxSample(high.x,low.y),f.x),mix(ggxSample(low.x,high.y),ggxSample(high.x,high.y),f.x),f.y),vec2f(0.0));
  // Numerical quadrature cannot create reflectance above one.
  return value/max(1.0,value.x+value.y);
}
fn ggxCompensation(f0: vec3f, ab: vec2f) -> vec3f {
  return vec3f(1.0)+f0*(1.0/max(ab.x+ab.y,0.0001)-1.0);
}
fn ggxVisibility(nv: f32, nl: f32, alpha2: f32) -> f32 {
  return 0.5/max(nl*sqrt(alpha2+(1.0-alpha2)*nv*nv)+nv*sqrt(alpha2+(1.0-alpha2)*nl*nl),0.0000001);
}
fn ggxDistribution(nh: f32, alpha2: f32) -> f32 {
  let denominator=1.0-nh*nh+alpha2*nh*nh;
  return alpha2/(3.14159265359*denominator*denominator);
}
fn anisotropicGGX(n: vec3f, t: vec3f, b: vec3f, v: vec3f, l: vec3f, h: vec3f, rough: f32, strength: f32) -> f32 {
  let aspect=sqrt(1.0-0.9*strength);
  let axes=vec2f(rough*rough/aspect,rough*rough*aspect);
  let q=vec3f(dot(t,h)/axes.x,dot(b,h)/axes.y,dot(n,h));
  let d=1.0/(3.14159265359*axes.x*axes.y*dot(q,q)*dot(q,q));
  let nv=clamp(dot(n,v),0.0001,1.0); let nl=clamp(dot(n,l),0.0,1.0);
  let vv=vec3f(axes.x*dot(t,v),axes.y*dot(b,v),nv);
  let ll=vec3f(axes.x*dot(t,l),axes.y*dot(b,l),nl);
  return d*0.5/max(nl*length(vv)+nv*length(ll),0.0000001);
}
// Three visible wavelengths approximate RGB; Airy interference sums all film bounces.
fn thinFilm(nv: f32, filmIor: f32, thickness: f32, f0: vec3f) -> vec3f {
  let c1=sqrt(max(0.0,1.0-(1.0-nv*nv)/(filmIor*filmIor)));
  let root=sqrt(clamp(f0,vec3f(0.0),vec3f(0.9999)));
  let substrate=(vec3f(1.0)+root)/max(vec3f(1.0)-root,vec3f(0.0001));
  let c2=sqrt(max(vec3f(0.0),vec3f(1.0)-(1.0-nv*nv)/(substrate*substrate)));
  let s0=(nv-filmIor*c1)/max(nv+filmIor*c1,0.0001);
  let p0=(filmIor*nv-c1)/max(filmIor*nv+c1,0.0001);
  let s1=(vec3f(filmIor*c1)-substrate*c2)/max(vec3f(filmIor*c1)+substrate*c2,vec3f(0.0001));
  let p1=(substrate*c1-vec3f(filmIor)*c2)/max(substrate*c1+vec3f(filmIor)*c2,vec3f(0.0001));
  let phase=cos(12.56637061436*filmIor*thickness*c1/vec3f(650.0,510.0,475.0));
  let s=2.0*s0*s1*phase; let p=2.0*p0*p1*phase;
  return clamp(0.5*((s0*s0+s1*s1+s)/max(vec3f(1.0)+s0*s0*s1*s1+s,vec3f(0.0001))+(p0*p0+p1*p1+p)/max(vec3f(1.0)+p0*p0*p1*p1+p,vec3f(0.0001))),vec3f(0.0),vec3f(1.0));
}
// Three normalized angular diffusion taps: bounded, thickness-free, not spatial SSS.
fn diffusionProfile(mu: f32, color: vec3f, radius: f32) -> vec3f {
  let r=color*radius;
  let a=r*0.25; let b=r; let c=min(r*2.0,vec3f(1.0));
  return color*(0.25*max(vec3f(mu)+a,vec3f(0.0))/((vec3f(1.0)+a)*(vec3f(1.0)+a))+0.5*max(vec3f(mu)+b,vec3f(0.0))/((vec3f(1.0)+b)*(vec3f(1.0)+b))+0.25*max(vec3f(mu)+c,vec3f(0.0))/((vec3f(1.0)+c)*(vec3f(1.0)+c)));
}
`;
var brdfGLSL = `
layout(std140) uniform GGXLookup { vec4 ggxLookup[${n}]; };
vec2 ggxSample(int x,int y) {
  int index=y*64+x;
  vec4 value=ggxLookup[index/2];
  return index%2>0?value.zw:value.xy;
}
vec2 environmentBRDF(float nv,float rough) {
  vec2 p=clamp(vec2(nv,rough),vec2(0.0),vec2(1.0))*vec2(63.0,31.0);
  ivec2 low=ivec2(p),high=min(low+ivec2(1),ivec2(63,31));
  vec2 f=fract(p);
  vec2 value=max(mix(mix(ggxSample(low.x,low.y),ggxSample(high.x,low.y),f.x),mix(ggxSample(low.x,high.y),ggxSample(high.x,high.y),f.x),f.y),vec2(0.0));
  return value/max(1.0,value.x+value.y);
}
vec3 ggxCompensation(vec3 f0,vec2 ab) {
  return vec3(1.0)+f0*(1.0/max(ab.x+ab.y,.0001)-1.0);
}
float ggxVisibility(float nv,float nl,float alpha2) {
  return .5/max(nl*sqrt(alpha2+(1.0-alpha2)*nv*nv)+nv*sqrt(alpha2+(1.0-alpha2)*nl*nl),.0000001);
}
float ggxDistribution(float nh,float alpha2) {
  float denominator=1.0-nh*nh+alpha2*nh*nh;
  return alpha2/(PI*denominator*denominator);
}
float anisotropicGGX(vec3 n,vec3 t,vec3 b,vec3 v,vec3 l,vec3 h,float rough,float strength) {
  float aspect=sqrt(1.0-0.9*strength);
  vec2 axes=vec2(rough*rough/aspect,rough*rough*aspect);
  vec3 q=vec3(dot(t,h)/axes.x,dot(b,h)/axes.y,dot(n,h));
  float d=1.0/(PI*axes.x*axes.y*dot(q,q)*dot(q,q));
  float nv=clamp(dot(n,v),.0001,1.0),nl=clamp(dot(n,l),0.0,1.0);
  vec3 vv=vec3(axes.x*dot(t,v),axes.y*dot(b,v),nv);
  vec3 ll=vec3(axes.x*dot(t,l),axes.y*dot(b,l),nl);
  return d*.5/max(nl*length(vv)+nv*length(ll),.0000001);
}
// Three-wavelength Airy film; effective real substrate IOR approximates metallic F0.
vec3 thinFilm(float nv,float filmIor,float thickness,vec3 f0) {
  float c1=sqrt(max(0.0,1.0-(1.0-nv*nv)/(filmIor*filmIor)));
  vec3 root=sqrt(clamp(f0,vec3(0.0),vec3(.9999)));
  vec3 substrate=(vec3(1.0)+root)/max(vec3(1.0)-root,vec3(.0001));
  vec3 c2=sqrt(max(vec3(0.0),vec3(1.0)-(1.0-nv*nv)/(substrate*substrate)));
  float s0=(nv-filmIor*c1)/max(nv+filmIor*c1,.0001);
  float p0=(filmIor*nv-c1)/max(filmIor*nv+c1,.0001);
  vec3 s1=(vec3(filmIor*c1)-substrate*c2)/max(vec3(filmIor*c1)+substrate*c2,vec3(.0001));
  vec3 p1=(substrate*c1-vec3(filmIor)*c2)/max(substrate*c1+vec3(filmIor)*c2,vec3(.0001));
  vec3 phase=cos(12.56637061436*filmIor*thickness*c1/vec3(650.0,510.0,475.0));
  vec3 s=2.0*s0*s1*phase,p=2.0*p0*p1*phase;
  return clamp(.5*((s0*s0+s1*s1+s)/max(vec3(1.0)+s0*s0*s1*s1+s,vec3(.0001))+(p0*p0+p1*p1+p)/max(vec3(1.0)+p0*p0*p1*p1+p,vec3(.0001))),vec3(0.0),vec3(1.0));
}
vec3 diffusionProfile(float mu,vec3 color,float radius) {
  vec3 r=color*radius;
  vec3 a=r*.25,b=r,c=min(r*2.0,vec3(1.0));
  return color*(.25*max(vec3(mu)+a,vec3(0.0))/((vec3(1.0)+a)*(vec3(1.0)+a))+.5*max(vec3(mu)+b,vec3(0.0))/((vec3(1.0)+b)*(vec3(1.0)+b))+.25*max(vec3(mu)+c,vec3(0.0))/((vec3(1.0)+c)*(vec3(1.0)+c)));
}
`;
//#endregion
exports.brdfGLSL = brdfGLSL;
exports.brdfWGSL = brdfWGSL;

//# sourceMappingURL=brdf-shaders.cjs.map