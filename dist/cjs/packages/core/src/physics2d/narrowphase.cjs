const require_hypot = require("../../../math/src/hypot.cjs");
const require_index = require("../../../math/src/index.cjs");
//#region dist/packages/core/src/physics2d/narrowphase.js
var r = require("../../../../src/data/world2d.cjs").physicsDefaults.geometryEpsilon;
var Manifold = class {
	nx = 1;
	ny = 0;
	penetration = 0;
	count = 0;
	points = [new require_index.Vector2(), new require_index.Vector2()];
	normalImpulses = /* @__PURE__ */ new Float64Array(2);
	tangentImpulses = /* @__PURE__ */ new Float64Array(2);
	bounceVelocities = /* @__PURE__ */ new Float64Array(2);
	clip = /* @__PURE__ */ new Float64Array(4);
};
function axis(e, t, i, a, o) {
	let s = require_hypot.hypot2(i, a);
	return s <= r || unitAxis(e, t, i / s, a / s, o);
}
function unitAxis(e, t, n, i, a) {
	let o = 1 / 0, s = -1 / 0, c = 1 / 0, l = -1 / 0;
	if (e.collider.kind === `circle`) {
		let t = e.x * n + e.y * i;
		o = t - e.radius, s = t + e.radius;
	} else for (let t = 0; t < e.points.length; t += 2) {
		let r = e.points[t] * n + e.points[t + 1] * i;
		o = Math.min(o, r), s = Math.max(s, r);
	}
	if (t.collider.kind === `circle`) {
		let e = t.x * n + t.y * i;
		c = e - t.radius, l = e + t.radius;
	} else for (let e = 0; e < t.points.length; e += 2) {
		let r = t.points[e] * n + t.points[e + 1] * i;
		c = Math.min(c, r), l = Math.max(l, r);
	}
	let u = s - c, d = l - o;
	if (u < -r || d < -r) return !1;
	let f = Math.min(u, d);
	if (f < a.penetration) {
		a.penetration = Math.max(0, f);
		let e = u <= d ? 1 : -1;
		a.nx = n * e, a.ny = i * e;
	}
	return !0;
}
function polygonAxes(e, t, n, i) {
	let a = e.edgeData();
	for (let e = 0; e < a.length; e += 3) if (!(a[e + 2] <= r) && !unitAxis(t, n, a[e], a[e + 1], i)) return !1;
	return !0;
}
function closestVertexAxis(e, t, n, r, i) {
	let a = 1 / 0, o = 0, s = 0;
	for (let n = 0; n < t.points.length; n += 2) {
		let r = t.points[n] - e.x, i = t.points[n + 1] - e.y, c = r * r + i * i;
		c < a && (a = c, o = r, s = i);
	}
	return axis(n, r, o, s, i);
}
function bestEdge(e, t, n) {
	let r = -1 / 0, i = 0, a = e.points, o = e.edgeData();
	for (let e = 0; e < a.length; e += 2) {
		let s = (e + 2) % a.length, c = a[s] - a[e], l = a[s + 1] - a[e + 1], u = o[(e >> 1) * 3 + 2], d = (l * t - c * n) / u;
		d > r && (r = d, i = e);
	}
	return i;
}
function clipSegment(e, t, n, i) {
	let a = e[0] * t + e[1] * n - i, o = e[2] * t + e[3] * n - i;
	if (a > r && o > r) return !1;
	if (a > r != o > r) {
		let t = a / (a - o), n = e[0] + t * (e[2] - e[0]), i = e[1] + t * (e[3] - e[1]);
		a > r ? (e[0] = n, e[1] = i) : (e[2] = n, e[3] = i);
	}
	return !0;
}
function polygonContacts(e, t, i) {
	let a = bestEdge(e, i.nx, i.ny), o = bestEdge(t, -i.nx, -i.ny), s = e.points, c = t.points, l = (a + 2) % s.length, u = (o + 2) % c.length, d = s[l] - s[a], f = s[l + 1] - s[a + 1], p = c[u] - c[o], m = c[u + 1] - c[o + 1], h = (f * i.nx - d * i.ny) / e.edgeData()[(a >> 1) * 3 + 2] >= (-m * i.nx + p * i.ny) / t.edgeData()[(o >> 1) * 3 + 2] ? e : t, g = h === e ? t : e, _ = h === e ? a : o, v = h === e ? 1 : -1, y = i.nx * v, b = i.ny * v, x = h.points, S = (_ + 2) % x.length, C = x[S] - x[_], w = x[S + 1] - x[_ + 1], T = h.edgeData()[(_ >> 1) * 3 + 2], E = C / T, D = w / T, O = bestEdge(g, -y, -b), k = (O + 2) % g.points.length, A = i.clip;
	if (A[0] = g.points[O], A[1] = g.points[O + 1], A[2] = g.points[k], A[3] = g.points[k + 1], !clipSegment(A, -E, -D, -E * x[_] - D * x[_ + 1]) || !clipSegment(A, E, D, E * x[S] + D * x[S + 1])) return;
	let j = y * x[_] + b * x[_ + 1];
	for (let e = 0; e < 4; e += 2) {
		let t = y * A[e] + b * A[e + 1] - j;
		if (t <= r) {
			if (i.count && require_hypot.hypot2(A[e] - A[0], A[e + 1] - A[1]) <= r) continue;
			i.points[i.count++].set(A[e] - y * t / 2, A[e + 1] - b * t / 2);
		}
	}
}
function collide(e, t, i) {
	if (i.count = 0, i.penetration = 1 / 0, e.maxX < t.minX || t.maxX < e.minX || e.maxY < t.minY || t.maxY < e.minY) return !1;
	let a = e.collider.kind === `circle`, o = t.collider.kind === `circle`;
	if (a && o) {
		let a = t.x - e.x, o = t.y - e.y, s = require_hypot.hypot2(a, o), c = e.radius + t.radius;
		return s > c ? !1 : (i.nx = s > r ? a / s : 1, i.ny = s > r ? o / s : 0, i.penetration = c - s, i.points[0].set(e.x + i.nx * (e.radius - i.penetration / 2), e.y + i.ny * (e.radius - i.penetration / 2)), i.count = 1, !0);
	}
	if (!a && !polygonAxes(e, e, t, i) || !o && !polygonAxes(t, e, t, i) || a && !closestVertexAxis(e, t, e, t, i) || o && !closestVertexAxis(t, e, e, t, i)) return !1;
	if (!a && !o) polygonContacts(e, t, i);
	else {
		let n = a ? e : t, r = a ? 1 : -1;
		i.points[0].set(n.x + r * i.nx * (n.radius - i.penetration / 2), n.y + r * i.ny * (n.radius - i.penetration / 2)), i.count = 1;
	}
	return i.count > 0;
}
function rayMissesBounds(e, t, n, i, a, o) {
	let s = e.rayAmplification();
	if (!(s <= 1e6)) return !1;
	let c = Math.abs(t - (e.minX + e.maxX) / 2) + Math.abs(n - (e.minY + e.maxY) / 2) + (e.maxX - e.minX) + (e.maxY - e.minY), l = 4 * s * (e.rayEdgeTolerance + o * r) + 1e-6 * (1 + o + c), u = e.minX - l, d = e.maxX + l, f = e.minY - l, p = e.maxY + l, m = 0, h = o;
	if (i === 0) {
		if (t < u || t > d) return !0;
	} else {
		let e = (u - t) / i, n = (d - t) / i;
		m = Math.max(m, Math.min(e, n)), h = Math.min(h, Math.max(e, n));
	}
	if (a === 0) {
		if (n < f || n > p) return !0;
	} else {
		let e = (f - n) / a, t = (p - n) / a;
		m = Math.max(m, Math.min(e, t)), h = Math.min(h, Math.max(e, t));
	}
	return m > h;
}
function rayDistance(e, t, n, i, a, o, s) {
	if (e.contains(t, n)) return s.set(-i, -a), 0;
	if (e.collider.kind === `circle`) {
		let r = t - e.x, c = n - e.y, l = r * i + c * a, u = r * r + c * c - e.radius * e.radius, d = l * l - u;
		if (d < 0) return;
		let f = -l - Math.sqrt(d);
		return f < 0 || f > o ? void 0 : (s.set((t + f * i - e.x) / e.radius, (n + f * a - e.y) / e.radius), f);
	}
	let c = 0, l = o, u = 0, d = 0, f = e.points, p = e.edgeData();
	for (let e = 0; e < f.length; e += 2) {
		let o = p[(e >> 1) * 3], s = p[(e >> 1) * 3 + 1], m = o * (f[e] - t) + s * (f[e + 1] - n), h = o * i + s * a;
		if (Math.abs(h) <= r) {
			if (m < 0) return;
			continue;
		}
		let g = m / h;
		if (h < 0 && g > c ? (c = g, u = o, d = s) : h > 0 && (l = Math.min(l, g)), c > l) return;
	}
	if (!(c < 0 || c > o)) return s.set(u, d), c;
}
//#endregion
exports.Manifold = Manifold;
exports.collide = collide;
exports.rayDistance = rayDistance;
exports.rayMissesBounds = rayMissesBounds;

//# sourceMappingURL=narrowphase.cjs.map