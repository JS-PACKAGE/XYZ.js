const require_hypot = require("../../math/src/hypot.cjs");
//#region dist/packages/core/src/geometry.js
function positive(e, t) {
	if (!Number.isFinite(e) || e <= 0) throw RangeError(`${t} must be positive and finite.`);
}
function segments(e, t, n) {
	if (!Number.isInteger(e) || e < t) throw RangeError(`${n} must be an integer >= ${t}.`);
}
var Geometry = class Geometry {
	vertices;
	indices;
	uvs1;
	tangents;
	tangentTexCoord;
	tangentConvention;
	version = 0;
	vertexColors;
	get colors() {
		return this.vertexColors;
	}
	setColors(e) {
		if (e === void 0) {
			if (this.vertexColors === void 0) return;
			this.vertexColors = void 0, this.version++;
			return;
		}
		let t = this.vertices.length / 8, n = e.length / t;
		if (n !== 3 && n !== 4) throw RangeError(`Geometry colors must contain RGB or RGBA per vertex.`);
		let r = new Float32Array(t * 4);
		for (let i = 0; i < t; i++) for (let t = 0; t < 4; t++) {
			let a = t < n ? e[i * n + t] : 1;
			if (!Number.isFinite(a) || a < 0 || !Number.isFinite(Math.fround(a)) || t === 3 && a > 1) throw RangeError(`Geometry colors must be finite, nonnegative, with alpha in [0, 1].`);
			r[i * 4 + t] = a;
		}
		this.vertexColors = r, this.version++;
	}
	markUpdated() {
		this.version++;
	}
	constructor(t) {
		let { positions: n, normals: r, uvs: i, indices: a } = t;
		if (this.tangentTexCoord = t.tangentTexCoord ?? 0, this.tangentTexCoord !== 0 && this.tangentTexCoord !== 1 || this.tangentTexCoord === 1 && t.uvs1 === void 0) throw RangeError(`Tangent basis requires an available UV0 or UV1 stream.`);
		if (this.tangentConvention = t.tangentConvention ?? `uv`, this.tangentConvention !== `uv` && this.tangentConvention !== `gltf`) throw RangeError(`Tangent convention must be uv or gltf.`);
		let o = n.length / 3;
		if (!Number.isSafeInteger(o) || o < 3) throw RangeError(`Geometry requires at least three vertex positions.`);
		if (r.length !== o * 3 || i.length !== o * 2) throw RangeError(`Geometry normal and UV counts must match positions.`);
		if (!Number.isSafeInteger(a.length) || a.length < 3 || a.length % 3 != 0) throw RangeError(`Geometry indices must contain complete triangles.`);
		let s = new Float32Array(o * 8);
		for (let e = 0; e < o; e++) {
			for (let t = 0; t < 3; t++) {
				let i = n[e * 3 + t], a = r[e * 3 + t];
				if (!Number.isFinite(i) || !Number.isFinite(a)) throw RangeError(`Geometry positions and normals must be finite.`);
				if (s[e * 8 + t] = i, s[e * 8 + 3 + t] = a, !Number.isFinite(s[e * 8 + t]) || !Number.isFinite(s[e * 8 + 3 + t])) throw RangeError(`Geometry coordinates must fit in Float32.`);
			}
			for (let t = 0; t < 2; t++) {
				let n = i[e * 2 + t];
				if (!Number.isFinite(n)) throw RangeError(`Geometry UVs must be finite.`);
				if (s[e * 8 + 6 + t] = n, !Number.isFinite(s[e * 8 + 6 + t])) throw RangeError(`Geometry UVs must fit in Float32.`);
			}
		}
		let c = new Uint32Array(a.length);
		for (let e = 0; e < a.length; e++) {
			let t = a[e];
			if (!Number.isSafeInteger(t) || t < 0 || t >= o) throw RangeError(`Geometry index is outside the vertex range.`);
			c[e] = t;
		}
		if (this.vertices = s, this.indices = c, t.uvs1 !== void 0) {
			if (t.uvs1.length !== o * 2) throw RangeError(`Geometry UV1 counts must match positions.`);
			let e = new Float32Array(o * 2);
			for (let n = 0; n < e.length; n++) {
				let r = t.uvs1[n];
				if (!Number.isFinite(r) || !Number.isFinite(Math.fround(r))) throw RangeError(`Geometry UV1 must be finite and fit in Float32.`);
				e[n] = r;
			}
			this.uvs1 = e;
		}
		let l = new Float32Array(o * 4);
		if (t.tangents !== void 0) {
			if (t.tangents.length !== o * 4) throw RangeError(`Geometry tangents must contain xyz and handedness per vertex.`);
			for (let n = 0; n < o; n++) {
				let r = t.tangents[n * 4], i = t.tangents[n * 4 + 1], a = t.tangents[n * 4 + 2], o = t.tangents[n * 4 + 3];
				if (!Number.isFinite(r) || !Number.isFinite(i) || !Number.isFinite(a) || o !== 1 && o !== -1 || !Number.isFinite(Math.fround(r)) || !Number.isFinite(Math.fround(i)) || !Number.isFinite(Math.fround(a))) throw RangeError(`Geometry tangents must be finite Float32 values with handedness ±1.`);
				let s = require_hypot.hypot3(r, i, a);
				if (s <= 1e-20) throw RangeError(`Geometry tangents must be nonzero.`);
				l[n * 4] = r / s, l[n * 4 + 1] = i / s, l[n * 4 + 2] = a / s, l[n * 4 + 3] = o;
			}
		} else {
			let t = new Float64Array(o * 3), n = new Float64Array(o * 3), r = this.tangentTexCoord === 1 ? this.uvs1 : void 0;
			for (let i = 0; i < c.length; i += 3) {
				let a = c[i] * 8, o = c[i + 1] * 8, l = c[i + 2] * 8, u = s[o] - s[a], d = s[o + 1] - s[a + 1], f = s[o + 2] - s[a + 2], p = s[l] - s[a], m = s[l + 1] - s[a + 1], h = s[l + 2] - s[a + 2], g = r ? r[a / 4] : s[a + 6], _ = r ? r[a / 4 + 1] : s[a + 7], v = r ? r[o / 4] : s[o + 6], y = r ? r[o / 4 + 1] : s[o + 7], b = r ? r[l / 4] : s[l + 6], x = r ? r[l / 4 + 1] : s[l + 7], S = v - g, C = y - _, w = b - g, T = x - _, E = S * T - C * w;
				if (Math.abs(E) <= 1e-20) continue;
				let D = (u * T - p * C) / E, O = (d * T - m * C) / E, k = (f * T - h * C) / E, A = (p * S - u * w) / E, j = (m * S - d * w) / E, M = (h * S - f * w) / E, N = require_hypot.hypot3(D, O, k), P = require_hypot.hypot3(A, j, M);
				if (N <= 1e-20 || P <= 1e-20) continue;
				let F = s[l] - s[o], I = s[l + 1] - s[o + 1], L = s[l + 2] - s[o + 2], R = require_hypot.hypot3(u, d, f), z = require_hypot.hypot3(p, m, h), B = require_hypot.hypot3(F, I, L);
				for (let e = 0; e < 3; e++) {
					let r = e === 0 ? R * z : e === 1 ? B * R : z * B;
					if (r <= 1e-20) continue;
					let a = e === 0 ? u * p + d * m + f * h : e === 1 ? -(F * u + I * d + L * f) : p * F + m * I + h * L, o = Math.acos(Math.max(-1, Math.min(1, a / r))), s = c[i + e] * 3;
					t[s] += D / N * o, t[s + 1] += O / N * o, t[s + 2] += k / N * o, n[s] += A / P * o, n[s + 1] += j / P * o, n[s + 2] += M / P * o;
				}
			}
			for (let r = 0; r < o; r++) {
				let i = require_hypot.hypot3(s[r * 8 + 3], s[r * 8 + 4], s[r * 8 + 5]), a = i > 0 ? s[r * 8 + 3] / i : 0, o = i > 0 ? s[r * 8 + 4] / i : 0, c = i > 0 ? s[r * 8 + 5] / i : 1, u = t[r * 3], d = t[r * 3 + 1], f = t[r * 3 + 2], p = u * a + d * o + f * c;
				u -= a * p, d -= o * p, f -= c * p;
				let m = require_hypot.hypot3(u, d, f);
				m <= 1e-20 && (Math.abs(a) < .9 ? (u = 0, d = -c, f = o) : (u = c, d = 0, f = -a), m = require_hypot.hypot3(u, d, f)), l[r * 4] = u / m, l[r * 4 + 1] = d / m, l[r * 4 + 2] = f / m;
				let h = (o * f - c * d) * n[r * 3] + (c * u - a * f) * n[r * 3 + 1] + (a * d - o * u) * n[r * 3 + 2] < 0 ? -1 : 1;
				l[r * 4 + 3] = this.tangentConvention === `gltf` ? -h : h;
			}
		}
		this.tangents = l, t.colors !== void 0 && (this.setColors(t.colors), this.version = 0);
	}
	boundsVersion = -1;
	sphere = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	get boundingSphere() {
		if (this.boundsVersion === this.version) return this.sphere;
		let t = this.vertices, n = 1 / 0, r = 1 / 0, i = 1 / 0, a = -1 / 0, o = -1 / 0, s = -1 / 0;
		for (let e = 0; e < t.length; e += 8) n = Math.min(n, t[e]), a = Math.max(a, t[e]), r = Math.min(r, t[e + 1]), o = Math.max(o, t[e + 1]), i = Math.min(i, t[e + 2]), s = Math.max(s, t[e + 2]);
		let c = this.sphere;
		return c.x = (n + a) / 2, c.y = (r + o) / 2, c.z = (i + s) / 2, c.radius = require_hypot.hypot3(a - n, o - r, s - i) / 2, this.boundsVersion = this.version, c;
	}
	static cube(e = 1) {
		positive(e, `Cube size`);
		let t = e / 2, n = [], r = [], i = [], a = [], o = [
			[
				[
					t,
					0,
					0
				],
				[
					0,
					t,
					0
				],
				[
					0,
					0,
					-t
				]
			],
			[
				[
					-t,
					0,
					0
				],
				[
					0,
					t,
					0
				],
				[
					0,
					0,
					t
				]
			],
			[
				[
					0,
					t,
					0
				],
				[
					0,
					0,
					-t
				],
				[
					t,
					0,
					0
				]
			],
			[
				[
					0,
					-t,
					0
				],
				[
					0,
					0,
					t
				],
				[
					t,
					0,
					0
				]
			],
			[
				[
					0,
					0,
					t
				],
				[
					0,
					t,
					0
				],
				[
					t,
					0,
					0
				]
			],
			[
				[
					0,
					0,
					-t
				],
				[
					0,
					t,
					0
				],
				[
					-t,
					0,
					0
				]
			]
		];
		for (let [e, s, c] of o) {
			let o = n.length / 3;
			for (let [a, o] of [
				[0, 0],
				[1, 0],
				[1, 1],
				[0, 1]
			]) {
				let l = 2 * a - 1, u = 1 - 2 * o;
				n.push(e[0] + c[0] * l + s[0] * u, e[1] + c[1] * l + s[1] * u, e[2] + c[2] * l + s[2] * u), r.push(e[0] / t, e[1] / t, e[2] / t), i.push(a, o);
			}
			a.push(o, o + 2, o + 1, o, o + 3, o + 2);
		}
		return new Geometry({
			positions: n,
			normals: r,
			uvs: i,
			indices: a
		});
	}
	static sphere(e = .5, t = 32, n = 16) {
		positive(e, `Sphere radius`), segments(t, 3, `Sphere widthSegments`), segments(n, 2, `Sphere heightSegments`);
		let r = [], i = [], a = [], o = [];
		for (let o = 0; o <= n; o++) {
			let s = Math.PI * o / n, c = Math.sin(s), l = Math.cos(s);
			for (let s = 0; s <= t; s++) {
				let u = 2 * Math.PI * s / t, d = c * Math.cos(u), f = c * Math.sin(u);
				r.push(e * d, e * l, e * f), i.push(d, l, f), a.push(s / t, o / n);
			}
		}
		let s = t + 1;
		for (let e = 0; e < n; e++) for (let r = 0; r < t; r++) {
			let t = e * s + r, i = t + s;
			e > 0 && o.push(t, t + 1, i + 1), e < n - 1 && o.push(t, i + 1, i);
		}
		return new Geometry({
			positions: r,
			normals: i,
			uvs: a,
			indices: o
		});
	}
	static plane(e = 1, t = 1) {
		positive(e, `Plane width`), positive(t, `Plane depth`);
		let n = e / 2, r = t / 2;
		return new Geometry({
			positions: [
				-n,
				0,
				r,
				n,
				0,
				r,
				n,
				0,
				-r,
				-n,
				0,
				-r
			],
			normals: [
				0,
				1,
				0,
				0,
				1,
				0,
				0,
				1,
				0,
				0,
				1,
				0
			],
			uvs: [
				0,
				1,
				1,
				1,
				1,
				0,
				0,
				0
			],
			indices: [
				0,
				1,
				2,
				0,
				2,
				3
			]
		});
	}
	static quad(e = 1, t = 1) {
		positive(e, `Quad width`), positive(t, `Quad height`);
		let n = e / 2, r = t / 2;
		return new Geometry({
			positions: [
				-n,
				r,
				0,
				n,
				r,
				0,
				n,
				-r,
				0,
				-n,
				-r,
				0
			],
			normals: [
				0,
				0,
				1,
				0,
				0,
				1,
				0,
				0,
				1,
				0,
				0,
				1
			],
			uvs: [
				0,
				0,
				1,
				0,
				1,
				1,
				0,
				1
			],
			indices: [
				0,
				2,
				1,
				0,
				3,
				2
			]
		});
	}
};
var BoxGeometry = class {
	static unit() {
		return Geometry.cube();
	}
};
//#endregion
exports.BoxGeometry = BoxGeometry;
exports.Geometry = Geometry;

//# sourceMappingURL=geometry.cjs.map