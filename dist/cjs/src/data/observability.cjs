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
//#endregion
exports.gpuTimingDefaults = gpuTimingDefaults;
exports.profilerDefaults = profilerDefaults;

//# sourceMappingURL=observability.cjs.map