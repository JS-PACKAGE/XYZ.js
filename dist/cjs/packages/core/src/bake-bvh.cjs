const require_math3d = require("../../math/src/math3d.cjs");
//#region dist/packages/core/src/bake-bvh.js
var BakeBVH = class {
	maxRays;
	triangles = [];
	nodes = [];
	stack = [];
	rays = 0;
	constructor(t, n, r) {
		this.maxRays = r;
		let i = 0;
		for (let e of t) i += e.geometry.indices.length / 3;
		if (i > n) throw RangeError(`Bake triangle budget exceeded.`);
		let a = new require_math3d.Matrix4();
		for (let e of t) {
			if (e.morph || e.renderGeometry !== e.geometry) throw RangeError(`Bake requires undeformed static meshes.`);
			let t = e.updateWorldMatrix();
			a.copy(t).invert();
			let n = t.elements, r = a.elements, i = e.geometry;
			for (let t = 0; t < i.indices.length; t += 3) {
				let a = [
					i.indices[t],
					i.indices[t + 1],
					i.indices[t + 2]
				], o = /* @__PURE__ */ new Float64Array(9), s = /* @__PURE__ */ new Float64Array(9);
				for (let e = 0; e < 3; e++) {
					let t = a[e] * 8;
					for (let a = 0; a < 3; a++) if (o[e * 3 + a] = n[a] * i.vertices[t] + n[a + 4] * i.vertices[t + 1] + n[a + 8] * i.vertices[t + 2] + n[a + 12], s[e * 3 + a] = r[a * 4] * i.vertices[t + 3] + r[a * 4 + 1] * i.vertices[t + 4] + r[a * 4 + 2] * i.vertices[t + 5], !Number.isFinite(o[e * 3 + a]) || !Number.isFinite(s[e * 3 + a])) throw RangeError(`Nonfinite bake transform.`);
				}
				this.triangles.push({
					mesh: e,
					indices: a,
					p: o,
					n: s
				});
			}
		}
		i && this.build(0, i);
	}
	build(e, t) {
		let n = [
			1 / 0,
			1 / 0,
			1 / 0
		], r = [
			-1 / 0,
			-1 / 0,
			-1 / 0
		];
		for (let i = e; i < t; i++) for (let e = 0; e < 3; e++) for (let t = 0; t < 3; t++) n[t] = Math.min(n[t], this.triangles[i].p[e * 3 + t]), r[t] = Math.max(r[t], this.triangles[i].p[e * 3 + t]);
		let i = this.nodes.length, a = {
			min: n,
			max: r,
			start: e,
			end: t,
			left: -1,
			right: -1
		};
		if (this.nodes.push(a), t - e > 8) {
			let i = 0;
			for (let e = 1; e < 3; e++) r[e] - n[e] > r[i] - n[i] && (i = e);
			let o = this.triangles.slice(e, t).sort((e, t) => e.p[i] + e.p[i + 3] + e.p[i + 6] - (t.p[i] + t.p[i + 3] + t.p[i + 6]));
			for (let t = 0; t < o.length; t++) this.triangles[e + t] = o[t];
			let s = e + t >>> 1;
			a.left = this.build(e, s), a.right = this.build(s, t);
		}
		return i;
	}
	hit(e, t, n, r) {
		if (++this.rays > this.maxRays) throw RangeError(`Bake ray budget exceeded.`);
		let i = this.stack;
		i.length = 0, this.nodes.length && i.push(0);
		let a = n, o;
		for (; i.length;) {
			let n = this.nodes[i.pop()], s = 0, c = a;
			for (let r = 0; r < 3; r++) if (Math.abs(t[r]) < 1e-15) (e[r] < n.min[r] || e[r] > n.max[r]) && (c = -1);
			else {
				let i = (n.min[r] - e[r]) / t[r], a = (n.max[r] - e[r]) / t[r];
				s = Math.max(s, Math.min(i, a)), c = Math.min(c, Math.max(i, a));
			}
			if (!(c < s)) {
				if (n.left >= 0) {
					i.push(n.left, n.right);
					continue;
				}
				for (let i = n.start; i < n.end; i++) {
					let n = this.triangles[i];
					if (n === r) continue;
					let s = n.p, c = s[3] - s[0], l = s[4] - s[1], u = s[5] - s[2], d = s[6] - s[0], f = s[7] - s[1], p = s[8] - s[2], m = t[1] * p - t[2] * f, h = t[2] * d - t[0] * p, g = t[0] * f - t[1] * d, _ = c * m + l * h + u * g;
					if (Math.abs(_) < 1e-12) continue;
					let v = e[0] - s[0], y = e[1] - s[1], b = e[2] - s[2], x = (v * m + y * h + b * g) / _;
					if (x < 0 || x > 1) continue;
					let S = y * u - b * l, C = b * c - v * u, w = v * l - y * c, T = (t[0] * S + t[1] * C + t[2] * w) / _;
					if (T < 0 || x + T > 1) continue;
					let E = (d * S + f * C + p * w) / _;
					E > 1e-7 && E < a && (a = E, o = n);
				}
			}
		}
		return o ? {
			triangle: o,
			distance: a
		} : void 0;
	}
};
//#endregion
exports.BakeBVH = BakeBVH;

//# sourceMappingURL=bake-bvh.cjs.map