const require_errors = require("../errors.cjs");
//#region dist/packages/audio/src/samples/spatial.js
var t = [
	`linear`,
	`inverse`,
	`exponential`
];
var n = [`equalpower`, `HRTF`];
function validateVec3(t, n) {
	if (!t || !Number.isFinite(t.x) || !Number.isFinite(t.y) || !Number.isFinite(t.z)) throw new require_errors.AudioError(`${n} must have finite x, y and z.`);
}
function checkVec3(e, t) {
	return validateVec3(e, t), {
		x: e.x,
		y: e.y,
		z: e.z
	};
}
function positive(t, n, r = !1) {
	if (!Number.isFinite(t) || t < 0 || !r && t === 0) throw new require_errors.AudioError(`${n} must be finite and ${r ? `nonnegative` : `positive`}.`);
}
function checkSpatialOptions(r) {
	let i = {
		position: checkVec3(r.position, `Spatial position`),
		refDistance: r.refDistance ?? 1,
		maxDistance: r.maxDistance ?? 1e4,
		rolloffFactor: r.rolloffFactor ?? 1,
		distanceModel: r.distanceModel ?? `inverse`,
		panningModel: r.panningModel ?? `equalpower`
	};
	if (positive(i.refDistance, `Spatial refDistance`), positive(i.maxDistance, `Spatial maxDistance`), positive(i.rolloffFactor, `Spatial rolloffFactor`, !0), !t.includes(i.distanceModel)) throw new require_errors.AudioError(`Unknown spatial distance model.`);
	if (!n.includes(i.panningModel)) throw new require_errors.AudioError(`Unknown spatial panning model.`);
	if (i.distanceModel === `linear`) {
		if (i.rolloffFactor > 1) throw new require_errors.AudioError(`Linear spatial rolloffFactor must not exceed 1.`);
		if (i.maxDistance <= i.refDistance) throw new require_errors.AudioError(`Spatial maxDistance must exceed refDistance.`);
	}
	return i;
}
function applyPannerOptions(e, t) {
	e.panningModel = t.panningModel, e.distanceModel = t.distanceModel, e.refDistance = t.refDistance, e.maxDistance = t.maxDistance, e.rolloffFactor = t.rolloffFactor, e.positionX.value = t.position.x, e.positionY.value = t.position.y, e.positionZ.value = t.position.z;
}
function lengthSquared(e) {
	return e.x * e.x + e.y * e.y + e.z * e.z;
}
var AudioListenerState = class {
	context;
	contexts;
	pos = {
		x: 0,
		y: 0,
		z: 0
	};
	fwd = {
		x: 0,
		y: 0,
		z: -1
	};
	upward = {
		x: 0,
		y: 1,
		z: 0
	};
	touched = !1;
	constructor(e, t) {
		this.context = e, this.contexts = t;
	}
	get position() {
		return this.pos;
	}
	get forward() {
		return this.fwd;
	}
	get up() {
		return this.upward;
	}
	setPosition(t, n, r) {
		if (!Number.isFinite(t) || !Number.isFinite(n) || !Number.isFinite(r)) throw new require_errors.AudioError(`Listener position must have finite x, y and z.`);
		this.pos.x = t, this.pos.y = n, this.pos.z = r, this.touched = !0, this.apply();
	}
	setOrientation(t, n = this.upward) {
		validateVec3(t, `Listener forward`), validateVec3(n, `Listener up`);
		let r = t, i = n;
		if (lengthSquared(r) === 0 || lengthSquared(i) === 0) throw new require_errors.AudioError(`Listener orientation vectors must be non-zero.`);
		let a = r.y * i.z - r.z * i.y, o = r.z * i.x - r.x * i.z, s = r.x * i.y - r.y * i.x;
		if (a * a + o * o + s * s <= 1e-12 * lengthSquared(r) * lengthSquared(i)) throw new require_errors.AudioError(`Listener forward and up must not be parallel.`);
		this.fwd.x = r.x, this.fwd.y = r.y, this.fwd.z = r.z, this.upward.x = i.x, this.upward.y = i.y, this.upward.z = i.z, this.touched = !0, this.apply();
	}
	apply() {
		if (!this.touched) return;
		let e = this.contexts?.();
		if (e) for (let t of e) this.applyTo(t);
		else {
			let e = this.context();
			e && this.applyTo(e);
		}
	}
	applyTo(e) {
		if (e.state === `closed`) return;
		let t = e.listener;
		t.positionX ? (t.positionX.value = this.pos.x, t.positionY.value = this.pos.y, t.positionZ.value = this.pos.z) : t.setPosition(this.pos.x, this.pos.y, this.pos.z), t.forwardX ? (t.forwardX.value = this.fwd.x, t.forwardY.value = this.fwd.y, t.forwardZ.value = this.fwd.z, t.upX.value = this.upward.x, t.upY.value = this.upward.y, t.upZ.value = this.upward.z) : t.setOrientation(this.fwd.x, this.fwd.y, this.fwd.z, this.upward.x, this.upward.y, this.upward.z);
	}
};
//#endregion
exports.AudioListenerState = AudioListenerState;
exports.applyPannerOptions = applyPannerOptions;
exports.checkSpatialOptions = checkSpatialOptions;
exports.checkVec3 = checkVec3;
exports.validateVec3 = validateVec3;

//# sourceMappingURL=spatial.cjs.map