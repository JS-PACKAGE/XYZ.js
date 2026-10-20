import{getPostEffects as e}from"../../core/src/post-effects.js";import{hypot3 as t}from"../../math/src/hypot.js";export function writeVolumetricUniforms(n,r,i){n.fill(0,r,r+16);let a=i?e(i.postProcessing)?.volumetricFog:void 0;if(!i||!i.postProcessing.enabled||!a?.enabled)return;n[r]=a.density,n[r+1]=a.baseHeight,n[r+2]=a.heightFalloff,n[r+3]=a.maxDistance,n.set(a.color,r+4),n[r+7]=a.fogSamples;let o=i.camera3D,s=i.directionalLight,c=s.direction,l=t(c.x,c.y,c.z);if(l===0)return;let u=o.far*.5/l,d=o.position.x+c.x*u,f=o.position.y+c.y*u,p=o.position.z+c.z*u,m=o.matrix.elements,h=m[3]*d+m[7]*f+m[11]*p+m[15];h<=1e-6||(n[r+8]=((m[0]*d+m[4]*f+m[8]*p+m[12])/h+1)*.5,n[r+9]=(1-(m[1]*d+m[5]*f+m[9]*p+m[13])/h)*.5,n[r+10]=a.shaftStrength*s.intensity,n[r+11]=a.shaftSamples,n.set(s.color,r+12))}export const volumetricWGSL=`
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
`;export const volumetricGLSL=`
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
//# sourceMappingURL=volumetric-post.js.map
