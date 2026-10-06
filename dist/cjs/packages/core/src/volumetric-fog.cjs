const require_rendering = require("../../../src/data/rendering.cjs");
const require_color_grading = require("./color-grading.cjs");
//#region dist/packages/core/src/volumetric-fog.js
var VolumetricFogSettings = class {
	enabled;
	density;
	baseHeight;
	heightFalloff;
	maxDistance;
	color;
	shaftStrength;
	fogSamples;
	shaftSamples;
	constructor(t = {}) {
		this.enabled = t.enabled ?? !0, this.density = t.density ?? require_rendering.volumetricPostDefaults.density, this.baseHeight = t.baseHeight ?? 0, this.heightFalloff = t.heightFalloff ?? require_rendering.volumetricPostDefaults.heightFalloff, this.maxDistance = t.maxDistance ?? require_rendering.volumetricPostDefaults.maxDistance;
		let n = t.color ?? [
			.65,
			.75,
			.9
		];
		this.color = [
			n[0],
			n[1],
			n[2]
		], this.shaftStrength = t.shaftStrength ?? require_rendering.volumetricPostDefaults.shaftStrength, this.fogSamples = t.fogSamples ?? require_rendering.volumetricPostDefaults.fogSamples, this.shaftSamples = t.shaftSamples ?? require_rendering.volumetricPostDefaults.shaftSamples, this.validate();
	}
	validate() {
		if (typeof this.enabled != `boolean`) throw TypeError(`Volumetric fog enabled must be boolean.`);
		if (require_color_grading.validatePostNumber(this.baseHeight, `Fog base height`), require_color_grading.validatePostNumber(this.density, `Volumetric density`), require_color_grading.validatePostNumber(this.heightFalloff, `Volumetric height falloff`), require_color_grading.validatePostNumber(this.maxDistance, `Volumetric maximum distance`), require_color_grading.validatePostNumber(this.shaftStrength, `Volumetric shaft strength`), this.density < 0 || this.heightFalloff < 0 || this.maxDistance < 0 || this.shaftStrength < 0) throw RangeError(`Volumetric density, falloff, distance and strength must be nonnegative.`);
		if (this.maxDistance === 0 || this.shaftStrength > 4) throw RangeError(`Volumetric maximum distance must be positive and shaft strength <= 4.`);
		if (this.color.length !== 3) throw RangeError(`Volumetric color must contain three 0..1 components.`);
		for (let e = 0; e < 3; e++) {
			let t = this.color[e];
			if (!Number.isFinite(t) || t < 0 || t > 1) throw RangeError(`Volumetric color must contain three 0..1 components.`);
		}
		if (!Number.isInteger(this.fogSamples) || this.fogSamples < 1 || this.fogSamples > require_rendering.volumetricPostDefaults.maximumSamples || !Number.isInteger(this.shaftSamples) || this.shaftSamples < 1 || this.shaftSamples > require_rendering.volumetricPostDefaults.maximumSamples) throw RangeError(`Volumetric sample counts must be integers in 1..64.`);
	}
};
//#endregion
exports.VolumetricFogSettings = VolumetricFogSettings;

//# sourceMappingURL=volumetric-fog.cjs.map