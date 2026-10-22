const require_hypot = require("../../../math/src/hypot.cjs");
const require_math3d = require("../../../math/src/math3d.cjs");
const require_spatial = require("./spatial.cjs");
const require_physics3d = require("../../../../src/data/physics3d.cjs");
const require_collider = require("./collider.cjs");
const require_physics_force = require("../physics-force.cjs");
const require_mover_sequence = require("../mover-sequence.cjs");
const require_geometry = require("./geometry.cjs");
const require_joints = require("./joints.cjs");
const require_ccd = require("./ccd.cjs");
const require_physics_ray = require("../../../../src/data/physics-ray.cjs");
const require_ray_intersections = require("./ray-intersections.cjs");
const require_physics_profiles = require("../../../../src/data/physics-profiles.cjs");
const require_debug_geometry = require("./debug-geometry.cjs");
//#region dist/packages/core/src/physics3d/world.js
var alwaysContinue = () => !0;
var E = 0;
var pairsWithin = (e) => !!e.body || e.shape.collider.sensor;
function sleepState(e, t) {
	return t || (e.isSleeping ? 1 : 2);
}
var compareContactRows = (e, t) => e.contactRow - t.contactRow;
var Contact3D = class {
	a;
	b;
	manifold = new require_geometry.Manifold3D();
	normalImpulses = /* @__PURE__ */ new Float64Array(8);
	tangentImpulses = /* @__PURE__ */ new Float64Array(8);
	targets = /* @__PURE__ */ new Float64Array(8);
	tangent = Array.from({ length: 8 }, () => new require_math3d.Vector3());
	normalMass = /* @__PURE__ */ new Float64Array(8);
	tangentMass = /* @__PURE__ */ new Float64Array(8);
	massEpoch = -1;
	seen = 0;
	started = !1;
	ended = !1;
	responds = !1;
	detailA;
	detailB;
	constructor(e, t) {
		this.a = e, this.b = t;
	}
};
var PhysicsWorld3D = class {
	gravity = new require_math3d.Vector3(0, -9.81, 0);
	fixedDelta;
	maxSubSteps;
	solverIterations;
	enabled = !0;
	entries = /* @__PURE__ */ new Map();
	orderedStore = [];
	unregisteredEntries = 0;
	index = new require_spatial.SpatialIndex3D();
	pairCandidates = [];
	pairFirsts = [];
	pairSeconds = [];
	pairLows = [];
	pairHighs = [];
	pairSequence = [];
	comparePairs = (e, t) => this.pairLows[e].order - this.pairLows[t].order || this.pairHighs[e].order - this.pairHighs[t].order;
	queryCandidates = [];
	queryBounds = new require_spatial.Bounds3D();
	sweepTriangles = [];
	leafBounds = new require_spatial.Bounds3D();
	indexDirty = !0;
	poseSnapshot = !1;
	snapshotMovers = [];
	sequencePoses = 0;
	sequenceMembership = -1;
	sequenceMovers = [];
	stepMovers = [];
	membership = 0;
	sweptIndex = new require_spatial.SpatialIndex3D();
	sweptStore = [];
	ccdCandidates = [];
	sweptIndexDirty = !0;
	ccd = new require_ccd.ContinuousCollision3D();
	constraints = [];
	jointSnapshot = [];
	jointLinks = /* @__PURE__ */ new Map();
	placementMatrix = new require_math3d.Matrix4();
	placementPosition = new require_math3d.Vector3();
	placementShape;
	capsuleQueryShape;
	capsuleQueryShapes = /* @__PURE__ */ new WeakMap();
	sweepQueryShape;
	nextOrder = 0;
	counters = {
		candidatePairs: 0,
		narrowphaseTests: 0,
		queryCandidates: 0,
		refreshedLeaves: 0,
		refits: 0,
		poseChecks: 0,
		indexGeneration: 0,
		ccdTests: 0,
		ccdIterations: 0,
		ccdImpacts: 0,
		ccdExhaustions: 0,
		ccdLimitedTime: 0,
		jointRows: 0,
		jointIterations: 0
	};
	stats = this.counters;
	contacts = /* @__PURE__ */ new Map();
	contactRowSerial = 0;
	active = [];
	activeCount = 0;
	narrow = new require_geometry.Narrowphase3D();
	queryNarrow = new require_geometry.Narrowphase3D();
	queryManifold = new require_geometry.Manifold3D();
	queryShape = new require_collider.Shape3D(new require_collider.SphereCollider3D(1));
	impulse = new require_math3d.Vector3();
	crossA = new require_math3d.Vector3();
	crossB = new require_math3d.Vector3();
	inertiaA = new require_math3d.Vector3();
	inertiaB = new require_math3d.Vector3();
	relative = new require_math3d.Vector3();
	contactVelocities = /* @__PURE__ */ new Float64Array(6);
	solveImpulse = new require_math3d.Vector3();
	solveTorque = new require_math3d.Vector3();
	ccdDisplacement = new require_math3d.Vector3();
	torque = new require_math3d.Vector3();
	forces = /* @__PURE__ */ new WeakMap();
	accumulator = 0;
	stepId = 0;
	massEpoch = 0;
	solvePhase = 0;
	disposed = !1;
	destroying = !1;
	stepping = !1;
	droppedTime = 0;
	constructor(e = {}) {
		if (e.gravity && (require_collider.vector3D(e.gravity, `gravity`), this.gravity.set(e.gravity.x, e.gravity.y, e.gravity.z)), this.fixedDelta = require_collider.positive3D(e.fixedDelta ?? require_physics3d.physics3DDefaults.fixedDelta, `fixedDelta`), this.maxSubSteps = e.maxSubSteps ?? require_physics3d.physics3DDefaults.maxSubSteps, this.solverIterations = e.solverIterations ?? require_physics3d.physics3DDefaults.solverIterations, !Number.isInteger(this.maxSubSteps) || this.maxSubSteps < 1 || !Number.isInteger(this.solverIterations) || this.solverIterations < 1) throw RangeError(`Step/iteration counts must be positive integers.`);
	}
	has(e) {
		return this.entries.has(e);
	}
	get size() {
		return this.entries.size;
	}
	get geometryRevision() {
		return this.refreshIndex(), this.counters.indexGeneration;
	}
	withPoseSnapshot(e, t) {
		if (this.poseSnapshot) {
			if (t) throw Error(`A moving pose snapshot cannot be nested.`);
			return e();
		}
		let n = require_mover_sequence.activeMoverSequence();
		if (n !== 0 && this.sequencePoses === n && this.sequenceMembership === this.membership && !this.indexDirty ? this.refreshIndex(this.sequenceMovers) : this.refreshIndex(), this.sequencePoses = n, this.sequenceMembership = this.membership, this.sequenceMovers.length = 0, t) {
			let e = this.snapshotMovers;
			if (this.collectMovers(t), require_spatial.sortByOrder(e), n !== 0) for (let t of e) this.sequenceMovers.push(t);
		}
		this.poseSnapshot = !0;
		try {
			return e();
		} finally {
			this.poseSnapshot = !1, this.snapshotMovers.length = 0;
		}
	}
	collectMovers(e) {
		this.collectInto(e, this.snapshotMovers);
	}
	collectInto(e, t) {
		let n = this.entries.get(e);
		n && t.push(n);
		let r = e.existingChildren;
		if (r) for (let e of r) this.collectInto(e, t);
	}
	refreshMoved() {
		let e = this.stepMovers, t = e.length;
		for (let n = 0; n < t; n++) {
			let t = e[n];
			if (!t.body || t.body.type === `static`) continue;
			let r = t.object.existingChildren;
			if (r) for (let t of r) this.collectInto(t, e);
		}
		require_spatial.sortByOrder(e);
		let n = 0;
		for (let t = 0; t < e.length; t++) (n === 0 || e[n - 1] !== e[t]) && (e[n++] = e[t]);
		e.length = n, this.counters.poseChecks += this.ordered.length - n, this.refreshIndex(e);
	}
	get joints() {
		return this.constraints;
	}
	debugSnapshot() {
		this.refreshIndex();
		let e = new require_debug_geometry.PhysicsDebugSnapshotBuilder3D();
		for (let t of this.ordered) this.valid(t) && e.shape(t.shape);
		let n = new require_math3d.Vector3();
		for (let t = 0; t < this.activeCount; t++) {
			let r = this.active[t];
			if (!this.valid(r.a) || !this.valid(r.b) || r.ended) continue;
			let i = r.manifold;
			for (let t = 0; t < i.count; t++) {
				let r = i.points[t], a = i.normals[t];
				n.set(r.x + a.x * require_physics_profiles.physicsProfiles.debug.normalLength, r.y + a.y * require_physics_profiles.physicsProfiles.debug.normalLength, r.z + a.z * require_physics_profiles.physicsProfiles.debug.normalLength), e.line(r, n, `contact`);
			}
		}
		for (let t of this.constraints) {
			let [r, i] = t.anchors();
			e.line(r, i, `joint`), n.set(r.x + require_physics_profiles.physicsProfiles.debug.normalLength, r.y, r.z), e.line(r, n, `joint`);
		}
		return e.finish();
	}
	addJoint(e) {
		if (this.disposed) throw Error(`PhysicsWorld3D is destroyed.`);
		if (!(e instanceof require_joints.Joint3D)) throw TypeError(`Invalid Joint3D.`);
		if (e.attached) throw Error(`Joint3D is already attached.`);
		let t = this.entries.get(e.bodyA), n = e.bodyB ? this.entries.get(e.bodyB) : void 0;
		if (!t?.body || e.bodyB && !n) throw Error(`Joint bodies must be registered in this PhysicsWorld3D.`);
		if (t.body.type !== `dynamic` && n?.body?.type !== `dynamic`) throw Error(`A joint requires at least one dynamic body.`);
		this.validate(t.object), n && this.validate(n.object), e.attach(this), this.constraints.push(e);
		let r = this.jointLinks.get(e.bodyA);
		return r || this.jointLinks.set(e.bodyA, r = []), r.push(e), e.bodyB && (r = this.jointLinks.get(e.bodyB), r || this.jointLinks.set(e.bodyB, r = []), r.push(e)), e;
	}
	removeJoint(e) {
		let t = this.constraints.indexOf(e);
		if (t < 0) return !1;
		this.constraints.splice(t, 1);
		for (let t = 0; t < 2; t++) {
			let n = t === 0 ? e.bodyA : e.bodyB;
			if (!n) continue;
			let r = this.jointLinks.get(n);
			if (!r) continue;
			let i = r.indexOf(e);
			i >= 0 && r.splice(i, 1), r.length === 0 && this.jointLinks.delete(n);
		}
		return e.detach(), !0;
	}
	connected(e, t) {
		let n = this.jointLinks.get(e.object);
		if (!n) return !1;
		for (let r of n) if (!r.collideConnected && r.enabled && (r.bodyA === e.object && r.bodyB === t.object || r.bodyA === t.object && r.bodyB === e.object)) return !0;
		return !1;
	}
	validate(e) {
		this.validateWith(e, void 0);
	}
	validateWith(e, t) {
		let r = e.collider, i = e.body;
		if (i?.type !== `static` && i && e.parent) throw Error(`Dynamic/kinematic bodies require root Object3D.`);
		if (r && i && i.type !== `static`) {
			if (r.kind === `plane` || r.kind === `mesh`) throw Error(`PlaneCollider3D/TriangleMeshCollider3D are static only.`);
			if (r.offset.x !== 0 || r.offset.y !== 0 || r.offset.z !== 0) throw Error(`Moving body collider offsets are unsupported (origin is center of mass).`);
		}
		if (r) {
			let a = t ?? this.entries.get(e)?.shape, o = a?.collider === r ? a : new require_collider.Shape3D(r);
			(o !== t || !o.composedPurely()) && o.refresh(e), i && o.validateMoving(i.type);
		}
	}
	register(e) {
		if (this.disposed) throw Error(`PhysicsWorld3D is destroyed.`);
		this.validate(e);
		let t = this.entries.get(e), r = e.collider;
		if (t && t.shape.collider === r && t.body === e.body) return;
		let i = e.scene, a = e.registrationGeneration, o = r ? new require_collider.Shape3D(r) : void 0, s = o ? {
			object: e,
			shape: o,
			body: e.body,
			bounds: o.bounds,
			order: this.nextOrder++,
			indexedRevision: -1,
			ccdShape: void 0,
			ccdStopped: !1,
			registered: !1,
			contactRow: -1,
			partnerRows: void 0
		} : void 0;
		s && (s.shape.refresh(e) && ++this.counters.refreshedLeaves, s.body?.refreshInertia(s.shape)), t && this.unregister(e), s && !e.destroyed && e.collider === r && e.body === s.body && e.scene === i && e.registrationGeneration === a && !this.entries.has(e) && (s.registered = !0, this.entries.set(e, s), this.ordered.push(s), ++this.membership, this.sweptEntries.push({
			entry: s,
			bounds: new require_spatial.Bounds3D(),
			order: s.order
		}), this.sweptIndexDirty = !0, this.indexDirty = !0);
	}
	unregister(e) {
		let t = this.entries.get(e);
		if (!t) return;
		for (let t = this.constraints.length - 1; t >= 0; t--) {
			let n = this.constraints[t];
			(n.bodyA === e || n.bodyB === e) && this.removeJoint(n);
		}
		this.entries.delete(e), ++this.membership, t.registered = !1, ++this.unregisteredEntries, t.body && this.forces.delete(t.body), this.indexDirty = !0, this.sweptIndexDirty = !0;
		let n = [];
		if (t.contactRow >= 0 && n.push(t), t.partnerRows) for (let e of t.partnerRows) n.push(e);
		n.sort(compareContactRows);
		for (let e of n) {
			let n = this.contacts.get(e);
			if (n) {
				if (e === t) for (let [t, r] of n) n.delete(t), t.partnerRows?.delete(e), this.end(r);
				else {
					let r = n.get(t);
					r && (n.delete(t), t.partnerRows.delete(e), this.end(r));
				}
				n.size === 0 && (this.contacts.delete(e), e.contactRow = -1);
			}
		}
	}
	get ordered() {
		return this.unregisteredEntries && this.compactEntries(), this.orderedStore;
	}
	get sweptEntries() {
		return this.unregisteredEntries && this.compactEntries(), this.sweptStore;
	}
	compactEntries() {
		this.unregisteredEntries = 0;
		let e = 0;
		for (let t of this.orderedStore) t.registered && (this.orderedStore[e++] = t);
		this.orderedStore.length = e, e = 0;
		for (let t of this.sweptStore) t.entry.registered && (this.sweptStore[e++] = t);
		this.sweptStore.length = e;
	}
	valid(e) {
		return !this.disposed && !e.object.destroyed && e.registered;
	}
	start(e) {
		e.started = !0;
		let t = e.manifold, n = t.points[0], r = t.normal, i = e.a.shape.collider.sensor || e.b.shape.collider.sensor;
		e.detailA = Object.freeze({
			self: e.a.object,
			other: e.b.object,
			point: Object.freeze(n.clone()),
			normal: Object.freeze(r.clone()),
			sensor: i
		}), e.detailB = Object.freeze({
			self: e.b.object,
			other: e.a.object,
			point: e.detailA.point,
			normal: Object.freeze(r.clone().scale(-1)),
			sensor: i
		}), e.a.object.dispatchObjectEvent(`collisionstart`, e.detailA), this.valid(e.a) && this.valid(e.b) && e.b.object.dispatchObjectEvent(`collisionstart`, e.detailB);
	}
	end(e) {
		!e.ended && e.started && (e.ended = !0, !this.destroying && !e.a.shape.collider.sensor && !e.b.shape.collider.sensor && (this.valid(e.a) && e.a.body?.type === `dynamic` && e.a.body.isSleeping && e.a.body.wake(), this.valid(e.b) && e.b.body?.type === `dynamic` && e.b.body.isSleeping && e.b.body.wake()), this.valid(e.a) && e.a.object.dispatchObjectEvent(`collisionend`, e.detailA), this.valid(e.b) && e.b.object.dispatchObjectEvent(`collisionend`, e.detailB));
	}
	forceState(e) {
		let t = this.forces.get(e);
		return t || this.forces.set(e, t = new require_physics_force.PhysicsForceAccumulator()), t;
	}
	sampleForces(e) {
		for (let t of this.ordered) t.body?.type === `dynamic` && this.forceState(t.body).sample(t.body, e);
	}
	sampleFixedForces(e) {
		for (let t of this.ordered) t.body?.type === `dynamic` && this.forceState(t.body).sampleFixed(t.body, e);
	}
	discardFrameTime(e) {
		if (e !== 0) for (let t of this.ordered) t.body && this.forces.get(t.body)?.discard(e);
	}
	get interpolationAlpha() {
		return Math.min(1, Math.max(0, this.accumulator / this.fixedDelta));
	}
	update(e, t = alwaysContinue, n = !0) {
		if (require_collider.finite3D(e, `delta`), e < 0) throw RangeError(`delta must be nonnegative.`);
		if (this.disposed || !this.enabled || !t()) return;
		if (this.stepping) throw Error(`Physics update is not reentrant.`);
		n && this.sampleForces(e), this.accumulator += e;
		let r = this.fixedDelta * this.maxSubSteps;
		if (this.accumulator > r) {
			this.droppedTime += this.accumulator - r;
			for (let e of this.ordered) e.body && this.forces.get(e.body)?.discard(this.accumulator - r);
			this.accumulator = r;
		}
		this.stepping = !0;
		try {
			let e = 0;
			for (; this.accumulator + 1e-12 >= this.fixedDelta && e++ < this.maxSubSteps && this.enabled && t() && !this.disposed;) this.accumulator -= this.fixedDelta, this.step(this.fixedDelta, t);
		} finally {
			this.stepping = !1;
		}
	}
	solveJoints() {
		if (this.jointSnapshot.length !== 0) {
			++this.counters.jointIterations;
			for (let e of this.jointSnapshot) e.belongsTo(this) && e.solveVelocity();
		}
	}
	prepareContact(e, t, n) {
		let r = this.contacts.get(e), i = r?.get(t);
		i || (i = new Contact3D(e, t), r || (this.contacts.set(e, r = /* @__PURE__ */ new Map()), e.contactRow = ++this.contactRowSerial), r.set(t, i), (t.partnerRows ??= /* @__PURE__ */ new Set()).add(e));
		let a = i.manifold;
		a.normal.copy(n.normal), a.distance = n.distance, a.count = n.count;
		for (let r = 0; r < a.count; r++) {
			a.points[r].copy(n.points[r]), a.normals[r].copy(n.normals[r]), a.depths[r] = n.depths[r], i.normalImpulses[r] = 0, i.tangentImpulses[r] = 0, this.velocityAt(e.body, a.points[r], this.relative), this.velocityAt(t.body, a.points[r], this.impulse), this.relative.subtract(this.impulse);
			let o = a.normals[r], s = this.relative.dot(o), c = Math.max(e.body ? e.body.restitution : 0, t.body ? t.body.restitution : 0);
			i.targets[r] = s < -require_physics3d.physics3DDefaults.restitutionThreshold ? -s * c : 0, i.tangent[r].copy(this.relative), i.tangent[r].x -= o.x * s, i.tangent[r].y -= o.y * s, i.tangent[r].z -= o.z * s, i.tangent[r].normalize();
		}
		return i.seen = this.stepId, i;
	}
	moveBodies(e) {
		if (!(e <= 0)) for (let t of this.ordered) {
			let n = t.body;
			if (!n || n.type === `static` || n.isSleeping || t.ccdStopped) continue;
			let r = t.object;
			r.position.x += n.velocity.x * e, r.position.y += n.velocity.y * e, r.position.z += n.velocity.z * e, n.lockRotation || require_ccd.integrateRotation3D(r.rotation, n.angularVelocity, e, r.rotation), t.shape.refresh(r) && ++this.counters.refreshedLeaves, n.refreshInertia(t.shape), this.stepMovers.push(t);
		}
	}
	integrateContinuous(e, t) {
		let n = !1;
		for (let e of this.ordered) if (e.body?.type === `dynamic` && e.body.continuous) {
			n = !0;
			break;
		}
		if (!n) return this.moveBodies(e), !0;
		let r = e, i = 0;
		for (; r > 1e-12 && i < require_physics3d.physics3DDefaults.ccdMaxImpacts;) {
			for (let e of this.sweptEntries) require_ccd.rigidSweptBounds3D(e.entry, r, e.bounds, this.ccdDisplacement), this.sweptIndexDirty || this.sweptIndex.update(e);
			this.sweptIndexDirty &&= (this.sweptIndex.rebuild(this.sweptEntries), !1);
			let e = 1 / 0, n = 1 / 0, a, o, s, c;
			for (let t of this.sweptEntries) {
				let i = t.entry;
				if (i.body?.type === `dynamic` && i.body.continuous) {
					this.sweptIndex.query(t.bounds, this.ccdCandidates);
					for (let t of this.ccdCandidates) {
						let l = t.entry;
						if (l === i || l.body?.type === `dynamic` && l.body.continuous && l.order < i.order) continue;
						let u = i.order < l.order ? i : l, d = i.order < l.order ? l : i, f = u.shape.collider, p = d.shape.collider;
						if (!(f.category & p.mask) || !(p.category & f.mask) || this.connected(u, d)) continue;
						let m = f.sensor || p.sensor;
						if (m && this.contacts.get(u)?.get(d)?.seen === this.stepId) continue;
						++this.counters.ccdTests;
						let h = this.ccd.timeOfImpact(u, d, r, Math.min(e, n));
						this.counters.ccdIterations += this.ccd.iterations, this.ccd.exhausted && !m && this.ccd.safeTime < n && (n = this.ccd.safeTime, s = u, c = d), h < e && (e = h, a = u, o = d);
					}
				}
			}
			if (n <= e && s && c) {
				this.moveBodies(n), r -= n, s.ccdStopped = !0, c.ccdStopped = !0, ++this.counters.ccdExhaustions, this.counters.ccdLimitedTime += r, ++i;
				continue;
			}
			if (!a || !o || e > r) return this.moveBodies(r), !1;
			if (this.moveBodies(e), r -= e, this.narrow.collide(a.shape, o.shape, this.queryManifold), this.queryManifold.distance > require_physics3d.physics3DDefaults.contactMargin) {
				a.ccdStopped = !0, o.ccdStopped = !0, ++this.counters.ccdExhaustions, this.counters.ccdLimitedTime += r, ++i;
				continue;
			}
			let l = this.prepareContact(a, o, this.queryManifold);
			if (l.started || this.start(l), !t() || this.disposed) return !1;
			if (!this.valid(a) || !this.valid(o)) {
				++i;
				continue;
			}
			if (!a.shape.collider.sensor && !o.shape.collider.sensor) {
				a.body?.wake(), o.body?.wake(), ++this.massEpoch, this.solvePhase = ++E;
				for (let e = 0; e < this.solverIterations; e++) {
					for (let e = 0; e < l.manifold.count; e++) this.solve(l, e);
					this.solveJoints();
				}
			}
			++this.counters.ccdImpacts, ++i;
		}
		return r > 1e-12 && (++this.counters.ccdExhaustions, this.counters.ccdLimitedTime += r), !1;
	}
	step(e, t) {
		++this.stepId, this.activeCount = 0, this.counters.ccdTests = 0, this.counters.ccdIterations = 0, this.counters.ccdImpacts = 0, this.counters.ccdExhaustions = 0, this.counters.ccdLimitedTime = 0;
		let n = !this.poseSnapshot;
		this.stepMovers.length = 0, this.refreshIndex(void 0, n ? this.stepMovers : void 0);
		for (let t of this.ordered) {
			t.ccdStopped = !1, this.validateWith(t.object, n ? t.shape : void 0);
			let r = t.body;
			if (r && (r.refreshInertia(t.shape), require_collider.vector3D(r.velocity, `velocity`), require_collider.vector3D(r.angularVelocity, `angularVelocity`), r.type !== `static`)) {
				if (r.type === `dynamic`) {
					let t = this.forceState(r);
					if (t.consume(r, e), r.isSleeping) continue;
					r.velocity.x += (this.gravity.x * r.gravityScale + t.value[0] * r.inverseMass) * e, r.velocity.y += (this.gravity.y * r.gravityScale + t.value[1] * r.inverseMass) * e, r.velocity.z += (this.gravity.z * r.gravityScale + t.value[2] * r.inverseMass) * e, this.torque.set(t.value[3], t.value[4], t.value[5]), r.inverseInertia(this.torque, this.torque), r.angularVelocity.x += this.torque.x * e, r.angularVelocity.y += this.torque.y * e, r.angularVelocity.z += this.torque.z * e, r.velocity.scale(1 / (1 + r.linearDamping * e)), r.angularVelocity.scale(1 / (1 + r.angularDamping * e));
				}
				t.object.capturePhysicsPose();
			}
		}
		this.jointSnapshot.length = 0, this.counters.jointRows = 0;
		for (let t of this.constraints) t.prepare(e), this.counters.jointRows += t.solverRowCount, this.jointSnapshot.push(t);
		this.counters.jointIterations = 0;
		for (let e = 0; e < this.solverIterations; e++) this.solveJoints();
		let r = this.integrateContinuous(e, t);
		if (!t() || this.disposed) return;
		r && n && !this.indexDirty ? this.refreshMoved() : this.refreshIndex(), this.stepMovers.length = 0, this.counters.candidatePairs = 0, this.counters.narrowphaseTests = 0;
		let i = this.pairLows, a = this.pairHighs, o = this.pairSequence, s = 0, l = 0;
		for (let e of this.ordered) pairsWithin(e) && l++;
		if (l >= this.ordered.length * require_physics3d.physics3DDefaults.pairTraversalShare) {
			let e = this.pairFirsts, t = this.pairSeconds;
			this.index.pairs(pairsWithin, require_physics3d.physics3DDefaults.contactMargin, e, t);
			for (let n = 0; n < e.length; n++) {
				let r = e[n], c = t[n];
				o[s] = s, i[s] = c.order < r.order ? c : r, a[s++] = c.order < r.order ? r : c;
			}
		} else for (let e of this.ordered) if (pairsWithin(e)) {
			this.index.query(e.bounds, this.pairCandidates, require_physics3d.physics3DDefaults.contactMargin);
			for (let t of this.pairCandidates) t !== e && (t.order < e.order && pairsWithin(t) || (o[s] = s, i[s] = t.order < e.order ? t : e, a[s++] = t.order < e.order ? e : t));
		}
		i.length = a.length = o.length = s, o.sort(this.comparePairs);
		for (let e of o) {
			let t = i[e], n = a[e];
			this.counters.candidatePairs++;
			let r = t.shape.collider, o = n.shape.collider;
			r.category & o.mask && o.category & r.mask && (this.connected(t, n) || (this.counters.narrowphaseTests++, this.narrow.collide(t.shape, n.shape, this.queryManifold), !(this.queryManifold.distance > require_physics3d.physics3DDefaults.contactMargin) && (this.active[this.activeCount++] = this.prepareContact(t, n, this.queryManifold))));
		}
		this.active.length = this.activeCount;
		for (let e of this.contacts.keys()) {
			let t = this.contacts.get(e);
			for (let n of t.keys()) {
				let r = t.get(n);
				r.seen !== this.stepId && (t.delete(n), n.partnerRows.delete(e), this.end(r));
			}
			t.size === 0 && (this.contacts.delete(e), e.contactRow = -1);
		}
		for (let e of this.active) if (this.valid(e.a) && this.valid(e.b) && (e.started || this.start(e), !t() || this.disposed)) return;
		for (let e of this.active) e.responds = !e.ended && this.valid(e.a) && this.valid(e.b) && !e.a.shape.collider.sensor && !e.b.shape.collider.sensor;
		++this.massEpoch, this.solvePhase = ++E;
		for (let e = 0; e < this.solverIterations; e++) {
			this.solveJoints();
			for (let e of this.active) {
				if (!e.responds) continue;
				let t = e.a.body, n = e.b.body, r = 0, i = 0;
				if (t?.type === `dynamic` && (r = sleepState(t, r)) === 1 && n && n.type !== `static` && (i = sleepState(n, i)) === 2 && this.movingAtContact(n, e.manifold) && (t.wake(), r = 2), n?.type === `dynamic` && (i = sleepState(n, i)) === 1 && t && t.type !== `static` && (r = sleepState(t, r)) === 2 && this.movingAtContact(t, e.manifold) && (n.wake(), i = 2), t && t.type === `dynamic` && sleepState(t, r) !== 1 || n && n.type === `dynamic` && sleepState(n, i) !== 1) for (let t = 0; t < e.manifold.count; t++) this.solve(e, t);
			}
		}
		for (let e of this.jointSnapshot) if (e.belongsTo(this) && (e.reactionForce > e.breakForce || e.reactionTorque > e.breakTorque) && (this.removeJoint(e), e.onBreak?.(e), !t() || this.disposed)) return;
		for (let e of this.active) {
			if (e.ended || !this.valid(e.a) || !this.valid(e.b) || e.a.shape.collider.sensor || e.b.shape.collider.sensor) continue;
			let t = e.a.body, n = e.b.body, r = t ? t.inverseMass : 0, i = n ? n.inverseMass : 0, a = r + i;
			if (a === 0) continue;
			if (e.a.shape.collider.kind === `compound` || e.b.shape.collider.kind === `compound` || e.a.shape.collider.kind === `mesh` || e.b.shape.collider.kind === `mesh`) {
				let o = e.manifold;
				for (let s = 0; s < o.count; s++) {
					let c = Math.max(0, o.depths[s] - require_physics3d.physics3DDefaults.contactSlop) * require_physics3d.physics3DDefaults.correction / (a * o.count), l = o.normals[s];
					if (r && t && !t.isSleeping) {
						let t = e.a.object.position;
						t.x += l.x * c * r, t.y += l.y * c * r, t.z += l.z * c * r;
					}
					if (i && n && !n.isSleeping) {
						let t = e.b.object.position;
						t.x -= l.x * c * i, t.y -= l.y * c * i, t.z -= l.z * c * i;
					}
				}
				continue;
			}
			let o = Math.max(0, -e.manifold.distance - require_physics3d.physics3DDefaults.contactSlop) * require_physics3d.physics3DDefaults.correction / a, s = e.manifold.normal;
			if (r && t && !t.isSleeping) {
				let t = e.a.object.position;
				t.x += s.x * o * r, t.y += s.y * o * r, t.z += s.z * o * r;
			}
			if (i && n && !n.isSleeping) {
				let t = e.b.object.position;
				t.x -= s.x * o * i, t.y -= s.y * o * i, t.z -= s.z * o * i;
			}
		}
		for (let t of this.ordered) {
			let n = t.body;
			n && this.valid(t) && (t.object.sealPhysicsPose(), n.updateSleep(e));
		}
	}
	velocityAt(e, t, n) {
		if (!e || !e.owner) {
			n.set(0, 0, 0);
			return;
		}
		let r = e.owner.position, i = e.angularVelocity, a = t.x - r.x, o = t.y - r.y, s = t.z - r.z;
		n.set(e.velocity.x + i.y * s - i.z * o, e.velocity.y + i.z * a - i.x * s, e.velocity.z + i.x * o - i.y * a);
	}
	movingAtContact(e, t) {
		let n = require_physics3d.physics3DDefaults.sleepVelocity * require_physics3d.physics3DDefaults.sleepVelocity;
		for (let r = 0; r < t.count; r++) if (this.velocityAt(e, t.points[r], this.relative), this.relative.dot(this.relative) > n) return !0;
		return !1;
	}
	effective(e, t, n, r, i) {
		if (!e?.owner || e.type !== `dynamic`) return 0;
		let a = e.owner.position, o = t.x - a.x, s = t.y - a.y, c = t.z - a.z;
		return r.set(s * n.z - c * n.y, c * n.x - o * n.z, o * n.y - s * n.x), e.inverseInertia(r, i), e.inverseMass + r.dot(i);
	}
	prepareMasses(e) {
		let t = e.a.body, n = e.b.body, r = e.manifold;
		for (let i = 0; i < r.count; i++) {
			let a = r.points[i], o = r.normals[i], s = e.tangent[i];
			e.normalMass[i] = this.effective(t, a, o, this.crossA, this.inertiaA) + this.effective(n, a, o, this.crossB, this.inertiaB), e.tangentMass[i] = s.length() < 1e-10 ? NaN : this.effective(t, a, s, this.crossA, this.inertiaA) + this.effective(n, a, s, this.crossB, this.inertiaB);
		}
		e.massEpoch = this.massEpoch;
	}
	velocityInto(e, t, n, r) {
		if (!e || !e.owner) {
			n[r] = n[r + 1] = n[r + 2] = 0;
			return;
		}
		let i = e.owner.position, a = e.angularVelocity, o = t.x - i.x, s = t.y - i.y, c = t.z - i.z;
		n[r] = e.velocity.x + a.y * c - a.z * s, n[r + 1] = e.velocity.y + a.z * o - a.x * c, n[r + 2] = e.velocity.z + a.x * s - a.y * o;
	}
	applyImpulse(e, t, n) {
		if (!e?.owner || e.type !== `dynamic` || e.isSleeping) return;
		let r = this.solveImpulse, i = r.x, a = r.y, o = r.z;
		e.velocity.x += i * e.inverseMass * n, e.velocity.y += a * e.inverseMass * n, e.velocity.z += o * e.inverseMass * n;
		let s = e.owner.position, c = t.x - s.x, l = t.y - s.y, u = t.z - s.z;
		e.addInverseInertia(this.solveTorque.set((l * o - u * a) * n, (u * i - c * o) * n, (c * a - l * i) * n), this.solvePhase);
	}
	solve(e, t) {
		e.massEpoch !== this.massEpoch && this.prepareMasses(e);
		let n = e.a.body, r = e.b.body, i = e.manifold, a = i.points[t], o = i.normals[t], s = this.contactVelocities;
		this.velocityInto(n, a, s, 0), this.velocityInto(r, a, s, 3);
		let c = s[0] - s[3], l = s[1] - s[4], u = s[2] - s[5], d = e.normalMass[t];
		if (d < 1e-12) return;
		let f = e.normalImpulses[t], p = Math.max(0, f + (e.targets[t] - (c * o.x + l * o.y + u * o.z)) / d);
		e.normalImpulses[t] = p, this.solveImpulse.set(o.x * (p - f), o.y * (p - f), o.z * (p - f)), this.applyImpulse(n, a, 1), this.applyImpulse(r, a, -1);
		let m = e.tangent[t], h = e.tangentMass[t];
		if (Number.isNaN(h)) return;
		this.velocityInto(n, a, s, 0), this.velocityInto(r, a, s, 3), c = s[0] - s[3], l = s[1] - s[4], u = s[2] - s[5];
		let g = Math.sqrt((n ? n.friction : .5) * (r ? r.friction : .5)) * p, _ = e.tangentImpulses[t], v = Math.max(-g, Math.min(g, _ - (c * m.x + l * m.y + u * m.z) / h));
		e.tangentImpulses[t] = v, this.solveImpulse.set(m.x * (v - _), m.y * (v - _), m.z * (v - _)), this.applyImpulse(n, a, 1), this.applyImpulse(r, a, -1);
	}
	refreshIndex(e, t) {
		let n = this.poseSnapshot && !this.indexDirty;
		if (n && this.snapshotMovers.length === 0) return;
		let r = this.indexDirty, i;
		try {
			for (let a of e ?? (n ? this.snapshotMovers : this.ordered)) {
				if (!i) {
					let e = a.object.scene;
					e?.beginMatrixPass() && (i = e);
				}
				++this.counters.poseChecks, a.shape.refresh(a.object) && ++this.counters.refreshedLeaves, t && !a.shape.composedPurely() && t.push(a), a.indexedRevision !== a.shape.revision && (r = !0, this.indexDirty || (this.counters.refits += this.index.update(a)), a.indexedRevision = a.shape.revision);
			}
		} finally {
			i?.endMatrixPass();
		}
		this.indexDirty &&= (this.index.rebuild(this.ordered), !1), r && ++this.counters.indexGeneration;
	}
	candidates(e) {
		this.refreshIndex(), this.index.query(e, this.queryCandidates), this.counters.queryCandidates = this.queryCandidates.length;
	}
	accepts(e, t) {
		return this.valid(e) && e.object !== t.ignore && e.object !== t.ignoreAlso && (t.includeSensors || !e.shape.collider.sensor) && !!(e.shape.collider.category & (t.mask ?? 4294967295));
	}
	overlap(e, t, r = {}) {
		let i = new require_collider.Shape3D(e);
		i.refresh(t);
		let a = [];
		this.candidates(i.bounds);
		for (let e of this.queryCandidates) this.accepts(e, r) && (this.queryNarrow.collide(i, e.shape, this.queryManifold), this.queryManifold.distance <= 0 && a.push({
			object: e.object,
			collider: e.shape.collider,
			point: this.queryManifold.points[0].clone(),
			normal: this.queryManifold.normal.clone(),
			distance: 0
		}));
		return a;
	}
	raycast(e, t, n, r = {}) {
		require_collider.vector3D(e, `origin`), require_collider.vector3D(t, `direction`), require_collider.positive3D(n, `maxDistance`);
		let i = require_collider.positive3D(t.length(), `direction length`);
		this.queryShape.center.set(e.x, e.y, e.z), this.queryShape.start.copy(this.queryShape.center), this.queryShape.end.copy(this.queryShape.center), this.queryShape.radius = 0, this.queryShape.updateBounds(), this.impulse.set(t.x / i * n, t.y / i * n, t.z / i * n);
		let a = this.sweepShape(this.queryShape, this.impulse, r, void 0, !0);
		return a?.collider.kind === `plane` && a.normal.x * t.x + a.normal.y * t.y + a.normal.z * t.z > 0 && a.normal.set(-a.normal.x, -a.normal.y, -a.normal.z), a;
	}
	raycastAll(e, n, r, i = {}) {
		require_collider.vector3D(e, `origin`), require_collider.vector3D(n, `direction`), require_collider.positive3D(r, `maxDistance`);
		let a = require_collider.positive3D(n.length(), `direction length`), o = i.maxHits ?? require_physics_ray.physicsRayLimits.hits, l = i.maxTests ?? require_physics_ray.physicsRayLimits.tests;
		if (!Number.isSafeInteger(o) || o < 1 || o > require_physics_ray.physicsRayLimits.hits || !Number.isSafeInteger(l) || l < 1 || l > require_physics_ray.physicsRayLimits.tests) throw RangeError(`Ray intersection limits exceed their bounded integer profile.`);
		let u = this.impulse.set(n.x / a, n.y / a, n.z / a);
		this.queryBounds.reset(), this.queryBounds.add(e), this.queryBounds.add(this.queryShape.center.set(e.x + u.x * r, e.y + u.y * r, e.z + u.z * r)), this.candidates(this.queryBounds);
		let d = [], f = 0;
		for (let n of this.queryCandidates) {
			if (!this.accepts(n, i)) continue;
			let a = n.shape, s = a.collider.kind === `compound` ? a.children.length : 1, emit = (r, i, s, c) => {
				if (d.length === o) throw RangeError(`Ray intersection hit limit exceeded.`);
				d.push({
					object: n.object,
					collider: a.collider,
					distance: r,
					point: new require_math3d.Vector3(e.x + u.x * r, e.y + u.y * r, e.z + u.z * r),
					normal: new require_math3d.Vector3(i, s, c)
				});
			};
			for (let t = 0; t < s; t++) {
				let n = a.collider.kind === `compound` ? a.children[t] : a;
				if (n.bounds.overlaps(this.queryBounds)) {
					if (n.collider.kind === `mesh`) {
						n.triangleIndex.query(this.queryBounds, this.sweepTriangles);
						for (let t of this.sweepTriangles) {
							if (++f > l) throw RangeError(`Ray intersection test limit exceeded.`);
							require_ray_intersections.rayIntersections3D(n, e, u, r, emit, t);
						}
					} else {
						if (++f > l) throw RangeError(`Ray intersection test limit exceeded.`);
						require_ray_intersections.rayIntersections3D(n, e, u, r, emit);
					}
				}
			}
		}
		d.sort((e, t) => e.distance - t.distance);
		let p = 0;
		for (let e = 0; e < d.length; e++) {
			let t = d[e], n = !1;
			for (let e = p - 1; e >= 0; e--) {
				let r = d[e];
				if (t.distance - r.distance > require_physics_ray.physicsRayLimits.tolerance) break;
				if (t.object === r.object && t.normal.dot(r.normal) > 1 - require_physics_ray.physicsRayLimits.tolerance) {
					n = !0;
					break;
				}
			}
			n || (d[p++] = t);
		}
		return d.length = p, d;
	}
	sweepSphere(e, t, n, r = {}, i) {
		return require_collider.vector3D(e, `center`), require_collider.positive3D(t, `radius`), require_collider.vector3D(n, `displacement`), this.queryShape.center.set(e.x, e.y, e.z), this.queryShape.start.copy(this.queryShape.center), this.queryShape.end.copy(this.queryShape.center), this.queryShape.radius = t, this.queryShape.updateBounds(), this.sweepShape(this.queryShape, n, r, i, !1);
	}
	sweepCapsule(e, t, r = {}, a, s = 0) {
		if (!(e.collider instanceof require_collider.CapsuleCollider3D)) throw TypeError(`Capsule sweep requires CapsuleCollider3D.`);
		if (require_collider.vector3D(t, `displacement`), require_collider.finite3D(s, `padding`), s < 0) throw RangeError(`padding must be nonnegative.`);
		let l = this.capsuleQueryShape;
		l?.collider !== e.collider && (l = this.capsuleQueryShapes.get(e.collider), l ? l.forgetPose() : this.capsuleQueryShapes.set(e.collider, l = new require_collider.Shape3D(e.collider)), this.capsuleQueryShape = l), l.refresh(e);
		let u = l.radius;
		l.radius += s, l.updateBounds();
		try {
			return this.sweepShape(l, t, r, a, !1, e);
		} finally {
			l.radius = u, l.updateBounds();
		}
	}
	recoverCapsule(e, t, n) {
		let r = this.entries.get(e);
		if (!r || !(e.collider instanceof require_collider.CapsuleCollider3D)) throw Error(`Recovery requires a registered capsule.`);
		let a = e.position, o = a.x, s = a.y, c = a.z, l = 0;
		for (let i = 0; i < require_physics3d.physics3DDefaults.characterIterations; i++) {
			let i = !1;
			r.shape.refresh(e), this.candidates(r.bounds);
			for (let u of this.queryCandidates) {
				if (u === r || !this.accepts(u, n)) continue;
				r.shape.refresh(e);
				let f = this.queryManifold;
				if (this.queryNarrow.collide(r.shape, u.shape, f), f.distance >= -require_physics3d.physics3DDefaults.sweepTolerance) continue;
				let p = -f.distance + require_physics3d.physics3DDefaults.sweepTolerance;
				if (l += p, l > t) return a.set(o, s, c), !1;
				a.x += f.normal.x * p, a.y += f.normal.y * p, a.z += f.normal.z * p, i = !0;
			}
			if (!i) return !0;
		}
		return a.set(o, s, c), !1;
	}
	canPlaceCapsule(e, t, r, a = {}) {
		if (e.parent) throw Error(`Capsule placement requires a root Object3D.`);
		if (!(t instanceof require_collider.CapsuleCollider3D)) throw TypeError(`Capsule placement requires CapsuleCollider3D.`);
		require_collider.vector3D(r, `position`);
		let o = this.placementShape?.collider === t ? this.placementShape : this.placementShape = new require_collider.Shape3D(t);
		this.placementPosition.set(r.x, r.y, r.z), o.refreshMatrix(this.placementMatrix.compose(this.placementPosition, e.rotation, e.scale)), this.candidates(o.bounds);
		for (let t of this.queryCandidates) if (t.object !== e && this.accepts(t, a) && (this.queryNarrow.collide(o, t.shape, this.queryManifold), this.queryManifold.distance < -require_physics3d.physics3DDefaults.sweepTolerance)) return !1;
		return !0;
	}
	sweep(e, t, r, i = {}, a) {
		require_collider.vector3D(r, `displacement`);
		let o = this.sweepQueryShape?.collider === e ? this.sweepQueryShape : this.sweepQueryShape = new require_collider.Shape3D(e);
		return o.refresh(t), o.validateMoving(`kinematic`), this.sweepShape(o, r, i, a, !1, t);
	}
	sweepShape(e, n, r, i, o, s) {
		let c = n.x, l = n.y, u = n.z, f = require_hypot.hypot3(c, l, u);
		if (f < 1e-12) return;
		let p = 1 + 1e-10, m;
		this.queryBounds.swept(e.bounds, n, require_physics3d.physics3DDefaults.sweepTolerance), this.candidates(this.queryBounds);
		for (let h of this.queryCandidates) {
			if (!this.accepts(h, r) || h.shape === e || h.object === s) continue;
			let g = e.collider.kind === `compound` ? e.children.length : 1, _ = h.shape.collider.kind === `compound` ? h.shape.children.length : 1;
			for (let r = 0; r < g; r++) for (let s = 0; s < _; s++) {
				let g = e.collider.kind === `compound` ? e.children[r] : e, _ = h.shape.collider.kind === `compound` ? h.shape.children[s] : h.shape;
				if (g.collider.kind === `mesh` || g.collider.kind === `plane` || (this.leafBounds.swept(g.bounds, n, require_physics3d.physics3DDefaults.sweepTolerance), !this.leafBounds.overlaps(_.bounds))) continue;
				_.collider instanceof require_collider.TriangleMeshCollider3D && _.triangleIndex.query(this.leafBounds, this.sweepTriangles);
				let v = _.collider.kind === `mesh` ? this.sweepTriangles.length : 1;
				for (let e = 0; e < v; e++) {
					let n = _.collider.kind === `mesh` ? this.sweepTriangles[e] : void 0;
					if (n && _.collider.sidedness === `front` && (g.center.x - n.a.x) * n.normal.x + (g.center.y - n.a.y) * n.normal.y + (g.center.z - n.a.z) * n.normal.z < -require_physics3d.physics3DDefaults.sweepTolerance) continue;
					let r = this.sweepPair(g, _, n, c, l, u, p, o);
					r >= p || (p = r, m = i ?? m ?? {
						object: h.object,
						collider: h.shape.collider,
						point: new require_math3d.Vector3(),
						normal: new require_math3d.Vector3(),
						distance: 0
					}, m.object = h.object, m.collider = h.shape.collider, m.distance = r * f, m.point.copy(this.queryManifold.points[0]), m.normal.copy(this.queryManifold.normal));
				}
			}
		}
		return m;
	}
	sweepPair(e, t, n, r, i, a, o, s) {
		let c = 0, l = 0;
		try {
			for (let u = 0; u < require_physics3d.physics3DDefaults.sweepIterations; u++) {
				let u = c - l;
				e.translate(r * u, i * u, a * u), l = c;
				let f = this.queryManifold;
				n ? this.queryNarrow.triangle(e, n, f) : this.queryNarrow.collide(e, t, f);
				let p = -(r * f.normal.x + i * f.normal.y + a * f.normal.z);
				if (f.distance <= require_physics3d.physics3DDefaults.sweepTolerance) return s || p > 1e-10 || f.distance < -require_physics3d.physics3DDefaults.contactSlop ? c : 1 / 0;
				if (p <= 1e-12 || !Number.isFinite(f.distance) || (c += f.distance / p, c > o || c > 1)) return 1 / 0;
			}
			return 1 / 0;
		} finally {
			e.translate(-r * l, -i * l, -a * l);
		}
	}
	destroy() {
		if (!(this.disposed || this.destroying)) {
			this.destroying = !0;
			for (let e of this.contacts.values()) for (let t of e.values()) this.end(t);
			this.disposed = !0, this.entries.clear(), this.ordered.length = 0, this.contacts.clear(), this.active.length = this.activeCount = 0, this.index.clear(), this.pairCandidates.length = 0, this.pairFirsts.length = this.pairSeconds.length = 0, this.pairLows.length = this.pairHighs.length = this.pairSequence.length = 0, this.queryCandidates.length = 0, this.sweepTriangles.length = 0;
			for (let e of this.constraints) e.detach();
			this.constraints.length = 0, this.jointLinks.clear(), ++this.counters.indexGeneration, this.jointSnapshot.length = 0, this.sweptEntries.length = 0, this.ccdCandidates.length = 0, this.sweptIndex.clear(), this.placementShape = void 0, this.capsuleQueryShape = void 0, this.sweepQueryShape = void 0, this.counters.candidatePairs = 0, this.counters.narrowphaseTests = 0, this.counters.queryCandidates = 0, this.accumulator = 0;
		}
	}
};
//#endregion
exports.PhysicsWorld3D = PhysicsWorld3D;

//# sourceMappingURL=world.cjs.map