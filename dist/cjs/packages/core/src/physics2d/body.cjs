const require_index = require("../../../math/src/index.cjs");
const require_world2d = require("../../../../src/data/world2d.cjs");
const require_collider = require("./collider.cjs");
//#region dist/packages/core/src/physics2d/body.js
function nonnegative(e, n) {
	if (require_collider.finite(e, n), e < 0) throw RangeError(`${n} must be nonnegative.`);
	return e;
}
var RigidBody2D = class {
	velocity = new require_index.Vector2();
	accumulatedForce = new require_index.Vector2();
	accumulatedTorque = 0;
	forceEpoch = 0;
	owningObject;
	geometry;
	compoundGeometry;
	compoundTransform;
	compoundInertiaPerMass = 0;
	bodyMass = 1;
	bounce = 0;
	surfaceFriction = .5;
	linearDrag = 0;
	angularDrag = 0;
	gravityMultiplier = 1;
	spin = 0;
	sleeping = !1;
	sleepEnabled = !0;
	idleTime = 0;
	sleepX = 0;
	sleepY = 0;
	sleepAngle = 0;
	sleepScaleX = 1;
	sleepScaleY = 1;
	type;
	lockRotation;
	ccd;
	constructor(e = {}) {
		if (this.type = e.type ?? `dynamic`, ![
			`static`,
			`dynamic`,
			`kinematic`
		].includes(this.type)) throw RangeError(`Invalid body type.`);
		this.mass = e.mass ?? 1, this.restitution = e.restitution ?? 0, this.friction = e.friction ?? .5, this.linearDamping = e.linearDamping ?? 0, this.angularDamping = e.angularDamping ?? 0, this.gravityScale = e.gravityScale ?? 1, this.lockRotation = e.lockRotation ?? !1, this.ccd = e.ccd ?? !1, this.allowSleep = e.allowSleep ?? !0;
	}
	get allowSleep() {
		return this.sleepEnabled;
	}
	set allowSleep(e) {
		this.sleepEnabled = e, e || this.wake();
	}
	get isSleeping() {
		let e = this.owner;
		return this.sleeping && (this.velocity.x !== 0 || this.velocity.y !== 0 || this.spin !== 0 || e && (e.position.x !== this.sleepX || e.position.y !== this.sleepY || e.rotation !== this.sleepAngle || e.scale.x !== this.sleepScaleX || e.scale.y !== this.sleepScaleY)) && this.wake(), this.sleeping;
	}
	wake() {
		this.sleeping = !1, this.idleTime = 0;
	}
	setSolverAngularVelocity(e) {
		this.spin = require_collider.finite(e, `angularVelocity`);
	}
	updateSleep(e) {
		return !this.allowSleep || this.type !== `dynamic` ? !1 : this.velocity.x ** 2 + this.velocity.y ** 2 > require_world2d.physicsDefaults.sleepLinearVelocity ** 2 || Math.abs(this.spin) > require_world2d.physicsDefaults.sleepAngularVelocity ? (this.idleTime = 0, !1) : (this.idleTime += e, this.idleTime >= require_world2d.physicsDefaults.sleepTime);
	}
	sleep() {
		let e = this.owner;
		e && this.allowSleep && this.type === `dynamic` && (this.sleeping = !0, this.velocity.set(0, 0), this.spin = 0, this.sleepX = e.position.x, this.sleepY = e.position.y, this.sleepAngle = e.rotation, this.sleepScaleX = e.scale.x, this.sleepScaleY = e.scale.y);
	}
	get owner() {
		return this.owningObject;
	}
	get mass() {
		return this.bodyMass;
	}
	set mass(e) {
		this.bodyMass = require_collider.positive(e, `mass`);
	}
	get restitution() {
		return this.bounce;
	}
	set restitution(e) {
		if (require_collider.finite(e, `restitution`), e < 0 || e > 1) throw RangeError(`restitution must be in [0, 1].`);
		this.bounce = e;
	}
	get friction() {
		return this.surfaceFriction;
	}
	set friction(e) {
		this.surfaceFriction = nonnegative(e, `friction`);
	}
	get linearDamping() {
		return this.linearDrag;
	}
	set linearDamping(e) {
		this.linearDrag = nonnegative(e, `linearDamping`);
	}
	get angularDamping() {
		return this.angularDrag;
	}
	set angularDamping(e) {
		this.angularDrag = nonnegative(e, `angularDamping`);
	}
	get gravityScale() {
		return this.gravityMultiplier;
	}
	set gravityScale(e) {
		this.gravityMultiplier = require_collider.finite(e, `gravityScale`);
	}
	get angularVelocity() {
		return this.spin;
	}
	set angularVelocity(e) {
		this.wake(), this.spin = require_collider.finite(e, `angularVelocity`);
	}
	get force() {
		return this.accumulatedForce;
	}
	get torque() {
		return this.accumulatedTorque;
	}
	get inverseMass() {
		return this.type === `dynamic` ? 1 / this.mass : 0;
	}
	get inverseInertia() {
		if (this.type !== `dynamic` || this.lockRotation) return 0;
		let e = this.owner;
		if (!e?.collider) return 0;
		if (e.colliderPieces) {
			let t = e.colliderPieces;
			(!this.compoundGeometry || this.compoundGeometry[0]?.collider !== t[0]) && (this.compoundGeometry = t.map((e) => new require_collider.ShapeGeometry(e)), this.compoundTransform = (/* @__PURE__ */ new Float64Array(4)).fill(NaN));
			let i = e.updateWorldMatrix().elements, a = this.compoundTransform;
			if (a[0] !== i[0] || a[1] !== i[1] || a[2] !== i[3] || a[3] !== i[4]) {
				let t = 0, r = 0;
				for (let n of this.compoundGeometry) n.refresh(e), t += n.area, r += n.area * n.inertiaPerMass;
				this.compoundInertiaPerMass = require_collider.positive(r / t, `compound inertia`), a[0] = i[0], a[1] = i[1], a[2] = i[3], a[3] = i[4];
			}
			return 1 / (this.mass * this.compoundInertiaPerMass);
		}
		return this.geometry?.collider !== e.collider && (this.geometry = new require_collider.ShapeGeometry(e.collider)), this.geometry.refresh(e), 1 / (this.mass * this.geometry.inertiaPerMass);
	}
	attach(e) {
		if (this.owner && this.owner !== e) throw Error(`RigidBody2D already belongs to another GameObject.`);
		if (e.destroyed) throw Error(`Cannot attach a body to a destroyed GameObject.`);
		if (this.type !== `static` && (e.parent || e.worldSpace !== `world`)) throw Error(`Moving bodies require root world-space GameObjects.`);
		if (e.worldSpace !== `world`) throw Error(`Screen-space physics is unsupported.`);
		this.owningObject = e;
	}
	detach(e) {
		this.owner === e && (this.owningObject = void 0, this.geometry = void 0, this.compoundGeometry = void 0, this.compoundTransform = void 0);
	}
	applyForce(e, n) {
		if (require_collider.finite(e.x, `force.x`), require_collider.finite(e.y, `force.y`), n && (require_collider.finite(n.x, `worldPoint.x`), require_collider.finite(n.y, `worldPoint.y`)), this.type === `dynamic`) {
			if (n && !this.owner) throw Error(`A world-point force requires a bound body.`);
			this.wake(), this.accumulatedForce.add(e), n && this.owner && (this.accumulatedTorque += (n.x - this.owner.position.x) * e.y - (n.y - this.owner.position.y) * e.x);
		}
	}
	applyImpulse(e, n) {
		if (require_collider.finite(e.x, `impulse.x`), require_collider.finite(e.y, `impulse.y`), n && (require_collider.finite(n.x, `worldPoint.x`), require_collider.finite(n.y, `worldPoint.y`)), this.type === `dynamic`) {
			if (n && !this.owner) throw Error(`A world-point impulse requires a bound body.`);
			this.wake(), this.velocity.x += e.x * this.inverseMass, this.velocity.y += e.y * this.inverseMass, n && this.owner && (this.angularVelocity += this.inverseInertia * ((n.x - this.owner.position.x) * e.y - (n.y - this.owner.position.y) * e.x));
		}
	}
	clearForces() {
		++this.forceEpoch, this.accumulatedForce.set(0, 0), this.accumulatedTorque = 0;
	}
};
//#endregion
exports.RigidBody2D = RigidBody2D;

//# sourceMappingURL=body.cjs.map