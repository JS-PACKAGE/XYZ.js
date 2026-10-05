const require_errors = require("./errors.cjs");
const require_tiling_sprite2d = require("../../core/src/graphics2d/tiling-sprite2d.cjs");
const require_lighting2d = require("../../core/src/lighting2d.cjs");
//#region dist/packages/graphics/src/lighting2d.js
function packLighting2D(n, r, i, a) {
	require_lighting2d.validateSpriteLighting2D(n);
	let o = n.lighting;
	a.fill(0, 24, 80), a.set(o.ambient, 24), a[27] = +!!n.normalTexture, a[70] = o.roughness, a[84] = o.emissive[0], a[85] = o.emissive[1], a[86] = o.emissive[2], a[87] = o.specular;
	let s = 0;
	for (let e of o.occluders) {
		if (!e.enabled || e.space !== n.worldSpace) continue;
		let t = 92 + s * 4;
		a[t] = e.a[0], a[t + 1] = e.a[1], a[t + 2] = e.b[0], a[t + 3] = e.b[1], s++;
	}
	a[88] = s;
	let c = n.updateWorldMatrix().elements, l = c[0], u = c[1], d = c[3], f = c[4];
	if (n instanceof require_tiling_sprite2d.TilingSprite2D) {
		let e = Math.cos(n.tileRotation), t = Math.sin(n.tileRotation);
		l = (c[0] * e + c[3] * t) * n.tileScale.x, u = (c[1] * e + c[4] * t) * n.tileScale.x, d = (-c[0] * t + c[3] * e) * n.tileScale.y, f = (-c[1] * t + c[4] * e) * n.tileScale.y;
	}
	let p = l * f - u * d;
	if (!Number.isFinite(p) || Math.abs(p) < 1e-12) throw RangeError(`Lit sprite requires an invertible transform.`);
	let m = Math.sqrt(Math.abs(p));
	a[28] = f * m / p, a[29] = -d * m / p, a[30] = -u * m / p, a[31] = l * m / p;
	for (let e = 0; e < o.lights.length; e++) {
		let t = o.lights[e];
		if (!t.enabled || t.space !== n.worldSpace) continue;
		let r = 32 + e * 8;
		a[r] = t.position[0], a[r + 1] = t.position[1], a[r + 2] = t.height, a[r + 3] = t.radius, a.set(t.color, r + 4), a[r + 7] = t.intensity;
	}
	let h = r.elements;
	a[64] = h[0], a[65] = h[1], a[66] = h[3], a[67] = h[4], a[68] = h[6], a[69] = h[7], a[72] = i.u0, a[73] = i.v0, a[74] = i.ux, a[75] = i.vx, a[76] = i.uy, a[77] = i.vy;
}
var r = `
@group(3) @binding(0) var normalMap: texture_2d<f32>;
@group(3) @binding(1) var normalSampler: sampler;
fn xyzBlocked2D(light: vec2f, sample: vec2f, seg: vec4f) -> bool {
  let r = sample - light;
  let s = seg.zw - seg.xy;
  let denom = r.x * s.y - r.y * s.x;
  if (abs(denom) < 0.000001) { return false; }
  let q = seg.xy - light;
  let t = (q.x * s.y - q.y * s.x) / denom;
  let u = (q.x * r.y - q.y * r.x) / denom;
  return t > 0.001 && t < 0.999 && u >= 0.0 && u <= 1.0;
}
fn xyzOccluded2D(light: vec2f, sample: vec2f) -> bool {
  let count = draw.values[22].x;
  if (count > 0.5 && xyzBlocked2D(light, sample, draw.values[23])) { return true; }
  if (count > 1.5 && xyzBlocked2D(light, sample, draw.values[24])) { return true; }
  if (count > 2.5 && xyzBlocked2D(light, sample, draw.values[25])) { return true; }
  if (count > 3.5 && xyzBlocked2D(light, sample, draw.values[26])) { return true; }
  return false;
}
fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f {
  let surface = xyzSurface2D(color, uv, screen);
  var n = vec3f(0.0,0.0,1.0);
  if (draw.values[6].w != 0.0) {
    let basis = draw.values[18];
    let mapped = basis.xy + basis.zw * uv.x + draw.values[19].xy * uv.y;
    let end = basis.xy + basis.zw + draw.values[19].xy;
    let inset = min(vec2f(0.5) / vec2f(textureDimensions(normalMap)), abs(end-basis.xy)*0.5);
    let normalUV = clamp(mapped,min(basis.xy,end)+inset,max(basis.xy,end)-inset);
    var sampled: vec3f;
    if (draw.values[20].z > 1.0) {
      sampled = textureSampleGrad(normalMap,normalSampler,normalUV,dpdx(normalUV),dpdy(normalUV)).rgb;
    } else {
      sampled = textureSampleLevel(normalMap,normalSampler,normalUV,0.0).rgb;
    }
    let raw = sampled*2.0-1.0;
    let a = draw.values[7];
    n = normalize(vec3f(a.xy*raw.x+a.zw*raw.y,raw.z));
  }
  let mapping = draw.values[16];
  let world = mapping.xy*screen.x+mapping.zw*screen.y+draw.values[17].xy;
  var irradiance = draw.values[6].rgb;
  var specular = vec3f(0.0);
  let rough = clamp(draw.values[17].z, 0.0, 1.0);
  let exponent = exp2(mix(7.0, 0.0, rough));
  for(var i=0u;i<4u;i++) {
    let p = draw.values[8u+i*2u]; let c = draw.values[9u+i*2u];
    if(c.w > 0.0) {
      let delta = vec3f(p.xy-world,p.z); let distance = length(delta);
      let attenuation = max(0.0,1.0-distance/p.w);
      let direction = delta / max(distance,0.000001);
      if (xyzOccluded2D(p.xy, world)) { continue; }
      let falloff = attenuation*attenuation;
      irradiance += c.rgb*c.w*falloff*max(dot(n,direction),0.0);
      let halfv = normalize(direction+vec3f(0.0,0.0,1.0));
    }
  }
  let glow = draw.values[21].rgb;
  return vec4f(surface.rgb*irradiance + specular*draw.values[21].w*surface.a + glow*surface.a, surface.a);
}`;
var i = `
uniform sampler2D normalMap;
uniform vec4 lighting[27];
bool xyzBlocked2D(vec2 light, vec2 surfacePoint, vec4 seg) {
  vec2 r = surfacePoint - light;
  vec2 s = seg.zw - seg.xy;
  float denom = r.x * s.y - r.y * s.x;
  if (abs(denom) < 0.000001) return false;
  vec2 q = seg.xy - light;
  float t = (q.x * s.y - q.y * s.x) / denom;
  float u = (q.x * r.y - q.y * r.x) / denom;
  return t > 0.001 && t < 0.999 && u >= 0.0 && u <= 1.0;
}
bool xyzOccluded2D(vec2 light, vec2 surfacePoint) {
  float count = lighting[22].x;
  if (count > 0.5 && xyzBlocked2D(light, surfacePoint, lighting[23])) return true;
  if (count > 1.5 && xyzBlocked2D(light, surfacePoint, lighting[24])) return true;
  if (count > 2.5 && xyzBlocked2D(light, surfacePoint, lighting[25])) return true;
  if (count > 3.5 && xyzBlocked2D(light, surfacePoint, lighting[26])) return true;
  return false;
}
vec4 effect(vec4 color, vec2 uv, vec2 screen) {
  vec3 n=vec3(0,0,1);
  if(tiling) {
    vec2 p=mod((tileTransform*vec3(localRect.xy+uv*localRect.zw,1)).xy,tileShape.xy);
    uv=(p-tileTrim.xy)/tileTrim.zw;
  }
  vec4 surface = xyzSurface2D(color, uv, screen);
  if(lighting[6].w!=0.0) {
    vec4 b=lighting[18]; vec2 end=b.xy+b.zw+lighting[19].xy;
    vec2 inset=min(vec2(0.5)/vec2(textureSize(normalMap,0)),abs(end-b.xy)*0.5);
    vec2 mapped=clamp(b.xy+b.zw*uv.x+lighting[19].xy*uv.y,min(b.xy,end)+inset,max(b.xy,end)-inset);
    vec3 raw=texture(normalMap,mapped).rgb*2.0-1.0; vec4 a=lighting[7];
    n=normalize(vec3(a.xy*raw.x+a.zw*raw.y,raw.z));
  }
  vec4 m=lighting[16]; vec2 world=m.xy*screen.x+m.zw*screen.y+lighting[17].xy;
  vec3 irradiance=lighting[6].rgb;
  vec3 specular=vec3(0.0);
  float rough=clamp(lighting[17].z,0.0,1.0);
  float exponent=exp2(mix(7.0,0.0,rough));
  for(int i=0;i<4;i++) {
    vec4 p=lighting[8+i*2], c=lighting[9+i*2];
    if(c.w>0.0) {
      vec3 delta=vec3(p.xy-world,p.z); float distance=length(delta);
      float attenuation=max(0.0,1.0-distance/p.w);
      vec3 direction=delta/max(distance,0.000001);
      if (xyzOccluded2D(p.xy, world)) continue;
      float falloff=attenuation*attenuation;
      irradiance+=c.rgb*c.w*falloff*max(dot(n,direction),0.0);
      vec3 halfv=normalize(direction+vec3(0.0,0.0,1.0));
    }
  }
  return vec4(surface.rgb*irradiance + specular*lighting[21].w*surface.a + lighting[21].rgb*surface.a, surface.a);
}`;
var lightingWGSL = `fn xyzSurface2D(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f { return color; }\n${r}`;
var lightingGLSL = `vec4 xyzSurface2D(vec4 color, vec2 uv, vec2 screen) { return color; }\n${i}`;
function composeLitMaterial2D(e, t) {
	let a = t === `wgsl` ? /\bfn\s+effect\s*\(/ : /\bvec4\s+effect\s*\(/;
	if (!a.test(e)) throw new require_errors.GraphicsError(`A lit Material2D must define effect() before lighting.`);
	return `${e.replace(a, t === `wgsl` ? `fn xyzSurface2D(` : `vec4 xyzSurface2D(`).replace(/\beffect\s*\(/g, `xyzSurface2D(`)}\n${t === `wgsl` ? r : i}`;
}
//#endregion
exports.composeLitMaterial2D = composeLitMaterial2D;
exports.lightingGLSL = lightingGLSL;
exports.lightingWGSL = lightingWGSL;
exports.packLighting2D = packLighting2D;

//# sourceMappingURL=lighting2d.cjs.map