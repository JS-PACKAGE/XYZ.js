const require_index = require("../../math/src/index.cjs");
const require_input = require("../../../src/data/input.cjs");
const require_gamepad = require("./gamepad.cjs");
const require_gestures = require("./gestures.cjs");
const require_contexts = require("./contexts.cjs");
const require_virtual = require("./virtual.cjs");
//#region dist/packages/input/src/index.js
var s = [];
function isTextEditable(e) {
	let t = e;
	if (!t) return !1;
	let n = t.tagName;
	return t.isContentEditable === !0 || t.hasAttribute?.(`data-xyz-accessibility`) === !0 || n === `INPUT` || n === `TEXTAREA` || n === `SELECT`;
}
var Keyboard = class {
	down = /* @__PURE__ */ new Set();
	pressed = /* @__PURE__ */ new Set();
	released = /* @__PURE__ */ new Set();
	pressVersions = /* @__PURE__ */ new Map();
	pressSequence = 0;
	isDown(e) {
		return this.down.has(e);
	}
	wasPressed(e) {
		return this.pressed.has(e);
	}
	wasReleased(e) {
		return this.released.has(e);
	}
	pressVersion(e) {
		return this.pressVersions.get(e) ?? 0;
	}
	keyDown(e) {
		isTextEditable(e.target) || this.down.has(e.code) || (this.down.add(e.code), this.pressed.add(e.code), this.pressVersions.set(e.code, ++this.pressSequence));
	}
	keyUp(e) {
		this.down.delete(e.code) && this.released.add(e.code);
	}
	endFrame() {
		this.pressed.clear(), this.released.clear();
	}
	reset() {
		this.down.clear(), this.pressVersions.clear(), this.endFrame();
	}
};
var Pointer = class {
	canvas;
	getSize;
	observe;
	onReset;
	position = new require_index.Vector2();
	down = /* @__PURE__ */ new Set();
	pressed = /* @__PURE__ */ new Set();
	released = /* @__PURE__ */ new Set();
	pressVersions = /* @__PURE__ */ new Map();
	pressSequence = 0;
	pointers = /* @__PURE__ */ new Map();
	hovered = !1;
	views = /* @__PURE__ */ new Map();
	queued = [];
	samplePool = [];
	sequence = 0;
	wheelValues = {
		x: 0,
		y: 0,
		z: 0
	};
	wheelVersions = {
		x: 0,
		y: 0,
		z: 0
	};
	generation = 0;
	cursorOwned = !1;
	originalCursor = ``;
	originalCursorPriority = ``;
	assignedCursor = ``;
	get activePointers() {
		return this.views;
	}
	get samples() {
		return this.queued;
	}
	get resetVersion() {
		return this.generation;
	}
	pressVersion(e) {
		return this.pressVersions.get(e) ?? 0;
	}
	wheelVersion(e) {
		return this.wheelVersions[e];
	}
	isPointerDown(e) {
		return this.pointers.has(e);
	}
	record(n, r) {
		let i = this.views.get(n.pointerId);
		if (!i) {
			if (this.views.size >= require_input.inputLimits.maxActivePointers) return;
			i = {
				id: n.pointerId,
				type: n.pointerType,
				position: new require_index.Vector2(),
				buttons: n.buttons
			}, this.views.set(n.pointerId, i);
		}
		i.position.copy(this.position), i.buttons = n.buttons;
		let a = this.queued[this.queued.length - 1], o;
		if (r === `move` && a?.kind === `move` && a.id === n.pointerId) o = a;
		else if (this.queued.length === require_input.inputLimits.maxPointerSamples) {
			if (r === `move`) return;
			let e = this.queued.findIndex((e) => e.kind === `move` || e.kind === `leave` || e.kind === `down`);
			e < 0 && (e = this.queued.findIndex((e) => e.id === n.pointerId)), e < 0 && (e = 0), o = this.queued[e];
			for (let t = e; t < this.queued.length - 1; t++) this.queued[t] = this.queued[t + 1];
			this.queued[this.queued.length - 1] = o;
		} else {
			let t = this.queued.length;
			o = this.samplePool[t] ??= {
				id: 0,
				type: ``,
				kind: r,
				position: new require_index.Vector2(),
				button: 0,
				buttons: 0,
				sequence: 0
			}, this.queued.push(o);
		}
		o.id = n.pointerId, o.type = n.pointerType, o.kind = r, o.position.copy(this.position), o.button = n.button, o.buttons = n.buttons, o.sequence = ++this.sequence, o.originalEvent = n, o.deltaX = o.deltaY = o.deltaZ = void 0, this.observe?.(o), (r === `cancel` || r === `up` && n.pointerType === `touch` || r === `leave` && !this.pointers.has(n.pointerId)) && this.views.delete(n.pointerId);
	}
	constructor(e, t, n, r) {
		this.canvas = e, this.getSize = t, this.observe = n, this.onReset = r;
	}
	get active() {
		return this.hovered || this.pointers.size > 0;
	}
	isDown(e) {
		return this.down.has(e);
	}
	wasPressed(e) {
		return this.pressed.has(e);
	}
	wasReleased(e) {
		return this.released.has(e);
	}
	wheelDelta(e) {
		return this.wheelValues[e];
	}
	wheel(n) {
		this.updatePosition(n);
		let r = n.deltaMode === 1 ? 16 : n.deltaMode === 2 ? this.canvas.clientHeight || this.getSize().height : 1, finite = (e) => Number.isFinite(e) ? Math.max(-1e6, Math.min(1e6, e * r)) : 0;
		this.wheelValues.x = Math.max(-1e6, Math.min(1e6, this.wheelValues.x + finite(n.deltaX))), this.wheelValues.y = Math.max(-1e6, Math.min(1e6, this.wheelValues.y + finite(n.deltaY))), this.wheelValues.z = Math.max(-1e6, Math.min(1e6, this.wheelValues.z + finite(n.deltaZ))), n.deltaX && Number.isFinite(n.deltaX) && this.wheelVersions.x++, n.deltaY && Number.isFinite(n.deltaY) && this.wheelVersions.y++, n.deltaZ && Number.isFinite(n.deltaZ) && this.wheelVersions.z++;
		let i = this.queued[this.queued.length - 1];
		if (i?.kind === `wheel` && i.position.x === this.position.x && i.position.y === this.position.y) {
			i.position.copy(this.position), i.deltaX = finite((i.deltaX ?? 0) / r + n.deltaX), i.deltaY = finite((i.deltaY ?? 0) / r + n.deltaY), i.deltaZ = finite((i.deltaZ ?? 0) / r + n.deltaZ), i.originalEvent = n, i.sequence = ++this.sequence;
			return;
		}
		if (this.queued.length >= require_input.inputLimits.maxPointerSamples) return;
		let a = this.queued.length, o = this.samplePool[a] ??= {
			id: 0,
			type: `mouse`,
			kind: `wheel`,
			position: new require_index.Vector2(),
			button: 0,
			buttons: 0,
			sequence: 0
		};
		o.id = 0, o.type = `mouse`, o.kind = `wheel`, o.position.copy(this.position), o.button = 0, o.buttons = 0, o.sequence = ++this.sequence, o.originalEvent = n, o.deltaX = finite(n.deltaX), o.deltaY = finite(n.deltaY), o.deltaZ = finite(n.deltaZ), this.queued.push(o);
	}
	setCursor(e) {
		let t = this.canvas.style;
		if (e === void 0) {
			this.cursorOwned && t.cursor === this.assignedCursor && (this.originalCursor ? t.setProperty(`cursor`, this.originalCursor, this.originalCursorPriority) : t.removeProperty(`cursor`)), this.cursorOwned = !1;
			return;
		}
		this.cursorOwned ||= (this.originalCursor = t.cursor, this.originalCursorPriority = t.getPropertyPriority(`cursor`), !0), t.setProperty(`cursor`, e, this.originalCursorPriority), this.assignedCursor = t.cursor;
	}
	enter(e) {
		this.hovered = !0, this.updatePosition(e), this.record(e, `move`);
	}
	leave(e) {
		this.hovered = !1, this.updatePosition(e), this.record(e, `leave`);
	}
	move(e) {
		this.updatePosition(e), this.record(e, `move`);
	}
	pointerDown(e) {
		if (this.updatePosition(e), e.button < 0) return;
		let n = this.pointers.get(e.pointerId);
		if (!n) {
			if (this.pointers.size >= require_input.inputLimits.maxActivePointers) return;
			this.canvas.setPointerCapture?.(e.pointerId), n = /* @__PURE__ */ new Set(), this.pointers.set(e.pointerId, n);
		}
		n.has(e.button) || (n.add(e.button), this.down.has(e.button) || (this.down.add(e.button), this.pressed.add(e.button), this.pressVersions.set(e.button, ++this.pressSequence)), this.record(e, `down`));
	}
	pointerUp(e) {
		this.updatePosition(e);
		let t = this.pointers.get(e.pointerId);
		t?.delete(e.button) && this.releaseButton(e.button), t?.size === 0 && (this.pointers.delete(e.pointerId), this.releaseCapture(e.pointerId)), e.pointerType === `touch` && (this.hovered = !1), this.record(e, `up`);
	}
	cancel(e) {
		this.updatePosition(e), this.clearPointer(e.pointerId), this.hovered = !1, this.record(e, `cancel`);
	}
	lostCapture(e) {
		let t = this.pointers.has(e.pointerId);
		this.clearPointer(e.pointerId), t && this.record(e, `cancel`), e.pointerType === `touch` && (this.hovered = !1);
	}
	endFrame() {
		this.pressed.clear(), this.released.clear();
		for (let e of this.queued) e.originalEvent = void 0;
		this.queued.length = 0, this.wheelValues.x = this.wheelValues.y = this.wheelValues.z = 0;
	}
	reset() {
		this.generation++, this.onReset?.();
		for (let e of this.pointers.keys()) this.releaseCapture(e);
		this.pointers.clear(), this.down.clear(), this.pressVersions.clear(), this.hovered = !1, this.views.clear(), this.endFrame(), this.setCursor();
	}
	releaseButton(e) {
		for (let t of this.pointers.values()) if (t.has(e)) return;
		this.down.delete(e) && this.released.add(e);
	}
	clearPointer(e) {
		let t = this.pointers.get(e);
		if (t) {
			this.pointers.delete(e);
			for (let e of t) this.releaseButton(e);
			this.releaseCapture(e);
		}
	}
	releaseCapture(e) {
		this.canvas.hasPointerCapture?.(e) && this.canvas.releasePointerCapture(e);
	}
	updatePosition(e) {
		let t = this.canvas.getBoundingClientRect(), n = getComputedStyle(this.canvas), r = this.canvas.offsetWidth > 0 ? t.width / this.canvas.offsetWidth : 1, i = this.canvas.offsetHeight > 0 ? t.height / this.canvas.offsetHeight : 1, a = (parseFloat(n.borderLeftWidth) || 0) * r, o = (parseFloat(n.borderRightWidth) || 0) * r, s = (parseFloat(n.borderTopWidth) || 0) * i, c = (parseFloat(n.borderBottomWidth) || 0) * i, l = (parseFloat(n.paddingLeft) || 0) * r, u = (parseFloat(n.paddingRight) || 0) * r, d = (parseFloat(n.paddingTop) || 0) * i, f = (parseFloat(n.paddingBottom) || 0) * i, p = t.width - a - o - l - u, m = t.height - s - c - d - f;
		if (p <= 0 || m <= 0) return;
		let h = this.getSize();
		this.position.set((e.clientX - t.left - a - l) / p * h.width, (e.clientY - t.top - s - d) / m * h.height);
	}
};
var InputManager = class {
	canvas;
	keyboard = new Keyboard();
	pointer;
	gestures = new require_gestures.GestureRecognizer();
	gamepad = new require_gamepad.GamepadState();
	actions;
	contexts;
	virtual = new require_virtual.VirtualInput();
	gesturePulses = /* @__PURE__ */ new Set();
	gestureVersions = {
		tap: 0,
		doubletap: 0,
		longpress: 0,
		swipe: 0,
		pan: 0,
		pinch: 0,
		rotate: 0
	};
	gestureUnsubscribe = [];
	get gamepads() {
		return this.gamepadSnapshot;
	}
	gamepadSnapshot = s;
	destroyed = !1;
	onKeyDown = (e) => this.keyboard.keyDown(e);
	onKeyUp = (e) => this.keyboard.keyUp(e);
	onBlur = () => this.reset();
	onVisibilityChange = () => {
		document.hidden && this.reset();
	};
	onPointerEnter = (e) => this.pointer.enter(e);
	onPointerLeave = (e) => this.pointer.leave(e);
	onPointerMove = (e) => this.pointer.move(e);
	onPointerDown = (e) => this.pointer.pointerDown(e);
	onPointerUp = (e) => this.pointer.pointerUp(e);
	onPointerCancel = (e) => this.pointer.cancel(e);
	onLostPointerCapture = (e) => this.pointer.lostCapture(e);
	onWheel = (e) => this.pointer.wheel(e);
	constructor(e, t) {
		this.canvas = e, this.pointer = new Pointer(e, t, (e) => this.gestures.feed(e), () => {
			this.gestures.reset(), this.gesturePulses.clear();
		});
		let r = {
			pointer: this.pointer,
			virtual: this.virtual,
			gesture: (e) => this.gesturePulses.has(e),
			gestureVersion: (e) => this.gestureVersions[e]
		};
		this.actions = new require_gamepad.ActionMap(this.gamepad, this.keyboard, r, !0), this.contexts = new require_contexts.InputContexts(this.actions, this.gamepad, this.keyboard, r);
		for (let e of [
			`tap`,
			`doubletap`,
			`longpress`,
			`swipe`,
			`pan`,
			`pinch`,
			`rotate`
		]) this.gestureUnsubscribe.push(this.gestures.on(e, (t) => {
			t.phase === `cancel` ? this.gesturePulses.delete(e) : (e === `pan` || e === `pinch` || e === `rotate` ? t.phase === `start` || t.phase === `change` : t.phase === `end`) && (this.gesturePulses.add(e), this.gestureVersions[e]++);
		}));
		try {
			typeof e.addEventListener == `function` && (e.addEventListener(`pointerenter`, this.onPointerEnter), e.addEventListener(`pointerleave`, this.onPointerLeave), e.addEventListener(`pointermove`, this.onPointerMove), e.addEventListener(`pointerdown`, this.onPointerDown), e.addEventListener(`pointerup`, this.onPointerUp), e.addEventListener(`pointercancel`, this.onPointerCancel), e.addEventListener(`wheel`, this.onWheel, { passive: !1 }), e.addEventListener(`lostpointercapture`, this.onLostPointerCapture)), typeof window.addEventListener == `function` && (window.addEventListener(`keydown`, this.onKeyDown), window.addEventListener(`keyup`, this.onKeyUp), window.addEventListener(`blur`, this.onBlur)), document.addEventListener(`visibilitychange`, this.onVisibilityChange);
		} catch (e) {
			throw this.destroy(), e;
		}
	}
	update() {
		if (!this.destroyed) {
			if (this.gestures.update(), typeof navigator > `u` || !navigator.getGamepads) this.gamepadSnapshot = s;
			else {
				let e = navigator.getGamepads();
				this.gamepadSnapshot = e.length ? Array.from(e) : s;
			}
			this.gamepad.update(this.gamepadSnapshot), this.contexts.update(this.gamepadSnapshot);
		}
	}
	endFrame() {
		this.keyboard.endFrame(), this.pointer.endFrame(), this.virtual.endFrame(), this.gesturePulses.clear(), this.contexts.endFrame();
	}
	reset() {
		this.keyboard.reset(), this.pointer.reset(), this.gamepadSnapshot = s, this.gamepad.reset(), this.virtual.reset(), this.virtual.endFrame(), this.gesturePulses.clear(), this.contexts.reset();
	}
	destroy() {
		if (this.destroyed) return;
		this.destroyed = !0, this.reset(), this.gestures.destroy();
		for (let e of this.gestureUnsubscribe) e();
		this.gestureUnsubscribe.length = 0, this.contexts.destroy(), this.virtual.destroy();
		let e = this.canvas;
		typeof e.removeEventListener == `function` && (e.removeEventListener(`pointerenter`, this.onPointerEnter), e.removeEventListener(`pointerleave`, this.onPointerLeave), e.removeEventListener(`pointermove`, this.onPointerMove), e.removeEventListener(`pointerdown`, this.onPointerDown), e.removeEventListener(`pointerup`, this.onPointerUp), e.removeEventListener(`pointercancel`, this.onPointerCancel), e.removeEventListener(`wheel`, this.onWheel), e.removeEventListener(`lostpointercapture`, this.onLostPointerCapture)), typeof window.removeEventListener == `function` && (window.removeEventListener(`keydown`, this.onKeyDown), window.removeEventListener(`keyup`, this.onKeyUp), window.removeEventListener(`blur`, this.onBlur)), document.removeEventListener(`visibilitychange`, this.onVisibilityChange);
	}
};
//#endregion
exports.ActionMap = require_gamepad.ActionMap;
exports.GamepadState = require_gamepad.GamepadState;
exports.GestureRecognizer = require_gestures.GestureRecognizer;
exports.InputContext = require_contexts.InputContext;
exports.InputContexts = require_contexts.InputContexts;
exports.InputManager = InputManager;
exports.Keyboard = Keyboard;
exports.Pointer = Pointer;
exports.VirtualInput = require_virtual.VirtualInput;
exports.gamepadAxisIndex = require_gamepad.gamepadAxisIndex;
exports.gamepadButtonIndex = require_gamepad.gamepadButtonIndex;

//# sourceMappingURL=index.cjs.map