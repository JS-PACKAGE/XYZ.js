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
	let M = t === `studdedrubber` ? /* @__PURE__ */ new Float64Array(36) : null;
	if (M) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) M[e * 6 + t] = hash(t, e, r ^ 19225);
	let N = t === `groovedrubber` ? /* @__PURE__ */ new Float64Array(12) : null;
	if (N) for (let e = 0; e < 12; e++) N[e] = hash(e, 0, r ^ 23607);
	let P = t === `recycledrubber` ? /* @__PURE__ */ new Float64Array(41472) : null;
	if (P) for (let e = 0; e < 48; e++) for (let t = 0; t < 48; t++) {
		let i = (e * 48 + t) * 18, a = n * hash(t, e, r ^ 32019), o = .48 + .17 * hash(t, e, r ^ 6583);
		P[i] = .2 + .6 * hash(t, e, r ^ 12969), P[i + 1] = .2 + .6 * hash(t, e, r ^ 25059), P[i + 2] = hash(t, e, r ^ 21441);
		for (let s = 0; s < 5; s++) {
			let c = i + 3 + s * 3, l = a + n * s / 5;
			P[c] = Math.cos(l), P[c + 1] = Math.sin(l), P[c + 2] = o * (.78 + .22 * hash(t, e, r ^ 9969 + s));
		}
	}
	let F = t === `breadcrust` ? /* @__PURE__ */ new Float64Array(1323) : null;
	if (F) for (let e = 0; e < 7; e++) for (let t = 0; t < 7; t++) {
		let n = (e * 7 + t) * 27, i = .36 + .28 * hash(t, e, r ^ 9399), a = .36 + .28 * hash(t, e, r ^ 22993);
		F[n] = i, F[n + 1] = a, F[n + 2] = hash(t, e, r ^ 29609);
		let o = n + 3;
		for (let n = -1; n <= 1; n++) for (let s = -1; s <= 1; s++) {
			if (s === 0 && n === 0) continue;
			let c = (t + s + 7) % 7, l = (e + n + 7) % 7, u = s + .36 + .28 * hash(c, l, r ^ 9399) - i, d = n + .36 + .28 * hash(c, l, r ^ 22993) - a, f = Math.sqrt(u * u + d * d);
			F[o++] = u / f, F[o++] = d / f, F[o++] = f / 2;
		}
	}
	let I = t === `basketball` ? 36 : 24, L = t === `basketball` ? 3 : 4, R = t === `basketball` || t === `tennisball` ? new Float64Array(I * I * L) : null;
	if (R) for (let e = 0; e < I; e++) for (let i = 0; i < I; i++) {
		let a = (e * I + i) * L;
		if (R[a] = .35 + .3 * hash(i, e, r ^ 6567), R[a + 1] = .35 + .3 * hash(i, e, r ^ 23587), t === `basketball`) {
			let t = .34 + .04 * hash(i, e, r ^ 29657);
			R[a + 2] = 1 / (t * t);
		} else {
			let t = n * hash(i, e, r ^ 14257);
			R[a + 2] = Math.cos(t), R[a + 3] = Math.sin(t);
		}
	}
	let z = t === `golfball` ? hash(0, 0, r ^ 10679) : 0, ee = t === `golfball` ? hash(0, 0, r ^ 25043) : 0, B = t === `boardformedconcrete` || t === `ribbedconcrete` || t === `splitfaceblock`, V = B ? cachedNoise(96, 96, r ^ 11633) : null, H = t === `ribbedconcrete` || t === `splitfaceblock` ? cachedNoise(24, 32, r ^ 27449) : null, te = t === `boardformedconcrete` ? cachedNoise(3, 128, r ^ 23059) : null, U = B ? new Float64Array(t === `boardformedconcrete` ? 16 : t === `ribbedconcrete` ? 12 : 32) : null;
	if (U) for (let e = 0; e < U.length; e++) U[e] = hash(e, 0, r ^ 18409);
	let W = t === `chainmail` || t === `rivetedmetal` || t === `weldedmetal`, G = W ? cachedNoise(48, 64, r ^ 27943) : null, K = t === `chainmail` ? /* @__PURE__ */ new Float64Array(48) : t === `rivetedmetal` ? /* @__PURE__ */ new Float64Array(12) : null;
	if (K) for (let e = 0; e < K.length; e++) K[e] = hash(e, 0, r ^ 14773);
	let ne = t === `stone` || t === `metal` || t === `marble`, re = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud` || t === `granite` || t === `slate` || t === `terrazzo` || t === `plaster` || t === `terracotta` || t === `cork` || t === `rubber` || t === `sandstone` || t === `travertine` || t === `pumice`;
	return (e, o, f) => {
		e = fract(e), o = fract(o);
		let p = ne ? noise(e, o, 4, 4, r) : 0, S = B || W ? 0 : noise(e, o, 32, 32, r ^ 2747636419), q = re ? noise(e, o, 64, 64, r ^ 2135587861) : 0, J = p, Y = p, X = i.roughness, Z = 1, Q = 0, $ = +(t === `metal` || t === `diamondplate` || t === `hammeredmetal` || t === `galvanized` || t === `corrugatedmetal` || t === `knurledmetal` || t === `engineturned` || t === `goldleaf` || t === `rivetedmetal` || t === `weldedmetal`);
		switch (t) {
			case `wood`: {
				let t = noise(e, o, 4, 2, r ^ 71), i = .5 + .5 * Math.sin(n * (12 * e + .65 * t) + a), s = (.5 + .5 * Math.sin(n * (40 * e + t) + a)) ** 12;
				J = clamp(.22 + .6 * i + .16 * S - .2 * s), Y = .65 * i + .15 * S - .18 * s, X += .15 * s + .08 * (S - .5), Z = 1 - .15 * s;
				break;
			}
			case `brick`: {
				let t = Math.floor(o * 8), n = fract(e * 4 + t % 2 * .5), i = fract(o * 8), s = smooth(clamp((Math.min(n, 1 - n, i * .5, (1 - i) * .5) - .014) / .045));
				J = .25 + .42 * hash(Math.floor(e * 4 + t % 2 * .5) % 4, t, r) + .2 * S, Y = s * (.75 + .15 * S + .1 * q), Q = 1 - s, X += .09 * Q + .05 * (S - .5), Z = .65 + .35 * s;
				break;
			}
			case `stone`: {
				let t = noise(e + .12 * p, o, 8, 8, r ^ 131);
				J = clamp(.1 + .65 * t + .3 * S), Y = .65 * t + .25 * S + .1 * q, X += .1 * (S - .5), Z = .8 + .2 * smooth(Y);
				break;
			}
			case `metal`: {
				let t = noise(e, o, 4, 64, r ^ 313), i = (.5 + .5 * Math.sin(n * o * 48 + a)) ** 16;
				J = .4 + .38 * t + .12 * p - .1 * i, Y = .7 * t - .15 * i, X += .18 * t + .08 * i, Z = 1 - .04 * i;
				break;
			}
			case `fabric`: {
				let t = e * 12, r = o * 12, i = Math.sin(Math.PI * fract(t)) ** 2, s = Math.sin(Math.PI * fract(r)) ** 2, c = (Math.floor(t) + Math.floor(r)) % 2 == 0, l = c ? i * (.6 + .4 * s) : s * (.6 + .4 * i), u = .5 + .5 * Math.sin(n * (c ? e : o) * 48 + a);
				J = .22 + .48 * l + .14 * S + .08 * u, Y = .8 * l + .06 * u + .08 * S, X += .04 * (S - .5), Z = .68 + .32 * l;
				break;
			}
			case `marble`: {
				let t = noise(e, o, 4, 4, r ^ 997), i = Math.exp(-Math.abs(Math.sin(n * (3 * e + 2 * o + .8 * t) + a)) * 16);
				J = clamp(.9 + .1 * p - .85 * i), Y = .3 * p - .2 * i + .05 * S, X += .1 * i + .04 * (S - .5), Z = 1 - .06 * i;
				break;
			}
			case `concrete`: {
				let t = fract(e * 3), n = fract(o * 3), a = 1 - smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .02) / .035)), s = hash(Math.floor(fract(e) * 40), Math.floor(fract(o) * 40), r);
				J = .28 + .5 * s * (1 - a) + .12 * S, Y = (1 - a) * (.65 + .25 * s) + .05 * S, X += .14 * a + .06 * (s - .5), Z = .62 + .38 * (1 - a);
				break;
			}
			case `tiles`: {
				let t = fract(e * 5), n = fract(o * 5), a = smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .018) / .028));
				J = .42 + .4 * hash(Math.floor(e * 5) % 5, Math.floor(o * 5) % 5, r) + .08 * S, Y = a * (.82 + .1 * S), Q = 1 - a, X += .42 * Q + .04 * (S - .5), Z = .58 + .42 * a;
				break;
			}
			case `leather`: {
				let n = smooth(clamp(1 - wrappedFeature(e, o, 14, r ^ 81) * 1.55));
				J = .24 + .52 * n + .12 * S, Y = .12 + .72 * n + .06 * S, X += .16 * (1 - n) + .04 * (S - .5), Z = .55 + .45 * n;
				break;
			}
			case `suede`: {
				let t = noise(e, o, 5, 7, r ^ 15639), n = noise(e + .012 * t, o + .004 * t, 96, 24, r ^ 24113), i = smooth(clamp((noise(e, o, 80, 80, r ^ 31331) - .57) / .35));
				J = .23 + .36 * t + .25 * n + .1 * S - .08 * i, Y = .35 + .075 * n + .025 * t - .045 * i, X += .075 * (n - .5) + .035 * (t - .5), Z = .985 - .035 * i + .01 * n;
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
				J = .13 + .4 * i + .2 * c + .1 * a + .04 * S, Y = .04 + .64 * i + .2 * a + .065 * s + .012 * S, X += .12 * (1 - i) - .045 * a + .045 * (S - .5), Z = .57 + .41 * i + .015 * a;
				break;
			}
			case `crocodile`: {
				let t = e * 4, i = o * 6, s = Math.floor(t), c = m[Math.floor(i) * 4 + s], l = (fract(t) - .5) / (.445 + .025 * c), u = (fract(i) - .5) / (.445 + .02 * c), d = clamp(1 - l * l * l * l - u * u * u * u), f = smooth(clamp(d / .36)), p = noise(e, o, 9, 11, r ^ 12115), h = (.5 + .5 * Math.sin(n * (19 * e + 13 * o + 1.7 * p) + a)) ** 12;
				J = .12 + f * (.37 + .22 * c + .1 * S - .12 * h), Y = .035 + f * (.64 + .17 * d * d + .035 * c - .065 * h), X += .13 * (1 - f) + f * (.055 * h + .04 * (S - .5)), Z = .53 + f * (.46 - .055 * h);
				break;
			}
			case `fishscales`:
			case `feathers`: {
				let r = e * O, i = o * k, a = Math.floor(i);
				J = .12 + .045 * S, Y = .23, Z = .76;
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
						J += h * (g - J), Y += h * (_ - Y), Z += h * (.98 - Z);
					}
				}
				X += .045 * (1 - Z) + .025 * (S - .5);
				break;
			}
			case `tortoiseshell`: {
				let t = e * 6, i = o * 6, a = Math.floor(t), s = Math.floor(i), c = noise(e, o, 19, 23, r ^ 18919);
				J = .045 + .025 * S, Y = .22, Z = .72;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = a + r, l = s + e, u = (o + 6) % 6, d = ((l + 6) % 6 * 6 + u) * 27, f = t - o - j[d], p = i - l - j[d + 1], m = 1, h = 1;
					for (let e = 0; e < 8; e++) {
						let t = d + 3 + e * 3, n = j[t + 2], r = n - f * j[t] - p * j[t + 1];
						if (m *= smooth(clamp((r - .018) / .085)), h *= smooth(clamp(r / n)), m === 0) break;
					}
					if (m === 0) continue;
					let g = j[d + 2], _ = Math.cos(n * (5 * h + .12 * g)), v = .28 + .25 * g + .22 * c + .09 * h + .045 * _;
					J += m * (v - J), Y += m * (.37 + .2 * h + .012 * _ * h - Y), Z += m * (.98 - Z);
				}
				X += .06 * (1 - Z) + .025 * (S - .5);
				break;
			}
			case `sand`: {
				let t = noise(e, o, 3, 3, r ^ 17), i = .5 + .5 * Math.sin(n * (o * 7 + .35 * t) + a), s = noise(e, o, 48, 48, r ^ 20973);
				J = .3 + .48 * i + .18 * s, Y = .72 * i + .22 * s, X += .06 * (s - .5), Z = .82 + .18 * i;
				break;
			}
			case `rust`: {
				let t = noise(e, o, 6, 6, r ^ 211), n = noise(e, o, 18, 18, r ^ 419), i = smooth(clamp((t * .7 + n * .3 - .32) / .28));
				J = i, Y = .25 + .45 * (1 - i) * n - .2 * i * t, X += .22 * i + .05 * (n - .5), Z = .7 + .3 * (1 - i), $ = 1 - i;
				break;
			}
			case `snow`: {
				let t = noise(e, o, 3, 3, r ^ 17), n = hash(Math.floor(fract(e) * 48), Math.floor(fract(o) * 48), r) ** 8;
				J = clamp(.22 + .68 * t + .1 * n), Y = .7 * t + .2 * n, X += .22 * n - .06 * t, Z = .88 + .12 * t;
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
				i ? (J = .06 + .58 * h + .1 * S + .06 * q, Y = .58 * m + .18 * S + .24 * q, X += .08 * (1 - d) + .1 * (q - .5), Z = .8 + .2 * d) : (J = .04 + .8 * h + .08 * q, Y = m * (.84 + .16 * S) + .025 * q, X += .13 * (1 - d) + .1 * (q - .5), Z = .42 + .58 * d);
				break;
			}
			case `cobblestone`: {
				let t = e + .012 * noise(e, o, 6, 8, r ^ 561), n = o + .009 * noise(e, o, 6, 8, r ^ 2323), i = Math.floor(fract(n) * 8), a = t * 6 + i % 2 * .5, s = fract(a), c = fract(n * 8), l = Math.abs(s - .5), u = Math.abs(c - .5) * .75, d = Math.max(0, l - .38), f = Math.max(0, u - .255), m = smooth(clamp((.12 - Math.sqrt(d * d + f * f) - .018) / .085)), h = hash((Math.floor(a) % 6 + 6) % 6, i, r), g = 1 - .65 * (l * l + u * u);
				J = .05 + m * (.25 + .48 * h + .12 * S) + .05 * q, Y = m * (.76 * g + .16 * S + .08 * q), X += .17 * (1 - m) + .1 * (q - .5), Z = .45 + .55 * m;
				break;
			}
			case `bark`: {
				let t = noise(e, o, 4, 6, r ^ 15127), n = noise(e + .035 * t, o, 18, 3, r ^ 33825), i = noise(e, o, 6, 18, r ^ 20883), a = smooth(clamp((n - .26) / .38)) * smooth(clamp((i - .18) / .22)), s = noise(e, o, 48, 12, r ^ 8571);
				J = .05 + a * (.43 + .33 * s + .13 * q), Y = a * (.58 + .3 * s + .12 * S), X += .08 * (1 - a) + .1 * (q - .5), Z = .42 + .58 * a;
				break;
			}
			case `moss`: {
				let t = noise(e, o, 4, 4, r ^ 7015), i = smooth(clamp(1 - wrappedFeature(fract(e + .025 * t), fract(o + .018 * t), 9, r ^ 25519) / .95)), a = noise(e, o, 18, 18, r ^ 37671), s = smooth(clamp((q - .25) / .5));
				J = .09 + .46 * i + .24 * a + .19 * s, Y = .65 * i + (.09 + .14 * i) * s + .12 * S, X += .06 * (s - .5) - .08 * (1 - i), Z = .52 + .36 * i + .12 * s;
				break;
			}
			case `mud`: {
				let t = noise(e, o, 4, 4, r ^ 29011), n = (e + .025 * t) * 7, i = (o + .025 * noise(e, o, 4, 4, r ^ 7993)) * 7, a = Math.floor(n), s = Math.floor(i), c = 4, l = 4;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let o = a + t, u = s + e, d = (o % 7 + 7) % 7, f = (u % 7 + 7) % 7, p = n - o - .3 - .4 * hash(d, f, r), m = i - u - .3 - .4 * hash(d, f, r ^ 40503), h = p * p + m * m;
					h < c ? (l = c, c = h) : h < l && (l = h);
				}
				let d = smooth(clamp((Math.sqrt(l) - Math.sqrt(c) - .025) / .13)), f = smooth(clamp((noise(e, o, 3, 3, r ^ 14561) - .25) / .5));
				J = .04 + d * (.52 - .24 * f + .17 * S) + .04 * q, Y = d * (.48 + .16 * (1 - c)) + (.07 * S + .03 * q) * (1 - .75 * f), X -= .38 * f, X += .1 * (1 - d) + .08 * (q - .5) * (1 - f), Z = .48 + .52 * d;
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
				J = clamp(.04 + .88 * d + .1 * (q - .5) - .07 * f), Y = .35 * d + .17 * q - .12 * f, X += .16 * (1 - d) + .06 * (q - .5), Z = .97 - .025 * f + .03 * q;
				break;
			}
			case `slate`: {
				let t = noise(e, o, 5, 4, r ^ 16743), n = noise(e + .025 * t, o + .018 * t, 3, 22, r ^ 29723) * 5, i = (Math.floor(n) + smooth(clamp((fract(n) - .35) / .3))) / 5, a = noise(e, o, 12, 5, r ^ 4955), s = (1 - Math.abs(2 * fract(n) - 1)) ** 8 * smooth(clamp((a - .18) / .35));
				J = .14 + .62 * i + .14 * q - .12 * s, Y = .72 * i + .1 * q - .18 * s, X += .1 * s + .1 * (q - .5), Z = .98 - .15 * s + .02 * q;
				break;
			}
			case `terrazzo`: {
				let t = e * 9, i = o * 9, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let d = a + o, f = s + e, p = (d % 9 + 9) % 9, m = (f % 9 + 9) % 9, h = hash(p, m, r ^ 37499), g = hash(p, m, r ^ 13341) * n, _ = Math.cos(g), v = Math.sin(g), y = t - d - .3 - .4 * hash(p, m, r), b = i - f - .3 - .4 * hash(p, m, r ^ 40503), x = y * _ + b * v, S = b * _ - y * v, C = .75 + .25 * hash(p, m, r ^ 8623), w = Math.max(Math.abs(x) * C, Math.abs(S), (x * .65 + S * .76) * 1.1, (-x * .83 + S * .55) * 1.15), E = smooth(clamp((.26 + .18 * h - w) / .025));
					c = Math.max(c, E), l += E * (.08 + .7 * hash(p, m, r ^ 22815)), u += E;
				}
				let d = l / Math.max(u, 1e-12);
				J = (.88 + .06 * S) * (1 - c) + c * d, Y = .15 + .06 * c + .015 * S + .025 * q, X += .055 * (1 - c) - .03 * c * d + .04 * (q - .5), Z = .98 + .015 * c + .005 * q;
				break;
			}
			case `denim`: {
				let t = e * 24, i = o * 24, s = .5 + .5 * Math.cos(n * t), c = .5 + .5 * Math.cos(n * i), l = 1 - smooth(clamp((Math.abs(Math.sin(Math.PI * (t - i) / 4)) - .24) / .22)), u = .5 + .5 * Math.sin(n * (96 * e + .12 * S) + a), d = .5 + .5 * Math.sin(n * (96 * o + .12 * S) + a), f = u * (1 - l) + d * l, p = s * (1 - l) + c * l, m = noise(e, o, 24, 4, r ^ 27953);
				J = .12 + .22 * p + .34 * l + .1 * f + .12 * m, Y = .42 * p + .24 * (1 - l) + .06 * f + .08 * m, X += .06 * (S - .5) + .04 * (1 - p), Z = .78 + .18 * p + .04 * f;
				break;
			}
			case `herringbone`: {
				let t = 32 * e, i = 32 * o, s = Math.acos(.995 * Math.cos(n * 2 * e)) / Math.PI, c = smooth(clamp((.5 + .5 * Math.cos(n * (2 * s - 8 * o) + a) - .2) / .6)), l = .5 + .5 * Math.cos(n * t), u = .5 + .5 * Math.cos(n * i), d = l * (1 - c) + u * c, f = (.5 + .5 * Math.sin(n * 128 * e + a)) * (1 - c) + (.5 + .5 * Math.sin(n * 128 * o - a)) * c, p = noise(e, o, 16, 8, r ^ 15385);
				J = .17 + .31 * c + .26 * d + .1 * f + .09 * p, Y = .25 + .24 * d + .07 * c + .035 * f + .025 * p, X += .055 * (S - .5) + .035 * (1 - d), Z = .84 + .12 * d + .025 * f;
				break;
			}
			case `tweed`: {
				let t = 20 * e, i = 20 * o, s = smooth(clamp((Math.cos(n * t) + .45) / 1.25)), c = smooth(clamp((Math.cos(n * i) + .45) / 1.25)), l = smooth(clamp(.5 + .85 * Math.cos(Math.PI * (t + i)))), u = s * (1 - c + c * l), d = c * (1 - s + s * (1 - l)), f = u + d, p = u * noise(e, o, 20, 4, r ^ 15127) + d * noise(e, o, 4, 20, r ^ 28201), m = u * (.5 + .5 * Math.sin(n * (80 * e + .15 * S) + a)) + d * (.5 + .5 * Math.sin(n * (80 * o + .15 * S) - a)), h = e * 24, g = o * 24, _ = Math.floor(h), v = Math.floor(g), y = 0, b = .12 + .29 * f + .34 * p + .12 * m;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = _ + t, i = v + e, a = (n % 24 + 24) % 24, o = (i % 24 + 24) % 24, s = hash(a, o, r ^ 11635), c = h - n - .25 - .5 * hash(a, o, r), l = g - i - .25 - .5 * hash(a, o, r ^ 23089), u = (s < .5 ? 0 : Math.PI / 2) + (s - .5) * .7, d = Math.cos(u), f = Math.sin(u), p = (c * d + l * f) / (.18 + .2 * s), m = (l * d - c * f) / .075, x = clamp(1 - p * p - m * m), S = x * x;
					y += S, b += S * (.18 + .64 * hash(a, o, r ^ 32537) - b);
				}
				J = b, Y = .2 + .28 * f + .08 * s * c + .05 * m + .055 * y, X += .05 * (S - .5) + .025 * y, Z = .77 + .19 * f + .025 * m;
				break;
			}
			case `seersucker`: {
				let t = smooth(clamp((Math.cos(n * 4 * e) + .25) / .75)), i = .5 + .5 * Math.cos(n * 48 * e), s = .5 + .5 * Math.cos(n * 48 * o), c = .5 + .5 * Math.cos(Math.PI * 48 * (e + o)), l = i * c + s * (1 - c), u = .5 + .25 * Math.sin(n * 144 * e + a) + .25 * Math.sin(n * 144 * o - a), d = noise(e, o, 4, 4, r ^ 19513), f = .5 + .5 * Math.sin(n * (12 * o + .22 * Math.sin(n * 4 * e) + .3 * d) + a);
				J = .71 - .39 * t + .12 * l + .055 * u + .04 * t * f, Y = .22 + .035 * l + .008 * u + t * (.08 + .2 * f), X += .045 * (S - .5) + .025 * t * (1 - f), Z = .96 - .07 * t * (1 - f) + .02 * l;
				break;
			}
			case `burlap`: {
				let t = e * 10, r = o * 10, i = smooth(clamp((Math.cos(n * t) + .35) / 1.1)), s = smooth(clamp((Math.cos(n * r) + .35) / 1.1)), c = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t + r)))), l = i * (1 - s + s * c), u = s * (1 - i + i * (1 - c)), d = l + u, f = .5 + .5 * Math.sin(n * (50 * e + .14 * S) + a), p = .5 + .5 * Math.sin(n * (50 * o + .14 * S) + a), m = l * f + u * p, h = i * s;
				J = .04 + .65 * d + .14 * m + .1 * S * d, Y = .58 * d + .2 * h + .08 * m + .04 * S, X += .05 * (S - .5) + .025 * (1 - d), Z = .42 + .54 * d + .04 * m;
				break;
			}
			case `carpet`: {
				let t = e * 24, i = o * 24, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let f = a + o, p = s + e, m = (f % 24 + 24) % 24, h = (p % 24 + 24) % 24, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), y = clamp(1 - (g * g + _ * _)) ** 3, b = hash(m, h, r ^ 10571), x = hash(m, h, r ^ 26655) * n, S = (.5 + .5 * Math.sin(n * 3 * (g * Math.cos(x) + _ * Math.sin(x)) + b * n)) ** 4;
					c += y, l += y * b, u += y * S, d = Math.max(d, y * (.75 + .25 * b));
				}
				let f = 1 / Math.max(c, 1e-12), p = l * f, m = u * f;
				J = .19 + .4 * p + .2 * d + .13 * m + .08 * S, Y = .3 + .38 * d + .12 * m + .1 * S, X += .04 * (S - .5) - .035 * m, Z = .7 + .22 * Math.sqrt(d) + .06 * m;
				break;
			}
			case `plaster`: {
				let t = noise(e, o, 3, 3, r ^ 14241), i = (.5 + .5 * Math.sin(n * (3 * e + 2 * o + .7 * t) + a)) ** 10, s = noise(e, o, 18, 5, r ^ 21721), c = smooth(clamp((.32 - q) / .23));
				J = .61 + .2 * t + .08 * s + .07 * i - .12 * c, Y = .22 + .28 * t + .18 * i + .08 * s - .14 * c, X += .1 * (q - .5) - .065 * i + .045 * c, Z = .98 - .1 * c - .025 * i;
				break;
			}
			case `terracotta`: {
				let t = noise(e, o, 5, 5, r ^ 14871), n = noise(e + .04 * t, o, 12, 9, r ^ 32035), a = 1 - smooth(clamp((wrappedFeature(e, o, 28, r ^ 18541) - .04) / .19)), s = smooth(clamp((t - .5) / .3));
				J = .37 + .46 * n + .15 * S - .18 * s - .17 * a, Y = .35 + .14 * S + .12 * q - .3 * a, X += .1 * (q - .5) + .07 * a - .04 * s, Z = .97 - .22 * a + .025 * q;
				break;
			}
			case `cork`: {
				let t = e * 14, i = o * 14, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let f = a + o, p = s + e, m = (f % 14 + 14) % 14, h = (p % 14 + 14) % 14, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), v = n * hash(m, h, r ^ 19745), y = g * Math.cos(v) + _ * Math.sin(v), b = _ * Math.cos(v) - g * Math.sin(v), S = clamp(1 - (.9 * y * y + 1.3 * b * b) / 1.21) ** 8, C = hash(m, h, r ^ 5931), w = (.5 + .5 * Math.sin(n * (5 * b + .3 * y) + n * C)) ** 12;
					c += S, l += S * C, d += S * w, u = Math.max(u, S);
				}
				let f = 1 / Math.max(c, 1e-12), p = l * f, m = d * f, h = 1 - smooth(clamp((u * f - .48) / .4));
				J = .31 + .57 * p + .12 * S - .22 * h - .09 * m, Y = .4 + .16 * p + .07 * q - .2 * h - .07 * m, X += .07 * (q - .5) + .045 * h - .025 * p, Z = .97 - .18 * h - .08 * m;
				break;
			}
			case `studdedrubber`: {
				let t = e * 6, n = o * 6, a = fract(t) - .5, s = fract(n) - .5, l = 1 - smooth(clamp((Math.sqrt(a * a + s * s) - .24) / .12)), u = M[Math.floor(n) * 6 + Math.floor(t)], d = noise(e, o, 144, 144, r ^ 18867);
				J = .24 + .16 * l + .06 * l * u + .05 * d, Y = .16 + .66 * l + .002 * d, X = i.roughness + .04 * (d - .5), Z = .84 + .16 * l;
				break;
			}
			case `groovedrubber`: {
				let t = e * 12, a = 1 - smooth(clamp((Math.abs(fract(t) - .5) - .32) / .13)), s = N[Math.floor(t)], c = noise(e, o, 144, 144, r ^ 28193);
				J = .18 + .29 * a + .04 * a * s + .035 * c, Y = .15 + .7 * a + .0015 * c, X = i.roughness + .035 * (c - .5), Z = .7 + .3 * a;
				break;
			}
			case `recycledrubber`: {
				let t = e * 48, n = o * 48, a = Math.floor(t), s = Math.floor(n), c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let i = a + r, o = s + e, u = ((o + 48) % 48 * 48 + (i + 48) % 48) * 18, d = t - i - P[u], f = n - o - P[u + 1], p = 1;
					for (let e = 0; e < 5; e++) {
						let t = u + 3 + e * 3, n = P[t + 2] - d * P[t] - f * P[t + 1];
						p *= smooth(clamp(n / .14));
					}
					c += p, l += p * P[u + 2];
				}
				let u = 1 - Math.exp(-2 * c), d = noise(e, o, 144, 144, r ^ 15239);
				J = .035 + .59 * u + .22 * l / (1 + c), Y = .25 + .18 * u + .002 * d, X = i.roughness - .06 * u + .02 * d, Z = .83 + .17 * u;
				break;
			}
			case `rubber`: {
				let n = 1 - smooth(clamp((wrappedFeature(e, o, 44, r ^ 36435) - .08) / .55));
				J = .19 + .38 * n + .19 * q + .1 * S, Y = .19 + .49 * n + .15 * q + .06 * S, X += .12 * (q - .5) - .045 * n, Z = .9 + .08 * n + .02 * q;
				break;
			}
			case `carbonfiber`: {
				let t = 12 * (e + o), r = 12 * (o - e), i = .5 + .5 * Math.cos(n * t), s = .5 + .5 * Math.cos(n * r), c = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t - r) / 2))), l = .5 + .5 * Math.sin(n * (4 * t + .08 * S) + a), u = .5 + .5 * Math.sin(n * (4 * r + .08 * S) + a), d = i * c + s * (1 - c), f = l * c + u * (1 - c);
				J = .12 + .46 * d + .2 * f + .12 * S, Y = .25 + .37 * d + .055 * f + .04 * S, X += .065 * (S - .5) + .045 * (1 - d), Z = .88 + .1 * d + .02 * f;
				break;
			}
			case `diamondplate`: {
				let t = e * 8, n = o * 8, i = fract(t) - .5, a = fract(n) - .5, s = (Math.floor(t) + Math.floor(n)) % 2 == 0 ? 1 : -1, c = (i + s * a) * Math.SQRT1_2, l = (a - s * i) * Math.SQRT1_2, d = smooth(clamp((1 - (Math.abs(c) / .48 + Math.abs(l) / .14)) / .24)), f = noise(e, o, 4, 64, r ^ 13793);
				J = .35 + .25 * f + .29 * d + .07 * S, Y = .08 + .78 * d + .025 * f, X += .14 * (f - .5) - .075 * d, Z = .94 + .05 * d + .01 * S;
				break;
			}
			case `knurledmetal`: {
				let t = smooth(.5 - .5 * Math.cos(n * 24 * (e + o))) * smooth(.5 - .5 * Math.cos(n * 24 * (e - o)));
				J = .29 + .48 * t + .16 * S, Y = .12 + .72 * t + .025 * S, X += .1 * (S - .5) + .07 * (1 - t), Z = .85 + .14 * t;
				break;
			}
			case `engineturned`: {
				let t = e * 6, r = o * 6, i = Math.floor(t), a = Math.floor(r), s = 0, c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let u = i + o, d = a + e, f = (u % 6 + 6) % 6, p = (d % 6 + 6) % 6, m = t - u - .25 - p % 2 * .5, g = r - d - .5, _ = m * m + g * g, v = Math.max(0, 1 - _ / .9025), y = v * v, b = (p * 6 + f) * 2, x = h[b], S = .5 + .5 * Math.cos(n * (10 * _ + x + .18 * m * g));
					s += y, c += y * S, l += y * h[b + 1];
				}
				c /= s, l /= s, J = .35 + .34 * l + .22 * c + .04 * S, Y = .44 + .07 * c + .025 * S, X += .18 * (c - .5) + .12 * (l - .5), Z = .98 + .015 * c;
				break;
			}
			case `goldleaf`: {
				let t = noise(e, o, 4, 5, r ^ 19843), i = e + .035 * Math.sin(n * o * 3 + a), s = o + .03 * Math.sin(n * e * 4 + a), c = noise(i, s, 4, 5, r ^ 7769), l = smooth(clamp((Math.cos(n * 4 * i) - .92) / .08)), u = smooth(clamp((Math.cos(n * 5 * s) - .92) / .08)), d = l + (1 - l) * u, f = (.5 + .5 * Math.cos(n * (18 * e + 7 * o + 1.7 * t) + a)) ** 8, p = (.5 + .5 * Math.cos(n * (5 * e - 21 * o + 1.3 * c) - a)) ** 10, m = .6 * f + .4 * p;
				J = .4 + .3 * c + .19 * m - .1 * d, Y = .36 + .34 * m + .065 * d + .04 * S, X += .12 * (c - .5) + .11 * m + .025 * d, Z = .99 - .065 * m - .025 * d;
				break;
			}
			case `paper`: {
				let t = noise(e, o, 3, 5, r ^ 33207), i = noise(e, o, 48, 48, r ^ 22483), a = e * 24, s = o * 24, c = Math.floor(a), l = Math.floor(s), u = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let i = c + t, o = l + e, d = (i % 24 + 24) % 24, f = (o % 24 + 24) % 24, p = a - i - .35 - .3 * hash(d, f, r), m = s - o - .35 - .3 * hash(d, f, r ^ 6463), h = n * hash(d, f, r ^ 29409), g = p * Math.cos(h) + m * Math.sin(h), _ = m * Math.cos(h) - p * Math.sin(h), v = .42 + .28 * hash(d, f, r ^ 23337), b = clamp(1 - (g * g / (v * v) + _ * _ / .0064)) ** 2;
					u = Math.max(u, b);
				}
				J = .62 + .24 * t + .1 * i - .2 * u, Y = .22 + .12 * t + .22 * i + .3 * u, X += .08 * (i - .5) + .04 * u, Z = .98 - .07 * u - .035 * (1 - i);
				break;
			}
			case `reedmat`: {
				let t = e * 16, r = Math.floor(t), i = (fract(t) - .5) / .46, s = smooth(clamp(1 - i * i)), c = C[r * 2], l = C[r * 2 + 1], u = .5 + .5 * Math.sin(n * t * 7 + .2 * Math.sin(n * o * 3) + l), d = smooth(clamp(1 - (1 - Math.cos(n * o * 4)) / .055)), f = .5 + .5 * Math.cos(n * e * 96 + a);
				J = .15 + s * (.38 + .14 * c + .09 * u) + d * (.12 + .04 * f), Y = .1 + s * (.46 + .055 * c + .018 * u) + d * (.24 + .015 * f), X += .06 * (1 - s) - .035 * s * u + .025 * d, Z = .56 + .32 * s + .07 * d;
				break;
			}
			case `rope`: {
				let t = e * 6, r = Math.floor(t), i = fract(t) - .5, a = smooth(clamp(1 - (i / .48) ** 2)), s = C[r * 2], c = C[r * 2 + 1], l = n * (3 * i - 6 * o) + c, u = .5 + .5 * Math.cos(l), d = .5 + .5 * Math.cos(l * 9 + .15 * Math.sin(n * o * 2));
				J = .13 + a * (.3 + .14 * s + .23 * u + .06 * d), Y = .08 + a * (.34 + .32 * u + .018 * d), X += .065 * (1 - a) + a * (.025 - .045 * d), Z = .43 + a * (.35 + .17 * u);
				break;
			}
			case `straw`: {
				let t = e * 8, n = o * 8, r = Math.floor(t), a = Math.floor(n);
				J = .17 + .07 * S, Y = .15 + .015 * S, Z = .55 + .035 * S;
				for (let e = 0; e < 3; e++) for (let o = -1; o <= 1; o++) for (let s = -1; s <= 1; s++) {
					let c = r + s, l = a + o, u = ((e * 8 + (l % 8 + 8) % 8) * 8 + (c % 8 + 8) % 8) * 9, d = t - c - w[u], f = n - l - w[u + 1], p = (d * w[u + 2] + f * w[u + 3]) / w[u + 4], m = (f * w[u + 2] - d * w[u + 3]) / w[u + 5], h = smooth(clamp((1 - p * p) / .24)) * smooth(clamp(1 - m * m));
					if (h === 0) continue;
					let g = w[u + 6], _ = .5 + .5 * Math.cos(12 * m + w[u + 7]), v = w[u + 8] > .6 ? smooth(clamp(1 - ((p - .2) / .065) ** 2)) : 0;
					J = J * (1 - h) + h * (.48 + .26 * g + .07 * _ - .13 * v), Y = Y * (1 - h) + h * (.51 + .06 * e + .04 * g + .018 * _ + .055 * v), X = X * (1 - h) + h * (i.roughness - .04 * _ + .025 * v), Z = Z * (1 - h) + h * (.91 + .045 * _);
				}
				break;
			}
			case `wicker`: {
				let t = e * 6, i = o * 6, a = .5 + .5 * Math.cos(n * t), s = .5 + .5 * Math.cos(n * i), c = smooth(clamp((Math.cos(n * t) + .92) / .3)), l = smooth(clamp((Math.cos(n * i) + .92) / .3)), u = smooth(clamp(.5 + 1.4 * Math.cos(Math.PI * t) * Math.cos(Math.PI * i))), d = c * (1 - l + l * u), f = l * (1 - c + c * (1 - u)), p = d + f, m = noise(e, o, 72, 4, r ^ 28465), h = noise(e, o, 4, 72, r ^ 10903), g = d * m + f * h, _ = d * a + f * s;
				J = .08 + .5 * p + .16 * _ + .18 * g, Y = .04 + .48 * p + .32 * _ + .045 * g, X += .1 * (S - .5) + .1 * (1 - p) - .04 * g, Z = .34 + .54 * p + .1 * _;
				break;
			}
			case `bamboo`: {
				let t = noise(e, o, 64, 4, r ^ 19313), i = noise(e, o, 4, 3, r ^ 26909), s = .5 + .5 * Math.sin(n * (48 * e + .22 * i) + a), c = noise(e, 0, 4, 1, r ^ 10453), l = 1 - Math.cos(n * (3 * o + .65 * c + .07 * Math.sin(n * 4 * e)) + a), u = 1 - smooth(clamp(l / .16)), d = 1 - smooth(clamp(l / .42));
				J = .46 + .23 * t + .16 * s + .08 * S - .34 * u, Y = .3 + .14 * t + .12 * s + .16 * d - .1 * u, X += .12 * u + .1 * (t - .5) - .035 * s, Z = .99 - .14 * u - .025 * (1 - t);
				break;
			}
			case `hammeredmetal`: {
				let t = e * 12, n = o * 12, i = Math.floor(t), a = Math.floor(n), s = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let c = i + o, l = a + e, u = (c % 12 + 12) % 12, d = (l % 12 + 12) % 12, f = t - c - .35 - .3 * hash(u, d, r), p = n - l - .35 - .3 * hash(u, d, r ^ 29339), m = .85 + .25 * hash(u, d, r ^ 6461), h = clamp(1 - (f * f + p * p) / (m * m));
					s += h * h * (.7 + .3 * hash(u, d, r ^ 23063));
				}
				let c = 1 - Math.exp(-1.6 * s), l = noise(e, o, 4, 4, r ^ 20001);
				J = .72 - .32 * c + .14 * l + .045 * S, Y = .85 - .7 * c + .008 * S, X += .1 * (l - .5) + .09 * c, Z = .99 - .12 * c;
				break;
			}
			case `galvanized`: {
				let t = e * 10, i = o * 10, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let d = a + o, f = s + e, p = (d % 10 + 10) % 10, m = (f % 10 + 10) % 10, h = t - d - .35 - .3 * hash(p, m, r), g = i - f - .35 - .3 * hash(p, m, r ^ 15225), _ = n * hash(p, m, r ^ 22435), v = h * Math.cos(_) + g * Math.sin(_), y = g * Math.cos(_) - h * Math.sin(_), b = clamp(1 - (h * h + g * g) / 1.21) ** 8, x = hash(p, m, r ^ 18897), S = .5 + .5 * Math.cos(n * (3 * y + 1.5 * Math.abs(v)));
					c += b, l += b * x, u += b * S;
				}
				let d = 1 / Math.max(c, 1e-12), f = l * d, p = u * d;
				J = .18 + .65 * f + .12 * p + .035 * S, Y = .3 + .18 * f + .035 * p + .015 * S, X += .24 * (f - .5) + .045 * (p - .5), Z = .98 + .02 * f;
				break;
			}
			case `corrugatedmetal`: {
				let t = .5 + .5 * Math.cos(n * 8 * e + a), i = noise(e, o, 64, 4, r ^ 8043), s = (.5 + .5 * Math.sin(n * 48 * e + a)) ** 12;
				J = .5 + .2 * t + .16 * i - .06 * s, Y = .1 + .8 * t + .004 * i - .002 * s, X += .13 * (i - .5) + .06 * s, Z = .91 + .08 * t;
				break;
			}
			case `sandstone`: {
				let t = noise(e, o, 3, 5, r ^ 26941), i = o + .055 * (t - .5), s = .5 + .5 * Math.sin(8 * i * n + a), c = (.5 + .5 * Math.sin(19 * i * n + a)) ** 6, l = noise(e, o, 8, 3, r ^ 19735), u = smooth(clamp((q - .28) / .48)), d = (1 - q) ** 5;
				J = .22 + .35 * s + .2 * l + .18 * u - .2 * c, Y = .32 + .16 * s - .09 * c + .24 * u - .1 * d, X += .12 * (u - .5) + .05 * c, Z = .97 - .12 * c - .13 * d + .025 * u;
				break;
			}
			case `travertine`: {
				let t = e * 12, i = o * 18, s = Math.floor(t), c = Math.floor(i), l = 0;
				for (let e = -1; e <= 1; e++) for (let a = -1; a <= 1; a++) {
					let o = s + a, u = c + e, d = (o % 12 + 12) % 12, f = (u % 18 + 18) % 18, p = hash(d, f, r ^ 24211), m = (hash(d, f, r ^ 9169) - .5) * .36, h = Math.cos(m), g = Math.sin(m), _ = t - o - .2 - .6 * hash(d, f, r), v = i - u - .2 - .6 * hash(d, f, r ^ 31513), y = _ * h + v * g, b = v * h - _ * g, x = .42 + .36 * p, S = .11 + .13 * hash(d, f, r ^ 36657), w = smooth(clamp((1 - (y * y / (x * x) + b * b / (S * S) + .12 * Math.sin(9 * y + p * n) * Math.sin(13 * b))) / .65));
					l += w * (.65 + .35 * p);
				}
				let u = 1 - Math.exp(-1.8 * l), d = noise(e, o, 3, 3, r ^ 16855), f = .5 + .5 * Math.sin(n * (6 * o + .18 * d) + a);
				J = .65 + .12 * f + .09 * q - .48 * u, Y = .62 + .05 * f + .04 * q - .3 * u, X += .15 * u + .08 * (q - .5), Z = .98 - .42 * u;
				break;
			}
			case `pumice`: {
				let t = e * 26, n = o * 26, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = i + o, u = a + e, d = (l % 26 + 26) % 26, f = (u % 26 + 26) % 26, p = t - l - .15 - .7 * hash(d, f, r), m = n - u - .15 - .7 * hash(d, f, r ^ 25375), h = .24 + .2 * hash(d, f, r ^ 14521), g = (p * p + m * m) / (h * h), _ = clamp(1 - g), v = _ * _;
					s = Math.max(s, v), c = Math.max(c, 6 * g * v);
				}
				J = .65 + .12 * noise(e, o, 5, 5, r ^ 40007) + .08 * q - .57 * s + .05 * c, Y = .72 - .58 * s + .08 * c + .03 * q, X += .07 * s + .07 * (q - .5), Z = .98 - .52 * s + .01 * S;
				break;
			}
			case `parquet`: {
				let t = e * 4, a = o * 4, s = Math.floor(t), c = Math.floor(a), l = (s + c) % 2 == 0, u = fract(l ? t : a), d = fract(l ? a : t), f = Math.floor(d * 3), m = smooth(clamp((Math.min(u, 1 - u, fract(d * 3) / 3, (1 - fract(d * 3)) / 3) - .006) / .016)), h = hash(s * 3 + f, c, r), g = noise(e, o, 8, 8, r ^ 14105), _ = .5 + .5 * Math.sin(n * (d * 38 + .28 * Math.sin(n * u) + .18 * g) + h * n);
				J = .06 + m * (.25 + .32 * h + .22 * _ + .06 * S), Y = m * (.76 + .045 * _ + .025 * S), X = .78 + m * (i.roughness - .78 + .09 * _ + .04 * h), Z = .52 + .46 * m;
				break;
			}
			case `mosaic`: {
				let t = e * 16, n = o * 16, a = fract(t), s = fract(n), l = smooth(clamp((Math.min(a, 1 - a, s, 1 - s) - .018) / .042)), u = hash(Math.floor(t), Math.floor(n), r);
				J = .2 + l * (.08 + .56 * u + .1 * S), Y = l * (.78 + .08 * u + .025 * S), X = .76 + l * (i.roughness - .76 + .11 * u + .04 * S), Z = .6 + .39 * l, Q = 1 - l;
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
				J = .2 + m * (.28 + .35 * h + .07 * S), Y = m * (.8 + .045 * h + .02 * S), X = .74 + m * (i.roughness - .74 + .1 * h + .04 * S), Z = .6 + .39 * m, Q = 1 - m;
				break;
			}
			case `knit`: {
				let t = e * 8, r = o * 8, i = Math.floor(t), s = Math.floor(r), c = 0;
				for (let e = -1; e <= 1; e += 2) {
					let n = t - i - .5, a = r - s - .84, o = e * .34, l = -.68, u = clamp((n * o + a * l) / (o * o + l * l)), d = n - u * o, f = a - u * l, m = smooth(clamp(1 - (d * d + f * f) / .0169));
					c += (1 - c) * m;
				}
				let l = .5 + .25 * Math.sin(n * (48 * e + 24 * o) + a) + .25 * Math.sin(n * (48 * e - 24 * o) - a);
				J = .12 + .64 * c + .1 * S + .07 * c * l, Y = .08 + c * (.76 + .045 * l) + .025 * S, X += .065 * (S - .5) + .035 * (1 - c), Z = .58 + .41 * c;
				break;
			}
			case `corduroy`: {
				let t = (.5 + .5 * Math.cos(n * e * 12)) ** .65, i = noise(e, o, 96, 96, r ^ 11121), a = noise(e, o, 12, 48, r ^ 31907);
				J = .12 + .57 * t + .16 * i + .08 * a, Y = .07 + .79 * t + .035 * i + .025 * a, X += .08 * (i - .5) + .035 * (1 - t), Z = .57 + .42 * t;
				break;
			}
			case `felt`: {
				let t = e * 20, i = o * 20, a = Math.floor(t), s = Math.floor(i), c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = a + o, u = s + e, d = (l % 20 + 20) % 20, f = (u % 20 + 20) % 20, p = t - l - .25 - .5 * hash(d, f, r), m = i - u - .25 - .5 * hash(d, f, r ^ 41845), h = hash(d, f, r ^ 27415) * n, g = Math.cos(h), _ = Math.sin(h), v = (p * g + m * _) / .6, y = (m * g - p * _) / .055, b = clamp(1 - v * v - y * y);
					c += (1 - c) * b * b;
				}
				J = .28 + .28 * S + .3 * c, Y = .18 + .035 * S + .065 * c, X += .065 * (S - .5) + .025 * c, Z = .96 + .025 * c + .01 * S;
				break;
			}
			case `wafflecloth`: {
				let t = smooth(clamp((Math.cos(n * e * 8) - .35) / .65)), i = smooth(clamp((Math.cos(n * o * 8) - .35) / .65)), s = t + i - t * i, c = .5 + .25 * Math.cos(n * e * 96 + a) + .25 * Math.cos(n * o * 96 - a), l = noise(e, o, 24, 24, r ^ 19059);
				J = .22 + .48 * s + .12 * c + .08 * l, Y = .12 + .66 * s + .035 * c + .025 * l, X += .04 * (l - .5) + .025 * (1 - s), Z = .65 + .32 * s + .02 * c;
				break;
			}
			case `cableknit`: {
				let t = fract(e * 4), i = o * 4, s = .22 * Math.sin(n * i), c = .5 + .5 * Math.cos(n * i), l = (t - .5 - s) / .115, u = (t - .5 + s) / .115, d = smooth(clamp(1 - l * l)), f = smooth(clamp(1 - u * u)), p = d + f - d * f, m = d * (.38 + .38 * c), h = f * (.76 - .38 * c), g = m + h - m * h, _ = smooth(clamp((Math.cos(n * t) - .5) / .5)), v = .5 + .5 * Math.cos(n * (o * 32 + .35 * Math.cos(n * t))), y = noise(e, o, 64, 64, r ^ 14249), b = .5 + .5 * Math.sin(n * (e * 96 + o * 48) + a);
				J = .13 + .55 * g + .13 * _ + .09 * y + .04 * p * b, Y = .07 + g + .17 * _ * (.65 + .35 * v) + .02 * y + .015 * p * b, X += .035 * (y - .5) + .025 * (1 - p), Z = .57 + .35 * p + .055 * _ + .015 * y;
				break;
			}
			case `quilting`: {
				let t = (e + o) * 6, i = (e - o) * 6, s = .5 - .5 * Math.cos(n * t), c = .5 - .5 * Math.cos(n * i), l = s * c, u = smooth(clamp(1 - s / .055)), d = smooth(clamp(1 - c / .055)), f = u + d - u * d, p = smooth(clamp((Math.cos(n * i * 8) - .2) / .8)), m = smooth(clamp((Math.cos(n * t * 8) - .2) / .8)), h = u * p + d * m - u * p * d * m, g = .5 + .25 * Math.cos(n * e * 96 + a) + .25 * Math.cos(n * o * 96 - a), _ = noise(e, o, 24, 24, r ^ 27441);
				J = .3 + .32 * l - .15 * f + .12 * h + .08 * _ + .06 * g, Y = .13 + .67 * l - .065 * f + .035 * h + .02 * g + .015 * _, X += .045 * (_ - .5) + .025 * f, Z = .88 + .1 * l - .18 * f + .025 * h;
				break;
			}
			case `roofshingles`: {
				let t = Math.floor(o * 6), n = fract(o * 6), i = e * 4 + t % 2 * .5, a = fract(i), s = smooth(clamp(Math.min(n, 1 - n) / .12)), c = smooth(clamp(Math.min(a, 1 - a) / .055)), l = (1 - c) * smooth(clamp((n - .32) / .16)) * s, u = s * c, d = hash(Math.floor(i) % 4, t, r ^ 25527), f = smooth(clamp((noise(e, o, 64, 64, r ^ 19765) - .2) / .6)), p = 1 - s;
				J = .24 + .32 * f + .2 * u * d - .15 * p - .14 * l, Y = .2 + .38 * s - .2 * l + .13 * f + .05 * u * d, X += .12 * (f - .5) + .04 * p + .03 * l, Z = .96 - .24 * p - .2 * l + .025 * f;
				break;
			}
			case `rooftiles`: {
				let t = fract(e * 6 + .5), i = fract(o * 5), a = .5 + .5 * Math.cos(n * e * 6), s = smooth(clamp(Math.min(i, 1 - i) / .13)), c = s * smooth(clamp(Math.min(t, 1 - t) / .12)), l = hash(Math.floor(e * 6 + .5) % 6, Math.floor(o * 5), r ^ 31297), u = noise(e, o, 24, 32, r ^ 23591), d = 1 - s;
				J = .26 + .24 * a + .23 * c * l + .14 * u - .14 * d, Y = .16 + .65 * a - .1 * d + .035 * c * l + .012 * u, X += .13 * (u - .5) + .05 * (1 - a) + .045 * d, Z = .76 + .22 * a - .14 * d + .015 * u;
				break;
			}
			case `stucco`: {
				let t = e * 28, n = o * 28, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = i + o, u = a + e, d = (l % 28 + 28) % 28, f = (u % 28 + 28) % 28, p = hash(d, f, r ^ 17337), m = t - l - .2 - .6 * hash(d, f, r), h = n - u - .2 - .6 * hash(d, f, r ^ 6083), g = .3 + .25 * p, _ = clamp(1 - (m * m + h * h * (.7 + p)) / (g * g)), v = _ * _;
					p < .28 ? c += (1 - c) * v : s += (1 - s) * v;
				}
				let l = noise(e, o, 5, 7, r ^ 21373);
				J = .52 + .15 * l + .19 * s - .24 * c + .08 * S, Y = .27 + .16 * l + .43 * s - .22 * c + .06 * S, X += .055 * s + .065 * c + .05 * (S - .5), Z = .96 - .25 * c - .075 * s + .02 * S;
				break;
			}
			case `lichen`: {
				let t = e * 7, i = o * 7, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let u = a + o, d = s + e, f = (u % 7 + 7) % 7, p = (d % 7 + 7) % 7, m = t - u - .25 - .5 * hash(f, p, r), h = i - d - .25 - .5 * hash(f, p, r ^ 29107), g = Math.atan2(h, m), _ = hash(f, p, r ^ 15449), v = (.38 + .16 * _) * (1 + .13 * Math.cos(5 * g + _ * n) + .09 * Math.sin(3 * g - _ * n)), y = smooth(clamp((1 - Math.hypot(m, h) / v) / .18));
					c += (1 - c) * y, l += y * (_ - .5);
				}
				let u = smooth(clamp((noise(e, o, 96, 96, r ^ 27171) - .58) / .25));
				J = .16 + .13 * S + .53 * c + .07 * Math.tanh(l) - .18 * c * u, Y = .15 + .035 * S + c * (.48 - .17 * u), X += .04 * (S - .5) + .035 * c * u, Z = .9 + .08 * c - .15 * c * u;
				break;
			}
			case `leaflitter`: {
				let t = e * 6, i = o * 6, a = Math.floor(t), s = Math.floor(i), c = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let d = a + o, f = s + e, p = (d % 6 + 6) % 6, m = (f % 6 + 6) % 6, h = t - d - .2 - .6 * hash(p, m, r), g = i - f - .2 - .6 * hash(p, m, r ^ 10679), _ = hash(p, m, r ^ 20273) * n, v = Math.cos(_), y = Math.sin(_), b = hash(p, m, r ^ 20905), x = (h * v + g * y) / (.64 + .1 * b), S = (g * v - h * y) / (.26 + .05 * b), C = smooth(clamp((1 - x * x - Math.sqrt(S * S + 1e-4)) / .18)), w = C * Math.exp(-S * S * 260);
					c += (1 - c) * C, u += (1 - u) * w, l += C * (b - .5);
				}
				J = .07 + .09 * S + .56 * c + .16 * Math.tanh(l) - .12 * u, Y = .08 + .035 * S + .61 * c + .045 * u, X += .07 * (S - .5) + .045 * (1 - c), Z = .53 + .44 * c;
				break;
			}
			case `endgrain`: {
				let t = fract(e - l + .5) - .5, i = fract(o - u + .5) - .5, s = Math.sin(Math.PI * t) / Math.PI, c = Math.sin(Math.PI * i) / Math.PI, d = Math.sqrt(s * s + c * c + 4e-4), f = noise(e, o, 5, 5, r ^ 31811), p = (.5 + .5 * Math.sin(n * (23 * d + .23 * f) + a)) ** 6, m = smooth(clamp((noise(e, o, 96, 96, r ^ 5607) - .62) / .23)), h = Math.hypot(t, i), g = smooth(clamp((h - .07) / .08)) * smooth(clamp((.43 - h) / .08)) * (.5 + .5 * Math.cos(7 * Math.atan2(i, t) + a)) ** 48;
				J = .76 - .37 * p - .2 * m - .24 * g + .08 * S, Y = .49 - .07 * p - .16 * m - .22 * g + .025 * S, X += .13 * m + .06 * p + .045 * (S - .5), Z = .99 - .17 * m - .22 * g;
				break;
			}
			case `acousticfoam`: {
				let t = fract(e * 4) - .5, n = fract(o * 4) - .5, i = Math.sqrt(t * t + 1e-4), a = Math.sqrt(n * n + 1e-4), c = clamp(1 - 2 * (.5 * (i + a + Math.sqrt((i - a) ** 2 + 4e-4)))), l = c < .1 ? c * c * 5 : c > .9 ? .9 - (1 - c) * (1 - c) * 5 : c - .05, u = hash(Math.floor(e * 4), Math.floor(o * 4), r ^ 14289), d = smooth(clamp((noise(e, o, 96, 96, r ^ 27417) - .42) / .46));
				J = .14 + .61 * l + .13 * S - .12 * d, Y = .03 + l * (.88 + .07 * u) + .009 * S - .008 * d, X += .065 * (S - .5) + .025 * d, Z = .43 + .54 * l + .025 * S - .025 * d;
				break;
			}
			case `closedcellfoam`: {
				let t = e * 28, n = o * 28, r = Math.floor(t), i = Math.floor(n), a = 0, s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = r + o, u = i + e, f = (l % 28 + 28) % 28, p = ((u % 28 + 28) % 28 * 28 + f) * 4, m = t - l - d[p], h = n - u - d[p + 1], g = clamp(1 - (m * m + h * h) * d[p + 2]), _ = g * g;
					a += (1 - a) * _, s += (1 - s) * _ * (1 - g) * 6.75, c += _ * (d[p + 3] - .5);
				}
				J = .49 + .18 * S - .13 * a + .08 * s + .1 * c, Y = .48 + .035 * S - .17 * a + .055 * s, X += .065 * (S - .5) + .025 * a, Z = .99 - .065 * a;
				break;
			}
			case `linoleum`: {
				let t = noise(e, o, 4, 5, r ^ 22811), i = .5 + .5 * Math.sin(n * (5 * e + 3 * o + 1.2 * t) + a), s = noise(e + .19 * t, o + .08 * i, 48, 8, r ^ 11635), c = smooth(clamp((s - .43) / .4));
				J = .24 + .25 * i + .38 * c + .08 * S, Y = .45 + .025 * S + .015 * s, X += .09 * (s - .5) + .045 * (S - .5), Z = .99 + .008 * S;
				break;
			}
			case `orangepeel`: {
				let t = e * g, n = o * _, r = Math.floor(t), i = Math.floor(n), a = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let c = r + o, l = i + e, u = (c % g + g) % g, d = ((l % _ + _) % _ * g + u) * 3, f = t - c - v[d], p = n - l - v[d + 1], m = .26 + .14 * v[d + 2], h = f * f + p * p, y = clamp(1 - h / (m * m)), b = clamp(1 - h / .36);
					a += (1 - a) * y * y, s += (1 - s) * b * b * (1 - b) * 6.75;
				}
				J = (.48 + .28 * S) * (1 - .35 * a) + .119 * a, Y = (.46 + .025 * S + .045 * s) * (1 - a) + .22 * a, X += .06 * (S - .5) + .035 * a, Z = 1 - .08 * a;
				break;
			}
			case `coconut`: {
				let t = e * g, n = o * _, r = Math.floor(t), i = Math.floor(n), a = 0, s = 0, c = .38 + .18 * S;
				for (let e = -1; e <= 1; e++) for (let o = -1; o <= 1; o++) {
					let l = r + o, u = i + e, d = (l % g + g) % g, f = ((u % _ + _) % _ * g + d) * 3, p = t - l - v[f], m = n - u - v[f + 1], h = v[f + 2], y = m / (.48 + .25 * h), b = (p + (h - .5) * .28 * m) / .12, x = clamp(1 - y * y - b * b), S = x * x;
					h < .24 ? (s += (1 - s) * S, c = c * (1 - S) + .15 * S) : (a += (1 - a) * S, c = c * (1 - S) + (.55 + .25 * h) * S);
				}
				J = c, Y = (.42 + .055 * S + .18 * a) * (1 - s) + .3 * s, X += .055 * (S - .5) + .025 * a, Z = (.96 + .025 * a) * (1 - s) + .86 * s;
				break;
			}
			case `watermelon`: {
				let t = noise(e, o, 4, 5, r ^ 20247), i = noise(e, o, 12, 8, r ^ 26531), c = smooth(clamp((.5 + .5 * Math.sin(n * (5 * e + .3 * t + .12 * i) + a) - .24) / .52)), l = smooth(clamp((noise(e, o, 96, 96, r ^ 23609) - .48) / .4)), u = smooth(clamp((noise(e, o, 80, 80, r ^ 11121) - .5) / .38));
				J = (.12 + .72 * c) * (1 - .2 * l) + .46 * .2 * l, Y = (.48 + .025 * S) * (1 - .14 * u), X += .055 * (S - .5) + .045 * u, Z = 1 - .035 * u;
				break;
			}
			case `limestone`: {
				let t = e * 24, i = o * 24, a = Math.floor(t), s = Math.floor(i), c = smooth(clamp((noise(e, o, 96, 96, r ^ 6615) - .49) / .38)), l = 0;
				J = .63 + .14 * S - .16 * c;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = a + r, c = s + e, u = (o % 24 + 24) % 24, d = ((c % 24 + 24) % 24 * 24 + u) * 7, f = t - o - y[d], p = i - c - y[d + 1], m = (f * y[d + 4] + p * y[d + 5]) / y[d + 2], h = (p * y[d + 4] - f * y[d + 5]) / (y[d + 2] * y[d + 3]), g = m * m + h * h, _ = smooth(clamp((1 - g) / .36)), v = y[d + 6], b = .5 + .5 * Math.cos(n * 1.5 * g), x = .5 + .24 * v + .16 * b;
					J = J * (1 - _) + x * _, l += (1 - l) * _;
				}
				Y = .47 + .08 * l + .025 * S - .07 * c, X += .06 * (S - .5) + .08 * c - .05 * l, Z = .98 - .12 * c + .015 * l;
				break;
			}
			case `breccia`: {
				let t = e * 6, n = o * 6, a = Math.floor(t), s = Math.floor(n), c = noise(e, o, 80, 80, r ^ 23841), l = 0;
				J = .56 + .16 * c, Y = .33 + .035 * c, X += .08 * c;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = a + r, c = s + e, u = (o % 6 + 6) % 6, d = ((c % 6 + 6) % 6 * 6 + u) * 18, f = t - o - b[d], p = n - c - b[d + 1], m = 1;
					for (let e = 0; e < 5; e++) {
						let t = d + 3 + e * 3, n = b[t + 2] - f * b[t] - p * b[t + 1];
						m *= smooth(clamp(n / .055));
					}
					let h = b[d + 2], g = .15 + .66 * h + .12 * S;
					J = J * (1 - m) + g * m, Y = Y * (1 - m) + (.54 + .1 * h + .025 * S) * m, X = X * (1 - m) + (i.roughness + .08 * (S - .5)) * m, l += (1 - l) * m;
				}
				Z = .81 + .17 * l + .015 * c;
				break;
			}
			case `gneiss`: {
				let t = noise(e, o, 4, 4, r ^ 27417), i = o + .28 * Math.sin(n * e + .8 * Math.sin(n * o) + a) + .06 * Math.sin(n * (2 * e - o) + a), s = n * 6 * i + 1.4 * (t - .5), c = smooth(clamp((.5 + .5 * Math.sin(s) - .18) / .64)), l = .5 + .5 * Math.sin(3 * s + .4 * t), d = smooth(clamp((noise(e, o, 96, 96, r ^ 15477) - .52) / .34));
				J = (.12 + .7 * c + .08 * l) * (1 - .3 * d) + .264 * d, Y = .42 + .055 * c + .07 * d + .025 * S, X += .08 * (S - .5) + .06 * (1 - c) - .05 * d, Z = .95 + .025 * c + .015 * d;
				break;
			}
			case `plywood`: {
				let t = noise(e, o, 4, 3, r ^ 17335), s = 3.2 * Math.cos(n * e + a) + 1.8 * Math.cos(n * o + .7 * a) + .45 * t, c = (.5 + .5 * Math.sin(n * s)) ** 5, l = .5 + .5 * Math.sin(n * (64 * e + .4 * t) + a);
				J = .67 + .1 * S - .32 * c + .035 * l, Y = .48 + .025 * S - .045 * c + .015 * l, X += .05 * c + .04 * (S - .5), Z = .99 - .045 * c;
				for (let t = 0; t < 2; t++) {
					let r = t * 3, a = fract(e - x[r] + .5) - .5, s = fract(o - x[r + 1] + .5) - .5, c = x[r + 2], l = a * a / (.0025 * c * c) + s * s / (.0169 * c * c), u = Math.max(0, 1 - l), d = u * u, f = .5 + .5 * Math.cos(n * 2 * l);
					J = J * (1 - d) + (.25 + .2 * f) * d, Y = Y * (1 - d) + (.44 + .025 * f) * d, X = X * (1 - d) + (i.roughness + .065 * f) * d, Z = Z * (1 - d) + (.95 + .025 * f) * d;
				}
				break;
			}
			case `osb`:
			case `chipboard`: {
				let t = e * T, n = o * T, r = Math.floor(t), a = Math.floor(n), s = 0;
				J = .24 + .12 * S, Y = .35 + .025 * S, X += .035 * S;
				for (let e = 0; e < 2; e++) for (let o = -1; o <= 1; o++) for (let c = -1; c <= 1; c++) {
					let l = r + c, u = a + o, d = (l % T + T) % T, f = (u % T + T) % T, p = ((e * T + f) * T + d) * 26, m = t - l - E[p], h = n - u - E[p + 1], g = (m * E[p + 2] + h * E[p + 3]) / E[p + 4], _ = (h * E[p + 2] - m * E[p + 3]) / E[p + 5], v = 1;
					for (let e = 0; e < 6; e++) {
						let t = p + 8 + e * 3;
						v *= smooth(clamp((E[t + 2] - g * E[t] - _ * E[t + 1]) / .12));
					}
					if (v === 0) continue;
					let y = E[p + 6], b = .5 + .5 * Math.sin(18 * _ + .65 * Math.sin(3 * g) + E[p + 7]);
					J = J * (1 - v) + (.34 + .44 * y + .1 * b) * v, Y = Y * (1 - v) + (.49 + .12 * y + .025 * b) * v, X = X * (1 - v) + (i.roughness - .045 + .07 * b) * v, s += (1 - s) * v;
				}
				Z = .83 + .15 * s + .015 * S;
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
				J = (.87 + .035 * S) * (1 - c) + .08 * c, Y = .54 - .12 * c, X += .14 * c + .015 * (S - .5), Z = 1 - .14 * c;
				break;
			}
			case `flutedceramic`: {
				let t = .5 + .5 * Math.cos(n * 8 * e + a), i = smooth(clamp((noise(e, o, 96, 96, r ^ 24361) - .65) / .28));
				J = .88 + .035 * S - .12 * i, Y = .2 + .6 * t, X += .035 * (1 - t) + .025 * i, Z = .92 + .08 * t;
				break;
			}
			case `encaustictiles`: {
				let t = fract(e * 4), n = fract(o * 4), r = smooth(clamp((Math.min(t, 1 - t) - .02) / .08)) * smooth(clamp((Math.min(n, 1 - n) - .02) / .08)), i = t - .5, a = n - .5, l = i * s + a * c, u = a * s - i * c, d = 0;
				for (let e = 0; e < 4; e++) {
					let t = e < 2 ? l : u, n = e < 2 ? u : l, r = (t - (e % 2 == 0 ? .16 : -.16)) / .19, i = n / .085, a = smooth(clamp((1 - r * r - i * i) / .22));
					d += (1 - d) * a;
				}
				let f = i * i + a * a, p = smooth(clamp((f - .135) / .008)) * (1 - smooth(clamp((f - .158) / .008)));
				J = .94 - .84 * (d + (1 - d) * p) + .012 * (S - .5), Y = .18 + .4 * r, Q = 1 - r, X += .12 * Q + .035 * (S - .5), Z = .77 + .23 * r;
				break;
			}
			case `breadcrust`: {
				let t = e * 7, n = o * 7, i = Math.floor(t), a = Math.floor(n), s = 0, c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let o = i + r, u = a + e, d = ((u % 7 + 7) % 7 * 7 + (o % 7 + 7) % 7) * 27, f = t - o - F[d], p = n - u - F[d + 1], m = 1, h = 1;
					for (let e = 0; e < 8; e++) {
						let t = d + 3 + e * 3, n = F[t + 2] - f * F[t] - p * F[t + 1];
						m *= smooth(clamp((n - .025) / .14)), h *= smooth(clamp((n - .025) / .5));
					}
					s += m, c += h, l += m * F[d + 2];
				}
				let u = noise(e, o, 19, 23, r ^ 18371);
				J = .06 + s * (.42 + .21 * u) + .2 * l, Y = .12 + .42 * s + .26 * c + .012 * s * (S - .5), X += .08 * (1 - s) + .035 * (u - .5), Z = .65 + .35 * s;
				break;
			}
			case `wafer`: {
				let t = fract(e * 12), n = fract(o * 12), i = smooth(clamp((Math.min(t, 1 - t) - .07) / .17)) * smooth(clamp((Math.min(n, 1 - n) - .07) / .17)), a = noise(e, o, 24, 24, r ^ 27953);
				J = .46 + .27 * i + .12 * a + .035 * S, Y = .72 - .5 * i + .008 * (S - .5), X += .06 * i + .02 * (a - .5), Z = 1 - .23 * i;
				break;
			}
			case `chocolate`: {
				let t = fract(e * 4), n = fract(o * 4), i = smooth(clamp((Math.min(t, 1 - t) - .035) / .105)) * smooth(clamp((Math.min(n, 1 - n) - .035) / .105)), a = noise(e, o, 4, 4, r ^ 12729);
				J = .18 + .46 * i + .065 * a + .008 * S, Y = .14 + .65 * i, X += .1 * (1 - i) + .008 * (a - .5), Z = .73 + .27 * i;
				break;
			}
			case `basketball`: {
				let t = e * I, r = o * I, i = Math.floor(t), a = Math.floor(r), s = 0;
				for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
					let o = i + n, c = a + e, l = ((c % I + I) % I * I + (o % I + I) % I) * L, u = t - o - R[l], d = r - c - R[l + 1], f = smooth(clamp(1 - (u * u + d * d) * R[l + 2]));
					s += (1 - s) * f;
				}
				let c = Math.abs(Math.sin(n * (2 * e + .12 * Math.sin(n * o)))), l = Math.abs(Math.sin(n * (2 * o + .12 * Math.sin(n * e)))), u = smooth(clamp((c - .035) / .105)) * smooth(clamp((l - .035) / .105));
				J = .025 + u * (.64 + .24 * s + .025 * S), Y = .12 + u * (.46 + .22 * s), X += .045 * s - .08 * (1 - u), Z = .64 + .36 * u;
				break;
			}
			case `tennisball`: {
				let t = e * I, r = o * I, i = Math.floor(t), a = Math.floor(r), s = 0;
				for (let e = -1; e <= 1; e++) for (let n = -1; n <= 1; n++) {
					let o = i + n, c = a + e, l = ((c % I + I) % I * I + (o % I + I) % I) * L, u = t - o - R[l], d = r - c - R[l + 1], f = (u * R[l + 2] + d * R[l + 3]) / .48, p = (-u * R[l + 3] + d * R[l + 2]) / .065, m = smooth(clamp(1 - f * f - p * p));
					s += (1 - s) * m;
				}
				let l = 1 - smooth(clamp((Math.abs(Math.sin(n * (o - .19 * Math.sin(n * e) - .25))) - .025) / .075));
				J = (.16 + .1 * S + .06 * s) * (1 - l) + .97 * l, Y = .54 + (1 - l) * (.065 * s + .018 * S) - .12 * l, X -= .1 * l, Z = 1 - .12 * l;
				break;
			}
			case `golfball`: {
				let t = fract(e * 10 - z) - .5, n = fract(o * 10 - ee) - .5, r = clamp(1 - (t * t + n * n) / (.41 * .41)) ** 2;
				J = .96 - .12 * r, Y = .8 - .6 * r, X += .04 * r, Z = 1 - .2 * r;
				break;
			}
			case `boardformedconcrete`: {
				let t = Math.floor(o * 8), r = fract(o * 8), i = fract(e * 2 + t % 2 * .5), a = Math.floor(fract(e + t % 2 * .25) * 2), s = smooth(clamp(i / .018)) * smooth(clamp((1 - i) / .018)) * smooth(clamp(r / .055)) * smooth(clamp((1 - r) / .055)), c = U[t * 2 + a], l = te(e, o + .002 * Math.sin(n * e + c * n)), u = V(e, o);
				J = .39 + s * (.12 + .09 * c + .055 * l) + .025 * u, Y = .18 + s * (.48 + .025 * c + .025 * l) + .008 * u, X += .025 * l * s + .025 * u, Z = .75 + .25 * s;
				break;
			}
			case `ribbedconcrete`: {
				let t = fract(e * 12), n = Math.floor(e * 12), r = smooth(clamp((t - .12) / .18)) * smooth(clamp((.88 - t) / .18)), i = V(e, o), a = H(e, o), s = U[n];
				J = .38 + .17 * r + .055 * a + .025 * i + .025 * s * r, Y = .15 + .65 * r + .009 * i + .006 * a + .008 * s * r, X += .035 * i + .02 * a, Z = .69 + .31 * r;
				break;
			}
			case `splitfaceblock`: {
				let t = Math.floor(o * 8), n = fract(o * 8), r = e * 4 + t % 2 * .5, i = fract(r), a = Math.floor(r) % 4, s = smooth(clamp((i - .04) / .08)) * smooth(clamp((.96 - i) / .08)) * smooth(clamp((n - .06) / .09)) * smooth(clamp((.94 - n) / .09)), c = U[t * 4 + a], l = H(e, o), u = V(e, o), d = smooth(clamp((l - .22) / .56));
				J = .4 + s * (.04 + .28 * d + .1 * c + .06 * u), Y = .14 + s * (.34 + .25 * d + .1 * c + .08 * u), X -= .1 * (1 - s), X += .035 * u * s, Z = .64 + s * (.29 + .07 * d), Q = 1 - s;
				break;
			}
			case `chainmail`: {
				let t = e * 6, n = o * 8, r = Math.floor(n), a = G(e, o);
				J = .035 + .025 * a, Y = .06 + .008 * a, X = .88 + .04 * a, Z = .59;
				for (let e = -1; e <= 1; e++) {
					let o = r + e, s = (o + 8) % 8, c = s % 2 * .5, l = Math.floor(t - c);
					for (let e = -1; e <= 1; e++) {
						let r = l + e, u = (r + 6) % 6, d = t - r - c - .5, f = n - o - .5, m = clamp(1 - ((Math.sqrt(d * d + f * f) - .62) / .105) ** 2), h = smooth(m), g = K[s * 6 + u], _ = .44 + .26 * m + (s % 2 ? -1 : 1) * f * (.13 + .04 * g);
						J += h * (.63 + .13 * g + .04 * a - J), Y += h * (_ - Y), X += h * (i.roughness + .04 * a - X), Z += h * (.88 + .1 * m - Z), $ += h * (1 - $);
					}
				}
				break;
			}
			case `rivetedmetal`: {
				let t = fract(e * 3), n = fract(o * 4), r = smooth(clamp(t / .045)) * smooth(clamp((1 - t) / .045)) * smooth(clamp(n / .045)) * smooth(clamp((1 - n) / .045)), i = Math.floor(o * 4) * 3 + Math.floor(e * 3), a = K[i], s = G(e, o), c = 0;
				for (let e = 0; e < 2; e++) for (let r = 0; r < 2; r++) {
					let i = t - (r ? .88 : .12), a = n - (e ? .88 : .12), o = clamp(1 - (i * i + a * a) / .002704);
					c += o * o;
				}
				J = .28 + r * (.19 + .09 * a) + .13 * c + .03 * s, Y = .09 + r * (.23 + .025 * a) + .57 * c + .004 * s, X += .1 * (1 - r) - .09 * c + .025 * s, Z = .64 + .34 * r + .02 * c;
				break;
			}
			case `weldedmetal`: {
				let t = fract(e * 3 + .5) - .5, r = .5 + .5 * Math.cos(n * 32 * o + a), s = smooth(clamp(1 - (t / (.065 + .015 * r)) ** 2)), c = smooth(clamp(1 - (t / .15) ** 2)), l = G(e, o);
				J = .52 + .04 * l - .16 * c + s * (.19 + .08 * r), Y = .2 + .004 * l + s * (.46 + .15 * r), X += .12 * c - .05 * s + .025 * l, Z = 1 - .15 * c * (1 - s);
				break;
			}
		}
		f.color = J, f.height = Y * i.relief, f.roughness = clamp(X), f.occlusion = Z, f.mortar = Q, f.metallic = $;
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