const require_index = require("../../../math/src/index.cjs");
const require_event_observers = require("../event-observers.cjs");
const require_scene_object = require("../scene-object.cjs");
const require_world2d = require("../../../../src/data/world2d.cjs");
const require_collider = require("./collider.cjs");
const require_game_object = require("../game-object.cjs");
const require_narrowphase = require("./narrowphase.cjs");
const require_ccd = require("./ccd.cjs");
const require_physics_force = require("../physics-force.cjs");
//#region dist/packages/core/src/physics2d/world.js
var Proxy = class {
	owner;
	collider;
	body;
	geometry;
	contacts = /* @__PURE__ */ new Map();
	inverseMass = 0;
	inverseInertia = 0;
	sleepVisited = 0;
	sleepReady = !1;
	registration = 0;
	ccdStopped = !1;
	ccdUnproven = !1;
	joints = [];
	motion;
	observedGeometry = -1;
	observedCategory = -1;
	observedMask = -1;
	observedSensor = !1;
	geometryChanged() {
		let e = this.observedGeometry !== this.geometry.revision || this.observedCategory !== this.collider.category || this.observedMask !== this.collider.mask || this.observedSensor !== this.collider.sensor;
		return this.observedGeometry = this.geometry.revision, this.observedCategory = this.collider.category, this.observedMask = this.collider.mask, this.observedSensor = this.collider.sensor, e;
	}
	constructor(e, t, n) {
		this.owner = e, this.collider = t, this.body = n, this.geometry = new require_collider.ShapeGeometry(t), this.motion = new require_ccd.ShapeMotion2D(this.geometry);
	}
	refresh() {
		if (this.owner.worldSpace !== `world`) throw Error(`Screen-space colliders are unsupported.`);
		if (this.body && this.body.type !== `static` && this.owner.parent) throw Error(`Moving bodies require root world-space GameObjects.`);
		let e = this.geometry.revision;
		if (this.geometry.refresh(this.owner), (!this.body || this.body.type !== `dynamic`) && e !== this.geometry.revision) {
			for (let e of this.contacts.values()) {
				let t = e.a === this ? e.b : e.a;
				!e.sensor && !e.cancelled && t.body?.wake();
			}
			for (let e of this.joints) e.partner(this)?.body?.wake();
		}
		this.inverseMass = this.body?.inverseMass ?? 0, this.inverseInertia = this.body && this.inverseMass && !this.body.lockRotation ? 1 / (this.body.mass * this.geometry.inertiaPerMass) : 0;
	}
};
var Contact = class {
	a;
	b;
	manifold = new require_narrowphase.Manifold();
	cancelled = !1;
	sensor = !1;
	seen = 0;
	active = !1;
	constructor(e, t) {
		this.a = e, this.b = t;
	}
};
function boundedInteger(e, t, n) {
	if (!Number.isInteger(e) || e < 1 || e > t) throw RangeError(`${n} must be an integer in [1, ${t}].`);
	return e;
}
var compareBounds = (e, t) => e.geometry.minX - t.geometry.minX;
var continueSimulation = () => !0;
var g = require_game_object.GameObject.prototype.dispatchEvent;
var _ = require_scene_object.SceneObject.prototype.dispatchEvent;
function snapshotPoints(e) {
	let t = Array(e.count);
	for (let n = 0; n < e.count; n++) t[n] = e.points[n].clone();
	return Object.freeze(t);
}
var PhysicsWorld2D = class {
	gravity = new require_index.Vector2(0, require_world2d.physicsDefaults.gravityY);
	owners = /* @__PURE__ */ new Map();
	sorted = [];
	activeContacts = /* @__PURE__ */ new Set();
	solveContacts = [];
	get colliderCount() {
		return this.owners.size;
	}
	sleepGroup = [];
	continuous = new require_ccd.ContinuousCollision2D();
	impactManifold = new require_narrowphase.Manifold();
	ccdStats = {
		iterations: 0,
		impacts: 0,
		budgetExhaustions: 0,
		stoppedTime: 0
	};
	continuousIterations = require_world2d.physicsDefaults.ccdIterations;
	continuousImpacts = require_world2d.physicsDefaults.ccdImpacts;
	jointSet = /* @__PURE__ */ new Set();
	activeJoints = [];
	forces = /* @__PURE__ */ new WeakMap();
	queryManifold = new require_narrowphase.Manifold();
	positionManifold = new require_narrowphase.Manifold();
	queryNormal = new require_index.Vector2();
	queryGeometries = /* @__PURE__ */ new WeakMap();
	queryMotions = /* @__PURE__ */ new WeakMap();
	continuation = continueSimulation;
	accumulator = 0;
	stepToken = 0;
	stepping = !1;
	disposed = !1;
	timeStep = require_world2d.physicsDefaults.fixedDelta;
	stepLimit = require_world2d.physicsDefaults.maxSubSteps;
	velocityPasses = require_world2d.physicsDefaults.velocityIterations;
	positionPasses = require_world2d.physicsDefaults.positionIterations;
	droppedTime = 0;
	geometryVersion = 0;
	registrationVersion = 0;
	get geometryRevision() {
		for (let e of this.owners.values()) this.alive(e) && (e.refresh(), e.geometryChanged() && this.geometryVersion++);
		return this.geometryVersion;
	}
	constructor(e = {}) {
		e.gravity && this.gravity.set(require_collider.finite(e.gravity[0], `gravity.x`), require_collider.finite(e.gravity[1], `gravity.y`)), this.fixedDelta = e.fixedDelta ?? this.fixedDelta, this.maxSubSteps = e.maxSubSteps ?? this.maxSubSteps, this.velocityIterations = e.velocityIterations ?? this.velocityIterations, this.positionIterations = e.positionIterations ?? this.positionIterations, this.ccdIterations = e.ccdIterations ?? this.ccdIterations, this.ccdImpacts = e.ccdImpacts ?? this.ccdImpacts;
	}
	get destroyed() {
		return this.disposed;
	}
	get fixedDelta() {
		return this.timeStep;
	}
	set fixedDelta(e) {
		this.timeStep = require_collider.positive(e, `fixedDelta`);
	}
	get maxSubSteps() {
		return this.stepLimit;
	}
	set maxSubSteps(e) {
		this.stepLimit = boundedInteger(e, require_world2d.world2dLimits.maxSubSteps, `maxSubSteps`);
	}
	get velocityIterations() {
		return this.velocityPasses;
	}
	set velocityIterations(e) {
		this.velocityPasses = boundedInteger(e, require_world2d.world2dLimits.solverIterations, `velocityIterations`);
	}
	get positionIterations() {
		return this.positionPasses;
	}
	set positionIterations(e) {
		this.positionPasses = boundedInteger(e, require_world2d.world2dLimits.solverIterations, `positionIterations`);
	}
	get ccdIterations() {
		return this.continuousIterations;
	}
	set ccdIterations(e) {
		this.continuousIterations = boundedInteger(e, require_world2d.world2dLimits.ccdIterations, `ccdIterations`);
	}
	get ccdImpacts() {
		return this.continuousImpacts;
	}
	set ccdImpacts(e) {
		this.continuousImpacts = boundedInteger(e, require_world2d.world2dLimits.ccdImpacts, `ccdImpacts`);
	}
	has(e, t = e.collider) {
		let n = this.owners.get(e);
		return !!n && n.collider === t && this.alive(n);
	}
	membershipRevision(e) {
		return this.owners.get(e)?.registration ?? -1;
	}
	register(e) {
		if (this.destroyed) throw Error(`Cannot register with a destroyed PhysicsWorld2D.`);
		if (e.destroyed) throw Error(`Cannot register a destroyed GameObject.`);
		let t = this.owners.get(e);
		if (!e.collider) {
			this.unregister(e);
			return;
		}
		if (t?.collider === e.collider && t.body === e.body) {
			t.refresh();
			return;
		}
		if (!t && this.owners.size >= require_world2d.world2dLimits.physicsBodies) throw RangeError(`Physics body budget exceeded.`);
		let n = new Proxy(e, e.collider, e.body);
		n.refresh(), e.body?.attach(e), this.unregister(e), !(e.destroyed || e.collider !== n.collider || e.body !== n.body || this.destroyed) && (this.owners.set(e, n), n.registration = ++this.registrationVersion, this.geometryVersion++);
	}
	unregister(e) {
		let t = this.owners.get(e);
		if (t) {
			this.owners.delete(e), this.geometryVersion++, t.body && this.forces.delete(t.body);
			for (let e of [...t.joints]) this.removeJoint(e);
			for (let e of t.contacts.values()) this.end(e);
			t.contacts.clear();
		}
	}
	alive(e) {
		return !this.destroyed && !e.owner.destroyed && this.owners.get(e.owner) === e && e.owner.collider === e.collider && e.owner.body === e.body;
	}
	emit(t, i) {
		for (let a = 0; a < 2; a++) {
			if (i !== `collisionend` && !this.continuation()) return;
			let o = a ? t.b : t.a, s = a ? t.a : t.b;
			if (!this.alive(o) || i !== `collisionend` && (!t.active || !this.alive(s)) || o.owner.dispatchEvent === g && require_scene_object.SceneObject.prototype.dispatchEvent === _ && !require_event_observers.hasObjectEventObservers(o.owner, i)) continue;
			let c = a ? -1 : 1, l = t.manifold, u = this.stepToken, d = {
				self: o.owner,
				other: s.owner,
				normal: new require_index.Vector2(c * l.nx, c * l.ny),
				points: snapshotPoints(l),
				penetration: l.penetration,
				sensor: t.sensor,
				cancelResponse: () => {
					i === `precollision` && this.stepping && this.stepToken === u && (t.cancelled = !0);
				}
			};
			o.owner.dispatchEvent(new CustomEvent(i, { detail: d }));
		}
	}
	end(e) {
		e.active && (e.active = !1, this.activeContacts.delete(e), e.a.contacts.delete(e.b), e.b.contacts.delete(e.a), e.a.body?.wake(), e.b.body?.wake(), this.emit(e, `collisionend`));
	}
	forceState(e) {
		let t = this.forces.get(e);
		return t || this.forces.set(e, t = new require_physics_force.PhysicsForceAccumulator()), t;
	}
	sampleForces(e) {
		for (let t of this.owners.values()) t.body?.type === `dynamic` && this.forceState(t.body).sample(t.body, e);
	}
	sampleFixedForces(e) {
		for (let t of this.owners.values()) t.body?.type === `dynamic` && this.forceState(t.body).sampleFixed(t.body, e);
	}
	discardFrameTime(e) {
		for (let t of this.owners.values()) t.body && this.forces.get(t.body)?.discard(e);
	}
	get interpolationAlpha() {
		return Math.min(1, Math.max(0, this.accumulator / this.fixedDelta));
	}
	update(e, t = continueSimulation, n = !0) {
		if (require_collider.finite(e, `deltaTime`), e < 0) throw RangeError(`deltaTime must be nonnegative.`);
		if (this.destroyed) return;
		if (this.stepping) throw Error(`PhysicsWorld2D cannot update recursively.`);
		if (!t()) {
			this.accumulator = 0;
			return;
		}
		require_collider.finite(this.gravity.x, `gravity.x`), require_collider.finite(this.gravity.y, `gravity.y`), n && this.sampleForces(e);
		let r = require_collider.finite(this.accumulator + e, `accumulated time`), i = Math.floor((r + this.fixedDelta * 1e-9) / this.fixedDelta), a = Math.min(i, this.maxSubSteps), s = i > this.maxSubSteps ? r % this.fixedDelta : 0, c = i > this.maxSubSteps ? Math.max(0, r - this.maxSubSteps * this.fixedDelta - s) : 0;
		if (this.droppedTime += c, c > 0) for (let e of this.owners.values()) e.body && this.forces.get(e.body)?.discard(c);
		this.accumulator = i > this.maxSubSteps ? this.maxSubSteps * this.fixedDelta + s : r, this.stepping = !0, this.continuation = t;
		try {
			for (let e = 0; e < a && !this.destroyed; e++) {
				if (!t()) {
					this.accumulator = 0;
					break;
				}
				if (this.accumulator = Math.max(0, this.accumulator - this.fixedDelta), this.simulate(this.fixedDelta), !t()) {
					this.accumulator = 0;
					break;
				}
			}
		} finally {
			this.solveContacts.length = 0, this.stepping = !1, this.continuation = continueSimulation;
		}
	}
	advanceBodies(e) {
		for (let t of this.sorted) {
			let n = t.body;
			this.alive(t) && n && n.type !== `static` && !n.isSleeping && !t.ccdStopped && (t.owner.position.x += n.velocity.x * e, t.owner.position.y += n.velocity.y * e, n.lockRotation || (t.owner.rotation += n.angularVelocity * e), t.refresh());
		}
	}
	activate(e, t) {
		let { a: n, b: r, manifold: i } = e;
		return e.sensor = n.collider.sensor || r.collider.sensor, e.seen = t, e.cancelled = !1, i.normalImpulses.fill(0), i.tangentImpulses.fill(0), e.active || (e.active = !0, n.contacts.set(r, e), r.contacts.set(n, e), this.activeContacts.add(e), n.body?.wake(), r.body?.wake(), this.emit(e, `collisionstart`)), !this.continuation() || !e.active || !this.alive(n) || !this.alive(r) || (this.emit(e, `precollision`), !this.continuation() || !e.active || !this.alive(n) || !this.alive(r)) ? !1 : (e.sensor || this.prepareBounce(e), this.solveContacts.push(e), !0);
	}
	integrateContinuous(e, t) {
		let n = this.ccdStats;
		n.iterations = n.impacts = n.budgetExhaustions = n.stoppedTime = 0;
		let r = e;
		for (; r > 1e-12 && this.continuation();) {
			let e = 1 / 0, i = 1 / 0, a, o;
			for (let e of this.sorted) e.ccdUnproven = !1, e.ccdStopped ? e.motion.setExplicit(e.owner.position.x, e.owner.position.y, 0, 0) : e.motion.set(e.owner, e.body);
			for (let s = 0; s < this.sorted.length; s++) {
				let c = this.sorted[s];
				if (this.alive(c) && c.body?.ccd) for (let l = 0; l < this.sorted.length; l++) {
					let u = this.sorted[l];
					if (c === u || u.body?.ccd && l <= s || !this.alive(u) || !c.inverseMass && !u.inverseMass || c.collider.sensor || u.collider.sensor || !(c.collider.category & u.collider.mask) || !(u.collider.category & c.collider.mask) || this.jointsBlockContact(c, u)) continue;
					let d = c.contacts.get(u);
					if (d?.seen === t && d.cancelled) continue;
					let f = this.continuous.timeOfImpact(c.motion, u.motion, r, n.impacts >= this.ccdImpacts ? 0 : Math.max(0, this.ccdIterations - n.iterations));
					if (n.iterations += this.continuous.iterations, this.continuous.exhausted && (i = Math.min(i, this.continuous.safeTime), c.ccdUnproven = u.ccdUnproven = !0), f < e) {
						e = f, a = c, o = u;
						let t = this.continuous.manifold, n = this.impactManifold;
						n.nx = t.nx, n.ny = t.ny, n.penetration = t.penetration, n.count = t.count;
						for (let e = 0; e < t.count; e++) n.points[e].copy(t.points[e]);
					}
				}
			}
			if (Number.isFinite(i) && i <= e) {
				let e = Math.min(r, i);
				this.advanceBodies(e), r -= e, n.stoppedTime = Math.max(n.stoppedTime, r), n.budgetExhaustions++;
				for (let e of this.sorted) e.ccdUnproven && e.body?.type !== `static` && (e.ccdStopped = !0);
				continue;
			}
			if (!a || !o || e > r) {
				this.advanceBodies(r);
				return;
			}
			this.advanceBodies(e), r -= e;
			let s = a.contacts.get(o) ?? new Contact(a, o), c = s.manifold, l = this.impactManifold, u = s.a === a ? 1 : -1;
			c.nx = l.nx * u, c.ny = l.ny * u, c.penetration = l.penetration, c.count = l.count;
			for (let e = 0; e < l.count; e++) c.points[e].copy(l.points[e]);
			if (s.seen !== t) {
				if (!this.activate(s, t)) {
					if (!this.continuation()) return;
					continue;
				}
			} else this.prepareBounce(s);
			if (!s.cancelled && s.active) {
				a.body?.wake(), o.body?.wake();
				for (let e = 0; e < this.velocityIterations; e++) this.solveVelocity(s);
			}
			n.impacts++, n.impacts >= this.ccdImpacts && (n.budgetExhaustions++, n.stoppedTime = Math.max(n.stoppedTime, r), a.ccdStopped = o.ccdStopped = !0);
		}
	}
	simulate(e) {
		this.sorted.length = 0, this.solveContacts.length = 0;
		let t = ++this.stepToken;
		for (let t of this.owners.values()) {
			if (!this.alive(t)) {
				this.unregister(t.owner);
				continue;
			}
			t.refresh(), t.ccdStopped = !1;
			let n = t.body;
			if (n?.type === `dynamic`) {
				let r = this.forceState(n);
				r.consume(n, e), n.isSleeping || (require_collider.finite(n.velocity.x, `velocity.x`), require_collider.finite(n.velocity.y, `velocity.y`), t.owner.capturePhysicsPose(), n.velocity.x += (this.gravity.x * n.gravityScale + r.value[0] * t.inverseMass) * e, n.velocity.y += (this.gravity.y * n.gravityScale + r.value[1] * t.inverseMass) * e, n.velocity.scale(1 / (1 + n.linearDamping * e)), n.setSolverAngularVelocity(n.lockRotation ? 0 : (n.angularVelocity + r.value[5] * t.inverseInertia * e) / (1 + n.angularDamping * e)));
			} else n?.type === `kinematic` && (require_collider.finite(n.velocity.x, `velocity.x`), require_collider.finite(n.velocity.y, `velocity.y`), require_collider.finite(n.angularVelocity, `angularVelocity`), t.owner.capturePhysicsPose());
			this.sorted.push(t);
		}
		if (this.integrateContinuous(e, t), this.continuation()) {
			this.sorted.sort(compareBounds);
			for (let e = 0; e < this.sorted.length; e++) {
				let n = this.sorted[e];
				if (this.alive(n)) for (let r = e + 1; r < this.sorted.length; r++) {
					let e = this.sorted[r];
					if (e.geometry.minX > n.geometry.maxX) break;
					if (!this.alive(e) || !(n.collider.category & e.collider.mask) || !(e.collider.category & n.collider.mask)) continue;
					let i = n.collider.sensor || e.collider.sensor;
					if (!i && !n.inverseMass && !e.inverseMass || n.joints.length && this.jointsBlockContact(n, e)) continue;
					let a = n.contacts.get(e);
					if (!a) {
						if (!require_narrowphase.collide(n.geometry, e.geometry, this.queryManifold)) continue;
						a = new Contact(n, e);
					}
					if (a.seen !== t && require_narrowphase.collide(n.geometry, e.geometry, a.manifold) && (a.sensor = i, a.seen = t, !a.active || i ? (n.body?.isSleeping && n.body.wake(), e.body?.isSleeping && e.body.wake()) : n.body?.type === `dynamic` && e.body?.type === `dynamic` && (!n.body.isSleeping && e.body.isSleeping && e.body.wake(), !e.body.isSleeping && n.body.isSleeping && n.body.wake()), !this.activate(a, t) && !this.continuation())) return;
				}
			}
			for (let e of this.activeContacts) if (e.seen !== t && this.end(e), !this.continuation()) return;
			this.wakeContactGroups(t), this.prepareJoints(e);
			for (let t = 0; t < this.velocityIterations; t++) {
				for (let t of this.activeJoints) t.solveVelocity(e);
				for (let e of this.solveContacts) e.active && !e.cancelled && !e.sensor && this.alive(e.a) && this.alive(e.b) && !(e.a.body?.isSleeping || e.b.body?.isSleeping) && this.solveVelocity(e);
			}
			for (let e = 0; e < this.positionIterations; e++) {
				for (let e of this.activeJoints) e.solvePosition();
				for (let e of this.solveContacts) e.active && !e.cancelled && !e.sensor && this.alive(e.a) && this.alive(e.b) && !(e.a.body?.isSleeping || e.b.body?.isSleeping) && this.solvePosition(e);
			}
			this.breakJoints();
			for (let e of this.solveContacts) if (e.active && this.emit(e, `postcollision`), !this.continuation()) return;
			for (let e of this.sorted) this.alive(e) && e.owner.sealPhysicsPose();
			for (let t of this.sorted) t.sleepReady = t.body?.updateSleep(e) ?? !1;
			for (let e of this.sorted) {
				if (!e.inverseMass || e.sleepVisited === t) continue;
				this.sleepGroup.length = 0, this.sleepGroup.push(e), e.sleepVisited = t;
				let n = !0;
				for (let e = 0; e < this.sleepGroup.length; e++) {
					let r = this.sleepGroup[e];
					n &&= r.sleepReady;
					for (let e of r.contacts.values()) {
						if (e.sensor || e.cancelled) continue;
						let i = e.a === r ? e.b : e.a;
						i.body?.type === `kinematic` && (i.body.velocity.x !== 0 || i.body.velocity.y !== 0 || i.body.angularVelocity !== 0) && (n = !1), i.inverseMass && i.sleepVisited !== t && (i.sleepVisited = t, this.sleepGroup.push(i));
					}
					for (let e of r.joints) {
						let i = e.partner(r), a = i && this.owners.get(i.owner);
						i?.body?.type === `kinematic` && (i.body.velocity.x !== 0 || i.body.velocity.y !== 0 || i.body.angularVelocity !== 0) && (n = !1), a?.inverseMass && a.sleepVisited !== t && (a.sleepVisited = t, this.sleepGroup.push(a));
					}
				}
				if (n) for (let e of this.sleepGroup) e.body?.sleep();
			}
		}
	}
	wakeContactGroups(e) {
		for (let t of this.sorted) if (t.inverseMass && !t.body?.isSleeping && t.sleepVisited !== -e) {
			this.sleepGroup.length = 0, this.sleepGroup.push(t), t.sleepVisited = -e;
			for (let t = 0; t < this.sleepGroup.length; t++) {
				let n = this.sleepGroup[t];
				for (let t of n.contacts.values()) {
					if (t.sensor || t.cancelled) continue;
					let r = t.a === n ? t.b : t.a;
					r.inverseMass && r.sleepVisited !== -e && (r.body?.isSleeping && r.body.wake(), r.sleepVisited = -e, this.sleepGroup.push(r));
				}
				for (let t of n.joints) {
					let r = t.partner(n), i = r && this.owners.get(r.owner);
					i?.inverseMass && i.sleepVisited !== -e && (i.body?.isSleeping && i.body.wake(), i.sleepVisited = -e, this.sleepGroup.push(i));
				}
			}
		}
	}
	prepareBounce(e) {
		let { a: t, b: n, manifold: r } = e, a = Math.max(t.body?.restitution ?? 0, n.body?.restitution ?? 0), o = Math.max(require_world2d.physicsDefaults.restitutionThreshold, Math.hypot(this.gravity.x, this.gravity.y) * this.fixedDelta * require_world2d.physicsDefaults.restitutionGravitySteps);
		for (let e = 0; e < r.count; e++) {
			let i = r.points[e], s = t.body?.velocity, c = n.body?.velocity, l = t.body && t.body.type !== `static` && !t.body.lockRotation ? t.body.angularVelocity : 0, u = n.body && n.body.type !== `static` && !n.body.lockRotation ? n.body.angularVelocity : 0, d = i.x - t.owner.position.x, f = i.y - t.owner.position.y, p = i.x - n.owner.position.x, m = i.y - n.owner.position.y, h = (n.body?.type === `static` ? 0 : c?.x ?? 0) - u * m - ((t.body?.type === `static` ? 0 : s?.x ?? 0) - l * f), g = (n.body?.type === `static` ? 0 : c?.y ?? 0) + u * p - ((t.body?.type === `static` ? 0 : s?.y ?? 0) + l * d), _ = h * r.nx + g * r.ny;
			r.bounceVelocities[e] = _ < -o ? -a * _ : 0;
		}
	}
	solveVelocity(e) {
		let { a: t, b: n, manifold: r } = e, i = Math.sqrt((t.body?.friction ?? .5) * (n.body?.friction ?? .5));
		for (let e = 0; e < r.count; e++) {
			let a = r.points[e], o = a.x - t.owner.position.x, s = a.y - t.owner.position.y, c = a.x - n.owner.position.x, l = a.y - n.owner.position.y, u = o * r.ny - s * r.nx, d = c * r.ny - l * r.nx, f = t.inverseMass + n.inverseMass + u * u * t.inverseInertia + d * d * n.inverseInertia;
			if (f <= 0) continue;
			let p = t.body?.velocity, m = n.body?.velocity, h = t.body && t.body.type !== `static` && !t.body.lockRotation ? t.body.angularVelocity : 0, g = n.body && n.body.type !== `static` && !n.body.lockRotation ? n.body.angularVelocity : 0, _ = (n.body?.type === `static` ? 0 : m?.x ?? 0) - g * l - ((t.body?.type === `static` ? 0 : p?.x ?? 0) - h * s), v = (n.body?.type === `static` ? 0 : m?.y ?? 0) + g * c - ((t.body?.type === `static` ? 0 : p?.y ?? 0) + h * o), y = r.normalImpulses[e];
			r.normalImpulses[e] = Math.max(0, y + (r.bounceVelocities[e] - _ * r.nx - v * r.ny) / f);
			let b = r.normalImpulses[e] - y;
			this.impulse(t, n, b * r.nx, b * r.ny, o, s, c, l), h = t.body && t.body.type !== `static` && !t.body.lockRotation ? t.body.angularVelocity : 0, g = n.body && n.body.type !== `static` && !n.body.lockRotation ? n.body.angularVelocity : 0, _ = (n.body?.type === `static` ? 0 : m?.x ?? 0) - g * l - ((t.body?.type === `static` ? 0 : p?.x ?? 0) - h * s), v = (n.body?.type === `static` ? 0 : m?.y ?? 0) + g * c - ((t.body?.type === `static` ? 0 : p?.y ?? 0) + h * o);
			let x = -r.ny, S = r.nx, C = o * S - s * x, w = c * S - l * x, T = t.inverseMass + n.inverseMass + C * C * t.inverseInertia + w * w * n.inverseInertia, E = i * r.normalImpulses[e], D = r.tangentImpulses[e];
			r.tangentImpulses[e] = Math.max(-E, Math.min(E, D - (_ * x + v * S) / T));
			let O = r.tangentImpulses[e] - D;
			this.impulse(t, n, O * x, O * S, o, s, c, l);
		}
	}
	impulse(e, t, n, r, i, a, o, s) {
		e.body && e.inverseMass && (e.body.velocity.x -= n * e.inverseMass, e.body.velocity.y -= r * e.inverseMass, e.body.setSolverAngularVelocity(e.body.angularVelocity - (i * r - a * n) * e.inverseInertia)), t.body && t.inverseMass && (t.body.velocity.x += n * t.inverseMass, t.body.velocity.y += r * t.inverseMass, t.body.setSolverAngularVelocity(t.body.angularVelocity + (o * r - s * n) * t.inverseInertia));
	}
	solvePosition(e) {
		let { a: t, b: n } = e, r = this.positionManifold;
		if (t.refresh(), n.refresh(), !require_narrowphase.collide(t.geometry, n.geometry, r)) return;
		let a = Math.max(0, r.penetration - require_world2d.physicsDefaults.penetrationSlop);
		if (a) for (let e = 0; e < r.count; e++) {
			let o = r.points[e], s = o.x - t.owner.position.x, c = o.y - t.owner.position.y, l = o.x - n.owner.position.x, u = o.y - n.owner.position.y, d = s * r.ny - c * r.nx, f = l * r.ny - u * r.nx, p = t.inverseMass + n.inverseMass + d * d * t.inverseInertia + f * f * n.inverseInertia, m = a * require_world2d.physicsDefaults.positionCorrection / (p * r.count);
			t.inverseMass && (t.owner.position.x -= r.nx * m * t.inverseMass, t.owner.position.y -= r.ny * m * t.inverseMass, t.owner.rotation -= d * m * t.inverseInertia), n.inverseMass && (n.owner.position.x += r.nx * m * n.inverseMass, n.owner.position.y += r.ny * m * n.inverseMass, n.owner.rotation += f * m * n.inverseInertia);
		}
	}
	overlap(t, n) {
		if (this.destroyed) throw Error(`Cannot query a destroyed PhysicsWorld2D.`);
		let r = this.queryGeometries.get(t);
		r || (r = new require_collider.ShapeGeometry(t), this.queryGeometries.set(t, r)), r.refresh(n);
		let i = [];
		for (let a of this.owners.values()) {
			if (a.owner === n || !this.alive(a) || !(t.category & a.collider.mask) || !(a.collider.category & t.mask) || (a.refresh(), !require_narrowphase.collide(r, a.geometry, this.queryManifold))) continue;
			let o = this.queryManifold;
			i.push({
				owner: a.owner,
				collider: a.collider,
				normal: new require_index.Vector2(o.nx, o.ny),
				points: snapshotPoints(o),
				penetration: o.penetration,
				sensor: t.sensor || a.collider.sensor
			});
		}
		return i;
	}
	sweep(t, n, r, i = {}, a = {
		hit: !1,
		owner: void 0,
		collider: void 0,
		fraction: 1,
		safeFraction: 1,
		exhausted: !1,
		point: new require_index.Vector2(),
		normal: new require_index.Vector2()
	}) {
		if (this.destroyed) throw Error(`Cannot query a destroyed PhysicsWorld2D.`);
		require_collider.finite(r.x, `displacement.x`), require_collider.finite(r.y, `displacement.y`);
		let s = require_collider.unsigned(i.mask ?? 4294967295, `mask`), u = this.queryMotions.get(t);
		u || (u = new require_ccd.ShapeMotion2D(new require_collider.ShapeGeometry(t)), this.queryMotions.set(t, u)), u.geometry.refresh(n), u.setExplicit(n.position.x, n.position.y, r.x, r.y), a.hit = !1, a.owner = void 0, a.collider = void 0, a.fraction = a.safeFraction = 1, a.exhausted = !1, a.normal.set(0, 0), a.point.set(0, 0);
		for (let e of this.owners.values()) {
			if (e.owner === n || e.owner === i.ignore || e.owner === i.ignoreOther || !this.alive(e) || !i.includeSensors && e.collider.sensor || !(t.category & e.collider.mask) || !(e.collider.category & t.mask & s)) continue;
			e.refresh(), e.motion.setExplicit(e.owner.position.x, e.owner.position.y, 0, 0);
			let r = this.continuous.timeOfImpact(u, e.motion, 1, this.ccdIterations);
			if (this.continuous.exhausted && (a.exhausted = !0, a.safeFraction = Math.min(a.safeFraction, this.continuous.safeTime)), r < a.fraction) {
				let t = this.continuous.manifold;
				a.hit = !0, a.owner = e.owner, a.collider = e.collider, a.fraction = r, a.normal.set(-t.nx, -t.ny), a.point.copy(t.points[0]);
			}
		}
		return a.safeFraction = Math.min(a.safeFraction, a.fraction), a.safeFraction < a.fraction && (a.hit = !1, a.owner = void 0, a.collider = void 0, a.normal.set(0, 0), a.point.set(0, 0)), a;
	}
	raycast(t, n, r, i = 4294967295) {
		if (this.destroyed) throw Error(`Cannot query a destroyed PhysicsWorld2D.`);
		if (require_collider.finite(t.x, `origin.x`), require_collider.finite(t.y, `origin.y`), require_collider.finite(n.x, `direction.x`), require_collider.finite(n.y, `direction.y`), require_collider.finite(r, `maxDistance`), require_collider.unsigned(i, `mask`), r < 0) throw RangeError(`maxDistance must be nonnegative.`);
		let a = require_collider.positive(n.length(), `direction length`), c = n.x / a, u = n.y / a, d = [];
		for (let n of this.owners.values()) {
			if (!this.alive(n) || !(n.collider.category & i)) continue;
			n.refresh();
			let a = require_narrowphase.rayDistance(n.geometry, t.x, t.y, c, u, r, this.queryNormal);
			a !== void 0 && d.push({
				owner: n.owner,
				collider: n.collider,
				distance: a,
				point: new require_index.Vector2(t.x + c * a, t.y + u * a),
				normal: this.queryNormal.clone()
			});
		}
		return d.sort((e, t) => e.distance - t.distance), d;
	}
	addJoint(e) {
		if (this.destroyed) throw Error(`Cannot add a joint to a destroyed PhysicsWorld2D.`);
		if (e.attached || this.jointSet.has(e)) throw Error(`Joint is already attached to a PhysicsWorld2D.`);
		if (this.jointSet.size >= require_world2d.world2dLimits.physicsJoints) throw RangeError(`Physics joint budget exceeded.`);
		let t = this.owners.get(e.bodyA), n = e.bodyB ? this.owners.get(e.bodyB) : void 0;
		if (!t || e.bodyB && !n) throw Error(`Joint bodies must be registered with this PhysicsWorld2D.`);
		if (!t.inverseMass && !n?.inverseMass) throw Error(`A joint needs at least one dynamic body.`);
		return e.attach(this, t, n), this.jointSet.add(e), t.body?.wake(), n?.body?.wake(), e;
	}
	removeJoint(e) {
		if (!this.jointSet.delete(e)) return !1;
		let [t, n] = e.views;
		return e.detach(), t.body?.wake(), n.body?.wake(), !0;
	}
	get joints() {
		return [...this.jointSet];
	}
	prepareJoints(e) {
		this.activeJoints.length = 0;
		for (let t of this.jointSet) {
			let [n, r] = t.views;
			t.resting || (n.body?.isSleeping && n.body.wake(), r.body?.isSleeping && r.body.wake(), t.prepare(e), this.activeJoints.push(t));
		}
	}
	breakJoints() {
		for (let e of [...this.activeJoints]) e.attached && e.reactionForce > e.breakForce && this.removeJoint(e) && e.onBreak?.(e);
		this.activeJoints.length = 0;
	}
	jointsBlockContact(e, t) {
		for (let n of e.joints) if (!n.collideConnected && n.partner(e) === t) return !0;
		return !1;
	}
	debugSnapshot() {
		let e = [];
		for (let t of this.owners.values()) {
			let n = t.geometry;
			e.push({
				kind: t.collider.kind,
				x: n.x,
				y: n.y,
				radius: n.radius,
				points: Array.from(n.points),
				bounds: [
					n.minX,
					n.minY,
					n.maxX,
					n.maxY
				],
				dynamic: t.body?.type === `dynamic`,
				sensor: t.collider.sensor,
				sleeping: t.body?.isSleeping ?? !1
			});
		}
		let t = [];
		for (let e of this.activeContacts) {
			let n = e.manifold;
			t.push({
				points: snapshotPoints(n).map((e) => [e.x, e.y]),
				normal: [n.nx, n.ny],
				sensor: e.sensor
			});
		}
		return {
			shapes: e,
			contacts: t,
			joints: [...this.jointSet].map((e) => ({
				type: e.type,
				anchors: e.anchors()
			}))
		};
	}
	clear() {
		for (let e of this.owners.keys()) this.unregister(e);
		this.sorted.length = 0, this.accumulator = 0;
	}
	destroy() {
		this.destroyed || (this.clear(), this.disposed = !0);
	}
};
//#endregion
exports.PhysicsWorld2D = PhysicsWorld2D;

//# sourceMappingURL=world.cjs.map