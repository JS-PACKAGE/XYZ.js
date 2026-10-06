/** Native hooks deliberately leave Fresnel, environment lighting and transmission to PBR. */
export const waterWGSL = /* wgsl */ `
fn waterHeight(p: vec2f) -> f32 {
  var height = 0.0;
  for (var i = 0u; i < u32(mesh.custom[0].x); i++) {
    let wave = mesh.custom[1u + i];
    height += wave.z * sin(dot(wave.xy, p) + mesh.custom[9u + i / 4u][i % 4u]);
  }
  return height;
}
fn xyzDeform(position: vec3f, normal: vec3f, uv: vec2f) -> XYZVertex {
  var slope = vec2f(0.0);
  for (var i = 0u; i < u32(mesh.custom[0].y); i++) {
    let wave = mesh.custom[1u + i];
    slope += wave.xy * wave.z * cos(dot(wave.xy, position.xz) + mesh.custom[9u + i / 4u][i % 4u]);
  }
  return XYZVertex(position + vec3f(0.0, waterHeight(position.xz), 0.0),
    normalize(vec3f(-slope.x, 1.0, -slope.y)));
}
fn xyzPhysical(world: vec3f, normal: vec3f, uv: vec2f, surface: XYZPhysical) -> XYZPhysical {
  var result = surface;
  let p = (uv - vec2f(0.5)) * mesh.custom[11].xy;
  let foam = mesh.custom[0].z * smoothstep(mesh.custom[0].w,
    mesh.custom[0].w + mesh.custom[11].z, waterHeight(p));
  result.base = mix(result.base, vec3f(1.0), foam);
  result.roughness = mix(result.roughness, 0.9, foam);
  return result;
}
`;

export const waterGLSL = /* glsl */ `
float waterHeight(vec2 p) {
  float height = 0.0;
  for (int i = 0; i < int(xyzUniforms[0].x); i++) {
    vec4 wave = xyzUniforms[1 + i];
    height += wave.z * sin(dot(wave.xy, p) + xyzUniforms[9 + i / 4][i % 4]);
  }
  return height;
}
#ifdef XYZ_VERTEX
XYZVertex xyzDeform(vec3 position, vec3 normal, vec2 uv) {
  vec2 slope = vec2(0.0);
  for (int i = 0; i < int(xyzUniforms[0].y); i++) {
    vec4 wave = xyzUniforms[1 + i];
    slope += wave.xy * wave.z * cos(dot(wave.xy, position.xz) + xyzUniforms[9 + i / 4][i % 4]);
  }
  return XYZVertex(position + vec3(0.0, waterHeight(position.xz), 0.0),
    normalize(vec3(-slope.x, 1.0, -slope.y)));
}
#endif
#ifdef XYZ_FRAGMENT
XYZPhysical xyzPhysical(vec3 world, vec3 normal, vec2 uv, XYZPhysical surface) {
  vec2 p = (uv - vec2(0.5)) * xyzUniforms[11].xy;
  float foam = xyzUniforms[0].z * smoothstep(xyzUniforms[0].w,
    xyzUniforms[0].w + xyzUniforms[11].z, waterHeight(p));
  surface.base = mix(surface.base, vec3(1.0), foam);
  surface.roughness = mix(surface.roughness, 0.9, foam);
  return surface;
}
#endif
`;
