const require_rendering = require("../../../src/data/rendering.cjs");
const require_color_grading = require("./color-grading.cjs");
//#region dist/packages/core/src/lens-flare.js
var LensFlareSettings = class {
	enabled;
	strength;
	threshold;
	ghosts;
	spacing;
	haloRadius;
	haloWidth;
	constructor(t = {}) {
		this.enabled = t.enabled ?? !0, this.strength = t.strength ?? require_rendering.lensFlareDefaults.strength, this.threshold = t.threshold ?? require_rendering.lensFlareDefaults.threshold, this.ghosts = t.ghosts ?? require_rendering.lensFlareDefaults.ghosts, this.spacing = t.spacing ?? require_rendering.lensFlareDefaults.spacing, this.haloRadius = t.haloRadius ?? require_rendering.lensFlareDefaults.haloRadius, this.haloWidth = t.haloWidth ?? require_rendering.lensFlareDefaults.haloWidth, this.validate();
	}
	validate() {
		if (typeof this.enabled != `boolean`) throw TypeError(`Lens flare enabled must be boolean.`);
		if (require_color_grading.validatePostNumber(this.strength, `Lens flare strength`), require_color_grading.validatePostNumber(this.threshold, `Lens flare threshold`), require_color_grading.validatePostNumber(this.spacing, `Lens flare spacing`), require_color_grading.validatePostNumber(this.haloRadius, `Lens flare halo radius`), require_color_grading.validatePostNumber(this.haloWidth, `Lens flare halo width`), this.strength < 0 || this.strength > 4 || this.threshold < 0 || this.spacing <= 0 || this.spacing > 2 || this.haloRadius <= 0 || this.haloRadius > 1 || this.haloWidth <= 0 || this.haloWidth > 1 || !Number.isInteger(this.ghosts) || this.ghosts < 1 || this.ghosts > require_rendering.lensFlareDefaults.maximumGhosts) throw RangeError(`Lens flare requires strength 0..4, nonnegative threshold, spacing (0,2], halo radius/width (0,1], and 1..8 integer ghosts.`);
	}
};
//#endregion
exports.LensFlareSettings = LensFlareSettings;

//# sourceMappingURL=lens-flare.cjs.map