const require_math3d = require("../../math/src/math3d.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_environment = require("./environment.cjs");
//#region dist/packages/core/src/reflection-probe.js
function copy(t) {
	if (t instanceof require_math3d.Vector3) return t.clone();
	if (!Array.isArray(t) || t.length !== 3) throw TypeError(`Reflection probe coordinates require a Vector3 or three-component tuple.`);
	return new require_math3d.Vector3(...t);
}
function finiteVector(t) {
	if (!(t instanceof require_math3d.Vector3) || !finite(t.x) || !finite(t.y) || !finite(t.z)) throw RangeError(`Reflection probe coordinates must be finite and fit Float32.`);
}
function finite(e) {
	return Number.isFinite(e) && Number.isFinite(Math.fround(e));
}
function bounds(e, t, n) {
	if (e >= t || n < e || n > t) throw RangeError(`Reflection probe bounds require min < max and must contain the capture position.`);
}
var ReflectionProbe = class {
	environment;
	position;
	min;
	max;
	intensity;
	enabled;
	boxProjection;
	blendDistance;
	dynamic;
	captureInterval;
	captureSize;
	ownedCapture;
	constructor(e) {
		this.environment = e.environment, this.position = copy(e.position), this.min = copy(e.min), this.max = copy(e.max), this.intensity = e.intensity ?? 1, this.enabled = e.enabled ?? !0, this.boxProjection = e.boxProjection ?? !0, this.blendDistance = e.blendDistance ?? 1, this.dynamic = e.dynamic ?? !1, this.captureInterval = e.captureInterval ?? require_rendering.reflectionCaptureLimits.interval, this.captureSize = e.captureSize ?? require_rendering.reflectionCaptureLimits.size, this.validate();
	}
	validate() {
		if (!(this.environment instanceof require_environment.EnvironmentMap)) throw TypeError(`Reflection probe environment must be an EnvironmentMap.`);
		if (finiteVector(this.position), finiteVector(this.min), finiteVector(this.max), bounds(this.min.x, this.max.x, this.position.x), bounds(this.min.y, this.max.y, this.position.y), bounds(this.min.z, this.max.z, this.position.z), !Number.isFinite(this.intensity) || !Number.isFinite(Math.fround(this.intensity)) || this.intensity < 0) throw RangeError(`Reflection probe intensity must be finite, nonnegative and fit Float32.`);
		if (typeof this.enabled != `boolean` || typeof this.boxProjection != `boolean`) throw TypeError(`Reflection probe enabled and boxProjection must be boolean.`);
		if (typeof this.dynamic != `boolean`) throw TypeError(`Reflection probe dynamic must be boolean.`);
		if (!finite(this.blendDistance) || this.blendDistance <= 0 || !finite(this.captureInterval) || this.captureInterval <= 0 || !Number.isInteger(this.captureSize) || this.captureSize < 2 || this.captureSize > require_rendering.reflectionCaptureLimits.maximumSize) throw RangeError(`Probe blending/capture requires positive blend distance/interval and capture size 2..512.`);
	}
	contains(e, t, n) {
		return e >= this.min.x && e <= this.max.x && t >= this.min.y && t <= this.max.y && n >= this.min.z && n <= this.max.z;
	}
	adoptCapture(e) {
		if (!(e instanceof require_environment.EnvironmentMap) || e.destroyed) throw TypeError(`Cannot adopt an invalid captured environment.`);
		if (this.ownedCapture === e) {
			this.environment = e;
			return;
		}
		this.ownedCapture?.destroy(), this.ownedCapture = this.environment = e;
	}
	destroy() {
		this.enabled = this.dynamic = !1, this.ownedCapture?.destroy(), this.ownedCapture = void 0;
	}
};
//#endregion
exports.ReflectionProbe = ReflectionProbe;

//# sourceMappingURL=reflection-probe.cjs.map