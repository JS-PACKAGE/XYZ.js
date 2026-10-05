const require_tiling_sprite2d = require("../../core/src/graphics2d/tiling-sprite2d.cjs");
const require_lighting2d = require("../../core/src/lighting2d.cjs");
//#region dist/packages/graphics/src/lighting2d.js
function packLighting2D(n, r, i, a) {
	require_lighting2d.validateSpriteLighting2D(n);
	let o = n.lighting;
	a.fill(0, 24, 80), a.set(o.ambient, 24), a[27] = +!!n.normalTexture;
	let s = n.updateWorldMatrix().elements, c = s[0], l = s[1], u = s[3], d = s[4];
	if (n instanceof require_tiling_sprite2d.TilingSprite2D) {
		let e = Math.cos(n.tileRotation), t = Math.sin(n.tileRotation);
		c = (s[0] * e + s[3] * t) * n.tileScale.x, l = (s[1] * e + s[4] * t) * n.tileScale.x, u = (-s[0] * t + s[3] * e) * n.tileScale.y, d = (-s[1] * t + s[4] * e) * n.tileScale.y;
	}
	let f = c * d - l * u;
	if (!Number.isFinite(f) || Math.abs(f) < 1e-12) throw RangeError(`Lit sprite requires an invertible transform.`);
	let p = Math.sqrt(Math.abs(f));
	a[28] = d * p / f, a[29] = -u * p / f, a[30] = -l * p / f, a[31] = c * p / f;
	for (let e = 0; e < o.lights.length; e++) {
		let t = o.lights[e];
		if (!t.enabled || t.space !== n.worldSpace) continue;
		let r = 32 + e * 8;
		a[r] = t.position[0], a[r + 1] = t.position[1], a[r + 2] = t.height, a[r + 3] = t.radius, a.set(t.color, r + 4), a[r + 7] = t.intensity;
	}
	let m = r.elements;
	a[64] = m[0], a[65] = m[1], a[66] = m[3], a[67] = m[4], a[68] = m[6], a[69] = m[7], a[72] = i.u0, a[73] = i.v0, a[74] = i.ux, a[75] = i.vx, a[76] = i.uy, a[77] = i.vy;
}
var lightingWGSL = `
@group(3) @binding(0) var normalMap: texture_2d<f32>;
@group(3) @binding(1) var normalSampler: sampler;
fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f {
  var n = vec3f(0.0,0.0,1.0);
  if (draw.values[6].w != 0.0) {
    let basis = draw.values[18];
    let mapped = basis.xy + basis.zw * uv.x + draw.values[19].xy * uv.y;
    let end = basis.xy + basis.zw + draw.values[19].xy;
    let inset = min(vec2f(0.5) / vec2f(textureDimensions(normalMap)), abs(end-basis.xy)*0.5);
    let raw = textureSampleLevel(normalMap,normalSampler,clamp(mapped,min(basis.xy,end)+inset,max(basis.xy,end)-inset),0.0).rgb*2.0-1.0;
    let a = draw.values[7];
    n = normalize(vec3f(a.xy*raw.x+a.zw*raw.y,raw.z));
  }
  let mapping = draw.values[16];
  let world = mapping.xy*screen.x+mapping.zw*screen.y+draw.values[17].xy;
  var irradiance = draw.values[6].rgb;
  for(var i=0u;i<4u;i++) {
    let p = draw.values[8u+i*2u]; let c = draw.values[9u+i*2u];
    if(c.w > 0.0) {
      let delta = vec3f(p.xy-world,p.z); let distance = length(delta);
      let attenuation = max(0.0,1.0-distance/p.w);
      let direction = delta / max(distance,0.000001);
      irradiance += c.rgb*c.w*attenuation*attenuation*max(dot(n,direction),0.0);
    }
  }
  return vec4f(color.rgb*irradiance,color.a);
}`;
var lightingGLSL = `
uniform sampler2D normalMap;
uniform vec4 lighting[20];
vec4 effect(vec4 color, vec2 uv, vec2 screen) {
  vec3 n=vec3(0,0,1);
  if(tiling) {
    vec2 p=mod((tileTransform*vec3(localRect.xy+uv*localRect.zw,1)).xy,tileShape.xy);
    uv=(p-tileTrim.xy)/tileTrim.zw;
  }
  if(lighting[6].w!=0.0) {
    vec4 b=lighting[18]; vec2 end=b.xy+b.zw+lighting[19].xy;
    vec2 inset=min(vec2(0.5)/vec2(textureSize(normalMap,0)),abs(end-b.xy)*0.5);
    vec2 mapped=clamp(b.xy+b.zw*uv.x+lighting[19].xy*uv.y,min(b.xy,end)+inset,max(b.xy,end)-inset);
    vec3 raw=texture(normalMap,mapped).rgb*2.0-1.0; vec4 a=lighting[7];
    n=normalize(vec3(a.xy*raw.x+a.zw*raw.y,raw.z));
  }
  vec4 m=lighting[16]; vec2 world=m.xy*screen.x+m.zw*screen.y+lighting[17].xy;
  vec3 irradiance=lighting[6].rgb;
  for(int i=0;i<4;i++) {
    vec4 p=lighting[8+i*2], c=lighting[9+i*2];
    if(c.w>0.0) {
      vec3 delta=vec3(p.xy-world,p.z); float distance=length(delta);
      float attenuation=max(0.0,1.0-distance/p.w);
      irradiance+=c.rgb*c.w*attenuation*attenuation*max(dot(n,delta/max(distance,0.000001)),0.0);
    }
  }
  return vec4(color.rgb*irradiance,color.a);
}`;
//#endregion
exports.lightingGLSL = lightingGLSL;
exports.lightingWGSL = lightingWGSL;
exports.packLighting2D = packLighting2D;

//# sourceMappingURL=lighting2d.cjs.map