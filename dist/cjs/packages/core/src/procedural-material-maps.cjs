const require_hypot = require("../../math/src/hypot.cjs");
const require_materials = require("../../../src/data/materials.cjs");
//#region dist/packages/core/src/procedural-material-maps.js
var n = Math.PI * 2;
var clamp = (e) => Math.max(0, Math.min(1, e));
var fract = (e) => e - Math.floor(e);
var smooth = (e) => e * e * (3 - 2 * e);
var byte = (e) => Math.round(clamp(e) * 255);
function hash(e, t, n) {
	let r = (n ^ Math.imul(e, 2654435761) ^ Math.imul(t, 2246822507)) >>> 0;
	return r = Math.imul(r ^ r >>> 16, 2146121005), r = Math.imul(r ^ r >>> 15, 2221713035), ((r ^ r >>> 16) >>> 0) / 4294967295;
}
function noise(e, t, n, r, i) {
	let a = fract(e) * n, o = fract(t) * r, s = Math.floor(a), c = Math.floor(o), l = smooth(a - s), u = smooth(o - c), d = hash(s, c, i), f = hash((s + 1) % n, c, i), p = hash(s, (c + 1) % r, i), m = hash((s + 1) % n, (c + 1) % r, i);
	return (d + (f - d) * l) * (1 - u) + (p + (m - p) * l) * u;
}
function cachedNoise(e, t, n) {
	let r = new Float64Array(e * t);
	for (let i = 0; i < t; i++) for (let t = 0; t < e; t++) r[i * e + t] = hash(t, i, n);
	return (n, i) => {
		let a = fract(n) * e, o = fract(i) * t, s = Math.floor(a), c = Math.floor(o), l = smooth(a - s), u = smooth(o - c), d = (s + 1) % e, f = (c + 1) % t * e, p = r[c * e + s], m = r[c * e + d], h = r[f + s], g = r[f + d];
		return (p + (m - p) * l) * (1 - u) + (h + (g - h) * l) * u;
	};
}
function wrappedFeature(e, t, n, r) {
	let i = Math.floor(e * n), a = Math.floor(t * n), o = 4;
	for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
		let l = i + c, u = a + s, d = (l % n + n) % n, f = (u % n + n) % n, p = (l + hash(d, f, r)) / n, m = (u + hash(d, f, r ^ 40503)) / n, h = e - p, g = t - m, _ = h * h + g * g;
		_ < o && (o = _);
	}
	return Math.sqrt(o) * n;
}
function createSurfaceSampler(t, r) {
	let i = require_materials.proceduralMaterialPresets[t], a = hash(0, 0, r) * n, o = t === `encaustictiles` ? .12 * Math.sin(a) : 0, s = Math.cos(o), c = Math.sin(o), l = t === `tactilepaving` || t === `roadmarking` || t === `draincover`, u = l ? cachedNoise(96, 96, r ^ 10865) : null, d = t === `mushroomgills` || t === `morel` || t === `bracketfungus`, f = d ? cachedNoise(80, 80, r ^ 27961) : null, p = t === `pineapple` || t === `strawberry` || t === `lychee`, m = p ? cachedNoise(96, 96, r ^ 24923) : null, h = t === `strawberry` ? require_materials.proceduralMaterialPresets.strawberry.columns : t === `lychee` ? require_materials.proceduralMaterialPresets.lychee.columns : require_materials.proceduralMaterialPresets.pineapple.cells, g = t === `strawberry` ? require_materials.proceduralMaterialPresets.strawberry.rows : t === `lychee` ? require_materials.proceduralMaterialPresets.lychee.rows : h, _ = t === `strawberry` ? 4 : t === `lychee` ? 8 : 1, v = p ? new Float64Array(h * g * _) : null;
	if (v) for (let n = 0; n < g; n++) for (let i = 0; i < h; i++) {
		let a = (n * h + i) * _;
		if (t === `strawberry`) {
			let e = .3 * (hash(i, n, r ^ 12711) - .5);
			v[a] = .42 + .16 * hash(i, n, r ^ 10557), v[a + 1] = .42 + .16 * hash(i, n, r ^ 18235), v[a + 2] = Math.cos(e), v[a + 3] = Math.sin(e);
		} else if (t === `lychee`) {
			let t = require_materials.proceduralMaterialPresets.lychee;
			for (let e = 0; e < 6; e++) v[a + e] = t.edge + t.jitter * (2 * hash(i, n, r ^ 14107 + e * 40503) - 1);
			v[a + 6] = .24 * (hash(i, n, r ^ 10557) - .5), v[a + 7] = .24 * (hash(i, n, r ^ 18235) - .5);
		} else v[a] = hash(i, n, r ^ 14107);
	}
	let y = t === `mushroomgills` ? require_materials.proceduralMaterialPresets.mushroomgills : require_materials.proceduralMaterialPresets.bracketfungus, b = t === `mushroomgills` || t === `bracketfungus` ? new Float64Array(y.cells * y.cells * 7) : null;
	if (b) for (let e = 0; e < y.cells; e++) for (let t = 0; t < y.cells; t++) {
		let i = (e * y.cells + t) * 7, a = .5 * (hash(t, e, r ^ 11585) - .5);
		b[i] = .4 + .2 * hash(t, e, r ^ 6083), b[i + 1] = .4 + .2 * hash(t, e, r ^ 22967), b[i + 2] = Math.cos(a) / y.scale, b[i + 3] = Math.sin(a) / y.scale, b[i + 4] = n * hash(t, e, r ^ 29609), b[i + 5] = .5 + .1 * hash(t, e, r ^ 15185), b[i + 6] = .85 + .15 * hash(t, e, r ^ 20263);
	}
	let x = require_materials.proceduralMaterialPresets.morel, S = t === `morel` ? new Float64Array(x.columns * x.rows * 5) : null;
	if (S) for (let e = 0; e < x.rows; e++) for (let t = 0; t < x.columns; t++) {
		let n = (e * x.columns + t) * 5, i = .85 + .3 * hash(t, e, r ^ 25047);
		S[n] = .5 + x.jitter * (2 * hash(t, e, r ^ 9145) - 1), S[n + 1] = .5 + x.jitter * (2 * hash(t, e, r ^ 18337) - 1), S[n + 2] = i / x.support, S[n + 3] = 1 / (i * x.support), S[n + 4] = .3 * (hash(t, e, r ^ 30147) - .5) / x.support;
	}
	let C = t === `tactilepaving` ? cachedNoise(require_materials.proceduralMaterialPresets.tactilepaving.tiles, require_materials.proceduralMaterialPresets.tactilepaving.tiles, r ^ 23443) : null, w = t === `roadmarking` ? cachedNoise(require_materials.proceduralMaterialPresets.roadmarking.wearColumns, require_materials.proceduralMaterialPresets.roadmarking.wearRows, r ^ 25553) : null, ee = t === `elephanthide` || t === `ostrichleather` || t === `sharkskin`, T = ee ? cachedNoise(96, 96, r ^ 25011) : null, te = t === `elephanthide` ? cachedNoise(4, 4, r ^ 11641) : null, E = t === `ostrichleather` ? /* @__PURE__ */ new Float64Array(108) : null;
	if (E) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 3;
		E[n] = .25 + .5 * hash(t, e, r ^ 6967), E[n + 1] = .25 + .5 * hash(t, e, r ^ 20369), E[n + 2] = 1 / (.2 + .05 * hash(t, e, r ^ 29605));
	}
	let ne = t === `sharkskin` ? /* @__PURE__ */ new Float64Array(432) : null;
	if (ne) for (let e = 0; e < 24; e++) for (let t = 0; t < 18; t++) ne[e * 18 + t] = hash(t, e, r ^ 15719);
	let re = t === `birchbark` || t === `palmtrunk` || t === `sycamorebark`, ie = re ? cachedNoise(64, 64, r ^ 21687) : null, ae = re && t !== `sycamorebark` ? cachedNoise(4, 4, r ^ 12761) : null, oe = t === `palmtrunk` ? cachedNoise(96, 8, r ^ 10161) : null, se = t === `birchbark` ? 7 : 4, ce = t === `birchbark` ? 10 : 4, le = t === `birchbark` ? 5 : 6, D = t === `birchbark` || t === `sycamorebark` ? new Float64Array(se * ce * le) : null;
	if (D) for (let e = 0; e < ce; e++) for (let i = 0; i < se; i++) {
		let a = (e * se + i) * le, o = t === `birchbark`;
		D[a] = .25 + .5 * hash(i, e, r ^ 6611), D[a + 1] = .25 + .5 * hash(i, e, r ^ 26553), D[a + 2] = (o ? .2 : .72) + (o ? .23 : .13) * hash(i, e, r ^ 17313), D[a + 3] = (o ? .035 : .72) + (o ? .04 : .13) * hash(i, e, r ^ 30161), D[a + 4] = o ? .65 + .35 * hash(i, e, r ^ 11633) : n * hash(i, e, r ^ 14775), o || (D[a + 5] = Math.min(2, Math.floor(3 * hash(i, e, r ^ 20899))) * .32 + .18);
	}
	let ue = t === `palmtrunk` ? /* @__PURE__ */ new Float64Array(36) : null;
	if (ue) for (let e = 0; e < 9; e++) {
		let t = e * 4;
		ue[t] = (e + .2 + .6 * hash(0, e, r ^ 6057)) / 9, ue[t + 1] = .006 + .005 * hash(0, e, r ^ 27059), ue[t + 2] = n * hash(0, e, r ^ 16855), ue[t + 3] = .7 + .3 * hash(0, e, r ^ 21425);
	}
	let de = t === `rosepetal` || t === `lilypetal` || t === `fritillarypetal`, fe = t === `rosepetal` || t === `fritillarypetal` ? cachedNoise(4, 4, r ^ 10201) : null, pe = de ? cachedNoise(48, 48, r ^ 25521) : null, me = t === `rosepetal` ? 48 : 9, he = t === `rosepetal` ? 48 : 7, O = t === `rosepetal` || t === `lilypetal` ? new Float64Array(me * he * 8) : null;
	if (O) for (let e = 0; e < he; e++) for (let n = 0; n < me; n++) {
		let i = (e * me + n) * 8, a = t === `rosepetal`, o = a ? .3 : .15, s = a ? .4 : .7, c = (a ? 1 : .22) * (hash(n, e, r ^ 22979) - .5);
		O[i] = o + s * hash(n, e, r ^ 12711), O[i + 1] = o + s * hash(n, e, r ^ 18409), O[i + 2] = Math.cos(c), O[i + 3] = Math.sin(c), O[i + 4] = 1 / (a ? .38 + .07 * hash(n, e, r ^ 27923) : .13), O[i + 5] = 1 / (a ? .38 + .07 * hash(n, e, r ^ 6999) : .43), O[i + 6] = !a && hash(n, e, r ^ 11159) < .24 ? 0 : .65 + .35 * hash(n, e, r ^ 29097), O[i + 7] = a ? 0 : .5 * (hash(n, e, r ^ 14805) - .5);
	}
	let ge = t === `cantaloupe` || t === `dragonfruit` || t === `kiwiskin`, _e = ge ? cachedNoise(64, 64, r ^ 17895) : null, ve = t === `cantaloupe` ? cachedNoise(4, 4, r ^ 29091) : null, ye = t === `cantaloupe` ? /* @__PURE__ */ new Float64Array(1274) : null;
	if (ye) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = (e * 7 + t) * 26, i = .25 + .5 * hash(t, e, r ^ 12977), a = .25 + .5 * hash(t, e, r ^ 26585);
		ye[n] = i, ye[n + 1] = a;
		let o = n + 2;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 7) % 7, l = (e + n + 7) % 7, u = s + .25 + .5 * hash(c, l, r ^ 12977) - i, d = n + .25 + .5 * hash(c, l, r ^ 26585) - a, f = 1 / Math.sqrt(u * u + d * d);
			ye[o++] = u * f, ye[o++] = d * f, ye[o++] = .5 / f;
		}
	}
	let k = t === `dragonfruit` ? /* @__PURE__ */ new Float64Array(120) : null;
	if (k) for (let e = 0; e < 6; e++) for (let t = 0; t < 4; t++) {
		let n = (e * 4 + t) * 5, i = .24 * (hash(t, e, r ^ 21417) - .5);
		k[n] = .25 + e % 2 * .5 + .12 * (hash(t, e, r ^ 15473) - .5), k[n + 1] = .5 + .12 * (hash(t, e, r ^ 27923) - .5), k[n + 2] = Math.cos(i), k[n + 3] = Math.sin(i), k[n + 4] = .85 + .15 * hash(t, e, r ^ 10727);
	}
	let be = t === `kiwiskin` ? /* @__PURE__ */ new Float64Array(6480) : null;
	if (be) for (let e = 0; e < 36; e++) for (let t = 0; t < 36; t++) {
		let i = (e * 36 + t) * 5, a = n * hash(t, e, r ^ 12179);
		be[i] = .3 + .4 * hash(t, e, r ^ 17335), be[i + 1] = .3 + .4 * hash(t, e, r ^ 27217), be[i + 2] = Math.cos(a), be[i + 3] = Math.sin(a), be[i + 4] = .75 + .25 * hash(t, e, r ^ 6611);
	}
	let xe = t === `zebrafur` || t === `leopardfur` || t === `giraffefur`, Se = xe ? cachedNoise(5, 7, r ^ 29369) : null, Ce = xe ? cachedNoise(96, 64, r ^ 19475) : null, we = xe ? /* @__PURE__ */ new Float64Array(5120) : null;
	if (we) for (let e = 0; e < 32; e++) for (let t = 0; t < 40; t++) {
		let n = (e * 40 + t) * 4, i = Math.PI / 2 + .65 * (hash(t, e, r ^ 5949) - .5);
		we[n] = .3 + .4 * hash(t, e, r ^ 21409), we[n + 1] = .3 + .4 * hash(t, e, r ^ 27433), we[n + 2] = Math.cos(i), we[n + 3] = Math.sin(i);
	}
	let A = t === `leopardfur` ? /* @__PURE__ */ new Float64Array(175) : null;
	if (A) for (let e = 0; e < 5; e++) for (let t = 0; t < 5; t++) {
		let i = (e * 5 + t) * 7, a = n * hash(t, e, r ^ 14759);
		A[i] = .32 + .36 * hash(t, e, r ^ 6627), A[i + 1] = .32 + .36 * hash(t, e, r ^ 23921), A[i + 2] = Math.cos(a), A[i + 3] = Math.sin(a), A[i + 4] = 1 / (.39 + .08 * hash(t, e, r ^ 27701)), A[i + 5] = 1 / (.34 + .07 * hash(t, e, r ^ 12057)), A[i + 6] = hash(t, e, r ^ 29617);
	}
	let Te = t === `giraffefur` ? /* @__PURE__ */ new Float64Array(972) : null;
	if (Te) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 27, i = .3 + .4 * hash(t, e, r ^ 17337), a = .3 + .4 * hash(t, e, r ^ 27159);
		Te[n] = i, Te[n + 1] = a, Te[n + 2] = hash(t, e, r ^ 10195);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 6) % 6, l = (e + n + 6) % 6, u = s + .3 + .4 * hash(c, l, r ^ 17337) - i, d = n + .3 + .4 * hash(c, l, r ^ 27159) - a, f = Math.sqrt(u * u + d * d);
			Te[o++] = u / f, Te[o++] = d / f, Te[o++] = f / 2;
		}
	}
	let Ee = t === `endgrain` ? hash(0, 0, r ^ 15127) : 0, De = t === `endgrain` ? hash(0, 0, r ^ 23849) : 0, Oe = t === `houndstooth` ? /* @__PURE__ */ new Float64Array(64) : null;
	if (Oe) for (let e = 0; e < 8; e++) for (let t = 0; t < 8; t++) Oe[e * 8 + t] = ((t - e + 8) % 4 < 2 ? t : e) < 4 ? 0 : 1;
	let ke = t === `damask` ? /* @__PURE__ */ new Float64Array(72) : null;
	if (ke) for (let e = 0; e < 12; e++) {
		let t = 0, r = -.18, i = 0, a = .065, o = .065;
		if (e < 6) i = n * e / 6 + Math.PI / 2, t = .085 * Math.cos(i), r += .085 * Math.sin(i), a = .12, o = .055;
		else if (e < 10) {
			let n = e % 2 == 0 ? -1 : 1;
			t = n * (e < 8 ? .115 : .09), r = e < 8 ? .095 : .275, i = n * -.65, a = e < 8 ? .145 : .115, o = .06;
		} else e === 11 && (r = .12, i = Math.PI / 2, a = .26, o = .018);
		let s = e * 6;
		ke[s] = t, ke[s + 1] = r, ke[s + 2] = Math.cos(i), ke[s + 3] = Math.sin(i), ke[s + 4] = 1 / a, ke[s + 5] = 1 / o;
	}
	let Ae = t === `closedcellfoam` ? /* @__PURE__ */ new Float64Array(3136) : null;
	if (Ae) for (let e = 0; e < 28; e++) for (let t = 0; t < 28; t++) {
		let n = (e * 28 + t) * 4, i = hash(t, e, r ^ 28455), a = .55 + .16 * i;
		Ae[n] = .3 + .4 * hash(t, e, r), Ae[n + 1] = .3 + .4 * hash(t, e, r ^ 10661), Ae[n + 2] = 1 / (a * a), Ae[n + 3] = i;
	}
	let je = t === `snakeskin` ? 10 : 4, Me = t === `snakeskin` ? 12 : 6, Ne = t === `snakeskin` || t === `crocodile` ? new Float64Array(je * Me) : null;
	if (Ne) for (let e = 0; e < Me; e++) for (let t = 0; t < je; t++) Ne[e * je + t] = hash(t, e, r ^ 29625);
	let Pe = t === `engineturned` ? /* @__PURE__ */ new Float64Array(72) : null;
	if (Pe) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 2;
		Pe[n] = hash(t, e, r ^ 14497), Pe[n + 1] = hash(t, e, r ^ 27735);
	}
	let Fe = t === `orangepeel` ? 24 : 40, Ie = t === `orangepeel` ? 24 : 8, Le = t === `orangepeel` || t === `coconut` ? new Float64Array(Fe * Ie * 3) : null;
	if (Le) for (let e = 0; e < Ie; e++) for (let t = 0; t < Fe; t++) {
		let n = (e * Fe + t) * 3;
		Le[n] = .25 + .5 * hash(t, e, r ^ 7795), Le[n + 1] = .25 + .5 * hash(t, e, r ^ 21425), Le[n + 2] = hash(t, e, r ^ 31529);
	}
	let j = t === `limestone` ? /* @__PURE__ */ new Float64Array(4032) : null;
	if (j) for (let e = 0; e < 24; e++) for (let t = 0; t < 24; t++) {
		let i = (e * 24 + t) * 7, a = n * hash(t, e, r ^ 11377);
		j[i] = .15 + .7 * hash(t, e, r ^ 6323), j[i + 1] = .15 + .7 * hash(t, e, r ^ 20009), j[i + 2] = .25 + .19 * hash(t, e, r ^ 31377), j[i + 3] = .65 + .35 * hash(t, e, r ^ 14733), j[i + 4] = Math.cos(a), j[i + 5] = Math.sin(a), j[i + 6] = hash(t, e, r ^ 25591);
	}
	let Re = t === `breccia` ? /* @__PURE__ */ new Float64Array(648) : null;
	if (Re) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let i = (e * 6 + t) * 18, a = n * hash(t, e, r ^ 11091), o = .3 + .35 * hash(t, e, r ^ 23063);
		Re[i] = .15 + .7 * hash(t, e, r ^ 6089), Re[i + 1] = .15 + .7 * hash(t, e, r ^ 14545), Re[i + 2] = hash(t, e, r ^ 32323);
		for (let s = 0; s < 5; s++) {
			let c = a + n * s / 5 + .2 * (hash(t, e, r ^ 16823 + s) - .5), l = i + 3 + s * 3;
			Re[l] = Math.cos(c), Re[l + 1] = Math.sin(c), Re[l + 2] = o * (.75 + .25 * hash(t, e, r ^ 26785 + s));
		}
	}
	let ze = t === `plywood` ? /* @__PURE__ */ new Float64Array(6) : null;
	if (ze) for (let e = 0; e < 2; e++) ze[e * 3] = hash(e, 0, r ^ 8679), ze[e * 3 + 1] = hash(e, 0, r ^ 25779), ze[e * 3 + 2] = .75 + .25 * hash(e, 0, r ^ 18649);
	let Be = t === `reedmat` ? 16 : 6, Ve = t === `reedmat` || t === `rope` ? new Float64Array(Be * 2) : null;
	if (Ve) for (let e = 0; e < Be; e++) Ve[e * 2] = hash(e, 0, r ^ 5849), Ve[e * 2 + 1] = n * hash(e, 0, r ^ 18867);
	let M = t === `straw` ? /* @__PURE__ */ new Float64Array(1728) : null;
	if (M) for (let e = 0; e < 3; e++) for (let t = 0; t < 8; t++) for (let i = 0; i < 8; i++) {
		let a = ((e * 8 + t) * 8 + i) * 9, o = r ^ e * 14759, s = n * hash(i, t, o ^ 6355);
		M[a] = .25 + .5 * hash(i, t, o ^ 20247), M[a + 1] = .25 + .5 * hash(i, t, o ^ 29641), M[a + 2] = Math.cos(s), M[a + 3] = Math.sin(s), M[a + 4] = .62 + .33 * hash(i, t, o ^ 25265), M[a + 5] = .035 + .03 * hash(i, t, o ^ 20891), M[a + 6] = hash(i, t, o ^ 11877), M[a + 7] = n * hash(i, t, o ^ 29123), M[a + 8] = hash(i, t, o ^ 14305);
	}
	let N = t === `osb` ? 6 : 28, P = t === `osb` || t === `chipboard` ? new Float64Array(N * N * 2 * 26) : null;
	if (P) for (let e = 0; e < 2; e++) for (let i = 0; i < N; i++) for (let a = 0; a < N; a++) {
		let o = ((e * N + i) * N + a) * 26, s = r ^ e * 14759, c = hash(a, i, s ^ 25265), l = t === `osb` ? Math.PI / 2 + .65 * (hash(a, i, s ^ 6355) - .5) + .5 * (noise(a / 6, i / 6, 3, 3, r ^ 31529) - .5) : n * hash(a, i, s ^ 6355);
		P[o] = .25 + .5 * hash(a, i, s ^ 20247), P[o + 1] = .25 + .5 * hash(a, i, s ^ 29641), P[o + 2] = Math.cos(l), P[o + 3] = Math.sin(l), P[o + 4] = t === `osb` ? .78 + .14 * c : .46 + .19 * c, P[o + 5] = t === `osb` ? .13 + .1 * hash(a, i, s ^ 20891) : .25 + .17 * hash(a, i, s ^ 20891), P[o + 6] = c, P[o + 7] = n * hash(a, i, s ^ 11877);
		for (let e = 0; e < 6; e++) {
			let t = o + 8 + e * 3;
			P[t] = Math.cos(n * e / 6), P[t + 1] = Math.sin(n * e / 6), P[t + 2] = .82 + .18 * hash(a, i, s ^ 23857 + e);
		}
	}
	let He = t === `crackleglaze` ? /* @__PURE__ */ new Float64Array(6656) : null;
	if (He) for (let e = 0; e < 16; e++) for (let t = 0; t < 16; t++) {
		let n = (e * 16 + t) * 26, i = .36 + .28 * hash(t, e, r ^ 17293), a = .36 + .28 * hash(t, e, r ^ 31525);
		He[n] = i, He[n + 1] = a;
		let o = n + 2;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 16) % 16, l = (e + n + 16) % 16, u = s + .36 + .28 * hash(c, l, r ^ 17293) - i, d = n + .36 + .28 * hash(c, l, r ^ 31525) - a, f = Math.sqrt(u * u + d * d);
			He[o++] = u / f, He[o++] = d / f, He[o++] = f / 2;
		}
	}
	let Ue = t === `fishscales` ? 10 : 8, We = t === `fishscales` ? 10 : 4, Ge = t === `fishscales` || t === `feathers` ? new Float64Array(Ue * We * 2) : null;
	if (Ge) for (let e = 0; e < We; e++) for (let t = 0; t < Ue; t++) {
		let n = (e * Ue + t) * 2;
		Ge[n] = hash(t, e, r ^ 15985), Ge[n + 1] = .2 * (hash(t, e, r ^ 25299) - .5);
	}
	let Ke = t === `tortoiseshell` ? /* @__PURE__ */ new Float64Array(972) : null;
	if (Ke) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 27, i = .22 + .56 * hash(t, e, r ^ 13751), a = .22 + .56 * hash(t, e, r ^ 28185);
		Ke[n] = i, Ke[n + 1] = a, Ke[n + 2] = hash(t, e, r ^ 31811);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 6) % 6, l = (e + n + 6) % 6, u = s + .22 + .56 * hash(c, l, r ^ 13751) - i, d = n + .22 + .56 * hash(c, l, r ^ 28185) - a, f = Math.sqrt(u * u + d * d);
			Ke[o++] = u / f, Ke[o++] = d / f, Ke[o++] = f / 2;
		}
	}
	let qe = t === `studdedrubber` ? /* @__PURE__ */ new Float64Array(36) : null;
	if (qe) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) qe[e * 6 + t] = hash(t, e, r ^ 19225);
	let Je = t === `groovedrubber` ? /* @__PURE__ */ new Float64Array(12) : null;
	if (Je) for (let e = 0; e < 12; e++) Je[e] = hash(e, 0, r ^ 23607);
	let Ye = t === `recycledrubber` ? /* @__PURE__ */ new Float64Array(41472) : null;
	if (Ye) for (let e = 0; e < 48; e++) for (let t = 0; t < 48; t++) {
		let i = (e * 48 + t) * 18, a = n * hash(t, e, r ^ 32019), o = .48 + .17 * hash(t, e, r ^ 6583);
		Ye[i] = .2 + .6 * hash(t, e, r ^ 12969), Ye[i + 1] = .2 + .6 * hash(t, e, r ^ 25059), Ye[i + 2] = hash(t, e, r ^ 21441);
		for (let s = 0; s < 5; s++) {
			let c = i + 3 + s * 3, l = a + n * s / 5;
			Ye[c] = Math.cos(l), Ye[c + 1] = Math.sin(l), Ye[c + 2] = o * (.78 + .22 * hash(t, e, r ^ 9969 + s));
		}
	}
	let Xe = t === `breadcrust` ? /* @__PURE__ */ new Float64Array(1323) : null;
	if (Xe) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = (e * 7 + t) * 27, i = .36 + .28 * hash(t, e, r ^ 9399), a = .36 + .28 * hash(t, e, r ^ 22993);
		Xe[n] = i, Xe[n + 1] = a, Xe[n + 2] = hash(t, e, r ^ 29609);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 7) % 7, l = (e + n + 7) % 7, u = s + .36 + .28 * hash(c, l, r ^ 9399) - i, d = n + .36 + .28 * hash(c, l, r ^ 22993) - a, f = Math.sqrt(u * u + d * d);
			Xe[o++] = u / f, Xe[o++] = d / f, Xe[o++] = f / 2;
		}
	}
	let F = t === `basketball` ? 36 : 24, Ze = t === `basketball` ? 3 : 4, I = t === `basketball` || t === `tennisball` ? new Float64Array(F * F * Ze) : null;
	if (I) for (let e = 0; e < F; e++) for (let i = 0; i < F; i++) {
		let a = (e * F + i) * Ze;
		if (I[a] = .35 + .3 * hash(i, e, r ^ 6567), I[a + 1] = .35 + .3 * hash(i, e, r ^ 23587), t === `basketball`) {
			let t = .34 + .04 * hash(i, e, r ^ 29657);
			I[a + 2] = 1 / (t * t);
		} else {
			let t = n * hash(i, e, r ^ 14257);
			I[a + 2] = Math.cos(t), I[a + 3] = Math.sin(t);
		}
	}
	let Qe = t === `golfball` ? hash(0, 0, r ^ 10679) : 0, $e = t === `golfball` ? hash(0, 0, r ^ 25043) : 0, et = t === `boardformedconcrete` || t === `ribbedconcrete` || t === `splitfaceblock`, tt = et ? cachedNoise(96, 96, r ^ 11633) : null, nt = t === `ribbedconcrete` || t === `splitfaceblock` ? cachedNoise(24, 32, r ^ 27449) : null, rt = t === `boardformedconcrete` ? cachedNoise(3, 128, r ^ 23059) : null, it = et ? new Float64Array(t === `boardformedconcrete` ? 16 : t === `ribbedconcrete` ? 12 : 32) : null;
	if (it) for (let e = 0; e < it.length; e++) it[e] = hash(e, 0, r ^ 18409);
	let at = t === `chainmail` || t === `rivetedmetal` || t === `weldedmetal`, ot = at ? cachedNoise(48, 64, r ^ 27943) : null, st = t === `chainmail` ? /* @__PURE__ */ new Float64Array(48) : t === `rivetedmetal` ? /* @__PURE__ */ new Float64Array(12) : null;
	if (st) for (let e = 0; e < st.length; e++) st[e] = hash(e, 0, r ^ 14773);
	let ct = t === `cactus` || t === `pinecone` || t === `corncob`, lt = ct ? cachedNoise(48, 64, r ^ 24121) : null, ut = t === `corncob` ? 12 : 8, dt = t === `cactus` ? 18 : 1, ft = ct ? new Float64Array(ut * 8 * dt) : null;
	if (ft) for (let e = 0; e < 8; e++) for (let i = 0; i < ut; i++) {
		let a = (e * ut + i) * dt;
		if (ft[a] = hash(i, e, r ^ 19059), t === `cactus`) {
			ft[a] = .28 + .08 * ft[a], ft[a + 1] = .12 * (hash(i, e, r ^ 11609) - .5);
			let t = hash(i, e, r ^ 32561) * n;
			for (let e = 0; e < 8; e++) {
				let r = t + e * n / 8;
				ft[a + 2 + e * 2] = Math.cos(r), ft[a + 3 + e * 2] = Math.sin(r);
			}
		}
	}
	let pt = t === `corrugatedcardboard` || t === `creasedpaper` || t === `layeredpaper`, mt = pt ? cachedNoise(6, 8, r ^ 12729) : null, ht = pt ? /* @__PURE__ */ new Float64Array(60) : null;
	if (ht) for (let e = 0; e < 4; e++) for (let t = 0; t < 3; t++) {
		let i = (e * 3 + t) * 5, a = n * hash(t, e, r ^ 28179);
		ht[i] = .3 + .4 * hash(t, e, r ^ 11121), ht[i + 1] = .3 + .4 * hash(t, e, r ^ 23609), ht[i + 2] = Math.cos(a), ht[i + 3] = Math.sin(a), ht[i + 4] = .32 + .12 * hash(t, e, r ^ 31313);
	}
	let gt = t === `layeredpaper` ? /* @__PURE__ */ new Float64Array(24) : null;
	if (gt) for (let e = 0; e < 8; e++) gt[e * 3] = .35 + e * .045, gt[e * 3 + 1] = .58 + .14 * hash(e, 0, r ^ 20263), gt[e * 3 + 2] = n * hash(e, 0, r ^ 10525);
	let _t = t === `basalt` || t === `scoria` || t === `obsidian`, vt = _t ? cachedNoise(64, 64, r ^ 23319) : null, yt = t === `basalt` ? 6 : t === `scoria` ? 10 : 4, bt = t === `basalt` ? 8 : yt, xt = t === `basalt` ? 4 : 7, L = _t ? new Float64Array(yt * bt * xt) : null;
	if (L) for (let e = 0; e < bt; e++) for (let i = 0; i < yt; i++) {
		let a = (e * yt + i) * xt, o = hash(i, e, r ^ 15729);
		if (t === `basalt`) L[a] = .46 + .025 * o, L[a + 1] = .46 + .025 * hash(i, e, r ^ 27177), L[a + 2] = .46 + .025 * hash(i, e, r ^ 31811), L[a + 3] = o;
		else {
			let s = n * hash(i, e, r ^ 27177), c = t === `scoria` ? .32 + .12 * o : .65 + .13 * o;
			L[a] = .35 + .3 * hash(i, e, r ^ 12121), L[a + 1] = .35 + .3 * hash(i, e, r ^ 31811), L[a + 2] = c, L[a + 3] = c * (.7 + .25 * hash(i, e, r ^ 19987)), L[a + 4] = Math.cos(s), L[a + 5] = Math.sin(s), L[a + 6] = o;
		}
	}
	let St = t === `malachite` || t === `agate` || t === `lapislazuli`, Ct = St ? cachedNoise(64, 64, r ^ 31155) : null, wt = t === `lapislazuli` ? cachedNoise(8, 8, r ^ 19753) : null, Tt = St ? n * hash(0, 0, r ^ 13735) : 0, Et = St ? n * hash(0, 0, r ^ 27673) : 0, Dt = t === `rice` || t === `sesame` || t === `coffeebeans`, Ot = t === `rice` ? 12 : t === `sesame` ? 16 : 8, R = Dt ? new Float64Array(Ot * Ot * 7) : null, kt = t === `coffeebeans` ? cachedNoise(64, 64, r ^ 18105) : null;
	if (R) for (let e = 0; e < Ot; e++) for (let i = 0; i < Ot; i++) {
		let a = (e * Ot + i) * 7, o = n * hash(i, e, r ^ 24377), s = hash(i, e, r ^ 14273);
		R[a] = .35 + .3 * hash(i, e, r ^ 6311), R[a + 1] = .35 + .3 * hash(i, e, r ^ 27939), R[a + 2] = Math.cos(o), R[a + 3] = Math.sin(o), R[a + 4] = 1 / (t === `rice` ? .62 + .09 * s : t === `sesame` ? .48 + .06 * s : .57 + .06 * s), R[a + 5] = 1 / (t === `rice` ? .14 + .025 * s : t === `sesame` ? .24 + .025 * s : .36 + .03 * s), R[a + 6] = s;
	}
	let At = t === `lotusleaf` || t === `bananaleaf` || t === `fernleaf`, jt = t === `lotusleaf` ? 31 : 7, z = At ? new Float64Array(9 * jt) : null;
	if (z) for (let e = 0; e < 3; e++) for (let i = 0; i < 3; i++) {
		let a = (e * 3 + i) * jt, o = n * hash(i, e, r ^ 23191), s = hash(i, e, r ^ 14033);
		if (z[a] = .45 + .1 * hash(i, e, r ^ 8631), z[a + 1] = .45 + .1 * hash(i, e, r ^ 29155), z[a + 2] = Math.cos(o), z[a + 3] = Math.sin(o), z[a + 4] = 1 / (t === `lotusleaf` ? .65 + .04 * s : t === `bananaleaf` ? .76 + .04 * s : .78 + .03 * s), z[a + 5] = 1 / (t === `lotusleaf` ? .61 + .04 * s : t === `bananaleaf` ? .28 + .02 * s : .5), z[a + 6] = s, t === `lotusleaf`) for (let e = 0; e < 12; e++) {
			let t = e * n / 12 + .15 * s;
			z[a + 7 + e * 2] = Math.cos(t), z[a + 8 + e * 2] = Math.sin(t);
		}
	}
	let Mt = t === `fernleaf` ? /* @__PURE__ */ new Float64Array(42) : null;
	if (Mt) for (let e = 0; e < 14; e++) {
		let t = -.7 + e * .105;
		Mt[e * 3] = t, Mt[e * 3 + 1] = e % 2 == 0 ? 1 : -1, Mt[e * 3 + 2] = 1 / (.68 - .36 * t * t);
	}
	let Nt = t === `braincoral` || t === `starcoral` || t === `seasponge`, Pt = Nt ? cachedNoise(64, 64, r ^ 19091) : null, Ft = t === `braincoral` ? new Float64Array([
		4,
		1,
		0,
		.34,
		-2,
		5,
		0,
		.28,
		3,
		4,
		0,
		.22,
		1,
		-3,
		0,
		.18,
		6,
		-2,
		0,
		.12,
		2,
		7,
		0,
		.08
	]) : null;
	if (Ft) for (let e = 0; e < 6; e++) Ft[e * 4 + 2] = n * hash(e, 0, r ^ 29129);
	let B = t === `starcoral` ? /* @__PURE__ */ new Float64Array(1116) : null;
	if (B) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let i = (e * 6 + t) * 31, a = n * hash(t, e, r ^ 11415), o = .5 + .055 * hash(t, e, r ^ 28209);
		B[i] = .4 + .2 * hash(t, e, r ^ 7001), B[i + 1] = .4 + .2 * hash(t, e, r ^ 24359), B[i + 2] = Math.cos(a), B[i + 3] = Math.sin(a), B[i + 4] = 1 / o, B[i + 5] = 1 / (.9 * o), B[i + 6] = hash(t, e, r ^ 14807);
		for (let e = 0; e < 12; e++) {
			let t = e * n / 12;
			B[i + 7 + e * 2] = Math.cos(t), B[i + 8 + e * 2] = Math.sin(t);
		}
	}
	let V = t === `seasponge` ? /* @__PURE__ */ new Float64Array(1372) : null, It = t === `seasponge` ? cachedNoise(28, 28, r ^ 29617) : null;
	if (V) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = .34 + .32 * hash(t, e, r ^ 6099), i = .34 + .32 * hash(t, e, r ^ 22951);
		for (let a = 0; a < 4; a++) {
			let o = ((e * 7 + t) * 4 + a) * 7, s = +(a === 0 || a === 2), c = +(a === 1 || a === 2), l = s + .34 + .32 * hash((t + s) % 7, (e + c) % 7, r ^ 6099), u = c + .34 + .32 * hash((t + s) % 7, (e + c) % 7, r ^ 22951), d = l - n, f = u - i, p = Math.sqrt(d * d + f * f);
			V[o] = (n + l) * .5, V[o + 1] = (i + u) * .5, V[o + 2] = a === 3 ? 1 : d / p, V[o + 3] = a === 3 ? 0 : f / p, V[o + 4] = 1 / (a === 3 ? .23 : p * .5 + .12), V[o + 5] = 1 / (a === 3 ? .23 : .14 + .03 * hash(t, e, r ^ 16825 + a)), V[o + 6] = +(a !== 2 || hash(t, e, r ^ 27941) < .35);
		}
	}
	let Lt = t === `scallopshell` || t === `oystershell` || t === `nautilusshell`, Rt = Lt ? cachedNoise(64, 64, r ^ 24209) : null, zt = t === `oystershell` ? 3 : 2, H = Lt ? new Float64Array(zt * zt * 8) : null;
	if (H) for (let e = 0; e < zt; e++) for (let i = 0; i < zt; i++) {
		let a = (e * zt + i) * 8, o = .45 * (hash(i, e, r ^ 12667) - .5), s = t === `oystershell`;
		H[a] = .5 + .12 * (hash(i, e, r ^ 6461) - .5), H[a + 1] = .5 + .12 * (hash(i, e, r ^ 27041) - .5), H[a + 2] = Math.cos(o), H[a + 3] = Math.sin(o), H[a + 4] = 1 / (s ? .73 : .47), H[a + 5] = 1 / (s ? .58 : .47), H[a + 6] = n * hash(i, e, r ^ 19239), H[a + 7] = .52 + .05 * Math.sin(H[a + 6]);
	}
	let Bt = t === `walnutshell` || t === `peanutshell` || t === `almondshell`, Vt = Bt ? cachedNoise(64, 48, r ^ 25559) : null, Ht = t === `peanutshell` || t === `walnutshell` ? cachedNoise(4, 6, r ^ 15193) : null, U = t === `walnutshell` ? /* @__PURE__ */ new Float64Array(1176) : null;
	if (U) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = .2 + .6 * hash(t, e, r ^ 6509), i = .2 + .6 * hash(t, e, r ^ 22451);
		for (let a = 0; a < 3; a++) {
			let o = a === 1 ? 0 : 1, s = a === 0 ? 0 : 1, c = o + .2 + .6 * hash((t + o) % 7, (e + s) % 7, r ^ 6509), l = s + .2 + .6 * hash((t + o) % 7, (e + s) % 7, r ^ 22451), u = c - n, d = l - i, f = Math.sqrt(u * u + d * d), p = ((e * 7 + t) * 3 + a) * 8;
			U[p] = (n + c) * .5, U[p + 1] = (i + l) * .5, U[p + 2] = u / f, U[p + 3] = d / f, U[p + 4] = 1 / (f * .5 + .2), U[p + 5] = 1 / (.28 + .14 * hash(t, e, r ^ 14753 + a)), U[p + 6] = .64 * (hash(t, e, r ^ 25031 + a) - .5), U[p + 7] = +(a === 1 || (a === 0 ? hash(t, e, r ^ 17067) < .6 : hash(t, e, r ^ 11667) < .45));
		}
	}
	let Ut = t === `peanutshell` ? /* @__PURE__ */ new Float64Array(150) : null;
	if (Ut) for (let e = 0; e < 5; e++) for (let t = 0; t < 10; t++) {
		let n = (e * 10 + t) * 3;
		Ut[n] = .25 + .5 * hash(t, e, r ^ 11121), Ut[n + 1] = 1 / (.09 + .04 * hash(t, e, r ^ 22481)), Ut[n + 2] = .3 * (hash(t, e, r ^ 29113) - .5);
	}
	let W = t === `almondshell` ? /* @__PURE__ */ new Float64Array(1344) : null;
	if (W) for (let e = 0; e < 12; e++) for (let t = 0; t < 16; t++) {
		let n = (e * 16 + t) * 7, i = .3 * (hash(t, e, r ^ 14249) - .5);
		W[n] = .25 + .5 * hash(t, e, r ^ 6459), W[n + 1] = .25 + .5 * hash(t, e, r ^ 23847), W[n + 2] = Math.cos(i), W[n + 3] = Math.sin(i), W[n + 4] = 1 / (.1 + .03 * hash(t, e, r ^ 27411)), W[n + 5] = 1 / (.32 + .12 * hash(t, e, r ^ 16855)), W[n + 6] = +(hash(t, e, r ^ 31153) > .3);
	}
	let Wt = t === `stone` || t === `metal` || t === `marble`, Gt = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud` || t === `granite` || t === `slate` || t === `terrazzo` || t === `plaster` || t === `terracotta` || t === `cork` || t === `rubber` || t === `sandstone` || t === `travertine` || t === `pumice`, G = 0, K = 0, Kt = 0, q = 0, J = 0, Y = 0, X = 0, Z = 0, Q = 1, $ = 0, qt = 0, Jt = +(t === `metal` || t === `diamondplate` || t === `hammeredmetal` || t === `galvanized` || t === `corrugatedmetal` || t === `standingseam` || t === `damascus` || t === `castiron` || t === `perforatedmetal` || t === `expandedmetal` || t === `wiremesh` || t === `pyrite` || t === `knurledmetal` || t === `engineturned` || t === `goldleaf` || t === `rivetedmetal` || t === `weldedmetal`), pick = () => {
		switch (t) {
			case `ginkgoleaf`: {
				let t = require_materials.proceduralMaterialPresets.ginkgoleaf, i = cachedNoise(96, 96, r ^ 23577), a = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 3, s = n * hash(i, e, r ^ 11591);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s), a[o + 2] = hash(i, e, r ^ 27185);
				}
				return () => {
					let e = Math.floor(G * t.cells), n = (Math.floor(K * t.cells) * t.cells + e) * 3, r = fract(G * t.cells) - .5, o = fract(K * t.cells) - .5, s = r * a[n] + o * a[n + 1], c = o * a[n] - r * a[n + 1], l = Math.sqrt(s * s + c * c), u = Math.atan2(s, c), f = smooth(clamp((t.radius - t.notchDepth * Math.exp(-((u / t.notchWidth) ** 2)) - l) / t.edge)) * smooth(clamp((t.halfAngle - Math.abs(u)) / .12)) * smooth(clamp((l - .035) / .045)), p = smooth(clamp((1 - s * s / 4e-4 - (c + .05) ** 2 / .0121) / .3)), m = 1 - (1 - f) * (1 - p), h = smooth(clamp((l - .16) / .12)), g = (.5 + .5 * Math.cos(18 * u)) ** 8, _ = (.5 + .5 * Math.cos(36 * u)) ** 8, v = f * smooth(clamp((l - .08) / .08)) * (g * (1 - h) + _ * h), y = i(G, K);
					Y = .06 + m * (.55 + .15 * a[n + 2] + .12 * v + .02 * y), X = .08 + m * (.3 + .06 * v), Z = .85 + m * (t.roughness - .85 + .02 * y - .04 * v), Q = .6 + .35 * m;
				};
			}
			case `chevronparquet`: {
				let t = require_materials.proceduralMaterialPresets.chevronparquet, i = cachedNoise(64, 64, r ^ 27441), a = new Float64Array(2 * t.rows);
				for (let e = 0; e < 2; e++) for (let n = 0; n < t.rows; n++) a[e * t.rows + n] = hash(e, n, r ^ 19751);
				return () => {
					let e = Math.floor(2 * G), r = fract(2 * G), o = e === 0 ? 1 : -1, s = t.rows * (K + (e === 0 ? G : 1 - G)), c = fract(s), l = Math.floor(s) % t.rows, u = smooth(clamp((Math.min(r, 1 - r) - t.endGap) / (t.endBevel - t.endGap))) * smooth(clamp((Math.min(c, 1 - c) - t.sideGap) / (t.sideBevel - t.sideGap))), d = a[e * t.rows + l], f = .5 + .5 * Math.sin(n * (t.grainBands * s + .15 * Math.sin(n * 2 * (G - o * K)) + d)), p = i(G, K);
					Y = .08 + u * (.3 + .2 * d + .22 * f + .03 * p), X = u * (.6 + .01 * f), Z = .84 + u * (t.roughness - .84 + .04 * f), Q = .5 + .48 * u;
				};
			}
			case `argyle`: {
				let t = require_materials.proceduralMaterialPresets.argyle, i = cachedNoise(96, 96, r ^ 15959);
				return () => {
					let e = Math.PI * t.diamonds * (G + K), r = Math.PI * t.diamonds * (G - K), a = 2 * smooth(clamp(.5 + Math.sin(e) / t.colorEdge)) - 1, o = 2 * smooth(clamp(.5 + Math.sin(r) / t.colorEdge)) - 1, s = .5 + .5 * a * o, c = smooth(clamp((t.lineOuter - Math.abs(Math.cos(e))) / (t.lineOuter - t.lineInner))), l = smooth(clamp((t.lineOuter - Math.abs(Math.cos(r))) / (t.lineOuter - t.lineInner))), u = 1 - (1 - c) * (1 - l), d = .5 + .5 * Math.cos(n * t.threads * G), f = .5 + .5 * Math.cos(n * t.threads * K), p = .5 + .5 * Math.cos(Math.PI * t.threads * (G + K)), m = d * p + f * (1 - p), h = i(G, K);
					Y = (.12 + .5 * s) * (1 - u) + .92 * u + .035 * m + .02 * h, X = .24 + .16 * m + .02 * h, Z += .03 * h + .025 * (1 - m), Q = .88 + .1 * m;
				};
			}
			case `perforatedleather`: {
				let t = require_materials.proceduralMaterialPresets.perforatedleather, n = cachedNoise(64, 64, r ^ 19991), i = cachedNoise(128, 128, r ^ 11107), a = t.outerRadius * t.outerRadius, o = a - t.coreRadius * t.coreRadius;
				return () => {
					let e = Math.floor(K * t.cells), r = fract(G * t.cells - e % 2 * .5) - .5, s = fract(K * t.cells) - .5, c = smooth(clamp((a - r * r - s * s) / o)), l = 1 - c, u = .7 * n(G, K) + .3 * i(G, K);
					Y = (.55 + .12 * u) * l + .025 * c, X = (.6 + .035 * u) * l + .08 * c, Z += .03 * u * l + .46 * c, Q = .98 - .75 * c;
				};
			}
			case `chippedenamel`: {
				let t = require_materials.proceduralMaterialPresets.chippedenamel, i = cachedNoise(96, 96, r ^ 27191), a = 3 + t.edges * 3, o = new Float64Array(t.cells * t.cells * a);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let s = (e * t.cells + i) * a;
					o[s] = .35 + .3 * hash(i, e, r ^ 23329), o[s + 1] = .35 + .3 * hash(i, e, r ^ 11849), o[s + 2] = hash(i, e, r ^ 31763) < t.chipChance ? t.radiusMin + t.radiusRange * hash(i, e, r ^ 19809) : 0;
					let c = n * hash(i, e, r ^ 16153);
					for (let a = 0; a < t.edges; a++) {
						let l = s + 3 + a * 3, u = c + n * a / t.edges;
						o[l] = Math.cos(u), o[l + 1] = Math.sin(u), o[l + 2] = o[s + 2] * (.55 + .3 * hash(i * t.edges + a, e, r ^ 6739));
					}
				}
				return () => {
					let e = Math.floor(G * t.cells), n = (Math.floor(K * t.cells) * t.cells + e) * a, r = fract(G * t.cells) - o[n], s = fract(K * t.cells) - o[n + 1], c = o[n + 2] === 0 ? 0 : 1;
					for (let e = 0; e < t.edges && c > 0; e++) {
						let i = n + 3 + e * 3, a = o[i + 2] - r * o[i] - s * o[i + 1];
						c *= smooth(clamp(a / t.edge));
					}
					let l = 1 - c, u = i(G, K);
					Y = .12 + .74 * l + .03 * u, X = .15 + .5 * l + .005 * u, qt = c, Z += .5 * c + .04 * u * c, Q = 1 - .12 * c - .48 * c * l;
				};
			}
			case `linen`: {
				let t = require_materials.proceduralMaterialPresets.linen, i = cachedNoise(t.threads, 4, r ^ 15385), o = cachedNoise(t.threads, 4, r ^ 27459);
				return () => {
					let e = G * t.threads, r = K * t.threads, s = Math.floor(e + .5) % t.threads, c = Math.floor(r + .5) % t.threads, l = i(s / t.threads, K), u = o(c / t.threads, G), d = (fract(e + .5) - .5) / (t.halfWidth + t.slubWidth * l), f = (fract(r + .5) - .5) / (t.halfWidth + t.slubWidth * u), p = smooth(clamp(1 - d * d)), m = smooth(clamp(1 - f * f)), h = .5 + .5 * Math.cos(Math.PI * e) * Math.cos(Math.PI * r), g = p * (1 - m + m * h), _ = m * (1 - p + p * (1 - h)), v = g + _, y = p * m, b = g * l + _ * u, x = g * (.5 + .5 * Math.sin(n * 96 * G + a)) + _ * (.5 + .5 * Math.sin(n * 96 * K + a));
					Y = .15 + .55 * v + .08 * x + .08 * b, X = .12 + .5 * v + .18 * y + .06 * b + .03 * x, Z -= .03 * v, Q = .62 + .37 * v;
				};
			}
			case `porphyry`: {
				let t = require_materials.proceduralMaterialPresets.porphyry, i = cachedNoise(96, 96, r ^ 27681), a = new Float64Array(t.cells * t.cells * 6);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 6, s = n * hash(i, e, r ^ 15193);
					a[o] = .35 + .3 * hash(i, e, r ^ 24083), a[o + 1] = .35 + .3 * hash(i, e, r ^ 31281), a[o + 2] = Math.cos(s), a[o + 3] = Math.sin(s), a[o + 4] = hash(i, e, r ^ 11591) < t.crystalChance ? t.halfLengthMin + t.halfLengthRange * hash(i, e, r ^ 20249) : 0, a[o + 5] = t.halfWidthMin + t.halfWidthRange * hash(i, e, r ^ 7267);
				}
				return () => {
					let e = Math.floor(G * t.cells), n = (Math.floor(K * t.cells) * t.cells + e) * 6, r = fract(G * t.cells) - a[n], o = fract(K * t.cells) - a[n + 1], s = r * a[n + 2] + o * a[n + 3], c = -r * a[n + 3] + o * a[n + 2], l = smooth(clamp((a[n + 4] - Math.abs(s)) / t.edge)) * smooth(clamp((a[n + 5] - Math.abs(c)) / t.edge)), u = i(G, K);
					Y = .24 + .12 * u + l * (.55 - .06 * u), X = .4 + .015 * u, Z += .08 * u - .22 * l, Q = 1 - .02 * u;
				};
			}
			case `castiron`: {
				let t = require_materials.proceduralMaterialPresets.castiron, n = cachedNoise(96, 96, r ^ 16161), i = cachedNoise(48, 48, r ^ 27977), a = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let i = (e * t.cells + n) * 3;
					a[i] = .3 + .4 * hash(n, e, r ^ 11289), a[i + 1] = .3 + .4 * hash(n, e, r ^ 23155);
					let o = t.poreRadiusMin + t.poreRadiusRange * hash(n, e, r ^ 32309);
					a[i + 2] = hash(n, e, r ^ 6983) < t.poreChance ? 1 / (o * o) : 0;
				}
				return () => {
					let e = Math.floor(G * t.cells), r = (Math.floor(K * t.cells) * t.cells + e) * 3, o = fract(G * t.cells) - a[r], s = fract(K * t.cells) - a[r + 1], c = a[r + 2], l = c === 0 ? 0 : smooth(clamp(1 - (o * o + s * s) * c)), u = .7 * n(G, K) + .3 * i(G, K);
					Y = .45 + .3 * u - .2 * l, X = .4 + .14 * u - .3 * l, Z += .12 * u + .12 * l, Q = 1 - .45 * l;
				};
			}
			case `windmillpavers`: {
				let t = require_materials.proceduralMaterialPresets.windmillpavers, n = cachedNoise(64, 64, r ^ 14935), i = new Float64Array(t.cells * t.cells * 5);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) for (let a = 0; a < 5; a++) i[(e * t.cells + n) * 5 + a] = hash(n * 5 + a, e, r ^ 24083);
				return () => {
					let e = Math.floor(G * t.cells), r = Math.floor(K * t.cells), a = fract(G * t.cells) * 3, o = fract(K * t.cells) * 3, s = 1, c = 1, l = 1, u = 1, d = 4;
					o < 1 && a < 2 ? (s = 0, c = 0, l = 2, d = 0) : a >= 2 && o < 2 ? (s = 2, c = 0, u = 2, d = 1) : o >= 2 && a >= 1 ? (s = 1, c = 2, l = 2, d = 2) : a < 1 && o >= 1 && (s = 0, c = 1, u = 2, d = 3);
					let f = a - s, p = o - c, m = smooth(clamp((Math.min(f, l - f) - t.grout) / t.shoulder)) * smooth(clamp((Math.min(p, u - p) - t.grout) / t.shoulder)), h = n(G, K), g = i[(r * t.cells + e) * 5 + d];
					Y = .08 + m * ((d === 4 ? .1 : .5) + .15 * g + .08 * h), X = m * (.7 + .008 * h), Z += m * (.03 * h - .04), Q = .45 + .55 * m, $ = 1 - m;
				};
			}
			case `damascus`: {
				let t = require_materials.proceduralMaterialPresets.damascus, i = cachedNoise(64, 64, r ^ 24039), o = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let i = (e * t.cells + n) * 2;
					o[i] = .4 + .2 * hash(n, e, r ^ 14241), o[i + 1] = .4 + .2 * hash(n, e, r ^ 27417);
				}
				let s = 1 / (t.foldRadius * t.foldRadius);
				return () => {
					let e = Math.floor(G * t.cells), r = (Math.floor(K * t.cells) * t.cells + e) * 2, c = fract(G * t.cells) - o[r], l = fract(K * t.cells) - o[r + 1], u = smooth(clamp(1 - (c * c + l * l) * s)), d = n * (K * t.layers + .35 * Math.sin(n * G + a) + t.foldStrength * u), f = smooth(.5 + .5 * Math.sin(d)), p = i(G, K);
					Y = .2 + .65 * f + .03 * p, X = .3 + .1 * f + .003 * p, Z += .28 * (1 - f) + .02 * p, Q = .96 + .04 * f;
				};
			}
			case `standingseam`: {
				let t = require_materials.proceduralMaterialPresets.standingseam, n = cachedNoise(64, 4, r ^ 16007);
				return () => {
					let e = Math.abs(fract(G * t.panels + .5) - .5), r = 1 - smooth(clamp((e - t.capHalfWidth) / t.shoulder)), i = (e - t.toeOffset) / t.toeWidth, a = smooth(clamp(1 - i * i)), o = n(G, K);
					Y = .5 + .1 * o + .1 * r - .1 * a, X = .15 + .72 * r - .07 * a + .003 * o, Z += .05 * o - .06 * r, Q = 1 - .18 * a;
				};
			}
			case `truchettiles`: {
				let t = require_materials.proceduralMaterialPresets.truchettiles, n = cachedNoise(32, 32, r ^ 11637), i = new Uint8Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) i[e * t.cells + n] = hash(n, e, r ^ 19433) < .5 ? 0 : 1;
				let a = t.arcRadius * t.arcRadius, arc = (e, n) => {
					let r = (e * e + n * n - a) / t.arcWidthSquared;
					return smooth(clamp(1 - r * r));
				};
				return () => {
					let e = Math.floor(G * t.cells), r = Math.floor(K * t.cells), a = fract(G * t.cells), o = fract(K * t.cells), s = smooth(clamp((Math.min(a, 1 - a) - t.grout) / t.shoulder)) * smooth(clamp((Math.min(o, 1 - o) - t.grout) / t.shoulder)), c = i[r * t.cells + e] ? 1 - o : o, l = arc(a, c) + arc(1 - a, 1 - c), u = n(G, K);
					Y = .3 + s * (.62 - .83 * l + .025 * u), X = (.65 + .003 * u) * s, Z += .32 * (1 - s) + .015 * u * s, Q = .5 + .5 * s, $ = 1 - s;
				};
			}
			case `octagondot`: {
				let t = require_materials.proceduralMaterialPresets.octagondot, n = cachedNoise(32, 32, r ^ 31971), i = t.dotRadius * t.dotRadius;
				return () => {
					let e = fract(G * t.cells) - .5, r = fract(K * t.cells) - .5, a = smooth(clamp((.5 - Math.abs(e) - t.grout) / t.shoulder)) * smooth(clamp((.5 - Math.abs(r) - t.grout) / t.shoulder)) * smooth(clamp((t.clippedCorner - Math.abs(e + r)) / t.shoulder)) * smooth(clamp((t.clippedCorner - Math.abs(e - r)) / t.shoulder)), o = fract(G * t.cells + .5) - .5, s = fract(K * t.cells + .5) - .5, c = smooth(clamp((i - (o + s) ** 2) / t.dotShoulder)) * smooth(clamp((i - (o - s) ** 2) / t.dotShoulder)), l = n(G, K), u = a + c;
					Y = .2 + (.72 + .04 * l) * a - (.13 - .02 * l) * c, X = (.65 + .005 * l) * u, Z += .35 * (1 - u) + .015 * l * u, Q = .45 + .55 * u, $ = 1 - u;
				};
			}
			case `ripstop`: {
				let t = require_materials.proceduralMaterialPresets.ripstop, i = cachedNoise(32, 32, r ^ 29161), ridge = (e) => {
					let n = (fract(e + .5) - .5) / t.reinforcementWidth;
					return smooth(clamp(1 - n * n));
				};
				return () => {
					let e = G * t.threads, r = K * t.threads, a = .5 + .5 * Math.cos(n * e), o = .5 + .5 * Math.cos(n * r), s = .5 + .5 * Math.cos(Math.PI * e) * Math.cos(Math.PI * r), c = a * (.35 + .25 * s) + o * (.35 + .25 * (1 - s)) - .3 * a * o, l = ridge(G * t.cells - t.reinforcementOffset) + ridge(G * t.cells + t.reinforcementOffset), u = ridge(K * t.cells - t.reinforcementOffset) + ridge(K * t.cells + t.reinforcementOffset), d = l + u - l * u, f = i(G, K);
					Y = .28 + .2 * c + .25 * d + .06 * f, X = .1 + .24 * c + .38 * d + .015 * f, Z += .06 * d + .03 * f, Q = .8 + .16 * c + .04 * d;
				};
			}
			case `basketweavepavers`: {
				let t = require_materials.proceduralMaterialPresets.basketweavepavers, n = cachedNoise(64, 64, r ^ 27219), i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) for (let a = 0; a < 2; a++) i[(e * t.cells + n) * 2 + a] = hash(n * 2 + a, e, r ^ 17323);
				return () => {
					let e = Math.floor(G * t.cells), r = Math.floor(K * t.cells), a = fract(G * t.cells), o = fract(K * t.cells), s = (e + r) % 2 != 0, c = s ? o : a, l = s ? a : o, u = Math.floor(l * 2), d = l - u * .5, f = smooth(clamp((Math.min(c, 1 - c) - t.grout) / t.shoulder)) * smooth(clamp((Math.min(d, .5 - d) - t.grout) / t.shoulder)), p = n(G, K);
					Y = .3 + f * (.25 + .2 * i[(r * t.cells + e) * 2 + u] + .08 * p), X = f * (.65 + .025 * p), Z += f * (.05 * p - .03), Q = .45 + .55 * f, $ = 1 - f;
				};
			}
			case `breezeblock`: {
				let t = require_materials.proceduralMaterialPresets.breezeblock, n = cachedNoise(64, 64, r ^ 15221), i = t.lobeRadius * t.lobeRadius, lobe = (e, n) => smooth(clamp((i - e * e - n * n) / t.lobeShoulder));
				return () => {
					let e = fract(G * t.cells) - .5, r = fract(K * t.cells) - .5, i = smooth(clamp((.5 - Math.abs(e) - t.grout) / t.edgeShoulder)) * smooth(clamp((.5 - Math.abs(r) - t.grout) / t.edgeShoulder)), a = i * (1 - (1 - (1 - lobe(e - t.lobeOffset, r)) * (1 - lobe(e + t.lobeOffset, r)) * (1 - lobe(e, r - t.lobeOffset)) * (1 - lobe(e, r + t.lobeOffset)))), o = n(G, K);
					Y = .04 + a * (.58 + .18 * o), X = .06 + a * (.74 + .02 * o), Z += .08 * o * a, Q = .22 + .76 * a, $ = 1 - i;
				};
			}
			case `birdseyemaple`: {
				let t = require_materials.proceduralMaterialPresets.birdseyemaple, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let a = (e * t.cells + n) * 2;
					i[a] = .34 + .32 * hash(n, e, r ^ 20247), i[a + 1] = .34 + .32 * hash(n, e, r ^ 9177);
				}
				let o = cachedNoise(48, 4, r ^ 27441);
				return () => {
					let e = G * t.cells, r = K * t.cells, s = (Math.floor(r) * t.cells + Math.floor(e)) * 2, c = fract(e) - i[s], l = fract(r) - i[s + 1], u = (c / t.radiusX) ** 2 + (l / t.radiusY) ** 2, d = smooth(clamp(1 - u)), f = smooth(clamp(1 - u / .06)), p = d > 0 ? d * (.5 + .5 * Math.cos(n * 2 * u)) : 0, m = Math.sin(n * 2 * K), h = Math.sin(n * (24 * G + .35 * m + .7 * c * d) + a), g = Math.cos(n * (64 * G + .16 * m) + a);
					Y = .67 + .12 * h - .34 * f - .12 * p, X = .45 + .012 * h - .015 * f + .005 * g, Z += .025 * f + .03 * o(G, K), Q = .98 - .04 * f;
				};
			}
			case `copperpatina`: {
				let t = require_materials.proceduralMaterialPresets.copperpatina, n = cachedNoise(4, 4, r ^ 31379), i = cachedNoise(20, 20, r ^ 11367), a = cachedNoise(96, 96, r ^ 23009);
				return () => {
					let e = n(G, K), r = i(G, K), o = a(G, K), s = smooth(clamp((.78 * e + .22 * r - t.coverageStart) / t.coverageRange));
					Y = .05 + .9 * s + .03 * o, qt = 1 - s, X = .25 + .28 * s + .06 * o + .1 * r * s, Z += .53 * s + .05 * o, Q = .98 - .15 * (1 - r) * s;
				};
			}
			case `rammedearth`: {
				let t = require_materials.proceduralMaterialPresets.rammedearth, i = new Float64Array(t.layers);
				for (let e = 0; e < t.layers; e++) i[e] = .22 + e % 2 * .46 + .14 * hash(e, 0, r ^ 20081);
				let o = cachedNoise(96, 96, r ^ 11865), s = cachedNoise(32, 48, r ^ 30027);
				return () => {
					let e = t.warp * Math.sin(n * G + a) + t.fineWarp * Math.sin(n * 3 * G - a), r = fract(K + e / t.layers) * t.layers, c = Math.floor(r), l = fract(r), u = smooth(clamp((l - .5 + t.transition) / (2 * t.transition))), d = i[c] + (i[(c + 1) % t.layers] - i[c]) * u, f = smooth(clamp(1 - ((l - .5) / t.seamWidth) ** 2)), p = o(G, K), m = smooth(clamp((.38 - s(G, K)) / .25));
					Y = .14 + .62 * d + .13 * p - .12 * f - .1 * m, X = .42 + .18 * p - .1 * f - .12 * m, Z += .07 * p - .05 * f, Q = .97 - .12 * f - .22 * m;
				};
			}
			case `canewebbing`: {
				let t = require_materials.proceduralMaterialPresets.canewebbing, i = cachedNoise(16, 16, r ^ 25027), ribbon = (e, t) => {
					return smooth(clamp(1 - ((fract(e + .5) - .5) / t) ** 2));
				};
				return () => {
					let e = G * t.cells, r = K * t.cells, o = ribbon(e, t.ribbonWidth), s = ribbon(r, t.ribbonWidth), c = .5 + .5 * Math.cos(Math.PI * e) * Math.cos(Math.PI * r), l = o * (1 - s + s * c), u = s * (1 - o + o * (1 - c)), d = ribbon(e + r - .5, t.diagonalWidth), f = ribbon(e - r - .5, t.diagonalWidth), p = d + f - d * f, m = (l + u) * (1 - p) + p, h = i(G, K), g = (l * Math.cos(n * 3 * e + a) + u * Math.cos(n * 3 * r + a)) * (1 - p) + .5 * p * (Math.cos(n * 3 * (e + r) + a) + Math.cos(n * 3 * (e - r) + a));
					Y = .04 + m * (.6 + .1 * h) + .035 * g, X = .06 + (l * (.63 + .04 * c) + u * (.63 + .04 * (1 - c))) * (1 - p) + .72 * p + m * .01 * h + .003 * g, Z += .3 * (1 - m) + .04 * h * m - .025 * g, Q = .22 + .77 * m;
				};
			}
			case `subwaytiles`: {
				let t = require_materials.proceduralMaterialPresets.subwaytiles, n = new Float64Array(t.columns * t.rows);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = hash(i, e, r ^ 31513);
				return () => {
					let e = Math.floor(K * t.rows), r = G * t.columns + e % 2 * .5, i = fract(r), a = t.columns / t.rows, o = fract(K * t.rows) * a, s = smooth(clamp((i - t.grout) / t.shoulder)) * smooth(clamp((1 - i - t.grout) / t.shoulder)) * smooth(clamp((o - t.grout) / t.shoulder)) * smooth(clamp((a - o - t.grout) / t.shoulder)), c = t.grout + t.shoulder, l = smooth(clamp((i - c) / t.bevel)) * smooth(clamp((1 - i - c) / t.bevel)) * smooth(clamp((o - c) / t.bevel)) * smooth(clamp((a - o - c) / t.bevel));
					Y = .4 + s * (.2 + .24 * n[e * t.columns + Math.floor(r) % t.columns]), X = .08 + s * (.32 + .48 * l), $ = 1 - s, Z += .6 * $ + .05 * s * (1 - l), Q = .62 + .38 * s;
				};
			}
			case `flutedwood`: {
				let t = require_materials.proceduralMaterialPresets.flutedwood, i = cachedNoise(64, 4, r ^ 18353);
				return () => {
					let r = smooth(clamp(1 - ((fract(G * t.slats) - .5) / t.halfWidth) ** 2)), o = i(G + .008 * Math.sin(n * 2 * K + a), K), s = .5 + .5 * Math.cos(n * (96 * G + .24 * Math.sin(n * 2 * K)) + a);
					Y = .08 + r * (.43 + .28 * o + .045 * s), X = .08 + r * (.71 + .018 * o + .006 * s), Z += .26 * (1 - r) + .055 * o * r, Q = .52 + .47 * r;
				};
			}
			case `tatami`: return () => {
				let t = require_materials.proceduralMaterialPresets.tatami, i = .5 + .5 * Math.cos(n * t.reeds * G), o = smooth(clamp(1 - ((fract(K * t.bindings + .5) - .5) / t.bindingWidth) ** 2)), s = .5 + .5 * Math.cos(n * (t.reeds / 2) * G), c = noise(G, K, t.reeds, 4, r ^ 12631), l = .5 + .5 * Math.cos(n * t.reeds * 3 * G + .12 * Math.sin(n * 4 * K));
				Y = .31 + .26 * i + .18 * c - .14 * o, X = .16 + .4 * i + .016 * l * i + .015 * q + o * (.24 * s - .1 * (1 - s)), Z += .035 * c - .045 * o * s, Q = .72 + .26 * i - .06 * o * (1 - s);
			};
			case `pineapple`: return () => {
				let t = require_materials.proceduralMaterialPresets.pineapple, n = fract(G + K) * t.cells, r = fract(K - G) * t.cells, a = Math.floor(n), o = Math.floor(r), s = n - a - .5, c = r - o - .5, l = m(G, K), u = v[o * t.cells + a], d = smooth(clamp((.5 - s) / t.shoulder)) * smooth(clamp((.5 + s) / t.shoulder)) * smooth(clamp((.5 - c) / t.shoulder)) * smooth(clamp((.5 + c) / t.shoulder)), f = (s * s + c * c) / (t.eyeRadius * t.eyeRadius), p = 1 - smooth(clamp(f)), h = smooth(clamp(f)) * (1 - smooth(clamp((f - 1) / 3)));
				X = .14 + d * (.34 + .13 * h - .22 * p + .05 * u + .005 * l), Y = .1 + d * (.49 + .12 * u + .045 * l - .2 * p), Q = .55 + d * (.42 - .2 * p), Z = i.roughness + .04 * (1 - d) - .025 * h * d;
			};
			case `strawberry`:
			case `lychee`: return () => {
				let n = G * h, r = K * g, a = Math.floor(n), o = Math.floor(r), s = m(G, K), c = 0, l = 0, u = 0, d = 0;
				for (let i = -1; i <= 1; i++) for (let s = -1; s <= 1; s++) {
					let f = a + s, p = o + i, m = (f % h + h) % h, y = (p % g + g) % g, b = (y * h + m) * _, x = y % 2 * .5;
					if (t === `strawberry`) {
						let t = require_materials.proceduralMaterialPresets.strawberry, i = n - f - x - v[b], a = r - p - v[b + 1], o = (i * v[b + 2] + a * v[b + 3]) / t.width, s = (a * v[b + 2] - i * v[b + 3]) / t.length, u = o * o + s * s;
						if (u >= 1) continue;
						c += 1 - smooth(clamp((u - t.core) / (1 - t.core))), l += 1 - smooth(clamp(u / t.core));
					} else {
						let t = require_materials.proceduralMaterialPresets.lychee, i = n - f - x - .5, a = r - p - .5;
						if (i >= v[b] || -i >= v[b + 1]) continue;
						let o = 1;
						for (let e = 0; e < 6; e++) {
							let n = e === 0 ? i : e === 1 ? -i : e === 2 ? .5 * i + .75 * a : e === 3 ? -.5 * i - .75 * a : e === 4 ? -.5 * i + .75 * a : .5 * i - .75 * a;
							if (o *= smooth(clamp((v[b + e] - n) / t.shoulder)), o === 0) break;
						}
						if (o === 0) continue;
						let s = i - v[b + 6], c = a - v[b + 7];
						u += o, d += o / (1 + 18 * (s * s + c * c));
					}
				}
				t === `strawberry` ? (X = .62 + .004 * s - .3 * c + .09 * l, Y = .12 + .012 * s + .78 * l, Q = 1 - .32 * c + .12 * l, Z = i.roughness + .04 * c - .06 * l) : (X = .16 + .28 * u + .15 * d + .004 * s, Y = .12 + .55 * u + .08 * d + .012 * s, Q = .55 + .42 * u, Z = i.roughness + .04 * (1 - u) - .03 * d);
			};
			case `sandpaper`: return () => {
				let e = Math.floor(K * 12), t = (e & 1) * .5, n = (Math.floor(G * 10 + t) % 10 + 10) % 10, i = (e % 12 + 12) % 12, a = fract(G * 10 + t) - .5, o = fract(K * 12) - .5, s = Math.hypot(a, o), c = .38 + .1 * hash(n, i, r ^ 12058), l = smooth(clamp((c - s) / (c * .55))), u = smooth(clamp((noise(G, K, 6, 6, r ^ 30659) - .72) / .18)) * (1 - l), d = noise(G, K, 48, 48, r ^ 21921);
				Y = .4 + .3 * l - .14 * u + .08 * d, X = .3 + .34 * l - .12 * u, Z += .06 * (d - .5) + .04 * (1 - l), Q = 1 - .44 * (1 - l) - .12 * u;
			};
			case `steelwool`: return () => {
				let e = Math.sin(Math.PI * (fract(3 * (G + K)) - .5)), t = Math.sin(Math.PI * (fract(3 * (G - K)) - .5)), n = Math.sin(Math.PI * (fract(2 * G + K) - .5)), i = smooth(clamp((.22 - Math.abs(e)) / .14)), a = smooth(clamp((.22 - Math.abs(t)) / .14)), o = smooth(clamp((.22 - Math.abs(n)) / .14)), s = (Math.floor(3 * (G + K)) % 3 + 3) % 3, c = (Math.floor(3 * (G - K)) % 3 + 3) % 3, l = i * (.85 + .15 * hash(s, 0, r ^ 7505)), u = a * (.85 + .15 * hash(c, 1, r ^ 19499)), d = o * .92, f = 1 - (1 - l) * (1 - u) * (1 - d), p = 1 - (1 - l * u) * (1 - u * d) * (1 - d * l), m = noise(G, K, 32, 32, r ^ 11783);
				Y = .44 + .34 * f + .1 * p + .08 * m, X = .3 + .3 * f + .08 * p, Z += .1 * (m - .5) + .08 * (1 - f), Q = 1 - .44 * (1 - f);
			};
			case `wirebrush`: return () => {
				let e = G * 24 + .3 * Math.sin(n * K), t = (Math.floor(e) % 24 + 24) % 24, i = fract(e) - .5, a = smooth(clamp((.32 - Math.abs(i)) / .12)), o = .85 + .15 * hash(t, 0, r ^ 15473), s = .9 + .1 * Math.sin(n * (2 * K + hash(t, 1, r ^ 25042))), c = noise(G, K, 32, 32, r ^ 6959);
				Y = .38 + .3 * a * o * s + .08 * c, X = .3 + .44 * a * o * s, Z += .1 * (c - .5) - .06 * a, Q = 1 - .44 * (1 - a);
			};
			case `cheesegrater`: return () => {
				let e = Math.floor(G * 6), t = Math.floor(K * 8), n = (e % 6 + 6) % 6, i = (t % 8 + 8) % 8, a = fract(G * 6) - .5, o = fract(K * 8) - .5, s = Math.hypot(a, o), c = smooth(clamp((.22 - s) / .1)), l = smooth(clamp((s - .22) / .06)) * smooth(clamp((.42 - s) / .08)), u = .85 + .15 * hash(n, i, r ^ 23585), d = (1 - l) * (1 - c), f = noise(G, K, 32, 32, r ^ 14967);
				Y = .44 + .26 * l - .3 * c + .08 * f, X = .3 + .24 * l * u - .26 * c, Z += .08 * (f - .5) - .06 * l + .1 * c, Q = 1 - .44 * c - .12 * d;
			};
			case `ovenrack`: return () => {
				let e = fract(K * 8) - .5, t = fract(G * 4) - .5, n = smooth(clamp((.3 - Math.abs(e)) / .12)), i = smooth(clamp((.16 - Math.abs(t)) / .08)), a = .85 + .15 * hash((Math.floor(K * 8) % 8 + 8) % 8, 0, r ^ 11085), o = noise(G, K, 24, 24, r ^ 28179);
				Y = .4 + .28 * n + .16 * i + .05 * n * i + .08 * o, X = .3 + .36 * n * a + .16 * i + .06 * n * i, Z += .08 * (o - .5) - .08 * n, Q = 1 - .44 * (1 - n) * (1 - i) - .12 * (1 - n) * i;
			};
			case `muffintin`: return () => {
				let e = Math.floor(G * 4), t = Math.floor(K * 4), n = (e % 4 + 4) % 4, i = (t % 4 + 4) % 4, a = fract(G * 4) - .5, o = fract(K * 4) - .5, s = Math.hypot(a, o), c = smooth(clamp((.34 - s) / .12)), l = smooth(clamp((s - .32) / .06)) * smooth(clamp((.48 - s) / .06)), u = .85 + .15 * hash(n, i, r ^ 29109), d = noise(G, K, 24, 24, r ^ 8074);
				Y = .42 + .24 * l - .28 * c + .08 * d, X = .3 + .2 * l * u - .28 * c, Z += .08 * (d - .5) - .05 * l + .08 * c, Q = 1 - .44 * c - .12 * (1 - l) * (1 - c);
			};
			case `gauze`: return () => {
				let e = fract(G * 12) - .5, t = fract(K * 12) - .5, n = smooth(clamp((.26 - Math.abs(t)) / .14)), i = smooth(clamp((.26 - Math.abs(e)) / .14)), a = Math.cos(Math.PI * 12 * (G + K)), o = n * (.72 + .28 * a), s = i * (.72 - .28 * a), c = 1 - (1 - o) * (1 - s), l = noise(G, K, 32, 32, r ^ 19737);
				Y = .7 + .16 * c + .05 * (o - s) + .06 * l, X = .3 + .26 * c + .05 * (o - s), Z += .08 * (l - .5), Q = 1 - .44 * (1 - c);
			};
			case `elasticbandage`: return () => {
				let e = fract(4 * (G - K)) - .5, t = smooth(clamp((.3 - Math.abs(e)) / .12)), n = smooth(clamp((.16 - Math.abs(Math.sin(Math.PI * fract(2 * (G + K))))) / .1)), i = .85 + .15 * hash((Math.floor(4 * (G - K)) % 4 + 4) % 4, 0, r ^ 7239), a = noise(G, K, 28, 28, r ^ 21931);
				Y = .52 + .3 * t * i + .08 * a - .18 * n, X = .3 + .26 * t * i - .16 * n, Z += .08 * (a - .5) - .06 * t, Q = 1 - .44 * n;
			};
			case `icepack`: return () => {
				let e = Math.floor(G * 4), t = Math.floor(K * 4), n = (e % 4 + 4) % 4, i = (t % 4 + 4) % 4, a = fract(G * 4) - .5, o = fract(K * 4) - .5, c = smooth(clamp((.42 - (Math.abs(a) ** 4 + Math.abs(o) ** 4) ** .25) / .12)), l = .85 + .15 * hash(n, i, r ^ 27452), u = noise(G, K, 24, 24, r ^ 12161);
				Y = .42 + .34 * c * l + .08 * u - .12 * (1 - c), X = .3 + .24 * c * l - .16 * (1 - c), Z += .08 * (u - .5) - .05 * c, Q = 1 - .44 * (1 - c);
			};
			case `bubblewrap`: return () => {
				let e = Math.floor(G * 12), t = Math.floor(K * 12), n = (e % 12 + 12) % 12, i = (t % 12 + 12) % 12, a = fract(G * 12) - .5, o = fract(K * 12) - .5, s = (a * a + o * o) / (.42 * .42), c = s < 1 ? (1 - s) * (1 - s) : 0, l = .9 + .1 * hash(n, i, r ^ 15393), u = noise(G, K, 36, 36, r ^ 30634);
				Y = .55 + .3 * c * l + .06 * (u - .5), X = .26 + .36 * c * l, Z += .08 * (u - .5) - .12 * c, Q = 1 - .42 * (1 - c);
			};
			case `sequin`: return () => {
				let e = (Math.floor(K * 10) % 10 + 10) % 10, t = .5 * (e & 1), n = G * 10 + t, i = (Math.floor(n) % 10 + 10) % 10, a = fract(n) - .5, o = fract(K * 10) - .5, c = smooth(clamp((1 - (a * a + o * o) / (.34 * .34)) / .22)), l = (a * a + o * o) / (.1 * .1), u = l < 1 ? (1 - l) * (1 - l) : 0, d = .9 + .1 * hash(i, e, r ^ 20946), f = hash(i, e, r ^ 2577) - .5, p = hash(i, e, r ^ 2850) - .5, m = noise(G, K, 30, 30, r ^ 27678), h = c * (f * a + p * o);
				Y = .46 + .34 * c * d + .16 * h - .26 * u + .06 * (m - .5), X = .24 + .32 * c * d + .2 * h - .24 * u, Z += .08 * (m - .5) - .1 * c, Q = 1 - .44 * (1 - c) - .14 * u;
			};
			case `pennyround`: return () => {
				let e = (Math.floor(K * 8) % 8 + 8) % 8, t = .5 * (e & 1), n = G * 8 + t, i = (Math.floor(n) % 8 + 8) % 8, a = fract(n) - .5, o = fract(K * 8) - .5, c = smooth(clamp((1 - (a * a + o * o) / .2116) / .22)), l = .9 + .1 * hash(i, e, r ^ 10932), u = noise(G, K, 40, 40, r ^ 30705);
				Y = .56 + .26 * c * l + .06 * (u - .5) - .14 * (1 - c), X = .26 + .28 * c * l + .04 * (u - .5) * (1 - c), Z += .12 * (1 - c) + .06 * (u - .5), Q = 1 - .44 * (1 - c);
			};
			case `volleyball`: return () => {
				let e = 3 * G + .18 * Math.sin(n * K), t = (Math.floor(e) % 3 + 3) % 3, i = fract(e) - .5, o = smooth(clamp((.06 - (.5 - Math.abs(i))) / .04)), s = .92 + .08 * hash(t, 0, r ^ 20937), c = fract(G * 24) - .5, l = fract(K * 24) - .5, u = (c * c + l * l) / .0036, d = u < 1 ? (1 - u) * (1 - u) : 0, f = noise(G, K, 40, 40, r ^ 13223);
				Y = .42 + .4 * s * (1 - o) - .14 * o - .08 * d + .05 * (f - .5), X = .3 + .22 * s * (1 - o) - .16 * o - .07 * d, Z += .06 * (f - .5) + .08 * o + .05 * d, Q = 1 - .4 * o - .16 * d;
			};
			case `bowlingball`: return () => {
				let e = .6 * noise(G, K, 6, 6, r ^ 6575) + .4 * noise(G, K, 14, 14, r ^ 11121), t = 0;
				for (let [e, n] of [
					[.5, .36],
					[.38, .52],
					[.62, .52]
				]) {
					let r = fract(G - e + .5) - .5, i = fract(K - n + .5) - .5, a = (r * r + i * i) / .003025, o = a < 1 ? (1 - a) * (1 - a) : 0;
					t += o - t * o;
				}
				Y = .36 + .34 * e - .24 * t, X = .38 + .1 * e - .3 * t, Z += .05 * (e - .5) + .22 * t, Q = 1 - .5 * t;
			};
			case `rugbyball`: return () => {
				let e = fract(K - .25 + .5) - .5, t = smooth(clamp((.05 - Math.abs(e)) / .03)), n = fract(G * 12) - .5, i = smooth(clamp((.18 - Math.abs(n)) / .08)) * t, o = smooth(clamp((.035 - (.5 - Math.abs(fract(K * 2) - .5))) / .025)), s = noise(G, K, 72, 72, r ^ 27948);
				Y = .42 + .26 * i - .16 * o + .12 * (s - .5) + .06 * t, X = .32 + .16 * i - .12 * o + .05 * (s - .5), Z += .1 * (s - .5) - .12 * i + .06 * o, Q = 1 - .42 * o - .14 * (1 - i) * t;
			};
			case `wafflecone`: return () => {
				let e = fract((G + K) * 8) - .5, t = fract((G - K) * 8) - .5, n = smooth(clamp((.12 - Math.abs(e)) / .08)), i = smooth(clamp((.12 - Math.abs(t)) / .08)), a = n + i - n * i, o = noise(G, K, 24, 24, r ^ 12081);
				Y = .42 + .3 * a - .1 * (1 - a) + .12 * (o - .5), X = .28 + .24 * a, Z += .08 * (o - .5) - .06 * a, Q = 1 - .4 * (1 - a);
			};
			case `donutglaze`: return () => {
				let e = noise(G, K, 5, 5, r ^ 19499), t = noise(G, K, 11, 11, r ^ 23868), i = smooth(clamp((.65 * e + .35 * t - .46) / .14)), a = fract(G * 14) - .5, o = fract(K * 14) - .5, s = (a * a + o * o) / .0064, c = (s < 1 ? (1 - s) * (1 - s) : 0) * (1 - .6 * i);
				Y = .5 + .3 * i + .1 * (t - .5) - .12 * c, X = .3 + .22 * i - .1 * c, Z += .14 * (1 - i) + .05 * (e - .5), Q = 1 - .4 * c - .12 * (1 - i);
			};
			case `brownie`: return () => {
				let e = noise(G, K, 3, 3, r ^ 7038) - .5, t = noise(G, K, 3, 3, r ^ 11407) - .5, n = 7 * G + .5 * e, i = 7 * K + .5 * t, a = smooth(clamp((.1 - (.5 - Math.abs(fract(n) - .5))) / .05)), o = smooth(clamp((.1 - (.5 - Math.abs(fract(i) - .5))) / .05)), s = a + o - a * o, c = 0;
				for (let [e, t] of [
					[.22, .3],
					[.62, .58],
					[.42, .82]
				]) {
					let n = fract(G - e + .5) - .5, r = fract(K - t + .5) - .5, i = (n * n + r * r) / .0036, a = i < 1 ? (1 - i) * (1 - i) : 0;
					c += a - c * a;
				}
				let l = noise(G, K, 40, 40, r ^ 15760);
				Y = .34 - .16 * s + .3 * c + .08 * (l - .5), X = .36 - .14 * s + .2 * c + .04 * (l - .5), Z += .06 * (l - .5) + .08 * s - .1 * c, Q = 1 - .4 * s - .1 * (1 - c);
			};
			case `soapbar`: return () => {
				let e = Math.floor(G * 2), t = Math.floor(K * 2), n = (e % 2 + 2) % 2, i = (t % 2 + 2) % 2, a = fract(G * 2) - .5, o = fract(K * 2) - .5, s = Math.abs(a) / .42, c = Math.abs(o) / .36, u = smooth(clamp((1.12 - (s ** 4 + c ** 4) ** .25) / .22)), d = .92 + .08 * hash(n, i, r ^ 25007), f = a / .16, p = o / .1, m = f * f + p * p, h = m < 1 ? (1 - m) * (1 - m) : 0, g = fract(G * 40) - .5, _ = fract(K * 40) - .5, v = (g * g + _ * _) / (.07 * .07), y = v < 1 ? (1 - v) * (1 - v) : 0;
				Y = .52 + .3 * u * d + .1 * h - .08 * y - .14 * (1 - u), X = .3 + .24 * u * d + .06 * h - .05 * y, Z += .1 * (1 - u) + .06 * y - .04 * h, Q = 1 - .42 * (1 - u) - .14 * y;
			};
			case `loofah`: return () => {
				let e = fract((G + .16 * Math.sin(Math.PI * 2 * K)) * 6) - .5, t = fract((K + .16 * Math.sin(Math.PI * 2 * G)) * 6) - .5, n = smooth(clamp((.16 - Math.abs(e)) / .12)), i = smooth(clamp((.16 - Math.abs(t)) / .12)), a = n + i - n * i, o = noise(G, K, 48, 48, r ^ 18625);
				Y = .46 + .32 * a + .12 * (o - .5), X = .28 + .3 * a + .05 * (o - .5), Z += .12 * (o - .5) - .06 * a, Q = 1 - .46 * (1 - a);
			};
			case `scrubbypad`: return () => {
				let e = (Math.floor(K * 8) % 2 + 2) % 2, n = fract(G * 8 + .5 * e) - .5, i = fract(K * 8) - .5, o = smooth(clamp((.34 - Math.max(Math.abs(n) * 1.15, Math.abs(i))) / .06)), s = noise(G, K, 64, 64, r ^ 30482);
				Y = .5 + .26 * (1 - o) + .16 * (s - .5) - .18 * o, X = .32 + .2 * (1 - o) - .22 * o + .05 * (s - .5), Z += .14 * (s - .5) + .1 * o, Q = 1 - .5 * o;
			};
			case `orangeflesh`: return () => {
				let e = fract(G) - .5, t = fract(K) - .5, n = Math.hypot(e, t), i = Math.atan2(t, e), a = smooth(clamp((.46 - n) / .03)), o = smooth(clamp((.45 - n) / .03)) - smooth(clamp((.38 - n) / .03)), s = smooth(clamp((.38 - n) / .03)), c = smooth(clamp((n - .05) / .04)), l = smooth(clamp((.09 - Math.abs(Math.sin(5 * i))) / .05)) * s * c, u = .5 + .5 * Math.sin(48 * i + n * 72), d = noise(G, K, 40, 40, r ^ 12743);
				Y = .34 + .3 * a + .16 * o + .12 * u * s * c - .18 * l + .05 * (d - .5), X = .24 + .24 * a + .12 * o + .06 * u * s * c - .12 * l, Z += .06 * (d - .5) + .12 * l - .06 * u * s * c, Q = 1 - .44 * (1 - a) - .4 * l;
			};
			case `kiwiflesh`: return () => {
				let e = fract(G) - .5, t = fract(K) - .5, n = Math.hypot(e, t), i = Math.atan2(t, e), a = smooth(clamp((.46 - n) / .03)), o = smooth(clamp((.45 - n) / .03)) - smooth(clamp((.38 - n) / .03)), s = smooth(clamp((.1 - n) / .04)), c = smooth(clamp((n - .08) / .04)), l = smooth(clamp((.38 - n) / .03)), u = smooth(clamp((.06 - Math.abs(n - .2)) / .03)), d = (.5 + .5 * Math.cos(16 * i)) * u, f = (.5 + .5 * Math.sin(56 * i + n * 48)) * c * l, p = noise(G, K, 40, 40, r ^ 21930);
				Y = .38 + .26 * a + .18 * s - .26 * d + .08 * f + .05 * (p - .5), X = .26 + .24 * a + .08 * s + .08 * d + .04 * f + .1 * o, Z += .06 * (p - .5) - .08 * d - .06 * s + .08 * (1 - a), Q = 1 - .44 * (1 - a) - .18 * d;
			};
			case `avocadoflesh`: return () => {
				let e = fract(G) - .5, t = fract(K) - .5, n = Math.hypot(e, t), i = smooth(clamp((.46 - n) / .03)), a = smooth(clamp((.45 - n) / .03)) - smooth(clamp((.39 - n) / .03)), o = e / .15 * (e / .15) + t / .19 * (t / .19), s = o < 1 ? smooth(clamp((1 - o) / .22)) : 0, c = noise(G, K, 12, 12, r ^ 26307), l = noise(G, K, 48, 48, r ^ 8923);
				Y = .36 + .3 * i + .14 * a - .2 * s + .08 * (c - .5) + .04 * (l - .5), X = .26 + .26 * i + .12 * a - .22 * s, Z += .06 * (l - .5) + .14 * s - .06 * (1 - s) * i, Q = 1 - .44 * (1 - i) - .38 * s;
			};
			case `turquoise`: {
				let e = n * hash(0, 0, r ^ 12709), t = n * hash(0, 0, r ^ 23410), i = n * hash(0, 0, r ^ 40471);
				return () => {
					let a = Math.sin(n * (3 * G + K) + e) + .35 * Math.sin(n * 2 * G + t), o = Math.sin(n * (G - 2 * K) + t) + .3 * Math.sin(n * 3 * K + e), s = Math.sin(n * (2 * G + 3 * K) + i), c = smooth(clamp(1 - a / .1 * (a / .1))), l = smooth(clamp(1 - o / .085 * (o / .085))), u = smooth(clamp(1 - s / .075 * (s / .075))), d = clamp(.55 * c + .5 * l + .35 * u), f = noise(G, K, 32, 32, r ^ 18401);
					Y = .82 * (1 - d) + .14 * d + .05 * (f - .5), X = .52 * (1 - d) + .44 * d + .008 * (f - .5), Z += .22 * d + .03 * (f - .5), Q = 1 - .22 * d;
				};
			}
			case `rhodonite`: {
				let e = n * hash(0, 0, r ^ 4777), t = n * hash(0, 0, r ^ 29620);
				return () => {
					let i = noise(G, K, 4, 4, r ^ 14546), a = G + .06 * (i - .5), o = K + .06 * (i - .5), s = Math.sin(n * (4 * a + o) + e) + .35 * Math.sin(n * 3 * o + t), c = Math.sin(n * (2 * a - 3 * o) + t), l = smooth(clamp(1 - s / .11 * (s / .11))) * smooth(clamp(1 - c / .14 * (c / .14))), u = smooth(clamp((noise(G, K, 8, 8, r ^ 35419) - .58) / .22)), d = clamp(l * 1.5 + .75 * u), f = noise(G, K, 40, 40, r ^ 25075);
					Y = .84 * (1 - d) + .12 * d + .04 * (f - .5), X = .52 * (1 - d) + .45 * d + .006 * (f - .5), Z += .18 * d + .02 * (f - .5), Q = 1 - .18 * d;
				};
			}
			case `tigereye`: {
				let e = n * hash(0, 0, r ^ 10229), t = n * hash(0, 0, r ^ 28305);
				return () => {
					let i = noise(G, K, 4, 8, r ^ 23089), a = K * 6 + .35 * Math.sin(n * G + e) + .25 * (i - .5), o = .5 + .5 * Math.sin(n * a), s = .5 + .5 * Math.cos(n * 2 * a + t), c = .65 * o + .35 * s, l = noise(G * 64, K * 8, 64, 8, r ^ 33492);
					Y = .25 + .65 * c + .08 * (l - .5), X = .48 + .04 * c + .005 * (l - .5), Z += .05 * (1 - c) + .02 * (l - .5), Q = .98 + .02 * c;
				};
			}
			case `morel`: return () => {
				let e = x, t = G * e.columns, n = K * e.rows, r = Math.floor(t), i = Math.floor(n), a = f(G, K), o = 0, s = 0;
				for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++) {
					let l = r + c, u = i + a, d = ((u + e.rows) % e.rows * e.columns + (l + e.columns) % e.columns) * 5, f = t - l - S[d], p = n - u - S[d + 1], m = f * S[d + 2] + p * S[d + 4], h = p * S[d + 3], g = m * m + h * h;
					if (g >= 1) continue;
					let _ = (1 - g) ** e.weightPower;
					o += _, s += _ * _;
				}
				let l = smooth(clamp((s / (o * o) - .48) / .48));
				Y = .8 - .6 * l + .025 * a, X = .64 - .48 * l + .006 * a, Q = .98 - .4 * l, Z += .035 * l + .012 * (a - .5);
			};
			case `mushroomgills`:
			case `bracketfungus`: return () => {
				let r = G * y.cells, a = K * y.cells, o = Math.floor(r), s = Math.floor(a), c = f(G, K);
				Y = .3 + .025 * c, X = .13 + .004 * c, Q = .66;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = o + u, f = s + l, p = ((f + y.cells) % y.cells * y.cells + (d + y.cells) % y.cells) * 7, m = r - d - b[p], h = a - f - b[p + 1], g = b[p + 2], _ = b[p + 3], v = m * g + h * _, x = h * g - m * _ + .55, S = v * v + x * x;
					if (S <= .025 || S >= 2.21 || x <= 0 || x * x <= .04 * S) continue;
					let C = Math.sqrt(S), w = Math.atan2(v, x), ee = b[p + 4], T = smooth(clamp((S - .025) / .065)), te = smooth(clamp((x / C - .2) / .25)), E, ne, re, ie, ae;
					if (t === `mushroomgills`) {
						let t = require_materials.proceduralMaterialPresets.mushroomgills, n = .5 + .5 * Math.cos(t.blades * w + .5 * Math.sin(5 * C + ee)), r = (n ** t.bladePower + (1 - n) ** t.bladePower * smooth(clamp((C - t.shortStart) / (t.shortEnd - t.shortStart)))) * b[p + 6], a = 1 - smooth(clamp((C - 1.22) / .2));
						E = T * te * a, ne = .2 + .22 * r + .005 * c, re = .25 + .51 * r + .08 * b[p + 5], ie = .63 + .33 * r, ae = i.roughness - .035 * r + .012 * (c - .5);
					} else {
						let t = require_materials.proceduralMaterialPresets.bracketfungus, r = C * (1 + t.lobe * Math.cos(5 * w + ee) + .035 * Math.cos(9 * w - ee));
						if (r >= 1.35) continue;
						let a = 1 - smooth(clamp((r - 1.27) / .08)), o = smooth(clamp((r - t.marginStart) / (t.marginEnd - t.marginStart))), s = .5 + .5 * Math.cos(n * t.zones * r + ee + .2 * Math.sin(3 * w)), l = b[p + 5], u = (c - .5) * b[p + 6];
						E = T * te * a, ne = .47 - .045 * r + .009 * u, re = (.22 + .48 * s + .12 * l) * (1 - o) + .94 * o + .018 * u, ie = .97, ae = i.roughness + .025 * u - .045 * o;
					}
					Y += E * (re - Y), X += E * (ne - X), Q += E * (ie - Q), Z += E * (ae - Z);
				}
			};
			case `tactilepaving`: return () => {
				let t = require_materials.proceduralMaterialPresets.tactilepaving, n = u(G, K), r = C(G, K), i = Math.abs(fract(G * t.tiles) - .5), a = Math.abs(fract(K * t.tiles) - .5), o = (1 - smooth(clamp((i - t.jointInner) / (t.jointOuter - t.jointInner)))) * (1 - smooth(clamp((a - t.jointInner) / (t.jointOuter - t.jointInner)))), s = fract(G * t.domes) - .5, c = fract(K * t.domes) - .5, l = 1 - smooth(clamp((s * s + c * c - t.domeInner * t.domeInner) / (t.domeOuter * t.domeOuter - t.domeInner * t.domeInner)));
				Y = .22 + .4 * o + .08 * o * l + .06 * n + .05 * r, X = .12 + o * (.12 + .56 * l) + .008 * n, Z = t.roughness + .06 * (n - .5) - .025 * l * o, Q = .72 + .22 * o + .06 * o * l;
			};
			case `roadmarking`: return () => {
				let t = require_materials.proceduralMaterialPresets.roadmarking, n = u(G, K), i = (1 - smooth(clamp((Math.abs(fract(G * t.bands) - .5) - t.bandInner) / (t.bandOuter - t.bandInner)))) * smooth(clamp((w(G, K) - t.wearInner) / (t.wearOuter - t.wearInner))), a = .04 + .12 * n, o = .17 + .07 * n;
				Y = a + i * (.82 + .1 * n - a), X = o + i * (.32 + .008 * n - o), Z = t.roughness - .25 * i + .04 * (n - .5), Q = .91 + .09 * i;
			};
			case `draincover`: return () => {
				let t = require_materials.proceduralMaterialPresets.draincover, n = u(G, K), r = Math.abs(G - .5), i = Math.abs(K - .5), a = (1 - smooth(clamp((r - t.frameInnerX) / (t.frameOuterX - t.frameInnerX)))) * (1 - smooth(clamp((i - t.frameInnerY) / (t.frameOuterY - t.frameInnerY)))), o = 1 - smooth(clamp((i - t.braceInner) / (t.braceOuter - t.braceInner))), s = Math.max(0, i - t.slotHalfLength), c = 0;
				for (let e = 0; e < t.slots; e++) {
					let n = G - t.slotStart - e * t.slotSpacing;
					c += 1 - smooth(clamp((n * n + s * s - t.slotInner * t.slotInner) / (t.slotOuter * t.slotOuter - t.slotInner * t.slotInner)));
				}
				let l = a * (1 - c * (1 - o));
				Y = .035 + .045 * n + l * (.52 + .08 * n), X = .1 + .012 * n + .72 * l, Z = t.roughness + .2 * (1 - l) + .06 * (n - .5), Q = .25 + .75 * l, qt = l;
			};
			case `birchbark`:
			case `palmtrunk`:
			case `sycamorebark`: return () => {
				let e = ie(G, K), r = ae ? ae(G, K) : 0;
				if (t === `palmtrunk`) {
					let t = oe(G, K), i = Math.floor(K * 9), a = 0, o = 0;
					for (let e = i - 1; e <= i; e++) {
						let t = (e + 9) % 9 * 4, r = ue[t] + .006 * Math.sin(n * G + ue[t + 2]) + .003 * Math.sin(3 * n * G + ue[t + 2]), i = fract(K - r + .5) - .5, s = i / ue[t + 1], c = (i - .018) / .013, l = Math.max(0, 1 - s * s), u = Math.max(0, 1 - c * c);
						a += l * l * ue[t + 3], o += u * u * ue[t + 3];
					}
					Y = .49 + .17 * r + .12 * t - .32 * a + .08 * o, X = .36 + .035 * t + .012 * e - .15 * a + .12 * o, Z += .025 * (e - .5) - .03 * a, Q = 1 - .22 * a;
				} else {
					let i = G * se, a = K * ce, o = Math.floor(i), s = Math.floor(a), c = t === `birchbark`, l = 0, u = .54, d = .32, f = 0;
					for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
						let n = o + t, r = s + e, p = (n + se) % se, m = ((r + ce) % ce * se + p) * le, h = i - n - D[m], g = a - r - D[m + 1], _ = h / D[m + 2], v = g / D[m + 3], y = _ * _ + v * v, b = c ? y : y * (1 + .16 * Math.sin(5 * h + D[m + 4]) * Math.sin(6 * g - D[m + 4]));
						if (b >= 1) continue;
						let x = smooth(clamp((1 - b) / (c ? .75 : .24)));
						c ? l += (1 - l) * x * D[m + 4] : (u += (D[m + 5] - u) * x, d += (.29 + .055 * D[m + 5] - d) * x, f = (f + x) * (1 - x));
					}
					if (c) {
						let t = ((1 + Math.sin(n * (13 * K + .12 * r))) * .5) ** 24;
						Y = .91 + .035 * r - .79 * l - .035 * t, X = .34 + .007 * e - .065 * l - .012 * t, Z += .04 * l + .02 * (e - .5), Q = 1 - .2 * l - .025 * t;
					} else Y = u + .025 * (e - .5), X = d + .008 * f + .005 * (e - .5), Z += .035 * (1 - u) + .015 * (e - .5), Q = 1 - .055 * f;
				}
			};
			case `rosepetal`:
			case `lilypetal`: return () => {
				let e = t === `rosepetal`, r = e ? fe(G, K) : 0, i = pe(G, K), o = Math.sin(n * (3 * G + .22 * Math.sin(n * K + a))), s = e ? 0 : Math.sin(n * (32 * G + .16 * Math.sin(n * 2 * K + a))), c = me * G, l = he * K, u = Math.floor(c), d = Math.floor(l), f = 0;
				for (let t = -1; t <= 1; t++) for (let n = -1; n <= 1; n++) {
					let r = u + n, i = d + t, a = ((i + he) % he * me + (r + me) % me) * 8, o = c - r - O[a], s = l - i - O[a + 1], p = (o * O[a + 2] + s * O[a + 3]) * O[a + 4], m = (s * O[a + 2] - o * O[a + 3]) * O[a + 5], g = clamp(1 - (e ? p * p + m * m : p * p * (1 + O[a + 7] * Math.sin(3 * m)) + m * m)), _ = g * g * g * O[a + 6];
					f += e ? _ : (1 - f) * _;
				}
				e ? (Y = .48 + .16 * o + .08 * r, X = .3 + .1 * o + .055 * f, Z += .025 * f + .02 * (i - .5), Q = .98) : (Y = .94 - .82 * f, X = .3 + .025 * o + .012 * s, Z += .025 * f + .012 * (i - .5), Q = .99);
			};
			case `fritillarypetal`: return () => {
				let e = fe(G, K), t = pe(G, K), r = 3 * G + .085 * Math.sin(n * 2 * K + a) + .12 * e, i = 4 * K + .065 * Math.sin(n * 2 * G - a) + .1 * e, o = .5 + .5 * Math.tanh(7 * Math.sin(n * r) * Math.sin(n * i)), s = Math.sin(n * (40 * G + .12 * Math.sin(n * K + a)));
				Y = .12 + .8 * o, X = .3 + .014 * s + .02 * Math.sin(n * (2 * G + .1 * Math.sin(n * K + a))), Z += .014 * (t - .5), Q = .99;
			};
			case `cantaloupe`: return () => {
				let e = ve(G, K), t = 7 * G + .38 * Math.sin(n * 3 * K + a), r = 7 * K + .34 * Math.sin(n * 2 * G - a), i = Math.floor(t), o = Math.floor(r), s = _e(G, K), c = 0;
				for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
					let a = i + n, s = o + e, l = ((s + 7) % 7 * 7 + (a + 7) % 7) * 26, u = t - a - ye[l], d = r - s - ye[l + 1], f = smooth(clamp((1.21 - u * u) * 5)) * smooth(clamp((1.21 - d * d) * 5));
					for (let e = 0; e < 8; e++) {
						let t = l + 2 + e * 3, n = ye[t + 2] - u * ye[t] - d * ye[t + 1];
						f *= smooth(clamp((n - .035) * 6));
					}
					c += f;
				}
				let l = 1 - c;
				Y = .14 + .12 * e + l * (.66 + .06 * s), X = .12 + .012 * s + l * (.5 + .06 * s), Z += .1 * l - .03 * c, Q = .9 + .1 * l;
			};
			case `dragonfruit`: return () => {
				let e = 4 * G, t = 6 * K, n = Math.floor(e), r = Math.floor(t), i = _e(G, K), a = 0, o = 0, s = 0, c = 0;
				for (let i = -1; i <= 1; i++) for (let l = -1; l <= 1; l++) {
					let u = n + l, d = r + i, f = ((d + 6) % 6 * 4 + (u + 4) % 4) * 5, p = e - u - k[f], m = t - d - k[f + 1], h = (p * k[f + 2] - m * k[f + 3]) * 2.941176470588235, g = (m * k[f + 2] + p * k[f + 3]) * 1.4285714285714286, _ = h * h * (1 + .65 * g + .2 * g * g) + g * g, v = smooth(clamp(1 - _)), y = smooth(clamp((1 - _) * 5)), b = smooth(clamp((g - .05) * 2.5)), x = v * smooth(clamp((g + .35) * 1.5)), S = (y - v) * (1 - b);
					a += v, o += (1 - o) * y * b * k[f + 4], s += x, c += S;
				}
				Y = .045 + .025 * i + .86 * o, X = .16 + .008 * i + .11 * a + .48 * s - .07 * c, Z += .1 * o + .04 * c, Q = 1 - .19 * c;
			};
			case `kiwiskin`: return () => {
				let e = 36 * G, t = 36 * K, n = Math.floor(e), r = Math.floor(t), i = _e(G, K), a = 0, o = 0;
				for (let i = -1; i <= 1; i++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = r + i, u = ((l + 36) % 36 * 36 + (c + 36) % 36) * 5, d = e - c - be[u], f = t - l - be[u + 1], p = d * be[u + 2] + f * be[u + 3], m = f * be[u + 2] - d * be[u + 3], h = smooth(clamp(1 - p * p * 5.408328826392645 - m * m * 177.77777777777777)), g = p + .43, _ = smooth(clamp(1 - (g * g + m * m) * 69.44444444444444));
					a += (1 - a) * h * be[u + 4], o += (1 - o) * _;
				}
				Y = .34 + .13 * i + .38 * a - .19 * o, X = .15 + .016 * i + .23 * a - .085 * o, Z += .055 * a - .025 * o, Q = 1 - .23 * o;
			};
			case `walnutshell`: return () => {
				let e = G * 7 + .8 * (Ht(G, K) - .5), t = K * 7, n = Math.floor(e), r = Math.floor(t), i = 0;
				for (let a = -2; a <= 2; a++) for (let o = -2; o <= 2; o++) {
					let s = n + o, c = r + a, l = ((c + 7) % 7 * 7 + (s + 7) % 7) * 24;
					for (let n = 0; n < 3; n++) {
						let r = l + n * 8;
						if (!U[r + 7]) continue;
						let a = e - s - U[r], o = t - c - U[r + 1], u = U[r + 2], d = U[r + 3], f = (a * u + o * d) * U[r + 4];
						if (f * f >= 1) continue;
						let p = (o * u - a * d - U[r + 6] * (1 - f * f)) * U[r + 5], m = smooth(clamp((1 - f * f) / .4)) * smooth(clamp(1 - p * p));
						i += m;
					}
				}
				let a = i / (.65 + i), o = Vt(G, K);
				Y = .13 + .74 * a + .055 * o, X = .13 + .75 * a + .012 * o, Q = .45 + .53 * a, Z += .035 * (1 - a) + .012 * (o - .5);
			};
			case `peanutshell`: return () => {
				let e = G * 10 + .28 * Math.sin(n * K + a) + .3 * (Ht(G, K) - .5), t = K * 5, r = Math.floor(e), i = Math.floor(t), o = smooth(clamp((Math.cos(n * e) - .6) / .4)), s = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let o = r + a, c = i + n, l = ((c + 5) % 5 * 10 + (o + 10) % 10) * 3, u = e - o - .5, d = t - c - Ut[l], f = u / .65, p = (d - Ut[l + 2] * u) * Ut[l + 1], m = f * f + p * p;
					m < 1 && (s += smooth(1 - m));
				}
				let c = s / (.5 + s), l = Vt(G, K);
				Y = .5 + .22 * o + .12 * c + .045 * l, X = .25 + .38 * o + .17 * c + .008 * l, Q = .72 + .19 * o + .075 * c, Z += .025 * (1 - o) + .012 * (l - .5);
			};
			case `almondshell`: return () => {
				let e = G * 16, t = K * 12, r = Math.floor(e), i = Math.floor(t), o = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let s = r + a, c = i + n, l = ((c + 12) % 12 * 16 + (s + 16) % 16) * 7;
					if (!W[l + 6]) continue;
					let u = e - s - W[l], d = t - c - W[l + 1], f = W[l + 2], p = W[l + 3], m = (u * f + d * p) * W[l + 4], h = (d * f - u * p) * W[l + 5], g = m * m + h * h;
					g < 1 && (o += smooth(1 - g));
				}
				let s = Vt(G, K), c = .5 + .5 * Math.cos(n * 43 * G + .35 * Math.sin(n * K + a));
				Y = .76 - .45 * o + .035 * s + .018 * c, X = .62 - .33 * o + .006 * s + .004 * c, Q = .98 - .38 * o, Z += .035 * o + .012 * (s - .5);
			};
			case `scallopshell`:
			case `oystershell`:
			case `nautilusshell`: return () => {
				let e = G * zt, n = K * zt, r = Math.floor(e), a = Math.floor(n), o = Rt(G, K);
				Y = .28 + .035 * o, X = .12 + .004 * o, Q = .76;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = r + c, u = a + s, d = ((u + zt) % zt * zt + (l + zt) % zt) * 8, f = e - l - H[d], p = n - u - H[d + 1], m = H[d + 2], h = H[d + 3], g = (f * m + p * h) * H[d + 4], _ = (p * m - f * h) * H[d + 5], v = H[d + 6], y, b, x, S, C;
					if (t === `scallopshell`) {
						let e = _ + .6, t = g * g + e * e;
						if (t <= .015 || t >= 1.8225 || e <= 0) continue;
						let n = Math.sqrt(t), r = Math.atan2(g, e), i = smooth(clamp((t - .015) * 16)), a = smooth(clamp((Math.cos(r) - .55) * 5)), o = 1 - smooth(clamp((n - 1.15) * 5)), s = .5 + .5 * Math.cos(18 * r), c = .5 + .5 * Math.cos(44 * n + v);
						y = i * a * o, b = .29 + .25 * s + .025 * c, x = .48 + .25 * s + .065 * c, S = .8 + .17 * s, C = -.05 * s;
					} else if (t === `oystershell`) {
						let e = g + .16 * _ * _, t = (e * e + _ * _) * (1 + .13 * Math.sin(5 * g + v) * Math.sin(4 * _ - v));
						if (t >= 1) continue;
						y = 1 - smooth(clamp((t - .78) * (1 / .22))), b = .25, x = H[d + 7], S = .96;
						for (let e = 0; e < 5; e++) {
							let n = t - (.9 - e * .155), r = 1 - smooth(clamp((n + .025) * 20)), i = Math.exp(-1800 * (n + .045) ** 2), a = Math.exp(-1800 * (n - .035) ** 2);
							b += .065 * r + .075 * i - .035 * a, x += .035 * r + .1 * i - .14 * a, S -= .12 * a;
						}
						b += .018 * (o - .5), x += .12 * (o - .5), C = .045 * (o - .5);
					} else {
						let e = g * g + _ * _;
						if (e >= 1) continue;
						let t = Math.sqrt(e), n = Math.atan2(_, g), r = smooth(clamp((e - .01) * 12)), i = .5 + .5 * Math.cos(6 * Math.PI * t - n + v), a = .5 + .5 * Math.cos(18 * n - 13 * t + v), o = a ** 4;
						y = 1 - smooth(clamp((e - .75) * 4)), b = .35 + r * (.15 * i + .025 * a), x = .87 - r * (.52 * o + .13 * (1 - i)), S = .97 - .15 * r * (1 - i), C = -.045 * r * i;
					}
					X += y * (b - X), Y += y * (x - Y), Q += y * (S - Q), Z += y * (i.roughness + C - Z);
				}
			};
			case `zebrafur`:
			case `leopardfur`:
			case `giraffefur`: return () => {
				let e = Se(G, K), r = Ce(G, K), i = G * 40, o = K * 32, s = Math.floor(i), c = Math.floor(o), l = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = s + t, r = c + e, a = ((r + 32) % 32 * 40 + (n + 40) % 40) * 4, u = i - n - we[a], d = o - r - we[a + 1], f = (u * we[a + 2] + d * we[a + 3]) / .58, p = (d * we[a + 2] - u * we[a + 3]) / .13, m = smooth(clamp(1 - f * f - p * p));
					l += (1 - l) * m;
				}
				if (t === `zebrafur`) {
					let t = .42 * Math.sin(n * 2 * K + a) + .75 * (e - .5), r = n * (8 * G + t), i = 1.65 * Math.sin(n * 2 * K - a);
					Y = .025 + .94 * smooth(clamp((Math.cos(r) + i * Math.cos(r * .5 + .3 * Math.sin(n * K + a)) + .13 + .16 * (e - .5)) / .26));
				} else if (t === `leopardfur`) {
					let t = 5 * G + .12 * Math.sin(n * 3 * K + a), r = 5 * K + .12 * Math.sin(n * 2 * G - a), i = Math.floor(t), o = Math.floor(r), s = 0, c = 0;
					for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
						let a = i + n, l = o + e, u = ((l + 5) % 5 * 5 + (a + 5) % 5) * 7, d = t - a - A[u], f = r - l - A[u + 1], p = (d * A[u + 2] + f * A[u + 3]) * A[u + 4], m = (f * A[u + 2] - d * A[u + 3]) * A[u + 5], h = p * p + m * m, g = h * (1 + (.18 * p * m + .16 * p) / (1 + h)), _ = 1 - smooth(clamp((g - .72) / .28)), v = smooth(clamp((g - .25) / .2)), y = smooth(clamp((p - .35) / .28)) * (1 - smooth(clamp((m * m - .025) / .12))), b = smooth(clamp((-m - .48) / .25)) * (1 - smooth(clamp((p * p - .015) / .065))), x = _ * v * (1 - y) * (1 - b), S = (1 - v) * (.65 + .25 * A[u + 6]);
						s += (1 - s) * x, c += (1 - c) * S * _;
					}
					Y = (.88 - .22 * c + .055 * (e - .5)) * (1 - .96 * s);
				} else {
					let t = 6 * G + .13 * Math.sin(n * 2 * K + a), r = 6 * K + .13 * Math.sin(n * 3 * G - a), i = Math.floor(t), o = Math.floor(r);
					Y = .95;
					for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
						let s = i + a, c = o + n, l = ((c + 6) % 6 * 6 + (s + 6) % 6) * 27, u = t - s - Te[l], d = r - c - Te[l + 1], f = smooth(clamp((1.21 - u * u) / .21)) * smooth(clamp((1.21 - d * d) / .21));
						for (let e = 0; e < 8; e++) {
							let t = l + 3 + e * 3, n = Te[t + 2] - u * Te[t] - d * Te[t + 1];
							f *= smooth(clamp((n - .045) / .055));
						}
						Y += f * (.12 + .2 * Te[l + 2] + .055 * e - Y);
					}
				}
				Y += .018 * (l - .5) + .012 * (r - .5), X = .28 + .24 * l + .035 * r, Z += .07 * (l - .5) + .025 * (r - .5), Q = .985 + .012 * l;
			};
			case `braincoral`: return () => {
				let e = n * G + .17 * Math.sin(n * K + a), t = n * K + .17 * Math.sin(n * G - a), r = Pt(G, K), i = 0;
				for (let n = 0; n < 6; n++) {
					let r = n * 4;
					i += Ft[r + 3] * Math.sin(Ft[r] * e + Ft[r + 1] * t + Ft[r + 2]);
				}
				let o = Math.exp(-24 * i * i), s = Math.exp(-6 * i * i);
				Y = .13 + .55 * o + .11 * s + .04 * r, X = .16 + .43 * o + .12 * s + .009 * r, Z += .06 * (1 - o) + .015 * (r - .5), Q = .57 + .39 * s;
			};
			case `starcoral`: return () => {
				let e = G * 6, t = K * 6, n = Math.floor(e), r = Math.floor(t), a = Pt(G, K);
				Y = .2 + .025 * a, X = .16 + .006 * a, Q = .72;
				for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = r + a, l = ((c + 6) % 6 * 6 + (s + 6) % 6) * 31, u = e - s - B[l], d = t - c - B[l + 1], f = B[l + 2], p = B[l + 3], m = (u * f + d * p) * B[l + 4], h = (d * f - u * p) * B[l + 5], g = m * m + h * h;
					if (g >= 1) continue;
					let _ = smooth(clamp((1 - g) / .25)), v = Math.exp(-40 * g), y = Math.exp(-45 * (g - .65) * (g - .65)), b = 0;
					for (let e = 0; e < 12; e++) {
						let t = B[l + 7 + e * 2], n = B[l + 8 + e * 2], r = m * t + h * n, i = h * t - m * n, a = smooth(clamp((r - .16) / .12)) * Math.exp(-700 * i * i);
						b += (1 - b) * a;
					}
					let x = .43 + .12 * B[l + 6] + .19 * y + .15 * b - .27 * v, S = .29 + .18 * y + .16 * b - .19 * v;
					Y += _ * (x - Y), X += _ * (S - X), Z += _ * (i.roughness + .055 * v - Z), Q += _ * (.88 + .07 * y - .42 * v - Q);
				}
			};
			case `seasponge`: return () => {
				let e = G + .07 * Math.sin(n * 3 * K + a), t = K + .06 * Math.sin(n * 2 * e - a), r = fract(e) * 7, i = fract(t) * 7, o = Math.floor(r), s = Math.floor(i), c = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = o + t, a = s + e, l = (a + 7) % 7 * 7 + (n + 7) % 7;
					for (let e = 0; e < 4; e++) {
						let t = (l * 4 + e) * 7;
						if (V[t + 6] === 0) continue;
						let o = r - n - V[t], s = i - a - V[t + 1], u = V[t + 2], d = V[t + 3], f = (o * u + s * d) * V[t + 4], p = (s * u - o * d) * V[t + 5], m = f * f + p * p;
						if (m >= 1) continue;
						let h = smooth(clamp((1 - m) / .8));
						c += (1 - c) * h;
					}
				}
				let l = It(G, K) - .5, u = Math.exp(-110 * l * l), d = Pt(G, K), f = c * (1 - .42 * u);
				Y = .12 + .63 * f + .055 * d, X = .12 + .57 * f + .012 * d * c, Z += .035 * (1 - f) + .01 * (d - .5), Q = .48 + .48 * f;
			};
			case `lotusleaf`:
			case `bananaleaf`:
			case `fernleaf`: return () => {
				let e = G * 3, r = K * 3, a = Math.floor(e), o = Math.floor(r);
				Y = .12, X = .08, Q = .68;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = a + c, u = o + s, d = ((u + 3) % 3 * 3 + (l + 3) % 3) * jt, f = e - l - z[d], p = r - u - z[d + 1], m = z[d + 2], h = z[d + 3], g = (f * m + p * h) * z[d + 4], _ = (p * m - f * h) * z[d + 5], v = z[d + 6], y, b = 0, x;
					if (t === `fernleaf`) {
						if (g * g + _ * _ > 1.5) continue;
						y = smooth(clamp((1 - g * g / .81 - _ * _ / .0016) / .35)), b = y;
						for (let e = 0; e < 14; e++) {
							let t = Mt[e * 3 + 1], n = _ * t * Mt[e * 3 + 2], r = (g - Mt[e * 3] - .3 * _ * t) / .043, i = (2 * n - 1) * (2 * n - 1) + r * r;
							if (i >= 1) continue;
							let a = smooth(clamp((1 - i) / .35)), o = Math.exp(-10 * r * r), s = (.5 + .5 * Math.cos(42 * n - 7 * r)) ** 8, c = a * (.78 * o + .22 * s);
							y += (1 - y) * a, b += (1 - b) * c;
						}
						x = y;
					} else {
						let e = g * g + _ * _ * (t === `bananaleaf` ? 1 + .45 * g * g : 1);
						if (e >= 1) continue;
						if (y = smooth(clamp((1 - e) / .24)), x = (1 - e) * (1 - e), t === `lotusleaf`) {
							for (let e = 0; e < 12; e++) {
								let t = z[d + 7 + e * 2], n = z[d + 8 + e * 2], r = g * t + _ * n, i = _ * t - g * n, a = smooth(clamp((r - .03) / .1)) * Math.exp(-900 * i * i);
								b += (1 - b) * a;
							}
							let t = Math.exp(-110 * e);
							b += (1 - b) * t;
						} else {
							let e = Math.exp(-180 * _ * _), t = Math.cos(n * (9 * g - 2.4 * Math.sqrt(_ * _ + 4e-4))), r = _ * _ / (_ * _ + .006) * (.5 + .5 * t) ** 8;
							b = e + (1 - e) * .7 * r;
						}
					}
					Y += y * (.5 + .18 * v + .12 * b - Y), X += y * (.26 + .13 * x + .14 * b - X), Z += y * (i.roughness + .035 * (1 - b) - Z), Q += y * (.9 + .08 * x - Q);
				}
			};
			case `rice`:
			case `sesame`:
			case `coffeebeans`: return () => {
				let e = G * Ot, r = K * Ot, a = Math.floor(e), o = Math.floor(r), s = kt ? kt(G, K) : 0;
				Y = t === `rice` ? .26 : t === `sesame` ? .19 : .12, X = .08, Q = .57;
				for (let c = -1; c <= 1; c++) for (let l = -1; l <= 1; l++) {
					let u = a + l, d = o + c, f = (u + Ot) % Ot, p = ((d + Ot) % Ot * Ot + f) * 7, m = e - u - R[p], h = r - d - R[p + 1], g = R[p + 2], _ = R[p + 3], v = (m * g + h * _) * R[p + 4], y = (h * g - m * _) * R[p + 5], b = R[p + 6], x;
					if (t === `rice`) x = v * v + y * y * (1 + .8 * v * v);
					else if (t === `sesame`) {
						let e = 1 + .65 * v;
						x = v * v + y * y * e * e;
					} else x = v * v + y * y * (1 + .12 * v);
					if (x >= 1) continue;
					let S = smooth(clamp((1 - x) / .32)), C = (1 - x) * (1 - x), w, ee, T, te;
					if (t === `rice`) {
						let e = .5 + .5 * Math.cos(14 * y + .7 * v * v);
						w = .75 + .16 * b + .035 * e, ee = .28 + .32 * C + .025 * C * e, T = i.roughness + .04 * (1 - C), te = .87 + .1 * C;
					} else if (t === `sesame`) {
						let e = Math.exp(-12 * y * y) * C, t = .5 + .5 * Math.sin(17 * v + 5 * y + b * n);
						w = .58 + .2 * b + .07 * e + .025 * t, ee = .24 + .2 * C + .23 * e, T = i.roughness + .05 * (1 - e), te = .86 + .11 * C;
					} else {
						let e = y - .16 * Math.sin(2.8 * v + b - .5), t = Math.exp(-e * e / .012) * C, n = .55 * s + .45 * b;
						w = .4 + .3 * n + .1 * C - .26 * t, ee = .28 + .4 * C - .3 * t + .018 * s * C, T = i.roughness + .11 * n + .1 * t, te = .89 + .08 * C - .32 * t;
					}
					Y += S * (w - Y), X += S * (ee - X), Z += S * (T - Z), Q += S * (te - Q);
				}
			};
			case `malachite`:
			case `agate`: return () => {
				let e = n * (t === `malachite` ? 3 : 1) * G + Tt, r = n * 3 * K + Et, i = e + .28 * Math.sin(r), a = r + .18 * Math.sin(e), o = 1 - .5 * (Math.cos(i) + Math.cos(a)) + (t === `agate` ? .22 * (1 - Math.cos(2 * i - a)) : 0), s = .5 + .5 * Math.cos(n * (3 * o + .1 * Math.sin(i) * Math.sin(a))), c = Ct(G, K);
				Y = .12 + .8 * s + .035 * c, X = .48 + .07 * s + .002 * c, Z += .045 * (1 - s) + .012 * c, Q = .985 + .015 * s;
			};
			case `lapislazuli`: return () => {
				let e = Math.sin(n * (G + K) + Tt) + .22 * Math.sin(n * 3 * K + Et), t = Math.sin(n * (2 * G - K) + Et) + .18 * Math.sin(n * 2 * K + Tt), r = smooth(clamp(1 - (e / .1) ** 2)), i = smooth(clamp(1 - (t / .065) ** 2)), a = smooth(clamp((wt(G, K) - .64) / .22)), o = 1 - (1 - r) * (1 - i) * (1 - .8 * a), s = Ct(G, K);
				Y = .1 + .12 * s + .76 * o, X = .5 + .009 * s + .045 * o, Z += .04 * s + .13 * o, Q = .988 + .012 * o;
			};
			case `basalt`: return () => {
				let e = G * 6, t = K * 8, n = Math.floor(t), r = vt(G, K);
				Y = .08 + .035 * r, X = .1 + .008 * r, Q = .59;
				for (let i = -1; i <= 1; i++) {
					let a = n + i, o = (a + 8) % 8, s = o % 2 * .5, c = Math.floor(e - s);
					for (let n = -1; n <= 1; n++) {
						let i = c + n, l = (i + 6) % 6, u = (o * 6 + l) * 4, d = e - i - s - .5, f = t - a - .5, p = L[u], m = L[u + 1], h = L[u + 2], g = L[u + 3], _ = smooth(clamp((p - d) / .065)) * smooth(clamp((p + d) / .065)) * smooth(clamp((m - .5 * d - .75 * f) / .065)) * smooth(clamp((m + .5 * d + .75 * f) / .065)) * smooth(clamp((h + .5 * d - .75 * f) / .065)) * smooth(clamp((h - .5 * d + .75 * f) / .065)), v = 1 - .6 * d * d - .6 * f * f;
						Y += _ * (.28 + .18 * g + .06 * r), X += _ * (.52 + .08 * g + .07 * v), Q += .4 * _;
					}
				}
				Z += .08 * (1 - Q) + .025 * (r - .5);
			};
			case `scoria`:
			case `obsidian`: return () => {
				let e = yt, n = G * e, r = K * bt, i = Math.floor(n), a = Math.floor(r), o = vt(G, K), s = 0, c = 0, l = 0;
				for (let o = -1; o <= 1; o++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + o, p = (d + e) % e, m = ((f + bt) % bt * e + p) * 7, h = n - d - L[m], g = r - f - L[m + 1], _ = L[m + 4], v = L[m + 5], y = (_ * h + v * g) / L[m + 2], b = (-v * h + _ * g) / L[m + 3], x = y * y + b * b;
					if (x >= 1) continue;
					let S, C;
					if (t === `scoria`) S = smooth(clamp((.7 - x) / .7)), C = smooth(clamp((x - .42) / .18)) * smooth(clamp((1 - x) / .2));
					else {
						S = smooth(1 - x);
						let e = (y + .36 - 1.2 * b * b) / .08;
						C = smooth(clamp(1 - e * e)) * smooth(clamp((1 - x) / .25));
					}
					s += (1 - s) * S, c += (1 - c) * C, l += (1 - l) * S * L[m + 6];
				}
				t === `scoria` ? (Y = .36 + .09 * o - .23 * s + .16 * c + .04 * l, X = .48 + .012 * o - .32 * s + .15 * c, Z += .045 * s - .035 * c + .015 * (o - .5), Q = .98 - .36 * s + .015 * c) : (Y = .15 + .035 * o + .14 * s + .28 * c + .035 * l, X = .5 + .003 * o - .2 * s + .1 * c, Z += .08 * s + .1 * c + .012 * o, Q = 1 - .13 * s);
			};
			case `corrugatedcardboard`:
			case `creasedpaper`:
			case `layeredpaper`: return () => {
				let e = mt(G * 8, K * 8), r = G * 24, i = K * 32, a = Math.floor(r), o = Math.floor(i), s = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = a + t, c = o + e, l = ((c % 4 + 4) % 4 * 3 + (n % 3 + 3) % 3) * 5, u = r - n - ht[l], d = i - c - ht[l + 1], f = u * ht[l + 2] + d * ht[l + 3], p = d * ht[l + 2] - u * ht[l + 3], m = clamp(1 - (f / ht[l + 4]) ** 2 - (p / .065) ** 2);
					s += m * m;
				}
				let c = .018 * e + .014 * s;
				if (t === `corrugatedcardboard`) {
					let t = .5 + .5 * Math.cos(n * G * 4);
					Y = .38 + .27 * t + .09 * e - .055 * s, X = .18 + .58 * t + c, Z += .025 * (e - .5) + .015 * s, Q = .68 + .3 * t - .025 * s;
				} else if (t === `creasedpaper`) {
					let t = Math.abs(fract(G * 2 + .5) - .5), n = Math.abs(fract(K * 2 + .5) - .5), r = clamp(1 - (t / .14) ** 2) ** 2, i = clamp(1 - (n / .14) ** 2) ** 2, a = clamp(1 - ((t - .25) / .1) ** 2) ** 2, o = clamp(1 - ((n - .25) / .1) ** 2) ** 2, l = 1 - (1 - r) * (1 - i), u = (1 - (1 - a) * (1 - o)) * (1 - l);
					Y = .7 + .1 * l - .14 * u + .07 * e - .04 * s, X = .4 + .3 * l - .16 * u + c, Z += .025 * (e - .5) - .035 * l + .025 * u, Q = .98 - .19 * u - .02 * s;
				} else {
					Y = .5, X = .2, Q = .98;
					for (let e = 0; e < 8; e++) {
						let t = .25 + e % 2 * .5, r = (Math.floor(e / 2) + .5) / 4, i = fract(G - t + .5) - .5, a = fract(K - r + .5) - .5, o = gt[e * 3 + 2], s = .008 * Math.sin(n * i * 12 + o) + .004 * Math.sin(n * i * 28 - o), c = smooth(clamp((.34 - Math.abs(i)) / .025)), l = smooth(clamp((.18 + s - Math.abs(a)) / .025)), u = c * l, d = 4 * l * (1 - l), f = 4 * c * (1 - c), p = d * c + f * l * (1 - d);
						X += u * (gt[e * 3] - X), Y += u * (gt[e * 3 + 1] - Y), Q += u * (.98 - Q), X -= .035 * p, Y -= .075 * p, Q -= .18 * p;
					}
					X += c, Y += .07 * e - .045 * s, Z += .025 * (e - .5) + .015 * s, Q -= .02 * s;
				}
			};
			case `cactus`: return () => {
				let e = G * 8, t = K * 8, r = Math.floor(e), i = Math.floor(t), a = .5 - .5 * Math.cos(n * e), o = lt(G, K), s = 0, c = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let o = r + a, l = i + n, u = (o + 8) % 8, d = ((l + 8) % 8 * 8 + u) * 18, f = e - o - .5, p = t - l - .5 - ft[d + 1];
					if (f * f + p * p > .14) continue;
					let m = clamp(1 - f * f / .0196 - p * p / .0169), h = ft[d];
					s += m * m;
					for (let e = 0; e < 8; e++) {
						let t = ft[d + 2 + e * 2], n = ft[d + 3 + e * 2], r = f * t + p * n, i = p * t - f * n, a = smooth(clamp((r - .09) / .055)) * smooth(clamp((h - r) / .085)), o = clamp(1 - i * i / 225e-6);
						c += a * o * o;
					}
				}
				Y = .2 + .47 * a + .045 * o + .18 * s - .08 * c, X = .18 + .49 * a + .065 * s - .025 * c + .004 * o, Z += .12 * s + .055 * c + .025 * (o - .5), Q = .83 + .16 * a - .08 * s - .035 * c;
			};
			case `pinecone`: return () => {
				let e = G * 8, t = K * 8, r = Math.floor(t), i = lt(G, K);
				Y = .08 + .025 * i, X = .12, Q = .58;
				for (let a = 1; a >= -1; a--) {
					let o = r + a, s = (o + 8) % 8, c = s % 2 * .5, l = Math.floor(e - c);
					for (let r = -1; r <= 1; r++) {
						let a = l + r, u = (a + 8) % 8, d = ft[s * 8 + u], f = e - a - c - .5, p = t - o - .5, m = smooth(clamp((.68 + f - .55 * p) / .1)), h = smooth(clamp((.68 - f - .55 * p) / .1)), g = smooth(clamp((p + .78) / .12)), _ = smooth(clamp((.86 - p) / .12)), v = m * h * g * _;
						if (v === 0) continue;
						let y = smooth(clamp((p + .05) / .76)), b = smooth(clamp(1 - f * f / .36)), x = Math.cos(n * (19 * f + 1.8 * p * p + d)), S = .28 + .27 * y + .075 * b + .018 * d + .006 * x, C = .28 + .22 * d + .18 * y + .045 * x + .025 * i;
						Y += v * (C - Y), X += v * (S - X), Q += v * (.97 - Q);
					}
				}
				Z += .06 * (1 - Q) + .025 * (i - .5);
			};
			case `corncob`: return () => {
				let e = G * 12, t = K * 8, n = Math.floor(e), r = ft[Math.floor(t) * 12 + n], i = (fract(e) - .5) / (.445 + .015 * r), a = (fract(t) - .5) / (.46 + .015 * r), o = clamp(1 - i * i * i * i - a * a), s = smooth(clamp(o / .28)), c = smooth(o), l = lt(G, K);
				Y = .13 + s * (.36 + .15 * r + .21 * c + .025 * l), X = .09 + s * (.24 + .4 * c + .025 * r), Z += .14 * (1 - s) - .055 * c + .015 * (l - .5), Q = .55 + .44 * s;
			};
			case `wood`: return () => {
				let e = noise(G, K, 4, 2, r ^ 71), t = .5 + .5 * Math.sin(n * (12 * G + .65 * e) + a), i = (.5 + .5 * Math.sin(n * (40 * G + e) + a)) ** 12;
				Y = clamp(.22 + .6 * t + .16 * q - .2 * i), X = .65 * t + .15 * q - .18 * i, Z += .15 * i + .08 * (q - .5), Q = 1 - .15 * i;
			};
			case `brick`: return () => {
				let e = Math.floor(K * 8), t = fract(G * 4 + e % 2 * .5), n = fract(K * 8), a = smooth(clamp((Math.min(t, 1 - t, n * .5, (1 - n) * .5) - .014) / .045));
				Y = .25 + .42 * hash(Math.floor(G * 4 + e % 2 * .5) % 4, e, r) + .2 * q, X = a * (.75 + .15 * q + .1 * J), $ = 1 - a, Z += .09 * $ + .05 * (q - .5), Q = .65 + .35 * a;
			};
			case `stone`: return () => {
				let e = noise(G + .12 * Kt, K, 8, 8, r ^ 131);
				Y = clamp(.1 + .65 * e + .3 * q), X = .65 * e + .25 * q + .1 * J, Z += .1 * (q - .5), Q = .8 + .2 * smooth(X);
			};
			case `metal`: return () => {
				let e = noise(G, K, 4, 64, r ^ 313), t = (.5 + .5 * Math.sin(n * K * 48 + a)) ** 16;
				Y = .4 + .38 * e + .12 * Kt - .1 * t, X = .7 * e - .15 * t, Z += .18 * e + .08 * t, Q = 1 - .04 * t;
			};
			case `fabric`: return () => {
				let e = G * 12, t = K * 12, r = Math.sin(Math.PI * fract(e)) ** 2, i = Math.sin(Math.PI * fract(t)) ** 2, o = (Math.floor(e) + Math.floor(t)) % 2 == 0, s = o ? r * (.6 + .4 * i) : i * (.6 + .4 * r), c = .5 + .5 * Math.sin(n * (o ? G : K) * 48 + a);
				Y = .22 + .48 * s + .14 * q + .08 * c, X = .8 * s + .06 * c + .08 * q, Z += .04 * (q - .5), Q = .68 + .32 * s;
			};
			case `marble`: return () => {
				let e = noise(G, K, 4, 4, r ^ 997), t = Math.exp(-Math.abs(Math.sin(n * (3 * G + 2 * K + .8 * e) + a)) * 16);
				Y = clamp(.9 + .1 * Kt - .85 * t), X = .3 * Kt - .2 * t + .05 * q, Z += .1 * t + .04 * (q - .5), Q = 1 - .06 * t;
			};
			case `concrete`: return () => {
				let e = fract(G * 3), t = fract(K * 3), i = 1 - smooth(clamp((Math.min(e, 1 - e, t, 1 - t) - .02) / .035)), a = hash(Math.floor(fract(G) * 40), Math.floor(fract(K) * 40), r);
				Y = .28 + .5 * a * (1 - i) + .12 * q, X = (1 - i) * (.65 + .25 * a) + .05 * q, Z += .14 * i + .06 * (a - .5), Q = .62 + .38 * (1 - i);
			};
			case `tiles`: return () => {
				let e = fract(G * 5), t = fract(K * 5), i = smooth(clamp((Math.min(e, 1 - e, t, 1 - t) - .018) / .028));
				Y = .42 + .4 * hash(Math.floor(G * 5) % 5, Math.floor(K * 5) % 5, r) + .08 * q, X = i * (.82 + .1 * q), $ = 1 - i, Z += .42 * $ + .04 * (q - .5), Q = .58 + .42 * i;
			};
			case `elephanthide`: return () => {
				let e = te(G, K), t = T(G, K), r = .5 + .5 * Math.cos(n * (5 * G + .65 * Math.sin(n * 2 * K + a) + 1.1 * e)), i = .5 + .5 * Math.cos(n * (4 * K + .5 * Math.sin(n * 3 * G - a) - .8 * e)), o = r ** 22, s = i ** 24, c = 1 - (1 - o) * (1 - s), l = (r ** 7 - o + i ** 8 - s) * .5, u = (.5 + .5 * Math.cos(n * (21 * G + 13 * K + 1.8 * e) + a)) ** 16;
				Y = .65 - .4 * c - .055 * u + .035 * t, X = .63 - .39 * c + .055 * l - .035 * u + .008 * t, Z += .035 * c + .025 * (t - .5), Q = .98 - .23 * c - .025 * u;
			};
			case `ostrichleather`: return () => {
				let e = G * 6, t = K * 6, n = Math.floor(e), r = Math.floor(t), i = (r * 6 + n) * 3, a = (e - n - E[i]) * E[i + 2], o = (t - r - E[i + 1]) * E[i + 2], s = a * a + o * o, c = smooth(clamp((1 - s) / .2)), l = smooth(clamp(1 - s / .12)), u = 1 + .18 * (a * a * a - 3 * a * o * o), d = s < 1 ? c * s * Math.exp(-(((s - .43) / .22) ** 2)) * 2 * u : 0, f = T(G, K);
				Y = .57 + .075 * f + .12 * d - .19 * l, X = .43 + .018 * f + .18 * d - .13 * l, Z += .035 * (f - .5) - .035 * d + .04 * l, Q = .985 - .17 * l - .035 * d;
			};
			case `sharkskin`: return () => {
				let e = G * 18, t = K * 24, n = Math.floor(t), r = T(G, K);
				Y = .3 + .025 * r, X = .26 + .008 * r, Q = .79;
				for (let r = -1; r <= 1; r++) {
					let i = n + r, a = (i % 24 + 24) % 24, o = a % 2 * .5, s = Math.floor(e - o);
					for (let n = -1; n <= 1; n++) {
						let r = s + n, c = (r % 18 + 18) % 18, l = ne[a * 18 + c], u = (t - i - .5) / .78;
						if (u <= -1 || u >= 1) continue;
						let d = (.39 + .04 * l) * (1 - .45 * u), f = (e - r - o - .5) / d, p = f * f + u * u, m = smooth(clamp((1 - p) / .22));
						if (m === 0) continue;
						let h = smooth(clamp(1 - p)), g = Math.exp(-(((f + .48) / .075) ** 2)) + Math.exp(-((f / .075) ** 2)) + Math.exp(-(((f - .48) / .075) ** 2)), _ = smooth(clamp((p - .56) / .2));
						Y += m * (.52 + .1 * l + .045 * g * h - .055 * _ - Y), X += m * (.4 + .065 * h + .055 * g * h - .025 * _ - X), Q += m * (.98 - .07 * _ - Q);
					}
				}
				Z += .025 * (r - .5) + .035 * (1 - Q);
			};
			case `leather`: return () => {
				let t = smooth(clamp(1 - wrappedFeature(G, K, 14, r ^ 81) * 1.55));
				Y = .24 + .52 * t + .12 * q, X = .12 + .72 * t + .06 * q, Z += .16 * (1 - t) + .04 * (q - .5), Q = .55 + .45 * t;
			};
			case `suede`: return () => {
				let e = noise(G, K, 5, 7, r ^ 15639), t = noise(G + .012 * e, K + .004 * e, 96, 24, r ^ 24113), n = smooth(clamp((noise(G, K, 80, 80, r ^ 31331) - .57) / .35));
				Y = .23 + .36 * e + .25 * t + .1 * q - .08 * n, X = .35 + .075 * t + .025 * e - .045 * n, Z += .075 * (t - .5) + .035 * (e - .5), Q = .985 - .035 * n + .01 * t;
			};
			case `snakeskin`: return () => {
				let e = G * 10, t = K * 12, n = Math.floor(t), r = 0, i = 0, a = 0, o = 0;
				for (let s = -1; s <= 1; s++) {
					let c = n + s, l = (c % 2 + 2) % 2 * .5, u = Math.floor(e - l);
					for (let n = -1; n <= 1; n++) {
						let s = u + n, d = (s % 10 + 10) % 10, f = (c % 12 + 12) % 12, p = Ne[f * 10 + d], m = e - s - l - .5, h = t - c - .5;
						if (Math.abs(m) >= .48 || Math.abs(h) >= .64) continue;
						let _ = clamp(1 - (Math.sqrt(m * m + .0016) / (.46 + .02 * p) + Math.sqrt(h * h + .0016) / (.61 + .03 * p)));
						if (_ === 0) continue;
						let v = smooth(clamp(_ / .18)), y = _ * _, b = y * Math.exp(-m * m * 180);
						r += v, i += y, a += b, o += v * p;
					}
				}
				Y = .13 + .4 * r + .2 * o + .1 * i + .04 * q, X = .04 + .64 * r + .2 * i + .065 * a + .012 * q, Z += .12 * (1 - r) - .045 * i + .045 * (q - .5), Q = .57 + .41 * r + .015 * i;
			};
			case `crocodile`: return () => {
				let e = G * 4, t = K * 6, i = Math.floor(e), o = Ne[Math.floor(t) * 4 + i], s = (fract(e) - .5) / (.445 + .025 * o), c = (fract(t) - .5) / (.445 + .02 * o), l = clamp(1 - s * s * s * s - c * c * c * c), u = smooth(clamp(l / .36)), d = noise(G, K, 9, 11, r ^ 12115), f = (.5 + .5 * Math.sin(n * (19 * G + 13 * K + 1.7 * d) + a)) ** 12;
				Y = .12 + u * (.37 + .22 * o + .1 * q - .12 * f), X = .035 + u * (.64 + .17 * l * l + .035 * o - .065 * f), Z += .13 * (1 - u) + u * (.055 * f + .04 * (q - .5)), Q = .53 + u * (.46 - .055 * f);
			};
			case `fishscales`:
			case `feathers`: return () => {
				let e = G * Ue, r = K * We, i = Math.floor(r);
				Y = .12 + .045 * q, X = .23, Q = .76;
				for (let a = -1; a <= 1; a++) {
					let o = i + a, s = (o % We + We) % We, c = s % 2 * .5, l = Math.floor(e - c);
					for (let i = -1; i <= 1; i++) {
						let a = l + i, u = (a % Ue + Ue) % Ue, d = (s * Ue + u) * 2, f = Ge[d], p = r - o - .5, m = e - a - c - .5 - Ge[d + 1] * p, h, g, _;
						if (t === `fishscales`) {
							let e = m * m / .4356 + p * p / .6724;
							if (h = smooth(clamp((1 - e) / .18)), h === 0) continue;
							let t = smooth(clamp(1 - e)), r = smooth(clamp((e - .48) / .2)) * smooth(clamp((1 - e) / .15)) * smooth(clamp((p + .12) / .4)), i = Math.cos(n * (6 * e + .15 * f));
							g = .39 + .2 * f + .13 * t + .1 * r + .045 * i, _ = .37 + .12 * t + .11 * r + .012 * i * t;
						} else {
							let e = p / 1.08;
							if (e <= -1 || e >= 1) continue;
							let t = 1 - e * e, r = t * t - m * m / .2304;
							if (h = smooth(clamp(r / .16)), h === 0) continue;
							let i = smooth(clamp(r)), a = smooth(clamp(1 - m * m / .0025)), o = Math.cos(n * (18 * p - 14 * Math.sqrt(m * m + 4e-4))), s = smooth(clamp((e + .45) / 1.1));
							g = .36 + .22 * f + .1 * i - .12 * s + .08 * a + .065 * o, _ = .35 + .1 * i + .075 * a + .013 * o * i;
						}
						Y += h * (g - Y), X += h * (_ - X), Q += h * (.98 - Q);
					}
				}
				Z += .045 * (1 - Q) + .025 * (q - .5);
			};
			case `tortoiseshell`: return () => {
				let e = G * 6, t = K * 6, i = Math.floor(e), a = Math.floor(t), o = noise(G, K, 19, 23, r ^ 18919);
				Y = .045 + .025 * q, X = .22, Q = .72;
				for (let r = -1; r <= 1; r++) for (let s = -1; s <= 1; s++) {
					let c = i + s, l = a + r, u = (c + 6) % 6, d = ((l + 6) % 6 * 6 + u) * 27, f = e - c - Ke[d], p = t - l - Ke[d + 1], m = 1, h = 1;
					for (let e = 0; e < 8; e++) {
						let t = d + 3 + e * 3, n = Ke[t + 2], r = n - f * Ke[t] - p * Ke[t + 1];
						if (m *= smooth(clamp((r - .018) / .085)), h *= smooth(clamp(r / n)), m === 0) break;
					}
					if (m === 0) continue;
					let g = Ke[d + 2], _ = Math.cos(n * (5 * h + .12 * g)), v = .28 + .25 * g + .22 * o + .09 * h + .045 * _;
					Y += m * (v - Y), X += m * (.37 + .2 * h + .012 * _ * h - X), Q += m * (.98 - Q);
				}
				Z += .06 * (1 - Q) + .025 * (q - .5);
			};
			case `sand`: return () => {
				let e = noise(G, K, 3, 3, r ^ 17), t = .5 + .5 * Math.sin(n * (K * 7 + .35 * e) + a), i = noise(G, K, 48, 48, r ^ 20973);
				Y = .3 + .48 * t + .18 * i, X = .72 * t + .22 * i, Z += .06 * (i - .5), Q = .82 + .18 * t;
			};
			case `rust`: return () => {
				let e = noise(G, K, 6, 6, r ^ 211), t = noise(G, K, 18, 18, r ^ 419), n = smooth(clamp((e * .7 + t * .3 - .32) / .28));
				Y = n, X = .25 + .45 * (1 - n) * t - .2 * n * e, Z += .22 * n + .05 * (t - .5), Q = .7 + .3 * (1 - n), qt = 1 - n;
			};
			case `snow`: return () => {
				let e = noise(G, K, 3, 3, r ^ 17), t = hash(Math.floor(fract(G) * 48), Math.floor(fract(K) * 48), r) ** 8;
				Y = clamp(.22 + .68 * e + .1 * t), X = .7 * e + .2 * t, Z += .22 * t - .06 * e, Q = .88 + .12 * e;
			};
			case `asphalt`:
			case `gravel`: return () => {
				let e = t === `asphalt`, i = e ? 40 : 12, a = G * i, o = K * i, s = Math.floor(a), c = Math.floor(o), l = 0, u = 0, d = 0, f = 0;
				for (let t = -1; t <= 1; t++) for (let p = -1; p <= 1; p++) {
					let m = s + p, h = c + t, g = (m % i + i) % i, _ = (h % i + i) % i, v = hash(g, _, r ^ 29873), y = hash(g, _, r ^ 27145) * n, b = Math.cos(y), x = Math.sin(y), S = a - m - .25 - .5 * hash(g, _, r), C = o - h - .25 - .5 * hash(g, _, r ^ 40503), w = e ? .22 + .21 * v : .46 + .17 * v, ee = .7 + .3 * hash(g, _, r ^ 20973), T = (S * b + C * x) / ee, te = C * b - S * x, E = Math.sqrt(T * T + te * te) + (q - .5) * (e ? .08 : .16), ne = smooth(clamp((w - E) / .16)), re = clamp(1 - E / w);
					l = Math.max(l, ne), f = Math.max(f, ne * (.65 + .35 * re)), u += ne * (.35 + .65 * v), d += ne;
				}
				let p = u / Math.max(1, d);
				e ? (Y = .06 + .58 * p + .1 * q + .06 * J, X = .58 * f + .18 * q + .24 * J, Z += .08 * (1 - l) + .1 * (J - .5), Q = .8 + .2 * l) : (Y = .04 + .8 * p + .08 * J, X = f * (.84 + .16 * q) + .025 * J, Z += .13 * (1 - l) + .1 * (J - .5), Q = .42 + .58 * l);
			};
			case `cobblestone`: return () => {
				let e = G + .012 * noise(G, K, 6, 8, r ^ 561), t = K + .009 * noise(G, K, 6, 8, r ^ 2323), n = Math.floor(fract(t) * 8), i = e * 6 + n % 2 * .5, a = fract(i), o = fract(t * 8), s = Math.abs(a - .5), c = Math.abs(o - .5) * .75, l = Math.max(0, s - .38), u = Math.max(0, c - .255), f = smooth(clamp((.12 - Math.sqrt(l * l + u * u) - .018) / .085)), p = hash((Math.floor(i) % 6 + 6) % 6, n, r), m = 1 - .65 * (s * s + c * c);
				Y = .05 + f * (.25 + .48 * p + .12 * q) + .05 * J, X = f * (.76 * m + .16 * q + .08 * J), Z += .17 * (1 - f) + .1 * (J - .5), Q = .45 + .55 * f;
			};
			case `bark`: return () => {
				let e = noise(G, K, 4, 6, r ^ 15127), t = noise(G + .035 * e, K, 18, 3, r ^ 33825), n = noise(G, K, 6, 18, r ^ 20883), i = smooth(clamp((t - .26) / .38)) * smooth(clamp((n - .18) / .22)), a = noise(G, K, 48, 12, r ^ 8571);
				Y = .05 + i * (.43 + .33 * a + .13 * J), X = i * (.58 + .3 * a + .12 * q), Z += .08 * (1 - i) + .1 * (J - .5), Q = .42 + .58 * i;
			};
			case `moss`: return () => {
				let e = noise(G, K, 4, 4, r ^ 7015), n = smooth(clamp(1 - wrappedFeature(fract(G + .025 * e), fract(K + .018 * e), 9, r ^ 25519) / .95)), i = noise(G, K, 18, 18, r ^ 37671), a = smooth(clamp((J - .25) / .5));
				Y = .09 + .46 * n + .24 * i + .19 * a, X = .65 * n + (.09 + .14 * n) * a + .12 * q, Z += .06 * (a - .5) - .08 * (1 - n), Q = .52 + .36 * n + .12 * a;
			};
			case `mud`: return () => {
				let e = noise(G, K, 4, 4, r ^ 29011), t = (G + .025 * e) * 7, n = (K + .025 * noise(G, K, 4, 4, r ^ 7993)) * 7, i = Math.floor(t), a = Math.floor(n), o = 4, s = 4;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 7 + 7) % 7, f = (u % 7 + 7) % 7, p = t - l - .3 - .4 * hash(d, f, r), m = n - u - .3 - .4 * hash(d, f, r ^ 40503), h = p * p + m * m;
					h < o ? (s = o, o = h) : h < s && (s = h);
				}
				let l = smooth(clamp((Math.sqrt(s) - Math.sqrt(o) - .025) / .13)), u = smooth(clamp((noise(G, K, 3, 3, r ^ 14561) - .25) / .5));
				Y = .04 + l * (.52 - .24 * u + .17 * q) + .04 * J, X = l * (.48 + .16 * (1 - o)) + (.07 * q + .03 * J) * (1 - .75 * u), Z -= .38 * u, Z += .1 * (1 - l) + .08 * (J - .5) * (1 - u), Q = .48 + .52 * l;
			};
			case `granite`: return () => {
				let e = G * 38, t = K * 38, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0, s = 4, c = 4;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = n + u, f = i + l, p = (d % 38 + 38) % 38, m = (f % 38 + 38) % 38, h = e - d - .3 - .4 * hash(p, m, r), g = t - f - .3 - .4 * hash(p, m, r ^ 40503), _ = h * h + g * g;
					_ < s ? (c = s, s = _) : _ < c && (c = _);
					let v = clamp(1 - _ / 1.44) ** 10, y = hash(p, m, r ^ 25643);
					a += v * (y < .24 ? .08 + y : .48 + .5 * y), o += v;
				}
				let l = a / Math.max(o, 1e-12), u = 1 - smooth(clamp((Math.sqrt(c) - Math.sqrt(s)) / .16));
				Y = clamp(.04 + .88 * l + .1 * (J - .5) - .07 * u), X = .35 * l + .17 * J - .12 * u, Z += .16 * (1 - l) + .06 * (J - .5), Q = .97 - .025 * u + .03 * J;
			};
			case `slate`: return () => {
				let e = noise(G, K, 5, 4, r ^ 16743), t = noise(G + .025 * e, K + .018 * e, 3, 22, r ^ 29723) * 5, n = (Math.floor(t) + smooth(clamp((fract(t) - .35) / .3))) / 5, i = noise(G, K, 12, 5, r ^ 4955), a = (1 - Math.abs(2 * fract(t) - 1)) ** 8 * smooth(clamp((i - .18) / .35));
				Y = .14 + .62 * n + .14 * J - .12 * a, X = .72 * n + .1 * J - .18 * a, Z += .1 * a + .1 * (J - .5), Q = .98 - .15 * a + .02 * J;
			};
			case `terrazzo`: return () => {
				let e = G * 9, t = K * 9, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + l, p = (d % 9 + 9) % 9, m = (f % 9 + 9) % 9, h = hash(p, m, r ^ 37499), g = hash(p, m, r ^ 13341) * n, _ = Math.cos(g), v = Math.sin(g), y = e - d - .3 - .4 * hash(p, m, r), b = t - f - .3 - .4 * hash(p, m, r ^ 40503), x = y * _ + b * v, S = b * _ - y * v, C = .75 + .25 * hash(p, m, r ^ 8623), w = Math.max(Math.abs(x) * C, Math.abs(S), (x * .65 + S * .76) * 1.1, (-x * .83 + S * .55) * 1.15), T = smooth(clamp((.26 + .18 * h - w) / .025));
					o = Math.max(o, T), s += T * (.08 + .7 * hash(p, m, r ^ 22815)), c += T;
				}
				let l = s / Math.max(c, 1e-12);
				Y = (.88 + .06 * q) * (1 - o) + o * l, X = .15 + .06 * o + .015 * q + .025 * J, Z += .055 * (1 - o) - .03 * o * l + .04 * (J - .5), Q = .98 + .015 * o + .005 * J;
			};
			case `denim`: return () => {
				let e = G * 24, t = K * 24, i = .5 + .5 * Math.cos(n * e), o = .5 + .5 * Math.cos(n * t), s = 1 - smooth(clamp((Math.abs(Math.sin(Math.PI * (e - t) / 4)) - .24) / .22)), c = .5 + .5 * Math.sin(n * (96 * G + .12 * q) + a), l = .5 + .5 * Math.sin(n * (96 * K + .12 * q) + a), u = c * (1 - s) + l * s, d = i * (1 - s) + o * s, f = noise(G, K, 24, 4, r ^ 27953);
				Y = .12 + .22 * d + .34 * s + .1 * u + .12 * f, X = .42 * d + .24 * (1 - s) + .06 * u + .08 * f, Z += .06 * (q - .5) + .04 * (1 - d), Q = .78 + .18 * d + .04 * u;
			};
			case `houndstooth`: return () => {
				let e = 32 * G, t = 32 * K, r = Math.floor(e) % 8, i = Math.floor(t) % 8, o = smooth(fract(e)), s = smooth(fract(t)), c = (r + 1) % 8, l = (i + 1) % 8, u = Oe[i * 8 + r], d = Oe[i * 8 + c], f = Oe[l * 8 + r], p = Oe[l * 8 + c], m = (u + (d - u) * o) * (1 - s) + (f + (p - f) * o) * s, h = .5 + .5 * Math.cos(n * (e - t) / 4), g = .5 + .5 * Math.cos(n * e), _ = .5 + .5 * Math.cos(n * t), v = g * h + _ * (1 - h), y = .5 + .25 * Math.cos(n * 96 * G + a) + .25 * Math.cos(n * 96 * K - a);
				Y = .025 + .88 * m + .045 * v + .03 * q, X = .2 + .19 * v + .025 * y + .02 * q, Z += .04 * (q - .5) + .025 * (1 - v), Q = .86 + .12 * v;
			};
			case `tartan`: return () => {
				let e = 2 * G, t = 2 * K, r = smooth(clamp((Math.cos(n * e) + .15) / .55)), i = smooth(clamp((Math.cos(n * t) + .15) / .55)), a = smooth(clamp((Math.cos(n * (e + .25)) - .96) / .04)), o = smooth(clamp((Math.cos(n * (t + .25)) - .96) / .04)), s = smooth(clamp((Math.cos(n * 2 * e) - .9) / .1)), c = smooth(clamp((Math.cos(n * 2 * t) - .9) / .1)), l = .13 + .35 * r + .36 * a + .1 * s, u = .13 + .35 * i + .36 * o + .1 * c, d = smooth(clamp(.5 + .8 * Math.cos(Math.PI * 64 * (G + K)))), f = .5 + .5 * Math.cos(n * 64 * G), p = .5 + .5 * Math.cos(n * 64 * K), m = f * d + p * (1 - d);
				Y = l * d + u * (1 - d) + .045 * m + .025 * q, X = .2 + .16 * m + .025 * q, Z += .04 * (q - .5) + .03 * (1 - m), Q = .85 + .13 * m;
			};
			case `damask`: return () => {
				let e = fract(2 * G + .5) - .5, t = fract(2 * K + .5) - .5, r = 1, i = 1;
				for (let n = 0; n < 12; n++) {
					let a = n * 6, o = e - ke[a], s = t - ke[a + 1], c = ke[a + 2], l = ke[a + 3], u = (o * c + s * l) * ke[a + 4], d = (s * c - o * l) * ke[a + 5], f = clamp(1 - u * u - d * d);
					r *= 1 - smooth(clamp(f / .28)), i *= 1 - f * f;
				}
				let o = 1 - r, s = 1 - i, c = .5 + .5 * Math.cos(n * 64 * G), l = .5 + .5 * Math.cos(n * 64 * K), u = .5 + .5 * Math.cos(n * (16 * G - 16 * K) + a), d = (c + l) * .5;
				Y = .19 + .48 * o + .08 * s + .07 * d + .025 * q, X = .18 + .3 * o + .13 * s + .025 * d + .015 * o * u, Z += .055 * (1 - o) - .035 * o * u + .025 * (q - .5), Q = .88 + .07 * o + .03 * d;
			};
			case `herringbone`: return () => {
				let e = 32 * G, t = 32 * K, i = Math.acos(.995 * Math.cos(n * 2 * G)) / Math.PI, o = smooth(clamp((.5 + .5 * Math.cos(n * (2 * i - 8 * K) + a) - .2) / .6)), s = .5 + .5 * Math.cos(n * e), c = .5 + .5 * Math.cos(n * t), l = s * (1 - o) + c * o, u = (.5 + .5 * Math.sin(n * 128 * G + a)) * (1 - o) + (.5 + .5 * Math.sin(n * 128 * K - a)) * o, d = noise(G, K, 16, 8, r ^ 15385);
				Y = .17 + .31 * o + .26 * l + .1 * u + .09 * d, X = .25 + .24 * l + .07 * o + .035 * u + .025 * d, Z += .055 * (q - .5) + .035 * (1 - l), Q = .84 + .12 * l + .025 * u;
			};
			case `tweed`: return () => {
				let e = 20 * G, t = 20 * K, i = smooth(clamp((Math.cos(n * e) + .45) / 1.25)), o = smooth(clamp((Math.cos(n * t) + .45) / 1.25)), s = smooth(clamp(.5 + .85 * Math.cos(Math.PI * (e + t)))), c = i * (1 - o + o * s), l = o * (1 - i + i * (1 - s)), u = c + l, d = c * noise(G, K, 20, 4, r ^ 15127) + l * noise(G, K, 4, 20, r ^ 28201), f = c * (.5 + .5 * Math.sin(n * (80 * G + .15 * q) + a)) + l * (.5 + .5 * Math.sin(n * (80 * K + .15 * q) - a)), p = G * 24, m = K * 24, h = Math.floor(p), g = Math.floor(m), _ = 0, v = .12 + .29 * u + .34 * d + .12 * f;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = h + t, i = g + e, a = (n % 24 + 24) % 24, o = (i % 24 + 24) % 24, s = hash(a, o, r ^ 11635), c = p - n - .25 - .5 * hash(a, o, r), l = m - i - .25 - .5 * hash(a, o, r ^ 23089), u = (s < .5 ? 0 : Math.PI / 2) + (s - .5) * .7, d = Math.cos(u), f = Math.sin(u), y = (c * d + l * f) / (.18 + .2 * s), b = (l * d - c * f) / .075, x = clamp(1 - y * y - b * b), S = x * x;
					_ += S, v += S * (.18 + .64 * hash(a, o, r ^ 32537) - v);
				}
				Y = v, X = .2 + .28 * u + .08 * i * o + .05 * f + .055 * _, Z += .05 * (q - .5) + .025 * _, Q = .77 + .19 * u + .025 * f;
			};
			case `seersucker`: return () => {
				let e = smooth(clamp((Math.cos(n * 4 * G) + .25) / .75)), t = .5 + .5 * Math.cos(n * 48 * G), i = .5 + .5 * Math.cos(n * 48 * K), o = .5 + .5 * Math.cos(Math.PI * 48 * (G + K)), s = t * o + i * (1 - o), c = .5 + .25 * Math.sin(n * 144 * G + a) + .25 * Math.sin(n * 144 * K - a), l = noise(G, K, 4, 4, r ^ 19513), u = .5 + .5 * Math.sin(n * (12 * K + .22 * Math.sin(n * 4 * G) + .3 * l) + a);
				Y = .71 - .39 * e + .12 * s + .055 * c + .04 * e * u, X = .22 + .035 * s + .008 * c + e * (.08 + .2 * u), Z += .045 * (q - .5) + .025 * e * (1 - u), Q = .96 - .07 * e * (1 - u) + .02 * s;
			};
			case `burlap`: return () => {
				let e = G * 10, t = K * 10, r = smooth(clamp((Math.cos(n * e) + .35) / 1.1)), i = smooth(clamp((Math.cos(n * t) + .35) / 1.1)), o = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (e + t)))), s = r * (1 - i + i * o), c = i * (1 - r + r * (1 - o)), l = s + c, u = .5 + .5 * Math.sin(n * (50 * G + .14 * q) + a), d = .5 + .5 * Math.sin(n * (50 * K + .14 * q) + a), f = s * u + c * d, p = r * i;
				Y = .04 + .65 * l + .14 * f + .1 * q * l, X = .58 * l + .2 * p + .08 * f + .04 * q, Z += .05 * (q - .5) + .025 * (1 - l), Q = .42 + .54 * l + .04 * f;
			};
			case `carpet`: return () => {
				let e = G * 24, t = K * 24, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0, l = 0;
				for (let u = -1; u <= 1; u++) for (let d = -1; d <= 1; d++) {
					let f = i + d, p = a + u, m = (f % 24 + 24) % 24, h = (p % 24 + 24) % 24, g = e - f - .35 - .3 * hash(m, h, r), _ = t - p - .35 - .3 * hash(m, h, r ^ 40503), y = clamp(1 - (g * g + _ * _)) ** 3, b = hash(m, h, r ^ 10571), x = hash(m, h, r ^ 26655) * n, S = (.5 + .5 * Math.sin(n * 3 * (g * Math.cos(x) + _ * Math.sin(x)) + b * n)) ** 4;
					o += y, s += y * b, c += y * S, l = Math.max(l, y * (.75 + .25 * b));
				}
				let u = 1 / Math.max(o, 1e-12), d = s * u, f = c * u;
				Y = .19 + .4 * d + .2 * l + .13 * f + .08 * q, X = .3 + .38 * l + .12 * f + .1 * q, Z += .04 * (q - .5) - .035 * f, Q = .7 + .22 * Math.sqrt(l) + .06 * f;
			};
			case `plaster`: return () => {
				let e = noise(G, K, 3, 3, r ^ 14241), t = (.5 + .5 * Math.sin(n * (3 * G + 2 * K + .7 * e) + a)) ** 10, i = noise(G, K, 18, 5, r ^ 21721), o = smooth(clamp((.32 - J) / .23));
				Y = .61 + .2 * e + .08 * i + .07 * t - .12 * o, X = .22 + .28 * e + .18 * t + .08 * i - .14 * o, Z += .1 * (J - .5) - .065 * t + .045 * o, Q = .98 - .1 * o - .025 * t;
			};
			case `terracotta`: return () => {
				let e = noise(G, K, 5, 5, r ^ 14871), t = noise(G + .04 * e, K, 12, 9, r ^ 32035), i = 1 - smooth(clamp((wrappedFeature(G, K, 28, r ^ 18541) - .04) / .19)), a = smooth(clamp((e - .5) / .3));
				Y = .37 + .46 * t + .15 * q - .18 * a - .17 * i, X = .35 + .14 * q + .12 * J - .3 * i, Z += .1 * (J - .5) + .07 * i - .04 * a, Q = .97 - .22 * i + .025 * J;
			};
			case `cork`: return () => {
				let e = G * 14, t = K * 14, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0, l = 0;
				for (let u = -1; u <= 1; u++) for (let d = -1; d <= 1; d++) {
					let f = i + d, p = a + u, m = (f % 14 + 14) % 14, h = (p % 14 + 14) % 14, g = e - f - .35 - .3 * hash(m, h, r), _ = t - p - .35 - .3 * hash(m, h, r ^ 40503), v = n * hash(m, h, r ^ 19745), y = g * Math.cos(v) + _ * Math.sin(v), b = _ * Math.cos(v) - g * Math.sin(v), S = clamp(1 - (.9 * y * y + 1.3 * b * b) / 1.21) ** 8, C = hash(m, h, r ^ 5931), w = (.5 + .5 * Math.sin(n * (5 * b + .3 * y) + n * C)) ** 12;
					o += S, s += S * C, l += S * w, c = Math.max(c, S);
				}
				let u = 1 / Math.max(o, 1e-12), d = s * u, f = l * u, p = 1 - smooth(clamp((c * u - .48) / .4));
				Y = .31 + .57 * d + .12 * q - .22 * p - .09 * f, X = .4 + .16 * d + .07 * J - .2 * p - .07 * f, Z += .07 * (J - .5) + .045 * p - .025 * d, Q = .97 - .18 * p - .08 * f;
			};
			case `studdedrubber`: return () => {
				let e = G * 6, t = K * 6, n = fract(e) - .5, a = fract(t) - .5, s = 1 - smooth(clamp((Math.sqrt(n * n + a * a) - .24) / .12)), c = qe[Math.floor(t) * 6 + Math.floor(e)], l = noise(G, K, 144, 144, r ^ 18867);
				Y = .24 + .16 * s + .06 * s * c + .05 * l, X = .16 + .66 * s + .002 * l, Z = i.roughness + .04 * (l - .5), Q = .84 + .16 * s;
			};
			case `groovedrubber`: return () => {
				let e = G * 12, n = 1 - smooth(clamp((Math.abs(fract(e) - .5) - .32) / .13)), a = Je[Math.floor(e)], o = noise(G, K, 144, 144, r ^ 28193);
				Y = .18 + .29 * n + .04 * n * a + .035 * o, X = .15 + .7 * n + .0015 * o, Z = i.roughness + .035 * (o - .5), Q = .7 + .3 * n;
			};
			case `recycledrubber`: return () => {
				let e = G * 48, t = K * 48, n = Math.floor(e), a = Math.floor(t), o = 0, s = 0;
				for (let r = -1; r <= 1; r++) for (let i = -1; i <= 1; i++) {
					let c = n + i, l = a + r, u = ((l + 48) % 48 * 48 + (c + 48) % 48) * 18, d = e - c - Ye[u], f = t - l - Ye[u + 1], p = 1;
					for (let e = 0; e < 5; e++) {
						let t = u + 3 + e * 3, n = Ye[t + 2] - d * Ye[t] - f * Ye[t + 1];
						p *= smooth(clamp(n / .14));
					}
					o += p, s += p * Ye[u + 2];
				}
				let c = 1 - Math.exp(-2 * o), l = noise(G, K, 144, 144, r ^ 15239);
				Y = .035 + .59 * c + .22 * s / (1 + o), X = .25 + .18 * c + .002 * l, Z = i.roughness - .06 * c + .02 * l, Q = .83 + .17 * c;
			};
			case `rubber`: return () => {
				let t = 1 - smooth(clamp((wrappedFeature(G, K, 44, r ^ 36435) - .08) / .55));
				Y = .19 + .38 * t + .19 * J + .1 * q, X = .19 + .49 * t + .15 * J + .06 * q, Z += .12 * (J - .5) - .045 * t, Q = .9 + .08 * t + .02 * J;
			};
			case `carbonfiber`: return () => {
				let e = 12 * (G + K), t = 12 * (K - G), r = .5 + .5 * Math.cos(n * e), i = .5 + .5 * Math.cos(n * t), o = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (e - t) / 2))), s = .5 + .5 * Math.sin(n * (4 * e + .08 * q) + a), c = .5 + .5 * Math.sin(n * (4 * t + .08 * q) + a), l = r * o + i * (1 - o), u = s * o + c * (1 - o);
				Y = .12 + .46 * l + .2 * u + .12 * q, X = .25 + .37 * l + .055 * u + .04 * q, Z += .065 * (q - .5) + .045 * (1 - l), Q = .88 + .1 * l + .02 * u;
			};
			case `diamondplate`: return () => {
				let e = G * 8, t = K * 8, n = fract(e) - .5, i = fract(t) - .5, a = (Math.floor(e) + Math.floor(t)) % 2 == 0 ? 1 : -1, o = (n + a * i) * Math.SQRT1_2, s = (i - a * n) * Math.SQRT1_2, l = smooth(clamp((1 - (Math.abs(o) / .48 + Math.abs(s) / .14)) / .24)), u = noise(G, K, 4, 64, r ^ 13793);
				Y = .35 + .25 * u + .29 * l + .07 * q, X = .08 + .78 * l + .025 * u, Z += .14 * (u - .5) - .075 * l, Q = .94 + .05 * l + .01 * q;
			};
			case `knurledmetal`: return () => {
				let e = smooth(.5 - .5 * Math.cos(n * 24 * (G + K))) * smooth(.5 - .5 * Math.cos(n * 24 * (G - K)));
				Y = .29 + .48 * e + .16 * q, X = .12 + .72 * e + .025 * q, Z += .1 * (q - .5) + .07 * (1 - e), Q = .85 + .14 * e;
			};
			case `engineturned`: return () => {
				let e = G * 6, t = K * 6, r = Math.floor(e), i = Math.floor(t), a = 0, o = 0, s = 0;
				for (let c = -1; c <= 1; c++) for (let l = -1; l <= 1; l++) {
					let u = r + l, d = i + c, f = (u % 6 + 6) % 6, p = (d % 6 + 6) % 6, m = e - u - .25 - p % 2 * .5, h = t - d - .5, g = m * m + h * h, _ = Math.max(0, 1 - g / .9025), v = _ * _, y = (p * 6 + f) * 2, b = Pe[y], x = .5 + .5 * Math.cos(n * (10 * g + b + .18 * m * h));
					a += v, o += v * x, s += v * Pe[y + 1];
				}
				o /= a, s /= a, Y = .35 + .34 * s + .22 * o + .04 * q, X = .44 + .07 * o + .025 * q, Z += .18 * (o - .5) + .12 * (s - .5), Q = .98 + .015 * o;
			};
			case `goldleaf`: return () => {
				let e = noise(G, K, 4, 5, r ^ 19843), t = G + .035 * Math.sin(n * K * 3 + a), i = K + .03 * Math.sin(n * G * 4 + a), o = noise(t, i, 4, 5, r ^ 7769), s = smooth(clamp((Math.cos(n * 4 * t) - .92) / .08)), c = smooth(clamp((Math.cos(n * 5 * i) - .92) / .08)), l = s + (1 - s) * c, u = (.5 + .5 * Math.cos(n * (18 * G + 7 * K + 1.7 * e) + a)) ** 8, d = (.5 + .5 * Math.cos(n * (5 * G - 21 * K + 1.3 * o) - a)) ** 10, f = .6 * u + .4 * d;
				Y = .4 + .3 * o + .19 * f - .1 * l, X = .36 + .34 * f + .065 * l + .04 * q, Z += .12 * (o - .5) + .11 * f + .025 * l, Q = .99 - .065 * f - .025 * l;
			};
			case `paper`: return () => {
				let e = noise(G, K, 3, 5, r ^ 33207), t = noise(G, K, 48, 48, r ^ 22483), i = G * 24, a = K * 24, o = Math.floor(i), s = Math.floor(a), c = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let l = o + t, u = s + e, d = (l % 24 + 24) % 24, f = (u % 24 + 24) % 24, p = i - l - .35 - .3 * hash(d, f, r), m = a - u - .35 - .3 * hash(d, f, r ^ 6463), h = n * hash(d, f, r ^ 29409), g = p * Math.cos(h) + m * Math.sin(h), _ = m * Math.cos(h) - p * Math.sin(h), v = .42 + .28 * hash(d, f, r ^ 23337), b = clamp(1 - (g * g / (v * v) + _ * _ / .0064)) ** 2;
					c = Math.max(c, b);
				}
				Y = .62 + .24 * e + .1 * t - .2 * c, X = .22 + .12 * e + .22 * t + .3 * c, Z += .08 * (t - .5) + .04 * c, Q = .98 - .07 * c - .035 * (1 - t);
			};
			case `reedmat`: return () => {
				let e = G * 16, t = Math.floor(e), r = (fract(e) - .5) / .46, i = smooth(clamp(1 - r * r)), o = Ve[t * 2], s = Ve[t * 2 + 1], c = .5 + .5 * Math.sin(n * e * 7 + .2 * Math.sin(n * K * 3) + s), l = smooth(clamp(1 - (1 - Math.cos(n * K * 4)) / .055)), u = .5 + .5 * Math.cos(n * G * 96 + a);
				Y = .15 + i * (.38 + .14 * o + .09 * c) + l * (.12 + .04 * u), X = .1 + i * (.46 + .055 * o + .018 * c) + l * (.24 + .015 * u), Z += .06 * (1 - i) - .035 * i * c + .025 * l, Q = .56 + .32 * i + .07 * l;
			};
			case `rope`: return () => {
				let e = G * 6, t = Math.floor(e), r = fract(e) - .5, i = smooth(clamp(1 - (r / .48) ** 2)), a = Ve[t * 2], o = Ve[t * 2 + 1], s = n * (3 * r - 6 * K) + o, c = .5 + .5 * Math.cos(s), l = .5 + .5 * Math.cos(s * 9 + .15 * Math.sin(n * K * 2));
				Y = .13 + i * (.3 + .14 * a + .23 * c + .06 * l), X = .08 + i * (.34 + .32 * c + .018 * l), Z += .065 * (1 - i) + i * (.025 - .045 * l), Q = .43 + i * (.35 + .17 * c);
			};
			case `straw`: return () => {
				let e = G * 8, t = K * 8, n = Math.floor(e), r = Math.floor(t);
				Y = .17 + .07 * q, X = .15 + .015 * q, Q = .55 + .035 * q;
				for (let a = 0; a < 3; a++) for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = r + o, u = ((a * 8 + (l % 8 + 8) % 8) * 8 + (c % 8 + 8) % 8) * 9, d = e - c - M[u], f = t - l - M[u + 1], p = (d * M[u + 2] + f * M[u + 3]) / M[u + 4], m = (f * M[u + 2] - d * M[u + 3]) / M[u + 5], h = smooth(clamp((1 - p * p) / .24)) * smooth(clamp(1 - m * m));
					if (h === 0) continue;
					let g = M[u + 6], _ = .5 + .5 * Math.cos(12 * m + M[u + 7]), v = M[u + 8] > .6 ? smooth(clamp(1 - ((p - .2) / .065) ** 2)) : 0;
					Y = Y * (1 - h) + h * (.48 + .26 * g + .07 * _ - .13 * v), X = X * (1 - h) + h * (.51 + .06 * a + .04 * g + .018 * _ + .055 * v), Z = Z * (1 - h) + h * (i.roughness - .04 * _ + .025 * v), Q = Q * (1 - h) + h * (.91 + .045 * _);
				}
			};
			case `wicker`: return () => {
				let e = G * 6, t = K * 6, i = .5 + .5 * Math.cos(n * e), a = .5 + .5 * Math.cos(n * t), o = smooth(clamp((Math.cos(n * e) + .92) / .3)), s = smooth(clamp((Math.cos(n * t) + .92) / .3)), c = smooth(clamp(.5 + 1.4 * Math.cos(Math.PI * e) * Math.cos(Math.PI * t))), l = o * (1 - s + s * c), u = s * (1 - o + o * (1 - c)), d = l + u, f = noise(G, K, 72, 4, r ^ 28465), p = noise(G, K, 4, 72, r ^ 10903), m = l * f + u * p, h = l * i + u * a;
				Y = .08 + .5 * d + .16 * h + .18 * m, X = .04 + .48 * d + .32 * h + .045 * m, Z += .1 * (q - .5) + .1 * (1 - d) - .04 * m, Q = .34 + .54 * d + .1 * h;
			};
			case `bamboo`: return () => {
				let e = noise(G, K, 64, 4, r ^ 19313), t = noise(G, K, 4, 3, r ^ 26909), i = .5 + .5 * Math.sin(n * (48 * G + .22 * t) + a), o = noise(G, 0, 4, 1, r ^ 10453), s = 1 - Math.cos(n * (3 * K + .65 * o + .07 * Math.sin(n * 4 * G)) + a), c = 1 - smooth(clamp(s / .16)), l = 1 - smooth(clamp(s / .42));
				Y = .46 + .23 * e + .16 * i + .08 * q - .34 * c, X = .3 + .14 * e + .12 * i + .16 * l - .1 * c, Z += .12 * c + .1 * (e - .5) - .035 * i, Q = .99 - .14 * c - .025 * (1 - e);
			};
			case `hammeredmetal`: return () => {
				let e = G * 12, t = K * 12, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 12 + 12) % 12, d = (l % 12 + 12) % 12, f = e - c - .35 - .3 * hash(u, d, r), p = t - l - .35 - .3 * hash(u, d, r ^ 29339), m = .85 + .25 * hash(u, d, r ^ 6461), h = clamp(1 - (f * f + p * p) / (m * m));
					a += h * h * (.7 + .3 * hash(u, d, r ^ 23063));
				}
				let o = 1 - Math.exp(-1.6 * a), s = noise(G, K, 4, 4, r ^ 20001);
				Y = .72 - .32 * o + .14 * s + .045 * q, X = .85 - .7 * o + .008 * q, Z += .1 * (s - .5) + .09 * o, Q = .99 - .12 * o;
			};
			case `galvanized`: return () => {
				let e = G * 10, t = K * 10, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + l, p = (d % 10 + 10) % 10, m = (f % 10 + 10) % 10, h = e - d - .35 - .3 * hash(p, m, r), g = t - f - .35 - .3 * hash(p, m, r ^ 15225), _ = n * hash(p, m, r ^ 22435), v = h * Math.cos(_) + g * Math.sin(_), y = g * Math.cos(_) - h * Math.sin(_), b = clamp(1 - (h * h + g * g) / 1.21) ** 8, x = hash(p, m, r ^ 18897), S = .5 + .5 * Math.cos(n * (3 * y + 1.5 * Math.abs(v)));
					o += b, s += b * x, c += b * S;
				}
				let l = 1 / Math.max(o, 1e-12), u = s * l, d = c * l;
				Y = .18 + .65 * u + .12 * d + .035 * q, X = .3 + .18 * u + .035 * d + .015 * q, Z += .24 * (u - .5) + .045 * (d - .5), Q = .98 + .02 * u;
			};
			case `corrugatedmetal`: return () => {
				let e = .5 + .5 * Math.cos(n * 8 * G + a), t = noise(G, K, 64, 4, r ^ 8043), i = (.5 + .5 * Math.sin(n * 48 * G + a)) ** 12;
				Y = .5 + .2 * e + .16 * t - .06 * i, X = .1 + .8 * e + .004 * t - .002 * i, Z += .13 * (t - .5) + .06 * i, Q = .91 + .08 * e;
			};
			case `perforatedmetal`: return () => {
				let e = G * 6, t = K * 6, n = Math.floor(e), r = Math.floor(t), i = 0;
				for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = r + a, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, p = smooth(clamp((.3 - Math.sqrt(u * u + d * d)) / .12));
					i += (1 - i) * p;
				}
				Y = .62 + .1 * q - .44 * i, X = .82 - .62 * i + .03 * q, Z += .07 * i + .04 * (q - .5), Q = 1 - .78 * i;
			};
			case `expandedmetal`: return () => {
				let e = smooth(clamp((Math.cos(n * 5 * (G + K)) - .1) / .9)), t = smooth(clamp((Math.cos(n * 5 * (G - K)) - .1) / .9)), r = e + t - e * t, i = e * t, a = 1 - r;
				Y = .7 + .1 * q - .42 * a, X = .22 + .6 * r + .09 * i + .025 * q, Z += .08 * a + .03 * (q - .5), Q = .34 + .62 * r;
			};
			case `wiremesh`: return () => {
				let e = G * 12, t = K * 12, cap = (e) => {
					let t = clamp(1 - e * e);
					return t * t;
				}, n = cap((fract(e) - .5) / .34), r = cap((fract(t) - .5) / .34), i = .5 + .5 * Math.cos(Math.PI * (e - t)), a = n * i + r * (1 - i), o = (r * i + n * (1 - i)) * (1 - a);
				Y = .3 + .46 * a + .2 * o + .08 * q, X = .08 + .78 * a + .34 * o + .03 * q, Z += .04 * (1 - a) + .03 * (q - .5), Q = .36 + .56 * a + .18 * o;
			};
			case `velvet`: return () => {
				let e = noise(G, K, 5, 5, r ^ 31793), t = noise(G, K, 3, 9, r ^ 10775), n = noise(G, K, 96, 96, r ^ 24365);
				Y = .3 + .32 * e + .12 * n, X = .42 + .06 * e + .05 * n, Z += .12 * (e - .5) + .035 * (t - .5), Q = .92 + .06 * e;
			};
			case `terrycloth`: return () => {
				let e = G * 10, t = K * 8, n = Math.floor(e), r = Math.floor(t), i = 0;
				for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = r + a, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, p = clamp(1 - (Math.sqrt(u * u + d * d) / .36) ** 2);
					i += (1 - i) * p * p;
				}
				Y = .42 + .3 * i + .16 * q, X = .3 + .62 * i + .05 * q, Z += .05 * (q - .5) - .03 * i, Q = .62 + .35 * i;
			};
			case `boucle`: return () => {
				let e = G * 8, t = K * 6, n = Math.floor(e), i = Math.floor(t), o = clamp(1 - ((fract(t) - .5) / .36) ** 2), s = o * o, c = 0;
				for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
					let s = n + o, l = i + a, u = (s % 8 + 8) % 8, d = (l % 6 + 6) % 6, f = e - s - .5 - .3 * (hash(u, d, r ^ 27181) - .5), p = t - l - .5 - .18 * (hash(u, d, r ^ 13297) - .5), h = clamp(1 - ((Math.sqrt(f * f + p * p) - .16) / .075) ** 2);
					c += (1 - c) * h * h;
				}
				let l = 1 - s;
				Y = .36 + .34 * s + .14 * c + .12 * q, X = .16 + .5 * s + .26 * c + .04 * q, Z += .06 * l + .03 * (q - .5), Q = .58 + .3 * s + .1 * c;
			};
			case `geode`: return () => {
				let e = fract(G) - .5, t = fract(K) - .5, i = Math.sin(Math.PI * e) / Math.PI, o = Math.sin(Math.PI * t) / Math.PI, s = Math.sqrt(i * i + o * o), c = noise(G, K, 6, 6, r ^ 15383), l = .5 + .5 * smooth(clamp((s - .1) / .08)) * Math.cos(n * (9 * s + .12 * c) + a), u = smooth(clamp((.17 - s) / .05)) * noise(G, K, 48, 48, r ^ 22817);
				Y = .3 + .3 * l + .22 * u + .12 * q, X = .3 + .3 * l + .2 * u + .03 * q, Z += .1 * (1 - l) + .08 * u + .03 * (q - .5), Q = .72 + .22 * l + .04 * u;
			};
			case `quartz`: return () => {
				let e = G * 5, t = K * 5, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 5 + 5) % 5, f = (u % 5 + 5) % 5, p = l + .5 + .24 * (hash(d, f, r ^ 19489) - .5), m = u + .5 + .24 * (hash(d, f, r ^ 29107) - .5), h = e - p, g = t - m, _ = 1;
					for (let e = 0; e < 6; e++) {
						let t = Math.PI / 3 * e + .22 * (hash(d, f, r ^ 23927) - .5), n = Math.abs(h * Math.cos(t) + g * Math.sin(t));
						_ *= smooth(clamp((.3 - n) / .055));
					}
					let v = .34 + .42 * hash(d, f, r ^ 12057), b = clamp(1 - (Math.sqrt(h * h + g * g) / .21) ** 2);
					a += (1 - a) * _, o += (1 - o) * _ * (v + .24 * b * b);
				}
				Y = .52 + .26 * o + .12 * q, X = .16 + .72 * o + .03 * q, Z += .1 * (1 - a) + .03 * (q - .5), Q = .5 + .46 * a;
			};
			case `pyrite`: return () => {
				let e = G * 5, t = K * 5, i = Math.floor(e), o = Math.floor(t), s = 0, c = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let l = i + a, u = o + n, d = (l % 5 + 5) % 5, f = (u % 5 + 5) % 5, p = l + .5 + .2 * (hash(d, f, r ^ 7233) - .5), m = u + .5 + .2 * (hash(d, f, r ^ 16167) - .5), h = .28 * (hash(d, f, r ^ 27485) - .5), g = Math.cos(h), _ = Math.sin(h), v = e - p, y = t - m, b = Math.abs(v * g + y * _), x = Math.abs(y * g - v * _), S = smooth(clamp((.32 - b) / .05)) * smooth(clamp((.32 - x) / .05)), C = .3 + .45 * hash(d, f, r ^ 20911);
					s += (1 - s) * S, c += (1 - c) * S * C;
				}
				let l = .5 + .5 * Math.cos(n * 26 * (G + K) + a), u = s * smooth(l);
				Y = .5 + .24 * c + .1 * u + .1 * q, X = .18 + .6 * c + .06 * u + .03 * q, Z += .07 * (1 - u) + .03 * (q - .5), Q = .52 + .42 * s;
			};
			case `shiplap`: return () => {
				let e = K * 5, t = (Math.floor(e) % 5 + 5) % 5, i = smooth(clamp((.07 - (.5 - Math.abs(fract(e) - .5))) / .05)), a = .5 + .36 * hash(t, 0, r ^ 11361) * (1 - i), o = noise(G, K, 48, 6, r ^ 18361), s = noise(G, K, 12, 2, r ^ 27939);
				Y = .24 + .36 * a + .16 * o + .1 * s - .18 * i, X = .72 - .5 * i + .08 * o + .03 * s, Z += .05 * (o - .5) + .06 * i, Q = 1 - .55 * i;
			};
			case `glassblock`: return () => {
				let e = G * 4, t = K * 4, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 4 + 4) % 4, f = (u % 4 + 4) % 4, p = e - l - .5, m = t - u - .5, h = smooth(clamp((.42 - Math.abs(p)) / .05)) * smooth(clamp((.42 - Math.abs(m)) / .05)), g = p - .2 * (hash(d, f, r ^ 20935) - .5), _ = m - .2 * (hash(d, f, r ^ 30881) - .5), y = clamp(1 - (Math.sqrt(g * g + _ * _) / .07) ** 2), b = y * y;
					a += (1 - a) * h, o += (1 - o) * h * b;
				}
				Y = .55 + .2 * a + .12 * o + .1 * q, X = .24 + .6 * a + .05 * o + .02 * q, Z += .12 * (1 - a) - .03 * o, Q = .45 + .5 * a;
			};
			case `thatch`: return () => {
				let e = K * 6, t = .5 + .5 * Math.cos(n * (fract(e) - .25) + .5 * noise(G, K, 3, 6, r ^ 7499)), i = noise(G, K, 80, 6, r ^ 16269), a = smooth(clamp((.14 - Math.abs(fract(e) - .73)) / .07));
				Y = .3 + .32 * t + .18 * i + .1 * q - .12 * a, X = .32 + .36 * t + .22 * i - .3 * a, Z += .05 * (i - .5) + .05 * a, Q = .68 + .28 * t - .3 * a;
			};
			case `charredwood`: return () => {
				let e = G * 9, t = K * 9, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 9 + 9) % 9, d = (l % 9 + 9) % 9, f = e - c - .5 - .24 * (hash(u, d, r ^ 18967) - .5), p = t - l - .5 - .24 * (hash(u, d, r ^ 29629) - .5), h = smooth(clamp((.36 - Math.sqrt(f * f + p * p)) / .08));
					a += (1 - a) * h;
				}
				let o = noise(G, K, 64, 64, r ^ 12113);
				Y = .12 + .24 * a + .14 * o, X = .2 + .66 * a + .05 * o, Z += .08 * (1 - a) + .03 * (o - .5), Q = .36 + .6 * a;
			};
			case `driftwood`: return () => {
				let e = noise(G, K, 4, 3, r ^ 7307), t = noise(G, K, 64, 3, r ^ 21985), n = noise(G, K, 12, 2, r ^ 14767), i = fract(K * 7 + .12 * e), o = smooth(clamp((.1 - Math.min(i, 1 - i)) / .05));
				Y = .42 + .26 * t + .12 * n - .24 * o, X = .62 + .18 * t + .04 * n - .5 * o, Z += .06 * (t - .5) + .08 * o, Q = 1 - .62 * o;
			};
			case `peelingpaint`: return () => {
				let e = noise(G, K, 5, 5, r ^ 28461), t = smooth(clamp((noise(G, K, 3, 3, r ^ 19313) - .55) / .08)), n = 4 * t * (1 - t), i = noise(G, K, 40, 40, r ^ 10963), a = 1 - t;
				Y = .66 * a + .3 * t + .16 * n + .1 * i * t + .12 * (.5 + .5 * e) * a, X = .24 + .42 * a + .3 * n + .05 * i, Z += .12 * t + .05 * (i - .5), Q = .52 + .36 * a + .16 * n;
			};
			case `tiretread`: return () => {
				let e = G * 4, t = K * 6, r = Math.floor(e), i = Math.floor(t), a = 0;
				for (let n = -1; n <= 1; n++) for (let o = -1; o <= 1; o++) {
					let s = r + o, c = i + n, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, f = smooth(clamp((.34 - Math.abs(u)) / .06)) * smooth(clamp((.32 - Math.abs(d)) / .06));
					a += (1 - a) * f;
				}
				let o = smooth(clamp((Math.abs(Math.sin(n * 2 * (e + .25 * t))) - .12) / .12));
				Y = .18 + .24 * a - .08 * o * a + .1 * q, X = .22 + .58 * a - .12 * o * a + .03 * q, Z += .06 * (1 - a) + .03 * (q - .5), Q = .42 + .52 * a - .1 * o * a;
			};
			case `honeycomb`: return () => {
				let e = Math.sqrt(3), t = G * 5, n = K * 4, i = Math.floor(t), a = Math.floor(n), o = 0;
				for (let r = -1; r <= 1; r++) for (let s = -1; s <= 1; s++) {
					let c = i + s, l = a + r, u = (l % 2 + 2) % 2 * .5, d = t - c - .5 - u, f = n - l - .5, p = smooth(clamp((.42 - Math.abs(d)) / .03)) * smooth(clamp((.42 - Math.abs(d * .5 + f * e / 2)) / .03)) * smooth(clamp((.42 - Math.abs(d * .5 - f * e / 2)) / .03));
					o += (1 - o) * p;
				}
				let s = 1 - o, c = noise(G, K, 48, 48, r ^ 12743);
				Y = .38 + .34 * s + .12 * c, X = .28 + .56 * s + .04 * c, Z += .08 * (1 - s) + .03 * (c - .5), Q = .52 + .42 * s;
			};
			case `frost`: return () => {
				let e = fract(G) - .5, t = fract(K) - .5, n = Math.sin(Math.PI * e) / Math.PI, i = Math.sin(Math.PI * t) / Math.PI, a = Math.sqrt(n * n + i * i), o = Math.atan2(i, n), s = smooth(clamp((a - .06) / .05)), c = Math.abs(Math.cos(3 * o + .4 * (noise(G, K, 3, 3, r ^ 23585) - .5) * Math.sin(2 * o))) ** 3, l = noise(G * 6 + 2 * a, K * 6 - 2 * a, 24, 24, r ^ 10155), u = s * c * (.55 + .45 * l);
				Y = .42 + .42 * u + .12 * q, X = .28 + .58 * u + .04 * q, Z += .12 * (1 - u) + .03 * (q - .5), Q = .6 + .36 * u;
			};
			case `stainedglass`: return () => {
				let e = G * 5, t = K * 5, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0, s = 0;
				for (let c = -1; c <= 1; c++) for (let l = -1; l <= 1; l++) {
					let u = n + l, d = i + c, f = (u % 5 + 5) % 5, p = (d % 5 + 5) % 5, m = .2 + .6 * hash(f, p, r ^ 15639), h = .2 + .6 * hash(f, p, r ^ 29867), g = 1;
					for (let n = -1; n <= 1; n++) for (let i = -1; i <= 1; i++) {
						if (!i && !n) continue;
						let a = ((u + i) % 5 + 5) % 5, o = ((d + n) % 5 + 5) % 5, s = .2 + .6 * hash(a, o, r ^ 15639), c = .2 + .6 * hash(a, o, r ^ 29867), l = i + s - m, f = n + c - h, p = Math.sqrt(l * l + f * f), _ = ((e - u - m) * l + (t - d - h) * f) / p;
						g *= smooth(clamp((p / 2 - _) / .035));
					}
					let _ = (1 - a) * g;
					a += _, o += _ * _, s += _ * hash(f, p, r ^ 24115);
				}
				let c = clamp((1 - o) * 1.4);
				Y = (.22 + .58 * s) * (1 - .45 * c) + .12 * q, X = .36 + .14 * (1 - c) + .32 * c + .03 * q, Z += .06 * c + .03 * (q - .5), Q = .86 - .2 * c;
			};
			case `soapstone`: return () => {
				let e = noise(G, K, 6, 2, r ^ 11409), t = smooth(clamp((noise(G, K, 3, 3, r ^ 19481) - .52) / .1)), n = noise(G, K, 48, 12, r ^ 25007);
				Y = .16 + .52 * t + .16 * e + .12 * n, X = .45 + .06 * t + .05 * e + .04 * n, Z += .1 * (1 - t) + .03 * (n - .5), Q = .9 + .08 * t;
			};
			case `butcherblock`: return () => {
				let e = G * 4, t = K * 4, n = Math.floor(e), i = Math.floor(t), a = .5 - Math.abs(fract(e) - .5), o = .5 - Math.abs(fract(t) - .5), s = smooth(clamp((.06 - Math.min(a, o)) / .04)), c = (((n + i) % 2 + 2) % 2 ? .5 : -.5) * (1 - s), l = noise(G, K, 40, 40, r ^ 14273), u = noise(G, K, 96, 96, r ^ 23251);
				Y = .46 + .34 * c + .14 * l + .1 * u - .12 * s, X = .7 - .42 * s + .06 * l + .04 * u, Z += .05 * (l - .5) + .06 * s, Q = 1 - .5 * s;
			};
			case `wallpaper`: return () => {
				let e = Math.abs(fract(G * 2) - .5), t = Math.abs(fract(K * 2) - .5), r = e * e + t * t, i = .5 + .5 * Math.cos(n * 3.5 * r + a), o = smooth(clamp((.22 - r) / .08)) * i;
				Y = .34 + .3 * o + .12 * q, X = .34 + .28 * o, Z += .08 * (1 - o) + .03 * (q - .5), Q = .82 + .16 * o;
			};
			case `embroidery`: return () => {
				let e = G * 6, t = K * 6, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 6 + 6) % 6, d = (l % 6 + 6) % 6, f = .6 * (hash(u, d, r ^ 12081) - .5), p = Math.cos(f), m = Math.sin(f), h = c + .5 + .16 * (hash(u, d, r ^ 16839) - .5), g = l + .5 + .16 * (hash(u, d, r ^ 27939) - .5), _ = e - h, v = t - g, y = (_ * p + v * m) / .34, b = (v * p - _ * m) / .09, x = clamp(1 - y * y - b * b);
					a += (1 - a) * x * x;
				}
				Y = .36 + .3 * a + .14 * q, X = .3 + .56 * a + .04 * q, Z += .06 * (q - .5) - .03 * a, Q = .62 + .34 * a;
			};
			case `macrame`: return () => {
				let e = G * 4, t = K * 4, r = Math.floor(e), i = Math.floor(t), o = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let s = r + a, c = i + n, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, p = smooth(clamp((.3 - Math.sqrt(u * u + d * d)) / .1));
					o += (1 - o) * p;
				}
				let s = .5 + .5 * Math.cos(n * 12 * (e + t) + a), c = .5 + .5 * Math.cos(n * 6 * (e - t) + a);
				Y = .34 + .3 * o + .12 * s * c + .12 * q, X = .28 + .52 * o + .14 * (1 - o) * s * c + .04 * q, Z += .06 * (q - .5), Q = .6 + .36 * o;
			};
			case `brickpaving`: return () => {
				let e = G * 3, t = K * 4, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let r = -1; r <= 1; r++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = i + r, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, f = smooth(clamp((.44 - Math.abs(u)) / .05)) * smooth(clamp((.38 - Math.abs(d)) / .05));
					a += (1 - a) * f;
				}
				let o = noise(G, K, 64, 64, r ^ 15383), s = noise(G, K, 24, 24, r ^ 20911);
				Y = .36 + .28 * a + .12 * s + .1 * o - .1 * (1 - a), X = .26 + .56 * a + .06 * s + .03 * o, Z += .06 * (1 - a) + .04 * (o - .5), Q = .5 + .46 * a;
			};
			case `steppingstone`: return () => {
				let e = G * 3, t = K * 3, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 3 + 3) % 3, d = (l % 3 + 3) % 3, f = e - c - .5 - .18 * (hash(u, d, r ^ 17073) - .5), p = t - l - .5 - .18 * (hash(u, d, r ^ 27767) - .5), h = smooth(clamp((.4 - Math.sqrt(f * f + p * p)) / .1));
					a += (1 - a) * h;
				}
				let o = noise(G, K, 72, 72, r ^ 11611), s = noise(G, K, 12, 12, r ^ 22723);
				Y = .32 + .3 * a + .14 * s + .12 * o, X = .24 + .58 * a + .06 * s + .03 * o, Z += .08 * (1 - a) + .04 * (o - .5), Q = .54 + .42 * a;
			};
			case `woodendeck`: return () => {
				let e = G * 3, t = K * 5, n = Math.floor(t), i = (n % 5 + 5) % 5, o = smooth(clamp((.05 - (.5 - Math.abs(fract(t) - .5))) / .035)), s = .5 + .3 * hash(i, 0, r ^ 7037) * (1 - o), c = noise(G, K, 48, 8, r ^ 14817), l = 0, u = 0;
				for (let r = 0; r < 3; r++) {
					let i = e - (r + .5), a = t - n - .5, s = smooth(clamp((.16 - Math.sqrt(i * i + a * a)) / .05)), c = s * smooth(clamp((.035 - Math.min(Math.abs(i), Math.abs(a))) / .02));
					l += (1 - l) * s, u += (1 - u) * c;
				}
				Y = .42 + .24 * s + .12 * c + .1 * l - .08 * u, X = .68 - .44 * o + .05 * l - .12 * u + .05 * c, Z += .05 * (c - .5) + .08 * o - .04 * l, Q = 1 - .52 * o - .12 * u;
			};
			case `cheese`: return () => {
				let e = G * 6, t = K * 6, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 6 + 6) % 6, d = (l % 6 + 6) % 6, f = e - c - .5 - .24 * (hash(u, d, r ^ 19991) - .5), p = t - l - .5 - .24 * (hash(u, d, r ^ 29355) - .5), m = .14 + .18 * Math.floor(hash(u, d, r ^ 13775) * 2), g = smooth(clamp((m - Math.sqrt(f * f + p * p)) / (.35 * m)));
					a += (1 - a) * g;
				}
				let o = noise(G, K, 40, 4, r ^ 11133), s = noise(G, K, 24, 24, r ^ 25027);
				Y = .56 + .26 * s + .1 * o - .3 * a, X = .72 - .5 * a + .04 * s - .03 * o, Z += .06 * (1 - a) + .03 * (s - .5), Q = .94 - .6 * a;
			};
			case `sugarfrosting`: return () => {
				let e = G * 5, t = K * 5, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 5 + 5) % 5, d = (l % 5 + 5) % 5, f = e - c - .5 - .2 * (hash(u, d, r ^ 8075) - .5), p = t - l - .5 - .2 * (hash(u, d, r ^ 18989) - .5), h = clamp(1 - (Math.sqrt(f * f + p * p) / .34) ** 2);
					a += (1 - a) * h * h;
				}
				let o = noise(G, K, 32, 32, r ^ 31809);
				Y = .58 + .2 * a + .1 * o + .1 * q, X = .34 + .5 * a + .06 * o + .03 * q, Z += .06 * (1 - a) + .03 * (q - .5), Q = .66 + .3 * a;
			};
			case `candleswax`: return () => {
				let e = G * 6, t = K * 2, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 6 + 6) % 6, f = (u % 2 + 2) % 2, p = l + .5 + .3 * (hash(d, f, r ^ 9393) - .5), m = u + .5, h = e - p, g = t - m, _ = g / .42, v = h / .14, y = clamp(1 - _ * _ - v * v), b = y * y, x = clamp(1 - ((g - .22) / .14) ** 2 - (h / .17) ** 2) ** 2;
					a += (1 - a) * b, o += (1 - o) * b * x;
				}
				let s = noise(G, K, 48, 16, r ^ 23843);
				Y = .5 + .26 * a + .12 * o + .1 * s, X = .3 + .42 * a + .16 * o + .05 * s, Z += .05 * (s - .5) + .05 * (1 - a), Q = .62 + .34 * a;
			};
			case `vinylrecord`: return () => {
				let e = fract(G) - .5, t = fract(K) - .5, i = Math.sin(Math.PI * e) / Math.PI, o = Math.sin(Math.PI * t) / Math.PI, s = Math.sqrt(i * i + o * o), c = smooth(clamp((s - .18) / .06)), l = .5 + .5 * Math.cos(n * 52 * s + a), u = noise(G, K, 64, 64, r ^ 12743);
				Y = .14 + .1 * l * c + .08 * u, X = .42 + .24 * l * c + .02 * u, Z += .06 * (1 - l * c) + .03 * (u - .5), Q = .88 + .1 * l * c;
			};
			case `graphpaper`: return () => {
				let e = fract(G * 12), t = fract(K * 12), n = Math.min(e, 1 - e), i = Math.min(t, 1 - t), a = smooth(clamp((.05 - Math.min(n, i)) / .03)), o = fract(G * 3), s = fract(K * 3), c = Math.min(o, 1 - o), l = Math.min(s, 1 - s), u = smooth(clamp((.06 - Math.min(c, l)) / .035)), d = noise(G, K, 64, 64, r ^ 23341);
				Y = .9 - .28 * a - .34 * u + .06 * d, X = .8 - .22 * a - .36 * u + .03 * d, Z += .04 * (d - .5) + .03 * a, Q = 1 - .12 * a - .2 * u;
			};
			case `notebookpaper`: return () => {
				let e = fract(K * 8), t = smooth(clamp((.05 - Math.min(e, 1 - e)) / .03)), n = smooth(clamp((.012 - Math.abs(fract(G) - .25)) / .008)), i = 0;
				for (let e = 0; e < 3; e++) {
					let t = fract(G) - .12, n = fract(K) - (e + 1) / 4, a = smooth(clamp((.06 - Math.sqrt(t * t + 4 * n * n)) / .03));
					i += (1 - i) * a;
				}
				let a = noise(G, K, 48, 48, r ^ 10155);
				Y = .9 - .3 * t - .26 * n - .5 * i + .06 * a, X = .82 - .2 * t - .22 * n - .5 * i + .03 * a, Z += .04 * (a - .5) + .03 * t, Q = 1 - .1 * t - .12 * n - .4 * i;
			};
			case `lace`: return () => {
				let e = fract((G + K) * 6), t = fract((G - K) * 6), n = smooth(clamp((.14 - Math.min(e, 1 - e)) / .07)), i = smooth(clamp((.14 - Math.min(t, 1 - t)) / .07)), a = n + i - n * i, o = n * i, s = noise(G, K, 48, 48, r ^ 7231);
				Y = .58 + .32 * a + .05 * s, X = .5 + .32 * a + .12 * o + .02 * s, Z += .05 * (s - .5) - .08 * a, Q = 1 - .5 * (1 - a) - .14 * (1 - o);
			};
			case `crochet`: return () => {
				let e = Math.floor(K * 6) % 2 * .5, t = fract(G * 8 + e) - .5, n = fract(K * 6) - .5, a = smooth(clamp((.44 - Math.sqrt(t * t + 1.4 * n * n)) / .12)), o = noise(G, K, 40, 40, r ^ 23063);
				Y = .58 + .34 * a + .05 * o, X = .45 + .4 * a + .02 * o, Z += .05 * (o - .5) - .05 * a, Q = 1 - .55 * (1 - a);
			};
			case `basketweave`: return () => {
				let e = fract(G * 4), t = fract(K * 4), n = smooth(clamp((Math.min(e, 1 - e) - .06) / .1)) * smooth(clamp((Math.min(t, 1 - t) - .06) / .1)), a = fract((Math.floor(G * 4) + Math.floor(K * 4)) % 2 ? G * 8 : K * 8), o = smooth(clamp((Math.min(a, 1 - a) - .06) / .1)), s = smooth(clamp((.14 - Math.abs(a - .5)) / .07)), c = noise(G, K, 32, 32, r ^ 26334);
				Y = .5 + n * (.28 * o + .12 * s) + .06 * c, X = .42 + n * (.36 * o + .14 * s) + .02 * c, Z += .06 * (c - .5) - .05 * n * s, Q = 1 - .55 * (1 - n * o) - .16 * (1 - n * s);
			};
			case `zipper`: return () => {
				let e = fract(K * 12) - .5, t = fract(K * 12 + .5) - .5, i = smooth(clamp((.34 - Math.abs(e)) / .08)) * smooth(clamp((.09 - Math.abs(G - .42)) / .035)), a = smooth(clamp((.34 - Math.abs(t)) / .08)) * smooth(clamp((.09 - Math.abs(G - .58)) / .035)), o = i + a - i * a, s = smooth(clamp((.2 - Math.abs(G - .25)) / .06)) + smooth(clamp((.2 - Math.abs(G - .75)) / .06)), c = smooth(clamp((.05 - Math.abs(G - .5)) / .03)) * (1 - o), l = .5 + .5 * Math.cos(n * 24 * K), u = noise(G, K, 40, 40, r ^ 15762), d = o + .7 * s - o * .7 * s;
				Y = .42 + .24 * o + .2 * s * (.85 + .15 * l) + .05 * u, X = .4 + .34 * o + .16 * s * (.85 + .15 * l) - .12 * c + .02 * u, Z += .05 * (u - .5) - .08 * o, Q = 1 - .42 * (1 - d) - .3 * c;
			};
			case `velcro`: return () => {
				let e = Math.floor(K * 12) % 2 * .5, t = fract(G * 12 + e) - .5, n = fract(K * 12) - .5, i = Math.sqrt(t * t + n * n), a = smooth(clamp((.34 - i) / .07)) * smooth(clamp((i - .16) / .07)), o = smooth(clamp((.18 - i) / .08)), s = noise(G, K, 36, 36, r ^ 30641), c = a + o - a * o;
				Y = .46 + .3 * a + .16 * o + .05 * s, X = .42 + .3 * a + .15 * o + .02 * s, Z += .05 * (s - .5) - .06 * a, Q = 1 - .5 * (1 - c) - .14 * a;
			};
			case `button`: return () => {
				let e = fract(G * 4) - .5, t = fract(K * 4) - .5, n = Math.sqrt(e * e + t * t), i = smooth(clamp((.34 - n) / .08)), a = smooth(clamp((.34 - n) / .05)) * smooth(clamp((n - .2) / .05)), o = 0;
				for (let n = 0; n < 4; n++) {
					let r = e - (n % 2 ? .07 : -.07), i = t - (n > 1 ? .07 : -.07), s = smooth(clamp((.05 - Math.sqrt(r * r + i * i)) / .03));
					o += (1 - o) * s;
				}
				let s = noise(G, K, 32, 32, r ^ 19501);
				Y = .55 + .26 * i + .12 * a - .3 * o + .05 * s, X = .4 + .22 * i + .24 * a - .34 * o + .02 * s, Z += .05 * (s - .5) - .06 * a, Q = 1 - .4 * (1 - i) - .42 * o;
			};
			case `traintracks`: return () => {
				let e = smooth(clamp((.18 - Math.min(fract(K * 6), 1 - fract(K * 6))) / .08)), t = smooth(clamp((.06 - Math.abs(G - .35)) / .025)) + smooth(clamp((.06 - Math.abs(G - .65)) / .025)), n = noise(G, K, 48, 48, r ^ 12129), i = e + t - e * t;
				Y = .32 + .28 * e + .3 * t + .08 * n, X = .36 + .16 * e + .34 * t + .03 * n, Z += .06 * (n - .5) - .1 * t, Q = 1 - .45 * (1 - i) - .12 * (1 - n);
			};
			case `manholecover`: return () => {
				let e = G - .5, t = K - .5, i = Math.sqrt(e * e + t * t), a = smooth(clamp((.46 - i) / .03)) * smooth(clamp((i - .38) / .03)), o = smooth(clamp((.36 - i) / .04)), s = .5 + .5 * Math.cos(16 * Math.atan2(t, e)), c = .5 + .5 * Math.cos(n * 6 * i), l = s * smooth(clamp((i - .06) / .05)) * o, u = c * o, d = noise(G, K, 40, 40, r ^ 6350);
				Y = .4 + .3 * a + .14 * l + .1 * u + .05 * d, X = .38 + .3 * a + .14 * l + .12 * u + .02 * d, Z += .05 * (d - .5) - .08 * a, Q = 1 - .4 * (1 - a) - .2 * (1 - l) * (1 - u);
			};
			case `speedbump`: return () => {
				let e = fract(K * 2), n = smooth(clamp((.34 - Math.abs(e - .5)) / .14)), i = smooth(clamp((.04 - Math.min(e, 1 - e)) / .03)), a = smooth(clamp((.28 - Math.abs(fract(G * 4) - .5)) / .1)), o = noise(G, K, 32, 32, r ^ 20911);
				Y = .42 + .4 * a * (.3 + .7 * n) + .06 * o, X = .38 + .4 * n - .1 * i + .02 * o, Z += .05 * (o - .5) - .06 * n, Q = 1 - .45 * (1 - n) - .3 * i;
			};
			case `circuitboard`: return () => {
				let e = Math.floor(K * 8), t = Math.floor(G * 8), n = fract(G * 8) - .5, i = fract(K * 8) - .5, a = Math.sqrt(n * n + i * i), o = e % 2 == 0 ? smooth(clamp((.12 - Math.abs(i)) / .05)) : 0, s = t % 2 == 1 ? smooth(clamp((.12 - Math.abs(n)) / .05)) : 0, c = e % 2 == 0 && t % 2 == 1 ? smooth(clamp((.22 - a) / .06)) : 0, l = e % 2 == 1 && t % 2 == 0 ? smooth(clamp((.1 - a) / .04)) : 0, u = noise(G, K, 32, 32, r ^ 27394), d = 1 - (1 - o) * (1 - s) * (1 - c);
				Y = .3 + .3 * d + .26 * c + .06 * u, X = .4 + .12 * o + .12 * s + .22 * c - .3 * l + .02 * u, Z += .05 * (u - .5) - .1 * d, Q = 1 - .35 * (1 - d) - .35 * l;
			};
			case `solarpanel`: return () => {
				let e = fract(G * 2), t = fract(K * 2), n = smooth(clamp((Math.min(e, 1 - e) - .06) / .1)) * smooth(clamp((Math.min(t, 1 - t) - .06) / .1)), i = smooth(clamp((.05 - Math.min(Math.abs(e - .3), Math.abs(e - .7))) / .025)), a = smooth(clamp((.04 - Math.min(fract(K * 8), 1 - fract(K * 8))) / .02)), o = noise(G, K, 40, 40, r ^ 12791);
				Y = .34 + .3 * n + .2 * i * n + .1 * a * n + .05 * o, X = .4 + .3 * n + .12 * i * n + .05 * a * n + .02 * o, Z += .05 * (o - .5) - .1 * i * n, Q = 1 - .5 * (1 - n) - .12 * (1 - i * n);
			};
			case `heattile`: return () => {
				let e = fract(G * 3), t = fract(K * 3), n = smooth(clamp((Math.min(e, 1 - e) - .08) / .12)) * smooth(clamp((Math.min(t, 1 - t) - .08) / .12)), i = noise(G, K, 48, 48, r ^ 31297);
				Y = .52 + .32 * n + .08 * i, X = .42 + .34 * n + .03 * i, Z += .05 * (i - .5) - .04 * n, Q = 1 - .5 * (1 - n);
			};
			case `pianokeys`: return () => {
				let e = fract(G * 7), t = smooth(clamp((.04 - Math.min(e, 1 - e)) / .025)), n = 0;
				for (let e = 0; e < 7; e++) {
					if (e === 0 || e === 3) continue;
					let t = Math.abs(fract(G) - e / 7), r = Math.abs(fract(K) - .275), i = smooth(clamp((.045 - t) / .018)) * smooth(clamp((.175 - r) / .06));
					n += (1 - n) * i;
				}
				let i = noise(G, K, 40, 40, r ^ 20360), a = 1 - t * (1 - n);
				Y = .48 + .32 * a + .14 * n + .05 * i, X = .42 + .2 * a + .26 * n + .02 * i, Z += .05 * (i - .5) - .1 * n, Q = 1 - .32 * t * (1 - n);
			};
			case `drumskin`: return () => {
				let e = G - .5, t = K - .5, n = Math.sqrt(e * e + t * t), i = Math.atan2(t, e), a = smooth(clamp((.46 - n) / .03)) * smooth(clamp((n - .38) / .03)), o = (.5 + .5 * Math.cos(8 * i)) ** 4 * a, s = smooth(clamp((.38 - n) / .06)), c = (.5 - .5 * Math.cos(16 * i)) * smooth(clamp((n - .08) / .06)) * s, l = noise(G, K, 36, 36, r ^ 11354);
				Y = .42 + .28 * a + .14 * o + .1 * s - .1 * c + .05 * l, X = .42 + .28 * a + .16 * o + .1 * s - .06 * c + .02 * l, Z += .05 * (l - .5) - .06 * a, Q = 1 - .3 * (1 - s) - .12 * c - .1 * o;
			};
			case `gongsurface`: return () => {
				let e = G - .5, t = K - .5, i = Math.sqrt(e * e + t * t), a = Math.atan2(t, e), o = noise(G, K, 6, 6, r ^ 24751) - .5, s = .5 + .5 * Math.cos(n * 10 * (i + .012 * o)), c = .5 + .5 * Math.cos(24 * a), l = smooth(clamp((.1 - i) / .05)), u = smooth(clamp((i - .06) / .05)), d = smooth(clamp((.44 - i) / .06)), f = noise(G, K, 32, 32, r ^ 22977);
				Y = .46 + .26 * s * d + .12 * c * u * d + .1 * l + .05 * f, X = .42 + .22 * s * d + .06 * c * u * d + .2 * l + .02 * f, Z += .05 * (f - .5) - .08 * s * d, Q = 1 - .24 * (1 - s * d) - .1 * (1 - c * u * d);
			};
			case `lensarray`: return () => {
				let e = fract(G * 16) - .5, t = fract(K * 16) - .5, i = smooth(clamp((.42 - Math.sqrt(e * e + t * t)) / .12)), a = noise(G, K, 48, 48, r ^ 28476);
				Y = .42 + .4 * i + .06 * a, X = .42 + .36 * i + .02 * a, Z += .05 * (a - .5) - .12 * i, Q = 1 - .42 * (1 - i);
			};
			case `prismtape`: return () => {
				let e = fract((G - K) * 8), n = smooth(clamp((.34 - Math.abs(e - .5)) / .16)), i = noise(G, K, 40, 40, r ^ 7038);
				Y = .4 + .42 * n + .06 * i, X = .4 + .4 * n + .02 * i, Z += .05 * (i - .5) - .1 * n, Q = 1 - .45 * (1 - n);
			};
			case `fresnel`: return () => {
				let e = G - .5, t = K - .5, n = Math.sqrt(e * e + t * t), i = fract(n * 10), a = smooth(clamp((.46 - n) / .05)), o = smooth(clamp((.75 - i) / .25)) * a, s = smooth(clamp((.1 - n) / .05)), c = noise(G, K, 40, 40, r ^ 14249);
				Y = .38 + .32 * o + .2 * s + .05 * c, X = .42 + .22 * o + .3 * s + .02 * c, Z += .05 * (c - .5) - .1 * o, Q = 1 - .36 * (1 - o) - .12 * (1 - s);
			};
			case `bandage`: return () => {
				let e = smooth(clamp((.28 - Math.abs(G - .5)) / .06)) * smooth(clamp((.28 - Math.abs(K - .5)) / .06)), t = smooth(clamp((.12 - Math.abs(fract(G * 24) - .5)) / .06)), n = smooth(clamp((.12 - Math.abs(fract(K * 24) - .5)) / .06)), i = t + n - t * n, a = noise(G, K, 48, 48, r ^ 23841);
				Y = .5 + .3 * e + .12 * i + .06 * a, X = .44 + .3 * e + .08 * i + .02 * a, Z += .05 * (a - .5) - .08 * e, Q = 1 - .32 * (1 - i) - .12 * (1 - e);
			};
			case `pillblister`: return () => {
				let e = fract(G * 3) - .5, t = fract(K * 3) - .5, i = smooth(clamp((.36 - Math.sqrt(e * e + t * t)) / .1)), a = smooth(clamp((.03 - Math.min(fract(G * 3), 1 - fract(G * 3))) / .02)) + smooth(clamp((.03 - Math.min(fract(K * 3), 1 - fract(K * 3))) / .02)), o = noise(G, K, 40, 40, r ^ 10173);
				Y = .52 + .34 * i - .14 * a + .06 * o, X = .46 + .36 * i - .14 * a + .02 * o, Z += .05 * (o - .5) - .12 * i, Q = 1 - .42 * (1 - i) - .2 * a;
			};
			case `sutures`: return () => {
				let e = smooth(clamp((.09 - Math.abs(fract(K * 10) - .5)) / .03)), t = e * smooth(clamp((.22 - Math.abs(G - .5)) / .06)), n = smooth(clamp((.05 - Math.abs(G - .5)) / .03)), i = smooth(clamp((.045 - Math.abs(G - .16)) / .025)) * e + smooth(clamp((.045 - Math.abs(G - .84)) / .025)) * e, a = noise(G, K, 40, 40, r ^ 25566);
				Y = .56 + .26 * t - .22 * n * (1 - t) - .18 * i + .05 * a, X = .5 + .28 * t - .3 * n * (1 - t) - .2 * i * (1 - t) + .02 * a, Z += .05 * (a - .5) - .08 * t, Q = 1 - .3 * n * (1 - t) - .28 * i - .12 * (1 - t);
			};
			case `trellis`: return () => {
				let e = smooth(clamp((.16 - Math.abs(fract(G * 2) - .5)) / .08)), t = smooth(clamp((.16 - Math.abs(fract(K * 2) - .5)) / .08)), n = e + t - e * t, i = smooth(clamp((.14 - Math.sqrt((fract(G * 2) - .5) ** 2 + (fract(K * 2) - .5) ** 2)) / .06)) * n, a = noise(G, K, 32, 32, r ^ 16839);
				Y = .42 + .3 * n + .14 * i + .06 * a, X = .4 + .24 * n + .1 * i + .03 * a, Z += .06 * (a - .5) - .08 * n, Q = 1 - .5 * (1 - n) - .12 * (1 - i) * n;
			};
			case `terracottapot`: return () => {
				let e = smooth(clamp((.18 - Math.abs(fract(K * 8) - .5)) / .08)), t = smooth(clamp((.1 - Math.abs(fract(K) - .1)) / .04)), n = noise(G, K, 32, 32, r ^ 24075);
				Y = .46 + .24 * e + .22 * t + .06 * n, X = .42 + .18 * e + .26 * t + .03 * n, Z += .05 * (n - .5) - .06 * t, Q = 1 - .34 * (1 - e) - .12 * (1 - t);
			};
			case `hedgerow`: return () => {
				let e = Math.floor(K * 4) % 2 * .5, t = fract(G * 4 + e) - .5, n = fract(K * 4) - .5, o = smooth(clamp((.34 - (Math.sqrt(t * t + n * n) + .08 * (noise(G, K, 8, 8, r ^ 13231) - .5))) / .12)), s = noise(G, K, 48, 48, r ^ 29396);
				Y = .36 + .36 * o + .12 * s + .05 * o * s, X = .42 + .34 * o + .04 * s, Z += .05 * (s - .5) - .06 * o, Q = 1 - .5 * (1 - o);
			};
			case `collar`: return () => {
				let e = smooth(clamp((.2 - Math.abs(fract(K) - .5)) / .05)), t = smooth(clamp((.02 - Math.abs(Math.abs(fract(K) - .5) - .17)) / .012)), n = smooth(clamp((.12 - Math.abs(fract(G) - .3)) / .04)) * smooth(clamp((.14 - Math.abs(fract(K) - .5)) / .05)), i = noise(G, K, 48, 48, r ^ 19481);
				Y = .42 + .26 * e + .22 * n + .06 * i, X = .44 + .2 * e + .28 * n - .1 * t * e + .03 * i, Z += .05 * (i - .5) - .1 * n, Q = 1 - .32 * (1 - e) - .14 * t - .12 * n;
			};
			case `petbed`: return () => {
				let e = G - .5, t = K - .5, i = Math.sqrt(e * e + t * t), a = smooth(clamp((.44 - i) / .06)) * smooth(clamp((i - .3) / .08)), o = smooth(clamp((.28 - i) / .1)), s = (.5 + .5 * Math.cos(n * 20 * G)) * (.5 + .5 * Math.cos(n * 20 * K)), c = noise(G, K, 40, 40, r ^ 20931);
				Y = .44 + .3 * a + .14 * o + .05 * s + .05 * c, X = .44 + .34 * a + .12 * o + .03 * s + .03 * c, Z += .05 * (c - .5) + .02 * (s - .5) - .08 * a, Q = 1 - .36 * (1 - a) - .12 * (1 - o);
			};
			case `scratchpost`: return () => {
				let e = smooth(clamp((.2 - Math.abs(fract(K * 8) - .5)) / .08)), t = .5 + .5 * Math.cos(n * (12 * G + 2 * K)), i = noise(G, K, 40, 40, r ^ 10966);
				Y = .46 + .32 * e + .08 * t * e + .06 * i, X = .44 + .36 * e + .05 * t * e + .03 * i, Z += .05 * (i - .5) - .08 * e, Q = 1 - .5 * (1 - e) - .1 * (1 - t) * e;
			};
			case `runningtrack`: return () => {
				let e = smooth(clamp((.03 - Math.abs(fract(K) - .25)) / .015)) + smooth(clamp((.03 - Math.abs(fract(K) - .75)) / .015)), t = smooth(clamp((.02 - Math.min(fract(K), 1 - fract(K))) / .012)), n = noise(G, K, 64, 64, r ^ 16216);
				Y = .42 + .4 * e + .1 * n, X = .46 + .12 * e + .02 * n - .16 * t, Z += .05 * (n - .5) - .1 * e, Q = 1 - .3 * t - .12 * (1 - e);
			};
			case `bouldermat`: return () => {
				let e = Math.abs(fract((G + K) * 4) - .5), t = Math.abs(fract((G - K) * 4) - .5), n = smooth(clamp((.3 - e) / .1)) * smooth(clamp((.3 - t) / .1)), i = smooth(clamp((.08 - Math.min(fract(G), 1 - fract(G))) / .04)), a = smooth(clamp((.08 - Math.min(fract(K), 1 - fract(K))) / .04)), o = 1 - (1 - i) * (1 - a), s = noise(G, K, 40, 40, r ^ 25778);
				Y = .42 + .3 * n + .16 * o + .06 * s, X = .44 + .28 * n + .18 * o + .03 * s, Z += .05 * (s - .5) - .06 * n, Q = 1 - .42 * (1 - n) - .12 * (1 - o);
			};
			case `pooltile`: return () => {
				let e = Math.min(fract(G * 8), 1 - fract(G * 8)), t = Math.min(fract(K * 8), 1 - fract(K * 8)), i = smooth(clamp((e - .04) / .06)) * smooth(clamp((t - .04) / .06)), a = .5 + .5 * Math.cos(n * 2 * (G + K)), o = noise(G, K, 32, 32, r ^ 6394);
				Y = .4 + .3 * i + .14 * a + .06 * o, X = .44 + .2 * i + .1 * a + .02 * o, Z += .05 * (o - .5) - .12 * i, Q = 1 - .42 * (1 - i) - .1 * (1 - a);
			};
			case `envelope`: return () => {
				let e = Math.abs(fract((G + K) * 10) - .5), t = Math.abs(fract((G - K) * 10) - .5), n = smooth(clamp((.14 - e) / .07)), i = smooth(clamp((.14 - t) / .07)), a = n + i - n * i, o = smooth(clamp((.03 - Math.abs(G - .5)) / .02)) * (1 - a), s = noise(G, K, 48, 48, r ^ 11852);
				Y = .5 + .24 * a + .06 * s, X = .46 + .12 * a - .14 * o + .02 * s, Z += .05 * (s - .5) - .06 * a, Q = 1 - .28 * (1 - a) - .3 * o;
			};
			case `chalkboard`: return () => {
				let e = .5 - Math.abs(fract(G) - .5), t = .5 - Math.abs(fract(K) - .5), i = 1 - (1 - smooth(clamp((.08 - e) / .04))) * (1 - smooth(clamp((.08 - t) / .04))), a = noise(G, K, 6, 6, r ^ 21994) - .5, o = .5 + .5 * Math.cos(n * 3 * (K + .02 * a)), s = noise(G, K, 32, 32, r ^ 7176);
				Y = .34 + .3 * i + .12 * o + .06 * s, X = .44 + .24 * i + .04 * o + .03 * s, Z += .05 * (s - .5) - .08 * i, Q = 1 - .3 * (1 - i) - .08 * (1 - o);
			};
			case `corkboard`: return () => {
				let e = Math.floor(K * 8) % 2 * .5, t = fract(G * 8 + e) - .5, n = fract(K * 8) - .5, o = smooth(clamp((.34 - (Math.sqrt(t * t + n * n) + .08 * (noise(G, K, 8, 8, r ^ 27447) - .5))) / .12)), s = fract(G * 4) - .5, c = fract(K * 4) - .5, l = smooth(clamp((.07 - Math.sqrt(s * s + c * c)) / .03)), u = noise(G, K, 48, 48, r ^ 14930);
				Y = .42 + .26 * o - .2 * l + .08 * u, X = .44 + .2 * o - .26 * l + .03 * u, Z += .05 * (u - .5) - .06 * o, Q = 1 - .3 * (1 - o) - .45 * l;
			};
			case `snowdrift`: return () => {
				let e = noise(G, K, 4, 4, r ^ 20087) - .5, t = .5 + .5 * Math.cos(n * (2 * G + .35 * e)), i = noise(G, K, 48, 48, r ^ 11029);
				Y = .52 + .34 * t + .06 * i, X = .46 + .32 * t + .05 * i, Z += .05 * (i - .5) - .12 * t, Q = 1 - .3 * (1 - t);
			};
			case `icicle`: return () => {
				let t = smooth(clamp((.28 - Math.abs(fract(G * 6) - .5)) / .1)), i = .5 + .5 * Math.cos(n * 24 * G), a = noise(G, K, 32, 32, r ^ 31809);
				Y = .46 + .36 * t + .08 * i * t + .06 * a, X = .42 + .42 * t + .04 * i * t + .03 * a, Z += .05 * (a - .5) - .14 * t, Q = 1 - .52 * (1 - t);
			};
			case `dewdrops`: return () => {
				let e = fract(G * 12) - .5, t = fract(K * 12) - .5, i = smooth(clamp((.22 - Math.sqrt(e * e + t * t)) / .08)), a = fract(G * 24) - .5, o = fract(K * 24) - .5, s = smooth(clamp((.12 - Math.sqrt(a * a + o * o)) / .05)), c = .5 + .5 * Math.cos(n * 8 * (G + .25 * K)), l = noise(G, K, 40, 40, r ^ 22734);
				Y = .34 + .28 * i + .18 * s + .1 * c + .05 * l, X = .42 + .28 * i + .16 * s + .04 * c + .02 * l, Z += .05 * (l - .5) - .16 * i, Q = 1 - .3 * (1 - i) - .12 * (1 - s) * (1 - i);
			};
			case `mooncrater`: return () => {
				let e = fract(G * 3) - .5, t = fract(K * 3) - .5, n = Math.sqrt(e * e + t * t), i = smooth(clamp((.3 - n) / .06)) * smooth(clamp((n - .2) / .06)), a = smooth(clamp((.2 - n) / .08)), o = fract(G * 6) - .5, s = fract(K * 6) - .5, c = Math.sqrt(o * o + s * s), l = smooth(clamp((.16 - c) / .04)) * smooth(clamp((c - .1) / .04)), u = smooth(clamp((.1 - c) / .05)), d = noise(G, K, 32, 32, r ^ 25032);
				Y = .5 + .24 * i + .12 * l - .16 * a - .1 * u + .08 * d, X = .46 + .24 * i + .12 * l - .2 * a - .1 * u + .03 * d, Z += .05 * (d - .5) + .08 * a, Q = 1 - .3 * a - .16 * u - .12 * (1 - i - l + i * l);
			};
			case `starfield`: return () => {
				let e = fract(G * 12) - .5, t = fract(K * 12) - .5, n = smooth(clamp((.08 - Math.sqrt(e * e + t * t)) / .035)), i = fract(G * 24) - .5, a = fract(K * 24) - .5, o = smooth(clamp((.05 - Math.sqrt(i * i + a * a)) / .025)), s = noise(G, K, 3, 3, r ^ 6130), c = noise(G, K, 40, 40, r ^ 19770);
				Y = .26 + .38 * n + .18 * o + .07 * s + .05 * c, X = .42 + .3 * n + .16 * o + .06 * s + .02 * c, Z += .05 * (c - .5) - .18 * n, Q = 1 - .2 * (1 - n) * (1 - o);
			};
			case `nebula`: return () => {
				let e = noise(G, K, 3, 3, r ^ 23085) - .5, t = .5 + .5 * Math.cos(n * (2 * G + 3 * K + 1.2 * e)), i = noise(G, K, 12, 12, r ^ 14052), a = noise(G, K, 32, 32, r ^ 12209);
				Y = .42 + .34 * t + .1 * i + .06 * a, X = .44 + .28 * t + .05 * i + .02 * a, Z += .05 * (a - .5) - .1 * t, Q = 1 - .24 * (1 - t);
			};
			case `pleats`: return () => {
				let e = smooth(clamp((.34 - Math.abs(fract(G * 4) - .5)) / .16)), t = noise(G, K, 40, 40, r ^ 25505);
				Y = .46 + .32 * e + .08 * t, X = .46 + .32 * e + .03 * t, Z += .05 * (t - .5) - .1 * e, Q = 1 - .4 * (1 - e);
			};
			case `shoelace`: return () => {
				let e = Math.abs(fract((G + K) * 8) - .5), t = Math.abs(fract((G - K) * 8) - .5), n = smooth(clamp((.18 - e) / .09)), i = smooth(clamp((.18 - t) / .09)), a = n + i - n * i, o = fract(G * 4) - .5, s = fract(K * 4) - .5, c = smooth(clamp((.09 - Math.sqrt(o * o + s * s)) / .04)), l = noise(G, K, 32, 32, r ^ 20246);
				Y = .46 + .3 * a - .22 * c + .06 * l, X = .46 + .22 * a - .28 * c + .03 * l, Z += .05 * (l - .5) - .08 * a, Q = 1 - .3 * (1 - a) - .45 * c;
			};
			case `tassel`: return () => {
				let e = smooth(clamp((.16 - Math.abs(fract(G * 10) - .5)) / .08)), t = smooth(clamp((.08 - Math.abs(fract(K) - .1)) / .04)), n = noise(G, K, 32, 32, r ^ 10429);
				Y = .38 + .26 * e + .28 * t + .06 * n, X = .42 + .22 * e + .3 * t + .03 * n, Z += .05 * (n - .5) - .06 * e, Q = 1 - .38 * (1 - e) - .12 * (1 - t);
			};
			case `woksurface`: return () => {
				let e = fract(G * 10) - .5, t = fract(K * 10) - .5, n = smooth(clamp((.28 - Math.sqrt(e * e + t * t)) / .1)), i = smooth(clamp((.02 - Math.abs(fract((G + K) * 8) - .5)) / .01)), a = noise(G, K, 3, 3, r ^ 17618), o = noise(G, K, 40, 40, r ^ 8638);
				Y = .4 + .22 * n - .1 * i + .16 * a + .06 * o, X = .44 + .16 * n - .12 * i + .02 * o, Z += .05 * (o - .5) - .14 * a, Q = 1 - .3 * i - .12 * (1 - n);
			};
			case `cutlery`: return () => {
				let t = smooth(clamp((.08 - Math.min(fract(K), 1 - fract(K))) / .04)), i = t * (.5 + .5 * Math.cos(n * 16 * G)), a = .5 + .5 * Math.cos(n * 20 * K), o = noise(G, K, 32, 32, r ^ 30500);
				Y = .46 + .26 * t + .16 * i + .06 * a + .05 * o, X = .46 + .24 * t + .12 * i + .03 * a + .02 * o, Z += .05 * (o - .5) - .12 * i, Q = 1 - .2 * (1 - t) - .12 * (1 - i) * t;
			};
			case `choppingboard`: return () => {
				let e = Math.min(fract(G * 4), 1 - fract(G * 4)), t = Math.min(fract(K * 4), 1 - fract(K * 4)), n = smooth(clamp((e - .08) / .06)) * smooth(clamp((t - .08) / .06)), i = smooth(clamp((.03 - Math.abs(fract((G + K) * 5) - .5)) / .015)), a = smooth(clamp((.03 - Math.abs(fract((G - K) * 5) - .5)) / .015)), o = i + a - i * a, s = Math.min(fract(G), 1 - fract(G)), c = Math.min(fract(K), 1 - fract(K)), l = 1 - (1 - smooth(clamp((.05 - s) / .03))) * (1 - smooth(clamp((.05 - c) / .03))), u = noise(G, K, 32, 32, r ^ 20936);
				Y = .5 + .24 * n - .14 * o * n - .14 * l + .06 * u, X = .48 + .14 * n - .1 * o * n - .12 * l + .03 * u, Z += .05 * (u - .5) - .08 * n, Q = 1 - .3 * o * n - .24 * l - .12 * (1 - n);
			};
			case `faucet`: return () => {
				let e = G - .5, t = K - .5, n = Math.sqrt(e * e + t * t), i = smooth(clamp((.4 - n) / .12)), a = smooth(clamp((.5 - n) / .05)) * smooth(clamp((n - .4) / .05)), o = fract(G * 8) - .5, s = fract(K * 8) - .5, c = smooth(clamp((.12 - Math.sqrt(o * o + s * s)) / .05)), l = noise(G, K, 32, 32, r ^ 27159);
				Y = .4 + .3 * i + .16 * a + .07 * c + .05 * l, X = .4 + .3 * i + .14 * a + .05 * c + .02 * l, Z += .05 * (l - .5) - .14 * i, Q = 1 - .18 * (1 - i) - .1 * c;
			};
			case `showerhead`: return () => {
				let e = G - .5, t = K - .5, n = Math.sqrt(e * e + t * t), i = smooth(clamp((.42 - n) / .06)), a = smooth(clamp((.03 - Math.abs(fract(12 * n) - .5)) / .015)), o = fract(G * 10) - .5, s = fract(K * 10) - .5, c = smooth(clamp((.12 - Math.sqrt(o * o + s * s)) / .05)), l = noise(G, K, 32, 32, r ^ 12792);
				Y = .46 + .3 * i - .12 * a * i - .2 * c * i + .06 * l, X = .44 + .22 * i - .1 * a * i - .22 * c * i + .02 * l, Z += .05 * (l - .5) - .1 * i, Q = 1 - .3 * c * i - .12 * a * i - .2 * (1 - i);
			};
			case `bathmat`: return () => {
				let e = Math.floor(K * 8) % 2 * .5, t = fract(G * 8 + e) - .5, i = fract(K * 8) - .5, a = smooth(clamp((.3 - Math.sqrt(t * t + i * i)) / .1)), o = .5 + .5 * Math.cos(n * 12 * K), s = noise(G, K, 32, 32, r ^ 9419);
				Y = .42 + .32 * a + .12 * o + .06 * s, X = .44 + .28 * a + .06 * o + .02 * s, Z += .05 * (s - .5) - .1 * a, Q = 1 - .34 * (1 - a) - .08 * (1 - o);
			};
			case `blinds`: return () => {
				let e = smooth(clamp((.34 - Math.abs(fract(K * 4) - .5)) / .16)), t = smooth(clamp((.02 - Math.abs(fract(K * 4) - .5)) / .012)), n = noise(G, K, 32, 32, r ^ 24359);
				Y = .48 + .32 * e - .1 * t + .06 * n, X = .46 + .3 * e - .08 * t + .02 * n, Z += .05 * (n - .5) - .1 * e, Q = 1 - .42 * (1 - e) - .1 * t;
			};
			case `curtain`: return () => {
				let e = noise(G, K, 4, 4, r ^ 15489) - .5, t = smooth(clamp((.34 - Math.abs(fract(5 * (G + .1 * e)) - .5)) / .16)), n = noise(G, K, 40, 40, r ^ 28226);
				Y = .46 + .34 * t + .08 * n, X = .46 + .3 * t + .03 * n, Z += .05 * (n - .5) - .08 * t, Q = 1 - .36 * (1 - t);
			};
			case `shadecloth`: return () => {
				let e = smooth(clamp((.12 - Math.abs(fract(G * 16) - .5)) / .06)), t = smooth(clamp((.12 - Math.abs(fract(K * 16) - .5)) / .06)), n = e + t - e * t, i = noise(G, K, 32, 32, r ^ 10197);
				Y = .42 + .3 * n + .08 * i, X = .46 + .2 * n + .02 * i, Z += .05 * (i - .5) - .08 * n, Q = 1 - .42 * (1 - n);
			};
			case `sandstone`: return () => {
				let e = noise(G, K, 3, 5, r ^ 26941), t = K + .055 * (e - .5), i = .5 + .5 * Math.sin(8 * t * n + a), o = (.5 + .5 * Math.sin(19 * t * n + a)) ** 6, s = noise(G, K, 8, 3, r ^ 19735), c = smooth(clamp((J - .28) / .48)), l = (1 - J) ** 5;
				Y = .22 + .35 * i + .2 * s + .18 * c - .2 * o, X = .32 + .16 * i - .09 * o + .24 * c - .1 * l, Z += .12 * (c - .5) + .05 * o, Q = .97 - .12 * o - .13 * l + .025 * c;
			};
			case `travertine`: return () => {
				let e = G * 12, t = K * 18, i = Math.floor(e), o = Math.floor(t), s = 0;
				for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = o + a, d = (l % 12 + 12) % 12, f = (u % 18 + 18) % 18, p = hash(d, f, r ^ 24211), m = (hash(d, f, r ^ 9169) - .5) * .36, h = Math.cos(m), g = Math.sin(m), _ = e - l - .2 - .6 * hash(d, f, r), v = t - u - .2 - .6 * hash(d, f, r ^ 31513), y = _ * h + v * g, b = v * h - _ * g, x = .42 + .36 * p, S = .11 + .13 * hash(d, f, r ^ 36657), w = smooth(clamp((1 - (y * y / (x * x) + b * b / (S * S) + .12 * Math.sin(9 * y + p * n) * Math.sin(13 * b))) / .65));
					s += w * (.65 + .35 * p);
				}
				let c = 1 - Math.exp(-1.8 * s), l = noise(G, K, 3, 3, r ^ 16855), u = .5 + .5 * Math.sin(n * (6 * K + .18 * l) + a);
				Y = .65 + .12 * u + .09 * J - .48 * c, X = .62 + .05 * u + .04 * J - .3 * c, Z += .15 * c + .08 * (J - .5), Q = .98 - .42 * c;
			};
			case `pumice`: return () => {
				let e = G * 26, t = K * 26, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 26 + 26) % 26, f = (u % 26 + 26) % 26, p = e - l - .15 - .7 * hash(d, f, r), m = t - u - .15 - .7 * hash(d, f, r ^ 25375), h = .24 + .2 * hash(d, f, r ^ 14521), g = (p * p + m * m) / (h * h), _ = clamp(1 - g), v = _ * _;
					a = Math.max(a, v), o = Math.max(o, 6 * g * v);
				}
				Y = .65 + .12 * noise(G, K, 5, 5, r ^ 40007) + .08 * J - .57 * a + .05 * o, X = .72 - .58 * a + .08 * o + .03 * J, Z += .07 * a + .07 * (J - .5), Q = .98 - .52 * a + .01 * q;
			};
			case `parquet`: return () => {
				let e = G * 4, t = K * 4, a = Math.floor(e), o = Math.floor(t), s = (a + o) % 2 == 0, c = fract(s ? e : t), l = fract(s ? t : e), u = Math.floor(l * 3), f = smooth(clamp((Math.min(c, 1 - c, fract(l * 3) / 3, (1 - fract(l * 3)) / 3) - .006) / .016)), p = hash(a * 3 + u, o, r), m = noise(G, K, 8, 8, r ^ 14105), h = .5 + .5 * Math.sin(n * (l * 38 + .28 * Math.sin(n * c) + .18 * m) + p * n);
				Y = .06 + f * (.25 + .32 * p + .22 * h + .06 * q), X = f * (.76 + .045 * h + .025 * q), Z = .78 + f * (i.roughness - .78 + .09 * h + .04 * p), Q = .52 + .46 * f;
			};
			case `mosaic`: return () => {
				let e = G * 16, t = K * 16, n = fract(e), a = fract(t), s = smooth(clamp((Math.min(n, 1 - n, a, 1 - a) - .018) / .042)), c = hash(Math.floor(e), Math.floor(t), r);
				Y = .2 + s * (.08 + .56 * c + .1 * q), X = s * (.78 + .08 * c + .025 * q), Z = .76 + s * (i.roughness - .76 + .11 * c + .04 * q), Q = .6 + .39 * s, $ = 1 - s;
			};
			case `hexagontiles`: return () => {
				let e = Math.sqrt(3), t = G * 5, n = K * 6 * e / 2, a = Math.floor(n / (e / 2)), o = 1 / 0, s = 0, c = 0, l = 0, u = 0;
				for (let r = -1; r <= 1; r++) {
					let i = a + r, d = (i % 2 + 2) % 2 * .5, f = Math.round(t - d);
					for (let r = -1; r <= 1; r++) {
						let a = f + r, p = t - a - d, m = n - i * e / 2, h = p * p + m * m;
						h < o && (o = h, s = p, c = m, l = (a % 5 + 5) % 5, u = (i % 6 + 6) % 6);
					}
				}
				let f = smooth(clamp((.5 - Math.max(Math.abs(s), Math.abs(s * .5 + c * e / 2), Math.abs(s * .5 - c * e / 2)) - .012) / .034)), p = hash(l, u, r);
				Y = .2 + f * (.28 + .35 * p + .07 * q), X = f * (.8 + .045 * p + .02 * q), Z = .74 + f * (i.roughness - .74 + .1 * p + .04 * q), Q = .6 + .39 * f, $ = 1 - f;
			};
			case `knit`: return () => {
				let e = G * 8, t = K * 8, r = Math.floor(e), i = Math.floor(t), o = 0;
				for (let n = -1; n <= 1; n += 2) {
					let a = e - r - .5, s = t - i - .84, c = n * .34, l = -.68, u = clamp((a * c + s * l) / (c * c + l * l)), d = a - u * c, f = s - u * l, m = smooth(clamp(1 - (d * d + f * f) / .0169));
					o += (1 - o) * m;
				}
				let s = .5 + .25 * Math.sin(n * (48 * G + 24 * K) + a) + .25 * Math.sin(n * (48 * G - 24 * K) - a);
				Y = .12 + .64 * o + .1 * q + .07 * o * s, X = .08 + o * (.76 + .045 * s) + .025 * q, Z += .065 * (q - .5) + .035 * (1 - o), Q = .58 + .41 * o;
			};
			case `corduroy`: return () => {
				let e = (.5 + .5 * Math.cos(n * G * 12)) ** .65, t = noise(G, K, 96, 96, r ^ 11121), i = noise(G, K, 12, 48, r ^ 31907);
				Y = .12 + .57 * e + .16 * t + .08 * i, X = .07 + .79 * e + .035 * t + .025 * i, Z += .08 * (t - .5) + .035 * (1 - e), Q = .57 + .42 * e;
			};
			case `felt`: return () => {
				let e = G * 20, t = K * 20, i = Math.floor(e), a = Math.floor(t), o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + s, d = (l % 20 + 20) % 20, f = (u % 20 + 20) % 20, p = e - l - .25 - .5 * hash(d, f, r), m = t - u - .25 - .5 * hash(d, f, r ^ 41845), h = hash(d, f, r ^ 27415) * n, g = Math.cos(h), _ = Math.sin(h), v = (p * g + m * _) / .6, y = (m * g - p * _) / .055, b = clamp(1 - v * v - y * y);
					o += (1 - o) * b * b;
				}
				Y = .28 + .28 * q + .3 * o, X = .18 + .035 * q + .065 * o, Z += .065 * (q - .5) + .025 * o, Q = .96 + .025 * o + .01 * q;
			};
			case `wafflecloth`: return () => {
				let e = smooth(clamp((Math.cos(n * G * 8) - .35) / .65)), t = smooth(clamp((Math.cos(n * K * 8) - .35) / .65)), i = e + t - e * t, o = .5 + .25 * Math.cos(n * G * 96 + a) + .25 * Math.cos(n * K * 96 - a), s = noise(G, K, 24, 24, r ^ 19059);
				Y = .22 + .48 * i + .12 * o + .08 * s, X = .12 + .66 * i + .035 * o + .025 * s, Z += .04 * (s - .5) + .025 * (1 - i), Q = .65 + .32 * i + .02 * o;
			};
			case `cableknit`: return () => {
				let e = fract(G * 4), t = K * 4, i = .22 * Math.sin(n * t), o = .5 + .5 * Math.cos(n * t), s = (e - .5 - i) / .115, c = (e - .5 + i) / .115, l = smooth(clamp(1 - s * s)), u = smooth(clamp(1 - c * c)), d = l + u - l * u, f = l * (.38 + .38 * o), p = u * (.76 - .38 * o), m = f + p - f * p, h = smooth(clamp((Math.cos(n * e) - .5) / .5)), g = .5 + .5 * Math.cos(n * (K * 32 + .35 * Math.cos(n * e))), _ = noise(G, K, 64, 64, r ^ 14249), v = .5 + .5 * Math.sin(n * (G * 96 + K * 48) + a);
				Y = .13 + .55 * m + .13 * h + .09 * _ + .04 * d * v, X = .07 + m + .17 * h * (.65 + .35 * g) + .02 * _ + .015 * d * v, Z += .035 * (_ - .5) + .025 * (1 - d), Q = .57 + .35 * d + .055 * h + .015 * _;
			};
			case `quilting`: return () => {
				let e = (G + K) * 6, t = (G - K) * 6, i = .5 - .5 * Math.cos(n * e), o = .5 - .5 * Math.cos(n * t), s = i * o, c = smooth(clamp(1 - i / .055)), l = smooth(clamp(1 - o / .055)), u = c + l - c * l, d = smooth(clamp((Math.cos(n * t * 8) - .2) / .8)), f = smooth(clamp((Math.cos(n * e * 8) - .2) / .8)), p = c * d + l * f - c * d * l * f, m = .5 + .25 * Math.cos(n * G * 96 + a) + .25 * Math.cos(n * K * 96 - a), h = noise(G, K, 24, 24, r ^ 27441);
				Y = .3 + .32 * s - .15 * u + .12 * p + .08 * h + .06 * m, X = .13 + .67 * s - .065 * u + .035 * p + .02 * m + .015 * h, Z += .045 * (h - .5) + .025 * u, Q = .88 + .1 * s - .18 * u + .025 * p;
			};
			case `roofshingles`: return () => {
				let e = Math.floor(K * 6), t = fract(K * 6), n = G * 4 + e % 2 * .5, i = fract(n), a = smooth(clamp(Math.min(t, 1 - t) / .12)), o = smooth(clamp(Math.min(i, 1 - i) / .055)), s = (1 - o) * smooth(clamp((t - .32) / .16)) * a, c = a * o, l = hash(Math.floor(n) % 4, e, r ^ 25527), u = smooth(clamp((noise(G, K, 64, 64, r ^ 19765) - .2) / .6)), d = 1 - a;
				Y = .24 + .32 * u + .2 * c * l - .15 * d - .14 * s, X = .2 + .38 * a - .2 * s + .13 * u + .05 * c * l, Z += .12 * (u - .5) + .04 * d + .03 * s, Q = .96 - .24 * d - .2 * s + .025 * u;
			};
			case `rooftiles`: return () => {
				let e = fract(G * 6 + .5), t = fract(K * 5), i = .5 + .5 * Math.cos(n * G * 6), a = smooth(clamp(Math.min(t, 1 - t) / .13)), o = a * smooth(clamp(Math.min(e, 1 - e) / .12)), s = hash(Math.floor(G * 6 + .5) % 6, Math.floor(K * 5), r ^ 31297), c = noise(G, K, 24, 32, r ^ 23591), l = 1 - a;
				Y = .26 + .24 * i + .23 * o * s + .14 * c - .14 * l, X = .16 + .65 * i - .1 * l + .035 * o * s + .012 * c, Z += .13 * (c - .5) + .05 * (1 - i) + .045 * l, Q = .76 + .22 * i - .14 * l + .015 * c;
			};
			case `stucco`: return () => {
				let e = G * 28, t = K * 28, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 28 + 28) % 28, f = (u % 28 + 28) % 28, p = hash(d, f, r ^ 17337), m = e - l - .2 - .6 * hash(d, f, r), h = t - u - .2 - .6 * hash(d, f, r ^ 6083), g = .3 + .25 * p, _ = clamp(1 - (m * m + h * h * (.7 + p)) / (g * g)), v = _ * _;
					p < .28 ? o += (1 - o) * v : a += (1 - a) * v;
				}
				let s = noise(G, K, 5, 7, r ^ 21373);
				Y = .52 + .15 * s + .19 * a - .24 * o + .08 * q, X = .27 + .16 * s + .43 * a - .22 * o + .06 * q, Z += .055 * a + .065 * o + .05 * (q - .5), Q = .96 - .25 * o - .075 * a + .02 * q;
			};
			case `lichen`: return () => {
				let e = G * 7, t = K * 7, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0;
				for (let c = -1; c <= 1; c++) for (let l = -1; l <= 1; l++) {
					let u = i + l, d = a + c, f = (u % 7 + 7) % 7, p = (d % 7 + 7) % 7, m = e - u - .25 - .5 * hash(f, p, r), h = t - d - .25 - .5 * hash(f, p, r ^ 29107), g = Math.atan2(h, m), _ = hash(f, p, r ^ 15449), v = (.38 + .16 * _) * (1 + .13 * Math.cos(5 * g + _ * n) + .09 * Math.sin(3 * g - _ * n)), y = smooth(clamp((1 - Math.hypot(m, h) / v) / .18));
					o += (1 - o) * y, s += y * (_ - .5);
				}
				let c = smooth(clamp((noise(G, K, 96, 96, r ^ 27171) - .58) / .25));
				Y = .16 + .13 * q + .53 * o + .07 * Math.tanh(s) - .18 * o * c, X = .15 + .035 * q + o * (.48 - .17 * c), Z += .04 * (q - .5) + .035 * o * c, Q = .9 + .08 * o - .15 * o * c;
			};
			case `leaflitter`: return () => {
				let e = G * 6, t = K * 6, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + l, p = (d % 6 + 6) % 6, m = (f % 6 + 6) % 6, h = e - d - .2 - .6 * hash(p, m, r), g = t - f - .2 - .6 * hash(p, m, r ^ 10679), _ = hash(p, m, r ^ 20273) * n, v = Math.cos(_), y = Math.sin(_), b = hash(p, m, r ^ 20905), x = (h * v + g * y) / (.64 + .1 * b), S = (g * v - h * y) / (.26 + .05 * b), C = smooth(clamp((1 - x * x - Math.sqrt(S * S + 1e-4)) / .18)), w = C * Math.exp(-S * S * 260);
					o += (1 - o) * C, c += (1 - c) * w, s += C * (b - .5);
				}
				Y = .07 + .09 * q + .56 * o + .16 * Math.tanh(s) - .12 * c, X = .08 + .035 * q + .61 * o + .045 * c, Z += .07 * (q - .5) + .045 * (1 - o), Q = .53 + .44 * o;
			};
			case `endgrain`: return () => {
				let e = fract(G - Ee + .5) - .5, t = fract(K - De + .5) - .5, i = Math.sin(Math.PI * e) / Math.PI, o = Math.sin(Math.PI * t) / Math.PI, s = Math.sqrt(i * i + o * o + 4e-4), c = noise(G, K, 5, 5, r ^ 31811), l = (.5 + .5 * Math.sin(n * (23 * s + .23 * c) + a)) ** 6, u = smooth(clamp((noise(G, K, 96, 96, r ^ 5607) - .62) / .23)), d = Math.hypot(e, t), f = smooth(clamp((d - .07) / .08)) * smooth(clamp((.43 - d) / .08)) * (.5 + .5 * Math.cos(7 * Math.atan2(t, e) + a)) ** 48;
				Y = .76 - .37 * l - .2 * u - .24 * f + .08 * q, X = .49 - .07 * l - .16 * u - .22 * f + .025 * q, Z += .13 * u + .06 * l + .045 * (q - .5), Q = .99 - .17 * u - .22 * f;
			};
			case `acousticfoam`: return () => {
				let e = fract(G * 4) - .5, t = fract(K * 4) - .5, n = Math.sqrt(e * e + 1e-4), i = Math.sqrt(t * t + 1e-4), o = clamp(1 - 2 * (.5 * (n + i + Math.sqrt((n - i) ** 2 + 4e-4)))), s = o < .1 ? o * o * 5 : o > .9 ? .9 - (1 - o) * (1 - o) * 5 : o - .05, c = hash(Math.floor(G * 4), Math.floor(K * 4), r ^ 14289), l = smooth(clamp((noise(G, K, 96, 96, r ^ 27417) - .42) / .46));
				Y = .14 + .61 * s + .13 * q - .12 * l, X = .03 + s * (.88 + .07 * c) + .009 * q - .008 * l, Z += .065 * (q - .5) + .025 * l, Q = .43 + .54 * s + .025 * q - .025 * l;
			};
			case `closedcellfoam`: return () => {
				let e = G * 28, t = K * 28, n = Math.floor(e), r = Math.floor(t), i = 0, a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = r + s, d = (l % 28 + 28) % 28, f = ((u % 28 + 28) % 28 * 28 + d) * 4, p = e - l - Ae[f], m = t - u - Ae[f + 1], h = clamp(1 - (p * p + m * m) * Ae[f + 2]), g = h * h;
					i += (1 - i) * g, a += (1 - a) * g * (1 - h) * 6.75, o += g * (Ae[f + 3] - .5);
				}
				Y = .49 + .18 * q - .13 * i + .08 * a + .1 * o, X = .48 + .035 * q - .17 * i + .055 * a, Z += .065 * (q - .5) + .025 * i, Q = .99 - .065 * i;
			};
			case `linoleum`: return () => {
				let e = noise(G, K, 4, 5, r ^ 22811), t = .5 + .5 * Math.sin(n * (5 * G + 3 * K + 1.2 * e) + a), i = noise(G + .19 * e, K + .08 * t, 48, 8, r ^ 11635), o = smooth(clamp((i - .43) / .4));
				Y = .24 + .25 * t + .38 * o + .08 * q, X = .45 + .025 * q + .015 * i, Z += .09 * (i - .5) + .045 * (q - .5), Q = .99 + .008 * q;
			};
			case `orangepeel`: return () => {
				let e = G * Fe, t = K * Ie, n = Math.floor(e), r = Math.floor(t), i = 0, a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = r + o, u = (c % Fe + Fe) % Fe, d = ((l % Ie + Ie) % Ie * Fe + u) * 3, f = e - c - Le[d], p = t - l - Le[d + 1], m = .26 + .14 * Le[d + 2], h = f * f + p * p, g = clamp(1 - h / (m * m)), _ = clamp(1 - h / .36);
					i += (1 - i) * g * g, a += (1 - a) * _ * _ * (1 - _) * 6.75;
				}
				Y = (.48 + .28 * q) * (1 - .35 * i) + .119 * i, X = (.46 + .025 * q + .045 * a) * (1 - i) + .22 * i, Z += .06 * (q - .5) + .035 * i, Q = 1 - .08 * i;
			};
			case `coconut`: return () => {
				let e = G * Fe, t = K * Ie, n = Math.floor(e), r = Math.floor(t), i = 0, a = 0, o = .38 + .18 * q;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = r + s, d = (l % Fe + Fe) % Fe, f = ((u % Ie + Ie) % Ie * Fe + d) * 3, p = e - l - Le[f], m = t - u - Le[f + 1], h = Le[f + 2], g = m / (.48 + .25 * h), _ = (p + (h - .5) * .28 * m) / .12, v = clamp(1 - g * g - _ * _), y = v * v;
					h < .24 ? (a += (1 - a) * y, o = o * (1 - y) + .15 * y) : (i += (1 - i) * y, o = o * (1 - y) + (.55 + .25 * h) * y);
				}
				Y = o, X = (.42 + .055 * q + .18 * i) * (1 - a) + .3 * a, Z += .055 * (q - .5) + .025 * i, Q = (.96 + .025 * i) * (1 - a) + .86 * a;
			};
			case `watermelon`: return () => {
				let e = noise(G, K, 4, 5, r ^ 20247), t = noise(G, K, 12, 8, r ^ 26531), o = smooth(clamp((.5 + .5 * Math.sin(n * (5 * G + .3 * e + .12 * t) + a) - .24) / .52)), s = smooth(clamp((noise(G, K, 96, 96, r ^ 23609) - .48) / .4)), c = smooth(clamp((noise(G, K, 80, 80, r ^ 11121) - .5) / .38));
				Y = (.12 + .72 * o) * (1 - .2 * s) + .46 * .2 * s, X = (.48 + .025 * q) * (1 - .14 * c), Z += .055 * (q - .5) + .045 * c, Q = 1 - .035 * c;
			};
			case `limestone`: return () => {
				let e = G * 24, t = K * 24, i = Math.floor(e), a = Math.floor(t), o = smooth(clamp((noise(G, K, 96, 96, r ^ 6615) - .49) / .38)), s = 0;
				Y = .63 + .14 * q - .16 * o;
				for (let r = -1; r <= 1; r++) for (let o = -1; o <= 1; o++) {
					let c = i + o, l = a + r, u = (c % 24 + 24) % 24, d = ((l % 24 + 24) % 24 * 24 + u) * 7, f = e - c - j[d], p = t - l - j[d + 1], m = (f * j[d + 4] + p * j[d + 5]) / j[d + 2], h = (p * j[d + 4] - f * j[d + 5]) / (j[d + 2] * j[d + 3]), g = m * m + h * h, _ = smooth(clamp((1 - g) / .36)), v = j[d + 6], y = .5 + .5 * Math.cos(n * 1.5 * g), b = .5 + .24 * v + .16 * y;
					Y = Y * (1 - _) + b * _, s += (1 - s) * _;
				}
				X = .47 + .08 * s + .025 * q - .07 * o, Z += .06 * (q - .5) + .08 * o - .05 * s, Q = .98 - .12 * o + .015 * s;
			};
			case `breccia`: return () => {
				let e = G * 6, t = K * 6, n = Math.floor(e), a = Math.floor(t), o = noise(G, K, 80, 80, r ^ 23841), s = 0;
				Y = .56 + .16 * o, X = .33 + .035 * o, Z += .08 * o;
				for (let r = -1; r <= 1; r++) for (let o = -1; o <= 1; o++) {
					let c = n + o, l = a + r, u = (c % 6 + 6) % 6, d = ((l % 6 + 6) % 6 * 6 + u) * 18, f = e - c - Re[d], p = t - l - Re[d + 1], m = 1;
					for (let e = 0; e < 5; e++) {
						let t = d + 3 + e * 3, n = Re[t + 2] - f * Re[t] - p * Re[t + 1];
						m *= smooth(clamp(n / .055));
					}
					let h = Re[d + 2], g = .15 + .66 * h + .12 * q;
					Y = Y * (1 - m) + g * m, X = X * (1 - m) + (.54 + .1 * h + .025 * q) * m, Z = Z * (1 - m) + (i.roughness + .08 * (q - .5)) * m, s += (1 - s) * m;
				}
				Q = .81 + .17 * s + .015 * o;
			};
			case `gneiss`: return () => {
				let e = noise(G, K, 4, 4, r ^ 27417), t = K + .28 * Math.sin(n * G + .8 * Math.sin(n * K) + a) + .06 * Math.sin(n * (2 * G - K) + a), i = n * 6 * t + 1.4 * (e - .5), o = smooth(clamp((.5 + .5 * Math.sin(i) - .18) / .64)), s = .5 + .5 * Math.sin(3 * i + .4 * e), l = smooth(clamp((noise(G, K, 96, 96, r ^ 15477) - .52) / .34));
				Y = (.12 + .7 * o + .08 * s) * (1 - .3 * l) + .264 * l, X = .42 + .055 * o + .07 * l + .025 * q, Z += .08 * (q - .5) + .06 * (1 - o) - .05 * l, Q = .95 + .025 * o + .015 * l;
			};
			case `plywood`: return () => {
				let e = noise(G, K, 4, 3, r ^ 17335), t = 3.2 * Math.cos(n * G + a) + 1.8 * Math.cos(n * K + .7 * a) + .45 * e, o = (.5 + .5 * Math.sin(n * t)) ** 5, s = .5 + .5 * Math.sin(n * (64 * G + .4 * e) + a);
				Y = .67 + .1 * q - .32 * o + .035 * s, X = .48 + .025 * q - .045 * o + .015 * s, Z += .05 * o + .04 * (q - .5), Q = .99 - .045 * o;
				for (let e = 0; e < 2; e++) {
					let t = e * 3, r = fract(G - ze[t] + .5) - .5, a = fract(K - ze[t + 1] + .5) - .5, o = ze[t + 2], s = r * r / (.0025 * o * o) + a * a / (.0169 * o * o), c = Math.max(0, 1 - s), l = c * c, u = .5 + .5 * Math.cos(n * 2 * s);
					Y = Y * (1 - l) + (.25 + .2 * u) * l, X = X * (1 - l) + (.44 + .025 * u) * l, Z = Z * (1 - l) + (i.roughness + .065 * u) * l, Q = Q * (1 - l) + (.95 + .025 * u) * l;
				}
			};
			case `osb`:
			case `chipboard`: return () => {
				let e = G * N, t = K * N, n = Math.floor(e), r = Math.floor(t), a = 0;
				Y = .24 + .12 * q, X = .35 + .025 * q, Z += .035 * q;
				for (let o = 0; o < 2; o++) for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = r + s, d = (l % N + N) % N, f = (u % N + N) % N, p = ((o * N + f) * N + d) * 26, m = e - l - P[p], h = t - u - P[p + 1], g = (m * P[p + 2] + h * P[p + 3]) / P[p + 4], _ = (h * P[p + 2] - m * P[p + 3]) / P[p + 5], v = 1;
					for (let e = 0; e < 6; e++) {
						let t = p + 8 + e * 3;
						v *= smooth(clamp((P[t + 2] - g * P[t] - _ * P[t + 1]) / .12));
					}
					if (v === 0) continue;
					let y = P[p + 6], b = .5 + .5 * Math.sin(18 * _ + .65 * Math.sin(3 * g) + P[p + 7]);
					Y = Y * (1 - v) + (.34 + .44 * y + .1 * b) * v, X = X * (1 - v) + (.49 + .12 * y + .025 * b) * v, Z = Z * (1 - v) + (i.roughness - .045 + .07 * b) * v, a += (1 - a) * v;
				}
				Q = .83 + .15 * a + .015 * q;
			};
			case `crackleglaze`: return () => {
				let e = G * 16 + .6 * (noise(G, K, 4, 4, r ^ 13741) - .5), t = K * 16 + .6 * (noise(G, K, 4, 4, r ^ 29123) - .5), n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let r = -1; r <= 1; r++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = i + r, l = ((c % 16 + 16) % 16 * 16 + (s % 16 + 16) % 16) * 26, u = e - s - He[l], d = t - c - He[l + 1], f = 1;
					for (let e = 0; e < 8; e++) {
						let t = l + 2 + e * 3;
						f *= smooth(clamp((He[t + 2] - u * He[t] - d * He[t + 1]) / .024));
					}
					a += f;
				}
				let o = 1 - clamp(a);
				Y = (.87 + .035 * q) * (1 - o) + .08 * o, X = .54 - .12 * o, Z += .14 * o + .015 * (q - .5), Q = 1 - .14 * o;
			};
			case `flutedceramic`: return () => {
				let e = .5 + .5 * Math.cos(n * 8 * G + a), t = smooth(clamp((noise(G, K, 96, 96, r ^ 24361) - .65) / .28));
				Y = .88 + .035 * q - .12 * t, X = .2 + .6 * e, Z += .035 * (1 - e) + .025 * t, Q = .92 + .08 * e;
			};
			case `encaustictiles`: return () => {
				let e = fract(G * 4), t = fract(K * 4), n = smooth(clamp((Math.min(e, 1 - e) - .02) / .08)) * smooth(clamp((Math.min(t, 1 - t) - .02) / .08)), r = e - .5, i = t - .5, a = r * s + i * c, o = i * s - r * c, l = 0;
				for (let e = 0; e < 4; e++) {
					let t = e < 2 ? a : o, n = e < 2 ? o : a, r = (t - (e % 2 == 0 ? .16 : -.16)) / .19, i = n / .085, s = smooth(clamp((1 - r * r - i * i) / .22));
					l += (1 - l) * s;
				}
				let u = r * r + i * i, d = smooth(clamp((u - .135) / .008)) * (1 - smooth(clamp((u - .158) / .008)));
				Y = .94 - .84 * (l + (1 - l) * d) + .012 * (q - .5), X = .18 + .4 * n, $ = 1 - n, Z += .12 * $ + .035 * (q - .5), Q = .77 + .23 * n;
			};
			case `breadcrust`: return () => {
				let e = G * 7, t = K * 7, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0, s = 0;
				for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + r, d = ((u % 7 + 7) % 7 * 7 + (l % 7 + 7) % 7) * 27, f = e - l - Xe[d], p = t - u - Xe[d + 1], m = 1, h = 1;
					for (let e = 0; e < 8; e++) {
						let t = d + 3 + e * 3, n = Xe[t + 2] - f * Xe[t] - p * Xe[t + 1];
						m *= smooth(clamp((n - .025) / .14)), h *= smooth(clamp((n - .025) / .5));
					}
					a += m, o += h, s += m * Xe[d + 2];
				}
				let c = noise(G, K, 19, 23, r ^ 18371);
				Y = .06 + a * (.42 + .21 * c) + .2 * s, X = .12 + .42 * a + .26 * o + .012 * a * (q - .5), Z += .08 * (1 - a) + .035 * (c - .5), Q = .65 + .35 * a;
			};
			case `wafer`: return () => {
				let e = fract(G * 12), t = fract(K * 12), n = smooth(clamp((Math.min(e, 1 - e) - .07) / .17)) * smooth(clamp((Math.min(t, 1 - t) - .07) / .17)), i = noise(G, K, 24, 24, r ^ 27953);
				Y = .46 + .27 * n + .12 * i + .035 * q, X = .72 - .5 * n + .008 * (q - .5), Z += .06 * n + .02 * (i - .5), Q = 1 - .23 * n;
			};
			case `chocolate`: return () => {
				let e = fract(G * 4), t = fract(K * 4), n = smooth(clamp((Math.min(e, 1 - e) - .035) / .105)) * smooth(clamp((Math.min(t, 1 - t) - .035) / .105)), i = noise(G, K, 4, 4, r ^ 12729);
				Y = .18 + .46 * n + .065 * i + .008 * q, X = .14 + .65 * n, Z += .1 * (1 - n) + .008 * (i - .5), Q = .73 + .27 * n;
			};
			case `pretzel`: return () => {
				let e = smooth(clamp((.18 - Math.abs(fract((G + K) * 3) - .5)) / .12)), t = smooth(clamp((.18 - Math.abs(fract((G - K) * 3) - .5)) / .12)), n = e + t - e * t, i = e * t, a = smooth(clamp((noise(G, K, 24, 24, r ^ 6575) - .78) / .06)), o = noise(G, K, 16, 16, r ^ 12081);
				Y = .42 + .28 * n + .1 * i + .1 * a + .06 * o, X = .42 + .22 * n + .1 * i + .04 * a + .015 * o, Z += .06 * (o - .5) - .12 * i - .18 * a, Q = 1 - .34 * (1 - n) - .1 * (1 - i);
			};
			case `bagel`: return () => {
				let e = Math.min(Math.abs(G - .5), 1 - Math.abs(G - .5)), t = Math.min(Math.abs(K - .5), 1 - Math.abs(K - .5)), n = Math.hypot(e, t) * 2, i = smooth(clamp((.12 - Math.abs(n - .34)) / .06)), a = smooth(clamp((.16 - n) / .08)), o = smooth(clamp((noise(G, K, 20, 20, r ^ 19485) - .78) / .06)), s = noise(G, K, 16, 16, r ^ 23342);
				Y = .44 + .3 * i - .16 * a + .12 * o + .06 * s, X = .46 + .26 * i - .16 * a + .05 * o + .02 * s, Z += .06 * (s - .5) - .1 * i - .18 * o, Q = 1 - .3 * a - .14 * (1 - i);
			};
			case `croissant`: return () => {
				let e = fract((G + K) * 4), t = smooth(clamp((.3 - Math.abs(e - .5)) / .14)), n = smooth(clamp((.12 - Math.min(e, 1 - e)) / .03)), i = noise(G, K, 16, 16, r ^ 27975);
				Y = .44 + .34 * t - .14 * n + .08 * i, X = .44 + .28 * t - .06 * n + .03 * i, Z += .06 * (i - .5) - .12 * t + .1 * n, Q = 1 - .34 * (1 - t) - .1 * n;
			};
			case `butterflywing`: return () => {
				let e = smooth(clamp((.28 - Math.abs(fract(G * 24) - .5)) / .12)) * smooth(clamp((.28 - Math.abs(fract(K * 16) - .5)) / .12)), t = smooth(clamp((.06 - Math.min(fract(G * 3), 1 - fract(G * 3))) / .025)), n = noise(G, K, 6, 6, r ^ 29123), i = noise(G, K, 48, 48, r ^ 10837);
				Y = .42 + .3 * e - .1 * t + .12 * n + .06 * i, X = .44 + .22 * e - .14 * t + .02 * i, Z += .06 * (i - .5) - .1 * e + .12 * t, Q = 1 - .3 * (1 - e) - .24 * t;
			};
			case `beetlewing`: return () => {
				let e = smooth(clamp((.32 - Math.abs(fract(G * 6) - .5)) / .14)), t = smooth(clamp((.12 - Math.min(fract(G * 6), 1 - fract(G * 6))) / .03)), n = smooth(clamp((noise(G, K, 24, 24, r ^ 21930) - .8) / .05)), i = noise(G, K, 32, 32, r ^ 14833);
				Y = .42 + .32 * e - .12 * t - .1 * n + .06 * i, X = .44 + .26 * e - .1 * t - .06 * n + .02 * i, Z += .06 * (i - .5) - .12 * e + .1 * t, Q = 1 - .3 * t - .14 * (1 - e) - .18 * n;
			};
			case `spiderweb`: return () => {
				let e = smooth(clamp((.012 - Math.abs(G - .5)) / .008)), t = smooth(clamp((.012 - Math.abs(K - .5)) / .008)), n = Math.abs(G - K), i = Math.abs(G + K - 1), a = smooth(clamp((.012 - Math.min(n, 1 - n)) / .008)), o = smooth(clamp((.012 - Math.min(i, 1 - i)) / .008)), s = 1 - (1 - e) * (1 - t) * (1 - a) * (1 - o), c = Math.hypot(Math.sin(Math.PI * (G - .5)), Math.sin(Math.PI * (K - .5))) * (2 / Math.PI), l = .5 + .5 * Math.cos(Math.PI * 2 * (fract(c * 6) - .5)), u = 1 - (1 - s) * (1 - l), d = smooth(clamp((noise(G, K, 20, 20, r ^ 32033) - .82) / .08)), f = noise(G, K, 32, 32, r ^ 7012);
				Y = .4 + .3 * u + .12 * d + .08 * f, X = .42 + .2 * u + .05 * d + .02 * f, Z += .06 * (f - .5) - .16 * u - .1 * d, Q = 1 - .34 * (1 - u);
			};
			case `cirrus`: return () => {
				let e = noise(G, K, 3, 3, r ^ 9029) - .5, t = smooth(clamp((.3 - Math.abs(fract((K + .18 * e) * 6) - .5)) / .16)), n = noise(G, K, 32, 16, r ^ 13398);
				Y = .46 + .34 * t + .08 * n, X = .46 + .22 * t + .02 * n, Z += .06 * (n - .5) - .12 * t, Q = 1 - .32 * (1 - t);
			};
			case `cumulus`: return () => {
				let e = smooth(clamp((noise(G, K, 5, 5, r ^ 17767) - .42) / .18)), t = noise(G, K, 12, 12, r ^ 22136);
				Y = .48 + .36 * e + .08 * t, X = .44 + .3 * e + .02 * t, Z += .06 * (t - .5) - .1 * e, Q = 1 - .36 * (1 - e);
			};
			case `lightning`: return () => {
				let e = noise(G, K, 4, 4, r ^ 26505) - .5, t = fract((G + K) * 3 + .35 * e), n = smooth(clamp((.022 - Math.abs(t - .5)) / .012)), i = smooth(clamp((.16 - Math.abs(t - .5)) / .14)), a = noise(G, K, 32, 32, r ^ 30874);
				Y = .22 + .3 * i + .4 * n + .06 * a, X = .44 + .16 * i + .18 * n + .02 * a, Z += .06 * (a - .5) - .14 * n, Q = 1 - .36 * (1 - i) - .14 * (1 - n);
			};
			case `kelp`: return () => {
				let e = noise(G, K, 4, 4, r ^ 4386) - .5, t = smooth(clamp((.32 - Math.abs(fract((K + .12 * e) * 4) - .5)) / .16)), n = smooth(clamp((noise(G, K, 8, 8, r ^ 8755) - .68) / .08)), i = noise(G, K, 24, 24, r ^ 13124);
				Y = .44 + .3 * t + .1 * n + .08 * i, X = .44 + .28 * t + .05 * n + .02 * i, Z += .08 * (i - .5) - .22 * n - .1 * t, Q = 1 - .36 * (1 - t) - .1 * (1 - n);
			};
			case `seaweed`: return () => {
				let e = noise(G, K, 3, 3, r ^ 17493) - .5, t = smooth(clamp((.05 - Math.abs(fract((G + K) * 3 + .3 * e) - .5)) / .03)), n = smooth(clamp((.05 - Math.abs(fract((G - K) * 3 + .3 * e) - .5)) / .03)), i = t + n - t * n, a = noise(G, K, 24, 24, r ^ 21862);
				Y = .42 + .3 * i + .08 * a, X = .44 + .22 * i + .02 * a, Z += .06 * (a - .5) - .12 * i, Q = 1 - .34 * (1 - i);
			};
			case `anemone`: return () => {
				let e = Math.hypot(Math.sin(Math.PI * (G - .5)), Math.sin(Math.PI * (K - .5))) * (2 / Math.PI), t = smooth(clamp((e - .12) / .08)), n = (.5 + .5 * Math.cos(Math.PI * 2 * (fract(e * 8) - .5))) * t, i = smooth(clamp((.12 - e) / .06)), a = noise(G, K, 24, 24, r ^ 26231);
				Y = .42 + .32 * n - .12 * i + .08 * a, X = .44 + .26 * n - .12 * i + .02 * a, Z += .06 * (a - .5) - .12 * n, Q = 1 - .3 * i - .12 * (1 - n) * t;
			};
			case `candy`: return () => {
				let e = fract((G + K) * 4), t = smooth(clamp((.34 - Math.abs(e - .5)) / .12)), n = smooth(clamp((.1 - Math.min(e, 1 - e)) / .03)), i = noise(G, K, 16, 16, r ^ 30600);
				Y = .42 + .36 * t - .12 * n + .08 * i, X = .44 + .26 * t - .06 * n + .02 * i, Z += .08 * (i - .5) - .12 * t, Q = 1 - .32 * (1 - t) - .12 * n;
			};
			case `marshmallow`: return () => {
				let e = fract((G + K) * 5), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((noise(G, K, 20, 20, r ^ 34969) - .7) / .1)), i = noise(G, K, 24, 24, r ^ 39338);
				Y = .5 + .3 * t + .1 * n + .06 * i, X = .44 + .28 * t + .05 * n + .02 * i, Z += .06 * (i - .5) - .08 * t, Q = 1 - .32 * (1 - t);
			};
			case `nougat`: return () => {
				let e = smooth(clamp((noise(G, K, 6, 6, r ^ 43707) - .55) / .12)), t = smooth(clamp((noise(G, K, 16, 16, r ^ 48076) - .72) / .05)), n = noise(G, K, 24, 24, r ^ 52445);
				Y = .44 + .3 * e - .12 * t + .08 * n, X = .44 + .24 * e - .1 * t + .02 * n, Z += .08 * (n - .5) - .1 * e + .12 * t, Q = 1 - .34 * (1 - e) - .18 * t;
			};
			case `frostedglass`: return () => {
				let e = smooth(clamp((noise(G, K, 32, 32, r ^ 56593) - .42) / .16)), t = noise(G, K, 64, 64, r ^ 60962);
				Y = .5 + .26 * e + .08 * t, X = .46 + .18 * e + .02 * t, Z += .08 * (t - .5) - .1 * e, Q = 1 - .28 * (1 - e);
			};
			case `rippledglass`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 6) - .5)), t = noise(G, K, 32, 32, r ^ 65331);
				Y = .48 + .32 * e + .08 * t, X = .46 + .26 * e + .02 * t, Z += .08 * (t - .5) - .12 * e, Q = 1 - .3 * (1 - e);
			};
			case `bubbleglass`: return () => {
				let e = fract(G * 8) - .5, t = fract(K * 8) - .5, n = smooth(clamp((.34 - Math.hypot(e, t)) / .14)), i = noise(G, K, 32, 32, r ^ 6724);
				Y = .48 + .32 * n + .08 * i, X = .46 + .24 * n + .02 * i, Z += .08 * (i - .5) - .12 * n, Q = 1 - .3 * (1 - n);
			};
			case `saddlestitch`: return () => {
				let e = (G - K) * 2 - .25, t = smooth(clamp((.05 - Math.min(fract(e), 1 - fract(e))) / .03)) * smooth(clamp((.3 - Math.abs(fract((G + K) * 8) - .5)) / .12)), n = noise(G, K, 24, 24, r ^ 11093);
				Y = .42 + .3 * t + .08 * n, X = .44 + .24 * t + .02 * n, Z += .06 * (n - .5) - .12 * t, Q = 1 - .32 * (1 - t);
			};
			case `tooledleather`: return () => {
				let e = fract(G * 4) - .5, t = fract(K * 4) - .5, n = Math.hypot(e, t), i = smooth(clamp((.36 - n) / .16)), a = smooth(clamp((.035 - Math.abs(n - .18)) / .02)), o = noise(G, K, 24, 24, r ^ 15462);
				Y = .42 + .26 * i + .1 * a + .08 * o, X = .44 + .22 * i + .08 * a + .02 * o, Z += .06 * (o - .5) - .1 * i, Q = 1 - .34 * (1 - i);
			};
			case `patentleather`: return () => {
				let e = smooth(clamp((noise(G, K, 32, 32, r ^ 19831) - .42) / .16)), t = noise(G, K, 6, 6, r ^ 24200);
				Y = .44 + .18 * e + .16 * t, X = .46 + .16 * e + .02 * t, Z += .08 * (e - .5), Q = 1 - .18 * (1 - e);
			};
			case `appleskin`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(K * 5) - .5)), t = smooth(clamp((noise(G, K, 28, 28, r ^ 28569) - .8) / .05)), n = noise(G, K, 32, 32, r ^ 31402);
				Y = .44 + .32 * e + .1 * t + .06 * n, X = .46 + .2 * e + .05 * t + .02 * n, Z += .06 * (n - .5) - .12 * e, Q = 1 - .3 * (1 - e) - .1 * (1 - t);
			};
			case `peachskin`: return () => {
				let e = smooth(clamp((.045 - Math.abs(G - .5)) / .025)), t = noise(G, K, 32, 32, r ^ 35771);
				Y = .46 + .3 * noise(G, K, 6, 6, r ^ 40140) - .12 * e + .08 * t, X = .46 + .06 * t - .16 * e, Z += .08 * (t - .5) + .1 * e, Q = 1 - .4 * e;
			};
			case `grapeskin`: return () => {
				let e = smooth(clamp((noise(G, K, 6, 6, r ^ 44509) - .5) / .16)), t = noise(G, K, 32, 32, r ^ 48878);
				Y = .46 + .28 * e + .08 * t, X = .46 + .18 * e + .02 * t, Z += .12 * (e - .5) * 2 + .06 * (t - .5), Q = 1 - .3 * (1 - e);
			};
			case `broccoli`: return () => {
				let e = smooth(clamp((noise(G, K, 10, 10, r ^ 53009) - .45) / .14)), t = smooth(clamp((noise(G, K, 28, 28, r ^ 53282) - .58) / .1)), n = noise(G, K, 32, 32, r ^ 57651);
				Y = .42 + .3 * e + .12 * t + .06 * n, X = .44 + .24 * e + .08 * t + .02 * n, Z += .06 * (n - .5) - .08 * e, Q = 1 - .36 * (1 - e) - .1 * (1 - t);
			};
			case `cabbage`: return () => {
				let e = fract((G + K) * 3), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((.045 - Math.min(fract(G * 3), 1 - fract(G * 3))) / .025)) + smooth(clamp((.045 - Math.min(fract(K * 3), 1 - fract(K * 3))) / .025)), i = noise(G, K, 24, 24, r ^ 62020);
				Y = .44 + .3 * t - .12 * Math.min(n, 1) + .08 * i, X = .44 + .26 * t - .1 * Math.min(n, 1) + .02 * i, Z += .06 * (i - .5) - .1 * t, Q = 1 - .34 * (1 - t) - .12 * Math.min(n, 1);
			};
			case `onion`: return () => {
				let e = fract((G + K) * 6), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((.035 - Math.abs(fract((G - K) * 8) - .5)) / .02)), i = noise(G, K, 24, 24, r ^ 4949);
				Y = .44 + .3 * t + .1 * n + .06 * i, X = .44 + .24 * t + .05 * n + .02 * i, Z += .06 * (i - .5) - .1 * t, Q = 1 - .32 * (1 - t);
			};
			case `bedsheet`: return () => {
				let e = noise(G, K, 4, 4, r ^ 9318) - .5, t = smooth(clamp((.3 - Math.abs(fract((K + .16 * e) * 4) - .5)) / .16)), n = noise(G, K, 32, 32, r ^ 13687);
				Y = .5 + .3 * t + .08 * n, X = .46 + .22 * t + .02 * n, Z += .06 * (n - .5) - .1 * t, Q = 1 - .3 * (1 - t);
			};
			case `pillow`: return () => {
				let e = fract(G * 2) - .5, t = fract(K * 2) - .5, n = smooth(clamp((.36 - Math.hypot(e, t)) / .16)), i = smooth(clamp((.045 - Math.min(fract(G * 2), 1 - fract(G * 2))) / .025)) + smooth(clamp((.045 - Math.min(fract(K * 2), 1 - fract(K * 2))) / .025)), a = noise(G, K, 32, 32, r ^ 22425);
				Y = .5 + .3 * n - .1 * Math.min(i, 1) + .06 * a, X = .44 + .24 * n - .12 * Math.min(i, 1) + .02 * a, Z += .06 * (a - .5) - .08 * n, Q = 1 - .34 * (1 - n) - .12 * Math.min(i, 1);
			};
			case `mattress`: return () => {
				let e = fract(G * 4) - .5, t = fract(K * 4) - .5, n = smooth(clamp((.18 - Math.hypot(e, t)) / .08)), i = noise(G, K, 24, 24, r ^ 26794);
				Y = .46 + .3 * (1 - n) * .4 + .1 * i, X = .46 + .12 * i - .2 * n, Z += .06 * (i - .5), Q = 1 - .42 * n;
			};
			case `tealeaf`: return () => {
				let e = smooth(clamp((noise(G, K, 6, 6, r ^ 31163) - .48) / .14)), t = smooth(clamp((noise(G, K, 14, 14, r ^ 35532) - .62) / .1)), n = noise(G, K, 32, 32, r ^ 39901);
				Y = .42 + .3 * e + .12 * t + .06 * n, X = .44 + .22 * e + .08 * t + .02 * n, Z += .06 * (n - .5) - .08 * e, Q = 1 - .36 * (1 - e) - .1 * (1 - t);
			};
			case `matcha`: return () => {
				let e = fract((G + K) * 5), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = noise(G, K, 32, 32, r ^ 44782);
				Y = .46 + .3 * t + .08 * n, X = .46 + .2 * t + .02 * n, Z += .06 * (n - .5) - .08 * t, Q = 1 - .3 * (1 - t);
			};
			case `teabag`: return () => {
				let e = smooth(clamp((.12 - Math.abs(fract(G * 24) - .5)) / .06)), t = smooth(clamp((.12 - Math.abs(fract(K * 24) - .5)) / .06)), n = e + t - e * t, i = noise(G, K, 6, 6, r ^ 49151), a = noise(G, K, 32, 32, r ^ 49425);
				Y = .46 + .28 * n + .1 * i + .06 * a, X = .46 + .2 * n + .02 * a, Z += .06 * (a - .5) - .1 * n, Q = 1 - .34 * (1 - n);
			};
			case `sanddune`: return () => {
				let e = fract((G + K) * 6), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = noise(G, K, 32, 32, r ^ 53794);
				Y = .46 + .3 * t + .08 * n, X = .46 + .2 * t + .02 * n, Z += .06 * (n - .5) - .1 * t, Q = 1 - .3 * (1 - t);
			};
			case `pebblebeach`: return () => {
				let e = fract(G * 5) - .5, t = fract(K * 5) - .5, n = smooth(clamp((.34 - Math.hypot(e, t)) / .14)), i = noise(G, K, 32, 32, r ^ 58163);
				Y = .44 + .32 * n + .08 * i, X = .44 + .26 * n + .02 * i, Z += .06 * (i - .5) - .12 * n, Q = 1 - .34 * (1 - n);
			};
			case `foamedge`: return () => {
				let e = smooth(clamp((noise(G, K, 8, 8, r ^ 62532) - .46) / .16)), t = smooth(clamp((noise(G, K, 24, 24, r ^ 5461) - .7) / .08)), n = noise(G, K, 32, 32, r ^ 9830);
				Y = .48 + .3 * e + .12 * t + .06 * n, X = .44 + .22 * e + .06 * t + .02 * n, Z += .06 * (n - .5) - .1 * e, Q = 1 - .34 * (1 - e) - .1 * (1 - t);
			};
			case `lavaflow`: return () => {
				let e = fract((G + K) * 5), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((.08 - Math.min(e, 1 - e)) / .04)), i = noise(G, K, 12, 12, r ^ 14199), a = noise(G, K, 32, 32, r ^ 18568);
				Y = .34 + .34 * t - .12 * n + .16 * i + .06 * a, X = .44 + .26 * t - .1 * n + .02 * a, Z += .06 * (a - .5) - .12 * t + .12 * n, Q = 1 - .32 * (1 - t) - .18 * n;
			};
			case `cooledlava`: return () => {
				let e = Math.min(fract(G * 4), 1 - fract(G * 4)), t = Math.min(fract(K * 4), 1 - fract(K * 4)), n = smooth(clamp((Math.min(e, t) - .03) / .1)), i = smooth(clamp((noise(G, K, 20, 20, r ^ 22937) - .74) / .06)), a = noise(G, K, 32, 32, r ^ 27306);
				Y = .4 + .3 * n - .1 * i + .08 * a, X = .42 + .24 * n - .08 * i + .02 * a, Z += .06 * (a - .5) + .1 * i, Q = 1 - .34 * (1 - n) - .18 * i;
			};
			case `ashfield`: return () => {
				let e = smooth(clamp((noise(G, K, 8, 8, r ^ 31675) - .44) / .18)), t = noise(G, K, 32, 32, r ^ 36044);
				Y = .44 + .28 * e + .08 * t, X = .44 + .22 * e + .02 * t, Z += .06 * (t - .5), Q = 1 - .32 * (1 - e);
			};
			case `stalactite`: return () => {
				let e = fract(G * 4) - .5, t = fract(K * 4) - .5, n = smooth(clamp((.32 - Math.hypot(e, t)) / .16)), i = smooth(clamp((noise(G, K, 20, 20, r ^ 40413) - .7) / .08)), a = noise(G, K, 32, 32, r ^ 44782);
				Y = .44 + .3 * n + .1 * i + .06 * a, X = .44 + .26 * n + .05 * i + .02 * a, Z += .06 * (a - .5) - .1 * n, Q = 1 - .36 * (1 - n) - .1 * (1 - i);
			};
			case `flowstone`: return () => {
				let e = fract((G + K) * 5), t = smooth(clamp((.34 - Math.abs(e - .5)) / .12)), n = noise(G, K, 24, 24, r ^ 49151), i = noise(G, K, 32, 32, r ^ 49425);
				Y = .46 + .3 * t + .08 * n + .06 * i, X = .44 + .26 * t + .04 * n + .02 * i, Z += .06 * (i - .5) - .1 * t, Q = 1 - .32 * (1 - t);
			};
			case `cavefloor`: return () => {
				let e = smooth(clamp((noise(G, K, 8, 8, r ^ 53794) - .46) / .16)), t = smooth(clamp((noise(G, K, 5, 5, r ^ 58163) - .72) / .06)), n = noise(G, K, 32, 32, r ^ 62532);
				Y = .42 + .28 * e + .12 * t + .08 * n, X = .44 + .2 * e - .1 * t + .02 * n, Z += .06 * (n - .5) + .2 * t, Q = 1 - .34 * (1 - e) - .1 * t;
			};
			case `jam`: return () => {
				let e = fract(G * 5) - .5, t = fract(K * 5) - .5, n = smooth(clamp((.3 - Math.hypot(e, t)) / .14)), i = noise(G, K, 16, 16, r ^ 5461), a = noise(G, K, 32, 32, r ^ 9830);
				Y = .42 + .32 * n + .12 * i + .06 * a, X = .44 + .22 * n + .02 * a, Z += .1 * (a - .5) - .12 * n, Q = 1 - .32 * (1 - n);
			};
			case `peanutbutter`: return () => {
				let e = smooth(clamp((noise(G, K, 10, 10, r ^ 14199) - .6) / .1)), t = noise(G, K, 6, 6, r ^ 18568), n = noise(G, K, 32, 32, r ^ 22937);
				Y = .46 + .28 * e + .1 * t + .06 * n, X = .44 + .18 * e + .04 * t + .02 * n, Z += .06 * (n - .5) - .1 * e, Q = 1 - .3 * (1 - e);
			};
			case `sprinkles`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 6) - .5)), t = Math.sin(Math.PI * (fract(K * 6) - .5)), n = clamp((.32 - Math.hypot(e * .5, t * 2)) / .32), i = .5 - .5 * Math.cos(Math.PI * n), a = noise(G, K, 32, 32, r ^ 27306);
				Y = .52 + .28 * i + .08 * a, X = .44 + .22 * i + .02 * a, Z += .06 * (a - .5) - .12 * i, Q = 1 - .32 * (1 - i);
			};
			case `icecream`: return () => {
				let e = fract((G + K) * 5), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((noise(G, K, 16, 16, r ^ 31675) - .72) / .08)), i = noise(G, K, 32, 32, r ^ 36044);
				Y = .52 + .28 * t + .1 * n + .06 * i, X = .44 + .24 * t + .05 * n + .02 * i, Z += .06 * (i - .5) - .1 * t, Q = 1 - .3 * (1 - t) - .1 * (1 - n);
			};
			case `popsicle`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(K * 8) - .5)), t = noise(G, K, 24, 24, r ^ 40413), n = noise(G, K, 32, 32, r ^ 44782);
				Y = .46 + .3 * e + .1 * t + .06 * n, X = .44 + .22 * e + .04 * t + .02 * n, Z += .08 * (n - .5) - .1 * e, Q = 1 - .32 * (1 - e);
			};
			case `sorbet`: return () => {
				let e = fract((G - K) * 6), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((noise(G, K, 12, 12, r ^ 49151) - .68) / .1)), i = noise(G, K, 32, 32, r ^ 49425);
				Y = .46 + .28 * t + .12 * n + .06 * i, X = .44 + .2 * t + .06 * n + .02 * i, Z += .06 * (i - .5) - .1 * t, Q = 1 - .3 * (1 - t) - .1 * (1 - n);
			};
			case `spaghetti`: return () => {
				let e = noise(G, K, 4, 4, r ^ 53794) - .5, t = smooth(clamp((.32 - Math.abs(fract((K + .12 * e) * 6) - .5)) / .16)), n = noise(G, K, 8, 8, r ^ 58163), i = noise(G, K, 32, 32, r ^ 62532);
				Y = .5 + .3 * t + .1 * n + .06 * i, X = .46 + .22 * t + .02 * i, Z += .06 * (i - .5) - .1 * t, Q = 1 - .32 * (1 - t);
			};
			case `macaroni`: return () => {
				let e = Math.min(fract(G * 4), 1 - fract(G * 4)), t = Math.min(fract(K * 4), 1 - fract(K * 4)), n = smooth(clamp((Math.min(e, t) - .03) / .12)), a = smooth(clamp((.12 - Math.hypot(fract(G * 4) - .5, fract(K * 4) - .5)) / .06)), o = noise(G, K, 32, 32, r ^ 5461);
				Y = .5 + .3 * n - .12 * a + .06 * o, X = .46 + .2 * n - .14 * a + .02 * o, Z += .06 * (o - .5) - .1 * n, Q = 1 - .34 * (1 - n) - .2 * a;
			};
			case `lasagna`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(K * 4) - .5)), t = smooth(clamp((noise(G, K, 14, 14, r ^ 9830) - .68) / .1)), n = noise(G, K, 32, 32, r ^ 14199);
				Y = .44 + .32 * e + .1 * t + .06 * n, X = .44 + .24 * e + .05 * t + .02 * n, Z += .06 * (n - .5) - .1 * e, Q = 1 - .32 * (1 - e);
			};
			case `origami`: return () => {
				let e = Math.abs(fract((G + K) * 2) - .5), t = Math.abs(fract((G - K) * 2) - .5), n = smooth(clamp((.34 - e) / .16)) + smooth(clamp((.34 - t) / .16)) - smooth(clamp((.34 - e) / .16)) * smooth(clamp((.34 - t) / .16)), i = smooth(clamp((.05 - Math.min(fract((G + K) * 2), 1 - fract((G + K) * 2))) / .025)) + smooth(clamp((.05 - Math.min(fract((G - K) * 2), 1 - fract((G - K) * 2))) / .025)), a = noise(G, K, 32, 32, r ^ 18568);
				Y = .46 + .3 * n - .1 * Math.min(i, 1) + .06 * a, X = .44 + .24 * n - .1 * Math.min(i, 1) + .02 * a, Z += .06 * (a - .5) - .08 * n, Q = 1 - .3 * (1 - n) - .12 * Math.min(i, 1);
			};
			case `paperlace`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 6) - .5)), t = Math.sin(Math.PI * (fract(K * 6) - .5)), n = smooth(clamp((.16 - Math.hypot(e, t)) / .07)), i = noise(G, K, 32, 32, r ^ 22937);
				Y = .52 + .28 * (1 - n) + .06 * i, X = .46 + .2 * (1 - n) + .02 * i, Z += .06 * (i - .5) + .1 * n, Q = 1 - .36 * n;
			};
			case `papercut`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 5) - .5)), t = Math.sin(Math.PI * (fract(K * 5) - .5)), n = smooth(clamp((.5 - Math.hypot(e * .7, t)) / .2)), i = noise(G, K, 32, 32, r ^ 27306);
				Y = .42 + .34 * n + .08 * i, X = .44 + .24 * n + .02 * i, Z += .06 * (i - .5) - .08 * n, Q = 1 - .32 * (1 - n);
			};
			case `sunflower`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 10) - .5)), t = Math.sin(Math.PI * (fract(K * 10) - .5)), n = clamp((.6 - Math.hypot(e * .9, t * 1.4)) / .6), i = .5 - .5 * Math.cos(Math.PI * n), a = noise(G, K, 32, 32, r ^ 31675);
				Y = .44 + .3 * i + .08 * a, X = .44 + .24 * i + .02 * a, Z += .06 * (a - .5) - .1 * i, Q = 1 - .32 * (1 - i);
			};
			case `daisy`: return () => {
				let e = Math.sin(Math.PI * (G - .5)), t = Math.sin(Math.PI * (K - .5)), n = Math.hypot(e, t), i = (.5 + .5 * Math.cos(Math.atan2(t, e) * 12)) * smooth(clamp((n - .16) / .1)) * smooth(clamp((.6 - n) / .1)), a = smooth(clamp((.16 - n) / .06)), o = noise(G, K, 32, 32, r ^ 36044);
				Y = .46 + .32 * i - .12 * a + .06 * o, X = .44 + .22 * i - .1 * a + .02 * o, Z += .06 * (o - .5) - .08 * i, Q = 1 - .3 * (1 - i) - .14 * a;
			};
			case `clover`: return () => {
				let e = Math.sin(Math.PI * (G - .5)), t = Math.sin(Math.PI * (K - .5)), n = Math.hypot(e, t), i = (.5 + .5 * Math.cos(Math.atan2(t, e) * 3)) * smooth(clamp((.5 - n) / .14)), a = noise(G, K, 12, 12, r ^ 40413), o = noise(G, K, 32, 32, r ^ 44782);
				Y = .4 + .34 * i + .08 * a + .06 * o, X = .42 + .24 * i + .03 * a + .02 * o, Z += .06 * (o - .5) - .08 * i, Q = 1 - .34 * (1 - i);
			};
			case `puzzletile`: return () => {
				let e = Math.min(fract(G * 2), 1 - fract(G * 2)), t = Math.min(fract(K * 2), 1 - fract(K * 2)), n = smooth(clamp((Math.min(e, t) - .02) / .05)), i = smooth(clamp((.13 - Math.hypot(e, fract(K * 2) - .5)) / .05)), a = smooth(clamp((.13 - Math.hypot(t, fract(G * 2) - .5)) / .05)), o = 1 - (1 - n) * (1 - i) * (1 - a), s = noise(G, K, 32, 32, r ^ 48076);
				Y = .44 + .3 * o + .08 * s, X = .44 + .24 * o + .02 * s, Z += .06 * (s - .5) - .1 * o, Q = 1 - .34 * (1 - o);
			};
			case `legobrick`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 4) - .5)), t = Math.sin(Math.PI * (fract(K * 4) - .5)), n = clamp((.55 - Math.hypot(e * .8, t * .8)) / .55), i = .5 - .5 * Math.cos(Math.PI * n), a = noise(G, K, 32, 32, r ^ 52700);
				Y = .46 + .3 * i + .06 * a, X = .44 + .24 * i + .02 * a, Z += .06 * (a - .5) - .1 * i, Q = 1 - .3 * (1 - i);
			};
			case `rubberband`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(K * 3) - .5)), t = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 3) - .5)), n = e + t - e * t, i = noise(G, K, 32, 32, r ^ 56814);
				Y = .42 + .3 * n + .08 * i, X = .44 + .2 * n + .02 * i, Z += .06 * (i - .5) - .1 * n, Q = 1 - .32 * (1 - n);
			};
			case `haybale`: return () => {
				let e = noise(G, K, 3, 3, r ^ 58436) - .5, t = .5 + .5 * Math.cos(Math.PI * 2 * (fract((G + K + .008 * e) * 10) - .5)), n = smooth(clamp((.08 - Math.min(fract(G * 3), 1 - fract(G * 3))) / .04)), i = noise(G, K, 32, 32, r ^ 62805);
				Y = .46 + .3 * t - .1 * n + .08 * i, X = .44 + .22 * t - .1 * n + .02 * i, Z += .06 * (i - .5) - .1 * t + .08 * n, Q = 1 - .32 * (1 - t) - .14 * n;
			};
			case `corncrib`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(K * 4) - .5)), t = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 3) - .5)), n = e + t - e * t, i = noise(G, K, 32, 32, r ^ 5734);
				Y = .4 + .32 * n + .08 * i, X = .42 + .24 * n + .02 * i, Z += .06 * (i - .5) - .1 * n, Q = 1 - .34 * (1 - n);
			};
			case `fencepost`: return () => {
				let e = fract(G * 6), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((.03 - Math.min(e, 1 - e)) / .015)), i = smooth(clamp((noise(G, K, 10, 10, r ^ 10103) - .72) / .08)), a = noise(G, K, 32, 32, r ^ 14472);
				Y = .44 + .3 * t - .12 * n + .08 * i + .06 * a, X = .44 + .22 * t - .1 * n + .02 * a, Z += .06 * (a - .5) - .08 * t + .1 * n, Q = 1 - .32 * (1 - t) - .16 * n;
			};
			case `poolfelt`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 8) - .5)), t = Math.sin(Math.PI * (fract(K * 8) - .5)), n = smooth(clamp((.18 - Math.hypot(e, t)) / .08)), i = noise(G, K, 32, 32, r ^ 18841);
				Y = .36 + .34 * n + .1 * i, X = .46 + .16 * n + .02 * i, Z += .06 * (i - .5) - .06 * n, Q = 1 - .28 * (1 - n);
			};
			case `icesurface`: return () => {
				let e = noise(G, K, 3, 3, r ^ 23210) - .5, t = .5 + .5 * Math.cos(Math.PI * 2 * (fract((G + K + .008 * e) * 7) - .5)), n = smooth(clamp((noise(G, K, 20, 20, r ^ 27579) - .72) / .08)), i = noise(G, K, 32, 32, r ^ 31948);
				Y = .52 + .28 * t + .1 * n + .08 * i, X = .46 + .18 * t + .04 * n + .02 * i, Z += .08 * (i - .5) + .2 * n, Q = 1 - .3 * (1 - t) - .1 * (1 - n);
			};
			case `climbingwall`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 3) - .5)), t = Math.sin(Math.PI * (fract(K * 3) - .5)), n = clamp((.5 - Math.hypot(e * .8, t)) / .5), i = .5 - .5 * Math.cos(Math.PI * n), a = noise(G, K, 32, 32, r ^ 36317);
				Y = .4 + .34 * i + .08 * a, X = .42 + .28 * i + .02 * a, Z += .06 * (a - .5) - .08 * i, Q = 1 - .36 * (1 - i);
			};
			case `oledpanel`: return () => {
				let e = fract(G * 6), t = fract(K * 6), n = .5 - .5 * Math.cos(Math.PI * 2 * (e - .5)), i = .5 - .5 * Math.cos(Math.PI * 2 * (t - .5)), a = smooth(clamp((n - .74) / .26)), o = smooth(clamp((i - .74) / .26)), s = a + o - a * o, c = fract(e * 3), u = smooth(clamp((.5 - .5 * Math.cos(Math.PI * 2 * (c - .5)) - .8) / .2)), d = s + u - s * u;
				Y = .16 + .84 * (.55 + .45 * hash(Math.floor(e * 3), Math.floor(K * 6), r ^ 6699)) * (1 - d), X = .28 + .44 * (1 - d), Z += .1 * d - .04 * (1 - d), Q = 1 - .34 * d;
			};
			case `crtscanline`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(K * 10) - .5)), t = noise(G, K, 32, 32, r ^ 11068), n = noise(G, K, 64, 64, r ^ 15437);
				Y = .1 + .72 * e + .12 * t + .06 * n, X = .24 + .5 * e + .04 * t, Z += .08 * (1 - e) + .06 * (n - .5), Q = 1 - .36 * (1 - e);
			};
			case `keyboardkey`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 6) - .5)), t = Math.sin(Math.PI * (fract(K * 6) - .5)), i = smooth(clamp((.86 - (Math.abs(e) ** 4 + Math.abs(t) ** 4) ** .25) / .5)), a = noise(G, K, 32, 32, r ^ 19806);
				Y = .34 + .4 * i + .08 * a, X = .26 + .46 * i + .04 * a, Z += .06 * (a - .5) - .06 * i, Q = 1 - .34 * (1 - i);
			};
			case `filmstrip`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 4) - .5)), t = Math.sin(Math.PI * (fract(K * 2) - .5)), n = smooth(clamp((.3 - Math.hypot(e, t)) / .28)), i = (1 + Math.cos(Math.PI * 2 * fract(K * 2))) / 2, a = noise(G, K, 16, 32, r ^ 24175);
				Y = (.45 + .2 * a) * (1 - .8 * n) * (1 - .25 * i), X = .62 - .4 * n - .2 * i + .02 * a, Z += .05 * a + .12 * n, Q = 1 - .45 * n - .18 * i;
			};
			case `postagestamp`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 8 + .5) - .5)), t = Math.sin(Math.PI * K), n = Math.sin(Math.PI * (fract(K * 8 + .5) - .5)), i = Math.sin(Math.PI * G), a = Math.hypot(e, t), o = Math.hypot(n, i), s = smooth(clamp((.3 - a) / .28)), c = smooth(clamp((.3 - o) / .28)), l = s + c - s * c, u = smooth(clamp((.4 - Math.hypot(G - .5, K - .5)) / .12)), d = noise(G, K, 32, 32, r ^ 28538);
				Y = (.5 + .28 * u + .1 * d) * (1 - .72 * l), X = .5 + .13 * u - .42 * l + .03 * d, Z += .08 * (d - .5) + .1 * l, Q = 1 - .5 * l;
			};
			case `halftoneprint`: return () => {
				let e = (G + K) * 6, t = (G - K) * 6, n = Math.sin(Math.PI * (fract(e) - .5)), i = Math.sin(Math.PI * (fract(t) - .5)), a = Math.hypot(n, i), o = noise(G, K, 4, 4, r ^ 31371), s = noise(G, K, 64, 64, r ^ 35740), c = smooth(clamp((.28 + .42 * o - a) / .22));
				Y = .28 + .55 * c + .08 * s, X = .35 + .5 * c + .02 * s, Z += .12 * (1 - c) + .05 * (s - .5), Q = 1 - .55 * (1 - c);
			};
			case `radiator`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(G * 5) - .5))) / 2, t = noise(G, K, 32, 32, r ^ 40109);
				Y = .34 + .5 * e + .08 * t, X = .32 + .6 * e + .02 * t, Z += .08 * (t - .5) - .06 * e, Q = 1 - .5 * (1 - e);
			};
			case `screwhead`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 4) - .5)), t = Math.sin(Math.PI * (fract(K * 4) - .5)), n = smooth(clamp((.55 - Math.hypot(e, t)) / .3)), i = 1 - smooth(clamp((Math.abs(e) - .08) / .12)), a = 1 - smooth(clamp((Math.abs(t) - .08) / .12)), o = (i + a - i * a) * n, s = noise(G, K, 32, 32, r ^ 44478);
				Y = .4 + .3 * n - .28 * o + .06 * s, X = .45 + .28 * n - .42 * o, Z += .08 * (s - .5) + .1 * o, Q = 1 - .4 * o - .1 * (1 - n) * (1 - o);
			};
			case `chainlink`: return () => {
				let e = Math.sin(Math.PI * (fract(G + K + .5) - .5)), t = Math.sin(Math.PI * (fract(G - K + .5) - .5)), n = smooth(clamp((.22 - Math.abs(e)) / .18)), i = smooth(clamp((.22 - Math.abs(t)) / .18)), a = n + i - n * i, o = n * i, s = noise(G, K, 32, 32, r ^ 48847);
				Y = .3 + .36 * a + .1 * o + .08 * s, X = .3 + .44 * a + .16 * o + .02 * s, Z += .08 * (s - .5) - .1 * a, Q = 1 - .55 * (1 - a) - .12 * (1 - o);
			};
			case `friedegg`: return () => {
				let e = noise(G, K, 4, 4, r ^ 53200) - .5, t = noise(G, K, 4, 4, r ^ 53473) - .5, n = noise(G, K, 4, 4, r ^ 57842) - .5, i = Math.hypot(G - .5 + .06 * e, K - .5 + .06 * t), a = smooth(clamp((.16 - i) / .06)), o = smooth(clamp((.34 - (i + .1 * n)) / .1)), s = noise(G, K, 32, 32, r ^ 61955);
				Y = .4 + .34 * a + .2 * o + .05 * s, X = .3 + .45 * a + .18 * o + .02 * s, Z += .1 * (1 - a) - .06 * o, Q = .5 + .5 * (a + o - a * o);
			};
			case `sushirice`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 6) - .5)), t = Math.sin(Math.PI * (fract(K * 6) - .5)), n = noise(G, K, 6, 6, r ^ 788) - .5, i = noise(G, K, 6, 6, r ^ 5157) - .5, a = 1 + .16 * (n * (2 * e * e - 1) + i * (2 * t * t - 1)), s = smooth(clamp((.34 - Math.hypot(e * 1.2, t * .8) * a) / .22)), c = noise(G, K, 32, 32, r ^ 9526);
				Y = .62 + .28 * s + .06 * c, X = .34 + .5 * s + .03 * c, Z += .08 * (c - .5) - .08 * s, Q = 1 - .5 * (1 - s);
			};
			case `chocolatechip`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 3) - .5)), t = Math.sin(Math.PI * (fract(K * 3) - .5)), n = Math.hypot(e, t), a = smooth(clamp((.45 + .1 * hash(Math.floor(G * 3), Math.floor(K * 3), r ^ 13895) - n) / .12)), o = noise(G, K, 32, 32, r ^ 18264);
				Y = .62 - .3 * a + .08 * o, X = .36 + .34 * a + .03 * o, Z += .06 * (o - .5) - .1 * a, Q = 1 - .45 * (1 - a);
			};
			case `cargomat`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(G * 4) - .5))) / 2, t = (1 + Math.cos(Math.PI * 2 * fract(K * 2))) / 2, n = noise(G, K, 32, 32, r ^ 22633);
				Y = (.36 + .1 * n) * (1 - .28 * t) * (.55 + .45 * e), X = .28 + .52 * e - .22 * t + .02 * n, Z += .06 * n + .1 * (1 - e), Q = 1 - .4 * (1 - e) - .24 * t;
			};
			case `dashboardgrain`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 10) - .5)), t = Math.sin(Math.PI * (fract(K * 10) - .5)), n = smooth(clamp((.5 - Math.hypot(e, t)) / .34)), i = noise(G, K, 32, 32, r ^ 27002), o = smooth(clamp(((1 + Math.cos(Math.PI * 2 * fract(G * 2))) / 2 - .8) / .2)), s = n * (.7 + .3 * i);
				Y = .42 + .3 * s + .06 * i - .12 * o, X = .34 + .42 * s - .2 * o + .02 * i, Z += .06 * i + .1 * o - .06 * n, Q = 1 - .4 * (1 - n) - .2 * o;
			};
			case `licenseplate`: return () => {
				let e = .5 - .5 * Math.cos(Math.PI * 2 * (G - .5)), t = .5 - .5 * Math.cos(Math.PI * 2 * (K - .5)), n = smooth(clamp((e - .72) / .24)), i = smooth(clamp((t - .72) / .24)), a = n + i - n * i, o = (1 + Math.cos(Math.PI * 2 * (fract(K * 4) - .5))) / 2, s = noise(G, K, 32, 32, r ^ 31371), c = o * (1 - a);
				Y = .44 + .2 * a + .12 * c + .05 * s, X = .3 + .4 * a + .22 * c + .02 * s, Z += .06 * (s - .5) - .1 * a, Q = 1 - .3 * (1 - a) * (1 - o);
			};
			case `flowerbed`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 3) - .5)), t = Math.sin(Math.PI * (fract(K * 3) - .5)), n = Math.hypot(e, t), i = .72 + .28 * (Math.cos(Math.PI * 2 * 3 * (G + K)) * Math.cos(Math.PI * 2 * 3 * (G - K))), a = smooth(clamp((.5 - n) / .3)) * i, o = noise(G, K, 32, 32, r ^ 35740);
				Y = .3 + .32 * a + .1 * o, X = .3 + .5 * a + .03 * o, Z += .08 * (o - .5) - .1 * a, Q = 1 - .5 * (1 - a);
			};
			case `grassstripe`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(K * 2) - .5))) / 2, t = noise(G, K, 48, 8, r ^ 40109), n = noise(G, K, 16, 16, r ^ 44478);
				Y = .34 + .36 * e + .12 * t + .06 * n, X = .3 + .42 * e + .08 * t + .03 * n, Z += .08 * (n - .5) + .06 * (1 - e), Q = 1 - .42 * (1 - e);
			};
			case `topiary`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 3) - .5)), t = Math.sin(Math.PI * (fract(K * 3) - .5)), n = Math.hypot(e, t), i = noise(G, K, 3, 3, r ^ 48847) - .5, a = noise(G, K, 3, 3, r ^ 53200) - .5, s = smooth(clamp((.52 - n * (1 + .16 * (i * (2 * e * e - 1) + a * (2 * t * t - 1)))) / .3)), c = noise(G, K, 32, 32, r ^ 53473);
				Y = .28 + .3 * s + .1 * c, X = .3 + .48 * s + .04 * c, Z += .08 * (c - .5) - .08 * s, Q = 1 - .48 * (1 - s);
			};
			case `confetti`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 4) - .5)), t = Math.sin(Math.PI * (fract(K * 4) - .5)), n = (Math.abs(e) ** 4 + Math.abs(t) ** 4) ** .25, a = smooth(clamp((.52 + .16 * hash(Math.floor(G * 4), Math.floor(K * 4), r ^ 57842) - n) / .12)), o = noise(G, K, 32, 32, r ^ 61955);
				Y = .4 + .3 * a + .1 * o, X = .34 + .4 * a + .03 * o, Z += .06 * (o - .5) - .1 * a, Q = 1 - .44 * (1 - a);
			};
			case `ribbonstreamer`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract((G + K) * 3) - .5))) / 2, t = noise(G, K, 4, 4, r ^ 5157) - .5, n = noise(G, K, 32, 32, r ^ 9526);
				Y = .36 + .34 * e + .12 * n + .08 * t, X = .3 + .46 * e + .03 * n, Z += .08 * (n - .5) - .1 * e, Q = 1 - .46 * (1 - e);
			};
			case `pinatafringe`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(G * 14) - .5))) / 2, t = (1 + Math.cos(Math.PI * 2 * fract(K * 3))) / 2, n = noise(G, K, 32, 32, r ^ 13895);
				Y = .34 + .3 * e + .12 * n - .14 * t, X = .28 + .44 * e - .2 * t + .03 * n, Z += .06 * (n - .5) + .1 * t, Q = 1 - .4 * (1 - e) - .2 * t;
			};
			case `xylophone`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(G * 4) - .5))) / 2, t = smooth(clamp((.18 - Math.hypot(Math.sin(Math.PI * (fract(G * 4) - .5)), Math.sin(Math.PI * (fract(K * 2) - .5)))) / .12)), n = noise(G, K, 32, 8, r ^ 18264);
				Y = .4 + .32 * e + .1 * n - .22 * t, X = .3 + .46 * e - .24 * t + .03 * n, Z += .06 * (n - .5) + .12 * t, Q = 1 - .44 * (1 - e) - .18 * t;
			};
			case `tambourine`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 5) - .5)), t = Math.sin(Math.PI * (fract(K * 5) - .5)), i = smooth(clamp((.46 - Math.hypot(e * 1.35, t * .85)) / .16)), a = noise(G, K, 32, 32, r ^ 22633);
				Y = .38 + .34 * i + .1 * a, X = .32 + .42 * i + .03 * a, Z += .06 * (a - .5) - .12 * i, Q = 1 - .46 * (1 - i);
			};
			case `castanet`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 3) - .5)), t = Math.sin(Math.PI * (fract(K * 3) - .5)), n = Math.hypot(e, t), i = smooth(clamp((.56 - n) / .3)), a = smooth(clamp((.16 - n) / .1)), o = noise(G, K, 32, 32, r ^ 27002);
				Y = .42 + .26 * i - .18 * a + .08 * o, X = .3 + .42 * i - .3 * a, Z += .06 * (o - .5) + .1 * a, Q = 1 - .44 * (1 - i) - .12 * a;
			};
			case `pillcapsule`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 3) - .5)), t = Math.sin(Math.PI * (fract(K * 2) - .5)), i = smooth(clamp((.52 - Math.hypot(e * .72, t * 1.25)) / .3)), a = (1 - smooth(clamp((Math.abs(t) - .06) / .12))) * i, o = noise(G, K, 32, 32, r ^ 31371);
				Y = .46 + .28 * i - .2 * a + .06 * o, X = .3 + .44 * i - .26 * a, Z += .06 * (o - .5) + .12 * a, Q = 1 - .44 * (1 - i) - .12 * a;
			};
			case `pilltablet`: return () => {
				let e = Math.sin(Math.PI * (fract(G * 4) - .5)), t = Math.sin(Math.PI * (fract(K * 4) - .5)), n = smooth(clamp((.62 - Math.hypot(e, t)) / .3)), i = (1 - smooth(clamp((Math.abs(e) - .05) / .1))) * n, a = noise(G, K, 32, 32, r ^ 35740);
				Y = .5 + .26 * n - .2 * i + .06 * a, X = .3 + .42 * n - .24 * i, Z += .06 * (a - .5) + .12 * i, Q = 1 - .44 * (1 - n) - .12 * i;
			};
			case `bathbomb`: return () => {
				let e = Math.sin(Math.PI * (fract((G + K) * 4) - .5)), t = Math.sin(Math.PI * (fract((G - K) * 4) - .5)), n = smooth(clamp((Math.abs(e) - .62) / .2)) + smooth(clamp((Math.abs(t) - .62) / .2)) - smooth(clamp((Math.abs(e) - .62) / .2)) * smooth(clamp((Math.abs(t) - .62) / .2)), i = noise(G, K, 24, 24, r ^ 40109), a = smooth(clamp((i - .34) / .3));
				Y = .42 + .26 * a - .16 * n + .08 * i, X = .34 + .02 * i - .22 * n, Z += .08 * (i - .5) + .12 * n, Q = 1 - .4 * n - .16 * (1 - a);
			};
			case `basketball`: return () => {
				let e = G * F, t = K * F, r = Math.floor(e), i = Math.floor(t), a = 0;
				for (let n = -1; n <= 1; n++) for (let o = -1; o <= 1; o++) {
					let s = r + o, c = i + n, l = ((c % F + F) % F * F + (s % F + F) % F) * Ze, u = e - s - I[l], d = t - c - I[l + 1], f = smooth(clamp(1 - (u * u + d * d) * I[l + 2]));
					a += (1 - a) * f;
				}
				let o = Math.abs(Math.sin(n * (2 * G + .12 * Math.sin(n * K)))), s = Math.abs(Math.sin(n * (2 * K + .12 * Math.sin(n * G)))), c = smooth(clamp((o - .035) / .105)) * smooth(clamp((s - .035) / .105));
				Y = .025 + c * (.64 + .24 * a + .025 * q), X = .12 + c * (.46 + .22 * a), Z += .045 * a - .08 * (1 - c), Q = .64 + .36 * c;
			};
			case `tennisball`: return () => {
				let e = G * F, t = K * F, r = Math.floor(e), i = Math.floor(t), a = 0;
				for (let n = -1; n <= 1; n++) for (let o = -1; o <= 1; o++) {
					let s = r + o, c = i + n, l = ((c % F + F) % F * F + (s % F + F) % F) * Ze, u = e - s - I[l], d = t - c - I[l + 1], f = (u * I[l + 2] + d * I[l + 3]) / .48, p = (-u * I[l + 3] + d * I[l + 2]) / .065, m = smooth(clamp(1 - f * f - p * p));
					a += (1 - a) * m;
				}
				let s = 1 - smooth(clamp((Math.abs(Math.sin(n * (K - .19 * Math.sin(n * G) - .25))) - .025) / .075));
				Y = (.16 + .1 * q + .06 * a) * (1 - s) + .97 * s, X = .54 + (1 - s) * (.065 * a + .018 * q) - .12 * s, Z -= .1 * s, Q = 1 - .12 * s;
			};
			case `golfball`: return () => {
				let e = fract(G * 10 - Qe) - .5, t = fract(K * 10 - $e) - .5, n = clamp(1 - (e * e + t * t) / (.41 * .41)) ** 2;
				Y = .96 - .12 * n, X = .8 - .6 * n, Z += .04 * n, Q = 1 - .2 * n;
			};
			case `boardformedconcrete`: return () => {
				let e = Math.floor(K * 8), t = fract(K * 8), r = fract(G * 2 + e % 2 * .5), i = Math.floor(fract(G + e % 2 * .25) * 2), a = smooth(clamp(r / .018)) * smooth(clamp((1 - r) / .018)) * smooth(clamp(t / .055)) * smooth(clamp((1 - t) / .055)), o = it[e * 2 + i], s = rt(G, K + .002 * Math.sin(n * G + o * n)), c = tt(G, K);
				Y = .39 + a * (.12 + .09 * o + .055 * s) + .025 * c, X = .18 + a * (.48 + .025 * o + .025 * s) + .008 * c, Z += .025 * s * a + .025 * c, Q = .75 + .25 * a;
			};
			case `ribbedconcrete`: return () => {
				let e = fract(G * 12), t = Math.floor(G * 12), n = smooth(clamp((e - .12) / .18)) * smooth(clamp((.88 - e) / .18)), r = tt(G, K), i = nt(G, K), a = it[t];
				Y = .38 + .17 * n + .055 * i + .025 * r + .025 * a * n, X = .15 + .65 * n + .009 * r + .006 * i + .008 * a * n, Z += .035 * r + .02 * i, Q = .69 + .31 * n;
			};
			case `splitfaceblock`: return () => {
				let e = Math.floor(K * 8), t = fract(K * 8), n = G * 4 + e % 2 * .5, r = fract(n), i = Math.floor(n) % 4, a = smooth(clamp((r - .04) / .08)) * smooth(clamp((.96 - r) / .08)) * smooth(clamp((t - .06) / .09)) * smooth(clamp((.94 - t) / .09)), o = it[e * 4 + i], s = nt(G, K), c = tt(G, K), l = smooth(clamp((s - .22) / .56));
				Y = .4 + a * (.04 + .28 * l + .1 * o + .06 * c), X = .14 + a * (.34 + .25 * l + .1 * o + .08 * c), Z -= .1 * (1 - a), Z += .035 * c * a, Q = .64 + a * (.29 + .07 * l), $ = 1 - a;
			};
			case `chainmail`: return () => {
				let e = G * 6, t = K * 8, n = Math.floor(t), r = ot(G, K);
				Y = .035 + .025 * r, X = .06 + .008 * r, Z = .88 + .04 * r, Q = .59;
				for (let a = -1; a <= 1; a++) {
					let o = n + a, s = (o + 8) % 8, c = s % 2 * .5, l = Math.floor(e - c);
					for (let n = -1; n <= 1; n++) {
						let a = l + n, u = (a + 6) % 6, d = e - a - c - .5, f = t - o - .5, m = clamp(1 - ((Math.sqrt(d * d + f * f) - .62) / .105) ** 2), h = smooth(m), g = st[s * 6 + u], _ = .44 + .26 * m + (s % 2 ? -1 : 1) * f * (.13 + .04 * g);
						Y += h * (.63 + .13 * g + .04 * r - Y), X += h * (_ - X), Z += h * (i.roughness + .04 * r - Z), Q += h * (.88 + .1 * m - Q), qt += h * (1 - qt);
					}
				}
			};
			case `rivetedmetal`: return () => {
				let e = fract(G * 3), t = fract(K * 4), n = smooth(clamp(e / .045)) * smooth(clamp((1 - e) / .045)) * smooth(clamp(t / .045)) * smooth(clamp((1 - t) / .045)), r = Math.floor(K * 4) * 3 + Math.floor(G * 3), i = st[r], a = ot(G, K), o = 0;
				for (let n = 0; n < 2; n++) for (let r = 0; r < 2; r++) {
					let i = e - (r ? .88 : .12), a = t - (n ? .88 : .12), s = clamp(1 - (i * i + a * a) / .002704);
					o += s * s;
				}
				Y = .28 + n * (.19 + .09 * i) + .13 * o + .03 * a, X = .09 + n * (.23 + .025 * i) + .57 * o + .004 * a, Z += .1 * (1 - n) - .09 * o + .025 * a, Q = .64 + .34 * n + .02 * o;
			};
			case `weldedmetal`: return () => {
				let e = fract(G * 3 + .5) - .5, t = .5 + .5 * Math.cos(n * 32 * K + a), i = smooth(clamp(1 - (e / (.065 + .015 * t)) ** 2)), o = smooth(clamp(1 - (e / .15) ** 2)), s = ot(G, K);
				Y = .52 + .04 * s - .16 * o + i * (.19 + .08 * t), X = .2 + .004 * s + i * (.46 + .15 * t), Z += .12 * o - .05 * i + .025 * s, Q = 1 - .15 * o * (1 - i);
			};
		}
		throw Error(`Procedural material ${t} has no sampler case in createSurfaceSampler.`);
	}, Yt = pick(), Xt = !(et || t === `flutedwood` || t === `subwaytiles` || t === `canewebbing` || t === `rammedearth` || t === `copperpatina` || t === `birdseyemaple` || t === `breezeblock` || t === `basketweavepavers` || t === `ripstop` || t === `octagondot` || t === `truchettiles` || t === `standingseam` || t === `damascus` || t === `windmillpavers` || t === `castiron` || t === `porphyry` || t === `linen` || t === `chippedenamel` || t === `perforatedleather` || t === `argyle` || t === `chevronparquet` || t === `ginkgoleaf` || at || ct || pt || _t || St || Dt || At || Nt || xe || Lt || Bt || ge || de || re || ee || l || d || p), Zt = r ^ 2747636419, Qt = r ^ 2135587861;
	return (e, t, n) => {
		G = fract(e), K = fract(t), Kt = Wt ? noise(G, K, 4, 4, r) : 0, q = Xt ? noise(G, K, 32, 32, Zt) : 0, J = Gt ? noise(G, K, 64, 64, Qt) : 0, Y = Kt, X = Kt, Z = i.roughness, Q = 1, $ = 0, qt = Jt, Yt(), n.color = Y, n.height = X * i.relief, n.roughness = clamp(Z), n.occlusion = Q, n.mortar = $, n.metallic = qt;
	};
}
function writeNormals(e, n, r) {
	for (let i = 0; i < n; i++) {
		let a = (i + n - 1) % n * n, o = (i + 1) % n * n;
		for (let s = 0; s < n; s++) {
			let c = (i * n + s) * 4, l = (e[i * n + (s + 1) % n] - e[i * n + (s + n - 1) % n]) * n / 2, u = (e[o + s] - e[a + s]) * n / 2, d = 1 / require_hypot.hypot3(l, u, 1);
			r[c] = byte(.5 - l * d * .5), r[c + 1] = byte(.5 - u * d * .5), r[c + 2] = byte(.5 + d * .5), r[c + 3] = 255;
		}
	}
}
function generateProceduralMaps(t, n, r, i = {}) {
	let a = {
		baseColor: new Uint8ClampedArray(n * n * 4),
		normal: new Uint8ClampedArray(n * n * 4),
		metallicRoughness: new Uint8ClampedArray(n * n * 4),
		occlusion: new Uint8ClampedArray(n * n * 4)
	}, o = new Float32Array(n * n), s = createSurfaceSampler(t, r), c = require_materials.proceduralMaterialPresets[t], l = {
		color: 0,
		height: 0,
		roughness: 0,
		occlusion: 0,
		mortar: 0,
		metallic: 0
	};
	for (let e = 0; e < n; e++) for (let t = 0; t < n; t++) {
		s((t + .5) / n, (e + .5) / n, l);
		let r = i.contrast ?? 1, u = i.roughnessBias ?? 0;
		l.color = clamp(.5 + (l.color - .5) * r);
		let d = e * n + t, f = d * 4;
		o[d] = l.height;
		for (let e = 0; e < 3; e++) {
			let t = c.dark[e] + (c.light[e] - c.dark[e]) * l.color;
			a.baseColor[f + e] = Math.round(t * (1 - l.mortar) + (e === 2 ? 139 : 153) * l.mortar), a.occlusion[f + e] = byte(l.occlusion);
		}
		a.baseColor[f + 3] = a.occlusion[f + 3] = 255, a.metallicRoughness[f] = 255, a.metallicRoughness[f + 1] = byte(l.roughness + u), a.metallicRoughness[f + 2] = byte(l.metallic), a.metallicRoughness[f + 3] = 255;
	}
	return writeNormals(o, n, a.normal), a;
}
//#endregion
exports.createSurfaceSampler = createSurfaceSampler;
exports.generateProceduralMaps = generateProceduralMaps;
exports.writeNormals = writeNormals;

//# sourceMappingURL=procedural-material-maps.cjs.map