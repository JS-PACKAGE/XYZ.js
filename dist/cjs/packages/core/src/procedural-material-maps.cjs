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
	let i = require_materials.proceduralMaterialPresets[t], a = hash(0, 0, r) * n, o = t === `stone` || t === `metal` || t === `marble`, s = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud` || t === `granite` || t === `slate` || t === `terrazzo` || t === `plaster` || t === `terracotta` || t === `cork` || t === `rubber` || t === `sandstone` || t === `travertine` || t === `pumice`;
	return (e, c, l) => {
		e = fract(e), c = fract(c);
		let u = o ? noise(e, c, 4, 4, r) : 0, d = noise(e, c, 32, 32, r ^ 2747636419), f = s ? noise(e, c, 64, 64, r ^ 2135587861) : 0, p = u, m = u, h = i.roughness, g = 1, _ = 0, v = +(t === `metal` || t === `diamondplate` || t === `hammeredmetal` || t === `galvanized` || t === `corrugatedmetal`);
		switch (t) {
			case `wood`: {
				let t = noise(e, c, 4, 2, r ^ 71), i = .5 + .5 * Math.sin(n * (12 * e + .65 * t) + a), o = (.5 + .5 * Math.sin(n * (40 * e + t) + a)) ** 12;
				p = clamp(.22 + .6 * i + .16 * d - .2 * o), m = .65 * i + .15 * d - .18 * o, h += .15 * o + .08 * (d - .5), g = 1 - .15 * o;
				break;
			}
			case `brick`: {
				let t = Math.floor(c * 8), n = fract(e * 4 + t % 2 * .5), i = fract(c * 8), o = smooth(clamp((Math.min(n, 1 - n, i * .5, (1 - i) * .5) - .014) / .045));
				p = .25 + .42 * hash(Math.floor(e * 4 + t % 2 * .5) % 4, t, r) + .2 * d, m = o * (.75 + .15 * d + .1 * f), _ = 1 - o, h += .09 * _ + .05 * (d - .5), g = .65 + .35 * o;
				break;
			}
			case `stone`: {
				let t = noise(e + .12 * u, c, 8, 8, r ^ 131);
				p = clamp(.1 + .65 * t + .3 * d), m = .65 * t + .25 * d + .1 * f, h += .1 * (d - .5), g = .8 + .2 * smooth(m);
				break;
			}
			case `metal`: {
				let t = noise(e, c, 4, 64, r ^ 313), i = (.5 + .5 * Math.sin(n * c * 48 + a)) ** 16;
				p = .4 + .38 * t + .12 * u - .1 * i, m = .7 * t - .15 * i, h += .18 * t + .08 * i, g = 1 - .04 * i;
				break;
			}
			case `fabric`: {
				let t = e * 12, r = c * 12, i = Math.sin(Math.PI * fract(t)) ** 2, o = Math.sin(Math.PI * fract(r)) ** 2, s = (Math.floor(t) + Math.floor(r)) % 2 == 0, l = s ? i * (.6 + .4 * o) : o * (.6 + .4 * i), u = .5 + .5 * Math.sin(n * (s ? e : c) * 48 + a);
				p = .22 + .48 * l + .14 * d + .08 * u, m = .8 * l + .06 * u + .08 * d, h += .04 * (d - .5), g = .68 + .32 * l;
				break;
			}
			case `marble`: {
				let t = noise(e, c, 4, 4, r ^ 997), i = Math.exp(-Math.abs(Math.sin(n * (3 * e + 2 * c + .8 * t) + a)) * 16);
				p = clamp(.9 + .1 * u - .85 * i), m = .3 * u - .2 * i + .05 * d, h += .1 * i + .04 * (d - .5), g = 1 - .06 * i;
				break;
			}
			case `concrete`: {
				let t = fract(e * 3), n = fract(c * 3), a = 1 - smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .02) / .035)), o = hash(Math.floor(fract(e) * 40), Math.floor(fract(c) * 40), r);
				p = .28 + .5 * o * (1 - a) + .12 * d, m = (1 - a) * (.65 + .25 * o) + .05 * d, h += .14 * a + .06 * (o - .5), g = .62 + .38 * (1 - a);
				break;
			}
			case `tiles`: {
				let t = fract(e * 5), n = fract(c * 5), a = smooth(clamp((Math.min(t, 1 - t, n, 1 - n) - .018) / .028));
				p = .42 + .4 * hash(Math.floor(e * 5) % 5, Math.floor(c * 5) % 5, r) + .08 * d, m = a * (.82 + .1 * d), _ = 1 - a, h += .42 * _ + .04 * (d - .5), g = .58 + .42 * a;
				break;
			}
			case `leather`: {
				let n = smooth(clamp(1 - wrappedFeature(e, c, 14, r ^ 81) * 1.55));
				p = .24 + .52 * n + .12 * d, m = .12 + .72 * n + .06 * d, h += .16 * (1 - n) + .04 * (d - .5), g = .55 + .45 * n;
				break;
			}
			case `sand`: {
				let t = noise(e, c, 3, 3, r ^ 17), i = .5 + .5 * Math.sin(n * (c * 7 + .35 * t) + a), o = noise(e, c, 48, 48, r ^ 20973);
				p = .3 + .48 * i + .18 * o, m = .72 * i + .22 * o, h += .06 * (o - .5), g = .82 + .18 * i;
				break;
			}
			case `rust`: {
				let t = noise(e, c, 6, 6, r ^ 211), n = noise(e, c, 18, 18, r ^ 419), i = smooth(clamp((t * .7 + n * .3 - .32) / .28));
				p = i, m = .25 + .45 * (1 - i) * n - .2 * i * t, h += .22 * i + .05 * (n - .5), g = .7 + .3 * (1 - i), v = 1 - i;
				break;
			}
			case `snow`: {
				let t = noise(e, c, 3, 3, r ^ 17), n = hash(Math.floor(fract(e) * 48), Math.floor(fract(c) * 48), r) ** 8;
				p = clamp(.22 + .68 * t + .1 * n), m = .7 * t + .2 * n, h += .22 * n - .06 * t, g = .88 + .12 * t;
				break;
			}
			case `asphalt`:
			case `gravel`: {
				let i = t === `asphalt`, a = i ? 40 : 12, o = e * a, s = c * a, l = Math.floor(o), u = Math.floor(s), _ = 0, v = 0, y = 0, b = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let c = l + t, f = u + e, p = (c % a + a) % a, m = (f % a + a) % a, h = hash(p, m, r ^ 29873), g = hash(p, m, r ^ 27145) * n, x = Math.cos(g), S = Math.sin(g), C = o - c - .25 - .5 * hash(p, m, r), w = s - f - .25 - .5 * hash(p, m, r ^ 40503), T = i ? .22 + .21 * h : .46 + .17 * h, E = .7 + .3 * hash(p, m, r ^ 20973), D = (C * x + w * S) / E, O = w * x - C * S, k = Math.sqrt(D * D + O * O) + (d - .5) * (i ? .08 : .16), A = smooth(clamp((T - k) / .16)), j = clamp(1 - k / T);
					_ = Math.max(_, A), b = Math.max(b, A * (.65 + .35 * j)), v += A * (.35 + .65 * h), y += A;
				}
				let x = v / Math.max(1, y);
				i ? (p = .06 + .58 * x + .1 * d + .06 * f, m = .58 * b + .18 * d + .24 * f, h += .08 * (1 - _) + .1 * (f - .5), g = .8 + .2 * _) : (p = .04 + .8 * x + .08 * f, m = b * (.84 + .16 * d) + .025 * f, h += .13 * (1 - _) + .1 * (f - .5), g = .42 + .58 * _);
				break;
			}
			case `cobblestone`: {
				let t = e + .012 * noise(e, c, 6, 8, r ^ 561), n = c + .009 * noise(e, c, 6, 8, r ^ 2323), i = Math.floor(fract(n) * 8), a = t * 6 + i % 2 * .5, o = fract(a), s = fract(n * 8), l = Math.abs(o - .5), u = Math.abs(s - .5) * .75, _ = Math.max(0, l - .38), v = Math.max(0, u - .255), b = smooth(clamp((.12 - Math.sqrt(_ * _ + v * v) - .018) / .085)), x = hash((Math.floor(a) % 6 + 6) % 6, i, r), S = 1 - .65 * (l * l + u * u);
				p = .05 + b * (.25 + .48 * x + .12 * d) + .05 * f, m = b * (.76 * S + .16 * d + .08 * f), h += .17 * (1 - b) + .1 * (f - .5), g = .45 + .55 * b;
				break;
			}
			case `bark`: {
				let t = noise(e, c, 4, 6, r ^ 15127), n = noise(e + .035 * t, c, 18, 3, r ^ 33825), i = noise(e, c, 6, 18, r ^ 20883), a = smooth(clamp((n - .26) / .38)) * smooth(clamp((i - .18) / .22)), o = noise(e, c, 48, 12, r ^ 8571);
				p = .05 + a * (.43 + .33 * o + .13 * f), m = a * (.58 + .3 * o + .12 * d), h += .08 * (1 - a) + .1 * (f - .5), g = .42 + .58 * a;
				break;
			}
			case `moss`: {
				let t = noise(e, c, 4, 4, r ^ 7015), i = smooth(clamp(1 - wrappedFeature(fract(e + .025 * t), fract(c + .018 * t), 9, r ^ 25519) / .95)), a = noise(e, c, 18, 18, r ^ 37671), o = smooth(clamp((f - .25) / .5));
				p = .09 + .46 * i + .24 * a + .19 * o, m = .65 * i + (.09 + .14 * i) * o + .12 * d, h += .06 * (o - .5) - .08 * (1 - i), g = .52 + .36 * i + .12 * o;
				break;
			}
			case `mud`: {
				let t = noise(e, c, 4, 4, r ^ 29011), n = (e + .025 * t) * 7, i = (c + .025 * noise(e, c, 4, 4, r ^ 7993)) * 7, a = Math.floor(n), o = Math.floor(i), s = 4, l = 4;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let c = a + t, u = o + e, d = (c % 7 + 7) % 7, f = (u % 7 + 7) % 7, p = n - c - .3 - .4 * hash(d, f, r), m = i - u - .3 - .4 * hash(d, f, r ^ 40503), h = p * p + m * m;
					h < s ? (l = s, s = h) : h < l && (l = h);
				}
				let _ = smooth(clamp((Math.sqrt(l) - Math.sqrt(s) - .025) / .13)), v = smooth(clamp((noise(e, c, 3, 3, r ^ 14561) - .25) / .5));
				p = .04 + _ * (.52 - .24 * v + .17 * d) + .04 * f, m = _ * (.48 + .16 * (1 - s)) + (.07 * d + .03 * f) * (1 - .75 * v), h -= .38 * v, h += .1 * (1 - _) + .08 * (f - .5) * (1 - v), g = .48 + .52 * _;
				break;
			}
			case `granite`: {
				let t = e * 38, n = c * 38, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0, l = 4, u = 4;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let d = i + c, f = a + e, p = (d % 38 + 38) % 38, m = (f % 38 + 38) % 38, h = t - d - .3 - .4 * hash(p, m, r), g = n - f - .3 - .4 * hash(p, m, r ^ 40503), _ = h * h + g * g;
					_ < l ? (u = l, l = _) : _ < u && (u = _);
					let v = clamp(1 - _ / 1.44) ** 10, y = hash(p, m, r ^ 25643);
					o += v * (y < .24 ? .08 + y : .48 + .5 * y), s += v;
				}
				let d = o / Math.max(s, 1e-12), _ = 1 - smooth(clamp((Math.sqrt(u) - Math.sqrt(l)) / .16));
				p = clamp(.04 + .88 * d + .1 * (f - .5) - .07 * _), m = .35 * d + .17 * f - .12 * _, h += .16 * (1 - d) + .06 * (f - .5), g = .97 - .025 * _ + .03 * f;
				break;
			}
			case `slate`: {
				let t = noise(e, c, 5, 4, r ^ 16743), n = noise(e + .025 * t, c + .018 * t, 3, 22, r ^ 29723) * 5, i = (Math.floor(n) + smooth(clamp((fract(n) - .35) / .3))) / 5, a = noise(e, c, 12, 5, r ^ 4955), o = (1 - Math.abs(2 * fract(n) - 1)) ** 8 * smooth(clamp((a - .18) / .35));
				p = .14 + .62 * i + .14 * f - .12 * o, m = .72 * i + .1 * f - .18 * o, h += .1 * o + .1 * (f - .5), g = .98 - .15 * o + .02 * f;
				break;
			}
			case `terrazzo`: {
				let t = e * 9, i = c * 9, a = Math.floor(t), o = Math.floor(i), s = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let d = a + c, f = o + e, p = (d % 9 + 9) % 9, m = (f % 9 + 9) % 9, h = hash(p, m, r ^ 37499), g = hash(p, m, r ^ 13341) * n, _ = Math.cos(g), v = Math.sin(g), y = t - d - .3 - .4 * hash(p, m, r), b = i - f - .3 - .4 * hash(p, m, r ^ 40503), x = y * _ + b * v, S = b * _ - y * v, C = .75 + .25 * hash(p, m, r ^ 8623), w = Math.max(Math.abs(x) * C, Math.abs(S), (x * .65 + S * .76) * 1.1, (-x * .83 + S * .55) * 1.15), E = smooth(clamp((.26 + .18 * h - w) / .025));
					s = Math.max(s, E), l += E * (.08 + .7 * hash(p, m, r ^ 22815)), u += E;
				}
				let _ = l / Math.max(u, 1e-12);
				p = (.88 + .06 * d) * (1 - s) + s * _, m = .15 + .06 * s + .015 * d + .025 * f, h += .055 * (1 - s) - .03 * s * _ + .04 * (f - .5), g = .98 + .015 * s + .005 * f;
				break;
			}
			case `denim`: {
				let t = e * 24, i = c * 24, o = .5 + .5 * Math.cos(n * t), s = .5 + .5 * Math.cos(n * i), l = 1 - smooth(clamp((Math.abs(Math.sin(Math.PI * (t - i) / 4)) - .24) / .22)), u = .5 + .5 * Math.sin(n * (96 * e + .12 * d) + a), f = .5 + .5 * Math.sin(n * (96 * c + .12 * d) + a), _ = u * (1 - l) + f * l, v = o * (1 - l) + s * l, y = noise(e, c, 24, 4, r ^ 27953);
				p = .12 + .22 * v + .34 * l + .1 * _ + .12 * y, m = .42 * v + .24 * (1 - l) + .06 * _ + .08 * y, h += .06 * (d - .5) + .04 * (1 - v), g = .78 + .18 * v + .04 * _;
				break;
			}
			case `burlap`: {
				let t = e * 10, r = c * 10, i = smooth(clamp((Math.cos(n * t) + .35) / 1.1)), o = smooth(clamp((Math.cos(n * r) + .35) / 1.1)), s = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t + r)))), l = i * (1 - o + o * s), u = o * (1 - i + i * (1 - s)), f = l + u, _ = .5 + .5 * Math.sin(n * (50 * e + .14 * d) + a), v = .5 + .5 * Math.sin(n * (50 * c + .14 * d) + a), y = l * _ + u * v, b = i * o;
				p = .04 + .65 * f + .14 * y + .1 * d * f, m = .58 * f + .2 * b + .08 * y + .04 * d, h += .05 * (d - .5) + .025 * (1 - f), g = .42 + .54 * f + .04 * y;
				break;
			}
			case `carpet`: {
				let t = e * 24, i = c * 24, a = Math.floor(t), o = Math.floor(i), s = 0, l = 0, u = 0, f = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let d = a + c, p = o + e, m = (d % 24 + 24) % 24, h = (p % 24 + 24) % 24, g = t - d - .35 - .3 * hash(m, h, r), _ = i - p - .35 - .3 * hash(m, h, r ^ 40503), y = clamp(1 - (g * g + _ * _)) ** 3, b = hash(m, h, r ^ 10571), x = hash(m, h, r ^ 26655) * n, S = (.5 + .5 * Math.sin(n * 3 * (g * Math.cos(x) + _ * Math.sin(x)) + b * n)) ** 4;
					s += y, l += y * b, u += y * S, f = Math.max(f, y * (.75 + .25 * b));
				}
				let _ = 1 / Math.max(s, 1e-12), v = l * _, y = u * _;
				p = .19 + .4 * v + .2 * f + .13 * y + .08 * d, m = .3 + .38 * f + .12 * y + .1 * d, h += .04 * (d - .5) - .035 * y, g = .7 + .22 * Math.sqrt(f) + .06 * y;
				break;
			}
			case `plaster`: {
				let t = noise(e, c, 3, 3, r ^ 14241), i = (.5 + .5 * Math.sin(n * (3 * e + 2 * c + .7 * t) + a)) ** 10, o = noise(e, c, 18, 5, r ^ 21721), s = smooth(clamp((.32 - f) / .23));
				p = .61 + .2 * t + .08 * o + .07 * i - .12 * s, m = .22 + .28 * t + .18 * i + .08 * o - .14 * s, h += .1 * (f - .5) - .065 * i + .045 * s, g = .98 - .1 * s - .025 * i;
				break;
			}
			case `terracotta`: {
				let t = noise(e, c, 5, 5, r ^ 14871), n = noise(e + .04 * t, c, 12, 9, r ^ 32035), a = 1 - smooth(clamp((wrappedFeature(e, c, 28, r ^ 18541) - .04) / .19)), o = smooth(clamp((t - .5) / .3));
				p = .37 + .46 * n + .15 * d - .18 * o - .17 * a, m = .35 + .14 * d + .12 * f - .3 * a, h += .1 * (f - .5) + .07 * a - .04 * o, g = .97 - .22 * a + .025 * f;
				break;
			}
			case `cork`: {
				let t = e * 14, i = c * 14, a = Math.floor(t), o = Math.floor(i), s = 0, l = 0, u = 0, _ = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let d = a + c, f = o + e, p = (d % 14 + 14) % 14, m = (f % 14 + 14) % 14, h = t - d - .35 - .3 * hash(p, m, r), g = i - f - .35 - .3 * hash(p, m, r ^ 40503), v = n * hash(p, m, r ^ 19745), y = h * Math.cos(v) + g * Math.sin(v), b = g * Math.cos(v) - h * Math.sin(v), S = clamp(1 - (.9 * y * y + 1.3 * b * b) / 1.21) ** 8, C = hash(p, m, r ^ 5931), w = (.5 + .5 * Math.sin(n * (5 * b + .3 * y) + n * C)) ** 12;
					s += S, l += S * C, _ += S * w, u = Math.max(u, S);
				}
				let v = 1 / Math.max(s, 1e-12), y = l * v, b = _ * v, x = 1 - smooth(clamp((u * v - .48) / .4));
				p = .31 + .57 * y + .12 * d - .22 * x - .09 * b, m = .4 + .16 * y + .07 * f - .2 * x - .07 * b, h += .07 * (f - .5) + .045 * x - .025 * y, g = .97 - .18 * x - .08 * b;
				break;
			}
			case `rubber`: {
				let n = 1 - smooth(clamp((wrappedFeature(e, c, 44, r ^ 36435) - .08) / .55));
				p = .19 + .38 * n + .19 * f + .1 * d, m = .19 + .49 * n + .15 * f + .06 * d, h += .12 * (f - .5) - .045 * n, g = .9 + .08 * n + .02 * f;
				break;
			}
			case `carbonfiber`: {
				let t = 12 * (e + c), r = 12 * (c - e), i = .5 + .5 * Math.cos(n * t), o = .5 + .5 * Math.cos(n * r), s = smooth(clamp(.5 + .9 * Math.cos(Math.PI * (t - r) / 2))), l = .5 + .5 * Math.sin(n * (4 * t + .08 * d) + a), u = .5 + .5 * Math.sin(n * (4 * r + .08 * d) + a), f = i * s + o * (1 - s), _ = l * s + u * (1 - s);
				p = .12 + .46 * f + .2 * _ + .12 * d, m = .25 + .37 * f + .055 * _ + .04 * d, h += .065 * (d - .5) + .045 * (1 - f), g = .88 + .1 * f + .02 * _;
				break;
			}
			case `diamondplate`: {
				let t = e * 8, n = c * 8, i = fract(t) - .5, a = fract(n) - .5, o = (Math.floor(t) + Math.floor(n)) % 2 == 0 ? 1 : -1, s = (i + o * a) * Math.SQRT1_2, l = (a - o * i) * Math.SQRT1_2, f = smooth(clamp((1 - (Math.abs(s) / .48 + Math.abs(l) / .14)) / .24)), _ = noise(e, c, 4, 64, r ^ 13793);
				p = .35 + .25 * _ + .29 * f + .07 * d, m = .08 + .78 * f + .025 * _, h += .14 * (_ - .5) - .075 * f, g = .94 + .05 * f + .01 * d;
				break;
			}
			case `paper`: {
				let t = noise(e, c, 3, 5, r ^ 33207), i = noise(e, c, 48, 48, r ^ 22483), a = e * 24, o = c * 24, s = Math.floor(a), l = Math.floor(o), u = 0;
				for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
					let i = s + t, c = l + e, d = (i % 24 + 24) % 24, f = (c % 24 + 24) % 24, p = a - i - .35 - .3 * hash(d, f, r), m = o - c - .35 - .3 * hash(d, f, r ^ 6463), h = n * hash(d, f, r ^ 29409), g = p * Math.cos(h) + m * Math.sin(h), _ = m * Math.cos(h) - p * Math.sin(h), v = .42 + .28 * hash(d, f, r ^ 23337), b = clamp(1 - (g * g / (v * v) + _ * _ / .0064)) ** 2;
					u = Math.max(u, b);
				}
				p = .62 + .24 * t + .1 * i - .2 * u, m = .22 + .12 * t + .22 * i + .3 * u, h += .08 * (i - .5) + .04 * u, g = .98 - .07 * u - .035 * (1 - i);
				break;
			}
			case `wicker`: {
				let t = e * 6, i = c * 6, a = .5 + .5 * Math.cos(n * t), o = .5 + .5 * Math.cos(n * i), s = smooth(clamp((Math.cos(n * t) + .92) / .3)), l = smooth(clamp((Math.cos(n * i) + .92) / .3)), u = smooth(clamp(.5 + 1.4 * Math.cos(Math.PI * t) * Math.cos(Math.PI * i))), f = s * (1 - l + l * u), _ = l * (1 - s + s * (1 - u)), v = f + _, y = noise(e, c, 72, 4, r ^ 28465), b = noise(e, c, 4, 72, r ^ 10903), x = f * y + _ * b, S = f * a + _ * o;
				p = .08 + .5 * v + .16 * S + .18 * x, m = .04 + .48 * v + .32 * S + .045 * x, h += .1 * (d - .5) + .1 * (1 - v) - .04 * x, g = .34 + .54 * v + .1 * S;
				break;
			}
			case `bamboo`: {
				let t = noise(e, c, 64, 4, r ^ 19313), i = noise(e, c, 4, 3, r ^ 26909), o = .5 + .5 * Math.sin(n * (48 * e + .22 * i) + a), s = noise(e, 0, 4, 1, r ^ 10453), l = 1 - Math.cos(n * (3 * c + .65 * s + .07 * Math.sin(n * 4 * e)) + a), u = 1 - smooth(clamp(l / .16)), f = 1 - smooth(clamp(l / .42));
				p = .46 + .23 * t + .16 * o + .08 * d - .34 * u, m = .3 + .14 * t + .12 * o + .16 * f - .1 * u, h += .12 * u + .1 * (t - .5) - .035 * o, g = .99 - .14 * u - .025 * (1 - t);
				break;
			}
			case `hammeredmetal`: {
				let t = e * 12, n = c * 12, i = Math.floor(t), a = Math.floor(n), o = 0;
				for (let e = -1; e <= 1; e++) for (let s = -1; s <= 1; s++) {
					let c = i + s, l = a + e, u = (c % 12 + 12) % 12, d = (l % 12 + 12) % 12, f = t - c - .35 - .3 * hash(u, d, r), p = n - l - .35 - .3 * hash(u, d, r ^ 29339), m = .85 + .25 * hash(u, d, r ^ 6461), h = clamp(1 - (f * f + p * p) / (m * m));
					o += h * h * (.7 + .3 * hash(u, d, r ^ 23063));
				}
				let s = 1 - Math.exp(-1.6 * o), l = noise(e, c, 4, 4, r ^ 20001);
				p = .72 - .32 * s + .14 * l + .045 * d, m = .85 - .7 * s + .008 * d, h += .1 * (l - .5) + .09 * s, g = .99 - .12 * s;
				break;
			}
			case `galvanized`: {
				let t = e * 10, i = c * 10, a = Math.floor(t), o = Math.floor(i), s = 0, l = 0, u = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let d = a + c, f = o + e, p = (d % 10 + 10) % 10, m = (f % 10 + 10) % 10, h = t - d - .35 - .3 * hash(p, m, r), g = i - f - .35 - .3 * hash(p, m, r ^ 15225), _ = n * hash(p, m, r ^ 22435), v = h * Math.cos(_) + g * Math.sin(_), y = g * Math.cos(_) - h * Math.sin(_), b = clamp(1 - (h * h + g * g) / 1.21) ** 8, x = hash(p, m, r ^ 18897), S = .5 + .5 * Math.cos(n * (3 * y + 1.5 * Math.abs(v)));
					s += b, l += b * x, u += b * S;
				}
				let f = 1 / Math.max(s, 1e-12), _ = l * f, v = u * f;
				p = .18 + .65 * _ + .12 * v + .035 * d, m = .3 + .18 * _ + .035 * v + .015 * d, h += .24 * (_ - .5) + .045 * (v - .5), g = .98 + .02 * _;
				break;
			}
			case `corrugatedmetal`: {
				let t = .5 + .5 * Math.cos(n * 8 * e + a), i = noise(e, c, 64, 4, r ^ 8043), o = (.5 + .5 * Math.sin(n * 48 * e + a)) ** 12;
				p = .5 + .2 * t + .16 * i - .06 * o, m = .1 + .8 * t + .004 * i - .002 * o, h += .13 * (i - .5) + .06 * o, g = .91 + .08 * t;
				break;
			}
			case `sandstone`: {
				let t = noise(e, c, 3, 5, r ^ 26941), i = c + .055 * (t - .5), o = .5 + .5 * Math.sin(8 * i * n + a), s = (.5 + .5 * Math.sin(19 * i * n + a)) ** 6, l = noise(e, c, 8, 3, r ^ 19735), u = smooth(clamp((f - .28) / .48)), d = (1 - f) ** 5;
				p = .22 + .35 * o + .2 * l + .18 * u - .2 * s, m = .32 + .16 * o - .09 * s + .24 * u - .1 * d, h += .12 * (u - .5) + .05 * s, g = .97 - .12 * s - .13 * d + .025 * u;
				break;
			}
			case `travertine`: {
				let t = e * 12, i = c * 18, o = Math.floor(t), s = Math.floor(i), l = 0;
				for (let e = -1; e <= 1; e++) for (let a = -1; a <= 1; a++) {
					let c = o + a, u = s + e, d = (c % 12 + 12) % 12, f = (u % 18 + 18) % 18, p = hash(d, f, r ^ 24211), m = (hash(d, f, r ^ 9169) - .5) * .36, h = Math.cos(m), g = Math.sin(m), _ = t - c - .2 - .6 * hash(d, f, r), v = i - u - .2 - .6 * hash(d, f, r ^ 31513), y = _ * h + v * g, b = v * h - _ * g, x = .42 + .36 * p, S = .11 + .13 * hash(d, f, r ^ 36657), w = smooth(clamp((1 - (y * y / (x * x) + b * b / (S * S) + .12 * Math.sin(9 * y + p * n) * Math.sin(13 * b))) / .65));
					l += w * (.65 + .35 * p);
				}
				let u = 1 - Math.exp(-1.8 * l), d = noise(e, c, 3, 3, r ^ 16855), _ = .5 + .5 * Math.sin(n * (6 * c + .18 * d) + a);
				p = .65 + .12 * _ + .09 * f - .48 * u, m = .62 + .05 * _ + .04 * f - .3 * u, h += .15 * u + .08 * (f - .5), g = .98 - .42 * u;
				break;
			}
			case `pumice`: {
				let t = e * 26, n = c * 26, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 26 + 26) % 26, f = (u % 26 + 26) % 26, p = t - l - .15 - .7 * hash(d, f, r), m = n - u - .15 - .7 * hash(d, f, r ^ 25375), h = .24 + .2 * hash(d, f, r ^ 14521), g = (p * p + m * m) / (h * h), _ = clamp(1 - g), v = _ * _;
					o = Math.max(o, v), s = Math.max(s, 6 * g * v);
				}
				p = .65 + .12 * noise(e, c, 5, 5, r ^ 40007) + .08 * f - .57 * o + .05 * s, m = .72 - .58 * o + .08 * s + .03 * f, h += .07 * o + .07 * (f - .5), g = .98 - .52 * o + .01 * d;
				break;
			}
			case `parquet`: {
				let t = e * 4, a = c * 4, o = Math.floor(t), s = Math.floor(a), l = (o + s) % 2 == 0, u = fract(l ? t : a), f = fract(l ? a : t), _ = Math.floor(f * 3), y = smooth(clamp((Math.min(u, 1 - u, fract(f * 3) / 3, (1 - fract(f * 3)) / 3) - .006) / .016)), b = hash(o * 3 + _, s, r), x = noise(e, c, 8, 8, r ^ 14105), S = .5 + .5 * Math.sin(n * (f * 38 + .28 * Math.sin(n * u) + .18 * x) + b * n);
				p = .06 + y * (.25 + .32 * b + .22 * S + .06 * d), m = y * (.76 + .045 * S + .025 * d), h = .78 + y * (i.roughness - .78 + .09 * S + .04 * b), g = .52 + .46 * y;
				break;
			}
			case `mosaic`: {
				let t = e * 16, n = c * 16, a = fract(t), o = fract(n), l = smooth(clamp((Math.min(a, 1 - a, o, 1 - o) - .018) / .042)), u = hash(Math.floor(t), Math.floor(n), r);
				p = .2 + l * (.08 + .56 * u + .1 * d), m = l * (.78 + .08 * u + .025 * d), h = .76 + l * (i.roughness - .76 + .11 * u + .04 * d), g = .6 + .39 * l, _ = 1 - l;
				break;
			}
			case `hexagontiles`: {
				let t = Math.sqrt(3), n = e * 5, a = c * 6 * t / 2, o = Math.floor(a / (t / 2)), s = 1 / 0, l = 0, u = 0, f = 0, v = 0;
				for (let e = -1; e <= 1; e++) {
					let r = o + e, i = (r % 2 + 2) % 2 * .5, c = Math.round(n - i);
					for (let e = -1; e <= 1; e++) {
						let o = c + e, d = n - o - i, p = a - r * t / 2, m = d * d + p * p;
						m < s && (s = m, l = d, u = p, f = (o % 5 + 5) % 5, v = (r % 6 + 6) % 6);
					}
				}
				let b = smooth(clamp((.5 - Math.max(Math.abs(l), Math.abs(l * .5 + u * t / 2), Math.abs(l * .5 - u * t / 2)) - .012) / .034)), x = hash(f, v, r);
				p = .2 + b * (.28 + .35 * x + .07 * d), m = b * (.8 + .045 * x + .02 * d), h = .74 + b * (i.roughness - .74 + .1 * x + .04 * d), g = .6 + .39 * b, _ = 1 - b;
				break;
			}
			case `knit`: {
				let t = e * 8, r = c * 8, i = Math.floor(t), o = Math.floor(r), s = 0;
				for (let e = -1; e <= 1; e += 2) {
					let n = t - i - .5, a = r - o - .84, c = e * .34, l = -.68, u = clamp((n * c + a * l) / (c * c + l * l)), d = n - u * c, f = a - u * l, m = smooth(clamp(1 - (d * d + f * f) / .0169));
					s += (1 - s) * m;
				}
				let l = .5 + .25 * Math.sin(n * (48 * e + 24 * c) + a) + .25 * Math.sin(n * (48 * e - 24 * c) - a);
				p = .12 + .64 * s + .1 * d + .07 * s * l, m = .08 + s * (.76 + .045 * l) + .025 * d, h += .065 * (d - .5) + .035 * (1 - s), g = .58 + .41 * s;
				break;
			}
			case `corduroy`: {
				let t = (.5 + .5 * Math.cos(n * e * 12)) ** .65, i = noise(e, c, 96, 96, r ^ 11121), a = noise(e, c, 12, 48, r ^ 31907);
				p = .12 + .57 * t + .16 * i + .08 * a, m = .07 + .79 * t + .035 * i + .025 * a, h += .08 * (i - .5) + .035 * (1 - t), g = .57 + .42 * t;
				break;
			}
			case `felt`: {
				let t = e * 20, i = c * 20, a = Math.floor(t), o = Math.floor(i), s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = a + c, u = o + e, d = (l % 20 + 20) % 20, f = (u % 20 + 20) % 20, p = t - l - .25 - .5 * hash(d, f, r), m = i - u - .25 - .5 * hash(d, f, r ^ 41845), h = hash(d, f, r ^ 27415) * n, g = Math.cos(h), _ = Math.sin(h), v = (p * g + m * _) / .6, y = (m * g - p * _) / .055, b = clamp(1 - v * v - y * y);
					s += (1 - s) * b * b;
				}
				p = .28 + .28 * d + .3 * s, m = .18 + .035 * d + .065 * s, h += .065 * (d - .5) + .025 * s, g = .96 + .025 * s + .01 * d;
				break;
			}
			case `roofshingles`: {
				let t = Math.floor(c * 6), n = fract(c * 6), i = e * 4 + t % 2 * .5, a = fract(i), o = smooth(clamp(Math.min(n, 1 - n) / .12)), s = smooth(clamp(Math.min(a, 1 - a) / .055)), l = (1 - s) * smooth(clamp((n - .32) / .16)) * o, u = o * s, d = hash(Math.floor(i) % 4, t, r ^ 25527), f = smooth(clamp((noise(e, c, 64, 64, r ^ 19765) - .2) / .6)), _ = 1 - o;
				p = .24 + .32 * f + .2 * u * d - .15 * _ - .14 * l, m = .2 + .38 * o - .2 * l + .13 * f + .05 * u * d, h += .12 * (f - .5) + .04 * _ + .03 * l, g = .96 - .24 * _ - .2 * l + .025 * f;
				break;
			}
			case `rooftiles`: {
				let t = fract(e * 6 + .5), i = fract(c * 5), a = .5 + .5 * Math.cos(n * e * 6), o = smooth(clamp(Math.min(i, 1 - i) / .13)), s = o * smooth(clamp(Math.min(t, 1 - t) / .12)), l = hash(Math.floor(e * 6 + .5) % 6, Math.floor(c * 5), r ^ 31297), u = noise(e, c, 24, 32, r ^ 23591), d = 1 - o;
				p = .26 + .24 * a + .23 * s * l + .14 * u - .14 * d, m = .16 + .65 * a - .1 * d + .035 * s * l + .012 * u, h += .13 * (u - .5) + .05 * (1 - a) + .045 * d, g = .76 + .22 * a - .14 * d + .015 * u;
				break;
			}
			case `stucco`: {
				let t = e * 28, n = c * 28, i = Math.floor(t), a = Math.floor(n), o = 0, s = 0;
				for (let e = -1; e <= 1; e++) for (let c = -1; c <= 1; c++) {
					let l = i + c, u = a + e, d = (l % 28 + 28) % 28, f = (u % 28 + 28) % 28, p = hash(d, f, r ^ 17337), m = t - l - .2 - .6 * hash(d, f, r), h = n - u - .2 - .6 * hash(d, f, r ^ 6083), g = .3 + .25 * p, _ = clamp(1 - (m * m + h * h * (.7 + p)) / (g * g)), v = _ * _;
					p < .28 ? s += (1 - s) * v : o += (1 - o) * v;
				}
				let l = noise(e, c, 5, 7, r ^ 21373);
				p = .52 + .15 * l + .19 * o - .24 * s + .08 * d, m = .27 + .16 * l + .43 * o - .22 * s + .06 * d, h += .055 * o + .065 * s + .05 * (d - .5), g = .96 - .25 * s - .075 * o + .02 * d;
				break;
			}
		}
		l.color = p, l.height = m * i.relief, l.roughness = clamp(h), l.occlusion = g, l.mortar = _, l.metallic = v;
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