const require_gamepad = require("./gamepad.cjs");
//#region dist/packages/input/src/contexts.js
var n = [];
var InputContext = class {
	name;
	owner;
	defaultPad;
	enabled = !1;
	destroyed = !1;
	actionMap;
	routedPad;
	priority;
	consume;
	gamepadIndex;
	constructor(n, r, i, a, o, s) {
		this.name = n, this.owner = r, this.defaultPad = i, this.priority = s.priority ?? 0, this.consume = s.consume ?? !0, this.gamepadIndex = s.gamepadIndex, this.gamepadIndex !== void 0 && (this.routedPad = new require_gamepad.GamepadState(i), this.routedPad.preferredIndex = this.gamepadIndex), this.actionMap = new require_gamepad.ActionMap(this.routedPad ?? i, a, o, !0), s.bindings !== void 0 && this.actionMap.import(s.bindings);
	}
	get active() {
		return this.enabled;
	}
	activate() {
		this.assertAlive(), !this.enabled && (this.enabled = !0, this.actionMap.baseline(), this.owner.activate(this));
	}
	deactivate() {
		this.enabled && (this.enabled = !1, this.actionMap.reset(), this.owner.deactivate(this));
	}
	destroy() {
		this.destroyed || (this.deactivate(), this.destroyed = !0, this.actionMap.reset(), this.routedPad?.reset(), this.owner.remove(this));
	}
	value(e) {
		return this.actionMap.value(e);
	}
	isDown(e) {
		return this.actionMap.isDown(e);
	}
	wasPressed(e) {
		return this.actionMap.wasPressed(e);
	}
	wasReleased(e) {
		return this.actionMap.wasReleased(e);
	}
	rebind(e, t) {
		this.assertAlive(), this.actionMap.rebind(e, t), this.enabled && (this.actionMap.baseline(), this.owner.reconcile());
	}
	unbind(e) {
		this.assertAlive();
		let t = this.actionMap.unbind(e);
		return t && this.enabled && this.owner.reconcile(), t;
	}
	exportBindings() {
		return this.actionMap.export();
	}
	importBindings(e) {
		this.assertAlive(), this.actionMap.import(e), this.enabled && (this.actionMap.baseline(), this.owner.reconcile());
	}
	poll(e) {
		this.routedPad && (this.routedPad.deadzone = this.defaultPad.deadzone, this.routedPad.pressThreshold = this.defaultPad.pressThreshold, this.routedPad.update(e));
	}
	update(e, t, n) {
		this.actionMap.update(e, this.consume ? t : void 0, n);
	}
	updateInactive() {
		this.actionMap.updateInactive();
	}
	reset() {
		this.actionMap.reset(), this.routedPad?.reset();
	}
	endFrame() {
		this.actionMap.endFrame();
	}
	assertAlive() {
		if (this.destroyed) throw Error(`Input context "${this.name}" has been destroyed.`);
	}
};
var InputContexts = class {
	legacy;
	gamepad;
	keyboard;
	sources;
	contexts = /* @__PURE__ */ new Map();
	active = [];
	retired = /* @__PURE__ */ new Set();
	consumed = /* @__PURE__ */ new Set();
	claimed = /* @__PURE__ */ new Set();
	snapshot = n;
	destroyed = !1;
	constructor(e, t, n, r) {
		this.legacy = e, this.gamepad = t, this.keyboard = n, this.sources = r;
	}
	create(e, t = {}) {
		if (this.destroyed) throw Error(`Input contexts have been destroyed.`);
		if (typeof e != `string` || !e || e === `__proto__`) throw RangeError(`Input context name must be a non-empty string.`);
		if (this.contexts.has(e)) throw RangeError(`Input context "${e}" already exists.`);
		if (!t || typeof t != `object` || Array.isArray(t)) throw RangeError(`Input context options must be an object.`);
		if (t.priority !== void 0 && !Number.isFinite(t.priority)) throw RangeError(`Input context priority must be finite.`);
		if (t.consume !== void 0 && typeof t.consume != `boolean`) throw RangeError(`Input context consume must be boolean.`);
		if (t.gamepadIndex !== void 0 && (!Number.isInteger(t.gamepadIndex) || t.gamepadIndex < 0)) throw RangeError(`Input context gamepadIndex must be a nonnegative integer.`);
		let n = new InputContext(e, this, this.gamepad, this.keyboard, this.sources, t);
		return n.poll(this.snapshot), this.contexts.set(e, n), n;
	}
	activate(e) {
		let t = this.active.findIndex((t) => t.priority <= e.priority);
		this.active.splice(t < 0 ? this.active.length : t, 0, e), this.reconcile();
	}
	deactivate(e) {
		let t = this.active.indexOf(e);
		t >= 0 && this.active.splice(t, 1), this.reconcile();
	}
	remove(e) {
		this.contexts.delete(e.name), this.retired.add(e);
	}
	reconcile() {
		this.route(!0);
	}
	update(e) {
		this.snapshot = e;
		for (let t of this.contexts.values()) t.poll(e), t.active || t.updateInactive();
		for (let e of this.retired) e.updateInactive();
		this.route(!1);
	}
	reset() {
		this.snapshot = n, this.legacy.reset();
		for (let e of this.contexts.values()) e.reset();
		this.consumed.clear(), this.claimed.clear();
	}
	endFrame() {
		this.legacy.endFrame();
		for (let e of this.contexts.values()) e.endFrame();
		for (let e of this.retired) e.endFrame();
		this.retired.clear();
	}
	destroy() {
		if (!this.destroyed) {
			this.destroyed = !0;
			for (let e of this.contexts.values()) e.destroy();
			this.active.length = 0, this.consumed.clear(), this.claimed.clear(), this.retired.clear(), this.snapshot = n;
		}
	}
	route(e) {
		this.consumed.clear();
		for (let t of this.active) {
			this.claimed.clear(), t.update(this.consumed, this.claimed, e);
			for (let e of this.claimed) this.consumed.add(e);
		}
		this.legacy.update(this.consumed, void 0, e);
	}
};
//#endregion
exports.InputContext = InputContext;
exports.InputContexts = InputContexts;

//# sourceMappingURL=contexts.cjs.map