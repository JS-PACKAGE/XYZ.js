const require_errors = require("./errors.cjs");
//#region dist/packages/audio/src/gain-timeline.js
var GainTimeline = class GainTimeline {
	initial;
	segments = [];
	ordered = !0;
	applying = 0;
	constructor(e = 1) {
		this.initial = e;
	}
	indexAt(e) {
		let t = 0, n = this.segments.length;
		for (; t < n;) {
			let r = t + n >>> 1;
			this.segments[r].start <= e ? t = r + 1 : n = r;
		}
		return t - 1;
	}
	valueAt(e) {
		if (!this.ordered) {
			let t = this.initial;
			for (let n of this.segments) {
				if (e < n.start) break;
				if (e >= n.end) {
					t = n.to;
					continue;
				}
				let r = (e - n.start) / (n.end - n.start);
				return n.curve === `linear` ? n.from + (n.to - n.from) * r : n.from * (n.to / n.from) ** r;
			}
			return t;
		}
		if (Number.isNaN(e) && this.segments.length) return NaN;
		let t = this.indexAt(e);
		if (t < 0) return this.initial;
		let n = this.segments[t];
		if (e >= n.end) return n.to;
		let r = (e - n.start) / (n.end - n.start);
		return n.curve === `linear` ? n.from + (n.to - n.from) * r : n.from * (n.to / n.from) ** r;
	}
	isRampingAt(e) {
		if (!this.ordered) {
			for (let t of this.segments) if (t.start <= e && t.end > e) return !0;
			return !1;
		}
		let t = this.indexAt(e);
		return t >= 0 && this.segments[t].end > e;
	}
	copy(e) {
		let t = new GainTimeline(this.initial);
		return t.segments = this.segments.map((t) => ({
			...t,
			start: t.start + e,
			end: t.end + e
		})), t.ordered = this.ordered && Number.isFinite(e), t;
	}
	validateRamp(t, n, r, i = `linear`) {
		if (!Number.isFinite(t) || t < 0 || t > 1 || !Number.isFinite(n) || n < 0 || !Number.isFinite(r) || r < 0) throw new require_errors.AudioError(`Gain automation requires gain 0..1 and nonnegative finite time/duration.`);
		if (i !== `linear` && i !== `exponential`) throw new require_errors.AudioError(`Unknown gain automation curve.`);
		let a = this.valueAt(n);
		if (i === `exponential` && (a <= 0 || t <= 0)) throw new require_errors.AudioError(`Exponential gain automation cannot touch zero.`);
		return a;
	}
	ramp(e, t, n, r = `linear`) {
		let i = this.validateRamp(e, t, n, r);
		this.cancel(t), this.segments.push({
			start: t,
			end: t + n,
			from: i,
			to: e,
			curve: r
		});
	}
	cancel(e) {
		let t = this.valueAt(e);
		if (!this.ordered) {
			let n = [];
			for (let r of this.segments) {
				if (r.start >= e) break;
				r.end > e ? n.push({
					...r,
					end: e,
					to: t
				}) : n.push(r);
			}
			return this.segments = n, t;
		}
		let n = 0, r = this.segments.length;
		for (; n < r;) {
			let t = n + r >>> 1;
			this.segments[t].start >= e ? r = t : n = t + 1;
		}
		this.applying ? this.segments = this.segments.slice(0, n) : this.segments.length = n;
		let i = this.segments[n - 1];
		return i && i.end > e && (this.segments[n - 1] = {
			...i,
			end: e,
			to: t
		}), t;
	}
	apply(e, t, n = 0) {
		e.cancelScheduledValues(t + n), e.setValueAtTime(this.valueAt(t), t + n);
		let r = this.segments, i = 0;
		if (this.ordered) {
			let e = r.length;
			for (; i < e;) {
				let n = i + e >>> 1;
				r[n].end < t ? i = n + 1 : e = n;
			}
		}
		this.applying++;
		try {
			for (let a = i; a < r.length; a++) {
				let i = r[a];
				if (i.end < t) continue;
				i.start > t && e.setValueAtTime(i.from, i.start + n);
				let o = Math.max(t, i.end) + n;
				i.curve === `exponential` ? e.exponentialRampToValueAtTime(i.to, o) : e.linearRampToValueAtTime(i.to, o);
			}
		} finally {
			this.applying--;
		}
	}
};
//#endregion
exports.GainTimeline = GainTimeline;

//# sourceMappingURL=gain-timeline.cjs.map