//#region dist/src/data/materials.js
var proceduralMaterialLimits = Object.freeze({
	minSize: 32,
	maxSize: 1024,
	defaultSize: 256,
	defaultSeed: 1,
	cacheDefaultBytes: 67108864,
	cacheMaxBytes: 1073741824,
	cacheDefaultEntries: 32,
	cacheMaxEntries: 4096
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
	}),
	asphalt: Object.freeze({
		dark: [
			22,
			25,
			27
		],
		light: [
			115,
			117,
			112
		],
		roughness: .88,
		relief: .003
	}),
	gravel: Object.freeze({
		dark: [
			38,
			34,
			29
		],
		light: [
			185,
			173,
			148
		],
		roughness: .82,
		relief: .025
	}),
	cobblestone: Object.freeze({
		dark: [
			43,
			46,
			44
		],
		light: [
			173,
			174,
			160
		],
		roughness: .79,
		relief: .022
	}),
	bark: Object.freeze({
		dark: [
			29,
			19,
			13
		],
		light: [
			151,
			111,
			69
		],
		roughness: .9,
		relief: .025
	}),
	moss: Object.freeze({
		dark: [
			17,
			34,
			10
		],
		light: [
			123,
			153,
			48
		],
		roughness: .92,
		relief: .018
	}),
	mud: Object.freeze({
		dark: [
			34,
			24,
			16
		],
		light: [
			144,
			110,
			70
		],
		roughness: .84,
		relief: .012
	}),
	granite: Object.freeze({
		dark: [
			30,
			29,
			28
		],
		light: [
			229,
			220,
			205
		],
		roughness: .36,
		relief: .0015
	}),
	slate: Object.freeze({
		dark: [
			24,
			34,
			43
		],
		light: [
			99,
			119,
			132
		],
		roughness: .8,
		relief: .012
	}),
	terrazzo: Object.freeze({
		dark: [
			46,
			43,
			39
		],
		light: [
			235,
			228,
			211
		],
		roughness: .22,
		relief: 8e-4
	}),
	denim: Object.freeze({
		dark: [
			13,
			28,
			54
		],
		light: [
			148,
			171,
			192
		],
		roughness: .88,
		relief: .0035
	}),
	burlap: Object.freeze({
		dark: [
			48,
			33,
			18
		],
		light: [
			204,
			173,
			119
		],
		roughness: .94,
		relief: .012
	}),
	carpet: Object.freeze({
		dark: [
			48,
			25,
			24
		],
		light: [
			174,
			91,
			75
		],
		roughness: .96,
		relief: .016
	}),
	plaster: Object.freeze({
		dark: [
			167,
			158,
			142
		],
		light: [
			247,
			243,
			231
		],
		roughness: .85,
		relief: .003
	}),
	terracotta: Object.freeze({
		dark: [
			102,
			36,
			21
		],
		light: [
			206,
			116,
			72
		],
		roughness: .86,
		relief: .006
	}),
	cork: Object.freeze({
		dark: [
			53,
			30,
			13
		],
		light: [
			206,
			158,
			91
		],
		roughness: .92,
		relief: .008
	}),
	rubber: Object.freeze({
		dark: [
			13,
			15,
			16
		],
		light: [
			66,
			70,
			72
		],
		roughness: .82,
		relief: .0015
	}),
	carbonfiber: Object.freeze({
		dark: [
			8,
			10,
			12
		],
		light: [
			67,
			72,
			78
		],
		roughness: .3,
		relief: .0012
	}),
	diamondplate: Object.freeze({
		dark: [
			102,
			111,
			119
		],
		light: [
			222,
			228,
			233
		],
		roughness: .36,
		relief: .012
	}),
	paper: Object.freeze({
		dark: [
			185,
			174,
			150
		],
		light: [
			255,
			251,
			236
		],
		roughness: .91,
		relief: .0015
	}),
	corrugatedcardboard: Object.freeze({
		dark: [
			91,
			55,
			27
		],
		light: [
			202,
			161,
			103
		],
		roughness: .94,
		relief: .006
	}),
	creasedpaper: Object.freeze({
		dark: [
			169,
			157,
			133
		],
		light: [
			252,
			246,
			224
		],
		roughness: .9,
		relief: .0025
	}),
	layeredpaper: Object.freeze({
		dark: [
			139,
			121,
			91
		],
		light: [
			242,
			226,
			192
		],
		roughness: .93,
		relief: .003
	}),
	wicker: Object.freeze({
		dark: [
			48,
			28,
			12
		],
		light: [
			215,
			173,
			111
		],
		roughness: .68,
		relief: .018
	}),
	bamboo: Object.freeze({
		dark: [
			99,
			65,
			20
		],
		light: [
			229,
			194,
			105
		],
		roughness: .48,
		relief: .003
	}),
	hammeredmetal: Object.freeze({
		dark: [
			117,
			51,
			26
		],
		light: [
			239,
			167,
			105
		],
		roughness: .3,
		relief: .009
	}),
	galvanized: Object.freeze({
		dark: [
			103,
			119,
			133
		],
		light: [
			229,
			236,
			240
		],
		roughness: .34,
		relief: .001
	}),
	corrugatedmetal: Object.freeze({
		dark: [
			110,
			124,
			135
		],
		light: [
			224,
			232,
			238
		],
		roughness: .29,
		relief: .025
	}),
	perforatedmetal: Object.freeze({
		dark: [
			62,
			68,
			74
		],
		light: [
			202,
			210,
			216
		],
		roughness: .35,
		relief: .016
	}),
	expandedmetal: Object.freeze({
		dark: [
			54,
			60,
			66
		],
		light: [
			186,
			195,
			203
		],
		roughness: .4,
		relief: .02
	}),
	wiremesh: Object.freeze({
		dark: [
			58,
			62,
			68
		],
		light: [
			198,
			206,
			212
		],
		roughness: .33,
		relief: .004
	}),
	velvet: Object.freeze({
		dark: [
			46,
			10,
			28
		],
		light: [
			166,
			48,
			88
		],
		roughness: .62,
		relief: .0012
	}),
	terrycloth: Object.freeze({
		dark: [
			150,
			146,
			138
		],
		light: [
			250,
			248,
			242
		],
		roughness: .95,
		relief: .006
	}),
	boucle: Object.freeze({
		dark: [
			122,
			100,
			76
		],
		light: [
			233,
			216,
			188
		],
		roughness: .92,
		relief: .005
	}),
	geode: Object.freeze({
		dark: [
			26,
			20,
			46
		],
		light: [
			176,
			156,
			212
		],
		roughness: .4,
		relief: .005
	}),
	quartz: Object.freeze({
		dark: [
			136,
			134,
			140
		],
		light: [
			252,
			250,
			254
		],
		roughness: .16,
		relief: .005
	}),
	pyrite: Object.freeze({
		dark: [
			92,
			74,
			30
		],
		light: [
			236,
			204,
			112
		],
		roughness: .34,
		relief: .006
	}),
	shiplap: Object.freeze({
		dark: [
			88,
			56,
			30
		],
		light: [
			206,
			166,
			112
		],
		roughness: .68,
		relief: .008
	}),
	glassblock: Object.freeze({
		dark: [
			128,
			156,
			168
		],
		light: [
			222,
			238,
			242
		],
		roughness: .14,
		relief: .004
	}),
	thatch: Object.freeze({
		dark: [
			96,
			72,
			32
		],
		light: [
			216,
			184,
			112
		],
		roughness: .9,
		relief: .01
	}),
	charredwood: Object.freeze({
		dark: [
			12,
			11,
			10
		],
		light: [
			72,
			70,
			68
		],
		roughness: .82,
		relief: .012
	}),
	driftwood: Object.freeze({
		dark: [
			86,
			82,
			76
		],
		light: [
			196,
			192,
			184
		],
		roughness: .88,
		relief: .008
	}),
	peelingpaint: Object.freeze({
		dark: [
			70,
			84,
			94
		],
		light: [
			214,
			222,
			218
		],
		roughness: .66,
		relief: .005
	}),
	tiretread: Object.freeze({
		dark: [
			14,
			15,
			16
		],
		light: [
			58,
			62,
			64
		],
		roughness: .72,
		relief: .01
	}),
	honeycomb: Object.freeze({
		dark: [
			128,
			88,
			24
		],
		light: [
			238,
			196,
			92
		],
		roughness: .44,
		relief: .008
	}),
	frost: Object.freeze({
		dark: [
			176,
			200,
			216
		],
		light: [
			250,
			253,
			255
		],
		roughness: .38,
		relief: .004
	}),
	stainedglass: Object.freeze({
		dark: [
			28,
			42,
			86
		],
		light: [
			222,
			176,
			96
		],
		roughness: .18,
		relief: .006
	}),
	soapstone: Object.freeze({
		dark: [
			44,
			52,
			56
		],
		light: [
			166,
			176,
			178
		],
		roughness: .42,
		relief: .003
	}),
	butcherblock: Object.freeze({
		dark: [
			92,
			54,
			22
		],
		light: [
			222,
			172,
			104
		],
		roughness: .58,
		relief: .006
	}),
	wallpaper: Object.freeze({
		dark: [
			58,
			28,
			48
		],
		light: [
			214,
			178,
			186
		],
		roughness: .72,
		relief: .002
	}),
	embroidery: Object.freeze({
		dark: [
			22,
			48,
			62
		],
		light: [
			226,
			176,
			96
		],
		roughness: .86,
		relief: .004
	}),
	macrame: Object.freeze({
		dark: [
			110,
			88,
			62
		],
		light: [
			228,
			210,
			182
		],
		roughness: .88,
		relief: .005
	}),
	brickpaving: Object.freeze({
		dark: [
			88,
			46,
			34
		],
		light: [
			188,
			116,
			88
		],
		roughness: .82,
		relief: .007
	}),
	steppingstone: Object.freeze({
		dark: [
			66,
			70,
			66
		],
		light: [
			174,
			178,
			166
		],
		roughness: .86,
		relief: .008
	}),
	woodendeck: Object.freeze({
		dark: [
			96,
			72,
			42
		],
		light: [
			214,
			182,
			132
		],
		roughness: .74,
		relief: .006
	}),
	cheese: Object.freeze({
		dark: [
			176,
			128,
			32
		],
		light: [
			250,
			220,
			130
		],
		roughness: .52,
		relief: .006
	}),
	sugarfrosting: Object.freeze({
		dark: [
			196,
			128,
			158
		],
		light: [
			252,
			238,
			244
		],
		roughness: .44,
		relief: .004
	}),
	candleswax: Object.freeze({
		dark: [
			176,
			148,
			88
		],
		light: [
			246,
			228,
			176
		],
		roughness: .58,
		relief: .007
	}),
	vinylrecord: Object.freeze({
		dark: [
			12,
			12,
			14
		],
		light: [
			52,
			52,
			58
		],
		roughness: .38,
		relief: .003
	}),
	graphpaper: Object.freeze({
		dark: [
			140,
			168,
			196
		],
		light: [
			250,
			252,
			252
		],
		roughness: .92,
		relief: 8e-4
	}),
	notebookpaper: Object.freeze({
		dark: [
			150,
			172,
			196
		],
		light: [
			252,
			250,
			242
		],
		roughness: .92,
		relief: .001
	}),
	lace: Object.freeze({
		dark: [
			196,
			178,
			172
		],
		light: [
			252,
			244,
			238
		],
		roughness: .62,
		relief: .0028
	}),
	crochet: Object.freeze({
		dark: [
			176,
			150,
			118
		],
		light: [
			238,
			218,
			186
		],
		roughness: .9,
		relief: .005
	}),
	basketweave: Object.freeze({
		dark: [
			128,
			88,
			48
		],
		light: [
			212,
			170,
			112
		],
		roughness: .8,
		relief: .006
	}),
	zipper: Object.freeze({
		dark: [
			70,
			72,
			78
		],
		light: [
			188,
			192,
			200
		],
		roughness: .42,
		relief: .004
	}),
	velcro: Object.freeze({
		dark: [
			38,
			42,
			52
		],
		light: [
			122,
			130,
			145
		],
		roughness: .88,
		relief: .0045
	}),
	button: Object.freeze({
		dark: [
			92,
			78,
			66
		],
		light: [
			232,
			218,
			198
		],
		roughness: .38,
		relief: .0035
	}),
	traintracks: Object.freeze({
		dark: [
			72,
			68,
			62
		],
		light: [
			168,
			162,
			152
		],
		roughness: .68,
		relief: .006
	}),
	manholecover: Object.freeze({
		dark: [
			46,
			48,
			52
		],
		light: [
			128,
			132,
			138
		],
		roughness: .62,
		relief: .005
	}),
	speedbump: Object.freeze({
		dark: [
			52,
			50,
			48
		],
		light: [
			228,
			202,
			62
		],
		roughness: .82,
		relief: .007
	}),
	circuitboard: Object.freeze({
		dark: [
			16,
			48,
			34
		],
		light: [
			196,
			172,
			88
		],
		roughness: .45,
		relief: .0035
	}),
	solarpanel: Object.freeze({
		dark: [
			18,
			30,
			58
		],
		light: [
			96,
			132,
			196
		],
		roughness: .28,
		relief: .003
	}),
	heattile: Object.freeze({
		dark: [
			86,
			82,
			78
		],
		light: [
			212,
			206,
			198
		],
		roughness: .88,
		relief: .005
	}),
	pianokeys: Object.freeze({
		dark: [
			62,
			58,
			54
		],
		light: [
			242,
			238,
			228
		],
		roughness: .32,
		relief: .0028
	}),
	drumskin: Object.freeze({
		dark: [
			92,
			74,
			58
		],
		light: [
			222,
			196,
			158
		],
		roughness: .72,
		relief: .0035
	}),
	gongsurface: Object.freeze({
		dark: [
			112,
			84,
			32
		],
		light: [
			228,
			182,
			96
		],
		roughness: .36,
		relief: .004
	}),
	lensarray: Object.freeze({
		dark: [
			26,
			34,
			46
		],
		light: [
			168,
			196,
			226
		],
		roughness: .22,
		relief: .0028
	}),
	prismtape: Object.freeze({
		dark: [
			122,
			96,
			42
		],
		light: [
			242,
			214,
			122
		],
		roughness: .3,
		relief: .0035
	}),
	fresnel: Object.freeze({
		dark: [
			88,
			116,
			142
		],
		light: [
			212,
			232,
			246
		],
		roughness: .26,
		relief: .004
	}),
	bandage: Object.freeze({
		dark: [
			196,
			182,
			158
		],
		light: [
			252,
			248,
			236
		],
		roughness: .92,
		relief: .0035
	}),
	pillblister: Object.freeze({
		dark: [
			188,
			192,
			198
		],
		light: [
			242,
			244,
			248
		],
		roughness: .3,
		relief: .004
	}),
	sutures: Object.freeze({
		dark: [
			208,
			178,
			158
		],
		light: [
			252,
			232,
			218
		],
		roughness: .68,
		relief: .003
	}),
	trellis: Object.freeze({
		dark: [
			92,
			70,
			46
		],
		light: [
			202,
			172,
			128
		],
		roughness: .78,
		relief: .005
	}),
	terracottapot: Object.freeze({
		dark: [
			142,
			78,
			52
		],
		light: [
			222,
			142,
			106
		],
		roughness: .82,
		relief: .004
	}),
	hedgerow: Object.freeze({
		dark: [
			38,
			62,
			34
		],
		light: [
			122,
			162,
			88
		],
		roughness: .86,
		relief: .006
	}),
	collar: Object.freeze({
		dark: [
			62,
			46,
			92
		],
		light: [
			188,
			164,
			222
		],
		roughness: .62,
		relief: .0035
	}),
	petbed: Object.freeze({
		dark: [
			92,
			72,
			62
		],
		light: [
			214,
			186,
			164
		],
		roughness: .88,
		relief: .005
	}),
	scratchpost: Object.freeze({
		dark: [
			128,
			102,
			62
		],
		light: [
			222,
			194,
			142
		],
		roughness: .84,
		relief: .0055
	}),
	runningtrack: Object.freeze({
		dark: [
			122,
			42,
			38
		],
		light: [
			238,
			228,
			218
		],
		roughness: .88,
		relief: .004
	}),
	bouldermat: Object.freeze({
		dark: [
			38,
			52,
			78
		],
		light: [
			142,
			162,
			198
		],
		roughness: .82,
		relief: .005
	}),
	pooltile: Object.freeze({
		dark: [
			22,
			88,
			122
		],
		light: [
			168,
			222,
			238
		],
		roughness: .3,
		relief: .003
	}),
	envelope: Object.freeze({
		dark: [
			188,
			172,
			142
		],
		light: [
			248,
			238,
			214
		],
		roughness: .82,
		relief: .0028
	}),
	chalkboard: Object.freeze({
		dark: [
			32,
			48,
			44
		],
		light: [
			122,
			142,
			132
		],
		roughness: .72,
		relief: .0035
	}),
	corkboard: Object.freeze({
		dark: [
			142,
			102,
			58
		],
		light: [
			222,
			182,
			122
		],
		roughness: .88,
		relief: .0045
	}),
	snowdrift: Object.freeze({
		dark: [
			178,
			196,
			218
		],
		light: [
			252,
			254,
			255
		],
		roughness: .68,
		relief: .005
	}),
	icicle: Object.freeze({
		dark: [
			152,
			192,
			212
		],
		light: [
			238,
			250,
			254
		],
		roughness: .22,
		relief: .006
	}),
	dewdrops: Object.freeze({
		dark: [
			72,
			112,
			58
		],
		light: [
			182,
			222,
			148
		],
		roughness: .36,
		relief: .003
	}),
	mooncrater: Object.freeze({
		dark: [
			92,
			92,
			102
		],
		light: [
			212,
			212,
			218
		],
		roughness: .82,
		relief: .005
	}),
	starfield: Object.freeze({
		dark: [
			12,
			16,
			42
		],
		light: [
			222,
			232,
			255
		],
		roughness: .42,
		relief: .002
	}),
	nebula: Object.freeze({
		dark: [
			42,
			22,
			62
		],
		light: [
			188,
			132,
			222
		],
		roughness: .52,
		relief: .003
	}),
	pleats: Object.freeze({
		dark: [
			82,
			62,
			92
		],
		light: [
			202,
			172,
			212
		],
		roughness: .72,
		relief: .004
	}),
	shoelace: Object.freeze({
		dark: [
			62,
			52,
			48
		],
		light: [
			222,
			212,
			198
		],
		roughness: .78,
		relief: .0035
	}),
	tassel: Object.freeze({
		dark: [
			92,
			58,
			72
		],
		light: [
			222,
			168,
			188
		],
		roughness: .76,
		relief: .005
	}),
	woksurface: Object.freeze({
		dark: [
			42,
			42,
			46
		],
		light: [
			128,
			130,
			136
		],
		roughness: .38,
		relief: .0028
	}),
	cutlery: Object.freeze({
		dark: [
			92,
			92,
			98
		],
		light: [
			232,
			232,
			236
		],
		roughness: .24,
		relief: .0022
	}),
	choppingboard: Object.freeze({
		dark: [
			142,
			102,
			58
		],
		light: [
			222,
			182,
			122
		],
		roughness: .72,
		relief: .0035
	}),
	faucet: Object.freeze({
		dark: [
			92,
			96,
			102
		],
		light: [
			232,
			236,
			240
		],
		roughness: .22,
		relief: .003
	}),
	showerhead: Object.freeze({
		dark: [
			122,
			128,
			136
		],
		light: [
			222,
			228,
			234
		],
		roughness: .32,
		relief: .0028
	}),
	bathmat: Object.freeze({
		dark: [
			42,
			92,
			92
		],
		light: [
			142,
			202,
			198
		],
		roughness: .86,
		relief: .004
	}),
	blinds: Object.freeze({
		dark: [
			122,
			118,
			112
		],
		light: [
			232,
			228,
			220
		],
		roughness: .62,
		relief: .0035
	}),
	curtain: Object.freeze({
		dark: [
			92,
			62,
			72
		],
		light: [
			212,
			168,
			178
		],
		roughness: .82,
		relief: .004
	}),
	shadecloth: Object.freeze({
		dark: [
			42,
			62,
			42
		],
		light: [
			132,
			172,
			112
		],
		roughness: .86,
		relief: .0028
	}),
	sandstone: Object.freeze({
		dark: [
			133,
			83,
			43
		],
		light: [
			238,
			205,
			150
		],
		roughness: .85,
		relief: .006
	}),
	travertine: Object.freeze({
		dark: [
			139,
			116,
			81
		],
		light: [
			247,
			235,
			205
		],
		roughness: .72,
		relief: .009
	}),
	pumice: Object.freeze({
		dark: [
			101,
			104,
			101
		],
		light: [
			227,
			229,
			222
		],
		roughness: .88,
		relief: .012
	}),
	parquet: Object.freeze({
		dark: [
			48,
			22,
			9
		],
		light: [
			207,
			149,
			78
		],
		roughness: .42,
		relief: .004
	}),
	mosaic: Object.freeze({
		dark: [
			15,
			68,
			77
		],
		light: [
			151,
			218,
			203
		],
		roughness: .18,
		relief: .003
	}),
	hexagontiles: Object.freeze({
		dark: [
			123,
			135,
			145
		],
		light: [
			244,
			240,
			225
		],
		roughness: .24,
		relief: .004
	}),
	knit: Object.freeze({
		dark: [
			58,
			45,
			63
		],
		light: [
			156,
			127,
			158
		],
		roughness: .91,
		relief: .008
	}),
	corduroy: Object.freeze({
		dark: [
			49,
			29,
			16
		],
		light: [
			157,
			111,
			68
		],
		roughness: .9,
		relief: .007
	}),
	felt: Object.freeze({
		dark: [
			49,
			65,
			62
		],
		light: [
			128,
			149,
			140
		],
		roughness: .94,
		relief: .002
	}),
	roofshingles: Object.freeze({
		dark: [
			24,
			27,
			29
		],
		light: [
			105,
			108,
			104
		],
		roughness: .87,
		relief: .018
	}),
	rooftiles: Object.freeze({
		dark: [
			102,
			37,
			22
		],
		light: [
			211,
			115,
			66
		],
		roughness: .72,
		relief: .055
	}),
	stucco: Object.freeze({
		dark: [
			174,
			162,
			139
		],
		light: [
			244,
			235,
			214
		],
		roughness: .9,
		relief: .018
	}),
	lichen: Object.freeze({
		dark: [
			83,
			87,
			76
		],
		light: [
			209,
			214,
			148
		],
		roughness: .92,
		relief: .004
	}),
	leaflitter: Object.freeze({
		dark: [
			42,
			27,
			17
		],
		light: [
			177,
			119,
			58
		],
		roughness: .88,
		relief: .012
	}),
	lotusleaf: Object.freeze({
		dark: [
			17,
			49,
			28
		],
		light: [
			112,
			160,
			85
		],
		roughness: .61,
		relief: .006
	}),
	bananaleaf: Object.freeze({
		dark: [
			18,
			52,
			19
		],
		light: [
			132,
			174,
			66
		],
		roughness: .53,
		relief: .007
	}),
	fernleaf: Object.freeze({
		dark: [
			13,
			39,
			22
		],
		light: [
			89,
			146,
			60
		],
		roughness: .69,
		relief: .005
	}),
	endgrain: Object.freeze({
		dark: [
			82,
			43,
			20
		],
		light: [
			207,
			163,
			99
		],
		roughness: .72,
		relief: .005
	}),
	acousticfoam: Object.freeze({
		dark: [
			12,
			14,
			16
		],
		light: [
			91,
			96,
			101
		],
		roughness: .94,
		relief: .065
	}),
	closedcellfoam: Object.freeze({
		dark: [
			57,
			78,
			91
		],
		light: [
			153,
			176,
			187
		],
		roughness: .86,
		relief: .0018
	}),
	linoleum: Object.freeze({
		dark: [
			48,
			80,
			70
		],
		light: [
			158,
			176,
			133
		],
		roughness: .54,
		relief: 8e-4
	}),
	suede: Object.freeze({
		dark: [
			102,
			64,
			34
		],
		light: [
			207,
			165,
			111
		],
		roughness: .91,
		relief: 7e-4
	}),
	snakeskin: Object.freeze({
		dark: [
			42,
			39,
			19
		],
		light: [
			147,
			139,
			78
		],
		roughness: .57,
		relief: .0024
	}),
	crocodile: Object.freeze({
		dark: [
			28,
			17,
			11
		],
		light: [
			114,
			76,
			43
		],
		roughness: .62,
		relief: .0045
	}),
	herringbone: Object.freeze({
		dark: [
			71,
			61,
			50
		],
		light: [
			182,
			174,
			157
		],
		roughness: .89,
		relief: 7e-4
	}),
	tweed: Object.freeze({
		dark: [
			52,
			39,
			25
		],
		light: [
			165,
			161,
			105
		],
		roughness: .93,
		relief: .0012
	}),
	seersucker: Object.freeze({
		dark: [
			137,
			170,
			194
		],
		light: [
			243,
			239,
			222
		],
		roughness: .86,
		relief: .0015
	}),
	knurledmetal: Object.freeze({
		dark: [
			104,
			112,
			120
		],
		light: [
			223,
			229,
			234
		],
		roughness: .39,
		relief: .0024
	}),
	engineturned: Object.freeze({
		dark: [
			118,
			125,
			132
		],
		light: [
			232,
			236,
			239
		],
		roughness: .31,
		relief: 45e-5
	}),
	goldleaf: Object.freeze({
		dark: [
			163,
			100,
			18
		],
		light: [
			255,
			221,
			112
		],
		roughness: .32,
		relief: 7e-4
	}),
	orangepeel: Object.freeze({
		dark: [
			205,
			68,
			3
		],
		light: [
			255,
			159,
			19
		],
		roughness: .43,
		relief: .0025
	}),
	coconut: Object.freeze({
		dark: [
			53,
			27,
			12
		],
		light: [
			166,
			114,
			61
		],
		roughness: .91,
		relief: .003
	}),
	watermelon: Object.freeze({
		dark: [
			17,
			49,
			17
		],
		light: [
			133,
			166,
			57
		],
		roughness: .36,
		relief: 6e-4
	}),
	limestone: Object.freeze({
		dark: [
			151,
			137,
			112
		],
		light: [
			246,
			237,
			211
		],
		roughness: .76,
		relief: .0014
	}),
	breccia: Object.freeze({
		dark: [
			89,
			61,
			48
		],
		light: [
			202,
			193,
			175
		],
		roughness: .68,
		relief: .003
	}),
	gneiss: Object.freeze({
		dark: [
			48,
			51,
			53
		],
		light: [
			224,
			220,
			201
		],
		roughness: .57,
		relief: .0015
	}),
	plywood: Object.freeze({
		dark: [
			105,
			54,
			24
		],
		light: [
			233,
			193,
			130
		],
		roughness: .57,
		relief: 7e-4
	}),
	osb: Object.freeze({
		dark: [
			90,
			54,
			24
		],
		light: [
			226,
			191,
			124
		],
		roughness: .81,
		relief: .0022
	}),
	chipboard: Object.freeze({
		dark: [
			95,
			67,
			35
		],
		light: [
			212,
			181,
			127
		],
		roughness: .84,
		relief: .001
	}),
	wafflecloth: Object.freeze({
		dark: [
			153,
			143,
			124
		],
		light: [
			247,
			240,
			219
		],
		roughness: .91,
		relief: .0018
	}),
	cableknit: Object.freeze({
		dark: [
			106,
			70,
			44
		],
		light: [
			223,
			192,
			145
		],
		roughness: .94,
		relief: .004
	}),
	quilting: Object.freeze({
		dark: [
			36,
			57,
			77
		],
		light: [
			137,
			167,
			188
		],
		roughness: .88,
		relief: .006
	}),
	crackleglaze: Object.freeze({
		dark: [
			56,
			79,
			67
		],
		light: [
			214,
			232,
			210
		],
		roughness: .19,
		relief: .003
	}),
	flutedceramic: Object.freeze({
		dark: [
			166,
			145,
			112
		],
		light: [
			250,
			243,
			222
		],
		roughness: .24,
		relief: .009
	}),
	encaustictiles: Object.freeze({
		dark: [
			63,
			103,
			133
		],
		light: [
			239,
			230,
			204
		],
		roughness: .64,
		relief: .003
	}),
	fishscales: Object.freeze({
		dark: [
			22,
			48,
			56
		],
		light: [
			133,
			173,
			174
		],
		roughness: .42,
		relief: .0016
	}),
	tortoiseshell: Object.freeze({
		dark: [
			31,
			19,
			12
		],
		light: [
			186,
			126,
			53
		],
		roughness: .48,
		relief: .004
	}),
	feathers: Object.freeze({
		dark: [
			52,
			45,
			39
		],
		light: [
			178,
			164,
			143
		],
		roughness: .86,
		relief: .0018
	}),
	reedmat: Object.freeze({
		dark: [
			83,
			79,
			39
		],
		light: [
			232,
			218,
			153
		],
		roughness: .77,
		relief: .0024
	}),
	rope: Object.freeze({
		dark: [
			87,
			55,
			29
		],
		light: [
			224,
			188,
			130
		],
		roughness: .88,
		relief: .004
	}),
	straw: Object.freeze({
		dark: [
			83,
			55,
			18
		],
		light: [
			239,
			207,
			113
		],
		roughness: .9,
		relief: .006
	}),
	studdedrubber: Object.freeze({
		dark: [
			12,
			15,
			17
		],
		light: [
			55,
			61,
			65
		],
		roughness: .83,
		relief: .003
	}),
	groovedrubber: Object.freeze({
		dark: [
			15,
			18,
			20
		],
		light: [
			64,
			70,
			74
		],
		roughness: .81,
		relief: .0024
	}),
	recycledrubber: Object.freeze({
		dark: [
			12,
			16,
			20
		],
		light: [
			110,
			129,
			145
		],
		roughness: .91,
		relief: 8e-4
	}),
	breadcrust: Object.freeze({
		dark: [
			49,
			20,
			8
		],
		light: [
			224,
			159,
			69
		],
		roughness: .84,
		relief: .004
	}),
	wafer: Object.freeze({
		dark: [
			123,
			65,
			22
		],
		light: [
			242,
			205,
			133
		],
		roughness: .79,
		relief: .0016
	}),
	chocolate: Object.freeze({
		dark: [
			24,
			10,
			6
		],
		light: [
			91,
			44,
			25
		],
		roughness: .28,
		relief: .003
	}),
	pretzel: Object.freeze({
		dark: [
			82,
			44,
			22
		],
		light: [
			182,
			128,
			66
		],
		roughness: .58,
		relief: .0045
	}),
	bagel: Object.freeze({
		dark: [
			92,
			58,
			32
		],
		light: [
			212,
			172,
			112
		],
		roughness: .62,
		relief: .004
	}),
	croissant: Object.freeze({
		dark: [
			102,
			58,
			26
		],
		light: [
			232,
			186,
			112
		],
		roughness: .52,
		relief: .0048
	}),
	butterflywing: Object.freeze({
		dark: [
			92,
			38,
			88
		],
		light: [
			232,
			148,
			212
		],
		roughness: .42,
		relief: .0028
	}),
	beetlewing: Object.freeze({
		dark: [
			22,
			62,
			42
		],
		light: [
			112,
			212,
			148
		],
		roughness: .32,
		relief: .003
	}),
	spiderweb: Object.freeze({
		dark: [
			82,
			88,
			96
		],
		light: [
			222,
			228,
			236
		],
		roughness: .42,
		relief: .0022
	}),
	cirrus: Object.freeze({
		dark: [
			122,
			138,
			168
		],
		light: [
			242,
			246,
			252
		],
		roughness: .62,
		relief: .0018
	}),
	cumulus: Object.freeze({
		dark: [
			132,
			142,
			168
		],
		light: [
			250,
			250,
			254
		],
		roughness: .78,
		relief: .0026
	}),
	lightning: Object.freeze({
		dark: [
			18,
			22,
			48
		],
		light: [
			232,
			236,
			255
		],
		roughness: .38,
		relief: .0022
	}),
	kelp: Object.freeze({
		dark: [
			32,
			58,
			34
		],
		light: [
			112,
			168,
			72
		],
		roughness: .42,
		relief: .0035
	}),
	seaweed: Object.freeze({
		dark: [
			38,
			62,
			48
		],
		light: [
			122,
			172,
			118
		],
		roughness: .62,
		relief: .0026
	}),
	anemone: Object.freeze({
		dark: [
			88,
			42,
			62
		],
		light: [
			232,
			128,
			158
		],
		roughness: .52,
		relief: .003
	}),
	candy: Object.freeze({
		dark: [
			122,
			22,
			62
		],
		light: [
			252,
			132,
			172
		],
		roughness: .22,
		relief: .002
	}),
	marshmallow: Object.freeze({
		dark: [
			188,
			148,
			168
		],
		light: [
			252,
			232,
			242
		],
		roughness: .86,
		relief: .003
	}),
	nougat: Object.freeze({
		dark: [
			92,
			62,
			38
		],
		light: [
			232,
			202,
			152
		],
		roughness: .62,
		relief: .0032
	}),
	frostedglass: Object.freeze({
		dark: [
			142,
			158,
			168
		],
		light: [
			222,
			238,
			246
		],
		roughness: .72,
		relief: .0016
	}),
	rippledglass: Object.freeze({
		dark: [
			112,
			138,
			152
		],
		light: [
			212,
			236,
			248
		],
		roughness: .38,
		relief: .0024
	}),
	bubbleglass: Object.freeze({
		dark: [
			122,
			148,
			138
		],
		light: [
			222,
			246,
			238
		],
		roughness: .28,
		relief: .0022
	}),
	saddlestitch: Object.freeze({
		dark: [
			82,
			52,
			32
		],
		light: [
			172,
			122,
			82
		],
		roughness: .58,
		relief: .003
	}),
	tooledleather: Object.freeze({
		dark: [
			92,
			58,
			34
		],
		light: [
			192,
			138,
			92
		],
		roughness: .62,
		relief: .0034
	}),
	patentleather: Object.freeze({
		dark: [
			42,
			22,
			32
		],
		light: [
			152,
			82,
			112
		],
		roughness: .18,
		relief: .0018
	}),
	appleskin: Object.freeze({
		dark: [
			122,
			22,
			32
		],
		light: [
			232,
			112,
			82
		],
		roughness: .36,
		relief: .0018
	}),
	peachskin: Object.freeze({
		dark: [
			132,
			62,
			62
		],
		light: [
			242,
			172,
			132
		],
		roughness: .82,
		relief: .0026
	}),
	grapeskin: Object.freeze({
		dark: [
			58,
			32,
			72
		],
		light: [
			162,
			112,
			182
		],
		roughness: .42,
		relief: .002
	}),
	broccoli: Object.freeze({
		dark: [
			42,
			68,
			38
		],
		light: [
			122,
			172,
			82
		],
		roughness: .78,
		relief: .0034
	}),
	cabbage: Object.freeze({
		dark: [
			72,
			108,
			62
		],
		light: [
			192,
			222,
			152
		],
		roughness: .68,
		relief: .003
	}),
	onion: Object.freeze({
		dark: [
			132,
			92,
			42
		],
		light: [
			232,
			192,
			112
		],
		roughness: .52,
		relief: .0026
	}),
	bedsheet: Object.freeze({
		dark: [
			142,
			148,
			178
		],
		light: [
			232,
			236,
			252
		],
		roughness: .78,
		relief: .0024
	}),
	pillow: Object.freeze({
		dark: [
			162,
			158,
			178
		],
		light: [
			242,
			238,
			252
		],
		roughness: .82,
		relief: .003
	}),
	mattress: Object.freeze({
		dark: [
			102,
			98,
			118
		],
		light: [
			192,
			188,
			212
		],
		roughness: .86,
		relief: .003
	}),
	tealeaf: Object.freeze({
		dark: [
			42,
			62,
			32
		],
		light: [
			122,
			152,
			72
		],
		roughness: .72,
		relief: .003
	}),
	matcha: Object.freeze({
		dark: [
			82,
			108,
			42
		],
		light: [
			182,
			212,
			112
		],
		roughness: .88,
		relief: .002
	}),
	teabag: Object.freeze({
		dark: [
			122,
			102,
			72
		],
		light: [
			232,
			218,
			182
		],
		roughness: .82,
		relief: .0022
	}),
	sanddune: Object.freeze({
		dark: [
			152,
			122,
			72
		],
		light: [
			242,
			218,
			162
		],
		roughness: .72,
		relief: .0024
	}),
	pebblebeach: Object.freeze({
		dark: [
			82,
			84,
			92
		],
		light: [
			182,
			186,
			192
		],
		roughness: .58,
		relief: .003
	}),
	foamedge: Object.freeze({
		dark: [
			112,
			142,
			152
		],
		light: [
			242,
			250,
			252
		],
		roughness: .66,
		relief: .0022
	}),
	lavaflow: Object.freeze({
		dark: [
			52,
			22,
			12
		],
		light: [
			212,
			72,
			22
		],
		roughness: .62,
		relief: .0032
	}),
	cooledlava: Object.freeze({
		dark: [
			42,
			42,
			48
		],
		light: [
			112,
			112,
			122
		],
		roughness: .78,
		relief: .003
	}),
	ashfield: Object.freeze({
		dark: [
			72,
			68,
			72
		],
		light: [
			162,
			156,
			158
		],
		roughness: .9,
		relief: .0022
	}),
	stalactite: Object.freeze({
		dark: [
			92,
			82,
			72
		],
		light: [
			212,
			198,
			172
		],
		roughness: .66,
		relief: .0034
	}),
	flowstone: Object.freeze({
		dark: [
			112,
			92,
			62
		],
		light: [
			232,
			208,
			162
		],
		roughness: .52,
		relief: .003
	}),
	cavefloor: Object.freeze({
		dark: [
			62,
			56,
			52
		],
		light: [
			142,
			132,
			122
		],
		roughness: .86,
		relief: .0026
	}),
	jam: Object.freeze({
		dark: [
			112,
			12,
			32
		],
		light: [
			232,
			72,
			92
		],
		roughness: .18,
		relief: .002
	}),
	peanutbutter: Object.freeze({
		dark: [
			122,
			82,
			32
		],
		light: [
			222,
			172,
			92
		],
		roughness: .58,
		relief: .0022
	}),
	sprinkles: Object.freeze({
		dark: [
			222,
			172,
			202
		],
		light: [
			252,
			232,
			242
		],
		roughness: .42,
		relief: .0024
	}),
	icecream: Object.freeze({
		dark: [
			222,
			182,
			192
		],
		light: [
			252,
			238,
			242
		],
		roughness: .82,
		relief: .0026
	}),
	popsicle: Object.freeze({
		dark: [
			122,
			42,
			62
		],
		light: [
			232,
			132,
			152
		],
		roughness: .32,
		relief: .002
	}),
	sorbet: Object.freeze({
		dark: [
			162,
			72,
			42
		],
		light: [
			242,
			172,
			112
		],
		roughness: .58,
		relief: .0022
	}),
	spaghetti: Object.freeze({
		dark: [
			192,
			152,
			82
		],
		light: [
			252,
			232,
			162
		],
		roughness: .62,
		relief: .0024
	}),
	macaroni: Object.freeze({
		dark: [
			172,
			132,
			72
		],
		light: [
			242,
			212,
			142
		],
		roughness: .58,
		relief: .0026
	}),
	lasagna: Object.freeze({
		dark: [
			102,
			42,
			22
		],
		light: [
			232,
			182,
			112
		],
		roughness: .52,
		relief: .0028
	}),
	origami: Object.freeze({
		dark: [
			132,
			112,
			142
		],
		light: [
			242,
			232,
			246
		],
		roughness: .72,
		relief: .0028
	}),
	paperlace: Object.freeze({
		dark: [
			162,
			152,
			142
		],
		light: [
			252,
			248,
			242
		],
		roughness: .78,
		relief: .0024
	}),
	papercut: Object.freeze({
		dark: [
			142,
			32,
			42
		],
		light: [
			242,
			212,
			212
		],
		roughness: .68,
		relief: .0026
	}),
	sunflower: Object.freeze({
		dark: [
			72,
			52,
			22
		],
		light: [
			232,
			192,
			62
		],
		roughness: .62,
		relief: .003
	}),
	daisy: Object.freeze({
		dark: [
			182,
			172,
			62
		],
		light: [
			252,
			252,
			242
		],
		roughness: .58,
		relief: .0026
	}),
	clover: Object.freeze({
		dark: [
			42,
			88,
			42
		],
		light: [
			122,
			192,
			92
		],
		roughness: .68,
		relief: .0028
	}),
	puzzletile: Object.freeze({
		dark: [
			162,
			102,
			42
		],
		light: [
			242,
			192,
			112
		],
		roughness: .52,
		relief: .003
	}),
	legobrick: Object.freeze({
		dark: [
			152,
			42,
			42
		],
		light: [
			232,
			142,
			112
		],
		roughness: .38,
		relief: .0028
	}),
	rubberband: Object.freeze({
		dark: [
			72,
			112,
			62
		],
		light: [
			172,
			222,
			142
		],
		roughness: .58,
		relief: .0022
	}),
	haybale: Object.freeze({
		dark: [
			162,
			132,
			62
		],
		light: [
			242,
			218,
			132
		],
		roughness: .72,
		relief: .0032
	}),
	corncrib: Object.freeze({
		dark: [
			102,
			82,
			62
		],
		light: [
			192,
			162,
			112
		],
		roughness: .68,
		relief: .0028
	}),
	fencepost: Object.freeze({
		dark: [
			92,
			72,
			52
		],
		light: [
			182,
			152,
			112
		],
		roughness: .78,
		relief: .003
	}),
	poolfelt: Object.freeze({
		dark: [
			22,
			62,
			42
		],
		light: [
			62,
			142,
			92
		],
		roughness: .9,
		relief: .0022
	}),
	icesurface: Object.freeze({
		dark: [
			142,
			172,
			202
		],
		light: [
			242,
			250,
			255
		],
		roughness: .16,
		relief: .0018
	}),
	climbingwall: Object.freeze({
		dark: [
			72,
			68,
			78
		],
		light: [
			182,
			172,
			192
		],
		roughness: .86,
		relief: .0034
	}),
	oledpanel: Object.freeze({
		dark: [
			12,
			12,
			16
		],
		light: [
			212,
			220,
			232
		],
		roughness: .3,
		relief: .0016
	}),
	crtscanline: Object.freeze({
		dark: [
			8,
			12,
			10
		],
		light: [
			112,
			188,
			128
		],
		roughness: .42,
		relief: .0012
	}),
	keyboardkey: Object.freeze({
		dark: [
			28,
			28,
			32
		],
		light: [
			172,
			172,
			182
		],
		roughness: .62,
		relief: .003
	}),
	filmstrip: Object.freeze({
		dark: [
			10,
			10,
			14
		],
		light: [
			88,
			92,
			104
		],
		roughness: .3,
		relief: .0024
	}),
	postagestamp: Object.freeze({
		dark: [
			150,
			132,
			100
		],
		light: [
			238,
			228,
			200
		],
		roughness: .82,
		relief: .0026
	}),
	halftoneprint: Object.freeze({
		dark: [
			26,
			28,
			32
		],
		light: [
			214,
			214,
			210
		],
		roughness: .68,
		relief: .0018
	}),
	radiator: Object.freeze({
		dark: [
			122,
			122,
			128
		],
		light: [
			228,
			230,
			236
		],
		roughness: .36,
		relief: .003
	}),
	screwhead: Object.freeze({
		dark: [
			62,
			64,
			70
		],
		light: [
			188,
			192,
			200
		],
		roughness: .42,
		relief: .0018
	}),
	chainlink: Object.freeze({
		dark: [
			92,
			96,
			102
		],
		light: [
			172,
			178,
			186
		],
		roughness: .52,
		relief: .0016
	}),
	friedegg: Object.freeze({
		dark: [
			222,
			176,
			66
		],
		light: [
			252,
			251,
			246
		],
		roughness: .52,
		relief: .0026
	}),
	sushirice: Object.freeze({
		dark: [
			188,
			182,
			172
		],
		light: [
			250,
			249,
			246
		],
		roughness: .66,
		relief: .0018
	}),
	chocolatechip: Object.freeze({
		dark: [
			72,
			42,
			26
		],
		light: [
			218,
			186,
			140
		],
		roughness: .72,
		relief: .0022
	}),
	cargomat: Object.freeze({
		dark: [
			28,
			30,
			34
		],
		light: [
			92,
			96,
			102
		],
		roughness: .8,
		relief: .0028
	}),
	dashboardgrain: Object.freeze({
		dark: [
			36,
			34,
			36
		],
		light: [
			118,
			112,
			110
		],
		roughness: .72,
		relief: .0022
	}),
	licenseplate: Object.freeze({
		dark: [
			142,
			152,
			168
		],
		light: [
			232,
			238,
			246
		],
		roughness: .38,
		relief: .0018
	}),
	flowerbed: Object.freeze({
		dark: [
			42,
			66,
			30
		],
		light: [
			232,
			148,
			176
		],
		roughness: .78,
		relief: .0028
	}),
	grassstripe: Object.freeze({
		dark: [
			46,
			82,
			36
		],
		light: [
			122,
			172,
			78
		],
		roughness: .84,
		relief: .0022
	}),
	topiary: Object.freeze({
		dark: [
			28,
			52,
			26
		],
		light: [
			96,
			138,
			62
		],
		roughness: .8,
		relief: .0026
	}),
	confetti: Object.freeze({
		dark: [
			214,
			72,
			96
		],
		light: [
			252,
			232,
			128
		],
		roughness: .62,
		relief: .0018
	}),
	ribbonstreamer: Object.freeze({
		dark: [
			122,
			42,
			148
		],
		light: [
			228,
			148,
			232
		],
		roughness: .48,
		relief: .0022
	}),
	pinatafringe: Object.freeze({
		dark: [
			222,
			82,
			62
		],
		light: [
			252,
			192,
			96
		],
		roughness: .7,
		relief: .0024
	}),
	xylophone: Object.freeze({
		dark: [
			152,
			102,
			52
		],
		light: [
			238,
			192,
			128
		],
		roughness: .58,
		relief: .0026
	}),
	tambourine: Object.freeze({
		dark: [
			168,
			122,
			62
		],
		light: [
			236,
			208,
			152
		],
		roughness: .62,
		relief: .0022
	}),
	castanet: Object.freeze({
		dark: [
			132,
			52,
			48
		],
		light: [
			222,
			148,
			132
		],
		roughness: .56,
		relief: .0024
	}),
	pillcapsule: Object.freeze({
		dark: [
			232,
			92,
			72
		],
		light: [
			252,
			232,
			224
		],
		roughness: .54,
		relief: .0022
	}),
	pilltablet: Object.freeze({
		dark: [
			222,
			222,
			218
		],
		light: [
			252,
			252,
			248
		],
		roughness: .62,
		relief: .0018
	}),
	bathbomb: Object.freeze({
		dark: [
			142,
			82,
			192
		],
		light: [
			232,
			192,
			242
		],
		roughness: .72,
		relief: .0022
	}),
	basketball: Object.freeze({
		dark: [
			23,
			16,
			12
		],
		light: [
			239,
			113,
			33
		],
		roughness: .79,
		relief: .0018
	}),
	tennisball: Object.freeze({
		dark: [
			153,
			190,
			15
		],
		light: [
			249,
			251,
			217
		],
		roughness: .94,
		relief: 6e-4
	}),
	golfball: Object.freeze({
		dark: [
			191,
			197,
			201
		],
		light: [
			255,
			255,
			253
		],
		roughness: .18,
		relief: .0012
	}),
	boardformedconcrete: Object.freeze({
		dark: [
			91,
			94,
			93
		],
		light: [
			187,
			188,
			180
		],
		roughness: .86,
		relief: .003
	}),
	ribbedconcrete: Object.freeze({
		dark: [
			89,
			92,
			91
		],
		light: [
			190,
			191,
			184
		],
		roughness: .83,
		relief: .018
	}),
	splitfaceblock: Object.freeze({
		dark: [
			84,
			82,
			76
		],
		light: [
			198,
			193,
			177
		],
		roughness: .94,
		relief: .012
	}),
	chainmail: Object.freeze({
		dark: [
			17,
			21,
			25
		],
		light: [
			195,
			202,
			210
		],
		roughness: .36,
		relief: .009
	}),
	rivetedmetal: Object.freeze({
		dark: [
			62,
			70,
			76
		],
		light: [
			174,
			184,
			192
		],
		roughness: .43,
		relief: .008
	}),
	weldedmetal: Object.freeze({
		dark: [
			65,
			69,
			73
		],
		light: [
			182,
			187,
			193
		],
		roughness: .39,
		relief: .006
	}),
	cactus: Object.freeze({
		dark: [
			24,
			65,
			31
		],
		light: [
			121,
			165,
			73
		],
		roughness: .57,
		relief: .008
	}),
	pinecone: Object.freeze({
		dark: [
			47,
			25,
			13
		],
		light: [
			174,
			125,
			73
		],
		roughness: .86,
		relief: .012
	}),
	corncob: Object.freeze({
		dark: [
			156,
			89,
			9
		],
		light: [
			255,
			224,
			87
		],
		roughness: .38,
		relief: .004
	}),
	basalt: Object.freeze({
		dark: [
			18,
			22,
			25
		],
		light: [
			87,
			94,
			96
		],
		roughness: .87,
		relief: .009
	}),
	scoria: Object.freeze({
		dark: [
			34,
			14,
			12
		],
		light: [
			126,
			63,
			43
		],
		roughness: .92,
		relief: .012
	}),
	obsidian: Object.freeze({
		dark: [
			5,
			7,
			10
		],
		light: [
			44,
			49,
			57
		],
		roughness: .12,
		relief: .004
	}),
	malachite: Object.freeze({
		dark: [
			6,
			42,
			24
		],
		light: [
			87,
			183,
			110
		],
		roughness: .22,
		relief: .002
	}),
	agate: Object.freeze({
		dark: [
			106,
			30,
			15
		],
		light: [
			249,
			223,
			174
		],
		roughness: .19,
		relief: .002
	}),
	lapislazuli: Object.freeze({
		dark: [
			12,
			24,
			108
		],
		light: [
			231,
			228,
			216
		],
		roughness: .27,
		relief: .003
	}),
	rice: Object.freeze({
		dark: [
			123,
			109,
			79
		],
		light: [
			255,
			248,
			222
		],
		roughness: .57,
		relief: .004
	}),
	sesame: Object.freeze({
		dark: [
			100,
			61,
			26
		],
		light: [
			239,
			203,
			140
		],
		roughness: .61,
		relief: .003
	}),
	coffeebeans: Object.freeze({
		dark: [
			12,
			5,
			3
		],
		light: [
			125,
			66,
			32
		],
		roughness: .39,
		relief: .008
	}),
	braincoral: Object.freeze({
		dark: [
			38,
			47,
			24
		],
		light: [
			198,
			190,
			109
		],
		roughness: .76,
		relief: .008
	}),
	starcoral: Object.freeze({
		dark: [
			51,
			29,
			24
		],
		light: [
			222,
			167,
			119
		],
		roughness: .8,
		relief: .006
	}),
	seasponge: Object.freeze({
		dark: [
			65,
			40,
			12
		],
		light: [
			230,
			190,
			91
		],
		roughness: .91,
		relief: .009
	}),
	houndstooth: Object.freeze({
		dark: [
			17,
			16,
			15
		],
		light: [
			239,
			231,
			210
		],
		roughness: .9,
		relief: .0024
	}),
	tartan: Object.freeze({
		dark: [
			49,
			29,
			26
		],
		light: [
			207,
			174,
			119
		],
		roughness: .88,
		relief: .0028
	}),
	damask: Object.freeze({
		dark: [
			71,
			53,
			41
		],
		light: [
			210,
			185,
			137
		],
		roughness: .74,
		relief: .004
	}),
	zebrafur: Object.freeze({
		dark: [
			14,
			12,
			10
		],
		light: [
			244,
			234,
			211
		],
		roughness: .87,
		relief: .002
	}),
	leopardfur: Object.freeze({
		dark: [
			22,
			13,
			7
		],
		light: [
			232,
			180,
			93
		],
		roughness: .87,
		relief: .002
	}),
	giraffefur: Object.freeze({
		dark: [
			106,
			48,
			20
		],
		light: [
			246,
			223,
			172
		],
		roughness: .87,
		relief: .002
	}),
	scallopshell: Object.freeze({
		dark: [
			151,
			71,
			65
		],
		light: [
			249,
			233,
			204
		],
		roughness: .55,
		relief: .006
	}),
	oystershell: Object.freeze({
		dark: [
			62,
			65,
			59
		],
		light: [
			227,
			222,
			198
		],
		roughness: .89,
		relief: .009
	}),
	nautilusshell: Object.freeze({
		dark: [
			124,
			46,
			25
		],
		light: [
			249,
			234,
			196
		],
		roughness: .38,
		relief: .004
	}),
	walnutshell: Object.freeze({
		dark: [
			65,
			30,
			12
		],
		light: [
			177,
			126,
			70
		],
		roughness: .88,
		relief: .003
	}),
	peanutshell: Object.freeze({
		dark: [
			146,
			105,
			53
		],
		light: [
			237,
			213,
			164
		],
		roughness: .9,
		relief: .0015
	}),
	almondshell: Object.freeze({
		dark: [
			133,
			91,
			47
		],
		light: [
			224,
			193,
			143
		],
		roughness: .86,
		relief: .0012
	}),
	cantaloupe: Object.freeze({
		dark: [
			70,
			83,
			36
		],
		light: [
			215,
			188,
			132
		],
		roughness: .81,
		relief: .005
	}),
	dragonfruit: Object.freeze({
		dark: [
			190,
			17,
			91
		],
		light: [
			193,
			211,
			58
		],
		roughness: .35,
		relief: .006
	}),
	kiwiskin: Object.freeze({
		dark: [
			66,
			38,
			17
		],
		light: [
			170,
			133,
			76
		],
		roughness: .91,
		relief: .002
	}),
	rosepetal: Object.freeze({
		dark: [
			91,
			8,
			32
		],
		light: [
			228,
			89,
			126
		],
		roughness: .87,
		relief: .0012
	}),
	lilypetal: Object.freeze({
		dark: [
			116,
			30,
			17
		],
		light: [
			255,
			238,
			175
		],
		roughness: .48,
		relief: .001
	}),
	fritillarypetal: Object.freeze({
		dark: [
			88,
			26,
			83
		],
		light: [
			245,
			232,
			195
		],
		roughness: .57,
		relief: .001
	}),
	birchbark: Object.freeze({
		dark: [
			43,
			36,
			29
		],
		light: [
			242,
			235,
			213
		],
		roughness: .79,
		relief: .003
	}),
	palmtrunk: Object.freeze({
		dark: [
			66,
			43,
			25
		],
		light: [
			191,
			151,
			96
		],
		roughness: .93,
		relief: .009
	}),
	sycamorebark: Object.freeze({
		dark: [
			95,
			102,
			74
		],
		light: [
			225,
			219,
			188
		],
		roughness: .84,
		relief: .004
	}),
	elephanthide: Object.freeze({
		dark: [
			50,
			49,
			46
		],
		light: [
			160,
			157,
			147
		],
		roughness: .88,
		relief: .007
	}),
	ostrichleather: Object.freeze({
		dark: [
			92,
			51,
			25
		],
		light: [
			217,
			168,
			103
		],
		roughness: .69,
		relief: .004
	}),
	sharkskin: Object.freeze({
		dark: [
			39,
			54,
			63
		],
		light: [
			145,
			163,
			171
		],
		roughness: .78,
		relief: .002
	}),
	tactilepaving: Object.freeze({
		dark: [
			105,
			82,
			28
		],
		light: [
			230,
			199,
			91
		],
		roughness: .83,
		relief: .009,
		tiles: 2,
		domes: 6,
		jointInner: .455,
		jointOuter: .49,
		domeInner: .2,
		domeOuter: .34
	}),
	roadmarking: Object.freeze({
		dark: [
			24,
			27,
			28
		],
		light: [
			232,
			231,
			213
		],
		roughness: .93,
		relief: .0015,
		bands: 2,
		bandInner: .26,
		bandOuter: .3,
		wearInner: .36,
		wearOuter: .56,
		wearColumns: 12,
		wearRows: 20
	}),
	draincover: Object.freeze({
		dark: [
			14,
			17,
			18
		],
		light: [
			139,
			146,
			144
		],
		roughness: .64,
		relief: .012,
		frameInnerX: .43,
		frameOuterX: .46,
		frameInnerY: .4,
		frameOuterY: .43,
		slots: 6,
		slotStart: .15,
		slotSpacing: .14,
		slotHalfLength: .25,
		slotInner: .026,
		slotOuter: .042,
		braceInner: .035,
		braceOuter: .055
	}),
	mushroomgills: Object.freeze({
		dark: [
			91,
			61,
			37
		],
		light: [
			247,
			233,
			197
		],
		roughness: .78,
		relief: .0024,
		cells: 3,
		scale: .58,
		blades: 44,
		bladePower: 8,
		shortStart: .62,
		shortEnd: .82
	}),
	morel: Object.freeze({
		dark: [
			53,
			29,
			12
		],
		light: [
			211,
			164,
			85
		],
		roughness: .86,
		relief: .0038,
		columns: 7,
		rows: 4,
		jitter: .18,
		support: 1.6,
		weightPower: 12
	}),
	bracketfungus: Object.freeze({
		dark: [
			87,
			34,
			17
		],
		light: [
			242,
			221,
			177
		],
		roughness: .83,
		relief: .0028,
		cells: 3,
		scale: .58,
		zones: 2.8,
		lobe: .055,
		marginStart: 1.1,
		marginEnd: 1.22
	}),
	pineapple: Object.freeze({
		dark: [
			62,
			61,
			17
		],
		light: [
			232,
			174,
			43
		],
		roughness: .73,
		relief: .0035,
		cells: 8,
		shoulder: .09,
		eyeRadius: .18
	}),
	strawberry: Object.freeze({
		dark: [
			173,
			8,
			21
		],
		light: [
			245,
			192,
			70
		],
		roughness: .43,
		relief: .0018,
		columns: 12,
		rows: 10,
		width: .22,
		length: .34,
		core: .13
	}),
	lychee: Object.freeze({
		dark: [
			103,
			22,
			37
		],
		light: [
			236,
			124,
			143
		],
		roughness: .76,
		relief: .0024,
		columns: 18,
		rows: 16,
		shoulder: .075,
		edge: .48,
		jitter: .015
	}),
	sandpaper: Object.freeze({
		dark: [
			86,
			66,
			48
		],
		light: [
			214,
			172,
			118
		],
		roughness: .93,
		relief: .0028
	}),
	steelwool: Object.freeze({
		dark: [
			96,
			99,
			104
		],
		light: [
			214,
			218,
			224
		],
		roughness: .82,
		relief: .003
	}),
	wirebrush: Object.freeze({
		dark: [
			64,
			62,
			60
		],
		light: [
			202,
			200,
			196
		],
		roughness: .68,
		relief: .0026
	}),
	cheesegrater: Object.freeze({
		dark: [
			96,
			100,
			104
		],
		light: [
			222,
			226,
			230
		],
		roughness: .42,
		relief: .002
	}),
	ovenrack: Object.freeze({
		dark: [
			72,
			70,
			68
		],
		light: [
			196,
			194,
			190
		],
		roughness: .55,
		relief: .0028
	}),
	muffintin: Object.freeze({
		dark: [
			88,
			76,
			62
		],
		light: [
			214,
			198,
			176
		],
		roughness: .5,
		relief: .0026
	}),
	gauze: Object.freeze({
		dark: [
			214,
			214,
			208
		],
		light: [
			252,
			252,
			248
		],
		roughness: .88,
		relief: .0016
	}),
	elasticbandage: Object.freeze({
		dark: [
			188,
			178,
			156
		],
		light: [
			242,
			236,
			218
		],
		roughness: .86,
		relief: .0028
	}),
	icepack: Object.freeze({
		dark: [
			58,
			96,
			132
		],
		light: [
			188,
			222,
			240
		],
		roughness: .36,
		relief: .0032
	}),
	bubblewrap: Object.freeze({
		dark: [
			178,
			198,
			212
		],
		light: [
			240,
			247,
			251
		],
		roughness: .28,
		relief: .0042
	}),
	sequin: Object.freeze({
		dark: [
			128,
			36,
			72
		],
		light: [
			242,
			156,
			188
		],
		roughness: .24,
		relief: .0022
	}),
	pennyround: Object.freeze({
		dark: [
			148,
			148,
			146
		],
		light: [
			240,
			238,
			232
		],
		roughness: .3,
		relief: .003
	}),
	volleyball: Object.freeze({
		dark: [
			42,
			62,
			110
		],
		light: [
			238,
			240,
			244
		],
		roughness: .42,
		relief: .003
	}),
	bowlingball: Object.freeze({
		dark: [
			52,
			12,
			24
		],
		light: [
			214,
			96,
			108
		],
		roughness: .16,
		relief: .0028
	}),
	rugbyball: Object.freeze({
		dark: [
			72,
			38,
			22
		],
		light: [
			214,
			178,
			132
		],
		roughness: .5,
		relief: .0034
	}),
	wafflecone: Object.freeze({
		dark: [
			122,
			74,
			30
		],
		light: [
			232,
			186,
			112
		],
		roughness: .55,
		relief: .0034
	}),
	donutglaze: Object.freeze({
		dark: [
			132,
			84,
			56
		],
		light: [
			246,
			232,
			226
		],
		roughness: .32,
		relief: .0038
	}),
	brownie: Object.freeze({
		dark: [
			42,
			24,
			18
		],
		light: [
			148,
			96,
			62
		],
		roughness: .46,
		relief: .0032
	}),
	soapbar: Object.freeze({
		dark: [
			96,
			142,
			150
		],
		light: [
			232,
			246,
			246
		],
		roughness: .38,
		relief: .0032
	}),
	loofah: Object.freeze({
		dark: [
			142,
			112,
			62
		],
		light: [
			232,
			212,
			158
		],
		roughness: .62,
		relief: .0048
	}),
	scrubbypad: Object.freeze({
		dark: [
			46,
			92,
			62
		],
		light: [
			168,
			208,
			152
		],
		roughness: .58,
		relief: .003
	}),
	orangeflesh: Object.freeze({
		dark: [
			186,
			92,
			24
		],
		light: [
			252,
			196,
			96
		],
		roughness: .42,
		relief: .0032
	}),
	kiwiflesh: Object.freeze({
		dark: [
			88,
			116,
			42
		],
		light: [
			198,
			226,
			128
		],
		roughness: .46,
		relief: .003
	}),
	avocadoflesh: Object.freeze({
		dark: [
			92,
			118,
			58
		],
		light: [
			222,
			232,
			152
		],
		roughness: .44,
		relief: .0036
	}),
	turquoise: Object.freeze({
		dark: [
			28,
			126,
			134
		],
		light: [
			96,
			218,
			206
		],
		roughness: .24,
		relief: .0028
	}),
	rhodonite: Object.freeze({
		dark: [
			142,
			58,
			78
		],
		light: [
			236,
			154,
			172
		],
		roughness: .26,
		relief: .0025
	}),
	tigereye: Object.freeze({
		dark: [
			62,
			36,
			16
		],
		light: [
			218,
			160,
			52
		],
		roughness: .2,
		relief: .0022
	}),
	tatami: Object.freeze({
		dark: [
			83,
			78,
			32
		],
		light: [
			208,
			195,
			116
		],
		roughness: .81,
		relief: .006,
		reeds: 32,
		bindings: 4,
		bindingWidth: .09
	}),
	flutedwood: Object.freeze({
		dark: [
			39,
			20,
			10
		],
		light: [
			189,
			128,
			65
		],
		roughness: .48,
		relief: .028,
		slats: 8,
		halfWidth: .44
	}),
	subwaytiles: Object.freeze({
		dark: [
			12,
			45,
			40
		],
		light: [
			130,
			188,
			157
		],
		roughness: .2,
		relief: .012,
		columns: 2,
		rows: 4,
		grout: .012,
		shoulder: .012,
		bevel: .065
	}),
	canewebbing: Object.freeze({
		dark: [
			27,
			17,
			8
		],
		light: [
			221,
			179,
			106
		],
		roughness: .58,
		relief: .016,
		cells: 8,
		ribbonWidth: .13,
		diagonalWidth: .075
	}),
	rammedearth: Object.freeze({
		dark: [
			111,
			60,
			34
		],
		light: [
			228,
			194,
			144
		],
		roughness: .86,
		relief: .008,
		layers: 8,
		warp: .12,
		fineWarp: .04,
		transition: .1,
		seamWidth: .05
	}),
	copperpatina: Object.freeze({
		dark: [
			177,
			92,
			51
		],
		light: [
			49,
			146,
			124
		],
		roughness: .24,
		relief: .006,
		coverageStart: .4,
		coverageRange: .2
	}),
	birdseyemaple: Object.freeze({
		dark: [
			116,
			67,
			27
		],
		light: [
			242,
			218,
			166
		],
		roughness: .38,
		relief: .003,
		cells: 6,
		radiusX: .22,
		radiusY: .28
	}),
	breezeblock: Object.freeze({
		dark: [
			21,
			20,
			17
		],
		light: [
			225,
			217,
			193
		],
		roughness: .84,
		relief: .032,
		cells: 4,
		lobeOffset: .12,
		lobeRadius: .18,
		lobeShoulder: .01,
		grout: .012,
		edgeShoulder: .03
	}),
	basketweavepavers: Object.freeze({
		dark: [
			83,
			42,
			29
		],
		light: [
			211,
			135,
			91
		],
		roughness: .86,
		relief: .018,
		cells: 4,
		grout: .018,
		shoulder: .04
	}),
	ripstop: Object.freeze({
		dark: [
			34,
			48,
			24
		],
		light: [
			142,
			157,
			101
		],
		roughness: .48,
		relief: .002,
		cells: 4,
		threads: 64,
		reinforcementOffset: .0625,
		reinforcementWidth: .025
	}),
	octagondot: Object.freeze({
		dark: [
			34,
			43,
			51
		],
		light: [
			235,
			230,
			214
		],
		roughness: .32,
		relief: .014,
		cells: 4,
		grout: .012,
		shoulder: .025,
		clippedCorner: .82,
		dotRadius: .15,
		dotShoulder: .006
	}),
	truchettiles: Object.freeze({
		dark: [
			21,
			48,
			74
		],
		light: [
			238,
			231,
			206
		],
		roughness: .28,
		relief: .012,
		cells: 4,
		grout: .014,
		shoulder: .03,
		arcRadius: .5,
		arcWidthSquared: .055
	}),
	standingseam: Object.freeze({
		dark: [
			101,
			116,
			126
		],
		light: [
			214,
			225,
			231
		],
		roughness: .32,
		relief: .035,
		panels: 4,
		capHalfWidth: .015,
		shoulder: .03,
		toeOffset: .065,
		toeWidth: .02
	}),
	damascus: Object.freeze({
		dark: [
			46,
			56,
			65
		],
		light: [
			214,
			223,
			227
		],
		roughness: .22,
		relief: .002,
		cells: 4,
		layers: 20,
		foldRadius: .32,
		foldStrength: 3.2
	}),
	windmillpavers: Object.freeze({
		dark: [
			65,
			38,
			29
		],
		light: [
			220,
			148,
			99
		],
		roughness: .86,
		relief: .045,
		cells: 2,
		grout: .035,
		shoulder: .045
	}),
	castiron: Object.freeze({
		dark: [
			56,
			59,
			61
		],
		light: [
			145,
			148,
			150
		],
		roughness: .68,
		relief: .022,
		cells: 10,
		poreChance: .35,
		poreRadiusMin: .1,
		poreRadiusRange: .12
	}),
	porphyry: Object.freeze({
		dark: [
			96,
			36,
			45
		],
		light: [
			222,
			180,
			158
		],
		roughness: .5,
		relief: .006,
		cells: 8,
		crystalChance: .8,
		halfLengthMin: .16,
		halfLengthRange: .12,
		halfWidthMin: .06,
		halfWidthRange: .07,
		edge: .018
	}),
	linen: Object.freeze({
		dark: [
			122,
			110,
			87
		],
		light: [
			238,
			226,
			195
		],
		roughness: .91,
		relief: .03,
		threads: 16,
		halfWidth: .2,
		slubWidth: .23
	}),
	chippedenamel: Object.freeze({
		dark: [
			80,
			84,
			88
		],
		light: [
			240,
			237,
			221
		],
		roughness: .14,
		relief: .012,
		cells: 4,
		chipChance: .6,
		radiusMin: .22,
		radiusRange: .07,
		edges: 5,
		edge: .025
	}),
	perforatedleather: Object.freeze({
		dark: [
			18,
			9,
			5
		],
		light: [
			172,
			103,
			56
		],
		roughness: .44,
		relief: .014,
		cells: 8,
		coreRadius: .13,
		outerRadius: .24
	}),
	pigskinleather: Object.freeze({
		dark: [
			35,
			16,
			8
		],
		light: [
			203,
			143,
			90
		],
		roughness: .62,
		relief: .0038,
		cells: 8,
		jitter: .22,
		ringRadius: .12,
		scaleVariation: .15,
		localJitter: .004,
		poreRadius: .045,
		radiusVariation: .22,
		aspectVariation: .18,
		faceTone: .61,
		grainTone: .1,
		baseHeight: .52,
		grainHeight: .04,
		poreTone: .5,
		poreDepth: .34,
		poreRoughness: .22,
		poreOcclusion: .63
	}),
	argyle: Object.freeze({
		dark: [
			55,
			12,
			26
		],
		light: [
			239,
			207,
			194
		],
		roughness: .8,
		relief: .008,
		diamonds: 2,
		threads: 48,
		colorEdge: .08,
		lineOuter: .12,
		lineInner: .08
	}),
	chevronparquet: Object.freeze({
		dark: [
			35,
			18,
			9
		],
		light: [
			210,
			160,
			91
		],
		roughness: .38,
		relief: .025,
		rows: 4,
		grainBands: 12,
		endGap: .02,
		endBevel: .05,
		sideGap: .015,
		sideBevel: .075
	}),
	ginkgoleaf: Object.freeze({
		dark: [
			48,
			32,
			7
		],
		light: [
			230,
			193,
			55
		],
		roughness: .6,
		relief: .02,
		cells: 3,
		radius: .4,
		halfAngle: 1.25,
		notchDepth: .09,
		notchWidth: .14,
		edge: .02
	}),
	pressedtin: Object.freeze({
		dark: [
			72,
			77,
			80
		],
		light: [
			220,
			224,
			226
		],
		roughness: .32,
		relief: .02,
		cells: 2,
		frameOuter: .47,
		frameInner: .4,
		frameEdge: .025,
		petalOffset: .2,
		petalLength: .14,
		petalWidth: .07,
		bossRadius: .09
	}),
	sashiko: Object.freeze({
		dark: [
			9,
			22,
			48
		],
		light: [
			224,
			222,
			207
		],
		roughness: .78,
		relief: .02,
		cells: 8,
		threads: 32,
		stitchLength: .4,
		stitchWidth: .09
	}),
	ashlar: Object.freeze({
		dark: [
			57,
			48,
			36
		],
		light: [
			207,
			190,
			158
		],
		roughness: .72,
		relief: .025,
		cells: 6,
		gap: .025,
		bevel: .08,
		stones: Object.freeze([
			[
				0,
				0,
				3,
				2
			],
			[
				3,
				0,
				3,
				1
			],
			[
				3,
				1,
				2,
				2
			],
			[
				5,
				1,
				1,
				3
			],
			[
				0,
				2,
				1,
				2
			],
			[
				1,
				2,
				2,
				3
			],
			[
				3,
				3,
				2,
				2
			],
			[
				0,
				4,
				1,
				2
			],
			[
				5,
				4,
				1,
				2
			],
			[
				3,
				5,
				2,
				1
			],
			[
				1,
				5,
				2,
				1
			]
		])
	}),
	gabion: Object.freeze({
		dark: [
			20,
			24,
			24
		],
		light: [
			175,
			164,
			139
		],
		roughness: .74,
		relief: .025,
		cells: 3,
		mesh: 4,
		wireWidth: .1,
		radiusMin: .4,
		radiusRange: .06,
		jitter: .025
	}),
	gingham: Object.freeze({
		dark: [
			16,
			45,
			95
		],
		light: [
			235,
			235,
			224
		],
		roughness: .82,
		relief: .012,
		checks: 4,
		threads: 64,
		colorEdge: .12
	}),
	mossypavers: Object.freeze({
		dark: [
			16,
			25,
			9
		],
		light: [
			102,
			139,
			45
		],
		roughness: .64,
		relief: .03,
		cells: 4,
		gap: .035,
		bevel: .065
	}),
	bamboocrosscut: Object.freeze({
		dark: [
			22,
			34,
			11
		],
		light: [
			216,
			199,
			129
		],
		roughness: .74,
		relief: .03,
		cells: 4,
		edge: .025,
		rindWidth: .06
	}),
	moire: Object.freeze({
		dark: [
			38,
			14,
			66
		],
		light: [
			142,
			99,
			176
		],
		roughness: .44,
		relief: .006,
		bands: 4,
		warpThreads: 72,
		weftThreads: 56
	}),
	oakleaf: Object.freeze({
		dark: [
			12,
			24,
			7
		],
		light: [
			128,
			155,
			52
		],
		roughness: .66,
		relief: .02,
		cells: 3,
		length: .38,
		width: .23
	}),
	rhombille: Object.freeze({
		dark: [
			56,
			40,
			30
		],
		light: [
			226,
			207,
			171
		],
		roughness: .42,
		relief: .02,
		columns: 3,
		rows: 4,
		grout: .012,
		shoulder: .035,
		shades: [
			.78,
			.49,
			.2
		]
	}),
	fossillimestone: Object.freeze({
		dark: [
			82,
			67,
			48
		],
		light: [
			235,
			222,
			188
		],
		roughness: .44,
		relief: .006,
		cells: 3,
		turns: 4,
		septa: 18
	}),
	seigaihatiles: Object.freeze({
		dark: [
			18,
			48,
			79
		],
		light: [
			228,
			234,
			223
		],
		roughness: .28,
		relief: .018,
		columns: 4,
		rows: 8,
		tiles: 2,
		grout: .025,
		shoulder: .035,
		radius: .7,
		arcStart: .12,
		arcSpacing: .14
	}),
	tuftedleather: Object.freeze({
		dark: [
			28,
			12,
			7
		],
		light: [
			145,
			78,
			40
		],
		roughness: .48,
		relief: .04,
		diamonds: 3,
		buttonRadius: .075,
		collarRadius: .16
	}),
	louveredmetal: Object.freeze({
		dark: [
			45,
			50,
			55
		],
		light: [
			205,
			212,
			216
		],
		roughness: .33,
		relief: .04,
		columns: 3,
		rows: 6,
		halfWidth: .44,
		endShoulder: .08
	}),
	herringbonebrick: Object.freeze({
		dark: [
			64,
			22,
			14
		],
		light: [
			194,
			99,
			57
		],
		roughness: .78,
		relief: .025,
		cells: 8,
		grout: .035,
		shoulder: .06
	}),
	shibori: Object.freeze({
		dark: [
			10,
			25,
			70
		],
		light: [
			225,
			230,
			216
		],
		roughness: .88,
		relief: .009,
		cells: 3,
		threads: 64,
		pleats: 18
	}),
	scallopedslate: Object.freeze({
		dark: [
			23,
			31,
			41
		],
		light: [
			117,
			133,
			145
		],
		roughness: .76,
		relief: .025,
		columns: 4,
		rows: 6,
		halfWidth: .49,
		tailStart: .85,
		tailDepth: .55
	}),
	saltpan: Object.freeze({
		dark: [
			158,
			151,
			133
		],
		light: [
			255,
			253,
			242
		],
		roughness: .86,
		relief: .03,
		cells: 4,
		ridgeWidth: .1
	}),
	dogbonepavers: Object.freeze({
		dark: [
			53,
			57,
			61
		],
		light: [
			156,
			160,
			158
		],
		roughness: .82,
		relief: .025,
		columns: 4,
		rows: 2,
		grout: .025,
		shoulder: .04
	}),
	palmendgrain: Object.freeze({
		dark: [
			44,
			21,
			9
		],
		light: [
			220,
			173,
			104
		],
		roughness: .68,
		relief: .006,
		cells: 8
	}),
	blackpalm: Object.freeze({
		dark: [
			14,
			11,
			9
		],
		light: [
			182,
			139,
			100
		],
		roughness: .44,
		relief: .004,
		columns: 80,
		rows: 12,
		patchSlots: 2,
		patchChance: .96,
		widthMinimum: .1,
		widthVariation: .2,
		lengthMinimum: .45,
		lengthVariation: .75,
		jitterX: .38,
		jitterY: .18,
		slope: .035,
		bend: .025,
		coreQ: .18,
		faceColor: .68,
		woodContrast: .1,
		fiberContrast: .035,
		patchContrast: .6
	}),
	asanoha: Object.freeze({
		dark: [
			47,
			13,
			25
		],
		light: [
			241,
			226,
			197
		],
		roughness: .8,
		relief: .006,
		columns: 4,
		rows: 4,
		threads: 64
	}),
	lotusseedpod: Object.freeze({
		dark: [
			36,
			21,
			9
		],
		light: [
			173,
			130,
			68
		],
		roughness: .83,
		relief: .035,
		cells: 3
	}),
	crowncaps: Object.freeze({
		dark: [
			70,
			77,
			82
		],
		light: [
			196,
			205,
			211
		],
		roughness: .3,
		relief: .018,
		cells: 4,
		teeth: 21
	}),
	cofferedconcrete: Object.freeze({
		dark: [
			76,
			74,
			68
		],
		light: [
			192,
			188,
			177
		],
		roughness: .83,
		relief: .04,
		cells: 3,
		opening: .4,
		wallWidth: .14
	}),
	woodworm: Object.freeze({
		dark: [
			38,
			24,
			12
		],
		light: [
			203,
			161,
			103
		],
		roughness: .72,
		relief: .025,
		cells: 4,
		channelWidth: .028,
		holeRadius: .045
	}),
	calcadawaves: Object.freeze({
		dark: [
			26,
			27,
			25
		],
		light: [
			218,
			214,
			199
		],
		roughness: .84,
		relief: .018,
		cells: 16,
		grout: .025,
		bevel: .045
	}),
	ikat: Object.freeze({
		dark: [
			16,
			31,
			62
		],
		light: [
			218,
			205,
			175
		],
		roughness: .81,
		relief: .006,
		cells: 4,
		threads: 64,
		fringe: .16
	}),
	slottedwood: Object.freeze({
		dark: [
			33,
			21,
			12
		],
		light: [
			199,
			157,
			99
		],
		roughness: .64,
		relief: .025,
		columns: 4,
		rows: 8,
		spine: .29,
		coreRadius: .025,
		outerRadius: .045
	}),
	hollyleaf: Object.freeze({
		dark: [
			4,
			19,
			9
		],
		light: [
			86,
			133,
			49
		],
		roughness: .36,
		relief: .03,
		cells: 3
	}),
	englishbond: Object.freeze({
		dark: [
			74,
			30,
			21
		],
		light: [
			204,
			114,
			70
		],
		roughness: .82,
		relief: .025,
		rows: 8,
		headerColumns: 8,
		stretcherColumns: 4,
		grout: .025,
		bevel: .045
	}),
	rebar: Object.freeze({
		dark: [
			22,
			27,
			30
		],
		light: [
			160,
			171,
			176
		],
		roughness: .57,
		relief: .025,
		columns: 4,
		ribs: 12,
		radius: .36,
		slant: .85
	}),
	starfruit: Object.freeze({
		dark: [
			65,
			42,
			16
		],
		light: [
			249,
			226,
			115
		],
		roughness: .35,
		relief: .02,
		cells: 3,
		innerRadius: .23,
		outerRadius: .43,
		seedRadius: .1
	}),
	diamondrustication: Object.freeze({
		dark: [
			83,
			76,
			62
		],
		light: [
			210,
			200,
			175
		],
		roughness: .76,
		relief: .04,
		cells: 4,
		bossHalfWidth: .38,
		footSoftness: .08,
		grout: .025,
		bevel: .045
	}),
	bargello: Object.freeze({
		dark: [
			32,
			18,
			52
		],
		light: [
			231,
			208,
			237
		],
		roughness: .8,
		relief: .012,
		columns: 32,
		rows: 8,
		halfWidth: .43,
		tones: [
			.12,
			.38,
			.7,
			.92
		]
	}),
	saffiano: Object.freeze({
		dark: [
			31,
			15,
			9
		],
		light: [
			137,
			78,
			43
		],
		roughness: .58,
		relief: .004,
		lines: 16,
		grooveDepth: .14
	}),
	cocoamat: Object.freeze({
		dark: [
			42,
			25,
			12
		],
		light: [
			201,
			145,
			77
		],
		roughness: .88,
		relief: .025,
		cells: 8,
		fibers: 4,
		halfLength: .68,
		radius: .07
	}),
	suminagashi: Object.freeze({
		dark: [
			24,
			28,
			31
		],
		light: [
			235,
			228,
			208
		],
		roughness: .86,
		relief: .004,
		rings: 12,
		warp: .18
	}),
	vermiculite: Object.freeze({
		dark: [
			38,
			27,
			12
		],
		light: [
			194,
			152,
			82
		],
		roughness: .72,
		relief: .025,
		cells: 6,
		layers: 5,
		halfLength: .44,
		halfWidth: .22,
		ribWidth: .05
	}),
	cairotiles: Object.freeze({
		dark: [
			86,
			52,
			30
		],
		light: [
			193,
			152,
			106
		],
		roughness: .7,
		relief: .025,
		cells: 4,
		grout: .012,
		shoulder: .025,
		vertices: [
			-1 + Math.sqrt(3) / 6,
			-.5,
			-Math.sqrt(3) / 6,
			-.5,
			0,
			0,
			-.5,
			Math.sqrt(3) / 6,
			-1,
			0
		]
	}),
	guilloche: Object.freeze({
		dark: [
			90,
			96,
			98
		],
		light: [
			219,
			225,
			229
		],
		roughness: .28,
		relief: .01,
		cells: 2,
		lobes: 8,
		radius: .28,
		amplitude: .04,
		spacing: .05,
		width: .009
	}),
	seaurchintest: Object.freeze({
		dark: [
			66,
			59,
			49
		],
		light: [
			237,
			225,
			197
		],
		roughness: .76,
		relief: .03,
		cells: 3,
		radius: .44,
		poreStart: .14,
		poreSpacing: .045,
		poreRows: 5,
		poreOffset: .028,
		poreRadius: .018,
		apicalRadius: .035,
		tubercleRadius: .035
	}),
	crystallineglaze: Object.freeze({
		dark: [
			20,
			49,
			69
		],
		light: [
			187,
			224,
			216
		],
		roughness: .18,
		relief: .004,
		cells: 4,
		radiusMin: .26,
		radiusRange: .1,
		armsMin: 18,
		armsRange: 12
	}),
	shirring: Object.freeze({
		dark: [
			89,
			48,
			65
		],
		light: [
			227,
			177,
			191
		],
		roughness: .82,
		relief: .03,
		rows: 4,
		folds: 24,
		stitches: 48,
		seamWidth: .07,
		threadWidth: .025,
		wander: .15
	}),
	sunburstveneer: Object.freeze({
		dark: [
			53,
			28,
			16
		],
		light: [
			222,
			176,
			112
		],
		roughness: .42,
		relief: .02,
		cells: 2,
		wedges: 12,
		radius: .44,
		plugRadius: .07,
		innerRadius: .075,
		edge: .012,
		gap: .003,
		bevel: .008
	}),
	rakedgravel: Object.freeze({
		dark: [
			89,
			88,
			82
		],
		light: [
			237,
			235,
			218
		],
		roughness: .86,
		relief: .03,
		furrows: 8,
		bottom: .12,
		shoulder: .18,
		cells: 32,
		radiusMin: .28,
		radiusRange: .04
	}),
	flintwall: Object.freeze({
		dark: [
			35,
			40,
			44
		],
		light: [
			222,
			220,
			200
		],
		roughness: .78,
		relief: .03,
		cells: 6,
		edges: 6,
		radiusMin: .32,
		radiusRange: .05,
		cortex: .05,
		bevel: .025
	}),
	frenchknots: Object.freeze({
		dark: [
			127,
			47,
			69
		],
		light: [
			245,
			230,
			207
		],
		roughness: .85,
		relief: .02,
		cells: 6,
		radius: .28,
		inner: .095,
		outer: .19,
		width: .035,
		dimple: .055,
		warp: .008,
		aspect: 1.15
	}),
	artichoke: Object.freeze({
		dark: [
			21,
			48,
			30
		],
		light: [
			155,
			176,
			78
		],
		roughness: .48,
		relief: .025,
		cells: 6,
		root: -.75,
		tip: .8,
		halfWidth: .64,
		edge: .04,
		midrib: .055,
		veinWidth: .015
	}),
	splitlockwashers: Object.freeze({
		dark: [
			54,
			61,
			67
		],
		light: [
			210,
			218,
			223
		],
		roughness: .33,
		relief: .025,
		cells: 4,
		inner: .22,
		outer: .43,
		bevel: .025,
		gap: .16,
		angularBevel: .08
	}),
	flemishbond: Object.freeze({
		dark: [
			80,
			32,
			23
		],
		light: [
			208,
			117,
			63
		],
		roughness: .8,
		relief: .025,
		modules: 4,
		rows: 16,
		grout: .035,
		bevel: .055,
		headerTone: .25,
		stretcherTone: .55
	}),
	satinweave: Object.freeze({
		dark: [
			54,
			28,
			82
		],
		light: [
			203,
			165,
			217
		],
		roughness: .3,
		relief: .004,
		cells: 25,
		harness: 5,
		step: 2,
		halfWidth: .46,
		exposureHalf: .48,
		exposureShoulder: .1
	}),
	lotusroot: Object.freeze({
		dark: [
			51,
			37,
			25
		],
		light: [
			244,
			231,
			193
		],
		roughness: .48,
		relief: .025,
		cells: 3,
		canals: 8,
		radius: .45,
		edge: .025,
		rindStart: .4,
		rindWidth: .025,
		canalDistance: .255,
		canalLong: .095,
		canalLongVariation: .015,
		canalShort: .045,
		canalShortVariation: .01,
		centralRadius: .055,
		wallShoulder: .35
	}),
	radiolariandiscs: Object.freeze({
		dark: [
			28,
			31,
			34
		],
		light: [
			235,
			232,
			218
		],
		roughness: .65,
		relief: .0022,
		cells: 2,
		jitter: .025,
		scaleMin: .94,
		scaleVariation: .12,
		rings: 4,
		firstRadius: .055,
		ringSpacing: .085,
		ringWidth: .0125,
		axesBase: 3,
		stagger: .5,
		ribWidth: .009,
		joinWidth: .012,
		spineLength: .4,
		backingTone: .03,
		wallTone: .84,
		backingHeight: .04,
		wallHeight: .65,
		grainHeight: .004,
		grainTone: .03,
		grainRoughness: .02,
		backingRoughness: .94,
		backingAO: .45,
		wallAO: .96
	}),
	diatomvalves: Object.freeze({
		dark: [
			31,
			35,
			36
		],
		light: [
			232,
			225,
			207
		],
		roughness: .42,
		relief: .0022,
		cells: 2,
		jitter: .035,
		scaleMinimum: .88,
		scaleVariation: .2,
		radiusX: .1,
		radiusY: .39,
		shoulder: .12,
		rows: 24,
		rowExtent: .34,
		curveFraction: .1,
		columns: 3,
		firstHole: .027,
		columnPitch: .024,
		holeX: .0035,
		holeY: .0085,
		holeShoulder: .22,
		border: .006,
		centralX: .058,
		centralY: .04,
		rapheX: .003,
		rapheStart: .035,
		rapheEnd: .35,
		rapheCap: .006,
		rapheShoulder: .25,
		proximalShift: .003,
		proximalSpan: .025,
		hookStart: .31,
		hookShift: .011,
		sternumX: .016,
		sternumShoulder: .3,
		grainCells: 96,
		floorTone: .025,
		floorHeight: .025,
		floorRoughness: .95,
		floorOcclusion: .68,
		valveTone: .77,
		valveVariation: .03,
		valveLift: .44,
		valveOcclusion: .99,
		sternumTone: .018,
		sternumLift: .014,
		poreTone: .62,
		poreDepth: .3,
		poreRoughness: .28,
		poreOcclusion: .52,
		rapheTone: .66,
		rapheDepth: .31,
		rapheRoughness: .24,
		rapheOcclusion: .58,
		grainColor: .012,
		grainHeight: .003,
		grainRoughness: .012
	}),
	cardboardedge: Object.freeze({
		dark: [
			47,
			30,
			17
		],
		light: [
			209,
			168,
			111
		],
		roughness: .86,
		relief: .02,
		columns: 4,
		rows: 6,
		amplitude: .4,
		linerCenter: .445,
		linerHalfWidth: .045,
		mediumHalfWidth: .035
	}),
	hexnuts: Object.freeze({
		dark: [
			57,
			64,
			70
		],
		light: [
			217,
			224,
			229
		],
		roughness: .28,
		relief: .03,
		cells: 4,
		inradius: .38,
		outerBevel: .04,
		boreRadius: .19,
		boreBevel: .035,
		machining: 96
	}),
	capnuts: Object.freeze({
		dark: [
			57,
			64,
			70
		],
		light: [
			217,
			224,
			229
		],
		roughness: .28,
		relief: .03,
		cells: 4,
		inradius: .38,
		outerBevel: .04,
		cornerRadius: .421,
		cornerBevel: .025,
		domeRadius: .365,
		domeShoulder: .025,
		chamferStart: .37,
		chamferWidth: .05,
		backingColor: .15,
		hexColor: .62,
		domeColor: .78,
		chamferColor: .54,
		grainColor: .05,
		backingHeight: .05,
		hexHeight: .5,
		domeBase: .55,
		domeCrown: .42,
		chamferDrop: .07,
		grainHeight: .004,
		backingRoughness: .18,
		grainRoughness: .015,
		backingOcclusion: .45,
		faceOcclusion: .53,
		neckOcclusion: .14,
		neckWidth: .05
	}),
	flangenuts: Object.freeze({
		dark: [
			57,
			64,
			70
		],
		light: [
			217,
			224,
			229
		],
		roughness: .28,
		relief: .03,
		cells: 4,
		inradius: .3,
		outerBevel: .025,
		cornerRadius: .332,
		cornerBevel: .02,
		flangeRadius: .413,
		flangeBevel: .015,
		boreRadius: .185,
		boreBevel: .03,
		backingColor: .15,
		flangeColor: .55,
		hexColor: .66,
		grainColor: .05,
		backingHeight: .05,
		flangeHeight: .27,
		hexHeight: .62,
		coneRise: .08,
		grainHeight: .004,
		backingRoughness: .18,
		grainRoughness: .015,
		backingOcclusion: .45,
		faceOcclusion: .53,
		wallOcclusion: .12,
		wallWidth: .05
	}),
	calcite: Object.freeze({
		dark: [
			78,
			68,
			58
		],
		light: [
			238,
			232,
			218
		],
		roughness: .36,
		relief: .0035,
		cells: 4,
		chance: .9,
		halfMinimum: .21,
		halfVariation: .05,
		acuteDegrees: 75,
		jitter: .04,
		shoulder: .012,
		stepMinimum: .46,
		stepVariation: .22,
		stepOffset: .2,
		stepRise: .07
	}),
	halite: Object.freeze({
		dark: [
			128,
			110,
			104
		],
		light: [
			247,
			243,
			235
		],
		roughness: .42,
		relief: .004,
		cells: 4,
		chance: .92,
		halfMinimum: .21,
		halfVariation: .06,
		jitter: .045,
		shoulder: .012,
		terraceOne: .74,
		terraceTwo: .44,
		terraceVariation: .06,
		terraceDepth: .08
	}),
	waffleweave: Object.freeze({
		dark: [
			116,
			120,
			126
		],
		light: [
			238,
			238,
			233
		],
		roughness: .88,
		relief: .012,
		columns: 14,
		rows: 16,
		pocketX: .2,
		pocketY: .18,
		verticalRise: .7,
		horizontalRise: .9,
		floor: .18,
		rise: .4,
		bowl: .08,
		knot: .12
	}),
	fishscaleshingles: Object.freeze({
		dark: [
			118,
			108,
			86
		],
		light: [
			226,
			220,
			196
		],
		roughness: .5,
		relief: .012,
		lobes: 12,
		courses: 8,
		shoulder: .004,
		ramp: .7,
		base: .25,
		lip: .22,
		aoDepth: .45,
		aoWidth: .22,
		seamWidth: .006,
		seamDepth: .1,
		toneSpread: .1,
		seamColor: .32,
		seamAo: .5
	}),
	starfish: Object.freeze({
		dark: [
			84,
			82,
			76
		],
		light: [
			244,
			148,
			56
		],
		roughness: .66,
		relief: .02,
		cells: 3,
		chance: .95,
		radius: .4,
		radiusVariation: .05,
		discRadius: .25,
		baseWidth: .1,
		tipWidth: .07,
		armJitter: .1,
		lengthJitter: .06,
		jitter: .03,
		shoulder: .006,
		ridge: .18,
		dotPitch: .05,
		dotRadius: .017
	}),
	snubsquaretiles: Object.freeze({
		dark: [
			34,
			64,
			98
		],
		light: [
			238,
			226,
			192
		],
		roughness: .3,
		relief: .012,
		cells: 3,
		grout: .035,
		shoulder: .02
	}),
	rhombitrihexagonaltiles: Object.freeze({
		dark: [
			20,
			52,
			88
		],
		light: [
			244,
			232,
			200
		],
		roughness: .3,
		relief: .012,
		columns: 7,
		rows: 4,
		grout: .03,
		shoulder: .02
	}),
	elongatedtriangulartiles: Object.freeze({
		dark: [
			112,
			48,
			36
		],
		light: [
			232,
			214,
			170
		],
		roughness: .34,
		relief: .012,
		columns: 15,
		rows: 4,
		grout: .035,
		shoulder: .02
	}),
	truncatedtrihexagonaltiles: Object.freeze({
		dark: [
			40,
			40,
			86
		],
		light: [
			242,
			230,
			206
		],
		roughness: .3,
		relief: .012,
		columns: 7,
		rows: 4,
		grout: .03,
		shoulder: .02
	}),
	kisrhombilletiles: Object.freeze({
		dark: [
			28,
			70,
			84
		],
		light: [
			236,
			226,
			200
		],
		roughness: .3,
		relief: .012,
		columns: 7,
		rows: 4,
		grout: .02,
		shoulder: .015
	}),
	chladnifigure: Object.freeze({
		dark: [
			26,
			29,
			34
		],
		light: [
			232,
			220,
			194
		],
		roughness: .34,
		relief: .01,
		modeA: 5,
		modeB: 9,
		width: .012,
		gradientFloor: 3
	}),
	sierpinskicarpet: Object.freeze({
		dark: [
			62,
			52,
			44
		],
		light: [
			218,
			200,
			168
		],
		roughness: .55,
		relief: .02,
		shoulder: .14,
		inset: .04
	}),
	moorecurve: Object.freeze({
		dark: [
			46,
			42,
			40
		],
		light: [
			228,
			220,
			202
		],
		roughness: .45,
		relief: .015,
		halfWidth: .17,
		shoulder: .04
	}),
	papertape: Object.freeze({
		dark: [
			58,
			48,
			38
		],
		light: [
			236,
			224,
			196
		],
		roughness: .75,
		relief: .008,
		dataRadius: .36,
		sprocketRadius: .23,
		shoulder: .05,
		edge: .012
	}),
	ulamspiral: Object.freeze({
		dark: [
			30,
			38,
			58
		],
		light: [
			234,
			226,
			206
		],
		roughness: .8,
		domeRoughness: .3,
		relief: .02,
		domeRadius: .38,
		groove: .05
	}),
	sevensegment: Object.freeze({
		dark: [
			14,
			10,
			10
		],
		light: [
			255,
			150,
			40
		],
		roughness: .45,
		litRoughness: .2,
		relief: .03,
		halfLength: .3,
		halfWidth: .06,
		shoulder: .02
	}),
	perfectmaze: Object.freeze({
		dark: [
			48,
			42,
			36
		],
		light: [
			214,
			204,
			184
		],
		roughness: .55,
		floorRoughness: .85,
		relief: .03,
		halfWidth: .25,
		shoulder: .05
	}),
	rule30: Object.freeze({
		dark: [
			20,
			22,
			30
		],
		light: [
			226,
			222,
			208
		],
		roughness: .8,
		onRoughness: .3,
		relief: .03,
		halfSize: .42,
		shoulder: .05
	}),
	embossedbraille: Object.freeze({
		dark: [
			168,
			152,
			128
		],
		light: [
			244,
			236,
			216
		],
		roughness: .85,
		domeRoughness: .7,
		relief: .03,
		domeRadius: .3
	}),
	ean13label: Object.freeze({
		dark: [
			22,
			22,
			26
		],
		light: [
			246,
			244,
			236
		],
		roughness: .55,
		inkRoughness: .8,
		relief: .012,
		edge: .1
	}),
	soroban: Object.freeze({
		dark: [
			48,
			28,
			18
		],
		light: [
			228,
			198,
			142
		],
		roughness: .8,
		beadRoughness: .45,
		relief: .03,
		soft: .08
	}),
	deltoidaltrihexagonaltiles: Object.freeze({
		dark: [
			102,
			34,
			44
		],
		light: [
			238,
			228,
			204
		],
		roughness: .3,
		relief: .012,
		columns: 7,
		rows: 4,
		grout: .014,
		shoulder: .01
	}),
	snubtrihexagonaltiles: Object.freeze({
		dark: [
			24,
			60,
			86
		],
		light: [
			244,
			226,
			170
		],
		roughness: .3,
		relief: .012,
		columns: 7,
		rows: 4,
		grout: .012,
		shoulder: .008
	}),
	floretpentagonaltiles: Object.freeze({
		dark: [
			36,
			66,
			42
		],
		light: [
			236,
			218,
			150
		],
		roughness: .3,
		relief: .012,
		columns: 7,
		rows: 4,
		grout: .012,
		shoulder: .008
	}),
	prismaticpentagonaltiles: Object.freeze({
		dark: [
			30,
			58,
			76
		],
		light: [
			224,
			236,
			222
		],
		roughness: .3,
		relief: .012,
		columns: 15,
		rows: 4,
		grout: .025,
		shoulder: .018
	}),
	apollonianmosaic: Object.freeze({
		dark: [
			28,
			68,
			62
		],
		light: [
			236,
			218,
			170
		],
		roughness: .3,
		relief: .012,
		cells: 2,
		depth: 2,
		radius: .47,
		grout: .0015,
		shoulder: .003
	}),
	ichinghexagrams: Object.freeze({
		dark: [
			28,
			34,
			30
		],
		light: [
			226,
			216,
			178
		],
		roughness: .3,
		relief: .003,
		cells: 8,
		linePitch: .1,
		halfWidth: .36,
		halfGap: .08,
		halfHeight: .032,
		shoulder: .012
	}),
	pythagorastree: Object.freeze({
		dark: [
			100,
			32,
			30
		],
		light: [
			240,
			221,
			180
		],
		roughness: .3,
		relief: .012,
		cells: 2,
		depth: 4,
		scale: .2,
		centerY: 1.625,
		grout: .002,
		shoulder: .003
	}),
	pentominotiles: Object.freeze({
		dark: [
			28,
			55,
			103
		],
		light: [
			241,
			224,
			170
		],
		roughness: .3,
		relief: .012,
		repeatX: 5,
		repeatY: 3,
		edge: .22,
		grout: .15,
		shoulder: .15,
		tones: [
			.13,
			.47,
			.81
		],
		toneVariation: .06,
		layout: [
			`BBLEEE`,
			`BLLLCE`,
			`BDLCCE`,
			`BDJJCA`,
			`DDGJCA`,
			`DGGJJA`,
			`GGHHHA`,
			`KKIHFA`,
			`KIIHFF`,
			`KKIIFF`
		]
	}),
	langtonsant: Object.freeze({
		dark: [
			22,
			33,
			47
		],
		light: [
			238,
			217,
			153
		],
		roughness: .76,
		relief: .006,
		halfSize: .46,
		shoulder: .08,
		inkRoughness: .28,
		arrowRoughness: .23,
		arrowTip: .36,
		arrowTail: .3,
		arrowHalfWidth: .28,
		arrowShoulder: .04,
		rows: [
			0,
			0,
			0,
			0,
			0,
			0,
			384,
			196800,
			6592672,
			9599776,
			29636672,
			25050176,
			236320,
			7924768,
			4129312,
			1361696,
			1260064,
			1306656,
			396864,
			216e4,
			2890752,
			1591296,
			798720,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		],
		ant: [
			8,
			8,
			0,
			1
		]
	}),
	vogelspiral: Object.freeze({
		dark: [
			24,
			78,
			99
		],
		light: [
			238,
			225,
			174
		],
		roughness: .3,
		relief: .008,
		count: 97,
		radialStep: .044,
		radialOffset: .5,
		angle: Math.PI * (3 - Math.sqrt(5)),
		rotation: 0,
		radius: .033,
		shoulder: .003,
		bins: 8,
		tones: [
			.1,
			.46,
			.82
		],
		toneVariation: .06
	}),
	gosperinlay: Object.freeze({
		dark: [
			15,
			27,
			38
		],
		light: [
			222,
			172,
			70
		],
		roughness: .26,
		relief: .003,
		step: .04,
		radius: .0065,
		shoulder: .0018,
		bins: 16,
		directions: `0534001055324543310234312445053400105340012115401053400105532450553245433102321502234312445055324543124454331023433102321154010534001215022343310234312445433102321154012150223431244543124450553245053400105532454331023431244505340010534001211540105340010553245433102343124450534001053400121154012150223211540121154010553245431244505340012115401`
	}),
	pallasite: Object.freeze({
		dark: [
			43,
			61,
			13
		],
		light: [
			206,
			168,
			57
		],
		roughness: .28,
		relief: .002,
		cells: 8,
		jitter: .25,
		neighborRadius: 2,
		candidateRadius: 1,
		inset: .055,
		insetVariation: .09,
		shoulder: .035,
		metalRoughness: .19,
		fractureWidth: .012,
		fractureDepth: .012,
		grainCells: 96,
		toneBase: .22,
		toneVariation: .62,
		fractureOffset: .16,
		fractureDarkening: .18,
		fractureRoughness: .04,
		fractureOcclusion: .03,
		grainColor: .025,
		grainHeight: .002,
		grainRoughness: .02,
		baseHeight: .5,
		baseOcclusion: .99
	}),
	cuttlebone: Object.freeze({
		dark: [
			38,
			36,
			32
		],
		light: [
			242,
			239,
			224
		],
		roughness: .83,
		relief: .004,
		rows: 6,
		columns: 24,
		layerJitter: .12,
		jitter: .17,
		wave: .45,
		waveVariation: .35,
		waveSkew: .7,
		wallWidth: .045,
		wallCore: .025,
		septumWidth: .025,
		septumCore: .0125,
		grainCells: 96,
		floorTone: .04,
		floorHeight: .05,
		floorRoughness: .96,
		floorOcclusion: .2,
		faceTone: .88,
		faceHeight: .7,
		faceOcclusion: .97,
		grainColor: .04,
		grainHeight: .01,
		grainRoughness: .03
	}),
	watermelontourmaline: Object.freeze({
		dark: [
			28,
			89,
			45
		],
		light: [
			224,
			74,
			117
		],
		roughness: .23,
		relief: .003,
		cells: 4,
		jitter: .07,
		radius: .28,
		radiusVariation: .06,
		coreScale: .62,
		coreVariation: .1,
		bandWidth: .08,
		discRadiusSquared: 3,
		shoulder: .2,
		grainCells: 96,
		cloudCells: 8,
		cloudColor: .15,
		coreTone: .7,
		toneVariation: .1,
		rimTone: .06,
		grainColor: .012,
		grainHeight: .002,
		grainRoughness: .014,
		backingTone: .02,
		backingHeight: .12,
		backingRoughness: .84,
		backingOcclusion: .83,
		backingNeutral: 1,
		faceHeight: .6,
		faceOcclusion: .99
	}),
	leafstomata: Object.freeze({
		dark: [
			15,
			52,
			17
		],
		light: [
			137,
			174,
			70
		],
		roughness: .72,
		relief: .0035,
		cells: 5,
		jitter: .07,
		scaleMinimum: .86,
		scaleVariation: .19,
		outerX: .24,
		outerY: .36,
		poreX: .055,
		poreVariation: .025,
		poreY: .23,
		shoulder: .2,
		poreShoulder: .2,
		seamWidth: .018,
		grainCells: 96,
		skinCells: 12,
		skinTone: .25,
		skinColor: .06,
		grainColor: .012,
		skinHeight: .26,
		skinHeightVariation: .02,
		grainHeight: .003,
		skinGrainRoughness: .025,
		skinOcclusion: .96,
		poreDarkening: .21,
		poreDepth: .2,
		poreRoughness: .92,
		poreOcclusion: .34,
		guardTone: .43,
		guardToneVariation: .025,
		domeColor: .08,
		guardLift: .25,
		domeLift: .18,
		guardRoughness: .41,
		guardGrainRoughness: .02,
		guardOcclusion: .99,
		seamDarkening: .18,
		seamDepth: .09,
		seamRoughness: .12,
		seamOcclusion: .04
	}),
	chitonshells: Object.freeze({
		dark: [
			47,
			33,
			27
		],
		light: [
			210,
			166,
			116
		],
		roughness: .43,
		relief: .0055,
		cells: 3,
		plates: 8,
		jitter: .04,
		scaleMinimum: .87,
		scaleVariation: .2,
		outerX: .245,
		outerY: .405,
		innerX: .175,
		innerY: .325,
		shoulder: .16,
		innerShoulder: .16,
		chevron: .42,
		chevronRound: .024,
		frontBevel: .22,
		backBevel: .08,
		grainCells: 96,
		floorTone: .03,
		floorHeight: .035,
		floorRoughness: .94,
		floorOcclusion: .72,
		girdleTone: .14,
		girdleLift: .14,
		girdleRoughness: .82,
		girdleOcclusion: .94,
		underTone: .2,
		underLift: .16,
		underRoughness: .68,
		underOcclusion: .78,
		plateTone: .32,
		plateVariation: .07,
		plateLift: .25,
		lapRise: .12,
		roofLift: .055,
		roofColor: .025,
		lapColor: .03,
		plateOcclusion: .99,
		grainColor: .018,
		grainHeight: .006,
		grainRoughness: .02
	}),
	orbicularjasper: Object.freeze({
		dark: [
			24,
			68,
			47
		],
		light: [
			231,
			225,
			171
		],
		roughness: .22,
		relief: .004,
		cells: 5,
		centerMin: .42,
		centerVariation: .16,
		radiusMin: .22,
		radiusVariation: .17,
		shoulder: .16
	}),
	acornbarnacles: Object.freeze({
		dark: [
			63,
			66,
			60
		],
		light: [
			227,
			221,
			194
		],
		roughness: .78,
		relief: .04,
		cells: 4,
		radius: .44,
		edge: .04,
		crownStart: .13,
		crownWidth: .27,
		apertureInner: .1,
		apertureShoulder: .035,
		apertureRound: .005,
		ribStart: .14,
		ribShoulder: .04,
		striae: 48
	}),
	circularpavers: Object.freeze({
		dark: [
			66,
			64,
			56
		],
		light: [
			191,
			181,
			154
		],
		roughness: .78,
		relief: .02,
		cells: 2,
		courses: 4,
		sectors: 8,
		courseWidth: .09,
		grout: .006,
		bevel: .012
	}),
	snowflaketiles: Object.freeze({
		dark: [
			21,
			53,
			91
		],
		light: [
			230,
			241,
			246
		],
		roughness: .24,
		relief: .02,
		cells: 4,
		arms: 6,
		radius: .34,
		lineWidth: .014,
		branchPositions: [.13, .24],
		branchLength: .09,
		grout: .02,
		bevel: .04
	}),
	sawblades: Object.freeze({
		dark: [
			45,
			51,
			58
		],
		light: [
			218,
			225,
			232
		],
		roughness: .3,
		relief: .01,
		cells: 4,
		teeth: 24,
		rootRadius: .36,
		toothDepth: .08,
		toothRise: .8,
		edgeBevel: .008,
		boreRadius: .1,
		boreBevel: .015,
		machining: 80
	}),
	pistachios: Object.freeze({
		dark: [
			28,
			54,
			15
		],
		light: [
			238,
			221,
			174
		],
		roughness: .7,
		relief: .025,
		cells: 5,
		shellWidth: .24,
		shellLength: .43,
		openingWidth: .09,
		openingLength: .34,
		kernelWidth: .055,
		kernelLength: .28,
		shoulder: .2,
		fibers: 32
	}),
	polkadotfabric: Object.freeze({
		dark: [
			35,
			47,
			86
		],
		light: [
			239,
			233,
			213
		],
		roughness: .8,
		relief: .006,
		cells: 6,
		radius: .26,
		shoulder: .2,
		threads: 96
	}),
	cucumberslices: Object.freeze({
		dark: [
			24,
			66,
			22
		],
		light: [
			232,
			242,
			185
		],
		roughness: .34,
		relief: .015,
		cells: 3,
		radius: .45,
		edge: .015,
		rindStart: .4,
		rindWidth: .025,
		chambers: 3,
		chamberCenter: .19,
		chamberLength: .15,
		chamberWidth: .075,
		seedPositions: [
			.1,
			.19,
			.28
		],
		seedLength: .027,
		seedWidth: .014,
		shoulder: .25
	}),
	monsteraleaf: Object.freeze({
		dark: [
			11,
			35,
			14
		],
		light: [
			74,
			151,
			62
		],
		roughness: .4,
		relief: .03,
		cells: 3,
		width: .3,
		length: .4,
		shoulder: .18,
		levels: [
			-.23,
			-.07,
			.09
		],
		slope: .5,
		holeX: .115,
		holeLength: .045,
		holeWidth: .02,
		slitStart: .18,
		slitShoulder: .035,
		slitWidth: .018,
		notchY: -.38,
		notchWidth: .11,
		notchLength: .13,
		midribWidth: .015,
		veinWidth: .008
	}),
	crossstitch: Object.freeze({
		dark: [
			86,
			16,
			34
		],
		light: [
			238,
			222,
			187
		],
		roughness: .86,
		relief: .015,
		cells: 8,
		halfLength: .43,
		halfWidth: .06,
		endShoulder: .08,
		threads: 64,
		fibers: 3
	}),
	staranise: Object.freeze({
		dark: [
			40,
			14,
			6
		],
		light: [
			164,
			85,
			36
		],
		roughness: .87,
		relief: .03,
		cells: 3,
		pods: 8,
		podCenter: .25,
		podLength: .19,
		podWidth: .07,
		shoulder: .15,
		cavityLength: .12,
		cavityWidth: .032,
		seedCenter: .26,
		seedLength: .055,
		seedWidth: .018,
		hubRadius: .075
	}),
	logcabinparquet: Object.freeze({
		dark: [
			47,
			25,
			12
		],
		light: [
			203,
			155,
			92
		],
		roughness: .4,
		relief: .012,
		blocks: 2,
		units: 6,
		gap: .018,
		bevel: .035,
		boards: Object.freeze([
			[
				2,
				2,
				2,
				2
			],
			[
				4,
				2,
				1,
				2
			],
			[
				2,
				4,
				3,
				1
			],
			[
				1,
				2,
				1,
				3
			],
			[
				1,
				1,
				4,
				1
			],
			[
				5,
				1,
				1,
				4
			],
			[
				1,
				5,
				5,
				1
			],
			[
				0,
				1,
				1,
				5
			],
			[
				0,
				0,
				6,
				1
			]
		])
	}),
	countersunkmetal: Object.freeze({
		dark: [
			31,
			38,
			45
		],
		light: [
			213,
			222,
			231
		],
		roughness: .28,
		relief: .02,
		cells: 6,
		boreRadius: .11,
		boreShoulder: .025,
		coneRadius: .3,
		coneShoulder: .12
	}),
	trilobitefossil: Object.freeze({
		dark: [
			45,
			38,
			25
		],
		light: [
			192,
			180,
			145
		],
		roughness: .8,
		relief: .025,
		cells: 3,
		headWidth: .25,
		headLength: .18,
		headCenter: -.2,
		bodyWidth: .19,
		bodyLength: .29,
		bodyCenter: .04,
		tailWidth: .11,
		tailLength: .09,
		tailCenter: .29,
		shoulder: .18,
		axisWidth: .055,
		segments: 10,
		segmentStart: -.035,
		segmentPitch: .027,
		segmentCurve: .8,
		eyeOffset: .13,
		eyeCenter: -.22,
		eyeRadius: .025
	}),
	eyeletcotton: Object.freeze({
		dark: [
			40,
			37,
			31
		],
		light: [
			239,
			234,
			213
		],
		roughness: .85,
		relief: .02,
		cells: 6,
		holeRadius: .14,
		holeShoulder: .04,
		rimRadius: .22,
		rimWidth: .06,
		stitches: 16,
		threads: 72
	}),
	dendriticagate: Object.freeze({
		dark: [
			30,
			28,
			23
		],
		light: [
			228,
			217,
			188
		],
		roughness: .24,
		relief: .004,
		cells: 3,
		levels: 5,
		rootOffset: .32,
		branchLength: .27,
		lengthDecay: .67,
		branchWidth: .018,
		widthDecay: .7,
		supportRadius: .43
	}),
	ravioli: Object.freeze({
		dark: [
			75,
			47,
			19
		],
		light: [
			248,
			218,
			130
		],
		roughness: .67,
		relief: .025,
		cells: 4,
		halfWidth: .44,
		shoulder: .03,
		scallop: .01,
		pillowRadius: .3,
		crimpCenter: .37,
		crimpWidth: .045,
		crimpSpan: .34,
		crimps: 8
	}),
	rollerchain: Object.freeze({
		dark: [
			25,
			29,
			31
		],
		light: [
			195,
			207,
			216
		],
		roughness: .43,
		relief: .025,
		columns: 6,
		rows: 4,
		headRadius: .22,
		waistRadius: .12,
		bridgeLength: .55,
		bevel: .25,
		pinRadius: .085,
		pinCore: .065,
		collarRadius: .11,
		collarWidth: .02
	}),
	mapleleaf: Object.freeze({
		dark: [
			39,
			13,
			6
		],
		light: [
			219,
			110,
			32
		],
		roughness: .7,
		relief: .022,
		cells: 3,
		lobes: 5,
		innerRadius: .18,
		lobeDepth: .17,
		serration: .012,
		tipRoundness: .03,
		edgeSquared: .014,
		veinRoot: .08,
		veinTip: .335,
		veinWidth: .01,
		stemCenter: .27,
		stemLength: .18,
		stemWidth: .013
	}),
	smocking: Object.freeze({
		dark: [
			35,
			39,
			65
		],
		light: [
			171,
			181,
			222
		],
		roughness: .86,
		relief: .024,
		columns: 6,
		rows: 6,
		spread: .23,
		foldWidth: .1,
		stitchWidth: .085,
		stitchHeight: .023,
		threads: 96
	}),
	quatrefoiltile: Object.freeze({
		dark: [
			16,
			44,
			58
		],
		light: [
			108,
			200,
			204
		],
		roughness: .27,
		relief: .018,
		cells: 5,
		lobeOffset: .24,
		lobeRadius: .205,
		coreRadius: .23,
		shoulder: .008,
		dotRadius: .42,
		dotShoulder: .018
	}),
	okraslice: Object.freeze({
		dark: [
			23,
			49,
			17
		],
		light: [
			235,
			239,
			171
		],
		roughness: .48,
		relief: .022,
		cells: 3,
		radius: .35,
		lobeDepth: .055,
		edge: .012,
		rind: .028,
		chambers: 5,
		chamberDistance: .2,
		chamberLong: .09,
		chamberShort: .075,
		chamberShoulder: .3,
		seedOffset: .032,
		seedRadius: .024
	}),
	eggcarton: Object.freeze({
		dark: [
			88,
			84,
			76
		],
		light: [
			196,
			190,
			174
		],
		roughness: .9,
		relief: .03,
		cells: 4,
		cupRadius: .37,
		cupShoulder: .05,
		ribRadius: .23,
		ribBand: .04,
		peakRadius: .3
	}),
	greekkey: Object.freeze({
		dark: [
			26,
			32,
			54
		],
		light: [
			212,
			176,
			98
		],
		roughness: .46,
		relief: .026,
		cells: 3,
		halfWidth: .075,
		coreWidth: .034,
		segments: [
			[
				0,
				.88,
				.14,
				.88
			],
			[
				.14,
				.88,
				.14,
				.12
			],
			[
				.14,
				.12,
				.86,
				.12
			],
			[
				.86,
				.12,
				.86,
				.88
			],
			[
				.38,
				.88,
				1,
				.88
			],
			[
				.38,
				.88,
				.38,
				.4
			],
			[
				.38,
				.4,
				.62,
				.4
			],
			[
				.62,
				.4,
				.62,
				.64
			]
		]
	}),
	seedbeads: Object.freeze({
		dark: [
			14,
			30,
			66
		],
		light: [
			238,
			198,
			110
		],
		roughness: .22,
		relief: .028,
		columns: 6,
		rows: 8,
		halfLength: .46,
		halfHeight: .4,
		shoulder: .18,
		holeOffset: .4,
		holeRadius: .09
	}),
	chainstitch: Object.freeze({
		dark: [
			22,
			37,
			53
		],
		light: [
			236,
			177,
			87
		],
		roughness: .82,
		relief: .024,
		columns: 5,
		rows: 6,
		halfWidth: .24,
		halfLength: .65,
		taper: .45,
		band: .3,
		threads: 96
	}),
	wingnuts: Object.freeze({
		dark: [
			49,
			57,
			65
		],
		light: [
			220,
			228,
			234
		],
		roughness: .3,
		relief: .028,
		cells: 4,
		hubRadius: .19,
		hubShoulder: .018,
		boreRadius: .075,
		boreShoulder: .003,
		wingOffset: .24,
		wingLift: .08,
		wingLength: .21,
		wingWidth: .105,
		wingAngle: .5,
		wingShoulder: .45
	}),
	pomegranateslice: Object.freeze({
		dark: [
			112,
			7,
			29
		],
		light: [
			255,
			236,
			204
		],
		roughness: .78,
		relief: .022,
		cells: 3,
		radius: .44,
		innerRadius: .39,
		edge: .012,
		chambers: 6,
		chamberDistance: .22,
		chamberLong: .155,
		chamberShort: .09,
		chamberShoulder: .3,
		arilLong: .035,
		arilShort: .023,
		arils: [
			[0, 0],
			[-.09, 0],
			[.09, 0],
			[-.045, -.045],
			[-.045, .045],
			[.045, -.045],
			[.045, .045]
		]
	}),
	pawprinttiles: Object.freeze({
		dark: [
			14,
			45,
			83
		],
		light: [
			249,
			238,
			211
		],
		roughness: .27,
		relief: .018,
		cells: 4,
		grout: .028,
		shoulder: .3,
		toeWidth: .065,
		toeHeight: .095,
		toes: [
			[
				-.24,
				-.11,
				-.45
			],
			[
				-.09,
				-.24,
				-.15
			],
			[
				.09,
				-.24,
				.15
			],
			[
				.24,
				-.11,
				.45
			]
		],
		pads: [
			[
				0,
				.06,
				.15
			],
			[
				-.1,
				.15,
				.09
			],
			[
				0,
				.18,
				.09
			],
			[
				.1,
				.15,
				.09
			]
		]
	}),
	dovetailjoint: Object.freeze({
		dark: [
			53,
			25,
			11
		],
		light: [
			214,
			166,
			99
		],
		roughness: .62,
		relief: .022,
		columns: 4,
		rows: 2,
		seamY: .5,
		tipY: .8,
		neckHalfWidth: .14,
		flare: .14,
		bevel: .025
	}),
	starsocketbolts: Object.freeze({
		dark: [
			45,
			53,
			61
		],
		light: [
			221,
			229,
			235
		],
		roughness: .32,
		relief: .024,
		cells: 4,
		capRadius: .4,
		capShoulder: .025,
		socketRadius: .12,
		lobeDepth: .035,
		socketShoulder: .003
	}),
	sanddollar: Object.freeze({
		dark: [
			75,
			63,
			45
		],
		light: [
			245,
			234,
			202
		],
		roughness: .82,
		relief: .022,
		cells: 3,
		radiusX: .44,
		radiusY: .4,
		edge: .15,
		petals: 5,
		petalDistance: .16,
		petalLong: .12,
		petalShort: .045,
		petalBand: .28,
		lunuleDistance: .315,
		lunuleLong: .052,
		lunuleShort: .017,
		lunuleShoulder: .4
	}),
	brogueleather: Object.freeze({
		dark: [
			34,
			13,
			7
		],
		light: [
			187,
			107,
			51
		],
		roughness: .48,
		relief: .024,
		cells: 3,
		petals: 6,
		petalDistance: .17,
		petalLong: .065,
		petalShort: .035,
		centerRadius: .045,
		shoulder: .35,
		borderRows: [.36, .43],
		borderColumns: 8,
		borderRadius: .018
	}),
	clovebuds: Object.freeze({
		dark: [
			29,
			12,
			5
		],
		light: [
			151,
			89,
			42
		],
		roughness: .82,
		relief: .04,
		cells: 4,
		stemCenter: .12,
		stemLength: .25,
		stemWidth: .038,
		headY: -.235,
		headRadius: .09,
		collarY: -.135,
		sepalDistance: .065,
		sepalLength: .075,
		sepalWidth: .027,
		shoulder: .42
	}),
	starcrosstiles: Object.freeze({
		dark: [
			10,
			56,
			61
		],
		light: [
			240,
			231,
			205
		],
		roughness: .27,
		relief: .016,
		cells: 4,
		halfSquare: Math.SQRT1_2 / 2,
		grout: .008,
		bevel: .012
	}),
	maplesamara: Object.freeze({
		dark: [
			37,
			23,
			10
		],
		light: [
			218,
			179,
			102
		],
		roughness: .72,
		relief: .04,
		cells: 4,
		angle: Math.PI / 4,
		originX: .035,
		originY: .18,
		wingCenter: .22,
		wingLength: .21,
		wingBaseWidth: .035,
		wingFlare: .07,
		seedCenter: .04,
		seedLength: .065,
		seedWidth: .045,
		stalkWidth: .09,
		stalkHeight: .018,
		shoulder: .42,
		veins: 3
	}),
	lenoweave: Object.freeze({
		dark: [
			29,
			25,
			19
		],
		light: [
			232,
			218,
			179
		],
		roughness: .8,
		relief: .012,
		columns: 6,
		rows: 6,
		warpOffset: .18,
		warpWidth: .05,
		weftWidth: .055,
		fibers: 96
	}),
	circlips: Object.freeze({
		dark: [
			25,
			29,
			33
		],
		light: [
			205,
			211,
			216
		],
		roughness: .36,
		relief: .04,
		cells: 4,
		innerRadius: .22,
		outerRadius: .31,
		ringShoulder: .008,
		gapWidth: .105,
		gapShoulder: .003,
		gapStart: .13,
		gapFade: .06,
		lugX: .13,
		lugY: .25,
		lugRadius: .062,
		lugShoulder: .0014,
		boreRadius: .022,
		boreShoulder: 18e-5
	}),
	eclips: Object.freeze({
		dark: [
			23,
			29,
			33
		],
		light: [
			229,
			234,
			238
		],
		roughness: .31,
		relief: .004,
		cells: 4,
		outerRadius: .34,
		outerCore: .325,
		innerRadius: .145,
		innerCore: .16,
		gapHalf: .17,
		gapCore: .155,
		gapTop: -.01,
		gapFade: .025,
		flareStart: .23,
		flareRange: .1,
		flareWidth: .025,
		jitter: .01,
		turn: .12,
		scaleMin: .94,
		scaleRange: .06,
		backgroundColor: .035,
		backgroundHeight: .025,
		backgroundRoughness: .94,
		backgroundOcclusion: .32,
		faceColor: .82,
		faceColorVariation: .07,
		faceHeight: .5,
		microRelief: .003,
		grainColor: .025,
		grainRoughness: .025,
		faceOcclusion: .98,
		pocketRadius: .29,
		pocketCore: .275,
		pocketBottom: 0,
		pocketFade: .018,
		lugHalf: .045,
		lugSlope: .35,
		lugShoulder: .016
	}),
	tuliptiles: Object.freeze({
		dark: [
			12,
			43,
			86
		],
		light: [
			248,
			238,
			211
		],
		roughness: .25,
		relief: .016,
		cells: 4,
		faceSquared: .23,
		faceShoulder: .018,
		shoulder: .35,
		stemY: .13,
		stemLength: .2,
		stemWidth: .012,
		lobes: [
			[
				0,
				-.18,
				.068,
				.17,
				0
			],
			[
				.085,
				-.16,
				.068,
				.17,
				.35
			],
			[
				-.085,
				-.16,
				.068,
				.17,
				-.35
			],
			[
				.075,
				.19,
				.04,
				.15,
				.65
			],
			[
				-.075,
				.19,
				.04,
				.15,
				-.65
			]
		]
	}),
	gingerslice: Object.freeze({
		dark: [
			69,
			36,
			10
		],
		light: [
			244,
			215,
			141
		],
		roughness: .76,
		relief: .035,
		cells: 4,
		rindWidth: .02,
		shoulder: .06,
		lobes: [
			[
				-.12,
				-.08,
				.19
			],
			[
				.12,
				-.04,
				.15
			],
			[
				.04,
				.14,
				.14
			],
			[
				-.1,
				.13,
				.1
			]
		]
	}),
	fivebarplate: Object.freeze({
		dark: [
			48,
			52,
			56
		],
		light: [
			218,
			222,
			225
		],
		roughness: .43,
		relief: .018,
		cells: 4,
		bars: 5,
		spacing: .075,
		halfLength: .26,
		radius: .018,
		shoulder: 2e-4
	}),
	cinnamonswirl: Object.freeze({
		dark: [
			66,
			28,
			12
		],
		light: [
			247,
			211,
			147
		],
		roughness: .74,
		relief: .026,
		cells: 4,
		radius: .4,
		shoulder: .016,
		pitch: .095,
		core: .04,
		fillingRadius: .35,
		fillingShoulder: .015,
		crustStrength: .24
	}),
	wheatears: Object.freeze({
		dark: [
			55,
			36,
			16
		],
		light: [
			234,
			195,
			106
		],
		roughness: .8,
		relief: .025,
		cells: 4,
		pairs: 5,
		spacing: .07,
		offset: .055,
		kernelLength: .073,
		kernelWidth: .027,
		grooveWidth: .006,
		awnCenter: .13,
		awnLength: .105,
		awnWidth: .0035,
		stalkWidth: .009,
		stalkLength: .3,
		stalkCenter: .06,
		shoulder: .2
	}),
	scalemail: Object.freeze({
		dark: [
			36,
			43,
			49
		],
		light: [
			215,
			224,
			230
		],
		roughness: .39,
		relief: .024,
		columns: 6,
		rows: 8,
		width: .6,
		length: .76,
		shoulder: .16,
		ridgeWidth: .16,
		ridgeLength: .68,
		rivetY: -.32,
		rivetRadius: .065
	}),
	trihexagonaltiles: Object.freeze({
		dark: [
			26,
			69,
			105
		],
		light: [
			244,
			237,
			209
		],
		roughness: .48,
		relief: .025,
		columns: 7,
		rows: 8,
		apothem: Math.sqrt(3) / 2,
		rowStep: Math.sqrt(3),
		grout: .025,
		bevel: .018
	}),
	burlwood: Object.freeze({
		dark: [
			50,
			23,
			10
		],
		light: [
			199,
			132,
			63
		],
		roughness: .43,
		relief: .004,
		cells: 3,
		radiusX: .34,
		radiusY: .29,
		core: .035,
		rings: 3,
		centers: [
			[.44, .51],
			[.55, .45],
			[.48, .56],
			[.56, .54],
			[.43, .44],
			[.51, .49],
			[.47, .43],
			[.54, .56],
			[.45, .53]
		]
	}),
	slottedmetal: Object.freeze({
		dark: [
			31,
			37,
			42
		],
		light: [
			216,
			222,
			226
		],
		roughness: .38,
		relief: .022,
		columns: 8,
		rows: 4,
		spine: .43,
		outerRadius: .18,
		coreRadius: .13
	}),
	peppercorns: Object.freeze({
		dark: [
			10,
			8,
			6
		],
		light: [
			119,
			94,
			65
		],
		roughness: .87,
		relief: .022,
		cells: 5,
		radius: .35,
		shoulder: .16,
		scarRadius: .045
	}),
	castellatednuts: Object.freeze({
		dark: [
			33,
			40,
			45
		],
		light: [
			220,
			226,
			230
		],
		roughness: .37,
		relief: .022,
		cells: 4,
		inradius: .33,
		outerBevel: .018,
		boreRadius: .13,
		boreBevel: .018,
		slotCenter: .34,
		slotLength: .15,
		slotWidth: .028,
		shoulder: .2
	}),
	farfalle: Object.freeze({
		dark: [
			75,
			45,
			17
		],
		light: [
			249,
			219,
			132
		],
		roughness: .66,
		relief: .023,
		cells: 4,
		halfLength: .36,
		waist: .065,
		wingSpread: .21,
		wingRun: .32,
		shoulder: .014,
		scallop: .012,
		teeth: 20,
		pinchRadius: .08
	}),
	cardamompods: Object.freeze({
		dark: [
			25,
			29,
			9
		],
		light: [
			183,
			187,
			99
		],
		roughness: .76,
		relief: .023,
		cells: 4,
		halfLength: .34,
		halfWidth: .15,
		shoulder: .12,
		tipFloor: .04,
		stemCenter: .32,
		stemLength: .1,
		stemWidth: .018
	}),
	brickarches: Object.freeze({
		dark: [
			83,
			30,
			19
		],
		light: [
			215,
			118,
			76
		],
		roughness: .87,
		relief: .03,
		cells: 4,
		outerRadius: .36,
		innerRadius: .23,
		centerY: .04,
		voussoirs: 9,
		pierRows: 3,
		courseHeight: .11,
		gap: .004,
		bevel: .01
	}),
	knottednet: Object.freeze({
		dark: [
			20,
			21,
			13
		],
		light: [
			201,
			177,
			118
		],
		roughness: .83,
		relief: .022,
		cells: 6,
		sag: .13,
		cordWidth: .033,
		knotLength: .13,
		knotWidth: .055,
		creaseWidth: .017,
		creaseLength: .08,
		twists: 8
	}),
	fiddleheads: Object.freeze({
		dark: [
			17,
			30,
			11
		],
		light: [
			143,
			188,
			78
		],
		roughness: .79,
		relief: .023,
		cells: 4,
		outerRadius: .23,
		innerRadius: .04,
		coilY: -.1,
		turns: 1.5,
		coilSegments: 72,
		stemSegments: 24,
		width: .028,
		taper: .4,
		shoulder: .7,
		stemControlY: .04,
		stemBendX: .16,
		stemBendY: .2,
		stemEndX: .12,
		stemEndY: .36
	}),
	cowrieshells: Object.freeze({
		dark: [
			45,
			31,
			19
		],
		light: [
			241,
			222,
			186
		],
		roughness: .53,
		relief: .025,
		cells: 4,
		halfWidth: .23,
		halfLength: .36,
		shoulder: .16,
		apertureWidth: .035,
		apertureLength: .27,
		teeth: 9,
		toothPitch: .048,
		toothX: .08,
		toothLength: .055,
		toothWidth: .016
	}),
	cotterpins: Object.freeze({
		dark: [
			27,
			34,
			39
		],
		light: [
			211,
			220,
			227
		],
		roughness: .36,
		relief: .025,
		cells: 4,
		eyeY: -.2,
		outerWidth: .115,
		outerLength: .135,
		innerWidth: .065,
		innerLength: .085,
		wireWidth: .022,
		shoulder: .25,
		legs: Object.freeze([
			[
				-.035,
				-.08,
				-.035,
				.17
			],
			[
				-.035,
				.17,
				-.12,
				.32
			],
			[
				.035,
				-.08,
				.035,
				.26
			],
			[
				.035,
				.26,
				.15,
				.36
			]
		])
	}),
	garterstitch: Object.freeze({
		dark: [
			117,
			106,
			88
		],
		light: [
			246,
			237,
			219
		],
		roughness: .91,
		relief: .007,
		columns: 24,
		rows: 20,
		halfWidth: .43,
		halfHeight: .28,
		band: .8,
		loopOffset: .09,
		clip: .12,
		courseWidth: .49,
		wander: .16
	}),
	seedstitch: Object.freeze({
		dark: [
			20,
			34,
			27
		],
		light: [
			143,
			173,
			138
		],
		roughness: .9,
		relief: .012,
		cells: 12,
		armX: .23,
		armTop: -.25,
		armBottom: .25,
		yarnWidth: .07,
		purlLength: .24,
		purlWidth: .09,
		purlY: -.02
	}),
	mangosteenslice: Object.freeze({
		dark: [
			38,
			2,
			31
		],
		light: [
			250,
			248,
			228
		],
		roughness: .48,
		relief: .025,
		cells: 4,
		lobes: 6,
		radius: .44,
		innerRadius: .34,
		rimShoulder: .025,
		lobeCenter: .17,
		lobeLength: .16,
		lobeWidth: .09,
		hubRadius: .07,
		shoulder: .25
	}),
	pickettiles: Object.freeze({
		dark: [
			19,
			65,
			70
		],
		light: [
			129,
			199,
			185
		],
		roughness: .23,
		relief: .008,
		columns: 9,
		rows: 4,
		gap: .018,
		bevel: .045
	}),
	squarewashers: Object.freeze({
		dark: [
			25,
			32,
			38
		],
		light: [
			213,
			222,
			227
		],
		roughness: .34,
		relief: .025,
		cells: 4,
		halfWidth: .28,
		bevel: .025,
		holeRadius: .12,
		holeBevel: .025
	}),
	eucalyptusleaf: Object.freeze({
		dark: [
			20,
			39,
			37
		],
		light: [
			142,
			176,
			161
		],
		roughness: .64,
		relief: .018,
		cells: 4,
		centerY: .02,
		halfLength: .34,
		halfWidth: .105,
		bend: .035,
		shoulder: .12,
		stemStart: -.4,
		stemEnd: -.26,
		stemWidth: .012,
		stemShoulder: .02,
		midribWidth: .007,
		midribLength: .31,
		midribFade: .045,
		veinPairs: 5,
		veinSpacing: .1,
		veinSlope: .8,
		veinWidth: .005,
		veinAxisFade: .02
	}),
	twillweave: Object.freeze({
		dark: [
			45,
			29,
			22
		],
		light: [
			220,
			190,
			142
		],
		roughness: .86,
		relief: .012,
		cells: 16,
		halfWidth: .32,
		exposureHalf: .42,
		exposureShoulder: .08
	}),
	pumpkinseeds: Object.freeze({
		dark: [
			48,
			43,
			29
		],
		light: [
			242,
			234,
			203
		],
		roughness: .64,
		relief: .018,
		cells: 4,
		halfLength: .3,
		halfWidth: .15,
		shoulder: .1,
		rimInset: .32
	}),
	spurgears: Object.freeze({
		dark: [
			25,
			31,
			37
		],
		light: [
			221,
			227,
			231
		],
		roughness: .32,
		relief: .025,
		cells: 4,
		teeth: 12,
		bodyRadius: .265,
		bodyBevel: .02,
		boreRadius: .1,
		boreBevel: .02,
		hubRadius: .165,
		hubBevel: .02,
		toothRoot: .23,
		toothTip: .36,
		toothHalfWidth: .038,
		toothBevel: .012
	}),
	diamondcheckertiles: Object.freeze({
		dark: [
			18,
			20,
			24
		],
		light: [
			239,
			232,
			209
		],
		roughness: .25,
		relief: .02,
		cells: 4,
		grout: .012,
		bevel: .018
	}),
	appleslice: Object.freeze({
		dark: [
			115,
			24,
			15
		],
		light: [
			252,
			243,
			212
		],
		roughness: .58,
		relief: .02,
		cells: 4,
		radius: .38,
		peelBevel: .008,
		fleshRadius: .35,
		fleshBevel: .008,
		coreRadius: .19,
		coreBevel: .015,
		chambers: 5,
		chamberCenter: .1,
		chamberLength: .065,
		chamberWidth: .038,
		chamberShoulder: .18,
		seedCenter: .105,
		seedLength: .035,
		seedWidth: .014,
		seedShoulder: .2
	}),
	linchpins: Object.freeze({
		dark: [
			18,
			22,
			27
		],
		light: [
			232,
			237,
			242
		],
		roughness: .31,
		relief: .006,
		cells: 4,
		ringRadius: .27,
		wireWidth: .018,
		shaftLeft: -.28,
		shaftRight: .34,
		shaftRadius: .043,
		headX: -.29,
		headHalfX: .07,
		headHalfY: .085,
		shoulder: .3
	}),
	rclips: Object.freeze({
		dark: [
			24,
			31,
			38
		],
		light: [
			228,
			236,
			241
		],
		roughness: .3,
		relief: .004,
		cells: 4,
		wireWidth: .018,
		shoulder: .4,
		arcFade: .015,
		legs: Object.freeze([
			[
				-.12,
				-.25,
				-.12,
				.39
			],
			[
				.12,
				-.25,
				.12,
				-.18
			],
			[
				.12,
				-.18,
				.105,
				-.15
			],
			[
				.105,
				-.15,
				-.045,
				-.065
			],
			[
				-.045,
				-.065,
				-.065,
				-.045
			],
			[
				-.065,
				-.045,
				-.062,
				-.022
			],
			[
				-.062,
				-.022,
				-.03,
				.04
			],
			[
				-.03,
				.04,
				-.02,
				.075
			],
			[
				-.02,
				.075,
				-.035,
				.11
			],
			[
				-.035,
				.11,
				-.065,
				.16
			],
			[
				-.065,
				.16,
				-.06,
				.185
			],
			[
				-.06,
				.185,
				-.035,
				.215
			],
			[
				-.035,
				.215,
				.025,
				.31
			]
		]),
		bends: Object.freeze([[
			0,
			-.25,
			.12,
			-1
		]])
	}),
	paperclips: Object.freeze({
		dark: [
			26,
			31,
			36
		],
		light: [
			221,
			227,
			232
		],
		roughness: .29,
		relief: .02,
		cells: 4,
		wireWidth: .018,
		shoulder: .35,
		arcFade: .035,
		legs: [
			[
				-.13,
				-.1,
				-.13,
				.22
			],
			[
				.13,
				.22,
				.13,
				-.2
			],
			[
				-.05,
				-.2,
				-.05,
				.15
			]
		],
		bends: [[
			0,
			.22,
			.13,
			1
		], [
			.04,
			-.2,
			.09,
			-1
		]]
	}),
	ivyleaf: Object.freeze({
		dark: [
			17,
			45,
			22
		],
		light: [
			139,
			180,
			91
		],
		roughness: .59,
		relief: .02,
		cells: 4,
		shoulder: .06,
		lobes: [
			[
				0,
				-.02,
				.16,
				.31,
				0
			],
			[
				-.1,
				.05,
				.14,
				.27,
				55 * Math.PI / 180
			],
			[
				.1,
				.05,
				.14,
				.27,
				-55 * Math.PI / 180
			]
		],
		veinRoot: .18,
		veinWidth: .009,
		stemStart: .18,
		stemEnd: .36,
		stemWidth: .014,
		stemShoulder: .35
	}),
	ribknit: Object.freeze({
		dark: [
			66,
			28,
			35
		],
		light: [
			222,
			161,
			150
		],
		roughness: .88,
		relief: .025,
		cells: 12,
		armX: .23,
		armTop: -.24,
		armBottom: .24,
		yarnWidth: .085,
		purlLength: .18,
		purlWidth: .09,
		purlY: 0
	}),
	pillowtiles: Object.freeze({
		dark: [
			64,
			71,
			70
		],
		light: [
			226,
			224,
			200
		],
		roughness: .27,
		relief: .018,
		cells: 6,
		halfWidth: .45,
		shoulder: .18
	}),
	coffeerings: Object.freeze({
		dark: [
			85,
			41,
			18
		],
		light: [
			245,
			232,
			200
		],
		roughness: .89,
		relief: .004,
		cells: 3,
		radius: .31,
		radiusVariation: .04,
		minorRatio: .92,
		centerJitter: .07,
		ringBand: .16,
		innerShoulder: .2,
		warp: .04
	}),
	cashews: Object.freeze({
		dark: [
			53,
			32,
			18
		],
		light: [
			233,
			211,
			164
		],
		roughness: .67,
		relief: .028,
		cells: 4,
		outerX: .27,
		outerY: .34,
		openingX: .18,
		openingRadiusX: .24,
		openingRadiusY: .27,
		tipX: .13,
		tipY: .245,
		tipRadii: [.09, .08],
		shoulder: .2,
		turn: Math.PI / 4
	}),
	hinges: Object.freeze({
		dark: [
			27,
			31,
			36
		],
		light: [
			199,
			205,
			211
		],
		roughness: .32,
		relief: .035,
		cells: 4,
		leafX: .2,
		leafHalfWidth: .145,
		leafHalfLength: .31,
		shoulder: .2,
		screwX: .22,
		screwPitch: .19,
		boreRadius: .023,
		seatRadius: .052,
		seatInnerRadius: .026,
		barrelRadius: .075,
		barrelHalfLength: .35,
		knucklePitch: .14,
		jointShoulder: .075,
		pinRadius: .022,
		pinHalfLength: .38,
		endShoulder: .025
	}),
	dowelpins: Object.freeze({
		dark: [
			26,
			32,
			38
		],
		light: [
			225,
			232,
			237
		],
		roughness: .31,
		relief: .0032,
		cells: 4,
		jitter: .016,
		scale: .92,
		scaleVariation: .03,
		shankLeft: -.36,
		shankRight: .36,
		shankHalfWidth: .095,
		tipChamfer: .018,
		tipSlope: .8,
		bevel: .012,
		shankCrown: .085,
		endRound: .018
	}),
	clevispins: Object.freeze({
		dark: [
			26,
			32,
			38
		],
		light: [
			225,
			232,
			237
		],
		roughness: .31,
		relief: .0032,
		cells: 4,
		jitter: .016,
		scale: .92,
		scaleVariation: .03,
		headLeft: -.38,
		headRight: -.28,
		headHalfWidth: .18,
		shankLeft: -.3,
		shankRight: .37,
		shankHalfWidth: .11,
		tipChamfer: .025,
		tipSlope: .58,
		bevel: .012,
		holeX: .265,
		holeRadius: .034,
		holeCore: .028,
		shankCrown: .07,
		headCrown: .05
	}),
	gibheadkeys: Object.freeze({
		dark: [
			35,
			40,
			43
		],
		light: [
			225,
			231,
			236
		],
		roughness: .34,
		relief: .0022,
		cells: 4,
		jitter: .025,
		scale: .94,
		scaleVariation: .03,
		halfLength: .42,
		bottom: -.1,
		bodyTop: .07,
		taper: .01,
		headEnd: -.19,
		headTop: .2,
		headDiagonal: .51,
		bevel: .012
	}),
	parallelkeys: Object.freeze({
		dark: [
			35,
			40,
			43
		],
		light: [
			225,
			231,
			236
		],
		roughness: .32,
		relief: .003,
		cells: 4,
		halfSegment: .27,
		radius: .095,
		bevel: .016,
		jitter: .04,
		scale: .96,
		scaleVariation: .025
	}),
	woodruffkeys: Object.freeze({
		dark: [
			35,
			40,
			43
		],
		light: [
			225,
			231,
			236
		],
		roughness: .32,
		relief: .004,
		cells: 4,
		radius: .4,
		chord: .1,
		bevel: .018,
		jitter: .04,
		scale: .96,
		scaleVariation: .025
	}),
	coins: Object.freeze({
		dark: [
			66,
			40,
			8
		],
		light: [
			244,
			205,
			97
		],
		roughness: .31,
		relief: .012,
		cells: 4,
		radius: .4,
		diskShoulder: .015,
		rimInner: .32,
		rimOuter: .385,
		rimShoulder: .008,
		points: 5,
		starRadius: .25,
		starInnerRadius: .11,
		starBase: .055,
		starBevel: .012
	}),
	righttriangletiles: Object.freeze({
		dark: [
			38,
			64,
			83
		],
		light: [
			224,
			233,
			230
		],
		roughness: .34,
		relief: .035,
		cells: 4,
		grout: .025,
		bevel: .045
	}),
	cherryblossom: Object.freeze({
		dark: [
			112,
			24,
			64
		],
		light: [
			255,
			236,
			219
		],
		roughness: .72,
		relief: .02,
		cells: 4,
		petals: 5,
		petalCenter: .15,
		petalLength: .22,
		petalWidth: .125,
		notchCenter: .37,
		notchLength: .06,
		notchWidth: .035,
		shoulder: .2,
		centerRadius: .045,
		centerShoulder: 8e-4,
		pollenCount: 12,
		pollenDistance: .065,
		pollenRadius: .009
	}),
	punchcard: Object.freeze({
		dark: [
			37,
			37,
			32
		],
		light: [
			244,
			232,
			194
		],
		roughness: .86,
		relief: .005,
		columns: 2,
		rows: 4,
		halfWidth: .44,
		halfHeight: .4,
		chamfer: .7,
		edge: .015,
		punchColumns: 20,
		punchRows: 8,
		pitchX: .036,
		pitchY: .07,
		punchHalfWidth: .008,
		punchHalfHeight: .026,
		punchBevel: .003
	}),
	braidedcord: Object.freeze({
		dark: [
			64,
			40,
			17
		],
		light: [
			218,
			197,
			149
		],
		roughness: .8,
		relief: .018,
		columns: 4,
		cycles: 4,
		strands: 3,
		amplitude: .28,
		strandWidth: .055,
		shoulder: .2,
		layerBand: .2
	}),
	crossbeddedsandstone: Object.freeze({
		dark: [
			112,
			70,
			35
		],
		light: [
			225,
			196,
			145
		],
		roughness: .9,
		relief: .015,
		beds: 4,
		laminaFrequency: 12,
		laminaWidth: .14,
		dip: 5,
		dipVariation: .8,
		curvature: .4,
		curvatureVariation: .2,
		fadeStart: .05,
		fadeBand: .08,
		contactWidth: .04
	}),
	grommetcanvas: Object.freeze({
		dark: [
			56,
			34,
			13
		],
		light: [
			222,
			178,
			92
		],
		roughness: .88,
		relief: .02,
		cells: 4,
		outerRadius: .25,
		outerShoulder: .225,
		innerRadius: .12,
		innerShoulder: .14,
		fabricCut: .135,
		fabricShoulder: .15,
		ridgeRadius: .185,
		ridgeBand: .025,
		threads: 64,
		threadWidth: .46
	}),
	fishscaletiles: Object.freeze({
		dark: [
			24,
			62,
			71
		],
		light: [
			177,
			217,
			216
		],
		roughness: .23,
		relief: .008,
		columns: 4,
		rows: 8,
		grout: .03,
		bevel: .04
	}),
	hexkeys: Object.freeze({
		dark: [
			12,
			13,
			16
		],
		light: [
			92,
			100,
			112
		],
		roughness: .42,
		relief: .0065,
		cells: 4,
		bendRadius: .11,
		bendY: .1,
		longEnd: -.31,
		shortEnd: .22,
		width: .028,
		shoulder: .006,
		endBevel: .007,
		flatFraction: .5,
		facetRound: .1
	}),
	driedfigslice: Object.freeze({
		dark: [
			47,
			25,
			11
		],
		light: [
			238,
			211,
			156
		],
		roughness: .82,
		relief: .012,
		cells: 4,
		width: .32,
		length: .35,
		centerY: .02,
		taper: .25,
		edge: .0975,
		fleshRadius: .82,
		fleshShoulder: .77,
		wrinkles: 32,
		seeds: 10,
		seedJitter: .28,
		seedLong: .038,
		seedShort: .024,
		seedShoulder: .3
	}),
	creamcrackers: Object.freeze({
		dark: [
			75,
			37,
			12
		],
		light: [
			245,
			213,
			148
		],
		roughness: .79,
		relief: .01,
		cells: 4,
		halfWidth: .36,
		innerWidth: .31,
		edge: .22,
		innerEdge: .25,
		notchPitch: .1,
		notchOrigin: .4,
		notchCenter: .371,
		notchWidth: .035,
		notchDepth: .027,
		notchShoulder: .2,
		holePitch: .17,
		holeRadius: .016,
		holeShoulder: .35
	}),
	doorkeys: Object.freeze({
		dark: [
			50,
			31,
			9
		],
		light: [
			228,
			185,
			80
		],
		roughness: .33,
		relief: .004,
		cells: 4,
		bowY: -.18,
		bowRadius: .145,
		bowBevel: .012,
		boreRadius: .07,
		boreBevel: .012,
		neckHalfWidth: .045,
		neckTop: -.1,
		neckBottom: .06,
		bladeLeft: -.045,
		bladeRight: .095,
		bladeTop: .015,
		tipY: .28,
		tipClip: .35,
		bevel: .008,
		firstBitting: .065,
		bittingPitch: .07,
		bittingHeight: .023,
		bittingDepth: .038,
		depthVariation: .03,
		bittingShoulder: .15,
		grooveX: -.017,
		grooveWidth: .008,
		grooveTop: -.065,
		grooveBottom: .25,
		grooveEnd: .015
	}),
	dodecagontiles: Object.freeze({
		dark: [
			20,
			52,
			70
		],
		light: [
			211,
			231,
			226
		],
		roughness: .24,
		relief: .008,
		columns: 7,
		rows: 8,
		rowStep: Math.sqrt(3),
		grout: .018,
		bevel: .022
	}),
	ballchain: Object.freeze({
		dark: [
			35,
			40,
			46
		],
		light: [
			216,
			221,
			227
		],
		roughness: .28,
		relief: .007,
		columns: 4,
		rows: 8,
		pitch: .5,
		amplitude: .12,
		cycles: 2,
		radius: .17,
		beadBevel: .018,
		neckRadius: .024,
		neckBevel: .006
	}),
	succulentrosettes: Object.freeze({
		dark: [
			25,
			47,
			34
		],
		light: [
			164,
			199,
			166
		],
		roughness: .5,
		relief: .03,
		cells: 4,
		leaves: 6,
		taper: .35,
		shoulder: .22,
		radiusLimit: .43,
		whorls: [
			[
				.22,
				.16,
				.09,
				.22,
				0
			],
			[
				.14,
				.13,
				.075,
				.43,
				.5
			],
			[
				.065,
				.085,
				.05,
				.62,
				0
			]
		]
	}),
	foldingfans: Object.freeze({
		dark: [
			62,
			32,
			14
		],
		light: [
			241,
			216,
			169
		],
		roughness: .78,
		relief: .01,
		cells: 4,
		pivotY: .19,
		radius: .42,
		innerRadius: .18,
		radialBevel: .012,
		halfAngle: 70 * Math.PI / 180,
		folds: 12,
		edgeBevel: .008,
		ribWidth: .0045,
		ribShoulder: .35,
		ribStart: .015,
		ribEnd: .425,
		pivotRadius: .06,
		pivotShoulder: .05
	}),
	togglebuttons: Object.freeze({
		dark: [
			39,
			20,
			10
		],
		light: [
			207,
			153,
			84
		],
		roughness: .64,
		relief: .008,
		cells: 4,
		halfLength: .36,
		halfWidth: .12,
		shoulder: .12,
		holeOffset: .14,
		holeRadius: .04,
		holeCore: .023,
		grainFrequency: 32
	}),
	greenpeapods: Object.freeze({
		dark: [
			12,
			34,
			10
		],
		light: [
			154,
			190,
			77
		],
		roughness: .63,
		relief: .008,
		cells: 4,
		halfLength: .4,
		halfWidth: .105,
		curve: .03,
		shoulder: .1,
		seamRange: .36,
		peas: 5,
		peaPitch: .125,
		peaWidth: .043,
		peaLength: .05,
		stemY: .397,
		stemLength: .047,
		stemWidth: .014
	}),
	beltbuckles: Object.freeze({
		dark: [
			59,
			35,
			12
		],
		light: [
			234,
			200,
			112
		],
		roughness: .3,
		relief: .01,
		cells: 4,
		halfWidth: .29,
		halfHeight: .24,
		cornerRadius: .07,
		frameRadius: .028,
		shoulder: .35,
		barX: -.045,
		barRadius: .024,
		tongueStart: -.06,
		tongueEnd: .318,
		tongueBevel: .016,
		tongueWidth: .018,
		taperStart: .19,
		taperRun: .12,
		taper: .72,
		pivotRadius: .034,
		pivotCore: .024
	}),
	hextruchettiles: Object.freeze({
		dark: [
			13,
			38,
			59
		],
		light: [
			234,
			226,
			197
		],
		roughness: .42,
		relief: .005,
		columns: 7,
		rows: 8,
		apothem: .5,
		vertexRadius: 1 / Math.sqrt(3),
		arcRadius: 1 / (2 * Math.sqrt(3)),
		arcBand: .018,
		grout: .012,
		shoulder: .018
	}),
	scoredmango: Object.freeze({
		dark: [
			80,
			29,
			5
		],
		light: [
			255,
			208,
			61
		],
		roughness: .46,
		relief: .012,
		cells: 4,
		skinWidth: .27,
		skinLength: .4,
		fleshWidth: .245,
		fleshLength: .375,
		shoulder: .12,
		pitchX: .13,
		pitchY: .14,
		cutGap: .045,
		cutShoulder: .13
	}),
	waxseals: Object.freeze({
		dark: [
			49,
			7,
			12
		],
		light: [
			190,
			55,
			57
		],
		roughness: .49,
		relief: .01,
		cells: 4,
		radius: .36,
		edgeBevel: .016,
		edgeGuard: .31,
		rippleA: .018,
		wavesA: 7,
		rippleB: .009,
		wavesB: 11,
		stampRadius: .253,
		stampCore: .238,
		ringRadius: .283,
		ringBand: .008,
		emblemRadius: .13,
		emblemLobes: 5,
		emblemDepth: .046,
		emblemBevel: .012,
		emblemGuard: .06
	}),
	cottonbolls: Object.freeze({
		dark: [
			57,
			34,
			18
		],
		light: [
			246,
			241,
			217
		],
		roughness: .9,
		relief: .018,
		cells: 4,
		tufts: 4,
		tuftDistance: .13,
		tuftRadius: .155,
		tuftShoulder: .2,
		bractDistance: .14,
		bractLength: .19,
		bractWidth: .045,
		bractShoulder: .18
	}),
	carabiners: Object.freeze({
		dark: [
			35,
			40,
			47
		],
		light: [
			211,
			220,
			225
		],
		roughness: .29,
		relief: .01,
		cells: 4,
		vertices: [
			[-.16, -.25],
			[-.16, .25],
			[.14, .19],
			[.2, -.22]
		],
		rounding: .055,
		frameBand: .0022,
		shoulder: .35,
		gateEdge: 2,
		gateStart: .22,
		gateEnd: .78,
		gateShoulder: .04,
		jointWidth: .018,
		pinAt: .73,
		pinRadius: .012
	}),
	pencilends: Object.freeze({
		dark: [
			24,
			22,
			20
		],
		light: [
			224,
			190,
			131
		],
		roughness: .76,
		relief: .006,
		cells: 4,
		turn: Math.PI / 6,
		apothem: .3,
		woodApothem: .272,
		outerBevel: .018,
		woodBevel: .012,
		coreRadius: .074,
		coreInner: .059,
		grainFrequency: 12,
		grainWarp: .13,
		paintRoughness: .31,
		coreRoughness: .86
	}),
	corrugatedplasticedge: Object.freeze({
		dark: [
			7,
			23,
			42
		],
		light: [
			135,
			188,
			225
		],
		roughness: .42,
		relief: .006,
		columns: 8,
		rows: 8,
		linerCenter: .375,
		linerHalfWidth: .035,
		webHalfWidth: .028,
		jointShoulder: .035
	}),
	haircombs: Object.freeze({
		dark: [
			24,
			12,
			8
		],
		light: [
			196,
			131,
			68
		],
		roughness: .24,
		relief: .004,
		cells: 4,
		teeth: 14,
		firstTooth: -.28,
		toothSpan: .56,
		toothHalfWidth: .016,
		taper: .4,
		rootY: -.1,
		tipY: .265,
		tipShoulder: .025,
		spineHalfWidth: .33,
		spineTop: -.14,
		spineBottom: -.055,
		bevel: .016
	}),
	blackberries: Object.freeze({
		dark: [
			10,
			5,
			14
		],
		light: [
			83,
			43,
			88
		],
		roughness: .27,
		relief: .008,
		cells: 4,
		rows: 5,
		pitch: .105,
		drupeRadius: .067,
		stretch: 1.5,
		shoulder: .3
	}),
	musselshells: Object.freeze({
		dark: [
			8,
			14,
			25
		],
		light: [
			77,
			91,
			112
		],
		roughness: .29,
		relief: .008,
		cells: 4,
		halfLength: .34,
		maxHalfWidth: .21,
		edge: .14,
		growthBands: 18,
		incision: .025
	}),
	safetypins: Object.freeze({
		dark: [
			12,
			15,
			20
		],
		light: [
			206,
			210,
			216
		],
		roughness: .26,
		relief: .006,
		cells: 4,
		wireRadius: .012,
		shoulder: .3,
		coilY: -.24,
		coilRadius: .045,
		legs: [[
			-.045,
			-.24,
			-.045,
			.205
		], [
			.045,
			-.24,
			.075,
			.225
		]],
		guardX: .015,
		guardY: .23,
		guardHalfWidth: .095,
		guardHalfHeight: .045,
		guardShoulder: .22,
		slotX: .04,
		slotHalfWidth: .065,
		slotHalfHeight: .0075,
		slotDepth: .045
	}),
	poppyseedpods: Object.freeze({
		dark: [
			30,
			23,
			14
		],
		light: [
			195,
			171,
			120
		],
		roughness: .79,
		relief: .008,
		cells: 4,
		bodyY: .03,
		bodyWidth: .18,
		bodyLength: .24,
		bodyShoulder: .14,
		ribs: 3,
		widthFloor: .75,
		stemTop: .18,
		stemBottom: .39,
		stemWidth: .023,
		stemBevel: .02,
		crownY: -.2,
		crownWidth: .2,
		crownHeight: .05,
		crownCore: .78,
		lobes: 8,
		lobeDistance: .72,
		lobeLength: .3,
		lobeWidth: .18,
		rayDistance: .4,
		rayLength: .5,
		rayWidth: .07,
		crownShoulder: .25
	}),
	leatherbookspines: Object.freeze({
		dark: [
			25,
			12,
			6
		],
		light: [
			181,
			113,
			57
		],
		roughness: .68,
		relief: .008,
		columns: 8,
		halfWidth: .45,
		halfHeight: .46,
		edge: .02,
		bands: [
			-.32,
			-.18,
			.18,
			.32
		],
		bandWidth: .014,
		bandCurve: .018,
		bandLift: .045,
		frameHalfWidth: .31,
		frameHalfHeight: .12,
		panelHalfWidth: .265,
		panelHalfHeight: .1,
		frameShoulder: .2,
		frameLift: .02,
		panelDepth: .025,
		poreThreshold: .6,
		poreShoulder: .3
	}),
	matchsticks: Object.freeze({
		dark: [
			117,
			20,
			15
		],
		light: [
			236,
			213,
			156
		],
		roughness: .64,
		relief: .004,
		cells: 4,
		shaftHalfWidth: .03,
		shaftTop: -.27,
		shaftBottom: .34,
		sideBevel: .007,
		endBevel: .014,
		headY: -.25,
		headWidth: .085,
		headLength: .11,
		headShoulder: .2,
		headRoughness: .91,
		grainFrequency: 55
	}),
	porcelaininsulators: Object.freeze({
		dark: [
			24,
			29,
			33
		],
		light: [
			233,
			228,
			213
		],
		roughness: .2,
		relief: .008,
		cells: 4,
		skirts: 5,
		firstSkirt: -.24,
		skirtPitch: .12,
		skirtWidth: .18,
		skirtHeight: .044,
		coreWidth: .06,
		coreTop: -.33,
		coreBottom: .395,
		endBevel: .018,
		capY: -.315,
		capWidth: .09,
		capHeight: .07,
		shoulder: .24
	}),
	dominoes: Object.freeze({
		dark: [
			18,
			17,
			15
		],
		light: [
			231,
			224,
			204
		],
		roughness: .31,
		relief: .004,
		cells: 4,
		halfWidth: .18,
		halfHeight: .38,
		shoulder: .16,
		halfCenter: .19,
		pipX: .065,
		pipY: .075,
		pipRadius: .022,
		pipShoulder: .4,
		dividerHalfWidth: .135,
		dividerHalfHeight: .008
	}),
	woodenspoons: Object.freeze({
		dark: [
			52,
			29,
			15
		],
		light: [
			211,
			163,
			98
		],
		roughness: .55,
		relief: .006,
		cells: 4,
		bowlY: -.2,
		bowlWidth: .14,
		bowlHeight: .19,
		bowlShoulder: .24,
		cavityRadiusSquared: .65,
		neckWidth: .038,
		handleWidening: .035,
		handleTop: -.1,
		handleBottom: .38,
		handleEndBevel: .02,
		handleShoulder: .35,
		wideningStart: -.04,
		wideningLength: .36
	}),
	chessrooks: Object.freeze({
		dark: [
			25,
			27,
			29
		],
		light: [
			233,
			225,
			205
		],
		roughness: .38,
		relief: .006,
		cells: 4,
		crownHalfWidth: .145,
		crownTop: -.36,
		crownBottom: -.18,
		edgeBevel: .012,
		notchOffset: .065,
		notchHalfWidth: .022,
		notchBottom: -.285,
		shaftTop: -.25,
		shaftBottom: .31,
		neckWidth: .065,
		shaftWidening: .03,
		wideningStart: -.15,
		wideningLength: .4,
		shaftShoulder: .3,
		topCollarY: -.18,
		topCollarWidth: .16,
		topCollarHeight: .03,
		lowerCollarY: .225,
		lowerCollarWidth: .135,
		lowerCollarHeight: .035,
		baseY: .31,
		baseWidth: .18,
		baseHeight: .065,
		ellipseShoulder: .25
	}),
	threadspools: Object.freeze({
		dark: [
			70,
			24,
			19
		],
		light: [
			224,
			190,
			135
		],
		roughness: .76,
		relief: .006,
		cells: 4,
		coreWidth: .06,
		coreHalfHeight: .3,
		threadWidth: .12,
		threadHalfHeight: .225,
		endBevel: .02,
		flangeCenter: .255,
		flangeWidth: .18,
		flangeHeight: .045,
		shoulder: .25,
		turns: 12,
		windingLength: .42,
		windingSlope: .4
	}),
	bellpepperslices: Object.freeze({
		dark: [
			6,
			45,
			8
		],
		light: [
			241,
			239,
			223
		],
		roughness: .38,
		relief: .006,
		cells: 4,
		lobes: 3,
		lobeOffset: .085,
		outerRadius: .22,
		innerRadius: .165,
		shoulder: .2,
		pithHalfWidth: .016,
		pithEnd: .2725,
		pithBevel: .015,
		coreRadius: .035,
		seedAlong: .16,
		seedOffset: .025,
		seedLength: .021,
		seedWidth: .0145,
		seedShoulder: .3
	}),
	sharkteeth: Object.freeze({
		dark: [
			31,
			27,
			22
		],
		light: [
			230,
			225,
			205
		],
		roughness: .28,
		relief: .006,
		cells: 4,
		crownTop: -.33,
		crownBottom: .15,
		crownSlope: .375,
		crownDomeFloor: .02,
		edgeBevel: .006,
		serrationAmplitude: .014,
		serrationFrequency: 18,
		serrationTipFade: .08,
		serrationBaseFade: .06,
		neckWidth: .07,
		neckTop: .1,
		neckBottom: .23,
		rootOffset: .1,
		rootY: .21,
		rootWidth: .12,
		rootHeight: .085,
		rootShoulder: .25
	}),
	grinderburrs: Object.freeze({
		dark: [
			31,
			34,
			37
		],
		light: [
			205,
			209,
			213
		],
		roughness: .4,
		relief: .004,
		cells: 4,
		outerRadius: .31,
		boreRadius: .07,
		edgeBevel: .012,
		flutes: 6,
		twist: 6,
		mountingHoles: 3,
		holeDistance: .24,
		holeRadius: .022,
		holeCore: .012
	}),
	cowhide: Object.freeze({
		dark: [
			20,
			19,
			18
		],
		light: [
			230,
			229,
			218
		],
		roughness: .87,
		relief: .002,
		patchColumns: 4,
		patchRows: 4,
		warpMix: .18,
		patchLow: .48,
		patchHigh: .5
	}),
	spaltedwood: Object.freeze({
		dark: [
			28,
			19,
			10
		],
		light: [
			218,
			185,
			132
		],
		roughness: .67,
		relief: .003,
		zoneColumns: 4,
		zoneRows: 5,
		variationColumns: 8,
		variationRows: 8,
		variationMix: .14,
		zoneLevel: .5,
		lineWidth: .018,
		lineWidthVariation: .006
	}),
	canlids: Object.freeze({
		dark: [
			24,
			27,
			30
		],
		light: [
			215,
			222,
			227
		],
		roughness: .38,
		relief: .004,
		cells: 4,
		radius: .34,
		edgeBevel: .012,
		beadRadius: .29,
		beadWidth: .018,
		scoreRadius: .235,
		scoreWidth: .004,
		tabWidth: .08,
		tabLength: .14,
		tabCenter: -.06,
		gripWidth: .044,
		gripLength: .052,
		gripCenter: -.115,
		slotWidth: .034,
		slotLength: .032,
		slotCenter: .027,
		rivetRadius: .018,
		rivetCenter: .03,
		shoulder: .2
	}),
	crinoidossicles: Object.freeze({
		dark: [
			72,
			60,
			43
		],
		light: [
			224,
			211,
			179
		],
		roughness: .76,
		relief: .0015,
		cells: 4,
		radius: .31,
		radiusVariation: .035,
		edgeBevel: .018,
		lobes: 5,
		lumenRadius: .1,
		lobeDepth: .035,
		lumenSquaredShoulder: .002,
		ribInnerRadius: .17,
		ribOuterRadius: .29,
		ribFade: .02
	}),
	pythagoreantiles: Object.freeze({
		dark: [
			14,
			53,
			44
		],
		light: [
			224,
			224,
			185
		],
		roughness: .23,
		relief: .003,
		largeSide: 2,
		smallSide: 1,
		grout: .015,
		shoulder: .015
	}),
	dinnerforks: Object.freeze({
		dark: [
			25,
			28,
			31
		],
		light: [
			218,
			224,
			230
		],
		roughness: .25,
		relief: .004,
		cells: 4,
		tines: 4,
		firstTine: -.108,
		tinePitch: .072,
		tineHalfWidth: .028,
		taper: .42,
		tipY: -.36,
		rootY: -.08,
		tipShoulder: .02,
		edgeBevel: .015,
		bodyTop: -.12,
		bodyBottom: .36,
		bottomShoulder: .03,
		ellipseShoulder: .2,
		neckWidth: .035,
		headWidening: .105,
		headBottom: .03,
		neckLength: .1,
		handleWidening: .018,
		wideningStart: .19,
		wideningLength: .13
	}),
	goldbrocade: Object.freeze({
		dark: [
			17,
			31,
			55
		],
		light: [
			238,
			194,
			77
		],
		roughness: .72,
		relief: .002
	}),
	mudtiretracks: Object.freeze({
		dark: [
			39,
			26,
			17
		],
		light: [
			137,
			101,
			62
		],
		roughness: .86,
		relief: .015,
		tracks: 2,
		halfWidth: .05,
		lugs: 36,
		curvature: .75,
		lugWidth: .12,
		bermCenter: 1.12,
		bermSquaredWidth: .45
	}),
	peacockfeathers: Object.freeze({
		dark: [
			14,
			36,
			32
		],
		light: [
			185,
			179,
			72
		],
		roughness: .86,
		relief: .0018,
		eyeY: -.25,
		eyeWidth: .19,
		eyeLength: .24,
		outerShoulder: .22,
		innerSquared: .62,
		innerShoulder: .16,
		pupilX: -.01,
		pupilY: -.27,
		pupilWidth: .075,
		pupilLength: .1,
		pupilShoulder: .2
	}),
	tangramtiles: Object.freeze({
		dark: [
			28,
			54,
			63
		],
		light: [
			218,
			221,
			188
		],
		roughness: .26,
		relief: .009,
		cells: 2,
		grout: .008,
		shoulder: .01,
		pieces: [
			[
				[0, 0],
				[1, 0],
				[.5, .5]
			],
			[
				[0, 0],
				[.5, .5],
				[0, 1]
			],
			[
				[1, 1],
				[.5, 1],
				[1, .5]
			],
			[
				[.5, .5],
				[.75, .25],
				[1, .5],
				[.75, .75]
			],
			[
				[1, 0],
				[1, .5],
				[.75, .25]
			],
			[
				[.5, .5],
				[.75, .75],
				[.25, .75]
			],
			[
				[0, 1],
				[.25, .75],
				[.75, .75],
				[.5, 1]
			]
		]
	}),
	batterypositivecaps: Object.freeze({
		dark: [
			18,
			20,
			23
		],
		light: [
			225,
			226,
			218
		],
		roughness: .25,
		relief: .004,
		cells: 4,
		radius: .42,
		outerShoulder: .39,
		insulatorRadius: .3,
		insulatorShoulder: .28,
		buttonRadius: .17,
		buttonShoulder: .145,
		rimRadius: .35,
		rimSquaredWidth: .012
	}),
	passionfruitslice: Object.freeze({
		dark: [
			39,
			24,
			5
		],
		light: [
			255,
			241,
			185
		],
		roughness: .61,
		relief: .006,
		cells: 4,
		width: .37,
		length: .42,
		edge: .1,
		pithRadius: .94,
		pithShoulder: .88,
		fleshRadius: .76,
		fleshShoulder: .7,
		seeds: 8,
		seedJitter: .12,
		jellyLong: .092,
		jellyShort: .057,
		jellyShoulder: .35,
		kernelLong: .046,
		kernelShort: .024,
		kernelShoulder: .35
	}),
	screwterminalblocks: Object.freeze({
		dark: [
			12,
			37,
			21
		],
		light: [
			224,
			226,
			211
		],
		roughness: .74,
		relief: .004,
		cells: 4,
		halfWidth: .39,
		halfHeight: .42,
		edge: .035,
		screwY: -.15,
		screwRadius: .155,
		screwShoulder: .13,
		wellRadius: .19,
		wellShoulder: .165,
		slotHalfLength: .1,
		slotHalfWidth: .018,
		slotShoulder: .006,
		portY: .19,
		portHalfWidth: .23,
		portHalfHeight: .08,
		portShoulder: .02,
		contactY: .215,
		contactHalfWidth: .17,
		contactHalfHeight: .018,
		contactShoulder: .006
	}),
	dragonfruitflesh: Object.freeze({
		dark: [
			7,
			9,
			7
		],
		light: [
			253,
			250,
			239
		],
		roughness: .46,
		relief: 7e-4,
		cells: 20,
		jitter: .2,
		seedLong: .24,
		seedShort: .09,
		shoulder: .35
	}),
	speakercones: Object.freeze({
		dark: [
			6,
			7,
			8
		],
		light: [
			111,
			113,
			108
		],
		roughness: .72,
		relief: .012,
		cells: 4,
		radius: .43,
		outerShoulder: .4,
		surroundRadius: .33,
		surroundSquaredWidth: .018,
		coneRadius: .3,
		coneShoulder: .28,
		dustRadius: .13,
		dustShoulder: .105,
		ribInner: .14,
		ribOuter: .28,
		ribFade: .02,
		ribs: 48
	}),
	septarianstone: Object.freeze({
		dark: [
			55,
			37,
			18
		],
		light: [
			235,
			210,
			145
		],
		roughness: .52,
		relief: .0015,
		cells: 8,
		veinInset: .015,
		veinVariation: .025,
		shoulder: .04,
		warp: .4
	}),
	axialresistors: Object.freeze({
		dark: [
			14,
			12,
			10
		],
		light: [
			236,
			226,
			203
		],
		roughness: .64,
		relief: .008,
		cells: 4,
		bodyCore: .16,
		endRadius: .09,
		bodyRadius: .1,
		bodyShoulder: .26,
		leadRadius: .018,
		leadEnd: .46,
		leadShoulder: .025,
		firstBand: -.14,
		bandPitch: .07,
		bandRadius: .018,
		lastBand: .12
	}),
	tomatoslices: Object.freeze({
		dark: [
			120,
			12,
			7
		],
		light: [
			252,
			219,
			125
		],
		roughness: .46,
		relief: .003,
		cells: 4,
		radius: .43,
		outerShoulder: .4,
		fleshRadius: .37,
		fleshShoulder: .35,
		chambers: 5,
		chamberCenter: .21,
		chamberLength: .12,
		chamberWidth: .09,
		shoulder: .25,
		seedOffset: .04,
		seedSide: .025,
		seedLength: .025,
		seedWidth: .014,
		coreRadius: .075
	}),
	pinstripewool: Object.freeze({
		dark: [
			10,
			16,
			29
		],
		light: [
			220,
			225,
			231
		],
		roughness: .84,
		relief: 45e-5,
		cells: 48,
		halfWidth: .32,
		exposureHalf: .42,
		exposureShoulder: .08,
		stripeEvery: 8
	}),
	snowflakeobsidian: Object.freeze({
		dark: [
			4,
			6,
			8
		],
		light: [
			199,
			201,
			195
		],
		roughness: .14,
		relief: .001,
		cells: 6,
		arms: 24,
		jitter: .15,
		bladeCenter: .06,
		lengthMin: .115,
		lengthRange: .065,
		widthMin: .026,
		widthRange: .021,
		angleJitter: .2,
		shoulder: .6,
		scaleMin: .4,
		scaleRange: .7,
		matrixTone: .025,
		matrixGrain: .025,
		crystalTone: .68,
		crystalVariation: .15,
		crystalGrain: .18,
		crystalRoughness: .16
	}),
	chrysanthemumstone: Object.freeze({
		dark: [
			12,
			14,
			17
		],
		light: [
			237,
			233,
			218
		],
		roughness: .55,
		relief: .001,
		cells: 4,
		arms: 12,
		jitter: .06,
		bladeCenter: .14,
		lengthMin: .18,
		lengthRange: .045,
		widthMin: .02,
		widthRange: .009,
		angleJitter: .03,
		shoulder: .25
	}),
	sewingsnaps: Object.freeze({
		dark: [
			12,
			13,
			15
		],
		light: [
			224,
			226,
			229
		],
		roughness: .31,
		relief: .006,
		cells: 4,
		radius: .4,
		shoulder: .37,
		rimRadius: .35,
		rimSquaredWidth: .012,
		holeOffset: .25,
		holeRadius: .045,
		holeShoulder: .03,
		socketRadius: .14,
		socketShoulder: .115,
		boreRadius: .085,
		boreShoulder: .065,
		postRadius: .105,
		postShoulder: .085
	}),
	lathplaster: Object.freeze({
		dark: [
			23,
			17,
			12
		],
		light: [
			239,
			233,
			214
		],
		roughness: .89,
		relief: .025,
		cells: 2,
		jitter: .04,
		patchLength: .34,
		patchWidth: .27,
		shoulder: .25,
		warp: .08,
		laths: 16,
		lathHalfWidth: .4,
		lathShoulder: .08
	}),
	ceramiccapacitors: Object.freeze({
		dark: [
			24,
			9,
			4
		],
		light: [
			251,
			192,
			105
		],
		roughness: .55,
		relief: .008,
		cells: 4,
		bodyX: .24,
		bodyY: .26,
		centerY: -.1,
		shoulder: .25,
		leadOffset: .09,
		leadRadius: .018,
		leadTop: .04,
		leadEnd: .44,
		leadShoulder: .025
	}),
	fennelseeds: Object.freeze({
		dark: [
			23,
			29,
			12
		],
		light: [
			204,
			190,
			106
		],
		roughness: .77,
		relief: .002,
		cells: 8,
		halfLength: .34,
		halfWidth: .11,
		bend: .065,
		jitter: .035,
		shoulder: .18,
		ribGap: .32,
		ribRadius: .095
	}),
	rj45femalefaces: Object.freeze({
		dark: [
			10,
			13,
			16
		],
		light: [
			241,
			244,
			246
		],
		roughness: .27,
		relief: .0044,
		cells: 2,
		jitter: .016,
		minScale: .94,
		maxScale: 1,
		halfWidth: .3,
		halfHeight: .21,
		outerCorner: .012,
		outerBevel: .003,
		linerHalfWidth: .28,
		linerHalfHeight: .19,
		linerCorner: .01,
		linerBevel: .003,
		mouthHalfWidth: .238,
		mouthHalfHeight: .127,
		mouthY: -.006,
		mouthCorner: .006,
		mouthBevel: .002,
		keyHalfWidth: .075,
		keyHalfHeight: .043,
		keyY: .142,
		keyCorner: .008,
		keyBevel: .002,
		contacts: 8,
		pitch: .0375,
		contactY: -.047,
		pinHalfWidth: .006,
		pinHalfHeight: .043,
		pinCorner: .0035,
		pinBevel: 7e-4,
		backingTone: .02,
		shellTone: .84,
		plasticTone: .11,
		pinTone: .94,
		backingHeight: .025,
		shellHeight: .69,
		linerHeight: .6,
		wellHeight: .08,
		pinHeight: .42,
		backingRoughness: .98,
		linerRoughness: .75,
		wellRoughness: .96,
		pinRoughness: .23,
		backingAO: .35,
		shellAO: .99,
		linerAO: .98,
		wellAO: .24,
		pinAO: .98,
		grainTone: .006,
		grainHeight: 5e-4,
		grainRoughness: .012,
		edgeAO: .16
	}),
	rcafemalefaces: Object.freeze({
		dark: [
			11,
			13,
			15
		],
		light: [
			242,
			244,
			246
		],
		roughness: .24,
		relief: .0042,
		cells: 2,
		jitter: .016,
		minScale: .94,
		maxScale: 1,
		gasketRadius: .37,
		gasketBevel: .007,
		shoulderRadius: .27,
		shoulderBevel: .005,
		barrelInradius: .19,
		barrelBevel: .004,
		insulatorRadius: .16,
		insulatorBevel: .004,
		boreRadius: .08,
		boreBevel: .003,
		contactRadius: .052,
		contactBevel: .0025,
		holeRadius: .032,
		holeBevel: .002,
		backingTone: .02,
		gasketTone: .11,
		metalTone: .83,
		insulatorTone: .12,
		boreTone: .03,
		contactTone: .92,
		holeTone: .02,
		backingHeight: .025,
		gasketHeight: .22,
		shoulderHeight: .46,
		barrelHeight: .76,
		insulatorHeight: .64,
		boreHeight: .09,
		contactHeight: .12,
		holeHeight: .055,
		backingRoughness: .98,
		gasketRoughness: .82,
		shoulderRoughness: .27,
		insulatorRoughness: .76,
		boreRoughness: .96,
		contactRoughness: .22,
		holeRoughness: .98,
		backingAO: .35,
		gasketAO: .96,
		shoulderAO: .99,
		barrelAO: .99,
		insulatorAO: .96,
		boreAO: .24,
		contactAO: .89,
		holeAO: .22,
		grainTone: .006,
		grainHeight: 5e-4,
		grainRoughness: .012,
		edgeAO: .16
	}),
	f05opticalfaces: Object.freeze({
		dark: [
			7,
			10,
			13
		],
		light: [
			225,
			229,
			235
		],
		roughness: .8,
		relief: .0038,
		cells: 2,
		jitter: .014,
		minScale: .94,
		maxScale: 1,
		bodyHalfWidth: .325,
		bodyHalfHeight: .2125,
		bodyCorner: .009,
		bodyBevel: .0025,
		collarHalfWidth: .165,
		collarHalfHeight: .175,
		collarCut: .27,
		collarBevel: .003,
		earX: .165,
		earRadius: .045,
		earBevel: .002,
		grooveX: .275,
		grooveHalfWidth: .012,
		grooveHalfHeight: .174,
		grooveCorner: .006,
		grooveBevel: .001,
		mouthHalfWidth: .135,
		mouthHalfHeight: .145,
		mouthCut: .22,
		mouthBevel: .003,
		boreRadius: .06,
		boreBevel: .0025,
		backingTone: .015,
		polymerTone: .24,
		grooveTone: .08,
		wellTone: .045,
		boreTone: .025,
		backingHeight: .025,
		bodyHeight: .5,
		collarHeight: .75,
		grooveHeight: .16,
		wellHeight: .12,
		boreHeight: .06,
		backingRoughness: .98,
		collarRoughness: .76,
		grooveRoughness: .9,
		wellRoughness: .94,
		boreRoughness: .5,
		backingAO: .35,
		bodyAO: .98,
		collarAO: .99,
		grooveAO: .5,
		wellAO: .28,
		boreAO: .22,
		grainTone: .006,
		grainHeight: 4e-4,
		grainRoughness: .012,
		edgeAO: .16
	}),
	dcbarreljackfaces: Object.freeze({
		dark: [
			8,
			11,
			15
		],
		light: [
			239,
			242,
			244
		],
		roughness: .83,
		relief: .0042,
		cells: 2,
		jitter: .012,
		minScale: .94,
		maxScale: 1,
		rotationTurns: .025,
		grainCells: 96,
		bodyHalfWidth: .27,
		bodyHalfHeight: .33,
		bodyCorner: .018,
		bodyBevel: .004,
		boreCenterY: -.06,
		boreRadius: .192,
		boreBevel: .006,
		pinRadius: .06,
		pinBevel: .003,
		springCenterY: .126,
		springHalfWidth: .138,
		springHalfHeight: .016,
		springBevelX: .003,
		springBevelY: .003,
		backingTone: .015,
		bodyTone: .13,
		boreTone: .018,
		pinTone: .83,
		springTone: .9,
		backingHeight: .02,
		bodyHeight: .34,
		boreHeight: .07,
		pinHeight: .26,
		springHeight: .16,
		backingRoughness: .98,
		boreRoughness: .96,
		pinRoughness: .24,
		springRoughness: .28,
		backingAO: .4,
		bodyAO: .94,
		boreAO: .24,
		pinAO: .91,
		springAO: .8,
		grainTone: .006,
		grainHeight: 4e-4,
		grainRoughness: .012,
		edgeAO: .12
	}),
	stfiberadapterfaces: Object.freeze({
		dark: [
			8,
			11,
			15
		],
		light: [
			239,
			242,
			244
		],
		roughness: .38,
		relief: .0042,
		cells: 2,
		jitter: .012,
		minScale: .94,
		maxScale: 1,
		rotationTurns: .025,
		grainCells: 96,
		nutInradius: .3,
		nutBevel: .006,
		collarRadius: .285,
		collarBevel: .006,
		barrelRadius: .2075,
		barrelBevel: .006,
		cavityRadius: .155,
		cavityBevel: .006,
		keyHalfWidth: .035,
		keyCenterY: -.19,
		keyHalfHeight: .06,
		keyBevelX: .004,
		keyBevelY: .006,
		studX: .222,
		studHalfWidth: .023,
		studHalfHeight: .018,
		studBevelX: .004,
		studBevelY: .004,
		backingTone: .015,
		nutTone: .57,
		collarTone: .67,
		studTone: .84,
		lipTone: .9,
		boreTone: .018,
		backingHeight: .02,
		boreHeight: .06,
		nutHeight: .28,
		collarHeight: .36,
		studHeight: .54,
		lipHeight: .68,
		backingRoughness: .98,
		collarRoughness: .31,
		studRoughness: .24,
		lipRoughness: .2,
		boreRoughness: .96,
		backingAO: .4,
		nutAO: .94,
		collarAO: .97,
		studAO: .98,
		lipAO: .99,
		boreAO: .22,
		grainTone: .006,
		grainHeight: 4e-4,
		grainRoughness: .012
	}),
	to92packagefaces: Object.freeze({
		dark: [
			8,
			10,
			13
		],
		light: [
			239,
			242,
			244
		],
		roughness: .82,
		relief: .0042,
		cells: 2,
		jitter: .012,
		minScale: .94,
		maxScale: 1,
		rotationTurns: .012,
		grainCells: 96,
		bodyCenterY: -.13,
		bodyHalfWidth: .14,
		bodyHalfHeight: .16,
		bodyBevel: .004,
		bodyRoundBevel: .055,
		leadCount: 3,
		leadPitch: .075,
		leadCenterY: .1975,
		leadHalfHeight: .1925,
		leadHalfWidth: .0105,
		leadRootHalfWidth: .018,
		leadShoulderEndY: .15,
		leadShoulderBlend: .006,
		leadBevelX: .003,
		leadBevelY: .003,
		backingTone: .018,
		leadTone: .87,
		bodyTone: .1,
		backingHeight: .02,
		leadHeight: .44,
		bodyHeight: .68,
		backingRoughness: .98,
		leadRoughness: .26,
		backingAO: .42,
		leadAO: .99,
		bodyAO: .95,
		grainTone: .006,
		grainHeight: 4e-4,
		grainRoughness: .012
	}),
	to220packagefaces: Object.freeze({
		dark: [
			8,
			10,
			13
		],
		light: [
			239,
			242,
			244
		],
		roughness: .82,
		relief: .0042,
		cells: 2,
		jitter: .012,
		minScale: .94,
		maxScale: 1,
		rotationTurns: .012,
		grainCells: 96,
		tabCenterY: -.195,
		tabHalfWidth: .13,
		tabHalfHeight: .14,
		tabBevel: .004,
		tabClipWidth: .03,
		tabClipHeight: .06,
		tabClipBevel: .004,
		holeCenterY: -.265,
		holeRadius: .048,
		holeBevel: .004,
		bodyCenterY: -.0575,
		bodyHalfWidth: .13,
		bodyHalfHeight: .1175,
		bodyBevel: .004,
		leadCount: 3,
		leadPitch: .064,
		leadCenterY: .2075,
		leadHalfHeight: .1825,
		leadHalfWidth: .0105,
		leadRootHalfWidth: .018,
		leadShoulderEndY: .15,
		leadShoulderBlend: .006,
		leadBevelX: .003,
		leadBevelY: .003,
		backingTone: .018,
		holeTone: .012,
		tabTone: .74,
		leadTone: .87,
		bodyTone: .1,
		backingHeight: .02,
		holeHeight: .06,
		tabHeight: .3,
		leadHeight: .44,
		bodyHeight: .68,
		backingRoughness: .98,
		holeRoughness: .98,
		tabRoughness: .34,
		leadRoughness: .26,
		backingAO: .42,
		holeAO: .2,
		tabAO: .98,
		leadAO: .99,
		bodyAO: .95,
		grainTone: .006,
		grainHeight: 4e-4,
		grainRoughness: .012
	}),
	ftypefemalefaces: Object.freeze({
		dark: [
			10,
			10,
			10
		],
		light: [
			244,
			244,
			244
		],
		roughness: .38,
		relief: .0042,
		cells: 2,
		jitter: .012,
		minScale: .94,
		maxScale: 1,
		rotationTurns: .025,
		grainCells: 96,
		nutInradius: .31,
		nutBevel: .006,
		shoulderRadius: .291,
		shoulderBevel: .006,
		barrelRadius: .267,
		barrelBevel: .006,
		insertRadius: .224,
		insertBevel: .006,
		entryRadius: .027,
		entryBevel: .004,
		backingTone: .018,
		nutTone: .58,
		shoulderTone: .68,
		lipTone: .9,
		insertTone: .94,
		entryTone: .025,
		backingHeight: .02,
		entryHeight: .06,
		nutHeight: .26,
		shoulderHeight: .36,
		insertHeight: .48,
		lipHeight: .66,
		backingRoughness: .98,
		shoulderRoughness: .31,
		lipRoughness: .2,
		insertRoughness: .65,
		entryRoughness: .98,
		backingAO: .4,
		nutAO: .94,
		shoulderAO: .97,
		lipAO: .99,
		insertAO: .91,
		entryAO: .22,
		grainTone: .006,
		grainHeight: 4e-4,
		grainRoughness: .012
	}),
	minidin4femalefaces: Object.freeze({
		dark: [
			8,
			11,
			15
		],
		light: [
			239,
			242,
			244
		],
		roughness: .81,
		relief: .0042,
		cells: 2,
		jitter: .012,
		minScale: .94,
		maxScale: 1,
		bodyHalfWidth: .3,
		bodyHalfHeight: .275,
		bodyCorner: .009,
		bodyBevel: .003,
		faceY: .0045,
		bezelRadius: .24,
		bezelBevel: .003,
		earthRadius: .226,
		earthBevel: .002,
		cavityRadius: .214,
		cavityBevel: .003,
		insertRadius: .1714,
		insertBevel: .003,
		notchY: -.172,
		notchHalfWidth: .038,
		notchHalfHeight: .045,
		notchCorner: .003,
		notchBevel: .0015,
		stepX: .107,
		stepY: .08,
		stepBevel: .002,
		upperSocketX: .085,
		upperSocketY: -.067,
		lowerSocketX: .107,
		lowerSocketY: .019,
		leadHalfWidth: .033,
		leadHalfHeight: .032,
		leadCorner: .004,
		leadBevel: .0015,
		upperSlotHalfWidth: .017,
		upperSlotHalfHeight: .024,
		lowerSlotHalfWidth: .024,
		lowerSlotHalfHeight: .017,
		slotCorner: .0025,
		slotBevel: .0012,
		keyY: .109,
		keyHalfWidth: .053,
		keyHalfHeight: .034,
		keyCorner: .003,
		keyBevel: .0015,
		backingTone: .015,
		bodyTone: .2,
		bezelTone: .2,
		earthTone: .68,
		cavityTone: .018,
		insertTone: .16,
		leadTone: .07,
		slotTone: .015,
		keyTone: .015,
		backingHeight: .02,
		bodyHeight: .2,
		bezelHeight: .31,
		earthHeight: .34,
		cavityHeight: .09,
		insertHeight: .24,
		leadHeight: .16,
		slotHeight: .04,
		keyHeight: .05,
		backingRoughness: .98,
		bezelRoughness: .8,
		earthRoughness: .27,
		cavityRoughness: .96,
		insertRoughness: .81,
		leadRoughness: .86,
		slotRoughness: .97,
		keyRoughness: .97,
		backingAO: .4,
		bodyAO: .94,
		bezelAO: .98,
		earthAO: .99,
		cavityAO: .24,
		insertAO: .88,
		leadAO: .65,
		slotAO: .16,
		keyAO: .16,
		grainTone: .006,
		grainHeight: 4e-4,
		grainRoughness: .012,
		edgeAO: .14
	}),
	usbcfemalefaces: Object.freeze({
		dark: [
			10,
			13,
			18
		],
		light: [
			239,
			242,
			244
		],
		roughness: .28,
		relief: .0045,
		cells: 2,
		jitter: .016,
		minScale: .94,
		maxScale: 1,
		halfWidth: .3,
		halfHeight: .105,
		outerCorner: .08,
		outerBevel: .005,
		mouthHalfWidth: .260625,
		mouthHalfHeight: .08,
		mouthCorner: .053125,
		mouthBevel: .004,
		tongueHalfWidth: .2090625,
		tongueHalfHeight: .025,
		tongueCorner: .01,
		tongueBevel: .002,
		tongueY: 0,
		contacts: 12,
		pitch: .03125,
		rowY: .016,
		pinHalfWidth: .00625,
		pinHalfHeight: .0045,
		pinCorner: .002,
		pinBevel: 6e-4,
		backingTone: .02,
		shellTone: .82,
		plasticTone: .1,
		pinTone: .94,
		backingHeight: .025,
		shellHeight: .7,
		wellHeight: .09,
		tongueHeight: .4,
		pinHeight: .46,
		backingRoughness: .98,
		wellRoughness: .95,
		tongueRoughness: .72,
		pinRoughness: .22,
		backingAO: .35,
		shellAO: .99,
		wellAO: .25,
		tongueAO: .98,
		pinAO: .99,
		grainTone: .006,
		grainHeight: 5e-4,
		grainRoughness: .012,
		edgeAO: .16
	}),
	iecc6inlets: Object.freeze({
		dark: [
			10,
			13,
			18
		],
		light: [
			239,
			242,
			244
		],
		roughness: .84,
		relief: .0045,
		cells: 2,
		jitter: .016,
		minScale: .94,
		maxScale: 1,
		halfWidth: .37,
		halfHeight: .19,
		bodyCorner: .08,
		bodyBevel: .005,
		mountX: .28,
		counterRadius: .064,
		mountRadius: .032,
		mountBevel: .003,
		pinX: .086,
		upperY: -.04,
		lowerY: .04,
		mouthRadius: .076,
		mouthBevel: .004,
		pinRadius: .024,
		pinBevel: .003,
		backingTone: .015,
		bodyTone: .16,
		pinTone: .87,
		backingHeight: .02,
		bodyHeight: .4,
		counterHeight: .16,
		mountHeight: .075,
		mouthHeight: .11,
		pinHeight: .31,
		backingRoughness: .98,
		counterRoughness: .88,
		mountRoughness: .98,
		mouthRoughness: .96,
		pinRoughness: .27,
		backingAO: .48,
		bodyAO: .98,
		counterAO: .56,
		mountAO: .22,
		mouthAO: .27,
		pinAO: .98,
		grainTone: .006,
		grainHeight: 5e-4,
		grainRoughness: .012,
		edgeAO: .16
	}),
	iecc8inlets: Object.freeze({
		dark: [
			10,
			13,
			18
		],
		light: [
			239,
			242,
			244
		],
		roughness: .84,
		relief: .0045,
		cells: 2,
		jitter: .016,
		minScale: .94,
		maxScale: 1,
		halfWidth: .29,
		halfHeight: .1814,
		bodyCorner: .05,
		bodyBevel: .005,
		pinX: .11,
		hoodRadius: .15,
		hoodBevel: .005,
		mouthRadius: .107,
		mouthBevel: .006,
		waistTipY: .052,
		waistRound: .048,
		waistSlope: 2,
		waistBevel: .004,
		pinRadius: .032,
		pinBevel: .003,
		backingTone: .015,
		bodyTone: .16,
		pinTone: .87,
		backingHeight: .02,
		bodyHeight: .18,
		hoodHeight: .4,
		mouthHeight: .105,
		pinHeight: .31,
		backingRoughness: .98,
		hoodRoughness: .8,
		mouthRoughness: .96,
		pinRoughness: .27,
		backingAO: .48,
		bodyAO: .95,
		hoodAO: .98,
		mouthAO: .27,
		pinAO: .98,
		grainTone: .006,
		grainHeight: 5e-4,
		grainRoughness: .012,
		edgeAO: .16
	}),
	din5femalefaces: Object.freeze({
		dark: [
			10,
			13,
			18
		],
		light: [
			239,
			242,
			244
		],
		roughness: .81,
		relief: .0045,
		cells: 2,
		jitter: .016,
		minScale: .94,
		maxScale: 1,
		halfWidth: .25,
		halfHeight: .264,
		bodyCorner: .012,
		bodyBevel: .004,
		faceY: .02,
		rimRadius: .187,
		rimBevel: .005,
		cavityRadius: .172,
		cavityBevel: .009,
		insertRadius: .151,
		insertBevel: .006,
		mountX: .212,
		upperMountY: -.218,
		lowerMountY: .125,
		mountRadius: .018,
		mountBevel: .0035,
		keyY: -.143,
		keyHalfWidth: .029,
		keyHalfHeight: .029,
		keyCorner: .004,
		keyBevel: .002,
		webY: .145,
		webHalfWidth: .024,
		webHalfHeight: .04,
		webCorner: .006,
		webBevel: .003,
		upperSocketX: .09,
		upperSocketY: 0,
		lowerSocketX: .064,
		lowerSocketY: .064,
		bottomSocketY: .09,
		upperDegrees: 25,
		lowerDegrees: 45,
		slotHalfWidth: .0115,
		slotHalfHeight: .039,
		slotCorner: .005,
		slotBevel: .0025,
		bulgeRadius: .0195,
		bulgeBevel: .003,
		backingTone: .015,
		bodyTone: .16,
		floorTone: .018,
		backingHeight: .02,
		bodyHeight: .18,
		rimHeight: .31,
		cavityHeight: .105,
		insertHeight: .255,
		floorHeight: .045,
		backingRoughness: .98,
		rimRoughness: .79,
		cavityRoughness: .84,
		insertRoughness: .81,
		floorRoughness: .97,
		backingAO: .48,
		bodyAO: .94,
		rimAO: .97,
		cavityAO: .3,
		insertAO: .86,
		floorAO: .18,
		grainTone: .006,
		grainHeight: 5e-4,
		grainRoughness: .012,
		edgeAO: .14,
		rowSlope: .6
	}),
	xlrfemalefaces: Object.freeze({
		dark: [
			12,
			15,
			20
		],
		light: [
			240,
			243,
			242
		],
		roughness: .34,
		relief: .0045,
		cells: 2,
		jitter: .018,
		minScale: .94,
		maxScale: 1,
		halfWidth: .29,
		halfHeight: .345,
		bodyCorner: .025,
		bodyBevel: .008,
		faceY: .035,
		rimRadius: .27,
		rimBevel: .006,
		cavityRadius: .255,
		cavityBevel: .009,
		faceRadius: .181,
		faceBevel: .006,
		collarRadius: .196,
		collarBevel: .005,
		collarInnerRadius: .18,
		collarInnerBevel: .004,
		gapHalfWidth: .048,
		gapSideBevel: .008,
		keyY: -.126,
		keyHalfWidth: .043,
		keyHalfHeight: .033,
		keyCorner: .006,
		keyBevel: .003,
		latchY: -.277,
		latchHalfWidth: .088,
		latchHalfHeight: .029,
		latchCorner: .012,
		latchBevel: .005,
		mountX: .235,
		mountY: .29,
		mountRadius: .021,
		mountBevel: .004,
		socketX: .087,
		upperY: .025,
		lowerY: .115,
		socketRadius: .026,
		socketBevel: .004,
		backingTone: .022,
		metalTone: .68,
		cavityTone: .025,
		faceTone: .11,
		socketTone: .022,
		backingHeight: .02,
		bodyHeight: .17,
		rimHeight: .36,
		cavityHeight: .1,
		faceHeight: .27,
		collarHeight: .31,
		keyHeight: .33,
		latchHeight: .43,
		socketHeight: .08,
		backingRoughness: .98,
		rimRoughness: .32,
		cavityRoughness: .96,
		faceRoughness: .81,
		collarRoughness: .31,
		keyRoughness: .3,
		latchRoughness: .28,
		socketRoughness: .98,
		backingAO: .48,
		bodyAO: .93,
		rimAO: .98,
		cavityAO: .35,
		faceAO: .87,
		collarAO: .96,
		keyAO: .95,
		latchAO: .97,
		socketAO: .2,
		grainTone: .008,
		grainHeight: 5e-4,
		grainRoughness: .012,
		edgeAO: .14
	}),
	bncfemalefaces: Object.freeze({
		dark: [
			12,
			15,
			20
		],
		light: [
			242,
			244,
			240
		],
		roughness: .32,
		relief: .0045,
		cells: 2,
		jitter: .018,
		minScale: .94,
		maxScale: 1,
		flangeRadius: .36,
		flangeBevel: .01,
		bodyRadius: .28,
		bodyBevel: .01,
		studCenter: .288,
		studHalfWidth: .044,
		studHalfHeight: .028,
		studCorner: .012,
		studBevel: .004,
		cavityRadius: .245,
		cavityBevel: .025,
		insulatorRadius: .183,
		insulatorBevel: .007,
		contactRadius: .053,
		contactBevel: .004,
		holeRadius: .028,
		holeBevel: .004,
		backingTone: .022,
		metalTone: .66,
		insulatorTone: .94,
		contactTone: .79,
		holeTone: .025,
		backingHeight: .02,
		flangeHeight: .16,
		bodyHeight: .62,
		studHeight: .44,
		cavityHeight: .2,
		insulatorHeight: .23,
		contactHeight: .3,
		holeHeight: .08,
		backingRoughness: .98,
		flangeRoughness: .39,
		studRoughness: .35,
		cavityRoughness: .44,
		insulatorRoughness: .81,
		contactRoughness: .24,
		holeRoughness: .98,
		backingAO: .48,
		flangeAO: .92,
		bodyAO: .98,
		studAO: .88,
		cavityAO: .42,
		insulatorAO: .72,
		contactAO: .84,
		holeAO: .19,
		grainTone: .008,
		grainHeight: 5e-4,
		grainRoughness: .012,
		edgeAO: .14
	}),
	iecc14inlets: Object.freeze({
		dark: [
			15,
			18,
			23
		],
		light: [
			235,
			239,
			241
		],
		roughness: .84,
		relief: .0045,
		cells: 2,
		jitter: .016,
		minScale: .94,
		maxScale: 1,
		halfWidth: .37,
		halfHeight: .285,
		bodyCorner: .032,
		bodyBevel: .009,
		mouthHalfWidth: .293,
		mouthHalfHeight: .204,
		mouthCorner: .015,
		mouthBevel: .008,
		chamfer: .082,
		pinX: .153,
		topY: -.063,
		bottomY: .057,
		pinHalfWidth: .021,
		pinHalfHeight: .042,
		pinCorner: .004,
		pinBevel: .003,
		backingTone: .018,
		bodyTone: .115,
		mouthTone: .015,
		pinTone: .87,
		backingHeight: .02,
		bodyHeight: .44,
		mouthHeight: .1,
		pinHeight: .31,
		backingRoughness: .98,
		mouthRoughness: .96,
		pinRoughness: .27,
		backingAO: .48,
		bodyAO: .97,
		mouthAO: .3,
		pinAO: .98,
		grainTone: .008,
		grainHeight: 5e-4,
		grainRoughness: .012,
		bodyContactAO: .2,
		mouthContactAO: .18,
		pinContactAO: .1
	}),
	dsubsocketfaces: Object.freeze({
		dark: [
			16,
			20,
			25
		],
		light: [
			236,
			239,
			240
		],
		roughness: .3,
		relief: .0045,
		cells: 2,
		jitter: .018,
		minScale: .96,
		maxScale: 1.04,
		halfWidth: .4,
		halfHeight: .164,
		plateCorner: .024,
		plateBevel: .008,
		shellHalfWidth: .262,
		shellHalfHeight: .122,
		shellBevel: .008,
		faceHalfWidth: .235,
		faceHalfHeight: .092,
		faceBevel: .007,
		taper: .2,
		topSockets: 5,
		bottomSockets: 4,
		pitch: .072,
		rowY: .04,
		socketRadius: .024,
		socketBevel: .006,
		mountX: .324,
		mountCollarRadius: .049,
		mountCollarBevel: .007,
		mountRadius: .034,
		mountBevel: .005,
		backingTone: .018,
		plateTone: .72,
		shellTone: .93,
		faceTone: .1,
		socketTone: .018,
		collarTone: .9,
		mountTone: .018,
		backingHeight: .02,
		plateHeight: .26,
		shellHeight: .65,
		faceHeight: .48,
		socketHeight: .16,
		collarHeight: .35,
		mountHeight: .02,
		backingRoughness: .97,
		shellRoughness: .24,
		faceRoughness: .82,
		socketRoughness: .96,
		collarRoughness: .26,
		mountRoughness: .97,
		backingAO: .4,
		plateAO: .98,
		shellAO: .99,
		faceAO: .94,
		socketAO: .22,
		collarAO: .99,
		mountAO: .2,
		grainTone: .014,
		grainHeight: 6e-4,
		grainRoughness: .018,
		plateContactAO: .24,
		shellContactAO: .12,
		faceContactAO: .12
	}),
	topadjusttrimmers: Object.freeze({
		dark: [
			20,
			25,
			31
		],
		light: [
			235,
			235,
			223
		],
		roughness: .27,
		relief: .0045,
		cells: 2,
		jitter: .018,
		minScale: .95,
		maxScale: 1.05,
		halfWidth: .33,
		halfHeight: .22,
		bodyBevel: .012,
		headX: -.2,
		headY: -.105,
		headRadius: .085,
		headBevel: .005,
		slotHalfWidth: .024,
		slotBevel: .006,
		backingTone: .018,
		bodyTone: .24,
		headTone: .89,
		slotToneDrop: .12,
		backingHeight: .02,
		bodyHeight: .34,
		headHeight: .68,
		slotDepth: .18,
		bodyRoughness: .8,
		slotRoughness: .12,
		grainHeight: 7e-4,
		bodyGrainTone: .02,
		headGrainTone: .014,
		grainRoughness: .018,
		backingRoughness: .97,
		backingAO: .4,
		bodyAO: .96,
		headAO: .99,
		slotAO: .22,
		bodyContactAO: .28,
		headContactAO: .24
	}),
	crownprobetips: Object.freeze({
		dark: [
			26,
			22,
			14
		],
		light: [
			238,
			210,
			125
		],
		roughness: .26,
		relief: .0035,
		cells: 3,
		jitter: .025,
		minScale: .95,
		maxScale: 1.05,
		radius: .36,
		bevel: .012,
		throatRadius: .1,
		bowlRimRadius: .3,
		peakStart: .265,
		peakEnd: .4,
		sideRadius: .115,
		backingTone: .018,
		throatTone: .22,
		rimTone: .61,
		peakTone: .9,
		backingHeight: .02,
		throatHeight: .18,
		rimHeight: .39,
		peakRise: .42,
		grainHeight: 6e-4,
		grainTone: .016,
		grainRoughness: .016,
		backingRoughness: .97,
		throatRoughness: .43,
		backingAO: .37,
		throatAO: .5,
		rimAO: .88,
		peakAO: .99,
		contactAO: .25
	}),
	piezodiaphragms: Object.freeze({
		dark: [
			25,
			28,
			30
		],
		light: [
			242,
			240,
			228
		],
		roughness: .27,
		relief: .006,
		cells: 2,
		jitter: .045,
		minScale: .94,
		maxScale: 1.06,
		plateRadius: .36,
		plateBevel: .011,
		ceramicRadius: .25,
		ceramicBevel: .006,
		electrodeRadius: .225,
		electrodeBevel: .004,
		backingTone: .012,
		plateTone: .64,
		ceramicTone: .98,
		electrodeTone: .88,
		backingHeight: .025,
		plateHeight: .32,
		ceramicHeight: .57,
		electrodeHeight: .58,
		grainHeight: 7e-4,
		plateGrainTone: .025,
		ceramicGrainTone: .018,
		electrodeGrainTone: .025,
		backingRoughness: .97,
		ceramicRoughness: .76,
		electrodeRoughness: .23,
		grainRoughness: .02,
		backingAO: .38,
		plateAO: .95,
		ceramicAO: .98,
		electrodeAO: .99,
		contactAO: .28
	}),
	castellatedboards: Object.freeze({
		dark: [
			8,
			32,
			26
		],
		light: [
			231,
			238,
			235
		],
		roughness: .27,
		relief: .006,
		cells: 2,
		jitter: .016,
		halfSize: .315,
		bodyBevel: .005,
		contactsPerSide: 7,
		pitch: .075,
		holeRadius: .02,
		holeBevel: .0025,
		landRadius: .033,
		landBevel: .0025,
		backingTone: .012,
		bodyTone: .17,
		metalTone: .94,
		backingHeight: .025,
		bodyHeight: .52,
		landHeight: .535,
		grainHeight: 6e-4,
		bodyGrainTone: .018,
		metalGrainTone: .025,
		backingRoughness: .97,
		bodyRoughness: .76,
		bodyGrainRoughness: .02,
		metalGrainRoughness: .018,
		backingAO: .36,
		bodyAO: .94,
		metalAO: .99,
		contactAO: .3
	}),
	qfnlandpads: Object.freeze({
		dark: [
			8,
			12,
			16
		],
		light: [
			234,
			237,
			241
		],
		roughness: .23,
		relief: .006,
		cells: 2,
		jitter: .018,
		halfSize: .315,
		bodyBevel: .012,
		landsPerSide: 7,
		pitch: .069,
		landCenter: .275,
		landHalfLength: .033,
		landRadius: .0155,
		landBevel: .003,
		padHalfSize: .145,
		backingTone: .025,
		bodyTone: .08,
		metalTone: .88,
		backingHeight: .025,
		bodyHeight: .52,
		landHeight: .56,
		grainHeight: .001,
		bodyGrainTone: .02,
		metalGrainTone: .035,
		backingRoughness: .96,
		bodyRoughness: .84,
		bodyGrainRoughness: .025,
		metalGrainRoughness: .02,
		backingAO: .35,
		bodyAO: .93,
		metalAO: .99,
		contactAO: .6
	}),
	bgasolderballs: Object.freeze({
		dark: [
			9,
			13,
			17
		],
		light: [
			231,
			236,
			240
		],
		roughness: .27,
		relief: .012,
		cells: 2,
		jitter: .012,
		halfSize: .34,
		bodyBevel: .018,
		grid: 13,
		pitch: .04,
		ballRadius: .0125,
		ballBevel: .22,
		backingTone: .025,
		carrierTone: .14,
		ballTone: .84,
		backingHeight: .03,
		carrierHeight: .25,
		ballRise: .55,
		grainHeight: .0015,
		backingRoughness: .94,
		carrierRoughness: .84,
		backingAO: .42,
		carrierAO: .93,
		contactAO: .25
	}),
	ballbearingfaces: Object.freeze({
		dark: [
			17,
			20,
			25
		],
		light: [
			232,
			237,
			241
		],
		roughness: .28,
		relief: .006,
		cells: 4,
		radius: .44,
		edge: .415,
		bore: .135,
		boreEdge: .16,
		raceRadius: .29,
		raceSquaredBand: .04,
		raceShoulder: .25,
		ballRadius: .073,
		ballCore: .055
	}),
	baseballleather: Object.freeze({
		dark: [
			126,
			18,
			14
		],
		light: [
			246,
			242,
			223
		],
		roughness: .66,
		relief: .003,
		columns: 2,
		rows: 20,
		bend: .14,
		seamRadius: .07,
		threadStartX: .08,
		threadEndX: .64,
		threadStartY: .2,
		threadEndY: -.2,
		threadRadius: .04,
		threadShoulder: .3
	}),
	toothbrushheads: Object.freeze({
		dark: [
			8,
			42,
			91
		],
		light: [
			232,
			245,
			250
		],
		roughness: .44,
		relief: .008,
		cells: 4,
		radius: .19,
		edge: .17,
		straight: .19,
		tuftColumns: 3,
		tuftRows: 6,
		pitch: .1,
		tuftRadius: .038,
		tuftCore: .03
	}),
	bowtieinlay: Object.freeze({
		dark: [
			42,
			20,
			7
		],
		light: [
			217,
			176,
			104
		],
		roughness: .66,
		relief: .006,
		columns: 2,
		rows: 3,
		warp: .08,
		crackWidth: .024,
		halfLength: .27,
		endCore: .245,
		flareRun: .24,
		waist: .07,
		flare: .14,
		sideSquaredShoulder: .002
	}),
	redcabbagecut: Object.freeze({
		dark: [
			48,
			6,
			43
		],
		light: [
			243,
			223,
			228
		],
		roughness: .74,
		relief: .008,
		cells: 2,
		radius: .43,
		edge: .41,
		fleshRadius: .4,
		fleshEdge: .38,
		rings: 6,
		warp: 2.4,
		fold: .6,
		veinWidth: .095,
		veinShoulder: .045,
		pithX: .055,
		pithY: .11,
		pithCenter: .08,
		pithShoulder: .3
	}),
	slottedturners: Object.freeze({
		dark: [
			12,
			16,
			20
		],
		light: [
			225,
			231,
			237
		],
		roughness: .32,
		relief: .004,
		cells: 4,
		bladeX: .22,
		bladeY: .22,
		bladeCenter: -.1,
		cornerRadius: .06,
		cornerCore: .045,
		neckCenter: .3,
		neckStraight: .1,
		neckRadius: .065,
		neckCore: .05,
		slotPitch: .14,
		slotStraight: .13,
		slotRadius: .035,
		slotCore: .025
	}),
	triglidesliders: Object.freeze({
		dark: [
			4,
			8,
			12
		],
		light: [
			87,
			105,
			115
		],
		roughness: .62,
		relief: .006,
		cells: 4,
		straightX: .3,
		straightY: .25,
		radius: .08,
		core: .06,
		windowOffset: .15,
		windowX: .055,
		windowY: .18,
		windowRadius: .05,
		windowCore: .035
	}),
	popcorn: Object.freeze({
		dark: [
			50,
			19,
			5
		],
		light: [
			255,
			247,
			215
		],
		roughness: .82,
		relief: .01,
		cells: 4,
		lobes: 7,
		centerRadius: .19,
		distance: .14,
		distanceVariation: .09,
		radius: .13,
		radiusVariation: .055,
		angleJitter: .28,
		shoulder: .3,
		hullX: .075,
		hullY: .095,
		hullOffsetX: .03,
		hullOffsetY: -.045,
		hullShoulder: .35,
		hullBend: .28
	}),
	dualinlinechips: Object.freeze({
		dark: [
			3,
			5,
			7
		],
		light: [
			220,
			229,
			232
		],
		roughness: .72,
		relief: .01,
		cells: 4,
		straightX: .12,
		straightY: .3,
		radius: .035,
		core: .025,
		pinsPerSide: 7,
		pinPitch: .09,
		pinX: .23,
		pinStraight: .08,
		pinRadius: .019,
		pinCore: .013,
		markerX: -.075,
		markerY: -.235,
		markerRadius: .027,
		markerCore: .018
	}),
	tortoiseshellacetate: Object.freeze({
		dark: [
			19,
			7,
			2
		],
		light: [
			244,
			168,
			58
		],
		roughness: .2,
		relief: .002,
		macroCells: 12,
		detailCells: 32,
		warpCells: 4,
		grainCells: 192,
		warp: .13,
		macroWeight: .75,
		threshold: .43,
		shoulder: .19
	}),
	silknoil: Object.freeze({
		dark: [
			171,
			143,
			100
		],
		light: [
			255,
			253,
			239
		],
		roughness: .86,
		relief: .0016,
		threads: 128,
		nepCells: 48,
		nepChance: .35,
		nepHalfMinimum: .15,
		nepHalfVariation: .12,
		nepWidthMinimum: .07,
		nepWidthVariation: .05,
		nepShoulder: .4,
		nepLift: .11,
		nepRoughness: .035,
		nepToneMinimum: .45,
		nepToneVariation: .35,
		baseHeight: .26,
		yarnLift: .045,
		interlaceLift: .02
	}),
	matelasse: Object.freeze({
		dark: [
			192,
			183,
			160
		],
		light: [
			255,
			252,
			236
		],
		roughness: .88,
		relief: .0016,
		cells: 6,
		threads: 128,
		ribRadius: .075,
		baseHeight: .28,
		ribLift: .2,
		panelLift: .07,
		yarnLift: .035,
		interlaceLift: .02
	}),
	cathedralquilt: Object.freeze({
		dark: [
			8,
			29,
			63
		],
		light: [
			247,
			233,
			201
		],
		roughness: .84,
		relief: .008,
		cells: 6,
		radiusSquared: .25,
		shoulder: .025,
		foldWidth: .045
	}),
	buckwheathulls: Object.freeze({
		dark: [
			10,
			5,
			1
		],
		light: [
			155,
			118,
			70
		],
		roughness: .73,
		relief: .003,
		cells: 8,
		jitter: .035,
		inradius: .17,
		shoulder: .035,
		ridgeRadius: .012,
		ridgeStart: .025,
		ridgeEnd: .27,
		ridgeTip: .035
	}),
	rutilatedquartz: Object.freeze({
		dark: [
			104,
			60,
			5
		],
		light: [
			241,
			240,
			221
		],
		roughness: .19,
		relief: .002,
		cells: 4,
		needlePitch: .045,
		needleRadius: .008,
		length: .26,
		lengthVariation: .1,
		shoulder: .25,
		crossAngle: .9,
		crossVariation: .4
	}),
	peppermintcanes: Object.freeze({
		dark: [
			154,
			9,
			16
		],
		light: [
			255,
			249,
			232
		],
		roughness: .24,
		relief: .01,
		cells: 4,
		bendRadius: .16,
		bendY: -.18,
		longEnd: .34,
		shortEnd: -.06,
		radius: .04,
		core: .03,
		stripeFrequency: 12,
		stripeSlope: .65,
		stripeHalfWidth: .28,
		stripeShoulder: .08
	}),
	rubbergrommets: Object.freeze({
		dark: [
			2,
			3,
			3
		],
		light: [
			75,
			82,
			84
		],
		roughness: .86,
		relief: .008,
		cells: 4,
		outerRadius: .42,
		outerCore: .4,
		boreRadius: .15,
		boreCore: .17,
		collarRadius: .29,
		collarCore: .26,
		grooveRadius: .32,
		grooveBand: .008
	}),
	chioggiabeetcuts: Object.freeze({
		dark: [
			126,
			8,
			38
		],
		light: [
			255,
			238,
			204
		],
		roughness: .73,
		relief: .008,
		cells: 4,
		jitter: .02,
		scale: .94,
		scaleVariation: .05,
		radius: .43,
		core: .415,
		fleshRadius: .4,
		fleshCore: .39,
		rings: 6,
		firstRing: .065,
		ringPitch: .06,
		ringHalfWidth: .018,
		ringCore: .0135
	}),
	flatflexcables: Object.freeze({
		dark: [
			104,
			57,
			12
		],
		light: [
			235,
			238,
			220
		],
		roughness: .54,
		relief: .008,
		cells: 4,
		straightX: .22,
		straightY: .38,
		radius: .02,
		core: .012,
		contacts: 6,
		pitch: .07,
		contactY: .29,
		contactStraight: .065,
		contactRadius: .017,
		contactCore: .012,
		traceRadius: .011,
		traceStart: -.34,
		traceEnd: .185,
		traceShoulder: .035
	}),
	celerycuts: Object.freeze({
		dark: [
			31,
			75,
			20
		],
		light: [
			224,
			242,
			174
		],
		roughness: .74,
		relief: .008,
		cells: 4,
		outerX: .35,
		outerY: .27,
		outerShoulder: .08,
		notchX: .26,
		notchY: .24,
		notchOffset: .14,
		notchShoulder: .12,
		fleshX: .33,
		fleshY: .245,
		fleshShoulder: .08,
		fleshNotchX: .28,
		fleshNotchY: .26,
		fleshNotchShoulder: .1,
		vessels: 5,
		vesselX: .27,
		vesselY: .2,
		vesselOffset: .005,
		vesselStart: Math.PI / 12,
		vesselStep: Math.PI * 5 / 24,
		vesselRadius: .012,
		vesselCore: .008
	}),
	tactileswitches: Object.freeze({
		dark: [
			11,
			14,
			13
		],
		light: [
			215,
			218,
			208
		],
		roughness: .8,
		relief: .008,
		cells: 4,
		straight: .21,
		radius: .025,
		core: .017,
		plateStraight: .18,
		plateRadius: .02,
		plateCore: .014,
		pinX: .275,
		pinY: .125,
		pinStraight: .055,
		pinRadius: .018,
		pinCore: .013,
		plungerRadius: .07,
		plungerCore: .06
	}),
	paisleybrocade: Object.freeze({
		dark: [
			18,
			34,
			62
		],
		light: [
			224,
			189,
			110
		],
		roughness: .86,
		relief: .006,
		cells: 4,
		halfHeight: .29,
		halfWidth: .18,
		bend: .27,
		widthBias: .7,
		widthSlope: .3,
		shoulder: .08,
		inset: .15,
		dots: 3,
		dotStart: -.35,
		dotStep: .35,
		dotRadius: .014,
		dotCore: .01
	}),
	siliconepastrybrushes: Object.freeze({
		dark: [
			128,
			34,
			8
		],
		light: [
			250,
			141,
			56
		],
		roughness: .76,
		relief: .008,
		cells: 4,
		handleY: -.165,
		handleStraight: .205,
		handleRadius: .04,
		handleCore: .028,
		headY: .14,
		headStraightX: .15,
		headStraightY: .065,
		headRadius: .02,
		headCore: .014,
		prongs: 7,
		pitch: .05,
		prongY: .3,
		prongStraight: .075,
		prongRadius: .012,
		prongCore: .008,
		pitY: -.3,
		pitRadius: .014,
		pitCore: .009
	}),
	graphicgranite: Object.freeze({
		dark: [
			34,
			25,
			25
		],
		light: [
			222,
			176,
			151
		],
		roughness: .24,
		relief: .002,
		cells: 4,
		clusters: 3,
		roots: [
			-.13,
			-.1,
			.13,
			-.08,
			0,
			.14
		],
		jitter: .02,
		arms: 2,
		angleGap: .9,
		angleVariation: .25,
		strokeOffset: .065,
		halfLength: .14,
		lengthVariation: .035,
		halfWidth: .025,
		widthVariation: .008,
		shoulder: .18
	}),
	brasspadlocks: Object.freeze({
		dark: [
			116,
			62,
			12
		],
		light: [
			245,
			222,
			135
		],
		roughness: .35,
		relief: .008,
		cells: 4,
		bodyY: .14,
		straightX: .18,
		straightY: .13,
		radius: .03,
		core: .02,
		bendY: -.1,
		bendRadius: .13,
		endY: .04,
		shackleRadius: .027,
		shackleCore: .019,
		keyY: .1,
		keyRadius: .025,
		keyCore: .017,
		stemY: .15,
		stemStraight: .025,
		stemRadius: .015,
		stemCore: .01
	}),
	carrotcuts: Object.freeze({
		dark: [
			137,
			40,
			6
		],
		light: [
			255,
			194,
			82
		],
		roughness: .74,
		relief: .008,
		cells: 4,
		jitter: .02,
		scale: .94,
		scaleVariation: .05,
		radius: .43,
		core: .415,
		fleshRadius: .405,
		fleshCore: .39,
		pithRadius: .17,
		pithCore: .15,
		rays: 12,
		rayCenter: .27,
		rayHalfLength: .1,
		rayHalfWidth: .008,
		rayShoulder: .2
	}),
	bluepushpins: Object.freeze({
		dark: [
			5,
			17,
			130
		],
		light: [
			237,
			242,
			247
		],
		roughness: .4,
		relief: .008,
		cells: 4,
		flangeStraightX: .125,
		flangeStraightY: .025,
		flangeRadius: .025,
		flangeCore: .017,
		topY: -.24,
		baseY: .13,
		neckY: -.055,
		neckStraight: .15,
		neckRadius: .055,
		neckCore: .045,
		needleCenter: .2825,
		needleHalfLength: .1475,
		needleHalfWidth: .018,
		needleShoulder: .2
	}),
	oatflakes: Object.freeze({
		dark: [
			135,
			91,
			43
		],
		light: [
			245,
			229,
			188
		],
		roughness: .84,
		relief: .001,
		cells: 4,
		jitter: .025,
		scale: .93,
		scaleVariation: .06,
		halfLength: .34,
		halfWidth: .235,
		shoulder: .12,
		rimVariation: .03,
		creaseHalfLength: .245,
		creaseHalfWidth: .018,
		fiberPairs: 3,
		fiberFirst: .055,
		fiberPitch: .0525,
		fiberHalfLength: .265,
		fiberShrink: .0475,
		fiberHalfWidth: .007,
		detailShoulder: .2
	}),
	tigerfur: Object.freeze({
		dark: [
			14,
			8,
			4
		],
		light: [
			244,
			156,
			54
		],
		roughness: .87,
		relief: .002,
		rows: 6,
		warp: .12,
		bandWidth: .11,
		bandVariation: .025,
		bandShoulder: .0025,
		forks: 2,
		forkHalfLength: .3,
		forkHalfWidth: .045,
		forkReach: .28,
		forkShoulder: .2
	}),
	grosgrainribbons: Object.freeze({
		dark: [
			12,
			23,
			61
		],
		light: [
			143,
			180,
			210
		],
		roughness: .86,
		relief: .001,
		columns: 4,
		radius: .43,
		core: .415,
		weftRows: 64,
		weftRadius: .43,
		weftCore: .25,
		edgeCount: 3,
		edgeFirst: .335,
		edgePitch: .03,
		edgeRadius: .006,
		edgeCore: .004
	}),
	azuritemalachite: Object.freeze({
		dark: [
			10,
			23,
			114
		],
		light: [
			95,
			188,
			131
		],
		roughness: .28,
		relief: .002,
		cells: 4,
		jitter: .025,
		scale: .92,
		scaleVariation: .07,
		globules: 3,
		clusterRadius: .12,
		radius: .19,
		core: .16,
		rings: 2,
		firstRing: .055,
		ringPitch: .06,
		ringHalfWidth: .012,
		ringCore: .007
	}),
	openendspanners: Object.freeze({
		dark: [
			78,
			86,
			96
		],
		light: [
			238,
			243,
			246
		],
		roughness: .34,
		relief: .008,
		cells: 4,
		topY: -.27,
		topRadius: .105,
		topCore: .095,
		topCutY: -.285,
		topCutRadius: .045,
		topCutCore: .035,
		lowerY: .27,
		lowerRadius: .09,
		lowerCore: .08,
		lowerCutY: .285,
		lowerCutRadius: .04,
		lowerCutCore: .03,
		shaftStraight: .2,
		shaftRadius: .03,
		shaftCore: .022
	}),
	lentilseeds: Object.freeze({
		dark: [
			75,
			57,
			27
		],
		light: [
			208,
			181,
			110
		],
		roughness: .83,
		relief: .0015,
		cells: 4,
		jitter: .03,
		scale: .9,
		scaleVariation: .09,
		halfX: .3,
		halfY: .27,
		shoulder: .12,
		hilumX: .2,
		hilumStraight: .025,
		hilumRadius: .012,
		hilumCore: .008
	}),
	blueprintpaper: Object.freeze({
		dark: [
			8,
			27,
			75
		],
		light: [
			225,
			242,
			250
		],
		roughness: .88,
		relief: 4e-4,
		cells: 4,
		subdivisions: 4,
		minorRadius: .022,
		minorCore: .012,
		majorRadius: .014,
		majorCore: .008,
		frameX: .22,
		frameY: .15,
		frameOuter: .03,
		frameOuterCore: .027,
		frameInner: .02,
		frameInnerCore: .017,
		circleOuter: .105,
		circleOuterCore: .102,
		circleInner: .095,
		circleInnerCore: .092,
		strokeRadius: .0065,
		strokeCore: .0045,
		axisX: .29,
		axisY: .22,
		axisFade: .02,
		dimensionY: -.25,
		dimensionHalf: .25,
		dimensionTick: .025
	}),
	horsechestnutleaf: Object.freeze({
		dark: [
			21,
			61,
			19
		],
		light: [
			153,
			190,
			70
		],
		roughness: .77,
		relief: .0025,
		cells: 4,
		jitter: .025,
		scale: .92,
		scaleVariation: .06,
		leaflets: 7,
		angleStep: 25,
		tipLength: .38,
		tipStep: .02,
		bladeBase: .07,
		halfWidth: .055,
		shoulder: .2,
		teeth: 8,
		serration: .12,
		rootRadius: .025,
		rootCore: .02,
		petioleHalf: .16,
		petioleRadius: .009,
		petioleCore: .006,
		petioluleHalf: .065,
		petioluleRadius: .007,
		petioluleCore: .005,
		veinRadius: .007,
		veinCore: .0045
	}),
	binderclips: Object.freeze({
		dark: [
			8,
			11,
			16
		],
		light: [
			237,
			242,
			247
		],
		roughness: .5,
		relief: .008,
		cells: 4,
		bodyHalfY: .13,
		bodyCoreY: .115,
		bodyHalfX: .15,
		bodyTaper: .23,
		bodyShoulderSquared: .003,
		bendY: .23,
		bendRadius: .1,
		endY: .07,
		wireRadius: .012,
		wireCore: .009,
		lipY: .095,
		lipStraight: .12,
		lipRadius: .012,
		lipCore: .009
	}),
	charoite: Object.freeze({
		dark: [
			32,
			15,
			58
		],
		light: [
			216,
			186,
			238
		],
		roughness: .26,
		relief: .002,
		bands: 6,
		fibers: 12,
		warpA: 1.8,
		warpB: .7,
		fiberDrift: .45,
		bandRadius: .2,
		bandCore: .12,
		fiberRadius: .18,
		fiberCore: .09,
		inclusionCells: 8,
		inclusionChance: .35,
		inclusionJitter: .12,
		inclusionRadiusX: .13,
		inclusionVariationX: .08,
		inclusionRadiusY: .07,
		inclusionVariationY: .05,
		inclusionShoulder: .2
	}),
	chenilleyarn: Object.freeze({
		dark: [
			79,
			17,
			62
		],
		light: [
			243,
			144,
			208
		],
		roughness: .9,
		relief: .003,
		columns: 8,
		rows: 128,
		coreRadius: .27,
		coreFull: .24,
		fiberHalf: .34,
		fiberVariation: .1,
		fiberJitterX: .02,
		fiberJitterY: .13,
		fiberSlope: .4,
		fiberRadiusY: .17,
		fiberShoulder: .2
	}),
	ceramicfuses: Object.freeze({
		dark: [
			46,
			52,
			60
		],
		light: [
			235,
			237,
			240
		],
		roughness: .68,
		relief: .008,
		cells: 4,
		straightX: .06,
		straightY: .265,
		radius: .015,
		core: .01,
		endStart: .16,
		endFull: .18,
		collarY: .195,
		collarRadius: .008,
		collarCore: .005
	}),
	hazelnutshells: Object.freeze({
		dark: [
			61,
			29,
			14
		],
		light: [
			223,
			183,
			116
		],
		roughness: .77,
		relief: .0035,
		cells: 4,
		jitter: .02,
		scale: .93,
		scaleVariation: .05,
		halfX: .3,
		halfY: .36,
		shoulder: .12,
		scarY: .2,
		scarRadiusX: .14,
		scarRadiusY: .1,
		scarShoulder: .2
	}),
	yagasuricloth: Object.freeze({
		dark: [
			52,
			22,
			72
		],
		light: [
			243,
			226,
			193
		],
		roughness: .87,
		relief: .0012,
		cells: 4,
		threads: 96,
		shaftX: .022,
		shaftY: .42,
		wingCenter: .14,
		wingSpan: .18,
		wingThickness: .055,
		slope: .55,
		spacing: .22,
		shoulder: .2
	}),
	balloonwhisks: Object.freeze({
		dark: [
			42,
			43,
			47
		],
		light: [
			233,
			235,
			238
		],
		roughness: .24,
		relief: .008,
		cells: 4,
		jitter: .018,
		scale: .92,
		scaleVariation: .04,
		headRadii: [
			.05,
			.1,
			.15
		],
		headY: -.12,
		headYRadius: .19,
		wireRadius: .009,
		wireCore: .0065,
		neckY: .14,
		neckStraight: .075,
		neckRadius: .012,
		neckCore: .008,
		handleY: .28,
		handleStraight: .09,
		handleRadius: .035,
		handleCore: .028,
		bandCount: 4,
		bandFirst: .205,
		bandPitch: .05,
		bandRadius: .008,
		bandCore: .005
	}),
	orthocerasstone: Object.freeze({
		dark: [
			12,
			14,
			16
		],
		light: [
			217,
			218,
			214
		],
		roughness: .27,
		relief: .001,
		cells: 4,
		jitter: .016,
		scale: .92,
		scaleVariation: .04,
		tipY: -.37,
		baseY: .35,
		capStart: .27,
		capRadius: .08,
		halfWidth: .12,
		edgeSlope: .07,
		tipShoulder: 5e-4,
		septumCount: 8,
		septumFirst: -.24,
		septumPitch: .075,
		septumBend: .04,
		septumRadius: .0065,
		septumCore: .0035
	}),
	rickracktrim: Object.freeze({
		dark: [
			65,
			17,
			25
		],
		light: [
			244,
			170,
			177
		],
		roughness: .84,
		relief: .002,
		columns: 6,
		cycles: 8,
		amplitude: .18,
		halfWidth: .05,
		fullWidth: .045,
		edgePosition: .64,
		edgeBand: .12,
		fibers: 96,
		fiberSlant: 4
	}),
	toroidalinductors: Object.freeze({
		dark: [
			19,
			18,
			17
		],
		light: [
			230,
			137,
			75
		],
		roughness: .79,
		relief: .008,
		cells: 4,
		jitter: .02,
		scale: .94,
		scaleVariation: .04,
		turns: 12,
		innerRadius: .18,
		outerRadius: .31,
		innerShoulder: .003,
		outerShoulder: .004,
		wireCenter: .25,
		wireStraight: .085,
		wireRadius: .018,
		wireCore: .014
	}),
	pennerigate: Object.freeze({
		dark: [
			91,
			49,
			15
		],
		light: [
			247,
			215,
			138
		],
		roughness: .8,
		relief: .006,
		cells: 4,
		jitter: .018,
		scale: .94,
		scaleVariation: .04,
		halfX: .14,
		halfY: .34,
		fullY: .32,
		shoulder: .12,
		cutSlope: .55,
		ridgePitch: .05,
		ridgeRadius: .012,
		ridgeCore: .008,
		mouthCenter: .26,
		mouthX: .1,
		mouthY: .04,
		mouthShoulder: .2
	}),
	lepidolitemica: Object.freeze({
		dark: [
			58,
			36,
			80
		],
		light: [
			225,
			184,
			237
		],
		roughness: .72,
		relief: .002,
		cells: 12,
		jitter: .015,
		scale: .94,
		scaleVariation: .04,
		outerRadius: .32,
		middleRadius: .24,
		innerRadius: .16,
		bevel: .018
	}),
	brassjinglebells: Object.freeze({
		dark: [
			40,
			26,
			6
		],
		light: [
			246,
			202,
			83
		],
		roughness: .33,
		relief: .008,
		cells: 4,
		jitter: .015,
		scale: .94,
		scaleVariation: .04,
		outerRadius: .34,
		fullRadius: .32,
		slotLength: .22,
		slotRadius: .016,
		slotCore: .012,
		endRadius: .035,
		endCore: .028,
		centerRadius: .05,
		centerCore: .04,
		seamRadius: .285,
		seamWidth: .0075,
		seamCore: .004
	}),
	nutmeghalves: Object.freeze({
		dark: [
			62,
			28,
			10
		],
		light: [
			228,
			190,
			133
		],
		roughness: .82,
		relief: .003,
		cells: 4,
		jitter: .018,
		scale: .94,
		scaleVariation: .04,
		radiusX: .29,
		radiusY: .37,
		shoulder: .08,
		fleshQ: .78,
		fleshShoulder: .06,
		veins: 6,
		warp: 1.8,
		veinThreshold: .7,
		veinShoulder: .2
	}),
	coaxialcablecuts: Object.freeze({
		dark: [
			14,
			15,
			16
		],
		light: [
			240,
			239,
			229
		],
		roughness: .85,
		relief: .003,
		cells: 4,
		jitter: .015,
		scale: .94,
		scaleVariation: .04,
		outerRadius: .33,
		fullRadius: .318,
		dielectricRadius: .225,
		dielectricFull: .217,
		conductorRadius: .075,
		conductorFull: .065,
		strands: 40,
		shieldRadius: .25,
		strandRadius: .017,
		strandFull: .012
	}),
	shippocloth: Object.freeze({
		dark: [
			12,
			25,
			50
		],
		light: [
			241,
			232,
			209
		],
		roughness: .84,
		relief: .0036,
		cells: 8,
		radiusSquared: .5,
		width: .035,
		core: .02,
		threads: 96
	}),
	driedtamarindpods: Object.freeze({
		dark: [
			70,
			32,
			12
		],
		light: [
			210,
			161,
			98
		],
		roughness: .9,
		relief: .004,
		cells: 4,
		jitter: .012,
		scale: .94,
		scaleVariation: .04,
		lobes: 4,
		pitch: .18,
		radiusX: .09,
		radiusY: .12,
		curve: .025,
		shoulder: .12,
		stemCenter: -.4,
		stemStraight: .025,
		stemRadius: .012,
		stemCore: .008,
		poreThreshold: .65,
		poreShoulder: .15
	}),
	conicalsampletubes: Object.freeze({
		dark: [
			14,
			38,
			68
		],
		light: [
			180,
			221,
			238
		],
		roughness: .46,
		relief: .004,
		cells: 4,
		jitter: .015,
		scale: .94,
		scaleVariation: .04,
		bodyRadius: .12,
		bodyTop: -.25,
		topShoulder: .03,
		taperStart: .1,
		taperLength: .26,
		shoulder: .12,
		capCenter: -.25,
		capX: .155,
		capY: .04,
		hingeCenterX: .14,
		hingeCenterY: -.18,
		hingeX: .03,
		hingeY: .1,
		labelCenter: -.04,
		labelX: .07,
		labelY: .09
	}),
	botryoidalcopper: Object.freeze({
		dark: [
			54,
			22,
			10
		],
		light: [
			225,
			133,
			76
		],
		roughness: .63,
		relief: .004,
		cells: 16,
		radius: .58,
		jitter: .12
	}),
	pencilshavings: Object.freeze({
		dark: [
			61,
			32,
			15
		],
		light: [
			238,
			191,
			112
		],
		roughness: .82,
		relief: .004,
		cells: 4,
		inner: .17,
		innerFull: .185,
		outerFull: .365,
		outer: .38,
		cutShoulder: .025,
		paintStart: .34,
		paintFull: .355,
		flutes: 24,
		jitter: .02,
		scale: .94,
		scaleVariation: .04
	}),
	papayacuts: Object.freeze({
		dark: [
			34,
			18,
			5
		],
		light: [
			249,
			167,
			65
		],
		roughness: .42,
		relief: .004,
		cells: 4,
		width: .255,
		length: .42,
		edge: .08,
		fleshWidth: .235,
		fleshLength: .395,
		fleshEdge: .07,
		pitWidth: .125,
		pitLength: .27,
		pitEdge: .1,
		seedColumns: 4,
		seedRows: 8,
		seedRowLengths: [
			2,
			4,
			4,
			4,
			4,
			4,
			4,
			2
		],
		seedPitchX: .042,
		seedPitchY: .065,
		seedRadius: .016,
		seedCore: .012,
		seedJitter: .0025,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	sewingthimbles: Object.freeze({
		dark: [
			47,
			50,
			56
		],
		light: [
			219,
			224,
			231
		],
		roughness: .38,
		relief: .004,
		cells: 4,
		top: -.32,
		bottom: .31,
		topWidth: .17,
		bottomWidth: .22,
		capJoin: -.12,
		capRadius: .2,
		edge: .12,
		bottomEdge: .025,
		rimCenter: .29,
		rimX: .245,
		rimY: .04,
		columns: 4,
		rows: 6,
		pitchX: .065,
		pitchY: .07,
		originY: .215,
		dimpleRadius: .022,
		dimpleDepth: .18,
		dimpleJitter: .0025,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	boullebrassinlay: Object.freeze({
		dark: [
			22,
			10,
			3
		],
		light: [
			231,
			191,
			105
		],
		roughness: .2,
		relief: .002,
		cells: 4,
		radius: .18,
		bandQ: .0045,
		coreQ: .0032,
		endPad: .035,
		endShoulder: .012,
		budCenterX: .052,
		budCenterY: .354,
		budX: .052,
		budY: .023,
		budShoulder: .2,
		angle: .04,
		jitter: .01,
		scale: .94,
		scaleVariation: .02
	}),
	diamondpanelparquet: Object.freeze({
		dark: [
			58,
			29,
			12
		],
		light: [
			205,
			157,
			94
		],
		roughness: .5,
		relief: .003,
		inner: .4,
		pitch: .2,
		lookupHalf: 3,
		gap: .0015,
		bevel: .0025
	}),
	dendriticfrost: Object.freeze({
		dark: [
			14,
			39,
			65
		],
		light: [
			238,
			249,
			255
		],
		roughness: .88,
		relief: .003,
		cells: 4,
		stemLength: .3,
		stemRadius: .012,
		stemCore: .008,
		branchOrigin: .11,
		branchPitch: .1,
		branchCount: 2,
		branchRun: .03,
		branchRise: .03 * Math.sqrt(3),
		branchRadius: .009,
		branchCore: .006,
		jitter: .02,
		scale: .94,
		scaleVariation: .04
	}),
	bullionknots: Object.freeze({
		dark: [
			13,
			32,
			58
		],
		light: [
			253,
			215,
			118
		],
		roughness: .5,
		relief: .004,
		cells: 4,
		halfLength: .3,
		radius: .075,
		core: .06,
		endShoulder: .025,
		turns: 12,
		threads: 64,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	orecchiette: Object.freeze({
		dark: [
			97,
			64,
			26
		],
		light: [
			246,
			221,
			158
		],
		roughness: .83,
		relief: .004,
		cells: 4,
		radiusX: .32,
		radiusY: .35,
		edge: .12,
		bowlX: .23,
		bowlY: .255,
		bowlOffset: .03,
		rimCenter: .75,
		rimWidth: .14,
		jitter: .02,
		scale: .94,
		scaleVariation: .04
	}),
	solderlessbreadboard: Object.freeze({
		dark: [
			21,
			24,
			27
		],
		light: [
			244,
			242,
			230
		],
		roughness: .54,
		relief: .003,
		columns: 5,
		rows: 16,
		pitch: .0625,
		firstColumn: .09375,
		holeRadius: .014,
		holeEdge: .25,
		channelWidth: .035,
		channelShoulder: .007
	}),
	wulfenite: Object.freeze({
		dark: [
			48,
			25,
			13
		],
		light: [
			255,
			141,
			30
		],
		roughness: .2,
		relief: .003,
		cells: 7,
		chance: .68,
		jitter: .16,
		halfMinimum: .12,
		halfVariation: .1,
		aspectMinimum: .92,
		aspectVariation: .16,
		shoulder: .24
	}),
	staurolite: Object.freeze({
		dark: [
			41,
			22,
			11
		],
		light: [
			230,
			225,
			211
		],
		roughness: .42,
		relief: .0035,
		cells: 4,
		halfLength: .32,
		halfWidth: .07,
		sideShoulder: .009,
		endShoulder: .012,
		twinDegrees: 60,
		jitter: .07,
		scale: .89,
		scaleVariation: .09,
		hostTone: .82,
		faceTone: .18,
		grainTone: .025,
		hostHeight: .12,
		faceHeight: .56,
		hostGrainHeight: .025,
		faceGrainHeight: .004,
		hostRoughness: .87,
		faceRoughnessVariation: .06,
		hostOcclusion: .58,
		faceOcclusion: .97,
		hostToneVariation: .06,
		faceToneVariation: .06,
		hostRoughnessVariation: .04
	}),
	azurite: Object.freeze({
		dark: [
			7,
			13,
			27
		],
		light: [
			29,
			76,
			195
		],
		roughness: .19,
		relief: .0034,
		cells: 5,
		pitch: .16,
		halfWidth: .07,
		sideShoulder: .008,
		endShoulder: .014,
		endSlope: .78,
		tops: [
			-.21,
			-.29,
			-.18
		],
		bottoms: [
			.25,
			.28,
			.21
		],
		striae: 3,
		jitter: .025,
		scale: .93,
		scaleVariation: .045,
		faceTilt: 0,
		striaHeight: .008
	}),
	celestine: Object.freeze({
		dark: [
			83,
			83,
			75
		],
		light: [
			207,
			225,
			248
		],
		roughness: .22,
		relief: .0025,
		cells: 5,
		pitch: .18,
		halfWidth: .083,
		sideShoulder: .009,
		endShoulder: .014,
		endSlope: .12,
		tops: Object.freeze([
			-.21,
			-.27,
			-.18
		]),
		bottoms: Object.freeze([
			.25,
			.21,
			.24
		]),
		striae: 1,
		jitter: .04,
		scale: .9,
		scaleVariation: .06,
		faceTilt: 0,
		striaHeight: .002
	}),
	barite: Object.freeze({
		dark: [
			74,
			61,
			44
		],
		light: [
			248,
			242,
			216
		],
		roughness: .28,
		relief: .003,
		cells: 4,
		pitch: .19,
		halfWidth: .09,
		sideShoulder: .009,
		endShoulder: .014,
		endSlope: .12,
		tops: [
			-.18,
			-.24,
			-.19
		],
		bottoms: [
			.22,
			.25,
			.2
		],
		striae: 1,
		jitter: .045,
		scale: .94,
		scaleVariation: .04,
		faceTilt: 0,
		striaHeight: .002
	}),
	kyaniteblades: Object.freeze({
		dark: [
			12,
			36,
			71
		],
		light: [
			163,
			208,
			243
		],
		roughness: .4,
		relief: .004,
		cells: 4,
		pitch: .12,
		halfWidth: .045,
		sideShoulder: .006,
		endShoulder: .012,
		endSlope: .35,
		tops: [
			-.25,
			-.36,
			-.28
		],
		bottoms: [
			.31,
			.36,
			.29
		],
		striae: 3,
		faceTilt: .05,
		striaHeight: .08,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	internaltoothwashers: Object.freeze({
		dark: [
			27,
			33,
			40
		],
		light: [
			237,
			241,
			246
		],
		roughness: .32,
		relief: .004,
		cells: 4,
		outerRadius: .32,
		fullOuter: .3,
		rootRadius: .22,
		toothDepth: .08,
		innerSquaredShoulder: .003,
		bendRoot: .24,
		fullBend: .19,
		teeth: 12,
		jitter: .02,
		scale: .94,
		scaleVariation: .04
	}),
	driedchillies: Object.freeze({
		dark: [
			45,
			63,
			26
		],
		light: [
			202,
			45,
			30
		],
		roughness: .72,
		relief: .004,
		cells: 4,
		halfLength: .3,
		width: .09,
		tipWidth: .006,
		curve: .16,
		sideShoulder: .3,
		endShoulder: .025,
		wrinkles: 12,
		calyxY: -.285,
		calyxRadiusX: .105,
		calyxRadiusY: .045,
		calyxEdge: .2,
		stemX: -.035,
		stemY: -.4,
		stemRadius: .014,
		stemCore: .009,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	utilityknifeblades: Object.freeze({
		dark: [
			30,
			35,
			42
		],
		light: [
			235,
			241,
			247
		],
		roughness: .36,
		relief: .002,
		cells: 4,
		top: -.18,
		bottom: .18,
		halfTop: .25,
		halfBottom: .36,
		sideShoulder: .012,
		endShoulder: .012,
		notchOffset: .1,
		notchRadius: .027,
		notchCore: .02,
		honeStart: .09,
		honeEnd: .14,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	windmillparquet: Object.freeze({
		dark: [
			41,
			20,
			9
		],
		light: [
			202,
			153,
			89
		],
		roughness: .5,
		relief: .003,
		cells: 4,
		gap: .008,
		shoulder: .014
	}),
	bismuthhoppers: Object.freeze({
		dark: [
			39,
			24,
			90
		],
		light: [
			245,
			205,
			119
		],
		roughness: .3,
		relief: .004,
		cells: 4,
		outerHalf: .34,
		innerHalf: .115,
		stepHalves: [
			.3025,
			.265,
			.2275,
			.19,
			.1525
		],
		shoulder: .008,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	splitvanillapods: Object.freeze({
		dark: [
			25,
			12,
			7
		],
		light: [
			114,
			65,
			26
		],
		roughness: .68,
		relief: .004,
		cells: 3,
		radiusX: .065,
		radiusY: .43,
		curve: .3,
		edge: .12,
		channelRadius: .024,
		channelCore: .016,
		channelHalfLength: .37,
		channelEndShoulder: .05,
		seedRows: 16,
		seedPitch: .04,
		seedRadiusX: .0085,
		seedRadiusY: .01,
		seedEdge: .3,
		seedJitterX: .003,
		seedJitterY: .0015,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	seamrippers: Object.freeze({
		dark: [
			8,
			23,
			65
		],
		light: [
			235,
			240,
			246
		],
		roughness: .3,
		relief: .004,
		cells: 3,
		shaftTop: -.2,
		shaftBottom: .04,
		shaftRadius: .022,
		shaftCore: .016,
		shortStart: [0, -.18],
		shortEnd: [.065, -.27],
		shortRadius: .015,
		shortCore: .011,
		hookRoot: -.18,
		hookTip: -.36,
		hookRootX: -.01,
		hookCurve: .055,
		hookWidth: .018,
		hookTipWidth: .004,
		hookEdge: .3,
		hookEnd: .012,
		handleTop: .05,
		handleBottom: .32,
		handleRadius: .065,
		handleCore: .055,
		ballRadius: .027,
		ballCore: .023,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	flakedarrowheads: Object.freeze({
		dark: [
			49,
			45,
			39
		],
		light: [
			181,
			167,
			139
		],
		roughness: .76,
		relief: .004,
		cells: 4,
		tip: -.36,
		base: .14,
		baseHalf: .22,
		sideShoulder: .01,
		endShoulder: .012,
		stemTop: .1,
		stemBottom: .31,
		stemHalf: .055,
		stemShoulder: .012,
		notchX: .205,
		notchY: .13,
		notchRadiusX: .11,
		notchRadiusY: .04,
		notchEdge: .2,
		scarRows: 5,
		firstScarZ: -.22,
		scarPitch: .06,
		scarSlope: .65,
		scarCenterX: .04,
		scarCenterVariation: .008,
		scarJitter: .003,
		scarRadiusX: .025,
		scarRadiusZ: .018,
		scarEdge: .3,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	dandelionseeds: Object.freeze({
		dark: [
			52,
			39,
			26
		],
		light: [
			245,
			239,
			221
		],
		roughness: .87,
		relief: .0015,
		cells: 3,
		rays: 16,
		hubY: -.17,
		hubRadius: .04,
		hubCore: .033,
		rayLength: .2,
		rayRadius: .006,
		rayCore: .004,
		stemBottom: .15,
		stemRadius: .008,
		stemCore: .005,
		seedY: .235,
		seedRadiusX: .035,
		seedRadiusY: .095,
		seedEdge: .2,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	shojipaperlattice: Object.freeze({
		dark: [
			70,
			39,
			15
		],
		light: [
			249,
			245,
			229
		],
		roughness: .5,
		relief: .004,
		cells: 6,
		railHalf: .07,
		railCore: .045
	}),
	nyloncableties: Object.freeze({
		dark: [
			44,
			40,
			30
		],
		light: [
			246,
			235,
			200
		],
		roughness: .65,
		relief: .004,
		cells: 3,
		headY: -.29,
		headStraightX: .05,
		headStraightY: .04,
		headRadius: .025,
		headCore: .019,
		holeStraight: .012,
		holeRadius: .02,
		holeCore: .014,
		strapHalf: .035,
		strapEdge: .008,
		strapStart: -.245,
		strapEnd: .37,
		endEdge: .01,
		tipHalf: .008,
		taperStart: .27,
		taperLength: .08,
		teeth: 17,
		firstTooth: -.18,
		pitch: .026,
		toothHalfX: .027,
		toothCoreX: .022,
		toothHalfY: .007,
		toothCoreY: .004,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	weavingshuttles: Object.freeze({
		dark: [
			69,
			38,
			15
		],
		light: [
			249,
			245,
			227
		],
		roughness: .5,
		relief: .004,
		cells: 3,
		halfWidth: .15,
		halfLength: .38,
		edge: .012,
		holeStraight: .12,
		holeRadius: .06,
		holeCore: .052,
		shaftStraight: .172,
		shaftRadius: .008,
		shaftCore: .006,
		threadStraightX: .015,
		threadStraightY: .105,
		threadRadius: .02,
		threadCore: .014,
		windings: 12,
		firstWinding: -.099,
		pitch: .018,
		ridgeHalf: .006,
		ridgeCore: .004,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	tailorstapes: Object.freeze({
		dark: [
			29,
			29,
			27
		],
		light: [
			248,
			240,
			209
		],
		roughness: .9,
		relief: .001,
		rows: 4,
		halfWidth: .29,
		edge: .025,
		ticks: 100,
		tickHalf: .18,
		tickCore: .1,
		markOuter: .25,
		markEdge: .012,
		majorLength: .18,
		midLength: .13,
		minorLength: .08,
		weaveCells: 128,
		weaveHalf: .45,
		exposureHalf: .4,
		exposureEdge: .08
	}),
	woodenclothespins: Object.freeze({
		dark: [
			68,
			39,
			16
		],
		light: [
			247,
			241,
			215
		],
		roughness: .55,
		relief: .004,
		cells: 3,
		waistHalf: .09,
		flare: .04,
		flareLength: .32,
		halfLength: .34,
		gapHalf: .009,
		noseStart: .2,
		noseLength: .12,
		noseSpread: .025,
		tailStart: .1,
		tailLength: .2,
		tailSpread: .045,
		sideEdge: .008,
		endEdge: .014,
		springPitch: .025,
		springStraight: .065,
		springRadius: .008,
		springCore: .006,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	cinnamonbarkcoils: Object.freeze({
		dark: [
			51,
			22,
			8
		],
		light: [
			245,
			171,
			104
		],
		roughness: .78,
		relief: .003,
		cells: 3,
		turns: 3.5,
		innerRadius: .038,
		pitch: .085,
		wallHalf: .022,
		wallCore: .018,
		endFade: .25,
		barkStart: .005,
		barkEnd: .008,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	compactcassettefaces: Object.freeze({
		dark: [
			12,
			12,
			10
		],
		light: [
			246,
			230,
			197
		],
		roughness: .58,
		relief: .004,
		cells: 3,
		bodyStraightX: .325,
		bodyStraightY: .195,
		bodyRadius: .035,
		bodyCore: .027,
		reelOffset: .14,
		windowRadius: .105,
		windowCore: .099,
		reelRadius: .095,
		reelCore: .089,
		reelInner: .057,
		reelInnerCore: .05,
		spokes: 6,
		spokeStart: .034,
		spokeEnd: .075,
		spokeRadius: .009,
		spokeCore: .006,
		labelY: -.16,
		labelStraightX: .25,
		labelStraightY: .02,
		labelRadius: .02,
		labelCore: .014,
		headY: .17,
		headHalfX: .055,
		headHalfY: .035,
		guideOffset: .16,
		guideRadius: .025,
		guideCore: .019,
		slotEdge: .006,
		tapeHalfX: .045,
		tapeHalfY: .006,
		tapeEdge: .002,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	kintsugiceramic: Object.freeze({
		dark: [
			4,
			30,
			66
		],
		light: [
			249,
			207,
			76
		],
		roughness: .38,
		relief: 3e-4,
		cells: 4,
		jitter: .1,
		goldCore: .008,
		goldSupport: .03,
		goldRoughness: .24
	}),
	pleatedfilterpapers: Object.freeze({
		dark: [
			100,
			78,
			44
		],
		light: [
			252,
			244,
			220
		],
		roughness: .94,
		relief: .004,
		cells: 3,
		radius: .34,
		rimRipple: .012,
		edgeSquared: .008,
		foldInner: .16,
		foldOuter: .28,
		foldDoublings: 4,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	splitcedarshakes: Object.freeze({
		dark: [
			53,
			29,
			14
		],
		light: [
			221,
			181,
			125
		],
		roughness: .8,
		relief: .008,
		rows: 4,
		columns: 6,
		halfWidth: .475,
		widthVariation: .015,
		top: .46,
		butt: .43,
		buttFray: .03,
		sideEdge: .01,
		endEdge: .014,
		taperHalf: .4,
		splitOffset: .18,
		splitJitter: .04,
		splitStart: .1,
		splitStartVariation: .08,
		splitRadius: .011,
		splitCore: .007
	}),
	swavepavers: Object.freeze({
		dark: [
			45,
			48,
			51
		],
		light: [
			201,
			195,
			182
		],
		roughness: .86,
		relief: .006,
		rows: 4,
		columns: 8,
		sway: .22,
		grout: .01,
		bevel: .016
	}),
	mushroomslices: Object.freeze({
		dark: [
			68,
			43,
			24
		],
		light: [
			246,
			232,
			198
		],
		roughness: .78,
		relief: .004,
		cells: 3,
		capX: .31,
		capY: .22,
		capCenterY: -.07,
		capBase: -.04,
		capEdge: .012,
		capCoreQ: .94,
		skinStartQ: .78,
		skinFullQ: .9,
		stemY: .11,
		stemStraightX: .01,
		stemStraightY: .16,
		stemRadius: .045,
		stemCore: .037,
		gills: 6,
		gillFirst: .09,
		gillPitch: .032,
		gillStart: -.065,
		gillEnd: .015,
		gillRadius: .011,
		gillCore: .008,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	insulatedringlugs: Object.freeze({
		dark: [
			205,
			14,
			18
		],
		light: [
			237,
			239,
			238
		],
		roughness: .58,
		relief: .004,
		cells: 3,
		headY: -.17,
		headRadius: .17,
		headCore: .16,
		boreRadius: .09,
		boreCore: .08,
		neckY: 0,
		neckStraightX: .015,
		neckStraightY: .08,
		neckRadius: .045,
		neckCore: .037,
		collarY: .18,
		collarStraightX: .03,
		collarStraightY: .095,
		collarRadius: .06,
		collarCore: .052,
		crimpStraightX: .058,
		crimpOffset: .055,
		crimpRadius: .012,
		crimpCore: .008,
		crimpDepth: .055,
		metalRoughness: .26,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	bananaslices: Object.freeze({
		dark: [
			103,
			70,
			34
		],
		light: [
			250,
			239,
			201
		],
		roughness: .52,
		relief: .004,
		cells: 3,
		radiusX: .34,
		radiusY: .31,
		faceCoreQ: .94,
		rimStartQ: .78,
		rimFullQ: .9,
		hubRadius: .025,
		hubCore: .02,
		seamEnd: .14,
		seamRadius: .009,
		seamCore: .006,
		seedAlong: .075,
		seedAcross: .018,
		seedHalfX: .014,
		seedHalfY: .008,
		seedCoreQ: .5,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	rosemarysprigs: Object.freeze({
		dark: [
			35,
			42,
			25
		],
		light: [
			194,
			207,
			158
		],
		roughness: .68,
		relief: .004,
		cells: 3,
		pairs: 8,
		firstPair: -.245,
		pitch: .07,
		leafCenter: .07,
		lengthVariation: .015,
		leafOverlap: .01,
		leafHalfY: .018,
		leafCoreQ: .7,
		slope: .4,
		stemY: 0,
		stemStraightY: .35,
		stemRadius: .014,
		stemCore: .01,
		ribRadius: .006,
		ribCore: .004,
		ribStart: .025,
		ribFade: .015,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	pencilsharpeners: Object.freeze({
		dark: [
			40,
			44,
			48
		],
		light: [
			245,
			247,
			250
		],
		roughness: .48,
		relief: .004,
		cells: 3,
		bodyStraightX: .18,
		bodyStraightY: .3,
		bodyRadius: .04,
		bodyCore: .032,
		boreX: -.09,
		boreY: .22,
		boreRadius: .07,
		boreCore: .062,
		bladeX: .06,
		bladeY: -.03,
		bladeHalfX: .055,
		bladeHalfY: .23,
		bladeEdge: .008,
		bevelWidth: .02,
		screwRadius: .042,
		screwCore: .036,
		slotStraightY: .024,
		slotRadius: .008,
		slotCore: .005,
		gripPairs: 4,
		gripX: .17,
		gripStraightX: .025,
		gripFirstY: -.225,
		gripPitch: .1,
		gripRadius: .012,
		gripCore: .008,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	scissors: Object.freeze({
		dark: [
			100,
			8,
			12
		],
		light: [
			245,
			244,
			239
		],
		roughness: .58,
		relief: .004,
		cells: 3,
		armAngle: .42,
		handleY: .2,
		handleOuterX: .07,
		handleOuterY: .11,
		handleInnerX: .043,
		handleInnerY: .077,
		ellipseCoreQ: .9,
		neckY: .04,
		neckStraightY: .05,
		neckRadius: .014,
		neckCore: .01,
		bladeTop: -.32,
		bladeBottom: .01,
		bladeBaseHalfX: .035,
		planeShoulder: .006,
		endShoulder: .008,
		honeWidth: .012,
		pivotRadius: .045,
		pivotCore: .038,
		reach: .34,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	serpentinesprings: Object.freeze({
		dark: [
			40,
			44,
			48
		],
		light: [
			245,
			247,
			250
		],
		roughness: .28,
		relief: .004,
		cells: 3,
		runs: 6,
		firstY: -.225,
		pitch: .09,
		halfRun: .17,
		wireRadius: .012,
		wireCore: .009,
		endOwnerGap: .06,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	impellerfaces: Object.freeze({
		dark: [
			40,
			44,
			48
		],
		light: [
			245,
			247,
			250
		],
		roughness: .26,
		relief: .004,
		cells: 3,
		blades: 6,
		hubRadius: .12,
		hubCore: .11,
		boreRadius: .04,
		boreCore: .034,
		bladeInnerFull: .105,
		bladeOuterCore: .325,
		bladeOuterRadius: .34,
		halfAngle: .17,
		angleShoulder: .025,
		sweep: .7,
		honeAngle: .05,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	chipresistors: Object.freeze({
		dark: [
			12,
			15,
			18
		],
		light: [
			243,
			245,
			247
		],
		roughness: .62,
		relief: .004,
		cells: 3,
		bodyStraightX: .16,
		bodyStraightY: .085,
		bodyRadius: .035,
		bodyCore: .028,
		terminalX: .23,
		terminalStraightX: .04,
		terminalStraightY: .09,
		terminalRadius: .02,
		terminalCore: .014,
		glyphPitch: .08,
		glyphHalfY: .045,
		glyphHalfX: .02,
		strokeRadius: .007,
		strokeCore: .005,
		zeroOuterStraightX: .016,
		zeroOuterStraightY: .045,
		zeroOuterRadius: .012,
		zeroOuterCore: .01,
		zeroInnerStraightX: .012,
		zeroInnerStraightY: .041,
		zeroInnerRadius: .004,
		zeroInnerCore: .002,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	memorycardbacks: Object.freeze({
		dark: [
			14,
			11,
			7
		],
		light: [
			244,
			200,
			73
		],
		roughness: .7,
		relief: .004,
		cells: 3,
		bodyStraightX: .235,
		bodyStraightY: .325,
		bodyRadius: .015,
		bodyCore: .01,
		chamferPlane: .47,
		chamferShoulder: .01,
		notchX: .25,
		notchY: .1,
		notchStraightX: .025,
		notchStraightY: .025,
		notchRadius: .008,
		notchCore: .005,
		contacts: 8,
		firstContactX: -.1925,
		contactPitch: .055,
		contactY: -.16,
		contactStraightX: .009,
		contactStraightY: .065,
		contactRadius: .009,
		contactCore: .006,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	gnocchi: Object.freeze({
		dark: [
			107,
			83,
			44
		],
		light: [
			248,
			234,
			188
		],
		roughness: .84,
		relief: .004,
		cells: 3,
		radiusX: .32,
		radiusY: .21,
		faceCoreQ: .9,
		grooves: 7,
		pitch: .07,
		bend: 1.6,
		grooveStraightY: .1,
		grooveRadius: .009,
		grooveCore: .006,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	rectangularsocketfaces: Object.freeze({
		dark: [
			10,
			13,
			16
		],
		light: [
			245,
			247,
			250
		],
		roughness: .28,
		relief: .004,
		cells: 3,
		outerStraightX: .3,
		outerStraightY: .1,
		outerRadius: .035,
		outerCore: .028,
		mouthStraightX: .265,
		mouthStraightY: .065,
		mouthRadius: .015,
		mouthCore: .01,
		tongueY: .02,
		tongueStraightX: .22,
		tongueStraightY: .02,
		tongueRadius: .018,
		tongueCore: .012,
		contacts: 4,
		firstX: -.15,
		pitch: .1,
		contactStraightX: .006,
		contactStraightY: .016,
		contactRadius: .009,
		contactCore: .006,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	saffronthreads: Object.freeze({
		dark: [
			84,
			10,
			8
		],
		light: [
			225,
			52,
			26
		],
		roughness: .88,
		relief: .004,
		cells: 3,
		baseY: .28,
		tipY: -.26,
		tipSpread: .18,
		radius: .008,
		flareRadius: .028,
		flareStart: .8,
		coreRatio: .71,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	fishhooks: Object.freeze({
		dark: [
			40,
			44,
			48
		],
		light: [
			245,
			247,
			250
		],
		roughness: .26,
		relief: .004,
		cells: 3,
		bendY: .15,
		bendRadius: .12,
		arcInner: .108,
		arcInnerCore: .112,
		arcOuter: .132,
		arcOuterCore: .128,
		joinOverlap: .02,
		shankTop: -.242,
		shankRadius: .012,
		shankCore: .008,
		eyeY: -.27,
		eyeOuter: .038,
		eyeOuterCore: .033,
		eyeBore: .019,
		eyeBoreCore: .023,
		pointTop: -.07,
		pointHalfWidth: .016,
		planeShoulder: .003,
		endShoulder: .006,
		barbY: .03,
		barbAxisX: -.6,
		barbAxisY: .8,
		barbLength: .075,
		barbHalfWidth: .016,
		reach: .37,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	violinfholes: Object.freeze({
		dark: [
			34,
			15,
			5
		],
		light: [
			219,
			164,
			95
		],
		roughness: .67,
		relief: .004,
		cells: 3,
		halfLength: .27,
		pairOffset: .17,
		bend: .12,
		slotRadius: .009,
		slotCore: .006,
		eyeRadius: .032,
		eyeCore: .026,
		nickHalfWidth: .035,
		nickHalfHeight: .012,
		planeShoulder: .005,
		sideReach: .24,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	palmiers: Object.freeze({
		dark: [
			92,
			41,
			12
		],
		light: [
			242,
			190,
			110
		],
		roughness: .84,
		relief: .004,
		cells: 3,
		lobeX: .15,
		lobeY: -.1,
		lobeRadiusX: .17,
		lobeRadiusY: .18,
		faceCoreQ: .9,
		baseY: 0,
		tipY: .3,
		baseHalfX: .26,
		triangleOverlap: .04,
		planeShoulder: .008,
		spiralRadiusX: .13,
		spiralRadiusY: .14,
		spiralInnerQ: .04,
		spiralFullInnerQ: .1,
		spiralFullOuterQ: .8,
		spiralOuterQ: .85,
		spiralTurns: 2.5,
		spiralPhase: .3,
		spiralBand: .27,
		spiralCore: .21,
		jointRadius: .018,
		jointCore: .012,
		reach: .42,
		jitter: .015,
		scale: .94,
		scaleVariation: .04
	}),
	barbedwire: Object.freeze({
		dark: [
			35,
			39,
			43
		],
		light: [
			244,
			247,
			250
		],
		roughness: .3,
		relief: .004,
		rows: 4,
		knots: 4,
		twists: 2,
		amplitude: .035,
		wireRadius: .012,
		wireCore: .008,
		wireHeight: .5,
		wireDepth: .07,
		wireCrown: .04,
		collarX: .036,
		collarY: .034,
		collarCoreQ: .8,
		collarHeight: .78,
		collarRoughness: .34,
		barbAxisX: .6,
		barbAxisY: .8,
		barbLength: .09,
		barbHalfWidth: .022,
		barbHeight: .7,
		barbRoughness: .28,
		planeShoulder: .003,
		jitter: .015
	}),
	oxfordweave: Object.freeze({
		dark: [
			25,
			58,
			102
		],
		light: [
			239,
			244,
			248
		],
		roughness: .87,
		relief: .001,
		groups: 8,
		pairOffset: .18,
		yarnRadius: .13,
		yarnCore: .095,
		crossingHalf: .46,
		crossingShoulder: .08,
		yarnHeight: .4,
		lift: .12,
		crown: .06,
		fibers: 128
	}),
	lacewood: Object.freeze({
		dark: [
			83,
			43,
			23
		],
		light: [
			228,
			180,
			118
		],
		roughness: .62,
		relief: .001,
		columns: 8,
		rows: 12,
		jitterX: .1,
		jitterY: .2,
		rayLength: .12,
		rayLengthVariation: .24,
		rayWidth: .035,
		rayWidthVariation: .07,
		raySlope: .25,
		rayBend: .25,
		rayCoreQ: .65,
		grainColumns: 48,
		grainRows: 4,
		fiberColumns: 192,
		fiberRows: 8
	}),
	papyrus: Object.freeze({
		dark: [
			115,
			73,
			32
		],
		light: [
			239,
			217,
			164
		],
		roughness: .89,
		relief: .0015,
		strips: 8,
		halfWidth: .47,
		shoulder: .08,
		edgeJitter: .024,
		edgeSteps: 8,
		fiberColumns: 192,
		fiberRows: 6,
		topHeight: .56,
		underHeight: .37,
		backingHeight: .22
	}),
	larimar: Object.freeze({
		dark: [
			14,
			118,
			157
		],
		light: [
			237,
			248,
			242
		],
		roughness: .22,
		relief: .001,
		cells: 6,
		jitter: .22,
		radiusX: .58,
		radiusXVariation: .28,
		radiusY: .5,
		radiusYVariation: .3,
		coreQ: .4,
		fibers: 9,
		fiberRadius: .14,
		fiberCore: .06,
		fiberBend: .6
	}),
	paperbark: Object.freeze({
		dark: [
			92,
			69,
			43
		],
		light: [
			241,
			221,
			185
		],
		roughness: .84,
		relief: .002,
		columns: 3,
		rows: 8,
		jitterX: .018,
		jitterY: .04,
		halfWidth: .31,
		widthVariation: .14,
		halfHeight: .23,
		heightVariation: .1,
		bend: .3,
		edgeX: .02,
		edgeY: .04,
		shoulderX: .22,
		shoulderY: .26,
		lipCenter: .67,
		lipRadius: .26,
		shadowCenter: .9,
		shadowRadius: .16
	}),
	horseshoes: Object.freeze({
		dark: [
			32,
			33,
			35
		],
		light: [
			196,
			199,
			205
		],
		roughness: .42,
		relief: .01,
		cells: 3,
		jitter: .012,
		turn: .16,
		radiusX: .27,
		radiusY: .23,
		toeY: -.14,
		innerQ: .58,
		innerCoreQ: .85,
		outerCoreQ: 1.15,
		outerQ: 1.45,
		heelEnd: .35,
		heelShoulder: .08,
		grooveWidth: .16,
		nails: 3,
		nailFirstY: -.1,
		nailPitch: .14,
		nailRadiusX: .026,
		nailRadiusY: .038,
		nailCoreQ: .28
	}),
	durianpeel: Object.freeze({
		dark: [
			42,
			66,
			14
		],
		light: [
			210,
			194,
			82
		],
		roughness: .79,
		relief: .012,
		cells: 8,
		jitter: .018,
		radius: .31,
		radiusVariation: .09,
		rounding: .018,
		tipRadius: .055,
		shoulder: .12
	}),
	flystitch: Object.freeze({
		dark: [
			15,
			29,
			47
		],
		light: [
			237,
			229,
			206
		],
		roughness: .78,
		relief: .0012,
		cells: 6,
		jitter: .015,
		turn: .1,
		armX: .27,
		armY: -.28,
		stemEnd: .3,
		radius: .036,
		threads: 192
	}),
	abaloneshells: Object.freeze({
		dark: [
			18,
			71,
			77
		],
		light: [
			216,
			235,
			221
		],
		roughness: .26,
		relief: .006,
		cells: 3,
		jitter: .012,
		radiusX: .27,
		radiusY: .37,
		skew: .07,
		bend: .14,
		shoulder: .12,
		holes: 5,
		holeFirstY: -.2,
		holePitch: .1,
		holeX: .19,
		holeRadius: .02,
		holeCoreQ: .25,
		bands: 9,
		rimQ: .84,
		rimWidth: .085
	}),
	gyroidinfill: Object.freeze({
		dark: [
			34,
			29,
			26
		],
		light: [
			235,
			143,
			42
		],
		roughness: .53,
		relief: .0015,
		cells: 4,
		halfWidth: .26,
		core: .045
	}),
	cloisonne: Object.freeze({
		dark: [
			191,
			139,
			48
		],
		light: [
			20,
			159,
			173
		],
		roughness: .17,
		relief: .001,
		cells: 3,
		jitter: .025,
		petalCenter: .22,
		radiusX: .16,
		radiusY: .065,
		centerRadius: .038,
		wireWidth: .23,
		wireCore: .09
	}),
	rambutanskin: Object.freeze({
		dark: [
			120,
			16,
			34
		],
		light: [
			235,
			184,
			79
		],
		roughness: .72,
		relief: .0035,
		cells: 12,
		jitter: .05,
		halfLength: .32,
		bend: .28,
		rootRadius: .085,
		rootX: -.285,
		baseWidth: .065,
		tipWidth: .018,
		rootShoulder: .1,
		tipShoulder: .08
	}),
	rackgears: Object.freeze({
		dark: [
			29,
			33,
			37
		],
		light: [
			204,
			215,
			220
		],
		roughness: .32,
		relief: .007,
		cells: 3,
		jitter: .025,
		halfLength: .36,
		baseBottom: -.12,
		baseTop: -.015,
		bevel: .008,
		teeth: 7,
		toothFirst: -.27,
		toothPitch: .09,
		toothBottom: -.04,
		toothTop: .13,
		rootHalfWidth: .037,
		tipHalfWidth: .019,
		holeX: .325,
		holeY: -.065,
		holeRadius: .017,
		holeCore: .009,
		grooveY: -.075,
		grooveWidth: .008
	}),
	grosgrain: Object.freeze({
		dark: [
			41,
			46,
			51
		],
		light: [
			178,
			187,
			194
		],
		roughness: .57,
		relief: 45e-5,
		warpThreads: 120,
		weftThreads: 28,
		warpRadius: .21,
		warpCore: .15,
		weftRadius: .46,
		weftCore: .36,
		warpLiftHalf: .3,
		weftLiftHalf: .46,
		liftShoulder: .06,
		lift: .12,
		warpFibers: 480,
		weftFibers: 112,
		weftCrown: .18
	}),
	faille: Object.freeze({
		dark: [
			167,
			163,
			145
		],
		light: [
			246,
			244,
			226
		],
		roughness: .62,
		relief: 3e-4,
		warpThreads: 60,
		weftThreads: 20,
		warpRadius: .21,
		warpCore: .15,
		weftRadius: .46,
		weftCore: .38,
		warpLiftHalf: .3,
		weftLiftHalf: .46,
		liftShoulder: .06,
		lift: .12,
		warpFibers: 240,
		weftFibers: 80,
		weftCrown: .02
	}),
	bedfordcord: Object.freeze({
		dark: [
			51,
			47,
			33
		],
		light: [
			170,
			160,
			120
		],
		roughness: .9,
		relief: .0018,
		ribs: 20,
		rows: 24,
		stagger: .5,
		bodyHalf: .48,
		ribHalf: .45,
		dashHalf: .46,
		bodyShoulder: .04,
		dashShoulder: .34,
		grooveTone: .12,
		bodyTone: .42,
		dashTone: .66,
		dashVariation: .04,
		grainTone: .025,
		grooveHeight: .1,
		bodyHeight: .3,
		dashHeight: .56,
		dashCrown: .08,
		alongCrown: .03,
		grainHeight: .006,
		grooveRoughness: .98,
		bodyRoughness: .93,
		dashRoughness: .86,
		roughnessGrain: .03,
		grooveOcclusion: .5,
		bodyOcclusion: .78,
		dashOcclusion: .97
	}),
	poplin: Object.freeze({
		dark: [
			102,
			54,
			68
		],
		light: [
			236,
			181,
			192
		],
		roughness: .8,
		relief: 3e-4,
		warpThreads: 48,
		weftThreads: 24,
		warpRadius: .22,
		warpCore: .16,
		weftRadius: .4,
		weftCore: .32,
		warpLiftHalf: .3,
		weftLiftHalf: .46,
		liftShoulder: .06,
		lift: .12,
		warpFibers: 192,
		weftFibers: 96
	}),
	ooliticlimestone: Object.freeze({
		dark: [
			115,
			95,
			69
		],
		light: [
			229,
			219,
			194
		],
		roughness: .46,
		relief: 12e-5,
		cells: 12,
		jitter: .03,
		radius: .32,
		radiusVariation: .1,
		warp: .22,
		shoulder: .15,
		nucleusOuterQ: .07,
		nucleusCoreQ: .04
	}),
	ogeetiles: Object.freeze({
		dark: [
			8,
			62,
			72
		],
		light: [
			74,
			183,
			188
		],
		roughness: .23,
		relief: .004,
		columns: 6,
		rows: 6,
		groutQ: .0049,
		bevelQ: .004
	}),
	bittermelonskin: Object.freeze({
		dark: [
			31,
			63,
			11
		],
		light: [
			157,
			192,
			38
		],
		roughness: .56,
		relief: .0045,
		columns: 12,
		rows: 8,
		warp: .22,
		ridgeRadius: .44,
		jitterX: .04,
		jitterY: .035,
		radiusX: .24,
		radiusXVariation: .1,
		radiusY: .3,
		radiusYVariation: .11
	}),
	cocobolo: Object.freeze({
		dark: [
			32,
			9,
			11
		],
		light: [
			230,
			115,
			45
		],
		roughness: .28,
		relief: 16e-5,
		warp: .08,
		warpColumns: 4,
		warpRows: 2,
		broadColumns: 12,
		broadRows: 2,
		broadCore: .16,
		broadShoulder: .45,
		fineColumns: 48,
		fineRows: 3,
		fineCore: .12,
		fineShoulder: .28,
		fiberColumns: 192,
		fiberRows: 8
	}),
	doubleedgerazorblades: Object.freeze({
		dark: [
			29,
			33,
			37
		],
		light: [
			225,
			232,
			236
		],
		roughness: .32,
		relief: 3e-4,
		cells: 3,
		jitter: .025,
		halfLength: .36,
		halfWidth: .19,
		cornerX: .3,
		cornerY: .13,
		bevel: .012,
		holePitch: .16,
		holeRadius: .043,
		holeCore: .034,
		slotHalf: .2,
		slotRadius: .026,
		slotCore: .017,
		honeStart: .105,
		honeEnd: .165
	}),
	chiastolite: Object.freeze({
		dark: [
			31,
			22,
			14
		],
		light: [
			222,
			184,
			119
		],
		roughness: .72,
		relief: 12e-5,
		cells: 3,
		jitter: .025,
		radius: .35,
		faceCoreQ: .7,
		crossWidth: .018,
		crossFlare: .04
	}),
	dimity: Object.freeze({
		dark: [
			70,
			70,
			65
		],
		light: [
			247,
			245,
			230
		],
		roughness: .84,
		relief: 3e-4,
		warpThreads: 48,
		weftThreads: 48,
		groupEnds: 8,
		cordEnds: 2,
		warpRadius: .22,
		warpCore: .16,
		cordRadius: .36,
		cordCore: .3,
		weftRadius: .28,
		weftCore: .22,
		warpLiftHalf: .44,
		weftLiftHalf: .36,
		liftShoulder: .06,
		lift: .1,
		cordLiftHalf: .46,
		cordLiftShoulder: .1,
		cordHeight: .16,
		warpFibers: 192,
		weftFibers: 192
	}),
	juniperberries: Object.freeze({
		dark: [
			15,
			24,
			42
		],
		light: [
			134,
			156,
			177
		],
		roughness: .7,
		relief: .006,
		cells: 4,
		jitter: .025,
		radius: .36,
		radiusVariation: .06,
		shoulder: .2,
		seamLength: .29,
		seamRadius: .018,
		seamCore: .009,
		scarRadius: .06,
		scarCore: .035
	}),
	gabbro: Object.freeze({
		dark: [
			12,
			17,
			18
		],
		light: [
			208,
			215,
			209
		],
		roughness: .29,
		relief: 12e-5,
		cells: 12,
		siteMinimum: .3,
		siteVariation: .4,
		supportSquared: 1.44,
		paleThreshold: .65,
		twinFrequency: 12,
		twinRadiusSquared: .04,
		twinShoulderSquared: .03
	}),
	turnbuckles: Object.freeze({
		dark: [
			24,
			27,
			31
		],
		light: [
			218,
			223,
			229
		],
		roughness: .3,
		relief: .003,
		cells: 3,
		jitter: .02,
		frameX: .2,
		frameY: .105,
		openingX: .15,
		openingY: .055,
		eyeX: .33,
		eyeRadius: .07,
		eyeCore: .061,
		holeRadius: .037,
		holeShoulder: .043,
		rodX: .22,
		rodHalf: .06,
		rodCore: .05,
		rodRadius: .018,
		rodInner: .012,
		threadFrequency: 80
	}),
	bluelaceagate: Object.freeze({
		dark: [
			145,
			169,
			206
		],
		light: [
			246,
			248,
			249
		],
		roughness: .19,
		relief: 12e-5,
		bands: 9,
		warp: 1,
		fineWarp: .16,
		wideRadius: .1,
		wideCore: .035,
		fineRadius: .027,
		fineCore: .009,
		companionOffset: .18,
		fineColumns: 48
	}),
	rhodochrosite: Object.freeze({
		dark: [
			165,
			42,
			67
		],
		light: [
			252,
			238,
			221
		],
		roughness: .18,
		relief: 12e-5,
		bands: 6,
		warp: .75,
		fineWarp: .18,
		wideRadius: .12,
		wideCore: .065,
		fineRadius: .04,
		fineCore: .018,
		companionOffset: .23
	}),
	bayleaf: Object.freeze({
		dark: [
			25,
			34,
			13
		],
		light: [
			165,
			174,
			79
		],
		roughness: .38,
		relief: .0016,
		cells: 3,
		jitter: .02,
		halfLength: .32,
		halfWidth: .14,
		shoulder: .16,
		stemStart: -.39,
		stemEnd: -.28,
		stemRadius: .008,
		midribRadius: .009,
		veinPairs: 7,
		veinSpacing: .065,
		veinSlope: .35,
		veinBend: 3,
		veinRadius: .006,
		axisFade: .025,
		marginFraction: .8,
		marginShoulder: .03,
		grainHeight: .004,
		grainColor: .025
	}),
	whipcord: Object.freeze({
		dark: [
			7,
			9,
			11
		],
		light: [
			94,
			101,
			106
		],
		roughness: .78,
		relief: .0016,
		yarnTone: .78,
		warpThreads: 84,
		weftThreads: 28,
		warpRadius: .499,
		warpCore: .4,
		weftRadius: .49,
		weftCore: .35,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .18,
		lift: .14,
		warpFibers: 336,
		weftFibers: 112,
		draft: Object.freeze([
			7,
			14,
			13,
			11
		]),
		warpBase: .4,
		weftBase: .27
	}),
	gabardine: Object.freeze({
		dark: [
			54,
			49,
			35
		],
		light: [
			203,
			190,
			150
		],
		roughness: .73,
		relief: 3e-4,
		warpThreads: 48,
		weftThreads: 24,
		warpRadius: .495,
		warpCore: .44,
		weftRadius: .25,
		weftCore: .18,
		warpLiftHalf: .46,
		weftLiftHalf: .34,
		liftShoulder: .06,
		lift: .1,
		warpFibers: 192,
		weftFibers: 96
	}),
	oilspotglaze: Object.freeze({
		dark: [
			18,
			11,
			7
		],
		light: [
			217,
			151,
			79
		],
		roughness: .15,
		relief: 12e-5,
		cells: 8,
		jitter: .1,
		radiusMinimum: .16,
		radiusVariation: .18,
		aspectMinimum: .65,
		aspectVariation: .3,
		outerShoulder: .12,
		rimStart: .5,
		rimShoulder: .15
	}),
	persimmonslice: Object.freeze({
		dark: [
			57,
			25,
			10
		],
		light: [
			255,
			181,
			64
		],
		roughness: .3,
		relief: .002,
		cells: 3,
		jitter: .025,
		radius: .38,
		faceShoulder: .012,
		rindStart: .33,
		rindFull: .35,
		pithRadius: .05,
		pithShoulder: .0015,
		seeds: 8,
		seedCenter: .18,
		seedLength: .065,
		seedWidth: .026,
		seedShoulder: .2
	}),
	kitkattiles: Object.freeze({
		dark: [
			12,
			49,
			44
		],
		light: [
			119,
			190,
			157
		],
		roughness: .21,
		relief: .003,
		columns: 24,
		rows: 4,
		grout: .045,
		shoulder: .055,
		troughRadius: .36,
		troughLift: .16,
		endFade: .2,
		endShoulder: .12
	}),
	brakediscs: Object.freeze({
		dark: [
			22,
			25,
			28
		],
		light: [
			223,
			226,
			230
		],
		roughness: .34,
		relief: .004,
		cells: 3,
		radius: .4,
		coreRadius: .385,
		bore: .085,
		boreShoulder: .1,
		hubRadius: .17,
		hubCore: .155,
		boltRing: .13,
		boltRadius: .016,
		boltShoulder: .023,
		innerDrillRing: .25,
		outerDrillRing: .335,
		drillRadius: .015,
		drillShoulder: .022,
		bolts: 5,
		drillsPerRing: 12,
		wearFrequency: 550
	}),
	mulberrypaper: Object.freeze({
		dark: [
			159,
			131,
			91
		],
		light: [
			249,
			241,
			215
		],
		roughness: .91,
		relief: 2e-4,
		cells: 8,
		fibersPerCell: 3,
		centerMinimum: .15,
		centerVariation: .7,
		lengthMinimum: .45,
		lengthVariation: .45,
		widthMinimum: .012,
		widthVariation: .018,
		bend: .04,
		fiberLift: .035
	}),
	sodalite: Object.freeze({
		dark: [
			5,
			17,
			112
		],
		light: [
			238,
			240,
			237
		],
		roughness: .24,
		relief: 2e-4,
		coarseCells: 11,
		mediumCells: 43,
		coarseWeight: .82,
		mediumWeight: .18,
		warp: .08,
		veinCenter: .5,
		veinRadius: .028,
		veinCore: .009,
		matrixBase: .035,
		matrixCloud: .12,
		matrixGrain: .15,
		veinBase: .91,
		veinCloud: .06,
		patchStart: .8,
		patchRange: .13,
		patchStrength: .8,
		height: .5,
		grainHeight: .003,
		veinRoughness: .045,
		grainRoughness: .015
	}),
	howlite: Object.freeze({
		dark: [
			72,
			73,
			72
		],
		light: [
			249,
			247,
			239
		],
		roughness: .23,
		relief: 1e-4,
		cells: 12,
		siteMinimum: .3,
		siteVariation: .4,
		support: 1.2,
		warp: .07,
		veinThreshold: .44,
		veinFeather: .06
	}),
	ottoman: Object.freeze({
		dark: [
			49,
			40,
			66
		],
		light: [
			194,
			168,
			210
		],
		roughness: .76,
		relief: 4e-4,
		warpThreads: 48,
		weftThreads: 24,
		warpRadius: .24,
		warpCore: .18,
		weftRadius: .38,
		weftCore: .3,
		warpLiftHalf: .32,
		weftLiftHalf: .36,
		liftShoulder: .06,
		lift: .18,
		warpFibers: 192,
		weftFibers: 96,
		pairOffset: .1
	}),
	shackles: Object.freeze({
		dark: [
			46,
			50,
			55
		],
		light: [
			218,
			225,
			231
		],
		roughness: .3,
		relief: .004,
		cells: 3,
		jitter: .008,
		bowRadius: .22,
		arcY: -.08,
		tubeRadius: .055,
		tubeCore: .035,
		pinY: .2,
		pinHalf: .3,
		pinRadius: .035,
		pinCore: .025,
		bossRadius: .075,
		bossCore: .055,
		headX: -.31,
		headRadiusX: .055,
		headRadiusY: .08,
		holeX: -.32,
		holeY: .25,
		holeRadius: .014,
		holeShoulder: .021
	}),
	watercaltrops: Object.freeze({
		dark: [
			8,
			6,
			5
		],
		light: [
			110,
			72,
			42
		],
		roughness: .67,
		relief: .003,
		cells: 3,
		jitter: .008,
		bodyX: .22,
		bodyY: .16,
		bodyCenterY: .025,
		bodyShoulder: .22,
		hornStart: .1,
		hornEnd: .4,
		hornRootY: -.05,
		hornBend: .18,
		hornWidth: .07,
		hornTipWidth: .005,
		rootShoulder: .04,
		tipShoulder: .06,
		creaseFrequency: 18,
		scarY: .12,
		scarRadius: .025
	}),
	cavansite: Object.freeze({
		dark: [
			0,
			87,
			163
		],
		light: [
			250,
			245,
			229
		],
		roughness: .78,
		relief: .004,
		cells: 4,
		chance: .65,
		jitter: .07,
		scaleMinimum: .86,
		scaleVariation: .14,
		needles: 36,
		bodyRadius: .235,
		bodyShoulder: .55,
		needleOffset: .165,
		needleHalfMinimum: .07,
		needleHalfVariation: .025,
		needleWidthMinimum: .009,
		needleWidthVariation: .006,
		needleShoulder: .3,
		bodyLift: .34,
		needleLift: .09,
		crystalRoughness: .35,
		needleAngleJitter: .18
	}),
	vanadinite: Object.freeze({
		dark: [
			135,
			28,
			8
		],
		light: [
			244,
			213,
			169
		],
		roughness: .26,
		relief: .0038,
		cells: 5,
		jitter: .06,
		radius: .24,
		radiusVariation: .05,
		coreRatio: .94,
		pitRatio: .48,
		pitCoreRatio: .85,
		pitDepth: .28
	}),
	pyromorphite: Object.freeze({
		dark: [
			95,
			125,
			22
		],
		light: [
			228,
			223,
			207
		],
		roughness: .28,
		relief: .0048,
		cells: 6,
		jitter: .1,
		radius: .18,
		radiusVariation: .13,
		coreRatio: .9,
		occupancy: .94
	}),
	redberyl: Object.freeze({
		dark: [
			113,
			7,
			40
		],
		light: [
			242,
			239,
			227
		],
		roughness: .22,
		relief: .008,
		cells: 4,
		jitter: .15,
		radius: .135,
		radiusVariation: .12,
		coreRatio: .87,
		occupancy: .78
	}),
	fluorite: Object.freeze({
		dark: [
			54,
			27,
			82
		],
		light: [
			235,
			221,
			245
		],
		roughness: .2,
		relief: 1e-4,
		cells: 3,
		jitter: .008,
		halfExtent: .3,
		extentVariation: .035,
		shoulder: .2,
		zones: 4
	}),
	wenge: Object.freeze({
		dark: [
			15,
			10,
			7
		],
		light: [
			134,
			98,
			60
		],
		roughness: .72,
		relief: 4e-4,
		columns: 24,
		rows: 8,
		widthMinimum: .035,
		widthVariation: .02,
		lengthMinimum: .15,
		lengthVariation: .2,
		poreShoulder: .25,
		poreDepth: .08,
		bands: 14,
		bandWarp: .05,
		bandRadius: .12,
		bandCore: .06
	}),
	parchment: Object.freeze({
		dark: [
			170,
			139,
			93
		],
		light: [
			250,
			243,
			221
		],
		roughness: .83,
		relief: 2e-4,
		cells: 16,
		widthMinimum: .035,
		widthVariation: .02,
		lengthMinimum: .055,
		lengthVariation: .025,
		poreShoulder: .3,
		poreDepth: .012
	}),
	cavalrytwill: Object.freeze({
		dark: [
			43,
			48,
			38
		],
		light: [
			183,
			193,
			160
		],
		roughness: .74,
		relief: 3e-4,
		warpThreads: 72,
		weftThreads: 36,
		warpRadius: .495,
		warpCore: .44,
		weftRadius: .25,
		weftCore: .18,
		warpLiftHalf: .46,
		weftLiftHalf: .34,
		liftShoulder: .06,
		lift: .1,
		warpFibers: 288,
		weftFibers: 144,
		draft: Object.freeze([
			!0,
			!0,
			!1,
			!0,
			!1,
			!1
		])
	}),
	screwhooks: Object.freeze({
		dark: [
			47,
			50,
			54
		],
		light: [
			217,
			224,
			230
		],
		roughness: .31,
		relief: .004,
		cells: 3,
		jitter: .008,
		ringY: -.12,
		ringOuter: .19,
		ringOuterCore: .18,
		ringInner: .14,
		ringInnerCore: .15,
		openingX: .03,
		openingWidth: .07,
		openingY: -.06,
		openingHeight: .06,
		shankTop: .04,
		shankBottom: .36,
		shankRadius: .026,
		taperStart: .27,
		endShoulder: .025,
		threadFrequency: 48,
		threadSlope: 4,
		threadDepth: .04
	}),
	nigellaseeds: Object.freeze({
		dark: [
			10,
			11,
			12
		],
		light: [
			73,
			77,
			79
		],
		roughness: .86,
		relief: .0375,
		cells: 5,
		jitter: .015,
		inradius: .16,
		shoulder: .025,
		aspectX: .9,
		aspectY: 1.15,
		poreThreshold: .43,
		poreShoulder: .18,
		poreDepth: .025
	}),
	phyllite: Object.freeze({
		dark: [
			39,
			49,
			46
		],
		light: [
			151,
			165,
			156
		],
		roughness: .48,
		relief: .018,
		bands: 48,
		warp: .035,
		ridgeRadius: .25,
		ridgeCore: .15,
		ridgeHeight: .065,
		micaThreshold: .64,
		micaShoulder: .18
	}),
	shantung: Object.freeze({
		dark: [
			110,
			88,
			55
		],
		light: [
			233,
			216,
			170
		],
		roughness: .62,
		relief: .018,
		warpThreads: 64,
		weftThreads: 32,
		warpRadius: .3,
		warpCore: .22,
		weftRadius: .22,
		weftCore: .15,
		warpLiftHalf: .37,
		weftLiftHalf: .43,
		liftShoulder: .06,
		lift: .18,
		warpFibers: 256,
		weftFibers: 128,
		slubs: 3,
		slubJitter: .06,
		slubHalfMinimum: .045,
		slubHalfVariation: .045,
		slubRadius: .15,
		slubCore: .13,
		slubHeight: .14
	}),
	hempcrete: Object.freeze({
		dark: [
			61,
			45,
			24
		],
		light: [
			225,
			216,
			185
		],
		roughness: .95,
		relief: .015,
		cells: 12,
		jitter: .03,
		halfLengthMinimum: .25,
		halfLengthVariation: .13,
		halfWidthMinimum: .045,
		halfWidthVariation: .045,
		faceCoreQ: .7,
		fiberFrequency: 18,
		poreThreshold: .35,
		poreShoulder: .16,
		poreDepth: .24
	}),
	utilityblades: Object.freeze({
		dark: [
			42,
			47,
			53
		],
		light: [
			224,
			230,
			235
		],
		roughness: .34,
		relief: .004,
		cells: 3,
		jitter: .008,
		top: -.18,
		bottom: .2,
		topHalfWidth: .19,
		bottomHalfWidth: .35,
		bevel: .012,
		notchPitch: .085,
		notchHalfWidth: .03,
		notchCore: .02,
		notchBottom: -.105,
		notchShoulder: .012,
		honeStart: .11,
		honeEnd: .175,
		honeDepth: .13,
		honeRoughness: .13
	}),
	smithsonite: Object.freeze({
		dark: [
			25,
			78,
			34
		],
		light: [
			221,
			235,
			184
		],
		roughness: .25,
		relief: .006,
		cells: 10,
		jitter: .26,
		radiusMinimum: .56,
		radiusVariation: .18,
		shoulder: .82,
		heightMinimum: .72,
		heightVariation: .28,
		matrixHeight: .14,
		noduleBase: .36,
		noduleLift: .28,
		grainLift: .003,
		frostThreshold: .58,
		frostSpan: .22,
		frostTone: .04,
		frostColumns: 5,
		frostRows: 7,
		fineFrostColumns: 17,
		fineFrostRows: 19,
		fineFrostWeight: .3,
		grainColumns: 128,
		grainRows: 128,
		matrixColor: .18,
		matrixFrostTone: .025,
		matrixRoughness: .79,
		matrixGrainRoughness: .04,
		matrixOcclusion: .72,
		matrixFrostOcclusion: .025,
		noduleColor: .34,
		noduleToneVariation: .16,
		grainTone: .025,
		grainRoughness: .02,
		domeRoughness: .035,
		noduleOcclusion: .86,
		domeOcclusion: .12
	}),
	hemimorphite: Object.freeze({
		dark: [
			37,
			142,
			178
		],
		light: [
			229,
			247,
			247
		],
		roughness: .48,
		relief: .008,
		cells: 8,
		jitter: .24,
		radiusMinimum: .52,
		radiusVariation: .2,
		shoulder: .6,
		heightMinimum: .72,
		heightVariation: .28,
		matrixHeight: .14,
		noduleBase: .36,
		noduleLift: .28,
		grainLift: .018,
		frostThreshold: .58,
		frostSpan: .22,
		frostTone: .42,
		frostColumns: 5,
		frostRows: 7,
		fineFrostColumns: 17,
		fineFrostRows: 19,
		fineFrostWeight: .3,
		grainColumns: 128,
		grainRows: 128,
		matrixColor: .88,
		matrixFrostTone: .08,
		matrixRoughness: .82,
		matrixGrainRoughness: .04,
		matrixOcclusion: .72,
		matrixFrostOcclusion: .05,
		noduleColor: .18,
		noduleToneVariation: .2,
		grainTone: .06,
		grainRoughness: .08,
		domeRoughness: .08,
		noduleOcclusion: .86,
		domeOcclusion: .12
	}),
	chrysocolla: Object.freeze({
		dark: [
			7,
			36,
			29
		],
		light: [
			55,
			196,
			205
		],
		roughness: .67,
		relief: .012,
		cells: 6,
		jitter: .025,
		radiusMinimum: .17,
		radiusVariation: .06,
		coreQ: .72,
		centers: Object.freeze([
			0,
			-.11,
			-.12,
			.09,
			.12,
			.09
		])
	}),
	sichuanpepperhusks: Object.freeze({
		dark: [
			30,
			6,
			5
		],
		light: [
			184,
			68,
			43
		],
		roughness: .83,
		relief: .015,
		cells: 7,
		jitter: .03,
		scale: .94,
		scaleVariation: .1,
		ellipticity: 1.12,
		rimWarp: .18,
		outerRadius: .34,
		outerCore: .3,
		innerRadius: .205,
		innerCore: .165,
		gapStart: .13,
		gapEnd: .23,
		gapHalfWidth: .075,
		gapCore: .045,
		scarX: -.265,
		scarRadiusX: .035,
		scarRadiusY: .06,
		scarCoreQ: .4,
		poreThreshold: .45,
		poreShoulder: .2,
		huskHeight: .34,
		domeHeight: .18,
		wrinkleHeight: .035,
		poreDepth: .055,
		scarDepth: .16
	}),
	huckaback: Object.freeze({
		dark: [
			144,
			136,
			116
		],
		light: [
			244,
			238,
			218
		],
		roughness: .89,
		relief: .022,
		warpThreads: 40,
		weftThreads: 40,
		warpRadius: .38,
		warpCore: .25,
		weftRadius: .38,
		weftCore: .25,
		warpLiftHalf: .46,
		weftLiftHalf: .46,
		liftShoulder: .9,
		lift: .14,
		warpFibers: 160,
		weftFibers: 160,
		draft: Object.freeze([
			682,
			351,
			682,
			351,
			682,
			341,
			1002,
			341,
			1002,
			341
		])
	}),
	anorthosite: Object.freeze({
		dark: [
			24,
			28,
			31
		],
		light: [
			249,
			248,
			237
		],
		roughness: .26,
		relief: .004,
		cells: 10,
		siteMinimum: .3,
		siteVariation: .4,
		supportSquared: 1.44,
		paleThreshold: .05,
		twinFrequency: 8,
		twinRadiusSquared: .04,
		twinShoulderSquared: .03
	}),
	cubebberries: Object.freeze({
		dark: [
			7,
			5,
			3
		],
		light: [
			100,
			71,
			45
		],
		roughness: .87,
		relief: .04,
		cells: 8,
		jitter: .025,
		scale: .92,
		scaleVariation: .06,
		radiusX: .27,
		radiusY: .29,
		coreQ: .72,
		stemTop: .2,
		stemBottom: .44,
		stemRadius: .028,
		stemCore: .018,
		berryBase: .28,
		berryDome: .42,
		wrinkleCenter: .5,
		wrinkleRadius: .25,
		wrinkleCore: .08,
		wrinkleHeight: .055,
		poreThreshold: .32,
		poreShoulder: .15,
		poreDepth: .03,
		stemBase: .2,
		stemDome: .06
	}),
	seraphinite: Object.freeze({
		dark: [
			6,
			28,
			18
		],
		light: [
			209,
			216,
			190
		],
		roughness: .22,
		relief: .006,
		cells: 4,
		siteMinimum: .3,
		siteVariation: .4,
		halfLengthMinimum: .75,
		halfLengthVariation: .35,
		halfWidthMinimum: .3,
		halfWidthVariation: .25,
		coreQ: .4,
		frequencyMinimum: 16,
		frequencyVariation: 6,
		veinRadius: .16,
		veinCore: .045,
		branchSlope: .58,
		branchBend: .9,
		axisFade: .025,
		warp: .3
	}),
	hexsocketheads: Object.freeze({
		dark: [
			35,
			40,
			46
		],
		light: [
			224,
			231,
			236
		],
		roughness: .32,
		relief: .03,
		cells: 5,
		jitter: .025,
		capRadius: .38,
		fullRadius: .33,
		socketApothem: .18,
		socketBevel: .018,
		headHeight: .68,
		socketFloor: .26,
		headGrainHeight: .004,
		floorGrainHeight: .002,
		socketShade: .42
	}),
	datepits: Object.freeze({
		dark: [
			38,
			17,
			6
		],
		light: [
			185,
			132,
			65
		],
		roughness: .68,
		relief: .025,
		cells: 5,
		jitter: .025,
		halfLength: .4,
		halfWidth: .145,
		shoulder: .18,
		bend: .018,
		grooveBend: .022,
		grooveRadius: .032,
		grooveCore: .012,
		grooveEnd: .34,
		grooveFullEnd: .28,
		grooveDepth: .19,
		bodyBase: .28,
		domeHeight: .35,
		grainHeight: .012
	}),
	sapele: Object.freeze({
		dark: [
			63,
			24,
			12
		],
		light: [
			210,
			142,
			75
		],
		roughness: .48,
		relief: .002,
		columns: 32,
		rows: 10,
		widthMinimum: .028,
		widthVariation: .016,
		lengthMinimum: .12,
		lengthVariation: .14,
		poreShoulder: .3,
		poreDepth: .08,
		bands: 7,
		bandWarp: .08,
		bandRadius: .42,
		bandCore: .22
	}),
	cottondrill: Object.freeze({
		dark: [
			84,
			66,
			42
		],
		light: [
			206,
			183,
			143
		],
		roughness: .86,
		relief: .0012,
		yarnTone: .8,
		warpThreads: 144,
		weftThreads: 96,
		warpRadius: .495,
		warpCore: .44,
		weftRadius: .495,
		weftCore: .44,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .12,
		lift: .1,
		warpFibers: 576,
		weftFibers: 384,
		draft: Object.freeze([
			7,
			14,
			13,
			11
		])
	}),
	ticking: Object.freeze({
		dark: [
			14,
			29,
			55
		],
		light: [
			239,
			234,
			218
		],
		roughness: .8,
		relief: .0012,
		warpThreads: 144,
		weftThreads: 144,
		warpRadius: .495,
		warpCore: .44,
		weftRadius: .495,
		weftCore: .44,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .12,
		lift: .1,
		warpFibers: 576,
		weftFibers: 576,
		groundTone: .91,
		dyeDepth: .84,
		stripeDraft: Object.freeze([
			1,
			0,
			1,
			1,
			1,
			1,
			1,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		]),
		draft: Object.freeze([
			6,
			5,
			3
		]),
		stripeYarns: 3
	}),
	chambray: Object.freeze({
		dark: [
			19,
			53,
			88
		],
		light: [
			238,
			242,
			246
		],
		roughness: .84,
		relief: .012,
		warpThreads: 32,
		weftThreads: 32,
		warpRadius: .42,
		warpCore: .3,
		weftRadius: .42,
		weftCore: .3,
		warpLiftHalf: .46,
		weftLiftHalf: .46,
		liftShoulder: .12,
		lift: .14,
		warpFibers: 128,
		weftFibers: 128
	}),
	nephrite: Object.freeze({
		dark: [
			18,
			47,
			29
		],
		light: [
			176,
			205,
			163
		],
		roughness: .28,
		relief: .003,
		fiberWarp: .07,
		cloudContrast: .55,
		fiberContrast: .33,
		grainHeight: .002
	}),
	diorite: Object.freeze({
		dark: [
			18,
			21,
			23
		],
		light: [
			245,
			245,
			236
		],
		roughness: .3,
		relief: .004,
		cells: 16,
		siteMinimum: .3,
		siteVariation: .4,
		supportSquared: 1.44,
		paleThreshold: .35,
		twinFrequency: 10,
		twinRadiusSquared: .04,
		twinShoulderSquared: .03
	}),
	carawayseeds: Object.freeze({
		dark: [
			36,
			18,
			7
		],
		light: [
			205,
			169,
			103
		],
		roughness: .77,
		relief: .02,
		cells: 8,
		halfLength: .38,
		halfWidth: .065,
		bend: .16,
		jitter: .025,
		shoulder: .18,
		ribGap: .32,
		ribRadius: .095
	}),
	springpinends: Object.freeze({
		dark: [
			31,
			37,
			43
		],
		light: [
			225,
			232,
			237
		],
		roughness: .34,
		relief: .03,
		cells: 6,
		jitter: .025,
		outerRadius: .36,
		outerCore: .345,
		innerRadius: .25,
		innerCore: .265,
		slotRadius: .028,
		slotCore: .018,
		slotStart: .12,
		slotFull: .18,
		faceHeight: .65,
		grainHeight: .002
	}),
	rhyolite: Object.freeze({
		dark: [
			83,
			44,
			35
		],
		light: [
			234,
			218,
			190
		],
		roughness: .46,
		relief: 5e-4,
		cells: 16,
		crystalChance: .25,
		halfLengthMin: .08,
		halfLengthRange: .06,
		halfWidthMin: .035,
		halfWidthRange: .025,
		edge: .012,
		bands: 14,
		bandWarp: .6,
		bandRadius: .42,
		bandCore: .24
	}),
	tonkabeans: Object.freeze({
		dark: [
			7,
			5,
			4
		],
		light: [
			110,
			78,
			51
		],
		roughness: .73,
		relief: .0275,
		cells: 8,
		halfLength: .36,
		halfWidth: .16,
		bend: .02,
		jitter: .015,
		shoulder: .18,
		bodyBase: .28,
		domeHeight: .4,
		grainHeight: .005,
		wrinkleDepth: .12,
		wrinkleColumns: 40,
		wrinkleRows: 6,
		wrinkleThreshold: .6,
		wrinkleShoulder: .35,
		wrinkleWarp: .035
	}),
	pentalobescrewheads: Object.freeze({
		dark: [
			24,
			30,
			36
		],
		light: [
			231,
			235,
			238
		],
		roughness: .3,
		relief: .03,
		cells: 6,
		jitter: .025,
		capRadius: .37,
		capCore: .35,
		coreRadius: .125,
		coreFull: .11,
		lobeCount: 5,
		lobeOffset: .09,
		lobeRadius: .1,
		lobeCore: .086,
		faceHeight: .64,
		socketDepth: .4,
		socketRoughness: .82,
		grainHeight: .002
	}),
	padauk: Object.freeze({
		dark: [
			63,
			14,
			5
		],
		light: [
			249,
			137,
			55
		],
		roughness: .56,
		relief: .002,
		columns: 16,
		rows: 8,
		widthMinimum: .035,
		widthVariation: .02,
		lengthMinimum: .12,
		lengthVariation: .15,
		poreChance: .65,
		centerMinimum: .3,
		centerRange: .4,
		poreShoulder: .3,
		poreDepth: .12,
		bands: 18,
		bandWarp: .025,
		bandRadius: .16,
		bandCore: .07,
		bandContrast: .09
	}),
	cottonflannel: Object.freeze({
		dark: [
			115,
			110,
			104
		],
		light: [
			238,
			235,
			229
		],
		roughness: .94,
		relief: .01,
		warpThreads: 32,
		weftThreads: 32,
		warpRadius: .45,
		warpCore: .34,
		weftRadius: .45,
		weftCore: .34,
		warpLiftHalf: .46,
		weftLiftHalf: .46,
		liftShoulder: .12,
		lift: .14,
		warpFibers: 128,
		weftFibers: 128,
		yarnTone: .72,
		brushCells: 5,
		napColumns: 96,
		napRows: 32,
		napWarpU: .012,
		napWarpV: .003,
		napCoverage: .94,
		napBase: .4,
		napHeight: .1,
		napCloudHeight: .02,
		buriedWeaveHeight: .04,
		napColor: .64,
		cloudColor: .1,
		fiberColor: .1,
		napRoughnessVariation: .025,
		grainRoughnessVariation: .02,
		occlusion: .95,
		occlusionWeave: .03
	}),
	pinolith: Object.freeze({
		dark: [
			13,
			15,
			17
		],
		light: [
			239,
			237,
			226
		],
		roughness: .24,
		relief: .001,
		cells: 10,
		crystalsPerCell: 5,
		jitter: .4,
		halfLengthMinimum: .4,
		halfLengthRange: .5,
		halfWidthMinimum: .38,
		halfWidthRange: .27,
		lensOffsetMinimum: .45,
		lensOffsetRange: .3,
		edgeWarp: .16,
		shoulder: .12,
		rimBand: .08,
		cloudCells: 32,
		grainCells: 128,
		matrixColor: .08,
		matrixCloud: .12,
		matrixGrain: .05,
		crystalColor: .92,
		graphiteCloud: .45,
		cloudCore: .35,
		cloudShoulder: .4,
		crystalGrain: .08,
		matrixRoughness: .06,
		grainRoughness: .015,
		height: .35,
		grainHeight: .003
	}),
	tripointscrewheads: Object.freeze({
		dark: [
			24,
			30,
			36
		],
		light: [
			231,
			235,
			238
		],
		roughness: .3,
		relief: .03,
		cells: 6,
		jitter: .025,
		capRadius: .37,
		capCore: .35,
		armCount: 3,
		armLength: .255,
		slotRadius: .045,
		slotCore: .035,
		faceHeight: .64,
		socketDepth: .4,
		socketRoughness: .82,
		grainHeight: .002
	}),
	septarian: Object.freeze({
		dark: [
			35,
			23,
			12
		],
		light: [
			248,
			240,
			214
		],
		roughness: .24,
		relief: .001,
		cells: 6,
		jitter: .45,
		neighborRadius: 3,
		candidateRadius: 2,
		warp: .1,
		fractureWarp: .08,
		fractureCells: 12,
		cloudCells: 3,
		grainCells: 128,
		veinCore: .002,
		veinVariation: .16,
		veinCloudCore: .25,
		veinCloudShoulder: .5,
		veinShoulder: .015,
		rimWidth: .042,
		hostShoulder: .012,
		calciteColor: .94,
		calciteCloud: .035,
		calciteGrain: .015,
		rimColor: .045,
		rimGrain: .025,
		hostColor: .45,
		hostVariation: .08,
		hostCloud: .12,
		hostFine: .08,
		hostGrain: .025,
		rimRoughness: .34,
		hostRoughness: .29,
		grainRoughness: .015,
		height: .4,
		grainHeight: .003
	}),
	squaresocketheads: Object.freeze({
		dark: [
			35,
			40,
			46
		],
		light: [
			224,
			231,
			236
		],
		roughness: .32,
		relief: .03,
		cells: 5,
		jitter: .025,
		capRadius: .38,
		fullRadius: .33,
		socketApothem: .18,
		socketBevel: .018,
		headHeight: .68,
		socketFloor: .26,
		headGrainHeight: .004,
		floorGrainHeight: .002,
		socketShade: .42
	}),
	trianglesocketheads: Object.freeze({
		dark: [
			35,
			40,
			46
		],
		light: [
			224,
			231,
			236
		],
		roughness: .32,
		relief: .03,
		cells: 5,
		jitter: .025,
		capRadius: .38,
		fullRadius: .33,
		socketApothem: .135,
		socketBevel: .018,
		headHeight: .68,
		socketFloor: .26,
		headGrainHeight: .004,
		floorGrainHeight: .002,
		socketShade: .42
	}),
	bronzite: Object.freeze({
		dark: [
			22,
			18,
			15
		],
		light: [
			201,
			162,
			99
		],
		roughness: .24,
		relief: 8e-4,
		cells: 20,
		siteMinimum: .25,
		siteVariation: .5,
		radiusMinimum: .3,
		radiusVariation: .55,
		planeMinimum: .6,
		planeVariation: .4,
		angleJitter: .35,
		edgeShoulder: .045,
		blueChance: .4,
		bandMinimum: .7,
		bandVariation: 1.5,
		fibers: 5,
		bend: .035,
		warp: .025,
		bandRadius: .43,
		bandCore: .16,
		fiberRadius: .4,
		fiberCore: .1,
		blueBase: .065,
		blueBand: .1,
		blueFiber: .15,
		goldBase: .18,
		goldBand: .13,
		goldFiber: .45,
		cementBase: .05,
		cementCloud: .09,
		pigmentGrain: .035,
		grainRoughness: .02,
		height: .4,
		grainHeight: .002,
		fleckMinimum: .42,
		fleckShoulder: .2,
		fleckBase: .18
	}),
	pietersite: Object.freeze({
		dark: [
			8,
			25,
			54
		],
		light: [
			228,
			181,
			92
		],
		roughness: .23,
		relief: .001,
		cells: 6,
		siteMinimum: .15,
		siteVariation: .7,
		radiusMinimum: .38,
		radiusVariation: .4,
		planeMinimum: .75,
		planeVariation: .25,
		angleJitter: .2,
		edgeShoulder: .045,
		blueChance: .6,
		bandMinimum: 1.5,
		bandVariation: 1.5,
		fibers: 8,
		bend: .35,
		warp: .12,
		bandRadius: .43,
		bandCore: .16,
		fiberRadius: .4,
		fiberCore: .1,
		blueBase: .035,
		blueBand: .09,
		blueFiber: .045,
		goldBase: .42,
		goldBand: .25,
		goldFiber: .24,
		cementBase: .035,
		cementCloud: .035,
		pigmentGrain: .015,
		grainRoughness: .012,
		height: .4,
		grainHeight: .003
	}),
	larvikite: Object.freeze({
		dark: [
			11,
			17,
			24
		],
		light: [
			174,
			204,
			225
		],
		roughness: .18,
		relief: 12e-5,
		cells: 10,
		siteMinimum: .3,
		siteVariation: .4,
		supportSquared: 1.44,
		paleThreshold: .8,
		twinFrequency: 10,
		twinRadiusSquared: .04,
		twinShoulderSquared: .03
	}),
	squareholewashers: Object.freeze({
		dark: [
			30,
			38,
			45
		],
		light: [
			226,
			233,
			238
		],
		roughness: .31,
		relief: .025,
		cells: 5,
		jitter: .03,
		outerRadius: .36,
		fullOuter: .34,
		holeHalfWidth: .145,
		holeBevel: .018,
		bodyHeight: .6,
		grainHeight: .003
	}),
	tigerwood: Object.freeze({
		dark: [
			23,
			10,
			5
		],
		light: [
			203,
			121,
			56
		],
		roughness: .32,
		relief: .002,
		columns: 7,
		rows: 2,
		patchSlots: 2,
		patchChance: .62,
		jitterX: .4,
		jitterY: .42,
		widthMinimum: .09,
		widthVariation: .22,
		lengthMinimum: .48,
		lengthVariation: .31,
		slope: .18,
		bend: .45,
		coreQ: .35,
		faceColor: .72,
		woodContrast: .08,
		fiberContrast: .12,
		patchContrast: .65
	}),
	snakewood: Object.freeze({
		dark: [
			17,
			6,
			3
		],
		light: [
			171,
			82,
			37
		],
		roughness: .34,
		relief: .003,
		columns: 8,
		rows: 12,
		patchSlots: 2,
		patchChance: .65,
		jitterX: .3,
		jitterY: .3,
		widthMinimum: .18,
		widthVariation: .22,
		lengthMinimum: .12,
		lengthVariation: .28,
		slope: .6,
		bend: 1.6,
		coreQ: .35,
		faceColor: .65,
		woodContrast: .06,
		fiberContrast: .05,
		patchContrast: .5
	}),
	safflowerseeds: Object.freeze({
		dark: [
			42,
			32,
			16
		],
		light: [
			252,
			249,
			234
		],
		roughness: .32,
		relief: .015,
		cells: 6,
		jitter: .1,
		halfWidth: .145,
		halfLength: .345,
		shoulder: .1,
		ribOffset: .065,
		ribRadius: .012,
		ribCore: .006,
		ribLength: .28,
		ribContrast: .1,
		ribHeight: .035,
		scarY: -.15,
		scarWidth: .022,
		scarLength: .045,
		scarShoulder: .2,
		scarContrast: .17,
		scarDepth: .025,
		bodyHeight: .34,
		domeHeight: .26,
		grainHeight: .002
	}),
	thulite: Object.freeze({
		dark: [
			173,
			46,
			89
		],
		light: [
			244,
			235,
			226
		],
		roughness: .22,
		relief: 12e-5,
		coarseCells: 7,
		mediumCells: 37,
		fineCells: 191,
		coarseWeight: .12,
		mediumWeight: .18,
		fineWeight: .7,
		pinkBase: .1,
		whiteContrast: .78,
		fineContrast: .03,
		height: .35,
		grainHeight: .002
	}),
	unakite: Object.freeze({
		dark: [
			39,
			76,
			30
		],
		light: [
			244,
			127,
			132
		],
		roughness: .22,
		relief: 12e-5,
		coarseCells: 8,
		mediumCells: 24,
		fineCells: 96,
		coarseWeight: .7,
		mediumWeight: .22,
		fineWeight: .08,
		greenBase: .06,
		pinkContrast: .75,
		fineContrast: .035,
		height: .35,
		grainHeight: .002
	}),
	eudialyte: Object.freeze({
		dark: [
			9,
			8,
			13
		],
		light: [
			205,
			22,
			90
		],
		roughness: .2,
		relief: 12e-5,
		cells: 8,
		grainCells: 192,
		siteMinimum: .2,
		siteVariation: .6,
		supportSquared: 1.3924,
		darkThreshold: .25,
		raspberryBase: .68,
		raspberryVariation: .16,
		matrixBase: .025,
		matrixVariation: .05,
		fineContrast: .28,
		seamThreshold: .5,
		seamShoulder: .06,
		height: .35,
		grainHeight: .002
	}),
	lignumvitae: Object.freeze({
		dark: [
			47,
			46,
			25
		],
		light: [
			159,
			146,
			91
		],
		roughness: .32,
		relief: .002,
		columns: 32,
		rows: 20,
		widthMinimum: .035,
		widthVariation: .025,
		lengthMinimum: .09,
		lengthVariation: .12,
		poreChance: .08,
		centerMinimum: .35,
		centerRange: .3,
		poreShoulder: .45,
		poreDepth: .07,
		bands: 5,
		bandWarp: .65,
		bandRadius: .46,
		bandCore: .16,
		bandContrast: .12,
		fiberColumns: 256,
		fiberRows: 10,
		fiberContrast: .2
	}),
	iroko: Object.freeze({
		dark: [
			111,
			77,
			34
		],
		light: [
			238,
			200,
			131
		],
		roughness: .62,
		relief: .003,
		columns: 36,
		rows: 12,
		widthMinimum: .04,
		widthVariation: .03,
		lengthMinimum: .14,
		lengthVariation: .14,
		poreChance: .28,
		centerMinimum: .35,
		centerRange: .3,
		poreShoulder: .5,
		poreDepth: .11,
		bands: 6,
		bandWarp: .35,
		bandRadius: .46,
		bandCore: .16,
		bandContrast: .16,
		fiberColumns: 256,
		fiberRows: 8,
		fiberContrast: .1
	}),
	bloodwood: Object.freeze({
		dark: [
			104,
			24,
			25
		],
		light: [
			255,
			134,
			105
		],
		roughness: .42,
		relief: .0018,
		columns: 48,
		rows: 16,
		widthMinimum: .04,
		widthVariation: .025,
		lengthMinimum: .075,
		lengthVariation: .12,
		poreChance: .12,
		centerMinimum: .35,
		centerRange: .3,
		poreShoulder: .55,
		poreDepth: .09,
		bands: 5,
		bandWarp: .11,
		bandRadius: .46,
		bandCore: .16,
		bandContrast: .035,
		fiberColumns: 256,
		fiberRows: 10,
		fiberContrast: .14
	}),
	yellowheart: Object.freeze({
		dark: [
			205,
			165,
			71
		],
		light: [
			255,
			232,
			142
		],
		roughness: .48,
		relief: .0015,
		columns: 40,
		rows: 12,
		widthMinimum: .055,
		widthVariation: .025,
		lengthMinimum: .1,
		lengthVariation: .14,
		poreChance: .15,
		centerMinimum: .35,
		centerRange: .3,
		poreShoulder: .5,
		poreDepth: .075,
		bands: 5,
		bandWarp: .1,
		bandRadius: .46,
		bandCore: .16,
		bandContrast: .02,
		fiberColumns: 224,
		fiberRows: 6,
		fiberContrast: .16
	}),
	purpleheart: Object.freeze({
		dark: [
			39,
			13,
			37
		],
		light: [
			157,
			87,
			149
		],
		roughness: .48,
		relief: .003,
		columns: 30,
		rows: 10,
		widthMinimum: .05,
		widthVariation: .04,
		lengthMinimum: .13,
		lengthVariation: .15,
		poreChance: .24,
		centerMinimum: .35,
		centerRange: .3,
		poreShoulder: .5,
		poreDepth: .13,
		bands: 5,
		bandWarp: .18,
		bandRadius: .46,
		bandCore: .16,
		bandContrast: .1,
		fiberColumns: 192,
		fiberRows: 6,
		fiberContrast: .12
	}),
	basswood: Object.freeze({
		dark: [
			166,
			143,
			104
		],
		light: [
			246,
			232,
			203
		],
		roughness: .6,
		relief: .0012,
		brushU: 96,
		brushV: 4,
		grainCells: 128,
		baseTone: .68,
		brushTone: .18,
		grainTone: .035,
		baseHeight: .45,
		brushHeight: .008,
		grainHeight: .004,
		brushRoughness: .025,
		grainRoughness: .035
	}),
	tabwashers: Object.freeze({
		dark: [
			35,
			41,
			46
		],
		light: [
			226,
			232,
			237
		],
		roughness: .33,
		relief: .0028,
		cells: 4,
		jitter: .02,
		scale: .91,
		scaleVariation: .04,
		outerRadius: .29,
		boreRadius: .13,
		bevel: .012,
		tabStart: .16,
		tabEnd: .43,
		tabHalfWidth: .09
	}),
	sphericalwashers: Object.freeze({
		dark: [
			34,
			42,
			50
		],
		light: [
			230,
			235,
			240
		],
		roughness: .3,
		relief: .025,
		cells: 5,
		outerRadius: .36,
		fullOuter: .338,
		boreRadius: .15,
		fullBore: .174,
		sphereRadius: .54,
		domeScale: 1.3,
		bodyBase: .32,
		faceColor: .68,
		faceVariation: .05,
		grainContrast: .02
	}),
	mungbeans: Object.freeze({
		dark: [
			17,
			80,
			4
		],
		light: [
			247,
			241,
			218
		],
		roughness: .7,
		relief: .018,
		cells: 6,
		halfLength: .32,
		halfWidth: .235,
		bodyShoulder: .12,
		eyeWidth: .038,
		eyeLength: .125,
		eyeShoulder: .3,
		hilumStraight: .08,
		hilumRadius: .018,
		hilumCore: .012,
		shellColor: .36,
		shellVariation: .1,
		coatContrast: .025,
		grainContrast: .015,
		eyeColor: .095,
		hilumColor: .99,
		bodyBase: .32,
		domeHeight: .3
	}),
	dalmatianstone: Object.freeze({
		dark: [
			13,
			17,
			15
		],
		light: [
			240,
			232,
			206
		],
		roughness: .28,
		relief: .002,
		cells: 10,
		spotChance: .82,
		centerMin: .15,
		centerRange: .7,
		widthMin: .12,
		widthRange: .15,
		lengthMin: .1,
		lengthRange: .13,
		bend: 1,
		shoulder: .38,
		matrixBase: .86,
		matrixCloud: .09,
		matrixGrain: .025,
		spotBase: .035,
		spotTone: .045,
		spotGrain: .015,
		height: .43,
		grainHeight: .002,
		grainRoughness: .02,
		spotRoughness: .035,
		edgeWarp: .8
	}),
	thomsonite: Object.freeze({
		dark: [
			147,
			76,
			65
		],
		light: [
			255,
			240,
			218
		],
		roughness: .2,
		relief: .004,
		cells: 6,
		centerMin: .46,
		centerVariation: .08,
		radiusMin: .28,
		radiusVariation: .15,
		shoulder: .16
	}),
	nickelsilver: Object.freeze({
		dark: [
			112,
			110,
			98
		],
		light: [
			224,
			222,
			204
		],
		roughness: .36,
		relief: .0012,
		brushU: 4,
		brushV: 192,
		grainCells: 128,
		baseTone: .62,
		brushTone: .18,
		grainTone: .06,
		baseHeight: .5,
		brushHeight: .12,
		grainHeight: .04,
		brushRoughness: .1,
		grainRoughness: .02
	}),
	monkscloth: Object.freeze({
		dark: [
			128,
			118,
			97
		],
		light: [
			247,
			241,
			224
		],
		roughness: .91,
		relief: .0018,
		yarnTone: .84,
		warpThreads: 32,
		weftThreads: 32,
		warpRadius: .46,
		warpCore: .32,
		weftRadius: .46,
		weftCore: .32,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .12,
		lift: .1,
		warpFibers: 128,
		weftFibers: 128,
		draft: Object.freeze([
			15,
			15,
			15,
			15,
			240,
			240,
			240,
			240
		])
	}),
	hopsack: Object.freeze({
		dark: [
			12,
			20,
			33
		],
		light: [
			66,
			88,
			118
		],
		roughness: .86,
		relief: .0025,
		yarnTone: .78,
		warpThreads: 32,
		weftThreads: 32,
		warpRadius: .44,
		warpCore: .3,
		weftRadius: .44,
		weftCore: .3,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .12,
		lift: .1,
		warpFibers: 128,
		weftFibers: 128,
		draft: Object.freeze([
			3,
			3,
			12,
			12
		])
	}),
	sateen: Object.freeze({
		dark: [
			107,
			97,
			79
		],
		light: [
			239,
			232,
			213
		],
		roughness: .45,
		relief: 8e-4,
		yarnTone: .86,
		warpThreads: 55,
		weftThreads: 55,
		warpRadius: .495,
		warpCore: .4,
		weftRadius: .495,
		weftCore: .4,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .075,
		lift: .055,
		warpFibers: 220,
		weftFibers: 220,
		draft: Object.freeze([
			1,
			4,
			16,
			2,
			8
		])
	}),
	surah: Object.freeze({
		dark: [
			66,
			27,
			18
		],
		light: [
			218,
			140,
			96
		],
		roughness: .35,
		relief: 7e-4,
		yarnTone: .84,
		warpThreads: 60,
		weftThreads: 60,
		warpRadius: .495,
		warpCore: .4,
		weftRadius: .495,
		weftCore: .4,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .06,
		lift: .065,
		warpFibers: 240,
		weftFibers: 240,
		draft: Object.freeze([
			3,
			6,
			12,
			9
		])
	}),
	serge: Object.freeze({
		dark: [
			9,
			15,
			26
		],
		light: [
			70,
			86,
			113
		],
		roughness: .86,
		relief: .004,
		yarnTone: .8,
		warpThreads: 52,
		weftThreads: 52,
		warpRadius: .495,
		warpCore: .28,
		weftRadius: .495,
		weftCore: .28,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .16,
		lift: .09,
		warpFibers: 208,
		weftFibers: 208,
		draft: Object.freeze([
			3,
			6,
			12,
			9
		])
	}),
	lyocell: Object.freeze({
		dark: [
			119,
			104,
			80
		],
		light: [
			229,
			213,
			179
		],
		roughness: .56,
		relief: 5e-4,
		yarnTone: .82,
		warpThreads: 48,
		weftThreads: 48,
		warpRadius: .495,
		warpCore: .4,
		weftRadius: .495,
		weftCore: .4,
		warpLiftHalf: .49,
		weftLiftHalf: .49,
		liftShoulder: .06,
		lift: .065,
		warpFibers: 192,
		weftFibers: 192,
		draft: Object.freeze([
			7,
			14,
			13,
			11
		])
	}),
	habotai: Object.freeze({
		dark: [
			168,
			165,
			155
		],
		light: [
			249,
			247,
			239
		],
		roughness: .4,
		relief: 2e-4,
		yarnTone: .92,
		warpThreads: 84,
		weftThreads: 84,
		warpRadius: .475,
		warpCore: .35,
		weftRadius: .475,
		weftCore: .35,
		warpLiftHalf: .46,
		weftLiftHalf: .46,
		liftShoulder: .12,
		lift: .055,
		warpFibers: 336,
		weftFibers: 336
	}),
	batiste: Object.freeze({
		dark: [
			155,
			153,
			144
		],
		light: [
			252,
			250,
			242
		],
		roughness: .72,
		relief: 2e-4,
		yarnTone: .9,
		warpThreads: 60,
		weftThreads: 60,
		warpRadius: .42,
		warpCore: .3,
		weftRadius: .42,
		weftCore: .3,
		warpLiftHalf: .46,
		weftLiftHalf: .46,
		liftShoulder: .12,
		lift: .12,
		warpFibers: 240,
		weftFibers: 240
	}),
	ramie: Object.freeze({
		dark: [
			159,
			154,
			132
		],
		light: [
			249,
			246,
			227
		],
		roughness: .78,
		relief: .004,
		yarnTone: .84,
		warpThreads: 48,
		weftThreads: 48,
		warpRadius: .42,
		warpCore: .3,
		weftRadius: .42,
		weftCore: .3,
		warpLiftHalf: .46,
		weftLiftHalf: .46,
		liftShoulder: .12,
		lift: .12,
		warpFibers: 192,
		weftFibers: 192
	}),
	wavewashers: Object.freeze({
		dark: [
			34,
			42,
			50
		],
		light: [
			230,
			235,
			240
		],
		roughness: .3,
		relief: .02,
		cells: 5,
		outerRadius: .41,
		fullOuter: .39,
		boreRadius: .27,
		fullBore: .29,
		bodyBase: .52,
		waveAmplitude: .12,
		faceColor: .68,
		grainContrast: .02,
		grainHeight: .002
	}),
	cupwashers: Object.freeze({
		dark: [
			34,
			42,
			50
		],
		light: [
			230,
			235,
			240
		],
		roughness: .28,
		relief: .03,
		cells: 5,
		jitter: .035,
		outerRadius: .35,
		fullOuter: .33,
		boreRadius: .115,
		fullBore: .135,
		coneStart: .14,
		coneEnd: .295,
		coneShoulder: .12,
		bodyBase: .24,
		coneRise: .38,
		grainHeight: .0025
	}),
	blackwalnut: Object.freeze({
		dark: [
			42,
			27,
			18
		],
		light: [
			140,
			98,
			68
		],
		roughness: .5,
		relief: .0025,
		columns: 40,
		rows: 14,
		widthMinimum: .04,
		widthVariation: .03,
		lengthMinimum: .1,
		lengthVariation: .14,
		poreChance: .22,
		centerMinimum: .35,
		centerRange: .3,
		poreShoulder: .5,
		poreDepth: .09,
		bands: 4,
		bandWarp: .5,
		bandRadius: .46,
		bandCore: .16,
		bandContrast: .2,
		fiberColumns: 192,
		fiberRows: 9,
		fiberContrast: .12
	}),
	douglasfir: Object.freeze({
		dark: [
			150,
			82,
			34
		],
		light: [
			238,
			196,
			134
		],
		roughness: .62,
		relief: .0035,
		rings: 13,
		arch: 3,
		archShift: .045,
		skew: .5,
		warpCells: 5,
		warp: .9,
		latewoodStart: .6,
		latewoodPeak: .92,
		fiberColumns: 160,
		fiberRows: 5,
		grainCells: 128,
		earlyTone: .86,
		lateTone: .7,
		fiberTone: .05,
		grainTone: .012,
		lateHeight: .18,
		grainHeight: .004,
		lateRoughness: -.05,
		grainRoughness: .03,
		earlyOcclusion: .05
	}),
	longleafpine: Object.freeze({
		dark: [
			196,
			100,
			28
		],
		light: [
			250,
			228,
			172
		],
		roughness: .6,
		relief: .003,
		rings: 11,
		arch: .5,
		archShift: .01,
		skew: .15,
		warpCells: 5,
		warp: .35,
		latewoodStart: .3,
		latewoodPeak: .88,
		fiberColumns: 192,
		fiberRows: 5,
		grainCells: 128,
		earlyTone: .92,
		lateTone: .72,
		fiberTone: .04,
		grainTone: .01,
		lateHeight: .22,
		grainHeight: .004,
		lateRoughness: -.05,
		grainRoughness: .03,
		earlyOcclusion: .06
	}),
	chesterfieldleather: Object.freeze({
		dark: [
			42,
			16,
			12
		],
		light: [
			164,
			88,
			50
		],
		roughness: .58,
		relief: .012,
		cells: 6,
		grainCells: 128,
		creaseCells: 24,
		pillowSpan: .55,
		buttonRadius: .2,
		buttonSoft: .12,
		baseHeight: .08,
		pillowHeight: .62,
		buttonHeight: .22,
		creaseHeight: .03,
		grainHeight: .004,
		baseTone: .3,
		pillowTone: .42,
		buttonTone: .06,
		creaseTone: .05,
		grainTone: .04,
		pillowRoughness: -.12,
		grainRoughness: .06,
		foldOcclusion: .5
	}),
	westernredcedar: Object.freeze({
		dark: [
			92,
			56,
			26
		],
		light: [
			182,
			126,
			70
		],
		roughness: .66,
		relief: .003,
		rings: 20,
		arch: .35,
		archShift: .01,
		skew: .12,
		warpCells: 5,
		warp: .3,
		latewoodStart: .7,
		latewoodPeak: .92,
		fiberColumns: 192,
		fiberRows: 5,
		grainCells: 128,
		earlyTone: .66,
		lateTone: .3,
		fiberTone: .07,
		grainTone: .03,
		lateHeight: .14,
		grainHeight: .006,
		lateRoughness: -.03,
		grainRoughness: .04,
		earlyOcclusion: .04
	}),
	perforatedhardboard: Object.freeze({
		dark: [
			34,
			20,
			12
		],
		light: [
			152,
			104,
			66
		],
		roughness: .78,
		relief: .004,
		cells: 16,
		grainCells: 192,
		fleckCells: 64,
		sheenCells: 6,
		holeRadius: .13,
		holeSoft: .03,
		rimWidth: .05,
		baseTone: .58,
		sheenTone: .08,
		grainTone: .05,
		fleckTone: .09,
		rimTone: .2,
		holeTone: .04,
		baseHeight: .6,
		grainHeight: .03,
		fleckHeight: .04,
		holeHeight: .02,
		rimDrop: .12,
		grainRoughness: .08,
		holeRoughness: .18,
		holeOcclusion: .85,
		rimOcclusion: .25
	}),
	makore: Object.freeze({
		dark: [
			76,
			31,
			18
		],
		light: [
			205,
			139,
			93
		],
		roughness: .46,
		relief: .006,
		columns: 28,
		rows: 18,
		poreChance: .1,
		widthMinimum: .028,
		widthVariation: .012,
		lengthMinimum: .09,
		lengthVariation: .07,
		poreShoulder: .4,
		poreDepth: .075,
		curlBands: 22,
		curlSkew: 1,
		curlWarp: 1.5,
		faceColor: .65,
		curlContrast: .22,
		fiberContrast: .06,
		grainHeight: .0018,
		curlThreshold: .32,
		curlShoulder: .36
	}),
	anigre: Object.freeze({
		dark: [
			123,
			76,
			46
		],
		light: [
			238,
			211,
			165
		],
		roughness: .43,
		relief: .006,
		columns: 32,
		rows: 16,
		poreChance: .36,
		widthMinimum: .022,
		widthVariation: .012,
		lengthMinimum: .14,
		lengthVariation: .12,
		poreShoulder: .4,
		poreDepth: .055,
		curlBands: 24,
		curlSkew: 1,
		curlWarp: 1.2,
		faceColor: .71,
		curlContrast: .16,
		fiberContrast: .07,
		grainHeight: .002
	}),
	blackeyedpeas: Object.freeze({
		dark: [
			22,
			20,
			18
		],
		light: [
			248,
			242,
			222
		],
		roughness: .67,
		relief: .025,
		cells: 5,
		halfLength: .3,
		halfWidth: .245,
		bodyShoulder: .12,
		eyeWidth: .085,
		eyeLength: .11,
		eyeShoulder: .35,
		hilumStraight: .022,
		hilumRadius: .012,
		hilumCore: .0075,
		shellColor: .86,
		shellVariation: .04,
		coatContrast: .03,
		grainContrast: .015,
		eyeColor: .045,
		hilumColor: .99,
		bodyBase: .32,
		domeHeight: .3
	}),
	adzukibeans: Object.freeze({
		dark: [
			96,
			8,
			18
		],
		light: [
			242,
			228,
			201
		],
		roughness: .64,
		relief: .025,
		cells: 5,
		jitter: .035,
		halfLength: .28,
		halfWidth: .22,
		bodyShoulder: .12,
		hilumStraight: .12,
		hilumRadius: .027,
		hilumCore: .018,
		shellColor: .2,
		shellVariation: .08,
		coatContrast: .055,
		hilumColor: .94,
		bodyBase: .32,
		domeHeight: .3,
		grainHeight: .0015
	}),
	amazonite: Object.freeze({
		dark: [
			12,
			102,
			88
		],
		light: [
			236,
			238,
			216
		],
		roughness: .26,
		relief: .001,
		frequency: 32,
		skew: 8,
		warp: .7,
		bandRadius: .11,
		bandCore: .025,
		widthMinimum: .45,
		widthRange: .9,
		gateThreshold: .4,
		gateShoulder: .25,
		baseColor: .18,
		cloudContrast: .2,
		paleColor: .95,
		grainHeight: .002
	}),
	twopinscrewheads: Object.freeze({
		dark: [
			35,
			40,
			46
		],
		light: [
			224,
			231,
			236
		],
		roughness: .32,
		relief: .03,
		cells: 5,
		jitter: .035,
		capRadius: .36,
		fullRadius: .32,
		holeOffset: .155,
		holeRadius: .067,
		holeCore: .045,
		headHeight: .72,
		socketFloor: .29,
		headGrainHeight: .004,
		floorGrainHeight: .002,
		socketShade: .42
	}),
	bocote: Object.freeze({
		dark: [
			30,
			23,
			12
		],
		light: [
			201,
			153,
			79
		],
		roughness: .34,
		relief: .0016,
		columns: 16,
		rows: 8,
		widthMinimum: .035,
		widthVariation: .025,
		lengthMinimum: .13,
		lengthVariation: .18,
		poreChance: .15,
		poreShoulder: .3,
		poreDepth: .07,
		bands: 24,
		bandWarp: 17,
		bandRadius: .28,
		bandCore: .1,
		bandWidthMinimum: .5,
		bandWidthVariation: .9,
		faceColor: .78,
		bandContrast: .72,
		grainHeight: .002
	}),
	europeanbeech: Object.freeze({
		dark: [
			117,
			79,
			57
		],
		light: [
			225,
			193,
			157
		],
		roughness: .44,
		relief: .0012,
		bands: 12,
		columns: 48,
		rows: 24,
		warp: .12,
		earlyChance: .72,
		lateChance: .72,
		earlyWidth: .045,
		lateWidth: .045,
		widthVariation: .02,
		lengthMinimum: .08,
		lengthVariation: .16,
		poreShoulder: .35,
		poreDepth: .045,
		bandContrast: .025,
		grainHeight: .002,
		rayColumns: 6,
		rayRows: 18,
		rayLength: .18,
		rayLengthVariation: .14,
		rayWidth: .05,
		rayWidthVariation: .035,
		rayJitterX: .1,
		rayJitterY: .08,
		raySlope: .1,
		rayBend: .6,
		rayCoreQ: .2,
		rayContrast: .09,
		rayRoughness: .045,
		rayChance: .78,
		poreJitterX: .38,
		poreJitterY: .245
	}),
	whiteoak: Object.freeze({
		dark: [
			91,
			69,
			37
		],
		light: [
			218,
			195,
			149
		],
		roughness: .44,
		relief: .0016,
		bands: 8,
		columns: 32,
		rows: 14,
		warp: .22,
		earlyChance: .68,
		lateChance: .14,
		earlyWidth: .055,
		lateWidth: .018,
		widthVariation: .018,
		lengthMinimum: .08,
		lengthVariation: .24,
		poreShoulder: .35,
		poreDepth: .055,
		bandContrast: .11,
		grainHeight: .002,
		rayColumns: 2,
		rayRows: 9,
		rayLength: .22,
		rayLengthVariation: .2,
		rayWidth: .08,
		rayWidthVariation: .07,
		rayJitterX: .04,
		rayJitterY: .06,
		raySlope: .16,
		rayBend: 1.1,
		rayCoreQ: .2,
		rayContrast: .26,
		rayRoughness: .055,
		rayChance: .84
	}),
	whiteash: Object.freeze({
		dark: [
			99,
			69,
			39
		],
		light: [
			235,
			216,
			177
		],
		roughness: .46,
		relief: .0018,
		bands: 8,
		columns: 32,
		rows: 14,
		warp: .22,
		earlyChance: .88,
		lateChance: .2,
		earlyWidth: .075,
		lateWidth: .02,
		widthVariation: .025,
		lengthMinimum: .08,
		lengthVariation: .24,
		poreShoulder: .35,
		poreDepth: .13,
		bandContrast: .15,
		grainHeight: .002
	}),
	kingwood: Object.freeze({
		dark: [
			17,
			10,
			16
		],
		light: [
			142,
			77,
			67
		],
		roughness: .31,
		relief: .0016,
		columns: 32,
		rows: 20,
		widthMinimum: .045,
		widthVariation: .035,
		lengthMinimum: .1,
		lengthVariation: .17,
		poreChance: .12,
		poreShoulder: .3,
		poreDepth: .065,
		bands: 36,
		bandWarp: .45,
		bandRadius: .3,
		bandCore: .03,
		bandWidthMinimum: .18,
		bandWidthVariation: 1.25,
		faceColor: .88,
		bandContrast: .8,
		grainHeight: .002,
		warpColumns: 32,
		warpRows: 4
	}),
	braziliantulipwood: Object.freeze({
		dark: [
			126,
			37,
			57
		],
		light: [
			245,
			213,
			153
		],
		roughness: .34,
		relief: .0016,
		columns: 32,
		rows: 20,
		widthMinimum: .045,
		widthVariation: .035,
		lengthMinimum: .1,
		lengthVariation: .17,
		poreChance: .14,
		poreShoulder: .3,
		poreDepth: .06,
		bands: 28,
		bandWarp: .55,
		bandRadius: .3,
		bandCore: .03,
		bandWidthMinimum: .2,
		bandWidthVariation: 1.1,
		faceColor: .88,
		bandContrast: .68,
		grainHeight: .002,
		warpColumns: 24,
		warpRows: 4
	}),
	macassarebony: Object.freeze({
		dark: [
			10,
			8,
			6
		],
		light: [
			116,
			73,
			44
		],
		roughness: .32,
		relief: .0016,
		columns: 32,
		rows: 24,
		widthMinimum: .035,
		widthVariation: .025,
		lengthMinimum: .13,
		lengthVariation: .18,
		poreChance: .1,
		poreShoulder: .3,
		poreDepth: .045,
		bands: 32,
		bandWarp: .3,
		bandRadius: .3,
		bandCore: .03,
		bandWidthMinimum: .2,
		bandWidthVariation: 1.1,
		faceColor: .8,
		bandContrast: .66,
		grainHeight: .002,
		warpColumns: 32,
		warpRows: 4
	}),
	zebrawood: Object.freeze({
		dark: [
			39,
			22,
			10
		],
		light: [
			235,
			207,
			152
		],
		roughness: .6,
		relief: .002,
		columns: 16,
		rows: 8,
		widthMinimum: .035,
		widthVariation: .025,
		lengthMinimum: .13,
		lengthVariation: .18,
		poreChance: .68,
		poreShoulder: .3,
		poreDepth: .1,
		bands: 18,
		bandWarp: .65,
		bandRadius: .19,
		bandCore: .07,
		bandWidthMinimum: .5,
		bandWidthVariation: .9,
		faceColor: .86,
		bandContrast: .72,
		grainHeight: .003
	}),
	castorbeans: Object.freeze({
		dark: [
			35,
			17,
			9
		],
		light: [
			240,
			221,
			190
		],
		roughness: .25,
		relief: .03,
		cells: 4,
		jitter: .025,
		halfLength: .3,
		halfWidth: .19,
		bodyShoulder: .08,
		caruncleY: -.29,
		caruncleHalfX: .09,
		caruncleHalfY: .07,
		caruncleShoulder: .15,
		spotColumns: 16,
		spotRows: 9,
		spotWarp: .12,
		spotThreshold: .46,
		spotShoulder: .16,
		shellColor: .72,
		spotDarkening: .62,
		caruncleColor: .94,
		bodyBase: .34,
		domeHeight: .3,
		caruncleBase: .43,
		caruncleDome: .08,
		caruncleRoughness: .64,
		grainHeight: .0015
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
	snow: 1,
	asphalt: .8,
	gravel: .48,
	cobblestone: 1.2,
	bark: .5,
	moss: .3,
	mud: .6,
	granite: .24,
	slate: .6,
	terrazzo: .6,
	denim: .024,
	burlap: .04,
	carpet: .072,
	plaster: .8,
	terracotta: .36,
	cork: .16,
	rubber: .12,
	carbonfiber: .048,
	diamondplate: .4,
	paper: .12,
	corrugatedcardboard: .064,
	creasedpaper: .24,
	layeredpaper: .16,
	wicker: .18,
	bamboo: .6,
	hammeredmetal: .24,
	galvanized: .36,
	corrugatedmetal: 1.2,
	perforatedmetal: .5,
	expandedmetal: .6,
	wiremesh: .09,
	velvet: .12,
	terrycloth: .09,
	boucle: .16,
	geode: .5,
	quartz: .24,
	pyrite: .3,
	shiplap: .9,
	glassblock: .4,
	thatch: .8,
	charredwood: .36,
	driftwood: 1.2,
	peelingpaint: .6,
	tiretread: .28,
	honeycomb: .12,
	frost: .35,
	stainedglass: .7,
	soapstone: .9,
	butcherblock: .45,
	wallpaper: .5,
	embroidery: .18,
	macrame: .24,
	brickpaving: .8,
	steppingstone: 1,
	woodendeck: .9,
	cheese: .3,
	sugarfrosting: .24,
	candleswax: .35,
	vinylrecord: .3,
	graphpaper: .3,
	notebookpaper: .3,
	lace: .24,
	crochet: .18,
	basketweave: .36,
	zipper: .12,
	velcro: .06,
	button: .12,
	traintracks: .6,
	manholecover: .6,
	speedbump: .9,
	circuitboard: .12,
	solarpanel: .24,
	heattile: .18,
	pianokeys: .16,
	drumskin: .4,
	gongsurface: .3,
	lensarray: .06,
	prismtape: .12,
	fresnel: .24,
	bandage: .12,
	pillblister: .18,
	sutures: .12,
	trellis: .3,
	terracottapot: .36,
	hedgerow: .24,
	collar: .06,
	petbed: .4,
	scratchpost: .12,
	runningtrack: .9,
	bouldermat: .6,
	pooltile: .24,
	envelope: .12,
	chalkboard: .6,
	corkboard: .18,
	snowdrift: .9,
	icicle: .24,
	dewdrops: .06,
	mooncrater: .6,
	starfield: .3,
	nebula: .45,
	pleats: .18,
	shoelace: .06,
	tassel: .12,
	woksurface: .12,
	cutlery: .1,
	choppingboard: .3,
	faucet: .24,
	showerhead: .18,
	bathmat: .3,
	blinds: .12,
	curtain: .24,
	shadecloth: .06,
	sandstone: .6,
	travertine: .48,
	pumice: .18,
	parquet: .8,
	mosaic: .24,
	hexagontiles: .6,
	knit: .064,
	corduroy: .048,
	felt: .1,
	roofshingles: 1.2,
	rooftiles: 1.8,
	stucco: .6,
	lichen: .28,
	leaflitter: .72,
	lotusleaf: .9,
	bananaleaf: 1.5,
	fernleaf: .66,
	endgrain: .3,
	acousticfoam: .6,
	closedcellfoam: .084,
	linoleum: .6,
	suede: .12,
	snakeskin: .16,
	crocodile: .24,
	herringbone: .048,
	tweed: .06,
	seersucker: .096,
	knurledmetal: .048,
	engineturned: .12,
	goldleaf: .36,
	orangepeel: .048,
	coconut: .12,
	watermelon: .24,
	limestone: .12,
	breccia: .6,
	gneiss: .6,
	plywood: .72,
	osb: .72,
	chipboard: .24,
	wafflecloth: .096,
	cableknit: .16,
	quilting: .48,
	crackleglaze: .16,
	flutedceramic: .24,
	encaustictiles: .8,
	fishscales: .12,
	tortoiseshell: .3,
	feathers: .16,
	reedmat: .24,
	rope: .18,
	straw: .4,
	studdedrubber: .3,
	groovedrubber: .24,
	recycledrubber: .24,
	breadcrust: .21,
	wafer: .072,
	chocolate: .12,
	pretzel: .2,
	bagel: .24,
	croissant: .24,
	butterflywing: .12,
	beetlewing: .16,
	spiderweb: .3,
	cirrus: .48,
	cumulus: .6,
	lightning: .9,
	kelp: .5,
	seaweed: .3,
	anemone: .24,
	candy: .18,
	marshmallow: .2,
	nougat: .24,
	frostedglass: .06,
	rippledglass: .18,
	bubbleglass: .12,
	saddlestitch: .16,
	tooledleather: .2,
	patentleather: .12,
	appleskin: .12,
	peachskin: .16,
	grapeskin: .1,
	broccoli: .18,
	cabbage: .24,
	onion: .16,
	bedsheet: .24,
	pillow: .3,
	mattress: .36,
	tealeaf: .12,
	matcha: .18,
	teabag: .08,
	sanddune: .48,
	pebblebeach: .18,
	foamedge: .12,
	lavaflow: .36,
	cooledlava: .24,
	ashfield: .4,
	stalactite: .3,
	flowstone: .36,
	cavefloor: .24,
	jam: .12,
	peanutbutter: .14,
	sprinkles: .1,
	icecream: .18,
	popsicle: .14,
	sorbet: .16,
	spaghetti: .2,
	macaroni: .16,
	lasagna: .24,
	origami: .2,
	paperlace: .12,
	papercut: .18,
	sunflower: .24,
	daisy: .2,
	clover: .24,
	puzzletile: .24,
	legobrick: .2,
	rubberband: .16,
	haybale: .5,
	corncrib: .3,
	fencepost: .18,
	poolfelt: .3,
	icesurface: .24,
	climbingwall: .4,
	oledpanel: .12,
	crtscanline: .16,
	keyboardkey: .24,
	filmstrip: .18,
	postagestamp: .24,
	halftoneprint: .06,
	radiator: .3,
	screwhead: .12,
	chainlink: .2,
	friedegg: .24,
	sushirice: .16,
	chocolatechip: .24,
	cargomat: .3,
	dashboardgrain: .24,
	licenseplate: .3,
	flowerbed: .3,
	grassstripe: .4,
	topiary: .28,
	confetti: .24,
	ribbonstreamer: .3,
	pinatafringe: .2,
	xylophone: .24,
	tambourine: .3,
	castanet: .2,
	pillcapsule: .24,
	pilltablet: .16,
	bathbomb: .2,
	basketball: .24,
	tennisball: .12,
	golfball: .045,
	boardformedconcrete: 1.6,
	ribbedconcrete: 1.2,
	splitfaceblock: 1.6,
	chainmail: .12,
	rivetedmetal: 1.2,
	weldedmetal: .6,
	cactus: .32,
	pinecone: .16,
	corncob: .12,
	basalt: 1.2,
	scoria: .2,
	obsidian: .3,
	malachite: .24,
	agate: .32,
	lapislazuli: .3,
	rice: .06,
	sesame: .05,
	coffeebeans: .1,
	braincoral: .24,
	starcoral: .18,
	seasponge: .16,
	houndstooth: .064,
	tartan: .16,
	damask: .24,
	zebrafur: .32,
	leopardfur: .36,
	giraffefur: .6,
	scallopshell: .28,
	oystershell: .32,
	nautilusshell: .24,
	walnutshell: .06,
	peanutshell: .04,
	almondshell: .035,
	cantaloupe: .14,
	dragonfruit: .18,
	kiwiskin: .045,
	rosepetal: .025,
	lilypetal: .055,
	fritillarypetal: .035,
	birchbark: .18,
	palmtrunk: .28,
	sycamorebark: .3,
	elephanthide: .3,
	ostrichleather: .1,
	sharkskin: .035,
	tactilepaving: .6,
	roadmarking: 2,
	draincover: .7,
	mushroomgills: .12,
	morel: .08,
	bracketfungus: .25,
	pineapple: .16,
	strawberry: .055,
	lychee: .055,
	sandpaper: .12,
	steelwool: .16,
	wirebrush: .1,
	cheesegrater: .2,
	ovenrack: .3,
	muffintin: .35,
	gauze: .09,
	elasticbandage: .14,
	icepack: .3,
	bubblewrap: .12,
	sequin: .096,
	pennyround: .2,
	volleyball: .3,
	bowlingball: .24,
	rugbyball: .28,
	wafflecone: .18,
	donutglaze: .24,
	brownie: .2,
	soapbar: .24,
	loofah: .2,
	scrubbypad: .14,
	orangeflesh: .12,
	kiwiflesh: .08,
	avocadoflesh: .1,
	turquoise: .16,
	rhodonite: .2,
	tigereye: .18,
	tatami: .16,
	flutedwood: .32,
	subwaytiles: .6,
	canewebbing: .24,
	rammedearth: 2,
	copperpatina: .5,
	birdseyemaple: .24,
	breezeblock: .8,
	basketweavepavers: .8,
	ripstop: .04,
	octagondot: .8,
	truchettiles: .8,
	standingseam: 2,
	damascus: .12,
	windmillpavers: .9,
	castiron: .1,
	porphyry: .3,
	linen: .04,
	chippedenamel: .25,
	perforatedleather: .04,
	pigskinleather: .028,
	argyle: .16,
	chevronparquet: .6,
	ginkgoleaf: .24,
	pressedtin: .6,
	sashiko: .064,
	ashlar: 1.2,
	gabion: .4,
	gingham: .08,
	mossypavers: .8,
	bamboocrosscut: .24,
	moire: .08,
	oakleaf: .3,
	rhombille: .9,
	fossillimestone: .6,
	seigaihatiles: .6,
	tuftedleather: .8,
	louveredmetal: .6,
	herringbonebrick: 1.2,
	shibori: .24,
	scallopedslate: 1.2,
	saltpan: 3,
	dogbonepavers: .8,
	palmendgrain: .024,
	blackpalm: .096,
	asanoha: .12,
	lotusseedpod: .3,
	crowncaps: .112,
	cofferedconcrete: 2.4,
	woodworm: .16,
	calcadawaves: 1.28,
	ikat: .16,
	slottedwood: .8,
	hollyleaf: .24,
	englishbond: .8,
	rebar: .12,
	starfruit: .18,
	diamondrustication: 1.6,
	bargello: .064,
	saffiano: .032,
	cocoamat: .08,
	suminagashi: .24,
	vermiculite: .06,
	cairotiles: .8,
	guilloche: .1,
	seaurchintest: .24,
	crystallineglaze: .16,
	shirring: .12,
	sunburstveneer: .8,
	rakedgravel: .8,
	flintwall: 1.2,
	frenchknots: .06,
	artichoke: .18,
	splitlockwashers: .08,
	flemishbond: 1.2,
	satinweave: .02,
	lotusroot: .24,
	cardboardedge: .024,
	hexnuts: .08,
	capnuts: .08,
	flangenuts: .08,
	calcite: .1,
	halite: .08,
	waffleweave: .12,
	fishscaleshingles: 1.75,
	starfish: .3,
	snubsquaretiles: .6,
	rhombitrihexagonaltiles: 1.2,
	elongatedtriangulartiles: 1.2,
	truncatedtrihexagonaltiles: 1.6,
	kisrhombilletiles: 1.2,
	chladnifigure: .6,
	sierpinskicarpet: .81,
	moorecurve: .64,
	papertape: .0254,
	ulamspiral: .375,
	sevensegment: .2,
	perfectmaze: .64,
	rule30: .66,
	embossedbraille: .042,
	ean13label: .0373,
	soroban: .056,
	deltoidaltrihexagonaltiles: .84,
	snubtrihexagonaltiles: .84,
	floretpentagonaltiles: .84,
	prismaticpentagonaltiles: .6,
	apollonianmosaic: .24,
	ichinghexagrams: .32,
	pythagorastree: .4,
	pentominotiles: .6,
	langtonsant: .32,
	vogelspiral: .5,
	gosperinlay: .5,
	pallasite: .16,
	cuttlebone: .0024,
	watermelontourmaline: .08,
	leafstomata: 25e-5,
	chitonshells: .12,
	radiolariandiscs: 24e-5,
	diatomvalves: 12e-5,
	orbicularjasper: .12,
	acornbarnacles: .12,
	circularpavers: 1.6,
	snowflaketiles: .8,
	sawblades: .8,
	pistachios: .15,
	polkadotfabric: .12,
	cucumberslices: .18,
	monsteraleaf: .9,
	crossstitch: .08,
	staranise: .12,
	logcabinparquet: 1.2,
	countersunkmetal: .3,
	trilobitefossil: .45,
	eyeletcotton: .06,
	dendriticagate: .15,
	ravioli: .16,
	rollerchain: .24,
	mapleleaf: .3,
	smocking: .12,
	quatrefoiltile: .5,
	okraslice: .09,
	eggcarton: .16,
	greekkey: .45,
	seedbeads: .06,
	chainstitch: .12,
	wingnuts: .12,
	pomegranateslice: .15,
	pawprinttiles: .6,
	dovetailjoint: .48,
	starsocketbolts: .12,
	sanddollar: .3,
	brogueleather: .18,
	clovebuds: .08,
	starcrosstiles: .8,
	maplesamara: .2,
	lenoweave: .06,
	circlips: .08,
	eclips: .064,
	tuliptiles: .6,
	gingerslice: .2,
	fivebarplate: .6,
	cinnamonswirl: .32,
	wheatears: .24,
	scalemail: .24,
	trihexagonaltiles: .84,
	burlwood: .24,
	slottedmetal: .4,
	peppercorns: .08,
	castellatednuts: .08,
	farfalle: .16,
	cardamompods: .08,
	brickarches: 2.4,
	knottednet: .3,
	fiddleheads: .24,
	cowrieshells: .2,
	cotterpins: .12,
	garterstitch: .12,
	seedstitch: .12,
	mangosteenslice: .32,
	pickettiles: .9,
	squarewashers: .16,
	eucalyptusleaf: .48,
	twillweave: .16,
	pumpkinseeds: .12,
	spurgears: .2,
	diamondcheckertiles: 1.2,
	appleslice: .4,
	paperclips: .24,
	rclips: .12,
	linchpins: .2,
	ivyleaf: .32,
	ribknit: .12,
	pillowtiles: .6,
	coffeerings: .36,
	cashews: .16,
	hinges: .4,
	woodruffkeys: .08,
	dowelpins: .12,
	clevispins: .12,
	gibheadkeys: .2,
	parallelkeys: .12,
	coins: .12,
	righttriangletiles: 1,
	cherryblossom: .24,
	punchcard: .44,
	braidedcord: .08,
	crossbeddedsandstone: 1.2,
	grommetcanvas: .16,
	fishscaletiles: .4,
	hexkeys: .4,
	driedfigslice: .24,
	creamcrackers: .24,
	doorkeys: .32,
	dodecagontiles: .7,
	ballchain: .064,
	succulentrosettes: .64,
	foldingfans: 1,
	togglebuttons: .32,
	greenpeapods: .48,
	beltbuckles: .32,
	hextruchettiles: .7,
	scoredmango: .48,
	waxseals: .16,
	cottonbolls: .24,
	carabiners: .32,
	pencilends: .04,
	corrugatedplasticedge: .064,
	haircombs: .48,
	blackberries: .16,
	musselshells: .32,
	safetypins: .16,
	poppyseedpods: .24,
	leatherbookspines: .32,
	matchsticks: .2,
	porcelaininsulators: .8,
	dominoes: .24,
	woodenspoons: .4,
	chessrooks: .24,
	threadspools: .24,
	bellpepperslices: .32,
	sharkteeth: .24,
	grinderburrs: .4,
	cowhide: .8,
	spaltedwood: .6,
	canlids: .28,
	crinoidossicles: .08,
	pythagoreantiles: .4,
	dinnerforks: .96,
	goldbrocade: .24,
	mudtiretracks: 3,
	peacockfeathers: .64,
	tangramtiles: .6,
	batterypositivecaps: .12,
	passionfruitslice: .32,
	screwterminalblocks: .08,
	dragonfruitflesh: .06,
	speakercones: .64,
	septarianstone: .48,
	axialresistors: .12,
	tomatoslices: .32,
	pinstripewool: .08,
	chrysanthemumstone: .48,
	snowflakeobsidian: .12,
	sewingsnaps: .12,
	lathplaster: .8,
	ceramiccapacitors: .12,
	fennelseeds: .096,
	rj45femalefaces: .054,
	rcafemalefaces: .04,
	f05opticalfaces: .04,
	minidin4femalefaces: .04,
	dcbarreljackfaces: .04,
	stfiberadapterfaces: .04,
	to92packagefaces: .08,
	to220packagefaces: .08,
	ftypefemalefaces: .04,
	usbcfemalefaces: .032,
	iecc6inlets: .1,
	iecc8inlets: .08,
	din5femalefaces: .08,
	xlrfemalefaces: .09,
	bncfemalefaces: .04,
	iecc14inlets: .08,
	dsubsocketfaces: .08,
	topadjusttrimmers: .02,
	crownprobetips: .008,
	piezodiaphragms: .06,
	castellatedboards: .06,
	qfnlandpads: .02,
	bgasolderballs: .05,
	ballbearingfaces: .16,
	baseballleather: .24,
	toothbrushheads: .12,
	bowtieinlay: .6,
	redcabbagecut: .48,
	slottedturners: .32,
	triglidesliders: .16,
	popcorn: .24,
	dualinlinechips: .16,
	tortoiseshellacetate: .2,
	cathedralquilt: .6,
	matelasse: .24,
	silknoil: .12,
	buckwheathulls: .064,
	rutilatedquartz: .2,
	peppermintcanes: .32,
	rubbergrommets: .16,
	chioggiabeetcuts: .24,
	flatflexcables: .24,
	celerycuts: .24,
	tactileswitches: .24,
	paisleybrocade: .4,
	siliconepastrybrushes: .32,
	graphicgranite: .2,
	brasspadlocks: .24,
	carrotcuts: .24,
	bluepushpins: .16,
	oatflakes: .06,
	tigerfur: .4,
	grosgrainribbons: .06,
	azuritemalachite: .2,
	openendspanners: .4,
	lentilseeds: .04,
	blueprintpaper: .4,
	horsechestnutleaf: .8,
	binderclips: .32,
	charoite: .2,
	chenilleyarn: .08,
	ceramicfuses: .16,
	hazelnutshells: .1,
	yagasuricloth: .24,
	balloonwhisks: .8,
	orthocerasstone: .4,
	rickracktrim: .12,
	toroidalinductors: .16,
	pennerigate: .16,
	lepidolitemica: .2,
	brassjinglebells: .16,
	nutmeghalves: .12,
	coaxialcablecuts: .12,
	shippocloth: .24,
	driedtamarindpods: .32,
	conicalsampletubes: .24,
	botryoidalcopper: .16,
	pencilshavings: .16,
	papayacuts: .16,
	sewingthimbles: .16,
	boullebrassinlay: .24,
	diamondpanelparquet: .8,
	dendriticfrost: .12,
	bullionknots: .12,
	orecchiette: .16,
	solderlessbreadboard: .04064,
	kyaniteblades: .16,
	staurolite: .12,
	azurite: .1,
	celestine: .1,
	barite: .08,
	wulfenite: .06,
	internaltoothwashers: .16,
	driedchillies: .16,
	utilityknifeblades: .24,
	windmillparquet: .8,
	bismuthhoppers: .16,
	splitvanillapods: .6,
	seamrippers: .6,
	flakedarrowheads: .4,
	dandelionseeds: .09,
	shojipaperlattice: .9,
	nyloncableties: .6,
	weavingshuttles: .6,
	tailorstapes: .1,
	woodenclothespins: .6,
	cinnamonbarkcoils: .09,
	compactcassettefaces: .45,
	kintsugiceramic: .32,
	pleatedfilterpapers: .36,
	splitcedarshakes: 2,
	swavepavers: .96,
	mushroomslices: .18,
	insulatedringlugs: .18,
	bananaslices: .12,
	rosemarysprigs: .18,
	pencilsharpeners: .15,
	scissors: .25,
	serpentinesprings: .2,
	impellerfaces: .3,
	chipresistors: .12,
	memorycardbacks: .15,
	gnocchi: .12,
	rectangularsocketfaces: .09,
	saffronthreads: .06,
	fishhooks: .15,
	violinfholes: .45,
	palmiers: .18,
	barbedwire: .4,
	oxfordweave: .08,
	lacewood: .35,
	papyrus: .3,
	larimar: .25,
	paperbark: .4,
	horseshoes: .6,
	durianpeel: .24,
	flystitch: .12,
	abaloneshells: .45,
	gyroidinfill: .16,
	cloisonne: .18,
	rambutanskin: .12,
	rackgears: .6,
	grosgrain: .025,
	faille: .03,
	bedfordcord: .07,
	poplin: .016,
	ooliticlimestone: .024,
	ogeetiles: .72,
	bittermelonskin: .18,
	cocobolo: .24,
	doubleedgerazorblades: .18,
	chiastolite: .12,
	dimity: .02,
	juniperberries: .064,
	gabbro: .18,
	turnbuckles: .24,
	rhodochrosite: .18,
	bluelaceagate: .12,
	bayleaf: .24,
	whipcord: .06,
	gabardine: .018,
	oilspotglaze: .16,
	persimmonslice: .24,
	kitkattiles: .6,
	brakediscs: .72,
	mulberrypaper: .16,
	howlite: .24,
	sodalite: .12,
	ottoman: .024,
	shackles: .6,
	watercaltrops: .24,
	fluorite: .06,
	vanadinite: .1,
	pyromorphite: .1,
	redberyl: .18,
	cavansite: .16,
	wenge: .12,
	parchment: .04,
	cavalrytwill: .024,
	screwhooks: .36,
	nigellaseeds: .024,
	phyllite: .18,
	shantung: .024,
	hempcrete: .24,
	utilityblades: .24,
	chrysocolla: .12,
	hemimorphite: .12,
	smithsonite: .12,
	sichuanpepperhusks: .05,
	huckaback: .032,
	anorthosite: .2,
	cubebberries: .08,
	seraphinite: .16,
	hexsocketheads: .18,
	datepits: .08,
	sapele: .3,
	chambray: .016,
	ticking: .048,
	cottondrill: .08,
	nephrite: .16,
	diorite: .16,
	carawayseeds: .04,
	springpinends: .064,
	rhyolite: .12,
	tonkabeans: .2,
	pentalobescrewheads: .048,
	padauk: .16,
	cottonflannel: .024,
	pinolith: .1,
	tripointscrewheads: .048,
	septarian: .12,
	squaresocketheads: .06,
	trianglesocketheads: .06,
	pietersite: .06,
	bronzite: .12,
	castorbeans: .064,
	zebrawood: .16,
	europeanbeech: .24,
	whiteoak: .24,
	whiteash: .24,
	kingwood: .24,
	braziliantulipwood: .12,
	macassarebony: .18,
	bocote: .24,
	twopinscrewheads: .06,
	amazonite: .06,
	blackeyedpeas: .06,
	adzukibeans: .05,
	anigre: .16,
	makore: .18,
	larvikite: .12,
	squareholewashers: .1,
	tigerwood: .18,
	snakewood: .16,
	safflowerseeds: .06,
	thulite: .12,
	unakite: .12,
	eudialyte: .12,
	iroko: .18,
	lignumvitae: .12,
	purpleheart: .12,
	yellowheart: .12,
	bloodwood: .12,
	basswood: .1,
	tabwashers: .1,
	sphericalwashers: .1,
	mungbeans: .045,
	thomsonite: .048,
	dalmatianstone: .06,
	nickelsilver: .025,
	hopsack: .016,
	monkscloth: .03,
	lyocell: .012,
	surah: .015,
	sateen: .04,
	serge: .04,
	habotai: .04,
	batiste: .04,
	ramie: .04,
	wavewashers: .1,
	cupwashers: .1,
	blackwalnut: .16,
	douglasfir: .2,
	longleafpine: .12,
	chesterfieldleather: .5,
	westernredcedar: .12,
	perforatedhardboard: .4
});
//#endregion
exports.proceduralMaterialLimits = proceduralMaterialLimits;
exports.proceduralMaterialPresets = proceduralMaterialPresets;
exports.proceduralTileMeters = proceduralTileMeters;

//# sourceMappingURL=materials.cjs.map