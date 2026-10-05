//#region dist/src/data/rendering.js
var nativeMaterial3DLimits = Object.freeze({
	uniformFloats: 64,
	textures: 4,
	sourceCharacters: 65536
});
var materialQuality = Object.freeze({
	samples: 4,
	normalVarianceScale: 2,
	maxNormalVariance: .18,
	minAlphaFootprint: 1e-4,
	sheenSamples: 32
});
var materialTextureSlots = Object.freeze([
	`texture`,
	`metallicRoughness`,
	`normal`,
	`occlusion`,
	`emissive`,
	`specular`,
	`specularColor`,
	`clearcoat`,
	`clearcoatRoughness`,
	`clearcoatNormal`,
	`sheenColor`,
	`sheenRoughness`,
	`transmission`,
	`thickness`
]);
var MATERIAL_UV_FLOAT_COUNT = materialTextureSlots.length * 8;
var oitSettings = Object.freeze({
	scale: 100,
	minWeight: .01,
	maxWeight: 30
});
var environmentLimits = Object.freeze({
	maxWidth: 2048,
	minHeight: 4,
	maxMips: 7,
	proxyWidth: 64,
	prefilterSamples: 128,
	prefilterWidth: 256
});
var graphicsRecoveryLimits = Object.freeze({ restoreTimeoutMs: 1e4 });
Object.freeze({
	pointLights: 32,
	spotLights: 32
});
var shadowLimits = Object.freeze({
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
var SHADOW_FLOAT_COUNT = 48 + shadowLimits.maps * 16 + 4;
var fxaaDefaults = Object.freeze({
	enabled: !1,
	minimumContrast: .0312,
	relativeContrast: .125,
	directionReduction: .125,
	minimumReduction: 1 / 128,
	maximumSpan: 8
});
var depthPostDefaults = Object.freeze({
	ssao: !1,
	ssaoRadius: .75,
	ssaoStrength: 1,
	ssaoBias: .02,
	depthOfField: !1,
	dofFocusDistance: 10,
	dofFocusRange: 2,
	dofBlurRadius: 8,
	maximumBlurRadius: 64,
	ssaoDirections: 8,
	ssaoRings: 2,
	dofSamples: 24,
	dofGoldenAngle: 2.399963229728653
});
var transmissionBlurFraction = .04;
var decalNormalOffset = .001;
var advancedPostDefaults = Object.freeze({
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
var reflectionCaptureLimits = Object.freeze({
	size: 64,
	maximumSize: 512,
	maximumBytes: 67108864,
	interval: 1
});
//#endregion
exports.MATERIAL_UV_FLOAT_COUNT = MATERIAL_UV_FLOAT_COUNT;
exports.SHADOW_FLOAT_COUNT = SHADOW_FLOAT_COUNT;
exports.advancedPostDefaults = advancedPostDefaults;
exports.decalNormalOffset = decalNormalOffset;
exports.depthPostDefaults = depthPostDefaults;
exports.environmentLimits = environmentLimits;
exports.fxaaDefaults = fxaaDefaults;
exports.graphicsRecoveryLimits = graphicsRecoveryLimits;
exports.materialQuality = materialQuality;
exports.materialTextureSlots = materialTextureSlots;
exports.nativeMaterial3DLimits = nativeMaterial3DLimits;
exports.oitSettings = oitSettings;
exports.reflectionCaptureLimits = reflectionCaptureLimits;
exports.shadowLimits = shadowLimits;
exports.transmissionBlurFraction = transmissionBlurFraction;

//# sourceMappingURL=rendering.cjs.map