const require_math3d = require("../../../math/src/math3d.cjs");
const require_physics3d = require("../../../../src/data/physics3d.cjs");
const require_collider = require("./collider.cjs");
const require_body = require("./body.cjs");
const require_character3d = require("../../../../src/data/character3d.cjs");
const require_character_support = require("./character-support.cjs");
//#region dist/packages/core/src/physics3d/character.js
var u = Object.freeze({});
var CharacterController3D = class {
	object;
	world;
	skin;
	stepHeight;
	maxSlopeAngle;
	groundSnap;
	pushStrength;
	maxIterations;
	maxRecoveryDistance;
	maxSupportDisplacement;
	crouchHeight;
	standingCapsule;
	crouchingCapsule;
	stanceState = `standing`;
	supportObject;
	supportCollider;
	supportGeneration = -1;
	unresolvedCarry = !1;
	supportCandidate;
	lastCarryEpoch;
	pendingDetach = `none`;
	supportPose = new require_character_support.CharacterSupportPose3D();
	nextSupportPose = new require_character_support.CharacterSupportPose3D();
	inverseSupport = new require_math3d.Matrix4();
	localAnchor = new require_math3d.Vector3();
	worldAnchor = new require_math3d.Vector3();
	carryPoint = new require_math3d.Vector3();
	previousCarryPoint = new require_math3d.Vector3();
	carrySegment = new require_math3d.Vector3();
	expectedPosition = new require_math3d.Vector3();
	requested = new require_math3d.Vector3();
	recoveryApplied = new require_math3d.Vector3();
	supportRequested = new require_math3d.Vector3();
	carryApplied = new require_math3d.Vector3();
	locomotionApplied = new require_math3d.Vector3();
	phaseStart = new require_math3d.Vector3();
	stancePosition = new require_math3d.Vector3();
	stanceApplied = new require_math3d.Vector3();
	stanceResult;
	groundedState = !1;
	disposed = !1;
	createdBody;
	remaining = new require_math3d.Vector3();
	motion = new require_math3d.Vector3();
	start = new require_math3d.Vector3();
	stepStart = new require_math3d.Vector3();
	applied = new require_math3d.Vector3();
	stepHorizontal = new require_math3d.Vector3();
	query;
	carryQuery;
	hit;
	contacts = [];
	contactPool = [];
	result;
	constructor(e, a, l = {}) {
		if (this.object = e, this.world = a, this.skin = require_collider.positive3D(l.skin ?? require_physics3d.physics3DDefaults.characterSkin, `skin`), this.stepHeight = require_collider.nonnegative3D(l.stepHeight ?? .3, `stepHeight`), this.maxSlopeAngle = require_collider.nonnegative3D(l.maxSlopeAngle ?? Math.PI / 4, `maxSlopeAngle`), this.maxSlopeAngle >= Math.PI / 2) throw RangeError(`maxSlopeAngle must be < pi/2.`);
		if (this.groundSnap = require_collider.nonnegative3D(l.groundSnap ?? .08, `groundSnap`), this.pushStrength = require_collider.nonnegative3D(l.pushStrength ?? 2, `pushStrength`), this.maxRecoveryDistance = require_collider.positive3D(l.maxRecoveryDistance ?? 1, `maxRecoveryDistance`), this.maxIterations = l.maxIterations ?? require_physics3d.physics3DDefaults.characterIterations, !Number.isInteger(this.maxIterations) || this.maxIterations < 1 || this.maxIterations > 32) throw RangeError(`Character iterations must be 1..32.`);
		if (this.assertPose(), this.standingCapsule = e.collider, this.crouchHeight = require_collider.nonnegative3D(l.crouchHeight ?? this.standingCapsule.height * require_character3d.character3DDefaults.crouchHeightRatio, `crouchHeight`), this.crouchHeight > this.standingCapsule.height) throw RangeError(`crouchHeight cannot exceed standing capsule height.`);
		if (this.maxSupportDisplacement = require_collider.positive3D(l.maxSupportDisplacement ?? require_character3d.character3DDefaults.maxSupportDisplacement, `maxSupportDisplacement`), this.crouchingCapsule = new require_collider.CapsuleCollider3D(this.standingCapsule.radius, this.crouchHeight, this.standingCapsule), this.expectedPosition.copy(e.position), this.stanceResult = {
			stance: `standing`,
			changed: !1,
			blocked: !1,
			radius: this.standingCapsule.radius,
			height: this.standingCapsule.height,
			displacement: this.stanceApplied
		}, e.body && e.body.type !== `kinematic`) throw Error(`Character requires a kinematic body.`);
		if (!e.body) {
			let t = new require_body.RigidBody3D({
				type: `kinematic`,
				lockRotation: !0
			});
			e.body = t, this.createdBody = t;
		}
		this.query = {
			ignore: e,
			mask: l.mask ?? 4294967295
		}, this.carryQuery = {
			ignore: e,
			mask: this.query.mask
		}, this.hit = {
			object: e,
			collider: e.collider,
			point: new require_math3d.Vector3(),
			normal: new require_math3d.Vector3(),
			distance: 0
		}, this.result = {
			displacement: this.applied,
			requestedDisplacement: this.requested,
			recoveryDisplacement: this.recoveryApplied,
			supportDisplacement: this.supportRequested,
			carriedDisplacement: this.carryApplied,
			locomotionDisplacement: this.locomotionApplied,
			support: void 0,
			supportCollider: void 0,
			supportLocalAnchor: this.localAnchor,
			supportWorldAnchor: this.worldAnchor,
			supportDetached: `none`,
			carryBlocked: !1,
			unresolvedPenetration: !1,
			supportYawDelta: 0,
			grounded: !1,
			blocked: !1,
			contacts: this.contacts
		};
	}
	get grounded() {
		return this.groundedState;
	}
	get destroyed() {
		return this.disposed;
	}
	get stance() {
		return this.stanceState;
	}
	get support() {
		return this.supportObject;
	}
	detachSupport() {
		this.clearSupport(`manual`), this.groundedState = !1, this.pendingDetach = `manual`;
	}
	assertPose() {
		let e = this.object;
		if (e.destroyed || e.parent || !(e.collider instanceof require_collider.CapsuleCollider3D)) throw Error(`Character requires a live root CapsuleCollider3D owner.`);
		if (e.scale.x !== 1 || e.scale.y !== 1 || e.scale.z !== 1 || Math.abs(e.rotation.x) > require_character3d.character3DDefaults.poseTolerance || Math.abs(e.rotation.z) > require_character3d.character3DDefaults.poseTolerance || Math.abs(Math.hypot(e.rotation.x, e.rotation.y, e.rotation.z, e.rotation.w) - 1) > require_character3d.character3DDefaults.poseTolerance) throw Error(`Character must be upright with unit scale (yaw is supported).`);
		require_collider.vector3D(e.position, `position`);
	}
	remember(e) {
		let n = this.contacts.length, r = this.contactPool[n];
		r || (this.contactPool[n] = r = {
			object: e.object,
			collider: e.collider,
			point: new require_math3d.Vector3(),
			normal: new require_math3d.Vector3(),
			distance: 0
		}), r.object = e.object, r.collider = e.collider, r.point.copy(e.point), r.normal.copy(e.normal), r.distance = e.distance, this.contacts.push(r);
	}
	clearSupport(e) {
		this.supportObject && (this.result.supportDetached = e), this.supportObject = void 0, this.supportCollider = void 0, this.supportGeneration = -1, this.result.support = void 0, this.result.supportCollider = void 0, this.localAnchor.set(0, 0, 0), this.worldAnchor.set(0, 0, 0);
	}
	detectTeleport() {
		let e = this.object.position, t = this.expectedPosition;
		Math.hypot(e.x - t.x, e.y - t.y, e.z - t.z) > require_character3d.character3DDefaults.poseTolerance && (this.clearSupport(`teleport`), this.groundedState = !1);
	}
	assertLive() {
		if (this.disposed) throw Error(`CharacterController3D is destroyed.`);
		if (this.assertPose(), !this.world.has(this.object)) throw Error(`Character must be registered in its PhysicsWorld3D.`);
		if (this.object.body?.type !== `kinematic`) throw Error(`Character kinematic body was replaced.`);
	}
	setStance(e) {
		if (this.assertLive(), e !== `standing` && e !== `crouching`) throw TypeError(`Character stance must be standing or crouching.`);
		this.detectTeleport();
		let t = this.object.collider, n = e === `standing` ? this.standingCapsule : this.crouchingCapsule, r = this.stanceResult;
		if (r.changed = !1, r.blocked = !1, this.stanceApplied.set(0, 0, 0), this.stancePosition.copy(this.object.position), this.stancePosition.y += (n.height - t.height) / 2 + n.radius - t.radius, t !== n && (n.height > t.height || n.radius > t.radius) && !this.world.canPlaceCapsule(this.object, n, this.stancePosition, this.query)) r.blocked = !0;
		else if (t !== n) {
			this.stepStart.copy(this.object.position), this.object.position.copy(this.stancePosition);
			try {
				this.object.collider = n;
			} catch (e) {
				throw this.object.position.copy(this.stepStart), e;
			}
			this.stanceState = e, this.stanceApplied.copy(this.object.position).subtract(this.stepStart), r.changed = !0;
		} else this.stanceState = e;
		r.stance = this.stanceState;
		let i = this.object.collider;
		return r.radius = i.radius, r.height = i.height, this.expectedPosition.copy(this.object.position), r;
	}
	noteGround() {
		this.supportCandidate = this.contacts[this.contacts.length - 1], this.groundedState = !0;
	}
	advance(e, t) {
		let n = e.length();
		if (n < 1e-12) return;
		let r = Math.max(0, Math.min(1, t / n)), i = this.object.position;
		i.x += e.x * r, i.y += e.y * r, i.z += e.z * r;
	}
	probe(e, t) {
		if (e <= 0) return !1;
		this.motion.set(0, -e, 0);
		let n = this.world.sweepCapsule(this.object, this.motion, this.query, this.hit);
		return !n || n.normal.y < Math.cos(this.maxSlopeAngle) ? !1 : (t && this.advance(this.motion, Math.max(0, n.distance - this.skin)), this.remember(n), this.noteGround(), !0);
	}
	tryStep(e) {
		if (this.stepHeight <= 0 || e.length() < 1e-10) return !1;
		this.stepHorizontal.set(e.x, 0, e.z), this.stepStart.copy(this.object.position), this.motion.set(0, this.stepHeight + this.skin, 0);
		let t = this.world.sweepCapsule(this.object, this.motion, this.query, this.hit);
		if (t && t.distance < this.motion.y - this.skin) return !1;
		this.object.position.y += this.motion.y;
		let n = this.world.sweepCapsule(this.object, this.stepHorizontal, this.query, this.hit);
		if (n && n.distance < this.stepHorizontal.length() - this.skin) return this.object.position.copy(this.stepStart), !1;
		this.object.position.x += this.stepHorizontal.x, this.object.position.z += this.stepHorizontal.z, this.motion.set(0, -(this.stepHeight + this.groundSnap + 2 * this.skin), 0);
		let r = this.world.sweepCapsule(this.object, this.motion, this.query, this.hit);
		return !r || r.normal.y < Math.cos(this.maxSlopeAngle) || (this.advance(this.motion, Math.max(0, r.distance - this.skin)), this.object.position.y - this.stepStart.y > this.stepHeight + this.skin) ? (this.object.position.copy(this.stepStart), !1) : (this.remember(r), this.noteGround(), !0);
	}
	sweepMotion(e, t, n, r, i = 0) {
		this.remaining.set(e.x, e.y, e.z);
		let a = !1;
		for (let o = 0; o < this.maxIterations && this.remaining.length() > 1e-8; o++) {
			let o = this.world.sweepCapsule(this.object, this.remaining, r, this.hit, i);
			if (!o) {
				this.object.position.add(this.remaining), this.remaining.set(0, 0, 0);
				break;
			}
			this.remember(o);
			let s = this.remaining.length(), c = Math.max(0, o.distance - this.skin);
			this.advance(this.remaining, c);
			let l = 1 - Math.min(1, c / s);
			this.remaining.scale(l);
			let u = o.normal;
			if (!n && t && e.y <= 0 && u.y < Math.cos(this.maxSlopeAngle) && (this.motion.set(this.remaining.x, 0, this.remaining.z), this.tryStep(this.motion))) {
				this.remaining.set(0, 0, 0);
				break;
			}
			let d = this.contacts[this.contacts.length - 1], f = d.normal;
			!n && f.y >= Math.cos(this.maxSlopeAngle) && e.y <= 0 && this.noteGround();
			let p = this.remaining.dot(f);
			if (p < 0) {
				let t = d.object.body;
				!n && t?.type === `dynamic` && this.pushStrength > 0 && (this.motion.set(-f.x * -p * this.pushStrength, -f.y * -p * this.pushStrength, -f.z * -p * this.pushStrength), t.applyImpulse(this.motion, d.point)), this.remaining.x -= f.x * p, this.remaining.y -= f.y * p, this.remaining.z -= f.z * p, !n && f.y > 0 && f.y < Math.cos(this.maxSlopeAngle) && this.remaining.y > Math.max(0, e.y) && (this.remaining.y = Math.max(0, e.y));
			}
			a = !0;
		}
		return a || this.remaining.length() > 1e-8;
	}
	inheritSupport(e) {
		let t = this.supportObject;
		if (!t) return;
		if (t.destroyed || !this.world.has(t) || t.collider !== this.supportCollider || t.registrationGeneration !== this.supportGeneration) {
			this.clearSupport(`removed`), this.groundedState = !1;
			return;
		}
		if (e !== void 0 && e === this.lastCarryEpoch) return;
		this.lastCarryEpoch = e;
		let n = this.supportPose, r = this.nextSupportPose, i = t.updateWorldMatrix(), a = n.matrix.elements, o = !1;
		for (let e = 0; e < 16; e++) if (i.elements[e] !== a[e]) {
			o = !0;
			break;
		}
		if (!o) return;
		r.capture(i);
		let s = Math.hypot(r.position.x - n.position.x, r.position.y - n.position.y, r.position.z - n.position.z), l = n.angleTo(r), u = Math.hypot(this.localAnchor.x * n.scale.x, this.localAnchor.y * n.scale.y, this.localAnchor.z * n.scale.z), d = s + l * u;
		if (d > this.maxSupportDisplacement || Math.abs(n.scale.x - r.scale.x) > require_character3d.character3DDefaults.poseTolerance || Math.abs(n.scale.y - r.scale.y) > require_character3d.character3DDefaults.poseTolerance || Math.abs(n.scale.z - r.scale.z) > require_character3d.character3DDefaults.poseTolerance) {
			this.clearSupport(`support-teleport`), this.groundedState = !1;
			return;
		}
		let f = Math.max(1, Math.ceil(d / require_character3d.character3DDefaults.supportSweepStep), Math.ceil(l / require_character3d.character3DDefaults.supportRotationStep));
		if (f > require_character3d.character3DDefaults.maxSupportSegments) {
			this.clearSupport(`support-teleport`), this.groundedState = !1;
			return;
		}
		let p = 2 * u * Math.sin(l / (4 * f)) ** 2;
		n.matrix.transformPoint(this.localAnchor, this.previousCarryPoint), r.matrix.transformPoint(this.localAnchor, this.carryPoint), this.supportRequested.copy(this.carryPoint).subtract(this.previousCarryPoint), this.carryQuery.ignoreAlso = t, this.phaseStart.copy(this.object.position);
		for (let e = 1; e <= f; e++) n.interpolatePoint(r, this.localAnchor, e / f, this.carryPoint), this.carrySegment.copy(this.carryPoint).subtract(this.previousCarryPoint), this.sweepMotion(this.carrySegment, !1, !0, this.carryQuery, p) && (this.result.carryBlocked = !0), this.previousCarryPoint.copy(this.carryPoint);
		this.carryApplied.copy(this.object.position).subtract(this.phaseStart);
		let m = Math.atan2(r.matrix.elements[8], r.matrix.elements[10]) - Math.atan2(n.matrix.elements[8], n.matrix.elements[10]);
		m = Math.atan2(Math.sin(m), Math.cos(m));
		let h = 2 * Math.atan2(this.object.rotation.y, this.object.rotation.w) + m;
		this.object.rotation.setFromEuler(0, h, 0), this.result.supportYawDelta = m, n.capture(r.matrix), this.result.carryBlocked && (this.clearSupport(`blocked`), this.groundedState = !1);
	}
	updateSupport(e) {
		let t = this.supportCandidate;
		if (!this.groundedState || !t || t.object.destroyed || !this.world.has(t.object) || t.object.collider !== t.collider) this.clearSupport(`lost`);
		else {
			(this.supportObject !== t.object || this.supportCollider !== t.collider || this.supportGeneration !== t.object.registrationGeneration) && (this.supportPose.capture(t.object.updateWorldMatrix()), this.lastCarryEpoch = e), this.supportObject = t.object, this.supportCollider = t.collider, this.supportGeneration = t.object.registrationGeneration;
			let n = this.object.collider;
			this.worldAnchor.copy(this.object.position), this.worldAnchor.y -= n.height / 2 + n.radius, this.inverseSupport.copy(this.supportPose.matrix).invert().transformPoint(this.worldAnchor, this.localAnchor);
		}
		this.result.support = this.supportObject, this.result.supportCollider = this.supportCollider;
	}
	stopUnresolvedCarry() {
		return this.unresolvedCarry = !0, this.result.unresolvedPenetration = !0, this.result.carryBlocked = !0, this.result.blocked = !0, this.result.grounded = !1, this.groundedState = !1, this.clearSupport(`blocked`), this.result.supportDetached = `blocked`, this.recoveryApplied.set(0, 0, 0), this.locomotionApplied.set(0, 0, 0), this.applied.copy(this.object.position).subtract(this.start), this.expectedPosition.copy(this.object.position), this.carryQuery.ignoreAlso = void 0, this.result;
	}
	move(e, t = u) {
		if (this.assertLive(), require_collider.vector3D(e, `displacement`), t.epoch !== void 0 && (!Number.isSafeInteger(t.epoch) || t.epoch < 0)) throw RangeError(`Character movement epoch must be a nonnegative safe integer.`);
		if (this.unresolvedCarry) {
			if (!this.world.canPlaceCapsule(this.object, this.object.collider, this.object.position, this.query)) throw Error(`Character carried placement is unresolved; restore a collision-free pose before moving.`);
			this.unresolvedCarry = !1;
		}
		this.requested.set(e.x, e.y, e.z), this.contacts.length = 0, this.supportCandidate = void 0, this.start.copy(this.object.position), this.result.blocked = !1, this.result.carryBlocked = !1, this.result.unresolvedPenetration = !1, this.result.supportYawDelta = 0, this.result.supportDetached = this.pendingDetach, this.pendingDetach = `none`, this.supportRequested.set(0, 0, 0), this.carryApplied.set(0, 0, 0), this.detectTeleport(), t.detachSupport || this.requested.y > 0 ? (this.clearSupport(this.requested.y > 0 ? `jump` : `manual`), this.groundedState = !1) : this.inheritSupport(t.epoch);
		let n = this.carryQuery.ignoreAlso;
		if (n && this.result.carryBlocked && !this.world.canPlaceCapsule(this.object, this.object.collider, this.object.position, this.query)) return this.stopUnresolvedCarry();
		if (this.phaseStart.copy(this.object.position), !this.world.recoverCapsule(this.object, this.maxRecoveryDistance, this.query)) {
			if (n) return this.stopUnresolvedCarry();
			throw this.expectedPosition.copy(this.object.position), Error(`Character initial penetration exceeds bounded recovery.`);
		}
		if (this.recoveryApplied.copy(this.object.position).subtract(this.phaseStart), n && this.recoveryApplied.length() > 1e-12) {
			this.object.position.copy(this.phaseStart);
			let e = this.world.sweepCapsule(this.object, this.recoveryApplied, this.carryQuery, this.hit);
			if (e && e.distance < this.recoveryApplied.length()) return this.remember(e), this.stopUnresolvedCarry();
			if (this.object.position.add(this.recoveryApplied), !this.world.canPlaceCapsule(this.object, this.object.collider, this.object.position, this.query)) return this.object.position.copy(this.phaseStart), this.stopUnresolvedCarry();
		}
		let r = this.requested.y <= 0 && (this.groundedState || this.probe(this.groundSnap + this.skin, !1));
		return this.groundedState = !1, this.phaseStart.copy(this.object.position), this.result.blocked = this.sweepMotion(this.requested, r, !1, this.query) || this.result.carryBlocked, this.requested.y <= 0 && (this.groundedState = this.probe(this.groundSnap + this.skin, r || this.groundedState) || this.groundedState), this.locomotionApplied.copy(this.object.position).subtract(this.phaseStart), this.applied.copy(this.object.position).subtract(this.start), this.result.grounded = this.groundedState, this.updateSupport(t.epoch), this.expectedPosition.copy(this.object.position), this.carryQuery.ignoreAlso = void 0, this.result;
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.contacts.length = 0, this.contactPool.length = 0, this.clearSupport(`removed`), this.supportCandidate = void 0, this.unresolvedCarry = !1, this.carryQuery.ignoreAlso = void 0, this.createdBody && this.object.body === this.createdBody && !this.object.destroyed && (this.object.body = void 0), this.createdBody = void 0);
	}
};
//#endregion
exports.CharacterController3D = CharacterController3D;

//# sourceMappingURL=character.cjs.map