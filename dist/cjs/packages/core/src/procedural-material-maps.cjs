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
	let i = require_materials.proceduralMaterialPresets[t], a = hash(0, 0, r) * n, o = t === `stone` || t === `metal` || t === `marble`, s = t === `brick` || t === `stone` || t === `asphalt` || t === `gravel` || t === `cobblestone` || t === `bark` || t === `moss` || t === `mud`;
	return (e, c, l) => {
		e = fract(e), c = fract(c);
		let u = o ? noise(e, c, 4, 4, r) : 0, d = noise(e, c, 32, 32, r ^ 2747636419), f = s ? noise(e, c, 64, 64, r ^ 2135587861) : 0, p = u, m = u, h = i.roughness, g = 1, _ = 0, v = +(t === `metal`);
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