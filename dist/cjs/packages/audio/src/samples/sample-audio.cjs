const require_read_response = require("../../../assets/src/read-response.cjs");
const require_gameplay_assets = require("../../../../src/data/gameplay-assets.cjs");
const require_subscribe_load = require("../../../assets/src/preload/subscribe-load.cjs");
const require_errors = require("../errors.cjs");
const require_spatial = require("./spatial.cjs");
const require_sample_playback = require("./sample-playback.cjs");
const require_stream = require("./stream.cjs");
//#region dist/packages/audio/src/samples/sample-audio.js
var SampleAudioAsset = class {
	engine;
	encoded;
	buffer;
	decoding;
	spriteRanges = /* @__PURE__ */ new Map();
	loop = !1;
	persistent = !1;
	constructor(e, t) {
		this.engine = e, this.encoded = t;
	}
	get decoded() {
		return this.buffer !== void 0;
	}
	get duration() {
		return this.buffer?.duration;
	}
	get sampleRate() {
		return this.buffer?.sampleRate;
	}
	get channels() {
		return this.buffer?.numberOfChannels;
	}
	get sprites() {
		return [...this.spriteRanges.keys()];
	}
	defineSprites(t) {
		let n = Object.entries(t);
		if (this.spriteRanges.size + n.length > require_gameplay_assets.gameplayAssetLimits.audioSprites) throw new require_errors.AudioError(`Audio sprite budget is exhausted.`);
		for (let [e, t] of n) if (!e || !Number.isFinite(t.start) || !Number.isFinite(t.end) || t.start < 0 || t.start >= t.end) throw new require_errors.AudioError(`Audio sprite "${e}" must satisfy 0 <= start < end.`);
		for (let [e, t] of n) this.spriteRanges.set(e, {
			start: t.start,
			end: t.end
		});
	}
	async playSprite(e, t = {}) {
		let n = this.spriteRanges.get(e);
		if (!n) throw new require_errors.AudioError(`Unknown audio sprite "${e}".`);
		this.engine.requireContext();
		let i = t.scene ?? this.engine.currentScene;
		if (await this.decode(), n.end > this.buffer.duration) throw new require_errors.AudioError(`Audio sprite "${e}" ends after the decoded duration.`);
		return this.engine.play(this.buffer, {
			...t,
			scene: i,
			region: n,
			loop: t.loop ?? !1,
			persistent: t.persistent ?? this.persistent
		});
	}
	decode() {
		let t;
		try {
			t = this.engine.requireContext();
		} catch (e) {
			return Promise.reject(e);
		}
		if (this.buffer) return Promise.resolve();
		if (!this.decoding) {
			let i = Promise.resolve().then(() => (this.engine.requireContext(), t.decodeAudioData(this.encoded.slice(0)))).then((t) => {
				if (this.engine.requireContext(), !Number.isInteger(t.length) || t.length <= 0 || t.length > require_gameplay_assets.gameplayAssetLimits.sampleFrames || !Number.isInteger(t.numberOfChannels) || t.numberOfChannels <= 0 || t.numberOfChannels > require_gameplay_assets.gameplayAssetLimits.sampleChannels || t.length * t.numberOfChannels > require_gameplay_assets.gameplayAssetLimits.sampleValues || !Number.isFinite(t.sampleRate) || t.sampleRate <= 0 || t.sampleRate > require_gameplay_assets.gameplayAssetLimits.sampleRate || !Number.isFinite(t.duration) || t.duration <= 0) throw new require_errors.AudioError(`Sample exceeds the decoded audio resource budget.`);
				this.buffer = t;
			});
			this.decoding = require_subscribe_load.subscribeLoad(i, this.engine.signal).catch((e) => {
				throw e instanceof require_errors.AudioError ? e : new require_errors.AudioError(`Unable to decode sample audio.`, { cause: e });
			}).finally(() => {
				this.decoding = void 0;
			});
		}
		return this.decoding;
	}
	async play(e = {}) {
		this.engine.requireContext();
		let t = e.scene ?? this.engine.currentScene;
		return await this.decode(), this.engine.play(this.buffer, {
			...e,
			scene: t,
			loop: e.loop ?? this.loop,
			persistent: e.persistent ?? this.persistent
		});
	}
	dispose() {
		this.buffer = void 0, this.encoded = /* @__PURE__ */ new ArrayBuffer(0);
	}
};
var SampleAudioEngine = class {
	host;
	lifetime = new AbortController();
	cache = /* @__PURE__ */ new Map();
	assets = /* @__PURE__ */ new Set();
	playbacks = /* @__PURE__ */ new Map();
	suspended = /* @__PURE__ */ new Set();
	holding = !1;
	disposed = !1;
	listener;
	constructor(e) {
		this.host = e, this.listener = new require_spatial.AudioListenerState(() => e.context(), e.contexts);
	}
	get signal() {
		return this.lifetime.signal;
	}
	get currentScene() {
		return this.host.scene();
	}
	requireContext() {
		if (this.disposed) throw new require_errors.AudioError(`AudioManager has been destroyed.`);
		let e = this.host.context();
		if (!e || e.state === `closed`) throw new require_errors.AudioError(`Audio must be unlocked from a user gesture before sample decode/playback.`);
		return e;
	}
	load(i, a = {}) {
		if (this.disposed) return Promise.reject(new require_errors.AudioError(`AudioManager has been destroyed.`));
		if (a.signal?.aborted) return Promise.reject(a.signal.reason);
		let o;
		try {
			let e = (typeof document < `u` ? document.baseURI : void 0) ?? (typeof location < `u` ? location.href : void 0), t = new URL(i, e);
			if (![
				`http:`,
				`https:`,
				`data:`,
				`blob:`
			].includes(t.protocol)) throw new require_errors.AudioError(`Unsupported sample URL protocol.`);
			t.hash = ``, o = t.href;
		} catch (e) {
			return Promise.reject(new require_errors.AudioError(`Invalid sample URL.`, { cause: e }));
		}
		let s = this.cache.get(o);
		if (s) return require_subscribe_load.subscribeLoad(s.promise, a.signal);
		let c = new AbortController(), operation = async () => {
			let n = await fetch(o, { signal: c.signal });
			if (c.signal.throwIfAborted(), !n.ok) throw new require_errors.AudioError(`Sample request failed (HTTP ${n.status}).`);
			let i = await (await require_read_response.readResponse(n, require_gameplay_assets.gameplayAssetLimits.sampleBytes, c.signal)).arrayBuffer();
			c.signal.throwIfAborted();
			let a = new SampleAudioAsset(this, i);
			return this.assets.add(a), a;
		}, l = {
			controller: c,
			promise: require_subscribe_load.subscribeLoad(operation(), c.signal).catch((e) => {
				throw this.cache.get(o) === l && this.cache.delete(o), e instanceof require_errors.AudioError ? e : new require_errors.AudioError(`Unable to load sample audio.`, { cause: e });
			})
		};
		return this.cache.set(o, l), require_subscribe_load.subscribeLoad(l.promise, a.signal);
	}
	play(t, n) {
		let a = this.requireContext(), o = n.channel ?? `sfx`;
		if (o !== `music` && o !== `sfx` && o !== `ui`) throw new require_errors.AudioError(`Unknown audio channel.`);
		if (n.scene?.destroyed) throw new require_errors.AudioError(`Cannot play audio in a destroyed Scene.`);
		if (this.playbacks.size >= require_gameplay_assets.gameplayAssetLimits.samplePlaybacks) throw new require_errors.AudioError(`Sample playback budget is exhausted.`);
		this.listener.apply();
		let s, c = new require_sample_playback.SamplePlayback(a, t, this.host.bus(a, o), n, (e) => {
			s?.release(), this.playbacks.delete(e), this.suspended.delete(e);
		}, (e, t) => {
			e ? s ||= this.host.activity?.(o, t) : (s?.release(), s = void 0);
		});
		return this.playbacks.set(c, {
			scene: n.scene,
			persistent: n.persistent ?? !1
		}), this.holding && (c.pause(`manager`), this.suspended.add(c)), c;
	}
	async stream(t, i = {}) {
		let s = this.requireContext(), c = i.channel ?? `music`;
		if (c !== `music` && c !== `sfx` && c !== `ui`) throw new require_errors.AudioError(`Unknown audio channel.`);
		let l = i.scene ?? this.currentScene;
		if (l?.destroyed) throw new require_errors.AudioError(`Cannot play audio in a destroyed Scene.`);
		if (this.playbacks.size >= require_gameplay_assets.gameplayAssetLimits.samplePlaybacks) throw new require_errors.AudioError(`Sample playback budget is exhausted.`);
		let u;
		try {
			let e = (typeof document < `u` ? document.baseURI : void 0) ?? (typeof location < `u` ? location.href : void 0);
			u = new URL(t, e);
		} catch (e) {
			throw new require_errors.AudioError(`Invalid stream URL.`, { cause: e });
		}
		if (![
			`http:`,
			`https:`,
			`blob:`,
			`data:`
		].includes(u.protocol)) throw new require_errors.AudioError(`Unsupported stream URL protocol.`);
		let d = i.startTime ?? 0;
		if (!Number.isFinite(d) || d < 0) throw new require_errors.AudioError(`Stream startTime must be finite and nonnegative.`);
		if (i.signal?.aborted) throw i.signal.reason;
		let f = new Audio(), p = i.crossOrigin ?? (typeof location < `u` && u.protocol.startsWith(`http`) && u.origin !== location.origin ? `anonymous` : void 0);
		p && (f.crossOrigin = p), f.preload = `auto`;
		let m = new AbortController(), h, g, _, aborted = () => {
			m.abort(i.signal?.reason ?? this.lifetime.signal.reason), h?.stop();
		}, reportError = (e) => {
			this.host.report?.(e.detail);
		};
		try {
			let e;
			i.signal?.addEventListener(`abort`, aborted, { once: !0 }), this.lifetime.signal.addEventListener(`abort`, aborted, { once: !0 }), this.listener.apply(), g = s.createMediaElementSource(f), _ = s.createGain(), g.connect(_), _.connect(this.host.bus(s, c)), h = new require_stream.AudioStream(f, g, _, (t) => {
				m.signal.aborted || m.abort(new require_errors.AudioError(`Audio stream acquisition was stopped.`, { cause: new DOMException(`Stream was stopped.`, `AbortError`) })), t.removeEventListener(`error`, reportError), this.playbacks.delete(t), this.suspended.delete(t), e?.release();
			}, i, (t) => {
				t ? e ||= this.host.activity?.(c) : (e?.release(), e = void 0);
			}), h.addEventListener(`error`, reportError), this.playbacks.set(h, {
				scene: l,
				persistent: i.persistent ?? !1
			});
			let t = require_stream.whenPlayable(f, i.signal, m.signal);
			f.src = u.href, d > 0 && (f.currentTime = d);
			let p;
			return (i.autoplay ?? !0) && (this.holding ? (h.pause(`manager`), this.suspended.add(h)) : p = h.play()), await require_subscribe_load.subscribeLoad(Promise.all([t, p]), m.signal), this.requireContext(), h;
		} catch (e) {
			throw h ? h.stop() : (g?.disconnect(), _?.disconnect(), f.removeAttribute(`src`), f.load()), e;
		} finally {
			i.signal?.removeEventListener(`abort`, aborted), this.lifetime.signal.removeEventListener(`abort`, aborted);
		}
	}
	suspend() {
		this.holding = !0;
		for (let e of this.playbacks.keys()) e.state !== `stopped` && e.state !== `ended` && (e.pause(`manager`), this.suspended.add(e));
	}
	resume() {
		this.holding = !1;
		for (let e of this.suspended) if (e.state === `paused`) {
			if (e instanceof require_stream.AudioStream) e.play(`manager`).catch((t) => {
				e.dispatchEvent(new CustomEvent(`error`, { detail: t instanceof Error ? t : new require_errors.AudioError(`Unable to resume audio stream.`, { cause: t }) }));
			});
			else try {
				e.resume(`manager`);
			} catch (e) {
				let t = e instanceof Error ? e : new require_errors.AudioError(`Unable to resume sample audio.`, { cause: e });
				if (!this.host.report) throw t;
				this.host.report(t);
			}
		}
		this.suspended.clear();
	}
	stopScene(e) {
		for (let [t, n] of this.playbacks) n.scene === e && (n.persistent ? n.scene = void 0 : t.stop());
	}
	destroy() {
		if (this.disposed) return;
		this.disposed = !0;
		let e = new require_errors.AudioError(`AudioManager has been destroyed.`);
		this.lifetime.abort(e);
		for (let t of this.cache.values()) t.controller.abort(e);
		this.cache.clear();
		for (let e of [...this.playbacks.keys()]) e.stop();
		this.playbacks.clear(), this.suspended.clear();
		for (let e of this.assets) e.dispose();
		this.assets.clear();
	}
};
//#endregion
exports.SampleAudioAsset = SampleAudioAsset;
exports.SampleAudioEngine = SampleAudioEngine;

//# sourceMappingURL=sample-audio.cjs.map