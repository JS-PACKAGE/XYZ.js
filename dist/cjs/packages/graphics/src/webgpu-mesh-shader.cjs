const require_rendering = require("../../../src/data/rendering.cjs");
const require_shadow_shaders = require("./shadow-shaders.cjs");
const require_sheen_shaders = require("./sheen-shaders.cjs");
const require_transmission_shaders = require("./transmission-shaders.cjs");
const require_reflection_probe_shaders = require("./reflection-probe-shaders.cjs");
const require_oit_shaders = require("./oit-shaders.cjs");
//#region dist/packages/graphics/src/webgpu-mesh-shader.js
var webgpuMeshShader = `
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
  points: array<PointLight, 32>,
  spots: array<SpotLight, 32>,
  pointIds: array<vec4f, 8>,
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
  sheenMaps: vec4f,
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
  custom: array<vec4f, ${require_rendering.nativeMaterial3DLimits.uniformFloats / 4}>,
  fade: vec4f,
  coordinates: array<vec4f, ${require_rendering.materialTextureSlots.length * 2}>,
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
${require_shadow_shaders.atlasWGSL}
${require_sheen_shaders.sheenWGSL}
${require_transmission_shaders.transmissionWGSL}
${require_reflection_probe_shaders.reflectionProbeWGSL}
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
/* XYZ_NATIVE_HOOKS */
fn xyzDeform(position: vec3f, normal: vec3f, uv: vec2f) -> XYZVertex {
  return XYZVertex(position, normal);
}
fn xyzSurface(world: vec3f, normal: vec3f, uv: vec2f, texel: vec4f) -> vec4f {
  return texel;
}
/* XYZ_NATIVE_HOOKS_END */
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
// Karis' analytic split-sum approximation; avoids a BRDF lookup texture.
fn environmentBRDF(nv: f32, rough: f32) -> vec2f {
  let c0 = vec4f(-1.0, -0.0275, -0.572, 0.022);
  let c1 = vec4f(1.0, 0.0425, 1.04, -0.04);
  let r = rough * c0 + c1;
  let a004 = min(r.x * r.x, exp2(-9.28 * nv)) * r.x + r.y;
  return vec2f(-1.04, 1.04) * a004 + r.zw;
}
fn attenuation(distance: f32, range: f32) -> f32 {
  var falloff = 1.0;
  if (range > 0.0) { falloff = pow(max(1.0 - pow(distance / range, 4.0), 0.0), 2.0); }
  return falloff / max(distance * distance, 0.01);
}
fn brdf(n: vec3f, v: vec3f, l: vec3f, base: vec3f, metal: f32, rough: f32, dielectricF0: vec3f, weight: f32, transmission: f32) -> vec3f {
  let h = safeNormal(v+l);
  let nl = max(dot(n,l),0.0);
  let nv = max(dot(n,v),0.000001);
  let nh = max(dot(n,h),0.0);
  let vh = max(dot(v,h),0.0);
  let alpha = rough*rough;
  let alpha2 = alpha*alpha;
  let denominator = nh*nh*(alpha2-1.0)+1.0;
  let distribution = alpha2 / max(3.14159265359*denominator*denominator,0.000001);
  let k = (rough+1.0)*(rough+1.0)/8.0;
  let geometry = (nv/(nv*(1.0-k)+k))*(nl/(nl*(1.0-k)+k));
  let grazing = pow(1.0-vh,5.0);
  let dielectric = dielectricF0 + (vec3f(weight)-dielectricF0)*select(grazing,0.0,mesh.specularParams.y > 0.5);
  let fresnel = mix(dielectric,base+(vec3f(1.0)-base)*grazing,metal);
  let specular = distribution*geometry*fresnel/max(4.0*nv*nl,0.000001);
  let diffuse = (1.0-max(max(dielectric.r,dielectric.g),dielectric.b))*(1.0-metal)*(1.0-transmission)*base/3.14159265359;
  return (diffuse+specular)*nl;
}
// Clearcoat Fresnel is applied by the layer, including attenuation of emission.
fn clearcoatLobe(n: vec3f, v: vec3f, l: vec3f, rough: f32) -> f32 {
  let nl = max(dot(n,l),0.0);
  let nv = max(dot(n,v),0.000001);
  let nh = max(dot(n,safeNormal(v+l)),0.0);
  let alpha2 = rough*rough*rough*rough;
  let denominator = nh*nh*(alpha2-1.0)+1.0;
  let distribution = alpha2/max(3.14159265359*denominator*denominator,0.000001);
  let k = (rough+1.0)*(rough+1.0)/8.0;
  let geometry = (nv/(nv*(1.0-k)+k))*(nl/(nl*(1.0-k)+k));
  return distribution*geometry*nl/max(4.0*nv*nl,0.000001);
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
  var dx = vec3f(0.0); var dy = vec3f(0.0);
  var du = vec2f(0.0); var dv = vec2f(0.0);
  if (mesh.maps.y > 0.5) {
    mappedNormal = textureSample(normalMap, normalSampler, materialUV(input,2u)).xyz * 2.0 - 1.0;
  }
  if (mesh.maps.y > 0.5 || (mesh.clearcoat.x > 0.0 && mesh.clearcoatMaps.z > 0.5)) {
    dx = dpdx(input.world); dy = -dpdy(input.world);
    du = dpdx(materialUV(input,2u)); dv = -dpdy(materialUV(input,2u));
  }
  var ao = 1.0;
  if (mesh.maps.z > 0.5) { ao = textureSample(occlusionMap, occlusionSampler, materialUV(input,3u)).r; }
  var emission = vec3f(1.0);
  if (mesh.maps.w > 0.5) { emission = textureSample(emissiveMap, emissiveSampler, materialUV(input,4u)).rgb; }
  let effectiveFront = front == (input.orientation > 0.0);
  let masked = mesh.settings.w > 0.5 && mesh.settings.w < 1.5;
  if ((!effectiveFront && (mesh.settings.y < 0.5 || mesh.transmission.y > 0.0)) || (masked && sampledAlpha < mesh.settings.x)) { discard; }
  let base = decodeSRGB(texel.rgb)*mesh.tint.rgb*input.color.rgb;
  let metal = clamp(mesh.material.y*select(1.0,mr.b,mesh.maps.x > 0.5),0.0,1.0);
  let rough = clamp(mesh.material.z*select(1.0,mr.g,mesh.maps.x > 0.5),0.04,1.0);
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
    let scale = inverseSqrt(max(max(dot(tangent,tangent),dot(bitangent,bitangent)),0.000001));
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
      let coatScale = inverseSqrt(max(max(dot(coatTangent,coatTangent),dot(coatBitangent,coatBitangent)),0.000001));
      let coatFrame = mat3x3f(coatTangent*coatScale,coatBitangent*coatScale,nc);
      let sampled = textureSample(clearcoatNormalMap,clearcoatNormalSampler,coatUV).xyz*2.0-1.0;
      nc = safeNormal(coatFrame*vec3f(sampled.xy*mesh.clearcoat.z,sampled.z));
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
  var coatFresnel = 0.0;
  var coating = vec3f(0.0);
  if (coatWeight > 0.0) { coatFresnel = 0.04+0.96*pow(1.0-clamp(abs(dot(nc,v)),0.0,1.0),5.0); }
  let occlusion = select(1.0,mix(1.0,ao,mesh.emissiveOcclusion.w),mesh.maps.z > 0.5);
  let probeWeights = reflectionWeights(input.world);
  let useEnvironment = mesh.envParams.y > 0.5 || dot(probeWeights,vec4f(1.0)) > 0.0;
  var color = base*(1.0-metal)*(1.0-transmission)*select(max(scene.lightColorAmbient.w,0.0),0.0,useEnvironment)*occlusion;
  if (useEnvironment) {
    let nv = max(dot(n,v),0.0001);
    let ab = environmentBRDF(nv,rough);
    let dielectric = select(dielectricF0*ab.x+vec3f(specularWeight*ab.y),dielectricF0,mesh.specularParams.y > 0.5);
    let specularColor = mix(dielectric,base*ab.x+vec3f(ab.y),metal);
    let radiance = reflectionRadiance(input.world,reflect(-v,n),rough,probeWeights);
    let diffuseLight = reflectionIrradiance(n,probeWeights)*base*(1.0-metal)*(1.0-transmission)*max(1.0-max(max(dielectric.r,dielectric.g),dielectric.b),0.0);
    color += (diffuseLight + radiance*specularColor)*occlusion;
    if (sheenMax > 0.0) {
      let sheenRadiance = reflectionRadiance(input.world,reflect(-v,n),sheenRoughness,probeWeights);
      sheenLighting += sheenRadiance*sheenEnergy*occlusion;
    }
    if (coatWeight > 0.0) {
      let coatAB = environmentBRDF(max(dot(nc,v),0.0001),coatRoughness);
      let coatRadiance = reflectionRadiance(input.world,reflect(-v,nc),coatRoughness,probeWeights);
      coating += coatRadiance*(0.04*coatAB.x+coatAB.y)*occlusion;
    }
  }
  color += brdf(n,v,direction,base,metal,rough,dielectricF0,specularWeight,transmission)*scene.lightColorAmbient.rgb*max(scene.lightDirection.w,0.0)*visibility;
  if (sheenMax > 0.0) { sheenLighting += sheenLobe(n,v,direction,sheenRoughness)*scene.lightColorAmbient.rgb*max(scene.lightDirection.w,0.0)*visibility; }
  if (coatWeight > 0.0) { coating += clearcoatLobe(nc,v,direction,coatRoughness)*coatFresnel*scene.lightColorAmbient.rgb*max(scene.lightDirection.w,0.0)*visibility; }
  for (var i = 0u; i < u32(scene.counts.x); i++) {
    let lightData = scene.points[i];
    let delta = lightData.positionRange.xyz-input.world;
    let incident = lightData.colorIntensity.rgb*lightData.colorIntensity.w*attenuation(length(delta),lightData.positionRange.w)*pointShadow(i,input.world,lightData.positionRange.xyz,input.normal);
    color += brdf(n,v,safeNormal(delta),base,metal,rough,dielectricF0,specularWeight,transmission)*incident;
    if (sheenMax > 0.0) { sheenLighting += sheenLobe(n,v,safeNormal(delta),sheenRoughness)*incident; }
    if (coatWeight > 0.0) { coating += clearcoatLobe(nc,v,safeNormal(delta),coatRoughness)*coatFresnel*incident; }
  }
  for (var i = 0u; i < u32(scene.counts.y); i++) {
    let lightData = scene.spots[i];
    let delta = lightData.positionRange.xyz-input.world;
    let l = safeNormal(delta);
    let cone = smoothstep(lightData.directionOuter.w,lightData.inner.x,dot(-l,lightData.directionOuter.xyz));
    let incident = lightData.colorIntensity.rgb*lightData.colorIntensity.w*attenuation(length(delta),lightData.positionRange.w)*cone*spotShadow(i,input.world,input.normal);
    color += brdf(n,v,l,base,metal,rough,dielectricF0,specularWeight,transmission)*incident;
    if (sheenMax > 0.0) { sheenLighting += sheenLobe(n,v,l,sheenRoughness)*incident; }
    if (coatWeight > 0.0) { coating += clearcoatLobe(nc,v,l,coatRoughness)*coatFresnel*incident; }
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
    if (distance > 0.0 && mesh.transmission.z > 0.0) { transmitted *= pow(mesh.attenuation.rgb,vec3f(distance*mesh.transmission.z)); }
    let ab = environmentBRDF(max(dot(n,v),0.0001),rough);
    let fresnel = select(dielectricF0*ab.x+vec3f(specularWeight*ab.y),dielectricF0,mesh.specularParams.y > 0.5);
    color += transmitted*base*transmission*(1.0-metal)*max(1.0-max(max(fresnel.r,fresnel.g),fresnel.b),0.0);
  }
  if (sheenMax > 0.0) { color = color*(1.0-sheenMax*sheenEnergy)+sheenTint*sheenLighting; }
  color += mesh.emissiveOcclusion.rgb*select(vec3f(1.0),decodeSRGB(emission),mesh.maps.w > 0.5);
  if (coatWeight > 0.0) { color = color*(1.0-coatWeight*coatFresnel)+coating*coatWeight; }
  if (scene.counts.z < 0.5) { color = encodeSRGB(color); }
  return vec4f(applyFog(color*opacity,opacity,input.world),opacity);
}
${require_oit_shaders.oitWeightWGSL}
@fragment fn fragmentMain(input: VertexOutput, @builtin(front_facing) front: bool) -> @location(0) vec4f {
  return shadeMesh(input,front) * mesh.fade.x;
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
function nativeMeshWGSL(e) {
	let t = webgpuMeshShader.indexOf(`/* XYZ_NATIVE_HOOKS */`), n = webgpuMeshShader.indexOf(`/* XYZ_NATIVE_HOOKS_END */`) + 26;
	return (webgpuMeshShader.slice(0, t) + e + webgpuMeshShader.slice(n)).replaceAll(`metallicRoughnessMap`, `xyzMap0`).replaceAll(`normalMap`, `xyzMap1`).replaceAll(`occlusionMap`, `xyzMap2`).replaceAll(`emissiveMap`, `xyzMap3`).replaceAll(`metallicRoughnessSampler`, `xyzSampler0`).replaceAll(`normalSampler`, `xyzSampler1`).replaceAll(`occlusionSampler`, `xyzSampler2`).replaceAll(`emissiveSampler`, `xyzSampler3`);
}
//#endregion
exports.nativeMeshWGSL = nativeMeshWGSL;
exports.webgpuMeshShader = webgpuMeshShader;

//# sourceMappingURL=webgpu-mesh-shader.cjs.map