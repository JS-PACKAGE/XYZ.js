const require_errors = require("./errors.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
//#region dist/packages/graphics/src/native-material-limits.js
function validateNativeMaterialGPU(n) {
	let r = [
		[`maxVertexAttributes`, 14],
		[`maxVertexBuffers`, 6],
		[`maxBindGroups`, 4],
		[`maxSampledTexturesPerShaderStage`, 16],
		[`maxSamplersPerShaderStage`, 13],
		[`maxStorageBuffersPerShaderStage`, 1],
		[`maxUniformBuffersPerShaderStage`, 4],
		[`maxUniformBufferBindingSize`, require_rendering.SHADOW_FLOAT_COUNT * 4]
	];
	for (let [t, i] of r) if (Number(n[t]) < i) throw new require_errors.GraphicsError(`NativeMaterial3D requires WebGPU ${t} >= ${i}; device reports ${n[t]}.`);
}
function validateNativeMaterialGL(n) {
	let r = [
		[
			n.MAX_VERTEX_ATTRIBS,
			14,
			`vertex attributes`
		],
		[
			n.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
			6,
			`vertex texture units`
		],
		[
			n.MAX_TEXTURE_IMAGE_UNITS,
			16,
			`fragment texture units`
		],
		[
			n.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
			17,
			`combined texture units`
		],
		[
			n.MAX_UNIFORM_BLOCK_SIZE,
			require_rendering.SHADOW_FLOAT_COUNT * 4,
			`uniform block bytes`
		]
	];
	for (let [t, i, a] of r) {
		let r = n.getParameter(t);
		if (r < i) throw new require_errors.GraphicsError(`NativeMaterial3D requires WebGL2 ${a} >= ${i}; device reports ${r}.`);
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
		if (i !== `ShadowData` && i !== `SheenLookup`) throw new require_errors.GraphicsError(`NativeMaterial3D uniform block ${i} is outside the fixed ABI.`);
	}
}
//#endregion
exports.validateNativeMaterialGL = validateNativeMaterialGL;
exports.validateNativeMaterialGLResources = validateNativeMaterialGLResources;
exports.validateNativeMaterialGPU = validateNativeMaterialGPU;

//# sourceMappingURL=native-material-limits.cjs.map