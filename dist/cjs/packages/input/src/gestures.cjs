const require_input = require("../../../src/data/input.cjs");
//#region dist/packages/input/src/gestures.js
var t = Object.freeze({
	x: 0,
	y: 0
});
var GestureRecognizer = class extends EventTarget {
	thresholds;
	clock;
	contacts = /* @__PURE__ */ new Map();
	pair;
	lastTap;
	disposed = !1;
	constructor(t = {}) {
		super(), this.clock = t.now ?? (() => performance.now()), this.thresholds = {
			...require_input.gestureDefaults,
			...t.thresholds
		};
		for (let [e, t] of Object.entries(this.thresholds)) if (!Number.isFinite(t) || t < 0) throw RangeError(`Gesture threshold ${e} must be nonnegative.`);
	}
	on(e, t) {
		let handler = (e) => t(e.detail);
		return this.addEventListener(e, handler), () => this.removeEventListener(e, handler);
	}
	feed(e) {
		if (this.disposed) return;
		let t = this.clock();
		switch (e.kind) {
			case `down`:
				e.button === 0 && this.down(e, t);
				break;
			case `move`:
				this.move(e, t);
				break;
			case `up`:
				if (e.button === 0) {
					let n = this.contacts.get(e.id);
					n && (n.x !== e.position.x || n.y !== e.position.y) && this.move(e, t), this.up(e.id, t);
				}
				break;
			case `cancel`: this.cancel(e.id);
		}
	}
	update() {
		if (this.disposed || this.pair) return;
		let e = this.clock();
		for (let n of this.contacts.values()) n.moved || n.longPressed || n.multi || e - n.startTime < this.thresholds.longPressMs || (n.longPressed = !0, this.emit(`longpress`, `end`, [n], n.x, n.y, t));
	}
	reset() {
		for (let e of [...this.contacts.values()]) this.cancel(e.id);
		this.contacts.clear(), this.pair = void 0, this.lastTap = void 0;
	}
	destroy() {
		this.disposed ||= (this.reset(), !0);
	}
	down(e, t) {
		if (this.contacts.has(e.id) || this.contacts.size >= 2) return;
		let { x: n, y: r } = e.position, i = {
			id: e.id,
			type: e.type,
			startX: n,
			startY: r,
			startTime: t,
			x: n,
			y: r,
			lastTime: t,
			vx: 0,
			vy: 0,
			moved: !1,
			panning: !1,
			longPressed: !1,
			multi: !1
		};
		if (this.contacts.set(i.id, i), this.contacts.size < 2) return;
		let [a, o] = [...this.contacts.values()];
		a.panning && this.emitPan(`cancel`, a), a.multi = o.multi = !0, a.panning = !1, this.lastTap = void 0;
		let s = Math.atan2(o.y - a.y, o.x - a.x);
		this.pair = {
			a,
			b: o,
			startDistance: Math.max(Math.hypot(o.x - a.x, o.y - a.y), 1e-6),
			startAngle: s,
			startCenterX: (a.x + o.x) / 2,
			startCenterY: (a.y + o.y) / 2,
			lastAngle: s,
			rotation: 0,
			pinching: !1,
			rotating: !1
		};
	}
	move(e, t) {
		let n = this.contacts.get(e.id);
		if (!n) return;
		let { x: r, y: i } = e.position, a = Math.max(t - n.lastTime, 1) / 1e3;
		if (n.vx = .5 * n.vx + .5 * (r - n.x) / a, n.vy = .5 * n.vy + .5 * (i - n.y) / a, n.x = r, n.y = i, n.lastTime = t, n.multi && !this.pair) return;
		if (this.pair) {
			this.movePair(this.pair);
			return;
		}
		let o = Math.hypot(r - n.startX, i - n.startY);
		!n.moved && o > this.thresholds.tapSlop && (n.moved = !0), !n.panning && n.moved && o >= this.thresholds.panThreshold ? (n.panning = !0, this.emitPan(`start`, n)) : n.panning && this.emitPan(`change`, n);
	}
	movePair(e) {
		let { a: t, b: n } = e, r = Math.hypot(n.x - t.x, n.y - t.y) / e.startDistance, i = Math.atan2(n.y - t.y, n.x - t.x), a = i - e.lastAngle;
		a > Math.PI ? a -= 2 * Math.PI : a < -Math.PI && (a += 2 * Math.PI), e.rotation += a, e.lastAngle = i, !e.pinching && Math.abs(r - 1) >= this.thresholds.pinchThreshold ? (e.pinching = !0, this.emitPair(`pinch`, `start`, e)) : e.pinching && this.emitPair(`pinch`, `change`, e), !e.rotating && Math.abs(e.rotation) >= this.thresholds.rotateThreshold ? (e.rotating = !0, this.emitPair(`rotate`, `start`, e)) : e.rotating && this.emitPair(`rotate`, `change`, e);
	}
	up(e, n) {
		let r = this.contacts.get(e);
		if (!r) return;
		let i = this.pair;
		if (i && (i.a === r || i.b === r)) {
			i.pinching && this.emitPair(`pinch`, `end`, i), i.rotating && this.emitPair(`rotate`, `end`, i), this.pair = void 0, this.contacts.delete(e);
			return;
		}
		if (this.contacts.delete(e), r.multi) return;
		let a = n - r.startTime, o = r.x - r.startX, s = r.y - r.startY;
		if (r.panning && this.emitPan(`end`, r), r.longPressed) return;
		let c = Math.hypot(r.vx, r.vy);
		if (r.moved && a <= this.thresholds.swipeMaxMs && Math.hypot(o, s) >= this.thresholds.swipeMinDistance && c >= this.thresholds.swipeMinVelocity) {
			let e = Math.abs(o) >= Math.abs(s) ? o < 0 ? `left` : `right` : s < 0 ? `up` : `down`;
			this.emit(`swipe`, `end`, [r], r.x, r.y, {
				x: o,
				y: s
			}, e);
			return;
		}
		if (r.moved || a > this.thresholds.tapMaxMs) return;
		this.emit(`tap`, `end`, [r], r.x, r.y, t);
		let l = this.lastTap;
		l && n - l.time <= this.thresholds.doubleTapMs && Math.hypot(r.x - l.x, r.y - l.y) <= this.thresholds.doubleTapSlop ? (this.lastTap = void 0, this.emit(`doubletap`, `end`, [r], r.x, r.y, t)) : this.lastTap = {
			x: r.x,
			y: r.y,
			time: n
		};
	}
	cancel(e) {
		let t = this.contacts.get(e);
		if (!t) return;
		let n = this.pair;
		if (n && (n.a === t || n.b === t)) {
			n.pinching && this.emitPair(`pinch`, `cancel`, n), n.rotating && this.emitPair(`rotate`, `cancel`, n), this.pair = void 0, this.contacts.delete(n.a.id), this.contacts.delete(n.b.id);
			return;
		}
		this.contacts.delete(e), t.panning && this.emitPan(`cancel`, t);
	}
	emitPan(e, t) {
		this.emit(`pan`, e, [t], t.x, t.y, {
			x: t.x - t.startX,
			y: t.y - t.startY
		});
	}
	emitPair(e, t, n) {
		let { a: r, b: i } = n, a = (r.x + i.x) / 2, o = (r.y + i.y) / 2;
		this.emit(e, t, [r, i], a, o, {
			x: a - n.startCenterX,
			y: o - n.startCenterY
		}, void 0, Math.hypot(i.x - r.x, i.y - r.y) / n.startDistance, n.rotation);
	}
	emit(e, t, n, r, i, a, o, s = 1, c = 0) {
		let l = n[0], u = {
			type: e,
			phase: t,
			pointerIds: n.map((e) => e.id),
			pointerType: l.type,
			center: {
				x: r,
				y: i
			},
			translation: a,
			velocity: {
				x: n.reduce((e, t) => e + t.vx, 0) / n.length,
				y: n.reduce((e, t) => e + t.vy, 0) / n.length
			},
			...o ? { direction: o } : {},
			scale: s,
			rotation: c
		};
		this.dispatchEvent(new CustomEvent(e, { detail: u }));
	}
};
//#endregion
exports.GestureRecognizer = GestureRecognizer;

//# sourceMappingURL=gestures.cjs.map