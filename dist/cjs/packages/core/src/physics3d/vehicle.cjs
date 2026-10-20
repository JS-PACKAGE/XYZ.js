const require_hypot = require("../../../math/src/hypot.cjs");
const require_math3d = require("../../../math/src/math3d.cjs");
const require_collider = require("./collider.cjs");
const require_physics_profiles = require("../../../../src/data/physics-profiles.cjs");
//#region dist/packages/core/src/physics3d/vehicle.js
var Vehicle3D = class {
	world;
	chassis;
	wheels;
	descriptors;
	origin = new require_math3d.Vector3();
	down = new require_math3d.Vector3();
	forward = new require_math3d.Vector3();
	lateral = new require_math3d.Vector3();
	velocity = new require_math3d.Vector3();
	groundVelocity = new require_math3d.Vector3();
	offset = new require_math3d.Vector3();
	impulse = new require_math3d.Vector3();
	driveForce;
	drivenCount;
	brakeForce;
	lateralGrip;
	maxForce;
	throttle = 0;
	brake = 0;
	steering = 0;
	disposed = !1;
	constructor(t, o) {
		if (this.world = t, !t.has(o.chassis) || o.chassis.body?.type !== `dynamic`) throw Error(`Vehicle chassis must be a registered dynamic body.`);
		if (!o.wheels.length || o.wheels.length > require_physics_profiles.physicsProfiles.vehicle.maxWheels) throw RangeError(`Invalid vehicle wheel count.`);
		this.chassis = o.chassis;
		let s = require_physics_profiles.physicsProfiles.vehicle;
		this.driveForce = require_collider.nonnegative3D(o.driveForce ?? s.driveForce, `driveForce`), this.brakeForce = require_collider.nonnegative3D(o.brakeForce ?? s.brakeForce, `brakeForce`), this.lateralGrip = require_collider.nonnegative3D(o.lateralGrip ?? s.lateralGrip, `lateralGrip`), this.maxForce = require_collider.positive3D(o.maxSuspensionForce ?? s.maxForce, `maxSuspensionForce`), this.descriptors = o.wheels.map((t) => (require_collider.vector3D(t.position, `wheel position`), {
			position: new require_math3d.Vector3(t.position.x, t.position.y, t.position.z),
			radius: require_collider.positive3D(t.radius, `radius`),
			restLength: require_collider.positive3D(t.restLength, `restLength`),
			travel: require_collider.nonnegative3D(t.travel ?? t.restLength / 2, `travel`),
			spring: require_collider.positive3D(t.spring ?? s.spring, `spring`),
			damping: require_collider.nonnegative3D(t.damping ?? s.damping, `damping`),
			friction: require_collider.nonnegative3D(t.friction ?? s.friction, `friction`),
			steer: t.steer ?? !1,
			drive: t.drive ?? !1
		})), this.wheels = this.descriptors.map((t) => ({
			center: new require_math3d.Vector3(),
			contact: new require_math3d.Vector3(),
			grounded: !1,
			suspensionLength: t.restLength,
			suspensionForce: 0,
			rotation: 0
		})), this.drivenCount = this.descriptors.reduce((e, t) => e + +!!t.drive, 0) || 1;
	}
	setControls(e, n = 0, r = 0) {
		if (require_collider.finite3D(e, `throttle`), require_collider.finite3D(n, `brake`), require_collider.finite3D(r, `steering`), Math.abs(e) > 1 || n < 0 || n > 1 || Math.abs(r) > Math.PI / 2) throw RangeError(`Controls require throttle [-1,1], brake [0,1], steering radians [-pi/2,pi/2].`);
		this.throttle = e, this.brake = n, this.steering = r;
	}
	speed(e, t, n) {
		let r = e.body;
		if (!r) {
			n.set(0, 0, 0);
			return;
		}
		this.offset.copy(t).subtract(e.position), n.copy(r.angularVelocity).cross(this.offset).add(r.velocity);
	}
	update(e) {
		if (require_collider.positive3D(e, `delta`), this.disposed) throw Error(`Vehicle3D is destroyed.`);
		let t = this.chassis.body;
		if (!t || t.type !== `dynamic` || !this.world.has(this.chassis)) throw Error(`Vehicle chassis is no longer registered and dynamic.`);
		let n = this.chassis.updateWorldMatrix(), i = n.elements;
		this.down.set(-i[4], -i[5], -i[6]).normalize();
		for (let r = 0; r < this.descriptors.length; r++) {
			let a = this.descriptors[r], s = this.wheels[r];
			n.transformPoint(a.position, this.origin);
			let c = a.restLength + a.travel, l = this.world.raycast(this.origin, this.down, c + a.radius, { ignore: this.chassis });
			if (s.grounded = !!l, s.suspensionForce = 0, s.suspensionLength = l ? Math.max(0, l.distance - a.radius) : c, s.center.copy(this.down).scale(s.suspensionLength).add(this.origin), !l) continue;
			s.contact.copy(l.point), this.speed(this.chassis, l.point, this.velocity), this.speed(l.object, l.point, this.groundVelocity), this.velocity.subtract(this.groundVelocity);
			let u = Math.min(this.maxForce, Math.max(0, a.spring * (a.restLength - s.suspensionLength) + a.damping * this.velocity.dot(this.down)));
			s.suspensionForce = u;
			let d = a.steer ? this.steering : 0, f = Math.sin(d), p = Math.cos(d);
			this.forward.set(i[0] * f + i[8] * p, i[1] * f + i[9] * p, i[2] * f + i[10] * p);
			let m = this.forward.dot(l.normal);
			this.forward.x -= l.normal.x * m, this.forward.y -= l.normal.y * m, this.forward.z -= l.normal.z * m, this.forward.normalize(), this.lateral.copy(l.normal).cross(this.forward).normalize();
			let h = this.velocity.dot(this.forward), g = this.velocity.dot(this.lateral), _ = Math.min(this.brakeForce * this.brake * e / this.wheels.length, Math.abs(h) * t.mass / this.wheels.length), v = (a.drive ? this.driveForce * this.throttle * e / this.drivenCount : 0) - Math.sign(h) * _, y = -g * t.mass / this.wheels.length * Math.min(1, this.lateralGrip * e), b = u * a.friction * e, x = require_hypot.hypot2(v, y);
			x > b && x > 0 && (v *= b / x, y *= b / x), this.impulse.set(-this.down.x * u * e + this.forward.x * v + this.lateral.x * y, -this.down.y * u * e + this.forward.y * v + this.lateral.y * y, -this.down.z * u * e + this.forward.z * v + this.lateral.z * y), t.applyImpulse(this.impulse, l.point), l.object.body?.type === `dynamic` && (this.impulse.scale(-1), l.object.body.applyImpulse(this.impulse, l.point)), s.rotation += h * e / a.radius;
		}
	}
	destroy() {
		this.disposed = !0;
	}
};
//#endregion
exports.Vehicle3D = Vehicle3D;

//# sourceMappingURL=vehicle.cjs.map