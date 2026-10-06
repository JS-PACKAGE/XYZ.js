import {
  MAX_POINT_LIGHTS,
  MAX_SPOT_LIGHTS,
  nativeMaterial3DLimits,
  materialTextureSlots,
  materialQuality,
} from '../../../src/data/rendering.js';
import { atlasWGSL } from './shadow-shaders.js';
import { GraphicsError } from './errors.js';
import { sheenWGSL, sheenEnvironmentWGSL } from './sheen-shaders.js';
import { brdfWGSL } from './brdf-shaders.js';
import { transmissionWGSL } from './transmission-shaders.js';
import { reflectionProbeWGSL } from './reflection-probe-shaders.js';
import { oitWeightWGSL } from './oit-shaders.js';

export const webgpuMeshShader = /* wgsl */ `
struct PointLight { positionRange: vec4f, colorIntensity: vec4f };
struct SpotLight {
  positionRange: vec4f, colorIntensity: vec4f, directionOuter: vec4f, inner: vec4f,
};
struct SceneUniforms {
  viewProjection: mat4x4f,
  camera: vec4f,
  lightDirection: vec4f,
  lightColorAmbient: vec4f,
  counts: vec4f,
  points: array<PointLight, ${MAX_POINT_LIGHTS}>,
  spots: array<SpotLight, ${MAX_SPOT_LIGHTS}>,
  pointIds: array<vec4f, ${MAX_POINT_LIGHTS / 4}>,
  invViewProjection: mat4x4f,
  envParams: vec4f,
  fogColor: vec4f,
  fogParams: vec4f,
};
struct ProbeUniforms {
  sh: array<vec4f, 9>,
  params: vec4f,
  min: vec4f,
  max: vec4f,
  position: vec4f,
};
struct MeshUniforms {
  model: mat4x4f,
  tint: vec4f,
  material: vec4f,
  emissiveOcclusion: vec4f,
  maps: vec4f,
  settings: vec4f,
  specularColor: vec4f,
  specularParams: vec4f,
  clearcoat: vec4f, // strength, roughness, normal scale, native skin enabled
  clearcoatMaps: vec4f, // map flags, raw native base alpha
  sheen: vec4f,
  sheenMaps: vec4f, // sheen maps, specular AA strength, alpha-to-coverage
  transmission: vec4f,
  attenuation: vec4f,
  transmissionMapSettings: vec4f,
  thicknessMapSettings: vec4f,
  envSH: array<vec4f, 9>,
  envParams: vec4f,
  probeMin: vec4f,
  probeMax: vec4f,
  probePosition: vec4f,
  probes: array<ProbeUniforms, 4>,
  custom: array<vec4f, ${nativeMaterial3DLimits.uniformFloats / 4}>,
  fade: vec4f,
  coordinates: array<vec4f, ${materialTextureSlots.length * 2}>,
  finish: array<vec4f, 5>,
};
@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var environmentMap: texture_2d_array<f32>;
@group(0) @binding(3) var environmentSampler: sampler;
@group(0) @binding(4) var backgroundMap: texture_2d<f32>;
@group(1) @binding(0) var<uniform> mesh: MeshUniforms;
@group(1) @binding(1) var<storage, read> jointPalette: array<mat4x4f>;
@group(2) @binding(0) var baseMap: texture_2d<f32>;
@group(2) @binding(1) var materialSampler: sampler;
@group(2) @binding(2) var metallicRoughnessMap: texture_2d<f32>;
@group(2) @binding(3) var normalMap: texture_2d<f32>;
@group(2) @binding(4) var occlusionMap: texture_2d<f32>;
@group(2) @binding(5) var emissiveMap: texture_2d<f32>;
@group(2) @binding(6) var metallicRoughnessSampler: sampler;
@group(2) @binding(7) var normalSampler: sampler;
@group(2) @binding(8) var occlusionSampler: sampler;
@group(2) @binding(9) var emissiveSampler: sampler;
@group(2) @binding(10) var specularMap: texture_2d<f32>;
@group(2) @binding(11) var specularColorMap: texture_2d<f32>;
@group(2) @binding(12) var specularSampler: sampler;
@group(2) @binding(13) var specularColorSampler: sampler;
@group(2) @binding(14) var clearcoatMap: texture_2d<f32>;
@group(2) @binding(15) var clearcoatRoughnessMap: texture_2d<f32>;
@group(2) @binding(16) var clearcoatNormalMap: texture_2d<f32>;
@group(2) @binding(17) var clearcoatSampler: sampler;
@group(2) @binding(18) var clearcoatRoughnessSampler: sampler;
@group(2) @binding(19) var clearcoatNormalSampler: sampler;
@group(2) @binding(20) var sheenColorMap: texture_2d<f32>;
@group(2) @binding(21) var sheenRoughnessMap: texture_2d<f32>;
@group(2) @binding(22) var sheenColorSampler: sampler;
@group(2) @binding(23) var sheenRoughnessSampler: sampler;
@group(2) @binding(24) var opticalMaps: texture_2d_array<f32>;
${atlasWGSL}
${sheenWGSL}
${brdfWGSL}
${transmissionWGSL}
${reflectionProbeWGSL}
${sheenEnvironmentWGSL}
// Four-point footprint moments prevent a sampled normal gradient from aliasing to zero.
fn filteredMaterialNormal(source: texture_2d<f32>, samp: sampler, uv: vec2f, scale: f32) -> vec4f {
  let dx = dpdx(uv); let dy = dpdy(uv);
  let ox = dx*0.2886751345948129; let oy = dy*0.2886751345948129;
  let a = textureSampleGrad(source,samp,uv-ox-oy,dx,dy).xyz*2.0-1.0;
  let b = textureSampleGrad(source,samp,uv+ox-oy,dx,dy).xyz*2.0-1.0;
  let c = textureSampleGrad(source,samp,uv-ox+oy,dx,dy).xyz*2.0-1.0;
  let d = textureSampleGrad(source,samp,uv+ox+oy,dx,dy).xyz*2.0-1.0;
  let mean = 0.25*(safeNormal(vec3f(a.xy*scale,a.z))+safeNormal(vec3f(b.xy*scale,b.z))+safeNormal(vec3f(c.xy*scale,c.z))+safeNormal(vec3f(d.xy*scale,d.z)));
  return vec4f((a+b+c+d)*0.25,max(0.0,1.0-dot(mean,mean)));
}
struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @location(3) instance0: vec4f,
  @location(4) instance1: vec4f,
  @location(5) instance2: vec4f,
  @location(6) instance3: vec4f,
  @location(7) instanceColor: vec3f,
  @location(8) vertexColor: vec4f,
  @location(9) joints: vec4u,
  @location(10) weights: vec4f,
  @location(11) uv1: vec2f,
  @location(12) joints1: vec4u,
  @location(13) weights1: vec4f,
  @location(14) tangent: vec4f,
};
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
  @location(2) world: vec3f,
  @location(3) @interpolate(flat) orientation: f32,
  @location(4) color: vec4f,
  @location(5) @interpolate(flat) local0: vec3f,
  @location(6) @interpolate(flat) local1: vec3f,
  @location(7) @interpolate(flat) local2: vec3f,
  @location(8) uv1: vec2f,
  @location(9) tangent: vec4f,
};
struct XYZVertex { position: vec3f, normal: vec3f };
/* XYZ_PHYSICAL_TYPE */
struct XYZPhysical { base: vec3f, metallic: f32, roughness: f32, occlusion: f32, emission: vec3f };
/* XYZ_PHYSICAL_TYPE_END */
/* XYZ_NATIVE_HOOKS */
fn xyzDeform(position: vec3f, normal: vec3f, uv: vec2f) -> XYZVertex {
  return XYZVertex(position, normal);
}
fn xyzSurface(world: vec3f, normal: vec3f, uv: vec2f, texel: vec4f) -> vec4f {
  return texel;
}
/* XYZ_NATIVE_HOOKS_END */
/* XYZ_PHYSICAL_DEFAULT */
fn xyzPhysical(world: vec3f, normal: vec3f, uv: vec2f, surface: XYZPhysical) -> XYZPhysical {
  return surface;
}
/* XYZ_PHYSICAL_DEFAULT_END */
fn transformVertex(input: VertexInput, projection: mat4x4f) -> VertexOutput {
  let skin = jointPalette[input.joints.x] * input.weights.x
    + jointPalette[input.joints.y] * input.weights.y
    + jointPalette[input.joints.z] * input.weights.z
    + jointPalette[input.joints.w] * input.weights.w
    + jointPalette[input.joints1.x] * input.weights1.x
    + jointPalette[input.joints1.y] * input.weights1.y
    + jointPalette[input.joints1.z] * input.weights1.z
    + jointPalette[input.joints1.w] * input.weights1.w;
  let skinCofactor = mat3x3f(cross(skin[1].xyz, skin[2].xyz),
    cross(skin[2].xyz, skin[0].xyz), cross(skin[0].xyz, skin[1].xyz));
  let skinSign = select(1.0, -1.0, dot(skin[0].xyz, skinCofactor[0]) < 0.0);
  let deformed = xyzDeform(input.position, input.normal, input.uv);
  let skinDirection = skinSign * skinCofactor * deformed.normal;
  let skinLength = length(skinDirection);
  let skinNormal = select(deformed.normal,
    skinDirection / select(1.0, skinLength, skinLength > 0.0), mesh.clearcoat.w > 0.5);
  let skinTangentDirection = mat3x3f(skin[0].xyz, skin[1].xyz, skin[2].xyz) * input.tangent.xyz;
  let skinTangentLength = length(skinTangentDirection);
  let skinTangent = select(input.tangent.xyz,
    skinTangentDirection / select(1.0, skinTangentLength, skinTangentLength > 0.0), mesh.clearcoat.w > 0.5);
  let model = mesh.model * mat4x4f(input.instance0, input.instance1, input.instance2, input.instance3);
  let a = model[0].xyz;
  let b = model[1].xyz;
  let c = model[2].xyz;
  let determinant = dot(a, cross(b, c));
  let inverseDet = select(0.0, 1.0 / determinant, determinant != 0.0);
  let normalMatrix = mat3x3f(cross(b,c), cross(c,a), cross(a,b)) * inverseDet;
  let local = skin * vec4f(deformed.position, 1.0);
  let world = model * vec4f(local.xyz, 1.0);
  var output: VertexOutput;
  output.position = projection * world;
  output.normal = normalMatrix * skinNormal;
  let handedness = input.tangent.w * select(1.0, skinSign, mesh.clearcoat.w > 0.5)
    * select(-1.0, 1.0, determinant >= 0.0);
  let unchanged = all(deformed.position == input.position) && all(deformed.normal == input.normal);
  output.tangent = vec4f(mat3x3f(a,b,c) * skinTangent, select(0.0, handedness, unchanged));
  output.uv = input.uv;
  output.uv1 = input.uv1;
  output.world = world.xyz;
  output.orientation = select(-1.0,1.0,determinant >= 0.0)
    * select(1.0,skinSign,mesh.clearcoat.w > 0.5);
  output.color = vec4f(input.instanceColor, 1.0) * input.vertexColor;
  output.local0 = normalMatrix[0];
  output.local1 = normalMatrix[1];
  output.local2 = normalMatrix[2];
  return output;
}
@vertex fn vertexMain(input: VertexInput) -> VertexOutput {
  return transformVertex(input, scene.viewProjection);
}
@vertex fn shadowVertex(input: VertexInput) -> VertexOutput {
  return transformVertex(input, shadowProjection);
}
fn decodeSRGB(c: vec3f) -> vec3f {
  return select(pow(max((c + 0.055) / 1.055, vec3f(0.0)), vec3f(2.4)), c / 12.92, c <= vec3f(0.04045));
}
fn encodeSRGB(c: vec3f) -> vec3f {
  let v = max(c, vec3f(0.0));
  return select(1.055 * pow(v, vec3f(1.0 / 2.4)) - 0.055, v * 12.92, v <= vec3f(0.0031308));
}
fn safeNormal(v: vec3f) -> vec3f {
  return v / max(length(v), 0.000001);
}
fn equirectUV(direction: vec3f) -> vec2f {
  let d = safeNormal(direction);
  return vec2f(atan2(d.x, -d.z) * 0.15915494309 + 0.5, acos(clamp(d.y, -1.0, 1.0)) * 0.31830988618);
}
fn attenuation(distance: f32, range: f32) -> f32 {
  var falloff = 1.0;
  if (range > 0.0) { falloff = pow(max(1.0 - pow(distance / range, 4.0), 0.0), 2.0); }
  return falloff / max(distance * distance, 0.01);
}
fn brdf(n: vec3f, v: vec3f, l: vec3f, base: vec3f, metal: f32, rough: f32, f0: vec3f, f90: vec3f, compensation: vec3f, remaining: f32, transmission: f32, tangent: vec3f, bitangent: vec3f) -> vec3f {
  let h = safeNormal(v+l);
  let nl = clamp(dot(n,l),0.0,1.0);
  let nv = clamp(dot(n,v),0.0001,1.0);
  let nh = clamp(dot(n,h),0.0,1.0);
  let vh = clamp(dot(v,h),0.0,1.0);
  let alpha2 = rough*rough*rough*rough;
  var fresnel = f0+(f90-f0)*pow(1.0-vh,5.0);
  if (mesh.finish[0].z > 0.0) { fresnel=mix(fresnel,thinFilm(vh,mesh.finish[0].w,mesh.finish[1].x,f0),mesh.finish[0].z); }
  var specular = ggxDistribution(nh,alpha2)*ggxVisibility(nv,nl,alpha2)*fresnel*compensation;
  if (mesh.finish[0].x > 0.0) { specular=anisotropicGGX(n,tangent,bitangent,v,l,h,rough,mesh.finish[0].x)*fresnel*compensation; }
  let diffuse = remaining*(1.0-metal)*(1.0-transmission)*base/3.14159265359;
  if (mesh.finish[1].y > 0.0) {
    let profile=mix(vec3f(nl),diffusionProfile(dot(n,l),mesh.finish[4].rgb,mesh.finish[4].w),mesh.finish[1].y);
    return diffuse*profile+specular*nl;
  }
  return (diffuse+specular)*nl;
}
fn clearcoatLobe(n: vec3f, v: vec3f, l: vec3f, rough: f32, compensation: f32) -> f32 {
  let nl=clamp(dot(n,l),0.0,1.0);
  let nv=clamp(dot(n,v),0.0001,1.0);
  let h=safeNormal(v+l);
  let nh=clamp(dot(n,h),0.0,1.0);
  let alpha2=rough*rough*rough*rough;
  let fresnel=0.04+0.96*pow(1.0-clamp(dot(v,h),0.0,1.0),5.0);
  return ggxDistribution(nh,alpha2)*ggxVisibility(nv,nl,alpha2)*fresnel*compensation*nl;
}
fn materialUV(input: VertexOutput, slot: u32) -> vec2f {
  let a = mesh.coordinates[slot*2u];
  let b = mesh.coordinates[slot*2u+1u];
  let uv = select(input.uv,input.uv1,b.z>0.5);
  return vec2f(a.x*uv.x+a.z*uv.y,a.y*uv.x+a.w*uv.y)+b.xy;
}
@fragment fn shadowFragment(input: VertexOutput, @builtin(front_facing) front: bool) {
  if (mesh.fade.x < 1.0 && f32((u32(input.position.x) + u32(input.position.y) * 3u) % 16u) / 16.0 >= mesh.fade.x) { discard; }
  let texel = xyzSurface(input.world, input.normal, input.uv, textureSample(baseMap, materialSampler, materialUV(input,0u)));
  let effectiveFront = front == (input.orientation > 0.0);
  let alpha = texel.a * mesh.tint.a * input.color.a;
  let masked = mesh.settings.w > 0.5 && mesh.settings.w < 1.5;
  let blended = mesh.settings.w > 1.5;
  if ((mesh.material.x > 0.5 && ((!effectiveFront && mesh.settings.y < 0.5) || (masked && alpha < mesh.settings.x) || (blended && alpha <= 0.0))) || (mesh.material.x < 0.5 && alpha <= 0.0)) { discard; }
}
// rgb is premultiplied by opacity, so fog fades toward fogColor * opacity and keeps transparency.
fn applyFog(rgb: vec3f, opacity: f32, world: vec3f) -> vec3f {
  let mode = scene.fogColor.w;
  if (mode < 0.5) { return rgb; }
  let distance = length(world - scene.camera.xyz);
  var amount = clamp((distance - scene.fogParams.x) / max(scene.fogParams.y - scene.fogParams.x, 0.000001), 0.0, 1.0);
  if (mode > 1.5) {
    let d = scene.fogParams.z * distance;
    amount = 1.0 - exp(-d * d);
  }
  return mix(rgb, scene.fogColor.rgb * opacity, amount);
}
fn shadeMesh(input: VertexOutput, front: bool) -> vec4f {
  let texel = xyzSurface(input.world, input.normal, input.uv, textureSample(baseMap, materialSampler, materialUV(input,0u)));
  let visibility = directionalShadow(input.world,input.normal);
  let sampledAlpha = texel.a * mesh.tint.a * input.color.a;
  let opacity = select(1.0,sampledAlpha,mesh.material.x < 0.5 || mesh.settings.w > 1.5);
  let direction = safeNormal(scene.lightDirection.xyz);
  if (mesh.material.x < 0.5) {
    let normal = input.normal;
    let light = max(dot(normal,scene.lightDirection.xyz),0.0) / max(length(normal)*length(scene.lightDirection.xyz),0.000001);
    var illumination = vec3f(max(scene.lightColorAmbient.w,0.0)) + scene.lightColorAmbient.rgb*(light*max(scene.lightDirection.w,0.0)*visibility);
    for (var i = 0u; i < u32(scene.counts.x); i++) {
      let lightData = scene.points[i];
      let delta = lightData.positionRange.xyz-input.world;
      illumination += lightData.colorIntensity.rgb*lightData.colorIntensity.w*attenuation(length(delta),lightData.positionRange.w)*max(dot(safeNormal(normal),safeNormal(delta)),0.0)*pointShadow(i,input.world,lightData.positionRange.xyz,input.normal);
    }
    for (var i = 0u; i < u32(scene.counts.y); i++) {
      let lightData = scene.spots[i];
      let delta = lightData.positionRange.xyz-input.world;
      let l = safeNormal(delta);
      let cone = smoothstep(lightData.directionOuter.w,lightData.inner.x,dot(-l,lightData.directionOuter.xyz));
      illumination += lightData.colorIntensity.rgb*lightData.colorIntensity.w*attenuation(length(delta),lightData.positionRange.w)*cone*max(dot(safeNormal(normal),l),0.0)*spotShadow(i,input.world,input.normal);
    }
    // Legacy base map remains premultiplied to retain filtered translucent edges.
    let baseAlpha = select(1.0, texel.a, mesh.clearcoatMaps.w > 0.5);
    let rgb = texel.rgb*baseAlpha*mesh.tint.rgb*input.color.rgb*illumination*mesh.tint.a*input.color.a;
    if (scene.counts.z > 0.5) { return vec4f(applyFog(decodeSRGB(rgb/max(opacity,0.000001))*opacity,opacity,input.world),opacity); }
    return vec4f(applyFog(rgb,opacity,input.world),opacity);
  }
  var mr = vec4f(1.0);
  if (mesh.maps.x > 0.5) { mr = textureSample(metallicRoughnessMap, metallicRoughnessSampler, materialUV(input,1u)); }
  var mappedNormal = vec3f(0.0,0.0,1.0);
  var normalVariance = 0.0; var coatVariance = 0.0;
  var dx = vec3f(0.0); var dy = vec3f(0.0);
  var du = vec2f(0.0); var dv = vec2f(0.0);
  if (mesh.maps.y > 0.5) {
    let uv = materialUV(input,2u);
    if (mesh.sheenMaps.z > 0.0) {
      let filtered = filteredMaterialNormal(normalMap,normalSampler,uv,mesh.material.w);
      mappedNormal = filtered.xyz; normalVariance = filtered.w;
      if (mesh.sheenMaps.z < 1.0) {
        let original = textureSample(normalMap,normalSampler,uv).xyz*2.0-1.0;
        mappedNormal = mix(original,mappedNormal,mesh.sheenMaps.z);
      }
    } else {
      mappedNormal = textureSample(normalMap,normalSampler,uv).xyz*2.0-1.0;
    }
  }
  if (mesh.maps.y > 0.5 || (mesh.clearcoat.x > 0.0 && mesh.clearcoatMaps.z > 0.5)) {
    dx = dpdx(input.world); dy = -dpdy(input.world);
    du = dpdx(materialUV(input,2u)); dv = -dpdy(materialUV(input,2u));
  }
  var ao = 1.0;
  if (mesh.maps.z > 0.5) { ao = mix(1.0,textureSample(occlusionMap, occlusionSampler, materialUV(input,3u)).r,mesh.emissiveOcclusion.w); }
  var emission = select(vec3f(1.0),decodeSRGB(textureSample(emissiveMap, emissiveSampler, materialUV(input,4u)).rgb),mesh.maps.w > 0.5 && mesh.maps.w < 1.5);
  let effectiveFront = front == (input.orientation > 0.0);
  let masked = mesh.settings.w > 0.5 && mesh.settings.w < 1.5;
  let coverage = mesh.sheenMaps.w > 0.5;
  if ((!effectiveFront && (mesh.settings.y < 0.5 || mesh.transmission.y > 0.0)) || (masked && !coverage && sampledAlpha < mesh.settings.x)) { discard; }
  var coverageAlpha = 1.0;
  if (coverage) {
    coverageAlpha = clamp((sampledAlpha-mesh.settings.x)/max(fwidth(sampledAlpha),${materialQuality.minAlphaFootprint})+0.5,0.0,1.0);
    if (coverageAlpha <= 0.0) { discard; }
  }
  var base = decodeSRGB(texel.rgb)*mesh.tint.rgb*input.color.rgb;
  var metal = clamp(mesh.material.y*select(1.0,mr.b,mesh.maps.x > 0.5),0.0,1.0);
  var rough = clamp(mesh.material.z*select(1.0,mr.g,mesh.maps.x > 0.5),0.04,1.0);
  var specularWeight = mesh.specularParams.x;
  if (mesh.specularParams.z > 0.5) { specularWeight *= textureSample(specularMap,specularSampler,materialUV(input,5u)).a; }
  var specularTint = mesh.specularColor.rgb;
  if (mesh.specularParams.w > 0.5) { specularTint *= decodeSRGB(textureSample(specularColorMap,specularColorSampler,materialUV(input,6u)).rgb); }
  let dielectricF0 = min(specularTint*mesh.specularColor.w,vec3f(1.0))*specularWeight;
  var coatWeight = mesh.clearcoat.x;
  var coatRoughness = mesh.clearcoat.y;
  if (coatWeight > 0.0) {
    if (mesh.clearcoatMaps.x > 0.5) { coatWeight *= textureSample(clearcoatMap,clearcoatSampler,materialUV(input,7u)).r; }
    if (mesh.clearcoatMaps.y > 0.5) { coatRoughness *= textureSample(clearcoatRoughnessMap,clearcoatRoughnessSampler,materialUV(input,8u)).g; }
  }
  coatRoughness = clamp(coatRoughness,0.04,1.0);
  var n = safeNormal(input.normal)*select(-1.0,1.0,effectiveFront);
  var nc = n;
  if (mesh.maps.y > 0.5 || (mesh.clearcoat.x > 0.0 && mesh.clearcoatMaps.z > 0.5)) {
    let rawTangent = input.tangent.xyz - n * dot(n, input.tangent.xyz);
    let tangentLength = length(rawTangent);
    let mapping = mesh.coordinates[4];
    let coordinate = mesh.coordinates[5];
    let authored = tangentLength > 0.000001 && abs(input.tangent.w) > 0.5
      && abs(coordinate.z-mesh.fade.y) < 0.5 && all(mapping == vec4f(1.0,0.0,0.0,1.0));
    var tangent = rawTangent / max(tangentLength,0.000001);
    var bitangent = cross(n, tangent) * input.tangent.w;
    if (!authored) {
      let perpendicularY = cross(dy,n);
      let perpendicularX = cross(n,dx);
      tangent = perpendicularY*du.x + perpendicularX*dv.x;
      bitangent = (perpendicularY*du.y + perpendicularX*dv.y)*mesh.fade.z;
    }
    // Derivative products shrink with pixel footprint; only guard actual degeneracy.
    let scale = inverseSqrt(max(max(dot(tangent,tangent),dot(bitangent,bitangent)),1e-30));
    let frame = mat3x3f(tangent*scale,bitangent*scale,n);
    if (mesh.maps.y > 0.5) {
      n = safeNormal(frame*vec3f(mappedNormal.xy*mesh.material.w,mappedNormal.z));
    }
    if (mesh.clearcoat.x > 0.0 && mesh.clearcoatMaps.z > 0.5) {
      let coatUV = materialUV(input,9u);
      let coatDu = dpdx(coatUV); let coatDv = -dpdy(coatUV);
      let coatRawTangent = input.tangent.xyz - nc * dot(nc, input.tangent.xyz);
      let coatTangentLength = length(coatRawTangent);
      let coatAuthored = coatTangentLength > 0.000001 && abs(input.tangent.w) > 0.5
        && abs(mesh.coordinates[19].z-mesh.fade.y) < 0.5 && all(mesh.coordinates[18] == vec4f(1.0,0.0,0.0,1.0));
      var coatTangent = coatRawTangent / max(coatTangentLength,0.000001);
      var coatBitangent = cross(nc,coatTangent)*input.tangent.w;
      if (!coatAuthored) {
        let perpendicularY = cross(dy,nc);
        let perpendicularX = cross(nc,dx);
        coatTangent = perpendicularY*coatDu.x + perpendicularX*coatDv.x;
        coatBitangent = (perpendicularY*coatDu.y + perpendicularX*coatDv.y)*mesh.fade.z;
      }
      let coatScale = inverseSqrt(max(max(dot(coatTangent,coatTangent),dot(coatBitangent,coatBitangent)),1e-30));
      let coatFrame = mat3x3f(coatTangent*coatScale,coatBitangent*coatScale,nc);
      var sampled: vec3f;
      if (mesh.sheenMaps.z > 0.0) {
        let filtered = filteredMaterialNormal(clearcoatNormalMap,clearcoatNormalSampler,coatUV,mesh.clearcoat.z);
        sampled = filtered.xyz; coatVariance = filtered.w;
        if (mesh.sheenMaps.z < 1.0) {
          let original = textureSample(clearcoatNormalMap,clearcoatNormalSampler,coatUV).xyz*2.0-1.0;
          sampled = mix(original,sampled,mesh.sheenMaps.z);
        }
      } else {
        sampled = textureSample(clearcoatNormalMap,clearcoatNormalSampler,coatUV).xyz*2.0-1.0;
      }
      nc = safeNormal(coatFrame*vec3f(sampled.xy*mesh.clearcoat.z,sampled.z));
    }
  }
  if (mesh.finish[0].x + mesh.finish[0].z + mesh.finish[1].w + mesh.finish[2].x + mesh.finish[2].y + mesh.finish[2].z + mesh.finish[2].w + mesh.finish[3].x + mesh.finish[3].y > 0.0) {
    let view = safeNormal(scene.camera.xyz - input.world);
    if (mesh.finish[1].w > 0.0 && mesh.maps.y > 0.5) {
      let uv = materialUV(input, 0u);
      let dir = mappedNormal.xy * mesh.finish[1].w;
      var best = uv;
      var bestH = 1.0;
      for (var step = 0; step < 4; step++) {
        let sampleUV = uv + dir * (f32(step) / 3.0);
        let h = textureSample(normalMap, normalSampler, sampleUV).z;
        if (h < bestH) { bestH = h; best = sampleUV; }
      }
      // Sample outside the data-dependent branch: textureSample needs uniform control flow.
      let parallaxBase = decodeSRGB(textureSample(baseMap, materialSampler, best).rgb) * mesh.tint.rgb * input.color.rgb;
      base = select(base, parallaxBase, bestH < 1.0);
    }
    if (mesh.finish[3].y > 0.0) {
      let weight = abs(n);
      let sum = max(weight.x + weight.y + weight.z, 0.000001);
      let px = decodeSRGB(textureSample(baseMap, materialSampler, input.world.zy).rgb);
      let py = decodeSRGB(textureSample(baseMap, materialSampler, input.world.xz).rgb);
      let pz = decodeSRGB(textureSample(baseMap, materialSampler, input.world.xy).rgb);
      base = mix(base, (px * weight.x + py * weight.y + pz * weight.z) / sum, mesh.finish[3].y);
    }
    if (mesh.finish[3].x > 0.0) {
      let detail = decodeSRGB(textureSample(baseMap, materialSampler, materialUV(input, 0u) * (1.0 + mesh.finish[3].z * 7.0)).rgb);
      base = mix(base, base * detail * 2.0, mesh.finish[3].x);
    }
    if (mesh.finish[2].x + mesh.finish[2].y + mesh.finish[2].z + mesh.finish[2].w > 0.0) {
      base = mix(base, base * base, mesh.finish[2].x);
      rough = mix(rough, 0.04, mesh.finish[2].x * (1.0 - metal));
      let up = clamp(n.y, 0.0, 1.0);
      base = mix(base, vec3f(0.85, 0.88, 0.92), mesh.finish[2].y * up);
      rough = mix(rough, 0.75, mesh.finish[2].y * up);
      base = mix(base, base * vec3f(0.42, 0.30, 0.16), mesh.finish[2].z);
      rough = min(1.0, rough + 0.35 * mesh.finish[2].w);
    }
  }
  // Native physical hooks see the final shading normal and decoded material factors, before filtering and lighting.
  let physical = xyzPhysical(input.world, n, input.uv, XYZPhysical(base, metal, rough, ao,
    mesh.emissiveOcclusion.rgb*select(vec3f(1.0),decodeSRGB(emission),mesh.maps.w > 0.5 && mesh.maps.w < 1.5)));
  base = max(physical.base, vec3f(0.0));
  metal = clamp(physical.metallic, 0.0, 1.0);
  rough = clamp(physical.roughness, 0.04, 1.0);
  ao = clamp(physical.occlusion, 0.0, 1.0);
  emission = max(physical.emission, vec3f(0.0));
  if (mesh.sheenMaps.z > 0.0) {
    let nx = dpdx(n); let ny = dpdy(n);
    let alpha = rough*rough;
    // GGX uses alpha = perceptual roughness squared; variance belongs to alpha squared.
    rough = sqrt(sqrt(min(1.0,alpha*alpha+min(${materialQuality.normalVarianceScale}*(dot(nx,nx)+dot(ny,ny)+normalVariance),${materialQuality.maxNormalVariance})*mesh.sheenMaps.z)));
    if (mesh.clearcoat.x > 0.0) {
      let cx = dpdx(nc); let cy = dpdy(nc);
      let coatAlpha = coatRoughness*coatRoughness;
      coatRoughness = sqrt(sqrt(min(1.0,coatAlpha*coatAlpha+min(${materialQuality.normalVarianceScale}*(dot(cx,cx)+dot(cy,cy)+coatVariance),${materialQuality.maxNormalVariance})*mesh.sheenMaps.z)));
    }
  }
  let v = safeNormal(scene.camera.xyz-input.world);
  var transmission = 0.0;
  var thickness = mesh.transmission.y;
  if (mesh.transmission.x > 0.0) {
    transmission = mesh.transmission.x*opticalSample(materialUV(input,12u),mesh.transmissionMapSettings,0).r;
    thickness *= opticalSample(materialUV(input,13u),mesh.thicknessMapSettings,1).g;
  }
  var sheenTint = mesh.sheen.rgb;
  var sheenRoughness = mesh.sheen.w;
  if (any(mesh.sheen.rgb > vec3f(0.0))) {
    if (mesh.sheenMaps.x > 0.5) { sheenTint *= decodeSRGB(textureSample(sheenColorMap,sheenColorSampler,materialUV(input,10u)).rgb); }
    if (mesh.sheenMaps.y > 0.5) { sheenRoughness *= textureSample(sheenRoughnessMap,sheenRoughnessSampler,materialUV(input,11u)).a; }
  }
  sheenRoughness = clamp(sheenRoughness,0.04,1.0);
  let sheenMax = max(max(sheenTint.r,sheenTint.g),sheenTint.b);
  var sheenEnergy = 0.0;
  var sheenLighting = vec3f(0.0);
  if (sheenMax > 0.0) { sheenEnergy = sheenAlbedo(clamp(dot(n,v),0.0,1.0),sheenRoughness); }
  let nv=clamp(dot(n,v),0.0001,1.0);
  var tangent=vec3f(0.0); var bitangent=vec3f(0.0); var reflectionNormal=n;
  if (mesh.finish[0].x > 0.0) {
    let t=safeNormal(input.tangent.xyz-n*dot(n,input.tangent.xyz));
    let b=cross(n,t)*input.tangent.w;
    tangent=t*cos(mesh.finish[0].y)+b*sin(mesh.finish[0].y);
    bitangent=cross(n,tangent)*input.tangent.w;
    let bent=safeNormal(cross(bitangent,cross(v,bitangent)));
    reflectionNormal=safeNormal(mix(n,bent,mesh.finish[0].x*(1.0-rough)));
  }
  let ab=environmentBRDF(nv,rough);
  var f0=mix(dielectricF0,min(base,vec3f(1.0)),metal);
  let dielectric90=select(vec3f(specularWeight),dielectricF0,mesh.specularParams.y>0.5);
  let f90=mix(dielectric90,vec3f(1.0),metal);
  let compensation=ggxCompensation(f0,ab);
  var reflected=clamp((f0*ab.x+f90*ab.y)*compensation,vec3f(0.0),vec3f(1.0));
  if (mesh.finish[0].z > 0.0) { reflected=clamp(mix(reflected,thinFilm(nv,mesh.finish[0].w,mesh.finish[1].x,f0)*(ab.x+ab.y)*compensation,mesh.finish[0].z),vec3f(0.0),vec3f(1.0)); }
  let remaining=1.0-max(max(reflected.r,reflected.g),reflected.b);
  let sheenRetention=1.0-sheenMax*sheenEnergy;
  var coatEnergy=0.0;
  var coatCompensation=1.0;
  var coating=vec3f(0.0);
  if(coatWeight>0.0) {
    let coatAB=environmentBRDF(clamp(dot(nc,v),0.0001,1.0),coatRoughness);
    coatCompensation=ggxCompensation(vec3f(0.04),coatAB).x;
    coatEnergy=clamp((0.04*coatAB.x+coatAB.y)*coatCompensation,0.0,1.0);
  }
  let occlusion = ao;
  let probeWeights = reflectionWeights(input.world);
  let useEnvironment = mesh.envParams.y > 0.5 || dot(probeWeights,vec4f(1.0)) > 0.0;
  var color=base*(1.0-metal)*(1.0-transmission)*remaining*sheenRetention*select(max(scene.lightColorAmbient.w,0.0),0.0,useEnvironment)*occlusion;
  if (useEnvironment) {
    let radiance=reflectionRadiance(input.world,reflect(-v,reflectionNormal),rough,probeWeights);
    let diffuseLight=reflectionIrradiance(n,probeWeights)*base*(1.0-metal)*(1.0-transmission)*remaining;
    color+=(diffuseLight+radiance*reflected)*occlusion*sheenRetention;
    if (sheenMax > 0.0) {
      let sheenRadiance=sheenEnvironment(input.world,n,v,sheenRoughness,probeWeights);
      sheenLighting += sheenRadiance*sheenEnergy*occlusion;
    }
    if (coatWeight > 0.0) {
      let coatRadiance = reflectionRadiance(input.world,reflect(-v,nc),coatRoughness,probeWeights);
      coating+=coatRadiance*coatEnergy*occlusion;
    }
  }
  color+=brdf(n,v,direction,base,metal,rough,f0,f90,compensation,remaining,transmission,tangent,bitangent)*sheenLightRetention(dot(n,direction),sheenRoughness,sheenMax,sheenEnergy)*scene.lightColorAmbient.rgb*max(scene.lightDirection.w,0.0)*visibility;
  if (sheenMax > 0.0) { sheenLighting += sheenLobe(n,v,direction,sheenRoughness)*scene.lightColorAmbient.rgb*max(scene.lightDirection.w,0.0)*visibility; }
  if(coatWeight>0.0) {coating+=clearcoatLobe(nc,v,direction,coatRoughness,coatCompensation)*scene.lightColorAmbient.rgb*max(scene.lightDirection.w,0.0)*visibility;}
  for (var i = 0u; i < u32(scene.counts.x); i++) {
    let lightData = scene.points[i];
    let delta = lightData.positionRange.xyz-input.world;
    let l=safeNormal(delta);
    let incident = lightData.colorIntensity.rgb*lightData.colorIntensity.w*attenuation(length(delta),lightData.positionRange.w)*pointShadow(i,input.world,lightData.positionRange.xyz,input.normal);
    color+=brdf(n,v,l,base,metal,rough,f0,f90,compensation,remaining,transmission,tangent,bitangent)*sheenLightRetention(dot(n,l),sheenRoughness,sheenMax,sheenEnergy)*incident;
    if(sheenMax>0.0) {sheenLighting+=sheenLobe(n,v,l,sheenRoughness)*incident;}
    if(coatWeight>0.0) {coating+=clearcoatLobe(nc,v,l,coatRoughness,coatCompensation)*incident;}
  }
  for (var i = 0u; i < u32(scene.counts.y); i++) {
    let lightData = scene.spots[i];
    let delta = lightData.positionRange.xyz-input.world;
    let l = safeNormal(delta);
    let cone = smoothstep(lightData.directionOuter.w,lightData.inner.x,dot(-l,lightData.directionOuter.xyz));
    let incident = lightData.colorIntensity.rgb*lightData.colorIntensity.w*attenuation(length(delta),lightData.positionRange.w)*cone*spotShadow(i,input.world,input.normal);
    color+=brdf(n,v,l,base,metal,rough,f0,f90,compensation,remaining,transmission,tangent,bitangent)*sheenLightRetention(dot(n,l),sheenRoughness,sheenMax,sheenEnergy)*incident;
    if (sheenMax > 0.0) { sheenLighting += sheenLobe(n,v,l,sheenRoughness)*incident; }
    if(coatWeight>0.0) {coating+=clearcoatLobe(nc,v,l,coatRoughness,coatCompensation)*incident;}
  }
  if (transmission > 0.0 && metal < 1.0) {
    let ray = safeNormal(refract(-v,n,1.0/max(mesh.transmission.w,1.0)));
    let localLength = length(vec3f(dot(input.local0,ray),dot(input.local1,ray),dot(input.local2,ray)));
    let distance = select(0.0,thickness/max(localLength,0.000001),localLength > 0.0);
    var uv = input.position.xy/vec2f(textureDimensions(backgroundMap));
    if (distance > 0.0) {
      let exit = scene.viewProjection*vec4f(input.world+ray*distance,1.0);
      if (exit.w > 0.000001) { uv = exit.xy/exit.w*vec2f(0.5,-0.5)+vec2f(0.5); }
    }
    var transmitted = roughTransmission(uv,rough,mesh.transmission.w);
    var attenuationPath=vec3f(distance);
    if (mesh.finish[1].z > 0.0 && thickness > 0.0) {
      let spread=(mesh.transmission.w-1.0)*min(mesh.finish[1].z,10.0)/40.0;
      for (var channel=0u;channel<3u;channel+=2u) {
        let ior=max(1.0,mesh.transmission.w+(f32(channel)-1.0)*spread);
        let spectralRay=safeNormal(refract(-v,n,1.0/ior));
        let local=length(vec3f(dot(input.local0,spectralRay),dot(input.local1,spectralRay),dot(input.local2,spectralRay)));
        let path=select(0.0,thickness/max(local,0.000001),local>0.0);
        let exit=scene.viewProjection*vec4f(input.world+spectralRay*path,1.0);
        var spectralUV=uv;
        if (exit.w>0.000001) { spectralUV=exit.xy/exit.w*vec2f(0.5,-0.5)+vec2f(0.5); }
        transmitted[channel]=roughTransmission(spectralUV,rough,ior)[channel];
        attenuationPath[channel]=path;
      }
    }
    if (distance > 0.0 && mesh.transmission.z > 0.0) { transmitted *= pow(mesh.attenuation.rgb,attenuationPath*mesh.transmission.z); }
    color+=transmitted*base*transmission*(1.0-metal)*remaining*sheenRetention;
  }
  color+=sheenTint*sheenLighting;
  if (mesh.maps.w > 1.5) {
    let baked = decodeSRGB(textureSample(emissiveMap, emissiveSampler, materialUV(input, 4u)).rgb);
    color *= mix(vec3f(1.0), baked, mesh.finish[3].w);
  }
  color += emission;
  if(coatWeight>0.0) {color=color*(1.0-coatWeight*coatEnergy)+coating*coatWeight;}
  if (scene.counts.z < 0.5) { color = encodeSRGB(color); }
  return vec4f(applyFog(color*opacity,opacity,input.world),select(opacity,coverageAlpha,coverage));
}
${oitWeightWGSL}
@fragment fn fragmentMain(input: VertexOutput, @builtin(front_facing) front: bool) -> @location(0) vec4f {
  let color = shadeMesh(input,front);
  if (mesh.sheenMaps.w > 0.5 && mesh.material.x > 0.5) { return vec4f(color.rgb,color.a*mesh.fade.x); }
  return color * mesh.fade.x;
}
struct OITOutput {
  @location(0) accumulation: vec4f,
  @location(1) revealage: vec4f,
};
@fragment fn oitFragment(input: VertexOutput, @builtin(front_facing) front: bool) -> OITOutput {
  let color=shadeMesh(input,front) * mesh.fade.x;
  let weight=transparencyWeight(color.a,input.position.z);
  var output: OITOutput;
  output.accumulation=color*weight;
  output.revealage=vec4f(color.a);
  return output;
}
struct SkyOutput {
  @builtin(position) position: vec4f,
  @location(0) ndc: vec2f,
};
@vertex fn skyVertex(@builtin(vertex_index) index: u32) -> SkyOutput {
  var corners = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: SkyOutput;
  output.position = vec4f(corners[index], 1.0, 1.0);
  output.ndc = corners[index];
  return output;
}
@fragment fn skyFragment(input: SkyOutput) -> @location(0) vec4f {
  // Two points on the pixel's ray work for perspective and orthographic cameras alike.
  let nearPoint = scene.invViewProjection * vec4f(input.ndc, 0.0, 1.0);
  let farPoint = scene.invViewProjection * vec4f(input.ndc, 1.0, 1.0);
  let direction = safeNormal(farPoint.xyz / farPoint.w - nearPoint.xyz / nearPoint.w);
  var color = textureSampleLevel(backgroundMap, environmentSampler, equirectUV(direction), 0.0).rgb * scene.envParams.w;
  if (scene.counts.z < 0.5) { color = encodeSRGB(color); }
  return vec4f(color, 1.0);
}
`;

function definesHook(source: string, name: string): boolean {
  return new RegExp(
    `(?:^|[;{}\\n])\\s*(?:fn\\s+${name}|(?:void|vec[234]|float|XYZVertex|XYZPhysical)\\s+${name})\\s*\\(`,
    'm',
  ).test(source);
}

/** Compose native hook declarations, not a shader-language translator. */
export function nativeMeshWGSL(source: string, physical = false): string {
  const marker = (name: string) => ({
    start: webgpuMeshShader.indexOf(`/* XYZ_${name} */`),
    end:
      webgpuMeshShader.indexOf(`/* XYZ_${name}_END */`) +
      `/* XYZ_${name}_END */`.length,
  });
  const hooks = marker('NATIVE_HOOKS');
  const fallback = marker('PHYSICAL_DEFAULT');
  if (physical && !definesHook(source, 'xyzPhysical'))
    throw new GraphicsError(
      'NativePBRMaterial requires a xyzPhysical native hook.',
    );
  // Physical hooks are additive. Unreplaced deform/opacity defaults stay in every pass.
  const kept = !physical
    ? ''
    : `${
        definesHook(source, 'xyzDeform')
          ? ''
          : `fn xyzDeform(position: vec3f, normal: vec3f, uv: vec2f) -> XYZVertex {
  return XYZVertex(position, normal);
}
`
      }${
        definesHook(source, 'xyzSurface')
          ? ''
          : `fn xyzSurface(world: vec3f, normal: vec3f, uv: vec2f, texel: vec4f) -> vec4f {
  return texel;
}
`
      }`;
  // Physical materials own the PBR maps; basic native materials rename them to xyzMap0..3.
  const composed =
    webgpuMeshShader.slice(0, hooks.start) +
    kept +
    source +
    webgpuMeshShader.slice(hooks.end, fallback.start) +
    (physical ? '' : webgpuMeshShader.slice(fallback.start, fallback.end)) +
    webgpuMeshShader.slice(fallback.end);
  if (physical) return composed;
  return composed
    .replaceAll('metallicRoughnessMap', 'xyzMap0')
    .replaceAll('normalMap', 'xyzMap1')
    .replaceAll('occlusionMap', 'xyzMap2')
    .replaceAll('emissiveMap', 'xyzMap3')
    .replaceAll('metallicRoughnessSampler', 'xyzSampler0')
    .replaceAll('normalSampler', 'xyzSampler1')
    .replaceAll('occlusionSampler', 'xyzSampler2')
    .replaceAll('emissiveSampler', 'xyzSampler3');
}
