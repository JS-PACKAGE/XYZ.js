const require_hypot = require("../../../math/src/hypot.cjs");
const require_index = require("../../../math/src/index.cjs");
const require_world2d = require("../../../../src/data/world2d.cjs");
//#region dist/packages/core/src/physics2d/collider.js
var i = require_world2d.physicsDefaults.geometryEpsilon;
var a = [
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
	filterBits = Int32Array.of(1, -1);
	queryGeometry;
	constructor(t, r, a, o = {}) {
		this.kind = t, this.radius = r;
		let s = o.offset ?? [0, 0];
		if (this.offset = Object.freeze(new require_index.Vector2(boundedCoordinate(s[0], `offset.x`), boundedCoordinate(s[1], `offset.y`))), t === `circle`) {
			positive(r, `radius`), boundedCoordinate(r, `radius`), this.vertices = Object.freeze([]);
			return;
		}
		if (a.length < 3 || a.length > require_world2d.world2dLimits.polygonVertices) throw RangeError(`Convex polygons require 3–32 vertices.`);
		let c = a.map(([e, t]) => [boundedCoordinate(e, `vertex.x`), boundedCoordinate(t, `vertex.y`)]), l = 0;
		for (let e = 0; e < c.length; e++) {
			let t = c[e], n = c[(e + 1) % c.length];
			l += t[0] * n[1] - t[1] * n[0];
		}
		if (!Number.isFinite(l) || Math.abs(l) <= i) throw RangeError(`Polygon must have finite nonzero area.`);
		l < 0 && c.reverse();
		for (let e = 0; e < c.length; e++) {
			let t = c[e], n = c[(e + 1) % c.length];
			for (let r = 0; r < c.length; r++) {
				if (r === e || r === (e + 1) % c.length) continue;
				let a = c[r];
				if ((n[0] - t[0]) * (a[1] - t[1]) - (n[1] - t[1]) * (a[0] - t[0]) <= i) throw RangeError(`Polygon must be strictly convex with distinct vertices.`);
			}
		}
		this.vertices = Object.freeze(c.map((e) => Object.freeze(e)));
	}
	get category() {
		return this.categoryBits;
	}
	set category(e) {
		this.categoryBits = unsigned(e, `category`), this.filterBits[0] = this.categoryBits;
	}
	get mask() {
		return this.maskBits;
	}
	set mask(e) {
		this.maskBits = unsigned(e, `mask`), this.filterBits[1] = this.maskBits;
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
	let r = e.map(([e, t]) => [boundedCoordinate(e, `point.x`), boundedCoordinate(t, `point.y`)]).sort((e, t) => e[0] - t[0] || e[1] - t[1]), a = r.filter((e, t) => t === 0 || e[0] !== r[t - 1][0] || e[1] !== r[t - 1][1]), turn = (e, t, n) => (t[0] - e[0]) * (n[1] - e[1]) - (t[1] - e[1]) * (n[0] - e[0]), o = [], s = [];
	for (let e of a) {
		for (; o.length >= 2 && turn(o[o.length - 2], o[o.length - 1], e) <= i;) o.pop();
		o.push(e);
	}
	for (let e = a.length - 1; e >= 0; e--) {
		let t = a[e];
		for (; s.length >= 2 && turn(s[s.length - 2], s[s.length - 1], t) <= i;) s.pop();
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
	edges;
	edgesRevision = -1;
	refreshedFromInputs = !1;
	rayEdgeTolerance = 0;
	rayBound = 1;
	rayBoundRevision = -1;
	poseState = (/* @__PURE__ */ new Float64Array(30)).fill(NaN);
	offsetX;
	offsetY;
	local;
	constructor(e) {
		this.collider = e;
		let t = e.vertices, n = e.offset;
		this.points = new Float64Array(t.length * 2), this.offsetX = n.x, this.offsetY = n.y, this.local = new Float64Array(t.length * 2);
		for (let e = 0; e < t.length; e++) {
			let r = t[e];
			this.local[e * 2] = r[0] + n.x, this.local[e * 2 + 1] = r[1] + n.y;
		}
	}
	edgeData() {
		let e = this.points, t = this.edges;
		if (t && this.edgesRevision === this.revision) return t;
		t ??= this.edges = new Float64Array((e.length >> 1) * 3);
		for (let n = 0, i = 0; n < e.length; n += 2, i += 3) {
			let a = (n + 2) % e.length, o = e[a] - e[n], s = e[a + 1] - e[n + 1], c = require_hypot.hypot2(o, s);
			t[i] = s / c, t[i + 1] = -o / c, t[i + 2] = c;
		}
		return this.edgesRevision = this.revision, t;
	}
	invalidateEdges() {
		this.edgesRevision = -1;
	}
	rayAmplification() {
		if (this.rayBoundRevision === this.revision) return this.rayBound;
		if (this.rayBoundRevision = this.revision, this.collider.kind === `circle`) return this.rayEdgeTolerance = 0, this.rayBound = 1;
		let e = this.points, t = this.edgeData(), n = e.length >> 1, r = 1 / 0;
		for (let e = 0; e < n; e++) r = Math.min(r, t[e * 3 + 2]);
		this.rayEdgeTolerance = i / r;
		let a = 0;
		for (let r = 0; r < 4; r++) {
			let i = r === 0 ? 1 : r === 1 ? -1 : 0, o = r === 2 ? 1 : r === 3 ? -1 : 0, s = r === 0 ? this.maxX : r === 1 ? this.minX : r === 2 ? this.maxY : this.minY, c = 0;
			for (; c < n && e[c * 2 + (r >> 1)] !== s;) c++;
			let l = (c + n - 1) % n * 3, u = c * 3, d = t[l], f = t[l + 1], p = t[u], m = t[u + 1], h = d * m - f * p, g = (i * m - o * p) / h, _ = (d * o - f * i) / h;
			if (!(g >= -1e-9 && _ >= -1e-9)) {
				a = 1 / 0;
				break;
			}
			a = Math.max(a, Math.max(0, g) + Math.max(0, _));
		}
		return this.rayBound = a;
	}
	refresh(e) {
		let t = e.transform, n = this.poseState, r = e.composesFromTransform;
		if (this.refreshedFromInputs = r, r && n[6] === t.position.x && n[7] === t.position.y && n[8] === t.rotation && n[9] === t.scale.x && n[10] === t.scale.y && n[11] === t.pivot.x && n[12] === t.pivot.y && n[13] === t.skew.x && n[14] === t.skew.y) return;
		let i = r ? void 0 : e.baseComposedParent;
		i && (this.refreshedFromInputs = !0), !(i && this.childUnchanged(i, t)) && (n[6] = NaN, this.poseState[15] = NaN, this.refreshPose(e), i ? this.recordChild(i, t) : r && (n[6] = t.position.x, n[7] = t.position.y, n[8] = t.rotation, n[9] = t.scale.x, n[10] = t.scale.y, n[11] = t.pivot.x, n[12] = t.pivot.y, n[13] = t.skew.x, n[14] = t.skew.y));
	}
	childUnchanged(e, t) {
		let n = e.updateWorldMatrix().elements, r = this.poseState;
		return r[15] === n[0] && r[16] === n[1] && r[17] === n[3] && r[18] === n[4] && r[19] === n[6] && r[20] === n[7] && r[21] === t.position.x && r[22] === t.position.y && r[23] === t.rotation && r[24] === t.scale.x && r[25] === t.scale.y && r[26] === t.pivot.x && r[27] === t.pivot.y && r[28] === t.skew.x && r[29] === t.skew.y;
	}
	recordChild(e, t) {
		let n = e.updateWorldMatrix().elements, r = this.poseState;
		r[15] = n[0], r[16] = n[1], r[17] = n[3], r[18] = n[4], r[19] = n[6], r[20] = n[7], r[21] = t.position.x, r[22] = t.position.y, r[23] = t.rotation, r[24] = t.scale.x, r[25] = t.scale.y, r[26] = t.pivot.x, r[27] = t.pivot.y, r[28] = t.skew.x, r[29] = t.skew.y;
	}
	refreshPose(e) {
		let t = e.updateWorldMatrix().elements, n = !1;
		for (let e = 0; e < a.length; e++) if (this.poseState[0 + e] !== t[a[e]]) {
			n = !0;
			break;
		}
		if (!n) return;
		for (let e = 0; e < a.length; e++) finite(t[a[e]], `world transform`);
		let o = t[0] * t[4] - t[1] * t[3];
		if (Math.abs(o) <= i) throw RangeError(`Physics requires a nonsingular world transform.`);
		let s = this.offsetX, c = this.offsetY;
		if (this.x = t[0] * s + t[3] * c + t[6], this.y = t[1] * s + t[4] * c + t[7], this.collider.kind === `circle`) {
			let e = require_hypot.hypot2(t[0], t[1]), n = require_hypot.hypot2(t[3], t[4]);
			if (Math.abs(e - n) > i * Math.max(e, n) || Math.abs(t[0] * t[3] + t[1] * t[4]) > i * e * n) throw RangeError(`Circle colliders require uniform absolute world scale without shear.`);
			this.radius = this.collider.radius * e, this.area = Math.PI * this.radius * this.radius, this.minX = this.x - this.radius, this.maxX = this.x + this.radius, this.minY = this.y - this.radius, this.maxY = this.y + this.radius, this.inertiaPerMass = this.radius * this.radius / 2 + (this.x - t[6]) ** 2 + (this.y - t[7]) ** 2, positive(this.inertiaPerMass, `world geometry inertia`);
			for (let e = 0; e < a.length; e++) this.poseState[0 + e] = t[a[e]];
			this.revision++;
			return;
		}
		let l = 1 / 0, u = 1 / 0, d = -1 / 0, f = -1 / 0, p = this.local, m = this.points, h = p.length >> 1;
		for (let e = 0; e < h; e++) {
			let n = (o < 0 ? h - 1 - e : e) * 2, r = p[n], i = p[n + 1], a = t[0] * r + t[3] * i + t[6], s = t[1] * r + t[4] * i + t[7];
			m[e * 2] = a, m[e * 2 + 1] = s, l = Math.min(l, a), d = Math.max(d, a), u = Math.min(u, s), f = Math.max(f, s);
		}
		this.minX = l, this.maxX = d, this.minY = u, this.maxY = f;
		let g = 0, _ = 0;
		for (let e = 0; e < h; e++) {
			let n = (e + 1) % h, r = m[e * 2] - t[6], i = m[e * 2 + 1] - t[7], a = m[n * 2] - t[6], o = m[n * 2 + 1] - t[7], s = r * o - i * a;
			g += s, _ += s * (r * r + r * a + a * a + i * i + i * o + o * o);
		}
		this.inertiaPerMass = _ / (6 * g), this.area = g / 2, positive(this.inertiaPerMass, `world geometry inertia`);
		for (let e = 0; e < a.length; e++) this.poseState[0 + e] = t[a[e]];
		this.revision++;
	}
	contains(e, t) {
		if (this.collider.kind === `circle`) return (e - this.x) ** 2 + (t - this.y) ** 2 <= this.radius ** 2;
		let n = this.points;
		for (let r = 0; r < n.length; r += 2) {
			let a = (r + 2) % n.length;
			if ((n[a] - n[r]) * (t - n[r + 1]) - (n[a + 1] - n[r + 1]) * (e - n[r]) < -i) return !1;
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