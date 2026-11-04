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
	mudcloth: Object.freeze({
		dark: [
			31,
			20,
			14
		],
		light: [
			232,
			214,
			180
		],
		roughness: .88,
		relief: 8e-4,
		threads: 64,
		bands: 8,
		wobbleCells: 24,
		wobble: .035,
		strokeHalf: .055,
		widthJitter: .18,
		edgeSoft: .03,
		separatorHalf: .03,
		zigzagAmplitude: .2,
		dotRadius: .13,
		diamondRadius: .3,
		diamondDotRadius: .075,
		ladderOffset: .22,
		rungHalf: .04,
		groundTone: .1,
		motifTone: .84,
		stainCells: 16,
		stain: .07,
		threadTone: .06,
		fiberTone: .06,
		weaveHeight: .8,
		dyeCrust: .15,
		grainHeight: .05,
		groundRoughness: .86,
		motifRoughness: .96,
		grainRoughness: .03,
		aoFloor: .7,
		motifAO: .04
	}),
	turingpattern: Object.freeze({
		dark: [
			52,
			31,
			17
		],
		light: [
			232,
			203,
			158
		],
		roughness: .78,
		relief: 7e-4,
		waveX: [
			13,
			-6,
			-7
		],
		waveY: [
			0,
			11,
			-11
		],
		warpCells: 10,
		warp: .05,
		thresholdCells: 4,
		thresholdLow: .1,
		thresholdHigh: 1.5,
		edge: .32,
		grainCells: 160,
		groundTone: .82,
		patternTone: .14,
		coreTone: .06,
		coreDepth: 1.2,
		grainTone: .05,
		groundHeight: .2,
		patternHeight: .55,
		grainHeight: .04,
		groundRoughness: .74,
		patternRoughness: .86,
		grainRoughness: .04,
		patternAO: .82
	}),
	bayerdither: Object.freeze({
		dark: [
			18,
			22,
			30
		],
		light: [
			236,
			232,
			214
		],
		roughness: .62,
		relief: .0036,
		blocks: 64,
		phase: .25,
		levelCells: 3,
		contrast: 1.5,
		gap: .06,
		bevel: .12,
		jitter: .05,
		gapTone: .02,
		onTone: .9,
		offTone: .14,
		floorHeight: .04,
		onHeight: .92,
		offHeight: .46,
		onRoughness: .42,
		offRoughness: .78,
		gapRoughness: .95,
		floorAO: .5,
		onAO: 1,
		offAO: .8
	}),
	patchworkquilt: Object.freeze({
		dark: [
			46,
			34,
			58
		],
		light: [
			240,
			218,
			178
		],
		roughness: .82,
		relief: .0042,
		patches: 4,
		threads: 96,
		designs: 4,
		toneLevels: [
			.12,
			.3,
			.5,
			.7,
			.88
		],
		seamWidth: .02,
		seamSoft: .008,
		domeWidth: .3,
		ringWidth: .125,
		stripes: 3,
		dotPitch: .1667,
		dotRadius: .042,
		dotLift: .16,
		stitchInset: .07,
		stitchHalf: .011,
		stitchSoft: .006,
		stitchDashes: 6,
		stitchDuty: .62,
		threadTone: .93,
		floorHeight: .1,
		puffHeight: .62,
		seamDepth: .16,
		stitchDepth: .14,
		weaveHeight: .06,
		weaveTone: .035,
		roughnessBase: .8,
		threadRoughness: .9,
		seamAO: .45,
		stitchAO: .25,
		puffAO: .2
	}),
	amberresin: Object.freeze({
		dark: [
			88,
			38,
			6
		],
		light: [
			252,
			190,
			70
		],
		roughness: .14,
		relief: 6e-4,
		flowCells: 4,
		flowRows: 28,
		warpCells: 8,
		warp: .035,
		cells: 6,
		bubbleChance: .55,
		bubbleMin: .022,
		bubbleMax: .05,
		bubbleSoft: .003,
		rimWidth: .0055,
		spangleCells: 4,
		spangleChance: .4,
		spangleMin: .07,
		spangleMax: .1,
		spangleSpokes: 9,
		spangleSoft: .004,
		grainCells: 128,
		baseTone: .55,
		flowTone: .38,
		grainTone: .04,
		bubbleLift: .2,
		rimDrop: .4,
		spangleLift: .12,
		crackDrop: .12,
		baseHeight: .5,
		flowHeight: .08,
		crackDepth: .35,
		grainHeight: .04,
		flowRoughness: .08,
		bubbleRoughness: .05,
		crackRoughness: .3,
		bubbleAO: .12
	}),
	ammonitestone: Object.freeze({
		dark: [
			62,
			55,
			46
		],
		light: [
			236,
			224,
			196
		],
		roughness: .86,
		relief: .0026,
		cells: 2,
		jitter: .05,
		minScale: .9,
		maxScale: 1,
		innerRadius: .03,
		outerRadius: .4,
		growth: 2.3,
		ribs: 18,
		ribCurve: .35,
		ribPower: 3,
		ribFade: 3,
		keelWidth: .07,
		edgeSoft: .012,
		grainCells: 160,
		mottleCells: 6,
		matrixTone: .3,
		mottleTone: .1,
		grainTone: .05,
		shellTone: .68,
		ribTone: .14,
		sutureTone: .42,
		matrixHeight: .22,
		grainHeight: .05,
		shellHeight: .3,
		tubeHeight: .42,
		ribHeight: .14,
		keelHeight: .06,
		matrixRoughness: .88,
		shellRoughness: .55,
		grainRoughness: .06,
		shellAO: .55
	}),
	octopussuckers: Object.freeze({
		dark: [
			78,
			38,
			44
		],
		light: [
			236,
			206,
			196
		],
		roughness: .5,
		relief: .0034,
		columns: 4,
		rows: 4,
		jitter: .012,
		minScale: .92,
		maxScale: 1,
		radius: .11,
		rimInner: .58,
		cupRadius: .58,
		holeRadius: .17,
		ridges: 12,
		ridgeHeight: .1,
		ridgeTone: .1,
		wrinkleCells: 24,
		speckleCells: 64,
		speckleThreshold: .74,
		speckleSharp: 9,
		skinTone: .7,
		wrinkleTone: .06,
		speckleTone: .16,
		rimTone: .92,
		cupTone: .26,
		holeTone: .04,
		skinHeight: .42,
		wrinkleHeight: .05,
		rimHeight: .46,
		cupFloorHeight: .14,
		holeHeight: .04,
		skinRoughness: .5,
		rimRoughness: .36,
		cupRoughness: .66,
		cupAO: .5,
		holeAO: .2
	}),
	expandedpolystyrene: Object.freeze({
		dark: [
			96,
			98,
			102
		],
		light: [
			250,
			250,
			246
		],
		roughness: .78,
		relief: .0022,
		cells: 16,
		inset: .2,
		beadRadius: .62,
		seamWidth: .05,
		seamSoft: .05,
		voidSize: .16,
		voidSoft: .05,
		grainCells: 192,
		beadTone: .9,
		beadVariation: .08,
		seamTone: .55,
		voidTone: .12,
		grainTone: .05,
		seamHeight: .3,
		voidHeight: .04,
		domeHeight: .62,
		grainHeight: .03,
		beadRoughness: .78,
		seamRoughness: .9,
		seamAO: .7,
		voidAO: .3
	}),
	asphaltshingle: Object.freeze({
		dark: [
			34,
			36,
			40
		],
		light: [
			168,
			164,
			156
		],
		roughness: .94,
		relief: .0045,
		tabs: 6,
		courses: 12,
		slotHalf: .006,
		slotSoft: .003,
		slotTop: .42,
		edgeSoft: .02,
		granuleCells: 256,
		wearCells: 6,
		baseTone: .42,
		tabVariation: .1,
		granuleTone: .28,
		wearTone: .14,
		shadowTone: .12,
		slotTone: .03,
		baseHeight: .4,
		thickness: .3,
		granuleHeight: .06,
		slotHeight: .05,
		roughnessGranule: .04,
		shadowAO: .55,
		shadowReach: .3,
		slotAO: .2
	}),
	lawnstripes: Object.freeze({
		dark: [
			22,
			62,
			20
		],
		light: [
			158,
			204,
			82
		],
		roughness: .9,
		relief: .0028,
		stripes: 8,
		lean: 1,
		strandColumns: 192,
		strandRows: 48,
		detailColumns: 384,
		detailRows: 96,
		clumpCells: 10,
		wobbleCells: 12,
		wobble: .006,
		baseTone: .5,
		stripeTone: .14,
		strandTone: .34,
		detailTone: .12,
		clumpTone: .12,
		baseHeight: .35,
		strandHeight: .4,
		detailHeight: .1,
		clumpHeight: .1,
		strandRoughness: .06,
		stripeRoughness: .05,
		valleyAO: .55
	}),
	atomicboomerang: Object.freeze({
		dark: [
			34,
			84,
			90
		],
		light: [
			240,
			232,
			204
		],
		roughness: .34,
		relief: 8e-4,
		cells: 5,
		boomerangChance: .62,
		starChance: .7,
		jitter: .06,
		halfLength: .32,
		rise: .4,
		halfWidth: .085,
		taper: 3,
		edgeSoft: .012,
		minScale: .8,
		maxScale: 1,
		starRadius: .2,
		starPower: .55,
		speckleCells: 160,
		speckleThreshold: .8,
		speckleSharp: 10,
		baseTone: .56,
		lightTone: .94,
		darkTone: .2,
		speckleTone: .22,
		printHeight: .1,
		baseHeight: .45,
		printRoughness: .05
	}),
	celticplait: Object.freeze({
		dark: [
			52,
			48,
			42
		],
		light: [
			214,
			204,
			180
		],
		roughness: .82,
		relief: .0042,
		bands: 4,
		periods: 4,
		amplitude: .052,
		ribbonHalf: .029,
		ribbonSoft: .004,
		grooveHalf: .006,
		railPosition: .114,
		railHalf: .006,
		shadowWidth: .014,
		grainCells: 160,
		groundTone: .3,
		ribbonTone: .74,
		grooveTone: .22,
		railTone: .62,
		grainTone: .07,
		groundHeight: .12,
		ribbonHeight: .62,
		underDrop: .3,
		grooveDepth: .12,
		railHeight: .3,
		grainHeight: .03,
		roughnessGrain: .06,
		shadowAO: .45
	}),
	garnetschist: Object.freeze({
		dark: [
			60,
			22,
			26
		],
		light: [
			226,
			218,
			208
		],
		roughness: .62,
		relief: .0035,
		layers: 28,
		layerCells: 3,
		fineLayers: 112,
		warpCells: 6,
		warp: .012,
		sparkleCells: 224,
		sparkleThreshold: .87,
		sparkleSharp: 14,
		cells: 5,
		garnetChance: .6,
		jitter: .1,
		minRadius: .1,
		maxRadius: .19,
		tailLength: 2,
		tailWidth: .7,
		edgeSoft: .12,
		baseTone: .46,
		layerTone: .22,
		fineTone: .08,
		sparkleTone: .4,
		garnetTone: .04,
		facetVariation: .12,
		crownTone: .08,
		tailTone: .16,
		baseHeight: .4,
		layerHeight: .12,
		garnetHeight: .38,
		crownHeight: .08,
		tailHeight: .06,
		sparkleHeight: .05,
		layerRoughness: .12,
		garnetRoughness: .3,
		sparkleRoughness: .35,
		garnetAO: .85
	}),
	topographiccontours: Object.freeze({
		dark: [
			70,
			42,
			24
		],
		light: [
			244,
			236,
			214
		],
		roughness: .84,
		relief: .0012,
		coarseCells: 3,
		mediumCells: 6,
		fineCells: 12,
		coarseWeight: .5,
		mediumWeight: .3,
		fineWeight: .2,
		rangeLow: .2,
		rangeHigh: .8,
		levels: 16,
		indexEvery: 5,
		minorHalf: .0012,
		indexHalf: .0028,
		lineSoft: .0014,
		gradientStep: 5e-4,
		minimumGradient: .05,
		fiberCells: 256,
		paperBase: .5,
		elevationTone: .42,
		fiberTone: .03,
		minorTone: .12,
		indexTone: .04,
		baseHeight: .15,
		elevationHeight: .55,
		lineDepth: .1,
		fiberHeight: .03,
		fiberRoughness: .04
	}),
	digitalcamo: Object.freeze({
		dark: [
			30,
			38,
			26
		],
		light: [
			204,
			186,
			138
		],
		roughness: .9,
		relief: 7e-4,
		blocks: 64,
		coarseShare: .5,
		broadCells: 4,
		mediumCells: 12,
		broadWeight: .55,
		mediumWeight: .3,
		jitterWeight: .15,
		tones: [
			.08,
			.34,
			.62,
			.9
		],
		threads: 128,
		weaveTone: .03,
		weaveHeight: .45,
		baseHeight: .3,
		inkHeight: .04,
		weaveRoughness: .04,
		weaveAO: .25
	}),
	radarscope: Object.freeze({
		dark: [
			2,
			10,
			4
		],
		light: [
			150,
			255,
			160
		],
		roughness: .3,
		relief: 4e-4,
		radius: .46,
		rings: 5,
		ringHalf: .0016,
		outerHalf: .0034,
		spokes: 24,
		spokeHalf: .0012,
		crossEvery: 6,
		crossHalf: .0022,
		lineSoft: .0012,
		sweepWidth: 1.3,
		sweepLineWidth: .012,
		blips: 6,
		blipRadius: .011,
		blipPersistence: .4,
		scanlines: 192,
		scanlineDepth: .12,
		grainCells: 256,
		backgroundTone: .04,
		glowTone: .1,
		ringTone: .34,
		spokeTone: .26,
		sweepTone: .28,
		sweepLineTone: .9,
		blipTone: .95,
		grainTone: .02,
		baseHeight: .5,
		lineHeight: .15,
		baseRoughness: .3,
		glowRoughness: .15
	}),
	hazardstripes: Object.freeze({
		dark: [
			18,
			18,
			20
		],
		light: [
			246,
			196,
			28
		],
		roughness: .55,
		relief: .0032,
		stripes: 8,
		chipCells: 96,
		scratchColumns: 192,
		scratchRows: 10,
		grainCells: 192,
		chipWeight: .55,
		scratchWeight: .3,
		edgeWeight: .35,
		edgeReach: .3,
		wearThreshold: .66,
		wearSoft: .05,
		yellowTone: .86,
		blackTone: .08,
		steelHeight: .22,
		paintHeight: .14,
		grainHeight: .03,
		yellowRoughness: .45,
		blackRoughness: .62,
		steelRoughness: .36,
		rimAO: .3
	}),
	kiwislices: Object.freeze({
		dark: [
			48,
			34,
			14
		],
		light: [
			196,
			232,
			118
		],
		roughness: .28,
		relief: .0018,
		cells: 2,
		jitter: .04,
		minScale: .92,
		maxScale: 1,
		radius: .42,
		skinWidth: .045,
		skinSoft: .012,
		coreRadius: .115,
		coreSoft: .02,
		innerSeedRadius: .175,
		innerSeeds: 20,
		outerSeedRadius: .24,
		outerSeeds: 28,
		seedLength: .019,
		seedWidth: .0085,
		streaks: 64,
		streakPower: 3,
		fuzzCells: 128,
		juiceCells: 24,
		skinTone: .14,
		fleshTone: .62,
		gradientTone: .12,
		streakTone: .14,
		coreTone: .94,
		seedTone: .03,
		fuzzTone: .08,
		juiceTone: .04,
		baseHeight: .4,
		skinHeight: .06,
		coreHeight: .14,
		seedDepth: .2,
		streakHeight: .05,
		fuzzHeight: .06,
		fleshRoughness: .24,
		skinRoughness: .9,
		seedRoughness: .4,
		seedAO: .45,
		coreAO: .92
	}),
	mandalaflower: Object.freeze({
		dark: [
			24,
			18,
			36
		],
		light: [
			238,
			214,
			160
		],
		roughness: .7,
		relief: .0014,
		lotusCount: 12,
		lotusBase: .3,
		lotusDepth: .15,
		lotusPower: .8,
		dotCount: 36,
		dotRadius: .27,
		dotSize: .012,
		petalCount: 24,
		petalBase: .12,
		petalDepth: .11,
		petalPower: 1.5,
		innerCount: 12,
		innerBase: .04,
		innerDepth: .09,
		innerPower: 1,
		hubRadius: .035,
		outlineWidth: .008,
		edgeSoft: .003,
		grainCells: 192,
		groundTone: .38,
		lotusTone: .74,
		dotTone: .16,
		petalTone: .48,
		innerTone: .86,
		hubTone: .12,
		outlineTone: .1,
		grainTone: .04,
		groundHeight: .15,
		lotusHeight: .35,
		dotHeight: .55,
		petalHeight: .5,
		innerHeight: .7,
		hubHeight: .85,
		outlineDepth: .1,
		grainHeight: .03
	}),
	needlepoint: Object.freeze({
		dark: [
			34,
			22,
			40
		],
		light: [
			244,
			226,
			196
		],
		roughness: .86,
		relief: .0026,
		stitches: 48,
		motif: 12,
		halfWidth: .27,
		halfLength: .66,
		lengthPower: 4,
		edgeSoft: .12,
		plyAlong: 2.5,
		plyAcross: 1.2,
		ringTones: [
			.16,
			.5,
			.8
		],
		ringWidth: 2,
		accentTone: .94,
		accentHalf: 1,
		jitter: .03,
		plyTone: .07,
		holeTone: .03,
		holeHeight: .04,
		stitchHeight: .62,
		baseHeight: .3,
		plyHeight: .06,
		holeRoughness: .95,
		stitchRoughness: .82,
		holeAO: .45
	}),
	dicefaces: Object.freeze({
		dark: [
			20,
			14,
			14
		],
		light: [
			244,
			238,
			220
		],
		roughness: .34,
		relief: .0034,
		cells: 4,
		halfSize: .43,
		cornerRadius: .11,
		edgeSoft: .012,
		bevelWidth: .1,
		pipSpacing: .255,
		pipRadius: .078,
		pipSoft: .01,
		grainCells: 192,
		faceTone: .9,
		pipTone: .08,
		gapTone: .02,
		grainTone: .03,
		gapHeight: .04,
		faceHeight: .55,
		domeHeight: .3,
		pipDepth: .35,
		grainHeight: .02,
		faceRoughness: .3,
		pipRoughness: .5,
		gapRoughness: .9,
		gapAO: .4,
		pipAO: .6
	}),
	cinderblockwall: Object.freeze({
		dark: [
			92,
			92,
			90
		],
		light: [
			196,
			196,
			190
		],
		roughness: .92,
		relief: .0038,
		courses: 8,
		columns: 4,
		jointWidth: .0095,
		jointSoft: .003,
		chamfer: .007,
		aggregateCells: 160,
		mottleCells: 8,
		voidCells: 56,
		voidChance: .3,
		voidRadius: .0042,
		voidSoft: .0014,
		blockTone: .5,
		blockVariation: .08,
		mottleTone: .1,
		aggregateTone: .12,
		voidTone: .2,
		jointHeight: .1,
		faceHeight: .62,
		aggregateHeight: .07,
		chamferHeight: .12,
		voidDepth: .3,
		jointRoughness: .98,
		voidAO: .35,
		jointAO: .55
	}),
	moirefringes: Object.freeze({
		dark: [
			18,
			20,
			30
		],
		light: [
			240,
			236,
			222
		],
		roughness: .62,
		relief: .0014,
		kx1: 24,
		ky1: 3,
		kx2: 24,
		ky2: -3,
		duty: .26,
		edgeSoft: .1,
		fiberCells: 256,
		paperTone: .97,
		inkTone: .04,
		fiberTone: .03,
		inkHeight: .55,
		paperHeight: .3,
		fiberHeight: .08,
		paperRoughness: .66,
		inkRoughness: .45,
		paperAO: 1,
		inkAO: .9
	}),
	azulejotiles: Object.freeze({
		dark: [
			18,
			38,
			118
		],
		light: [
			246,
			246,
			240
		],
		roughness: .2,
		relief: .0022,
		tiles: 4,
		groutWidth: .012,
		groutSoft: .003,
		bevel: .014,
		flowerRadius: .15,
		flowerLobe: .055,
		flowerLobes: 4,
		ringRadius: .3,
		ringHalfWidth: .012,
		cornerRadius: .2,
		cornerRing: .14,
		cornerRingHalfWidth: .01,
		edgeSoft: .006,
		crackCells: 28,
		crackWidth: .045,
		brushCells: 96,
		glazeTone: .93,
		pigmentTone: .1,
		brushTone: .1,
		crackTone: .08,
		glazeHeight: .7,
		groutHeight: .1,
		pigmentHeight: .04,
		bevelHeight: .2,
		groutRoughness: .9,
		pigmentRoughness: .28,
		groutAO: .5,
		crackAO: .85
	}),
	tumblingblocks: Object.freeze({
		dark: [
			30,
			24,
			44
		],
		light: [
			236,
			226,
			205
		],
		roughness: .82,
		relief: .0018,
		columns: 7,
		rows: 8,
		topTone: .92,
		rightTone: .62,
		leftTone: .3,
		blockJitter: .06,
		seamHalfWidth: .018,
		seamSoft: .012,
		seamTone: .12,
		threadCells: 224,
		threadTone: .05,
		topHeight: .62,
		rightHeight: .55,
		leftHeight: .48,
		seamDepth: .3,
		threadHeight: .05,
		seamAO: .6
	}),
	kilimflatweave: Object.freeze({
		dark: [
			34,
			20,
			52
		],
		light: [
			236,
			218,
			182
		],
		roughness: .9,
		relief: .0022,
		cells: 48,
		band: 12,
		motif: 12,
		zigzag: 6,
		tones: [
			.1,
			.3,
			.56,
			.88
		],
		cellJitter: .05,
		ribs: 3,
		ribTone: .05,
		slitWidth: .14,
		slitSoft: .05,
		slitTone: .04,
		ribHeight: .12,
		baseHeight: .55,
		slitDepth: .4,
		fuzzCells: 192,
		fuzzTone: .04,
		slitAO: .5
	}),
	ean13barcodes: Object.freeze({
		dark: [
			14,
			14,
			18
		],
		light: [
			244,
			243,
			238
		],
		roughness: .55,
		relief: .0012,
		rows: 4,
		quiet: 9,
		barTop: .1,
		barBottom: .84,
		guardBottom: .92,
		rowGap: .025,
		edgeSoft: .12,
		inkGainCells: 128,
		paperCells: 256,
		paperTone: .97,
		inkTone: .05,
		inkGain: .05,
		paperGrain: .025,
		inkHeight: .6,
		paperHeight: .3,
		gapHeight: .15,
		inkRoughness: .4,
		paperRoughness: .62
	}),
	morsetape: Object.freeze({
		dark: [
			30,
			22,
			16
		],
		light: [
			232,
			214,
			170
		],
		roughness: .78,
		relief: .0016,
		rows: 10,
		modules: 64,
		margin: 3,
		markRadius: .5,
		guideHalfHeight: .012,
		edgeSoft: .12,
		inkCells: 192,
		paperCells: 256,
		paperTone: .88,
		inkTone: .06,
		guideTone: .6,
		inkGain: .06,
		paperGrain: .04,
		inkHeight: .58,
		paperHeight: .35,
		guideHeight: .4,
		inkRoughness: .5,
		paperRoughness: .82
	}),
	sandripples: Object.freeze({
		dark: [
			150,
			108,
			62
		],
		light: [
			238,
			208,
			150
		],
		roughness: .96,
		relief: .006,
		kx: 18,
		ky: 7,
		windward: .72,
		warpCells: 6,
		warpAmplitude: .45,
		fineWarpCells: 24,
		fineWarpAmplitude: .08,
		grainCells: 384,
		speckCells: 112,
		speckChance: .05,
		speckRadius: .2,
		baseTone: .58,
		shadeWindward: .08,
		shadeLee: .2,
		grainTone: .07,
		speckTone: .22,
		grainHeight: .03,
		leeAO: .25
	}),
	frostpolygons: Object.freeze({
		dark: [
			54,
			52,
			44
		],
		light: [
			196,
			190,
			170
		],
		roughness: .9,
		relief: .012,
		cells: 8,
		jitter: .7,
		troughWidth: .06,
		troughSoft: .05,
		rimWidth: .42,
		rimSoft: .12,
		pebbleCells: 48,
		stoneRadius: .36,
		stoneEdge: 5,
		stoneRimMin: .45,
		stoneRimSoft: .25,
		pebbleToneRange: .4,
		grainHeight: .02,
		siltCells: 24,
		grainCells: 256,
		siltTone: .62,
		troughTone: .14,
		rimTone: .48,
		pebbleTone: .3,
		siltVariation: .1,
		grainTone: .06,
		troughHeight: .08,
		siltHeight: .46,
		rimHeight: .62,
		pebbleHeight: .14,
		troughAO: .45
	}),
	datamatrixcodes: Object.freeze({
		dark: [
			16,
			16,
			20
		],
		light: [
			242,
			241,
			236
		],
		roughness: .6,
		relief: .0012,
		symbols: 3,
		size: 18,
		quiet: 1,
		dataDensity: .5,
		edgeSoft: .14,
		inkCells: 128,
		paperCells: 256,
		paperTone: .97,
		inkTone: .05,
		inkGain: .06,
		paperGrain: .025,
		inkHeight: .58,
		paperHeight: .3,
		inkRoughness: .42,
		paperRoughness: .64
	}),
	ecgpaper: Object.freeze({
		dark: [
			28,
			10,
			22
		],
		light: [
			252,
			236,
			236
		],
		roughness: .7,
		relief: .0012,
		millimeters: 80,
		rows: 4,
		major: 5,
		beat: 20,
		minorHalfWidth: .045,
		majorHalfWidth: .09,
		traceHalfWidth: .2,
		lineSoft: .06,
		waves: [
			[
				3,
				.9,
				.55
			],
			[
				7.6,
				-.8,
				.22
			],
			[
				8.4,
				7,
				.24
			],
			[
				9.3,
				-1.8,
				.26
			],
			[
				14.5,
				1.7,
				1
			]
		],
		amplitudeJitter: .06,
		wanderAmplitude: .25,
		paperCells: 256,
		inkCells: 128,
		paperTone: .96,
		minorTone: .84,
		majorTone: .68,
		inkTone: .04,
		inkGain: .05,
		paperGrain: .02,
		inkHeight: .55,
		paperHeight: .3,
		lineHeight: .36,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	sheetmusic: Object.freeze({
		dark: [
			20,
			16,
			14
		],
		light: [
			244,
			236,
			214
		],
		roughness: .74,
		relief: .0014,
		staves: 8,
		beats: 16,
		barBeats: 4,
		spacing: .015625,
		lineHalf: .07,
		barHalf: .045,
		headA: .66,
		headB: .46,
		headTilt: .35,
		holeA: .42,
		holeB: .2,
		holeChance: .3,
		stemHalf: .05,
		stemLength: 3.5,
		maxPosition: 8,
		middlePosition: 4,
		edgeSoft: .1,
		inkCells: 128,
		paperCells: 256,
		paperTone: .9,
		inkTone: .05,
		inkGain: .06,
		paperGrain: .04,
		inkHeight: .58,
		paperHeight: .3,
		inkRoughness: .46,
		paperRoughness: .78
	}),
	sudokugrid: Object.freeze({
		dark: [
			22,
			24,
			34
		],
		light: [
			240,
			236,
			224
		],
		roughness: .72,
		relief: .0014,
		clueChance: .42,
		pixel: .135,
		thinHalf: .018,
		thickHalf: .04,
		edgeSoft: .0025,
		inkCells: 192,
		paperCells: 256,
		paperTone: .92,
		lineTone: .1,
		digitTone: .08,
		inkGain: .08,
		paperGrain: .04,
		inkHeight: .56,
		paperHeight: .3,
		inkRoughness: .44,
		paperRoughness: .76
	}),
	measuringtape: Object.freeze({
		dark: [
			18,
			16,
			10
		],
		light: [
			244,
			206,
			52
		],
		roughness: .5,
		relief: .0018,
		strips: 8,
		centimeters: 16,
		millimeterLength: 4,
		halfLength: 6.4,
		centimeterLength: 9.2,
		tickHalf: .14,
		centimeterTickScale: 1.8,
		edgeLine: .6,
		tickStart: .6,
		digitPixel: 1.1,
		digitLeft: 1,
		digitTop: 11,
		edgeSoft: .15,
		inkCells: 192,
		tapeCells: 256,
		tapeTone: .9,
		inkTone: .04,
		inkGain: .06,
		tapeGrain: .05,
		inkHeight: .55,
		tapeHeight: .32,
		inkRoughness: .42,
		tapeRoughness: .5
	}),
	calendarpage: Object.freeze({
		dark: [
			28,
			26,
			36
		],
		light: [
			244,
			240,
			228
		],
		roughness: .7,
		relief: .0014,
		columns: 7,
		rows: 6,
		pixel: .055,
		numberLeft: .1,
		numberTop: .1,
		lineHalf: .012,
		outerHalf: .03,
		weekendTint: .1,
		edgeSoft: .005,
		inkCells: 192,
		paperCells: 256,
		paperTone: .93,
		lineTone: .12,
		digitTone: .06,
		inkGain: .08,
		paperGrain: .04,
		inkHeight: .56,
		paperHeight: .3,
		inkRoughness: .44,
		paperRoughness: .74
	}),
	fretboard: Object.freeze({
		dark: [
			34,
			18,
			12
		],
		light: [
			214,
			204,
			186
		],
		roughness: .46,
		relief: .004,
		frets: 12,
		strings: 6,
		fretHalf: .0035,
		stringHalfMin: .0022,
		stringHalfMax: .0075,
		stringReach: .04,
		inlayFrets: [
			3,
			5,
			7,
			9
		],
		inlayRadius: .024,
		doubleInlayFret: 12,
		doubleInlayOffset: .17,
		edgeSoft: .002,
		grainCellsU: 24,
		grainCellsV: 192,
		fineGrainCellsU: 64,
		fineGrainCellsV: 512,
		woodTone: .18,
		woodVariation: .06,
		fineGrainTone: .03,
		fretTone: .82,
		stringTone: .7,
		inlayTone: .95,
		woodHeight: .4,
		fretHeight: .8,
		stringHeight: .62,
		inlayHeight: .46,
		grainHeight: .04,
		woodRoughness: .55,
		fretRoughness: .28,
		inlayRoughness: .3,
		stringShadow: .5
	}),
	crosswordgrid: Object.freeze({
		dark: [
			20,
			20,
			26
		],
		light: [
			244,
			240,
			230
		],
		roughness: .72,
		relief: .0014,
		size: 15,
		blackTarget: .17,
		attempts: 600,
		minRun: 3,
		pixel: .05,
		numberLeft: .08,
		numberTop: .08,
		lineHalf: .016,
		edgeSoft: .004,
		inkCells: 192,
		paperCells: 256,
		paperTone: .94,
		blackTone: .05,
		lineTone: .14,
		digitTone: .08,
		inkGain: .06,
		paperGrain: .04,
		inkHeight: .56,
		paperHeight: .3,
		inkRoughness: .44,
		paperRoughness: .76
	}),
	flipdotdisplay: Object.freeze({
		dark: [
			10,
			10,
			12
		],
		light: [
			236,
			214,
			54
		],
		roughness: .5,
		relief: .003,
		dots: 48,
		digitColumns: 12,
		digitRows: 8,
		discRadius: .42,
		edgeSoft: .06,
		pivotRadius: .08,
		grainCells: 256,
		panelTone: .02,
		offTone: .14,
		onTone: .92,
		grainTone: .03,
		panelHeight: .1,
		offHeight: .46,
		onHeight: .62,
		shineHeight: .06,
		onRoughness: .34,
		offRoughness: .62,
		panelRoughness: .9,
		panelAO: .45
	}),
	minesweeperboard: Object.freeze({
		dark: [
			34,
			36,
			44
		],
		light: [
			214,
			216,
			220
		],
		roughness: .55,
		relief: .003,
		cells: 24,
		mineDensity: .16,
		starts: 7,
		startAttempts: 200,
		pixel: .12,
		bevel: .1,
		edgeSoft: .03,
		grainCells: 192,
		raisedTone: .82,
		revealedTone: .62,
		lightEdgeTone: .97,
		shadeEdgeTone: .42,
		digitTone: .08,
		lineTone: .46,
		grainTone: .03,
		raisedHeight: .7,
		revealedHeight: .35,
		bevelDrop: .12,
		revealedAO: .82,
		raisedRoughness: .5,
		revealedRoughness: .7
	}),
	tetrisstack: Object.freeze({
		dark: [
			12,
			12,
			20
		],
		light: [
			236,
			236,
			244
		],
		roughness: .4,
		relief: .0035,
		cells: 16,
		attempts: 900,
		tones: [
			.9,
			.78,
			.66,
			.54,
			.42,
			.3,
			.2
		],
		emptyTone: .03,
		bevel: .14,
		pieceEdge: .045,
		edgeSoft: .03,
		shineWidth: .35,
		grainCells: 192,
		grainTone: .03,
		bevelTone: .12,
		pieceHeight: .66,
		emptyHeight: .1,
		bevelDrop: .12,
		edgeDrop: .3,
		pieceRoughness: .36,
		emptyRoughness: .9,
		emptyAO: .5,
		edgeAO: .55
	}),
	battleshipgrid: Object.freeze({
		dark: [
			26,
			40,
			62
		],
		light: [
			210,
			224,
			238
		],
		roughness: .5,
		relief: .003,
		cells: 10,
		fleet: [
			5,
			4,
			3,
			3,
			2
		],
		attempts: 400,
		shotChance: .32,
		gridHalf: .02,
		hullInset: .1,
		edgeSoft: .03,
		pegRadius: .2,
		grainCells: 192,
		waterTone: .72,
		gridTone: .5,
		hullTone: .3,
		hitTone: .08,
		missTone: .97,
		grainTone: .04,
		waterHeight: .3,
		hullHeight: .62,
		pegHeight: .8,
		gridDrop: .08,
		waterRoughness: .35,
		hullRoughness: .55,
		pegRoughness: .4,
		hullAO: .8
	}),
	hilbertcurve: Object.freeze({
		dark: [
			16,
			22,
			52
		],
		light: [
			244,
			238,
			222
		],
		roughness: .62,
		relief: .0014,
		order: 4,
		lineHalf: .14,
		edgeSoft: .03,
		paperCells: 256,
		inkCells: 128,
		paperTone: .94,
		startTone: .08,
		endTone: .55,
		inkGain: .04,
		paperGrain: .04,
		inkHeight: .56,
		paperHeight: .3,
		inkRoughness: .42,
		paperRoughness: .72
	}),
	mondriancomposition: Object.freeze({
		dark: [
			18,
			18,
			20
		],
		light: [
			246,
			242,
			232
		],
		roughness: .66,
		relief: .0016,
		maxDepth: 5,
		forcedDepth: 2,
		minSize: .14,
		splitChance: .8,
		lineHalf: .0075,
		edgeSoft: .0016,
		tones: [
			.97,
			.97,
			.97,
			.62,
			.4,
			.78
		],
		lineTone: .04,
		paintGain: .05,
		canvasGrain: .03,
		canvasCells: 192,
		paintCells: 96,
		lineHeight: .58,
		fieldHeight: .4,
		canvasHeight: .04,
		lineRoughness: .5,
		fieldRoughness: .7
	}),
	lissajousgrid: Object.freeze({
		dark: [
			8,
			24,
			18
		],
		light: [
			120,
			240,
			170
		],
		roughness: .4,
		relief: .002,
		cells: 4,
		segments: 160,
		amplitude: .4,
		phase: Math.PI / 2,
		lineHalf: .014,
		glowWidth: .1,
		edgeSoft: .008,
		frameHalf: .012,
		gratCells: 192,
		lineTone: .95,
		glowTone: .2,
		gridTone: .14,
		panelTone: .04,
		gratTone: .02,
		lineHeight: .6,
		panelHeight: .3,
		gridHeight: .38,
		lineRoughness: .3,
		panelRoughness: .65
	}),
	zoneplates: Object.freeze({
		dark: [
			10,
			12,
			18
		],
		light: [
			226,
			230,
			238
		],
		roughness: .38,
		relief: .0022,
		plates: 2,
		zones: 14,
		radius: .42,
		ringHalf: .022,
		ringOffset: .03,
		edgeSoft: .004,
		grainCells: 192,
		openTone: .93,
		closedTone: .06,
		mountTone: .5,
		ringTone: .7,
		grainTone: .03,
		closedHeight: .56,
		openHeight: .3,
		mountHeight: .4,
		ringHeight: .66,
		closedRoughness: .32,
		openRoughness: .2,
		mountRoughness: .55
	}),
	backgammonboard: Object.freeze({
		dark: [
			18,
			12,
			10
		],
		light: [
			236,
			224,
			200
		],
		roughness: .5,
		relief: .003,
		pointsPerSide: 12,
		checkers: 15,
		maxStack: 5,
		barWidth: .08,
		frame: .02,
		tipLength: .4,
		checkerFill: .46,
		edgeSoft: .004,
		grainCells: 192,
		feltTone: .2,
		barTone: .12,
		pointTones: [.52, .34],
		lightChecker: .92,
		darkChecker: .07,
		rimTone: .5,
		grainTone: .03,
		feltHeight: .3,
		pointHeight: .34,
		barHeight: .5,
		checkerHeight: .7,
		rimDrop: .1,
		checkerRoughness: .3,
		feltRoughness: .75
	}),
	jigsawpuzzle: Object.freeze({
		dark: [
			34,
			40,
			58
		],
		light: [
			240,
			226,
			196
		],
		roughness: .58,
		relief: .0026,
		cells: 6,
		bulbRadius: .115,
		bulbOffset: .15,
		neckHalf: .05,
		lineHalf: .02,
		bevelWidth: .045,
		pictureCells: 6,
		detailCells: 48,
		grainCells: 192,
		pieceVariation: .06,
		pictureTone: .55,
		pictureRange: .35,
		detailTone: .08,
		lineTone: .1,
		grainTone: .03,
		pieceHeight: .6,
		lineHeight: .3,
		bevelDrop: .08,
		pieceRoughness: .5,
		lineRoughness: .8,
		lineAO: .5
	}),
	ramennoodles: Object.freeze({
		dark: [
			150,
			108,
			40
		],
		light: [
			250,
			228,
			150
		],
		roughness: .42,
		relief: .01,
		strands: 22,
		harmonics: [
			3,
			4,
			5
		],
		amplitude: .085,
		halfWidth: .026,
		edgeSoft: .004,
		brothCells: 128,
		grainCells: 192,
		strandTone: .74,
		shadeTone: .28,
		toneJitter: .06,
		brothTone: .18,
		grainTone: .04,
		brothHeight: .08,
		strandHeight: .62,
		roundness: .28,
		brothRoughness: .2,
		contactAO: .55
	}),
	connectfourboard: Object.freeze({
		dark: [
			8,
			12,
			64
		],
		light: [
			238,
			242,
			255
		],
		roughness: .34,
		relief: .004,
		columns: 7,
		rows: 6,
		movesMin: 18,
		movesMax: 30,
		discRadius: .4,
		holeRadius: .42,
		ringRadius: .26,
		ringHalf: .035,
		edgeSoft: .03,
		grainCells: 192,
		frameTone: .3,
		trayTone: .14,
		holeTone: .02,
		redTone: .46,
		yellowTone: .96,
		ringShade: .08,
		grainTone: .03,
		frameHeight: .62,
		holeHeight: .12,
		discHeight: .4,
		discRise: .1,
		trayHeight: .5,
		discRoughness: .28,
		frameRoughness: .4,
		holeAO: .5
	}),
	bingocard: Object.freeze({
		dark: [
			28,
			26,
			40
		],
		light: [
			248,
			242,
			226
		],
		roughness: .7,
		relief: .0014,
		cells: 6,
		cardColumns: 5,
		pixel: .09,
		lineHalf: .02,
		outerHalf: .04,
		ringRadius: .45,
		ringHalf: .025,
		daubChance: .25,
		edgeSoft: .012,
		inkCells: 192,
		paperCells: 256,
		paperTone: .94,
		headerTone: .72,
		lineTone: .12,
		digitTone: .07,
		ringTone: .3,
		freeTone: .55,
		inkGain: .08,
		paperGrain: .04,
		inkHeight: .56,
		paperHeight: .3,
		inkRoughness: .44,
		paperRoughness: .76
	}),
	pegsolitaire: Object.freeze({
		dark: [
			30,
			16,
			8
		],
		light: [
			236,
			190,
			120
		],
		roughness: .48,
		relief: .004,
		size: 7,
		reverseMoves: 8,
		reverseAttempts: 400,
		holeRadius: .36,
		pegRadius: .31,
		shineRadius: .1,
		edgeSoft: .03,
		grainCellsU: 24,
		grainCellsV: 192,
		woodTone: .46,
		woodVariation: .1,
		holeTone: .04,
		pegTone: .92,
		shineTone: .12,
		rimTone: .3,
		woodHeight: .5,
		holeHeight: .08,
		pegHeight: .8,
		pegDome: .1,
		grainHeight: .03,
		woodRoughness: .55,
		pegRoughness: .28,
		holeAO: .45
	}),
	xylophonebars: Object.freeze({
		dark: [
			24,
			14,
			12
		],
		light: [
			226,
			170,
			110
		],
		roughness: .42,
		relief: .0035,
		bars: 12,
		longest: .9,
		semitoneRatio: .9715319411536059,
		barGap: .12,
		nodal: .224,
		holeRadius: .012,
		cordHalf: .0032,
		edgeSoft: .003,
		grainCellsU: 12,
		grainCellsV: 192,
		feltCells: 192,
		barTone: .55,
		barSlope: .16,
		holeTone: .03,
		cordTone: .82,
		feltTone: .1,
		grainTone: .07,
		barHeight: .62,
		feltHeight: .1,
		cordHeight: .7,
		barRoughness: .34,
		feltRoughness: .9,
		shadowAO: .55
	}),
	sliderulescale: Object.freeze({
		dark: [
			20,
			20,
			16
		],
		light: [
			246,
			238,
			196
		],
		roughness: .46,
		relief: .002,
		strips: 8,
		longLength: .36,
		mediumLength: .26,
		shortLength: .17,
		tickStart: .07,
		tickHalf: 9e-4,
		longTickScale: 1.6,
		digitPixel: .0042,
		digitLeft: .0045,
		digitTop: .5,
		edgeLine: .03,
		edgeSoft: 7e-4,
		inkCells: 192,
		grainCells: 256,
		baseTone: .92,
		inkTone: .05,
		inkGain: .06,
		grainTone: .04,
		inkHeight: .56,
		baseHeight: .3,
		inkRoughness: .4,
		baseRoughness: .5
	}),
	spirographrosettes: Object.freeze({
		dark: [
			18,
			22,
			44
		],
		light: [
			244,
			240,
			226
		],
		roughness: .62,
		relief: .0012,
		maskSize: 640,
		gears: [
			[5, 3],
			[8, 3],
			[7, 2],
			[9, 4]
		],
		outerRadius: .215,
		penOffset: .55,
		penJitter: .18,
		pointsPerLoop: 9e3,
		lineHalf: 1.1,
		paperTone: .94,
		inkTone: .14,
		inkStep: .2,
		grainCells: 256,
		grainTone: .035,
		inkHeight: .55,
		paperHeight: .32,
		inkRoughness: .4,
		paperRoughness: .7
	}),
	juliacells: Object.freeze({
		dark: [
			6,
			8,
			28
		],
		light: [
			246,
			224,
			176
		],
		roughness: .5,
		relief: .0035,
		centers: [
			-.4,
			-.75,
			-1,
			-1.25
		],
		centerJitter: .04,
		viewRadius: 2,
		bailout: 2,
		maxIterations: 96,
		glowScale: 9,
		insideTone: .02,
		glowTone: .97,
		insideHeight: .15,
		glowHeight: .85,
		insideRoughness: .8,
		glowRoughness: .35
	}),
	nonogrampuzzle: Object.freeze({
		dark: [
			22,
			24,
			34
		],
		light: [
			248,
			246,
			238
		],
		roughness: .58,
		relief: .0016,
		size: 8,
		clueCells: 4,
		density: .55,
		digitPixel: .115,
		fillInset: .09,
		lineHalf: .012,
		groupLineHalf: .03,
		groupEvery: 5,
		edgeSoft: .012,
		grainCells: 192,
		paperTone: .95,
		inkTone: .1,
		gridTone: .55,
		clueTone: .12,
		clueBackTone: .86,
		grainTone: .035,
		inkHeight: .6,
		paperHeight: .3,
		clueHeight: .34,
		inkRoughness: .4,
		paperRoughness: .72
	}),
	lightsoutboard: Object.freeze({
		dark: [
			10,
			10,
			14
		],
		light: [
			255,
			214,
			120
		],
		roughness: .3,
		relief: .003,
		size: 5,
		pressDensity: .4,
		inset: .07,
		corner: .2,
		edgeSoft: .02,
		grainCells: 160,
		frameTone: .05,
		offTone: .16,
		onTone: .78,
		glowTone: .2,
		shineTone: .12,
		grainTone: .02,
		frameHeight: .15,
		buttonHeight: .7,
		onRaise: .06,
		domeDrop: .1,
		frameRoughness: .75,
		offRoughness: .45,
		onRoughness: .2,
		gapAO: .5
	}),
	weavingdraft: Object.freeze({
		dark: [
			20,
			24,
			40
		],
		light: [
			250,
			244,
			226
		],
		roughness: .62,
		relief: .0018,
		width: 12,
		shafts: 4,
		treadles: 4,
		markInset: .14,
		cellInset: .04,
		lineHalf: .025,
		edgeSoft: .02,
		grainCells: 192,
		paperTone: .95,
		gridTone: .62,
		markTone: .1,
		warpTone: .16,
		weftTone: .86,
		grainTone: .03,
		markHeight: .6,
		warpHeight: .55,
		weftHeight: .38,
		paperHeight: .3,
		markRoughness: .4,
		warpRoughness: .55,
		paperRoughness: .72
	}),
	scrambledcubenet: Object.freeze({
		dark: [
			12,
			12,
			16
		],
		light: [
			250,
			244,
			232
		],
		roughness: .38,
		relief: .0028,
		cells: 14,
		netOffsetX: 1,
		netOffsetY: 2,
		moves: 22,
		inset: .07,
		corner: .16,
		edgeSoft: .03,
		grainCells: 192,
		tones: [
			.24,
			.36,
			.5,
			.64,
			.79,
			.95
		],
		bodyTone: .04,
		paperTone: .9,
		grainTone: .02,
		stickerHeight: .62,
		bodyHeight: .3,
		paperHeight: .2,
		stickerRoughness: .3,
		bodyRoughness: .6,
		paperRoughness: .75
	}),
	knightstour: Object.freeze({
		dark: [
			28,
			22,
			18
		],
		light: [
			240,
			226,
			196
		],
		roughness: .55,
		relief: .0022,
		size: 8,
		nodeBudget: 4e4,
		attempts: 60,
		digitPixel: .0125,
		digitGap: .0125,
		lineHalf: .0035,
		edgeSoft: .0015,
		grainCells: 192,
		lightSquare: .88,
		darkSquare: .6,
		lineTone: .52,
		inkTone: .08,
		grainTone: .025,
		inkHeight: .6,
		lineHeight: .45,
		squareHeight: .3,
		darkSquareHeight: .26,
		inkRoughness: .4,
		squareRoughness: .62
	}),
	graycodediscs: Object.freeze({
		dark: [
			14,
			16,
			20
		],
		light: [
			236,
			238,
			232
		],
		roughness: .42,
		relief: .0028,
		bits: [
			3,
			4,
			5,
			6
		],
		discRadius: .235,
		trackOuter: .2,
		trackInner: .07,
		holeRadius: .032,
		tickHalf: .0016,
		edgeSoft: .003,
		grainCells: 192,
		matTone: .32,
		bodyTone: .5,
		slotTone: .93,
		blockTone: .12,
		holeTone: .04,
		grainTone: .03,
		matHeight: .15,
		bodyHeight: .6,
		slotHeight: .35,
		blockHeight: .6,
		matRoughness: .8,
		bodyRoughness: .35,
		slotRoughness: .7
	}),
	code39barcodes: Object.freeze({
		dark: [
			12,
			12,
			14
		],
		light: [
			250,
			248,
			240
		],
		roughness: .55,
		relief: .0012,
		rows: 6,
		characters: 5,
		quietUnits: 10,
		unitCount: 132,
		wideRatio: 3,
		barHeight: .62,
		barSoft: .1,
		grainCells: 256,
		paperTone: .95,
		inkTone: .06,
		inkGain: .04,
		grainTone: .03,
		inkHeight: .55,
		paperHeight: .3,
		inkRoughness: .4,
		paperRoughness: .72
	}),
	amidakuji: Object.freeze({
		dark: [
			24,
			20,
			36
		],
		light: [
			250,
			244,
			226
		],
		roughness: .6,
		relief: .0016,
		columns: 8,
		levels: 10,
		rungChance: .45,
		labelBand: .1,
		lineHalf: .0042,
		rungHalf: .0042,
		digitPixel: .0095,
		edgeSoft: .0016,
		grainCells: 192,
		paperTone: .95,
		lineTone: .14,
		rungTone: .14,
		inkTone: .08,
		labelBackTone: .82,
		grainTone: .03,
		inkHeight: .58,
		paperHeight: .3,
		labelHeight: .36,
		inkRoughness: .4,
		paperRoughness: .72
	}),
	featherbarbs: Object.freeze({
		dark: [
			14,
			12,
			16
		],
		light: [
			236,
			228,
			212
		],
		roughness: .6,
		relief: .003,
		barbsPerTile: 48,
		slope: 1.3,
		reach: .21,
		reachVariation: .03,
		barbWidth: .55,
		barbSoft: .1,
		tipSoft: .004,
		shaftHalf: .0065,
		shaftSoft: .0015,
		grainCells: 192,
		barbToneInner: .78,
		barbToneOuter: .5,
		barbToneVariation: .12,
		shaftTone: .92,
		gapTone: .06,
		grainTone: .04,
		barbHeight: .6,
		gapHeight: .2,
		shaftHeight: .85,
		barbRoughness: .5,
		gapRoughness: .9,
		gapAO: .55
	}),
	dartboardsectors: Object.freeze({
		dark: [
			14,
			14,
			12
		],
		light: [
			238,
			228,
			196
		],
		roughness: .6,
		relief: .0028,
		order: [
			20,
			1,
			18,
			4,
			13,
			6,
			10,
			15,
			2,
			17,
			3,
			19,
			7,
			16,
			8,
			11,
			14,
			9,
			12,
			5
		],
		millimeters: .47 / 225,
		bull: 6.35,
		outerBull: 15.9,
		trebleInner: 99,
		trebleOuter: 107,
		doubleInner: 162,
		doubleOuter: 170,
		boardOuter: 225,
		numberRadius: 197,
		digitPixel: .0095,
		wireHalf: .0016,
		edgeSoft: .0012,
		grainCells: 256,
		matTone: .3,
		blackTone: .1,
		creamTone: .86,
		redTone: .34,
		greenTone: .58,
		wireTone: .97,
		numberTone: .93,
		ringTone: .06,
		grainTone: .04,
		matHeight: .15,
		faceHeight: .4,
		wireHeight: .72,
		digitHeight: .55,
		faceRoughness: .82,
		wireRoughness: .3,
		matRoughness: .9
	}),
	tictactoegames: Object.freeze({
		dark: [
			20,
			22,
			34
		],
		light: [
			250,
			246,
			232
		],
		roughness: .6,
		relief: .002,
		minPlies: 3,
		maxPlies: 9,
		markInset: .2,
		markHalf: .065,
		ringRadius: .29,
		ringHalf: .06,
		lineHalf: .022,
		edgeSoft: .02,
		grainCells: 192,
		paperTone: .95,
		lineTone: .4,
		crossTone: .1,
		noughtTone: .18,
		grainTone: .03,
		markHeight: .58,
		lineHeight: .4,
		paperHeight: .3,
		markRoughness: .4,
		paperRoughness: .72
	}),
	quasicrystalwaves: Object.freeze({
		dark: [
			10,
			12,
			36
		],
		light: [
			250,
			232,
			190
		],
		roughness: .5,
		relief: .003,
		vectors: [
			[6, 0],
			[2, 6],
			[-5, 4],
			[-5, -4],
			[2, -6]
		],
		gain: .7,
		heightGain: .9,
		glossRoughness: .3,
		roughnessSpan: .3
	}),
	tallymarks: Object.freeze({
		dark: [
			22,
			26,
			36
		],
		light: [
			244,
			240,
			226
		],
		roughness: .6,
		relief: .0016,
		rows: 8,
		minCount: 3,
		maxCount: 49,
		groupPitch: .072,
		strokePitch: .016,
		strokeStart: .012,
		strokeHalf: .0032,
		strikeHalf: .0034,
		strokeHeight: .62,
		strikeOverhang: .012,
		marksLeft: .03,
		digitLeft: .835,
		digitPixel: .0095,
		ruleHalf: .002,
		edgeSoft: .0014,
		grainCells: 192,
		jitterCells: 96,
		paperTone: .95,
		inkTone: .1,
		ruleTone: .62,
		inkJitter: .05,
		grainTone: .03,
		inkHeight: .58,
		ruleHeight: .38,
		paperHeight: .3,
		inkRoughness: .4,
		paperRoughness: .72
	}),
	polargraphpaper: Object.freeze({
		dark: [
			20,
			60,
			56
		],
		light: [
			244,
			248,
			240
		],
		roughness: .62,
		relief: .0012,
		rings: 12,
		ringSpacing: .04,
		spokes: 36,
		heavyEvery: 3,
		axisEvery: 9,
		thinHalf: .0011,
		heavyHalf: .0021,
		axisHalf: .0032,
		ringHeavyEvery: 5,
		edgeSoft: 9e-4,
		grainCells: 256,
		paperTone: .95,
		thinTone: .55,
		heavyTone: .36,
		axisTone: .2,
		grainTone: .03,
		lineHeight: .5,
		paperHeight: .3,
		lineRoughness: .45,
		paperRoughness: .74
	}),
	chesterfieldtufting: Object.freeze({
		dark: [
			26,
			8,
			6
		],
		light: [
			150,
			66,
			34
		],
		roughness: .45,
		relief: .02,
		period: 4,
		puff: .7,
		buttonRadius: .022,
		buttonRim: .006,
		edgeSoft: .004,
		grainCells: 256,
		wrinkleCells: 48,
		creaseTone: .1,
		faceTone: .62,
		faceGain: .34,
		buttonTone: .82,
		buttonShade: .25,
		wrinkleTone: .06,
		grainTone: .05,
		buttonHeight: .96,
		creaseHeight: .04,
		faceHeight: .8,
		faceRoughness: .42,
		creaseRoughness: .75,
		buttonRoughness: .18,
		creaseAO: .45
	}),
	louvershutter: Object.freeze({
		dark: [
			24,
			28,
			30
		],
		light: [
			226,
			232,
			224
		],
		roughness: .5,
		relief: .012,
		slats: 10,
		gap: .14,
		stile: .07,
		rodHalf: .012,
		pinRadius: .016,
		edgeSoft: .01,
		grainCells: 256,
		grainStretch: 12,
		faceTop: .88,
		faceBottom: .58,
		gapTone: .05,
		stileTone: .82,
		rodTone: .72,
		pinTone: .45,
		grainTone: .04,
		slatHeightTop: .78,
		slatHeightBottom: .52,
		stileHeight: .9,
		rodHeight: .96,
		gapHeight: .05,
		paintRoughness: .52,
		gapRoughness: .9,
		pinRoughness: .3,
		gapAO: .35
	}),
	ledgersheet: Object.freeze({
		dark: [
			24,
			30,
			44
		],
		light: [
			244,
			240,
			214
		],
		roughness: .62,
		relief: .0014,
		rows: 8,
		minAmount: 100,
		maxAmount: 999,
		indexLeft: .05,
		amountRight: .49,
		balanceRight: .94,
		digitPixel: .0105,
		ruleHalf: .0016,
		marginRule: .15,
		totalRule: .54,
		columnHalf: .0022,
		edgeSoft: .0013,
		grainCells: 256,
		jitterCells: 96,
		paperTone: .94,
		rowRuleTone: .66,
		columnRuleTone: .45,
		inkTone: .14,
		inkJitter: .05,
		grainTone: .03,
		inkHeight: .58,
		ruleHeight: .38,
		paperHeight: .3,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	sundialplate: Object.freeze({
		dark: [
			30,
			24,
			16
		],
		light: [
			214,
			176,
			108
		],
		roughness: .4,
		relief: .003,
		latitudeMin: 25,
		latitudeSpan: 30,
		plateRadius: .475,
		lineOuter: .385,
		lineInner: .03,
		labelRadius: .405,
		labelRadiusOuter: .447,
		ringRadii: [
			.2,
			.3,
			.385
		],
		digitPixel: .008,
		lineHalf: .0034,
		noonHalf: .0052,
		ringHalf: .0016,
		hubRadius: .014,
		edgeSoft: .0012,
		grainCells: 256,
		plateTone: .62,
		matTone: .28,
		inkTone: .08,
		hubTone: .9,
		grainTone: .06,
		inkHeight: .35,
		plateHeight: .55,
		hubHeight: .95,
		matHeight: .15,
		plateRoughness: .35,
		inkRoughness: .55,
		matRoughness: .85
	}),
	doubleslitfringes: Object.freeze({
		dark: [
			4,
			6,
			14
		],
		light: [
			252,
			240,
			200
		],
		roughness: .5,
		relief: .002,
		ratios: [
			2,
			3,
			4,
			5
		],
		fringesAcross: 16,
		gamma: .6,
		gapHalf: .004,
		edgeSoft: .0015,
		grainCells: 256,
		gapTone: .02,
		grainTone: .015,
		fringeRoughness: .55,
		gapRoughness: .85,
		gapHeight: .1
	}),
	fibonaccisquares: Object.freeze({
		dark: [
			20,
			28,
			40
		],
		light: [
			248,
			238,
			208
		],
		roughness: .55,
		relief: .0016,
		sizes: [
			1,
			1,
			2,
			3,
			5,
			8,
			13
		],
		unit: 1 / 24,
		lineHalf: .0032,
		arcHalf: .0042,
		edgeSoft: .0014,
		grainCells: 256,
		tones: [
			.26,
			.37,
			.48,
			.59,
			.7,
			.81,
			.91
		],
		paperTone: .99,
		lineTone: .1,
		arcTone: .06,
		grainTone: .03,
		lineHeight: .55,
		arcHeight: .7,
		faceHeight: .3,
		paperHeight: .2,
		lineRoughness: .4,
		paperRoughness: .74
	}),
	bluenoisemask: Object.freeze({
		dark: [
			6,
			8,
			14
		],
		light: [
			244,
			248,
			255
		],
		roughness: .55,
		relief: .002,
		size: 64,
		sigma: 1.5,
		kernelRadius: 5,
		initialFraction: .1,
		relaxLimit: 400,
		smoothing: 0,
		heightGain: 1,
		roughnessSpan: .3,
		roughnessBase: .4
	}),
	elementaryautomata: Object.freeze({
		dark: [
			10,
			16,
			30
		],
		light: [
			236,
			240,
			226
		],
		roughness: .55,
		relief: .0014,
		rules: [
			90,
			110,
			150,
			184
		],
		cells: 31,
		seedDensity: .12,
		inset: .08,
		panelLine: .004,
		edgeSoft: .02,
		grainCells: 192,
		paperTone: .95,
		deadTone: .85,
		liveTone: .1,
		lineTone: .4,
		grainTone: .03,
		liveHeight: .6,
		paperHeight: .3,
		lineHeight: .45,
		liveRoughness: .4,
		paperRoughness: .72
	}),
	mastermindboard: Object.freeze({
		dark: [
			30,
			18,
			10
		],
		light: [
			236,
			214,
			170
		],
		roughness: .45,
		relief: .004,
		columns: 6,
		rows: 9,
		pegCount: 4,
		colorCount: 6,
		holeRadius: .036,
		pegRadius: .032,
		smallHoleRadius: .014,
		smallPegRadius: .012,
		edgeSoft: .003,
		dividerHalf: .004,
		grainCells: 192,
		grainStretch: 10,
		boardTone: .42,
		boardVariation: .06,
		holeTone: .14,
		pegTones: [
			.34,
			.46,
			.58,
			.7,
			.82,
			.9
		],
		exactTone: .98,
		partialTone: .04,
		shineTone: .1,
		dividerTone: .2,
		boardHeight: .5,
		holeHeight: .15,
		pegHeight: .85,
		boardRoughness: .5,
		pegRoughness: .25,
		holeAO: .5
	}),
	wordsearchgrid: Object.freeze({
		dark: [
			24,
			28,
			44
		],
		light: [
			250,
			246,
			224
		],
		roughness: .62,
		relief: .0014,
		size: 12,
		alphabet: `ACDEGILMNORT`,
		words: [
			`CODE`,
			`TREE`,
			`GRID`,
			`MINT`,
			`TIDE`,
			`LION`,
			`DOOR`,
			`CLOT`,
			`RAIN`,
			`CELL`,
			`MOON`,
			`TIGER`,
			`ANGLE`,
			`CIRCLE`,
			`TRIANGLE`
		],
		wordCount: 5,
		attempts: 300,
		digitPixel: .0135,
		lineHalf: .0016,
		edgeSoft: .0013,
		grainCells: 192,
		jitterCells: 96,
		paperTone: .95,
		ruleTone: .78,
		inkTone: .12,
		inkJitter: .05,
		grainTone: .03,
		inkHeight: .58,
		ruleHeight: .36,
		paperHeight: .3,
		inkRoughness: .4,
		paperRoughness: .72
	}),
	magicsquares: Object.freeze({
		dark: [
			28,
			22,
			38
		],
		light: [
			246,
			238,
			214
		],
		roughness: .6,
		relief: .0014,
		orders: [
			3,
			4,
			5,
			7
		],
		margin: .02,
		digitFraction: .11,
		lineHalf: .0014,
		outerHalf: .0028,
		edgeSoft: .0013,
		grainCells: 192,
		jitterCells: 96,
		paperTone: .95,
		cellTone: .9,
		lineTone: .5,
		inkTone: .1,
		inkJitter: .05,
		grainTone: .03,
		inkHeight: .58,
		lineHeight: .4,
		paperHeight: .3,
		inkRoughness: .4,
		paperRoughness: .72
	}),
	slidingpuzzle: Object.freeze({
		dark: [
			30,
			24,
			20
		],
		light: [
			238,
			214,
			150
		],
		roughness: .5,
		relief: .004,
		size: 4,
		margin: .03,
		gap: .008,
		bevel: .014,
		shuffleMoves: 240,
		digitFraction: .1,
		edgeSoft: .0013,
		grainCells: 192,
		jitterCells: 96,
		frameTone: .2,
		holeTone: .08,
		gapTone: .1,
		faceTone: .8,
		inkTone: .1,
		inkJitter: .05,
		grainTone: .05,
		frameHeight: .62,
		holeHeight: .05,
		gapHeight: .2,
		faceHeight: .86,
		inkDepth: .06,
		faceRoughness: .42,
		frameRoughness: .68,
		holeRoughness: .9
	}),
	kaleidoscope: Object.freeze({
		dark: [
			18,
			20,
			44
		],
		light: [
			250,
			226,
			168
		],
		roughness: .34,
		relief: .002,
		folds: [
			6,
			8,
			5,
			12
		],
		blobs: 9,
		rimStart: .455,
		rimEnd: .485,
		edgeSoft: .012,
		ringFrequency: 14,
		ringAmplitude: .16,
		baseTone: .4,
		blobTones: [
			.12,
			.28,
			.5,
			.66,
			.82,
			.95
		],
		rimTone: .06,
		blobHeight: .62,
		baseHeight: .4,
		rimHeight: .2,
		roughnessBase: .4,
		roughnessBlob: .26
	}),
	oghaminscription: Object.freeze({
		dark: [
			38,
			40,
			38
		],
		light: [
			190,
			188,
			174
		],
		roughness: .86,
		relief: .006,
		rows: 8,
		cellsPerRow: 6,
		alphabet: `BLFSNHDTCQMGXZRAOUEI`,
		words: [
			`BETH`,
			`LUIS`,
			`FEARN`,
			`SAILLE`,
			`NION`,
			`UATH`,
			`DUIR`,
			`TINNE`,
			`COLL`,
			`CERT`,
			`GORT`,
			`RUIS`,
			`AILM`,
			`ONN`,
			`EADHA`,
			`IDHO`
		],
		strokePitch: .024,
		strokeHalf: .003,
		strokeReach: .042,
		stemHalf: .0021,
		slant: .4,
		notchHalfLength: .01,
		notchHalfWidth: .006,
		edgeSoft: .0011,
		grainCells: 160,
		coarseCells: 40,
		stoneTone: .58,
		grainTone: .16,
		coarseTone: .14,
		carveTone: .16,
		stoneHeight: .7,
		carveHeight: .18,
		heightGrain: .1,
		stoneRoughness: .88,
		carveRoughness: .74
	}),
	gameoflife: Object.freeze({
		dark: [
			8,
			22,
			20
		],
		light: [
			150,
			255,
			190
		],
		roughness: .46,
		relief: .004,
		size: 20,
		density: .36,
		burnIn: 10,
		margin: .02,
		inset: .14,
		lineHalf: 7e-4,
		frameHalf: .0026,
		edgeSoft: .0011,
		grainCells: 160,
		deadTone: .1,
		lineTone: .2,
		liveTone: .9,
		frameTone: .5,
		paperTone: .04,
		grainTone: .03,
		liveHeight: .8,
		deadHeight: .3,
		lineHeight: .22,
		frameHeight: .5,
		paperHeight: .12,
		liveRoughness: .3,
		deadRoughness: .62
	}),
	pascalmodulo: Object.freeze({
		dark: [
			18,
			12,
			40
		],
		light: [
			255,
			222,
			120
		],
		roughness: .5,
		relief: .003,
		moduli: [
			2,
			3,
			4,
			5
		],
		rows: 32,
		margin: .015,
		gap: 9e-4,
		edgeSoft: 9e-4,
		grainCells: 192,
		emptyTone: .04,
		lowTone: .2,
		highTone: .94,
		frameTone: .5,
		frameHalf: .0022,
		grainTone: .03,
		tileHeight: .7,
		emptyHeight: .15,
		frameHeight: .4,
		heightStep: .12,
		tileRoughness: .34,
		emptyRoughness: .8
	}),
	dragoncurve: Object.freeze({
		dark: [
			14,
			10,
			30
		],
		light: [
			255,
			170,
			60
		],
		roughness: .4,
		relief: .003,
		order: 11,
		margin: .04,
		lineHalf: .17,
		edgeSoft: .07,
		grainCells: 192,
		backgroundTone: .05,
		startTone: .42,
		endTone: .96,
		grainTone: .03,
		lineHeight: .75,
		backgroundHeight: .15,
		lineRoughness: .32,
		backgroundRoughness: .82
	}),
	cantordust: Object.freeze({
		dark: [
			10,
			16,
			28
		],
		light: [
			120,
			235,
			255
		],
		roughness: .44,
		relief: .003,
		rows: 6,
		barDigits: 5,
		dustDigits: 3,
		margin: .03,
		barFill: .6,
		dustSide: .44,
		edgeSoft: 9e-4,
		grainCells: 192,
		backgroundTone: .05,
		guideTone: .12,
		firstTone: .42,
		lastTone: .92,
		dustTone: .9,
		grainTone: .03,
		barHeight: .7,
		backgroundHeight: .15,
		guideHeight: .25,
		barRoughness: .34,
		backgroundRoughness: .82
	}),
	eightqueens: Object.freeze({
		dark: [
			34,
			22,
			14
		],
		light: [
			244,
			226,
			190
		],
		roughness: .5,
		relief: .004,
		size: 8,
		margin: .02,
		frameHalf: .0035,
		queenRadius: .22,
		crownHalf: .3,
		spikes: 3,
		edgeSoft: .0012,
		grainCells: 192,
		lightSquare: .74,
		darkSquare: .3,
		frameTone: .12,
		queenTone: .97,
		paperTone: .06,
		grainTone: .04,
		squareHeight: .4,
		queenHeight: .88,
		frameHeight: .6,
		paperHeight: .15,
		squareRoughness: .58,
		queenRoughness: .28
	}),
	hanoitowers: Object.freeze({
		dark: [
			40,
			28,
			18
		],
		light: [
			236,
			204,
			150
		],
		roughness: .5,
		relief: .006,
		disks: 6,
		margin: .02,
		minWidth: .08,
		widthStep: .044,
		diskHeight: .062,
		diskGap: .006,
		baseY: .88,
		pegHalf: .012,
		pegTop: .2,
		baseHalf: .03,
		frameHalf: .003,
		edgeSoft: .0012,
		grainCells: 192,
		woodCells: 24,
		boardTone: .18,
		pegTone: .42,
		baseTone: .3,
		diskLow: .38,
		diskHigh: .96,
		frameTone: .1,
		grainTone: .05,
		boardHeight: .25,
		pegHeight: .7,
		baseHeight: .5,
		diskHeightLevel: .82,
		frameHeight: .4,
		woodRoughness: .62,
		diskRoughness: .34
	}),
	latinsquares: Object.freeze({
		dark: [
			20,
			18,
			40
		],
		light: [
			255,
			214,
			130
		],
		roughness: .5,
		relief: .003,
		orders: [
			5,
			6,
			7,
			8
		],
		margin: .02,
		gap: .0016,
		frameHalf: .0028,
		edgeSoft: .0011,
		grainCells: 192,
		lowTone: .16,
		highTone: .96,
		frameTone: .5,
		paperTone: .05,
		grainTone: .03,
		cellHeight: .7,
		heightStep: .12,
		frameHeight: .4,
		paperHeight: .15,
		cellRoughness: .34,
		paperRoughness: .8
	}),
	mayansums: Object.freeze({
		dark: [
			34,
			40,
			30
		],
		light: [
			196,
			190,
			160
		],
		roughness: .86,
		relief: .006,
		left: .03,
		cellWidth: .11,
		cellHeight: .2,
		signWidth: .045,
		topY: .04,
		rowGap: .02,
		levelHeight: .045,
		barHalfWidth: .05,
		barHalfHeight: .017,
		dotRadius: .011,
		dotPitch: .025,
		shellRadiusX: .05,
		shellRadiusY: .03,
		shellWall: .007,
		minimum: 10,
		maximum: 199,
		edgeSoft: .0011,
		grainCells: 160,
		coarseCells: 36,
		stoneTone: .62,
		grainTone: .15,
		coarseTone: .14,
		carveTone: .2,
		signStrength: .75,
		stoneHeight: .7,
		carveHeight: .2,
		heightGrain: .1,
		stoneRoughness: .88,
		carveRoughness: .74
	}),
	sortingnetworks: Object.freeze({
		dark: [
			8,
			12,
			30
		],
		light: [
			120,
			255,
			200
		],
		roughness: .42,
		relief: .003,
		wires: 8,
		margin: .03,
		wireHalf: .0014,
		barHalf: .0022,
		dotRadius: .0062,
		frameHalf: .0022,
		edgeSoft: .0011,
		grainCells: 192,
		backgroundTone: .06,
		panelTone: .1,
		wireTone: .42,
		barTone: .96,
		frameTone: .3,
		grainTone: .03,
		wireHeight: .35,
		barHeight: .8,
		panelHeight: .2,
		backgroundHeight: .12,
		frameHeight: .4,
		barRoughness: .3,
		panelRoughness: .75
	}),
	primesieve: Object.freeze({
		dark: [
			16,
			14,
			36
		],
		light: [
			255,
			230,
			120
		],
		roughness: .46,
		relief: .004,
		size: 16,
		firstMax: 744,
		margin: .02,
		gap: .0022,
		cornerRadius: .004,
		edgeSoft: .0011,
		grainCells: 192,
		gapTone: .05,
		oneTone: .08,
		primeTone: .98,
		factorTones: [
			.3,
			.42,
			.54,
			.66,
			.8
		],
		grainTone: .03,
		gapHeight: .12,
		oneHeight: .2,
		compositeHeight: .4,
		primeHeight: .85,
		primeRoughness: .28,
		otherRoughness: .55
	}),
	knockoutbracket: Object.freeze({
		dark: [
			12,
			18,
			40
		],
		light: [
			240,
			232,
			200
		],
		roughness: .52,
		relief: .004,
		teams: 16,
		left: .035,
		columnPitch: .19,
		boxWidth: .075,
		boxHeight: .046,
		topMargin: .03,
		pixel: .0072,
		lineHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .07,
		boxTone: .82,
		finalTone: .97,
		lineTone: .45,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .15,
		levelHeight: .6,
		finalHeight: .85,
		lineHeight: .35,
		inkDepth: .08,
		boxRoughness: .4,
		paperRoughness: .8
	}),
	skyscraperpuzzles: Object.freeze({
		dark: [
			24,
			22,
			36
		],
		light: [
			244,
			236,
			214
		],
		roughness: .55,
		relief: .004,
		orders: [
			4,
			5,
			6,
			7
		],
		margin: .012,
		digitFraction: .18,
		lineHalf: 7e-4,
		outerHalf: .0022,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		clueTone: .78,
		cellTone: .9,
		towerStep: .018,
		lineTone: .45,
		inkTone: .1,
		grainTone: .03,
		cellHeight: .5,
		clueHeight: .35,
		lineHeight: .3,
		paperHeight: .25,
		towerRise: .03,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	pianoroll: Object.freeze({
		dark: [
			14,
			16,
			34
		],
		light: [
			120,
			220,
			255
		],
		roughness: .46,
		relief: .004,
		pitches: 24,
		steps: 32,
		top: .02,
		bottom: .02,
		keyWidth: .075,
		rollLeft: .085,
		rollRight: .015,
		noteInset: .006,
		lineHalf: 5e-4,
		beatHalf: 9e-4,
		edgeSoft: .0011,
		grainCells: 192,
		whiteRowTone: .17,
		blackRowTone: .09,
		whiteKeyTone: .94,
		blackKeyTone: .08,
		lineTone: .26,
		beatTone: .34,
		noteLow: .62,
		noteHigh: .98,
		grainTone: .03,
		rowHeight: .2,
		blackRowHeight: .12,
		keyHeight: .55,
		blackKeyHeight: .8,
		noteHeight: .7,
		lineHeight: .28,
		noteRoughness: .3,
		otherRoughness: .7
	}),
	binaryclock: Object.freeze({
		dark: [
			6,
			10,
			24
		],
		light: [
			90,
			255,
			170
		],
		roughness: .4,
		relief: .004,
		columns: 6,
		bits: 4,
		margin: .02,
		padding: .035,
		dotRadius: .02,
		frameHalf: .0028,
		edgeSoft: .0011,
		grainCells: 192,
		maxStart: 86399,
		backgroundTone: .05,
		panelTone: .09,
		offTone: .16,
		onTone: .97,
		ringTone: .3,
		frameTone: .42,
		grainTone: .03,
		panelHeight: .2,
		offHeight: .12,
		onHeight: .85,
		frameHeight: .4,
		backgroundHeight: .1,
		onRoughness: .26,
		panelRoughness: .78
	}),
	othelloboard: Object.freeze({
		dark: [
			6,
			40,
			24
		],
		light: [
			230,
			244,
			236
		],
		roughness: .5,
		relief: .004,
		size: 8,
		margin: .025,
		startPlies: 14,
		extraPlies: 18,
		lineHalf: .0012,
		frameHalf: .004,
		discRadius: .4,
		rimWidth: .05,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .05,
		feltTone: .36,
		lineTone: .15,
		frameTone: .12,
		blackTone: .07,
		whiteTone: .95,
		rimTone: .5,
		rimStrength: .5,
		grainTone: .04,
		paperHeight: .12,
		feltHeight: .3,
		lineHeight: .22,
		frameHeight: .5,
		discHeight: .82,
		discRoughness: .28,
		feltRoughness: .82
	}),
	goboards: Object.freeze({
		dark: [
			30,
			20,
			10
		],
		light: [
			226,
			178,
			104
		],
		roughness: .5,
		relief: .004,
		size: 9,
		moves: [
			16,
			28,
			42,
			58
		],
		margin: .02,
		lineHalf: .0011,
		frameHalf: .004,
		starRadius: .1,
		stoneRadius: .46,
		edgeSoft: .0011,
		grainCells: 192,
		woodCells: 20,
		paperTone: .07,
		boardTone: .5,
		lineTone: .12,
		frameTone: .2,
		blackTone: .05,
		whiteTone: .96,
		rimTone: .4,
		rimStrength: .4,
		rimWidth: .06,
		grainTone: .05,
		woodTone: .07,
		paperHeight: .12,
		boardHeight: .35,
		lineHeight: .28,
		frameHeight: .55,
		stoneHeight: .85,
		stoneRoughness: .26,
		boardRoughness: .58
	}),
	dewbeads: Object.freeze({
		dark: [
			10,
			38,
			18
		],
		light: [
			190,
			235,
			200
		],
		roughness: .34,
		relief: .008,
		cells: 12,
		coverage: .62,
		minRadius: .014,
		maxRadius: .028,
		jitter: .0117,
		veinCount: 12,
		veinHalf: .0016,
		mottleCells: 40,
		edgeSoft: 8e-4,
		leafTone: .3,
		mottleTone: .1,
		veinTone: .2,
		centreTone: .62,
		rimTone: .18,
		glintTone: .99,
		glintSize: .2,
		leafHeight: .28,
		mottleHeight: .04,
		veinHeight: .34,
		domeHeight: .62,
		leafRoughness: .62,
		dropRoughness: .1
	}),
	bowlingscoresheet: Object.freeze({
		dark: [
			26,
			24,
			36
		],
		light: [
			248,
			242,
			222
		],
		roughness: .58,
		relief: .003,
		games: 4,
		frames: 10,
		left: .04,
		top: .03,
		rowHeight: .24,
		frameWidth: .088,
		lastFrameWidth: .12,
		boxWidth: .03,
		boxHeight: .05,
		pixel: .0058,
		scorePixel: .0072,
		strikeChance: .3,
		spareChance: .3,
		lineHalf: 7e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		boxTone: .86,
		lineTone: .45,
		inkTone: .1,
		grainTone: .03,
		paperHeight: .25,
		boxLevel: .4,
		lineHeight: .3,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	hexresourceboard: Object.freeze({
		dark: [
			12,
			30,
			52
		],
		light: [
			240,
			226,
			170
		],
		roughness: .5,
		relief: .005,
		radius: .088,
		resources: [
			4,
			3,
			4,
			4,
			3,
			1
		],
		numbers: [
			2,
			3,
			3,
			4,
			4,
			5,
			5,
			6,
			6,
			8,
			8,
			9,
			9,
			10,
			10,
			11,
			11,
			12
		],
		attempts: 400,
		gap: .003,
		tokenRadius: .034,
		pixel: .0066,
		edgeSoft: .0011,
		grainCells: 192,
		waveCells: 28,
		seaTone: .1,
		waveTone: .05,
		resourceTones: [
			.26,
			.4,
			.54,
			.7,
			.84,
			.97
		],
		tokenTone: .94,
		inkTone: .08,
		grainTone: .04,
		seaHeight: .1,
		tileHeight: .55,
		tokenHeight: .8,
		inkDepth: .06,
		tileRoughness: .5,
		seaRoughness: .3,
		tokenRoughness: .36
	}),
	kakuropuzzle: Object.freeze({
		dark: [
			18,
			20,
			34
		],
		light: [
			244,
			238,
			216
		],
		roughness: .56,
		relief: .004,
		size: 8,
		margin: .03,
		minBlocks: 6,
		maxBlocks: 9,
		attempts: 6e3,
		digitFraction: .12,
		cluePixel: .0064,
		lineHalf: 8e-4,
		diagonalHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .9,
		blockTone: .1,
		clueTone: .88,
		diagonalTone: .55,
		lineTone: .4,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		blockHeight: .3,
		lineHeight: .35,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	hashibridges: Object.freeze({
		dark: [
			20,
			24,
			40
		],
		light: [
			244,
			240,
			224
		],
		roughness: .55,
		relief: .004,
		size: 9,
		islands: 15,
		attempts: 400,
		doubleChance: .4,
		extraChance: .3,
		margin: .05,
		islandRadius: .035,
		ringHalf: .0022,
		bridgeHalf: .0017,
		doubleOffset: .008,
		pixel: .0078,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .93,
		islandTone: .86,
		inkTone: .1,
		gridTone: .8,
		gridHalf: 6e-4,
		grainTone: .03,
		paperHeight: .2,
		islandHeight: .55,
		bridgeHeight: .4,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	slitherlinkloop: Object.freeze({
		dark: [
			16,
			22,
			44
		],
		light: [
			250,
			238,
			200
		],
		roughness: .52,
		relief: .004,
		size: 7,
		fill: .55,
		attempts: 800,
		margin: .045,
		dotRadius: .0075,
		loopHalf: .0055,
		pixel: .0125,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .93,
		dotTone: .3,
		loopTone: .1,
		numberTone: .28,
		insideTone: .86,
		grainTone: .03,
		paperHeight: .22,
		insideHeight: .3,
		loopHeight: .62,
		dotHeight: .5,
		inkDepth: .05,
		loopRoughness: .36,
		paperRoughness: .74
	}),
	masyupearls: Object.freeze({
		dark: [
			14,
			18,
			34
		],
		light: [
			244,
			236,
			214
		],
		roughness: .5,
		relief: .004,
		size: 7,
		fill: .55,
		attempts: 800,
		pearlChance: .4,
		minPearls: 5,
		margin: .06,
		dotRadius: .0065,
		loopHalf: .0026,
		pearlRadius: .026,
		ringHalf: .0028,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .93,
		dotTone: .4,
		loopTone: .12,
		whiteTone: .97,
		blackTone: .06,
		grainTone: .03,
		paperHeight: .22,
		loopHeight: .5,
		dotHeight: .4,
		whiteHeight: .62,
		blackHeight: .8,
		pearlRoughness: .24,
		paperRoughness: .74
	}),
	stringartcurves: Object.freeze({
		dark: [
			10,
			12,
			30
		],
		light: [
			255,
			210,
			120
		],
		roughness: .4,
		relief: .003,
		multipliers: [
			2,
			3,
			4,
			5
		],
		points: 96,
		radius: .225,
		lineHalf: .0011,
		ringHalf: .0016,
		gain: 1.6,
		edgeSoft: 9e-4,
		grainCells: 192,
		backgroundTone: .05,
		ringTone: .5,
		lineTone: .98,
		grainTone: .03,
		backgroundHeight: .12,
		lineHeight: .8,
		ringHeight: .5,
		lineRoughness: .28,
		backgroundRoughness: .8
	}),
	fillominoregions: Object.freeze({
		dark: [
			26,
			22,
			40
		],
		light: [
			246,
			238,
			214
		],
		roughness: .55,
		relief: .004,
		size: 9,
		maxTarget: 5,
		maxSize: 9,
		attempts: 400,
		margin: .04,
		digitFraction: .13,
		thinHalf: 7e-4,
		thickHalf: .0034,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .9,
		shadeStep: .018,
		thinTone: .62,
		thickTone: .1,
		inkTone: .1,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	futoshikigrid: Object.freeze({
		dark: [
			22,
			24,
			44
		],
		light: [
			248,
			240,
			216
		],
		roughness: .55,
		relief: .004,
		size: 5,
		signChance: .55,
		margin: .035,
		cellSize: .15,
		gap: .045,
		digitFraction: .14,
		signReach: .011,
		signHalf: .0022,
		frameHalf: .0015,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .9,
		frameTone: .35,
		inkTone: .1,
		signTone: .12,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		frameHeight: .35,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	nurikabeislands: Object.freeze({
		dark: [
			12,
			28,
			54
		],
		light: [
			244,
			240,
			224
		],
		roughness: .55,
		relief: .004,
		size: 8,
		minIslands: 4,
		extraIslands: 3,
		maxTarget: 5,
		maxSize: 9,
		attempts: 4e3,
		margin: .04,
		digitFraction: .13,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		waveCells: 36,
		islandTone: .94,
		seaTone: .12,
		waveTone: .06,
		lineTone: .5,
		inkTone: .08,
		grainTone: .03,
		islandHeight: .6,
		seaHeight: .18,
		inkDepth: .06,
		inkRoughness: .4,
		islandRoughness: .7,
		seaRoughness: .3
	}),
	tentsandtrees: Object.freeze({
		dark: [
			18,
			40,
			26
		],
		light: [
			236,
			242,
			214
		],
		roughness: .6,
		relief: .004,
		size: 8,
		targetTents: 17,
		margin: .05,
		digitFraction: .11,
		lineHalf: 7e-4,
		edgeSoft: .0011,
		grainCells: 160,
		canopyRadius: .28,
		trunkHalf: .055,
		tentApex: .18,
		tentBase: .82,
		tentHalf: .36,
		grassTone: .88,
		clueTone: .94,
		lineTone: .55,
		treeTone: .14,
		tentTone: .3,
		inkTone: .08,
		grainTone: .05,
		clueHeight: .2,
		grassHeight: .42,
		treeHeight: .85,
		tentHeight: .65,
		inkDepth: .06,
		inkRoughness: .4,
		grassRoughness: .85,
		solidRoughness: .55
	}),
	shikakurects: Object.freeze({
		dark: [
			30,
			22,
			44
		],
		light: [
			250,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		size: 10,
		maxArea: 9,
		stopChance: .4,
		margin: .05,
		digitFraction: .12,
		thinHalf: 7e-4,
		thickHalf: .0034,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .9,
		tintRange: .08,
		thinTone: .62,
		thickTone: .1,
		inkTone: .1,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	hitorishading: Object.freeze({
		dark: [
			20,
			20,
			28
		],
		light: [
			244,
			238,
			224
		],
		roughness: .55,
		relief: .004,
		size: 7,
		targetShaded: 13,
		margin: .05,
		digitFraction: .14,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .92,
		shadeTone: .12,
		shadeGlyphTone: .88,
		lineTone: .55,
		inkTone: .1,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		shadeHeight: .8,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74,
		shadeRoughness: .35
	}),
	akarilights: Object.freeze({
		dark: [
			18,
			18,
			30
		],
		light: [
			250,
			244,
			214
		],
		roughness: .5,
		relief: .004,
		size: 8,
		blackChance: .26,
		clueChance: .6,
		margin: .05,
		digitFraction: .14,
		bulbRadius: .28,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .92,
		blackTone: .1,
		clueTone: .9,
		bulbTone: .2,
		lineTone: .5,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		blackHeight: .85,
		bulbHeight: .7,
		inkDepth: .06,
		bulbRoughness: .3,
		blackRoughness: .35,
		paperRoughness: .74,
		clueRoughness: .4
	}),
	takuzugrid: Object.freeze({
		dark: [
			18,
			30,
			52
		],
		light: [
			244,
			240,
			222
		],
		roughness: .55,
		relief: .004,
		size: 8,
		nodeLimit: 1e5,
		margin: .05,
		discRadius: .3,
		ringWidth: .1,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .92,
		lineTone: .55,
		discTone: .1,
		ringTone: .12,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		discHeight: .85,
		ringHeight: .7,
		discRoughness: .3,
		ringRoughness: .4,
		paperRoughness: .74
	}),
	kenkencages: Object.freeze({
		dark: [
			24,
			20,
			44
		],
		light: [
			250,
			242,
			218
		],
		roughness: .55,
		relief: .004,
		size: 4,
		maxCage: 3,
		margin: .1,
		digitFraction: .12,
		labelFraction: .05,
		labelX: .07,
		labelY: .06,
		digitY: .62,
		thinHalf: 8e-4,
		thickHalf: .0036,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .92,
		tintRange: .06,
		thinTone: .62,
		thickTone: .1,
		inkTone: .1,
		labelTone: .2,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74
	}),
	numberlinkpaths: Object.freeze({
		dark: [
			22,
			28,
			50
		],
		light: [
			246,
			242,
			224
		],
		roughness: .5,
		relief: .004,
		size: 6,
		flips: 600,
		minPaths: 6,
		extraPaths: 3,
		margin: .05,
		strokeHalf: .11,
		discRadius: .36,
		digitFraction: .1,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .92,
		lineTone: .6,
		strokeBase: .12,
		strokeRange: .3,
		discTone: .08,
		digitTone: .92,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		strokeHeight: .72,
		discHeight: .9,
		digitDepth: .06,
		strokeRoughness: .35,
		paperRoughness: .74
	}),
	rushhourjam: Object.freeze({
		dark: [
			30,
			26,
			46
		],
		light: [
			244,
			238,
			220
		],
		roughness: .5,
		relief: .004,
		size: 6,
		exitRow: 2,
		vehicles: 11,
		attempts: 600,
		margin: .12,
		wall: .03,
		inset: .07,
		corner: .2,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .9,
		lineTone: .62,
		wallTone: .12,
		carBase: .34,
		carRange: .36,
		targetTone: .08,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .4,
		wallHeight: .9,
		carHeight: .7,
		wallRoughness: .35,
		carRoughness: .28,
		paperRoughness: .74
	}),
	mancalaboard: Object.freeze({
		dark: [
			34,
			20,
			12
		],
		light: [
			236,
			214,
			170
		],
		roughness: .5,
		relief: .006,
		pits: 6,
		stones: 48,
		pitCapacity: 12,
		storeCapacity: 24,
		boardLeft: .03,
		boardRight: .97,
		boardTop: .2,
		boardBottom: .8,
		boardCorner: .06,
		pitStart: .23,
		pitPitch: .108,
		pitRows: [.36, .64],
		pitRadius: .055,
		storeCenters: [.1, .9],
		storeHalfWidth: .06,
		storeHalfHeight: .2,
		stoneRadius: .0125,
		slotPitch: .023,
		pitSlotColumns: 3,
		storeSlotColumns: 4,
		edgeSoft: .0011,
		grainCells: 160,
		grainStretch: 6,
		tableTone: .82,
		boardTone: .55,
		pitTone: .2,
		stoneTone: .96,
		grainTone: .07,
		tableHeight: .1,
		boardHeight: .6,
		pitHeight: .3,
		stoneHeight: .88,
		tableRoughness: .8,
		boardRoughness: .5,
		pitRoughness: .6,
		stoneRoughness: .18
	}),
	hidatochain: Object.freeze({
		dark: [
			24,
			30,
			52
		],
		light: [
			246,
			242,
			226
		],
		roughness: .55,
		relief: .004,
		size: 7,
		nodeLimit: 1e5,
		givenChance: .22,
		margin: .08,
		digitFraction: .09,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .92,
		givenTone: .78,
		endTone: .12,
		lineTone: .55,
		inkTone: .1,
		endInkTone: .9,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		givenHeight: .6,
		endHeight: .85,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74,
		endRoughness: .35
	}),
	euclideanrhythms: Object.freeze({
		dark: [
			14,
			16,
			30
		],
		light: [
			250,
			236,
			190
		],
		roughness: .5,
		relief: .004,
		steps: 16,
		tracks: 16,
		minPulses: 1,
		maxPulses: 8,
		margin: .04,
		padInset: .1,
		padCorner: .22,
		edgeSoft: .0011,
		grainCells: 160,
		panelTone: .1,
		padTone: .26,
		beatTone: .36,
		litTone: .94,
		grainTone: .03,
		panelHeight: .15,
		padHeight: .45,
		litHeight: .8,
		panelRoughness: .7,
		padRoughness: .55,
		litRoughness: .25
	}),
	chinesecheckersboard: Object.freeze({
		dark: [
			30,
			20,
			12
		],
		light: [
			240,
			220,
			176
		],
		roughness: .5,
		relief: .006,
		pitch: .062,
		reach: 4,
		swaps: 14,
		plateRadius: 7.3,
		holeRadius: .42,
		marbleRadius: .36,
		edgeSoft: .0011,
		grainCells: 160,
		tableTone: .82,
		plateTone: .55,
		holeTone: .12,
		marbleTones: [
			.3,
			.42,
			.55,
			.69,
			.83,
			.96
		],
		grainTone: .05,
		tableHeight: .1,
		plateHeight: .6,
		holeHeight: .3,
		marbleHeight: .9,
		tableRoughness: .8,
		plateRoughness: .5,
		holeRoughness: .6,
		marbleRoughness: .12
	}),
	colormapregions: Object.freeze({
		dark: [
			28,
			36,
			60
		],
		light: [
			246,
			236,
			204
		],
		roughness: .55,
		relief: .004,
		cells: 6,
		jitter: .35,
		scan: 512,
		nodeLimit: 3e4,
		borderHalf: .0045,
		edgeSoft: .0011,
		grainCells: 160,
		regionTones: [
			.3,
			.44,
			.58,
			.72,
			.86
		],
		borderTone: .08,
		grainTone: .03,
		regionHeight: .45,
		borderHeight: .8,
		regionRoughness: .7,
		borderRoughness: .4
	}),
	draughtsposition: Object.freeze({
		dark: [
			26,
			16,
			10
		],
		light: [
			238,
			214,
			168
		],
		roughness: .5,
		relief: .006,
		size: 8,
		minPieces: 6,
		maxPieces: 12,
		kingChance: .2,
		margin: .06,
		pieceRadius: .38,
		ringRadius: .2,
		ringWidth: .05,
		edgeSoft: .0011,
		grainCells: 160,
		grainStretch: 6,
		tableTone: .82,
		lightSquare: .88,
		darkSquare: .36,
		paleTone: .95,
		charcoalTone: .1,
		grainTone: .05,
		tableHeight: .1,
		squareHeight: .45,
		pieceHeight: .85,
		ringHeight: .7,
		tableRoughness: .8,
		squareRoughness: .55,
		pieceRoughness: .2
	}),
	multiplicationtable: Object.freeze({
		dark: [
			24,
			28,
			48
		],
		light: [
			248,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		factors: 9,
		margin: .06,
		digitFraction: .1,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .92,
		squareTone: .78,
		headerTone: .14,
		lineTone: .55,
		inkTone: .1,
		headerInkTone: .92,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		squareHeight: .6,
		headerHeight: .85,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74,
		headerRoughness: .35
	}),
	moonphases: Object.freeze({
		dark: [
			10,
			14,
			34
		],
		light: [
			244,
			240,
			224
		],
		roughness: .6,
		relief: .004,
		columns: 5,
		rows: 6,
		cell: .15,
		synodicDays: 29.53,
		moonRadius: .42,
		craters: 24,
		craterRadius: .12,
		edgeSoft: .0011,
		grainCells: 160,
		skyTone: .08,
		shadowTone: .24,
		litTone: .95,
		craterShade: .12,
		grainTone: .025,
		skyHeight: .1,
		moonHeight: .7,
		craterDepth: .12,
		skyRoughness: .9,
		moonRoughness: .75
	}),
	treemaprects: Object.freeze({
		dark: [
			20,
			36,
			52
		],
		light: [
			244,
			240,
			214
		],
		roughness: .55,
		relief: .004,
		items: 12,
		minValue: 4,
		maxValue: 30,
		margin: .04,
		borderHalf: .004,
		digitPixel: .0055,
		labelInset: .012,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		toneLow: .38,
		toneHigh: .82,
		borderTone: .08,
		inkTone: .1,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .5,
		borderHeight: .8,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74,
		borderRoughness: .4
	}),
	analogclocks: Object.freeze({
		dark: [
			24,
			26,
			40
		],
		light: [
			246,
			240,
			222
		],
		roughness: .4,
		relief: .005,
		columns: 4,
		rows: 4,
		margin: .04,
		faceRadius: .44,
		rimWidth: .035,
		hourLength: .5,
		minuteLength: .8,
		hourWidth: .045,
		minuteWidth: .03,
		hubRadius: .05,
		tickInner: .82,
		tickOuter: .92,
		tickWidth: .02,
		edgeSoft: .0011,
		grainCells: 160,
		wallTone: .5,
		faceTone: .94,
		rimTone: .2,
		inkTone: .08,
		grainTone: .03,
		wallHeight: .1,
		faceHeight: .4,
		rimHeight: .8,
		handHeight: .9,
		wallRoughness: .8,
		faceRoughness: .3,
		metalRoughness: .3
	}),
	piechartwedges: Object.freeze({
		dark: [
			26,
			32,
			56
		],
		light: [
			246,
			240,
			218
		],
		roughness: .55,
		relief: .004,
		wedges: 8,
		minPercent: 4,
		radius: .44,
		lineHalf: .004,
		labelRadius: .62,
		digitPixel: .009,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		toneLow: .28,
		toneHigh: .84,
		lineTone: .06,
		darkInk: .08,
		lightInk: .95,
		inkSwitch: .55,
		grainTone: .03,
		paperHeight: .22,
		wedgeHeight: .5,
		lineHeight: .8,
		inkDepth: .06,
		inkRoughness: .4,
		paperRoughness: .74,
		lineRoughness: .4
	}),
	regressionscatter: Object.freeze({
		dark: [
			24,
			34,
			54
		],
		light: [
			248,
			244,
			226
		],
		roughness: .55,
		relief: .004,
		points: 28,
		minSpacing: .075,
		noise: .07,
		slopeRange: .7,
		plotLeft: .1,
		plotSize: .8,
		pointRadius: .014,
		lineHalf: .0025,
		frameHalf: .0015,
		gridSteps: 4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		plotTone: .97,
		frameTone: .72,
		gridTone: .84,
		lineTone: .45,
		pointTone: .08,
		grainTone: .02,
		paperHeight: .22,
		plotHeight: .4,
		lineHeight: .7,
		pointHeight: .85,
		paperRoughness: .74,
		lineRoughness: .4,
		pointRoughness: .3
	}),
	barchartbars: Object.freeze({
		dark: [
			22,
			38,
			60
		],
		light: [
			248,
			244,
			224
		],
		roughness: .55,
		relief: .004,
		bars: 10,
		maxValue: 9,
		left: .1,
		barWidth: .065,
		barGap: .015,
		baseline: .88,
		unit: .075,
		digitPixel: .0085,
		labelGap: .012,
		axisHalf: .0025,
		gridHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		gridTone: .84,
		axisTone: .1,
		toneLow: .3,
		toneHigh: .7,
		inkTone: .08,
		grainTone: .02,
		paperHeight: .22,
		barHeight: .6,
		axisHeight: .8,
		inkDepth: .06,
		paperRoughness: .74,
		barRoughness: .45,
		inkRoughness: .4
	}),
	truthtablelogic: Object.freeze({
		dark: [
			20,
			30,
			50
		],
		light: [
			246,
			242,
			224
		],
		roughness: .55,
		relief: .004,
		inputs: 4,
		left: .15,
		top: .041,
		columnWidth: .14,
		rowHeight: .054,
		digitPixel: .0085,
		lineHalf: 7e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .92,
		onTone: .74,
		headerTone: .14,
		outputHeaderTone: .3,
		lineTone: .58,
		inkTone: .08,
		headerInkTone: .94,
		grainTone: .03,
		paperHeight: .22,
		cellLevel: .5,
		onLevel: .62,
		headerLevel: .85,
		inkDepth: .06,
		paperRoughness: .74,
		headerRoughness: .35,
		inkRoughness: .4
	}),
	fouriersquarewaves: Object.freeze({
		dark: [
			18,
			28,
			52
		],
		light: [
			246,
			242,
			220
		],
		roughness: .5,
		relief: .004,
		panels: 6,
		periods: 2,
		top: .04,
		panelHeight: .15,
		amplitude: .045,
		curveHalf: .0028,
		axisHalf: 8e-4,
		refHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		panelTone: .97,
		axisTone: .8,
		refTone: .66,
		curveTone: .08,
		grainTone: .02,
		paperHeight: .22,
		panelLevel: .4,
		curveHeight: .85,
		paperRoughness: .74,
		curveRoughness: .35
	}),
	pascaltrianglenumbers: Object.freeze({
		dark: [
			26,
			24,
			48
		],
		light: [
			248,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 10,
		top: .085,
		rowPitch: .092,
		columnPitch: .09,
		digitPixel: .0065,
		discRadius: .043,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		oddTone: .72,
		evenTone: .95,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		oddHeight: .55,
		evenHeight: .38,
		inkDepth: .06,
		paperRoughness: .74,
		discRoughness: .5,
		inkRoughness: .4
	}),
	convexhullpoints: Object.freeze({
		dark: [
			24,
			30,
			56
		],
		light: [
			246,
			242,
			224
		],
		roughness: .55,
		relief: .004,
		points: 16,
		margin: .07,
		minSpacing: .12,
		attempts: 4e3,
		rounds: 48,
		vertexClear: .012,
		edgeClear: .02,
		cornerRadius: .0145,
		innerRadius: .0085,
		edgeHalf: .002,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		fillTone: .84,
		edgeTone: .5,
		dotTone: .06,
		grainTone: .03,
		paperHeight: .22,
		fillHeight: .4,
		edgeHeight: .62,
		dotHeight: .85,
		paperRoughness: .74,
		fillRoughness: .6,
		dotRoughness: .35
	}),
	delaunaytriangles: Object.freeze({
		dark: [
			22,
			30,
			52
		],
		light: [
			246,
			242,
			224
		],
		roughness: .55,
		relief: .004,
		points: 18,
		margin: .06,
		minSpacing: .1,
		attempts: 4e3,
		dotRadius: .0075,
		edgeHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		fillTone: .9,
		fillSpread: .07,
		edgeTone: .4,
		dotTone: .06,
		grainTone: .03,
		paperHeight: .22,
		fillHeight: .4,
		edgeHeight: .62,
		dotHeight: .85,
		paperRoughness: .74,
		fillRoughness: .6,
		dotRoughness: .35
	}),
	collatzsequences: Object.freeze({
		dark: [
			30,
			26,
			50
		],
		light: [
			248,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 10,
		columns: 13,
		candidateLimit: 60,
		top: .05,
		rowPitch: .09,
		columnPitch: .075,
		digitPixel: .0055,
		lineHalf: 6e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		evenTone: .94,
		oddTone: .72,
		lineTone: .6,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		evenHeight: .4,
		oddHeight: .55,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	hammingcodewords: Object.freeze({
		dark: [
			22,
			32,
			50
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		bits: 7,
		left: .06,
		top: .041,
		columnWidth: .11,
		rowHeight: .054,
		digitPixel: .0085,
		lineHalf: 7e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .93,
		parityTone: .84,
		errorTone: .55,
		headerTone: .14,
		syndromeHeaderTone: .3,
		lineTone: .6,
		inkTone: .08,
		headerInkTone: .94,
		grainTone: .03,
		paperHeight: .22,
		cellLevel: .45,
		parityLevel: .5,
		errorLevel: .7,
		headerLevel: .85,
		inkDepth: .06,
		paperRoughness: .74,
		headerRoughness: .35,
		inkRoughness: .4
	}),
	cayleytables: Object.freeze({
		dark: [
			24,
			28,
			54
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		order: 8,
		left: .05,
		top: .05,
		cell: .1,
		digitPixel: .009,
		lineHalf: 7e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .93,
		identityTone: .7,
		headerTone: .14,
		lineTone: .6,
		inkTone: .08,
		headerInkTone: .94,
		grainTone: .03,
		paperHeight: .22,
		cellLevel: .45,
		identityLevel: .6,
		headerLevel: .85,
		inkDepth: .06,
		paperRoughness: .74,
		headerRoughness: .35,
		inkRoughness: .4
	}),
	romannumerals: Object.freeze({
		dark: [
			40,
			24,
			30
		],
		light: [
			244,
			236,
			214
		],
		roughness: .6,
		relief: .004,
		rows: 14,
		maxValue: 199,
		left: .058,
		top: .04,
		cell: .068,
		rowPitch: .066,
		digitPixel: .0085,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .34,
		inkDepth: .06,
		paperRoughness: .74,
		stripeRoughness: .6,
		inkRoughness: .4
	}),
	signedencodings: Object.freeze({
		dark: [
			26,
			30,
			52
		],
		light: [
			246,
			242,
			224
		],
		roughness: .55,
		relief: .004,
		bits: 4,
		left: .075,
		top: .03,
		cell: .085,
		rowPitch: .055,
		digitPixel: .0085,
		grainCells: 192,
		paperTone: .94,
		negativeTone: .84,
		signBitTone: .76,
		headerTone: .14,
		inkTone: .08,
		headerInkTone: .94,
		grainTone: .03,
		paperHeight: .22,
		negativeHeight: .4,
		signBitHeight: .52,
		headerHeight: .85,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		headerRoughness: .35,
		inkRoughness: .4
	}),
	matrixproducts: Object.freeze({
		dark: [
			24,
			30,
			52
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		equations: 4,
		size: 3,
		left: .12,
		top: .04,
		pitch: .24,
		rowHeight: .06,
		factorWidth: .06,
		symbolWidth: .05,
		productWidth: .1,
		maxEntry: 9,
		digitPixel: .0075,
		bracketHalf: .0012,
		bracketReach: .012,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .9,
		productTone: .84,
		bracketTone: .3,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		cellHeight: .36,
		productHeight: .46,
		bracketHeight: .7,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		bracketRoughness: .4,
		inkRoughness: .4
	}),
	kochsnowflake: Object.freeze({
		dark: [
			18,
			34,
			60
		],
		light: [
			244,
			244,
			232
		],
		roughness: .5,
		relief: .004,
		side: .36,
		levels: 4,
		edgeHalf: .0024,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		fillTone: .8,
		edgeTone: .14,
		grainTone: .03,
		paperHeight: .22,
		fillHeight: .42,
		edgeHeight: .8,
		paperRoughness: .74,
		fillRoughness: .6,
		edgeRoughness: .35
	}),
	newtonbasins: Object.freeze({
		dark: [
			20,
			30,
			62
		],
		light: [
			248,
			242,
			224
		],
		roughness: .5,
		relief: .004,
		extent: 1.6,
		minDegree: 3,
		maxDegree: 5,
		maxSteps: 40,
		tolerance: 1e-8,
		shadeSteps: 10,
		shadePerStep: .006,
		lowTone: .3,
		highTone: .92,
		grainCells: 192,
		grainTone: .02,
		heightBase: .2,
		heightSpan: .5,
		roughnessBase: .45,
		roughnessSpan: .3
	}),
	mandelbrotbands: Object.freeze({
		dark: [
			18,
			22,
			52
		],
		light: [
			246,
			238,
			214
		],
		roughness: .5,
		relief: .004,
		views: Object.freeze([
			Object.freeze({
				x: -.6,
				y: 0,
				extent: 1.6,
				iterations: 80
			}),
			Object.freeze({
				x: -.745,
				y: .113,
				extent: .06,
				iterations: 160
			}),
			Object.freeze({
				x: -.16,
				y: 1.0405,
				extent: .04,
				iterations: 160
			}),
			Object.freeze({
				x: -1.401155,
				y: 0,
				extent: .02,
				iterations: 160
			})
		]),
		bailout: 256,
		insideTone: .06,
		lowTone: .22,
		highTone: .94,
		scale: 8,
		bandDepth: .08,
		bandPeriod: 3,
		grainCells: 192,
		grainTone: .015,
		insideHeight: .2,
		heightSpan: .5,
		insideRoughness: .8,
		roughnessBase: .4,
		roughnessSpan: .3
	}),
	cantorsetrows: Object.freeze({
		dark: [
			30,
			22,
			46
		],
		light: [
			246,
			240,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 8,
		top: .05,
		rowPitch: .11,
		barThickness: .06,
		removed: Object.freeze([
			1 / 3,
			1 / 5,
			1 / 2
		]),
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		barTone: .1,
		grainTone: .03,
		paperHeight: .22,
		barLevel: .8,
		paperRoughness: .74,
		barRoughness: .4
	}),
	conicsections: Object.freeze({
		dark: [
			22,
			30,
			56
		],
		light: [
			246,
			242,
			224
		],
		roughness: .5,
		relief: .004,
		eccentricities: Object.freeze([
			0,
			.6,
			1,
			1.6
		]),
		focusShifts: Object.freeze([
			0,
			.084375,
			.055,
			-.092308
		]),
		latusRectum: .09,
		panelHalf: .24,
		curveHalf: .0022,
		guideHalf: 7e-4,
		focusRadius: .006,
		dashPeriod: .024,
		dashDuty: .55,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		panelTone: .97,
		curveTone: .08,
		guideTone: .62,
		grainTone: .02,
		paperHeight: .22,
		panelHeight: .3,
		curveHeight: .82,
		guideHeight: .5,
		paperRoughness: .74,
		curveRoughness: .35
	}),
	rosecurves: Object.freeze({
		dark: [
			40,
			20,
			36
		],
		light: [
			248,
			240,
			226
		],
		roughness: .5,
		relief: .004,
		curves: Object.freeze([
			Object.freeze([1, 1]),
			Object.freeze([2, 1]),
			Object.freeze([3, 1]),
			Object.freeze([4, 1]),
			Object.freeze([5, 1]),
			Object.freeze([3, 2]),
			Object.freeze([5, 2]),
			Object.freeze([5, 3]),
			Object.freeze([7, 3])
		]),
		radius: .15,
		curveHalf: .0022,
		centreRadius: .004,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		panelTone: .97,
		curveTone: .08,
		grainTone: .02,
		paperHeight: .22,
		panelHeight: .3,
		curveHeight: .82,
		paperRoughness: .74,
		curveRoughness: .35
	}),
	cassiniovals: Object.freeze({
		dark: [
			20,
			36,
			58
		],
		light: [
			246,
			242,
			224
		],
		roughness: .5,
		relief: .004,
		halfSeparations: Object.freeze([
			.13,
			.18,
			.23
		]),
		ratios: Object.freeze([
			.4,
			.7,
			.9,
			1,
			1.15,
			1.35,
			1.6
		]),
		curveHalf: .002,
		lemniscateHalf: .0032,
		focusRadius: .006,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		curveTone: .1,
		lemniscateTone: .06,
		grainTone: .02,
		paperHeight: .22,
		curveHeight: .78,
		paperRoughness: .74,
		curveRoughness: .35
	}),
	twosourceripples: Object.freeze({
		dark: [
			14,
			40,
			72
		],
		light: [
			236,
			246,
			250
		],
		roughness: .3,
		relief: .006,
		wavelengths: Object.freeze([
			.04,
			.052,
			.07
		]),
		separations: Object.freeze([.22, .32]),
		lowTone: .08,
		highTone: .96,
		grainCells: 192,
		grainTone: .012,
		heightBase: .5,
		heightSpan: .5,
		roughnessBase: .22,
		roughnessSpan: .3
	}),
	luhnnumbers: Object.freeze({
		dark: [
			24,
			34,
			54
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 10,
		digits: 16,
		groupSize: 4,
		validShare: .6,
		left: .059,
		top: .04,
		cell: .042,
		rowPitch: .092,
		digitPixel: .0105,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		checkDigitTone: .78,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .34,
		checkDigitHeight: .5,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	bezierconstruction: Object.freeze({
		dark: [
			26,
			28,
			62
		],
		light: [
			246,
			242,
			224
		],
		roughness: .5,
		relief: .004,
		curves: Object.freeze([
			Object.freeze([
				-.18,
				.12,
				-.05,
				-.2,
				.08,
				.2,
				.18,
				-.1
			]),
			Object.freeze([
				-.18,
				-.1,
				.2,
				-.22,
				-.2,
				-.22,
				.18,
				-.1
			]),
			Object.freeze([
				-.2,
				.15,
				.22,
				.2,
				-.22,
				-.2,
				.2,
				-.15
			]),
			Object.freeze([
				-.2,
				0,
				-.1,
				.22,
				.1,
				-.22,
				.2,
				0
			])
		]),
		parameters: Object.freeze([
			.25,
			1 / 3,
			.5,
			2 / 3
		]),
		segments: 64,
		panelHalf: .24,
		curveHalf: .0028,
		guideHalf: 8e-4,
		constructionHalf: .0011,
		controlRadius: .0085,
		endHalf: .008,
		pointRadius: .0105,
		dashPeriod: .02,
		dashDuty: .55,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		panelTone: .97,
		curveTone: .08,
		guideTone: .62,
		constructionTone: .4,
		pointTone: .06,
		grainTone: .02,
		paperHeight: .22,
		panelHeight: .3,
		curveHeight: .8,
		guideHeight: .45,
		pointHeight: .9,
		paperRoughness: .74,
		curveRoughness: .35
	}),
	vennregions: Object.freeze({
		dark: [
			28,
			26,
			56
		],
		light: [
			248,
			242,
			224
		],
		roughness: .55,
		relief: .004,
		radius: .2,
		centres: Object.freeze([
			.4,
			.44,
			.6,
			.44,
			.5,
			.6132
		]),
		regionLabels: Object.freeze([
			.3,
			.4,
			.7,
			.4,
			.5,
			.74,
			.5,
			.34,
			.4,
			.58,
			.6,
			.58,
			.5,
			.5
		]),
		maxCount: 40,
		totalsLeft: .04,
		totalsTop: [
			.05,
			.12,
			.19
		],
		glyphPitch: .045,
		digitPixel: .008,
		outlineHalf: .0022,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		layerTone: .07,
		outlineTone: .2,
		inkTone: .06,
		grainTone: .02,
		paperHeight: .22,
		layerHeight: .07,
		outlineHeight: .7,
		inkDepth: .08,
		paperRoughness: .74,
		outlineRoughness: .4,
		inkRoughness: .4
	}),
	ieee754floats: Object.freeze({
		dark: [
			24,
			34,
			56
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		blocks: 6,
		top: .04,
		blockPitch: .155,
		textLine: .035,
		bitsLine: .105,
		textLeft: .06,
		textPitch: .045,
		textPixel: .009,
		bitsLeft: .06,
		bitsPitch: .027,
		bitsPixel: .0062,
		exponentMin: 124,
		exponentMax: 133,
		decimals: 4,
		dividerHalf: 7e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		signTone: .76,
		exponentTone: .86,
		mantissaTone: .94,
		dividerTone: .4,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		signHeight: .5,
		exponentHeight: .38,
		mantissaHeight: .3,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	bellcurvebands: Object.freeze({
		dark: [
			22,
			36,
			62
		],
		light: [
			246,
			242,
			224
		],
		roughness: .5,
		relief: .004,
		sigmas: Object.freeze([
			.07,
			.09,
			.11
		]),
		baseline: .82,
		peak: .6,
		curveHalf: .0026,
		axisHalf: .0016,
		tickHalf: 8e-4,
		tickReach: .03,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .95,
		bandTones: Object.freeze([
			.5,
			.64,
			.78,
			.88
		]),
		curveTone: .08,
		axisTone: .25,
		tickTone: .45,
		grainTone: .012,
		paperHeight: .22,
		bandHeights: Object.freeze([
			.6,
			.5,
			.42,
			.34
		]),
		curveHeight: .85,
		paperRoughness: .74,
		fillRoughness: .55,
		curveRoughness: .35
	}),
	roundingmodes: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 12,
		pool: Object.freeze([
			-35,
			-25,
			-15,
			-12,
			-8,
			-5,
			-2,
			0,
			2,
			5,
			8,
			12,
			15,
			18,
			25,
			28,
			35,
			45,
			55,
			65
		]),
		left: .08,
		top: .04,
		cell: .14,
		rowPitch: .07,
		digitPixel: .0095,
		lineHalf: 6e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		halfTone: .8,
		headerTone: .14,
		lineTone: .62,
		inkTone: .08,
		headerInkTone: .94,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .34,
		halfHeight: .5,
		headerHeight: .85,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		headerRoughness: .35,
		inkRoughness: .4
	}),
	binaryaddition: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		problems: 3,
		bits: 8,
		left: .06,
		top: .045,
		blockPitch: .31,
		cell: .088,
		rowPitch: .056,
		digitPixel: .0088,
		carryPixel: .0055,
		ruleHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		carryTone: .86,
		sumTone: .88,
		lineTone: .3,
		inkTone: .08,
		carryInkTone: .4,
		grainTone: .03,
		paperHeight: .22,
		carryHeight: .3,
		sumHeight: .42,
		ruleHeight: .75,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	abeliansandpile: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .6,
		relief: .004,
		size: 81,
		grains: Object.freeze([
			4e3,
			5200,
			6400
		]),
		grainCells: 192,
		tones: Object.freeze([
			.08,
			.36,
			.64,
			.92
		]),
		heights: Object.freeze([
			.1,
			.35,
			.6,
			.85
		]),
		grainTone: .03,
		cellRoughness: .6
	}),
	percolationclusters: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .6,
		relief: .004,
		size: 48,
		openings: Object.freeze([
			.56,
			.5927,
			.63
		]),
		mediumSize: 8,
		grainCells: 192,
		closedTone: .94,
		smallTone: .62,
		mediumTone: .38,
		largestTone: .08,
		closedHeight: .12,
		smallHeight: .4,
		mediumHeight: .6,
		largestHeight: .85,
		grainTone: .03,
		cellRoughness: .6
	}),
	gcdtable: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		size: 12,
		starts: Object.freeze([
			1,
			5,
			13,
			25
		]),
		left: .06,
		top: .06,
		cell: .07,
		digitPixel: .0085,
		lineHalf: 6e-4,
		edgeSoft: .0011,
		grainCells: 192,
		coprimeTone: .94,
		divisorFloor: .5,
		divisorRange: .44,
		headerTone: .14,
		lineTone: .62,
		inkTone: .08,
		headerInkTone: .94,
		grainTone: .03,
		paperTone: .9,
		paperHeight: .22,
		coprimeHeight: .2,
		divisorHeight: .55,
		headerHeight: .85,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		headerRoughness: .35,
		inkRoughness: .4
	}),
	bitwiselogic: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		bits: 8,
		ops: Object.freeze([
			`AND`,
			`OR`,
			`XOR`,
			`NAND`
		]),
		left: .05,
		top: .03,
		blockPitch: .245,
		labelCell: .16,
		cell: .08,
		rowPitch: .056,
		digitPixel: .0088,
		ruleHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		oneTone: .8,
		resultTone: .88,
		resultOneTone: .66,
		lineTone: .3,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		oneHeight: .36,
		resultHeight: .42,
		resultOneHeight: .6,
		ruleHeight: .75,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	logisticbifurcation: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .6,
		relief: .004,
		columns: 256,
		rows: 256,
		start: .4,
		transient: 300,
		recorded: 500,
		windows: Object.freeze([
			Object.freeze([2.5, 4]),
			Object.freeze([3.4, 4]),
			Object.freeze([3.55, 3.95])
		]),
		grainCells: 192,
		paperTone: .94,
		inkTone: .08,
		saturation: 4,
		grainTone: .03,
		paperHeight: .15,
		inkHeight: .8,
		cellRoughness: .6
	}),
	burningship: Object.freeze({
		dark: [
			30,
			12,
			8
		],
		light: [
			252,
			236,
			190
		],
		roughness: .5,
		relief: .004,
		views: Object.freeze([
			Object.freeze({
				x: -.45,
				y: -.5,
				extent: 1.7,
				iterations: 100
			}),
			Object.freeze({
				x: -1.7443,
				y: -.0173,
				extent: .04,
				iterations: 200
			}),
			Object.freeze({
				x: -1.62,
				y: -.03,
				extent: .12,
				iterations: 160
			}),
			Object.freeze({
				x: -1.861,
				y: -.002,
				extent: .02,
				iterations: 200
			})
		]),
		bailout: 256,
		insideTone: .05,
		lowTone: .2,
		highTone: .94,
		scale: 8,
		bandDepth: .08,
		bandPeriod: 3,
		grainCells: 192,
		grainTone: .015,
		insideHeight: .2,
		heightSpan: .5,
		insideRoughness: .8,
		roughnessBase: .4,
		roughnessSpan: .3
	}),
	modularpowers: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		size: 10,
		moduli: Object.freeze([
			13,
			15,
			17,
			21,
			25
		]),
		firstBase: 2,
		left: .06,
		top: .06,
		cell: .082,
		digitPixel: .0095,
		lineHalf: 6e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .9,
		plainTone: .94,
		sharedFactorTone: .82,
		oneTone: .55,
		headerTone: .14,
		lineTone: .62,
		inkTone: .08,
		headerInkTone: .94,
		grainTone: .03,
		paperHeight: .22,
		plainHeight: .2,
		sharedFactorHeight: .35,
		oneHeight: .6,
		headerHeight: .85,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		headerRoughness: .35,
		inkRoughness: .4
	}),
	primefactors: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 12,
		lowest: 2,
		highest: 99,
		left: .05,
		top: .04,
		numberWidth: .15,
		factorWidth: .75,
		rowPitch: .074,
		digitPixel: .0095,
		lineHalf: 6e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		primeTone: .78,
		numberTone: .88,
		lineTone: .62,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		primeHeight: .5,
		numberHeight: .35,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	baseconversion: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 12,
		highest: 255,
		left: .04,
		top: .04,
		widths: Object.freeze([
			.14,
			.38,
			.17,
			.15
		]),
		rowPitch: .074,
		digitPixel: .0085,
		indent: .014,
		lineHalf: 6e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .88,
		letterTone: .8,
		lineTone: .62,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .34,
		letterHeight: .5,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	caesarcipher: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		shifts: Object.freeze([
			3,
			5,
			7,
			13
		]),
		messages: Object.freeze([
			`ATTACKATDAWN`,
			`HELLOWORLD`,
			`SECRETMESSAGE`,
			`MEETATNOON`,
			`KEEPITSIMPLE`
		]),
		columns: 13,
		left: .05,
		top: .05,
		cell: .069,
		rowPitch: .1,
		pixel: .0115,
		lineHalf: 7e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cipherTone: .84,
		lineTone: .5,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		cipherHeight: .4,
		lineHeight: .7,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	wordsquares: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		squares: Object.freeze([
			Object.freeze([
				`SATOR`,
				`AREPO`,
				`TENET`,
				`OPERA`,
				`ROTAS`
			]),
			Object.freeze([
				`BALL`,
				`AREA`,
				`LEAD`,
				`LADY`
			]),
			Object.freeze([
				`BAND`,
				`AREA`,
				`NEST`,
				`DATA`
			]),
			Object.freeze([
				`BIRD`,
				`IDEA`,
				`REST`,
				`DATE`
			]),
			Object.freeze([
				`BLOW`,
				`LOVE`,
				`OVAL`,
				`WELL`
			]),
			Object.freeze([
				`BEAT`,
				`EACH`,
				`ACHE`,
				`THEY`
			])
		]),
		span: .82,
		pixel: .03,
		lineHalf: 8e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		diagonalTone: .78,
		lineTone: .45,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		diagonalHeight: .5,
		lineHeight: .7,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	vectorfieldarrows: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		nodes: 10,
		fields: Object.freeze([
			Object.freeze([
				0,
				-1,
				1,
				0
			]),
			Object.freeze([
				1,
				0,
				0,
				-1
			]),
			Object.freeze([
				1,
				0,
				0,
				1
			]),
			Object.freeze([
				1,
				-1,
				1,
				1
			])
		]),
		shortest: .3,
		longest: .88,
		shaftHalf: .0038,
		headLength: .02,
		headHalf: .01,
		edgeSoft: .0012,
		grainCells: 192,
		paperTone: .94,
		weakTone: .6,
		strongTone: .08,
		gridTone: .9,
		grainTone: .03,
		paperHeight: .2,
		arrowHeight: .75,
		paperRoughness: .74,
		arrowRoughness: .4
	}),
	fordcircles: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		limits: Object.freeze([
			4,
			6,
			8
		]),
		tones: Object.freeze([
			.2,
			.34,
			.44,
			.52,
			.58,
			.64,
			.7,
			.76
		]),
		outlineHalf: .0016,
		axisHalf: .003,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		outlineTone: .06,
		axisTone: .1,
		grainTone: .03,
		paperHeight: .2,
		fillHeight: .45,
		outlineHeight: .8,
		paperRoughness: .74,
		fillRoughness: .5
	}),
	mobiusgrid: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		maps: Object.freeze([
			Object.freeze([
				0,
				0,
				1,
				0,
				1,
				0,
				0,
				0
			]),
			Object.freeze([
				1,
				0,
				0,
				0,
				0,
				.45,
				1,
				0
			]),
			Object.freeze([
				1,
				0,
				0,
				.5,
				.3,
				0,
				1,
				.5
			])
		]),
		extent: 2,
		step: .5,
		lineHalf: .012,
		edgeSoft: .01,
		grainCells: 192,
		paperTone: .94,
		checkerTone: .8,
		lineTone: .08,
		grainTone: .03,
		paperHeight: .2,
		checkerHeight: .4,
		lineHeight: .8,
		cellRoughness: .55,
		lineRoughness: .4
	}),
	dipolefieldlines: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		separations: Object.freeze([
			.25,
			.4,
			.55
		]),
		extent: 1.2,
		potentialStep: .4,
		fieldStep: .3141592653589793,
		lineHalf: .008,
		coreRadius: .03,
		edgeSoft: .008,
		grainCells: 192,
		positiveTone: .94,
		negativeTone: .82,
		potentialTone: .08,
		fieldTone: .4,
		positiveCoreTone: .05,
		negativeCoreTone: .55,
		grainTone: .03,
		paperHeight: .2,
		fieldHeight: .35,
		lineHeight: .8,
		coreHeight: .9,
		cellRoughness: .55,
		lineRoughness: .4
	}),
	numberwords: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 12,
		highest: 99,
		left: .04,
		top: .04,
		numberWidth: .14,
		wordWidth: .78,
		rowPitch: .074,
		pixel: .0085,
		indent: .012,
		lineHalf: 6e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		irregularTone: .78,
		lineTone: .62,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		irregularHeight: .5,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	sorobanabacus: Object.freeze({
		dark: [
			30,
			22,
			14
		],
		light: [
			246,
			238,
			214
		],
		roughness: .5,
		relief: .004,
		abacuses: 2,
		rods: 7,
		left: .07,
		frameWidth: .86,
		frameHeight: .28,
		top: .04,
		blockPitch: .47,
		beamCentre: .09,
		beamHalf: .006,
		heavenFirst: .029,
		heavenSecond: .067,
		earthFirst: .113,
		slotPitch: .0344,
		beadHalfWidth: .05,
		beadHalfHeight: .0172,
		frameHalf: .004,
		rodHalf: .0016,
		labelCentre: .335,
		pixel: .012,
		edgeSoft: .0012,
		grainCells: 192,
		paperTone: .94,
		frameTone: .25,
		beamTone: .2,
		rodTone: .55,
		beadTone: .12,
		grainTone: .03,
		paperHeight: .2,
		frameRelief: .7,
		beadHeight: .85,
		paperRoughness: .74,
		beadRoughness: .3
	}),
	boxplots: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		panels: 3,
		points: 15,
		exponents: Object.freeze([
			.7,
			1,
			1.3
		]),
		left: .06,
		span: .88,
		top: .035,
		panelPitch: .32,
		boxCentre: .085,
		boxHalfHeight: .045,
		capHalf: .022,
		dotRows: Object.freeze([.19, .235]),
		dotRadius: .009,
		lineHalf: .0022,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		boxTone: .8,
		lineTone: .08,
		dotTone: .2,
		grainTone: .03,
		paperHeight: .2,
		boxHeight: .4,
		lineHeight: .8,
		dotHeight: .9,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	stemandleaf: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		count: 29,
		firstStem: 1,
		lastStem: 9,
		left: .06,
		top: .045,
		rowPitch: .1,
		stemWidth: .09,
		stemGap: .03,
		leafGap: .02,
		barHalf: .0016,
		leafPitch: .034,
		pixel: .0085,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		medianTone: .7,
		barTone: .3,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		medianHeight: .5,
		barHeight: .7,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	substitutionwords: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rules: Object.freeze([
			Object.freeze({
				zero: `01`,
				one: `0`,
				rows: 9
			}),
			Object.freeze({
				zero: `01`,
				one: `10`,
				rows: 7
			}),
			Object.freeze({
				zero: `01`,
				one: `00`,
				rows: 7
			})
		]),
		left: .07,
		width: .86,
		top: .06,
		rowPitch: .1,
		cellHeight: .08,
		gap: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		zeroTone: .62,
		oneTone: .12,
		gapTone: .6,
		grainTone: .03,
		paperHeight: .2,
		zeroHeight: .35,
		oneHeight: .8,
		paperRoughness: .74,
		cellRoughness: .5
	}),
	dicesumbars: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		sides: Object.freeze([
			4,
			6,
			8
		]),
		left: .07,
		width: .86,
		baseline: .72,
		fill: .8,
		stack: 1.12,
		pixel: .0068,
		labelTop: .76,
		axisHalf: .002,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		waysTone: .55,
		modeTone: .12,
		axisTone: .3,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		waysHeight: .6,
		modeHeight: .85,
		axisHeight: .7,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	binaryheaptree: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		levels: 4,
		lowest: 10,
		highest: 99,
		top: .12,
		levelPitch: .25,
		left: .03,
		width: .94,
		nodeRadius: .052,
		ringHalf: .003,
		edgeHalf: .0025,
		pixel: .0085,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		nodeTone: .88,
		rootTone: .62,
		lineTone: .12,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		nodeHeight: .4,
		rootHeight: .6,
		lineHeight: .8,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	bubblesortpasses: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		size: 8,
		left: .06,
		top: .06,
		cell: .108,
		rowPitch: .11,
		pixel: .019,
		cellInset: .006,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		cellTone: .88,
		settledTone: .62,
		lineTone: .5,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		cellHeight: .35,
		settledHeight: .6,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .55,
		inkRoughness: .4
	}),
	graphcoloring: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		graphs: Object.freeze([
			Object.freeze({
				vertices: Object.freeze([
					Object.freeze([.12, .12]),
					Object.freeze([.88, .12]),
					Object.freeze([.88, .88]),
					Object.freeze([.12, .88]),
					Object.freeze([.32, .32]),
					Object.freeze([.6799999999999999, .32]),
					Object.freeze([.6799999999999999, .6799999999999999]),
					Object.freeze([.32, .6799999999999999])
				]),
				edges: Object.freeze([
					Object.freeze([0, 1]),
					Object.freeze([1, 2]),
					Object.freeze([2, 3]),
					Object.freeze([3, 0]),
					Object.freeze([4, 5]),
					Object.freeze([5, 6]),
					Object.freeze([6, 7]),
					Object.freeze([7, 4]),
					Object.freeze([0, 4]),
					Object.freeze([1, 5]),
					Object.freeze([2, 6]),
					Object.freeze([3, 7])
				]),
				colors: Object.freeze([
					0,
					1,
					0,
					1,
					1,
					0,
					1,
					0
				])
			}),
			Object.freeze({
				vertices: Object.freeze([
					Object.freeze([.5, .12]),
					Object.freeze([.8614, .3826]),
					Object.freeze([.7234, .8074]),
					Object.freeze([.2766, .8074]),
					Object.freeze([.1386, .3826]),
					Object.freeze([.5, .31]),
					Object.freeze([.6807, .4413]),
					Object.freeze([.6117, .6537]),
					Object.freeze([.3883, .6537]),
					Object.freeze([.3193, .4413])
				]),
				edges: Object.freeze([
					Object.freeze([0, 1]),
					Object.freeze([1, 2]),
					Object.freeze([2, 3]),
					Object.freeze([3, 4]),
					Object.freeze([4, 0]),
					Object.freeze([0, 5]),
					Object.freeze([1, 6]),
					Object.freeze([2, 7]),
					Object.freeze([3, 8]),
					Object.freeze([4, 9]),
					Object.freeze([5, 7]),
					Object.freeze([7, 9]),
					Object.freeze([9, 6]),
					Object.freeze([6, 8]),
					Object.freeze([8, 5])
				]),
				colors: Object.freeze([
					0,
					1,
					0,
					1,
					2,
					1,
					0,
					2,
					2,
					1
				])
			}),
			Object.freeze({
				vertices: Object.freeze([
					Object.freeze([.5, .5]),
					Object.freeze([.5, .12]),
					Object.freeze([.8614, .3826]),
					Object.freeze([.7234, .8074]),
					Object.freeze([.2766, .8074]),
					Object.freeze([.1386, .3826])
				]),
				edges: Object.freeze([
					Object.freeze([1, 2]),
					Object.freeze([2, 3]),
					Object.freeze([3, 4]),
					Object.freeze([4, 5]),
					Object.freeze([5, 1]),
					Object.freeze([0, 1]),
					Object.freeze([0, 2]),
					Object.freeze([0, 3]),
					Object.freeze([0, 4]),
					Object.freeze([0, 5])
				]),
				colors: Object.freeze([
					3,
					0,
					1,
					0,
					1,
					2
				])
			})
		]),
		classTones: Object.freeze([
			.92,
			.66,
			.4,
			.14
		]),
		vertexRadius: .05,
		ringHalf: .004,
		edgeHalf: .0035,
		edgeSoft: .0012,
		grainCells: 192,
		paperTone: .94,
		lineTone: .1,
		grainTone: .03,
		paperHeight: .2,
		vertexHeight: .5,
		lineHeight: .8,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	runlengthrows: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		blocks: 5,
		cells: 20,
		shortest: 2,
		longest: 6,
		left: .06,
		top: .05,
		blockPitch: .19,
		cell: .044,
		cellHeight: .075,
		textTop: .092,
		pixel: .0085,
		gap: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		whiteTone: .86,
		blackTone: .1,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		whiteHeight: .35,
		blackHeight: .8,
		inkDepth: .06,
		paperRoughness: .74,
		cellRoughness: .5
	}),
	isbn10checks: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 11,
		left: .08,
		top: .045,
		rowPitch: .085,
		pixel: .0135,
		stripeInset: .004,
		lineHalf: 6e-4,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		checkTone: .7,
		lineTone: .62,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		checkHeight: .5,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	projectilearcs: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		angles: Object.freeze([
			15,
			30,
			45,
			60,
			75
		]),
		ranges: Object.freeze([
			.4,
			.44,
			.48
		]),
		ground: .45,
		pitch: .5,
		lineHalf: .0032,
		envelopeHalf: .0026,
		groundHalf: .0028,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		arcTone: .1,
		envelopeTone: .5,
		groundTone: .3,
		grainTone: .03,
		paperHeight: .2,
		arcHeight: .8,
		envelopeHeight: .55,
		groundHeight: .65,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	sternbrocottree: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		levels: 4,
		pitch: .25,
		pixel: .0085,
		gap: .036,
		lineHalf: .0022,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		lineTone: .45,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		lineHeight: .5,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	cycloidcusps: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		cells: 3,
		extent: .135,
		lastEpi: Object.freeze([
			4,
			5,
			6
		]),
		lastHypo: Object.freeze([
			6,
			7,
			8
		]),
		turns: Object.freeze([
			0,
			.21,
			.42,
			.63
		]),
		segments: 360,
		buckets: 48,
		lineHalf: .0034,
		ringHalf: .0012,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		curveTone: .1,
		ringTone: .62,
		grainTone: .03,
		paperHeight: .2,
		curveHeight: .8,
		ringHeight: .4,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	zeckendorfrows: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 12,
		bits: 8,
		firstMax: 31,
		columnLeft: Object.freeze([.04, .54]),
		top: .04,
		rowPitch: .079,
		pixel: .0105,
		stripeInset: .006,
		stripeWidth: .46,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	ferrersdiagrams: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		total: 7,
		columns: 5,
		rows: 3,
		box: .027,
		lineHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		fillTone: .56,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		fillHeight: .45,
		inkHeight: .8,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	pairingtables: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		size: 8,
		pixel: .0095,
		grainCells: 192,
		paperTone: .94,
		checkerTone: .88,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		checkerHeight: .32,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	hexdumprows: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 14,
		perRow: 6,
		controlShare: .14,
		left: .045,
		top: .032,
		rowPitch: .068,
		pixel: .0085,
		stripeInset: .006,
		stripeWidth: .93,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	pythagoreantriples: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 12,
		maxM: 9,
		left: .09,
		top: .04,
		rowPitch: .08,
		pixel: .0125,
		stripeInset: .008,
		stripeWidth: .82,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		hypotenuseTone: .7,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		hypotenuseHeight: .5,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	figuratenumbers: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		columns: 5,
		rows: 4,
		pitch: .02,
		dotRadius: .0075,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		bandTone: .9,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		bandHeight: .3,
		dotHeight: .8,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	dyckpaths: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		semilength: 4,
		columns: 2,
		rows: 7,
		unit: .028,
		lineHalf: .0034,
		baseHalf: .0012,
		dotRadius: .0058,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		baseTone: .62,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		baseHeight: .45,
		inkHeight: .8,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	sacksspiral: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		lasts: Object.freeze([
			900,
			1200,
			1600
		]),
		outerRadius: .475,
		buckets: 40,
		dotRadius: .0055,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		inkHeight: .8,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	sierpinskipascal: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		depths: Object.freeze([
			5,
			6,
			7
		]),
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		inkTone: .1,
		grainTone: .03,
		paperHeight: .22,
		inkHeight: .8,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	cobwebplots: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rates: Object.freeze([
			2.8,
			3.2,
			3.5,
			3.74,
			3.9
		]),
		starts: Object.freeze([
			.11,
			.27,
			.46,
			.83
		]),
		iterations: 14,
		origin: .08,
		size: .84,
		pathHalf: .0028,
		curveHalf: .0022,
		diagonalHalf: .0018,
		boxHalf: .0012,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		pathTone: .1,
		curveTone: .42,
		diagonalTone: .62,
		boxTone: .7,
		grainTone: .03,
		paperHeight: .2,
		pathHeight: .8,
		curveHeight: .55,
		diagonalHeight: .45,
		boxHeight: .4,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	divisorcountbars: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		count: 64,
		firstMax: 400,
		left: .03,
		slot: .0146,
		barWidth: .0115,
		ground: .945,
		box: .034,
		boxGap: .003,
		baseHalf: .0015,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		baseTone: .5,
		primeTone: .08,
		squareTone: .4,
		otherTone: .24,
		grainTone: .03,
		paperHeight: .2,
		baseHeight: .4,
		boxHeight: .75,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	timestablecircles: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		points: 72,
		buckets: 96,
		cells: 3,
		kMin: 2,
		kMax: 20,
		radius: .15,
		lineHalf: .0012,
		ringHalf: .0014,
		dotRadius: .0034,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		chordTone: .2,
		ringTone: .5,
		dotTone: .08,
		grainTone: .03,
		paperHeight: .2,
		stripeHeight: .28,
		chordHeight: .6,
		ringHeight: .45,
		dotHeight: .8,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	gaussianprimes: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		size: 40,
		corners: Object.freeze([
			[0, 0],
			[-20, -20],
			[-12, -30],
			[5, -8],
			[-35, 4],
			[18, 21]
		]),
		dotRadius: .0092,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		dotTone: .1,
		grainTone: .03,
		paperHeight: .2,
		stripeHeight: .28,
		dotHeight: .8,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	josephuscircle: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([
			17,
			19,
			21,
			23,
			24
		]),
		steps: Object.freeze([
			2,
			3,
			4,
			5
		]),
		ringRadius: .37,
		nodeRadius: .047,
		nodeEdge: .0022,
		pixel: .0085,
		bigPixel: .024,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		nodeTone: .86,
		survivorTone: .62,
		edgeTone: .35,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .3,
		nodeHeight: .45,
		edgeHeight: .6,
		inkDepth: .15,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	periodictablecells: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		columns: 18,
		rows: 4,
		top: .06,
		rowPitch: .22,
		symbolPixel: .0062,
		numberPixel: .0042,
		symbolShift: .03,
		numberShift: -.055,
		cellInset: .0018,
		grainCells: 192,
		paperTone: .94,
		firstTone: .9,
		secondTone: .82,
		thirdTone: .7,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		firstHeight: .3,
		secondHeight: .4,
		thirdHeight: .5,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	circleoffifths: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		majorRadius: .385,
		minorRadius: .255,
		signatureRadius: .125,
		majorPixel: .011,
		minorPixel: .0075,
		signaturePixel: .0075,
		rings: Object.freeze([
			.45,
			.32,
			.19
		]),
		ringHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		sectorTone: .9,
		ringTone: .55,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		sectorHeight: .3,
		ringHeight: .5,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	roulettewheel: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		innerRadius: .3,
		outerRadius: .45,
		numberRadius: .375,
		hubRadius: .085,
		rimHalf: .0016,
		spokeHalf: .0011,
		pixel: .0064,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		redTone: .48,
		blackTone: .16,
		greenTone: .78,
		hubTone: .62,
		lineTone: .3,
		lightInk: .96,
		darkInk: .08,
		grainTone: .03,
		paperHeight: .2,
		pocketHeight: .35,
		hubHeight: .55,
		lineHeight: .6,
		inkDepth: .12,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	roundrobintable: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		teamCounts: Object.freeze([8, 10]),
		left: .02,
		top: .035,
		height: .9,
		pixels: Object.freeze([.0095, .007]),
		stripeInset: .006,
		stripeWidth: .96,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		labelTone: .78,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		labelHeight: .42,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	kaprekarsteps: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		columns: 2,
		chains: 2,
		maxSteps: 7,
		left: Object.freeze([.03, .53]),
		top: .03,
		blockPitch: .485,
		linePitch: .062,
		pixel: .0082,
		stripeInset: .006,
		stripeWidth: .46,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		resultTone: .78,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		resultHeight: .42,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	lookandsayrows: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		starts: Object.freeze([
			1,
			2,
			3,
			4,
			5,
			6
		]),
		maxLength: 26,
		maxRows: 11,
		left: .03,
		top: .04,
		rowPitch: .08,
		pixel: .0085,
		stripeInset: .006,
		stripeWidth: .94,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		labelTone: .78,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		labelHeight: .42,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	happynumberchains: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		rows: 12,
		lowest: 2,
		highest: 99,
		maxLength: 34,
		left: .03,
		top: .035,
		rowPitch: .0765,
		pixel: .0064,
		stripeInset: .006,
		stripeWidth: .94,
		grainCells: 192,
		paperTone: .94,
		stripeTone: .9,
		happyTone: .78,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .22,
		stripeHeight: .3,
		happyHeight: .42,
		inkDepth: .06,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	recamanarcs: Object.freeze({
		dark: [
			26,
			32,
			58
		],
		light: [
			246,
			242,
			222
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([
			40,
			50,
			60,
			70
		]),
		left: .03,
		width: .94,
		axis: .5,
		lineHalf: .0016,
		axisHalf: .0011,
		dotRadius: .0034,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		arcTone: .12,
		axisTone: .55,
		grainTone: .03,
		paperHeight: .2,
		arcHeight: .75,
		axisHeight: .4,
		paperRoughness: .74,
		inkRoughness: .4
	}),
	thuemorsegrid: Object.freeze({
		dark: [
			24,
			26,
			34
		],
		light: [
			236,
			232,
			218
		],
		roughness: .6,
		relief: .005,
		sizes: Object.freeze([
			8,
			16,
			32
		]),
		offsets: 256,
		groove: .06,
		edgeSoft: .0012,
		grainCells: 160,
		groutTone: .42,
		darkTone: .1,
		lightTone: .88,
		grainTone: .04,
		groutHeight: .1,
		darkHeight: .62,
		lightHeight: .46,
		groutRoughness: .88,
		darkRoughness: .32,
		lightRoughness: .7
	}),
	digitalroottable: Object.freeze({
		dark: [
			28,
			30,
			44
		],
		light: [
			240,
			234,
			214
		],
		roughness: .6,
		relief: .005,
		sizes: Object.freeze([
			9,
			12,
			18
		]),
		operations: 3,
		groove: .05,
		edgeSoft: .0012,
		pixelFraction: .12,
		grainCells: 160,
		grainTone: .03,
		groutTone: .5,
		lowestTone: .12,
		highestTone: .9,
		inkDarkTone: .05,
		inkLightTone: .97,
		groutHeight: .1,
		faceHeight: .5,
		inkHeight: .7,
		groutRoughness: .9,
		faceRoughness: .62,
		inkRoughness: .4
	}),
	henonattractor: Object.freeze({
		dark: [
			22,
			24,
			52
		],
		light: [
			244,
			240,
			226
		],
		roughness: .55,
		relief: .004,
		maps: Object.freeze([
			Object.freeze([1.4, .3]),
			Object.freeze([1.35, .3]),
			Object.freeze([1.4, .25]),
			Object.freeze([1.2, .3])
		]),
		windowX: 1.35,
		windowY: .45,
		margin: .03,
		gridSize: 256,
		iterations: 6e5,
		warmUp: 200,
		saturation: 8,
		grainCells: 192,
		paperTone: .94,
		inkTone: .1,
		grainTone: .03,
		paperHeight: .2,
		inkHeight: .7,
		paperRoughness: .74,
		inkRoughness: .42
	}),
	golombrulers: Object.freeze({
		dark: [
			30,
			26,
			22
		],
		light: [
			240,
			226,
			188
		],
		roughness: .55,
		relief: .004,
		rulers: Object.freeze([
			Object.freeze([
				0,
				1,
				3
			]),
			Object.freeze([
				0,
				1,
				4,
				6
			]),
			Object.freeze([
				0,
				1,
				4,
				9,
				11
			]),
			Object.freeze([
				0,
				1,
				4,
				10,
				12,
				17
			]),
			Object.freeze([
				0,
				1,
				4,
				10,
				18,
				23,
				25
			]),
			Object.freeze([
				0,
				1,
				4,
				9,
				15,
				22,
				32,
				34
			]),
			Object.freeze([
				0,
				1,
				5,
				12,
				25,
				27,
				35,
				41,
				44
			]),
			Object.freeze([
				0,
				1,
				6,
				10,
				23,
				26,
				34,
				41,
				53,
				55
			]),
			Object.freeze([
				0,
				1,
				4,
				13,
				28,
				33,
				47,
				54,
				64,
				70,
				72
			])
		]),
		left: .05,
		width: .9,
		top: .05,
		rowPitch: .1,
		barHalf: .012,
		markHalf: .0028,
		markReach: .034,
		unitHalf: .0011,
		unitReach: .026,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .92,
		barTone: .7,
		unitTone: .45,
		markTone: .08,
		grainTone: .035,
		paperHeight: .2,
		barHeight: .45,
		unitHeight: .5,
		markHeight: .78,
		paperRoughness: .72,
		inkRoughness: .45
	}),
	bitwisetable: Object.freeze({
		dark: [
			24,
			34,
			40
		],
		light: [
			232,
			238,
			226
		],
		roughness: .6,
		relief: .005,
		sizes: Object.freeze([
			8,
			16,
			32
		]),
		operations: 3,
		groove: .05,
		edgeSoft: .0012,
		bitHalf: .42,
		grainCells: 160,
		grainTone: .03,
		groutTone: .5,
		lowestTone: .12,
		highestTone: .88,
		inkDarkTone: .05,
		inkLightTone: .97,
		groutHeight: .1,
		faceHeight: .5,
		inkHeight: .7,
		groutRoughness: .9,
		faceRoughness: .62,
		inkRoughness: .4
	}),
	peanocurve: Object.freeze({
		dark: [
			20,
			34,
			52
		],
		light: [
			244,
			240,
			224
		],
		roughness: .55,
		relief: .004,
		orders: Object.freeze([
			2,
			3,
			4
		]),
		margin: .04,
		lineHalf: .26,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .93,
		startTone: .06,
		endTone: .55,
		grainTone: .03,
		paperHeight: .2,
		inkHeight: .7,
		paperRoughness: .74,
		inkRoughness: .42
	}),
	cliffordattractor: Object.freeze({
		dark: [
			20,
			22,
			46
		],
		light: [
			246,
			240,
			226
		],
		roughness: .55,
		relief: .004,
		maps: Object.freeze([
			Object.freeze([
				-1.4,
				1.6,
				1,
				.7
			]),
			Object.freeze([
				1.7,
				1.7,
				.6,
				1.2
			]),
			Object.freeze([
				-1.7,
				1.3,
				-.1,
				-1.2
			]),
			Object.freeze([
				-1.7,
				1.8,
				-1.9,
				-.4
			]),
			Object.freeze([
				1.6,
				-.6,
				-1.2,
				1.6
			])
		]),
		margin: .03,
		gridSize: 256,
		iterations: 8e5,
		warmUp: 200,
		saturation: 12,
		grainCells: 192,
		paperTone: .94,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		inkHeight: .7,
		paperRoughness: .74,
		inkRoughness: .42
	}),
	voronoicells: Object.freeze({
		dark: [
			28,
			30,
			38
		],
		light: [
			238,
			232,
			214
		],
		roughness: .6,
		relief: .005,
		counts: Object.freeze([
			5,
			7,
			9
		]),
		jitters: Object.freeze([
			.25,
			.32,
			.38
		]),
		borderHalf: .0024,
		dotRadius: .0065,
		edgeSoft: .0012,
		grainCells: 192,
		lowestTone: .38,
		highestTone: .88,
		borderTone: .26,
		dotTone: .04,
		grainTone: .03,
		borderHeight: .1,
		faceHeight: .5,
		dotHeight: .78,
		borderRoughness: .88,
		faceRoughness: .62,
		dotRoughness: .4
	}),
	euclidsquares: Object.freeze({
		dark: [
			30,
			28,
			44
		],
		light: [
			240,
			234,
			218
		],
		roughness: .6,
		relief: .005,
		rectangles: Object.freeze([
			Object.freeze([57, 22]),
			Object.freeze([43, 16]),
			Object.freeze([49, 19]),
			Object.freeze([58, 35]),
			Object.freeze([60, 24]),
			Object.freeze([55, 21])
		]),
		fill: .94,
		borderHalf: .002,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		firstTone: .3,
		lastTone: .86,
		borderTone: .12,
		grainTone: .03,
		paperHeight: .15,
		squareHeight: .5,
		borderHeight: .1,
		paperRoughness: .74,
		squareRoughness: .58,
		borderRoughness: .88
	}),
	youngtableaux: Object.freeze({
		dark: [
			34,
			30,
			52
		],
		light: [
			242,
			236,
			220
		],
		roughness: .6,
		relief: .005,
		total: 10,
		side: 5,
		panels: 2,
		box: .082,
		pixelFraction: .1,
		lineHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .93,
		lowestTone: .62,
		highestTone: .88,
		lineTone: .12,
		inkTone: .08,
		grainTone: .03,
		paperHeight: .2,
		boxHeight: .5,
		lineHeight: .1,
		inkHeight: .72,
		paperRoughness: .74,
		boxRoughness: .6,
		lineRoughness: .88,
		inkRoughness: .42
	}),
	braiddiagram: Object.freeze({
		dark: [
			28,
			30,
			44
		],
		light: [
			240,
			234,
			218
		],
		roughness: .6,
		relief: .005,
		strands: Object.freeze([
			4,
			5,
			6
		]),
		levelsPerStrand: 3,
		left: .1,
		width: .8,
		top: .05,
		bottom: .95,
		halfWidth: .012,
		outline: .0034,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		firstTone: .3,
		lastTone: .86,
		outlineTone: .08,
		grainTone: .03,
		paperHeight: .15,
		strandHeight: .6,
		outlineHeight: .35,
		paperRoughness: .74,
		strandRoughness: .5
	}),
	countingrods: Object.freeze({
		dark: [
			30,
			26,
			22
		],
		light: [
			236,
			224,
			190
		],
		roughness: .58,
		relief: .004,
		rows: 8,
		places: 5,
		rowTop: .06,
		rowPitch: .11,
		textLeft: .06,
		pixel: .0075,
		rodsLeft: .42,
		placePitch: .105,
		rodHalf: .0028,
		rodGap: .014,
		rodReach: .04,
		barOffset: .032,
		barReach: .032,
		rodsBelowBar: -.012,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .92,
		inkTone: .08,
		stripeTone: .86,
		grainTone: .035,
		paperHeight: .2,
		inkHeight: .72,
		paperRoughness: .72,
		inkRoughness: .42
	}),
	quadtreecells: Object.freeze({
		dark: [
			24,
			34,
			46
		],
		light: [
			236,
			238,
			226
		],
		roughness: .6,
		relief: .005,
		shapes: Object.freeze([
			Object.freeze([
				0,
				.5,
				.5,
				.36,
				0
			]),
			Object.freeze([
				0,
				.38,
				.55,
				.27,
				0
			]),
			Object.freeze([
				0,
				.62,
				.42,
				.31,
				0
			]),
			Object.freeze([
				1,
				.5,
				.5,
				.33,
				.06
			]),
			Object.freeze([
				1,
				.45,
				.52,
				.28,
				.09
			]),
			Object.freeze([
				2,
				.5,
				.5,
				.42,
				.26
			]),
			Object.freeze([
				2,
				.5,
				.5,
				.24,
				.4
			]),
			Object.freeze([
				3,
				1.5,
				.1,
				.2,
				.5
			]),
			Object.freeze([
				3,
				2.5,
				.6,
				.15,
				.45
			]),
			Object.freeze([
				3,
				1,
				.3,
				.28,
				.55
			]),
			Object.freeze([
				4,
				.12,
				.04,
				0,
				0
			]),
			Object.freeze([
				4,
				.33,
				-.08,
				0,
				0
			])
		]),
		minDepth: 2,
		maxDepth: 6,
		lineHalf: .0025,
		lineFraction: .07,
		edgeSoft: .0011,
		grainCells: 192,
		outsideTone: .9,
		insideTone: .62,
		depthShade: .025,
		lineTone: .1,
		grainTone: .03,
		cellHeight: .5,
		lineHeight: .12,
		cellRoughness: .62,
		lineRoughness: .88
	}),
	lsystemplant: Object.freeze({
		dark: [
			24,
			40,
			28
		],
		light: [
			240,
			238,
			220
		],
		roughness: .58,
		relief: .004,
		grammars: Object.freeze([
			Object.freeze([
				`X`,
				`F+[[X]-X]-F[-FX]+X`,
				`FF`,
				25,
				4,
				5
			]),
			Object.freeze([
				`F`,
				``,
				`FF-[-F+F+F]+[+F-F-F]`,
				22.5,
				3,
				4
			]),
			Object.freeze([
				`X`,
				`F[+X]F[-X]+X`,
				`FF`,
				20,
				5,
				6
			]),
			Object.freeze([
				`X`,
				`F[+X][-X]FX`,
				`FF`,
				25.7,
				5,
				6
			])
		]),
		fill: .9,
		bucketCells: 48,
		lineHalf: .0018,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		trunkTone: .1,
		tipTone: .55,
		grainTone: .03,
		paperHeight: .2,
		inkHeight: .7,
		paperRoughness: .74,
		inkRoughness: .45
	}),
	htreefractal: Object.freeze({
		dark: [
			26,
			34,
			52
		],
		light: [
			242,
			238,
			222
		],
		roughness: .58,
		relief: .004,
		depths: Object.freeze([
			6,
			7,
			8,
			9
		]),
		rootHalf: .25,
		ratio: Math.SQRT1_2,
		widthStart: .0034,
		widthFloor: 85e-5,
		widthDecay: .88,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		rootTone: .08,
		leafTone: .5,
		grainTone: .03,
		paperHeight: .2,
		inkHeight: .72,
		paperRoughness: .74,
		inkRoughness: .42
	}),
	wangtiles: Object.freeze({
		dark: [
			28,
			30,
			44
		],
		light: [
			240,
			236,
			220
		],
		roughness: .6,
		relief: .005,
		counts: Object.freeze([
			6,
			8,
			10
		]),
		colourCounts: Object.freeze([3, 4]),
		lineHalf: .0016,
		edgeSoft: .0011,
		grainCells: 192,
		lowTone: .25,
		highTone: .88,
		lineTone: .08,
		grainTone: .03,
		faceHeight: .5,
		lineHeight: .12,
		faceRoughness: .62,
		lineRoughness: .88
	}),
	marchingsquares: Object.freeze({
		dark: [
			24,
			30,
			48
		],
		light: [
			240,
			238,
			224
		],
		roughness: .58,
		relief: .004,
		ballSets: Object.freeze([
			Object.freeze([
				Object.freeze([
					.017,
					.543,
					.127
				]),
				Object.freeze([
					.91,
					.112,
					.115
				]),
				Object.freeze([
					.548,
					.596,
					.141
				]),
				Object.freeze([
					.04,
					.744,
					.157
				]),
				Object.freeze([
					.074,
					.7,
					.111
				])
			]),
			Object.freeze([
				Object.freeze([
					.96,
					.406,
					.156
				]),
				Object.freeze([
					.994,
					.664,
					.108
				]),
				Object.freeze([
					.5,
					.287,
					.108
				]),
				Object.freeze([
					.675,
					.155,
					.078
				]),
				Object.freeze([
					.853,
					.312,
					.071
				]),
				Object.freeze([
					.463,
					.292,
					.122
				])
			]),
			Object.freeze([
				Object.freeze([
					.015,
					.78,
					.097
				]),
				Object.freeze([
					.321,
					.955,
					.119
				]),
				Object.freeze([
					.667,
					.657,
					.126
				]),
				Object.freeze([
					.161,
					.929,
					.139
				]),
				Object.freeze([
					.457,
					.726,
					.1
				]),
				Object.freeze([
					.713,
					.576,
					.139
				]),
				Object.freeze([
					.443,
					.206,
					.111
				])
			]),
			Object.freeze([
				Object.freeze([
					.521,
					.873,
					.105
				]),
				Object.freeze([
					.926,
					.742,
					.083
				]),
				Object.freeze([
					.685,
					.35,
					.102
				]),
				Object.freeze([
					.793,
					.797,
					.086
				]),
				Object.freeze([
					.119,
					.404,
					.149
				]),
				Object.freeze([
					.723,
					.536,
					.092
				]),
				Object.freeze([
					.392,
					.87,
					.143
				])
			]),
			Object.freeze([
				Object.freeze([
					.832,
					.692,
					.118
				]),
				Object.freeze([
					.896,
					.631,
					.153
				]),
				Object.freeze([
					.384,
					.783,
					.144
				]),
				Object.freeze([
					.096,
					.617,
					.125
				]),
				Object.freeze([
					.112,
					.579,
					.15
				]),
				Object.freeze([
					.092,
					.276,
					.14
				])
			]),
			Object.freeze([
				Object.freeze([
					.377,
					.18,
					.095
				]),
				Object.freeze([
					.881,
					.392,
					.14
				]),
				Object.freeze([
					.718,
					.091,
					.136
				]),
				Object.freeze([
					.842,
					.559,
					.089
				]),
				Object.freeze([
					.903,
					.4,
					.088
				]),
				Object.freeze([
					.679,
					.821,
					.16
				]),
				Object.freeze([
					.004,
					.658,
					.072
				])
			]),
			Object.freeze([
				Object.freeze([
					.109,
					.511,
					.152
				]),
				Object.freeze([
					.986,
					.305,
					.101
				]),
				Object.freeze([
					.93,
					.903,
					.087
				]),
				Object.freeze([
					.725,
					.603,
					.108
				]),
				Object.freeze([
					.344,
					.977,
					.139
				]),
				Object.freeze([
					.656,
					.45,
					.113
				])
			]),
			Object.freeze([
				Object.freeze([
					.374,
					.355,
					.155
				]),
				Object.freeze([
					.383,
					.116,
					.126
				]),
				Object.freeze([
					.67,
					.449,
					.147
				]),
				Object.freeze([
					.141,
					.13,
					.124
				]),
				Object.freeze([
					.574,
					.638,
					.111
				]),
				Object.freeze([
					.459,
					.575,
					.102
				])
			]),
			Object.freeze([
				Object.freeze([
					.22,
					.074,
					.159
				]),
				Object.freeze([
					.817,
					.634,
					.111
				]),
				Object.freeze([
					.802,
					.058,
					.136
				]),
				Object.freeze([
					.529,
					.871,
					.104
				]),
				Object.freeze([
					.23,
					.264,
					.155
				])
			]),
			Object.freeze([
				Object.freeze([
					.419,
					.088,
					.14
				]),
				Object.freeze([
					.103,
					.098,
					.115
				]),
				Object.freeze([
					.605,
					.736,
					.146
				]),
				Object.freeze([
					.969,
					.279,
					.138
				]),
				Object.freeze([
					.271,
					.641,
					.147
				]),
				Object.freeze([
					.054,
					.047,
					.141
				]),
				Object.freeze([
					.441,
					.167,
					.09
				])
			])
		]),
		gridSizes: Object.freeze([
			16,
			24,
			32
		]),
		threshold: 1,
		epsilon: 1e-4,
		lineHalf: .0016,
		dotRadius: .0034,
		edgeSoft: .0011,
		grainCells: 192,
		paperTone: .94,
		lineTone: .1,
		insideDotTone: .2,
		outsideDotTone: .62,
		grainTone: .03,
		paperHeight: .2,
		lineHeight: .7,
		paperRoughness: .74,
		lineRoughness: .42
	}),
	tsquarefractal: Object.freeze({
		dark: [
			28,
			30,
			44
		],
		light: [
			244,
			238,
			222
		],
		roughness: .6,
		relief: .004,
		counts: Object.freeze([2, 3]),
		depths: Object.freeze([
			4,
			5,
			6
		]),
		bigSide: .5,
		outlineHalf: .0012,
		outlineShare: .06,
		edgeSoft: .001,
		grainCells: 192,
		paperTone: .94,
		lowTone: .2,
		highTone: .8,
		outlineTone: .08,
		grainTone: .03,
		paperHeight: .15,
		lowHeight: .35,
		highHeight: .95,
		outlineHeight: .05,
		paperRoughness: .74,
		squareRoughness: .5
	}),
	superformulacells: Object.freeze({
		dark: [
			30,
			26,
			40
		],
		light: [
			246,
			240,
			226
		],
		roughness: .6,
		relief: .004,
		counts: Object.freeze([3, 4]),
		shapes: Object.freeze([
			Object.freeze([
				4,
				12,
				15,
				15
			]),
			Object.freeze([
				3,
				5,
				18,
				18
			]),
			Object.freeze([
				5,
				2,
				7,
				7
			]),
			Object.freeze([
				6,
				1,
				1,
				1
			]),
			Object.freeze([
				8,
				.5,
				.5,
				8
			]),
			Object.freeze([
				10,
				1,
				2,
				2
			]),
			Object.freeze([
				7,
				3,
				4,
				4
			]),
			Object.freeze([
				6,
				.5,
				.5,
				.5
			]),
			Object.freeze([
				5,
				.5,
				1.7,
				1.7
			]),
			Object.freeze([
				12,
				2,
				4,
				6
			])
		]),
		scales: Object.freeze([
			.7,
			.85,
			1
		]),
		tones: Object.freeze([
			.2,
			.32,
			.44,
			.56,
			.68,
			.8
		]),
		fill: .9,
		outlineHalf: .0012,
		edgeSoft: .001,
		grainCells: 192,
		paperTone: .94,
		outlineTone: .08,
		grainTone: .03,
		paperHeight: .15,
		lowHeight: .4,
		highHeight: .9,
		outlineHeight: .05,
		paperRoughness: .74,
		shapeRoughness: .5
	}),
	paleygraphmatrix: Object.freeze({
		dark: [
			24,
			28,
			44
		],
		light: [
			244,
			240,
			226
		],
		roughness: .6,
		relief: .004,
		primes: Object.freeze([
			13,
			17,
			29,
			37,
			41,
			53
		]),
		lineHalf: .0012,
		edgeSoft: .001,
		grainCells: 192,
		edgeTone: .22,
		gapTone: .88,
		diagonalTone: .58,
		lineTone: .08,
		grainTone: .03,
		edgeHeight: .8,
		gapHeight: .3,
		diagonalHeight: .5,
		lineHeight: .05,
		edgeRoughness: .45,
		gapRoughness: .75,
		diagonalRoughness: .6
	}),
	candlestickcharts: Object.freeze({
		dark: [
			22,
			28,
			38
		],
		light: [
			246,
			242,
			230
		],
		roughness: .58,
		relief: .004,
		slots: Object.freeze([
			16,
			24,
			32
		]),
		panels: 3,
		low: .12,
		high: .88,
		minStep: .04,
		maxStep: .09,
		minWick: .012,
		maxWick: .05,
		bodyShare: .6,
		wickHalf: .0014,
		edgeSoft: .001,
		grainCells: 192,
		paperTone: .94,
		upTone: .8,
		downTone: .28,
		wickTone: .06,
		grainTone: .03,
		paperHeight: .1,
		upHeight: .7,
		downHeight: .5,
		wickHeight: .9,
		paperRoughness: .75,
		bodyRoughness: .45,
		wickRoughness: .4
	}),
	tetrominoes: Object.freeze({
		dark: [
			28,
			24,
			40
		],
		light: [
			246,
			242,
			228
		],
		roughness: .58,
		relief: .004,
		sizes: Object.freeze([8, 12]),
		shapes: Object.freeze([
			Object.freeze([
				[0, 0],
				[1, 0],
				[2, 0],
				[3, 0]
			]),
			Object.freeze([
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1]
			]),
			Object.freeze([
				[0, 0],
				[1, 0],
				[2, 0],
				[1, 1]
			]),
			Object.freeze([
				[1, 0],
				[2, 0],
				[0, 1],
				[1, 1]
			]),
			Object.freeze([
				[0, 0],
				[1, 0],
				[1, 1],
				[2, 1]
			]),
			Object.freeze([
				[0, 0],
				[0, 1],
				[1, 1],
				[2, 1]
			]),
			Object.freeze([
				[2, 0],
				[0, 1],
				[1, 1],
				[2, 1]
			])
		]),
		tones: Object.freeze([
			.16,
			.28,
			.4,
			.52,
			.64,
			.76,
			.88
		]),
		tries: 50,
		steps: 2e4,
		lineHalf: .0016,
		edgeSoft: .001,
		grainCells: 192,
		lineTone: .05,
		grainTone: .03,
		lowHeight: .35,
		highHeight: .9,
		lineHeight: .05,
		pieceRoughness: .5,
		lineRoughness: .7
	}),
	errordiffusion: Object.freeze({
		dark: [
			20,
			22,
			34
		],
		light: [
			248,
			244,
			230
		],
		roughness: .6,
		relief: .004,
		sizes: Object.freeze([
			48,
			64,
			96
		]),
		kernels: Object.freeze([
			Object.freeze({
				divisor: 16,
				taps: Object.freeze([
					[
						1,
						0,
						7
					],
					[
						-1,
						1,
						3
					],
					[
						0,
						1,
						5
					],
					[
						1,
						1,
						1
					]
				])
			}),
			Object.freeze({
				divisor: 8,
				taps: Object.freeze([
					[
						1,
						0,
						1
					],
					[
						2,
						0,
						1
					],
					[
						-1,
						1,
						1
					],
					[
						0,
						1,
						1
					],
					[
						1,
						1,
						1
					],
					[
						0,
						2,
						1
					]
				])
			}),
			Object.freeze({
				divisor: 48,
				taps: Object.freeze([
					[
						1,
						0,
						7
					],
					[
						2,
						0,
						5
					],
					[
						-2,
						1,
						3
					],
					[
						-1,
						1,
						5
					],
					[
						0,
						1,
						7
					],
					[
						1,
						1,
						5
					],
					[
						2,
						1,
						3
					],
					[
						-2,
						2,
						1
					],
					[
						-1,
						2,
						3
					],
					[
						0,
						2,
						5
					],
					[
						1,
						2,
						3
					],
					[
						2,
						2,
						1
					]
				])
			}),
			Object.freeze({
				divisor: 42,
				taps: Object.freeze([
					[
						1,
						0,
						8
					],
					[
						2,
						0,
						4
					],
					[
						-2,
						1,
						2
					],
					[
						-1,
						1,
						4
					],
					[
						0,
						1,
						8
					],
					[
						1,
						1,
						4
					],
					[
						2,
						1,
						2
					],
					[
						-2,
						2,
						1
					],
					[
						-1,
						2,
						2
					],
					[
						0,
						2,
						4
					],
					[
						1,
						2,
						2
					],
					[
						2,
						2,
						1
					]
				])
			}),
			Object.freeze({
				divisor: 32,
				taps: Object.freeze([
					[
						1,
						0,
						8
					],
					[
						2,
						0,
						4
					],
					[
						-2,
						1,
						2
					],
					[
						-1,
						1,
						4
					],
					[
						0,
						1,
						8
					],
					[
						1,
						1,
						4
					],
					[
						2,
						1,
						2
					]
				])
			}),
			Object.freeze({
				divisor: 32,
				taps: Object.freeze([
					[
						1,
						0,
						5
					],
					[
						2,
						0,
						3
					],
					[
						-2,
						1,
						2
					],
					[
						-1,
						1,
						4
					],
					[
						0,
						1,
						5
					],
					[
						1,
						1,
						4
					],
					[
						2,
						1,
						2
					],
					[
						-1,
						2,
						2
					],
					[
						0,
						2,
						3
					],
					[
						1,
						2,
						2
					]
				])
			})
		]),
		pictures: Object.freeze([
			Object.freeze([
				1,
				1,
				.1,
				.35,
				.26,
				.2,
				.04
			]),
			Object.freeze([
				2,
				1,
				.6,
				.05,
				.22,
				.24,
				.02
			]),
			Object.freeze([
				1,
				2,
				.3,
				.8,
				.3,
				.16,
				.03
			]),
			Object.freeze([
				2,
				2,
				.45,
				.2,
				.2,
				.2,
				.08
			])
		]),
		edgeSoft: 8e-4,
		grainCells: 192,
		offTone: .14,
		onTone: .9,
		grainTone: .02,
		offHeight: .2,
		onHeight: .8,
		offRoughness: .7,
		onRoughness: .5
	}),
	worleycells: Object.freeze({
		dark: [
			18,
			24,
			40
		],
		light: [
			244,
			240,
			226
		],
		roughness: .6,
		relief: .004,
		sizes: Object.freeze([
			6,
			8,
			10
		]),
		jitters: Object.freeze([
			.5,
			.7,
			.9
		]),
		metrics: 3,
		modes: 4,
		reach: 1.1,
		domeReach: .8,
		lowTone: .1,
		highTone: .94,
		grainCells: 192,
		grainTone: .025,
		lowHeight: .1,
		highHeight: 1,
		domeRoughness: .45,
		flatRoughness: .8
	}),
	equalizerbars: Object.freeze({
		dark: [
			12,
			14,
			20
		],
		light: [
			236,
			244,
			232
		],
		roughness: .5,
		relief: .004,
		bands: Object.freeze([
			16,
			24,
			32
		]),
		rows: Object.freeze([
			16,
			20,
			24
		]),
		firstFrequencies: Object.freeze([1, 2]),
		secondFrequencies: Object.freeze([3, 5]),
		firstAmplitude: .32,
		secondAmplitude: .18,
		scatter: .3,
		minLevel: .12,
		maxLevel: .9,
		insetX: .18,
		insetY: .22,
		lowShare: .6,
		midShare: .25,
		edgeSoft: .001,
		grainCells: 192,
		gapTone: .05,
		offTone: .2,
		lowTone: .58,
		midTone: .78,
		highTone: .95,
		grainTone: .02,
		gapHeight: .05,
		offHeight: .3,
		litHeight: .85,
		offRoughness: .8,
		litRoughness: .35,
		gapRoughness: .9
	}),
	intelhexrecords: Object.freeze({
		dark: [
			16,
			20,
			30
		],
		light: [
			246,
			242,
			228
		],
		roughness: .6,
		relief: .004,
		bitmaps: Object.freeze([
			`000010000010000`,
			`111101101101111`,
			`010110010010111`,
			`111001111100111`,
			`111001111001111`,
			`101101111001001`,
			`111100111001111`,
			`111100111101111`,
			`111001010010010`,
			`111101111101111`,
			`111101111001111`,
			`010101111101101`,
			`110101110101110`,
			`011100100100011`,
			`110101101101110`,
			`111100110100111`,
			`111100110100100`
		]),
		dataLines: 27,
		bytesPerLine: 16,
		maxAddress: 4064,
		edgeSoft: 4e-4,
		grainCells: 192,
		paperTone: .94,
		fieldTones: Object.freeze([
			.1,
			.24,
			.38,
			.52,
			.16,
			.66
		]),
		grainTone: .02,
		paperHeight: .1,
		inkHeight: .8,
		paperRoughness: .75,
		inkRoughness: .45
	}),
	flagpatterns: Object.freeze({
		dark: [
			20,
			22,
			32
		],
		light: [
			244,
			240,
			226
		],
		roughness: .65,
		relief: .004,
		grids: Object.freeze([3, 4]),
		designs: 8,
		aspect: 1.5,
		margin: .07,
		tones: Object.freeze([
			.08,
			.22,
			.34,
			.7,
			.82,
			.94
		]),
		crossHalf: .1,
		crossInnerHalf: .045,
		crossCentreX: .55,
		saltireHalf: .09,
		discRadius: .3,
		stripes: 7,
		cantonWidth: .6,
		cantonHeight: 4 / 7,
		outlineHalf: .0016,
		edgeSoft: .001,
		grainCells: 192,
		clothTone: .52,
		outlineTone: .04,
		grainTone: .025,
		clothHeight: .2,
		flagHeight: .65,
		outlineHeight: .05,
		clothRoughness: .85,
		flagRoughness: .55
	}),
	gaugedials: Object.freeze({
		dark: [
			16,
			18,
			24
		],
		light: [
			246,
			242,
			228
		],
		roughness: .5,
		relief: .004,
		grids: Object.freeze([2, 3]),
		startAngle: -.75 * Math.PI,
		sweepAngle: 1.5 * Math.PI,
		majorTicks: 10,
		minorPerMajor: 5,
		bezelRadius: .46,
		faceRadius: .43,
		zoneInner: .3,
		zoneOuter: .34,
		zoneTones: Object.freeze([
			.5,
			.7,
			.12
		]),
		firstBorder: Object.freeze([.5, .7]),
		secondBorder: Object.freeze([.75, .9]),
		majorStart: .35,
		minorStart: .37,
		tickEnd: .4,
		majorHalf: .006,
		minorHalf: .003,
		needleLength: .32,
		needleTail: .06,
		needleHalf: .008,
		needleRange: Object.freeze([.05, .95]),
		hubRadius: .035,
		edgeSoft: 8e-4,
		grainCells: 192,
		clothTone: .6,
		bezelTone: .25,
		faceTone: .93,
		tickTone: .1,
		needleTone: .05,
		grainTone: .03,
		clothHeight: .2,
		bezelHeight: .85,
		faceHeight: .5,
		tickHeight: .6,
		needleHeight: .95,
		clothRoughness: .85,
		bezelRoughness: .3,
		faceRoughness: .35
	}),
	qrcodemodules: Object.freeze({
		dark: [
			12,
			12,
			16
		],
		light: [
			248,
			246,
			238
		],
		roughness: .6,
		relief: .004,
		versions: Object.freeze([
			1,
			2,
			3
		]),
		quietModules: 4,
		darkShare: .5,
		edgeSoft: 4e-4,
		inkTone: .05,
		paperTone: .95,
		inkHeight: .75,
		paperHeight: .25,
		inkRoughness: .45,
		paperRoughness: .8
	}),
	mahjongdots: Object.freeze({
		dark: [
			18,
			30,
			24
		],
		light: [
			244,
			242,
			230
		],
		roughness: .45,
		relief: .004,
		grids: Object.freeze([3, 4]),
		tileWidth: .675,
		tileHeight: .9,
		cornerRadius: .05,
		rimWidth: .03,
		layouts: Object.freeze([
			Object.freeze([[.5, .5]]),
			Object.freeze([[.5, .3], [.5, .7]]),
			Object.freeze([
				[.28, .2],
				[.5, .5],
				[.72, .8]
			]),
			Object.freeze([
				[.3, .3],
				[.7, .3],
				[.3, .7],
				[.7, .7]
			]),
			Object.freeze([
				[.3, .3],
				[.7, .3],
				[.5, .5],
				[.3, .7],
				[.7, .7]
			]),
			Object.freeze([
				[.3, .2],
				[.7, .2],
				[.3, .5],
				[.7, .5],
				[.3, .8],
				[.7, .8]
			]),
			Object.freeze([
				[.22, .14],
				[.5, .26],
				[.78, .38],
				[.3, .66],
				[.7, .66],
				[.3, .86],
				[.7, .86]
			]),
			Object.freeze([
				[.3, .15],
				[.7, .15],
				[.3, .38],
				[.7, .38],
				[.3, .62],
				[.7, .62],
				[.3, .85],
				[.7, .85]
			]),
			Object.freeze([
				[.22, .2],
				[.5, .2],
				[.78, .2],
				[.22, .5],
				[.5, .5],
				[.78, .5],
				[.22, .8],
				[.5, .8],
				[.78, .8]
			])
		]),
		dotRadius: .13,
		bigDotRadius: .3,
		centreShare: .35,
		gapShare: .6,
		ringTones: Object.freeze([
			.1,
			.22,
			.34
		]),
		centreTones: Object.freeze([.46, .58]),
		faceTone: .93,
		rimTone: .62,
		clothTone: .36,
		grainTone: .04,
		grainCells: 192,
		edgeSoft: 8e-4,
		clothHeight: .1,
		tileHeightLevel: .7,
		dotHeight: .6,
		clothRoughness: .9,
		tileRoughness: .3
	}),
	smithchart: Object.freeze({
		dark: [
			14,
			18,
			30
		],
		light: [
			244,
			240,
			226
		],
		roughness: .55,
		relief: .004,
		chartRadius: .46,
		resistances: Object.freeze([
			0,
			.2,
			.5,
			1,
			2,
			5
		]),
		reactances: Object.freeze([
			.2,
			.5,
			1,
			2,
			5
		]),
		swrRadii: Object.freeze([
			.3,
			.5,
			.7
		]),
		dotRadius: .045,
		lineHalf: .0016,
		swrHalf: .004,
		radialHalf: .0025,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .94,
		clothTone: .6,
		lineTone: .32,
		swrTone: .08,
		grainTone: .03,
		clothHeight: .15,
		paperHeight: .4,
		lineHeight: .6,
		swrHeight: .85,
		clothRoughness: .85,
		paperRoughness: .55,
		inkRoughness: .4
	}),
	compassrose: Object.freeze({
		dark: [
			20,
			24,
			36
		],
		light: [
			246,
			241,
			224
		],
		roughness: .55,
		relief: .004,
		points: 16,
		lengths: Object.freeze([
			.33,
			.25,
			.17
		]),
		baseHalves: Object.freeze([
			.045,
			.034,
			.022
		]),
		turnStep: 5 * Math.PI / 180,
		turnSteps: 18,
		centreRadius: .03,
		centreHalf: .004,
		ringRadius: .46,
		ringHalf: .002,
		tickStep: 5 * Math.PI / 180,
		tickCount: 72,
		minorStart: .42,
		mediumStart: .39,
		longStart: .36,
		minorHalf: .0025,
		mediumHalf: .0035,
		longHalf: .0045,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .94,
		inkTone: .12,
		halfTone: .55,
		grainTone: .03,
		paperHeight: .3,
		inkHeight: .8,
		halfHeight: .6,
		paperRoughness: .7,
		inkRoughness: .4
	}),
	windbarbs: Object.freeze({
		dark: [
			18,
			26,
			40
		],
		light: [
			244,
			242,
			232
		],
		roughness: .55,
		relief: .004,
		grids: Object.freeze([3, 4]),
		maxSpeed: 65,
		speedStep: 5,
		directionStep: 10 * Math.PI / 180,
		directions: 36,
		ringRadius: .05,
		calmRadius: .085,
		ringHalf: .006,
		staffStart: .05,
		staffLength: .38,
		staffHalf: .005,
		slot: .055,
		flagWidth: .05,
		flagHeight: .09,
		longBarbBack: .05,
		longBarbSide: .09,
		shortBarbBack: .025,
		shortBarbSide: .045,
		barbHalf: .005,
		edgeSoft: 8e-4,
		grainCells: 192,
		paperTone: .94,
		inkTone: .1,
		grainTone: .03,
		paperHeight: .3,
		inkHeight: .8,
		paperRoughness: .7,
		inkRoughness: .4
	}),
	rankchevrons: Object.freeze({
		dark: [
			24,
			30,
			20
		],
		light: [
			236,
			232,
			210
		],
		roughness: .75,
		relief: .005,
		grids: Object.freeze([3, 4]),
		maxChevrons: 4,
		maxRockers: 2,
		patchRadius: .45,
		rimRadius: .4,
		rimHalf: .008,
		chevronApex: -.24,
		chevronPitch: .075,
		chevronSlope: .45,
		chevronReach: .26,
		chevronThick: .06,
		rockerBase: .2,
		rockerPitch: .07,
		rockerDepth: .04,
		rockerReach: .2,
		rockerThick: .03,
		pipY: -.325,
		pipRadius: .03,
		edgeSoft: 8e-4,
		grainCells: 192,
		clothTone: .6,
		patchTone: .3,
		inkTone: .86,
		grainTone: .04,
		clothHeight: .1,
		patchHeight: .4,
		inkHeight: .8,
		clothRoughness: .9,
		patchRoughness: .8,
		inkRoughness: .65
	}),
	segmenttree: Object.freeze({
		dark: [
			20,
			22,
			30
		],
		light: [
			236,
			232,
			220
		],
		roughness: .6,
		relief: .004,
		depths: Object.freeze([
			3,
			4,
			5
		]),
		valueMin: .1,
		valueMax: .9,
		minRange: 3,
		gapX: .004,
		gapY: .01,
		outline: .005,
		edgeSoft: 6e-4,
		grainCells: 192,
		gapTone: .62,
		outlineTone: .02,
		grainTone: .04,
		boxHeight: .7,
		gapHeight: .1,
		outlineHeight: .95,
		boxRoughness: .4,
		gapRoughness: .9
	}),
	vicsekfractal: Object.freeze({
		dark: [
			20,
			24,
			36
		],
		light: [
			240,
			236,
			222
		],
		roughness: .55,
		relief: .004,
		depths: Object.freeze([3, 4]),
		inset: .05,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .94,
		cellLight: .5,
		cellDark: .06,
		grainTone: .03,
		paperHeight: .2,
		cellHeight: .7,
		paperRoughness: .8,
		cellRoughness: .4
	}),
	jacobisymbols: Object.freeze({
		dark: [
			18,
			22,
			34
		],
		light: [
			240,
			236,
			220
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([24, 32]),
		startSteps: 4,
		inset: .08,
		edgeSoft: 6e-4,
		grainCells: 192,
		plusTone: .9,
		minusTone: .1,
		zeroTone: .5,
		gapTone: .62,
		grainTone: .03,
		gapHeight: .15,
		cellHeight: .7,
		gapRoughness: .85,
		cellRoughness: .4
	}),
	fenwicktree: Object.freeze({
		dark: [
			20,
			22,
			30
		],
		light: [
			236,
			232,
			220
		],
		roughness: .6,
		relief: .004,
		sizes: Object.freeze([16, 32]),
		gapX: .003,
		gapY: .012,
		outline: .004,
		edgeSoft: 6e-4,
		grainCells: 192,
		lowTone: .55,
		highTone: .82,
		queryTone: .02,
		updateTone: .98,
		groundTone: .3,
		grainTone: .04,
		barHeight: .7,
		groundHeight: .1,
		outlineHeight: .95,
		barRoughness: .4,
		groundRoughness: .9
	}),
	semaphorefigures: Object.freeze({
		dark: [
			22,
			26,
			40
		],
		light: [
			240,
			236,
			220
		],
		roughness: .55,
		relief: .004,
		grids: Object.freeze([3, 4]),
		directions: 8,
		headY: -.26,
		headRadius: .05,
		torsoTop: -.2,
		torsoBottom: .12,
		torsoHalf: .014,
		shoulderX: .06,
		shoulderY: -.16,
		armLength: .2,
		armHalf: .011,
		flagGap: .02,
		flagHalf: .05,
		edgeSoft: 8e-4,
		grainCells: 192,
		paperTone: .93,
		inkTone: .1,
		flagLight: .7,
		flagDark: .28,
		grainTone: .03,
		paperHeight: .2,
		inkHeight: .8,
		flagHeight: .6,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	hofstadterq: Object.freeze({
		dark: [
			20,
			24,
			38
		],
		light: [
			240,
			236,
			222
		],
		roughness: .55,
		relief: .004,
		terms: 128,
		starts: Object.freeze([
			1,
			129,
			257,
			513,
			1025,
			2049
		]),
		margin: .08,
		dotRadius: .006,
		rulings: 8,
		rulingHalf: .0012,
		guideHalf: .0016,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		rulingTone: .62,
		guideTone: .45,
		dotLow: .08,
		dotHigh: .3,
		grainTone: .03,
		paperHeight: .2,
		rulingHeight: .35,
		guideHeight: .5,
		dotHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	countertimings: Object.freeze({
		dark: [
			18,
			24,
			34
		],
		light: [
			238,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		periods: 16,
		rows: 5,
		highAt: .24,
		lowAt: .76,
		lineHalf: .0035,
		guideHalf: 9e-4,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		guideTone: .76,
		inkLow: .08,
		inkStep: .08,
		grainTone: .03,
		paperHeight: .2,
		guideHeight: .35,
		inkHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	qamconstellation: Object.freeze({
		dark: [
			20,
			26,
			40
		],
		light: [
			240,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			2,
			4,
			8
		]),
		dotY: .28,
		dotRadius: .13,
		bitRowI: .58,
		bitRowQ: .82,
		bitSpacing: .27,
		bitHalf: .09,
		frameWidth: .035,
		axisHalf: .004,
		gridHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTones: Object.freeze([
			.93,
			.89,
			.85,
			.81
		]),
		gridTone: .65,
		axisTone: .45,
		dotTone: .38,
		bitTone: .1,
		grainTone: .03,
		paperHeight: .2,
		gridHeight: .3,
		axisHeight: .4,
		dotHeight: .7,
		bitHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	chorddiagrams: Object.freeze({
		dark: [
			24,
			22,
			30
		],
		light: [
			242,
			236,
			222
		],
		roughness: .55,
		relief: .004,
		grids: Object.freeze([2, 3]),
		chords: Object.freeze([
			Object.freeze([
				-1,
				3,
				2,
				0,
				1,
				0
			]),
			Object.freeze([
				3,
				2,
				0,
				0,
				0,
				3
			]),
			Object.freeze([
				-1,
				-1,
				0,
				2,
				3,
				2
			]),
			Object.freeze([
				-1,
				0,
				2,
				2,
				2,
				0
			]),
			Object.freeze([
				0,
				2,
				2,
				1,
				0,
				0
			]),
			Object.freeze([
				-1,
				0,
				2,
				2,
				1,
				0
			]),
			Object.freeze([
				0,
				2,
				2,
				0,
				0,
				0
			]),
			Object.freeze([
				-1,
				-1,
				0,
				2,
				3,
				1
			]),
			Object.freeze([
				1,
				3,
				3,
				2,
				1,
				1
			]),
			Object.freeze([
				-1,
				2,
				4,
				4,
				3,
				2
			])
		]),
		strings: 6,
		frets: 5,
		stringLeft: .2,
		stringSpacing: .12,
		boxTop: .3,
		fretSpacing: .12,
		markerY: .18,
		markerRadius: .04,
		markerHalf: .007,
		dotRadius: .047,
		stringHalf: .006,
		fretHalf: .004,
		nutHalf: .015,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		lineTone: .4,
		nutTone: .12,
		markerTone: .3,
		dotTone: .1,
		grainTone: .03,
		paperHeight: .2,
		lineHeight: .4,
		nutHeight: .7,
		markerHeight: .6,
		dotHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	waterfallchart: Object.freeze({
		dark: [
			22,
			26,
			38
		],
		light: [
			240,
			236,
			222
		],
		roughness: .55,
		relief: .004,
		steps: Object.freeze([
			6,
			10,
			14
		]),
		startMin: 30,
		startSpan: 40,
		stepMin: 3,
		stepSpan: 16,
		floor: 10,
		ceiling: 90,
		top: .08,
		bottom: .92,
		barHalf: .35,
		connectorHalf: .0012,
		gridHalf: 8e-4,
		gridEvery: 10,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		gridTone: .8,
		baseTone: .5,
		connectorTone: .5,
		endTone: .4,
		upTone: .66,
		downTone: .2,
		grainTone: .03,
		paperHeight: .2,
		gridHeight: .3,
		baseHeight: .4,
		connectorHeight: .45,
		endHeight: .7,
		stepHeight: .8,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	intervalpartition: Object.freeze({
		dark: [
			20,
			28,
			36
		],
		light: [
			240,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		timeUnits: 64,
		lanes: 6,
		maxIntervals: 28,
		maxGap: 4,
		minLength: 3,
		lengthSpan: 12,
		lanesTop: .04,
		laneHeight: .12,
		barHalf: .04,
		barGap: .0015,
		stripBottom: .96,
		stripUnit: .026,
		stripGap: 6e-4,
		guideEvery: 8,
		guideHalf: 8e-4,
		separatorHalf: 8e-4,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		guideTone: .84,
		separatorTone: .86,
		laneLow: .15,
		laneStep: .09,
		stripTone: .45,
		grainTone: .03,
		paperHeight: .2,
		guideHeight: .28,
		separatorHeight: .3,
		barHeight: .8,
		stripHeight: .6,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	ecdfplot: Object.freeze({
		dark: [
			20,
			26,
			40
		],
		light: [
			240,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([
			8,
			12,
			16,
			20
		]),
		positions: 256,
		firstAt: 14,
		span: 226,
		minStep: 4,
		top: .08,
		bottom: .84,
		rugTop: .88,
		rugBottom: .96,
		tickHalf: .0012,
		lineHalf: .0016,
		dotRadius: .006,
		ringHalf: .0012,
		guideHalf: 8e-4,
		guides: Object.freeze([
			.25,
			.5,
			.75
		]),
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		guideTone: .82,
		tickTone: .3,
		inkTone: .14,
		grainTone: .03,
		paperHeight: .2,
		guideHeight: .28,
		tickHeight: .6,
		inkHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	spanningtree: Object.freeze({
		dark: [
			18,
			24,
			36
		],
		light: [
			240,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([
			8,
			12,
			16
		]),
		lattice: 24,
		margin: 1,
		nodeRadius: .014,
		edgeHalf: .0022,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		nodeTone: .08,
		edgeFirst: .25,
		edgeLast: .65,
		grainTone: .03,
		paperHeight: .2,
		edgeHeight: .6,
		nodeHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	kdtreesplits: Object.freeze({
		dark: [
			20,
			26,
			40
		],
		light: [
			240,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([15, 31]),
		nodeRadius: .011,
		rootHalf: .0032,
		depthShrink: 4e-4,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		nodeTone: .06,
		lineFirst: .14,
		lineLast: .62,
		grainTone: .03,
		paperHeight: .2,
		lineHeight: .6,
		nodeHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	bsttreeorder: Object.freeze({
		dark: [
			20,
			26,
			40
		],
		light: [
			240,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([
			11,
			15,
			19
		]),
		maxDepth: 6,
		top: .07,
		levelStep: .12,
		nodeRadius: .016,
		edgeHalf: .0022,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		edgeTone: .55,
		nodeFirst: .1,
		nodeLast: .7,
		grainTone: .03,
		paperHeight: .2,
		edgeHeight: .5,
		nodeHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	karnaughmap: Object.freeze({
		dark: [
			20,
			26,
			40
		],
		light: [
			240,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		variables: Object.freeze([3, 4]),
		mapLeft: .23,
		mapTop: .3,
		cell: .1,
		fillInset: .012,
		labelHalf: .014,
		labelSpread: .0225,
		labelFrame: .005,
		labelColumnY: .24,
		labelRowX: .14,
		stripX: .86,
		stripTop: .12,
		stripSpan: .74,
		gridHalf: .0011,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		gridTone: .6,
		fillTone: .15,
		labelTone: .3,
		stripTone: .45,
		grainTone: .03,
		paperHeight: .2,
		gridHeight: .3,
		fillHeight: .8,
		labelHeight: .6,
		stripHeight: .7,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	nearesttour: Object.freeze({
		dark: [
			18,
			24,
			36
		],
		light: [
			240,
			236,
			224
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([
			8,
			10,
			12
		]),
		lattice: 24,
		margin: 1,
		nodeRadius: .013,
		startRing: .024,
		ringHalf: .0016,
		legHalf: .0024,
		clearance: .02,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		nodeTone: .08,
		ringTone: .04,
		legFirst: .2,
		legLast: .66,
		grainTone: .03,
		paperHeight: .2,
		legHeight: .6,
		ringHeight: .5,
		nodeHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	editdistance: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		lengths: Object.freeze([
			4,
			5,
			6,
			7
		]),
		alphabet: 3,
		origin: .05,
		cell: .1,
		fillHalf: .044,
		frameRadius: .036,
		frameHalf: .0032,
		dotPitch: .026,
		dotRadius: .0105,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		valueLightest: .86,
		valueStep: .09,
		frameTone: .04,
		dotTone: .1,
		grainTone: .03,
		paperHeight: .2,
		fillHeight: .4,
		frameHeight: .7,
		dotHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	hashchains: Object.freeze({
		dark: [
			22,
			30,
			46
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		buckets: Object.freeze([
			6,
			7,
			8
		]),
		keyCounts: Object.freeze([
			10,
			14,
			18
		]),
		keyBits: 7,
		maxChain: 5,
		top: .07,
		rowPitch: .1,
		slotX: .06,
		slotHalf: .028,
		linkHalf: .0016,
		boxLeft: .13,
		boxWidth: .128,
		boxPitch: .157,
		boxHalfHeight: .032,
		frameWidth: .004,
		bitInset: .008,
		bitHalf: .0058,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		slotTone: .55,
		linkTone: .4,
		rankFirst: .2,
		rankLast: .62,
		bitTone: .1,
		grainTone: .03,
		paperHeight: .2,
		slotHeight: .45,
		linkHeight: .5,
		frameHeight: .65,
		bitHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	huffmancodes: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([
			5,
			6,
			7
		]),
		maxFrequency: 30,
		top: .09,
		rowPitch: .11,
		barX: .05,
		unit: .0115,
		barHalf: .028,
		bitX: .5,
		bitPitch: .06,
		bitHalf: .021,
		ringWidth: .004,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		barTone: .4,
		bitOnTone: .1,
		ringTone: .45,
		grainTone: .03,
		paperHeight: .2,
		barHeight: .5,
		bitOnHeight: .85,
		ringHeight: .65,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	bodeplots: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		types: Object.freeze([
			0,
			1,
			2,
			3
		]),
		cornerExponents: Object.freeze([
			1,
			1.25,
			1.5,
			1.75,
			2
		]),
		qualities: Object.freeze([
			.5,
			.707,
			1,
			2,
			4
		]),
		decades: 3,
		left: .1,
		right: .94,
		gainTop: .08,
		gainBottom: .48,
		gainMax: 20,
		gainMin: -60,
		gainStep: 20,
		phaseTop: .56,
		phaseBottom: .92,
		phaseRange: 180,
		phaseStep: 90,
		gridHalf: .0011,
		curveHalf: .0034,
		table: 1024,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		gridTone: .65,
		curveTone: .08,
		grainTone: .03,
		paperHeight: .2,
		gridHeight: .4,
		curveHeight: .8,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	sankeyflows: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		middleCounts: Object.freeze([3, 4]),
		maxFlow: 3,
		unit: .02,
		nodeGap: .035,
		centre: .5,
		nodeX: Object.freeze([
			.1,
			.485,
			.87
		]),
		nodeWidth: .03,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		nodeTone: .12,
		bandFirst: .3,
		bandStep: .035,
		grainTone: .03,
		paperHeight: .2,
		bandHeight: .45,
		nodeHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	histogrambins: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		valueCounts: Object.freeze([
			20,
			28,
			36
		]),
		binCounts: Object.freeze([
			8,
			10,
			12
		]),
		places: 280,
		minGap: 2,
		left: .08,
		right: .92,
		baseline: .72,
		unit: .04,
		barGap: .004,
		baselineHalf: .0014,
		baselineOverhang: .006,
		edgeMarkHalf: .0012,
		edgeMarkLength: .02,
		rugTop: .8,
		rugBottom: .88,
		tickHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		barTone: .38,
		baselineTone: .55,
		markTone: .5,
		tickTone: .1,
		grainTone: .03,
		paperHeight: .2,
		barHeight: .5,
		baselineHeight: .4,
		tickHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	zordercurve: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([4, 8]),
		variants: 8,
		origin: .07,
		span: .86,
		nodeRadius: .0125,
		segmentHalf: .0035,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		nodeTone: .08,
		rampFirst: .18,
		rampLast: .7,
		grainTone: .03,
		paperHeight: .2,
		segmentHeight: .55,
		nodeHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	lorenzcurve: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		counts: Object.freeze([
			8,
			10,
			12
		]),
		maxIncome: 20,
		plotLeft: .2,
		plotTop: .08,
		side: .6,
		barBase: .92,
		unit: .008,
		barGap: .004,
		frameHalf: .0014,
		diagonalHalf: .0014,
		curveHalf: .003,
		dotRadius: .0075,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		frameTone: .6,
		diagonalTone: .55,
		fillTone: .8,
		curveTone: .1,
		dotTone: .08,
		barTone: .4,
		grainTone: .03,
		paperHeight: .2,
		frameHeight: .4,
		fillHeight: .3,
		curveHeight: .7,
		dotHeight: .85,
		barHeight: .5,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	ganttschedule: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		taskCounts: Object.freeze([
			6,
			7,
			8
		]),
		horizon: 16,
		minDuration: 1,
		maxDuration: 4,
		left: .1,
		unit: .05,
		top: .08,
		rowPitch: .105,
		barHalf: .028,
		linkHalf: .0016,
		dotRadius: .0065,
		gridHalf: 8e-4,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		gridTone: .8,
		linkTone: .5,
		barTone: .35,
		dotTone: .08,
		grainTone: .03,
		paperHeight: .2,
		gridHeight: .3,
		linkHeight: .45,
		barHeight: .6,
		dotHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	quicksortsteps: Object.freeze({
		dark: [
			20,
			28,
			44
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			8,
			9,
			10
		]),
		left: .1,
		barPitch: .08,
		barWidth: .06,
		unit: .0064,
		top: .04,
		rowPitch: .086,
		baseOffset: .08,
		bracketOffset: .004,
		bracketHalf: .0016,
		dotOffset: .0105,
		dotRadius: .0045,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		barTone: .45,
		placedTone: .15,
		bracketTone: .6,
		dotTone: .08,
		grainTone: .03,
		paperHeight: .2,
		barHeight: .5,
		placedHeight: .75,
		bracketHeight: .4,
		dotHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	binarysearchsteps: Object.freeze({
		dark: [
			24,
			34,
			52
		],
		light: [
			244,
			240,
			228
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			12,
			14,
			16
		]),
		left: .07,
		barPitch: .055,
		barWidth: .04,
		unit: .0023,
		maxStep: 2,
		top: .03,
		rowPitch: .092,
		baseOffset: .084,
		tickLeft: .025,
		tickRight: .062,
		tickHalf: .0015,
		dotOffset: .004,
		dotRadius: .0035,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .93,
		outTone: .75,
		inTone: .45,
		middleTone: .15,
		tickTone: .55,
		dotTone: .08,
		grainTone: .03,
		paperHeight: .2,
		outHeight: .35,
		inHeight: .5,
		middleHeight: .75,
		tickHeight: .4,
		dotHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	dijkstragrid: Object.freeze({
		dark: [
			28,
			30,
			46
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			7,
			8,
			9
		]),
		pitch: .097,
		cellHalf: .0455,
		costs: Object.freeze([
			1,
			2,
			3,
			4,
			20
		]),
		costTones: Object.freeze([
			.86,
			.7,
			.55,
			.4,
			.22
		]),
		costHeights: Object.freeze([
			.3,
			.4,
			.5,
			.6,
			.7
		]),
		wallShare: .3,
		pathHalf: .0055,
		startRadius: .016,
		goalRadius: .028,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		pathTone: .06,
		grainTone: .03,
		paperHeight: .2,
		pathHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	kmpfailure: Object.freeze({
		dark: [
			30,
			38,
			56
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		groups: 3,
		sizes: Object.freeze([
			8,
			9,
			10
		]),
		minPeriod: 2,
		maxPeriod: 4,
		left: .125,
		pitch: .075,
		cellWidth: .066,
		cellHeight: .05,
		barWidth: .044,
		unit: .01,
		top: .07,
		groupPitch: .29,
		groupSlack: .02,
		ruleGap: .012,
		ruleHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .95,
		letterTones: Object.freeze([.3, .62]),
		letterHeights: Object.freeze([.55, .45]),
		ruleTone: .5,
		barTone: .15,
		grainTone: .03,
		paperHeight: .2,
		ruleHeight: .4,
		barHeight: .75,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	vernierscale: Object.freeze({
		dark: [
			28,
			34,
			50
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		sets: 5,
		setPitch: .19,
		setSlack: .02,
		top: .06,
		left: .08,
		pitch: .03,
		units: 28,
		bandOverhang: .02,
		mainHeight: .05,
		plateGap: .004,
		plateHeight: .05,
		plateOverhang: .015,
		divisions: 10,
		ratio: .9,
		tickHalf: .0012,
		shortTick: .018,
		longTick: .03,
		alignedTick: .036,
		minWhole: 1,
		maxWhole: 17,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		mainTone: .86,
		plateTone: .74,
		tickTone: .3,
		longTone: .18,
		alignedTone: .06,
		grainTone: .03,
		paperHeight: .2,
		mainHeightLevel: .35,
		plateHeightLevel: .3,
		tickHeight: .6,
		longHeight: .7,
		alignedHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	paretochart: Object.freeze({
		dark: [
			26,
			36,
			54
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			7,
			8,
			9
		]),
		maxValue: 30,
		skew: 2.5,
		left: .1,
		pitch: .09,
		barWidth: .07,
		base: .88,
		chartHeight: .6,
		baseHalf: .0018,
		baseOverhang: .02,
		shareHalf: .0012,
		lineHalf: .0018,
		dotRadius: .0075,
		share: .8,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .95,
		barTone: .5,
		baseTone: .3,
		shareTone: .65,
		lineTone: .2,
		dotTone: .06,
		grainTone: .03,
		paperHeight: .2,
		barHeight: .5,
		baseHeight: .6,
		shareHeight: .35,
		lineHeight: .75,
		dotHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	radixsortpasses: Object.freeze({
		dark: [
			24,
			34,
			52
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			10,
			12,
			14
		]),
		maxValue: 63,
		digitBits: 2,
		passes: 3,
		left: .08,
		barPitch: .06,
		barWidth: .048,
		unit: .0022,
		minLevel: 2,
		top: .05,
		rowPitch: .215,
		baseOffset: .16,
		baseHalf: .0015,
		baseOverhang: .015,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .95,
		digitTones: Object.freeze([
			.78,
			.6,
			.42,
			.26
		]),
		digitHeights: Object.freeze([
			.3,
			.4,
			.5,
			.6
		]),
		doneTone: .1,
		doneHeight: .8,
		baseTone: .35,
		baseHeight: .55,
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	mergesortruns: Object.freeze({
		dark: [
			24,
			36,
			54
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			13,
			14,
			15,
			16
		]),
		left: .07,
		barPitch: .055,
		barWidth: .045,
		unit: .0045,
		top: .05,
		rowPitch: .18,
		baseOffset: .1,
		baseHalf: .0015,
		baseOverhang: .015,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .95,
		runTones: Object.freeze([.36, .64]),
		runHeights: Object.freeze([.5, .4]),
		doneTone: .1,
		doneHeight: .8,
		baseTone: .35,
		baseHeight: .55,
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	bresenhamlines: Object.freeze({
		dark: [
			26,
			32,
			50
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		panels: 2,
		cells: 16,
		pitch: .0275,
		cellHalf: .0115,
		originX: .04,
		originY: .04,
		panelPitch: .47,
		minSpan: 8,
		gridHalf: 6e-4,
		lineHalf: 9e-4,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .95,
		gridTone: .75,
		litTone: .38,
		endTone: .12,
		lineTone: .68,
		grainTone: .03,
		paperHeight: .2,
		gridHeight: .3,
		litHeight: .5,
		endHeight: .8,
		lineHeight: .65,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	bfswavefront: Object.freeze({
		dark: [
			24,
			34,
			56
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			10,
			11,
			12
		]),
		wallShare: .24,
		pitch: .07,
		cellHalf: .0315,
		rampTones: Object.freeze([
			.3,
			.38,
			.46,
			.54,
			.62,
			.7,
			.78,
			.86
		]),
		rampHeights: Object.freeze([
			.7,
			.65,
			.6,
			.55,
			.5,
			.45,
			.4,
			.35
		]),
		wallTone: .08,
		wallHeight: .9,
		shutTone: .92,
		shutHeight: .15,
		dotRadius: .012,
		dotTone: .04,
		dotHeight: .95,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	knapsacktable: Object.freeze({
		dark: [
			28,
			36,
			56
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		instances: 2,
		itemCounts: Object.freeze([4, 5]),
		capacity: 9,
		maxWeight: 4,
		maxValue: 6,
		top: .06,
		instancePitch: .46,
		rowPitch: .072,
		cellHalfHeight: .03,
		tableLeft: .28,
		colPitch: .066,
		cellHalfWidth: .029,
		cellUnit: .0018,
		cellBarHalf: .01,
		cellBarFloor: .004,
		squareLeft: .045,
		squarePitch: .035,
		squareHalf: .012,
		itemBarX: .215,
		itemBarHalf: .014,
		itemUnit: .008,
		frameHalf: .0015,
		frameGap: .003,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		cellTone: .87,
		takenTone: .66,
		barTone: .22,
		squareTone: .3,
		itemBarTone: .22,
		frameTone: .08,
		grainTone: .03,
		paperHeight: .2,
		cellHeight: .3,
		takenHeight: .45,
		barHeight: .7,
		squareHeight: .6,
		itemBarHeight: .7,
		frameHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	prefixtrie: Object.freeze({
		dark: [
			26,
			34,
			54
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		minWords: 6,
		maxWords: 8,
		minLength: 2,
		maxLength: 4,
		letters: 3,
		left: .08,
		xPitch: .2,
		top: .1,
		slotPitch: .11,
		nodeRadius: .014,
		ringRadius: .0265,
		ringHalf: .0025,
		lineHalf: .0016,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .95,
		letterTones: Object.freeze([
			.25,
			.5,
			.72
		]),
		trunkTone: .6,
		nodeTone: .08,
		grainTone: .03,
		paperHeight: .2,
		letterHeights: Object.freeze([
			.6,
			.5,
			.4
		]),
		trunkHeight: .35,
		nodeHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	lrucachetrace: Object.freeze({
		dark: [
			26,
			36,
			56
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		steps: 14,
		pages: 6,
		slotCounts: Object.freeze([3, 4]),
		left: .08,
		pitch: .06,
		squareHalf: .022,
		top: .12,
		rowPitch: .07,
		gapAfterRequest: .03,
		markerDrop: .06,
		markerRadius: .009,
		ringRadius: .012,
		ringHalf: .0022,
		frameHalf: .0015,
		frameGap: .0035,
		repeatShare: .45,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		pageTones: Object.freeze([
			.2,
			.32,
			.44,
			.56,
			.68,
			.8
		]),
		pageHeights: Object.freeze([
			.8,
			.7,
			.6,
			.5,
			.4,
			.3
		]),
		emptyTone: .9,
		emptyHeight: .15,
		frameTone: .06,
		markTone: .16,
		grainTone: .03,
		paperHeight: .2,
		frameHeight: .9,
		markHeight: .7,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	funnelchart: Object.freeze({
		dark: [
			26,
			38,
			58
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		stageCounts: Object.freeze([5, 6]),
		minKept: .45,
		maxKept: .95,
		centerX: .37,
		fullWidth: .6,
		top: .08,
		stagePitch: .145,
		stageHeight: .1,
		slantHeight: .045,
		trackLeft: .74,
		trackLength: .2,
		trackHalf: .012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		barTone: .3,
		slantTone: .72,
		trackTone: .88,
		keptTone: .18,
		grainTone: .03,
		paperHeight: .2,
		barHeight: .7,
		slantHeightLevel: .4,
		trackHeight: .3,
		keptHeight: .8,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	wordlefeedback: Object.freeze({
		dark: [
			28,
			36,
			52
		],
		light: [
			244,
			241,
			232
		],
		roughness: .55,
		relief: .004,
		wordLength: 5,
		letterCount: 6,
		guessCounts: Object.freeze([
			4,
			5,
			6
		]),
		keepShare: .4,
		solvedShare: .5,
		left: .25,
		pitch: .1,
		top: .1,
		secretLine: 6,
		tileHalf: .042,
		letterHalf: .02,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		letterTones: Object.freeze([
			.05,
			.1,
			.15,
			.2,
			.25,
			.3
		]),
		rightTone: .55,
		elsewhereTone: .75,
		noTone: .9,
		grainTone: .03,
		paperHeight: .2,
		letterHeight: .85,
		rightHeight: .7,
		elsewhereHeight: .5,
		noHeight: .3,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	nimgame: Object.freeze({
		dark: [
			24,
			34,
			56
		],
		light: [
			246,
			242,
			230
		],
		roughness: .55,
		relief: .004,
		heapCounts: Object.freeze([3, 4]),
		maxStones: 7,
		bitCount: 3,
		maxStates: 14,
		forceFrom: 5,
		left: .08,
		pitch: .06,
		top: .06,
		rowPitch: .13,
		baseDrop: .11,
		stoneHeight: .1 / 7,
		barHalf: .022,
		bitsGap: .03,
		bitPitch: .045,
		dotRadius: .012,
		ringRadius: .01,
		ringHalf: .0018,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		barTone: .45,
		moveTone: .18,
		ghostTone: .82,
		dotTone: .15,
		grainTone: .03,
		paperHeight: .2,
		barHeight: .7,
		moveHeight: .9,
		ghostHeight: .4,
		dotHeight: .8,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	gamblersruin: Object.freeze({
		dark: [
			30,
			34,
			58
		],
		light: [
			244,
			241,
			230
		],
		roughness: .55,
		relief: .004,
		laneCount: 5,
		levels: 8,
		rounds: 24,
		winChances: Object.freeze([
			.4,
			.5,
			.6
		]),
		left: .05,
		pitch: .036,
		top: .08,
		lanePitch: .16,
		laneMargin: .02,
		unit: .015,
		dotRadius: .0065,
		lineHalf: .0012,
		tickLeft: .012,
		tickPitch: .012,
		tickHalf: .0035,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		lineTone: .78,
		dotTone: .14,
		grainTone: .03,
		paperHeight: .2,
		lineHeight: .4,
		dotHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	bloomfilter: Object.freeze({
		dark: [
			28,
			38,
			60
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		bitCount: 24,
		hashCount: 3,
		insertCount: 6,
		queryCount: 6,
		memberQueries: 2,
		left: .05,
		pitch: .0375,
		top: .0475,
		rowPitch: .065,
		cellHalf: .0135,
		dotRadius: .008,
		markX: .975,
		ringRadius: .0098,
		ringHalf: .0022,
		squareHalf: .01,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		unsetTone: .88,
		setTone: .25,
		dotTone: .15,
		markTone: .22,
		grainTone: .03,
		paperHeight: .2,
		unsetHeight: .3,
		setHeight: .75,
		dotHeight: .85,
		markHeight: .6,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	linearprobing: Object.freeze({
		dark: [
			30,
			36,
			58
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		slotCount: 16,
		keyCounts: Object.freeze([
			8,
			10,
			12
		]),
		left: .1,
		pitch: .05,
		top: .08,
		rowPitch: .075,
		slotHalf: .02,
		homeDrop: .03,
		homeRadius: .006,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		emptyTone: .88,
		firstKeyTone: .08,
		keyToneStep: .04,
		homeTone: .12,
		grainTone: .03,
		paperHeight: .2,
		emptyHeight: .3,
		keyHeight: .75,
		homeHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	unionfindmerges: Object.freeze({
		dark: [
			28,
			40,
			62
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		elementCount: 14,
		requestCount: 10,
		left: .08,
		pitch: .06,
		top: .08,
		rowPitch: .08,
		squareHalf: .022,
		dotRise: .032,
		dotRadius: .006,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		firstSetTone: .06,
		setToneStep: .04,
		dotTone: .12,
		grainTone: .03,
		paperHeight: .2,
		squareHeight: .75,
		dotHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	fareysequence: Object.freeze({
		dark: [
			30,
			36,
			60
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		rowCounts: Object.freeze([
			7,
			8,
			9
		]),
		minDenominator: 11,
		maxDenominator: 23,
		left: .1,
		length: .8,
		top: .1,
		rowPitch: .09,
		tickHalfWidth: .0016,
		tickHalfHeight: .022,
		bandHalfHeight: .012,
		dotDrop: .036,
		dotRadius: .006,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		oldTickTone: .4,
		newTickTone: .12,
		bandTone: .86,
		dotTone: .2,
		grainTone: .03,
		paperHeight: .2,
		oldTickHeight: .6,
		newTickHeight: .85,
		bandHeight: .35,
		dotHeight: .75,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	lfsrstates: Object.freeze({
		dark: [
			26,
			36,
			58
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		bitCount: 8,
		stateCounts: Object.freeze([
			16,
			20,
			24
		]),
		tapSets: Object.freeze([
			Object.freeze([
				0,
				2,
				3,
				4
			]),
			Object.freeze([
				0,
				1,
				2,
				7
			]),
			Object.freeze([
				0,
				3,
				5,
				7
			])
		]),
		left: .08,
		pitch: .05,
		top: .12,
		rowPitch: .034,
		cellHalf: .014,
		outputColumn: 9,
		feedbackColumn: 10.2,
		markHalf: .01,
		tapRise: .045,
		tapRadius: .007,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		clearTone: .88,
		setTone: .14,
		tapTone: .14,
		grainTone: .03,
		paperHeight: .2,
		clearHeight: .3,
		setHeight: .8,
		tapHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	crcdivision: Object.freeze({
		dark: [
			26,
			36,
			58
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		messageBits: 12,
		checkBits: 4,
		divisors: Object.freeze([
			19,
			25,
			29
		]),
		left: .1,
		pitch: .05,
		top: .14,
		rowPitch: .06,
		cellHalf: .02,
		divisorTop: .07,
		divisorHalf: .011,
		dotDrop: .035,
		dotRadius: .006,
		ringRadius: .0045,
		ringHalf: .0016,
		frameGap: .004,
		frameHalf: .0016,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		clearTone: .88,
		setTone: .14,
		markTone: .22,
		frameTone: .32,
		grainTone: .03,
		paperHeight: .2,
		clearHeight: .3,
		setHeight: .8,
		markHeight: .85,
		frameHeight: .6,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	kolakoskisequence: Object.freeze({
		dark: [
			30,
			38,
			62
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		symbolPairs: Object.freeze([
			Object.freeze([1, 2]),
			Object.freeze([2, 1]),
			Object.freeze([1, 3]),
			Object.freeze([3, 1])
		]),
		symbolCount: 64,
		columns: 16,
		left: .085,
		pitch: .052,
		top: .08,
		rowPitch: .07,
		runRows: 3,
		runTop: .42,
		cellHalf: .02,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		symbolTones: Object.freeze([
			.14,
			.5,
			.78
		]),
		grainTone: .03,
		paperHeight: .2,
		symbolHeights: Object.freeze([
			.85,
			.6,
			.35
		]),
		paperRoughness: .8,
		inkRoughness: .4
	}),
	slopegraph: Object.freeze({
		dark: [
			28,
			38,
			62
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		itemCounts: Object.freeze([
			6,
			8,
			10
		]),
		levelCount: 20,
		leftX: .2,
		rightX: .8,
		top: .1,
		levelPitch: .04,
		axisHalf: .0012,
		axisReach: .02,
		lineHalf: .0022,
		dotRadius: .0095,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		axisTone: .8,
		riseTone: .2,
		fallTone: .5,
		levelTone: .72,
		dotTone: .1,
		grainTone: .03,
		paperHeight: .2,
		axisHeight: .35,
		riseHeight: .8,
		fallHeight: .6,
		levelHeight: .45,
		dotHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	astroidladder: Object.freeze({
		dark: [
			28,
			36,
			62
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		ladderCounts: Object.freeze([
			14,
			18,
			22
		]),
		lengths: Object.freeze([
			.34,
			.37,
			.4
		]),
		powers: Object.freeze([
			.8,
			1,
			1.25
		]),
		centerX: .5,
		centerY: .5,
		axisHalf: .0012,
		axisReach: .45,
		lineHalf: .0015,
		endRadius: .003,
		touchRadius: .0026,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		axisTone: .84,
		lineTone: .5,
		endTone: .12,
		touchTone: .28,
		grainTone: .03,
		paperHeight: .2,
		axisHeight: .3,
		lineHeight: .6,
		endHeight: .85,
		touchHeight: .75,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	eulerlinetriangle: Object.freeze({
		dark: [
			26,
			36,
			60
		],
		light: [
			245,
			242,
			231
		],
		roughness: .55,
		relief: .004,
		radii: Object.freeze([
			.28,
			.3,
			.32
		]),
		centerX: .5,
		centerY: .5,
		arcSpread: .8,
		edgeHalf: .0022,
		altitudeHalf: .0014,
		circleHalf: .0012,
		eulerHalf: .0016,
		cornerRadius: .011,
		ringRadius: .012,
		ringHalf: .002,
		centroidRadius: .008,
		squareHalf: .008,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		circleTone: .76,
		altitudeTone: .64,
		edgeTone: .46,
		eulerTone: .34,
		cornerTone: .1,
		squareTone: .2,
		ringTone: .3,
		centroidTone: .42,
		grainTone: .03,
		paperHeight: .2,
		circleHeight: .3,
		altitudeHeight: .4,
		edgeHeight: .6,
		eulerHeight: .7,
		cornerHeight: .9,
		squareHeight: .85,
		ringHeight: .8,
		centroidHeight: .75,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	arbelos: Object.freeze({
		dark: [
			30,
			40,
			66
		],
		light: [
			246,
			243,
			232
		],
		roughness: .55,
		relief: .004,
		left: .1,
		right: .9,
		baselineY: .7,
		shareLow: .25,
		shareSpan: .17,
		baselineHalf: .0016,
		arcHalf: .0022,
		lineHalf: .0015,
		twinHalf: .002,
		dotRadius: .008,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		baselineTone: .3,
		arcTone: .5,
		lineTone: .64,
		twinTone: .22,
		dotTone: .1,
		grainTone: .03,
		paperHeight: .2,
		baselineHeight: .45,
		arcHeight: .6,
		lineHeight: .35,
		twinHeight: .75,
		dotHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	contributiongraph: Object.freeze({
		dark: [
			28,
			78,
			58
		],
		light: [
			244,
			244,
			236
		],
		roughness: .55,
		relief: .004,
		years: Object.freeze([
			1990,
			1992,
			1995,
			1997,
			2e3,
			2003,
			2005,
			2008,
			2011,
			2013,
			2016,
			2017
		]),
		bands: 5,
		left: .056,
		top: .09,
		pitch: .0148,
		cell: .012,
		monthGap: .007,
		bandPitch: .17,
		keyLeft: .7,
		keyTop: .935,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		weekendFactor: .4,
		levelScale: 5.5,
		busiestWeek: 1,
		quietestWeek: .3,
		levelTones: Object.freeze([
			.86,
			.68,
			.5,
			.33,
			.16
		]),
		levelHeights: Object.freeze([
			.3,
			.42,
			.54,
			.68,
			.84
		]),
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	pythagoreanproof: Object.freeze({
		dark: [
			34,
			44,
			74
		],
		light: [
			246,
			243,
			232
		],
		roughness: .55,
		relief: .004,
		triples: Object.freeze([
			Object.freeze([
				3,
				4,
				5
			]),
			Object.freeze([
				6,
				8,
				10
			]),
			Object.freeze([
				5,
				12,
				13
			]),
			Object.freeze([
				8,
				15,
				17
			])
		]),
		extent: .84,
		centerX: .5,
		centerY: .5,
		outlineHalf: .0018,
		gridHalf: 7e-4,
		dotRadius: .007,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		shortTone: .82,
		otherShortTone: .7,
		longTone: .58,
		triangleTone: .4,
		gridTone: .46,
		outlineTone: .24,
		dotTone: .08,
		grainTone: .03,
		paperHeight: .2,
		shortHeight: .35,
		otherShortHeight: .45,
		longHeight: .55,
		triangleHeight: .65,
		gridHeight: .5,
		outlineHeight: .75,
		dotHeight: .9,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	keplerorbit: Object.freeze({
		dark: [
			28,
			36,
			64
		],
		light: [
			246,
			243,
			232
		],
		roughness: .55,
		relief: .004,
		semiMajors: Object.freeze([
			.3,
			.34,
			.38
		]),
		eccentricities: Object.freeze([
			.45,
			.6,
			.75
		]),
		counts: Object.freeze([
			8,
			10,
			12
		]),
		centerX: .5,
		centerY: .5,
		orbitHalf: .002,
		rayHalf: .0012,
		planetRadius: .009,
		sunRadius: .015,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		wedgeTone: .88,
		otherWedgeTone: .74,
		orbitTone: .3,
		rayTone: .5,
		planetTone: .1,
		sunTone: .04,
		grainTone: .03,
		paperHeight: .2,
		wedgeHeight: .3,
		otherWedgeHeight: .42,
		orbitHeight: .6,
		rayHeight: .5,
		planetHeight: .8,
		sunHeight: .95,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	eisensteinprimes: Object.freeze({
		dark: [
			24,
			34,
			62
		],
		light: [
			246,
			243,
			232
		],
		roughness: .55,
		relief: .004,
		size: 28,
		origins: Object.freeze([
			Object.freeze([14, 14]),
			Object.freeze([9, 12]),
			Object.freeze([18, 8]),
			Object.freeze([6, 19]),
			Object.freeze([20, 18]),
			Object.freeze([12, 5]),
			Object.freeze([15, 22]),
			Object.freeze([3, 10])
		]),
		primeRadius: .012,
		plainRadius: .0042,
		originRadius: .0085,
		ringRadius: .0145,
		ringHalf: .0015,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .96,
		primeTone: .1,
		plainTone: .66,
		originTone: .3,
		ringTone: .44,
		grainTone: .03,
		paperHeight: .2,
		primeHeight: .85,
		plainHeight: .4,
		originHeight: .65,
		ringHeight: .55,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	catalantriangulations: Object.freeze({
		dark: [
			26,
			36,
			66
		],
		light: [
			246,
			243,
			232
		],
		roughness: .55,
		relief: .004,
		sides: Object.freeze([
			5,
			6,
			7
		]),
		columns: Object.freeze([
			3,
			5,
			7
		]),
		rows: Object.freeze([
			2,
			3,
			6
		]),
		extent: .9,
		margin: .012,
		edgeHalf: .0018,
		diagonalHalf: .0013,
		dotRadius: .0045,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		fillTone: .9,
		edgeTone: .28,
		diagonalTone: .5,
		dotTone: .1,
		grainTone: .03,
		paperHeight: .2,
		fillHeight: .3,
		edgeHeight: .6,
		diagonalHeight: .45,
		dotHeight: .85,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	binarynecklaces: Object.freeze({
		dark: [
			28,
			38,
			68
		],
		light: [
			246,
			243,
			232
		],
		roughness: .55,
		relief: .004,
		beads: Object.freeze([
			6,
			7,
			8
		]),
		columns: Object.freeze([
			5,
			5,
			6
		]),
		rows: Object.freeze([
			3,
			4,
			6
		]),
		extent: .9,
		ringShare: .34,
		beadShare: .7,
		ringHalf: .0013,
		outlineHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		ringTone: .62,
		outlineTone: .26,
		darkTone: .1,
		lightTone: .9,
		grainTone: .03,
		paperHeight: .2,
		ringHeight: .35,
		outlineHeight: .7,
		darkHeight: .85,
		lightHeight: .5,
		paperRoughness: .8,
		inkRoughness: .4
	}),
	baumsweetgrid: Object.freeze({
		dark: [
			24,
			52,
			54
		],
		light: [
			244,
			240,
			226
		],
		roughness: .55,
		relief: .004,
		side: 64,
		offsets: Object.freeze([
			1234,
			5e3,
			21847,
			65537,
			131e3,
			150001,
			41e4,
			524333
		]),
		extent: .94,
		gapHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		tones: Object.freeze([
			.12,
			.36,
			.52,
			.66,
			.8
		]),
		grainTone: .03,
		paperHeight: .2,
		heights: Object.freeze([
			.8,
			.68,
			.58,
			.5,
			.44
		]),
		paperRoughness: .8,
		inkRoughness: .45
	}),
	rudinshapirogrid: Object.freeze({
		dark: [
			58,
			32,
			40
		],
		light: [
			244,
			238,
			224
		],
		roughness: .55,
		relief: .004,
		side: 64,
		offsets: Object.freeze([
			1234,
			5e3,
			7777,
			30001,
			150001,
			600001,
			3001,
			12345
		]),
		extent: .94,
		gapHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		tones: Object.freeze([
			.9,
			.12,
			.74,
			.28,
			.58,
			.42
		]),
		heights: Object.freeze([
			.3,
			.85,
			.42,
			.74,
			.54,
			.64
		]),
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	paperfoldingruler: Object.freeze({
		dark: [
			30,
			46,
			70
		],
		light: [
			242,
			238,
			226
		],
		roughness: .55,
		relief: .004,
		side: 61,
		offsets: Object.freeze([
			1,
			1234,
			5e3,
			7777,
			12345,
			30001,
			150001,
			600001
		]),
		extent: .94,
		gapHalf: .0012,
		innerShare: .45,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		tones: Object.freeze([
			.9,
			.76,
			.62,
			.48,
			.34,
			.2
		]),
		innerTones: Object.freeze([
			.3,
			.38,
			.46,
			.76,
			.84,
			.92
		]),
		heights: Object.freeze([
			.3,
			.4,
			.5,
			.6,
			.7,
			.8
		]),
		innerLift: .14,
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	walshmatrix: Object.freeze({
		dark: [
			22,
			40,
			58
		],
		light: [
			240,
			236,
			222
		],
		roughness: .55,
		relief: .004,
		sizes: Object.freeze([
			8,
			16,
			32
		]),
		extent: .9,
		gapHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		plusTone: .1,
		minusTone: .88,
		grainTone: .03,
		paperHeight: .2,
		plusHeight: .8,
		minusHeight: .4,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	beattypartition: Object.freeze({
		dark: [
			30,
			44,
			66
		],
		light: [
			243,
			238,
			224
		],
		roughness: .55,
		relief: .004,
		side: 47,
		alphas: Object.freeze([
			1.618033988749895,
			1.4142135623730951,
			1.7320508075688772,
			2.718281828459045
		]),
		offsets: Object.freeze([
			1,
			100,
			777,
			2e3
		]),
		extent: .94,
		gapHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		tones: Object.freeze([
			.1,
			.22,
			.34,
			.62,
			.74,
			.86
		]),
		heights: Object.freeze([
			.85,
			.78,
			.71,
			.5,
			.43,
			.36
		]),
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	cycliccellular: Object.freeze({
		dark: [
			18,
			30,
			62
		],
		light: [
			248,
			236,
			204
		],
		roughness: .55,
		relief: .004,
		side: 20,
		burnIn: 6,
		rules: Object.freeze([
			Object.freeze({
				states: 6,
				threshold: 2
			}),
			Object.freeze({
				states: 8,
				threshold: 1
			}),
			Object.freeze({
				states: 10,
				threshold: 1
			})
		]),
		extent: .94,
		panelGap: .04,
		gapHalf: 8e-4,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		lowTone: .08,
		highTone: .88,
		lowHeight: .35,
		highHeight: .85,
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	wireworldcircuit: Object.freeze({
		dark: [
			20,
			24,
			44
		],
		light: [
			250,
			232,
			168
		],
		roughness: .5,
		relief: .004,
		side: 22,
		circuits: Object.freeze([
			Object.freeze([
				`......................`,
				`......................`,
				`......................`,
				`...#####TH#########...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#########HT#####...`,
				`......................`,
				`......................`,
				`......................`
			]),
			Object.freeze([
				`......................`,
				`......................`,
				`......................`,
				`......................`,
				`......................`,
				`...##TH########.......`,
				`...#..........#.......`,
				`...#..........#.......`,
				`...#..........#.......`,
				`...#..........#.......`,
				`...#..........#######.`,
				`...#..........#.......`,
				`...#..........#.......`,
				`...#..........#.......`,
				`...#..........#.......`,
				`...#..........#.......`,
				`...############.......`,
				`......................`,
				`......................`,
				`......................`,
				`......................`,
				`......................`
			]),
			Object.freeze([
				`......................`,
				`......................`,
				`......................`,
				`......................`,
				`..###TH###..#####TH#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..#......####......#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..#......#..#......#..`,
				`..###HT###..########..`,
				`......................`,
				`......................`,
				`......................`,
				`......................`
			]),
			Object.freeze([
				`......................`,
				`......................`,
				`......................`,
				`...####TH##########...`,
				`...#....#####.....#...`,
				`...#....#####.....#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...#..............#...`,
				`...################...`,
				`......................`,
				`......................`,
				`......................`,
				`......................`
			])
		]),
		starts: Object.freeze([
			0,
			7,
			13,
			22
		]),
		extent: .94,
		panelGap: .04,
		gapHalf: 8e-4,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		emptyTone: .08,
		conductorTone: .55,
		headTone: .95,
		tailTone: .3,
		emptyHeight: .25,
		conductorHeight: .55,
		headHeight: .85,
		tailHeight: .4,
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	duccirows: Object.freeze({
		dark: [
			28,
			20,
			60
		],
		light: [
			244,
			236,
			214
		],
		roughness: .55,
		relief: .004,
		maxValue: 99,
		sizes: Object.freeze([
			23,
			29,
			31,
			37
		]),
		extent: .94,
		gapHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		lightTone: .9,
		darkTone: .08,
		lightHeight: .35,
		darkHeight: .85,
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	scrabbleboard: Object.freeze({
		dark: [
			18,
			52,
			40
		],
		light: [
			246,
			236,
			206
		],
		roughness: .5,
		relief: .004,
		squares: Object.freeze([
			`T..d...T...d..T`,
			`.D...t...t...D.`,
			`..D...d.d...D..`,
			`d..D...d...D..d`,
			`....D.....D....`,
			`.t...t...t...t.`,
			`..d...d.d...d..`,
			`T..d...D...d..T`,
			`..d...d.d...d..`,
			`.t...t...t...t.`,
			`....D.....D....`,
			`d..D...d...D..d`,
			`..D...d.d...D..`,
			`.D...t...t...D.`,
			`T..d...T...d..T`
		]),
		layouts: Object.freeze([
			Object.freeze([
				Object.freeze({
					word: `QUARTZ`,
					x: 4,
					y: 7,
					across: !0
				}),
				Object.freeze({
					word: `ZEBRA`,
					x: 9,
					y: 7,
					across: !1
				}),
				Object.freeze({
					word: `QUIET`,
					x: 4,
					y: 7,
					across: !1
				}),
				Object.freeze({
					word: `BOX`,
					x: 9,
					y: 9,
					across: !0
				}),
				Object.freeze({
					word: `AXE`,
					x: 11,
					y: 8,
					across: !1
				}),
				Object.freeze({
					word: `TOY`,
					x: 4,
					y: 11,
					across: !0
				}),
				Object.freeze({
					word: `RAW`,
					x: 7,
					y: 7,
					across: !1
				})
			]),
			Object.freeze([
				Object.freeze({
					word: `JAZZY`,
					x: 3,
					y: 7,
					across: !0
				}),
				Object.freeze({
					word: `YAK`,
					x: 7,
					y: 7,
					across: !1
				}),
				Object.freeze({
					word: `FIZZ`,
					x: 5,
					y: 4,
					across: !1
				}),
				Object.freeze({
					word: `JOWL`,
					x: 3,
					y: 7,
					across: !1
				}),
				Object.freeze({
					word: `WAX`,
					x: 3,
					y: 9,
					across: !0
				}),
				Object.freeze({
					word: `KEY`,
					x: 7,
					y: 9,
					across: !0
				})
			]),
			Object.freeze([
				Object.freeze({
					word: `OXYGEN`,
					x: 5,
					y: 7,
					across: !0
				}),
				Object.freeze({
					word: `EXPO`,
					x: 6,
					y: 6,
					across: !1
				}),
				Object.freeze({
					word: `GIVE`,
					x: 8,
					y: 7,
					across: !1
				}),
				Object.freeze({
					word: `VOW`,
					x: 8,
					y: 9,
					across: !0
				}),
				Object.freeze({
					word: `WHEY`,
					x: 10,
					y: 9,
					across: !1
				})
			])
		]),
		points: Object.freeze({
			A: 1,
			B: 3,
			C: 3,
			D: 2,
			E: 1,
			F: 4,
			G: 2,
			H: 4,
			I: 1,
			J: 8,
			K: 5,
			L: 1,
			M: 3,
			N: 1,
			O: 1,
			P: 3,
			Q: 10,
			R: 1,
			S: 1,
			T: 1,
			U: 1,
			V: 4,
			W: 4,
			X: 8,
			Y: 4,
			Z: 10
		}),
		pointSteps: Object.freeze([
			1,
			2,
			3,
			4,
			5,
			8,
			10
		]),
		tileTones: Object.freeze([
			.74,
			.78,
			.82,
			.86,
			.9,
			.94,
			.98
		]),
		tileHeights: Object.freeze([
			.72,
			.76,
			.8,
			.84,
			.88,
			.92,
			.96
		]),
		side: 15,
		extent: .94,
		gapHalf: .0012,
		tileInset: .004,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		plainTone: .3,
		doubleLetterTone: .44,
		tripleLetterTone: .56,
		doubleWordTone: .18,
		tripleWordTone: .08,
		plainHeight: .3,
		doubleLetterHeight: .34,
		tripleLetterHeight: .38,
		doubleWordHeight: .26,
		tripleWordHeight: .22,
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	monopolyboard: Object.freeze({
		dark: [
			24,
			56,
			44
		],
		light: [
			244,
			236,
			208
		],
		roughness: .5,
		relief: .004,
		spaces: `G1H1XR2C22J3U33R4H44P5C55R66U6W77H7RC8X8`,
		side: 11,
		extent: .94,
		gapHalf: .0012,
		bandShare: .28,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		centreTone: .8,
		streetTone: .92,
		spaceTones: Object.freeze([
			.06,
			.14,
			.22,
			.3,
			.38,
			.46,
			.54,
			.62,
			.7
		]),
		bandTones: Object.freeze([
			.12,
			.2,
			.28,
			.36,
			.44,
			.52,
			.6,
			.68
		]),
		centreHeight: .3,
		streetHeight: .5,
		spaceHeights: Object.freeze([
			.8,
			.7,
			.4,
			.6,
			.75,
			.65,
			.55,
			.45,
			.85
		]),
		bandHeights: Object.freeze([
			.62,
			.64,
			.66,
			.68,
			.7,
			.72,
			.74,
			.76
		]),
		grainTone: .03,
		paperHeight: .2,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	cribbageboard: Object.freeze({
		dark: [
			54,
			30,
			16
		],
		light: [
			214,
			168,
			112
		],
		roughness: .55,
		relief: .004,
		lanes: 3,
		holesPerRow: 60,
		group: 5,
		left: .0372,
		pitch: .0136,
		groupGap: .0112,
		laneCentres: Object.freeze([
			.26,
			.5,
			.74
		]),
		rowOffset: .03,
		holeRadius: .0042,
		pegRadius: .0064,
		maxLead: 24,
		edgeSoft: 5e-4,
		grainColumns: 5,
		grainRows: 144,
		woodTone: .7,
		grainTone: .06,
		holeTone: .06,
		pegTones: Object.freeze([
			.22,
			.4,
			.96
		]),
		woodHeight: .5,
		holeHeight: .05,
		pegHeight: .95,
		woodRoughness: .6,
		holeRoughness: .9,
		pegRoughness: .3
	}),
	xiangqiboard: Object.freeze({
		dark: [
			40,
			28,
			22
		],
		light: [
			236,
			208,
			156
		],
		roughness: .5,
		relief: .004,
		pieces: Object.freeze([
			`rheagaehr`,
			`.........`,
			`.c.....c.`,
			`s.s.s.s.s`,
			`.........`,
			`.........`,
			`S.S.S.S.S`,
			`.C.....C.`,
			`.........`,
			`RHEAGAEHR`
		]),
		openings: Object.freeze([
			Object.freeze([]),
			Object.freeze([Object.freeze({
				from: [7, 7],
				to: [4, 7]
			})]),
			Object.freeze([Object.freeze({
				from: [1, 9],
				to: [2, 7]
			})]),
			Object.freeze([Object.freeze({
				from: [7, 7],
				to: [4, 7]
			}), Object.freeze({
				from: [7, 0],
				to: [6, 2]
			})]),
			Object.freeze([Object.freeze({
				from: [2, 9],
				to: [4, 7]
			}), Object.freeze({
				from: [1, 0],
				to: [2, 2]
			})]),
			Object.freeze([Object.freeze({
				from: [4, 6],
				to: [4, 5]
			}), Object.freeze({
				from: [4, 3],
				to: [4, 4]
			})])
		]),
		columns: 9,
		rows: 10,
		pitch: .085,
		boardMargin: .045,
		lineHalf: .0014,
		pieceRadius: .034,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		boardTone: .74,
		riverTone: .66,
		lineTone: .32,
		blackTones: Object.freeze([
			.04,
			.07,
			.1,
			.13,
			.16,
			.19,
			.22
		]),
		redTones: Object.freeze([
			.8,
			.83,
			.86,
			.89,
			.92,
			.95,
			.98
		]),
		paperHeight: .2,
		boardHeight: .4,
		riverHeight: .35,
		lineHeight: .5,
		pieceHeight: .85,
		grainTone: .03,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	chessopening: Object.freeze({
		dark: [
			34,
			38,
			52
		],
		light: [
			236,
			226,
			200
		],
		roughness: .5,
		relief: .004,
		openings: Object.freeze([
			Object.freeze([]),
			Object.freeze([
				`e2e4`,
				`e7e5`,
				`g1f3`,
				`b8c6`,
				`f1b5`
			]),
			Object.freeze([
				`e2e4`,
				`e7e5`,
				`g1f3`,
				`b8c6`,
				`f1c4`,
				`f8c5`
			]),
			Object.freeze([
				`e2e4`,
				`c7c5`,
				`g1f3`,
				`d7d6`,
				`d2d4`,
				`c5d4`,
				`f3d4`,
				`g8f6`,
				`b1c3`
			]),
			Object.freeze([
				`d2d4`,
				`d7d5`,
				`c2c4`,
				`e7e6`,
				`b1c3`,
				`g8f6`
			]),
			Object.freeze([
				`e2e4`,
				`e7e6`,
				`d2d4`,
				`d7d5`,
				`b1c3`,
				`f8b4`
			]),
			Object.freeze([
				`d2d4`,
				`g8f6`,
				`c2c4`,
				`g7g6`,
				`b1c3`,
				`f8g7`,
				`e2e4`,
				`d7d6`
			]),
			Object.freeze([
				`e2e4`,
				`d7d5`,
				`e4d5`,
				`d8d5`,
				`b1c3`,
				`d5a5`
			])
		]),
		side: 8,
		cell: .1,
		frame: .03,
		pieceRadius: .036,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		frameTone: .16,
		darkSquareTone: .28,
		lightSquareTone: .44,
		blackTones: Object.freeze([
			0,
			.03,
			.06,
			.09,
			.12,
			.15
		]),
		whiteTones: Object.freeze([
			.68,
			.74,
			.8,
			.86,
			.92,
			.98
		]),
		paperHeight: .2,
		frameHeight: .6,
		squareHeight: .4,
		pieceHeight: .85,
		grainTone: .03,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	ludoboard: Object.freeze({
		dark: [
			30,
			34,
			46
		],
		light: [
			240,
			234,
			214
		],
		roughness: .5,
		relief: .004,
		side: 15,
		cell: .054,
		frame: .02,
		spotRadius: .043,
		tokenRadius: .024,
		lineHalf: 8e-4,
		edgeSoft: 6e-4,
		fill: .7,
		grainCells: 192,
		paperTone: .97,
		frameTone: .14,
		lineTone: .1,
		trackTone: .86,
		yardInnerTone: .92,
		tokenTone: .06,
		colourTones: Object.freeze([
			.3,
			.42,
			.54,
			.66
		]),
		paperHeight: .2,
		frameHeight: .6,
		cellHeight: .4,
		colourHeight: .5,
		lineHeight: .3,
		spotHeight: .6,
		tokenHeight: .85,
		grainTone: .03,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	shogiboard: Object.freeze({
		dark: [
			52,
			36,
			24
		],
		light: [
			240,
			218,
			168
		],
		roughness: .55,
		relief: .004,
		openings: Object.freeze([
			Object.freeze([`7g7f`]),
			Object.freeze([
				`7g7f`,
				`3c3d`,
				`2g2f`,
				`4c4d`,
				`2f2e`,
				`8b4b`
			]),
			Object.freeze([
				`2g2f`,
				`8c8d`,
				`2f2e`,
				`8d8e`,
				`6i7h`,
				`3c3d`
			]),
			Object.freeze([
				`7g7f`,
				`3c3d`,
				`8h2b`,
				`3a2b`,
				`7i7h`,
				`8b7b`
			]),
			Object.freeze([
				`2g2f`,
				`8c8d`,
				`2f2e`,
				`8d8e`,
				`2e2d`,
				`2c2d`,
				`2h2d`
			]),
			Object.freeze([
				`7g7f`,
				`3c3d`,
				`8i7g`,
				`2b3c`,
				`3g3f`
			]),
			Object.freeze([
				`9g9f`,
				`1c1d`,
				`9f9e`,
				`1d1e`,
				`9i9f`,
				`8c8d`
			]),
			Object.freeze([
				`7g7f`,
				`3c3d`,
				`3i4h`,
				`8c8d`,
				`6i7h`,
				`7c7d`
			])
		]),
		side: 9,
		cell: .09,
		margin: .012,
		frame: .02,
		lineHalf: 6e-4,
		starRadius: .0045,
		outline: Object.freeze([
			Object.freeze([0, -.42]),
			Object.freeze([.28, -.22]),
			Object.freeze([.36, .4]),
			Object.freeze([-.36, .4]),
			Object.freeze([-.28, -.22])
		]),
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		frameTone: .16,
		boardTone: .5,
		lineTone: .12,
		pieceTones: Object.freeze([
			.7,
			.76,
			.82,
			.88,
			.94,
			.3,
			.22,
			.14
		]),
		paperHeight: .2,
		frameHeight: .6,
		boardHeight: .4,
		lineHeight: .3,
		pieceHeight: .85,
		grainTone: .03,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	carromboard: Object.freeze({
		dark: [
			48,
			30,
			18
		],
		light: [
			244,
			226,
			186
		],
		roughness: .45,
		relief: .004,
		half: .38,
		frame: .035,
		pocketCentre: .34,
		pocketRadius: .028,
		ringRadii: Object.freeze([.15, .095]),
		lineHalf: .0014,
		baseDepths: Object.freeze([.085, .125]),
		baseReach: .2,
		coinRadius: .026,
		strikerRadius: .033,
		fill: .85,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		frameTone: .2,
		surfaceTone: .74,
		lineTone: .1,
		pocketTone: .03,
		whiteTone: .96,
		blackTone: .16,
		queenTone: .5,
		strikerTone: .62,
		paperHeight: .2,
		frameHeight: .6,
		surfaceHeight: .35,
		lineHeight: .3,
		pocketHeight: .05,
		coinHeight: .85,
		strikerHeight: .92,
		grainTone: .03,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	ninemensmorris: Object.freeze({
		dark: [
			40,
			28,
			22
		],
		light: [
			236,
			218,
			178
		],
		roughness: .5,
		relief: .004,
		unit: .115,
		margin: .045,
		frame: .03,
		lineHalf: .0016,
		dotRadius: .008,
		pieceRadius: .032,
		plies: 18,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		frameTone: .2,
		boardTone: .66,
		lineTone: .14,
		whiteTone: .96,
		blackTone: .05,
		paperHeight: .2,
		frameHeight: .6,
		boardHeight: .35,
		lineHeight: .3,
		pieceHeight: .85,
		grainTone: .03,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	arnoldcatmap: Object.freeze({
		dark: [
			18,
			20,
			30
		],
		light: [
			236,
			232,
			214
		],
		roughness: .5,
		relief: .004,
		sizes: Object.freeze([
			32,
			40,
			48,
			60,
			64
		]),
		glyph: Object.freeze([
			Object.freeze([
				.22,
				.15,
				.38,
				.85
			]),
			Object.freeze([
				.22,
				.15,
				.78,
				.3
			]),
			Object.freeze([
				.22,
				.46,
				.64,
				.6
			])
		]),
		rings: Object.freeze([
			.22,
			.34,
			.44
		]),
		tones: Object.freeze([
			.06,
			.34,
			.62,
			.92
		]),
		heights: Object.freeze([
			.15,
			.35,
			.55,
			.75
		]),
		inkRoughness: .5
	}),
	tablutboard: Object.freeze({
		dark: [
			34,
			26,
			20
		],
		light: [
			236,
			220,
			182
		],
		roughness: .5,
		relief: .004,
		openings: Object.freeze([
			Object.freeze([
				`d1d3`,
				`e4d4`,
				`f9f7`,
				`e5e4`
			]),
			Object.freeze([
				`a4a2`,
				`d5d4`,
				`i6i8`,
				`f5f4`,
				`a2c2`
			]),
			Object.freeze([
				`e2g2`,
				`e3f3`,
				`e8c8`,
				`e7d7`,
				`g2g3`,
				`d7d8`
			]),
			Object.freeze([
				`a6c6`,
				`c5c3`,
				`i4g4`,
				`g5g6`,
				`c6c4`,
				`e4d4`
			]),
			Object.freeze([
				`f1f3`,
				`e6d6`,
				`d9d7`,
				`e5e6`,
				`f3h3`
			]),
			Object.freeze([
				`h5h7`,
				`f5f6`,
				`b5b3`,
				`d5d6`,
				`h7h8`,
				`g5g7`
			]),
			Object.freeze([
				`d1b1`,
				`g5g4`,
				`d9b9`,
				`c5c6`,
				`b1b2`,
				`e6f6`
			]),
			Object.freeze([`i4i2`, `e7f7`])
		]),
		side: 9,
		cell: .09,
		margin: .012,
		frame: .025,
		lineHalf: 7e-4,
		pieceRadius: .032,
		kingRadius: .037,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		frameTone: .16,
		boardTone: .58,
		campTone: .46,
		markTone: .3,
		lineTone: .12,
		attackerTone: .06,
		defenderTone: .94,
		kingTone: .76,
		paperHeight: .2,
		frameHeight: .6,
		boardHeight: .4,
		campHeight: .35,
		markHeight: .25,
		lineHeight: .3,
		pieceHeight: .85,
		grainTone: .03,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	poolrack: Object.freeze({
		dark: [
			28,
			22,
			18
		],
		light: [
			236,
			226,
			204
		],
		roughness: .5,
		relief: .004,
		halfWidth: .4,
		halfHeight: .2,
		rail: .045,
		pocketRadius: .023,
		sidePocketRadius: .02,
		diamondRadius: .0045,
		ballRadius: .014,
		bandHalf: .45,
		lineHalf: .0012,
		edgeSoft: 6e-4,
		grainCells: 192,
		paperTone: .97,
		railTone: .22,
		clothTone: .5,
		pocketTone: .03,
		diamondTone: .85,
		lineTone: .72,
		cueTone: .98,
		ballTones: Object.freeze([
			.62,
			.68,
			.78,
			.34,
			.4,
			.45,
			.56,
			.01,
			.1,
			.14,
			.18,
			.26,
			.3,
			.9,
			.94
		]),
		paperHeight: .2,
		railHeight: .6,
		clothHeight: .3,
		pocketHeight: .05,
		diamondHeight: .65,
		lineHeight: .32,
		ballHeight: .9,
		grainTone: .03,
		paperRoughness: .8,
		inkRoughness: .45
	}),
	playingcardpips: Object.freeze({
		dark: [
			20,
			52,
			36
		],
		light: [
			248,
			244,
			232
		],
		roughness: .5,
		relief: .004,
		ranks: Object.freeze([
			Object.freeze([Object.freeze([0, 0])]),
			Object.freeze([Object.freeze([0, -3]), Object.freeze([0, 3])]),
			Object.freeze([
				Object.freeze([0, -3]),
				Object.freeze([0, 0]),
				Object.freeze([0, 3])
			]),
			Object.freeze([
				Object.freeze([-1, -3]),
				Object.freeze([1, -3]),
				Object.freeze([-1, 3]),
				Object.freeze([1, 3])
			]),
			Object.freeze([
				Object.freeze([-1, -3]),
				Object.freeze([1, -3]),
				Object.freeze([0, 0]),
				Object.freeze([-1, 3]),
				Object.freeze([1, 3])
			]),
			Object.freeze([
				Object.freeze([-1, -3]),
				Object.freeze([1, -3]),
				Object.freeze([-1, 0]),
				Object.freeze([1, 0]),
				Object.freeze([-1, 3]),
				Object.freeze([1, 3])
			]),
			Object.freeze([
				Object.freeze([-1, -3]),
				Object.freeze([1, -3]),
				Object.freeze([0, -1.5]),
				Object.freeze([-1, 0]),
				Object.freeze([1, 0]),
				Object.freeze([-1, 3]),
				Object.freeze([1, 3])
			]),
			Object.freeze([
				Object.freeze([-1, -3]),
				Object.freeze([1, -3]),
				Object.freeze([0, -1.5]),
				Object.freeze([-1, 0]),
				Object.freeze([1, 0]),
				Object.freeze([0, 1.5]),
				Object.freeze([-1, 3]),
				Object.freeze([1, 3])
			]),
			Object.freeze([
				Object.freeze([-1, -3]),
				Object.freeze([1, -3]),
				Object.freeze([-1, -1]),
				Object.freeze([1, -1]),
				Object.freeze([0, 0]),
				Object.freeze([-1, 1]),
				Object.freeze([1, 1]),
				Object.freeze([-1, 3]),
				Object.freeze([1, 3])
			]),
			Object.freeze([
				Object.freeze([-1, -3]),
				Object.freeze([1, -3]),
				Object.freeze([0, -2]),
				Object.freeze([-1, -1]),
				Object.freeze([1, -1]),
				Object.freeze([-1, 1]),
				Object.freeze([1, 1]),
				Object.freeze([0, 2]),
				Object.freeze([-1, 3]),
				Object.freeze([1, 3])
			])
		]),
		suits: Object.freeze([
			Object.freeze({
				tone: .55,
				discs: Object.freeze([]),
				polygons: Object.freeze([Object.freeze([
					Object.freeze([0, -1]),
					Object.freeze([.7, 0]),
					Object.freeze([0, 1]),
					Object.freeze([-.7, 0])
				])]),
				anchor: Object.freeze([0, 0])
			}),
			Object.freeze({
				tone: .4,
				discs: Object.freeze([Object.freeze([
					-.5,
					-.25,
					.5
				]), Object.freeze([
					.5,
					-.25,
					.5
				])]),
				polygons: Object.freeze([Object.freeze([
					Object.freeze([-.97, -.05]),
					Object.freeze([.97, -.05]),
					Object.freeze([0, 1])
				])]),
				anchor: Object.freeze([0, .2])
			}),
			Object.freeze({
				tone: .08,
				discs: Object.freeze([Object.freeze([
					-.5,
					.25,
					.5
				]), Object.freeze([
					.5,
					.25,
					.5
				])]),
				polygons: Object.freeze([Object.freeze([
					Object.freeze([-.97, .05]),
					Object.freeze([.97, .05]),
					Object.freeze([0, -1])
				]), Object.freeze([
					Object.freeze([-.28, 1]),
					Object.freeze([.28, 1]),
					Object.freeze([0, .35])
				])]),
				anchor: Object.freeze([0, -.2])
			}),
			Object.freeze({
				tone: .16,
				discs: Object.freeze([
					Object.freeze([
						0,
						-.5,
						.38
					]),
					Object.freeze([
						-.55,
						.2,
						.38
					]),
					Object.freeze([
						.55,
						.2,
						.38
					])
				]),
				polygons: Object.freeze([Object.freeze([
					Object.freeze([-.26, 1]),
					Object.freeze([.26, 1]),
					Object.freeze([0, -.1])
				])]),
				anchor: Object.freeze([0, .3])
			})
		]),
		columns: 5,
		rows: 4,
		cardWidth: .15,
		cardLength: .21,
		gapX: .03,
		gapY: .02,
		pipUnit: .0125,
		columnX: 2.6,
		levelStep: 1.3,
		aceScale: 2.2,
		lineHalf: .0012,
		outlineInset: .006,
		edgeSoft: 6e-4,
		tableTone: .24,
		cardTone: .95,
		outlineTone: .62,
		tableLevel: .2,
		cardLevel: .5,
		outlineLevel: .4,
		pipLevel: .7,
		inkRoughness: .45
	}),
	tenniscourt: Object.freeze({
		dark: [
			24,
			30,
			22
		],
		light: [
			236,
			236,
			228
		],
		roughness: .55,
		relief: .004,
		feet: .0075,
		courtLength: 78,
		courtWidth: 36,
		singlesWidth: 27,
		serviceDistance: 21,
		runoffEnd: 21,
		runoffSide: 12,
		lineWidth: 1 / 3,
		centreMark: 1 / 3,
		centreMarkWidth: 1 / 6,
		netThickness: .4,
		postOutside: 3,
		postRadius: .5,
		surfaces: Object.freeze([
			Object.freeze({
				court: .42,
				runoff: .3,
				ground: .18
			}),
			Object.freeze({
				court: .6,
				runoff: .54,
				ground: .38
			}),
			Object.freeze({
				court: .46,
				runoff: .4,
				ground: .28
			}),
			Object.freeze({
				court: .34,
				runoff: .26,
				ground: .14
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		netTone: .12,
		postTone: .06,
		groundHeight: .15,
		runoffHeight: .25,
		courtHeight: .3,
		lineHeight: .35,
		netHeight: .8,
		postHeight: .9,
		inkRoughness: .45
	}),
	badmintoncourt: Object.freeze({
		dark: [
			18,
			34,
			30
		],
		light: [
			238,
			240,
			232
		],
		roughness: .5,
		relief: .004,
		metre: .0517,
		courtLength: 13.4,
		courtWidth: 6.1,
		singlesWidth: 5.18,
		shortService: 1.98,
		longServiceInside: .76,
		runoffEnd: 2,
		runoffSide: 1.5,
		lineWidth: .04,
		netThickness: .06,
		postRadius: .06,
		surfaces: Object.freeze([
			Object.freeze({
				court: .46,
				runoff: .34,
				ground: .2
			}),
			Object.freeze({
				court: .4,
				runoff: .3,
				ground: .22
			}),
			Object.freeze({
				court: .52,
				runoff: .44,
				ground: .3
			}),
			Object.freeze({
				court: .34,
				runoff: .26,
				ground: .12
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		netTone: .12,
		postTone: .06,
		groundHeight: .15,
		runoffHeight: .25,
		courtHeight: .3,
		lineHeight: .35,
		netHeight: .8,
		postHeight: .9,
		inkRoughness: .45
	}),
	athleticstrack: Object.freeze({
		dark: [
			30,
			22,
			20
		],
		light: [
			240,
			236,
			226
		],
		roughness: .6,
		relief: .004,
		metre: .0049,
		straight: 84.39,
		innerRadius: 36.5,
		laneWidth: 1.22,
		lanes: 8,
		margin: 2.4,
		lineWidth: .5,
		surfaces: Object.freeze([
			Object.freeze({
				track: .5,
				infield: .34,
				margin: .28,
				ground: .18
			}),
			Object.freeze({
				track: .44,
				infield: .3,
				margin: .36,
				ground: .2
			}),
			Object.freeze({
				track: .38,
				infield: .42,
				margin: .3,
				ground: .14
			}),
			Object.freeze({
				track: .56,
				infield: .28,
				margin: .4,
				ground: .24
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		marginHeight: .25,
		infieldHeight: .2,
		trackHeight: .3,
		lineHeight: .35,
		inkRoughness: .5
	}),
	soccerpitch: Object.freeze({
		dark: [
			20,
			36,
			20
		],
		light: [
			236,
			242,
			230
		],
		roughness: .75,
		relief: .004,
		metre: .0081,
		pitchLength: 105,
		pitchWidth: 68,
		goalWidth: 7.32,
		penaltyDepth: 16.5,
		goalAreaDepth: 5.5,
		penaltyMark: 11,
		circleRadius: 9.15,
		cornerRadius: 1,
		margin: 3,
		lineWidth: .3,
		markRadius: .3,
		surfaces: Object.freeze([
			Object.freeze({
				pitch: .4,
				margin: .3,
				ground: .2
			}),
			Object.freeze({
				pitch: .34,
				margin: .42,
				ground: .24
			}),
			Object.freeze({
				pitch: .46,
				margin: .36,
				ground: .16
			}),
			Object.freeze({
				pitch: .3,
				margin: .22,
				ground: .12
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		marginHeight: .25,
		pitchHeight: .3,
		lineHeight: .35,
		inkRoughness: .7
	}),
	hockeyrink: Object.freeze({
		dark: [
			18,
			28,
			38
		],
		light: [
			236,
			242,
			248
		],
		roughness: .3,
		relief: .004,
		foot: .0042,
		rinkLength: 200,
		rinkWidth: 85,
		cornerRadius: 28,
		goalLine: 11,
		blueLine: 75,
		circleRadius: 15,
		spotRadius: 1,
		spotDistance: 20,
		spotSide: 22,
		neutralSpot: 5,
		creaseRadius: 6,
		creaseHalfWidth: 4,
		boardWidth: 2,
		thinLine: .5,
		thickLine: 1.5,
		surfaces: Object.freeze([
			Object.freeze({
				ice: .86,
				boards: .42,
				ground: .2
			}),
			Object.freeze({
				ice: .8,
				boards: .5,
				ground: .28
			}),
			Object.freeze({
				ice: .9,
				boards: .34,
				ground: .14
			}),
			Object.freeze({
				ice: .76,
				boards: .56,
				ground: .34
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		redTone: .55,
		blueTone: .3,
		groundHeight: .15,
		boardHeight: .6,
		iceHeight: .3,
		lineHeight: .35,
		inkRoughness: .35
	}),
	basketballcourt: Object.freeze({
		dark: [
			34,
			20,
			12
		],
		light: [
			244,
			226,
			196
		],
		roughness: .35,
		relief: .004,
		foot: .0085,
		courtLength: 94,
		courtWidth: 50,
		laneWidth: 16,
		laneLength: 19,
		circleRadius: 6,
		innerCircleRadius: 2,
		backboardDistance: 4,
		backboardWidth: 6,
		rimDistance: 5.25,
		rimRadius: .75,
		restrictedRadius: 4,
		threeRadius: 23.75,
		cornerInset: 3,
		margin: 6,
		lineWidth: .4,
		surfaces: Object.freeze([
			Object.freeze({
				court: .62,
				margin: .4,
				ground: .2
			}),
			Object.freeze({
				court: .54,
				margin: .34,
				ground: .14
			}),
			Object.freeze({
				court: .7,
				margin: .48,
				ground: .26
			}),
			Object.freeze({
				court: .46,
				margin: .58,
				ground: .3
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .14,
		groundHeight: .15,
		marginHeight: .25,
		courtHeight: .3,
		lineHeight: .35,
		inkRoughness: .4
	}),
	handballcourt: Object.freeze({
		dark: [
			20,
			40,
			70
		],
		light: [
			236,
			238,
			232
		],
		roughness: .4,
		relief: .004,
		metre: .0204,
		courtLength: 40,
		courtWidth: 20,
		goalWidth: 3,
		goalAreaRadius: 6,
		freeThrowRadius: 9,
		penaltyDistance: 7,
		penaltyLength: 1,
		keeperDistance: 4,
		keeperLength: .6,
		circleRadius: 2,
		endMargin: 2,
		sideMargin: 1,
		lineWidth: .2,
		goalLineWidth: .32,
		dash: .6,
		surfaces: Object.freeze([
			Object.freeze({
				court: .5,
				margin: .36,
				ground: .2
			}),
			Object.freeze({
				court: .42,
				margin: .56,
				ground: .26
			}),
			Object.freeze({
				court: .58,
				margin: .3,
				ground: .14
			}),
			Object.freeze({
				court: .36,
				margin: .46,
				ground: .3
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		marginHeight: .25,
		courtHeight: .3,
		lineHeight: .35,
		inkRoughness: .45
	}),
	highwaylanes: Object.freeze({
		dark: [
			20,
			20,
			24
		],
		light: [
			240,
			238,
			226
		],
		roughness: .8,
		relief: .004,
		foot: 1 / 120,
		laneWidth: 12,
		lanesPerSide: 2,
		shoulder: 8,
		lineWidth: .5,
		yellowGap: 1 / 3,
		dash: 10,
		gap: 30,
		surfaces: Object.freeze([
			Object.freeze({
				road: .2,
				shoulder: .32,
				roadside: .44
			}),
			Object.freeze({
				road: .16,
				shoulder: .28,
				roadside: .26
			}),
			Object.freeze({
				road: .24,
				shoulder: .38,
				roadside: .5
			}),
			Object.freeze({
				road: .3,
				shoulder: .2,
				roadside: .38
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		whiteTone: .96,
		yellowTone: .78,
		roadsideHeight: .2,
		shoulderHeight: .3,
		roadHeight: .4,
		lineHeight: .46,
		inkRoughness: .55
	}),
	cricketground: Object.freeze({
		dark: [
			18,
			40,
			18
		],
		light: [
			236,
			238,
			218
		],
		roughness: .85,
		relief: .004,
		metre: .006,
		pitchLength: 20.12,
		pitchWidth: 3.05,
		bowlingCrease: 2.64,
		stumpWidth: .23,
		stumpDepth: .3,
		poppingDistance: 1.22,
		poppingHalf: 1.83,
		returnHalf: 1.32,
		returnLength: 2.44,
		circleRadius: 27.432,
		ropeRadius: 68,
		lineWidth: .25,
		surfaces: Object.freeze([
			Object.freeze({
				outfield: .34,
				pitch: .6,
				ground: .18
			}),
			Object.freeze({
				outfield: .28,
				pitch: .52,
				ground: .4
			}),
			Object.freeze({
				outfield: .4,
				pitch: .68,
				ground: .22
			}),
			Object.freeze({
				outfield: .24,
				pitch: .46,
				ground: .34
			})
		]),
		toneShift: .04,
		edgeSoft: 3e-4,
		lineTone: .96,
		stumpTone: .1,
		groundHeight: .15,
		outfieldHeight: .25,
		pitchHeight: .32,
		lineHeight: .38,
		stumpHeight: .6,
		inkRoughness: .6
	}),
	curlingrink: Object.freeze({
		dark: [
			20,
			36,
			66
		],
		light: [
			244,
			248,
			252
		],
		roughness: .25,
		relief: .004,
		metre: 1 / 47.5,
		sheetWidth: 4.75,
		sheetLength: 45.72,
		teeDistance: 34.747,
		outerRadius: 1.829,
		middleRadius: 1.219,
		innerRadius: .61,
		buttonRadius: .152,
		backLine: 1.829,
		hackDistance: 3.658,
		hackLength: .457,
		hogDistance: 6.401,
		hogWidth: .102,
		thinLine: .1,
		surfaces: Object.freeze([
			Object.freeze({
				ice: .86,
				boards: .3
			}),
			Object.freeze({
				ice: .78,
				boards: .4
			}),
			Object.freeze({
				ice: .92,
				boards: .22
			}),
			Object.freeze({
				ice: .82,
				boards: .5
			})
		]),
		toneShift: .04,
		edgeSoft: 4e-4,
		blueTone: .4,
		whiteTone: .95,
		redTone: .6,
		lineTone: .12,
		hogTone: .55,
		boardHeight: .6,
		iceHeight: .3,
		houseHeight: .33,
		lineHeight: .36,
		inkRoughness: .3
	}),
	baseballdiamond: Object.freeze({
		dark: [
			38,
			24,
			12
		],
		light: [
			236,
			240,
			226
		],
		roughness: .9,
		relief: .004,
		foot: 1 / 220,
		centreY: 55,
		baseDistance: 90,
		baseSize: 1.25,
		plateWidth: 17 / 12,
		pitcherDistance: 60.5,
		moundCentre: 59,
		moundRadius: 9,
		rubberWidth: 2,
		rubberDepth: .5,
		boxWidth: 4,
		boxLength: 6,
		boxGap: .5,
		catcherWidth: 43 / 12,
		catcherDepth: 8,
		infieldRadius: 95,
		plateCircle: 13,
		pathWidth: 3,
		lineWidth: .5,
		surfaces: Object.freeze([
			Object.freeze({
				grass: .36,
				infield: .42,
				dirt: .56
			}),
			Object.freeze({
				grass: .3,
				infield: .36,
				dirt: .46
			}),
			Object.freeze({
				grass: .42,
				infield: .46,
				dirt: .62
			}),
			Object.freeze({
				grass: .26,
				infield: .34,
				dirt: .4
			})
		]),
		toneShift: .04,
		edgeSoft: 5e-4,
		chalkTone: .96,
		grassHeight: .3,
		infieldHeight: .32,
		dirtHeight: .2,
		chalkHeight: .4,
		inkRoughness: .7
	}),
	volleyballcourt: Object.freeze({
		dark: [
			58,
			30,
			14
		],
		light: [
			246,
			232,
			204
		],
		roughness: .4,
		relief: .004,
		metre: .03125,
		courtLength: 18,
		courtWidth: 9,
		attackDistance: 3,
		endMargin: 6.5,
		sideMargin: 5,
		lineWidth: .15,
		dash: .3,
		gap: .4,
		dashCount: 5,
		markGap: .4,
		markLength: .3,
		surfaces: Object.freeze([
			Object.freeze({
				court: .5,
				margin: .36,
				ground: .2
			}),
			Object.freeze({
				court: .42,
				margin: .56,
				ground: .26
			}),
			Object.freeze({
				court: .58,
				margin: .3,
				ground: .14
			}),
			Object.freeze({
				court: .36,
				margin: .46,
				ground: .3
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		marginHeight: .25,
		courtHeight: .3,
		lineHeight: .35,
		inkRoughness: .45
	}),
	pickleballcourt: Object.freeze({
		dark: [
			26,
			58,
			40
		],
		light: [
			236,
			240,
			230
		],
		roughness: .55,
		relief: .004,
		foot: .015625,
		courtLength: 44,
		courtWidth: 20,
		kitchenDistance: 7,
		endMargin: 8,
		sideMargin: 5,
		lineWidth: .5,
		surfaces: Object.freeze([
			Object.freeze({
				kitchen: .62,
				court: .44,
				margin: .3,
				ground: .18
			}),
			Object.freeze({
				kitchen: .34,
				court: .52,
				margin: .4,
				ground: .22
			}),
			Object.freeze({
				kitchen: .5,
				court: .36,
				margin: .56,
				ground: .28
			}),
			Object.freeze({
				kitchen: .46,
				court: .6,
				margin: .26,
				ground: .12
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		marginHeight: .25,
		courtHeight: .3,
		kitchenHeight: .32,
		lineHeight: .36,
		inkRoughness: .45
	}),
	squashcourt: Object.freeze({
		dark: [
			70,
			36,
			18
		],
		light: [
			244,
			230,
			206
		],
		roughness: .4,
		relief: .004,
		metre: .083333,
		courtLength: 9.75,
		courtWidth: 6.4,
		shortLine: 5.44,
		boxSize: 1.6,
		wallThickness: .3,
		lineWidth: .1,
		surfaces: Object.freeze([
			Object.freeze({
				court: .5,
				wall: .36,
				ground: .2
			}),
			Object.freeze({
				court: .42,
				wall: .56,
				ground: .26
			}),
			Object.freeze({
				court: .58,
				wall: .3,
				ground: .14
			}),
			Object.freeze({
				court: .36,
				wall: .46,
				ground: .3
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		wallHeight: .6,
		courtHeight: .3,
		lineHeight: .36,
		inkRoughness: .45
	}),
	gridironfield: Object.freeze({
		dark: [
			24,
			52,
			26
		],
		light: [
			238,
			242,
			226
		],
		roughness: .85,
		relief: .004,
		foot: .0026041667,
		fieldLength: 300,
		endZone: 30,
		fieldWidth: 160,
		yard: 3,
		lineSpacing: 15,
		hashSpacing: 70.75,
		endMargin: 10,
		sideMargin: 10,
		lineWidth: 1.5,
		hashWidth: 1,
		hashLength: 4,
		surfaces: Object.freeze([
			Object.freeze({
				ground: .18,
				margin: .3,
				field: .44,
				stripe: .5,
				endzone: .62
			}),
			Object.freeze({
				ground: .22,
				margin: .4,
				field: .52,
				stripe: .45,
				endzone: .34
			}),
			Object.freeze({
				ground: .28,
				margin: .56,
				field: .36,
				stripe: .42,
				endzone: .5
			}),
			Object.freeze({
				ground: .12,
				margin: .26,
				field: .6,
				stripe: .54,
				endzone: .46
			})
		]),
		toneShift: .04,
		edgeSoft: 4e-4,
		lineTone: .96,
		groundHeight: .15,
		marginHeight: .25,
		fieldHeight: .3,
		stripeHeight: .32,
		endZoneHeight: .28,
		lineHeight: .36,
		inkRoughness: .5
	}),
	netballcourt: Object.freeze({
		dark: [
			20,
			56,
			92
		],
		light: [
			240,
			240,
			232
		],
		roughness: .45,
		relief: .004,
		metre: .025,
		courtLength: 30.5,
		courtWidth: 15.25,
		goalCircleRadius: 4.9,
		centreCircleDiameter: .9,
		margin: 3.05,
		lineWidth: .15,
		surfaces: Object.freeze([
			Object.freeze({
				court: .5,
				margin: .36,
				ground: .2
			}),
			Object.freeze({
				court: .42,
				margin: .56,
				ground: .26
			}),
			Object.freeze({
				court: .58,
				margin: .3,
				ground: .14
			}),
			Object.freeze({
				court: .36,
				margin: .46,
				ground: .3
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		marginHeight: .25,
		courtHeight: .3,
		lineHeight: .35,
		inkRoughness: .45
	}),
	snookertable: Object.freeze({
		dark: [
			18,
			52,
			34
		],
		light: [
			236,
			232,
			214
		],
		roughness: .8,
		relief: .004,
		metre: .2272727,
		playLength: 3.569,
		playWidth: 1.778,
		baulkDistance: .737,
		dRadius: .292,
		blackDistance: .324,
		cushion: .05,
		rail: .1,
		cornerPocket: .075,
		middlePocket: .055,
		middleOffset: .02,
		lineWidth: .012,
		spotRadius: .02,
		surfaces: Object.freeze([
			Object.freeze({
				ground: .2,
				rail: .34,
				cushion: .46,
				cloth: .52,
				pocket: .08
			}),
			Object.freeze({
				ground: .26,
				rail: .5,
				cushion: .38,
				cloth: .44,
				pocket: .12
			}),
			Object.freeze({
				ground: .14,
				rail: .28,
				cushion: .6,
				cloth: .54,
				pocket: .06
			}),
			Object.freeze({
				ground: .3,
				rail: .56,
				cushion: .34,
				cloth: .4,
				pocket: .1
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		markTone: .94,
		groundHeight: .15,
		railHeight: .6,
		cushionHeight: .45,
		clothHeight: .3,
		pocketHeight: .05,
		markHeight: .32,
		inkRoughness: .5
	}),
	archerytarget: Object.freeze({
		dark: [
			16,
			12,
			10
		],
		light: [
			250,
			246,
			236
		],
		roughness: .7,
		relief: .004,
		metre: .5,
		zoneWidth: .061,
		xRadius: .0305,
		bossRadius: .8,
		lineWidth: .008,
		crossArm: .01,
		crossWidth: .003,
		surfaces: Object.freeze([
			Object.freeze({
				white: .92,
				black: .1,
				blue: .38,
				red: .52,
				gold: .8,
				boss: .6,
				ground: .24
			}),
			Object.freeze({
				white: .88,
				black: .16,
				blue: .56,
				red: .34,
				gold: .72,
				boss: .46,
				ground: .3
			}),
			Object.freeze({
				white: .94,
				black: .06,
				blue: .3,
				red: .62,
				gold: .84,
				boss: .54,
				ground: .16
			}),
			Object.freeze({
				white: .84,
				black: .2,
				blue: .62,
				red: .44,
				gold: .66,
				boss: .7,
				ground: .28
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .04,
		paleLineTone: .96,
		groundHeight: .15,
		bossHeight: .3,
		faceHeight: .36,
		lineHeight: .4,
		inkRoughness: .55
	}),
	runwaymarkings: Object.freeze({
		dark: [
			26,
			28,
			30
		],
		light: [
			238,
			238,
			232
		],
		roughness: .85,
		relief: .004,
		metre: .0012195122,
		tileLength: 820,
		startOffset: 40,
		runwayWidth: 45,
		shoulder: 7.5,
		thresholdStart: 6,
		thresholdLength: 30,
		thresholdStripes: 12,
		thresholdStripeWidth: 1.8,
		thresholdGap: 1.8,
		centreStripe: 30,
		centreGap: 20,
		centreWidth: 1.8,
		centreStart: 80,
		aimingStart: 400,
		aimingLength: 60,
		aimingWidth: 6,
		markSpacing: 18,
		touchdownFirst: 150,
		touchdownSpacing: 150,
		touchdownLength: 22.5,
		touchdownWidth: 3,
		touchdownPairs: 6,
		touchdownClear: 50,
		sideStripeWidth: 1.8,
		surfaces: Object.freeze([
			Object.freeze({
				runway: .18,
				shoulder: .34,
				ground: .5
			}),
			Object.freeze({
				runway: .26,
				shoulder: .44,
				ground: .34
			}),
			Object.freeze({
				runway: .12,
				shoulder: .28,
				ground: .42
			}),
			Object.freeze({
				runway: .3,
				shoulder: .4,
				ground: .56
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		markTone: .95,
		groundHeight: .15,
		shoulderHeight: .25,
		runwayHeight: .3,
		markHeight: .34,
		inkRoughness: .6
	}),
	fieldhockeypitch: Object.freeze({
		dark: [
			18,
			60,
			40
		],
		light: [
			238,
			242,
			232
		],
		roughness: .7,
		relief: .004,
		metre: .00909091,
		pitchLength: 91.4,
		pitchWidth: 55,
		goalWidth: 3.66,
		twentyThree: 22.9,
		circleRadius: 14.63,
		brokenRadius: 19.63,
		penaltyDistance: 6.4,
		innerEnd: 3,
		innerSide: 2,
		outerEnd: 2,
		outerSide: 1,
		lineWidth: .45,
		dash: .9,
		gap: 3,
		spotRadius: .3,
		surfaces: Object.freeze([
			Object.freeze({
				pitch: .46,
				inner: .38,
				outer: .58,
				ground: .2
			}),
			Object.freeze({
				pitch: .4,
				inner: .52,
				outer: .3,
				ground: .58
			}),
			Object.freeze({
				pitch: .56,
				inner: .34,
				outer: .44,
				ground: .14
			}),
			Object.freeze({
				pitch: .34,
				inner: .46,
				outer: .6,
				ground: .28
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		outerHeight: .22,
		innerHeight: .26,
		pitchHeight: .3,
		lineHeight: .35,
		inkRoughness: .5
	}),
	futsalcourt: Object.freeze({
		dark: [
			24,
			46,
			92
		],
		light: [
			240,
			238,
			228
		],
		roughness: .4,
		relief: .004,
		metre: .0208333,
		courtLength: 40,
		courtWidth: 20,
		centreRadius: 3,
		centreMark: .24,
		penaltyStraight: 3.16,
		areaRadius: 6,
		penaltyDistance: 6,
		secondDistance: 10,
		markRadius: .24,
		retreatRadius: .16,
		retreatOffset: 5,
		fiveLength: 1.6,
		cornerRadius: 1,
		cornerMarkDistance: 5,
		cornerMarkGap: .2,
		cornerMarkLength: 1.6,
		substitutionStart: 5,
		substitutionZone: 5,
		substitutionLength: 3.2,
		margin: 3,
		lineWidth: .32,
		surfaces: Object.freeze([
			Object.freeze({
				court: .5,
				area: .38,
				margin: .3,
				ground: .18
			}),
			Object.freeze({
				court: .42,
				area: .56,
				margin: .34,
				ground: .24
			}),
			Object.freeze({
				court: .6,
				area: .44,
				margin: .26,
				ground: .12
			}),
			Object.freeze({
				court: .36,
				area: .5,
				margin: .46,
				ground: .28
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		groundHeight: .15,
		marginHeight: .25,
		courtHeight: .3,
		lineHeight: .35,
		inkRoughness: .45
	}),
	tabletennistable: Object.freeze({
		dark: [
			20,
			52,
			96
		],
		light: [
			238,
			238,
			232
		],
		roughness: .45,
		relief: .004,
		metre: .25,
		tableLength: 2.74,
		tableWidth: 1.525,
		lineWidth: .08,
		centreWidth: .012,
		netWidth: .04,
		netReach: .1525,
		surfaces: Object.freeze([
			Object.freeze({
				floor: .45,
				table: .16
			}),
			Object.freeze({
				floor: .3,
				table: .22
			}),
			Object.freeze({
				floor: .55,
				table: .12
			}),
			Object.freeze({
				floor: .2,
				table: .1
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		floorHeight: .15,
		tableHeight: .3,
		lineHeight: .35,
		netHeight: .9,
		inkRoughness: .45
	}),
	fencingpiste: Object.freeze({
		dark: [
			28,
			44,
			70
		],
		light: [
			236,
			238,
			232
		],
		roughness: .45,
		relief: .004,
		metre: .05,
		pisteLength: 14,
		pisteWidth: 1.5,
		guardDistance: 2,
		warningLength: 2,
		runback: 1.5,
		lineWidth: .1,
		dashPieces: 11,
		surfaces: Object.freeze([
			Object.freeze({
				floor: .6,
				piste: .4,
				warning: .52,
				runback: .3
			}),
			Object.freeze({
				floor: .3,
				piste: .45,
				warning: .22,
				runback: .38
			}),
			Object.freeze({
				floor: .45,
				piste: .22,
				warning: .34,
				runback: .12
			}),
			Object.freeze({
				floor: .2,
				piste: .32,
				warning: .45,
				runback: .1
			})
		]),
		toneShift: .04,
		edgeSoft: 6e-4,
		lineTone: .96,
		floorHeight: .15,
		runbackHeight: .26,
		pisteHeight: .3,
		lineHeight: .35,
		inkRoughness: .45
	}),
	code128barcodes: Object.freeze({
		dark: [
			14,
			14,
			18
		],
		light: [
			248,
			246,
			238
		],
		roughness: .55,
		relief: .0012,
		rows: 5,
		symbols: 6,
		quietUnits: 10,
		barHeight: .62,
		edgeSoft: 6e-4,
		widths: Object.freeze(`212222.222122.222221.121223.121322.131222.122213.122312.132212.221213.221312.231212.112232.122132.122231.113222.123122.123221.223211.221132.221231.213212.223112.312131.311222.321122.321221.312212.322112.322211.212123.212321.232121.111323.131123.131321.112313.132113.132311.211313.231113.231311.112133.112331.132131.113123.113321.133121.313121.211331.231131.213113.213311.213131.311123.311321.331121.312113.312311.332111.314111.221411.431111.111224.111422.121124.121421.141122.141221.112214.112412.122114.122411.142112.142211.241211.221114.413111.241112.134111.111242.121142.121241.114212.124112.124211.411212.421112.421211.212141.214121.412121.111143.111341.131141.114113.114311.411113.411311.113141.114131.311141.411131.211412.211214.211232.233111`.split(`.`)),
		surfaces: Object.freeze([
			Object.freeze({
				paper: .95,
				ink: .06
			}),
			Object.freeze({
				paper: .72,
				ink: .1
			}),
			Object.freeze({
				paper: .85,
				ink: .22
			}),
			Object.freeze({
				paper: .6,
				ink: .04
			})
		]),
		toneShift: .04,
		inkHeight: .55,
		paperHeight: .3,
		inkRoughness: .4,
		paperRoughness: .72
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
	code128barcodes: 1,
	fencingpiste: 1,
	tabletennistable: 1,
	futsalcourt: 1,
	fieldhockeypitch: 1,
	runwaymarkings: 1,
	archerytarget: 1,
	snookertable: 1,
	netballcourt: 1,
	gridironfield: 1,
	squashcourt: 1,
	pickleballcourt: 1,
	volleyballcourt: 1,
	baseballdiamond: 1,
	curlingrink: 1,
	cricketground: 1,
	highwaylanes: 1,
	handballcourt: 1,
	basketballcourt: 1,
	hockeyrink: 1,
	soccerpitch: 1,
	athleticstrack: 1,
	badmintoncourt: 1,
	tenniscourt: 1,
	playingcardpips: 1,
	poolrack: 1,
	tablutboard: 1,
	arnoldcatmap: 1,
	ninemensmorris: 1,
	carromboard: 1,
	shogiboard: 1,
	ludoboard: 1,
	chessopening: 1,
	xiangqiboard: 1,
	cribbageboard: 1,
	monopolyboard: 1,
	scrabbleboard: 1,
	duccirows: 1,
	wireworldcircuit: 1,
	cycliccellular: 1,
	beattypartition: 1,
	walshmatrix: 1,
	paperfoldingruler: 1,
	rudinshapirogrid: 1,
	baumsweetgrid: 1,
	binarynecklaces: 1,
	catalantriangulations: 1,
	eisensteinprimes: 1,
	keplerorbit: 1,
	pythagoreanproof: 1,
	contributiongraph: 1,
	arbelos: 1,
	eulerlinetriangle: 1,
	astroidladder: 1,
	slopegraph: 1,
	kolakoskisequence: 1,
	crcdivision: 1,
	lfsrstates: 1,
	fareysequence: 1,
	unionfindmerges: 1,
	linearprobing: 1,
	bloomfilter: 1,
	gamblersruin: 1,
	nimgame: 1,
	wordlefeedback: 1,
	funnelchart: 1,
	lrucachetrace: 1,
	prefixtrie: 1,
	knapsacktable: 1,
	bfswavefront: 1,
	bresenhamlines: 1,
	mergesortruns: 1,
	radixsortpasses: 1,
	paretochart: 1,
	vernierscale: 1,
	kmpfailure: 1,
	dijkstragrid: 1,
	binarysearchsteps: 1,
	quicksortsteps: 1,
	ganttschedule: 1,
	lorenzcurve: 1,
	zordercurve: 1,
	histogrambins: 1,
	sankeyflows: 1,
	bodeplots: 1,
	huffmancodes: 1,
	hashchains: 1,
	editdistance: 1,
	nearesttour: 1,
	karnaughmap: 1,
	bsttreeorder: 1,
	kdtreesplits: 1,
	spanningtree: 1,
	ecdfplot: 1,
	intervalpartition: 1,
	waterfallchart: 1,
	chorddiagrams: 1,
	qamconstellation: 1,
	countertimings: 1,
	hofstadterq: 1,
	semaphorefigures: 1,
	fenwicktree: 1,
	jacobisymbols: 1,
	vicsekfractal: 1,
	segmenttree: 1,
	rankchevrons: 1,
	windbarbs: 1,
	compassrose: 1,
	smithchart: 1,
	mahjongdots: 1,
	qrcodemodules: 1,
	gaugedials: 1,
	flagpatterns: 1,
	intelhexrecords: 1,
	equalizerbars: 1,
	worleycells: 1,
	errordiffusion: 1,
	tetrominoes: 1,
	candlestickcharts: 1,
	paleygraphmatrix: 1,
	superformulacells: 1,
	tsquarefractal: 1,
	marchingsquares: 1,
	wangtiles: 1,
	htreefractal: 1,
	lsystemplant: 1,
	quadtreecells: 1,
	countingrods: 1,
	braiddiagram: 1,
	youngtableaux: 1,
	euclidsquares: 1,
	voronoicells: 1,
	cliffordattractor: 1,
	peanocurve: 1,
	bitwisetable: 1,
	golombrulers: 1,
	henonattractor: 1,
	digitalroottable: 1,
	thuemorsegrid: 1,
	recamanarcs: 1,
	happynumberchains: .8,
	lookandsayrows: .8,
	kaprekarsteps: .8,
	roundrobintable: .8,
	roulettewheel: .9,
	circleoffifths: .9,
	periodictablecells: 1,
	josephuscircle: .9,
	gaussianprimes: .8,
	timestablecircles: .9,
	divisorcountbars: 1,
	cobwebplots: .8,
	sierpinskipascal: .8,
	sacksspiral: 1,
	dyckpaths: .7,
	figuratenumbers: .8,
	pythagoreantriples: .5,
	hexdumprows: .6,
	pairingtables: .8,
	ferrersdiagrams: .7,
	zeckendorfrows: .5,
	cycloidcusps: .9,
	sternbrocottree: .5,
	projectilearcs: .6,
	isbn10checks: .5,
	runlengthrows: .5,
	graphcoloring: .6,
	bubblesortpasses: .5,
	binaryheaptree: .6,
	dicesumbars: .5,
	substitutionwords: .6,
	stemandleaf: .5,
	boxplots: .6,
	sorobanabacus: .5,
	numberwords: .5,
	dipolefieldlines: .6,
	mobiusgrid: .6,
	fordcircles: .6,
	vectorfieldarrows: .6,
	wordsquares: .5,
	caesarcipher: .5,
	baseconversion: .5,
	primefactors: .5,
	modularpowers: .5,
	burningship: .6,
	logisticbifurcation: .6,
	bitwiselogic: .5,
	gcdtable: .5,
	percolationclusters: .6,
	abeliansandpile: .6,
	binaryaddition: .5,
	roundingmodes: .5,
	bellcurvebands: .6,
	ieee754floats: .5,
	vennregions: .5,
	bezierconstruction: .6,
	luhnnumbers: .4,
	twosourceripples: .5,
	cassiniovals: .5,
	rosecurves: .6,
	conicsections: .6,
	cantorsetrows: .8,
	mandelbrotbands: .6,
	newtonbasins: .6,
	kochsnowflake: .5,
	matrixproducts: .4,
	signedencodings: .4,
	romannumerals: .4,
	cayleytables: .4,
	hammingcodewords: .4,
	collatzsequences: .5,
	delaunaytriangles: .5,
	convexhullpoints: .5,
	pascaltrianglenumbers: .5,
	fouriersquarewaves: .5,
	truthtablelogic: .4,
	barchartbars: .4,
	regressionscatter: .4,
	piechartwedges: .5,
	analogclocks: .5,
	treemaprects: .5,
	moonphases: .5,
	multiplicationtable: .4,
	draughtsposition: .5,
	colormapregions: .5,
	chinesecheckersboard: .6,
	euclideanrhythms: .4,
	hidatochain: .5,
	mancalaboard: .6,
	rushhourjam: .5,
	numberlinkpaths: .4,
	kenkencages: .4,
	takuzugrid: .4,
	akarilights: .4,
	hitorishading: .4,
	shikakurects: .5,
	tentsandtrees: .5,
	nurikabeislands: .5,
	futoshikigrid: .4,
	fillominoregions: .5,
	stringartcurves: .4,
	masyupearls: .5,
	slitherlinkloop: .5,
	hashibridges: .5,
	kakuropuzzle: .5,
	hexresourceboard: .5,
	bowlingscoresheet: .5,
	dewbeads: .3,
	goboards: .4,
	othelloboard: .4,
	binaryclock: .4,
	pianoroll: .5,
	skyscraperpuzzles: .4,
	knockoutbracket: .5,
	primesieve: .5,
	sortingnetworks: .4,
	mayansums: .5,
	latinsquares: .4,
	hanoitowers: .4,
	eightqueens: .4,
	cantordust: .5,
	dragoncurve: .5,
	pascalmodulo: .4,
	gameoflife: .4,
	oghaminscription: .5,
	kaleidoscope: .4,
	slidingpuzzle: .3,
	magicsquares: .4,
	wordsearchgrid: .35,
	mastermindboard: .35,
	elementaryautomata: .4,
	bluenoisemask: .2,
	fibonaccisquares: .4,
	doubleslitfringes: .4,
	sundialplate: .4,
	ledgersheet: .3,
	louvershutter: .4,
	chesterfieldtufting: .5,
	polargraphpaper: .3,
	tallymarks: .3,
	quasicrystalwaves: .4,
	tictactoegames: .3,
	dartboardsectors: .5,
	featherbarbs: .25,
	amidakuji: .3,
	code39barcodes: .3,
	graycodediscs: .35,
	knightstour: .4,
	scrambledcubenet: .4,
	weavingdraft: .4,
	lightsoutboard: .25,
	nonogrampuzzle: .36,
	juliacells: .4,
	spirographrosettes: .3,
	sliderulescale: .25,
	xylophonebars: .4,
	pegsolitaire: .35,
	bingocard: .3,
	connectfourboard: .5,
	ramennoodles: .3,
	jigsawpuzzle: .5,
	backgammonboard: .6,
	zoneplates: .2,
	lissajousgrid: .4,
	mondriancomposition: .6,
	hilbertcurve: .3,
	battleshipgrid: .4,
	tetrisstack: .4,
	minesweeperboard: .4,
	flipdotdisplay: .5,
	crosswordgrid: .3,
	fretboard: .32,
	calendarpage: .3,
	measuringtape: .16,
	sudokugrid: .25,
	sheetmusic: .3,
	ecgpaper: .08,
	datamatrixcodes: .4,
	frostpolygons: 1.5,
	sandripples: 1,
	morsetape: .4,
	ean13barcodes: .35,
	kilimflatweave: 1.2,
	tumblingblocks: .6,
	azulejotiles: .8,
	moirefringes: .3,
	cinderblockwall: 1.6,
	dicefaces: .4,
	needlepoint: .3,
	mandalaflower: .6,
	kiwislices: .25,
	hazardstripes: .5,
	radarscope: .3,
	digitalcamo: 1,
	topographiccontours: 1,
	garnetschist: .4,
	celticplait: .5,
	atomicboomerang: .6,
	lawnstripes: 2,
	asphaltshingle: 1,
	expandedpolystyrene: .12,
	octopussuckers: .4,
	ammonitestone: .5,
	amberresin: .2,
	patchworkquilt: .8,
	bayerdither: .32,
	turingpattern: .4,
	mudcloth: .5,
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
	cupwashers: .1
});
//#endregion
exports.proceduralMaterialLimits = proceduralMaterialLimits;
exports.proceduralMaterialPresets = proceduralMaterialPresets;
exports.proceduralTileMeters = proceduralTileMeters;

//# sourceMappingURL=materials.cjs.map