//#region dist/src/data/observability.js
var profilerDefaults = /* @__PURE__ */ Object.freeze({
	windowFrames: 240,
	maximumWindowFrames: 65536,
	hitchMilliseconds: 50
});
/** Opt-in query pools stay bounded even when the GPU/readback falls behind. */
var gpuTimingDefaults = /* @__PURE__ */ Object.freeze({
	maxInFlight: 4,
	maxInFlightLimit: 32,
	maxTimedPasses: 128,
	warmupFrames: 120,
	sampleInterval: 1
});
/** Reproducible authored workloads, not universal hardware/FPS promises. */
var productionWorkload = /* @__PURE__ */ Object.freeze({
	width: 1280,
	height: 720,
	pixelRatio: 1,
	warmupFrames: 120,
	measuredFrames: 600,
	loadStageFrames: 180,
	textures: 8,
	sprites2D: 768,
	transparentSprites2D: 128,
	meshes3D: 256,
	transparentMeshes3D: 64,
	pointLights: 8,
	spotLights: 4,
	overlaySprites3D: 64,
	hitchMilliseconds: 50
});
({ ...productionWorkload }), { ...productionWorkload };
//#endregion
exports.gpuTimingDefaults = gpuTimingDefaults;
exports.productionWorkload = productionWorkload;
exports.profilerDefaults = profilerDefaults;

//# sourceMappingURL=observability.cjs.map