const require_hypot = require("../../math/src/hypot.cjs");
const require_input = require("../../../src/data/input.cjs");
//#region dist/packages/input/src/gestures.js
var n = Object.freeze({
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
		for (let t of this.contacts.values()) t.moved || t.longPressed || t.multi || e - t.startTime < this.thresholds.longPressMs || (t.longPressed = !0, this.emit(`longpress`, `end`, [t], t.x, t.y, n));
	}
	reset() {
		for (let e of [...this.contacts.values()]) this.cancel(e.id);
		this.contacts.clear(), this.pair = void 0, this.lastTap = void 0;
	}
	destroy() {
		this.disposed ||= (this.reset(), !0);
	}
	down(e, n) {
		if (this.contacts.has(e.id) || this.contacts.size >= 2) return;
		let { x: r, y: i } = e.position, a = {
			id: e.id,
			type: e.type,
			startX: r,
			startY: i,
			startTime: n,
			x: r,
			y: i,
			lastTime: n,
			vx: 0,
			vy: 0,
			moved: !1,
			panning: !1,
			longPressed: !1,
			multi: !1
		};
		if (this.contacts.set(a.id, a), this.contacts.size < 2) return;
		let [o, s] = [...this.contacts.values()];
		o.panning && this.emitPan(`cancel`, o), o.multi = s.multi = !0, o.panning = !1, this.lastTap = void 0;
		let c = Math.atan2(s.y - o.y, s.x - o.x);
		this.pair = {
			a: o,
			b: s,
			startDistance: Math.max(require_hypot.hypot2(s.x - o.x, s.y - o.y), 1e-6),
			startAngle: c,
			startCenterX: (o.x + s.x) / 2,
			startCenterY: (o.y + s.y) / 2,
			lastAngle: c,
			rotation: 0,
			pinching: !1,
			rotating: !1
		};
	}
	move(e, n) {
		let r = this.contacts.get(e.id);
		if (!r) return;
		let { x: i, y: a } = e.position, o = Math.max(n - r.lastTime, 1) / 1e3;
		if (r.vx = .5 * r.vx + .5 * (i - r.x) / o, r.vy = .5 * r.vy + .5 * (a - r.y) / o, r.x = i, r.y = a, r.lastTime = n, r.multi && !this.pair) return;
		if (this.pair) {
			this.movePair(this.pair);
			return;
		}
		let s = require_hypot.hypot2(i - r.startX, a - r.startY);
		!r.moved && s > this.thresholds.tapSlop && (r.moved = !0), !r.panning && r.moved && s >= this.thresholds.panThreshold ? (r.panning = !0, this.emitPan(`start`, r)) : r.panning && this.emitPan(`change`, r);
	}
	movePair(e) {
		let { a: n, b: r } = e, i = require_hypot.hypot2(r.x - n.x, r.y - n.y) / e.startDistance, a = Math.atan2(r.y - n.y, r.x - n.x), o = a - e.lastAngle;
		o > Math.PI ? o -= 2 * Math.PI : o < -Math.PI && (o += 2 * Math.PI), e.rotation += o, e.lastAngle = a, !e.pinching && Math.abs(i - 1) >= this.thresholds.pinchThreshold ? (e.pinching = !0, this.emitPair(`pinch`, `start`, e)) : e.pinching && this.emitPair(`pinch`, `change`, e), !e.rotating && Math.abs(e.rotation) >= this.thresholds.rotateThreshold ? (e.rotating = !0, this.emitPair(`rotate`, `start`, e)) : e.rotating && this.emitPair(`rotate`, `change`, e);
	}
	up(e, r) {
		let i = this.contacts.get(e);
		if (!i) return;
		let a = this.pair;
		if (a && (a.a === i || a.b === i)) {
			a.pinching && this.emitPair(`pinch`, `end`, a), a.rotating && this.emitPair(`rotate`, `end`, a), this.pair = void 0, this.contacts.delete(e);
			return;
		}
		if (this.contacts.delete(e), i.multi) return;
		let o = r - i.startTime, s = i.x - i.startX, c = i.y - i.startY;
		if (i.panning && this.emitPan(`end`, i), i.longPressed) return;
		let l = require_hypot.hypot2(i.vx, i.vy);
		if (i.moved && o <= this.thresholds.swipeMaxMs && require_hypot.hypot2(s, c) >= this.thresholds.swipeMinDistance && l >= this.thresholds.swipeMinVelocity) {
			let e = Math.abs(s) >= Math.abs(c) ? s < 0 ? `left` : `right` : c < 0 ? `up` : `down`;
			this.emit(`swipe`, `end`, [i], i.x, i.y, {
				x: s,
				y: c
			}, e);
			return;
		}
		if (i.moved || o > this.thresholds.tapMaxMs) return;
		this.emit(`tap`, `end`, [i], i.x, i.y, n);
		let u = this.lastTap;
		u && r - u.time <= this.thresholds.doubleTapMs && require_hypot.hypot2(i.x - u.x, i.y - u.y) <= this.thresholds.doubleTapSlop ? (this.lastTap = void 0, this.emit(`doubletap`, `end`, [i], i.x, i.y, n)) : this.lastTap = {
			x: i.x,
			y: i.y,
			time: r
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
	emitPair(e, n, r) {
		let { a: i, b: a } = r, o = (i.x + a.x) / 2, s = (i.y + a.y) / 2;
		this.emit(e, n, [i, a], o, s, {
			x: o - r.startCenterX,
			y: s - r.startCenterY
		}, void 0, require_hypot.hypot2(a.x - i.x, a.y - i.y) / r.startDistance, r.rotation);
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