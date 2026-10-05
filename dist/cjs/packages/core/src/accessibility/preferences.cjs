const require_accessibility = require("../../../../src/data/accessibility.cjs");
const require_tween = require("../tween.cjs");
//#region dist/packages/core/src/accessibility/preferences.js
function validateAccessibilityOverrides(t) {
	if (!t || typeof t != `object` || Array.isArray(t)) throw TypeError(`Accessibility preferences require an object.`);
	for (let n of Object.keys(t)) {
		if (![
			`textScale`,
			`highContrast`,
			`reducedMotion`
		].includes(n)) throw TypeError(`Unknown accessibility preference: ${n}.`);
		let r = t[n];
		if (n === `textScale`) {
			if (typeof r != `number` || !Number.isFinite(r) || r < require_accessibility.accessibilityLimits.minimumTextScale || r > require_accessibility.accessibilityLimits.maximumTextScale) throw RangeError(`Text scale must be between 1 and 2.`);
		} else if (typeof r != `boolean`) throw TypeError(`${n} must be boolean.`);
	}
}
var AccessibilityPreferences = class extends EventTarget {
	overrides = {};
	current;
	media;
	motions = /* @__PURE__ */ new Set();
	disposed = !1;
	refresh = () => {
		if (this.disposed) return;
		let e = this.current, t = Object.freeze({
			textScale: this.overrides.textScale ?? 1,
			highContrast: this.overrides.highContrast ?? this.media[0]?.matches ?? !1,
			reducedMotion: this.overrides.reducedMotion ?? this.media[1]?.matches ?? !1
		});
		if (!(e && e.textScale === t.textScale && e.highContrast === t.highContrast && e.reducedMotion === t.reducedMotion)) {
			if (this.current = t, e?.reducedMotion !== t.reducedMotion) for (let e of [...this.motions]) e(!t.reducedMotion);
			this.dispatchEvent(new CustomEvent(`change`, { detail: t }));
		}
	};
	constructor(e = typeof window > `u` ? void 0 : window) {
		super(), this.media = typeof e?.matchMedia == `function` ? [e.matchMedia(`(prefers-contrast: more)`), e.matchMedia(`(prefers-reduced-motion: reduce)`)] : [], this.current = Object.freeze({
			textScale: 1,
			highContrast: this.media[0]?.matches ?? !1,
			reducedMotion: this.media[1]?.matches ?? !1
		});
		for (let e of this.media) e.addEventListener(`change`, this.refresh);
	}
	get values() {
		return this.current;
	}
	set(e) {
		this.assertLive(), validateAccessibilityOverrides(e), this.overrides = {
			...this.overrides,
			...e
		}, this.refresh();
	}
	replace(e) {
		this.assertLive(), validateAccessibilityOverrides(e), this.overrides = { ...e }, this.refresh();
	}
	reset() {
		this.assertLive(), this.overrides = {}, this.refresh();
	}
	export() {
		return { ...this.overrides };
	}
	duration(e, t = !1) {
		if (!Number.isFinite(e) || e < 0) throw RangeError(`Motion duration must be finite and nonnegative.`);
		return this.current.reducedMotion && !t ? 0 : e;
	}
	delta(e, t = !1) {
		return this.duration(e, t);
	}
	transition(e) {
		return this.current.reducedMotion ? void 0 : e;
	}
	tween(e, n, r, i = !1) {
		let a = this.current.reducedMotion && !i;
		return require_tween.Tween.to(e, n, a ? {
			...r,
			duration: 0,
			delay: 0,
			repeat: 0,
			yoyo: !1
		} : r);
	}
	bindMotion(e) {
		return this.assertLive(), e(!this.current.reducedMotion), this.motions.add(e), () => {
			this.motions.delete(e);
		};
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			for (let e of this.media) e.removeEventListener(`change`, this.refresh);
			this.motions.clear();
		}
	}
	assertLive() {
		if (this.disposed) throw Error(`Accessibility preferences are destroyed.`);
	}
};
//#endregion
exports.AccessibilityPreferences = AccessibilityPreferences;
exports.validateAccessibilityOverrides = validateAccessibilityOverrides;

//# sourceMappingURL=preferences.cjs.map