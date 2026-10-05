const require_game_object = require("./game-object.cjs");
const require_morph = require("./morph.cjs");
const require_narrative = require("../../../src/data/narrative.cjs");
//#region dist/packages/core/src/cutscene.js
var CutsceneDirector = class extends require_game_object.GameObject {
	options;
	duration;
	tracks;
	cues;
	repeat;
	state = `idle`;
	clock = 0;
	passNumber = 0;
	fired = /* @__PURE__ */ new Set();
	barrier;
	cueLifetimes = /* @__PURE__ */ new Map();
	generation = 0;
	paused = !1;
	updating = !1;
	disposedActions = !1;
	error;
	constructor(e) {
		if (super(), this.options = e, !Number.isFinite(e.duration) || e.duration <= 0) throw RangeError(`Cutscene duration must be positive and finite.`);
		if (this.duration = e.duration, this.repeat = e.repeat ?? 0, this.repeat !== 1 / 0 && (!Number.isInteger(this.repeat) || this.repeat < 0)) throw RangeError(`Invalid cutscene repeat.`);
		this.tracks = (e.tracks ?? []).map((e) => ({ ...e })), this.cues = (e.cues ?? []).map((e) => ({ ...e })).sort((e, t) => e.at - t.at);
		let t = /* @__PURE__ */ new Set();
		for (let e of this.tracks) {
			if (!e.id || t.has(e.id) || !Number.isFinite(e.start) || e.start < 0 || !Number.isFinite(e.duration) || e.duration <= 0 || e.start + e.duration > this.duration) throw Error(`Invalid cutscene track.`);
			t.add(e.id);
		}
		t.clear();
		for (let e of this.cues) {
			if (!e.id || t.has(e.id) || !Number.isFinite(e.at) || e.at < 0 || e.at > this.duration || typeof e.run != `function`) throw Error(`Invalid cutscene cue.`);
			t.add(e.id);
		}
	}
	get status() {
		return this.state;
	}
	get time() {
		return this.clock;
	}
	get pass() {
		return this.passNumber;
	}
	play() {
		if (this.destroyed || this.state !== `idle`) throw Error(`Cutscene can only start once.`);
		this.state = `playing`;
		try {
			this.sample();
		} catch (e) {
			throw this.fail(e), e;
		}
	}
	pause() {
		if (this.state === `playing` || this.state === `waiting`) {
			this.paused = !0, this.state = `paused`;
			for (let e of this.tracks) e.action.pause?.();
		}
	}
	resume() {
		if (this.paused && !this.destroyed && [`paused`, `waiting`].includes(this.state)) {
			this.paused = !1, this.state = this.barrier ? `waiting` : `playing`;
			for (let e of this.tracks) e.action.resume?.();
		}
	}
	seek(e) {
		if (this.destroyed || [
			`completed`,
			`cancelled`,
			`error`
		].includes(this.state)) throw Error(`Cannot seek a finished cutscene.`);
		if (!Number.isFinite(e) || e < 0 || e > this.duration) throw RangeError(`Invalid cutscene seek.`);
		this.invalidate(), this.clock = e;
		for (let t of this.cues) t.at <= e && this.fired.add(this.cueKey(t));
		this.state !== `idle` && (this.state = this.paused ? `paused` : `playing`);
		try {
			this.sample();
		} catch (e) {
			throw this.fail(e), e;
		}
	}
	update(e) {
		if (!Number.isFinite(e) || e < 0) throw RangeError(`Invalid cutscene delta.`);
		if (this.updating) throw Error(`Cutscene update is not reentrant.`);
		if (this.state === `playing`) {
			this.updating = !0;
			try {
				let t = e, r = 0;
				for (; this.state === `playing`;) {
					if (++r > require_narrative.narrativeLimits.cutsceneUpdateSteps) throw RangeError(`Cutscene update exceeded its bounded cue/pass work budget.`);
					let e = this.generation, i = Math.min(this.duration, this.clock + t), a = this.cues.find((e) => e.at <= i && !this.fired.has(this.cueKey(e)));
					if (a) {
						let n = Math.max(0, a.at - this.clock);
						if (this.clock = Math.max(this.clock, a.at), t = Math.max(0, t - n), this.sample(), e !== this.generation || this.state !== `playing`) break;
						this.fired.add(this.cueKey(a));
						let r = new AbortController();
						this.cueLifetimes.get(a.id)?.abort(), this.cueLifetimes.set(a.id, r), this.barrier = r;
						let i = a.run({
							director: this,
							signal: r.signal,
							pass: this.passNumber
						});
						if (e !== this.generation) {
							i && Promise.resolve(i).catch(() => void 0);
							break;
						}
						if (i && typeof i.then == `function`) {
							this.state = `waiting`;
							for (let e of this.tracks) e.action.pause?.();
							Promise.resolve(i).then(() => {
								if (!(e !== this.generation || r.signal.aborted || this.destroyed)) {
									this.barrier = void 0, this.state = this.paused ? `paused` : `playing`;
									try {
										if (!this.paused) for (let e of this.tracks) e.action.resume?.();
									} catch (e) {
										this.fail(e);
									}
								}
							}).catch((t) => {
								e === this.generation && !r.signal.aborted && this.fail(t);
							});
							break;
						}
						this.barrier = void 0;
						continue;
					}
					if (t -= i - this.clock, this.clock = i, this.sample(), e !== this.generation || this.state !== `playing` || this.clock < this.duration) break;
					if (this.passNumber < this.repeat) {
						for (let e of this.cues) e.repeat && this.fired.delete(this.cueKey(e));
						this.passNumber++, this.clock = 0;
						for (let e of this.tracks) e.action.reset();
						if (t === 0) break;
					} else {
						this.state = `completed`;
						for (let e of this.tracks) e.action.pause?.();
						this.options.onComplete?.();
						break;
					}
				}
			} catch (e) {
				throw this.fail(e), e;
			} finally {
				this.updating = !1;
			}
		}
	}
	cancel() {
		if (this.state !== `cancelled`) {
			this.invalidate(), this.state = `cancelled`;
			try {
				for (let e of this.tracks) e.action.reset();
			} finally {
				this.disposeActions();
			}
		}
	}
	onDestroy() {
		this.cancel();
	}
	cueKey(e) {
		return e.repeat ? `${this.passNumber}:${e.id}` : `once:${e.id}`;
	}
	sample() {
		let e = this.generation;
		for (let t of this.tracks) if (t.action.reset(), e !== this.generation || this.destroyed) return;
		for (let t of this.tracks) if (this.clock >= t.start && t.action.sample(Math.min(t.duration, this.clock - t.start), t.duration), e !== this.generation || this.destroyed) return;
	}
	invalidate() {
		this.generation++;
		for (let e of this.cueLifetimes.values()) e.abort();
		this.cueLifetimes.clear(), this.barrier = void 0;
	}
	fail(e) {
		this.invalidate(), this.error = e, this.state = `error`;
		try {
			for (let e of this.tracks) e.action.pause?.();
		} finally {
			this.options.onError?.(e);
		}
	}
	disposeActions() {
		if (this.disposedActions) return;
		this.disposedActions = !0;
		let e = [];
		for (let t of this.tracks) try {
			t.action.dispose?.();
		} catch (t) {
			e.push(t);
		}
		if (e.length) throw AggregateError(e, `Cutscene action cleanup failed.`);
	}
};
function cutsceneTween(e) {
	return {
		sample: (t) => e.seek(t),
		reset: () => e.reset()
	};
}
function cutsceneAnimation(e, n = 1) {
	if (!Number.isFinite(n) || n < 0 || n > 1) throw RangeError(`Invalid animation weight.`);
	let r = e.tracks.map((e) => {
		let n = e.target;
		if (n instanceof require_morph.MorphWeights) {
			let e = Array.from({ length: n.count }, (e, t) => n.get(t));
			return () => {
				for (let t = 0; t < e.length; t++) n.set(t, e[t]);
			};
		}
		if (e.path === `rotation`) {
			let { x: e, y: t, z: r, w: i } = n.rotation;
			return () => {
				n.rotation.set(e, t, r, i);
			};
		}
		let r = e.path === `translation` ? n.position : n.scale, { x: i, y: a, z: o } = r;
		return () => {
			r.set(i, a, o);
		};
	});
	return {
		sample: (t) => {
			for (let r of e.tracks) r.sample(Math.min(t, e.duration), n);
		},
		reset: () => {
			for (let e of r) e();
		}
	};
}
function cutsceneValue(e, t, n) {
	let r = e();
	return {
		sample: () => t(n),
		reset: () => t(r)
	};
}
function cutsceneAudio(e) {
	return async ({ signal: t }) => {
		let n = await e();
		t.aborted ? n.stop() : t.addEventListener(`abort`, () => n.stop(), { once: !0 });
	};
}
//#endregion
exports.CutsceneDirector = CutsceneDirector;
exports.cutsceneAnimation = cutsceneAnimation;
exports.cutsceneAudio = cutsceneAudio;
exports.cutsceneTween = cutsceneTween;
exports.cutsceneValue = cutsceneValue;

//# sourceMappingURL=cutscene.cjs.map