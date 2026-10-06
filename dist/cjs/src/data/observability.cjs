//#region dist/src/data/observability.js
var profilerDefaults = Object.freeze({
	windowFrames: 240,
	maximumWindowFrames: 65536,
	hitchMilliseconds: 50
});
var gpuTimingDefaults = Object.freeze({
	maxInFlight: 4,
	maxInFlightLimit: 32,
	maxTimedPasses: 128,
	warmupFrames: 120,
	sampleInterval: 1
});
Object.freeze({
	tailSamples: 32,
	minimumTrendSamples: 12,
	minimumTrendSeconds: 60,
	plateauAbsoluteBytes: 8388608,
	plateauRelativeFraction: .05,
	growthBytesPerMinute: 1048576,
	memorySampleSeconds: 5,
	longDurationSeconds: 3600,
	longTaskMilliseconds: 50,
	traceBufferKiB: 8192
});
Object.freeze({
	native: {
		cpuRate: 1,
		latencyMs: 0,
		downloadBytesPerSecond: -1,
		uploadBytesPerSecond: -1
	},
	"simulated-low-tier": {
		cpuRate: 4,
		latencyMs: 150,
		downloadBytesPerSecond: 2e5,
		uploadBytesPerSecond: 9e4
	},
	"simulated-low-tier-heavy": {
		cpuRate: 6,
		latencyMs: 300,
		downloadBytesPerSecond: 9e4,
		uploadBytesPerSecond: 45e3
	}
});
Object.freeze({
	navigationWorkBudget: 512,
	navigationConcurrentSearches: 4,
	routeIntervalSeconds: 2,
	gpuPhaseHistoryFrames: 256,
	networkPayloadBytes: 65536,
	bakeColumns: 16,
	bakeRows: 16,
	bakeCellSize: 20
});
var productionWorkload = Object.freeze({
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
Object.freeze({
	baseline: productionWorkload,
	low: Object.freeze({
		...productionWorkload,
		width: 960,
		height: 540,
		sprites2D: 384,
		transparentSprites2D: 64,
		meshes3D: 128,
		transparentMeshes3D: 32,
		pointLights: 4,
		spotLights: 2,
		overlaySprites3D: 32
	}),
	high: Object.freeze({
		...productionWorkload,
		width: 1920,
		height: 1080,
		sprites2D: 1536,
		transparentSprites2D: 256,
		meshes3D: 512,
		transparentMeshes3D: 128,
		pointLights: 16,
		spotLights: 8,
		overlaySprites3D: 128
	})
});
Object.freeze({
	revision: 4,
	denseColliders: 96,
	denseRadius: 32,
	navigationColumns: 48,
	navigationRows: 48,
	navigationConcurrentSearches: 8,
	navigationWorkBudget: 512,
	visibleMeshes: 256,
	invisibleMeshes: 4096,
	mutationIntervalFrames: 60,
	maximumWallSeconds: 300,
	minimumSteadySeconds: 5,
	minimumLoadingSeconds: 2,
	teardownMaximumMs: 5e3
});
Object.freeze({
	minimumRuns: 3,
	defaultRuns: 5,
	maximumRuns: 20,
	relativeMargin: .25,
	absoluteMarginMs: 2,
	hitchFractionMargin: .02
});
//#endregion
exports.gpuTimingDefaults = gpuTimingDefaults;
exports.productionWorkload = productionWorkload;
exports.profilerDefaults = profilerDefaults;

//# sourceMappingURL=observability.cjs.map