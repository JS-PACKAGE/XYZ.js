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
	let C = t === `tactilepaving` ? cachedNoise(require_materials.proceduralMaterialPresets.tactilepaving.tiles, require_materials.proceduralMaterialPresets.tactilepaving.tiles, r ^ 23443) : null, w = t === `roadmarking` ? cachedNoise(require_materials.proceduralMaterialPresets.roadmarking.wearColumns, require_materials.proceduralMaterialPresets.roadmarking.wearRows, r ^ 25553) : null, T = t === `elephanthide` || t === `ostrichleather` || t === `sharkskin`, E = T ? cachedNoise(96, 96, r ^ 25011) : null, D = t === `elephanthide` ? cachedNoise(4, 4, r ^ 11641) : null, O = t === `ostrichleather` ? /* @__PURE__ */ new Float64Array(108) : null;
	if (O) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 3;
		O[n] = .25 + .5 * hash(t, e, r ^ 6967), O[n + 1] = .25 + .5 * hash(t, e, r ^ 20369), O[n + 2] = 1 / (.2 + .05 * hash(t, e, r ^ 29605));
	}
	let k = t === `sharkskin` ? /* @__PURE__ */ new Float64Array(432) : null;
	if (k) for (let e = 0; e < 24; e++) for (let t = 0; t < 18; t++) k[e * 18 + t] = hash(t, e, r ^ 15719);
	let A = t === `birchbark` || t === `palmtrunk` || t === `sycamorebark`, j = A ? cachedNoise(64, 64, r ^ 21687) : null, M = A && t !== `sycamorebark` ? cachedNoise(4, 4, r ^ 12761) : null, N = t === `palmtrunk` ? cachedNoise(96, 8, r ^ 10161) : null, P = t === `birchbark` ? 7 : 4, F = t === `birchbark` ? 10 : 4, I = t === `birchbark` ? 5 : 6, L = t === `birchbark` || t === `sycamorebark` ? new Float64Array(P * F * I) : null;
	if (L) for (let e = 0; e < F; e++) for (let i = 0; i < P; i++) {
		let a = (e * P + i) * I, o = t === `birchbark`;
		L[a] = .25 + .5 * hash(i, e, r ^ 6611), L[a + 1] = .25 + .5 * hash(i, e, r ^ 26553), L[a + 2] = (o ? .2 : .72) + (o ? .23 : .13) * hash(i, e, r ^ 17313), L[a + 3] = (o ? .035 : .72) + (o ? .04 : .13) * hash(i, e, r ^ 30161), L[a + 4] = o ? .65 + .35 * hash(i, e, r ^ 11633) : n * hash(i, e, r ^ 14775), o || (L[a + 5] = Math.min(2, Math.floor(3 * hash(i, e, r ^ 20899))) * .32 + .18);
	}
	let R = t === `palmtrunk` ? /* @__PURE__ */ new Float64Array(36) : null;
	if (R) for (let e = 0; e < 9; e++) {
		let t = e * 4;
		R[t] = (e + .2 + .6 * hash(0, e, r ^ 6057)) / 9, R[t + 1] = .006 + .005 * hash(0, e, r ^ 27059), R[t + 2] = n * hash(0, e, r ^ 16855), R[t + 3] = .7 + .3 * hash(0, e, r ^ 21425);
	}
	let z = t === `rosepetal` || t === `lilypetal` || t === `fritillarypetal`, ee = t === `rosepetal` || t === `fritillarypetal` ? cachedNoise(4, 4, r ^ 10201) : null, te = z ? cachedNoise(48, 48, r ^ 25521) : null, ne = t === `rosepetal` ? 48 : 9, re = t === `rosepetal` ? 48 : 7, B = t === `rosepetal` || t === `lilypetal` ? new Float64Array(ne * re * 8) : null;
	if (B) for (let e = 0; e < re; e++) for (let n = 0; n < ne; n++) {
		let i = (e * ne + n) * 8, a = t === `rosepetal`, o = a ? .3 : .15, s = a ? .4 : .7, c = (a ? 1 : .22) * (hash(n, e, r ^ 22979) - .5);
		B[i] = o + s * hash(n, e, r ^ 12711), B[i + 1] = o + s * hash(n, e, r ^ 18409), B[i + 2] = Math.cos(c), B[i + 3] = Math.sin(c), B[i + 4] = 1 / (a ? .38 + .07 * hash(n, e, r ^ 27923) : .13), B[i + 5] = 1 / (a ? .38 + .07 * hash(n, e, r ^ 6999) : .43), B[i + 6] = !a && hash(n, e, r ^ 11159) < .24 ? 0 : .65 + .35 * hash(n, e, r ^ 29097), B[i + 7] = a ? 0 : .5 * (hash(n, e, r ^ 14805) - .5);
	}
	let ie = t === `cantaloupe` || t === `dragonfruit` || t === `kiwiskin`, ae = ie ? cachedNoise(64, 64, r ^ 17895) : null, oe = t === `cantaloupe` ? cachedNoise(4, 4, r ^ 29091) : null, se = t === `cantaloupe` ? /* @__PURE__ */ new Float64Array(1274) : null;
	if (se) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = (e * 7 + t) * 26, i = .25 + .5 * hash(t, e, r ^ 12977), a = .25 + .5 * hash(t, e, r ^ 26585);
		se[n] = i, se[n + 1] = a;
		let o = n + 2;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 7) % 7, l = (e + n + 7) % 7, u = s + .25 + .5 * hash(c, l, r ^ 12977) - i, d = n + .25 + .5 * hash(c, l, r ^ 26585) - a, f = 1 / Math.sqrt(u * u + d * d);
			se[o++] = u * f, se[o++] = d * f, se[o++] = .5 / f;
		}
	}
	let ce = t === `dragonfruit` ? /* @__PURE__ */ new Float64Array(120) : null;
	if (ce) for (let e = 0; e < 6; e++) for (let t = 0; t < 4; t++) {
		let n = (e * 4 + t) * 5, i = .24 * (hash(t, e, r ^ 21417) - .5);
		ce[n] = .25 + e % 2 * .5 + .12 * (hash(t, e, r ^ 15473) - .5), ce[n + 1] = .5 + .12 * (hash(t, e, r ^ 27923) - .5), ce[n + 2] = Math.cos(i), ce[n + 3] = Math.sin(i), ce[n + 4] = .85 + .15 * hash(t, e, r ^ 10727);
	}
	let le = t === `kiwiskin` ? /* @__PURE__ */ new Float64Array(6480) : null;
	if (le) for (let e = 0; e < 36; e++) for (let t = 0; t < 36; t++) {
		let i = (e * 36 + t) * 5, a = n * hash(t, e, r ^ 12179);
		le[i] = .3 + .4 * hash(t, e, r ^ 17335), le[i + 1] = .3 + .4 * hash(t, e, r ^ 27217), le[i + 2] = Math.cos(a), le[i + 3] = Math.sin(a), le[i + 4] = .75 + .25 * hash(t, e, r ^ 6611);
	}
	let ue = t === `zebrafur` || t === `leopardfur` || t === `giraffefur` || t === `tigerfur` || t === `cowhide`, de = ue ? cachedNoise(5, 7, r ^ 29369) : null, fe = ue ? cachedNoise(96, 64, r ^ 19475) : null, pe = t === `cowhide` ? require_materials.proceduralMaterialPresets.cowhide : null, me = pe ? cachedNoise(pe.patchColumns, pe.patchRows, r ^ 70161) : null, he = pe ? 1 / (pe.patchHigh - pe.patchLow) : 0, ge = ue ? /* @__PURE__ */ new Float64Array(5120) : null;
	if (ge) for (let e = 0; e < 32; e++) for (let t = 0; t < 40; t++) {
		let n = (e * 40 + t) * 4, i = Math.PI / 2 + .65 * (hash(t, e, r ^ 5949) - .5);
		ge[n] = .3 + .4 * hash(t, e, r ^ 21409), ge[n + 1] = .3 + .4 * hash(t, e, r ^ 27433), ge[n + 2] = Math.cos(i), ge[n + 3] = Math.sin(i);
	}
	let _e = t === `tigerfur` ? require_materials.proceduralMaterialPresets.tigerfur : null, ve = _e ? new Float64Array(_e.rows * 2) : null, ye = _e ? 1 / _e.bandShoulder : 0, be = _e ? 1 / _e.forkHalfLength : 0, xe = _e ? 1 / _e.forkHalfWidth : 0, Se = _e ? 1 / _e.forkShoulder : 0;
	if (ve) for (let e = 0; e < _e.rows; e++) ve[e * 2] = hash(e, 0, r ^ 82195), ve[e * 2 + 1] = hash(e, 0, r ^ 82197) < .5 ? -1 : 1;
	let Ce = t === `leopardfur` ? /* @__PURE__ */ new Float64Array(175) : null;
	if (Ce) for (let e = 0; e < 5; e++) for (let t = 0; t < 5; t++) {
		let i = (e * 5 + t) * 7, a = n * hash(t, e, r ^ 14759);
		Ce[i] = .32 + .36 * hash(t, e, r ^ 6627), Ce[i + 1] = .32 + .36 * hash(t, e, r ^ 23921), Ce[i + 2] = Math.cos(a), Ce[i + 3] = Math.sin(a), Ce[i + 4] = 1 / (.39 + .08 * hash(t, e, r ^ 27701)), Ce[i + 5] = 1 / (.34 + .07 * hash(t, e, r ^ 12057)), Ce[i + 6] = hash(t, e, r ^ 29617);
	}
	let we = t === `giraffefur` ? /* @__PURE__ */ new Float64Array(972) : null;
	if (we) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 27, i = .3 + .4 * hash(t, e, r ^ 17337), a = .3 + .4 * hash(t, e, r ^ 27159);
		we[n] = i, we[n + 1] = a, we[n + 2] = hash(t, e, r ^ 10195);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 6) % 6, l = (e + n + 6) % 6, u = s + .3 + .4 * hash(c, l, r ^ 17337) - i, d = n + .3 + .4 * hash(c, l, r ^ 27159) - a, f = Math.sqrt(u * u + d * d);
			we[o++] = u / f, we[o++] = d / f, we[o++] = f / 2;
		}
	}
	let Te = t === `endgrain` ? hash(0, 0, r ^ 15127) : 0, Ee = t === `endgrain` ? hash(0, 0, r ^ 23849) : 0, De = t === `houndstooth` ? /* @__PURE__ */ new Float64Array(64) : null;
	if (De) for (let e = 0; e < 8; e++) for (let t = 0; t < 8; t++) De[e * 8 + t] = ((t - e + 8) % 4 < 2 ? t : e) < 4 ? 0 : 1;
	let Oe = t === `damask` || t === `goldbrocade` ? /* @__PURE__ */ new Float64Array(72) : null;
	if (Oe) for (let e = 0; e < 12; e++) {
		let t = 0, r = -.18, i = 0, a = .065, o = .065;
		if (e < 6) i = n * e / 6 + Math.PI / 2, t = .085 * Math.cos(i), r += .085 * Math.sin(i), a = .12, o = .055;
		else if (e < 10) {
			let n = e % 2 == 0 ? -1 : 1;
			t = n * (e < 8 ? .115 : .09), r = e < 8 ? .095 : .275, i = n * -.65, a = e < 8 ? .145 : .115, o = .06;
		} else e === 11 && (r = .12, i = Math.PI / 2, a = .26, o = .018);
		let s = e * 6;
		Oe[s] = t, Oe[s + 1] = r, Oe[s + 2] = Math.cos(i), Oe[s + 3] = Math.sin(i), Oe[s + 4] = 1 / a, Oe[s + 5] = 1 / o;
	}
	let ke = t === `closedcellfoam` ? /* @__PURE__ */ new Float64Array(3136) : null;
	if (ke) for (let e = 0; e < 28; e++) for (let t = 0; t < 28; t++) {
		let n = (e * 28 + t) * 4, i = hash(t, e, r ^ 28455), a = .55 + .16 * i;
		ke[n] = .3 + .4 * hash(t, e, r), ke[n + 1] = .3 + .4 * hash(t, e, r ^ 10661), ke[n + 2] = 1 / (a * a), ke[n + 3] = i;
	}
	let Ae = t === `snakeskin` ? 10 : 4, je = t === `snakeskin` ? 12 : 6, Me = t === `snakeskin` || t === `crocodile` ? new Float64Array(Ae * je) : null;
	if (Me) for (let e = 0; e < je; e++) for (let t = 0; t < Ae; t++) Me[e * Ae + t] = hash(t, e, r ^ 29625);
	let Ne = t === `engineturned` ? /* @__PURE__ */ new Float64Array(72) : null;
	if (Ne) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 2;
		Ne[n] = hash(t, e, r ^ 14497), Ne[n + 1] = hash(t, e, r ^ 27735);
	}
	let Pe = t === `orangepeel` ? 24 : 40, Fe = t === `orangepeel` ? 24 : 8, Ie = t === `orangepeel` || t === `coconut` ? new Float64Array(Pe * Fe * 3) : null;
	if (Ie) for (let e = 0; e < Fe; e++) for (let t = 0; t < Pe; t++) {
		let n = (e * Pe + t) * 3;
		Ie[n] = .25 + .5 * hash(t, e, r ^ 7795), Ie[n + 1] = .25 + .5 * hash(t, e, r ^ 21425), Ie[n + 2] = hash(t, e, r ^ 31529);
	}
	let Le = t === `limestone` ? /* @__PURE__ */ new Float64Array(4032) : null;
	if (Le) for (let e = 0; e < 24; e++) for (let t = 0; t < 24; t++) {
		let i = (e * 24 + t) * 7, a = n * hash(t, e, r ^ 11377);
		Le[i] = .15 + .7 * hash(t, e, r ^ 6323), Le[i + 1] = .15 + .7 * hash(t, e, r ^ 20009), Le[i + 2] = .25 + .19 * hash(t, e, r ^ 31377), Le[i + 3] = .65 + .35 * hash(t, e, r ^ 14733), Le[i + 4] = Math.cos(a), Le[i + 5] = Math.sin(a), Le[i + 6] = hash(t, e, r ^ 25591);
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
	let He = t === `straw` ? /* @__PURE__ */ new Float64Array(1728) : null;
	if (He) for (let e = 0; e < 3; e++) for (let t = 0; t < 8; t++) for (let i = 0; i < 8; i++) {
		let a = ((e * 8 + t) * 8 + i) * 9, o = r ^ e * 14759, s = n * hash(i, t, o ^ 6355);
		He[a] = .25 + .5 * hash(i, t, o ^ 20247), He[a + 1] = .25 + .5 * hash(i, t, o ^ 29641), He[a + 2] = Math.cos(s), He[a + 3] = Math.sin(s), He[a + 4] = .62 + .33 * hash(i, t, o ^ 25265), He[a + 5] = .035 + .03 * hash(i, t, o ^ 20891), He[a + 6] = hash(i, t, o ^ 11877), He[a + 7] = n * hash(i, t, o ^ 29123), He[a + 8] = hash(i, t, o ^ 14305);
	}
	let Ue = t === `osb` ? 6 : 28, V = t === `osb` || t === `chipboard` ? new Float64Array(Ue * Ue * 2 * 26) : null;
	if (V) for (let e = 0; e < 2; e++) for (let i = 0; i < Ue; i++) for (let a = 0; a < Ue; a++) {
		let o = ((e * Ue + i) * Ue + a) * 26, s = r ^ e * 14759, c = hash(a, i, s ^ 25265), l = t === `osb` ? Math.PI / 2 + .65 * (hash(a, i, s ^ 6355) - .5) + .5 * (noise(a / 6, i / 6, 3, 3, r ^ 31529) - .5) : n * hash(a, i, s ^ 6355);
		V[o] = .25 + .5 * hash(a, i, s ^ 20247), V[o + 1] = .25 + .5 * hash(a, i, s ^ 29641), V[o + 2] = Math.cos(l), V[o + 3] = Math.sin(l), V[o + 4] = t === `osb` ? .78 + .14 * c : .46 + .19 * c, V[o + 5] = t === `osb` ? .13 + .1 * hash(a, i, s ^ 20891) : .25 + .17 * hash(a, i, s ^ 20891), V[o + 6] = c, V[o + 7] = n * hash(a, i, s ^ 11877);
		for (let e = 0; e < 6; e++) {
			let t = o + 8 + e * 3;
			V[t] = Math.cos(n * e / 6), V[t + 1] = Math.sin(n * e / 6), V[t + 2] = .82 + .18 * hash(a, i, s ^ 23857 + e);
		}
	}
	let We = t === `septarianstone` ? require_materials.proceduralMaterialPresets.septarianstone.cells : 16, Ge = t === `crackleglaze` || t === `septarianstone` ? new Float64Array(We * We * 26) : null;
	if (Ge) for (let e = 0; e < We; e++) for (let t = 0; t < We; t++) {
		let n = (e * We + t) * 26, i = .36 + .28 * hash(t, e, r ^ 17293), a = .36 + .28 * hash(t, e, r ^ 31525);
		Ge[n] = i, Ge[n + 1] = a;
		let o = n + 2;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + We) % We, l = (e + n + We) % We, u = s + .36 + .28 * hash(c, l, r ^ 17293) - i, d = n + .36 + .28 * hash(c, l, r ^ 31525) - a, f = Math.sqrt(u * u + d * d);
			Ge[o++] = u / f, Ge[o++] = d / f, Ge[o++] = f / 2;
		}
	}
	let Ke = t === `fishscales` ? 10 : 8, qe = t === `fishscales` ? 10 : 4, Je = t === `fishscales` || t === `feathers` || t === `peacockfeathers` ? new Float64Array(Ke * qe * 2) : null;
	if (Je) for (let e = 0; e < qe; e++) for (let t = 0; t < Ke; t++) {
		let n = (e * Ke + t) * 2;
		Je[n] = hash(t, e, r ^ 15985), Je[n + 1] = .2 * (hash(t, e, r ^ 25299) - .5);
	}
	let Ye = t === `tortoiseshell` ? /* @__PURE__ */ new Float64Array(972) : null;
	if (Ye) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 27, i = .22 + .56 * hash(t, e, r ^ 13751), a = .22 + .56 * hash(t, e, r ^ 28185);
		Ye[n] = i, Ye[n + 1] = a, Ye[n + 2] = hash(t, e, r ^ 31811);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 6) % 6, l = (e + n + 6) % 6, u = s + .22 + .56 * hash(c, l, r ^ 13751) - i, d = n + .22 + .56 * hash(c, l, r ^ 28185) - a, f = Math.sqrt(u * u + d * d);
			Ye[o++] = u / f, Ye[o++] = d / f, Ye[o++] = f / 2;
		}
	}
	let Xe = t === `studdedrubber` ? /* @__PURE__ */ new Float64Array(36) : null;
	if (Xe) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) Xe[e * 6 + t] = hash(t, e, r ^ 19225);
	let Ze = t === `groovedrubber` ? /* @__PURE__ */ new Float64Array(12) : null;
	if (Ze) for (let e = 0; e < 12; e++) Ze[e] = hash(e, 0, r ^ 23607);
	let Qe = t === `recycledrubber` ? /* @__PURE__ */ new Float64Array(41472) : null;
	if (Qe) for (let e = 0; e < 48; e++) for (let t = 0; t < 48; t++) {
		let i = (e * 48 + t) * 18, a = n * hash(t, e, r ^ 32019), o = .48 + .17 * hash(t, e, r ^ 6583);
		Qe[i] = .2 + .6 * hash(t, e, r ^ 12969), Qe[i + 1] = .2 + .6 * hash(t, e, r ^ 25059), Qe[i + 2] = hash(t, e, r ^ 21441);
		for (let s = 0; s < 5; s++) {
			let c = i + 3 + s * 3, l = a + n * s / 5;
			Qe[c] = Math.cos(l), Qe[c + 1] = Math.sin(l), Qe[c + 2] = o * (.78 + .22 * hash(t, e, r ^ 9969 + s));
		}
	}
	let $e = t === `breadcrust` ? /* @__PURE__ */ new Float64Array(1323) : null;
	if ($e) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = (e * 7 + t) * 27, i = .36 + .28 * hash(t, e, r ^ 9399), a = .36 + .28 * hash(t, e, r ^ 22993);
		$e[n] = i, $e[n + 1] = a, $e[n + 2] = hash(t, e, r ^ 29609);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 7) % 7, l = (e + n + 7) % 7, u = s + .36 + .28 * hash(c, l, r ^ 9399) - i, d = n + .36 + .28 * hash(c, l, r ^ 22993) - a, f = Math.sqrt(u * u + d * d);
			$e[o++] = u / f, $e[o++] = d / f, $e[o++] = f / 2;
		}
	}
	let H = t === `basketball` ? 36 : 24, et = t === `basketball` ? 3 : 4, tt = t === `basketball` || t === `tennisball` ? new Float64Array(H * H * et) : null;
	if (tt) for (let e = 0; e < H; e++) for (let i = 0; i < H; i++) {
		let a = (e * H + i) * et;
		if (tt[a] = .35 + .3 * hash(i, e, r ^ 6567), tt[a + 1] = .35 + .3 * hash(i, e, r ^ 23587), t === `basketball`) {
			let t = .34 + .04 * hash(i, e, r ^ 29657);
			tt[a + 2] = 1 / (t * t);
		} else {
			let t = n * hash(i, e, r ^ 14257);
			tt[a + 2] = Math.cos(t), tt[a + 3] = Math.sin(t);
		}
	}
	let nt = t === `golfball` ? hash(0, 0, r ^ 10679) : 0, rt = t === `golfball` ? hash(0, 0, r ^ 25043) : 0, it = t === `boardformedconcrete` || t === `ribbedconcrete` || t === `splitfaceblock`, at = it ? cachedNoise(96, 96, r ^ 11633) : null, ot = t === `ribbedconcrete` || t === `splitfaceblock` ? cachedNoise(24, 32, r ^ 27449) : null, st = t === `boardformedconcrete` ? cachedNoise(3, 128, r ^ 23059) : null, ct = it ? new Float64Array(t === `boardformedconcrete` ? 16 : t === `ribbedconcrete` ? 12 : 32) : null;
	if (ct) for (let e = 0; e < ct.length; e++) ct[e] = hash(e, 0, r ^ 18409);
	let lt = t === `chainmail` || t === `rivetedmetal` || t === `weldedmetal`, ut = lt ? cachedNoise(48, 64, r ^ 27943) : null, dt = t === `chainmail` ? /* @__PURE__ */ new Float64Array(48) : t === `rivetedmetal` ? /* @__PURE__ */ new Float64Array(12) : null;
	if (dt) for (let e = 0; e < dt.length; e++) dt[e] = hash(e, 0, r ^ 14773);
	let ft = t === `cactus` || t === `pinecone` || t === `corncob`, pt = ft ? cachedNoise(48, 64, r ^ 24121) : null, mt = t === `corncob` ? 12 : 8, ht = t === `cactus` ? 18 : 1, gt = ft ? new Float64Array(mt * 8 * ht) : null;
	if (gt) for (let e = 0; e < 8; e++) for (let i = 0; i < mt; i++) {
		let a = (e * mt + i) * ht;
		if (gt[a] = hash(i, e, r ^ 19059), t === `cactus`) {
			gt[a] = .28 + .08 * gt[a], gt[a + 1] = .12 * (hash(i, e, r ^ 11609) - .5);
			let t = hash(i, e, r ^ 32561) * n;
			for (let e = 0; e < 8; e++) {
				let r = t + e * n / 8;
				gt[a + 2 + e * 2] = Math.cos(r), gt[a + 3 + e * 2] = Math.sin(r);
			}
		}
	}
	let _t = t === `corrugatedcardboard` || t === `creasedpaper` || t === `layeredpaper`, vt = _t ? cachedNoise(6, 8, r ^ 12729) : null, yt = _t ? /* @__PURE__ */ new Float64Array(60) : null;
	if (yt) for (let e = 0; e < 4; e++) for (let t = 0; t < 3; t++) {
		let i = (e * 3 + t) * 5, a = n * hash(t, e, r ^ 28179);
		yt[i] = .3 + .4 * hash(t, e, r ^ 11121), yt[i + 1] = .3 + .4 * hash(t, e, r ^ 23609), yt[i + 2] = Math.cos(a), yt[i + 3] = Math.sin(a), yt[i + 4] = .32 + .12 * hash(t, e, r ^ 31313);
	}
	let bt = t === `layeredpaper` ? /* @__PURE__ */ new Float64Array(24) : null;
	if (bt) for (let e = 0; e < 8; e++) bt[e * 3] = .35 + e * .045, bt[e * 3 + 1] = .58 + .14 * hash(e, 0, r ^ 20263), bt[e * 3 + 2] = n * hash(e, 0, r ^ 10525);
	let xt = t === `basalt` || t === `scoria` || t === `obsidian`, St = xt ? cachedNoise(64, 64, r ^ 23319) : null, Ct = t === `basalt` ? 6 : t === `scoria` ? 10 : 4, wt = t === `basalt` ? 8 : Ct, Tt = t === `basalt` ? 4 : 7, U = xt ? new Float64Array(Ct * wt * Tt) : null;
	if (U) for (let e = 0; e < wt; e++) for (let i = 0; i < Ct; i++) {
		let a = (e * Ct + i) * Tt, o = hash(i, e, r ^ 15729);
		if (t === `basalt`) U[a] = .46 + .025 * o, U[a + 1] = .46 + .025 * hash(i, e, r ^ 27177), U[a + 2] = .46 + .025 * hash(i, e, r ^ 31811), U[a + 3] = o;
		else {
			let s = n * hash(i, e, r ^ 27177), c = t === `scoria` ? .32 + .12 * o : .65 + .13 * o;
			U[a] = .35 + .3 * hash(i, e, r ^ 12121), U[a + 1] = .35 + .3 * hash(i, e, r ^ 31811), U[a + 2] = c, U[a + 3] = c * (.7 + .25 * hash(i, e, r ^ 19987)), U[a + 4] = Math.cos(s), U[a + 5] = Math.sin(s), U[a + 6] = o;
		}
	}
	let Et = t === `malachite` || t === `agate` || t === `lapislazuli`, Dt = Et ? cachedNoise(64, 64, r ^ 31155) : null, Ot = t === `lapislazuli` ? cachedNoise(8, 8, r ^ 19753) : null, kt = Et ? n * hash(0, 0, r ^ 13735) : 0, At = Et ? n * hash(0, 0, r ^ 27673) : 0, jt = t === `rice` || t === `sesame` || t === `coffeebeans`, Mt = t === `rice` ? 12 : t === `sesame` ? 16 : 8, Nt = jt ? new Float64Array(Mt * Mt * 7) : null, Pt = t === `coffeebeans` ? cachedNoise(64, 64, r ^ 18105) : null;
	if (Nt) for (let e = 0; e < Mt; e++) for (let i = 0; i < Mt; i++) {
		let a = (e * Mt + i) * 7, o = n * hash(i, e, r ^ 24377), s = hash(i, e, r ^ 14273);
		Nt[a] = .35 + .3 * hash(i, e, r ^ 6311), Nt[a + 1] = .35 + .3 * hash(i, e, r ^ 27939), Nt[a + 2] = Math.cos(o), Nt[a + 3] = Math.sin(o), Nt[a + 4] = 1 / (t === `rice` ? .62 + .09 * s : t === `sesame` ? .48 + .06 * s : .57 + .06 * s), Nt[a + 5] = 1 / (t === `rice` ? .14 + .025 * s : t === `sesame` ? .24 + .025 * s : .36 + .03 * s), Nt[a + 6] = s;
	}
	let Ft = t === `lotusleaf` || t === `bananaleaf` || t === `fernleaf`, It = t === `lotusleaf` ? 31 : 7, Lt = Ft ? new Float64Array(9 * It) : null;
	if (Lt) for (let e = 0; e < 3; e++) for (let i = 0; i < 3; i++) {
		let a = (e * 3 + i) * It, o = n * hash(i, e, r ^ 23191), s = hash(i, e, r ^ 14033);
		if (Lt[a] = .45 + .1 * hash(i, e, r ^ 8631), Lt[a + 1] = .45 + .1 * hash(i, e, r ^ 29155), Lt[a + 2] = Math.cos(o), Lt[a + 3] = Math.sin(o), Lt[a + 4] = 1 / (t === `lotusleaf` ? .65 + .04 * s : t === `bananaleaf` ? .76 + .04 * s : .78 + .03 * s), Lt[a + 5] = 1 / (t === `lotusleaf` ? .61 + .04 * s : t === `bananaleaf` ? .28 + .02 * s : .5), Lt[a + 6] = s, t === `lotusleaf`) for (let e = 0; e < 12; e++) {
			let t = e * n / 12 + .15 * s;
			Lt[a + 7 + e * 2] = Math.cos(t), Lt[a + 8 + e * 2] = Math.sin(t);
		}
	}
	let Rt = t === `fernleaf` ? /* @__PURE__ */ new Float64Array(42) : null;
	if (Rt) for (let e = 0; e < 14; e++) {
		let t = -.7 + e * .105;
		Rt[e * 3] = t, Rt[e * 3 + 1] = e % 2 == 0 ? 1 : -1, Rt[e * 3 + 2] = 1 / (.68 - .36 * t * t);
	}
	let zt = t === `braincoral` || t === `starcoral` || t === `seasponge`, Bt = zt ? cachedNoise(64, 64, r ^ 19091) : null, Vt = t === `braincoral` ? new Float64Array([
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
	if (Vt) for (let e = 0; e < 6; e++) Vt[e * 4 + 2] = n * hash(e, 0, r ^ 29129);
	let Ht = t === `starcoral` ? /* @__PURE__ */ new Float64Array(1116) : null;
	if (Ht) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let i = (e * 6 + t) * 31, a = n * hash(t, e, r ^ 11415), o = .5 + .055 * hash(t, e, r ^ 28209);
		Ht[i] = .4 + .2 * hash(t, e, r ^ 7001), Ht[i + 1] = .4 + .2 * hash(t, e, r ^ 24359), Ht[i + 2] = Math.cos(a), Ht[i + 3] = Math.sin(a), Ht[i + 4] = 1 / o, Ht[i + 5] = 1 / (.9 * o), Ht[i + 6] = hash(t, e, r ^ 14807);
		for (let e = 0; e < 12; e++) {
			let t = e * n / 12;
			Ht[i + 7 + e * 2] = Math.cos(t), Ht[i + 8 + e * 2] = Math.sin(t);
		}
	}
	let Ut = t === `seasponge` ? /* @__PURE__ */ new Float64Array(1372) : null, Wt = t === `seasponge` ? cachedNoise(28, 28, r ^ 29617) : null;
	if (Ut) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = .34 + .32 * hash(t, e, r ^ 6099), i = .34 + .32 * hash(t, e, r ^ 22951);
		for (let a = 0; a < 4; a++) {
			let o = ((e * 7 + t) * 4 + a) * 7, s = +(a === 0 || a === 2), c = +(a === 1 || a === 2), l = s + .34 + .32 * hash((t + s) % 7, (e + c) % 7, r ^ 6099), u = c + .34 + .32 * hash((t + s) % 7, (e + c) % 7, r ^ 22951), d = l - n, f = u - i, p = Math.sqrt(d * d + f * f);
			Ut[o] = (n + l) * .5, Ut[o + 1] = (i + u) * .5, Ut[o + 2] = a === 3 ? 1 : d / p, Ut[o + 3] = a === 3 ? 0 : f / p, Ut[o + 4] = 1 / (a === 3 ? .23 : p * .5 + .12), Ut[o + 5] = 1 / (a === 3 ? .23 : .14 + .03 * hash(t, e, r ^ 16825 + a)), Ut[o + 6] = +(a !== 2 || hash(t, e, r ^ 27941) < .35);
		}
	}
	let Gt = t === `scallopshell` || t === `oystershell` || t === `nautilusshell`, Kt = Gt ? cachedNoise(64, 64, r ^ 24209) : null, qt = t === `oystershell` ? 3 : 2, Jt = Gt ? new Float64Array(qt * qt * 8) : null;
	if (Jt) for (let e = 0; e < qt; e++) for (let i = 0; i < qt; i++) {
		let a = (e * qt + i) * 8, o = .45 * (hash(i, e, r ^ 12667) - .5), s = t === `oystershell`;
		Jt[a] = .5 + .12 * (hash(i, e, r ^ 6461) - .5), Jt[a + 1] = .5 + .12 * (hash(i, e, r ^ 27041) - .5), Jt[a + 2] = Math.cos(o), Jt[a + 3] = Math.sin(o), Jt[a + 4] = 1 / (s ? .73 : .47), Jt[a + 5] = 1 / (s ? .58 : .47), Jt[a + 6] = n * hash(i, e, r ^ 19239), Jt[a + 7] = .52 + .05 * Math.sin(Jt[a + 6]);
	}
	let Yt = t === `walnutshell` || t === `peanutshell` || t === `almondshell`, Xt = Yt ? cachedNoise(64, 48, r ^ 25559) : null, Zt = t === `peanutshell` || t === `walnutshell` ? cachedNoise(4, 6, r ^ 15193) : null, Qt = t === `walnutshell` ? /* @__PURE__ */ new Float64Array(1176) : null;
	if (Qt) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = .2 + .6 * hash(t, e, r ^ 6509), i = .2 + .6 * hash(t, e, r ^ 22451);
		for (let a = 0; a < 3; a++) {
			let o = a === 1 ? 0 : 1, s = a === 0 ? 0 : 1, c = o + .2 + .6 * hash((t + o) % 7, (e + s) % 7, r ^ 6509), l = s + .2 + .6 * hash((t + o) % 7, (e + s) % 7, r ^ 22451), u = c - n, d = l - i, f = Math.sqrt(u * u + d * d), p = ((e * 7 + t) * 3 + a) * 8;
			Qt[p] = (n + c) * .5, Qt[p + 1] = (i + l) * .5, Qt[p + 2] = u / f, Qt[p + 3] = d / f, Qt[p + 4] = 1 / (f * .5 + .2), Qt[p + 5] = 1 / (.28 + .14 * hash(t, e, r ^ 14753 + a)), Qt[p + 6] = .64 * (hash(t, e, r ^ 25031 + a) - .5), Qt[p + 7] = +(a === 1 || (a === 0 ? hash(t, e, r ^ 17067) < .6 : hash(t, e, r ^ 11667) < .45));
		}
	}
	let $t = t === `peanutshell` ? /* @__PURE__ */ new Float64Array(150) : null;
	if ($t) for (let e = 0; e < 5; e++) for (let t = 0; t < 10; t++) {
		let n = (e * 10 + t) * 3;
		$t[n] = .25 + .5 * hash(t, e, r ^ 11121), $t[n + 1] = 1 / (.09 + .04 * hash(t, e, r ^ 22481)), $t[n + 2] = .3 * (hash(t, e, r ^ 29113) - .5);
	}
	let en = t === `almondshell` ? /* @__PURE__ */ new Float64Array(1344) : null;
	if (en) for (let e = 0; e < 12; e++) for (let t = 0; t < 16; t++) {
		let n = (e * 16 + t) * 7, i = .3 * (hash(t, e, r ^ 14249) - .5);
		en[n] = .25 + .5 * hash(t, e, r ^ 6459), en[n + 1] = .25 + .5 * hash(t, e, r ^ 23847), en[n + 2] = Math.cos(i), en[n + 3] = Math.sin(i), en[n + 4] = 1 / (.1 + .03 * hash(t, e, r ^ 27411)), en[n + 5] = 1 / (.32 + .12 * hash(t, e, r ^ 16855)), en[n + 6] = +(hash(t, e, r ^ 31153) > .3);
	}
	let tn = t === `stone` || t === `metal` || t === `marble`, nn = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud` || t === `granite` || t === `slate` || t === `terrazzo` || t === `plaster` || t === `terracotta` || t === `cork` || t === `rubber` || t === `sandstone` || t === `travertine` || t === `pumice`, W = 0, G = 0, rn = 0, K = 0, q = 0, J = 0, Y = 0, X = 0, Z = 1, Q = 0, $ = 0, an = +(t === `nickelsilver` || t === `metal` || t === `diamondplate` || t === `hammeredmetal` || t === `galvanized` || t === `corrugatedmetal` || t === `standingseam` || t === `damascus` || t === `castiron` || t === `pressedtin` || t === `louveredmetal` || t === `crowncaps` || t === `rebar` || t === `guilloche` || t === `splitlockwashers` || t === `hexnuts` || t === `wingnuts` || t === `circlips` || t === `fivebarplate` || t === `scalemail` || t === `slottedmetal` || t === `castellatednuts` || t === `cotterpins` || t === `squarewashers` || t === `spurgears` || t === `paperclips` || t === `rclips` || t === `linchpins` || t === `starsocketbolts` || t === `sawblades` || t === `countersunkmetal` || t === `rollerchain` || t === `hinges` || t === `coins` || t === `ballchain` || t === `doorkeys` || t === `beltbuckles` || t === `carabiners` || t === `safetypins` || t === `grinderburrs` || t === `canlids` || t === `dinnerforks` || t === `hexkeys` || t === `perforatedmetal` || t === `expandedmetal` || t === `wiremesh` || t === `pyrite` || t === `knurledmetal` || t === `engineturned` || t === `goldleaf` || t === `rivetedmetal` || t === `weldedmetal`), pick = () => {
		switch (t) {
			case `mudtiretracks`: {
				let t = require_materials.proceduralMaterialPresets.mudtiretracks, n = new Float64Array(t.tracks), i = 1 / t.halfWidth, a = 1 / (t.lugWidth * t.lugWidth), o = t.bermCenter * t.bermCenter, s = 1 / t.bermSquaredWidth, c = cachedNoise(8, 8, r ^ 71697), l = cachedNoise(128, 128, r ^ 71699);
				for (let e = 0; e < t.tracks; e++) n[e] = hash(e, 0, r ^ 71701);
				return () => {
					let e = c(W, G), r = l(W, G), u = Math.floor(W * t.tracks), d = (W - (u + .5) / t.tracks) * i, f = d * d, p = smooth(clamp(1 - f)), m = (f - o) * s, h = smooth(clamp(1 - m * m));
					if (J = .44 + .1 * e + .05 * r, Y = .55 + .12 * e + .02 * r, X = t.roughness + .06 * r, Z = .99, p === 0 && h === 0) return;
					let g = 0;
					if (p > 0) {
						let e = fract(G * t.lugs - t.curvature * f + n[u] + .5) - .5;
						g = p * smooth(clamp(1 - e * e * a));
					}
					J += .05 * h - .09 * p - .19 * g, Y += .06 * h - .18 * p - .26 * g, X += -.04 * p + .035 * g, Z -= .12 * p + .32 * g;
				};
			}
			case `dinnerforks`: {
				let t = require_materials.proceduralMaterialPresets.dinnerforks, n = new Float64Array(t.cells * t.cells), i = 1 / t.tinePitch, a = 1 / t.tineHalfWidth, o = 1 / (t.rootY - t.tipY), s = 1 / t.tipShoulder, c = 1 / t.edgeBevel, l = 1 / t.bottomShoulder, u = 1 / t.ellipseShoulder, d = 1 / t.neckLength, f = 1 / t.wideningLength, p = cachedNoise(96, 96, r ^ 71441);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 71443);
				return () => {
					let e = W * t.cells, r = G * t.cells, m = Math.floor(e), h = Math.floor(r), g = fract(e) - .5, _ = fract(r) - .5, v = m + h & 1, y = v ? _ : g, b = v ? g : _, x = t.neckWidth + t.headWidening * (1 - smooth(clamp((b - t.headBottom) * d))) + t.handleWidening * smooth(clamp((b - t.wideningStart) * f)), S = clamp(1 - y * y / (x * x)), C = smooth(S), w = smooth(clamp(S * u)) * smooth(clamp((b - t.bodyTop) * c)) * smooth(clamp((t.bodyBottom - b) * l)), T = Math.floor((y - t.firstTine) * i + .5), E = 0, D = 0;
					if (T >= 0 && T < t.tines && b > t.tipY && b < t.rootY) {
						let e = smooth(clamp((t.rootY - b) * o)), n = (y - t.firstTine - T * t.tinePitch) * a / (1 - t.taper * e);
						D = smooth(clamp(1 - n * n)), E = D * smooth(clamp((b - t.tipY) * s)) * smooth(clamp((t.rootY - b) * c));
					}
					let O = w + E;
					if (J = .07, Y = .025, X = .94, Z = .35, O === 0) return;
					let k = w + E - w * E, A = (w * C + E * D) / O, j = (w * (.5 + .08 * C) + E * (.61 + .02 * D)) / O, M = p(W, G);
					J += k * (.64 + .06 * n[h * t.cells + m] + .015 * M + .035 * A - J), Y += k * (j + .001 * M - Y), X += k * (t.roughness + .02 * M - .035 * A - X), Z += k * (.98 - Z);
				};
			}
			case `sichuanpepperhusks`: {
				let t = require_materials.proceduralMaterialPresets.sichuanpepperhusks, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 112657), o = cachedNoise(40, 40, r ^ 112659), s = t.outerRadius * t.outerRadius, c = s * (1 + t.rimWarp), l = 1 / (s - t.outerCore * t.outerCore), u = t.innerRadius * t.innerRadius, d = 1 / (u - t.innerCore * t.innerCore), f = 1 / s, p = t.gapHalfWidth * t.gapHalfWidth, m = 1 / (p - t.gapCore * t.gapCore), h = 1 / (t.gapEnd - t.gapStart), g = 1 / (t.scarRadiusX * t.scarRadiusX), _ = 1 / (t.scarRadiusY * t.scarRadiusY), v = 1 / (1 - t.scarCoreQ), y = 1 / t.poreShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 112661);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 112663) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 112665) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 112667)), i[o + 5] = hash(a, e, r ^ 112669);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, b = fract(e) - i[r + 2], x = fract(n) - i[r + 3], S = (b * i[r] + x * i[r + 1]) * i[r + 4], C = (x * i[r] - b * i[r + 1]) * i[r + 4] * t.ellipticity, w = S * S + C * C;
					if (J = .025, Y = .06, X = .97, Z = .28, w >= c) return;
					let T = 2 * o(W, G) - 1, E = w / (1 + t.rimWarp * T), D = smooth(clamp((s - E) * l)), O = smooth(clamp((u - E) * d)), k = smooth(clamp((S - t.gapStart) * h)) * smooth(clamp((p - C * C) * m)), A = D * (1 - O) * (1 - k);
					if (A === 0) return;
					let j = a(W, G), M = T * T, N = smooth(clamp((t.poreThreshold - j) * y)), P = S - t.scarX, F = smooth(clamp((1 - P * P * g - C * C * _) * v)), I = smooth(clamp(1 - w * f));
					J += A * (.48 + .18 * i[r + 5] + .1 * M - .16 * N - .2 * F - J), Y += A * (t.huskHeight + t.domeHeight * I + t.wrinkleHeight * M - t.poreDepth * N - t.scarDepth * F - Y), X += A * (t.roughness + .05 * N + .08 * F - .03 * M - X), Z += A * (.95 - .1 * N - .16 * F - Z);
				};
			}
			case `hemimorphite`:
			case `smithsonite`: {
				let n = require_materials.proceduralMaterialPresets[t], i = new Float64Array(n.cells * n.cells * 5), a = cachedNoise(n.grainColumns, n.grainRows, r ^ 138513), o = cachedNoise(n.frostColumns, n.frostRows, r ^ 138515), s = cachedNoise(n.fineFrostColumns, n.fineFrostRows, r ^ 138527), c = 1 / n.shoulder, l = 1 - n.fineFrostWeight, u = 1 / n.frostSpan;
				for (let e = 0; e < n.cells; e++) for (let t = 0; t < n.cells; t++) {
					let a = (e * n.cells + t) * 5, o = n.radiusMinimum + n.radiusVariation * hash(t, e, r ^ 138517);
					i[a] = .5 + n.jitter * (2 * hash(t, e, r ^ 138519) - 1), i[a + 1] = .5 + n.jitter * (2 * hash(t, e, r ^ 138521) - 1), i[a + 2] = 1 / (o * o), i[a + 3] = n.heightMinimum + n.heightVariation * hash(t, e, r ^ 138523), i[a + 4] = hash(t, e, r ^ 138525);
				}
				return () => {
					let e = W * n.cells, t = G * n.cells, r = Math.floor(e), d = Math.floor(t), f = fract(e), p = fract(t), m = a(W, G), h = smooth(clamp((l * o(W, G) + n.fineFrostWeight * s(W, G) - n.frostThreshold) * u));
					J = n.matrixColor + n.matrixFrostTone * h, Y = n.matrixHeight + n.grainLift * m, X = n.matrixRoughness + n.matrixGrainRoughness * m, Z = n.matrixOcclusion + n.matrixFrostOcclusion * h;
					let g = 1, _ = 0, v = 0, y = 0;
					for (let e = -1; e <= 1; e++) {
						let t = (d + e + n.cells) % n.cells;
						for (let a = -1; a <= 1; a++) {
							let o = (r + a + n.cells) % n.cells, s = (t * n.cells + o) * 5, l = f - a - i[s], u = p - e - i[s + 1], d = 1 - (l * l + u * u) * i[s + 2];
							if (d <= 0) continue;
							let m = smooth(clamp(d * c)), h = d * d * i[s + 3];
							g *= 1 - m, _ += m, v += m * h, y += m * i[s + 4];
						}
					}
					let b = 1 - g;
					if (b === 0) return;
					let x = 1 / _, S = v * x;
					J += b * (n.noduleColor + n.noduleToneVariation * (y * x) + n.grainTone * m + n.frostTone * h - J), Y += b * (n.noduleBase + n.noduleLift * S + n.grainLift * m - Y), X += b * (n.roughness + n.grainRoughness * m - n.domeRoughness * S - X), Z += b * (n.noduleOcclusion + n.domeOcclusion * S - Z);
				};
			}
			case `chrysocolla`: {
				let t = require_materials.proceduralMaterialPresets.chrysocolla, i = t.centers.length / 2, a = 5 + i, o = new Float64Array(t.cells * t.cells * a), s = cachedNoise(128, 128, r ^ 112401), c = cachedNoise(64, 64, r ^ 112403), l = 1 / (1 - t.coreQ);
				for (let e = 0; e < t.cells; e++) for (let s = 0; s < t.cells; s++) {
					let c = (e * t.cells + s) * a, l = n * hash(s, e, r ^ 112405);
					o[c] = Math.cos(l), o[c + 1] = Math.sin(l), o[c + 2] = .5 + t.jitter * (2 * hash(s, e, r ^ 112407) - 1), o[c + 3] = .5 + t.jitter * (2 * hash(s, e, r ^ 112409) - 1), o[c + 4] = hash(s, e, r ^ 112411);
					for (let n = 0; n < i; n++) {
						let a = t.radiusMinimum + t.radiusVariation * hash(s * i + n, e, r ^ 112413);
						o[c + 5 + n] = 1 / (a * a);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * a, u = fract(e) - o[r + 2], d = fract(n) - o[r + 3], f = u * o[r] + d * o[r + 1], p = d * o[r] - u * o[r + 1];
					J = .04, Y = .06, X = .96, Z = .35;
					let m = 1, h = 0, g = 0;
					for (let e = 0; e < i; e++) {
						let n = f - t.centers[e * 2], i = p - t.centers[e * 2 + 1], a = (n * n + i * i) * o[r + 5 + e];
						if (a >= 1) continue;
						let s = smooth(clamp((1 - a) * l)), c = smooth(clamp(1 - a));
						m *= 1 - s, h += s, g += s * c;
					}
					let _ = 1 - m;
					if (_ === 0) return;
					let v = g / h, y = s(W, G);
					J += _ * (.55 + .12 * o[r + 4] + .12 * c(W, G) + .08 * v - J), Y += _ * (.35 + .25 * v + .002 * y - Y), X += _ * (t.roughness + .06 * y - .04 * v - X), Z += _ * (.91 + .08 * v - Z);
				};
			}
			case `utilityblades`: {
				let t = require_materials.proceduralMaterialPresets.utilityblades, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 112145), o = (t.bottomHalfWidth - t.topHalfWidth) / (t.bottom - t.top), s = 1 / t.bevel, c = t.notchHalfWidth * t.notchHalfWidth, l = 1 / (c - t.notchCore * t.notchCore), u = 1 / t.notchShoulder, d = 1 / (t.honeEnd - t.honeStart);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 112147);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 112149) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 112151) - 1), i[o + 4] = hash(a, e, r ^ 112153);
				}
				return () => {
					J = .04, Y = .025, X = .96, Z = .32, $ = 0;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, f = fract(e) - i[r + 2], p = fract(n) - i[r + 3], m = f * i[r] + p * i[r + 1], h = p * i[r] - f * i[r + 1];
					if (h <= t.top || h >= t.bottom) return;
					let g = t.topHalfWidth + (h - t.top) * o, _ = m + t.notchPitch, v = m - t.notchPitch, y = smooth(clamp((t.notchBottom - h) * u)), b = smooth(clamp((g + m) * s)) * smooth(clamp((g - m) * s)) * smooth(clamp((h - t.top) * s)) * smooth(clamp((t.bottom - h) * s)) * (1 - y * smooth(clamp((c - _ * _) * l))) * (1 - y * smooth(clamp((c - v * v) * l)));
					if (b === 0) return;
					let x = smooth(clamp((h - t.honeStart) * d)), S = a(W, G), C = i[r + 4], w = .72 + .06 * C + .02 * S, T = t.roughness + .04 * S;
					J += b * (w + x * (.88 + .04 * C + .015 * S - w) - J), Y += b * (.52 - t.honeDepth * x + .002 * S - Y), X += b * (T + x * (t.honeRoughness + .02 * S - T) - X), Z += b * (.98 + .01 * x - Z), $ = b;
				};
			}
			case `hempcrete`: {
				let t = require_materials.proceduralMaterialPresets.hempcrete, i = new Float64Array(t.cells * t.cells * 7), a = cachedNoise(128, 128, r ^ 111901), o = cachedNoise(96, 96, r ^ 111903), s = 1 / (1 - t.faceCoreQ), c = 1 / t.poreShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 7, s = n * hash(a, e, r ^ 111889);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 111891) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 111893) - 1), i[o + 4] = 1 / (t.halfLengthMinimum + t.halfLengthVariation * hash(a, e, r ^ 111895)), i[o + 5] = 1 / (t.halfWidthMinimum + t.halfWidthVariation * hash(a, e, r ^ 111897)), i[o + 6] = hash(a, e, r ^ 111899);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 7, l = fract(e) - i[r + 2], u = fract(n) - i[r + 3], d = l * i[r] + u * i[r + 1], f = u * i[r] - l * i[r + 1], p = d * i[r + 4], m = f * i[r + 5], h = p * p, g = h * h, _ = m * m, v = smooth(clamp((1 - g * g - _ * _) * s)), y = a(W, G), b = smooth(clamp((t.poreThreshold - o(W, G)) * c));
					if (J = .78 + .04 * y - .55 * b, Y = .5 + .004 * y - t.poreDepth * b, X = t.roughness + .03 * b, Z = .94 - .42 * b, v === 0) return;
					let x = fract(f * t.fiberFrequency) - .5, S = smooth(clamp(1 - 4 * x * x));
					J += v * (.28 + .18 * i[r + 6] + .02 * y + .02 * S - J), Y += v * (.5 + .006 * S + .003 * y - Y), X += v * (.82 + .03 * y + .02 * S - X), Z += v * (.98 - Z);
				};
			}
			case `phyllite`: {
				let t = require_materials.proceduralMaterialPresets.phyllite, n = cachedNoise(4, 4, r ^ 111377), i = cachedNoise(128, 128, r ^ 111379), a = cachedNoise(128, 128, r ^ 111381), o = hash(0, 0, r ^ 111383), s = t.ridgeRadius * t.ridgeRadius, c = 1 / (s - t.ridgeCore * t.ridgeCore), l = 1 / t.micaShoulder;
				return () => {
					let e = t.bands * (G + t.warp * (n(W, G) - .5)) + o, r = e - Math.floor(e + .5), u = smooth(clamp((s - r * r) * c)), d = i(W, G), f = smooth(clamp((a(W, G) - t.micaThreshold) * l));
					J = .34 + .12 * d + .1 * u + .12 * f, Y = .46 + t.ridgeHeight * u + .004 * d, X = t.roughness + .04 * (1 - u) - .18 * f + .03 * d, Z = .97 + .02 * u;
				};
			}
			case `nigellaseeds`: {
				let t = require_materials.proceduralMaterialPresets.nigellaseeds, i = new Float64Array(t.cells * t.cells * 5), a = Math.sqrt(3) * .5, o = new Float64Array([
					0,
					1,
					a,
					-.5,
					-a,
					-.5
				]), s = 1 / t.shoulder, c = 1 / t.inradius, l = 1 / t.aspectX, u = 1 / t.aspectY, d = 1 / t.poreShoulder, f = cachedNoise(128, 128, r ^ 111121), p = cachedNoise(256, 256, r ^ 111123);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 111125);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 111127) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 111129) - 1), i[o + 4] = hash(a, e, r ^ 111131);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, a = fract(e) - i[r + 2], m = fract(n) - i[r + 3], h = (a * i[r] + m * i[r + 1]) * l, g = (m * i[r] - a * i[r + 1]) * u, _ = 1, v = 1;
					for (let e = 0; e < o.length; e += 2) {
						let n = t.inradius - h * o[e] - g * o[e + 1];
						_ *= smooth(clamp(n * s)), v *= smooth(clamp(n * c));
					}
					if (J = .02, Y = .025, X = .97, Z = .3, _ === 0) return;
					let y = smooth(clamp((t.poreThreshold - p(W, G)) * d)), b = f(W, G), x = i[r + 4];
					J += _ * (.27 + .12 * x + .1 * v + .02 * b - .12 * y - J), Y += _ * (.42 + .24 * v - t.poreDepth * y + .002 * b - Y), X += _ * (t.roughness + .06 * y + .02 * b - X), Z += _ * (.9 + .09 * v - .06 * y - Z);
				};
			}
			case `screwhooks`: {
				let t = require_materials.proceduralMaterialPresets.screwhooks, i = new Float64Array(t.cells * t.cells * 4), a = cachedNoise(128, 128, r ^ 110865), o = t.ringOuter * t.ringOuter, s = t.ringInner * t.ringInner, c = 1 / (o - t.ringOuterCore * t.ringOuterCore), l = 1 / (t.ringInnerCore * t.ringInnerCore - s), u = (o + s) * .5, d = 2 / (o - s), f = 1 / (t.shankBottom - t.taperStart), p = 1 / t.endShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 4, s = n * hash(a, e, r ^ 110867);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 110869) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 110871) - 1);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 4, m = fract(e) - i[r + 2], h = fract(n) - i[r + 3], g = m * i[r] + h * i[r + 1], _ = h * i[r] - m * i[r + 1], v = _ - t.ringY, y = g * g + v * v, b = smooth(clamp((g - t.openingX) / t.openingWidth)) * smooth(clamp((t.openingY - _) / t.openingHeight)), x = smooth(clamp((o - y) * c)) * smooth(clamp((y - s) * l)) * (1 - b), S = (y - u) * d, C = smooth(clamp(1 - S * S)), w = 0, T = 0;
					if (_ > t.shankTop && _ < t.shankBottom) {
						let e = clamp((_ - t.taperStart) * f), n = g / (t.shankRadius * (_ <= t.taperStart ? 1 : (t.shankBottom - _) * f * (1 + e)));
						if (w = smooth(clamp((1 - n * n) / .3)) * smooth(clamp((_ - t.shankTop) * p)) * smooth(clamp((t.shankBottom - _) * p)), w > 0) {
							let e = _ * t.threadFrequency + g * t.threadSlope, n = e - Math.floor(e + .5);
							T = smooth(clamp((.0144 - n * n) / .0119));
						}
					}
					J = .06, Y = .035, X = .94, Z = .4;
					let E = x + w;
					if (E === 0) return;
					let D = x + w - x * w, O = (x * (.5 + .05 * C) + w * (.48 - t.threadDepth * T)) / E, k = a(W, G);
					J += D * (.72 + .04 * k - J) - w * .1 * T, Y += D * (O + .002 * k - Y), X += D * (t.roughness + .03 * k - X) + w * .05 * T, Z += D * (.97 - Z) - w * .05 * T, $ = D;
				};
			}
			case `parchment`: {
				let t = require_materials.proceduralMaterialPresets.parchment, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(4, 4, r ^ 110353), o = cachedNoise(96, 8, r ^ 110355), s = cachedNoise(128, 128, r ^ 110357);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 110359), c = t.widthMinimum + t.widthVariation * hash(a, e, r ^ 110361), l = t.lengthMinimum + t.lengthVariation * hash(a, e, r ^ 110363);
					i[o] = .2 + .6 * hash(a, e, r ^ 110365), i[o + 1] = .2 + .6 * hash(a, e, r ^ 110367), i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s), i[o + 4] = 1 / (c * c), i[o + 5] = 1 / (l * l);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), c = Math.floor(n), l = (c * t.cells + r) * 6, u = e - r - i[l], d = n - c - i[l + 1], f = u * i[l + 2] + d * i[l + 3], p = d * i[l + 2] - u * i[l + 3], h = smooth(clamp((1 - (f * f * i[l + 4] + p * p * i[l + 5])) / t.poreShoulder)), g = a(W, G), _ = o(W, G), v = s(W, G);
					J = .68 + .18 * g + .025 * _ + .008 * v, J += .35 * h * (.25 - J), Y = .4 + .015 * g + .002 * v - t.poreDepth * h, X += .02 * v + .02 * h, Z = 1 - .04 * h;
				};
			}
			case `padauk`:
			case `lignumvitae`:
			case `iroko`:
			case `purpleheart`:
			case `yellowheart`:
			case `bloodwood`:
			case `sapele`:
			case `wenge`: {
				let n = t === `lignumvitae` || t === `iroko` || t === `purpleheart` || t === `yellowheart` || t === `bloodwood` ? require_materials.proceduralMaterialPresets[t] : void 0, i = t === `padauk` ? require_materials.proceduralMaterialPresets.padauk : n, a = i ?? require_materials.proceduralMaterialPresets[t], o = i ? i.bandContrast : .3, s = i ? i.centerMinimum : .4, c = i ? i.centerRange : .2, l = n ? n.fiberContrast : .04, u = new Float64Array(a.columns * a.rows * 4), d = cachedNoise(3, 4, r ^ 110097), f = cachedNoise(n ? n.fiberColumns : 64, n ? n.fiberRows : 4, r ^ 110099), p = cachedNoise(128, 128, r ^ 110101), m = a.bandRadius * a.bandRadius, h = 1 / (m - a.bandCore * a.bandCore), g = 1 / a.poreShoulder;
				for (let e = 0; e < a.rows; e++) for (let t = 0; t < a.columns; t++) {
					let n = (e * a.columns + t) * 4;
					if (i && hash(t, e, r ^ 115223) >= i.poreChance) continue;
					let o = a.widthMinimum + a.widthVariation * hash(t, e, r ^ 110103), l = a.lengthMinimum + a.lengthVariation * hash(t, e, r ^ 110105);
					u[n] = .25 + .5 * hash(t, e, r ^ 110107), u[n + 1] = s + c * hash(t, e, r ^ 110109), u[n + 2] = 1 / (o * o), u[n + 3] = 1 / (l * l);
				}
				return () => {
					let e = W * a.columns, t = G * a.rows, n = Math.floor(e), r = Math.floor(t), i = (r * a.columns + n) * 4, s = 0;
					if (u[i + 3] > 0) {
						let a = e - n - u[i], o = t - r - u[i + 1];
						s = smooth(clamp((1 - (a * a * u[i + 2] + o * o * u[i + 3])) * g));
					}
					let c = W * a.bands + a.bandWarp * d(W, G), _ = c - Math.floor(c + .5), v = smooth(clamp((m - _ * _) * h)), y = f(W, G), b = p(W, G);
					J = .25 + o * v + l * y + .012 * b, J += s * (.035 - J), Y = .5 + .003 * b - a.poreDepth * s, X += .025 * b + .08 * s, Z = 1 - .25 * s;
				};
			}
			case `cavansite`: {
				let t = require_materials.proceduralMaterialPresets.cavansite, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.needles * 4), o = cachedNoise(128, 128, r ^ 133905), s = cachedNoise(32, 32, r ^ 133907), c = 1 / (t.bodyRadius * t.bodyRadius), l = 1 / t.bodyShoulder, u = 1 / t.needleShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 133909);
					i[o] = .5 + t.jitter * (2 * hash(a, e, r ^ 133911) - 1), i[o + 1] = .5 + t.jitter * (2 * hash(a, e, r ^ 133913) - 1), i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s), i[o + 4] = 1 / (t.scaleMinimum + t.scaleVariation * hash(a, e, r ^ 133915)), i[o + 5] = Number(hash(a, e, r ^ 133917) < t.chance);
				}
				for (let e = 0; e < t.needles; e++) {
					let i = e * 4, o = n * (e + t.needleAngleJitter * (2 * hash(e, 0, r ^ 133925) - 1)) / t.needles, s = t.needleHalfMinimum + t.needleHalfVariation * hash(e, 0, r ^ 133921), c = t.needleWidthMinimum + t.needleWidthVariation * hash(e, 0, r ^ 133923);
					a[i] = Math.cos(o), a[i + 1] = Math.sin(o), a[i + 2] = 1 / (s * s), a[i + 3] = 1 / (c * c);
				}
				return () => {
					let e = o(W, G), n = s(W, G), r = W * t.cells, d = G * t.cells, f = (Math.floor(d) * t.cells + Math.floor(r)) * 6;
					if (J = .86 + .11 * n + .012 * e, Y = .22 + .045 * n + .012 * e, X += .035 * e, Z = .94 + .04 * n, i[f + 5] === 0) return;
					let p = (fract(r) - i[f]) * i[f + 4], m = (fract(d) - i[f + 1]) * i[f + 4], h = p * i[f + 2] + m * i[f + 3], g = m * i[f + 2] - p * i[f + 3], _ = clamp(1 - (h * h + g * g) * c), v = _ * _, y = 1 - smooth(clamp(_ * l)), b = 1;
					for (let e = 0; e < t.needles; e++) {
						let n = e * 4, r = h * a[n] + g * a[n + 1] - t.needleOffset, i = g * a[n] - h * a[n + 1], o = clamp(1 - r * r * a[n + 2] - i * i * a[n + 3]);
						y *= 1 - smooth(clamp(o * u)), b *= 1 - o * o;
					}
					let x = 1 - y, S = 1 - b;
					x !== 0 && (J += x * (.03 + .09 * e + .03 * v - J), Y += x * (.25 + t.bodyLift * v + t.needleLift * S + .006 * e - Y), X += x * (t.crystalRoughness + .08 * e - X), Z += x * (.88 + .1 * v + .03 * S - Z));
				};
			}
			case `pyromorphite`:
			case `redberyl`: {
				let i = require_materials.proceduralMaterialPresets[t], a = new Float64Array(i.cells * i.cells * 8), o = cachedNoise(8, 8, r ^ 112401), s = cachedNoise(128, 128, r ^ 112403), c = 1 / (1 - i.coreRatio * i.coreRatio);
				for (let e = 0; e < i.cells; e++) for (let t = 0; t < i.cells; t++) {
					let o = (e * i.cells + t) * 8;
					if (hash(t, e, r ^ 112417) >= i.occupancy) continue;
					let s = n * hash(t, e, r ^ 112405), c = i.radius + i.radiusVariation * hash(t, e, r ^ 112407);
					a[o] = .5 + i.jitter * (2 * hash(t, e, r ^ 112409) - 1), a[o + 1] = .5 + i.jitter * (2 * hash(t, e, r ^ 112411) - 1), a[o + 2] = Math.cos(s), a[o + 3] = Math.sin(s), a[o + 4] = 1 / (c * c), a[o + 5] = .58 + .08 * hash(t, e, r ^ 112413), a[o + 6] = .12 + .1 * hash(t, e, r ^ 112415), a[o + 7] = c * c / .75;
				}
				return () => {
					let e = W * i.cells, t = G * i.cells, n = (Math.floor(t) * i.cells + Math.floor(e)) * 8, r = s(W, G), l = o(W, G);
					if (J = .76 + .15 * l + .1 * r, Y = .14 + .045 * l + .05 * r, X = .8 + .08 * r, Z = .99, a[n + 7] === 0) return;
					let u = fract(e) - a[n], d = fract(t) - a[n + 1];
					if (u * u + d * d >= a[n + 7]) return;
					let f = u * a[n + 2] + d * a[n + 3], p = d * a[n + 2] - u * a[n + 3], m = .5 * f + .8660254037844386 * p, h = .5 * f - .8660254037844386 * p, g = a[n + 4], _ = smooth(clamp((1 - f * f * g) * c)) * smooth(clamp((1 - m * m * g) * c)) * smooth(clamp((1 - h * h * g) * c));
					_ !== 0 && (J += _ * (a[n + 6] + .05 * r - J), Y += _ * (a[n + 5] + .001 * r - Y), X += _ * (i.roughness + .025 * r - X), Z += _ * (.98 - Z));
				};
			}
			case `fluorite`: {
				let t = require_materials.proceduralMaterialPresets.fluorite, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(8, 8, r ^ 109841), o = cachedNoise(128, 128, r ^ 109843);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 109845);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 109847) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 109849) - 1), i[o + 4] = 1 / (t.halfExtent + t.extentVariation * hash(a, e, r ^ 109851)), i[o + 5] = hash(a, e, r ^ 109853);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, s = fract(e) - i[r + 2], c = fract(n) - i[r + 3], l = (s * i[r] + c * i[r + 1]) * i[r + 4], u = (c * i[r] - s * i[r + 1]) * i[r + 4], d = l * l, f = u * u, p = d * d, m = f * f, h = p * p + m * m, g = smooth(clamp((1 - h) / t.shoulder)), _ = o(W, G);
					if (J = .87 + .08 * a(W, G) + .012 * _, Y = .35 + .002 * _, X += .015 * _, Z = 1, g === 0) return;
					let v = fract(h * t.zones), y = 16 * v * v * (1 - v) * (1 - v);
					J += g * (.22 + .48 * y + .03 * i[r + 5] + .012 * _ - J), X += .025 * g * (1 - y);
				};
			}
			case `watercaltrops`: {
				let t = require_materials.proceduralMaterialPresets.watercaltrops, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 109585), o = cachedNoise(8, 8, r ^ 109587), s = 1 / (t.bodyX * t.bodyX), c = 1 / (t.bodyY * t.bodyY), l = 1 / (t.hornEnd - t.hornStart), u = 1 / t.rootShoulder, d = 1 / t.tipShoulder, f = 1 / (t.scarRadius * t.scarRadius);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 109589);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 109591) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 109593) - 1), i[o + 4] = hash(a, e, r ^ 109595);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, p = fract(e) - i[r + 2], m = fract(n) - i[r + 3], h = p * i[r] + m * i[r + 1], g = m * i[r] - p * i[r + 1], _ = Math.abs(h), v = g - t.bodyCenterY, y = h * h * s + v * v * c, b = smooth(clamp((1 - y) / t.bodyShoulder)), x = smooth(clamp(1 - y)), S = clamp((_ - t.hornStart) * l), C = 0;
					if (_ > t.hornStart && _ < t.hornEnd) {
						let e = t.hornRootY - t.hornBend * smooth(S), n = t.hornWidth + (t.hornTipWidth - t.hornWidth) * S, r = (g - e) / n;
						C = smooth(clamp(1 - r * r)) * smooth(clamp((_ - t.hornStart) * u)) * smooth(clamp((t.hornEnd - _) * d));
					}
					let w = b + C;
					if (J = .07, Y = .035, X = .94, Z = .45, w === 0) return;
					let T = a(W, G), E = fract((h + .015 * (o(W, G) - .5)) * t.creaseFrequency) - .5, D = smooth(clamp(1 - 4 * E * E)), O = g - t.scarY, k = smooth(clamp(1 - (h * h + O * O) * f)), A = b + C - b * C, j = (b * (.46 + .14 * x - .018 * D - .035 * k) + C * (.45 + .08 * S)) / w;
					J += A * (.27 + .06 * i[r + 4] + .04 * T + .08 * x - .045 * D - .07 * k - J), Y += A * (j + .003 * T - Y), X += A * (t.roughness + .04 * T + .04 * D - X), Z += A * (.97 - .06 * D - Z);
				};
			}
			case `shackles`: {
				let t = require_materials.proceduralMaterialPresets.shackles, i = new Float64Array(t.cells * t.cells * 4), a = cachedNoise(128, 128, r ^ 109329), o = t.tubeRadius * t.tubeRadius, s = 1 / (o - t.tubeCore * t.tubeCore), c = t.pinRadius * t.pinRadius, l = 1 / (c - t.pinCore * t.pinCore), u = t.bossRadius * t.bossRadius, d = 1 / (u - t.bossCore * t.bossCore), f = 1 / (t.headRadiusX * t.headRadiusX), p = 1 / (t.headRadiusY * t.headRadiusY), m = t.holeRadius * t.holeRadius, h = 1 / (t.holeShoulder * t.holeShoulder - m);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 4, s = n * hash(a, e, r ^ 109331);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 109333) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 109335) - 1);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 4, g = fract(e) - i[r + 2], _ = fract(n) - i[r + 3], v = g * i[r] + _ * i[r + 1], y = _ * i[r] - g * i[r + 1], b = Math.abs(v), x = Math.hypot(v, Math.min(0, y - t.arcY)) - t.bowRadius, S = Math.max(0, y - t.pinY), C = x * x + S * S, w = smooth(clamp((o - C) * s)), T = smooth(clamp(1 - C / o)), E = Math.max(0, b - t.pinHalf), D = y - t.pinY, O = E * E + D * D, k = smooth(clamp((c - O) * l)), A = b - t.bowRadius, j = A * A + D * D, M = smooth(clamp((u - j) * d)), N = v - t.headX, P = N * N * f + D * D * p, F = v - t.holeX, I = y - t.holeY, R = smooth(clamp((F * F + I * I - m) * h)), z = smooth(clamp((1 - P) / .25)) * R, ee = w + M + k + z;
					if (J = .06, Y = .035, X = .94, Z = .4, ee === 0) return;
					let te = 1 - (1 - w) * (1 - M) * (1 - k) * (1 - z), ne = (w * (.47 + .12 * T) + M * .59 + k * .66 + z * .68) / ee, re = a(W, G);
					J += te * (.72 + .04 * re + .025 * T - J), Y += te * (ne + .002 * re - Y), X += te * (t.roughness + .035 * re - .035 * T - X), Z += te * (.97 - Z), $ = te;
				};
			}
			case `sodalite`: {
				let t = require_materials.proceduralMaterialPresets.sodalite, n = cachedNoise(t.coarseCells, t.coarseCells, r ^ 124177), i = cachedNoise(t.mediumCells, t.mediumCells, r ^ 124179), a = cachedNoise(6, 6, r ^ 124181), o = cachedNoise(128, 128, r ^ 124183), s = cachedNoise(4, 4, r ^ 124185), c = cachedNoise(4, 4, r ^ 124187), l = t.veinRadius * t.veinRadius, u = 1 / (l - t.veinCore * t.veinCore), d = 1 / t.patchRange;
				return () => {
					let e = W + t.warp * (s(W, G) - .5), r = G + t.warp * (c(W, G) - .5), f = t.coarseWeight * n(e, r) + t.mediumWeight * i(e, r) - t.veinCenter, p = smooth(clamp((l - f * f) * u)), m = a(W, G), h = t.patchStrength * smooth(clamp((m - t.patchStart) * d)), g = 1 - (1 - p) * (1 - h), _ = o(W, G);
					J = t.matrixBase + t.matrixCloud * m + t.matrixGrain * _, J += g * (t.veinBase + t.veinCloud * m - J), Y = t.height + t.grainHeight * _, X = t.roughness + t.grainRoughness * _ + t.veinRoughness * g, Z = 1;
				};
			}
			case `howlite`: {
				let t = require_materials.proceduralMaterialPresets.howlite, n = new Float64Array(t.cells * t.cells * 2), i = cachedNoise(4, 4, r ^ 108817), a = cachedNoise(4, 4, r ^ 108819), o = cachedNoise(8, 8, r ^ 108821), s = cachedNoise(128, 128, r ^ 108823), c = 1 / (t.support * t.support);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 2;
					n[a] = t.siteMinimum + t.siteVariation * hash(i, e, r ^ 108825), n[a + 1] = t.siteMinimum + t.siteVariation * hash(i, e, r ^ 108827);
				}
				return () => {
					let e = fract(W + t.warp * (i(W, G) - .5)) * t.cells, r = fract(G + t.warp * (a(W, G) - .5)) * t.cells, l = Math.floor(e), u = Math.floor(r), d = 0, f = 0;
					for (let i = -1; i <= 1; i++) for (let a = -1; a <= 1; a++) {
						let o = l + a, s = u + i, p = ((s + t.cells) % t.cells * t.cells + (o + t.cells) % t.cells) * 2, m = e - o - n[p], h = r - s - n[p + 1], g = clamp(1 - (m * m + h * h) * c), _ = g * g, v = _ * _, y = v * v;
						d += y, f += y * y;
					}
					let m = smooth(clamp((1 - f / (d * d) - t.veinThreshold) / t.veinFeather)), h = o(W, G), g = s(W, G);
					J = .88 + .08 * h + .012 * g, J += m * (.25 + .08 * h - J), Y = .5 + .002 * g, X += .015 * g + .04 * m, Z = 1;
				};
			}
			case `mulberrypaper`: {
				let t = require_materials.proceduralMaterialPresets.mulberrypaper, i = t.fibersPerCell * 8, a = new Float64Array(t.cells * t.cells * i), o = cachedNoise(8, 8, r ^ 108561), s = cachedNoise(128, 128, r ^ 108563);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) for (let s = 0; s < t.fibersPerCell; s++) {
					let c = (e * t.cells + o) * i + s * 8, l = r ^ Math.imul(s + 1, 108565), u = n * hash(o, e, l), d = t.lengthMinimum + t.lengthVariation * hash(o, e, l ^ 49), f = t.widthMinimum + t.widthVariation * hash(o, e, l ^ 83);
					a[c] = t.centerMinimum + t.centerVariation * hash(o, e, l ^ 117), a[c + 1] = t.centerMinimum + t.centerVariation * hash(o, e, l ^ 151), a[c + 2] = Math.cos(u), a[c + 3] = Math.sin(u), a[c + 4] = 1 / d, a[c + 5] = 1 / (f * f), a[c + 6] = t.bend * (2 * hash(o, e, l ^ 185) - 1), a[c + 7] = hash(o, e, l ^ 219);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), c = Math.floor(n), l = o(W, G), u = s(W, G), d = 1, f = 1;
					for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
						let l = r + s, u = c + o, p = ((u + t.cells) % t.cells * t.cells + (l + t.cells) % t.cells) * i;
						for (let r = 0; r < t.fibersPerCell; r++) {
							let t = p + r * 8, i = e - l - a[t], o = n - u - a[t + 1], s = (i * a[t + 2] + o * a[t + 3]) * a[t + 4];
							if (Math.abs(s) >= 1) continue;
							let c = 1 - s * s, m = o * a[t + 2] - i * a[t + 3] - a[t + 6] * c, h = clamp(1 - m * m * a[t + 5]), g = c * c * h * h;
							a[t + 7] < .2 ? f *= 1 - g : d *= 1 - g;
						}
					}
					let p = 1 - d, m = 1 - f, h = 1 - d * f;
					J = .74 + .09 * l + .015 * u, J += p * (.97 - J), J += m * (.38 - J), Y = .35 + .025 * l + .008 * u + t.fiberLift * h, X += .02 * u - .025 * h, Z = 1;
				};
			}
			case `brakediscs`: {
				let t = require_materials.proceduralMaterialPresets.brakediscs, i = new Float64Array(t.cells * t.cells * 2), a = t.bolts + 2 * t.drillsPerRing, o = new Float64Array(a * 3), s = cachedNoise(128, 128, r ^ 108305), c = t.radius * t.radius, l = 1 / (c - t.coreRadius * t.coreRadius), u = t.bore * t.bore, d = 1 / (t.boreShoulder * t.boreShoulder - u), f = t.hubRadius * t.hubRadius, p = 1 / (f - t.hubCore * t.hubCore), m = t.boltRadius * t.boltRadius, h = 1 / (t.boltShoulder * t.boltShoulder - m), g = t.drillRadius * t.drillRadius, _ = 1 / (t.drillShoulder * t.drillShoulder - g);
				for (let e = 0; e < a; e++) {
					let r = e < t.bolts, i = r ? e : (e - t.bolts) % t.drillsPerRing, a = e >= t.bolts + t.drillsPerRing, s = n * (i + (a ? .5 : 0)) / (r ? t.bolts : t.drillsPerRing), c = r ? t.boltRing : a ? t.outerDrillRing : t.innerDrillRing;
					o[e * 3] = c * Math.cos(s), o[e * 3 + 1] = c * Math.sin(s), o[e * 3 + 2] = +!!r;
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 2, s = n * hash(a, e, r ^ 108307);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 2, v = fract(e) - .5, y = fract(n) - .5, b = v * i[r] + y * i[r + 1], x = y * i[r] - v * i[r + 1], S = b * b + x * x, C = smooth(clamp((c - S) * l)) * smooth(clamp((S - u) * d));
					if (J = .04, Y = .04, X = .94, Z = .4, C === 0) return;
					for (let e = 0; e < a; e++) {
						let t = b - o[e * 3], n = x - o[e * 3 + 1], r = o[e * 3 + 2] === 1, i = smooth(clamp(((r ? m : g) - t * t - n * n) * (r ? h : _) + 1));
						C *= 1 - i;
					}
					if ($ = C, C === 0) return;
					let w = smooth(clamp((f - S) * p)), T = S * t.wearFrequency, E = T - Math.floor(T + .5), D = smooth(clamp(1 - 16 * E * E)) * (1 - w), O = s(W, G);
					J += C * (.7 + .03 * O - .13 * w - .025 * D - J), Y += C * (.48 + .1 * w + .002 * O - .001 * D), X += C * (t.roughness + .06 * w + .04 * D + .02 * O - X), Z += .58 * C;
				};
			}
			case `kitkattiles`: {
				let t = require_materials.proceduralMaterialPresets.kitkattiles, n = new Float64Array(t.columns * t.rows), i = cachedNoise(128, 128, r ^ 108049), a = t.columns / t.rows, o = 1 / t.shoulder, s = 1 / (t.troughRadius * t.troughRadius), c = 1 / t.endShoulder;
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = hash(i, e, r ^ 108051);
				return () => {
					let e = W * t.columns, r = G * t.rows, l = fract(e), u = fract(r) * a, d = smooth(clamp((l - t.grout) * o)) * smooth(clamp((1 - l - t.grout) * o)) * smooth(clamp((u - t.grout) * o)) * smooth(clamp((a - u - t.grout) * o)), f = l - .5, p = smooth(clamp(1 - f * f * s)) * smooth(clamp((u - t.endFade) * c)) * smooth(clamp((a - u - t.endFade) * c));
					if (J = .24, Y = .04, X = .93, Z = .56, Q = 1 - d, d === 0) return;
					let m = n[Math.floor(r) * t.columns + Math.floor(e)], h = i(W, G);
					J += d * (.55 + .2 * m + .012 * h - .12 * p - J), Y += d * (.58 - t.troughLift * p + .002 * h), X += d * (t.roughness + .02 * h - .035 * p - X), Z += d * (.43 - .035 * p);
				};
			}
			case `persimmonslice`: {
				let t = require_materials.proceduralMaterialPresets.persimmonslice, i = new Float64Array(t.cells * t.cells * 4), a = new Float64Array(t.seeds * 2), o = cachedNoise(128, 128, r ^ 107793), s = t.radius * t.radius, c = t.rindStart * t.rindStart, l = 1 / t.faceShoulder, u = 1 / (t.rindFull * t.rindFull - c), d = t.pithRadius * t.pithRadius, f = 1 / t.pithShoulder, p = 1 / (t.seedLength * t.seedLength), m = 1 / (t.seedWidth * t.seedWidth), h = 1 / t.seedShoulder;
				for (let e = 0; e < t.seeds; e++) {
					let r = n * e / t.seeds;
					a[e * 2] = Math.cos(r), a[e * 2 + 1] = Math.sin(r);
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 4, s = n * hash(a, e, r ^ 107795);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 107797) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 107799) - 1);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 4, g = fract(e) - i[r + 2], _ = fract(n) - i[r + 3], v = g * i[r] + _ * i[r + 1], y = _ * i[r] - g * i[r + 1], b = v * v + y * y, x = smooth(clamp((s - b) * l));
					if (J = .025, Y = .04, X = .95, Z = .4, x === 0) return;
					let S = smooth(clamp((b - c) * u)), C = smooth(clamp((d - b) * f)), w = o(W, G), T = 1;
					for (let e = 0; e < t.seeds; e++) {
						let n = v * a[e * 2] + y * a[e * 2 + 1] - t.seedCenter, r = y * a[e * 2] - v * a[e * 2 + 1], i = n * n * p + r * r * m;
						T *= 1 - smooth(clamp((1 - i) * h));
					}
					let E = 1 - T;
					J += x * (.73 + .02 * w - .19 * S + .15 * C - .62 * E - J), Y += x * (.48 + .004 * w), X += x * (t.roughness + .02 * w + .07 * S + .12 * E - X), Z += .58 * x;
				};
			}
			case `oilspotglaze`: {
				let t = require_materials.proceduralMaterialPresets.oilspotglaze, i = new Float64Array(t.cells * t.cells * 7), a = cachedNoise(128, 128, r ^ 107537), o = cachedNoise(64, 64, r ^ 107539), s = 1 / t.outerShoulder, c = 1 / t.rimShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 7, s = n * hash(a, e, r ^ 107541), c = t.radiusMinimum + t.radiusVariation * hash(a, e, r ^ 107543), l = t.aspectMinimum + t.aspectVariation * hash(a, e, r ^ 107545);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 107547) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 107549) - 1), i[o + 4] = 1 / (c * c), i[o + 5] = 1 / (c * c * l * l), i[o + 6] = hash(a, e, r ^ 107551);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 7, l = fract(e) - i[r + 2], u = fract(n) - i[r + 3], d = l * i[r] + u * i[r + 1], f = u * i[r] - l * i[r + 1], p = d * d * i[r + 4] + f * f * i[r + 5], m = smooth(clamp((1 - p) * s)), h = m * smooth(clamp((p - t.rimStart) * c)), g = a(W, G);
					if (J = .035 + .02 * g, Y = .42 + .002 * g, X += .025 * g, Z = 1, m === 0) return;
					let _ = o(W, G);
					J += m * (.21 + .13 * i[r + 6] + .07 * _) + .34 * h, X += .05 * m - .025 * h;
				};
			}
			case `bayleaf`: {
				let t = require_materials.proceduralMaterialPresets.bayleaf, i = new Float64Array(t.cells * t.cells * 4), a = new Float64Array(t.veinPairs), o = cachedNoise(128, 128, r ^ 107281), s = 1 / t.halfLength, c = 1 / (t.halfWidth * t.halfWidth), l = 1 / (t.midribRadius * t.midribRadius), u = 1 / (t.veinRadius * t.veinRadius), d = 1 / (t.stemRadius * t.stemRadius), f = 1 / (t.marginShoulder * t.marginShoulder);
				for (let e = 0; e < t.veinPairs; e++) a[e] = (e - (t.veinPairs - 1) * .5) * t.veinSpacing;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 4, s = n * hash(a, e, r ^ 107283);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 107285) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 107287) - 1);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 4, p = fract(e) - i[r + 2], m = fract(n) - i[r + 3], h = p * i[r] + m * i[r + 1], g = m * i[r] - p * i[r + 1], _ = Math.abs(h), v = g * s, y = clamp(1 - v * v), b = h * h * c, x = smooth(clamp((y * y - b) / t.shoulder)), S = smooth(clamp((g - t.stemStart) / .015)) * smooth(clamp((t.stemEnd - g) / .015)) * smooth(clamp(1 - h * h * d)), C = 1 - (1 - x) * (1 - S);
					if (J = .08, Y = .06, X = t.roughness + .24, Z = .4, C === 0) return;
					let w = smooth(clamp(1 - h * h * l)), T = b - t.marginFraction ** 2 * y * y, E = smooth(clamp(1 - T * T * f)), D = smooth(clamp(_ / t.axisFade)), O = g - t.veinSlope * _ - t.veinBend * h * h, k = 1;
					for (let e = 0; e < t.veinPairs; e++) {
						let t = O - a[e];
						k *= 1 - smooth(clamp(1 - t * t * u));
					}
					let A = (1 - k) * D, j = o(W, G);
					J += x * (.46 + t.grainColor * j + .14 * w + .06 * A + .04 * E) + (1 - x) * .25 * S, Y += x * (.43 + .13 * y + t.grainHeight * j + .06 * w + .025 * A + .02 * E) + (1 - x) * .24 * S, X += -.24 * C + x * (.02 * j - .05 * w), Z += .57 * C;
				};
			}
			case `bluelaceagate`:
			case `rhodochrosite`: {
				let n = require_materials.proceduralMaterialPresets[t], i = cachedNoise(3, 3, r ^ 107025), a = cachedNoise(t === `bluelaceagate` ? require_materials.proceduralMaterialPresets.bluelaceagate.fineColumns : 9, 3, r ^ 107027), o = cachedNoise(12, 12, r ^ 107029), s = cachedNoise(128, 128, r ^ 107031), c = hash(0, 0, r ^ 107033), l = n.wideRadius ** 2 - n.wideCore ** 2, u = n.fineRadius ** 2 - n.fineCore ** 2;
				return () => {
					let e = n.bands * G + n.warp * i(W, G) + n.fineWarp * a(W, G) + c, t = e - Math.floor(e + .5), r = e - n.companionOffset, d = r - Math.floor(r + .5), f = smooth(clamp((n.wideRadius ** 2 - t * t) / l)), p = smooth(clamp((n.fineRadius ** 2 - d * d) / u)), m = 1 - (1 - f) * (1 - p), h = o(W, G), g = s(W, G);
					J = .22 + .14 * h, J += m * (.94 - J), Y = .4 + .002 * g, X += .03 * h + .025 * m, Z = 1;
				};
			}
			case `turnbuckles`: {
				let t = require_materials.proceduralMaterialPresets.turnbuckles, i = new Float64Array(t.cells * t.cells * 4), a = cachedNoise(128, 128, r ^ 106769);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 4, s = n * hash(a, e, r ^ 106771);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 106773) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 106775) - 1);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 4, o = fract(e) - i[r + 2], s = fract(n) - i[r + 3], c = o * i[r] + s * i[r + 1], l = s * i[r] - o * i[r + 1], u = Math.abs(c), d = (c / t.frameX) ** 4 + (l / t.frameY) ** 4, f = (c / t.openingX) ** 4 + (l / t.openingY) ** 4, p = smooth(clamp((1 - d) / .15)) * smooth(clamp((f - .75) / .25)), m = (u - t.eyeX) ** 2 + l * l, h = smooth(clamp((t.eyeRadius ** 2 - m) / (t.eyeRadius ** 2 - t.eyeCore ** 2))) * smooth(clamp((m - t.holeRadius ** 2) / (t.holeShoulder ** 2 - t.holeRadius ** 2))), g = smooth(clamp((t.rodHalf ** 2 - (u - t.rodX) ** 2) / (t.rodHalf ** 2 - t.rodCore ** 2))) * smooth(clamp((t.rodRadius ** 2 - l * l) / (t.rodRadius ** 2 - t.rodInner ** 2))), _ = 1 - (1 - p) * (1 - g) * (1 - h);
					if (J = .07, Y = .06, X = .94, Z = .4, _ === 0) return;
					let v = a(W, G), y = u * t.threadFrequency + 4 * l, b = y - Math.floor(y + .5), x = smooth(clamp((.0144 - b * b) / .0119));
					Y += p * (.53 - Y), Y += g * (.45 - .06 * x - Y), Y += h * (.55 - Y), J += _ * (.65 + .05 * v - J) - g * .16 * x, X += _ * (t.roughness + .03 * v - X) + g * .05 * x, Z += _ * (.96 - Z) - g * .06 * x, $ = _;
				};
			}
			case `tonkabeans`: {
				let t = require_materials.proceduralMaterialPresets.tonkabeans, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 114705), o = cachedNoise(t.wrinkleColumns, t.wrinkleRows, r ^ 114707), s = cachedNoise(3, 6, r ^ 114709), c = 1 / (t.halfLength * t.halfLength), l = 1 / (t.halfWidth * t.halfWidth), u = 1 / t.shoulder, d = 1 / t.wrinkleShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 114711);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 114713) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 114715) - 1), i[o + 4] = hash(a, e, r ^ 114717);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, f = fract(e) - i[r + 2], p = fract(n) - i[r + 3], m = f * i[r] + p * i[r + 1], h = p * i[r] - f * i[r + 1], g = clamp(1 - h * h * c), _ = m - t.bend * g, v = clamp(g - _ * _ * l), y = smooth(clamp(v * u));
					if (J = .025, Y = .035, X = .97, Z = .3, y === 0) return;
					let b = i[r + 4], x = _ + .5 + b, S = h + .5 + b, C = s(x, S), w = smooth(clamp((t.wrinkleThreshold - o(x + t.wrinkleWarp * (2 * C - 1), S)) * d)), T = smooth(v), E = a(W, G);
					J += y * (.32 + .12 * b + .1 * T + .025 * E - .18 * w - J), Y += y * (t.bodyBase + t.domeHeight * T + t.grainHeight * E - t.wrinkleDepth * w - Y), X += y * (t.roughness + .14 * w + .025 * E - X), Z += y * (.97 - .25 * w - Z);
				};
			}
			case `septarian`: {
				let t = require_materials.proceduralMaterialPresets.septarian, n = t.cells * t.cells, i = new Float64Array(n * 3), a = Array(n), o = (2 * t.neighborRadius + 1) ** 2 - 1, s = new Float64Array(o * 3), c = new Float64Array((o + 4) * 2), l = new Float64Array((o + 4) * 2), u = new Int16Array(o + 4), d = new Int16Array(o + 4), f = new Uint8Array(o), p = 2 * (.5 + t.jitter) ** 2, m = Math.sqrt(p), h = cachedNoise(t.cloudCells, t.cloudCells, r ^ 115473), g = cachedNoise(t.cloudCells, t.cloudCells, r ^ 115475), _ = cachedNoise(t.grainCells, t.grainCells, r ^ 115477), v = cachedNoise(t.fractureCells, t.fractureCells, r ^ 115485), y = cachedNoise(t.fractureCells, t.fractureCells, r ^ 115487), b = 1 / t.veinShoulder, x = 1 / t.veinCloudShoulder, S = 1 / t.hostShoulder, C = t.rimRoughness - t.roughness, w = t.hostRoughness - t.rimRoughness;
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let a = (e * t.cells + n) * 3;
					i[a] = .5 + t.jitter * (2 * hash(n, e, r ^ 115479) - 1), i[a + 1] = .5 + t.jitter * (2 * hash(n, e, r ^ 115481) - 1), i[a + 2] = t.hostColor + t.hostVariation * (hash(n, e, r ^ 115483) - .5);
				}
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let r = e * t.cells + n, p = r * 3, h = 4, g = c, _ = l, v = u, y = d, b = 0;
					g[0] = -m, g[1] = -m, g[2] = m, g[3] = -m, g[4] = m, g[5] = m, g[6] = -m, g[7] = m, v.fill(-1, 0, 4);
					for (let r = -t.neighborRadius; r <= t.neighborRadius; r++) for (let a = -t.neighborRadius; a <= t.neighborRadius; a++) {
						if (a === 0 && r === 0) continue;
						let o = (n + a + t.cells) % t.cells, c = ((e + r + t.cells) % t.cells * t.cells + o) * 3, l = a + i[c] - i[p], u = r + i[c + 1] - i[p + 1], d = (l * l + u * u) * .5;
						s[b * 3] = l, s[b * 3 + 1] = u, s[b * 3 + 2] = d;
						let f = 0, m = g[(h - 1) * 2], x = g[(h - 1) * 2 + 1], S = d - l * m - u * x;
						for (let e = 0; e < h; e++) {
							let t = g[e * 2], n = g[e * 2 + 1], r = d - l * t - u * n;
							if (S >= 0 != r >= 0) {
								let i = S / (S - r);
								_[f * 2] = i === 0 ? m : i === 1 ? t : m + i * (t - m), _[f * 2 + 1] = i === 0 ? x : i === 1 ? n : x + i * (n - x), y[f++] = S >= 0 ? v[e] : b;
							}
							r >= 0 && (_[f * 2] = t, _[f * 2 + 1] = n, y[f++] = v[e]), m = t, x = n, S = r;
						}
						h = f;
						let C = g;
						g = _, _ = C;
						let w = v;
						v = y, y = w, b++;
					}
					f.fill(0);
					let x = 0;
					for (let e = 0; e < h; e++) {
						let t = v[e], n = (e + h - 1) % h, r = g[e * 2] - g[n * 2], i = g[e * 2 + 1] - g[n * 2 + 1];
						t >= 0 && f[t] === 0 && r * r + i * i > 0 && (f[t] = 1, x++);
					}
					let S = new Float64Array(x * 3), C = 0;
					for (let e = 0; e < o; e++) {
						if (f[e] === 0) continue;
						let t = s[e * 3], n = s[e * 3 + 1], r = 1 / Math.sqrt(t * t + n * n);
						S[C++] = t * r, S[C++] = n * r, S[C++] = s[e * 3 + 2] * r;
					}
					a[r] = S;
				}
				return () => {
					let e = h(W, G), n = g(W, G), r = v(W, G), o = y(W, G), s = _(W, G) - .5, c = W * t.cells + t.warp * (e - .5) + t.fractureWarp * (r - .5), l = G * t.cells + t.warp * (n - .5) + t.fractureWarp * (o - .5), u = Math.floor(c), d = Math.floor(l), f = t.veinCore + t.veinVariation * smooth(clamp((e - t.veinCloudCore) * x)), m = f + t.veinShoulder, T = f + t.rimWidth, E = T + t.hostShoulder, D = t.calciteColor + t.calciteCloud * (e - .5) + t.calciteGrain * s, O = t.rimColor + t.rimGrain * s, k = O - D, A = t.hostCloud * (n - .5) + t.hostFine * (r - .5) + t.hostGrain * s - O;
					J = D, Y = t.height + t.grainHeight * (s + .5), X = t.roughness + t.grainRoughness * s, Z = 1, $ = 0, Q = 0;
					for (let e = -t.candidateRadius; e <= t.candidateRadius; e++) for (let n = -t.candidateRadius; n <= t.candidateRadius; n++) {
						let r = u + n, o = d + e, s = (r % t.cells + t.cells) % t.cells, h = (o % t.cells + t.cells) % t.cells * t.cells + s, g = h * 3, _ = c - r - i[g], v = l - o - i[g + 1];
						if (_ * _ + v * v > p) continue;
						let y = a[h], x = 1, D = 1;
						for (let e = 0; e < y.length; e += 3) {
							let t = y[e + 2] - _ * y[e] - v * y[e + 1];
							if (t <= f) {
								x = D = 0;
								break;
							}
							t < m && (x *= smooth((t - f) * b)), t <= T ? D = 0 : D !== 0 && t < E && (D *= smooth((t - T) * S));
						}
						x !== 0 && (J += x * k + D * (i[g + 2] + A), X += x * C + D * w);
					}
				};
			}
			case `tripointscrewheads`:
			case `pentalobescrewheads`: {
				let i = t === `tripointscrewheads`, a = require_materials.proceduralMaterialPresets[t], o = require_materials.proceduralMaterialPresets.pentalobescrewheads, s = require_materials.proceduralMaterialPresets.tripointscrewheads, c = i ? s.armCount : o.lobeCount, l = i ? 1 : o.lobeOffset, u = new Float64Array(a.cells * a.cells * 5), d = new Float64Array(c * 2), f = cachedNoise(128, 128, r ^ 114961), p = a.capRadius * a.capRadius, m = 1 / (p - a.capCore * a.capCore), h = i ? s.slotCore * s.slotCore : o.coreRadius * o.coreRadius, g = i ? h : o.coreFull * o.coreFull, _ = i ? 0 : 1 / (h - g), v = i ? 0 : o.lobeRadius * o.lobeRadius, y = i ? 0 : 1 / (v - o.lobeCore * o.lobeCore), b = i ? s.slotRadius * s.slotRadius : 0, x = i ? 1 / (b - h) : 0, S = i ? (s.armLength + s.slotRadius) ** 2 : (o.lobeOffset + o.lobeRadius) ** 2, C = a.socketRoughness - a.roughness;
				for (let e = 0; e < c; e++) {
					let t = n * e / c;
					d[e * 2] = l * Math.cos(t), d[e * 2 + 1] = l * Math.sin(t);
				}
				for (let e = 0; e < a.cells; e++) for (let t = 0; t < a.cells; t++) {
					let i = (e * a.cells + t) * 5, o = n * hash(t, e, r ^ 114963);
					u[i] = Math.cos(o), u[i + 1] = Math.sin(o), u[i + 2] = .5 + a.jitter * (2 * hash(t, e, r ^ 114965) - 1), u[i + 3] = .5 + a.jitter * (2 * hash(t, e, r ^ 114967) - 1), u[i + 4] = hash(t, e, r ^ 114969);
				}
				return () => {
					let e = W * a.cells, t = G * a.cells, n = (Math.floor(t) * a.cells + Math.floor(e)) * 5, r = fract(e) - u[n + 2], o = fract(t) - u[n + 3], c = r * r + o * o, l = smooth(clamp((p - c) * m));
					if (J = .03, Y = .035, X = .96, Z = .3, $ = 0, Q = 1, l === 0) return;
					let w = 0;
					if (c <= g) w = 1;
					else if (c < S) {
						let e = r * u[n] + o * u[n + 1], t = o * u[n] - r * u[n + 1];
						if (i) {
							let n = 1;
							for (let r = 0; r < d.length; r += 2) {
								let i = e * d[r] + t * d[r + 1], a = t * d[r] - e * d[r + 1], o = i < 0 ? i : Math.max(0, i - s.armLength);
								n *= 1 - smooth(clamp((b - a * a - o * o) * x));
							}
							w = 1 - n;
						} else {
							let n = 1 - smooth(clamp((h - c) * _));
							for (let r = 0; r < d.length; r += 2) {
								let i = e - d[r], a = t - d[r + 1];
								n *= 1 - smooth(clamp((v - i * i - a * a) * y));
							}
							w = 1 - n;
						}
					}
					let T = f(W, G);
					J += l * (.78 + .05 * u[n + 4] + .025 * T - .57 * w), Y += l * (a.faceHeight + a.grainHeight * T - a.socketDepth * w), X += l * (a.roughness + C * w + .025 * T - X), Z += l * (.68 - .35 * w), $ = l, Q = 1 - l;
				};
			}
			case `datepits`: {
				let t = require_materials.proceduralMaterialPresets.datepits, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 113681), o = 1 / (t.halfLength * t.halfLength), s = 1 / (t.halfWidth * t.halfWidth), c = 1 / t.shoulder, l = t.grooveRadius * t.grooveRadius, u = 1 / (l - t.grooveCore * t.grooveCore), d = t.grooveEnd * t.grooveEnd, f = 1 / (d - t.grooveFullEnd * t.grooveFullEnd);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 113683);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 113685) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 113687) - 1), i[o + 4] = hash(a, e, r ^ 113689);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, p = fract(e) - i[r + 2], m = fract(n) - i[r + 3], h = p * i[r] + m * i[r + 1], g = m * i[r] - p * i[r + 1], _ = clamp(1 - g * g * o), v = h - t.bend * _, y = clamp(_ - v * v * s), b = smooth(clamp(y * c));
					if (J = .025, Y = .035, X = .97, Z = .3, b === 0) return;
					let x = v - t.grooveBend * g * (1 - g * g * o), S = smooth(clamp((l - x * x) * u)) * smooth(clamp((d - g * g) * f)), C = smooth(y), w = a(W, G);
					J += b * (.49 + .14 * i[r + 4] + .1 * C + .025 * w - .32 * S - J), Y += b * (t.bodyBase + t.domeHeight * C + t.grainHeight * w - t.grooveDepth * S - Y), X += b * (t.roughness + .08 * S + .025 * w - X), Z += b * (.97 - .26 * S - Z);
				};
			}
			case `bocote`:
			case `kingwood`:
			case `braziliantulipwood`:
			case `macassarebony`:
			case `zebrawood`: {
				let n = require_materials.proceduralMaterialPresets[t], i = t === `macassarebony` || t === `braziliantulipwood` || t === `kingwood`, a = t === `kingwood` ? require_materials.proceduralMaterialPresets.kingwood : t === `braziliantulipwood` ? require_materials.proceduralMaterialPresets.braziliantulipwood : require_materials.proceduralMaterialPresets.macassarebony, o = new Float64Array(n.columns * n.rows * 4), s = cachedNoise(i ? a.warpColumns : 3, i ? a.warpRows : 5, r ^ 117275), c = cachedNoise(n.bands, 4, r ^ 117277), l = cachedNoise(64, 4, r ^ 117279), u = cachedNoise(128, 128, r ^ 117281), d = n.bandRadius * n.bandRadius, f = 1 / (d - n.bandCore * n.bandCore), p = 1 / n.poreShoulder;
				for (let e = 0; e < n.rows; e++) for (let t = 0; t < n.columns; t++) {
					if (hash(t, e, r ^ 117265) >= n.poreChance) continue;
					let i = (e * n.columns + t) * 4, a = n.widthMinimum + n.widthVariation * hash(t, e, r ^ 117267), s = n.lengthMinimum + n.lengthVariation * hash(t, e, r ^ 117269);
					o[i] = .25 + .5 * hash(t, e, r ^ 117271), o[i + 1] = .35 + .3 * hash(t, e, r ^ 117273), o[i + 2] = 1 / (a * a), o[i + 3] = 1 / (s * s);
				}
				return () => {
					let e = W * n.columns, t = G * n.rows, r = Math.floor(e), i = Math.floor(t), a = (i * n.columns + r) * 4, m = 0;
					if (o[a + 3] > 0) {
						let n = e - r - o[a], s = t - i - o[a + 1];
						m = smooth(clamp((1 - (n * n * o[a + 2] + s * s * o[a + 3])) * p));
					}
					let h = W * n.bands + n.bandWarp * s(W, G), g = (h - Math.floor(h + .5)) / (n.bandWidthMinimum + n.bandWidthVariation * c(W, G)), _ = smooth(clamp((d - g * g) * f)), v = l(W, G), y = u(W, G);
					J = n.faceColor - n.bandContrast * _ + .1 * (v - .5) + .04 * y, J += m * (.035 - J), Y = .5 + n.grainHeight * y - n.poreDepth * m, X += .025 * y + .08 * m, Z = 1 - .25 * m;
				};
			}
			case `castorbeans`: {
				let t = require_materials.proceduralMaterialPresets.castorbeans, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(t.spotColumns, t.spotRows, r ^ 117009), o = cachedNoise(5, 7, r ^ 117011), s = cachedNoise(128, 128, r ^ 117013), c = 1 / (t.halfLength * t.halfLength), l = 1 / (t.halfWidth * t.halfWidth), u = 1 / t.bodyShoulder, d = 1 / (t.caruncleHalfX * t.caruncleHalfX), f = 1 / (t.caruncleHalfY * t.caruncleHalfY), p = 1 / t.caruncleShoulder, m = 1 / t.spotShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 117015);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 117017) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 117019) - 1), i[o + 4] = hash(a, e, r ^ 117021);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, h = fract(e) - i[r + 2], g = fract(n) - i[r + 3], _ = h * i[r] + g * i[r + 1], v = g * i[r] - h * i[r + 1], y = clamp(1 - _ * _ * l - v * v * c), b = smooth(clamp(y * u)), x = v - t.caruncleY, S = clamp(1 - _ * _ * d - x * x * f), C = smooth(clamp(S * p));
					if (J = .025, Y = .03, X = .96, Z = .3, $ = 0, Q = 0, b === 0 && C === 0) return;
					let w = s(W, G);
					if (b > 0) {
						let e = i[r + 4], n = _ + .5 + e, s = v + .5 + e, c = o(n, s), l = smooth(clamp((a(n + t.spotWarp * (c - .5), s) - t.spotThreshold) * m)), u = smooth(y);
						J += b * (t.shellColor - t.spotDarkening * l + .025 * w - J), Y += b * (t.bodyBase + t.domeHeight * u + t.grainHeight * w - Y), X += b * (t.roughness + .012 * w - X), Z += b * (.98 - Z);
					}
					J += C * (t.caruncleColor + .015 * w - J), Y += C * (t.caruncleBase + t.caruncleDome * smooth(S) + t.grainHeight * w - Y), X += C * (t.caruncleRoughness + .015 * w - X), Z += C * (.96 - Z);
				};
			}
			case `bronzite`:
			case `pietersite`: {
				let i = require_materials.proceduralMaterialPresets[t], a = t === `bronzite` ? cachedNoise(96, 96, r ^ 112913) : void 0, o = 1 / require_materials.proceduralMaterialPresets.bronzite.fleckShoulder, s = require_materials.proceduralMaterialPresets.bronzite.fleckMinimum, c = require_materials.proceduralMaterialPresets.bronzite.fleckBase, l = new Float64Array(i.cells * i.cells * 23), u = cachedNoise(5, 7, r ^ 116497), d = cachedNoise(128, 128, r ^ 116499), f = 1 / i.edgeShoulder, p = i.bandRadius * i.bandRadius, m = 1 / (p - i.bandCore * i.bandCore), h = i.fiberRadius * i.fiberRadius, g = 1 / (h - i.fiberCore * i.fiberCore), _ = (i.planeMinimum + i.planeVariation) / Math.cos((n / 5 + i.angleJitter) * .5);
				for (let e = 0; e < i.cells; e++) for (let t = 0; t < i.cells; t++) {
					let a = (e * i.cells + t) * 23, o = n * hash(t, e, r ^ 116501), s = i.radiusMinimum + i.radiusVariation * hash(t, e, r ^ 116503), c = n * hash(t, e, r ^ 116511), u = s * _;
					l[a] = i.siteMinimum + i.siteVariation * hash(t, e, r ^ 116505), l[a + 1] = i.siteMinimum + i.siteVariation * hash(t, e, r ^ 116507), l[a + 2] = +(hash(t, e, r ^ 116509) < i.blueChance), l[a + 3] = Math.cos(c), l[a + 4] = Math.sin(c), l[a + 5] = hash(t, e, r ^ 116513), l[a + 6] = i.bandMinimum + i.bandVariation * hash(t, e, r ^ 116515), l[a + 22] = u * u;
					for (let c = 0; c < 5; c++) {
						let u = o + n * c / 5 + i.angleJitter * (hash(t, e, r ^ 116529 + c) - .5), d = a + 7 + c * 3;
						l[d] = Math.cos(u), l[d + 1] = Math.sin(u), l[d + 2] = s * (i.planeMinimum + i.planeVariation * hash(t, e, r ^ 116545 + c));
					}
				}
				return () => {
					let e = W * i.cells, t = G * i.cells, n = Math.floor(e), r = Math.floor(t), _ = u(W, G), v = d(W, G), y = a ? smooth(clamp((a(W, G) - s) * o)) : 1;
					J = i.cementBase + i.cementCloud * _;
					for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
						let u = n + s, d = r + o, b = (u % i.cells + i.cells) % i.cells, x = ((d % i.cells + i.cells) % i.cells * i.cells + b) * 23, S = e - u - l[x], C = t - d - l[x + 1];
						if (S * S + C * C >= l[x + 22]) continue;
						let w = 1;
						for (let e = 0; e < 5 && w > 0; e++) {
							let t = x + 7 + e * 3;
							w *= smooth(clamp((l[t + 2] - S * l[t] - C * l[t + 1]) * f));
						}
						if (w === 0) continue;
						let T = S * l[x + 3] + C * l[x + 4], E = (C * l[x + 3] - S * l[x + 4] + i.bend * T * T + i.warp * (_ - .5)) * l[x + 6], D = fract(E + l[x + 5] + .5) - .5, O = fract(E * i.fibers + l[x + 5] + .5) - .5, k = smooth(clamp((p - D * D) * m)), A = smooth(clamp((h - O * O) * g)), j = (l[x + 2] ? i.blueBase + i.blueBand * k + i.blueFiber * A : i.goldBase + i.goldBand * k + i.goldFiber * A) + i.pigmentGrain * v;
						J += w * ((a ? c + (j - c) * y : j) - J);
					}
					Y = i.height + i.grainHeight * v, X = i.roughness + i.grainRoughness * (v - .5), Z = 1, $ = 0, Q = 0;
				};
			}
			case `squareholewashers`: {
				let t = require_materials.proceduralMaterialPresets.squareholewashers, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 119579), o = t.outerRadius * t.outerRadius, s = 1 / (o - t.fullOuter * t.fullOuter), c = 1 / t.holeBevel;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 119569);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 119571) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 119573) - 1), i[o + 4] = hash(a, e, r ^ 119575);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, l = fract(e) - i[r + 2], u = fract(n) - i[r + 3], d = l * l + u * u, f = smooth(clamp((o - d) * s));
					if (J = .035, Y = .025, X = .96, Z = .3, $ = 0, Q = 1, f === 0) return;
					let p = l * i[r] + u * i[r + 1], m = u * i[r] - l * i[r + 1], h = f * (1 - smooth(clamp((t.holeHalfWidth - Math.abs(p)) * c)) * smooth(clamp((t.holeHalfWidth - Math.abs(m)) * c)));
					if (h === 0) return;
					let g = a(W, G);
					J += h * (.83 + .05 * i[r + 4] + .02 * g - J), Y += h * (t.bodyHeight + t.grainHeight * g - Y), X += h * (t.roughness + .025 * g - X), Z += h * (.99 - Z), $ = h, Q = 1 - h;
				};
			}
			case `tigerwood`:
			case `blackpalm`:
			case `snakewood`: {
				let n = require_materials.proceduralMaterialPresets[t], i = new Float64Array(n.columns * n.rows * n.patchSlots * 6), a = cachedNoise(96, 6, r ^ 119825), o = cachedNoise(128, 8, r ^ 119827), s = cachedNoise(128, 128, r ^ 119829), c = 1 / (1 - n.coreQ);
				for (let e = 0; e < n.rows; e++) for (let t = 0; t < n.columns; t++) for (let a = 0; a < n.patchSlots; a++) {
					let o = t * n.patchSlots + a;
					if (hash(o, e, r ^ 119831) >= n.patchChance) continue;
					let s = (e * n.columns * n.patchSlots + o) * 6, c = n.widthMinimum + n.widthVariation * hash(o, e, r ^ 119833), l = n.lengthMinimum + n.lengthVariation * hash(o, e, r ^ 119835);
					i[s] = .5 + n.jitterX * (2 * hash(o, e, r ^ 119837) - 1), i[s + 1] = .5 + n.jitterY * (2 * hash(o, e, r ^ 119839) - 1), i[s + 2] = 1 / (c * c), i[s + 3] = 1 / (l * l), i[s + 4] = n.slope * (2 * hash(o, e, r ^ 119841) - 1), i[s + 5] = n.bend * (2 * hash(o, e, r ^ 119843) - 1);
				}
				return () => {
					let e = W * n.columns, t = G * n.rows, r = Math.floor(e), l = Math.floor(t), u = 1;
					for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
						let s = r + o, d = l + a, f = ((d + n.rows) % n.rows * n.columns + (s + n.columns) % n.columns) * n.patchSlots;
						for (let r = 0; r < n.patchSlots; r++) {
							let n = (f + r) * 6;
							if (i[n + 2] === 0) continue;
							let a = t - d - i[n + 1], o = e - s - i[n] - i[n + 4] * a - i[n + 5] * a * a, p = smooth(clamp((1 - (o * o * i[n + 2] + a * a * i[n + 3])) * c));
							u *= 1 - p;
						}
					}
					let d = 1 - u, f = a(W, G), p = o(W, G), m = s(W, G);
					J = n.faceColor + n.woodContrast * f + n.fiberContrast * p + .01 * m - n.patchContrast * d, Y = .45 + .006 * f + .002 * p + .001 * m, X = n.roughness + .02 * m, Z = 1;
				};
			}
			case `safflowerseeds`: {
				let t = require_materials.proceduralMaterialPresets.safflowerseeds, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 120091), o = 1 / (t.halfWidth * t.halfWidth), s = 1 / (t.halfLength * t.halfLength), c = 1 / t.shoulder, l = t.ribRadius * t.ribRadius, u = 1 / (l - t.ribCore * t.ribCore), d = 1 / (t.ribLength * t.ribLength), f = 1 / (t.scarWidth * t.scarWidth), p = 1 / (t.scarLength * t.scarLength), m = 1 / t.scarShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 120081);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 120083) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 120085) - 1), i[o + 4] = hash(a, e, r ^ 120087);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, h = fract(e) - i[r + 2], g = fract(n) - i[r + 3], _ = h * i[r] + g * i[r + 1], v = g * i[r] - h * i[r + 1], y = Math.max(0, 1 - v * v * s), b = (v < 0 ? y * y : y) - _ * _ * o, x = smooth(clamp(b * c));
					if (J = .035, Y = .025, X = .96, Z = .3, Q = 1, x === 0) return;
					let S = _ + t.ribOffset, C = _ - t.ribOffset, w = (smooth(clamp((l - S * S) * u)) + smooth(clamp((l - C * C) * u))) * smooth(clamp(1 - v * v * d)), T = v - t.scarY, E = smooth(clamp((1 - C * C * f - T * T * p) * m)), D = a(W, G);
					J += x * (.91 + .035 * i[r + 4] + .015 * D - t.ribContrast * w - t.scarContrast * E - J), Y += x * (t.bodyHeight + t.domeHeight * smooth(clamp(b)) + t.ribHeight * w + t.grainHeight * D - t.scarDepth * E - Y), X += x * (t.roughness + .025 * D + .08 * E - X), Z += x * (.99 - .05 * E - Z), Q = 1 - x;
				};
			}
			case `thulite`:
			case `unakite`: {
				let n = t === `thulite`, i = require_materials.proceduralMaterialPresets[t], a = n ? require_materials.proceduralMaterialPresets.thulite.pinkBase : require_materials.proceduralMaterialPresets.unakite.greenBase, o = n ? require_materials.proceduralMaterialPresets.thulite.whiteContrast : require_materials.proceduralMaterialPresets.unakite.pinkContrast, s = cachedNoise(i.coarseCells, i.coarseCells, r ^ 120337), c = cachedNoise(i.mediumCells, i.mediumCells, r ^ 120339), l = cachedNoise(i.fineCells, i.fineCells, r ^ 120341);
				return () => {
					let e = l(W, G), n = smooth(smooth(i.coarseWeight * s(W, G) + i.mediumWeight * c(W, G) + i.fineWeight * e)), r = smooth(n * n);
					J = a + o * r + i.fineContrast * e, Y = i.height + i.grainHeight * e, X = i.roughness + .08 * (1 - r) + .015 * e, Z = 1;
				};
			}
			case `eudialyte`: {
				let t = require_materials.proceduralMaterialPresets.eudialyte, n = new Float64Array(t.cells * t.cells * 6), i = cachedNoise(t.grainCells, t.grainCells, r ^ 123673), a = 1 / t.supportSquared, o = 1 / t.seamShoulder;
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) for (let a = 0; a < 2; a++) {
					let o = i * 2 + a, s = (e * t.cells + i) * 6 + a * 3, c = hash(o, e, r ^ 123669);
					n[s] = t.siteMinimum + t.siteVariation * hash(o, e, r ^ 123665), n[s + 1] = t.siteMinimum + t.siteVariation * hash(o, e, r ^ 123667), n[s + 2] = c > t.darkThreshold ? t.raspberryBase + t.raspberryVariation * c : t.matrixBase + t.matrixVariation * c;
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, s = Math.floor(e), c = Math.floor(r), l = 0, u = 0, d = 0;
					for (let i = -1; i <= 1; i++) for (let o = -1; o <= 1; o++) {
						let f = s + o, p = c + i, m = ((p + t.cells) % t.cells * t.cells + (f + t.cells) % t.cells) * 6;
						for (let t = 0; t < 2; t++) {
							let i = m + t * 3, o = e - f - n[i], s = r - p - n[i + 1], c = clamp(1 - (o * o + s * s) * a);
							c !== 0 && (c *= c, c *= c, c *= c, c *= c, l += c * n[i + 2], u += c, d += c * c);
						}
					}
					let f = 1 / u, p = l * f, m = smooth(clamp((d * f * f - t.seamThreshold) * o)), h = i(W, G);
					J = t.matrixBase + m * (p * (1 - t.fineContrast + t.fineContrast * h) - t.matrixBase), Y = t.height + t.grainHeight * h, X = t.roughness + .05 * (1 - p) + .01 * h, Z = 1;
				};
			}
			case `sphericalwashers`: {
				let t = require_materials.proceduralMaterialPresets.sphericalwashers, n = new Float64Array(t.cells * t.cells), i = cachedNoise(128, 128, r ^ 122899), a = t.outerRadius * t.outerRadius, o = 1 / (a - t.fullOuter * t.fullOuter), s = t.boreRadius * t.boreRadius, c = 1 / (t.fullBore * t.fullBore - s), l = t.sphereRadius * t.sphereRadius, u = Math.sqrt(l - a);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = t.faceColor + t.faceVariation * hash(i, e, r ^ 122897);
				return () => {
					let e = W * t.cells, r = G * t.cells, d = Math.floor(e), f = Math.floor(r), p = fract(e) - .5, m = fract(r) - .5, h = p * p + m * m, g = smooth(clamp((a - h) * o)) * smooth(clamp((h - s) * c));
					if (J = .035, Y = .025, X = .96, Z = .3, $ = 0, Q = 1, g === 0) return;
					let _ = Math.sqrt(l - h) - u, v = i(W, G);
					J += g * (n[f * t.cells + d] + t.grainContrast * v - J), Y += g * (t.bodyBase + t.domeScale * _ - Y), X += g * (t.roughness + .025 * v - X), Z += g * (.95 - Z), $ = g, Q = 1 - g;
				};
			}
			case `wavewashers`: {
				let t = require_materials.proceduralMaterialPresets.wavewashers, i = new Float64Array(t.cells * t.cells * 2), a = cachedNoise(128, 128, r ^ 120595), o = t.outerRadius * t.outerRadius, s = 1 / (o - t.fullOuter * t.fullOuter), c = t.boreRadius * t.boreRadius, l = 1 / (t.fullBore * t.fullBore - c);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 2, s = n * hash(a, e, r ^ 120593);
					i[o] = t.waveAmplitude * Math.cos(s), i[o + 1] = t.waveAmplitude * Math.sin(s);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), u = Math.floor(n), d = e - r - .5, f = n - u - .5, p = d * d, m = f * f, h = p + m, g = smooth(clamp((o - h) * s)) * smooth(clamp((h - c) * l));
					if (J = .035, Y = .025, X = .96, Z = .3, $ = 0, Q = 1, g === 0) return;
					let _ = (u * t.cells + r) * 2, v = (d * (p - 3 * m) * i[_] + f * (3 * p - m) * i[_ + 1]) / (h * Math.sqrt(h)), y = a(W, G);
					J += g * (t.faceColor + t.grainContrast * y - J), Y += g * (t.bodyBase + v + t.grainHeight * y - Y), X += g * (t.roughness + .025 * y - X), Z += g * (.95 - Z), $ = g, Q = 1 - g;
				};
			}
			case `cupwashers`: {
				let t = require_materials.proceduralMaterialPresets.cupwashers, n = new Float64Array(t.cells * t.cells * 3), i = cachedNoise(128, 128, r ^ 119063), a = t.outerRadius * t.outerRadius, o = 1 / (a - t.fullOuter * t.fullOuter), s = t.boreRadius * t.boreRadius, c = 1 / (t.fullBore * t.fullBore - s), l = 1 / (t.coneEnd - t.coneStart), u = t.coneShoulder, d = 1 / (2 * u), f = 1 / (1 - u);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 3;
					n[a] = .5 + t.jitter * (2 * hash(i, e, r ^ 119057) - 1), n[a + 1] = .5 + t.jitter * (2 * hash(i, e, r ^ 119059) - 1), n[a + 2] = hash(i, e, r ^ 119061);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, p = (Math.floor(r) * t.cells + Math.floor(e)) * 3, m = fract(e) - n[p], h = fract(r) - n[p + 1], g = m * m + h * h, _ = smooth(clamp((a - g) * o)) * smooth(clamp((g - s) * c));
					if (J = .035, Y = .025, X = .96, Z = .3, $ = 0, Q = 1, _ === 0) return;
					let v = clamp((Math.sqrt(g) - t.coneStart) * l), y = (v < u ? v * v * d : v > 1 - u ? 1 - u - (1 - v) * (1 - v) * d : v - u * .5) * f, b = i(W, G);
					J += _ * (.57 + .26 * y + .05 * n[p + 2] + .015 * b - J), Y += _ * (t.bodyBase + t.coneRise * y + t.grainHeight * b - Y), X += _ * (t.roughness + .025 * b - X), Z += _ * (.82 + .17 * y - Z), $ = _, Q = 1 - _;
				};
			}
			case `makore`:
			case `anigre`: {
				let n = require_materials.proceduralMaterialPresets[t], i = new Float64Array(n.columns * n.rows * 4), a = cachedNoise(3, 5, r ^ 118801), o = cachedNoise(96, 4, r ^ 118803), s = cachedNoise(128, 128, r ^ 118805), c = cachedNoise(5, 5, r ^ 118807), l = t === `makore` ? cachedNoise(5, 9, r ^ 112657) : void 0, u = require_materials.proceduralMaterialPresets.makore.curlThreshold, d = 1 / require_materials.proceduralMaterialPresets.makore.curlShoulder, f = 1 / n.poreShoulder;
				for (let e = 0; e < n.rows; e++) for (let t = 0; t < n.columns; t++) {
					if (hash(t, e, r ^ 118809) >= n.poreChance) continue;
					let a = (e * n.columns + t) * 4, o = n.widthMinimum + n.widthVariation * hash(t, e, r ^ 118811), s = n.lengthMinimum + n.lengthVariation * hash(t, e, r ^ 118813);
					i[a] = .25 + .5 * hash(t, e, r ^ 118815), i[a + 1] = .35 + .3 * hash(t, e, r ^ 118817), i[a + 2] = 1 / (o * o), i[a + 3] = 1 / (s * s);
				}
				return () => {
					let e = W * n.columns, t = G * n.rows, r = Math.floor(e), p = Math.floor(t), m = (p * n.columns + r) * 4, h = 0;
					if (i[m + 3] > 0) {
						let n = e - r - i[m], a = t - p - i[m + 1];
						h = smooth(clamp((1 - (n * n * i[m + 2] + a * a * i[m + 3])) * f));
					}
					let g = G * n.curlBands + W * n.curlSkew + n.curlWarp * (a(W, G) - .5), _ = smooth(1 - Math.abs(2 * fract(g) - 1)), v = s(W, G), y = l ? n.curlContrast * smooth(clamp((l(W, G) - u) * d)) : n.curlContrast;
					J = n.faceColor - y * _ + n.fiberContrast * (o(W, G) - .5) + .04 * (c(W, G) - .5) + .02 * v, J += h * (.08 - J), Y = .5 + n.grainHeight * v - n.poreDepth * h, X += .025 * v + .06 * h, Z = 1 - .18 * h, $ = 0, Q = 0;
				};
			}
			case `mungbeans`:
			case `blackeyedpeas`: {
				let i = t === `mungbeans` ? require_materials.proceduralMaterialPresets.mungbeans : require_materials.proceduralMaterialPresets.blackeyedpeas, a = new Float64Array(i.cells * i.cells * 3), o = cachedNoise(5, 7, r ^ 120849), s = cachedNoise(128, 128, r ^ 120851), c = 1 / (i.halfLength * i.halfLength), l = 1 / (i.halfWidth * i.halfWidth), u = 1 / i.bodyShoulder, d = 1 / (i.eyeWidth * i.eyeWidth), f = 1 / (i.eyeLength * i.eyeLength), p = 1 / i.eyeShoulder, m = i.hilumRadius * i.hilumRadius, h = 1 / (m - i.hilumCore * i.hilumCore);
				for (let e = 0; e < i.cells; e++) for (let t = 0; t < i.cells; t++) {
					let o = (e * i.cells + t) * 3, s = n * hash(t, e, r ^ 120853);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s), a[o + 2] = i.shellColor + i.shellVariation * hash(t, e, r ^ 120855);
				}
				return () => {
					let e = W * i.cells, t = G * i.cells, n = (Math.floor(t) * i.cells + Math.floor(e)) * 3, r = fract(e) - .5, g = fract(t) - .5, _ = r * a[n] + g * a[n + 1], v = g * a[n] - r * a[n + 1], y = _ * _, b = v * v, x = clamp(1 - y * l - b * c), S = smooth(clamp(x * u));
					if (J = .025, Y = .025, X = .96, Z = .3, $ = 0, Q = 0, S === 0) return;
					let C = smooth(clamp((1 - y * d - b * f) * p)), w = Math.max(0, Math.abs(v) - i.hilumStraight), T = smooth(clamp((m - y - w * w) * h)), E = s(W, G), D = a[n + 2] + i.coatContrast * o(W, G) + i.grainContrast * E, O = D + C * (i.eyeColor - D);
					J += S * (O + T * (i.hilumColor - O) - J), Y += S * (i.bodyBase + i.domeHeight * smooth(x) - Y), X += S * (i.roughness + .025 * E - X), Z += S * (.98 - Z);
				};
			}
			case `adzukibeans`: {
				let t = require_materials.proceduralMaterialPresets.adzukibeans, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(5, 7, r ^ 118545), o = cachedNoise(128, 128, r ^ 118547), s = 1 / (t.halfLength * t.halfLength), c = 1 / (t.halfWidth * t.halfWidth), l = 1 / t.bodyShoulder, u = t.hilumRadius * t.hilumRadius, d = 1 / (u - t.hilumCore * t.hilumCore);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 118549);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 118551) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 118553) - 1), i[o + 4] = hash(a, e, r ^ 118555);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, f = fract(e) - i[r + 2], p = fract(n) - i[r + 3], m = f * i[r] + p * i[r + 1], h = p * i[r] - f * i[r + 1], g = clamp(1 - m * m * c - h * h * s), _ = smooth(clamp(g * l));
					if (J = .025, Y = .025, X = .96, Z = .3, $ = 0, Q = 0, _ === 0) return;
					let v = Math.max(0, Math.abs(h) - t.hilumStraight), y = smooth(clamp((u - m * m - v * v) * d)), b = o(W, G), x = t.shellColor + t.shellVariation * i[r + 4] + t.coatContrast * a(W, G) + .02 * b;
					J += _ * (x + y * (t.hilumColor + .02 * b - x) - J), Y += _ * (t.bodyBase + t.domeHeight * smooth(g) + t.grainHeight * b - Y), X += _ * (t.roughness + .03 * b - X), Z += _ * (.98 - Z);
				};
			}
			case `amazonite`: {
				let t = require_materials.proceduralMaterialPresets.amazonite, n = cachedNoise(5, 5, r ^ 118289), i = cachedNoise(7, 9, r ^ 118291), a = cachedNoise(9, 7, r ^ 118293), o = cachedNoise(32, 16, r ^ 118295), s = cachedNoise(16, 32, r ^ 118297), c = cachedNoise(8, 32, r ^ 118299), l = cachedNoise(32, 8, r ^ 118301), u = cachedNoise(128, 128, r ^ 118303), d = t.bandRadius * t.bandRadius, f = 1 / (d - t.bandCore * t.bandCore), p = 1 / t.gateShoulder;
				return () => {
					let e = t.frequency * W + t.skew * G + t.warp * (i(W, G) - .5), r = -t.skew * W + t.frequency * G + t.warp * (a(W, G) - .5), m = (e - Math.floor(e + .5)) / (t.widthMinimum + t.widthRange * o(W, G)), h = (r - Math.floor(r + .5)) / (t.widthMinimum + t.widthRange * s(W, G)), g = smooth(clamp((d - m * m) * f)) * smooth(clamp((c(W, G) - t.gateThreshold) * p)), _ = smooth(clamp((d - h * h) * f)) * smooth(clamp((l(W, G) - t.gateThreshold) * p)), v = g + _ - g * _, y = u(W, G), b = t.baseColor + t.cloudContrast * n(W, G);
					J = b + v * (t.paleColor - b) + .06 * y, Y = .4 + t.grainHeight * y, X = t.roughness + .02 * y, Z = 1;
				};
			}
			case `twopinscrewheads`:
			case `squaresocketheads`:
			case `hexsocketheads`: {
				let i = t === `twopinscrewheads`, a = t === `squaresocketheads`, o = require_materials.proceduralMaterialPresets[t], s = require_materials.proceduralMaterialPresets[a ? `squaresocketheads` : `hexsocketheads`], c = new Float64Array(o.cells * o.cells * 5), l = cachedNoise(128, 128, r ^ 113425), u = o.capRadius * o.capRadius, d = 1 / (u - o.fullRadius * o.fullRadius), f = i ? 0 : 1 / s.socketBevel, p = i ? require_materials.proceduralMaterialPresets.twopinscrewheads.holeOffset : 0, m = i ? require_materials.proceduralMaterialPresets.twopinscrewheads.holeRadius ** 2 : 0, h = i ? 1 / (m - require_materials.proceduralMaterialPresets.twopinscrewheads.holeCore ** 2) : 0, g = a || i ? 0 : Math.sqrt(3) * .5;
				for (let e = 0; e < o.cells; e++) for (let t = 0; t < o.cells; t++) {
					let i = (e * o.cells + t) * 5, a = n * hash(t, e, r ^ 113427);
					c[i] = Math.cos(a), c[i + 1] = Math.sin(a), c[i + 2] = .5 + o.jitter * (2 * hash(t, e, r ^ 113429) - 1), c[i + 3] = .5 + o.jitter * (2 * hash(t, e, r ^ 113431) - 1), c[i + 4] = hash(t, e, r ^ 113433);
				}
				return () => {
					let e = W * o.cells, t = G * o.cells, n = (Math.floor(t) * o.cells + Math.floor(e)) * 5, r = fract(e) - c[n + 2], _ = fract(t) - c[n + 3], v = r * r + _ * _, y = smooth(clamp((u - v) * d));
					if (J = .03, Y = .03, X = .95, Z = .3, $ = 0, Q = 1, y === 0) return;
					let b = r * c[n] + _ * c[n + 1], x = _ * c[n] - r * c[n + 1], S;
					if (i) {
						let e = b + p, t = b - p, n = x * x;
						S = smooth(clamp((m - e * e - n) * h)) + smooth(clamp((m - t * t - n) * h));
					} else if (S = smooth(clamp((s.socketApothem - Math.abs(b)) * f)), a) S *= smooth(clamp((s.socketApothem - Math.abs(x)) * f));
					else {
						let e = .5 * b, t = g * x;
						S *= smooth(clamp((s.socketApothem - Math.abs(e + t)) * f)), S *= smooth(clamp((s.socketApothem - Math.abs(t - e)) * f));
					}
					let C = l(W, G), w = o.headHeight + o.headGrainHeight * C, T = o.socketFloor + o.floorGrainHeight * C;
					J += y * (.82 + .06 * c[n + 4] + .025 * C - o.socketShade * S - J), Y += y * (w + S * (T - w) - Y), X += y * (o.roughness + .05 * S + .03 * C - X), Z += y * (.98 - .44 * S - Z), $ = y, Q = 1 - y;
				};
			}
			case `seraphinite`: {
				let t = require_materials.proceduralMaterialPresets.seraphinite, i = new Float64Array(t.cells * t.cells * 9), a = cachedNoise(8, 8, r ^ 113169), o = cachedNoise(12, 12, r ^ 113171), s = cachedNoise(128, 128, r ^ 113173), c = 1 / (1 - t.coreQ), l = t.veinRadius * t.veinRadius, u = 1 / (l - t.veinCore * t.veinCore), d = 1 / t.axisFade;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 9, s = n * hash(a, e, r ^ 113175), c = t.halfLengthMinimum + t.halfLengthVariation * hash(a, e, r ^ 113177), l = t.halfWidthMinimum + t.halfWidthVariation * hash(a, e, r ^ 113179);
					i[o] = t.siteMinimum + t.siteVariation * hash(a, e, r ^ 113181), i[o + 1] = t.siteMinimum + t.siteVariation * hash(a, e, r ^ 113183), i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s), i[o + 4] = 1 / (l * l), i[o + 5] = 1 / (c * c), i[o + 6] = t.frequencyMinimum + t.frequencyVariation * hash(a, e, r ^ 113185), i[o + 7] = hash(a, e, r ^ 113187), i[o + 8] = .75 + .25 * hash(a, e, r ^ 113189);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), f = Math.floor(n), p = t.warp * (o(W, G) - .5), m = s(W, G), h = 1;
					for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
						let s = r + o, m = f + a, g = ((m + t.cells) % t.cells * t.cells + (s + t.cells) % t.cells) * 9, _ = e - s - i[g], v = n - m - i[g + 1], y = _ * i[g + 2] + v * i[g + 3], b = v * i[g + 2] - _ * i[g + 3], S = smooth(clamp((1 - (y * y * i[g + 4] + b * b * i[g + 5])) * c));
						if (S === 0) continue;
						let C = Math.abs(y), w = smooth(clamp(C * d)), T = i[g + 6] * (b - t.branchSlope * C - t.branchBend * y * y) + i[g + 7] + p, E = T - Math.floor(T + .5), D = smooth(clamp((l - E * E) * u));
						h *= 1 - .9 * i[g + 8] * S * w * D;
					}
					J = .08 + .14 * a(W, G) + .02 * m, J += (1 - h) * (.98 - J), Y = .4 + .002 * m, X = t.roughness + .02 * m, Z = 1;
				};
			}
			case `cubebberries`: {
				let t = require_materials.proceduralMaterialPresets.cubebberries, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 112913), o = cachedNoise(64, 64, r ^ 112915), s = 1 / (t.radiusX * t.radiusX), c = 1 / (t.radiusY * t.radiusY), l = 1 / (1 - t.coreQ), u = t.stemRadius * t.stemRadius, d = 1 / (u - t.stemCore * t.stemCore), f = 1 / u, p = t.wrinkleRadius * t.wrinkleRadius, m = 1 / (p - t.wrinkleCore * t.wrinkleCore), h = 1 / t.poreShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 112917);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 112919) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 112921) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 112923)), i[o + 5] = hash(a, e, r ^ 112925);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, g = fract(e) - i[r + 2], _ = fract(n) - i[r + 3], v = (g * i[r] + _ * i[r + 1]) * i[r + 4], y = (_ * i[r] - g * i[r + 1]) * i[r + 4], b = v * v * s + y * y * c, x = smooth(clamp((1 - b) * l)), S = y - Math.max(t.stemTop, Math.min(t.stemBottom, y)), C = v * v + S * S, w = smooth(clamp((u - C) * d));
					if (J = .025, Y = .035, X = .97, Z = .3, x === 0 && w === 0) return;
					let T = a(W, G);
					if (w !== 0) {
						let e = smooth(clamp(1 - C * f));
						J += w * (.43 + .1 * i[r + 5] + .04 * T - J), Y += w * (t.stemBase + t.stemDome * e + .003 * T - Y), X += w * (t.roughness - .1 + .03 * T - X), Z += w * (.95 - Z);
					}
					if (x === 0) return;
					let E = o(W, G) - t.wrinkleCenter, D = smooth(clamp((p - E * E) * m)), O = smooth(clamp((t.poreThreshold - T) * h)), k = smooth(clamp(1 - b));
					J += x * (.24 + .12 * k + .06 * i[r + 5] + .12 * D - .08 * O - J), Y += x * (t.berryBase + t.berryDome * k + t.wrinkleHeight * D - t.poreDepth * O + .003 * T - Y), X += x * (t.roughness + .05 * O - .03 * D - X), Z += x * (.9 + .08 * k - .08 * O - Z);
				};
			}
			case `larvikite`:
			case `diorite`:
			case `anorthosite`:
			case `gabbro`: {
				let i = require_materials.proceduralMaterialPresets[t], a = new Float64Array(i.cells * i.cells * 6), o = cachedNoise(128, 128, r ^ 106523), s = 1 / i.supportSquared, c = 1 / i.twinShoulderSquared;
				for (let e = 0; e < i.cells; e++) for (let t = 0; t < i.cells; t++) {
					let o = (e * i.cells + t) * 6, s = n * hash(t, e, r ^ 106519);
					a[o] = i.siteMinimum + i.siteVariation * hash(t, e, r ^ 106513), a[o + 1] = i.siteMinimum + i.siteVariation * hash(t, e, r ^ 106515), a[o + 2] = hash(t, e, r ^ 106517), a[o + 3] = Math.cos(s), a[o + 4] = Math.sin(s), a[o + 5] = hash(t, e, r ^ 106521);
				}
				return () => {
					let e = W * i.cells, t = G * i.cells, n = Math.floor(e), r = Math.floor(t), l = 0, u = 0;
					for (let o = -1; o <= 1; o++) for (let d = -1; d <= 1; d++) {
						let f = n + d, p = r + o, m = ((p + i.cells) % i.cells * i.cells + (f + i.cells) % i.cells) * 6, h = e - f - a[m], g = t - p - a[m + 1], _ = clamp(1 - (h * h + g * g) * s);
						if (_ === 0) continue;
						_ *= _, _ *= _, _ *= _, _ *= _;
						let v = a[m + 2], y = .06 + .08 * v;
						if (v > i.paleThreshold) {
							let e = (h * a[m + 3] + g * a[m + 4]) * i.twinFrequency + a[m + 5], t = e - Math.floor(e + .5), n = smooth(clamp((i.twinRadiusSquared - t * t) * c));
							y = .58 + .23 * v - .12 * n;
						}
						l += _ * y, u += _;
					}
					let d = l / u, f = o(W, G);
					J = d, Y = .35 + .002 * f, X = i.roughness + .08 * (1 - d) + .015 * f, Z = 1;
				};
			}
			case `juniperberries`: {
				let t = require_materials.proceduralMaterialPresets.juniperberries, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(32, 32, r ^ 106257), o = cachedNoise(128, 128, r ^ 106259), s = 1 / t.shoulder, c = t.seamRadius * t.seamRadius, l = 1 / (c - t.seamCore * t.seamCore), u = t.scarRadius * t.scarRadius, d = 1 / (u - t.scarCore * t.scarCore);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 106261), c = t.radius + t.radiusVariation * hash(a, e, r ^ 106263);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 106265) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 106267) - 1), i[o + 4] = 1 / (c * c);
				}
				return () => {
					J = .05, Y = .08, X = .95, Z = .35;
					let e = W * t.cells % t.cells, n = G * t.cells % t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, f = fract(e) - i[r + 2], p = fract(n) - i[r + 3], m = f * f + p * p, h = 1 - m * i[r + 4];
					if (h <= 0) return;
					let g = smooth(clamp(h * s)), _ = smooth(h), v = f * i[r] + p * i[r + 1], y = p * i[r] - f * i[r + 1], b = 1;
					for (let e = 0; e < 3; e++) {
						let n = e === 0 ? 1 : -.5, r = e === 0 ? 0 : e === 1 ? .8660254037844386 : -.8660254037844386, i = v * n + y * r, a = y * n - v * r, o = i - Math.max(0, Math.min(t.seamLength, i)), s = smooth(clamp((c - o * o - a * a) * l));
						b *= 1 - s;
					}
					let x = 1 - b, S = smooth(clamp((u - m) * d)), C = a(W, G), w = o(W, G);
					J += g * (.4 + .14 * _ + .1 * C - .25 * x - .12 * S), Y += g * (.28 + .4 * _ - .09 * x - .14 * S + .005 * w), X += g * (t.roughness + .08 * C + .04 * S - X), Z += g * (.94 - .08 * x - .1 * S - Z);
				};
			}
			case `dimity`: {
				let t = require_materials.proceduralMaterialPresets.dimity, n = cachedNoise(128, 128, r ^ 106001), i = 1 / (t.warpRadius * t.warpRadius), a = 1 / (t.cordRadius * t.cordRadius), o = 1 / (t.weftRadius * t.weftRadius), s = 1 / (1 - t.warpCore * t.warpCore * i), c = 1 / (1 - t.cordCore * t.cordCore * a), l = 1 / (1 - t.weftCore * t.weftCore * o), u = 1 / t.liftShoulder, d = 1 / t.cordLiftShoulder;
				return () => {
					let e = W * t.warpThreads, r = G * t.weftThreads, f = Math.floor(e), p = Math.floor(r), m = fract(e) - .5, h = fract(r) - .5, g = f % t.groupEnds < t.cordEnds, _ = m * m * (g ? a : i), v = h * h * o, y = smooth(clamp((1 - _) * (g ? c : s))), b = smooth(clamp((1 - v) * l)), x = !(f + p & 1), S = x ? y : y * (1 - b), C = x ? b * (1 - y) : b, w = S + C;
					if (J = .06, Y = .025, X = .96, Z = .45, w === 0) return;
					let T = x ? 1 : -1, E = smooth(clamp((t.warpLiftHalf - Math.abs(m)) * u)), D = smooth(clamp((t.weftLiftHalf - Math.abs(h)) * u)), O = g ? smooth(clamp((t.cordLiftHalf - Math.abs(m)) * d)) : 0, k = smooth(clamp(1 - _)), A = smooth(clamp(1 - v)), j = fract(W * t.warpFibers) - .5, M = fract(G * t.weftFibers) - .5, N = smooth(clamp(1 - 4 * j * j)), P = smooth(clamp(1 - 4 * M * M)), F = (1 - y) * (1 - b), I = n(W, G);
					J = F * J + S * (.8 + .02 * I + .025 * N) + C * (.76 + .02 * I + .025 * P), Y = F * Y + S * (.29 + (g ? t.cordHeight : 0) + T * t.lift * D + .05 * k + .003 * I + .003 * N) + C * (.29 + t.cordHeight * O - T * t.lift * E + .05 * A + .003 * I + .003 * P), X = F * X + S * (t.roughness + .03 * I - .02 * N) + C * (t.roughness + .03 * I - .02 * P), Z += .54 * w;
				};
			}
			case `chiastolite`: {
				let t = require_materials.proceduralMaterialPresets.chiastolite, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 105745), o = cachedNoise(16, 16, r ^ 105747), s = 1 / (t.radius * t.radius), c = 1 / (1 - t.faceCoreQ);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 105749);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 105751) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 105753) - 1), i[o + 4] = hash(a, e, r ^ 105755);
				}
				return () => {
					let e = W * t.cells % t.cells, n = G * t.cells % t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, l = fract(e) - i[r + 2], u = fract(n) - i[r + 3], d = l * i[r] + u * i[r + 1], f = u * i[r] - l * i[r + 1], p = d * d, m = f * f, h = p * s, g = m * s, _ = 1 - smooth(clamp((h * h + g * g - t.faceCoreQ) * c)), v = a(W, G);
					if (J = .22 + .08 * o(W, G) + .01 * v, Y = .35 + .002 * v, X = t.roughness + .03 * v, Z = 1, _ === 0) return;
					let y = t.crossWidth + t.crossFlare * smooth(clamp(h)), b = t.crossWidth + t.crossFlare * smooth(clamp(g)), x = 1 - smooth(clamp(m / (y * y))), S = 1 - smooth(clamp(p / (b * b))), C = 1 - (1 - x) * (1 - S), w = i[r + 4], T = .66 + .18 * w + .02 * v - C * (.6 + .12 * w);
					J += _ * (T - J), X += _ * (.34 + .02 * v + .025 * C - X);
				};
			}
			case `doubleedgerazorblades`: {
				let t = require_materials.proceduralMaterialPresets.doubleedgerazorblades, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 105489), o = 1 / t.bevel, s = t.holeRadius * t.holeRadius, c = 1 / (s - t.holeCore * t.holeCore), l = t.slotRadius * t.slotRadius, u = 1 / (l - t.slotCore * t.slotCore), d = 1 / (t.honeEnd - t.honeStart);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 105493);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 105495) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 105497) - 1), i[o + 4] = hash(a, e, r ^ 105499);
				}
				return () => {
					J = .05, Y = .025, X = .95, Z = .3, $ = 0;
					let e = W * t.cells % t.cells, n = G * t.cells % t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, f = fract(e) - i[r + 2], p = fract(n) - i[r + 3], m = f * i[r] + p * i[r + 1], h = p * i[r] - f * i[r + 1], g = Math.abs(m), _ = Math.abs(h);
					if (g >= t.halfLength || _ >= t.halfWidth) return;
					let v = smooth(clamp((g - t.cornerX) * o)) * smooth(clamp((_ - t.cornerY) * o)), y = smooth(clamp((t.halfLength - g) * o)) * smooth(clamp((t.halfWidth - _) * o)) * (1 - v);
					if (y === 0) return;
					let b = m - Math.max(-t.holePitch, Math.min(t.holePitch, Math.round(m / t.holePitch) * t.holePitch)), x = m - Math.max(-t.slotHalf, Math.min(t.slotHalf, m)), S = smooth(clamp((s - b * b - h * h) * c)), C = smooth(clamp((l - x * x - h * h) * u));
					if (y *= (1 - S) * (1 - C), y === 0) return;
					let w = smooth(clamp((_ - t.honeStart) * d)), T = a(W, G), E = i[r + 4], D = .72 + .08 * E + .02 * T, O = D + w * (.9 + .04 * E + .015 * T - D), k = .56 - .24 * w + .003 * T, A = t.roughness + .04 * T, j = A + w * (.16 + .02 * T - A);
					J += y * (O - J), Y += y * (k - Y), X += y * (j - X), Z += y * (.98 + .01 * w - Z), $ = y;
				};
			}
			case `cocobolo`: {
				let t = require_materials.proceduralMaterialPresets.cocobolo, n = cachedNoise(t.warpColumns, t.warpRows, r ^ 105233), i = cachedNoise(t.broadColumns, t.broadRows, r ^ 105235), a = cachedNoise(t.fineColumns, t.fineRows, r ^ 105237), o = cachedNoise(t.fiberColumns, t.fiberRows, r ^ 105239), s = 1 / t.broadShoulder, c = 1 / t.fineShoulder;
				return () => {
					let e = (W + t.warp * (n(W, G) - .5) + 1) % 1, r = 1 - smooth(clamp((i(e, G) - t.broadCore) * s)), l = 1 - smooth(clamp((a(e, G) - t.fineCore) * c)), u = o(e, G);
					J = .76 + .1 * u - .52 * r - .16 * l, Y = .35 + .002 * u, X = t.roughness + .035 * u + .025 * r, Z = 1;
				};
			}
			case `bittermelonskin`: {
				let t = require_materials.proceduralMaterialPresets.bittermelonskin, n = new Float64Array(t.columns * t.rows * 5), i = new Float64Array(t.columns), a = cachedNoise(t.columns, t.rows, r ^ 104977), o = cachedNoise(128, 128, r ^ 104979), s = 1 / (t.ridgeRadius * t.ridgeRadius);
				for (let e = 0; e < t.columns; e++) i[e] = hash(e, 0, r ^ 104981);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) {
					let a = (e * t.columns + i) * 5, o = t.radiusX + t.radiusXVariation * hash(i, e, r ^ 104983), s = t.radiusY + t.radiusYVariation * hash(i, e, r ^ 104985);
					n[a] = t.jitterX * (2 * hash(i, e, r ^ 104987) - 1), n[a + 1] = t.jitterY * (2 * hash(i, e, r ^ 104989) - 1), n[a + 2] = 1 / (o * o), n[a + 3] = 1 / (s * s), n[a + 4] = hash(i, e, r ^ 104991);
				}
				return () => {
					let e = (W * t.columns + .5 + t.warp * (a(W, G) - .5)) % t.columns, r = (G * t.rows + .5) % t.rows, c = Math.floor(e), l = Math.floor(r), u = e - c - .5, d = r - l - .5, f = 1 - smooth(clamp(u * u * s)), p = (l * t.columns + c) * 5, m = u - n[p], h = d - n[p + 1], g = m * m * n[p + 2] + h * h * n[p + 3], _ = g >= 1 ? 0 : smooth(1 - g), v = o(W, G);
					J = .18 + .32 * f + .18 * _ + .14 * f * i[c] + .08 * _ * n[p + 4] + .02 * v, Y = .12 + .32 * f + .24 * _ + .006 * v, X = t.roughness + .1 * (1 - f) - .04 * _ + .02 * v, Z = .65 + .25 * f + .09 * _;
				};
			}
			case `ogeetiles`: {
				let t = require_materials.proceduralMaterialPresets.ogeetiles, n = new Float64Array(t.columns * t.rows), i = cachedNoise(128, 128, r ^ 104721), a = 1 / t.bevelQ;
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = hash(i, e, r ^ 104725);
				return () => {
					J = .35, Y = .05, X = .96, Z = .4, Q = 1;
					let e = W * t.columns, r = G * t.rows, o = Math.floor(r), c = smooth(fract(r)), l = (o & 1) * .5, u = Math.round(e - l), d = Math.round(e - .5 + l), f = e - u - l, p = e - d - .5 + l, m = .5 * (1 - c), h = .5 * c, g = m * m - f * f, _ = h * h - p * p, v = g >= _, y = smooth(clamp(((v ? g : _) - t.groutQ) * a));
					if (y === 0) return;
					let b = (o + +!v) % t.rows, x = (v ? u : d) % t.columns, S = n[b * t.columns + x], C = i(W, G);
					J += y * (.45 + .35 * S + .03 * C - J), Y += y * (.58 + .006 * C - Y), X += y * (t.roughness + .025 * C - X), Z += y * (.99 - Z), Q = 1 - y;
				};
			}
			case `ooliticlimestone`: {
				let t = require_materials.proceduralMaterialPresets.ooliticlimestone, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 104465), o = cachedNoise(16, 16, r ^ 104467), s = n * hash(0, 0, r ^ 104469), c = n * hash(0, 0, r ^ 104471), l = 1 / t.shoulder, u = 1 / (t.nucleusOuterQ - t.nucleusCoreQ);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let a = (e * t.cells + n) * 5, o = t.radius + t.radiusVariation * hash(n, e, r ^ 104473);
					i[a] = .5 + t.jitter * (2 * hash(n, e, r ^ 104475) - 1), i[a + 1] = .5 + t.jitter * (2 * hash(n, e, r ^ 104477) - 1), i[a + 2] = 1 / (o * o), i[a + 3] = hash(n, e, r ^ 104479), i[a + 4] = hash(n, e, r ^ 104481) < .5 ? 3 : 4;
				}
				return () => {
					let e = (W * t.cells + t.warp * Math.sin(n * G + s) + t.cells) % t.cells, r = (G * t.cells + t.warp * Math.sin(n * W + c) + t.cells) % t.cells, d = (Math.floor(r) * t.cells + Math.floor(e)) * 5, f = fract(e) - i[d], p = fract(r) - i[d + 1], m = (f * f + p * p) * i[d + 2], h = smooth(clamp((1 - m) * l)), g = a(W, G);
					if (Y = .35 + .002 * g, X = t.roughness + .018 * g, Z = 1, J = .76 + .06 * o(W, G) + .02 * g, h === 0) return;
					let _ = fract(i[d + 4] * m), v = 16 * _ * _ * (1 - _) * (1 - _), y = smooth(clamp((t.nucleusOuterQ - m) * u)), b = i[d + 3], x = .5 + .18 * v + .08 * b + .02 * g, S = .12 + .05 * b + .02 * g;
					J += h * (x + y * (S - x) - J), X += .025 * h * v;
				};
			}
			case `nephrite`: {
				let t = require_materials.proceduralMaterialPresets.nephrite, n = cachedNoise(4, 4, r ^ 113937), i = cachedNoise(4, 4, r ^ 113939), a = cachedNoise(6, 6, r ^ 113941), o = cachedNoise(96, 8, r ^ 113943), s = cachedNoise(8, 96, r ^ 113945), c = cachedNoise(64, 8, r ^ 113947), l = cachedNoise(128, 128, r ^ 113949);
				return () => {
					let e = W + t.fiberWarp * (n(W, G) - .5), r = G + t.fiberWarp * (i(W, G) - .5), u = smooth(clamp(2 * o(e, r) - 1)), d = smooth(clamp(2 * s(e, r) - 1)), f = smooth(clamp(2 * c(e + r, r - e) - 1)), p = .4 * u + .35 * d + .25 * f, m = a(W, G), h = l(W, G);
					J = .07 + t.cloudContrast * m + t.fiberContrast * p + .01 * h, Y = .5 + t.grainHeight * h, X = t.roughness + .05 * m + .015 * h, Z = 1;
				};
			}
			case `pinolith`: {
				let t = require_materials.proceduralMaterialPresets.pinolith, i = t.cells * t.cells * t.crystalsPerCell, a = 9 * t.crystalsPerCell, o = new Float64Array(i * 9), s = new Uint16Array(t.cells * t.cells * a), c = 1 / t.shoulder, l = 1 / t.cloudShoulder, u = 1 - t.rimBand, d = cachedNoise(t.cloudCells, t.cloudCells, r ^ 117275), f = cachedNoise(t.grainCells, t.grainCells, r ^ 117277);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					for (let a = 0; a < t.crystalsPerCell; a++) {
						let s = i * t.crystalsPerCell + a, c = ((e * t.cells + i) * t.crystalsPerCell + a) * 9, l = n * hash(s, e, r ^ 117265), u = t.halfLengthMinimum + t.halfLengthRange * hash(s, e, r ^ 117271), d = t.halfWidthMinimum + t.halfWidthRange * hash(s, e, r ^ 117273), f = t.lensOffsetMinimum + t.lensOffsetRange * hash(s, e, r ^ 117279), p = 1 - f + t.edgeWarp * .5;
						o[c] = .5 + t.jitter * (2 * hash(s, e, r ^ 117267) - 1), o[c + 1] = .5 + t.jitter * (2 * hash(s, e, r ^ 117269) - 1), o[c + 2] = Math.cos(l), o[c + 3] = Math.sin(l), o[c + 4] = 1 / (u * u), o[c + 5] = 1 / d, o[c + 6] = u * u * (1 - f * f) + d * d * p * p, o[c + 7] = f * f, o[c + 8] = 2 * f;
					}
					let c = (e * t.cells + i) * a, l = c;
					for (let n = -1; n <= 1; n++) for (let r = -1; r <= 1; r++) {
						let a = ((e + n + t.cells) % t.cells * t.cells + (i + r + t.cells) % t.cells) * t.crystalsPerCell;
						for (let e = 0; e < t.crystalsPerCell; e++) {
							let t = a + e << 4 | n + 1 << 2 | r + 1, i = l++;
							for (; i > c && s[i - 1] > t;) s[i] = s[i - 1], i--;
							s[i] = t;
						}
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), i = Math.floor(n), p = fract(e), m = fract(n), h = d(W, G), g = t.edgeWarp * (h - .5), _ = (i * t.cells + r) * a, v = _ + a, y = 0;
					for (let e = _; e < v; e++) {
						let t = s[e], n = (t >>> 4) * 9, r = p - ((t & 3) - 1) - o[n], i = m - ((t >>> 2 & 3) - 1) - o[n + 1];
						if (r * r + i * i >= o[n + 6]) continue;
						let a = r * o[n + 2] + i * o[n + 3], l = (i * o[n + 2] - r * o[n + 3]) * o[n + 5] + g, d = a * a * o[n + 4] + l * l + o[n + 7], f = o[n + 8] * l;
						if (d + Math.abs(f) >= 1) continue;
						let h = d + f, _ = d - f, v = smooth(clamp((1 - h) * c)) * smooth(clamp((1 - _) * c)), b = smooth(clamp((u - h) * c)) * smooth(clamp((u - _) * c));
						y = y * (1 - v) + b;
					}
					let b = f(W, G), x = smooth(clamp((h - t.cloudCore) * l)), S = t.matrixColor + t.matrixCloud * h + t.matrixGrain * b, C = t.crystalColor - t.graphiteCloud * x + t.crystalGrain * b;
					J = S + y * (C - S), Y = t.height + t.grainHeight * b, X = t.roughness + t.matrixRoughness * (1 - y) + t.grainRoughness * b, Z = 1;
				};
			}
			case `cottondrill`:
			case `cottonflannel`:
			case `ticking`:
			case `chambray`:
			case `huckaback`:
			case `shantung`:
			case `cavalrytwill`:
			case `ottoman`:
			case `gabardine`:
			case `monkscloth`:
			case `hopsack`:
			case `sateen`:
			case `surah`:
			case `serge`:
			case `lyocell`:
			case `batiste`:
			case `ramie`:
			case `faille`:
			case `poplin`: {
				let n = t === `cottondrill`, i = require_materials.proceduralMaterialPresets.cottondrill, a = t === `ticking`, o = require_materials.proceduralMaterialPresets.ticking, s = t === `hopsack` || t === `monkscloth`, c = t === `monkscloth` ? require_materials.proceduralMaterialPresets.monkscloth : require_materials.proceduralMaterialPresets.hopsack, l = t === `lyocell` || t === `surah` || t === `serge` || t === `sateen`, u = t === `sateen` ? require_materials.proceduralMaterialPresets.sateen : t === `serge` ? require_materials.proceduralMaterialPresets.serge : t === `surah` ? require_materials.proceduralMaterialPresets.surah : require_materials.proceduralMaterialPresets.lyocell, d = t === `ramie` || t === `batiste`, f = t === `batiste` ? require_materials.proceduralMaterialPresets.batiste : require_materials.proceduralMaterialPresets.ramie, p = t === `gabardine`, m = t === `cavalrytwill`, h = p || m, g = t === `ottoman`, _ = t === `faille`, v = t === `shantung`, y = t === `huckaback` || l || s || a || n, b = t === `chambray`, x = t === `cottonflannel`, S = require_materials.proceduralMaterialPresets.cottonflannel, C = 1 - S.napCoverage, w = n ? i.yarnTone : s ? c.yarnTone : l ? u.yarnTone : d ? f.yarnTone : b ? .18 : x ? S.yarnTone : .82, T = a ? o.groundTone : d || l || s || n ? w : b ? .92 : x ? S.yarnTone : .63, E = require_materials.proceduralMaterialPresets.shantung, D = n ? i : a ? o : s ? c : l ? u : require_materials.proceduralMaterialPresets.huckaback, O = D.draft.length, k = require_materials.proceduralMaterialPresets[t], A = require_materials.proceduralMaterialPresets.cavalrytwill.draft, j = h || y || b || x || d, M = j ? .34 : .3, N = g ? .52 : j ? .34 : .44, P = _ ? require_materials.proceduralMaterialPresets.faille.weftCrown : g ? .1 : j ? .04 : .07, F = g ? require_materials.proceduralMaterialPresets.ottoman.pairOffset : 0, I = x ? cachedNoise(S.brushCells, S.brushCells, r ^ 116759) : void 0, L = x ? cachedNoise(S.napColumns, S.napRows, r ^ 116761) : void 0, R = cachedNoise(128, 128, r ^ 104209), z = 1 / (k.warpRadius * k.warpRadius), ee = 1 / (k.weftRadius * k.weftRadius), te = 1 / (1 - k.warpCore * k.warpCore * z), ne = 1 / (1 - k.weftCore * k.weftCore * ee), re = 1 / k.liftShoulder, B = y ? new Float64Array(O * O * 6) : void 0, ie = v ? new Float64Array(k.weftThreads * E.slubs * 3) : void 0;
				if (B) for (let e = 0; e < O; e++) for (let t = 0; t < O; t++) {
					let n = D.draft[e] >>> t & 1, r = (e * O + t) * 6;
					for (let i = 0; i < 2; i++) {
						let a = 0, o = 0;
						for (; a < O - 1 && (D.draft[i === 0 ? (e - a - 1 + O) % O : e] >>> (i === 0 ? t : (t - a - 1 + O) % O) & 1) === n;) a++;
						for (; o < O - 1 - a && (D.draft[i === 0 ? (e + o + 1) % O : e] >>> (i === 0 ? t : (t + o + 1) % O) & 1) === n;) o++;
						let s = r + i * 3, c = (a + o) * .5 + (i === 0 ? k.weftLiftHalf : k.warpLiftHalf), l = Math.max(0, c - k.liftShoulder), u = c * c;
						B[s] = (o - a) * .5, B[s + 1] = u, B[s + 2] = 1 / (u - l * l);
					}
				}
				if (ie) for (let e = 0; e < k.weftThreads; e++) for (let t = 0; t < E.slubs; t++) {
					let n = (e * E.slubs + t) * 3, i = E.slubHalfMinimum + E.slubHalfVariation * hash(t, e, r ^ 111635);
					ie[n] = (t + .5) / E.slubs + E.slubJitter * (2 * hash(t, e, r ^ 111633) - 1), ie[n + 1] = 1 / (i * i), ie[n + 2] = .35 + .65 * hash(t, e, r ^ 111637);
				}
				return () => {
					let e = W * k.warpThreads, t = G * k.weftThreads, n = Math.floor(e), r = Math.floor(t), i = fract(e) - .5, s = fract(t) - .5 + (r & 1 ? F : -F), c = 0, l = ee, u = ne;
					if (ie) {
						let e = 1;
						for (let t = 0; t < E.slubs; t++) {
							let n = (r * E.slubs + t) * 3, i = W - ie[n], a = i - Math.floor(i + .5);
							e *= 1 - ie[n + 2] * smooth(clamp(1 - a * a * ie[n + 1]));
						}
						c = 1 - e;
						let t = k.weftRadius + E.slubRadius * c, n = k.weftCore + E.slubCore * c;
						l = 1 / (t * t), u = 1 / (1 - n * n * l);
					}
					let d = i * i * z, f = s * s * l, h = smooth(clamp((1 - d) * te)), _ = smooth(clamp((1 - f) * u)), v = y ? !!(D.draft[r % O] >>> n % O & 1) : m ? A[(n - r + k.warpThreads) % A.length] : p ? (n - r + k.warpThreads) % 3 < 2 : !(n + (g ? Math.floor(r / 2) : r) & 1), b = v ? h : h * (1 - _), j = v ? _ * (1 - h) : _, ae = b + j;
					if (J = .06, Y = .025, X = .96, Z = .45, ae === 0 && !x) return;
					let oe = v ? 1 : -1, se = B ? (r % O * O + n % O) * 6 : 0, ce = smooth(clamp(B ? (B[se + 4] - (i - B[se + 3]) ** 2) * B[se + 5] : (k.warpLiftHalf - Math.abs(i)) * re)), le = smooth(clamp(B ? (B[se + 1] - (s - B[se]) ** 2) * B[se + 2] : (k.weftLiftHalf - Math.abs(s)) * re)), ue = smooth(clamp(1 - d)), de = smooth(clamp(1 - f)), fe = fract(W * k.warpFibers) - .5, pe = fract(G * k.weftFibers) - .5, me = smooth(clamp(1 - 4 * fe * fe)), he = smooth(clamp(1 - 4 * pe * pe)), ge = (1 - h) * (1 - _), _e = R(W, G), ve = a ? o.groundTone - o.dyeDepth * o.stripeDraft[Math.floor(n / o.stripeYarns) % o.stripeDraft.length] : w;
					if (J = ge * J + b * (ve + .025 * _e + .025 * me) + j * (T + .025 * _e + .025 * he - .06 * c), Y = ge * Y + b * (M + oe * k.lift * le + .04 * ue + .003 * _e + .003 * me) + j * (N - oe * k.lift * ce + P * de + .003 * _e + .003 * he + E.slubHeight * c), I && L) {
						let e = I(W, G), t = e - .5, n = L(W + S.napWarpU * t, G + S.napWarpV * t);
						J = C * J + S.napCoverage * (S.napColor + S.cloudColor * e + S.fiberColor * n), Y = S.napBase + S.napHeight * n + S.napCloudHeight * e + S.buriedWeaveHeight * Y, X = S.roughness + S.napRoughnessVariation * (n - .5) + S.grainRoughnessVariation * (_e - .5), Z = S.occlusion + S.occlusionWeave * ae;
					} else X = ge * X + b * (k.roughness + .03 * _e - .02 * me) + j * (k.roughness + .03 * _e - .02 * he), Z += .54 * ae;
				};
			}
			case `rackgears`: {
				let t = require_materials.proceduralMaterialPresets.rackgears, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 103953), o = 1 / t.bevel, s = 1 / t.toothPitch, c = 1 / (t.toothTop - t.toothBottom), l = t.holeRadius * t.holeRadius, u = 1 / (l - t.holeCore * t.holeCore), d = 1 / t.grooveWidth;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 103957);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 103959) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 103961) - 1), i[o + 4] = hash(a, e, r ^ 103963);
				}
				return () => {
					J = .04, Y = .035, X = .95, Z = .45;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, f = fract(e) - .5 - i[r + 2], p = fract(n) - .5 - i[r + 3], m = f * i[r] + p * i[r + 1], h = p * i[r] - f * i[r + 1], g = smooth(clamp((t.halfLength - Math.abs(m)) * o));
					if (g === 0 || h <= t.baseBottom || h >= t.toothTop) return;
					let _ = g * smooth(clamp((h - t.baseBottom) * o)) * smooth(clamp((t.baseTop - h) * o)), v = Math.max(0, Math.min(t.teeth - 1, Math.round((m - t.toothFirst) * s))), y = m - t.toothFirst - v * t.toothPitch, b = clamp((h - t.toothBottom) * c), S = smooth(clamp((t.rootHalfWidth + (t.tipHalfWidth - t.rootHalfWidth) * b - Math.abs(y)) * o)) * smooth(clamp((h - t.toothBottom) * o)) * smooth(clamp((t.toothTop - h) * o)), C = Math.abs(m) - t.holeX, w = h - t.holeY, T = smooth(clamp((l - C * C - w * w) * u)), E = (1 - (1 - _) * (1 - S)) * (1 - T);
					if (E === 0) return;
					let D = (h - t.grooveY) * d, O = smooth(clamp(1 - D * D)), k = a(W, G);
					J += E * (.78 + .04 * i[r + 4] + .025 * k - .1 * O - J), Y += E * (.58 + .004 * k - .022 * O - Y), X += E * (t.roughness + .04 * k + .06 * O - X), Z += E * (.97 - .12 * O - Z), $ = E;
				};
			}
			case `rambutanskin`: {
				let t = require_materials.proceduralMaterialPresets.rambutanskin, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 103697), o = 1 / (2 * t.halfLength), s = 1 / (t.rootRadius * t.rootRadius), c = 1 / t.rootShoulder, l = 1 / t.tipShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 103701);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 103703) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 103705) - 1), i[o + 4] = hash(a, e, r ^ 103707);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, u = fract(e) - .5 - i[r + 2], d = fract(n) - .5 - i[r + 3], f = u * i[r] + d * i[r + 1], p = d * i[r] - u * i[r + 1], m = a(W, G);
					if (J = .14 + .04 * m, Y = .14 + .004 * m, X = t.roughness + .05 * m, Z = .96, f <= t.rootX - t.rootRadius || f >= t.halfLength || p <= -t.rootRadius || p >= t.bend + t.baseWidth) return;
					let h = f - t.rootX, g = smooth(clamp(1 - (h * h + p * p) * s)), _ = (f + t.halfLength) * o, v = i[r + 4], y = 0;
					if (_ > 0 && _ < 1) {
						let e = t.bend * (.65 + .35 * v) * _ * _, n = t.baseWidth + (t.tipWidth - t.baseWidth) * _, r = (p - e) / n;
						y = smooth(clamp(1 - r * r)) * smooth(clamp(_ * c)) * smooth(clamp((1 - _) * l));
					}
					J += .14 * g + y * (.5 + .1 * _ + .04 * v), Y += .12 * g + y * (.43 + .18 * _), X -= .05 * g + .2 * y, Z -= .2 * g * (1 - g) + .26 * y * (1 - y);
				};
			}
			case `cloisonne`: {
				let t = require_materials.proceduralMaterialPresets.cloisonne, i = new Float64Array(t.cells * t.cells * 9), a = cachedNoise(128, 128, r ^ 103441), o = 1 / (t.radiusX * t.radiusX), s = 1 / (t.radiusY * t.radiusY), c = 1 / (t.centerRadius * t.centerRadius), l = 1 / (2 * t.wireWidth), u = t.wireWidth * t.wireWidth, d = 1 / u, f = 1 / (u - t.wireCore * t.wireCore);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 9, s = n * hash(a, e, r ^ 103445);
					for (let e = 0; e < 3; e++) {
						let t = s + e * Math.PI / 3;
						i[o + e * 2] = Math.cos(t), i[o + e * 2 + 1] = Math.sin(t);
					}
					i[o + 6] = t.jitter * (2 * hash(a, e, r ^ 103447) - 1), i[o + 7] = t.jitter * (2 * hash(a, e, r ^ 103449) - 1), i[o + 8] = hash(a, e, r ^ 103451);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 9, p = fract(e) - .5 - i[r + 6], m = fract(n) - .5 - i[r + 7], h = a(W, G), g = (p * p + m * m) * c;
					for (let e = 0; e < 3; e++) {
						let n = i[r + e * 2], a = i[r + e * 2 + 1], c = Math.abs(p * n + m * a) - t.petalCenter, l = m * n - p * a;
						g = Math.min(g, c * c * o + l * l * s);
					}
					let _ = smooth(clamp((1 + t.wireWidth - g) * l)), v = g - 1, y = smooth(clamp((u - v * v) * f));
					if (J = .68 + (.23 + .04 * i[r + 8]) * _ + .025 * h, Y = .25 + .055 * _ + .003 * h, X = t.roughness + .03 * h, Z = .96, y === 0) return;
					let b = 1 - v * v * d;
					J += y * (.025 + .015 * h - J), Y += y * (.72 + .08 * b + .002 * h - Y), X += y * (.3 + .03 * h - X), $ = y, Z += .03 * y - .15 * y * (1 - y);
				};
			}
			case `gyroidinfill`: {
				let t = require_materials.proceduralMaterialPresets.gyroidinfill, i = hash(0, 0, r ^ 103189), a = hash(0, 0, r ^ 103191), o = cachedNoise(128, 128, r ^ 103185), s = t.halfWidth * t.halfWidth, c = 1 / (s - t.core * t.core), l = 1 / s;
				return () => {
					let e = n * (t.cells * W + i), r = n * (t.cells * G + a), u = Math.sin(e) * Math.cos(r) + Math.SQRT1_2 * (Math.sin(r) + Math.cos(e)), d = u * u;
					if (J = .045, Y = .06, X = .94, Z = .65, d >= s) return;
					let f = smooth(clamp((s - d) * c)), p = 1 - d * l, m = o(W, G);
					J += f * (.65 + .17 * p + .035 * m - J), Y += f * (.43 + .3 * p + .006 * m - Y), X += f * (t.roughness + .03 * m - .04 * p - X), Z += f * (.95 + .04 * p - Z);
				};
			}
			case `abaloneshells`: {
				let t = require_materials.proceduralMaterialPresets.abaloneshells, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 102929), o = 1 / (t.radiusX * t.radiusX), s = 1 / (t.radiusY * t.radiusY), c = 1 / t.shoulder, l = 1 / t.holePitch, u = 1 / (t.holeRadius * t.holeRadius), d = 1 / (1 - t.holeCoreQ), f = 1 / t.rimWidth;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 102933);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 102935) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 102937) - 1), i[o + 4] = hash(a, e, r ^ 102939), i[o + 5] = hash(a, e, r ^ 102941);
				}
				return () => {
					J = .02, Y = .04, X = .95, Z = .5;
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), p = (Math.floor(n) * t.cells + r) * 6, m = fract(e) - .5 - i[p + 2], h = fract(n) - .5 - i[p + 3], g = m * i[p] + h * i[p + 1], _ = h * i[p] - m * i[p + 1], v = g + t.skew * _ + t.bend * _ * _, y = v * v * o + _ * _ * s;
					if (y >= 1) return;
					let b = Math.max(0, Math.min(t.holes - 1, Math.round((_ - t.holeFirstY) * l))), x = v - t.holeX, S = _ - t.holeFirstY - b * t.holePitch, C = smooth(clamp((1 - (x * x + S * S) * u) * d)), w = smooth(clamp((1 - y) * c)) * (1 - C);
					if (w === 0) return;
					let T = fract(t.bands * y + i[p + 5]), E = 16 * T * T * (1 - T) * (1 - T), D = (y - t.rimQ) * f, O = smooth(clamp(1 - D * D)), k = a(W, G);
					J += w * (.46 + .23 * E + .1 * i[p + 4] + .025 * k + .08 * O - J), Y += w * (.22 + .28 * y + .07 * O + .003 * k + .006 * E - Y), X += w * (t.roughness + .06 * E + .015 * k + .1 * O - X), Z += w * (.9 + .06 * y - .025 * O - Z);
				};
			}
			case `flystitch`: {
				let t = require_materials.proceduralMaterialPresets.flystitch, n = new Float64Array(t.cells * t.cells * 5), i = cachedNoise(128, 128, r ^ 102673), a = 1 / (t.armX * t.armX + t.armY * t.armY), o = 1 / (t.radius * t.radius), s = t.armX + t.radius, c = t.armY - t.radius, l = t.stemEnd + t.radius;
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 5, o = (e + i & 1) * Math.PI + t.turn * (2 * hash(i, e, r ^ 102677) - 1);
					n[a] = Math.cos(o), n[a + 1] = Math.sin(o), n[a + 2] = t.jitter * (2 * hash(i, e, r ^ 102679) - 1), n[a + 3] = t.jitter * (2 * hash(i, e, r ^ 102681) - 1), n[a + 4] = hash(i, e, r ^ 102683);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, u = Math.floor(e), d = (Math.floor(r) * t.cells + u) * 5, f = fract(e) - .5 - n[d + 2], p = fract(r) - .5 - n[d + 3], m = f * n[d] + p * n[d + 1], h = p * n[d] - f * n[d + 1], g = 1;
					if (Math.abs(m) < s && h > c && h < l) {
						let e = h - Math.max(0, Math.min(t.stemEnd, h));
						g = 1 - smooth(clamp(1 - (m * m + e * e) * o));
						for (let e = -1; e <= 1; e += 2) {
							let n = clamp((e * t.armX * m + t.armY * h) * a), r = m - e * t.armX * n, i = h - t.armY * n;
							g *= 1 - smooth(clamp(1 - (r * r + i * i) * o));
						}
					}
					let _ = 1 - g, v = i(W, G);
					if (J = Y = X = Z = 0, _ < 1) {
						let e = fract(W * t.threads), n = fract(G * t.threads), r = .5 * (16 * e * e * (1 - e) * (1 - e) + 16 * n * n * (1 - n) * (1 - n));
						J = g * (.06 + .018 * v + .015 * r), Y = g * (.11 + .012 * v + .006 * r), X = g * (.92 + .025 * v), Z = g * .94;
					}
					_ !== 0 && (J += _ * (.72 + .12 * n[d + 4] + .035 * v), Y += _ * (.73 + .008 * v), X += _ * (t.roughness + .025 * v), Z += _ * .99);
				};
			}
			case `durianpeel`: {
				let t = require_materials.proceduralMaterialPresets.durianpeel, i = new Float64Array(t.cells * t.cells * 7), a = cachedNoise(128, 128, r ^ 102417), o = cachedNoise(6, 6, r ^ 102419), s = Math.sqrt(3) * .5, c = 1 / t.rounding, l = .5 / t.shoulder, u = 1 / (1 - t.shoulder), roundedMax = (e, n) => {
					let r = e - n;
					return r >= t.rounding ? e : r <= -t.rounding ? n : .5 * (e + n) + .25 * (t.rounding + r * r * c);
				};
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 7, s = n * hash(a, e, r ^ 102421), c = t.radius + t.radiusVariation * hash(a, e, r ^ 102427), l = 1 / (c - t.tipRadius);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 102423) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 102425) - 1), i[o + 4] = l, i[o + 5] = c * l, i[o + 6] = hash(a, e, r ^ 102429);
				}
				return () => {
					let e = G * t.cells, n = Math.floor(e), r = W * t.cells + (n & 1) * .5, c = Math.floor(r) % t.cells, d = (n * t.cells + c) * 7, f = fract(r) - .5 - i[d + 2], p = fract(e) - .5 - i[d + 3], m = f * i[d] + p * i[d + 1], h = p * i[d] - f * i[d + 1], g = roundedMax(roundedMax(Math.abs(m), Math.abs(.5 * m + s * h)), Math.abs(-.5 * m + s * h)), _ = clamp(i[d + 5] - g * i[d + 4]), v = a(W, G), y = o(W, G);
					if (J = .2 + .07 * v + .06 * y, Y = .12 + .014 * v, X += .04 * v, Z = .76, _ === 0) return;
					let b = _ < t.shoulder ? _ * _ * l : _ > 1 - t.shoulder ? 1 - t.shoulder - (1 - _) * (1 - _) * l : _ - .5 * t.shoulder, x = _ === 1 ? 1 : b * u, S = i[d + 6];
					J += x * (.3 + .2 * S), Y += x * (.62 + .12 * S), X -= .06 * x, Z += .23 * x;
				};
			}
			case `horseshoes`: {
				let t = require_materials.proceduralMaterialPresets.horseshoes, n = new Float64Array(t.cells * t.cells * 5), i = cachedNoise(128, 128, r ^ 102161), a = 1 / (t.radiusX * t.radiusX), o = 1 / (t.radiusY * t.radiusY), s = 1 / (t.innerCoreQ - t.innerQ), c = 1 / (t.outerQ - t.outerCoreQ), l = 1 / t.heelShoulder, u = 1 / t.grooveWidth, d = 1 / t.nailPitch, f = 1 / (t.nailRadiusX * t.nailRadiusX), p = 1 / (t.nailRadiusY * t.nailRadiusY), m = 1 / (1 - t.nailCoreQ);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 5, o = (e + i & 1) * Math.PI + t.turn * (2 * hash(i, e, r ^ 102165) - 1);
					n[a] = Math.cos(o), n[a + 1] = Math.sin(o), n[a + 2] = t.jitter * (2 * hash(i, e, r ^ 102167) - 1), n[a + 3] = t.jitter * (2 * hash(i, e, r ^ 102169) - 1), n[a + 4] = hash(i, e, r ^ 102171);
				}
				return () => {
					J = .035, Y = .04, X = .96, Z = .42, $ = 0;
					let e = W * t.cells, r = G * t.cells, h = Math.floor(e), g = (Math.floor(r) * t.cells + h) * 5, _ = fract(e) - .5 - n[g + 2], v = fract(r) - .5 - n[g + 3], y = _ * n[g] + v * n[g + 1], b = v * n[g] - _ * n[g + 1], x = Math.min(0, b - t.toeY), S = y * y * a + x * x * o, C = smooth(clamp((S - t.innerQ) * s)) * smooth(clamp((t.outerQ - S) * c)) * smooth(clamp((t.heelEnd - b) * l));
					if (C === 0) return;
					let w = Math.max(0, Math.min(t.nails - 1, Math.round((b - t.nailFirstY) * d))), T = Math.abs(y) - t.radiusX, E = b - t.nailFirstY - w * t.nailPitch, O = C * (1 - smooth(clamp((1 - (T * T * f + E * E * p)) * m)));
					if ($ = O, O === 0) return;
					let k = (S - 1) * u, A = smooth(clamp(1 - k * k)), j = i(W, G);
					J += O * (.65 + .16 * n[g + 4] + .025 * j - .06 * A - J), Y += O * (.72 - .16 * A + .004 * j - Y), X += O * (t.roughness + .025 * j + .04 * A - X), Z += O * (.98 - .035 * A - Z);
				};
			}
			case `paperbark`: {
				let t = require_materials.proceduralMaterialPresets.paperbark, n = new Float64Array(t.columns * t.rows * 6), i = new Float64Array(t.rows), a = cachedNoise(24, 24, r ^ 101923), o = cachedNoise(6, 192, r ^ 101905), s = cachedNoise(12, 8, r ^ 101907), c = cachedNoise(128, 128, r ^ 101909), l = 1 / t.shoulderX, u = 1 / t.shoulderY, d = 1 / t.lipRadius, f = 1 / t.shadowRadius;
				for (let e = 0; e < t.rows; e++) i[e] = hash(e, 0, r ^ 101925);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) {
					let a = (e * t.columns + i) * 6;
					n[a] = t.jitterX * (2 * hash(i, e, r ^ 101911) - 1), n[a + 1] = t.jitterY * (2 * hash(i, e, r ^ 101913) - 1), n[a + 2] = 1 / (t.halfWidth + t.widthVariation * hash(i, e, r ^ 101915)), n[a + 3] = 1 / (t.halfHeight + t.heightVariation * hash(i, e, r ^ 101917)), n[a + 4] = t.bend * (2 * hash(i, e, r ^ 101919) - 1), n[a + 5] = hash(i, e, r ^ 101921);
				}
				return () => {
					let e = G * t.rows, r = Math.floor(e), p = W * t.columns + i[r], m = Math.floor(p) % t.columns, h = (r * t.columns + m) * 6, g = fract(p) - .5 - n[h] - t.edgeX * (2 * a(G, W) - 1), _ = fract(e) - .5 - n[h + 1] - n[h + 4] * g * g - t.edgeY * (2 * a(W, G) - 1), v = g * n[h + 2], y = _ * n[h + 3], b = smooth(clamp((1 - v * v) * l)) * smooth(clamp((1 - y * y) * u)), x = o(W, G), S = s(W, G);
					if (J = .62 + .06 * x + .04 * S, Y = .19 + .016 * x + .025 * S, X += .03 * x, Z = .82, b === 0) return;
					let C = (y - t.lipCenter) * d, w = (y - t.shadowCenter) * f, T = smooth(clamp(1 - C * C)), E = smooth(clamp(1 - w * w)), D = c(W, G);
					J += b * (.15 + .03 * n[h + 5] + .02 * D + .08 * T - .18 * E), Y += b * (.17 + .018 * D + .38 * T), X += b * (-.06 + .015 * T), Z += b * (.16 - .2 * E);
				};
			}
			case `larimar`: {
				let t = require_materials.proceduralMaterialPresets.larimar, i = new Float64Array(t.cells * t.cells * 7), a = cachedNoise(128, 128, r ^ 101649), o = cachedNoise(5, 5, r ^ 101651), s = 1 / (1 - t.coreQ), c = t.fiberRadius * t.fiberRadius, l = 1 / (c - t.fiberCore * t.fiberCore), u = Math.max(t.radiusX + t.radiusXVariation, t.radiusY + t.radiusYVariation);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 7, s = n * hash(a, e, r ^ 101657), c = t.radiusX + t.radiusXVariation * hash(a, e, r ^ 101659), l = t.radiusY + t.radiusYVariation * hash(a, e, r ^ 101661);
					i[o] = .5 + t.jitter * (2 * hash(a, e, r ^ 101653) - 1), i[o + 1] = .5 + t.jitter * (2 * hash(a, e, r ^ 101655) - 1), i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s), i[o + 4] = 1 / (c * c), i[o + 5] = 1 / (l * l), i[o + 6] = hash(a, e, r ^ 101663);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), d = Math.floor(n), f = 1, p = 1;
					for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
						let m = r + o, h = d + a, g = ((h + t.cells) % t.cells * t.cells + (m + t.cells) % t.cells) * 7, _ = e - m - i[g], v = n - h - i[g + 1];
						if (Math.abs(_) >= u || Math.abs(v) >= u) continue;
						let y = _ * i[g + 2] + v * i[g + 3], b = v * i[g + 2] - _ * i[g + 3], x = y * y * i[g + 4] + b * b * i[g + 5];
						if (x >= 1) continue;
						let S = smooth(clamp((1 - x) * s));
						if (f *= 1 - S, S === 1) continue;
						let C = fract(t.fibers * y + t.fiberBend * x + i[g + 6] + .5) - .5, w = smooth(clamp((c - C * C) * l));
						p *= 1 - 4 * S * (1 - S) * w;
					}
					let m = a(W, G), h = o(W, G);
					J = .88 - .64 * (1 - f) + .03 * m + .035 * h + .08 * (1 - p), Y = .5 + 8e-4 * m, X = t.roughness + .025 * m, Z = 1;
				};
			}
			case `papyrus`: {
				let t = require_materials.proceduralMaterialPresets.papyrus, n = new Float64Array(t.strips * 2), i = cachedNoise(t.strips, t.edgeSteps, r ^ 101393), a = cachedNoise(t.fiberColumns, t.fiberRows, r ^ 101395), o = cachedNoise(4, 4, r ^ 101397), s = 1 / t.shoulder;
				for (let e = 0; e < t.strips; e++) n[e * 2] = hash(e, 0, r ^ 101399), n[e * 2 + 1] = hash(e, 0, r ^ 101401);
				return () => {
					let e = W * t.strips, r = Math.floor(e), c = e - r - .5 - t.edgeJitter * (2 * i(r / t.strips, G) - 1), l = smooth(clamp((t.halfWidth - Math.abs(c)) * s)), u = l === 0 ? 0 : a(W, G), d = a(G, W), f = o(W, G), p = .62 + .1 * n[r * 2] + .12 * u + .04 * d + .025 * f, m = t.topHeight + .008 * u + .002 * f, h = t.roughness + .02 * f - .02 * u;
					if (l === 1) {
						J = p, Y = m, X = h, Z = .99;
						return;
					}
					let g = G * t.strips, _ = Math.floor(g), v = g - _ - .5 - t.edgeJitter * (2 * i(_ / t.strips, W) - 1), y = smooth(clamp((t.halfWidth - Math.abs(v)) * s));
					J = .3 + y * (.15 + .04 * n[_ * 2 + 1] + .035 * d), Y = t.backingHeight + y * (t.underHeight + .008 * d + .002 * f - t.backingHeight), X = .96 - y * (.03 + .015 * d), Z = .85 + .1 * y, l !== 0 && (J += l * (p - J), Y += l * (m - Y), X += l * (h - X), Z += l * (.99 - Z));
				};
			}
			case `lacewood`: {
				let t = require_materials.proceduralMaterialPresets.lacewood, n = new Float64Array(t.columns * t.rows * 6), i = cachedNoise(t.grainColumns, t.grainRows, r ^ 101137), a = cachedNoise(t.fiberColumns, t.fiberRows, r ^ 101139), o = 1 / (1 - t.rayCoreQ);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) {
					let a = (e * t.columns + i) * 6, o = t.rayLength + t.rayLengthVariation * hash(i, e, r ^ 101145), s = t.rayWidth + t.rayWidthVariation * hash(i, e, r ^ 101147);
					n[a] = .5 + t.jitterX * (2 * hash(i, e, r ^ 101141) - 1), n[a + 1] = .5 + t.jitterY * (2 * hash(i, e, r ^ 101143) - 1), n[a + 2] = 1 / (o * o), n[a + 3] = 1 / (s * s), n[a + 4] = t.raySlope * (2 * hash(i, e, r ^ 101149) - 1), n[a + 5] = t.rayBend * (2 * hash(i, e, r ^ 101151) - 1);
				}
				return () => {
					let e = W * t.columns, r = G * t.rows, s = Math.floor(e), c = Math.floor(r), l = (c * t.columns + s) * 6, u = e - s - n[l], d = r - c - n[l + 1] - n[l + 4] * u - n[l + 5] * u * u, p = smooth(clamp((1 - (u * u * n[l + 2] + d * d * n[l + 3])) * o)), m = i(W, G), h = a(W, G), g = smooth(clamp((h - .76) * 5.555555555555555)) * (1 - p);
					J = .3 + .19 * m + .035 * h - .12 * g + .42 * p, Y = .5 + .015 * m + .003 * h - .006 * g, X = t.roughness + .035 * m + .02 * h - .11 * p, Z = .99 - .02 * g;
				};
			}
			case `oxfordweave`: {
				let t = require_materials.proceduralMaterialPresets.oxfordweave, n = cachedNoise(128, 128, r ^ 100881), i = 1 / (t.yarnRadius * t.yarnRadius), a = 1 / (1 - t.yarnCore * t.yarnCore * i), o = 1 / t.crossingShoulder;
				return () => {
					let e = W * t.groups, r = G * t.groups, s = Math.floor(e), c = Math.floor(r), l = e - s - .5, u = r - c - .5, d = Math.abs(l) - t.pairOffset, f = Math.abs(u) - t.pairOffset, p = d * d * i, m = f * f * i, h = smooth(clamp((1 - p) * a)), g = smooth(clamp((1 - m) * a)), _ = !(s + c & 1), v = _ ? h : h * (1 - g), y = _ ? g * (1 - h) : g, b = v + y;
					if (J = .04, Y = .02, X = .96, Z = .4, b === 0) return;
					let x = _ ? 1 : -1, S = smooth(clamp((t.crossingHalf - Math.abs(l)) * o)), C = smooth(clamp((t.crossingHalf - Math.abs(u)) * o)), w = smooth(clamp(1 - p)), T = smooth(clamp(1 - m)), E = fract(W * t.fibers) - .5, D = fract(G * t.fibers) - .5, O = smooth(clamp(1 - 4 * E * E)), k = smooth(clamp(1 - 4 * D * D)), A = n(W, G), j = (1 - h) * (1 - g);
					J = j * J + v * (.2 + .025 * O + .02 * A) + y * (.9 + .025 * k + .02 * A), Y = j * Y + v * (t.yarnHeight + x * t.lift * C + t.crown * w + .004 * O + .002 * A) + y * (t.yarnHeight - x * t.lift * S + t.crown * T + .004 * k + .002 * A), X = j * X + v * (t.roughness + .02 * A - .02 * O) + y * (t.roughness + .02 * A - .02 * k), Z += .59 * b;
				};
			}
			case `barbedwire`: {
				let t = require_materials.proceduralMaterialPresets.barbedwire, n = new Float64Array(t.rows * 3), i = cachedNoise(128, 128, r ^ 100625), a = 16 / 5 * t.amplitude, o = 32 / 5 * t.amplitude * t.twists, s = 1 / (t.wireRadius * t.wireRadius), c = 1 / (1 - t.wireCore * t.wireCore * s), l = t.amplitude + t.wireRadius * Math.sqrt(1 + o * o), u = 1 / (t.collarX * t.collarX), d = 1 / (t.collarY * t.collarY), f = 1 / (1 - t.collarCoreQ), p = 1 / t.barbLength, m = 1 / t.planeShoulder, h = Math.max(t.barbAxisX * t.barbLength, t.barbAxisY * t.barbHalfWidth), g = Math.max(t.barbAxisY * t.barbLength, t.barbAxisX * t.barbHalfWidth), _ = Math.max(l, t.collarY, g);
				for (let e = 0; e < t.rows; e++) {
					let i = e * 3;
					n[i] = hash(0, e, r ^ 100627), n[i + 1] = t.jitter * (2 * hash(0, e, r ^ 100629) - 1), n[i + 2] = hash(0, e, r ^ 100631);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = G * t.rows, r = Math.floor(e), v = r * 3, y = e - r - .5 - n[v + 1];
					if (Math.abs(y) >= _) return;
					let b = W * t.knots - n[v], x = b - Math.round(b), S = Math.abs(x), C = Math.abs(y), w = S < t.collarX && C < t.collarY ? smooth(clamp((1 - x * x * u - y * y * d) * f)) : 0;
					if (w === 1) {
						let e = i(W, G);
						J = .82 + .025 * e, Y = t.collarHeight + .003 * e, X = t.collarRoughness + .025 * e, Z = .99, $ = 1, Q = 0;
						return;
					}
					let T = 0, E = 0, D = 0, O = 0, k = 0, A = 0;
					if (S < h && C < g) {
						let e = S * t.barbAxisX + C * t.barbAxisY, n = -S * t.barbAxisY + C * t.barbAxisX, r = t.barbHalfWidth * (1 - e * p);
						T = smooth(clamp((r + n) * m)) * smooth(clamp((r - n) * m));
					}
					if (C < l) {
						let e = fract(b * t.twists), n = e * 2, r = n < 1 ? n : n - 1, i = n < 1 ? 1 : -1, l = a * i * r * (1 + r * r * (r - 2)), u = o * i * (1 + r * r * (4 * r - 6)), d = s / (1 + u * u), f = y - l, p = y + l, m = f * f * d, h = p * p * d;
						if (E = smooth(clamp((1 - m) * c)), D = smooth(clamp((1 - h) * c)), E !== 0 || D !== 0) {
							let t = fract(e + .25) * 2, n = t < 1 ? t : t - 1;
							A = 16 / 5 * (t < 1 ? 1 : -1) * n * (1 + n * n * (n - 2)), E !== 0 && (O = smooth(clamp(1 - m))), D !== 0 && (k = smooth(clamp(1 - h)));
						}
					}
					let j = (1 - E) * (1 - D);
					if (Q = j * (1 - T) * (1 - w), $ = 1 - Q, Q === 1) return;
					let M = A >= 0 ? E : E * (1 - D), N = A >= 0 ? D * (1 - E) : D, P = i(W, G), F = .89 + .025 * n[v + 2] + .025 * P, I = t.wireHeight + .003 * P, L = t.roughness + .025 * P;
					J = j * J + M * (F + .04 * O) + N * (F + .04 * k), Y = j * Y + M * (I + t.wireDepth * A + t.wireCrown * O) + N * (I - t.wireDepth * A + t.wireCrown * k), X = j * X + M * (L - .04 * O) + N * (L - .04 * k), Z = j * Z + (M + N) * .99, J += T * (.93 + .025 * P - J), Y += T * (t.barbHeight + .003 * P - Y), X += T * (t.barbRoughness + .025 * P - X), Z += T * (.99 - Z), J += w * (.82 + .025 * P - J), Y += w * (t.collarHeight + .003 * P - Y), X += w * (t.collarRoughness + .025 * P - X), Z += w * (.99 - Z);
				};
			}
			case `palmiers`: {
				let t = require_materials.proceduralMaterialPresets.palmiers, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 100369), o = 1 / (t.lobeRadiusX * t.lobeRadiusX), s = 1 / (t.lobeRadiusY * t.lobeRadiusY), c = 1 / (1 - t.faceCoreQ), l = t.baseHalfX / (t.tipY - t.baseY), u = 1 / t.triangleOverlap, d = 1 / t.planeShoulder, f = 1 / t.spiralRadiusX, p = 1 / t.spiralRadiusY, m = 1 / (t.spiralFullInnerQ - t.spiralInnerQ), h = 1 / (t.spiralOuterQ - t.spiralFullOuterQ), g = t.spiralTurns / (t.spiralOuterQ - t.spiralInnerQ), _ = t.spiralBand * t.spiralBand, v = 1 / (_ - t.spiralCore * t.spiralCore), y = t.jointRadius * t.jointRadius, b = 1 / (y - t.jointCore * t.jointCore), x = t.reach * t.reach;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 100373);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 100375) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 100377) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 100379)), i[o + 5] = hash(a, e, r ^ 100381);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, r = G * t.cells, S = Math.floor(e), C = Math.floor(r), w = (C * t.cells + S) * 6, T = e - S - .5 - i[w + 2], E = r - C - .5 - i[w + 3], D = (i[w] * T + i[w + 1] * E) * i[w + 4], O = (-i[w + 1] * T + i[w] * E) * i[w + 4];
					if (D * D + O * O >= x) return;
					let k = O - t.lobeY, A = D + t.lobeX, j = D - t.lobeX, M = smooth(clamp((1 - A * A * o - k * k * s) * c)), N = smooth(clamp((1 - j * j * o - k * k * s) * c)), P = (t.tipY - O) * l, F = smooth(clamp((P + D) * d)) * smooth(clamp((P - D) * d)) * smooth(clamp((O - t.baseY + t.triangleOverlap) * u));
					if (Q = (1 - M) * (1 - N) * (1 - F), Q === 1) return;
					let I = 1 - Q, L = (Math.abs(D) - t.lobeX) * f, R = k * p, z = L * L + R * R, ee = smooth(clamp((y - D * D) * b)), te = 0;
					if (z > t.spiralInnerQ && z < t.spiralOuterQ) {
						let e = (z - t.spiralInnerQ) * g - Math.atan2(R, L) / n - t.spiralPhase, r = e - Math.floor(e + .5);
						te = smooth(clamp((_ - r * r) * v)) * smooth(clamp((z - t.spiralInnerQ) * m)) * smooth(clamp((t.spiralOuterQ - z) * h));
					}
					let ne = a(W, G), re = i[w + 5];
					J += I * (.84 + .035 * re + .025 * ne - .2 * te - .12 * ee - J), Y += I * (.6 + .003 * ne - .06 * te - .045 * ee - Y), X += I * (t.roughness + .025 * ne - .13 * te + .06 * ee - X), Z += I * (.99 - .04 * te - .03 * ee - Z);
				};
			}
			case `violinfholes`: {
				let t = require_materials.proceduralMaterialPresets.violinfholes, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(96, 12, r ^ 100113), o = cachedNoise(128, 128, r ^ 100115), s = 1 / t.halfLength, c = t.slotRadius * t.slotRadius, l = 1 / (c - t.slotCore * t.slotCore), u = t.eyeRadius * t.eyeRadius, d = 1 / (u - t.eyeCore * t.eyeCore), f = t.nickHalfWidth / t.nickHalfHeight, p = 1 / t.planeShoulder, m = t.halfLength + t.eyeRadius;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 100117);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 100119) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 100121) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 100123));
				}
				return () => {
					$ = 0, Q = 0;
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), h = Math.floor(n), g = (h * t.cells + r) * 5, _ = e - r - .5 - i[g + 2], v = n - h - .5 - i[g + 3], y = (i[g] * _ + i[g + 1] * v) * i[g + 4], b = (-i[g + 1] * _ + i[g] * v) * i[g + 4], x = 0;
					if (Math.abs(y) < t.sideReach && Math.abs(b) < m) {
						let e = Math.abs(y) - t.pairOffset, n = b * s, r = e - t.bend * (n * n * n - n), i = Math.max(0, Math.abs(b) - t.halfLength), a = smooth(clamp((c - r * r - i * i) * l)), o = b + t.halfLength, m = b - t.halfLength, h = smooth(clamp((u - e * e - o * o) * d)), g = smooth(clamp((u - e * e - m * m) * d)), _ = f * b, v = smooth(clamp((t.nickHalfWidth + e + _) * p)) * smooth(clamp((t.nickHalfWidth - e + _) * p)) * smooth(clamp((t.nickHalfWidth + e - _) * p)) * smooth(clamp((t.nickHalfWidth - e - _) * p));
						x = 1 - (1 - a) * (1 - h) * (1 - g) * (1 - v);
					}
					if (J = .02, Y = .025, X = .95, Z = .3, x === 1) return;
					let S = 1 - x, C = a(W, G), w = o(W, G);
					J += S * (.68 + .12 * C + .025 * w - J), Y += S * (.58 + .015 * C + .003 * w - Y), X += S * (t.roughness + .04 * C + .025 * w - X), Z += S * (.99 - Z);
				};
			}
			case `fishhooks`: {
				let t = require_materials.proceduralMaterialPresets.fishhooks, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 99857), o = t.arcInner * t.arcInner, s = t.arcOuter * t.arcOuter, c = 1 / (t.arcInnerCore * t.arcInnerCore - o), l = 1 / (s - t.arcOuterCore * t.arcOuterCore), u = 1 / t.joinOverlap, d = t.shankRadius * t.shankRadius, f = 1 / (d - t.shankCore * t.shankCore), p = t.eyeOuter * t.eyeOuter, m = 1 / (p - t.eyeOuterCore * t.eyeOuterCore), h = t.eyeBoreCore * t.eyeBoreCore, g = 1 / (h - t.eyeBore * t.eyeBore), _ = t.pointHalfWidth / (t.bendY - t.pointTop), v = 1 / t.planeShoulder, y = 1 / t.endShoulder, b = 1 / t.barbLength, x = t.reach * t.reach;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 99861);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 99863) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 99865) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 99867)), i[o + 5] = hash(a, e, r ^ 99869);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), S = Math.floor(n), C = (S * t.cells + r) * 6, w = e - r - .5 - i[C + 2], T = n - S - .5 - i[C + 3], E = (i[C] * w + i[C + 1] * T) * i[C + 4], D = (-i[C + 1] * w + i[C] * T) * i[C + 4];
					if (E * E + D * D >= x) return;
					let O = D - t.eyeY, k = E + t.bendRadius, A = k * k + O * O, j = smooth(clamp((h - A) * g));
					if (j === 1) return;
					let M = smooth(clamp((p - A) * m)), N = Math.max(0, t.shankTop - D, D - t.bendY), P = smooth(clamp((d - k * k - N * N) * f)), F = D - t.bendY, I = E * E + F * F, L = smooth(clamp((I - o) * c)) * smooth(clamp((s - I) * l)) * smooth(clamp((F + t.joinOverlap) * u)), R = E - t.bendRadius, z = (D - t.pointTop) * _, ee = smooth(clamp((z + R) * v)) * smooth(clamp((z - R) * v)) * smooth(clamp((t.bendY + t.joinOverlap - D) * y)), te = D - t.barbY, ne = R * t.barbAxisX + te * t.barbAxisY, re = -R * t.barbAxisY + te * t.barbAxisX, B = t.barbHalfWidth * (1 - ne * b), ie = smooth(clamp((B + re) * v)) * smooth(clamp((B - re) * v)) * smooth(clamp(ne * y)), ae = (1 - (1 - M) * (1 - P) * (1 - L) * (1 - ee) * (1 - ie)) * (1 - j);
					if ($ = ae, Q = 1 - ae, ae === 0) return;
					let oe = a(W, G), se = i[C + 5];
					J += ae * (.9 + .025 * se + .025 * oe - J), Y += ae * (.6 + .003 * oe - Y), X += ae * (t.roughness + .025 * oe - X), Z += ae * (.99 - Z);
				};
			}
			case `saffronthreads`: {
				let t = require_materials.proceduralMaterialPresets.saffronthreads, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 99601), o = t.baseY - t.tipY, s = 1 / o, c = t.tipSpread / (o * o), l = 1 / (1 - t.flareStart), u = 1 / (1 - t.coreRatio * t.coreRatio), d = c * (o + t.flareRadius) ** 2 + t.flareRadius, f = t.tipY - t.flareRadius, p = t.baseY + t.radius;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 99605);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 99607) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 99609) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 99611)), i[o + 5] = hash(a, e, r ^ 99613);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), o = Math.floor(n), m = (o * t.cells + r) * 6, h = e - r - .5 - i[m + 2], g = n - o - .5 - i[m + 3], _ = (i[m] * h + i[m + 1] * g) * i[m + 4], v = (-i[m + 1] * h + i[m] * g) * i[m + 4];
					if (Math.abs(_) >= d || v <= f || v >= p) return;
					let y = t.baseY - v, b = t.radius + (t.flareRadius - t.radius) * smooth(clamp((y * s - t.flareStart) * l)), x = 1 / (b * b), S = c * y * y, C = Math.max(0, t.tipY - v, v - t.baseY), w = C * C, T = ((_ + S) * (_ + S) + w) * x, E = (_ * _ + w) * x, D = ((_ - S) * (_ - S) + w) * x, O = smooth(clamp((1 - T) * u)), k = smooth(clamp((1 - E) * u)), A = smooth(clamp((1 - D) * u));
					if (Q = (1 - O) * (1 - k) * (1 - A), Q === 1) return;
					let j = 1 - Q, M = smooth(clamp(1 - T)), N = smooth(clamp(1 - E)), P = smooth(clamp(1 - D)), F = 1 - (1 - M) * (1 - N) * (1 - P), I = a(W, G), L = i[m + 5];
					J += j * (.8 + .035 * L + .025 * I + .06 * F - J), Y += j * (.5 + .1 * F + .003 * I - Y), X += j * (t.roughness + .02 * I - .04 * F - X), Z += j * (.99 - Z);
				};
			}
			case `rectangularsocketfaces`: {
				let t = require_materials.proceduralMaterialPresets.rectangularsocketfaces, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 99345), o = t.outerRadius * t.outerRadius, s = 1 / (o - t.outerCore * t.outerCore), c = t.mouthRadius * t.mouthRadius, l = 1 / (c - t.mouthCore * t.mouthCore), u = t.tongueRadius * t.tongueRadius, d = 1 / (u - t.tongueCore * t.tongueCore), f = 1 / t.pitch, p = t.contactRadius * t.contactRadius, m = 1 / (p - t.contactCore * t.contactCore);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 99349);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 99351) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 99353) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 99355)), i[o + 5] = hash(a, e, r ^ 99357);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), h = Math.floor(n), g = (h * t.cells + r) * 6, _ = e - r - .5 - i[g + 2], v = n - h - .5 - i[g + 3], y = (i[g] * _ + i[g + 1] * v) * i[g + 4], b = (-i[g + 1] * _ + i[g] * v) * i[g + 4], x = Math.abs(y), S = Math.abs(b), C = Math.max(0, x - t.outerStraightX), w = Math.max(0, S - t.outerStraightY), T = smooth(clamp((o - C * C - w * w) * s));
					if (T === 0) {
						J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
						return;
					}
					let E = Math.max(0, x - t.mouthStraightX), D = Math.max(0, S - t.mouthStraightY), O = smooth(clamp((c - E * E - D * D) * l)), k = T * (1 - O), A = 0, j = 0;
					if (O > 0) {
						let e = b - t.tongueY, n = Math.max(0, x - t.tongueStraightX), r = Math.max(0, Math.abs(e) - t.tongueStraightY);
						if (A = smooth(clamp((u - n * n - r * r) * d)), A > 0) {
							let n = Math.max(0, Math.min(t.contacts - 1, Math.round((y - t.firstX) * f))), r = Math.max(0, Math.abs(y - t.firstX - n * t.pitch) - t.contactStraightX), i = Math.max(0, Math.abs(e) - t.contactStraightY);
							j = smooth(clamp((p - r * r - i * i) * m));
						}
					}
					if (Q = (1 - k) * (1 - A), $ = 1 - (1 - k) * (1 - j), J = .04, Y = .025, X = .95, Z = .3, Q === 1) return;
					let M = a(W, G), N = i[g + 5];
					J += A * (.045 + .01 * N + .015 * M - J), Y += A * (.44 + .003 * M - Y), X += A * (.68 + .025 * M - X), Z += A * (.97 - Z), J += j * (.96 + .02 * M - J), Y += j * (.5 + .003 * M - Y), X += j * (.24 + .025 * M - X), Z += j * (.99 - Z), J += k * (.91 + .025 * N + .025 * M - J), Y += k * (.7 + .003 * M - Y), X += k * (.28 + .025 * M - X), Z += k * (.99 - Z);
				};
			}
			case `gnocchi`: {
				let t = require_materials.proceduralMaterialPresets.gnocchi, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 99089), o = cachedNoise(48, 48, r ^ 99091), s = 1 / (t.radiusX * t.radiusX), c = 1 / (t.radiusY * t.radiusY), l = 1 / (1 - t.faceCoreQ), u = t.grooveRadius * t.grooveRadius, d = 1 / (u - t.grooveCore * t.grooveCore), f = 1 / t.pitch, p = (t.grooves - 1) * .5;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 99093);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 99095) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 99097) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 99099)), i[o + 5] = hash(a, e, r ^ 99101);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, m = (fract(e) - .5 - i[r + 2]) * i[r + 4], h = (fract(n) - .5 - i[r + 3]) * i[r + 4], g = i[r] * m + i[r + 1] * h, _ = i[r] * h - i[r + 1] * m, v = g * g * s + _ * _ * c;
					if (v >= 1) return;
					let y = smooth(clamp((1 - v) * l)), b = smooth(clamp(1 - v)), x = g - t.bend * _ * _, S = x - Math.max(-p, Math.min(p, Math.floor(x * f + .5))) * t.pitch, C = Math.max(0, Math.abs(_) - t.grooveStraightY), w = smooth(clamp((u - S * S - C * C) * d)), T = a(W, G), E = o(W, G);
					J += y * (.84 + .035 * i[r + 5] + .025 * T + .045 * E - .1 * w - J), Y += y * (.62 + .1 * b - .07 * w + .003 * T - Y), X += y * (t.roughness + .025 * T + .04 * E + .05 * w - X), Z += y * (.99 - .04 * w - Z), Q = 1 - y;
				};
			}
			case `memorycardbacks`: {
				let t = require_materials.proceduralMaterialPresets.memorycardbacks, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 98833), o = t.bodyRadius * t.bodyRadius, s = 1 / (o - t.bodyCore * t.bodyCore), c = 1 / t.chamferShoulder, l = t.notchRadius * t.notchRadius, u = 1 / (l - t.notchCore * t.notchCore), d = t.contactRadius * t.contactRadius, f = 1 / (d - t.contactCore * t.contactCore), p = 1 / t.contactPitch;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 98837);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 98839) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 98841) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 98843)), i[o + 5] = hash(a, e, r ^ 98845);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, m = (fract(e) - .5 - i[r + 2]) * i[r + 4], h = (fract(n) - .5 - i[r + 3]) * i[r + 4], g = i[r] * m + i[r + 1] * h, _ = i[r] * h - i[r + 1] * m, v = Math.max(0, Math.abs(g) - t.bodyStraightX), y = Math.max(0, Math.abs(_) - t.bodyStraightY), b = Math.max(0, Math.abs(g - t.notchX) - t.notchStraightX), x = Math.max(0, Math.abs(_ - t.notchY) - t.notchStraightY), S = smooth(clamp((l - b * b - x * x) * u)), C = smooth(clamp((o - v * v - y * y) * s)) * smooth(clamp((t.chamferPlane - g + _) * c)) * (1 - S);
					if (Q = 1 - C, C === 0) return;
					let w = Math.max(0, Math.min(t.contacts - 1, Math.floor((g - t.firstContactX) * p + .5))), T = Math.max(0, Math.abs(g - t.firstContactX - w * t.contactPitch) - t.contactStraightX), E = Math.max(0, Math.abs(_ - t.contactY) - t.contactStraightY), D = smooth(clamp((d - T * T - E * E) * f)), O = a(W, G), k = .04 + .01 * i[r + 5] + .02 * O;
					J += C * (k + D * (.94 + .02 * O - k) - J), Y += C * (.6 - .04 * D + .003 * O - Y), X += C * (t.roughness + .025 * O + D * (.26 - t.roughness) - X), Z += C * (.99 - .01 * D - Z), $ = C * D;
				};
			}
			case `chipresistors`: {
				let t = require_materials.proceduralMaterialPresets.chipresistors, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 98577), o = t.bodyRadius * t.bodyRadius, s = 1 / (o - t.bodyCore * t.bodyCore), c = t.terminalRadius * t.terminalRadius, l = 1 / (c - t.terminalCore * t.terminalCore), u = t.strokeRadius * t.strokeRadius, d = 1 / (u - t.strokeCore * t.strokeCore), f = t.zeroOuterRadius * t.zeroOuterRadius, p = 1 / (f - t.zeroOuterCore * t.zeroOuterCore), m = t.zeroInnerRadius * t.zeroInnerRadius, h = 1 / (m - t.zeroInnerCore * t.zeroInnerCore), g = 1 / t.glyphPitch, _ = 1 / t.glyphHalfY, v = Math.max(t.glyphHalfX + t.strokeRadius, t.zeroOuterStraightX + t.zeroOuterRadius), y = Math.max(t.glyphHalfY + t.strokeRadius, t.zeroOuterStraightY + t.zeroOuterRadius);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 98581);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 98583) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 98585) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 98587)), i[o + 5] = hash(a, e, r ^ 98589);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, b = (fract(e) - .5 - i[r + 2]) * i[r + 4], x = (fract(n) - .5 - i[r + 3]) * i[r + 4], S = i[r] * b + i[r + 1] * x, C = i[r] * x - i[r + 1] * b, w = Math.abs(S), T = Math.abs(C), E = Math.max(0, w - t.bodyStraightX), D = Math.max(0, T - t.bodyStraightY), O = smooth(clamp((o - E * E - D * D) * s)), k = Math.max(0, Math.abs(w - t.terminalX) - t.terminalStraightX), A = Math.max(0, T - t.terminalStraightY), j = smooth(clamp((c - k * k - A * A) * l));
					if (Q = (1 - O) * (1 - j), $ = j * (1 - O), Q === 1) return;
					let M = a(W, G);
					if (j !== 0 && O !== 1 && (J += j * (.88 + .025 * M - J), Y += j * (.5 + .003 * M - Y), X += j * (.26 + .025 * M - X), Z += j * (.99 - Z)), O !== 0) {
						let e = 0;
						if (O === 1 && T < y) {
							let n = Math.max(0, Math.min(2, Math.floor(S * g + 1.5))), r = S - (n - 1) * t.glyphPitch;
							if (Math.abs(r) < v) {
								if (n === 1) {
									let n = Math.max(0, Math.abs(r) - t.zeroOuterStraightX), i = Math.max(0, T - t.zeroOuterStraightY), a = Math.max(0, Math.abs(r) - t.zeroInnerStraightX), o = Math.max(0, T - t.zeroInnerStraightY);
									e = smooth(clamp((f - n * n - i * i) * p)) * (1 - smooth(clamp((m - a * a - o * o) * h)));
								} else {
									let i = r - t.glyphHalfX, a = Math.max(0, T - t.glyphHalfY);
									if (e = smooth(clamp((u - i * i - a * a) * d)), n === 2 && e !== 1) {
										let n = Math.max(-1, Math.min(1, Math.floor(C * _ + .5))), i = Math.max(0, Math.abs(r) - t.glyphHalfX), a = C - n * t.glyphHalfY, o = smooth(clamp((u - i * i - a * a) * d));
										e = 1 - (1 - e) * (1 - o);
									}
								}
							}
						}
						let n = .06 + .01 * i[r + 5] + .025 * M;
						J += O * (n + e * (.94 + .02 * M - n) - J), Y += O * (.65 + .003 * M + .006 * e - Y), X += O * (t.roughness + .025 * M + .18 * e - X), Z += O * (.99 - Z);
					}
				};
			}
			case `impellerfaces`: {
				let t = require_materials.proceduralMaterialPresets.impellerfaces, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 98321), o = t.hubRadius * t.hubRadius, s = t.hubCore * t.hubCore, c = 1 / (o - s), l = t.boreRadius * t.boreRadius, u = 1 / (l - t.boreCore * t.boreCore), d = t.bladeInnerFull * t.bladeInnerFull, f = t.bladeOuterRadius * t.bladeOuterRadius, p = t.bladeOuterCore * t.bladeOuterCore, m = 1 / (f - p), h = 1 / (p - d), g = 1 / (f - d), _ = 1 / t.angleShoulder, v = 1 / t.honeAngle, y = t.blades / n, b = n / t.blades;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 98325);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 98327) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 98329) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 98331)), i[o + 5] = hash(a, e, r ^ 98333);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, p = (fract(e) - .5 - i[r + 2]) * i[r + 4], x = (fract(n) - .5 - i[r + 3]) * i[r + 4], S = i[r] * p + i[r + 1] * x, C = i[r] * x - i[r + 1] * p, w = S * S + C * C;
					if (w >= f) return;
					let T = smooth(clamp((l - w) * u)), E = smooth(clamp((o - w) * c)) * (1 - T), D = 0, O = 0, k = 0;
					if (w > s) {
						k = clamp((w - d) * h);
						let e = t.sweep * (w - d) * h, n = (fract((Math.atan2(C, S) - e) * y + .5) - .5) * b, r = t.halfAngle * clamp((f - w) * g), i = r + n;
						D = smooth(clamp(i * _)) * smooth(clamp((r - n) * _)) * smooth(clamp((f - w) * m)), O = 1 - smooth(clamp(i * v));
					}
					if (Q = (1 - D) * (1 - E), $ = 1 - Q, $ === 0) return;
					let A = a(W, G);
					D !== 0 && E !== 1 && (J += D * (.91 + .025 * i[r + 5] + .025 * A - .11 * O - J), Y += D * (.52 + .08 * smooth(k) - .035 * O + .003 * A - Y), X += D * (t.roughness + .025 * A + .1 * O - X), Z += D * (.99 - Z)), E !== 0 && (J += E * (.82 + .025 * A - J), Y += E * (.75 + .003 * A - Y), X += E * (.3 + .025 * A - X), Z += E * (.99 - Z));
				};
			}
			case `serpentinesprings`: {
				let t = require_materials.proceduralMaterialPresets.serpentinesprings, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 98065), o = t.wireRadius * t.wireRadius, s = 1 / o, c = 1 / (o - t.wireCore * t.wireCore), l = t.pitch * .5, u = (l - t.wireRadius) ** 2, d = (l + t.wireRadius) ** 2, f = 1 / t.pitch, p = .5 / t.pitch, m = t.firstY + (t.runs - 1) * t.pitch, h = t.halfRun + l + t.wireRadius;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 98069);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 98071) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 98073) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 98075)), i[o + 5] = hash(a, e, r ^ 98077);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, g = (fract(e) - .5 - i[r + 2]) * i[r + 4], _ = (fract(n) - .5 - i[r + 3]) * i[r + 4], v = i[r] * g + i[r + 1] * _, y = i[r] * _ - i[r + 1] * g, b = Math.abs(v);
					if (b >= h || y <= t.firstY - t.wireRadius || y >= m + t.wireRadius) return;
					let x;
					if (b <= t.halfRun) {
						let e = Math.max(0, Math.min(t.runs - 1, Math.floor((y - t.firstY) * f + .5))), n = y - t.firstY - e * t.pitch;
						x = n * n;
					} else if (v < 0 && (y < t.firstY + t.endOwnerGap || y > m - t.endOwnerGap)) {
						let e = v + t.halfRun, n = y - (y < t.firstY + t.endOwnerGap ? t.firstY : m);
						x = e * e + n * n;
					} else {
						let e = v < 0, n = t.firstY + (e ? 1.5 : .5) * t.pitch, r = Math.max(0, Math.min(e ? 1 : 2, Math.floor((y - n) * p + .5))), i = b - t.halfRun, a = y - n - r * 2 * t.pitch, o = i * i + a * a;
						if (o <= u || o >= d) return;
						let s = Math.sqrt(o) - l;
						x = s * s;
					}
					if (x >= o) return;
					let S = smooth(clamp((o - x) * c)), C = smooth(clamp(1 - x * s)), w = a(W, G);
					J += S * (.9 + .025 * i[r + 5] + .025 * w - J), Y += S * (.52 + .08 * C + .003 * w - Y), X += S * (t.roughness + .025 * w - .04 * C - X), Z += S * (.99 - Z), $ = S, Q = 1 - S;
				};
			}
			case `scissors`: {
				let t = require_materials.proceduralMaterialPresets.scissors, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array([
					Math.cos(t.armAngle),
					-Math.sin(t.armAngle),
					Math.cos(t.armAngle),
					Math.sin(t.armAngle)
				]), o = cachedNoise(128, 128, r ^ 97809), s = t.bladeBaseHalfX / (t.bladeBottom - t.bladeTop), c = 1 / t.planeShoulder, l = 1 / t.endShoulder, u = 1 / t.honeWidth, d = 1 / (t.handleOuterX * t.handleOuterX), f = 1 / (t.handleOuterY * t.handleOuterY), p = 1 / (t.handleInnerX * t.handleInnerX), m = 1 / (t.handleInnerY * t.handleInnerY), h = 1 / (1 - t.ellipseCoreQ), g = t.neckRadius * t.neckRadius, _ = 1 / (g - t.neckCore * t.neckCore), v = t.pivotRadius * t.pivotRadius, y = 1 / (v - t.pivotCore * t.pivotCore), b = t.reach * t.reach;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 97813);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 97815) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 97817) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 97819)), i[o + 5] = hash(a, e, r ^ 97821);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, x = (fract(e) - .5 - i[r + 2]) * i[r + 4], S = (fract(n) - .5 - i[r + 3]) * i[r + 4], C = i[r] * x + i[r + 1] * S, w = i[r] * S - i[r + 1] * x, T = C * C + w * w;
					if (T >= b) return;
					let E = 1, D = 1, O = 1;
					for (let e = 0; e < 2; e++) {
						let n = a[e * 2], r = a[e * 2 + 1], i = n * C + r * w, o = n * w - r * C, v = (o - t.bladeTop) * s, y = v + i, b = smooth(clamp(y * c)) * smooth(clamp((v - i) * c)) * smooth(clamp((t.bladeBottom - o) * l)), x = Math.max(0, Math.abs(o - t.neckY) - t.neckStraightY), S = smooth(clamp((g - i * i - x * x) * _)), T = o - t.handleY, k = smooth(clamp((1 - i * i * d - T * T * f) * h)) * (1 - smooth(clamp((1 - i * i * p - T * T * m) * h))), A = 1 - smooth(clamp(y * u));
						E *= (1 - b) * (1 - S), D *= 1 - k, O *= 1 - b * A;
					}
					let k = 1 - E, A = 1 - D, j = smooth(clamp((v - T) * y));
					if (Q = E * D * (1 - j), $ = (1 - E * (1 - j)) * D, Q === 1) return;
					let M = o(W, G);
					if (k !== 0 && A !== 1 && j !== 1) {
						let e = 1 - O;
						J += k * (.94 + .025 * M - .12 * e - J), Y += k * (.54 - .035 * e + .003 * M - Y), X += k * (.26 + .025 * M + .1 * e - X), Z += k * (.99 - Z);
					}
					A !== 0 && (J += A * (.2 + .025 * i[r + 5] + .025 * M - J), Y += A * (.7 + .003 * M - Y), X += A * (t.roughness + .025 * M - X), Z += A * (.99 - Z)), j !== 0 && (J += j * (.82 + .025 * M - J), Y += j * (.8 + .003 * M - Y), X += j * (.3 + .025 * M - X), Z += j * (.99 - Z));
				};
			}
			case `pencilsharpeners`: {
				let t = require_materials.proceduralMaterialPresets.pencilsharpeners, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 97553), o = t.bodyRadius * t.bodyRadius, s = 1 / (o - t.bodyCore * t.bodyCore), c = t.boreRadius * t.boreRadius, l = 1 / (c - t.boreCore * t.boreCore), u = 1 / t.bladeEdge, d = 1 / t.bevelWidth, f = t.screwRadius * t.screwRadius, p = 1 / (f - t.screwCore * t.screwCore), m = t.slotRadius * t.slotRadius, h = 1 / (m - t.slotCore * t.slotCore), g = t.gripRadius * t.gripRadius, _ = 1 / (g - t.gripCore * t.gripCore), v = 1 / t.gripPitch;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 97557);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 97559) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 97561) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 97563)), i[o + 5] = hash(a, e, r ^ 97565);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, y = (fract(e) - .5 - i[r + 2]) * i[r + 4], b = (fract(n) - .5 - i[r + 3]) * i[r + 4], x = i[r] * y + i[r + 1] * b, S = i[r] * b - i[r + 1] * y, C = Math.abs(x), w = Math.abs(S);
					if (C >= t.bodyStraightX + t.bodyRadius || w >= t.bodyStraightY + t.bodyRadius) return;
					let T = Math.max(0, C - t.bodyStraightX), E = Math.max(0, w - t.bodyStraightY), D = x - t.boreX, O = S - t.boreY, k = smooth(clamp((c - D * D - O * O) * l)), A = smooth(clamp((o - T * T - E * E) * s)) * (1 - k), j = x - t.bladeX, M = S - t.bladeY, N = smooth(clamp((t.bladeHalfX - Math.abs(j)) * u)) * smooth(clamp((t.bladeHalfY - Math.abs(M)) * u)), P = smooth(clamp((f - j * j - M * M) * p));
					if (Q = (1 - A) * (1 - N) * (1 - P), $ = 1 - Q, $ === 0) return;
					let F = a(W, G);
					if (A !== 0 && N !== 1 && P !== 1) {
						let e = Math.max(0, Math.min(t.gripPairs - 1, Math.floor((S - t.gripFirstY) * v + .5))), n = Math.max(0, Math.abs(C - t.gripX) - t.gripStraightX), a = S - t.gripFirstY - e * t.gripPitch, o = smooth(clamp((g - n * n - a * a) * _));
						J += A * (.66 + .035 * i[r + 5] + .025 * F - .18 * o - J), Y += A * (.42 - .065 * o + .003 * F - Y), X += A * (t.roughness + .03 * F + .08 * o - X), Z += A * (.99 - .06 * o - Z);
					}
					if (N !== 0 && P !== 1) {
						let e = 1 - smooth(clamp((j + t.bladeHalfX) * d));
						J += N * (.94 - .14 * e + .025 * F - J), Y += N * (.68 - .045 * e + .003 * F - Y), X += N * (.22 + .025 * F + .12 * e - X), Z += N * (.99 - Z);
					}
					if (P !== 0) {
						let e = Math.max(0, Math.abs(M) - t.slotStraightY), n = smooth(clamp((m - j * j - e * e) * h));
						J += P * (.81 - .25 * n + .025 * F - J), Y += P * (.82 - .075 * n + .003 * F - Y), X += P * (.3 + .025 * F + .08 * n - X), Z += P * (.99 - .04 * n - Z);
					}
				};
			}
			case `rosemarysprigs`: {
				let t = require_materials.proceduralMaterialPresets.rosemarysprigs, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.pairs * 2), o = cachedNoise(128, 128, r ^ 97297), s = 1 / (t.leafHalfY * t.leafHalfY), c = 1 / (1 - t.leafCoreQ), l = t.stemRadius * t.stemRadius, u = 1 / (l - t.stemCore * t.stemCore), d = t.ribRadius * t.ribRadius, f = 1 / (d - t.ribCore * t.ribCore), p = 1 / t.pitch, m = 2 * (t.leafCenter + t.lengthVariation) + t.leafOverlap, h = t.stemY - t.stemStraightY - t.stemRadius, g = t.stemY + t.stemStraightY + t.stemRadius;
				for (let e = 0; e < t.pairs; e++) {
					let n = t.leafCenter + t.lengthVariation * hash(e, 0, r ^ 97299);
					a[e * 2] = n, a[e * 2 + 1] = 1 / (n + t.leafOverlap) ** 2;
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 97301);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 97303) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 97305) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 97307)), i[o + 5] = hash(a, e, r ^ 97309);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, _ = (fract(e) - .5 - i[r + 2]) * i[r + 4], v = (fract(n) - .5 - i[r + 3]) * i[r + 4], y = i[r] * _ + i[r + 1] * v, b = i[r] * v - i[r + 1] * _, x = Math.abs(y);
					if (x >= m || b <= h || b >= g) return;
					let S = Math.max(0, Math.abs(b - t.stemY) - t.stemStraightY), C = smooth(clamp((l - y * y - S * S) * u)), w = b + t.slope * x, T = Math.max(0, Math.min(t.pairs - 1, Math.floor((w - t.firstPair) * p + .5))), E = w - t.firstPair - T * t.pitch, D = x - a[T * 2], k = smooth(clamp((1 - (D * D * a[T * 2 + 1] + E * E * s)) * c));
					if (Q = (1 - C) * (1 - k), Q === 1) return;
					let A = o(W, G);
					if (k !== 0 && C !== 1) {
						let e = smooth(clamp((x - t.ribStart) / t.ribFade)) * smooth(clamp((d - E * E) * f)), n = i[r + 5];
						J += k * (.42 + .04 * n + .025 * A + .14 * e - J), Y += k * (.57 + .025 * e + .003 * A - Y), X += k * (t.roughness + .025 * A - .05 * e - X), Z += k * (.99 - Z);
					}
					C !== 0 && (J += C * (.72 + .025 * A - J), Y += C * (.42 + .003 * A - Y), X += C * (.76 + .025 * A - X), Z += C * (.99 - Z));
				};
			}
			case `bananaslices`: {
				let t = require_materials.proceduralMaterialPresets.bananaslices, i = new Float64Array(t.cells * t.cells * 6), a = /* @__PURE__ */ new Float64Array(6), o = cachedNoise(128, 128, r ^ 97041), s = 1 / (t.radiusX * t.radiusX), c = 1 / (t.radiusY * t.radiusY), l = 1 / (1 - t.faceCoreQ), u = 1 / (t.rimFullQ - t.rimStartQ), d = t.hubRadius * t.hubRadius, f = 1 / (d - t.hubCore * t.hubCore), p = t.seamRadius * t.seamRadius, m = 1 / (p - t.seamCore * t.seamCore), h = 1 / (t.seedHalfX * t.seedHalfX), g = 1 / (t.seedHalfY * t.seedHalfY), _ = 1 / (1 - t.seedCoreQ), v = (t.seamEnd + t.seamRadius) ** 2;
				for (let e = 0; e < 3; e++) a[e * 2] = Math.cos(n * e / 3), a[e * 2 + 1] = Math.sin(n * e / 3);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 97045);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 97047) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 97049) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 97051)), i[o + 5] = hash(a, e, r ^ 97053);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, y = (fract(e) - .5 - i[r + 2]) * i[r + 4], b = (fract(n) - .5 - i[r + 3]) * i[r + 4], x = i[r] * y + i[r + 1] * b, S = i[r] * b - i[r + 1] * y, C = x * x * s + S * S * c;
					if (C >= 1) return;
					let w = smooth(clamp((1 - C) * l)), T = smooth(clamp((C - t.rimStartQ) * u)), E = o(W, G), D = x * x + S * S, O = 0, k = 0;
					if (D < v) {
						let e = 0, n = x, r = x * a[2] + S * a[3], i = x * a[4] + S * a[5];
						r > n && (e = 1, n = r), i > n && (e = 2, n = i);
						let o = a[e * 2], s = a[e * 2 + 1], c = S * o - x * s, l = Math.max(0, Math.min(t.seamEnd, n)), u = x - l * o, v = S - l * s, y = smooth(clamp((p - u * u - v * v) * m));
						O = 1 - (1 - smooth(clamp((d - D) * f))) * (1 - y);
						let b = n - t.seedAlong, C = Math.abs(c) - t.seedAcross;
						k = smooth(clamp((1 - (b * b * h + C * C * g)) * _));
					}
					J += w * (.9 + .02 * i[r + 5] + .025 * E - .15 * T - .2 * O - J), Y += w * (.64 - .02 * T - .08 * O + .003 * E - Y), X += w * (t.roughness + .025 * E + .14 * T + .1 * O - X), Z += w * (.99 - .01 * O - Z), k !== 0 && (J += k * (.13 + .025 * E - J), Y += k * (.5 + .003 * E - Y), X += k * (.74 + .025 * E - X), Z += k * (.97 - Z)), Q = 1 - w;
				};
			}
			case `insulatedringlugs`: {
				let t = require_materials.proceduralMaterialPresets.insulatedringlugs, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 96785), o = t.headRadius * t.headRadius, s = 1 / (o - t.headCore * t.headCore), c = t.boreRadius * t.boreRadius, l = 1 / (c - t.boreCore * t.boreCore), u = t.neckRadius * t.neckRadius, d = 1 / (u - t.neckCore * t.neckCore), f = t.collarRadius * t.collarRadius, p = 1 / (f - t.collarCore * t.collarCore), m = t.crimpRadius * t.crimpRadius, h = 1 / (m - t.crimpCore * t.crimpCore), g = t.neckStraightX + t.neckRadius, _ = t.neckY - t.neckStraightY - t.neckRadius, v = t.neckY + t.neckStraightY + t.neckRadius, y = t.headY - t.headRadius, b = t.collarY + t.collarStraightY + t.collarRadius;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 96789);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 96791) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 96793) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 96795)), i[o + 5] = hash(a, e, r ^ 96797);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, x = (fract(e) - .5 - i[r + 2]) * i[r + 4], S = (fract(n) - .5 - i[r + 3]) * i[r + 4], C = i[r] * x + i[r + 1] * S, w = i[r] * S - i[r + 1] * x, T = Math.abs(C);
					if (T >= t.headRadius || w <= y || w >= b) return;
					let E = Math.max(0, T - t.collarStraightX), D = Math.max(0, Math.abs(w - t.collarY) - t.collarStraightY), O = smooth(clamp((f - E * E - D * D) * p)), k = 0;
					if (O !== 1) {
						let e = w - t.headY, n = C * C + e * e, r = 0, i = 0;
						if (n < o && (r = smooth(clamp((o - n) * s))), T < g && w > _ && w < v) {
							let e = Math.max(0, T - t.neckStraightX), n = Math.max(0, Math.abs(w - t.neckY) - t.neckStraightY);
							i = smooth(clamp((u - e * e - n * n) * d));
						}
						k = (1 - (1 - r) * (1 - i)) * (1 - smooth(clamp((c - n) * l)));
					}
					if (Q = (1 - k) * (1 - O), Q === 1) return;
					let A = a(W, G), j = i[r + 5];
					if (k !== 0 && (J += k * (.94 + .015 * j + .025 * A - J), Y += k * (.52 + .003 * A - Y), X += k * (t.metalRoughness + .025 * A - X), Z += k * (.99 - Z)), $ = k * (1 - O), O !== 0) {
						let e = Math.max(0, T - t.crimpStraightX), n = Math.abs(w - t.collarY) - t.crimpOffset, r = smooth(clamp((m - e * e - n * n) * h));
						J += O * (.15 + .02 * j + .025 * A - .08 * r - J), Y += O * (.7 - t.crimpDepth * r + .003 * A - Y), X += O * (t.roughness + .025 * A - .045 * r - X), Z += O * (.99 - .05 * r - Z);
					}
				};
			}
			case `mushroomslices`: {
				let t = require_materials.proceduralMaterialPresets.mushroomslices, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 96529), o = cachedNoise(64, 8, r ^ 96531), s = 1 / (t.capX * t.capX), c = 1 / (t.capY * t.capY), l = 1 / (1 - t.capCoreQ), u = 1 / t.capEdge, d = 1 / (t.skinFullQ - t.skinStartQ), f = t.stemRadius * t.stemRadius, p = 1 / (f - t.stemCore * t.stemCore), m = t.gillRadius * t.gillRadius, h = 1 / (m - t.gillCore * t.gillCore), g = 1 / t.gillPitch, _ = t.gillFirst - t.gillRadius, v = t.gillFirst + (t.gills - 1) * t.gillPitch + t.gillRadius, y = t.capCenterY - t.capY, b = t.stemY + t.stemStraightY + t.stemRadius;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 96533);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 96535) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 96537) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 96539)), i[o + 5] = hash(a, e, r ^ 96541);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, x = (fract(e) - .5 - i[r + 2]) * i[r + 4], S = (fract(n) - .5 - i[r + 3]) * i[r + 4], C = i[r] * x + i[r + 1] * S, w = i[r] * S - i[r + 1] * x, T = Math.abs(C);
					if (T >= t.capX || w <= y || w >= b) return;
					let E = w - t.capCenterY, D = C * C * s + E * E * c, O = smooth(clamp((1 - D) * l)) * smooth(clamp((t.capBase - w) * u)), k = 0, A = 0;
					if (O !== 1) {
						let e = Math.max(0, T - t.stemStraightX), n = Math.max(0, Math.abs(w - t.stemY) - t.stemStraightY);
						if (k = smooth(clamp((f - e * e - n * n) * p)), k !== 1 && T > _ && T < v && w > t.gillStart - t.gillRadius && w < t.gillEnd + t.gillRadius) {
							let e = Math.max(0, Math.min(t.gills - 1, Math.floor((T - t.gillFirst) * g + .5))), n = T - t.gillFirst - e * t.gillPitch, r = w - Math.max(t.gillStart, Math.min(t.gillEnd, w));
							A = smooth(clamp((m - n * n - r * r) * h));
						}
					}
					if (Q = (1 - O) * (1 - k) * (1 - A), Q === 1) return;
					let j = O !== 0 || A !== 0 ? a(W, G) : 0;
					if (A !== 0 && (J += A * (.13 + .04 * j - J), Y += A * (.42 + .003 * j - Y), X += A * (.84 + .03 * j - X), Z += A * (.97 - Z)), k !== 0) {
						let e = o(C + .5, w + .5);
						J += k * (.84 + .07 * e - J), Y += k * (.58 + .004 * e - Y), X += k * (.82 + .03 * e - X), Z += k * (.99 - Z);
					}
					if (O !== 0) {
						let e = smooth(clamp((D - t.skinStartQ) * d)), n = i[r + 5];
						J += O * (.88 + .025 * n + .025 * j + e * (-.64 + .015 * n + .015 * j) - J), Y += O * (.65 - .03 * e + .003 * j - Y), X += O * (t.roughness + .03 * j + e * (.1 - .005 * j) - X), Z += O * (.99 - Z);
					}
				};
			}
			case `swavepavers`: {
				let t = require_materials.proceduralMaterialPresets.swavepavers, n = new Float64Array(t.rows * t.columns), i = cachedNoise(128, 128, r ^ 96273), a = cachedNoise(48, 48, r ^ 96275), o = 6 * Math.sqrt(3) * t.sway, s = 1 / t.bevel;
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = hash(i, e, r ^ 96277);
				return () => {
					J = .35, Y = .06, X = .96, Z = .4, $ = 0, Q = 1;
					let e = G * t.rows, r = Math.floor(e), c = fract(e), l = o * c * (1 - c) * (1 - 2 * c), u = W * t.columns + (r & 1) * .5 - l, d = smooth(clamp((.5 - Math.abs(fract(u) - .5) - t.grout) * s)) * smooth(clamp((.5 - Math.abs(c - .5) - t.grout) * s));
					if (d === 0) return;
					let f = (Math.floor(u) + t.columns) % t.columns, p = i(W, G), m = a(W, G);
					J += d * (.42 + .18 * n[r * t.columns + f] + .06 * p - .08 * m - J), Y += d * (.62 + .012 * p + .008 * m - Y), X += d * (t.roughness + .035 * p + .035 * m - X), Z += d * (.99 - Z), Q = 1 - d;
				};
			}
			case `splitcedarshakes`: {
				let t = require_materials.proceduralMaterialPresets.splitcedarshakes, n = new Float64Array(t.rows * t.columns * 6), i = cachedNoise(96, 8, r ^ 96017), a = t.splitRadius * t.splitRadius, o = 1 / (a - t.splitCore * t.splitCore), s = 1 / t.sideEdge, c = 1 / t.endEdge, l = 1 / (2 * t.taperHalf);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) {
					let a = (e * t.columns + i) * 6;
					n[a] = t.halfWidth + t.widthVariation * hash(i, e, r ^ 96021), n[a + 1] = hash(i, e, r ^ 96023), n[a + 2] = -t.splitOffset + t.splitJitter * (2 * hash(i, e, r ^ 96025) - 1), n[a + 3] = t.splitStart + t.splitStartVariation * hash(i, e, r ^ 96027), n[a + 4] = t.splitOffset + t.splitJitter * (2 * hash(i, e, r ^ 96029) - 1), n[a + 5] = t.splitStart + t.splitStartVariation * hash(i, e, r ^ 96031);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = G * t.rows, r = Math.floor(e), u = W * t.columns + (r & 1) * .5, d = Math.floor(u) % t.columns, f = (r * t.columns + d) * 6, p = fract(u) - .5, m = fract(e) - .5;
					if (Math.abs(p) >= n[f] || m <= -t.top || m >= t.butt) return;
					let h = t.butt - t.buttFray * i(W, (r + .5) / t.rows), g = smooth(clamp((n[f] - Math.abs(p)) * s)) * smooth(clamp((m + t.top) * c)) * smooth(clamp((h - m) * c));
					for (let e = 0; e < 2 && g !== 0; e++) {
						let t = f + 2 + e * 2, r = p - n[t], i = Math.min(0, m - n[t + 1]), s = smooth(clamp((a - r * r - i * i) * o));
						g *= 1 - s;
					}
					if (g === 0) return;
					let _ = i(W, G), v = smooth(clamp((m + t.taperHalf) * l));
					J += g * (.42 + .12 * n[f + 1] + .16 * _ - J), Y += g * (.48 + .16 * v + .008 * _ - Y), X += g * (t.roughness + .04 * _ - X), Z += g * (.99 - Z), Q = 1 - g;
				};
			}
			case `pleatedfilterpapers`: {
				let t = require_materials.proceduralMaterialPresets.pleatedfilterpapers, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 95761), o = (t.radius + t.rimRipple) ** 2, s = (t.radius - t.rimRipple) ** 2 - t.edgeSquared, c = t.foldInner * t.foldInner, l = 1 / (t.foldOuter * t.foldOuter - c), u = 1 / t.edgeSquared;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 95765);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 95767) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 95769) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 95771)), i[o + 5] = hash(a, e, r ^ 95773);
				}
				return () => {
					J = .04, Y = .025, X = .95, Z = .3, $ = 0, Q = 1;
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, d = (fract(e) - .5 - i[r + 2]) * i[r + 4], f = (fract(n) - .5 - i[r + 3]) * i[r + 4], p = d * d + f * f;
					if (p >= o) return;
					let m = 1, h = 0, g = 1;
					if (p > c) {
						let e = i[r] * d + i[r + 1] * f;
						m = 2 * e * e / p - 1;
						for (let e = 0; e < t.foldDoublings; e++) m = 2 * m * m - 1;
						if (h = smooth(clamp((p - c) * l)), p > s) {
							let e = t.radius + t.rimRipple * m;
							if (g = smooth(clamp((e * e - p) * u)), g === 0) return;
						}
					}
					let _ = a(W, G), v = h * (1 - m) * .5;
					J += g * (.86 + .03 * i[r + 5] + .03 * _ - .14 * v - J), Y += g * (.22 + .4 * h + .1 * (h - v) + .003 * _ - Y), X += g * (t.roughness + .025 * _ - .035 * v - X), Z += g * (.99 - .08 * v - Z), Q = 1 - g;
				};
			}
			case `kintsugiceramic`: {
				let t = require_materials.proceduralMaterialPresets.kintsugiceramic, n = new Float64Array(t.cells * t.cells * 3), i = new Float64Array(t.cells * t.cells * 27), a = new Float64Array(t.cells * t.cells * 81), o = /* @__PURE__ */ new Float64Array(9), s = cachedNoise(128, 128, r ^ 95505), c = 1 / (t.goldSupport - t.goldCore);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 3;
					n[a] = .5 + t.jitter * (2 * hash(i, e, r ^ 95509) - 1), n[a + 1] = .5 + t.jitter * (2 * hash(i, e, r ^ 95511) - 1), n[a + 2] = hash(i, e, r ^ 95513);
				}
				for (let e = 0; e < t.cells; e++) for (let r = 0; r < t.cells; r++) {
					let o = e * t.cells + r, s = o * 27, c = 0;
					for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
						let l = (e + a + t.cells) % t.cells, u = (r + o + t.cells) % t.cells, d = (l * t.cells + u) * 3, f = s + c++ * 3;
						i[f] = o + n[d], i[f + 1] = a + n[d + 1], i[f + 2] = n[d + 2];
					}
					for (let e = 0; e < 8; e++) for (let t = e + 1; t < 9; t++) {
						let n = i[s + e * 3] - i[s + t * 3], r = i[s + e * 3 + 1] - i[s + t * 3 + 1], c = .5 / Math.sqrt(n * n + r * r);
						a[o * 81 + e * 9 + t] = c, a[o * 81 + t * 9 + e] = c;
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), l = Math.floor(n), u = e - r, d = n - l, f = l * t.cells + r, p = f * 27, m = 0, h = 1 / 0;
					for (let e = 0; e < 9; e++) {
						let t = u - i[p + e * 3], n = d - i[p + e * 3 + 1], r = t * t + n * n;
						o[e] = r, r < h && (h = r, m = e);
					}
					let g = 1, _ = f * 81 + m * 9;
					for (let e = 0; e < 9 && g !== 0; e++) if (e !== m) {
						let n = (o[e] - h) * a[_ + e];
						g *= smooth(clamp((n - t.goldCore) * c));
					}
					let v = s(W, G), y = .94 + .03 * v, b = t.goldRoughness + .02 * v;
					J = y, X = b, g !== 0 && (J += g * (.08 + .12 * i[p + m * 3 + 2] + .02 * v - y), X += g * (t.roughness + .04 * v - b)), Y = .6 + .003 * v, $ = 1 - g, Z = .99, Q = 0;
				};
			}
			case `compactcassettefaces`: {
				let t = require_materials.proceduralMaterialPresets.compactcassettefaces, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.spokes * 2), o = cachedNoise(128, 128, r ^ 95249), s = t.bodyRadius * t.bodyRadius, c = 1 / (s - t.bodyCore * t.bodyCore), l = t.windowRadius * t.windowRadius, u = 1 / (l - t.windowCore * t.windowCore), d = t.reelRadius * t.reelRadius, f = 1 / (d - t.reelCore * t.reelCore), p = t.reelInner * t.reelInner, m = 1 / (p - t.reelInnerCore * t.reelInnerCore), h = t.spokeRadius * t.spokeRadius, g = 1 / (h - t.spokeCore * t.spokeCore), _ = (t.spokeStart - t.spokeRadius) ** 2, v = (t.spokeEnd + t.spokeRadius) ** 2, y = t.spokes / n, b = t.labelRadius * t.labelRadius, x = 1 / (b - t.labelCore * t.labelCore), S = t.guideRadius * t.guideRadius, C = 1 / (S - t.guideCore * t.guideCore), w = 1 / t.slotEdge, T = 1 / t.tapeEdge;
				for (let e = 0; e < t.spokes; e++) {
					let r = n * e / t.spokes;
					a[e * 2] = Math.cos(r), a[e * 2 + 1] = Math.sin(r);
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 95253);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 95255) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 95257) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 95259)), i[o + 5] = hash(a, e, r ^ 95261);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, E = fract(e) - .5 - i[r + 2], D = fract(n) - .5 - i[r + 3], O = (E * i[r] + D * i[r + 1]) * i[r + 4], k = (D * i[r] - E * i[r + 1]) * i[r + 4], A = o(W, G);
					if (J = .04 + .015 * A, Y = .025 + .002 * A, X = .95, Z = .3, $ = 0, Q = 1, Math.abs(O) > t.bodyStraightX + t.bodyRadius || Math.abs(k) > t.bodyStraightY + t.bodyRadius) return;
					let j = Math.max(0, Math.abs(O) - t.bodyStraightX), M = Math.max(0, Math.abs(k) - t.bodyStraightY), N = smooth(clamp((s - j * j - M * M) * c)), P = Math.abs(O) - t.reelOffset, F = P * P + k * k, I = smooth(clamp((l - F) * u)), L = k - t.headY, R = smooth(clamp((t.headHalfX - Math.abs(O)) * w)) * smooth(clamp((t.headHalfY - Math.abs(L)) * w)), z = Math.abs(O) - t.guideOffset, ee = smooth(clamp((S - z * z - L * L) * C)), te = N * (1 - I) * (1 - R) * (1 - ee), ne = Math.max(0, Math.abs(O) - t.labelStraightX), re = Math.max(0, Math.abs(k - t.labelY) - t.labelStraightY), B = smooth(clamp((b - ne * ne - re * re) * x)), ie = smooth(clamp((t.tapeHalfX - Math.abs(O)) * T)) * smooth(clamp((t.tapeHalfY - Math.abs(L)) * T)), ae = 0;
					if (F < d) {
						let e = smooth(clamp((d - F) * f)) * (1 - smooth(clamp((p - F) * m))), n = 0;
						if (e !== 1 && F > _ && F < v) {
							let e = Math.floor(Math.atan2(k, P) * y + .5);
							e < 0 && (e += t.spokes);
							let r = a[e * 2], i = a[e * 2 + 1], o = Math.max(t.spokeStart, Math.min(t.spokeEnd, P * r + k * i)), s = P - r * o, c = k - i * o;
							n = smooth(clamp((h - s * s - c * c) * g));
						}
						ae = 1 - (1 - e) * (1 - n);
					}
					if (Q = (1 - te) * (1 - ae) * (1 - B) * (1 - ie), Q === 1) return;
					let oe = i[r + 5];
					te !== 0 && B !== 1 && (J += te * (.06 + .02 * oe + .02 * A - J), Y += te * (.6 + .004 * A - Y), X += te * (t.roughness + .03 * A - X), Z += te * (.99 - Z)), ae !== 0 && (J += ae * (.68 + .05 * oe + .025 * A - J), Y += ae * (.44 + .003 * A - Y), X += ae * (.5 + .03 * A - X), Z += ae * (.98 - Z)), ie !== 0 && (J += ie * (.25 + .03 * A - J), Y += ie * (.25 + .003 * A - Y), X += ie * (.68 + .025 * A - X), Z += ie * (.98 - Z)), B !== 0 && (J += B * (.94 + .025 * A - J), Y += B * (.64 + .003 * A - Y), X += B * (.88 + .025 * A - X), Z += B * (.99 - Z));
				};
			}
			case `cinnamonbarkcoils`: {
				let t = require_materials.proceduralMaterialPresets.cinnamonbarkcoils, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 94993), o = t.pitch / n, s = 1 / t.pitch, c = t.turns * n, l = 1 / t.endFade, u = t.wallHalf * t.wallHalf, d = 1 / (u - t.wallCore * t.wallCore), f = 1 / (t.barkEnd - t.barkStart), p = (t.innerRadius - t.wallHalf) ** 2, m = (t.innerRadius + t.pitch * t.turns + t.wallHalf) ** 2;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 94997);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 94999) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 95001) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 95003)), i[o + 5] = hash(a, e, r ^ 95005);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, h = (Math.floor(r) * t.cells + Math.floor(e)) * 6, g = fract(e) - .5 - i[h + 2], _ = fract(r) - .5 - i[h + 3], v = (g * i[h] + _ * i[h + 1]) * i[h + 4], y = (_ * i[h] - g * i[h + 1]) * i[h + 4], b = v * v + y * y, x = a(W, G);
					if (J = .04 + .015 * x, Y = .025 + .002 * x, X = .95, Z = .3, $ = 0, Q = 1, b <= p || b >= m) return;
					let S = Math.sqrt(b), C = Math.atan2(y, v);
					C < 0 && (C += n);
					let w = Math.round((S - t.innerRadius - o * C) * s), T = C + w * n, E = S - t.innerRadius - o * T, D = smooth(clamp((u - E * E) * d)) * smooth(clamp(T * l)) * smooth(clamp((c - T) * l));
					if (Q = 1 - D, D === 0) return;
					let O = smooth(clamp((E - t.barkStart) * f)), k = i[h + 5];
					J += D * (.62 + .08 * k + .025 * x - .18 * O - J), Y += D * (.64 + .003 * x - .04 * O - Y), X += D * (t.roughness + .025 * x + .08 * O - X), Z += D * (.99 - .05 * O - Z);
				};
			}
			case `woodenclothespins`: {
				let t = require_materials.proceduralMaterialPresets.woodenclothespins, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 94737), o = cachedNoise(8, 96, r ^ 94739), s = 1 / (t.flareLength * t.flareLength), c = 1 / t.sideEdge, l = 1 / t.endEdge, u = 1 / t.noseLength, d = 1 / t.tailLength, f = 1 / t.springPitch, p = t.springRadius * t.springRadius, m = 1 / (p - t.springCore * t.springCore);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 94741);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 94743) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 94745) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 94747)), i[o + 5] = hash(a, e, r ^ 94749);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, h = fract(e) - .5 - i[r + 2], g = fract(n) - .5 - i[r + 3], _ = (h * i[r] + g * i[r + 1]) * i[r + 4], v = (g * i[r] - h * i[r + 1]) * i[r + 4], y = a(W, G);
					if (J = .04 + .015 * y, Y = .025 + .002 * y, X = .95, Z = .3, $ = 0, Q = 1, Math.abs(_) > t.waistHalf + t.flare || Math.abs(v) > t.halfLength) return;
					let b = t.waistHalf + t.flare * smooth(clamp(v * v * s)), x = t.gapHalf + t.noseSpread * smooth(clamp((-v - t.noseStart) * u)) + t.tailSpread * smooth(clamp((v - t.tailStart) * d)), S = smooth(clamp((Math.abs(_) - x) * c)) * smooth(clamp((b - Math.abs(_)) * c)) * smooth(clamp((t.halfLength + v) * l)) * smooth(clamp((t.halfLength - v) * l)), C = v - Math.max(-1, Math.min(1, Math.round(v * f))) * t.springPitch, w = Math.max(0, Math.abs(_) - t.springStraight), T = smooth(clamp((p - w * w - C * C) * m));
					if (Q = (1 - S) * (1 - T), Q !== 1) {
						if (S !== 0 && T !== 1) {
							let e = i[r + 5], n = o(v + e, _ + .3 * e);
							J += S * (.65 + .06 * e + .13 * n - J), Y += S * (.56 + .004 * n - Y), X += S * (t.roughness + .04 * n - X), Z += S * (.99 - Z);
						}
						T !== 0 && (J += T * (.91 + .02 * y - J), Y += T * (.72 + .003 * y - Y), X += T * (.28 + .02 * y - X), Z += T * (.99 - Z), $ = T);
					}
				};
			}
			case `tailorstapes`: {
				let t = require_materials.proceduralMaterialPresets.tailorstapes, n = cachedNoise(128, 128, r ^ 94481), i = /* @__PURE__ */ new Float64Array(10), a = 1 / t.edge, o = 1 / (t.tickHalf - t.tickCore), s = 1 / t.markEdge, c = 1 / (t.weaveHalf * t.weaveHalf), l = 1 / t.exposureEdge;
				for (let e = 0; e < i.length; e++) i[e] = e === 0 ? t.majorLength : e === 5 ? t.midLength : t.minorLength;
				return () => {
					let e = fract(G * t.rows) - .5, r = smooth(clamp((t.halfWidth - Math.abs(e)) * a)), u = n(W, G);
					if (J = .04 + .015 * u, Y = .025 + .002 * u, X = .95, Z = .3, $ = 0, Q = 1 - r, r === 0) return;
					let d = W * t.weaveCells, f = G * t.weaveCells, p = fract(d) - .5, m = fract(f) - .5, h = smooth(clamp(1 - p * p * c)), g = smooth(clamp(1 - m * m * c)), _ = Math.floor(d) - Math.floor(f) & 1 ? smooth(clamp((t.exposureHalf - Math.abs(p)) * l)) * smooth(clamp((t.exposureHalf - Math.abs(m)) * l)) : 0, v = h * (1 - _) + g * _, y = 1 - (1 - h) * (1 - g), b = .05 + (.46 * h + .18 * g * (1 - h)) * (1 - _) + (.46 * g + .18 * h * (1 - g)) * _;
					J += r * (.88 + .025 * u + .015 * v - J), Y += r * (.4 + .008 * b + .003 * u - Y), X += r * (t.roughness + .03 * u + .02 * (1 - v) - X), Z += r * (.97 + .02 * y - Z);
					let x = W * t.ticks + .5, S = Math.floor(x), C = fract(x) - .5, w = smooth(clamp((t.tickHalf - Math.abs(C)) * o));
					if (w === 0) return;
					let T = i[S % 10], E = w * smooth(clamp((t.markOuter - Math.abs(e)) * s)) * smooth(clamp((Math.abs(e) - t.markOuter + T) * s));
					E !== 0 && (J += E * (.04 + .01 * u - J), Y += .002 * E, X += E * (.78 + .02 * u - X), Z += E * (.99 - Z));
				};
			}
			case `weavingshuttles`: {
				let t = require_materials.proceduralMaterialPresets.weavingshuttles, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 94225), o = cachedNoise(8, 96, r ^ 94227), s = 1 / (t.halfLength * t.halfLength), c = 1 / (t.edge * t.edge), l = t.holeRadius * t.holeRadius, u = 1 / (l - t.holeCore * t.holeCore), d = t.shaftRadius * t.shaftRadius, f = 1 / (d - t.shaftCore * t.shaftCore), p = t.threadRadius * t.threadRadius, m = 1 / (p - t.threadCore * t.threadCore), h = 1 / t.pitch, g = 1 / (t.ridgeHalf - t.ridgeCore);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 94229);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 94231) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 94233) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 94235)), i[o + 5] = hash(a, e, r ^ 94237);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, _ = fract(e) - .5 - i[r + 2], v = fract(n) - .5 - i[r + 3], y = (_ * i[r] + v * i[r + 1]) * i[r + 4], b = (v * i[r] - _ * i[r + 1]) * i[r + 4], x = a(W, G);
					if (J = .04 + .015 * x, Y = .025 + .002 * x, X = .95, Z = .3, $ = 0, Q = 1, Math.abs(y) > t.halfWidth || Math.abs(b) > t.halfLength) return;
					let S = t.halfWidth * Math.max(0, 1 - b * b * s), C = smooth(clamp((S * S - y * y) * c)), w = Math.max(0, Math.abs(b) - t.holeStraight), T = C * (1 - (C === 0 ? 0 : smooth(clamp((l - y * y - w * w) * u)))), E = Math.max(0, Math.abs(b) - t.shaftStraight), D = smooth(clamp((d - y * y - E * E) * f)), O = Math.max(0, Math.abs(y) - t.threadStraightX), k = Math.max(0, Math.abs(b) - t.threadStraightY), A = smooth(clamp((p - O * O - k * k) * m));
					if (Q = (1 - T) * (1 - D) * (1 - A), Q === 1) return;
					let j = i[r + 5];
					if (T !== 0) {
						let e = o(b + j, y + .3 * j);
						J += T * (.48 + .06 * j + .13 * e - J), Y += T * (.7 + .004 * e - Y), X += T * (t.roughness + .04 * e - X), Z += T * (.99 - Z);
					}
					if (D !== 0 && A !== 1 && (J += D * (.86 + .03 * j + .02 * x - J), Y += D * (.36 + .003 * x - Y), X += D * (.25 + .02 * x - X), Z += D * (.98 - Z), $ = D), A !== 0) {
						let e = Math.max(0, Math.min(t.windings - 1, Math.round((b - t.firstWinding) * h))), n = smooth(clamp((t.ridgeHalf - Math.abs(b - t.firstWinding - e * t.pitch)) * g));
						J += A * (.89 + .025 * j + .02 * x + .06 * n - J), Y += A * (.52 + .05 * n + .003 * x - Y), X += A * (.87 + .025 * x - .04 * n - X), Z += A * (.98 + .01 * n - Z), $ *= 1 - A;
					}
				};
			}
			case `nyloncableties`: {
				let t = require_materials.proceduralMaterialPresets.nyloncableties, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 93969), o = t.headRadius * t.headRadius, s = 1 / (o - t.headCore * t.headCore), c = t.holeRadius * t.holeRadius, l = 1 / (c - t.holeCore * t.holeCore), u = 1 / t.strapEdge, d = 1 / t.endEdge, f = 1 / t.taperLength, p = 1 / t.pitch, m = 1 / (t.toothHalfX - t.toothCoreX), h = 1 / (t.toothHalfY - t.toothCoreY);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 93973);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 93975) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 93977) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 93979)), i[o + 5] = hash(a, e, r ^ 93981);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, g = fract(e) - .5 - i[r + 2], _ = fract(n) - .5 - i[r + 3], v = (g * i[r] + _ * i[r + 1]) * i[r + 4], y = (_ * i[r] - g * i[r + 1]) * i[r + 4], b = a(W, G);
					if (J = .04 + .015 * b, Y = .025 + .002 * b, X = .95, Z = .3, $ = 0, Q = 1, Math.abs(v) > t.headStraightX + t.headRadius || y < t.headY - t.headStraightY - t.headRadius || y > t.strapEnd) return;
					let x = Math.max(0, Math.abs(v) - t.headStraightX), S = Math.max(0, Math.abs(y - t.headY) - t.headStraightY), C = smooth(clamp((o - x * x - S * S) * s)), w = Math.max(0, Math.abs(v) - t.holeStraight), T = Math.max(0, Math.abs(y - t.headY) - t.holeStraight), E = C * (1 - (C === 0 ? 0 : smooth(clamp((c - w * w - T * T) * l)))), O = smooth(clamp((t.strapHalf - (t.strapHalf - t.tipHalf) * smooth(clamp((y - t.taperStart) * f)) - Math.abs(v)) * u)) * smooth(clamp((y - t.strapStart) * d)) * smooth(clamp((t.strapEnd - y) * d));
					if (Q = (1 - O) * (1 - E), Q === 1) return;
					let k = i[r + 5];
					if (J += O * (.8 + .04 * k + .02 * b - J), Y += O * (.46 + .003 * b - Y), X += O * (t.roughness + .03 * b - X), Z += O * (.98 - Z), O !== 0) {
						let e = Math.max(0, Math.min(t.teeth - 1, Math.round((y - t.firstTooth) * p))), n = smooth(clamp((t.toothHalfX - Math.abs(v)) * m)) * smooth(clamp((t.toothHalfY - Math.abs(y - t.firstTooth - e * t.pitch)) * h));
						J -= .06 * n, Y += .07 * n, X -= .03 * n, Z += .01 * n;
					}
					E !== 0 && (J += E * (.84 + .04 * k + .02 * b - J), Y += E * (.7 + .003 * b - Y), X += E * (.6 + .03 * b - X), Z += E * (.99 - Z));
				};
			}
			case `shojipaperlattice`: {
				let t = require_materials.proceduralMaterialPresets.shojipaperlattice, n = cachedNoise(8, 96, r ^ 93713), i = cachedNoise(3, 5, r ^ 93715), a = cachedNoise(96, 96, r ^ 93717), o = cachedNoise(12, 96, r ^ 93719), s = 1 / (t.railHalf - t.railCore);
				return () => {
					let e = fract(W * t.cells), r = fract(G * t.cells), c = smooth(clamp((t.railHalf - Math.min(e, 1 - e)) * s)), l = smooth(clamp((t.railHalf - Math.min(r, 1 - r)) * s));
					if ($ = 0, Q = 0, c === 1 || l === 1) {
						let e = l === 1 ? n(W, G) : n(G, W);
						if (J = .3 + .08 * e, Y = .64 + .004 * e, X = t.roughness + .04 * e, Z = .99, l === 1) return;
					} else {
						let e = i(W, G), r = a(W, G), s = (o(W, G) + o(G, W)) * .5;
						if (J = .9 + .03 * e + .025 * r + .01 * s, Y = .22 + .006 * r + .004 * s, X = .94 + .03 * r, Z = .88, c !== 0) {
							let e = n(G, W);
							J += c * (.3 + .08 * e - J), Y += c * (.64 + .004 * e - Y), X += c * (t.roughness + .04 * e - X), Z += c * (.99 - Z);
						}
					}
					if (l !== 0) {
						let e = n(W, G);
						J += l * (.3 + .08 * e - J), Y += l * (.64 + .004 * e - Y), X += l * (t.roughness + .04 * e - X), Z += l * (.99 - Z);
					}
				};
			}
			case `dandelionseeds`: {
				let t = require_materials.proceduralMaterialPresets.dandelionseeds, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.rays * 2), o = cachedNoise(128, 128, r ^ 93457), s = t.rayRadius * t.rayRadius, c = 1 / (s - t.rayCore * t.rayCore), l = t.hubRadius * t.hubRadius, u = t.hubCore * t.hubCore, d = 1 / (l - u), f = t.rayLength + t.rayRadius, p = f * f, m = t.hubY - f, h = t.seedY + t.seedRadiusY, g = t.rays / n, _ = t.stemRadius * t.stemRadius, v = 1 / (_ - t.stemCore * t.stemCore), y = 1 / (t.seedRadiusX * t.seedRadiusX), b = 1 / (t.seedRadiusY * t.seedRadiusY), x = 1 / t.seedEdge;
				for (let e = 0; e < t.rays; e++) {
					let r = n * e / t.rays;
					a[e * 2] = Math.cos(r), a[e * 2 + 1] = Math.sin(r);
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 93461);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 93463) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 93465) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 93467)), i[o + 5] = hash(a, e, r ^ 93469);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, S = fract(e) - .5 - i[r + 2], C = fract(n) - .5 - i[r + 3], w = (S * i[r] + C * i[r + 1]) * i[r + 4], T = (C * i[r] - S * i[r + 1]) * i[r + 4], E = o(W, G);
					if (J = .05 + .02 * E, Y = .025 + .002 * E, X = .95, Z = .3, $ = 0, Q = 1, Math.abs(w) > f || T < m || T > h) return;
					let D = T - Math.max(t.hubY, Math.min(t.stemBottom, T)), O = smooth(clamp((_ - w * w - D * D) * v)), k = T - t.seedY, A = smooth(clamp((1 - w * w * y - k * k * b) * x)), j = T - t.hubY, M = w * w + j * j, N = 0;
					if (M <= u) N = 1;
					else if (M < p) {
						let e = Math.floor(Math.atan2(j, w) * g + .5), n = (e < 0 ? e + t.rays : e) * 2, r = a[n], i = a[n + 1], o = w * r + j * i, u = Math.max(0, Math.min(t.rayLength, o)), f = w - u * r, p = j - u * i, m = smooth(clamp((s - f * f - p * p) * c));
						N = 1 - (1 - smooth(clamp((l - M) * d))) * (1 - m);
					}
					O !== 0 && (J += O * (.45 + .02 * E - J), Y += O * (.35 + .003 * E - Y), X += O * (.75 + .02 * E - X), Z += O * (.98 - Z), Q *= 1 - O), A !== 0 && (J += A * (.22 + .04 * i[r + 5] + .02 * E - J), Y += A * (.48 + .003 * E - Y), X += A * (.74 + .03 * E - X), Z += A * (.98 - Z), Q *= 1 - A), N !== 0 && (J += N * (.88 + .03 * i[r + 5] + .02 * E - J), Y += N * (.52 + .003 * E - Y), X += N * (t.roughness + .03 * E - X), Z += N * (.99 - Z), Q *= 1 - N);
				};
			}
			case `flakedarrowheads`: {
				let t = require_materials.proceduralMaterialPresets.flakedarrowheads, i = new Float64Array(t.cells * t.cells * 8), a = cachedNoise(128, 128, r ^ 93201), o = 1 / (t.base - t.tip), s = 1 / t.sideShoulder, c = 1 / t.endShoulder, l = 1 / t.stemShoulder, u = 1 / (t.notchRadiusX * t.notchRadiusX), d = 1 / (t.notchRadiusY * t.notchRadiusY), f = 1 / t.notchEdge, p = 1 / (t.baseHalf * t.baseHalf), m = 1 / (t.scarRadiusX * t.scarRadiusX), h = 1 / (t.scarRadiusZ * t.scarRadiusZ), g = 1 / t.scarEdge, _ = 1 / t.scarPitch;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 8, s = n * hash(a, e, r ^ 93205), c = hash(a, e, r ^ 93213);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 93207) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 93209) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 93211)), i[o + 5] = c, i[o + 6] = t.scarCenterX + t.scarCenterVariation * c, i[o + 7] = t.firstScarZ + t.scarJitter * (2 * hash(a, e, r ^ 93215) - 1);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 8, v = fract(e) - .5 - i[r + 2], y = fract(n) - .5 - i[r + 3], b = (v * i[r] + y * i[r + 1]) * i[r + 4], x = (y * i[r] - v * i[r + 1]) * i[r + 4], S = t.baseHalf * (x - t.tip) * o, C = smooth(clamp((S + b) * s)) * smooth(clamp((S - b) * s)) * smooth(clamp((x - t.tip) * c)) * smooth(clamp((t.base - x) * c)), w = smooth(clamp((t.stemHalf + b) * s)) * smooth(clamp((t.stemHalf - b) * s)) * smooth(clamp((x - t.stemTop) * l)) * smooth(clamp((t.stemBottom - x) * l)), T = 1 - (1 - C) * (1 - w), E = a(W, G);
					if (J = .05 + .02 * E, Y = .025 + .002 * E, X = .95, Z = .3, $ = 0, Q = 1, T === 0) return;
					let D = x - t.notchY, O = b + t.notchX, k = b - t.notchX, A = D * D * d, j = smooth(clamp((1 - O * O * u - A) * f)), M = smooth(clamp((1 - k * k * u - A) * f)), N = T * (1 - j) * (1 - M);
					if (N === 0) return;
					let P = Math.abs(b), F = smooth(clamp(1 - b * b * p)), I = 0;
					if (P > i[r + 6] - t.scarRadiusX && P < i[r + 6] + t.scarRadiusX) {
						let e = x - t.scarSlope * P, n = Math.floor((e - i[r + 7]) * _ + .5);
						if (n >= 0 && n < t.scarRows) {
							let a = P - i[r + 6], o = e - i[r + 7] - n * t.scarPitch;
							I = smooth(clamp((1 - a * a * m - o * o * h) * g));
						}
					}
					let L = .64 + .07 * i[r + 5] - .13 * I + .025 * E, R = .52 + .08 * F - .12 * I + .004 * E, z = t.roughness + .09 * I + .025 * E, ee = .98 - .09 * I;
					J += N * (L - J), Y += N * (R - Y), X += N * (z - X), Z += N * (ee - Z), Q = 1 - N;
				};
			}
			case `seamrippers`: {
				let t = require_materials.proceduralMaterialPresets.seamrippers, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 92945), o = t.shaftRadius * t.shaftRadius, s = 1 / (o - t.shaftCore * t.shaftCore), c = t.shortEnd[0] - t.shortStart[0], l = t.shortEnd[1] - t.shortStart[1], u = 1 / (c * c + l * l), d = t.shortRadius * t.shortRadius, f = 1 / (d - t.shortCore * t.shortCore), p = t.handleRadius * t.handleRadius, m = 1 / (p - t.handleCore * t.handleCore), h = t.ballRadius * t.ballRadius, g = 1 / (h - t.ballCore * t.ballCore), _ = 1 / (t.hookRoot - t.hookTip), v = 1 / t.hookEdge, y = 1 / t.hookEnd;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 92949);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 92951) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 92953) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 92955)), i[o + 5] = hash(a, e, r ^ 92957);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, b = fract(e) - .5 - i[r + 2], x = fract(n) - .5 - i[r + 3], S = (b * i[r] + x * i[r + 1]) * i[r + 4], C = (x * i[r] - b * i[r + 1]) * i[r + 4], w = a(W, G), T = C - Math.max(t.shaftTop, Math.min(t.shaftBottom, C)), E = smooth(clamp((o - S * S - T * T) * s)), D = S - t.shortStart[0], O = C - t.shortStart[1], k = clamp((D * c + O * l) * u), A = D - k * c, j = O - k * l, M = smooth(clamp((d - A * A - j * j) * f)), N = 0;
					if (C > t.hookTip && C < t.hookRoot) {
						let e = (t.hookRoot - C) * _, n = t.hookTipWidth + t.hookWidth * (1 - e) * (1 - e), r = S - t.hookRootX + t.hookCurve * e * e;
						N = smooth(clamp((1 - r * r / (n * n)) * v)) * smooth(clamp((C - t.hookTip) * y)) * smooth(clamp((t.hookRoot - C) * y));
					}
					let P = 1 - (1 - E) * (1 - M) * (1 - N), F = C - Math.max(t.handleTop, Math.min(t.handleBottom, C)), I = smooth(clamp((p - S * S - F * F) * m)), L = S - t.shortEnd[0], R = C - t.shortEnd[1], z = smooth(clamp((h - L * L - R * R) * g));
					J = .05 + .02 * w, Y = .025 + .002 * w, X = .95, Z = .3, $ = 0, Q = 1, P !== 0 && (J += P * (.86 + .05 * i[r + 5] + .02 * w - J), Y += P * (.46 + .003 * w - Y), X += P * (t.roughness + .02 * w - X), Z += P * (.98 - Z), $ = P, Q = 1 - P), I !== 0 && (J += I * (.08 + .025 * w - J), Y += I * (.52 + .004 * w - Y), X += I * (.72 + .03 * w - X), Z += I * (.99 - Z), $ *= 1 - I, Q *= 1 - I), z !== 0 && (J += z * (.16 + .02 * w - J), Y += z * (.65 + .004 * w - Y), X += z * (.45 + .04 * w - X), Z += z * (.99 - Z), $ *= 1 - z, Q *= 1 - z);
				};
			}
			case `splitvanillapods`: {
				let t = require_materials.proceduralMaterialPresets.splitvanillapods, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.cells * t.cells * t.seedRows * 2), o = cachedNoise(128, 128, r ^ 92689), s = 1 / (t.radiusX * t.radiusX), c = 1 / (t.radiusY * t.radiusY), l = 1 / t.edge, u = t.channelRadius * t.channelRadius, d = 1 / (u - t.channelCore * t.channelCore), f = 1 / t.channelEndShoulder, p = 1 / (t.seedRadiusX * t.seedRadiusX), m = 1 / (t.seedRadiusY * t.seedRadiusY), h = 1 / t.seedEdge, g = 1 / t.seedPitch, _ = (t.seedRows - 1) * t.seedPitch / 2;
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o, c = s * 6, l = n * hash(o, e, r ^ 92693);
					i[c] = Math.cos(l), i[c + 1] = Math.sin(l), i[c + 2] = t.jitter * (2 * hash(o, e, r ^ 92695) - 1), i[c + 3] = t.jitter * (2 * hash(o, e, r ^ 92697) - 1), i[c + 4] = 1 / (t.scale + t.scaleVariation * hash(o, e, r ^ 92699)), i[c + 5] = hash(o, e, r ^ 92701);
					for (let n = 0; n < t.seedRows; n++) {
						let i = (s * t.seedRows + n) * 2;
						a[i] = t.seedJitterX * (2 * hash(o * t.seedRows + n, e, r ^ 92705) - 1), a[i + 1] = n * t.seedPitch - _ + t.seedJitterY * (2 * hash(o * t.seedRows + n, e, r ^ 92707) - 1);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(n) * t.cells + Math.floor(e), v = r * 6, y = fract(e) - .5 - i[v + 2], b = fract(n) - .5 - i[v + 3], x = (y * i[v] + b * i[v + 1]) * i[v + 4], S = (b * i[v] - y * i[v + 1]) * i[v + 4], C = x - t.curve * S * S, w = o(W, G), T = smooth(clamp((1 - C * C * s - S * S * c) * l));
					if (J = .05 + .02 * w, Y = .025 + .002 * w, X = .95, Z = .3, $ = 0, Q = 1, T === 0) return;
					let E = smooth(clamp((u - C * C) * d)) * smooth(clamp((t.channelHalfLength - Math.abs(S)) * f)), D = 0;
					if (E !== 0) {
						let e = Math.floor((S + _) * g + .5);
						if (e >= 0 && e < t.seedRows) {
							let n = (r * t.seedRows + e) * 2, i = C - a[n], o = S - a[n + 1];
							D = E * smooth(clamp((1 - i * i * p - o * o * m) * h));
						}
					}
					let O = .55 + .08 * i[v + 5] + .02 * w, k = O + E * (.2 + .015 * w - O) - .055 * D, A = .52 + .003 * w - .28 * E + .055 * D, j = t.roughness + .04 * w, M = j + E * (.88 + .02 * w - j) + .04 * D, N = .98 - .26 * E + .025 * D;
					J += T * (k - J), Y += T * (A - Y), X += T * (M - X), Z += T * (N - Z), Q = 1 - T;
				};
			}
			case `bismuthhoppers`: {
				let t = require_materials.proceduralMaterialPresets.bismuthhoppers, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 92433), o = 1 / t.shoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 92437);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 92439) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 92441) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 92443)), i[o + 5] = hash(a, e, r ^ 92445);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, s = fract(e) - .5 - i[r + 2], c = fract(n) - .5 - i[r + 3], l = (s * i[r] + c * i[r + 1]) * i[r + 4], u = (c * i[r] - s * i[r + 1]) * i[r + 4], d = Math.abs(l), f = Math.abs(u), p = a(W, G);
					if (J = .05 + .02 * p, Y = .025 + .002 * p, X = .95, Z = .3, $ = 0, Q = 1, d >= t.outerHalf || f >= t.outerHalf) return;
					let m = smooth(clamp((t.outerHalf - d) * o)) * smooth(clamp((t.outerHalf - f) * o)) * (1 - smooth(clamp((t.innerHalf - d) * o)) * smooth(clamp((t.innerHalf - f) * o)));
					if (m === 0) return;
					let h = 0;
					for (let e = 0; e < t.stepHalves.length; e++) {
						let n = t.stepHalves[e];
						h += smooth(clamp((n - d) * o)) * smooth(clamp((n - f) * o));
					}
					let g = .93 - .126 * h + .02 * i[r + 5] + .015 * p, _ = .78 - .075 * h + .003 * p, v = t.roughness + .025 * h + .02 * p, y = .99 - .045 * h;
					J += m * (g - J), Y += m * (_ - Y), X += m * (v - X), Z += m * (y - Z), $ = m, Q = 1 - m;
				};
			}
			case `windmillparquet`: {
				let t = require_materials.proceduralMaterialPresets.windmillparquet, n = new Float64Array(t.cells * t.cells * 5), i = cachedNoise(8, 96, r ^ 92177), a = cachedNoise(96, 96, r ^ 92179), o = 1 / t.shoulder;
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) for (let a = 0; a < 5; a++) n[(e * t.cells + i) * 5 + a] = hash(i * 5 + a, e, r ^ 92181);
				return () => {
					let e = W * t.cells, r = G * t.cells, s = fract(e) * 3, c = fract(r) * 3, l = a(W, G), u = 1, d = 1, f = 1, p = 1, m = 4;
					c < 1 && s < 2 ? (u = 0, d = 0, f = 2, m = 0) : s >= 2 && c < 2 ? (u = 2, d = 0, p = 2, m = 1) : c >= 2 && s >= 1 ? (u = 1, d = 2, f = 2, m = 2) : s < 1 && c >= 1 && (u = 0, d = 1, p = 2, m = 3);
					let h = s - u, g = c - d, _ = smooth(clamp((Math.min(h, f - h) - t.gap) * o)) * smooth(clamp((Math.min(g, p - g) - t.gap) * o));
					if (J = .1 + .012 * l, Y = .1 + .002 * l, X = .9 + .02 * l, Z = .55, $ = 0, Q = 0, _ === 0) return;
					let v = f >= p, y = v ? h : g, b = v ? g : h, x = n[(Math.floor(r) * t.cells + Math.floor(e)) * 5 + m], S = i(y / 3 + x, b / 3 + .3 * x), C = .55 + .11 * x + .14 * S + .02 * l, w = .64 + .004 * S + .002 * l, T = t.roughness + .04 * S + .01 * l;
					J += _ * (C - J), Y += _ * (w - Y), X += _ * (T - X), Z += _ * (.99 - Z);
				};
			}
			case `utilityknifeblades`: {
				let t = require_materials.proceduralMaterialPresets.utilityknifeblades, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 91921), o = 1 / (t.bottom - t.top), s = 1 / t.sideShoulder, c = 1 / t.endShoulder, l = t.notchRadius * t.notchRadius, u = 1 / (l - t.notchCore * t.notchCore), d = 1 / (t.honeEnd - t.honeStart);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 91925);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 91927) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 91929) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 91931)), i[o + 5] = hash(a, e, r ^ 91933);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, f = (fract(e) - i[r + 2]) * i[r + 4], p = (fract(n) - i[r + 3]) * i[r + 4], m = f * i[r] + p * i[r + 1], h = p * i[r] - f * i[r + 1], g = a(W, G);
					if (J = .05 + .02 * g, Y = .025 + .002 * g, X = .95, Z = .3, $ = 0, Q = 1, h <= t.top || h >= t.bottom) return;
					let _ = t.halfTop + (t.halfBottom - t.halfTop) * (h - t.top) * o, v = h - t.top, y = m + t.notchOffset, b = m - t.notchOffset, x = smooth(clamp((l - y * y - v * v) * u)), S = smooth(clamp((l - b * b - v * v) * u)), C = smooth(clamp((_ - Math.abs(m)) * s)) * smooth(clamp((h - t.top) * c)) * smooth(clamp((t.bottom - h) * c)) * (1 - x) * (1 - S);
					if (C === 0) return;
					let w = smooth(clamp((h - t.honeStart) * d)), T = i[r + 5], E = .72 + .08 * T + .02 * g, D = E + w * (.9 + .04 * T + .015 * g - E), O = .56 - .24 * w + .003 * g, k = t.roughness + .04 * g + w * (.18 + .02 * g - t.roughness - .04 * g);
					J += C * (D - J), Y += C * (O - Y), X += C * (k - X), Z += C * (.98 + .01 * w - Z), $ = C, Q = 1 - C;
				};
			}
			case `driedchillies`: {
				let t = require_materials.proceduralMaterialPresets.driedchillies, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 91665), o = 1 / (2 * t.halfLength), s = 1 / t.sideShoulder, c = 1 / t.endShoulder, l = -t.stemX, u = t.calyxY - t.stemY, d = 1 / (l * l + u * u), f = t.stemRadius * t.stemRadius, p = 1 / (f - t.stemCore * t.stemCore), m = 1 / t.calyxRadiusX, h = 1 / t.calyxRadiusY, g = 1 / t.calyxEdge;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 91669);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 91671) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 91673) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 91675)), i[o + 5] = hash(a, e, r ^ 91677);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, _ = (Math.floor(r) * t.cells + Math.floor(e)) * 6, v = (fract(e) - i[_ + 2]) * i[_ + 4], y = (fract(r) - i[_ + 3]) * i[_ + 4], b = v * i[_] + y * i[_ + 1], x = y * i[_] - v * i[_ + 1], S = a(W, G);
					J = .05 + .02 * S, Y = .025 + .002 * S, X = .95, Z = .3, $ = 0;
					let C = 1;
					if (x > -t.halfLength && x < t.halfLength) {
						let e = (x + t.halfLength) * o, r = t.width * (1 - e) * (1 - e) + t.tipWidth, a = (b - t.curve * e * e) / r, l = smooth(clamp((1 - a * a) * s)) * smooth(clamp((x + t.halfLength) * c)) * smooth(clamp((t.halfLength - x) * c));
						if (l > 0) {
							let r = .5 + .5 * Math.cos(n * (t.wrinkles * e + i[_ + 5]));
							J += l * (.78 - .12 * r + .08 * i[_ + 5] + .025 * S - J), Y += l * (.62 - .08 * r + .005 * S - Y), X += l * (t.roughness + .08 * r + .03 * S - X), Z += l * (.98 - .06 * r - Z), C *= 1 - l;
						}
					}
					if (x <= t.calyxY + t.calyxRadiusY) {
						let e = clamp(((b - t.stemX) * l + (x - t.stemY) * u) * d), n = b - t.stemX - e * l, r = x - t.stemY - e * u, i = smooth(clamp((f - n * n - r * r) * p));
						i > 0 && (J += i * (.025 + .02 * S - J), Y += i * (.42 + .004 * S - Y), X += i * (.85 + .03 * S - X), Z += i * (.98 - Z), C *= 1 - i);
						let a = b * m, o = (x - t.calyxY) * h, s = smooth(clamp((1 - a * a - o * o) * g));
						s > 0 && (J += s * (.08 + .025 * S - J), Y += s * (.64 + .004 * S - Y), X += s * (.88 + .02 * S - X), Z += s * (.99 - Z), C *= 1 - s);
					}
					Q = C;
				};
			}
			case `internaltoothwashers`: {
				let t = require_materials.proceduralMaterialPresets.internaltoothwashers, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 91409), o = t.outerRadius * t.outerRadius, s = (t.rootRadius - t.toothDepth) ** 2, c = 1 / (o - t.fullOuter * t.fullOuter), l = 1 / t.innerSquaredShoulder, u = t.bendRoot * t.bendRoot, d = 1 / (u - t.fullBend * t.fullBend), f = t.teeth * .5;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 91413);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 91415) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 91417) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 91419)), i[o + 5] = hash(a, e, r ^ 91421);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, p = (fract(e) - i[r + 2]) * i[r + 4], m = (fract(n) - i[r + 3]) * i[r + 4], h = p * i[r] + m * i[r + 1], g = m * i[r] - p * i[r + 1], _ = h * h + g * g, v = a(W, G);
					if (J = .05 + .02 * v, Y = .025 + .002 * v, X = .94, Z = .3, $ = 0, Q = 1, _ <= s || _ >= o) return;
					let y = Math.atan2(g, h), b = .5 + .5 * Math.cos(t.teeth * y), x = t.rootRadius - t.toothDepth * b, S = smooth(clamp((o - _) * c)) * smooth(clamp((_ - x * x) * l));
					if (S === 0) return;
					let C = smooth(clamp((u - _) * d)) * b * Math.cos(f * y), w = .82 + .06 * i[r + 5] + .025 * v, T = .5 + .1 * C + .003 * v;
					J += S * (w - J), Y += S * (T - Y), X += S * (t.roughness + .03 * v - X), Z += S * (.98 + .01 * C - Z), $ = S, Q = 1 - S;
				};
			}
			case `wulfenite`: {
				let t = require_materials.proceduralMaterialPresets.wulfenite, i = new Float64Array(t.cells * t.cells * 7), a = cachedNoise(128, 128, r ^ 145681), o = cachedNoise(16, 16, r ^ 145683), s = 1 / t.shoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					if (hash(a, e, r ^ 145685) >= t.chance) continue;
					let o = (e * t.cells + a) * 7, s = n * hash(a, e, r ^ 145687), c = t.halfMinimum + t.halfVariation * hash(a, e, r ^ 145689), l = c * (t.aspectMinimum + t.aspectVariation * hash(a, e, r ^ 145691));
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 145693) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 145695) - 1), i[o + 4] = 1 / (c * c), i[o + 5] = 1 / (l * l), i[o + 6] = hash(a, e, r ^ 145697);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 7, c = a(W, G), l = o(W, G);
					if (J = .06 + .06 * l + .015 * c, Y = .1 + .025 * l + .003 * c, X = .9 + .04 * l + .01 * c, Z = .54, i[r + 4] === 0) return;
					let u = fract(e) - i[r + 2], d = fract(n) - i[r + 3], f = u * i[r] + d * i[r + 1], p = d * i[r] - u * i[r + 1], m = smooth(clamp((1 - f * f * i[r + 4]) * s)) * smooth(clamp((1 - p * p * i[r + 5]) * s));
					m !== 0 && (J += m * (.72 + .1 * i[r + 6] + .025 * c - J), Y += m * (.53 + .004 * c - Y), X += m * (t.roughness + .025 * c - X), Z += m * (.97 + .02 * c - Z));
				};
			}
			case `celestine`:
			case `barite`:
			case `kyaniteblades`: {
				let i = require_materials.proceduralMaterialPresets[t], a = new Float64Array(i.cells * i.cells * 6), o = cachedNoise(128, 128, r ^ 91153), s = 1 / i.pitch, c = 1 / i.halfWidth, l = 1 / i.sideShoulder, u = 1 / i.endShoulder, d = i.faceTilt, f = i.striaHeight, p = n * i.striae / (2 * i.halfWidth);
				for (let e = 0; e < i.cells; e++) for (let t = 0; t < i.cells; t++) {
					let o = (e * i.cells + t) * 6, s = n * hash(t, e, r ^ 91157);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s), a[o + 2] = .5 + i.jitter * (2 * hash(t, e, r ^ 91159) - 1), a[o + 3] = .5 + i.jitter * (2 * hash(t, e, r ^ 91161) - 1), a[o + 4] = 1 / (i.scale + i.scaleVariation * hash(t, e, r ^ 91163)), a[o + 5] = hash(t, e, r ^ 91165);
				}
				return () => {
					let e = W * i.cells, t = G * i.cells, n = (Math.floor(t) * i.cells + Math.floor(e)) * 6, r = (fract(e) - a[n + 2]) * a[n + 4], m = (fract(t) - a[n + 3]) * a[n + 4], h = r * a[n] + m * a[n + 1], g = m * a[n] - r * a[n + 1], _ = Math.floor(h * s + .5) + 1, v = o(W, G);
					if (J = .1 + .03 * v, Y = .12 + .003 * v, X = .87 + .02 * v, Z = .55, $ = 0, Q = 0, _ < 0 || _ >= i.tops.length) return;
					let y = h - (_ - 1) * i.pitch, b = g - i.endSlope * y, x = smooth(clamp((i.halfWidth - Math.abs(y)) * l)) * smooth(clamp((b - i.tops[_]) * u)) * smooth(clamp((i.bottoms[_] - b) * u));
					if (x === 0) return;
					let S = .5 - .5 * Math.cos(p * (y + i.halfWidth)), C = .7 + .12 * a[n + 5] + .06 * S + .03 * v, w = .55 + d * y * c + f * S + .004 * v, T = i.roughness + .1 * (1 - S) + .04 * v;
					J += x * (C - J), Y += x * (w - Y), X += x * (T - X), Z += x * (.97 + .02 * S - Z);
				};
			}
			case `solderlessbreadboard`: {
				let t = require_materials.proceduralMaterialPresets.solderlessbreadboard, n = cachedNoise(128, 128, r ^ 90897), i = 1 / t.pitch, a = 1 / t.holeRadius, o = 1 / t.holeEdge, s = 1 / t.channelShoulder, c = 1 / t.rows;
				return () => {
					let e = Math.abs(W - .5), r = n(W, G), l = smooth(clamp((t.channelWidth - e) * s));
					if (J = .83 + .02 * r, Y = .6 + .003 * r, X = t.roughness + .03 * r, Z = .98, $ = 0, Q = 0, l > 0) {
						J += l * (.12 + .015 * r - J), Y += l * (.22 + .003 * r - Y), X += l * (.82 + .025 * r - X), Z += l * (.6 - Z);
						return;
					}
					let u = Math.floor((e - t.firstColumn) * i + .5);
					if (u < 0 || u >= t.columns) return;
					let d = (e - t.firstColumn - u * t.pitch) * a, f = (fract(G * t.rows) - .5) * c * a, p = d * d, m = f * f, h = smooth(clamp((1 - p * p - m * m) * o));
					h !== 0 && (J += h * (.08 + .012 * r - J), Y += h * (.18 + .003 * r - Y), X += h * (.9 + .02 * r - X), Z += h * (.55 - Z));
				};
			}
			case `orecchiette`: {
				let t = require_materials.proceduralMaterialPresets.orecchiette, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 90641), o = 1 / t.radiusX, s = 1 / t.radiusY, c = 1 / t.bowlX, l = 1 / t.bowlY, u = 1 / t.edge, d = 1 / t.rimWidth;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 90645);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 90647) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 90649) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 90651)), i[o + 5] = hash(a, e, r ^ 90653);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, f = (fract(e) - i[r + 2]) * i[r + 4], p = (fract(n) - i[r + 3]) * i[r + 4], m = f * i[r] + p * i[r + 1], h = p * i[r] - f * i[r + 1], g = m * o, _ = h * s, v = g * g + _ * _, y = smooth(clamp((1 - v) * u)), b = a(W, G);
					if (J = .05 + .02 * b, Y = .025 + .002 * b, X = .96, Z = .3, $ = 0, Q = 1 - y, y === 0) return;
					let x = (m + t.bowlOffset) * c, S = h * l, C = smooth(clamp(1 - x * x - S * S)), w = (v - t.rimCenter) * d, T = smooth(clamp(1 - w * w)), E = .7 - .15 * C + .1 * T + .05 * i[r + 5] + .02 * b, D = .52 - .28 * C + .16 * T + .004 * b, O = t.roughness + .04 * C + .02 * b;
					J += y * (E - J), Y += y * (D - Y), X += y * (O - X), Z += y * (.98 - .2 * C - Z);
				};
			}
			case `bullionknots`: {
				let t = require_materials.proceduralMaterialPresets.bullionknots, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 90385), o = t.radius * t.radius, s = 1 / (o - t.core * t.core), c = 1 / t.endShoulder, l = n * t.turns / (2 * t.halfLength);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 90389);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 90391) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 90393) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 90395)), i[o + 5] = hash(a, e, r ^ 90397);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, u = (Math.floor(r) * t.cells + Math.floor(e)) * 6, d = (fract(e) - i[u + 2]) * i[u + 4], f = (fract(r) - i[u + 3]) * i[u + 4], p = d * i[u] + f * i[u + 1], m = f * i[u] - d * i[u + 1], h = Math.max(0, Math.abs(p) - t.halfLength), g = smooth(clamp((o - h * h - m * m) * s)), _ = a(W, G), v = .5 + .25 * (Math.cos(n * t.threads * W) + Math.cos(n * t.threads * G));
					if (J = .1 + .025 * v + .02 * _, Y = .1 + .01 * v + .002 * _, X = .9 + .02 * _, Z = .97, $ = 0, Q = 0, g === 0) return;
					let y = smooth(clamp((t.halfLength - Math.abs(p)) * c)) * (.5 - .5 * Math.cos(l * (p + t.halfLength))), b = .75 + .12 * y + .04 * i[u + 5] + .01 * _, x = .42 + .18 * y + .004 * _, S = t.roughness + .08 * (1 - y) + .02 * _;
					J += g * (b - J), Y += g * (x - Y), X += g * (S - X), Z += g * (.9 + .08 * y - Z);
				};
			}
			case `dendriticfrost`: {
				let t = require_materials.proceduralMaterialPresets.dendriticfrost, i = new Float64Array(t.cells * t.cells * 6), a = /* @__PURE__ */ new Float64Array(6), o = cachedNoise(128, 128, r ^ 90129), s = t.stemRadius * t.stemRadius, c = 1 / (s - t.stemCore * t.stemCore), l = t.branchRadius * t.branchRadius, u = 1 / (l - t.branchCore * t.branchCore), d = 1 / t.branchPitch, f = t.branchOrigin + t.branchRun * .5, p = 1 / (t.branchRun * t.branchRun + t.branchRise * t.branchRise);
				for (let e = 0; e < 3; e++) {
					let t = Math.PI * e / 3;
					a[e * 2] = Math.cos(t), a[e * 2 + 1] = Math.sin(t);
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 90133);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 90135) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 90137) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 90139)), i[o + 5] = hash(a, e, r ^ 90141);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), m = (Math.floor(n) * t.cells + r) * 6, h = fract(e) - .5 - i[m + 2], g = fract(n) - .5 - i[m + 3], _ = (h * i[m] + g * i[m + 1]) * i[m + 4], v = (g * i[m] - h * i[m + 1]) * i[m + 4], y = 1;
					for (let e = 0; e < 3; e++) {
						let n = Math.abs(_ * a[e * 2] + v * a[e * 2 + 1]), r = v * a[e * 2] - _ * a[e * 2 + 1], i = Math.max(0, n - t.stemLength);
						if (y *= 1 - smooth(clamp((s - i * i - r * r) * c)), y === 0) break;
						let o = Math.floor((n - f) * d + .5);
						if (o < 0 || o >= t.branchCount) continue;
						let m = n - t.branchOrigin - o * t.branchPitch, h = clamp((m * t.branchRun + r * t.branchRise) * p), g = m - t.branchRun * h, b = r - t.branchRise * h;
						if (y *= 1 - smooth(clamp((l - g * g - b * b) * u)), y === 0) break;
						let x = clamp((m * t.branchRun - r * t.branchRise) * p), S = m - t.branchRun * x, C = r + t.branchRise * x;
						if (y *= 1 - smooth(clamp((l - S * S - C * C) * u)), y === 0) break;
					}
					let b = o(W, G), x = 1 - y;
					J = .1 + .02 * b, Y = .15 + .002 * b, X = .22 + .02 * b, Z = .96, $ = 0, Q = 0, x !== 0 && (J += x * (.84 + .08 * i[m + 5] + .03 * b - J), Y += x * (.46 + .004 * b - Y), X += x * (t.roughness + .03 * b - X), Z += x * (.99 - Z));
				};
			}
			case `diamondpanelparquet`: {
				let t = require_materials.proceduralMaterialPresets.diamondpanelparquet, n = 2 * t.lookupHalf + 1, i = new Float64Array(4 + n * n), a = cachedNoise(8, 96, r ^ 89873), o = cachedNoise(96, 96, r ^ 89879), s = 1 / t.pitch, c = 1 / t.bevel;
				for (let e = 0; e < 4; e++) i[e] = hash(e, 0, r ^ 89875);
				for (let e = 0; e < n; e++) for (let a = 0; a < n; a++) i[4 + e * n + a] = hash(a - t.lookupHalf, e - t.lookupHalf, r ^ 89877);
				return () => {
					let e = W - .5, r = G - .5, l = Math.abs(e), u = Math.abs(r);
					J = .055, Y = .1, X = .9, Z = .55, $ = 0, Q = 0;
					let d, f, p, m;
					if (Math.max(l, u) >= t.inner) {
						let n = u >= l, a = n ? u : l, o = n ? l : u;
						if (d = smooth(clamp((.5 - a - t.gap) * c)) * smooth(clamp((a - t.inner - t.gap) * c)) * smooth(clamp((a - o - t.gap) * c)), d === 0) return;
						f = n ? e : r, p = n ? r : e, m = i[n ? r < 0 ? 2 : 3 : e < 0 ? 0 : 1];
					} else {
						let a = (e + r) * Math.SQRT1_2, o = (r - e) * Math.SQRT1_2, h = Math.floor(a * s + .5), g = Math.floor(o * s + .5), _ = a - h * t.pitch, v = o - g * t.pitch;
						if (d = smooth(clamp((t.inner - l - t.gap) * c)) * smooth(clamp((t.inner - u - t.gap) * c)) * smooth(clamp((t.pitch * .5 - Math.abs(_) - t.gap) * c)) * smooth(clamp((t.pitch * .5 - Math.abs(v) - t.gap) * c)), d === 0) return;
						let y = !(h + g & 1);
						f = y ? _ : v, p = y ? v : _, m = i[4 + (g + t.lookupHalf) * n + h + t.lookupHalf];
					}
					let h = a(f + m, p + .3 * m), g = o(W, G);
					J += d * (.38 + .14 * m + .25 * h + .02 * g - J), Y += d * (.64 + .004 * h + .002 * g - Y), X += d * (t.roughness + .04 * h + .015 * g - X), Z += d * (.99 - Z);
				};
			}
			case `boullebrassinlay`: {
				let t = require_materials.proceduralMaterialPresets.boullebrassinlay, n = require_materials.proceduralMaterialPresets.tortoiseshellacetate, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(n.macroCells, n.macroCells, r ^ 89617), o = cachedNoise(n.detailCells, n.detailCells, r ^ 89619), s = cachedNoise(n.warpCells, n.warpCells, r ^ 89621), c = cachedNoise(n.warpCells, n.warpCells, r ^ 89623), l = cachedNoise(n.grainCells, n.grainCells, r ^ 89625), u = t.radius * t.radius, d = t.bandQ * t.bandQ, f = 1 / (d - t.coreQ * t.coreQ), p = 1 / t.endShoulder, m = 1 / (t.budX * t.budX), h = 1 / (t.budY * t.budY), g = 1 / t.budShoulder, _ = 1 / n.shoulder;
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let a = (e * t.cells + n) * 6, o = t.angle * (2 * hash(n, e, r ^ 89633) - 1);
					i[a] = Math.cos(o), i[a + 1] = Math.sin(o), i[a + 2] = t.jitter * (2 * hash(n, e, r ^ 89635) - 1), i[a + 3] = t.jitter * (2 * hash(n, e, r ^ 89637) - 1), i[a + 4] = 1 / (t.scale + t.scaleVariation * hash(n, e, r ^ 89639)), i[a + 5] = hash(n, e, r ^ 89641);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, v = Math.floor(e), y = Math.floor(r), b = (y * t.cells + v) * 6, x = fract(e) - .5 - i[b + 2], S = fract(r) - .5 - i[b + 3], C = (v + y & 1 ? -1 : 1) * (x * i[b] + S * i[b + 1]) * i[b + 4], w = (S * i[b] - x * i[b + 1]) * i[b + 4], T = w + t.radius, E = w - t.radius, D = C * C + T * T - u, O = C * C + E * E - u, k = smooth(clamp((d - D * D) * f)) * smooth(clamp((C + t.endPad) * p)), A = smooth(clamp((d - O * O) * f)) * smooth(clamp((t.endPad - C) * p)), j = smooth(clamp((1 - (C + t.budCenterX) * (C + t.budCenterX) * m - (w + t.budCenterY) * (w + t.budCenterY) * h) * g)), M = smooth(clamp((1 - (C - t.budCenterX) * (C - t.budCenterX) * m - (w - t.budCenterY) * (w - t.budCenterY) * h) * g)), N = 1 - (1 - k) * (1 - A) * (1 - j) * (1 - M), P = l(W, G), F = .85 + .07 * i[b + 5] + .02 * P;
					if (Y = .38 + .001 * P, X = t.roughness + .018 * P + .12 * N, Z = 1, $ = N, Q = 0, N === 1) {
						J = F;
						return;
					}
					let I = W + n.warp * (s(W, G) - .5), L = G + n.warp * (c(W, G) - .5), z = .35 - .28 * smooth(clamp((n.macroWeight * a(I, L) + (1 - n.macroWeight) * o(I, L) - n.threshold) * _)) + .015 * P;
					J = z + N * (F - z);
				};
			}
			case `sewingthimbles`: {
				let t = require_materials.proceduralMaterialPresets.sewingthimbles, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.cells * t.cells * t.columns * t.rows * 2), o = cachedNoise(128, 128, r ^ 89361), s = 1 / (t.bottom - t.top), c = 1 / t.capRadius, l = 1 / t.edge, u = 1 / t.bottomEdge, d = 1 / (t.rimX * t.rimX), f = 1 / (t.rimY * t.rimY), p = 1 / (t.dimpleRadius * t.dimpleRadius), m = 1 / t.pitchX, h = 1 / t.pitchY, g = t.columns * t.pitchX * .5;
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o, c = s * 6, l = n * hash(o, e, r ^ 89365);
					i[c] = Math.cos(l), i[c + 1] = Math.sin(l), i[c + 2] = t.jitter * (2 * hash(o, e, r ^ 89367) - 1), i[c + 3] = t.jitter * (2 * hash(o, e, r ^ 89369) - 1), i[c + 4] = 1 / (t.scale + t.scaleVariation * hash(o, e, r ^ 89371)), i[c + 5] = hash(o, e, r ^ 89373);
					for (let n = 0; n < t.rows; n++) for (let i = 0; i < t.columns; i++) {
						let c = ((s * t.rows + n) * t.columns + i) * 2, l = o * t.columns + i, u = e * t.rows + n;
						a[c] = (i + .5) * t.pitchX - g + t.dimpleJitter * (2 * hash(l, u, r ^ 89377) - 1), a[c + 1] = (n + .5) * t.pitchY - t.originY + t.dimpleJitter * (2 * hash(l, u, r ^ 89379) - 1);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), _ = Math.floor(n) * t.cells + r, v = _ * 6, y = fract(e) - .5 - i[v + 2], b = fract(n) - .5 - i[v + 3], x = (y * i[v] + b * i[v + 1]) * i[v + 4], S = (b * i[v] - y * i[v + 1]) * i[v + 4], C = S - t.rimCenter, w = smooth(clamp((1 - x * x * d) * l)) * smooth(clamp((1 - C * C * f) * l));
					if (J = .04, Y = .025, X = .96, Z = .3, $ = 0, Q = 1, w === 1) {
						let e = o(W, G);
						J = .87 + .04 * i[v + 5] + .02 * e, Y = .66 + .003 * e, X = .2 + .02 * e, Z = 1, $ = 1, Q = 0;
						return;
					}
					let T = x / (t.topWidth + (t.bottomWidth - t.topWidth) * smooth(clamp((S - t.top) * s))), E = Math.max(0, t.capJoin - S) * c, D = smooth(clamp((1 - T * T - E * E) * l)) * smooth(clamp((t.bottom - S) * u)), O = 1 - (1 - D) * (1 - w);
					if (O === 0) return;
					let k = o(W, G), A = i[v + 5], j = smooth(clamp(1 - T * T)), M = .62 + .1 * j + .05 * A + .02 * k, N = .42 + .16 * j + .003 * k, P = t.roughness + .02 * k, F = .98;
					if (D > 0) {
						let e = Math.floor((x + g) * m), n = Math.floor((S + t.originY) * h);
						if (e >= 0 && e < t.columns && n >= 0 && n < t.rows) {
							let r = ((_ * t.rows + n) * t.columns + e) * 2, i = x - a[r], o = S - a[r + 1], s = smooth(clamp(1 - (i * i + o * o) * p));
							M -= .34 * s, N -= t.dimpleDepth * s, P += .24 * s, F -= .25 * s;
						}
					}
					M += w * (.87 + .04 * A + .02 * k - M), N += w * (.66 + .003 * k - N), P += w * (.2 + .02 * k - P), F += w * (1 - F), J += O * (M - J), Y += O * (N - Y), X += O * (P - X), Z += O * (F - Z), $ = O, Q = 1 - O;
				};
			}
			case `papayacuts`: {
				let t = require_materials.proceduralMaterialPresets.papayacuts, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.cells * t.cells * t.seedColumns * t.seedRows * 2), o = cachedNoise(128, 128, r ^ 89105), s = 1 / (t.width * t.width), c = 1 / (t.length * t.length), l = 1 / (t.fleshWidth * t.fleshWidth), u = 1 / (t.fleshLength * t.fleshLength), d = 1 / (t.pitWidth * t.pitWidth), f = 1 / (t.pitLength * t.pitLength), p = 1 / t.edge, m = 1 / t.fleshEdge, h = 1 / t.pitEdge, g = t.seedRadius * t.seedRadius, _ = 1 / (g - t.seedCore * t.seedCore), v = 1 / g, y = 1 / t.seedPitchX, b = 1 / t.seedPitchY, x = t.seedColumns * t.seedPitchX * .5, S = t.seedRows * t.seedPitchY * .5;
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o, c = s * 6, l = n * hash(o, e, r ^ 89109);
					i[c] = Math.cos(l), i[c + 1] = Math.sin(l), i[c + 2] = t.jitter * (2 * hash(o, e, r ^ 89111) - 1), i[c + 3] = t.jitter * (2 * hash(o, e, r ^ 89113) - 1), i[c + 4] = 1 / (t.scale + t.scaleVariation * hash(o, e, r ^ 89115)), i[c + 5] = hash(o, e, r ^ 89117);
					for (let n = 0; n < t.seedRows; n++) {
						let i = (t.seedColumns - t.seedRowLengths[n]) * .5;
						for (let c = i; c < i + t.seedRowLengths[n]; c++) {
							let i = ((s * t.seedRows + n) * t.seedColumns + c) * 2, l = o * t.seedColumns + c, u = e * t.seedRows + n;
							a[i] = (c + .5) * t.seedPitchX - x + t.seedJitter * (2 * hash(l, u, r ^ 89121) - 1), a[i + 1] = (n + .5) * t.seedPitchY - S + t.seedJitter * (2 * hash(l, u, r ^ 89123) - 1);
						}
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), C = Math.floor(n) * t.cells + r, w = C * 6, T = fract(e) - .5 - i[w + 2], E = fract(n) - .5 - i[w + 3], D = (T * i[w] + E * i[w + 1]) * i[w + 4], O = (E * i[w] - T * i[w + 1]) * i[w + 4], k = smooth(clamp((1 - D * D * s - O * O * c) * p));
					if (J = .035, Y = .025, X = .96, Z = .3, $ = 0, Q = 1 - k, k === 0) return;
					let A = o(W, G), j = i[w + 5], M = smooth(clamp((1 - D * D * l - O * O * u) * m)), N = .42 + .04 * j + .02 * A, P = .62 + .004 * A, F = .75 + .02 * A, I = .98;
					if (N += M * (.84 + .08 * j + .03 * A - N), P += M * (.68 + .004 * A - P), F += M * (t.roughness + .02 * A - F), I += M * (.99 - I), M > 0) {
						let e = smooth(clamp((1 - D * D * d - O * O * f) * h));
						if (e > 0) {
							let n = .17 + .03 * A, r = .24 + .004 * A, i = .38 + .02 * A, o = .72, s = Math.floor((D + x) * y), c = Math.floor((O + S) * b);
							if (s >= 0 && s < t.seedColumns && c >= 0 && c < t.seedRows) {
								let e = (t.seedColumns - t.seedRowLengths[c]) * .5;
								if (s >= e && s < e + t.seedRowLengths[c]) {
									let e = ((C * t.seedRows + c) * t.seedColumns + s) * 2, l = D - a[e], u = O - a[e + 1], d = l * l + u * u, f = smooth(clamp((g - d) * _));
									if (f > 0) {
										let e = smooth(clamp(1 - d * v));
										n += f * (.025 + .02 * A - n), r += f * (.42 + .04 * e + .004 * A - r), i += f * (.24 + .02 * A - i), o += f * (.95 + .03 * e - o);
									}
								}
							}
							N += e * (n - N), P += e * (r - P), F += e * (i - F), I += e * (o - I);
						}
					}
					J += k * (N - J), Y += k * (P - Y), X += k * (F - X), Z += k * (I - Z);
				};
			}
			case `pencilshavings`: {
				let t = require_materials.proceduralMaterialPresets.pencilshavings, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 88849), o = t.inner * t.inner, s = t.outer * t.outer, c = 1 / (t.innerFull * t.innerFull - o), l = 1 / (s - t.outerFull * t.outerFull), u = 1 / t.cutShoulder, d = t.paintStart * t.paintStart, f = 1 / (t.paintFull * t.paintFull - d);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 88853);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 88855) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 88857) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 88859)), i[o + 5] = hash(a, e, r ^ 88861);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), p = (Math.floor(n) * t.cells + r) * 6, m = fract(e) - .5 - i[p + 2], h = fract(n) - .5 - i[p + 3], g = (m * i[p] + h * i[p + 1]) * i[p + 4], _ = (h * i[p] - m * i[p + 1]) * i[p + 4], v = g * g + _ * _, y = smooth(clamp((v - o) * c)) * smooth(clamp((s - v) * l)) * smooth(clamp(_ * u));
					if (J = .04, Y = .025, X = .96, Z = .3, $ = 0, Q = 1 - y, y === 0) return;
					let b = a(W, G), x = i[p + 5], S = .5 - .5 * Math.cos(t.flutes * Math.atan2(_, g)), C = smooth(clamp((v - d) * f)), w = .7 + .08 * x + .14 * S + .035 * b, T = .12 + .04 * x + .02 * b;
					J += y * (w + C * (T - w) - J), Y += y * (.38 + .03 * x + .14 * S + .003 * b - Y), X += y * (t.roughness + .02 * b - .4 * C - X), Z += y * (.94 + .04 * S - Z);
				};
			}
			case `botryoidalcopper`: {
				let t = require_materials.proceduralMaterialPresets.botryoidalcopper, n = new Float64Array(t.cells * t.cells * 3), i = cachedNoise(128, 128, r ^ 88593), a = 1 / (t.radius * t.radius);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 3;
					n[a] = .5 + t.jitter * (2 * hash(i, e, r ^ 88595) - 1), n[a + 1] = .5 + t.jitter * (2 * hash(i, e, r ^ 88597) - 1), n[a + 2] = hash(i, e, r ^ 88599);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(e), s = Math.floor(r), c = fract(e), l = fract(r), u = 0, d = 0;
					for (let e = -1; e <= 1; e++) {
						let r = (s + e + t.cells) % t.cells;
						for (let i = -1; i <= 1; i++) {
							let s = (o + i + t.cells) % t.cells, f = (r * t.cells + s) * 3, p = c - i - n[f], m = l - e - n[f + 1], h = 1 - (p * p + m * m) * a;
							if (h <= 0) continue;
							let g = h * h * h;
							u += g, d += g * n[f + 2];
						}
					}
					let f = smooth(clamp(u)), p = i(W, G);
					J = .12 + .45 * f + .04 * d + .025 * p, Y = .14 + .48 * f + .003 * p, X = t.roughness - .4 * f + .02 * p, Z = .7 + .29 * f, $ = 1, Q = 0;
				};
			}
			case `conicalsampletubes`: {
				let t = require_materials.proceduralMaterialPresets.conicalsampletubes, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 88337), o = 1 / (t.bodyRadius * t.bodyRadius), s = 1 / t.taperLength, c = 1 / t.topShoulder, l = 1 / t.shoulder, u = 1 / (t.capX * t.capX), d = 1 / (t.capY * t.capY), f = 1 / (t.hingeX * t.hingeX), p = 1 / (t.hingeY * t.hingeY), m = 1 / (t.labelX * t.labelX), h = 1 / (t.labelY * t.labelY);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 88341);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 88343) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 88345) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 88347)), i[o + 5] = hash(a, e, r ^ 88349);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, g = (fract(e) - .5 - i[r + 2]) * i[r + 4], _ = (fract(n) - .5 - i[r + 3]) * i[r + 4], v = g * i[r] + _ * i[r + 1], y = _ * i[r] - g * i[r + 1], b = 1 - smooth(clamp((y - t.taperStart) * s)), x = b * b - v * v * o, S = smooth(clamp(x * l)) * smooth(clamp((y - t.bodyTop) * c)), C = y - t.capCenter, w = smooth(clamp((1 - v * v * u) * l)) * smooth(clamp((1 - C * C * d) * l)), T = v - t.hingeCenterX, E = y - t.hingeCenterY, D = smooth(clamp((1 - T * T * f) * l)) * smooth(clamp((1 - E * E * p) * l)), O = 1 - (1 - S) * (1 - w) * (1 - D);
					if (Q = 1 - O, J = .015, Y = .025, X = .96, Z = .3, O === 0) return;
					let k = a(W, G), A = i[r + 5];
					if (D > 0 && S < 1 && w < 1 && (J += D * (.4 + .08 * A + .02 * k - J), Y += D * (.29 + .003 * k - Y), X += D * (.64 + .02 * k - X), Z += D * (.97 - Z)), S > 0 && w < 1) {
						let e = .48 + .12 * A + .025 * k, n = .32 + .12 * smooth(clamp(x)) + .003 * k, r = t.roughness + .02 * k, i = y - t.labelCenter, a = smooth(clamp((1 - v * v * m - i * i * h) * l));
						a > 0 && (e += a * (.82 + .05 * A + .02 * k - e), n += a * (.455 + .003 * k - n), r += a * (.88 + .02 * k - r)), J += S * (e - J), Y += S * (n - Y), X += S * (r - X), Z += S * (.99 - Z);
					}
					w > 0 && (J += w * (.67 + .1 * A + .02 * k - J), Y += w * (.54 + .003 * k - Y), X += w * (.3 + .02 * k - X), Z += w * (.995 - Z));
				};
			}
			case `driedtamarindpods`: {
				let t = require_materials.proceduralMaterialPresets.driedtamarindpods, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.lobes * 2), o = cachedNoise(128, 128, r ^ 88081), s = cachedNoise(24, 24, r ^ 88083), c = 1 / (t.radiusX * t.radiusX), l = 1 / (t.radiusY * t.radiusY), u = 1 / t.shoulder, d = (t.lobes - 1) * t.pitch / 2, f = 1 / (d * d), p = t.stemRadius * t.stemRadius, m = 1 / (p - t.stemCore * t.stemCore), h = 1 / t.poreShoulder;
				for (let e = 0; e < t.lobes; e++) {
					let n = (e - (t.lobes - 1) / 2) * t.pitch;
					a[e * 2] = t.curve * (1 - n * n * f), a[e * 2 + 1] = n;
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 88085);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 88087) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 88089) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 88091)), i[o + 5] = hash(a, e, r ^ 88093);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, d = (fract(e) - .5 - i[r + 2]) * i[r + 4], f = (fract(n) - .5 - i[r + 3]) * i[r + 4], g = d * i[r] + f * i[r + 1], _ = f * i[r] - d * i[r + 1], v = 1, y = 1;
					for (let e = 0; e < t.lobes; e++) {
						let t = g - a[e * 2], n = _ - a[e * 2 + 1], r = 1 - t * t * c - n * n * l;
						v *= 1 - smooth(clamp(r * u)), y *= 1 - smooth(clamp(r));
					}
					let b = 1 - v, x = 1 - y, S = Math.max(Math.abs(_ - t.stemCenter) - t.stemStraight, 0), C = smooth(clamp((p - g * g - S * S) * m)), w = 1 - (1 - b) * (1 - C);
					if (Q = 1 - w, J = .015, Y = .02, X = .96, Z = .3, w === 0) return;
					let T = o(W, G);
					if (C > 0 && b < 1 && (J += C * (.25 + .035 * i[r + 5] + .02 * T - J), Y += C * (.2 + .003 * T - Y), X += C * (.88 + .02 * T - X), Z += C * (.9 - Z)), b > 0) {
						let e = smooth(clamp((s(W, G) - t.poreThreshold) * h));
						J += b * (.48 + .11 * i[r + 5] + .025 * T + .1 * x - .08 * e - J), Y += b * (.34 + .15 * x + .003 * T - .01 * e - Y), X += b * (t.roughness + .025 * T + .035 * e - X), Z += b * (.9 + .09 * x - .02 * e - Z);
					}
				};
			}
			case `shippocloth`: {
				let t = require_materials.proceduralMaterialPresets.shippocloth, n = cachedNoise(128, 128, r ^ 87825), i = hash(0, 0, r ^ 87827), a = hash(0, 0, r ^ 87829), o = hash(0, 0, r ^ 87831), s = t.width * t.width, c = 1 / (s - t.core * t.core), l = Math.PI * t.threads;
				return () => {
					let e = fract(W * t.cells + i), r = fract(G * t.cells + a), u = e - 1, d = r - 1, f = e * e + r * r - t.radiusSquared, p = u * u + r * r - t.radiusSquared, m = e * e + d * d - t.radiusSquared, h = u * u + d * d - t.radiusSquared, g = smooth(clamp((s - f * f) * c)), _ = smooth(clamp((s - p * p) * c)), v = smooth(clamp((s - m * m) * c)), y = smooth(clamp((s - h * h) * c)), b = 1 - (1 - g) * (1 - _) * (1 - v) * (1 - y), x = Math.cos(l * W), S = Math.cos(l * G), C = x * x, w = S * S, T = .5 + .5 * x * S, E = C * (.35 + .25 * T) + w * (.35 + .25 * (1 - T)) - .3 * C * w, D = n(W, G);
					J = .06 + .025 * D + .015 * E + b * (.82 + .05 * o), Y = .12 + .22 * E + .004 * D, X = t.roughness + .025 * D + .02 * (1 - E), Z = .84 + .15 * E, Q = 0;
				};
			}
			case `coaxialcablecuts`: {
				let t = require_materials.proceduralMaterialPresets.coaxialcablecuts, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.strands * 2), o = cachedNoise(128, 128, r ^ 87569), s = t.outerRadius * t.outerRadius, c = 1 / (s - t.fullRadius * t.fullRadius), l = t.dielectricRadius * t.dielectricRadius, u = 1 / (l - t.dielectricFull * t.dielectricFull), d = t.conductorRadius * t.conductorRadius, f = 1 / (d - t.conductorFull * t.conductorFull), p = t.strandRadius * t.strandRadius, m = 1 / (p - t.strandFull * t.strandFull), h = (t.shieldRadius - t.strandRadius) ** 2, g = (t.shieldRadius + t.strandRadius) ** 2, _ = t.strands / n;
				for (let e = 0; e < t.strands; e++) {
					let r = e * n / t.strands;
					a[e * 2] = t.shieldRadius * Math.cos(r), a[e * 2 + 1] = t.shieldRadius * Math.sin(r);
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 87573);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 87575) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 87577) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 87579)), i[o + 5] = hash(a, e, r ^ 87581);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, v = (fract(e) - .5 - i[r + 2]) * i[r + 4], y = (fract(n) - .5 - i[r + 3]) * i[r + 4], b = v * i[r] + y * i[r + 1], x = y * i[r] - v * i[r + 1], S = b * b + x * x, C = smooth(clamp((s - S) * c));
					if (Q = 1 - C, $ = 0, J = .015, Y = .025, X = .96, Z = .3, C === 0) return;
					let w = 0;
					if (S > h && S < g) {
						let e = (Math.floor(Math.atan2(x, b) * _ + .5) % t.strands + t.strands) % t.strands * 2, n = b - a[e], r = x - a[e + 1];
						w = smooth(clamp((p - n * n - r * r) * m));
					}
					let T = 1 - (1 - smooth(clamp((d - S) * f))) * (1 - w), E = o(W, G), D = 0, O = 0;
					if (T < 1) {
						let e = smooth(clamp((l - S) * u));
						D = .045 + .025 * i[r + 5] + .01 * E, O = t.roughness + .02 * E, D += e * (.92 + .025 * E - D), O += e * (.65 + .02 * E - O);
					}
					T > 0 && (D += T * (.67 + .1 * i[r + 5] + .02 * E - D), O += T * (.26 + .02 * E - O)), $ = C * T, J += C * (D - J), Y += C * (.4 + .002 * E - Y), X += C * (O - X), Z += C * (1 - Z);
				};
			}
			case `nutmeghalves`: {
				let t = require_materials.proceduralMaterialPresets.nutmeghalves, i = new Float64Array(t.cells * t.cells * 8), a = cachedNoise(128, 128, r ^ 87313), o = cachedNoise(8, 8, r ^ 87315), s = cachedNoise(8, 8, r ^ 87316), c = 1 / (t.radiusX * t.radiusX), l = 1 / (t.radiusY * t.radiusY), u = 1 / t.shoulder, d = 1 / t.fleshShoulder, f = n * t.veins, p = n * t.veins * .8, m = n * t.warp, h = 1 / t.veinShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 8, s = n * hash(a, e, r ^ 87317);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 87319) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 87321) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 87323)), i[o + 5] = hash(a, e, r ^ 87325), i[o + 6] = n * hash(a, e, r ^ 87326), i[o + 7] = n * hash(a, e, r ^ 87327);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 8, g = (fract(e) - .5 - i[r + 2]) * i[r + 4], _ = (fract(n) - .5 - i[r + 3]) * i[r + 4], v = g * i[r] + _ * i[r + 1], y = _ * i[r] - g * i[r + 1], b = v * v * c + y * y * l, x = smooth(clamp((1 - b) * u));
					if (Q = 1 - x, J = .015, Y = .02, X = .96, Z = .3, x === 0) return;
					let S = a(W, G), C = smooth(clamp((t.fleshQ - b) * d)), w = 0, T = 0, E = 0, D = 0;
					if (C < 1 && (w = .16 + .07 * i[r + 5] + .02 * S, T = .33 + .002 * S, E = t.roughness + .02 * S, D = .94), C > 0) {
						let e = smooth(clamp((Math.cos(f * v + m * (o(v + .5, y + .5) - .5) + i[r + 6]) - t.veinThreshold) * h)), n = smooth(clamp((Math.cos(p * y + m * (s(v + .5, y + .5) - .5) + i[r + 7]) - t.veinThreshold) * h)), a = 1 - (1 - e) * (1 - n);
						w += C * (.68 + .1 * i[r + 5] + .02 * S - .38 * a - w), T += C * (.36 + .002 * S - T), E += C * (.69 + .02 * S - E), D += C * (.98 - D);
					}
					J += x * (w - J), Y += x * (T - Y), X += x * (E - X), Z += x * (D - Z);
				};
			}
			case `brassjinglebells`: {
				let t = require_materials.proceduralMaterialPresets.brassjinglebells, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 87057), o = t.outerRadius * t.outerRadius, s = 1 / (o - t.fullRadius * t.fullRadius), c = 1 / o, l = t.slotRadius * t.slotRadius, u = 1 / (l - t.slotCore * t.slotCore), d = t.endRadius * t.endRadius, f = 1 / (d - t.endCore * t.endCore), p = t.centerRadius * t.centerRadius, m = 1 / (p - t.centerCore * t.centerCore), h = t.seamRadius * t.seamRadius, g = t.seamWidth * t.seamWidth, _ = 1 / (g - t.seamCore * t.seamCore);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 87061);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 87063) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 87065) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 87067)), i[o + 5] = hash(a, e, r ^ 87069);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, v = (fract(e) - .5 - i[r + 2]) * i[r + 4], y = (fract(n) - .5 - i[r + 3]) * i[r + 4], b = v * i[r] + y * i[r + 1], x = y * i[r] - v * i[r + 1], S = Math.abs(b), C = Math.abs(x), w = b * b + x * x, T = smooth(clamp((o - w) * s));
					if (Q = 1 - T, $ = 0, J = .015, Y = .025, X = .96, Z = .3, T === 0) return;
					let E = Math.max(S - t.slotLength, 0), D = Math.max(C - t.slotLength, 0), O = smooth(clamp((l - E * E - x * x) * u)), k = smooth(clamp((l - D * D - b * b) * u)), A = Math.max(S, C) - t.slotLength, j = Math.min(S, C), M = smooth(clamp((d - A * A - j * j) * f)), N = smooth(clamp((p - w) * m)), P = 1 - (1 - O) * (1 - k) * (1 - M) * (1 - N), F = a(W, G), I = 0, L = 0, R = 0, z = 0;
					if (P < 1) {
						let e = w - h, n = smooth(clamp((g - e * e) * _));
						I = .66 + .14 * i[r + 5] + .025 * F + .08 * n, L = .32 + .16 * smooth(clamp(1 - w * c)) + .045 * n + .003 * F, R = t.roughness + .02 * F - .05 * n, z = .99 + .01 * n;
					}
					P > 0 && (I += P * (.055 + .015 * F - I), L += P * (.12 + .003 * F - L), R += P * (.91 + .02 * F - R), z += P * (.4 - z)), $ = T * (1 - P), J += T * (I - J), Y += T * (L - Y), X += T * (R - X), Z += T * (z - Z);
				};
			}
			case `lepidolitemica`: {
				let t = require_materials.proceduralMaterialPresets.lepidolitemica, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 86801), o = cachedNoise(8, 8, r ^ 86803), s = 1 / t.bevel, c = Math.sqrt(3) / 2;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 86805);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 86807) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 86809) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 86811)), i[o + 5] = hash(a, e, r ^ 86813);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, l = (fract(e) - .5 - i[r + 2]) * i[r + 4], u = (fract(n) - .5 - i[r + 3]) * i[r + 4], d = l * i[r] + u * i[r + 1], f = u * i[r] - l * i[r + 1], p = Math.abs(d), m = Math.abs(.5 * d + c * f), h = Math.abs(-.5 * d + c * f), g = smooth(clamp((t.outerRadius - p) * s)) * smooth(clamp((t.outerRadius - m) * s)) * smooth(clamp((t.outerRadius - h) * s)), _ = a(W, G);
					if (Q = 0, Z = .96, J = 0, Y = 0, X = 0, g < 1) {
						let e = o(W, G);
						J = .12 + .14 * e + .025 * _, Y = .18 + .008 * _, X = t.roughness + .04 * e;
					}
					if (g === 0) return;
					let v = smooth(clamp((t.middleRadius - p) * s)) * smooth(clamp((t.middleRadius - m) * s)) * smooth(clamp((t.middleRadius - h) * s)) + smooth(clamp((t.innerRadius - p) * s)) * smooth(clamp((t.innerRadius - m) * s)) * smooth(clamp((t.innerRadius - h) * s));
					J += g * (.55 + .16 * i[r + 5] + .015 * _ + .08 * v - J), Y += g * (.32 + .04 * v + .002 * _ - Y), X += g * (.3 - .03 * v + .015 * _ - X), Z += g * (.99 + .005 * v - Z);
				};
			}
			case `pennerigate`: {
				let t = require_materials.proceduralMaterialPresets.pennerigate, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 86545), o = 1 / (t.halfX * t.halfX), s = 1 / t.shoulder, c = t.halfY * t.halfY, l = 1 / (c - t.fullY * t.fullY), u = 1 / t.ridgePitch, d = t.ridgeRadius * t.ridgeRadius, f = 1 / (d - t.ridgeCore * t.ridgeCore), p = 1 / (t.mouthX * t.mouthX), m = 1 / (t.mouthY * t.mouthY), h = 1 / t.mouthShoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 86549);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 86551) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 86553) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 86555)), i[o + 5] = hash(a, e, r ^ 86557);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, g = (fract(e) - .5 - i[r + 2]) * i[r + 4], _ = (fract(n) - .5 - i[r + 3]) * i[r + 4], v = g * i[r] + _ * i[r + 1], y = _ * i[r] - g * i[r + 1] - t.cutSlope * v, b = clamp(1 - v * v * o), x = smooth(clamp(b * s)) * smooth(clamp((c - y * y) * l));
					if (Q = 1 - x, J = .015, Y = .025, X = .96, Z = .3, x === 0) return;
					let S = Math.abs(y) - t.mouthCenter, C = smooth(clamp((1 - v * v * p - S * S * m) * h)), w = a(W, G), T = 0, E = 0, D = 0, O = 0;
					if (C < 1) {
						let e = Math.floor(v * u + .5), n = 0;
						if (Math.abs(e) <= 2) {
							let r = v - e * t.ridgePitch;
							n = smooth(clamp((d - r * r) * f));
						}
						T = .5 + .15 * i[r + 5] + .03 * w + .09 * n, E = .32 + .15 * smooth(b) + .035 * n + .003 * w, D = t.roughness + .025 * w - .025 * n, O = .985;
					}
					C > 0 && (T += C * (.14 + .04 * i[r + 5] + .02 * w - T), E += C * (.11 + .003 * w - E), D += C * (.91 + .015 * w - D), O += C * (.5 - O)), J += x * (T - J), Y += x * (E - Y), X += x * (D - X), Z += x * (O - Z);
				};
			}
			case `toroidalinductors`: {
				let t = require_materials.proceduralMaterialPresets.toroidalinductors, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.turns * 2), o = cachedNoise(128, 128, r ^ 86289), s = t.innerRadius * t.innerRadius, c = t.outerRadius * t.outerRadius, l = (s + c) / 2, u = 4 / ((c - s) * (c - s)), d = 1 / t.innerShoulder, f = 1 / t.outerShoulder, p = t.wireRadius * t.wireRadius, m = 1 / p, h = 1 / (p - t.wireCore * t.wireCore), g = (t.wireCenter - t.wireStraight - t.wireRadius) ** 2, _ = (t.wireCenter + t.wireStraight + t.wireRadius) ** 2, v = t.turns / n;
				for (let e = 0; e < t.turns; e++) {
					let r = n * e / t.turns;
					a[e * 2] = Math.cos(r), a[e * 2 + 1] = Math.sin(r);
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 86293);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 86295) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 86297) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 86299)), i[o + 5] = hash(a, e, r ^ 86301);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, y = (fract(e) - .5 - i[r + 2]) * i[r + 4], b = (fract(n) - .5 - i[r + 3]) * i[r + 4], x = y * i[r] + b * i[r + 1], S = b * i[r] - y * i[r + 1], C = x * x + S * S, w = smooth(clamp((C - s) * d)) * smooth(clamp((c - C) * f)), T = 0, E = 0;
					if (C > g && C < _) {
						let e = (Math.floor(Math.atan2(S, x) * v + .5) % t.turns + t.turns) % t.turns * 2, n = x * a[e] + S * a[e + 1], r = S * a[e] - x * a[e + 1], i = Math.max(0, Math.abs(n - t.wireCenter) - t.wireStraight);
						E = r * r + i * i, T = smooth(clamp((p - E) * h));
					}
					let D = 1 - (1 - w) * (1 - T);
					if (Q = 1 - D, $ = T, J = .015, Y = .025, X = .96, Z = .3, D === 0) return;
					let O = o(W, G), k = i[r + 5];
					if (w > 0 && T < 1) {
						let e = C - l, t = smooth(clamp(1 - e * e * u));
						J += w * (.07 + .035 * k + .015 * O - J), Y += w * (.34 + .05 * t + .003 * O - Y), X += w * (.79 + .025 * O - X), Z += w * (.98 - Z);
					}
					if (T > 0) {
						let e = smooth(clamp(1 - E * m));
						J += T * (.72 + .12 * k + .025 * O - J), Y += T * (.49 + .055 * e + .003 * O - Y), X += T * (.23 + .02 * O - X), Z += T * (.995 - Z);
					}
				};
			}
			case `rickracktrim`: {
				let t = require_materials.proceduralMaterialPresets.rickracktrim, i = new Float64Array(t.columns), a = new Float64Array(t.columns), o = cachedNoise(128, 128, r ^ 86033), s = n * t.cycles, c = n * t.fibers, l = n * t.amplitude * t.cycles / t.columns, u = t.halfWidth * t.halfWidth, d = 1 / u, f = 1 / (u - t.fullWidth * t.fullWidth), p = 1 / (t.edgeBand * t.edgeBand);
				for (let e = 0; e < t.columns; e++) i[e] = n * hash(e, 0, r ^ 86035), a[e] = hash(e, 0, r ^ 86037);
				return () => {
					let e = W * t.columns, r = Math.floor(e), m = s * G + i[r], h = t.amplitude * Math.sin(m), g = l * Math.cos(m), _ = fract(e) - .5 - h, v = _ * _ / (1 + g * g), y = smooth(clamp((u - v) * f));
					if (Q = 1 - y, J = .015, Y = .025, X = .96, Z = .3, y === 0) return;
					let b = v * d, x = smooth(clamp(1 - b)), S = b - t.edgePosition, C = smooth(clamp(1 - S * S * p)), w = .5 + .5 * Math.cos(c * G + n * t.fiberSlant * _), T = o(W, G);
					J += y * (.42 + .15 * a[r] + .07 * w + .16 * C + .02 * T - J), Y += y * (.28 + .04 * x + .025 * w + .1 * C + .003 * T - Y), X += y * (t.roughness + .025 * T - .025 * w - .035 * C - X), Z += y * (.97 + .025 * x - Z);
				};
			}
			case `orthocerasstone`: {
				let t = require_materials.proceduralMaterialPresets.orthocerasstone, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(128, 128, r ^ 85777), o = cachedNoise(8, 8, r ^ 85779), s = 1 / (t.baseY - t.tipY), c = 1 / (t.halfWidth * t.halfWidth), l = 1 / t.capRadius, u = 1 / t.septumPitch, d = t.septumRadius * t.septumRadius, f = 1 / (d - t.septumCore * t.septumCore);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 85781);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 85783) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 85785) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 85787)), i[o + 5] = hash(a, e, r ^ 85789);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, p = (fract(e) - .5 - i[r + 2]) * i[r + 4], m = (fract(n) - .5 - i[r + 3]) * i[r + 4], h = p * i[r] + m * i[r + 1], g = m * i[r] - p * i[r + 1], _ = Math.max(0, (g - t.tipY) * s), v = Math.max(0, (g - t.capStart) * l), y = Math.max(0, 1 - v * v), b = h * h * c, x = smooth(clamp((_ * _ * y - b) / (t.edgeSlope * _ + t.tipShoulder))), S = a(W, G);
					if (Y = .36 + .001 * S, X += .02 * S, Z = 1, J = x < 1 ? .025 + .035 * o(W, G) + .015 * S : 0, x === 0) return;
					let C = g - t.septumBend * b, w = Math.floor((C - t.septumFirst) * u + .5), T = 0;
					if (w >= 0 && w < t.septumCount) {
						let e = C - t.septumFirst - w * t.septumPitch;
						T = smooth(clamp((d - e * e) * f));
					}
					J += x * (.58 + .12 * i[r + 5] + .04 * S - .35 * T - J);
				};
			}
			case `balloonwhisks`: {
				let t = require_materials.proceduralMaterialPresets.balloonwhisks, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.headRadii.length), o = cachedNoise(128, 128, r ^ 85521), s = 1 / (t.headYRadius * t.headYRadius), c = t.wireRadius * t.wireRadius, l = 1 / c, u = 1 / (c - t.wireCore * t.wireCore), d = t.neckRadius * t.neckRadius, f = 1 / d, p = 1 / (d - t.neckCore * t.neckCore), m = t.handleRadius * t.handleRadius, h = 1 / m, g = 1 / (m - t.handleCore * t.handleCore), _ = 1 / t.bandPitch, v = t.bandRadius * t.bandRadius, y = 1 / (v - t.bandCore * t.bandCore);
				for (let e = 0; e < t.headRadii.length; e++) a[e] = 1 / (t.headRadii[e] * t.headRadii[e]);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 85525);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 85527) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 85529) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 85531)), i[o + 5] = hash(a, e, r ^ 85533);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, b = (fract(e) - .5 - i[r + 2]) * i[r + 4], x = (fract(n) - .5 - i[r + 3]) * i[r + 4], S = b * i[r] + x * i[r + 1], C = x * i[r] - b * i[r + 1], w = S * S, T = Math.max(0, Math.abs(C - t.handleY) - t.handleStraight), E = w + T * T, D = smooth(clamp((m - E) * g)), O = 0, k = 0, A = 0, j = 0;
					if (D < 1) {
						let e = Math.max(0, Math.abs(C - t.neckY) - t.neckStraight);
						k = w + e * e, O = smooth(clamp((d - k) * p));
						let n = C - t.headY, r = n * s, i = n * r, o = r * r;
						if (O < 1 && i < 1.5) for (let e = 0; e < a.length; e++) {
							let t = S * a[e], n = S * t + i;
							if (n < .5 || n > 1.5) continue;
							let r = n - 1, s = .25 * r * r / (t * t + o);
							if (s >= c) continue;
							let d = smooth(clamp((c - s) * u)), f = smooth(clamp(1 - s * l));
							if (A += (1 - A) * d, j += (1 - j) * f, A === 1 && j === 1) break;
						}
					}
					let M = 1 - (1 - A) * (1 - O) * (1 - D);
					if ($ = M, Q = 1 - M, J = .015, Y = .025, X = .96, Z = .3, M === 0) return;
					let N = o(W, G), P = i[r + 5];
					if (A > 0 && (J += A * (.64 + .14 * P + .025 * N - J), Y += A * (.31 + .07 * j + .003 * N - Y), X += A * (.24 + .02 * N - X), Z += A * (.985 - Z)), O > 0) {
						let e = smooth(clamp(1 - k * f));
						J += O * (.6 + .14 * P + .025 * N - J), Y += O * (.35 + .04 * e + .003 * N - Y), X += O * (.27 + .02 * N - X), Z += O * (.99 - Z);
					}
					if (D > 0) {
						let e = Math.floor((C - t.bandFirst) * _ + .5), n = 0;
						if (e >= 0 && e < t.bandCount) {
							let r = C - t.bandFirst - e * t.bandPitch;
							n = smooth(clamp((v - r * r) * y));
						}
						let r = smooth(clamp(1 - E * h));
						J += D * (.5 + .12 * P + .025 * N + .08 * n - J), Y += D * (.48 + .06 * r + .07 * n + .003 * N - Y), X += D * (.34 + .025 * N - .07 * n - X), Z += D * (.995 + .005 * n - Z);
					}
				};
			}
			case `yagasuricloth`: {
				let t = require_materials.proceduralMaterialPresets.yagasuricloth, n = cachedNoise(128, 128, r ^ 85265), i = new Float64Array(t.cells * t.cells), a = 1 / (t.shaftX * t.shaftX), o = 1 / (t.shaftY * t.shaftY), s = 1 / (t.wingSpan * t.wingSpan), c = 1 / (t.wingThickness * t.wingThickness), l = 1 / t.shoulder, u = Math.PI * t.threads, d = t.wingCenter + t.wingSpan;
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) i[e * t.cells + n] = hash(n, e, r ^ 85267);
				return () => {
					let e = W * t.cells, r = G * t.cells, f = Math.floor(e), p = fract(e) - .5, m = (fract(r) - .5) * (f % 2 == 0 ? 1 : -1), h = Math.abs(p), g = smooth(clamp((1 - p * p * a - m * m * o) * l));
					if (g < 1 && h < d) {
						let e = h - t.wingCenter, n = 1 - e * e * s, r = n * n, i = m - t.slope * e;
						for (let e = -1; e <= 1; e++) {
							let n = i - e * t.spacing, a = r - n * n * c;
							if (a <= 0) continue;
							let o = smooth(clamp(a * l));
							if (g += (1 - g) * o, g === 1) break;
						}
					}
					let _ = Math.cos(u * W), v = Math.cos(u * G), y = _ * _, b = v * v, x = .5 + .5 * _ * v, S = y * (.35 + .25 * x) + b * (.35 + .25 * (1 - x)) - .3 * y * b, C = n(W, G);
					J = .06 + .025 * C + .015 * S, g > 0 && (J += g * (.82 + .05 * i[Math.floor(r) * t.cells + f])), Y = .12 + .22 * S + .004 * C, X += .025 * C + .02 * (1 - S), Z = .84 + .15 * S;
				};
			}
			case `hazelnutshells`: {
				let t = require_materials.proceduralMaterialPresets.hazelnutshells, i = new Float64Array(t.cells * t.cells * 6), a = 1 / (t.halfX * t.halfX), o = 1 / (t.halfY * t.halfY), s = 1 / t.shoulder, c = 1 / (t.scarRadiusX * t.scarRadiusX), l = 1 / (t.scarRadiusY * t.scarRadiusY), u = 1 / t.scarShoulder, d = cachedNoise(96, 12, r ^ 85009), f = cachedNoise(128, 128, r ^ 85011);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 85013);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 85015) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 85017) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 85019)), i[o + 5] = hash(a, e, r ^ 85021);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, p = (fract(e) - .5 - i[r + 2]) * i[r + 4], m = (fract(n) - .5 - i[r + 3]) * i[r + 4], h = p * i[r] + m * i[r + 1], g = m * i[r] - p * i[r + 1], _ = Math.max(0, 1 - g * g * o), v = (g < 0 ? _ * _ : _) - h * h * a, y = smooth(clamp(v * s));
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1 - y, y === 0) return;
					let b = g - t.scarY, x = smooth(clamp((1 - h * h * c - b * b * l) * u)), S = i[r + 5], C = 0, w = 0, T = 0, E = 0;
					if (x < 1) {
						let e = d(h + .5, g + .5);
						C = .4 + .15 * S + .07 * e, w = .33 + .18 * smooth(v) + .008 * e, T = t.roughness + .025 * e, E = .99;
					}
					if (x > 0) {
						let e = f(W, G);
						C += x * (.83 + .1 * S + .025 * e - C), w += x * (.24 + .003 * e - w), T += x * (.94 + .015 * e - T), E += x * (.9 - E);
					}
					J += y * (C - J), Y += y * (w - Y), X += y * (T - X), Z += y * (E - Z);
				};
			}
			case `ceramicfuses`: {
				let t = require_materials.proceduralMaterialPresets.ceramicfuses, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.core * t.core), o = 1 / (t.straightX + t.radius) ** 2, s = t.endStart * t.endStart, c = 1 / (t.endFull * t.endFull - s), l = t.collarRadius * t.collarRadius, u = 1 / (l - t.collarCore * t.collarCore), d = cachedNoise(128, 128, r ^ 84753);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 84755);
				return () => {
					let e = W * t.cells, r = G * t.cells, f = Math.floor(e), p = Math.floor(r), m = f + p & 1 ? 1 : -1, h = fract(e) - .5, g = fract(r) - .5, _ = (h + m * g) * Math.SQRT1_2, v = (g - m * h) * Math.SQRT1_2, y = Math.max(0, Math.abs(_) - t.straightX), b = Math.max(0, Math.abs(v) - t.straightY), x = smooth(clamp((i - y * y - b * b) * a));
					if (J = .015, Y = .025, X = .96, Z = .3, $ = 0, Q = 1 - x, x === 0) return;
					let S = d(W, G), C = n[p * t.cells + f], w = smooth(1 - _ * _ * o), T = smooth(clamp((v * v - s) * c)), E = .91 + .04 * C + .025 * S, D = .3 + .1 * w + .003 * S, O = t.roughness + .03 * S, k = .99;
					if (T > 0) {
						let e = Math.abs(v) - t.collarY, n = smooth(clamp((l - e * e) * u));
						E += T * (.65 + .12 * C + .025 * S - E), D += T * (.05 + .02 * n), O += T * (.22 + .025 * S - .02 * n - O), k += T * (.005 + .005 * n);
					}
					J += x * (E - J), Y += x * (D - Y), X += x * (O - X), Z += x * (k - Z), $ = x * T;
				};
			}
			case `chenilleyarn`: {
				let t = require_materials.proceduralMaterialPresets.chenilleyarn, n = new Float64Array(t.columns), i = new Float64Array(t.columns * t.rows * 5), a = t.coreRadius * t.coreRadius, o = 1 / (a - t.coreFull * t.coreFull), s = 1 / a, c = 1 / t.fiberRadiusY, l = 1 / t.fiberShoulder, u = cachedNoise(128, 256, r ^ 84499);
				for (let e = 0; e < t.columns; e++) {
					n[e] = hash(e, 0, r ^ 84497);
					for (let n = 0; n < t.rows; n++) {
						let a = (e * t.rows + n) * 5;
						i[a] = t.fiberJitterX * (2 * hash(e, n, r ^ 84501) - 1), i[a + 1] = t.fiberJitterY * (2 * hash(e, n, r ^ 84503) - 1), i[a + 2] = 1 / (t.fiberHalf + t.fiberVariation * hash(e, n, r ^ 84505)), i[a + 3] = t.fiberSlope * (2 * hash(e, n, r ^ 84507) - 1), i[a + 4] = hash(e, n, r ^ 84509);
					}
				}
				return () => {
					let e = W * t.columns, r = G * t.rows, d = Math.floor(e), f = Math.floor(r), p = (d * t.rows + f) * 5, m = fract(e) - .5, h = m - i[p], g = h * i[p + 2], _ = smooth(clamp((a - m * m) * o)), v = 0, y = 0;
					if (Math.abs(g) < 1) {
						y = 1 - g * g;
						let e = (fract(r) - .5 - i[p + 1] - i[p + 3] * h) * c;
						v = smooth(clamp((y * y - e * e) * l));
					}
					if (J = .015, Y = .025, X = .96, Z = .3, Q = (1 - _) * (1 - v), _ === 0 && v === 0) return;
					let b = u(W, G);
					if (_ > 0 && v < 1) {
						let e = smooth(1 - m * m * s);
						J += _ * (.52 + .14 * n[d] + .025 * b - J), Y += _ * (.34 + .12 * e + .003 * b - Y), X += _ * (t.roughness - .04 + .02 * b - X), Z += _ * (.98 - Z);
					}
					v > 0 && (J += v * (.78 + .12 * i[p + 4] + .025 * b - J), Y += v * (.48 + .05 * smooth(y) + .003 * b - Y), X += v * (t.roughness + .015 * b - X), Z += v * (.995 - Z));
				};
			}
			case `charoite`: {
				let t = require_materials.proceduralMaterialPresets.charoite, i = new Float64Array(t.inclusionCells * t.inclusionCells * 6), a = t.bandRadius * t.bandRadius, o = 1 / (a - t.bandCore * t.bandCore), s = t.fiberRadius * t.fiberRadius, c = 1 / (s - t.fiberCore * t.fiberCore), l = 1 / t.inclusionShoulder, u = cachedNoise(4, 4, r ^ 84241), d = cachedNoise(7, 5, r ^ 84243), f = cachedNoise(9, 9, r ^ 84245), p = cachedNoise(192, 192, r ^ 84247);
				for (let e = 0; e < t.inclusionCells; e++) for (let a = 0; a < t.inclusionCells; a++) {
					if (hash(a, e, r ^ 84257) >= t.inclusionChance) continue;
					let o = (e * t.inclusionCells + a) * 6, s = n * hash(a, e, r ^ 84259), c = t.inclusionRadiusX + t.inclusionVariationX * hash(a, e, r ^ 84265), l = t.inclusionRadiusY + t.inclusionVariationY * hash(a, e, r ^ 84267);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.inclusionJitter * (2 * hash(a, e, r ^ 84261) - 1), i[o + 3] = t.inclusionJitter * (2 * hash(a, e, r ^ 84263) - 1), i[o + 4] = 1 / (c * c), i[o + 5] = 1 / (l * l);
				}
				return () => {
					let e = W * t.inclusionCells, n = G * t.inclusionCells, r = (Math.floor(n) * t.inclusionCells + Math.floor(e)) * 6, m = 0;
					if (i[r + 4] > 0) {
						let t = fract(e) - .5 - i[r + 2], a = fract(n) - .5 - i[r + 3], o = t * i[r] + a * i[r + 1], s = a * i[r] - t * i[r + 1];
						m = smooth(clamp((1 - o * o * i[r + 4] - s * s * i[r + 5]) * l));
					}
					let h = p(W, G), g = .025 + .02 * h;
					if (J = g, m < 1) {
						let e = f(W, G), n = W * t.bands + t.warpA * (u(W, G) - .5) + t.warpB * (d(W, G) - .5), r = fract(n + .5) - .5, i = fract(t.fibers * n + t.fiberDrift * (e - .5) + .5) - .5, l = smooth(clamp((a - r * r) * o)), p = smooth(clamp((s - i * i) * c)), h = .28 + .26 * e + .13 * p + .25 * l;
						J = h + m * (g - h);
					}
					Y = .38 + .001 * h, X = t.roughness + .025 * h, Z = 1, Q = 0;
				};
			}
			case `binderclips`: {
				let t = require_materials.proceduralMaterialPresets.binderclips, n = new Float64Array(t.cells * t.cells), i = t.bodyHalfY * t.bodyHalfY, a = 1 / (i - t.bodyCoreY * t.bodyCoreY), o = 1 / t.bodyShoulderSquared, s = t.wireRadius * t.wireRadius, c = 1 / (s - t.wireCore * t.wireCore), l = 1 / s, u = (t.bendRadius + t.wireRadius) ** 2, d = (t.bendRadius - t.wireRadius) ** 2, f = t.lipRadius * t.lipRadius, p = 1 / (f - t.lipCore * t.lipCore), m = cachedNoise(128, 128, r ^ 83985);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 83987);
				return () => {
					let e = W * t.cells, r = G * t.cells, h = Math.floor(e), g = Math.floor(r), _ = h + g & 1 ? 1 : -1, v = fract(e) - .5, y = fract(r) - .5, b = (v + _ * y) * Math.SQRT1_2, x = (y - _ * v) * Math.SQRT1_2, S = smooth(clamp((i - x * x) * a)), C = 0;
					if (S > 0) {
						let e = t.bodyHalfX + t.bodyTaper * x;
						C = S * smooth(clamp((e * e - b * b) * o));
					}
					let w = 0, T = 0;
					if (C < 1) {
						let e = Math.abs(x), n = e - t.bendY;
						if (n > 0) {
							let e = b * b + n * n;
							if (e > d && e < u) {
								let n = Math.sqrt(e) - t.bendRadius;
								T = n * n, w = smooth(clamp((s - T) * c));
							}
						} else {
							let n = Math.abs(b) - t.bendRadius, r = Math.max(0, t.endY - e);
							T = n * n + r * r, w = smooth(clamp((s - T) * c));
						}
					}
					if (J = .015, Y = .025, X = .96, Z = .3, $ = 0, Q = (1 - C) * (1 - w), C === 0 && w === 0) return;
					let E = m(W, G), D = n[g * t.cells + h];
					if (w > 0) {
						let e = smooth(clamp(1 - T * l));
						J += w * (.84 + .09 * D + .025 * E - J), Y += w * (.32 + .07 * e + .003 * E - Y), X += w * (.22 + .025 * E - X), Z += w * (.98 - Z), $ = w;
					}
					if (C === 0) return;
					let O = Math.max(0, Math.abs(b) - t.lipStraight), k = x - t.lipY, A = smooth(clamp((f - O * O - k * k) * p));
					J += C * (.035 + .012 * D + .008 * E - J), Y += C * (.42 + .003 * E + .04 * A - Y), X += C * (t.roughness + .03 * E - .04 * A - X), Z += C * (.99 + .01 * A - Z), $ *= 1 - C;
				};
			}
			case `horsechestnutleaf`: {
				let t = require_materials.proceduralMaterialPresets.horsechestnutleaf, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.leaflets * 5), o = 1 / (t.halfWidth * t.halfWidth), s = 1 / t.shoulder, c = t.rootRadius * t.rootRadius, l = 1 / (c - t.rootCore * t.rootCore), u = t.petioleRadius * t.petioleRadius, d = 1 / (u - t.petioleCore * t.petioleCore), f = t.petioluleRadius * t.petioluleRadius, p = 1 / (f - t.petioluleCore * t.petioluleCore), m = t.veinRadius * t.veinRadius, h = 1 / (m - t.veinCore * t.veinCore), g = (1 - t.serration) * (1 - t.serration), _ = Math.max(t.tipLength * t.tipLength + t.halfWidth * t.halfWidth, (2 * t.petioleHalf + t.petioleRadius) ** 2), v = cachedNoise(128, 128, r ^ 83729);
				for (let e = 0; e < t.leaflets; e++) {
					let n = e * 5, r = e - (t.leaflets - 1) / 2, i = r * t.angleStep * Math.PI / 180, o = t.tipLength - t.tipStep * Math.abs(r), s = o - t.bladeBase;
					a[n] = Math.sin(i), a[n + 1] = -Math.cos(i), a[n + 2] = (o + t.bladeBase) / 2, a[n + 3] = 2 / s, a[n + 4] = t.teeth / s;
				}
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 83731);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 83733) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 83735) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 83737)), i[o + 5] = hash(a, e, r ^ 83739);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, y = (fract(e) - .5 - i[r + 2]) * i[r + 4], b = (fract(n) - .5 - i[r + 3]) * i[r + 4], x = y * i[r] + b * i[r + 1], S = b * i[r] - y * i[r + 1], C = x * x + S * S;
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1, C >= _) return;
					let w = Math.max(0, Math.abs(S - t.petioleHalf) - t.petioleHalf), T = smooth(clamp((c - C) * l)), E = smooth(clamp((u - x * x - w * w) * d));
					E += (1 - E) * T;
					let D = 0, O = 0;
					for (let e = 0; e < t.leaflets; e++) {
						let n = e * 5, r = x * a[n] + S * a[n + 1], i = S * a[n] - x * a[n + 1], c = Math.max(0, Math.abs(r - t.petioluleHalf) - t.petioluleHalf), l = smooth(clamp((f - i * i - c * c) * p));
						E += (1 - E) * l;
						let u = (r - a[n + 2]) * a[n + 3];
						if (Math.abs(u) >= 1) continue;
						let d = 1 - u * u, _ = d * d, v = i * i * o;
						if (_ <= v) continue;
						let y = 1;
						if (_ * g - v < t.shoulder) {
							let e = fract((r - t.bladeBase) * a[n + 4]) - .5, i = 1 - t.serration + t.serration * smooth(4 * e * e);
							y = smooth(clamp((_ * i * i - v) * s));
						}
						if (y === 0) continue;
						D += (1 - D) * y;
						let b = y * smooth(clamp((m - i * i) * h));
						O += (1 - O) * b;
					}
					let k = E + D - E * D;
					if (Q = 1 - k, k === 0) return;
					let A = v(W, G), j = i[r + 5];
					E > 0 && (J += E * (.35 + .08 * j + .025 * A - J), Y += E * (.26 + .003 * A - Y), X += E * (.83 + .025 * A - X), Z += E * (.975 - Z)), D > 0 && (J += D * (.5 + .15 * j + .03 * A + .15 * O - J), Y += D * (.34 + .003 * A + .075 * O - Y), X += D * (t.roughness + .025 * A - .035 * O - X), Z += D * (.985 + .01 * O - Z));
				};
			}
			case `blueprintpaper`: {
				let t = require_materials.proceduralMaterialPresets.blueprintpaper, n = t.minorRadius * t.minorRadius, i = 1 / (n - t.minorCore * t.minorCore), a = t.majorRadius * t.majorRadius, o = 1 / (a - t.majorCore * t.majorCore), s = t.frameOuter * t.frameOuter, c = 1 / (s - t.frameOuterCore * t.frameOuterCore), l = t.frameInner * t.frameInner, u = 1 / (l - t.frameInnerCore * t.frameInnerCore), d = t.circleOuter * t.circleOuter, f = 1 / (d - t.circleOuterCore * t.circleOuterCore), p = t.circleInner * t.circleInner, m = 1 / (p - t.circleInnerCore * t.circleInnerCore), h = t.strokeRadius * t.strokeRadius, g = 1 / (h - t.strokeCore * t.strokeCore), _ = 1 / t.axisFade, v = t.cells * t.subdivisions, y = Math.max(t.frameX + t.frameOuter, t.axisX, t.dimensionHalf + t.strokeRadius), b = Math.max(t.frameY + t.frameOuter, t.axisY, Math.abs(t.dimensionY) + t.dimensionTick + t.strokeRadius), x = cachedNoise(8, 8, r ^ 83473), S = cachedNoise(192, 192, r ^ 83475);
				return () => {
					let e = W * t.cells, r = G * t.cells, C = fract(e) - .5, w = fract(r) - .5, T = Math.abs(C), E = Math.abs(w), D = fract(W * v + .5) - .5, O = fract(G * v + .5) - .5, k = fract(e + .5) - .5, A = fract(r + .5) - .5, j = smooth(clamp((n - D * D) * i)), M = smooth(clamp((n - O * O) * i)), N = smooth(clamp((a - k * k) * o)), P = smooth(clamp((a - A * A) * o)), F = j + M - j * M, I = N + P - N * P, L = 0;
					if (T < y && E < b) {
						let e = Math.max(0, T - t.frameX), n = Math.max(0, E - t.frameY), r = e * e + n * n;
						if (L = smooth(clamp((s - r) * c)) - smooth(clamp((l - r) * u)), L < 1) {
							let e = C * C + w * w, t = smooth(clamp((d - e) * f)) - smooth(clamp((p - e) * m));
							L += (1 - L) * t;
						}
						if (L < 1) {
							let e = smooth(clamp((h - C * C) * g)), n = smooth(clamp((h - w * w) * g)) * smooth(clamp((t.axisX - T) * _)), r = e * smooth(clamp((t.axisY - E) * _));
							L += (1 - L) * (n + r - n * r);
						}
						if (L < 1) {
							let e = w - t.dimensionY, n = Math.max(0, T - t.dimensionHalf), r = T - t.dimensionHalf, i = Math.max(0, Math.abs(e) - t.dimensionTick), a = smooth(clamp((h - n * n - e * e) * g)), o = smooth(clamp((h - r * r - i * i) * g));
							L += (1 - L) * (a + o - a * o);
						}
					}
					let R = S(W, G);
					J = .055 + .025 * x(W, G) + .01 * R, J += F * (.24 + .02 * R - J), J += I * (.36 + .02 * R - J), J += L * (.94 + .02 * R - J), Y = .42 + .001 * R, X = t.roughness + .015 * R, Z = 1, Q = 0;
				};
			}
			case `lentilseeds`: {
				let t = require_materials.proceduralMaterialPresets.lentilseeds, i = new Float64Array(t.cells * t.cells * 6), a = 1 / (t.halfX * t.halfX), o = 1 / (t.halfY * t.halfY), s = 1 / t.shoulder, c = t.hilumRadius * t.hilumRadius, l = 1 / (c - t.hilumCore * t.hilumCore), u = cachedNoise(128, 128, r ^ 83217);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 83219);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 83221) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 83223) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 83225)), i[o + 5] = hash(a, e, r ^ 83227);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, d = (fract(e) - .5 - i[r + 2]) * i[r + 4], f = (fract(n) - .5 - i[r + 3]) * i[r + 4], p = d * i[r] + f * i[r + 1], m = f * i[r] - d * i[r + 1], h = 1 - p * p * a - m * m * o, g = smooth(clamp(h * s));
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1 - g, g === 0) return;
					let _ = p - t.hilumX, v = Math.max(0, Math.abs(m) - t.hilumStraight), y = smooth(clamp((c - _ * _ - v * v) * l)), b = u(W, G);
					J += g * (.54 + .18 * i[r + 5] + .04 * b - .23 * y - J), Y += g * (.32 + .26 * smooth(clamp(h)) + .003 * b - .12 * y - Y), X += g * (t.roughness + .03 * b + .04 * y - X), Z += g * (.99 - .05 * y - Z);
				};
			}
			case `openendspanners`: {
				let t = require_materials.proceduralMaterialPresets.openendspanners, n = new Float64Array(t.cells * t.cells), i = t.topRadius * t.topRadius, a = 1 / (i - t.topCore * t.topCore), o = t.lowerRadius * t.lowerRadius, s = 1 / (o - t.lowerCore * t.lowerCore), c = t.topCutRadius * t.topCutRadius, l = 1 / (c - t.topCutCore * t.topCutCore), u = t.lowerCutRadius * t.lowerCutRadius, d = 1 / (u - t.lowerCutCore * t.lowerCutCore), f = t.shaftRadius * t.shaftRadius, p = 1 / (f - t.shaftCore * t.shaftCore), m = cachedNoise(128, 128, r ^ 82961);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 82963);
				return () => {
					let e = W * t.cells, r = G * t.cells, h = Math.floor(e), g = Math.floor(r), _ = h + g & 1 ? 1 : -1, v = fract(e) - .5, y = fract(r) - .5, b = (v + _ * y) * Math.SQRT1_2, x = (y - _ * v) * Math.SQRT1_2, S = x - t.topY, C = x - t.lowerY, w = Math.max(0, Math.abs(x) - t.shaftStraight), T = smooth(clamp((f - b * b - w * w) * p)), E = smooth(clamp((i - b * b - S * S) * a)), D = smooth(clamp((o - b * b - C * C) * s));
					if (E > 0) {
						let e = Math.max(0, x - t.topCutY);
						E *= 1 - smooth(clamp((c - b * b - e * e) * l));
					}
					if (D > 0) {
						let e = Math.max(0, t.lowerCutY - x);
						D *= 1 - smooth(clamp((u - b * b - e * e) * d));
					}
					let O = E + D, k = (1 - T) * (1 - O);
					if (J = .015, Y = .025, X = .96, Z = .3, Q = k, $ = 1 - k, k === 1) return;
					let A = m(W, G), j = n[g * t.cells + h];
					T > 0 && (J += T * (.72 + .1 * j + .025 * A - J), Y += T * (.34 + .003 * A - Y), X += T * (t.roughness + .025 * A - X), Z += T * (.98 - Z)), O > 0 && (J += O * (.87 + .07 * j + .025 * A - J), Y += O * (.42 + .003 * A - Y), X += O * (.28 + .025 * A - X), Z += O * (.99 - Z));
				};
			}
			case `azuritemalachite`: {
				let t = require_materials.proceduralMaterialPresets.azuritemalachite, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.globules * 2), o = new Float64Array(t.rings * 4), s = t.radius * t.radius, c = 1 / (s - t.core * t.core), l = (t.firstRing + (t.rings - 1) * t.ringPitch + t.ringHalfWidth) ** 2, u = cachedNoise(8, 8, r ^ 82705), d = cachedNoise(192, 192, r ^ 82717);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 82707);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 82709) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 82711) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 82713)), i[o + 5] = hash(a, e, r ^ 82715);
				}
				for (let e = 0; e < t.globules; e++) {
					let r = n * e / t.globules;
					a[e * 2] = t.clusterRadius * Math.cos(r), a[e * 2 + 1] = t.clusterRadius * Math.sin(r);
				}
				for (let e = 0; e < t.rings; e++) {
					let n = t.firstRing + e * t.ringPitch, r = (n - t.ringHalfWidth) ** 2, i = (n + t.ringHalfWidth) ** 2;
					o[e * 4] = r, o[e * 4 + 1] = 1 / ((n - t.ringCore) ** 2 - r), o[e * 4 + 2] = i, o[e * 4 + 3] = 1 / (i - (n + t.ringCore) ** 2);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, f = (fract(e) - .5 - i[r + 2]) * i[r + 4], p = (fract(n) - .5 - i[r + 3]) * i[r + 4], m = f * i[r] + p * i[r + 1], h = p * i[r] - f * i[r + 1], g = 1, _ = 1;
					for (let e = 0; e < a.length; e += 2) {
						let t = m - a[e], n = h - a[e + 1], r = t * t + n * n;
						if (g > 0 && (g *= 1 - smooth(clamp((s - r) * c))), _ > 0 && r < l) for (let e = 0; e < o.length; e += 4) _ *= 1 - smooth(clamp((r - o[e]) * o[e + 1])) * smooth(clamp((o[e + 2] - r) * o[e + 3]));
					}
					let v = d(W, G);
					if (g === 1) J = .84 + .1 * u(W, G) + .02 * v;
					else {
						let e = .045 + .035 * i[r + 5] + .02 * v + .14 * (1 - _);
						J = g === 0 ? e : e + g * (.84 + .1 * u(W, G) + .02 * v - e);
					}
					Y = .38 + .001 * v, X = t.roughness + .02 * v, Z = 1;
				};
			}
			case `grosgrainribbons`: {
				let t = require_materials.proceduralMaterialPresets.grosgrainribbons, n = new Float64Array(t.columns), i = t.radius * t.radius, a = 1 / (i - t.core * t.core), o = t.weftRadius * t.weftRadius, s = 1 / (o - t.weftCore * t.weftCore), c = t.edgeRadius * t.edgeRadius, l = 1 / (c - t.edgeCore * t.edgeCore), u = 1 / t.edgePitch, d = cachedNoise(96, 256, r ^ 82449);
				for (let e = 0; e < t.columns; e++) n[e] = hash(e, 0, r ^ 82451);
				return () => {
					let e = W * t.columns, r = Math.floor(e), f = Math.abs(fract(e) - .5), p = smooth(clamp((i - f * f) * a));
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1 - p, p === 0) return;
					let m = fract(G * t.weftRows) - .5, h = smooth(clamp((o - m * m) * s)), g = Math.max(0, Math.min(t.edgeCount - 1, Math.round((f - t.edgeFirst) * u))), _ = f - t.edgeFirst - g * t.edgePitch, v = smooth(clamp((c - _ * _) * l)), y = d(W, G);
					J += p * (.28 + .1 * n[r] + .12 * h + .025 * y + .16 * v - J), Y += p * (.3 + .08 * h + .003 * y + .12 * v - Y), X += p * (t.roughness - .04 * h - .04 * v + .025 * y - X), Z += p * (.97 + .02 * h + .01 * v - Z);
				};
			}
			case `oatflakes`: {
				let t = require_materials.proceduralMaterialPresets.oatflakes, i = new Float64Array(t.cells * t.cells * 6), a = new Float64Array(t.fiberPairs * 2), o = 1 / (t.halfLength * t.halfLength), s = 1 / (t.halfWidth * t.halfWidth), c = 1 / t.shoulder, l = t.rimVariation * .5, u = 1 / t.creaseHalfLength, d = 1 / t.creaseHalfWidth, f = 1 / t.fiberHalfWidth, p = 1 / t.fiberPitch, m = 1 / t.detailShoulder, h = cachedNoise(64, 64, r ^ 81937), g = cachedNoise(192, 192, r ^ 81939);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = n * hash(a, e, r ^ 81941);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 81943) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 81945) - 1), i[o + 4] = 1 / (t.scale + t.scaleVariation * hash(a, e, r ^ 81947)), i[o + 5] = hash(a, e, r ^ 81949);
				}
				for (let e = 0; e < t.fiberPairs; e++) a[e * 2] = t.fiberFirst + e * t.fiberPitch, a[e * 2 + 1] = 1 / (t.fiberHalfLength - e * t.fiberShrink);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, _ = (fract(e) - .5 - i[r + 2]) * i[r + 4], v = (fract(n) - .5 - i[r + 3]) * i[r + 4], y = _ * i[r] + v * i[r + 1], b = v * i[r] - _ * i[r + 1], x = 1 - y * y * o - b * b * s;
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1, x <= -l) return;
					let S = x >= t.shoulder + l ? 1 : smooth(clamp((x + t.rimVariation * (h(W, G) - .5)) * c));
					if (Q = 1 - S, S === 0) return;
					let C = 0, w = 0, T = y * u;
					if (Math.abs(T) < 1) {
						let e = b * d, t = 1 - T * T;
						C = smooth(clamp((t * t - e * e) * m));
					}
					let E = Math.max(0, Math.min(t.fiberPairs - 1, Math.round((Math.abs(b) - t.fiberFirst) * p))) * 2, D = (Math.abs(b) - a[E]) * f;
					if (Math.abs(D) < 1) {
						let e = y * a[E + 1];
						if (Math.abs(e) < 1) {
							let t = 1 - e * e;
							w = smooth(clamp((t * t - D * D) * m));
						}
					}
					let O = g(W, G), k = i[r + 5];
					J += S * (.76 + .1 * k + .025 * O + .1 * w - .22 * C - J), Y += S * (.28 + .045 * smooth(clamp(x * 1.25)) + .003 * O + .015 * w - .15 * C - Y), X += S * (t.roughness + .025 * O + .03 * C - X), Z += S * (.98 - .1 * C - Z);
				};
			}
			case `bluepushpins`: {
				let t = require_materials.proceduralMaterialPresets.bluepushpins, n = new Float64Array(t.cells * t.cells), i = t.flangeRadius * t.flangeRadius, a = 1 / (i - t.flangeCore * t.flangeCore), o = t.neckRadius * t.neckRadius, s = 1 / (o - t.neckCore * t.neckCore), c = 1 / t.needleHalfLength, l = 1 / t.needleHalfWidth, u = 1 / t.needleShoulder, d = cachedNoise(128, 128, r ^ 81681);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 81683);
				return () => {
					let e = W * t.cells, r = G * t.cells, f = Math.floor(e), p = Math.floor(r), m = f + p & 1 ? 1 : -1, h = fract(e) - .5, g = fract(r) - .5, _ = (h + m * g) * Math.SQRT1_2, v = (g - m * h) * Math.SQRT1_2, y = Math.max(0, Math.abs(_) - t.flangeStraightX), b = Math.max(0, Math.abs(v - t.topY) - t.flangeStraightY), x = Math.max(0, Math.abs(v - t.baseY) - t.flangeStraightY), S = Math.max(0, Math.abs(v - t.neckY) - t.neckStraight), C = smooth(clamp((i - y * y - b * b) * a)), w = smooth(clamp((i - y * y - x * x) * a)), T = smooth(clamp((o - _ * _ - S * S) * s)), E = (1 - C) * (1 - w) * (1 - T), D = 0;
					if (E > 0) {
						let e = (v - t.needleCenter) * c;
						if (Math.abs(e) < 1) {
							let t = _ * l, n = 1 - e * e;
							D = smooth(clamp((n * n - t * t) * u));
						}
					}
					if (J = .015, Y = .025, X = .96, Z = .3, $ = 0, Q = E * (1 - D), E === 1 && D === 0) return;
					let O = d(W, G), k = n[p * t.cells + f];
					J += D * (.95 + .025 * O - J), Y += D * (.28 + .002 * O - Y), X += D * (.23 + .025 * O - X), Z += D * (.97 - Z), $ = D, E !== 1 && (J += T * (.09 + .06 * k + .02 * O - J), Y += T * (.46 + .004 * O - Y), X += T * (.48 + .03 * O - X), Z += T * (.99 - Z), $ *= 1 - T, J += w * (.18 + .07 * k + .025 * O - J), Y += w * (.56 + .004 * O - Y), X += w * (t.roughness + .03 * O - X), Z += w * (.99 - Z), $ *= 1 - w, J += C * (.24 + .07 * k + .025 * O - J), Y += C * (.64 + .004 * O - Y), X += C * (t.roughness + .03 * O - X), Z += C * (.99 - Z), $ *= 1 - C);
				};
			}
			case `carrotcuts`: {
				let t = require_materials.proceduralMaterialPresets.carrotcuts, n = new Float64Array(t.cells * t.cells * 6), i = new Float64Array(t.rays * 2), a = t.radius * t.radius, o = 1 / (a - t.core * t.core), s = t.fleshRadius * t.fleshRadius, c = 1 / (s - t.fleshCore * t.fleshCore), l = t.pithRadius * t.pithRadius, u = 1 / (l - t.pithCore * t.pithCore), d = 1 / t.rayHalfLength, f = 1 / t.rayHalfWidth, p = 1 / t.rayShoulder, m = cachedNoise(128, 128, r ^ 81425);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 6, o = 2 * Math.PI * hash(i, e, r ^ 81427);
					n[a] = Math.cos(o), n[a + 1] = Math.sin(o), n[a + 2] = t.jitter * (2 * hash(i, e, r ^ 81429) - 1), n[a + 3] = t.jitter * (2 * hash(i, e, r ^ 81431) - 1), n[a + 4] = 1 / (t.scale + t.scaleVariation * hash(i, e, r ^ 81433)), n[a + 5] = hash(i, e, r ^ 81435);
				}
				for (let e = 0; e < t.rays; e++) {
					let n = 2 * Math.PI * e / t.rays;
					i[e * 2] = Math.cos(n), i[e * 2 + 1] = Math.sin(n);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, h = (Math.floor(r) * t.cells + Math.floor(e)) * 6, g = (fract(e) - .5 - n[h + 2]) * n[h + 4], _ = (fract(r) - .5 - n[h + 3]) * n[h + 4], v = g * n[h] + _ * n[h + 1], y = -g * n[h + 1] + _ * n[h], b = v * v + y * y, x = smooth(clamp((a - b) * o));
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1 - x, x === 0) return;
					let S = m(W, G), C = n[h + 5], w = smooth(clamp((s - b) * c));
					if (J += x * (.3 + .06 * C + .02 * S - J), Y += x * (.25 + .003 * S - Y), X += x * (.81 + .02 * S - X), Z += x * (.98 - Z), w === 0) return;
					let T = smooth(clamp((l - b) * u)), E = 1;
					if (T < 1) for (let e = 0; e < i.length; e += 2) {
						let n = (v * i[e] + y * i[e + 1] - t.rayCenter) * d;
						if (Math.abs(n) >= 1) continue;
						let r = (-v * i[e + 1] + y * i[e]) * f, a = 1 - n * n;
						E *= 1 - smooth(clamp((a * a - r * r) * p));
					}
					let D = .54 + .06 * C + .025 * S, O = D + (1 - E) * (.74 + .06 * C + .025 * S - D), k = O + T * (.82 + .06 * C + .025 * S - O);
					J += w * (k - J), Y += w * (.48 + .003 * S - Y), X += w * (t.roughness + .025 * S - X), Z += w * (.99 - Z);
				};
			}
			case `brasspadlocks`: {
				let t = require_materials.proceduralMaterialPresets.brasspadlocks, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.core * t.core), o = t.shackleRadius * t.shackleRadius, s = 1 / (o - t.shackleCore * t.shackleCore), c = 1 / o, l = t.keyRadius * t.keyRadius, u = 1 / (l - t.keyCore * t.keyCore), d = t.stemRadius * t.stemRadius, f = 1 / (d - t.stemCore * t.stemCore), p = cachedNoise(128, 128, r ^ 81169);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 81171);
				return () => {
					let e = W * t.cells, r = G * t.cells, m = Math.floor(e), h = Math.floor(r), g = m + h & 1 ? 1 : -1, _ = fract(e) - .5, v = fract(r) - .5, y = (_ + g * v) * Math.SQRT1_2, b = (v - g * _) * Math.SQRT1_2, x = Math.max(0, Math.abs(y) - t.straightX), S = Math.max(0, Math.abs(b - t.bodyY) - t.straightY), C = smooth(clamp((i - x * x - S * S) * a)), w = 0, T = 0;
					if (C < 1) {
						let e = b - t.bendY;
						if (e < 0) {
							let n = Math.sqrt(y * y + e * e) - t.bendRadius;
							w = n * n;
						} else {
							let e = Math.abs(y) - t.bendRadius, n = Math.max(0, b - t.endY);
							w = e * e + n * n;
						}
						T = smooth(clamp((o - w) * s));
					}
					if (J = .015, Y = .025, X = .96, Z = .3, $ = 0, Q = (1 - C) * (1 - T), C === 0 && T === 0) return;
					let E = p(W, G), D = n[h * t.cells + m];
					if (T > 0) {
						let e = smooth(clamp(1 - w * c));
						J += T * (.91 + .02 * D + .02 * E - J), Y += T * (.32 + .13 * e + .003 * E - Y), X += T * (.22 + .025 * E - X), Z += T * (.98 - Z), $ = T;
					}
					if (C === 0) return;
					J += C * (.62 + .08 * D + .03 * E - J), Y += C * (.56 + .004 * E - Y), X += C * (t.roughness + .04 * E - X), Z += C * (.99 - Z), $ += C * (1 - $);
					let O = b - t.keyY, k = Math.max(0, Math.abs(b - t.stemY) - t.stemStraight), A = smooth(clamp((l - y * y - O * O) * u)), j = smooth(clamp((d - y * y - k * k) * f)), M = 1 - (1 - A) * (1 - j);
					J += M * (.025 + .01 * E - J), Y += M * (.12 + .002 * E - Y), X += M * (.92 - X), Z += M * (.35 - Z), $ *= 1 - M;
				};
			}
			case `graphicgranite`: {
				let t = require_materials.proceduralMaterialPresets.graphicgranite, i = t.clusters * t.arms * 6, a = new Float64Array(t.cells * t.cells * i), o = new Float64Array(t.cells * t.cells), s = 1 / t.shoulder, c = cachedNoise(8, 8, r ^ 80913), l = cachedNoise(192, 192, r ^ 80915);
				for (let e = 0; e < t.cells; e++) for (let s = 0; s < t.cells; s++) {
					let c = e * t.cells + s;
					o[c] = hash(s, e, r ^ 80917);
					for (let e = 0; e < t.clusters; e++) {
						let o = c * t.clusters + e, s = n * hash(o, 0, r ^ 80919), l = t.roots[e * 2] + t.jitter * (2 * hash(o, 1, r ^ 80921) - 1), u = t.roots[e * 2 + 1] + t.jitter * (2 * hash(o, 2, r ^ 80923) - 1), d = t.angleGap + t.angleVariation * hash(o, 3, r ^ 80925);
						for (let n = 0; n < t.arms; n++) {
							let f = c * i + (e * t.arms + n) * 6, p = s + n * d, m = Math.cos(p), h = Math.sin(p);
							a[f] = l - t.strokeOffset * m, a[f + 1] = u - t.strokeOffset * h, a[f + 2] = m, a[f + 3] = h, a[f + 4] = 1 / (t.halfLength + t.lengthVariation * hash(o, n, r ^ 80927)), a[f + 5] = 1 / (t.halfWidth + t.widthVariation * hash(o, n, r ^ 80929));
						}
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(n) * t.cells + Math.floor(e), u = r * i, d = fract(e) - .5, f = fract(n) - .5, p = 1;
					for (let e = u; e < u + i; e += 6) {
						let t = d - a[e], n = f - a[e + 1], r = (t * a[e + 2] + n * a[e + 3]) * a[e + 4];
						if (r <= -1 || r >= 1) continue;
						let i = (n * a[e + 2] - t * a[e + 3]) * a[e + 5], o = 1 - r * r, c = smooth(clamp((o * o - i * i) * s));
						if (p *= 1 - c, p === 0) break;
					}
					let m = l(W, G);
					J = .08 + .035 * o[r] + .025 * m, p > 0 && (J += p * (.84 + .1 * c(W, G) + .025 * m - J)), Y = .38 + .001 * m, X = t.roughness + .02 * m, Z = 1;
				};
			}
			case `siliconepastrybrushes`: {
				let t = require_materials.proceduralMaterialPresets.siliconepastrybrushes, n = new Float64Array(t.cells * t.cells), i = t.handleRadius * t.handleRadius, a = 1 / (i - t.handleCore * t.handleCore), o = t.headRadius * t.headRadius, s = 1 / (o - t.headCore * t.headCore), c = t.prongRadius * t.prongRadius, l = 1 / (c - t.prongCore * t.prongCore), u = t.pitRadius * t.pitRadius, d = 1 / (u - t.pitCore * t.pitCore), f = 1 / t.pitch, p = (t.prongs - 1) / 2, m = cachedNoise(128, 128, r ^ 80657);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 80659);
				return () => {
					let e = W * t.cells, r = G * t.cells, h = Math.floor(e), g = Math.floor(r), _ = h + g & 1 ? 1 : -1, v = fract(e) - .5, y = fract(r) - .5, b = (v + _ * y) * Math.SQRT1_2, x = (y - _ * v) * Math.SQRT1_2, S = Math.max(0, Math.abs(x - t.handleY) - t.handleStraight), C = smooth(clamp((i - b * b - S * S) * a)), w = Math.max(0, Math.abs(b) - t.headStraightX), T = Math.max(0, Math.abs(x - t.headY) - t.headStraightY), E = smooth(clamp((o - w * w - T * T) * s)), D = b - Math.max(-p, Math.min(p, Math.round(b * f))) * t.pitch, O = Math.max(0, Math.abs(x - t.prongY) - t.prongStraight), k = smooth(clamp((c - D * D - O * O) * l));
					if (J = .015, Y = .025, X = .96, Z = .3, Q = (1 - C) * (1 - E) * (1 - k), C === 0 && E === 0 && k === 0) return;
					let A = m(W, G), j = n[g * t.cells + h];
					if (k > 0 && (J += k * (.68 + .06 * j + .02 * A - J), Y += k * (.32 + .003 * A - Y), X += k * (t.roughness + .025 * A - X), Z += k * (.98 - Z)), C > 0) {
						let e = x - t.pitY, n = smooth(clamp((u - b * b - e * e) * d));
						J += C * (.48 + .06 * j + .02 * A - .08 * n - J), Y += C * (.45 + .004 * A - .12 * n - Y), X += C * (.79 + .03 * A - X), Z += C * (.99 - .08 * n - Z);
					}
					E !== 0 && (J += E * (.62 + .07 * j + .02 * A - J), Y += E * (.4 + .004 * A - Y), X += E * (.77 + .025 * A - X), Z += E * (.99 - Z));
				};
			}
			case `paisleybrocade`: {
				let t = require_materials.proceduralMaterialPresets.paisleybrocade, i = new Float64Array(t.cells * t.cells * 3), a = new Float64Array(t.dots * 2), o = 1 / t.halfHeight, s = 1 / t.shoulder, c = t.dotRadius * t.dotRadius, l = 1 / (c - t.dotCore * t.dotCore), u = cachedNoise(192, 192, r ^ 80401), d = cachedNoise(128, 8, r ^ 80403), f = cachedNoise(8, 128, r ^ 80405);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 3, s = n * hash(a, e, r ^ 80407);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = hash(a, e, r ^ 80409);
				}
				for (let e = 0; e < t.dots; e++) {
					let n = t.dotStart + e * t.dotStep;
					a[e * 2] = t.bend * ((1 - n) * (1 - n)) * .25, a[e * 2 + 1] = n * t.halfHeight;
				}
				return () => {
					let e = u(W, G), n = (d(W, G) + f(W, G)) * .5;
					J = .06 + .04 * n + .025 * e, Y = .32 + .005 * n, X = t.roughness + .03 * n, Z = .96;
					let r = W * t.cells, p = G * t.cells, m = (Math.floor(p) * t.cells + Math.floor(r)) * 3, h = fract(r) - .5, g = fract(p) - .5, _ = h * i[m] + g * i[m + 1], v = g * i[m] - h * i[m + 1], y = v * o;
					if (y <= -1 || y >= 1) return;
					let b = t.bend * (1 - y) * (1 - y) * .25, x = t.halfWidth * (t.widthBias + t.widthSlope * y), S = (_ - b) / x, C = 1 - y * y, w = C * C - S * S, T = smooth(clamp(w * s));
					if (T === 0) return;
					let E = smooth(clamp((w - t.inset) * s)), D = T - E;
					if (E > 0) {
						let e = 1;
						for (let t = 0; t < a.length; t += 2) {
							let n = _ - a[t], r = v - a[t + 1];
							e *= 1 - smooth(clamp((c - n * n - r * r) * l));
						}
						D = 1 - (1 - D) * e;
					}
					D !== 0 && (J += D * (.82 + .1 * i[m + 2] + .025 * e - J), Y += D * (.52 + .007 * n - Y), X += D * (.73 + .035 * n - X), Z += D * (.99 - Z));
				};
			}
			case `tactileswitches`: {
				let t = require_materials.proceduralMaterialPresets.tactileswitches, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.core * t.core), o = t.plateRadius * t.plateRadius, s = 1 / (o - t.plateCore * t.plateCore), c = t.pinRadius * t.pinRadius, l = 1 / (c - t.pinCore * t.pinCore), u = t.plungerRadius * t.plungerRadius, d = 1 / (u - t.plungerCore * t.plungerCore), f = cachedNoise(128, 128, r ^ 80145);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 80147);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = Math.floor(e), m = Math.floor(r), h = p + m & 1 ? 1 : -1, g = fract(e) - .5, _ = fract(r) - .5, v = (g + h * _) * Math.SQRT1_2, y = (_ - h * g) * Math.SQRT1_2, b = Math.max(0, Math.abs(v) - t.straight), x = Math.max(0, Math.abs(y) - t.straight), S = smooth(clamp((i - b * b - x * x) * a)), C = Math.max(0, Math.abs(Math.abs(v) - t.pinX) - t.pinStraight), w = Math.abs(y) - t.pinY, T = smooth(clamp((c - C * C - w * w) * l));
					if (J = .015, Y = .025, X = .96, Z = .3, $ = 0, Q = (1 - S) * (1 - T), S === 0 && T === 0) return;
					let E = f(W, G), D = n[m * t.cells + p];
					if (J += T * (.84 + .06 * D + .02 * E - J), Y += T * (.23 + .002 * E - Y), X += T * (.26 + .02 * E - X), Z += T * (.97 - Z), $ = T, S === 0) return;
					J += S * (.13 + .03 * D + .02 * E - J), Y += S * (.34 + .004 * E - Y), X += S * (t.roughness + .03 * E - X), Z += S * (.98 - Z), $ *= 1 - S;
					let O = Math.max(0, Math.abs(v) - t.plateStraight), k = Math.max(0, Math.abs(y) - t.plateStraight), A = smooth(clamp((o - O * O - k * k) * s));
					if (A === 0) return;
					let j = smooth(clamp((u - v * v - y * y) * d));
					J += A * (.88 + .06 * D + .02 * E - J), Y += A * (.41 + .003 * E - Y), X += A * (.29 + .02 * E - X), Z += A * (.99 - Z), $ += A * (1 - $), J += j * (.075 + .02 * D + .015 * E - J), Y += j * (.65 + .004 * E - Y), X += j * (.72 + .025 * E - X), Z += j * (.99 - Z), $ *= 1 - j;
				};
			}
			case `celerycuts`: {
				let t = require_materials.proceduralMaterialPresets.celerycuts, i = new Float64Array(t.cells * t.cells * 3), a = new Float64Array(t.vessels * 2), o = 1 / (t.outerX * t.outerX), s = 1 / (t.outerY * t.outerY), c = 1 / (t.notchX * t.notchX), l = 1 / (t.notchY * t.notchY), u = 1 / (t.fleshX * t.fleshX), d = 1 / (t.fleshY * t.fleshY), f = 1 / (t.fleshNotchX * t.fleshNotchX), p = 1 / (t.fleshNotchY * t.fleshNotchY), m = 1 / t.outerShoulder, h = 1 / t.notchShoulder, g = 1 / t.fleshShoulder, _ = 1 / t.fleshNotchShoulder, v = t.vesselRadius * t.vesselRadius, y = 1 / (v - t.vesselCore * t.vesselCore), b = cachedNoise(128, 128, r ^ 79889);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 3, s = n * hash(a, e, r ^ 79891);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = hash(a, e, r ^ 79893);
				}
				for (let e = 0; e < t.vessels; e++) {
					let n = t.vesselStart + e * t.vesselStep;
					a[e * 2] = t.vesselX * Math.cos(n), a[e * 2 + 1] = t.vesselOffset + t.vesselY * Math.sin(n);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 3, x = fract(e) - .5, S = fract(n) - .5, C = x * i[r] + S * i[r + 1], w = S * i[r] - x * i[r + 1], T = C * C, E = w * w, D = (w + t.notchOffset) ** 2, O = smooth(clamp((1 - T * o - E * s) * m)) * (1 - smooth(clamp((1 - T * c - D * l) * h)));
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1 - O, O === 0) return;
					let k = b(W, G), A = i[r + 2], j = smooth(clamp((1 - T * u - E * d) * g)) * (1 - smooth(clamp((1 - T * f - D * p) * _)));
					if (J += O * (.4 + .08 * A + .02 * k - J), Y += O * (.25 + .003 * k - Y), X += O * (.82 + .025 * k - X), Z += O * (.98 - Z), j === 0) return;
					let M = 1;
					for (let e = 0; e < a.length; e += 2) {
						let t = C - a[e], n = w - a[e + 1];
						M *= 1 - smooth(clamp((v - t * t - n * n) * y));
					}
					let N = 1 - M, P = .82 + .08 * A + .02 * k;
					J += j * (P + N * (.22 + .04 * A + .025 * k - P) - J), Y += j * (.47 + .003 * k - .055 * N - Y), X += j * (t.roughness + .02 * k - .02 * N - X), Z += j * (.99 - .06 * N - Z);
				};
			}
			case `flatflexcables`: {
				let t = require_materials.proceduralMaterialPresets.flatflexcables, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.core * t.core), o = t.contactRadius * t.contactRadius, s = 1 / (o - t.contactCore * t.contactCore), c = 1 / t.pitch, l = 1 / (t.traceRadius * t.traceRadius), u = 1 / t.traceShoulder, d = (t.contacts - 1) / 2, f = cachedNoise(128, 128, r ^ 79633);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 79635);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = Math.floor(e), m = Math.floor(r), h = p + m & 1 ? 1 : -1, g = fract(e) - .5, _ = fract(r) - .5, v = (g + h * _) * Math.SQRT1_2, y = (_ - h * g) * Math.SQRT1_2, b = Math.max(0, Math.abs(v) - t.straightX), x = Math.max(0, Math.abs(y) - t.straightY), S = smooth(clamp((i - b * b - x * x) * a));
					if (J = .015, Y = .025, X = .96, Z = .3, $ = 0, Q = 1 - S, S === 0) return;
					let C = v - (Math.max(0, Math.min(t.contacts - 1, Math.round(v * c + d))) - d) * t.pitch, w = Math.max(0, Math.abs(y - t.contactY) - t.contactStraight), T = smooth(clamp((o - C * C - w * w) * s)), E = smooth(clamp(1 - C * C * l)) * smooth(clamp((y - t.traceStart) * u)) * smooth(clamp((t.traceEnd - y) * u)), D = f(W, G), O = n[m * t.cells + p];
					J += S * (.45 + .06 * O + .02 * D + .06 * E - J), Y += S * (.32 + .003 * D + .008 * E - Y), X += S * (t.roughness + .03 * D - .02 * E - X), Z += S * (.99 - Z), J += T * (.92 + .025 * D - J), Y += T * (.29 + .002 * D - Y), X += T * (.23 + .02 * D - X), $ = T;
				};
			}
			case `chioggiabeetcuts`: {
				let t = require_materials.proceduralMaterialPresets.chioggiabeetcuts, n = new Float64Array(t.cells * t.cells * 4), i = new Float64Array(t.rings * 4), a = t.radius * t.radius, o = 1 / (a - t.core * t.core), s = t.fleshRadius * t.fleshRadius, c = 1 / (s - t.fleshCore * t.fleshCore), l = cachedNoise(128, 128, r ^ 79377);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 4;
					n[a] = t.jitter * (2 * hash(i, e, r ^ 79379) - 1), n[a + 1] = t.jitter * (2 * hash(i, e, r ^ 79381) - 1), n[a + 2] = 1 / (t.scale + t.scaleVariation * hash(i, e, r ^ 79383)), n[a + 3] = hash(i, e, r ^ 79385);
				}
				for (let e = 0; e < t.rings; e++) {
					let n = t.firstRing + e * t.ringPitch, r = (n - t.ringHalfWidth) ** 2, a = (n + t.ringHalfWidth) ** 2;
					i[e * 4] = r, i[e * 4 + 1] = 1 / ((n - t.ringCore) ** 2 - r), i[e * 4 + 2] = a, i[e * 4 + 3] = 1 / (a - (n + t.ringCore) ** 2);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, u = (Math.floor(r) * t.cells + Math.floor(e)) * 4, d = (fract(e) - .5 - n[u]) * n[u + 2], f = (fract(r) - .5 - n[u + 1]) * n[u + 2], p = d * d + f * f, m = smooth(clamp((a - p) * o));
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1 - m, m === 0) return;
					let h = l(W, G), g = n[u + 3], _ = smooth(clamp((s - p) * c));
					if (J += m * (.11 + .03 * g + .02 * h - J), Y += m * (.18 + .003 * h - Y), X += m * (.81 + .02 * h - X), Z += m * (.98 - Z), _ === 0) return;
					let v = 1;
					for (let e = 0; e < i.length; e += 4) {
						let t = smooth(clamp((p - i[e]) * i[e + 1])) * smooth(clamp((i[e + 2] - p) * i[e + 3]));
						v *= 1 - t;
					}
					let y = 1 - v, b = .9 + .04 * h;
					J += _ * (b + y * (.24 + .08 * g + .03 * h - b) - J), Y += _ * (.48 + .003 * h - Y), X += _ * (t.roughness - .08 * y + .02 * h - X), Z += _ * (.99 - Z);
				};
			}
			case `rubbergrommets`: {
				let t = require_materials.proceduralMaterialPresets.rubbergrommets, n = new Float64Array(t.cells * t.cells), i = t.outerRadius * t.outerRadius, a = 1 / (i - t.outerCore * t.outerCore), o = t.boreRadius * t.boreRadius, s = 1 / (t.boreCore * t.boreCore - o), c = t.collarRadius * t.collarRadius, l = 1 / (c - t.collarCore * t.collarCore), u = t.grooveRadius * t.grooveRadius, d = 1 / t.grooveBand, f = cachedNoise(96, 96, r ^ 79121);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 79123);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = fract(e) - .5, m = fract(r) - .5, h = p * p + m * m, g = smooth(clamp((i - h) * a)) * smooth(clamp((h - o) * s));
					if (J = .015, Y = .025, X = .96, Z = .3, g === 0) return;
					let _ = smooth(clamp((c - h) * l)), v = (h - u) * d, y = smooth(clamp(1 - v * v)), b = f(W, G), x = n[Math.floor(r) * t.cells + Math.floor(e)];
					J += g * (.22 + .07 * x + .02 * b + .035 * _ - .04 * y - J), Y += g * (.38 + .26 * _ - .07 * y + .003 * b - Y), X += g * (t.roughness + .04 * b - X), Z += g * (.97 - .12 * y - Z);
				};
			}
			case `peppermintcanes`: {
				let t = require_materials.proceduralMaterialPresets.peppermintcanes, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.core * t.core), o = 1 / i, s = 1 / t.stripeShoulder, c = cachedNoise(96, 96, r ^ 78865);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 78867);
				return () => {
					let e = W * t.cells, r = G * t.cells, l = Math.floor(e), u = Math.floor(r), d = l + u & 1 ? 1 : -1, f = fract(e) - .5, p = fract(r) - .5, m = (f + d * p) * Math.SQRT1_2, h = (p - d * f) * Math.SQRT1_2, g = h - t.bendY, _;
					if (g < 0) {
						let e = Math.sqrt(m * m + g * g) - t.bendRadius;
						_ = e * e;
					} else {
						let e = Math.abs(m) - t.bendRadius, n = Math.max(0, h - (m < 0 ? t.longEnd : t.shortEnd));
						_ = e * e + n * n;
					}
					let v = smooth(clamp((i - _) * a));
					if (J = .015, Y = .025, X = .96, Z = .3, Q = 1 - v, v === 0) return;
					let y = c(W, G), b = n[u * t.cells + l], x = fract(t.stripeFrequency * (m + t.stripeSlope * h) + .2 * b), S = smooth(clamp((t.stripeHalfWidth - Math.abs(x - .5)) * s)), C = smooth(clamp(1 - _ * o)), w = .92 + .03 * y;
					J += v * (w + S * (.04 + .035 * b + .02 * y - w) - J), Y += v * (.45 + .18 * C + .003 * y - Y), X += v * (t.roughness + .025 * y - X), Z += v * (.91 + .08 * C - Z);
				};
			}
			case `rutilatedquartz`: {
				let t = require_materials.proceduralMaterialPresets.rutilatedquartz, i = new Float64Array(t.cells * t.cells * 10), a = 1 / t.needlePitch, o = 1 / (t.needleRadius * t.needleRadius), s = 1 / t.shoulder, c = cachedNoise(8, 8, r ^ 78609), l = cachedNoise(128, 128, r ^ 78611);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = e * t.cells + a, s = o * 10, c = n * hash(a, e, r ^ 78613), l = c + t.crossAngle + t.crossVariation * hash(a, e, r ^ 78615);
					i[s] = Math.cos(c), i[s + 1] = Math.sin(c), i[s + 2] = Math.cos(l), i[s + 3] = Math.sin(l);
					for (let e = 0; e < 6; e++) {
						let n = t.length + t.lengthVariation * hash(o, e, r ^ 78617);
						i[s + 4 + e] = 1 / (n * n);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 10, u = fract(e) - .5, d = fract(n) - .5, f = 1;
					for (let e = 0; e < 2; e++) {
						let n = r + e * 2, c = u * i[n] + d * i[n + 1], l = d * i[n] - u * i[n + 1], p = Math.max(-1, Math.min(1, Math.round(l * a))), m = l - p * t.needlePitch;
						if (Math.abs(m) >= t.needleRadius) continue;
						let h = clamp(1 - c * c * i[r + 5 + e * 3 + p]), g = smooth(clamp((h * h - m * m * o) * s));
						f *= 1 - g;
					}
					let p = l(W, G), m = 1 - f;
					J = .82 + .14 * c(W, G), J += m * (.32 + .05 * p - J), Y = .35 + .001 * p, X = t.roughness + .02 * p, Z = 1;
				};
			}
			case `buckwheathulls`: {
				let t = require_materials.proceduralMaterialPresets.buckwheathulls, i = new Float64Array(t.cells * t.cells * 5), a = Math.sqrt(3) * .5, o = new Float64Array([
					0,
					1,
					a,
					-.5,
					-a,
					-.5
				]), s = 1 / t.shoulder, c = 1 / t.inradius, l = 1 / (t.ridgeRadius * t.ridgeRadius), u = 1 / t.ridgeTip, d = cachedNoise(128, 128, r ^ 78353);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 78355);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = t.jitter * (2 * hash(a, e, r ^ 78357) - 1), i[o + 3] = t.jitter * (2 * hash(a, e, r ^ 78359) - 1), i[o + 4] = hash(a, e, r ^ 78361);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, a = fract(e) - .5 - i[r + 2], f = fract(n) - .5 - i[r + 3], p = a * i[r] + f * i[r + 1], m = f * i[r] - a * i[r + 1], h = 1, g = 1;
					for (let e = 0; e < o.length; e += 2) {
						let n = t.inradius - p * o[e] - m * o[e + 1];
						h *= smooth(clamp(n * s)), g *= smooth(clamp(n * c));
					}
					if (J = .025, Y = .025, X = .96, Z = .3, h === 0) return;
					let _ = 1;
					for (let e = 0; e < o.length; e += 2) {
						let n = -p * o[e] - m * o[e + 1], r = m * o[e] - p * o[e + 1], i = smooth(clamp(1 - r * r * l)) * smooth(clamp((n - t.ridgeStart) * u)) * smooth(clamp((t.ridgeEnd - n) * u));
						_ *= 1 - i;
					}
					let v = 1 - _, y = d(W, G), b = i[r + 4];
					J += h * (.2 + .23 * b + .22 * g + .02 * y + .12 * v - J), Y += h * (.4 + .2 * g + .035 * v + .003 * y - Y), X += h * (t.roughness + .02 * y - .045 * v - X), Z += h * (.87 + .12 * g - Z);
				};
			}
			case `silknoil`: {
				let t = require_materials.proceduralMaterialPresets.silknoil, n = new Float64Array(t.nepCells * t.nepCells * 6), i = cachedNoise(128, 128, r ^ 134161), a = 1 / t.nepShoulder;
				for (let e = 0; e < t.nepCells; e++) for (let i = 0; i < t.nepCells; i++) {
					if (hash(i, e, r ^ 134163) >= t.nepChance) continue;
					let a = (e * t.nepCells + i) * 6, o = t.nepHalfMinimum + t.nepHalfVariation * hash(i, e, r ^ 134165), s = t.nepWidthMinimum + t.nepWidthVariation * hash(i, e, r ^ 134167);
					n[a] = .35 + .3 * hash(i, e, r ^ 134169), n[a + 1] = .35 + .3 * hash(i, e, r ^ 134171), n[a + 2] = 1 / (o * o), n[a + 3] = 1 / (s * s), n[a + 4] = Number(hash(i, e, r ^ 134173) < .5), n[a + 5] = t.nepToneMinimum + t.nepToneVariation * hash(i, e, r ^ 134175);
				}
				return () => {
					let e = W * t.threads, r = G * t.threads, o = Math.floor(e), s = Math.floor(r), c = e - o - .5, l = r - s - .5, u = 1 - 4 * c * c, d = 1 - 4 * l * l, f = u * u, p = d * d, m = f + p - f * p, h = (o + s & 1 ? 1 : -1) * f * p * (f - p), g = i(W, G), _ = W * t.nepCells, v = G * t.nepCells, y = Math.floor(_), b = Math.floor(v), x = (b * t.nepCells + y) * 6;
					if (J = .83 + .03 * m + .015 * g, Y = t.baseHeight + t.yarnLift * m + t.interlaceLift * h + .004 * g, X += .025 * g, Z = .9 + .075 * m, n[x + 2] === 0) return;
					let S = _ - y - n[x], C = v - b - n[x + 1], w = n[x + 4] ? S : C, T = n[x + 4] ? C : S, E = clamp(1 - w * w * n[x + 2] - T * T * n[x + 3]);
					if (E === 0) return;
					let D = smooth(clamp(E * a)), O = E * E;
					J += D * (n[x + 5] + .015 * g - J), Y += t.nepLift * O, X += t.nepRoughness * D, Z += D * (.99 - Z);
				};
			}
			case `matelasse`: {
				let t = require_materials.proceduralMaterialPresets.matelasse, n = 1 / (t.ribRadius * t.ribRadius), i = cachedNoise(128, 128, r ^ 133649);
				return () => {
					let e = (W + G) * t.cells, r = (W - G) * t.cells, a = fract(e + .5) - .5, o = fract(r + .5) - .5, s = smooth(clamp(1 - a * a * n)), c = smooth(clamp(1 - o * o * n)), l = s + c - s * c, u = fract(e) - .5, d = fract(r) - .5, f = 1 - 4 * u * u, p = 1 - 4 * d * d, m = f * f * p * p, h = W * t.threads, g = G * t.threads, _ = fract(h) - .5, v = fract(g) - .5, y = 1 - 4 * _ * _, b = 1 - 4 * v * v, x = y * y, S = b * b, C = x + S - x * S, w = (Math.floor(h) + Math.floor(g) & 1 ? 1 : -1) * x * S * (x - S), T = i(W, G);
					J = .76 + .03 * C + .018 * T + .012 * l, Y = t.baseHeight + t.ribLift * l + t.panelLift * m + t.yarnLift * C + t.interlaceLift * w + .003 * T, X += .025 * T - .025 * l, Z = .92 + .065 * l + .025 * m - .025 * (1 - C);
				};
			}
			case `cathedralquilt`: {
				let t = require_materials.proceduralMaterialPresets.cathedralquilt, n = new Float64Array(t.cells * t.cells), i = 1 / t.shoulder, a = cachedNoise(192, 192, r ^ 78097), o = cachedNoise(128, 8, r ^ 78099), s = cachedNoise(8, 128, r ^ 78101);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 78103);
				return () => {
					let e = W * t.cells, r = G * t.cells, c = Math.floor(e), l = Math.floor(r), u = fract(e) - .5, d = fract(r) - .5, f = 1, p = 1;
					for (let e = 0; e < 4; e++) {
						let n = u - (e & 1 ? .5 : -.5), r = d - (e & 2 ? .5 : -.5), a = n * n + r * r - t.radiusSquared;
						f *= smooth(clamp(a * i)), p *= smooth(clamp((a - t.foldWidth) * i));
					}
					let m = f - p, h = a(W, G), g = .5 * (o(W, G) + s(W, G));
					if (J = .88 + .025 * h + .02 * g, Y = .34 + .008 * g + .18 * m, X = t.roughness + .035 * g, Z = .96 + .03 * m, p === 0) return;
					let _ = n[l * t.cells + c];
					J += p * (.2 + .1 * _ + .04 * h - J), Y -= .07 * p, Z -= .08 * p;
				};
			}
			case `tortoiseshellacetate`: {
				let t = require_materials.proceduralMaterialPresets.tortoiseshellacetate, n = cachedNoise(t.macroCells, t.macroCells, r ^ 77841), i = cachedNoise(t.detailCells, t.detailCells, r ^ 77843), a = cachedNoise(t.warpCells, t.warpCells, r ^ 77845), o = cachedNoise(t.warpCells, t.warpCells, r ^ 77847), s = cachedNoise(t.grainCells, t.grainCells, r ^ 77849), c = 1 - t.macroWeight, l = 1 / t.shoulder;
				return () => {
					let e = W + t.warp * (a(W, G) - .5), r = G + t.warp * (o(W, G) - .5), d = smooth(clamp((t.macroWeight * n(e, r) + c * i(e, r) - t.threshold) * l)), f = s(W, G);
					J = .88 - .79 * d + .04 * f, Y = .38 + .001 * f, X = t.roughness + .018 * f, Z = 1;
				};
			}
			case `dualinlinechips`: {
				let t = require_materials.proceduralMaterialPresets.dualinlinechips, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.core * t.core), o = t.pinRadius * t.pinRadius, s = 1 / (o - t.pinCore * t.pinCore), c = t.markerRadius * t.markerRadius, l = 1 / (c - t.markerCore * t.markerCore), u = 1 / t.pinPitch, d = (t.pinsPerSide - 1) / 2, f = cachedNoise(96, 96, r ^ 77585);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 77587);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = Math.floor(e), m = Math.floor(r), h = p + m & 1 ? 1 : -1, g = fract(e) - .5, _ = fract(r) - .5, v = (g + h * _) * Math.SQRT1_2, y = (_ - h * g) * Math.SQRT1_2, b = Math.max(0, Math.abs(v) - t.straightX), x = Math.max(0, Math.abs(y) - t.straightY), S = smooth(clamp((i - b * b - x * x) * a)), C = Math.max(-d, Math.min(d, Math.round(y * u))), w = Math.max(0, Math.abs(Math.abs(v) - t.pinX) - t.pinStraight), T = y - C * t.pinPitch, E = smooth(clamp((o - w * w - T * T) * s));
					if (J = .015, Y = .025, X = .96, Z = .3, $ = 0, S === 0 && E === 0) return;
					let D = f(W, G), O = n[m * t.cells + p];
					if (E > 0 && (J += E * (.88 + .06 * O + .025 * D - J), Y += E * (.27 + .003 * D - Y), X += E * (.24 + .025 * D - X), Z += E * (.98 - Z), $ = E), S === 0) return;
					let k = v - t.markerX, A = y - t.markerY, j = smooth(clamp((c - k * k - A * A) * l));
					J += S * (.1 + .025 * O + .02 * D - .045 * j - J), Y += S * (.57 + .004 * D - .13 * j - Y), X += S * (t.roughness + .035 * D - X), Z += S * (.99 - .17 * j - Z), $ *= 1 - S;
				};
			}
			case `popcorn`: {
				let t = require_materials.proceduralMaterialPresets.popcorn, i = new Float64Array(t.cells * t.cells * 3), a = new Float64Array(t.cells * t.cells * t.lobes * 3), o = 1 / t.shoulder, s = 1 / t.hullX, c = 1 / t.hullY, l = 1 / t.hullShoulder, u = cachedNoise(128, 128, r ^ 77329);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o, c = n * hash(o, e, r ^ 77331);
					i[s * 3] = Math.cos(c), i[s * 3 + 1] = Math.sin(c), i[s * 3 + 2] = hash(o, e, r ^ 77333);
					for (let e = 0; e < t.lobes; e++) {
						let i = (s * t.lobes + e) * 3, o = c + n * e / (t.lobes - 1) + t.angleJitter * (2 * hash(s, e, r ^ 77335) - 1), l = e === 0 ? 0 : t.distance + t.distanceVariation * hash(s, e, r ^ 77337), u = e === 0 ? t.centerRadius : t.radius + t.radiusVariation * hash(s, e, r ^ 77339);
						a[i] = l * Math.cos(o), a[i + 1] = l * Math.sin(o), a[i + 2] = 1 / (u * u);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(n) * t.cells + Math.floor(e), d = fract(e) - .5, f = fract(n) - .5, p = 1, m = 1;
					for (let e = 0; e < t.lobes; e++) {
						let n = (r * t.lobes + e) * 3, i = d - a[n], s = f - a[n + 1], c = clamp(1 - (i * i + s * s) * a[n + 2]);
						p *= 1 - smooth(clamp(c * o)), m *= 1 - c * c;
					}
					J = .035, Y = .025, X = .96, Z = .3;
					let h = 1 - p;
					if (h === 0) return;
					let g = r * 3, _ = (d * i[g] + f * i[g + 1] - t.hullOffsetX) * s, v = (f * i[g] - d * i[g + 1] - t.hullOffsetY) * c, y = clamp(1 - v * v), b = _ - t.hullBend * y, x = smooth(clamp((y * y - b * b) * l)), S = u(W, G), C = i[g + 2], w = 1 - m;
					J += h * (.7 + .18 * w + .06 * C + .035 * S - J), Y += h * (.48 + .22 * w + .004 * S - Y), X += h * (t.roughness + .04 * S - X), Z += h * (.87 + .12 * w - Z), J += x * (.2 + .06 * C + .035 * S - J), Y += x * (.3 + .025 * S - Y), X += x * (.64 + .04 * S - X), Z += x * (.63 - Z);
				};
			}
			case `triglidesliders`: {
				let t = require_materials.proceduralMaterialPresets.triglidesliders, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.core * t.core), o = t.windowRadius * t.windowRadius, s = 1 / (o - t.windowCore * t.windowCore), c = cachedNoise(96, 96, r ^ 77073);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 77075);
				return () => {
					let e = W * t.cells, r = G * t.cells, l = Math.floor(e), u = Math.floor(r), d = l + u & 1 ? 1 : -1, f = fract(e) - .5, p = fract(r) - .5, m = (f + d * p) * Math.SQRT1_2, h = (p - d * f) * Math.SQRT1_2, g = Math.max(0, Math.abs(m) - t.straightX), _ = Math.max(0, Math.abs(h) - t.straightY), v = smooth(clamp((i - g * g - _ * _) * a));
					if (J = .015, Y = .025, X = .96, Z = .3, v === 0) return;
					let y = Math.max(0, Math.abs(Math.abs(m) - t.windowOffset) - t.windowX), b = Math.max(0, Math.abs(h) - t.windowY), x = v * (1 - smooth(clamp((o - y * y - b * b) * s)));
					if (x === 0) return;
					let S = c(W, G), C = n[u * t.cells + l];
					J += x * (.45 + .12 * C + .035 * S - J), Y += x * (.52 + .004 * S - Y), X += x * (t.roughness + .035 * S - X), Z += x * (.99 - Z);
				};
			}
			case `slottedturners`: {
				let t = require_materials.proceduralMaterialPresets.slottedturners, n = new Float64Array(t.cells * t.cells), i = t.cornerRadius * t.cornerRadius, a = 1 / (i - t.cornerCore * t.cornerCore), o = t.neckRadius * t.neckRadius, s = 1 / (o - t.neckCore * t.neckCore), c = t.slotRadius * t.slotRadius, l = 1 / (c - t.slotCore * t.slotCore), u = 1 / t.slotPitch, d = cachedNoise(8, 128, r ^ 76817);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 76819);
				return () => {
					let e = W * t.cells, r = G * t.cells, f = Math.floor(e), p = Math.floor(r), m = f + p & 1 ? 1 : -1, h = fract(e) - .5, g = fract(r) - .5, _ = (h + m * g) * Math.SQRT1_2, v = (g - m * h) * Math.SQRT1_2, y = Math.max(0, Math.abs(_) - t.bladeX), b = Math.max(0, Math.abs(v - t.bladeCenter) - t.bladeY), x = smooth(clamp((i - y * y - b * b) * a)), S = Math.max(0, Math.abs(v - t.neckCenter) - t.neckStraight), C = smooth(clamp((o - _ * _ - S * S) * s)), w = 1 - (1 - x) * (1 - C);
					if (J = .025, Y = .025, X = .95, Z = .3, $ = 0, w === 0) return;
					let T = _ - Math.max(-1, Math.min(1, Math.floor(_ * u + .5))) * t.slotPitch, E = Math.max(0, Math.abs(v - t.bladeCenter) - t.slotStraight), D = w * (1 - smooth(clamp((c - T * T - E * E) * l)));
					if (D === 0) return;
					let O = d(W, G), k = n[p * t.cells + f];
					J += D * (.72 + .08 * k + .015 * O - J), Y += D * (.55 + .005 * O - Y), X += D * (t.roughness + .02 * O - X), Z += D * (.99 - Z), $ = D;
				};
			}
			case `redcabbagecut`: {
				let t = require_materials.proceduralMaterialPresets.redcabbagecut, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.edge * t.edge), o = t.fleshRadius * t.fleshRadius, s = 1 / (o - t.fleshEdge * t.fleshEdge), c = 1 / o, l = 1 / t.veinShoulder, u = 1 / (t.pithX * t.pithX), d = 1 / (t.pithY * t.pithY), f = 1 / t.pithShoulder, p = cachedNoise(96, 96, r ^ 76561), m = cachedNoise(16, 16, r ^ 76563), h = cachedNoise(32, 32, r ^ 76567);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 76569);
				return () => {
					let e = W * t.cells, r = G * t.cells, g = fract(e) - .5, _ = fract(r) - .5, v = g * g + _ * _, y = smooth(clamp((i - v) * a));
					if (J = .015, Y = .025, X = .96, Z = .3, y === 0) return;
					let b = p(W, G), x = n[Math.floor(r) * t.cells + Math.floor(e)], S = smooth(clamp((o - v) * s));
					if (J += y * (.18 + .05 * x + .02 * b - J), Y += y * (.5 + .004 * b - Y), X += y * (.78 + .02 * b - X), Z += y * (.99 - Z), S === 0) return;
					let w = fract(t.rings * v * c + t.warp * (m(W, G) - .5) + t.fold * (h(W, G) - .5) + .5 * x), T = smooth(clamp((t.veinWidth - Math.min(w, 1 - w)) * l)), E = _ - t.pithCenter, D = smooth(clamp((1 - g * g * u - E * E * d) * f));
					J += S * (.28 + .1 * x + .03 * b + .58 * T - J), X += S * (t.roughness + .02 * b - .13 * T - X), J += D * (.91 + .04 * b - J), X += D * (.67 + .02 * b - X);
				};
			}
			case `bowtieinlay`: {
				let t = require_materials.proceduralMaterialPresets.bowtieinlay, n = new Float64Array(t.columns * t.rows), i = cachedNoise(128, 8, r ^ 76305), a = cachedNoise(8, 128, r ^ 76307), o = cachedNoise(96, 96, r ^ 76311), s = cachedNoise(4, 12, r ^ 76313), c = 1 / (t.crackWidth * t.crackWidth), l = t.halfLength * t.halfLength, u = 1 / (l - t.endCore * t.endCore), d = 1 / (t.flareRun * t.flareRun), f = 1 / t.sideSquaredShoulder;
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = hash(i, e, r ^ 76317);
				return () => {
					let e = W * t.columns, r = G * t.rows, p = Math.floor(e), m = Math.floor(r), h = t.warp * (2 * s((p + .5) / t.columns, G) - 1), g = fract(e) - .5 - h, _ = fract(r) - .5, v = smooth(clamp(1 - g * g * c)), y = t.waist + t.flare * smooth(clamp(g * g * d)), b = smooth(clamp((l - g * g) * u)) * smooth(clamp((y * y - _ * _) * f)), x = i(W, G), S = o(W, G);
					if (J = .78 + .12 * x + .02 * S - .69 * v, Y = .45 + .004 * S + .002 * x - .27 * v, X = t.roughness + .035 * x + .02 * S + .18 * v, Z = .99 - .45 * v, b === 0) return;
					let C = a(W, G), w = n[m * t.columns + p];
					J += b * (.24 + .1 * C + .06 * w - J), Y += b * (.45 + .004 * S + .002 * C - Y), X += b * (t.roughness - .08 + .04 * C + .015 * S - X), Z += b * (.99 - Z);
				};
			}
			case `toothbrushheads`: {
				let t = require_materials.proceduralMaterialPresets.toothbrushheads, n = t.tuftColumns * t.tuftRows, i = new Float64Array(t.cells * t.cells), a = new Float64Array(t.cells * t.cells * n), o = t.radius * t.radius, s = 1 / (o - t.edge * t.edge), c = t.tuftRadius * t.tuftRadius, l = 1 / c, u = 1 / (c - t.tuftCore * t.tuftCore), d = 1 / t.pitch, f = (t.tuftColumns - 1) * .5, p = (t.tuftRows - 1) * .5, m = cachedNoise(96, 96, r ^ 76049), h = cachedNoise(256, 256, r ^ 76051);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o;
					i[s] = hash(o, e, r ^ 76055);
					for (let e = 0; e < n; e++) a[s * n + e] = hash(s, e, r ^ 76057);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, g = Math.floor(e), _ = Math.floor(r), v = g + _ & 1 ? 1 : -1, y = fract(e) - .5, b = fract(r) - .5, x = (y + v * b) * Math.SQRT1_2, S = (b - v * y) * Math.SQRT1_2, C = Math.max(0, Math.abs(S) - t.straight), w = smooth(clamp((o - x * x - C * C) * s));
					if (J = .025, Y = .025, X = .95, Z = .3, w === 0) return;
					let T = _ * t.cells + g, E = m(W, G);
					J += w * (.54 + .08 * i[T] + .02 * E - J), Y += w * (.28 + .004 * E - Y), X += w * (t.roughness + .025 * E - X), Z += w * (.94 - Z);
					let D = Math.max(0, Math.min(t.tuftColumns - 1, Math.floor(x * d + f + .5))), O = Math.max(0, Math.min(t.tuftRows - 1, Math.floor(S * d + p + .5))), k = x - (D - f) * t.pitch, A = S - (O - p) * t.pitch, j = k * k + A * A, M = smooth(clamp((c - j) * u));
					if (M === 0) return;
					let N = smooth(clamp(1 - j * l)), P = h(W, G), F = a[T * n + O * t.tuftColumns + D];
					J += M * (.9 + .06 * F + .03 * P - J), Y += M * (.66 + .09 * N + .015 * P - Y), X += M * (.81 + .04 * P - X), Z += M * (.98 - Z);
				};
			}
			case `baseballleather`: {
				let t = require_materials.proceduralMaterialPresets.baseballleather, n = new Float64Array(t.columns * t.rows), i = t.rows / t.columns, a = t.threadEndX - t.threadStartX, o = t.threadEndY - t.threadStartY, s = 1 / (a * a + o * o), c = 1 / (t.threadRadius * t.threadRadius), l = 1 / t.threadShoulder, u = 1 / (t.seamRadius * t.seamRadius), d = cachedNoise(96, 96, r ^ 75793);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = hash(i, e, r ^ 75795);
				return () => {
					let e = W * t.columns, r = G * t.rows, f = Math.floor(e), p = Math.floor(r), m = G * (1 - G), h = (f & 1 ? 1 : -1) * t.bend * (16 * m * m - .5), g = (fract(e) - .5 - h) * i, _ = fract(r) - .5, v = smooth(clamp(1 - g * g * u)), y = d(W, G);
					J = .94 + .035 * y - .22 * v, Y = .38 + .018 * y - .12 * v, X = t.roughness + .04 * y + .08 * v, Z = .99 - .35 * v;
					let b = Math.abs(g) - t.threadStartX, x = _ - t.threadStartY, S = clamp((b * a + x * o) * s), C = b - S * a, w = x - S * o, T = clamp(1 - (C * C + w * w) * c), E = smooth(clamp(T * l));
					if (E === 0) return;
					let D = smooth(T), O = n[p * t.columns + f];
					J += E * (.08 + .035 * O + .025 * y - J), Y += E * (.5 + .1 * D + .003 * y - Y), X += E * (.5 + .025 * y - X), Z += E * (.98 - Z);
				};
			}
			case `ballbearingfaces`: {
				let t = require_materials.proceduralMaterialPresets.ballbearingfaces, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.edge * t.edge), o = t.bore * t.bore, s = 1 / (t.boreEdge * t.boreEdge - o), c = t.raceRadius * t.raceRadius, l = 1 / t.raceSquaredBand, u = 1 / t.raceShoulder, d = t.ballRadius * t.ballRadius, f = 1 / d, p = 1 / (d - t.ballCore * t.ballCore), m = t.raceRadius * Math.SQRT1_2, h = Math.SQRT2 - 1, g = cachedNoise(96, 96, r ^ 75537);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 75539);
				return () => {
					let e = W * t.cells, r = G * t.cells, _ = fract(e) - .5, v = fract(r) - .5, y = _ * _ + v * v, b = smooth(clamp((i - y) * a)) * smooth(clamp((y - o) * s));
					if (J = .025, Y = .025, X = .95, Z = .3, $ = b, b === 0) return;
					let x = (y - c) * l, S = smooth(clamp((1 - x * x) * u)), C = Math.abs(_), w = Math.abs(v), T, E;
					w < C * h ? (T = _ < 0 ? -t.raceRadius : t.raceRadius, E = 0) : C < w * h ? (T = 0, E = v < 0 ? -t.raceRadius : t.raceRadius) : (T = _ < 0 ? -m : m, E = v < 0 ? -m : m);
					let D = _ - T, O = v - E, k = D * D + O * O, A = smooth(clamp((d - k) * p)), j = g(W, G), M = n[Math.floor(r) * t.cells + Math.floor(e)];
					if (J += b * (.69 + .05 * M + .015 * j - .3 * S - J), Y += b * (.65 + .003 * j - .37 * S - Y), X += b * (t.roughness + .015 * j + .22 * S - X), Z += b * (.98 - .27 * S - Z), A === 0) return;
					let N = smooth(clamp(1 - k * f));
					J += A * (.8 + .15 * N + .015 * j - J), Y += A * (.69 + .14 * N + .003 * j - Y), X += A * (.17 + .015 * j - X), Z += A * (.99 - Z);
				};
			}
			case `springpinends`: {
				let t = require_materials.proceduralMaterialPresets.springpinends, i = new Float64Array(t.cells * t.cells * 5), a = cachedNoise(128, 128, r ^ 114193), o = t.outerRadius * t.outerRadius, s = t.innerRadius * t.innerRadius, c = t.slotRadius * t.slotRadius, l = 1 / (o - t.outerCore * t.outerCore), u = 1 / (t.innerCore * t.innerCore - s), d = 1 / (c - t.slotCore * t.slotCore), f = 1 / (t.slotFull - t.slotStart);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 114195);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = .5 + t.jitter * (2 * hash(a, e, r ^ 114197) - 1), i[o + 3] = .5 + t.jitter * (2 * hash(a, e, r ^ 114199) - 1), i[o + 4] = hash(a, e, r ^ 114201);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 5, p = fract(e) - i[r + 2], m = fract(n) - i[r + 3], h = p * i[r] + m * i[r + 1], g = m * i[r] - p * i[r + 1], _ = h * h + g * g, v = smooth(clamp((c - h * h) * d)) * smooth(clamp((g - t.slotStart) * f)), y = smooth(clamp((o - _) * l)) * smooth(clamp((_ - s) * u)) * (1 - v), b = a(W, G);
					J = .03 + y * (.79 + .05 * i[r + 4] + .02 * b), Y = .025 + y * (t.faceHeight + t.grainHeight * b - .025), X = .95 + y * (t.roughness + .025 * b - .95), Z = .3 + .69 * y, $ = y, Q = 1 - y;
				};
			}
			case `carawayseeds`:
			case `fennelseeds`: {
				let i = require_materials.proceduralMaterialPresets[t], a = new Float64Array(i.cells * i.cells * 5), o = 1 / (i.halfLength * i.halfLength), s = 1 / i.halfWidth, c = 1 / i.shoulder, l = 1 / (i.ribRadius * i.ribRadius), u = cachedNoise(96, 96, r ^ 75281);
				for (let e = 0; e < i.cells; e++) for (let t = 0; t < i.cells; t++) {
					let o = (e * i.cells + t) * 5, s = n * hash(t, e, r ^ 75283);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s), a[o + 2] = i.jitter * (2 * hash(t, e, r ^ 75287) - 1), a[o + 3] = i.jitter * (2 * hash(t, e, r ^ 75289) - 1), a[o + 4] = hash(t, e, r ^ 75293);
				}
				return () => {
					let e = W * i.cells, t = G * i.cells, n = (Math.floor(t) * i.cells + Math.floor(e)) * 5, r = fract(e) - .5 - a[n + 2], d = fract(t) - .5 - a[n + 3], f = r * a[n] + d * a[n + 1], p = d * a[n] - r * a[n + 1], m = clamp(1 - p * p * o), h = (f - i.bend * m) * s, g = clamp(m * m - h * h), _ = smooth(clamp(g * c));
					if (J = .035, Y = .03, X = .96, Z = .3, _ === 0) return;
					let v = 1;
					for (let e = -2; e <= 2; e++) {
						let t = h - e * i.ribGap * m, n = smooth(clamp(1 - t * t * l));
						v *= 1 - n;
					}
					let y = 1 - v, b = u(W, G);
					J += _ * (.44 + .18 * a[n + 4] + .035 * b + .14 * y - J), Y += _ * (.35 + .18 * smooth(g) + .055 * y + .003 * b - Y), X += _ * (i.roughness + .02 * b - .06 * y - X), Z += _ * (.96 + .03 * y - Z);
				};
			}
			case `ceramiccapacitors`: {
				let t = require_materials.proceduralMaterialPresets.ceramiccapacitors, n = new Float64Array(t.cells * t.cells), i = Math.SQRT1_2, a = 1 / (t.bodyX * t.bodyX), o = 1 / (t.bodyY * t.bodyY), s = 1 / t.shoulder, c = 1 / (t.leadRadius * t.leadRadius), l = 1 / t.leadShoulder, u = cachedNoise(96, 96, r ^ 75025);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 75027);
				return () => {
					let e = W * t.cells, r = G * t.cells, d = Math.floor(e), f = Math.floor(r), p = d + f & 1 ? 1 : -1, m = fract(e) - .5, h = fract(r) - .5, g = (m + p * h) * i, _ = (h - p * m) * i, v = _ - t.centerY, y = clamp(1 - g * g * a - v * v * o), b = smooth(clamp(y * s)), x = Math.abs(g) - t.leadOffset, S = clamp(1 - x * x * c), C = smooth(S) * smooth(clamp((_ - t.leadTop) * l)) * smooth(clamp((t.leadEnd - _) * l));
					if (J = .025, Y = .025, X = .95, Z = .35, $ = 0, b === 0 && C === 0) return;
					let w = u(W, G), T = n[f * t.cells + d];
					if (C > 0 && (J += C * (.9 + .06 * T + .025 * w - J), Y += C * (.21 + .035 * S + .002 * w - Y), X += C * (.23 + .02 * w - X), Z += C * (.98 - Z), $ = C), b === 0) return;
					let E = smooth(y);
					J += b * (.5 + .1 * T + .025 * w + .06 * E - J), Y += b * (.6 + .18 * E + .003 * w - Y), X += b * (t.roughness + .025 * w - X), Z += b * (.99 - Z), $ *= 1 - b;
				};
			}
			case `lathplaster`: {
				let t = require_materials.proceduralMaterialPresets.lathplaster, i = new Float64Array(t.cells * t.cells * 4), a = new Float64Array(t.laths), o = 1 / (t.patchLength * t.patchLength), s = 1 / (t.patchWidth * t.patchWidth), c = 1 / t.shoulder, l = 1 / t.lathShoulder, u = cachedNoise(96, 96, r ^ 74769), d = cachedNoise(4, 128, r ^ 74771), f = cachedNoise(8, 8, r ^ 74775), p = cachedNoise(8, 8, r ^ 74777);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 4, s = n * hash(a, e, r ^ 74779);
					i[o] = .5 + t.jitter * (2 * hash(a, e, r ^ 74781) - 1), i[o + 1] = .5 + t.jitter * (2 * hash(a, e, r ^ 74785) - 1), i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s);
				}
				for (let e = 0; e < t.laths; e++) a[e] = hash(e, 0, r ^ 74787);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 4, m = fract(e) - i[r] + t.warp * (f(W, G) - .5), h = fract(n) - i[r + 1] + t.warp * (p(W, G) - .5), g = m * i[r + 2] + h * i[r + 3], _ = h * i[r + 2] - m * i[r + 3], v = smooth(clamp((1 - g * g * o - _ * _ * s) * c)), y = u(W, G);
					if (J = .87 + .06 * y, Y = .78 + .006 * y, X = t.roughness + .025 * y, Z = .99, v === 0) return;
					let b = G * t.laths, x = smooth(clamp((t.lathHalfWidth - Math.abs(fract(b) - .5)) * l)), S = d(W, G), C = a[Math.floor(b)];
					J += v * (.025 + x * (.3 + .1 * C + .035 * S) - J), Y += v * (.08 + x * (.26 + .006 * S) - Y), X += v * (.97 + x * (-.25 + .025 * S) - X), Z += v * (.3 + .66 * x - Z);
				};
			}
			case `sewingsnaps`: {
				let t = require_materials.proceduralMaterialPresets.sewingsnaps, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.shoulder * t.shoulder), o = t.rimRadius * t.rimRadius, s = 1 / t.rimSquaredWidth, c = t.holeRadius * t.holeRadius, l = 1 / (c - t.holeShoulder * t.holeShoulder), u = t.socketRadius * t.socketRadius, d = 1 / (u - t.socketShoulder * t.socketShoulder), f = t.boreRadius * t.boreRadius, p = 1 / (f - t.boreShoulder * t.boreShoulder), m = t.postRadius * t.postRadius, h = 1 / (m - t.postShoulder * t.postShoulder), g = 1 / m, _ = cachedNoise(96, 96, r ^ 74513);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 74515);
				return () => {
					let e = W * t.cells, r = G * t.cells, v = Math.floor(e), y = Math.floor(r), b = fract(e) - .5, x = fract(r) - .5, S = b * b + x * x, C = smooth(clamp((i - S) * a));
					if (J = .025, Y = .025, X = .95, Z = .35, $ = 0, C === 0) return;
					let w = _(W, G), T = n[y * t.cells + v], E = (S - o) * s, D = smooth(clamp(1 - E * E));
					if (J += C * (.7 + .08 * T + .025 * w + .08 * D - J), Y += C * (.38 + .18 * D + .004 * w - Y), X += C * (t.roughness + .025 * w - .06 * D - X), Z += C * (.99 - Z), $ = C, v + y & 1) {
						let e = smooth(clamp((u - S) * d)), t = smooth(clamp((f - S) * p));
						J += e * (.4 + .04 * T + .02 * w - J), Y += e * (.12 + .003 * w - Y), X += e * (.34 + .02 * w - X), Z += e * (.76 - Z), J += t * (.025 - J), Y += t * (.025 - Y), X += t * (.95 - X), Z += t * (.35 - Z), $ *= 1 - t;
					} else {
						let e = smooth(clamp((m - S) * h)), t = clamp(1 - S * g);
						J += e * (.84 + .06 * T + .025 * w + .04 * t - J), Y += e * (.72 + .13 * t + .003 * w - Y), X += e * (.22 + .025 * w - X), Z += e * (.99 - Z);
					}
					let O = Math.abs(b) > Math.abs(x), k = b - (O ? b < 0 ? -t.holeOffset : t.holeOffset : 0), A = x - (O ? 0 : x < 0 ? -t.holeOffset : t.holeOffset), j = smooth(clamp((c - k * k - A * A) * l));
					j !== 0 && (J += j * (.025 - J), Y += j * (.025 - Y), X += j * (.95 - X), Z += j * (.35 - Z), $ *= 1 - j);
				};
			}
			case `snowflakeobsidian`:
			case `chrysanthemumstone`: {
				let i = t === `snowflakeobsidian`, a = require_materials.proceduralMaterialPresets.snowflakeobsidian, o = i ? a : require_materials.proceduralMaterialPresets.chrysanthemumstone, s = i ? a.scaleMin : 1, c = i ? a.scaleRange : 0, l = i ? a.matrixTone : .045, u = i ? a.matrixGrain : .04, d = i ? a.crystalTone : .9, f = i ? a.crystalVariation : .05, p = i ? a.crystalGrain : .02, m = i ? -a.crystalRoughness : .14, h = 3 + o.arms * 4, g = new Float64Array(o.cells * o.cells * h), _ = o.bladeCenter + o.lengthMin + o.lengthRange + o.widthMin + o.widthRange, v = i ? (_ * (s + c)) ** 2 : _ * _, y = 1 / o.shoulder, b = cachedNoise(96, 96, r ^ 74257);
				for (let e = 0; e < o.cells; e++) for (let t = 0; t < o.cells; t++) {
					let a = (e * o.cells + t) * h, l = n * hash(t, e, r ^ 74259), u = i ? s + c * hash(t, e, r ^ 74279) : 1;
					g[a] = .5 + o.jitter * (2 * hash(t, e, r ^ 74263) - 1), g[a + 1] = .5 + o.jitter * (2 * hash(t, e, r ^ 74265) - 1), g[a + 2] = hash(t, e, r ^ 74267);
					for (let s = 0; s < o.arms; s++) {
						let c = a + 3 + s * 4, d = l + n * s / o.arms + o.angleJitter * (2 * hash(t + s * o.cells, e, r ^ 74269) - 1), f = o.lengthMin + o.lengthRange * hash(t + s * o.cells, e, r ^ 74273), p = o.widthMin + o.widthRange * hash(t + s * o.cells, e, r ^ 74275);
						g[c] = Math.cos(d), g[c + 1] = Math.sin(d), i && (g[c] /= u, g[c + 1] /= u), g[c + 2] = 1 / (f * f), g[c + 3] = 1 / (p * p);
					}
				}
				return () => {
					let e = W * o.cells, t = G * o.cells, n = (Math.floor(t) * o.cells + Math.floor(e)) * h, r = fract(e) - g[n], i = fract(t) - g[n + 1], a = b(W, G), s = 1;
					if (r * r + i * i < v) for (let e = 0; e < o.arms && s > 0; e++) {
						let t = n + 3 + e * 4, a = r * g[t] + i * g[t + 1] - o.bladeCenter, c = i * g[t] - r * g[t + 1], l = smooth(clamp((1 - a * a * g[t + 2] - c * c * g[t + 3]) * y));
						s *= 1 - l;
					}
					let c = 1 - s;
					J = l + u * a, J += c * (d + f * g[n + 2] + p * a - J), Y = .4 + .004 * a, X += .02 * a - m * c, Z = .99;
				};
			}
			case `tomatoslices`: {
				let t = require_materials.proceduralMaterialPresets.tomatoslices, i = new Float64Array(t.cells * t.cells * t.chambers * 2), a = new Float64Array(t.cells * t.cells), o = t.radius * t.radius, s = 1 / (o - t.outerShoulder * t.outerShoulder), c = t.fleshRadius * t.fleshRadius, l = 1 / (c - t.fleshShoulder * t.fleshShoulder), u = 1 / (t.chamberLength * t.chamberLength), d = 1 / (t.chamberWidth * t.chamberWidth), f = 1 / (t.seedLength * t.seedLength), p = 1 / (t.seedWidth * t.seedWidth), m = 1 / (t.coreRadius * t.coreRadius), h = 1 / t.shoulder, g = cachedNoise(96, 96, r ^ 74001);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o, c = n * hash(o, e, r ^ 74003);
					a[s] = hash(o, e, r ^ 74007);
					for (let e = 0; e < t.chambers; e++) {
						let r = c + n * e / t.chambers, a = (s * t.chambers + e) * 2;
						i[a] = Math.cos(r), i[a + 1] = Math.sin(r);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(n) * t.cells + Math.floor(e), _ = fract(e) - .5, v = fract(n) - .5, y = _ * _ + v * v, b = smooth(clamp((o - y) * s));
					if (J = .025, Y = .025, X = .95, Z = .35, b === 0) return;
					let x = g(W, G), S = a[r], C = smooth(clamp((c - y) * l)), w = smooth(clamp(1 - y * m)), T = 0, E = 0;
					if (y < c) for (let e = 0; e < t.chambers; e++) {
						let n = (r * t.chambers + e) * 2, a = _ * i[n] + v * i[n + 1], o = v * i[n] - _ * i[n + 1], s = a - t.chamberCenter, c = smooth(clamp((1 - s * s * u - o * o * d) * h));
						if (T += c, c !== 0) for (let e = -1; e <= 1; e += 2) {
							let n = s - e * t.seedOffset, r = o - e * t.seedSide;
							E += c * smooth(clamp((1 - n * n * f - r * r * p) * h));
						}
					}
					let D = .1 + .025 * S + .02 * x + C * (.14 + .035 * S) + .17 * w + .41 * T + .3 * E;
					J += b * (D - J), Y += b * (.56 + .02 * C + .004 * x - .06 * T + .045 * E - Y), X += b * (.43 + .025 * x - .2 * T + .025 * E - X), Z += b * (.99 - Z);
				};
			}
			case `axialresistors`: {
				let t = require_materials.proceduralMaterialPresets.axialresistors, n = new Float64Array(t.cells * t.cells), i = Math.SQRT1_2, a = 1 / (t.endRadius * t.endRadius), o = 1 / (t.bodyRadius * t.bodyRadius), s = 1 / t.bodyShoulder, c = 1 / (t.leadRadius * t.leadRadius), l = 1 / t.leadShoulder, u = 1 / t.bandPitch, d = 1 / t.bandRadius, f = cachedNoise(96, 96, r ^ 73745);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 73747);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = Math.floor(e), m = Math.floor(r), h = p + m & 1 ? 1 : -1, g = fract(e) - .5, _ = fract(r) - .5, v = (g + h * _) * i, y = (_ - h * g) * i, b = Math.abs(v), x = Math.max(0, b - t.bodyCore), S = clamp(1 - x * x * a - y * y * o), C = smooth(clamp(S * s)), w = clamp(1 - y * y * c), T = smooth(w) * smooth(clamp((t.leadEnd - b) * l));
					if (J = .035, Y = .025, X = .95, Z = .35, $ = 0, T === 0 && C === 0) return;
					let E = f(W, G), D = n[m * t.cells + p];
					if (T > 0 && (J += T * (.86 + .06 * D + .02 * E - J), Y += T * (.2 + .04 * w + .002 * E - Y), X += T * (.23 + .02 * E - X), Z += T * (.98 - Z), $ = T), C === 0) return;
					let O = smooth(S);
					J += C * (.56 + .1 * D + .025 * E + .04 * O - J), Y += C * (.43 + .21 * O + .003 * E - Y), X += C * (t.roughness + .025 * E - X), Z += C * (.98 - Z), $ *= 1 - C;
					let k = Math.floor((v - t.firstBand) * u + .5);
					if (k >= 0 && k < 3) {
						let e = (v - t.firstBand - k * t.bandPitch) * d, n = C * smooth(clamp(1 - e * e));
						J += n * (.1 + .02 * E - J), X += n * (.48 + .02 * E - X);
					}
					let A = (v - t.lastBand) * d, j = C * smooth(clamp(1 - A * A));
					J += j * (.88 + .03 * D - J), X += j * (.34 + .02 * E - X);
				};
			}
			case `septarianstone`: {
				let t = require_materials.proceduralMaterialPresets.septarianstone, n = new Float64Array(t.cells * t.cells), i = 1 / t.shoulder, a = cachedNoise(96, 96, r ^ 73491), o = cachedNoise(8, 8, r ^ 73495), s = cachedNoise(4, 4, r ^ 73497), c = cachedNoise(4, 4, r ^ 73499);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 73489);
				return () => {
					let e = W * t.cells + t.warp * (s(W, G) - .5), r = G * t.cells + t.warp * (c(W, G) - .5), l = Math.floor(e), u = Math.floor(r), d = t.veinInset + t.veinVariation * o(W, G), f = a(W, G), p = 0, m = 0;
					for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
						let s = l + o, c = u + a, f = (c % t.cells + t.cells) % t.cells * t.cells + (s % t.cells + t.cells) % t.cells, h = f * 26, g = e - s - Ge[h], _ = r - c - Ge[h + 1], v = 1;
						for (let e = 0; e < 8 && v > 0; e++) {
							let t = h + 2 + e * 3;
							v *= smooth(clamp((Ge[t + 2] - g * Ge[t] - _ * Ge[t + 1] - d) * i));
						}
						p += v, m += v * n[f];
					}
					let h = 1 - clamp(p);
					J = p * (.26 + .08 * f) + .2 * m + h * (.9 + .06 * f), Y = .48 + .004 * f + .002 * h, X += .025 * f - .17 * h, Z = .99;
				};
			}
			case `speakercones`: {
				let t = require_materials.proceduralMaterialPresets.speakercones, i = new Float64Array(t.cells * t.cells), a = t.radius * t.radius, o = 1 / (a - t.outerShoulder * t.outerShoulder), s = t.surroundRadius * t.surroundRadius, c = 1 / t.surroundSquaredWidth, l = t.coneRadius * t.coneRadius, u = 1 / (l - t.coneShoulder * t.coneShoulder), d = 1 / l, f = t.dustRadius * t.dustRadius, p = 1 / (f - t.dustShoulder * t.dustShoulder), m = 1 / f, h = t.ribInner * t.ribInner, g = t.ribOuter * t.ribOuter, _ = 1 / ((t.ribInner + t.ribFade) ** 2 - h), v = 1 / (g - (t.ribOuter - t.ribFade) ** 2), y = cachedNoise(96, 96, r ^ 73233);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) i[e * t.cells + a] = n * hash(a, e, r ^ 73235);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, b = fract(n) - .5, x = r * r + b * b, S = smooth(clamp((a - x) * o));
					if (J = .035, Y = .025, X = .95, Z = .35, S === 0) return;
					let C = y(W, G), w = (x - s) * c, T = smooth(clamp(1 - w * w)), E = S * smooth(clamp((l - x) * u)), D = E * smooth(clamp((f - x) * p));
					if (J += S * (.19 + .03 * C - .08 * T - J), Y += S * (.48 + .22 * T + .004 * C - Y), X += S * (t.roughness + .14 * T + .02 * C - X), Z += S * (.98 - Z), E === 0) return;
					let O = 0;
					if (x > h && x < g && (O = smooth(clamp((x - h) * _)) * smooth(clamp((g - x) * v)) * (.5 + .5 * Math.cos(t.ribs * Math.atan2(b, r) + i[Math.floor(n) * t.cells + Math.floor(e)]))), J += E * (.32 + .04 * C - .025 * O - J), Y += E * (.18 + .32 * x * d - .008 * O + .004 * C - Y), X += E * (.76 + .035 * C - X), Z += E * (.9 - Z), D === 0) return;
					let k = clamp(1 - x * m);
					J += D * (.4 + .035 * C + .03 * k - J), Y += D * (.22 + .27 * k + .004 * C - Y), X += D * (.39 + .03 * C - X), Z += D * (.99 - Z);
				};
			}
			case `dragonfruitflesh`: {
				let t = require_materials.proceduralMaterialPresets.dragonfruitflesh, i = new Float64Array(t.cells * t.cells * 4), a = 1 / t.seedLong, o = 1 / t.seedShort, s = 1 / t.shoulder, c = cachedNoise(96, 96, r ^ 72977);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 4, s = n * hash(a, e, r ^ 72979);
					i[o] = .5 + t.jitter * (2 * hash(a, e, r ^ 72981) - 1), i[o + 1] = .5 + t.jitter * (2 * hash(a, e, r ^ 72983) - 1), i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 4, l = fract(e) - i[r], u = fract(n) - i[r + 1], d = (l * i[r + 2] + u * i[r + 3]) * a, f = (u * i[r + 2] - l * i[r + 3]) * o, p = smooth(clamp((1 - d * d - f * f) * s)), m = c(W, G), h = .965 + .025 * m;
					J = h + p * (.02 + .015 * m - h), Y = .4 + .015 * m, X = t.roughness + .045 * m, X += p * (.33 + .02 * m - X), Z = .99;
				};
			}
			case `screwterminalblocks`: {
				let t = require_materials.proceduralMaterialPresets.screwterminalblocks, n = new Float64Array(t.cells * t.cells), i = 1 / t.edge, a = t.screwRadius * t.screwRadius, o = 1 / (a - t.screwShoulder * t.screwShoulder), s = 1 / a, c = t.wellRadius * t.wellRadius, l = 1 / (c - t.wellShoulder * t.wellShoulder), u = 1 / t.slotShoulder, d = 1 / t.portShoulder, f = 1 / t.contactShoulder, p = cachedNoise(96, 96, r ^ 72721);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 72723);
				return () => {
					let e = W * t.cells, r = G * t.cells, m = fract(e) - .5, h = fract(r) - .5, g = Math.abs(m), _ = smooth(clamp((t.halfWidth - g) * i)) * smooth(clamp((t.halfHeight - Math.abs(h)) * i));
					if (J = .025, Y = .025, X = .95, Z = .35, _ === 0) return;
					let v = p(W, G), y = n[Math.floor(r) * t.cells + Math.floor(e)], b = h - t.screwY, x = m * m + b * b, S = _ * smooth(clamp((c - x) * l)), C = _ * smooth(clamp((a - x) * o));
					if (J += _ * (.22 + .05 * y + .025 * v - J), Y += _ * (.48 + .005 * v - Y), X += _ * (t.roughness + .04 * v - X), Z += _ * (.98 - Z), J -= .06 * S, Y -= .1 * S, X += .04 * S, Z -= .18 * S, C > 0) {
						let e = Math.abs(b), n = smooth(clamp((t.slotHalfWidth - g) * u)), r = smooth(clamp((t.slotHalfWidth - e) * u)), i = smooth(clamp((t.slotHalfLength - g) * u)), a = smooth(clamp((t.slotHalfLength - e) * u)), o = r * i, c = n * a, l = o + c - o * c, d = clamp(1 - x * s);
						J += C * (.82 + .08 * y + .025 * v + .04 * d - .38 * l - J), Y += C * (.67 + .03 * d - .14 * l + .004 * v - Y), X += C * (.27 - .03 * d + .18 * l + .02 * v - X), Z += C * (.99 - .24 * l - Z);
					}
					$ = C;
					let w = _ * smooth(clamp((t.portHalfWidth - g) * d)) * smooth(clamp((t.portHalfHeight - Math.abs(h - t.portY)) * d));
					if (w === 0) return;
					J += w * (.035 + .015 * v - J), Y += w * (.13 + .002 * v - Y), X += w * (.88 - X), Z += w * (.35 - Z), $ *= 1 - w;
					let T = w * smooth(clamp((t.contactHalfWidth - g) * f)) * smooth(clamp((t.contactHalfHeight - Math.abs(h - t.contactY)) * f));
					T !== 0 && (J += T * (.78 + .08 * y + .025 * v - J), Y += T * (.22 + .003 * v - Y), X += T * (.29 + .02 * v - X), Z += T * (.82 - Z), $ += T * (1 - $));
				};
			}
			case `passionfruitslice`: {
				let t = require_materials.proceduralMaterialPresets.passionfruitslice, i = new Float64Array(t.cells * t.cells * t.seeds * t.seeds * 4), a = t.seeds * .5, o = 1 / t.width, s = 1 / t.length, c = 1 / t.edge, l = t.pithRadius * t.pithRadius, u = 1 / (l - t.pithShoulder * t.pithShoulder), d = t.fleshRadius * t.fleshRadius, f = 1 / (d - t.fleshShoulder * t.fleshShoulder), p = 1 / (a * t.jellyLong), m = 1 / (a * t.jellyShort), h = 1 / t.jellyShoulder, g = 1 / (a * t.kernelLong), _ = 1 / (a * t.kernelShort), v = 1 / t.kernelShoulder, y = cachedNoise(96, 96, r ^ 72465);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) for (let o = 0; o < t.seeds; o++) for (let s = 0; s < t.seeds; s++) {
					let c = a * t.seeds + s, l = e * t.seeds + o, u = (((e * t.cells + a) * t.seeds + o) * t.seeds + s) * 4, d = n * hash(c, l, r ^ 72467);
					i[u] = .5 + t.seedJitter * (2 * hash(c, l, r ^ 72469) - 1), i[u + 1] = .5 + t.seedJitter * (2 * hash(c, l, r ^ 72471) - 1), i[u + 2] = Math.cos(d), i[u + 3] = Math.sin(d);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (fract(e) - .5) * o, b = (fract(n) - .5) * s, x = r * r + b * b, S = smooth(clamp((1 - x) * c));
					if (J = .035, Y = .03, X = .95, Z = .35, S === 0) return;
					let C = y(W, G), w = S * smooth(clamp((l - x) * u)), T = S * smooth(clamp((d - x) * f));
					if (J += S * (.65 + .08 * C - J), Y += S * (.6 + .004 * C - Y), X += S * (t.roughness + .035 * C - X), Z += S * (.98 - Z), J += w * (.98 + .01 * C - J), Y += w * (.63 + .004 * C - Y), X += w * (.72 + .025 * C - X), Z += w * (.99 - Z), T === 0) return;
					J += T * (.52 + .07 * C - J), Y += T * (.31 + .005 * C - Y), X += T * (.31 + .025 * C - X), Z += T * (.8 - Z);
					let E = (r + 1) * a, D = (b + 1) * a, O = (((Math.floor(n) * t.cells + Math.floor(e)) * t.seeds + Math.floor(D)) * t.seeds + Math.floor(E)) * 4, k = fract(E) - i[O], A = fract(D) - i[O + 1], j = k * i[O + 2] + A * i[O + 3], M = A * i[O + 2] - k * i[O + 3], N = j * p, P = M * m, F = N * N + P * P, I = T * smooth(clamp((1 - F) * h)), L = j * g, R = M * _, z = T * smooth(clamp((1 - L * L - R * R) * v)), ee = clamp(1 - F);
					J += I * (.84 + .05 * C - J), Y += I * (.46 + .09 * ee + .004 * C - Y), X += I * (.19 - .03 * ee + .02 * C - X), Z += I * (.98 - Z), J += z * (.025 + .025 * C - J);
				};
			}
			case `batterypositivecaps`: {
				let t = require_materials.proceduralMaterialPresets.batterypositivecaps, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - t.outerShoulder * t.outerShoulder), o = t.insulatorRadius * t.insulatorRadius, s = 1 / (o - t.insulatorShoulder * t.insulatorShoulder), c = t.buttonRadius * t.buttonRadius, l = 1 / (c - t.buttonShoulder * t.buttonShoulder), u = 1 / c, d = t.rimRadius * t.rimRadius, f = 1 / t.rimSquaredWidth, p = cachedNoise(96, 96, r ^ 72209);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 72211);
				return () => {
					let e = W * t.cells, r = G * t.cells, m = fract(e) - .5, h = fract(r) - .5, g = m * m + h * h, _ = smooth(clamp((i - g) * a));
					if (J = .025, Y = .025, X = .95, Z = .4, _ === 0) return;
					let v = p(W, G), y = n[Math.floor(r) * t.cells + Math.floor(e)], b = (g - d) * f, x = smooth(clamp(1 - b * b)), S = smooth(clamp((o - g) * s)), C = smooth(clamp((c - g) * l)), w = clamp(1 - g * u);
					J += _ * (.72 + .07 * y + .02 * v + .055 * x - J), Y += _ * (.49 + .07 * x + .004 * v - Y), X += _ * (t.roughness - .04 * x + .015 * v - X), Z += _ * (.99 - Z), $ = _, J += S * (.95 + .025 * v - J), Y += S * (.35 + .005 * v - Y), X += S * (.72 + .025 * v - X), Z += S * (.94 - Z), $ *= 1 - S, J += C * (.78 + .07 * y + .025 * v + .04 * w - J), Y += C * (.7 + .07 * w + .004 * v - Y), X += C * (t.roughness - .03 * w + .015 * v - X), Z += C * (.99 - Z), $ += C * (1 - $);
				};
			}
			case `tangramtiles`: {
				let t = require_materials.proceduralMaterialPresets.tangramtiles, n = t.pieces.length, i = new Uint8Array(n + 1), a = new Float64Array(t.cells * t.cells * n), o = 1 / t.shoulder, s = cachedNoise(64, 64, r ^ 71953), c = 0;
				for (let e of t.pieces) c += e.length;
				let l = new Float64Array(c * 3), u = 0;
				for (let e = 0; e < n; e++) {
					i[e] = u;
					let n = t.pieces[e];
					for (let e = 0; e < n.length; e++, u++) {
						let t = n[e], r = n[(e + 1) % n.length], i = 1 / Math.hypot(r[0] - t[0], r[1] - t[1]), a = (t[1] - r[1]) * i, o = (r[0] - t[0]) * i, s = u * 3;
						l[s] = a, l[s + 1] = o, l[s + 2] = -a * t[0] - o * t[1];
					}
				}
				i[n] = u;
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) for (let o = 0; o < n; o++) a[(e * t.cells + i) * n + o] = .18 + .11 * o + .03 * hash(i, e, r ^ 71955 + o);
				return () => {
					let e = W * t.cells, r = G * t.cells, c = fract(e), u = fract(r), d = (Math.floor(r) * t.cells + Math.floor(e)) * n, f = 0, p = 0;
					for (let e = 0; e < n; e++) {
						let n = 1;
						for (let r = i[e]; r < i[e + 1] && n > 0; r++) {
							let e = r * 3;
							n *= smooth(clamp((l[e] * c + l[e + 1] * u + l[e + 2] - t.grout) * o));
						}
						f += n, p += n * a[d + e];
					}
					let m = f > 0 ? s(W, G) : 0;
					Q = 1 - f, J = p + .015 * m * f, Y = (.65 + .003 * m) * f, X = t.roughness + .015 * m * f + .6 * Q, Z = .5 + .49 * f;
				};
			}
			case `pythagoreantiles`: {
				let t = require_materials.proceduralMaterialPresets.pythagoreantiles, n = t.smallSide, i = t.largeSide, a = n * n + i * i, o = i / 2, s = n / 2, c = (i - n) / 2, l = (n + i) / 2, u = 1 / t.shoulder, d = new Float64Array(a * 2), f = cachedNoise(64, 64, r ^ 71185);
				for (let e = 0; e < 2; e++) for (let t = 0; t < a; t++) d[e * a + t] = hash(t, e, r ^ 71187);
				return () => {
					let e = W * a, r = G * a, p = Math.floor(i * W + n * G), m = Math.floor(-n * W + i * G), h = 0, g = 0;
					for (let s = 0; s <= 1; s++) for (let c = 0; c <= 1; c++) {
						let l = p + c, f = m + s, _ = e - (i * l - n * f), v = r - (n * l + i * f), y = smooth(clamp((o - Math.abs(_) - t.grout) * u)) * smooth(clamp((o - Math.abs(v) - t.grout) * u));
						if (y === 0) continue;
						let b = (n * l + i * f + a) % a;
						h += y, g += y * (.32 + .08 * d[b]);
					}
					let _ = e - (i * p - n * m + c), v = r - (n * p + i * m + l), y = smooth(clamp((s - Math.abs(_) - t.grout) * u)) * smooth(clamp((s - Math.abs(v) - t.grout) * u)), b = (n * p + i * m + a) % a;
					h += y, g += y * (.78 + .06 * d[a + b]);
					let x = h > 0 ? f(W, G) : 0;
					Q = 1 - h, J = g + .02 * x * h, Y = (.65 + .003 * x) * h, X = t.roughness + .015 * x + .7 * Q, Z = .5 + .49 * h;
				};
			}
			case `crinoidossicles`: {
				let t = require_materials.proceduralMaterialPresets.crinoidossicles, i = new Float64Array(t.cells * t.cells * 4), a = (t.lumenRadius - t.lobeDepth) ** 2 - t.lumenSquaredShoulder, o = t.ribInnerRadius * t.ribInnerRadius, s = t.ribOuterRadius * t.ribOuterRadius, c = 1 / ((t.ribInnerRadius + t.ribFade) ** 2 - o), l = 1 / (s - (t.ribOuterRadius - t.ribFade) ** 2), u = 1 / t.lumenSquaredShoulder, d = cachedNoise(96, 96, r ^ 70929), f = cachedNoise(16, 16, r ^ 70931);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 4, s = t.radius + t.radiusVariation * (2 * hash(a, e, r ^ 70933) - 1);
					i[o] = hash(a, e, r ^ 70935), i[o + 1] = n * hash(a, e, r ^ 70937), i[o + 2] = s * s, i[o + 3] = 1 / (s * s - (s - t.edgeBevel) ** 2);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 4, p = fract(e) - .5, m = fract(n) - .5, h = p * p + m * m, g = smooth(clamp((i[r + 2] - h) * i[r + 3])), _ = d(W, G), v = f(W, G);
					if (J = .4 + .08 * v + .03 * _, Y = .36 + .012 * _, X = t.roughness + .05 * _, Z = .99, g === 0) return;
					let y = 1, b = 0;
					if (h > a) {
						let e = Math.atan2(m, p) - i[r + 1], n = Math.cos(t.lobes * e), a = t.lumenRadius + t.lobeDepth * n;
						y = smooth(clamp((a * a - h) * u));
						let d = n * n, f = 1 + 4 * d * (d - 1);
						b = f * f * smooth(clamp((h - o) * c)) * smooth(clamp((s - h) * l));
					}
					J += g * (.82 + .06 * i[r] + .02 * _ + .035 * b - J), Y += g * (.49 + .07 * b + .005 * _ - Y), X += g * (.64 + .04 * _ - .07 * b - X), Z += g * (.96 + .025 * b - Z);
					let x = g * y;
					J += x * (.31 + .035 * v + .025 * _ - J), Y += x * (.31 + .01 * _ - Y), X += x * (.86 + .04 * _ - X), Z += x * (.72 - Z);
				};
			}
			case `canlids`: {
				let t = require_materials.proceduralMaterialPresets.canlids, n = new Float64Array(t.cells * t.cells), i = t.radius * t.radius, a = 1 / (i - (t.radius - t.edgeBevel) ** 2), o = t.beadRadius * t.beadRadius, s = 1 / ((t.beadRadius + t.beadWidth) ** 2 - o), c = t.scoreRadius * t.scoreRadius, l = 1 / ((t.scoreRadius + t.scoreWidth) ** 2 - c), u = cachedNoise(96, 96, r ^ 70673);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 70675);
				return () => {
					let e = W * t.cells, r = G * t.cells, d = Math.floor(e), f = Math.floor(r), p = fract(e) - .5, m = fract(r) - .5, h = d + f & 1, g = h ? m : p, _ = h ? p : m, v = g * g + _ * _, y = smooth(clamp((i - v) * a));
					if (J = .07, Y = .025, X = .94, Z = .35, y === 0) return;
					let b = u(W, G), x = n[f * t.cells + d], S = (v - o) * s, C = smooth(clamp(1 - S * S)), w = (v - c) * l, T = smooth(clamp(1 - w * w)), E = 1 - (g / t.tabWidth) ** 2 - ((_ - t.tabCenter) / t.tabLength) ** 2, D = smooth(clamp(E / t.shoulder)), O = smooth(clamp((1 - (g / t.gripWidth) ** 2 - ((_ - t.gripCenter) / t.gripLength) ** 2) / t.shoulder)), k = smooth(clamp((1 - (g / t.slotWidth) ** 2 - ((_ - t.slotCenter) / t.slotLength) ** 2) / t.shoulder)), A = D * (1 - O) * (1 - k), j = 1 - (g / t.rivetRadius) ** 2 - ((_ - t.rivetCenter) / t.rivetRadius) ** 2, M = smooth(clamp(j / t.shoulder));
					J += y * (.52 + .1 * C - .12 * T + .025 * x + .01 * b - J), Y += y * (.38 + .1 * C - .035 * T + .003 * b - Y), X += y * (t.roughness + .03 * b + .1 * T - .07 * C - X), Z += y * (.96 - .1 * T - Z), J += A * (.68 + .025 * x + .008 * b - J), Y += A * (.64 + .025 * smooth(clamp(E)) + .001 * b - Y), X += A * (.27 + .01 * b - X), Z += A * (.99 - Z), J += M * (.78 + .02 * x + .008 * b - J), Y += M * (.74 + .03 * smooth(clamp(j)) + .001 * b - Y), X += M * (.24 + .01 * b - X), Z += M * (1 - Z);
				};
			}
			case `spaltedwood`: {
				let t = require_materials.proceduralMaterialPresets.spaltedwood, n = cachedNoise(t.zoneColumns, t.zoneRows, r ^ 70417), i = cachedNoise(t.variationColumns, t.variationRows, r ^ 70419), a = cachedNoise(96, 4, r ^ 70421), o = cachedNoise(192, 8, r ^ 70423);
				return () => {
					let e = i(W, G), r = (1 - t.variationMix) * n(W, G) + t.variationMix * e, s = t.lineWidth + t.lineWidthVariation * e, c = (r - t.zoneLevel) / s, l = smooth(clamp(1 - c * c)), u = a(W, G), d = o(W, G);
					J = .78 + .12 * u + .045 * d - .69 * l, Y = .64 + .018 * u + .01 * d, X = .67 + .05 * u + .01 * d, Z = .97 + .02 * d;
				};
			}
			case `grinderburrs`: {
				let t = require_materials.proceduralMaterialPresets.grinderburrs, i = new Float64Array(t.cells * t.cells), a = new Float64Array(t.cells * t.cells), o = new Float64Array(t.cells * t.cells * t.mountingHoles * 2), s = t.outerRadius * t.outerRadius, c = t.boreRadius * t.boreRadius, l = t.holeRadius * t.holeRadius, u = 1 / (s - (t.outerRadius - t.edgeBevel) ** 2), d = 1 / ((t.boreRadius + t.edgeBevel) ** 2 - c), f = 1 / (l - t.holeCore * t.holeCore), p = 1 / n, m = cachedNoise(96, 96, r ^ 69909);
				for (let e = 0; e < i.length; e++) {
					i[e] = hash(e, 0, r ^ 69905), a[e] = hash(e, 0, r ^ 69907);
					for (let r = 0; r < t.mountingHoles; r++) {
						let i = n * (a[e] + r / t.mountingHoles), s = (e * t.mountingHoles + r) * 2;
						o[s] = t.holeDistance * Math.cos(i), o[s + 1] = t.holeDistance * Math.sin(i);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(n) * t.cells + Math.floor(e), h = fract(e) - .5, g = fract(n) - .5, _ = h * h + g * g, v = smooth(clamp((s - _) * u)) * smooth(clamp((_ - c) * d));
					if (J = .065, Y = .025, X = .94, Z = .35, v === 0) return;
					let y = 0;
					for (let e = 0; e < t.mountingHoles; e++) {
						let n = (r * t.mountingHoles + e) * 2, i = h - o[n], a = g - o[n + 1], s = smooth(clamp((l - i * i - a * a) * f));
						y += (1 - y) * s;
					}
					let b = v * (1 - y);
					if (b === 0) return;
					let x = fract(t.flutes * (Math.atan2(g, h) * p - a[r]) + t.twist * _) * 2 - 1, S = 1 - x * x, C = S * S, w = m(W, G);
					J += b * (.48 + .18 * C + .03 * i[r] + .01 * w - J), Y += b * (.44 + .24 * C + .001 * w - Y), X += b * (.57 - .31 * C + .02 * w - X), Z += b * (.76 + .22 * C - Z);
				};
			}
			case `sharkteeth`: {
				let t = require_materials.proceduralMaterialPresets.sharkteeth, n = new Float64Array(t.cells * t.cells), i = new Float64Array(t.cells * t.cells), a = 1 / t.edgeBevel, o = 1 / t.serrationTipFade, s = 1 / t.serrationBaseFade, c = 1 / (t.rootWidth * t.rootWidth), l = 1 / (t.rootHeight * t.rootHeight), u = 1 / t.rootShoulder, d = cachedNoise(96, 96, r ^ 69653);
				for (let e = 0; e < n.length; e++) n[e] = hash(e, 0, r ^ 69649), i[e] = hash(e, 0, r ^ 69651);
				return () => {
					let e = W * t.cells, r = G * t.cells, f = Math.floor(e), p = Math.floor(r), m = p * t.cells + f, h = f + p & 1, g = h ? fract(e) - .5 : fract(r) - .5, _ = h ? fract(r) - .5 : fract(e) - .5, v = _ - t.crownTop, y = fract(v * t.serrationFrequency + i[m]) * 2 - 1, b = 1 - y * y, x = b * b * smooth(clamp(v * o)) * smooth(clamp((t.crownBottom - _) * s)), S = t.crownSlope * v + t.serrationAmplitude * x, C = smooth(clamp((S + g) * a)) * smooth(clamp((S - g) * a)) * smooth(clamp((t.crownBottom - _) * a)), w = smooth(clamp((t.neckWidth - Math.abs(g)) * a)) * smooth(clamp((_ - t.neckTop) * a)) * smooth(clamp((t.neckBottom - _) * a)), T = _ - t.rootY, E = g + t.rootOffset, D = g - t.rootOffset, O = T * T * l, k = clamp(1 - E * E * c - O), A = clamp(1 - D * D * c - O), j = smooth(clamp(k * u)), M = smooth(clamp(A * u)), N = j + (1 - j) * M;
					if (J = .04, Y = .025, X = .94, Z = .35, C === 0 && w === 0 && N === 0) return;
					let P = d(W, G), F = n[m];
					if (J += w * (.6 + .03 * F - J), Y += w * (.34 - Y), X += w * (.65 - X), Z += w * (.94 - Z), C > 0) {
						let e = S + t.crownDomeFloor, n = smooth(clamp(1 - g * g / (e * e)));
						J += C * (.85 + .035 * F + .006 * P - J), Y += C * (.52 + .17 * n + .001 * P - Y), X += C * (.27 + .015 * P - X), Z += C * (.98 - Z);
					}
					if (N > 0) {
						let e = (j * smooth(k) + M * smooth(A)) / (j + M);
						J += N * (.56 + .03 * F + .02 * P - J), Y += N * (.43 + .08 * e + .001 * P - Y), X += N * (.67 + .03 * P - X), Z += N * (.96 - Z);
					}
				};
			}
			case `bellpepperslices`: {
				let t = require_materials.proceduralMaterialPresets.bellpepperslices, i = new Float64Array(t.lobes * 2), a = new Float64Array(t.cells * t.cells), o = new Float64Array(t.cells * t.cells * t.lobes * 2), s = 1 / (t.outerRadius * t.outerRadius), c = 1 / (t.innerRadius * t.innerRadius), l = 1 / (t.coreRadius * t.coreRadius), u = 1 / (t.pithHalfWidth * t.pithHalfWidth), d = 1 / t.pithBevel, f = 1 / t.shoulder, p = 1 / (t.seedLength * t.seedLength), m = 1 / (t.seedWidth * t.seedWidth), h = 1 / t.seedShoulder, g = cachedNoise(96, 96, r ^ 69397);
				for (let e = 0; e < t.lobes; e++) i[e * 2] = Math.cos(n * e / t.lobes), i[e * 2 + 1] = Math.sin(n * e / t.lobes);
				for (let e = 0; e < a.length; e++) {
					a[e] = hash(e, 0, r ^ 69393);
					for (let n = 0; n < t.lobes * 2; n++) o[e * t.lobes * 2 + n] = hash(e, n, r ^ 69395);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), _ = Math.floor(n), v = _ * t.cells + r, y = r + _ & 1, b = y ? fract(e) - .5 : fract(n) - .5, x = y ? fract(n) - .5 : fract(e) - .5, S = clamp(1 - (b * b + x * x) * l), C = 0, w = 0, T = smooth(clamp(S * f)), E = 0, D = 0, O = 0, k = 0;
					for (let e = 0; e < t.lobes; e++) {
						let n = i[e * 2], r = i[e * 2 + 1], a = b * n + x * r, l = x * n - b * r, g = a - t.lobeOffset, _ = g * g + l * l, y = smooth(clamp((1 - _ * s) * f)), S = smooth(clamp((1 - _ * c) * f)), A = smooth(clamp(1 - l * l * u)) * smooth(clamp(a * d)) * smooth(clamp((t.pithEnd - a) * d));
						C += (1 - C) * y, w += (1 - w) * S, T += (1 - T) * A;
						let j = a - t.seedAlong;
						for (let n = 0; n < 2; n++) {
							let r = l - (n === 0 ? -t.seedOffset : t.seedOffset), i = clamp(1 - j * j * p - r * r * m), a = smooth(clamp(i * h));
							E += (1 - E) * a, D += a, O += a * (.96 + .035 * o[v * t.lobes * 2 + e * 2 + n]), k += a * (.43 + .07 * smooth(i));
						}
					}
					let A = C * (1 - w);
					if (T *= C, E *= C, J = .025, Y = .025, X = .94, Z = .3, A === 0 && T === 0 && E === 0) return;
					let j = g(W, G);
					J += A * (.28 + .035 * a[v] + .015 * j - J), Y += A * (.61 + .004 * j - Y), X += A * (.38 + .02 * j - X), Z += A * (.96 - Z), J += T * (.91 + .025 * a[v] + .01 * j - J), Y += T * (.32 + .004 * j - Y), X += T * (.58 + .01 * j - X), Z += T * (.9 - Z), E > 0 && (J += E * (O / D + .003 * j - J), Y += E * (k / D + .001 * j - Y), X += E * (.46 + .01 * j - X), Z += E * (.96 - Z));
				};
			}
			case `threadspools`: {
				let t = require_materials.proceduralMaterialPresets.threadspools, n = new Float64Array(t.cells * t.cells), i = new Float64Array(t.cells * t.cells), a = 1 / (t.coreWidth * t.coreWidth), o = 1 / (t.threadWidth * t.threadWidth), s = 1 / (t.flangeWidth * t.flangeWidth), c = 1 / (t.flangeHeight * t.flangeHeight), l = 1 / t.endBevel, u = 1 / t.shoulder, d = t.turns / t.windingLength, f = cachedNoise(96, 96, r ^ 69141);
				for (let e = 0; e < n.length; e++) n[e] = hash(e, 0, r ^ 69137), i[e] = hash(e, 0, r ^ 69139);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = Math.floor(e), m = Math.floor(r), h = m * t.cells + p, g = p + m & 1, _ = g ? fract(e) - .5 : fract(r) - .5, v = g ? fract(r) - .5 : fract(e) - .5, y = clamp(1 - _ * _ * a), b = smooth(clamp(y * u)) * smooth(clamp((t.coreHalfHeight - Math.abs(v)) * l)), x = clamp(1 - _ * _ * o), S = smooth(clamp(x * u)) * smooth(clamp((t.threadHalfHeight - Math.abs(v)) * l)), C = Math.abs(v) - t.flangeCenter, w = clamp(1 - _ * _ * s - C * C * c), T = smooth(clamp(w * u));
					if (J = .035, Y = .025, X = .94, Z = .35, b === 0 && S === 0 && T === 0) return;
					let E = f(W, G), D = .76 + .05 * n[h] + .03 * E;
					if (J += b * (D - J), Y += b * (.37 + .02 * smooth(y) - Y), X += b * (.5 + .02 * E - X), Z += b * (.97 - Z), S > 0) {
						let e = fract(v * d + t.windingSlope * _ + i[h]) * 2 - 1, r = 1 - e * e, a = r * r;
						J += S * (.13 + .04 * n[h] + .025 * a + .008 * E - J), Y += S * (.52 + .09 * smooth(x) + .025 * a + .001 * E - Y), X += S * (.76 + .02 * E + .02 * (1 - a) - X), Z += S * (.92 + .04 * a - Z);
					}
					J += T * (D - J), Y += T * (.66 + .05 * smooth(w) + .001 * E - Y), X += T * (.5 + .02 * E - X), Z += T * (.98 - Z);
				};
			}
			case `chessrooks`: {
				let t = require_materials.proceduralMaterialPresets.chessrooks, n = new Float64Array(t.cells * t.cells), i = 1 / t.edgeBevel, a = 1 / t.wideningLength, o = 1 / t.shaftShoulder, s = 1 / t.ellipseShoulder, c = 1 / (t.crownHalfWidth * t.crownHalfWidth), l = 1 / (t.topCollarWidth * t.topCollarWidth), u = 1 / (t.topCollarHeight * t.topCollarHeight), d = 1 / (t.lowerCollarWidth * t.lowerCollarWidth), f = 1 / (t.lowerCollarHeight * t.lowerCollarHeight), p = 1 / (t.baseWidth * t.baseWidth), m = 1 / (t.baseHeight * t.baseHeight), h = cachedNoise(96, 96, r ^ 68883);
				for (let e = 0; e < n.length; e++) n[e] = hash(e, 0, r ^ 68881);
				return () => {
					let e = W * t.cells, r = G * t.cells, g = Math.floor(e), _ = Math.floor(r), v = g + _ & 1, y = v ? fract(e) - .5 : fract(r) - .5, b = v ? fract(r) - .5 : fract(e) - .5, x = t.neckWidth + t.shaftWidening * smooth(clamp((b - t.wideningStart) * a)), S = clamp(1 - y * y / (x * x)), C = smooth(S), w = smooth(clamp(S * o)) * smooth(clamp((b - t.shaftTop) * i)) * smooth(clamp((t.shaftBottom - b) * i)), T = smooth(clamp((t.notchBottom - b) * i)), E = T * smooth(clamp((t.notchHalfWidth - Math.abs(y + t.notchOffset)) * i)), D = T * smooth(clamp((t.notchHalfWidth - Math.abs(y - t.notchOffset)) * i)), O = smooth(clamp((t.crownHalfWidth - Math.abs(y)) * i)) * smooth(clamp((b - t.crownTop) * i)) * smooth(clamp((t.crownBottom - b) * i)) * (1 - E) * (1 - D), k = b - t.topCollarY, A = clamp(1 - y * y * l - k * k * u), j = smooth(clamp(A * s)), M = b - t.lowerCollarY, N = clamp(1 - y * y * d - M * M * f), P = smooth(clamp(N * s)), F = b - t.baseY, I = clamp(1 - y * y * p - F * F * m), L = smooth(clamp(I * s)), R = w + O + j + P + L;
					if (J = .04, Y = .025, X = .94, Z = .35, R === 0) return;
					let z = w;
					z += (1 - z) * O, z += (1 - z) * j, z += (1 - z) * P, z += (1 - z) * L;
					let ee = h(W, G), te = (w * (.44 + .1 * C) + O * (.62 + .03 * smooth(clamp(1 - y * y * c))) + j * (.59 + .04 * smooth(A)) + P * (.59 + .04 * smooth(N)) + L * (.64 + .05 * smooth(I))) / R;
					J += z * (.8 + .045 * n[_ * t.cells + g] + .009 * ee - J), Y += z * (te + .001 * ee - Y), X += z * (.38 + .015 * ee - X), Z += z * (.98 - Z);
				};
			}
			case `woodenspoons`: {
				let t = require_materials.proceduralMaterialPresets.woodenspoons, n = new Float64Array(t.cells * t.cells), i = 1 / (t.bowlWidth * t.bowlWidth), a = 1 / (t.bowlHeight * t.bowlHeight), o = 1 / t.bowlShoulder, s = 1 / t.cavityRadiusSquared, c = 1 / t.handleEndBevel, l = 1 / t.handleShoulder, u = 1 / t.wideningLength, d = cachedNoise(128, 16, r ^ 68627), f = cachedNoise(96, 96, r ^ 68629);
				for (let e = 0; e < n.length; e++) n[e] = hash(e, 0, r ^ 68625);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = Math.floor(e), m = Math.floor(r), h = m * t.cells + p, g = p + m & 1, _ = g ? fract(e) - .5 : fract(r) - .5, v = g ? fract(r) - .5 : fract(e) - .5, y = v - t.bowlY, b = _ * _ * i + y * y * a, x = smooth(clamp((1 - b) * o)), S = smooth(clamp(1 - b * s)), C = t.neckWidth + t.handleWidening * smooth(clamp((v - t.wideningStart) * u)), w = clamp(1 - _ * _ / (C * C)), T = smooth(clamp(w * l)) * smooth(clamp((v - t.handleTop) * c)) * smooth(clamp((t.handleBottom - v) * c));
					if (J = .04, Y = .025, X = .94, Z = .35, x === 0 && T === 0) return;
					let E = d((p + .5 + _) / t.cells, (m + .5 + v) / t.cells), D = f(W, G), O = .72 + .06 * n[h] + .065 * E + .008 * D;
					J += T * (O - J), Y += T * (.5 + .045 * smooth(w) + .001 * D - Y), X += T * (.55 + .025 * E + .01 * D - X), Z += T * (.97 - Z), J += x * (O - .16 * S - J), Y += x * (.69 - .25 * S + .001 * D - Y), X += x * (.53 + .025 * E + .01 * D + .035 * S - X), Z += x * (.98 - .16 * S - Z);
				};
			}
			case `dominoes`: {
				let t = require_materials.proceduralMaterialPresets.dominoes, n = new Float64Array(t.cells * t.cells), i = new Uint8Array(t.cells * t.cells * 2), a = [
					0,
					8,
					65,
					73,
					99,
					107,
					119
				], o = [
					-t.pipX,
					t.pipX,
					-t.pipX,
					0,
					t.pipX,
					-t.pipX,
					t.pipX
				], s = [
					-t.pipY,
					-t.pipY,
					0,
					0,
					0,
					t.pipY,
					t.pipY
				], c = 1 / t.halfWidth, l = 1 / t.halfHeight, u = 1 / t.shoulder, d = 1 / (t.pipRadius * t.pipRadius), f = 1 / t.pipShoulder, p = 1 / (t.dividerHalfWidth * t.dividerHalfWidth), m = 1 / (t.dividerHalfHeight * t.dividerHalfHeight), h = cachedNoise(96, 96, r ^ 68375);
				for (let e = 0; e < n.length; e++) n[e] = hash(e, 0, r ^ 68369), i[e * 2] = a[Math.floor(hash(e, 0, r ^ 68371) * 7)], i[e * 2 + 1] = a[Math.floor(hash(e, 1, r ^ 68373) * 7)];
				return () => {
					let e = W * t.cells, r = G * t.cells, a = Math.floor(e), g = Math.floor(r), _ = g * t.cells + a, v = a + g & 1, y = v ? fract(e) - .5 : fract(r) - .5, b = v ? fract(r) - .5 : fract(e) - .5, x = y * c, S = b * l, C = x * x, w = S * S, T = smooth(clamp((1 - C * C * C * C - w * w * w * w) * u));
					if (J = .035, Y = .025, X = .94, Z = .35, T === 0) return;
					let E = h(W, G), D = b < 0 ? 0 : 1, O = b + (D === 0 ? t.halfCenter : -t.halfCenter), k = i[_ * 2 + D], A = smooth(clamp(1 - y * y * p)) * smooth(clamp(1 - b * b * m)), j = 0;
					for (let e = 0; e < 7; e++) {
						if (!(k & 1 << e)) continue;
						let t = y - o[e], n = O - s[e], r = smooth(clamp((1 - (t * t + n * n) * d) * f));
						j += (1 - j) * r;
					}
					let M = .83 + .035 * n[_] + .006 * E, N = M + A * (.34 - M), P = .62 + .001 * E - .035 * A;
					J += T * (N + j * (.055 - N) - J), Y += T * (P + j * (.515 - P) - Y), X += T * (.31 + .01 * E + .15 * A + .23 * j - X), Z += T * (.99 - .12 * A - .26 * j - Z);
				};
			}
			case `porcelaininsulators`: {
				let t = require_materials.proceduralMaterialPresets.porcelaininsulators, n = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 68113);
				let i = 1 / (t.coreWidth * t.coreWidth), a = 1 / t.endBevel, o = 1 / t.skirtWidth, s = 1 / t.skirtHeight, c = 1 / t.capWidth, l = 1 / t.capHeight, u = 1 / t.shoulder, d = cachedNoise(96, 96, r ^ 68115);
				return () => {
					let e = W * t.cells, r = G * t.cells, f = Math.floor(e), p = Math.floor(r), m = p + f & 1, h = fract(e) - .5, g = fract(r) - .5, _ = m ? g : h, v = m ? -h : g, y = clamp(1 - _ * _ * i), b = smooth(clamp(y * u)) * smooth(clamp((v - t.coreTop) * a)) * smooth(clamp((t.coreBottom - v) * a)), x = _ * c, S = (v - t.capY) * l, C = clamp(1 - x * x - S * S), w = smooth(clamp(C * u)), T = 1, E = 1;
					for (let e = 0; e < t.skirts; e++) {
						let n = _ * o, r = (v - t.firstSkirt - e * t.skirtPitch) * s, i = clamp(1 - n * n - r * r), a = smooth(clamp(i * u));
						T *= 1 - a, E *= 1 - a * smooth(i);
					}
					J = .045, Y = .025, X = .94, Z = .3;
					let D = 1 - T;
					if (b === 0 && D === 0 && w === 0) return;
					let O = d(W, G), k = .8 + .055 * n[p * t.cells + f] + .02 * O;
					J += b * (k - .075 - J), Y += b * (.34 + .06 * smooth(y) + .002 * O - Y), X += b * (t.roughness + .045 + .02 * O - X), Z += b * (.85 - Z), J += D * (k + .04 * (1 - E) - J), Y += D * (.56 + .17 * (1 - E) + .002 * O - Y), X += D * (t.roughness + .015 * O - X), Z += D * (.92 + .06 * (1 - E) - Z), J += w * (k + .035 * smooth(C) - J), Y += w * (.57 + .1 * smooth(C) + .002 * O - Y), X += w * (t.roughness + .015 * O - X), Z += w * (.94 + .04 * smooth(C) - Z);
				};
			}
			case `matchsticks`: {
				let t = require_materials.proceduralMaterialPresets.matchsticks, i = new Float64Array(t.cells * t.cells), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o;
					i[s] = n * hash(o, e, r ^ 67857), a[s] = hash(o, e, r ^ 67859);
				}
				let o = 1 / t.sideBevel, s = 1 / t.endBevel, c = 1 / t.headWidth, l = 1 / t.headLength, u = 1 / t.headShoulder, d = cachedNoise(128, 128, r ^ 67863);
				return () => {
					let e = W * t.cells, r = G * t.cells, f = Math.floor(e), p = Math.floor(r), m = p + f & 1, h = fract(e) - .5, g = fract(r) - .5, _ = m ? g : h, v = m ? -h : g, y = smooth(clamp((t.shaftHalfWidth - Math.abs(_)) * o)) * smooth(clamp((v - t.shaftTop) * s)) * smooth(clamp((t.shaftBottom - v) * s)), b = _ * c, x = (v - t.headY) * l, S = clamp(1 - b * b - x * x), C = smooth(clamp(S * u));
					if (J = .025, Y = .025, X = .98, Z = .34, y === 0 && C === 0) return;
					let w = p * t.cells + f, T = a[w], E = d(W, G);
					if (y > 0) {
						let e = .5 + .5 * Math.sin(n * t.grainFrequency * _ + .35 * Math.sin(n * 1.5 * v + i[w]) + i[w]), r = e ** 8;
						J += y * (.79 + .07 * T + .04 * e - .035 * r - J), Y += y * (.39 + .003 * e - .002 * r - Y), X += y * (t.roughness + .045 * r - X), Z += y * (.98 - .015 * r - Z);
					}
					let D = smooth(S);
					J += C * (.13 + .055 * T + .045 * E - J), Y += C * (.52 + .22 * D + .006 * E - Y), X += C * (t.headRoughness + .03 * E - X), Z += C * (.9 + .08 * D - Z);
				};
			}
			case `leatherbookspines`: {
				let t = require_materials.proceduralMaterialPresets.leatherbookspines, n = new Float64Array(t.columns);
				for (let e = 0; e < t.columns; e++) n[e] = hash(e, 0, r ^ 67601);
				let i = 1 / t.edge, a = 1 / t.halfWidth, o = 1 / t.bandWidth, s = 1 / t.frameHalfWidth, c = 1 / t.frameHalfHeight, l = 1 / t.panelHalfWidth, u = 1 / t.panelHalfHeight, d = 1 / t.frameShoulder, f = 1 / t.poreShoulder, p = cachedNoise(128, 256, r ^ 67603), m = cachedNoise(256, 256, r ^ 67605);
				return () => {
					let e = W * t.columns, r = Math.floor(e), h = fract(e) - .5, g = G - .5, _ = smooth(clamp((t.halfWidth - Math.abs(h)) * i)) * smooth(clamp((t.halfHeight - Math.abs(g)) * i));
					if (J = .045, Y = .025, X = .94, Z = .3, _ === 0) return;
					let v = h * a, y = smooth(clamp(1 - v * v)), b = g + t.bandCurve * v * v, x = 1;
					for (let e of t.bands) {
						let t = (b - e) * o;
						x *= 1 - smooth(clamp(1 - t * t));
					}
					let S = 1 - x, C = h * s, w = g * c, T = h * l, E = g * u, D = smooth(clamp((1 - C ** 4 - w ** 4) * d)), O = smooth(clamp((1 - T ** 4 - E ** 4) * d)), k = D * (1 - O), A = p(W, G), j = smooth(clamp((m(W, G) - t.poreThreshold) * f));
					J += _ * (.28 + .35 * n[r] + .12 * y + .04 * S + .018 * A - .035 * j + .06 * k - .035 * O - J), Y += _ * (.42 + .16 * y + t.bandLift * S + t.frameLift * k - t.panelDepth * O + .003 * A - .002 * j - Y), X += _ * (t.roughness + .07 * j - .06 * O - .035 * k + .02 * A - X), Z += _ * (.88 + .09 * y + .025 * S + .01 * k - .035 * O - .015 * j - Z);
				};
			}
			case `poppyseedpods`: {
				let t = require_materials.proceduralMaterialPresets.poppyseedpods, i = new Float64Array(t.lobes * 2), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.lobes; e++) {
					let r = n * e / t.lobes;
					i[e * 2] = Math.cos(r), i[e * 2 + 1] = Math.sin(r);
				}
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) a[e * t.cells + n] = hash(n, e, r ^ 67345);
				let o = 1 / t.bodyWidth, s = 1 / t.bodyLength, c = 1 / t.bodyShoulder, l = 1 / t.stemWidth, u = 1 / t.stemBevel, d = 1 / t.crownWidth, f = 1 / t.crownHeight, p = t.crownCore * t.crownCore, m = (t.lobeDistance + t.lobeLength) ** 2, h = 1 / t.lobeLength, g = 1 / t.lobeWidth, _ = 1 / t.rayLength, v = 1 / t.rayWidth, y = 1 / t.crownShoulder, b = cachedNoise(96, 96, r ^ 67347);
				return () => {
					let e = W * t.cells, r = G * t.cells, x = Math.floor(e), S = Math.floor(r), C = S + x & 1, w = fract(e) - .5, T = fract(r) - .5, E = C ? T : w, D = C ? -w : T, O = E * o, k = (D - t.bodyY) * s, A = clamp(1 - O * O - k * k), j = smooth(clamp(A * c)), M = E * l, N = smooth(clamp(1 - M * M)) * smooth(clamp((D - t.stemTop) * u)) * smooth(clamp((t.stemBottom - D) * u)), P = E * d, F = (D - t.crownY) * f, I = P * P + F * F, L = 0, R = 0;
					if (I < m) {
						let e = 1 - smooth(clamp((p - I) * y)), n = 1;
						for (let r = 0; r < i.length; r += 2) {
							let a = P * i[r] + F * i[r + 1], o = F * i[r] - P * i[r + 1], s = (a - t.lobeDistance) * h, c = o * g, l = (a - t.rayDistance) * _, u = o * v;
							e *= 1 - smooth(clamp((1 - s * s - c * c) * y)), n *= 1 - smooth(clamp((1 - l * l - u * u) * y));
						}
						L = 1 - e, R = 1 - n;
					}
					if (J = .045, Y = .025, X = .94, Z = .34, N === 0 && j === 0 && L === 0) return;
					let z = b(W, G), ee = a[S * t.cells + x];
					if (J += N * (.34 + .04 * ee + .02 * z - J), Y += N * (.22 + .002 * z - Y), X += N * (.85 - X), Z += N * (.93 - Z), j > 0) {
						let e = smooth(A), r = smooth(clamp(1 - k * k)), i = t.widthFloor + (1 - t.widthFloor) * r, a = .5 + .5 * Math.cos(n * t.ribs * O / i);
						J += j * (.58 + .13 * e + .06 * ee + .02 * z - .07 * e * (1 - a) - J), Y += j * (.39 + .23 * e + .035 * e * a + .003 * z - Y), X += j * (t.roughness + .035 * (1 - a) + .015 * z - X), Z += j * (.85 + .12 * e - .025 * e * (1 - a) - Z);
					}
					J += L * (.68 + .04 * ee + .015 * z + .1 * R - J), Y += L * (.77 + .02 * R + .002 * z - Y), X += L * (.76 - .045 * R + .02 * z - X), Z += L * (.95 + .03 * R - Z);
				};
			}
			case `safetypins`: {
				let t = require_materials.proceduralMaterialPresets.safetypins, n = new Float64Array(t.legs.length * 5), i = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.legs.length; e++) {
					let [r, i, a, o] = t.legs[e], s = a - r, c = o - i;
					n[e * 5] = r, n[e * 5 + 1] = i, n[e * 5 + 2] = s, n[e * 5 + 3] = c, n[e * 5 + 4] = 1 / (s * s + c * c);
				}
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) i[e * t.cells + n] = hash(n, e, r ^ 67089);
				let a = 1 / (t.wireRadius * t.wireRadius), o = t.coilRadius * t.coilRadius, s = 1 / (2 * t.coilRadius * t.wireRadius), c = 1 / t.shoulder, l = 1 / t.guardHalfWidth, u = 1 / t.guardHalfHeight, d = 1 / t.guardShoulder, f = 1 / t.slotHalfWidth, p = 1 / t.slotHalfHeight, m = cachedNoise(96, 96, r ^ 67091);
				return () => {
					let e = W * t.cells, r = G * t.cells, h = Math.floor(e), g = Math.floor(r), _ = g + h & 1, v = fract(e) - .5, y = fract(r) - .5, b = _ ? y : v, x = _ ? -v : y, S = x - t.coilY, C = (b * b + S * S - o) * s, w = clamp(1 - C * C), T = smooth(clamp(w * c)), E = 1 - T, D = 1 - T * smooth(w);
					for (let e = 0; e < n.length; e += 5) {
						let t = b - n[e], r = x - n[e + 1], i = clamp((t * n[e + 2] + r * n[e + 3]) * n[e + 4]), o = t - i * n[e + 2], s = r - i * n[e + 3], l = clamp(1 - (o * o + s * s) * a), u = smooth(clamp(l * c));
						E *= 1 - u, D *= 1 - u * smooth(l);
					}
					let O = (b - t.guardX) * l, k = (x - t.guardY) * u, A = smooth(clamp((1 - O * O - k * k) * d)), j = 1 - E;
					if (J = .045, Y = .035, X = .94, Z = .3, j === 0 && A === 0) return;
					let M = 1 - D, N = i[g * t.cells + h], P = m(W, G), F = (b - t.slotX) * f, I = (x - t.guardY) * p, L = smooth(clamp(1 - F * F - I * I));
					J += j * (.52 + .21 * M + .05 * N + .015 * P - J), Y += j * (.485 + .2 * M + .003 * P - Y), X += j * (t.roughness - .045 * M + .02 * P - X), Z += j * (.72 + .26 * M - Z), J += A * (.78 + .04 * N + .015 * P - .18 * L - J), Y += A * (.78 + .002 * P - t.slotDepth * L - Y), X += A * (t.roughness + .04 + .08 * L - X), Z += A * (.98 - .09 * L - Z);
				};
			}
			case `musselshells`: {
				let t = require_materials.proceduralMaterialPresets.musselshells, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 2;
					i[o] = n * hash(a, e, r ^ 66817), i[o + 1] = hash(a, e, r ^ 66819);
				}
				let a = 1 / (2 * t.halfLength), o = 1 / (t.maxHalfWidth * t.maxHalfWidth), s = 1 / t.edge, c = n * t.growthBands / (4 * t.halfLength * t.halfLength), l = cachedNoise(96, 96, r ^ 66823);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), u = Math.floor(n), d = u + r & 1, f = fract(e) - .5, p = fract(n) - .5, m = d ? p : f, h = d ? -f : p;
					if (J = .045, Y = .025, X = .94, Z = .33, h <= -t.halfLength || h >= t.halfLength) return;
					let g = h + t.halfLength, _ = g * a, v = 27 / 4 * _ * _ * (1 - _) - m * m * o;
					if (v <= 0) return;
					let y = smooth(clamp(v * s)), b = smooth(clamp(v)), x = (u * t.cells + r) * 2, S = (.5 + .5 * Math.cos(c * (m * m + g * g) + i[x])) ** 8, C = l(W, G);
					J += y * (.32 + .16 * b + .08 * i[x + 1] - .085 * S + .015 * C - J), Y += y * (.37 + .31 * b - t.incision * S + .003 * C - Y), X += y * (t.roughness + .035 * S + .02 * C - X), Z += y * (.84 + .13 * b - .025 * S - Z);
				};
			}
			case `blackberries`: {
				let t = require_materials.proceduralMaterialPresets.blackberries, n = (t.rows - 1) * .5, i = t.pitch * Math.sqrt(3) * .5, a = 0;
				for (let e = 0; e < t.rows; e++) a += t.rows - Math.abs(e - n);
				let o = new Float64Array(a * 2), s = new Float64Array(t.cells * t.cells * a), c = 0;
				for (let e = 0; e < t.rows; e++) {
					let r = t.rows - Math.abs(e - n);
					for (let a = 0; a < r; a++) o[c++] = (a - (r - 1) * .5) * t.pitch, o[c++] = (e - n) * i;
				}
				for (let e = 0; e < t.cells * t.cells; e++) for (let t = 0; t < a; t++) s[e * a + t] = hash(t, e, r ^ 66577);
				let l = n * t.pitch + t.drupeRadius, u = n * i + t.drupeRadius, d = 1 / (t.drupeRadius * t.drupeRadius), f = 1 / t.stretch, p = 1 / t.shoulder, m = cachedNoise(96, 96, r ^ 66579);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), i = Math.floor(n), c = i + r & 1, h = fract(e) - .5, g = fract(n) - .5, _ = c ? g : h, v = (c ? -h : g) * f;
					if (J = .055, Y = .025, X = .94, Z = .33, Math.abs(_) >= l || Math.abs(v) >= u) return;
					let y = 1, b = 0, x = 0, S = 0, C = (i * t.cells + r) * a;
					for (let e = 0; e < a; e++) {
						let t = _ - o[e * 2], n = v - o[e * 2 + 1], r = 1 - (t * t + n * n) * d;
						if (r <= 0) continue;
						let i = smooth(clamp(r * p));
						y *= 1 - i, b += i, x += i * r, S += i * s[C + e];
					}
					if (b > 0) {
						let e = 1 - y, n = x / b, r = S / b, i = m(W, G);
						J += e * (.44 + .3 * n + .08 * r + .015 * i - J), Y += e * (.38 + .35 * n + .003 * i - Y), X += e * (t.roughness - .06 * n + .025 * i - X), Z += e * (.62 + .36 * n - Z);
					}
				};
			}
			case `haircombs`: {
				let t = require_materials.proceduralMaterialPresets.haircombs, n = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 66337);
				let i = t.toothSpan / (t.teeth - 1), a = 1 / i, o = 1 / t.toothHalfWidth, s = 1 / (t.tipY - t.rootY), c = 1 / t.tipShoulder, l = 1 / t.bevel, u = cachedNoise(96, 96, r ^ 66339);
				return () => {
					let e = W * t.cells, r = G * t.cells, d = Math.floor(e), f = Math.floor(r), p = f + d & 1, m = fract(e) - .5, h = fract(r) - .5, g = p ? h : m, _ = p ? -m : h, v = smooth(clamp((t.spineHalfWidth - Math.abs(g)) * l)) * smooth(clamp((_ - t.spineTop) * l)) * smooth(clamp((t.spineBottom - _) * l)), y = Math.floor((g - t.firstTooth) * a + .5), b = 0;
					if (y >= 0 && y < t.teeth && _ > t.rootY && _ < t.tipY) {
						let e = smooth(clamp((_ - t.rootY) * s)), n = (g - t.firstTooth - y * i) * o / (1 - t.taper * e);
						b = smooth(clamp(1 - n * n)) * smooth(clamp((_ - t.rootY) * l)) * smooth(clamp((t.tipY - _) * c));
					}
					let x = 1 - (1 - v) * (1 - b), S = u(W, G);
					J = .055 + x * (.63 + .08 * n[f * t.cells + d] + .015 * S), Y = .025 + x * (.595 + .002 * S), X = .94 + x * (t.roughness - .94 + .018 * S), Z = .4 + .58 * x;
				};
			}
			case `corrugatedplasticedge`: {
				let t = require_materials.proceduralMaterialPresets.corrugatedplasticedge, n = new Float64Array(t.rows);
				for (let e = 0; e < t.rows; e++) n[e] = hash(0, e, r ^ 66193);
				let i = 1 / t.linerHalfWidth, a = 1 / t.webHalfWidth, o = 1 / t.jointShoulder, s = cachedNoise(64, 64, r ^ 66195);
				return () => {
					let e = G * t.rows, r = Math.floor(e), c = fract(W * t.columns + (r & 1) * .5) - .5, l = fract(e) - .5, u = (Math.abs(l) - t.linerCenter) * i, d = smooth(clamp(1 - u * u)), f = c * a, p = smooth(clamp(1 - f * f)) * smooth(clamp((t.linerCenter + t.linerHalfWidth - Math.abs(l)) * o)), m = 1 - (1 - d) * (1 - p), h = s(W, G);
					J = .045 + m * (.575 + .06 * n[r] + .02 * h), Y = .035 + m * (.645 + .003 * h), X = .94 + m * (t.roughness - .94 + .02 * h), Z = .26 + .71 * m;
				};
			}
			case `pencilends`: {
				let t = require_materials.proceduralMaterialPresets.pencilends, i = /* @__PURE__ */ new Float64Array(6), a = new Float64Array(t.cells * t.cells), o = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < 3; e++) {
					let t = Math.PI * e / 3;
					i[e * 2] = Math.cos(t), i[e * 2 + 1] = Math.sin(t);
				}
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let s = e * t.cells + i;
					a[s] = n * hash(i, e, r ^ 65937), o[s] = hash(i, e, r ^ 65939);
				}
				let s = 1 / t.outerBevel, c = 1 / t.woodBevel, l = t.coreRadius * t.coreRadius, u = 1 / (l - t.coreInner * t.coreInner), d = Math.cos(t.turn), f = Math.sin(t.turn), p = cachedNoise(96, 96, r ^ 65941);
				return () => {
					let e = W * t.cells, r = G * t.cells, m = Math.floor(e), h = Math.floor(r), g = fract(e) - .5, _ = fract(r) - .5, v = m + h & 1, y = v ? d * g + f * _ : g, b = v ? d * _ - f * g : _, x = 1, S = 1;
					for (let e = 0; e < i.length; e += 2) {
						let n = Math.abs(y * i[e] + b * i[e + 1]);
						x *= smooth(clamp((t.apothem - n) * s)), S *= smooth(clamp((t.woodApothem - n) * c));
					}
					if (J = .055, Y = .025, X = .94, Z = .38, x === 0) return;
					let C = h * t.cells + m, w = p(W, G), T = .5 + .5 * Math.sin(n * (t.grainFrequency * b + t.grainWarp * Math.sin(n * 2 * y + a[C])) + a[C]), E = T ** 8, D = S * smooth(clamp((l - y * y - b * b) * u));
					J += x * (.22 + .025 * o[C] + .01 * w - J), Y += x * (.58 - Y), X += x * (t.paintRoughness - X), Z += x * (.96 - Z), J += S * (.72 + .09 * T + .035 * o[C] - .035 * E - J), Y += S * (.54 + .003 * w - .002 * E - Y), X += S * (t.roughness + .035 * E - X), Z += S * (.97 - Z), J += D * (.035 + .015 * w - J), Y += D * (.525 + .001 * w - Y), X += D * (t.coreRoughness - X), Z += D * (.95 - Z);
				};
			}
			case `carabiners`: {
				let t = require_materials.proceduralMaterialPresets.carabiners, n = new Float64Array(t.vertices.length * 7), i = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.vertices.length; e++) {
					let r = t.vertices[e], i = t.vertices[(e + 1) % t.vertices.length], a = i[0] - r[0], o = i[1] - r[1], s = 1 / Math.sqrt(a * a + o * o), c = e * 7;
					n[c] = r[0], n[c + 1] = r[1], n[c + 2] = a, n[c + 3] = o, n[c + 4] = s * s, n[c + 5] = -o * s, n[c + 6] = a * s;
				}
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) i[e * t.cells + n] = hash(n, e, r ^ 65681);
				let a = t.rounding * t.rounding, o = 1 / t.frameBand, s = 1 / t.shoulder, c = 1 / t.gateShoulder, l = 1 / t.jointWidth, u = 1 / (t.pinRadius * t.pinRadius), d = t.gateEdge * 7, f = n[d] + t.pinAt * n[d + 2] + t.rounding * n[d + 5], p = n[d + 1] + t.pinAt * n[d + 3] + t.rounding * n[d + 6], m = cachedNoise(8, 128, r ^ 65683);
				return () => {
					let e = W * t.cells, r = G * t.cells, h = Math.floor(e), g = Math.floor(r), _ = fract(e) - .5, v = fract(r) - .5, y = h + g & 1, b = y ? v : _, x = y ? -_ : v;
					J = .055, Y = .025, X = .94, Z = .36;
					let S = !1, C = 1 / 0, w = 0, T = 0;
					for (let e = 0; e < n.length; e += 7) {
						let t = b - n[e], r = x - n[e + 1], i = n[e + 2], a = n[e + 3], o = clamp((t * i + r * a) * n[e + 4]), s = t - o * i, c = r - o * a, l = s * s + c * c;
						i * r - a * t > 0 && (S = !0), l < C && (C = l, w = e, T = o);
					}
					if (!S) return;
					let E = (C - a) * o, D = clamp(1 - E * E), O = smooth(clamp(D * s));
					if (O === 0) return;
					let k = 0, A = 0;
					if (w === d) {
						k = smooth(clamp((T - t.gateStart) * c)) * smooth(clamp((t.gateEnd - T) * c));
						let e = (T - t.gateStart) * l, n = (T - t.gateEnd) * l;
						A = smooth(clamp(1 - e * e)) + smooth(clamp(1 - n * n));
					}
					let j = m(W, G), M = i[g * t.cells + h];
					J += O * (.56 + .2 * D + .03 * M + .012 * j + .12 * k - .2 * A - J), Y += O * (.4 + .12 * D + .035 * k - .07 * A - Y), X += O * (t.roughness - .05 * D - .025 * k + .12 * A - X), Z += O * (.96 - .12 * A - Z);
					let N = b - f, P = x - p, F = clamp(1 - (N * N + P * P) * u), I = O * smooth(clamp(F * s));
					J += I * (.9 - J), Y += I * (.68 + .04 * F - Y), X += I * (.21 - X), Z += I * (.99 - Z);
				};
			}
			case `cottonbolls`: {
				let t = require_materials.proceduralMaterialPresets.cottonbolls, i = new Float64Array(t.tufts * 4), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.tufts; e++) {
					let r = n * e / t.tufts;
					i[e * 4] = Math.cos(r), i[e * 4 + 1] = Math.sin(r), i[e * 4 + 2] = Math.cos(r + Math.PI / 4), i[e * 4 + 3] = Math.sin(r + Math.PI / 4);
				}
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) a[e * t.cells + n] = hash(n, e, r ^ 65425);
				let o = 1 / (t.tuftRadius * t.tuftRadius), s = 1 / t.tuftShoulder, c = 1 / t.bractLength, l = 1 / t.bractWidth, u = 1 / t.bractShoulder, d = cachedNoise(256, 256, r ^ 65427), f = cachedNoise(96, 96, r ^ 65429);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), p = Math.floor(n), m = fract(e) - .5, h = fract(n) - .5, g = r + p & 1, _ = g ? (m + h) * Math.SQRT1_2 : m, v = g ? (h - m) * Math.SQRT1_2 : h, y = 1, b = 1, x = 0, S = 0;
					for (let e = 0; e < i.length; e += 4) {
						let n = _ - t.tuftDistance * i[e], r = v - t.tuftDistance * i[e + 1], a = clamp(1 - (n * n + r * r) * o), d = smooth(clamp(a * s)), f = (_ * i[e + 2] + v * i[e + 3] - t.bractDistance) * c, p = (v * i[e + 2] - _ * i[e + 3]) * l, m = clamp(1 - f * f), h = smooth(clamp((m * m - p * p) * u));
						y *= 1 - d, b *= 1 - h, x += d, S += d * a;
					}
					let C = 1 - b, w = d(W, G), T = .65 * w + .35 * f(W, G);
					if (J = .055 + C * (.18 + .05 * w), Y = .025 + C * .145, X = .94 - C * .09, Z = .38 + C * .52, x > 0) {
						let e = 1 - y, n = S / x, i = a[p * t.cells + r];
						J += e * (.78 + .12 * n + .035 * i - .045 * T - J), Y += e * (.5 + .22 * n + .005 * w - Y), X += e * (t.roughness - .02 + .06 * T - X), Z += e * (.86 + .12 * n - Z);
					}
				};
			}
			case `waxseals`: {
				let t = require_materials.proceduralMaterialPresets.waxseals, i = new Float64Array(t.cells * t.cells), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o;
					i[s] = n * hash(o, e, r ^ 65169), a[s] = hash(o, e, r ^ 65171);
				}
				let o = t.edgeGuard * t.edgeGuard, s = t.emblemGuard * t.emblemGuard, c = 1 / (t.radius * t.radius), l = t.stampRadius * t.stampRadius, u = 1 / (l - t.stampCore * t.stampCore), d = t.ringRadius * t.ringRadius, f = 1 / t.ringBand, p = cachedNoise(96, 96, r ^ 65173);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, m = fract(n) - .5, h = r * r + m * m, g = Math.floor(n) * t.cells + Math.floor(e), _ = i[g], v = h > s ? Math.atan2(m, r) : 0, y = 1, b = 1;
					if (h > o) {
						let e = t.radius + t.rippleA * Math.cos(t.wavesA * v + _) + t.rippleB * Math.cos(t.wavesB * v + .7 * _);
						y = smooth(clamp((e * e - h) / (e * e - (e - t.edgeBevel) ** 2)));
					}
					if (h > s) {
						let e = t.emblemRadius + t.emblemDepth * Math.cos(t.emblemLobes * (v + _));
						b = smooth(clamp((e * e - h) / (e * e - (e - t.emblemBevel) ** 2)));
					}
					let x = 1 - smooth(clamp(h * c)), S = smooth(clamp((l - h) * u)), C = (h - d) * f, w = smooth(clamp(1 - C * C)), T = p(W, G);
					J = .065 + y * (.395 + .12 * x + .04 * a[g] + .015 * T - .055 * S + .09 * w + .16 * b), Y = .025 + y * (.255 + .08 * x - .07 * S + .1 * w + .18 * b + .001 * T), X = .94 + y * (t.roughness - .94 + .055 * S - .06 * w - .075 * b + .01 * T), Z = .38 + y * (.52 - .06 * S + .06 * w + .08 * b);
				};
			}
			case `scoredmango`: {
				let t = require_materials.proceduralMaterialPresets.scoredmango, n = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 64913);
				let i = 1 / t.skinWidth, a = 1 / t.skinLength, o = 1 / t.fleshWidth, s = 1 / t.fleshLength, c = 1 / t.shoulder, l = 1 / t.pitchX, u = 1 / t.pitchY, d = 1 / t.cutShoulder, f = cachedNoise(96, 96, r ^ 64915);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = Math.floor(e), m = Math.floor(r), h = fract(e) - .5, g = fract(r) - .5, _ = p + m & 1, v = _ ? g : h, y = _ ? -h : g, b = clamp(1 - (v * i) ** 2 - (y * a) ** 2), x = smooth(clamp(b * c)), S = clamp(1 - (v * o) ** 2 - (y * s) ** 2), C = smooth(clamp(S * c)), w = f(W, G), T = n[m * t.cells + p];
					J = .055 + x * (.125 + .06 * w), Y = .025 + x * (.145 + .05 * b), X = .94 + x * (.76 - .94), Z = .38 + x * .42, J += C * (.48 + .03 * S + .03 * T + .015 * w - J), Y += C * (.27 + .06 * S - Y), X += C * (t.roughness + .14 - X), Z += C * (.74 - Z);
					let E = fract(v * l) - .5, D = fract(y * u + .5) - .5, O = C * smooth(clamp((.5 - Math.abs(E) - t.cutGap) * d)) * smooth(clamp((.5 - Math.abs(D) - t.cutGap) * d)), k = clamp(1 - 4 * E * E) * clamp(1 - 4 * D * D);
					J += O * (.72 + .15 * k + .03 * T + .015 * w - J), Y += O * (.48 + .24 * k + .03 * S + .002 * w - Y), X += O * (t.roughness - .075 * k + .01 * w - X), Z += O * (.96 + .02 * k - Z);
				};
			}
			case `hextruchettiles`: {
				let t = require_materials.proceduralMaterialPresets.hextruchettiles, n = new Uint8Array(t.columns * t.rows), i = new Float64Array(t.columns * t.rows), a = /* @__PURE__ */ new Float64Array(12), o = Math.sqrt(3) / 2, s = t.rows * o, c = 1 / o, l = 1 / t.shoulder, u = 1 / t.arcBand, d = t.arcRadius * t.arcRadius, f = cachedNoise(64, 64, r ^ 64659);
				for (let e = 0; e < t.rows; e++) for (let a = 0; a < t.columns; a++) {
					let o = e * t.columns + a;
					n[o] = hash(a, e, r ^ 64657) < .5 ? 0 : 1, i[o] = hash(a, e, r ^ 64661);
				}
				for (let e = 0; e < 2; e++) for (let n = 0; n < 3; n++) {
					let r = Math.PI / 6 + (2 * n + e) * Math.PI / 3, i = e * 6 + n * 2;
					a[i] = t.vertexRadius * Math.cos(r), a[i + 1] = t.vertexRadius * Math.sin(r);
				}
				return () => {
					let e = W * t.columns, r = G * s, p = Math.floor(r * c), m = 1 / 0, h = 0, g = 0, _ = 0;
					for (let n = 0; n <= 1; n++) {
						let i = p + n, a = (i & 1) * .5, s = Math.round(e - a), c = e - s - a, l = r - i * o, u = c * c + l * l;
						u < m && (m = u, h = c, g = l, _ = (i % t.rows + t.rows) % t.rows * t.columns + (s % t.columns + t.columns) % t.columns);
					}
					let v = smooth(clamp((t.apothem - Math.abs(h) - t.grout) * l)) * smooth(clamp((t.apothem - Math.abs(.5 * h + o * g) - t.grout) * l)) * smooth(clamp((t.apothem - Math.abs(.5 * h - o * g) - t.grout) * l)), y = n[_] * 6, b = 0;
					for (let e = y; e < y + 6; e += 2) {
						let t = h - a[e], n = g - a[e + 1], r = (t * t + n * n - d) * u;
						b += smooth(clamp(1 - r * r));
					}
					let x = f(W, G);
					J = .2 + v * (.025 * i[_] + .61 * b + .008 * x), Y = v * (.58 + .002 * x), X = .83 + v * (t.roughness - .83 - .045 * b + .008 * x), Z = .53 + .46 * v, Q = 1 - v;
				};
			}
			case `beltbuckles`: {
				let t = require_materials.proceduralMaterialPresets.beltbuckles, n = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 64401);
				let i = t.halfWidth - t.cornerRadius, a = t.halfHeight - t.cornerRadius, o = 1 / (t.frameRadius * t.frameRadius), s = 1 / (t.barRadius * t.barRadius), c = 1 / t.shoulder, l = 1 / t.tongueBevel, u = 1 / t.taperRun, d = t.pivotRadius * t.pivotRadius, f = 1 / (d - t.pivotCore * t.pivotCore), p = cachedNoise(8, 128, r ^ 64403);
				return () => {
					let e = W * t.cells, r = G * t.cells, m = Math.floor(e), h = Math.floor(r), g = fract(e) - .5, _ = fract(r) - .5, v = m + h & 1, y = v ? _ : g, b = v ? -g : _, x = Math.abs(y) - i, S = Math.abs(b) - a, C = Math.max(x, 0), w = Math.max(S, 0), T = Math.sqrt(C * C + w * w) + Math.min(Math.max(x, S), 0) - t.cornerRadius, E = clamp(1 - T * T * o), D = smooth(clamp(E * c)), O = y - t.barX, k = Math.max(Math.abs(b) - t.halfHeight, 0), A = clamp(1 - (O * O + k * k) * s), j = smooth(clamp(A * c)), M = p(W, G), N = n[h * t.cells + m];
					J = .05 + j * (.43 + .17 * A + .012 * M), Y = .025 + j * (.315 + .12 * A), X = .92 + j * (.32 - .92), Z = .36 + j * .59, J += D * (.54 + .22 * E + .04 * N + .012 * M - J), Y += D * (.4 + .13 * E - Y), X += D * (t.roughness - .04 * E - X), Z += D * (.95 - Z);
					let F = clamp(1 - (b / (t.tongueWidth * (1 - t.taper * smooth(clamp((y - t.taperStart) * u))))) ** 2), I = smooth(clamp(F * c)) * smooth(clamp((y - t.tongueStart) * l)) * smooth(clamp((t.tongueEnd - y) * l)), L = O * O + b * b, R = smooth(clamp((d - L) * f)), z = clamp(1 - L / d);
					J += I * (.69 + .13 * F + .012 * M - J), Y += I * (.64 + .08 * F - Y), X += I * (.24 - X), Z += I * (.98 - Z), J += R * (.75 + .12 * z - J), Y += R * (.73 + .05 * z - Y), X += R * (.23 - X), Z += R * (.99 - Z);
				};
			}
			case `greenpeapods`: {
				let t = require_materials.proceduralMaterialPresets.greenpeapods, n = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 64145);
				let i = 1 / t.halfLength, a = 1 / t.halfWidth, o = 1 / t.shoulder, s = 1 / t.seamRange, c = 1 / t.peaPitch, l = 1 / t.peaWidth, u = 1 / t.peaLength, d = 1 / t.stemLength, f = 1 / t.stemWidth, p = (t.peas - 1) / 2, m = cachedNoise(96, 96, r ^ 64147);
				return () => {
					let e = W * t.cells, r = G * t.cells, h = Math.floor(e), g = Math.floor(r), _ = fract(e) - .5, v = fract(r) - .5, y = h + g & 1 ? -1 : 1, b = (_ + y * v) * Math.SQRT1_2, x = (v - y * _) * Math.SQRT1_2, S = clamp(1 - (x * i) ** 2), C = b - t.curve * S, w = S * S - (C * a) ** 2, T = smooth(clamp(w * o)), E = smooth(clamp((1 - (b * f) ** 2 - ((x - t.stemY) * d) ** 2) * o));
					if (J = .055 + E * .3, Y = .025 + E * .165, X = .94 - E * .21, Z = .38 + E * .52, T === 0) return;
					let D = (x - (Math.max(0, Math.min(t.peas - 1, Math.floor(x * c + p + .5))) - p) * t.peaPitch) * u, O = C * l, k = smooth(clamp(1 - O * O - D * D)), A = 1 - smooth(clamp(w * s)), j = clamp(w), M = m(W, G), N = n[g * t.cells + h];
					J += T * (.38 + .14 * j + .18 * k + .15 * A + .04 * N + .015 * M - J), Y += T * (.28 + .16 * j + .24 * k + .14 * A + .003 * M - Y), X += T * (t.roughness - .065 * k - .04 * A + .015 * M - X), Z += T * (.87 + .1 * k + .08 * A - Z);
				};
			}
			case `togglebuttons`: {
				let t = require_materials.proceduralMaterialPresets.togglebuttons, i = new Float64Array(t.cells * t.cells), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o;
					i[s] = hash(o, e, r ^ 63889), a[s] = n * hash(o, e, r ^ 63891);
				}
				let o = 1 / t.halfLength, s = 1 / t.halfWidth, c = 1 / t.shoulder, l = t.holeRadius * t.holeRadius, u = 1 / (l - t.holeCore * t.holeCore);
				return () => {
					let e = W * t.cells, r = G * t.cells, d = Math.floor(e), f = Math.floor(r), p = fract(e) - .5, m = fract(r) - .5, h = d + f & 1, g = h ? m : p, _ = h ? -p : m, v = g * o, y = _ * s, b = v ** 4 + y * y, x = smooth(clamp((1 - b) * c));
					if (J = .06, Y = .025, X = .94, Z = .38, x === 0) return;
					let S = f * t.cells + d, C = clamp(1 - b), w = .5 + .5 * Math.sin(n * (t.grainFrequency * _ + .12 * Math.sin(n * 1.8 * g + a[S])) + a[S]), T = w ** 10;
					J += x * (.39 + .14 * w + .05 * i[S] + .12 * C - .07 * T - J), Y += x * (.2 + .46 * C + .006 * w - Y), X += x * (t.roughness - .05 * C + .025 * T - X), Z += x * (.86 + .12 * C - Z);
					let E = Math.abs(g) - t.holeOffset, D = x * smooth(clamp((l - E * E - _ * _) * u));
					J += D * (.075 - J), Y += D * (.06 - Y), X += D * (.9 - X), Z += D * (.23 - Z);
				};
			}
			case `foldingfans`: {
				let t = require_materials.proceduralMaterialPresets.foldingfans, i = new Float64Array((t.folds + 1) * 2), a = new Float64Array(t.cells * t.cells), o = 2 * t.halfAngle / t.folds;
				for (let e = 0; e <= t.folds; e++) {
					let n = -t.halfAngle + e * o;
					i[e * 2] = Math.sin(n), i[e * 2 + 1] = Math.cos(n);
				}
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) a[e * t.cells + n] = hash(n, e, r ^ 63633);
				let s = t.radius * t.radius, c = t.innerRadius * t.innerRadius, l = 1 / (s - (t.radius - t.radialBevel) ** 2), u = 1 / ((t.innerRadius + t.radialBevel) ** 2 - c), d = t.pivotRadius * t.pivotRadius, f = 1 / (d - t.pivotShoulder * t.pivotShoulder), p = 1 / (t.ribWidth * t.ribWidth), m = 1 / t.ribShoulder, h = 1 / o, g = Math.sin(t.halfAngle), _ = Math.cos(t.halfAngle), v = 1 / t.edgeBevel, y = cachedNoise(96, 96, r ^ 63635);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(e), b = Math.floor(r), x = o + b & 1 ? -1 : 1, S = (fract(e) - .5) * x, C = t.pivotY - (fract(r) - .5) * x, w = S * S + C * C, T = smooth(clamp((d - w) * f));
					if (J = .055, Y = .025, X = .94, Z = .4, w > t.pivotShoulder * t.pivotShoulder) {
						let e = Math.atan2(S, C), r = Math.max(0, Math.min(t.folds, Math.floor((e + t.halfAngle) * h + .5))), d = i[r * 2], f = i[r * 2 + 1], x = Math.max(t.ribStart, Math.min(t.ribEnd, S * d + C * f)), T = S - x * d, E = C - x * f, D = (T * T + E * E) * p, O = smooth(clamp((1 - D) * m)), k = clamp(1 - D);
						J += O * (.34 + .12 * k - J), Y += O * (.2 + .05 * k - Y), X += O * (.65 - X), Z += O * (.94 - Z);
						let A = smooth(clamp((s - w) * l)) * smooth(clamp((w - c) * u)) * smooth(clamp((C * g - Math.abs(S) * _) * v));
						if (A > 0) {
							let r = .5 + .5 * Math.cos(n * (e + t.halfAngle) * h), i = y(W, G), s = a[b * t.cells + o];
							J += A * (.64 + .16 * r + .05 * s + .015 * i - J), Y += A * (.36 + .18 * r + .003 * i - Y), X += A * (t.roughness - .08 * r + .015 * i - X), Z += A * (.8 + .18 * r - Z);
						}
					}
					J += T * (.26 - J), Y += T * (.3 - Y), X += T * (.6 - X), Z += T * (.98 - Z);
				};
			}
			case `succulentrosettes`: {
				let t = require_materials.proceduralMaterialPresets.succulentrosettes, i = t.whorls.length * t.leaves * 7, a = new Float64Array(t.cells * t.cells * i);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = (e * t.cells + o) * i, c = n * hash(o, e, r ^ 63361);
					for (let i = 0; i < t.whorls.length; i++) {
						let l = t.whorls[i];
						for (let u = 0; u < t.leaves; u++) {
							let d = s + (i * t.leaves + u) * 7, f = c + n * (u + l[4]) / t.leaves;
							a[d] = Math.cos(f), a[d + 1] = Math.sin(f), a[d + 2] = l[0], a[d + 3] = 1 / l[1], a[d + 4] = 1 / l[2], a[d + 5] = l[3], a[d + 6] = .36 + .04 * i + .06 * hash(o * t.leaves + u, e * t.whorls.length + i, r ^ 63363);
						}
					}
				}
				let o = 1 / t.shoulder, s = t.radiusLimit * t.radiusLimit, c = cachedNoise(96, 96, r ^ 63365);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, l = fract(n) - .5;
					if (J = .07, Y = .025, X = .94, Z = .38, r * r + l * l >= s) return;
					let u = (Math.floor(n) * t.cells + Math.floor(e)) * i, d = u + i, f = c(W, G);
					for (let e = u; e < d; e += 7) {
						let n = (r * a[e] + l * a[e + 1] - a[e + 2]) * a[e + 3];
						if (Math.abs(n) >= 1) continue;
						let i = (l * a[e] - r * a[e + 1]) * a[e + 4] / (1 + t.taper * n), s = n * n + i * i, c = smooth(clamp((1 - s) * o));
						if (c === 0) continue;
						let u = smooth(clamp(1 - s)), d = smooth((n + 1) * .5);
						J = J * (1 - c) + c * (a[e + 6] + .22 * u + .02 * f), Y = Y * (1 - c) + c * (a[e + 5] + .17 * u + .04 * d + .003 * f), X = X * (1 - c) + c * (t.roughness - .12 * u + .025 * f), Z = Z * (1 - c) + c * (.84 + .14 * u);
					}
				};
			}
			case `ballchain`: {
				let t = require_materials.proceduralMaterialPresets.ballchain, i = new Float64Array(t.columns * t.rows * 4);
				for (let e = 0; e < t.columns; e++) {
					let a = n * hash(e, 0, r ^ 63089);
					for (let o = 0; o < t.rows; o++) {
						let s = (e * t.rows + o) * 4;
						i[s] = t.amplitude * Math.sin(n * t.cycles * (o + .5) / t.rows + a), i[s + 1] = hash(e, o, r ^ 63091);
					}
					for (let n = 0; n < t.rows; n++) {
						let r = (e * t.rows + n) * 4, a = i[(e * t.rows + (n + 1) % t.rows) * 4] - i[r];
						i[r + 2] = a, i[r + 3] = 1 / (a * a + t.pitch * t.pitch);
					}
				}
				let a = t.radius * t.radius, o = 1 / a, s = 1 / (a - (t.radius - t.beadBevel) ** 2), c = t.neckRadius * t.neckRadius, l = 1 / c, u = 1 / (c - (t.neckRadius - t.neckBevel) ** 2), d = 1 / t.pitch, f = cachedNoise(96, 96, r ^ 63093);
				return () => {
					let e = W * t.columns, n = G * t.rows * t.pitch, r = Math.floor(e), p = Math.floor(n * d), m = (r * t.rows + p) * 4, h = e - r - .5 - i[m], g = n - (p + .5) * t.pitch, _ = h * h + g * g, v = smooth(clamp((a - _) * s)), y = v > 0 ? Math.sqrt(clamp(1 - _ * o)) : 0, b = Math.floor(n * d - .5), x = (b % t.rows + t.rows) % t.rows, S = (r * t.rows + x) * 4, C = e - r - .5 - i[S], w = n - (b + .5) * t.pitch, T = clamp((C * i[S + 2] + w * t.pitch) * i[S + 3]), E = C - T * i[S + 2], D = w - T * t.pitch, O = E * E + D * D, k = smooth(clamp((c - O) * u)), A = clamp(1 - O * l);
					J = .055 * (1 - k) + k * (.52 + .08 * A), Y = .025 * (1 - k) + k * (.13 + .05 * A), X = .56 * (1 - k) + k * (.38 - .04 * A), Z = .4 * (1 - k) + .92 * k;
					let j = v > 0 ? f(W, G) : 0;
					J = J * (1 - v) + v * (.4 + .42 * y + .025 * i[m + 1]), Y = Y * (1 - v) + v * (.2 + .51 * y), X = X * (1 - v) + v * (.23 + .05 * (1 - y) + .015 * j), Z = Z * (1 - v) + .99 * v;
				};
			}
			case `dodecagontiles`: {
				let t = require_materials.proceduralMaterialPresets.dodecagontiles, n = new Float64Array(t.columns * t.rows * 3);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) {
					let a = (e * t.columns + i) * 3;
					n[a] = .3 + .4 * hash(i, e, r ^ 62817), n[a + 1] = .87 + .08 * hash(i, e, r ^ 62819), n[a + 2] = .87 + .08 * hash(i, e, r ^ 62821);
				}
				let i = t.rowStep * .5, a = 1 - t.grout, o = 2 / t.rowStep - 1 - t.grout, s = 1 / t.bevel, c = cachedNoise(96, 96, r ^ 62823);
				return () => {
					let e = W * t.columns * 2, r = G * t.rows * t.rowStep, l = Math.floor(r / t.rowStep), u = 0, d = 0;
					for (let o = 0; o <= 1; o++) {
						let c = l + o, f = e - (c & 1), p = Math.floor((f + 1) * .5), m = f - p * 2, h = r - c * t.rowStep, g = smooth(clamp((a - Math.abs(m)) * s)) * smooth(clamp((a - Math.abs(h)) * s)) * smooth(clamp((a - Math.abs(i * m + .5 * h)) * s)) * smooth(clamp((a - Math.abs(i * m - .5 * h)) * s)) * smooth(clamp((a - Math.abs(.5 * m + i * h)) * s)) * smooth(clamp((a - Math.abs(.5 * m - i * h)) * s)), _ = (c % t.rows + t.rows) % t.rows, v = (p % t.columns + t.columns) % t.columns;
						u += g, d += g * n[(_ * t.columns + v) * 3];
					}
					for (let a = 0; a < 2; a++) {
						let c = a === 0 ? 1 : -1, f = e - (l & 1) - (1 - a), p = Math.floor((f + 1) * .5), m = f - p * 2, h = r - (l + (a + 1) / 3) * t.rowStep, g = smooth(clamp((o + i * m + c * .5 * h) * s)) * smooth(clamp((o - i * m + c * .5 * h) * s)) * smooth(clamp((o - c * h) * s)), _ = (p % t.columns + t.columns) % t.columns;
						u += g, d += g * n[(l * t.columns + _) * 3 + a + 1];
					}
					let f = c(W, G);
					J = d + .012 * f * u, Y = (.64 + .004 * f) * u, Q = 1 - u, X += .46 * Q + .015 * f * u, Z = .5 + .49 * u;
				};
			}
			case `doorkeys`: {
				let t = require_materials.proceduralMaterialPresets.doorkeys, n = new Float64Array(t.cells * t.cells * 6);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 6, o = Math.floor(4 * hash(i, e, r ^ 62545));
					n[a] = o === 0 ? 1 : o === 2 ? -1 : 0, n[a + 1] = o === 1 ? 1 : o === 3 ? -1 : 0, n[a + 2] = hash(i, e, r ^ 62547);
					for (let o = 0; o < 3; o++) {
						let s = t.bittingDepth + t.depthVariation * hash(i * 3 + o, e, r ^ 62549);
						n[a + 3 + o] = 1 / (s * s);
					}
				}
				let i = t.bowRadius * t.bowRadius, a = 1 / (i - (t.bowRadius - t.bowBevel) ** 2), o = t.boreRadius * t.boreRadius, s = 1 / (o - (t.boreRadius - t.boreBevel) ** 2), c = 1 / t.bevel, l = 1 / t.bittingPitch, u = 1 / (t.bittingHeight * t.bittingHeight), d = 1 / t.bittingShoulder, f = 1 / (t.grooveWidth * t.grooveWidth), p = 1 / t.grooveEnd, m = cachedNoise(96, 96, r ^ 62551);
				return () => {
					let e = W * t.cells, r = G * t.cells, h = (Math.floor(r) * t.cells + Math.floor(e)) * 6, g = fract(e) - .5, _ = fract(r) - .5, v = g * n[h] + _ * n[h + 1], y = _ * n[h] - g * n[h + 1], b = y - t.bowY, x = v * v + b * b, S = smooth(clamp((i - x) * a)), C = smooth(clamp((o - x) * s)), w = smooth(clamp((t.neckHalfWidth - Math.abs(v)) * c)) * smooth(clamp((y - t.neckTop) * c)) * smooth(clamp((t.neckBottom - y) * c)), T = smooth(clamp((v - t.bladeLeft) * c)) * smooth(clamp((t.bladeRight - v) * c)) * smooth(clamp((y - t.bladeTop) * c)) * smooth(clamp((t.tipY - y) * c)) * smooth(clamp((t.tipClip - v - y) * c)), E = Math.floor((y - t.firstBitting) * l + .5), D = 0;
					if (E >= 0 && E < 3) {
						let e = v - t.bladeRight, r = y - t.firstBitting - E * t.bittingPitch;
						D = smooth(clamp((1 - e * e * n[h + 3 + E] - r * r * u) * d));
					}
					let O = (1 - (1 - S) * (1 - w) * (1 - T)) * (1 - C) * (1 - D), k = v - t.grooveX, A = O * smooth(clamp(1 - k * k * f)) * smooth(clamp((y - t.grooveTop) * p)) * smooth(clamp((t.grooveBottom - y) * p)), j = m(W, G);
					J = .07 + O * (.73 + .07 * n[h + 2] + .025 * j) - .1 * A, Y = .025 + .58 * O - .05 * A + .003 * j * O, X += .18 * (1 - O) + .065 * A + .02 * j * O, Z = .44 + .55 * O - .055 * A;
				};
			}
			case `creamcrackers`: {
				let t = require_materials.proceduralMaterialPresets.creamcrackers, n = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 62273);
				let i = 1 / t.halfWidth ** 8, a = 1 / t.innerWidth ** 8, o = 1 / t.edge, s = 1 / t.innerEdge, c = 1 / t.notchPitch, l = 1 / (t.notchWidth * t.notchWidth), u = 1 / (t.notchDepth * t.notchDepth), d = 1 / t.notchShoulder, f = 1 / t.holePitch, p = 1 / (t.holeRadius * t.holeRadius), m = 1 / t.holeShoulder, h = cachedNoise(96, 96, r ^ 62275), g = cachedNoise(32, 32, r ^ 62279);
				return () => {
					let e = W * t.cells, r = G * t.cells, _ = fract(e) - .5, v = fract(r) - .5, y = _ * _, b = v * v, x = y * y, S = b * b, C = x * x + S * S, w = (fract((_ + t.notchOrigin) * c) - .5) * t.notchPitch, T = (fract((v + t.notchOrigin) * c) - .5) * t.notchPitch, E = Math.abs(_) - t.notchCenter, D = Math.abs(v) - t.notchCenter, O = smooth(clamp((1 - w * w * l - D * D * u) * d)), k = smooth(clamp((1 - T * T * l - E * E * u) * d)), A = smooth(clamp((1 - C * i) * o)) * (1 - O) * (1 - k), j = A * smooth(clamp((1 - C * a) * s)), M = A - j, N = Math.floor(_ * f + .5), P = Math.floor(v * f + .5), F = 0;
					if (Math.abs(N) <= 1 && Math.abs(P) <= 1) {
						let e = _ - N * t.holePitch, n = v - P * t.holePitch;
						F = j * smooth(clamp((1 - (e * e + n * n) * p) * m));
					}
					let I = h(W, G), L = j * smooth(clamp((g(W, G) - .55) * 4));
					J = .08 + A * (.6 + .1 * n[Math.floor(r) * t.cells + Math.floor(e)] + .04 * I) - .11 * M - .16 * L - .37 * F, Y = .035 + .6 * A - .04 * j + .04 * L - .2 * F, X += .12 * (1 - A) + .06 * M - .05 * L + .08 * F, Z = .46 + .52 * A - .34 * F;
				};
			}
			case `driedfigslice`: {
				let t = require_materials.proceduralMaterialPresets.driedfigslice, i = new Float64Array(t.cells * t.cells * t.seeds * t.seeds * 5), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o;
					a[s] = n * hash(o, e, r ^ 62001);
					for (let a = 0; a < t.seeds; a++) for (let c = 0; c < t.seeds; c++) {
						let l = ((s * t.seeds + a) * t.seeds + c) * 5, u = o * t.seeds + c, d = e * t.seeds + a, f = n * hash(u, d, r ^ 62007);
						i[l] = .5 + 2 * t.seedJitter * (hash(u, d, r ^ 62003) - .5), i[l + 1] = .5 + 2 * t.seedJitter * (hash(u, d, r ^ 62005) - .5), i[l + 2] = Math.cos(f), i[l + 3] = Math.sin(f), i[l + 4] = hash(u, d, r ^ 62009);
					}
				}
				let o = t.seeds * .5, s = 1 / (o * t.seedLong), c = 1 / (o * t.seedShort), l = 1 / t.seedShoulder, u = t.fleshRadius * t.fleshRadius, d = 1 / (u - t.fleshShoulder * t.fleshShoulder), f = 1 / t.edge, p = cachedNoise(96, 96, r ^ 62011);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), m = Math.floor(n), h = m * t.cells + r, g = r + m & 1 ? -1 : 1, _ = ((fract(n) - .5) * g - t.centerY) / t.length, v = (fract(e) - .5) * g / (t.width * (1 + t.taper * _)), y = v * v + _ * _, b = smooth(clamp((1 - y) * f)), x = b * smooth(clamp((u - y) * d)), S = b - x, C = 0, w = 0, T = 0;
					if (S > 0) {
						let e = Math.sin(t.wrinkles * Math.atan2(_, v) + a[h]), n = e * e, r = n * n;
						C = S * r * r;
					}
					if (x > 0) {
						let e = (v + 1) * o, n = (_ + 1) * o, r = ((h * t.seeds + Math.floor(n)) * t.seeds + Math.floor(e)) * 5, a = fract(e) - i[r], u = fract(n) - i[r + 1], d = (a * i[r + 2] + u * i[r + 3]) * s, f = (u * i[r + 2] - a * i[r + 3]) * c;
						w = x * smooth(clamp((1 - d * d - f * f) * l)), T = i[r + 4];
					}
					let E = p(W, G);
					J = .07 + b * (.43 + .13 * E) - .12 * C + x * (-.26 + .01 * E), J = J * (1 - w) + w * (.94 + .03 * T), Y = .03 + b * (.62 + .012 * E) - .035 * C - .02 * x + .035 * w, X += .12 * (1 - b) + .06 * C - x * (.12 - .04 * E), X = X * (1 - w) + .58 * w, Z = .5 + .48 * b - .04 * x + .03 * w;
				};
			}
			case `hexkeys`: {
				let t = require_materials.proceduralMaterialPresets.hexkeys, n = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 3, o = Math.floor(4 * hash(i, e, r ^ 61729));
					n[a] = o === 0 ? 1 : o === 2 ? -1 : 0, n[a + 1] = o === 1 ? 1 : o === 3 ? -1 : 0, n[a + 2] = hash(i, e, r ^ 61731);
				}
				let i = 1 / t.shoulder, a = 1 / t.endBevel, o = t.width * t.flatFraction, s = 1 / (t.width - o), c = 1 / (2 * t.facetRound), l = 1 / (1 - t.facetRound), u = cachedNoise(96, 96, r ^ 61735);
				return () => {
					let e = W * t.cells, r = G * t.cells, d = (Math.floor(r) * t.cells + Math.floor(e)) * 3, f = fract(e) - .5, p = fract(r) - .5, m = f * n[d] + p * n[d + 1], h = p * n[d] - f * n[d + 1], g, _ = 1;
					if (h <= t.bendY) g = Math.abs(m + t.bendRadius), _ = smooth(clamp((h - t.longEnd) * a));
					else if (m >= 0) g = Math.abs(h - t.bendY - t.bendRadius), _ = smooth(clamp((t.shortEnd - m) * a));
					else {
						let e = h - t.bendY;
						g = Math.abs(Math.sqrt(m * m + e * e) - t.bendRadius);
					}
					let v = _ * smooth(clamp((t.width - g) * i)), y = clamp((g - o) * s), b = 1 - (y < t.facetRound ? y * y * c : y > 1 - t.facetRound ? 1 - t.facetRound - (1 - y) * (1 - y) * c : y - t.facetRound * .5) * l, x = u(W, G);
					J = .08 + v * (.36 + .32 * b + .03 * n[d + 2] + .015 * x), Y = .025 + v * (.5 + .25 * b + .006 * x), X += .12 * (1 - v) + v * (-.1 * b + .035 * x), Z = .48 + .5 * v;
				};
			}
			case `fishscaletiles`: {
				let t = require_materials.proceduralMaterialPresets.fishscaletiles, n = new Float64Array(t.columns * t.rows);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = .38 + .48 * hash(i, e, r ^ 61459);
				let i = (1 - t.grout) ** 2, a = (1 + t.grout) ** 2, o = 1 / (i - (1 - t.grout - t.bevel) ** 2), s = cachedNoise(96, 96, r ^ 61463);
				return () => {
					let e = W * t.columns * 2, r = G * t.rows, c = Math.floor(r), l = 1, u = 0, d = 0;
					for (let s = 2; s >= 0; s--) {
						let f = c + s, p = e - (f & 1), m = Math.floor((p + 1) * .5), h = p - m * 2, g = r - f, _ = h * h + g * g;
						if (s < 2) {
							let e = l * smooth(clamp((i - _) * o)), r = (f % t.rows + t.rows) % t.rows, a = (m % t.columns + t.columns) % t.columns;
							u += e, d += e * n[r * t.columns + a];
						}
						if (s > 0) {
							let e = 2 - Math.abs(h);
							l *= smooth(clamp((_ - a) * o)) * smooth(clamp((e * e + g * g - a) * o));
						}
					}
					let f = s(W, G);
					J = .3 + d - .3 * u + .012 * f * u, Y = (.62 + .004 * f) * u, X += .48 * (1 - u) + .015 * f * u, Z = .5 + .49 * u, Q = 1 - u;
				};
			}
			case `grommetcanvas`: {
				let t = require_materials.proceduralMaterialPresets.grommetcanvas, n = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 61185);
				let i = t.outerRadius * t.outerRadius, a = 1 / (i - t.outerShoulder * t.outerShoulder), o = t.innerRadius * t.innerRadius, s = 1 / (t.innerShoulder * t.innerShoulder - o), c = t.fabricCut * t.fabricCut, l = 1 / (t.fabricShoulder * t.fabricShoulder - c), u = t.ridgeRadius * t.ridgeRadius, d = 1 / t.ridgeBand, f = 1 / (t.threadWidth * t.threadWidth), p = cachedNoise(96, 96, r ^ 61187);
				return () => {
					let e = W * t.cells, r = G * t.cells, m = fract(e) - .5, h = fract(r) - .5, g = m * m + h * h, _ = smooth(clamp((i - g) * a)) * smooth(clamp((g - o) * s)), v = smooth(clamp((g - c) * l)), y = (g - u) * d, b = smooth(clamp(1 - y * y)), x = fract(W * t.threads) - .5, S = fract(G * t.threads) - .5, C = smooth(clamp(1 - x * x * f)), w = smooth(clamp(1 - S * S * f)), T = C + w - C * w, E = p(W, G), D = n[Math.floor(r) * t.cells + Math.floor(e)];
					J = .06 + v * (.21 + .07 * T + .025 * E), Y = .025 + v * (.075 + .025 * T + .003 * E), X = .95 * (1 - v) + v * (t.roughness + .06 * (1 - T) + .025 * E), Z = .38 + .59 * v, J = J * (1 - _) + _ * (.76 + .14 * b + .025 * D), Y = Y * (1 - _) + _ * (.46 + .14 * b), X = X * (1 - _) + _ * (.25 - .05 * b), Z = Z * (1 - _) + .99 * _, $ = _;
				};
			}
			case `crossbeddedsandstone`: {
				let t = require_materials.proceduralMaterialPresets.crossbeddedsandstone, n = new Float64Array(t.beds * 4);
				for (let e = 0; e < t.beds; e++) {
					let i = e * 4, a = e & 1 ? -1 : 1;
					n[i] = a * (t.dip + t.dipVariation * hash(e, 0, r ^ 57073)), n[i + 1] = a * (t.curvature + t.curvatureVariation * hash(e, 0, r ^ 57075)), n[i + 2] = hash(e, 0, r ^ 57077), n[i + 3] = .19 + .04 * hash(e, 0, r ^ 57079);
				}
				let i = 1 / (t.laminaWidth * t.laminaWidth), a = 1 / t.fadeBand, o = 1 / t.contactWidth, s = cachedNoise(96, 96, r ^ 57081);
				return () => {
					let e = G * t.beds, r = Math.floor(e), c = fract(e), l = c - .5, u = Math.min(c, 1 - c), d = smooth(clamp((u - t.fadeStart) * a)), f = smooth(clamp((t.contactWidth - u) * o)), p = r * 4, h = fract(W * t.laminaFrequency + n[p] * l + n[p + 1] * l * l + n[p + 2]) - .5, g = smooth(clamp(1 - h * h * i)) * d, _ = s(W, G);
					J = .73 + .025 * _ - n[p + 3] * g - .09 * f, Y = .28 + .008 * _ - .045 * g - .025 * f, X += .015 * _ + .03 * g + .04 * f, Z = .97 - .035 * g - .02 * f;
				};
			}
			case `braidedcord`: {
				let t = require_materials.proceduralMaterialPresets.braidedcord, n = new Float64Array(t.columns * t.strands), i = new Float64Array(t.strands * 3), a = 1 / (t.strandWidth * t.strandWidth), o = 1 / t.shoulder, s = 1 / t.layerBand, c = 32 / 5 * t.amplitude * t.cycles / t.columns, l = cachedNoise(96, 96, r ^ 52721);
				for (let e = 0; e < t.columns; e++) for (let i = 0; i < t.strands; i++) n[e * t.strands + i] = .15 + .3 * i + .03 * hash(e, i, r ^ 52723);
				return () => {
					let e = W * t.columns, r = Math.floor(e), u = fract(e) - .5, d = G * t.cycles;
					for (let e = 0; e < t.strands; e++) {
						let n = d + e / t.strands, r = fract(n) * 2, s = r < 1 ? r : r - 1, l = r < 1 ? 1 : -1, f = 16 / 5 * t.amplitude * l * s * (1 + s * s * (s - 2)), p = c * l * (1 + s * s * (4 * s - 6)), m = u - f, h = clamp(1 - m * m * a / (1 + p * p)), g = fract(n * 2) * 2, _ = g < 1 ? g : g - 1, v = 16 / 5 * (g < 1 ? 1 : -1) * _ * (1 + _ * _ * (_ - 2)), y = e * 3;
						i[y] = smooth(clamp(h * o)), i[y + 1] = smooth(h), i[y + 2] = v;
					}
					J = .08, Y = .06, Z = .4;
					let f = 0, p = 0, m = l(W, G);
					for (let e = 0; e < t.strands; e++) {
						let a = e * 3, o = i[a + 1], c = i[a + 2], l = i[a];
						if (l !== 0) {
							for (let n = 0; n < t.strands; n++) {
								let t = n * 3;
								n !== e && i[t] !== 0 && (l *= 1 - i[t] * smooth(clamp(.5 + (i[t + 2] - c) * s)));
							}
							f += l, p += l * o, J += l * (.3 + .45 * n[r * t.strands + e] + .035 * c + .08 * o + .025 * m), Y += l * (.42 + .18 * c + .16 * o + .004 * m), Z += l * (.45 + .1 * o + .03 * c);
						}
					}
					X += .12 * (1 - f) - .07 * p + .01 * m * f;
				};
			}
			case `punchcard`: {
				let t = require_materials.proceduralMaterialPresets.punchcard, n = t.columns * t.rows, i = t.punchColumns * t.punchRows, a = new Uint8Array(n * i), o = new Float64Array(n);
				for (let e = 0; e < n; e++) {
					o[e] = hash(e, 0, r ^ 48353);
					for (let n = 0; n < t.punchColumns; n++) {
						let o = Math.floor(hash(n, e, r ^ 48355) * t.punchRows), s = (o + 1 + Math.floor(hash(n, e, r ^ 48357) * (t.punchRows - 1))) % t.punchRows;
						a[e * i + o * t.punchColumns + n] = 1, a[e * i + s * t.punchColumns + n] = 1;
					}
				}
				let s = -(t.punchColumns - 1) * t.pitchX / 2, c = -(t.punchRows - 1) * t.pitchY / 2, l = 1 / t.pitchX, u = 1 / t.pitchY, d = 1 / t.edge, f = 1 / t.punchBevel, p = cachedNoise(96, 96, r ^ 48359);
				return () => {
					let e = W * t.columns, n = G * t.rows, r = Math.floor(n) * t.columns + Math.floor(e), m = fract(e) - .5, h = fract(n) - .5, g = smooth(clamp((t.halfWidth - Math.abs(m)) * d)) * smooth(clamp((t.halfHeight - Math.abs(h)) * d)) * smooth(clamp((t.chamfer - m + h) * d)), _ = Math.max(0, Math.min(t.punchColumns - 1, Math.round((m - s) * l))), v = Math.max(0, Math.min(t.punchRows - 1, Math.round((h - c) * u))), y = m - s - _ * t.pitchX, b = h - c - v * t.pitchY, x = g * (1 - a[r * i + v * t.punchColumns + _] * smooth(clamp((t.punchHalfWidth - Math.abs(y)) * f)) * smooth(clamp((t.punchHalfHeight - Math.abs(b)) * f))), S = p(W, G);
					J = .12 + x * (.74 + .05 * o[r] + .015 * S), Y = .04 + x * (.06 + .001 * S), X += .08 * (1 - x) - .04 * x + .015 * S * x, Z = .6 + .39 * x;
				};
			}
			case `cherryblossom`: {
				let t = require_materials.proceduralMaterialPresets.cherryblossom, i = new Float64Array(t.petals * 2), a = new Float64Array(t.pollenCount * 2), o = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.petals; e++) i[e * 2] = Math.cos(e * n / t.petals), i[e * 2 + 1] = Math.sin(e * n / t.petals);
				for (let e = 0; e < t.pollenCount; e++) a[e * 2] = t.pollenDistance * Math.cos(e * n / t.pollenCount), a[e * 2 + 1] = t.pollenDistance * Math.sin(e * n / t.pollenCount);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) o[e * t.cells + n] = hash(n, e, r ^ 43985);
				let s = 1 / (t.petalLength * t.petalLength), c = 1 / (t.petalWidth * t.petalWidth), l = 1 / (t.notchLength * t.notchLength), u = 1 / (t.notchWidth * t.notchWidth), d = 1 / t.shoulder, f = t.centerRadius * t.centerRadius, p = 1 / t.centerShoulder, m = 1 / (t.pollenRadius * t.pollenRadius), h = (t.pollenDistance + t.pollenRadius) ** 2, g = Math.cos(Math.PI / t.petals), _ = Math.sin(Math.PI / t.petals), v = cachedNoise(96, 96, r ^ 43987);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), y = Math.floor(n), b = fract(e) - .5, x = fract(n) - .5;
					if (r + y & 1) {
						let e = b * g + x * _;
						x = -b * _ + x * g, b = e;
					}
					let S = b * b + x * x, C = 1, w = 1, T = 1;
					for (let e = 0; e < t.petals; e++) {
						let n = i[e * 2], r = i[e * 2 + 1], a = b * n + x * r, o = -b * r + x * n, f = a - t.petalCenter, p = a - t.notchCenter, m = clamp(1 - f * f * s - o * o * c), h = smooth(clamp((1 - p * p * l - o * o * u) * d));
						C *= 1 - smooth(clamp(m * d)) * (1 - h), w *= 1 - smooth(m) * (1 - h);
					}
					if (S < h) for (let e = 0; e < t.pollenCount; e++) {
						let t = b - a[e * 2], n = x - a[e * 2 + 1];
						T *= 1 - smooth(clamp((1 - (t * t + n * n) * m) * d));
					}
					let E = 1 - C, D = 1 - w, O = 1 - T, k = smooth(clamp((f - S) * p)), A = v(W, G);
					J = .03 + E * (.62 + .12 * o[y * t.cells + r] + .015 * A) + .1 * D - .2 * k + .2 * O, Y = .04 + .35 * E + .12 * D - .13 * k + .08 * O + .003 * A * E, X += .18 * (1 - E) - .1 * E + .1 * k - .05 * O, Z = .38 + .56 * E - .16 * k + .04 * O;
				};
			}
			case `righttriangletiles`: {
				let t = require_materials.proceduralMaterialPresets.righttriangletiles, n = new Float64Array(t.cells * t.cells * 2), i = 1 / t.bevel, a = cachedNoise(96, 96, r ^ 39619);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 2;
					n[a] = .35 + .15 * hash(i, e, r ^ 39621), n[a + 1] = .8 + .12 * hash(i, e, r ^ 39623);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(e), s = Math.floor(r), c = fract(e), l = fract(r), u = o + s & 1 ? 1 - l : l, d = smooth(clamp((Math.min(c, 1 - c) - t.grout) * i)) * smooth(clamp((Math.min(u, 1 - u) - t.grout) * i)), f = (c - u) * Math.SQRT1_2, p = d * smooth(clamp((f - t.grout) * i)), m = d * smooth(clamp((-f - t.grout) * i)), h = p + m, g = (s * t.cells + o) * 2, _ = a(W, G);
					J = .3 + p * (n[g] - .3) + m * (n[g + 1] - .3) + .01 * _ * h, Y = .04 + h * (.58 + .005 * _), Q = 1 - h, X += .42 * Q - .06 * h + .015 * _ * h, Z = .5 + .48 * h;
				};
			}
			case `parallelkeys`: {
				let t = require_materials.proceduralMaterialPresets.parallelkeys, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(96, 96, r ^ 11927), o = t.radius * t.radius, s = 1 / (o - (t.radius - t.bevel) ** 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = hash(a, e, r ^ 32545) * n;
					i[o] = (hash(a, e, r ^ 9399) - .5) * 2 * t.jitter, i[o + 1] = (hash(a, e, r ^ 26081) - .5) * 2 * t.jitter, i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s), i[o + 4] = 1 / (t.scale + (hash(a, e, r ^ 16781) * 2 - 1) * t.scaleVariation), i[o + 5] = hash(a, e, r ^ 42587);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, c = fract(e) - .5 - i[r], l = fract(n) - .5 - i[r + 1], u = i[r + 2], d = i[r + 3], f = i[r + 4], p = (c * u + l * d) * f, m = (-c * d + l * u) * f, h = p - Math.max(-t.halfSegment, Math.min(t.halfSegment, p)), g = smooth(clamp((o - h * h - m * m) * s)), _ = a(W, G);
					J = .055 + g * (.69 + .08 * i[r + 5] + .012 * _), Y = .06 + g * (.5 + .003 * _), X += .36 * (1 - g) + .025 * _ * g, Z = .48 + .5 * g, $ = g;
				};
			}
			case `woodruffkeys`: {
				let t = require_materials.proceduralMaterialPresets.woodruffkeys, i = new Float64Array(t.cells * t.cells * 6), a = cachedNoise(96, 96, r ^ 11927), o = t.radius * t.radius, s = 1 / (o - (t.radius - t.bevel) ** 2), c = 1 / t.bevel;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 6, s = hash(a, e, r ^ 32545) * n;
					i[o] = (hash(a, e, r ^ 9399) - .5) * 2 * t.jitter, i[o + 1] = (hash(a, e, r ^ 26081) - .5) * 2 * t.jitter, i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s), i[o + 4] = 1 / (t.scale + (hash(a, e, r ^ 16781) * 2 - 1) * t.scaleVariation), i[o + 5] = hash(a, e, r ^ 42587);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, l = fract(e) - .5 - i[r], u = fract(n) - .5 - i[r + 1], d = i[r + 2], f = i[r + 3], p = i[r + 4], m = (l * d + u * f) * p, h = (-l * f + u * d) * p, g = smooth(clamp((o - m * m - h * h) * s)) * smooth(clamp((h - t.chord) * c)), _ = a(W, G);
					J = .055 + g * (.69 + .08 * i[r + 5] + .012 * _), Y = .06 + g * (.5 + .003 * _), X += .36 * (1 - g) + .025 * _ * g, Z = .48 + .5 * g, $ = g;
				};
			}
			case `coins`: {
				let t = require_materials.proceduralMaterialPresets.coins, i = new Float64Array(t.points * 2), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.points; e++) i[e * 2] = Math.cos(e * n / t.points), i[e * 2 + 1] = Math.sin(e * n / t.points);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) a[e * t.cells + n] = hash(n, e, r ^ 36785);
				let o = Math.cos(Math.PI / t.points), s = Math.sin(Math.PI / t.points), c = t.starInnerRadius * o, l = t.starInnerRadius * s / (t.starRadius - c), u = 1 / t.starBevel, d = t.radius * t.radius, f = t.rimInner * t.rimInner, p = t.rimOuter * t.rimOuter, m = 1 / t.diskShoulder, h = 1 / t.rimShoulder, g = cachedNoise(96, 96, r ^ 36787);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), _ = Math.floor(n), v = fract(e) - .5, y = fract(n) - .5;
					if (r + _ & 1) {
						let e = v * o + y * s;
						y = -v * s + y * o, v = e;
					}
					let b = v * v + y * y, x = smooth(clamp((d - b) * m)), S = smooth(clamp((b - f) * h)) * smooth(clamp((p - b) * h)), C = 1, w = 1;
					for (let e = 0; e < t.points; e++) {
						let n = i[e * 2], r = i[e * 2 + 1], a = v * n + y * r, o = -v * r + y * n, s = (t.starRadius - a) * l;
						C *= smooth(clamp((c - a) * u));
						let d = smooth(clamp((a - t.starBase) * u)) * smooth(clamp((s - o) * u)) * smooth(clamp((s + o) * u));
						w *= 1 - d;
					}
					let T = 1 - w * (1 - C), E = g(W, G);
					J = .06 + x * (.52 + .08 * a[_ * t.cells + r] + .015 * E) + .14 * S + .14 * T, Y = .05 + .3 * x + .18 * S + .14 * T + .003 * E * x, X += .22 * (1 - x) - .06 * S - .05 * T + .01 * E * x, Z = .4 + .48 * x + .1 * S + .08 * T;
				};
			}
			case `hinges`: {
				let t = require_materials.proceduralMaterialPresets.hinges, n = 1 / t.leafHalfWidth, i = 1 / t.leafHalfLength, a = 1 / t.shoulder, o = t.boreRadius * t.boreRadius, s = 1 / (o * t.shoulder), c = t.seatRadius * t.seatRadius, l = 1 / (c - t.seatInnerRadius * t.seatInnerRadius), u = 1 / (t.barrelRadius * t.barrelRadius), d = 1 / (t.pinRadius * t.pinRadius), f = 1 / t.knucklePitch, p = 1 / t.jointShoulder, m = 1 / t.endShoulder, h = cachedNoise(8, 128, r ^ 32417);
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, g = (Math.abs(e) - t.leafX) * n, _ = r * i, v = g * g, y = _ * _, b = smooth(clamp((1 - v * v - y * y) * a)), x = Math.max(-1, Math.min(1, Math.round(r / t.screwPitch))), S = Math.abs(e) - t.screwX, C = r - x * t.screwPitch, w = S * S + C * C, T = smooth(clamp((o - w) * s)) * b, E = smooth(clamp((c - w) * l)) * b, D = clamp(1 - e * e * d), O = smooth(clamp(D * a)) * smooth(clamp((t.pinHalfLength - Math.abs(r)) * m)), k = fract((r + t.barrelHalfLength) * f), A = smooth(clamp(Math.min(k, 1 - k) * p)), j = clamp(1 - e * e * u), M = smooth(clamp(j * a)) * A * smooth(clamp((t.barrelHalfLength - Math.abs(r)) * m)), N = smooth(j), P = smooth(D), F = h(W, G);
					J = .08 + .47 * b - .16 * E - .25 * T + .012 * F * b, Y = .04 + .3 * b - .13 * E - .14 * T + .002 * F * b, X = t.roughness + .25 * (1 - b) + .13 * E + .12 * T, Z = .35 + .62 * b - .17 * E - .33 * T, J = J * (1 - O) + O * (.65 + .1 * P + .012 * F), Y = Y * (1 - O) + O * (.42 + .13 * P), X = X * (1 - O) + .25 * O, Z = Z * (1 - O) + .94 * O, J = J * (1 - M) + M * (.55 + .2 * N + .012 * F), Y = Y * (1 - M) + M * (.53 + .27 * N), X = X * (1 - M) + .24 * M, Z = Z * (1 - M) + .99 * M;
				};
			}
			case `cashews`: {
				let t = require_materials.proceduralMaterialPresets.cashews, n = new Float64Array(t.cells * t.cells), i = new Float64Array(t.tipRadii.length);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = .9 + .1 * hash(i, e, r ^ 28097);
				for (let e = 0; e < t.tipRadii.length; e++) i[e] = 1 / (t.tipRadii[e] * t.tipRadii[e]);
				let a = 1 / (t.outerX * t.outerX), o = 1 / (t.outerY * t.outerY), s = 1 / (t.openingRadiusX * t.openingRadiusX), c = 1 / (t.openingRadiusY * t.openingRadiusY), l = 1 / t.shoulder, u = Math.cos(t.turn), d = Math.sin(t.turn), f = cachedNoise(96, 96, r ^ 28099);
				return () => {
					let e = W * t.cells, r = G * t.cells, p = Math.floor(e), m = Math.floor(r), h = fract(e) - .5, g = fract(r) - .5, _ = p + m & 1 ? -1 : 1, v = h * u + g * d * _, y = -h * d * _ + g * u, b = clamp(1 - v * v * a - y * y * o), x = v - t.openingX, S = smooth(clamp((1 - x * x * s - y * y * c) * l)), C = 1 - smooth(clamp(b * l)) * (1 - S), w = 1 - smooth(b) * (1 - S);
					for (let e = 0; e < t.tipRadii.length; e++) {
						let n = v - t.tipX, r = y - (e === 0 ? t.tipY : -t.tipY), a = clamp(1 - (n * n + r * r) * i[e]);
						C *= 1 - smooth(clamp(a * l)), w *= 1 - smooth(a);
					}
					let T = 1 - C, E = 1 - w, D = f(W, G);
					J = .06 + T * (.7 * n[m * t.cells + p] + .02 * D) + .12 * E, Y = .06 + .4 * T + .24 * E + .004 * D * T, X += .16 * (1 - T) - .06 * T + .015 * D * T, Z = .43 + .53 * T;
				};
			}
			case `coffeerings`: {
				let t = require_materials.proceduralMaterialPresets.coffeerings, i = new Float64Array(t.cells * t.cells * 7);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 7, s = n * hash(a, e, r ^ 16001), c = t.radius + t.radiusVariation * hash(a, e, r ^ 20371), l = c * (t.minorRatio + (1 - t.minorRatio) * hash(a, e, r ^ 20645)), u = Math.cos(s), d = Math.sin(s);
					i[o] = .5 + t.centerJitter * (hash(a, e, r ^ 25015) - .5), i[o + 1] = .5 + t.centerJitter * (hash(a, e, r ^ 29385) - .5), i[o + 2] = u / c, i[o + 3] = d / c, i[o + 4] = u / l, i[o + 5] = d / l, i[o + 6] = .55 + .25 * hash(a, e, r ^ 33755);
				}
				let a = cachedNoise(96, 96, r ^ 55581), o = cachedNoise(12, 12, r ^ 59951), s = cachedNoise(24, 24, r ^ 64321), c = 1 / t.ringBand, l = 1 / t.innerShoulder;
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 7, u = fract(e) - i[r], d = fract(n) - i[r + 1], f = u * i[r + 2] + d * i[r + 3], p = d * i[r + 4] - u * i[r + 5], m = f * f + p * p + t.warp * (o(W, G) - .5), h = (m - 1) * c, g = smooth(clamp(1 - h * h)), _ = smooth(clamp((1 - m) * l)), v = .45 + .55 * s(W, G), y = i[r + 6] * g * v + .08 * _, b = a(W, G);
					J = .94 - .68 * y + .012 * b, Y = .12 + .006 * b + .002 * y, X += -.1 * y + .015 * b, Z = .99;
				};
			}
			case `pillowtiles`: {
				let t = require_materials.proceduralMaterialPresets.pillowtiles, n = cachedNoise(96, 96, r ^ 51209), i = new Float64Array(t.cells * t.cells), a = 1 / t.halfWidth, o = 1 / t.shoulder;
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) i[e * t.cells + n] = hash(n, e, r ^ 11641);
				return () => {
					let e = W * t.cells, r = G * t.cells, s = (fract(e) - .5) * a, c = (fract(r) - .5) * a, l = s * s, u = c * c, d = smooth(clamp((1 - l * l - u * u) * o)), f = smooth(clamp(1 - .5 * (l + u))), p = i[Math.floor(r) * t.cells + Math.floor(e)], m = n(W, G);
					J = .45 + d * (.2 + .12 * f + .08 * p + .015 * m), Y = .04 + d * (.42 + .3 * f + .005 * m), Q = 1 - d, X += .5 * Q - .04 * f * d + .02 * m * d, Z = .5 + .48 * d;
				};
			}
			case `ribknit`: {
				let t = require_materials.proceduralMaterialPresets.ribknit, n = cachedNoise(96, 96, r ^ 47093), i = t.armTop - t.armBottom, a = 1 / (t.armX * t.armX + i * i), o = 1 / (t.yarnWidth * t.yarnWidth), s = 1 / (t.purlWidth * t.purlWidth);
				return () => {
					let e = W * t.cells, r = G * t.cells, c = fract(e) - .5, l = fract(r) - .5, u = Math.floor(e) & 1, d;
					if (u) {
						let e = c - Math.max(-t.purlLength, Math.min(t.purlLength, c));
						d = smooth(clamp(1 - (e * e + (l - t.purlY) ** 2) * s));
					} else {
						let e = 1;
						for (let n = -1; n <= 1; n += 2) {
							let r = n * t.armX, s = l - t.armBottom, u = clamp((c * r + s * i) * a), d = c - u * r, f = s - u * i;
							e *= 1 - smooth(clamp(1 - (d * d + f * f) * o));
						}
						d = 1 - e;
					}
					let f = n(W, G);
					J = .1 + d * (.62 - .18 * u + .05 * f), Y = .07 + d * (.7 - .26 * u + .02 * f), X += .06 * (1 - d) + .04 * u * d + .02 * f * d, Z = .45 + d * (.53 - .08 * u);
				};
			}
			case `ivyleaf`: {
				let t = require_materials.proceduralMaterialPresets.ivyleaf, n = new Float64Array(t.lobes.length * 6), i = new Float64Array(t.lobes.length * 3);
				for (let e = 0; e < t.lobes.length; e++) {
					let [r, a, o, s, c] = t.lobes[e], l = Math.cos(c), u = Math.sin(c);
					n[e * 6] = r, n[e * 6 + 1] = a, n[e * 6 + 2] = 1 / o, n[e * 6 + 3] = 1 / s, n[e * 6 + 4] = l, n[e * 6 + 5] = u;
					let d = r - s * u, f = a - s * l - t.veinRoot;
					i[e * 3] = d, i[e * 3 + 1] = f, i[e * 3 + 2] = 1 / (d * d + f * f);
				}
				let a = 1 / t.shoulder, o = 1 / (t.veinWidth * t.veinWidth), s = 1 / (t.stemWidth * t.stemWidth), c = 1 / t.stemShoulder, l = t.stemEnd - t.stemStart, u = 1 / l, d = cachedNoise(96, 96, r ^ 42721);
				return () => {
					let e = W * t.cells, r = G * t.cells, f = fract(e) - .5, p = fract(r) - .5, m = Math.floor(e) + Math.floor(r) & 1 ? 1 : -1, h = (f + m * p) * Math.SQRT1_2, g = (p - m * f) * Math.SQRT1_2, _ = g - t.veinRoot, v = 1, y = 1;
					for (let e = 0; e < t.lobes.length; e++) {
						let t = e * 6, r = e * 3, s = h - n[t], c = g - n[t + 1], l = (s * n[t + 4] - c * n[t + 5]) * n[t + 2], u = (s * n[t + 5] + c * n[t + 4]) * n[t + 3], d = clamp(1 - u * u);
						v *= 1 - smooth(clamp((d * d - l * l) * a));
						let f = clamp((h * i[r] + _ * i[r + 1]) * i[r + 2]), p = h - f * i[r], m = _ - f * i[r + 1];
						y *= 1 - smooth(clamp(1 - (p * p + m * m) * o));
					}
					let b = 1 - v, x = (1 - y) * b, S = clamp((g - t.stemStart) * u), C = g - t.stemStart - S * l, w = smooth(clamp((1 - (h * h + C * C) * s) * c)), T = 1 - (1 - b) * (1 - w), E = d(W, G);
					J = .06 + .55 * T + .07 * b + .18 * x + .025 * E * T, Y = .06 + .5 * T + .09 * x + .007 * E * T, X += .2 * (1 - T) - .12 * x + .02 * E * T, Z = .36 + .6 * T + .02 * x;
				};
			}
			case `linchpins`: {
				let t = require_materials.proceduralMaterialPresets.linchpins, n = cachedNoise(96, 96, r ^ 134417), i = t.ringRadius * t.ringRadius, a = 1 / (2 * t.ringRadius * t.wireWidth), o = 1 / (t.shaftRadius * t.shaftRadius), s = 1 / t.headHalfX, c = 1 / t.headHalfY, l = 1 / t.shoulder, u = Math.max(Math.abs(t.shaftLeft), Math.abs(t.shaftRight)) + t.shaftRadius, d = Math.abs(t.headX) + t.headHalfX, f = Math.max(u * u, d * d + t.headHalfY * t.headHalfY, i + 2 * t.ringRadius * t.wireWidth);
				return () => {
					let e = W * t.cells, r = G * t.cells, u = Math.floor(e), d = Math.floor(r), p = e - u - .5, m = r - d - .5, h = n(W, G);
					if (J = .04 + .02 * h, Y = .06 + .004 * h, X = t.roughness + .02 * h + .36, Z = .4 + .02 * h, $ = 0, p * p + m * m >= f) return;
					let g = u + d & 1 ? 1 : -1, _ = (p + g * m) * Math.SQRT1_2, v = (m - g * p) * Math.SQRT1_2, y = (_ * _ + v * v - i) * a, b = 1 - y * y, x = smooth(clamp(b * l)), S = _ - Math.min(t.shaftRight, Math.max(t.shaftLeft, _)), C = 1 - (S * S + v * v) * o, w = smooth(clamp(C * l)), T = (_ - t.headX) * s, E = v * c, D = T * T, O = E * E, k = D * D, A = O * O, j = 1 - k * k - A * A, M = smooth(clamp(j * l)), N = 1 - (1 - x) * (1 - w) * (1 - M);
					if (N === 0) return;
					let P = smooth(clamp(b)), F = smooth(clamp(C)), I = smooth(clamp(j));
					J = .04 + N * (.75 + .08 * (1 - (1 - P) * (1 - F) * (1 - I))) + .02 * h, Y += x * (.42 + .12 * P - Y), Y += w * (.54 + .12 * F - Y), Y += M * (.64 + .1 * I - Y), X = t.roughness + .02 * h + .36 * (1 - N), Z = .4 + .56 * N + .02 * h, $ = N;
				};
			}
			case `rclips`:
			case `paperclips`: {
				let n = t === `rclips`, i = require_materials.proceduralMaterialPresets[t], a = new Float64Array(i.legs.length * 5), o = new Float64Array(i.bends.length * 5);
				for (let e = 0; e < i.legs.length; e++) {
					let [t, n, r, o] = i.legs[e], s = r - t, c = o - n;
					a[e * 5] = t, a[e * 5 + 1] = n, a[e * 5 + 2] = s, a[e * 5 + 3] = c, a[e * 5 + 4] = 1 / (s * s + c * c);
				}
				for (let e = 0; e < i.bends.length; e++) {
					let [t, n, r, a] = i.bends[e];
					o[e * 5] = t, o[e * 5 + 1] = n, o[e * 5 + 2] = r * r, o[e * 5 + 3] = 1 / (2 * r * i.wireWidth), o[e * 5 + 4] = a;
				}
				let s = 1 / (i.wireWidth * i.wireWidth), c = 1 / i.shoulder, l = 1 / i.arcFade, u = cachedNoise(96, 96, r ^ 38359);
				return () => {
					let e = W * i.cells, t = G * i.cells, r = fract(e) - .5, d = fract(t) - .5, f = Math.floor(e) + Math.floor(t) & 1 ? 1 : -1, p = (r + f * d) * Math.SQRT1_2, m = (d - f * r) * Math.SQRT1_2, h = 1, g = 1;
					for (let e = 0; e < a.length; e += 5) {
						let t = p - a[e], r = m - a[e + 1], i = clamp((t * a[e + 2] + r * a[e + 3]) * a[e + 4]), o = t - i * a[e + 2], l = r - i * a[e + 3], u = 1 - (o * o + l * l) * s;
						h *= 1 - smooth(clamp(u * c)), n && (g *= 1 - smooth(clamp(u)));
					}
					for (let e = 0; e < o.length; e += 5) {
						let t = p - o[e], r = m - o[e + 1], i = (t * t + r * r - o[e + 2]) * o[e + 3], a = smooth(clamp(1 + r * o[e + 4] * l)), s = 1 - i * i;
						h *= 1 - a * smooth(clamp(s * c)), n && (g *= 1 - a * smooth(clamp(s)));
					}
					let _ = 1 - h, v = u(W, G);
					if (n) {
						let e = 1 - g;
						J = .05 + _ * (.6 + .17 * e) + .02 * v, Y = .06 + _ * (.28 + .36 * e) + .004 * v, $ = _;
					} else J = .05 + .77 * _ + .02 * v, Y = .06 + .64 * _ + .004 * v;
					X += .3 * (1 - _) + .02 * v, Z = .33 + .65 * _;
				};
			}
			case `appleslice`: {
				let t = require_materials.proceduralMaterialPresets.appleslice, i = cachedNoise(96, 96, r ^ 33987), a = new Float64Array(t.chambers * 2);
				for (let e = 0; e < t.chambers; e++) a[e * 2] = Math.cos(e * n / t.chambers), a[e * 2 + 1] = Math.sin(e * n / t.chambers);
				let o = t.radius * t.radius, s = t.fleshRadius * t.fleshRadius, c = t.coreRadius * t.coreRadius, l = 1 / (o - (t.radius - t.peelBevel) ** 2), u = 1 / (s - (t.fleshRadius - t.fleshBevel) ** 2), d = 1 / (c - (t.coreRadius - t.coreBevel) ** 2), f = 1 / t.chamberLength, p = 1 / t.chamberWidth, m = 1 / t.seedLength, h = 1 / t.seedWidth, g = 1 / t.chamberShoulder, _ = 1 / t.seedShoulder, v = Math.cos(Math.PI / t.chambers), y = Math.sin(Math.PI / t.chambers);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, b = fract(n) - .5, x = Math.floor(e) + Math.floor(n) & 1, S = x ? r * v + b * y : r, C = x ? b * v - r * y : b, w = S * S + C * C, T = smooth(clamp((o - w) * l)), E = smooth(clamp((s - w) * u)), D = smooth(clamp((c - w) * d)), O = 1, k = 1;
					for (let e = 0; e < a.length; e += 2) {
						let n = S * a[e] + C * a[e + 1], r = C * a[e] - S * a[e + 1], i = (n - t.chamberCenter) * f, o = r * p, s = (n - t.seedCenter) * m, c = r * h;
						O *= 1 - smooth(clamp((1 - i * i - o * o) * g)), k *= 1 - smooth(clamp((1 - s * s - c * c) * _));
					}
					let A = 1 - O, j = 1 - k, M = i(W, G);
					J = .06 + T * (.14 + .74 * E - .06 * D - .4 * A - .4 * j + .02 * M), Y = .06 + T * (.5 + .05 * E - .05 * D - .15 * A + .08 * j + .003 * M), X += .25 * (1 - T) - .14 * E + .14 * A - .2 * j + .02 * M * T, Z = .38 + .6 * T - .04 * D - .18 * A + .12 * j;
				};
			}
			case `diamondcheckertiles`: {
				let t = require_materials.proceduralMaterialPresets.diamondcheckertiles, n = cachedNoise(96, 96, r ^ 29609), i = t.cells * 2, a = new Float64Array(t.cells * i), o = 1 / t.bevel;
				for (let e = 0; e < i; e++) for (let n = 0; n < t.cells; n++) a[e * t.cells + n] = hash(n, e, r ^ 7271);
				return () => {
					let e = (W + G) * t.cells, r = (W - G) * t.cells, s = Math.floor(e), c = Math.floor(r), l = fract(e), u = fract(r), d = smooth(clamp((Math.min(l, 1 - l) - t.grout) * o)) * smooth(clamp((Math.min(u, 1 - u) - t.grout) * o)), f = ((s - c) % i + i) % i, p = s % t.cells, m = a[f * t.cells + p], h = n(W, G);
					J = .45 + d * ((s + c & 1 ? .88 : .11) + .035 * m + .012 * h - .45), Y = .06 + d * (.7 + .01 * h), Q = 1 - d, X += .55 * Q + .03 * h * d, Z = .52 + .46 * d;
				};
			}
			case `spurgears`: {
				let t = require_materials.proceduralMaterialPresets.spurgears, i = cachedNoise(96, 96, r ^ 26865), a = new Float64Array(t.teeth * 2);
				for (let e = 0; e < t.teeth; e++) a[e * 2] = Math.cos(e * n / t.teeth), a[e * 2 + 1] = Math.sin(e * n / t.teeth);
				let o = t.bodyRadius * t.bodyRadius, s = 1 / (o - (t.bodyRadius - t.bodyBevel) ** 2), c = t.boreRadius * t.boreRadius, l = 1 / ((t.boreRadius + t.boreBevel) ** 2 - c), u = t.hubRadius * t.hubRadius, d = 1 / (u - (t.hubRadius - t.hubBevel) ** 2), f = 1 / t.toothBevel, p = Math.cos(Math.PI / t.teeth), m = Math.sin(Math.PI / t.teeth);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, h = fract(n) - .5;
					if (Math.floor(e) + Math.floor(n) & 1) {
						let e = r * p + h * m;
						h = -r * m + h * p, r = e;
					}
					let g = r * r + h * h, _ = smooth(clamp((o - g) * s)), v = smooth(clamp((g - c) * l)), y = 1 - _;
					for (let e = 0; e < t.teeth; e++) {
						let n = a[e * 2], i = a[e * 2 + 1], o = r * n + h * i, s = -r * i + h * n, c = smooth(clamp((o - t.toothRoot) * f)) * smooth(clamp((t.toothTip - o) * f)) * smooth(clamp((t.toothHalfWidth - Math.abs(s)) * f));
						y *= 1 - c;
					}
					let b = (1 - y) * v, x = smooth(clamp((u - g) * d)) * v, S = i(W, G);
					J = .06 + .73 * b + .07 * x + .02 * S, Y = .05 + .48 * b + .18 * x + .003 * S, X += .25 * (1 - b) - .04 * x + .02 * S, Z = .35 + .62 * b + .02 * x;
				};
			}
			case `pumpkinseeds`: {
				let t = require_materials.proceduralMaterialPresets.pumpkinseeds, n = cachedNoise(96, 96, r ^ 19369), i = Math.SQRT1_2, a = 1 / (t.halfLength * t.halfLength), o = 1 / (t.halfWidth * t.halfWidth), s = 1 / t.shoulder;
				return () => {
					let e = W * t.cells, r = G * t.cells, c = Math.floor(e) + Math.floor(r) & 1 ? 1 : -1, l = fract(e) - .5, u = fract(r) - .5, d = (l + c * u) * i, f = (u - c * l) * i, p = clamp(1 - f * f * a), m = p * p - d * d * o, h = smooth(clamp(m * s)), g = smooth(clamp((m - t.rimInset) * s)), _ = h - g, v = n(W, G);
					J = .06 + .74 * h - .16 * g + .02 * v * h, Y = .05 + .25 * g + .5 * _ + .003 * v * h, X += .22 * (1 - h) + .06 * _ + .02 * v * h, Z = .4 + .42 * g + .54 * _;
				};
			}
			case `pinstripewool`:
			case `twillweave`: {
				let n = t === `pinstripewool`, i = n ? require_materials.proceduralMaterialPresets.pinstripewool : require_materials.proceduralMaterialPresets.twillweave, a = n ? require_materials.proceduralMaterialPresets.pinstripewool.stripeEvery : 0, o = cachedNoise(128, 128, r ^ 12133), s = 1 / (i.halfWidth * i.halfWidth), c = 1 / i.exposureShoulder;
				return () => {
					let e = W * i.cells, t = G * i.cells, r = Math.floor(e), l = Math.floor(t), u = fract(e) - .5, d = fract(t) - .5, f = smooth(clamp(1 - u * u * s)), p = smooth(clamp(1 - d * d * s)), m = (r - l & 3) < 2 ? smooth(clamp((i.exposureHalf - Math.abs(u)) * c)) * smooth(clamp((i.exposureHalf - Math.abs(d)) * c)) : 0, h = .46 * f + .18 * p * (1 - f), g = .46 * p + .18 * f * (1 - p), _ = n ? .06 + .015 * f + (r % a === 0 ? .8 * f : 0) : .08 + .2 * f + .65 * p * (1 - f), v = n ? .06 + .015 * p : .08 + .65 * p + .2 * f * (1 - p), y = f * (1 - m) + p * m, b = 1 - (1 - f) * (1 - p), x = o(W, G);
					J = _ * (1 - m) + v * m + .03 * x * b, Y = .05 + h * (1 - m) + g * m + .006 * x * b, X += .08 * (1 - y) + .02 * x * b, Z = .5 + .48 * b;
				};
			}
			case `eucalyptusleaf`: {
				let t = require_materials.proceduralMaterialPresets.eucalyptusleaf, n = cachedNoise(96, 96, r ^ 31185), i = new Float64Array(t.veinPairs);
				for (let e = 0; e < t.veinPairs; e++) i[e] = t.centerY + (e - (t.veinPairs - 1) * .5) * t.veinSpacing;
				let a = Math.SQRT1_2, o = 1 / t.halfLength, s = 1 / (t.halfWidth * t.halfWidth), c = 1 / t.shoulder, l = 1 / (t.stemWidth * t.stemWidth), u = 1 / t.stemShoulder, d = 1 / (t.midribWidth * t.midribWidth), f = 1 / t.midribFade, p = 1 / (t.veinWidth * t.veinWidth), m = 1 / t.veinAxisFade;
				return () => {
					let e = W * t.cells, r = G * t.cells, h = Math.floor(e) + Math.floor(r) & 1 ? 1 : -1, g = fract(e) - .5, _ = fract(r) - .5, v = (g + h * _) * a, y = (_ - h * g) * a, b = (y - t.centerY) * o, x = clamp(1 - b * b), S = v - t.bend * x, C = Math.abs(S), w = smooth(clamp((x * x - S * S * s) * c)), T = smooth(clamp((y - t.stemStart) * u)) * smooth(clamp((t.stemEnd - y) * u)) * smooth(clamp(1 - v * v * l)), E = smooth(clamp(1 - S * S * d)) * smooth(clamp((t.midribLength - Math.abs(y - t.centerY)) * f)), D = y - t.veinSlope * C, O = 0;
					for (let e = 0; e < t.veinPairs; e++) {
						let t = D - i[e];
						O += smooth(clamp(1 - t * t * p));
					}
					O *= smooth(clamp(C * m));
					let k = n(W, G), A = 1 - (1 - w) * (1 - T);
					J = .1 + w * (.52 + .06 * k + .1 * (E + .5 * O)) + (1 - w) * .32 * T, Y = .05 + w * (.53 + .015 * k + .075 * E + .035 * O) + (1 - w) * .28 * T, X += .26 * (1 - w) + w * (.02 * k - .03 * E), Z = .34 + .64 * A;
				};
			}
			case `squarewashers`: {
				let t = require_materials.proceduralMaterialPresets.squarewashers, n = cachedNoise(96, 96, r ^ 22451), i = Math.SQRT1_2, a = 1 / t.bevel, o = t.holeRadius * t.holeRadius, s = 1 / ((t.holeRadius + t.holeBevel) ** 2 - o);
				return () => {
					let e = W * t.cells, r = G * t.cells, c = fract(e) - .5, l = fract(r) - .5;
					if (Math.floor(e) + Math.floor(r) & 1) {
						let e = (c + l) * i;
						l = (l - c) * i, c = e;
					}
					let u = smooth(clamp((t.halfWidth - Math.abs(c)) * a)) * smooth(clamp((t.halfWidth - Math.abs(l)) * a)) * smooth(clamp((c * c + l * l - o) * s)), d = n(W, G);
					J = .06 + .74 * u + .02 * d, Y = .05 + .62 * u + .004 * d, X += .28 * (1 - u) + .03 * d, Z = .36 + .62 * u;
				};
			}
			case `pickettiles`: {
				let t = require_materials.proceduralMaterialPresets.pickettiles, n = Math.sqrt(3) / 2, i = 1 / t.bevel, a = cachedNoise(96, 96, r ^ 14999), o = new Float64Array(t.columns * t.rows);
				for (let e = 0; e < t.rows; e++) for (let n = 0; n < t.columns; n++) o[e * t.columns + n] = hash(n, e, r);
				return () => {
					let e = W * t.columns, r = G * t.rows * n, s = Math.floor(r / n), c = 1 / 0, l = 0, u = 0, d = 0, f = 0;
					for (let i = 0; i <= 1; i++) {
						let a = s + i, o = (a & 1) * .5, p = Math.round(e - o), m = e - p - o, h = r - a * n, g = m * m + h * h;
						g < c && (c = g, l = m, u = h, d = (p % t.columns + t.columns) % t.columns, f = (a % t.rows + t.rows) % t.rows);
					}
					let p = smooth(clamp((.5 - Math.abs(l) - t.gap) * i)) * smooth(clamp((.5 - Math.abs(l * .5 + u * n) - t.gap) * i)) * smooth(clamp((.5 - Math.abs(l * .5 - u * n) - t.gap) * i)), m = o[f * t.columns + d], h = a(W, G);
					J = .14 + p * (.35 + .38 * m + .03 * h), Y = p * (.75 + .04 * m + .01 * h), X = .86 + p * (t.roughness - .86 + .07 * m + .02 * h), Z = .5 + .49 * p, Q = 1 - p;
				};
			}
			case `mangosteenslice`: {
				let t = require_materials.proceduralMaterialPresets.mangosteenslice, i = cachedNoise(96, 96, r ^ 28197), a = new Float64Array(t.lobes * 2);
				for (let e = 0; e < t.lobes; e++) a[e * 2] = Math.cos(e * n / t.lobes), a[e * 2 + 1] = Math.sin(e * n / t.lobes);
				let o = 1 / (t.lobeLength * t.lobeLength), s = 1 / (t.lobeWidth * t.lobeWidth), c = 1 / (t.hubRadius * t.hubRadius), l = t.radius * t.radius, u = t.innerRadius * t.innerRadius, d = l - (t.radius - t.rimShoulder) ** 2, f = u - (t.innerRadius - t.rimShoulder) ** 2, p = Math.cos(Math.PI / t.lobes), m = Math.sin(Math.PI / t.lobes);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, h = fract(n) - .5;
					if (Math.floor(e) + Math.floor(n) & 1) {
						let e = r * p + h * m;
						h = -r * m + h * p, r = e;
					}
					let g = r * r + h * h, _ = smooth(clamp((l - g) / d)), v = _ * (1 - smooth(clamp((u - g) / f))), y = smooth(clamp(1 - g * c)), b = 1 - y, x = 1 - y;
					for (let e = 0; e < t.lobes; e++) {
						let n = a[e * 2], i = a[e * 2 + 1], c = r * n + h * i - t.lobeCenter, l = -r * i + h * n, u = clamp(1 - c * c * o - l * l * s);
						b *= 1 - smooth(clamp(u / t.shoulder)), x *= 1 - smooth(u);
					}
					let S = 1 - b, C = 1 - x, w = i(W, G);
					J = .04 + .12 * _ + .06 * v + S * (.76 + .02 * w), Y = .04 + .16 * _ + .15 * v + .3 * S + .16 * C, X += .24 * v + .15 * (1 - _) - .12 * S + .02 * w * _, Z = .4 + .25 * _ + .32 * S;
				};
			}
			case `garterstitch`: {
				let t = require_materials.proceduralMaterialPresets.garterstitch, n = cachedNoise(96, 96, r ^ 19915), i = cachedNoise(t.columns, t.rows, r ^ 14503), a = 1 / (t.halfWidth * t.halfWidth), o = 1 / (t.halfHeight * t.halfHeight), s = 1 / t.band, c = 1 / (2 * t.clip), l = 1 / t.courseWidth;
				return () => {
					let e = G * t.rows + t.wander * (i(W, G) - .5), r = fract(W * t.columns + (Math.floor(e) & 1) * .5) - .5, u = fract(e) - .5, d = (u - t.loopOffset) ** 2 * o, f = (u + t.loopOffset) ** 2 * o, p = 1, m = 1;
					for (let e = -1; e <= 1; e++) {
						let t = r - e, n = (t * t * a + d - 1) * s;
						p *= 1 - smooth(clamp(1 - n * n));
					}
					for (let e = -.5; e <= .5; e++) {
						let t = r - e, n = (t * t * a + f - 1) * s;
						m *= 1 - smooth(clamp(1 - n * n));
					}
					let h = (1 - p) * smooth(clamp((t.loopOffset - u + t.clip) * c)), g = (1 - m) * smooth(clamp((u + t.loopOffset + t.clip) * c)) * (1 - h), _ = h + g, v = smooth(clamp(1 - (u * l) ** 2)), y = n(W, G);
					J = .64 + .09 * y + .02 * h - .01 * g, Y = .08 + .16 * v + .56 * h + .3 * g + .025 * y, X += .035 * (1 - _) + .015 * y * _, Z = .58 + .2 * v + .2 * _;
				};
			}
			case `seedstitch`: {
				let t = require_materials.proceduralMaterialPresets.seedstitch, n = cachedNoise(96, 96, r ^ 19915), i = t.armTop - t.armBottom, a = 1 / (t.armX * t.armX + i * i), o = 1 / (t.yarnWidth * t.yarnWidth), s = 1 / (t.purlWidth * t.purlWidth);
				return () => {
					let e = W * t.cells, r = G * t.cells, c = fract(e) - .5, l = fract(r) - .5, u = Math.floor(e) + Math.floor(r) & 1, d;
					if (u) {
						let e = c - Math.max(-t.purlLength, Math.min(t.purlLength, c));
						d = smooth(clamp(1 - (e * e + (l - t.purlY) ** 2) * s));
					} else {
						let e = 1;
						for (let n = -1; n <= 1; n += 2) {
							let r = n * t.armX, s = l - t.armBottom, u = clamp((c * r + s * i) * a), d = c - u * r, f = s - u * i;
							e *= 1 - smooth(clamp(1 - (d * d + f * f) * o));
						}
						d = 1 - e;
					}
					let f = n(W, G);
					J = .12 + d * (.55 + .06 * u + .07 * f), Y = .09 + d * (.56 + .1 * u + .025 * f), X += .04 * (1 - d) + .02 * f * d, Z = .49 + .49 * d;
				};
			}
			case `cotterpins`: {
				let t = require_materials.proceduralMaterialPresets.cotterpins, n = new Float64Array(t.legs.length * 5);
				for (let e = 0; e < t.legs.length; e++) {
					let [r, i, a, o] = t.legs[e], s = a - r, c = o - i;
					n[e * 5] = r, n[e * 5 + 1] = i, n[e * 5 + 2] = s, n[e * 5 + 3] = c, n[e * 5 + 4] = 1 / (s * s + c * c);
				}
				let i = 1 / (t.wireWidth * t.wireWidth), a = cachedNoise(96, 96, r ^ 15545);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(e) + Math.floor(r) & 1 ? -1 : 1, s = (fract(e) - .5) * o, c = (fract(r) - .5) * o, l = c - t.eyeY, u = 1 - smooth(clamp((1 - (s / t.outerWidth) ** 2 - (l / t.outerLength) ** 2) / t.shoulder)) * (1 - smooth(clamp((1 - (s / t.innerWidth) ** 2 - (l / t.innerLength) ** 2) / t.shoulder)));
					for (let e = 0; e < n.length; e += 5) {
						let r = s - n[e], a = c - n[e + 1], o = clamp((r * n[e + 2] + a * n[e + 3]) * n[e + 4]), l = r - o * n[e + 2], d = a - o * n[e + 3];
						u *= 1 - smooth(clamp((1 - (l * l + d * d) * i) / t.shoulder));
					}
					let d = 1 - u, f = a(W, G);
					J = .05 + .76 * d + .02 * f, Y = .06 + .64 * d + .004 * f, X += .3 * (1 - d) + .02 * f, Z = .33 + .65 * d;
				};
			}
			case `cowrieshells`: {
				let t = require_materials.proceduralMaterialPresets.cowrieshells, n = cachedNoise(96, 96, r ^ 31655);
				return () => {
					let e = W * t.cells, r = G * t.cells, i = fract(e) - .5, a = fract(r) - .5, o = Math.floor(e) + Math.floor(r) & 1, s = o ? a : i, c = o ? i : a, l = clamp(1 - (s / t.halfWidth) ** 2 - (c / t.halfLength) ** 2), u = smooth(clamp(l / t.shoulder)), d = smooth(clamp((1 - (s / t.apertureWidth) ** 2 - (c / t.apertureLength) ** 2) / t.shoulder)), f = 1;
					for (let e = -1; e <= 1; e += 2) for (let n = 0; n < t.teeth; n++) {
						let r = (n - (t.teeth - 1) / 2) * t.toothPitch;
						f *= 1 - smooth(clamp(1 - ((s - e * t.toothX) / t.toothLength) ** 2 - ((c - r) / t.toothWidth) ** 2));
					}
					let p = 1 - f, m = smooth(l), h = n(W, G);
					J = .035 + u * (.6 + .12 * m - .56 * d + .13 * p + .03 * h), Y = .06 + u * (.32 + .36 * m - .48 * d + .13 * p + .008 * h), X += u * (-.14 + .12 * d - .04 * p + .02 * h), Z = .35 + u * (.62 - .38 * d + .03 * p);
				};
			}
			case `fiddleheads`: {
				let t = require_materials.proceduralMaterialPresets.fiddleheads, i = new Float64Array((t.coilSegments + t.stemSegments) * 10), store = (e, t, n, r, a, o) => {
					let s = e * 10, c = r - t, l = a - n;
					i[s] = t, i[s + 1] = n, i[s + 2] = c, i[s + 3] = l, i[s + 4] = 1 / (c * c + l * l), i[s + 5] = 1 / (o * o), i[s + 6] = Math.min(t, r) - o, i[s + 7] = Math.max(t, r) + o, i[s + 8] = Math.min(n, a) - o, i[s + 9] = Math.max(n, a) + o;
				}, a = t.outerRadius, o = t.coilY;
				for (let e = 0; e < t.coilSegments; e++) {
					let r = (e + 1) / t.coilSegments, i = t.outerRadius + (t.innerRadius - t.outerRadius) * r, s = -n * t.turns * r, c = i * Math.cos(s), l = t.coilY + i * Math.sin(s);
					store(e, a, o, c, l, t.width * (1 - t.taper * r)), a = c, o = l;
				}
				a = t.outerRadius, o = t.coilY;
				for (let e = 0; e < t.stemSegments; e++) {
					let n = (e + 1) / t.stemSegments, r = 1 - n, i = r * r * r * t.outerRadius + 3 * r * r * n * t.outerRadius + 3 * r * n * n * t.stemBendX + n * n * n * t.stemEndX, s = r * r * r * t.coilY + 3 * r * r * n * t.stemControlY + 3 * r * n * n * t.stemBendY + n * n * n * t.stemEndY;
					store(t.coilSegments + e, a, o, i, s, t.width), a = i, o = s;
				}
				let s = cachedNoise(96, 96, r ^ 27285);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e) + Math.floor(n) & 1 ? -1 : 1, a = (fract(e) - .5) * r, o = fract(n) - .5, c = 1;
					for (let e = 0; e < i.length; e += 10) {
						if (a < i[e + 6] || a > i[e + 7] || o < i[e + 8] || o > i[e + 9]) continue;
						let n = a - i[e], r = o - i[e + 1], s = clamp((n * i[e + 2] + r * i[e + 3]) * i[e + 4]), l = n - s * i[e + 2], u = r - s * i[e + 3];
						c *= 1 - smooth(clamp((1 - (l * l + u * u) * i[e + 5]) / t.shoulder));
					}
					let l = 1 - c, u = s(W, G);
					J = .04 + l * (.47 + .18 * u), Y = .05 + l * (.62 + .03 * u), X += l * (-.09 + .03 * u), Z = .36 + .6 * l;
				};
			}
			case `knottednet`: {
				let t = require_materials.proceduralMaterialPresets.knottednet, i = cachedNoise(96, 96, r ^ 24451);
				return () => {
					let e = W * t.cells - .5, r = G * t.cells - .5, a = t.sag * Math.sin(Math.PI * e) ** 2, o = t.sag * Math.sin(Math.PI * r) ** 2, s = fract(r - a + .5) - .5, c = fract(e - o + .5) - .5, l = smooth(clamp(1 - (s / t.cordWidth) ** 2)), u = smooth(clamp(1 - (c / t.cordWidth) ** 2)), d = 1 - (1 - l) * (1 - u), f = fract(e + .5) - .5, p = fract(r + .5) - .5, m = Math.SQRT1_2 * (f + p), h = Math.SQRT1_2 * (p - f), g = smooth(clamp(1 - (m / t.knotLength) ** 2 - (h / t.knotWidth) ** 2)), _ = smooth(clamp(1 - (h / t.knotLength) ** 2 - (m / t.knotWidth) ** 2)), v = 1 - (1 - g) * (1 - _), y = smooth(clamp(1 - (f / t.creaseWidth) ** 2)) * smooth(clamp(1 - (p / t.creaseLength) ** 2)), b = d * (1 - v), x = b + v, S = .5 + .25 * Math.cos(n * t.twists * e) + .25 * Math.cos(n * t.twists * r), C = i(W, G);
					J = .04 + .48 * b + v * (.68 - .13 * y) + .04 * C * x, Y = .04 + .35 * b + v * (.71 - .07 * y) + (.025 * S + .006 * C) * x, X += .06 * (1 - x) - .04 * b + .05 * y * v, Z = .35 + .5 * b + v * (.61 - .09 * y);
				};
			}
			case `brickarches`: {
				let t = require_materials.proceduralMaterialPresets.brickarches, n = new Float64Array(t.voussoirs * 2);
				for (let e = 0; e < t.voussoirs; e++) {
					let r = Math.PI + (e + .5) * Math.PI / t.voussoirs;
					n[e * 2] = Math.cos(r), n[e * 2 + 1] = Math.sin(r);
				}
				let i = t.voussoirs + 2 * t.pierRows, a = new Float64Array(t.cells * t.cells * i);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) for (let o = 0; o < i; o++) a[(e * t.cells + n) * i + o] = .5 + .5 * hash(n * i + o, e, r ^ 15719);
				let o = Math.sin(Math.PI / (2 * t.voussoirs)), s = Math.cos(Math.PI / (2 * t.voussoirs)), c = (t.outerRadius - t.innerRadius) / 2, l = (t.outerRadius + t.innerRadius) / 2, u = cachedNoise(96, 96, r ^ 20089);
				return () => {
					let e = W * t.cells, r = G * t.cells, d = (Math.floor(r) * t.cells + Math.floor(e)) * i, f = fract(e) - .5, p = fract(r) - .5 - t.centerY, m = Math.hypot(f, p), h = smooth(clamp((t.outerRadius - t.gap - m) / t.bevel)) * smooth(clamp((m - t.innerRadius - t.gap) / t.bevel)), g = smooth(clamp((t.outerRadius - m) / t.bevel)) * smooth(clamp((m - t.innerRadius) / t.bevel)) * smooth(clamp((t.bevel - p) / t.bevel)), _ = 0, v = 0;
					for (let e = 0; e < t.voussoirs; e++) {
						let r = f * n[e * 2] + p * n[e * 2 + 1], i = p * n[e * 2] - f * n[e * 2 + 1], c = h * smooth(clamp((o * r - s * Math.abs(i) - t.gap) / t.bevel));
						_ += c, v += c * a[d + e];
					}
					for (let e = 0; e < 2; e++) {
						let n = f - (e ? l : -l), r = smooth(clamp((c - Math.abs(n)) / t.bevel)) * smooth(clamp((p + t.bevel) / t.bevel)) * smooth(clamp((t.pierRows * t.courseHeight - p) / t.bevel));
						g = 1 - (1 - g) * (1 - r);
						for (let r = 0; r < t.pierRows; r++) {
							let i = smooth(clamp((c - t.gap - Math.abs(n)) / t.bevel)) * smooth(clamp((t.courseHeight / 2 - t.gap - Math.abs(p - (r + .5) * t.courseHeight)) / t.bevel));
							_ += i, v += i * a[d + t.voussoirs + e * t.pierRows + r];
						}
					}
					let y = u(W, G);
					Q = g - _, J = .045 * (1 - g) + .62 * v + .08 * y * _ + .5 * Q, Y = .06 + .1 * g + .6 * _ + .01 * y * _, X += .12 * (1 - _) + .04 * y * _, Z = .32 + .18 * g + .48 * _;
				};
			}
			case `cardamompods`: {
				let t = require_materials.proceduralMaterialPresets.cardamompods, i = cachedNoise(96, 96, r ^ 31813), a = Math.SQRT1_2;
				return () => {
					let e = W * t.cells, r = G * t.cells, o = fract(e) - .5, s = fract(r) - .5, c = Math.floor(e) + Math.floor(r) & 1 ? -1 : 1, l = a * (o + c * s), u = a * (s - c * o), d = clamp(1 - (u / t.halfLength) ** 2), f = d * d - (l / t.halfWidth) ** 2, p = smooth(clamp(f / t.shoulder)), m = smooth(clamp((1 - (l / t.stemWidth) ** 2 - ((u - t.stemCenter) / t.stemLength) ** 2) / t.shoulder)), h = 1 - (1 - p) * (1 - m), g = t.halfWidth * (d + t.tipFloor), _ = .5 + .5 * Math.cos(n * 2 * l / g), v = smooth(clamp(f)), y = i(W, G);
					J = .025 + .25 * h + p * (.23 + .23 * _ + .03 * y), Y = .06 + .28 * h + p * (.33 * v + .13 * _ + .008 * y), X += .1 * (1 - h) + p * (.04 * (1 - _) + .02 * y), Z = .36 + .27 * h + p * (.21 + .14 * _);
				};
			}
			case `farfalle`: {
				let t = require_materials.proceduralMaterialPresets.farfalle, i = cachedNoise(128, 128, r ^ 28217);
				return () => {
					let e = W * t.cells, r = G * t.cells, a = fract(e) - .5, o = fract(r) - .5, s = Math.floor(e) + Math.floor(r) & 1, c = s ? o : a, l = s ? a : o, u = t.waist + t.wingSpread * smooth(clamp((c / t.wingRun) ** 2)), d = smooth(clamp((u - Math.abs(l)) / t.shoulder)) * smooth(clamp((t.halfLength + t.scallop * Math.cos(n * t.teeth * l) - Math.abs(c)) / t.shoulder)), f = .5 + .5 * Math.cos(n * 1.5 * l / u), p = smooth(clamp(1 - (c / t.pinchRadius) ** 2)), m = i(W, G);
					J = .045 + d * (.59 + .14 * f - .17 * p + .03 * m), Y = .06 + d * (.31 + .21 * f + .11 * p + .008 * m), X += .18 * (1 - d) + d * (.04 * p - .05 * f), Z = .38 + d * (.53 + .07 * f - .12 * p);
				};
			}
			case `castellatednuts`: {
				let t = require_materials.proceduralMaterialPresets.castellatednuts, i = /* @__PURE__ */ new Float64Array(12);
				for (let e = 0; e < 6; e++) i[e * 2] = Math.cos(n * e / 6), i[e * 2 + 1] = Math.sin(n * e / 6);
				let a = cachedNoise(96, 96, r ^ 23923), o = Math.sqrt(3) / 2;
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, s = fract(n) - .5, c = Math.floor(e) + Math.floor(n) & 1, l = c ? o * r + .5 * s : r, u = c ? o * s - .5 * r : s, d = 1, f = 1;
					for (let e = 0; e < 6; e++) {
						let n = i[e * 2], r = i[e * 2 + 1], a = l * n + u * r, o = u * n - l * r;
						d *= smooth(clamp((t.inradius - a) / t.outerBevel)), f *= 1 - smooth(clamp((1 - ((a - t.slotCenter) / t.slotLength) ** 2 - (o / t.slotWidth) ** 2) / t.shoulder));
					}
					let p = d * smooth(clamp((Math.hypot(l, u) - t.boreRadius) / t.boreBevel)), m = p * f, h = a(W, G);
					J = .1 + .21 * p + .4 * m + .03 * h, Y = .07 + .3 * p + .39 * m + .004 * h, X += .32 * (1 - p) + .17 * (p - m) + .02 * h, Z = .4 + .26 * p + .32 * m;
				};
			}
			case `peppercorns`: {
				let t = require_materials.proceduralMaterialPresets.peppercorns, n = cachedNoise(40, 40, r ^ 15993), i = cachedNoise(128, 128, r ^ 27971), a = t.radius * t.radius, o = t.scarRadius * t.scarRadius;
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, s = e * e + r * r, c = clamp(1 - s / a), l = smooth(clamp(c / t.shoulder)), u = smooth(c), d = smooth(clamp((1 - s / o) / t.shoulder)), f = 2 * n(W, G) - 1, p = f * f, m = i(W, G);
					J = .035 + l * (.18 + .24 * u + .16 * p + .03 * m - .19 * d), Y = .07 + l * (.25 + .42 * u + .11 * p + .008 * m - .14 * d), X += .06 * l - .04 * p * l + .065 * d, Z = .4 + l * (.49 + .09 * p - .12 * d);
				};
			}
			case `slottedmetal`: {
				let t = require_materials.proceduralMaterialPresets.slottedmetal, n = cachedNoise(128, 8, r ^ 31571), i = t.outerRadius * t.outerRadius, a = i - t.coreRadius * t.coreRadius, o = t.columns / t.rows;
				return () => {
					let e = Math.floor(G * t.rows), r = fract(W * t.columns - (e & 1) * .5) - .5, s = (fract(G * t.rows) - .5) * o, c = Math.max(0, Math.abs(s) - t.spine), l = smooth(clamp((i - c * c - r * r) / a)), u = 4 * l * (1 - l), d = n(W, G);
					J = .64 + .07 * d - .57 * l + .11 * u, Y = .64 + .008 * d - .49 * l + .03 * u, X += .42 * l - .06 * u + .02 * d, Z = .99 - .64 * l;
				};
			}
			case `burlwood`: {
				let t = require_materials.proceduralMaterialPresets.burlwood, i = cachedNoise(3, 3, r ^ 20329), a = cachedNoise(7, 7, r ^ 40245), o = cachedNoise(96, 96, r ^ 6983);
				return () => {
					let e = W * t.cells, r = G * t.cells, s = t.centers[Math.floor(r) * t.cells + Math.floor(e)], c = (fract(e) - s[0]) / t.radiusX, l = (fract(r) - s[1]) / t.radiusY, u = c * c + l * l, d = smooth(clamp(1 - u)), f = smooth(clamp((t.core - u) / t.core)), p = a(W, G), m = o(W, G), h = 3 * i(W, G) + .8 * p + .08 * m, g = (.5 + .5 * Math.cos(n * h)) ** 4, _ = d > 0 ? d * (.5 + .5 * Math.cos(n * (t.rings * u + .2 * (p - .5) * u * d))) : 0;
					J = .74 - .26 * g - .36 * f - .12 * _, Y = .46 - .008 * g - .018 * f + .003 * m, X += .06 * f + .025 * g + .012 * m, Z = .99 - .05 * f - .015 * g;
				};
			}
			case `trihexagonaltiles`: {
				let t = require_materials.proceduralMaterialPresets.trihexagonaltiles, n = cachedNoise(96, 96, r ^ 23623), i = t.apothem - t.grout, a = t.apothem + t.grout + t.bevel, o = 2 * a / t.rowStep;
				return () => {
					let e = W * t.columns * 2, r = G * t.rows * t.rowStep, s = Math.floor(r / t.rowStep), c = 1, l = 1;
					for (let n = -1; n <= 1; n++) {
						let u = s + n, d = r - u * t.rowStep;
						if (Math.abs(d) >= a) continue;
						let f = u & 1, p = Math.floor((e - f) / 2);
						for (let n = -1; n <= 1; n++) {
							let r = e - (p + n) * 2 - f;
							if (Math.abs(r) >= o) continue;
							let s = Math.abs(d), u = Math.abs(t.apothem * r + .5 * d), m = Math.abs(t.apothem * r - .5 * d), h = smooth(clamp((i - s) / t.bevel)) * smooth(clamp((i - u) / t.bevel)) * smooth(clamp((i - m) / t.bevel)), g = smooth(clamp((a - s) / t.bevel)) * smooth(clamp((a - u) / t.bevel)) * smooth(clamp((a - m) / t.bevel));
							c *= 1 - h, l *= 1 - g;
						}
					}
					let u = 1 - c, d = l, f = u + d, p = n(W, G);
					J = .18 * u + .9 * d + .025 * p * f, Y = .08 + .58 * u + .5 * d + .003 * p * f, Q = clamp(1 - f), X += .36 * Q - .1 * u - .04 * d + .015 * p, Z = .48 + .5 * f;
				};
			}
			case `scalemail`: {
				let t = require_materials.proceduralMaterialPresets.scalemail, n = cachedNoise(128, 8, r ^ 20115);
				return () => {
					let e = W * t.columns, r = G * t.rows, i = Math.floor(r), a = n(W, G);
					J = .07 + .02 * a, Y = .08 + .004 * a, X = .9, Z = .57;
					for (let n = 1; n >= -1; n--) {
						let o = i + n, s = (o & 1) * .5, c = Math.floor(e - s);
						for (let n = -1; n <= 1; n++) {
							let i = e - c - n - s - .5, l = r - o - .5, u = (i / (t.width * (.6 + .4 * smooth(clamp((t.length - l) / (2 * t.length)))))) ** 2 + (l / t.length) ** 2, d = smooth(clamp((1 - u) / t.shoulder));
							if (d === 0) continue;
							let f = smooth(clamp(1 - (i / t.ridgeWidth) ** 2)) * smooth(clamp(1 - (l / t.ridgeLength) ** 2)), p = smooth(clamp((1 - (i / t.rivetRadius) ** 2 - ((l - t.rivetY) / t.rivetRadius) ** 2) / t.shoulder)), m = smooth(clamp((u - .64) / .15)) * smooth(clamp((1 - u) / t.shoulder));
							J += d * (.56 + .18 * f + .16 * p + .07 * m + .04 * a - J), Y += d * (.47 + .2 * f + .11 * p + .06 * m + .005 * a - Y), X += d * (t.roughness - .06 * f - .03 * p + .03 * a - X), Z += d * (.91 + .06 * f + .02 * p - Z);
						}
					}
				};
			}
			case `wheatears`: {
				let t = require_materials.proceduralMaterialPresets.wheatears, n = cachedNoise(96, 96, r ^ 36145);
				return () => {
					let e = W * t.cells, r = G * t.cells, i = Math.floor(e) + Math.floor(r) & 1 ? -1 : 1, a = (fract(e) - .5) * i, o = (fract(r) - .5) * i, s = 1, c = 1, l = 1, u = 1;
					for (let e = 0; e < t.pairs; e++) for (let n = -1; n <= 1; n += 2) {
						let r = a * n - t.offset, i = o - (e - (t.pairs - 1) / 2) * t.spacing, d = (r - i) * Math.SQRT1_2, f = (r + i) * Math.SQRT1_2, p = 1 - (d / t.kernelLength) ** 2 - (f / t.kernelWidth) ** 2, m = smooth(clamp(p / t.shoulder));
						s *= 1 - m, c *= 1 - m * smooth(clamp(p)), l *= 1 - m * smooth(clamp((1 - (f / t.grooveWidth) ** 2) / t.shoulder)), u *= 1 - smooth(clamp((1 - ((d - t.awnCenter) / t.awnLength) ** 2 - (f / t.awnWidth) ** 2) / t.shoulder));
					}
					let d = smooth(clamp((1 - (a / t.stalkWidth) ** 2 - ((o - t.stalkCenter) / t.stalkLength) ** 2) / t.shoulder)), f = 1 - s, p = 1 - c, m = 1 - l, h = 1 - s * u * (1 - d), g = n(W, G);
					J = .08 + .25 * h + .38 * f + .08 * p - .06 * m + .03 * h * g, Y = .1 + .22 * h + .34 * f + .1 * p - .05 * m + .004 * h * g, X += .04 * h - .1 * f + .02 * h * g, Z = .62 + .21 * h + .16 * f - .05 * m;
				};
			}
			case `cinnamonswirl`: {
				let t = require_materials.proceduralMaterialPresets.cinnamonswirl, i = cachedNoise(96, 96, r ^ 27685), a = t.radius * t.radius, o = t.core * t.core, s = t.fillingRadius * t.fillingRadius;
				return () => {
					let e = W * t.cells, r = G * t.cells, c = Math.floor(e) + Math.floor(r) & 1, l = (fract(e) - .5) * (c ? -1 : 1), u = (fract(r) - .5) * (c ? -1 : 1), d = l * l + u * u, f = Math.sqrt(d), p = smooth(clamp((a - d) / t.shoulder)), m = n * f / t.pitch, h = f > 0 ? (Math.cos(m) * l + Math.sin(m) * u) / f : 1, g = 1 - smooth(clamp((d - o / 4) / (o * .75))), _ = smooth(clamp((h - .83) / .14)), v = (g + (1 - g) * _) * smooth(clamp((s - d) / t.fillingShoulder)), y = 1 - smooth(clamp((a - d) / .04)), b = i(W, G);
					J = .08 + p * (.76 - .5 * v - t.crustStrength * y + .04 * b), Y = .1 + p * (.58 - .16 * v + .012 * b), X += p * (.02 * b - .08 * v), Z = .62 + p * (.37 - .12 * v);
				};
			}
			case `fivebarplate`: {
				let t = require_materials.proceduralMaterialPresets.fivebarplate, n = cachedNoise(128, 8, r ^ 11105), i = t.radius * t.radius;
				return () => {
					let e = W * t.cells, r = G * t.cells, a = fract(e) - .5, o = fract(r) - .5, s = (a + o) * Math.SQRT1_2, c = (o - a) * Math.SQRT1_2, l = Math.floor(e) + Math.floor(r) & 1, u = l ? c : s, d = l ? -s : c, f = Math.max(0, Math.abs(u) - t.halfLength), p = 1;
					for (let e = 0; e < t.bars; e++) {
						let n = d - (e - (t.bars - 1) / 2) * t.spacing;
						p *= 1 - smooth(clamp((i - f * f - n * n) / t.shoulder));
					}
					let m = 1 - p, h = n(W, G);
					J = .32 + .51 * m + .03 * h, Y = .18 + .55 * m + .004 * h, X -= .18 * m - .02 * h, Z = .82 + .17 * m;
				};
			}
			case `gingerslice`: {
				let t = require_materials.proceduralMaterialPresets.gingerslice, n = cachedNoise(64, 64, r ^ 63805), i = cachedNoise(128, 12, r ^ 6735), a = new Float64Array(t.lobes.length * 4);
				for (let e = 0; e < t.lobes.length; e++) {
					let n = t.lobes[e], r = e * 4;
					a[r] = n[0], a[r + 1] = n[1], a[r + 2] = 1 / (n[2] * n[2]), a[r + 3] = 1 / (n[2] - t.rindWidth) ** 2;
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, o = fract(e) - .5, s = fract(r) - .5, c = Math.floor(e) + Math.floor(r) & 1, l = c ? s : o, u = c ? -o : s, d = 1, f = 1;
					for (let e = 0; e < a.length; e += 4) {
						let n = l - a[e], r = u - a[e + 1], i = n * n + r * r;
						d *= 1 - smooth(clamp((1 - i * a[e + 2]) / t.shoulder)), f *= 1 - smooth(clamp((1 - i * a[e + 3]) / t.shoulder));
					}
					let p = 1 - d, m = 1 - f, h = n(W, G), g = i(W, G);
					J = .05 + .22 * p + .62 * m + .025 * g * m + .015 * h * p, Y = .05 + .46 * p + .12 * m + .007 * g * m + .003 * h * p, X += .15 * (1 - p) - .25 * m + .03 * h * p, Z = .36 + .6 * p;
				};
			}
			case `tuliptiles`: {
				let t = require_materials.proceduralMaterialPresets.tuliptiles, n = cachedNoise(64, 64, r ^ 59435), i = new Float64Array(t.lobes.length * 6);
				for (let e = 0; e < t.lobes.length; e++) {
					let n = t.lobes[e], r = e * 6;
					i[r] = n[0], i[r + 1] = n[1], i[r + 2] = 1 / n[2], i[r + 3] = 1 / n[3], i[r + 4] = Math.sin(n[4]), i[r + 5] = Math.cos(n[4]);
				}
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, a = smooth(clamp((t.faceSquared - e * e) / t.faceShoulder)) * smooth(clamp((t.faceSquared - r * r) / t.faceShoulder)), o = 1 - smooth(clamp((1 - (e / t.stemWidth) ** 2 - ((r - t.stemY) / t.stemLength) ** 2) / t.shoulder));
					for (let n = 0; n < i.length; n += 6) {
						let a = e - i[n], s = r - i[n + 1], c = (a * i[n + 4] - s * i[n + 5]) * i[n + 3], l = (a * i[n + 5] + s * i[n + 4]) * i[n + 2], u = clamp(1 - c * c);
						o *= 1 - smooth(clamp((u * u - l * l) / t.shoulder));
					}
					let s = 1 - o, c = n(W, G);
					J = .93 - .78 * s + .02 * c, Y = a * (.5 + .04 * s + .003 * c), Q = 1 - a, X += .45 * Q + .03 * s, Z = .55 + .43 * a;
				};
			}
			case `eclips`: {
				let t = require_materials.proceduralMaterialPresets.eclips, n = new Float64Array(t.cells * t.cells * 5), i = cachedNoise(96, 96, r ^ 115473), a = t.outerRadius * t.outerRadius, o = t.innerRadius * t.innerRadius, s = 1 / (a - t.outerCore * t.outerCore), c = 1 / (t.innerCore * t.innerCore - o), l = t.pocketRadius * t.pocketRadius, u = 1 / (l - t.pocketCore * t.pocketCore), d = 1 / t.pocketFade, f = 1 / t.lugShoulder, p = 1 / (t.gapHalf * t.gapHalf - t.gapCore * t.gapCore), m = 1 / t.gapFade, h = 1 / t.flareRange;
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 5, o = (e + i & 1) * Math.PI + t.turn * (2 * hash(i, e, r ^ 115477) - 1), s = 1 / (t.scaleMin + t.scaleRange * hash(i, e, r ^ 115479));
					n[a] = Math.cos(o) * s, n[a + 1] = Math.sin(o) * s, n[a + 2] = .5 + t.jitter * (2 * hash(i, e, r ^ 115481) - 1), n[a + 3] = .5 + t.jitter * (2 * hash(i, e, r ^ 115483) - 1), n[a + 4] = hash(i, e, r ^ 115485);
				}
				return () => {
					J = t.backgroundColor, Y = t.backgroundHeight, X = t.backgroundRoughness, Z = t.backgroundOcclusion, $ = 0;
					let e = W * t.cells, r = G * t.cells, g = (Math.floor(r) * t.cells + Math.floor(e)) * 5, _ = fract(e) - n[g + 2], v = fract(r) - n[g + 3], y = _ * n[g] + v * n[g + 1], b = v * n[g] - _ * n[g + 1], x = y * y + b * b;
					if (x <= o || x >= a) return;
					let S = t.flareWidth * smooth(clamp((-b - t.flareStart) * h)), C = t.gapHalf + S, w = smooth(clamp((C * C - y * y) * p)) * smooth(clamp((t.gapTop - b) * m)), T = smooth(clamp((l - x) * u)) * smooth(clamp((b - t.pocketBottom) * d)) * smooth(clamp((Math.abs(y) - t.lugHalf - t.lugSlope * (b - t.innerRadius)) * f)), E = smooth(clamp((a - x) * s)) * smooth(clamp((x - o) * c)) * (1 - w) * (1 - T);
					if (E === 0) return;
					let D = i(W, G);
					J += E * (t.faceColor + t.faceColorVariation * n[g + 4] + t.grainColor * D - J), Y += E * (t.faceHeight + t.microRelief * D - Y), X += E * (t.roughness + t.grainRoughness * D - X), Z += E * (t.faceOcclusion - Z), $ = E;
				};
			}
			case `circlips`: {
				let t = require_materials.proceduralMaterialPresets.circlips, n = cachedNoise(96, 96, r ^ 55065), i = t.innerRadius * t.innerRadius, a = t.outerRadius * t.outerRadius, o = t.gapWidth * t.gapWidth, s = t.lugRadius * t.lugRadius, c = t.boreRadius * t.boreRadius;
				return () => {
					let e = W * t.cells, r = G * t.cells, l = Math.floor(e) + Math.floor(r) & 1 ? -1 : 1, u = (fract(e) - .5) * l, d = (fract(r) - .5) * l, f = u * u + d * d, p = 1 - smooth(clamp((a - f) / t.ringShoulder)) * (1 - smooth(clamp((i - f) / t.ringShoulder))) * (1 - smooth(clamp((o - u * u) / t.gapShoulder)) * smooth(clamp((d - t.gapStart) / t.gapFade))), m = 1;
					for (let e = -1; e <= 1; e += 2) {
						let n = u - e * t.lugX, r = d - t.lugY, i = n * n + r * r;
						p *= 1 - smooth(clamp((s - i) / t.lugShoulder)), m *= 1 - smooth(clamp((c - i) / t.boreShoulder));
					}
					let h = (1 - p) * m, g = n(W, G);
					J = .06 + .76 * h + .02 * g, Y = .06 + .62 * h + .004 * g, X += .3 * (1 - h) + .02 * g, Z = .33 + .65 * h;
				};
			}
			case `lenoweave`: {
				let t = require_materials.proceduralMaterialPresets.lenoweave, i = cachedNoise(128, 128, r ^ 50695);
				return () => {
					let e = fract(W * t.columns) - .5, r = G * t.rows, a = Math.sin(Math.PI * r), o = Math.cos(Math.PI * r), s = smooth(clamp(1 - ((e - t.warpOffset * o) / t.warpWidth) ** 2)), c = smooth(clamp(1 - ((e + t.warpOffset * o) / t.warpWidth) ** 2)), u = smooth(clamp(1 - ((fract(r + .5) - .5) / t.weftWidth) ** 2)), d = smooth(clamp(.5 + 2 * a)), f = smooth(clamp(.5 + 2 * o)), p = s * (1 - c * (1 - d)) * (1 - u * (1 - f)), m = c * (1 - s * d) * (1 - u * f), h = u * (1 - s * f) * (1 - c * (1 - f)), g = p + m + h, _ = i(W, G), v = .5 + .5 * Math.cos(n * W * t.fibers), y = .5 + .5 * Math.cos(n * G * t.fibers);
					J = .04 + .82 * p + .48 * m + .65 * h + .015 * _ * g, Y = .06 + .62 * (p + m) + .52 * h + .08 * (p - m) * a + .008 * ((p + m) * v + h * y) + .005 * _ * g, X += .12 * (1 - g) - .08 * p - .04 * m + .02 * _ * g, Z = .34 + .64 * g;
				};
			}
			case `maplesamara`: {
				let t = require_materials.proceduralMaterialPresets.maplesamara, i = cachedNoise(64, 64, r ^ 46579), a = Math.cos(t.angle), o = Math.sin(t.angle), s = t.wingCenter + t.wingLength;
				return () => {
					let e = W * t.cells, r = G * t.cells, c = Math.floor(e) + Math.floor(r) & 1 ? -1 : 1, l = (fract(e) - .5) * c, u = (fract(r) - .5) * c, d = 1, f = 1, p = 0;
					for (let e = -1; e <= 1; e += 2) {
						let r = l * e - t.originX, i = t.originY - u, c = r * o + i * a, m = r * a - i * o, h = t.wingBaseWidth + t.wingFlare * smooth(clamp(c / s)), g = smooth(clamp((1 - ((c - t.wingCenter) / t.wingLength) ** 2 - (m / h) ** 2) / t.shoulder)), _ = smooth(clamp((1 - ((c - t.seedCenter) / t.seedLength) ** 2 - (m / t.seedWidth) ** 2) / t.shoulder));
						d *= 1 - g, f *= 1 - _, p += g * (.5 + .5 * Math.cos(n * (m / h * t.veins + c * .8)));
					}
					let m = smooth(clamp((1 - (l / t.stalkWidth) ** 2 - ((u - t.originY) / t.stalkHeight) ** 2) / t.shoulder)), h = 1 - d, g = 1 - f, _ = 1 - d * f * (1 - m), v = i(W, G);
					J = .04 + .63 * h * (1 - g) + .32 * g + .2 * m * (1 - h) * (1 - g) + .015 * v * _, Y = .04 + .31 * _ + .37 * g + .025 * p + .01 * v * _, X += .1 * (1 - _) - .08 * g + .02 * v, Z = .32 + .64 * _;
				};
			}
			case `starcrosstiles`: {
				let t = require_materials.proceduralMaterialPresets.starcrosstiles, n = cachedNoise(64, 64, r ^ 42209), i = t.halfSquare - t.grout, a = t.halfSquare + t.grout + t.bevel, o = i * i, s = a * a, c = t.bevel * (2 * i - t.bevel), l = t.bevel * (2 * a - t.bevel), u = 1 - Math.SQRT2 * a, starAt = (e, t, n, r) => {
					let i = smooth(clamp((n - e * e) / r)) * smooth(clamp((n - t * t) / r)), a = (e + t) * Math.SQRT1_2, o = (e - t) * Math.SQRT1_2, s = smooth(clamp((n - a * a) / r)) * smooth(clamp((n - o * o) / r));
					return 1 - (1 - i) * (1 - s);
				};
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, i = starAt(e, r, o, c), a = 1 - starAt(e, r, s, l);
					Math.abs(e) > u && (a *= 1 - starAt(e - Math.sign(e), r, s, l)), Math.abs(r) > u && (a *= 1 - starAt(e, r - Math.sign(r), s, l));
					let d = a, f = i + d, p = n(W, G);
					J = .14 * i + .88 * d + .025 * p * f, Y = .08 + .55 * f + .003 * p * f, Q = clamp(1 - f), X += .42 * Q + .025 * p, Z = .48 + .51 * f;
				};
			}
			case `clovebuds`: {
				let t = require_materials.proceduralMaterialPresets.clovebuds, n = cachedNoise(96, 96, r ^ 62431);
				return () => {
					let e = W * t.cells, r = G * t.cells, i = fract(e) - .5, a = fract(r) - .5, o = Math.floor(e) + Math.floor(r) & 1, s = o ? a : i, c = o ? -i : a, l = smooth(clamp((1 - (s / t.stemWidth) ** 2 - ((c - t.stemCenter) / t.stemLength) ** 2) / t.shoulder)), u = smooth(clamp((1 - (s * s + (c - t.headY) ** 2) / t.headRadius ** 2) / t.shoulder)), d = 1;
					for (let e = 0; e < 4; e++) {
						let n = e < 2 ? 1 : -1, r = (e & 1 ? c - t.collarY : s) * n, i = e & 1 ? s : c - t.collarY;
						d *= 1 - smooth(clamp((1 - ((r - t.sepalDistance) / t.sepalLength) ** 2 - (i / t.sepalWidth) ** 2) / t.shoulder));
					}
					let f = 1 - d, p = 1 - (1 - l) * (1 - u) * d, m = n(W, G);
					J = .025 + .45 * p + .17 * u + .03 * m * p, Y = .04 + .38 * p + .26 * u + .08 * f + .02 * m * p, X += .12 * (1 - p) + .035 * m, Z = .3 + .65 * p;
				};
			}
			case `brogueleather`: {
				let t = require_materials.proceduralMaterialPresets.brogueleather, i = cachedNoise(96, 96, r ^ 58061), a = new Float64Array(t.petals * 2);
				for (let e = 0; e < t.petals; e++) a[e * 2] = Math.cos(e * n / t.petals), a[e * 2 + 1] = Math.sin(e * n / t.petals);
				let o = t.centerRadius * t.centerRadius, s = t.borderRadius * t.borderRadius;
				return () => {
					let e = fract(W * t.cells) - .5, n = fract(G * t.cells) - .5, r = 1 - smooth(clamp((1 - (e * e + n * n) / o) / t.shoulder));
					for (let i = 0; i < a.length; i += 2) {
						let o = (e * a[i] + n * a[i + 1] - t.petalDistance) / t.petalLong, s = (n * a[i] - e * a[i + 1]) / t.petalShort;
						r *= 1 - smooth(clamp((1 - o * o - s * s) / t.shoulder));
					}
					let c = (fract(W * t.cells * t.borderColumns) - .5) / t.borderColumns;
					for (let e of t.borderRows) {
						let i = Math.abs(n) - e;
						r *= 1 - smooth(clamp((1 - (c * c + i * i) / s) / t.shoulder));
					}
					let l = 1 - r, u = i(W, G);
					J = (.48 + .18 * u) * (1 - l) + .03 * l, Y = (.55 + .016 * u) * (1 - l) + .08 * l, X += .34 * l + .04 * u * (1 - l), Z = .98 - .72 * l;
				};
			}
			case `sanddollar`: {
				let t = require_materials.proceduralMaterialPresets.sanddollar, i = cachedNoise(96, 96, r ^ 53691), a = new Float64Array(t.petals * 4);
				for (let e = 0; e < t.petals; e++) {
					let r = e * n / t.petals;
					a[e * 4] = Math.cos(r), a[e * 4 + 1] = Math.sin(r), a[e * 4 + 2] = Math.cos(r + Math.PI / t.petals), a[e * 4 + 3] = Math.sin(r + Math.PI / t.petals);
				}
				return () => {
					let e = fract(W * t.cells) - .5, n = fract(G * t.cells) - .5, r = e / t.radiusX, o = n / t.radiusY, s = clamp(1 - r * r - o * o), c = smooth(clamp(s / t.edge)), l = 1, u = 1;
					for (let r = 0; r < a.length; r += 4) {
						let i = (e * a[r] + n * a[r + 1] - t.petalDistance) / t.petalLong, o = (n * a[r] - e * a[r + 1]) / t.petalShort, s = (i * i + o * o - 1) / t.petalBand;
						l *= 1 - smooth(clamp(1 - s * s));
						let c = (e * a[r + 2] + n * a[r + 3] - t.lunuleDistance) / t.lunuleLong, d = (n * a[r + 2] - e * a[r + 3]) / t.lunuleShort;
						u *= 1 - smooth(clamp((1 - c * c - d * d) / t.lunuleShoulder));
					}
					let d = 1 - l, f = 1 - u, p = c * (1 - f), m = i(W, G);
					J = .05 + p * (.79 + .08 * s * s - .18 * d + .03 * m), Y = .04 + p * (.28 + .08 * s * s - .08 * d + .003 * m), X += .12 * (1 - c) + .1 * f + .05 * d, Z = .35 + p * (.62 - .16 * d);
				};
			}
			case `starsocketbolts`: {
				let t = require_materials.proceduralMaterialPresets.starsocketbolts, n = cachedNoise(96, 96, r ^ 49321), i = t.capRadius * t.capRadius, a = (t.socketRadius - t.lobeDepth) ** 2 - t.socketShoulder, o = (t.socketRadius + t.lobeDepth) ** 2;
				return () => {
					let e = W * t.cells, r = G * t.cells, s = fract(e) - .5, c = fract(r) - .5, l = s * s + c * c, u = smooth(clamp((i - l) / t.capShoulder)), d = 0;
					if (l <= a) d = 1;
					else if (l < o) {
						let n = c * c / l, i = 1 + n * (-18 + n * (48 - 32 * n)), a = Math.floor(e) + Math.floor(r) & 1 ? -1 : 1, o = t.socketRadius + t.lobeDepth * i * a;
						d = smooth(clamp((o * o - l) / t.socketShoulder));
					}
					let f = clamp(1 - l / i), p = n(W, G);
					J = .08 + u * (.65 + .05 * p - .48 * d), Y = .05 + u * (.64 + .1 * f - .46 * d) + .003 * p, X += .23 * (1 - u) + .1 * d + .02 * p, Z = .4 + .58 * u - .3 * d;
				};
			}
			case `dovetailjoint`: {
				let t = require_materials.proceduralMaterialPresets.dovetailjoint, n = cachedNoise(96, 4, r ^ 40307), i = cachedNoise(4, 96, r ^ 44677), a = new Float64Array(t.rows);
				for (let e = 0; e < t.rows; e++) a[e] = hash(0, e, r ^ 49047);
				return () => {
					let e = fract(W * t.columns) - .5, r = G * t.rows, o = fract(r), s = Math.floor(r), c = 1 - smooth(clamp((o - t.seamY + t.bevel) / t.bevel)), l = t.neckHalfWidth + t.flare * (o - t.seamY) / (t.tipY - t.seamY), u = smooth(clamp((t.tipY - o) / t.bevel)) * smooth(clamp((l - Math.abs(e)) / t.bevel)), d = 1 - (1 - c) * (1 - u), f = 4 * d * (1 - d), p = n(W, G), m = i(W, G), h = s & 1 ? m : p, g = s & 1 ? p : m, _ = h * d + g * (1 - d), v = a[s] * d + a[(s + 1) % t.rows] * (1 - d);
					J = (.28 + .38 * _ + .18 * v) * (1 - .78 * f), Y = .5 - .26 * f + .003 * _, X += .18 * f + .035 * _, Z = .98 - .42 * f;
				};
			}
			case `pawprinttiles`: {
				let t = require_materials.proceduralMaterialPresets.pawprinttiles, n = cachedNoise(96, 96, r ^ 35937), i = new Float64Array(t.toes.length * 4);
				for (let e = 0; e < t.toes.length; e++) {
					let [n, r, a] = t.toes[e];
					i[e * 4] = n, i[e * 4 + 1] = r, i[e * 4 + 2] = Math.cos(a), i[e * 4 + 3] = Math.sin(a);
				}
				let a = Float64Array.from(t.pads.flat());
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, o = smooth(clamp((.25 - e * e) / t.grout)) * smooth(clamp((.25 - r * r) / t.grout)), s = 1;
					for (let n = 0; n < i.length; n += 4) {
						let a = e - i[n], o = r - i[n + 1], c = (a * i[n + 2] + o * i[n + 3]) / t.toeWidth, l = (o * i[n + 2] - a * i[n + 3]) / t.toeHeight;
						s *= 1 - smooth(clamp((1 - c * c - l * l) / t.shoulder));
					}
					for (let n = 0; n < a.length; n += 3) {
						let i = (e - a[n]) / a[n + 2], o = (r - a[n + 1]) / a[n + 2];
						s *= 1 - smooth(clamp((1 - i * i - o * o) / t.shoulder));
					}
					let c = 1 - s, l = n(W, G);
					J = .92 - .76 * c + .025 * l, Y = o * (.5 - .24 * c + .003 * l), Q = 1 - o, X += .5 * Q + .12 * c, Z = .55 + .43 * o - .2 * c;
				};
			}
			case `pomegranateslice`: {
				let t = require_materials.proceduralMaterialPresets.pomegranateslice, i = cachedNoise(96, 96, r ^ 31577), a = n / t.chambers, o = new Float64Array(t.chambers * 2);
				for (let e = 0; e < t.chambers; e++) o[e * 2] = Math.cos(e * a), o[e * 2 + 1] = Math.sin(e * a);
				let s = Float64Array.from(t.arils.flat()), c = t.radius * t.radius, l = t.innerRadius * t.innerRadius;
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, u = e * e + r * r, d = smooth(clamp((c - u) / t.edge)), f = smooth(clamp((l - u) / t.edge)), p = Math.floor((Math.atan2(r, e) + n + a / 2) / a) % t.chambers, m = o[p * 2], h = o[p * 2 + 1], g = e * m + r * h - t.chamberDistance, _ = r * m - e * h, v = g / t.chamberLong, y = _ / t.chamberShort, b = smooth(clamp((1 - v * v - y * y) / t.chamberShoulder)), x = 1;
					for (let e = 0; e < s.length; e += 2) {
						let n = (g - s[e]) / t.arilLong, r = (_ - s[e + 1]) / t.arilShort;
						x *= 1 - smooth(clamp(1 - n * n - r * r));
					}
					let S = 1 - x, C = i(W, G);
					J = .06 + d * (.18 + .64 * f - .42 * b - .34 * S) + .02 * C, Y = .06 + d * (.36 + .12 * (1 - f) - .12 * b + .3 * S) + .003 * C, X -= .12 * d + .28 * S, Z = .4 + .48 * d - .16 * b + .23 * S;
				};
			}
			case `wingnuts`: {
				let t = require_materials.proceduralMaterialPresets.wingnuts, n = cachedNoise(96, 96, r ^ 28483), i = Math.cos(t.wingAngle), a = Math.sin(t.wingAngle), o = t.hubRadius * t.hubRadius, s = t.boreRadius * t.boreRadius;
				return () => {
					let e = W * t.cells, r = G * t.cells, c = fract(e) - .5, l = fract(r) - .5, u = Math.floor(e) + Math.floor(r) & 1, d = u ? l : c, f = u ? -c : l, p = d * d + f * f, m = smooth(clamp((o - p) / t.hubShoulder)), h = smooth(clamp((s - p) / t.boreShoulder)), g = 1;
					for (let e = -1; e <= 1; e += 2) {
						let n = e * d - t.wingOffset, r = f + t.wingLift, o = (n * i - r * a) / t.wingLength, s = (n * a + r * i) / t.wingWidth;
						g *= 1 - smooth(clamp((1 - o * o - s * s) / t.wingShoulder));
					}
					let _ = 1 - g, v = (1 - (1 - m) * (1 - _)) * (1 - h), y = n(W, G);
					J = .08 + .7 * v + .08 * _ + .025 * y, Y = .06 + .62 * v + .12 * _ + .004 * y, X += .24 * (1 - v) + .02 * y, Z = .35 + .62 * v;
				};
			}
			case `chainstitch`: {
				let t = require_materials.proceduralMaterialPresets.chainstitch, i = cachedNoise(96, 96, r ^ 23865);
				return () => {
					let e = fract(W * t.columns) - .5, r = fract(G * t.rows) - .5, a = 1;
					for (let n = -1; n <= 1; n++) {
						let i = r + n, o = e / (t.halfWidth * (1 + t.taper * i)), s = i / t.halfLength, c = (o * o + s * s - 1) / t.band;
						a *= 1 - smooth(clamp(1 - c * c));
					}
					let o = 1 - a, s = Math.sin(n * W * t.threads) * Math.sin(n * G * t.threads), c = i(W, G);
					J = .08 + .78 * o + .025 * c, Y = .1 + .6 * o + .008 * s + .004 * c, X -= .22 * o, Z = .65 + .35 * o;
				};
			}
			case `seedbeads`: {
				let t = require_materials.proceduralMaterialPresets.seedbeads, n = new Float64Array(t.columns * t.rows);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = hash(i, e, r ^ 19751);
				let i = t.holeRadius * t.holeRadius;
				return () => {
					let e = G * t.rows, r = Math.floor(e), a = W * t.columns - .5 * (r & 1), o = Math.floor(a), s = fract(a) - .5, c = fract(e) - .5, l = s / t.halfLength, u = c / t.halfHeight, d = l * l, f = u * u, p = smooth(clamp((1 - d * d - f * f) / t.shoulder)), m = clamp(1 - f), h = Math.abs(s) - t.holeOffset, g = smooth(clamp(1 - (h * h + c * c) / i));
					J = .06 + p * (.12 + .6 * n[(r % t.rows + t.rows) % t.rows * t.columns + (o % t.columns + t.columns) % t.columns] * (.6 + .4 * m) - .2 * g), Y = .1 + p * (.35 + .35 * m - .3 * g), X += .5 * (1 - p) - .1 * p * m, Z = .3 + p * (.6 + .1 * m - .4 * g);
				};
			}
			case `greekkey`: {
				let t = require_materials.proceduralMaterialPresets.greekkey, n = cachedNoise(96, 96, r ^ 15253), i = t.halfWidth * t.halfWidth, a = t.coreWidth * t.coreWidth, o = Float64Array.from(t.segments.flat());
				return () => {
					let e = fract(W * t.cells), r = fract(G * t.cells), s = 1, c = 1;
					for (let t = 0; t < o.length; t += 4) {
						let n = o[t], l = o[t + 1], u = o[t + 2] - n, d = o[t + 3] - l, f = clamp(((e - n) * u + (r - l) * d) / (u * u + d * d)), p = n + f * u - e, m = l + f * d - r, h = p * p + m * m;
						s *= 1 - smooth(clamp(1 - h / i)), c *= 1 - smooth(clamp(1 - h / a));
					}
					let l = 1 - s, u = 1 - c, d = n(W, G);
					J = .1 + .6 * l + .2 * u + .03 * d, Y = .12 + .5 * l + .16 * u + .006 * d, X += .12 * (1 - l) + .02 * d, Z = .55 + .45 * l;
				};
			}
			case `eggcarton`: {
				let t = require_materials.proceduralMaterialPresets.eggcarton, n = cachedNoise(96, 96, r ^ 11921), i = t.cupRadius * t.cupRadius, a = t.ribRadius * t.ribRadius, o = t.peakRadius * t.peakRadius;
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, s = smooth(clamp((i - e * e - r * r) / t.cupShoulder)), c = (e * e + r * r - a) / t.ribBand, l = smooth(clamp(1 - c * c)) * s, u = fract(W * t.cells + .5) - .5, d = fract(G * t.cells + .5) - .5, f = smooth(clamp(1 - (u * u + d * d) / o)) ** 2, p = n(W, G);
					J = .5 + .16 * f - .2 * s + .05 * l + .04 * p, Y = .55 - .42 * s + .08 * l + .38 * f + .006 * p, X += .04 * p + .04 * f, Z = .95 - .36 * s + .05 * f + .1 * l;
				};
			}
			case `okraslice`: {
				let t = require_materials.proceduralMaterialPresets.okraslice, i = cachedNoise(96, 96, r ^ 25575), a = 1 + 2 * t.chambers, o = new Float64Array(t.cells * t.cells * a);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let s = (e * t.cells + i) * a, c = n * hash(i, e, r ^ 13497);
					o[s] = c;
					for (let e = 0; e < t.chambers; e++) {
						let r = c + n * e / t.chambers;
						o[s + 1 + 2 * e] = Math.cos(r), o[s + 2 + 2 * e] = Math.sin(r);
					}
				}
				let s = 1 / (t.chamberLong * t.chamberLong), c = 1 / (t.chamberShort * t.chamberShort), l = 1 / (t.seedRadius * t.seedRadius);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * a, u = fract(e) - .5, d = fract(n) - .5, f = u * u + d * d, p = t.radius + t.lobeDepth * Math.cos(t.chambers * (Math.atan2(d, u) - o[r])), m = smooth(clamp((p * p - f) / t.edge)), h = smooth(clamp((f - (p - t.rind) ** 2) / t.edge)), g = 0, _ = 0;
					for (let e = 0; e < t.chambers; e++) {
						let n = o[r + 1 + 2 * e], i = o[r + 2 + 2 * e], a = u * n + d * i - t.chamberDistance, f = -u * i + d * n, p = a * a * s + f * f * c;
						g += smooth(clamp((1 - p) / t.chamberShoulder));
						for (let e = -1; e <= 1; e += 2) {
							let n = f - e * t.seedOffset;
							_ += smooth(clamp(1 - (a * a + n * n) * l));
						}
					}
					let v = i(W, G);
					J = .06 + m * (.53 - .28 * h - .38 * g + .68 * _ + .015 * v), Y = .04 + m * (.62 - .4 * g + .26 * _ + .005 * v), X += m * (.1 * h + .15 * g - .12 * _ + .02 * v), Z = .28 + m * (.7 - .4 * g + .32 * _);
				};
			}
			case `quatrefoiltile`: {
				let t = require_materials.proceduralMaterialPresets.quatrefoiltile, n = cachedNoise(48, 48, r ^ 29397), i = t.lobeRadius * t.lobeRadius, a = t.coreRadius * t.coreRadius, o = t.dotRadius * t.dotRadius;
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, s = 1 - smooth(clamp((a - e * e - r * r) / t.shoulder));
					for (let n = 0; n < 4; n++) {
						let a = e - (n === 0 ? t.lobeOffset : n === 1 ? -t.lobeOffset : 0), o = r - (n === 2 ? t.lobeOffset : n === 3 ? -t.lobeOffset : 0);
						s *= 1 - smooth(clamp((i - a * a - o * o) / t.shoulder));
					}
					let c = 1 - s, l = fract(W * t.cells + .5) - .5, u = fract(G * t.cells + .5) - .5, d = smooth(clamp((o - (l + u) ** 2) / t.dotShoulder)) * smooth(clamp((o - (l - u) ** 2) / t.dotShoulder)), f = c + d, p = n(W, G);
					J = .34 + (.48 + .025 * p) * c - (.23 - .015 * p) * d, Y = (.68 + .004 * p) * c + (.58 + .004 * p) * d, X += .48 * (1 - f) + .04 * d + .015 * p * f, Z = .42 + .58 * f, Q = 1 - f;
				};
			}
			case `smocking`: {
				let t = require_materials.proceduralMaterialPresets.smocking, i = cachedNoise(48, 48, r ^ 24177);
				return () => {
					let e = W * t.columns, r = G * t.rows, a = Math.floor(e), o = .25 + t.spread * Math.cos(Math.PI * r), s = 0;
					for (let n = -1; n <= 1; n++) for (let r = -1; r <= 1; r += 2) {
						let i = (e - a - n - r * o) / t.foldWidth, c = smooth(clamp(1 - i * i));
						s += (1 - s) * c;
					}
					let c = Math.floor(r + .5), l = fract(e + (c % 2 ? .5 : 0)) - .5, u = r - c, d = smooth(clamp(1 - (l / t.stitchWidth) ** 2 - (u / t.stitchHeight) ** 2)), f = (.5 + .5 * Math.cos(n * r)) ** 4, p = .5 + .25 * (Math.cos(n * t.threads * W) + Math.cos(n * t.threads * G)), m = i(W, G), h = s * (1 - .45 * f);
					J = .2 + .42 * h + .18 * d + .04 * m + .03 * p, Y = .1 + .5 * h + .09 * d + .006 * p, X += .07 * (1 - s) - .06 * d + .02 * m, Z = .48 + .43 * s - .1 * f * s + .1 * d;
				};
			}
			case `mapleleaf`: {
				let t = require_materials.proceduralMaterialPresets.mapleleaf, i = Math.sqrt(1 + t.tipRoundness * t.tipRoundness) - t.tipRoundness, a = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 3, s = n * hash(i, e, r ^ 28241);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s), a[o + 2] = hash(i, e, r ^ 15143);
				}
				let o = new Float64Array(t.lobes * 3);
				for (let e = 0; e < t.lobes; e++) {
					let r = -Math.PI / 2 + n * e / t.lobes, i = t.veinTip * Math.cos(r), a = t.veinTip * Math.sin(r) - t.veinRoot;
					o[e * 3] = i, o[e * 3 + 1] = a, o[e * 3 + 2] = 1 / (i * i + a * a);
				}
				let s = cachedNoise(96, 96, r ^ 24339);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 3, c = fract(e) - .5, l = fract(n) - .5, u = c * a[r] + l * a[r + 1], d = l * a[r] - c * a[r + 1], f = Math.atan2(d, u), p = u * u + d * d, m = Math.sin(t.lobes * (f + Math.PI / 2) / 2), h = 1 - (Math.sqrt(m * m + t.tipRoundness * t.tipRoundness) - t.tipRoundness) / i, g = t.innerRadius + t.lobeDepth * h + t.serration * h * Math.sin(15 * f) ** 2, _ = smooth(clamp((g * g - p) / t.edgeSquared)), v = smooth(clamp(1 - (u / t.stemWidth) ** 2 - ((d - t.stemCenter) / t.stemLength) ** 8)), y = _ + v - _ * v, b = 0;
					for (let e = 0; e < t.lobes; e++) {
						let n = e * 3, r = clamp((u * o[n] + (d - t.veinRoot) * o[n + 1]) * o[n + 2]), i = u - r * o[n], a = d - t.veinRoot - r * o[n + 1], s = smooth(clamp(1 - (i * i + a * a) / (t.veinWidth * t.veinWidth)));
						b += (1 - b) * s;
					}
					let x = clamp(1 - p / (t.innerRadius + t.lobeDepth) ** 2) ** 2, S = s(W, G);
					J = .07 + _ * (.55 + .1 * x + .08 * b + .05 * a[r + 2]) + .35 * v * (1 - _) + .04 * S * y, Y = .05 + _ * (.45 + .12 * x + .07 * b) + .25 * v * (1 - _), X += .16 * (1 - y) - .1 * _ - .03 * b * _ + .04 * S * y, Z = .38 + .58 * y + .04 * b * _;
				};
			}
			case `rollerchain`: {
				let t = require_materials.proceduralMaterialPresets.rollerchain, n = cachedNoise(16, 96, r ^ 28225);
				return () => {
					let e = Math.floor(G * t.rows), r = W * t.columns - e % 2 * .5, i = fract(G * t.rows) - .5, a = Math.floor(r), o = 0, s = 0;
					for (let e = -1; e <= 1; e++) {
						let n = a + e, c = r - n - .5, l = smooth(clamp((1 - ((c + .5) ** 2 + i * i) / (t.headRadius * t.headRadius)) / t.bevel)), u = smooth(clamp((1 - ((c - .5) ** 2 + i * i) / (t.headRadius * t.headRadius)) / t.bevel)), d = smooth(clamp((1 - (c / t.bridgeLength) ** 8 - (i / t.waistRadius) ** 2) / t.bevel)), f = 1 - (1 - l) * (1 - u) * (1 - d);
						o += (1 - o) * f, n % 2 == 0 && (s += (1 - s) * f);
					}
					let c = fract(r + .5) - .5, l = Math.hypot(c, i), u = smooth(clamp((t.pinRadius * t.pinRadius - l * l) / (t.pinRadius * t.pinRadius - t.pinCore * t.pinCore))), d = smooth(clamp(1 - l * l / (t.pinRadius * t.pinRadius))), f = smooth(clamp(1 - ((l - t.collarRadius) / t.collarWidth) ** 2)), p = n(W, G);
					J = .08 + .45 * o + .12 * s + .12 * u - .2 * f + .03 * p * o, Y = .05 + .4 * o + .16 * s + .12 * u + .03 * d - .04 * f + .004 * p * o, X += .12 * (1 - o) - .12 * s - .12 * u + .2 * f + .02 * p * o, Z = .3 + .65 * o - .2 * f + .05 * u;
				};
			}
			case `ravioli`: {
				let t = require_materials.proceduralMaterialPresets.ravioli, i = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let a = (e * t.cells + n) * 3;
					i[a] = .03 * (hash(n, e, r ^ 27953) - .5), i[a + 1] = .03 * (hash(n, e, r ^ 16215) - .5), i[a + 2] = hash(n, e, r ^ 31769);
				}
				let a = cachedNoise(96, 96, r ^ 23331);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 3, s = fract(e) - .5, c = fract(r) - .5, l = Math.cos(n * t.crimps * s), u = Math.cos(n * t.crimps * c), d = smooth(clamp((t.halfWidth + t.scallop * u - Math.abs(s)) / t.shoulder)) * smooth(clamp((t.halfWidth + t.scallop * l - Math.abs(c)) / t.shoulder)), f = smooth(clamp(1 - ((s - i[o]) / t.pillowRadius) ** 4 - ((c - i[o + 1]) / t.pillowRadius) ** 4)), p = smooth(clamp(1 - ((Math.abs(s) - t.crimpCenter) / t.crimpWidth) ** 2)) * smooth(clamp((t.crimpSpan - Math.abs(c)) / .04)) * (.5 + .5 * u) ** 4, m = smooth(clamp(1 - ((Math.abs(c) - t.crimpCenter) / t.crimpWidth) ** 2)) * smooth(clamp((t.crimpSpan - Math.abs(s)) / .04)) * (.5 + .5 * l) ** 4, h = p + m - p * m, g = a(W, G);
					J = .05 + d * (.55 + .15 * f + .06 * g + .04 * i[o + 2] - .1 * h), Y = .05 + d * (.3 + .48 * f + .01 * g - .1 * h), X += .18 * (1 - d) + d * (.03 * g - .08 * f + .05 * h), Z = .38 + d * (.58 - .17 * h);
				};
			}
			case `dendriticagate`: {
				let t = require_materials.proceduralMaterialPresets.dendriticagate, i = 2 ** t.levels - 1, a = i * 6, o = new Float64Array(t.cells * t.cells * a), s = new Float64Array(i);
				for (let e = 0; e < t.cells * t.cells; e++) {
					let c = n * hash(e, 0, r ^ 27667), l = 0;
					for (let n = 0; n < i; n++) {
						let i = Math.floor(Math.log2(n + 1)), u = e * a + n * 6, d = Math.floor((n - 1) / 2), f = e * a + d * 6, p = n === 0 ? c : s[d] + (n % 2 ? -1 : 1) * (.48 + .2 * hash(n, e, r ^ 20261));
						s[n] = p;
						let m = t.branchLength * t.lengthDecay ** i * (.94 + .12 * hash(n, e, r ^ 31545)), h = t.branchWidth * t.widthDecay ** i, g = n === 0 ? t.rootOffset * Math.sin(c) : o[f] + o[f + 2], _ = n === 0 ? -t.rootOffset * Math.cos(c) : o[f + 1] + o[f + 3], v = m * Math.sin(p), y = m * Math.cos(p);
						o[u] = g, o[u + 1] = _, o[u + 2] = v, o[u + 3] = y, o[u + 4] = 1 / (m * m), o[u + 5] = 1 / (h * h), l = Math.max(l, Math.hypot(g, _) + h, Math.hypot(g + v, _ + y) + h);
					}
					let u = Math.min(1, t.supportRadius / l);
					for (let t = 0; t < i; t++) {
						let n = e * a + t * 6;
						for (let e = 0; e < 4; e++) o[n + e] *= u;
						o[n + 4] /= u * u, o[n + 5] /= u * u;
					}
				}
				let c = cachedNoise(8, 8, r ^ 20083), l = cachedNoise(64, 64, r ^ 28449);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * a, s = fract(e) - .5, u = fract(n) - .5, d = 0;
					if (s * s + u * u < t.supportRadius * t.supportRadius) for (let e = 0; e < i; e++) {
						let t = r + e * 6, n = s - o[t], i = u - o[t + 1], a = clamp((n * o[t + 2] + i * o[t + 3]) * o[t + 4]), c = n - a * o[t + 2], l = i - a * o[t + 3], f = smooth(clamp(1 - (c * c + l * l) * o[t + 5]));
						d += (1 - d) * f;
					}
					let f = l(W, G);
					J = (.76 + .12 * c(W, G) + .03 * f) * (1 - d) + .06 * d, Y = .5 + .003 * f, X += .015 * f, Z = 1;
				};
			}
			case `eyeletcotton`: {
				let t = require_materials.proceduralMaterialPresets.eyeletcotton, i = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) i[e * t.cells + a] = n * hash(a, e, r ^ 27473);
				let a = cachedNoise(96, 96, r ^ 31843);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(r) * t.cells + Math.floor(e), s = fract(e) - .5, c = fract(r) - .5, l = Math.hypot(s, c), u = smooth(clamp((l - t.holeRadius) / t.holeShoulder)), d = smooth(clamp(1 - ((l - t.rimRadius) / t.rimWidth) ** 2)), f = d > 0 ? (.5 + .5 * Math.cos(t.stitches * Math.atan2(c, s) + i[o])) ** 3 : 0, p = .5 + .25 * (Math.cos(n * t.threads * W) + Math.cos(n * t.threads * G)), m = a(W, G);
					J = .04 * (1 - u) + u * (.78 + .03 * p + .02 * m) + d * (.12 + .03 * f), Y = .05 + u * (.3 + .02 * p + .004 * m) + d * (.18 + .1 * f), X += .12 * (1 - u) - d * (.12 + .04 * f), Z = .23 + .75 * u - .1 * d + .08 * d * f;
				};
			}
			case `trilobitefossil`: {
				let t = require_materials.proceduralMaterialPresets.trilobitefossil, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 23409), s = (e * t.cells + a) * 2;
					i[s] = Math.cos(o), i[s + 1] = Math.sin(o);
				}
				let a = cachedNoise(96, 96, r ^ 27779);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 2, s = fract(e) - .5, c = fract(r) - .5, l = s * i[o] + c * i[o + 1], u = c * i[o] - s * i[o + 1], d = clamp(1 - (l / t.headWidth) ** 2 - ((u - t.headCenter) / t.headLength) ** 2), f = smooth(clamp(d / t.shoulder)), p = smooth(clamp((1 - (l / t.bodyWidth) ** 2 - ((u - t.bodyCenter) / t.bodyLength) ** 2) / t.shoulder)), m = smooth(clamp((1 - (l / t.tailWidth) ** 2 - ((u - t.tailCenter) / t.tailLength) ** 2) / t.shoulder)), h = 1 - (1 - f) * (1 - p) * (1 - m), g = smooth(clamp(1 - (l / t.axisWidth) ** 2)) * smooth(clamp((u + .29) / .04)) * smooth(clamp((.32 - u) / .06)), _ = u - t.segmentCurve * l * l, v = t.segmentStart + (t.segments - 1) * t.segmentPitch, y = smooth(clamp((_ - t.segmentStart + t.segmentPitch / 2) / .008)) * smooth(clamp((v + t.segmentPitch / 2 - _) / .008)) * (1 - f) * (.5 + .5 * Math.cos(n * (_ - t.segmentStart) / t.segmentPitch)) ** 3, b = smooth(clamp(1 - ((l - t.eyeOffset) / t.eyeRadius) ** 2 - ((u - t.eyeCenter) / t.eyeRadius) ** 2)) + smooth(clamp(1 - ((l + t.eyeOffset) / t.eyeRadius) ** 2 - ((u - t.eyeCenter) / t.eyeRadius) ** 2)), x = a(W, G);
					J = (1 - h) * (.75 + .03 * x) + h * (.3 + .08 * y + .05 * g + .02 * x), Y = .2 + .006 * x + h * (.3 + .12 * g + .09 * y * (1 - .6 * g) + .05 * b + .06 * d * f), X += .02 * x - .13 * h + .04 * h * y, Z = .98 + h * (-.18 + .08 * g + .06 * y + .03 * b);
				};
			}
			case `countersunkmetal`: {
				let t = require_materials.proceduralMaterialPresets.countersunkmetal, n = cachedNoise(8, 128, r ^ 20065), i = t.boreRadius + t.boreShoulder;
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, a = Math.hypot(e, r), o = smooth(clamp((a - t.boreRadius) / t.boreShoulder)), s = clamp((a - i) / (t.coneRadius - i)), c = t.coneShoulder, l = (s < c ? s * s / (2 * c) : s > 1 - c ? 1 - c - (1 - s) * (1 - s) / (2 * c) : s - c / 2) / (1 - c), u = n(W, G);
					J = .08 + .35 * o + .32 * l + .04 * u * o, Y = .05 + .28 * o + .45 * l + .0015 * u * o, X += .25 * (1 - o) + .06 * (1 - l) * o + .015 * u * o, Z = .3 + .35 * o + .34 * l;
				};
			}
			case `logcabinparquet`: {
				let t = require_materials.proceduralMaterialPresets.logcabinparquet, n = new Uint8Array(t.units * t.units), i = new Float64Array(t.blocks * t.blocks * t.boards.length);
				for (let e = 0; e < t.boards.length; e++) {
					let [a, o, s, c] = t.boards[e];
					for (let r = o; r < o + c; r++) for (let i = a; i < a + s; i++) n[r * t.units + i] = e;
					for (let n = 0; n < t.blocks * t.blocks; n++) i[n * t.boards.length + e] = hash(e, n, r ^ 23649);
				}
				let a = cachedNoise(8, 96, r ^ 28019);
				return () => {
					let e = W * t.blocks, r = G * t.blocks, o = Math.floor(r) * t.blocks + Math.floor(e), s = fract(e) * t.units, c = fract(r) * t.units, l = n[Math.floor(c) * t.units + Math.floor(s)], u = t.boards[l], d = s - u[0], f = c - u[1], p = smooth(clamp((Math.min(d, u[2] - d) - t.gap) / t.bevel)) * smooth(clamp((Math.min(f, u[3] - f) - t.gap) / t.bevel)), m = u[2] >= u[3], h = m ? d : f, g = m ? f : d, _ = i[o * t.boards.length + l], v = a(h / t.units + _, g / t.units + .3 * _);
					J = .06 + p * (.32 + .25 * _ + .25 * v), Y = .1 + p * (.65 + .004 * v), X += .3 * (1 - p) + .03 * p * v, Z = .55 + .43 * p;
				};
			}
			case `staranise`: {
				let t = require_materials.proceduralMaterialPresets.staranise, i = new Float64Array(t.cells * t.cells * t.pods * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 14945);
					for (let r = 0; r < t.pods; r++) {
						let s = o + r * n / t.pods, c = ((e * t.cells + a) * t.pods + r) * 2;
						i[c] = Math.cos(s), i[c + 1] = Math.sin(s);
					}
				}
				let a = cachedNoise(96, 96, r ^ 19315);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * t.pods * 2, o = fract(e) - .5, s = fract(n) - .5, c = smooth(clamp(1 - (o * o + s * s) / t.hubRadius ** 2)), l = a(W, G);
					J = .04 + .3 * c, Y = .04 + .16 * c, Z = .3 + .2 * c, X += .02 * l;
					for (let e = 0; e < t.pods; e++) {
						let n = r + e * 2, a = o * i[n] + s * i[n + 1], c = s * i[n] - o * i[n + 1], u = clamp(1 - ((a - t.podCenter) / t.podLength) ** 2), d = smooth(clamp((u * u - (c / t.podWidth) ** 2) / t.shoulder)), f = smooth(clamp((1 - ((a - t.podCenter) / t.cavityLength) ** 2 - (c / t.cavityWidth) ** 2) / .2)), p = smooth(clamp((1 - ((a - t.seedCenter) / t.seedLength) ** 2 - (c / t.seedWidth) ** 2) / .2));
						J += d * (.58 + .03 * l - .4 * f + .16 * p), Y += d * (.5 + .1 * u - .36 * f + .14 * p + .008 * l), X -= .25 * d * p, Z += d * (.65 - .35 * f + .1 * p);
					}
				};
			}
			case `crossstitch`: {
				let t = require_materials.proceduralMaterialPresets.crossstitch, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 2;
					i[o] = hash(a, e, r ^ 27713), i[o + 1] = n * hash(a, e, r ^ 32083);
				}
				let a = cachedNoise(96, 96, r ^ 11877);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 2, s = fract(e) - .5, c = fract(r) - .5, l = (s + c) * Math.SQRT1_2, u = (c - s) * Math.SQRT1_2, d = smooth(clamp(1 - (u / t.halfWidth) ** 2)) * smooth(clamp((t.halfLength - Math.abs(l)) / t.endShoulder)), f = smooth(clamp(1 - (l / t.halfWidth) ** 2)) * smooth(clamp((t.halfLength - Math.abs(u)) / t.endShoulder)) * (1 - d), p = d + f, m = .5 + .5 * Math.cos(n * t.fibers * u / t.halfWidth + i[o + 1]), h = .5 + .5 * Math.cos(n * t.fibers * l / t.halfWidth + i[o + 1]), g = d * m + f * h, _ = .5 + .25 * (Math.cos(n * t.threads * W) + Math.cos(n * t.threads * G)), v = a(W, G);
					J = (1 - p) * (.9 + .03 * _) + p * (.2 + .12 * i[o]) + .04 * g, Y = .06 + .55 * d + .4 * f + .012 * g + .02 * _ * (1 - p) + .005 * v, X += .02 * v - .12 * p, Z = .98 - .18 * p + .16 * d;
				};
			}
			case `monsteraleaf`: {
				let t = require_materials.proceduralMaterialPresets.monsteraleaf, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 19057), s = (e * t.cells + a) * 2;
					i[s] = Math.cos(o), i[s + 1] = Math.sin(o);
				}
				let a = 1 / Math.hypot(1, t.slope), o = cachedNoise(96, 96, r ^ 23427);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 2, s = fract(e) - .5, c = fract(n) - .5, l = s * i[r] + c * i[r + 1], u = c * i[r] - s * i[r + 1], d = Math.abs(l), f = smooth(clamp((1 - (l / t.width) ** 2 - (u / t.length) ** 2) / t.shoulder)), p = smooth(clamp((1 - (l / t.notchWidth) ** 2 - ((u - t.notchY) / t.notchLength) ** 2) / t.shoulder));
					f *= 1 - p;
					let m = 0;
					for (let e of t.levels) {
						let n = d - t.holeX, r = u - e - t.slope * t.holeX, i = (n + t.slope * r) * a, o = (r - t.slope * n) * a, s = smooth(clamp((1 - (i / t.holeLength) ** 2 - (o / t.holeWidth) ** 2) / t.shoulder)), c = u - e - t.slope * d, l = smooth(clamp(1 - (c / t.slitWidth) ** 2)) * smooth(clamp((d - t.slitStart) / t.slitShoulder));
						f *= (1 - s) * (1 - l);
						let p = c - .08;
						m += smooth(clamp(1 - (p / t.veinWidth) ** 2)) * smooth(clamp(d / .025));
					}
					let h = smooth(clamp(1 - (l / t.midribWidth) ** 2)) * smooth(clamp((.34 - Math.abs(u)) / .05)), g = o(W, G);
					J = .04 + f * (.55 + .08 * g + .1 * h + .04 * m), Y = .04 + f * (.58 + .02 * g + .05 * h + .025 * m), X += .2 * (1 - f) + .02 * g * f, Z = .3 + .68 * f;
				};
			}
			case `cucumberslices`: {
				let t = require_materials.proceduralMaterialPresets.cucumberslices, i = new Float64Array(t.cells * t.cells * t.chambers * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 11857);
					for (let r = 0; r < t.chambers; r++) {
						let s = ((e * t.cells + a) * t.chambers + r) * 2, c = o + n * r / t.chambers;
						i[s] = Math.cos(c), i[s + 1] = Math.sin(c);
					}
				}
				let a = cachedNoise(96, 96, r ^ 16227);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * t.chambers * 2, o = fract(e) - .5, s = fract(n) - .5, c = Math.hypot(o, s), l = smooth(clamp((t.radius - c) / t.edge)), u = smooth(clamp((c - t.rindStart) / t.rindWidth)), d = 0, f = 0;
					for (let e = 0; e < t.chambers; e++) {
						let n = r + e * 2, a = o * i[n] + s * i[n + 1], c = s * i[n] - o * i[n + 1], l = smooth(clamp((1 - ((a - t.chamberCenter) / t.chamberLength) ** 2 - (c / t.chamberWidth) ** 2) / t.shoulder));
						if (d += l, l > 0) for (let e of t.seedPositions) f += smooth(clamp((1 - ((a - e) / t.seedLength) ** 2 - (c / t.seedWidth) ** 2) / t.shoulder));
					}
					let p = a(W, G);
					J = .05 + l * (.68 + .015 * p - .58 * u - .28 * d + .48 * f), Y = .05 + l * (.55 + .004 * p), X += .02 * p + l * (.18 * u - .08 * d + .04 * f), Z = .3 + .69 * l;
				};
			}
			case `polkadotfabric`: {
				let t = require_materials.proceduralMaterialPresets.polkadotfabric, i = hash(0, 0, r ^ 23879), a = hash(1, 0, r ^ 23879), o = cachedNoise(96, 96, r ^ 28249);
				return () => {
					let e = fract(W + i) * t.cells, r = fract(G + a) * t.cells, s = fract(e - .5 * (Math.floor(r) & 1)) - .5, c = fract(r) - .5, l = smooth(clamp((1 - (s * s + c * c) / (t.radius * t.radius)) / t.shoulder)), u = .5 + .5 * Math.cos(n * t.threads * W), d = .5 + .5 * Math.cos(n * t.threads * G), f = .5 + .5 * Math.cos(Math.PI * t.threads * W) * Math.cos(Math.PI * t.threads * G), p = u * (.35 + .25 * f) + d * (.35 + .25 * (1 - f)) - .3 * u * d, m = o(W, G);
					J = .12 + .78 * l + .03 * p + .02 * m, Y = .2 + .15 * p + .02 * m, X += .025 * (1 - p) + .02 * m - .04 * l, Z = .88 + .1 * p;
				};
			}
			case `pistachios`: {
				let t = require_materials.proceduralMaterialPresets.pistachios, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 15431), s = (e * t.cells + a) * 2;
					i[s] = Math.cos(o), i[s + 1] = Math.sin(o);
				}
				let a = cachedNoise(96, 96, r ^ 19801);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 2, s = fract(e) - .5, c = fract(r) - .5, l = s * i[o] + c * i[o + 1], u = c * i[o] - s * i[o + 1], d = clamp(1 - (l / t.shellWidth) ** 2 - (u / t.shellLength) ** 2), f = smooth(clamp(d / t.shoulder)), p = smooth(clamp((1 - (l / t.openingWidth) ** 2 - (u / t.openingLength) ** 2) / t.shoulder)), m = smooth(clamp((1 - (l / t.kernelWidth) ** 2 - (u / t.kernelLength) ** 2) / t.shoulder)), h = a(W, G), g = .5 + .5 * Math.cos(n * (t.fibers * l + .5 * u * u));
					J = .08 + f * (.82 + .03 * h - .72 * p + .14 * m), Y = .05 + f * (.35 + .3 * d - .3 * p + .13 * m + .008 * h + .006 * g * (1 - p)), X += .03 * h + f * (.12 * p - .18 * m), Z = .3 + f * (.67 - .4 * p + .15 * m);
				};
			}
			case `sawblades`: {
				let t = require_materials.proceduralMaterialPresets.sawblades, i = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) i[e * t.cells + a] = n * hash(a, e, r ^ 27203);
				let a = cachedNoise(96, 96, r ^ 31573);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = fract(e) - .5, s = fract(r) - .5, c = Math.hypot(o, s), l = i[Math.floor(r) * t.cells + Math.floor(e)], u = 0;
					if (c > t.boreRadius && c < t.rootRadius + t.toothDepth) {
						let e = fract((Math.atan2(s, o) - l) * t.teeth / n), r = e < t.toothRise ? smooth(e / t.toothRise) : 1 - smooth((e - t.toothRise) / (1 - t.toothRise));
						u = smooth(clamp((t.rootRadius + t.toothDepth * r - c) / t.edgeBevel)) * smooth(clamp((c - t.boreRadius) / t.boreBevel));
					}
					let d = a(W, G), f = .5 + .5 * Math.cos(n * t.machining * c);
					J = (1 - u) * (.12 + .05 * d) + u * (.7 + .05 * d + .04 * f), Y = .06 + .003 * d + u * (.45 + .003 * d + .001 * f), X += .02 * d + .22 * (1 - u) + .04 * f * u, Z = .45 + .53 * u;
				};
			}
			case `snowflaketiles`: {
				let t = require_materials.proceduralMaterialPresets.snowflaketiles, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 20055), s = (e * t.cells + a) * 2;
					i[s] = Math.cos(o), i[s + 1] = Math.sin(o);
				}
				let a = new Float64Array(t.arms * (1 + t.branchPositions.length * 2) * 5), o = 0, add = (e, t, n, r) => {
					a[o++] = e, a[o++] = t, a[o++] = n, a[o++] = r, a[o++] = 1 / (n * n + r * r);
				};
				for (let e = 0; e < t.arms; e++) {
					let r = n * e / t.arms, i = Math.cos(r), a = Math.sin(r);
					add(0, 0, t.radius * i, t.radius * a);
					for (let e of t.branchPositions) for (let n of [-1, 1]) {
						let r = t.branchLength * .5, o = n * t.branchLength * Math.sqrt(3) * .5;
						add(e * i, e * a, r * i - o * a, r * a + o * i);
					}
				}
				let s = 1 / (t.lineWidth * t.lineWidth), c = cachedNoise(96, 96, r ^ 24425);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, o = fract(n) - .5, l = (Math.floor(n) * t.cells + Math.floor(e)) * 2, u = r * i[l] + o * i[l + 1], d = o * i[l] - r * i[l + 1], f = 1;
					for (let e = 0; e < a.length; e += 5) {
						let t = u - a[e], n = d - a[e + 1], r = a[e + 2], i = a[e + 3], o = clamp((t * r + n * i) * a[e + 4]), c = t - o * r, l = n - o * i;
						f *= 1 - smooth(clamp(1 - (c * c + l * l) * s));
					}
					let p = 1 - f, m = smooth(clamp((.5 - Math.abs(r) - t.grout) / t.bevel)) * smooth(clamp((.5 - Math.abs(o) - t.grout) / t.bevel)), h = c(W, G);
					Q = 1 - m, J = .1 + .84 * p + .02 * h, Y = .15 + m * (.6 + .006 * h), X += .02 * h + .5 * Q + .04 * p * m, Z = .7 + .29 * m;
				};
			}
			case `circularpavers`: {
				let t = require_materials.proceduralMaterialPresets.circularpavers, i = 1 + t.sectors * t.courses * (t.courses + 1) / 2, a = i + 1, o = new Float64Array(t.cells * t.cells * a);
				for (let e = 0; e < t.cells; e++) for (let s = 0; s < t.cells; s++) {
					let c = (e * t.cells + s) * a;
					o[c] = n * hash(s, e, r ^ 15697);
					for (let t = 0; t < i; t++) o[c + 1 + t] = hash(s * i + t, e, r ^ 20067);
				}
				let s = cachedNoise(96, 96, r ^ 24437), c = (t.courses + 1) * t.courseWidth;
				return () => {
					let e = W * t.cells, r = G * t.cells, i = (Math.floor(r) * t.cells + Math.floor(e)) * a, l = fract(e) - .5, u = fract(r) - .5, d = Math.hypot(l, u), f = 0, p = 0;
					if (d < t.courseWidth) f = smooth(clamp((t.courseWidth - d - t.grout) / t.bevel));
					else if (d < c) {
						let e = Math.min(t.courses, Math.floor(d / t.courseWidth)), r = t.sectors * e, a = o[i] + e % 2 * Math.PI / r, s = fract((Math.atan2(u, l) - a) / n) * r, c = Math.floor(s) % r, m = fract(s), h = Math.min(d - e * t.courseWidth, (e + 1) * t.courseWidth - d), g = d * Math.sin(Math.min(m, 1 - m) * n / r);
						f = smooth(clamp((h - t.grout) / t.bevel)) * smooth(clamp((g - t.grout) / t.bevel)), p = 1 + t.sectors * (e - 1) * e / 2 + c;
					}
					let m = s(W, G);
					Q = 1 - f, J = f * (.35 + .3 * o[i + 1 + p] + .06 * m) + .5 * Q, Y = .08 + f * (.68 + .015 * m), X += .04 * m * f + .13 * Q, Z = .55 + .42 * f;
				};
			}
			case `acornbarnacles`: {
				let t = require_materials.proceduralMaterialPresets.acornbarnacles, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 23367), s = (e * t.cells + a) * 2;
					i[s] = Math.cos(o), i[s + 1] = Math.sin(o);
				}
				let a = cachedNoise(96, 96, r ^ 27737), o = t.apertureRound * t.apertureRound;
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 2, s = fract(e) - .5, c = fract(n) - .5, l = s * i[r] + c * i[r + 1], u = c * i[r] - s * i[r + 1], d = Math.hypot(l, u), f = smooth(clamp((t.radius - d) / t.edge)), p = 1 - smooth(clamp((d - t.crownStart) / t.crownWidth)), h = 1 - smooth(clamp((Math.sqrt(l * l + o) + Math.sqrt(u * u + o) - t.apertureInner) / t.apertureShoulder)), g = 0, _ = 0;
					if (d > t.ribStart && f > 0) {
						let e = Math.atan2(u, l), n = smooth(clamp((d - t.ribStart) / t.ribShoulder));
						g = n * smooth(clamp((Math.cos(6 * e) - .88) / .12)), _ = n * (.5 + .5 * Math.cos(t.striae * e));
					}
					let v = a(W, G);
					J = .08 + f * (.55 + .2 * p - .75 * h - .12 * g + .03 * _ + .03 * v), Y = .05 + f * (.25 + .5 * p - .75 * h - .065 * g + .018 * _ + .008 * v), X += .03 * v + f * (.08 * g + .12 * h - .08 * p), Z = .3 + f * (.68 - .6 * h - .12 * g);
				};
			}
			case `dalmatianstone`: {
				let t = require_materials.proceduralMaterialPresets.dalmatianstone, i = new Float64Array(t.cells * t.cells * 8), a = cachedNoise(128, 128, r ^ 123921), o = cachedNoise(12, 12, r ^ 123923), s = 1 / t.shoulder;
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					if (hash(a, e, r ^ 123925) >= t.spotChance) continue;
					let o = (e * t.cells + a) * 8, s = n * hash(a, e, r ^ 123927), c = t.widthMin + t.widthRange * hash(a, e, r ^ 123929), l = t.lengthMin + t.lengthRange * hash(a, e, r ^ 123931);
					i[o] = t.centerMin + t.centerRange * hash(a, e, r ^ 123933), i[o + 1] = t.centerMin + t.centerRange * hash(a, e, r ^ 123935), i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s), i[o + 4] = 1 / (c * c), i[o + 5] = 1 / (l * l), i[o + 6] = t.bend * (hash(a, e, r ^ 123937) - .5), i[o + 7] = hash(a, e, r ^ 123939);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), c = Math.floor(n), l = a(W, G);
					J = t.matrixBase + t.matrixCloud * o(W, G) + t.matrixGrain * l, Y = t.height + t.grainHeight * l, X = t.roughness + t.grainRoughness * l, Z = 1;
					let u = 1;
					for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
						let d = r + o, f = c + a, p = ((f + t.cells) % t.cells * t.cells + (d + t.cells) % t.cells) * 8;
						if (i[p + 4] === 0) continue;
						let m = e - d - i[p], h = n - f - i[p + 1], g = h * i[p + 2] - m * i[p + 3], _ = m * i[p + 2] + h * i[p + 3] + i[p + 6] * g * g, v = (_ * _ * i[p + 4] + g * g * i[p + 5]) * (1 + t.edgeWarp * (l - .5));
						if (v >= 1) continue;
						let y = smooth(clamp((1 - v) * s));
						J += y * (t.spotBase + t.spotTone * i[p + 7] + t.spotGrain * l - J), u *= 1 - y;
					}
					X += t.spotRoughness * (1 - u);
				};
			}
			case `thomsonite`:
			case `orbicularjasper`: {
				let i = t === `thomsonite` ? require_materials.proceduralMaterialPresets.thomsonite : require_materials.proceduralMaterialPresets.orbicularjasper, a = new Float64Array(i.cells * i.cells * 4);
				for (let e = 0; e < i.cells; e++) for (let t = 0; t < i.cells; t++) {
					let n = (e * i.cells + t) * 4, o = i.radiusMin + i.radiusVariation * hash(t, e, r ^ 20331);
					a[n] = i.centerMin + i.centerVariation * hash(t, e, r ^ 11591), a[n + 1] = i.centerMin + i.centerVariation * hash(t, e, r ^ 15961), a[n + 2] = 1 / (o * o), a[n + 3] = hash(t, e, r ^ 23165) < .5 ? 3 : 4;
				}
				let o = cachedNoise(96, 96, r ^ 27535), s = cachedNoise(8, 8, r ^ 31905);
				return () => {
					let e = W * i.cells, t = G * i.cells, r = (Math.floor(t) * i.cells + Math.floor(e)) * 4, c = fract(e) - a[r], l = fract(t) - a[r + 1], u = (c * c + l * l) * a[r + 2], d = smooth(clamp((1 - u) / i.shoulder)), f = d > 0 ? .5 - .5 * Math.cos(n * a[r + 3] * u) : 0, p = o(W, G);
					J = (1 - d) * (.2 + .1 * s(W, G)) + d * (.12 + .75 * f + .04 * p), Y = .4 + .004 * p, X += .06 * d * f + .015 * p, Z = 1;
				};
			}
			case `hexnuts`: {
				let t = require_materials.proceduralMaterialPresets.hexnuts, i = new Float64Array(t.cells * t.cells * 12);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 19569);
					for (let r = 0; r < 6; r++) {
						let s = (e * t.cells + a) * 12 + r * 2, c = o + n * r / 6;
						i[s] = Math.cos(c), i[s + 1] = Math.sin(c);
					}
				}
				let a = cachedNoise(96, 96, r ^ 23939);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 12, s = fract(e) - .5, c = fract(r) - .5, l = 1;
					for (let e = 0; e < 6; e++) {
						let n = o + e * 2;
						l *= smooth(clamp((t.inradius - s * i[n] - c * i[n + 1]) / t.outerBevel));
					}
					let u = Math.hypot(s, c), d = l * smooth(clamp((u - t.boreRadius) / t.boreBevel)), f = a(W, G), p = .5 + .5 * Math.cos(n * t.machining * u);
					J = (1 - d) * (.15 + .05 * f) + d * (.68 + .06 * f + .04 * p), Y = .05 + .003 * f + d * (.7 + .004 * f + .001 * p), X += .015 * f + .18 * (1 - d) + .025 * p * d, Z = .45 + .53 * d;
				};
			}
			case `cardboardedge`: {
				let t = require_materials.proceduralMaterialPresets.cardboardedge, i = new Float64Array(t.rows);
				for (let e = 0; e < t.rows; e++) i[e] = n * hash(0, e, r ^ 14935);
				let a = cachedNoise(128, 128, r ^ 19305), o = cachedNoise(192, 24, r ^ 23675), s = t.amplitude * n * t.columns / t.rows;
				return () => {
					let e = G * t.rows, r = fract(e) - .5, c = n * t.columns * W + i[Math.floor(e)], l = t.amplitude * Math.cos(c), u = s * Math.sin(c), f = smooth(clamp(1 - ((r - l) / Math.sqrt(1 + u * u) / t.mediumHalfWidth) ** 2)), p = smooth(clamp(1 - ((Math.abs(r) - t.linerCenter) / t.linerHalfWidth) ** 2)), m = 1 - (1 - f) * (1 - p), h = a(W, G), g = o(W, G);
					J = .06 + m * (.6 + .08 * h + .04 * g), Y = .04 + m * (.68 + .015 * h + .008 * g), X += .08 * (1 - m) + .03 * h, Z = .25 + .73 * m;
				};
			}
			case `lotusroot`: {
				let t = require_materials.proceduralMaterialPresets.lotusroot, i = cachedNoise(96, 96, r ^ 24451), a = new Float64Array(t.cells * t.cells * t.canals * 4);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = n * hash(i, e, r ^ 11353);
					for (let s = 0; s < t.canals; s++) {
						let c = i * t.canals + s, l = ((e * t.cells + i) * t.canals + s) * 4, u = o + n * s / t.canals, d = t.canalLong + t.canalLongVariation * hash(c, e, r ^ 15713), f = t.canalShort + t.canalShortVariation * hash(c, e, r ^ 20083);
						a[l] = Math.cos(u), a[l + 1] = Math.sin(u), a[l + 2] = 1 / (d * d), a[l + 3] = 1 / (f * f);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * t.canals * 4, o = fract(e) - .5, s = fract(n) - .5, c = Math.hypot(o, s), l = smooth(clamp((t.radius - c) / t.edge)), u = smooth(clamp((c - t.rindStart) / t.rindWidth)), d = smooth(clamp((1 - (o * o + s * s) / (t.centralRadius * t.centralRadius)) / t.wallShoulder));
					for (let e = 0; e < t.canals; e++) {
						let n = r + e * 4, i = o * a[n] + s * a[n + 1] - t.canalDistance, c = -o * a[n + 1] + s * a[n], l = i * i * a[n + 2] + c * c * a[n + 3];
						d += smooth(clamp((1 - l) / t.wallShoulder));
					}
					let f = i(W, G);
					J = .05 + l * (.8 + .04 * f - .4 * u - .72 * d), Y = .05 + l * (.6 + .008 * f - .52 * d), X += .04 * f + l * (.12 * u + .2 * d), Z = .25 + l * (.73 - .65 * d);
				};
			}
			case `satinweave`: {
				let t = require_materials.proceduralMaterialPresets.satinweave, i = n * hash(0, 0, r ^ 23857), a = cachedNoise(128, 128, r ^ 28227);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(e), s = Math.floor(r), c = fract(e) - .5, l = fract(r) - .5, u = smooth(clamp(1 - c * c / (t.halfWidth * t.halfWidth))), d = smooth(clamp(1 - l * l / (t.halfWidth * t.halfWidth))), f = (o + t.step * s) % t.harness === 0 ? smooth(clamp((t.exposureHalf - Math.abs(c)) / t.exposureShoulder)) * smooth(clamp((t.exposureHalf - Math.abs(l)) / t.exposureShoulder)) : 0, p = .5 + .5 * Math.cos(n * 4 * c + i), m = .5 + .5 * Math.cos(n * 4 * l + i), h = p * (1 - f) + m * f, g = u * (1 - f) + d * f, _ = 1 - (1 - u) * (1 - d), v = .45 * u + .15 * d * (1 - u), y = .45 * d + .15 * u * (1 - d), b = a(W, G);
					J = .4 + .2 * g + .08 * h * _ + .08 * b, Y = .08 + v * (1 - f) + y * f + .006 * h * _ + .005 * b, X += .08 * (1 - g) + .015 * b, Z = .75 + .22 * _;
				};
			}
			case `flemishbond`: {
				let t = require_materials.proceduralMaterialPresets.flemishbond, n = t.modules * 3, i = new Float64Array(t.rows * t.modules * 2);
				for (let e = 0; e < t.rows; e++) for (let n = 0; n < t.modules * 2; n++) i[e * t.modules * 2 + n] = hash(n, e, r ^ 19809);
				let a = cachedNoise(96, 96, r ^ 24179), o = cachedNoise(48, 48, r ^ 28549);
				return () => {
					let e = Math.floor(G * t.rows), r = fract(W - e % 2 * 1.5 / n) * n, s = Math.floor(r / 3) % t.modules, c = r % 3, l = c < 1, u = l ? 1 : 2, d = l ? c : c - 1, f = Math.min(d, u - d) * t.rows / n, p = .5 - Math.abs(fract(G * t.rows) - .5), m = smooth(clamp((f - t.grout) / t.bevel)) * smooth(clamp((p - t.grout) / t.bevel)), h = i[e * t.modules * 2 + s * 2 + +!l], g = a(W, G), _ = o(W, G);
					Q = 1 - m, J = m * ((l ? t.headerTone : t.stretcherTone) + .1 * h + .07 * g + .04 * _) + .5 * Q, Y = .08 + m * (.7 + .025 * g + .015 * _), X += .04 * g * m + .12 * Q, Z = .6 + .36 * m;
				};
			}
			case `splitlockwashers`: {
				let t = require_materials.proceduralMaterialPresets.splitlockwashers, i = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) i[e * t.cells + a] = n * hash(a, e, r ^ 11081);
				let a = cachedNoise(96, 96, r ^ 15451);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(r) * t.cells + Math.floor(e), s = fract(e) - .5, c = fract(r) - .5, l = Math.sqrt(s * s + c * c), u = n * fract((Math.atan2(c, s) - i[o]) / n), d = smooth(clamp((l - t.inner) / t.bevel)) * smooth(clamp((t.outer - l) / t.bevel)) * smooth(clamp((u - t.gap) / t.angularBevel)) * smooth(clamp((n - t.gap - u) / t.angularBevel)), f = clamp((u - t.gap) / (n - 2 * t.gap)), p = a(W, G);
					J = (1 - d) * (.2 + .06 * p) + d * (.65 + .08 * p + .08 * f), Y = .06 + .003 * p + d * (.3 + .3 * f + .004 * p), X += .02 * p + .25 * (1 - d), Z = .65 + .33 * d;
				};
			}
			case `artichoke`: {
				let t = require_materials.proceduralMaterialPresets.artichoke, n = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) n[e * t.cells + i] = hash(i, e, r ^ 27687);
				let i = cachedNoise(96, 96, r ^ 32057);
				return () => {
					let e = W * t.cells, r = G * t.cells, a = Math.floor(r), o = i(W, G);
					J = .08 + .03 * o, Y = .1, Z = .5;
					for (let i = 1; i >= -1; i--) {
						let s = a + i, c = (s + t.cells) % t.cells, l = c % 2 * .5, u = Math.floor(e - l);
						for (let i = -1; i <= 1; i++) {
							let a = u + i, d = (a + t.cells) % t.cells, f = e - a - l - .5, p = r - s - .5, m = clamp((p - t.root) / (t.tip - t.root)), h = t.halfWidth * (1 - m * m), g = smooth(clamp((h * h - f * f) / t.edge)) * smooth(clamp((p - t.root) / .12)) * smooth(clamp((t.tip - p) / .1));
							if (g === 0) continue;
							let _ = smooth(clamp((p + .15) / .9)), v = smooth(clamp(1 - f * f / (t.midrib * t.midrib))), y = smooth(clamp((Math.abs(f) - .04) / .05)), b = v;
							for (let e = 0; e < 3; e++) {
								let n = (p - (-.3 + .25 * e + .55 * Math.sqrt(f * f + 1e-4))) / t.veinWidth;
								b += y * smooth(clamp(1 - n * n));
							}
							let x = .32 + .17 * n[c * t.cells + d] + .18 * (1 - _) + .05 * b + .025 * o, S = .28 + .28 * _ + .05 * v + .025 * b + .012 * o;
							J += g * (x - J), Y += g * (S - Y), Z += g * (.96 - .22 * (1 - g) - Z);
						}
					}
					X += .05 * o + .08 * (1 - Z);
				};
			}
			case `frenchknots`: {
				let t = require_materials.proceduralMaterialPresets.frenchknots, i = new Float64Array(t.cells * t.cells * 5);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5, s = n * hash(a, e, r ^ 14949);
					i[o] = .45 + .1 * hash(a, e, r ^ 7233), i[o + 1] = .45 + .1 * hash(a, e, r ^ 11603), i[o + 2] = Math.cos(s), i[o + 3] = Math.sin(s), i[o + 4] = n * hash(a, e, r ^ 19319);
				}
				let a = cachedNoise(96, 96, r ^ 23689);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 5, s = fract(e) - i[o], c = fract(r) - i[o + 1], l = s * i[o + 2] + c * i[o + 3], u = (c * i[o + 2] - s * i[o + 3]) * t.aspect, d = l * l + u * u, f = Math.sqrt(d), p = smooth(clamp(1 - d / (t.radius * t.radius))), m = smooth(clamp(1 - d / (t.dimple * t.dimple))), h = 0;
					if (f > t.inner - t.width - t.warp && f < t.outer + t.width + t.warp) {
						let e = t.warp * Math.cos(3 * Math.atan2(u, l) + i[o + 4]), n = (f - t.inner - e) / t.width, r = (f - t.outer - e) / t.width;
						h = smooth(clamp(1 - n * n)) + smooth(clamp(1 - r * r));
					}
					let g = smooth(clamp(1 - d / (.34 * .34))), _ = (.5 + .5 * Math.cos(n * 64 * W)) * (.5 + .5 * Math.cos(n * 64 * G)), v = a(W, G);
					J = (1 - p) * (.9 + .04 * _) + p * (.25 + .08 * v + .08 * h), Y = .08 + .02 * _ + .012 * v + p * (.4 - .12 * m) + .2 * h, X += .03 * v - .1 * p, Z = .98 - .2 * g + .17 * p + .02 * h;
				};
			}
			case `flintwall`: {
				let t = require_materials.proceduralMaterialPresets.flintwall, i = 2 + t.edges * 3, a = new Float64Array(t.cells * t.cells * i);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = (e * t.cells + o) * i, c = n * hash(o, e, r ^ 13905);
					a[s] = c, a[s + 1] = hash(o, e, r ^ 18275);
					for (let i = 0; i < t.edges; i++) {
						let l = s + 2 + i * 3, u = c + n * i / t.edges;
						a[l] = Math.cos(u), a[l + 1] = Math.sin(u), a[l + 2] = t.radiusMin + t.radiusRange * hash(o * t.edges + i, e, r ^ 22645);
					}
				}
				let o = cachedNoise(96, 96, r ^ 27015);
				return () => {
					let e = Math.floor(G * t.cells), r = fract(W - e % 2 * .5 / t.cells) * t.cells, s = Math.floor(r) % t.cells, c = (e * t.cells + s) * i, l = fract(r) - .5, u = fract(G * t.cells) - .5, d = 1, f = 1;
					for (let e = 0; e < t.edges; e++) {
						let n = c + 2 + e * 3, r = a[n + 2] - l * a[n] - u * a[n + 1];
						d *= smooth(clamp(r / t.bevel)), f *= smooth(clamp((r - t.cortex) / t.bevel));
					}
					let p = d - f, m = .5 + .5 * Math.cos(n * 10 * ((l + .13) * (l + .13) + (u - .07) * (u - .07)) + a[c]), h = o(W, G);
					Q = 1 - d, J = .62 * Q + .86 * p + f * (.15 + .1 * a[c + 1] + .05 * m), Y = .15 + d * (.5 + .015 * h) + .025 * f * m, X += .12 * Q + f * (-.36 + .06 * m), Z = .65 + .32 * d;
				};
			}
			case `rakedgravel`: {
				let t = require_materials.proceduralMaterialPresets.rakedgravel, n = new Float64Array(t.cells * t.cells * 4);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 4;
					n[a] = .4 + .2 * hash(i, e, r ^ 12631), n[a + 1] = .4 + .2 * hash(i, e, r ^ 17001), n[a + 2] = t.radiusMin + t.radiusRange * hash(i, e, r ^ 21371), n[a + 3] = .6 + .4 * hash(i, e, r ^ 25741);
				}
				let i = cachedNoise(96, 96, r ^ 30111);
				return () => {
					let r = smooth(clamp((Math.abs(fract(W * t.furrows) - .5) - t.bottom) / t.shoulder)), a = W * t.cells, o = G * t.cells, s = (Math.floor(o) * t.cells + Math.floor(a)) * 4, c = (fract(a) - n[s]) / n[s + 2], l = (fract(o) - n[s + 1]) / n[s + 2], u = smooth(clamp(1 - c * c - l * l)), d = i(W, G);
					J = .44 + .14 * r + .22 * u * n[s + 3] + .05 * d, Y = .16 + .5 * r + .12 * u + .015 * d, X += .1 * (1 - u) - .03 * r, Z = .6 + .3 * r + .08 * u;
				};
			}
			case `sunburstveneer`: {
				let t = require_materials.proceduralMaterialPresets.sunburstveneer, i = new Float64Array(t.cells * t.cells), a = new Float64Array(t.cells * t.cells * t.wedges * 3);
				for (let e = 0; e < t.cells; e++) for (let o = 0; o < t.cells; o++) {
					let s = e * t.cells + o;
					i[s] = n * hash(o, e, r ^ 16723);
					for (let c = 0; c < t.wedges; c++) {
						let l = (s * t.wedges + c) * 3, u = i[s] + n * (c + .5) / t.wedges;
						a[l] = Math.cos(u), a[l + 1] = Math.sin(u), a[l + 2] = hash(o * t.wedges + c, e, r ^ 21093);
					}
				}
				let o = Math.sin(Math.PI / t.wedges), s = Math.cos(Math.PI / t.wedges), c = cachedNoise(8, 96, r ^ 25463), l = cachedNoise(96, 96, r ^ 29833);
				return () => {
					let e = W * t.cells, r = G * t.cells, u = Math.floor(r) * t.cells + Math.floor(e), d = fract(e) - .5, f = fract(r) - .5, p = Math.hypot(d, f), m = Math.floor(fract((Math.atan2(f, d) - i[u]) / n) * t.wedges) % t.wedges, h = (u * t.wedges + m) * 3, g = d * a[h] + f * a[h + 1], _ = f * a[h] - d * a[h + 1], y = smooth(clamp((o * g - s * Math.abs(_) - t.gap) / t.bevel)) * smooth(clamp((p - t.innerRadius) / t.edge)) * smooth(clamp((t.radius - p) / t.edge)), b = smooth(clamp((t.plugRadius - p) / t.edge)), x = 1 - smooth(clamp((p - t.radius) / t.edge)), S = x - y - b, C = a[h + 2], w = c(g + .3 * C, _ + .7 * C), T = l(W, G);
					J = (1 - x) * (.18 + .1 * c(W, G)) + S * .08 + y * (.4 + .25 * C + .2 * w) + b * (.55 + .15 * c(d + .5, f + .5)), Y = .65 + .01 * T - .18 * S + .004 * y * w, X += .2 * S + .03 * y * w, Z = .99 - .35 * S;
				};
			}
			case `shirring`: {
				let t = require_materials.proceduralMaterialPresets.shirring, i = hash(0, 0, r ^ 10561), a = cachedNoise(96, 96, r ^ 14931);
				return () => {
					let e = G * t.rows, r = fract(e + .5) - .5, o = .5 - .5 * Math.cos(n * e), s = .5 + .5 * Math.cos(n * (W * t.folds + t.wander * Math.sin(n * e) + i)), c = s * s, l = 1 - smooth(clamp(Math.abs(r) / t.seamWidth)), u = r / t.threadWidth, d = smooth(clamp(1 - u * u)) * smooth(clamp((.4 - Math.abs(fract(W * t.stitches) - .5)) / .1)), f = .5 + .25 * Math.cos(n * 96 * W) + .25 * Math.cos(n * 96 * G), p = a(W, G);
					J = .4 + .13 * c + .08 * f + .02 * p - .12 * l + .2 * d, Y = .15 - .04 * l + (.03 + .52 * o) * c + .025 * f + .01 * p + .06 * d, X += .05 * (1 - c) - .08 * d, Z = .65 + .3 * c * o - .12 * l + .1 * d;
				};
			}
			case `crystallineglaze`: {
				let t = require_materials.proceduralMaterialPresets.crystallineglaze, i = new Float64Array(t.cells * t.cells * 5);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 5;
					i[o] = .44 + .12 * hash(a, e, r ^ 10833), i[o + 1] = .44 + .12 * hash(a, e, r ^ 15203), i[o + 2] = t.radiusMin + t.radiusRange * hash(a, e, r ^ 19573), i[o + 3] = n * hash(a, e, r ^ 23943), i[o + 4] = t.armsMin + Math.floor(t.armsRange * hash(a, e, r ^ 28313));
				}
				let a = cachedNoise(96, 96, r ^ 32683);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 5, s = fract(e) - i[o], c = fract(r) - i[o + 1], l = (s * s + c * c) / (i[o + 2] * i[o + 2]), u = Math.atan2(c, s), d = i[o + 3], f = 1 + .08 * Math.cos(5 * u + d) + .05 * Math.cos(9 * u - d), p = smooth(clamp((1 - l / (f * f)) / .25)), m = smooth(clamp(l / .04)), h = .5 + .5 * Math.cos(i[o + 4] * u + d), g = h * h * h * h, _ = .5 + .5 * Math.cos(n * 3 * l), v = (.6 + .4 * m * (2 * g - 1)) * (.85 + .15 * _), y = a(W, G);
					J = .12 + .8 * p * v + .02 * y, Y = .4 + .004 * y, X += .08 * p * m * g, Z = 1;
				};
			}
			case `seaurchintest`: {
				let t = require_materials.proceduralMaterialPresets.seaurchintest, i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = n * hash(a, e, r ^ 27729), s = (e * t.cells + a) * 2;
					i[s] = Math.cos(o), i[s + 1] = Math.sin(o);
				}
				let a = /* @__PURE__ */ new Float64Array(20);
				for (let e = 0; e < 10; e++) a[e * 2] = Math.cos(n * e / 10), a[e * 2 + 1] = Math.sin(n * e / 10);
				let o = cachedNoise(96, 96, r ^ 32099);
				return () => {
					let e = W * t.cells, r = G * t.cells, s = fract(e) - .5, c = fract(r) - .5, l = (Math.floor(r) * t.cells + Math.floor(e)) * 2, u = s * i[l] + c * i[l + 1], d = c * i[l] - s * i[l + 1], f = u * u + d * d, p = clamp(1 - f / (t.radius * t.radius)), m = smooth(clamp(p / .2)), h = Math.atan2(d, u) * 5 / n, g = (Math.round(h) % 5 + 5) % 5, _ = u * a[g * 4] + d * a[g * 4 + 1], v = d * a[g * 4] - u * a[g * 4 + 1], y = Math.max(0, Math.min(t.poreRows - 1, Math.round((_ - t.poreStart) / t.poreSpacing))), b = (_ - t.poreStart - y * t.poreSpacing) / t.poreRadius, x = (Math.abs(v) - t.poreOffset) / t.poreRadius, S = smooth(clamp(1 - b * b - x * x)) + smooth(clamp(1 - f / (t.apicalRadius * t.apicalRadius))), C = (Math.round(h - .5) % 5 + 5) % 5 * 4 + 2, w = u * a[C] + d * a[C + 1], T = (d * a[C] - u * a[C + 1]) / t.tubercleRadius, E = (w - (w < .25 ? .2 : .3)) / t.tubercleRadius, D = smooth(clamp(1 - E * E - T * T)), O = o(W, G);
					J = .07 * (1 - m) + m * (.53 + .18 * p + .05 * O - .3 * S), Y = .04 + m * (.42 + .3 * p + .07 * D + .01 * O - .16 * S), X += .14 * (1 - m) + m * (.1 * S - .06 * D), Z = .3 + m * (.68 - .45 * S);
				};
			}
			case `guilloche`: {
				let t = require_materials.proceduralMaterialPresets.guilloche, i = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) i[e * t.cells + a] = n * hash(a, e, r ^ 18993);
				let a = cachedNoise(96, 96, r ^ 23363);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, o = fract(n) - .5, s = i[Math.floor(n) * t.cells + Math.floor(e)], c = Math.hypot(r, o), l = t.radius + t.amplitude * Math.cos(t.lobes * Math.atan2(o, r) + s), u = 0;
					for (let e = -1; e <= 1; e++) {
						let n = (c - l - e * t.spacing) / t.width;
						u += smooth(clamp(1 - n * n));
					}
					let d = a(W, G);
					J = .75 + .05 * d - .25 * u, Y = .65 + .005 * d - .15 * u, X += .015 * d + .12 * u, Z = .99 - .18 * u;
				};
			}
			case `cairotiles`: {
				let t = require_materials.proceduralMaterialPresets.cairotiles, n = /* @__PURE__ */ new Float64Array(60);
				for (let e = 0; e < 2; e++) for (let r = 0; r < 2; r++) {
					let i = e ? -1 : 1;
					for (let a = 0; a < 5; a++) {
						let o = (a + 1) % 5, s = t.vertices[a * 2], c = i * t.vertices[a * 2 + 1], l = t.vertices[o * 2], u = i * t.vertices[o * 2 + 1], d = r ? -c : s, f = r ? s : c, p = r ? -u : l, m = r ? l : u, h = i / Math.hypot(p - d, m - f), g = (f - m) * h, _ = (p - d) * h, v = ((e * 2 + r) * 5 + a) * 3;
						n[v] = g, n[v + 1] = _, n[v + 2] = -g * d - _ * f;
					}
				}
				let i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) for (let a = 0; a < 2; a++) i[(e * t.cells + n) * 2 + a] = hash(n, e, r ^ (a ? 28217 : 23847));
				let a = cachedNoise(96, 96, r ^ 32577);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(e), s = Math.floor(r), c = 0, l = 0;
					for (let a = -1; a <= 1; a++) for (let u = -1; u <= 1; u++) {
						let d = o + u, f = s + a, p = (d % t.cells + t.cells) % t.cells, m = (f % t.cells + t.cells) % t.cells, h = d + f & 1, g = e - d, _ = r - f;
						for (let e = 0; e < 2; e++) {
							let r = 1;
							for (let i = 0; i < 5 && r > 0; i++) {
								let a = ((h * 2 + e) * 5 + i) * 3;
								r *= smooth(clamp((n[a] * g + n[a + 1] * _ + n[a + 2] - t.grout) / t.shoulder));
							}
							c += r, l += r * i[(m * t.cells + p) * 2 + e];
						}
					}
					c = clamp(c);
					let u = a(W, G);
					Q = 1 - c, J = c * (.25 + .05 * u) + .35 * l + .5 * Q, Y = .08 + c * (.7 + .01 * u), X += .04 * u * c + .18 * Q, Z = .55 + .43 * c;
				};
			}
			case `vermiculite`: {
				let t = require_materials.proceduralMaterialPresets.vermiculite, i = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) {
					let o = (e * t.cells + a) * 3, s = n * hash(a, e, r ^ 19751);
					i[o] = Math.cos(s), i[o + 1] = Math.sin(s), i[o + 2] = hash(a, e, r ^ 24121);
				}
				let a = cachedNoise(96, 96, r ^ 28481);
				return () => {
					let e = G * t.cells, r = Math.floor(e), o = W * t.cells - r % 2 * .5, s = (Math.floor(o) % t.cells + t.cells) % t.cells, c = (r * t.cells + s) * 3, l = fract(o) - .5, u = fract(e) - .5, d = l * i[c] + u * i[c + 1], f = u * i[c] - l * i[c + 1], p = .5 + .5 * Math.cos(n * (t.layers * d / (2 * t.halfLength) + i[c + 2])), m = p * p, h = t.halfWidth + t.ribWidth * m, g = (d / t.halfLength) ** 2 + (f / h) ** 2, _ = smooth(clamp((1 - g) / .18)), v = clamp(1 - g), y = a(W, G);
					J = .12 * (1 - _) + _ * (.43 + .3 * m + .08 * y), Y = .06 + _ * (.35 + .27 * m + .12 * v + .015 * y), X += .18 * (1 - _) + _ * (.04 * y - .12 * m), Z = .35 + _ * (.38 + .22 * m);
				};
			}
			case `suminagashi`: {
				let t = require_materials.proceduralMaterialPresets.suminagashi, i = cachedNoise(4, 4, r ^ 11591), a = cachedNoise(4, 4, r ^ 15961), o = cachedNoise(3, 3, r ^ 20321), s = cachedNoise(7, 7, r ^ 23155), c = cachedNoise(96, 96, r ^ 27525), l = cachedNoise(192, 8, r ^ 31895);
				return () => {
					let e = W + t.warp * (i(W, G) - .5), r = G + t.warp * (a(W, G) - .5), u = .9 * o(e, r) + .1 * s(e, r), d = smooth(clamp((Math.cos(n * t.rings * u) - .45) / .5)), f = c(W, G), p = l(W, G);
					J = .93 - .82 * d + .02 * f, Y = .12 + .02 * f + .008 * p, X += .025 * f - .1 * d, Z = .99;
				};
			}
			case `cocoamat`: {
				let t = require_materials.proceduralMaterialPresets.cocoamat, i = new Float64Array(t.cells * t.cells * t.fibers * 5);
				for (let e = 0; e < t.cells; e++) for (let a = 0; a < t.cells; a++) for (let o = 0; o < t.fibers; o++) {
					let s = ((e * t.cells + a) * t.fibers + o) * 5, c = r ^ Math.imul(o + 1, 40503), l = n * hash(a, e, c ^ 23081);
					i[s] = .2 + .6 * hash(a, e, c ^ 12613), i[s + 1] = .2 + .6 * hash(a, e, c ^ 16999), i[s + 2] = Math.cos(l), i[s + 3] = Math.sin(l), i[s + 4] = .08 + .08 * hash(a, e, c ^ 27441);
				}
				let a = cachedNoise(96, 96, r ^ 31811);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = Math.floor(e), o = Math.floor(n), s = 1;
					for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) {
						let l = r + c, u = o + a, d = (l % t.cells + t.cells) % t.cells, f = (u % t.cells + t.cells) % t.cells;
						for (let r = 0; r < t.fibers; r++) {
							let a = ((f * t.cells + d) * t.fibers + r) * 5, o = e - l - i[a], c = n - u - i[a + 1], p = o * i[a + 2] + c * i[a + 3], m = c * i[a + 2] - o * i[a + 3];
							if (Math.abs(p) >= t.halfLength || Math.abs(m) >= i[a + 4] + t.radius) continue;
							let h = (m - i[a + 4] * Math.sin(Math.PI * p / t.halfLength)) / t.radius, g = smooth(clamp(1 - h * h)) * smooth(clamp((t.halfLength - Math.abs(p)) / .1));
							s *= 1 - g;
						}
					}
					let c = 1 - s, l = a(W, G);
					J = .05 + c * (.52 + .12 * l), Y = .06 + c * (.69 + .035 * l), X += .1 * s + .02 * l * c, Z = .35 + .63 * c;
				};
			}
			case `saffiano`: {
				let t = require_materials.proceduralMaterialPresets.saffiano, i = cachedNoise(128, 128, r ^ 28457);
				return () => {
					let e = smooth(clamp((Math.cos(n * t.lines * (W + G)) - .8) / .2)), r = smooth(clamp((Math.cos(n * t.lines * (W - G)) - .8) / .2)), a = 1 - (1 - e) * (1 - r), o = i(W, G);
					J = .48 + .08 * o - .13 * a, Y = .65 + .025 * o - t.grooveDepth * a, X += .025 * o + .08 * a, Z = .97 - .13 * a;
				};
			}
			case `bargello`: {
				let t = require_materials.proceduralMaterialPresets.bargello, i = cachedNoise(96, 96, r ^ 24121);
				return () => {
					let e = W * t.columns, r = Math.floor(e) % 16, a = Math.min(r, 15 - r), o = G * t.rows - .25 * a, s = (Math.floor(o) % t.rows + t.rows) % t.rows, c = fract(e) - .5, l = fract(o) - .5, u = smooth(clamp(1 - (c / t.halfWidth) ** 2)) * smooth(clamp((.47 - Math.abs(l)) / .08)), d = .5 + .5 * Math.cos(n * 3 * c), f = i(W, G);
					J = u * (t.tones[s % 4] + .025 * f) + .025 * (1 - u), Y = .04 + u * (.55 + .015 * d + .01 * f), X += .15 * (1 - u) + u * (.02 * f + .015 * d), Z = .5 + .48 * u;
				};
			}
			case `diamondrustication`: {
				let t = require_materials.proceduralMaterialPresets.diamondrustication, n = cachedNoise(96, 96, r ^ 27953), i = cachedNoise(24, 24, r ^ 39511), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) a[e * t.cells + n] = hash(n, e, r ^ 15401);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = fract(e) - .5, s = fract(r) - .5, c = Math.sqrt(o * o + 1e-4), l = Math.sqrt(s * s + 1e-4), d = clamp(1 - .5 * (c + l + Math.sqrt((c - l) ** 2 + 4e-4)) / t.bossHalfWidth), f = d < t.footSoftness ? d * d / (2 * t.footSoftness) : d - t.footSoftness / 2, p = smooth(clamp((.5 - Math.abs(o) - t.grout) / t.bevel)) * smooth(clamp((.5 - Math.abs(s) - t.grout) / t.bevel)), m = n(W, G), h = i(W, G);
					J = p * (.35 + .3 * a[Math.floor(r) * t.cells + Math.floor(e)] + .1 * h + .04 * m) + .5 * (1 - p), Y = .06 + p * (.2 + .7 * f + .008 * m), Q = 1 - p, X += .035 * m * p + .12 * Q, Z = .55 + .43 * p;
				};
			}
			case `starfruit`: {
				let t = require_materials.proceduralMaterialPresets.starfruit, i = cachedNoise(96, 96, r ^ 36145), a = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 2, s = n * hash(i, e, r ^ 19047);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s);
				}
				let o = /* @__PURE__ */ new Float64Array(10);
				for (let e = 0; e < 5; e++) o[e * 2] = Math.cos(n * e / 5), o[e * 2 + 1] = Math.sin(n * e / 5);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 2, s = fract(e) - .5, c = fract(n) - .5, l = s * a[r] + c * a[r + 1], u = c * a[r] - s * a[r + 1], d = Math.hypot(l, u), f = Math.atan2(u, l), p = t.innerRadius + (t.outerRadius - t.innerRadius) * (.5 + .5 * Math.cos(5 * f)) ** 3 - d, m = smooth(clamp(p / .025)), h = 1 - smooth(clamp((p - .02) / .025)), g = 0;
					for (let e = 0; e < 5; e++) {
						let n = o[e * 2], r = o[e * 2 + 1], i = (l * n + u * r - t.seedRadius) / .027, a = (u * n - l * r) / .012;
						g += smooth(clamp(1 - i * i - a * a));
					}
					let _ = i(W, G);
					J = .025 + m * (.85 + .02 * _ - .27 * h - .75 * g), Y = .04 + m * (.5 + .01 * _ + .03 * h - .13 * g), X += .3 * (1 - m) + m * (.02 * _ + .08 * g), Z = .35 + m * (.63 - .3 * g);
				};
			}
			case `rebar`: {
				let t = require_materials.proceduralMaterialPresets.rebar, i = cachedNoise(96, 96, r ^ 31793);
				return () => {
					let e = Math.floor(W * t.columns), r = fract(W * t.columns) - .5, a = clamp(1 - (r / t.radius) ** 2), o = smooth(clamp(a / .18)), s = Math.sqrt(a), c = e % 2 ? -1 : 1, l = (.5 + .5 * Math.cos(n * (t.ribs * G + c * t.slant * r))) ** 12, u = i(W, G);
					J = .03 + o * (.3 + .27 * s + .14 * l + .025 * u), Y = .04 + o * (.3 + .35 * s + .1 * l + .008 * u), X += .2 * (1 - o) + o * (.03 * u - .06 * l), Z = .4 + o * (.57 - .02 * l);
				};
			}
			case `englishbond`: {
				let t = require_materials.proceduralMaterialPresets.englishbond, n = cachedNoise(96, 96, r ^ 23319), i = cachedNoise(48, 48, r ^ 15657), a = new Float64Array(t.rows * t.headerColumns);
				for (let e = 0; e < t.rows; e++) {
					let n = e % 2 ? t.stretcherColumns : t.headerColumns;
					for (let i = 0; i < n; i++) a[e * t.headerColumns + i] = hash(i, e, r ^ 35907);
				}
				return () => {
					let e = Math.floor(G * t.rows), r = e % 2 == 0, o = r ? t.headerColumns : t.stretcherColumns, s = W * o + (r ? .5 : 0), c = Math.floor(s) % o, l = (.5 - Math.abs(fract(s) - .5)) * t.rows / o, u = .5 - Math.abs(fract(G * t.rows) - .5), d = smooth(clamp((l - t.grout) / t.bevel)) * smooth(clamp((u - t.grout) / t.bevel)), f = n(W, G), p = i(W, G);
					J = d * (.3 + .3 * a[e * t.headerColumns + c] + .05 * f) + .5 * (1 - d), Y = .08 + d * (.7 + .025 * f + .015 * p), Q = 1 - d, X += .04 * f * d + .1 * Q, Z = .6 + .36 * d;
				};
			}
			case `hollyleaf`: {
				let t = require_materials.proceduralMaterialPresets.hollyleaf, i = cachedNoise(96, 96, r ^ 15729), a = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 2, s = n * hash(i, e, r ^ 27433);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 2, o = fract(e) - .5, s = fract(n) - .5, c = o * a[r] + s * a[r + 1], l = s * a[r] - o * a[r + 1], u = Math.abs(c), d = smooth(clamp((1 - c * c / .0225 - l * l / .1024) / .2)), f = 0;
					for (let e = -1; e <= 1; e++) {
						let t = e * .18, n = .06 * clamp((.3 - u) / .22), r = l - t - .035 * clamp((u - .08) / .22), i = smooth(clamp((n * n - r * r) / 15e-5)) * smooth(clamp((u - .08) / .03));
						d = 1 - (1 - d) * (1 - i);
						let a = l - t - .12 * u;
						f += smooth(clamp((25e-6 - a * a) / 25e-6)) * smooth(clamp(u / .025)) * smooth(clamp((.28 - u) / .06));
					}
					let p = .07 * clamp((.4 - l) / .15), m = smooth(clamp((l - .25) / .04)) * smooth(clamp((p * p - c * c) / 8e-5));
					d = 1 - (1 - d) * (1 - m);
					let h = smooth(clamp((l + .42) / .035)) * (1 - smooth(clamp((l + .3) / .035))) * smooth(clamp((196e-6 - c * c) / 196e-6)), g = smooth(clamp((1e-4 - c * c) / 1e-4)) * smooth(clamp((.34 - Math.abs(l)) / .04)), _ = i(W, G), v = g + .55 * f, y = 1 - (1 - d) * (1 - h);
					J = .04 + d * (.5 + .12 * _ + .08 * v) + (1 - d) * .25 * h, Y = .04 + d * (.58 + .015 * _ + .045 * v) + (1 - d) * .25 * h, X += .3 * (1 - d) + .02 * _ * d, Z = .34 + .64 * y;
				};
			}
			case `slottedwood`: {
				let t = require_materials.proceduralMaterialPresets.slottedwood, n = cachedNoise(96, 4, r ^ 19497), i = cachedNoise(192, 8, r ^ 32275), a = t.outerRadius * t.outerRadius, o = a - t.coreRadius * t.coreRadius, s = t.columns / t.rows;
				return () => {
					let e = Math.floor(G * t.rows), r = fract(W * t.columns - e % 2 * .5) - .5, c = (fract(G * t.rows) - .5) * s, l = Math.max(0, Math.abs(r) - t.spine), u = smooth(clamp((a - l * l - c * c) / o)), d = 1 - u, f = n(W, G), p = i(W, G);
					J = (.58 + .2 * f + .04 * p) * d + .025 * u, Y = (.74 + .018 * f + .006 * p) * d + .08 * u, X += .04 * f * d + .28 * u, Z = .98 - .72 * u;
				};
			}
			case `ikat`: {
				let t = require_materials.proceduralMaterialPresets.ikat, i = cachedNoise(t.threads, 1, r ^ 27671), a = cachedNoise(96, 96, r ^ 15945);
				return () => {
					let e = t.fringe * (i(W, 0) - .5), r = fract(W * t.cells) - .5, o = fract(G * t.cells + e) - .5, c = 1 - smooth(clamp((Math.sqrt(r * r + 1e-4) + Math.sqrt(o * o + 1e-4) - .34) / .07)), l = W * t.threads, u = G * t.threads, d = .5 + .5 * Math.cos(n * l), f = .5 + .5 * Math.cos(n * u), p = .5 + .5 * Math.cos(Math.PI * l) * Math.cos(Math.PI * u), m = d * (.35 + .25 * p) + f * (.35 + .25 * (1 - p)) - .3 * d * f, h = a(W, G);
					J = .055 + .82 * c + .025 * h, Y = .12 + .22 * m + .004 * h, X += .02 * h + .02 * (1 - m), Z = .82 + .16 * m;
				};
			}
			case `calcadawaves`: {
				let t = require_materials.proceduralMaterialPresets.calcadawaves, i = cachedNoise(96, 96, r ^ 32049), a = cachedNoise(48, 48, r ^ 19239), o = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let r = 0; r < t.cells; r++) {
					let i = e + .5 + 2.8 * Math.sin(n * (r + .5) / t.cells);
					o[e * t.cells + r] = Math.cos(n * i / 8) >= 0 ? .83 : .05;
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = smooth(clamp((.5 - Math.abs(fract(e) - .5) - t.grout) / t.bevel)) * smooth(clamp((.5 - Math.abs(fract(n) - .5) - t.grout) / t.bevel)), s = o[Math.floor(n) * t.cells + Math.floor(e)], c = i(W, G), l = a(W, G);
					J = .3 + r * (s - .3 + .04 * c), Y = .1 + r * (.65 + .015 * c + .008 * l), X += .03 * c + .05 * (1 - r), Z = .43 + .55 * r, Q = 1 - r;
				};
			}
			case `woodworm`: {
				let t = require_materials.proceduralMaterialPresets.woodworm, i = cachedNoise(96, 4, r ^ 31769), a = cachedNoise(192, 8, r ^ 14887), o = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 3, s = n * hash(i, e, r ^ 24113);
					o[a] = Math.cos(s), o[a + 1] = Math.sin(s), o[a + 2] = .06 + .05 * hash(i, e, r ^ 11079);
				}
				let s = 1 / (t.channelWidth * t.channelWidth), c = 1 / (t.holeRadius * t.holeRadius);
				return () => {
					let e = W * t.cells, r = G * t.cells, l = (Math.floor(r) * t.cells + Math.floor(e)) * 3, u = fract(e) - .5, d = fract(r) - .5, f = u * o[l] + d * o[l + 1], p = d * o[l] - u * o[l + 1], m = p - o[l + 2] * Math.sin(n * f / .6), h = (1 - smooth(clamp((m * m * s - .25) / .75))) * (1 - smooth(clamp((Math.abs(f) - .26) / .08))), g = 0;
					for (let e = -1; e <= 1; e += 2) {
						let t = f - e * .3;
						g += 1 - smooth(clamp(((t * t + p * p) * c - .2) / .8));
					}
					let _ = 1 - (1 - h) * (1 - g), v = i(W, G), y = a(W, G);
					J = .58 + .2 * v + .05 * y - .43 * _ - .12 * g, Y = .74 + .018 * v + .01 * y - .42 * _ - .2 * g, X += .06 * v + .1 * _, Z = .98 - .35 * _ - .3 * g;
				};
			}
			case `cofferedconcrete`: {
				let t = require_materials.proceduralMaterialPresets.cofferedconcrete, n = cachedNoise(96, 96, r ^ 19511), i = cachedNoise(24, 24, r ^ 28185);
				return () => {
					let e = Math.abs(fract(W * t.cells) - .5), r = Math.abs(fract(G * t.cells) - .5), a = smooth(clamp((t.opening - e) / t.wallWidth)) * smooth(clamp((t.opening - r) / t.wallWidth)), o = n(W, G), s = i(W, G), c = smooth(clamp((o - .68) / .2));
					J = .64 - .22 * a + .06 * o + .025 * s - .07 * c, Y = .8 - .65 * a + .009 * o + .006 * s - .015 * c, X += .05 * o + .03 * a, Z = .98 - .45 * a - .04 * c;
				};
			}
			case `crowncaps`: {
				let t = require_materials.proceduralMaterialPresets.crowncaps, i = cachedNoise(96, 96, r ^ 23591), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) a[e * t.cells + i] = n * hash(i, e, r ^ 31251);
				return () => {
					let e = W * t.cells, n = G * t.cells, r = fract(e) - .5, o = fract(n) - .5, s = Math.hypot(r, o), c = a[Math.floor(n) * t.cells + Math.floor(e)], l = .5 + .5 * Math.cos(t.teeth * Math.atan2(o, r) + c), u = smooth(clamp((.42 + .04 * l - s) / .025)), d = 1 - smooth(clamp((s - .32) / .09)), f = smooth(clamp((s - .29) / .025)) * (1 - smooth(clamp((s - .34) / .025))), p = smooth(clamp((s - .3) / .06)), m = i(W, G);
					J = .12 + u * (.45 + .12 * f + .04 * m + .07 * l * p), Y = .02 + u * (.28 + .45 * d + .12 * f + .07 * l * p + .003 * m), X += .15 * (1 - u) + u * (.03 * m + .08 * p * (1 - l)), Z = .35 + u * (.63 - .15 * p * (1 - l));
				};
			}
			case `lotusseedpod`: {
				let t = require_materials.proceduralMaterialPresets.lotusseedpod, i = cachedNoise(96, 96, r ^ 27943), a = new Float64Array(t.cells * t.cells * 22);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 22, s = n * hash(i, e, r ^ 12113);
					a[o] = .44 + .02 * hash(i, e, r ^ 23065);
					for (let t = 0; t < 7; t++) {
						let c = o + 1 + t * 3, l = i * 7 + t, u = s + (t - 1) * n / 6 + .1 * (hash(l, e, r ^ 31537) - .5), d = t === 0 ? 0 : .235 + .03 * hash(l, e, r ^ 15433), f = .07 + .015 * hash(l, e, r ^ 36375);
						a[c] = d * Math.cos(u), a[c + 1] = d * Math.sin(u), a[c + 2] = 1 / (f * f);
					}
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 22, o = fract(e) - .5, s = fract(n) - .5, c = smooth(clamp((a[r] - Math.hypot(o, s)) / .04)), l = 0, u = 0, d = 0;
					for (let e = 0; e < 7; e++) {
						let t = r + 1 + e * 3, n = ((o - a[t]) ** 2 + (s - a[t + 1]) ** 2) * a[t + 2];
						l += 1 - smooth(clamp((n - .45) / .55)), u += smooth(clamp((n - .75) / .25)) * (1 - smooth(clamp((n - 1.2) / .35))), d += smooth(clamp((.2 - n) / .2));
					}
					let f = i(W, G);
					J = .04 + c * (.58 + .04 * f - .4 * l + .08 * u + .05 * d), Y = .03 + c * (.57 + .012 * f - .4 * l + .08 * u + .17 * d), X += c * (.04 * f + .05 * l - .22 * d), Z = .35 + c * (.63 - .48 * l + .08 * d);
				};
			}
			case `asanoha`: {
				let t = require_materials.proceduralMaterialPresets.asanoha, i = Math.sqrt(3) / 2, a = cachedNoise(96, 96, r ^ 23319), gridLine = (e) => {
					let t = fract(e);
					return smooth(clamp((.035 - i * Math.min(t, 1 - t)) / .015));
				};
				return () => {
					let e = G * t.rows, r = W * t.columns - .5 * e, o = fract(r), s = fract(e), c = o + .5 * s, l = i * s;
					o + s > 1 && (c = 1.5 - c, l = i - l);
					let u = (1 - gridLine(r)) * (1 - gridLine(e)) * (1 - gridLine(r + e)), d = c - .5, f = l - i / 3;
					for (let e = 0; e < 3; e++) {
						let t = e === 0 ? -.5 : e === 1 ? .5 : 0, n = e === 2 ? 2 * i / 3 : -i / 3, r = clamp(3 * (d * t + f * n)), o = smooth(clamp((.018 ** 2 - ((d - r * t) ** 2 + (f - r * n) ** 2)) / (.018 ** 2 - .008 ** 2)));
						u *= 1 - o;
					}
					let p = .5 + .5 * Math.cos(n * t.threads * W), m = .5 + .5 * Math.cos(n * t.threads * G), h = .5 + .5 * Math.cos(Math.PI * t.threads * (W + G)), g = p * h + m * (1 - h), _ = a(W, G);
					J = .13 * u + .9 * (1 - u) + .025 * g + .02 * _, Y = .24 + .16 * g + .02 * _, X += .025 * _ + .025 * (1 - g), Z = .88 + .1 * g;
				};
			}
			case `palmendgrain`: {
				let t = require_materials.proceduralMaterialPresets.palmendgrain, i = cachedNoise(96, 96, r ^ 18963), a = cachedNoise(16, 16, r ^ 31785), o = new Float64Array(t.cells * t.cells * 6);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 6, s = n * hash(i, e, r ^ 23863);
					o[a] = .35 + .3 * hash(i, e, r ^ 11033), o[a + 1] = .35 + .3 * hash(i, e, r ^ 28225), o[a + 2] = Math.cos(s), o[a + 3] = Math.sin(s), o[a + 4] = 1 / (.23 + .05 * hash(i, e, r ^ 15447)), o[a + 5] = 1 / (.15 + .035 * hash(i, e, r ^ 35363));
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 6, s = fract(e) - o[r], c = fract(n) - o[r + 1], l = s * o[r + 2] + c * o[r + 3], u = -s * o[r + 3] + c * o[r + 2], f = 1 - smooth(clamp(((l * o[r + 4]) ** 2 + (u * o[r + 5]) ** 2 - .4) / .6)), p = clamp(1 - ((l + .09) / .055) ** 2 - (u / .05) ** 2), m = clamp(1 - ((l - .09) / .055) ** 2 - (u / .05) ** 2), h = p * p + m * m, g = i(W, G), _ = a(W, G);
					J = .8 + .04 * g + .05 * _ - .58 * f - .12 * h, Y = .5 + .012 * g - .28 * h, X += .04 * g - .06 * f + .12 * h, Z = .99 - .25 * h;
				};
			}
			case `dogbonepavers`: {
				let t = require_materials.proceduralMaterialPresets.dogbonepavers, n = cachedNoise(96, 96, r ^ 14993), i = cachedNoise(24, 24, r ^ 27687), a = new Float64Array(t.columns * t.rows);
				for (let e = 0; e < t.rows; e++) for (let n = 0; n < t.columns; n++) a[e * t.columns + n] = hash(n, e, r ^ 23827);
				return () => {
					let e = W * t.columns, r = G * t.rows * 2, o = 0, s = 0;
					for (let n = -1; n <= 1; n++) {
						let i = Math.floor(e) + n, c = i & 1, l = Math.floor((r - c) / 2), u = e - i - .5, d = r - (l * 2 + c + 1), p = smooth(clamp((.35 + .3 * smooth(clamp((Math.abs(d) - .35) / .3)) - Math.abs(u) - t.grout) / t.shoulder)) * smooth(clamp((1 - Math.abs(d) - t.grout) / t.shoulder)), m = (i + t.columns) % t.columns, h = (l + t.rows) % t.rows;
						o += p, s += p * a[h * t.columns + m];
					}
					let c = clamp(o), l = n(W, G), u = i(W, G);
					J = .2 + .4 * c + .2 * s + c * (.04 * l - .06 * u), Y = c * (.62 + .025 * l + .01 * u), X += .1 * (1 - c) + .025 * l * c, Z = .5 + .5 * c, Q = 1 - c;
				};
			}
			case `saltpan`: {
				let t = require_materials.proceduralMaterialPresets.saltpan, n = cachedNoise(96, 96, r ^ 10865), i = cachedNoise(48, 48, r ^ 27957), a = new Float64Array(t.cells * t.cells * 27);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) {
					let i = (e * t.cells + n) * 27, o = .36 + .28 * hash(n, e, r ^ 15129), s = .36 + .28 * hash(n, e, r ^ 32547);
					a[i] = o, a[i + 1] = s, a[i + 2] = hash(n, e, r ^ 23575);
					let c = i + 3;
					for (let i = -1; i <= 1; i++) for (let l = -1; l <= 1; l++) {
						if (l === 0 && i === 0) continue;
						let u = (n + l + t.cells) % t.cells, d = (e + i + t.cells) % t.cells, f = l + ((d & 1) - (e & 1)) * .5 + .36 + .28 * hash(u, d, r ^ 15129) - o, p = i + .36 + .28 * hash(u, d, r ^ 32547) - s, m = Math.sqrt(f * f + p * p);
						a[c++] = f / m, a[c++] = p / m, a[c++] = m / 2;
					}
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, o = Math.floor(r), s = 0, c = 0;
					for (let n = -1; n <= 1; n++) for (let i = -1; i <= 1; i++) {
						let l = o + n, u = (l & 1) * .5, d = Math.floor(e - u) + i, f = ((l + t.cells) % t.cells * t.cells + (d + t.cells) % t.cells) * 27, p = e - d - u - a[f], m = r - l - a[f + 1], h = 1;
						for (let e = 0; e < 8 && h > 0; e++) {
							let n = f + 3 + e * 3;
							h *= smooth(clamp((a[n + 2] - p * a[n] - m * a[n + 1]) / t.ridgeWidth));
						}
						s += h, c += h * a[f + 2];
					}
					let l = 1 - clamp(s), u = n(W, G), d = smooth(clamp((i(W, G) - .65) / .25));
					J = .32 + .48 * l + .1 * c + .03 * u + .04 * d, Y = .08 + .58 * l + .025 * u + .015 * d, X += .06 * l + .025 * u, Z = .9 + .08 * l;
				};
			}
			case `scallopedslate`: {
				let t = require_materials.proceduralMaterialPresets.scallopedslate, n = cachedNoise(96, 96, r ^ 20017), i = cachedNoise(8, 64, r ^ 27415), a = new Float64Array(t.columns * t.rows);
				for (let e = 0; e < t.rows; e++) for (let n = 0; n < t.columns; n++) a[e * t.columns + n] = hash(n, e, r ^ 16169);
				return () => {
					let e = G * t.rows, r = Math.floor(e), o = n(W, G), s = i(W, G);
					J = .08 + .025 * o, Y = .08 + .01 * o, X = t.roughness + .08, Z = .6;
					for (let n = r + 1; n >= r - 1; n--) {
						let r = W * t.columns + (n & 1) * .5, i = fract(r) - .5, c = e - n, l = smooth(clamp((c + .75) / .1)), u = smooth(clamp((t.halfWidth - Math.abs(i)) / .035)), d = Math.max(c - t.tailStart, 0) / t.tailDepth, f = (i / t.halfWidth) ** 2 + d * d, p = smooth(clamp((1 - f) / .12)), m = l * u * p, h = l * u * (1 - p) * smooth(clamp((1.16 - f) / .16)), g = (n + t.rows) % t.rows, _ = Math.floor(r) % t.columns, v = .25 + .3 * a[g * t.columns + _] + .08 * s + .025 * o, y = .3 + .35 * smooth(clamp((c + .75) / 2.15)) + .015 * o;
						J = J * (1 - .2 * h) * (1 - m) + v * m, Y = Y * (1 - m) + y * m, X = X * (1 - m) + (t.roughness - .07 + .07 * o + .04 * s) * m, Z = Z * (1 - .3 * h) * (1 - m) + .98 * m;
					}
				};
			}
			case `shibori`: {
				let t = require_materials.proceduralMaterialPresets.shibori, i = cachedNoise(96, 96, r ^ 15217), a = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) a[e * t.cells + i] = n * hash(i, e, r ^ 32035);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = fract(e) - .5, s = fract(r) - .5, c = o * o + s * s, l = i(W, G), u = 0;
					if (c > .0025 && c < .2304) {
						let n = Math.atan2(s, o), i = a[Math.floor(r) * t.cells + Math.floor(e)], d = Math.sqrt(c) + .01 * Math.sin(5 * n + i) + .012 * Math.sin(9 * n - i) + .008 * (l - .5), f = smooth(clamp((.055 - Math.abs(d - .17)) / .035)), p = smooth(clamp((.055 - Math.abs(d - .34)) / .035)), m = smooth(clamp((Math.cos(t.pleats * n + .8 * Math.sin(3 * n + i)) - .2) / .8));
						u = (f + p) * (.55 + .45 * m);
					}
					let d = W * t.threads, f = G * t.threads, p = .5 + .5 * Math.cos(n * d), m = .5 + .5 * Math.cos(n * f), h = .5 + .5 * Math.cos(Math.PI * d) * Math.cos(Math.PI * f), g = p * (.35 + .25 * h) + m * (.35 + .25 * (1 - h)) - .3 * p * m;
					J = .055 + .82 * u + .025 * l, Y = .12 + .22 * g + .004 * l, X += .02 * l + .02 * (1 - g), Z = .82 + .16 * g;
				};
			}
			case `herringbonebrick`: {
				let t = require_materials.proceduralMaterialPresets.herringbonebrick, n = cachedNoise(96, 96, r ^ 21415), i = new Float64Array(t.cells * t.cells);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) i[e * t.cells + n] = hash(n, e, r ^ 11545);
				return () => {
					let e = W * t.cells, r = G * t.cells, a = Math.floor(e), o = Math.floor(r), s = (a + o) % 4, c = s < 2, l = a - +(s === 1), u = o - +(s === 3), d = c ? 2 : 1, f = c ? 1 : 2, p = e - l, m = r - u, h = smooth(clamp((Math.min(p, d - p) - t.grout) / t.shoulder)) * smooth(clamp((Math.min(m, f - m) - t.grout) / t.shoulder)), g = (l + t.cells) % t.cells, _ = (u + t.cells) % t.cells, v = n(W, G);
					J = .16 + h * (.35 + .2 * i[_ * t.cells + g] + .09 * v), Y = (.58 + .04 * v) * h, X += .16 * (1 - h) + .02 * v * h, Z = .55 + .45 * h, Q = 1 - h;
				};
			}
			case `louveredmetal`: {
				let t = require_materials.proceduralMaterialPresets.louveredmetal, n = cachedNoise(96, 96, r ^ 27961);
				return () => {
					let e = fract(W * t.columns) - .5, r = fract(G * t.rows) - .5, i = smooth(clamp((t.halfWidth - Math.abs(e)) / t.endShoulder)), a = i * smooth(clamp((r + .3) / .08)) * (1 - smooth(clamp((r - .2) / .06))), o = smooth(clamp((r + .22) / .44)), s = i * smooth(clamp((r - .22) / .04)) * (1 - smooth(clamp((r - .34) / .04))), c = n(W, G);
					J = .46 + .2 * a * o - .36 * s + .025 * c, Y = .1 + .5 * a * o - .07 * s + .006 * c, X += -.04 * a + .12 * s + .01 * c, Z = 1 - .65 * s;
				};
			}
			case `tuftedleather`: {
				let t = require_materials.proceduralMaterialPresets.tuftedleather, i = cachedNoise(96, 96, r ^ 13767), a = cachedNoise(24, 24, r ^ 29601), o = t.buttonRadius * t.buttonRadius, s = t.collarRadius * t.collarRadius;
				return () => {
					let e = (W + G) * t.diamonds, r = (W - G) * t.diamonds, c = .5 - .5 * Math.cos(n * e), l = .5 - .5 * Math.cos(n * r), u = smooth(1 - Math.exp(-6 * c * l)), d = fract(e + .5) - .5, f = fract(r + .5) - .5, p = d * d + f * f, m = smooth(clamp((s - p) / .02)), h = smooth(clamp((o - p) / .0015)), g = i(W, G), _ = a(W, G);
					J = .28 + .3 * u - .13 * m + .09 * h + .035 * g + .015 * _, Y = .12 + .6 * u - .08 * m + .18 * h * (1 - .25 * p / o) + .02 * g, X += -.16 * u + .06 * g - .06 * h, Z = .5 + .48 * u - .15 * m + .12 * h;
				};
			}
			case `seigaihatiles`: {
				let t = require_materials.proceduralMaterialPresets.seigaihatiles, i = cachedNoise(48, 48, r ^ 14775), a = new Float64Array(t.columns * t.rows);
				for (let e = 0; e < t.rows; e++) for (let n = 0; n < t.columns; n++) a[e * t.columns + n] = .06 + .04 * hash(n, e, r ^ 29123);
				let o = t.radius * t.radius, s = (t.radius - .02) ** 2;
				return () => {
					let e = W * t.columns, r = G * t.rows * .5, c = Math.floor(r * 2), l = .08;
					for (let i = -1; i <= 2; i++) {
						let u = c + i, d = (u % t.rows + t.rows) % t.rows, f = .5 + d % 2 * .5, p = Math.floor(e - f), m = r - u * .5;
						for (let r = 0; r <= 1; r++) {
							let i = p + r, c = e - i - f, u = c * c + m * m;
							if (u >= o) continue;
							let h = (i % t.columns + t.columns) % t.columns, g = 1 - smooth(clamp((u - s) / (o - s))), _ = smooth(clamp((u - .0025) / .02)) * (.5 + .5 * Math.cos(n * (Math.sqrt(u) - t.arcStart) / t.arcSpacing)) ** 10;
							l += g * (a[d * t.columns + h] + .82 * _ - l);
						}
					}
					let u = fract(W * t.tiles), d = fract(G * t.tiles), f = smooth(clamp((Math.min(u, 1 - u) - t.grout) / t.shoulder)) * smooth(clamp((Math.min(d, 1 - d) - t.grout) / t.shoulder)), p = i(W, G);
					J = .3 + f * (l - .3 + .015 * p), Y = (.65 + .004 * p) * f, X += .4 * (1 - f) + .015 * p * f, Z = .5 + .5 * f, Q = 1 - f;
				};
			}
			case `fossillimestone`: {
				let t = require_materials.proceduralMaterialPresets.fossillimestone, i = cachedNoise(80, 80, r ^ 12089), a = cachedNoise(12, 12, r ^ 24999), o = new Float64Array(t.cells * t.cells * 5);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 5, s = n * hash(i, e, r ^ 14171), c = .3 + .12 * hash(i, e, r ^ 29649);
					o[a] = Math.cos(s), o[a + 1] = Math.sin(s), o[a + 2] = 1 / c, o[a + 3] = 1 / (c * (.72 + .22 * hash(i, e, r ^ 6599))), o[a + 4] = n * hash(i, e, r ^ 22451);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, s = (Math.floor(r) * t.cells + Math.floor(e)) * 5, c = fract(e) - .5, l = fract(r) - .5, u = (c * o[s] + l * o[s + 1]) * o[s + 2], d = (l * o[s] - c * o[s + 1]) * o[s + 3], f = u * u + d * d, p = i(W, G);
					if (J = .48 + .08 * a(W, G) + .035 * p, Y = .35 + .015 * p, X += .015 * p, Z = .99, f >= 1) return;
					let m = 1 - smooth(clamp((f - .81) / .19)), h = smooth(clamp((f - .0064) / .0256)), g = Math.sqrt(f), _ = Math.atan2(d, u), v = o[s + 4], y = (.5 + .5 * Math.cos(n * t.turns * g - _ + v)) ** 16, b = h * (y + .45 * (.5 + .5 * Math.cos(t.septa * _ - n * g + v)) ** 24 * (1 - y));
					J += m * (.26 + .57 * b + .02 * p - J), X -= .09 * m * b;
				};
			}
			case `rhombille`: {
				let t = require_materials.proceduralMaterialPresets.rhombille, n = Math.sqrt(3) / 2, i = cachedNoise(64, 64, r ^ 27415), a = new Float64Array(t.columns * t.rows * 3);
				for (let e = 0; e < t.rows; e++) for (let n = 0; n < t.columns; n++) for (let i = 0; i < 3; i++) a[(e * t.columns + n) * 3 + i] = t.shades[i] + .04 * (hash(n, e, r ^ i * 40503) - .5);
				let band = (e) => smooth(clamp((e - t.grout) / t.shoulder)) * smooth(clamp((.5 - t.grout - e) / t.shoulder));
				return () => {
					let e = W * t.columns, r = G * t.rows * n, o = Math.floor(r / n), s = 1 / 0, c = 0, l = 0, u = 0, d = 0;
					for (let i = -1; i <= 1; i++) {
						let a = o + i, f = (a % 2 + 2) % 2 * .5, p = Math.round(e - f);
						for (let i = -1; i <= 1; i++) {
							let o = p + i, m = e - o - f, h = r - a * n, g = m * m + h * h;
							g < s && (s = g, c = m, l = h, u = (o % t.columns + t.columns) % t.columns, d = (a % t.rows + t.rows) % t.rows);
						}
					}
					let f = .5 * c + n * l, p = -.5 * c + n * l, m = band(c) * band(f), h = band(-f) * band(-p), g = band(-c) * band(p), _ = m + h + g, v = (d * t.columns + u) * 3, y = i(W, G);
					J = .04 + m * a[v] + h * a[v + 1] + g * a[v + 2] + .02 * y * _, Y = (.65 + .005 * y) * _, X += .4 * (1 - _) + .01 * y * _, Z = .45 + .55 * _, Q = 1 - _;
				};
			}
			case `oakleaf`: {
				let t = require_materials.proceduralMaterialPresets.oakleaf, i = cachedNoise(96, 96, r ^ 39985), a = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 3, s = n * hash(i, e, r ^ 32067);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s), a[o + 2] = hash(i, e, r ^ 23081);
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 3, s = fract(e) - .5, c = fract(r) - .5, l = s * a[o] + c * a[o + 1], u = c * a[o] - s * a[o + 1], d = u / t.length, f = t.width * (.72 + .28 * Math.cos(3 * Math.PI * d)), p = clamp(1 - d * d - (l / f) ** 2), m = smooth(clamp(p / .18)), h = smooth(clamp((1 - (l / .012) ** 2 - ((u + .405) / .065) ** 2) / .35)), g = 1 - (1 - m) * (1 - h), _ = smooth(clamp(1 - (l / .014) ** 2)), v = m * (_ + .45 * (.5 + .5 * Math.cos(n * (3 * d - .75 * Math.sqrt((l / t.width) ** 2 + 4e-4)))) ** 16 * (1 - _)), y = i(W, G);
					J = .06 + g * (.48 + .18 * a[o + 2] + .12 * v + .03 * y), Y = .08 + .28 * g + .1 * m * p * p + .06 * v, X = .86 + g * (t.roughness - .86 + .02 * y - .03 * v), Z = .55 + .4 * g;
				};
			}
			case `moire`: {
				let t = require_materials.proceduralMaterialPresets.moire, i = n * hash(0, 0, r ^ 27923), a = n * hash(0, 0, r ^ 35415), o = cachedNoise(96, 96, r ^ 15505);
				return () => {
					let e = t.bands * W + .9 * Math.sin(n * 3 * G + i) - .7 * Math.sin(n * 2 * G + a) + .2 * Math.sin(n * 2 * W), r = .5 + .5 * Math.cos(n * e), s = .5 + .5 * Math.cos(n * t.warpThreads * W), c = .5 + .5 * Math.cos(n * t.weftThreads * G), l = o(W, G);
					J = .2 + .55 * r + .025 * s + .01 * l, Y = .08 + .12 * s + .06 * c + .004 * l, X += -.19 * r + .015 * l + .01 * c, Z = .93 + .045 * (.7 * s + .3 * c);
				};
			}
			case `bamboocrosscut`: {
				let t = require_materials.proceduralMaterialPresets.bamboocrosscut, n = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let a = (e * t.cells + i) * 3, o = .4 + .055 * hash(i, e, r ^ 31281);
					n[a] = o, n[a + 1] = o * (.59 + .1 * hash(i, e, r ^ 46105)), n[a + 2] = hash(i, e, r ^ 23907);
				}
				let i = cachedNoise(96, 96, r ^ 14619), a = cachedNoise(64, 64, r ^ 35271);
				return () => {
					let e = W * t.cells, r = G * t.cells, o = (Math.floor(r) * t.cells + Math.floor(e)) * 3, s = n[o], c = n[o + 1], l = n[o + 2], u = Math.hypot(fract(e) - .5, fract(r) - .5), d = smooth(clamp((s - u) / t.edge)) * smooth(clamp((u - c) / t.edge)), f = smooth(clamp((u - s + t.rindWidth) / t.edge)), p = i(W, G), m = smooth(clamp((a(W, G) - .62) / .16)) * (1 - f);
					J = .025 + .01 * p + d * ((.78 + .1 * l - .1 * m) * (1 - f) + .18 * f), Y = d * (.7 + .015 * p - .05 * m), X += .03 * p - .24 * d * f, Z = .35 + .6 * d;
				};
			}
			case `mossypavers`: {
				let t = require_materials.proceduralMaterialPresets.mossypavers, n = cachedNoise(8, 8, r ^ 27705), i = cachedNoise(96, 96, r ^ 19991), a = cachedNoise(20, 20, r ^ 38307);
				return () => {
					let e = W * t.cells, o = G * t.cells, s = Math.floor(e), c = Math.floor(o), l = smooth(clamp((.5 - Math.abs(fract(e) - .5) - t.gap) / t.bevel)) * smooth(clamp((.5 - Math.abs(fract(o) - .5) - t.gap) / t.bevel)), u = i(W, G), d = smooth(clamp((u - .2) / .6)), f = smooth(clamp((n(W, G) - .35) / .3)), p = (1 - l) * f, m = hash(s, c, r ^ 8639);
					J = .08 + l * (.2 + .4 * m) + .65 * p * (.65 + .35 * d), Q = l * (.75 + .15 * m), Y = l * (.65 + .04 * a(W, G)) + p * (.16 + .1 * d) + .01 * u, X += .22 * (1 - l) + .07 * p + .02 * u, Z = .5 + .47 * l + .2 * p;
				};
			}
			case `gingham`: {
				let t = require_materials.proceduralMaterialPresets.gingham, i = cachedNoise(96, 96, r ^ 27953);
				return () => {
					let e = smooth(clamp((Math.cos(n * W * t.checks) + t.colorEdge) / (2 * t.colorEdge))), r = smooth(clamp((Math.cos(n * G * t.checks) + t.colorEdge) / (2 * t.colorEdge))), a = W * t.threads, o = G * t.threads, s = .5 + .5 * Math.cos(n * a), c = .5 + .5 * Math.cos(n * o), l = .5 + .5 * Math.cos(Math.PI * a) * Math.cos(Math.PI * o), u = s * (.35 + .25 * l) + c * (.35 + .25 * (1 - l)) - .3 * s * c, d = i(W, G);
					J = .1 + .8 * (e * l + r * (1 - l)) + .025 * d, Y = .12 + .22 * u + .01 * d, X += .025 * d + .02 * (1 - u), Z = .82 + .16 * u;
				};
			}
			case `gabion`: {
				let t = require_materials.proceduralMaterialPresets.gabion, i = cachedNoise(64, 64, r ^ 19569), a = new Float64Array(t.cells * t.cells * 7);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 7, s = n * hash(i, e, r ^ 6969), c = t.radiusMin + t.radiusRange * hash(i, e, r ^ 24359), l = .85 + .15 * hash(i, e, r ^ 32019);
					a[o] = .5 + t.jitter * (2 * hash(i, e, r ^ 10841) - 1), a[o + 1] = .5 + t.jitter * (2 * hash(i, e, r ^ 28227) - 1), a[o + 2] = Math.cos(s), a[o + 3] = Math.sin(s), a[o + 4] = 1 / (c * c), a[o + 5] = 1 / (l * l), a[o + 6] = hash(i, e, r ^ 15205);
				}
				return () => {
					let e = W * t.cells, n = G * t.cells, r = (Math.floor(n) * t.cells + Math.floor(e)) * 7, o = fract(e) - a[r], s = fract(n) - a[r + 1], c = o * a[r + 2] + s * a[r + 3], l = s * a[r + 2] - o * a[r + 3], u = Math.max(0, 1 - (c * c * a[r + 5] + l * l) * a[r + 4]), d = smooth(clamp(u / .3)), f = (fract(W * t.mesh + .5) - .5) / t.wireWidth, p = (fract(G * t.mesh + .5) - .5) / t.wireWidth, m = smooth(clamp(1 - f * f)), h = smooth(clamp(1 - p * p)), g = m + h - m * h, _ = i(W, G);
					J = .12 + d * (.2 + .4 * a[r + 6]) + .025 * _, Y = (.16 + .4 * u * u + .015 * _) * (1 - g) + .85 * g, X = (X + .02 * _) * (1 - g) + .3 * g, Z = (.55 + .38 * d) * (1 - g) + .98 * g, Q = g, $ = g;
				};
			}
			case `ashlar`: {
				let t = require_materials.proceduralMaterialPresets.ashlar, n = new Uint8Array(t.cells * t.cells), i = new Float64Array(t.stones.length), a = cachedNoise(64, 64, r ^ 12131), o = cachedNoise(12, 12, r ^ 31513);
				for (let e = 0; e < t.stones.length; e++) {
					let [a, o, s, c] = t.stones[e];
					i[e] = hash(e, 0, r ^ 23623);
					for (let r = o; r < o + c; r++) for (let i = a; i < a + s; i++) n[r * t.cells + i] = e;
				}
				return () => {
					let e = W * t.cells, r = G * t.cells, s = n[Math.floor(r) * t.cells + Math.floor(e)], c = t.stones[s], l = e - c[0], u = r - c[1], d = smooth(clamp((l - t.gap) / t.bevel)) * smooth(clamp((c[2] - l - t.gap) / t.bevel)) * smooth(clamp((u - t.gap) / t.bevel)) * smooth(clamp((c[3] - u - t.gap) / t.bevel)), f = a(W, G), p = o(W, G);
					J = .05 + d * (.28 + .35 * i[s] + .18 * p) + .025 * f, Y = d * (.62 + .08 * p + .015 * f), X += .16 * (1 - d) + .04 * f, Z = .58 + .4 * d;
				};
			}
			case `sashiko`: {
				let t = require_materials.proceduralMaterialPresets.sashiko, i = cachedNoise(64, 64, r ^ 31281), a = new Uint8Array(t.cells * 2);
				for (let e = 0; e < t.cells; e++) a[e] = hash(e, 0, r ^ 7539) < .5 ? 0 : 1, a[t.cells + e] = hash(e, 0, r ^ 20265) < .5 ? 0 : 1;
				let o = 1 / (t.stitchLength * t.stitchLength), s = 1 / (t.stitchWidth * t.stitchWidth);
				return () => {
					let e = W * t.cells, r = G * t.cells, c = Math.floor(r + .5) % t.cells, l = Math.floor(e + .5) % t.cells, u = fract(e) - .5, d = fract(r + .5) - .5, f = fract(e + .5) - .5, p = fract(r) - .5, m = Math.floor(e) % 2 === a[c] ? Math.max(0, 1 - u * u * o - d * d * s) : 0, h = Math.floor(r) % 2 === a[t.cells + l] ? Math.max(0, 1 - p * p * o - f * f * s) : 0, g = m * m + h * h, _ = .5 + .5 * Math.cos(n * W * t.threads), v = .5 + .5 * Math.cos(n * G * t.threads), y = .5 + .5 * Math.cos(Math.PI * W * t.threads) * Math.cos(Math.PI * G * t.threads), b = _ * (.35 + .25 * y) + v * (.35 + .25 * (1 - y)) - .3 * _ * v, x = i(W, G);
					J = .04 + .05 * b + .85 * g + .01 * x, Y = .08 + .1 * b + .6 * g + .005 * x, X += .03 * x - .08 * g, Z = .8 + .1 * b + .1 * g;
				};
			}
			case `pressedtin`: {
				let t = require_materials.proceduralMaterialPresets.pressedtin, n = cachedNoise(64, 64, r ^ 23097), i = 1 / (t.petalLength * t.petalLength), a = 1 / (t.petalWidth * t.petalWidth), o = 1 / (t.bossRadius * t.bossRadius);
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, s = smooth(clamp((t.frameOuter - Math.abs(e)) / t.frameEdge)) * smooth(clamp((t.frameOuter - Math.abs(r)) / t.frameEdge)) - smooth(clamp((t.frameInner - Math.abs(e)) / t.frameEdge)) * smooth(clamp((t.frameInner - Math.abs(r)) / t.frameEdge)), c = 0;
					for (let n = 0; n < 2; n++) {
						let o = n === 0 ? e : r, s = n === 0 ? r : e;
						for (let e = -1; e <= 1; e += 2) {
							let n = o - e * t.petalOffset, r = Math.max(0, 1 - n * n * i - s * s * a);
							c += r * r;
						}
					}
					let l = Math.max(0, 1 - (e * e + r * r) * o), u = l * l, d = n(W, G);
					J = .45 + .2 * s + .2 * c + .18 * u + .03 * d, Y = .2 + .12 * s + .35 * c + .3 * u + .005 * d, X += .05 * d - .07 * c - .06 * u - .04 * s, Z = .94 + .04 * u + .02 * c;
				};
			}
			case `ginkgoleaf`: {
				let t = require_materials.proceduralMaterialPresets.ginkgoleaf, i = cachedNoise(96, 96, r ^ 23577), a = new Float64Array(t.cells * t.cells * 3);
				for (let e = 0; e < t.cells; e++) for (let i = 0; i < t.cells; i++) {
					let o = (e * t.cells + i) * 3, s = n * hash(i, e, r ^ 11591);
					a[o] = Math.cos(s), a[o + 1] = Math.sin(s), a[o + 2] = hash(i, e, r ^ 27185);
				}
				return () => {
					let e = Math.floor(W * t.cells), n = (Math.floor(G * t.cells) * t.cells + e) * 3, r = fract(W * t.cells) - .5, o = fract(G * t.cells) - .5, s = r * a[n] + o * a[n + 1], c = o * a[n] - r * a[n + 1], l = Math.sqrt(s * s + c * c), u = Math.atan2(s, c), f = smooth(clamp((t.radius - t.notchDepth * Math.exp(-((u / t.notchWidth) ** 2)) - l) / t.edge)) * smooth(clamp((t.halfAngle - Math.abs(u)) / .12)) * smooth(clamp((l - .035) / .045)), p = smooth(clamp((1 - s * s / 4e-4 - (c + .05) ** 2 / .0121) / .3)), m = 1 - (1 - f) * (1 - p), h = smooth(clamp((l - .16) / .12)), g = (.5 + .5 * Math.cos(18 * u)) ** 8, _ = (.5 + .5 * Math.cos(36 * u)) ** 8, v = f * smooth(clamp((l - .08) / .08)) * (g * (1 - h) + _ * h), y = i(W, G);
					J = .06 + m * (.55 + .15 * a[n + 2] + .12 * v + .02 * y), Y = .08 + m * (.3 + .06 * v), X = .85 + m * (t.roughness - .85 + .02 * y - .04 * v), Z = .6 + .35 * m;
				};
			}
			case `chevronparquet`: {
				let t = require_materials.proceduralMaterialPresets.chevronparquet, i = cachedNoise(64, 64, r ^ 27441), a = new Float64Array(2 * t.rows);
				for (let e = 0; e < 2; e++) for (let n = 0; n < t.rows; n++) a[e * t.rows + n] = hash(e, n, r ^ 19751);
				return () => {
					let e = Math.floor(2 * W), r = fract(2 * W), o = e === 0 ? 1 : -1, s = t.rows * (G + (e === 0 ? W : 1 - W)), c = fract(s), l = Math.floor(s) % t.rows, u = smooth(clamp((Math.min(r, 1 - r) - t.endGap) / (t.endBevel - t.endGap))) * smooth(clamp((Math.min(c, 1 - c) - t.sideGap) / (t.sideBevel - t.sideGap))), d = a[e * t.rows + l], f = .5 + .5 * Math.sin(n * (t.grainBands * s + .15 * Math.sin(n * 2 * (W - o * G)) + d)), p = i(W, G);
					J = .08 + u * (.3 + .2 * d + .22 * f + .03 * p), Y = u * (.6 + .01 * f), X = .84 + u * (t.roughness - .84 + .04 * f), Z = .5 + .48 * u;
				};
			}
			case `argyle`: {
				let t = require_materials.proceduralMaterialPresets.argyle, i = cachedNoise(96, 96, r ^ 15959);
				return () => {
					let e = Math.PI * t.diamonds * (W + G), r = Math.PI * t.diamonds * (W - G), a = 2 * smooth(clamp(.5 + Math.sin(e) / t.colorEdge)) - 1, o = 2 * smooth(clamp(.5 + Math.sin(r) / t.colorEdge)) - 1, s = .5 + .5 * a * o, c = smooth(clamp((t.lineOuter - Math.abs(Math.cos(e))) / (t.lineOuter - t.lineInner))), l = smooth(clamp((t.lineOuter - Math.abs(Math.cos(r))) / (t.lineOuter - t.lineInner))), u = 1 - (1 - c) * (1 - l), d = .5 + .5 * Math.cos(n * t.threads * W), f = .5 + .5 * Math.cos(n * t.threads * G), p = .5 + .5 * Math.cos(Math.PI * t.threads * (W + G)), m = d * p + f * (1 - p), h = i(W, G);
					J = (.12 + .5 * s) * (1 - u) + .92 * u + .035 * m + .02 * h, Y = .24 + .16 * m + .02 * h, X += .03 * h + .025 * (1 - m), Z = .88 + .1 * m;
				};
			}
			case `perforatedleather`: {
				let t = require_materials.proceduralMaterialPresets.perforatedleather, n = cachedNoise(64, 64, r ^ 19991), i = cachedNoise(128, 128, r ^ 11107), a = t.outerRadius * t.outerRadius, o = a - t.coreRadius * t.coreRadius;
				return () => {
					let e = Math.floor(G * t.cells), r = fract(W * t.cells - e % 2 * .5) - .5, s = fract(G * t.cells) - .5, c = smooth(clamp((a - r * r - s * s) / o)), l = 1 - c, u = .7 * n(W, G) + .3 * i(W, G);
					J = (.55 + .12 * u) * l + .025 * c, Y = (.6 + .035 * u) * l + .08 * c, X += .03 * u * l + .46 * c, Z = .98 - .75 * c;
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
					let e = Math.floor(W * t.cells), n = (Math.floor(G * t.cells) * t.cells + e) * a, r = fract(W * t.cells) - o[n], s = fract(G * t.cells) - o[n + 1], c = o[n + 2] === 0 ? 0 : 1;
					for (let e = 0; e < t.edges && c > 0; e++) {
						let i = n + 3 + e * 3, a = o[i + 2] - r * o[i] - s * o[i + 1];
						c *= smooth(clamp(a / t.edge));
					}
					let l = 1 - c, u = i(W, G);
					J = .12 + .74 * l + .03 * u, Y = .15 + .5 * l + .005 * u, $ = c, X += .5 * c + .04 * u * c, Z = 1 - .12 * c - .48 * c * l;
				};
			}
			case `linen`: {
				let t = require_materials.proceduralMaterialPresets.linen, i = cachedNoise(t.threads, 4, r ^ 15385), o = cachedNoise(t.threads, 4, r ^ 27459);
				return () => {
					let e = W * t.threads, r = G * t.threads, s = Math.floor(e + .5) % t.threads, c = Math.floor(r + .5) % t.threads, l = i(s / t.threads, G), u = o(c / t.threads, W), d = (fract(e + .5) - .5) / (t.halfWidth + t.slubWidth * l), f = (fract(r + .5) - .5) / (t.halfWidth + t.slubWidth * u), p = smooth(clamp(1 - d * d)), m = smooth(clamp(1 - f * f)), h = .5 + .5 * Math.cos(Math.PI * e) * Math.cos(Math.PI * r), g = p * (1 - m + m * h), _ = m * (1 - p + p * (1 - h)), v = g + _, y = p * m, b = g * l + _ * u, x = g * (.5 + .5 * Math.sin(n * 96 * W + a)) + _ * (.5 + .5 * Math.sin(n * 96 * G + a));
					J = .15 + .55 * v + .08 * x + .08 * b, Y = .12 + .5 * v + .18 * y + .06 * b + .03 * x, X -= .03 * v, Z = .62 + .37 * v;
				};
			}
			case `rhyolite`:
			case `porphyry`: {
				let i = require_materials.proceduralMaterialPresets[t], a = require_materials.proceduralMaterialPresets.rhyolite, o = t === `rhyolite` ? cachedNoise(3, 3, r ^ 114449) : void 0, s = o ? a.bandRadius * a.bandRadius : 0, c = o ? 1 / (s - a.bandCore * a.bandCore) : 0, l = cachedNoise(96, 96, r ^ 27681), u = new Float64Array(i.cells * i.cells * 6);
				for (let e = 0; e < i.cells; e++) for (let t = 0; t < i.cells; t++) {
					let a = (e * i.cells + t) * 6, o = n * hash(t, e, r ^ 15193);
					u[a] = .35 + .3 * hash(t, e, r ^ 24083), u[a + 1] = .35 + .3 * hash(t, e, r ^ 31281), u[a + 2] = Math.cos(o), u[a + 3] = Math.sin(o), u[a + 4] = hash(t, e, r ^ 11591) < i.crystalChance ? i.halfLengthMin + i.halfLengthRange * hash(t, e, r ^ 20249) : 0, u[a + 5] = i.halfWidthMin + i.halfWidthRange * hash(t, e, r ^ 7267);
				}
				return () => {
					let e = Math.floor(W * i.cells), t = (Math.floor(G * i.cells) * i.cells + e) * 6, n = fract(W * i.cells) - u[t], r = fract(G * i.cells) - u[t + 1], d = n * u[t + 2] + r * u[t + 3], f = -n * u[t + 3] + r * u[t + 2], p = smooth(clamp((u[t + 4] - Math.abs(d)) / i.edge)) * smooth(clamp((u[t + 5] - Math.abs(f)) / i.edge)), m = l(W, G);
					if (o) {
						let e = G * a.bands + a.bandWarp * o(W, G), t = e - Math.floor(e + .5);
						J = .16 + .24 * smooth(clamp((s - t * t) * c)) + .08 * m, J += p * (.8 - J);
					} else J = .24 + .12 * m + p * (.55 - .06 * m);
					Y = .4 + .015 * m, X += .08 * m - .22 * p, Z = 1 - .02 * m;
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
					let e = Math.floor(W * t.cells), r = (Math.floor(G * t.cells) * t.cells + e) * 3, o = fract(W * t.cells) - a[r], s = fract(G * t.cells) - a[r + 1], c = a[r + 2], l = c === 0 ? 0 : smooth(clamp(1 - (o * o + s * s) * c)), u = .7 * n(W, G) + .3 * i(W, G);
					J = .45 + .3 * u - .2 * l, Y = .4 + .14 * u - .3 * l, X += .12 * u + .12 * l, Z = 1 - .45 * l;
				};
			}
			case `windmillpavers`: {
				let t = require_materials.proceduralMaterialPresets.windmillpavers, n = cachedNoise(64, 64, r ^ 14935), i = new Float64Array(t.cells * t.cells * 5);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) for (let a = 0; a < 5; a++) i[(e * t.cells + n) * 5 + a] = hash(n * 5 + a, e, r ^ 24083);
				return () => {
					let e = Math.floor(W * t.cells), r = Math.floor(G * t.cells), a = fract(W * t.cells) * 3, o = fract(G * t.cells) * 3, s = 1, c = 1, l = 1, u = 1, d = 4;
					o < 1 && a < 2 ? (s = 0, c = 0, l = 2, d = 0) : a >= 2 && o < 2 ? (s = 2, c = 0, u = 2, d = 1) : o >= 2 && a >= 1 ? (s = 1, c = 2, l = 2, d = 2) : a < 1 && o >= 1 && (s = 0, c = 1, u = 2, d = 3);
					let f = a - s, p = o - c, m = smooth(clamp((Math.min(f, l - f) - t.grout) / t.shoulder)) * smooth(clamp((Math.min(p, u - p) - t.grout) / t.shoulder)), h = n(W, G), g = i[(r * t.cells + e) * 5 + d];
					J = .08 + m * ((d === 4 ? .1 : .5) + .15 * g + .08 * h), Y = m * (.7 + .008 * h), X += m * (.03 * h - .04), Z = .45 + .55 * m, Q = 1 - m;
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
					let e = Math.floor(W * t.cells), r = (Math.floor(G * t.cells) * t.cells + e) * 2, c = fract(W * t.cells) - o[r], l = fract(G * t.cells) - o[r + 1], u = smooth(clamp(1 - (c * c + l * l) * s)), d = n * (G * t.layers + .35 * Math.sin(n * W + a) + t.foldStrength * u), f = smooth(.5 + .5 * Math.sin(d)), p = i(W, G);
					J = .2 + .65 * f + .03 * p, Y = .3 + .1 * f + .003 * p, X += .28 * (1 - f) + .02 * p, Z = .96 + .04 * f;
				};
			}
			case `standingseam`: {
				let t = require_materials.proceduralMaterialPresets.standingseam, n = cachedNoise(64, 4, r ^ 16007);
				return () => {
					let e = Math.abs(fract(W * t.panels + .5) - .5), r = 1 - smooth(clamp((e - t.capHalfWidth) / t.shoulder)), i = (e - t.toeOffset) / t.toeWidth, a = smooth(clamp(1 - i * i)), o = n(W, G);
					J = .5 + .1 * o + .1 * r - .1 * a, Y = .15 + .72 * r - .07 * a + .003 * o, X += .05 * o - .06 * r, Z = 1 - .18 * a;
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
					let e = Math.floor(W * t.cells), r = Math.floor(G * t.cells), a = fract(W * t.cells), o = fract(G * t.cells), s = smooth(clamp((Math.min(a, 1 - a) - t.grout) / t.shoulder)) * smooth(clamp((Math.min(o, 1 - o) - t.grout) / t.shoulder)), c = i[r * t.cells + e] ? 1 - o : o, l = arc(a, c) + arc(1 - a, 1 - c), u = n(W, G);
					J = .3 + s * (.62 - .83 * l + .025 * u), Y = (.65 + .003 * u) * s, X += .32 * (1 - s) + .015 * u * s, Z = .5 + .5 * s, Q = 1 - s;
				};
			}
			case `octagondot`: {
				let t = require_materials.proceduralMaterialPresets.octagondot, n = cachedNoise(32, 32, r ^ 31971), i = t.dotRadius * t.dotRadius;
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, a = smooth(clamp((.5 - Math.abs(e) - t.grout) / t.shoulder)) * smooth(clamp((.5 - Math.abs(r) - t.grout) / t.shoulder)) * smooth(clamp((t.clippedCorner - Math.abs(e + r)) / t.shoulder)) * smooth(clamp((t.clippedCorner - Math.abs(e - r)) / t.shoulder)), o = fract(W * t.cells + .5) - .5, s = fract(G * t.cells + .5) - .5, c = smooth(clamp((i - (o + s) ** 2) / t.dotShoulder)) * smooth(clamp((i - (o - s) ** 2) / t.dotShoulder)), l = n(W, G), u = a + c;
					J = .2 + (.72 + .04 * l) * a - (.13 - .02 * l) * c, Y = (.65 + .005 * l) * u, X += .35 * (1 - u) + .015 * l * u, Z = .45 + .55 * u, Q = 1 - u;
				};
			}
			case `ripstop`: {
				let t = require_materials.proceduralMaterialPresets.ripstop, i = cachedNoise(32, 32, r ^ 29161), ridge = (e) => {
					let n = (fract(e + .5) - .5) / t.reinforcementWidth;
					return smooth(clamp(1 - n * n));
				};
				return () => {
					let e = W * t.threads, r = G * t.threads, a = .5 + .5 * Math.cos(n * e), o = .5 + .5 * Math.cos(n * r), s = .5 + .5 * Math.cos(Math.PI * e) * Math.cos(Math.PI * r), c = a * (.35 + .25 * s) + o * (.35 + .25 * (1 - s)) - .3 * a * o, l = ridge(W * t.cells - t.reinforcementOffset) + ridge(W * t.cells + t.reinforcementOffset), u = ridge(G * t.cells - t.reinforcementOffset) + ridge(G * t.cells + t.reinforcementOffset), d = l + u - l * u, f = i(W, G);
					J = .28 + .2 * c + .25 * d + .06 * f, Y = .1 + .24 * c + .38 * d + .015 * f, X += .06 * d + .03 * f, Z = .8 + .16 * c + .04 * d;
				};
			}
			case `basketweavepavers`: {
				let t = require_materials.proceduralMaterialPresets.basketweavepavers, n = cachedNoise(64, 64, r ^ 27219), i = new Float64Array(t.cells * t.cells * 2);
				for (let e = 0; e < t.cells; e++) for (let n = 0; n < t.cells; n++) for (let a = 0; a < 2; a++) i[(e * t.cells + n) * 2 + a] = hash(n * 2 + a, e, r ^ 17323);
				return () => {
					let e = Math.floor(W * t.cells), r = Math.floor(G * t.cells), a = fract(W * t.cells), o = fract(G * t.cells), s = (e + r) % 2 != 0, c = s ? o : a, l = s ? a : o, u = Math.floor(l * 2), d = l - u * .5, f = smooth(clamp((Math.min(c, 1 - c) - t.grout) / t.shoulder)) * smooth(clamp((Math.min(d, .5 - d) - t.grout) / t.shoulder)), p = n(W, G);
					J = .3 + f * (.25 + .2 * i[(r * t.cells + e) * 2 + u] + .08 * p), Y = f * (.65 + .025 * p), X += f * (.05 * p - .03), Z = .45 + .55 * f, Q = 1 - f;
				};
			}
			case `breezeblock`: {
				let t = require_materials.proceduralMaterialPresets.breezeblock, n = cachedNoise(64, 64, r ^ 15221), i = t.lobeRadius * t.lobeRadius, lobe = (e, n) => smooth(clamp((i - e * e - n * n) / t.lobeShoulder));
				return () => {
					let e = fract(W * t.cells) - .5, r = fract(G * t.cells) - .5, i = smooth(clamp((.5 - Math.abs(e) - t.grout) / t.edgeShoulder)) * smooth(clamp((.5 - Math.abs(r) - t.grout) / t.edgeShoulder)), a = i * (1 - (1 - (1 - lobe(e - t.lobeOffset, r)) * (1 - lobe(e + t.lobeOffset, r)) * (1 - lobe(e, r - t.lobeOffset)) * (1 - lobe(e, r + t.lobeOffset)))), o = n(W, G);
					J = .04 + a * (.58 + .18 * o), Y = .06 + a * (.74 + .02 * o), X += .08 * o * a, Z = .22 + .76 * a, Q = 1 - i;
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
					let e = W * t.cells, r = G * t.cells, s = (Math.floor(r) * t.cells + Math.floor(e)) * 2, c = fract(e) - i[s], l = fract(r) - i[s + 1], u = (c / t.radiusX) ** 2 + (l / t.radiusY) ** 2, d = smooth(clamp(1 - u)), f = smooth(clamp(1 - u / .06)), p = d > 0 ? d * (.5 + .5 * Math.cos(n * 2 * u)) : 0, m = Math.sin(n * 2 * G), h = Math.sin(n * (24 * W + .35 * m + .7 * c * d) + a), g = Math.cos(n * (64 * W + .16 * m) + a);
					J = .67 + .12 * h - .34 * f - .12 * p, Y = .45 + .012 * h - .015 * f + .005 * g, X += .025 * f + .03 * o(W, G), Z = .98 - .04 * f;
				};
			}
			case `copperpatina`: {
				let t = require_materials.proceduralMaterialPresets.copperpatina, n = cachedNoise(4, 4, r ^ 31379), i = cachedNoise(20, 20, r ^ 11367), a = cachedNoise(96, 96, r ^ 23009);
				return () => {
					let e = n(W, G), r = i(W, G), o = a(W, G), s = smooth(clamp((.78 * e + .22 * r - t.coverageStart) / t.coverageRange));
					J = .05 + .9 * s + .03 * o, $ = 1 - s, Y = .25 + .28 * s + .06 * o + .1 * r * s, X += .53 * s + .05 * o, Z = .98 - .15 * (1 - r) * s;
				};
			}
			case `rammedearth`: {
				let t = require_materials.proceduralMaterialPresets.rammedearth, i = new Float64Array(t.layers);
				for (let e = 0; e < t.layers; e++) i[e] = .22 + e % 2 * .46 + .14 * hash(e, 0, r ^ 20081);
				let o = cachedNoise(96, 96, r ^ 11865), s = cachedNoise(32, 48, r ^ 30027);
				return () => {
					let e = t.warp * Math.sin(n * W + a) + t.fineWarp * Math.sin(n * 3 * W - a), r = fract(G + e / t.layers) * t.layers, c = Math.floor(r), l = fract(r), u = smooth(clamp((l - .5 + t.transition) / (2 * t.transition))), d = i[c] + (i[(c + 1) % t.layers] - i[c]) * u, f = smooth(clamp(1 - ((l - .5) / t.seamWidth) ** 2)), p = o(W, G), m = smooth(clamp((.38 - s(W, G)) / .25));
					J = .14 + .62 * d + .13 * p - .12 * f - .1 * m, Y = .42 + .18 * p - .1 * f - .12 * m, X += .07 * p - .05 * f, Z = .97 - .12 * f - .22 * m;
				};
			}
			case `canewebbing`: {
				let t = require_materials.proceduralMaterialPresets.canewebbing, i = cachedNoise(16, 16, r ^ 25027), ribbon = (e, t) => {
					return smooth(clamp(1 - ((fract(e + .5) - .5) / t) ** 2));
				};
				return () => {
					let e = W * t.cells, r = G * t.cells, o = ribbon(e, t.ribbonWidth), s = ribbon(r, t.ribbonWidth), c = .5 + .5 * Math.cos(Math.PI * e) * Math.cos(Math.PI * r), l = o * (1 - s + s * c), u = s * (1 - o + o * (1 - c)), d = ribbon(e + r - .5, t.diagonalWidth), f = ribbon(e - r - .5, t.diagonalWidth), p = d + f - d * f, m = (l + u) * (1 - p) + p, h = i(W, G), g = (l * Math.cos(n * 3 * e + a) + u * Math.cos(n * 3 * r + a)) * (1 - p) + .5 * p * (Math.cos(n * 3 * (e + r) + a) + Math.cos(n * 3 * (e - r) + a));
					J = .04 + m * (.6 + .1 * h) + .035 * g, Y = .06 + (l * (.63 + .04 * c) + u * (.63 + .04 * (1 - c))) * (1 - p) + .72 * p + m * .01 * h + .003 * g, X += .3 * (1 - m) + .04 * h * m - .025 * g, Z = .22 + .77 * m;
				};
			}
			case `subwaytiles`: {
				let t = require_materials.proceduralMaterialPresets.subwaytiles, n = new Float64Array(t.columns * t.rows);
				for (let e = 0; e < t.rows; e++) for (let i = 0; i < t.columns; i++) n[e * t.columns + i] = hash(i, e, r ^ 31513);
				return () => {
					let e = Math.floor(G * t.rows), r = W * t.columns + e % 2 * .5, i = fract(r), a = t.columns / t.rows, o = fract(G * t.rows) * a, s = smooth(clamp((i - t.grout) / t.shoulder)) * smooth(clamp((1 - i - t.grout) / t.shoulder)) * smooth(clamp((o - t.grout) / t.shoulder)) * smooth(clamp((a - o - t.grout) / t.shoulder)), c = t.grout + t.shoulder, l = smooth(clamp((i - c) / t.bevel)) * smooth(clamp((1 - i - c) / t.bevel)) * smooth(clamp((o - c) / t.bevel)) * smooth(clamp((a - o - c) / t.bevel));
					J = .4 + s * (.2 + .24 * n[e * t.columns + Math.floor(r) % t.columns]), Y = .08 + s * (.32 + .48 * l), Q = 1 - s, X += .6 * Q + .05 * s * (1 - l), Z = .62 + .38 * s;
				};
			}
			case `flutedwood`: {
				let t = require_materials.proceduralMaterialPresets.flutedwood, i = cachedNoise(64, 4, r ^ 18353);
				return () => {
					let r = smooth(clamp(1 - ((fract(W * t.slats) - .5) / t.halfWidth) ** 2)), o = i(W + .008 * Math.sin(n * 2 * G + a), G), s = .5 + .5 * Math.cos(n * (96 * W + .24 * Math.sin(n * 2 * G)) + a);
					J = .08 + r * (.43 + .28 * o + .045 * s), Y = .08 + r * (.71 + .018 * o + .006 * s), X += .26 * (1 - r) + .055 * o * r, Z = .52 + .47 * r;
				};
			}
			case `tatami`: return () => {
				let t = require_materials.proceduralMaterialPresets.tatami, i = .5 + .5 * Math.cos(n * t.reeds * W), o = smooth(clamp(1 - ((fract(G * t.bindings + .5) - .5) / t.bindingWidth) ** 2)), s = .5 + .5 * Math.cos(n * (t.reeds / 2) * W), c = noise(W, G, t.reeds, 4, r ^ 12631), l = .5 + .5 * Math.cos(n * t.reeds * 3 * W + .12 * Math.sin(n * 4 * G));
				J = .31 + .26 * i + .18 * c - .14 * o, Y = .16 + .4 * i + .016 * l * i + .015 * K + o * (.24 * s - .1 * (1 - s)), X += .035 * c - .045 * o * s, Z = .72 + .26 * i - .06 * o * (1 - s);
			};
			case `pineapple`: return () => {
				let t = require_materials.proceduralMaterialPresets.pineapple, n = fract(W + G) * t.cells, r = fract(G - W) * t.cells, a = Math.floor(n), o = Math.floor(r), s = n - a - .5, c = r - o - .5, l = m(W, G), u = v[o * t.cells + a], d = smooth(clamp((.5 - s) / t.shoulder)) * smooth(clamp((.5 + s) / t.shoulder)) * smooth(clamp((.5 - c) / t.shoulder)) * smooth(clamp((.5 + c) / t.shoulder)), f = (s * s + c * c) / (t.eyeRadius * t.eyeRadius), p = 1 - smooth(clamp(f)), h = smooth(clamp(f)) * (1 - smooth(clamp((f - 1) / 3)));
				Y = .14 + d * (.34 + .13 * h - .22 * p + .05 * u + .005 * l), J = .1 + d * (.49 + .12 * u + .045 * l - .2 * p), Z = .55 + d * (.42 - .2 * p), X = i.roughness + .04 * (1 - d) - .025 * h * d;
			};
			case `strawberry`:
			case `lychee`: return () => {
				let n = W * h, r = G * g, a = Math.floor(n), o = Math.floor(r), s = m(W, G), c = 0, l = 0, u = 0, d = 0;
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
				t === `strawberry` ? (Y = .62 + .004 * s - .3 * c + .09 * l, J = .12 + .012 * s + .78 * l, Z = 1 - .32 * c + .12 * l, X = i.roughness + .04 * c - .06 * l) : (Y = .16 + .28 * u + .15 * d + .004 * s, J = .12 + .55 * u + .08 * d + .012 * s, Z = .55 + .42 * u, X = i.roughness + .04 * (1 - u) - .03 * d);
			};
			case `sandpaper`: return () => {
				let e = Math.floor(G * 12), t = (e & 1) * .5, n = (Math.floor(W * 10 + t) % 10 + 10) % 10, i = (e % 12 + 12) % 12, a = fract(W * 10 + t) - .5, o = fract(G * 12) - .5, s = Math.hypot(a, o), c = .38 + .1 * hash(n, i, r ^ 12058), l = smooth(clamp((c - s) / (c * .55))), u = smooth(clamp((noise(W, G, 6, 6, r ^ 30659) - .72) / .18)) * (1 - l), d = noise(W, G, 48, 48, r ^ 21921);
				J = .4 + .3 * l - .14 * u + .08 * d, Y = .3 + .34 * l - .12 * u, X += .06 * (d - .5) + .04 * (1 - l), Z = 1 - .44 * (1 - l) - .12 * u;
			};
			case `steelwool`: return () => {
				let e = Math.sin(Math.PI * (fract(3 * (W + G)) - .5)), t = Math.sin(Math.PI * (fract(3 * (W - G)) - .5)), n = Math.sin(Math.PI * (fract(2 * W + G) - .5)), i = smooth(clamp((.22 - Math.abs(e)) / .14)), a = smooth(clamp((.22 - Math.abs(t)) / .14)), o = smooth(clamp((.22 - Math.abs(n)) / .14)), s = (Math.floor(3 * (W + G)) % 3 + 3) % 3, c = (Math.floor(3 * (W - G)) % 3 + 3) % 3, l = i * (.85 + .15 * hash(s, 0, r ^ 7505)), u = a * (.85 + .15 * hash(c, 1, r ^ 19499)), d = o * .92, f = 1 - (1 - l) * (1 - u) * (1 - d), p = 1 - (1 - l * u) * (1 - u * d) * (1 - d * l), m = noise(W, G, 32, 32, r ^ 11783);
				J = .44 + .34 * f + .1 * p + .08 * m, Y = .3 + .3 * f + .08 * p, X += .1 * (m - .5) + .08 * (1 - f), Z = 1 - .44 * (1 - f);
			};
			case `wirebrush`: return () => {
				let e = W * 24 + .3 * Math.sin(n * G), t = (Math.floor(e) % 24 + 24) % 24, i = fract(e) - .5, a = smooth(clamp((.32 - Math.abs(i)) / .12)), o = .85 + .15 * hash(t, 0, r ^ 15473), s = .9 + .1 * Math.sin(n * (2 * G + hash(t, 1, r ^ 25042))), c = noise(W, G, 32, 32, r ^ 6959);
				J = .38 + .3 * a * o * s + .08 * c, Y = .3 + .44 * a * o * s, X += .1 * (c - .5) - .06 * a, Z = 1 - .44 * (1 - a);
			};
			case `cheesegrater`: return () => {
				let e = Math.floor(W * 6), t = Math.floor(G * 8), n = (e % 6 + 6) % 6, i = (t % 8 + 8) % 8, a = fract(W * 6) - .5, o = fract(G * 8) - .5, s = Math.hypot(a, o), c = smooth(clamp((.22 - s) / .1)), l = smooth(clamp((s - .22) / .06)) * smooth(clamp((.42 - s) / .08)), u = .85 + .15 * hash(n, i, r ^ 23585), d = (1 - l) * (1 - c), f = noise(W, G, 32, 32, r ^ 14967);
				J = .44 + .26 * l - .3 * c + .08 * f, Y = .3 + .24 * l * u - .26 * c, X += .08 * (f - .5) - .06 * l + .1 * c, Z = 1 - .44 * c - .12 * d;
			};
			case `ovenrack`: return () => {
				let e = fract(G * 8) - .5, t = fract(W * 4) - .5, n = smooth(clamp((.3 - Math.abs(e)) / .12)), i = smooth(clamp((.16 - Math.abs(t)) / .08)), a = .85 + .15 * hash((Math.floor(G * 8) % 8 + 8) % 8, 0, r ^ 11085), o = noise(W, G, 24, 24, r ^ 28179);
				J = .4 + .28 * n + .16 * i + .05 * n * i + .08 * o, Y = .3 + .36 * n * a + .16 * i + .06 * n * i, X += .08 * (o - .5) - .08 * n, Z = 1 - .44 * (1 - n) * (1 - i) - .12 * (1 - n) * i;
			};
			case `muffintin`: return () => {
				let e = Math.floor(W * 4), t = Math.floor(G * 4), n = (e % 4 + 4) % 4, i = (t % 4 + 4) % 4, a = fract(W * 4) - .5, o = fract(G * 4) - .5, s = Math.hypot(a, o), c = smooth(clamp((.34 - s) / .12)), l = smooth(clamp((s - .32) / .06)) * smooth(clamp((.48 - s) / .06)), u = .85 + .15 * hash(n, i, r ^ 29109), d = noise(W, G, 24, 24, r ^ 8074);
				J = .42 + .24 * l - .28 * c + .08 * d, Y = .3 + .2 * l * u - .28 * c, X += .08 * (d - .5) - .05 * l + .08 * c, Z = 1 - .44 * c - .12 * (1 - l) * (1 - c);
			};
			case `gauze`: return () => {
				let e = fract(W * 12) - .5, t = fract(G * 12) - .5, n = smooth(clamp((.26 - Math.abs(t)) / .14)), i = smooth(clamp((.26 - Math.abs(e)) / .14)), a = Math.cos(Math.PI * 12 * (W + G)), o = n * (.72 + .28 * a), s = i * (.72 - .28 * a), c = 1 - (1 - o) * (1 - s), l = noise(W, G, 32, 32, r ^ 19737);
				J = .7 + .16 * c + .05 * (o - s) + .06 * l, Y = .3 + .26 * c + .05 * (o - s), X += .08 * (l - .5), Z = 1 - .44 * (1 - c);
			};
			case `elasticbandage`: return () => {
				let e = fract(4 * (W - G)) - .5, t = smooth(clamp((.3 - Math.abs(e)) / .12)), n = smooth(clamp((.16 - Math.abs(Math.sin(Math.PI * fract(2 * (W + G))))) / .1)), i = .85 + .15 * hash((Math.floor(4 * (W - G)) % 4 + 4) % 4, 0, r ^ 7239), a = noise(W, G, 28, 28, r ^ 21931);
				J = .52 + .3 * t * i + .08 * a - .18 * n, Y = .3 + .26 * t * i - .16 * n, X += .08 * (a - .5) - .06 * t, Z = 1 - .44 * n;
			};
			case `icepack`: return () => {
				let e = Math.floor(W * 4), t = Math.floor(G * 4), n = (e % 4 + 4) % 4, i = (t % 4 + 4) % 4, a = fract(W * 4) - .5, o = fract(G * 4) - .5, c = smooth(clamp((.42 - (Math.abs(a) ** 4 + Math.abs(o) ** 4) ** .25) / .12)), l = .85 + .15 * hash(n, i, r ^ 27452), u = noise(W, G, 24, 24, r ^ 12161);
				J = .42 + .34 * c * l + .08 * u - .12 * (1 - c), Y = .3 + .24 * c * l - .16 * (1 - c), X += .08 * (u - .5) - .05 * c, Z = 1 - .44 * (1 - c);
			};
			case `bubblewrap`: return () => {
				let e = Math.floor(W * 12), t = Math.floor(G * 12), n = (e % 12 + 12) % 12, i = (t % 12 + 12) % 12, a = fract(W * 12) - .5, o = fract(G * 12) - .5, s = (a * a + o * o) / (.42 * .42), c = s < 1 ? (1 - s) * (1 - s) : 0, l = .9 + .1 * hash(n, i, r ^ 15393), u = noise(W, G, 36, 36, r ^ 30634);
				J = .55 + .3 * c * l + .06 * (u - .5), Y = .26 + .36 * c * l, X += .08 * (u - .5) - .12 * c, Z = 1 - .42 * (1 - c);
			};
			case `sequin`: return () => {
				let e = (Math.floor(G * 10) % 10 + 10) % 10, t = .5 * (e & 1), n = W * 10 + t, i = (Math.floor(n) % 10 + 10) % 10, a = fract(n) - .5, o = fract(G * 10) - .5, c = smooth(clamp((1 - (a * a + o * o) / (.34 * .34)) / .22)), l = (a * a + o * o) / (.1 * .1), u = l < 1 ? (1 - l) * (1 - l) : 0, d = .9 + .1 * hash(i, e, r ^ 20946), f = hash(i, e, r ^ 2577) - .5, p = hash(i, e, r ^ 2850) - .5, m = noise(W, G, 30, 30, r ^ 27678), h = c * (f * a + p * o);
				J = .46 + .34 * c * d + .16 * h - .26 * u + .06 * (m - .5), Y = .24 + .32 * c * d + .2 * h - .24 * u, X += .08 * (m - .5) - .1 * c, Z = 1 - .44 * (1 - c) - .14 * u;
			};
			case `pennyround`: return () => {
				let e = (Math.floor(G * 8) % 8 + 8) % 8, t = .5 * (e & 1), n = W * 8 + t, i = (Math.floor(n) % 8 + 8) % 8, a = fract(n) - .5, o = fract(G * 8) - .5, c = smooth(clamp((1 - (a * a + o * o) / .2116) / .22)), l = .9 + .1 * hash(i, e, r ^ 10932), u = noise(W, G, 40, 40, r ^ 30705);
				J = .56 + .26 * c * l + .06 * (u - .5) - .14 * (1 - c), Y = .26 + .28 * c * l + .04 * (u - .5) * (1 - c), X += .12 * (1 - c) + .06 * (u - .5), Z = 1 - .44 * (1 - c);
			};
			case `volleyball`: return () => {
				let e = 3 * W + .18 * Math.sin(n * G), t = (Math.floor(e) % 3 + 3) % 3, i = fract(e) - .5, o = smooth(clamp((.06 - (.5 - Math.abs(i))) / .04)), s = .92 + .08 * hash(t, 0, r ^ 20937), c = fract(W * 24) - .5, l = fract(G * 24) - .5, u = (c * c + l * l) / .0036, d = u < 1 ? (1 - u) * (1 - u) : 0, f = noise(W, G, 40, 40, r ^ 13223);
				J = .42 + .4 * s * (1 - o) - .14 * o - .08 * d + .05 * (f - .5), Y = .3 + .22 * s * (1 - o) - .16 * o - .07 * d, X += .06 * (f - .5) + .08 * o + .05 * d, Z = 1 - .4 * o - .16 * d;
			};
			case `bowlingball`: return () => {
				let e = .6 * noise(W, G, 6, 6, r ^ 6575) + .4 * noise(W, G, 14, 14, r ^ 11121), t = 0;
				for (let [e, n] of [
					[.5, .36],
					[.38, .52],
					[.62, .52]
				]) {
					let r = fract(W - e + .5) - .5, i = fract(G - n + .5) - .5, a = (r * r + i * i) / .003025, o = a < 1 ? (1 - a) * (1 - a) : 0;
					t += o - t * o;
				}
				J = .36 + .34 * e - .24 * t, Y = .38 + .1 * e - .3 * t, X += .05 * (e - .5) + .22 * t, Z = 1 - .5 * t;
			};
			case `rugbyball`: return () => {
				let e = fract(G - .25 + .5) - .5, t = smooth(clamp((.05 - Math.abs(e)) / .03)), n = fract(W * 12) - .5, i = smooth(clamp((.18 - Math.abs(n)) / .08)) * t, o = smooth(clamp((.035 - (.5 - Math.abs(fract(G * 2) - .5))) / .025)), s = noise(W, G, 72, 72, r ^ 27948);
				J = .42 + .26 * i - .16 * o + .12 * (s - .5) + .06 * t, Y = .32 + .16 * i - .12 * o + .05 * (s - .5), X += .1 * (s - .5) - .12 * i + .06 * o, Z = 1 - .42 * o - .14 * (1 - i) * t;
			};
			case `wafflecone`: return () => {
				let e = fract((W + G) * 8) - .5, t = fract((W - G) * 8) - .5, n = smooth(clamp((.12 - Math.abs(e)) / .08)), i = smooth(clamp((.12 - Math.abs(t)) / .08)), a = n + i - n * i, o = noise(W, G, 24, 24, r ^ 12081);
				J = .42 + .3 * a - .1 * (1 - a) + .12 * (o - .5), Y = .28 + .24 * a, X += .08 * (o - .5) - .06 * a, Z = 1 - .4 * (1 - a);
			};
			case `donutglaze`: return () => {
				let e = noise(W, G, 5, 5, r ^ 19499), t = noise(W, G, 11, 11, r ^ 23868), i = smooth(clamp((.65 * e + .35 * t - .46) / .14)), a = fract(W * 14) - .5, o = fract(G * 14) - .5, s = (a * a + o * o) / .0064, c = (s < 1 ? (1 - s) * (1 - s) : 0) * (1 - .6 * i);
				J = .5 + .3 * i + .1 * (t - .5) - .12 * c, Y = .3 + .22 * i - .1 * c, X += .14 * (1 - i) + .05 * (e - .5), Z = 1 - .4 * c - .12 * (1 - i);
			};
			case `brownie`: return () => {
				let e = noise(W, G, 3, 3, r ^ 7038) - .5, t = noise(W, G, 3, 3, r ^ 11407) - .5, n = 7 * W + .5 * e, i = 7 * G + .5 * t, a = smooth(clamp((.1 - (.5 - Math.abs(fract(n) - .5))) / .05)), o = smooth(clamp((.1 - (.5 - Math.abs(fract(i) - .5))) / .05)), s = a + o - a * o, c = 0;
				for (let [e, t] of [
					[.22, .3],
					[.62, .58],
					[.42, .82]
				]) {
					let n = fract(W - e + .5) - .5, r = fract(G - t + .5) - .5, i = (n * n + r * r) / .0036, a = i < 1 ? (1 - i) * (1 - i) : 0;
					c += a - c * a;
				}
				let l = noise(W, G, 40, 40, r ^ 15760);
				J = .34 - .16 * s + .3 * c + .08 * (l - .5), Y = .36 - .14 * s + .2 * c + .04 * (l - .5), X += .06 * (l - .5) + .08 * s - .1 * c, Z = 1 - .4 * s - .1 * (1 - c);
			};
			case `soapbar`: return () => {
				let e = Math.floor(W * 2), t = Math.floor(G * 2), n = (e % 2 + 2) % 2, i = (t % 2 + 2) % 2, a = fract(W * 2) - .5, o = fract(G * 2) - .5, s = Math.abs(a) / .42, c = Math.abs(o) / .36, u = smooth(clamp((1.12 - (s ** 4 + c ** 4) ** .25) / .22)), d = .92 + .08 * hash(n, i, r ^ 25007), f = a / .16, p = o / .1, m = f * f + p * p, h = m < 1 ? (1 - m) * (1 - m) : 0, g = fract(W * 40) - .5, _ = fract(G * 40) - .5, v = (g * g + _ * _) / (.07 * .07), y = v < 1 ? (1 - v) * (1 - v) : 0;
				J = .52 + .3 * u * d + .1 * h - .08 * y - .14 * (1 - u), Y = .3 + .24 * u * d + .06 * h - .05 * y, X += .1 * (1 - u) + .06 * y - .04 * h, Z = 1 - .42 * (1 - u) - .14 * y;
			};
			case `loofah`: return () => {
				let e = fract((W + .16 * Math.sin(Math.PI * 2 * G)) * 6) - .5, t = fract((G + .16 * Math.sin(Math.PI * 2 * W)) * 6) - .5, n = smooth(clamp((.16 - Math.abs(e)) / .12)), i = smooth(clamp((.16 - Math.abs(t)) / .12)), a = n + i - n * i, o = noise(W, G, 48, 48, r ^ 18625);
				J = .46 + .32 * a + .12 * (o - .5), Y = .28 + .3 * a + .05 * (o - .5), X += .12 * (o - .5) - .06 * a, Z = 1 - .46 * (1 - a);
			};
			case `scrubbypad`: return () => {
				let e = (Math.floor(G * 8) % 2 + 2) % 2, n = fract(W * 8 + .5 * e) - .5, i = fract(G * 8) - .5, o = smooth(clamp((.34 - Math.max(Math.abs(n) * 1.15, Math.abs(i))) / .06)), s = noise(W, G, 64, 64, r ^ 30482);
				J = .5 + .26 * (1 - o) + .16 * (s - .5) - .18 * o, Y = .32 + .2 * (1 - o) - .22 * o + .05 * (s - .5), X += .14 * (s - .5) + .1 * o, Z = 1 - .5 * o;
			};
			case `orangeflesh`: return () => {
				let e = fract(W) - .5, t = fract(G) - .5, n = Math.hypot(e, t), i = Math.atan2(t, e), a = smooth(clamp((.46 - n) / .03)), o = smooth(clamp((.45 - n) / .03)) - smooth(clamp((.38 - n) / .03)), s = smooth(clamp((.38 - n) / .03)), c = smooth(clamp((n - .05) / .04)), l = smooth(clamp((.09 - Math.abs(Math.sin(5 * i))) / .05)) * s * c, u = .5 + .5 * Math.sin(48 * i + n * 72), d = noise(W, G, 40, 40, r ^ 12743);
				J = .34 + .3 * a + .16 * o + .12 * u * s * c - .18 * l + .05 * (d - .5), Y = .24 + .24 * a + .12 * o + .06 * u * s * c - .12 * l, X += .06 * (d - .5) + .12 * l - .06 * u * s * c, Z = 1 - .44 * (1 - a) - .4 * l;
			};
			case `kiwiflesh`: return () => {
				let e = fract(W) - .5, t = fract(G) - .5, n = Math.hypot(e, t), i = Math.atan2(t, e), a = smooth(clamp((.46 - n) / .03)), o = smooth(clamp((.45 - n) / .03)) - smooth(clamp((.38 - n) / .03)), s = smooth(clamp((.1 - n) / .04)), c = smooth(clamp((n - .08) / .04)), l = smooth(clamp((.38 - n) / .03)), u = smooth(clamp((.06 - Math.abs(n - .2)) / .03)), d = (.5 + .5 * Math.cos(16 * i)) * u, f = (.5 + .5 * Math.sin(56 * i + n * 48)) * c * l, p = noise(W, G, 40, 40, r ^ 21930);
				J = .38 + .26 * a + .18 * s - .26 * d + .08 * f + .05 * (p - .5), Y = .26 + .24 * a + .08 * s + .08 * d + .04 * f + .1 * o, X += .06 * (p - .5) - .08 * d - .06 * s + .08 * (1 - a), Z = 1 - .44 * (1 - a) - .18 * d;
			};
			case `avocadoflesh`: return () => {
				let e = fract(W) - .5, t = fract(G) - .5, n = Math.hypot(e, t), i = smooth(clamp((.46 - n) / .03)), a = smooth(clamp((.45 - n) / .03)) - smooth(clamp((.39 - n) / .03)), o = e / .15 * (e / .15) + t / .19 * (t / .19), s = o < 1 ? smooth(clamp((1 - o) / .22)) : 0, c = noise(W, G, 12, 12, r ^ 26307), l = noise(W, G, 48, 48, r ^ 8923);
				J = .36 + .3 * i + .14 * a - .2 * s + .08 * (c - .5) + .04 * (l - .5), Y = .26 + .26 * i + .12 * a - .22 * s, X += .06 * (l - .5) + .14 * s - .06 * (1 - s) * i, Z = 1 - .44 * (1 - i) - .38 * s;
			};
			case `turquoise`: {
				let e = n * hash(0, 0, r ^ 12709), t = n * hash(0, 0, r ^ 23410), i = n * hash(0, 0, r ^ 40471);
				return () => {
					let a = Math.sin(n * (3 * W + G) + e) + .35 * Math.sin(n * 2 * W + t), o = Math.sin(n * (W - 2 * G) + t) + .3 * Math.sin(n * 3 * G + e), s = Math.sin(n * (2 * W + 3 * G) + i), c = smooth(clamp(1 - a / .1 * (a / .1))), l = smooth(clamp(1 - o / .085 * (o / .085))), u = smooth(clamp(1 - s / .075 * (s / .075))), d = clamp(.55 * c + .5 * l + .35 * u), f = noise(W, G, 32, 32, r ^ 18401);
					J = .82 * (1 - d) + .14 * d + .05 * (f - .5), Y = .52 * (1 - d) + .44 * d + .008 * (f - .5), X += .22 * d + .03 * (f - .5), Z = 1 - .22 * d;
				};
			}
			case `rhodonite`: {
				let e = n * hash(0, 0, r ^ 4777), t = n * hash(0, 0, r ^ 29620);
				return () => {
					let i = noise(W, G, 4, 4, r ^ 14546), a = W + .06 * (i - .5), o = G + .06 * (i - .5), s = Math.sin(n * (4 * a + o) + e) + .35 * Math.sin(n * 3 * o + t), c = Math.sin(n * (2 * a - 3 * o) + t), l = smooth(clamp(1 - s / .11 * (s / .11))) * smooth(clamp(1 - c / .14 * (c / .14))), u = smooth(clamp((noise(W, G, 8, 8, r ^ 35419) - .58) / .22)), d = clamp(l * 1.5 + .75 * u), f = noise(W, G, 40, 40, r ^ 25075);
					J = .84 * (1 - d) + .12 * d + .04 * (f - .5), Y = .52 * (1 - d) + .45 * d + .006 * (f - .5), X += .18 * d + .02 * (f - .5), Z = 1 - .18 * d;
				};
			}
			case `tigereye`: {
				let e = n * hash(0, 0, r ^ 10229), t = n * hash(0, 0, r ^ 28305);
				return () => {
					let i = noise(W, G, 4, 8, r ^ 23089), a = G * 6 + .35 * Math.sin(n * W + e) + .25 * (i - .5), o = .5 + .5 * Math.sin(n * a), s = .5 + .5 * Math.cos(n * 2 * a + t), c = .65 * o + .35 * s, l = noise(W * 64, G * 8, 64, 8, r ^ 33492);
					J = .25 + .65 * c + .08 * (l - .5), Y = .48 + .04 * c + .005 * (l - .5), X += .05 * (1 - c) + .02 * (l - .5), Z = .98 + .02 * c;
				};
			}
			case `morel`: return () => {
				let e = x, t = W * e.columns, n = G * e.rows, r = Math.floor(t), i = Math.floor(n), a = f(W, G), o = 0, s = 0;
				for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++) {
					let l = r + c, u = i + a, d = ((u + e.rows) % e.rows * e.columns + (l + e.columns) % e.columns) * 5, f = t - l - S[d], p = n - u - S[d + 1], m = f * S[d + 2] + p * S[d + 4], h = p * S[d + 3], g = m * m + h * h;
					if (g >= 1) continue;
					let _ = (1 - g) ** e.weightPower;
					o += _, s += _ * _;
				}
				let l = smooth(clamp((s / (o * o) - .48) / .48));
				J = .8 - .6 * l + .025 * a, Y = .64 - .48 * l + .006 * a, Z = .98 - .4 * l, X += .035 * l + .012 * (a - .5);
			};
			case `mushroomgills`:
			case `bracketfungus`: return () => {
				let r = W * y.cells, a = G * y.cells, o = Math.floor(r), s = Math.floor(a), c = f(W, G);
				J = .3 + .025 * c, Y = .13 + .004 * c, Z = .66;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = o + u, f = s + l, p = ((f + y.cells) % y.cells * y.cells + (d + y.cells) % y.cells) * 7, m = r - d - b[p], h = a - f - b[p + 1], g = b[p + 2], _ = b[p + 3], v = m * g + h * _, x = h * g - m * _ + .55, S = v * v + x * x;
					if (S <= .025 || S >= 2.21 || x <= 0 || x * x <= .04 * S) continue;
					let C = Math.sqrt(S), w = Math.atan2(v, x), T = b[p + 4], E = smooth(clamp((S - .025) / .065)), D = smooth(clamp((x / C - .2) / .25)), O, k, A, j, M;
					if (t === `mushroomgills`) {
						let t = require_materials.proceduralMaterialPresets.mushroomgills, n = .5 + .5 * Math.cos(t.blades * w + .5 * Math.sin(5 * C + T)), r = (n ** t.bladePower + (1 - n) ** t.bladePower * smooth(clamp((C - t.shortStart) / (t.shortEnd - t.shortStart)))) * b[p + 6], a = 1 - smooth(clamp((C - 1.22) / .2));
						O = E * D * a, k = .2 + .22 * r + .005 * c, A = .25 + .51 * r + .08 * b[p + 5], j = .63 + .33 * r, M = i.roughness - .035 * r + .012 * (c - .5);
					} else {
						let t = require_materials.proceduralMaterialPresets.bracketfungus, r = C * (1 + t.lobe * Math.cos(5 * w + T) + .035 * Math.cos(9 * w - T));
						if (r >= 1.35) continue;
						let a = 1 - smooth(clamp((r - 1.27) / .08)), o = smooth(clamp((r - t.marginStart) / (t.marginEnd - t.marginStart))), s = .5 + .5 * Math.cos(n * t.zones * r + T + .2 * Math.sin(3 * w)), l = b[p + 5], u = (c - .5) * b[p + 6];
						O = E * D * a, k = .47 - .045 * r + .009 * u, A = (.22 + .48 * s + .12 * l) * (1 - o) + .94 * o + .018 * u, j = .97, M = i.roughness + .025 * u - .045 * o;
					}
					J += O * (A - J), Y += O * (k - Y), Z += O * (j - Z), X += O * (M - X);
				}
			};
			case `tactilepaving`: return () => {
				let t = require_materials.proceduralMaterialPresets.tactilepaving, n = u(W, G), r = C(W, G), i = Math.abs(fract(W * t.tiles) - .5), a = Math.abs(fract(G * t.tiles) - .5), o = (1 - smooth(clamp((i - t.jointInner) / (t.jointOuter - t.jointInner)))) * (1 - smooth(clamp((a - t.jointInner) / (t.jointOuter - t.jointInner)))), s = fract(W * t.domes) - .5, c = fract(G * t.domes) - .5, l = 1 - smooth(clamp((s * s + c * c - t.domeInner * t.domeInner) / (t.domeOuter * t.domeOuter - t.domeInner * t.domeInner)));
				J = .22 + .4 * o + .08 * o * l + .06 * n + .05 * r, Y = .12 + o * (.12 + .56 * l) + .008 * n, X = t.roughness + .06 * (n - .5) - .025 * l * o, Z = .72 + .22 * o + .06 * o * l;
			};
			case `roadmarking`: return () => {
				let t = require_materials.proceduralMaterialPresets.roadmarking, n = u(W, G), i = (1 - smooth(clamp((Math.abs(fract(W * t.bands) - .5) - t.bandInner) / (t.bandOuter - t.bandInner)))) * smooth(clamp((w(W, G) - t.wearInner) / (t.wearOuter - t.wearInner))), a = .04 + .12 * n, o = .17 + .07 * n;
				J = a + i * (.82 + .1 * n - a), Y = o + i * (.32 + .008 * n - o), X = t.roughness - .25 * i + .04 * (n - .5), Z = .91 + .09 * i;
			};
			case `draincover`: return () => {
				let t = require_materials.proceduralMaterialPresets.draincover, n = u(W, G), r = Math.abs(W - .5), i = Math.abs(G - .5), a = (1 - smooth(clamp((r - t.frameInnerX) / (t.frameOuterX - t.frameInnerX)))) * (1 - smooth(clamp((i - t.frameInnerY) / (t.frameOuterY - t.frameInnerY)))), o = 1 - smooth(clamp((i - t.braceInner) / (t.braceOuter - t.braceInner))), s = Math.max(0, i - t.slotHalfLength), c = 0;
				for (let e = 0; e < t.slots; e++) {
					let n = W - t.slotStart - e * t.slotSpacing;
					c += 1 - smooth(clamp((n * n + s * s - t.slotInner * t.slotInner) / (t.slotOuter * t.slotOuter - t.slotInner * t.slotInner)));
				}
				let l = a * (1 - c * (1 - o));
				J = .035 + .045 * n + l * (.52 + .08 * n), Y = .1 + .012 * n + .72 * l, X = t.roughness + .2 * (1 - l) + .06 * (n - .5), Z = .25 + .75 * l, $ = l;
			};
			case `birchbark`:
			case `palmtrunk`:
			case `sycamorebark`: return () => {
				let e = j(W, G), r = M ? M(W, G) : 0;
				if (t === `palmtrunk`) {
					let t = N(W, G), i = Math.floor(G * 9), a = 0, o = 0;
					for (let e = i - 1; e <= i; e++) {
						let t = (e + 9) % 9 * 4, r = R[t] + .006 * Math.sin(n * W + R[t + 2]) + .003 * Math.sin(3 * n * W + R[t + 2]), i = fract(G - r + .5) - .5, s = i / R[t + 1], c = (i - .018) / .013, l = Math.max(0, 1 - s * s), u = Math.max(0, 1 - c * c);
						a += l * l * R[t + 3], o += u * u * R[t + 3];
					}
					J = .49 + .17 * r + .12 * t - .32 * a + .08 * o, Y = .36 + .035 * t + .012 * e - .15 * a + .12 * o, X += .025 * (e - .5) - .03 * a, Z = 1 - .22 * a;
				} else {
					let i = W * P, a = G * F, o = Math.floor(i), s = Math.floor(a), c = t === `birchbark`, l = 0, u = .54, d = .32, f = 0;
					for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
						let n = o + t, r = s + e, p = (n + P) % P, m = ((r + F) % F * P + p) * I, h = i - n - L[m], g = a - r - L[m + 1], _ = h / L[m + 2], v = g / L[m + 3], y = _ * _ + v * v, b = c ? y : y * (1 + .16 * Math.sin(5 * h + L[m + 4]) * Math.sin(6 * g - L[m + 4]));
						if (b >= 1) continue;
						let x = smooth(clamp((1 - b) / (c ? .75 : .24)));
						c ? l += (1 - l) * x * L[m + 4] : (u += (L[m + 5] - u) * x, d += (.29 + .055 * L[m + 5] - d) * x, f = (f + x) * (1 - x));
					}
					if (c) {
						let t = ((1 + Math.sin(n * (13 * G + .12 * r))) * .5) ** 24;
						J = .91 + .035 * r - .79 * l - .035 * t, Y = .34 + .007 * e - .065 * l - .012 * t, X += .04 * l + .02 * (e - .5), Z = 1 - .2 * l - .025 * t;
					} else J = u + .025 * (e - .5), Y = d + .008 * f + .005 * (e - .5), X += .035 * (1 - u) + .015 * (e - .5), Z = 1 - .055 * f;
				}
			};
			case `rosepetal`:
			case `lilypetal`: return () => {
				let e = t === `rosepetal`, r = e ? ee(W, G) : 0, i = te(W, G), o = Math.sin(n * (3 * W + .22 * Math.sin(n * G + a))), s = e ? 0 : Math.sin(n * (32 * W + .16 * Math.sin(n * 2 * G + a))), c = ne * W, l = re * G, u = Math.floor(c), d = Math.floor(l), f = 0;
				for (let t = -1; t <= 1; t++) for (let n = -1; n <= 1; n++) {
					let r = u + n, i = d + t, a = ((i + re) % re * ne + (r + ne) % ne) * 8, o = c - r - B[a], s = l - i - B[a + 1], p = (o * B[a + 2] + s * B[a + 3]) * B[a + 4], m = (s * B[a + 2] - o * B[a + 3]) * B[a + 5], g = clamp(1 - (e ? p * p + m * m : p * p * (1 + B[a + 7] * Math.sin(3 * m)) + m * m)), _ = g * g * g * B[a + 6];
					f += e ? _ : (1 - f) * _;
				}
				e ? (J = .48 + .16 * o + .08 * r, Y = .3 + .1 * o + .055 * f, X += .025 * f + .02 * (i - .5), Z = .98) : (J = .94 - .82 * f, Y = .3 + .025 * o + .012 * s, X += .025 * f + .012 * (i - .5), Z = .99);
			};
			case `fritillarypetal`: return () => {
				let e = ee(W, G), t = te(W, G), r = 3 * W + .085 * Math.sin(n * 2 * G + a) + .12 * e, i = 4 * G + .065 * Math.sin(n * 2 * W - a) + .1 * e, o = .5 + .5 * Math.tanh(7 * Math.sin(n * r) * Math.sin(n * i)), s = Math.sin(n * (40 * W + .12 * Math.sin(n * G + a)));
				J = .12 + .8 * o, Y = .3 + .014 * s + .02 * Math.sin(n * (2 * W + .1 * Math.sin(n * G + a))), X += .014 * (t - .5), Z = .99;
			};
			case `cantaloupe`: return () => {
				let e = oe(W, G), t = 7 * W + .38 * Math.sin(n * 3 * G + a), r = 7 * G + .34 * Math.sin(n * 2 * W - a), i = Math.floor(t), o = Math.floor(r), s = ae(W, G), c = 0;
				for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
					let a = i + n, s = o + e, l = ((s + 7) % 7 * 7 + (a + 7) % 7) * 26, u = t - a - se[l], d = r - s - se[l + 1], f = smooth(clamp((1.21 - u * u) * 5)) * smooth(clamp((1.21 - d * d) * 5));
					for (let e = 0; e < 8; e++) {
						let t = l + 2 + e * 3, n = se[t + 2] - u * se[t] - d * se[t + 1];
						f *= smooth(clamp((n - .035) * 6));
					}
					c += f;
				}
				let l = 1 - c;
				J = .14 + .12 * e + l * (.66 + .06 * s), Y = .12 + .012 * s + l * (.5 + .06 * s), X += .1 * l - .03 * c, Z = .9 + .1 * l;
			};
			case `dragonfruit`: return () => {
				let e = 4 * W, t = 6 * G, n = Math.floor(e), r = Math.floor(t), i = ae(W, G), a = 0, o = 0, s = 0, c = 0;
				for (let i = -1; i <= 1; i++) for (let l = -1; l <= 1; l++) {
					let u = n + l, d = r + i, f = ((d + 6) % 6 * 4 + (u + 4) % 4) * 5, p = e - u - ce[f], m = t - d - ce[f + 1], h = (p * ce[f + 2] - m * ce[f + 3]) * 2.941176470588235, g = (m * ce[f + 2] + p * ce[f + 3]) * 1.4285714285714286, _ = h * h * (1 + .65 * g + .2 * g * g) + g * g, v = smooth(clamp(1 - _)), y = smooth(clamp((1 - _) * 5)), b = smooth(clamp((g - .05) * 2.5)), x = v * smooth(clamp((g + .35) * 1.5)), S = (y - v) * (1 - b);
					a += v, o += (1 - o) * y * b * ce[f + 4], s += x, c += S;
				}
				J = .045 + .025 * i + .86 * o, Y = .16 + .008 * i + .11 * a + .48 * s - .07 * c, X += .1 * o + .04 * c, Z = 1 - .19 * c;
			};
			case `kiwiskin`: return () => {
				let e = 36 * W, t = 36 * G, n = Math.floor(e), r = Math.floor(t), i = ae(W, G), a = 0, o = 0;
				for (let i = -1; i <= 1; i++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = r + i, u = ((l + 36) % 36 * 36 + (c + 36) % 36) * 5, d = e - c - le[u], f = t - l - le[u + 1], p = d * le[u + 2] + f * le[u + 3], m = f * le[u + 2] - d * le[u + 3], h = smooth(clamp(1 - p * p * 5.408328826392645 - m * m * 177.77777777777777)), g = p + .43, _ = smooth(clamp(1 - (g * g + m * m) * 69.44444444444444));
					a += (1 - a) * h * le[u + 4], o += (1 - o) * _;
				}
				J = .34 + .13 * i + .38 * a - .19 * o, Y = .15 + .016 * i + .23 * a - .085 * o, X += .055 * a - .025 * o, Z = 1 - .23 * o;
			};
			case `walnutshell`: return () => {
				let e = W * 7 + .8 * (Zt(W, G) - .5), t = G * 7, n = Math.floor(e), r = Math.floor(t), i = 0;
				for (let a = -2; a <= 2; a++) for (let o = -2; o <= 2; o++) {
					let s = n + o, c = r + a, l = ((c + 7) % 7 * 7 + (s + 7) % 7) * 24;
					for (let n = 0; n < 3; n++) {
						let r = l + n * 8;
						if (!Qt[r + 7]) continue;
						let a = e - s - Qt[r], o = t - c - Qt[r + 1], u = Qt[r + 2], d = Qt[r + 3], f = (a * u + o * d) * Qt[r + 4];
						if (f * f >= 1) continue;
						let p = (o * u - a * d - Qt[r + 6] * (1 - f * f)) * Qt[r + 5], m = smooth(clamp((1 - f * f) / .4)) * smooth(clamp(1 - p * p));
						i += m;
					}
				}
				let a = i / (.65 + i), o = Xt(W, G);
				J = .13 + .74 * a + .055 * o, Y = .13 + .75 * a + .012 * o, Z = .45 + .53 * a, X += .035 * (1 - a) + .012 * (o - .5);
			};
			case `peanutshell`: return () => {
				let e = W * 10 + .28 * Math.sin(n * G + a) + .3 * (Zt(W, G) - .5), t = G * 5, r = Math.floor(e), i = Math.floor(t), o = smooth(clamp((Math.cos(n * e) - .6) / .4)), s = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let o = r + a, c = i + n, l = ((c + 5) % 5 * 10 + (o + 10) % 10) * 3, u = e - o - .5, d = t - c - $t[l], f = u / .65, p = (d - $t[l + 2] * u) * $t[l + 1], m = f * f + p * p;
					m < 1 && (s += smooth(1 - m));
				}
				let c = s / (.5 + s), l = Xt(W, G);
				J = .5 + .22 * o + .12 * c + .045 * l, Y = .25 + .38 * o + .17 * c + .008 * l, Z = .72 + .19 * o + .075 * c, X += .025 * (1 - o) + .012 * (l - .5);
			};
			case `almondshell`: return () => {
				let e = W * 16, t = G * 12, r = Math.floor(e), i = Math.floor(t), o = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let s = r + a, c = i + n, l = ((c + 12) % 12 * 16 + (s + 16) % 16) * 7;
					if (!en[l + 6]) continue;
					let u = e - s - en[l], d = t - c - en[l + 1], f = en[l + 2], p = en[l + 3], m = (u * f + d * p) * en[l + 4], h = (d * f - u * p) * en[l + 5], g = m * m + h * h;
					g < 1 && (o += smooth(1 - g));
				}
				let s = Xt(W, G), c = .5 + .5 * Math.cos(n * 43 * W + .35 * Math.sin(n * G + a));
				J = .76 - .45 * o + .035 * s + .018 * c, Y = .62 - .33 * o + .006 * s + .004 * c, Z = .98 - .38 * o, X += .035 * o + .012 * (s - .5);
			};
			case `scallopshell`:
			case `oystershell`:
			case `nautilusshell`: return () => {
				let e = W * qt, n = G * qt, r = Math.floor(e), a = Math.floor(n), o = Kt(W, G);
				J = .28 + .035 * o, Y = .12 + .004 * o, Z = .76;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = r + c, u = a + s, d = ((u + qt) % qt * qt + (l + qt) % qt) * 8, f = e - l - Jt[d], p = n - u - Jt[d + 1], m = Jt[d + 2], h = Jt[d + 3], g = (f * m + p * h) * Jt[d + 4], _ = (p * m - f * h) * Jt[d + 5], v = Jt[d + 6], y, b, x, S, C;
					if (t === `scallopshell`) {
						let e = _ + .6, t = g * g + e * e;
						if (t <= .015 || t >= 1.8225 || e <= 0) continue;
						let n = Math.sqrt(t), r = Math.atan2(g, e), i = smooth(clamp((t - .015) * 16)), a = smooth(clamp((Math.cos(r) - .55) * 5)), o = 1 - smooth(clamp((n - 1.15) * 5)), s = .5 + .5 * Math.cos(18 * r), c = .5 + .5 * Math.cos(44 * n + v);
						y = i * a * o, b = .29 + .25 * s + .025 * c, x = .48 + .25 * s + .065 * c, S = .8 + .17 * s, C = -.05 * s;
					} else if (t === `oystershell`) {
						let e = g + .16 * _ * _, t = (e * e + _ * _) * (1 + .13 * Math.sin(5 * g + v) * Math.sin(4 * _ - v));
						if (t >= 1) continue;
						y = 1 - smooth(clamp((t - .78) * (1 / .22))), b = .25, x = Jt[d + 7], S = .96;
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
					Y += y * (b - Y), J += y * (x - J), Z += y * (S - Z), X += y * (i.roughness + C - X);
				}
			};
			case `zebrafur`:
			case `leopardfur`:
			case `giraffefur`:
			case `tigerfur`:
			case `cowhide`: return () => {
				let r = de(W, G), i = fe(W, G), o = W * 40, s = G * 32, c = Math.floor(o), l = Math.floor(s), u = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = c + t, r = l + e, i = ((r + 32) % 32 * 40 + (n + 40) % 40) * 4, a = o - n - ge[i], d = s - r - ge[i + 1], f = (a * ge[i + 2] + d * ge[i + 3]) / .58, p = (d * ge[i + 2] - a * ge[i + 3]) / .13, m = smooth(clamp(1 - f * f - p * p));
					u += (1 - u) * m;
				}
				if (t === `cowhide`) {
					let t = require_materials.proceduralMaterialPresets.cowhide;
					J = .04 + .92 * smooth(clamp(((1 - t.warpMix) * me(W, G) + t.warpMix * r - t.patchLow) * he));
				} else if (t === `tigerfur`) {
					let e = _e, t = G * e.rows, n = Math.floor(t), a = de(W, (n + .5) / e.rows), o = e.warp * (2 * a - 1), s = e.bandWidth + e.bandVariation * a, c = fract(t) - .5 - o, l = 1 - smooth(clamp((s * s - c * c) * ye));
					if (l > 0) {
						let t = (fract(W * e.forks + ve[n * 2]) - .5) * be;
						if (Math.abs(t) < 1) {
							let r = 1 - t * t, i = (c - ve[n * 2 + 1] * e.forkReach * (t + 1) * .5) * xe;
							l *= 1 - smooth(clamp((r * r - i * i) * Se));
						}
					}
					let u = .84 + .1 * r;
					J = u + (1 - l) * (.035 + .025 * i - u);
				} else if (t === `zebrafur`) {
					let e = .42 * Math.sin(n * 2 * G + a) + .75 * (r - .5), t = n * (8 * W + e), i = 1.65 * Math.sin(n * 2 * G - a);
					J = .025 + .94 * smooth(clamp((Math.cos(t) + i * Math.cos(t * .5 + .3 * Math.sin(n * G + a)) + .13 + .16 * (r - .5)) / .26));
				} else if (t === `leopardfur`) {
					let e = 5 * W + .12 * Math.sin(n * 3 * G + a), t = 5 * G + .12 * Math.sin(n * 2 * W - a), i = Math.floor(e), o = Math.floor(t), s = 0, c = 0;
					for (let n = -1; n <= 1; n++) for (let r = -1; r <= 1; r++) {
						let a = i + r, l = o + n, u = ((l + 5) % 5 * 5 + (a + 5) % 5) * 7, d = e - a - Ce[u], f = t - l - Ce[u + 1], p = (d * Ce[u + 2] + f * Ce[u + 3]) * Ce[u + 4], m = (f * Ce[u + 2] - d * Ce[u + 3]) * Ce[u + 5], h = p * p + m * m, g = h * (1 + (.18 * p * m + .16 * p) / (1 + h)), _ = 1 - smooth(clamp((g - .72) / .28)), v = smooth(clamp((g - .25) / .2)), y = smooth(clamp((p - .35) / .28)) * (1 - smooth(clamp((m * m - .025) / .12))), b = smooth(clamp((-m - .48) / .25)) * (1 - smooth(clamp((p * p - .015) / .065))), x = _ * v * (1 - y) * (1 - b), S = (1 - v) * (.65 + .25 * Ce[u + 6]);
						s += (1 - s) * x, c += (1 - c) * S * _;
					}
					J = (.88 - .22 * c + .055 * (r - .5)) * (1 - .96 * s);
				} else {
					let e = 6 * W + .13 * Math.sin(n * 2 * G + a), t = 6 * G + .13 * Math.sin(n * 3 * W - a), i = Math.floor(e), o = Math.floor(t);
					J = .95;
					for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
						let s = i + a, c = o + n, l = ((c + 6) % 6 * 6 + (s + 6) % 6) * 27, u = e - s - we[l], d = t - c - we[l + 1], f = smooth(clamp((1.21 - u * u) / .21)) * smooth(clamp((1.21 - d * d) / .21));
						for (let e = 0; e < 8; e++) {
							let t = l + 3 + e * 3, n = we[t + 2] - u * we[t] - d * we[t + 1];
							f *= smooth(clamp((n - .045) / .055));
						}
						J += f * (.12 + .2 * we[l + 2] + .055 * r - J);
					}
				}
				J += .018 * (u - .5) + .012 * (i - .5), Y = .28 + .24 * u + .035 * i, X += .07 * (u - .5) + .025 * (i - .5), Z = .985 + .012 * u;
			};
			case `braincoral`: return () => {
				let e = n * W + .17 * Math.sin(n * G + a), t = n * G + .17 * Math.sin(n * W - a), r = Bt(W, G), i = 0;
				for (let n = 0; n < 6; n++) {
					let r = n * 4;
					i += Vt[r + 3] * Math.sin(Vt[r] * e + Vt[r + 1] * t + Vt[r + 2]);
				}
				let o = Math.exp(-24 * i * i), s = Math.exp(-6 * i * i);
				J = .13 + .55 * o + .11 * s + .04 * r, Y = .16 + .43 * o + .12 * s + .009 * r, X += .06 * (1 - o) + .015 * (r - .5), Z = .57 + .39 * s;
			};
			case `starcoral`: return () => {
				let e = W * 6, t = G * 6, n = Math.floor(e), r = Math.floor(t), a = Bt(W, G);
				J = .2 + .025 * a, Y = .16 + .006 * a, Z = .72;
				for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = r + a, l = ((c + 6) % 6 * 6 + (s + 6) % 6) * 31, u = e - s - Ht[l], d = t - c - Ht[l + 1], f = Ht[l + 2], p = Ht[l + 3], m = (u * f + d * p) * Ht[l + 4], h = (d * f - u * p) * Ht[l + 5], g = m * m + h * h;
					if (g >= 1) continue;
					let _ = smooth(clamp((1 - g) / .25)), v = Math.exp(-40 * g), y = Math.exp(-45 * (g - .65) * (g - .65)), b = 0;
					for (let e = 0; e < 12; e++) {
						let t = Ht[l + 7 + e * 2], n = Ht[l + 8 + e * 2], r = m * t + h * n, i = h * t - m * n, a = smooth(clamp((r - .16) / .12)) * Math.exp(-700 * i * i);
						b += (1 - b) * a;
					}
					let x = .43 + .12 * Ht[l + 6] + .19 * y + .15 * b - .27 * v, S = .29 + .18 * y + .16 * b - .19 * v;
					J += _ * (x - J), Y += _ * (S - Y), X += _ * (i.roughness + .055 * v - X), Z += _ * (.88 + .07 * y - .42 * v - Z);
				}
			};
			case `seasponge`: return () => {
				let e = W + .07 * Math.sin(n * 3 * G + a), t = G + .06 * Math.sin(n * 2 * e - a), r = fract(e) * 7, i = fract(t) * 7, o = Math.floor(r), s = Math.floor(i), c = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = o + t, a = s + e, l = (a + 7) % 7 * 7 + (n + 7) % 7;
					for (let e = 0; e < 4; e++) {
						let t = (l * 4 + e) * 7;
						if (Ut[t + 6] === 0) continue;
						let o = r - n - Ut[t], s = i - a - Ut[t + 1], u = Ut[t + 2], d = Ut[t + 3], f = (o * u + s * d) * Ut[t + 4], p = (s * u - o * d) * Ut[t + 5], m = f * f + p * p;
						if (m >= 1) continue;
						let h = smooth(clamp((1 - m) / .8));
						c += (1 - c) * h;
					}
				}
				let l = Wt(W, G) - .5, u = Math.exp(-110 * l * l), d = Bt(W, G), f = c * (1 - .42 * u);
				J = .12 + .63 * f + .055 * d, Y = .12 + .57 * f + .012 * d * c, X += .035 * (1 - f) + .01 * (d - .5), Z = .48 + .48 * f;
			};
			case `lotusleaf`:
			case `bananaleaf`:
			case `fernleaf`: return () => {
				let e = W * 3, r = G * 3, a = Math.floor(e), o = Math.floor(r);
				J = .12, Y = .08, Z = .68;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = a + c, u = o + s, d = ((u + 3) % 3 * 3 + (l + 3) % 3) * It, f = e - l - Lt[d], p = r - u - Lt[d + 1], m = Lt[d + 2], h = Lt[d + 3], g = (f * m + p * h) * Lt[d + 4], _ = (p * m - f * h) * Lt[d + 5], v = Lt[d + 6], y, b = 0, x;
					if (t === `fernleaf`) {
						if (g * g + _ * _ > 1.5) continue;
						y = smooth(clamp((1 - g * g / .81 - _ * _ / .0016) / .35)), b = y;
						for (let e = 0; e < 14; e++) {
							let t = Rt[e * 3 + 1], n = _ * t * Rt[e * 3 + 2], r = (g - Rt[e * 3] - .3 * _ * t) / .043, i = (2 * n - 1) * (2 * n - 1) + r * r;
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
								let t = Lt[d + 7 + e * 2], n = Lt[d + 8 + e * 2], r = g * t + _ * n, i = _ * t - g * n, a = smooth(clamp((r - .03) / .1)) * Math.exp(-900 * i * i);
								b += (1 - b) * a;
							}
							let t = Math.exp(-110 * e);
							b += (1 - b) * t;
						} else {
							let e = Math.exp(-180 * _ * _), t = Math.cos(n * (9 * g - 2.4 * Math.sqrt(_ * _ + 4e-4))), r = _ * _ / (_ * _ + .006) * (.5 + .5 * t) ** 8;
							b = e + (1 - e) * .7 * r;
						}
					}
					J += y * (.5 + .18 * v + .12 * b - J), Y += y * (.26 + .13 * x + .14 * b - Y), X += y * (i.roughness + .035 * (1 - b) - X), Z += y * (.9 + .08 * x - Z);
				}
			};
			case `rice`:
			case `sesame`:
			case `coffeebeans`: return () => {
				let e = W * Mt, r = G * Mt, a = Math.floor(e), o = Math.floor(r), s = Pt ? Pt(W, G) : 0;
				J = t === `rice` ? .26 : t === `sesame` ? .19 : .12, Y = .08, Z = .57;
				for (let c = -1; c <= 1; c++) for (let l = -1; l <= 1; l++) {
					let u = a + l, d = o + c, f = (u + Mt) % Mt, p = ((d + Mt) % Mt * Mt + f) * 7, m = e - u - Nt[p], h = r - d - Nt[p + 1], g = Nt[p + 2], _ = Nt[p + 3], v = (m * g + h * _) * Nt[p + 4], y = (h * g - m * _) * Nt[p + 5], b = Nt[p + 6], x;
					if (t === `rice`) x = v * v + y * y * (1 + .8 * v * v);
					else if (t === `sesame`) {
						let e = 1 + .65 * v;
						x = v * v + y * y * e * e;
					} else x = v * v + y * y * (1 + .12 * v);
					if (x >= 1) continue;
					let S = smooth(clamp((1 - x) / .32)), C = (1 - x) * (1 - x), w, T, E, D;
					if (t === `rice`) {
						let e = .5 + .5 * Math.cos(14 * y + .7 * v * v);
						w = .75 + .16 * b + .035 * e, T = .28 + .32 * C + .025 * C * e, E = i.roughness + .04 * (1 - C), D = .87 + .1 * C;
					} else if (t === `sesame`) {
						let e = Math.exp(-12 * y * y) * C, t = .5 + .5 * Math.sin(17 * v + 5 * y + b * n);
						w = .58 + .2 * b + .07 * e + .025 * t, T = .24 + .2 * C + .23 * e, E = i.roughness + .05 * (1 - e), D = .86 + .11 * C;
					} else {
						let e = y - .16 * Math.sin(2.8 * v + b - .5), t = Math.exp(-e * e / .012) * C, n = .55 * s + .45 * b;
						w = .4 + .3 * n + .1 * C - .26 * t, T = .28 + .4 * C - .3 * t + .018 * s * C, E = i.roughness + .11 * n + .1 * t, D = .89 + .08 * C - .32 * t;
					}
					J += S * (w - J), Y += S * (T - Y), X += S * (E - X), Z += S * (D - Z);
				}
			};
			case `malachite`:
			case `agate`: return () => {
				let e = n * (t === `malachite` ? 3 : 1) * W + kt, r = n * 3 * G + At, i = e + .28 * Math.sin(r), a = r + .18 * Math.sin(e), o = 1 - .5 * (Math.cos(i) + Math.cos(a)) + (t === `agate` ? .22 * (1 - Math.cos(2 * i - a)) : 0), s = .5 + .5 * Math.cos(n * (3 * o + .1 * Math.sin(i) * Math.sin(a))), c = Dt(W, G);
				J = .12 + .8 * s + .035 * c, Y = .48 + .07 * s + .002 * c, X += .045 * (1 - s) + .012 * c, Z = .985 + .015 * s;
			};
			case `lapislazuli`: return () => {
				let e = Math.sin(n * (W + G) + kt) + .22 * Math.sin(n * 3 * G + At), t = Math.sin(n * (2 * W - G) + At) + .18 * Math.sin(n * 2 * G + kt), r = smooth(clamp(1 - (e / .1) ** 2)), i = smooth(clamp(1 - (t / .065) ** 2)), a = smooth(clamp((Ot(W, G) - .64) / .22)), o = 1 - (1 - r) * (1 - i) * (1 - .8 * a), s = Dt(W, G);
				J = .1 + .12 * s + .76 * o, Y = .5 + .009 * s + .045 * o, X += .04 * s + .13 * o, Z = .988 + .012 * o;
			};
			case `basalt`: return () => {
				let e = W * 6, t = G * 8, n = Math.floor(t), r = St(W, G);
				J = .08 + .035 * r, Y = .1 + .008 * r, Z = .59;
				for (let i = -1; i <= 1; i++) {
					let a = n + i, o = (a + 8) % 8, s = o % 2 * .5, c = Math.floor(e - s);
					for (let n = -1; n <= 1; n++) {
						let i = c + n, l = (i + 6) % 6, u = (o * 6 + l) * 4, d = e - i - s - .5, f = t - a - .5, p = U[u], m = U[u + 1], h = U[u + 2], g = U[u + 3], _ = smooth(clamp((p - d) / .065)) * smooth(clamp((p + d) / .065)) * smooth(clamp((m - .5 * d - .75 * f) / .065)) * smooth(clamp((m + .5 * d + .75 * f) / .065)) * smooth(clamp((h + .5 * d - .75 * f) / .065)) * smooth(clamp((h - .5 * d + .75 * f) / .065)), v = 1 - .6 * d * d - .6 * f * f;
						J += _ * (.28 + .18 * g + .06 * r), Y += _ * (.52 + .08 * g + .07 * v), Z += .4 * _;
					}
				}
				X += .08 * (1 - Z) + .025 * (r - .5);
			};
			case `scoria`:
			case `obsidian`: return () => {
				let e = Ct, n = W * e, r = G * wt, i = Math.floor(n), a = Math.floor(r), o = St(W, G), s = 0, c = 0, l = 0;
				for (let o = -1; o <= 1; o++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + o, p = (d + e) % e, m = ((f + wt) % wt * e + p) * 7, h = n - d - U[m], g = r - f - U[m + 1], _ = U[m + 4], v = U[m + 5], y = (_ * h + v * g) / U[m + 2], b = (-v * h + _ * g) / U[m + 3], x = y * y + b * b;
					if (x >= 1) continue;
					let S, C;
					if (t === `scoria`) S = smooth(clamp((.7 - x) / .7)), C = smooth(clamp((x - .42) / .18)) * smooth(clamp((1 - x) / .2));
					else {
						S = smooth(1 - x);
						let e = (y + .36 - 1.2 * b * b) / .08;
						C = smooth(clamp(1 - e * e)) * smooth(clamp((1 - x) / .25));
					}
					s += (1 - s) * S, c += (1 - c) * C, l += (1 - l) * S * U[m + 6];
				}
				t === `scoria` ? (J = .36 + .09 * o - .23 * s + .16 * c + .04 * l, Y = .48 + .012 * o - .32 * s + .15 * c, X += .045 * s - .035 * c + .015 * (o - .5), Z = .98 - .36 * s + .015 * c) : (J = .15 + .035 * o + .14 * s + .28 * c + .035 * l, Y = .5 + .003 * o - .2 * s + .1 * c, X += .08 * s + .1 * c + .012 * o, Z = 1 - .13 * s);
			};
			case `corrugatedcardboard`:
			case `creasedpaper`:
			case `layeredpaper`: return () => {
				let e = vt(W * 8, G * 8), r = W * 24, i = G * 32, a = Math.floor(r), o = Math.floor(i), s = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = a + t, c = o + e, l = ((c % 4 + 4) % 4 * 3 + (n % 3 + 3) % 3) * 5, u = r - n - yt[l], d = i - c - yt[l + 1], f = u * yt[l + 2] + d * yt[l + 3], p = d * yt[l + 2] - u * yt[l + 3], m = clamp(1 - (f / yt[l + 4]) ** 2 - (p / .065) ** 2);
					s += m * m;
				}
				let c = .018 * e + .014 * s;
				if (t === `corrugatedcardboard`) {
					let t = .5 + .5 * Math.cos(n * W * 4);
					J = .38 + .27 * t + .09 * e - .055 * s, Y = .18 + .58 * t + c, X += .025 * (e - .5) + .015 * s, Z = .68 + .3 * t - .025 * s;
				} else if (t === `creasedpaper`) {
					let t = Math.abs(fract(W * 2 + .5) - .5), n = Math.abs(fract(G * 2 + .5) - .5), r = clamp(1 - (t / .14) ** 2) ** 2, i = clamp(1 - (n / .14) ** 2) ** 2, a = clamp(1 - ((t - .25) / .1) ** 2) ** 2, o = clamp(1 - ((n - .25) / .1) ** 2) ** 2, l = 1 - (1 - r) * (1 - i), u = (1 - (1 - a) * (1 - o)) * (1 - l);
					J = .7 + .1 * l - .14 * u + .07 * e - .04 * s, Y = .4 + .3 * l - .16 * u + c, X += .025 * (e - .5) - .035 * l + .025 * u, Z = .98 - .19 * u - .02 * s;
				} else {
					J = .5, Y = .2, Z = .98;
					for (let e = 0; e < 8; e++) {
						let t = .25 + e % 2 * .5, r = (Math.floor(e / 2) + .5) / 4, i = fract(W - t + .5) - .5, a = fract(G - r + .5) - .5, o = bt[e * 3 + 2], s = .008 * Math.sin(n * i * 12 + o) + .004 * Math.sin(n * i * 28 - o), c = smooth(clamp((.34 - Math.abs(i)) / .025)), l = smooth(clamp((.18 + s - Math.abs(a)) / .025)), u = c * l, d = 4 * l * (1 - l), f = 4 * c * (1 - c), p = d * c + f * l * (1 - d);
						Y += u * (bt[e * 3] - Y), J += u * (bt[e * 3 + 1] - J), Z += u * (.98 - Z), Y -= .035 * p, J -= .075 * p, Z -= .18 * p;
					}
					Y += c, J += .07 * e - .045 * s, X += .025 * (e - .5) + .015 * s, Z -= .02 * s;
				}
			};
			case `cactus`: return () => {
				let e = W * 8, t = G * 8, r = Math.floor(e), i = Math.floor(t), a = .5 - .5 * Math.cos(n * e), o = pt(W, G), s = 0, c = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let o = r + a, l = i + n, u = (o + 8) % 8, d = ((l + 8) % 8 * 8 + u) * 18, f = e - o - .5, p = t - l - .5 - gt[d + 1];
					if (f * f + p * p > .14) continue;
					let m = clamp(1 - f * f / .0196 - p * p / .0169), h = gt[d];
					s += m * m;
					for (let e = 0; e < 8; e++) {
						let t = gt[d + 2 + e * 2], n = gt[d + 3 + e * 2], r = f * t + p * n, i = p * t - f * n, a = smooth(clamp((r - .09) / .055)) * smooth(clamp((h - r) / .085)), o = clamp(1 - i * i / 225e-6);
						c += a * o * o;
					}
				}
				J = .2 + .47 * a + .045 * o + .18 * s - .08 * c, Y = .18 + .49 * a + .065 * s - .025 * c + .004 * o, X += .12 * s + .055 * c + .025 * (o - .5), Z = .83 + .16 * a - .08 * s - .035 * c;
			};
			case `pinecone`: return () => {
				let e = W * 8, t = G * 8, r = Math.floor(t), i = pt(W, G);
				J = .08 + .025 * i, Y = .12, Z = .58;
				for (let a = 1; a >= -1; a--) {
					let o = r + a, s = (o + 8) % 8, c = s % 2 * .5, l = Math.floor(e - c);
					for (let r = -1; r <= 1; r++) {
						let a = l + r, u = (a + 8) % 8, d = gt[s * 8 + u], f = e - a - c - .5, p = t - o - .5, m = smooth(clamp((.68 + f - .55 * p) / .1)), h = smooth(clamp((.68 - f - .55 * p) / .1)), g = smooth(clamp((p + .78) / .12)), _ = smooth(clamp((.86 - p) / .12)), v = m * h * g * _;
						if (v === 0) continue;
						let y = smooth(clamp((p + .05) / .76)), b = smooth(clamp(1 - f * f / .36)), x = Math.cos(n * (19 * f + 1.8 * p * p + d)), S = .28 + .27 * y + .075 * b + .018 * d + .006 * x, C = .28 + .22 * d + .18 * y + .045 * x + .025 * i;
						J += v * (C - J), Y += v * (S - Y), Z += v * (.97 - Z);
					}
				}
				X += .06 * (1 - Z) + .025 * (i - .5);
			};
			case `corncob`: return () => {
				let e = W * 12, t = G * 8, n = Math.floor(e), r = gt[Math.floor(t) * 12 + n], i = (fract(e) - .5) / (.445 + .015 * r), a = (fract(t) - .5) / (.46 + .015 * r), o = clamp(1 - i * i * i * i - a * a), s = smooth(clamp(o / .28)), c = smooth(o), l = pt(W, G);
				J = .13 + s * (.36 + .15 * r + .21 * c + .025 * l), Y = .09 + s * (.24 + .4 * c + .025 * r), X += .14 * (1 - s) - .055 * c + .015 * (l - .5), Z = .55 + .44 * s;
			};
			case `wood`: return () => {
				let e = noise(W, G, 4, 2, r ^ 71), t = .5 + .5 * Math.sin(n * (12 * W + .65 * e) + a), i = (.5 + .5 * Math.sin(n * (40 * W + e) + a)) ** 12;
				J = clamp(.22 + .6 * t + .16 * K - .2 * i), Y = .65 * t + .15 * K - .18 * i, X += .15 * i + .08 * (K - .5), Z = 1 - .15 * i;
			};
			case `brick`: return () => {
				let e = Math.floor(G * 8), t = fract(W * 4 + e % 2 * .5), n = fract(G * 8), a = smooth(clamp((Math.min(t, 1 - t, n * .5, (1 - n) * .5) - .014) / .045));
				J = .25 + .42 * hash(Math.floor(W * 4 + e % 2 * .5) % 4, e, r) + .2 * K, Y = a * (.75 + .15 * K + .1 * q), Q = 1 - a, X += .09 * Q + .05 * (K - .5), Z = .65 + .35 * a;
			};
			case `stone`: return () => {
				let e = noise(W + .12 * rn, G, 8, 8, r ^ 131);
				J = clamp(.1 + .65 * e + .3 * K), Y = .65 * e + .25 * K + .1 * q, X += .1 * (K - .5), Z = .8 + .2 * smooth(Y);
			};
			case `basswood`:
			case `nickelsilver`: {
				let n = t === `basswood` ? require_materials.proceduralMaterialPresets.basswood : require_materials.proceduralMaterialPresets.nickelsilver, i = cachedNoise(n.brushU, n.brushV, r ^ 94737), a = cachedNoise(n.grainCells, n.grainCells, r ^ 94739);
				return () => {
					let e = i(W, G), t = a(W, G);
					J = n.baseTone + n.brushTone * e + n.grainTone * t, Y = n.baseHeight + n.brushHeight * e + n.grainHeight * t, X += n.brushRoughness * (e - .5) + n.grainRoughness * (t - .5);
				};
			}
			case `metal`: return () => {
				let e = noise(W, G, 4, 64, r ^ 313), t = (.5 + .5 * Math.sin(n * G * 48 + a)) ** 16;
				J = .4 + .38 * e + .12 * rn - .1 * t, Y = .7 * e - .15 * t, X += .18 * e + .08 * t, Z = 1 - .04 * t;
			};
			case `fabric`: return () => {
				let e = W * 12, t = G * 12, r = Math.sin(Math.PI * fract(e)) ** 2, i = Math.sin(Math.PI * fract(t)) ** 2, o = (Math.floor(e) + Math.floor(t)) % 2 == 0, s = o ? r * (.6 + .4 * i) : i * (.6 + .4 * r), c = .5 + .5 * Math.sin(n * (o ? W : G) * 48 + a);
				J = .22 + .48 * s + .14 * K + .08 * c, Y = .8 * s + .06 * c + .08 * K, X += .04 * (K - .5), Z = .68 + .32 * s;
			};
			case `marble`: return () => {
				let e = noise(W, G, 4, 4, r ^ 997), t = Math.exp(-Math.abs(Math.sin(n * (3 * W + 2 * G + .8 * e) + a)) * 16);
				J = clamp(.9 + .1 * rn - .85 * t), Y = .3 * rn - .2 * t + .05 * K, X += .1 * t + .04 * (K - .5), Z = 1 - .06 * t;
			};
			case `concrete`: return () => {
				let e = fract(W * 3), t = fract(G * 3), i = 1 - smooth(clamp((Math.min(e, 1 - e, t, 1 - t) - .02) / .035)), a = hash(Math.floor(fract(W) * 40), Math.floor(fract(G) * 40), r);
				J = .28 + .5 * a * (1 - i) + .12 * K, Y = (1 - i) * (.65 + .25 * a) + .05 * K, X += .14 * i + .06 * (a - .5), Z = .62 + .38 * (1 - i);
			};
			case `tiles`: return () => {
				let e = fract(W * 5), t = fract(G * 5), i = smooth(clamp((Math.min(e, 1 - e, t, 1 - t) - .018) / .028));
				J = .42 + .4 * hash(Math.floor(W * 5) % 5, Math.floor(G * 5) % 5, r) + .08 * K, Y = i * (.82 + .1 * K), Q = 1 - i, X += .42 * Q + .04 * (K - .5), Z = .58 + .42 * i;
			};
			case `elephanthide`: return () => {
				let e = D(W, G), t = E(W, G), r = .5 + .5 * Math.cos(n * (5 * W + .65 * Math.sin(n * 2 * G + a) + 1.1 * e)), i = .5 + .5 * Math.cos(n * (4 * G + .5 * Math.sin(n * 3 * W - a) - .8 * e)), o = r ** 22, s = i ** 24, c = 1 - (1 - o) * (1 - s), l = (r ** 7 - o + i ** 8 - s) * .5, u = (.5 + .5 * Math.cos(n * (21 * W + 13 * G + 1.8 * e) + a)) ** 16;
				J = .65 - .4 * c - .055 * u + .035 * t, Y = .63 - .39 * c + .055 * l - .035 * u + .008 * t, X += .035 * c + .025 * (t - .5), Z = .98 - .23 * c - .025 * u;
			};
			case `ostrichleather`: return () => {
				let e = W * 6, t = G * 6, n = Math.floor(e), r = Math.floor(t), i = (r * 6 + n) * 3, a = (e - n - O[i]) * O[i + 2], o = (t - r - O[i + 1]) * O[i + 2], s = a * a + o * o, c = smooth(clamp((1 - s) / .2)), l = smooth(clamp(1 - s / .12)), u = 1 + .18 * (a * a * a - 3 * a * o * o), d = s < 1 ? c * s * Math.exp(-(((s - .43) / .22) ** 2)) * 2 * u : 0, f = E(W, G);
				J = .57 + .075 * f + .12 * d - .19 * l, Y = .43 + .018 * f + .18 * d - .13 * l, X += .035 * (f - .5) - .035 * d + .04 * l, Z = .985 - .17 * l - .035 * d;
			};
			case `sharkskin`: return () => {
				let e = W * 18, t = G * 24, n = Math.floor(t), r = E(W, G);
				J = .3 + .025 * r, Y = .26 + .008 * r, Z = .79;
				for (let r = -1; r <= 1; r++) {
					let i = n + r, a = (i % 24 + 24) % 24, o = a % 2 * .5, s = Math.floor(e - o);
					for (let n = -1; n <= 1; n++) {
						let r = s + n, c = (r % 18 + 18) % 18, l = k[a * 18 + c], u = (t - i - .5) / .78;
						if (u <= -1 || u >= 1) continue;
						let d = (.39 + .04 * l) * (1 - .45 * u), f = (e - r - o - .5) / d, p = f * f + u * u, m = smooth(clamp((1 - p) / .22));
						if (m === 0) continue;
						let h = smooth(clamp(1 - p)), g = Math.exp(-(((f + .48) / .075) ** 2)) + Math.exp(-((f / .075) ** 2)) + Math.exp(-(((f - .48) / .075) ** 2)), _ = smooth(clamp((p - .56) / .2));
						J += m * (.52 + .1 * l + .045 * g * h - .055 * _ - J), Y += m * (.4 + .065 * h + .055 * g * h - .025 * _ - Y), Z += m * (.98 - .07 * _ - Z);
					}
				}
				X += .025 * (r - .5) + .035 * (1 - Z);
			};
			case `leather`: return () => {
				let t = smooth(clamp(1 - wrappedFeature(W, G, 14, r ^ 81) * 1.55));
				J = .24 + .52 * t + .12 * K, Y = .12 + .72 * t + .06 * K, X += .16 * (1 - t) + .04 * (K - .5), Z = .55 + .45 * t;
			};
			case `suede`: return () => {
				let e = noise(W, G, 5, 7, r ^ 15639), t = noise(W + .012 * e, G + .004 * e, 96, 24, r ^ 24113), n = smooth(clamp((noise(W, G, 80, 80, r ^ 31331) - .57) / .35));
				J = .23 + .36 * e + .25 * t + .1 * K - .08 * n, Y = .35 + .075 * t + .025 * e - .045 * n, X += .075 * (t - .5) + .035 * (e - .5), Z = .985 - .035 * n + .01 * t;
			};
			case `snakeskin`: return () => {
				let e = W * 10, t = G * 12, n = Math.floor(t), r = 0, i = 0, a = 0, o = 0;
				for (let s = -1; s <= 1; s++) {
					let c = n + s, l = (c % 2 + 2) % 2 * .5, u = Math.floor(e - l);
					for (let n = -1; n <= 1; n++) {
						let s = u + n, d = (s % 10 + 10) % 10, f = (c % 12 + 12) % 12, p = Me[f * 10 + d], m = e - s - l - .5, h = t - c - .5;
						if (Math.abs(m) >= .48 || Math.abs(h) >= .64) continue;
						let _ = clamp(1 - (Math.sqrt(m * m + .0016) / (.46 + .02 * p) + Math.sqrt(h * h + .0016) / (.61 + .03 * p)));
						if (_ === 0) continue;
						let v = smooth(clamp(_ / .18)), y = _ * _, b = y * Math.exp(-m * m * 180);
						r += v, i += y, a += b, o += v * p;
					}
				}
				J = .13 + .4 * r + .2 * o + .1 * i + .04 * K, Y = .04 + .64 * r + .2 * i + .065 * a + .012 * K, X += .12 * (1 - r) - .045 * i + .045 * (K - .5), Z = .57 + .41 * r + .015 * i;
			};
			case `crocodile`: return () => {
				let e = W * 4, t = G * 6, i = Math.floor(e), o = Me[Math.floor(t) * 4 + i], s = (fract(e) - .5) / (.445 + .025 * o), c = (fract(t) - .5) / (.445 + .02 * o), l = clamp(1 - s * s * s * s - c * c * c * c), u = smooth(clamp(l / .36)), d = noise(W, G, 9, 11, r ^ 12115), f = (.5 + .5 * Math.sin(n * (19 * W + 13 * G + 1.7 * d) + a)) ** 12;
				J = .12 + u * (.37 + .22 * o + .1 * K - .12 * f), Y = .035 + u * (.64 + .17 * l * l + .035 * o - .065 * f), X += .13 * (1 - u) + u * (.055 * f + .04 * (K - .5)), Z = .53 + u * (.46 - .055 * f);
			};
			case `fishscales`:
			case `feathers`:
			case `peacockfeathers`: {
				let r = t === `peacockfeathers` ? require_materials.proceduralMaterialPresets.peacockfeathers : null, i = r ? 1 / (r.eyeWidth * r.eyeWidth) : 0, a = r ? 1 / (r.eyeLength * r.eyeLength) : 0, o = r ? 1 / r.outerShoulder : 0, s = r ? 1 / r.innerShoulder : 0, c = r ? 1 / (r.pupilWidth * r.pupilWidth) : 0, l = r ? 1 / (r.pupilLength * r.pupilLength) : 0, u = r ? 1 / r.pupilShoulder : 0;
				return () => {
					let e = W * Ke, d = G * qe, f = Math.floor(d);
					J = .12 + .045 * K, Y = .23, Z = .76;
					for (let p = -1; p <= 1; p++) {
						let m = f + p, h = (m % qe + qe) % qe, g = h % 2 * .5, _ = Math.floor(e - g);
						for (let f = -1; f <= 1; f++) {
							let p = _ + f, v = (p % Ke + Ke) % Ke, y = (h * Ke + v) * 2, b = Je[y], x = d - m - .5, S = e - p - g - .5 - Je[y + 1] * x, C, w, T;
							if (t === `fishscales`) {
								let e = S * S / .4356 + x * x / .6724;
								if (C = smooth(clamp((1 - e) / .18)), C === 0) continue;
								let t = smooth(clamp(1 - e)), r = smooth(clamp((e - .48) / .2)) * smooth(clamp((1 - e) / .15)) * smooth(clamp((x + .12) / .4)), i = Math.cos(n * (6 * e + .15 * b));
								w = .39 + .2 * b + .13 * t + .1 * r + .045 * i, T = .37 + .12 * t + .11 * r + .012 * i * t;
							} else {
								let e = x / 1.08;
								if (e <= -1 || e >= 1) continue;
								let t = 1 - e * e, d = t * t - S * S / .2304;
								if (C = smooth(clamp(d / .16)), C === 0) continue;
								let f = smooth(clamp(d)), p = smooth(clamp(1 - S * S / .0025)), m = Math.cos(n * (18 * x - 14 * Math.sqrt(S * S + 4e-4))), h = smooth(clamp((e + .45) / 1.1));
								if (w = .36 + .22 * b + .1 * f - .12 * h + .08 * p + .065 * m, T = .35 + .1 * f + .075 * p + .013 * m * f, r) {
									let e = x - r.eyeY, t = S * S * i + e * e * a, n = smooth(clamp((1 - t) * o)), d = smooth(clamp((r.innerSquared - t) * s)), f = S - r.pupilX, p = x - r.pupilY, h = smooth(clamp((1 - f * f * c - p * p * l) * u));
									w += n * (.91 + .025 * b + .015 * m - w), w += d * (.29 + .035 * b + .02 * m - w), w += h * (.035 + .015 * b + .008 * m - w);
								}
							}
							J += C * (w - J), Y += C * (T - Y), Z += C * (.98 - Z);
						}
					}
					X += .045 * (1 - Z) + .025 * (K - .5);
				};
			}
			case `tortoiseshell`: return () => {
				let e = W * 6, t = G * 6, i = Math.floor(e), a = Math.floor(t), o = noise(W, G, 19, 23, r ^ 18919);
				J = .045 + .025 * K, Y = .22, Z = .72;
				for (let r = -1; r <= 1; r++) for (let s = -1; s <= 1; s++) {
					let c = i + s, l = a + r, u = (c + 6) % 6, d = ((l + 6) % 6 * 6 + u) * 27, f = e - c - Ye[d], p = t - l - Ye[d + 1], m = 1, h = 1;
					for (let e = 0; e < 8; e++) {
						let t = d + 3 + e * 3, n = Ye[t + 2], r = n - f * Ye[t] - p * Ye[t + 1];
						if (m *= smooth(clamp((r - .018) / .085)), h *= smooth(clamp(r / n)), m === 0) break;
					}
					if (m === 0) continue;
					let g = Ye[d + 2], _ = Math.cos(n * (5 * h + .12 * g)), v = .28 + .25 * g + .22 * o + .09 * h + .045 * _;
					J += m * (v - J), Y += m * (.37 + .2 * h + .012 * _ * h - Y), Z += m * (.98 - Z);
				}
				X += .06 * (1 - Z) + .025 * (K - .5);
			};
			case `sand`: return () => {
				let e = noise(W, G, 3, 3, r ^ 17), t = .5 + .5 * Math.sin(n * (G * 7 + .35 * e) + a), i = noise(W, G, 48, 48, r ^ 20973);
				J = .3 + .48 * t + .18 * i, Y = .72 * t + .22 * i, X += .06 * (i - .5), Z = .82 + .18 * t;
			};
			case `rust`: return () => {
				let e = noise(W, G, 6, 6, r ^ 211), t = noise(W, G, 18, 18, r ^ 419), n = smooth(clamp((e * .7 + t * .3 - .32) / .28));
				J = n, Y = .25 + .45 * (1 - n) * t - .2 * n * e, X += .22 * n + .05 * (t - .5), Z = .7 + .3 * (1 - n), $ = 1 - n;
			};
			case `snow`: return () => {
				let e = noise(W, G, 3, 3, r ^ 17), t = hash(Math.floor(fract(W) * 48), Math.floor(fract(G) * 48), r) ** 8;
				J = clamp(.22 + .68 * e + .1 * t), Y = .7 * e + .2 * t, X += .22 * t - .06 * e, Z = .88 + .12 * e;
			};
			case `asphalt`:
			case `gravel`: return () => {
				let e = t === `asphalt`, i = e ? 40 : 12, a = W * i, o = G * i, s = Math.floor(a), c = Math.floor(o), l = 0, u = 0, d = 0, f = 0;
				for (let t = -1; t <= 1; t++) for (let p = -1; p <= 1; p++) {
					let m = s + p, h = c + t, g = (m % i + i) % i, _ = (h % i + i) % i, v = hash(g, _, r ^ 29873), y = hash(g, _, r ^ 27145) * n, b = Math.cos(y), x = Math.sin(y), S = a - m - .25 - .5 * hash(g, _, r), C = o - h - .25 - .5 * hash(g, _, r ^ 40503), w = e ? .22 + .21 * v : .46 + .17 * v, T = .7 + .3 * hash(g, _, r ^ 20973), E = (S * b + C * x) / T, D = C * b - S * x, O = Math.sqrt(E * E + D * D) + (K - .5) * (e ? .08 : .16), k = smooth(clamp((w - O) / .16)), A = clamp(1 - O / w);
					l = Math.max(l, k), f = Math.max(f, k * (.65 + .35 * A)), u += k * (.35 + .65 * v), d += k;
				}
				let p = u / Math.max(1, d);
				e ? (J = .06 + .58 * p + .1 * K + .06 * q, Y = .58 * f + .18 * K + .24 * q, X += .08 * (1 - l) + .1 * (q - .5), Z = .8 + .2 * l) : (J = .04 + .8 * p + .08 * q, Y = f * (.84 + .16 * K) + .025 * q, X += .13 * (1 - l) + .1 * (q - .5), Z = .42 + .58 * l);
			};
			case `cobblestone`: return () => {
				let e = W + .012 * noise(W, G, 6, 8, r ^ 561), t = G + .009 * noise(W, G, 6, 8, r ^ 2323), n = Math.floor(fract(t) * 8), i = e * 6 + n % 2 * .5, a = fract(i), o = fract(t * 8), s = Math.abs(a - .5), c = Math.abs(o - .5) * .75, l = Math.max(0, s - .38), u = Math.max(0, c - .255), f = smooth(clamp((.12 - Math.sqrt(l * l + u * u) - .018) / .085)), p = hash((Math.floor(i) % 6 + 6) % 6, n, r), m = 1 - .65 * (s * s + c * c);
				J = .05 + f * (.25 + .48 * p + .12 * K) + .05 * q, Y = f * (.76 * m + .16 * K + .08 * q), X += .17 * (1 - f) + .1 * (q - .5), Z = .45 + .55 * f;
			};
			case `bark`: return () => {
				let e = noise(W, G, 4, 6, r ^ 15127), t = noise(W + .035 * e, G, 18, 3, r ^ 33825), n = noise(W, G, 6, 18, r ^ 20883), i = smooth(clamp((t - .26) / .38)) * smooth(clamp((n - .18) / .22)), a = noise(W, G, 48, 12, r ^ 8571);
				J = .05 + i * (.43 + .33 * a + .13 * q), Y = i * (.58 + .3 * a + .12 * K), X += .08 * (1 - i) + .1 * (q - .5), Z = .42 + .58 * i;
			};
			case `moss`: return () => {
				let e = noise(W, G, 4, 4, r ^ 7015), n = smooth(clamp(1 - wrappedFeature(fract(W + .025 * e), fract(G + .018 * e), 9, r ^ 25519) / .95)), i = noise(W, G, 18, 18, r ^ 37671), a = smooth(clamp((q - .25) / .5));
				J = .09 + .46 * n + .24 * i + .19 * a, Y = .65 * n + (.09 + .14 * n) * a + .12 * K, X += .06 * (a - .5) - .08 * (1 - n), Z = .52 + .36 * n + .12 * a;
			};
			case `mud`: return () => {
				let e = noise(W, G, 4, 4, r ^ 29011), t = (W + .025 * e) * 7, n = (G + .025 * noise(W, G, 4, 4, r ^ 7993)) * 7, i = Math.floor(t), a = Math.floor(n), o = 4, s = 4;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 7 + 7) % 7, f = (u % 7 + 7) % 7, p = t - l - .3 - .4 * hash(d, f, r), m = n - u - .3 - .4 * hash(d, f, r ^ 40503), h = p * p + m * m;
					h < o ? (s = o, o = h) : h < s && (s = h);
				}
				let l = smooth(clamp((Math.sqrt(s) - Math.sqrt(o) - .025) / .13)), u = smooth(clamp((noise(W, G, 3, 3, r ^ 14561) - .25) / .5));
				J = .04 + l * (.52 - .24 * u + .17 * K) + .04 * q, Y = l * (.48 + .16 * (1 - o)) + (.07 * K + .03 * q) * (1 - .75 * u), X -= .38 * u, X += .1 * (1 - l) + .08 * (q - .5) * (1 - u), Z = .48 + .52 * l;
			};
			case `granite`: return () => {
				let e = W * 38, t = G * 38, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0, s = 4, c = 4;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = n + u, f = i + l, p = (d % 38 + 38) % 38, m = (f % 38 + 38) % 38, h = e - d - .3 - .4 * hash(p, m, r), g = t - f - .3 - .4 * hash(p, m, r ^ 40503), _ = h * h + g * g;
					_ < s ? (c = s, s = _) : _ < c && (c = _);
					let v = clamp(1 - _ / 1.44) ** 10, y = hash(p, m, r ^ 25643);
					a += v * (y < .24 ? .08 + y : .48 + .5 * y), o += v;
				}
				let l = a / Math.max(o, 1e-12), u = 1 - smooth(clamp((Math.sqrt(c) - Math.sqrt(s)) / .16));
				J = clamp(.04 + .88 * l + .1 * (q - .5) - .07 * u), Y = .35 * l + .17 * q - .12 * u, X += .16 * (1 - l) + .06 * (q - .5), Z = .97 - .025 * u + .03 * q;
			};
			case `slate`: return () => {
				let e = noise(W, G, 5, 4, r ^ 16743), t = noise(W + .025 * e, G + .018 * e, 3, 22, r ^ 29723) * 5, n = (Math.floor(t) + smooth(clamp((fract(t) - .35) / .3))) / 5, i = noise(W, G, 12, 5, r ^ 4955), a = (1 - Math.abs(2 * fract(t) - 1)) ** 8 * smooth(clamp((i - .18) / .35));
				J = .14 + .62 * n + .14 * q - .12 * a, Y = .72 * n + .1 * q - .18 * a, X += .1 * a + .1 * (q - .5), Z = .98 - .15 * a + .02 * q;
			};
			case `terrazzo`: return () => {
				let e = W * 9, t = G * 9, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + l, p = (d % 9 + 9) % 9, m = (f % 9 + 9) % 9, h = hash(p, m, r ^ 37499), g = hash(p, m, r ^ 13341) * n, _ = Math.cos(g), v = Math.sin(g), y = e - d - .3 - .4 * hash(p, m, r), b = t - f - .3 - .4 * hash(p, m, r ^ 40503), x = y * _ + b * v, S = b * _ - y * v, C = .75 + .25 * hash(p, m, r ^ 8623), w = Math.max(Math.abs(x) * C, Math.abs(S), (x * .65 + S * .76) * 1.1, (-x * .83 + S * .55) * 1.15), E = smooth(clamp((.26 + .18 * h - w) / .025));
					o = Math.max(o, E), s += E * (.08 + .7 * hash(p, m, r ^ 22815)), c += E;
				}
				let l = s / Math.max(c, 1e-12);
				J = (.88 + .06 * K) * (1 - o) + o * l, Y = .15 + .06 * o + .015 * K + .025 * q, X += .055 * (1 - o) - .03 * o * l + .04 * (q - .5), Z = .98 + .015 * o + .005 * q;
			};
			case `denim`: return () => {
				let e = W * 24, t = G * 24, i = .5 + .5 * Math.cos(n * e), o = .5 + .5 * Math.cos(n * t), s = 1 - smooth(clamp((Math.abs(Math.sin(Math.PI * (e - t) / 4)) - .24) / .22)), c = .5 + .5 * Math.sin(n * (96 * W + .12 * K) + a), l = .5 + .5 * Math.sin(n * (96 * G + .12 * K) + a), u = c * (1 - s) + l * s, d = i * (1 - s) + o * s, f = noise(W, G, 24, 4, r ^ 27953);
				J = .12 + .22 * d + .34 * s + .1 * u + .12 * f, Y = .42 * d + .24 * (1 - s) + .06 * u + .08 * f, X += .06 * (K - .5) + .04 * (1 - d), Z = .78 + .18 * d + .04 * u;
			};
			case `houndstooth`: return () => {
				let e = 32 * W, t = 32 * G, r = Math.floor(e) % 8, i = Math.floor(t) % 8, o = smooth(fract(e)), s = smooth(fract(t)), c = (r + 1) % 8, l = (i + 1) % 8, u = De[i * 8 + r], d = De[i * 8 + c], f = De[l * 8 + r], p = De[l * 8 + c], m = (u + (d - u) * o) * (1 - s) + (f + (p - f) * o) * s, h = .5 + .5 * Math.cos(n * (e - t) / 4), g = .5 + .5 * Math.cos(n * e), _ = .5 + .5 * Math.cos(n * t), v = g * h + _ * (1 - h), y = .5 + .25 * Math.cos(n * 96 * W + a) + .25 * Math.cos(n * 96 * G - a);
				J = .025 + .88 * m + .045 * v + .03 * K, Y = .2 + .19 * v + .025 * y + .02 * K, X += .04 * (K - .5) + .025 * (1 - v), Z = .86 + .12 * v;
			};
			case `tartan`: return () => {
				let e = 2 * W, t = 2 * G, r = smooth(clamp((Math.cos(n * e) + .15) / .55)), i = smooth(clamp((Math.cos(n * t) + .15) / .55)), a = smooth(clamp((Math.cos(n * (e + .25)) - .96) / .04)), o = smooth(clamp((Math.cos(n * (t + .25)) - .96) / .04)), s = smooth(clamp((Math.cos(n * 2 * e) - .9) / .1)), c = smooth(clamp((Math.cos(n * 2 * t) - .9) / .1)), l = .13 + .35 * r + .36 * a + .1 * s, u = .13 + .35 * i + .36 * o + .1 * c, d = smooth(clamp(.5 + .8 * Math.cos(Math.PI * 64 * (W + G)))), f = .5 + .5 * Math.cos(n * 64 * W), p = .5 + .5 * Math.cos(n * 64 * G), m = f * d + p * (1 - d);
				J = l * d + u * (1 - d) + .045 * m + .025 * K, Y = .2 + .16 * m + .025 * K, X += .04 * (K - .5) + .03 * (1 - m), Z = .85 + .13 * m;
			};
			case `goldbrocade`:
			case `damask`: return () => {
				let e = fract(2 * W + .5) - .5, r = fract(2 * G + .5) - .5, i = 1, o = 1;
				for (let t = 0; t < 12; t++) {
					let n = t * 6, a = e - Oe[n], s = r - Oe[n + 1], c = Oe[n + 2], l = Oe[n + 3], u = (a * c + s * l) * Oe[n + 4], d = (s * c - a * l) * Oe[n + 5], f = clamp(1 - u * u - d * d);
					i *= 1 - smooth(clamp(f / .28)), o *= 1 - f * f;
				}
				let s = 1 - i, c = 1 - o, l = .5 + .5 * Math.cos(n * 64 * W), u = .5 + .5 * Math.cos(n * 64 * G), d = (l + u) * .5;
				if (t === `goldbrocade`) {
					let e = l + u - l * u, t = s * e;
					if (J = .03 + .025 * e + .01 * K, Y = .12 + .04 * e + .004 * K, X += .08 * (1 - e) + .025 * K, Z = .85 + .1 * e, $ = t, t === 0) return;
					let r = .5 + .5 * Math.cos(n * (16 * W - 16 * G) + a);
					J += t * (.9 + .07 * c + .02 * d - J), Y += t * (.4 + .12 * c + .02 * d + .01 * r - Y), X += t * (.25 - .04 * c + .015 * r - X), Z += t * (.99 - Z);
					return;
				}
				let f = .5 + .5 * Math.cos(n * (16 * W - 16 * G) + a);
				J = .19 + .48 * s + .08 * c + .07 * d + .025 * K, Y = .18 + .3 * s + .13 * c + .025 * d + .015 * s * f, X += .055 * (1 - s) - .035 * s * f + .025 * (K - .5), Z = .88 + .07 * s + .03 * d;
			};
			case `herringbone`: return () => {
				let e = 32 * W, t = 32 * G, i = Math.acos(.995 * Math.cos(n * 2 * W)) / Math.PI, o = smooth(clamp((.5 + .5 * Math.cos(n * (2 * i - 8 * G) + a) - .2) / .6)), s = .5 + .5 * Math.cos(n * e), c = .5 + .5 * Math.cos(n * t), l = s * (1 - o) + c * o, u = (.5 + .5 * Math.sin(n * 128 * W + a)) * (1 - o) + (.5 + .5 * Math.sin(n * 128 * G - a)) * o, d = noise(W, G, 16, 8, r ^ 15385);
				J = .17 + .31 * o + .26 * l + .1 * u + .09 * d, Y = .25 + .24 * l + .07 * o + .035 * u + .025 * d, X += .055 * (K - .5) + .035 * (1 - l), Z = .84 + .12 * l + .025 * u;
			};
			case `tweed`: return () => {
				let e = 20 * W, t = 20 * G, i = smooth(clamp((Math.cos(n * e) + .45) / 1.25)), o = smooth(clamp((Math.cos(n * t) + .45) / 1.25)), s = smooth(clamp(.5 + .85 * Math.cos(Math.PI * (e + t)))), c = i * (1 - o + o * s), l = o * (1 - i + i * (1 - s)), u = c + l, d = c * noise(W, G, 20, 4, r ^ 15127) + l * noise(W, G, 4, 20, r ^ 28201), f = c * (.5 + .5 * Math.sin(n * (80 * W + .15 * K) + a)) + l * (.5 + .5 * Math.sin(n * (80 * G + .15 * K) - a)), p = W * 24, m = G * 24, h = Math.floor(p), g = Math.floor(m), _ = 0, v = .12 + .29 * u + .34 * d + .12 * f;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = h + t, i = g + e, a = (n % 24 + 24) % 24, o = (i % 24 + 24) % 24, s = hash(a, o, r ^ 11635), c = p - n - .25 - .5 * hash(a, o, r), l = m - i - .25 - .5 * hash(a, o, r ^ 23089), u = (s < .5 ? 0 : Math.PI / 2) + (s - .5) * .7, d = Math.cos(u), f = Math.sin(u), y = (c * d + l * f) / (.18 + .2 * s), b = (l * d - c * f) / .075, x = clamp(1 - y * y - b * b), S = x * x;
					_ += S, v += S * (.18 + .64 * hash(a, o, r ^ 32537) - v);
				}
				J = v, Y = .2 + .28 * u + .08 * i * o + .05 * f + .055 * _, X += .05 * (K - .5) + .025 * _, Z = .77 + .19 * u + .025 * f;
			};
			case `seersucker`: return () => {
				let e = smooth(clamp((Math.cos(n * 4 * W) + .25) / .75)), t = .5 + .5 * Math.cos(n * 48 * W), i = .5 + .5 * Math.cos(n * 48 * G), o = .5 + .5 * Math.cos(Math.PI * 48 * (W + G)), s = t * o + i * (1 - o), c = .5 + .25 * Math.sin(n * 144 * W + a) + .25 * Math.sin(n * 144 * G - a), l = noise(W, G, 4, 4, r ^ 19513), u = .5 + .5 * Math.sin(n * (12 * G + .22 * Math.sin(n * 4 * W) + .3 * l) + a);
				J = .71 - .39 * e + .12 * s + .055 * c + .04 * e * u, Y = .22 + .035 * s + .008 * c + e * (.08 + .2 * u), X += .045 * (K - .5) + .025 * e * (1 - u), Z = .96 - .07 * e * (1 - u) + .02 * s;
			};
			case `burlap`: return () => {
				let e = W * 10, t = G * 10, r = smooth(clamp((Math.cos(n * e) + .35) / 1.1)), i = smooth(clamp((Math.cos(n * t) + .35) / 1.1)), o = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (e + t)))), s = r * (1 - i + i * o), c = i * (1 - r + r * (1 - o)), l = s + c, u = .5 + .5 * Math.sin(n * (50 * W + .14 * K) + a), d = .5 + .5 * Math.sin(n * (50 * G + .14 * K) + a), f = s * u + c * d, p = r * i;
				J = .04 + .65 * l + .14 * f + .1 * K * l, Y = .58 * l + .2 * p + .08 * f + .04 * K, X += .05 * (K - .5) + .025 * (1 - l), Z = .42 + .54 * l + .04 * f;
			};
			case `carpet`: return () => {
				let e = W * 24, t = G * 24, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0, l = 0;
				for (let u = -1; u <= 1; u++) for (let d = -1; d <= 1; d++) {
					let f = i + d, p = a + u, m = (f % 24 + 24) % 24, h = (p % 24 + 24) % 24, g = e - f - .35 - .3 * hash(m, h, r), _ = t - p - .35 - .3 * hash(m, h, r ^ 40503), y = clamp(1 - (g * g + _ * _)) ** 3, b = hash(m, h, r ^ 10571), x = hash(m, h, r ^ 26655) * n, S = (.5 + .5 * Math.sin(n * 3 * (g * Math.cos(x) + _ * Math.sin(x)) + b * n)) ** 4;
					o += y, s += y * b, c += y * S, l = Math.max(l, y * (.75 + .25 * b));
				}
				let u = 1 / Math.max(o, 1e-12), d = s * u, f = c * u;
				J = .19 + .4 * d + .2 * l + .13 * f + .08 * K, Y = .3 + .38 * l + .12 * f + .1 * K, X += .04 * (K - .5) - .035 * f, Z = .7 + .22 * Math.sqrt(l) + .06 * f;
			};
			case `plaster`: return () => {
				let e = noise(W, G, 3, 3, r ^ 14241), t = (.5 + .5 * Math.sin(n * (3 * W + 2 * G + .7 * e) + a)) ** 10, i = noise(W, G, 18, 5, r ^ 21721), o = smooth(clamp((.32 - q) / .23));
				J = .61 + .2 * e + .08 * i + .07 * t - .12 * o, Y = .22 + .28 * e + .18 * t + .08 * i - .14 * o, X += .1 * (q - .5) - .065 * t + .045 * o, Z = .98 - .1 * o - .025 * t;
			};
			case `terracotta`: return () => {
				let e = noise(W, G, 5, 5, r ^ 14871), t = noise(W + .04 * e, G, 12, 9, r ^ 32035), i = 1 - smooth(clamp((wrappedFeature(W, G, 28, r ^ 18541) - .04) / .19)), a = smooth(clamp((e - .5) / .3));
				J = .37 + .46 * t + .15 * K - .18 * a - .17 * i, Y = .35 + .14 * K + .12 * q - .3 * i, X += .1 * (q - .5) + .07 * i - .04 * a, Z = .97 - .22 * i + .025 * q;
			};
			case `cork`: return () => {
				let e = W * 14, t = G * 14, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0, l = 0;
				for (let u = -1; u <= 1; u++) for (let d = -1; d <= 1; d++) {
					let f = i + d, p = a + u, m = (f % 14 + 14) % 14, h = (p % 14 + 14) % 14, g = e - f - .35 - .3 * hash(m, h, r), _ = t - p - .35 - .3 * hash(m, h, r ^ 40503), v = n * hash(m, h, r ^ 19745), y = g * Math.cos(v) + _ * Math.sin(v), b = _ * Math.cos(v) - g * Math.sin(v), S = clamp(1 - (.9 * y * y + 1.3 * b * b) / 1.21) ** 8, C = hash(m, h, r ^ 5931), w = (.5 + .5 * Math.sin(n * (5 * b + .3 * y) + n * C)) ** 12;
					o += S, s += S * C, l += S * w, c = Math.max(c, S);
				}
				let u = 1 / Math.max(o, 1e-12), d = s * u, f = l * u, p = 1 - smooth(clamp((c * u - .48) / .4));
				J = .31 + .57 * d + .12 * K - .22 * p - .09 * f, Y = .4 + .16 * d + .07 * q - .2 * p - .07 * f, X += .07 * (q - .5) + .045 * p - .025 * d, Z = .97 - .18 * p - .08 * f;
			};
			case `studdedrubber`: return () => {
				let e = W * 6, t = G * 6, n = fract(e) - .5, a = fract(t) - .5, s = 1 - smooth(clamp((Math.sqrt(n * n + a * a) - .24) / .12)), c = Xe[Math.floor(t) * 6 + Math.floor(e)], l = noise(W, G, 144, 144, r ^ 18867);
				J = .24 + .16 * s + .06 * s * c + .05 * l, Y = .16 + .66 * s + .002 * l, X = i.roughness + .04 * (l - .5), Z = .84 + .16 * s;
			};
			case `groovedrubber`: return () => {
				let e = W * 12, n = 1 - smooth(clamp((Math.abs(fract(e) - .5) - .32) / .13)), a = Ze[Math.floor(e)], o = noise(W, G, 144, 144, r ^ 28193);
				J = .18 + .29 * n + .04 * n * a + .035 * o, Y = .15 + .7 * n + .0015 * o, X = i.roughness + .035 * (o - .5), Z = .7 + .3 * n;
			};
			case `recycledrubber`: return () => {
				let e = W * 48, t = G * 48, n = Math.floor(e), a = Math.floor(t), o = 0, s = 0;
				for (let r = -1; r <= 1; r++) for (let i = -1; i <= 1; i++) {
					let c = n + i, l = a + r, u = ((l + 48) % 48 * 48 + (c + 48) % 48) * 18, d = e - c - Qe[u], f = t - l - Qe[u + 1], p = 1;
					for (let e = 0; e < 5; e++) {
						let t = u + 3 + e * 3, n = Qe[t + 2] - d * Qe[t] - f * Qe[t + 1];
						p *= smooth(clamp(n / .14));
					}
					o += p, s += p * Qe[u + 2];
				}
				let c = 1 - Math.exp(-2 * o), l = noise(W, G, 144, 144, r ^ 15239);
				J = .035 + .59 * c + .22 * s / (1 + o), Y = .25 + .18 * c + .002 * l, X = i.roughness - .06 * c + .02 * l, Z = .83 + .17 * c;
			};
			case `rubber`: return () => {
				let t = 1 - smooth(clamp((wrappedFeature(W, G, 44, r ^ 36435) - .08) / .55));
				J = .19 + .38 * t + .19 * q + .1 * K, Y = .19 + .49 * t + .15 * q + .06 * K, X += .12 * (q - .5) - .045 * t, Z = .9 + .08 * t + .02 * q;
			};
			case `carbonfiber`: return () => {
				let e = 12 * (W + G), t = 12 * (G - W), r = .5 + .5 * Math.cos(n * e), i = .5 + .5 * Math.cos(n * t), o = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (e - t) / 2))), s = .5 + .5 * Math.sin(n * (4 * e + .08 * K) + a), c = .5 + .5 * Math.sin(n * (4 * t + .08 * K) + a), l = r * o + i * (1 - o), u = s * o + c * (1 - o);
				J = .12 + .46 * l + .2 * u + .12 * K, Y = .25 + .37 * l + .055 * u + .04 * K, X += .065 * (K - .5) + .045 * (1 - l), Z = .88 + .1 * l + .02 * u;
			};
			case `diamondplate`: return () => {
				let e = W * 8, t = G * 8, n = fract(e) - .5, i = fract(t) - .5, a = (Math.floor(e) + Math.floor(t)) % 2 == 0 ? 1 : -1, o = (n + a * i) * Math.SQRT1_2, s = (i - a * n) * Math.SQRT1_2, l = smooth(clamp((1 - (Math.abs(o) / .48 + Math.abs(s) / .14)) / .24)), u = noise(W, G, 4, 64, r ^ 13793);
				J = .35 + .25 * u + .29 * l + .07 * K, Y = .08 + .78 * l + .025 * u, X += .14 * (u - .5) - .075 * l, Z = .94 + .05 * l + .01 * K;
			};
			case `knurledmetal`: return () => {
				let e = smooth(.5 - .5 * Math.cos(n * 24 * (W + G))) * smooth(.5 - .5 * Math.cos(n * 24 * (W - G)));
				J = .29 + .48 * e + .16 * K, Y = .12 + .72 * e + .025 * K, X += .1 * (K - .5) + .07 * (1 - e), Z = .85 + .14 * e;
			};
			case `engineturned`: return () => {
				let e = W * 6, t = G * 6, r = Math.floor(e), i = Math.floor(t), a = 0, o = 0, s = 0;
				for (let c = -1; c <= 1; c++) for (let l = -1; l <= 1; l++) {
					let u = r + l, d = i + c, f = (u % 6 + 6) % 6, p = (d % 6 + 6) % 6, m = e - u - .25 - p % 2 * .5, h = t - d - .5, g = m * m + h * h, _ = Math.max(0, 1 - g / .9025), v = _ * _, y = (p * 6 + f) * 2, b = Ne[y], x = .5 + .5 * Math.cos(n * (10 * g + b + .18 * m * h));
					a += v, o += v * x, s += v * Ne[y + 1];
				}
				o /= a, s /= a, J = .35 + .34 * s + .22 * o + .04 * K, Y = .44 + .07 * o + .025 * K, X += .18 * (o - .5) + .12 * (s - .5), Z = .98 + .015 * o;
			};
			case `goldleaf`: return () => {
				let e = noise(W, G, 4, 5, r ^ 19843), t = W + .035 * Math.sin(n * G * 3 + a), i = G + .03 * Math.sin(n * W * 4 + a), o = noise(t, i, 4, 5, r ^ 7769), s = smooth(clamp((Math.cos(n * 4 * t) - .92) / .08)), c = smooth(clamp((Math.cos(n * 5 * i) - .92) / .08)), l = s + (1 - s) * c, u = (.5 + .5 * Math.cos(n * (18 * W + 7 * G + 1.7 * e) + a)) ** 8, d = (.5 + .5 * Math.cos(n * (5 * W - 21 * G + 1.3 * o) - a)) ** 10, f = .6 * u + .4 * d;
				J = .4 + .3 * o + .19 * f - .1 * l, Y = .36 + .34 * f + .065 * l + .04 * K, X += .12 * (o - .5) + .11 * f + .025 * l, Z = .99 - .065 * f - .025 * l;
			};
			case `paper`: return () => {
				let e = noise(W, G, 3, 5, r ^ 33207), t = noise(W, G, 48, 48, r ^ 22483), i = W * 24, a = G * 24, o = Math.floor(i), s = Math.floor(a), c = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let l = o + t, u = s + e, d = (l % 24 + 24) % 24, f = (u % 24 + 24) % 24, p = i - l - .35 - .3 * hash(d, f, r), m = a - u - .35 - .3 * hash(d, f, r ^ 6463), h = n * hash(d, f, r ^ 29409), g = p * Math.cos(h) + m * Math.sin(h), _ = m * Math.cos(h) - p * Math.sin(h), v = .42 + .28 * hash(d, f, r ^ 23337), b = clamp(1 - (g * g / (v * v) + _ * _ / .0064)) ** 2;
					c = Math.max(c, b);
				}
				J = .62 + .24 * e + .1 * t - .2 * c, Y = .22 + .12 * e + .22 * t + .3 * c, X += .08 * (t - .5) + .04 * c, Z = .98 - .07 * c - .035 * (1 - t);
			};
			case `reedmat`: return () => {
				let e = W * 16, t = Math.floor(e), r = (fract(e) - .5) / .46, i = smooth(clamp(1 - r * r)), o = Ve[t * 2], s = Ve[t * 2 + 1], c = .5 + .5 * Math.sin(n * e * 7 + .2 * Math.sin(n * G * 3) + s), l = smooth(clamp(1 - (1 - Math.cos(n * G * 4)) / .055)), u = .5 + .5 * Math.cos(n * W * 96 + a);
				J = .15 + i * (.38 + .14 * o + .09 * c) + l * (.12 + .04 * u), Y = .1 + i * (.46 + .055 * o + .018 * c) + l * (.24 + .015 * u), X += .06 * (1 - i) - .035 * i * c + .025 * l, Z = .56 + .32 * i + .07 * l;
			};
			case `rope`: return () => {
				let e = W * 6, t = Math.floor(e), r = fract(e) - .5, i = smooth(clamp(1 - (r / .48) ** 2)), a = Ve[t * 2], o = Ve[t * 2 + 1], s = n * (3 * r - 6 * G) + o, c = .5 + .5 * Math.cos(s), l = .5 + .5 * Math.cos(s * 9 + .15 * Math.sin(n * G * 2));
				J = .13 + i * (.3 + .14 * a + .23 * c + .06 * l), Y = .08 + i * (.34 + .32 * c + .018 * l), X += .065 * (1 - i) + i * (.025 - .045 * l), Z = .43 + i * (.35 + .17 * c);
			};
			case `straw`: return () => {
				let e = W * 8, t = G * 8, n = Math.floor(e), r = Math.floor(t);
				J = .17 + .07 * K, Y = .15 + .015 * K, Z = .55 + .035 * K;
				for (let a = 0; a < 3; a++) for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = r + o, u = ((a * 8 + (l % 8 + 8) % 8) * 8 + (c % 8 + 8) % 8) * 9, d = e - c - He[u], f = t - l - He[u + 1], p = (d * He[u + 2] + f * He[u + 3]) / He[u + 4], m = (f * He[u + 2] - d * He[u + 3]) / He[u + 5], h = smooth(clamp((1 - p * p) / .24)) * smooth(clamp(1 - m * m));
					if (h === 0) continue;
					let g = He[u + 6], _ = .5 + .5 * Math.cos(12 * m + He[u + 7]), v = He[u + 8] > .6 ? smooth(clamp(1 - ((p - .2) / .065) ** 2)) : 0;
					J = J * (1 - h) + h * (.48 + .26 * g + .07 * _ - .13 * v), Y = Y * (1 - h) + h * (.51 + .06 * a + .04 * g + .018 * _ + .055 * v), X = X * (1 - h) + h * (i.roughness - .04 * _ + .025 * v), Z = Z * (1 - h) + h * (.91 + .045 * _);
				}
			};
			case `wicker`: return () => {
				let e = W * 6, t = G * 6, i = .5 + .5 * Math.cos(n * e), a = .5 + .5 * Math.cos(n * t), o = smooth(clamp((Math.cos(n * e) + .92) / .3)), s = smooth(clamp((Math.cos(n * t) + .92) / .3)), c = smooth(clamp(.5 + 1.4 * Math.cos(Math.PI * e) * Math.cos(Math.PI * t))), l = o * (1 - s + s * c), u = s * (1 - o + o * (1 - c)), d = l + u, f = noise(W, G, 72, 4, r ^ 28465), p = noise(W, G, 4, 72, r ^ 10903), m = l * f + u * p, h = l * i + u * a;
				J = .08 + .5 * d + .16 * h + .18 * m, Y = .04 + .48 * d + .32 * h + .045 * m, X += .1 * (K - .5) + .1 * (1 - d) - .04 * m, Z = .34 + .54 * d + .1 * h;
			};
			case `bamboo`: return () => {
				let e = noise(W, G, 64, 4, r ^ 19313), t = noise(W, G, 4, 3, r ^ 26909), i = .5 + .5 * Math.sin(n * (48 * W + .22 * t) + a), o = noise(W, 0, 4, 1, r ^ 10453), s = 1 - Math.cos(n * (3 * G + .65 * o + .07 * Math.sin(n * 4 * W)) + a), c = 1 - smooth(clamp(s / .16)), l = 1 - smooth(clamp(s / .42));
				J = .46 + .23 * e + .16 * i + .08 * K - .34 * c, Y = .3 + .14 * e + .12 * i + .16 * l - .1 * c, X += .12 * c + .1 * (e - .5) - .035 * i, Z = .99 - .14 * c - .025 * (1 - e);
			};
			case `hammeredmetal`: return () => {
				let e = W * 12, t = G * 12, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 12 + 12) % 12, d = (l % 12 + 12) % 12, f = e - c - .35 - .3 * hash(u, d, r), p = t - l - .35 - .3 * hash(u, d, r ^ 29339), m = .85 + .25 * hash(u, d, r ^ 6461), h = clamp(1 - (f * f + p * p) / (m * m));
					a += h * h * (.7 + .3 * hash(u, d, r ^ 23063));
				}
				let o = 1 - Math.exp(-1.6 * a), s = noise(W, G, 4, 4, r ^ 20001);
				J = .72 - .32 * o + .14 * s + .045 * K, Y = .85 - .7 * o + .008 * K, X += .1 * (s - .5) + .09 * o, Z = .99 - .12 * o;
			};
			case `galvanized`: return () => {
				let e = W * 10, t = G * 10, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + l, p = (d % 10 + 10) % 10, m = (f % 10 + 10) % 10, h = e - d - .35 - .3 * hash(p, m, r), g = t - f - .35 - .3 * hash(p, m, r ^ 15225), _ = n * hash(p, m, r ^ 22435), v = h * Math.cos(_) + g * Math.sin(_), y = g * Math.cos(_) - h * Math.sin(_), b = clamp(1 - (h * h + g * g) / 1.21) ** 8, x = hash(p, m, r ^ 18897), S = .5 + .5 * Math.cos(n * (3 * y + 1.5 * Math.abs(v)));
					o += b, s += b * x, c += b * S;
				}
				let l = 1 / Math.max(o, 1e-12), u = s * l, d = c * l;
				J = .18 + .65 * u + .12 * d + .035 * K, Y = .3 + .18 * u + .035 * d + .015 * K, X += .24 * (u - .5) + .045 * (d - .5), Z = .98 + .02 * u;
			};
			case `corrugatedmetal`: return () => {
				let e = .5 + .5 * Math.cos(n * 8 * W + a), t = noise(W, G, 64, 4, r ^ 8043), i = (.5 + .5 * Math.sin(n * 48 * W + a)) ** 12;
				J = .5 + .2 * e + .16 * t - .06 * i, Y = .1 + .8 * e + .004 * t - .002 * i, X += .13 * (t - .5) + .06 * i, Z = .91 + .08 * e;
			};
			case `perforatedmetal`: return () => {
				let e = W * 6, t = G * 6, n = Math.floor(e), r = Math.floor(t), i = 0;
				for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = r + a, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, p = smooth(clamp((.3 - Math.sqrt(u * u + d * d)) / .12));
					i += (1 - i) * p;
				}
				J = .62 + .1 * K - .44 * i, Y = .82 - .62 * i + .03 * K, X += .07 * i + .04 * (K - .5), Z = 1 - .78 * i;
			};
			case `expandedmetal`: return () => {
				let e = smooth(clamp((Math.cos(n * 5 * (W + G)) - .1) / .9)), t = smooth(clamp((Math.cos(n * 5 * (W - G)) - .1) / .9)), r = e + t - e * t, i = e * t, a = 1 - r;
				J = .7 + .1 * K - .42 * a, Y = .22 + .6 * r + .09 * i + .025 * K, X += .08 * a + .03 * (K - .5), Z = .34 + .62 * r;
			};
			case `wiremesh`: return () => {
				let e = W * 12, t = G * 12, cap = (e) => {
					let t = clamp(1 - e * e);
					return t * t;
				}, n = cap((fract(e) - .5) / .34), r = cap((fract(t) - .5) / .34), i = .5 + .5 * Math.cos(Math.PI * (e - t)), a = n * i + r * (1 - i), o = (r * i + n * (1 - i)) * (1 - a);
				J = .3 + .46 * a + .2 * o + .08 * K, Y = .08 + .78 * a + .34 * o + .03 * K, X += .04 * (1 - a) + .03 * (K - .5), Z = .36 + .56 * a + .18 * o;
			};
			case `velvet`: return () => {
				let e = noise(W, G, 5, 5, r ^ 31793), t = noise(W, G, 3, 9, r ^ 10775), n = noise(W, G, 96, 96, r ^ 24365);
				J = .3 + .32 * e + .12 * n, Y = .42 + .06 * e + .05 * n, X += .12 * (e - .5) + .035 * (t - .5), Z = .92 + .06 * e;
			};
			case `terrycloth`: return () => {
				let e = W * 10, t = G * 8, n = Math.floor(e), r = Math.floor(t), i = 0;
				for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = r + a, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, p = clamp(1 - (Math.sqrt(u * u + d * d) / .36) ** 2);
					i += (1 - i) * p * p;
				}
				J = .42 + .3 * i + .16 * K, Y = .3 + .62 * i + .05 * K, X += .05 * (K - .5) - .03 * i, Z = .62 + .35 * i;
			};
			case `boucle`: return () => {
				let e = W * 8, t = G * 6, n = Math.floor(e), i = Math.floor(t), o = clamp(1 - ((fract(t) - .5) / .36) ** 2), s = o * o, c = 0;
				for (let a = -1; a <= 1; a++) for (let o = -1; o <= 1; o++) {
					let s = n + o, l = i + a, u = (s % 8 + 8) % 8, d = (l % 6 + 6) % 6, f = e - s - .5 - .3 * (hash(u, d, r ^ 27181) - .5), p = t - l - .5 - .18 * (hash(u, d, r ^ 13297) - .5), h = clamp(1 - ((Math.sqrt(f * f + p * p) - .16) / .075) ** 2);
					c += (1 - c) * h * h;
				}
				let l = 1 - s;
				J = .36 + .34 * s + .14 * c + .12 * K, Y = .16 + .5 * s + .26 * c + .04 * K, X += .06 * l + .03 * (K - .5), Z = .58 + .3 * s + .1 * c;
			};
			case `geode`: return () => {
				let e = fract(W) - .5, t = fract(G) - .5, i = Math.sin(Math.PI * e) / Math.PI, o = Math.sin(Math.PI * t) / Math.PI, s = Math.sqrt(i * i + o * o), c = noise(W, G, 6, 6, r ^ 15383), l = .5 + .5 * smooth(clamp((s - .1) / .08)) * Math.cos(n * (9 * s + .12 * c) + a), u = smooth(clamp((.17 - s) / .05)) * noise(W, G, 48, 48, r ^ 22817);
				J = .3 + .3 * l + .22 * u + .12 * K, Y = .3 + .3 * l + .2 * u + .03 * K, X += .1 * (1 - l) + .08 * u + .03 * (K - .5), Z = .72 + .22 * l + .04 * u;
			};
			case `quartz`: return () => {
				let e = W * 5, t = G * 5, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 5 + 5) % 5, f = (u % 5 + 5) % 5, p = l + .5 + .24 * (hash(d, f, r ^ 19489) - .5), m = u + .5 + .24 * (hash(d, f, r ^ 29107) - .5), h = e - p, g = t - m, _ = 1;
					for (let e = 0; e < 6; e++) {
						let t = Math.PI / 3 * e + .22 * (hash(d, f, r ^ 23927) - .5), n = Math.abs(h * Math.cos(t) + g * Math.sin(t));
						_ *= smooth(clamp((.3 - n) / .055));
					}
					let v = .34 + .42 * hash(d, f, r ^ 12057), b = clamp(1 - (Math.sqrt(h * h + g * g) / .21) ** 2);
					a += (1 - a) * _, o += (1 - o) * _ * (v + .24 * b * b);
				}
				J = .52 + .26 * o + .12 * K, Y = .16 + .72 * o + .03 * K, X += .1 * (1 - a) + .03 * (K - .5), Z = .5 + .46 * a;
			};
			case `pyrite`: return () => {
				let e = W * 5, t = G * 5, i = Math.floor(e), o = Math.floor(t), s = 0, c = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let l = i + a, u = o + n, d = (l % 5 + 5) % 5, f = (u % 5 + 5) % 5, p = l + .5 + .2 * (hash(d, f, r ^ 7233) - .5), m = u + .5 + .2 * (hash(d, f, r ^ 16167) - .5), h = .28 * (hash(d, f, r ^ 27485) - .5), g = Math.cos(h), _ = Math.sin(h), v = e - p, y = t - m, b = Math.abs(v * g + y * _), x = Math.abs(y * g - v * _), S = smooth(clamp((.32 - b) / .05)) * smooth(clamp((.32 - x) / .05)), C = .3 + .45 * hash(d, f, r ^ 20911);
					s += (1 - s) * S, c += (1 - c) * S * C;
				}
				let l = .5 + .5 * Math.cos(n * 26 * (W + G) + a), u = s * smooth(l);
				J = .5 + .24 * c + .1 * u + .1 * K, Y = .18 + .6 * c + .06 * u + .03 * K, X += .07 * (1 - u) + .03 * (K - .5), Z = .52 + .42 * s;
			};
			case `shiplap`: return () => {
				let e = G * 5, t = (Math.floor(e) % 5 + 5) % 5, i = smooth(clamp((.07 - (.5 - Math.abs(fract(e) - .5))) / .05)), a = .5 + .36 * hash(t, 0, r ^ 11361) * (1 - i), o = noise(W, G, 48, 6, r ^ 18361), s = noise(W, G, 12, 2, r ^ 27939);
				J = .24 + .36 * a + .16 * o + .1 * s - .18 * i, Y = .72 - .5 * i + .08 * o + .03 * s, X += .05 * (o - .5) + .06 * i, Z = 1 - .55 * i;
			};
			case `glassblock`: return () => {
				let e = W * 4, t = G * 4, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 4 + 4) % 4, f = (u % 4 + 4) % 4, p = e - l - .5, m = t - u - .5, h = smooth(clamp((.42 - Math.abs(p)) / .05)) * smooth(clamp((.42 - Math.abs(m)) / .05)), g = p - .2 * (hash(d, f, r ^ 20935) - .5), _ = m - .2 * (hash(d, f, r ^ 30881) - .5), y = clamp(1 - (Math.sqrt(g * g + _ * _) / .07) ** 2), b = y * y;
					a += (1 - a) * h, o += (1 - o) * h * b;
				}
				J = .55 + .2 * a + .12 * o + .1 * K, Y = .24 + .6 * a + .05 * o + .02 * K, X += .12 * (1 - a) - .03 * o, Z = .45 + .5 * a;
			};
			case `thatch`: return () => {
				let e = G * 6, t = .5 + .5 * Math.cos(n * (fract(e) - .25) + .5 * noise(W, G, 3, 6, r ^ 7499)), i = noise(W, G, 80, 6, r ^ 16269), a = smooth(clamp((.14 - Math.abs(fract(e) - .73)) / .07));
				J = .3 + .32 * t + .18 * i + .1 * K - .12 * a, Y = .32 + .36 * t + .22 * i - .3 * a, X += .05 * (i - .5) + .05 * a, Z = .68 + .28 * t - .3 * a;
			};
			case `charredwood`: return () => {
				let e = W * 9, t = G * 9, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 9 + 9) % 9, d = (l % 9 + 9) % 9, f = e - c - .5 - .24 * (hash(u, d, r ^ 18967) - .5), p = t - l - .5 - .24 * (hash(u, d, r ^ 29629) - .5), h = smooth(clamp((.36 - Math.sqrt(f * f + p * p)) / .08));
					a += (1 - a) * h;
				}
				let o = noise(W, G, 64, 64, r ^ 12113);
				J = .12 + .24 * a + .14 * o, Y = .2 + .66 * a + .05 * o, X += .08 * (1 - a) + .03 * (o - .5), Z = .36 + .6 * a;
			};
			case `driftwood`: return () => {
				let e = noise(W, G, 4, 3, r ^ 7307), t = noise(W, G, 64, 3, r ^ 21985), n = noise(W, G, 12, 2, r ^ 14767), i = fract(G * 7 + .12 * e), o = smooth(clamp((.1 - Math.min(i, 1 - i)) / .05));
				J = .42 + .26 * t + .12 * n - .24 * o, Y = .62 + .18 * t + .04 * n - .5 * o, X += .06 * (t - .5) + .08 * o, Z = 1 - .62 * o;
			};
			case `peelingpaint`: return () => {
				let e = noise(W, G, 5, 5, r ^ 28461), t = smooth(clamp((noise(W, G, 3, 3, r ^ 19313) - .55) / .08)), n = 4 * t * (1 - t), i = noise(W, G, 40, 40, r ^ 10963), a = 1 - t;
				J = .66 * a + .3 * t + .16 * n + .1 * i * t + .12 * (.5 + .5 * e) * a, Y = .24 + .42 * a + .3 * n + .05 * i, X += .12 * t + .05 * (i - .5), Z = .52 + .36 * a + .16 * n;
			};
			case `tiretread`: return () => {
				let e = W * 4, t = G * 6, r = Math.floor(e), i = Math.floor(t), a = 0;
				for (let n = -1; n <= 1; n++) for (let o = -1; o <= 1; o++) {
					let s = r + o, c = i + n, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, f = smooth(clamp((.34 - Math.abs(u)) / .06)) * smooth(clamp((.32 - Math.abs(d)) / .06));
					a += (1 - a) * f;
				}
				let o = smooth(clamp((Math.abs(Math.sin(n * 2 * (e + .25 * t))) - .12) / .12));
				J = .18 + .24 * a - .08 * o * a + .1 * K, Y = .22 + .58 * a - .12 * o * a + .03 * K, X += .06 * (1 - a) + .03 * (K - .5), Z = .42 + .52 * a - .1 * o * a;
			};
			case `honeycomb`: return () => {
				let e = Math.sqrt(3), t = W * 5, n = G * 4, i = Math.floor(t), a = Math.floor(n), o = 0;
				for (let r = -1; r <= 1; r++) for (let s = -1; s <= 1; s++) {
					let c = i + s, l = a + r, u = (l % 2 + 2) % 2 * .5, d = t - c - .5 - u, f = n - l - .5, p = smooth(clamp((.42 - Math.abs(d)) / .03)) * smooth(clamp((.42 - Math.abs(d * .5 + f * e / 2)) / .03)) * smooth(clamp((.42 - Math.abs(d * .5 - f * e / 2)) / .03));
					o += (1 - o) * p;
				}
				let s = 1 - o, c = noise(W, G, 48, 48, r ^ 12743);
				J = .38 + .34 * s + .12 * c, Y = .28 + .56 * s + .04 * c, X += .08 * (1 - s) + .03 * (c - .5), Z = .52 + .42 * s;
			};
			case `frost`: return () => {
				let e = fract(W) - .5, t = fract(G) - .5, n = Math.sin(Math.PI * e) / Math.PI, i = Math.sin(Math.PI * t) / Math.PI, a = Math.sqrt(n * n + i * i), o = Math.atan2(i, n), s = smooth(clamp((a - .06) / .05)), c = Math.abs(Math.cos(3 * o + .4 * (noise(W, G, 3, 3, r ^ 23585) - .5) * Math.sin(2 * o))) ** 3, l = noise(W * 6 + 2 * a, G * 6 - 2 * a, 24, 24, r ^ 10155), u = s * c * (.55 + .45 * l);
				J = .42 + .42 * u + .12 * K, Y = .28 + .58 * u + .04 * K, X += .12 * (1 - u) + .03 * (K - .5), Z = .6 + .36 * u;
			};
			case `stainedglass`: return () => {
				let e = W * 5, t = G * 5, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0, s = 0;
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
				J = (.22 + .58 * s) * (1 - .45 * c) + .12 * K, Y = .36 + .14 * (1 - c) + .32 * c + .03 * K, X += .06 * c + .03 * (K - .5), Z = .86 - .2 * c;
			};
			case `soapstone`: return () => {
				let e = noise(W, G, 6, 2, r ^ 11409), t = smooth(clamp((noise(W, G, 3, 3, r ^ 19481) - .52) / .1)), n = noise(W, G, 48, 12, r ^ 25007);
				J = .16 + .52 * t + .16 * e + .12 * n, Y = .45 + .06 * t + .05 * e + .04 * n, X += .1 * (1 - t) + .03 * (n - .5), Z = .9 + .08 * t;
			};
			case `butcherblock`: return () => {
				let e = W * 4, t = G * 4, n = Math.floor(e), i = Math.floor(t), a = .5 - Math.abs(fract(e) - .5), o = .5 - Math.abs(fract(t) - .5), s = smooth(clamp((.06 - Math.min(a, o)) / .04)), c = (((n + i) % 2 + 2) % 2 ? .5 : -.5) * (1 - s), l = noise(W, G, 40, 40, r ^ 14273), u = noise(W, G, 96, 96, r ^ 23251);
				J = .46 + .34 * c + .14 * l + .1 * u - .12 * s, Y = .7 - .42 * s + .06 * l + .04 * u, X += .05 * (l - .5) + .06 * s, Z = 1 - .5 * s;
			};
			case `wallpaper`: return () => {
				let e = Math.abs(fract(W * 2) - .5), t = Math.abs(fract(G * 2) - .5), r = e * e + t * t, i = .5 + .5 * Math.cos(n * 3.5 * r + a), o = smooth(clamp((.22 - r) / .08)) * i;
				J = .34 + .3 * o + .12 * K, Y = .34 + .28 * o, X += .08 * (1 - o) + .03 * (K - .5), Z = .82 + .16 * o;
			};
			case `embroidery`: return () => {
				let e = W * 6, t = G * 6, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 6 + 6) % 6, d = (l % 6 + 6) % 6, f = .6 * (hash(u, d, r ^ 12081) - .5), p = Math.cos(f), m = Math.sin(f), h = c + .5 + .16 * (hash(u, d, r ^ 16839) - .5), g = l + .5 + .16 * (hash(u, d, r ^ 27939) - .5), _ = e - h, v = t - g, y = (_ * p + v * m) / .34, b = (v * p - _ * m) / .09, x = clamp(1 - y * y - b * b);
					a += (1 - a) * x * x;
				}
				J = .36 + .3 * a + .14 * K, Y = .3 + .56 * a + .04 * K, X += .06 * (K - .5) - .03 * a, Z = .62 + .34 * a;
			};
			case `macrame`: return () => {
				let e = W * 4, t = G * 4, r = Math.floor(e), i = Math.floor(t), o = 0;
				for (let n = -1; n <= 1; n++) for (let a = -1; a <= 1; a++) {
					let s = r + a, c = i + n, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, p = smooth(clamp((.3 - Math.sqrt(u * u + d * d)) / .1));
					o += (1 - o) * p;
				}
				let s = .5 + .5 * Math.cos(n * 12 * (e + t) + a), c = .5 + .5 * Math.cos(n * 6 * (e - t) + a);
				J = .34 + .3 * o + .12 * s * c + .12 * K, Y = .28 + .52 * o + .14 * (1 - o) * s * c + .04 * K, X += .06 * (K - .5), Z = .6 + .36 * o;
			};
			case `brickpaving`: return () => {
				let e = W * 3, t = G * 4, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let r = -1; r <= 1; r++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = i + r, l = (c % 2 + 2) % 2 * .5, u = e - s - .5 - l, d = t - c - .5, f = smooth(clamp((.44 - Math.abs(u)) / .05)) * smooth(clamp((.38 - Math.abs(d)) / .05));
					a += (1 - a) * f;
				}
				let o = noise(W, G, 64, 64, r ^ 15383), s = noise(W, G, 24, 24, r ^ 20911);
				J = .36 + .28 * a + .12 * s + .1 * o - .1 * (1 - a), Y = .26 + .56 * a + .06 * s + .03 * o, X += .06 * (1 - a) + .04 * (o - .5), Z = .5 + .46 * a;
			};
			case `steppingstone`: return () => {
				let e = W * 3, t = G * 3, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 3 + 3) % 3, d = (l % 3 + 3) % 3, f = e - c - .5 - .18 * (hash(u, d, r ^ 17073) - .5), p = t - l - .5 - .18 * (hash(u, d, r ^ 27767) - .5), h = smooth(clamp((.4 - Math.sqrt(f * f + p * p)) / .1));
					a += (1 - a) * h;
				}
				let o = noise(W, G, 72, 72, r ^ 11611), s = noise(W, G, 12, 12, r ^ 22723);
				J = .32 + .3 * a + .14 * s + .12 * o, Y = .24 + .58 * a + .06 * s + .03 * o, X += .08 * (1 - a) + .04 * (o - .5), Z = .54 + .42 * a;
			};
			case `woodendeck`: return () => {
				let e = W * 3, t = G * 5, n = Math.floor(t), i = (n % 5 + 5) % 5, o = smooth(clamp((.05 - (.5 - Math.abs(fract(t) - .5))) / .035)), s = .5 + .3 * hash(i, 0, r ^ 7037) * (1 - o), c = noise(W, G, 48, 8, r ^ 14817), l = 0, u = 0;
				for (let r = 0; r < 3; r++) {
					let i = e - (r + .5), a = t - n - .5, s = smooth(clamp((.16 - Math.sqrt(i * i + a * a)) / .05)), c = s * smooth(clamp((.035 - Math.min(Math.abs(i), Math.abs(a))) / .02));
					l += (1 - l) * s, u += (1 - u) * c;
				}
				J = .42 + .24 * s + .12 * c + .1 * l - .08 * u, Y = .68 - .44 * o + .05 * l - .12 * u + .05 * c, X += .05 * (c - .5) + .08 * o - .04 * l, Z = 1 - .52 * o - .12 * u;
			};
			case `cheese`: return () => {
				let e = W * 6, t = G * 6, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 6 + 6) % 6, d = (l % 6 + 6) % 6, f = e - c - .5 - .24 * (hash(u, d, r ^ 19991) - .5), p = t - l - .5 - .24 * (hash(u, d, r ^ 29355) - .5), m = .14 + .18 * Math.floor(hash(u, d, r ^ 13775) * 2), g = smooth(clamp((m - Math.sqrt(f * f + p * p)) / (.35 * m)));
					a += (1 - a) * g;
				}
				let o = noise(W, G, 40, 4, r ^ 11133), s = noise(W, G, 24, 24, r ^ 25027);
				J = .56 + .26 * s + .1 * o - .3 * a, Y = .72 - .5 * a + .04 * s - .03 * o, X += .06 * (1 - a) + .03 * (s - .5), Z = .94 - .6 * a;
			};
			case `sugarfrosting`: return () => {
				let e = W * 5, t = G * 5, n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = i + o, u = (c % 5 + 5) % 5, d = (l % 5 + 5) % 5, f = e - c - .5 - .2 * (hash(u, d, r ^ 8075) - .5), p = t - l - .5 - .2 * (hash(u, d, r ^ 18989) - .5), h = clamp(1 - (Math.sqrt(f * f + p * p) / .34) ** 2);
					a += (1 - a) * h * h;
				}
				let o = noise(W, G, 32, 32, r ^ 31809);
				J = .58 + .2 * a + .1 * o + .1 * K, Y = .34 + .5 * a + .06 * o + .03 * K, X += .06 * (1 - a) + .03 * (K - .5), Z = .66 + .3 * a;
			};
			case `candleswax`: return () => {
				let e = W * 6, t = G * 2, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 6 + 6) % 6, f = (u % 2 + 2) % 2, p = l + .5 + .3 * (hash(d, f, r ^ 9393) - .5), m = u + .5, h = e - p, g = t - m, _ = g / .42, v = h / .14, y = clamp(1 - _ * _ - v * v), b = y * y, x = clamp(1 - ((g - .22) / .14) ** 2 - (h / .17) ** 2) ** 2;
					a += (1 - a) * b, o += (1 - o) * b * x;
				}
				let s = noise(W, G, 48, 16, r ^ 23843);
				J = .5 + .26 * a + .12 * o + .1 * s, Y = .3 + .42 * a + .16 * o + .05 * s, X += .05 * (s - .5) + .05 * (1 - a), Z = .62 + .34 * a;
			};
			case `vinylrecord`: return () => {
				let e = fract(W) - .5, t = fract(G) - .5, i = Math.sin(Math.PI * e) / Math.PI, o = Math.sin(Math.PI * t) / Math.PI, s = Math.sqrt(i * i + o * o), c = smooth(clamp((s - .18) / .06)), l = .5 + .5 * Math.cos(n * 52 * s + a), u = noise(W, G, 64, 64, r ^ 12743);
				J = .14 + .1 * l * c + .08 * u, Y = .42 + .24 * l * c + .02 * u, X += .06 * (1 - l * c) + .03 * (u - .5), Z = .88 + .1 * l * c;
			};
			case `graphpaper`: return () => {
				let e = fract(W * 12), t = fract(G * 12), n = Math.min(e, 1 - e), i = Math.min(t, 1 - t), a = smooth(clamp((.05 - Math.min(n, i)) / .03)), o = fract(W * 3), s = fract(G * 3), c = Math.min(o, 1 - o), l = Math.min(s, 1 - s), u = smooth(clamp((.06 - Math.min(c, l)) / .035)), d = noise(W, G, 64, 64, r ^ 23341);
				J = .9 - .28 * a - .34 * u + .06 * d, Y = .8 - .22 * a - .36 * u + .03 * d, X += .04 * (d - .5) + .03 * a, Z = 1 - .12 * a - .2 * u;
			};
			case `notebookpaper`: return () => {
				let e = fract(G * 8), t = smooth(clamp((.05 - Math.min(e, 1 - e)) / .03)), n = smooth(clamp((.012 - Math.abs(fract(W) - .25)) / .008)), i = 0;
				for (let e = 0; e < 3; e++) {
					let t = fract(W) - .12, n = fract(G) - (e + 1) / 4, a = smooth(clamp((.06 - Math.sqrt(t * t + 4 * n * n)) / .03));
					i += (1 - i) * a;
				}
				let a = noise(W, G, 48, 48, r ^ 10155);
				J = .9 - .3 * t - .26 * n - .5 * i + .06 * a, Y = .82 - .2 * t - .22 * n - .5 * i + .03 * a, X += .04 * (a - .5) + .03 * t, Z = 1 - .1 * t - .12 * n - .4 * i;
			};
			case `lace`: return () => {
				let e = fract((W + G) * 6), t = fract((W - G) * 6), n = smooth(clamp((.14 - Math.min(e, 1 - e)) / .07)), i = smooth(clamp((.14 - Math.min(t, 1 - t)) / .07)), a = n + i - n * i, o = n * i, s = noise(W, G, 48, 48, r ^ 7231);
				J = .58 + .32 * a + .05 * s, Y = .5 + .32 * a + .12 * o + .02 * s, X += .05 * (s - .5) - .08 * a, Z = 1 - .5 * (1 - a) - .14 * (1 - o);
			};
			case `crochet`: return () => {
				let e = Math.floor(G * 6) % 2 * .5, t = fract(W * 8 + e) - .5, n = fract(G * 6) - .5, a = smooth(clamp((.44 - Math.sqrt(t * t + 1.4 * n * n)) / .12)), o = noise(W, G, 40, 40, r ^ 23063);
				J = .58 + .34 * a + .05 * o, Y = .45 + .4 * a + .02 * o, X += .05 * (o - .5) - .05 * a, Z = 1 - .55 * (1 - a);
			};
			case `basketweave`: return () => {
				let e = fract(W * 4), t = fract(G * 4), n = smooth(clamp((Math.min(e, 1 - e) - .06) / .1)) * smooth(clamp((Math.min(t, 1 - t) - .06) / .1)), a = fract((Math.floor(W * 4) + Math.floor(G * 4)) % 2 ? W * 8 : G * 8), o = smooth(clamp((Math.min(a, 1 - a) - .06) / .1)), s = smooth(clamp((.14 - Math.abs(a - .5)) / .07)), c = noise(W, G, 32, 32, r ^ 26334);
				J = .5 + n * (.28 * o + .12 * s) + .06 * c, Y = .42 + n * (.36 * o + .14 * s) + .02 * c, X += .06 * (c - .5) - .05 * n * s, Z = 1 - .55 * (1 - n * o) - .16 * (1 - n * s);
			};
			case `zipper`: return () => {
				let e = fract(G * 12) - .5, t = fract(G * 12 + .5) - .5, i = smooth(clamp((.34 - Math.abs(e)) / .08)) * smooth(clamp((.09 - Math.abs(W - .42)) / .035)), a = smooth(clamp((.34 - Math.abs(t)) / .08)) * smooth(clamp((.09 - Math.abs(W - .58)) / .035)), o = i + a - i * a, s = smooth(clamp((.2 - Math.abs(W - .25)) / .06)) + smooth(clamp((.2 - Math.abs(W - .75)) / .06)), c = smooth(clamp((.05 - Math.abs(W - .5)) / .03)) * (1 - o), l = .5 + .5 * Math.cos(n * 24 * G), u = noise(W, G, 40, 40, r ^ 15762), d = o + .7 * s - o * .7 * s;
				J = .42 + .24 * o + .2 * s * (.85 + .15 * l) + .05 * u, Y = .4 + .34 * o + .16 * s * (.85 + .15 * l) - .12 * c + .02 * u, X += .05 * (u - .5) - .08 * o, Z = 1 - .42 * (1 - d) - .3 * c;
			};
			case `velcro`: return () => {
				let e = Math.floor(G * 12) % 2 * .5, t = fract(W * 12 + e) - .5, n = fract(G * 12) - .5, i = Math.sqrt(t * t + n * n), a = smooth(clamp((.34 - i) / .07)) * smooth(clamp((i - .16) / .07)), o = smooth(clamp((.18 - i) / .08)), s = noise(W, G, 36, 36, r ^ 30641), c = a + o - a * o;
				J = .46 + .3 * a + .16 * o + .05 * s, Y = .42 + .3 * a + .15 * o + .02 * s, X += .05 * (s - .5) - .06 * a, Z = 1 - .5 * (1 - c) - .14 * a;
			};
			case `button`: return () => {
				let e = fract(W * 4) - .5, t = fract(G * 4) - .5, n = Math.sqrt(e * e + t * t), i = smooth(clamp((.34 - n) / .08)), a = smooth(clamp((.34 - n) / .05)) * smooth(clamp((n - .2) / .05)), o = 0;
				for (let n = 0; n < 4; n++) {
					let r = e - (n % 2 ? .07 : -.07), i = t - (n > 1 ? .07 : -.07), s = smooth(clamp((.05 - Math.sqrt(r * r + i * i)) / .03));
					o += (1 - o) * s;
				}
				let s = noise(W, G, 32, 32, r ^ 19501);
				J = .55 + .26 * i + .12 * a - .3 * o + .05 * s, Y = .4 + .22 * i + .24 * a - .34 * o + .02 * s, X += .05 * (s - .5) - .06 * a, Z = 1 - .4 * (1 - i) - .42 * o;
			};
			case `traintracks`: return () => {
				let e = smooth(clamp((.18 - Math.min(fract(G * 6), 1 - fract(G * 6))) / .08)), t = smooth(clamp((.06 - Math.abs(W - .35)) / .025)) + smooth(clamp((.06 - Math.abs(W - .65)) / .025)), n = noise(W, G, 48, 48, r ^ 12129), i = e + t - e * t;
				J = .32 + .28 * e + .3 * t + .08 * n, Y = .36 + .16 * e + .34 * t + .03 * n, X += .06 * (n - .5) - .1 * t, Z = 1 - .45 * (1 - i) - .12 * (1 - n);
			};
			case `manholecover`: return () => {
				let e = W - .5, t = G - .5, i = Math.sqrt(e * e + t * t), a = smooth(clamp((.46 - i) / .03)) * smooth(clamp((i - .38) / .03)), o = smooth(clamp((.36 - i) / .04)), s = .5 + .5 * Math.cos(16 * Math.atan2(t, e)), c = .5 + .5 * Math.cos(n * 6 * i), l = s * smooth(clamp((i - .06) / .05)) * o, u = c * o, d = noise(W, G, 40, 40, r ^ 6350);
				J = .4 + .3 * a + .14 * l + .1 * u + .05 * d, Y = .38 + .3 * a + .14 * l + .12 * u + .02 * d, X += .05 * (d - .5) - .08 * a, Z = 1 - .4 * (1 - a) - .2 * (1 - l) * (1 - u);
			};
			case `speedbump`: return () => {
				let e = fract(G * 2), n = smooth(clamp((.34 - Math.abs(e - .5)) / .14)), i = smooth(clamp((.04 - Math.min(e, 1 - e)) / .03)), a = smooth(clamp((.28 - Math.abs(fract(W * 4) - .5)) / .1)), o = noise(W, G, 32, 32, r ^ 20911);
				J = .42 + .4 * a * (.3 + .7 * n) + .06 * o, Y = .38 + .4 * n - .1 * i + .02 * o, X += .05 * (o - .5) - .06 * n, Z = 1 - .45 * (1 - n) - .3 * i;
			};
			case `circuitboard`: return () => {
				let e = Math.floor(G * 8), t = Math.floor(W * 8), n = fract(W * 8) - .5, i = fract(G * 8) - .5, a = Math.sqrt(n * n + i * i), o = e % 2 == 0 ? smooth(clamp((.12 - Math.abs(i)) / .05)) : 0, s = t % 2 == 1 ? smooth(clamp((.12 - Math.abs(n)) / .05)) : 0, c = e % 2 == 0 && t % 2 == 1 ? smooth(clamp((.22 - a) / .06)) : 0, l = e % 2 == 1 && t % 2 == 0 ? smooth(clamp((.1 - a) / .04)) : 0, u = noise(W, G, 32, 32, r ^ 27394), d = 1 - (1 - o) * (1 - s) * (1 - c);
				J = .3 + .3 * d + .26 * c + .06 * u, Y = .4 + .12 * o + .12 * s + .22 * c - .3 * l + .02 * u, X += .05 * (u - .5) - .1 * d, Z = 1 - .35 * (1 - d) - .35 * l;
			};
			case `solarpanel`: return () => {
				let e = fract(W * 2), t = fract(G * 2), n = smooth(clamp((Math.min(e, 1 - e) - .06) / .1)) * smooth(clamp((Math.min(t, 1 - t) - .06) / .1)), i = smooth(clamp((.05 - Math.min(Math.abs(e - .3), Math.abs(e - .7))) / .025)), a = smooth(clamp((.04 - Math.min(fract(G * 8), 1 - fract(G * 8))) / .02)), o = noise(W, G, 40, 40, r ^ 12791);
				J = .34 + .3 * n + .2 * i * n + .1 * a * n + .05 * o, Y = .4 + .3 * n + .12 * i * n + .05 * a * n + .02 * o, X += .05 * (o - .5) - .1 * i * n, Z = 1 - .5 * (1 - n) - .12 * (1 - i * n);
			};
			case `heattile`: return () => {
				let e = fract(W * 3), t = fract(G * 3), n = smooth(clamp((Math.min(e, 1 - e) - .08) / .12)) * smooth(clamp((Math.min(t, 1 - t) - .08) / .12)), i = noise(W, G, 48, 48, r ^ 31297);
				J = .52 + .32 * n + .08 * i, Y = .42 + .34 * n + .03 * i, X += .05 * (i - .5) - .04 * n, Z = 1 - .5 * (1 - n);
			};
			case `pianokeys`: return () => {
				let e = fract(W * 7), t = smooth(clamp((.04 - Math.min(e, 1 - e)) / .025)), n = 0;
				for (let e = 0; e < 7; e++) {
					if (e === 0 || e === 3) continue;
					let t = Math.abs(fract(W) - e / 7), r = Math.abs(fract(G) - .275), i = smooth(clamp((.045 - t) / .018)) * smooth(clamp((.175 - r) / .06));
					n += (1 - n) * i;
				}
				let i = noise(W, G, 40, 40, r ^ 20360), a = 1 - t * (1 - n);
				J = .48 + .32 * a + .14 * n + .05 * i, Y = .42 + .2 * a + .26 * n + .02 * i, X += .05 * (i - .5) - .1 * n, Z = 1 - .32 * t * (1 - n);
			};
			case `drumskin`: return () => {
				let e = W - .5, t = G - .5, n = Math.sqrt(e * e + t * t), i = Math.atan2(t, e), a = smooth(clamp((.46 - n) / .03)) * smooth(clamp((n - .38) / .03)), o = (.5 + .5 * Math.cos(8 * i)) ** 4 * a, s = smooth(clamp((.38 - n) / .06)), c = (.5 - .5 * Math.cos(16 * i)) * smooth(clamp((n - .08) / .06)) * s, l = noise(W, G, 36, 36, r ^ 11354);
				J = .42 + .28 * a + .14 * o + .1 * s - .1 * c + .05 * l, Y = .42 + .28 * a + .16 * o + .1 * s - .06 * c + .02 * l, X += .05 * (l - .5) - .06 * a, Z = 1 - .3 * (1 - s) - .12 * c - .1 * o;
			};
			case `gongsurface`: return () => {
				let e = W - .5, t = G - .5, i = Math.sqrt(e * e + t * t), a = Math.atan2(t, e), o = noise(W, G, 6, 6, r ^ 24751) - .5, s = .5 + .5 * Math.cos(n * 10 * (i + .012 * o)), c = .5 + .5 * Math.cos(24 * a), l = smooth(clamp((.1 - i) / .05)), u = smooth(clamp((i - .06) / .05)), d = smooth(clamp((.44 - i) / .06)), f = noise(W, G, 32, 32, r ^ 22977);
				J = .46 + .26 * s * d + .12 * c * u * d + .1 * l + .05 * f, Y = .42 + .22 * s * d + .06 * c * u * d + .2 * l + .02 * f, X += .05 * (f - .5) - .08 * s * d, Z = 1 - .24 * (1 - s * d) - .1 * (1 - c * u * d);
			};
			case `lensarray`: return () => {
				let e = fract(W * 16) - .5, t = fract(G * 16) - .5, i = smooth(clamp((.42 - Math.sqrt(e * e + t * t)) / .12)), a = noise(W, G, 48, 48, r ^ 28476);
				J = .42 + .4 * i + .06 * a, Y = .42 + .36 * i + .02 * a, X += .05 * (a - .5) - .12 * i, Z = 1 - .42 * (1 - i);
			};
			case `prismtape`: return () => {
				let e = fract((W - G) * 8), n = smooth(clamp((.34 - Math.abs(e - .5)) / .16)), i = noise(W, G, 40, 40, r ^ 7038);
				J = .4 + .42 * n + .06 * i, Y = .4 + .4 * n + .02 * i, X += .05 * (i - .5) - .1 * n, Z = 1 - .45 * (1 - n);
			};
			case `fresnel`: return () => {
				let e = W - .5, t = G - .5, n = Math.sqrt(e * e + t * t), i = fract(n * 10), a = smooth(clamp((.46 - n) / .05)), o = smooth(clamp((.75 - i) / .25)) * a, s = smooth(clamp((.1 - n) / .05)), c = noise(W, G, 40, 40, r ^ 14249);
				J = .38 + .32 * o + .2 * s + .05 * c, Y = .42 + .22 * o + .3 * s + .02 * c, X += .05 * (c - .5) - .1 * o, Z = 1 - .36 * (1 - o) - .12 * (1 - s);
			};
			case `bandage`: return () => {
				let e = smooth(clamp((.28 - Math.abs(W - .5)) / .06)) * smooth(clamp((.28 - Math.abs(G - .5)) / .06)), t = smooth(clamp((.12 - Math.abs(fract(W * 24) - .5)) / .06)), n = smooth(clamp((.12 - Math.abs(fract(G * 24) - .5)) / .06)), i = t + n - t * n, a = noise(W, G, 48, 48, r ^ 23841);
				J = .5 + .3 * e + .12 * i + .06 * a, Y = .44 + .3 * e + .08 * i + .02 * a, X += .05 * (a - .5) - .08 * e, Z = 1 - .32 * (1 - i) - .12 * (1 - e);
			};
			case `pillblister`: return () => {
				let e = fract(W * 3) - .5, t = fract(G * 3) - .5, i = smooth(clamp((.36 - Math.sqrt(e * e + t * t)) / .1)), a = smooth(clamp((.03 - Math.min(fract(W * 3), 1 - fract(W * 3))) / .02)) + smooth(clamp((.03 - Math.min(fract(G * 3), 1 - fract(G * 3))) / .02)), o = noise(W, G, 40, 40, r ^ 10173);
				J = .52 + .34 * i - .14 * a + .06 * o, Y = .46 + .36 * i - .14 * a + .02 * o, X += .05 * (o - .5) - .12 * i, Z = 1 - .42 * (1 - i) - .2 * a;
			};
			case `sutures`: return () => {
				let e = smooth(clamp((.09 - Math.abs(fract(G * 10) - .5)) / .03)), t = e * smooth(clamp((.22 - Math.abs(W - .5)) / .06)), n = smooth(clamp((.05 - Math.abs(W - .5)) / .03)), i = smooth(clamp((.045 - Math.abs(W - .16)) / .025)) * e + smooth(clamp((.045 - Math.abs(W - .84)) / .025)) * e, a = noise(W, G, 40, 40, r ^ 25566);
				J = .56 + .26 * t - .22 * n * (1 - t) - .18 * i + .05 * a, Y = .5 + .28 * t - .3 * n * (1 - t) - .2 * i * (1 - t) + .02 * a, X += .05 * (a - .5) - .08 * t, Z = 1 - .3 * n * (1 - t) - .28 * i - .12 * (1 - t);
			};
			case `trellis`: return () => {
				let e = smooth(clamp((.16 - Math.abs(fract(W * 2) - .5)) / .08)), t = smooth(clamp((.16 - Math.abs(fract(G * 2) - .5)) / .08)), n = e + t - e * t, i = smooth(clamp((.14 - Math.sqrt((fract(W * 2) - .5) ** 2 + (fract(G * 2) - .5) ** 2)) / .06)) * n, a = noise(W, G, 32, 32, r ^ 16839);
				J = .42 + .3 * n + .14 * i + .06 * a, Y = .4 + .24 * n + .1 * i + .03 * a, X += .06 * (a - .5) - .08 * n, Z = 1 - .5 * (1 - n) - .12 * (1 - i) * n;
			};
			case `terracottapot`: return () => {
				let e = smooth(clamp((.18 - Math.abs(fract(G * 8) - .5)) / .08)), t = smooth(clamp((.1 - Math.abs(fract(G) - .1)) / .04)), n = noise(W, G, 32, 32, r ^ 24075);
				J = .46 + .24 * e + .22 * t + .06 * n, Y = .42 + .18 * e + .26 * t + .03 * n, X += .05 * (n - .5) - .06 * t, Z = 1 - .34 * (1 - e) - .12 * (1 - t);
			};
			case `hedgerow`: return () => {
				let e = Math.floor(G * 4) % 2 * .5, t = fract(W * 4 + e) - .5, n = fract(G * 4) - .5, o = smooth(clamp((.34 - (Math.sqrt(t * t + n * n) + .08 * (noise(W, G, 8, 8, r ^ 13231) - .5))) / .12)), s = noise(W, G, 48, 48, r ^ 29396);
				J = .36 + .36 * o + .12 * s + .05 * o * s, Y = .42 + .34 * o + .04 * s, X += .05 * (s - .5) - .06 * o, Z = 1 - .5 * (1 - o);
			};
			case `collar`: return () => {
				let e = smooth(clamp((.2 - Math.abs(fract(G) - .5)) / .05)), t = smooth(clamp((.02 - Math.abs(Math.abs(fract(G) - .5) - .17)) / .012)), n = smooth(clamp((.12 - Math.abs(fract(W) - .3)) / .04)) * smooth(clamp((.14 - Math.abs(fract(G) - .5)) / .05)), i = noise(W, G, 48, 48, r ^ 19481);
				J = .42 + .26 * e + .22 * n + .06 * i, Y = .44 + .2 * e + .28 * n - .1 * t * e + .03 * i, X += .05 * (i - .5) - .1 * n, Z = 1 - .32 * (1 - e) - .14 * t - .12 * n;
			};
			case `petbed`: return () => {
				let e = W - .5, t = G - .5, i = Math.sqrt(e * e + t * t), a = smooth(clamp((.44 - i) / .06)) * smooth(clamp((i - .3) / .08)), o = smooth(clamp((.28 - i) / .1)), s = (.5 + .5 * Math.cos(n * 20 * W)) * (.5 + .5 * Math.cos(n * 20 * G)), c = noise(W, G, 40, 40, r ^ 20931);
				J = .44 + .3 * a + .14 * o + .05 * s + .05 * c, Y = .44 + .34 * a + .12 * o + .03 * s + .03 * c, X += .05 * (c - .5) + .02 * (s - .5) - .08 * a, Z = 1 - .36 * (1 - a) - .12 * (1 - o);
			};
			case `scratchpost`: return () => {
				let e = smooth(clamp((.2 - Math.abs(fract(G * 8) - .5)) / .08)), t = .5 + .5 * Math.cos(n * (12 * W + 2 * G)), i = noise(W, G, 40, 40, r ^ 10966);
				J = .46 + .32 * e + .08 * t * e + .06 * i, Y = .44 + .36 * e + .05 * t * e + .03 * i, X += .05 * (i - .5) - .08 * e, Z = 1 - .5 * (1 - e) - .1 * (1 - t) * e;
			};
			case `runningtrack`: return () => {
				let e = smooth(clamp((.03 - Math.abs(fract(G) - .25)) / .015)) + smooth(clamp((.03 - Math.abs(fract(G) - .75)) / .015)), t = smooth(clamp((.02 - Math.min(fract(G), 1 - fract(G))) / .012)), n = noise(W, G, 64, 64, r ^ 16216);
				J = .42 + .4 * e + .1 * n, Y = .46 + .12 * e + .02 * n - .16 * t, X += .05 * (n - .5) - .1 * e, Z = 1 - .3 * t - .12 * (1 - e);
			};
			case `bouldermat`: return () => {
				let e = Math.abs(fract((W + G) * 4) - .5), t = Math.abs(fract((W - G) * 4) - .5), n = smooth(clamp((.3 - e) / .1)) * smooth(clamp((.3 - t) / .1)), i = smooth(clamp((.08 - Math.min(fract(W), 1 - fract(W))) / .04)), a = smooth(clamp((.08 - Math.min(fract(G), 1 - fract(G))) / .04)), o = 1 - (1 - i) * (1 - a), s = noise(W, G, 40, 40, r ^ 25778);
				J = .42 + .3 * n + .16 * o + .06 * s, Y = .44 + .28 * n + .18 * o + .03 * s, X += .05 * (s - .5) - .06 * n, Z = 1 - .42 * (1 - n) - .12 * (1 - o);
			};
			case `pooltile`: return () => {
				let e = Math.min(fract(W * 8), 1 - fract(W * 8)), t = Math.min(fract(G * 8), 1 - fract(G * 8)), i = smooth(clamp((e - .04) / .06)) * smooth(clamp((t - .04) / .06)), a = .5 + .5 * Math.cos(n * 2 * (W + G)), o = noise(W, G, 32, 32, r ^ 6394);
				J = .4 + .3 * i + .14 * a + .06 * o, Y = .44 + .2 * i + .1 * a + .02 * o, X += .05 * (o - .5) - .12 * i, Z = 1 - .42 * (1 - i) - .1 * (1 - a);
			};
			case `envelope`: return () => {
				let e = Math.abs(fract((W + G) * 10) - .5), t = Math.abs(fract((W - G) * 10) - .5), n = smooth(clamp((.14 - e) / .07)), i = smooth(clamp((.14 - t) / .07)), a = n + i - n * i, o = smooth(clamp((.03 - Math.abs(W - .5)) / .02)) * (1 - a), s = noise(W, G, 48, 48, r ^ 11852);
				J = .5 + .24 * a + .06 * s, Y = .46 + .12 * a - .14 * o + .02 * s, X += .05 * (s - .5) - .06 * a, Z = 1 - .28 * (1 - a) - .3 * o;
			};
			case `chalkboard`: return () => {
				let e = .5 - Math.abs(fract(W) - .5), t = .5 - Math.abs(fract(G) - .5), i = 1 - (1 - smooth(clamp((.08 - e) / .04))) * (1 - smooth(clamp((.08 - t) / .04))), a = noise(W, G, 6, 6, r ^ 21994) - .5, o = .5 + .5 * Math.cos(n * 3 * (G + .02 * a)), s = noise(W, G, 32, 32, r ^ 7176);
				J = .34 + .3 * i + .12 * o + .06 * s, Y = .44 + .24 * i + .04 * o + .03 * s, X += .05 * (s - .5) - .08 * i, Z = 1 - .3 * (1 - i) - .08 * (1 - o);
			};
			case `corkboard`: return () => {
				let e = Math.floor(G * 8) % 2 * .5, t = fract(W * 8 + e) - .5, n = fract(G * 8) - .5, o = smooth(clamp((.34 - (Math.sqrt(t * t + n * n) + .08 * (noise(W, G, 8, 8, r ^ 27447) - .5))) / .12)), s = fract(W * 4) - .5, c = fract(G * 4) - .5, l = smooth(clamp((.07 - Math.sqrt(s * s + c * c)) / .03)), u = noise(W, G, 48, 48, r ^ 14930);
				J = .42 + .26 * o - .2 * l + .08 * u, Y = .44 + .2 * o - .26 * l + .03 * u, X += .05 * (u - .5) - .06 * o, Z = 1 - .3 * (1 - o) - .45 * l;
			};
			case `snowdrift`: return () => {
				let e = noise(W, G, 4, 4, r ^ 20087) - .5, t = .5 + .5 * Math.cos(n * (2 * W + .35 * e)), i = noise(W, G, 48, 48, r ^ 11029);
				J = .52 + .34 * t + .06 * i, Y = .46 + .32 * t + .05 * i, X += .05 * (i - .5) - .12 * t, Z = 1 - .3 * (1 - t);
			};
			case `icicle`: return () => {
				let t = smooth(clamp((.28 - Math.abs(fract(W * 6) - .5)) / .1)), i = .5 + .5 * Math.cos(n * 24 * W), a = noise(W, G, 32, 32, r ^ 31809);
				J = .46 + .36 * t + .08 * i * t + .06 * a, Y = .42 + .42 * t + .04 * i * t + .03 * a, X += .05 * (a - .5) - .14 * t, Z = 1 - .52 * (1 - t);
			};
			case `dewdrops`: return () => {
				let e = fract(W * 12) - .5, t = fract(G * 12) - .5, i = smooth(clamp((.22 - Math.sqrt(e * e + t * t)) / .08)), a = fract(W * 24) - .5, o = fract(G * 24) - .5, s = smooth(clamp((.12 - Math.sqrt(a * a + o * o)) / .05)), c = .5 + .5 * Math.cos(n * 8 * (W + .25 * G)), l = noise(W, G, 40, 40, r ^ 22734);
				J = .34 + .28 * i + .18 * s + .1 * c + .05 * l, Y = .42 + .28 * i + .16 * s + .04 * c + .02 * l, X += .05 * (l - .5) - .16 * i, Z = 1 - .3 * (1 - i) - .12 * (1 - s) * (1 - i);
			};
			case `mooncrater`: return () => {
				let e = fract(W * 3) - .5, t = fract(G * 3) - .5, n = Math.sqrt(e * e + t * t), i = smooth(clamp((.3 - n) / .06)) * smooth(clamp((n - .2) / .06)), a = smooth(clamp((.2 - n) / .08)), o = fract(W * 6) - .5, s = fract(G * 6) - .5, c = Math.sqrt(o * o + s * s), l = smooth(clamp((.16 - c) / .04)) * smooth(clamp((c - .1) / .04)), u = smooth(clamp((.1 - c) / .05)), d = noise(W, G, 32, 32, r ^ 25032);
				J = .5 + .24 * i + .12 * l - .16 * a - .1 * u + .08 * d, Y = .46 + .24 * i + .12 * l - .2 * a - .1 * u + .03 * d, X += .05 * (d - .5) + .08 * a, Z = 1 - .3 * a - .16 * u - .12 * (1 - i - l + i * l);
			};
			case `starfield`: return () => {
				let e = fract(W * 12) - .5, t = fract(G * 12) - .5, n = smooth(clamp((.08 - Math.sqrt(e * e + t * t)) / .035)), i = fract(W * 24) - .5, a = fract(G * 24) - .5, o = smooth(clamp((.05 - Math.sqrt(i * i + a * a)) / .025)), s = noise(W, G, 3, 3, r ^ 6130), c = noise(W, G, 40, 40, r ^ 19770);
				J = .26 + .38 * n + .18 * o + .07 * s + .05 * c, Y = .42 + .3 * n + .16 * o + .06 * s + .02 * c, X += .05 * (c - .5) - .18 * n, Z = 1 - .2 * (1 - n) * (1 - o);
			};
			case `nebula`: return () => {
				let e = noise(W, G, 3, 3, r ^ 23085) - .5, t = .5 + .5 * Math.cos(n * (2 * W + 3 * G + 1.2 * e)), i = noise(W, G, 12, 12, r ^ 14052), a = noise(W, G, 32, 32, r ^ 12209);
				J = .42 + .34 * t + .1 * i + .06 * a, Y = .44 + .28 * t + .05 * i + .02 * a, X += .05 * (a - .5) - .1 * t, Z = 1 - .24 * (1 - t);
			};
			case `pleats`: return () => {
				let e = smooth(clamp((.34 - Math.abs(fract(W * 4) - .5)) / .16)), t = noise(W, G, 40, 40, r ^ 25505);
				J = .46 + .32 * e + .08 * t, Y = .46 + .32 * e + .03 * t, X += .05 * (t - .5) - .1 * e, Z = 1 - .4 * (1 - e);
			};
			case `shoelace`: return () => {
				let e = Math.abs(fract((W + G) * 8) - .5), t = Math.abs(fract((W - G) * 8) - .5), n = smooth(clamp((.18 - e) / .09)), i = smooth(clamp((.18 - t) / .09)), a = n + i - n * i, o = fract(W * 4) - .5, s = fract(G * 4) - .5, c = smooth(clamp((.09 - Math.sqrt(o * o + s * s)) / .04)), l = noise(W, G, 32, 32, r ^ 20246);
				J = .46 + .3 * a - .22 * c + .06 * l, Y = .46 + .22 * a - .28 * c + .03 * l, X += .05 * (l - .5) - .08 * a, Z = 1 - .3 * (1 - a) - .45 * c;
			};
			case `tassel`: return () => {
				let e = smooth(clamp((.16 - Math.abs(fract(W * 10) - .5)) / .08)), t = smooth(clamp((.08 - Math.abs(fract(G) - .1)) / .04)), n = noise(W, G, 32, 32, r ^ 10429);
				J = .38 + .26 * e + .28 * t + .06 * n, Y = .42 + .22 * e + .3 * t + .03 * n, X += .05 * (n - .5) - .06 * e, Z = 1 - .38 * (1 - e) - .12 * (1 - t);
			};
			case `woksurface`: return () => {
				let e = fract(W * 10) - .5, t = fract(G * 10) - .5, n = smooth(clamp((.28 - Math.sqrt(e * e + t * t)) / .1)), i = smooth(clamp((.02 - Math.abs(fract((W + G) * 8) - .5)) / .01)), a = noise(W, G, 3, 3, r ^ 17618), o = noise(W, G, 40, 40, r ^ 8638);
				J = .4 + .22 * n - .1 * i + .16 * a + .06 * o, Y = .44 + .16 * n - .12 * i + .02 * o, X += .05 * (o - .5) - .14 * a, Z = 1 - .3 * i - .12 * (1 - n);
			};
			case `cutlery`: return () => {
				let t = smooth(clamp((.08 - Math.min(fract(G), 1 - fract(G))) / .04)), i = t * (.5 + .5 * Math.cos(n * 16 * W)), a = .5 + .5 * Math.cos(n * 20 * G), o = noise(W, G, 32, 32, r ^ 30500);
				J = .46 + .26 * t + .16 * i + .06 * a + .05 * o, Y = .46 + .24 * t + .12 * i + .03 * a + .02 * o, X += .05 * (o - .5) - .12 * i, Z = 1 - .2 * (1 - t) - .12 * (1 - i) * t;
			};
			case `choppingboard`: return () => {
				let e = Math.min(fract(W * 4), 1 - fract(W * 4)), t = Math.min(fract(G * 4), 1 - fract(G * 4)), n = smooth(clamp((e - .08) / .06)) * smooth(clamp((t - .08) / .06)), i = smooth(clamp((.03 - Math.abs(fract((W + G) * 5) - .5)) / .015)), a = smooth(clamp((.03 - Math.abs(fract((W - G) * 5) - .5)) / .015)), o = i + a - i * a, s = Math.min(fract(W), 1 - fract(W)), c = Math.min(fract(G), 1 - fract(G)), l = 1 - (1 - smooth(clamp((.05 - s) / .03))) * (1 - smooth(clamp((.05 - c) / .03))), u = noise(W, G, 32, 32, r ^ 20936);
				J = .5 + .24 * n - .14 * o * n - .14 * l + .06 * u, Y = .48 + .14 * n - .1 * o * n - .12 * l + .03 * u, X += .05 * (u - .5) - .08 * n, Z = 1 - .3 * o * n - .24 * l - .12 * (1 - n);
			};
			case `faucet`: return () => {
				let e = W - .5, t = G - .5, n = Math.sqrt(e * e + t * t), i = smooth(clamp((.4 - n) / .12)), a = smooth(clamp((.5 - n) / .05)) * smooth(clamp((n - .4) / .05)), o = fract(W * 8) - .5, s = fract(G * 8) - .5, c = smooth(clamp((.12 - Math.sqrt(o * o + s * s)) / .05)), l = noise(W, G, 32, 32, r ^ 27159);
				J = .4 + .3 * i + .16 * a + .07 * c + .05 * l, Y = .4 + .3 * i + .14 * a + .05 * c + .02 * l, X += .05 * (l - .5) - .14 * i, Z = 1 - .18 * (1 - i) - .1 * c;
			};
			case `showerhead`: return () => {
				let e = W - .5, t = G - .5, n = Math.sqrt(e * e + t * t), i = smooth(clamp((.42 - n) / .06)), a = smooth(clamp((.03 - Math.abs(fract(12 * n) - .5)) / .015)), o = fract(W * 10) - .5, s = fract(G * 10) - .5, c = smooth(clamp((.12 - Math.sqrt(o * o + s * s)) / .05)), l = noise(W, G, 32, 32, r ^ 12792);
				J = .46 + .3 * i - .12 * a * i - .2 * c * i + .06 * l, Y = .44 + .22 * i - .1 * a * i - .22 * c * i + .02 * l, X += .05 * (l - .5) - .1 * i, Z = 1 - .3 * c * i - .12 * a * i - .2 * (1 - i);
			};
			case `bathmat`: return () => {
				let e = Math.floor(G * 8) % 2 * .5, t = fract(W * 8 + e) - .5, i = fract(G * 8) - .5, a = smooth(clamp((.3 - Math.sqrt(t * t + i * i)) / .1)), o = .5 + .5 * Math.cos(n * 12 * G), s = noise(W, G, 32, 32, r ^ 9419);
				J = .42 + .32 * a + .12 * o + .06 * s, Y = .44 + .28 * a + .06 * o + .02 * s, X += .05 * (s - .5) - .1 * a, Z = 1 - .34 * (1 - a) - .08 * (1 - o);
			};
			case `blinds`: return () => {
				let e = smooth(clamp((.34 - Math.abs(fract(G * 4) - .5)) / .16)), t = smooth(clamp((.02 - Math.abs(fract(G * 4) - .5)) / .012)), n = noise(W, G, 32, 32, r ^ 24359);
				J = .48 + .32 * e - .1 * t + .06 * n, Y = .46 + .3 * e - .08 * t + .02 * n, X += .05 * (n - .5) - .1 * e, Z = 1 - .42 * (1 - e) - .1 * t;
			};
			case `curtain`: return () => {
				let e = noise(W, G, 4, 4, r ^ 15489) - .5, t = smooth(clamp((.34 - Math.abs(fract(5 * (W + .1 * e)) - .5)) / .16)), n = noise(W, G, 40, 40, r ^ 28226);
				J = .46 + .34 * t + .08 * n, Y = .46 + .3 * t + .03 * n, X += .05 * (n - .5) - .08 * t, Z = 1 - .36 * (1 - t);
			};
			case `shadecloth`: return () => {
				let e = smooth(clamp((.12 - Math.abs(fract(W * 16) - .5)) / .06)), t = smooth(clamp((.12 - Math.abs(fract(G * 16) - .5)) / .06)), n = e + t - e * t, i = noise(W, G, 32, 32, r ^ 10197);
				J = .42 + .3 * n + .08 * i, Y = .46 + .2 * n + .02 * i, X += .05 * (i - .5) - .08 * n, Z = 1 - .42 * (1 - n);
			};
			case `sandstone`: return () => {
				let e = noise(W, G, 3, 5, r ^ 26941), t = G + .055 * (e - .5), i = .5 + .5 * Math.sin(8 * t * n + a), o = (.5 + .5 * Math.sin(19 * t * n + a)) ** 6, s = noise(W, G, 8, 3, r ^ 19735), c = smooth(clamp((q - .28) / .48)), l = (1 - q) ** 5;
				J = .22 + .35 * i + .2 * s + .18 * c - .2 * o, Y = .32 + .16 * i - .09 * o + .24 * c - .1 * l, X += .12 * (c - .5) + .05 * o, Z = .97 - .12 * o - .13 * l + .025 * c;
			};
			case `travertine`: return () => {
				let e = W * 12, t = G * 18, i = Math.floor(e), o = Math.floor(t), s = 0;
				for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = o + a, d = (l % 12 + 12) % 12, f = (u % 18 + 18) % 18, p = hash(d, f, r ^ 24211), m = (hash(d, f, r ^ 9169) - .5) * .36, h = Math.cos(m), g = Math.sin(m), _ = e - l - .2 - .6 * hash(d, f, r), v = t - u - .2 - .6 * hash(d, f, r ^ 31513), y = _ * h + v * g, b = v * h - _ * g, x = .42 + .36 * p, S = .11 + .13 * hash(d, f, r ^ 36657), w = smooth(clamp((1 - (y * y / (x * x) + b * b / (S * S) + .12 * Math.sin(9 * y + p * n) * Math.sin(13 * b))) / .65));
					s += w * (.65 + .35 * p);
				}
				let c = 1 - Math.exp(-1.8 * s), l = noise(W, G, 3, 3, r ^ 16855), u = .5 + .5 * Math.sin(n * (6 * G + .18 * l) + a);
				J = .65 + .12 * u + .09 * q - .48 * c, Y = .62 + .05 * u + .04 * q - .3 * c, X += .15 * c + .08 * (q - .5), Z = .98 - .42 * c;
			};
			case `pumice`: return () => {
				let e = W * 26, t = G * 26, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 26 + 26) % 26, f = (u % 26 + 26) % 26, p = e - l - .15 - .7 * hash(d, f, r), m = t - u - .15 - .7 * hash(d, f, r ^ 25375), h = .24 + .2 * hash(d, f, r ^ 14521), g = (p * p + m * m) / (h * h), _ = clamp(1 - g), v = _ * _;
					a = Math.max(a, v), o = Math.max(o, 6 * g * v);
				}
				J = .65 + .12 * noise(W, G, 5, 5, r ^ 40007) + .08 * q - .57 * a + .05 * o, Y = .72 - .58 * a + .08 * o + .03 * q, X += .07 * a + .07 * (q - .5), Z = .98 - .52 * a + .01 * K;
			};
			case `parquet`: return () => {
				let e = W * 4, t = G * 4, a = Math.floor(e), o = Math.floor(t), s = (a + o) % 2 == 0, c = fract(s ? e : t), l = fract(s ? t : e), u = Math.floor(l * 3), f = smooth(clamp((Math.min(c, 1 - c, fract(l * 3) / 3, (1 - fract(l * 3)) / 3) - .006) / .016)), p = hash(a * 3 + u, o, r), m = noise(W, G, 8, 8, r ^ 14105), h = .5 + .5 * Math.sin(n * (l * 38 + .28 * Math.sin(n * c) + .18 * m) + p * n);
				J = .06 + f * (.25 + .32 * p + .22 * h + .06 * K), Y = f * (.76 + .045 * h + .025 * K), X = .78 + f * (i.roughness - .78 + .09 * h + .04 * p), Z = .52 + .46 * f;
			};
			case `mosaic`: return () => {
				let e = W * 16, t = G * 16, n = fract(e), a = fract(t), s = smooth(clamp((Math.min(n, 1 - n, a, 1 - a) - .018) / .042)), c = hash(Math.floor(e), Math.floor(t), r);
				J = .2 + s * (.08 + .56 * c + .1 * K), Y = s * (.78 + .08 * c + .025 * K), X = .76 + s * (i.roughness - .76 + .11 * c + .04 * K), Z = .6 + .39 * s, Q = 1 - s;
			};
			case `hexagontiles`: return () => {
				let e = Math.sqrt(3), t = W * 5, n = G * 6 * e / 2, a = Math.floor(n / (e / 2)), o = 1 / 0, s = 0, c = 0, l = 0, u = 0;
				for (let r = -1; r <= 1; r++) {
					let i = a + r, d = (i % 2 + 2) % 2 * .5, f = Math.round(t - d);
					for (let r = -1; r <= 1; r++) {
						let a = f + r, p = t - a - d, m = n - i * e / 2, h = p * p + m * m;
						h < o && (o = h, s = p, c = m, l = (a % 5 + 5) % 5, u = (i % 6 + 6) % 6);
					}
				}
				let f = smooth(clamp((.5 - Math.max(Math.abs(s), Math.abs(s * .5 + c * e / 2), Math.abs(s * .5 - c * e / 2)) - .012) / .034)), p = hash(l, u, r);
				J = .2 + f * (.28 + .35 * p + .07 * K), Y = f * (.8 + .045 * p + .02 * K), X = .74 + f * (i.roughness - .74 + .1 * p + .04 * K), Z = .6 + .39 * f, Q = 1 - f;
			};
			case `knit`: return () => {
				let e = W * 8, t = G * 8, r = Math.floor(e), i = Math.floor(t), o = 0;
				for (let n = -1; n <= 1; n += 2) {
					let a = e - r - .5, s = t - i - .84, c = n * .34, l = -.68, u = clamp((a * c + s * l) / (c * c + l * l)), d = a - u * c, f = s - u * l, m = smooth(clamp(1 - (d * d + f * f) / .0169));
					o += (1 - o) * m;
				}
				let s = .5 + .25 * Math.sin(n * (48 * W + 24 * G) + a) + .25 * Math.sin(n * (48 * W - 24 * G) - a);
				J = .12 + .64 * o + .1 * K + .07 * o * s, Y = .08 + o * (.76 + .045 * s) + .025 * K, X += .065 * (K - .5) + .035 * (1 - o), Z = .58 + .41 * o;
			};
			case `corduroy`: return () => {
				let e = (.5 + .5 * Math.cos(n * W * 12)) ** .65, t = noise(W, G, 96, 96, r ^ 11121), i = noise(W, G, 12, 48, r ^ 31907);
				J = .12 + .57 * e + .16 * t + .08 * i, Y = .07 + .79 * e + .035 * t + .025 * i, X += .08 * (t - .5) + .035 * (1 - e), Z = .57 + .42 * e;
			};
			case `felt`: return () => {
				let e = W * 20, t = G * 20, i = Math.floor(e), a = Math.floor(t), o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + s, d = (l % 20 + 20) % 20, f = (u % 20 + 20) % 20, p = e - l - .25 - .5 * hash(d, f, r), m = t - u - .25 - .5 * hash(d, f, r ^ 41845), h = hash(d, f, r ^ 27415) * n, g = Math.cos(h), _ = Math.sin(h), v = (p * g + m * _) / .6, y = (m * g - p * _) / .055, b = clamp(1 - v * v - y * y);
					o += (1 - o) * b * b;
				}
				J = .28 + .28 * K + .3 * o, Y = .18 + .035 * K + .065 * o, X += .065 * (K - .5) + .025 * o, Z = .96 + .025 * o + .01 * K;
			};
			case `wafflecloth`: return () => {
				let e = smooth(clamp((Math.cos(n * W * 8) - .35) / .65)), t = smooth(clamp((Math.cos(n * G * 8) - .35) / .65)), i = e + t - e * t, o = .5 + .25 * Math.cos(n * W * 96 + a) + .25 * Math.cos(n * G * 96 - a), s = noise(W, G, 24, 24, r ^ 19059);
				J = .22 + .48 * i + .12 * o + .08 * s, Y = .12 + .66 * i + .035 * o + .025 * s, X += .04 * (s - .5) + .025 * (1 - i), Z = .65 + .32 * i + .02 * o;
			};
			case `cableknit`: return () => {
				let e = fract(W * 4), t = G * 4, i = .22 * Math.sin(n * t), o = .5 + .5 * Math.cos(n * t), s = (e - .5 - i) / .115, c = (e - .5 + i) / .115, l = smooth(clamp(1 - s * s)), u = smooth(clamp(1 - c * c)), d = l + u - l * u, f = l * (.38 + .38 * o), p = u * (.76 - .38 * o), m = f + p - f * p, h = smooth(clamp((Math.cos(n * e) - .5) / .5)), g = .5 + .5 * Math.cos(n * (G * 32 + .35 * Math.cos(n * e))), _ = noise(W, G, 64, 64, r ^ 14249), v = .5 + .5 * Math.sin(n * (W * 96 + G * 48) + a);
				J = .13 + .55 * m + .13 * h + .09 * _ + .04 * d * v, Y = .07 + m + .17 * h * (.65 + .35 * g) + .02 * _ + .015 * d * v, X += .035 * (_ - .5) + .025 * (1 - d), Z = .57 + .35 * d + .055 * h + .015 * _;
			};
			case `quilting`: return () => {
				let e = (W + G) * 6, t = (W - G) * 6, i = .5 - .5 * Math.cos(n * e), o = .5 - .5 * Math.cos(n * t), s = i * o, c = smooth(clamp(1 - i / .055)), l = smooth(clamp(1 - o / .055)), u = c + l - c * l, d = smooth(clamp((Math.cos(n * t * 8) - .2) / .8)), f = smooth(clamp((Math.cos(n * e * 8) - .2) / .8)), p = c * d + l * f - c * d * l * f, m = .5 + .25 * Math.cos(n * W * 96 + a) + .25 * Math.cos(n * G * 96 - a), h = noise(W, G, 24, 24, r ^ 27441);
				J = .3 + .32 * s - .15 * u + .12 * p + .08 * h + .06 * m, Y = .13 + .67 * s - .065 * u + .035 * p + .02 * m + .015 * h, X += .045 * (h - .5) + .025 * u, Z = .88 + .1 * s - .18 * u + .025 * p;
			};
			case `roofshingles`: return () => {
				let e = Math.floor(G * 6), t = fract(G * 6), n = W * 4 + e % 2 * .5, i = fract(n), a = smooth(clamp(Math.min(t, 1 - t) / .12)), o = smooth(clamp(Math.min(i, 1 - i) / .055)), s = (1 - o) * smooth(clamp((t - .32) / .16)) * a, c = a * o, l = hash(Math.floor(n) % 4, e, r ^ 25527), u = smooth(clamp((noise(W, G, 64, 64, r ^ 19765) - .2) / .6)), d = 1 - a;
				J = .24 + .32 * u + .2 * c * l - .15 * d - .14 * s, Y = .2 + .38 * a - .2 * s + .13 * u + .05 * c * l, X += .12 * (u - .5) + .04 * d + .03 * s, Z = .96 - .24 * d - .2 * s + .025 * u;
			};
			case `rooftiles`: return () => {
				let e = fract(W * 6 + .5), t = fract(G * 5), i = .5 + .5 * Math.cos(n * W * 6), a = smooth(clamp(Math.min(t, 1 - t) / .13)), o = a * smooth(clamp(Math.min(e, 1 - e) / .12)), s = hash(Math.floor(W * 6 + .5) % 6, Math.floor(G * 5), r ^ 31297), c = noise(W, G, 24, 32, r ^ 23591), l = 1 - a;
				J = .26 + .24 * i + .23 * o * s + .14 * c - .14 * l, Y = .16 + .65 * i - .1 * l + .035 * o * s + .012 * c, X += .13 * (c - .5) + .05 * (1 - i) + .045 * l, Z = .76 + .22 * i - .14 * l + .015 * c;
			};
			case `stucco`: return () => {
				let e = W * 28, t = G * 28, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + s, d = (l % 28 + 28) % 28, f = (u % 28 + 28) % 28, p = hash(d, f, r ^ 17337), m = e - l - .2 - .6 * hash(d, f, r), h = t - u - .2 - .6 * hash(d, f, r ^ 6083), g = .3 + .25 * p, _ = clamp(1 - (m * m + h * h * (.7 + p)) / (g * g)), v = _ * _;
					p < .28 ? o += (1 - o) * v : a += (1 - a) * v;
				}
				let s = noise(W, G, 5, 7, r ^ 21373);
				J = .52 + .15 * s + .19 * a - .24 * o + .08 * K, Y = .27 + .16 * s + .43 * a - .22 * o + .06 * K, X += .055 * a + .065 * o + .05 * (K - .5), Z = .96 - .25 * o - .075 * a + .02 * K;
			};
			case `lichen`: return () => {
				let e = W * 7, t = G * 7, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0;
				for (let c = -1; c <= 1; c++) for (let l = -1; l <= 1; l++) {
					let u = i + l, d = a + c, f = (u % 7 + 7) % 7, p = (d % 7 + 7) % 7, m = e - u - .25 - .5 * hash(f, p, r), h = t - d - .25 - .5 * hash(f, p, r ^ 29107), g = Math.atan2(h, m), _ = hash(f, p, r ^ 15449), v = (.38 + .16 * _) * (1 + .13 * Math.cos(5 * g + _ * n) + .09 * Math.sin(3 * g - _ * n)), y = smooth(clamp((1 - Math.hypot(m, h) / v) / .18));
					o += (1 - o) * y, s += y * (_ - .5);
				}
				let c = smooth(clamp((noise(W, G, 96, 96, r ^ 27171) - .58) / .25));
				J = .16 + .13 * K + .53 * o + .07 * Math.tanh(s) - .18 * o * c, Y = .15 + .035 * K + o * (.48 - .17 * c), X += .04 * (K - .5) + .035 * o * c, Z = .9 + .08 * o - .15 * o * c;
			};
			case `leaflitter`: return () => {
				let e = W * 6, t = G * 6, i = Math.floor(e), a = Math.floor(t), o = 0, s = 0, c = 0;
				for (let l = -1; l <= 1; l++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + l, p = (d % 6 + 6) % 6, m = (f % 6 + 6) % 6, h = e - d - .2 - .6 * hash(p, m, r), g = t - f - .2 - .6 * hash(p, m, r ^ 10679), _ = hash(p, m, r ^ 20273) * n, v = Math.cos(_), y = Math.sin(_), b = hash(p, m, r ^ 20905), x = (h * v + g * y) / (.64 + .1 * b), S = (g * v - h * y) / (.26 + .05 * b), C = smooth(clamp((1 - x * x - Math.sqrt(S * S + 1e-4)) / .18)), w = C * Math.exp(-S * S * 260);
					o += (1 - o) * C, c += (1 - c) * w, s += C * (b - .5);
				}
				J = .07 + .09 * K + .56 * o + .16 * Math.tanh(s) - .12 * c, Y = .08 + .035 * K + .61 * o + .045 * c, X += .07 * (K - .5) + .045 * (1 - o), Z = .53 + .44 * o;
			};
			case `endgrain`: return () => {
				let e = fract(W - Te + .5) - .5, t = fract(G - Ee + .5) - .5, i = Math.sin(Math.PI * e) / Math.PI, o = Math.sin(Math.PI * t) / Math.PI, s = Math.sqrt(i * i + o * o + 4e-4), c = noise(W, G, 5, 5, r ^ 31811), l = (.5 + .5 * Math.sin(n * (23 * s + .23 * c) + a)) ** 6, u = smooth(clamp((noise(W, G, 96, 96, r ^ 5607) - .62) / .23)), d = Math.hypot(e, t), f = smooth(clamp((d - .07) / .08)) * smooth(clamp((.43 - d) / .08)) * (.5 + .5 * Math.cos(7 * Math.atan2(t, e) + a)) ** 48;
				J = .76 - .37 * l - .2 * u - .24 * f + .08 * K, Y = .49 - .07 * l - .16 * u - .22 * f + .025 * K, X += .13 * u + .06 * l + .045 * (K - .5), Z = .99 - .17 * u - .22 * f;
			};
			case `acousticfoam`: return () => {
				let e = fract(W * 4) - .5, t = fract(G * 4) - .5, n = Math.sqrt(e * e + 1e-4), i = Math.sqrt(t * t + 1e-4), o = clamp(1 - 2 * (.5 * (n + i + Math.sqrt((n - i) ** 2 + 4e-4)))), s = o < .1 ? o * o * 5 : o > .9 ? .9 - (1 - o) * (1 - o) * 5 : o - .05, c = hash(Math.floor(W * 4), Math.floor(G * 4), r ^ 14289), l = smooth(clamp((noise(W, G, 96, 96, r ^ 27417) - .42) / .46));
				J = .14 + .61 * s + .13 * K - .12 * l, Y = .03 + s * (.88 + .07 * c) + .009 * K - .008 * l, X += .065 * (K - .5) + .025 * l, Z = .43 + .54 * s + .025 * K - .025 * l;
			};
			case `closedcellfoam`: return () => {
				let e = W * 28, t = G * 28, n = Math.floor(e), r = Math.floor(t), i = 0, a = 0, o = 0;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = r + s, d = (l % 28 + 28) % 28, f = ((u % 28 + 28) % 28 * 28 + d) * 4, p = e - l - ke[f], m = t - u - ke[f + 1], h = clamp(1 - (p * p + m * m) * ke[f + 2]), g = h * h;
					i += (1 - i) * g, a += (1 - a) * g * (1 - h) * 6.75, o += g * (ke[f + 3] - .5);
				}
				J = .49 + .18 * K - .13 * i + .08 * a + .1 * o, Y = .48 + .035 * K - .17 * i + .055 * a, X += .065 * (K - .5) + .025 * i, Z = .99 - .065 * i;
			};
			case `linoleum`: return () => {
				let e = noise(W, G, 4, 5, r ^ 22811), t = .5 + .5 * Math.sin(n * (5 * W + 3 * G + 1.2 * e) + a), i = noise(W + .19 * e, G + .08 * t, 48, 8, r ^ 11635), o = smooth(clamp((i - .43) / .4));
				J = .24 + .25 * t + .38 * o + .08 * K, Y = .45 + .025 * K + .015 * i, X += .09 * (i - .5) + .045 * (K - .5), Z = .99 + .008 * K;
			};
			case `orangepeel`: return () => {
				let e = W * Pe, t = G * Fe, n = Math.floor(e), r = Math.floor(t), i = 0, a = 0;
				for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = n + s, l = r + o, u = (c % Pe + Pe) % Pe, d = ((l % Fe + Fe) % Fe * Pe + u) * 3, f = e - c - Ie[d], p = t - l - Ie[d + 1], m = .26 + .14 * Ie[d + 2], h = f * f + p * p, g = clamp(1 - h / (m * m)), _ = clamp(1 - h / .36);
					i += (1 - i) * g * g, a += (1 - a) * _ * _ * (1 - _) * 6.75;
				}
				J = (.48 + .28 * K) * (1 - .35 * i) + .119 * i, Y = (.46 + .025 * K + .045 * a) * (1 - i) + .22 * i, X += .06 * (K - .5) + .035 * i, Z = 1 - .08 * i;
			};
			case `coconut`: return () => {
				let e = W * Pe, t = G * Fe, n = Math.floor(e), r = Math.floor(t), i = 0, a = 0, o = .38 + .18 * K;
				for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = r + s, d = (l % Pe + Pe) % Pe, f = ((u % Fe + Fe) % Fe * Pe + d) * 3, p = e - l - Ie[f], m = t - u - Ie[f + 1], h = Ie[f + 2], g = m / (.48 + .25 * h), _ = (p + (h - .5) * .28 * m) / .12, v = clamp(1 - g * g - _ * _), y = v * v;
					h < .24 ? (a += (1 - a) * y, o = o * (1 - y) + .15 * y) : (i += (1 - i) * y, o = o * (1 - y) + (.55 + .25 * h) * y);
				}
				J = o, Y = (.42 + .055 * K + .18 * i) * (1 - a) + .3 * a, X += .055 * (K - .5) + .025 * i, Z = (.96 + .025 * i) * (1 - a) + .86 * a;
			};
			case `watermelon`: return () => {
				let e = noise(W, G, 4, 5, r ^ 20247), t = noise(W, G, 12, 8, r ^ 26531), o = smooth(clamp((.5 + .5 * Math.sin(n * (5 * W + .3 * e + .12 * t) + a) - .24) / .52)), s = smooth(clamp((noise(W, G, 96, 96, r ^ 23609) - .48) / .4)), c = smooth(clamp((noise(W, G, 80, 80, r ^ 11121) - .5) / .38));
				J = (.12 + .72 * o) * (1 - .2 * s) + .46 * .2 * s, Y = (.48 + .025 * K) * (1 - .14 * c), X += .055 * (K - .5) + .045 * c, Z = 1 - .035 * c;
			};
			case `limestone`: return () => {
				let e = W * 24, t = G * 24, i = Math.floor(e), a = Math.floor(t), o = smooth(clamp((noise(W, G, 96, 96, r ^ 6615) - .49) / .38)), s = 0;
				J = .63 + .14 * K - .16 * o;
				for (let r = -1; r <= 1; r++) for (let o = -1; o <= 1; o++) {
					let c = i + o, l = a + r, u = (c % 24 + 24) % 24, d = ((l % 24 + 24) % 24 * 24 + u) * 7, f = e - c - Le[d], p = t - l - Le[d + 1], m = (f * Le[d + 4] + p * Le[d + 5]) / Le[d + 2], h = (p * Le[d + 4] - f * Le[d + 5]) / (Le[d + 2] * Le[d + 3]), g = m * m + h * h, _ = smooth(clamp((1 - g) / .36)), v = Le[d + 6], y = .5 + .5 * Math.cos(n * 1.5 * g), b = .5 + .24 * v + .16 * y;
					J = J * (1 - _) + b * _, s += (1 - s) * _;
				}
				Y = .47 + .08 * s + .025 * K - .07 * o, X += .06 * (K - .5) + .08 * o - .05 * s, Z = .98 - .12 * o + .015 * s;
			};
			case `breccia`: return () => {
				let e = W * 6, t = G * 6, n = Math.floor(e), a = Math.floor(t), o = noise(W, G, 80, 80, r ^ 23841), s = 0;
				J = .56 + .16 * o, Y = .33 + .035 * o, X += .08 * o;
				for (let r = -1; r <= 1; r++) for (let o = -1; o <= 1; o++) {
					let c = n + o, l = a + r, u = (c % 6 + 6) % 6, d = ((l % 6 + 6) % 6 * 6 + u) * 18, f = e - c - Re[d], p = t - l - Re[d + 1], m = 1;
					for (let e = 0; e < 5; e++) {
						let t = d + 3 + e * 3, n = Re[t + 2] - f * Re[t] - p * Re[t + 1];
						m *= smooth(clamp(n / .055));
					}
					let h = Re[d + 2], g = .15 + .66 * h + .12 * K;
					J = J * (1 - m) + g * m, Y = Y * (1 - m) + (.54 + .1 * h + .025 * K) * m, X = X * (1 - m) + (i.roughness + .08 * (K - .5)) * m, s += (1 - s) * m;
				}
				Z = .81 + .17 * s + .015 * o;
			};
			case `gneiss`: return () => {
				let e = noise(W, G, 4, 4, r ^ 27417), t = G + .28 * Math.sin(n * W + .8 * Math.sin(n * G) + a) + .06 * Math.sin(n * (2 * W - G) + a), i = n * 6 * t + 1.4 * (e - .5), o = smooth(clamp((.5 + .5 * Math.sin(i) - .18) / .64)), s = .5 + .5 * Math.sin(3 * i + .4 * e), l = smooth(clamp((noise(W, G, 96, 96, r ^ 15477) - .52) / .34));
				J = (.12 + .7 * o + .08 * s) * (1 - .3 * l) + .264 * l, Y = .42 + .055 * o + .07 * l + .025 * K, X += .08 * (K - .5) + .06 * (1 - o) - .05 * l, Z = .95 + .025 * o + .015 * l;
			};
			case `plywood`: return () => {
				let e = noise(W, G, 4, 3, r ^ 17335), t = 3.2 * Math.cos(n * W + a) + 1.8 * Math.cos(n * G + .7 * a) + .45 * e, o = (.5 + .5 * Math.sin(n * t)) ** 5, s = .5 + .5 * Math.sin(n * (64 * W + .4 * e) + a);
				J = .67 + .1 * K - .32 * o + .035 * s, Y = .48 + .025 * K - .045 * o + .015 * s, X += .05 * o + .04 * (K - .5), Z = .99 - .045 * o;
				for (let e = 0; e < 2; e++) {
					let t = e * 3, r = fract(W - ze[t] + .5) - .5, a = fract(G - ze[t + 1] + .5) - .5, o = ze[t + 2], s = r * r / (.0025 * o * o) + a * a / (.0169 * o * o), c = Math.max(0, 1 - s), l = c * c, u = .5 + .5 * Math.cos(n * 2 * s);
					J = J * (1 - l) + (.25 + .2 * u) * l, Y = Y * (1 - l) + (.44 + .025 * u) * l, X = X * (1 - l) + (i.roughness + .065 * u) * l, Z = Z * (1 - l) + (.95 + .025 * u) * l;
				}
			};
			case `osb`:
			case `chipboard`: return () => {
				let e = W * Ue, t = G * Ue, n = Math.floor(e), r = Math.floor(t), a = 0;
				J = .24 + .12 * K, Y = .35 + .025 * K, X += .035 * K;
				for (let o = 0; o < 2; o++) for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = r + s, d = (l % Ue + Ue) % Ue, f = (u % Ue + Ue) % Ue, p = ((o * Ue + f) * Ue + d) * 26, m = e - l - V[p], h = t - u - V[p + 1], g = (m * V[p + 2] + h * V[p + 3]) / V[p + 4], _ = (h * V[p + 2] - m * V[p + 3]) / V[p + 5], v = 1;
					for (let e = 0; e < 6; e++) {
						let t = p + 8 + e * 3;
						v *= smooth(clamp((V[t + 2] - g * V[t] - _ * V[t + 1]) / .12));
					}
					if (v === 0) continue;
					let y = V[p + 6], b = .5 + .5 * Math.sin(18 * _ + .65 * Math.sin(3 * g) + V[p + 7]);
					J = J * (1 - v) + (.34 + .44 * y + .1 * b) * v, Y = Y * (1 - v) + (.49 + .12 * y + .025 * b) * v, X = X * (1 - v) + (i.roughness - .045 + .07 * b) * v, a += (1 - a) * v;
				}
				Z = .83 + .15 * a + .015 * K;
			};
			case `crackleglaze`: return () => {
				let e = W * 16 + .6 * (noise(W, G, 4, 4, r ^ 13741) - .5), t = G * 16 + .6 * (noise(W, G, 4, 4, r ^ 29123) - .5), n = Math.floor(e), i = Math.floor(t), a = 0;
				for (let r = -1; r <= 1; r++) for (let o = -1; o <= 1; o++) {
					let s = n + o, c = i + r, l = ((c % 16 + 16) % 16 * 16 + (s % 16 + 16) % 16) * 26, u = e - s - Ge[l], d = t - c - Ge[l + 1], f = 1;
					for (let e = 0; e < 8; e++) {
						let t = l + 2 + e * 3;
						f *= smooth(clamp((Ge[t + 2] - u * Ge[t] - d * Ge[t + 1]) / .024));
					}
					a += f;
				}
				let o = 1 - clamp(a);
				J = (.87 + .035 * K) * (1 - o) + .08 * o, Y = .54 - .12 * o, X += .14 * o + .015 * (K - .5), Z = 1 - .14 * o;
			};
			case `flutedceramic`: return () => {
				let e = .5 + .5 * Math.cos(n * 8 * W + a), t = smooth(clamp((noise(W, G, 96, 96, r ^ 24361) - .65) / .28));
				J = .88 + .035 * K - .12 * t, Y = .2 + .6 * e, X += .035 * (1 - e) + .025 * t, Z = .92 + .08 * e;
			};
			case `encaustictiles`: return () => {
				let e = fract(W * 4), t = fract(G * 4), n = smooth(clamp((Math.min(e, 1 - e) - .02) / .08)) * smooth(clamp((Math.min(t, 1 - t) - .02) / .08)), r = e - .5, i = t - .5, a = r * s + i * c, o = i * s - r * c, l = 0;
				for (let e = 0; e < 4; e++) {
					let t = e < 2 ? a : o, n = e < 2 ? o : a, r = (t - (e % 2 == 0 ? .16 : -.16)) / .19, i = n / .085, s = smooth(clamp((1 - r * r - i * i) / .22));
					l += (1 - l) * s;
				}
				let u = r * r + i * i, d = smooth(clamp((u - .135) / .008)) * (1 - smooth(clamp((u - .158) / .008)));
				J = .94 - .84 * (l + (1 - l) * d) + .012 * (K - .5), Y = .18 + .4 * n, Q = 1 - n, X += .12 * Q + .035 * (K - .5), Z = .77 + .23 * n;
			};
			case `breadcrust`: return () => {
				let e = W * 7, t = G * 7, n = Math.floor(e), i = Math.floor(t), a = 0, o = 0, s = 0;
				for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) {
					let l = n + c, u = i + r, d = ((u % 7 + 7) % 7 * 7 + (l % 7 + 7) % 7) * 27, f = e - l - $e[d], p = t - u - $e[d + 1], m = 1, h = 1;
					for (let e = 0; e < 8; e++) {
						let t = d + 3 + e * 3, n = $e[t + 2] - f * $e[t] - p * $e[t + 1];
						m *= smooth(clamp((n - .025) / .14)), h *= smooth(clamp((n - .025) / .5));
					}
					a += m, o += h, s += m * $e[d + 2];
				}
				let c = noise(W, G, 19, 23, r ^ 18371);
				J = .06 + a * (.42 + .21 * c) + .2 * s, Y = .12 + .42 * a + .26 * o + .012 * a * (K - .5), X += .08 * (1 - a) + .035 * (c - .5), Z = .65 + .35 * a;
			};
			case `wafer`: return () => {
				let e = fract(W * 12), t = fract(G * 12), n = smooth(clamp((Math.min(e, 1 - e) - .07) / .17)) * smooth(clamp((Math.min(t, 1 - t) - .07) / .17)), i = noise(W, G, 24, 24, r ^ 27953);
				J = .46 + .27 * n + .12 * i + .035 * K, Y = .72 - .5 * n + .008 * (K - .5), X += .06 * n + .02 * (i - .5), Z = 1 - .23 * n;
			};
			case `chocolate`: return () => {
				let e = fract(W * 4), t = fract(G * 4), n = smooth(clamp((Math.min(e, 1 - e) - .035) / .105)) * smooth(clamp((Math.min(t, 1 - t) - .035) / .105)), i = noise(W, G, 4, 4, r ^ 12729);
				J = .18 + .46 * n + .065 * i + .008 * K, Y = .14 + .65 * n, X += .1 * (1 - n) + .008 * (i - .5), Z = .73 + .27 * n;
			};
			case `pretzel`: return () => {
				let e = smooth(clamp((.18 - Math.abs(fract((W + G) * 3) - .5)) / .12)), t = smooth(clamp((.18 - Math.abs(fract((W - G) * 3) - .5)) / .12)), n = e + t - e * t, i = e * t, a = smooth(clamp((noise(W, G, 24, 24, r ^ 6575) - .78) / .06)), o = noise(W, G, 16, 16, r ^ 12081);
				J = .42 + .28 * n + .1 * i + .1 * a + .06 * o, Y = .42 + .22 * n + .1 * i + .04 * a + .015 * o, X += .06 * (o - .5) - .12 * i - .18 * a, Z = 1 - .34 * (1 - n) - .1 * (1 - i);
			};
			case `bagel`: return () => {
				let e = Math.min(Math.abs(W - .5), 1 - Math.abs(W - .5)), t = Math.min(Math.abs(G - .5), 1 - Math.abs(G - .5)), n = Math.hypot(e, t) * 2, i = smooth(clamp((.12 - Math.abs(n - .34)) / .06)), a = smooth(clamp((.16 - n) / .08)), o = smooth(clamp((noise(W, G, 20, 20, r ^ 19485) - .78) / .06)), s = noise(W, G, 16, 16, r ^ 23342);
				J = .44 + .3 * i - .16 * a + .12 * o + .06 * s, Y = .46 + .26 * i - .16 * a + .05 * o + .02 * s, X += .06 * (s - .5) - .1 * i - .18 * o, Z = 1 - .3 * a - .14 * (1 - i);
			};
			case `croissant`: return () => {
				let e = fract((W + G) * 4), t = smooth(clamp((.3 - Math.abs(e - .5)) / .14)), n = smooth(clamp((.12 - Math.min(e, 1 - e)) / .03)), i = noise(W, G, 16, 16, r ^ 27975);
				J = .44 + .34 * t - .14 * n + .08 * i, Y = .44 + .28 * t - .06 * n + .03 * i, X += .06 * (i - .5) - .12 * t + .1 * n, Z = 1 - .34 * (1 - t) - .1 * n;
			};
			case `butterflywing`: return () => {
				let e = smooth(clamp((.28 - Math.abs(fract(W * 24) - .5)) / .12)) * smooth(clamp((.28 - Math.abs(fract(G * 16) - .5)) / .12)), t = smooth(clamp((.06 - Math.min(fract(W * 3), 1 - fract(W * 3))) / .025)), n = noise(W, G, 6, 6, r ^ 29123), i = noise(W, G, 48, 48, r ^ 10837);
				J = .42 + .3 * e - .1 * t + .12 * n + .06 * i, Y = .44 + .22 * e - .14 * t + .02 * i, X += .06 * (i - .5) - .1 * e + .12 * t, Z = 1 - .3 * (1 - e) - .24 * t;
			};
			case `beetlewing`: return () => {
				let e = smooth(clamp((.32 - Math.abs(fract(W * 6) - .5)) / .14)), t = smooth(clamp((.12 - Math.min(fract(W * 6), 1 - fract(W * 6))) / .03)), n = smooth(clamp((noise(W, G, 24, 24, r ^ 21930) - .8) / .05)), i = noise(W, G, 32, 32, r ^ 14833);
				J = .42 + .32 * e - .12 * t - .1 * n + .06 * i, Y = .44 + .26 * e - .1 * t - .06 * n + .02 * i, X += .06 * (i - .5) - .12 * e + .1 * t, Z = 1 - .3 * t - .14 * (1 - e) - .18 * n;
			};
			case `spiderweb`: return () => {
				let e = smooth(clamp((.012 - Math.abs(W - .5)) / .008)), t = smooth(clamp((.012 - Math.abs(G - .5)) / .008)), n = Math.abs(W - G), i = Math.abs(W + G - 1), a = smooth(clamp((.012 - Math.min(n, 1 - n)) / .008)), o = smooth(clamp((.012 - Math.min(i, 1 - i)) / .008)), s = 1 - (1 - e) * (1 - t) * (1 - a) * (1 - o), c = Math.hypot(Math.sin(Math.PI * (W - .5)), Math.sin(Math.PI * (G - .5))) * (2 / Math.PI), l = .5 + .5 * Math.cos(Math.PI * 2 * (fract(c * 6) - .5)), u = 1 - (1 - s) * (1 - l), d = smooth(clamp((noise(W, G, 20, 20, r ^ 32033) - .82) / .08)), f = noise(W, G, 32, 32, r ^ 7012);
				J = .4 + .3 * u + .12 * d + .08 * f, Y = .42 + .2 * u + .05 * d + .02 * f, X += .06 * (f - .5) - .16 * u - .1 * d, Z = 1 - .34 * (1 - u);
			};
			case `cirrus`: return () => {
				let e = noise(W, G, 3, 3, r ^ 9029) - .5, t = smooth(clamp((.3 - Math.abs(fract((G + .18 * e) * 6) - .5)) / .16)), n = noise(W, G, 32, 16, r ^ 13398);
				J = .46 + .34 * t + .08 * n, Y = .46 + .22 * t + .02 * n, X += .06 * (n - .5) - .12 * t, Z = 1 - .32 * (1 - t);
			};
			case `cumulus`: return () => {
				let e = smooth(clamp((noise(W, G, 5, 5, r ^ 17767) - .42) / .18)), t = noise(W, G, 12, 12, r ^ 22136);
				J = .48 + .36 * e + .08 * t, Y = .44 + .3 * e + .02 * t, X += .06 * (t - .5) - .1 * e, Z = 1 - .36 * (1 - e);
			};
			case `lightning`: return () => {
				let e = noise(W, G, 4, 4, r ^ 26505) - .5, t = fract((W + G) * 3 + .35 * e), n = smooth(clamp((.022 - Math.abs(t - .5)) / .012)), i = smooth(clamp((.16 - Math.abs(t - .5)) / .14)), a = noise(W, G, 32, 32, r ^ 30874);
				J = .22 + .3 * i + .4 * n + .06 * a, Y = .44 + .16 * i + .18 * n + .02 * a, X += .06 * (a - .5) - .14 * n, Z = 1 - .36 * (1 - i) - .14 * (1 - n);
			};
			case `kelp`: return () => {
				let e = noise(W, G, 4, 4, r ^ 4386) - .5, t = smooth(clamp((.32 - Math.abs(fract((G + .12 * e) * 4) - .5)) / .16)), n = smooth(clamp((noise(W, G, 8, 8, r ^ 8755) - .68) / .08)), i = noise(W, G, 24, 24, r ^ 13124);
				J = .44 + .3 * t + .1 * n + .08 * i, Y = .44 + .28 * t + .05 * n + .02 * i, X += .08 * (i - .5) - .22 * n - .1 * t, Z = 1 - .36 * (1 - t) - .1 * (1 - n);
			};
			case `seaweed`: return () => {
				let e = noise(W, G, 3, 3, r ^ 17493) - .5, t = smooth(clamp((.05 - Math.abs(fract((W + G) * 3 + .3 * e) - .5)) / .03)), n = smooth(clamp((.05 - Math.abs(fract((W - G) * 3 + .3 * e) - .5)) / .03)), i = t + n - t * n, a = noise(W, G, 24, 24, r ^ 21862);
				J = .42 + .3 * i + .08 * a, Y = .44 + .22 * i + .02 * a, X += .06 * (a - .5) - .12 * i, Z = 1 - .34 * (1 - i);
			};
			case `anemone`: return () => {
				let e = Math.hypot(Math.sin(Math.PI * (W - .5)), Math.sin(Math.PI * (G - .5))) * (2 / Math.PI), t = smooth(clamp((e - .12) / .08)), n = (.5 + .5 * Math.cos(Math.PI * 2 * (fract(e * 8) - .5))) * t, i = smooth(clamp((.12 - e) / .06)), a = noise(W, G, 24, 24, r ^ 26231);
				J = .42 + .32 * n - .12 * i + .08 * a, Y = .44 + .26 * n - .12 * i + .02 * a, X += .06 * (a - .5) - .12 * n, Z = 1 - .3 * i - .12 * (1 - n) * t;
			};
			case `candy`: return () => {
				let e = fract((W + G) * 4), t = smooth(clamp((.34 - Math.abs(e - .5)) / .12)), n = smooth(clamp((.1 - Math.min(e, 1 - e)) / .03)), i = noise(W, G, 16, 16, r ^ 30600);
				J = .42 + .36 * t - .12 * n + .08 * i, Y = .44 + .26 * t - .06 * n + .02 * i, X += .08 * (i - .5) - .12 * t, Z = 1 - .32 * (1 - t) - .12 * n;
			};
			case `marshmallow`: return () => {
				let e = fract((W + G) * 5), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((noise(W, G, 20, 20, r ^ 34969) - .7) / .1)), i = noise(W, G, 24, 24, r ^ 39338);
				J = .5 + .3 * t + .1 * n + .06 * i, Y = .44 + .28 * t + .05 * n + .02 * i, X += .06 * (i - .5) - .08 * t, Z = 1 - .32 * (1 - t);
			};
			case `nougat`: return () => {
				let e = smooth(clamp((noise(W, G, 6, 6, r ^ 43707) - .55) / .12)), t = smooth(clamp((noise(W, G, 16, 16, r ^ 48076) - .72) / .05)), n = noise(W, G, 24, 24, r ^ 52445);
				J = .44 + .3 * e - .12 * t + .08 * n, Y = .44 + .24 * e - .1 * t + .02 * n, X += .08 * (n - .5) - .1 * e + .12 * t, Z = 1 - .34 * (1 - e) - .18 * t;
			};
			case `frostedglass`: return () => {
				let e = smooth(clamp((noise(W, G, 32, 32, r ^ 56593) - .42) / .16)), t = noise(W, G, 64, 64, r ^ 60962);
				J = .5 + .26 * e + .08 * t, Y = .46 + .18 * e + .02 * t, X += .08 * (t - .5) - .1 * e, Z = 1 - .28 * (1 - e);
			};
			case `rippledglass`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(W * 6) - .5)), t = noise(W, G, 32, 32, r ^ 65331);
				J = .48 + .32 * e + .08 * t, Y = .46 + .26 * e + .02 * t, X += .08 * (t - .5) - .12 * e, Z = 1 - .3 * (1 - e);
			};
			case `bubbleglass`: return () => {
				let e = fract(W * 8) - .5, t = fract(G * 8) - .5, n = smooth(clamp((.34 - Math.hypot(e, t)) / .14)), i = noise(W, G, 32, 32, r ^ 6724);
				J = .48 + .32 * n + .08 * i, Y = .46 + .24 * n + .02 * i, X += .08 * (i - .5) - .12 * n, Z = 1 - .3 * (1 - n);
			};
			case `saddlestitch`: return () => {
				let e = (W - G) * 2 - .25, t = smooth(clamp((.05 - Math.min(fract(e), 1 - fract(e))) / .03)) * smooth(clamp((.3 - Math.abs(fract((W + G) * 8) - .5)) / .12)), n = noise(W, G, 24, 24, r ^ 11093);
				J = .42 + .3 * t + .08 * n, Y = .44 + .24 * t + .02 * n, X += .06 * (n - .5) - .12 * t, Z = 1 - .32 * (1 - t);
			};
			case `tooledleather`: return () => {
				let e = fract(W * 4) - .5, t = fract(G * 4) - .5, n = Math.hypot(e, t), i = smooth(clamp((.36 - n) / .16)), a = smooth(clamp((.035 - Math.abs(n - .18)) / .02)), o = noise(W, G, 24, 24, r ^ 15462);
				J = .42 + .26 * i + .1 * a + .08 * o, Y = .44 + .22 * i + .08 * a + .02 * o, X += .06 * (o - .5) - .1 * i, Z = 1 - .34 * (1 - i);
			};
			case `patentleather`: return () => {
				let e = smooth(clamp((noise(W, G, 32, 32, r ^ 19831) - .42) / .16)), t = noise(W, G, 6, 6, r ^ 24200);
				J = .44 + .18 * e + .16 * t, Y = .46 + .16 * e + .02 * t, X += .08 * (e - .5), Z = 1 - .18 * (1 - e);
			};
			case `appleskin`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 5) - .5)), t = smooth(clamp((noise(W, G, 28, 28, r ^ 28569) - .8) / .05)), n = noise(W, G, 32, 32, r ^ 31402);
				J = .44 + .32 * e + .1 * t + .06 * n, Y = .46 + .2 * e + .05 * t + .02 * n, X += .06 * (n - .5) - .12 * e, Z = 1 - .3 * (1 - e) - .1 * (1 - t);
			};
			case `peachskin`: return () => {
				let e = smooth(clamp((.045 - Math.abs(W - .5)) / .025)), t = noise(W, G, 32, 32, r ^ 35771);
				J = .46 + .3 * noise(W, G, 6, 6, r ^ 40140) - .12 * e + .08 * t, Y = .46 + .06 * t - .16 * e, X += .08 * (t - .5) + .1 * e, Z = 1 - .4 * e;
			};
			case `grapeskin`: return () => {
				let e = smooth(clamp((noise(W, G, 6, 6, r ^ 44509) - .5) / .16)), t = noise(W, G, 32, 32, r ^ 48878);
				J = .46 + .28 * e + .08 * t, Y = .46 + .18 * e + .02 * t, X += .12 * (e - .5) * 2 + .06 * (t - .5), Z = 1 - .3 * (1 - e);
			};
			case `broccoli`: return () => {
				let e = smooth(clamp((noise(W, G, 10, 10, r ^ 53009) - .45) / .14)), t = smooth(clamp((noise(W, G, 28, 28, r ^ 53282) - .58) / .1)), n = noise(W, G, 32, 32, r ^ 57651);
				J = .42 + .3 * e + .12 * t + .06 * n, Y = .44 + .24 * e + .08 * t + .02 * n, X += .06 * (n - .5) - .08 * e, Z = 1 - .36 * (1 - e) - .1 * (1 - t);
			};
			case `cabbage`: return () => {
				let e = fract((W + G) * 3), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((.045 - Math.min(fract(W * 3), 1 - fract(W * 3))) / .025)) + smooth(clamp((.045 - Math.min(fract(G * 3), 1 - fract(G * 3))) / .025)), i = noise(W, G, 24, 24, r ^ 62020);
				J = .44 + .3 * t - .12 * Math.min(n, 1) + .08 * i, Y = .44 + .26 * t - .1 * Math.min(n, 1) + .02 * i, X += .06 * (i - .5) - .1 * t, Z = 1 - .34 * (1 - t) - .12 * Math.min(n, 1);
			};
			case `onion`: return () => {
				let e = fract((W + G) * 6), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((.035 - Math.abs(fract((W - G) * 8) - .5)) / .02)), i = noise(W, G, 24, 24, r ^ 4949);
				J = .44 + .3 * t + .1 * n + .06 * i, Y = .44 + .24 * t + .05 * n + .02 * i, X += .06 * (i - .5) - .1 * t, Z = 1 - .32 * (1 - t);
			};
			case `bedsheet`: return () => {
				let e = noise(W, G, 4, 4, r ^ 9318) - .5, t = smooth(clamp((.3 - Math.abs(fract((G + .16 * e) * 4) - .5)) / .16)), n = noise(W, G, 32, 32, r ^ 13687);
				J = .5 + .3 * t + .08 * n, Y = .46 + .22 * t + .02 * n, X += .06 * (n - .5) - .1 * t, Z = 1 - .3 * (1 - t);
			};
			case `pillow`: return () => {
				let e = fract(W * 2) - .5, t = fract(G * 2) - .5, n = smooth(clamp((.36 - Math.hypot(e, t)) / .16)), i = smooth(clamp((.045 - Math.min(fract(W * 2), 1 - fract(W * 2))) / .025)) + smooth(clamp((.045 - Math.min(fract(G * 2), 1 - fract(G * 2))) / .025)), a = noise(W, G, 32, 32, r ^ 22425);
				J = .5 + .3 * n - .1 * Math.min(i, 1) + .06 * a, Y = .44 + .24 * n - .12 * Math.min(i, 1) + .02 * a, X += .06 * (a - .5) - .08 * n, Z = 1 - .34 * (1 - n) - .12 * Math.min(i, 1);
			};
			case `mattress`: return () => {
				let e = fract(W * 4) - .5, t = fract(G * 4) - .5, n = smooth(clamp((.18 - Math.hypot(e, t)) / .08)), i = noise(W, G, 24, 24, r ^ 26794);
				J = .46 + .3 * (1 - n) * .4 + .1 * i, Y = .46 + .12 * i - .2 * n, X += .06 * (i - .5), Z = 1 - .42 * n;
			};
			case `tealeaf`: return () => {
				let e = smooth(clamp((noise(W, G, 6, 6, r ^ 31163) - .48) / .14)), t = smooth(clamp((noise(W, G, 14, 14, r ^ 35532) - .62) / .1)), n = noise(W, G, 32, 32, r ^ 39901);
				J = .42 + .3 * e + .12 * t + .06 * n, Y = .44 + .22 * e + .08 * t + .02 * n, X += .06 * (n - .5) - .08 * e, Z = 1 - .36 * (1 - e) - .1 * (1 - t);
			};
			case `matcha`: return () => {
				let e = fract((W + G) * 5), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = noise(W, G, 32, 32, r ^ 44782);
				J = .46 + .3 * t + .08 * n, Y = .46 + .2 * t + .02 * n, X += .06 * (n - .5) - .08 * t, Z = 1 - .3 * (1 - t);
			};
			case `teabag`: return () => {
				let e = smooth(clamp((.12 - Math.abs(fract(W * 24) - .5)) / .06)), t = smooth(clamp((.12 - Math.abs(fract(G * 24) - .5)) / .06)), n = e + t - e * t, i = noise(W, G, 6, 6, r ^ 49151), a = noise(W, G, 32, 32, r ^ 49425);
				J = .46 + .28 * n + .1 * i + .06 * a, Y = .46 + .2 * n + .02 * a, X += .06 * (a - .5) - .1 * n, Z = 1 - .34 * (1 - n);
			};
			case `sanddune`: return () => {
				let e = fract((W + G) * 6), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = noise(W, G, 32, 32, r ^ 53794);
				J = .46 + .3 * t + .08 * n, Y = .46 + .2 * t + .02 * n, X += .06 * (n - .5) - .1 * t, Z = 1 - .3 * (1 - t);
			};
			case `pebblebeach`: return () => {
				let e = fract(W * 5) - .5, t = fract(G * 5) - .5, n = smooth(clamp((.34 - Math.hypot(e, t)) / .14)), i = noise(W, G, 32, 32, r ^ 58163);
				J = .44 + .32 * n + .08 * i, Y = .44 + .26 * n + .02 * i, X += .06 * (i - .5) - .12 * n, Z = 1 - .34 * (1 - n);
			};
			case `foamedge`: return () => {
				let e = smooth(clamp((noise(W, G, 8, 8, r ^ 62532) - .46) / .16)), t = smooth(clamp((noise(W, G, 24, 24, r ^ 5461) - .7) / .08)), n = noise(W, G, 32, 32, r ^ 9830);
				J = .48 + .3 * e + .12 * t + .06 * n, Y = .44 + .22 * e + .06 * t + .02 * n, X += .06 * (n - .5) - .1 * e, Z = 1 - .34 * (1 - e) - .1 * (1 - t);
			};
			case `lavaflow`: return () => {
				let e = fract((W + G) * 5), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((.08 - Math.min(e, 1 - e)) / .04)), i = noise(W, G, 12, 12, r ^ 14199), a = noise(W, G, 32, 32, r ^ 18568);
				J = .34 + .34 * t - .12 * n + .16 * i + .06 * a, Y = .44 + .26 * t - .1 * n + .02 * a, X += .06 * (a - .5) - .12 * t + .12 * n, Z = 1 - .32 * (1 - t) - .18 * n;
			};
			case `cooledlava`: return () => {
				let e = Math.min(fract(W * 4), 1 - fract(W * 4)), t = Math.min(fract(G * 4), 1 - fract(G * 4)), n = smooth(clamp((Math.min(e, t) - .03) / .1)), i = smooth(clamp((noise(W, G, 20, 20, r ^ 22937) - .74) / .06)), a = noise(W, G, 32, 32, r ^ 27306);
				J = .4 + .3 * n - .1 * i + .08 * a, Y = .42 + .24 * n - .08 * i + .02 * a, X += .06 * (a - .5) + .1 * i, Z = 1 - .34 * (1 - n) - .18 * i;
			};
			case `ashfield`: return () => {
				let e = smooth(clamp((noise(W, G, 8, 8, r ^ 31675) - .44) / .18)), t = noise(W, G, 32, 32, r ^ 36044);
				J = .44 + .28 * e + .08 * t, Y = .44 + .22 * e + .02 * t, X += .06 * (t - .5), Z = 1 - .32 * (1 - e);
			};
			case `stalactite`: return () => {
				let e = fract(W * 4) - .5, t = fract(G * 4) - .5, n = smooth(clamp((.32 - Math.hypot(e, t)) / .16)), i = smooth(clamp((noise(W, G, 20, 20, r ^ 40413) - .7) / .08)), a = noise(W, G, 32, 32, r ^ 44782);
				J = .44 + .3 * n + .1 * i + .06 * a, Y = .44 + .26 * n + .05 * i + .02 * a, X += .06 * (a - .5) - .1 * n, Z = 1 - .36 * (1 - n) - .1 * (1 - i);
			};
			case `flowstone`: return () => {
				let e = fract((W + G) * 5), t = smooth(clamp((.34 - Math.abs(e - .5)) / .12)), n = noise(W, G, 24, 24, r ^ 49151), i = noise(W, G, 32, 32, r ^ 49425);
				J = .46 + .3 * t + .08 * n + .06 * i, Y = .44 + .26 * t + .04 * n + .02 * i, X += .06 * (i - .5) - .1 * t, Z = 1 - .32 * (1 - t);
			};
			case `cavefloor`: return () => {
				let e = smooth(clamp((noise(W, G, 8, 8, r ^ 53794) - .46) / .16)), t = smooth(clamp((noise(W, G, 5, 5, r ^ 58163) - .72) / .06)), n = noise(W, G, 32, 32, r ^ 62532);
				J = .42 + .28 * e + .12 * t + .08 * n, Y = .44 + .2 * e - .1 * t + .02 * n, X += .06 * (n - .5) + .2 * t, Z = 1 - .34 * (1 - e) - .1 * t;
			};
			case `jam`: return () => {
				let e = fract(W * 5) - .5, t = fract(G * 5) - .5, n = smooth(clamp((.3 - Math.hypot(e, t)) / .14)), i = noise(W, G, 16, 16, r ^ 5461), a = noise(W, G, 32, 32, r ^ 9830);
				J = .42 + .32 * n + .12 * i + .06 * a, Y = .44 + .22 * n + .02 * a, X += .1 * (a - .5) - .12 * n, Z = 1 - .32 * (1 - n);
			};
			case `peanutbutter`: return () => {
				let e = smooth(clamp((noise(W, G, 10, 10, r ^ 14199) - .6) / .1)), t = noise(W, G, 6, 6, r ^ 18568), n = noise(W, G, 32, 32, r ^ 22937);
				J = .46 + .28 * e + .1 * t + .06 * n, Y = .44 + .18 * e + .04 * t + .02 * n, X += .06 * (n - .5) - .1 * e, Z = 1 - .3 * (1 - e);
			};
			case `sprinkles`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 6) - .5)), t = Math.sin(Math.PI * (fract(G * 6) - .5)), n = clamp((.32 - Math.hypot(e * .5, t * 2)) / .32), i = .5 - .5 * Math.cos(Math.PI * n), a = noise(W, G, 32, 32, r ^ 27306);
				J = .52 + .28 * i + .08 * a, Y = .44 + .22 * i + .02 * a, X += .06 * (a - .5) - .12 * i, Z = 1 - .32 * (1 - i);
			};
			case `icecream`: return () => {
				let e = fract((W + G) * 5), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((noise(W, G, 16, 16, r ^ 31675) - .72) / .08)), i = noise(W, G, 32, 32, r ^ 36044);
				J = .52 + .28 * t + .1 * n + .06 * i, Y = .44 + .24 * t + .05 * n + .02 * i, X += .06 * (i - .5) - .1 * t, Z = 1 - .3 * (1 - t) - .1 * (1 - n);
			};
			case `popsicle`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 8) - .5)), t = noise(W, G, 24, 24, r ^ 40413), n = noise(W, G, 32, 32, r ^ 44782);
				J = .46 + .3 * e + .1 * t + .06 * n, Y = .44 + .22 * e + .04 * t + .02 * n, X += .08 * (n - .5) - .1 * e, Z = 1 - .32 * (1 - e);
			};
			case `sorbet`: return () => {
				let e = fract((W - G) * 6), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((noise(W, G, 12, 12, r ^ 49151) - .68) / .1)), i = noise(W, G, 32, 32, r ^ 49425);
				J = .46 + .28 * t + .12 * n + .06 * i, Y = .44 + .2 * t + .06 * n + .02 * i, X += .06 * (i - .5) - .1 * t, Z = 1 - .3 * (1 - t) - .1 * (1 - n);
			};
			case `spaghetti`: return () => {
				let e = noise(W, G, 4, 4, r ^ 53794) - .5, t = smooth(clamp((.32 - Math.abs(fract((G + .12 * e) * 6) - .5)) / .16)), n = noise(W, G, 8, 8, r ^ 58163), i = noise(W, G, 32, 32, r ^ 62532);
				J = .5 + .3 * t + .1 * n + .06 * i, Y = .46 + .22 * t + .02 * i, X += .06 * (i - .5) - .1 * t, Z = 1 - .32 * (1 - t);
			};
			case `macaroni`: return () => {
				let e = Math.min(fract(W * 4), 1 - fract(W * 4)), t = Math.min(fract(G * 4), 1 - fract(G * 4)), n = smooth(clamp((Math.min(e, t) - .03) / .12)), a = smooth(clamp((.12 - Math.hypot(fract(W * 4) - .5, fract(G * 4) - .5)) / .06)), o = noise(W, G, 32, 32, r ^ 5461);
				J = .5 + .3 * n - .12 * a + .06 * o, Y = .46 + .2 * n - .14 * a + .02 * o, X += .06 * (o - .5) - .1 * n, Z = 1 - .34 * (1 - n) - .2 * a;
			};
			case `lasagna`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 4) - .5)), t = smooth(clamp((noise(W, G, 14, 14, r ^ 9830) - .68) / .1)), n = noise(W, G, 32, 32, r ^ 14199);
				J = .44 + .32 * e + .1 * t + .06 * n, Y = .44 + .24 * e + .05 * t + .02 * n, X += .06 * (n - .5) - .1 * e, Z = 1 - .32 * (1 - e);
			};
			case `origami`: return () => {
				let e = Math.abs(fract((W + G) * 2) - .5), t = Math.abs(fract((W - G) * 2) - .5), n = smooth(clamp((.34 - e) / .16)) + smooth(clamp((.34 - t) / .16)) - smooth(clamp((.34 - e) / .16)) * smooth(clamp((.34 - t) / .16)), i = smooth(clamp((.05 - Math.min(fract((W + G) * 2), 1 - fract((W + G) * 2))) / .025)) + smooth(clamp((.05 - Math.min(fract((W - G) * 2), 1 - fract((W - G) * 2))) / .025)), a = noise(W, G, 32, 32, r ^ 18568);
				J = .46 + .3 * n - .1 * Math.min(i, 1) + .06 * a, Y = .44 + .24 * n - .1 * Math.min(i, 1) + .02 * a, X += .06 * (a - .5) - .08 * n, Z = 1 - .3 * (1 - n) - .12 * Math.min(i, 1);
			};
			case `paperlace`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 6) - .5)), t = Math.sin(Math.PI * (fract(G * 6) - .5)), n = smooth(clamp((.16 - Math.hypot(e, t)) / .07)), i = noise(W, G, 32, 32, r ^ 22937);
				J = .52 + .28 * (1 - n) + .06 * i, Y = .46 + .2 * (1 - n) + .02 * i, X += .06 * (i - .5) + .1 * n, Z = 1 - .36 * n;
			};
			case `papercut`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 5) - .5)), t = Math.sin(Math.PI * (fract(G * 5) - .5)), n = smooth(clamp((.5 - Math.hypot(e * .7, t)) / .2)), i = noise(W, G, 32, 32, r ^ 27306);
				J = .42 + .34 * n + .08 * i, Y = .44 + .24 * n + .02 * i, X += .06 * (i - .5) - .08 * n, Z = 1 - .32 * (1 - n);
			};
			case `sunflower`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 10) - .5)), t = Math.sin(Math.PI * (fract(G * 10) - .5)), n = clamp((.6 - Math.hypot(e * .9, t * 1.4)) / .6), i = .5 - .5 * Math.cos(Math.PI * n), a = noise(W, G, 32, 32, r ^ 31675);
				J = .44 + .3 * i + .08 * a, Y = .44 + .24 * i + .02 * a, X += .06 * (a - .5) - .1 * i, Z = 1 - .32 * (1 - i);
			};
			case `daisy`: return () => {
				let e = Math.sin(Math.PI * (W - .5)), t = Math.sin(Math.PI * (G - .5)), n = Math.hypot(e, t), i = (.5 + .5 * Math.cos(Math.atan2(t, e) * 12)) * smooth(clamp((n - .16) / .1)) * smooth(clamp((.6 - n) / .1)), a = smooth(clamp((.16 - n) / .06)), o = noise(W, G, 32, 32, r ^ 36044);
				J = .46 + .32 * i - .12 * a + .06 * o, Y = .44 + .22 * i - .1 * a + .02 * o, X += .06 * (o - .5) - .08 * i, Z = 1 - .3 * (1 - i) - .14 * a;
			};
			case `clover`: return () => {
				let e = Math.sin(Math.PI * (W - .5)), t = Math.sin(Math.PI * (G - .5)), n = Math.hypot(e, t), i = (.5 + .5 * Math.cos(Math.atan2(t, e) * 3)) * smooth(clamp((.5 - n) / .14)), a = noise(W, G, 12, 12, r ^ 40413), o = noise(W, G, 32, 32, r ^ 44782);
				J = .4 + .34 * i + .08 * a + .06 * o, Y = .42 + .24 * i + .03 * a + .02 * o, X += .06 * (o - .5) - .08 * i, Z = 1 - .34 * (1 - i);
			};
			case `puzzletile`: return () => {
				let e = Math.min(fract(W * 2), 1 - fract(W * 2)), t = Math.min(fract(G * 2), 1 - fract(G * 2)), n = smooth(clamp((Math.min(e, t) - .02) / .05)), i = smooth(clamp((.13 - Math.hypot(e, fract(G * 2) - .5)) / .05)), a = smooth(clamp((.13 - Math.hypot(t, fract(W * 2) - .5)) / .05)), o = 1 - (1 - n) * (1 - i) * (1 - a), s = noise(W, G, 32, 32, r ^ 48076);
				J = .44 + .3 * o + .08 * s, Y = .44 + .24 * o + .02 * s, X += .06 * (s - .5) - .1 * o, Z = 1 - .34 * (1 - o);
			};
			case `legobrick`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 4) - .5)), t = Math.sin(Math.PI * (fract(G * 4) - .5)), n = clamp((.55 - Math.hypot(e * .8, t * .8)) / .55), i = .5 - .5 * Math.cos(Math.PI * n), a = noise(W, G, 32, 32, r ^ 52700);
				J = .46 + .3 * i + .06 * a, Y = .44 + .24 * i + .02 * a, X += .06 * (a - .5) - .1 * i, Z = 1 - .3 * (1 - i);
			};
			case `rubberband`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 3) - .5)), t = .5 + .5 * Math.cos(Math.PI * 2 * (fract(W * 3) - .5)), n = e + t - e * t, i = noise(W, G, 32, 32, r ^ 56814);
				J = .42 + .3 * n + .08 * i, Y = .44 + .2 * n + .02 * i, X += .06 * (i - .5) - .1 * n, Z = 1 - .32 * (1 - n);
			};
			case `haybale`: return () => {
				let e = noise(W, G, 3, 3, r ^ 58436) - .5, t = .5 + .5 * Math.cos(Math.PI * 2 * (fract((W + G + .008 * e) * 10) - .5)), n = smooth(clamp((.08 - Math.min(fract(W * 3), 1 - fract(W * 3))) / .04)), i = noise(W, G, 32, 32, r ^ 62805);
				J = .46 + .3 * t - .1 * n + .08 * i, Y = .44 + .22 * t - .1 * n + .02 * i, X += .06 * (i - .5) - .1 * t + .08 * n, Z = 1 - .32 * (1 - t) - .14 * n;
			};
			case `corncrib`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 4) - .5)), t = .5 + .5 * Math.cos(Math.PI * 2 * (fract(W * 3) - .5)), n = e + t - e * t, i = noise(W, G, 32, 32, r ^ 5734);
				J = .4 + .32 * n + .08 * i, Y = .42 + .24 * n + .02 * i, X += .06 * (i - .5) - .1 * n, Z = 1 - .34 * (1 - n);
			};
			case `fencepost`: return () => {
				let e = fract(W * 6), t = .5 + .5 * Math.cos(Math.PI * 2 * (e - .5)), n = smooth(clamp((.03 - Math.min(e, 1 - e)) / .015)), i = smooth(clamp((noise(W, G, 10, 10, r ^ 10103) - .72) / .08)), a = noise(W, G, 32, 32, r ^ 14472);
				J = .44 + .3 * t - .12 * n + .08 * i + .06 * a, Y = .44 + .22 * t - .1 * n + .02 * a, X += .06 * (a - .5) - .08 * t + .1 * n, Z = 1 - .32 * (1 - t) - .16 * n;
			};
			case `poolfelt`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 8) - .5)), t = Math.sin(Math.PI * (fract(G * 8) - .5)), n = smooth(clamp((.18 - Math.hypot(e, t)) / .08)), i = noise(W, G, 32, 32, r ^ 18841);
				J = .36 + .34 * n + .1 * i, Y = .46 + .16 * n + .02 * i, X += .06 * (i - .5) - .06 * n, Z = 1 - .28 * (1 - n);
			};
			case `icesurface`: return () => {
				let e = noise(W, G, 3, 3, r ^ 23210) - .5, t = .5 + .5 * Math.cos(Math.PI * 2 * (fract((W + G + .008 * e) * 7) - .5)), n = smooth(clamp((noise(W, G, 20, 20, r ^ 27579) - .72) / .08)), i = noise(W, G, 32, 32, r ^ 31948);
				J = .52 + .28 * t + .1 * n + .08 * i, Y = .46 + .18 * t + .04 * n + .02 * i, X += .08 * (i - .5) + .2 * n, Z = 1 - .3 * (1 - t) - .1 * (1 - n);
			};
			case `climbingwall`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 3) - .5)), t = Math.sin(Math.PI * (fract(G * 3) - .5)), n = clamp((.5 - Math.hypot(e * .8, t)) / .5), i = .5 - .5 * Math.cos(Math.PI * n), a = noise(W, G, 32, 32, r ^ 36317);
				J = .4 + .34 * i + .08 * a, Y = .42 + .28 * i + .02 * a, X += .06 * (a - .5) - .08 * i, Z = 1 - .36 * (1 - i);
			};
			case `oledpanel`: return () => {
				let e = fract(W * 6), t = fract(G * 6), n = .5 - .5 * Math.cos(Math.PI * 2 * (e - .5)), i = .5 - .5 * Math.cos(Math.PI * 2 * (t - .5)), a = smooth(clamp((n - .74) / .26)), o = smooth(clamp((i - .74) / .26)), s = a + o - a * o, c = fract(e * 3), u = smooth(clamp((.5 - .5 * Math.cos(Math.PI * 2 * (c - .5)) - .8) / .2)), d = s + u - s * u;
				J = .16 + .84 * (.55 + .45 * hash(Math.floor(e * 3), Math.floor(G * 6), r ^ 6699)) * (1 - d), Y = .28 + .44 * (1 - d), X += .1 * d - .04 * (1 - d), Z = 1 - .34 * d;
			};
			case `crtscanline`: return () => {
				let e = .5 + .5 * Math.cos(Math.PI * 2 * (fract(G * 10) - .5)), t = noise(W, G, 32, 32, r ^ 11068), n = noise(W, G, 64, 64, r ^ 15437);
				J = .1 + .72 * e + .12 * t + .06 * n, Y = .24 + .5 * e + .04 * t, X += .08 * (1 - e) + .06 * (n - .5), Z = 1 - .36 * (1 - e);
			};
			case `keyboardkey`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 6) - .5)), t = Math.sin(Math.PI * (fract(G * 6) - .5)), i = smooth(clamp((.86 - (Math.abs(e) ** 4 + Math.abs(t) ** 4) ** .25) / .5)), a = noise(W, G, 32, 32, r ^ 19806);
				J = .34 + .4 * i + .08 * a, Y = .26 + .46 * i + .04 * a, X += .06 * (a - .5) - .06 * i, Z = 1 - .34 * (1 - i);
			};
			case `filmstrip`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 4) - .5)), t = Math.sin(Math.PI * (fract(G * 2) - .5)), n = smooth(clamp((.3 - Math.hypot(e, t)) / .28)), i = (1 + Math.cos(Math.PI * 2 * fract(G * 2))) / 2, a = noise(W, G, 16, 32, r ^ 24175);
				J = (.45 + .2 * a) * (1 - .8 * n) * (1 - .25 * i), Y = .62 - .4 * n - .2 * i + .02 * a, X += .05 * a + .12 * n, Z = 1 - .45 * n - .18 * i;
			};
			case `postagestamp`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 8 + .5) - .5)), t = Math.sin(Math.PI * G), n = Math.sin(Math.PI * (fract(G * 8 + .5) - .5)), i = Math.sin(Math.PI * W), a = Math.hypot(e, t), o = Math.hypot(n, i), s = smooth(clamp((.3 - a) / .28)), c = smooth(clamp((.3 - o) / .28)), l = s + c - s * c, u = smooth(clamp((.4 - Math.hypot(W - .5, G - .5)) / .12)), d = noise(W, G, 32, 32, r ^ 28538);
				J = (.5 + .28 * u + .1 * d) * (1 - .72 * l), Y = .5 + .13 * u - .42 * l + .03 * d, X += .08 * (d - .5) + .1 * l, Z = 1 - .5 * l;
			};
			case `halftoneprint`: return () => {
				let e = (W + G) * 6, t = (W - G) * 6, n = Math.sin(Math.PI * (fract(e) - .5)), i = Math.sin(Math.PI * (fract(t) - .5)), a = Math.hypot(n, i), o = noise(W, G, 4, 4, r ^ 31371), s = noise(W, G, 64, 64, r ^ 35740), c = smooth(clamp((.28 + .42 * o - a) / .22));
				J = .28 + .55 * c + .08 * s, Y = .35 + .5 * c + .02 * s, X += .12 * (1 - c) + .05 * (s - .5), Z = 1 - .55 * (1 - c);
			};
			case `radiator`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(W * 5) - .5))) / 2, t = noise(W, G, 32, 32, r ^ 40109);
				J = .34 + .5 * e + .08 * t, Y = .32 + .6 * e + .02 * t, X += .08 * (t - .5) - .06 * e, Z = 1 - .5 * (1 - e);
			};
			case `screwhead`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 4) - .5)), t = Math.sin(Math.PI * (fract(G * 4) - .5)), n = smooth(clamp((.55 - Math.hypot(e, t)) / .3)), i = 1 - smooth(clamp((Math.abs(e) - .08) / .12)), a = 1 - smooth(clamp((Math.abs(t) - .08) / .12)), o = (i + a - i * a) * n, s = noise(W, G, 32, 32, r ^ 44478);
				J = .4 + .3 * n - .28 * o + .06 * s, Y = .45 + .28 * n - .42 * o, X += .08 * (s - .5) + .1 * o, Z = 1 - .4 * o - .1 * (1 - n) * (1 - o);
			};
			case `chainlink`: return () => {
				let e = Math.sin(Math.PI * (fract(W + G + .5) - .5)), t = Math.sin(Math.PI * (fract(W - G + .5) - .5)), n = smooth(clamp((.22 - Math.abs(e)) / .18)), i = smooth(clamp((.22 - Math.abs(t)) / .18)), a = n + i - n * i, o = n * i, s = noise(W, G, 32, 32, r ^ 48847);
				J = .3 + .36 * a + .1 * o + .08 * s, Y = .3 + .44 * a + .16 * o + .02 * s, X += .08 * (s - .5) - .1 * a, Z = 1 - .55 * (1 - a) - .12 * (1 - o);
			};
			case `friedegg`: return () => {
				let e = noise(W, G, 4, 4, r ^ 53200) - .5, t = noise(W, G, 4, 4, r ^ 53473) - .5, n = noise(W, G, 4, 4, r ^ 57842) - .5, i = Math.hypot(W - .5 + .06 * e, G - .5 + .06 * t), a = smooth(clamp((.16 - i) / .06)), o = smooth(clamp((.34 - (i + .1 * n)) / .1)), s = noise(W, G, 32, 32, r ^ 61955);
				J = .4 + .34 * a + .2 * o + .05 * s, Y = .3 + .45 * a + .18 * o + .02 * s, X += .1 * (1 - a) - .06 * o, Z = .5 + .5 * (a + o - a * o);
			};
			case `sushirice`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 6) - .5)), t = Math.sin(Math.PI * (fract(G * 6) - .5)), n = noise(W, G, 6, 6, r ^ 788) - .5, i = noise(W, G, 6, 6, r ^ 5157) - .5, a = 1 + .16 * (n * (2 * e * e - 1) + i * (2 * t * t - 1)), s = smooth(clamp((.34 - Math.hypot(e * 1.2, t * .8) * a) / .22)), c = noise(W, G, 32, 32, r ^ 9526);
				J = .62 + .28 * s + .06 * c, Y = .34 + .5 * s + .03 * c, X += .08 * (c - .5) - .08 * s, Z = 1 - .5 * (1 - s);
			};
			case `chocolatechip`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 3) - .5)), t = Math.sin(Math.PI * (fract(G * 3) - .5)), n = Math.hypot(e, t), a = smooth(clamp((.45 + .1 * hash(Math.floor(W * 3), Math.floor(G * 3), r ^ 13895) - n) / .12)), o = noise(W, G, 32, 32, r ^ 18264);
				J = .62 - .3 * a + .08 * o, Y = .36 + .34 * a + .03 * o, X += .06 * (o - .5) - .1 * a, Z = 1 - .45 * (1 - a);
			};
			case `cargomat`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(W * 4) - .5))) / 2, t = (1 + Math.cos(Math.PI * 2 * fract(G * 2))) / 2, n = noise(W, G, 32, 32, r ^ 22633);
				J = (.36 + .1 * n) * (1 - .28 * t) * (.55 + .45 * e), Y = .28 + .52 * e - .22 * t + .02 * n, X += .06 * n + .1 * (1 - e), Z = 1 - .4 * (1 - e) - .24 * t;
			};
			case `dashboardgrain`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 10) - .5)), t = Math.sin(Math.PI * (fract(G * 10) - .5)), n = smooth(clamp((.5 - Math.hypot(e, t)) / .34)), i = noise(W, G, 32, 32, r ^ 27002), o = smooth(clamp(((1 + Math.cos(Math.PI * 2 * fract(W * 2))) / 2 - .8) / .2)), s = n * (.7 + .3 * i);
				J = .42 + .3 * s + .06 * i - .12 * o, Y = .34 + .42 * s - .2 * o + .02 * i, X += .06 * i + .1 * o - .06 * n, Z = 1 - .4 * (1 - n) - .2 * o;
			};
			case `licenseplate`: return () => {
				let e = .5 - .5 * Math.cos(Math.PI * 2 * (W - .5)), t = .5 - .5 * Math.cos(Math.PI * 2 * (G - .5)), n = smooth(clamp((e - .72) / .24)), i = smooth(clamp((t - .72) / .24)), a = n + i - n * i, o = (1 + Math.cos(Math.PI * 2 * (fract(G * 4) - .5))) / 2, s = noise(W, G, 32, 32, r ^ 31371), c = o * (1 - a);
				J = .44 + .2 * a + .12 * c + .05 * s, Y = .3 + .4 * a + .22 * c + .02 * s, X += .06 * (s - .5) - .1 * a, Z = 1 - .3 * (1 - a) * (1 - o);
			};
			case `flowerbed`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 3) - .5)), t = Math.sin(Math.PI * (fract(G * 3) - .5)), n = Math.hypot(e, t), i = .72 + .28 * (Math.cos(Math.PI * 2 * 3 * (W + G)) * Math.cos(Math.PI * 2 * 3 * (W - G))), a = smooth(clamp((.5 - n) / .3)) * i, o = noise(W, G, 32, 32, r ^ 35740);
				J = .3 + .32 * a + .1 * o, Y = .3 + .5 * a + .03 * o, X += .08 * (o - .5) - .1 * a, Z = 1 - .5 * (1 - a);
			};
			case `grassstripe`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(G * 2) - .5))) / 2, t = noise(W, G, 48, 8, r ^ 40109), n = noise(W, G, 16, 16, r ^ 44478);
				J = .34 + .36 * e + .12 * t + .06 * n, Y = .3 + .42 * e + .08 * t + .03 * n, X += .08 * (n - .5) + .06 * (1 - e), Z = 1 - .42 * (1 - e);
			};
			case `topiary`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 3) - .5)), t = Math.sin(Math.PI * (fract(G * 3) - .5)), n = Math.hypot(e, t), i = noise(W, G, 3, 3, r ^ 48847) - .5, a = noise(W, G, 3, 3, r ^ 53200) - .5, s = smooth(clamp((.52 - n * (1 + .16 * (i * (2 * e * e - 1) + a * (2 * t * t - 1)))) / .3)), c = noise(W, G, 32, 32, r ^ 53473);
				J = .28 + .3 * s + .1 * c, Y = .3 + .48 * s + .04 * c, X += .08 * (c - .5) - .08 * s, Z = 1 - .48 * (1 - s);
			};
			case `confetti`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 4) - .5)), t = Math.sin(Math.PI * (fract(G * 4) - .5)), n = (Math.abs(e) ** 4 + Math.abs(t) ** 4) ** .25, a = smooth(clamp((.52 + .16 * hash(Math.floor(W * 4), Math.floor(G * 4), r ^ 57842) - n) / .12)), o = noise(W, G, 32, 32, r ^ 61955);
				J = .4 + .3 * a + .1 * o, Y = .34 + .4 * a + .03 * o, X += .06 * (o - .5) - .1 * a, Z = 1 - .44 * (1 - a);
			};
			case `ribbonstreamer`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract((W + G) * 3) - .5))) / 2, t = noise(W, G, 4, 4, r ^ 5157) - .5, n = noise(W, G, 32, 32, r ^ 9526);
				J = .36 + .34 * e + .12 * n + .08 * t, Y = .3 + .46 * e + .03 * n, X += .08 * (n - .5) - .1 * e, Z = 1 - .46 * (1 - e);
			};
			case `pinatafringe`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(W * 14) - .5))) / 2, t = (1 + Math.cos(Math.PI * 2 * fract(G * 3))) / 2, n = noise(W, G, 32, 32, r ^ 13895);
				J = .34 + .3 * e + .12 * n - .14 * t, Y = .28 + .44 * e - .2 * t + .03 * n, X += .06 * (n - .5) + .1 * t, Z = 1 - .4 * (1 - e) - .2 * t;
			};
			case `xylophone`: return () => {
				let e = (1 + Math.cos(Math.PI * 2 * (fract(W * 4) - .5))) / 2, t = smooth(clamp((.18 - Math.hypot(Math.sin(Math.PI * (fract(W * 4) - .5)), Math.sin(Math.PI * (fract(G * 2) - .5)))) / .12)), n = noise(W, G, 32, 8, r ^ 18264);
				J = .4 + .32 * e + .1 * n - .22 * t, Y = .3 + .46 * e - .24 * t + .03 * n, X += .06 * (n - .5) + .12 * t, Z = 1 - .44 * (1 - e) - .18 * t;
			};
			case `tambourine`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 5) - .5)), t = Math.sin(Math.PI * (fract(G * 5) - .5)), i = smooth(clamp((.46 - Math.hypot(e * 1.35, t * .85)) / .16)), a = noise(W, G, 32, 32, r ^ 22633);
				J = .38 + .34 * i + .1 * a, Y = .32 + .42 * i + .03 * a, X += .06 * (a - .5) - .12 * i, Z = 1 - .46 * (1 - i);
			};
			case `castanet`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 3) - .5)), t = Math.sin(Math.PI * (fract(G * 3) - .5)), n = Math.hypot(e, t), i = smooth(clamp((.56 - n) / .3)), a = smooth(clamp((.16 - n) / .1)), o = noise(W, G, 32, 32, r ^ 27002);
				J = .42 + .26 * i - .18 * a + .08 * o, Y = .3 + .42 * i - .3 * a, X += .06 * (o - .5) + .1 * a, Z = 1 - .44 * (1 - i) - .12 * a;
			};
			case `pillcapsule`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 3) - .5)), t = Math.sin(Math.PI * (fract(G * 2) - .5)), i = smooth(clamp((.52 - Math.hypot(e * .72, t * 1.25)) / .3)), a = (1 - smooth(clamp((Math.abs(t) - .06) / .12))) * i, o = noise(W, G, 32, 32, r ^ 31371);
				J = .46 + .28 * i - .2 * a + .06 * o, Y = .3 + .44 * i - .26 * a, X += .06 * (o - .5) + .12 * a, Z = 1 - .44 * (1 - i) - .12 * a;
			};
			case `pilltablet`: return () => {
				let e = Math.sin(Math.PI * (fract(W * 4) - .5)), t = Math.sin(Math.PI * (fract(G * 4) - .5)), n = smooth(clamp((.62 - Math.hypot(e, t)) / .3)), i = (1 - smooth(clamp((Math.abs(e) - .05) / .1))) * n, a = noise(W, G, 32, 32, r ^ 35740);
				J = .5 + .26 * n - .2 * i + .06 * a, Y = .3 + .42 * n - .24 * i, X += .06 * (a - .5) + .12 * i, Z = 1 - .44 * (1 - n) - .12 * i;
			};
			case `bathbomb`: return () => {
				let e = Math.sin(Math.PI * (fract((W + G) * 4) - .5)), t = Math.sin(Math.PI * (fract((W - G) * 4) - .5)), n = smooth(clamp((Math.abs(e) - .62) / .2)) + smooth(clamp((Math.abs(t) - .62) / .2)) - smooth(clamp((Math.abs(e) - .62) / .2)) * smooth(clamp((Math.abs(t) - .62) / .2)), i = noise(W, G, 24, 24, r ^ 40109), a = smooth(clamp((i - .34) / .3));
				J = .42 + .26 * a - .16 * n + .08 * i, Y = .34 + .02 * i - .22 * n, X += .08 * (i - .5) + .12 * n, Z = 1 - .4 * n - .16 * (1 - a);
			};
			case `basketball`: return () => {
				let e = W * H, t = G * H, r = Math.floor(e), i = Math.floor(t), a = 0;
				for (let n = -1; n <= 1; n++) for (let o = -1; o <= 1; o++) {
					let s = r + o, c = i + n, l = ((c % H + H) % H * H + (s % H + H) % H) * et, u = e - s - tt[l], d = t - c - tt[l + 1], f = smooth(clamp(1 - (u * u + d * d) * tt[l + 2]));
					a += (1 - a) * f;
				}
				let o = Math.abs(Math.sin(n * (2 * W + .12 * Math.sin(n * G)))), s = Math.abs(Math.sin(n * (2 * G + .12 * Math.sin(n * W)))), c = smooth(clamp((o - .035) / .105)) * smooth(clamp((s - .035) / .105));
				J = .025 + c * (.64 + .24 * a + .025 * K), Y = .12 + c * (.46 + .22 * a), X += .045 * a - .08 * (1 - c), Z = .64 + .36 * c;
			};
			case `tennisball`: return () => {
				let e = W * H, t = G * H, r = Math.floor(e), i = Math.floor(t), a = 0;
				for (let n = -1; n <= 1; n++) for (let o = -1; o <= 1; o++) {
					let s = r + o, c = i + n, l = ((c % H + H) % H * H + (s % H + H) % H) * et, u = e - s - tt[l], d = t - c - tt[l + 1], f = (u * tt[l + 2] + d * tt[l + 3]) / .48, p = (-u * tt[l + 3] + d * tt[l + 2]) / .065, m = smooth(clamp(1 - f * f - p * p));
					a += (1 - a) * m;
				}
				let s = 1 - smooth(clamp((Math.abs(Math.sin(n * (G - .19 * Math.sin(n * W) - .25))) - .025) / .075));
				J = (.16 + .1 * K + .06 * a) * (1 - s) + .97 * s, Y = .54 + (1 - s) * (.065 * a + .018 * K) - .12 * s, X -= .1 * s, Z = 1 - .12 * s;
			};
			case `golfball`: return () => {
				let e = fract(W * 10 - nt) - .5, t = fract(G * 10 - rt) - .5, n = clamp(1 - (e * e + t * t) / (.41 * .41)) ** 2;
				J = .96 - .12 * n, Y = .8 - .6 * n, X += .04 * n, Z = 1 - .2 * n;
			};
			case `boardformedconcrete`: return () => {
				let e = Math.floor(G * 8), t = fract(G * 8), r = fract(W * 2 + e % 2 * .5), i = Math.floor(fract(W + e % 2 * .25) * 2), a = smooth(clamp(r / .018)) * smooth(clamp((1 - r) / .018)) * smooth(clamp(t / .055)) * smooth(clamp((1 - t) / .055)), o = ct[e * 2 + i], s = st(W, G + .002 * Math.sin(n * W + o * n)), c = at(W, G);
				J = .39 + a * (.12 + .09 * o + .055 * s) + .025 * c, Y = .18 + a * (.48 + .025 * o + .025 * s) + .008 * c, X += .025 * s * a + .025 * c, Z = .75 + .25 * a;
			};
			case `ribbedconcrete`: return () => {
				let e = fract(W * 12), t = Math.floor(W * 12), n = smooth(clamp((e - .12) / .18)) * smooth(clamp((.88 - e) / .18)), r = at(W, G), i = ot(W, G), a = ct[t];
				J = .38 + .17 * n + .055 * i + .025 * r + .025 * a * n, Y = .15 + .65 * n + .009 * r + .006 * i + .008 * a * n, X += .035 * r + .02 * i, Z = .69 + .31 * n;
			};
			case `splitfaceblock`: return () => {
				let e = Math.floor(G * 8), t = fract(G * 8), n = W * 4 + e % 2 * .5, r = fract(n), i = Math.floor(n) % 4, a = smooth(clamp((r - .04) / .08)) * smooth(clamp((.96 - r) / .08)) * smooth(clamp((t - .06) / .09)) * smooth(clamp((.94 - t) / .09)), o = ct[e * 4 + i], s = ot(W, G), c = at(W, G), l = smooth(clamp((s - .22) / .56));
				J = .4 + a * (.04 + .28 * l + .1 * o + .06 * c), Y = .14 + a * (.34 + .25 * l + .1 * o + .08 * c), X -= .1 * (1 - a), X += .035 * c * a, Z = .64 + a * (.29 + .07 * l), Q = 1 - a;
			};
			case `chainmail`: return () => {
				let e = W * 6, t = G * 8, n = Math.floor(t), r = ut(W, G);
				J = .035 + .025 * r, Y = .06 + .008 * r, X = .88 + .04 * r, Z = .59;
				for (let a = -1; a <= 1; a++) {
					let o = n + a, s = (o + 8) % 8, c = s % 2 * .5, l = Math.floor(e - c);
					for (let n = -1; n <= 1; n++) {
						let a = l + n, u = (a + 6) % 6, d = e - a - c - .5, f = t - o - .5, m = clamp(1 - ((Math.sqrt(d * d + f * f) - .62) / .105) ** 2), h = smooth(m), g = dt[s * 6 + u], _ = .44 + .26 * m + (s % 2 ? -1 : 1) * f * (.13 + .04 * g);
						J += h * (.63 + .13 * g + .04 * r - J), Y += h * (_ - Y), X += h * (i.roughness + .04 * r - X), Z += h * (.88 + .1 * m - Z), $ += h * (1 - $);
					}
				}
			};
			case `rivetedmetal`: return () => {
				let e = fract(W * 3), t = fract(G * 4), n = smooth(clamp(e / .045)) * smooth(clamp((1 - e) / .045)) * smooth(clamp(t / .045)) * smooth(clamp((1 - t) / .045)), r = Math.floor(G * 4) * 3 + Math.floor(W * 3), i = dt[r], a = ut(W, G), o = 0;
				for (let n = 0; n < 2; n++) for (let r = 0; r < 2; r++) {
					let i = e - (r ? .88 : .12), a = t - (n ? .88 : .12), s = clamp(1 - (i * i + a * a) / .002704);
					o += s * s;
				}
				J = .28 + n * (.19 + .09 * i) + .13 * o + .03 * a, Y = .09 + n * (.23 + .025 * i) + .57 * o + .004 * a, X += .1 * (1 - n) - .09 * o + .025 * a, Z = .64 + .34 * n + .02 * o;
			};
			case `weldedmetal`: return () => {
				let e = fract(W * 3 + .5) - .5, t = .5 + .5 * Math.cos(n * 32 * G + a), i = smooth(clamp(1 - (e / (.065 + .015 * t)) ** 2)), o = smooth(clamp(1 - (e / .15) ** 2)), s = ut(W, G);
				J = .52 + .04 * s - .16 * o + i * (.19 + .08 * t), Y = .2 + .004 * s + i * (.46 + .15 * t), X += .12 * o - .05 * i + .025 * s, Z = 1 - .15 * o * (1 - i);
			};
		}
		throw Error(`Procedural material ${t} has no sampler case in createSurfaceSampler.`);
	}, on = pick(), sn = !(it || t === `flutedwood` || t === `subwaytiles` || t === `canewebbing` || t === `rammedearth` || t === `copperpatina` || t === `birdseyemaple` || t === `breezeblock` || t === `basketweavepavers` || t === `ripstop` || t === `octagondot` || t === `truchettiles` || t === `standingseam` || t === `damascus` || t === `windmillpavers` || t === `castiron` || t === `porphyry` || t === `linen` || t === `chippedenamel` || t === `perforatedleather` || t === `argyle` || t === `chevronparquet` || t === `ginkgoleaf` || t === `pressedtin` || t === `sashiko` || t === `ashlar` || t === `gabion` || t === `gingham` || t === `mossypavers` || t === `bamboocrosscut` || t === `moire` || t === `oakleaf` || t === `rhombille` || t === `fossillimestone` || t === `seigaihatiles` || t === `tuftedleather` || t === `louveredmetal` || t === `herringbonebrick` || t === `shibori` || t === `scallopedslate` || t === `saltpan` || t === `dogbonepavers` || t === `palmendgrain` || t === `asanoha` || t === `lotusseedpod` || t === `crowncaps` || t === `cofferedconcrete` || t === `woodworm` || t === `calcadawaves` || t === `ikat` || t === `slottedwood` || t === `hollyleaf` || t === `englishbond` || t === `rebar` || t === `starfruit` || t === `diamondrustication` || t === `bargello` || t === `saffiano` || t === `cocoamat` || t === `suminagashi` || t === `vermiculite` || t === `cairotiles` || t === `guilloche` || t === `seaurchintest` || t === `crystallineglaze` || t === `shirring` || t === `sunburstveneer` || t === `rakedgravel` || t === `flintwall` || t === `frenchknots` || t === `artichoke` || t === `splitlockwashers` || t === `flemishbond` || t === `satinweave` || t === `lotusroot` || t === `cardboardedge` || t === `hexnuts` || t === `orbicularjasper` || t === `acornbarnacles` || t === `circularpavers` || t === `snowflaketiles` || t === `sawblades` || t === `pistachios` || t === `polkadotfabric` || t === `cucumberslices` || t === `monsteraleaf` || t === `crossstitch` || t === `staranise` || t === `logcabinparquet` || t === `countersunkmetal` || t === `trilobitefossil` || t === `eyeletcotton` || t === `dendriticagate` || t === `ravioli` || t === `rollerchain` || t === `mapleleaf` || t === `smocking` || t === `quatrefoiltile` || t === `okraslice` || t === `eggcarton` || t === `greekkey` || t === `seedbeads` || t === `chainstitch` || t === `wingnuts` || t === `pomegranateslice` || t === `pawprinttiles` || t === `dovetailjoint` || t === `starsocketbolts` || t === `sanddollar` || t === `brogueleather` || t === `clovebuds` || t === `starcrosstiles` || t === `maplesamara` || t === `lenoweave` || t === `circlips` || t === `eclips` || t === `tuliptiles` || t === `gingerslice` || t === `fivebarplate` || t === `cinnamonswirl` || t === `wheatears` || t === `scalemail` || t === `trihexagonaltiles` || t === `burlwood` || t === `slottedmetal` || t === `peppercorns` || t === `castellatednuts` || t === `farfalle` || t === `cardamompods` || t === `brickarches` || t === `knottednet` || t === `fiddleheads` || t === `cowrieshells` || t === `cotterpins` || t === `seedstitch` || t === `garterstitch` || t === `mangosteenslice` || t === `pickettiles` || t === `squarewashers` || t === `eucalyptusleaf` || t === `twillweave` || t === `pinstripewool` || t === `chrysanthemumstone` || t === `snowflakeobsidian` || t === `sewingsnaps` || t === `lathplaster` || t === `ceramiccapacitors` || t === `fennelseeds` || t === `ballbearingfaces` || t === `baseballleather` || t === `toothbrushheads` || t === `bowtieinlay` || t === `redcabbagecut` || t === `slottedturners` || t === `triglidesliders` || t === `popcorn` || t === `dualinlinechips` || t === `tortoiseshellacetate` || t === `cathedralquilt` || t === `matelasse` || t === `silknoil` || t === `buckwheathulls` || t === `rutilatedquartz` || t === `peppermintcanes` || t === `rubbergrommets` || t === `chioggiabeetcuts` || t === `flatflexcables` || t === `celerycuts` || t === `tactileswitches` || t === `paisleybrocade` || t === `siliconepastrybrushes` || t === `graphicgranite` || t === `brasspadlocks` || t === `carrotcuts` || t === `bluepushpins` || t === `oatflakes` || t === `grosgrainribbons` || t === `azuritemalachite` || t === `openendspanners` || t === `lentilseeds` || t === `blueprintpaper` || t === `horsechestnutleaf` || t === `binderclips` || t === `charoite` || t === `chenilleyarn` || t === `ceramicfuses` || t === `hazelnutshells` || t === `yagasuricloth` || t === `balloonwhisks` || t === `orthocerasstone` || t === `rickracktrim` || t === `toroidalinductors` || t === `pennerigate` || t === `lepidolitemica` || t === `brassjinglebells` || t === `nutmeghalves` || t === `coaxialcablecuts` || t === `shippocloth` || t === `driedtamarindpods` || t === `conicalsampletubes` || t === `botryoidalcopper` || t === `pencilshavings` || t === `papayacuts` || t === `sewingthimbles` || t === `boullebrassinlay` || t === `diamondpanelparquet` || t === `dendriticfrost` || t === `bullionknots` || t === `orecchiette` || t === `solderlessbreadboard` || t === `kyaniteblades` || t === `wulfenite` || t === `celestine` || t === `barite` || t === `woodruffkeys` || t === `parallelkeys` || t === `internaltoothwashers` || t === `driedchillies` || t === `utilityknifeblades` || t === `windmillparquet` || t === `bismuthhoppers` || t === `splitvanillapods` || t === `seamrippers` || t === `flakedarrowheads` || t === `dandelionseeds` || t === `shojipaperlattice` || t === `nyloncableties` || t === `weavingshuttles` || t === `tailorstapes` || t === `woodenclothespins` || t === `cinnamonbarkcoils` || t === `compactcassettefaces` || t === `kintsugiceramic` || t === `pleatedfilterpapers` || t === `splitcedarshakes` || t === `swavepavers` || t === `mushroomslices` || t === `insulatedringlugs` || t === `bananaslices` || t === `rosemarysprigs` || t === `pencilsharpeners` || t === `scissors` || t === `serpentinesprings` || t === `impellerfaces` || t === `chipresistors` || t === `memorycardbacks` || t === `gnocchi` || t === `rectangularsocketfaces` || t === `saffronthreads` || t === `fishhooks` || t === `violinfholes` || t === `palmiers` || t === `barbedwire` || t === `oxfordweave` || t === `lacewood` || t === `papyrus` || t === `larimar` || t === `paperbark` || t === `horseshoes` || t === `durianpeel` || t === `flystitch` || t === `abaloneshells` || t === `gyroidinfill` || t === `cloisonne` || t === `rambutanskin` || t === `rackgears` || t === `faille` || t === `poplin` || t === `gabardine` || t === `oilspotglaze` || t === `persimmonslice` || t === `kitkattiles` || t === `brakediscs` || t === `mulberrypaper` || t === `howlite` || t === `sodalite` || t === `ottoman` || t === `shackles` || t === `watercaltrops` || t === `fluorite` || t === `pyromorphite` || t === `redberyl` || t === `cavansite` || t === `wenge` || t === `parchment` || t === `cavalrytwill` || t === `screwhooks` || t === `nigellaseeds` || t === `phyllite` || t === `shantung` || t === `hempcrete` || t === `utilityblades` || t === `chrysocolla` || t === `hemimorphite` || t === `smithsonite` || t === `sichuanpepperhusks` || t === `huckaback` || t === `anorthosite` || t === `cubebberries` || t === `seraphinite` || t === `hexsocketheads` || t === `squaresocketheads` || t === `twopinscrewheads` || t === `amazonite` || t === `mungbeans` || t === `blackeyedpeas` || t === `adzukibeans` || t === `anigre` || t === `makore` || t === `larvikite` || t === `squareholewashers` || t === `tigerwood` || t === `blackpalm` || t === `snakewood` || t === `safflowerseeds` || t === `thulite` || t === `unakite` || t === `eudialyte` || t === `lignumvitae` || t === `iroko` || t === `purpleheart` || t === `yellowheart` || t === `bloodwood` || t === `thomsonite` || t === `dalmatianstone` || t === `basswood` || t === `nickelsilver` || t === `hopsack` || t === `monkscloth` || t === `lyocell` || t === `sateen` || t === `surah` || t === `serge` || t === `batiste` || t === `ramie` || t === `sphericalwashers` || t === `wavewashers` || t === `cupwashers` || t === `pietersite` || t === `bronzite` || t === `castorbeans` || t === `kingwood` || t === `braziliantulipwood` || t === `macassarebony` || t === `zebrawood` || t === `bocote` || t === `datepits` || t === `sapele` || t === `chambray` || t === `ticking` || t === `cottondrill` || t === `nephrite` || t === `diorite` || t === `carawayseeds` || t === `springpinends` || t === `rhyolite` || t === `tonkabeans` || t === `pentalobescrewheads` || t === `tripointscrewheads` || t === `padauk` || t === `cottonflannel` || t === `pinolith` || t === `septarian` || t === `ooliticlimestone` || t === `ogeetiles` || t === `bittermelonskin` || t === `cocobolo` || t === `doubleedgerazorblades` || t === `chiastolite` || t === `dimity` || t === `juniperberries` || t === `gabbro` || t === `turnbuckles` || t === `rhodochrosite` || t === `bluelaceagate` || t === `bayleaf` || t === `pumpkinseeds` || t === `spurgears` || t === `diamondcheckertiles` || t === `appleslice` || t === `paperclips` || t === `rclips` || t === `linchpins` || t === `ivyleaf` || t === `ribknit` || t === `pillowtiles` || t === `coffeerings` || t === `cashews` || t === `hinges` || t === `coins` || t === `righttriangletiles` || t === `cherryblossom` || t === `punchcard` || t === `braidedcord` || t === `crossbeddedsandstone` || t === `grommetcanvas` || t === `fishscaletiles` || t === `hexkeys` || t === `driedfigslice` || t === `creamcrackers` || t === `doorkeys` || t === `dodecagontiles` || t === `ballchain` || t === `succulentrosettes` || t === `foldingfans` || t === `togglebuttons` || t === `greenpeapods` || t === `beltbuckles` || t === `hextruchettiles` || t === `scoredmango` || t === `waxseals` || t === `cottonbolls` || t === `carabiners` || t === `pencilends` || t === `corrugatedplasticedge` || t === `haircombs` || t === `blackberries` || t === `musselshells` || t === `safetypins` || t === `poppyseedpods` || t === `leatherbookspines` || t === `matchsticks` || t === `porcelaininsulators` || t === `dominoes` || t === `woodenspoons` || t === `chessrooks` || t === `threadspools` || t === `bellpepperslices` || t === `sharkteeth` || t === `grinderburrs` || t === `spaltedwood` || t === `canlids` || t === `crinoidossicles` || t === `pythagoreantiles` || t === `dinnerforks` || t === `mudtiretracks` || t === `tangramtiles` || t === `batterypositivecaps` || t === `passionfruitslice` || t === `screwterminalblocks` || t === `dragonfruitflesh` || t === `speakercones` || t === `septarianstone` || t === `axialresistors` || t === `tomatoslices` || lt || ft || _t || xt || Et || jt || Ft || zt || ue || Gt || Yt || ie || z || A || T || l || d || p), cn = r ^ 2747636419, ln = r ^ 2135587861;
	return (e, t, n) => {
		W = fract(e), G = fract(t), rn = tn ? noise(W, G, 4, 4, r) : 0, K = sn ? noise(W, G, 32, 32, cn) : 0, q = nn ? noise(W, G, 64, 64, ln) : 0, J = rn, Y = rn, X = i.roughness, Z = 1, Q = 0, $ = an, on(), n.color = J, n.height = Y * i.relief, n.roughness = clamp(X), n.occlusion = Z, n.mortar = Q, n.metallic = $;
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
			let t = c.dark[e] + (c.light[e] - c.dark[e]) * l.color, n = i.tint === void 0 ? t : t * i.tint[e];
			a.baseColor[f + e] = Math.round(n * (1 - l.mortar) + (e === 2 ? 139 : 153) * l.mortar), a.occlusion[f + e] = byte(l.occlusion);
		}
		a.baseColor[f + 3] = a.occlusion[f + 3] = 255, a.metallicRoughness[f] = 255, a.metallicRoughness[f + 1] = byte(l.roughness + u), a.metallicRoughness[f + 2] = byte(l.metallic), a.metallicRoughness[f + 3] = 255;
	}
	if (writeNormals(o, n, a.normal), i.heightMap) {
		let e = new Uint8ClampedArray(n * n * 4), t = 1 / 0, r = -1 / 0;
		for (let e of o) t = Math.min(t, e), r = Math.max(r, e);
		let i = r - t;
		for (let n = 0; n < o.length; n++) {
			let r = byte(i > 0 ? (o[n] - t) / i : .5), a = n * 4;
			e[a] = e[a + 1] = e[a + 2] = r, e[a + 3] = 255;
		}
		a.height = e;
	}
	return a;
}
//#endregion
exports.createSurfaceSampler = createSurfaceSampler;
exports.generateProceduralMaps = generateProceduralMaps;
exports.writeNormals = writeNormals;

//# sourceMappingURL=procedural-material-maps.cjs.map