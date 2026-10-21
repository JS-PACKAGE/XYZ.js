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
	let i = require_materials.proceduralMaterialPresets[t], a = hash(0, 0, r) * n, o = t === `encaustictiles` ? .12 * Math.sin(a) : 0, s = Math.cos(o), c = Math.sin(o), l = t === `endgrain` ? hash(0, 0, r ^ 15127) : 0, u = t === `endgrain` ? hash(0, 0, r ^ 23849) : 0, d = t === `closedcellfoam` ? /* @__PURE__ */ new Float64Array(3136) : null;
	if (d) for (let e = 0; e < 28; e++) for (let t = 0; t < 28; t++) {
		let n = (e * 28 + t) * 4, i = hash(t, e, r ^ 28455), a = .55 + .16 * i;
		d[n] = .3 + .4 * hash(t, e, r), d[n + 1] = .3 + .4 * hash(t, e, r ^ 10661), d[n + 2] = 1 / (a * a), d[n + 3] = i;
	}
	let f = t === `snakeskin` ? 10 : 4, p = t === `snakeskin` ? 12 : 6, m = t === `snakeskin` || t === `crocodile` ? new Float64Array(f * p) : null;
	if (m) for (let e = 0; e < p; e++) for (let t = 0; t < f; t++) m[e * f + t] = hash(t, e, r ^ 29625);
	let h = t === `engineturned` ? /* @__PURE__ */ new Float64Array(72) : null;
	if (h) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 2;
		h[n] = hash(t, e, r ^ 14497), h[n + 1] = hash(t, e, r ^ 27735);
	}
	let g = t === `orangepeel` ? 24 : 40, _ = t === `orangepeel` ? 24 : 8, v = t === `orangepeel` || t === `coconut` ? new Float64Array(g * _ * 3) : null;
	if (v) for (let e = 0; e < _; e++) for (let t = 0; t < g; t++) {
		let n = (e * g + t) * 3;
		v[n] = .25 + .5 * hash(t, e, r ^ 7795), v[n + 1] = .25 + .5 * hash(t, e, r ^ 21425), v[n + 2] = hash(t, e, r ^ 31529);
	}
	let y = t === `limestone` ? /* @__PURE__ */ new Float64Array(4032) : null;
	if (y) for (let e = 0; e < 24; e++) for (let t = 0; t < 24; t++) {
		let i = (e * 24 + t) * 7, a = n * hash(t, e, r ^ 11377);
		y[i] = .15 + .7 * hash(t, e, r ^ 6323), y[i + 1] = .15 + .7 * hash(t, e, r ^ 20009), y[i + 2] = .25 + .19 * hash(t, e, r ^ 31377), y[i + 3] = .65 + .35 * hash(t, e, r ^ 14733), y[i + 4] = Math.cos(a), y[i + 5] = Math.sin(a), y[i + 6] = hash(t, e, r ^ 25591);
	}
	let b = t === `breccia` ? /* @__PURE__ */ new Float64Array(648) : null;
	if (b) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let i = (e * 6 + t) * 18, a = n * hash(t, e, r ^ 11091), o = .3 + .35 * hash(t, e, r ^ 23063);
		b[i] = .15 + .7 * hash(t, e, r ^ 6089), b[i + 1] = .15 + .7 * hash(t, e, r ^ 14545), b[i + 2] = hash(t, e, r ^ 32323);
		for (let s = 0; s < 5; s++) {
			let c = a + n * s / 5 + .2 * (hash(t, e, r ^ 16823 + s) - .5), l = i + 3 + s * 3;
			b[l] = Math.cos(c), b[l + 1] = Math.sin(c), b[l + 2] = o * (.75 + .25 * hash(t, e, r ^ 26785 + s));
		}
	}
	let x = t === `plywood` ? /* @__PURE__ */ new Float64Array(6) : null;
	if (x) for (let e = 0; e < 2; e++) x[e * 3] = hash(e, 0, r ^ 8679), x[e * 3 + 1] = hash(e, 0, r ^ 25779), x[e * 3 + 2] = .75 + .25 * hash(e, 0, r ^ 18649);
	let S = t === `reedmat` ? 16 : 6, C = t === `reedmat` || t === `rope` ? new Float64Array(S * 2) : null;
	if (C) for (let e = 0; e < S; e++) C[e * 2] = hash(e, 0, r ^ 5849), C[e * 2 + 1] = n * hash(e, 0, r ^ 18867);
	let w = t === `straw` ? /* @__PURE__ */ new Float64Array(1728) : null;
	if (w) for (let e = 0; e < 3; e++) for (let t = 0; t < 8; t++) for (let i = 0; i < 8; i++) {
		let a = ((e * 8 + t) * 8 + i) * 9, o = r ^ e * 14759, s = n * hash(i, t, o ^ 6355);
		w[a] = .25 + .5 * hash(i, t, o ^ 20247), w[a + 1] = .25 + .5 * hash(i, t, o ^ 29641), w[a + 2] = Math.cos(s), w[a + 3] = Math.sin(s), w[a + 4] = .62 + .33 * hash(i, t, o ^ 25265), w[a + 5] = .035 + .03 * hash(i, t, o ^ 20891), w[a + 6] = hash(i, t, o ^ 11877), w[a + 7] = n * hash(i, t, o ^ 29123), w[a + 8] = hash(i, t, o ^ 14305);
	}
	let T = t === `osb` ? 6 : 28, E = t === `osb` || t === `chipboard` ? new Float64Array(T * T * 2 * 26) : null;
	if (E) for (let e = 0; e < 2; e++) for (let i = 0; i < T; i++) for (let a = 0; a < T; a++) {
		let o = ((e * T + i) * T + a) * 26, s = r ^ e * 14759, c = hash(a, i, s ^ 25265), l = t === `osb` ? Math.PI / 2 + .65 * (hash(a, i, s ^ 6355) - .5) + .5 * (noise(a / 6, i / 6, 3, 3, r ^ 31529) - .5) : n * hash(a, i, s ^ 6355);
		E[o] = .25 + .5 * hash(a, i, s ^ 20247), E[o + 1] = .25 + .5 * hash(a, i, s ^ 29641), E[o + 2] = Math.cos(l), E[o + 3] = Math.sin(l), E[o + 4] = t === `osb` ? .78 + .14 * c : .46 + .19 * c, E[o + 5] = t === `osb` ? .13 + .1 * hash(a, i, s ^ 20891) : .25 + .17 * hash(a, i, s ^ 20891), E[o + 6] = c, E[o + 7] = n * hash(a, i, s ^ 11877);
		for (let e = 0; e < 6; e++) {
			let t = o + 8 + e * 3;
			E[t] = Math.cos(n * e / 6), E[t + 1] = Math.sin(n * e / 6), E[t + 2] = .82 + .18 * hash(a, i, s ^ 23857 + e);
		}
	}
	let D = t === `crackleglaze` ? /* @__PURE__ */ new Float64Array(6656) : null;
	if (D) for (let e = 0; e < 16; e++) for (let t = 0; t < 16; t++) {
		let n = (e * 16 + t) * 26, i = .36 + .28 * hash(t, e, r ^ 17293), a = .36 + .28 * hash(t, e, r ^ 31525);
		D[n] = i, D[n + 1] = a;
		let o = n + 2;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 16) % 16, l = (e + n + 16) % 16, u = s + .36 + .28 * hash(c, l, r ^ 17293) - i, d = n + .36 + .28 * hash(c, l, r ^ 31525) - a, f = Math.sqrt(u * u + d * d);
			D[o++] = u / f, D[o++] = d / f, D[o++] = f / 2;
		}
	}
	let O = t === `fishscales` ? 10 : 8, k = t === `fishscales` ? 10 : 4, A = t === `fishscales` || t === `feathers` ? new Float64Array(O * k * 2) : null;
	if (A) for (let e = 0; e < k; e++) for (let t = 0; t < O; t++) {
		let n = (e * O + t) * 2;
		A[n] = hash(t, e, r ^ 15985), A[n + 1] = .2 * (hash(t, e, r ^ 25299) - .5);
	}
	let j = t === `tortoiseshell` ? /* @__PURE__ */ new Float64Array(972) : null;
	if (j) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 27, i = .22 + .56 * hash(t, e, r ^ 13751), a = .22 + .56 * hash(t, e, r ^ 28185);
		j[n] = i, j[n + 1] = a, j[n + 2] = hash(t, e, r ^ 31811);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 6) % 6, l = (e + n + 6) % 6, u = s + .22 + .56 * hash(c, l, r ^ 13751) - i, d = n + .22 + .56 * hash(c, l, r ^ 28185) - a, f = Math.sqrt(u * u + d * d);
			j[o++] = u / f, j[o++] = d / f, j[o++] = f / 2;
		}
	}
	let ee = t === `studdedrubber` ? /* @__PURE__ */ new Float64Array(36) : null;
	if (ee) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) ee[e * 6 + t] = hash(t, e, r ^ 19225);
	let te = t === `groovedrubber` ? /* @__PURE__ */ new Float64Array(12) : null;
	if (te) for (let e = 0; e < 12; e++) te[e] = hash(e, 0, r ^ 23607);
	let M = t === `recycledrubber` ? /* @__PURE__ */ new Float64Array(41472) : null;
	if (M) for (let e = 0; e < 48; e++) for (let t = 0; t < 48; t++) {
		let i = (e * 48 + t) * 18, a = n * hash(t, e, r ^ 32019), o = .48 + .17 * hash(t, e, r ^ 6583);
		M[i] = .2 + .6 * hash(t, e, r ^ 12969), M[i + 1] = .2 + .6 * hash(t, e, r ^ 25059), M[i + 2] = hash(t, e, r ^ 21441);
		for (let s = 0; s < 5; s++) {
			let c = i + 3 + s * 3, l = a + n * s / 5;
			M[c] = Math.cos(l), M[c + 1] = Math.sin(l), M[c + 2] = o * (.78 + .22 * hash(t, e, r ^ 9969 + s));
		}
	}
	let N = t === `breadcrust` ? /* @__PURE__ */ new Float64Array(1323) : null;
	if (N) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = (e * 7 + t) * 27, i = .36 + .28 * hash(t, e, r ^ 9399), a = .36 + .28 * hash(t, e, r ^ 22993);
		N[n] = i, N[n + 1] = a, N[n + 2] = hash(t, e, r ^ 29609);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 7) % 7, l = (e + n + 7) % 7, u = s + .36 + .28 * hash(c, l, r ^ 9399) - i, d = n + .36 + .28 * hash(c, l, r ^ 22993) - a, f = Math.sqrt(u * u + d * d);
			N[o++] = u / f, N[o++] = d / f, N[o++] = f / 2;
		}
	}
	let P = t === `basketball` ? 36 : 24, ne = t === `basketball` ? 3 : 4, F = t === `basketball` || t === `tennisball` ? new Float64Array(P * P * ne) : null;
	if (F) for (let e = 0; e < P; e++) for (let i = 0; i < P; i++) {
		let a = (e * P + i) * ne;
		if (F[a] = .35 + .3 * hash(i, e, r ^ 6567), F[a + 1] = .35 + .3 * hash(i, e, r ^ 23587), t === `basketball`) {
			let t = .34 + .04 * hash(i, e, r ^ 29657);
			F[a + 2] = 1 / (t * t);
		} else {
			let t = n * hash(i, e, r ^ 14257);
			F[a + 2] = Math.cos(t), F[a + 3] = Math.sin(t);
		}
	}
	let re = t === `golfball` ? hash(0, 0, r ^ 10679) : 0, ie = t === `golfball` ? hash(0, 0, r ^ 25043) : 0, ae = t === `boardformedconcrete` || t === `ribbedconcrete` || t === `splitfaceblock`, oe = ae ? cachedNoise(96, 96, r ^ 11633) : null, se = t === `ribbedconcrete` || t === `splitfaceblock` ? cachedNoise(24, 32, r ^ 27449) : null, ce = t === `boardformedconcrete` ? cachedNoise(3, 128, r ^ 23059) : null, I = ae ? new Float64Array(t === `boardformedconcrete` ? 16 : t === `ribbedconcrete` ? 12 : 32) : null;
	if (I) for (let e = 0; e < I.length; e++) I[e] = hash(e, 0, r ^ 18409);
	let le = t === `chainmail` || t === `rivetedmetal` || t === `weldedmetal`, ue = le ? cachedNoise(48, 64, r ^ 27943) : null, L = t === `chainmail` ? /* @__PURE__ */ new Float64Array(48) : t === `rivetedmetal` ? /* @__PURE__ */ new Float64Array(12) : null;
	if (L) for (let e = 0; e < L.length; e++) L[e] = hash(e, 0, r ^ 14773);
	let de = t === `cactus` || t === `pinecone` || t === `corncob`, fe = de ? cachedNoise(48, 64, r ^ 24121) : null, R = t === `corncob` ? 12 : 8, z = t === `cactus` ? 18 : 1, B = de ? new Float64Array(R * 8 * z) : null;
	if (B) for (let e = 0; e < 8; e++) for (let i = 0; i < R; i++) {
		let a = (e * R + i) * z;
		if (B[a] = hash(i, e, r ^ 19059), t === `cactus`) {
			B[a] = .28 + .08 * B[a], B[a + 1] = .12 * (hash(i, e, r ^ 11609) - .5);
			let t = hash(i, e, r ^ 32561) * n;
			for (let e = 0; e < 8; e++) {
				let r = t + e * n / 8;
				B[a + 2 + e * 2] = Math.cos(r), B[a + 3 + e * 2] = Math.sin(r);
			}
		}
	}
	let pe = t === `corrugatedcardboard` || t === `creasedpaper` || t === `layeredpaper`, me = pe ? cachedNoise(6, 8, r ^ 12729) : null, V = pe ? /* @__PURE__ */ new Float64Array(60) : null;
	if (V) for (let e = 0; e < 4; e++) for (let t = 0; t < 3; t++) {
		let i = (e * 3 + t) * 5, a = n * hash(t, e, r ^ 28179);
		V[i] = .3 + .4 * hash(t, e, r ^ 11121), V[i + 1] = .3 + .4 * hash(t, e, r ^ 23609), V[i + 2] = Math.cos(a), V[i + 3] = Math.sin(a), V[i + 4] = .32 + .12 * hash(t, e, r ^ 31313);
	}
	let H = t === `layeredpaper` ? /* @__PURE__ */ new Float64Array(24) : null;
	if (H) for (let e = 0; e < 8; e++) H[e * 3] = .35 + e * .045, H[e * 3 + 1] = .58 + .14 * hash(e, 0, r ^ 20263), H[e * 3 + 2] = n * hash(e, 0, r ^ 10525);
	let he = t === `basalt` || t === `scoria` || t === `obsidian`, ge = he ? cachedNoise(64, 64, r ^ 23319) : null, U = t === `basalt` ? 6 : t === `scoria` ? 10 : 4, W = t === `basalt` ? 8 : U, G = t === `basalt` ? 4 : 7, K = he ? new Float64Array(U * W * G) : null;
	if (K) for (let e = 0; e < W; e++) for (let i = 0; i < U; i++) {
		let a = (e * U + i) * G, o = hash(i, e, r ^ 15729);
		if (t === `basalt`) K[a] = .46 + .025 * o, K[a + 1] = .46 + .025 * hash(i, e, r ^ 27177), K[a + 2] = .46 + .025 * hash(i, e, r ^ 31811), K[a + 3] = o;
		else {
			let s = n * hash(i, e, r ^ 27177), c = t === `scoria` ? .32 + .12 * o : .65 + .13 * o;
			K[a] = .35 + .3 * hash(i, e, r ^ 12121), K[a + 1] = .35 + .3 * hash(i, e, r ^ 31811), K[a + 2] = c, K[a + 3] = c * (.7 + .25 * hash(i, e, r ^ 19987)), K[a + 4] = Math.cos(s), K[a + 5] = Math.sin(s), K[a + 6] = o;
		}
	}
	let _e = t === `malachite` || t === `agate` || t === `lapislazuli`, ve = _e ? cachedNoise(64, 64, r ^ 31155) : null, ye = t === `lapislazuli` ? cachedNoise(8, 8, r ^ 19753) : null, be = _e ? n * hash(0, 0, r ^ 13735) : 0, xe = _e ? n * hash(0, 0, r ^ 27673) : 0, Se = t === `rice` || t === `sesame` || t === `coffeebeans`, q = t === `rice` ? 12 : t === `sesame` ? 16 : 8, J = Se ? new Float64Array(q * q * 7) : null, Ce = t === `coffeebeans` ? cachedNoise(64, 64, r ^ 18105) : null;
	if (J) for (let e = 0; e < q; e++) for (let i = 0; i < q; i++) {
		let a = (e * q + i) * 7, o = n * hash(i, e, r ^ 24377), s = hash(i, e, r ^ 14273);
		J[a] = .35 + .3 * hash(i, e, r ^ 6311), J[a + 1] = .35 + .3 * hash(i, e, r ^ 27939), J[a + 2] = Math.cos(o), J[a + 3] = Math.sin(o), J[a + 4] = 1 / (t === `rice` ? .62 + .09 * s : t === `sesame` ? .48 + .06 * s : .57 + .06 * s), J[a + 5] = 1 / (t === `rice` ? .14 + .025 * s : t === `sesame` ? .24 + .025 * s : .36 + .03 * s), J[a + 6] = s;
	}
	let we = t === `lotusleaf` || t === `bananaleaf` || t === `fernleaf`, Te = t === `lotusleaf` ? 31 : 7, Y = we ? new Float64Array(9 * Te) : null;
	if (Y) for (let e = 0; e < 3; e++) for (let i = 0; i < 3; i++) {
		let a = (e * 3 + i) * Te, o = n * hash(i, e, r ^ 23191), s = hash(i, e, r ^ 14033);
		if (Y[a] = .45 + .1 * hash(i, e, r ^ 8631), Y[a + 1] = .45 + .1 * hash(i, e, r ^ 29155), Y[a + 2] = Math.cos(o), Y[a + 3] = Math.sin(o), Y[a + 4] = 1 / (t === `lotusleaf` ? .65 + .04 * s : t === `bananaleaf` ? .76 + .04 * s : .78 + .03 * s), Y[a + 5] = 1 / (t === `lotusleaf` ? .61 + .04 * s : t === `bananaleaf` ? .28 + .02 * s : .5), Y[a + 6] = s, t === `lotusleaf`) for (let e = 0; e < 12; e++) {
			let t = e * n / 12 + .15 * s;
			Y[a + 7 + e * 2] = Math.cos(t), Y[a + 8 + e * 2] = Math.sin(t);
		}
	}
	let X = t === `fernleaf` ? /* @__PURE__ */ new Float64Array(42) : null;
	if (X) for (let e = 0; e < 14; e++) {
		let t = -.7 + e * .105;
		X[e * 3] = t, X[e * 3 + 1] = e % 2 == 0 ? 1 : -1, X[e * 3 + 2] = 1 / (.68 - .36 * t * t);
	}
	let Ee = t === `stone` || t === `metal` || t === `marble`, De = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud` || t === `granite` || t === `slate` || t === `terrazzo` || t === `plaster` || t === `terracotta` || t === `cork` || t === `rubber` || t === `sandstone` || t === `travertine` || t === `pumice`;
	return (e, o, f) => {
		e = fract(e), o = fract(o);
		let p = Ee ? noise(e, o, 4, 4, r) : 0, S = ae || le || de || pe || he || _e || Se || we ? 0 : noise(e, o, 32, 32, r ^ 2747636419), R = De ? noise(e, o, 64, 64, r ^ 2135587861) : 0, z = p, G = p, Z = i.roughness, Q = 1, $ = 0, Oe = +(t === `metal` || t === `diamondplate` || t === `hammeredmetal` || t === `galvanized` || t === `corrugatedmetal` || t === `perforatedmetal` || t === `expandedmetal` || t === `wiremesh` || t === `pyrite` || t === `knurledmetal` || t === `engineturned` || t === `goldleaf` || t === `rivetedmetal` || t === `weldedmetal`);
		switch (t) {
			case `lotusleaf`:
			case `bananaleaf`:
			case `fernleaf`: {
				let r = e * 3, a = o * 3, s = Math.floor(r), c = Math.floor(a);
				z = .12, G = .08, Q = .68;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = s + o, u = c + e, d = ((u + 3) % 3 * 3 + (l + 3) % 3) * Te, f = r - l - Y[d], p = a - u - Y[d + 1], m = Y[d + 2], h = Y[d + 3], g = (f * m + p * h) * Y[d + 4], _ = (p * m - f * h) * Y[d + 5], v = Y[d + 6], y, b = 0, x;
					if (t === `fernleaf`) {
						if (g * g + _ * _ > 1.5) continue;
						y = smooth(clamp((1 - g * g / .81 - _ * _ / .0016) / .35)), b = y;
						for (let e = 0; e < 14; e++) {
							let t = X[e * 3 + 1], n = _ * t * X[e * 3 + 2], r = (g - X[e * 3] - .3 * _ * t) / .043, i = (2 * n - 1) * (2 * n - 1) + r * r;
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
								let t = Y[d + 7 + e * 2], n = Y[d + 8 + e * 2], r = g * t + _ * n, i = _ * t - g * n, a = smooth(clamp((r - .03) / .1)) * Math.exp(-900 * i * i);
								b += (1 - b) * a;
							}
							let t = Math.exp(-110 * e);
							b += (1 - b) * t;
						} else {
							let e = Math.exp(-180 * _ * _), t = Math.cos(n * (9 * g - 2.4 * Math.sqrt(_ * _ + 4e-4))), r = _ * _ / (_ * _ + .006) * (.5 + .5 * t) ** 8;
							b = e + (1 - e) * .7 * r;
						}
					}
					z += y * (.5 + .18 * v + .12 * b - z), G += y * (.26 + .13 * x + .14 * b - G), Z += y * (i.roughness + .035 * (1 - b) - Z), Q += y * (.9 + .08 * x - Q);
				}
				break;
			}
			case `rice`:
			case `sesame`:
			case `coffeebeans`: {
				let r = e * q, a = o * q, s = Math.floor(r), c = Math.floor(a), l = Ce ? Ce(e, o) : 0;
				z = t === `rice` ? .26 : t === `sesame` ? .19 : .12, G = .08, Q = .57;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let u = s + o, d = c + e, f = (u + q) % q, p = ((d + q) % q * q + f) * 7, m = r - u - J[p], h = a - d - J[p + 1], g = J[p + 2], _ = J[p + 3], v = (m * g + h * _) * J[p + 4], y = (h * g - m * _) * J[p + 5], b = J[p + 6], x;
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
						let e = y - .16 * Math.sin(2.8 * v + b - .5), t = Math.exp(-e * e / .012) * C, n = .55 * l + .45 * b;
						w = .4 + .3 * n + .1 * C - .26 * t, T = .28 + .4 * C - .3 * t + .018 * l * C, E = i.roughness + .11 * n + .1 * t, D = .89 + .08 * C - .32 * t;
					}
					z += S * (w - z), G += S * (T - G), Z += S * (E - Z), Q += S * (D - Q);
				}
				break;
			}
			case `malachite`:
			case `agate`: {
				let r = n * (t === `malachite` ? 3 : 1) * e + be, i = n * 3 * o + xe, a = r + .28 * Math.sin(i), s = i + .18 * Math.sin(r), c = 1 - .5 * (Math.cos(a) + Math.cos(s)) + (t === `agate` ? .22 * (1 - Math.cos(2 * a - s)) : 0), l = .5 + .5 * Math.cos(n * (3 * c + .1 * Math.sin(a) * Math.sin(s))), u = ve(e, o);
				z = .12 + .8 * l + .035 * u, G = .48 + .07 * l + .002 * u, Z += .045 * (1 - l) + .012 * u, Q = .985 + .015 * l;
				break;
			}
			case `lapislazuli`: {
				let t = Math.sin(n * (e + o) + be) + .22 * Math.sin(n * 3 * o + xe), r = Math.sin(n * (2 * e - o) + xe) + .18 * Math.sin(n * 2 * o + be), i = smooth(clamp(1 - (t / .1) ** 2)), a = smooth(clamp(1 - (r / .065) ** 2)), s = smooth(clamp((ye(e, o) - .64) / .22)), c = 1 - (1 - i) * (1 - a) * (1 - .8 * s), l = ve(e, o);
				z = .1 + .12 * l + .76 * c, G = .5 + .009 * l + .045 * c, Z += .04 * l + .13 * c, Q = .988 + .012 * c;
				break;
			}
			case `basalt`: {
				let t = e * 6, n = o * 8, r = Math.floor(n), i = ge(e, o);
				z = .08 + .035 * i, G = .1 + .008 * i, Q = .59;
				for (let e = -1; e <= 1; e++) {
					let a = r + e, o = (a + 8) % 8, s = o % 2 * .5, c = Math.floor(t - s);
					for (let e = -1; e <= 1; e++) {
						let r = c + e, l = (r + 6) % 6, u = (o * 6 + l) * 4, d = t - r - s - .5, f = n - a - .5, p = K[u], m = K[u + 1], h = K[u + 2], g = K[u + 3], _ = smooth(clamp((p - d) / .065)) * smooth(clamp((p + d) / .065)) * smooth(clamp((m - .5 * d - .75 * f) / .065)) * smooth(clamp((m + .5 * d + .75 * f) / .065)) * smooth(clamp((h + .5 * d - .75 * f) / .065)) * smooth(clamp((h - .5 * d + .75 * f) / .065)), v = 1 - .6 * d * d - .6 * f * f;
						z += _ * (.28 + .18 * g + .06 * i), G += _ * (.52 + .08 * g + .07 * v), Q += .4 * _;
					}
				}
				Z += .08 * (1 - Q) + .025 * (i - .5);
				break;
			}
			case `scoria`:
			case `obsidian`: {
				let n = U, r = e * n, i = o * W, a = Math.floor(r), s = Math.floor(i), c = ge(e, o), l = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let c = a + o, f = s + e, p = (c + n) % n, m = ((f + W) % W * n + p) * 7, h = r - c - K[m], g = i - f - K[m + 1], _ = K[m + 4], v = K[m + 5], y = (_ * h + v * g) / K[m + 2], b = (-v * h + _ * g) / K[m + 3], x = y * y + b * b;
					if (x >= 1) continue;
					let S, C;
					if (t === `scoria`) S = smooth(clamp((.7 - x) / .7)), C = smooth(clamp((x - .42) / .18)) * smooth(clamp((1 - x) / .2));
					else {
						S = smooth(1 - x);
						let e = (y + .36 - 1.2 * b * b) / .08;
						C = smooth(clamp(1 - e * e)) * smooth(clamp((1 - x) / .25));
					}
					l += (1 - l) * S, u += (1 - u) * C, d += (1 - d) * S * K[m + 6];
				}
				t === `scoria` ? (z = .36 + .09 * c - .23 * l + .16 * u + .04 * d, G = .48 + .012 * c - .32 * l + .15 * u, Z += .045 * l - .035 * u + .015 * (c - .5), Q = .98 - .36 * l + .015 * u) : (z = .15 + .035 * c + .14 * l + .28 * u + .035 * d, G = .5 + .003 * c - .2 * l + .1 * u, Z += .08 * l + .1 * u + .012 * c, Q = 1 - .13 * l);
				break;
			}
			case `corrugatedcardboard`:
			case `creasedpaper`:
			case `layeredpaper`: {
				let r = me(e * 8, o * 8), i = e * 24, a = o * 32, s = Math.floor(i), c = Math.floor(a), l = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = s + t, r = c + e, o = ((r % 4 + 4) % 4 * 3 + (n % 3 + 3) % 3) * 5, u = i - n - V[o], d = a - r - V[o + 1], f = u * V[o + 2] + d * V[o + 3], p = d * V[o + 2] - u * V[o + 3], m = clamp(1 - (f / V[o + 4]) ** 2 - (p / .065) ** 2);
					l += m * m;
				}
				let u = .018 * r + .014 * l;
				if (t === `corrugatedcardboard`) {
					let t = .5 + .5 * Math.cos(n * e * 4);
					z = .38 + .27 * t + .09 * r - .055 * l, G = .18 + .58 * t + u, Z += .025 * (r - .5) + .015 * l, Q = .68 + .3 * t - .025 * l;
				} else if (t === `creasedpaper`) {
					let t = Math.abs(fract(e * 2 + .5) - .5), n = Math.abs(fract(o * 2 + .5) - .5), i = clamp(1 - (t / .14) ** 2) ** 2, a = clamp(1 - (n / .14) ** 2) ** 2, s = clamp(1 - ((t - .25) / .1) ** 2) ** 2, c = clamp(1 - ((n - .25) / .1) ** 2) ** 2, d = 1 - (1 - i) * (1 - a), f = (1 - (1 - s) * (1 - c)) * (1 - d);
					z = .7 + .1 * d - .14 * f + .07 * r - .04 * l, G = .4 + .3 * d - .16 * f + u, Z += .025 * (r - .5) - .035 * d + .025 * f, Q = .98 - .19 * f - .02 * l;
				} else {
					z = .5, G = .2, Q = .98;
					for (let t = 0; t < 8; t++) {
						let r = .25 + t % 2 * .5, i = (Math.floor(t / 2) + .5) / 4, a = fract(e - r + .5) - .5, s = fract(o - i + .5) - .5, c = H[t * 3 + 2], l = .008 * Math.sin(n * a * 12 + c) + .004 * Math.sin(n * a * 28 - c), u = smooth(clamp((.34 - Math.abs(a)) / .025)), d = smooth(clamp((.18 + l - Math.abs(s)) / .025)), f = u * d, p = 4 * d * (1 - d), m = 4 * u * (1 - u), h = p * u + m * d * (1 - p);
						G += f * (H[t * 3] - G), z += f * (H[t * 3 + 1] - z), Q += f * (.98 - Q), G -= .035 * h, z -= .075 * h, Q -= .18 * h;
					}
					G += u, z += .07 * r - .045 * l, Z += .025 * (r - .5) + .015 * l, Q -= .02 * l;
				}
				break;
			}
			case `cactus`: {
				let t = e * 8, r = o * 8, i = Math.floor(t), a = Math.floor(r), s = .5 - .5 * Math.cos(n * t), c = fe(e, o), l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
					let o = i + n, s = a + e, c = (o + 8) % 8, d = ((s + 8) % 8 * 8 + c) * 18, f = t - o - .5, p = r - s - .5 - B[d + 1];
					if (f * f + p * p > .14) continue;
					let m = clamp(1 - f * f / .0196 - p * p / .0169), h = B[d];
					l += m * m;
					for (let e = 0; e < 8; e++) {
						let t = B[d + 2 + e * 2], n = B[d + 3 + e * 2], r = f * t + p * n, i = p * t - f * n, a = smooth(clamp((r - .09) / .055)) * smooth(clamp((h - r) / .085)), o = clamp(1 - i * i / 225e-6);
						u += a * o * o;
					}
				}
				z = .2 + .47 * s + .045 * c + .18 * l - .08 * u, G = .18 + .49 * s + .065 * l - .025 * u + .004 * c, Z += .12 * l + .055 * u + .025 * (c - .5), Q = .83 + .16 * s - .08 * l - .035 * u;
				break;
			}
			case `pinecone`: {
				let t = e * 8, r = o * 8, i = Math.floor(r), a = fe(e, o);
				z = .08 + .025 * a, G = .12, Q = .58;
				for (let e = 1; e >= -1; e--) {
					let o = i + e, s = (o + 8) % 8, c = s % 2 * .5, l = Math.floor(t - c);
					for (let e = -1; e <= 1; e++) {
						let i = l + e, u = (i + 8) % 8, d = B[s * 8 + u], f = t - i - c - .5, p = r - o - .5, m = smooth(clamp((.68 + f - .55 * p) / .1)), h = smooth(clamp((.68 - f - .55 * p) / .1)), g = smooth(clamp((p + .78) / .12)), _ = smooth(clamp((.86 - p) / .12)), v = m * h * g * _;
						if (v === 0) continue;
						let y = smooth(clamp((p + .05) / .76)), b = smooth(clamp(1 - f * f / .36)), x = Math.cos(n * (19 * f + 1.8 * p * p + d)), S = .28 + .27 * y + .075 * b + .018 * d + .006 * x, C = .28 + .22 * d + .18 * y + .045 * x + .025 * a;
						z += v * (C - z), G += v * (S - G), Q += v * (.97 - Q);
					}
				}
				Z += .06 * (1 - Q) + .025 * (a - .5);
				break;
			}
			case `corncob`: {
				let t = e * 12, n = o * 8, r = Math.floor(t), i = B[Math.floor(n) * 12 + r], a = (fract(t) - .5) / (.445 + .015 * i), s = (fract(n) - .5) / (.46 + .015 * i), c = clamp(1 - a * a * a * a - s * s), l = smooth(clamp(c / .28)), u = smooth(c), d = fe(e, o);
				z = .13 + l * (.36 + .15 * i + .21 * u + .025 * d), G = .09 + l * (.24 + .4 * u + .025 * i), Z += .14 * (1 - l) - .055 * u + .015 * (d - .5), Q = .55 + .44 * l;
				break;
			}
			case `wood`: {
				let t = noise(e, o, 4, 2, r ^ 71), i = .5 + .5 * Math.sin(n * (12 * e + .65 * t) + a), s = (.5 + .5 * Math.sin(n * (40 * e + t) + a)) ** 12;
				z = clamp(.22 + .6 * i + .16 * S - .2 * s), G = .65 * i + .15 * S - .18 * s, Z += .15 * s + .08 * (S - .5), Q = 1 - .15 * s;
				break;
			}
			case `brick`: {
				let t = Math.floor(o * 8), n = fract(e * 4 + t % 2 * .5), i = fract(o * 8), s = smooth(clamp((Math.min(n, 1 - n, i * .5, (1 - i) * .5) - .014) / .045));
				z = .25 + .42 * hash(Math.floor(e * 4 + t % 2 * .5) % 4, t, r) + .2 * S, G = s * (.75 + .15 * S + .1 * R), $ = 1 - s, Z += .09 * $ + .05 * (S - .5), Q = .65 + .35 * s;
				break;
			}
			case `stone`: {
				let t = noise(e + .12 * p, o, 8, 8, r ^ 131);
				z = clamp(.1 + .65 * t + .3 * S), G = .65 * t + .25 * S + .1 * R, Z += .1 * (S - .5), Q = .8 + .2 * smooth(G);
				break;
			}
			case `metal`: {
				let t = noise(e, o, 4, 64, r ^ 313), i = (.5 + .5 * Math.sin(n * o * 48 + a)) ** 16;
				z = .4 + .38 * t + .12 * p - .1 * i, G = .7 * t - .15 * i, Z += .18 * t + .08 * i, Q = 1 - .04 * i;
				break;
			}
			case `fabric`: {
				let t = e * 12, r = o * 12, i = Math.sin(Math.PI * fract(t)) ** 2, s = Math.sin(Math.PI * fract(r)) ** 2, c = (Math.floor(t) + Math.floor(r)) % 2 == 0, l = c ? i * (.6 + .4 * s) : s * (.6 + .4 * i), u = .5 + .5 * Math.sin(n * (c ? e : o) * 48 + a);
				z = .22 + .48 * l + .14 * S + .08 * u, G = .8 * l + .06 * u + .08 * S, Z += .04 * (S - .5), Q = .68 + .32 * l;
				break;
			}
			case `marble`: {
				let t = noise(e, o, 4, 4, r ^ 997), i = Math.exp(-Math.abs(Math.sin(n * (3 * e + 2 * o + .8 * t) + a)) * 16);
				z = clamp(.9 + .1 * p - .85 * i), G = .3 * p - .2 * i + .05 * S, Z += .1 * i + .04 * (S - .5), Q = 1 - .06 * i;
				break;
			}
			case `concrete`: {
				let t = fract(e * 3), n = fract(o * 3), a = 1 - smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .02) / .035)), s = hash(Math.floor(fract(e) * 40), Math.floor(fract(o) * 40), r);
				z = .28 + .5 * s * (1 - a) + .12 * S, G = (1 - a) * (.65 + .25 * s) + .05 * S, Z += .14 * a + .06 * (s - .5), Q = .62 + .38 * (1 - a);
				break;
			}
			case `tiles`: {
				let t = fract(e * 5), n = fract(o * 5), a = smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .018) / .028));
				z = .42 + .4 * hash(Math.floor(e * 5) % 5, Math.floor(o * 5) % 5, r) + .08 * S, G = a * (.82 + .1 * S), $ = 1 - a, Z += .42 * $ + .04 * (S - .5), Q = .58 + .42 * a;
				break;
			}
			case `leather`: {
				let n = smooth(clamp(1 - wrappedFeature(e, o, 14, r ^ 81) * 1.55));
				z = .24 + .52 * n + .12 * S, G = .12 + .72 * n + .06 * S, Z += .16 * (1 - n) + .04 * (S - .5), Q = .55 + .45 * n;
				break;
			}
			case `suede`: {
				let t = noise(e, o, 5, 7, r ^ 15639), n = noise(e + .012 * t, o + .004 * t, 96, 24, r ^ 24113), i = smooth(clamp((noise(e, o, 80, 80, r ^ 31331) - .57) / .35));
				z = .23 + .36 * t + .25 * n + .1 * S - .08 * i, G = .35 + .075 * n + .025 * t - .045 * i, Z += .075 * (n - .5) + .035 * (t - .5), Q = .985 - .035 * i + .01 * n;
				break;
			}
			case `snakeskin`: {
				let t = e * 10, n = o * 12, r = Math.floor(n), i = 0, a = 0, s = 0, c = 0;
				for (let e = -1; e <= 1; e++) {
					let o = r + e, l = (o % 2 + 2) % 2 * .5, u = Math.floor(t - l);
					for (let e = -1; e <= 1; e++) {
						let r = u + e, d = (r % 10 + 10) % 10, f = (o % 12 + 12) % 12, p = m[f * 10 + d], h = t - r - l - .5, g = n - o - .5;
						if (Math.abs(h) >= .48 || Math.abs(g) >= .64) continue;
						let v = clamp(1 - (Math.sqrt(h * h + .0016) / (.46 + .02 * p) + Math.sqrt(g * g + .0016) / (.61 + .03 * p)));
						if (v === 0) continue;
						let y = smooth(clamp(v / .18)), b = v * v, x = b * Math.exp(-h * h * 180);
						i += y, a += b, s += x, c += y * p;
					}
				}
				z = .13 + .4 * i + .2 * c + .1 * a + .04 * S, G = .04 + .64 * i + .2 * a + .065 * s + .012 * S, Z += .12 * (1 - i) - .045 * a + .045 * (S - .5), Q = .57 + .41 * i + .015 * a;
				break;
			}
			case `crocodile`: {
				let t = e * 4, i = o * 6, s = Math.floor(t), c = m[Math.floor(i) * 4 + s], l = (fract(t) - .5) / (.445 + .025 * c), u = (fract(i) - .5) / (.445 + .02 * c), d = clamp(1 - l * l * l * l - u * u * u * u), f = smooth(clamp(d / .36)), p = noise(e, o, 9, 11, r ^ 12115), h = (.5 + .5 * Math.sin(n * (19 * e + 13 * o + 1.7 * p) + a)) ** 12;
				z = .12 + f * (.37 + .22 * c + .1 * S - .12 * h), G = .035 + f * (.64 + .17 * d * d + .035 * c - .065 * h), Z += .13 * (1 - f) + f * (.055 * h + .04 * (S - .5)), Q = .53 + f * (.46 - .055 * h);
				break;
			}
			case `fishscales`:
			case `feathers`: {
				let r = e * O, i = o * k, a = Math.floor(i);
				z = .12 + .045 * S, G = .23, Q = .76;
				for (let e = -1; e <= 1; e++) {
					let o = a + e, s = (o % k + k) % k, c = s % 2 * .5, l = Math.floor(r - c);
					for (let e = -1; e <= 1; e++) {
						let a = l + e, u = (a % O + O) % O, d = (s * O + u) * 2, f = A[d], p = i - o - .5, m = r - a - c - .5 - A[d + 1] * p, h, g, _;
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
						z += h * (g - z), G += h * (_ - G), Q += h * (.98 - Q);
					}
				}
				Z += .045 * (1 - Q) + .025 * (S - .5);
				break;
			}
			case `tortoiseshell`: {
				let t = e * 6, i = o * 6, a = Math.floor(t), s = Math.floor(i), c = noise(e, o, 19, 23, r ^ 18919);
				z = .045 + .025 * S, G = .22, Q = .72;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = a + r, l = s + e, u = (o + 6) % 6, d = ((l + 6) % 6 * 6 + u) * 27, f = t - o - j[d], p = i - l - j[d + 1], m = 1, h = 1;
					for (let e = 0; e < 8; e++) {
						let t = d + 3 + e * 3, n = j[t + 2], r = n - f * j[t] - p * j[t + 1];
						if (m *= smooth(clamp((r - .018) / .085)), h *= smooth(clamp(r / n)), m === 0) break;
					}
					if (m === 0) continue;
					let g = j[d + 2], _ = Math.cos(n * (5 * h + .12 * g)), v = .28 + .25 * g + .22 * c + .09 * h + .045 * _;
					z += m * (v - z), G += m * (.37 + .2 * h + .012 * _ * h - G), Q += m * (.98 - Q);
				}
				Z += .06 * (1 - Q) + .025 * (S - .5);
				break;
			}
			case `sand`: {
				let t = noise(e, o, 3, 3, r ^ 17), i = .5 + .5 * Math.sin(n * (o * 7 + .35 * t) + a), s = noise(e, o, 48, 48, r ^ 20973);
				z = .3 + .48 * i + .18 * s, G = .72 * i + .22 * s, Z += .06 * (s - .5), Q = .82 + .18 * i;
				break;
			}
			case `rust`: {
				let t = noise(e, o, 6, 6, r ^ 211), n = noise(e, o, 18, 18, r ^ 419), i = smooth(clamp((t * .7 + n * .3 - .32) / .28));
				z = i, G = .25 + .45 * (1 - i) * n - .2 * i * t, Z += .22 * i + .05 * (n - .5), Q = .7 + .3 * (1 - i), Oe = 1 - i;
				break;
			}
			case `snow`: {
				let t = noise(e, o, 3, 3, r ^ 17), n = hash(Math.floor(fract(e) * 48), Math.floor(fract(o) * 48), r) ** 8;
				z = clamp(.22 + .68 * t + .1 * n), G = .7 * t + .2 * n, Z += .22 * n - .06 * t, Q = .88 + .12 * t;
				break;
			}
			case `asphalt`:
			case `gravel`: {
				let i = t === `asphalt`, a = i ? 40 : 12, s = e * a, c = o * a, l = Math.floor(s), u = Math.floor(c), d = 0, f = 0, p = 0, m = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let o = l + t, h = u + e, g = (o % a + a) % a, _ = (h % a + a) % a, v = hash(g, _, r ^ 29873), y = hash(g, _, r ^ 27145) * n, b = Math.cos(y), x = Math.sin(y), C = s - o - .25 - .5 * hash(g, _, r), w = c - h - .25 - .5 * hash(g, _, r ^ 40503), T = i ? .22 + .21 * v : .46 + .17 * v, E = .7 + .3 * hash(g, _, r ^ 20973), D = (C * b + w * x) / E, O = w * b - C * x, k = Math.sqrt(D * D + O * O) + (S - .5) * (i ? .08 : .16), A = smooth(clamp((T - k) / .16)), j = clamp(1 - k / T);
					d = Math.max(d, A), m = Math.max(m, A * (.65 + .35 * j)), f += A * (.35 + .65 * v), p += A;
				}
				let h = f / Math.max(1, p);
				i ? (z = .06 + .58 * h + .1 * S + .06 * R, G = .58 * m + .18 * S + .24 * R, Z += .08 * (1 - d) + .1 * (R - .5), Q = .8 + .2 * d) : (z = .04 + .8 * h + .08 * R, G = m * (.84 + .16 * S) + .025 * R, Z += .13 * (1 - d) + .1 * (R - .5), Q = .42 + .58 * d);
				break;
			}
			case `cobblestone`: {
				let t = e + .012 * noise(e, o, 6, 8, r ^ 561), n = o + .009 * noise(e, o, 6, 8, r ^ 2323), i = Math.floor(fract(n) * 8), a = t * 6 + i % 2 * .5, s = fract(a), c = fract(n * 8), l = Math.abs(s - .5), u = Math.abs(c - .5) * .75, d = Math.max(0, l - .38), f = Math.max(0, u - .255), m = smooth(clamp((.12 - Math.sqrt(d * d + f * f) - .018) / .085)), h = hash((Math.floor(a) % 6 + 6) % 6, i, r), g = 1 - .65 * (l * l + u * u);
				z = .05 + m * (.25 + .48 * h + .12 * S) + .05 * R, G = m * (.76 * g + .16 * S + .08 * R), Z += .17 * (1 - m) + .1 * (R - .5), Q = .45 + .55 * m;
				break;
			}
			case `bark`: {
				let t = noise(e, o, 4, 6, r ^ 15127), n = noise(e + .035 * t, o, 18, 3, r ^ 33825), i = noise(e, o, 6, 18, r ^ 20883), a = smooth(clamp((n - .26) / .38)) * smooth(clamp((i - .18) / .22)), s = noise(e, o, 48, 12, r ^ 8571);
				z = .05 + a * (.43 + .33 * s + .13 * R), G = a * (.58 + .3 * s + .12 * S), Z += .08 * (1 - a) + .1 * (R - .5), Q = .42 + .58 * a;
				break;
			}
			case `moss`: {
				let t = noise(e, o, 4, 4, r ^ 7015), i = smooth(clamp(1 - wrappedFeature(fract(e + .025 * t), fract(o + .018 * t), 9, r ^ 25519) / .95)), a = noise(e, o, 18, 18, r ^ 37671), s = smooth(clamp((R - .25) / .5));
				z = .09 + .46 * i + .24 * a + .19 * s, G = .65 * i + (.09 + .14 * i) * s + .12 * S, Z += .06 * (s - .5) - .08 * (1 - i), Q = .52 + .36 * i + .12 * s;
				break;
			}
			case `mud`: {
				let t = noise(e, o, 4, 4, r ^ 29011), n = (e + .025 * t) * 7, i = (o + .025 * noise(e, o, 4, 4, r ^ 7993)) * 7, a = Math.floor(n), s = Math.floor(i), c = 4, l = 4;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let o = a + t, u = s + e, d = (o % 7 + 7) % 7, f = (u % 7 + 7) % 7, p = n - o - .3 - .4 * hash(d, f, r), m = i - u - .3 - .4 * hash(d, f, r ^ 40503), h = p * p + m * m;
					h < c ? (l = c, c = h) : h < l && (l = h);
				}
				let d = smooth(clamp((Math.sqrt(l) - Math.sqrt(c) - .025) / .13)), f = smooth(clamp((noise(e, o, 3, 3, r ^ 14561) - .25) / .5));
				z = .04 + d * (.52 - .24 * f + .17 * S) + .04 * R, G = d * (.48 + .16 * (1 - c)) + (.07 * S + .03 * R) * (1 - .75 * f), Z -= .38 * f, Z += .1 * (1 - d) + .08 * (R - .5) * (1 - f), Q = .48 + .52 * d;
				break;
			}
			case `granite`: {
				let t = e * 38, n = o * 38, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0, l = 4, u = 4;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let d = i + o, f = a + e, p = (d % 38 + 38) % 38, m = (f % 38 + 38) % 38, h = t - d - .3 - .4 * hash(p, m, r), g = n - f - .3 - .4 * hash(p, m, r ^ 40503), _ = h * h + g * g;
					_ < l ? (u = l, l = _) : _ < u && (u = _);
					let v = clamp(1 - _ / 1.44) ** 10, y = hash(p, m, r ^ 25643);
					s += v * (y < .24 ? .08 + y : .48 + .5 * y), c += v;
				}
				let d = s / Math.max(c, 1e-12), f = 1 - smooth(clamp((Math.sqrt(u) - Math.sqrt(l)) / .16));
				z = clamp(.04 + .88 * d + .1 * (R - .5) - .07 * f), G = .35 * d + .17 * R - .12 * f, Z += .16 * (1 - d) + .06 * (R - .5), Q = .97 - .025 * f + .03 * R;
				break;
			}
			case `slate`: {
				let t = noise(e, o, 5, 4, r ^ 16743), n = noise(e + .025 * t, o + .018 * t, 3, 22, r ^ 29723) * 5, i = (Math.floor(n) + smooth(clamp((fract(n) - .35) / .3))) / 5, a = noise(e, o, 12, 5, r ^ 4955), s = (1 - Math.abs(2 * fract(n) - 1)) ** 8 * smooth(clamp((a - .18) / .35));
				z = .14 + .62 * i + .14 * R - .12 * s, G = .72 * i + .1 * R - .18 * s, Z += .1 * s + .1 * (R - .5), Q = .98 - .15 * s + .02 * R;
				break;
			}
			case `terrazzo`: {
				let t = e * 9, i = o * 9, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let d = a + o, f = s + e, p = (d % 9 + 9) % 9, m = (f % 9 + 9) % 9, h = hash(p, m, r ^ 37499), g = hash(p, m, r ^ 13341) * n, _ = Math.cos(g), v = Math.sin(g), y = t - d - .3 - .4 * hash(p, m, r), b = i - f - .3 - .4 * hash(p, m, r ^ 40503), x = y * _ + b * v, S = b * _ - y * v, C = .75 + .25 * hash(p, m, r ^ 8623), w = Math.max(Math.abs(x) * C, Math.abs(S), (x * .65 + S * .76) * 1.1, (-x * .83 + S * .55) * 1.15), E = smooth(clamp((.26 + .18 * h - w) / .025));
					c = Math.max(c, E), l += E * (.08 + .7 * hash(p, m, r ^ 22815)), u += E;
				}
				let d = l / Math.max(u, 1e-12);
				z = (.88 + .06 * S) * (1 - c) + c * d, G = .15 + .06 * c + .015 * S + .025 * R, Z += .055 * (1 - c) - .03 * c * d + .04 * (R - .5), Q = .98 + .015 * c + .005 * R;
				break;
			}
			case `denim`: {
				let t = e * 24, i = o * 24, s = .5 + .5 * Math.cos(n * t), c = .5 + .5 * Math.cos(n * i), l = 1 - smooth(clamp((Math.abs(Math.sin(Math.PI * (t - i) / 4)) - .24) / .22)), u = .5 + .5 * Math.sin(n * (96 * e + .12 * S) + a), d = .5 + .5 * Math.sin(n * (96 * o + .12 * S) + a), f = u * (1 - l) + d * l, p = s * (1 - l) + c * l, m = noise(e, o, 24, 4, r ^ 27953);
				z = .12 + .22 * p + .34 * l + .1 * f + .12 * m, G = .42 * p + .24 * (1 - l) + .06 * f + .08 * m, Z += .06 * (S - .5) + .04 * (1 - p), Q = .78 + .18 * p + .04 * f;
				break;
			}
			case `herringbone`: {
				let t = 32 * e, i = 32 * o, s = Math.acos(.995 * Math.cos(n * 2 * e)) / Math.PI, c = smooth(clamp((.5 + .5 * Math.cos(n * (2 * s - 8 * o) + a) - .2) / .6)), l = .5 + .5 * Math.cos(n * t), u = .5 + .5 * Math.cos(n * i), d = l * (1 - c) + u * c, f = (.5 + .5 * Math.sin(n * 128 * e + a)) * (1 - c) + (.5 + .5 * Math.sin(n * 128 * o - a)) * c, p = noise(e, o, 16, 8, r ^ 15385);
				z = .17 + .31 * c + .26 * d + .1 * f + .09 * p, G = .25 + .24 * d + .07 * c + .035 * f + .025 * p, Z += .055 * (S - .5) + .035 * (1 - d), Q = .84 + .12 * d + .025 * f;
				break;
			}
			case `tweed`: {
				let t = 20 * e, i = 20 * o, s = smooth(clamp((Math.cos(n * t) + .45) / 1.25)), c = smooth(clamp((Math.cos(n * i) + .45) / 1.25)), l = smooth(clamp(.5 + .85 * Math.cos(Math.PI * (t + i)))), u = s * (1 - c + c * l), d = c * (1 - s + s * (1 - l)), f = u + d, p = u * noise(e, o, 20, 4, r ^ 15127) + d * noise(e, o, 4, 20, r ^ 28201), m = u * (.5 + .5 * Math.sin(n * (80 * e + .15 * S) + a)) + d * (.5 + .5 * Math.sin(n * (80 * o + .15 * S) - a)), h = e * 24, g = o * 24, _ = Math.floor(h), v = Math.floor(g), y = 0, b = .12 + .29 * f + .34 * p + .12 * m;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = _ + t, i = v + e, a = (n % 24 + 24) % 24, o = (i % 24 + 24) % 24, s = hash(a, o, r ^ 11635), c = h - n - .25 - .5 * hash(a, o, r), l = g - i - .25 - .5 * hash(a, o, r ^ 23089), u = (s < .5 ? 0 : Math.PI / 2) + (s - .5) * .7, d = Math.cos(u), f = Math.sin(u), p = (c * d + l * f) / (.18 + .2 * s), m = (l * d - c * f) / .075, x = clamp(1 - p * p - m * m), S = x * x;
					y += S, b += S * (.18 + .64 * hash(a, o, r ^ 32537) - b);
				}
				z = b, G = .2 + .28 * f + .08 * s * c + .05 * m + .055 * y, Z += .05 * (S - .5) + .025 * y, Q = .77 + .19 * f + .025 * m;
				break;
			}
			case `seersucker`: {
				let t = smooth(clamp((Math.cos(n * 4 * e) + .25) / .75)), i = .5 + .5 * Math.cos(n * 48 * e), s = .5 + .5 * Math.cos(n * 48 * o), c = .5 + .5 * Math.cos(Math.PI * 48 * (e + o)), l = i * c + s * (1 - c), u = .5 + .25 * Math.sin(n * 144 * e + a) + .25 * Math.sin(n * 144 * o - a), d = noise(e, o, 4, 4, r ^ 19513), f = .5 + .5 * Math.sin(n * (12 * o + .22 * Math.sin(n * 4 * e) + .3 * d) + a);
				z = .71 - .39 * t + .12 * l + .055 * u + .04 * t * f, G = .22 + .035 * l + .008 * u + t * (.08 + .2 * f), Z += .045 * (S - .5) + .025 * t * (1 - f), Q = .96 - .07 * t * (1 - f) + .02 * l;
				break;
			}
			case `burlap`: {
				let t = e * 10, r = o * 10, i = smooth(clamp((Math.cos(n * t) + .35) / 1.1)), s = smooth(clamp((Math.cos(n * r) + .35) / 1.1)), c = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t + r)))), l = i * (1 - s + s * c), u = s * (1 - i + i * (1 - c)), d = l + u, f = .5 + .5 * Math.sin(n * (50 * e + .14 * S) + a), p = .5 + .5 * Math.sin(n * (50 * o + .14 * S) + a), m = l * f + u * p, h = i * s;
				z = .04 + .65 * d + .14 * m + .1 * S * d, G = .58 * d + .2 * h + .08 * m + .04 * S, Z += .05 * (S - .5) + .025 * (1 - d), Q = .42 + .54 * d + .04 * m;
				break;
			}
			case `carpet`: {
				let t = e * 24, i = o * 24, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let f = a + o, p = s + e, m = (f % 24 + 24) % 24, h = (p % 24 + 24) % 24, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), y = clamp(1 - (g * g + _ * _)) ** 3, b = hash(m, h, r ^ 10571), x = hash(m, h, r ^ 26655) * n, S = (.5 + .5 * Math.sin(n * 3 * (g * Math.cos(x) + _ * Math.sin(x)) + b * n)) ** 4;
					c += y, l += y * b, u += y * S, d = Math.max(d, y * (.75 + .25 * b));
				}
				let f = 1 / Math.max(c, 1e-12), p = l * f, m = u * f;
				z = .19 + .4 * p + .2 * d + .13 * m + .08 * S, G = .3 + .38 * d + .12 * m + .1 * S, Z += .04 * (S - .5) - .035 * m, Q = .7 + .22 * Math.sqrt(d) + .06 * m;
				break;
			}
			case `plaster`: {
				let t = noise(e, o, 3, 3, r ^ 14241), i = (.5 + .5 * Math.sin(n * (3 * e + 2 * o + .7 * t) + a)) ** 10, s = noise(e, o, 18, 5, r ^ 21721), c = smooth(clamp((.32 - R) / .23));
				z = .61 + .2 * t + .08 * s + .07 * i - .12 * c, G = .22 + .28 * t + .18 * i + .08 * s - .14 * c, Z += .1 * (R - .5) - .065 * i + .045 * c, Q = .98 - .1 * c - .025 * i;
				break;
			}
			case `terracotta`: {
				let t = noise(e, o, 5, 5, r ^ 14871), n = noise(e + .04 * t, o, 12, 9, r ^ 32035), a = 1 - smooth(clamp((wrappedFeature(e, o, 28, r ^ 18541) - .04) / .19)), s = smooth(clamp((t - .5) / .3));
				z = .37 + .46 * n + .15 * S - .18 * s - .17 * a, G = .35 + .14 * S + .12 * R - .3 * a, Z += .1 * (R - .5) + .07 * a - .04 * s, Q = .97 - .22 * a + .025 * R;
				break;
			}
			case `cork`: {
				let t = e * 14, i = o * 14, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let f = a + o, p = s + e, m = (f % 14 + 14) % 14, h = (p % 14 + 14) % 14, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), v = n * hash(m, h, r ^ 19745), y = g * Math.cos(v) + _ * Math.sin(v), b = _ * Math.cos(v) - g * Math.sin(v), S = clamp(1 - (.9 * y * y + 1.3 * b * b) / 1.21) ** 8, C = hash(m, h, r ^ 5931), w = (.5 + .5 * Math.sin(n * (5 * b + .3 * y) + n * C)) ** 12;
					c += S, l += S * C, d += S * w, u = Math.max(u, S);
				}
				let f = 1 / Math.max(c, 1e-12), p = l * f, m = d * f, h = 1 - smooth(clamp((u * f - .48) / .4));
				z = .31 + .57 * p + .12 * S - .22 * h - .09 * m, G = .4 + .16 * p + .07 * R - .2 * h - .07 * m, Z += .07 * (R - .5) + .045 * h - .025 * p, Q = .97 - .18 * h - .08 * m;
				break;
			}
			case `studdedrubber`: {
				let t = e * 6, n = o * 6, a = fract(t) - .5, s = fract(n) - .5, l = 1 - smooth(clamp((Math.sqrt(a * a + s * s) - .24) / .12)), u = ee[Math.floor(n) * 6 + Math.floor(t)], d = noise(e, o, 144, 144, r ^ 18867);
				z = .24 + .16 * l + .06 * l * u + .05 * d, G = .16 + .66 * l + .002 * d, Z = i.roughness + .04 * (d - .5), Q = .84 + .16 * l;
				break;
			}
			case `groovedrubber`: {
				let t = e * 12, a = 1 - smooth(clamp((Math.abs(fract(t) - .5) - .32) / .13)), s = te[Math.floor(t)], c = noise(e, o, 144, 144, r ^ 28193);
				z = .18 + .29 * a + .04 * a * s + .035 * c, G = .15 + .7 * a + .0015 * c, Z = i.roughness + .035 * (c - .5), Q = .7 + .3 * a;
				break;
			}
			case `recycledrubber`: {
				let t = e * 48, n = o * 48, a = Math.floor(t), s = Math.floor(n), c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let i = a + r, o = s + e, u = ((o + 48) % 48 * 48 + (i + 48) % 48) * 18, d = t - i - M[u], f = n - o - M[u + 1], p = 1;
					for (let e = 0; e < 5; e++) {
						let t = u + 3 + e * 3, n = M[t + 2] - d * M[t] - f * M[t + 1];
						p *= smooth(clamp(n / .14));
					}
					c += p, l += p * M[u + 2];
				}
				let u = 1 - Math.exp(-2 * c), d = noise(e, o, 144, 144, r ^ 15239);
				z = .035 + .59 * u + .22 * l / (1 + c), G = .25 + .18 * u + .002 * d, Z = i.roughness - .06 * u + .02 * d, Q = .83 + .17 * u;
				break;
			}
			case `rubber`: {
				let n = 1 - smooth(clamp((wrappedFeature(e, o, 44, r ^ 36435) - .08) / .55));
				z = .19 + .38 * n + .19 * R + .1 * S, G = .19 + .49 * n + .15 * R + .06 * S, Z += .12 * (R - .5) - .045 * n, Q = .9 + .08 * n + .02 * R;
				break;
			}
			case `carbonfiber`: {
				let t = 12 * (e + o), r = 12 * (o - e), i = .5 + .5 * Math.cos(n * t), s = .5 + .5 * Math.cos(n * r), c = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t - r) / 2))), l = .5 + .5 * Math.sin(n * (4 * t + .08 * S) + a), u = .5 + .5 * Math.sin(n * (4 * r + .08 * S) + a), d = i * c + s * (1 - c), f = l * c + u * (1 - c);
				z = .12 + .46 * d + .2 * f + .12 * S, G = .25 + .37 * d + .055 * f + .04 * S, Z += .065 * (S - .5) + .045 * (1 - d), Q = .88 + .1 * d + .02 * f;
				break;
			}
			case `diamondplate`: {
				let t = e * 8, n = o * 8, i = fract(t) - .5, a = fract(n) - .5, s = (Math.floor(t) + Math.floor(n)) % 2 == 0 ? 1 : -1, c = (i + s * a) * Math.SQRT1_2, l = (a - s * i) * Math.SQRT1_2, d = smooth(clamp((1 - (Math.abs(c) / .48 + Math.abs(l) / .14)) / .24)), f = noise(e, o, 4, 64, r ^ 13793);
				z = .35 + .25 * f + .29 * d + .07 * S, G = .08 + .78 * d + .025 * f, Z += .14 * (f - .5) - .075 * d, Q = .94 + .05 * d + .01 * S;
				break;
			}
			case `knurledmetal`: {
				let t = smooth(.5 - .5 * Math.cos(n * 24 * (e + o))) * smooth(.5 - .5 * Math.cos(n * 24 * (e - o)));
				z = .29 + .48 * t + .16 * S, G = .12 + .72 * t + .025 * S, Z += .1 * (S - .5) + .07 * (1 - t), Q = .85 + .14 * t;
				break;
			}
			case `engineturned`: {
				let t = e * 6, r = o * 6, i = Math.floor(t), a = Math.floor(r), s = 0, c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let u = i + o, d = a + e, f = (u % 6 + 6) % 6, p = (d % 6 + 6) % 6, m = t - u - .25 - p % 2 * .5, g = r - d - .5, _ = m * m + g * g, v = Math.max(0, 1 - _ / .9025), y = v * v, b = (p * 6 + f) * 2, x = h[b], S = .5 + .5 * Math.cos(n * (10 * _ + x + .18 * m * g));
					s += y, c += y * S, l += y * h[b + 1];
				}
				c /= s, l /= s, z = .35 + .34 * l + .22 * c + .04 * S, G = .44 + .07 * c + .025 * S, Z += .18 * (c - .5) + .12 * (l - .5), Q = .98 + .015 * c;
				break;
			}
			case `goldleaf`: {
				let t = noise(e, o, 4, 5, r ^ 19843), i = e + .035 * Math.sin(n * o * 3 + a), s = o + .03 * Math.sin(n * e * 4 + a), c = noise(i, s, 4, 5, r ^ 7769), l = smooth(clamp((Math.cos(n * 4 * i) - .92) / .08)), u = smooth(clamp((Math.cos(n * 5 * s) - .92) / .08)), d = l + (1 - l) * u, f = (.5 + .5 * Math.cos(n * (18 * e + 7 * o + 1.7 * t) + a)) ** 8, p = (.5 + .5 * Math.cos(n * (5 * e - 21 * o + 1.3 * c) - a)) ** 10, m = .6 * f + .4 * p;
				z = .4 + .3 * c + .19 * m - .1 * d, G = .36 + .34 * m + .065 * d + .04 * S, Z += .12 * (c - .5) + .11 * m + .025 * d, Q = .99 - .065 * m - .025 * d;
				break;
			}
			case `paper`: {
				let t = noise(e, o, 3, 5, r ^ 33207), i = noise(e, o, 48, 48, r ^ 22483), a = e * 24, s = o * 24, c = Math.floor(a), l = Math.floor(s), u = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let i = c + t, o = l + e, d = (i % 24 + 24) % 24, f = (o % 24 + 24) % 24, p = a - i - .35 - .3 * hash(d, f, r), m = s - o - .35 - .3 * hash(d, f, r ^ 6463), h = n * hash(d, f, r ^ 29409), g = p * Math.cos(h) + m * Math.sin(h), _ = m * Math.cos(h) - p * Math.sin(h), v = .42 + .28 * hash(d, f, r ^ 23337), b = clamp(1 - (g * g / (v * v) + _ * _ / .0064)) ** 2;
					u = Math.max(u, b);
				}
				z = .62 + .24 * t + .1 * i - .2 * u, G = .22 + .12 * t + .22 * i + .3 * u, Z += .08 * (i - .5) + .04 * u, Q = .98 - .07 * u - .035 * (1 - i);
				break;
			}
			case `reedmat`: {
				let t = e * 16, r = Math.floor(t), i = (fract(t) - .5) / .46, s = smooth(clamp(1 - i * i)), c = C[r * 2], l = C[r * 2 + 1], u = .5 + .5 * Math.sin(n * t * 7 + .2 * Math.sin(n * o * 3) + l), d = smooth(clamp(1 - (1 - Math.cos(n * o * 4)) / .055)), f = .5 + .5 * Math.cos(n * e * 96 + a);
				z = .15 + s * (.38 + .14 * c + .09 * u) + d * (.12 + .04 * f), G = .1 + s * (.46 + .055 * c + .018 * u) + d * (.24 + .015 * f), Z += .06 * (1 - s) - .035 * s * u + .025 * d, Q = .56 + .32 * s + .07 * d;
				break;
			}
			case `rope`: {
				let t = e * 6, r = Math.floor(t), i = fract(t) - .5, a = smooth(clamp(1 - (i / .48) ** 2)), s = C[r * 2], c = C[r * 2 + 1], l = n * (3 * i - 6 * o) + c, u = .5 + .5 * Math.cos(l), d = .5 + .5 * Math.cos(l * 9 + .15 * Math.sin(n * o * 2));
				z = .13 + a * (.3 + .14 * s + .23 * u + .06 * d), G = .08 + a * (.34 + .32 * u + .018 * d), Z += .065 * (1 - a) + a * (.025 - .045 * d), Q = .43 + a * (.35 + .17 * u);
				break;
			}
			case `straw`: {
				let t = e * 8, n = o * 8, r = Math.floor(t), a = Math.floor(n);
				z = .17 + .07 * S, G = .15 + .015 * S, Q = .55 + .035 * S;
				for (let e = 0; e < 3; e++) for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = r + s, l = a + o, u = ((e * 8 + (l % 8 + 8) % 8) * 8 + (c % 8 + 8) % 8) * 9, d = t - c - w[u], f = n - l - w[u + 1], p = (d * w[u + 2] + f * w[u + 3]) / w[u + 4], m = (f * w[u + 2] - d * w[u + 3]) / w[u + 5], h = smooth(clamp((1 - p * p) / .24)) * smooth(clamp(1 - m * m));
					if (h === 0) continue;
					let g = w[u + 6], _ = .5 + .5 * Math.cos(12 * m + w[u + 7]), v = w[u + 8] > .6 ? smooth(clamp(1 - ((p - .2) / .065) ** 2)) : 0;
					z = z * (1 - h) + h * (.48 + .26 * g + .07 * _ - .13 * v), G = G * (1 - h) + h * (.51 + .06 * e + .04 * g + .018 * _ + .055 * v), Z = Z * (1 - h) + h * (i.roughness - .04 * _ + .025 * v), Q = Q * (1 - h) + h * (.91 + .045 * _);
				}
				break;
			}
			case `wicker`: {
				let t = e * 6, i = o * 6, a = .5 + .5 * Math.cos(n * t), s = .5 + .5 * Math.cos(n * i), c = smooth(clamp((Math.cos(n * t) + .92) / .3)), l = smooth(clamp((Math.cos(n * i) + .92) / .3)), u = smooth(clamp(.5 + 1.4 * Math.cos(Math.PI * t) * Math.cos(Math.PI * i))), d = c * (1 - l + l * u), f = l * (1 - c + c * (1 - u)), p = d + f, m = noise(e, o, 72, 4, r ^ 28465), h = noise(e, o, 4, 72, r ^ 10903), g = d * m + f * h, _ = d * a + f * s;
				z = .08 + .5 * p + .16 * _ + .18 * g, G = .04 + .48 * p + .32 * _ + .045 * g, Z += .1 * (S - .5) + .1 * (1 - p) - .04 * g, Q = .34 + .54 * p + .1 * _;
				break;
			}
			case `bamboo`: {
				let t = noise(e, o, 64, 4, r ^ 19313), i = noise(e, o, 4, 3, r ^ 26909), s = .5 + .5 * Math.sin(n * (48 * e + .22 * i) + a), c = noise(e, 0, 4, 1, r ^ 10453), l = 1 - Math.cos(n * (3 * o + .65 * c + .07 * Math.sin(n * 4 * e)) + a), u = 1 - smooth(clamp(l / .16)), d = 1 - smooth(clamp(l / .42));
				z = .46 + .23 * t + .16 * s + .08 * S - .34 * u, G = .3 + .14 * t + .12 * s + .16 * d - .1 * u, Z += .12 * u + .1 * (t - .5) - .035 * s, Q = .99 - .14 * u - .025 * (1 - t);
				break;
			}
			case `hammeredmetal`: {
				let t = e * 12, n = o * 12, i = Math.floor(t), a = Math.floor(n), s = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let c = i + o, l = a + e, u = (c % 12 + 12) % 12, d = (l % 12 + 12) % 12, f = t - c - .35 - .3 * hash(u, d, r), p = n - l - .35 - .3 * hash(u, d, r ^ 29339), m = .85 + .25 * hash(u, d, r ^ 6461), h = clamp(1 - (f * f + p * p) / (m * m));
					s += h * h * (.7 + .3 * hash(u, d, r ^ 23063));
				}
				let c = 1 - Math.exp(-1.6 * s), l = noise(e, o, 4, 4, r ^ 20001);
				z = .72 - .32 * c + .14 * l + .045 * S, G = .85 - .7 * c + .008 * S, Z += .1 * (l - .5) + .09 * c, Q = .99 - .12 * c;
				break;
			}
			case `galvanized`: {
				let t = e * 10, i = o * 10, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let d = a + o, f = s + e, p = (d % 10 + 10) % 10, m = (f % 10 + 10) % 10, h = t - d - .35 - .3 * hash(p, m, r), g = i - f - .35 - .3 * hash(p, m, r ^ 15225), _ = n * hash(p, m, r ^ 22435), v = h * Math.cos(_) + g * Math.sin(_), y = g * Math.cos(_) - h * Math.sin(_), b = clamp(1 - (h * h + g * g) / 1.21) ** 8, x = hash(p, m, r ^ 18897), S = .5 + .5 * Math.cos(n * (3 * y + 1.5 * Math.abs(v)));
					c += b, l += b * x, u += b * S;
				}
				let d = 1 / Math.max(c, 1e-12), f = l * d, p = u * d;
				z = .18 + .65 * f + .12 * p + .035 * S, G = .3 + .18 * f + .035 * p + .015 * S, Z += .24 * (f - .5) + .045 * (p - .5), Q = .98 + .02 * f;
				break;
			}
			case `corrugatedmetal`: {
				let t = .5 + .5 * Math.cos(n * 8 * e + a), i = noise(e, o, 64, 4, r ^ 8043), s = (.5 + .5 * Math.sin(n * 48 * e + a)) ** 12;
				z = .5 + .2 * t + .16 * i - .06 * s, G = .1 + .8 * t + .004 * i - .002 * s, Z += .13 * (i - .5) + .06 * s, Q = .91 + .08 * t;
				break;
			}
			case `perforatedmetal`: {
				let t = e * 6, n = o * 6, r = Math.floor(t), i = Math.floor(n), a = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let s = r + o, c = i + e, l = (c % 2 + 2) % 2 * .5, u = t - s - .5 - l, d = n - c - .5, p = smooth(clamp((.3 - Math.sqrt(u * u + d * d)) / .12));
					a += (1 - a) * p;
				}
				z = .62 + .1 * S - .44 * a, G = .82 - .62 * a + .03 * S, Z += .07 * a + .04 * (S - .5), Q = 1 - .78 * a;
				break;
			}
			case `expandedmetal`: {
				let t = smooth(clamp((Math.cos(n * 5 * (e + o)) - .1) / .9)), r = smooth(clamp((Math.cos(n * 5 * (e - o)) - .1) / .9)), i = t + r - t * r, a = t * r, s = 1 - i;
				z = .7 + .1 * S - .42 * s, G = .22 + .6 * i + .09 * a + .025 * S, Z += .08 * s + .03 * (S - .5), Q = .34 + .62 * i;
				break;
			}
			case `wiremesh`: {
				let t = e * 12, n = o * 12, cap = (e) => {
					let t = clamp(1 - e * e);
					return t * t;
				}, r = cap((fract(t) - .5) / .34), i = cap((fract(n) - .5) / .34), a = .5 + .5 * Math.cos(Math.PI * (t - n)), s = r * a + i * (1 - a), c = (i * a + r * (1 - a)) * (1 - s);
				z = .3 + .46 * s + .2 * c + .08 * S, G = .08 + .78 * s + .34 * c + .03 * S, Z += .04 * (1 - s) + .03 * (S - .5), Q = .36 + .56 * s + .18 * c;
				break;
			}
			case `velvet`: {
				let t = noise(e, o, 5, 5, r ^ 31793), n = noise(e, o, 3, 9, r ^ 10775), i = noise(e, o, 96, 96, r ^ 24365);
				z = .3 + .32 * t + .12 * i, G = .42 + .06 * t + .05 * i, Z += .12 * (t - .5) + .035 * (n - .5), Q = .92 + .06 * t;
				break;
			}
			case `terrycloth`: {
				let t = e * 10, n = o * 8, r = Math.floor(t), i = Math.floor(n), a = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let s = r + o, c = i + e, l = (c % 2 + 2) % 2 * .5, u = t - s - .5 - l, d = n - c - .5, p = clamp(1 - (Math.sqrt(u * u + d * d) / .36) ** 2);
					a += (1 - a) * p * p;
				}
				z = .42 + .3 * a + .16 * S, G = .3 + .62 * a + .05 * S, Z += .05 * (S - .5) - .03 * a, Q = .62 + .35 * a;
				break;
			}
			case `boucle`: {
				let t = e * 8, n = o * 6, i = Math.floor(t), a = Math.floor(n), c = clamp(1 - ((fract(n) - .5) / .36) ** 2), l = c * c, u = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let s = i + o, c = a + e, l = (s % 8 + 8) % 8, d = (c % 6 + 6) % 6, f = t - s - .5 - .3 * (hash(l, d, r ^ 27181) - .5), p = n - c - .5 - .18 * (hash(l, d, r ^ 13297) - .5), h = clamp(1 - ((Math.sqrt(f * f + p * p) - .16) / .075) ** 2);
					u += (1 - u) * h * h;
				}
				let d = 1 - l;
				z = .36 + .34 * l + .14 * u + .12 * S, G = .16 + .5 * l + .26 * u + .04 * S, Z += .06 * d + .03 * (S - .5), Q = .58 + .3 * l + .1 * u;
				break;
			}
			case `geode`: {
				let t = fract(e) - .5, i = fract(o) - .5, s = Math.sin(Math.PI * t) / Math.PI, c = Math.sin(Math.PI * i) / Math.PI, l = Math.sqrt(s * s + c * c), u = noise(e, o, 6, 6, r ^ 15383), d = .5 + .5 * smooth(clamp((l - .1) / .08)) * Math.cos(n * (9 * l + .12 * u) + a), f = smooth(clamp((.17 - l) / .05)) * noise(e, o, 48, 48, r ^ 22817);
				z = .3 + .3 * d + .22 * f + .12 * S, G = .3 + .3 * d + .2 * f + .03 * S, Z += .1 * (1 - d) + .08 * f + .03 * (S - .5), Q = .72 + .22 * d + .04 * f;
				break;
			}
			case `quartz`: {
				let t = e * 5, n = o * 5, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = i + o, u = a + e, d = (l % 5 + 5) % 5, f = (u % 5 + 5) % 5, p = l + .5 + .24 * (hash(d, f, r ^ 19489) - .5), m = u + .5 + .24 * (hash(d, f, r ^ 29107) - .5), h = t - p, g = n - m, _ = 1;
					for (let e = 0; e < 6; e++) {
						let t = Math.PI / 3 * e + .22 * (hash(d, f, r ^ 23927) - .5), n = Math.abs(h * Math.cos(t) + g * Math.sin(t));
						_ *= smooth(clamp((.3 - n) / .055));
					}
					let v = .34 + .42 * hash(d, f, r ^ 12057), b = clamp(1 - (Math.sqrt(h * h + g * g) / .21) ** 2);
					s += (1 - s) * _, c += (1 - c) * _ * (v + .24 * b * b);
				}
				z = .52 + .26 * c + .12 * S, G = .16 + .72 * c + .03 * S, Z += .1 * (1 - s) + .03 * (S - .5), Q = .5 + .46 * s;
				break;
			}
			case `pyrite`: {
				let t = e * 5, i = o * 5, s = Math.floor(t), c = Math.floor(i), l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
					let a = s + n, o = c + e, d = (a % 5 + 5) % 5, f = (o % 5 + 5) % 5, p = a + .5 + .2 * (hash(d, f, r ^ 7233) - .5), m = o + .5 + .2 * (hash(d, f, r ^ 16167) - .5), h = .28 * (hash(d, f, r ^ 27485) - .5), g = Math.cos(h), _ = Math.sin(h), v = t - p, y = i - m, b = Math.abs(v * g + y * _), x = Math.abs(y * g - v * _), S = smooth(clamp((.32 - b) / .05)) * smooth(clamp((.32 - x) / .05)), C = .3 + .45 * hash(d, f, r ^ 20911);
					l += (1 - l) * S, u += (1 - u) * S * C;
				}
				let d = .5 + .5 * Math.cos(n * 26 * (e + o) + a), f = l * smooth(d);
				z = .5 + .24 * u + .1 * f + .1 * S, G = .18 + .6 * u + .06 * f + .03 * S, Z += .07 * (1 - f) + .03 * (S - .5), Q = .52 + .42 * l;
				break;
			}
			case `shiplap`: {
				let t = o * 5, n = (Math.floor(t) % 5 + 5) % 5, a = smooth(clamp((.07 - (.5 - Math.abs(fract(t) - .5))) / .05)), s = .5 + .36 * hash(n, 0, r ^ 11361) * (1 - a), c = noise(e, o, 48, 6, r ^ 18361), l = noise(e, o, 12, 2, r ^ 27939);
				z = .24 + .36 * s + .16 * c + .1 * l - .18 * a, G = .72 - .5 * a + .08 * c + .03 * l, Z += .05 * (c - .5) + .06 * a, Q = 1 - .55 * a;
				break;
			}
			case `glassblock`: {
				let t = e * 4, n = o * 4, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = i + o, u = a + e, d = (l % 4 + 4) % 4, f = (u % 4 + 4) % 4, p = t - l - .5, m = n - u - .5, h = smooth(clamp((.42 - Math.abs(p)) / .05)) * smooth(clamp((.42 - Math.abs(m)) / .05)), g = p - .2 * (hash(d, f, r ^ 20935) - .5), _ = m - .2 * (hash(d, f, r ^ 30881) - .5), y = clamp(1 - (Math.sqrt(g * g + _ * _) / .07) ** 2), b = y * y;
					s += (1 - s) * h, c += (1 - c) * h * b;
				}
				z = .55 + .2 * s + .12 * c + .1 * S, G = .24 + .6 * s + .05 * c + .02 * S, Z += .12 * (1 - s) - .03 * c, Q = .45 + .5 * s;
				break;
			}
			case `thatch`: {
				let t = o * 6, i = .5 + .5 * Math.cos(n * (fract(t) - .25) + .5 * noise(e, o, 3, 6, r ^ 7499)), a = noise(e, o, 80, 6, r ^ 16269), s = smooth(clamp((.14 - Math.abs(fract(t) - .73)) / .07));
				z = .3 + .32 * i + .18 * a + .1 * S - .12 * s, G = .32 + .36 * i + .22 * a - .3 * s, Z += .05 * (a - .5) + .05 * s, Q = .68 + .28 * i - .3 * s;
				break;
			}
			case `sandstone`: {
				let t = noise(e, o, 3, 5, r ^ 26941), i = o + .055 * (t - .5), s = .5 + .5 * Math.sin(8 * i * n + a), c = (.5 + .5 * Math.sin(19 * i * n + a)) ** 6, l = noise(e, o, 8, 3, r ^ 19735), u = smooth(clamp((R - .28) / .48)), d = (1 - R) ** 5;
				z = .22 + .35 * s + .2 * l + .18 * u - .2 * c, G = .32 + .16 * s - .09 * c + .24 * u - .1 * d, Z += .12 * (u - .5) + .05 * c, Q = .97 - .12 * c - .13 * d + .025 * u;
				break;
			}
			case `travertine`: {
				let t = e * 12, i = o * 18, s = Math.floor(t), c = Math.floor(i), l = 0;
				for (let e = -1; e <= 1; e++) for (let a = -1; a <= 1; a++) {
					let o = s + a, u = c + e, d = (o % 12 + 12) % 12, f = (u % 18 + 18) % 18, p = hash(d, f, r ^ 24211), m = (hash(d, f, r ^ 9169) - .5) * .36, h = Math.cos(m), g = Math.sin(m), _ = t - o - .2 - .6 * hash(d, f, r), v = i - u - .2 - .6 * hash(d, f, r ^ 31513), y = _ * h + v * g, b = v * h - _ * g, x = .42 + .36 * p, S = .11 + .13 * hash(d, f, r ^ 36657), w = smooth(clamp((1 - (y * y / (x * x) + b * b / (S * S) + .12 * Math.sin(9 * y + p * n) * Math.sin(13 * b))) / .65));
					l += w * (.65 + .35 * p);
				}
				let u = 1 - Math.exp(-1.8 * l), d = noise(e, o, 3, 3, r ^ 16855), f = .5 + .5 * Math.sin(n * (6 * o + .18 * d) + a);
				z = .65 + .12 * f + .09 * R - .48 * u, G = .62 + .05 * f + .04 * R - .3 * u, Z += .15 * u + .08 * (R - .5), Q = .98 - .42 * u;
				break;
			}
			case `pumice`: {
				let t = e * 26, n = o * 26, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = i + o, u = a + e, d = (l % 26 + 26) % 26, f = (u % 26 + 26) % 26, p = t - l - .15 - .7 * hash(d, f, r), m = n - u - .15 - .7 * hash(d, f, r ^ 25375), h = .24 + .2 * hash(d, f, r ^ 14521), g = (p * p + m * m) / (h * h), _ = clamp(1 - g), v = _ * _;
					s = Math.max(s, v), c = Math.max(c, 6 * g * v);
				}
				z = .65 + .12 * noise(e, o, 5, 5, r ^ 40007) + .08 * R - .57 * s + .05 * c, G = .72 - .58 * s + .08 * c + .03 * R, Z += .07 * s + .07 * (R - .5), Q = .98 - .52 * s + .01 * S;
				break;
			}
			case `parquet`: {
				let t = e * 4, a = o * 4, s = Math.floor(t), c = Math.floor(a), l = (s + c) % 2 == 0, u = fract(l ? t : a), d = fract(l ? a : t), f = Math.floor(d * 3), m = smooth(clamp((Math.min(u, 1 - u, fract(d * 3) / 3, (1 - fract(d * 3)) / 3) - .006) / .016)), h = hash(s * 3 + f, c, r), g = noise(e, o, 8, 8, r ^ 14105), _ = .5 + .5 * Math.sin(n * (d * 38 + .28 * Math.sin(n * u) + .18 * g) + h * n);
				z = .06 + m * (.25 + .32 * h + .22 * _ + .06 * S), G = m * (.76 + .045 * _ + .025 * S), Z = .78 + m * (i.roughness - .78 + .09 * _ + .04 * h), Q = .52 + .46 * m;
				break;
			}
			case `mosaic`: {
				let t = e * 16, n = o * 16, a = fract(t), s = fract(n), l = smooth(clamp((Math.min(a, 1 - a, s, 1 - s) - .018) / .042)), u = hash(Math.floor(t), Math.floor(n), r);
				z = .2 + l * (.08 + .56 * u + .1 * S), G = l * (.78 + .08 * u + .025 * S), Z = .76 + l * (i.roughness - .76 + .11 * u + .04 * S), Q = .6 + .39 * l, $ = 1 - l;
				break;
			}
			case `hexagontiles`: {
				let t = Math.sqrt(3), n = e * 5, a = o * 6 * t / 2, s = Math.floor(a / (t / 2)), c = 1 / 0, l = 0, u = 0, d = 0, f = 0;
				for (let e = -1; e <= 1; e++) {
					let r = s + e, i = (r % 2 + 2) % 2 * .5, o = Math.round(n - i);
					for (let e = -1; e <= 1; e++) {
						let s = o + e, p = n - s - i, m = a - r * t / 2, h = p * p + m * m;
						h < c && (c = h, l = p, u = m, d = (s % 5 + 5) % 5, f = (r % 6 + 6) % 6);
					}
				}
				let m = smooth(clamp((.5 - Math.max(Math.abs(l), Math.abs(l * .5 + u * t / 2), Math.abs(l * .5 - u * t / 2)) - .012) / .034)), h = hash(d, f, r);
				z = .2 + m * (.28 + .35 * h + .07 * S), G = m * (.8 + .045 * h + .02 * S), Z = .74 + m * (i.roughness - .74 + .1 * h + .04 * S), Q = .6 + .39 * m, $ = 1 - m;
				break;
			}
			case `knit`: {
				let t = e * 8, r = o * 8, i = Math.floor(t), s = Math.floor(r), c = 0;
				for (let e = -1; e <= 1; e += 2) {
					let n = t - i - .5, a = r - s - .84, o = e * .34, l = -.68, u = clamp((n * o + a * l) / (o * o + l * l)), d = n - u * o, f = a - u * l, m = smooth(clamp(1 - (d * d + f * f) / .0169));
					c += (1 - c) * m;
				}
				let l = .5 + .25 * Math.sin(n * (48 * e + 24 * o) + a) + .25 * Math.sin(n * (48 * e - 24 * o) - a);
				z = .12 + .64 * c + .1 * S + .07 * c * l, G = .08 + c * (.76 + .045 * l) + .025 * S, Z += .065 * (S - .5) + .035 * (1 - c), Q = .58 + .41 * c;
				break;
			}
			case `corduroy`: {
				let t = (.5 + .5 * Math.cos(n * e * 12)) ** .65, i = noise(e, o, 96, 96, r ^ 11121), a = noise(e, o, 12, 48, r ^ 31907);
				z = .12 + .57 * t + .16 * i + .08 * a, G = .07 + .79 * t + .035 * i + .025 * a, Z += .08 * (i - .5) + .035 * (1 - t), Q = .57 + .42 * t;
				break;
			}
			case `felt`: {
				let t = e * 20, i = o * 20, a = Math.floor(t), s = Math.floor(i), c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = a + o, u = s + e, d = (l % 20 + 20) % 20, f = (u % 20 + 20) % 20, p = t - l - .25 - .5 * hash(d, f, r), m = i - u - .25 - .5 * hash(d, f, r ^ 41845), h = hash(d, f, r ^ 27415) * n, g = Math.cos(h), _ = Math.sin(h), v = (p * g + m * _) / .6, y = (m * g - p * _) / .055, b = clamp(1 - v * v - y * y);
					c += (1 - c) * b * b;
				}
				z = .28 + .28 * S + .3 * c, G = .18 + .035 * S + .065 * c, Z += .065 * (S - .5) + .025 * c, Q = .96 + .025 * c + .01 * S;
				break;
			}
			case `wafflecloth`: {
				let t = smooth(clamp((Math.cos(n * e * 8) - .35) / .65)), i = smooth(clamp((Math.cos(n * o * 8) - .35) / .65)), s = t + i - t * i, c = .5 + .25 * Math.cos(n * e * 96 + a) + .25 * Math.cos(n * o * 96 - a), l = noise(e, o, 24, 24, r ^ 19059);
				z = .22 + .48 * s + .12 * c + .08 * l, G = .12 + .66 * s + .035 * c + .025 * l, Z += .04 * (l - .5) + .025 * (1 - s), Q = .65 + .32 * s + .02 * c;
				break;
			}
			case `cableknit`: {
				let t = fract(e * 4), i = o * 4, s = .22 * Math.sin(n * i), c = .5 + .5 * Math.cos(n * i), l = (t - .5 - s) / .115, u = (t - .5 + s) / .115, d = smooth(clamp(1 - l * l)), f = smooth(clamp(1 - u * u)), p = d + f - d * f, m = d * (.38 + .38 * c), h = f * (.76 - .38 * c), g = m + h - m * h, _ = smooth(clamp((Math.cos(n * t) - .5) / .5)), v = .5 + .5 * Math.cos(n * (o * 32 + .35 * Math.cos(n * t))), y = noise(e, o, 64, 64, r ^ 14249), b = .5 + .5 * Math.sin(n * (e * 96 + o * 48) + a);
				z = .13 + .55 * g + .13 * _ + .09 * y + .04 * p * b, G = .07 + g + .17 * _ * (.65 + .35 * v) + .02 * y + .015 * p * b, Z += .035 * (y - .5) + .025 * (1 - p), Q = .57 + .35 * p + .055 * _ + .015 * y;
				break;
			}
			case `quilting`: {
				let t = (e + o) * 6, i = (e - o) * 6, s = .5 - .5 * Math.cos(n * t), c = .5 - .5 * Math.cos(n * i), l = s * c, u = smooth(clamp(1 - s / .055)), d = smooth(clamp(1 - c / .055)), f = u + d - u * d, p = smooth(clamp((Math.cos(n * i * 8) - .2) / .8)), m = smooth(clamp((Math.cos(n * t * 8) - .2) / .8)), h = u * p + d * m - u * p * d * m, g = .5 + .25 * Math.cos(n * e * 96 + a) + .25 * Math.cos(n * o * 96 - a), _ = noise(e, o, 24, 24, r ^ 27441);
				z = .3 + .32 * l - .15 * f + .12 * h + .08 * _ + .06 * g, G = .13 + .67 * l - .065 * f + .035 * h + .02 * g + .015 * _, Z += .045 * (_ - .5) + .025 * f, Q = .88 + .1 * l - .18 * f + .025 * h;
				break;
			}
			case `roofshingles`: {
				let t = Math.floor(o * 6), n = fract(o * 6), i = e * 4 + t % 2 * .5, a = fract(i), s = smooth(clamp(Math.min(n, 1 - n) / .12)), c = smooth(clamp(Math.min(a, 1 - a) / .055)), l = (1 - c) * smooth(clamp((n - .32) / .16)) * s, u = s * c, d = hash(Math.floor(i) % 4, t, r ^ 25527), f = smooth(clamp((noise(e, o, 64, 64, r ^ 19765) - .2) / .6)), p = 1 - s;
				z = .24 + .32 * f + .2 * u * d - .15 * p - .14 * l, G = .2 + .38 * s - .2 * l + .13 * f + .05 * u * d, Z += .12 * (f - .5) + .04 * p + .03 * l, Q = .96 - .24 * p - .2 * l + .025 * f;
				break;
			}
			case `rooftiles`: {
				let t = fract(e * 6 + .5), i = fract(o * 5), a = .5 + .5 * Math.cos(n * e * 6), s = smooth(clamp(Math.min(i, 1 - i) / .13)), c = s * smooth(clamp(Math.min(t, 1 - t) / .12)), l = hash(Math.floor(e * 6 + .5) % 6, Math.floor(o * 5), r ^ 31297), u = noise(e, o, 24, 32, r ^ 23591), d = 1 - s;
				z = .26 + .24 * a + .23 * c * l + .14 * u - .14 * d, G = .16 + .65 * a - .1 * d + .035 * c * l + .012 * u, Z += .13 * (u - .5) + .05 * (1 - a) + .045 * d, Q = .76 + .22 * a - .14 * d + .015 * u;
				break;
			}
			case `stucco`: {
				let t = e * 28, n = o * 28, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = i + o, u = a + e, d = (l % 28 + 28) % 28, f = (u % 28 + 28) % 28, p = hash(d, f, r ^ 17337), m = t - l - .2 - .6 * hash(d, f, r), h = n - u - .2 - .6 * hash(d, f, r ^ 6083), g = .3 + .25 * p, _ = clamp(1 - (m * m + h * h * (.7 + p)) / (g * g)), v = _ * _;
					p < .28 ? c += (1 - c) * v : s += (1 - s) * v;
				}
				let l = noise(e, o, 5, 7, r ^ 21373);
				z = .52 + .15 * l + .19 * s - .24 * c + .08 * S, G = .27 + .16 * l + .43 * s - .22 * c + .06 * S, Z += .055 * s + .065 * c + .05 * (S - .5), Q = .96 - .25 * c - .075 * s + .02 * S;
				break;
			}
			case `lichen`: {
				let t = e * 7, i = o * 7, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let u = a + o, d = s + e, f = (u % 7 + 7) % 7, p = (d % 7 + 7) % 7, m = t - u - .25 - .5 * hash(f, p, r), h = i - d - .25 - .5 * hash(f, p, r ^ 29107), g = Math.atan2(h, m), _ = hash(f, p, r ^ 15449), v = (.38 + .16 * _) * (1 + .13 * Math.cos(5 * g + _ * n) + .09 * Math.sin(3 * g - _ * n)), y = smooth(clamp((1 - Math.hypot(m, h) / v) / .18));
					c += (1 - c) * y, l += y * (_ - .5);
				}
				let u = smooth(clamp((noise(e, o, 96, 96, r ^ 27171) - .58) / .25));
				z = .16 + .13 * S + .53 * c + .07 * Math.tanh(l) - .18 * c * u, G = .15 + .035 * S + c * (.48 - .17 * u), Z += .04 * (S - .5) + .035 * c * u, Q = .9 + .08 * c - .15 * c * u;
				break;
			}
			case `leaflitter`: {
				let t = e * 6, i = o * 6, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let d = a + o, f = s + e, p = (d % 6 + 6) % 6, m = (f % 6 + 6) % 6, h = t - d - .2 - .6 * hash(p, m, r), g = i - f - .2 - .6 * hash(p, m, r ^ 10679), _ = hash(p, m, r ^ 20273) * n, v = Math.cos(_), y = Math.sin(_), b = hash(p, m, r ^ 20905), x = (h * v + g * y) / (.64 + .1 * b), S = (g * v - h * y) / (.26 + .05 * b), C = smooth(clamp((1 - x * x - Math.sqrt(S * S + 1e-4)) / .18)), w = C * Math.exp(-S * S * 260);
					c += (1 - c) * C, u += (1 - u) * w, l += C * (b - .5);
				}
				z = .07 + .09 * S + .56 * c + .16 * Math.tanh(l) - .12 * u, G = .08 + .035 * S + .61 * c + .045 * u, Z += .07 * (S - .5) + .045 * (1 - c), Q = .53 + .44 * c;
				break;
			}
			case `endgrain`: {
				let t = fract(e - l + .5) - .5, i = fract(o - u + .5) - .5, s = Math.sin(Math.PI * t) / Math.PI, c = Math.sin(Math.PI * i) / Math.PI, d = Math.sqrt(s * s + c * c + 4e-4), f = noise(e, o, 5, 5, r ^ 31811), p = (.5 + .5 * Math.sin(n * (23 * d + .23 * f) + a)) ** 6, m = smooth(clamp((noise(e, o, 96, 96, r ^ 5607) - .62) / .23)), h = Math.hypot(t, i), g = smooth(clamp((h - .07) / .08)) * smooth(clamp((.43 - h) / .08)) * (.5 + .5 * Math.cos(7 * Math.atan2(i, t) + a)) ** 48;
				z = .76 - .37 * p - .2 * m - .24 * g + .08 * S, G = .49 - .07 * p - .16 * m - .22 * g + .025 * S, Z += .13 * m + .06 * p + .045 * (S - .5), Q = .99 - .17 * m - .22 * g;
				break;
			}
			case `acousticfoam`: {
				let t = fract(e * 4) - .5, n = fract(o * 4) - .5, i = Math.sqrt(t * t + 1e-4), a = Math.sqrt(n * n + 1e-4), c = clamp(1 - 2 * (.5 * (i + a + Math.sqrt((i - a) ** 2 + 4e-4)))), l = c < .1 ? c * c * 5 : c > .9 ? .9 - (1 - c) * (1 - c) * 5 : c - .05, u = hash(Math.floor(e * 4), Math.floor(o * 4), r ^ 14289), d = smooth(clamp((noise(e, o, 96, 96, r ^ 27417) - .42) / .46));
				z = .14 + .61 * l + .13 * S - .12 * d, G = .03 + l * (.88 + .07 * u) + .009 * S - .008 * d, Z += .065 * (S - .5) + .025 * d, Q = .43 + .54 * l + .025 * S - .025 * d;
				break;
			}
			case `closedcellfoam`: {
				let t = e * 28, n = o * 28, r = Math.floor(t), i = Math.floor(n), a = 0, s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = r + o, u = i + e, f = (l % 28 + 28) % 28, p = ((u % 28 + 28) % 28 * 28 + f) * 4, m = t - l - d[p], h = n - u - d[p + 1], g = clamp(1 - (m * m + h * h) * d[p + 2]), _ = g * g;
					a += (1 - a) * _, s += (1 - s) * _ * (1 - g) * 6.75, c += _ * (d[p + 3] - .5);
				}
				z = .49 + .18 * S - .13 * a + .08 * s + .1 * c, G = .48 + .035 * S - .17 * a + .055 * s, Z += .065 * (S - .5) + .025 * a, Q = .99 - .065 * a;
				break;
			}
			case `linoleum`: {
				let t = noise(e, o, 4, 5, r ^ 22811), i = .5 + .5 * Math.sin(n * (5 * e + 3 * o + 1.2 * t) + a), s = noise(e + .19 * t, o + .08 * i, 48, 8, r ^ 11635), c = smooth(clamp((s - .43) / .4));
				z = .24 + .25 * i + .38 * c + .08 * S, G = .45 + .025 * S + .015 * s, Z += .09 * (s - .5) + .045 * (S - .5), Q = .99 + .008 * S;
				break;
			}
			case `orangepeel`: {
				let t = e * g, n = o * _, r = Math.floor(t), i = Math.floor(n), a = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let c = r + o, l = i + e, u = (c % g + g) % g, d = ((l % _ + _) % _ * g + u) * 3, f = t - c - v[d], p = n - l - v[d + 1], m = .26 + .14 * v[d + 2], h = f * f + p * p, y = clamp(1 - h / (m * m)), b = clamp(1 - h / .36);
					a += (1 - a) * y * y, s += (1 - s) * b * b * (1 - b) * 6.75;
				}
				z = (.48 + .28 * S) * (1 - .35 * a) + .119 * a, G = (.46 + .025 * S + .045 * s) * (1 - a) + .22 * a, Z += .06 * (S - .5) + .035 * a, Q = 1 - .08 * a;
				break;
			}
			case `coconut`: {
				let t = e * g, n = o * _, r = Math.floor(t), i = Math.floor(n), a = 0, s = 0, c = .38 + .18 * S;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = r + o, u = i + e, d = (l % g + g) % g, f = ((u % _ + _) % _ * g + d) * 3, p = t - l - v[f], m = n - u - v[f + 1], h = v[f + 2], y = m / (.48 + .25 * h), b = (p + (h - .5) * .28 * m) / .12, x = clamp(1 - y * y - b * b), S = x * x;
					h < .24 ? (s += (1 - s) * S, c = c * (1 - S) + .15 * S) : (a += (1 - a) * S, c = c * (1 - S) + (.55 + .25 * h) * S);
				}
				z = c, G = (.42 + .055 * S + .18 * a) * (1 - s) + .3 * s, Z += .055 * (S - .5) + .025 * a, Q = (.96 + .025 * a) * (1 - s) + .86 * s;
				break;
			}
			case `watermelon`: {
				let t = noise(e, o, 4, 5, r ^ 20247), i = noise(e, o, 12, 8, r ^ 26531), c = smooth(clamp((.5 + .5 * Math.sin(n * (5 * e + .3 * t + .12 * i) + a) - .24) / .52)), l = smooth(clamp((noise(e, o, 96, 96, r ^ 23609) - .48) / .4)), u = smooth(clamp((noise(e, o, 80, 80, r ^ 11121) - .5) / .38));
				z = (.12 + .72 * c) * (1 - .2 * l) + .46 * .2 * l, G = (.48 + .025 * S) * (1 - .14 * u), Z += .055 * (S - .5) + .045 * u, Q = 1 - .035 * u;
				break;
			}
			case `limestone`: {
				let t = e * 24, i = o * 24, a = Math.floor(t), s = Math.floor(i), c = smooth(clamp((noise(e, o, 96, 96, r ^ 6615) - .49) / .38)), l = 0;
				z = .63 + .14 * S - .16 * c;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = a + r, c = s + e, u = (o % 24 + 24) % 24, d = ((c % 24 + 24) % 24 * 24 + u) * 7, f = t - o - y[d], p = i - c - y[d + 1], m = (f * y[d + 4] + p * y[d + 5]) / y[d + 2], h = (p * y[d + 4] - f * y[d + 5]) / (y[d + 2] * y[d + 3]), g = m * m + h * h, _ = smooth(clamp((1 - g) / .36)), v = y[d + 6], b = .5 + .5 * Math.cos(n * 1.5 * g), x = .5 + .24 * v + .16 * b;
					z = z * (1 - _) + x * _, l += (1 - l) * _;
				}
				G = .47 + .08 * l + .025 * S - .07 * c, Z += .06 * (S - .5) + .08 * c - .05 * l, Q = .98 - .12 * c + .015 * l;
				break;
			}
			case `breccia`: {
				let t = e * 6, n = o * 6, a = Math.floor(t), s = Math.floor(n), c = noise(e, o, 80, 80, r ^ 23841), l = 0;
				z = .56 + .16 * c, G = .33 + .035 * c, Z += .08 * c;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = a + r, c = s + e, u = (o % 6 + 6) % 6, d = ((c % 6 + 6) % 6 * 6 + u) * 18, f = t - o - b[d], p = n - c - b[d + 1], m = 1;
					for (let e = 0; e < 5; e++) {
						let t = d + 3 + e * 3, n = b[t + 2] - f * b[t] - p * b[t + 1];
						m *= smooth(clamp(n / .055));
					}
					let h = b[d + 2], g = .15 + .66 * h + .12 * S;
					z = z * (1 - m) + g * m, G = G * (1 - m) + (.54 + .1 * h + .025 * S) * m, Z = Z * (1 - m) + (i.roughness + .08 * (S - .5)) * m, l += (1 - l) * m;
				}
				Q = .81 + .17 * l + .015 * c;
				break;
			}
			case `gneiss`: {
				let t = noise(e, o, 4, 4, r ^ 27417), i = o + .28 * Math.sin(n * e + .8 * Math.sin(n * o) + a) + .06 * Math.sin(n * (2 * e - o) + a), s = n * 6 * i + 1.4 * (t - .5), c = smooth(clamp((.5 + .5 * Math.sin(s) - .18) / .64)), l = .5 + .5 * Math.sin(3 * s + .4 * t), d = smooth(clamp((noise(e, o, 96, 96, r ^ 15477) - .52) / .34));
				z = (.12 + .7 * c + .08 * l) * (1 - .3 * d) + .264 * d, G = .42 + .055 * c + .07 * d + .025 * S, Z += .08 * (S - .5) + .06 * (1 - c) - .05 * d, Q = .95 + .025 * c + .015 * d;
				break;
			}
			case `plywood`: {
				let t = noise(e, o, 4, 3, r ^ 17335), s = 3.2 * Math.cos(n * e + a) + 1.8 * Math.cos(n * o + .7 * a) + .45 * t, c = (.5 + .5 * Math.sin(n * s)) ** 5, l = .5 + .5 * Math.sin(n * (64 * e + .4 * t) + a);
				z = .67 + .1 * S - .32 * c + .035 * l, G = .48 + .025 * S - .045 * c + .015 * l, Z += .05 * c + .04 * (S - .5), Q = .99 - .045 * c;
				for (let t = 0; t < 2; t++) {
					let r = t * 3, a = fract(e - x[r] + .5) - .5, s = fract(o - x[r + 1] + .5) - .5, c = x[r + 2], l = a * a / (.0025 * c * c) + s * s / (.0169 * c * c), u = Math.max(0, 1 - l), d = u * u, f = .5 + .5 * Math.cos(n * 2 * l);
					z = z * (1 - d) + (.25 + .2 * f) * d, G = G * (1 - d) + (.44 + .025 * f) * d, Z = Z * (1 - d) + (i.roughness + .065 * f) * d, Q = Q * (1 - d) + (.95 + .025 * f) * d;
				}
				break;
			}
			case `osb`:
			case `chipboard`: {
				let t = e * T, n = o * T, r = Math.floor(t), a = Math.floor(n), s = 0;
				z = .24 + .12 * S, G = .35 + .025 * S, Z += .035 * S;
				for (let e = 0; e < 2; e++) for (let o = -1; o <= 1; o++) for (let c = -1; c <= 1; c++) {
					let l = r + c, u = a + o, d = (l % T + T) % T, f = (u % T + T) % T, p = ((e * T + f) * T + d) * 26, m = t - l - E[p], h = n - u - E[p + 1], g = (m * E[p + 2] + h * E[p + 3]) / E[p + 4], _ = (h * E[p + 2] - m * E[p + 3]) / E[p + 5], v = 1;
					for (let e = 0; e < 6; e++) {
						let t = p + 8 + e * 3;
						v *= smooth(clamp((E[t + 2] - g * E[t] - _ * E[t + 1]) / .12));
					}
					if (v === 0) continue;
					let y = E[p + 6], b = .5 + .5 * Math.sin(18 * _ + .65 * Math.sin(3 * g) + E[p + 7]);
					z = z * (1 - v) + (.34 + .44 * y + .1 * b) * v, G = G * (1 - v) + (.49 + .12 * y + .025 * b) * v, Z = Z * (1 - v) + (i.roughness - .045 + .07 * b) * v, s += (1 - s) * v;
				}
				Q = .83 + .15 * s + .015 * S;
				break;
			}
			case `crackleglaze`: {
				let t = e * 16 + .6 * (noise(e, o, 4, 4, r ^ 13741) - .5), n = o * 16 + .6 * (noise(e, o, 4, 4, r ^ 29123) - .5), i = Math.floor(t), a = Math.floor(n), s = 0;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = i + r, c = a + e, l = ((c % 16 + 16) % 16 * 16 + (o % 16 + 16) % 16) * 26, u = t - o - D[l], d = n - c - D[l + 1], f = 1;
					for (let e = 0; e < 8; e++) {
						let t = l + 2 + e * 3;
						f *= smooth(clamp((D[t + 2] - u * D[t] - d * D[t + 1]) / .024));
					}
					s += f;
				}
				let c = 1 - clamp(s);
				z = (.87 + .035 * S) * (1 - c) + .08 * c, G = .54 - .12 * c, Z += .14 * c + .015 * (S - .5), Q = 1 - .14 * c;
				break;
			}
			case `flutedceramic`: {
				let t = .5 + .5 * Math.cos(n * 8 * e + a), i = smooth(clamp((noise(e, o, 96, 96, r ^ 24361) - .65) / .28));
				z = .88 + .035 * S - .12 * i, G = .2 + .6 * t, Z += .035 * (1 - t) + .025 * i, Q = .92 + .08 * t;
				break;
			}
			case `encaustictiles`: {
				let t = fract(e * 4), n = fract(o * 4), r = smooth(clamp((Math.min(t, 1 - t) - .02) / .08)) * smooth(clamp((Math.min(n, 1 - n) - .02) / .08)), i = t - .5, a = n - .5, l = i * s + a * c, u = a * s - i * c, d = 0;
				for (let e = 0; e < 4; e++) {
					let t = e < 2 ? l : u, n = e < 2 ? u : l, r = (t - (e % 2 == 0 ? .16 : -.16)) / .19, i = n / .085, a = smooth(clamp((1 - r * r - i * i) / .22));
					d += (1 - d) * a;
				}
				let f = i * i + a * a, p = smooth(clamp((f - .135) / .008)) * (1 - smooth(clamp((f - .158) / .008)));
				z = .94 - .84 * (d + (1 - d) * p) + .012 * (S - .5), G = .18 + .4 * r, $ = 1 - r, Z += .12 * $ + .035 * (S - .5), Q = .77 + .23 * r;
				break;
			}
			case `breadcrust`: {
				let t = e * 7, n = o * 7, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = i + r, u = a + e, d = ((u % 7 + 7) % 7 * 7 + (o % 7 + 7) % 7) * 27, f = t - o - N[d], p = n - u - N[d + 1], m = 1, h = 1;
					for (let e = 0; e < 8; e++) {
						let t = d + 3 + e * 3, n = N[t + 2] - f * N[t] - p * N[t + 1];
						m *= smooth(clamp((n - .025) / .14)), h *= smooth(clamp((n - .025) / .5));
					}
					s += m, c += h, l += m * N[d + 2];
				}
				let u = noise(e, o, 19, 23, r ^ 18371);
				z = .06 + s * (.42 + .21 * u) + .2 * l, G = .12 + .42 * s + .26 * c + .012 * s * (S - .5), Z += .08 * (1 - s) + .035 * (u - .5), Q = .65 + .35 * s;
				break;
			}
			case `wafer`: {
				let t = fract(e * 12), n = fract(o * 12), i = smooth(clamp((Math.min(t, 1 - t) - .07) / .17)) * smooth(clamp((Math.min(n, 1 - n) - .07) / .17)), a = noise(e, o, 24, 24, r ^ 27953);
				z = .46 + .27 * i + .12 * a + .035 * S, G = .72 - .5 * i + .008 * (S - .5), Z += .06 * i + .02 * (a - .5), Q = 1 - .23 * i;
				break;
			}
			case `chocolate`: {
				let t = fract(e * 4), n = fract(o * 4), i = smooth(clamp((Math.min(t, 1 - t) - .035) / .105)) * smooth(clamp((Math.min(n, 1 - n) - .035) / .105)), a = noise(e, o, 4, 4, r ^ 12729);
				z = .18 + .46 * i + .065 * a + .008 * S, G = .14 + .65 * i, Z += .1 * (1 - i) + .008 * (a - .5), Q = .73 + .27 * i;
				break;
			}
			case `basketball`: {
				let t = e * P, r = o * P, i = Math.floor(t), a = Math.floor(r), s = 0;
				for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
					let o = i + n, c = a + e, l = ((c % P + P) % P * P + (o % P + P) % P) * ne, u = t - o - F[l], d = r - c - F[l + 1], f = smooth(clamp(1 - (u * u + d * d) * F[l + 2]));
					s += (1 - s) * f;
				}
				let c = Math.abs(Math.sin(n * (2 * e + .12 * Math.sin(n * o)))), l = Math.abs(Math.sin(n * (2 * o + .12 * Math.sin(n * e)))), u = smooth(clamp((c - .035) / .105)) * smooth(clamp((l - .035) / .105));
				z = .025 + u * (.64 + .24 * s + .025 * S), G = .12 + u * (.46 + .22 * s), Z += .045 * s - .08 * (1 - u), Q = .64 + .36 * u;
				break;
			}
			case `tennisball`: {
				let t = e * P, r = o * P, i = Math.floor(t), a = Math.floor(r), s = 0;
				for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
					let o = i + n, c = a + e, l = ((c % P + P) % P * P + (o % P + P) % P) * ne, u = t - o - F[l], d = r - c - F[l + 1], f = (u * F[l + 2] + d * F[l + 3]) / .48, p = (-u * F[l + 3] + d * F[l + 2]) / .065, m = smooth(clamp(1 - f * f - p * p));
					s += (1 - s) * m;
				}
				let l = 1 - smooth(clamp((Math.abs(Math.sin(n * (o - .19 * Math.sin(n * e) - .25))) - .025) / .075));
				z = (.16 + .1 * S + .06 * s) * (1 - l) + .97 * l, G = .54 + (1 - l) * (.065 * s + .018 * S) - .12 * l, Z -= .1 * l, Q = 1 - .12 * l;
				break;
			}
			case `golfball`: {
				let t = fract(e * 10 - re) - .5, n = fract(o * 10 - ie) - .5, r = clamp(1 - (t * t + n * n) / (.41 * .41)) ** 2;
				z = .96 - .12 * r, G = .8 - .6 * r, Z += .04 * r, Q = 1 - .2 * r;
				break;
			}
			case `boardformedconcrete`: {
				let t = Math.floor(o * 8), r = fract(o * 8), i = fract(e * 2 + t % 2 * .5), a = Math.floor(fract(e + t % 2 * .25) * 2), s = smooth(clamp(i / .018)) * smooth(clamp((1 - i) / .018)) * smooth(clamp(r / .055)) * smooth(clamp((1 - r) / .055)), c = I[t * 2 + a], l = ce(e, o + .002 * Math.sin(n * e + c * n)), u = oe(e, o);
				z = .39 + s * (.12 + .09 * c + .055 * l) + .025 * u, G = .18 + s * (.48 + .025 * c + .025 * l) + .008 * u, Z += .025 * l * s + .025 * u, Q = .75 + .25 * s;
				break;
			}
			case `ribbedconcrete`: {
				let t = fract(e * 12), n = Math.floor(e * 12), r = smooth(clamp((t - .12) / .18)) * smooth(clamp((.88 - t) / .18)), i = oe(e, o), a = se(e, o), s = I[n];
				z = .38 + .17 * r + .055 * a + .025 * i + .025 * s * r, G = .15 + .65 * r + .009 * i + .006 * a + .008 * s * r, Z += .035 * i + .02 * a, Q = .69 + .31 * r;
				break;
			}
			case `splitfaceblock`: {
				let t = Math.floor(o * 8), n = fract(o * 8), r = e * 4 + t % 2 * .5, i = fract(r), a = Math.floor(r) % 4, s = smooth(clamp((i - .04) / .08)) * smooth(clamp((.96 - i) / .08)) * smooth(clamp((n - .06) / .09)) * smooth(clamp((.94 - n) / .09)), c = I[t * 4 + a], l = se(e, o), u = oe(e, o), d = smooth(clamp((l - .22) / .56));
				z = .4 + s * (.04 + .28 * d + .1 * c + .06 * u), G = .14 + s * (.34 + .25 * d + .1 * c + .08 * u), Z -= .1 * (1 - s), Z += .035 * u * s, Q = .64 + s * (.29 + .07 * d), $ = 1 - s;
				break;
			}
			case `chainmail`: {
				let t = e * 6, n = o * 8, r = Math.floor(n), a = ue(e, o);
				z = .035 + .025 * a, G = .06 + .008 * a, Z = .88 + .04 * a, Q = .59;
				for (let e = -1; e <= 1; e++) {
					let o = r + e, s = (o + 8) % 8, c = s % 2 * .5, l = Math.floor(t - c);
					for (let e = -1; e <= 1; e++) {
						let r = l + e, u = (r + 6) % 6, d = t - r - c - .5, f = n - o - .5, m = clamp(1 - ((Math.sqrt(d * d + f * f) - .62) / .105) ** 2), h = smooth(m), g = L[s * 6 + u], _ = .44 + .26 * m + (s % 2 ? -1 : 1) * f * (.13 + .04 * g);
						z += h * (.63 + .13 * g + .04 * a - z), G += h * (_ - G), Z += h * (i.roughness + .04 * a - Z), Q += h * (.88 + .1 * m - Q), Oe += h * (1 - Oe);
					}
				}
				break;
			}
			case `rivetedmetal`: {
				let t = fract(e * 3), n = fract(o * 4), r = smooth(clamp(t / .045)) * smooth(clamp((1 - t) / .045)) * smooth(clamp(n / .045)) * smooth(clamp((1 - n) / .045)), i = Math.floor(o * 4) * 3 + Math.floor(e * 3), a = L[i], s = ue(e, o), c = 0;
				for (let e = 0; e < 2; e++) for (let r = 0; r < 2; r++) {
					let i = t - (r ? .88 : .12), a = n - (e ? .88 : .12), o = clamp(1 - (i * i + a * a) / .002704);
					c += o * o;
				}
				z = .28 + r * (.19 + .09 * a) + .13 * c + .03 * s, G = .09 + r * (.23 + .025 * a) + .57 * c + .004 * s, Z += .1 * (1 - r) - .09 * c + .025 * s, Q = .64 + .34 * r + .02 * c;
				break;
			}
			case `weldedmetal`: {
				let t = fract(e * 3 + .5) - .5, r = .5 + .5 * Math.cos(n * 32 * o + a), s = smooth(clamp(1 - (t / (.065 + .015 * r)) ** 2)), c = smooth(clamp(1 - (t / .15) ** 2)), l = ue(e, o);
				z = .52 + .04 * l - .16 * c + s * (.19 + .08 * r), G = .2 + .004 * l + s * (.46 + .15 * r), Z += .12 * c - .05 * s + .025 * l, Q = 1 - .15 * c * (1 - s);
				break;
			}
		}
		f.color = z, f.height = G * i.relief, f.roughness = clamp(Z), f.occlusion = Q, f.mortar = $, f.metallic = Oe;
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