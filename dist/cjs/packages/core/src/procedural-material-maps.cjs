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
	let v = t === `stone` || t === `metal` || t === `marble`, y = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud` || t === `granite` || t === `slate` || t === `terrazzo` || t === `plaster` || t === `terracotta` || t === `cork` || t === `rubber` || t === `sandstone` || t === `travertine` || t === `pumice`;
	return (e, l, u) => {
		e = fract(e), l = fract(l);
		let b = v ? noise(e, l, 4, 4, r) : 0, x = noise(e, l, 32, 32, r ^ 2747636419), S = y ? noise(e, l, 64, 64, r ^ 2135587861) : 0, C = b, w = b, T = i.roughness, E = 1, D = 0, O = +(t === `metal` || t === `diamondplate` || t === `hammeredmetal` || t === `galvanized` || t === `corrugatedmetal` || t === `knurledmetal` || t === `engineturned` || t === `goldleaf`);
		switch (t) {
			case `wood`: {
				let t = noise(e, l, 4, 2, r ^ 71), i = .5 + .5 * Math.sin(n * (12 * e + .65 * t) + a), o = (.5 + .5 * Math.sin(n * (40 * e + t) + a)) ** 12;
				C = clamp(.22 + .6 * i + .16 * x - .2 * o), w = .65 * i + .15 * x - .18 * o, T += .15 * o + .08 * (x - .5), E = 1 - .15 * o;
				break;
			}
			case `brick`: {
				let t = Math.floor(l * 8), n = fract(e * 4 + t % 2 * .5), i = fract(l * 8), o = smooth(clamp((Math.min(n, 1 - n, i * .5, (1 - i) * .5) - .014) / .045));
				C = .25 + .42 * hash(Math.floor(e * 4 + t % 2 * .5) % 4, t, r) + .2 * x, w = o * (.75 + .15 * x + .1 * S), D = 1 - o, T += .09 * D + .05 * (x - .5), E = .65 + .35 * o;
				break;
			}
			case `stone`: {
				let t = noise(e + .12 * b, l, 8, 8, r ^ 131);
				C = clamp(.1 + .65 * t + .3 * x), w = .65 * t + .25 * x + .1 * S, T += .1 * (x - .5), E = .8 + .2 * smooth(w);
				break;
			}
			case `metal`: {
				let t = noise(e, l, 4, 64, r ^ 313), i = (.5 + .5 * Math.sin(n * l * 48 + a)) ** 16;
				C = .4 + .38 * t + .12 * b - .1 * i, w = .7 * t - .15 * i, T += .18 * t + .08 * i, E = 1 - .04 * i;
				break;
			}
			case `fabric`: {
				let t = e * 12, r = l * 12, i = Math.sin(Math.PI * fract(t)) ** 2, o = Math.sin(Math.PI * fract(r)) ** 2, s = (Math.floor(t) + Math.floor(r)) % 2 == 0, c = s ? i * (.6 + .4 * o) : o * (.6 + .4 * i), u = .5 + .5 * Math.sin(n * (s ? e : l) * 48 + a);
				C = .22 + .48 * c + .14 * x + .08 * u, w = .8 * c + .06 * u + .08 * x, T += .04 * (x - .5), E = .68 + .32 * c;
				break;
			}
			case `marble`: {
				let t = noise(e, l, 4, 4, r ^ 997), i = Math.exp(-Math.abs(Math.sin(n * (3 * e + 2 * l + .8 * t) + a)) * 16);
				C = clamp(.9 + .1 * b - .85 * i), w = .3 * b - .2 * i + .05 * x, T += .1 * i + .04 * (x - .5), E = 1 - .06 * i;
				break;
			}
			case `concrete`: {
				let t = fract(e * 3), n = fract(l * 3), a = 1 - smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .02) / .035)), o = hash(Math.floor(fract(e) * 40), Math.floor(fract(l) * 40), r);
				C = .28 + .5 * o * (1 - a) + .12 * x, w = (1 - a) * (.65 + .25 * o) + .05 * x, T += .14 * a + .06 * (o - .5), E = .62 + .38 * (1 - a);
				break;
			}
			case `tiles`: {
				let t = fract(e * 5), n = fract(l * 5), a = smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .018) / .028));
				C = .42 + .4 * hash(Math.floor(e * 5) % 5, Math.floor(l * 5) % 5, r) + .08 * x, w = a * (.82 + .1 * x), D = 1 - a, T += .42 * D + .04 * (x - .5), E = .58 + .42 * a;
				break;
			}
			case `leather`: {
				let n = smooth(clamp(1 - wrappedFeature(e, l, 14, r ^ 81) * 1.55));
				C = .24 + .52 * n + .12 * x, w = .12 + .72 * n + .06 * x, T += .16 * (1 - n) + .04 * (x - .5), E = .55 + .45 * n;
				break;
			}
			case `suede`: {
				let t = noise(e, l, 5, 7, r ^ 15639), n = noise(e + .012 * t, l + .004 * t, 96, 24, r ^ 24113), i = smooth(clamp((noise(e, l, 80, 80, r ^ 31331) - .57) / .35));
				C = .23 + .36 * t + .25 * n + .1 * x - .08 * i, w = .35 + .075 * n + .025 * t - .045 * i, T += .075 * (n - .5) + .035 * (t - .5), E = .985 - .035 * i + .01 * n;
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
				C = .13 + .4 * i + .2 * s + .1 * a + .04 * x, w = .04 + .64 * i + .2 * a + .065 * o + .012 * x, T += .12 * (1 - i) - .045 * a + .045 * (x - .5), E = .57 + .41 * i + .015 * a;
				break;
			}
			case `crocodile`: {
				let t = e * 4, i = l * 6, o = Math.floor(t), s = d[Math.floor(i) * 4 + o], c = (fract(t) - .5) / (.445 + .025 * s), u = (fract(i) - .5) / (.445 + .02 * s), f = clamp(1 - c * c * c * c - u * u * u * u), p = smooth(clamp(f / .36)), m = noise(e, l, 9, 11, r ^ 12115), h = (.5 + .5 * Math.sin(n * (19 * e + 13 * l + 1.7 * m) + a)) ** 12;
				C = .12 + p * (.37 + .22 * s + .1 * x - .12 * h), w = .035 + p * (.64 + .17 * f * f + .035 * s - .065 * h), T += .13 * (1 - p) + p * (.055 * h + .04 * (x - .5)), E = .53 + p * (.46 - .055 * h);
				break;
			}
			case `sand`: {
				let t = noise(e, l, 3, 3, r ^ 17), i = .5 + .5 * Math.sin(n * (l * 7 + .35 * t) + a), o = noise(e, l, 48, 48, r ^ 20973);
				C = .3 + .48 * i + .18 * o, w = .72 * i + .22 * o, T += .06 * (o - .5), E = .82 + .18 * i;
				break;
			}
			case `rust`: {
				let t = noise(e, l, 6, 6, r ^ 211), n = noise(e, l, 18, 18, r ^ 419), i = smooth(clamp((t * .7 + n * .3 - .32) / .28));
				C = i, w = .25 + .45 * (1 - i) * n - .2 * i * t, T += .22 * i + .05 * (n - .5), E = .7 + .3 * (1 - i), O = 1 - i;
				break;
			}
			case `snow`: {
				let t = noise(e, l, 3, 3, r ^ 17), n = hash(Math.floor(fract(e) * 48), Math.floor(fract(l) * 48), r) ** 8;
				C = clamp(.22 + .68 * t + .1 * n), w = .7 * t + .2 * n, T += .22 * n - .06 * t, E = .88 + .12 * t;
				break;
			}
			case `asphalt`:
			case `gravel`: {
				let i = t === `asphalt`, a = i ? 40 : 12, o = e * a, s = l * a, c = Math.floor(o), u = Math.floor(s), d = 0, f = 0, p = 0, m = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let l = c + t, h = u + e, g = (l % a + a) % a, _ = (h % a + a) % a, v = hash(g, _, r ^ 29873), y = hash(g, _, r ^ 27145) * n, b = Math.cos(y), S = Math.sin(y), C = o - l - .25 - .5 * hash(g, _, r), w = s - h - .25 - .5 * hash(g, _, r ^ 40503), T = i ? .22 + .21 * v : .46 + .17 * v, E = .7 + .3 * hash(g, _, r ^ 20973), D = (C * b + w * S) / E, O = w * b - C * S, k = Math.sqrt(D * D + O * O) + (x - .5) * (i ? .08 : .16), A = smooth(clamp((T - k) / .16)), j = clamp(1 - k / T);
					d = Math.max(d, A), m = Math.max(m, A * (.65 + .35 * j)), f += A * (.35 + .65 * v), p += A;
				}
				let h = f / Math.max(1, p);
				i ? (C = .06 + .58 * h + .1 * x + .06 * S, w = .58 * m + .18 * x + .24 * S, T += .08 * (1 - d) + .1 * (S - .5), E = .8 + .2 * d) : (C = .04 + .8 * h + .08 * S, w = m * (.84 + .16 * x) + .025 * S, T += .13 * (1 - d) + .1 * (S - .5), E = .42 + .58 * d);
				break;
			}
			case `cobblestone`: {
				let t = e + .012 * noise(e, l, 6, 8, r ^ 561), n = l + .009 * noise(e, l, 6, 8, r ^ 2323), i = Math.floor(fract(n) * 8), a = t * 6 + i % 2 * .5, o = fract(a), s = fract(n * 8), c = Math.abs(o - .5), u = Math.abs(s - .5) * .75, d = Math.max(0, c - .38), f = Math.max(0, u - .255), m = smooth(clamp((.12 - Math.sqrt(d * d + f * f) - .018) / .085)), h = hash((Math.floor(a) % 6 + 6) % 6, i, r), g = 1 - .65 * (c * c + u * u);
				C = .05 + m * (.25 + .48 * h + .12 * x) + .05 * S, w = m * (.76 * g + .16 * x + .08 * S), T += .17 * (1 - m) + .1 * (S - .5), E = .45 + .55 * m;
				break;
			}
			case `bark`: {
				let t = noise(e, l, 4, 6, r ^ 15127), n = noise(e + .035 * t, l, 18, 3, r ^ 33825), i = noise(e, l, 6, 18, r ^ 20883), a = smooth(clamp((n - .26) / .38)) * smooth(clamp((i - .18) / .22)), o = noise(e, l, 48, 12, r ^ 8571);
				C = .05 + a * (.43 + .33 * o + .13 * S), w = a * (.58 + .3 * o + .12 * x), T += .08 * (1 - a) + .1 * (S - .5), E = .42 + .58 * a;
				break;
			}
			case `moss`: {
				let t = noise(e, l, 4, 4, r ^ 7015), i = smooth(clamp(1 - wrappedFeature(fract(e + .025 * t), fract(l + .018 * t), 9, r ^ 25519) / .95)), a = noise(e, l, 18, 18, r ^ 37671), o = smooth(clamp((S - .25) / .5));
				C = .09 + .46 * i + .24 * a + .19 * o, w = .65 * i + (.09 + .14 * i) * o + .12 * x, T += .06 * (o - .5) - .08 * (1 - i), E = .52 + .36 * i + .12 * o;
				break;
			}
			case `mud`: {
				let t = noise(e, l, 4, 4, r ^ 29011), n = (e + .025 * t) * 7, i = (l + .025 * noise(e, l, 4, 4, r ^ 7993)) * 7, a = Math.floor(n), o = Math.floor(i), s = 4, c = 4;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let l = a + t, u = o + e, d = (l % 7 + 7) % 7, f = (u % 7 + 7) % 7, p = n - l - .3 - .4 * hash(d, f, r), m = i - u - .3 - .4 * hash(d, f, r ^ 40503), h = p * p + m * m;
					h < s ? (c = s, s = h) : h < c && (c = h);
				}
				let d = smooth(clamp((Math.sqrt(c) - Math.sqrt(s) - .025) / .13)), f = smooth(clamp((noise(e, l, 3, 3, r ^ 14561) - .25) / .5));
				C = .04 + d * (.52 - .24 * f + .17 * x) + .04 * S, w = d * (.48 + .16 * (1 - s)) + (.07 * x + .03 * S) * (1 - .75 * f), T -= .38 * f, T += .1 * (1 - d) + .08 * (S - .5) * (1 - f), E = .48 + .52 * d;
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
				C = clamp(.04 + .88 * d + .1 * (S - .5) - .07 * f), w = .35 * d + .17 * S - .12 * f, T += .16 * (1 - d) + .06 * (S - .5), E = .97 - .025 * f + .03 * S;
				break;
			}
			case `slate`: {
				let t = noise(e, l, 5, 4, r ^ 16743), n = noise(e + .025 * t, l + .018 * t, 3, 22, r ^ 29723) * 5, i = (Math.floor(n) + smooth(clamp((fract(n) - .35) / .3))) / 5, a = noise(e, l, 12, 5, r ^ 4955), o = (1 - Math.abs(2 * fract(n) - 1)) ** 8 * smooth(clamp((a - .18) / .35));
				C = .14 + .62 * i + .14 * S - .12 * o, w = .72 * i + .1 * S - .18 * o, T += .1 * o + .1 * (S - .5), E = .98 - .15 * o + .02 * S;
				break;
			}
			case `terrazzo`: {
				let t = e * 9, i = l * 9, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let d = a + l, f = o + e, p = (d % 9 + 9) % 9, m = (f % 9 + 9) % 9, h = hash(p, m, r ^ 37499), g = hash(p, m, r ^ 13341) * n, _ = Math.cos(g), v = Math.sin(g), y = t - d - .3 - .4 * hash(p, m, r), b = i - f - .3 - .4 * hash(p, m, r ^ 40503), x = y * _ + b * v, S = b * _ - y * v, C = .75 + .25 * hash(p, m, r ^ 8623), w = Math.max(Math.abs(x) * C, Math.abs(S), (x * .65 + S * .76) * 1.1, (-x * .83 + S * .55) * 1.15), E = smooth(clamp((.26 + .18 * h - w) / .025));
					s = Math.max(s, E), c += E * (.08 + .7 * hash(p, m, r ^ 22815)), u += E;
				}
				let d = c / Math.max(u, 1e-12);
				C = (.88 + .06 * x) * (1 - s) + s * d, w = .15 + .06 * s + .015 * x + .025 * S, T += .055 * (1 - s) - .03 * s * d + .04 * (S - .5), E = .98 + .015 * s + .005 * S;
				break;
			}
			case `denim`: {
				let t = e * 24, i = l * 24, o = .5 + .5 * Math.cos(n * t), s = .5 + .5 * Math.cos(n * i), c = 1 - smooth(clamp((Math.abs(Math.sin(Math.PI * (t - i) / 4)) - .24) / .22)), u = .5 + .5 * Math.sin(n * (96 * e + .12 * x) + a), d = .5 + .5 * Math.sin(n * (96 * l + .12 * x) + a), f = u * (1 - c) + d * c, p = o * (1 - c) + s * c, m = noise(e, l, 24, 4, r ^ 27953);
				C = .12 + .22 * p + .34 * c + .1 * f + .12 * m, w = .42 * p + .24 * (1 - c) + .06 * f + .08 * m, T += .06 * (x - .5) + .04 * (1 - p), E = .78 + .18 * p + .04 * f;
				break;
			}
			case `herringbone`: {
				let t = 32 * e, i = 32 * l, o = Math.acos(.995 * Math.cos(n * 2 * e)) / Math.PI, s = smooth(clamp((.5 + .5 * Math.cos(n * (2 * o - 8 * l) + a) - .2) / .6)), c = .5 + .5 * Math.cos(n * t), u = .5 + .5 * Math.cos(n * i), d = c * (1 - s) + u * s, f = (.5 + .5 * Math.sin(n * 128 * e + a)) * (1 - s) + (.5 + .5 * Math.sin(n * 128 * l - a)) * s, p = noise(e, l, 16, 8, r ^ 15385);
				C = .17 + .31 * s + .26 * d + .1 * f + .09 * p, w = .25 + .24 * d + .07 * s + .035 * f + .025 * p, T += .055 * (x - .5) + .035 * (1 - d), E = .84 + .12 * d + .025 * f;
				break;
			}
			case `tweed`: {
				let t = 20 * e, i = 20 * l, o = smooth(clamp((Math.cos(n * t) + .45) / 1.25)), s = smooth(clamp((Math.cos(n * i) + .45) / 1.25)), c = smooth(clamp(.5 + .85 * Math.cos(Math.PI * (t + i)))), u = o * (1 - s + s * c), d = s * (1 - o + o * (1 - c)), f = u + d, p = u * noise(e, l, 20, 4, r ^ 15127) + d * noise(e, l, 4, 20, r ^ 28201), m = u * (.5 + .5 * Math.sin(n * (80 * e + .15 * x) + a)) + d * (.5 + .5 * Math.sin(n * (80 * l + .15 * x) - a)), h = e * 24, g = l * 24, _ = Math.floor(h), v = Math.floor(g), y = 0, b = .12 + .29 * f + .34 * p + .12 * m;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let n = _ + t, i = v + e, a = (n % 24 + 24) % 24, o = (i % 24 + 24) % 24, s = hash(a, o, r ^ 11635), c = h - n - .25 - .5 * hash(a, o, r), l = g - i - .25 - .5 * hash(a, o, r ^ 23089), u = (s < .5 ? 0 : Math.PI / 2) + (s - .5) * .7, d = Math.cos(u), f = Math.sin(u), p = (c * d + l * f) / (.18 + .2 * s), m = (l * d - c * f) / .075, x = clamp(1 - p * p - m * m), S = x * x;
					y += S, b += S * (.18 + .64 * hash(a, o, r ^ 32537) - b);
				}
				C = b, w = .2 + .28 * f + .08 * o * s + .05 * m + .055 * y, T += .05 * (x - .5) + .025 * y, E = .77 + .19 * f + .025 * m;
				break;
			}
			case `seersucker`: {
				let t = smooth(clamp((Math.cos(n * 4 * e) + .25) / .75)), i = .5 + .5 * Math.cos(n * 48 * e), o = .5 + .5 * Math.cos(n * 48 * l), s = .5 + .5 * Math.cos(Math.PI * 48 * (e + l)), c = i * s + o * (1 - s), u = .5 + .25 * Math.sin(n * 144 * e + a) + .25 * Math.sin(n * 144 * l - a), d = noise(e, l, 4, 4, r ^ 19513), f = .5 + .5 * Math.sin(n * (12 * l + .22 * Math.sin(n * 4 * e) + .3 * d) + a);
				C = .71 - .39 * t + .12 * c + .055 * u + .04 * t * f, w = .22 + .035 * c + .008 * u + t * (.08 + .2 * f), T += .045 * (x - .5) + .025 * t * (1 - f), E = .96 - .07 * t * (1 - f) + .02 * c;
				break;
			}
			case `burlap`: {
				let t = e * 10, r = l * 10, i = smooth(clamp((Math.cos(n * t) + .35) / 1.1)), o = smooth(clamp((Math.cos(n * r) + .35) / 1.1)), s = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t + r)))), c = i * (1 - o + o * s), u = o * (1 - i + i * (1 - s)), d = c + u, f = .5 + .5 * Math.sin(n * (50 * e + .14 * x) + a), p = .5 + .5 * Math.sin(n * (50 * l + .14 * x) + a), m = c * f + u * p, h = i * o;
				C = .04 + .65 * d + .14 * m + .1 * x * d, w = .58 * d + .2 * h + .08 * m + .04 * x, T += .05 * (x - .5) + .025 * (1 - d), E = .42 + .54 * d + .04 * m;
				break;
			}
			case `carpet`: {
				let t = e * 24, i = l * 24, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let f = a + l, p = o + e, m = (f % 24 + 24) % 24, h = (p % 24 + 24) % 24, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), y = clamp(1 - (g * g + _ * _)) ** 3, b = hash(m, h, r ^ 10571), x = hash(m, h, r ^ 26655) * n, S = (.5 + .5 * Math.sin(n * 3 * (g * Math.cos(x) + _ * Math.sin(x)) + b * n)) ** 4;
					s += y, c += y * b, u += y * S, d = Math.max(d, y * (.75 + .25 * b));
				}
				let f = 1 / Math.max(s, 1e-12), p = c * f, m = u * f;
				C = .19 + .4 * p + .2 * d + .13 * m + .08 * x, w = .3 + .38 * d + .12 * m + .1 * x, T += .04 * (x - .5) - .035 * m, E = .7 + .22 * Math.sqrt(d) + .06 * m;
				break;
			}
			case `plaster`: {
				let t = noise(e, l, 3, 3, r ^ 14241), i = (.5 + .5 * Math.sin(n * (3 * e + 2 * l + .7 * t) + a)) ** 10, o = noise(e, l, 18, 5, r ^ 21721), s = smooth(clamp((.32 - S) / .23));
				C = .61 + .2 * t + .08 * o + .07 * i - .12 * s, w = .22 + .28 * t + .18 * i + .08 * o - .14 * s, T += .1 * (S - .5) - .065 * i + .045 * s, E = .98 - .1 * s - .025 * i;
				break;
			}
			case `terracotta`: {
				let t = noise(e, l, 5, 5, r ^ 14871), n = noise(e + .04 * t, l, 12, 9, r ^ 32035), a = 1 - smooth(clamp((wrappedFeature(e, l, 28, r ^ 18541) - .04) / .19)), o = smooth(clamp((t - .5) / .3));
				C = .37 + .46 * n + .15 * x - .18 * o - .17 * a, w = .35 + .14 * x + .12 * S - .3 * a, T += .1 * (S - .5) + .07 * a - .04 * o, E = .97 - .22 * a + .025 * S;
				break;
			}
			case `cork`: {
				let t = e * 14, i = l * 14, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0, d = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let f = a + l, p = o + e, m = (f % 14 + 14) % 14, h = (p % 14 + 14) % 14, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), v = n * hash(m, h, r ^ 19745), y = g * Math.cos(v) + _ * Math.sin(v), b = _ * Math.cos(v) - g * Math.sin(v), S = clamp(1 - (.9 * y * y + 1.3 * b * b) / 1.21) ** 8, C = hash(m, h, r ^ 5931), w = (.5 + .5 * Math.sin(n * (5 * b + .3 * y) + n * C)) ** 12;
					s += S, c += S * C, d += S * w, u = Math.max(u, S);
				}
				let f = 1 / Math.max(s, 1e-12), p = c * f, m = d * f, h = 1 - smooth(clamp((u * f - .48) / .4));
				C = .31 + .57 * p + .12 * x - .22 * h - .09 * m, w = .4 + .16 * p + .07 * S - .2 * h - .07 * m, T += .07 * (S - .5) + .045 * h - .025 * p, E = .97 - .18 * h - .08 * m;
				break;
			}
			case `rubber`: {
				let n = 1 - smooth(clamp((wrappedFeature(e, l, 44, r ^ 36435) - .08) / .55));
				C = .19 + .38 * n + .19 * S + .1 * x, w = .19 + .49 * n + .15 * S + .06 * x, T += .12 * (S - .5) - .045 * n, E = .9 + .08 * n + .02 * S;
				break;
			}
			case `carbonfiber`: {
				let t = 12 * (e + l), r = 12 * (l - e), i = .5 + .5 * Math.cos(n * t), o = .5 + .5 * Math.cos(n * r), s = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t - r) / 2))), c = .5 + .5 * Math.sin(n * (4 * t + .08 * x) + a), u = .5 + .5 * Math.sin(n * (4 * r + .08 * x) + a), d = i * s + o * (1 - s), f = c * s + u * (1 - s);
				C = .12 + .46 * d + .2 * f + .12 * x, w = .25 + .37 * d + .055 * f + .04 * x, T += .065 * (x - .5) + .045 * (1 - d), E = .88 + .1 * d + .02 * f;
				break;
			}
			case `diamondplate`: {
				let t = e * 8, n = l * 8, i = fract(t) - .5, a = fract(n) - .5, o = (Math.floor(t) + Math.floor(n)) % 2 == 0 ? 1 : -1, s = (i + o * a) * Math.SQRT1_2, c = (a - o * i) * Math.SQRT1_2, d = smooth(clamp((1 - (Math.abs(s) / .48 + Math.abs(c) / .14)) / .24)), f = noise(e, l, 4, 64, r ^ 13793);
				C = .35 + .25 * f + .29 * d + .07 * x, w = .08 + .78 * d + .025 * f, T += .14 * (f - .5) - .075 * d, E = .94 + .05 * d + .01 * x;
				break;
			}
			case `knurledmetal`: {
				let t = smooth(.5 - .5 * Math.cos(n * 24 * (e + l))) * smooth(.5 - .5 * Math.cos(n * 24 * (e - l)));
				C = .29 + .48 * t + .16 * x, w = .12 + .72 * t + .025 * x, T += .1 * (x - .5) + .07 * (1 - t), E = .85 + .14 * t;
				break;
			}
			case `engineturned`: {
				let t = e * 6, r = l * 6, i = Math.floor(t), a = Math.floor(r), o = 0, s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let u = i + l, d = a + e, p = (u % 6 + 6) % 6, m = (d % 6 + 6) % 6, h = t - u - .25 - m % 2 * .5, g = r - d - .5, _ = h * h + g * g, v = Math.max(0, 1 - _ / .9025), y = v * v, b = (m * 6 + p) * 2, x = f[b], S = .5 + .5 * Math.cos(n * (10 * _ + x + .18 * h * g));
					o += y, s += y * S, c += y * f[b + 1];
				}
				s /= o, c /= o, C = .35 + .34 * c + .22 * s + .04 * x, w = .44 + .07 * s + .025 * x, T += .18 * (s - .5) + .12 * (c - .5), E = .98 + .015 * s;
				break;
			}
			case `goldleaf`: {
				let t = noise(e, l, 4, 5, r ^ 19843), i = e + .035 * Math.sin(n * l * 3 + a), o = l + .03 * Math.sin(n * e * 4 + a), s = noise(i, o, 4, 5, r ^ 7769), c = smooth(clamp((Math.cos(n * 4 * i) - .92) / .08)), u = smooth(clamp((Math.cos(n * 5 * o) - .92) / .08)), d = c + (1 - c) * u, f = (.5 + .5 * Math.cos(n * (18 * e + 7 * l + 1.7 * t) + a)) ** 8, p = (.5 + .5 * Math.cos(n * (5 * e - 21 * l + 1.3 * s) - a)) ** 10, m = .6 * f + .4 * p;
				C = .4 + .3 * s + .19 * m - .1 * d, w = .36 + .34 * m + .065 * d + .04 * x, T += .12 * (s - .5) + .11 * m + .025 * d, E = .99 - .065 * m - .025 * d;
				break;
			}
			case `paper`: {
				let t = noise(e, l, 3, 5, r ^ 33207), i = noise(e, l, 48, 48, r ^ 22483), a = e * 24, o = l * 24, s = Math.floor(a), c = Math.floor(o), u = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let i = s + t, l = c + e, d = (i % 24 + 24) % 24, f = (l % 24 + 24) % 24, p = a - i - .35 - .3 * hash(d, f, r), m = o - l - .35 - .3 * hash(d, f, r ^ 6463), h = n * hash(d, f, r ^ 29409), g = p * Math.cos(h) + m * Math.sin(h), _ = m * Math.cos(h) - p * Math.sin(h), v = .42 + .28 * hash(d, f, r ^ 23337), b = clamp(1 - (g * g / (v * v) + _ * _ / .0064)) ** 2;
					u = Math.max(u, b);
				}
				C = .62 + .24 * t + .1 * i - .2 * u, w = .22 + .12 * t + .22 * i + .3 * u, T += .08 * (i - .5) + .04 * u, E = .98 - .07 * u - .035 * (1 - i);
				break;
			}
			case `wicker`: {
				let t = e * 6, i = l * 6, a = .5 + .5 * Math.cos(n * t), o = .5 + .5 * Math.cos(n * i), s = smooth(clamp((Math.cos(n * t) + .92) / .3)), c = smooth(clamp((Math.cos(n * i) + .92) / .3)), u = smooth(clamp(.5 + 1.4 * Math.cos(Math.PI * t) * Math.cos(Math.PI * i))), d = s * (1 - c + c * u), f = c * (1 - s + s * (1 - u)), p = d + f, m = noise(e, l, 72, 4, r ^ 28465), h = noise(e, l, 4, 72, r ^ 10903), g = d * m + f * h, _ = d * a + f * o;
				C = .08 + .5 * p + .16 * _ + .18 * g, w = .04 + .48 * p + .32 * _ + .045 * g, T += .1 * (x - .5) + .1 * (1 - p) - .04 * g, E = .34 + .54 * p + .1 * _;
				break;
			}
			case `bamboo`: {
				let t = noise(e, l, 64, 4, r ^ 19313), i = noise(e, l, 4, 3, r ^ 26909), o = .5 + .5 * Math.sin(n * (48 * e + .22 * i) + a), s = noise(e, 0, 4, 1, r ^ 10453), c = 1 - Math.cos(n * (3 * l + .65 * s + .07 * Math.sin(n * 4 * e)) + a), u = 1 - smooth(clamp(c / .16)), d = 1 - smooth(clamp(c / .42));
				C = .46 + .23 * t + .16 * o + .08 * x - .34 * u, w = .3 + .14 * t + .12 * o + .16 * d - .1 * u, T += .12 * u + .1 * (t - .5) - .035 * o, E = .99 - .14 * u - .025 * (1 - t);
				break;
			}
			case `hammeredmetal`: {
				let t = e * 12, n = l * 12, i = Math.floor(t), a = Math.floor(n), o = 0;
				for (let e = -1; e <= 1; e++) for (let s = -1; s <= 1; s++) {
					let c = i + s, l = a + e, u = (c % 12 + 12) % 12, d = (l % 12 + 12) % 12, f = t - c - .35 - .3 * hash(u, d, r), p = n - l - .35 - .3 * hash(u, d, r ^ 29339), m = .85 + .25 * hash(u, d, r ^ 6461), h = clamp(1 - (f * f + p * p) / (m * m));
					o += h * h * (.7 + .3 * hash(u, d, r ^ 23063));
				}
				let s = 1 - Math.exp(-1.6 * o), c = noise(e, l, 4, 4, r ^ 20001);
				C = .72 - .32 * s + .14 * c + .045 * x, w = .85 - .7 * s + .008 * x, T += .1 * (c - .5) + .09 * s, E = .99 - .12 * s;
				break;
			}
			case `galvanized`: {
				let t = e * 10, i = l * 10, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let d = a + l, f = o + e, p = (d % 10 + 10) % 10, m = (f % 10 + 10) % 10, h = t - d - .35 - .3 * hash(p, m, r), g = i - f - .35 - .3 * hash(p, m, r ^ 15225), _ = n * hash(p, m, r ^ 22435), v = h * Math.cos(_) + g * Math.sin(_), y = g * Math.cos(_) - h * Math.sin(_), b = clamp(1 - (h * h + g * g) / 1.21) ** 8, x = hash(p, m, r ^ 18897), S = .5 + .5 * Math.cos(n * (3 * y + 1.5 * Math.abs(v)));
					s += b, c += b * x, u += b * S;
				}
				let d = 1 / Math.max(s, 1e-12), f = c * d, p = u * d;
				C = .18 + .65 * f + .12 * p + .035 * x, w = .3 + .18 * f + .035 * p + .015 * x, T += .24 * (f - .5) + .045 * (p - .5), E = .98 + .02 * f;
				break;
			}
			case `corrugatedmetal`: {
				let t = .5 + .5 * Math.cos(n * 8 * e + a), i = noise(e, l, 64, 4, r ^ 8043), o = (.5 + .5 * Math.sin(n * 48 * e + a)) ** 12;
				C = .5 + .2 * t + .16 * i - .06 * o, w = .1 + .8 * t + .004 * i - .002 * o, T += .13 * (i - .5) + .06 * o, E = .91 + .08 * t;
				break;
			}
			case `sandstone`: {
				let t = noise(e, l, 3, 5, r ^ 26941), i = l + .055 * (t - .5), o = .5 + .5 * Math.sin(8 * i * n + a), s = (.5 + .5 * Math.sin(19 * i * n + a)) ** 6, c = noise(e, l, 8, 3, r ^ 19735), u = smooth(clamp((S - .28) / .48)), d = (1 - S) ** 5;
				C = .22 + .35 * o + .2 * c + .18 * u - .2 * s, w = .32 + .16 * o - .09 * s + .24 * u - .1 * d, T += .12 * (u - .5) + .05 * s, E = .97 - .12 * s - .13 * d + .025 * u;
				break;
			}
			case `travertine`: {
				let t = e * 12, i = l * 18, o = Math.floor(t), s = Math.floor(i), c = 0;
				for (let e = -1; e <= 1; e++) for (let a = -1; a <= 1; a++) {
					let l = o + a, u = s + e, d = (l % 12 + 12) % 12, f = (u % 18 + 18) % 18, p = hash(d, f, r ^ 24211), m = (hash(d, f, r ^ 9169) - .5) * .36, h = Math.cos(m), g = Math.sin(m), _ = t - l - .2 - .6 * hash(d, f, r), v = i - u - .2 - .6 * hash(d, f, r ^ 31513), y = _ * h + v * g, b = v * h - _ * g, x = .42 + .36 * p, S = .11 + .13 * hash(d, f, r ^ 36657), w = smooth(clamp((1 - (y * y / (x * x) + b * b / (S * S) + .12 * Math.sin(9 * y + p * n) * Math.sin(13 * b))) / .65));
					c += w * (.65 + .35 * p);
				}
				let u = 1 - Math.exp(-1.8 * c), d = noise(e, l, 3, 3, r ^ 16855), f = .5 + .5 * Math.sin(n * (6 * l + .18 * d) + a);
				C = .65 + .12 * f + .09 * S - .48 * u, w = .62 + .05 * f + .04 * S - .3 * u, T += .15 * u + .08 * (S - .5), E = .98 - .42 * u;
				break;
			}
			case `pumice`: {
				let t = e * 26, n = l * 26, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 26 + 26) % 26, f = (u % 26 + 26) % 26, p = t - l - .15 - .7 * hash(d, f, r), m = n - u - .15 - .7 * hash(d, f, r ^ 25375), h = .24 + .2 * hash(d, f, r ^ 14521), g = (p * p + m * m) / (h * h), _ = clamp(1 - g), v = _ * _;
					o = Math.max(o, v), s = Math.max(s, 6 * g * v);
				}
				C = .65 + .12 * noise(e, l, 5, 5, r ^ 40007) + .08 * S - .57 * o + .05 * s, w = .72 - .58 * o + .08 * s + .03 * S, T += .07 * o + .07 * (S - .5), E = .98 - .52 * o + .01 * x;
				break;
			}
			case `parquet`: {
				let t = e * 4, a = l * 4, o = Math.floor(t), s = Math.floor(a), c = (o + s) % 2 == 0, u = fract(c ? t : a), d = fract(c ? a : t), f = Math.floor(d * 3), m = smooth(clamp((Math.min(u, 1 - u, fract(d * 3) / 3, (1 - fract(d * 3)) / 3) - .006) / .016)), h = hash(o * 3 + f, s, r), g = noise(e, l, 8, 8, r ^ 14105), _ = .5 + .5 * Math.sin(n * (d * 38 + .28 * Math.sin(n * u) + .18 * g) + h * n);
				C = .06 + m * (.25 + .32 * h + .22 * _ + .06 * x), w = m * (.76 + .045 * _ + .025 * x), T = .78 + m * (i.roughness - .78 + .09 * _ + .04 * h), E = .52 + .46 * m;
				break;
			}
			case `mosaic`: {
				let t = e * 16, n = l * 16, a = fract(t), o = fract(n), c = smooth(clamp((Math.min(a, 1 - a, o, 1 - o) - .018) / .042)), u = hash(Math.floor(t), Math.floor(n), r);
				C = .2 + c * (.08 + .56 * u + .1 * x), w = c * (.78 + .08 * u + .025 * x), T = .76 + c * (i.roughness - .76 + .11 * u + .04 * x), E = .6 + .39 * c, D = 1 - c;
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
				C = .2 + m * (.28 + .35 * h + .07 * x), w = m * (.8 + .045 * h + .02 * x), T = .74 + m * (i.roughness - .74 + .1 * h + .04 * x), E = .6 + .39 * m, D = 1 - m;
				break;
			}
			case `knit`: {
				let t = e * 8, r = l * 8, i = Math.floor(t), o = Math.floor(r), s = 0;
				for (let e = -1; e <= 1; e += 2) {
					let n = t - i - .5, a = r - o - .84, c = e * .34, l = -.68, u = clamp((n * c + a * l) / (c * c + l * l)), d = n - u * c, f = a - u * l, m = smooth(clamp(1 - (d * d + f * f) / .0169));
					s += (1 - s) * m;
				}
				let c = .5 + .25 * Math.sin(n * (48 * e + 24 * l) + a) + .25 * Math.sin(n * (48 * e - 24 * l) - a);
				C = .12 + .64 * s + .1 * x + .07 * s * c, w = .08 + s * (.76 + .045 * c) + .025 * x, T += .065 * (x - .5) + .035 * (1 - s), E = .58 + .41 * s;
				break;
			}
			case `corduroy`: {
				let t = (.5 + .5 * Math.cos(n * e * 12)) ** .65, i = noise(e, l, 96, 96, r ^ 11121), a = noise(e, l, 12, 48, r ^ 31907);
				C = .12 + .57 * t + .16 * i + .08 * a, w = .07 + .79 * t + .035 * i + .025 * a, T += .08 * (i - .5) + .035 * (1 - t), E = .57 + .42 * t;
				break;
			}
			case `felt`: {
				let t = e * 20, i = l * 20, a = Math.floor(t), o = Math.floor(i), s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = a + c, u = o + e, d = (l % 20 + 20) % 20, f = (u % 20 + 20) % 20, p = t - l - .25 - .5 * hash(d, f, r), m = i - u - .25 - .5 * hash(d, f, r ^ 41845), h = hash(d, f, r ^ 27415) * n, g = Math.cos(h), _ = Math.sin(h), v = (p * g + m * _) / .6, y = (m * g - p * _) / .055, b = clamp(1 - v * v - y * y);
					s += (1 - s) * b * b;
				}
				C = .28 + .28 * x + .3 * s, w = .18 + .035 * x + .065 * s, T += .065 * (x - .5) + .025 * s, E = .96 + .025 * s + .01 * x;
				break;
			}
			case `roofshingles`: {
				let t = Math.floor(l * 6), n = fract(l * 6), i = e * 4 + t % 2 * .5, a = fract(i), o = smooth(clamp(Math.min(n, 1 - n) / .12)), s = smooth(clamp(Math.min(a, 1 - a) / .055)), c = (1 - s) * smooth(clamp((n - .32) / .16)) * o, u = o * s, d = hash(Math.floor(i) % 4, t, r ^ 25527), f = smooth(clamp((noise(e, l, 64, 64, r ^ 19765) - .2) / .6)), p = 1 - o;
				C = .24 + .32 * f + .2 * u * d - .15 * p - .14 * c, w = .2 + .38 * o - .2 * c + .13 * f + .05 * u * d, T += .12 * (f - .5) + .04 * p + .03 * c, E = .96 - .24 * p - .2 * c + .025 * f;
				break;
			}
			case `rooftiles`: {
				let t = fract(e * 6 + .5), i = fract(l * 5), a = .5 + .5 * Math.cos(n * e * 6), o = smooth(clamp(Math.min(i, 1 - i) / .13)), s = o * smooth(clamp(Math.min(t, 1 - t) / .12)), c = hash(Math.floor(e * 6 + .5) % 6, Math.floor(l * 5), r ^ 31297), u = noise(e, l, 24, 32, r ^ 23591), d = 1 - o;
				C = .26 + .24 * a + .23 * s * c + .14 * u - .14 * d, w = .16 + .65 * a - .1 * d + .035 * s * c + .012 * u, T += .13 * (u - .5) + .05 * (1 - a) + .045 * d, E = .76 + .22 * a - .14 * d + .015 * u;
				break;
			}
			case `stucco`: {
				let t = e * 28, n = l * 28, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 28 + 28) % 28, f = (u % 28 + 28) % 28, p = hash(d, f, r ^ 17337), m = t - l - .2 - .6 * hash(d, f, r), h = n - u - .2 - .6 * hash(d, f, r ^ 6083), g = .3 + .25 * p, _ = clamp(1 - (m * m + h * h * (.7 + p)) / (g * g)), v = _ * _;
					p < .28 ? s += (1 - s) * v : o += (1 - o) * v;
				}
				let c = noise(e, l, 5, 7, r ^ 21373);
				C = .52 + .15 * c + .19 * o - .24 * s + .08 * x, w = .27 + .16 * c + .43 * o - .22 * s + .06 * x, T += .055 * o + .065 * s + .05 * (x - .5), E = .96 - .25 * s - .075 * o + .02 * x;
				break;
			}
			case `lichen`: {
				let t = e * 7, i = l * 7, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let u = a + l, d = o + e, f = (u % 7 + 7) % 7, p = (d % 7 + 7) % 7, m = t - u - .25 - .5 * hash(f, p, r), h = i - d - .25 - .5 * hash(f, p, r ^ 29107), g = Math.atan2(h, m), _ = hash(f, p, r ^ 15449), v = (.38 + .16 * _) * (1 + .13 * Math.cos(5 * g + _ * n) + .09 * Math.sin(3 * g - _ * n)), y = smooth(clamp((1 - Math.hypot(m, h) / v) / .18));
					s += (1 - s) * y, c += y * (_ - .5);
				}
				let u = smooth(clamp((noise(e, l, 96, 96, r ^ 27171) - .58) / .25));
				C = .16 + .13 * x + .53 * s + .07 * Math.tanh(c) - .18 * s * u, w = .15 + .035 * x + s * (.48 - .17 * u), T += .04 * (x - .5) + .035 * s * u, E = .9 + .08 * s - .15 * s * u;
				break;
			}
			case `leaflitter`: {
				let t = e * 6, i = l * 6, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let d = a + l, f = o + e, p = (d % 6 + 6) % 6, m = (f % 6 + 6) % 6, h = t - d - .2 - .6 * hash(p, m, r), g = i - f - .2 - .6 * hash(p, m, r ^ 10679), _ = hash(p, m, r ^ 20273) * n, v = Math.cos(_), y = Math.sin(_), b = hash(p, m, r ^ 20905), x = (h * v + g * y) / (.64 + .1 * b), S = (g * v - h * y) / (.26 + .05 * b), C = smooth(clamp((1 - x * x - Math.sqrt(S * S + 1e-4)) / .18)), w = C * Math.exp(-S * S * 260);
					s += (1 - s) * C, u += (1 - u) * w, c += C * (b - .5);
				}
				C = .07 + .09 * x + .56 * s + .16 * Math.tanh(c) - .12 * u, w = .08 + .035 * x + .61 * s + .045 * u, T += .07 * (x - .5) + .045 * (1 - s), E = .53 + .44 * s;
				break;
			}
			case `endgrain`: {
				let t = fract(e - o + .5) - .5, i = fract(l - s + .5) - .5, c = Math.sin(Math.PI * t) / Math.PI, u = Math.sin(Math.PI * i) / Math.PI, d = Math.sqrt(c * c + u * u + 4e-4), f = noise(e, l, 5, 5, r ^ 31811), p = (.5 + .5 * Math.sin(n * (23 * d + .23 * f) + a)) ** 6, m = smooth(clamp((noise(e, l, 96, 96, r ^ 5607) - .62) / .23)), h = Math.hypot(t, i), g = smooth(clamp((h - .07) / .08)) * smooth(clamp((.43 - h) / .08)) * (.5 + .5 * Math.cos(7 * Math.atan2(i, t) + a)) ** 48;
				C = .76 - .37 * p - .2 * m - .24 * g + .08 * x, w = .49 - .07 * p - .16 * m - .22 * g + .025 * x, T += .13 * m + .06 * p + .045 * (x - .5), E = .99 - .17 * m - .22 * g;
				break;
			}
			case `acousticfoam`: {
				let t = fract(e * 4) - .5, n = fract(l * 4) - .5, i = Math.sqrt(t * t + 1e-4), a = Math.sqrt(n * n + 1e-4), s = clamp(1 - 2 * (.5 * (i + a + Math.sqrt((i - a) ** 2 + 4e-4)))), c = s < .1 ? s * s * 5 : s > .9 ? .9 - (1 - s) * (1 - s) * 5 : s - .05, u = hash(Math.floor(e * 4), Math.floor(l * 4), r ^ 14289), d = smooth(clamp((noise(e, l, 96, 96, r ^ 27417) - .42) / .46));
				C = .14 + .61 * c + .13 * x - .12 * d, w = .03 + c * (.88 + .07 * u) + .009 * x - .008 * d, T += .065 * (x - .5) + .025 * d, E = .43 + .54 * c + .025 * x - .025 * d;
				break;
			}
			case `closedcellfoam`: {
				let t = e * 28, n = l * 28, r = Math.floor(t), i = Math.floor(n), a = 0, o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let u = r + l, d = i + e, f = (u % 28 + 28) % 28, p = ((d % 28 + 28) % 28 * 28 + f) * 4, m = t - u - c[p], h = n - d - c[p + 1], g = clamp(1 - (m * m + h * h) * c[p + 2]), _ = g * g;
					a += (1 - a) * _, o += (1 - o) * _ * (1 - g) * 6.75, s += _ * (c[p + 3] - .5);
				}
				C = .49 + .18 * x - .13 * a + .08 * o + .1 * s, w = .48 + .035 * x - .17 * a + .055 * o, T += .065 * (x - .5) + .025 * a, E = .99 - .065 * a;
				break;
			}
			case `linoleum`: {
				let t = noise(e, l, 4, 5, r ^ 22811), i = .5 + .5 * Math.sin(n * (5 * e + 3 * l + 1.2 * t) + a), o = noise(e + .19 * t, l + .08 * i, 48, 8, r ^ 11635), s = smooth(clamp((o - .43) / .4));
				C = .24 + .25 * i + .38 * s + .08 * x, w = .45 + .025 * x + .015 * o, T += .09 * (o - .5) + .045 * (x - .5), E = .99 + .008 * x;
				break;
			}
			case `orangepeel`: {
				let t = e * p, n = l * m, r = Math.floor(t), i = Math.floor(n), a = 0, o = 0;
				for (let e = -1; e <= 1; e++) for (let s = -1; s <= 1; s++) {
					let c = r + s, l = i + e, u = (c % p + p) % p, d = ((l % m + m) % m * p + u) * 3, f = t - c - h[d], g = n - l - h[d + 1], _ = .26 + .14 * h[d + 2], v = f * f + g * g, y = clamp(1 - v / (_ * _)), b = clamp(1 - v / .36);
					a += (1 - a) * y * y, o += (1 - o) * b * b * (1 - b) * 6.75;
				}
				C = (.48 + .28 * x) * (1 - .35 * a) + .119 * a, w = (.46 + .025 * x + .045 * o) * (1 - a) + .22 * a, T += .06 * (x - .5) + .035 * a, E = 1 - .08 * a;
				break;
			}
			case `coconut`: {
				let t = e * p, n = l * m, r = Math.floor(t), i = Math.floor(n), a = 0, o = 0, s = .38 + .18 * x;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = r + c, u = i + e, d = (l % p + p) % p, f = ((u % m + m) % m * p + d) * 3, g = t - l - h[f], _ = n - u - h[f + 1], v = h[f + 2], y = _ / (.48 + .25 * v), b = (g + (v - .5) * .28 * _) / .12, x = clamp(1 - y * y - b * b), S = x * x;
					v < .24 ? (o += (1 - o) * S, s = s * (1 - S) + .15 * S) : (a += (1 - a) * S, s = s * (1 - S) + (.55 + .25 * v) * S);
				}
				C = s, w = (.42 + .055 * x + .18 * a) * (1 - o) + .3 * o, T += .055 * (x - .5) + .025 * a, E = (.96 + .025 * a) * (1 - o) + .86 * o;
				break;
			}
			case `watermelon`: {
				let t = noise(e, l, 4, 5, r ^ 20247), i = noise(e, l, 12, 8, r ^ 26531), s = smooth(clamp((.5 + .5 * Math.sin(n * (5 * e + .3 * t + .12 * i) + a) - .24) / .52)), c = smooth(clamp((noise(e, l, 96, 96, r ^ 23609) - .48) / .4)), u = smooth(clamp((noise(e, l, 80, 80, r ^ 11121) - .5) / .38));
				C = (.12 + .72 * s) * (1 - .2 * c) + .46 * .2 * c, w = (.48 + .025 * x) * (1 - .14 * u), T += .055 * (x - .5) + .045 * u, E = 1 - .035 * u;
				break;
			}
			case `limestone`: {
				let t = e * 24, i = l * 24, a = Math.floor(t), o = Math.floor(i), s = smooth(clamp((noise(e, l, 96, 96, r ^ 6615) - .49) / .38)), c = 0;
				C = .63 + .14 * x - .16 * s;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let s = a + r, l = o + e, u = (s % 24 + 24) % 24, d = ((l % 24 + 24) % 24 * 24 + u) * 7, f = t - s - g[d], p = i - l - g[d + 1], m = (f * g[d + 4] + p * g[d + 5]) / g[d + 2], h = (p * g[d + 4] - f * g[d + 5]) / (g[d + 2] * g[d + 3]), _ = m * m + h * h, v = smooth(clamp((1 - _) / .36)), y = g[d + 6], b = .5 + .5 * Math.cos(n * 1.5 * _), x = .5 + .24 * y + .16 * b;
					C = C * (1 - v) + x * v, c += (1 - c) * v;
				}
				w = .47 + .08 * c + .025 * x - .07 * s, T += .06 * (x - .5) + .08 * s - .05 * c, E = .98 - .12 * s + .015 * c;
				break;
			}
			case `breccia`: {
				let t = e * 6, n = l * 6, a = Math.floor(t), o = Math.floor(n), s = noise(e, l, 80, 80, r ^ 23841), c = 0;
				C = .56 + .16 * s, w = .33 + .035 * s, T += .08 * s;
				for (let e = -1; e <= 1; e++) for (let r = -1; r <= 1; r++) {
					let s = a + r, l = o + e, u = (s % 6 + 6) % 6, d = ((l % 6 + 6) % 6 * 6 + u) * 18, f = t - s - _[d], p = n - l - _[d + 1], m = 1;
					for (let e = 0; e < 5; e++) {
						let t = d + 3 + e * 3, n = _[t + 2] - f * _[t] - p * _[t + 1];
						m *= smooth(clamp(n / .055));
					}
					let h = _[d + 2], g = .15 + .66 * h + .12 * x;
					C = C * (1 - m) + g * m, w = w * (1 - m) + (.54 + .1 * h + .025 * x) * m, T = T * (1 - m) + (i.roughness + .08 * (x - .5)) * m, c += (1 - c) * m;
				}
				E = .81 + .17 * c + .015 * s;
				break;
			}
			case `gneiss`: {
				let t = noise(e, l, 4, 4, r ^ 27417), i = l + .28 * Math.sin(n * e + .8 * Math.sin(n * l) + a) + .06 * Math.sin(n * (2 * e - l) + a), o = n * 6 * i + 1.4 * (t - .5), s = smooth(clamp((.5 + .5 * Math.sin(o) - .18) / .64)), c = .5 + .5 * Math.sin(3 * o + .4 * t), d = smooth(clamp((noise(e, l, 96, 96, r ^ 15477) - .52) / .34));
				C = (.12 + .7 * s + .08 * c) * (1 - .3 * d) + .264 * d, w = .42 + .055 * s + .07 * d + .025 * x, T += .08 * (x - .5) + .06 * (1 - s) - .05 * d, E = .95 + .025 * s + .015 * d;
				break;
			}
		}
		u.color = C, u.height = w * i.relief, u.roughness = clamp(T), u.occlusion = E, u.mortar = D, u.metallic = O;
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