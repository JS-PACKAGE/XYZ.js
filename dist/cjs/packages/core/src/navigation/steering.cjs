//#region dist/packages/core/src/navigation/steering.js
function speedValue(e) {
	if (!Number.isFinite(e) || e < 0) throw RangeError(`Steering speed must be finite and nonnegative.`);
}
function steeringSeek(e, t, n, r) {
	speedValue(n), r.set(t.x - e.x, t.y - e.y, t.z - e.z);
	let i = r.length();
	if (!Number.isFinite(i)) throw RangeError(`Steering positions must be finite.`);
	return i > 0 ? r.scale(n / i) : r;
}
function steeringFlee(e, t, n, r) {
	return steeringSeek(e, t, n, r), r.scale(-1);
}
function steeringArrive(e, t, n, r, i) {
	if (!Number.isFinite(r) || r <= 0) throw RangeError(`Slowing radius must be positive.`);
	steeringSeek(e, t, n, i);
	let a = Math.hypot(t.x - e.x, t.y - e.y, t.z - e.z);
	return i.scale(Math.min(1, a / r));
}
var SteeringWander3D = class {
	turnRate;
	interval;
	state;
	angle = 0;
	constructor(e = 1, t = 2, n = .25) {
		if (this.turnRate = t, this.interval = n, !Number.isInteger(e) || !Number.isFinite(t) || t < 0 || !Number.isFinite(n) || n < 1 / 120) throw RangeError(`Invalid wander seed/rate/interval.`);
		this.state = e >>> 0 || 1;
	}
	remaining = 0;
	angularVelocity = 0;
	update(e, t, n) {
		if (speedValue(t), !Number.isFinite(e) || e < 0 || e > 60) throw RangeError(`Wander delta must be within 0..60 seconds.`);
		let r = e;
		for (; r > 0;) {
			if (this.remaining <= 0) {
				let e = this.state;
				e ^= e << 13, e ^= e >>> 17, e ^= e << 5, this.state = e >>> 0, this.angularVelocity = (this.state / 4294967295 * 2 - 1) * this.turnRate, this.remaining = this.interval;
			}
			let e = Math.min(r, this.remaining);
			this.angle = (this.angle + this.angularVelocity * e) % (Math.PI * 2), r -= e, this.remaining -= e;
		}
		return n.set(Math.cos(this.angle) * t, 0, Math.sin(this.angle) * t);
	}
};
//#endregion
exports.SteeringWander3D = SteeringWander3D;
exports.steeringArrive = steeringArrive;
exports.steeringFlee = steeringFlee;
exports.steeringSeek = steeringSeek;

//# sourceMappingURL=steering.cjs.map