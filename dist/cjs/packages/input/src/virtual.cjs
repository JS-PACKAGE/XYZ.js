//#region dist/packages/input/src/virtual.js
var VirtualInput = class {
	controls = /* @__PURE__ */ new Map();
	destroyed = !1;
	set(e, t) {
		if (this.destroyed) throw Error(`Virtual input has been destroyed.`);
		if (typeof e != `string` || !e || e === `__proto__`) throw RangeError(`Virtual control must be a non-empty string.`);
		if (!Number.isFinite(t) || t < -1 || t > 1) throw RangeError(`Virtual input value must be within [-1, 1].`);
		let n = this.controls.get(e);
		if (!n) {
			if (t === 0) return;
			n = {
				value: 0,
				previous: 0,
				minimum: 0,
				maximum: 0
			}, this.controls.set(e, n);
		}
		n.value = t, n.minimum = Math.min(n.minimum, t), n.maximum = Math.max(n.maximum, t);
	}
	value(e) {
		return this.controls.get(e)?.value ?? 0;
	}
	reset() {
		for (let e of this.controls.values()) e.previous = e.value, e.minimum = Math.min(e.value, 0), e.maximum = Math.max(e.value, 0), e.value = 0;
	}
	wasPressed(e, t, n) {
		let r = this.controls.get(e);
		return r ? (t === 1 ? r.maximum : -r.minimum) >= n && r.previous * t < n : !1;
	}
	wasReleased(e, t, n) {
		let r = this.controls.get(e);
		if (!r) return !1;
		let i = t === 1 ? r.maximum : -r.minimum, a = t === 1 ? r.minimum : -r.maximum;
		return i >= n && a < n && r.value * t < n;
	}
	endFrame() {
		for (let [e, t] of this.controls) t.value === 0 ? this.controls.delete(e) : (t.previous = t.value, t.minimum = t.maximum = t.value);
	}
	destroy() {
		this.destroyed = !0, this.controls.clear();
	}
};
//#endregion
exports.VirtualInput = VirtualInput;

//# sourceMappingURL=virtual.cjs.map