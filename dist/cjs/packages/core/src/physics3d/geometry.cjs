const require_math3d = require("../../../math/src/math3d.cjs");
const require_physics3d = require("../../../../src/data/physics3d.cjs");
//#region dist/packages/core/src/physics3d/geometry.js
var Manifold3D = class {
	normal = new require_math3d.Vector3();
	points = Array.from({ length: 8 }, () => new require_math3d.Vector3());
	normals = Array.from({ length: 8 }, () => new require_math3d.Vector3());
	depths = /* @__PURE__ */ new Float64Array(8);
	count = 0;
	distance = 1 / 0;
	add(e, t, n = this.normal) {
		let r = this.count;
		if (r === 8) {
			r = 0;
			for (let e = 1; e < 8; e++) this.depths[e] < this.depths[r] && (r = e);
			if (t <= this.depths[r]) return;
		} else this.count++;
		this.points[r].set(e.x, e.y, e.z), this.normals[r].set(n.x, n.y, n.z), this.depths[r] = t;
	}
	flip() {
		this.normal.scale(-1);
		for (let e = 0; e < this.count; e++) this.normals[e].scale(-1);
	}
};
var clamp = (e, t, n) => Math.max(t, Math.min(n, e));
function cross(e, t, n) {
	return n.set(e.y * t.z - e.z * t.y, e.z * t.x - e.x * t.z, e.x * t.y - e.y * t.x);
}
var Narrowphase3D = class {
	p = new require_math3d.Vector3();
	q = new require_math3d.Vector3();
	axis = new require_math3d.Vector3();
	local = /* @__PURE__ */ new Float64Array(3);
	delta = /* @__PURE__ */ new Float64Array(3);
	half = /* @__PURE__ */ new Float64Array(3);
	breaks = /* @__PURE__ */ new Float64Array(8);
	polygonA = Array.from({ length: 16 }, () => new require_math3d.Vector3());
	polygonB = Array.from({ length: 16 }, () => new require_math3d.Vector3());
	edgeA0 = new require_math3d.Vector3();
	edgeA1 = new require_math3d.Vector3();
	edgeB0 = new require_math3d.Vector3();
	edgeB1 = new require_math3d.Vector3();
	triangleCandidates = [];
	triangleManifold = new Manifold3D();
	childManifold = new Manifold3D();
	closest = new require_math3d.Vector3();
	bestP = new require_math3d.Vector3();
	bestQ = new require_math3d.Vector3();
	triangleEdge = new require_math3d.Vector3();
	pointTriangle(e, t, n) {
		let r = t.a, i = t.b, a = t.c, o = i.x - r.x, s = i.y - r.y, c = i.z - r.z, l = a.x - r.x, u = a.y - r.y, d = a.z - r.z, f = e.x - r.x, p = e.y - r.y, m = e.z - r.z, h = o * f + s * p + c * m, g = l * f + u * p + d * m;
		if (h <= 0 && g <= 0) {
			n.copy(r);
			return;
		}
		let _ = e.x - i.x, v = e.y - i.y, y = e.z - i.z, b = o * _ + s * v + c * y, x = l * _ + u * v + d * y;
		if (b >= 0 && x <= b) {
			n.copy(i);
			return;
		}
		let S = h * x - b * g;
		if (S <= 0 && h >= 0 && b <= 0) {
			let e = h / (h - b);
			n.set(r.x + o * e, r.y + s * e, r.z + c * e);
			return;
		}
		let C = e.x - a.x, w = e.y - a.y, T = e.z - a.z, E = o * C + s * w + c * T, D = l * C + u * w + d * T;
		if (D >= 0 && E <= D) {
			n.copy(a);
			return;
		}
		let O = E * g - h * D;
		if (O <= 0 && g >= 0 && D <= 0) {
			let e = g / (g - D);
			n.set(r.x + l * e, r.y + u * e, r.z + d * e);
			return;
		}
		let k = b * D - E * x;
		if (k <= 0 && x - b >= 0 && E - D >= 0) {
			let e = (x - b) / (x - b + (E - D));
			n.set(i.x + (a.x - i.x) * e, i.y + (a.y - i.y) * e, i.z + (a.z - i.z) * e);
			return;
		}
		let A = 1 / (k + O + S), j = O * A, M = S * A;
		n.set(r.x + o * j + l * M, r.y + s * j + u * M, r.z + c * j + d * M);
	}
	roundTriangle(e, t, n) {
		let r = 1 / 0;
		for (let n = 0; n < 2; n++) {
			let i = n === 0 ? e.start : e.end;
			this.pointTriangle(i, t, this.closest);
			let a = i.x - this.closest.x, o = i.y - this.closest.y, s = i.z - this.closest.z, c = a * a + o * o + s * s;
			c < r && (r = c, this.bestP.copy(i), this.bestQ.copy(this.closest));
		}
		for (let n = 0; n < 3; n++) {
			let i = n === 0 ? t.a : n === 1 ? t.b : t.c, a = n === 0 ? t.b : n === 1 ? t.c : t.a;
			this.segment(e.start, e.end, i, a, this.p, this.q);
			let o = this.p.x - this.q.x, s = this.p.y - this.q.y, c = this.p.z - this.q.z, l = o * o + s * s + c * c;
			l < r && (r = l, this.bestP.copy(this.p), this.bestQ.copy(this.q));
		}
		let i = t.normal, a = (e.start.x - t.a.x) * i.x + (e.start.y - t.a.y) * i.y + (e.start.z - t.a.z) * i.z, o = (e.end.x - t.a.x) * i.x + (e.end.y - t.a.y) * i.y + (e.end.z - t.a.z) * i.z;
		if (a * o <= 0 && Math.abs(a - o) > 1e-16) {
			let n = a / (a - o);
			this.p.set(e.start.x + (e.end.x - e.start.x) * n, e.start.y + (e.end.y - e.start.y) * n, e.start.z + (e.end.z - e.start.z) * n), this.pointTriangle(this.p, t, this.q);
			let i = this.p.x - this.q.x, s = this.p.y - this.q.y, c = this.p.z - this.q.z;
			i * i + s * s + c * c < 1e-18 && (r = 0, this.bestP.copy(this.p), this.bestQ.copy(this.q));
		}
		let s = Math.sqrt(r);
		if (s > 1e-10) n.normal.set((this.bestP.x - this.bestQ.x) / s, (this.bestP.y - this.bestQ.y) / s, (this.bestP.z - this.bestQ.z) / s);
		else {
			let r = (e.center.x - t.a.x) * i.x + (e.center.y - t.a.y) * i.y + (e.center.z - t.a.z) * i.z;
			n.normal.copy(i).scale(r >= 0 ? 1 : -1);
		}
		if (n.distance = s - e.radius, r === 0 && a * o < 0) {
			let t = n.normal.dot(i) >= 0 ? 1 : -1;
			n.distance = Math.min(a * t, o * t) - e.radius;
		}
		n.add(this.bestQ, -n.distance);
	}
	boxTriangle(e, t, n) {
		let r = -1 / 0;
		for (let i = 0; i < 13; i++) {
			let a;
			if (i === 0) a = t.normal;
			else if (i < 4) a = e.axes[i - 1];
			else {
				let n = Math.floor((i - 4) / 3), r = n === 0 ? t.a : n === 1 ? t.b : t.c, o = n === 0 ? t.b : n === 1 ? t.c : t.a;
				this.triangleEdge.set(o.x - r.x, o.y - r.y, o.z - r.z), a = cross(this.triangleEdge, e.axes[(i - 4) % 3], this.axis);
			}
			let o = Math.hypot(a.x, a.y, a.z);
			if (o < 1e-10) continue;
			let s = e.center.dot(a), c = this.radius(e, a), l = t.a.dot(a), u = t.b.dot(a), d = t.c.dot(a), f = Math.min(l, u, d), p = Math.max(l, u, d), m = (s - c - p) / o, h = (f - s - c) / o, g = Math.max(m, h);
			g > r && (r = g, n.normal.set(a.x / o, a.y / o, a.z / o).scale(m >= h ? 1 : -1));
		}
		n.distance = r;
		let i = this.polygonA, a = this.polygonB, o = 3;
		i[0].copy(t.a), i[1].copy(t.b), i[2].copy(t.c);
		for (let t = 0; t < 3; t++) for (let n = -1; n <= 1; n += 2) {
			let r = e.axes[t], s = t === 0 ? e.half.x : t === 1 ? e.half.y : e.half.z, c = 0;
			for (let t = 0; t < o; t++) {
				let l = i[t], u = i[(t + 1) % o], d = n * ((l.x - e.center.x) * r.x + (l.y - e.center.y) * r.y + (l.z - e.center.z) * r.z) - s, f = n * ((u.x - e.center.x) * r.x + (u.y - e.center.y) * r.y + (u.z - e.center.z) * r.z) - s;
				if (d <= 1e-10 && a[c++].copy(l), d < 0 != f < 0) {
					let e = d / (d - f);
					a[c++].set(l.x + (u.x - l.x) * e, l.y + (u.y - l.y) * e, l.z + (u.z - l.z) * e);
				}
			}
			o = c;
			let l = i;
			i = a, a = l;
		}
		for (let e = 0; e < o; e++) n.add(i[e], -r);
		n.count === 0 && (this.pointTriangle(e.center, t, this.q), n.add(this.q, -r));
	}
	mesh(e, n, r) {
		n.triangleIndex.query(e.bounds, this.triangleCandidates, require_physics3d.physics3DDefaults.contactMargin);
		for (let i of this.triangleCandidates) {
			if (n.collider.sidedness === `front` && (e.center.x - i.a.x) * i.normal.x + (e.center.y - i.a.y) * i.normal.y + (e.center.z - i.a.z) * i.normal.z < -require_physics3d.physics3DDefaults.sweepTolerance) continue;
			let a = this.triangleManifold;
			if (a.count = 0, a.distance = 1 / 0, e.collider.kind === `box` ? this.boxTriangle(e, i, a) : this.roundTriangle(e, i, a), a.distance < r.distance && (r.distance > require_physics3d.physics3DDefaults.contactMargin && (r.count = 0), r.distance = a.distance, r.normal.copy(a.normal)), a.distance <= require_physics3d.physics3DDefaults.contactMargin || r.count === 0) for (let e = 0; e < a.count; e++) r.add(a.points[e], a.depths[e], a.normals[e]);
		}
	}
	triangle(e, t, n) {
		n.count = 0, n.distance = 1 / 0, e.collider.kind === `box` ? this.boxTriangle(e, t, n) : this.roundTriangle(e, t, n);
	}
	segment(e, t, n, r, i, a) {
		let o = t.x - e.x, s = t.y - e.y, c = t.z - e.z, l = r.x - n.x, u = r.y - n.y, d = r.z - n.z, f = e.x - n.x, p = e.y - n.y, m = e.z - n.z, h = o * o + s * s + c * c, g = o * l + s * u + c * d, _ = l * l + u * u + d * d, v = o * f + s * p + c * m, y = l * f + u * p + d * m, b = 0, x = 0;
		if (h < 1e-16) x = _ < 1e-16 ? 0 : clamp(y / _, 0, 1);
		else if (_ < 1e-16) b = clamp(-v / h, 0, 1);
		else {
			let e = h * _ - g * g;
			b = e > 1e-16 ? clamp((g * y - _ * v) / e, 0, 1) : 0, x = (g * b + y) / _, x < 0 ? (x = 0, b = clamp(-v / h, 0, 1)) : x > 1 && (x = 1, b = clamp((g - v) / h, 0, 1));
		}
		i.set(e.x + o * b, e.y + s * b, e.z + c * b), a.set(n.x + l * x, n.y + u * x, n.z + d * x);
	}
	segmentBox(e, t, n) {
		let r = this.local, i = this.delta, a = this.half, o = this.breaks, s = 2;
		o[0] = 0, o[1] = 1, a[0] = t.half.x, a[1] = t.half.y, a[2] = t.half.z;
		for (let n = 0; n < 3; n++) {
			let c = t.axes[n];
			if (r[n] = (e.start.x - t.center.x) * c.x + (e.start.y - t.center.y) * c.y + (e.start.z - t.center.z) * c.z, i[n] = (e.end.x - e.start.x) * c.x + (e.end.y - e.start.y) * c.y + (e.end.z - e.start.z) * c.z, Math.abs(i[n]) > 1e-16) for (let e = -1; e <= 1; e += 2) {
				let t = (e * a[n] - r[n]) / i[n];
				t > 0 && t < 1 && (o[s++] = t);
			}
		}
		for (let e = 1; e < s; e++) {
			let t = o[e], n = e;
			for (; n > 0 && o[n - 1] > t;) o[n] = o[n - 1], n--;
			o[n] = t;
		}
		let c = 1 / 0, l = 0;
		for (let e = 0; e < s - 1; e++) {
			let t = o[e], n = o[e + 1], s = (t + n) / 2, u = 0, d = 0;
			for (let e = 0; e < 3; e++) {
				let t = r[e] + i[e] * s;
				(t > a[e] || t < -a[e]) && (u += i[e] * i[e], d += i[e] * (r[e] - (t > 0 ? a[e] : -a[e])));
			}
			let f = u > 0 ? clamp(-d / u, t, n) : s, p = 0;
			for (let e = 0; e < 3; e++) {
				let t = r[e] + i[e] * f - clamp(r[e] + i[e] * f, -a[e], a[e]);
				p += t * t;
			}
			p < c && (c = p, l = f);
		}
		let u = this.p, d = this.q;
		u.set(e.start.x + (e.end.x - e.start.x) * l, e.start.y + (e.end.y - e.start.y) * l, e.start.z + (e.end.z - e.start.z) * l), d.copy(t.center);
		for (let e = 0; e < 3; e++) {
			let n = clamp(r[e] + i[e] * l, -a[e], a[e]), o = t.axes[e];
			d.x += o.x * n, d.y += o.y * n, d.z += o.z * n;
		}
		if (c > 1e-16) {
			let t = Math.sqrt(c);
			n.normal.set((u.x - d.x) / t, (u.y - d.y) / t, (u.z - d.z) / t), n.distance = t - e.radius;
		} else {
			let o = 1 / 0, s = 0, c = 1;
			for (let e = 0; e < 3; e++) {
				let t = Math.min(r[e], r[e] + i[e]), n = Math.max(r[e], r[e] + i[e]), l = a[e] - t, u = a[e] + n;
				l < o && (o = l, s = e, c = 1), u < o && (o = u, s = e, c = -1);
			}
			let l = t.axes[s];
			n.normal.set(l.x * c, l.y * c, l.z * c), n.distance = -o - e.radius;
			let f = i[s] * c > 0 ? 0 : 1;
			u.set(e.start.x + (e.end.x - e.start.x) * f, e.start.y + (e.end.y - e.start.y) * f, e.start.z + (e.end.z - e.start.z) * f), d.set(u.x + n.normal.x * o, u.y + n.normal.y * o, u.z + n.normal.z * o);
		}
		n.add(d, -n.distance);
	}
	roundRound(e, t, n) {
		this.segment(e.start, e.end, t.start, t.end, this.p, this.q);
		let r = this.p.x - this.q.x, i = this.p.y - this.q.y, a = this.p.z - this.q.z, o = Math.hypot(r, i, a);
		o > 1e-10 ? n.normal.set(r / o, i / o, a / o) : (n.normal.set(e.center.x - t.center.x, e.center.y - t.center.y, e.center.z - t.center.z), n.normal.length() < 1e-10 && n.normal.set(1, 0, 0), n.normal.normalize()), n.distance = o - e.radius - t.radius, this.q.x += n.normal.x * t.radius, this.q.y += n.normal.y * t.radius, this.q.z += n.normal.z * t.radius, n.add(this.q, -n.distance);
	}
	plane(e, t, n) {
		let r = t.normal, i = (e.center.x - t.center.x) * r.x + (e.center.y - t.center.y) * r.y + (e.center.z - t.center.z) * r.z >= 0 ? 1 : -1;
		n.normal.set(r.x * i, r.y * i, r.z * i), n.distance = 1 / 0;
		let a = e.collider.kind === `box` ? e.vertices : void 0, o = a ? 8 : e.start.x === e.end.x && e.start.y === e.end.y && e.start.z === e.end.z ? 1 : 2;
		for (let r = 0; r < o; r++) {
			let i = a ? a[r] : r === 0 ? e.start : e.end, o = (i.x - t.center.x) * n.normal.x + (i.y - t.center.y) * n.normal.y + (i.z - t.center.z) * n.normal.z - (a ? 0 : e.radius);
			n.distance = Math.min(n.distance, o);
		}
		for (let r = 0; r < o; r++) {
			let i = a ? a[r] : r === 0 ? e.start : e.end, o = (i.x - t.center.x) * n.normal.x + (i.y - t.center.y) * n.normal.y + (i.z - t.center.z) * n.normal.z - (a ? 0 : e.radius);
			o <= n.distance + .004 && (this.p.set(i.x - n.normal.x * (o + (a ? 0 : e.radius)), i.y - n.normal.y * (o + (a ? 0 : e.radius)), i.z - n.normal.z * (o + (a ? 0 : e.radius))), n.add(this.p, -o));
		}
	}
	radius(e, t) {
		return Math.abs(e.axes[0].dot(t)) * e.half.x + Math.abs(e.axes[1].dot(t)) * e.half.y + Math.abs(e.axes[2].dot(t)) * e.half.z;
	}
	face(e, t, n, r) {
		let i = (t + 1) % 3, a = (t + 2) % 3, o = e.axes[t], s = t === 0 ? e.half.x : t === 1 ? e.half.y : e.half.z, c = e.axes[i], l = e.axes[a], u = i === 0 ? e.half.x : i === 1 ? e.half.y : e.half.z, d = a === 0 ? e.half.x : a === 1 ? e.half.y : e.half.z;
		for (let t = 0; t < 4; t++) {
			let i = (t === 0 || t === 3 ? -1 : 1) * u, a = (t < 2 ? -1 : 1) * d;
			r[t].set(e.center.x + o.x * s * n + c.x * i + l.x * a, e.center.y + o.y * s * n + c.y * i + l.y * a, e.center.z + o.z * s * n + c.z * i + l.z * a);
		}
	}
	supportEdge(e, t, n, r, i) {
		r.copy(e.center);
		for (let i = 0; i < 3; i++) if (i !== t) {
			let t = e.axes[i], a = (i === 0 ? e.half.x : i === 1 ? e.half.y : e.half.z) * (t.dot(n) >= 0 ? 1 : -1);
			r.x += t.x * a, r.y += t.y * a, r.z += t.z * a;
		}
		i.copy(r);
		let a = e.axes[t], o = t === 0 ? e.half.x : t === 1 ? e.half.y : e.half.z;
		r.x -= a.x * o, r.y -= a.y * o, r.z -= a.z * o, i.x += a.x * o, i.y += a.y * o, i.z += a.z * o;
	}
	boxes(e, t, n) {
		let r = e.center.x - t.center.x, i = e.center.y - t.center.y, a = e.center.z - t.center.z, o = -1 / 0, s = 0, c = 0, l = 0;
		for (let u = 0; u < 15; u++) {
			let d = u < 3 ? e.axes[u] : u < 6 ? t.axes[u - 3] : cross(e.axes[Math.floor((u - 6) / 3)], t.axes[(u - 6) % 3], this.axis), f = d.length();
			if (f < 1e-8) continue;
			let p = (r * d.x + i * d.y + a * d.z) / f, m = Math.abs(p) - (this.radius(e, d) + this.radius(t, d)) / f;
			if (m > o) {
				o = m;
				let e = p >= 0 ? 1 : -1;
				n.normal.set(d.x / f * e, d.y / f * e, d.z / f * e), s = u, c = Math.floor((u - 6) / 3), l = (u - 6) % 3;
			}
		}
		if (n.distance = o, s >= 6) {
			this.axis.copy(n.normal).scale(-1), this.supportEdge(e, c, this.axis, this.edgeA0, this.edgeA1), this.supportEdge(t, l, n.normal, this.edgeB0, this.edgeB1), this.segment(this.edgeA0, this.edgeA1, this.edgeB0, this.edgeB1, this.p, this.q), this.p.add(this.q).scale(.5), n.add(this.p, -o);
			return;
		}
		let u = s < 3 ? e : t, d = s < 3 ? t : e, f = s < 3 ? s : s - 3;
		this.axis.copy(n.normal).scale(s < 3 ? -1 : 1);
		let p = this.axis, m = 0, h = 0;
		for (let e = 0; e < 3; e++) {
			let t = Math.abs(d.axes[e].dot(p));
			t > h && (h = t, m = e);
		}
		this.face(d, m, d.axes[m].dot(p) > 0 ? -1 : 1, this.polygonA);
		let g = this.polygonA, _ = this.polygonB, v = 4;
		for (let e = 0; e < 3; e++) if (e !== f) for (let t = -1; t <= 1; t += 2) {
			let n = u.axes[e], r = e === 0 ? u.half.x : e === 1 ? u.half.y : u.half.z, i = 0;
			for (let e = 0; e < v; e++) {
				let a = g[e], o = g[(e + 1) % v], s = t * ((a.x - u.center.x) * n.x + (a.y - u.center.y) * n.y + (a.z - u.center.z) * n.z) - r, c = t * ((o.x - u.center.x) * n.x + (o.y - u.center.y) * n.y + (o.z - u.center.z) * n.z) - r;
				if (s <= 1e-8 && _[i++].copy(a), s < 0 != c < 0) {
					let e = s / (s - c);
					_[i++].set(a.x + (o.x - a.x) * e, a.y + (o.y - a.y) * e, a.z + (o.z - a.z) * e);
				}
			}
			v = i;
			let a = g;
			g = _, _ = a;
		}
		let y = f === 0 ? u.half.x : f === 1 ? u.half.y : u.half.z;
		for (let e = 0; e < v; e++) {
			let t = g[e], r = (t.x - u.center.x) * p.x + (t.y - u.center.y) * p.y + (t.z - u.center.z) * p.z - y;
			r <= .004 && (this.p.set(t.x - p.x * r / 2, t.y - p.y * r / 2, t.z - p.z * r / 2), n.add(this.p, -r));
		}
		n.count === 0 && (this.p.set((e.center.x + t.center.x) / 2, (e.center.y + t.center.y) / 2, (e.center.z + t.center.z) / 2), n.add(this.p, -o));
	}
	collide(e, n, r) {
		r.count = 0, r.distance = 1 / 0;
		let i = e.collider.kind, a = n.collider.kind;
		if (i === `compound` || a === `compound`) {
			let o = i === `compound` ? e.children.length : 1, s = a === `compound` ? n.children.length : 1;
			for (let c = 0; c < o; c++) for (let o = 0; o < s; o++) {
				let s = i === `compound` ? e.children[c] : e, l = a === `compound` ? n.children[o] : n, u = this.childManifold;
				if (this.collide(s, l, u), u.distance < r.distance && (r.distance > require_physics3d.physics3DDefaults.contactMargin && (r.count = 0), r.distance = u.distance, r.normal.copy(u.normal)), u.distance <= require_physics3d.physics3DDefaults.contactMargin || r.count === 0) for (let e = 0; e < u.count; e++) r.add(u.points[e], u.depths[e], u.normals[e]);
			}
			return;
		}
		if ((i !== `mesh` || a !== `mesh`) && !(i === `mesh` && a === `plane` || i === `plane` && a === `mesh`)) {
			if (a === `mesh`) {
				this.mesh(e, n, r);
				return;
			}
			if (i === `mesh`) {
				this.mesh(n, e, r), r.flip();
				return;
			}
			(i !== `plane` || a !== `plane`) && (a === `plane` ? this.plane(e, n, r) : i === `plane` ? (this.plane(n, e, r), r.flip()) : i === `box` && a === `box` ? this.boxes(e, n, r) : a === `box` ? this.segmentBox(e, n, r) : i === `box` ? (this.segmentBox(n, e, r), r.flip()) : this.roundRound(e, n, r));
		}
	}
};
//#endregion
exports.Manifold3D = Manifold3D;
exports.Narrowphase3D = Narrowphase3D;

//# sourceMappingURL=geometry.cjs.map