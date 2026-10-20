const require_hypot = require("../../math/src/hypot.cjs");
const require_geometry = require("./geometry.cjs");
const require_object3d = require("./object3d.cjs");
const require_mesh = require("./mesh.cjs");
const require_ribbon = require("../../../src/data/ribbon.cjs");
//#region dist/packages/core/src/ribbon3d.js
var a = [{
	age: 0,
	width: 1,
	color: [
		1,
		1,
		1,
		1
	]
}, {
	age: 1,
	width: 0,
	color: [
		1,
		1,
		1,
		0
	]
}];
var Ribbon3D = class extends require_mesh.Mesh {
	maxPoints;
	lifetime;
	mode;
	curve;
	points;
	start = 0;
	count = 0;
	clock = -1 / 0;
	constructor(n) {
		let r = n.maxPoints ?? require_ribbon.ribbonLimits.defaultPoints, i = n.lifetime ?? require_ribbon.ribbonLimits.defaultLifetime, o = n.mode ?? `camera-facing`;
		if (!Number.isSafeInteger(r) || r < 2 || r > require_ribbon.ribbonLimits.maximumPoints) throw RangeError(`Ribbon maxPoints must be an integer in [2,65536].`);
		if (!Number.isFinite(i) || i <= 0) throw RangeError(`Ribbon lifetime must be positive and finite.`);
		if (o !== `flat` && o !== `camera-facing`) throw RangeError(`Invalid ribbon orientation.`);
		let s = n.curve ?? a;
		if (s.length < 2 || s.length > require_ribbon.ribbonLimits.maximumCurveKeys || s[0].age !== 0 || s[s.length - 1].age !== 1) throw RangeError(`Ribbon curve needs 2–64 keys spanning [0,1].`);
		for (let e = 0; e < s.length; e++) {
			let t = s[e];
			if (!Number.isFinite(t.age) || e > 0 && t.age <= s[e - 1].age || !Number.isFinite(t.width) || t.width < 0 || t.color.length !== 4 || t.color.some((e, t) => !Number.isFinite(e) || e < 0 || t === 3 && e > 1)) throw RangeError(`Invalid ribbon age/width/color curve.`);
		}
		let c = new Float32Array(r * 6), l = new Float32Array(r * 6), u = new Float32Array(r * 4), d = new Uint32Array((r - 1) * 6);
		for (let e = 0; e < r; e++) l[e * 6 + 1] = l[e * 6 + 4] = 1, u[e * 4 + 2] = 1, e < r - 1 && d.set([
			e * 2,
			e * 2 + 1,
			e * 2 + 2,
			e * 2 + 1,
			e * 2 + 3,
			e * 2 + 2
		], e * 6);
		let f = new require_geometry.Geometry({
			positions: c,
			normals: l,
			uvs: u,
			indices: d,
			colors: new Float32Array(r * 8)
		});
		super({
			geometry: f,
			material: n.material,
			castShadow: !1
		}), this.maxPoints = r, this.lifetime = i, this.mode = o, this.curve = s.map((e) => ({
			age: e.age,
			width: e.width,
			color: [...e.color]
		})), this.points = new Float64Array(r * 4), this.visible = !1;
	}
	get pointCount() {
		return this.count;
	}
	addPoint(e, t, n, r) {
		if (![
			e,
			t,
			n,
			r
		].every(Number.isFinite) || ![
			e,
			t,
			n
		].every((e) => Number.isFinite(Math.fround(e))) || r < this.clock) throw RangeError(`Ribbon points require finite coordinates and monotonic time.`);
		this.clock = r, this.count === this.maxPoints && (this.start = (this.start + 1) % this.maxPoints, this.count--);
		let i = (this.start + this.count++) % this.maxPoints * 4;
		this.points[i] = e, this.points[i + 1] = t, this.points[i + 2] = n, this.points[i + 3] = r;
	}
	clear() {
		this.start = 0, this.count = 0, this.clock = -1 / 0, this.visible = !1;
	}
	update(e, t = [
		0,
		0,
		1
	]) {
		if (!Number.isFinite(e) || e < this.clock || t.length !== 3 || !t.every(Number.isFinite) || Math.hypot(...t) === 0) throw RangeError(`Ribbon update requires monotonic time and a finite nonzero view direction.`);
		for (this.clock = e; this.count && e - this.points[this.start * 4 + 3] >= this.lifetime;) this.start = (this.start + 1) % this.maxPoints, this.count--;
		let n = this.geometry.vertices, r = this.geometry.colors;
		for (let a = 0; a < this.maxPoints; a++) {
			let o = a < this.count, s = (this.start + Math.min(a, Math.max(0, this.count - 1))) % this.maxPoints * 4, c = (this.start + Math.max(0, a - 1)) % this.maxPoints * 4, l = (this.start + Math.min(this.count - 1, a + 1) + this.maxPoints) % this.maxPoints * 4, u = 1, d = 0, f = 0, p = 0, m = 1, h = 0, g = o ? Math.min(1, Math.max(0, (e - this.points[s + 3]) / this.lifetime)) : 1, _ = 1;
			for (; _ < this.curve.length - 1 && g > this.curve[_].age;) _++;
			let v = this.curve[_ - 1], y = this.curve[_], b = (g - v.age) / (y.age - v.age), x = o ? (v.width + (y.width - v.width) * b) * .5 : 0;
			if (o && this.count > 1) {
				let e = this.points[l] - this.points[c], n = this.points[l + 1] - this.points[c + 1], r = this.points[l + 2] - this.points[c + 2];
				p = this.mode === `flat` ? 0 : t[0], m = this.mode === `flat` ? 1 : t[1], h = this.mode === `flat` ? 0 : t[2], u = n * h - r * m, d = r * p - e * h, f = e * m - n * p;
				let a = require_hypot.hypot3(u, d, f);
				a > 1e-12 ? (u /= a, d /= a, f /= a) : (u = 1, d = 0, f = 0);
				let o = require_hypot.hypot3(p, m, h);
				p /= o, m /= o, h /= o;
			}
			for (let e = 0; e < 2; e++) {
				let t = (a * 2 + e) * 8, i = e === 0 ? -1 : 1;
				n[t] = this.count ? this.points[s] + u * x * i : 0, n[t + 1] = this.count ? this.points[s + 1] + d * x * i : 0, n[t + 2] = this.count ? this.points[s + 2] + f * x * i : 0, n[t + 3] = p, n[t + 4] = m, n[t + 5] = h, n[t + 6] = e, n[t + 7] = g;
				for (let t = 0; t < 4; t++) r[(a * 2 + e) * 4 + t] = o ? v.color[t] + (y.color[t] - v.color[t]) * b : 0;
			}
		}
		this.visible = this.count >= 2, this.geometry.markUpdated();
	}
};
var Trail3D = class extends Ribbon3D {
	target;
	minimumDistance;
	lastX = 1 / 0;
	lastY = 1 / 0;
	lastZ = 1 / 0;
	constructor(t) {
		if (super(t), !(t.target instanceof require_object3d.Object3D)) throw TypeError(`Trail target must be Object3D.`);
		if (this.target = t.target, this.minimumDistance = t.minimumDistance ?? require_ribbon.ribbonLimits.minimumDistance, !Number.isFinite(this.minimumDistance) || this.minimumDistance < 0) throw RangeError(`Trail minimumDistance must be nonnegative.`);
	}
	sample(e, t) {
		let n = this.target.updateWorldMatrix().elements, r = n[12], a = n[13], o = n[14];
		require_hypot.hypot3(r - this.lastX, a - this.lastY, o - this.lastZ) >= this.minimumDistance && (this.addPoint(r, a, o, e), this.lastX = r, this.lastY = a, this.lastZ = o), this.update(e, t);
	}
	clear() {
		super.clear(), this.lastX = this.lastY = this.lastZ = 1 / 0;
	}
};
//#endregion
exports.Ribbon3D = Ribbon3D;
exports.Trail3D = Trail3D;

//# sourceMappingURL=ribbon3d.cjs.map