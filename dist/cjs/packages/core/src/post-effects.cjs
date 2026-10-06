const require_render_settings = require("./render-settings.cjs");
const require_color_grading = require("./color-grading.cjs");
const require_volumetric_fog = require("./volumetric-fog.cjs");
const require_lens_flare = require("./lens-flare.cjs");
const require_motion_blur = require("./motion-blur.cjs");
//#region dist/packages/core/src/post-effects.js
var PostEffectsSettings = class {
	toneMapper;
	colorGrading;
	volumetricFog;
	lensFlare;
	motionBlur;
	constructor(e = {}) {
		this.toneMapper = e.toneMapper, this.colorGrading = e.colorGrading, this.volumetricFog = e.volumetricFog, this.lensFlare = e.lensFlare, this.motionBlur = e.motionBlur, this.validate();
	}
	validate() {
		if (this.toneMapper !== void 0 && this.toneMapper !== `none` && this.toneMapper !== `aces` && this.toneMapper !== `agx` && this.toneMapper !== `reinhard` && this.toneMapper !== `neutral`) throw RangeError(`Unknown post tone mapper.`);
		if (this.colorGrading !== void 0 && !(this.colorGrading instanceof require_color_grading.ColorGradingSettings)) throw TypeError(`Expected ColorGradingSettings.`);
		if (this.volumetricFog !== void 0 && !(this.volumetricFog instanceof require_volumetric_fog.VolumetricFogSettings)) throw TypeError(`Expected VolumetricFogSettings.`);
		if (this.colorGrading?.validate(), this.volumetricFog?.validate(), this.lensFlare !== void 0 && !(this.lensFlare instanceof require_lens_flare.LensFlareSettings)) throw TypeError(`Expected LensFlareSettings.`);
		if (this.lensFlare?.validate(), this.motionBlur !== void 0 && !(this.motionBlur instanceof require_motion_blur.MotionBlurSettings)) throw TypeError(`Expected MotionBlurSettings.`);
		this.motionBlur?.validate();
	}
};
var a = /* @__PURE__ */ new WeakMap();
function setPostEffects(t, n) {
	if (!(t instanceof require_render_settings.PostProcessingSettings)) throw TypeError(`Expected PostProcessingSettings.`);
	if (n === void 0) a.delete(t);
	else {
		if (!(n instanceof PostEffectsSettings)) throw TypeError(`Expected PostEffectsSettings.`);
		n.validate(), a.set(t, n);
	}
}
function getPostEffects(e) {
	return a.get(e);
}
//#endregion
exports.PostEffectsSettings = PostEffectsSettings;
exports.getPostEffects = getPostEffects;
exports.setPostEffects = setPostEffects;

//# sourceMappingURL=post-effects.cjs.map