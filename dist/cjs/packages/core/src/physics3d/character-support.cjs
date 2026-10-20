const require_hypot = require("../../../math/src/hypot.cjs");
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
		let n = require_hypot.hypot3(t[0], t[1], t[2]), i = require_hypot.hypot3(t[4], t[5], t[6]), a = require_hypot.hypot3(t[8], t[9], t[10]);
		this.scale.set(n, i, a);
		let o = t[0] / n, s = t[4] / i, c = t[8] / a, l = t[1] / n, u = t[5] / i, d = t[9] / a, f = t[2] / n, p = t[6] / i, m = t[10] / a, h = o + u + m, g = this.rotation;
		if (h > 0) {
			let e = Math.sqrt(h + 1) * 2;
			g.set((p - d) / e, (c - f) / e, (l - s) / e, e / 4);
		} else if (o > u && o > m) {
			let e = Math.sqrt(1 + o - u - m) * 2;
			g.set(e / 4, (s + l) / e, (c + f) / e, (p - d) / e);
		} else if (u > m) {
			let e = Math.sqrt(1 + u - o - m) * 2;
			g.set((s + l) / e, e / 4, (d + p) / e, (c - f) / e);
		} else {
			let e = Math.sqrt(1 + m - o - u) * 2;
			g.set((c + f) / e, (d + p) / e, e / 4, (l - s) / e);
		}
		g.normalize();
	}
	angleTo(e) {
		let t = this.rotation, n = e.rotation;
		return 2 * Math.acos(Math.min(1, Math.abs(t.x * n.x + t.y * n.y + t.z * n.z + t.w * n.w)));
	}
	interpolatePoint(e, t, n, r) {
		let a = this.rotation, o = e.rotation, s = a.x * o.x + a.y * o.y + a.z * o.z + a.w * o.w, c = s < 0 ? -1 : 1, l = Math.min(1, Math.abs(s)), u = 1 - n, d = n * c;
		if (l < .9995) {
			let e = Math.acos(l), t = Math.sin(e);
			u = Math.sin((1 - n) * e) / t, d = Math.sin(n * e) / t * c;
		}
		let f = a.x * u + o.x * d, p = a.y * u + o.y * d, m = a.z * u + o.z * d, h = a.w * u + o.w * d, g = 1 / require_hypot.hypot4(f, p, m, h);
		f *= g, p *= g, m *= g, h *= g;
		let _ = t.x * this.scale.x, v = t.y * this.scale.y, y = t.z * this.scale.z, b = 2 * (p * y - m * v), x = 2 * (m * _ - f * y), S = 2 * (f * v - p * _);
		r.set(this.position.x + (e.position.x - this.position.x) * n + _ + h * b + p * S - m * x, this.position.y + (e.position.y - this.position.y) * n + v + h * x + m * b - f * S, this.position.z + (e.position.z - this.position.z) * n + y + h * S + f * x - p * b);
	}
};
//#endregion
exports.CharacterSupportPose3D = CharacterSupportPose3D;

//# sourceMappingURL=character-support.cjs.map