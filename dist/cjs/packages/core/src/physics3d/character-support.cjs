const require_math3d = require("../../../math/src/math3d.cjs");
//#region dist/packages/core/src/physics3d/character-support.js
var CharacterSupportPose3D = class {
	matrix = new require_math3d.Matrix4();
	position = new require_math3d.Vector3();
	rotation = new require_math3d.Quaternion();
	scale = new require_math3d.Vector3();
	capture(e) {
		this.matrix.copy(e);
		let t = e.elements;
		this.position.set(t[12], t[13], t[14]);
		let n = Math.hypot(t[0], t[1], t[2]), r = Math.hypot(t[4], t[5], t[6]), i = Math.hypot(t[8], t[9], t[10]);
		this.scale.set(n, r, i);
		let a = t[0] / n, o = t[4] / r, s = t[8] / i, c = t[1] / n, l = t[5] / r, u = t[9] / i, d = t[2] / n, f = t[6] / r, p = t[10] / i, m = a + l + p, h = this.rotation;
		if (m > 0) {
			let e = Math.sqrt(m + 1) * 2;
			h.set((f - u) / e, (s - d) / e, (c - o) / e, e / 4);
		} else if (a > l && a > p) {
			let e = Math.sqrt(1 + a - l - p) * 2;
			h.set(e / 4, (o + c) / e, (s + d) / e, (f - u) / e);
		} else if (l > p) {
			let e = Math.sqrt(1 + l - a - p) * 2;
			h.set((o + c) / e, e / 4, (u + f) / e, (s - d) / e);
		} else {
			let e = Math.sqrt(1 + p - a - l) * 2;
			h.set((s + d) / e, (u + f) / e, e / 4, (c - o) / e);
		}
		h.normalize();
	}
	angleTo(e) {
		let t = this.rotation, n = e.rotation;
		return 2 * Math.acos(Math.min(1, Math.abs(t.x * n.x + t.y * n.y + t.z * n.z + t.w * n.w)));
	}
	interpolatePoint(e, t, n, r) {
		let i = this.rotation, a = e.rotation, o = i.x * a.x + i.y * a.y + i.z * a.z + i.w * a.w, s = o < 0 ? -1 : 1, c = Math.min(1, Math.abs(o)), l = 1 - n, u = n * s;
		if (c < .9995) {
			let e = Math.acos(c), t = Math.sin(e);
			l = Math.sin((1 - n) * e) / t, u = Math.sin(n * e) / t * s;
		}
		let d = i.x * l + a.x * u, f = i.y * l + a.y * u, p = i.z * l + a.z * u, m = i.w * l + a.w * u, h = 1 / Math.hypot(d, f, p, m);
		d *= h, f *= h, p *= h, m *= h;
		let g = t.x * this.scale.x, _ = t.y * this.scale.y, v = t.z * this.scale.z, y = 2 * (f * v - p * _), b = 2 * (p * g - d * v), x = 2 * (d * _ - f * g);
		r.set(this.position.x + (e.position.x - this.position.x) * n + g + m * y + f * x - p * b, this.position.y + (e.position.y - this.position.y) * n + _ + m * b + p * y - d * x, this.position.z + (e.position.z - this.position.z) * n + v + m * x + d * b - f * y);
	}
};
//#endregion
exports.CharacterSupportPose3D = CharacterSupportPose3D;

//# sourceMappingURL=character-support.cjs.map