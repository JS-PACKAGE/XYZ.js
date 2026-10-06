export const lensFlareWGSL = `
fn flareBright(uv:vec2f)->vec3f {
 if(any(uv<vec2f(0.0)) || any(uv>vec2f(1.0))) { return vec3f(0.0); }
 let size=vec2i(textureDimensions(source)); let sample=textureLoad(source,clamp(vec2i(uv*vec2f(size)),vec2i(0),size-vec2i(1)),0);
 return max(sample.rgb/max(sample.a,0.000001)-vec3f(settings.flare.y),vec3f(0.0));
}
fn lensFlare(color:vec3f,pixel:vec2i)->vec3f {
 if(settings.flare.x<=0.0) { return color; }
 let uv=(vec2f(pixel)+0.5)/vec2f(textureDimensions(source)); let vector=vec2f(0.5)-uv;
 var ghosts=vec3f(0.0);
 for(var i=0;i<8;i++) {
  if(i>=i32(settings.flare.z)) { break; }
  let sampleUV=uv+vector*settings.flare.w*f32(i+1);
  let falloff=pow(max(1.0-length(sampleUV-vec2f(0.5))*1.41421356,0.0),2.0);
  ghosts+=flareBright(sampleUV)*falloff;
 }
 let radius=length(vector); let direction=vector/max(radius,0.000001);
 let halo=flareBright(uv+direction*settings.halo.x)*(1.0-smoothstep(0.0,settings.halo.y,abs(radius-settings.halo.x)));
 return color+(ghosts/max(settings.flare.z,1.0)+halo)*settings.flare.x;
}
`;

export const lensFlareGLSL = `
uniform vec4 flare;
uniform vec4 halo;
vec3 flareBright(vec2 uv) {
 if(any(lessThan(uv,vec2(0.0))) || any(greaterThan(uv,vec2(1.0)))) return vec3(0.0);
 ivec2 size=textureSize(image,0); ivec2 p=clamp(ivec2(uv*vec2(size)),ivec2(0),size-1);
 p.y=size.y-1-p.y;
 vec4 texel=texelFetch(image,p,0);
 return max(texel.rgb/max(texel.a,.000001)-vec3(flare.y),vec3(0.0));
}
vec3 lensFlare(vec3 color,ivec2 pixel) {
 if(flare.x<=0.0) return color;
 vec2 size=vec2(textureSize(image,0)); vec2 uv=vec2(float(pixel.x)+.5,size.y-float(pixel.y)-.5)/size; vec2 vector=vec2(.5)-uv;
 vec3 ghosts=vec3(0.0);
 for(int i=0;i<8;i++) {
  if(i>=int(flare.z)) break;
  vec2 sampleUV=uv+vector*flare.w*float(i+1);
  float falloff=pow(max(1.0-length(sampleUV-vec2(.5))*1.41421356,0.0),2.0);
  ghosts+=flareBright(sampleUV)*falloff;
 }
 float radius=length(vector); vec2 direction=vector/max(radius,.000001);
 vec3 ring=flareBright(uv+direction*halo.x)*(1.0-smoothstep(0.0,halo.y,abs(radius-halo.x)));
 return color+(ghosts/max(flare.z,1.0)+ring)*flare.x;
}
`;
