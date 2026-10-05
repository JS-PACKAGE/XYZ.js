const require_shaders = require("./webgpu-2d/shaders.cjs");
const require_shaders$1 = require("./webgl-2d/shaders.cjs");
//#region dist/packages/graphics/src/render-graph-shaders.js
function graphWGSL(t, n) {
	let r = ``;
	for (let e = 1; e < n; e++) r += `@group(0) @binding(${e + 1}) var inputTexture${e}: texture_2d<f32>;\nfn sampleInput${e}(uv: vec2f) -> vec4f { return textureSampleLevel(inputTexture${e}, inputSampler, uv, 0.0); }\n`;
	return require_shaders.postWGSL(r + t);
}
function graphGLSL(e, r) {
	let i = ``;
	for (let e = 1; e < r; e++) i += `uniform sampler2D image${e};\nvec4 sampleInput${e}(vec2 uv) { return texture(image${e}, vec2(uv.x, 1.0-uv.y)); }\n`;
	return {
		vertex: require_shaders$1.layerVertex,
		fragment: require_shaders$1.processorFragment(i + e)
	};
}
var graphIdentityWGSL = `fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f { return color; }`;
var graphIdentityGLSL = `vec4 effect(vec4 color, vec2 uv, vec2 screen) { return color; }`;
//#endregion
exports.graphGLSL = graphGLSL;
exports.graphIdentityGLSL = graphIdentityGLSL;
exports.graphIdentityWGSL = graphIdentityWGSL;
exports.graphWGSL = graphWGSL;

//# sourceMappingURL=render-graph-shaders.cjs.map