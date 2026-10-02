import{LIGHTING_FLOAT_COUNT as e,MAX_POINT_LIGHTS as t,MAX_SPOT_LIGHTS as n,SPOT_LIGHT_OFFSET as r,nativeMaterial3DLimits as i,materialTextureSlots as a}from"../../../src/data/rendering.js";import{atlasGLSL as o}from"./shadow-shaders.js";import{depthPostGLSL as s}from"./depth-post-shaders.js";import{sheenGLSL as c}from"./sheen-shaders.js";import{transmissionGLSL as l}from"./transmission-shaders.js";import{reflectionProbeGLSL as u}from"./reflection-probe-shaders.js";import{oitWeightGLSL as d}from"./oit-shaders.js";const f=`
in vec2 vUV1;
uniform vec4 materialCoordinates[${a.length*2}];
vec2 materialUV(int slot) {
  vec4 a = materialCoordinates[slot*2], b = materialCoordinates[slot*2+1];
  vec2 uv = b.z>.5 ? vUV1 : vUV;
  return vec2(a.x*uv.x+a.z*uv.y,a.y*uv.x+a.w*uv.y)+b.xy;
}`;export const meshVertex=`#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 uv;
layout(location=3) in mat4 instanceMatrix;
layout(location=7) in vec3 instanceColor;
layout(location=8) in vec4 vertexColor;
layout(location=9) in uvec4 jointIndices;
layout(location=10) in vec4 jointWeights;
layout(location=11) in vec2 uv1;
layout(location=12) in uvec4 jointIndices1;
layout(location=13) in vec4 jointWeights1;
uniform highp sampler2D jointPalette;
uniform bool skinned;
uniform mat4 viewProjection;
uniform mat4 model;
uniform bool instanced;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;
out vec2 vUV1;
out vec4 vColor;
flat out float vOrientation;
flat out vec3 vLocal0;
flat out vec3 vLocal1;
flat out vec3 vLocal2;
mat4 jointMatrix(uint index) {
  int row = int(index);
  return mat4(texelFetch(jointPalette, ivec2(0,row),0),
    texelFetch(jointPalette, ivec2(1,row),0),
    texelFetch(jointPalette, ivec2(2,row),0),
    texelFetch(jointPalette, ivec2(3,row),0));
}
/* XYZ_VERTEX_HOOKS */
struct XYZVertex { vec3 position; vec3 normal; };
XYZVertex xyzDeform(vec3 position, vec3 normal, vec2 uv) { return XYZVertex(position,normal); }
/* XYZ_VERTEX_HOOKS_END */
void main() {
  mat4 world = model;
  if (instanced) world = model * instanceMatrix;
  XYZVertex deformed = xyzDeform(position,normal,uv);
  vec4 local = vec4(deformed.position, 1.0);
  vec3 localNormal = deformed.normal;
  if (skinned) {
    mat4 skin = jointMatrix(jointIndices.x) * jointWeights.x
      + jointMatrix(jointIndices.y) * jointWeights.y
      + jointMatrix(jointIndices.z) * jointWeights.z
      + jointMatrix(jointIndices.w) * jointWeights.w
      + jointMatrix(jointIndices1.x) * jointWeights1.x
      + jointMatrix(jointIndices1.y) * jointWeights1.y
      + jointMatrix(jointIndices1.z) * jointWeights1.z
      + jointMatrix(jointIndices1.w) * jointWeights1.w;
    local = vec4((skin * local).xyz, 1.0);
    mat3 cofactor = mat3(cross(skin[1].xyz,skin[2].xyz),
      cross(skin[2].xyz,skin[0].xyz),cross(skin[0].xyz,skin[1].xyz));
    float sign = dot(skin[0].xyz,cofactor[0]) < 0.0 ? -1.0 : 1.0;
    vec3 direction = sign * cofactor * deformed.normal;
    float directionLength = length(direction);
    localNormal = direction / (directionLength > 0.0 ? directionLength : 1.0);
  }
  vec4 p = world * local;
  vec4 clip = viewProjection * p;
  gl_Position = vec4(clip.xy, clip.z * 2.0 - clip.w, clip.w);
  mat3 m = mat3(world);
  vec3 a = cross(m[1], m[2]);
  float determinant = dot(m[0], a);
  vOrientation = determinant < 0.0 ? -1.0 : 1.0;
  mat3 cofactor = mat3(a, cross(m[2], m[0]), cross(m[0], m[1]));
  mat3 normalMatrix = determinant == 0.0 ? mat3(0.0) : cofactor/determinant;
  vLocal0 = normalMatrix[0]; vLocal1 = normalMatrix[1]; vLocal2 = normalMatrix[2];
  vNormal = normalMatrix*localNormal;
  vPosition = p.xyz;
  vUV = uv;
  vUV1 = uv1;
  vColor = vec4(instanceColor, 1.0) * vertexColor;
}`;export const meshFragment=`#version 300 es
precision highp float;
in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;
in vec4 vColor;
flat in vec3 vLocal0;
flat in vec3 vLocal1;
flat in vec3 vLocal2;
flat in float vOrientation;
uniform sampler2D image;
uniform sampler2D metallicRoughnessMap;
uniform sampler2D normalMap;
uniform sampler2D occlusionMap;
uniform sampler2D emissiveMap;
uniform sampler2D specularMap;
uniform sampler2D specularColorMap;
uniform vec4 specularColor; // linear color.rgb, IOR-derived reflectance
uniform vec4 specularParams; // strength, zero-IOR mode, strengthMap, colorMap
uniform vec4 clearcoat; // strength, roughness, normal scale, unused
uniform vec4 clearcoatMaps; // intensity, roughness, normal, unused
uniform sampler2D clearcoatMap;
uniform sampler2D clearcoatRoughnessMap;
uniform sampler2D clearcoatNormalMap;
uniform vec4 sheen; // linear RGB, roughness
uniform vec4 sheenMaps; // color map, roughness map, unused, unused
uniform sampler2D sheenColorMap;
uniform sampler2D sheenRoughnessMap;
uniform vec4 transmission; // strength, local thickness, inverse attenuation distance, IOR
uniform vec3 attenuationColor;
uniform vec4 transmissionMapSettings;
uniform vec4 thicknessMapSettings;
uniform highp sampler2DArray opticalMaps;
uniform sampler2D opaqueScene;
uniform mat4 viewProjection;
uniform sampler2D shadowMap;
uniform vec4 lighting[${e/4}];
uniform vec4 environment[10]; // SH0..8, then intensity, enabled, maxLod, unused
uniform sampler2D environmentMap;
uniform vec3 probeMin;
uniform vec3 probeMax;
uniform vec3 probePosition;
uniform bool probeBoxProjection;
uniform vec4 fog[2]; // color.rgb/mode(0 off,1 linear,2 exp2), near/far/density/0
uniform vec4 tint;
uniform vec4 surface; // metallic, roughness, normalScale, occlusionStrength
uniform vec4 emission; // emissive RGB, alphaCutoff
uniform ivec4 maps; // metallicRoughness, normal, occlusion, emissive
uniform bool pbr;
uniform int alphaMode;
uniform bool doubleSided;
uniform bool linearOutput;
uniform vec3 cameraPosition;
uniform bool receiveShadow;
out vec4 color;
uniform int oitPass;
uniform float meshFade;
/* XYZ_SURFACE_HOOKS */
vec4 xyzSurface(vec3 world, vec3 normal, vec2 uv, vec4 texel) { return texel; }
/* XYZ_SURFACE_HOOKS_END */
${f}
mat3 materialNormalFrame(vec3 n, vec2 uv) {
  vec3 dp1 = dFdx(vPosition), dp2 = dFdy(vPosition);
  vec2 duv1 = dFdx(uv), duv2 = dFdy(uv);
  vec3 dp2perp = cross(dp2,n), dp1perp = cross(n,dp1);
  vec3 t = dp2perp*duv1.x+dp1perp*duv2.x;
  vec3 b = dp2perp*duv1.y+dp1perp*duv2.y;
  float scale = inversesqrt(max(max(dot(t,t),dot(b,b)),.000001));
  return mat3(t*scale,b*scale,n);
}
${o}
const float PI = 3.141592653589793;
${l}
${c}
${u}
${d}
vec3 decodeSRGB(vec3 c) {
  return mix(c / 12.92, pow((max(c, vec3(0.0)) + .055) / 1.055, vec3(2.4)), step(vec3(.04045), c));
}
vec3 encodeSRGB(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - .055, step(vec3(.0031308), c));
}
vec2 equirectUV(vec3 d) {
  d = normalize(d);
  return vec2(atan(d.x, -d.z) * 0.15915494309 + 0.5, acos(clamp(d.y, -1.0, 1.0)) * 0.31830988618);
}
vec3 shIrradiance(vec3 n) {
  vec3 c = environment[0].rgb * 0.282095;
  c += environment[1].rgb * (0.488603 * n.y);
  c += environment[2].rgb * (0.488603 * n.z);
  c += environment[3].rgb * (0.488603 * n.x);
  c += environment[4].rgb * (1.092548 * n.x * n.y);
  c += environment[5].rgb * (1.092548 * n.y * n.z);
  c += environment[6].rgb * (0.315392 * (3.0 * n.z * n.z - 1.0));
  c += environment[7].rgb * (1.092548 * n.x * n.z);
  c += environment[8].rgb * (0.546274 * (n.x * n.x - n.y * n.y));
  return max(c, vec3(0.0));
}
// Karis' analytic split-sum approximation; avoids a BRDF lookup texture.
vec2 environmentBRDF(float nv, float rough) {
  vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
  vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
  vec4 r = rough * c0 + c1;
  float a004 = min(r.x * r.x, exp2(-9.28 * nv)) * r.x + r.y;
  return vec2(-1.04, 1.04) * a004 + r.zw;
}
vec3 brdf(vec3 base, float metallic, float roughness, vec3 n, vec3 v, vec3 l, vec3 dielectricF0, float weight, float transmission) {
  float nl = max(dot(n, l), 0.0);
  float nv = max(dot(n, v), .0001);
  vec3 h = (v + l) / max(length(v + l), .000001);
  float nh = max(dot(n, h), 0.0);
  float vh = max(dot(v, h), 0.0);
  float alpha = roughness * roughness;
  float a2 = alpha * alpha;
  float denominator = nh * nh * (a2 - 1.0) + 1.0;
  float d = a2 / max(PI * denominator * denominator, .000001);
  float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  float g = nv / (nv * (1.0 - k) + k) * nl / (nl * (1.0 - k) + k);
  float grazing = pow(1.0-vh,5.0);
  vec3 dielectric = dielectricF0 + (vec3(weight)-dielectricF0)*(specularParams.y > .5 ? 0.0 : grazing);
  vec3 f = mix(dielectric,base+(1.0-base)*grazing,metallic);
  float remaining = 1.0-max(max(dielectric.r,dielectric.g),dielectric.b);
  return (remaining*(1.0-metallic)*(1.0-transmission)*base/PI + d*g*f/max(4.0*nv*nl,.0001))*nl;
}
float clearcoatLobe(vec3 n, vec3 v, vec3 l, float rough) {
  float nl = max(dot(n,l),0.0), nv = max(dot(n,v),.000001);
  vec3 h = (v+l)/max(length(v+l),.000001);
  float nh = max(dot(n,h),0.0), a2 = rough*rough*rough*rough;
  float denominator = nh*nh*(a2-1.0)+1.0;
  float d = a2/max(PI*denominator*denominator,.000001);
  float k = (rough+1.0)*(rough+1.0)/8.0;
  float g = nv/(nv*(1.0-k)+k)*nl/(nl*(1.0-k)+k);
  return d*g*nl/max(4.0*nv*nl,.000001);
}
float attenuation(float distanceSquared, float range) {
  float factor = 1.0;
  if (range > 0.0) factor = pow(clamp(1.0 - pow(sqrt(distanceSquared) / range, 4.0), 0.0, 1.0), 2.0);
  return factor / max(distanceSquared, .01);
}
// rgb is premultiplied by opacity, so fog fades toward the fog color * opacity.
vec3 applyFog(vec3 rgb, float opacity) {
  float mode = fog[0].w;
  if (mode < 0.5) return rgb;
  float dist = length(vPosition - cameraPosition);
  float amount = clamp((dist - fog[1].x) / max(fog[1].y - fog[1].x, .000001), 0.0, 1.0);
  if (mode > 1.5) {
    float d = fog[1].z * dist;
    amount = 1.0 - exp(-d * d);
  }
  return mix(rgb, fog[0].rgb * opacity, amount);
}
void shadeMesh() {
  vec4 texel = xyzSurface(vPosition,vNormal,vUV,texture(image, materialUV(0)));
  float opacity = texel.a * tint.a * vColor.a;
  if (pbr) {
    if (alphaMode == 1 && opacity < emission.w) discard;
    if (alphaMode != 2) opacity = 1.0;
  }
  bool front = gl_FrontFacing == (vOrientation > 0.0);
  if (pbr && (!doubleSided || transmission.y > 0.0) && !front) discard;
  if (oitPass > 0 && opacity <= 0.0) discard;
  // Revealage depends only on coverage; do not evaluate lighting a second time.
  if (oitPass == 2) {
    color = vec4(opacity * meshFade);
    return;
  }
  vec3 n = vNormal / max(length(vNormal), .000001);
  if (pbr && !front) n = -n;
  vec3 nc = n;
  if (pbr && maps.y != 0) {
    vec2 uv = materialUV(2);
    vec3 sampled = texture(normalMap,uv).xyz*2.0-1.0;
    n = normalize(materialNormalFrame(n,uv)*vec3(sampled.xy*surface.z,sampled.z));
  }
  if (pbr && clearcoat.x > 0.0 && clearcoatMaps.z > .5) {
    vec2 uv = materialUV(9);
    vec3 sampled = texture(clearcoatNormalMap,uv).xyz*2.0-1.0;
    nc = normalize(materialNormalFrame(nc,uv)*vec3(sampled.xy*clearcoat.z,sampled.z));
  }
  float visibility = directionalShadow();
  vec3 direction = lighting[0].xyz;
  vec3 l = direction / max(length(direction), .000001);
  vec3 result;
  vec3 base = texel.rgb * tint.rgb * vColor.rgb;
  if (pbr) {
    base = decodeSRGB(texel.rgb) * tint.rgb * vColor.rgb;
    vec4 mr = maps.x != 0 ? texture(metallicRoughnessMap, materialUV(1)) : vec4(1.0);
    float metallic = clamp(surface.x * mr.b, 0.0, 1.0);
    float roughness = clamp(surface.y * mr.g, .04, 1.0);
    float specularWeight = specularParams.x*(specularParams.z > .5 ? texture(specularMap,materialUV(5)).a : 1.0);
    vec3 specularTint = specularColor.rgb*(specularParams.w > .5 ? decodeSRGB(texture(specularColorMap,materialUV(6)).rgb) : vec3(1.0));
    vec3 dielectricF0 = min(specularTint*specularColor.w,vec3(1.0))*specularWeight;
    float ao = maps.z != 0 ? mix(1.0, texture(occlusionMap, materialUV(3)).r, surface.w) : 1.0;
    vec3 view = cameraPosition - vPosition;
    vec3 v = view / max(length(view), .000001);
    float transmissionWeight = 0.0, thickness = transmission.y;
    if (transmission.x > 0.0) {
      transmissionWeight = transmission.x*opticalSample(materialUV(12),transmissionMapSettings,0).r;
      thickness *= opticalSample(materialUV(13),thicknessMapSettings,1).g;
    }
    vec3 sheenTint = sheen.rgb;
    float sheenRoughness = sheen.w;
    if (any(greaterThan(sheen.rgb,vec3(0.0)))) {
      if (sheenMaps.x > .5) sheenTint *= decodeSRGB(texture(sheenColorMap,materialUV(10)).rgb);
      if (sheenMaps.y > .5) sheenRoughness *= texture(sheenRoughnessMap,materialUV(11)).a;
    }
    sheenRoughness = clamp(sheenRoughness,.04,1.0);
    float sheenMax = max(max(sheenTint.r,sheenTint.g),sheenTint.b);
    float sheenEnergy = sheenMax > 0.0 ? sheenAlbedo(clamp(dot(n,v),0.0,1.0),sheenRoughness) : 0.0;
    vec3 sheenLighting = vec3(0.0);
    float coatWeight = clearcoat.x, coatRoughness = clearcoat.y;
    if (coatWeight > 0.0) {
      if (clearcoatMaps.x > .5) coatWeight *= texture(clearcoatMap,materialUV(7)).r;
      if (clearcoatMaps.y > .5) coatRoughness *= texture(clearcoatRoughnessMap,materialUV(8)).g;
    }
    coatRoughness = clamp(coatRoughness,.04,1.0);
    float coatFresnel = coatWeight > 0.0 ? .04+.96*pow(1.0-clamp(abs(dot(nc,v)),0.0,1.0),5.0) : 0.0;
    vec3 coating = vec3(0.0);
    result = max(lighting[1].w, 0.0) * base * (1.0 - metallic) * (1.0-transmissionWeight) * ao * (environment[9].y > 0.5 ? 0.0 : 1.0);
    if (environment[9].y > 0.5) {
      float nv = max(dot(n, v), .0001);
      vec2 ab = environmentBRDF(nv, roughness);
      vec3 dielectric = specularParams.y > .5 ? dielectricF0 : dielectricF0*ab.x+vec3(specularWeight*ab.y);
      vec3 reflected = mix(dielectric,base*ab.x+vec3(ab.y),metallic);
      vec3 radiance = textureLod(environmentMap, equirectUV(probeReflection(vPosition,reflect(-v, n))), roughness * environment[9].z).rgb;
      vec3 diffuseLight = shIrradiance(n)*base*(1.0-metallic)*(1.0-transmissionWeight)*max(1.0-max(max(dielectric.r,dielectric.g),dielectric.b),0.0);
      result += (diffuseLight+radiance*reflected)*ao*environment[9].x;
      if (sheenMax > 0.0) {
        vec3 sheenRadiance = textureLod(environmentMap,equirectUV(probeReflection(vPosition,reflect(-v,n))),sheenRoughness*environment[9].z).rgb;
        sheenLighting += sheenRadiance*sheenEnergy*ao*environment[9].x;
      }
      if (coatWeight > 0.0) {
        vec2 coatAB = environmentBRDF(max(dot(nc,v),.0001),coatRoughness);
        vec3 coatRadiance = textureLod(environmentMap,equirectUV(probeReflection(vPosition,reflect(-v,nc))),coatRoughness*environment[9].z).rgb;
        coating += coatRadiance*(.04*coatAB.x+coatAB.y)*ao*environment[9].x;
      }
    }
    result += brdf(base, metallic, roughness, n, v, l, dielectricF0, specularWeight, transmissionWeight) * lighting[1].rgb * max(lighting[0].w, 0.0) * visibility;
    if (sheenMax > 0.0) sheenLighting += sheenLobe(n,v,l,sheenRoughness)*lighting[1].rgb*max(lighting[0].w,0.0)*visibility;
    if (coatWeight > 0.0) coating += clearcoatLobe(nc,v,l,coatRoughness)*coatFresnel*lighting[1].rgb*max(lighting[0].w,0.0)*visibility;
    for (int i = 0; i < ${t}; i++) {
      if (i >= int(lighting[2].x)) break;
      vec4 p = lighting[3 + i * 2], c = lighting[4 + i * 2];
      vec3 delta = p.xyz - vPosition;
      float d2 = dot(delta, delta);
      vec3 incident = c.rgb*c.w*attenuation(d2,p.w)*pointShadow(i,p.xyz);
      vec3 pl = delta/max(sqrt(d2),.000001);
      result += brdf(base,metallic,roughness,n,v,pl,dielectricF0,specularWeight,transmissionWeight)*incident;
      if (sheenMax > 0.0) sheenLighting += sheenLobe(n,v,pl,sheenRoughness)*incident;
      if (coatWeight > 0.0) coating += clearcoatLobe(nc,v,pl,coatRoughness)*coatFresnel*incident;
    }
    for (int i = 0; i < ${n}; i++) {
      if (i >= int(lighting[2].y)) break;
      vec4 p = lighting[${r/4} + i * 4], c = lighting[${r/4+1} + i * 4], d = lighting[${r/4+2} + i * 4];
      vec3 delta = p.xyz - vPosition;
      float d2 = dot(delta, delta);
      vec3 sl = delta / max(sqrt(d2), .000001);
      float cone = smoothstep(d.w, lighting[${r/4+3} + i * 4].x, dot(-sl, d.xyz));
      vec3 incident = c.rgb*c.w*attenuation(d2,p.w)*cone*spotShadow(i);
      result += brdf(base,metallic,roughness,n,v,sl,dielectricF0,specularWeight,transmissionWeight)*incident;
      if (sheenMax > 0.0) sheenLighting += sheenLobe(n,v,sl,sheenRoughness)*incident;
      if (coatWeight > 0.0) coating += clearcoatLobe(nc,v,sl,coatRoughness)*coatFresnel*incident;
    }
    if (transmissionWeight > 0.0 && metallic < 1.0) {
      vec3 ray = refract(-v,n,1.0/max(transmission.w,1.0));
      ray /= max(length(ray),.000001);
      float localLength = length(vec3(dot(vLocal0,ray),dot(vLocal1,ray),dot(vLocal2,ray)));
      float distance = localLength > 0.0 ? thickness/max(localLength,.000001) : 0.0;
      vec2 uv = gl_FragCoord.xy/vec2(textureSize(opaqueScene,0));
      if (distance > 0.0) {
        vec4 exit = viewProjection*vec4(vPosition+ray*distance,1.0);
        if (exit.w > .000001) uv = exit.xy/exit.w*.5+.5;
      }
      vec3 transmitted = roughTransmission(uv,roughness,transmission.w);
      if (distance > 0.0 && transmission.z > 0.0) transmitted *= pow(attenuationColor.rgb,vec3(distance*transmission.z));
      vec2 ab = environmentBRDF(max(dot(n,v),.0001),roughness);
      vec3 fresnel = specularParams.y > .5 ? dielectricF0 : dielectricF0*ab.x+vec3(specularWeight*ab.y);
      result += transmitted*base*transmissionWeight*(1.0-metallic)*max(1.0-max(max(fresnel.r,fresnel.g),fresnel.b),0.0);
    }
    if (sheenMax > 0.0) result = result*(1.0-sheenMax*sheenEnergy)+sheenTint*sheenLighting;
    result += emission.rgb * (maps.w != 0 ? decodeSRGB(texture(emissiveMap, materialUV(4)).rgb) : vec3(1.0));
    if (coatWeight > 0.0) result = result*(1.0-coatWeight*coatFresnel)+coating*coatWeight;
    if (!linearOutput) result = encodeSRGB(result);
  } else {
    float directional = max(dot(vNormal, direction), 0.0) / max(length(vNormal) * length(direction), .000001);
    vec3 illumination = vec3(max(lighting[1].w, 0.0)) + lighting[1].rgb * (directional * max(lighting[0].w, 0.0) * visibility);
    for (int i = 0; i < ${t}; i++) {
      if (i >= int(lighting[2].x)) break;
      vec4 p = lighting[3 + i * 2], c = lighting[4 + i * 2];
      vec3 delta = p.xyz - vPosition;
      float d2 = dot(delta, delta);
      illumination += c.rgb * c.w * attenuation(d2,p.w) * max(dot(n, delta / max(sqrt(d2), .000001)),0.0) * pointShadow(i,p.xyz);
    }
    for (int i = 0; i < ${n}; i++) {
      if (i >= int(lighting[2].y)) break;
      vec4 p = lighting[${r/4} + i * 4], c = lighting[${r/4+1} + i * 4], d = lighting[${r/4+2} + i * 4];
      vec3 delta = p.xyz - vPosition;
      float d2 = dot(delta, delta);
      vec3 sl = delta / max(sqrt(d2), .000001);
      illumination += c.rgb * c.w * attenuation(d2,p.w) * smoothstep(d.w,lighting[${r/4+3} + i * 4].x,dot(-sl,d.xyz)) * max(dot(n,sl),0.0) * spotShadow(i);
    }
    result = base * illumination;
    if (linearOutput) result = decodeSRGB(result);
  }
  color = vec4(applyFog(result * opacity, opacity), opacity) * meshFade;
}
void main() {
  shadeMesh();
  if (oitPass == 1) color *= transparencyWeight(color.a,gl_FragCoord.z);
}`;export const shadowFragment=`#version 300 es
precision highp float;
in vec3 vPosition;
in vec3 vNormal;
/* XYZ_SURFACE_HOOKS */
vec4 xyzSurface(vec3 world, vec3 normal, vec2 uv, vec4 texel) { return texel; }
/* XYZ_SURFACE_HOOKS_END */
in vec2 vUV;
in vec4 vColor;
flat in float vOrientation;
uniform bool doubleSided;
uniform sampler2D image;
uniform float alphaCutoff;
uniform float opacity;
uniform float meshFade;
uniform int alphaMode;
${f}
void main() {
  if (meshFade < 1.0 && mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y) * 3.0,16.0) / 16.0 >= meshFade) discard;
  if (!doubleSided && gl_FrontFacing != (vOrientation > 0.0)) discard;
  float alpha = xyzSurface(vPosition,vNormal,vUV,texture(image, materialUV(0))).a * opacity * vColor.a;
  if (alphaMode == 1 && alpha < alphaCutoff) discard;
  if (alphaMode == 2 && alpha <= 0.0) discard;
}`;export const postVertex=`#version 300 es
precision highp float;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;export const postFragment=`#version 300 es
precision highp float;
uniform sampler2D image;
uniform vec4 settings; // exposure, strength, threshold, radius
uniform bool aces;
out vec4 color;
${s}
vec3 sampleAt(ivec2 p) {
  return texelFetch(image, clamp(p, ivec2(0), textureSize(image, 0) - 1), 0).rgb;
}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec3 result = focusedSample(p).rgb*ambientOcclusion(p);
  if (settings.y > 0.0) {
    vec3 bloom = vec3(0.0);
    ivec2 size = textureSize(image, 0);
    int radius = int(floor(min(settings.w, float(max(size.x, size.y))) + .5));
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++)
      bloom += max(sampleAt(p + ivec2(x, y) * radius) - settings.z, vec3(0.0));
    result += bloom * (settings.y / 9.0);
  }
  result *= settings.x;
  if (aces) result = clamp((result * (2.51 * result + .03)) / (result * (2.43 * result + .59) + .14), 0.0, 1.0);
  result = max(result, vec3(0.0));
  result = mix(result * 12.92, 1.055 * pow(result, vec3(1.0 / 2.4)) - .055, step(vec3(.0031308), result));
  color = vec4(result, 1.0);
}`;export const skyVertex=`#version 300 es
precision highp float;
out vec2 vNdc;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)) * 2.0 - 1.0;
  vNdc = p;
  gl_Position = vec4(p, 1.0, 1.0);
}`;export const skyFragment=`#version 300 es
precision highp float;
in vec2 vNdc;
uniform mat4 invViewProjection;
uniform sampler2D backgroundMap;
uniform vec2 sky; // intensity, linearOutput
out vec4 color;
vec3 encodeSRGB(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - .055, step(vec3(.0031308), c));
}
vec2 equirectUV(vec3 d) {
  d = normalize(d);
  return vec2(atan(d.x, -d.z) * 0.15915494309 + 0.5, acos(clamp(d.y, -1.0, 1.0)) * 0.31830988618);
}
void main() {
  vec4 nearPoint = invViewProjection * vec4(vNdc, 0.0, 1.0);
  vec4 farPoint = invViewProjection * vec4(vNdc, 1.0, 1.0);
  vec3 direction = normalize(farPoint.xyz / farPoint.w - nearPoint.xyz / nearPoint.w);
  vec3 c = textureLod(backgroundMap, equirectUV(direction), 0.0).rgb * sky.x;
  if (sky.y < 0.5) c = encodeSRGB(c);
  color = vec4(c, 1.0);
}`;export function nativeMeshGLSL(e,t){let n=t===`vertex`?`#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 uv;
layout(location=3) in mat4 instanceMatrix;
layout(location=7) in vec3 instanceColor;
layout(location=8) in vec4 vertexColor;
layout(location=9) in uvec4 jointIndices;
layout(location=10) in vec4 jointWeights;
layout(location=11) in vec2 uv1;
layout(location=12) in uvec4 jointIndices1;
layout(location=13) in vec4 jointWeights1;
uniform highp sampler2D jointPalette;
uniform bool skinned;
uniform mat4 viewProjection;
uniform mat4 model;
uniform bool instanced;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;
out vec2 vUV1;
out vec4 vColor;
flat out float vOrientation;
flat out vec3 vLocal0;
flat out vec3 vLocal1;
flat out vec3 vLocal2;
mat4 jointMatrix(uint index) {
  int row = int(index);
  return mat4(texelFetch(jointPalette, ivec2(0,row),0),
    texelFetch(jointPalette, ivec2(1,row),0),
    texelFetch(jointPalette, ivec2(2,row),0),
    texelFetch(jointPalette, ivec2(3,row),0));
}
/* XYZ_VERTEX_HOOKS */
struct XYZVertex { vec3 position; vec3 normal; };
XYZVertex xyzDeform(vec3 position, vec3 normal, vec2 uv) { return XYZVertex(position,normal); }
/* XYZ_VERTEX_HOOKS_END */
void main() {
  mat4 world = model;
  if (instanced) world = model * instanceMatrix;
  XYZVertex deformed = xyzDeform(position,normal,uv);
  vec4 local = vec4(deformed.position, 1.0);
  vec3 localNormal = deformed.normal;
  if (skinned) {
    mat4 skin = jointMatrix(jointIndices.x) * jointWeights.x
      + jointMatrix(jointIndices.y) * jointWeights.y
      + jointMatrix(jointIndices.z) * jointWeights.z
      + jointMatrix(jointIndices.w) * jointWeights.w
      + jointMatrix(jointIndices1.x) * jointWeights1.x
      + jointMatrix(jointIndices1.y) * jointWeights1.y
      + jointMatrix(jointIndices1.z) * jointWeights1.z
      + jointMatrix(jointIndices1.w) * jointWeights1.w;
    local = vec4((skin * local).xyz, 1.0);
    mat3 cofactor = mat3(cross(skin[1].xyz,skin[2].xyz),
      cross(skin[2].xyz,skin[0].xyz),cross(skin[0].xyz,skin[1].xyz));
    float sign = dot(skin[0].xyz,cofactor[0]) < 0.0 ? -1.0 : 1.0;
    vec3 direction = sign * cofactor * deformed.normal;
    float directionLength = length(direction);
    localNormal = direction / (directionLength > 0.0 ? directionLength : 1.0);
  }
  vec4 p = world * local;
  vec4 clip = viewProjection * p;
  gl_Position = vec4(clip.xy, clip.z * 2.0 - clip.w, clip.w);
  mat3 m = mat3(world);
  vec3 a = cross(m[1], m[2]);
  float determinant = dot(m[0], a);
  vOrientation = determinant < 0.0 ? -1.0 : 1.0;
  mat3 cofactor = mat3(a, cross(m[2], m[0]), cross(m[0], m[1]));
  mat3 normalMatrix = determinant == 0.0 ? mat3(0.0) : cofactor/determinant;
  vLocal0 = normalMatrix[0]; vLocal1 = normalMatrix[1]; vLocal2 = normalMatrix[2];
  vNormal = normalMatrix*localNormal;
  vPosition = p.xyz;
  vUV = uv;
  vUV1 = uv1;
  vColor = vec4(instanceColor, 1.0) * vertexColor;
}`:t===`shadow`?shadowFragment:meshFragment,r=t===`vertex`?`VERTEX`:`SURFACE`,a=n.indexOf(`/* XYZ_${r}_HOOKS */`),o=`/* XYZ_${r}_HOOKS_END */`,s=n.indexOf(o)+o.length,c=t===`surface`?``:`uniform sampler2D xyzMap0;
uniform sampler2D xyzMap1;
uniform sampler2D xyzMap2;
uniform sampler2D xyzMap3;
`,l=`${t===`vertex`?`#define XYZ_VERTEX 1`:`#define XYZ_FRAGMENT 1`}${t===`shadow`?`
#define XYZ_SHADOW 1`:``}
uniform vec4 xyzUniforms[${i.uniformFloats/4}];
${c}struct XYZVertex { vec3 position; vec3 normal; };
`;return(n.slice(0,a)+l+e+n.slice(s)).replaceAll(`metallicRoughnessMap`,`xyzMap0`).replaceAll(`normalMap`,`xyzMap1`).replaceAll(`occlusionMap`,`xyzMap2`).replaceAll(`emissiveMap`,`xyzMap3`)}
//# sourceMappingURL=webgl-feature-shaders.js.map
