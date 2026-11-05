const require_rendering_gpu = require("../../../src/data/rendering-gpu.cjs");
const require_color_grading = require("./color-grading.cjs");
//#region dist/packages/core/src/motion-blur.js
var MotionBlurSettings = class {
	enabled;
	strength;
	samples;
	maxRadius;
	perObject;
	constructor(t = {}) {
		this.enabled = t.enabled ?? !0, this.strength = t.strength ?? require_rendering_gpu.motionBlurDefaults.strength, this.samples = t.samples ?? require_rendering_gpu.motionBlurDefaults.samples, this.maxRadius = t.maxRadius ?? require_rendering_gpu.motionBlurDefaults.maxRadius, this.perObject = t.perObject ?? require_rendering_gpu.motionBlurDefaults.perObject, this.validate();
	}
	validate() {
		if (typeof this.enabled != `boolean`) throw TypeError(`Motion blur enabled must be boolean.`);
		if (typeof this.perObject != `boolean`) throw TypeError(`Motion blur perObject must be boolean.`);
		if (require_color_grading.validatePostNumber(this.strength, `Motion blur strength`), require_color_grading.validatePostNumber(this.maxRadius, `Motion blur radius`), this.strength < 0 || this.strength > 2 || this.maxRadius < 0 || this.maxRadius > require_rendering_gpu.motionBlurDefaults.maximumRadius || !Number.isInteger(this.samples) || this.samples < 1 || this.samples > require_rendering_gpu.motionBlurDefaults.maximumSamples) throw RangeError(`Motion blur requires strength 0..2, radius 0..64 backing pixels and integer samples 1..32.`);
	}
};
//#endregion
exports.MotionBlurSettings = MotionBlurSettings;

//# sourceMappingURL=motion-blur.cjs.map