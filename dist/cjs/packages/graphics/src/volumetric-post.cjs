const require_post_effects = require("../../core/src/post-effects.cjs");
//#region dist/packages/graphics/src/volumetric-post.js
function writeVolumetricUniforms(t, n, r) {
	t.fill(0, n, n + 16);
	let i = r ? require_post_effects.getPostEffects(r.postProcessing)?.volumetricFog : void 0;
	if (!r || !r.postProcessing.enabled || !i?.enabled) return;
	t[n] = i.density, t[n + 1] = i.baseHeight, t[n + 2] = i.heightFalloff, t[n + 3] = i.maxDistance, t.set(i.color, n + 4), t[n + 7] = i.fogSamples;
	let a = r.camera3D, o = r.directionalLight, s = o.direction, c = Math.hypot(s.x, s.y, s.z);
	if (c === 0) return;
	let l = a.far * .5 / c, u = a.position.x + s.x * l, d = a.position.y + s.y * l, f = a.position.z + s.z * l, p = a.matrix.elements, m = p[3] * u + p[7] * d + p[11] * f + p[15];
	m <= 1e-6 || (t[n + 8] = ((p[0] * u + p[4] * d + p[8] * f + p[12]) / m + 1) * .5, t[n + 9] = (1 - (p[1] * u + p[5] * d + p[9] * f + p[13]) / m) * .5, t[n + 10] = i.shaftStrength * o.intensity, t[n + 11] = i.shaftSamples, t.set(o.color, n + 12));
}
var volumetricWGSL = `
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
var volumetricGLSL = `
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
//#endregion
exports.volumetricGLSL = volumetricGLSL;
exports.volumetricWGSL = volumetricWGSL;
exports.writeVolumetricUniforms = writeVolumetricUniforms;

//# sourceMappingURL=volumetric-post.cjs.map