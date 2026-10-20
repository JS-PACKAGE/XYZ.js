const require_hypot = require("../../../math/src/hypot.cjs");
const require_math3d = require("../../../math/src/math3d.cjs");
const require_collider = require("./collider.cjs");
const require_joints = require("./joints.cjs");
const require_physics_profiles = require("../../../../src/data/physics-profiles.cjs");
//#region dist/packages/core/src/physics3d/ragdoll.js
function multiply(e, t, n) {
	return n.set(e.w * t.x + e.x * t.w + e.y * t.z - e.z * t.y, e.w * t.y - e.x * t.z + e.y * t.w + e.z * t.x, e.w * t.z + e.x * t.y - e.y * t.x + e.z * t.w, e.w * t.w - e.x * t.x - e.y * t.y - e.z * t.z);
}
function rotation(e, t) {
	let n = e.elements, r = require_hypot.hypot3(n[0], n[1], n[2]), i = require_hypot.hypot3(n[4], n[5], n[6]), a = require_hypot.hypot3(n[8], n[9], n[10]);
	if (!(r > 0 && i > 0 && a > 0)) throw RangeError(`Ragdoll reference pose is singular.`);
	let o = n[0] / r, l = n[4] / i, u = n[8] / a, d = n[1] / r, f = n[5] / i, p = n[9] / a, m = n[2] / r, h = n[6] / i, g = n[10] / a;
	if (Math.abs(o * l + d * f + m * h) > require_physics_profiles.physicsProfiles.ragdoll.referenceTolerance || Math.abs(o * u + d * p + m * g) > require_physics_profiles.physicsProfiles.ragdoll.referenceTolerance || Math.abs(l * u + f * p + h * g) > require_physics_profiles.physicsProfiles.ragdoll.referenceTolerance || o * (f * g - p * h) - l * (d * g - p * m) + u * (d * h - f * m) < 0) throw RangeError(`Ragdoll reference pose must not contain shear/reflection.`);
	let _ = o + f + g;
	if (_ > 0) {
		let e = Math.sqrt(_ + 1) * 2;
		t.set((h - p) / e, (u - m) / e, (d - l) / e, e / 4);
	} else if (o > f && o > g) {
		let e = Math.sqrt(1 + o - f - g) * 2;
		t.set(e / 4, (l + d) / e, (u + m) / e, (h - p) / e);
	} else if (f > g) {
		let e = Math.sqrt(1 + f - o - g) * 2;
		t.set((l + d) / e, e / 4, (p + h) / e, (u - m) / e);
	} else {
		let e = Math.sqrt(1 + g - o - f) * 2;
		t.set((u + m) / e, (p + h) / e, e / 4, (d - l) / e);
	}
	return t.normalize();
}
var Ragdoll3D = class {
	world;
	joints;
	bindings;
	owned = [];
	inverse = new require_math3d.Matrix4();
	q = new require_math3d.Quaternion();
	r = new require_math3d.Quaternion();
	disposed = !1;
	constructor(e, c) {
		if (this.world = e, !c.mappings.length || c.mappings.length > require_physics_profiles.physicsProfiles.ragdoll.maxBones || c.joints.length > require_physics_profiles.physicsProfiles.ragdoll.maxBones * 2) throw RangeError(`Invalid ragdoll size.`);
		let l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set();
		this.bindings = c.mappings.map((r) => {
			let { id: i, bone: s, body: f } = r;
			if (!i || l.has(i) || u.has(s) || d.has(f) || s === f || s.destroyed || f.destroyed || f.parent || f.body?.type !== `dynamic` || !f.collider) throw Error(`Ragdoll requires unique live bone/root dynamic-body mappings.`);
			if (f.scene && f.scene.physics3D !== e) throw Error(`Ragdoll body belongs to another world.`);
			if (!e.has(f) && c.registerBodies === !1) throw Error(`Ragdoll body must be registered.`);
			e.validate(f), l.set(i, f), u.add(s), d.add(f);
			let p = s.updateWorldMatrix(), m = f.updateWorldMatrix();
			require_collider.vector3D(s.position, `bone position`), require_collider.vector3D(f.position, `body position`);
			for (let e of p.elements) require_collider.finite3D(e, `reference matrix`);
			let h = new require_math3d.Vector3(p.elements[12], p.elements[13], p.elements[14]);
			return this.inverse.copy(m).invert().transformPoint(h, h), rotation(m, this.q), this.q.set(-this.q.x, -this.q.y, -this.q.z, this.q.w), rotation(p, this.r), {
				mapping: { ...r },
				offset: h,
				rotation: multiply(this.q, this.r, new require_math3d.Quaternion()),
				target: new require_math3d.Vector3(),
				targetRotation: new require_math3d.Quaternion()
			};
		});
		let f = c.joints.map((e) => {
			let t = l.get(e.a), n = l.get(e.b);
			if (!t || !n) throw Error(`Ragdoll joint references an unknown mapping.`);
			return e.type === `cone` ? new require_joints.BallSocketJoint3D({
				...e,
				bodyA: t,
				bodyB: n
			}) : new require_joints.HingeJoint3D({
				...e,
				bodyA: t,
				bodyB: n
			});
		}), p = [];
		try {
			for (let t of d) e.has(t) || (e.register(t), this.owned.push(t));
			for (let t of f) e.addJoint(t), p.push(t);
		} catch (t) {
			for (let t of p) e.removeJoint(t);
			for (let t of this.owned) e.unregister(t);
			throw t;
		}
		this.joints = Object.freeze(f);
		let depth = (e) => {
			let t = 0;
			for (let n = e.parent; n; n = n.parent) t++;
			return t;
		};
		this.bindings.sort((e, t) => depth(e.mapping.bone) - depth(t.mapping.bone));
	}
	blend(e = 1) {
		if (require_collider.finite3D(e, `blend weight`), e < 0 || e > 1) throw RangeError(`Blend weight must be within [0,1].`);
		if (this.disposed) throw Error(`Ragdoll3D is destroyed.`);
		for (let e of this.bindings) {
			let { bone: t, body: n } = e.mapping;
			if (!this.world.has(n) || n.destroyed || t.destroyed) throw Error(`Ragdoll mapping is no longer live.`);
			n.updateWorldMatrix().transformPoint(e.offset, e.target), rotation(n.worldMatrix, this.q), multiply(this.q, e.rotation, e.targetRotation);
		}
		for (let t of this.bindings) {
			let n = t.mapping.bone, r = t.target, i = t.targetRotation;
			n.parent && (this.inverse.copy(n.parent.updateWorldMatrix()).invert().transformPoint(r, r), rotation(n.parent.worldMatrix, this.q), this.q.set(-this.q.x, -this.q.y, -this.q.z, this.q.w), multiply(this.q, i, this.r), i.copy(this.r)), n.position.x += (r.x - n.position.x) * e, n.position.y += (r.y - n.position.y) * e, n.position.z += (r.z - n.position.z) * e;
			let a = n.rotation, o = a.x * i.x + a.y * i.y + a.z * i.z + a.w * i.w < 0 ? -1 : 1;
			a.set(a.x * (1 - e) + i.x * e * o, a.y * (1 - e) + i.y * e * o, a.z * (1 - e) + i.z * e * o, a.w * (1 - e) + i.w * e * o).normalize();
		}
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			for (let e of this.joints) this.world.removeJoint(e);
			for (let e of this.owned) this.world.unregister(e);
		}
	}
};
//#endregion
exports.Ragdoll3D = Ragdoll3D;

//# sourceMappingURL=ragdoll.cjs.map