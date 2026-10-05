export const reflectionProbeWGSL=`
fn reflectionWeights(position: vec3f) -> vec4f {
  var weights = vec4f(0.0);
  for (var i = 0u; i < 4u; i++) {
    let probe = mesh.probes[i];
    let edge = min(position - probe.min.xyz, probe.max.xyz - position);
    let distance = min(min(edge.x, edge.y), edge.z);
    if (probe.params.y > 0.5 && distance > 0.0) {
      weights[i] = smoothstep(0.0, probe.min.w, distance);
    }
  }
  return weights / max(dot(weights, vec4f(1.0)), 1.0);
}
fn probeReflection(position: vec3f, direction: vec3f, probe: ProbeUniforms) -> vec3f {
  if (probe.params.w < 0.5 || any(position < probe.min.xyz) || any(position > probe.max.xyz)) { return direction; }
  var far = vec3f(1e20);
  for (var axis = 0u; axis < 3u; axis++) {
    if (abs(direction[axis]) > 0.000001) {
      let wall = select(probe.min[axis], probe.max[axis], direction[axis] > 0.0);
      far[axis] = (wall-position[axis])/direction[axis];
    }
  }
  let distance = min(min(far.x,far.y),far.z);
  let reflected = position + direction*max(distance,0.0) - probe.position.xyz;
  if (dot(reflected,reflected) < 1e-12) { return direction; }
  return reflected;
}
fn reflectionRadiance(position: vec3f, direction: vec3f, roughness: f32, weights: vec4f) -> vec3f {
  let baseline = max(0.0, 1.0-dot(weights,vec4f(1.0)));
  var result = textureSampleLevel(environmentMap,environmentSampler,equirectUV(direction),0,roughness*mesh.envParams.z).rgb*mesh.envParams.x*baseline;
  for (var i = 0u; i < 4u; i++) {
    if (weights[i] > 0.0) {
      let probe = mesh.probes[i];
      result += textureSampleLevel(environmentMap,environmentSampler,equirectUV(probeReflection(position,direction,probe)),i32(i+1u),roughness*probe.params.z).rgb*probe.params.x*weights[i];
    }
  }
  return result;
}
fn reflectionIrradiance(n: vec3f, weights: vec4f) -> vec3f {
  let basis = array<f32,9>(0.282095,0.488603*n.y,0.488603*n.z,0.488603*n.x,1.092548*n.x*n.y,1.092548*n.y*n.z,0.315392*(3.0*n.z*n.z-1.0),1.092548*n.x*n.z,0.546274*(n.x*n.x-n.y*n.y));
  var global = vec3f(0.0);
  for (var j = 0u; j < 9u; j++) { global += mesh.envSH[j].rgb*basis[j]; }
  var result = max(global,vec3f(0.0))*mesh.envParams.x*max(0.0,1.0-dot(weights,vec4f(1.0)));
  for (var i = 0u; i < 4u; i++) {
    if (weights[i] <= 0.0) { continue; }
    var local = vec3f(0.0);
    for (var j = 0u; j < 9u; j++) { local += mesh.probes[i].sh[j].rgb*basis[j]; }
    result += max(local,vec3f(0.0))*mesh.probes[i].params.x*weights[i];
  }
  return result;
}
`;export const reflectionProbeGLSL=`
vec2 equirectUV(vec3 direction);
vec4 reflectionWeights(vec3 position) {
  vec4 weights = vec4(0.0);
  for (int i=0;i<4;i++) {
    int start=i*13;
    vec4 params=probeData[start+9], low=probeData[start+10];
    vec3 edge=min(position-low.xyz,probeData[start+11].xyz-position);
    float distance=min(min(edge.x,edge.y),edge.z);
    if (params.y > .5 && distance > 0.0) weights[i]=smoothstep(0.0,low.w,distance);
  }
  return weights/max(dot(weights,vec4(1.0)),1.0);
}
vec3 probeReflection(vec3 position, vec3 direction, int index) {
  int start=index*13;
  vec3 low=probeData[start+10].xyz, high=probeData[start+11].xyz;
  if (probeData[start+9].w < .5 || any(lessThan(position,low)) || any(greaterThan(position,high))) return direction;
  vec3 far=vec3(1e20);
  for (int axis=0;axis<3;axis++) {
    if (abs(direction[axis]) > .000001) {
      float wall=direction[axis] > 0.0 ? high[axis] : low[axis];
      far[axis]=(wall-position[axis])/direction[axis];
    }
  }
  float distance=min(min(far.x,far.y),far.z);
  vec3 reflected=position+direction*max(distance,0.0)-probeData[start+12].xyz;
  return dot(reflected,reflected) < 1e-12 ? direction : reflected;
}
vec3 reflectionRadiance(vec3 position, vec3 direction, float roughness, vec4 weights) {
  float baseline=max(0.0,1.0-dot(weights,vec4(1.0)));
  vec3 result=textureLod(environmentMap,vec3(equirectUV(direction),0.0),roughness*environment[9].z).rgb*environment[9].x*baseline;
  for (int i=0;i<4;i++) {
    if (weights[i] > 0.0) {
      vec4 params=probeData[i*13+9];
      result+=textureLod(environmentMap,vec3(equirectUV(probeReflection(position,direction,i)),float(i+1)),roughness*params.z).rgb*params.x*weights[i];
    }
  }
  return result;
}
vec3 reflectionIrradiance(vec3 n, vec4 weights) {
  float basis[9]=float[9](0.282095,0.488603*n.y,0.488603*n.z,0.488603*n.x,1.092548*n.x*n.y,1.092548*n.y*n.z,0.315392*(3.0*n.z*n.z-1.0),1.092548*n.x*n.z,0.546274*(n.x*n.x-n.y*n.y));
  vec3 global=vec3(0.0);
  for (int j=0;j<9;j++) global+=environment[j].rgb*basis[j];
  vec3 result=max(global,vec3(0.0))*environment[9].x*max(0.0,1.0-dot(weights,vec4(1.0)));
  for (int i=0;i<4;i++) {
    if (weights[i] <= 0.0) continue;
    vec3 local=vec3(0.0);
    for (int j=0;j<9;j++) local+=probeData[i*13+j].rgb*basis[j];
    result+=max(local,vec3(0.0))*probeData[i*13+9].x*weights[i];
  }
  return result;
}
`;
//# sourceMappingURL=reflection-probe-shaders.js.map
