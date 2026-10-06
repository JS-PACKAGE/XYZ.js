//#region dist/src/data/water.js
var water3DDefaults = {
	width: 10,
	depth: 10,
	segments: 64,
	maxSegments: 512,
	maxWaves: 8,
	minimumLength: 1e-4,
	maximumLength: 1e6,
	maximumAmplitude: 1e6,
	maximumSpeed: 1e4,
	boundsMargin: 1e-6,
	foamThresholdFraction: .6,
	foamFadeFraction: .3,
	color: [
		.12,
		.35,
		.4
	],
	roughness: .08,
	ior: 1.333,
	transmission: .85,
	thickness: .5,
	attenuationColor: [
		.55,
		.85,
		.9
	],
	attenuationDistance: 5
};
var water3DWaves = [{
	direction: [1, .3],
	amplitude: .12,
	wavelength: 4,
	speed: 1.1
}, {
	direction: [-.4, 1],
	amplitude: .06,
	wavelength: 2.3,
	speed: -1.4
}];
var water3DNormalWaves = [{
	direction: [.7, 1],
	amplitude: .012,
	wavelength: .45,
	speed: 2.1
}, {
	direction: [-1, .2],
	amplitude: .008,
	wavelength: .3,
	speed: -2.7
}];
//#endregion
exports.water3DDefaults = water3DDefaults;
exports.water3DNormalWaves = water3DNormalWaves;
exports.water3DWaves = water3DWaves;

//# sourceMappingURL=water.cjs.map