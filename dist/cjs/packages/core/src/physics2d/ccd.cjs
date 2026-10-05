const require_world2d = require("../../../../src/data/world2d.cjs");
const require_collider = require("./collider.cjs");
const require_narrowphase = require("./narrowphase.cjs");
//#region dist/packages/core/src/physics2d/ccd.js
var ShapeMotion2D = class {
	geometry;
	sample;
	x = 0;
	y = 0;
	vx = 0;
	vy = 0;
	spin = 0;
	radius = 0;
	constructor(e) {
		this.geometry = e, this.sample = new require_collider.ShapeGeometry(e.collider);
	}
	set(e, t) {
		let n = t && t.type !== `static` && !t.isSleeping;
		this.setExplicit(e.position.x, e.position.y, n ? t.velocity.x : 0, n ? t.velocity.y : 0, n && !t.lockRotation ? t.angularVelocity : 0);
	}
	setExplicit(e, t, n, r, i = 0) {
		this.x = e, this.y = t, this.vx = n, this.vy = r, this.spin = i;
		let a = this.geometry;
		this.radius = a.collider.kind === `circle` ? Math.hypot(a.x - e, a.y - t) : Math.hypot(Math.max(Math.abs(a.minX - e), Math.abs(a.maxX - e)), Math.max(Math.abs(a.minY - t), Math.abs(a.maxY - t)));
	}
	at(e) {
		if (e === 0) return this.geometry;
		let t = this.geometry, n = this.sample, r = Math.cos(this.spin * e), i = Math.sin(this.spin * e), a = this.x + this.vx * e, o = this.y + this.vy * e;
		if (n.x = a + r * (t.x - this.x) - i * (t.y - this.y), n.y = o + i * (t.x - this.x) + r * (t.y - this.y), n.radius = t.radius, t.collider.kind === `circle`) n.minX = n.x - t.radius, n.maxX = n.x + t.radius, n.minY = n.y - t.radius, n.maxY = n.y + t.radius;
		else {
			n.minX = n.minY = 1 / 0, n.maxX = n.maxY = -1 / 0;
			for (let e = 0; e < t.points.length; e += 2) {
				let s = t.points[e] - this.x, c = t.points[e + 1] - this.y, l = a + r * s - i * c, u = o + i * s + r * c;
				n.points[e] = l, n.points[e + 1] = u, n.minX = Math.min(n.minX, l), n.maxX = Math.max(n.maxX, l), n.minY = Math.min(n.minY, u), n.maxY = Math.max(n.maxY, u);
			}
		}
		return n;
	}
};
var ShapeSeparation2D = class {
	distance = -1 / 0;
	manifold = new require_narrowphase.Manifold();
	axis(e, t, n, r) {
		let i = Math.hypot(n, r);
		if (i < 1e-12) return;
		n /= i, r /= i;
		let a = 1 / 0, o = -1 / 0, s = 1 / 0, c = -1 / 0;
		if (e.collider.kind === `circle`) {
			let t = e.x * n + e.y * r;
			a = t - e.radius, o = t + e.radius;
		} else for (let t = 0; t < e.points.length; t += 2) {
			let i = e.points[t] * n + e.points[t + 1] * r;
			a = Math.min(a, i), o = Math.max(o, i);
		}
		if (t.collider.kind === `circle`) {
			let e = t.x * n + t.y * r;
			s = e - t.radius, c = e + t.radius;
		} else for (let e = 0; e < t.points.length; e += 2) {
			let i = t.points[e] * n + t.points[e + 1] * r;
			s = Math.min(s, i), c = Math.max(c, i);
		}
		let l = s - o, u = a - c, d = Math.max(l, u);
		if (d > this.distance) {
			this.distance = d;
			let e = l >= u ? 1 : -1;
			this.manifold.nx = n * e, this.manifold.ny = r * e;
		}
	}
	measure(e, t) {
		this.distance = -1 / 0;
		for (let n = 0; n < 2; n++) {
			let r = (n === 0 ? e : t).points;
			for (let n = 0; n < r.length; n += 2) {
				let i = (n + 2) % r.length;
				this.axis(e, t, r[i + 1] - r[n + 1], r[n] - r[i]);
			}
		}
		if (e.collider.kind === `circle` && t.collider.kind === `circle`) this.axis(e, t, t.x - e.x, t.y - e.y);
		else if (e.collider.kind === `circle` || t.collider.kind === `circle`) {
			let n = e.collider.kind === `circle` ? e : t, r = n === e ? t : e, i = 1 / 0, a = 1, o = 0;
			for (let e = 0; e < r.points.length; e += 2) {
				let t = r.points[e] - n.x, s = r.points[e + 1] - n.y, c = t * t + s * s;
				c < i && (i = c, a = t, o = s);
			}
			this.axis(e, t, a, o);
		}
		return this.distance === -1 / 0 && this.axis(e, t, 1, 0), this.contact(e, t), this.distance;
	}
	contact(e, t) {
		let r = this.manifold;
		if (this.distance <= 0 && require_narrowphase.collide(e, t, r)) return;
		let i = r.nx, a = r.ny, o = -a, s = i, c = -1 / 0, l = 1 / 0;
		if (e.collider.kind === `circle`) c = e.x * i + e.y * a + e.radius;
		else for (let t = 0; t < e.points.length; t += 2) c = Math.max(c, e.points[t] * i + e.points[t + 1] * a);
		if (t.collider.kind === `circle`) l = t.x * i + t.y * a - t.radius;
		else for (let e = 0; e < t.points.length; e += 2) l = Math.min(l, t.points[e] * i + t.points[e + 1] * a);
		let u = 1 / 0, d = -1 / 0, f = 1 / 0, p = -1 / 0;
		if (e.collider.kind === `circle`) u = d = e.x * o + e.y * s;
		else for (let t = 0; t < e.points.length; t += 2) {
			if (Math.abs(e.points[t] * i + e.points[t + 1] * a - c) > 1e-7) continue;
			let n = e.points[t] * o + e.points[t + 1] * s;
			u = Math.min(u, n), d = Math.max(d, n);
		}
		if (t.collider.kind === `circle`) f = p = t.x * o + t.y * s;
		else for (let e = 0; e < t.points.length; e += 2) {
			if (Math.abs(t.points[e] * i + t.points[e + 1] * a - l) > 1e-7) continue;
			let n = t.points[e] * o + t.points[e + 1] * s;
			f = Math.min(f, n), p = Math.max(p, n);
		}
		let m = Math.max(u, f), h = Math.min(d, p), g = m <= h ? (m + h) / 2 : (Math.min(d, p) + Math.max(u, f)) / 2, _ = (c + l) / 2;
		r.count = 1, r.penetration = Math.max(0, -this.distance), r.points[0].set(i * _ + o * g, a * _ + s * g);
	}
};
var ContinuousCollision2D = class {
	separation = new ShapeSeparation2D();
	get manifold() {
		return this.separation.manifold;
	}
	iterations = 0;
	exhausted = !1;
	safeTime = 1 / 0;
	overlaps(t, n, r) {
		let i = t.geometry, a = n.geometry, o = Math.min(2 * t.radius, Math.abs(t.spin) * t.radius * r), s = Math.min(2 * n.radius, Math.abs(n.spin) * n.radius * r), c = require_world2d.physicsDefaults.sweepTolerance;
		return i.minX + Math.min(0, t.vx * r) - o <= a.maxX + Math.max(0, n.vx * r) + s + c && i.maxX + Math.max(0, t.vx * r) + o + c >= a.minX + Math.min(0, n.vx * r) - s && i.minY + Math.min(0, t.vy * r) - o <= a.maxY + Math.max(0, n.vy * r) + s + c && i.maxY + Math.max(0, t.vy * r) + o + c >= a.minY + Math.min(0, n.vy * r) - s;
	}
	timeOfImpact(t, n, r, i, a = require_world2d.physicsDefaults.sweepTolerance) {
		if (this.iterations = 0, this.exhausted = !1, this.safeTime = 1 / 0, !this.overlaps(t, n, r)) return 1 / 0;
		let o = t.vx - n.vx, s = t.vy - n.vy, c = Math.abs(t.spin) * t.radius + Math.abs(n.spin) * n.radius;
		if (Math.hypot(o, s) + c < 1e-12) return 1 / 0;
		let l = 0;
		for (; this.iterations < i;) {
			this.iterations++;
			let e = this.separation.measure(t.at(l), n.at(l)), i = this.manifold, u = o * i.nx + s * i.ny + c;
			if (e <= a) {
				let e = i.points[0], r = (n.vx - n.spin * (e.y - n.y - n.vy * l) - t.vx + t.spin * (e.y - t.y - t.vy * l)) * i.nx + (n.vy + n.spin * (e.x - n.x - n.vx * l) - t.vy - t.spin * (e.x - t.x - t.vx * l)) * i.ny;
				return l > 0 || r < -1e-8 ? l : c <= 1e-12 || u <= 1e-12 ? 1 / 0 : (this.exhausted = !0, this.safeTime = l, 1 / 0);
			}
			if (u <= 1e-12) return 1 / 0;
			let d = (e - a * .5) / u;
			if (l + d > r) return 1 / 0;
			l += d;
		}
		return this.exhausted = !0, this.safeTime = l, 1 / 0;
	}
};
//#endregion
exports.ContinuousCollision2D = ContinuousCollision2D;
exports.ShapeMotion2D = ShapeMotion2D;
exports.ShapeSeparation2D = ShapeSeparation2D;

//# sourceMappingURL=ccd.cjs.map