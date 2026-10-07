const require_post_effects = require("../../core/src/post-effects.cjs");
//#region dist/packages/graphics/src/motion-blur-post.js
function writeMotionBlurUniforms(t, n, r, i) {
	t.fill(0, n, n + 20);
	let a = require_post_effects.getPostEffects(r)?.motionBlur;
	i && t.set(i.previousVP.elements, n), t[n + 16] = r.enabled && a?.enabled && i?.reprojectionValid ? a.strength : 0, t[n + 17] = a?.samples ?? 1, t[n + 18] = a?.maxRadius ?? 0, t[n + 19] = r.taaDepthThreshold;
}
var motionBlurWGSL = `
@group(0) @binding(4) var objectVelocity: texture_2d<f32>;
fn motionSample(pixel:vec2i)->vec4f {
 let base=focusedSample(pixel);
 if(settings.blur.x<=0.0 || settings.blur.y<2.0) { return base; }
 let size=vec2i(textureDimensions(source)); let uv=(vec2f(pixel)+0.5)/vec2f(size);
 let depth=depthAt(pixel); let world=worldAt(pixel,depth);
 let old=settings.previousVP*vec4f(world,1.0);
 if(old.w<=0.000001) { return base; }
 let previousUV=(old.xy/old.w)*vec2f(0.5,-0.5)+vec2f(0.5);
 var velocity=(uv-previousUV)*vec2f(size)*settings.blur.x;
 if(all(vec2i(textureDimensions(objectVelocity))==size)) {
  let object=textureLoad(objectVelocity,pixel,0);
  if(object.z>0.5) { velocity=object.xy*vec2f(size)*settings.blur.x; }
 }
 let speed=length(velocity); velocity*=min(1.0,settings.blur.z/max(speed,0.000001));
 if(length(velocity)<0.5) { return base; }
 let currentDepth=viewDepth(depth); var result=vec4f(0.0); var count=0.0;
 for(var i=0;i<32;i++) {
  if(i>=i32(settings.blur.y)) { break; }
  let t=f32(i)/max(settings.blur.y-1.0,1.0)-0.5;
  let p=vec2i(round(vec2f(pixel)+velocity*t));
  if(any(p<vec2i(0)) || any(p>=size)) { continue; }
  if(abs(viewDepth(depthAt(p))-currentDepth)>max(currentDepth*settings.blur.w,0.001)) { continue; }
  result+=textureLoad(source,p,0); count+=1.0;
 }
 if(count==0.0) { return base; }
 return result/count;
}
`;
var motionBlurGLSL = `
uniform mat4 previousVP;
uniform vec4 blur;
uniform sampler2D objectVelocity;
uniform bool objectMotionEnabled;
vec4 motionSample(ivec2 pixel) {
 vec4 base=focusedSample(pixel);
 if(blur.x<=0.0 || blur.y<2.0) return base;
 ivec2 size=textureSize(image,0); vec2 uv=(vec2(pixel)+.5)/vec2(size);
 float depth=depthAt(pixel); vec3 world=worldAt(pixel,depth);
 vec4 old=previousVP*vec4(world,1.0);
 if(old.w<=.000001) return base;
 vec2 previousUV=(old.xy/old.w)*.5+.5;
 vec2 velocity=(uv-previousUV)*vec2(size)*blur.x;
 if(objectMotionEnabled && all(equal(textureSize(objectVelocity,0),size))) {
  vec4 object=texelFetch(objectVelocity,pixel,0);
  if(object.z>.5) velocity=object.xy*vec2(size)*blur.x;
 }
 float speed=length(velocity); velocity*=min(1.0,blur.z/max(speed,.000001));
 if(length(velocity)<.5) return base;
 float currentDepth=viewDepth(depth); vec4 result=vec4(0.0); float count=0.0;
 for(int i=0;i<32;i++) {
  if(i>=int(blur.y)) break;
  float t=float(i)/max(blur.y-1.0,1.0)-.5;
  ivec2 p=ivec2(round(vec2(pixel)+velocity*t));
  if(any(lessThan(p,ivec2(0))) || any(greaterThanEqual(p,size))) continue;
  if(abs(viewDepth(depthAt(p))-currentDepth)>max(currentDepth*blur.w,.001)) continue;
  result+=texelFetch(image,p,0); count+=1.0;
 }
 return count==0.0?base:result/count;
}
`;
//#endregion
exports.motionBlurGLSL = motionBlurGLSL;
exports.motionBlurWGSL = motionBlurWGSL;
exports.writeMotionBlurUniforms = writeMotionBlurUniforms;

//# sourceMappingURL=motion-blur-post.cjs.map