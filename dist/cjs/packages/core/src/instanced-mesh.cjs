const require_hypot = require("../../math/src/hypot.cjs");
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
		let e = super.boundingSphere, t = this.material.deformationBounds, i = this.instanceDeformationSphere;
		i.x = e.x, i.y = e.y, i.z = e.z, i.radius = t === void 0 ? 1 / 0 : e.radius + t;
		let a = 1 / 0, o = 1 / 0, s = 1 / 0, c = -1 / 0, l = -1 / 0, u = -1 / 0;
		for (let e = 0; e < this.count; e++) {
			let t = require_render_bounds.transformSphereElements(i, this.matrices, e * 16, this.instanceSphere);
			a = Math.min(a, t.x - t.radius), o = Math.min(o, t.y - t.radius), s = Math.min(s, t.z - t.radius), c = Math.max(c, t.x + t.radius), l = Math.max(l, t.y + t.radius), u = Math.max(u, t.z + t.radius);
		}
		return this.aggregate.x = (a + c) / 2, this.aggregate.y = (o + l) / 2, this.aggregate.z = (s + u) / 2, this.aggregate.radius = require_hypot.hypot3(c - a, l - o, u - s) / 2, this.boundsVersion = this.version, this.geometryBoundsVersion = this.geometry.version, this.aggregate;
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