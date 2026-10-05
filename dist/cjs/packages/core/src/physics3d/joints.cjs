const require_math3d = require("../../../math/src/math3d.cjs");
const require_physics3d = require("../../../../src/data/physics3d.cjs");
const require_collider = require("./collider.cjs");
//#region dist/packages/core/src/physics3d/joints.js
var Frame3D = class {
	position = new require_math3d.Vector3();
	axes = [
		new require_math3d.Vector3(1, 0, 0),
		new require_math3d.Vector3(0, 1, 0),
		new require_math3d.Vector3(0, 0, 1)
	];
	read(e) {
		if (!e) return;
		let t = e.updateWorldMatrix().elements;
		this.position.set(t[12], t[13], t[14]);
		for (let e = 0; e < 3; e++) this.axes[e].set(t[e * 4], t[e * 4 + 1], t[e * 4 + 2]).normalize();
	}
	local(e, t) {
		t.set(this.axes[0].dot(e), this.axes[1].dot(e), this.axes[2].dot(e));
	}
	world(e, t) {
		let n = this.axes;
		t.set(n[0].x * e.x + n[1].x * e.y + n[2].x * e.z, n[0].y * e.x + n[1].y * e.y + n[2].y * e.z, n[0].z * e.x + n[1].z * e.y + n[2].z * e.z);
	}
};
var Row3D = class {
	axis = new require_math3d.Vector3();
	angularA = new require_math3d.Vector3();
	angularB = new require_math3d.Vector3();
	responseA = new require_math3d.Vector3();
	responseB = new require_math3d.Vector3();
	angular = !1;
	mass = 0;
	bias = 0;
	gamma = 0;
	impulse = 0;
	lower = -1 / 0;
	upper = 1 / 0;
};
var Joint3D = class {
	bodyA;
	bodyB;
	collideConnected;
	breakForce;
	breakTorque;
	onBreak;
	worldOwner;
	active = !0;
	anchorA = new require_math3d.Vector3();
	anchorB = new require_math3d.Vector3();
	localA = new require_math3d.Vector3();
	localB = new require_math3d.Vector3();
	frameA = new Frame3D();
	frameB = new Frame3D();
	objectA;
	objectB;
	solverA;
	solverB;
	rA = new require_math3d.Vector3();
	rB = new require_math3d.Vector3();
	pointA = new require_math3d.Vector3();
	pointB = new require_math3d.Vector3();
	error = new require_math3d.Vector3();
	scratch = new require_math3d.Vector3();
	rows = Array.from({ length: 8 }, () => new Row3D());
	rowCount = 0;
	stepRate = 0;
	reaction = new require_math3d.Vector3();
	angularReaction = new require_math3d.Vector3();
	constructor(e) {
		if (e.bodyA === e.bodyB) throw RangeError(`A joint requires distinct bodies.`);
		this.bodyA = e.bodyA, this.bodyB = e.bodyB, require_collider.vector3D(e.anchor, `anchor`), require_collider.vector3D(e.anchorB ?? e.anchor, `anchorB`), this.anchorA.set(e.anchor.x, e.anchor.y, e.anchor.z);
		let t = e.anchorB ?? e.anchor;
		if (this.anchorB.set(t.x, t.y, t.z), this.collideConnected = e.collideConnected ?? !1, this.breakForce = e.breakForce ?? 1 / 0, this.breakTorque = e.breakTorque ?? 1 / 0, !(this.breakForce > 0) || !(this.breakTorque > 0)) throw RangeError(`Joint break thresholds must be positive.`);
	}
	get attached() {
		return this.worldOwner !== void 0;
	}
	belongsTo(e) {
		return this.worldOwner === e;
	}
	get enabled() {
		return this.active;
	}
	set enabled(e) {
		this.active = e, this.wake();
	}
	get reactionForce() {
		return this.reaction.length() * this.stepRate;
	}
	get reactionTorque() {
		return this.angularReaction.length() * this.stepRate;
	}
	get solverRowCount() {
		return this.rowCount;
	}
	attach(e) {
		if (this.attached) throw Error(`Joint3D is already attached.`);
		this.objectA = this.bodyB ? this.bodyA : void 0, this.objectB = this.bodyB ?? this.bodyA, this.solverA = this.objectA?.body, this.solverB = this.objectB.body, this.frameA.read(this.objectA), this.frameB.read(this.objectB);
		let t = this.bodyB ? this.anchorA : this.anchorB, n = this.bodyB ? this.anchorB : this.anchorA;
		this.scratch.set(t.x - this.frameA.position.x, t.y - this.frameA.position.y, t.z - this.frameA.position.z), this.frameA.local(this.scratch, this.localA), this.scratch.set(n.x - this.frameB.position.x, n.y - this.frameB.position.y, n.z - this.frameB.position.z), this.frameB.local(this.scratch, this.localB), this.bindFrames(), this.worldOwner = e, this.wake();
	}
	detach() {
		this.wake(), this.worldOwner = void 0, this.solverA = void 0, this.solverB = void 0, this.rowCount = 0, this.reaction.set(0, 0, 0), this.angularReaction.set(0, 0, 0);
	}
	wake() {
		this.bodyA.body?.wake(), this.bodyB?.body?.wake();
	}
	anchors() {
		return this.readAnchors(), [this.pointA.clone(), this.pointB.clone()];
	}
	bindFrames() {}
	readAnchors() {
		this.frameA.read(this.objectA), this.frameB.read(this.objectB), this.frameA.world(this.localA, this.rA), this.frameB.world(this.localB, this.rB), this.pointA.copy(this.frameA.position).add(this.rA), this.pointB.copy(this.frameB.position).add(this.rB), this.error.copy(this.pointB).subtract(this.pointA);
	}
	prepare(e) {
		if (this.rowCount = 0, this.reaction.set(0, 0, 0), this.angularReaction.set(0, 0, 0), this.stepRate = 1 / e, !this.enabled) return;
		if (!(this.breakForce > 0) || !(this.breakTorque > 0)) throw RangeError(`Joint break thresholds must be positive.`);
		this.readAnchors(), this.prepareRows(e);
		let t = this.solverA, n = this.solverB, r = !!t && t.type !== `static` && !t.isSleeping, a = !!n && n.type !== `static` && !n.isSleeping, o = r || a;
		for (let e = 0; e < this.rowCount; e++) Math.abs(this.rows[e].bias) > require_physics3d.physics3DDefaults.sleepVelocity && (o = !0);
		o && (t?.isSleeping && t.wake(), n?.isSleeping && n.wake());
	}
	row(e, t, n, r = !1, a = -1 / 0, o = 1 / 0, s = 0, c = 0) {
		let l = this.rows[this.rowCount++];
		l.axis.set(e.x, e.y, e.z), l.angular = r, l.lower = a, l.upper = o, l.impulse = 0, l.gamma = 0, r ? (l.angularA.copy(l.axis), l.angularB.copy(l.axis)) : (l.angularA.copy(this.rA).cross(l.axis), l.angularB.copy(this.rB).cross(l.axis)), this.solverA?.inverseInertia(l.angularA, l.responseA), this.solverB?.inverseInertia(l.angularB, l.responseB), this.solverA || l.responseA.set(0, 0, 0), this.solverB || l.responseB.set(0, 0, 0);
		let u = (r ? 0 : (this.solverA?.inverseMass ?? 0) + (this.solverB?.inverseMass ?? 0)) + l.angularA.dot(l.responseA) + l.angularB.dot(l.responseB);
		if (l.mass = u > 1e-12 ? 1 / u : 0, l.bias = Math.max(-require_physics3d.physics3DDefaults.jointMaxBias, Math.min(require_physics3d.physics3DDefaults.jointMaxBias, require_physics3d.physics3DDefaults.jointBias * t / n)), s > 0 && l.mass > 0) {
			let e = 2 * Math.PI * s, r = 2 * l.mass * c * e, i = l.mass * e * e;
			l.gamma = 1 / (n * (r + n * i)), l.bias = t * n * i * l.gamma, l.mass = 1 / (u + l.gamma);
		}
		return l;
	}
	pointRows(e) {
		this.scratch.set(1, 0, 0), this.row(this.scratch, this.error.x, e), this.scratch.set(0, 1, 0), this.row(this.scratch, this.error.y, e), this.scratch.set(0, 0, 1), this.row(this.scratch, this.error.z, e);
	}
	axialSpeed(e) {
		let t = this.solverA?.angularVelocity, n = this.solverB?.angularVelocity;
		return ((n?.x ?? 0) - (t?.x ?? 0)) * e.x + ((n?.y ?? 0) - (t?.y ?? 0)) * e.y + ((n?.z ?? 0) - (t?.z ?? 0)) * e.z;
	}
	angularLimit(e, t, n, r, i, a = this.axialSpeed(e)) {
		let o = t + a * i;
		if (t < n || o < n) {
			let r = this.row(e, Math.min(0, t - n), i, !0, 0, 1 / 0);
			t >= n && (r.bias = (t - n) / i);
		} else if (t > r || o > r) {
			let n = this.row(e, Math.max(0, t - r), i, !0, -1 / 0, 0);
			t <= r && (n.bias = (t - r) / i);
		}
	}
	solveVelocity() {
		if (!this.enabled || !this.attached) return;
		let e = this.solverA, t = this.solverB;
		if (e && e.type === `dynamic` && !e.isSleeping || t && t.type === `dynamic` && !t.isSleeping) for (let n = 0; n < this.rowCount; n++) {
			let r = this.rows[n], i = r.axis, a = this.axialSpeed(r.angularB);
			if (!r.angular) {
				let n = e?.velocity, o = t?.velocity, s = e?.angularVelocity, c = t?.angularVelocity;
				a = ((o?.x ?? 0) - (n?.x ?? 0)) * i.x + ((o?.y ?? 0) - (n?.y ?? 0)) * i.y + ((o?.z ?? 0) - (n?.z ?? 0)) * i.z + (c ? c.dot(r.angularB) : 0) - (s ? s.dot(r.angularA) : 0);
			}
			let o = r.impulse;
			r.impulse = Math.max(r.lower, Math.min(r.upper, o - r.mass * (a + r.bias + r.gamma * o)));
			let s = r.impulse - o;
			e?.type === `dynamic` && (r.angular || (e.velocity.x -= i.x * s * e.inverseMass, e.velocity.y -= i.y * s * e.inverseMass, e.velocity.z -= i.z * s * e.inverseMass), e.angularVelocity.x -= r.responseA.x * s, e.angularVelocity.y -= r.responseA.y * s, e.angularVelocity.z -= r.responseA.z * s), t?.type === `dynamic` && (r.angular || (t.velocity.x += i.x * s * t.inverseMass, t.velocity.y += i.y * s * t.inverseMass, t.velocity.z += i.z * s * t.inverseMass), t.angularVelocity.x += r.responseB.x * s, t.angularVelocity.y += r.responseB.y * s, t.angularVelocity.z += r.responseB.z * s);
			let c = r.angular ? this.angularReaction : this.reaction;
			c.x += i.x * s, c.y += i.y * s, c.z += i.z * s;
		}
	}
};
var DistanceJoint3D = class extends Joint3D {
	type = `distance`;
	length;
	frequencyHz;
	dampingRatio;
	constructor(e) {
		super(e);
		let t = e.anchorB ?? e.anchor;
		this.length = require_collider.nonnegative3D(e.length ?? Math.hypot(t.x - e.anchor.x, t.y - e.anchor.y, t.z - e.anchor.z), `length`), this.frequencyHz = require_collider.nonnegative3D(e.frequencyHz ?? 0, `frequencyHz`), this.dampingRatio = require_collider.nonnegative3D(e.dampingRatio ?? 0, `dampingRatio`);
	}
	prepareRows(e) {
		require_collider.nonnegative3D(this.length, `length`), require_collider.nonnegative3D(this.frequencyHz, `frequencyHz`), require_collider.nonnegative3D(this.dampingRatio, `dampingRatio`);
		let t = this.error.length();
		this.scratch.copy(this.error), t > 1e-10 ? this.scratch.scale(1 / t) : this.scratch.set(0, 1, 0), this.row(this.scratch, t - this.length, e, !1, -1 / 0, 1 / 0, this.frequencyHz, this.dampingRatio);
	}
};
var AxisJoint3D = class extends Joint3D {
	bindAxis = new require_math3d.Vector3();
	bindTangent = new require_math3d.Vector3();
	localAxisA = new require_math3d.Vector3();
	localAxisB = new require_math3d.Vector3();
	localTangentA = new require_math3d.Vector3();
	localTangentB = new require_math3d.Vector3();
	axisA = new require_math3d.Vector3();
	axisB = new require_math3d.Vector3();
	tangentA = new require_math3d.Vector3();
	tangentB = new require_math3d.Vector3();
	bitangentA = new require_math3d.Vector3();
	bitangentB = new require_math3d.Vector3();
	swingAxis = new require_math3d.Vector3();
	twistJacobian = new require_math3d.Vector3();
	swing = 0;
	twist = 0;
	constructor(t) {
		super(t);
		let n = t.axis ?? new require_math3d.Vector3(0, 1, 0);
		if (require_collider.vector3D(n, `axis`), !(n.length() > 0)) throw RangeError(`Joint axis must be nonzero.`);
		this.bindAxis.set(n.x, n.y, n.z).normalize(), this.bindTangent.set(+(Math.abs(this.bindAxis.x) < .8), Math.abs(this.bindAxis.x) < .8 ? 0 : 1, 0).cross(this.bindAxis).normalize();
	}
	bindFrames() {
		this.frameA.local(this.bindAxis, this.localAxisA), this.frameB.local(this.bindAxis, this.localAxisB), this.frameA.local(this.bindTangent, this.localTangentA), this.frameB.local(this.bindTangent, this.localTangentB);
	}
	readAxes() {
		this.frameA.world(this.localAxisA, this.axisA), this.frameB.world(this.localAxisB, this.axisB), this.frameA.world(this.localTangentA, this.tangentA), this.frameB.world(this.localTangentB, this.tangentB), this.bitangentA.copy(this.axisA).cross(this.tangentA), this.bitangentB.copy(this.axisB).cross(this.tangentB), this.swingAxis.copy(this.axisA).cross(this.axisB);
		let e = this.swingAxis.length(), t = Math.max(-1, Math.min(1, this.axisA.dot(this.axisB)));
		this.twistJacobian.copy(this.axisA).add(this.axisB), 1 + t > 1e-6 ? this.twistJacobian.scale(1 / (1 + t)) : this.twistJacobian.copy(this.axisA), this.swing = Math.atan2(e, t), e > 1e-10 ? this.swingAxis.scale(1 / e) : this.swingAxis.copy(this.tangentA);
		let n = this.tangentA.dot(this.tangentB), r = this.bitangentA.dot(this.bitangentB), i = this.axisA.dot(this.axisB), a = this.tangentA.dot(this.bitangentB), o = this.bitangentA.dot(this.tangentB), s = this.tangentA.dot(this.axisB), c = this.axisA.dot(this.tangentB), l = this.bitangentA.dot(this.axisB), u = this.axisA.dot(this.bitangentB), d, f, p = n + r + i;
		if (p > 0) {
			let e = 2 * Math.sqrt(p + 1);
			f = e / 4, d = (o - a) / e;
		} else if (n > r && n > i) {
			let e = 2 * Math.sqrt(Math.max(0, 1 + n - r - i));
			f = (u - l) / e, d = (s + c) / e;
		} else if (r > i) {
			let e = 2 * Math.sqrt(Math.max(0, 1 + r - n - i));
			f = (s - c) / e, d = (l + u) / e;
		} else {
			let e = 2 * Math.sqrt(Math.max(0, 1 + i - n - r));
			f = (o - a) / e, d = e / 4;
		}
		let m = Math.hypot(d, f) > 1e-10 ? 2 * Math.atan2(d, f) : 0;
		m > Math.PI && (m -= 2 * Math.PI), m < -Math.PI && (m += 2 * Math.PI), this.twist = m;
	}
};
var BallSocketJoint3D = class extends AxisJoint3D {
	type = `ball-socket`;
	swingLimit;
	lowerTwist;
	upperTwist;
	constructor(e) {
		super(e), this.swingLimit = e.swingLimit ?? Math.PI, this.lowerTwist = e.lowerTwist ?? -1 / 0, this.upperTwist = e.upperTwist ?? 1 / 0, this.validateLimits();
	}
	validateLimits() {
		if (require_collider.nonnegative3D(this.swingLimit, `swingLimit`), this.lowerTwist !== -1 / 0 && require_collider.finite3D(this.lowerTwist, `lowerTwist`), this.upperTwist !== 1 / 0 && require_collider.finite3D(this.upperTwist, `upperTwist`), this.swingLimit > Math.PI || this.lowerTwist !== -1 / 0 && this.lowerTwist < -Math.PI || this.upperTwist !== 1 / 0 && this.upperTwist > Math.PI || this.lowerTwist > this.upperTwist) throw RangeError(`Invalid ball/socket angular limits.`);
	}
	get swingAngle() {
		return this.readAnchors(), this.readAxes(), this.swing;
	}
	get twistAngle() {
		return this.readAnchors(), this.readAxes(), this.twist;
	}
	prepareRows(e) {
		this.validateLimits(), this.readAxes(), this.pointRows(e);
		let t = this.swing + this.axialSpeed(this.swingAxis) * e;
		if (this.swingLimit < Math.PI && (this.swing > this.swingLimit || t > this.swingLimit)) {
			let t = this.row(this.swingAxis, Math.max(0, this.swing - this.swingLimit), e, !0, -1 / 0, 0);
			this.swing <= this.swingLimit && (t.bias = (this.swing - this.swingLimit) / e);
		}
		this.angularLimit(this.twistJacobian, this.twist, this.lowerTwist, this.upperTwist, e);
	}
};
var HingeJoint3D = class extends AxisJoint3D {
	type = `hinge`;
	lowerAngle;
	upperAngle;
	enableMotor;
	motorSpeed;
	maxMotorTorque;
	constructor(e) {
		super(e), this.lowerAngle = e.lowerAngle ?? -1 / 0, this.upperAngle = e.upperAngle ?? 1 / 0, this.enableMotor = e.enableMotor ?? !1, this.motorSpeed = e.motorSpeed ?? 0, this.maxMotorTorque = e.maxMotorTorque ?? 0, this.validateMotor();
	}
	validateMotor() {
		if (this.lowerAngle !== -1 / 0 && require_collider.finite3D(this.lowerAngle, `lowerAngle`), this.upperAngle !== 1 / 0 && require_collider.finite3D(this.upperAngle, `upperAngle`), require_collider.finite3D(this.motorSpeed, `motorSpeed`), require_collider.nonnegative3D(this.maxMotorTorque, `maxMotorTorque`), this.lowerAngle !== -1 / 0 && this.lowerAngle < -Math.PI || this.upperAngle !== 1 / 0 && this.upperAngle > Math.PI || this.lowerAngle > this.upperAngle) throw RangeError(`Invalid hinge angular limits.`);
	}
	get angle() {
		return this.readAnchors(), this.readAxes(), this.twist;
	}
	prepareRows(e) {
		if (this.validateMotor(), this.readAxes(), this.pointRows(e), this.row(this.tangentA, this.swing * this.swingAxis.dot(this.tangentA), e, !0), this.row(this.bitangentA, this.swing * this.swingAxis.dot(this.bitangentA), e, !0), this.enableMotor && this.maxMotorTorque > 0) {
			this.motorSpeed !== 0 && this.wake();
			let t = this.maxMotorTorque * e, n = this.row(this.axisA, 0, e, !0, -t, t);
			n.bias = -this.motorSpeed;
		}
		let t = this.axialSpeed(this.axisA), n = this.enableMotor && this.maxMotorTorque > 0 ? this.motorSpeed > 0 ? Math.max(t, this.motorSpeed) : Math.min(t, this.motorSpeed) : t;
		this.angularLimit(this.axisA, this.twist, this.lowerAngle, this.upperAngle, e, n);
	}
};
//#endregion
exports.BallSocketJoint3D = BallSocketJoint3D;
exports.DistanceJoint3D = DistanceJoint3D;
exports.HingeJoint3D = HingeJoint3D;
exports.Joint3D = Joint3D;

//# sourceMappingURL=joints.cjs.map