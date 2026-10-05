//#region dist/packages/input/src/gamepad.js
var gamepadButtonIndex = {
	a: 0,
	b: 1,
	x: 2,
	y: 3,
	lb: 4,
	rb: 5,
	lt: 6,
	rt: 7,
	back: 8,
	start: 9,
	ls: 10,
	rs: 11,
	up: 12,
	down: 13,
	left: 14,
	right: 15,
	home: 16
};
var gamepadAxisIndex = {
	leftX: 0,
	leftY: 1,
	rightX: 2,
	rightY: 3
};
var e = Object.keys(gamepadButtonIndex);
var t = Object.keys(gamepadAxisIndex);
var GamepadState = class {
	profileSource;
	padIndex = -1;
	padId = ``;
	preferred;
	deadzoneValue = .15;
	thresholdValue = .5;
	values = Array(e.length).fill(0);
	previous = Array(e.length).fill(0);
	rawAxes = [
		0,
		0,
		0,
		0
	];
	previousAxes = [
		0,
		0,
		0,
		0
	];
	profiles = [];
	buttonSources = [];
	axisSources = [];
	activePad;
	activeProfile;
	pollVersion = 0;
	get pressVersion() {
		return this.pollVersion;
	}
	constructor(e) {
		this.profileSource = e;
	}
	get index() {
		return this.padIndex;
	}
	get id() {
		return this.padId;
	}
	get connected() {
		return this.padIndex >= 0;
	}
	get mapping() {
		return this.activeProfile;
	}
	addMapping(e) {
		let checkIndex = (e, t) => {
			if (!Number.isInteger(e) || e < 0 || e > 255) throw RangeError(`${t} must be an integer within 0..255.`);
		};
		if (e.match, !e.match) throw RangeError(`Gamepad mapping needs a non-empty match.`);
		for (let [t, n] of Object.entries(e.buttons ?? {})) buttonSlot(t), checkIndex(n, `buttons.${t}`);
		for (let [t, n] of Object.entries(e.triggerAxes ?? {})) checkIndex(n, `triggerAxes.${t}`);
		for (let [t, n] of Object.entries(e.axes ?? {})) axisSlot(t), checkIndex(typeof n == `number` ? n : n.index, `axes.${t}`);
		let t = { ...e };
		return this.profiles.push(t), () => {
			let e = this.profiles.indexOf(t);
			e >= 0 && this.profiles.splice(e, 1);
		};
	}
	async rumble(e = {}) {
		let t = e.duration ?? 200, n = e.strong ?? 1, r = e.weak ?? n, i = e.startDelay ?? 0;
		if (!Number.isFinite(t) || t < 0 || t > 5e3) throw RangeError(`Rumble duration must be within 0..5000 ms.`);
		if (!Number.isFinite(i) || i < 0 || i > 5e3) throw RangeError(`Rumble startDelay must be within 0..5000 ms.`);
		for (let e of [n, r]) if (!Number.isFinite(e) || e < 0 || e > 1) throw RangeError(`Rumble magnitudes must be within 0..1.`);
		let a = this.activePad;
		if (!a) return !1;
		try {
			let e = a.vibrationActuator;
			if (e?.playEffect) return await e.playEffect(e.type ?? `dual-rumble`, {
				startDelay: i,
				duration: t,
				weakMagnitude: r,
				strongMagnitude: n
			}) === `complete`;
			let o = a.hapticActuators?.[0];
			if (o?.pulse) return i > 0 && await new Promise((e) => setTimeout(e, i)), await o.pulse(Math.max(n, r), t);
		} catch {}
		return !1;
	}
	async stopRumble() {
		try {
			return await this.activePad?.vibrationActuator?.reset?.() === `complete`;
		} catch {
			return !1;
		}
	}
	get preferredIndex() {
		return this.preferred;
	}
	set preferredIndex(e) {
		if (e !== void 0 && (!Number.isInteger(e) || e < 0)) throw RangeError(`preferredIndex must be a nonnegative integer.`);
		this.preferred = e;
	}
	get deadzone() {
		return this.deadzoneValue;
	}
	set deadzone(e) {
		if (!Number.isFinite(e) || e < 0 || e >= 1) throw RangeError(`deadzone must be finite and within [0, 1).`);
		this.deadzoneValue = e;
	}
	get pressThreshold() {
		return this.thresholdValue;
	}
	set pressThreshold(e) {
		if (!Number.isFinite(e) || e <= 0 || e > 1) throw RangeError(`pressThreshold must be finite and within (0, 1].`);
		this.thresholdValue = e;
	}
	button(e) {
		return this.values[buttonSlot(e)];
	}
	isDown(e) {
		return this.values[buttonSlot(e)] >= this.thresholdValue;
	}
	wasPressed(e) {
		let t = buttonSlot(e);
		return this.values[t] >= this.thresholdValue && this.previous[t] < this.thresholdValue;
	}
	wasReleased(e) {
		let t = buttonSlot(e);
		return this.values[t] < this.thresholdValue && this.previous[t] >= this.thresholdValue;
	}
	firstPressed() {
		return e.find((e) => this.wasPressed(e));
	}
	axis(e) {
		let t = axisSlot(e), n = t < 2 ? 0 : 2, r = Math.hypot(this.rawAxes[n], this.rawAxes[n + 1]);
		return r <= this.deadzoneValue ? 0 : this.rawAxes[t] * Math.min(1, (r - this.deadzoneValue) / (1 - this.deadzoneValue)) / r;
	}
	stick(e) {
		let t = e === `left` ? 0 : 2, n = this.rawAxes[t], r = this.rawAxes[t + 1], i = Math.hypot(n, r);
		if (i <= this.deadzoneValue) return {
			x: 0,
			y: 0
		};
		let a = Math.min(1, (i - this.deadzoneValue) / (1 - this.deadzoneValue)) / i;
		return {
			x: n * a,
			y: r * a
		};
	}
	source(e) {
		if (this.connected) {
			if (`button` in e) return this.buttonSources[buttonSlot(e.button)];
			if (`axis` in e) return this.axisSources[axisSlot(e.axis)];
		}
	}
	axisWasPressed(e, t) {
		let n = axisSlot(e), r = n < 2 ? 0 : 2, i = Math.hypot(this.previousAxes[r], this.previousAxes[r + 1]), a = i <= this.deadzoneValue ? 0 : this.previousAxes[n] * Math.min(1, (i - this.deadzoneValue) / (1 - this.deadzoneValue)) / i;
		return this.axis(e) * t >= this.thresholdValue && a * t < this.thresholdValue;
	}
	update(n) {
		this.pollVersion++;
		let r = this.select(n), i = this.previous;
		this.previous = this.values, this.values = i;
		let a = this.previousAxes;
		this.previousAxes = this.rawAxes, this.rawAxes = a;
		let o = r && r.mapping !== `standard` ? this.profileFor(r) : void 0, s = (r?.index ?? -1) !== this.padIndex || (r?.id ?? ``) !== this.padId || o !== this.activeProfile;
		if (!r) {
			this.activePad = void 0, this.activeProfile = void 0, this.values.fill(0), this.rawAxes.fill(0), this.padIndex = -1, this.padId = ``;
			return;
		}
		for (let t = 0; t < e.length; t++) {
			let n = e[t], i;
			if (!o) i = r.buttons[gamepadButtonIndex[n]]?.value;
			else {
				let e = o.buttons?.[n];
				if (e !== void 0) i = r.buttons[e]?.value;
				else if ((n === `lt` || n === `rt`) && o.triggerAxes?.[n] !== void 0) {
					let e = r.axes[o.triggerAxes[n]];
					i = Number.isFinite(e) ? (e + 1) / 2 : 0;
				}
			}
			if (this.values[t] = Number.isFinite(i) ? Math.min(1, Math.max(0, i)) : 0, s) {
				let e = o ? o.buttons?.[n] : gamepadButtonIndex[n], i = n === `lt` || n === `rt` ? o?.triggerAxes?.[n] : void 0;
				this.buttonSources[t] = e === void 0 ? i === void 0 ? `` : `gamepad:${r.index}:axis:${i}` : `gamepad:${r.index}:button:${e}`;
			}
		}
		for (let e = 0; e < t.length; e++) {
			let n = t[e], i = o ? o.axes?.[n] : gamepadAxisIndex[n], a = typeof i == `number` ? i : i?.index, c = a === void 0 ? void 0 : r.axes[a];
			typeof i == `object` && i.invert && (c = -c), this.rawAxes[e] = Number.isFinite(c) ? Math.min(1, Math.max(-1, c)) : 0, s && (this.axisSources[e] = a === void 0 ? `` : `gamepad:${r.index}:axis:${a}`);
		}
		if (this.activePad = r, this.activeProfile = o, s) {
			for (let e = 0; e < this.values.length; e++) this.previous[e] = this.values[e];
			for (let e = 0; e < this.rawAxes.length; e++) this.previousAxes[e] = this.rawAxes[e];
		}
		this.padIndex = r.index, this.padId = r.id;
	}
	reset() {
		this.activePad = void 0, this.activeProfile = void 0, this.values.fill(0), this.previous.fill(0), this.rawAxes.fill(0), this.previousAxes.fill(0), this.padIndex = -1, this.padId = ``;
	}
	profileFor(e) {
		let t = this.profileSource?.profiles ?? this.profiles;
		for (let n = t.length - 1; n >= 0; n--) if (matches(t[n].match, e.id)) return t[n];
	}
	select(e) {
		let usable = (e) => e && e.connected && (e.mapping === `standard` || this.profileFor(e)) ? e : void 0;
		if (this.preferred !== void 0) {
			for (let t = 0; t < e.length; t++) if (e[t]?.index === this.preferred) return usable(e[t]);
			return;
		}
		for (let t = 0; t < e.length; t++) {
			let n = usable(e[t]);
			if (n) return n;
		}
	}
};
function matches(e, t) {
	return typeof e == `string` ? t.toLowerCase().includes(e.toLowerCase()) : new RegExp(e.source, e.flags.replace(/[gy]/g, ``)).test(t);
}
function buttonSlot(t) {
	let n = e.indexOf(t);
	if (n < 0) throw RangeError(`Unknown gamepad button: ${t}`);
	return n;
}
function axisSlot(e) {
	let n = t.indexOf(e);
	if (n < 0) throw RangeError(`Unknown gamepad axis: ${e}`);
	return n;
}
var n = {
	tap: !0,
	doubletap: !0,
	longpress: !0,
	swipe: !0,
	pan: !0,
	pinch: !0,
	rotate: !0
};
function checkBinding(e) {
	if (!e || typeof e != `object`) throw RangeError(`Action binding must be an object.`);
	if ([
		`button`,
		`axis`,
		`key`,
		`pointerButton`,
		`wheel`,
		`gesture`,
		`virtual`
	].filter((t) => Object.hasOwn(e, t)).length !== 1) throw RangeError(`Action binding must specify exactly one source.`);
	if (`button` in e) return buttonSlot(e.button), { button: e.button };
	if (`axis` in e) return axisSlot(e.axis), checkDirection(e.direction), {
		axis: e.axis,
		direction: e.direction
	};
	if (`pointerButton` in e) {
		if (!Number.isInteger(e.pointerButton) || e.pointerButton < 0 || e.pointerButton > 31) throw RangeError(`Pointer button must be an integer within 0..31.`);
		return { pointerButton: e.pointerButton };
	}
	if (`wheel` in e) {
		if (e.wheel !== `x` && e.wheel !== `y` && e.wheel !== `z`) throw RangeError(`Wheel axis must be x, y or z.`);
		return checkDirection(e.direction), {
			wheel: e.wheel,
			direction: e.direction
		};
	}
	if (`gesture` in e) {
		if (!Object.hasOwn(n, e.gesture)) throw RangeError(`Unknown gesture binding.`);
		return { gesture: e.gesture };
	}
	if (`virtual` in e) return checkAction(e.virtual), e.direction !== void 0 && checkDirection(e.direction), e.direction === void 0 ? { virtual: e.virtual } : {
		virtual: e.virtual,
		direction: e.direction
	};
	if (typeof e.key != `string` || !e.key) throw RangeError(`Key binding must be a non-empty KeyboardEvent.code.`);
	return { key: e.key };
}
function checkDirection(e) {
	if (e !== 1 && e !== -1) throw RangeError(`Axis binding direction must be 1 or -1.`);
}
var ActionMap = class {
	pad;
	keyboard;
	sources;
	managed;
	map = /* @__PURE__ */ new Map();
	down = /* @__PURE__ */ new Map();
	values = /* @__PURE__ */ new Map();
	frameDown = /* @__PURE__ */ new Map();
	identities = /* @__PURE__ */ new WeakMap();
	blocked = /* @__PURE__ */ new WeakSet();
	mutedPressVersions = /* @__PURE__ */ new WeakMap();
	pulseFrame = 0;
	edgePressed = /* @__PURE__ */ new Set();
	edgeReleased = /* @__PURE__ */ new Set();
	pendingReleased = /* @__PURE__ */ new Set();
	constructor(e, t, n, r = !1) {
		this.pad = e, this.keyboard = t, this.sources = n, this.managed = r;
	}
	bind(e, ...t) {
		checkAction(e);
		let n = t.map((e) => this.compile(e)), r = this.map.get(e) ?? [];
		for (let e of n) r.some((t) => sameBinding(t, e)) || r.push(e);
		this.map.set(e, r);
	}
	rebind(e, t) {
		if (checkAction(e), !Array.isArray(t)) throw RangeError(`Action bindings must be an array.`);
		this.map.set(e, t.map((e) => this.compile(e)));
	}
	unbind(e) {
		return this.map.delete(e) ? (this.release(e), this.down.delete(e), this.values.delete(e), !0) : !1;
	}
	bindings(e) {
		return this.map.get(e) ?? [];
	}
	value(e) {
		if (this.managed) return this.values.get(e) ?? 0;
		let t = 0;
		for (let n of this.map.get(e) ?? []) t = Math.max(t, this.bindingValue(n));
		return t;
	}
	isDown(e) {
		return this.value(e) >= this.pad.pressThreshold;
	}
	wasPressed(e) {
		return this.edgePressed.has(e);
	}
	wasReleased(e) {
		return this.edgeReleased.has(e);
	}
	update(e, t, n = !1) {
		n || (this.edgePressed.clear(), this.edgeReleased.clear());
		for (let e of this.pendingReleased) this.edgeReleased.add(e);
		this.pendingReleased.clear();
		for (let [n, r] of this.map) {
			let i = this.managed ? this.frameDown.get(n) ?? this.down.get(n) ?? !1 : this.down.get(n) ?? !1;
			this.managed && !this.frameDown.has(n) && this.frameDown.set(n, i);
			let a = 0, o = !1, s = !1, c = !1;
			for (let n of r) {
				let r = this.identities.get(n) || this.pad.source(n), i = this.blocked.has(n), l = r !== void 0 && e?.has(r) === !0, u = this.bindingPressed(n), d = this.bindingPressVersion(n);
				u && l && this.mutedPressVersions.set(n, d), l ? this.blocked.add(n) : (a = Math.max(a, this.bindingValue(n)), this.mutedPressVersions.get(n) !== d && (o ||= u, s ||= u && (`wheel` in n || `gesture` in n)), i || (c ||= this.bindingReleased(n)), this.blocked.delete(n)), r && t?.add(r);
			}
			let l = a >= this.pad.pressThreshold;
			(i && !l || !l && c) && this.edgeReleased.add(n), o && (!i || s) ? this.edgePressed.add(n) : l || this.edgePressed.delete(n), this.values.set(n, a), this.down.set(n, l);
		}
	}
	baseline() {
		for (let e of this.map.values()) for (let t of e) this.bindingPressed(t) && this.mutedPressVersions.set(t, this.bindingPressVersion(t));
	}
	reset() {
		for (let e of this.map.keys()) this.release(e);
		this.values.clear(), this.down.clear(), this.frameDown.clear(), this.blocked = /* @__PURE__ */ new WeakSet(), this.mutedPressVersions = /* @__PURE__ */ new WeakMap(), this.edgePressed.clear();
	}
	endFrame() {
		this.edgePressed.clear(), this.edgeReleased.clear(), this.frameDown.clear(), this.pulseFrame++;
	}
	updateInactive() {
		this.edgePressed.clear(), this.edgeReleased.clear();
		for (let e of this.pendingReleased) this.edgeReleased.add(e);
		this.pendingReleased.clear();
	}
	export() {
		let e = {};
		for (let [t, n] of this.map) Object.defineProperty(e, t, {
			value: n.map((e) => ({ ...e })),
			enumerable: !0,
			configurable: !0,
			writable: !0
		});
		return e;
	}
	import(e) {
		if (!e || typeof e != `object` || Array.isArray(e)) throw RangeError(`Action bindings must be an object.`);
		let t = /* @__PURE__ */ new Map();
		for (let n of Object.keys(e)) {
			checkAction(n);
			let r = e[n];
			if (!Array.isArray(r)) throw RangeError(`Bindings for "${n}" must be an array.`);
			t.set(n, r.map((e) => this.compile(e)));
		}
		this.reset(), this.map.clear();
		for (let [e, n] of t) this.map.set(e, n);
	}
	release(e) {
		this.down.get(e) && (this.edgeReleased.add(e), this.pendingReleased.add(e)), this.edgePressed.delete(e), this.values.set(e, 0), this.down.set(e, !1);
	}
	compile(e) {
		let t = checkBinding(e), n;
		return `key` in t ? n = `key:${t.key}` : `pointerButton` in t ? n = `pointer:${t.pointerButton}` : `wheel` in t ? n = `wheel:${t.wheel}` : `gesture` in t ? n = `pointer:0` : `virtual` in t && (n = `virtual:${t.virtual}`), n && this.identities.set(t, n), t;
	}
	bindingPressVersion(e) {
		return `button` in e || `axis` in e ? this.pad.pressVersion : `key` in e ? this.keyboard?.pressVersion?.(e.key) ?? this.pulseFrame : `pointerButton` in e ? this.sources?.pointer.pressVersion(e.pointerButton) ?? this.pulseFrame : `wheel` in e ? this.sources?.pointer.wheelVersion(e.wheel) ?? this.pulseFrame : `gesture` in e ? this.sources?.gestureVersion(e.gesture) ?? this.pulseFrame : this.pulseFrame;
	}
	bindingValue(e) {
		return `button` in e ? this.pad.button(e.button) : `axis` in e ? Math.max(0, this.pad.axis(e.axis) * e.direction) : `key` in e ? +!!this.keyboard?.isDown(e.key) : `pointerButton` in e ? +!!this.sources?.pointer.isDown(e.pointerButton) : `wheel` in e ? Math.min(1, Math.max(0, (this.sources?.pointer.wheelDelta(e.wheel) ?? 0) * e.direction)) : `gesture` in e ? +!!this.sources?.gesture(e.gesture) : Math.max(0, (this.sources?.virtual.value(e.virtual) ?? 0) * (e.direction ?? 1));
	}
	bindingPressed(e) {
		return `button` in e ? this.pad.wasPressed(e.button) : `axis` in e ? this.pad.axisWasPressed(e.axis, e.direction) : `key` in e ? this.keyboard?.wasPressed(e.key) ?? !1 : `pointerButton` in e ? this.sources?.pointer.wasPressed(e.pointerButton) ?? !1 : `virtual` in e ? this.sources?.virtual.wasPressed(e.virtual, e.direction ?? 1, this.pad.pressThreshold) ?? !1 : this.bindingValue(e) >= this.pad.pressThreshold;
	}
	bindingReleased(e) {
		return `key` in e ? this.keyboard?.wasReleased(e.key) ?? !1 : `pointerButton` in e ? this.sources?.pointer.wasReleased(e.pointerButton) ?? !1 : `virtual` in e ? this.sources?.virtual.wasReleased(e.virtual, e.direction ?? 1, this.pad.pressThreshold) ?? !1 : !1;
	}
};
function checkAction(e) {
	if (typeof e != `string` || !e || e === `__proto__`) throw RangeError(`Action name must be a non-empty string.`);
}
function sameBinding(e, t) {
	return `button` in e && `button` in t ? e.button === t.button : `axis` in e && `axis` in t ? e.axis === t.axis && e.direction === t.direction : `key` in e && `key` in t ? e.key === t.key : `pointerButton` in e && `pointerButton` in t ? e.pointerButton === t.pointerButton : `wheel` in e && `wheel` in t ? e.wheel === t.wheel && e.direction === t.direction : `gesture` in e && `gesture` in t ? e.gesture === t.gesture : `virtual` in e && `virtual` in t && e.virtual === t.virtual && (e.direction ?? 1) === (t.direction ?? 1);
}
//#endregion
exports.ActionMap = ActionMap;
exports.GamepadState = GamepadState;
exports.gamepadAxisIndex = gamepadAxisIndex;
exports.gamepadButtonIndex = gamepadButtonIndex;

//# sourceMappingURL=gamepad.cjs.map