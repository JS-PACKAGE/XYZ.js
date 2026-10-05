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
	})
});
//#endregion
exports.proceduralMaterialLimits = proceduralMaterialLimits;
exports.proceduralMaterialPresets = proceduralMaterialPresets;

//# sourceMappingURL=materials.cjs.map