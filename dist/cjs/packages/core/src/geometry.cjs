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
	constructor(e) {
		let { positions: t, normals: n, uvs: r, indices: i } = e, a = t.length / 3;
		if (!Number.isSafeInteger(a) || a < 3) throw RangeError(`Geometry requires at least three vertex positions.`);
		if (n.length !== a * 3 || r.length !== a * 2) throw RangeError(`Geometry normal and UV counts must match positions.`);
		if (!Number.isSafeInteger(i.length) || i.length < 3 || i.length % 3 != 0) throw RangeError(`Geometry indices must contain complete triangles.`);
		let o = new Float32Array(a * 8);
		for (let e = 0; e < a; e++) {
			for (let r = 0; r < 3; r++) {
				let i = t[e * 3 + r], a = n[e * 3 + r];
				if (!Number.isFinite(i) || !Number.isFinite(a)) throw RangeError(`Geometry positions and normals must be finite.`);
				if (o[e * 8 + r] = i, o[e * 8 + 3 + r] = a, !Number.isFinite(o[e * 8 + r]) || !Number.isFinite(o[e * 8 + 3 + r])) throw RangeError(`Geometry coordinates must fit in Float32.`);
			}
			for (let t = 0; t < 2; t++) {
				let n = r[e * 2 + t];
				if (!Number.isFinite(n)) throw RangeError(`Geometry UVs must be finite.`);
				if (o[e * 8 + 6 + t] = n, !Number.isFinite(o[e * 8 + 6 + t])) throw RangeError(`Geometry UVs must fit in Float32.`);
			}
		}
		let s = new Uint32Array(i.length);
		for (let e = 0; e < i.length; e++) {
			let t = i[e];
			if (!Number.isSafeInteger(t) || t < 0 || t >= a) throw RangeError(`Geometry index is outside the vertex range.`);
			s[e] = t;
		}
		if (this.vertices = o, this.indices = s, e.uvs1 !== void 0) {
			if (e.uvs1.length !== a * 2) throw RangeError(`Geometry UV1 counts must match positions.`);
			let t = new Float32Array(a * 2);
			for (let n = 0; n < t.length; n++) {
				let r = e.uvs1[n];
				if (!Number.isFinite(r) || !Number.isFinite(Math.fround(r))) throw RangeError(`Geometry UV1 must be finite and fit in Float32.`);
				t[n] = r;
			}
			this.uvs1 = t;
		}
		e.colors !== void 0 && (this.setColors(e.colors), this.version = 0);
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
		let e = this.vertices, t = 1 / 0, n = 1 / 0, r = 1 / 0, i = -1 / 0, a = -1 / 0, o = -1 / 0;
		for (let s = 0; s < e.length; s += 8) t = Math.min(t, e[s]), i = Math.max(i, e[s]), n = Math.min(n, e[s + 1]), a = Math.max(a, e[s + 1]), r = Math.min(r, e[s + 2]), o = Math.max(o, e[s + 2]);
		let s = this.sphere;
		return s.x = (t + i) / 2, s.y = (n + a) / 2, s.z = (r + o) / 2, s.radius = Math.hypot(i - t, a - n, o - r) / 2, this.boundsVersion = this.version, s;
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