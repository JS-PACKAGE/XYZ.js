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
function wrappedFeature(e, t, n, r) {
	let i = Math.floor(e * n), a = Math.floor(t * n), o = 4;
	for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
		let l = i + c, u = a + s, d = (l % n + n) % n, f = (u % n + n) % n, p = (l + hash(d, f, r)) / n, m = (u + hash(d, f, r ^ 40503)) / n, h = e - p, g = t - m, _ = h * h + g * g;
		_ < o && (o = _);
	}
	return Math.sqrt(o) * n;
}
function createSurfaceSampler(t, r) {
	let i = require_materials.proceduralMaterialPresets[t], a = hash(0, 0, r) * n, o = t === `endgrain` ? hash(0, 0, r ^ 15127) : 0, s = t === `endgrain` ? hash(0, 0, r ^ 23849) : 0, c = t === `closedcellfoam` ? /* @__PURE__ */ new Float64Array(3136) : null;
	if (c) for (let e = 0; e < 28; e++) for (let t = 0; t < 28; t++) {
		let n = (e * 28 + t) * 4, i = hash(t, e, r ^ 28455), a = .55 + .16 * i;
		c[n] = .3 + .4 * hash(t, e, r), c[n + 1] = .3 + .4 * hash(t, e, r ^ 10661), c[n + 2] = 1 / (a * a), c[n + 3] = i;
	}
	let l = t === `snakeskin` ? 10 : 4, u = t === `snakeskin` ? 12 : 6, d = t === `snakeskin` || t === `crocodile` ? new Float64Array(l * u) : null;
	if (d) for (let e = 0; e < u; e++) for (let t = 0; t < l; t++) d[e * l + t] = hash(t, e, r ^ 29625);
	let f = t === `engineturned` ? /* @__PURE__ */ new Float64Array(72) : null;
	if (f) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let n = (e * 6 + t) * 2;
		f[n] = hash(t, e, r ^ 14497), f[n + 1] = hash(t, e, r ^ 27735);
	}
	let p = t === `orangepeel` ? 24 : 40, m = t === `orangepeel` ? 24 : 8, h = t === `orangepeel` || t === `coconut` ? new Float64Array(p * m * 3) : null;
	if (h) for (let e = 0; e < m; e++) for (let t = 0; t < p; t++) {
		let n = (e * p + t) * 3;
		h[n] = .25 + .5 * hash(t, e, r ^ 7795), h[n + 1] = .25 + .5 * hash(t, e, r ^ 21425), h[n + 2] = hash(t, e, r ^ 31529);
	}
	let g = t === `limestone` ? /* @__PURE__ */ new Float64Array(4032) : null;
	if (g) for (let e = 0; e < 24; e++) for (let t = 0; t < 24; t++) {
		let i = (e * 24 + t) * 7, a = n * hash(t, e, r ^ 11377);
		g[i] = .15 + .7 * hash(t, e, r ^ 6323), g[i + 1] = .15 + .7 * hash(t, e, r ^ 20009), g[i + 2] = .25 + .19 * hash(t, e, r ^ 31377), g[i + 3] = .65 + .35 * hash(t, e, r ^ 14733), g[i + 4] = Math.cos(a), g[i + 5] = Math.sin(a), g[i + 6] = hash(t, e, r ^ 25591);
	}
	let _ = t === `breccia` ? /* @__PURE__ */ new Float64Array(648) : null;
	if (_) for (let e = 0; e < 6; e++) for (let t = 0; t < 6; t++) {
		let i = (e * 6 + t) * 18, a = n * hash(t, e, r ^ 11091), o = .3 + .35 * hash(t, e, r ^ 23063);
		_[i] = .15 + .7 * hash(t, e, r ^ 6089), _[i + 1] = .15 + .7 * hash(t, e, r ^ 14545), _[i + 2] = hash(t, e, r ^ 32323);
		for (let s = 0; s < 5; s++) {
			let c = a + n * s / 5 + .2 * (hash(t, e, r ^ 16823 + s) - .5), l = i + 3 + s * 3;
			_[l] = Math.cos(c), _[l + 1] = Math.sin(c), _[l + 2] = o * (.75 + .25 * hash(t, e, r ^ 26785 + s));
		}
	}
	let v = t === `plywood` ? /* @__PURE__ */ new Float64Array(6) : null;
	if (v) for (let e = 0; e < 2; e++) v[e * 3] = hash(e, 0, r ^ 8679), v[e * 3 + 1] = hash(e, 0, r ^ 25779), v[e * 3 + 2] = .75 + .25 * hash(e, 0, r ^ 18649);
	let y = t === `osb` ? 6 : 28, b = t === `osb` || t === `chipboard` ? new Float64Array(y * y * 2 * 26) : null;
	if (b) for (let e = 0; e < 2; e++) for (let i = 0; i < y; i++) for (let a = 0; a < y; a++) {
		let o = ((e * y + i) * y + a) * 26, s = r ^ e * 14759, c = hash(a, i, s ^ 25265), l = t === `osb` ? Math.PI / 2 + .65 * (hash(a, i, s ^ 6355) - .5) + .5 * (noise(a / 6, i / 6, 3, 3, r ^ 31529) - .5) : n * hash(a, i, s ^ 6355);
		b[o] = .25 + .5 * hash(a, i, s ^ 20247), b[o + 1] = .25 + .5 * hash(a, i, s ^ 29641), b[o + 2] = Math.cos(l), b[o + 3] = Math.sin(l), b[o + 4] = t === `osb` ? .78 + .14 * c : .46 + .19 * c, b[o + 5] = t === `osb` ? .13 + .1 * hash(a, i, s ^ 20891) : .25 + .17 * hash(a, i, s ^ 20891), b[o + 6] = c, b[o + 7] = n * hash(a, i, s ^ 11877);
		for (let e = 0; e < 6; e++) {
			let t = o + 8 + e * 3;
			b[t] = Math.cos(n * e / 6), b[t + 1] = Math.sin(n * e / 6), b[t + 2] = .82 + .18 * hash(a, i, s ^ 23857 + e);
		}
	}
	let x = t === `stone` || t === `metal` || t === `marble`, S = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud` || t === `granite` || t === `slate` || t === `terrazzo` || t === `plaster` || t === `terracotta` || t === `cork` || t === `rubber` || t === `sandstone` || t === `travertine` || t === `pumice`;
	return (e, l, u) => {
		e = fract(e), l = fract(l);
		let C = x ? noise(e, l, 4, 4, r) : 0, w = noise(e, l, 32, 32, r ^ 2747636419), T = S ? noise(e, l, 64, 64, r ^ 2135587861) : 0, E = C, D = C, O = i.roughness, k = 1, A = 0, j = +(t === `metal` || t === `diamondplate` || t === `hammeredmetal` || t === `galvanized` || t === `corrugatedmetal` || t === `knurledmetal` || t === `engineturned` || t === `goldleaf`);
		switch (t) {
			case `wood`: {
				let t = noise(e, l, 4, 2, r ^ 71), i = .5 + .5 * Math.sin(n * (12 * e + .65 * t) + a), o = (.5 + .5 * Math.sin(n * (40 * e + t) + a)) ** 12;
				E = clamp(.22 + .6 * i + .16 * w - .2 * o), D = .65 * i + .15 * w - .18 * o, O += .15 * o + .08 * (w - .5), k = 1 - .15 * o;
				break;
			}
			case `brick`: {
				let t = Math.floor(l * 8), n = fract(e * 4 + t % 2 * .5), i = fract(l * 8), o = smooth(clamp((Math.min(n, 1 - n, i * .5, (1 - i) * .5) - .014) / .045));
				E = .25 + .42 * hash(Math.floor(e * 4 + t % 2 * .5) % 4, t, r) + .2 * w, D = o * (.75 + .15 * w + .1 * T), A = 1 - o, O += .09 * A + .05 * (w - .5), k = .65 + .35 * o;
				break;
			}
			case `stone`: {
				let t = noise(e + .12 * C, l, 8, 8, r ^ 131);
				E = clamp(.1 + .65 * t + .3 * w), D = .65 * t + .25 * w + .1 * T, O += .1 * (w - .5), k = .8 + .2 * smooth(D);
				break;
			}
			case `metal`: {
				let t = noise(e, l, 4, 64, r ^ 313), i = (.5 + .5 * Math.sin(n * l * 48 + a)) ** 16;
				E = .4 + .38 * t + .12 * C - .1 * i, D = .7 * t - .15 * i, O += .18 * t + .08 * i, k = 1 - .04 * i;
				break;
			}
			case `fabric`: {
				let t = e * 12, r = l * 12, i = Math.sin(Math.PI * fract(t)) ** 2, o = Math.sin(Math.PI * fract(r)) ** 2, s = (Math.floor(t) + Math.floor(r)) % 2 == 0, c = s ? i * (.6 + .4 * o) : o * (.6 + .4 * i), u = .5 + .5 * Math.sin(n * (s ? e : l) * 48 + a);
				E = .22 + .48 * c + .14 * w + .08 * u, D = .8 * c + .06 * u + .08 * w, O += .04 * (w - .5), k = .68 + .32 * c;
				break;
			}
			case `marble`: {
				let t = noise(e, l, 4, 4, r ^ 997), i = Math.exp(-Math.abs(Math.sin(n * (3 * e + 2 * l + .8 * t) + a)) * 16);
				E = clamp(.9 + .1 * C - .85 * i), D = .3 * C - .2 * i + .05 * w, O += .1 * i + .04 * (w - .5), k = 1 - .06 * i;
				break;
			}
			case `concrete`: {
				let t = fract(e * 3), n = fract(l * 3), a = 1 - smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .02) / .035)), o = hash(Math.floor(fract(e) * 40), Math.floor(fract(l) * 40), r);
				E = .28 + .5 * o * (1 - a) + .12 * w, D = (1 - a) * (.65 + .25 * o) + .05 * w, O += .14 * a + .06 * (o - .5), k = .62 + .38 * (1 - a);
				break;
			}
			case `tiles`: {
				let t = fract(e * 5), n = fract(l * 5), a = smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .018) / .028));
				E = .42 + .4 * hash(Math.floor(e * 5) % 5, Math.floor(l * 5) % 5, r) + .08 * w, D = a * (.82 + .1 * w), A = 1 - a, O += .42 * A + .04 * (w - .5), k = .58 + .42 * a;
				break;
			}
			case `leather`: {
				let n = smooth(clamp(1 - wrappedFeature(e, l, 14, r ^ 81) * 1.55));
				E = .24 + .52 * n + .12 * w, D = .12 + .72 * n + .06 * w, O += .16 * (1 - n) + .04 * (w - .5), k = .55 + .45 * n;
				break;
			}
			case `suede`: {
				let t = noise(e, l, 5, 7, r ^ 15639), n = noise(e + .012 * t, l + .004 * t, 96, 24, r ^ 24113), i = smooth(clamp((noise(e, l, 80, 80, r ^ 31331) - .57) / .35));
				E = .23 + .36 * t + .25 * n + .1 * w - .08 * i, D = .35 + .075 * n + .025 * t - .045 * i, O += .075 * (n - .5) + .035 * (t - .5), k = .985 - .035 * i + .01 * n;
				break;
			}
			case `snakeskin`: {
				let t = e * 10, n = l * 12, r = Math.floor(n), i = 0, a = 0, o = 0, s = 0;
				for (let e = -1; e <= 1; e++) {
					let c = r + e, l = (c % 2 + 2) % 2 * .5, u = Math.floor(t - l);
					for (let e = -1; e <= 1; e++) {
						let r = u + e, f = (r % 10 + 10) % 10, p = (c % 12 + 12) % 12, m = d[p * 10 + f], h = t - r - l - .5, g = n - c - .5;
						if (Math.abs(h) >= .48 || Math.abs(g) >= .64) continue;
						let v = clamp(1 - (Math.sqrt(h * h + .0016) / (.46 + .02 * m) + Math.sqrt(g * g + .0016) / (.61 + .03 * m)));
						if (v === 0) continue;
						let y = smooth(clamp(v / .18)), b = v * v, x = b * Math.exp(-h * h * 180);
						i += y, a += b, o += x, s += y * m;
					}
				}
				E = .13 + .4 * i + .2 * s + .1 * a + .04 * w, D = .04 + .64 * i + .2 * a + .065 * o + .012 * w, O += .12 * (1 - i) - .045 * a + .045 * (w - .5), k = .57 + .41 * i + .015 * a;
				break;
			}
			case `crocodile`: {
				let t = e * 4, i = l * 6, o = Math.floor(t), s = d[Math.floor(i) * 4 + o], c = (fract(t) - .5) / (.445 + .025 * s), u = (fract(i) - .5) / (.445 + .02 * s), f = clamp(1 - c * c * c * c - u * u * u * u), p = smooth(clamp(f / .36)), m = noise(e, l, 9, 11, r ^ 12115), h = (.5 + .5 * Math.sin(n * (19 * e + 13 * l + 1.7 * m) + a)) ** 12;
				E = .12 + p * (.37 + .22 * s + .1 * w - .12 * h), D = .035 + p * (.64 + .17 * f * f + .035 * s - .065 * h), O += .13 * (1 - p) + p * (.055 * h + .04 * (w - .5)), k = .53 + p * (.46 - .055 * h);
				break;
			}
			case `sand`: {
				let t = noise(e, l, 3, 3, r ^ 17), i = .5 + .5 * Math.sin(n * (l * 7 + .35 * t) + a), o = noise(e, l, 48, 48, r ^ 20973);
				E = .3 + .48 * i + .18 * o, D = .72 * i + .22 * o, O += .06 * (o - .5), k = .82 + .18 * i;
				break;
			}
			case `rust`: {
				let t = noise(e, l, 6, 6, r ^ 211), n = noise(e, l, 18, 18, r ^ 419), i = smooth(clamp((t * .7 + n * .3 - .32) / .28));
				E = i, D = .25 + .45 * (1 - i) * n - .2 * i * t, O += .22 * i + .05 * (n - .5), k = .7 + .3 * (1 - i), j = 1 - i;
				break;
			}
			case `snow`: {
				let t = noise(e, l, 3, 3, r ^ 17), n = hash(Math.floor(fract(e) * 48), Math.floor(fract(l) * 48), r) ** 8;
				E = clamp(.22 + .68 * t + .1 * n), D = .7 * t + .2 * n, O += .22 * n - .06 * t, k = .88 + .12 * t;
				break;
			}
			case `asphalt`:
			case `gravel`: {
				let i = t === `asphalt`, a = i ? 40 : 12, o = e * a, s = l * a, c = Math.floor(o), u = Math.floor(s), d = 0, f = 0, p = 0, m = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let l = c + t, h = u + e, g = (l % a + a) % a, _ = (h % a + a) % a, v = hash(g, _, r ^ 29873), y = hash(g, _, r ^ 27145) * n, b = Math.cos(y), x = Math.sin(y), S = o - l - .25 - .5 * hash(g, _, r), C = s - h - .25 - .5 * hash(g, _, r ^ 40503), T = i ? .22 + .21 * v : .46 + .17 * v, E = .7 + .3 * hash(g, _, r ^ 20973), D = (S * b + C * x) / E, O = C * b - S * x, k = Math.sqrt(D * D + O * O) + (w - .5) * (i ? .08 : .16), A = smooth(clamp((T - k) / .16)), j = clamp(1 - k / T);
					d = Math.max(d, A), m = Math.max(m, A * (.65 + .35 * j)), f += A * (.35 + .65 * v), p += A;
				}
				let h = f / Math.max(1, p);
				i ? (E = .06 + .58 * h + .1 * w + .06 * T, D = .58 * m + .18 * w + .24 * T, O += .08 * (1 - d) + .1 * (T - .5), k = .8 + .2 * d) : (E = .04 + .8 * h + .08 * T, D = m * (.84 + .16 * w) + .025 * T, O += .13 * (1 - d) + .1 * (T - .5), k = .42 + .58 * d);
				break;
			}
			case `cobblestone`: {
				let t = e + .012 * noise(e, l, 6, 8, r ^ 561), n = l + .009 * noise(e, l, 6, 8, r ^ 2323), i = Math.floor(fract(n) * 8), a = t * 6 + i % 2 * .5, o = fract(a), s = fract(n * 8), c = Math.abs(o - .5), u = Math.abs(s - .5) * .75, d = Math.max(0, c - .38), f = Math.max(0, u - .255), m = smooth(clamp((.12 - Math.sqrt(d * d + f * f) - .018) / .085)), h = hash((Math.floor(a) % 6 + 6) % 6, i, r), g = 1 - .65 * (c * c + u * u);
				E = .05 + m * (.25 + .48 * h + .12 * w) + .05 * T, D = m * (.76 * g + .16 * w + .08 * T), O += .17 * (1 - m) + .1 * (T - .5), k = .45 + .55 * m;
				break;
			}
			case `bark`: {
				let t = noise(e, l, 4, 6, r ^ 15127), n = noise(e + .035 * t, l, 18, 3, r ^ 33825), i = noise(e, l, 6, 18, r ^ 20883), a = smooth(clamp((n - .26) / .38)) * smooth(clamp((i - .18) / .22)), o = noise(e, l, 48, 12, r ^ 8571);
				E = .05 + a * (.43 + .33 * o + .13 * T), D = a * (.58 + .3 * o + .12 * w), O += .08 * (1 - a) + .1 * (T - .5), k = .42 + .58 * a;
				break;
			}
			case `moss`: {
				let t = noise(e, l, 4, 4, r ^ 7015), i = smooth(clamp(1 - wrappedFeature(fract(e + .025 * t), fract(l + .018 * t), 9, r ^ 25519) / .95)), a = noise(e, l, 18, 18, r ^ 37671), o = smooth(clamp((T - .25) / .5));
				E = .09 + .46 * i + .24 * a + .19 * o, D = .65 * i + (.09 + .14 * i) * o + .12 * w, O += .06 * (o - .5) - .08 * (1 - i), k = .52 + .36 * i + .12 * o;
				break;
			}
			case `mud`: {
				let t = noise(e, l, 4, 4, r ^ 29011), n = (e + .025 * t) * 7, i = (l + .025 * noise(e, l, 4, 4, r ^ 7993)) * 7, a = Math.floor(n), o = Math.floor(i), s = 4, c = 4;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let l = a + t, u = o + e, d = (l % 7 + 7) % 7, f = (u % 7 + 7) % 7, p = n - l - .3 - .4 * hash(d, f, r), m = i - u - .3 - .4 * hash(d, f, r ^ 40503), h = p * p + m * m;
					h < s ? (c = s, s = h) : h < c && (c = h);
				}
				let d = smooth(clamp((Math.sqrt(c) - Math.sqrt(s) - .025) / .13)), f = smooth(clamp((noise(e, l, 3, 3, r ^ 14561) - .25) / .5));
				E = .04 + d * (.52 - .24 * f + .17 * w) + .04 * T, D = d * (.48 + .16 * (1 - s)) + (.07 * w + .03 * T) * (1 - .75 * f), O -= .38 * f, O += .1 * (1 - d) + .08 * (T - .5) * (1 - f), k = .48 + .52 * d;
				break;
			}
			case `granite`: {
				let t = e * 38, n = l * 38, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0, c = 4, u = 4;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let d = i + l, f = a + e, p = (d % 38 + 38) % 38, m = (f % 38 + 38) % 38, h = t - d - .3 - .4 * hash(p, m, r), g = n - f - .3 - .4 * hash(p, m, r ^ 40503), _ = h * h + g * g;
					_ < c ? (u = c, c = _) : _ < u && (u = _);
					let v = clamp(1 - _ / 1.44) ** 10, y = hash(p, m, r ^ 25643);
					o += v * (y < .24 ? .08 + y : .48 + .5 * y), s += v;
				}
				let d = o / Math.max(s, 1e-12), f = 1 - smooth(clamp((Math.sqrt(u) - Math.sqrt(c)) / .16));
				E = clamp(.04 + .88 * d + .1 * (T - .5) - .07 * f), D = .35 * d + .17 * T - .12 * f, O += .16 * (1 - d) + .06 * (T - .5), k = .97 - .025 * f + .03 * T;
				break;
			}
			case `slate`: {
				let t = noise(e, l, 5, 4, r ^ 16743), n = noise(e + .025 * t, l + .018 * t, 3, 22, r ^ 29723) * 5, i = (Math.floor(n) + smooth(clamp((fract(n) - .35) / .3))) / 5, a = noise(e, l, 12, 5, r ^ 4955), o = (1 - Math.abs(2 * fract(n) - 1)) ** 8 * smooth(clamp((a - .18) / .35));
				E = .14 + .62 * i + .14 * T - .12 * o, D = .72 * i + .1 * T - .18 * o, O += .1 * o + .1 * (T - .5), k = .98 - .15 * o + .02 * T;
				break;
			}
			case `terrazzo`: {
				let t = e * 9, i = l * 9, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let d = a + l, f = o + e, p = (d % 9 + 9) % 9, m = (f % 9 + 9) % 9, h = hash(p, m, r ^ 37499), g = hash(p, m, r ^ 13341) * n, _ = Math.cos(g), v = Math.sin(g), y = t - d - .3 - .4 * hash(p, m, r), b = i - f - .3 - .4 * hash(p, m, r ^ 40503), x = y * _ + b * v, S = b * _ - y * v, C = .75 + .25 * hash(p, m, r ^ 8623), w = Math.max(Math.abs(x) * C, Math.abs(S), (x * .65 + S * .76) * 1.1, (-x * .83 + S * .55) * 1.15), E = smooth(clamp((.26 + .18 * h - w) / .025));
					s = Math.max(s, E), c += E * (.08 + .7 * hash(p, m, r ^ 22815)), u += E;
				}
				let d = c / Math.max(u, 1e-12);
				E = (.88 + .06 * w) * (1 - s) + s * d, D = .15 + .06 * s + .015 * w + .025 * T, O += .055 * (1 - s) - .03 * s * d + .04 * (T - .5), k = .98 + .015 * s + .005 * T;
				break;
			}
			case `denim`: {
				let t = e * 24, i = l * 24, o = .5 + .5 * Math.cos(n * t), s = .5 + .5 * Math.cos(n * i), c = 1 - smooth(clamp((Math.abs(Math.sin(Math.PI * (t - i) / 4)) - .24) / .22)), u = .5 + .5 * Math.sin(n * (96 * e + .12 * w) + a), d = .5 + .5 * Math.sin(n * (96 * l + .12 * w) + a), f = u * (1 - c) + d * c, p = o * (1 - c) + s * c, m = noise(e, l, 24, 4, r ^ 27953);
				E = .12 + .22 * p + .34 * c + .1 * f + .12 * m, D = .42 * p + .24 * (1 - c) + .06 * f + .08 * m, O += .06 * (w - .5) + .04 * (1 - p), k = .78 + .18 * p + .04 * f;
				break;
			}
			case `herringbone`: {
				let t = 32 * e, i = 32 * l, o = Math.acos(.995 * Math.cos(n * 2 * e)) / Math.PI, s = smooth(clamp((.5 + .5 * Math.cos(n * (2 * o - 8 * l) + a) - .2) / .6)), c = .5 + .5 * Math.cos(n * t), u = .5 + .5 * Math.cos(n * i), d = c * (1 - s) + u * s, f = (.5 + .5 * Math.sin(n * 128 * e + a)) * (1 - s) + (.5 + .5 * Math.sin(n * 128 * l - a)) * s, p = noise(e, l, 16, 8, r ^ 15385);
				E = .17 + .31 * s + .26 * d + .1 * f + .09 * p, D = .25 + .24 * d + .07 * s + .035 * f + .025 * p, O += .055 * (w - .5) + .035 * (1 - d), k = .84 + .12 * d + .025 * f;
				break;
			}
			case `tweed`: {
				let t = 20 * e, i = 20 * l, o = smooth(clamp((Math.cos(n * t) + .45) / 1.25)), s = smooth(clamp((Math.cos(n * i) + .45) / 1.25)), c = smooth(clamp(.5 + .85 * Math.cos(Math.PI * (t + i)))), u = o * (1 - s + s * c), d = s * (1 - o + o * (1 - c)), f = u + d, p = u * noise(e, l, 20, 4, r ^ 15127) + d * noise(e, l, 4, 20, r ^ 28201), m = u * (.5 + .5 * Math.sin(n * (80 * e + .15 * w) + a)) + d * (.5 + .5 * Math.sin(n * (80 * l + .15 * w) - a)), h = e * 24, g = l * 24, _ = Math.floor(h), v = Math.floor(g), y = 0, b = .12 + .29 * f + .34 * p + .12 * m;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = _ + t, i = v + e, a = (n % 24 + 24) % 24, o = (i % 24 + 24) % 24, s = hash(a, o, r ^ 11635), c = h - n - .25 - .5 * hash(a, o, r), l = g - i - .25 - .5 * hash(a, o, r ^ 23089), u = (s < .5 ? 0 : Math.PI / 2) + (s - .5) * .7, d = Math.cos(u), f = Math.sin(u), p = (c * d + l * f) / (.18 + .2 * s), m = (l * d - c * f) / .075, x = clamp(1 - p * p - m * m), S = x * x;
					y += S, b += S * (.18 + .64 * hash(a, o, r ^ 32537) - b);
				}
				E = b, D = .2 + .28 * f + .08 * o * s + .05 * m + .055 * y, O += .05 * (w - .5) + .025 * y, k = .77 + .19 * f + .025 * m;
				break;
			}
			case `seersucker`: {
				let t = smooth(clamp((Math.cos(n * 4 * e) + .25) / .75)), i = .5 + .5 * Math.cos(n * 48 * e), o = .5 + .5 * Math.cos(n * 48 * l), s = .5 + .5 * Math.cos(Math.PI * 48 * (e + l)), c = i * s + o * (1 - s), u = .5 + .25 * Math.sin(n * 144 * e + a) + .25 * Math.sin(n * 144 * l - a), d = noise(e, l, 4, 4, r ^ 19513), f = .5 + .5 * Math.sin(n * (12 * l + .22 * Math.sin(n * 4 * e) + .3 * d) + a);
				E = .71 - .39 * t + .12 * c + .055 * u + .04 * t * f, D = .22 + .035 * c + .008 * u + t * (.08 + .2 * f), O += .045 * (w - .5) + .025 * t * (1 - f), k = .96 - .07 * t * (1 - f) + .02 * c;
				break;
			}
			case `burlap`: {
				let t = e * 10, r = l * 10, i = smooth(clamp((Math.cos(n * t) + .35) / 1.1)), o = smooth(clamp((Math.cos(n * r) + .35) / 1.1)), s = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t + r)))), c = i * (1 - o + o * s), u = o * (1 - i + i * (1 - s)), d = c + u, f = .5 + .5 * Math.sin(n * (50 * e + .14 * w) + a), p = .5 + .5 * Math.sin(n * (50 * l + .14 * w) + a), m = c * f + u * p, h = i * o;
				E = .04 + .65 * d + .14 * m + .1 * w * d, D = .58 * d + .2 * h + .08 * m + .04 * w, O += .05 * (w - .5) + .025 * (1 - d), k = .42 + .54 * d + .04 * m;
				break;
			}
			case `carpet`: {
				let t = e * 24, i = l * 24, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let f = a + l, p = o + e, m = (f % 24 + 24) % 24, h = (p % 24 + 24) % 24, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), y = clamp(1 - (g * g + _ * _)) ** 3, b = hash(m, h, r ^ 10571), x = hash(m, h, r ^ 26655) * n, S = (.5 + .5 * Math.sin(n * 3 * (g * Math.cos(x) + _ * Math.sin(x)) + b * n)) ** 4;
					s += y, c += y * b, u += y * S, d = Math.max(d, y * (.75 + .25 * b));
				}
				let f = 1 / Math.max(s, 1e-12), p = c * f, m = u * f;
				E = .19 + .4 * p + .2 * d + .13 * m + .08 * w, D = .3 + .38 * d + .12 * m + .1 * w, O += .04 * (w - .5) - .035 * m, k = .7 + .22 * Math.sqrt(d) + .06 * m;
				break;
			}
			case `plaster`: {
				let t = noise(e, l, 3, 3, r ^ 14241), i = (.5 + .5 * Math.sin(n * (3 * e + 2 * l + .7 * t) + a)) ** 10, o = noise(e, l, 18, 5, r ^ 21721), s = smooth(clamp((.32 - T) / .23));
				E = .61 + .2 * t + .08 * o + .07 * i - .12 * s, D = .22 + .28 * t + .18 * i + .08 * o - .14 * s, O += .1 * (T - .5) - .065 * i + .045 * s, k = .98 - .1 * s - .025 * i;
				break;
			}
			case `terracotta`: {
				let t = noise(e, l, 5, 5, r ^ 14871), n = noise(e + .04 * t, l, 12, 9, r ^ 32035), a = 1 - smooth(clamp((wrappedFeature(e, l, 28, r ^ 18541) - .04) / .19)), o = smooth(clamp((t - .5) / .3));
				E = .37 + .46 * n + .15 * w - .18 * o - .17 * a, D = .35 + .14 * w + .12 * T - .3 * a, O += .1 * (T - .5) + .07 * a - .04 * o, k = .97 - .22 * a + .025 * T;
				break;
			}
			case `cork`: {
				let t = e * 14, i = l * 14, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let f = a + l, p = o + e, m = (f % 14 + 14) % 14, h = (p % 14 + 14) % 14, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), v = n * hash(m, h, r ^ 19745), y = g * Math.cos(v) + _ * Math.sin(v), b = _ * Math.cos(v) - g * Math.sin(v), S = clamp(1 - (.9 * y * y + 1.3 * b * b) / 1.21) ** 8, C = hash(m, h, r ^ 5931), w = (.5 + .5 * Math.sin(n * (5 * b + .3 * y) + n * C)) ** 12;
					s += S, c += S * C, d += S * w, u = Math.max(u, S);
				}
				let f = 1 / Math.max(s, 1e-12), p = c * f, m = d * f, h = 1 - smooth(clamp((u * f - .48) / .4));
				E = .31 + .57 * p + .12 * w - .22 * h - .09 * m, D = .4 + .16 * p + .07 * T - .2 * h - .07 * m, O += .07 * (T - .5) + .045 * h - .025 * p, k = .97 - .18 * h - .08 * m;
				break;
			}
			case `rubber`: {
				let n = 1 - smooth(clamp((wrappedFeature(e, l, 44, r ^ 36435) - .08) / .55));
				E = .19 + .38 * n + .19 * T + .1 * w, D = .19 + .49 * n + .15 * T + .06 * w, O += .12 * (T - .5) - .045 * n, k = .9 + .08 * n + .02 * T;
				break;
			}
			case `carbonfiber`: {
				let t = 12 * (e + l), r = 12 * (l - e), i = .5 + .5 * Math.cos(n * t), o = .5 + .5 * Math.cos(n * r), s = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t - r) / 2))), c = .5 + .5 * Math.sin(n * (4 * t + .08 * w) + a), u = .5 + .5 * Math.sin(n * (4 * r + .08 * w) + a), d = i * s + o * (1 - s), f = c * s + u * (1 - s);
				E = .12 + .46 * d + .2 * f + .12 * w, D = .25 + .37 * d + .055 * f + .04 * w, O += .065 * (w - .5) + .045 * (1 - d), k = .88 + .1 * d + .02 * f;
				break;
			}
			case `diamondplate`: {
				let t = e * 8, n = l * 8, i = fract(t) - .5, a = fract(n) - .5, o = (Math.floor(t) + Math.floor(n)) % 2 == 0 ? 1 : -1, s = (i + o * a) * Math.SQRT1_2, c = (a - o * i) * Math.SQRT1_2, d = smooth(clamp((1 - (Math.abs(s) / .48 + Math.abs(c) / .14)) / .24)), f = noise(e, l, 4, 64, r ^ 13793);
				E = .35 + .25 * f + .29 * d + .07 * w, D = .08 + .78 * d + .025 * f, O += .14 * (f - .5) - .075 * d, k = .94 + .05 * d + .01 * w;
				break;
			}
			case `knurledmetal`: {
				let t = smooth(.5 - .5 * Math.cos(n * 24 * (e + l))) * smooth(.5 - .5 * Math.cos(n * 24 * (e - l)));
				E = .29 + .48 * t + .16 * w, D = .12 + .72 * t + .025 * w, O += .1 * (w - .5) + .07 * (1 - t), k = .85 + .14 * t;
				break;
			}
			case `engineturned`: {
				let t = e * 6, r = l * 6, i = Math.floor(t), a = Math.floor(r), o = 0, s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let u = i + l, d = a + e, p = (u % 6 + 6) % 6, m = (d % 6 + 6) % 6, h = t - u - .25 - m % 2 * .5, g = r - d - .5, _ = h * h + g * g, v = Math.max(0, 1 - _ / .9025), y = v * v, b = (m * 6 + p) * 2, x = f[b], S = .5 + .5 * Math.cos(n * (10 * _ + x + .18 * h * g));
					o += y, s += y * S, c += y * f[b + 1];
				}
				s /= o, c /= o, E = .35 + .34 * c + .22 * s + .04 * w, D = .44 + .07 * s + .025 * w, O += .18 * (s - .5) + .12 * (c - .5), k = .98 + .015 * s;
				break;
			}
			case `goldleaf`: {
				let t = noise(e, l, 4, 5, r ^ 19843), i = e + .035 * Math.sin(n * l * 3 + a), o = l + .03 * Math.sin(n * e * 4 + a), s = noise(i, o, 4, 5, r ^ 7769), c = smooth(clamp((Math.cos(n * 4 * i) - .92) / .08)), u = smooth(clamp((Math.cos(n * 5 * o) - .92) / .08)), d = c + (1 - c) * u, f = (.5 + .5 * Math.cos(n * (18 * e + 7 * l + 1.7 * t) + a)) ** 8, p = (.5 + .5 * Math.cos(n * (5 * e - 21 * l + 1.3 * s) - a)) ** 10, m = .6 * f + .4 * p;
				E = .4 + .3 * s + .19 * m - .1 * d, D = .36 + .34 * m + .065 * d + .04 * w, O += .12 * (s - .5) + .11 * m + .025 * d, k = .99 - .065 * m - .025 * d;
				break;
			}
			case `paper`: {
				let t = noise(e, l, 3, 5, r ^ 33207), i = noise(e, l, 48, 48, r ^ 22483), a = e * 24, o = l * 24, s = Math.floor(a), c = Math.floor(o), u = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let i = s + t, l = c + e, d = (i % 24 + 24) % 24, f = (l % 24 + 24) % 24, p = a - i - .35 - .3 * hash(d, f, r), m = o - l - .35 - .3 * hash(d, f, r ^ 6463), h = n * hash(d, f, r ^ 29409), g = p * Math.cos(h) + m * Math.sin(h), _ = m * Math.cos(h) - p * Math.sin(h), v = .42 + .28 * hash(d, f, r ^ 23337), b = clamp(1 - (g * g / (v * v) + _ * _ / .0064)) ** 2;
					u = Math.max(u, b);
				}
				E = .62 + .24 * t + .1 * i - .2 * u, D = .22 + .12 * t + .22 * i + .3 * u, O += .08 * (i - .5) + .04 * u, k = .98 - .07 * u - .035 * (1 - i);
				break;
			}
			case `wicker`: {
				let t = e * 6, i = l * 6, a = .5 + .5 * Math.cos(n * t), o = .5 + .5 * Math.cos(n * i), s = smooth(clamp((Math.cos(n * t) + .92) / .3)), c = smooth(clamp((Math.cos(n * i) + .92) / .3)), u = smooth(clamp(.5 + 1.4 * Math.cos(Math.PI * t) * Math.cos(Math.PI * i))), d = s * (1 - c + c * u), f = c * (1 - s + s * (1 - u)), p = d + f, m = noise(e, l, 72, 4, r ^ 28465), h = noise(e, l, 4, 72, r ^ 10903), g = d * m + f * h, _ = d * a + f * o;
				E = .08 + .5 * p + .16 * _ + .18 * g, D = .04 + .48 * p + .32 * _ + .045 * g, O += .1 * (w - .5) + .1 * (1 - p) - .04 * g, k = .34 + .54 * p + .1 * _;
				break;
			}
			case `bamboo`: {
				let t = noise(e, l, 64, 4, r ^ 19313), i = noise(e, l, 4, 3, r ^ 26909), o = .5 + .5 * Math.sin(n * (48 * e + .22 * i) + a), s = noise(e, 0, 4, 1, r ^ 10453), c = 1 - Math.cos(n * (3 * l + .65 * s + .07 * Math.sin(n * 4 * e)) + a), u = 1 - smooth(clamp(c / .16)), d = 1 - smooth(clamp(c / .42));
				E = .46 + .23 * t + .16 * o + .08 * w - .34 * u, D = .3 + .14 * t + .12 * o + .16 * d - .1 * u, O += .12 * u + .1 * (t - .5) - .035 * o, k = .99 - .14 * u - .025 * (1 - t);
				break;
			}
			case `hammeredmetal`: {
				let t = e * 12, n = l * 12, i = Math.floor(t), a = Math.floor(n), o = 0;
				for (let e = -1; e <= 1; e++) for (let s = -1; s <= 1; s++) {
					let c = i + s, l = a + e, u = (c % 12 + 12) % 12, d = (l % 12 + 12) % 12, f = t - c - .35 - .3 * hash(u, d, r), p = n - l - .35 - .3 * hash(u, d, r ^ 29339), m = .85 + .25 * hash(u, d, r ^ 6461), h = clamp(1 - (f * f + p * p) / (m * m));
					o += h * h * (.7 + .3 * hash(u, d, r ^ 23063));
				}
				let s = 1 - Math.exp(-1.6 * o), c = noise(e, l, 4, 4, r ^ 20001);
				E = .72 - .32 * s + .14 * c + .045 * w, D = .85 - .7 * s + .008 * w, O += .1 * (c - .5) + .09 * s, k = .99 - .12 * s;
				break;
			}
			case `galvanized`: {
				let t = e * 10, i = l * 10, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let d = a + l, f = o + e, p = (d % 10 + 10) % 10, m = (f % 10 + 10) % 10, h = t - d - .35 - .3 * hash(p, m, r), g = i - f - .35 - .3 * hash(p, m, r ^ 15225), _ = n * hash(p, m, r ^ 22435), v = h * Math.cos(_) + g * Math.sin(_), y = g * Math.cos(_) - h * Math.sin(_), b = clamp(1 - (h * h + g * g) / 1.21) ** 8, x = hash(p, m, r ^ 18897), S = .5 + .5 * Math.cos(n * (3 * y + 1.5 * Math.abs(v)));
					s += b, c += b * x, u += b * S;
				}
				let d = 1 / Math.max(s, 1e-12), f = c * d, p = u * d;
				E = .18 + .65 * f + .12 * p + .035 * w, D = .3 + .18 * f + .035 * p + .015 * w, O += .24 * (f - .5) + .045 * (p - .5), k = .98 + .02 * f;
				break;
			}
			case `corrugatedmetal`: {
				let t = .5 + .5 * Math.cos(n * 8 * e + a), i = noise(e, l, 64, 4, r ^ 8043), o = (.5 + .5 * Math.sin(n * 48 * e + a)) ** 12;
				E = .5 + .2 * t + .16 * i - .06 * o, D = .1 + .8 * t + .004 * i - .002 * o, O += .13 * (i - .5) + .06 * o, k = .91 + .08 * t;
				break;
			}
			case `sandstone`: {
				let t = noise(e, l, 3, 5, r ^ 26941), i = l + .055 * (t - .5), o = .5 + .5 * Math.sin(8 * i * n + a), s = (.5 + .5 * Math.sin(19 * i * n + a)) ** 6, c = noise(e, l, 8, 3, r ^ 19735), u = smooth(clamp((T - .28) / .48)), d = (1 - T) ** 5;
				E = .22 + .35 * o + .2 * c + .18 * u - .2 * s, D = .32 + .16 * o - .09 * s + .24 * u - .1 * d, O += .12 * (u - .5) + .05 * s, k = .97 - .12 * s - .13 * d + .025 * u;
				break;
			}
			case `travertine`: {
				let t = e * 12, i = l * 18, o = Math.floor(t), s = Math.floor(i), c = 0;
				for (let e = -1; e <= 1; e++) for (let a = -1; a <= 1; a++) {
					let l = o + a, u = s + e, d = (l % 12 + 12) % 12, f = (u % 18 + 18) % 18, p = hash(d, f, r ^ 24211), m = (hash(d, f, r ^ 9169) - .5) * .36, h = Math.cos(m), g = Math.sin(m), _ = t - l - .2 - .6 * hash(d, f, r), v = i - u - .2 - .6 * hash(d, f, r ^ 31513), y = _ * h + v * g, b = v * h - _ * g, x = .42 + .36 * p, S = .11 + .13 * hash(d, f, r ^ 36657), w = smooth(clamp((1 - (y * y / (x * x) + b * b / (S * S) + .12 * Math.sin(9 * y + p * n) * Math.sin(13 * b))) / .65));
					c += w * (.65 + .35 * p);
				}
				let u = 1 - Math.exp(-1.8 * c), d = noise(e, l, 3, 3, r ^ 16855), f = .5 + .5 * Math.sin(n * (6 * l + .18 * d) + a);
				E = .65 + .12 * f + .09 * T - .48 * u, D = .62 + .05 * f + .04 * T - .3 * u, O += .15 * u + .08 * (T - .5), k = .98 - .42 * u;
				break;
			}
			case `pumice`: {
				let t = e * 26, n = l * 26, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 26 + 26) % 26, f = (u % 26 + 26) % 26, p = t - l - .15 - .7 * hash(d, f, r), m = n - u - .15 - .7 * hash(d, f, r ^ 25375), h = .24 + .2 * hash(d, f, r ^ 14521), g = (p * p + m * m) / (h * h), _ = clamp(1 - g), v = _ * _;
					o = Math.max(o, v), s = Math.max(s, 6 * g * v);
				}
				E = .65 + .12 * noise(e, l, 5, 5, r ^ 40007) + .08 * T - .57 * o + .05 * s, D = .72 - .58 * o + .08 * s + .03 * T, O += .07 * o + .07 * (T - .5), k = .98 - .52 * o + .01 * w;
				break;
			}
			case `parquet`: {
				let t = e * 4, a = l * 4, o = Math.floor(t), s = Math.floor(a), c = (o + s) % 2 == 0, u = fract(c ? t : a), d = fract(c ? a : t), f = Math.floor(d * 3), m = smooth(clamp((Math.min(u, 1 - u, fract(d * 3) / 3, (1 - fract(d * 3)) / 3) - .006) / .016)), h = hash(o * 3 + f, s, r), g = noise(e, l, 8, 8, r ^ 14105), _ = .5 + .5 * Math.sin(n * (d * 38 + .28 * Math.sin(n * u) + .18 * g) + h * n);
				E = .06 + m * (.25 + .32 * h + .22 * _ + .06 * w), D = m * (.76 + .045 * _ + .025 * w), O = .78 + m * (i.roughness - .78 + .09 * _ + .04 * h), k = .52 + .46 * m;
				break;
			}
			case `mosaic`: {
				let t = e * 16, n = l * 16, a = fract(t), o = fract(n), c = smooth(clamp((Math.min(a, 1 - a, o, 1 - o) - .018) / .042)), u = hash(Math.floor(t), Math.floor(n), r);
				E = .2 + c * (.08 + .56 * u + .1 * w), D = c * (.78 + .08 * u + .025 * w), O = .76 + c * (i.roughness - .76 + .11 * u + .04 * w), k = .6 + .39 * c, A = 1 - c;
				break;
			}
			case `hexagontiles`: {
				let t = Math.sqrt(3), n = e * 5, a = l * 6 * t / 2, o = Math.floor(a / (t / 2)), s = 1 / 0, c = 0, u = 0, d = 0, f = 0;
				for (let e = -1; e <= 1; e++) {
					let r = o + e, i = (r % 2 + 2) % 2 * .5, l = Math.round(n - i);
					for (let e = -1; e <= 1; e++) {
						let o = l + e, p = n - o - i, m = a - r * t / 2, h = p * p + m * m;
						h < s && (s = h, c = p, u = m, d = (o % 5 + 5) % 5, f = (r % 6 + 6) % 6);
					}
				}
				let m = smooth(clamp((.5 - Math.max(Math.abs(c), Math.abs(c * .5 + u * t / 2), Math.abs(c * .5 - u * t / 2)) - .012) / .034)), h = hash(d, f, r);
				E = .2 + m * (.28 + .35 * h + .07 * w), D = m * (.8 + .045 * h + .02 * w), O = .74 + m * (i.roughness - .74 + .1 * h + .04 * w), k = .6 + .39 * m, A = 1 - m;
				break;
			}
			case `knit`: {
				let t = e * 8, r = l * 8, i = Math.floor(t), o = Math.floor(r), s = 0;
				for (let e = -1; e <= 1; e += 2) {
					let n = t - i - .5, a = r - o - .84, c = e * .34, l = -.68, u = clamp((n * c + a * l) / (c * c + l * l)), d = n - u * c, f = a - u * l, m = smooth(clamp(1 - (d * d + f * f) / .0169));
					s += (1 - s) * m;
				}
				let c = .5 + .25 * Math.sin(n * (48 * e + 24 * l) + a) + .25 * Math.sin(n * (48 * e - 24 * l) - a);
				E = .12 + .64 * s + .1 * w + .07 * s * c, D = .08 + s * (.76 + .045 * c) + .025 * w, O += .065 * (w - .5) + .035 * (1 - s), k = .58 + .41 * s;
				break;
			}
			case `corduroy`: {
				let t = (.5 + .5 * Math.cos(n * e * 12)) ** .65, i = noise(e, l, 96, 96, r ^ 11121), a = noise(e, l, 12, 48, r ^ 31907);
				E = .12 + .57 * t + .16 * i + .08 * a, D = .07 + .79 * t + .035 * i + .025 * a, O += .08 * (i - .5) + .035 * (1 - t), k = .57 + .42 * t;
				break;
			}
			case `felt`: {
				let t = e * 20, i = l * 20, a = Math.floor(t), o = Math.floor(i), s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = a + c, u = o + e, d = (l % 20 + 20) % 20, f = (u % 20 + 20) % 20, p = t - l - .25 - .5 * hash(d, f, r), m = i - u - .25 - .5 * hash(d, f, r ^ 41845), h = hash(d, f, r ^ 27415) * n, g = Math.cos(h), _ = Math.sin(h), v = (p * g + m * _) / .6, y = (m * g - p * _) / .055, b = clamp(1 - v * v - y * y);
					s += (1 - s) * b * b;
				}
				E = .28 + .28 * w + .3 * s, D = .18 + .035 * w + .065 * s, O += .065 * (w - .5) + .025 * s, k = .96 + .025 * s + .01 * w;
				break;
			}
			case `wafflecloth`: {
				let t = smooth(clamp((Math.cos(n * e * 8) - .35) / .65)), i = smooth(clamp((Math.cos(n * l * 8) - .35) / .65)), o = t + i - t * i, s = .5 + .25 * Math.cos(n * e * 96 + a) + .25 * Math.cos(n * l * 96 - a), c = noise(e, l, 24, 24, r ^ 19059);
				E = .22 + .48 * o + .12 * s + .08 * c, D = .12 + .66 * o + .035 * s + .025 * c, O += .04 * (c - .5) + .025 * (1 - o), k = .65 + .32 * o + .02 * s;
				break;
			}
			case `cableknit`: {
				let t = fract(e * 4), i = l * 4, o = .22 * Math.sin(n * i), s = .5 + .5 * Math.cos(n * i), c = (t - .5 - o) / .115, u = (t - .5 + o) / .115, d = smooth(clamp(1 - c * c)), f = smooth(clamp(1 - u * u)), p = d + f - d * f, m = d * (.38 + .38 * s), h = f * (.76 - .38 * s), g = m + h - m * h, _ = smooth(clamp((Math.cos(n * t) - .5) / .5)), v = .5 + .5 * Math.cos(n * (l * 32 + .35 * Math.cos(n * t))), y = noise(e, l, 64, 64, r ^ 14249), b = .5 + .5 * Math.sin(n * (e * 96 + l * 48) + a);
				E = .13 + .55 * g + .13 * _ + .09 * y + .04 * p * b, D = .07 + g + .17 * _ * (.65 + .35 * v) + .02 * y + .015 * p * b, O += .035 * (y - .5) + .025 * (1 - p), k = .57 + .35 * p + .055 * _ + .015 * y;
				break;
			}
			case `quilting`: {
				let t = (e + l) * 6, i = (e - l) * 6, o = .5 - .5 * Math.cos(n * t), s = .5 - .5 * Math.cos(n * i), c = o * s, u = smooth(clamp(1 - o / .055)), d = smooth(clamp(1 - s / .055)), f = u + d - u * d, p = smooth(clamp((Math.cos(n * i * 8) - .2) / .8)), m = smooth(clamp((Math.cos(n * t * 8) - .2) / .8)), h = u * p + d * m - u * p * d * m, g = .5 + .25 * Math.cos(n * e * 96 + a) + .25 * Math.cos(n * l * 96 - a), _ = noise(e, l, 24, 24, r ^ 27441);
				E = .3 + .32 * c - .15 * f + .12 * h + .08 * _ + .06 * g, D = .13 + .67 * c - .065 * f + .035 * h + .02 * g + .015 * _, O += .045 * (_ - .5) + .025 * f, k = .88 + .1 * c - .18 * f + .025 * h;
				break;
			}
			case `roofshingles`: {
				let t = Math.floor(l * 6), n = fract(l * 6), i = e * 4 + t % 2 * .5, a = fract(i), o = smooth(clamp(Math.min(n, 1 - n) / .12)), s = smooth(clamp(Math.min(a, 1 - a) / .055)), c = (1 - s) * smooth(clamp((n - .32) / .16)) * o, u = o * s, d = hash(Math.floor(i) % 4, t, r ^ 25527), f = smooth(clamp((noise(e, l, 64, 64, r ^ 19765) - .2) / .6)), p = 1 - o;
				E = .24 + .32 * f + .2 * u * d - .15 * p - .14 * c, D = .2 + .38 * o - .2 * c + .13 * f + .05 * u * d, O += .12 * (f - .5) + .04 * p + .03 * c, k = .96 - .24 * p - .2 * c + .025 * f;
				break;
			}
			case `rooftiles`: {
				let t = fract(e * 6 + .5), i = fract(l * 5), a = .5 + .5 * Math.cos(n * e * 6), o = smooth(clamp(Math.min(i, 1 - i) / .13)), s = o * smooth(clamp(Math.min(t, 1 - t) / .12)), c = hash(Math.floor(e * 6 + .5) % 6, Math.floor(l * 5), r ^ 31297), u = noise(e, l, 24, 32, r ^ 23591), d = 1 - o;
				E = .26 + .24 * a + .23 * s * c + .14 * u - .14 * d, D = .16 + .65 * a - .1 * d + .035 * s * c + .012 * u, O += .13 * (u - .5) + .05 * (1 - a) + .045 * d, k = .76 + .22 * a - .14 * d + .015 * u;
				break;
			}
			case `stucco`: {
				let t = e * 28, n = l * 28, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 28 + 28) % 28, f = (u % 28 + 28) % 28, p = hash(d, f, r ^ 17337), m = t - l - .2 - .6 * hash(d, f, r), h = n - u - .2 - .6 * hash(d, f, r ^ 6083), g = .3 + .25 * p, _ = clamp(1 - (m * m + h * h * (.7 + p)) / (g * g)), v = _ * _;
					p < .28 ? s += (1 - s) * v : o += (1 - o) * v;
				}
				let c = noise(e, l, 5, 7, r ^ 21373);
				E = .52 + .15 * c + .19 * o - .24 * s + .08 * w, D = .27 + .16 * c + .43 * o - .22 * s + .06 * w, O += .055 * o + .065 * s + .05 * (w - .5), k = .96 - .25 * s - .075 * o + .02 * w;
				break;
			}
			case `lichen`: {
				let t = e * 7, i = l * 7, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let u = a + l, d = o + e, f = (u % 7 + 7) % 7, p = (d % 7 + 7) % 7, m = t - u - .25 - .5 * hash(f, p, r), h = i - d - .25 - .5 * hash(f, p, r ^ 29107), g = Math.atan2(h, m), _ = hash(f, p, r ^ 15449), v = (.38 + .16 * _) * (1 + .13 * Math.cos(5 * g + _ * n) + .09 * Math.sin(3 * g - _ * n)), y = smooth(clamp((1 - Math.hypot(m, h) / v) / .18));
					s += (1 - s) * y, c += y * (_ - .5);
				}
				let u = smooth(clamp((noise(e, l, 96, 96, r ^ 27171) - .58) / .25));
				E = .16 + .13 * w + .53 * s + .07 * Math.tanh(c) - .18 * s * u, D = .15 + .035 * w + s * (.48 - .17 * u), O += .04 * (w - .5) + .035 * s * u, k = .9 + .08 * s - .15 * s * u;
				break;
			}
			case `leaflitter`: {
				let t = e * 6, i = l * 6, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let d = a + l, f = o + e, p = (d % 6 + 6) % 6, m = (f % 6 + 6) % 6, h = t - d - .2 - .6 * hash(p, m, r), g = i - f - .2 - .6 * hash(p, m, r ^ 10679), _ = hash(p, m, r ^ 20273) * n, v = Math.cos(_), y = Math.sin(_), b = hash(p, m, r ^ 20905), x = (h * v + g * y) / (.64 + .1 * b), S = (g * v - h * y) / (.26 + .05 * b), C = smooth(clamp((1 - x * x - Math.sqrt(S * S + 1e-4)) / .18)), w = C * Math.exp(-S * S * 260);
					s += (1 - s) * C, u += (1 - u) * w, c += C * (b - .5);
				}
				E = .07 + .09 * w + .56 * s + .16 * Math.tanh(c) - .12 * u, D = .08 + .035 * w + .61 * s + .045 * u, O += .07 * (w - .5) + .045 * (1 - s), k = .53 + .44 * s;
				break;
			}
			case `endgrain`: {
				let t = fract(e - o + .5) - .5, i = fract(l - s + .5) - .5, c = Math.sin(Math.PI * t) / Math.PI, u = Math.sin(Math.PI * i) / Math.PI, d = Math.sqrt(c * c + u * u + 4e-4), f = noise(e, l, 5, 5, r ^ 31811), p = (.5 + .5 * Math.sin(n * (23 * d + .23 * f) + a)) ** 6, m = smooth(clamp((noise(e, l, 96, 96, r ^ 5607) - .62) / .23)), h = Math.hypot(t, i), g = smooth(clamp((h - .07) / .08)) * smooth(clamp((.43 - h) / .08)) * (.5 + .5 * Math.cos(7 * Math.atan2(i, t) + a)) ** 48;
				E = .76 - .37 * p - .2 * m - .24 * g + .08 * w, D = .49 - .07 * p - .16 * m - .22 * g + .025 * w, O += .13 * m + .06 * p + .045 * (w - .5), k = .99 - .17 * m - .22 * g;
				break;
			}
			case `acousticfoam`: {
				let t = fract(e * 4) - .5, n = fract(l * 4) - .5, i = Math.sqrt(t * t + 1e-4), a = Math.sqrt(n * n + 1e-4), s = clamp(1 - 2 * (.5 * (i + a + Math.sqrt((i - a) ** 2 + 4e-4)))), c = s < .1 ? s * s * 5 : s > .9 ? .9 - (1 - s) * (1 - s) * 5 : s - .05, u = hash(Math.floor(e * 4), Math.floor(l * 4), r ^ 14289), d = smooth(clamp((noise(e, l, 96, 96, r ^ 27417) - .42) / .46));
				E = .14 + .61 * c + .13 * w - .12 * d, D = .03 + c * (.88 + .07 * u) + .009 * w - .008 * d, O += .065 * (w - .5) + .025 * d, k = .43 + .54 * c + .025 * w - .025 * d;
				break;
			}
			case `closedcellfoam`: {
				let t = e * 28, n = l * 28, r = Math.floor(t), i = Math.floor(n), a = 0, o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let u = r + l, d = i + e, f = (u % 28 + 28) % 28, p = ((d % 28 + 28) % 28 * 28 + f) * 4, m = t - u - c[p], h = n - d - c[p + 1], g = clamp(1 - (m * m + h * h) * c[p + 2]), _ = g * g;
					a += (1 - a) * _, o += (1 - o) * _ * (1 - g) * 6.75, s += _ * (c[p + 3] - .5);
				}
				E = .49 + .18 * w - .13 * a + .08 * o + .1 * s, D = .48 + .035 * w - .17 * a + .055 * o, O += .065 * (w - .5) + .025 * a, k = .99 - .065 * a;
				break;
			}
			case `linoleum`: {
				let t = noise(e, l, 4, 5, r ^ 22811), i = .5 + .5 * Math.sin(n * (5 * e + 3 * l + 1.2 * t) + a), o = noise(e + .19 * t, l + .08 * i, 48, 8, r ^ 11635), s = smooth(clamp((o - .43) / .4));
				E = .24 + .25 * i + .38 * s + .08 * w, D = .45 + .025 * w + .015 * o, O += .09 * (o - .5) + .045 * (w - .5), k = .99 + .008 * w;
				break;
			}
			case `orangepeel`: {
				let t = e * p, n = l * m, r = Math.floor(t), i = Math.floor(n), a = 0, o = 0;
				for (let e = -1; e <= 1; e++) for (let s = -1; s <= 1; s++) {
					let c = r + s, l = i + e, u = (c % p + p) % p, d = ((l % m + m) % m * p + u) * 3, f = t - c - h[d], g = n - l - h[d + 1], _ = .26 + .14 * h[d + 2], v = f * f + g * g, y = clamp(1 - v / (_ * _)), b = clamp(1 - v / .36);
					a += (1 - a) * y * y, o += (1 - o) * b * b * (1 - b) * 6.75;
				}
				E = (.48 + .28 * w) * (1 - .35 * a) + .119 * a, D = (.46 + .025 * w + .045 * o) * (1 - a) + .22 * a, O += .06 * (w - .5) + .035 * a, k = 1 - .08 * a;
				break;
			}
			case `coconut`: {
				let t = e * p, n = l * m, r = Math.floor(t), i = Math.floor(n), a = 0, o = 0, s = .38 + .18 * w;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = r + c, u = i + e, d = (l % p + p) % p, f = ((u % m + m) % m * p + d) * 3, g = t - l - h[f], _ = n - u - h[f + 1], v = h[f + 2], y = _ / (.48 + .25 * v), b = (g + (v - .5) * .28 * _) / .12, x = clamp(1 - y * y - b * b), S = x * x;
					v < .24 ? (o += (1 - o) * S, s = s * (1 - S) + .15 * S) : (a += (1 - a) * S, s = s * (1 - S) + (.55 + .25 * v) * S);
				}
				E = s, D = (.42 + .055 * w + .18 * a) * (1 - o) + .3 * o, O += .055 * (w - .5) + .025 * a, k = (.96 + .025 * a) * (1 - o) + .86 * o;
				break;
			}
			case `watermelon`: {
				let t = noise(e, l, 4, 5, r ^ 20247), i = noise(e, l, 12, 8, r ^ 26531), s = smooth(clamp((.5 + .5 * Math.sin(n * (5 * e + .3 * t + .12 * i) + a) - .24) / .52)), c = smooth(clamp((noise(e, l, 96, 96, r ^ 23609) - .48) / .4)), u = smooth(clamp((noise(e, l, 80, 80, r ^ 11121) - .5) / .38));
				E = (.12 + .72 * s) * (1 - .2 * c) + .46 * .2 * c, D = (.48 + .025 * w) * (1 - .14 * u), O += .055 * (w - .5) + .045 * u, k = 1 - .035 * u;
				break;
			}
			case `limestone`: {
				let t = e * 24, i = l * 24, a = Math.floor(t), o = Math.floor(i), s = smooth(clamp((noise(e, l, 96, 96, r ^ 6615) - .49) / .38)), c = 0;
				E = .63 + .14 * w - .16 * s;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let s = a + r, l = o + e, u = (s % 24 + 24) % 24, d = ((l % 24 + 24) % 24 * 24 + u) * 7, f = t - s - g[d], p = i - l - g[d + 1], m = (f * g[d + 4] + p * g[d + 5]) / g[d + 2], h = (p * g[d + 4] - f * g[d + 5]) / (g[d + 2] * g[d + 3]), _ = m * m + h * h, v = smooth(clamp((1 - _) / .36)), y = g[d + 6], b = .5 + .5 * Math.cos(n * 1.5 * _), x = .5 + .24 * y + .16 * b;
					E = E * (1 - v) + x * v, c += (1 - c) * v;
				}
				D = .47 + .08 * c + .025 * w - .07 * s, O += .06 * (w - .5) + .08 * s - .05 * c, k = .98 - .12 * s + .015 * c;
				break;
			}
			case `breccia`: {
				let t = e * 6, n = l * 6, a = Math.floor(t), o = Math.floor(n), s = noise(e, l, 80, 80, r ^ 23841), c = 0;
				E = .56 + .16 * s, D = .33 + .035 * s, O += .08 * s;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let s = a + r, l = o + e, u = (s % 6 + 6) % 6, d = ((l % 6 + 6) % 6 * 6 + u) * 18, f = t - s - _[d], p = n - l - _[d + 1], m = 1;
					for (let e = 0; e < 5; e++) {
						let t = d + 3 + e * 3, n = _[t + 2] - f * _[t] - p * _[t + 1];
						m *= smooth(clamp(n / .055));
					}
					let h = _[d + 2], g = .15 + .66 * h + .12 * w;
					E = E * (1 - m) + g * m, D = D * (1 - m) + (.54 + .1 * h + .025 * w) * m, O = O * (1 - m) + (i.roughness + .08 * (w - .5)) * m, c += (1 - c) * m;
				}
				k = .81 + .17 * c + .015 * s;
				break;
			}
			case `gneiss`: {
				let t = noise(e, l, 4, 4, r ^ 27417), i = l + .28 * Math.sin(n * e + .8 * Math.sin(n * l) + a) + .06 * Math.sin(n * (2 * e - l) + a), o = n * 6 * i + 1.4 * (t - .5), s = smooth(clamp((.5 + .5 * Math.sin(o) - .18) / .64)), c = .5 + .5 * Math.sin(3 * o + .4 * t), d = smooth(clamp((noise(e, l, 96, 96, r ^ 15477) - .52) / .34));
				E = (.12 + .7 * s + .08 * c) * (1 - .3 * d) + .264 * d, D = .42 + .055 * s + .07 * d + .025 * w, O += .08 * (w - .5) + .06 * (1 - s) - .05 * d, k = .95 + .025 * s + .015 * d;
				break;
			}
			case `plywood`: {
				let t = noise(e, l, 4, 3, r ^ 17335), o = 3.2 * Math.cos(n * e + a) + 1.8 * Math.cos(n * l + .7 * a) + .45 * t, s = (.5 + .5 * Math.sin(n * o)) ** 5, c = .5 + .5 * Math.sin(n * (64 * e + .4 * t) + a);
				E = .67 + .1 * w - .32 * s + .035 * c, D = .48 + .025 * w - .045 * s + .015 * c, O += .05 * s + .04 * (w - .5), k = .99 - .045 * s;
				for (let t = 0; t < 2; t++) {
					let r = t * 3, a = fract(e - v[r] + .5) - .5, o = fract(l - v[r + 1] + .5) - .5, s = v[r + 2], c = a * a / (.0025 * s * s) + o * o / (.0169 * s * s), u = Math.max(0, 1 - c), d = u * u, f = .5 + .5 * Math.cos(n * 2 * c);
					E = E * (1 - d) + (.25 + .2 * f) * d, D = D * (1 - d) + (.44 + .025 * f) * d, O = O * (1 - d) + (i.roughness + .065 * f) * d, k = k * (1 - d) + (.95 + .025 * f) * d;
				}
				break;
			}
			case `osb`:
			case `chipboard`: {
				let t = e * y, n = l * y, r = Math.floor(t), a = Math.floor(n), o = 0;
				E = .24 + .12 * w, D = .35 + .025 * w, O += .035 * w;
				for (let e = 0; e < 2; e++) for (let s = -1; s <= 1; s++) for (let c = -1; c <= 1; c++) {
					let l = r + c, u = a + s, d = (l % y + y) % y, f = (u % y + y) % y, p = ((e * y + f) * y + d) * 26, m = t - l - b[p], h = n - u - b[p + 1], g = (m * b[p + 2] + h * b[p + 3]) / b[p + 4], _ = (h * b[p + 2] - m * b[p + 3]) / b[p + 5], v = 1;
					for (let e = 0; e < 6; e++) {
						let t = p + 8 + e * 3;
						v *= smooth(clamp((b[t + 2] - g * b[t] - _ * b[t + 1]) / .12));
					}
					if (v === 0) continue;
					let x = b[p + 6], S = .5 + .5 * Math.sin(18 * _ + .65 * Math.sin(3 * g) + b[p + 7]);
					E = E * (1 - v) + (.34 + .44 * x + .1 * S) * v, D = D * (1 - v) + (.49 + .12 * x + .025 * S) * v, O = O * (1 - v) + (i.roughness - .045 + .07 * S) * v, o += (1 - o) * v;
				}
				k = .83 + .15 * o + .015 * w;
				break;
			}
		}
		u.color = E, u.height = D * i.relief, u.roughness = clamp(O), u.occlusion = k, u.mortar = A, u.metallic = j;
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