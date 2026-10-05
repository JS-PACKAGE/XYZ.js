const require_morph = require("./morph.cjs");
//#region dist/packages/core/src/animation-pose.js
var AnimationMask = class {
	entries = /* @__PURE__ */ new Map();
	constructor(e) {
		for (let t of e) {
			let e = t.weight ?? 1;
			if (!Number.isFinite(e) || e < 0 || e > 1) throw RangeError(`Mask weight must be in [0, 1].`);
			let n = this.entries.get(t.target);
			n || this.entries.set(t.target, n = /* @__PURE__ */ new Map());
			for (let r of t.paths ?? [
				`translation`,
				`rotation`,
				`scale`,
				`weights`
			]) n.set(r, e);
		}
	}
	weight(e, t) {
		return this.entries.get(e)?.get(t) ?? 0;
	}
};
var AnimationReferencePose = class {
	entries = /* @__PURE__ */ new Map();
	constructor(t) {
		for (let n of t) {
			let t = /* @__PURE__ */ new Map();
			for (let r of [
				`translation`,
				`rotation`,
				`scale`,
				`weights`
			]) {
				let i = n[r];
				if (!i) continue;
				let a = r === `rotation` ? 4 : r === `weights` ? n.target instanceof require_morph.MorphWeights ? n.target.count : 0 : 3;
				if (!a || i.length !== a || i.some((e) => !Number.isFinite(e))) throw RangeError(`Invalid reference pose channel.`);
				let o = Float64Array.from(i);
				if (r === `scale` && o.some((e) => e === 0)) throw RangeError(`Additive reference scale cannot be zero.`);
				if (r === `rotation`) {
					let e = Math.hypot(...i);
					if (!e) throw RangeError(`Reference quaternion cannot be zero.`);
					for (let t = 0; t < 4; t++) o[t] /= e;
				}
				t.set(r, o);
			}
			this.entries.set(n.target, t);
		}
	}
	channel(e) {
		let t = this.entries.get(e.target)?.get(e.path);
		if (!t) throw RangeError(`Additive track is absent from the explicit reference pose.`);
		return t;
	}
};
function multiplyRotation(e, t, n) {
	let r = e.x, i = e.y, a = e.z, o = e.w, s = t.x, c = t.y, l = t.z, u = t.w;
	n.set(o * s + r * u + i * l - a * c, o * c - r * l + i * u + a * s, o * l + r * c - i * s + a * u, o * u - r * s - i * c - a * l).normalize();
}
function blendRotation(e, t, n, r) {
	let i = e.x * t.x + e.y * t.y + e.z * t.z + e.w * t.w, a = i < 0 ? -1 : 1;
	i = Math.min(1, Math.abs(i));
	let o = 1 - n, s = n;
	if (i < .9995) {
		let e = Math.acos(i), t = Math.sin(e);
		o = Math.sin((1 - n) * e) / t, s = Math.sin(n * e) / t;
	}
	r.set(o * e.x + s * a * t.x, o * e.y + s * a * t.y, o * e.z + s * a * t.z, o * e.w + s * a * t.w).normalize();
}
var AnimationPoseOverlay = class {
	target;
	path;
	base;
	output;
	scratch;
	captured = !1;
	applied = !1;
	constructor(t, n) {
		this.target = t, this.path = n;
		let r = t instanceof require_morph.MorphWeights ? t.count : n === `rotation` ? 4 : 3;
		this.base = new Float64Array(r), this.output = new Float64Array(r), this.scratch = new Float64Array(r);
	}
	read(t) {
		if (this.target instanceof require_morph.MorphWeights) for (let e = 0; e < t.length; e++) t[e] = this.target.get(e);
		else if (this.path === `rotation`) {
			let e = this.target.rotation;
			t[0] = e.x, t[1] = e.y, t[2] = e.z, t[3] = e.w;
		} else {
			let e = this.path === `translation` ? this.target.position : this.target.scale;
			t[0] = e.x, t[1] = e.y, t[2] = e.z;
		}
	}
	restore() {
		if (this.applied) {
			this.read(this.scratch);
			let t = !0;
			for (let e = 0; e < this.output.length; e++) this.output[e] !== this.scratch[e] && (t = !1);
			if (t) {
				if (this.target instanceof require_morph.MorphWeights) for (let e = 0; e < this.base.length; e++) this.target.set(e, this.base[e]);
				else this.path === `rotation` ? this.target.rotation.set(this.base[0], this.base[1], this.base[2], this.base[3]) : (this.path === `translation` ? this.target.position : this.target.scale).set(this.base[0], this.base[1], this.base[2]);
			}
		}
		this.applied = this.captured = !1;
	}
	capture() {
		if (this.captured) {
			if (!this.applied) return;
			this.read(this.scratch);
			let e = !0;
			for (let t = 0; t < this.output.length; t++) this.output[t] !== this.scratch[t] && (e = !1);
			if (e) return;
			this.base.set(this.scratch), this.applied = !1;
			return;
		}
		this.read(this.base), this.captured = !0;
	}
	seal() {
		this.captured && (this.read(this.output), this.applied = !0);
	}
};
//#endregion
exports.AnimationMask = AnimationMask;
exports.AnimationPoseOverlay = AnimationPoseOverlay;
exports.AnimationReferencePose = AnimationReferencePose;
exports.blendRotation = blendRotation;
exports.multiplyRotation = multiplyRotation;

//# sourceMappingURL=animation-pose.cjs.map