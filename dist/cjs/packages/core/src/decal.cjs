const require_hypot = require("../../math/src/hypot.cjs");
const require_math3d = require("../../math/src/math3d.cjs");
const require_geometry = require("./geometry.cjs");
const require_mesh = require("./mesh.cjs");
require("../../../src/data/rendering.cjs");
const require_instanced_mesh = require("./instanced-mesh.cjs");
const require_skinned_mesh = require("./skinned-mesh.cjs");
//#region dist/packages/core/src/decal.js
var Decal = class extends require_mesh.Mesh {
	constructor(e) {
		let t = project(e);
		super({
			geometry: t,
			material: e.material,
			visible: e.visible,
			castShadow: !1,
			receiveShadow: e.receiveShadow
		}), e.target.add(this);
	}
};
function project(d) {
	let { target: f, material: p, position: m, size: h } = d;
	if (!(f instanceof require_mesh.Mesh) || f.destroyed) throw TypeError(`Decal requires a live receiver Mesh.`);
	if (f instanceof require_instanced_mesh.InstancedMesh || f instanceof require_skinned_mesh.SkinnedMesh || f.morph) throw TypeError(`Decal requires a non-instanced, non-deforming receiver.`);
	if (!(p instanceof require_mesh.TextureMaterial)) throw TypeError(`Decal requires TextureMaterial.`);
	if (m.length !== 3 || m.some((e) => !Number.isFinite(e))) throw RangeError(`Decal position must contain three finite coordinates.`);
	if (h.length !== 3 || h.some((e) => !Number.isFinite(e) || e <= 0)) throw RangeError(`Decal size must contain three positive finite dimensions.`);
	let g = d.normalOffset ?? .001;
	if (!Number.isFinite(g) || g < 0) throw RangeError(`Decal normalOffset must be finite and nonnegative.`);
	let _ = new require_math3d.Quaternion();
	if (d.rotation instanceof require_math3d.Quaternion) _.copy(d.rotation);
	else if (d.rotation) {
		if (d.rotation.length !== 3 || d.rotation.some((e) => !Number.isFinite(e))) throw RangeError(`Decal Euler rotation must contain three finite angles.`);
		_.setFromEuler(...d.rotation);
	}
	let v = require_hypot.hypot4(_.x, _.y, _.z, _.w);
	if (!Number.isFinite(v) || v === 0) throw RangeError(`Decal rotation must be a finite, nonzero quaternion.`);
	_.normalize();
	let y = new require_math3d.Matrix4().compose(new require_math3d.Vector3(...m), _, new require_math3d.Vector3(1, 1, 1)), b = f.updateWorldMatrix();
	if (b.elements.some((e) => !Number.isFinite(e))) throw RangeError(`Decal receiver transform must be finite.`);
	let x = new require_math3d.Matrix4().copy(b).invert(), S = new require_math3d.Matrix4().copy(y).invert().multiply(b).elements, C = x.elements, w = [], T = [], E = [], D = [], O = /* @__PURE__ */ new Float64Array(54), k = /* @__PURE__ */ new Float64Array(54), A = new require_math3d.Vector3(), j = new require_math3d.Vector3(), M = f.geometry.vertices, N = f.geometry.indices, P = new require_math3d.Matrix4().copy(x).multiply(y).elements, F = 1 / 0, I = 1 / 0, L = 1 / 0, R = -1 / 0, z = -1 / 0, B = -1 / 0;
	for (let e = 0; e < 8; e++) {
		let t = (e & 1 ? 1 : -1) * h[0] / 2, n = (e & 2 ? 1 : -1) * h[1] / 2, r = (e & 4 ? 1 : -1) * h[2] / 2, i = P[0] * t + P[4] * n + P[8] * r + P[12], a = P[1] * t + P[5] * n + P[9] * r + P[13], o = P[2] * t + P[6] * n + P[10] * r + P[14];
		F = Math.min(F, i), R = Math.max(R, i), I = Math.min(I, a), z = Math.max(z, a), L = Math.min(L, o), B = Math.max(B, o);
	}
	let V = Number.isFinite(F + R + I + z + L + B), H = 1e-6 * (1 + Math.max(Math.abs(F), Math.abs(R), Math.abs(I), Math.abs(z), Math.abs(L), Math.abs(B)));
	F -= H, I -= H, L -= H, R += H, z += H, B += H;
	for (let e = 0; e < N.length; e += 3) {
		if (V) {
			let t = N[e] * 8, n = N[e + 1] * 8, r = N[e + 2] * 8;
			if (Math.max(M[t], M[n], M[r]) < F || Math.min(M[t], M[n], M[r]) > R || Math.max(M[t + 1], M[n + 1], M[r + 1]) < I || Math.min(M[t + 1], M[n + 1], M[r + 1]) > z || Math.max(M[t + 2], M[n + 2], M[r + 2]) < L || Math.min(M[t + 2], M[n + 2], M[r + 2]) > B) continue;
		}
		for (let t = 0; t < 3; t++) {
			let n = N[e + t] * 8, r = t * 6, i = M[n], a = M[n + 1], o = M[n + 2];
			O[r] = S[0] * i + S[4] * a + S[8] * o + S[12], O[r + 1] = S[1] * i + S[5] * a + S[9] * o + S[13], O[r + 2] = S[2] * i + S[6] * a + S[10] * o + S[14];
			for (let e = 0; e < 3; e++) O[r + 3 + e] = M[n + 3 + e];
		}
		let t = O[6] - O[0], n = O[7] - O[1], r = O[12] - O[0], i = O[13] - O[1];
		if (d.cullBackfaces !== !1 && t * i - n * r <= 0) continue;
		let a = 3;
		for (let e = 0; e < 3 && a >= 3; e++) for (let t = -1; t <= 1; t += 2) {
			a = clip(O, k, a, e, t, h[e] / 2);
			let n = O;
			if (O = k, k = n, a < 3) break;
		}
		if (a < 3) continue;
		let o = w.length / 3;
		for (let e = 0; e < a; e++) {
			let t = e * 6;
			A.set(O[t], O[t + 1], O[t + 2]), y.transformPoint(A, A), x.transformPoint(A, A);
			let n = O[t + 3], r = O[t + 4], i = O[t + 5];
			j.set(C[0] * n + C[1] * r + C[2] * i, C[4] * n + C[5] * r + C[6] * i, C[8] * n + C[9] * r + C[10] * i).normalize(), w.push(A.x + g * (C[0] * j.x + C[4] * j.y + C[8] * j.z), A.y + g * (C[1] * j.x + C[5] * j.y + C[9] * j.z), A.z + g * (C[2] * j.x + C[6] * j.y + C[10] * j.z));
			let a = require_hypot.hypot3(n, r, i);
			T.push(a ? n / a : 0, a ? r / a : 0, a ? i / a : 0), E.push(O[t] / h[0] + .5, .5 - O[t + 1] / h[1]);
		}
		for (let e = 1; e < a - 1; e++) {
			let t = 6 * e, n = 6 * (e + 1), r = O[t] - O[0], i = O[t + 1] - O[1], a = O[t + 2] - O[2], s = O[n] - O[0], c = O[n + 1] - O[1], u = O[n + 2] - O[2];
			require_hypot.hypot3(i * u - a * c, a * s - r * u, r * c - i * s) > 0 && D.push(o, o + e, o + e + 1);
		}
	}
	if (!D.length) throw RangeError(`Decal projector does not intersect a receiver surface.`);
	return new require_geometry.Geometry({
		positions: w,
		normals: T,
		uvs: E,
		indices: D
	});
}
function clip(e, t, n, r, i, a) {
	let o = 0, s = (n - 1) * 6, c = i * e[s + r] - a;
	for (let l = 0; l < n; l++) {
		let n = l * 6, u = i * e[n + r] - a;
		u <= 0 != c <= 0 && (o = emit(e, t, o, s, n, c / (c - u))), u <= 0 && (o = emit(e, t, o, n, n, 0)), s = n, c = u;
	}
	return o > 1 && t[0] === t[(o - 1) * 6] && t[1] === t[(o - 1) * 6 + 1] && t[2] === t[(o - 1) * 6 + 2] && o--, o;
}
function emit(e, t, n, r, i, a) {
	let o = n * 6, s = e[r] + (e[i] - e[r]) * a, c = e[r + 1] + (e[i + 1] - e[r + 1]) * a, l = e[r + 2] + (e[i + 2] - e[r + 2]) * a;
	if (n && t[o - 6] === s && t[o - 5] === c && t[o - 4] === l) return n;
	t[o] = s, t[o + 1] = c, t[o + 2] = l;
	for (let n = 3; n < 6; n++) t[o + n] = e[r + n] + (e[i + n] - e[r + n]) * a;
	return n + 1;
}
//#endregion
exports.Decal = Decal;

//# sourceMappingURL=decal.cjs.map