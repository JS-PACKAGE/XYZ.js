const require_index = require("../../../math/src/index.cjs");
const require_world2d = require("../../../../src/data/world2d.cjs");
const require_collider = require("./collider.cjs");
const require_body = require("./body.cjs");
const require_game_object = require("../game-object.cjs");
//#region dist/packages/core/src/physics2d/shapes.js
var c = 1e-9;
var maxConcaveVertices = 256;
var cross = (e, t, n) => (t[0] - e[0]) * (n[1] - e[1]) - (t[1] - e[1]) * (n[0] - e[0]);
function signedArea(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) {
		let r = e[n], i = e[(n + 1) % e.length];
		t += r[0] * i[1] - r[1] * i[0];
	}
	return t / 2;
}
function segmentsCross(e, t, n, r) {
	let i = cross(e, t, n), a = cross(e, t, r), o = cross(n, r, e), s = cross(n, r, t);
	return i * a < 0 && o * s < 0;
}
function assertSimple(e) {
	let t = e.length;
	for (let n = 0; n < t; n++) for (let r = n + 1; r < t; r++) if (!(r === n + 1 || n === 0 && r === t - 1) && segmentsCross(e[n], e[(n + 1) % t], e[r], e[(r + 1) % t])) throw RangeError(`Concave polygon must not self-intersect.`);
}
function normalized(e) {
	if (e.length < 3 || e.length > 256) throw RangeError(`Concave polygons require 3–256 vertices.`);
	let t = e.map(([e, t]) => [require_collider.finite(e, `vertex.x`), require_collider.finite(t, `vertex.y`)]), n = !0;
	for (; n && t.length >= 3;) {
		n = !1;
		for (let e = 0; e < t.length; e++) {
			let r = t[(e + t.length - 1) % t.length], i = t[e], a = t[(e + 1) % t.length];
			if (Math.hypot(i[0] - r[0], i[1] - r[1]) < c || Math.abs(cross(r, i, a)) < c) {
				t = t.filter((t, n) => n !== e), n = !0;
				break;
			}
		}
	}
	if (t.length < 3 || (assertSimple(t), Math.abs(signedArea(t)) < c)) throw RangeError(`Polygon must have finite nonzero area.`);
	return signedArea(t) < 0 && t.reverse(), t;
}
function earClip(e) {
	let t = e.map((e, t) => t), n = [], r = t.length * t.length;
	for (; t.length > 3 && r-- > 0;) {
		let r = !1;
		for (let i = 0; i < t.length; i++) {
			let a = t[(i + t.length - 1) % t.length], o = t[i], s = t[(i + 1) % t.length];
			if (cross(e[a], e[o], e[s]) <= c) continue;
			let l = !1;
			for (let n of t) {
				if (n === a || n === o || n === s) continue;
				let t = e[n];
				if (cross(e[a], e[o], t) >= -1e-9 && cross(e[o], e[s], t) >= -1e-9 && cross(e[s], e[a], t) >= -1e-9) {
					l = !0;
					break;
				}
			}
			if (!l) {
				n.push([
					a,
					o,
					s
				]), t.splice(i, 1), r = !0;
				break;
			}
		}
		if (!r) throw RangeError(`Polygon could not be triangulated.`);
	}
	return n.push([
		t[0],
		t[1],
		t[2]
	]), n;
}
function rotated(e, t) {
	let n = e.indexOf(t);
	return [...e.slice(n), ...e.slice(0, n)];
}
function mergeAcross(e, n, r) {
	for (let i = 0; i < n.length; i++) {
		let a = n[i], o = n[(i + 1) % n.length], s = r.indexOf(o);
		if (s < 0 || r[(s + 1) % r.length] !== a) continue;
		let c = rotated(n, o), l = rotated(r, a), u = [...c, ...l.slice(1, l.length - 1)];
		if (u.length > require_world2d.world2dLimits.polygonVertices) return;
		let at = (e) => u[(e + u.length) % u.length];
		for (let t of [a, o]) {
			let n = u.indexOf(t);
			if (cross(e[at(n - 1)], e[at(n)], e[at(n + 1)]) < -1e-9) return;
		}
		return u;
	}
}
function decomposeConvex(e) {
	let t = normalized(e), n = earClip(t), r = !0;
	for (; r;) {
		r = !1;
		outer: for (let e = 0; e < n.length; e++) for (let i = e + 1; i < n.length; i++) {
			let a = mergeAcross(t, n[e], n[i]);
			if (a) {
				n = n.filter((t, n) => n !== e && n !== i), n.push(a), r = !0;
				break outer;
			}
		}
	}
	return n.map((e) => e.filter((n, r) => {
		let i = e[(r + e.length - 1) % e.length], a = e[(r + 1) % e.length];
		return Math.abs(cross(t[i], t[n], t[a])) > c;
	}).map((e) => [t[e][0], t[e][1]]));
}
function staticPiece(t, n) {
	n.category !== void 0 && (t.category = n.category), n.mask !== void 0 && (t.mask = n.mask);
	let r = new require_game_object.GameObject();
	return r.collider = t, r.body = new require_body.RigidBody2D({
		type: `static`,
		friction: n.friction,
		restitution: n.restitution
	}), r;
}
var StaticConcave2D = class extends require_game_object.GameObject {
	pieces;
	constructor(e, t = {}) {
		super(), this.pieces = decomposeConvex(e).map((e) => this.add(staticPiece(require_collider.Colliders.polygon(e), t)));
	}
};
var Compound2D = class extends require_game_object.GameObject {
	pieces;
	centerOfMass;
	area;
	constructor(e, r = {}) {
		if (super(), e.length < 1 || e.length > require_world2d.world2dLimits.compoundPieces) throw RangeError(`Compound bodies require 1–256 convex pieces.`);
		if (r.ccd) throw RangeError(`Compound CCD is unsupported.`);
		let i = 0, c = 0, l = 0;
		for (let t of e) {
			if (!(t instanceof require_collider.Collider2D) || t.kind !== `polygon`) throw RangeError(`Compound pieces must be convex polygon colliders.`);
			let e = 0, r = 0, a = 0;
			for (let n = 0; n < t.vertices.length; n++) {
				let i = t.vertices[n], o = t.vertices[(n + 1) % t.vertices.length], s = i[0] * o[1] - i[1] * o[0];
				e += s, r += (i[0] + o[0]) * s, a += (i[1] + o[1]) * s;
			}
			let o = e / 2;
			i += o, c += o * (r / (3 * e) + t.offset.x), l += o * (a / (3 * e) + t.offset.y);
		}
		this.area = require_collider.positive(i, `compound area`);
		let u = c / i, d = l / i;
		this.centerOfMass = Object.freeze(new require_index.Vector2(u, d)), this.pieces = Object.freeze(e.map((e) => {
			let t = new require_collider.Collider2D(`polygon`, 0, e.vertices, { offset: [e.offset.x - u, e.offset.y - d] });
			return t.category = r.category ?? e.category, t.mask = r.mask ?? e.mask, t.sensor = r.sensor ?? e.sensor, t;
		})), this.position.set(u, d), this.collider = this.pieces[0], this.body = new require_body.RigidBody2D({
			...r,
			type: `dynamic`
		});
	}
	get colliderPieces() {
		return this.pieces;
	}
	get collider() {
		return super.collider;
	}
	set collider(e) {
		if (e && e !== this.pieces[0]) throw RangeError(`Compound collider must be its first piece, or undefined.`);
		super.collider = e;
	}
};
var DynamicConcave2D = class extends Compound2D {
	constructor(e, t = {}) {
		super(decomposeConvex(e).map((e) => require_collider.Colliders.polygon(e)), t);
	}
};
var StaticChain2D = class extends require_game_object.GameObject {
	segments;
	constructor(e, t = {}) {
		super();
		let n = require_collider.positive(t.thickness ?? 2, `thickness`);
		if (e.length < 2 || e.length > 256) throw RangeError(`Chains require 2–256 points.`);
		let i = t.closed ? e.length : e.length - 1;
		if (t.closed && e.length < 3) throw RangeError(`Closed chains require at least 3 points.`);
		let o = n / 2, s = [];
		for (let n = 0; n < i; n++) {
			let i = e[n], a = e[(n + 1) % e.length], l = Math.hypot(a[0] - i[0], a[1] - i[1]);
			if (!(l > c)) throw RangeError(`Chain points must be distinct.`);
			let u = (a[0] - i[0]) / l * o, d = (a[1] - i[1]) / l * o, f = [
				[i[0] - u + d, i[1] - d - u],
				[a[0] + u + d, a[1] + d - u],
				[a[0] + u - d, a[1] + d + u],
				[i[0] - u - d, i[1] - d + u]
			];
			signedArea(f) < 0 && f.reverse(), s.push(this.add(staticPiece(require_collider.Colliders.polygon(f), t)));
		}
		this.segments = s;
	}
};
//#endregion
exports.Compound2D = Compound2D;
exports.DynamicConcave2D = DynamicConcave2D;
exports.StaticChain2D = StaticChain2D;
exports.StaticConcave2D = StaticConcave2D;
exports.decomposeConvex = decomposeConvex;
exports.maxConcaveVertices = maxConcaveVertices;

//# sourceMappingURL=shapes.cjs.map