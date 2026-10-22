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
var i = /* @__PURE__ */ new Float64Array(4);
function axis(e, t, a, o, s) {
	let c = require_hypot.hypot2(a, o);
	return c <= r || (i[0] = a / c, i[1] = o / c, unitAxis(e, t, s));
}
function unitAxis(e, t, n) {
	let a = i[0], o = i[1], s = 1 / 0, c = -1 / 0, l = 1 / 0, u = -1 / 0;
	if (e.collider.kind === `circle`) {
		let t = e.x * a + e.y * o;
		s = t - e.radius, c = t + e.radius;
	} else for (let t = 0; t < e.points.length; t += 2) {
		let n = e.points[t] * a + e.points[t + 1] * o;
		s = Math.min(s, n), c = Math.max(c, n);
	}
	if (t.collider.kind === `circle`) {
		let e = t.x * a + t.y * o;
		l = e - t.radius, u = e + t.radius;
	} else for (let e = 0; e < t.points.length; e += 2) {
		let n = t.points[e] * a + t.points[e + 1] * o;
		l = Math.min(l, n), u = Math.max(u, n);
	}
	let d = c - l, f = u - s;
	if (d < -r || f < -r) return !1;
	let p = Math.min(d, f);
	if (p < n.penetration) {
		n.penetration = Math.max(0, p);
		let e = d <= f ? 1 : -1;
		n.nx = a * e, n.ny = o * e;
	}
	return !0;
}
function polygonAxes(e, t, n, a) {
	let o = e.edgeData();
	for (let e = 0; e < o.length; e += 3) if (!(o[e + 2] <= r) && (i[0] = o[e], i[1] = o[e + 1], !unitAxis(t, n, a))) return !1;
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
function bestEdge(e) {
	let t = i[2], n = i[3], r = -1 / 0, a = 0, o = e.points, s = e.edgeData();
	for (let e = 0; e < o.length; e += 2) {
		let i = (e + 2) % o.length, c = o[i] - o[e], l = o[i + 1] - o[e + 1], u = s[(e >> 1) * 3 + 2], d = (l * t - c * n) / u;
		d > r && (r = d, a = e);
	}
	return a;
}
function clipSegment(e) {
	let t = i[0], n = i[1], a = i[2], o = e[0] * t + e[1] * n - a, s = e[2] * t + e[3] * n - a;
	if (o > r && s > r) return !1;
	if (o > r != s > r) {
		let t = o / (o - s), n = e[0] + t * (e[2] - e[0]), i = e[1] + t * (e[3] - e[1]);
		o > r ? (e[0] = n, e[1] = i) : (e[2] = n, e[3] = i);
	}
	return !0;
}
function polygonContacts(e, t, a) {
	i[2] = a.nx, i[3] = a.ny;
	let o = bestEdge(e);
	i[2] = -a.nx, i[3] = -a.ny;
	let s = bestEdge(t), c = e.points, l = t.points, u = (o + 2) % c.length, d = (s + 2) % l.length, f = c[u] - c[o], p = c[u + 1] - c[o + 1], m = l[d] - l[s], h = l[d + 1] - l[s + 1], g = (p * a.nx - f * a.ny) / e.edgeData()[(o >> 1) * 3 + 2] >= (-h * a.nx + m * a.ny) / t.edgeData()[(s >> 1) * 3 + 2] ? e : t, _ = g === e ? t : e, v = g === e ? o : s, y = g === e ? 1 : -1, b = a.nx * y, x = a.ny * y, S = g.points, C = (v + 2) % S.length, w = S[C] - S[v], T = S[C + 1] - S[v + 1], E = g.edgeData()[(v >> 1) * 3 + 2], D = w / E, O = T / E;
	i[2] = -b, i[3] = -x;
	let k = bestEdge(_), A = (k + 2) % _.points.length, j = a.clip;
	if (j[0] = _.points[k], j[1] = _.points[k + 1], j[2] = _.points[A], j[3] = _.points[A + 1], i[0] = -D, i[1] = -O, i[2] = -D * S[v] - O * S[v + 1], !clipSegment(j) || (i[0] = D, i[1] = O, i[2] = D * S[C] + O * S[C + 1], !clipSegment(j))) return;
	let M = b * S[v] + x * S[v + 1];
	for (let e = 0; e < 4; e += 2) {
		let t = b * j[e] + x * j[e + 1] - M;
		if (t <= r) {
			if (a.count && require_hypot.hypot2(j[e] - j[0], j[e + 1] - j[1]) <= r) continue;
			a.points[a.count++].set(j[e] - b * t / 2, j[e + 1] - x * t / 2);
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