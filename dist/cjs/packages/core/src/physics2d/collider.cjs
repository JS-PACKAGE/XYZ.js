const require_index = require("../../../math/src/index.cjs");
const require_world2d = require("../../../../src/data/world2d.cjs");
//#region dist/packages/core/src/physics2d/collider.js
var r = require_world2d.physicsDefaults.geometryEpsilon;
var i = [
	0,
	1,
	3,
	4,
	6,
	7
];
function finite(e, t) {
	if (!Number.isFinite(e)) throw RangeError(`${t} must be finite.`);
	return e;
}
function positive(e, t) {
	if (finite(e, t), e <= 0) throw RangeError(`${t} must be positive.`);
	return e;
}
function nonnegativeFinite(e, t) {
	if (finite(e, t), e < 0) throw RangeError(`${t} must be nonnegative.`);
	return e;
}
function unsigned(e, t) {
	if (!Number.isInteger(e) || e < 0 || e > 4294967295) throw RangeError(`${t} must be an unsigned 32-bit integer.`);
	return e >>> 0;
}
function boundedCoordinate(e, t) {
	if (finite(e, t), Math.abs(e) > require_world2d.world2dLimits.geometryExtent) throw RangeError(`${t} exceeds the physics geometry extent limit.`);
	return e;
}
var Collider2D = class {
	kind;
	radius;
	offset;
	vertices;
	sensor = !1;
	categoryBits = 1;
	maskBits = 4294967295;
	queryGeometry;
	constructor(t, i, a, o = {}) {
		this.kind = t, this.radius = i;
		let s = o.offset ?? [0, 0];
		if (this.offset = Object.freeze(new require_index.Vector2(boundedCoordinate(s[0], `offset.x`), boundedCoordinate(s[1], `offset.y`))), t === `circle`) {
			positive(i, `radius`), boundedCoordinate(i, `radius`), this.vertices = Object.freeze([]);
			return;
		}
		if (a.length < 3 || a.length > require_world2d.world2dLimits.polygonVertices) throw RangeError(`Convex polygons require 3–32 vertices.`);
		let c = a.map(([e, t]) => [boundedCoordinate(e, `vertex.x`), boundedCoordinate(t, `vertex.y`)]), l = 0;
		for (let e = 0; e < c.length; e++) {
			let t = c[e], n = c[(e + 1) % c.length];
			l += t[0] * n[1] - t[1] * n[0];
		}
		if (!Number.isFinite(l) || Math.abs(l) <= r) throw RangeError(`Polygon must have finite nonzero area.`);
		l < 0 && c.reverse();
		for (let e = 0; e < c.length; e++) {
			let t = c[e], n = c[(e + 1) % c.length];
			for (let i = 0; i < c.length; i++) {
				if (i === e || i === (e + 1) % c.length) continue;
				let a = c[i];
				if ((n[0] - t[0]) * (a[1] - t[1]) - (n[1] - t[1]) * (a[0] - t[0]) <= r) throw RangeError(`Polygon must be strictly convex with distinct vertices.`);
			}
		}
		this.vertices = Object.freeze(c.map((e) => Object.freeze(e)));
	}
	get category() {
		return this.categoryBits;
	}
	set category(e) {
		this.categoryBits = unsigned(e, `category`);
	}
	get mask() {
		return this.maskBits;
	}
	set mask(e) {
		this.maskBits = unsigned(e, `mask`);
	}
	containsPoint(e, t) {
		finite(e.x, `point.x`), finite(e.y, `point.y`);
		let n = this.queryGeometry ??= new ShapeGeometry(this);
		return n.refresh(t), n.contains(e.x, e.y);
	}
};
var Colliders = Object.freeze({
	circle(e, t) {
		return new Collider2D(`circle`, e, [], t);
	},
	box(e, t, n) {
		positive(e, `width`), positive(t, `height`);
		let r = e / 2, i = t / 2;
		return new Collider2D(`polygon`, 0, [
			[-r, -i],
			[r, -i],
			[r, i],
			[-r, i]
		], n);
	},
	polygon(e, t) {
		return new Collider2D(`polygon`, 0, e, t);
	}
});
function convexHull(e, t) {
	if (e.length < 3 || e.length > require_world2d.world2dLimits.hullPoints) throw RangeError(`Convex hulls require 3-256 input points.`);
	let i = e.map(([e, t]) => [boundedCoordinate(e, `point.x`), boundedCoordinate(t, `point.y`)]).sort((e, t) => e[0] - t[0] || e[1] - t[1]), a = i.filter((e, t) => t === 0 || e[0] !== i[t - 1][0] || e[1] !== i[t - 1][1]), turn = (e, t, n) => (t[0] - e[0]) * (n[1] - e[1]) - (t[1] - e[1]) * (n[0] - e[0]), o = [], s = [];
	for (let e of a) {
		for (; o.length >= 2 && turn(o[o.length - 2], o[o.length - 1], e) <= r;) o.pop();
		o.push(e);
	}
	for (let e = a.length - 1; e >= 0; e--) {
		let t = a[e];
		for (; s.length >= 2 && turn(s[s.length - 2], s[s.length - 1], t) <= r;) s.pop();
		s.push(t);
	}
	return o.pop(), s.pop(), new Collider2D(`polygon`, 0, o.concat(s), t);
}
var ShapeGeometry = class {
	collider;
	points;
	x = 0;
	y = 0;
	radius = 0;
	minX = 0;
	minY = 0;
	maxX = 0;
	maxY = 0;
	inertiaPerMass = 0;
	area = 0;
	revision = 0;
	matrixSnapshot = (/* @__PURE__ */ new Float64Array(6)).fill(NaN);
	constructor(e) {
		this.collider = e, this.points = new Float64Array(e.vertices.length * 2);
	}
	refresh(e) {
		let t = e.updateWorldMatrix().elements, n = !1;
		for (let e = 0; e < i.length; e++) if (this.matrixSnapshot[e] !== t[i[e]]) {
			n = !0;
			break;
		}
		if (!n) return;
		for (let e of i) finite(t[e], `world transform`);
		let a = t[0] * t[4] - t[1] * t[3];
		if (Math.abs(a) <= r) throw RangeError(`Physics requires a nonsingular world transform.`);
		let o = this.collider.offset;
		if (this.x = t[0] * o.x + t[3] * o.y + t[6], this.y = t[1] * o.x + t[4] * o.y + t[7], this.collider.kind === `circle`) {
			let e = Math.hypot(t[0], t[1]), n = Math.hypot(t[3], t[4]);
			if (Math.abs(e - n) > r * Math.max(e, n) || Math.abs(t[0] * t[3] + t[1] * t[4]) > r * e * n) throw RangeError(`Circle colliders require uniform absolute world scale without shear.`);
			this.radius = this.collider.radius * e, this.area = Math.PI * this.radius * this.radius, this.minX = this.x - this.radius, this.maxX = this.x + this.radius, this.minY = this.y - this.radius, this.maxY = this.y + this.radius, this.inertiaPerMass = this.radius * this.radius / 2 + (this.x - t[6]) ** 2 + (this.y - t[7]) ** 2, positive(this.inertiaPerMass, `world geometry inertia`);
			for (let e = 0; e < i.length; e++) this.matrixSnapshot[e] = t[i[e]];
			this.revision++;
			return;
		}
		this.minX = this.minY = 1 / 0, this.maxX = this.maxY = -1 / 0;
		let s = this.collider.vertices, c = s.length;
		for (let e = 0; e < c; e++) {
			let n = s[a < 0 ? c - 1 - e : e], r = n[0] + o.x, i = n[1] + o.y, l = t[0] * r + t[3] * i + t[6], u = t[1] * r + t[4] * i + t[7];
			this.points[e * 2] = l, this.points[e * 2 + 1] = u, this.minX = Math.min(this.minX, l), this.maxX = Math.max(this.maxX, l), this.minY = Math.min(this.minY, u), this.maxY = Math.max(this.maxY, u);
		}
		let l = 0, u = 0;
		for (let e = 0; e < c; e++) {
			let n = (e + 1) % c, r = this.points[e * 2] - t[6], i = this.points[e * 2 + 1] - t[7], a = this.points[n * 2] - t[6], o = this.points[n * 2 + 1] - t[7], s = r * o - i * a;
			l += s, u += s * (r * r + r * a + a * a + i * i + i * o + o * o);
		}
		this.inertiaPerMass = u / (6 * l), this.area = l / 2, positive(this.inertiaPerMass, `world geometry inertia`);
		for (let e = 0; e < i.length; e++) this.matrixSnapshot[e] = t[i[e]];
		this.revision++;
	}
	contains(e, t) {
		if (this.collider.kind === `circle`) return (e - this.x) ** 2 + (t - this.y) ** 2 <= this.radius ** 2;
		let n = this.points;
		for (let i = 0; i < n.length; i += 2) {
			let a = (i + 2) % n.length;
			if ((n[a] - n[i]) * (t - n[i + 1]) - (n[a + 1] - n[i + 1]) * (e - n[i]) < -r) return !1;
		}
		return !0;
	}
};
//#endregion
exports.Collider2D = Collider2D;
exports.Colliders = Colliders;
exports.ShapeGeometry = ShapeGeometry;
exports.convexHull = convexHull;
exports.finite = finite;
exports.nonnegativeFinite = nonnegativeFinite;
exports.positive = positive;
exports.unsigned = unsigned;

//# sourceMappingURL=collider.cjs.map