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
	let l = t === `stone` || t === `metal` || t === `marble`, u = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud` || t === `granite` || t === `slate` || t === `terrazzo` || t === `plaster` || t === `terracotta` || t === `cork` || t === `rubber` || t === `sandstone` || t === `travertine` || t === `pumice`;
	return (e, d, f) => {
		e = fract(e), d = fract(d);
		let p = l ? noise(e, d, 4, 4, r) : 0, m = noise(e, d, 32, 32, r ^ 2747636419), h = u ? noise(e, d, 64, 64, r ^ 2135587861) : 0, g = p, _ = p, v = i.roughness, y = 1, b = 0, x = +(t === `metal` || t === `diamondplate` || t === `hammeredmetal` || t === `galvanized` || t === `corrugatedmetal`);
		switch (t) {
			case `wood`: {
				let t = noise(e, d, 4, 2, r ^ 71), i = .5 + .5 * Math.sin(n * (12 * e + .65 * t) + a), o = (.5 + .5 * Math.sin(n * (40 * e + t) + a)) ** 12;
				g = clamp(.22 + .6 * i + .16 * m - .2 * o), _ = .65 * i + .15 * m - .18 * o, v += .15 * o + .08 * (m - .5), y = 1 - .15 * o;
				break;
			}
			case `brick`: {
				let t = Math.floor(d * 8), n = fract(e * 4 + t % 2 * .5), i = fract(d * 8), o = smooth(clamp((Math.min(n, 1 - n, i * .5, (1 - i) * .5) - .014) / .045));
				g = .25 + .42 * hash(Math.floor(e * 4 + t % 2 * .5) % 4, t, r) + .2 * m, _ = o * (.75 + .15 * m + .1 * h), b = 1 - o, v += .09 * b + .05 * (m - .5), y = .65 + .35 * o;
				break;
			}
			case `stone`: {
				let t = noise(e + .12 * p, d, 8, 8, r ^ 131);
				g = clamp(.1 + .65 * t + .3 * m), _ = .65 * t + .25 * m + .1 * h, v += .1 * (m - .5), y = .8 + .2 * smooth(_);
				break;
			}
			case `metal`: {
				let t = noise(e, d, 4, 64, r ^ 313), i = (.5 + .5 * Math.sin(n * d * 48 + a)) ** 16;
				g = .4 + .38 * t + .12 * p - .1 * i, _ = .7 * t - .15 * i, v += .18 * t + .08 * i, y = 1 - .04 * i;
				break;
			}
			case `fabric`: {
				let t = e * 12, r = d * 12, i = Math.sin(Math.PI * fract(t)) ** 2, o = Math.sin(Math.PI * fract(r)) ** 2, s = (Math.floor(t) + Math.floor(r)) % 2 == 0, c = s ? i * (.6 + .4 * o) : o * (.6 + .4 * i), l = .5 + .5 * Math.sin(n * (s ? e : d) * 48 + a);
				g = .22 + .48 * c + .14 * m + .08 * l, _ = .8 * c + .06 * l + .08 * m, v += .04 * (m - .5), y = .68 + .32 * c;
				break;
			}
			case `marble`: {
				let t = noise(e, d, 4, 4, r ^ 997), i = Math.exp(-Math.abs(Math.sin(n * (3 * e + 2 * d + .8 * t) + a)) * 16);
				g = clamp(.9 + .1 * p - .85 * i), _ = .3 * p - .2 * i + .05 * m, v += .1 * i + .04 * (m - .5), y = 1 - .06 * i;
				break;
			}
			case `concrete`: {
				let t = fract(e * 3), n = fract(d * 3), a = 1 - smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .02) / .035)), o = hash(Math.floor(fract(e) * 40), Math.floor(fract(d) * 40), r);
				g = .28 + .5 * o * (1 - a) + .12 * m, _ = (1 - a) * (.65 + .25 * o) + .05 * m, v += .14 * a + .06 * (o - .5), y = .62 + .38 * (1 - a);
				break;
			}
			case `tiles`: {
				let t = fract(e * 5), n = fract(d * 5), a = smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .018) / .028));
				g = .42 + .4 * hash(Math.floor(e * 5) % 5, Math.floor(d * 5) % 5, r) + .08 * m, _ = a * (.82 + .1 * m), b = 1 - a, v += .42 * b + .04 * (m - .5), y = .58 + .42 * a;
				break;
			}
			case `leather`: {
				let n = smooth(clamp(1 - wrappedFeature(e, d, 14, r ^ 81) * 1.55));
				g = .24 + .52 * n + .12 * m, _ = .12 + .72 * n + .06 * m, v += .16 * (1 - n) + .04 * (m - .5), y = .55 + .45 * n;
				break;
			}
			case `sand`: {
				let t = noise(e, d, 3, 3, r ^ 17), i = .5 + .5 * Math.sin(n * (d * 7 + .35 * t) + a), o = noise(e, d, 48, 48, r ^ 20973);
				g = .3 + .48 * i + .18 * o, _ = .72 * i + .22 * o, v += .06 * (o - .5), y = .82 + .18 * i;
				break;
			}
			case `rust`: {
				let t = noise(e, d, 6, 6, r ^ 211), n = noise(e, d, 18, 18, r ^ 419), i = smooth(clamp((t * .7 + n * .3 - .32) / .28));
				g = i, _ = .25 + .45 * (1 - i) * n - .2 * i * t, v += .22 * i + .05 * (n - .5), y = .7 + .3 * (1 - i), x = 1 - i;
				break;
			}
			case `snow`: {
				let t = noise(e, d, 3, 3, r ^ 17), n = hash(Math.floor(fract(e) * 48), Math.floor(fract(d) * 48), r) ** 8;
				g = clamp(.22 + .68 * t + .1 * n), _ = .7 * t + .2 * n, v += .22 * n - .06 * t, y = .88 + .12 * t;
				break;
			}
			case `asphalt`:
			case `gravel`: {
				let i = t === `asphalt`, a = i ? 40 : 12, o = e * a, s = d * a, c = Math.floor(o), l = Math.floor(s), u = 0, f = 0, p = 0, b = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let d = c + t, h = l + e, g = (d % a + a) % a, _ = (h % a + a) % a, v = hash(g, _, r ^ 29873), y = hash(g, _, r ^ 27145) * n, x = Math.cos(y), S = Math.sin(y), C = o - d - .25 - .5 * hash(g, _, r), w = s - h - .25 - .5 * hash(g, _, r ^ 40503), T = i ? .22 + .21 * v : .46 + .17 * v, E = .7 + .3 * hash(g, _, r ^ 20973), D = (C * x + w * S) / E, O = w * x - C * S, k = Math.sqrt(D * D + O * O) + (m - .5) * (i ? .08 : .16), A = smooth(clamp((T - k) / .16)), j = clamp(1 - k / T);
					u = Math.max(u, A), b = Math.max(b, A * (.65 + .35 * j)), f += A * (.35 + .65 * v), p += A;
				}
				let x = f / Math.max(1, p);
				i ? (g = .06 + .58 * x + .1 * m + .06 * h, _ = .58 * b + .18 * m + .24 * h, v += .08 * (1 - u) + .1 * (h - .5), y = .8 + .2 * u) : (g = .04 + .8 * x + .08 * h, _ = b * (.84 + .16 * m) + .025 * h, v += .13 * (1 - u) + .1 * (h - .5), y = .42 + .58 * u);
				break;
			}
			case `cobblestone`: {
				let t = e + .012 * noise(e, d, 6, 8, r ^ 561), n = d + .009 * noise(e, d, 6, 8, r ^ 2323), i = Math.floor(fract(n) * 8), a = t * 6 + i % 2 * .5, o = fract(a), s = fract(n * 8), c = Math.abs(o - .5), l = Math.abs(s - .5) * .75, u = Math.max(0, c - .38), f = Math.max(0, l - .255), b = smooth(clamp((.12 - Math.sqrt(u * u + f * f) - .018) / .085)), x = hash((Math.floor(a) % 6 + 6) % 6, i, r), S = 1 - .65 * (c * c + l * l);
				g = .05 + b * (.25 + .48 * x + .12 * m) + .05 * h, _ = b * (.76 * S + .16 * m + .08 * h), v += .17 * (1 - b) + .1 * (h - .5), y = .45 + .55 * b;
				break;
			}
			case `bark`: {
				let t = noise(e, d, 4, 6, r ^ 15127), n = noise(e + .035 * t, d, 18, 3, r ^ 33825), i = noise(e, d, 6, 18, r ^ 20883), a = smooth(clamp((n - .26) / .38)) * smooth(clamp((i - .18) / .22)), o = noise(e, d, 48, 12, r ^ 8571);
				g = .05 + a * (.43 + .33 * o + .13 * h), _ = a * (.58 + .3 * o + .12 * m), v += .08 * (1 - a) + .1 * (h - .5), y = .42 + .58 * a;
				break;
			}
			case `moss`: {
				let t = noise(e, d, 4, 4, r ^ 7015), i = smooth(clamp(1 - wrappedFeature(fract(e + .025 * t), fract(d + .018 * t), 9, r ^ 25519) / .95)), a = noise(e, d, 18, 18, r ^ 37671), o = smooth(clamp((h - .25) / .5));
				g = .09 + .46 * i + .24 * a + .19 * o, _ = .65 * i + (.09 + .14 * i) * o + .12 * m, v += .06 * (o - .5) - .08 * (1 - i), y = .52 + .36 * i + .12 * o;
				break;
			}
			case `mud`: {
				let t = noise(e, d, 4, 4, r ^ 29011), n = (e + .025 * t) * 7, i = (d + .025 * noise(e, d, 4, 4, r ^ 7993)) * 7, a = Math.floor(n), o = Math.floor(i), s = 4, c = 4;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let l = a + t, u = o + e, d = (l % 7 + 7) % 7, f = (u % 7 + 7) % 7, p = n - l - .3 - .4 * hash(d, f, r), m = i - u - .3 - .4 * hash(d, f, r ^ 40503), h = p * p + m * m;
					h < s ? (c = s, s = h) : h < c && (c = h);
				}
				let u = smooth(clamp((Math.sqrt(c) - Math.sqrt(s) - .025) / .13)), f = smooth(clamp((noise(e, d, 3, 3, r ^ 14561) - .25) / .5));
				g = .04 + u * (.52 - .24 * f + .17 * m) + .04 * h, _ = u * (.48 + .16 * (1 - s)) + (.07 * m + .03 * h) * (1 - .75 * f), v -= .38 * f, v += .1 * (1 - u) + .08 * (h - .5) * (1 - f), y = .48 + .52 * u;
				break;
			}
			case `granite`: {
				let t = e * 38, n = d * 38, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0, c = 4, l = 4;
				for (let e = -1; e <= 1; e++) for (let u = -1; u <= 1; u++) {
					let d = i + u, f = a + e, p = (d % 38 + 38) % 38, m = (f % 38 + 38) % 38, h = t - d - .3 - .4 * hash(p, m, r), g = n - f - .3 - .4 * hash(p, m, r ^ 40503), _ = h * h + g * g;
					_ < c ? (l = c, c = _) : _ < l && (l = _);
					let v = clamp(1 - _ / 1.44) ** 10, y = hash(p, m, r ^ 25643);
					o += v * (y < .24 ? .08 + y : .48 + .5 * y), s += v;
				}
				let u = o / Math.max(s, 1e-12), f = 1 - smooth(clamp((Math.sqrt(l) - Math.sqrt(c)) / .16));
				g = clamp(.04 + .88 * u + .1 * (h - .5) - .07 * f), _ = .35 * u + .17 * h - .12 * f, v += .16 * (1 - u) + .06 * (h - .5), y = .97 - .025 * f + .03 * h;
				break;
			}
			case `slate`: {
				let t = noise(e, d, 5, 4, r ^ 16743), n = noise(e + .025 * t, d + .018 * t, 3, 22, r ^ 29723) * 5, i = (Math.floor(n) + smooth(clamp((fract(n) - .35) / .3))) / 5, a = noise(e, d, 12, 5, r ^ 4955), o = (1 - Math.abs(2 * fract(n) - 1)) ** 8 * smooth(clamp((a - .18) / .35));
				g = .14 + .62 * i + .14 * h - .12 * o, _ = .72 * i + .1 * h - .18 * o, v += .1 * o + .1 * (h - .5), y = .98 - .15 * o + .02 * h;
				break;
			}
			case `terrazzo`: {
				let t = e * 9, i = d * 9, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let u = -1; u <= 1; u++) {
					let d = a + u, f = o + e, p = (d % 9 + 9) % 9, m = (f % 9 + 9) % 9, h = hash(p, m, r ^ 37499), g = hash(p, m, r ^ 13341) * n, _ = Math.cos(g), v = Math.sin(g), y = t - d - .3 - .4 * hash(p, m, r), b = i - f - .3 - .4 * hash(p, m, r ^ 40503), x = y * _ + b * v, S = b * _ - y * v, C = .75 + .25 * hash(p, m, r ^ 8623), w = Math.max(Math.abs(x) * C, Math.abs(S), (x * .65 + S * .76) * 1.1, (-x * .83 + S * .55) * 1.15), E = smooth(clamp((.26 + .18 * h - w) / .025));
					s = Math.max(s, E), c += E * (.08 + .7 * hash(p, m, r ^ 22815)), l += E;
				}
				let u = c / Math.max(l, 1e-12);
				g = (.88 + .06 * m) * (1 - s) + s * u, _ = .15 + .06 * s + .015 * m + .025 * h, v += .055 * (1 - s) - .03 * s * u + .04 * (h - .5), y = .98 + .015 * s + .005 * h;
				break;
			}
			case `denim`: {
				let t = e * 24, i = d * 24, o = .5 + .5 * Math.cos(n * t), s = .5 + .5 * Math.cos(n * i), c = 1 - smooth(clamp((Math.abs(Math.sin(Math.PI * (t - i) / 4)) - .24) / .22)), l = .5 + .5 * Math.sin(n * (96 * e + .12 * m) + a), u = .5 + .5 * Math.sin(n * (96 * d + .12 * m) + a), f = l * (1 - c) + u * c, p = o * (1 - c) + s * c, h = noise(e, d, 24, 4, r ^ 27953);
				g = .12 + .22 * p + .34 * c + .1 * f + .12 * h, _ = .42 * p + .24 * (1 - c) + .06 * f + .08 * h, v += .06 * (m - .5) + .04 * (1 - p), y = .78 + .18 * p + .04 * f;
				break;
			}
			case `burlap`: {
				let t = e * 10, r = d * 10, i = smooth(clamp((Math.cos(n * t) + .35) / 1.1)), o = smooth(clamp((Math.cos(n * r) + .35) / 1.1)), s = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t + r)))), c = i * (1 - o + o * s), l = o * (1 - i + i * (1 - s)), u = c + l, f = .5 + .5 * Math.sin(n * (50 * e + .14 * m) + a), p = .5 + .5 * Math.sin(n * (50 * d + .14 * m) + a), h = c * f + l * p, b = i * o;
				g = .04 + .65 * u + .14 * h + .1 * m * u, _ = .58 * u + .2 * b + .08 * h + .04 * m, v += .05 * (m - .5) + .025 * (1 - u), y = .42 + .54 * u + .04 * h;
				break;
			}
			case `carpet`: {
				let t = e * 24, i = d * 24, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let d = -1; d <= 1; d++) {
					let f = a + d, p = o + e, m = (f % 24 + 24) % 24, h = (p % 24 + 24) % 24, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), y = clamp(1 - (g * g + _ * _)) ** 3, b = hash(m, h, r ^ 10571), x = hash(m, h, r ^ 26655) * n, S = (.5 + .5 * Math.sin(n * 3 * (g * Math.cos(x) + _ * Math.sin(x)) + b * n)) ** 4;
					s += y, c += y * b, l += y * S, u = Math.max(u, y * (.75 + .25 * b));
				}
				let f = 1 / Math.max(s, 1e-12), p = c * f, h = l * f;
				g = .19 + .4 * p + .2 * u + .13 * h + .08 * m, _ = .3 + .38 * u + .12 * h + .1 * m, v += .04 * (m - .5) - .035 * h, y = .7 + .22 * Math.sqrt(u) + .06 * h;
				break;
			}
			case `plaster`: {
				let t = noise(e, d, 3, 3, r ^ 14241), i = (.5 + .5 * Math.sin(n * (3 * e + 2 * d + .7 * t) + a)) ** 10, o = noise(e, d, 18, 5, r ^ 21721), s = smooth(clamp((.32 - h) / .23));
				g = .61 + .2 * t + .08 * o + .07 * i - .12 * s, _ = .22 + .28 * t + .18 * i + .08 * o - .14 * s, v += .1 * (h - .5) - .065 * i + .045 * s, y = .98 - .1 * s - .025 * i;
				break;
			}
			case `terracotta`: {
				let t = noise(e, d, 5, 5, r ^ 14871), n = noise(e + .04 * t, d, 12, 9, r ^ 32035), a = 1 - smooth(clamp((wrappedFeature(e, d, 28, r ^ 18541) - .04) / .19)), o = smooth(clamp((t - .5) / .3));
				g = .37 + .46 * n + .15 * m - .18 * o - .17 * a, _ = .35 + .14 * m + .12 * h - .3 * a, v += .1 * (h - .5) + .07 * a - .04 * o, y = .97 - .22 * a + .025 * h;
				break;
			}
			case `cork`: {
				let t = e * 14, i = d * 14, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let d = -1; d <= 1; d++) {
					let f = a + d, p = o + e, m = (f % 14 + 14) % 14, h = (p % 14 + 14) % 14, g = t - f - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), v = n * hash(m, h, r ^ 19745), y = g * Math.cos(v) + _ * Math.sin(v), b = _ * Math.cos(v) - g * Math.sin(v), S = clamp(1 - (.9 * y * y + 1.3 * b * b) / 1.21) ** 8, C = hash(m, h, r ^ 5931), w = (.5 + .5 * Math.sin(n * (5 * b + .3 * y) + n * C)) ** 12;
					s += S, c += S * C, u += S * w, l = Math.max(l, S);
				}
				let f = 1 / Math.max(s, 1e-12), p = c * f, b = u * f, x = 1 - smooth(clamp((l * f - .48) / .4));
				g = .31 + .57 * p + .12 * m - .22 * x - .09 * b, _ = .4 + .16 * p + .07 * h - .2 * x - .07 * b, v += .07 * (h - .5) + .045 * x - .025 * p, y = .97 - .18 * x - .08 * b;
				break;
			}
			case `rubber`: {
				let n = 1 - smooth(clamp((wrappedFeature(e, d, 44, r ^ 36435) - .08) / .55));
				g = .19 + .38 * n + .19 * h + .1 * m, _ = .19 + .49 * n + .15 * h + .06 * m, v += .12 * (h - .5) - .045 * n, y = .9 + .08 * n + .02 * h;
				break;
			}
			case `carbonfiber`: {
				let t = 12 * (e + d), r = 12 * (d - e), i = .5 + .5 * Math.cos(n * t), o = .5 + .5 * Math.cos(n * r), s = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t - r) / 2))), c = .5 + .5 * Math.sin(n * (4 * t + .08 * m) + a), l = .5 + .5 * Math.sin(n * (4 * r + .08 * m) + a), u = i * s + o * (1 - s), f = c * s + l * (1 - s);
				g = .12 + .46 * u + .2 * f + .12 * m, _ = .25 + .37 * u + .055 * f + .04 * m, v += .065 * (m - .5) + .045 * (1 - u), y = .88 + .1 * u + .02 * f;
				break;
			}
			case `diamondplate`: {
				let t = e * 8, n = d * 8, i = fract(t) - .5, a = fract(n) - .5, o = (Math.floor(t) + Math.floor(n)) % 2 == 0 ? 1 : -1, s = (i + o * a) * Math.SQRT1_2, c = (a - o * i) * Math.SQRT1_2, u = smooth(clamp((1 - (Math.abs(s) / .48 + Math.abs(c) / .14)) / .24)), f = noise(e, d, 4, 64, r ^ 13793);
				g = .35 + .25 * f + .29 * u + .07 * m, _ = .08 + .78 * u + .025 * f, v += .14 * (f - .5) - .075 * u, y = .94 + .05 * u + .01 * m;
				break;
			}
			case `paper`: {
				let t = noise(e, d, 3, 5, r ^ 33207), i = noise(e, d, 48, 48, r ^ 22483), a = e * 24, o = d * 24, s = Math.floor(a), c = Math.floor(o), l = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let i = s + t, u = c + e, d = (i % 24 + 24) % 24, f = (u % 24 + 24) % 24, p = a - i - .35 - .3 * hash(d, f, r), m = o - u - .35 - .3 * hash(d, f, r ^ 6463), h = n * hash(d, f, r ^ 29409), g = p * Math.cos(h) + m * Math.sin(h), _ = m * Math.cos(h) - p * Math.sin(h), v = .42 + .28 * hash(d, f, r ^ 23337), b = clamp(1 - (g * g / (v * v) + _ * _ / .0064)) ** 2;
					l = Math.max(l, b);
				}
				g = .62 + .24 * t + .1 * i - .2 * l, _ = .22 + .12 * t + .22 * i + .3 * l, v += .08 * (i - .5) + .04 * l, y = .98 - .07 * l - .035 * (1 - i);
				break;
			}
			case `wicker`: {
				let t = e * 6, i = d * 6, a = .5 + .5 * Math.cos(n * t), o = .5 + .5 * Math.cos(n * i), s = smooth(clamp((Math.cos(n * t) + .92) / .3)), c = smooth(clamp((Math.cos(n * i) + .92) / .3)), l = smooth(clamp(.5 + 1.4 * Math.cos(Math.PI * t) * Math.cos(Math.PI * i))), u = s * (1 - c + c * l), f = c * (1 - s + s * (1 - l)), p = u + f, h = noise(e, d, 72, 4, r ^ 28465), b = noise(e, d, 4, 72, r ^ 10903), x = u * h + f * b, S = u * a + f * o;
				g = .08 + .5 * p + .16 * S + .18 * x, _ = .04 + .48 * p + .32 * S + .045 * x, v += .1 * (m - .5) + .1 * (1 - p) - .04 * x, y = .34 + .54 * p + .1 * S;
				break;
			}
			case `bamboo`: {
				let t = noise(e, d, 64, 4, r ^ 19313), i = noise(e, d, 4, 3, r ^ 26909), o = .5 + .5 * Math.sin(n * (48 * e + .22 * i) + a), s = noise(e, 0, 4, 1, r ^ 10453), c = 1 - Math.cos(n * (3 * d + .65 * s + .07 * Math.sin(n * 4 * e)) + a), l = 1 - smooth(clamp(c / .16)), u = 1 - smooth(clamp(c / .42));
				g = .46 + .23 * t + .16 * o + .08 * m - .34 * l, _ = .3 + .14 * t + .12 * o + .16 * u - .1 * l, v += .12 * l + .1 * (t - .5) - .035 * o, y = .99 - .14 * l - .025 * (1 - t);
				break;
			}
			case `hammeredmetal`: {
				let t = e * 12, n = d * 12, i = Math.floor(t), a = Math.floor(n), o = 0;
				for (let e = -1; e <= 1; e++) for (let s = -1; s <= 1; s++) {
					let c = i + s, l = a + e, u = (c % 12 + 12) % 12, d = (l % 12 + 12) % 12, f = t - c - .35 - .3 * hash(u, d, r), p = n - l - .35 - .3 * hash(u, d, r ^ 29339), m = .85 + .25 * hash(u, d, r ^ 6461), h = clamp(1 - (f * f + p * p) / (m * m));
					o += h * h * (.7 + .3 * hash(u, d, r ^ 23063));
				}
				let s = 1 - Math.exp(-1.6 * o), c = noise(e, d, 4, 4, r ^ 20001);
				g = .72 - .32 * s + .14 * c + .045 * m, _ = .85 - .7 * s + .008 * m, v += .1 * (c - .5) + .09 * s, y = .99 - .12 * s;
				break;
			}
			case `galvanized`: {
				let t = e * 10, i = d * 10, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let u = -1; u <= 1; u++) {
					let d = a + u, f = o + e, p = (d % 10 + 10) % 10, m = (f % 10 + 10) % 10, h = t - d - .35 - .3 * hash(p, m, r), g = i - f - .35 - .3 * hash(p, m, r ^ 15225), _ = n * hash(p, m, r ^ 22435), v = h * Math.cos(_) + g * Math.sin(_), y = g * Math.cos(_) - h * Math.sin(_), b = clamp(1 - (h * h + g * g) / 1.21) ** 8, x = hash(p, m, r ^ 18897), S = .5 + .5 * Math.cos(n * (3 * y + 1.5 * Math.abs(v)));
					s += b, c += b * x, l += b * S;
				}
				let u = 1 / Math.max(s, 1e-12), f = c * u, p = l * u;
				g = .18 + .65 * f + .12 * p + .035 * m, _ = .3 + .18 * f + .035 * p + .015 * m, v += .24 * (f - .5) + .045 * (p - .5), y = .98 + .02 * f;
				break;
			}
			case `corrugatedmetal`: {
				let t = .5 + .5 * Math.cos(n * 8 * e + a), i = noise(e, d, 64, 4, r ^ 8043), o = (.5 + .5 * Math.sin(n * 48 * e + a)) ** 12;
				g = .5 + .2 * t + .16 * i - .06 * o, _ = .1 + .8 * t + .004 * i - .002 * o, v += .13 * (i - .5) + .06 * o, y = .91 + .08 * t;
				break;
			}
			case `sandstone`: {
				let t = noise(e, d, 3, 5, r ^ 26941), i = d + .055 * (t - .5), o = .5 + .5 * Math.sin(8 * i * n + a), s = (.5 + .5 * Math.sin(19 * i * n + a)) ** 6, c = noise(e, d, 8, 3, r ^ 19735), l = smooth(clamp((h - .28) / .48)), u = (1 - h) ** 5;
				g = .22 + .35 * o + .2 * c + .18 * l - .2 * s, _ = .32 + .16 * o - .09 * s + .24 * l - .1 * u, v += .12 * (l - .5) + .05 * s, y = .97 - .12 * s - .13 * u + .025 * l;
				break;
			}
			case `travertine`: {
				let t = e * 12, i = d * 18, o = Math.floor(t), s = Math.floor(i), c = 0;
				for (let e = -1; e <= 1; e++) for (let a = -1; a <= 1; a++) {
					let l = o + a, u = s + e, d = (l % 12 + 12) % 12, f = (u % 18 + 18) % 18, p = hash(d, f, r ^ 24211), m = (hash(d, f, r ^ 9169) - .5) * .36, h = Math.cos(m), g = Math.sin(m), _ = t - l - .2 - .6 * hash(d, f, r), v = i - u - .2 - .6 * hash(d, f, r ^ 31513), y = _ * h + v * g, b = v * h - _ * g, x = .42 + .36 * p, S = .11 + .13 * hash(d, f, r ^ 36657), w = smooth(clamp((1 - (y * y / (x * x) + b * b / (S * S) + .12 * Math.sin(9 * y + p * n) * Math.sin(13 * b))) / .65));
					c += w * (.65 + .35 * p);
				}
				let l = 1 - Math.exp(-1.8 * c), u = noise(e, d, 3, 3, r ^ 16855), f = .5 + .5 * Math.sin(n * (6 * d + .18 * u) + a);
				g = .65 + .12 * f + .09 * h - .48 * l, _ = .62 + .05 * f + .04 * h - .3 * l, v += .15 * l + .08 * (h - .5), y = .98 - .42 * l;
				break;
			}
			case `pumice`: {
				let t = e * 26, n = d * 26, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 26 + 26) % 26, f = (u % 26 + 26) % 26, p = t - l - .15 - .7 * hash(d, f, r), m = n - u - .15 - .7 * hash(d, f, r ^ 25375), h = .24 + .2 * hash(d, f, r ^ 14521), g = (p * p + m * m) / (h * h), _ = clamp(1 - g), v = _ * _;
					o = Math.max(o, v), s = Math.max(s, 6 * g * v);
				}
				g = .65 + .12 * noise(e, d, 5, 5, r ^ 40007) + .08 * h - .57 * o + .05 * s, _ = .72 - .58 * o + .08 * s + .03 * h, v += .07 * o + .07 * (h - .5), y = .98 - .52 * o + .01 * m;
				break;
			}
			case `parquet`: {
				let t = e * 4, a = d * 4, o = Math.floor(t), s = Math.floor(a), c = (o + s) % 2 == 0, l = fract(c ? t : a), u = fract(c ? a : t), f = Math.floor(u * 3), h = smooth(clamp((Math.min(l, 1 - l, fract(u * 3) / 3, (1 - fract(u * 3)) / 3) - .006) / .016)), b = hash(o * 3 + f, s, r), x = noise(e, d, 8, 8, r ^ 14105), S = .5 + .5 * Math.sin(n * (u * 38 + .28 * Math.sin(n * l) + .18 * x) + b * n);
				g = .06 + h * (.25 + .32 * b + .22 * S + .06 * m), _ = h * (.76 + .045 * S + .025 * m), v = .78 + h * (i.roughness - .78 + .09 * S + .04 * b), y = .52 + .46 * h;
				break;
			}
			case `mosaic`: {
				let t = e * 16, n = d * 16, a = fract(t), o = fract(n), c = smooth(clamp((Math.min(a, 1 - a, o, 1 - o) - .018) / .042)), l = hash(Math.floor(t), Math.floor(n), r);
				g = .2 + c * (.08 + .56 * l + .1 * m), _ = c * (.78 + .08 * l + .025 * m), v = .76 + c * (i.roughness - .76 + .11 * l + .04 * m), y = .6 + .39 * c, b = 1 - c;
				break;
			}
			case `hexagontiles`: {
				let t = Math.sqrt(3), n = e * 5, a = d * 6 * t / 2, o = Math.floor(a / (t / 2)), s = 1 / 0, c = 0, l = 0, u = 0, f = 0;
				for (let e = -1; e <= 1; e++) {
					let r = o + e, i = (r % 2 + 2) % 2 * .5, d = Math.round(n - i);
					for (let e = -1; e <= 1; e++) {
						let o = d + e, p = n - o - i, m = a - r * t / 2, h = p * p + m * m;
						h < s && (s = h, c = p, l = m, u = (o % 5 + 5) % 5, f = (r % 6 + 6) % 6);
					}
				}
				let h = smooth(clamp((.5 - Math.max(Math.abs(c), Math.abs(c * .5 + l * t / 2), Math.abs(c * .5 - l * t / 2)) - .012) / .034)), x = hash(u, f, r);
				g = .2 + h * (.28 + .35 * x + .07 * m), _ = h * (.8 + .045 * x + .02 * m), v = .74 + h * (i.roughness - .74 + .1 * x + .04 * m), y = .6 + .39 * h, b = 1 - h;
				break;
			}
			case `knit`: {
				let t = e * 8, r = d * 8, i = Math.floor(t), o = Math.floor(r), s = 0;
				for (let e = -1; e <= 1; e += 2) {
					let n = t - i - .5, a = r - o - .84, c = e * .34, l = -.68, u = clamp((n * c + a * l) / (c * c + l * l)), d = n - u * c, f = a - u * l, m = smooth(clamp(1 - (d * d + f * f) / .0169));
					s += (1 - s) * m;
				}
				let c = .5 + .25 * Math.sin(n * (48 * e + 24 * d) + a) + .25 * Math.sin(n * (48 * e - 24 * d) - a);
				g = .12 + .64 * s + .1 * m + .07 * s * c, _ = .08 + s * (.76 + .045 * c) + .025 * m, v += .065 * (m - .5) + .035 * (1 - s), y = .58 + .41 * s;
				break;
			}
			case `corduroy`: {
				let t = (.5 + .5 * Math.cos(n * e * 12)) ** .65, i = noise(e, d, 96, 96, r ^ 11121), a = noise(e, d, 12, 48, r ^ 31907);
				g = .12 + .57 * t + .16 * i + .08 * a, _ = .07 + .79 * t + .035 * i + .025 * a, v += .08 * (i - .5) + .035 * (1 - t), y = .57 + .42 * t;
				break;
			}
			case `felt`: {
				let t = e * 20, i = d * 20, a = Math.floor(t), o = Math.floor(i), s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = a + c, u = o + e, d = (l % 20 + 20) % 20, f = (u % 20 + 20) % 20, p = t - l - .25 - .5 * hash(d, f, r), m = i - u - .25 - .5 * hash(d, f, r ^ 41845), h = hash(d, f, r ^ 27415) * n, g = Math.cos(h), _ = Math.sin(h), v = (p * g + m * _) / .6, y = (m * g - p * _) / .055, b = clamp(1 - v * v - y * y);
					s += (1 - s) * b * b;
				}
				g = .28 + .28 * m + .3 * s, _ = .18 + .035 * m + .065 * s, v += .065 * (m - .5) + .025 * s, y = .96 + .025 * s + .01 * m;
				break;
			}
			case `roofshingles`: {
				let t = Math.floor(d * 6), n = fract(d * 6), i = e * 4 + t % 2 * .5, a = fract(i), o = smooth(clamp(Math.min(n, 1 - n) / .12)), s = smooth(clamp(Math.min(a, 1 - a) / .055)), c = (1 - s) * smooth(clamp((n - .32) / .16)) * o, l = o * s, u = hash(Math.floor(i) % 4, t, r ^ 25527), f = smooth(clamp((noise(e, d, 64, 64, r ^ 19765) - .2) / .6)), p = 1 - o;
				g = .24 + .32 * f + .2 * l * u - .15 * p - .14 * c, _ = .2 + .38 * o - .2 * c + .13 * f + .05 * l * u, v += .12 * (f - .5) + .04 * p + .03 * c, y = .96 - .24 * p - .2 * c + .025 * f;
				break;
			}
			case `rooftiles`: {
				let t = fract(e * 6 + .5), i = fract(d * 5), a = .5 + .5 * Math.cos(n * e * 6), o = smooth(clamp(Math.min(i, 1 - i) / .13)), s = o * smooth(clamp(Math.min(t, 1 - t) / .12)), c = hash(Math.floor(e * 6 + .5) % 6, Math.floor(d * 5), r ^ 31297), l = noise(e, d, 24, 32, r ^ 23591), u = 1 - o;
				g = .26 + .24 * a + .23 * s * c + .14 * l - .14 * u, _ = .16 + .65 * a - .1 * u + .035 * s * c + .012 * l, v += .13 * (l - .5) + .05 * (1 - a) + .045 * u, y = .76 + .22 * a - .14 * u + .015 * l;
				break;
			}
			case `stucco`: {
				let t = e * 28, n = d * 28, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 28 + 28) % 28, f = (u % 28 + 28) % 28, p = hash(d, f, r ^ 17337), m = t - l - .2 - .6 * hash(d, f, r), h = n - u - .2 - .6 * hash(d, f, r ^ 6083), g = .3 + .25 * p, _ = clamp(1 - (m * m + h * h * (.7 + p)) / (g * g)), v = _ * _;
					p < .28 ? s += (1 - s) * v : o += (1 - o) * v;
				}
				let c = noise(e, d, 5, 7, r ^ 21373);
				g = .52 + .15 * c + .19 * o - .24 * s + .08 * m, _ = .27 + .16 * c + .43 * o - .22 * s + .06 * m, v += .055 * o + .065 * s + .05 * (m - .5), y = .96 - .25 * s - .075 * o + .02 * m;
				break;
			}
			case `lichen`: {
				let t = e * 7, i = d * 7, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let u = a + l, d = o + e, f = (u % 7 + 7) % 7, p = (d % 7 + 7) % 7, m = t - u - .25 - .5 * hash(f, p, r), h = i - d - .25 - .5 * hash(f, p, r ^ 29107), g = Math.atan2(h, m), _ = hash(f, p, r ^ 15449), v = (.38 + .16 * _) * (1 + .13 * Math.cos(5 * g + _ * n) + .09 * Math.sin(3 * g - _ * n)), y = smooth(clamp((1 - Math.hypot(m, h) / v) / .18));
					s += (1 - s) * y, c += y * (_ - .5);
				}
				let l = smooth(clamp((noise(e, d, 96, 96, r ^ 27171) - .58) / .25));
				g = .16 + .13 * m + .53 * s + .07 * Math.tanh(c) - .18 * s * l, _ = .15 + .035 * m + s * (.48 - .17 * l), v += .04 * (m - .5) + .035 * s * l, y = .9 + .08 * s - .15 * s * l;
				break;
			}
			case `leaflitter`: {
				let t = e * 6, i = d * 6, a = Math.floor(t), o = Math.floor(i), s = 0, c = 0, l = 0;
				for (let e = -1; e <= 1; e++) for (let u = -1; u <= 1; u++) {
					let d = a + u, f = o + e, p = (d % 6 + 6) % 6, m = (f % 6 + 6) % 6, h = t - d - .2 - .6 * hash(p, m, r), g = i - f - .2 - .6 * hash(p, m, r ^ 10679), _ = hash(p, m, r ^ 20273) * n, v = Math.cos(_), y = Math.sin(_), b = hash(p, m, r ^ 20905), x = (h * v + g * y) / (.64 + .1 * b), S = (g * v - h * y) / (.26 + .05 * b), C = smooth(clamp((1 - x * x - Math.sqrt(S * S + 1e-4)) / .18)), w = C * Math.exp(-S * S * 260);
					s += (1 - s) * C, l += (1 - l) * w, c += C * (b - .5);
				}
				g = .07 + .09 * m + .56 * s + .16 * Math.tanh(c) - .12 * l, _ = .08 + .035 * m + .61 * s + .045 * l, v += .07 * (m - .5) + .045 * (1 - s), y = .53 + .44 * s;
				break;
			}
			case `endgrain`: {
				let t = fract(e - o + .5) - .5, i = fract(d - s + .5) - .5, c = Math.sin(Math.PI * t) / Math.PI, l = Math.sin(Math.PI * i) / Math.PI, u = Math.sqrt(c * c + l * l + 4e-4), f = noise(e, d, 5, 5, r ^ 31811), p = (.5 + .5 * Math.sin(n * (23 * u + .23 * f) + a)) ** 6, h = smooth(clamp((noise(e, d, 96, 96, r ^ 5607) - .62) / .23)), b = Math.hypot(t, i), x = smooth(clamp((b - .07) / .08)) * smooth(clamp((.43 - b) / .08)) * (.5 + .5 * Math.cos(7 * Math.atan2(i, t) + a)) ** 48;
				g = .76 - .37 * p - .2 * h - .24 * x + .08 * m, _ = .49 - .07 * p - .16 * h - .22 * x + .025 * m, v += .13 * h + .06 * p + .045 * (m - .5), y = .99 - .17 * h - .22 * x;
				break;
			}
			case `acousticfoam`: {
				let t = fract(e * 4) - .5, n = fract(d * 4) - .5, i = Math.sqrt(t * t + 1e-4), a = Math.sqrt(n * n + 1e-4), s = clamp(1 - 2 * (.5 * (i + a + Math.sqrt((i - a) ** 2 + 4e-4)))), c = s < .1 ? s * s * 5 : s > .9 ? .9 - (1 - s) * (1 - s) * 5 : s - .05, l = hash(Math.floor(e * 4), Math.floor(d * 4), r ^ 14289), u = smooth(clamp((noise(e, d, 96, 96, r ^ 27417) - .42) / .46));
				g = .14 + .61 * c + .13 * m - .12 * u, _ = .03 + c * (.88 + .07 * l) + .009 * m - .008 * u, v += .065 * (m - .5) + .025 * u, y = .43 + .54 * c + .025 * m - .025 * u;
				break;
			}
			case `closedcellfoam`: {
				let t = e * 28, n = d * 28, r = Math.floor(t), i = Math.floor(n), a = 0, o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let l = -1; l <= 1; l++) {
					let u = r + l, d = i + e, f = (u % 28 + 28) % 28, p = ((d % 28 + 28) % 28 * 28 + f) * 4, m = t - u - c[p], h = n - d - c[p + 1], g = clamp(1 - (m * m + h * h) * c[p + 2]), _ = g * g;
					a += (1 - a) * _, o += (1 - o) * _ * (1 - g) * 6.75, s += _ * (c[p + 3] - .5);
				}
				g = .49 + .18 * m - .13 * a + .08 * o + .1 * s, _ = .48 + .035 * m - .17 * a + .055 * o, v += .065 * (m - .5) + .025 * a, y = .99 - .065 * a;
				break;
			}
			case `linoleum`: {
				let t = noise(e, d, 4, 5, r ^ 22811), i = .5 + .5 * Math.sin(n * (5 * e + 3 * d + 1.2 * t) + a), o = noise(e + .19 * t, d + .08 * i, 48, 8, r ^ 11635), s = smooth(clamp((o - .43) / .4));
				g = .24 + .25 * i + .38 * s + .08 * m, _ = .45 + .025 * m + .015 * o, v += .09 * (o - .5) + .045 * (m - .5), y = .99 + .008 * m;
				break;
			}
		}
		f.color = g, f.height = _ * i.relief, f.roughness = clamp(v), f.occlusion = y, f.mortar = b, f.metallic = x;
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