const require_errors = require("./errors.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_brdf = require("../../../src/data/brdf.cjs");
//#region dist/packages/graphics/src/native-material-limits.js
var r = Math.max(require_rendering.SHADOW_FLOAT_COUNT * 4, require_brdf.ggxDirectionalAlbedo.byteLength);
function validateNativeMaterialGPU(t) {
	let n = [
		[`maxVertexAttributes`, 14],
		[`maxVertexBuffers`, 6],
		[`maxBindGroups`, 4],
		[`maxSampledTexturesPerShaderStage`, 16],
		[`maxSamplersPerShaderStage`, 13],
		[`maxStorageBuffersPerShaderStage`, 1],
		[`maxUniformBuffersPerShaderStage`, 5],
		[`maxUniformBufferBindingSize`, r]
	];
	for (let [r, i] of n) if (Number(t[r]) < i) throw new require_errors.GraphicsError(`NativeMaterial3D requires WebGPU ${r} >= ${i}; device reports ${t[r]}.`);
}
function validateNativeMaterialGL(t) {
	let n = [
		[
			t.MAX_VERTEX_ATTRIBS,
			14,
			`vertex attributes`
		],
		[
			t.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
			6,
			`vertex texture units`
		],
		[
			t.MAX_TEXTURE_IMAGE_UNITS,
			16,
			`fragment texture units`
		],
		[
			t.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
			17,
			`combined texture units`
		],
		[
			t.MAX_UNIFORM_BLOCK_SIZE,
			r,
			`uniform block bytes`
		],
		[
			t.MAX_FRAGMENT_UNIFORM_BLOCKS,
			3,
			`fragment uniform blocks`
		],
		[
			t.MAX_UNIFORM_BUFFER_BINDINGS,
			3,
			`uniform buffer bindings`
		]
	];
	for (let [r, i, a] of n) {
		let n = t.getParameter(r);
		if (n < i) throw new require_errors.GraphicsError(`NativeMaterial3D requires WebGL2 ${a} >= ${i}; device reports ${n}.`);
	}
}
function validateNativeMaterialGLResources(t, n, r) {
	let i = t.getProgramParameter(n, t.ACTIVE_UNIFORMS);
	for (let a = 0; a < i; a++) {
		let i = t.getActiveUniform(n, a);
		if (i && t.getUniformLocation(n, i.name) !== null && !r.includes(i.name)) throw new require_errors.GraphicsError(`NativeMaterial3D resource ${i.name} is outside the fixed ABI; use xyzUniforms/xyzMap0..3.`);
	}
	let a = t.getProgramParameter(n, t.ACTIVE_UNIFORM_BLOCKS);
	for (let r = 0; r < a; r++) {
		let i = t.getActiveUniformBlockName(n, r);
		if (i !== `ShadowData` && i !== `SheenLookup` && i !== `GGXLookup`) throw new require_errors.GraphicsError(`NativeMaterial3D uniform block ${i} is outside the fixed ABI.`);
	}
}
//#endregion
exports.validateNativeMaterialGL = validateNativeMaterialGL;
exports.validateNativeMaterialGLResources = validateNativeMaterialGLResources;
exports.validateNativeMaterialGPU = validateNativeMaterialGPU;

//# sourceMappingURL=native-material-limits.cjs.map