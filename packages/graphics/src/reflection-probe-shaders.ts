export const reflectionProbeWGSL = /* wgsl */ `
fn probeReflection(position: vec3f, direction: vec3f) -> vec3f {
  if (mesh.envParams.w < 0.5 || any(position < mesh.probeMin.xyz) || any(position > mesh.probeMax.xyz)) { return direction; }
  var far = vec3f(1e20);
  for (var axis = 0u; axis < 3u; axis++) {
    if (abs(direction[axis]) > 0.000001) {
      let wall = select(mesh.probeMin[axis],mesh.probeMax[axis],direction[axis] > 0.0);
      far[axis] = (wall-position[axis])/direction[axis];
    }
  }
  let distance = min(min(far.x,far.y),far.z);
  let reflected = position + direction*max(distance,0.0) - mesh.probePosition.xyz;
  if (dot(reflected,reflected) < 1e-12) { return direction; }
  return reflected;
}
`;

export const reflectionProbeGLSL = /* glsl */ `
vec3 probeReflection(vec3 position, vec3 direction) {
  if (!probeBoxProjection || any(lessThan(position,probeMin)) || any(greaterThan(position,probeMax))) return direction;
  vec3 far = vec3(1e20);
  for (int axis=0;axis<3;axis++) {
    if (abs(direction[axis]) > .000001) {
      float wall = direction[axis] > 0.0 ? probeMax[axis] : probeMin[axis];
      far[axis] = (wall-position[axis])/direction[axis];
    }
  }
  float distance = min(min(far.x,far.y),far.z);
  vec3 reflected = position + direction*max(distance,0.0) - probePosition;
  return dot(reflected,reflected) < 1e-12 ? direction : reflected;
}
`;
