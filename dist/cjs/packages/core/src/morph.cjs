//#region dist/packages/core/src/morph.js
var MorphWeights = class {
	data;
	version = 0;
	constructor(e) {
		this.data = new Float32Array(e.length);
		for (let t = 0; t < e.length; t++) {
			if (!Number.isFinite(e[t])) throw RangeError(`Morph weights must be finite.`);
			this.data[t] = e[t];
		}
	}
	get count() {
		return this.data.length;
	}
	get(e) {
		return this.check(e), this.data[e];
	}
	set(e, t) {
		if (this.check(e), !Number.isFinite(t) || !Number.isFinite(Math.fround(t))) throw RangeError(`Morph weight must be finite and fit in Float32.`);
		let n = Math.fround(t);
		this.data[e] !== n && (this.data[e] = n, this.version++);
	}
	get values() {
		return this.data;
	}
	check(e) {
		if (!Number.isInteger(e) || e < 0 || e >= this.data.length) throw RangeError(`Morph weight index is out of range.`);
	}
};
var e = /* @__PURE__ */ new WeakSet();
var MorphTargets = class {
	weights;
	positions;
	normals;
	tangents;
	base;
	baseTangents;
	tangentOutput;
	applied = -1;
	constructor(e) {
		let t = e.weights.count;
		if (!t || e.positions.length !== t || e.normals && e.normals.length !== t || e.tangents && e.tangents.length !== t) throw RangeError(`Morph weights must match a non-empty set of targets.`);
		this.weights = e.weights, this.positions = e.positions.map((e) => copyDelta(e)), this.normals = Array.from({ length: t }, (t, n) => copyDelta(e.normals?.[n])), this.tangents = Array.from({ length: t }, (t, n) => copyDelta(e.tangents?.[n]));
	}
	get targetCount() {
		return this.weights.count;
	}
	bind(t) {
		let n = t.vertices.length / 8;
		if (this.base) throw Error(`MorphTargets are already bound to a Mesh.`);
		if (e.has(t)) throw Error(`Geometry is already deformed by another Mesh.`);
		for (let e = 0; e < 3; e++) {
			let t = e === 0 ? this.positions : e === 1 ? this.normals : this.tangents;
			for (let e of t) if (e && e.length !== n * 3) throw RangeError(`Morph delta length must be vertexCount * 3.`);
		}
		e.add(t), this.base = t.vertices.slice(), this.baseTangents = t.tangents.slice(), this.tangentOutput = t.tangents;
	}
	setTangentOutput(e) {
		if (!this.baseTangents || e.length !== this.baseTangents.length) throw RangeError(`Morph tangent output must match the bound Geometry.`);
		this.tangentOutput = e;
	}
	apply(e) {
		let t = this.base, n = this.baseTangents, r = this.tangentOutput;
		if (!t || !n || this.applied === this.weights.version) return !1;
		this.applied = this.weights.version;
		let i = this.weights.values, a = t.length / 8;
		for (let i = 0; i < a; i++) {
			let a = i * 8;
			for (let n = 0; n < 6; n++) e[a + n] = t[a + n];
			if (r) {
				let e = i * 4;
				for (let t = 0; t < 4; t++) r[e + t] = n[e + t];
			}
		}
		let o = !1, s = !1;
		for (let t = 0; t < i.length; t++) {
			let n = i[t];
			if (n === 0) continue;
			let c = this.positions[t], l = this.normals[t], u = this.tangents[t];
			if (c) for (let t = 0; t < a; t++) {
				let r = t * 8, i = t * 3;
				e[r] += n * c[i], e[r + 1] += n * c[i + 1], e[r + 2] += n * c[i + 2];
			}
			if (l) {
				o = !0;
				for (let t = 0; t < a; t++) {
					let r = t * 8 + 3, i = t * 3;
					e[r] += n * l[i], e[r + 1] += n * l[i + 1], e[r + 2] += n * l[i + 2];
				}
			}
			if (u && r) {
				s = !0;
				for (let e = 0; e < a; e++) {
					let t = e * 4, i = e * 3;
					r[t] += n * u[i], r[t + 1] += n * u[i + 1], r[t + 2] += n * u[i + 2];
				}
			}
		}
		if (o) for (let n = 0; n < a; n++) {
			let r = n * 8 + 3, i = Math.hypot(e[r], e[r + 1], e[r + 2]);
			if (i > 1e-8) e[r] /= i, e[r + 1] /= i, e[r + 2] /= i;
			else for (let n = 0; n < 3; n++) e[r + n] = t[r + n];
		}
		if ((s || o) && r) for (let t = 0; t < a; t++) {
			let n = t * 4, i = Math.hypot(e[t * 8 + 3], e[t * 8 + 4], e[t * 8 + 5]), a = i > 0 ? e[t * 8 + 3] / i : 0, o = i > 0 ? e[t * 8 + 4] / i : 0, s = i > 0 ? e[t * 8 + 5] / i : 1, c = r[n] * a + r[n + 1] * o + r[n + 2] * s, l = r[n] - a * c, u = r[n + 1] - o * c, d = r[n + 2] - s * c, f = Math.hypot(l, u, d);
			if (f > 1e-8) r[n] = l / f, r[n + 1] = u / f, r[n + 2] = d / f;
			else {
				let e = Math.abs(a) < .9 ? 0 : s, t = Math.abs(a) < .9 ? -s : 0, i = Math.abs(a) < .9 ? o : -a, c = Math.hypot(e, t, i);
				r[n] = e / c, r[n + 1] = t / c, r[n + 2] = i / c;
			}
		}
		return !0;
	}
};
function copyDelta(e) {
	if (!e) return;
	let t = Float32Array.from(e);
	for (let e of t) if (!Number.isFinite(e)) throw RangeError(`Morph deltas must be finite.`);
	return t;
}
//#endregion
exports.MorphTargets = MorphTargets;
exports.MorphWeights = MorphWeights;

//# sourceMappingURL=morph.cjs.map