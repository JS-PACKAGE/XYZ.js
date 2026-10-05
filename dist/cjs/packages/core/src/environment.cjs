const require_rendering = require("../../../src/data/rendering.cjs");
//#region dist/packages/core/src/environment.js
var t = Math.PI * 2;
var n = 65504;
var r = /* @__PURE__ */ new Float32Array(1);
var i = new Uint32Array(r.buffer);
function toHalf(e) {
	let t = e < 0 ? 32768 : 0, a = Math.abs(e);
	if (a >= n) return t | 31743;
	if (a < 6103515625e-14) return t | Math.round(a / 5.960464477539063e-8);
	r[0] = a;
	let o = i[0], s = (o >>> 23) - 127 + 15, c = (o & 8388607) + 4096, l = (s << 10) + (c >>> 13);
	return t | Math.min(l, 31743);
}
function equirectDirection(e, n, r) {
	let i = (e - .5) * t, a = n * Math.PI, o = Math.sin(a);
	return r[0] = o * Math.sin(i), r[1] = Math.cos(a), r[2] = -o * Math.cos(i), r;
}
function resample(e, t, n, r, i) {
	let a = new Float32Array(r * i * 3);
	for (let o = 0; o < i; o++) {
		let s = (o + .5) * n / i - .5, c = Math.floor(s), l = s - c, u = Math.min(Math.max(c, 0), n - 1), d = Math.min(Math.max(c + 1, 0), n - 1);
		for (let n = 0; n < r; n++) {
			let i = (n + .5) * t / r - .5, s = Math.floor(i), c = i - s, f = (s % t + t) % t, p = ((s + 1) % t + t) % t;
			for (let i = 0; i < 3; i++) {
				let s = e[(u * t + f) * 3 + i] * (1 - c) + e[(u * t + p) * 3 + i] * c, m = e[(d * t + f) * 3 + i] * (1 - c) + e[(d * t + p) * 3 + i] * c;
				a[(o * r + n) * 3 + i] = s * (1 - l) + m * l;
			}
		}
	}
	return a;
}
function encodeHalf(e, t, n) {
	let r = new Uint16Array(t * n * 4);
	for (let i = 0; i < t * n; i++) r[i * 4] = toHalf(e[i * 3]), r[i * 4 + 1] = toHalf(e[i * 3 + 1]), r[i * 4 + 2] = toHalf(e[i * 3 + 2]), r[i * 4 + 3] = 15360;
	return r;
}
function shBasis(e, t, n, r) {
	r[0] = .282095, r[1] = .488603 * t, r[2] = .488603 * n, r[3] = .488603 * e, r[4] = 1.092548 * e * t, r[5] = 1.092548 * t * n, r[6] = .315392 * (3 * n * n - 1), r[7] = 1.092548 * e * n, r[8] = .546274 * (e * e - t * t);
}
var a = [
	1,
	2 / 3,
	2 / 3,
	2 / 3,
	.25,
	.25,
	.25,
	.25,
	.25
];
var EnvironmentMap = class EnvironmentMap {
	levels;
	levelSizes;
	sh;
	width;
	height;
	gone = !1;
	constructor(t, n, r) {
		this.width = t, this.height = n;
		let i = [], a = [r], o = [r], s = 1;
		for (; s < require_rendering.environmentLimits.maxMips && n >> s >= 1;) s++;
		for (let e = 0; e < s; e++) i.push({
			width: Math.max(1, t >> e),
			height: Math.max(1, n >> e)
		});
		for (let e = 1; e < s; e++) a.push(resample(a[e - 1], i[e - 1].width, i[e - 1].height, i[e].width, i[e].height));
		let c = r, l = t, u = n;
		for (; l > require_rendering.environmentLimits.proxyWidth && l > 2 && u > 1;) c = resample(c, l, u, l >> 1, u >> 1), l >>= 1, u >>= 1;
		this.sh = EnvironmentMap.projectSH(c, l, u);
		for (let r = 1; r < s; r++) {
			let c = r / (s - 1), l = Math.min(i[r].width, require_rendering.environmentLimits.prefilterWidth), u = Math.max(1, l >> 1), d = EnvironmentMap.convolve(a, i, t, n, l, u, c);
			o.push(l === i[r].width && u === i[r].height ? d : resample(d, l, u, i[r].width, i[r].height));
		}
		this.levelSizes = i, this.levels = o.map((e, t) => encodeHalf(e, i[t].width, i[t].height));
	}
	get destroyed() {
		return this.gone;
	}
	get mipCount() {
		return this.levelSizes.length;
	}
	static fromCubemap(t, r, i = 3) {
		if (!Number.isInteger(t) || t * 2 < require_rendering.environmentLimits.minHeight || t * 4 > require_rendering.environmentLimits.maxWidth) throw RangeError(`Cubemap face size exceeds the environment limits.`);
		if (i !== 3 && i !== 4 || r.length !== 6) throw RangeError(`Cubemap requires six RGB or RGBA faces.`);
		for (let e of r) {
			if (e.length !== t * t * i) throw RangeError(`Cubemap faces must have the same square dimensions.`);
			for (let n = 0; n < t * t; n++) for (let t = 0; t < 3; t++) {
				let r = e[n * i + t];
				if (!Number.isFinite(r) || r < 0) throw RangeError(`Cubemap radiance must be finite and nonnegative.`);
			}
		}
		let a = t * 4, o = t * 2, s = new Float32Array(a * o * 3), c = [
			0,
			0,
			0
		];
		for (let e = 0; e < o; e++) for (let l = 0; l < a; l++) {
			equirectDirection((l + .5) / a, (e + .5) / o, c);
			let [u, d, f] = c, p = Math.abs(u), m = Math.abs(d), h = Math.abs(f), g, _, v;
			p >= m && p >= h ? (g = u >= 0 ? 0 : 1, _ = (u >= 0 ? -f : f) / p, v = -d / p) : m >= h ? (g = d >= 0 ? 2 : 3, _ = u / m, v = (d >= 0 ? f : -f) / m) : (g = f >= 0 ? 4 : 5, _ = (f >= 0 ? u : -u) / h, v = -d / h);
			let y = (_ + 1) * .5 * t - .5, b = (v + 1) * .5 * t - .5, x = Math.floor(y), S = Math.floor(b), C = y - x, w = b - S, T = Math.max(0, Math.min(t - 1, x)), E = Math.max(0, Math.min(t - 1, x + 1)), D = Math.max(0, Math.min(t - 1, S)), O = Math.max(0, Math.min(t - 1, S + 1)), k = r[g];
			for (let r = 0; r < 3; r++) {
				let o = Math.min(k[(D * t + T) * i + r], n) * (1 - C) + Math.min(k[(D * t + E) * i + r], n) * C, c = Math.min(k[(O * t + T) * i + r], n) * (1 - C) + Math.min(k[(O * t + E) * i + r], n) * C;
				s[(e * a + l) * 3 + r] = o * (1 - w) + c * w;
			}
		}
		return new EnvironmentMap(a, o, s);
	}
	static fromCubemapImageData(t) {
		let n = t[0].width;
		if (t.length !== 6 || !Number.isInteger(n) || n * 2 < require_rendering.environmentLimits.minHeight || n * 4 > require_rendering.environmentLimits.maxWidth) throw RangeError(`Cubemap requires six faces within the environment limits.`);
		let r = t.map((e) => {
			if (e.width !== n || e.height !== n || e.data.length !== n * n * 4) throw RangeError(`Cubemap ImageData faces must have equal square dimensions.`);
			let t = new Float32Array(n * n * 3);
			for (let r = 0; r < n * n; r++) for (let n = 0; n < 3; n++) {
				let i = e.data[r * 4 + n] / 255;
				if (!Number.isFinite(i) || i < 0 || i > 1) throw RangeError(`Cubemap ImageData must be 8-bit.`);
				t[r * 3 + n] = i <= .04045 ? i / 12.92 : ((i + .055) / 1.055) ** 2.4;
			}
			return t;
		});
		return EnvironmentMap.fromCubemap(n, r);
	}
	static fromPixels(t, r, i, a = 3) {
		if (!Number.isInteger(t) || !Number.isInteger(r) || t !== r * 2 || r < require_rendering.environmentLimits.minHeight || t > require_rendering.environmentLimits.maxWidth) throw RangeError(`Environment must be a 2:1 equirect between ${require_rendering.environmentLimits.minHeight * 2}x${require_rendering.environmentLimits.minHeight} and ${require_rendering.environmentLimits.maxWidth}x${require_rendering.environmentLimits.maxWidth / 2}.`);
		if (a !== 3 && a !== 4) throw RangeError(`Environment channels must be 3 or 4.`);
		if (i.length !== t * r * a) throw RangeError(`Environment pixel count does not match its size.`);
		let o = new Float32Array(t * r * 3);
		for (let e = 0; e < t * r; e++) for (let t = 0; t < 3; t++) {
			let r = i[e * a + t];
			if (!Number.isFinite(r) || r < 0) throw RangeError(`Environment radiance must be finite and nonnegative.`);
			o[e * 3 + t] = Math.min(r, n);
		}
		return new EnvironmentMap(t, r, o);
	}
	static fromImageData(e) {
		let t = new Float32Array(e.width * e.height * 3);
		if (e.data.length !== e.width * e.height * 4) throw RangeError(`Environment ImageData must be RGBA.`);
		for (let n = 0; n < e.width * e.height; n++) for (let r = 0; r < 3; r++) {
			let i = e.data[n * 4 + r] / 255;
			if (!Number.isFinite(i) || i < 0 || i > 1) throw RangeError(`Environment ImageData must be 8-bit.`);
			t[n * 3 + r] = i <= .04045 ? i / 12.92 : ((i + .055) / 1.055) ** 2.4;
		}
		return EnvironmentMap.fromPixels(e.width, e.height, t, 3);
	}
	static fromRGBE(t) {
		let n = t instanceof Uint8Array ? t : new Uint8Array(t), r = 0, readLine = () => {
			let e = ``;
			for (; r < n.length && n[r] !== 10;) if (e += String.fromCharCode(n[r++]), e.length > 256) throw RangeError(`Radiance header line is too long.`);
			if (r >= n.length) throw RangeError(`Radiance header is truncated.`);
			return r++, e;
		};
		if (!readLine().startsWith(`#?`)) throw RangeError(`Not a Radiance RGBE file.`);
		for (let e = 0;; e++) {
			if (e > 64) throw RangeError(`Radiance header is too long.`);
			let t = readLine();
			if (t === ``) break;
			if (t.startsWith(`FORMAT=`) && t !== `FORMAT=32-bit_rle_rgbe`) throw RangeError(`Only 32-bit RGBE Radiance files are supported.`);
		}
		let i = /^-Y (\d+) \+X (\d+)$/.exec(readLine());
		if (!i) throw RangeError(`Only -Y +X Radiance orientation is supported.`);
		let a = Number(i[1]), o = Number(i[2]);
		if (o !== a * 2 || a < require_rendering.environmentLimits.minHeight || o > require_rendering.environmentLimits.maxWidth) throw RangeError(`Radiance image is not a supported 2:1 equirect.`);
		let s = new Uint8Array(o * 4), c = new Float32Array(o * a * 3);
		for (let e = 0; e < a; e++) {
			if (r + 4 > n.length) throw RangeError(`Radiance data is truncated.`);
			if (o >= 8 && o < 32768 && n[r] === 2 && n[r + 1] === 2 && !(n[r + 2] & 128)) {
				if ((n[r + 2] << 8 | n[r + 3]) !== o) throw RangeError(`Radiance scanline width mismatch.`);
				r += 4;
				for (let e = 0; e < 4; e++) {
					let t = 0;
					for (; t < o;) {
						if (r >= n.length) throw RangeError(`Radiance data is truncated.`);
						let i = n[r++];
						if (i > 128) {
							if (i -= 128, i === 0 || t + i > o || r >= n.length) throw RangeError(`Radiance run is invalid.`);
							let a = n[r++];
							for (let n = 0; n < i; n++) s[(t++ << 2) + e] = a;
						} else {
							if (i === 0 || t + i > o || r + i > n.length) throw RangeError(`Radiance run is invalid.`);
							for (let a = 0; a < i; a++) s[(t++ << 2) + e] = n[r++];
						}
					}
				}
			} else {
				if (r + o * 4 > n.length) throw RangeError(`Radiance data is truncated.`);
				s.set(n.subarray(r, r + o * 4)), r += o * 4;
			}
			for (let t = 0; t < o; t++) {
				let n = s[t * 4 + 3], r = n === 0 ? 0 : 2 ** (n - 136);
				for (let n = 0; n < 3; n++) c[(e * o + t) * 3 + n] = s[t * 4 + n] * r;
			}
		}
		return EnvironmentMap.fromPixels(o, a, c, 3);
	}
	static gradient(e) {
		let t = e.width ?? 128;
		if (!Number.isInteger(t) || t % 2 != 0) throw RangeError(`Gradient width must be an even integer.`);
		let n = t / 2;
		for (let t of [
			e.zenith,
			e.horizon,
			e.ground
		]) if (!Array.isArray(t) || t.length !== 3 || !t.every((e) => Number.isFinite(e) && e >= 0)) throw RangeError(`Gradient colors need three nonnegative numbers.`);
		let r, i = e.sun, a = i?.radius ?? .05;
		if (i) {
			let e = i.direction, t = Math.hypot(e[0], e[1], e[2]);
			if (!Number.isFinite(t) || t === 0) throw RangeError(`Sun direction must be a nonzero vector.`);
			if (!i.color.every((e) => Number.isFinite(e) && e >= 0) || !Number.isFinite(a) || a <= 0) throw RangeError(`Sun needs nonnegative color and positive radius.`);
			r = [
				e[0] / t,
				e[1] / t,
				e[2] / t
			];
		}
		let o = new Float32Array(t * n * 3), s = [
			0,
			0,
			0
		];
		for (let c = 0; c < n; c++) for (let l = 0; l < t; l++) {
			equirectDirection((l + .5) / t, (c + .5) / n, s);
			let u = s[1], d = u >= 0, f = d ? u ** .5 : (-u) ** .5, p = e.horizon, m = d ? e.zenith : e.ground;
			for (let e = 0; e < 3; e++) {
				let n = p[e] + (m[e] - p[e]) * f;
				if (r && i) {
					let t = Math.min(1, s[0] * r[0] + s[1] * r[1] + s[2] * r[2]), o = Math.acos(t);
					n += i.color[e] * Math.max(0, Math.min(1, (a * 1.5 - o) / (a * .5)));
				}
				o[(c * t + l) * 3 + e] = n;
			}
		}
		return EnvironmentMap.fromPixels(t, n, o, 3);
	}
	destroy() {
		this.gone = !0;
	}
	static projectSH(e, n, r) {
		let i = /* @__PURE__ */ new Float64Array(27), o = /* @__PURE__ */ new Float64Array(9), s = [
			0,
			0,
			0
		];
		for (let a = 0; a < r; a++) {
			let c = t / n * (Math.PI / r) * Math.sin((a + .5) / r * Math.PI);
			for (let t = 0; t < n; t++) {
				equirectDirection((t + .5) / n, (a + .5) / r, s), shBasis(s[0], s[1], s[2], o);
				let l = (a * n + t) * 3;
				for (let t = 0; t < 9; t++) for (let n = 0; n < 3; n++) i[t * 3 + n] += e[l + n] * o[t] * c;
			}
		}
		let c = /* @__PURE__ */ new Float32Array(36);
		for (let e = 0; e < 9; e++) for (let t = 0; t < 3; t++) c[e * 4 + t] = i[e * 3 + t] * a[e];
		return c;
	}
	static convolve(n, r, i, a, o, s, c) {
		let l = require_rendering.environmentLimits.prefilterSamples, u = new Float64Array(l * 4), d = new Float64Array(l), f = c ** 4;
		for (let e = 0; e < l; e++) {
			let n = e, r = 0, i = .5;
			for (; n;) r += (n & 1) * i, n >>>= 1, i *= .5;
			let a = (e + .5) / l * t, o = Math.sqrt((1 - r) / (1 + (f - 1) * r)), s = Math.sqrt(Math.max(0, 1 - o * o)), c = 2 * o * o - 1, p = e * 4;
			u[p] = 2 * o * s * Math.cos(a), u[p + 1] = 2 * o * s * Math.sin(a), u[p + 2] = c, u[p + 3] = Math.max(0, c);
			let m = 1 - o * o + f * o * o, h = f / (4 * Math.PI * m * m);
			d[e] = 1 / (l * h);
		}
		let p = new Float32Array(o * s * 3), m = [
			0,
			0,
			0
		], h = t * Math.PI / (i * a), g = Math.sin(Math.PI / (2 * a));
		for (let e = 0; e < s; e++) for (let i = 0; i < o; i++) {
			equirectDirection((i + .5) / o, (e + .5) / s, m);
			let a = 0, c, f = 0;
			Math.abs(m[2]) < .999 ? (a = -m[1], c = m[0]) : (c = -m[2], f = m[1]);
			let _ = Math.hypot(a, c, f);
			a /= _, c /= _, f /= _;
			let v = m[1] * f - m[2] * c, y = m[2] * a - m[0] * f, b = m[0] * c - m[1] * a, x = 0, S = 0, C = 0, w = 0;
			for (let e = 0; e < l; e++) {
				let i = e * 4, o = u[i + 3];
				if (o <= 0) continue;
				let s = a * u[i] + v * u[i + 1] + m[0] * u[i + 2], l = Math.min(1, Math.max(-1, c * u[i] + y * u[i + 1] + m[1] * u[i + 2])), p = f * u[i] + b * u[i + 1] + m[2] * u[i + 2], _ = Math.atan2(s, -p) / t + .5, T = Math.acos(l) / Math.PI, E = h * Math.max(g, Math.sqrt(Math.max(0, 1 - l * l))), D = Math.max(0, Math.min(n.length - 1, .5 * Math.log2(d[e] / E))), O = Math.floor(D), k = D - O;
				for (let e = 0; e < 2; e++) {
					let t = e === 0 ? 1 - k : k;
					if (t === 0) continue;
					let i = O + e, { width: a, height: s } = r[i], c = n[i], l = _ * a - .5, u = T * s - .5, d = Math.floor(l), f = Math.floor(u), p = l - d, m = u - f, h = (d + a) % a, g = (h + 1) % a, v = Math.max(0, Math.min(s - 1, f)), y = Math.max(0, Math.min(s - 1, f + 1)), b = (v * a + h) * 3, w = (y * a + h) * 3, E = (y * a + g) * 3, D = (v * a + g) * 3, A = o * t;
					x += ((c[b] * (1 - p) + c[D] * p) * (1 - m) + (c[w] * (1 - p) + c[E] * p) * m) * A, S += ((c[b + 1] * (1 - p) + c[D + 1] * p) * (1 - m) + (c[w + 1] * (1 - p) + c[E + 1] * p) * m) * A, C += ((c[b + 2] * (1 - p) + c[D + 2] * p) * (1 - m) + (c[w + 2] * (1 - p) + c[E + 2] * p) * m) * A;
				}
				w += o;
			}
			let T = (e * o + i) * 3;
			p[T] = x / w, p[T + 1] = S / w, p[T + 2] = C / w;
		}
		return p;
	}
};
//#endregion
exports.EnvironmentMap = EnvironmentMap;
exports.equirectDirection = equirectDirection;

//# sourceMappingURL=environment.cjs.map