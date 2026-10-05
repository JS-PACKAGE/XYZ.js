const require_assets = require("../../../src/data/assets.cjs");
const require_read_response = require("../../assets/src/read-response.cjs");
const require_subscribe_load = require("../../assets/src/preload/subscribe-load.cjs");
const require_audio = require("../../../src/data/audio.cjs");
const require_errors = require("./errors.cjs");
const require_spatial = require("./samples/spatial.cjs");
const require_opm_adapter = require("./opm-adapter.cjs");
const require_sample_audio = require("./samples/sample-audio.cjs");
const require_effects = require("./effects.cjs");
const require_mixer = require("./mixer.cjs");
const require_bindings = require("./bindings.cjs");
//#region dist/packages/audio/src/audio-manager.js
var AudioChannel = class {
	name;
	refresh;
	mixer;
	level = 1;
	constructor(e, t, n) {
		this.name = e, this.refresh = t, this.mixer = n;
	}
	get volume() {
		return this.level;
	}
	set volume(e) {
		if (!Number.isFinite(e) || e < 0 || e > 1) throw new require_errors.AudioError(`Audio volume must be finite and within 0..1.`);
		this.level = e, this.refresh();
	}
	get effects() {
		return this.mixer?.getEffects(this.name) ?? [];
	}
	setEffects(e) {
		if (!this.mixer) throw new require_errors.AudioError(`Channel is not attached to an audio manager.`);
		this.mixer.setEffects(this.name, e);
	}
	automate(e, n, r = 0, i = `linear`) {
		if (!this.mixer) throw new require_errors.AudioError(`Channel is not attached to an audio manager.`);
		this.mixer.automate(this.name, e, n, r, i);
	}
	cancelAutomation(e) {
		if (!this.mixer) throw new require_errors.AudioError(`Channel is not attached to an audio manager.`);
		return this.mixer.cancelAutomation(this.name, e);
	}
	analyser(e = 0) {
		return this.mixer?.analyser(this.name, e);
	}
};
var AudioAsset = class {
	manager;
	voice;
	notes;
	duration;
	channel;
	loop;
	persistent = !1;
	releaseTime;
	constructor(t, n, r, i, a, o) {
		this.manager = t, this.voice = n, this.notes = r, this.duration = i, this.channel = a, this.loop = o;
		let s = 0;
		for (let e of n.ops) s = Math.max(s, e.adsr.r);
		this.releaseTime = s + require_audio.audioDefaults.releaseGuard;
	}
	play(e) {
		return this.manager.play(this, e);
	}
	stop() {
		this.manager.stopAsset(this);
	}
	belongsTo(e) {
		return this.manager === e;
	}
};
var AudioPlayback = class {
	manager;
	spatial;
	status = `playing`;
	constructor(e, t) {
		this.manager = e, this.spatial = t;
	}
	get position3D() {
		return this.spatial?.position;
	}
	set position3D(e) {
		if (!this.spatial || !e) throw new require_errors.AudioError(`Playback was not created with spatial options.`);
		require_spatial.validateVec3(e, `Spatial position`), this.spatial.position.x = e.x, this.spatial.position.y = e.y, this.spatial.position.z = e.z, this.manager.movePlayback(this, this.spatial.position);
	}
	get spatialOptions() {
		return this.spatial;
	}
	get state() {
		return this.status;
	}
	stop() {
		this.manager.stopPlayback(this);
	}
	finish(e) {
		this.status = e;
	}
};
var f = require_audio.audioDefaults.voiceCount;
var p = require_audio.audioDefaults.lookahead;
var m = require_audio.audioDefaults.tickMs;
var h = [
	`music`,
	`ui`,
	`sfx`
];
var AudioManager = class {
	getScene;
	onError;
	mixer = new require_mixer.AudioMixer();
	master = new AudioChannel(`master`, () => this.mixer.setGain(`master`, this.master.volume), this.mixer);
	music = new AudioChannel(`music`, () => this.mixer.setGain(`music`, this.music.volume), this.mixer);
	sfx = new AudioChannel(`sfx`, () => this.mixer.setGain(`sfx`, this.sfx.volume), this.mixer);
	ui = new AudioChannel(`ui`, () => this.mixer.setGain(`ui`, this.ui.volume), this.mixer);
	bindings = /* @__PURE__ */ new Set();
	listenerBinding;
	adapter;
	samples;
	cache = /* @__PURE__ */ new Map();
	playbacks = /* @__PURE__ */ new Map();
	slots = Array(f).fill(void 0);
	timer;
	disposed = !1;
	sequence = 0;
	pauseReasons = /* @__PURE__ */ new Set();
	pausedAt;
	pausedTotal = 0;
	constructor(e, t) {
		this.getScene = e, this.onError = t, this.adapter = new require_opm_adapter.OPMAdapter((e, t) => this.mixer.input(e, t)), this.samples = new require_sample_audio.SampleAudioEngine({
			context: () => this.adapter.sampleContext,
			scene: this.getScene,
			bus: (e, t) => this.mixer.input(e, t),
			activity: (e, t) => this.mixer.acquire(e, t),
			contexts: () => this.adapter.contexts,
			report: (e) => this.report(e)
		});
	}
	get listener() {
		return this.samples.listener;
	}
	get unlocked() {
		return this.adapter.unlocked;
	}
	get paused() {
		return this.pauseReasons.size > 0;
	}
	get currentTime() {
		return this.mixer.currentTime;
	}
	get audioContextCount() {
		return this.mixer.contextCount;
	}
	prepareImpulse(e) {
		return new require_effects.PreparedAudioImpulse(e);
	}
	setDucking(e) {
		this.mixer.setDucking(e);
	}
	acquireActivity(e) {
		return this.mixer.acquire(e);
	}
	bindListener(e) {
		let t = new require_bindings.AudioTransformBinding(e, this.listener, !0, (e) => {
			this.bindings.delete(e), this.listenerBinding === e && (this.listenerBinding = void 0);
		});
		return this.listenerBinding?.unbind(), this.listenerBinding = t, this.bindings.add(t), t;
	}
	bindEmitter(e, t) {
		let n = new require_bindings.AudioTransformBinding(e, t, !1, (e) => this.bindings.delete(e));
		return this.bindings.add(n), n;
	}
	updateBindings() {
		for (let e of this.bindings) e.update();
	}
	movePlayback(e, t) {
		for (let n = 0; n < f; n++) this.slots[n]?.playback === e && this.adapter.setPosition(n, t);
	}
	pause(e = `user`) {
		if (!this.disposed && (this.pauseReasons.add(e), this.pausedAt === void 0)) {
			this.pausedAt = this.adapter.now;
			for (let e = 0; e < f; e++) if (this.slots[e]) {
				try {
					this.adapter.reset(e);
				} catch (e) {
					this.report(e);
				}
				this.slots[e]?.activity.release(), this.slots[e] = void 0;
			}
			this.samples.suspend(), this.adapter.setPaused(!0).catch((e) => this.report(e));
		}
	}
	resume(e = `user`) {
		!this.disposed && this.pauseReasons.delete(e) && (this.pauseReasons.size > 0 || this.pausedAt === void 0 || (this.pausedTotal += this.adapter.now - this.pausedAt, this.pausedAt = void 0, this.samples.resume(), this.adapter.setPaused(!1).catch((e) => this.report(e)), this.tick()));
	}
	clock() {
		return (this.pausedAt ?? this.adapter.now) - this.pausedTotal;
	}
	get opm() {
		return this.adapter.opm;
	}
	async unlock() {
		if (this.disposed) throw new require_errors.AudioError(`AudioManager has been destroyed.`);
		try {
			if (await this.adapter.unlock(), this.disposed) throw new require_errors.AudioError(`AudioManager has been destroyed.`);
			this.listener.apply(), this.paused && await this.adapter.setPaused(!0);
		} catch (e) {
			throw this.adapter.unlocked || this.mixer.clearContexts(), e instanceof require_errors.AudioError ? e : new require_errors.AudioError(`Unable to unlock audio.`, { cause: e });
		}
	}
	load(e, n = {}) {
		if (n.signal?.aborted) return Promise.reject(n.signal.reason);
		if (this.disposed) return Promise.reject(new require_errors.AudioError(`AudioManager has been destroyed.`));
		let r;
		try {
			let n = (typeof document < `u` ? document.baseURI : void 0) ?? (typeof location < `u` ? location.href : void 0), i = new URL(e, n);
			if (![
				`http:`,
				`https:`,
				`data:`,
				`blob:`
			].includes(i.protocol)) throw new require_errors.AudioError(`Unsupported audio URL protocol.`);
			i.hash = ``, r = i.href;
		} catch (e) {
			return Promise.reject(new require_errors.AudioError(`Invalid audio URL.`, { cause: e }));
		}
		let i = this.cache.get(r);
		if (i) return require_subscribe_load.subscribeLoad(i.promise, n.signal);
		let o = new AbortController(), cancel, s = new Promise((e, n) => {
			cancel = () => n(new require_errors.AudioError(`AudioManager was destroyed while loading audio.`));
		});
		o.signal.addEventListener(`abort`, cancel, { once: !0 });
		let c = this.fetchAudio(r, o.signal), l = {
			controller: o,
			promise: Promise.race([c, s]).then((e) => {
				if (this.disposed) throw new require_errors.AudioError(`AudioManager was destroyed while loading audio.`);
				return e;
			}, (e) => {
				throw this.cache.get(r) === l && this.cache.delete(r), e;
			}).finally(() => o.signal.removeEventListener(`abort`, cancel))
		};
		return this.cache.set(r, l), require_subscribe_load.subscribeLoad(l.promise, n.signal);
	}
	opmTask(e, t) {
		return {
			key: e,
			load: (e) => this.load(t, { signal: e })
		};
	}
	loadSample(e, t = {}) {
		return this.samples.load(e, t);
	}
	stream(e, t = {}) {
		return this.samples.stream(e, t);
	}
	sampleTask(e, t) {
		return {
			key: e,
			load: (e) => this.loadSample(t, { signal: e })
		};
	}
	play(e, n = {}) {
		if (this.disposed) throw new require_errors.AudioError(`AudioManager has been destroyed.`);
		if (!e.belongsTo(this)) throw new require_errors.AudioError(`Audio asset belongs to another manager.`);
		if (!this.unlocked) throw new require_errors.AudioError(`Audio must be unlocked from a user gesture before playback.`);
		let r = n.channel ?? e.channel;
		if (r !== `music` && r !== `sfx` && r !== `ui`) throw new require_errors.AudioError(`Unknown audio channel.`);
		let i = n.scene ?? this.getScene();
		if (i?.destroyed) throw new require_errors.AudioError(`Cannot play audio in a destroyed Scene.`);
		let a = new AudioPlayback(this, n.spatial && require_spatial.checkSpatialOptions(n.spatial));
		return this.playbacks.set(a, {
			playback: a,
			asset: e,
			channel: r,
			scene: i,
			persistent: n.persistent ?? e.persistent,
			loop: n.loop ?? e.loop,
			startedAt: this.clock(),
			cycle: 0,
			index: 0
		}), this.tick(), !this.timer && (this.playbacks.size > 0 || this.slots.some(Boolean)) && (this.timer = setInterval(() => this.tick(), m)), a;
	}
	stopScene(e) {
		this.samples.stopScene(e);
		for (let t of this.bindings) t.scene === e && t.unbind();
		for (let t of this.playbacks.values()) t.scene === e && (t.persistent ? t.scene = void 0 : this.stopPlayback(t.playback, !0));
		for (let t = 0; t < f; t++) {
			let n = this.slots[t];
			if (!(n?.scene !== e || n.persistent)) {
				try {
					this.adapter.reset(t);
				} catch (e) {
					this.report(e);
				}
				n.activity.release(), this.slots[t] = void 0;
			}
		}
		this.stopIdleTimer();
	}
	stopAsset(e) {
		for (let t of this.playbacks.values()) t.asset === e && this.stopPlayback(t.playback);
	}
	stopPlayback(e, t = !1) {
		let n = this.playbacks.get(e);
		if (!n) return;
		this.playbacks.delete(e), e.finish(`stopped`);
		let r = this.clock();
		for (let i = 0; i < f; i++) {
			let a = this.slots[i];
			if (a?.playback === e) try {
				t ? (this.adapter.reset(i), a.activity.release(), this.slots[i] = void 0) : (this.adapter.stop(i), a.startedAt > r ? (a.activity.release(), this.slots[i] = void 0) : (a.until = Math.min(a.until, r + n.asset.releaseTime), a.activity.release(n.asset.releaseTime)));
			} catch (e) {
				a.activity.release(), this.slots[i] = void 0, this.report(e);
			}
		}
		this.stopIdleTimer();
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0, clearInterval(this.timer), this.timer = void 0;
			for (let e of this.bindings) e.unbind();
			this.bindings.clear(), this.listenerBinding = void 0, this.samples.destroy();
			for (let e of this.cache.values()) e.controller.abort();
			this.cache.clear();
			for (let e of this.playbacks.keys()) e.finish(`stopped`);
			this.playbacks.clear(), this.slots.fill(void 0), this.adapter.destroy(), this.mixer.destroy();
		}
	}
	async fetchAudio(e, a) {
		try {
			let o = await fetch(e, { signal: a });
			if (!o.ok) throw new require_errors.AudioError(`Audio request failed (HTTP ${o.status}).`);
			let s = await require_read_response.readResponse(o, require_assets.assetLimits.audioBytes, a);
			a.throwIfAborted();
			let c = JSON.parse(await s.text());
			if (this.disposed) throw new require_errors.AudioError(`AudioManager was destroyed while loading audio.`);
			if (!c || typeof c != `object` || Array.isArray(c)) throw new require_errors.AudioError(`Audio must be a JSON object.`);
			let l = c;
			if (!Array.isArray(l.notes) || l.notes.length === 0) throw new require_errors.AudioError(`Audio notes must be a nonempty array.`);
			if (l.notes.length > require_assets.assetLimits.audioNotes) throw new require_errors.AudioError(`Audio exceeds the note count resource budget.`);
			let u = l.notes.map((e) => {
				if (!e || typeof e != `object` || Array.isArray(e)) throw new require_errors.AudioError(`Invalid audio note.`);
				let n = e;
				if (typeof n.note != `number` || !Number.isInteger(n.note) || n.note < 0 || n.note > 127 || typeof n.time != `number` || !Number.isFinite(n.time) || n.time < 0 || typeof n.duration != `number` || !Number.isFinite(n.duration) || n.duration <= 0 || n.duration > 60) throw new require_errors.AudioError(`Invalid audio note: expected MIDI 0..127, time >= 0, duration in (0, 60].`);
				return {
					note: n.note,
					time: n.time,
					duration: n.duration
				};
			});
			u.sort((e, t) => e.time - t.time);
			let d = 0;
			for (let e of u) d = Math.max(d, e.time + e.duration);
			let f = l.duration === void 0 ? d : l.duration;
			if (typeof f != `number` || !Number.isFinite(f) || f < d) throw new require_errors.AudioError(`Audio loop duration must contain every note and be positive.`);
			if (l.channel !== void 0 && l.channel !== `music` && l.channel !== `sfx` && l.channel !== `ui`) throw new require_errors.AudioError(`Unknown audio channel.`);
			if (l.loop !== void 0 && typeof l.loop != `boolean`) throw new require_errors.AudioError(`Audio loop must be a boolean.`);
			let p = await require_opm_adapter.OPMAdapter.validateVoice(l.voice);
			if (this.disposed) throw new require_errors.AudioError(`AudioManager was destroyed while loading audio.`);
			for (let e of u) Object.freeze(e);
			Object.freeze(u);
			for (let e of p.ops) Object.freeze(e.adsr), Object.freeze(e);
			return Object.freeze(p.ops), p.lfo && Object.freeze(p.lfo), Object.freeze(p), new AudioAsset(this, p, u, f, l.channel ?? `sfx`, l.loop === !0);
		} catch (e) {
			throw e instanceof require_errors.AudioError ? e : new require_errors.AudioError(`Unable to load audio.`, { cause: e });
		}
	}
	tick() {
		if (this.disposed || this.pausedAt !== void 0) return;
		let e = this.clock();
		for (let t = 0; t < f; t++) {
			let n = this.slots[t];
			n && n.until <= e && (n.activity.release(), this.slots[t] = void 0);
		}
		for (let t of h) for (let n of this.playbacks.values()) if (n.channel === t) try {
			this.schedule(n, e);
		} catch (e) {
			this.stopPlayback(n.playback, !0), this.report(e);
		}
		for (let e of this.playbacks.values()) e.loop || e.index < e.asset.notes.length || this.slots.some((t) => t?.playback === e.playback) || (this.playbacks.delete(e.playback), e.playback.finish(`ended`));
		this.stopIdleTimer();
	}
	schedule(e, t) {
		let n = e.asset.notes, r = e.asset.duration, i = t - e.startedAt;
		if (e.loop && i >= r) {
			let t = Math.floor(i / r);
			e.cycle < t && (e.cycle = t, e.index = 0);
		}
		let a = i - e.cycle * r - p;
		if (a > 0) {
			let t = e.index, r = n.length;
			for (; t < r;) {
				let e = t + r >>> 1;
				n[e].time < a ? t = e + 1 : r = e;
			}
			e.index = t;
		}
		for (let i = 0; i < f * 2; i++) {
			if (e.index === n.length) {
				if (!e.loop) break;
				e.cycle++, e.index = 0;
			}
			let i = n[e.index], a = e.startedAt + e.cycle * r + i.time;
			if (a > t + p) break;
			if (e.index++, a + i.duration <= t || a < t - p) continue;
			let o = i.duration - Math.max(0, t - a), s = this.reserve(e, a, t, o);
			if (s === void 0) continue;
			let c = Math.max(0, a - t);
			this.adapter.play(s, e.asset.voice, i.note, c, o, 1, e.channel, e.playback.spatialOptions);
		}
	}
	reserve(e, t, n, r) {
		let i = this.slots.findIndex((e) => !e);
		if (i < 0) {
			let e;
			for (let t = 0; t < f; t++) {
				let n = this.slots[t];
				n?.channel === `sfx` && (!e || n.sequence < e.sequence) && (e = n, i = t);
			}
			if (!e) return;
			e.activity.release(), this.adapter.reset(i);
		}
		return this.slots[i] = {
			playback: e.playback,
			scene: e.scene,
			persistent: e.persistent,
			channel: e.channel,
			startedAt: t,
			until: Math.max(n, t) + r + e.asset.releaseTime,
			sequence: ++this.sequence,
			activity: this.mixer.acquire(e.channel, Math.max(0, t - n), r + e.asset.releaseTime)
		}, i;
	}
	stopIdleTimer() {
		this.timer && this.playbacks.size === 0 && this.slots.every((e) => !e) && (clearInterval(this.timer), this.timer = void 0);
	}
	report(e) {
		try {
			this.onError(e instanceof Error ? e : new require_errors.AudioError(`Audio playback failed.`, { cause: e }));
		} catch {}
	}
};
//#endregion
exports.AudioAsset = AudioAsset;
exports.AudioChannel = AudioChannel;
exports.AudioManager = AudioManager;
exports.AudioPlayback = AudioPlayback;

//# sourceMappingURL=audio-manager.cjs.map