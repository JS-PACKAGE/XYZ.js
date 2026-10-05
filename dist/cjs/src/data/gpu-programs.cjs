//#region dist/src/data/gpu-programs.js
var computeLimits = Object.freeze({
	sourceCharacters: 65536,
	bindings: 8,
	bufferBytes: 67108864,
	residentBytes: 268435456,
	buffers: 128,
	programs: 64,
	workgroupInvocations: 256,
	workgroupDimension: 256,
	dispatchDimension: 65535
});
var renderGraphLimits = Object.freeze({
	targets: 32,
	passes: 64,
	inputs: 8,
	dimension: 16384,
	targetBytes: 268435456
});
//#endregion
exports.computeLimits = computeLimits;
exports.renderGraphLimits = renderGraphLimits;

//# sourceMappingURL=gpu-programs.cjs.map