const require_math3d = require("../../../math/src/math3d.cjs");
const require_physics_profiles = require("../../../../src/data/physics-profiles.cjs");
//#region dist/packages/core/src/physics3d/debug-geometry.js
var PhysicsDebugSnapshotBuilder3D = class {
	segments = [];
	line(e, n, r = `collider`) {
		if (this.segments.length >= require_physics_profiles.physicsProfiles.debug.maxSegments) throw RangeError(`Physics debug segment bound exceeded.`);
		this.segments.push(Object.freeze({
			kind: r,
			from: Object.freeze([
				e.x,
				e.y,
				e.z
			]),
			to: Object.freeze([
				n.x,
				n.y,
				n.z
			])
		}));
	}
	shape(n) {
		if (n.collider.kind === `compound`) {
			for (let e of n.children) this.shape(e);
			return;
		}
		if (n.collider.kind === `box`) {
			for (let e = 0; e < 8; e++) for (let t of [
				1,
				2,
				4
			]) e & t || this.line(n.vertices[e], n.vertices[e | t]);
			return;
		}
		if (n.collider.kind === `mesh`) {
			for (let e of n.triangles) this.line(e.a, e.b), this.line(e.b, e.c), this.line(e.c, e.a);
			return;
		}
		if (n.collider.kind === `plane`) {
			let r = n.normal, i = new require_math3d.Vector3(Math.abs(r.y) < .9 ? 0 : 1, +(Math.abs(r.y) < .9), 0).cross(r).normalize().scale(require_physics_profiles.physicsProfiles.debug.planeExtent), a = r.clone().cross(i), o = [
				[-1, -1],
				[1, -1],
				[1, 1],
				[-1, 1]
			].map(([t, r]) => new require_math3d.Vector3(n.center.x + i.x * t + a.x * r, n.center.y + i.y * t + a.y * r, n.center.z + i.z * t + a.z * r));
			for (let e = 0; e < 4; e++) this.line(o[e], o[(e + 1) % 4]);
			return;
		}
		let r = n.collider.kind === `capsule`, i = require_physics_profiles.physicsProfiles.debug.circleSegments;
		for (let t of [
			[0, 1],
			[1, 2],
			[2, 0]
		]) {
			let a = n.axes[t[0]], o = n.axes[t[1]], s = [];
			for (let c = 0; c <= i; c++) {
				let l = c / i * Math.PI * 2, u = Math.cos(l), d = Math.sin(l), f = a.y * u + o.y * d, p = (t[0] === 1 ? u : 0) + (t[1] === 1 ? d : 0), m = r ? p >= 0 ? n.end : n.start : n.center;
				s.push(new require_math3d.Vector3(m.x + n.radius * (a.x * u + o.x * d), m.y + n.radius * f, m.z + n.radius * (a.z * u + o.z * d)));
			}
			for (let e = 0; e < i; e++) this.line(s[e], s[e + 1]);
		}
		if (r) {
			let t = n.axes[0], r = n.axes[2];
			for (let a = 0; a < i; a++) {
				let o = Math.cos(a / i * Math.PI * 2), s = Math.sin(a / i * Math.PI * 2), c = new require_math3d.Vector3(n.radius * (t.x * o + r.x * s), n.radius * (t.y * o + r.y * s), n.radius * (t.z * o + r.z * s)), l = n.start.clone().add(c), u = n.end.clone().add(c);
				this.line(l, u);
				let d = (a + 1) / i * Math.PI * 2, f = new require_math3d.Vector3(n.start.x + n.radius * (t.x * Math.cos(d) + r.x * Math.sin(d)), n.start.y + n.radius * (t.y * Math.cos(d) + r.y * Math.sin(d)), n.start.z + n.radius * (t.z * Math.cos(d) + r.z * Math.sin(d)));
				this.line(l, f);
			}
		}
	}
	finish() {
		return Object.freeze({ segments: Object.freeze(this.segments) });
	}
};
//#endregion
exports.PhysicsDebugSnapshotBuilder3D = PhysicsDebugSnapshotBuilder3D;

//# sourceMappingURL=debug-geometry.cjs.map