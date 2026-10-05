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
`;
//#endregion
exports.brdfGLSL = brdfGLSL;
exports.brdfWGSL = brdfWGSL;

//# sourceMappingURL=brdf-shaders.cjs.map