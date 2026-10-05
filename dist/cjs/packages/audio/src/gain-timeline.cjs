const require_errors = require("./errors.cjs");
//#region dist/packages/audio/src/gain-timeline.js
var GainTimeline = class GainTimeline {
	initial;
	segments = [];
	constructor(e = 1) {
		this.initial = e;
	}
	valueAt(e) {
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
	isRampingAt(e) {
		for (let t of this.segments) if (t.start <= e && t.end > e) return !0;
		return !1;
	}
	copy(e) {
		let t = new GainTimeline(this.initial);
		return t.segments = this.segments.map((t) => ({
			...t,
			start: t.start + e,
			end: t.end + e
		})), t;
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
		let t = this.valueAt(e), n = [];
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
	apply(e, t, n = 0) {
		e.cancelScheduledValues(t + n), e.setValueAtTime(this.valueAt(t), t + n);
		for (let r of this.segments) {
			if (r.end < t) continue;
			r.start > t && e.setValueAtTime(r.from, r.start + n);
			let i = Math.max(t, r.end) + n;
			r.curve === `exponential` ? e.exponentialRampToValueAtTime(r.to, i) : e.linearRampToValueAtTime(r.to, i);
		}
	}
};
//#endregion
exports.GainTimeline = GainTimeline;

//# sourceMappingURL=gain-timeline.cjs.map