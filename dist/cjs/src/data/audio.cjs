//#region dist/src/data/audio.js
var audioDefaults = Object.freeze({
	voiceCount: 8,
	lookahead: .1,
	tickMs: 25,
	releaseGuard: .02,
	gainSmoothing: .005,
	effectCrossfade: .02,
	effectsPerBus: 16,
	impulseValues: 576e4,
	impulseSampleRate: 192e3,
	duckAttack: .02,
	duckRelease: .2,
	controlLead: .02
});
//#endregion
exports.audioDefaults = audioDefaults;

//# sourceMappingURL=audio.cjs.map