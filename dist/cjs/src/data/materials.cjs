//#region dist/src/data/materials.js
var proceduralMaterialLimits = Object.freeze({
	minSize: 32,
	maxSize: 1024,
	defaultSize: 256,
	defaultSeed: 1
});
var proceduralMaterialPresets = Object.freeze({
	wood: Object.freeze({
		dark: [
			65,
			30,
			13
		],
		light: [
			188,
			120,
			57
		],
		roughness: .62,
		relief: .012
	}),
	brick: Object.freeze({
		dark: [
			109,
			43,
			29
		],
		light: [
			195,
			98,
			65
		],
		roughness: .87,
		relief: .025
	}),
	stone: Object.freeze({
		dark: [
			66,
			72,
			73
		],
		light: [
			169,
			173,
			164
		],
		roughness: .88,
		relief: .035
	}),
	metal: Object.freeze({
		dark: [
			96,
			110,
			120
		],
		light: [
			192,
			201,
			208
		],
		roughness: .3,
		relief: .002
	}),
	fabric: Object.freeze({
		dark: [
			23,
			46,
			69
		],
		light: [
			93,
			136,
			163
		],
		roughness: .93,
		relief: .006
	}),
	marble: Object.freeze({
		dark: [
			58,
			70,
			82
		],
		light: [
			232,
			231,
			217
		],
		roughness: .23,
		relief: .003
	}),
	concrete: Object.freeze({
		dark: [
			78,
			80,
			82
		],
		light: [
			176,
			176,
			170
		],
		roughness: .78,
		relief: .008
	}),
	tiles: Object.freeze({
		dark: [
			168,
			92,
			58
		],
		light: [
			236,
			214,
			186
		],
		roughness: .16,
		relief: .012
	}),
	leather: Object.freeze({
		dark: [
			62,
			28,
			16
		],
		light: [
			154,
			86,
			48
		],
		roughness: .55,
		relief: .004
	}),
	sand: Object.freeze({
		dark: [
			166,
			132,
			78
		],
		light: [
			232,
			208,
			150
		],
		roughness: .92,
		relief: .006
	}),
	rust: Object.freeze({
		dark: [
			42,
			36,
			32
		],
		light: [
			176,
			72,
			28
		],
		roughness: .72,
		relief: .015
	}),
	snow: Object.freeze({
		dark: [
			186,
			198,
			208
		],
		light: [
			248,
			250,
			252
		],
		roughness: .28,
		relief: .01
	})
});
var proceduralTileMeters = Object.freeze({
	wood: .2,
	brick: .24,
	stone: .5,
	metal: .15,
	fabric: .08,
	marble: .6,
	concrete: .8,
	tiles: .3,
	leather: .12,
	sand: .4,
	rust: .2,
	snow: 1
});
//#endregion
exports.proceduralMaterialLimits = proceduralMaterialLimits;
exports.proceduralMaterialPresets = proceduralMaterialPresets;
exports.proceduralTileMeters = proceduralTileMeters;

//# sourceMappingURL=materials.cjs.map