//#region dist/src/data/rendering-gpu.js
/** Bounded weights avoid rapidly overflowing half-float accumulation targets. */
var oitSettings = /* @__PURE__ */ Object.freeze({
	scale: 100,
	minWeight: .01,
	maxWeight: 30
});
/** A lost WebGL2 context not restored within this window becomes a fatal GraphicsError. */
var graphicsRecoveryLimits = /* @__PURE__ */ Object.freeze({ restoreTimeoutMs: 1e4 });
var reflectionCaptureLimits = /* @__PURE__ */ Object.freeze({
	size: 64,
	maximumSize: 512,
	maximumBytes: 67108864,
	interval: 1
});
/** Bound driver program residency and protect the inexpensive default PBR source. */
var meshShaderVariantLimits = /* @__PURE__ */ Object.freeze({
	maxEntries: 64,
	plainFragmentMaxBytes: 4e4
});
/** Bounded opt-in material anti-aliasing, shared by both native shaders. */
var materialQuality = /* @__PURE__ */ Object.freeze({
	samples: 4,
	normalVarianceScale: 2,
	maxNormalVariance: .18,
	minAlphaFootprint: 1e-4,
	sheenSamples: 32
});
var motionBlurDefaults = /* @__PURE__ */ Object.freeze({
	perObject: false,
	velocityDepthTolerance: 1e-5,
	strength: 1,
	samples: 12,
	maximumSamples: 32,
	maxRadius: 32,
	maximumRadius: 64
});
//#endregion
exports.graphicsRecoveryLimits = graphicsRecoveryLimits;
exports.materialQuality = materialQuality;
exports.meshShaderVariantLimits = meshShaderVariantLimits;
exports.motionBlurDefaults = motionBlurDefaults;
exports.oitSettings = oitSettings;
exports.reflectionCaptureLimits = reflectionCaptureLimits;

//# sourceMappingURL=rendering-gpu.cjs.map