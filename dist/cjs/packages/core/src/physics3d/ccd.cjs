const require_math3d = require("../../../math/src/math3d.cjs");
const require_spatial = require("./spatial.cjs");
const require_physics3d = require("../../../../src/data/physics3d.cjs");
const require_collider = require("./collider.cjs");
const require_geometry = require("./geometry.cjs");
//#region dist/packages/core/src/physics3d/ccd.js
function integrateRotation3D(e, t, n, r) {
	let i = Math.hypot(t.x, t.y, t.z), a = i * n / 2, o = i > 1e-12 ? Math.sin(a) / i : n / 2, s = t.x * o, c = t.y * o, l = t.z * o, u = Math.cos(a), d = e.x, f = e.y, p = e.z, m = e.w;
	r.set(u * d + s * m + c * p - l * f, u * f - s * p + c * m + l * d, u * p + s * f - c * d + l * m, u * m - s * d - c * f - l * p).normalize();
}
function motionRadius3D(e) {
	let t = e.shape.bounds, n = e.object.position;
	return Math.hypot(Math.max(Math.abs(t.min.x - n.x), Math.abs(t.max.x - n.x)), Math.max(Math.abs(t.min.y - n.y), Math.abs(t.max.y - n.y)), Math.max(Math.abs(t.min.z - n.z), Math.abs(t.max.z - n.z)));
}
function rotationalSweepSpeed3D(e) {
	let t = e.body;
	if (!t || t.type === `static` || t.lockRotation || t.isSleeping || e.ccdStopped) return 0;
	let n = t.angularVelocity, r = e.shape, i = r.center, a = 0, o = r.collider.kind === `compound` ? r.children.length : 1;
	for (let e = 0; e < o; e++) {
		let t = r.collider.kind === `compound` ? r.children[e] : r, o = t.collider.kind === `box` ? 8 : t.collider.kind === `capsule` ? 2 : 1;
		for (let e = 0; e < o; e++) {
			let r = t.collider.kind === `box` ? t.vertices[e] : t.collider.kind === `capsule` ? e === 0 ? t.start : t.end : t.center, o = r.x - i.x, s = r.y - i.y, c = r.z - i.z;
			a = Math.max(a, Math.hypot(n.y * c - n.z * s, n.z * o - n.x * c, n.x * s - n.y * o));
		}
	}
	return a;
}
function rigidSweptBounds3D(e, t, n, r) {
	let i = e.body;
	if (!i || i.type === `static` || i.isSleeping || e.ccdStopped) {
		n.union(e.shape.bounds, e.shape.bounds);
		return;
	}
	r.set(i.velocity.x * t, i.velocity.y * t, i.velocity.z * t);
	let a = rotationalSweepSpeed3D(e), o = a > 0 ? Math.min(2 * motionRadius3D(e), a * t) : 0;
	n.swept(e.shape.bounds, r, o + require_physics3d.physics3DDefaults.sweepTolerance);
}
var ContinuousCollision3D = class {
	matrixA = new require_math3d.Matrix4();
	matrixB = new require_math3d.Matrix4();
	position = new require_math3d.Vector3();
	rotation = new require_math3d.Quaternion();
	narrow = new require_geometry.Narrowphase3D();
	leaf = new require_geometry.Manifold3D();
	manifold = new require_geometry.Manifold3D();
	triangles = [];
	boundsA = new require_spatial.Bounds3D();
	boundsB = new require_spatial.Bounds3D();
	displacement = new require_math3d.Vector3();
	iterations = 0;
	exhausted = !1;
	safeTime = 1 / 0;
	sample(e, t, n) {
		let i = e.body, a = e.object;
		if (!i || i.type === `static` || i.isSleeping || e.ccdStopped) return e.shape;
		this.position.set(a.position.x + i.velocity.x * t, a.position.y + i.velocity.y * t, a.position.z + i.velocity.z * t), i.lockRotation ? this.rotation.copy(a.rotation) : integrateRotation3D(a.rotation, i.angularVelocity, t, this.rotation);
		let o = e.ccdShape ??= new require_collider.Shape3D(e.shape.collider);
		return o.refreshMatrix(n.compose(this.position, this.rotation, a.scale)), o;
	}
	keep(e) {
		let t = this.leaf;
		if (!(t.distance >= e.distance)) {
			e.distance = t.distance, e.normal.copy(t.normal), e.count = t.count;
			for (let n = 0; n < t.count; n++) e.points[n].copy(t.points[n]), e.normals[n].copy(t.normals[n]), e.depths[n] = t.depths[n];
		}
	}
	distance(e, t, n, r, i) {
		let a = e.collider.kind === `compound` ? e.children.length : 1, o = t.collider.kind === `compound` ? t.children.length : 1;
		for (let c = 0; c < a; c++) for (let a = 0; a < o; a++) {
			let o = e.collider.kind === `compound` ? e.children[c] : e, l = t.collider.kind === `compound` ? t.children[a] : t, u = n.collider.kind === `compound` ? n.children[c] : n, d = r.collider.kind === `compound` ? r.children[a] : r, f = o.collider.kind === `mesh` ? o : l.collider.kind === `mesh` ? l : void 0;
			if (!f) {
				this.narrow.collide(o, l, this.leaf), this.keep(i);
				continue;
			}
			let p = f === o ? l : o, m = f === o ? d : u;
			if (p.collider.kind !== `mesh` && p.collider.kind !== `plane`) {
				f.triangleIndex.query(f === o ? this.boundsB : this.boundsA, this.triangles);
				for (let e of this.triangles) f.collider.sidedness === `front` && (m.center.x - e.a.x) * e.normal.x + (m.center.y - e.a.y) * e.normal.y + (m.center.z - e.a.z) * e.normal.z < -require_physics3d.physics3DDefaults.sweepTolerance || (this.narrow.triangle(p, e, this.leaf), f === o && this.leaf.flip(), this.keep(i));
			}
		}
	}
	contactClosing(e, t, n) {
		let r = -1 / 0, i = this.manifold;
		for (let a = 0; a < i.count; a++) {
			let o = i.points[a], s = i.normals[a], c = 0;
			for (let r = 0; r < 2; r++) {
				let i = r === 0 ? e : t, a = i.body;
				if (!a || a.type === `static` || a.isSleeping || i.ccdStopped) continue;
				let l = i.object.position, u = a.velocity, d = a.angularVelocity, f = o.x - l.x - u.x * n, p = o.y - l.y - u.y * n, m = o.z - l.z - u.z * n, h = a.lockRotation ? 0 : (d.y * m - d.z * p) * s.x + (d.z * f - d.x * m) * s.y + (d.x * p - d.y * f) * s.z;
				c += (r === 0 ? -1 : 1) * (u.dot(s) + h);
			}
			r = Math.max(r, c);
		}
		return r;
	}
	timeOfImpact(e, t, n, r) {
		if (this.iterations = 0, this.exhausted = !1, this.safeTime = 1 / 0, rigidSweptBounds3D(e, n, this.boundsA, this.displacement), rigidSweptBounds3D(t, n, this.boundsB, this.displacement), !this.boundsA.overlaps(this.boundsB)) return 1 / 0;
		let i = e.body, a = t.body, o = !!i && i.type !== `static` && !i.isSleeping && !e.ccdStopped, c = !!a && a.type !== `static` && !a.isSleeping && !t.ccdStopped, l = (o ? i.velocity.x : 0) - (c ? a.velocity.x : 0), u = (o ? i.velocity.y : 0) - (c ? a.velocity.y : 0), d = (o ? i.velocity.z : 0) - (c ? a.velocity.z : 0), f = rotationalSweepSpeed3D(e) + rotationalSweepSpeed3D(t);
		if (Math.hypot(l, u, d) + f < 1e-12) return 1 / 0;
		let p = 0;
		for (; this.iterations < require_physics3d.physics3DDefaults.ccdIterations;) {
			++this.iterations;
			let i = this.sample(e, p, this.matrixA), a = this.sample(t, p, this.matrixB), o = this.manifold;
			if (o.distance = 1 / 0, o.count = 0, this.distance(i, a, e.shape, t.shape, o), !Number.isFinite(o.distance)) return 1 / 0;
			let c = -(l * o.normal.x + u * o.normal.y + d * o.normal.z) + f;
			if (o.distance <= require_physics3d.physics3DDefaults.sweepTolerance) return p > 0 || this.contactClosing(e, t, p) > 1e-8 || o.distance < -require_physics3d.physics3DDefaults.contactSlop ? p : f === 0 || c <= 1e-12 ? 1 / 0 : (this.safeTime = p, this.exhausted = !0, 1 / 0);
			if (c <= 1e-12) return 1 / 0;
			let m = (o.distance - require_physics3d.physics3DDefaults.sweepTolerance * .5) / c;
			if (p + m > r || p + m > n) return 1 / 0;
			p += m;
		}
		return this.exhausted = !0, this.safeTime = p, 1 / 0;
	}
};
//#endregion
exports.ContinuousCollision3D = ContinuousCollision3D;
exports.integrateRotation3D = integrateRotation3D;
exports.motionRadius3D = motionRadius3D;
exports.rigidSweptBounds3D = rigidSweptBounds3D;
exports.rotationalSweepSpeed3D = rotationalSweepSpeed3D;

//# sourceMappingURL=ccd.cjs.map