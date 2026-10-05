const require_math3d = require("../../math/src/math3d.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
//#region dist/packages/core/src/lights.js
var n = 1;
function allocateLightId() {
	if (n > 16777215) throw RangeError(`Light identity space exhausted.`);
	return n++;
}
function finite(e, t) {
	if (!Number.isFinite(e) || !Number.isFinite(Math.fround(e))) throw RangeError(`${t} must be finite and fit in Float32.`);
}
function vector(t, n) {
	if (!(t instanceof require_math3d.Vector3)) throw TypeError(`${n} must be a Vector3.`);
	finite(t.x, n), finite(t.y, n), finite(t.z, n);
}
function copyVector(t, n, r, i, a) {
	if (t === void 0) return new require_math3d.Vector3(n, r, i);
	if (t instanceof require_math3d.Vector3) return t.clone();
	if (!Array.isArray(t) || t.length !== 3) throw TypeError(`${a} must be a Vector3 or three-component tuple.`);
	return new require_math3d.Vector3(t[0], t[1], t[2]);
}
function validatePoint(e) {
	if (vector(e.position, `Light position`), !Array.isArray(e.color) || e.color.length !== 3) throw RangeError(`Light color must contain three components.`);
	for (let t = 0; t < 3; t++) if (finite(e.color[t], `Light color component`), e.color[t] < 0) throw RangeError(`Light color components cannot be negative.`);
	if (finite(e.intensity, `Light intensity`), finite(e.range, `Light range`), finite(e.priority, `Light priority`), e.intensity < 0 || e.range < 0) throw RangeError(`Light intensity and range cannot be negative.`);
	if (typeof e.castShadow != `boolean`) throw TypeError(`Light castShadow must be boolean.`);
	if (finite(e.shadowNear, `Light shadow near`), finite(e.shadowFar, `Light shadow far`), e.shadowNear <= 0 || e.shadowFar <= e.shadowNear || e.castShadow && e.range > 0 && e.range <= e.shadowNear) throw RangeError(`Light shadow clipping requires 0 < near < far.`);
}
var PointLight = class {
	identity = allocateLightId();
	get id() {
		return this.identity;
	}
	position;
	color;
	intensity;
	range;
	priority;
	castShadow;
	shadowNear;
	shadowFar;
	constructor(e = {}) {
		this.position = copyVector(e.position, 0, 0, 0, `Light position`);
		let n = e.color ?? [
			1,
			1,
			1
		];
		if (!Array.isArray(n) || n.length !== 3) throw RangeError(`Light color must contain three components.`);
		this.color = [
			n[0],
			n[1],
			n[2]
		], this.intensity = e.intensity ?? 1, this.range = e.range ?? 0, this.priority = e.priority ?? 0, this.castShadow = e.castShadow ?? !1, this.shadowNear = e.shadowNear ?? require_rendering.shadowLimits.near, this.shadowFar = e.shadowFar ?? require_rendering.shadowLimits.far, validatePoint(this);
	}
	validate() {
		validatePoint(this);
	}
};
var SpotLight = class extends PointLight {
	direction;
	innerAngle;
	outerAngle;
	constructor(e = {}) {
		super(e), this.direction = copyVector(e.direction, 0, -1, 0, `Spot direction`), this.innerAngle = e.innerAngle ?? 0, this.outerAngle = e.outerAngle ?? Math.PI / 4, this.validate();
	}
	validate() {
		if (super.validate(), vector(this.direction, `Spot direction`), this.direction.length() === 0) throw RangeError(`Spot direction cannot be zero.`);
		if (finite(this.innerAngle, `Spot inner angle`), finite(this.outerAngle, `Spot outer angle`), this.innerAngle < 0 || this.innerAngle >= this.outerAngle || this.outerAngle > Math.PI / 2) throw RangeError(`Spot angles must satisfy 0 <= innerAngle < outerAngle <= PI / 2.`);
		if (Math.fround(Math.cos(this.innerAngle)) <= Math.fround(Math.cos(this.outerAngle))) throw RangeError(`Spot cone angles must remain distinct in Float32.`);
		if (this.castShadow && this.outerAngle >= Math.PI / 2) throw RangeError(`A shadow-casting spot cone must be narrower than PI / 2.`);
	}
};
//#endregion
exports.PointLight = PointLight;
exports.SpotLight = SpotLight;

//# sourceMappingURL=lights.cjs.map