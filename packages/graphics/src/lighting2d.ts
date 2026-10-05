import type { Sprite } from '../../core/src/sprite.js';
import { validateSpriteLighting2D } from '../../core/src/lighting2d.js';
import type { Matrix3 } from '../../math/src/index.js';
import type { TextureQuad2D } from './sprite-instance.js';
import { TilingSprite2D } from '../../core/src/graphics2d/tiling-sprite2d.js';

/** Packs a draw-local snapshot; the renderer owns/reuses native draw buffers. */
export function packLighting2D(
  sprite: Sprite,
  screenToWorld: Matrix3,
  quad: TextureQuad2D,
  out: Float32Array,
): void {
  validateSpriteLighting2D(sprite);
  const profile = sprite.lighting!;
  out.fill(0, 24, 80);
  out.set(profile.ambient, 24);
  out[27] = sprite.normalTexture ? 1 : 0;
  const e = sprite.updateWorldMatrix().elements;
  let a = e[0],
    b = e[1],
    c = e[3],
    d = e[4];
  if (sprite instanceof TilingSprite2D) {
    const cos = Math.cos(sprite.tileRotation),
      sin = Math.sin(sprite.tileRotation);
    a = (e[0] * cos + e[3] * sin) * sprite.tileScale.x;
    b = (e[1] * cos + e[4] * sin) * sprite.tileScale.x;
    c = (-e[0] * sin + e[3] * cos) * sprite.tileScale.y;
    d = (-e[1] * sin + e[4] * cos) * sprite.tileScale.y;
  }
  const det = a * d - b * c;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12)
    throw new RangeError('Lit sprite requires an invertible transform.');
  // Inverse transpose, including reflection and shear; Z uses geometric mean XY scale.
  const scale = Math.sqrt(Math.abs(det));
  out[28] = (d * scale) / det;
  out[29] = (-c * scale) / det;
  out[30] = (-b * scale) / det;
  out[31] = (a * scale) / det;
  for (let i = 0; i < profile.lights.length; i++) {
    const light = profile.lights[i];
    if (!light.enabled || light.space !== sprite.worldSpace) continue;
    const o = 32 + i * 8;
    out[o] = light.position[0];
    out[o + 1] = light.position[1];
    out[o + 2] = light.height;
    out[o + 3] = light.radius;
    out.set(light.color, o + 4);
    out[o + 7] = light.intensity;
  }
  const m = screenToWorld.elements;
  out[64] = m[0];
  out[65] = m[1];
  out[66] = m[3];
  out[67] = m[4];
  out[68] = m[6];
  out[69] = m[7];
  out[72] = quad.u0;
  out[73] = quad.v0;
  out[74] = quad.ux;
  out[75] = quad.vx;
  out[76] = quad.uy;
  out[77] = quad.vy;
}
export const lightingWGSL = /* wgsl */ `
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
export const lightingGLSL = /* glsl */ `
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
