const require_hypot = require("../../math/src/hypot.cjs");
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
var t = /* @__PURE__ */ new WeakSet();
var MorphTargets = class {
	weights;
	positions;
	normals;
	tangents;
	base;
	baseTangents;
	tangentOutput;
	applied = -1;
	touched = [
		[],
		[],
		[]
	];
	sparse = !1;
	constructor(e) {
		let t = e.weights.count;
		if (!t || e.positions.length !== t || e.normals && e.normals.length !== t || e.tangents && e.tangents.length !== t) throw RangeError(`Morph weights must match a non-empty set of targets.`);
		this.weights = e.weights, this.positions = e.positions.map((e) => copyDelta(e)), this.normals = Array.from({ length: t }, (t, n) => copyDelta(e.normals?.[n])), this.tangents = Array.from({ length: t }, (t, n) => copyDelta(e.tangents?.[n]));
	}
	get targetCount() {
		return this.weights.count;
	}
	bind(e) {
		let n = e.vertices.length / 8;
		if (this.base) throw Error(`MorphTargets are already bound to a Mesh.`);
		if (t.has(e)) throw Error(`Geometry is already deformed by another Mesh.`);
		for (let e = 0; e < 3; e++) {
			let t = e === 0 ? this.positions : e === 1 ? this.normals : this.tangents;
			for (let e of t) if (e && e.length !== n * 3) throw RangeError(`Morph delta length must be vertexCount * 3.`);
		}
		if (t.add(e), this.base = e.vertices.slice(), this.baseTangents = e.tangents.slice(), this.tangentOutput = e.tangents, !hasNegativeZero(this.base, 8, 6) && !hasNegativeZero(this.baseTangents, 4, 3)) for (let e = 0; e < 3; e++) {
			let t = e === 0 ? this.positions : e === 1 ? this.normals : this.tangents;
			for (let r = 0; r < t.length; r++) {
				let i = nonzeroVertices(t[r], n);
				this.touched[e][r] = i, i && (this.sparse = !0);
			}
		}
	}
	setTangentOutput(e) {
		if (!this.baseTangents || e.length !== this.baseTangents.length) throw RangeError(`Morph tangent output must match the bound Geometry.`);
		this.tangentOutput = e;
	}
	apply(t) {
		let a = this.base, o = this.baseTangents, s = this.tangentOutput;
		if (!a || !o || this.applied === this.weights.version) return !1;
		this.applied = this.weights.version;
		let c = this.weights.values, l = a.length / 8;
		copyBase(a, o, t, s, l);
		let u = this.accumulate(t, s, c, l, this.sparse);
		u & i && (copyBase(a, o, t, s, l), u = this.accumulate(t, s, c, l, !1));
		let d = (u & n) !== 0, f = (u & r) !== 0;
		if (d) for (let n = 0; n < l; n++) {
			let r = n * 8 + 3, i = require_hypot.hypot3(t[r], t[r + 1], t[r + 2]);
			if (i > 1e-8) t[r] /= i, t[r + 1] /= i, t[r + 2] /= i;
			else for (let e = 0; e < 3; e++) t[r + e] = a[r + e];
		}
		if ((f || d) && s) for (let n = 0; n < l; n++) {
			let r = n * 4, i = require_hypot.hypot3(t[n * 8 + 3], t[n * 8 + 4], t[n * 8 + 5]), a = i > 0 ? t[n * 8 + 3] / i : 0, o = i > 0 ? t[n * 8 + 4] / i : 0, c = i > 0 ? t[n * 8 + 5] / i : 1, l = s[r] * a + s[r + 1] * o + s[r + 2] * c, u = s[r] - a * l, d = s[r + 1] - o * l, f = s[r + 2] - c * l, p = require_hypot.hypot3(u, d, f);
			if (p > 1e-8) s[r] = u / p, s[r + 1] = d / p, s[r + 2] = f / p;
			else {
				let t = Math.abs(a) < .9 ? 0 : c, n = Math.abs(a) < .9 ? -c : 0, i = Math.abs(a) < .9 ? o : -a, l = require_hypot.hypot3(t, n, i);
				s[r] = t / l, s[r + 1] = n / l, s[r + 2] = i / l;
			}
		}
		return !0;
	}
	accumulate(e, t, a, o, s) {
		let c = 0;
		for (let l = 0; l < a.length; l++) {
			let u = a[l];
			if (u !== 0) for (let a = 0; a < 3; a++) {
				let d = a === 0 ? this.positions[l] : a === 1 ? this.normals[l] : this.tangents[l];
				if (!d) continue;
				let f = a === 2 ? t : e;
				if (!f) continue;
				a === 1 ? c |= n : a === 2 && (c |= r);
				let p = a === 2 ? 4 : 8, m = a === 1 ? 3 : 0, h = s ? this.touched[a][l] : void 0, g = h ? h.length : o;
				for (let e = 0; e < g; e++) {
					let t = h ? h[e] : e, n = t * p + m, r = t * 3;
					f[n] += u * d[r], f[n + 1] += u * d[r + 1], f[n + 2] += u * d[r + 2], s && (isNegativeZero(f[n]) || isNegativeZero(f[n + 1]) || isNegativeZero(f[n + 2])) && (c |= i);
				}
			}
		}
		return c;
	}
};
var n = 1;
var r = 2;
var i = 4;
function isNegativeZero(e) {
	return e === 0 && 1 / e < 0;
}
function hasNegativeZero(e, t, n) {
	for (let r = 0; r < e.length; r += t) for (let t = 0; t < n; t++) if (isNegativeZero(e[r + t])) return !0;
	return !1;
}
function nonzeroVertices(e, t) {
	if (!e) return;
	let n = 0;
	for (let r = 0; r < t; r++) (e[r * 3] !== 0 || e[r * 3 + 1] !== 0 || e[r * 3 + 2] !== 0) && n++;
	if (n > t * .5) return;
	let r = new Uint32Array(n);
	for (let n = 0, i = 0; n < t; n++) (e[n * 3] !== 0 || e[n * 3 + 1] !== 0 || e[n * 3 + 2] !== 0) && (r[i++] = n);
	return r;
}
function copyBase(e, t, n, r, i) {
	for (let a = 0; a < i; a++) {
		let i = a * 8;
		for (let t = 0; t < 6; t++) n[i + t] = e[i + t];
		if (r) {
			let e = a * 4;
			for (let n = 0; n < 4; n++) r[e + n] = t[e + n];
		}
	}
}
function copyDelta(e) {
	if (!e) return;
	let t = Float32Array.from(e);
	for (let e = 0; e < t.length; e++) if (!Number.isFinite(t[e])) throw RangeError(`Morph deltas must be finite.`);
	return t;
}
//#endregion
exports.MorphTargets = MorphTargets;
exports.MorphWeights = MorphWeights;

//# sourceMappingURL=morph.cjs.map