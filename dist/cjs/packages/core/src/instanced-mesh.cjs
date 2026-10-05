const require_math3d = require("../../math/src/math3d.cjs");
const require_render_bounds = require("./render-bounds.cjs");
const require_mesh = require("./mesh.cjs");
//#region dist/packages/core/src/instanced-mesh.js
var InstancedMesh = class extends require_mesh.Mesh {
	count;
	matrices;
	version = 0;
	instanceColors;
	colorVersion = 0;
	get colors() {
		return this.instanceColors;
	}
	boundsVersion = -1;
	geometryBoundsVersion = -1;
	aggregate = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	instanceSphere = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	instanceDeformationSphere = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	get boundingSphere() {
		if (this.boundsVersion === this.version && this.geometryBoundsVersion === this.geometry.version) return this.aggregate;
		let e = super.boundingSphere, t = this.material.deformationBounds, r = this.instanceDeformationSphere;
		r.x = e.x, r.y = e.y, r.z = e.z, r.radius = t === void 0 ? 1 / 0 : e.radius + t;
		let i = 1 / 0, a = 1 / 0, o = 1 / 0, s = -1 / 0, c = -1 / 0, l = -1 / 0;
		for (let e = 0; e < this.count; e++) {
			let t = require_render_bounds.transformSphereElements(r, this.matrices, e * 16, this.instanceSphere);
			i = Math.min(i, t.x - t.radius), a = Math.min(a, t.y - t.radius), o = Math.min(o, t.z - t.radius), s = Math.max(s, t.x + t.radius), c = Math.max(c, t.y + t.radius), l = Math.max(l, t.z + t.radius);
		}
		return this.aggregate.x = (i + s) / 2, this.aggregate.y = (a + c) / 2, this.aggregate.z = (o + l) / 2, this.aggregate.radius = Math.hypot(s - i, c - a, l - o) / 2, this.boundsVersion = this.version, this.geometryBoundsVersion = this.geometry.version, this.aggregate;
	}
	constructor(e) {
		if (super(e), !Number.isSafeInteger(e.count) || e.count < 1 || e.count > 268435455) throw RangeError(`Instance count must be a positive supported integer.`);
		this.count = e.count, this.matrices = new Float32Array(this.count * 16);
		for (let e = 0; e < this.count; e++) {
			let t = e * 16;
			this.matrices[t] = 1, this.matrices[t + 5] = 1, this.matrices[t + 10] = 1, this.matrices[t + 15] = 1;
		}
	}
	setMatrixAt(t, n) {
		if (this.validateIndex(t), !(n instanceof require_math3d.Matrix4)) throw TypeError(`Instance transform must be a Matrix4.`);
		let r = n.elements;
		for (let e = 0; e < 16; e++) if (!Number.isFinite(r[e])) throw RangeError(`Instance transform components must be finite.`);
		if (r[3] !== 0 || r[7] !== 0 || r[11] !== 0 || r[15] !== 1) throw RangeError(`Instance transforms must be affine.`);
		let i = r[0] * (r[5] * r[10] - r[9] * r[6]) - r[4] * (r[1] * r[10] - r[9] * r[2]) + r[8] * (r[1] * r[6] - r[5] * r[2]);
		if (i === 0 || !Number.isFinite(i)) throw RangeError(`Instance transforms must be invertible for lighting.`);
		this.matrices.set(r, t * 16), this.version++;
	}
	setColorAt(e, t, n, r) {
		if (this.validateIndex(e), !Number.isFinite(t) || t < 0 || !Number.isFinite(Math.fround(t)) || !Number.isFinite(n) || n < 0 || !Number.isFinite(Math.fround(n)) || !Number.isFinite(r) || r < 0 || !Number.isFinite(Math.fround(r))) throw RangeError(`Instance color components must be finite and nonnegative.`);
		this.instanceColors ??= new Float32Array(this.count * 3).fill(1);
		let i = e * 3;
		this.instanceColors[i] = t, this.instanceColors[i + 1] = n, this.instanceColors[i + 2] = r, this.colorVersion++;
	}
	getColorAt(e, t) {
		this.validateIndex(e);
		let n = this.instanceColors;
		return t[0] = n?.[e * 3] ?? 1, t[1] = n?.[e * 3 + 1] ?? 1, t[2] = n?.[e * 3 + 2] ?? 1, t;
	}
	getMatrixAt(t, n) {
		if (this.validateIndex(t), !(n instanceof require_math3d.Matrix4)) throw TypeError(`Instance transform output must be a Matrix4.`);
		let r = t * 16;
		for (let e = 0; e < 16; e++) n.elements[e] = this.matrices[r + e];
		return n;
	}
	validateIndex(e) {
		if (!Number.isSafeInteger(e) || e < 0 || e >= this.count) throw RangeError(`Instance index is outside the mesh instance range.`);
	}
};
//#endregion
exports.InstancedMesh = InstancedMesh;

//# sourceMappingURL=instanced-mesh.cjs.map