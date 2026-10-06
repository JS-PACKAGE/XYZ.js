import type { Scene } from '../../core/src/scene.js';
import { getPostEffects } from '../../core/src/post-effects.js';

/** Four vec4s shared by the native post shaders; UV has top-left origin. */
export function writeVolumetricUniforms(data: Float32Array, offset: number, scene?: Scene): void {
  data.fill(0, offset, offset + 16);
  const fog = scene ? getPostEffects(scene.postProcessing)?.volumetricFog : undefined;
  if (!scene || !scene.postProcessing.enabled || !fog?.enabled) return;
  data[offset] = fog.density;
  data[offset + 1] = fog.baseHeight;
  data[offset + 2] = fog.heightFalloff;
  data[offset + 3] = fog.maxDistance;
  data.set(fog.color, offset + 4);
  data[offset + 7] = fog.fogSamples;
  const camera = scene.camera3D;
  const light = scene.directionalLight;
  const direction = light.direction;
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (length === 0) return;
  const distance = camera.far * 0.5 / length;
  const x = camera.position.x + direction.x * distance;
  const y = camera.position.y + direction.y * distance;
  const z = camera.position.z + direction.z * distance;
  const e = camera.matrix.elements;
  const w = e[3]! * x + e[7]! * y + e[11]! * z + e[15]!;
  if (w <= 0.000001) return;
  data[offset + 8] = ((e[0]! * x + e[4]! * y + e[8]! * z + e[12]!) / w + 1) * 0.5;
  data[offset + 9] = (1 - (e[1]! * x + e[5]! * y + e[9]! * z + e[13]!) / w) * 0.5;
  data[offset + 10] = fog.shaftStrength * light.intensity;
  data[offset + 11] = fog.shaftSamples;
  data.set(light.color, offset + 12);
}

export const volumetricWGSL = `
fn volumetric(color:vec3f, pixel:vec2i)->vec3f {
 if(settings.fog.w<=0.0) { return color; }
 let size=vec2f(textureDimensions(source)); let uv=(vec2f(pixel)+0.5)/size;
 let origin=worldAt(pixel,0.0); let end=worldAt(pixel,min(depthAt(pixel),0.99999));
 let delta=end-origin; let distance=min(length(delta),settings.fog.w);
 let ray=delta/max(length(delta),0.000001); var optical=0.0;
 for(var i=0;i<64;i++) {
  if(i>=i32(settings.fogColor.w)) { break; }
  let t=(f32(i)+0.5)/settings.fogColor.w*distance;
  let density=settings.fog.x*exp(clamp(-(origin.y+ray.y*t-settings.fog.y)*settings.fog.z,-20.0,20.0));
  optical+=density*distance/settings.fogColor.w;
 }
 var result=mix(color,settings.fogColor.rgb,1.0-exp(-min(optical,80.0)));
 if(settings.shaft.z>0.0 && all(settings.shaft.xy>=vec2f(-0.5)) && all(settings.shaft.xy<=vec2f(1.5))) {
  var visibility=0.0;
  for(var i=0;i<64;i++) {
   if(i>=i32(settings.shaft.w)) { break; }
   let t=(f32(i)+0.5)/settings.shaft.w; let sampleUV=mix(uv,settings.shaft.xy,t);
   if(all(sampleUV>=vec2f(0.0)) && all(sampleUV<=vec2f(1.0))) {
    let p=vec2i(sampleUV*size);
    visibility+=select(0.0,1.0,depthAt(p)>=0.9999)*(1.0-t*0.5);
   }
  }
  result+=settings.shaftColor.rgb*settings.shaft.z*visibility/max(settings.shaft.w,1.0);
 }
 return result;
}
`;

export const volumetricGLSL = `
uniform vec4 volumeFog;
uniform vec4 volumeColor;
uniform vec4 shaft;
uniform vec4 shaftColor;
vec3 volumetric(vec3 color,ivec2 pixel) {
 if(volumeFog.w<=0.0) return color;
 vec2 size=vec2(textureSize(image,0)); vec2 uv=(vec2(pixel)+.5)/size;
 vec3 origin=worldAt(pixel,0.0), end=worldAt(pixel,min(depthAt(pixel),.99999));
 vec3 delta=end-origin; float distance=min(length(delta),volumeFog.w);
 vec3 ray=delta/max(length(delta),.000001); float optical=0.0;
 for(int i=0;i<64;i++) {
  if(i>=int(volumeColor.w)) break;
  float t=(float(i)+.5)/volumeColor.w*distance;
  optical+=volumeFog.x*exp(clamp(-(origin.y+ray.y*t-volumeFog.y)*volumeFog.z,-20.0,20.0))*distance/volumeColor.w;
 }
 vec3 result=mix(color,volumeColor.rgb,1.0-exp(-min(optical,80.0)));
 vec2 lightUV=vec2(shaft.x,1.0-shaft.y);
 if(shaft.z>0.0 && all(greaterThanEqual(lightUV,vec2(-.5))) && all(lessThanEqual(lightUV,vec2(1.5)))) {
  float visibility=0.0;
  for(int i=0;i<64;i++) {
   if(i>=int(shaft.w)) break;
   float t=(float(i)+.5)/shaft.w; vec2 sampleUV=mix(uv,lightUV,t);
   if(all(greaterThanEqual(sampleUV,vec2(0.0))) && all(lessThanEqual(sampleUV,vec2(1.0))))
    visibility+=(depthAt(ivec2(sampleUV*size))>=.9999?1.0:0.0)*(1.0-t*.5);
  }
  result+=shaftColor.rgb*shaft.z*visibility/max(shaft.w,1.0);
 }
 return result;
}
`;
