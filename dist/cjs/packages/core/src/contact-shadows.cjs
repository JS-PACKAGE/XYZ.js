const require_contact_shadows = require("../../../src/data/contact-shadows.cjs");
//#region dist/packages/core/src/contact-shadows.js
var ContactShadowSettings = class {
	distance;
	thickness;
	bias;
	steps;
	strength;
	constructor(t = {}) {
		this.distance = t.distance ?? require_contact_shadows.contactShadowDefaults.distance, this.thickness = t.thickness ?? require_contact_shadows.contactShadowDefaults.thickness, this.bias = t.bias ?? require_contact_shadows.contactShadowDefaults.bias, this.steps = t.steps ?? require_contact_shadows.contactShadowDefaults.steps, this.strength = t.strength ?? require_contact_shadows.contactShadowDefaults.strength, this.validate();
	}
	validate() {
		for (let e of [
			`distance`,
			`thickness`,
			`bias`,
			`strength`
		]) {
			let t = this[e];
			if (!Number.isFinite(t) || !Number.isFinite(Math.fround(t)) || t < 0) throw RangeError(`Contact shadow ${e} must be nonnegative and fit Float32.`);
		}
		if (this.distance === 0 || this.thickness === 0) throw RangeError(`Contact shadow distance and thickness must be positive.`);
		if (this.strength > 1) throw RangeError(`Contact shadow strength must be between zero and one.`);
		if (!Number.isInteger(this.steps) || this.steps < 1 || this.steps > require_contact_shadows.contactShadowDefaults.maxSteps) throw RangeError(`Contact shadow steps must be an integer from 1 to ${require_contact_shadows.contactShadowDefaults.maxSteps}.`);
	}
};
var t = /* @__PURE__ */ new WeakMap();
var ContactShadows = Object.freeze({
	set(e, n) {
		if (n === void 0) t.delete(e);
		else {
			if (!(n instanceof ContactShadowSettings)) throw TypeError(`Contact shadows require ContactShadowSettings.`);
			n.validate(), t.set(e, n);
		}
	},
	get(e) {
		return t.get(e);
	}
});
//#endregion
exports.ContactShadowSettings = ContactShadowSettings;
exports.ContactShadows = ContactShadows;

//# sourceMappingURL=contact-shadows.cjs.map