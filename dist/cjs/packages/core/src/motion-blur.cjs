const require_rendering = require("../../../src/data/rendering.cjs");
const require_color_grading = require("./color-grading.cjs");
//#region dist/packages/core/src/motion-blur.js
var MotionBlurSettings = class {
	enabled;
	strength;
	samples;
	maxRadius;
	constructor(t = {}) {
		this.enabled = t.enabled ?? !0, this.strength = t.strength ?? require_rendering.motionBlurDefaults.strength, this.samples = t.samples ?? require_rendering.motionBlurDefaults.samples, this.maxRadius = t.maxRadius ?? require_rendering.motionBlurDefaults.maxRadius, this.validate();
	}
	validate() {
		if (typeof this.enabled != `boolean`) throw TypeError(`Motion blur enabled must be boolean.`);
		if (require_color_grading.validatePostNumber(this.strength, `Motion blur strength`), require_color_grading.validatePostNumber(this.maxRadius, `Motion blur radius`), this.strength < 0 || this.strength > 2 || this.maxRadius < 0 || this.maxRadius > require_rendering.motionBlurDefaults.maximumRadius || !Number.isInteger(this.samples) || this.samples < 1 || this.samples > require_rendering.motionBlurDefaults.maximumSamples) throw RangeError(`Motion blur requires strength 0..2, radius 0..64 backing pixels and integer samples 1..32.`);
	}
};
//#endregion
exports.MotionBlurSettings = MotionBlurSettings;

//# sourceMappingURL=motion-blur.cjs.map