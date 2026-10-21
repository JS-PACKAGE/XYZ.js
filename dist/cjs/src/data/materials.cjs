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
	cantaloupe: .14,
	dragonfruit: .18,
	kiwiskin: .045
});
var iridescenceFilmRange = Object.freeze({
	minNm: 100,
	maxNm: 800
});
//#endregion
exports.iridescenceFilmRange = iridescenceFilmRange;
exports.proceduralMaterialLimits = proceduralMaterialLimits;
exports.proceduralMaterialPresets = proceduralMaterialPresets;
exports.proceduralTileMeters = proceduralTileMeters;

//# sourceMappingURL=materials.cjs.map