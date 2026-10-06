const require_contact_shadows = require("../../../src/data/contact-shadows.cjs");
//#region dist/packages/graphics/src/contact-shadow-shaders.js
var contactShadowWGSL = `
@group(0) @binding(8) var<storage,read> contactDepth: array<f32>;
fn contactVisibility(world: vec3f, normal: vec3f) -> f32 {
  if (scene.contactParams.w < 1.0 || scene.contactStrength.x <= 0.0) { return 1.0; }
  let direction = safeNormal(scene.lightDirection.xyz);
  let origin = world + safeNormal(normal)*scene.contactParams.z;
  let size = vec2u(scene.contactStrength.yz);
  for (var i = 1u; i <= ${require_contact_shadows.contactShadowDefaults.maxSteps}u; i++) {
    if (f32(i) > scene.contactParams.w) { break; }
    let ray = origin + direction*(scene.contactParams.x*f32(i)/scene.contactParams.w);
    let clip = scene.viewProjection*vec4f(ray,1.0);
    if (clip.w <= 0.0) { break; }
    let ndc = clip.xyz/clip.w;
    let uv = ndc.xy*vec2f(0.5,-0.5)+vec2f(0.5);
    if (any(uv < vec2f(0.0)) || any(uv >= vec2f(1.0)) || ndc.z < 0.0 || ndc.z > 1.0) { break; }
    let pixel = vec2u(uv*vec2f(size));
    let depth = contactDepth[pixel.y*size.x+pixel.x];
    if (depth >= 1.0 || depth >= ndc.z) { continue; }
    let hitClip = scene.invViewProjection*vec4f(ndc.xy,depth,1.0);
    let hit = hitClip.xyz/hitClip.w;
    if (distance(hit,ray) <= scene.contactParams.y) {
      return 1.0-scene.contactStrength.x;
    }
  }
  return 1.0;
}
`;
var contactShadowGLSL = `
uniform vec4 contactDimensions;
uniform vec4 contactParams;
uniform float contactStrength;
uniform mat4 contactInvViewProjection;
float contactVisibility(vec3 world, vec3 normal) {
  if (contactParams.w < 1.0 || contactStrength <= 0.0) return 1.0;
  vec3 direction = lighting[0].xyz/max(length(lighting[0].xyz),.000001);
  vec3 origin = world + normal/max(length(normal),.000001)*contactParams.z;
  ivec2 size = ivec2(contactDimensions.xy);
  for (int i=1; i<=${require_contact_shadows.contactShadowDefaults.maxSteps}; i++) {
    if (float(i)>contactParams.w) break;
    vec3 ray = origin+direction*(contactParams.x*float(i)/contactParams.w);
    vec4 clip = viewProjection*vec4(ray,1.0);
    if (clip.w<=0.0) break;
    vec3 ndc = clip.xyz/clip.w;
    vec2 uv = ndc.xy*.5+.5;
    if (any(lessThan(uv,vec2(0.0))) || any(greaterThanEqual(uv,vec2(1.0))) || ndc.z<0.0 || ndc.z>1.0) break;
    float depth = texelFetch(shadowMap,ivec2(uv*vec2(size))+ivec2(0,int(contactDimensions.z)),0).r;
    if (depth>=1.0 || depth>=ndc.z) continue;
    vec4 hitClip = contactInvViewProjection*vec4(ndc.xy,depth,1.0);
    if (distance(hitClip.xyz/hitClip.w,ray)<=contactParams.y) return 1.0-contactStrength;
  }
  return 1.0;
}
`;
//#endregion
exports.contactShadowGLSL = contactShadowGLSL;
exports.contactShadowWGSL = contactShadowWGSL;

//# sourceMappingURL=contact-shadow-shaders.cjs.map