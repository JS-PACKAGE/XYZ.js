//#region dist/src/data/rendering.js
/** CPU static-lighting work/storage quotas; caller requests can only lower hard caps. */
var bakedLightingLimits = /* @__PURE__ */ Object.freeze({
	size: 128,
	maxSize: 1024,
	padding: 2,
	maxPadding: 16,
	samples: 32,
	maxSamples: 512,
	maxTriangles: 65536,
	maxRays: 8e6,
	maxLights: 256,
	bias: .001,
	aoDistance: 2,
	resolution: [
		4,
		4,
		4
	],
	maxProbes: 4096
});
/** Fixed native shader ABI and bounded authored source size. */
var nativeMaterial3DLimits = /* @__PURE__ */ Object.freeze({
	uniformFloats: 64,
	textures: 4,
	sourceCharacters: 65536
});
/**
* Preserve the published normalized finish thickness; native packing uses nanometers. Kept
* here, beside the other native material ABI values, so packing it does not pull the
* procedural material presets into every startup bundle.
*/
var iridescenceFilmRange = /* @__PURE__ */ Object.freeze({
	minNm: 100,
	maxNm: 800
});
/** Bounded opt-in material anti-aliasing, shared by both native shaders. */
var materialQuality = /* @__PURE__ */ Object.freeze({
	samples: 4,
	normalVarianceScale: 2,
	maxNormalVariance: .18,
	minAlphaFootprint: 1e-4,
	sheenSamples: 32
});
/** Stable per-map UV uniform order: two vec4 values per affine coordinate mapping. */
var materialTextureSlots = /* @__PURE__ */ Object.freeze([
	"texture",
	"metallicRoughness",
	"normal",
	"occlusion",
	"emissive",
	"specular",
	"specularColor",
	"clearcoat",
	"clearcoatRoughness",
	"clearcoatNormal",
	"sheenColor",
	"sheenRoughness",
	"transmission",
	"thickness"
]);
materialTextureSlots.length * 8;
/** Bounded weights avoid rapidly overflowing half-float accumulation targets. */
var oitSettings = /* @__PURE__ */ Object.freeze({
	scale: 100,
	minWeight: .01,
	maxWeight: 30
});
var environmentLimits = /* @__PURE__ */ Object.freeze({
	/** Equirect width cap; height is width / 2. */
	maxWidth: 2048,
	minHeight: 4,
	maxMips: 7,
	/** Area-averaged diffuse SH proxy, independent of specular filtering. */
	proxyWidth: 64,
	/** Deterministic GGX ray budget and maximum filtered output width. */
	prefilterSamples: 128,
	prefilterWidth: 256
});
/** A lost WebGL2 context not restored within this window becomes a fatal GraphicsError. */
var graphicsRecoveryLimits = /* @__PURE__ */ Object.freeze({ restoreTimeoutMs: 1e4 });
var shadowLimits = /* @__PURE__ */ Object.freeze({
	cascades: 4,
	pointLights: 8,
	spotLights: 8,
	maps: 60,
	mapSize: 1024,
	near: .1,
	far: 50,
	cascadeDistance: 100,
	cascadeLambda: .5,
	cascadeBlend: .1,
	slopeBias: 1,
	maximumSlopeBias: .05
});
/** Shadow atlas header (12 vec4), matrices, then quality controls (one vec4). */
var SHADOW_FLOAT_COUNT = 48 + shadowLimits.maps * 16 + 4;
var fxaaDefaults = /* @__PURE__ */ Object.freeze({
	enabled: false,
	minimumContrast: .0312,
	relativeContrast: .125,
	directionReduction: .125,
	minimumReduction: 1 / 128,
	maximumSpan: 8
});
var depthPostDefaults = /* @__PURE__ */ Object.freeze({
	ssao: false,
	ssaoRadius: .75,
	ssaoStrength: 1,
	ssaoBias: .02,
	depthOfField: false,
	dofFocusDistance: 10,
	dofFocusRange: 2,
	dofBlurRadius: 8,
	maximumBlurRadius: 64,
	ssaoDirections: 8,
	ssaoRings: 2,
	dofSamples: 24,
	dofGoldenAngle: 2.399963229728653
});
/** Screen-space rough transmission uses a bounded nine-tap approximation. */
var transmissionBlurFraction = .04;
/** World-space lift at decal creation; later receiver scaling also scales this baked lift. */
var decalNormalOffset = .001;
/** Bounded temporal/ray-march work and dynamic capture memory. */
var advancedPostDefaults = /* @__PURE__ */ Object.freeze({
	taaHistoryWeight: .9,
	taaDepthThreshold: .01,
	taaCameraCutDistance: 5,
	ssrSteps: 48,
	ssrThickness: .2,
	ssrMaxDistance: 30,
	ssrRoughness: .15,
	ssrStrength: 1,
	maximumSSRSteps: 128
});
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
/** Bound single-view scene readback and automatic caller-driven update pacing. */
var planarReflectionLimits = /* @__PURE__ */ Object.freeze({
	size: 128,
	maximumSize: 512,
	interval: .1,
	minimumInterval: 1 / 120,
	clipBias: .001
});
var volumetricPostDefaults = /* @__PURE__ */ Object.freeze({
	density: .025,
	heightFalloff: .15,
	maxDistance: 200,
	shaftStrength: .25,
	fogSamples: 16,
	shaftSamples: 32,
	maximumSamples: 64
});
var lensFlareDefaults = /* @__PURE__ */ Object.freeze({
	strength: .15,
	threshold: 1,
	ghosts: 4,
	maximumGhosts: 8,
	spacing: .5,
	haloRadius: .3,
	haloWidth: .15
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
exports.SHADOW_FLOAT_COUNT = SHADOW_FLOAT_COUNT;
exports.advancedPostDefaults = advancedPostDefaults;
exports.bakedLightingLimits = bakedLightingLimits;
exports.decalNormalOffset = decalNormalOffset;
exports.depthPostDefaults = depthPostDefaults;
exports.environmentLimits = environmentLimits;
exports.fxaaDefaults = fxaaDefaults;
exports.graphicsRecoveryLimits = graphicsRecoveryLimits;
exports.iridescenceFilmRange = iridescenceFilmRange;
exports.lensFlareDefaults = lensFlareDefaults;
exports.materialQuality = materialQuality;
exports.materialTextureSlots = materialTextureSlots;
exports.meshShaderVariantLimits = meshShaderVariantLimits;
exports.motionBlurDefaults = motionBlurDefaults;
exports.nativeMaterial3DLimits = nativeMaterial3DLimits;
exports.oitSettings = oitSettings;
exports.planarReflectionLimits = planarReflectionLimits;
exports.reflectionCaptureLimits = reflectionCaptureLimits;
exports.shadowLimits = shadowLimits;
exports.transmissionBlurFraction = transmissionBlurFraction;
exports.volumetricPostDefaults = volumetricPostDefaults;

//# sourceMappingURL=rendering.cjs.map