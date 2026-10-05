const require_audio = require("../../../src/data/audio.cjs");
const require_errors = require("./errors.cjs");
const require_effects = require("./effects.cjs");
const require_gain_timeline = require("./gain-timeline.cjs");
//#region dist/packages/audio/src/mixer.js
var a = [
	`master`,
	`music`,
	`sfx`,
	`ui`
];
function duckValueAt(e, t, n = 1) {
	for (let n = e.length - 1; n >= 0; n--) {
		let r = e[n];
		if (r.at <= t) return r.target + (r.from - r.target) * Math.exp(-(t - r.at) / r.tau);
	}
	return n;
}
var AudioMixer = class {
	graphs = /* @__PURE__ */ new Map();
	effects = {};
	envelopes = {};
	rules = Object.freeze([]);
	activities = /* @__PURE__ */ new Set();
	primary;
	disposed = !1;
	cleanupTimer;
	constructor() {
		for (let e of a) this.effects[e] = Object.freeze([]), this.envelopes[e] = new require_gain_timeline.GainTimeline();
	}
	get currentTime() {
		return this.primary?.currentTime ?? 0;
	}
	get contextCount() {
		return this.graphs.size;
	}
	getEffects(e) {
		return this.effects[e];
	}
	get ducking() {
		return this.rules;
	}
	attach(e) {
		if (this.disposed) throw new require_errors.AudioError(`Audio mixer has been destroyed.`);
		if (this.graphs.has(e)) return;
		let r = this.primary;
		this.primary ??= e;
		let i = e.currentTime, o = e === this.primary ? i : this.currentTime, s = {
			context: e,
			controlTime: i,
			envelopes: {},
			buses: {}
		};
		try {
			for (let t of a) {
				let r = e.createGain(), a = e.createGain(), c = e.createGain(), l = e.createAnalyser(), u = require_effects.createEffectChain(e, this.effects[t]);
				s.buses[t] = {
					input: r,
					volume: a,
					duck: c,
					duckPlan: [],
					analyser: l,
					chain: u,
					chainFadeStartedAt: -1 / 0,
					retired: []
				}, r.connect(u.input), u.output.connect(a), a.connect(c), c.connect(l);
				let d = this.envelopes[t].copy(i - o);
				s.envelopes[t] = d, d.apply(a.gain, i);
			}
			s.buses.master.analyser.connect(e.destination);
			for (let e of [
				`music`,
				`sfx`,
				`ui`
			]) s.buses[e].analyser.connect(s.buses.master.input);
			this.graphs.set(e, s), this.refreshDucking();
		} catch (e) {
			throw this.disposeGraph(s), this.primary = r, e;
		}
	}
	input(e, t) {
		return this.attach(e), this.graphs.get(e).buses[t].input;
	}
	analyser(e, t = 0) {
		return [...this.graphs.values()][t]?.buses[e].analyser;
	}
	setEffects(i, a) {
		if (this.disposed) throw new require_errors.AudioError(`Audio mixer has been destroyed.`);
		let o = require_effects.snapshotEffects(a), s = [];
		try {
			for (let e of this.graphs.values()) s.push({
				graph: e,
				chain: require_effects.createEffectChain(e.context, o)
			});
		} catch (e) {
			for (let e of s) e.chain.disconnect();
			throw e;
		}
		this.effects[i] = o;
		for (let { graph: t, chain: n } of s) {
			let r = t.buses[i], a = t.context.currentTime;
			n.output.gain.setValueAtTime(0, a), n.output.gain.linearRampToValueAtTime(1, a + require_audio.audioDefaults.effectCrossfade);
			let o = Math.min(1, Math.max(0, (a - r.chainFadeStartedAt) / require_audio.audioDefaults.effectCrossfade));
			o < 1 && typeof r.chain.output.gain.cancelAndHoldAtTime == `function` ? r.chain.output.gain.cancelAndHoldAtTime(a) : (r.chain.output.gain.cancelScheduledValues(a), r.chain.output.gain.setValueAtTime(o, a)), r.chain.output.gain.linearRampToValueAtTime(0, a + require_audio.audioDefaults.effectCrossfade), r.input.connect(n.input), n.output.connect(r.volume), r.retired.push({
				chain: r.chain,
				until: a + require_audio.audioDefaults.effectCrossfade
			}), r.chain = n, r.chainFadeStartedAt = a;
		}
		s.length && !this.cleanupTimer && (this.cleanupTimer = setInterval(() => this.collect(), require_audio.audioDefaults.tickMs));
	}
	setGain(t, n) {
		let r = this.currentTime;
		this.scheduleGain(t, n, r, require_audio.audioDefaults.gainSmoothing, `linear`, r);
	}
	automate(e, t, n, r, i = `linear`) {
		this.scheduleGain(e, t, n, r, i, this.currentTime);
	}
	scheduleGain(e, n, r, i, a, o) {
		if (this.disposed) throw new require_errors.AudioError(`Audio mixer has been destroyed.`);
		if (r < o) throw new require_errors.AudioError(`Gain automation cannot start in the past.`);
		this.envelopes[e].validateRamp(n, r, i, a);
		for (let t of this.graphs.values()) t.controlTime = t.context === this.primary ? o : t.context.currentTime, t.envelopes[e].validateRamp(n, t.controlTime + (r - o), i, a);
		this.envelopes[e].ramp(n, r, i, a);
		for (let t of this.graphs.values()) {
			let s = t.controlTime, c = s + (r - o), l = t.envelopes[e], u = t.buses[e].volume.gain, d = l.valueAt(c), f = l.isRampingAt(c);
			l.ramp(n, c, i, a), typeof u.cancelAndHoldAtTime == `function` ? (u.cancelAndHoldAtTime(c), i === 0 ? u.setValueAtTime(n, c) : (f || u.setValueAtTime(d, c), a === `exponential` ? u.exponentialRampToValueAtTime(n, c + i) : u.linearRampToValueAtTime(n, c + i))) : l.apply(u, s);
		}
	}
	cancelAutomation(e, n) {
		if (this.disposed) throw new require_errors.AudioError(`Audio mixer has been destroyed.`);
		let r = this.currentTime;
		if (n ??= r, !Number.isFinite(n) || n < r) throw new require_errors.AudioError(`Cancellation time must not be in the past.`);
		let i = this.envelopes[e].cancel(n);
		for (let t of this.graphs.values()) {
			let i = t.context === this.primary ? r : t.context.currentTime, a = i + (n - r), o = t.envelopes[e], s = t.buses[e].volume.gain;
			o.cancel(a), typeof s.cancelAndHoldAtTime == `function` ? s.cancelAndHoldAtTime(a) : o.apply(s, i);
		}
		return i;
	}
	setDucking(n) {
		if (this.disposed) throw new require_errors.AudioError(`Audio mixer has been destroyed.`);
		this.rules = Object.freeze(n.map((n) => {
			if (![
				`music`,
				`sfx`,
				`ui`
			].includes(n.source) || !a.includes(n.target) || !Number.isFinite(n.gain) || n.gain < 0 || n.gain > 1 || !Number.isFinite(n.attack ?? require_audio.audioDefaults.duckAttack) || (n.attack ?? require_audio.audioDefaults.duckAttack) < 0 || !Number.isFinite(n.release ?? require_audio.audioDefaults.duckRelease) || (n.release ?? require_audio.audioDefaults.duckRelease) < 0) throw new require_errors.AudioError(`Invalid audio ducking rule.`);
			return Object.freeze({ ...n });
		})), this.refreshDucking();
	}
	acquire(n, r = 0, i = 1 / 0) {
		if (this.disposed) throw new require_errors.AudioError(`Audio mixer has been destroyed.`);
		if (!Number.isFinite(r) || r < 0 || i <= 0 || Number.isNaN(i)) throw new require_errors.AudioError(`Invalid audio activity interval.`);
		let a = this.currentTime, o = {
			channel: n,
			start: a + r,
			end: a + r + i,
			enabled: !0
		};
		this.activities.add(o), this.refreshDucking();
		let s = !1;
		return {
			get released() {
				return s;
			},
			setActive: (e) => {
				s || o.enabled === e || (o.enabled = e, this.refreshDucking());
			},
			release: (n = 0) => {
				if (!Number.isFinite(n) || n < 0) throw new require_errors.AudioError(`Activity release delay must be nonnegative.`);
				s && (n > 0 || !this.activities.has(o)) || (s = !0, n === 0 ? this.activities.delete(o) : (o.end = Math.min(o.end, this.currentTime + n), this.cleanupTimer ||= setInterval(() => this.collect(), require_audio.audioDefaults.tickMs)), this.disposed || this.refreshDucking());
			}
		};
	}
	refreshDucking() {
		let t = this.currentTime, n = /* @__PURE__ */ new Set([t]);
		for (let e of this.activities) e.enabled && (e.start > t && n.add(e.start), Number.isFinite(e.end) && e.end > t && n.add(e.end));
		let r = [...n].sort((e, t) => e - t);
		for (let n of this.graphs.values()) {
			let i = (n.context === this.primary ? t : n.context.currentTime) + require_audio.audioDefaults.controlLead;
			for (let o of a) {
				let a = n.buses[o], s = a.duck.gain, c = duckValueAt(a.duckPlan, i), l;
				for (let n of r) {
					let r = 1, u = 0, d = 0;
					for (let t of this.rules) {
						if (t.target !== o) continue;
						d = Math.max(d, t.release ?? require_audio.audioDefaults.duckRelease);
						let i = !1;
						for (let e of this.activities) if (e.enabled && e.channel === t.source && e.start <= n && e.end > n) {
							i = !0;
							break;
						}
						i && t.gain < r && (r = t.gain, u = t.attack ?? require_audio.audioDefaults.duckAttack);
					}
					if (r === l) continue;
					let f = i + (n - t), p = Math.max(require_audio.audioDefaults.gainSmoothing, r < (l ?? c) ? u : d) / 3;
					if (l === void 0) {
						let e = a.duckPlan[0];
						if (a.duckPlan.length === 1 && e && e.at <= i && e.target === r && e.tau === p) {
							l = r;
							continue;
						}
						typeof s.cancelAndHoldAtTime == `function` ? s.cancelAndHoldAtTime(i) : (s.cancelScheduledValues(i), s.setValueAtTime(c, i)), a.duckPlan.length = 0;
					}
					let m = duckValueAt(a.duckPlan, f, c);
					s.setTargetAtTime(r, f, p), a.duckPlan.push({
						at: f,
						from: m,
						target: r,
						tau: p
					}), l = r;
				}
			}
		}
	}
	collect() {
		let e = !1, t = this.currentTime;
		for (let n of this.activities) n.end <= t ? this.activities.delete(n) : Number.isFinite(n.end) && (e = !0);
		for (let n of this.graphs.values()) {
			let r = n.context === this.primary ? t : n.context.currentTime;
			for (let t of a) {
				let i = n.buses[t];
				for (let t = i.retired.length - 1; t >= 0; t--) {
					let n = i.retired[t];
					if (r < n.until) {
						e = !0;
						continue;
					}
					i.input.disconnect(n.chain.input), n.chain.disconnect(), i.retired.splice(t, 1);
				}
			}
		}
		e || (clearInterval(this.cleanupTimer), this.cleanupTimer = void 0);
	}
	clearContexts() {
		clearInterval(this.cleanupTimer), this.cleanupTimer = void 0;
		for (let e of this.graphs.values()) this.disposeGraph(e);
		this.graphs.clear(), this.primary = void 0;
	}
	destroy() {
		this.disposed || (this.disposed = !0, clearInterval(this.cleanupTimer), this.clearContexts(), this.activities.clear());
	}
	disposeGraph(e) {
		for (let t of Object.values(e.buses)) {
			t.input.disconnect(), t.volume.disconnect(), t.duck.disconnect(), t.analyser.disconnect(), t.chain.disconnect();
			for (let e of t.retired) e.chain.disconnect();
		}
	}
};
//#endregion
exports.AudioMixer = AudioMixer;

//# sourceMappingURL=mixer.cjs.map