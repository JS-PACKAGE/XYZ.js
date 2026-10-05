const require_math3d = require("../../math/src/math3d.cjs");
const require_animation_pose = require("./animation-pose.cjs");
const require_animation = require("./animation.cjs");
//#region dist/packages/core/src/animation-retarget.js
function bindPose(t) {
	if (t.translation.length !== 3 || t.rotation.length !== 4 || t.scale.length !== 3 || !t.translation.every(Number.isFinite) || !t.rotation.every(Number.isFinite) || !t.scale.every(Number.isFinite)) throw RangeError(`Retarget bind pose requires finite local TRS values.`);
	let n = t.scale;
	if (n[0] <= 0 || n[0] !== n[1] || n[0] !== n[2]) throw RangeError(`Retarget bind scales must be positive and uniform; shear/reflection are unsupported.`);
	let r = t.rotation, i = Math.hypot(r[0], r[1], r[2], r[3]);
	if (!Number.isFinite(i) || i === 0) throw RangeError(`Retarget bind quaternion must have a finite nonzero length.`);
	return {
		translation: Float64Array.from(t.translation),
		rotation: new require_math3d.Quaternion(r[0], r[1], r[2], r[3]).normalize(),
		scale: n[0]
	};
}
function transformRotation(e, t, n, r, i) {
	let a = n[r], o = n[r + 1], s = n[r + 2], c = n[r + 3], l = e.w * a + e.x * c + e.y * s - e.z * o, u = e.w * o - e.x * s + e.y * c + e.z * a, d = e.w * s + e.x * o - e.y * a + e.z * c, f = e.w * c - e.x * a - e.y * o - e.z * s;
	i[0] = f * t.x + l * t.w + u * t.z - d * t.y, i[1] = f * t.y - l * t.z + u * t.w + d * t.x, i[2] = f * t.z + l * t.y - u * t.x + d * t.w, i[3] = f * t.w - l * t.x - u * t.y - d * t.z;
}
function validateScaleTrack(e) {
	for (let t = 0; t < e.values.length; t += 3) {
		if (e.values[t] !== e.values[t + 1] || e.values[t] !== e.values[t + 2]) throw RangeError(`Retarget supports uniform animated scale only.`);
		if ((e.interpolation !== `CUBICSPLINE` || t / 3 % 3 == 1) && e.values[t] <= 0) throw RangeError(`Retarget animated scale must stay positive.`);
	}
	if (e.interpolation === `CUBICSPLINE`) for (let t = 0; t + 1 < e.times.length; t++) {
		let n = e.times[t + 1] - e.times[t], r = t * 9, i = e.values[r + 3], a = e.values[r + 12], o = e.values[r + 6] * n, s = e.values[r + 9] * n, c = 2 * i - 2 * a + o + s, l = -3 * i + 3 * a - 2 * o - s, u = o, d = 4 * l * l - 12 * c * u;
		if (d < 0) continue;
		let f = Math.sqrt(d);
		for (let e = -1; e <= 1; e += 2) {
			let t = c === 0 ? l === 0 ? -1 : -u / (2 * l) : (-2 * l + e * f) / (6 * c);
			if (t > 0 && t < 1 && ((c * t + l) * t + u) * t + i <= 0) throw RangeError(`Retarget cubic scale crosses a singular or reflected transform.`);
		}
	}
}
var AnimationRetargeter = class {
	mappings = /* @__PURE__ */ new Map();
	sourceRoot;
	targetRoot;
	constructor(t, n) {
		this.sourceRoot = n.sourceRoot, this.targetRoot = n.targetRoot;
		let i = n.rootTranslationScale ?? 1;
		if (!Number.isFinite(i) || i < 0) throw RangeError(`Root translation scale must be nonnegative and finite.`);
		let a = /* @__PURE__ */ new Set();
		for (let r of t) {
			if (r.source.destroyed || r.target.destroyed || this.mappings.has(r.source) || a.has(r.target)) throw RangeError(`Retarget nodes must be live and mapped one-to-one.`);
			let t = bindPose(r.sourceBind), o = bindPose(r.targetBind), s = t.translation, c = o.translation, l = Math.hypot(s[0], s[1], s[2]), u = Math.hypot(c[0], c[1], c[2]), d = r.translationScale;
			if (d === void 0) {
				if (r.source === n.sourceRoot) d = i;
				else if (l > 0) d = u / l;
				else if (u === 0) d = 1;
				else throw RangeError(`Zero source bone offset requires an explicit translation scale.`);
			}
			if (!Number.isFinite(d) || d < 0) throw RangeError(`Translation scale must be nonnegative and finite.`);
			a.add(r.target), this.mappings.set(r.source, {
				source: r.source,
				target: r.target,
				sourceParent: r.source.parent,
				targetParent: r.target.parent,
				sourceBind: t,
				targetBind: o,
				translationScale: d,
				sourceWorld: new require_math3d.Quaternion(),
				targetWorld: new require_math3d.Quaternion(),
				left: new require_math3d.Quaternion(),
				right: new require_math3d.Quaternion(),
				vectorMatrix: /* @__PURE__ */ new Float64Array(9)
			});
		}
		let o = this.mappings.get(n.sourceRoot);
		if (!o || o.target !== n.targetRoot) throw RangeError(`Explicit source and target roots must be mapped together.`);
		this.validateHierarchy();
		let s = /* @__PURE__ */ new Set(), prepare = (e) => {
			if (s.has(e)) return;
			let t = e.source === this.sourceRoot ? void 0 : this.mappings.get(e.sourceParent);
			t ? (prepare(t), require_animation_pose.multiplyRotation(t.sourceWorld, e.sourceBind.rotation, e.sourceWorld), require_animation_pose.multiplyRotation(t.targetWorld, e.targetBind.rotation, e.targetWorld), e.left.set(-t.targetWorld.x, -t.targetWorld.y, -t.targetWorld.z, t.targetWorld.w), require_animation_pose.multiplyRotation(e.left, t.sourceWorld, e.left)) : (e.sourceWorld.copy(e.sourceBind.rotation), e.targetWorld.copy(e.targetBind.rotation)), e.right.set(-e.sourceWorld.x, -e.sourceWorld.y, -e.sourceWorld.z, e.sourceWorld.w), require_animation_pose.multiplyRotation(e.right, e.targetWorld, e.right);
			let n = e.left, i = e.vectorMatrix;
			i[0] = 1 - 2 * (n.y * n.y + n.z * n.z), i[1] = 2 * (n.x * n.y - n.z * n.w), i[2] = 2 * (n.x * n.z + n.y * n.w), i[3] = 2 * (n.x * n.y + n.z * n.w), i[4] = 1 - 2 * (n.x * n.x + n.z * n.z), i[5] = 2 * (n.y * n.z - n.x * n.w), i[6] = 2 * (n.x * n.z - n.y * n.w), i[7] = 2 * (n.y * n.z + n.x * n.w), i[8] = 1 - 2 * (n.x * n.x + n.y * n.y), s.add(e);
		};
		for (let e of this.mappings.values()) prepare(e);
	}
	validateHierarchy() {
		for (let e of this.mappings.values()) {
			if (e.source.destroyed || e.target.destroyed || e.source.parent !== e.sourceParent || e.target.parent !== e.targetParent) throw RangeError(`Retarget hierarchy changed or a borrowed node was destroyed.`);
			if (e.source === this.sourceRoot) {
				if (e.target !== this.targetRoot || this.mappings.has(e.sourceParent)) throw RangeError(`Retarget root must be the top of the mapped hierarchy.`);
			} else {
				let t = this.mappings.get(e.sourceParent);
				if (!t || t.target !== e.targetParent) throw RangeError(`Retarget requires corresponding direct mapped parents.`);
			}
		}
	}
	retarget(e, r = e.name) {
		this.validateHierarchy();
		let i = /* @__PURE__ */ new Map();
		for (let t of e.tracks) {
			let e = this.mappings.get(t.target);
			if (!e || t.path === `weights`) throw RangeError(`Every retarget track must address an explicitly mapped TRS node.`);
			let n = i.get(e.target);
			if (n || i.set(e.target, n = /* @__PURE__ */ new Set()), n.has(t.path)) throw RangeError(`Duplicate retarget animation channel.`);
			n.add(t.path), t.path === `scale` && validateScaleTrack(t);
		}
		let a = [], o = /* @__PURE__ */ new Float64Array(4);
		for (let t of e.tracks) {
			let e = this.mappings.get(t.target), r = new Float32Array(t.values.length);
			for (let n = 0; n < r.length; n += t.size) {
				let i = t.interpolation === `CUBICSPLINE` && n / t.size % 3 != 1;
				if (t.path === `rotation`) transformRotation(e.left, e.right, t.values, n, o), r.set(o, n);
				else if (t.path === `scale`) {
					let i = e.targetBind.scale / e.sourceBind.scale;
					for (let e = 0; e < 3; e++) r[n + e] = t.values[n + e] * i;
				} else {
					let a = e.sourceBind.translation, o = e.targetBind.translation, s = e.vectorMatrix, c = t.values[n] - (i ? 0 : a[0]), l = t.values[n + 1] - (i ? 0 : a[1]), u = t.values[n + 2] - (i ? 0 : a[2]), d = e.translationScale;
					r[n] = (s[0] * c + s[1] * l + s[2] * u) * d + (i ? 0 : o[0]), r[n + 1] = (s[3] * c + s[4] * l + s[5] * u) * d + (i ? 0 : o[1]), r[n + 2] = (s[6] * c + s[7] * l + s[8] * u) * d + (i ? 0 : o[2]);
				}
			}
			let i = new require_animation.KeyframeTrack(e.target, t.path, t.times, r, t.interpolation);
			i.path === `scale` && validateScaleTrack(i), a.push(i);
		}
		return new require_animation.AnimationClip(r, a);
	}
};
//#endregion
exports.AnimationRetargeter = AnimationRetargeter;

//# sourceMappingURL=animation-retarget.cjs.map