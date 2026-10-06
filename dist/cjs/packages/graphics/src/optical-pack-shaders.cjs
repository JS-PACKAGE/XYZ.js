//#region dist/packages/graphics/src/optical-pack-shaders.js
var opticalPackWGSL = `
@group(0) @binding(0) var image: texture_2d<f32>;
@group(0) @binding(1) var packed: texture_storage_2d_array<rgba8unorm,write>;
fn pack(id: vec3u, layer: i32) {
  let size = textureDimensions(packed);
  if (id.x >= size.x || id.y >= size.y) { return; }
  let native = textureDimensions(image);
  let index = id.y*size.x+id.x;
  var value = vec4f(0.0);
  if (index < native.x*native.y) {
    value = textureLoad(image,vec2i(i32(index%native.x),i32(index/native.x)),0);
  }
  textureStore(packed,vec2i(id.xy),layer,value);
}
@compute @workgroup_size(8,8) fn transmission(@builtin(global_invocation_id) id: vec3u) { pack(id,0); }
@compute @workgroup_size(8,8) fn thickness(@builtin(global_invocation_id) id: vec3u) { pack(id,1); }
@compute @workgroup_size(8,8) fn anisotropy(@builtin(global_invocation_id) id: vec3u) { pack(id,2); }
@compute @workgroup_size(8,8) fn iridescence(@builtin(global_invocation_id) id: vec3u) { pack(id,3); }
@compute @workgroup_size(8,8) fn iridescenceThickness(@builtin(global_invocation_id) id: vec3u) { pack(id,4); }
`;
var opticalPackGLSL = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D image;
uniform int side;
out vec4 color;
void main() {
  ivec2 native = textureSize(image,0);
  ivec2 p = ivec2(gl_FragCoord.xy);
  int index = p.y*side+p.x;
  color = index < native.x*native.y ? texelFetch(image,ivec2(index%native.x,index/native.x),0) : vec4(0.0);
}`;
//#endregion
exports.opticalPackGLSL = opticalPackGLSL;
exports.opticalPackWGSL = opticalPackWGSL;

//# sourceMappingURL=optical-pack-shaders.cjs.map