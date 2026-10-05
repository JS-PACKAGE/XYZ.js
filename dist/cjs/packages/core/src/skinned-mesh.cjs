const require_math3d = require("../../math/src/math3d.cjs");
const require_geometry = require("./geometry.cjs");
const require_object3d = require("./object3d.cjs");
const require_mesh = require("./mesh.cjs");
//#region dist/packages/core/src/skinned-mesh.js
function cloneGeometry(e) {
	let n = e.vertices.length / 8, r = new Float32Array(n * 3), i = new Float32Array(n * 3), a = new Float32Array(n * 2);
	for (let t = 0; t < n; t++) {
		for (let n = 0; n < 3; n++) r[t * 3 + n] = e.vertices[t * 8 + n], i[t * 3 + n] = e.vertices[t * 8 + 3 + n];
		a[t * 2] = e.vertices[t * 8 + 6], a[t * 2 + 1] = e.vertices[t * 8 + 7];
	}
	return new require_geometry.Geometry({
		positions: r,
		normals: i,
		uvs: a,
		uvs1: e.uvs1,
		tangents: e.tangents,
		tangentTexCoord: e.tangentTexCoord,
		tangentConvention: e.tangentConvention,
		indices: e.indices,
		colors: e.colors
	});
}
var SkinnedMesh = class extends require_mesh.Mesh {
	joints;
	inverseBindMatrices;
	jointIndices;
	weights;
	influencesPerVertex;
	jointPalette;
	paletteVersion = 0;
	skinGeometry;
	bindVertices;
	matrices;
	influenceBounds;
	sphere = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	inverse = new require_math3d.Matrix4();
	blend = new require_math3d.Matrix4();
	initialized = !1;
	deformationVersion = 0;
	mirrorVersion = -1;
	get cullable() {
		return !0;
	}
	get renderGeometry() {
		return this.skinGeometry;
	}
	get boundingSphere() {
		return this.updateRenderDeformation(), this.sphere;
	}
	constructor(t) {
		super({
			...t,
			geometry: cloneGeometry(t.geometry)
		});
		let n = this.geometry.vertices.length / 8, i = t.influencesPerVertex ?? 4;
		if (i !== 4 && i !== 8) throw RangeError(`Skin influences per vertex must be four or eight.`);
		if (this.influencesPerVertex = i, !t.joints.length || t.jointIndices.length !== n * i || t.weights.length !== n * i || t.inverseBindMatrices && t.inverseBindMatrices.length !== t.joints.length) throw RangeError(`Skin joint, weight and inverse bind counts do not match.`);
		for (let e of t.joints) if (!(e instanceof require_object3d.Object3D)) throw TypeError(`Skin joints require Object3D.`);
		this.joints = [...t.joints], this.inverseBindMatrices = t.joints.map((n, r) => {
			let i = new require_math3d.Matrix4(), a = t.inverseBindMatrices?.[r];
			a && i.copy(a);
			let o = i.elements;
			for (let e of o) if (!Number.isFinite(e)) throw RangeError(`Inverse bind matrices must be finite.`);
			if (o[3] !== 0 || o[7] !== 0 || o[11] !== 0 || o[15] !== 1) throw RangeError(`Inverse bind matrices must be affine.`);
			return i;
		}), this.matrices = t.joints.map(() => new require_math3d.Matrix4()), this.jointPalette = new Float32Array(t.joints.length * 16), this.influenceBounds = new Float32Array(t.joints.length * 6), this.jointIndices = new Uint32Array(n * i), this.weights = new Float32Array(n * i), this.skinGeometry = cloneGeometry(t.geometry), this.bindVertices = this.skinGeometry.vertices, this.morph?.setTangentOutput(this.skinGeometry.tangents);
		for (let e = 0; e < n; e++) {
			let n = 0;
			for (let r = 0; r < i; r++) {
				let a = e * i + r, o = t.jointIndices[a], s = t.weights[a];
				if (!Number.isSafeInteger(o) || o < 0 || o >= this.joints.length || !Number.isFinite(s) || s < 0) throw RangeError(`Skin joint indices or weights are invalid.`);
				this.jointIndices[a] = o, n += s;
			}
			if (!Number.isFinite(n) || n <= 0) throw RangeError(`Skin weights must have a positive total.`);
			for (let r = 0; r < i; r++) this.weights[e * i + r] = t.weights[e * i + r] / n;
		}
		this.refreshInfluenceBounds();
	}
	updateDeformation() {
		this.updateSkin();
	}
	updateRenderDeformation() {
		this.inverse.copy(this.updateWorldMatrix()).invert();
		let e = !this.initialized, t = this.morph?.apply(this.bindVertices) ?? !1;
		t && (this.skinGeometry.markUpdated(), this.refreshInfluenceBounds());
		for (let t = 0; t < this.joints.length; t++) {
			let n = this.matrices[t].copy(this.inverse).multiply(this.joints[t].updateWorldMatrix()).multiply(this.inverseBindMatrices[t]);
			for (let r = 0; r < 16; r++) {
				let i = t * 16 + r;
				n.elements[r] !== this.jointPalette[i] && (e = !0), this.jointPalette[i] = n.elements[r];
			}
		}
		(e || t) && (e && this.paletteVersion++, this.initialized = !0, this.deformationVersion++, this.refreshAnimatedBounds());
	}
	updateSkin() {
		if (this.updateRenderDeformation(), this.mirrorVersion === this.deformationVersion) return;
		let e = this.geometry.vertices, t = this.bindVertices, n = this.geometry.tangents, r = this.skinGeometry.tangents;
		for (let i = 0; i < e.length / 8; i++) {
			let a = this.blend.elements;
			a.fill(0);
			for (let e = 0; e < this.influencesPerVertex; e++) {
				let t = i * this.influencesPerVertex + e, n = this.weights[t];
				if (n === 0) continue;
				let r = this.matrices[this.jointIndices[t]].elements;
				for (let e = 0; e < 16; e++) a[e] += n * r[e];
			}
			let o = i * 8, s = t[o], c = t[o + 1], l = t[o + 2];
			e[o] = a[0] * s + a[4] * c + a[8] * l + a[12], e[o + 1] = a[1] * s + a[5] * c + a[9] * l + a[13], e[o + 2] = a[2] * s + a[6] * c + a[10] * l + a[14];
			let u = a[5] * a[10] - a[9] * a[6], d = a[9] * a[2] - a[1] * a[10], f = a[1] * a[6] - a[5] * a[2], p = a[8] * a[6] - a[4] * a[10], m = a[0] * a[10] - a[8] * a[2], h = a[4] * a[2] - a[0] * a[6], g = a[4] * a[9] - a[8] * a[5], _ = a[8] * a[1] - a[0] * a[9], v = a[0] * a[5] - a[4] * a[1], y = a[0] * u + a[4] * d + a[8] * f < 0 ? -1 : 1, b = t[o + 3], x = t[o + 4], S = t[o + 5], C = y * (u * b + d * x + f * S), w = y * (p * b + m * x + h * S), T = y * (g * b + _ * x + v * S), E = Math.hypot(C, w, T);
			e[o + 3] = E ? C / E : 0, e[o + 4] = E ? w / E : 0, e[o + 5] = E ? T / E : 0;
			let D = i * 4, O = r[D], k = r[D + 1], A = r[D + 2], j = a[0] * O + a[4] * k + a[8] * A, M = a[1] * O + a[5] * k + a[9] * A, N = a[2] * O + a[6] * k + a[10] * A, P = j * e[o + 3] + M * e[o + 4] + N * e[o + 5];
			j -= P * e[o + 3], M -= P * e[o + 4], N -= P * e[o + 5];
			let F = Math.hypot(j, M, N);
			n[D] = F ? j / F : 0, n[D + 1] = F ? M / F : 0, n[D + 2] = F ? N / F : 0, n[D + 3] = r[D + 3] * y;
		}
		this.mirrorVersion = this.deformationVersion, this.geometry.markUpdated();
	}
	refreshInfluenceBounds() {
		let e = this.influenceBounds;
		for (let t = 0; t < this.joints.length; t++) {
			let n = t * 6;
			e.fill(1 / 0, n, n + 3), e.fill(-1 / 0, n + 3, n + 6);
		}
		for (let t = 0; t < this.bindVertices.length / 8; t++) for (let n = 0; n < this.influencesPerVertex; n++) {
			let r = t * this.influencesPerVertex + n;
			if (this.weights[r] === 0) continue;
			let i = this.jointIndices[r] * 6;
			for (let n = 0; n < 3; n++) {
				let r = this.bindVertices[t * 8 + n];
				e[i + n] = Math.min(e[i + n], r), e[i + 3 + n] = Math.max(e[i + 3 + n], r);
			}
		}
	}
	refreshAnimatedBounds() {
		let e = 1 / 0, t = 1 / 0, n = 1 / 0, r = -1 / 0, i = -1 / 0, a = -1 / 0;
		for (let o = 0; o < this.joints.length; o++) {
			let s = o * 6, c = this.influenceBounds;
			if (c[s] === 1 / 0) continue;
			let l = this.matrices[o].elements;
			for (let o = 0; o < 8; o++) {
				let u = c[s + (o & 1 ? 3 : 0)], d = c[s + (o & 2 ? 4 : 1)], f = c[s + (o & 4 ? 5 : 2)], p = l[0] * u + l[4] * d + l[8] * f + l[12], m = l[1] * u + l[5] * d + l[9] * f + l[13], h = l[2] * u + l[6] * d + l[10] * f + l[14];
				e = Math.min(e, p), t = Math.min(t, m), n = Math.min(n, h), r = Math.max(r, p), i = Math.max(i, m), a = Math.max(a, h);
			}
		}
		this.sphere.x = (e + r) * .5, this.sphere.y = (t + i) * .5, this.sphere.z = (n + a) * .5;
		let o = Math.hypot(r - e, i - t, a - n) * .5;
		this.sphere.radius = o + Math.max(1, o, Math.abs(this.sphere.x), Math.abs(this.sphere.y), Math.abs(this.sphere.z)) * 1e-6;
	}
};
//#endregion
exports.SkinnedMesh = SkinnedMesh;

//# sourceMappingURL=skinned-mesh.cjs.map