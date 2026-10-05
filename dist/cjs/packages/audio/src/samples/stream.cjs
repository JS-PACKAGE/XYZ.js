const require_gameplay_assets = require("../../../../src/data/gameplay-assets.cjs");
const require_errors = require("../errors.cjs");
const require_spatial = require("./spatial.cjs");
//#region dist/packages/audio/src/samples/stream.js
var AudioStream = class extends EventTarget {
	media;
	source;
	gain;
	release;
	activity;
	status = `paused`;
	level;
	disposed = !1;
	pauseReasons = /* @__PURE__ */ new Set();
	panner;
	generation = 0;
	pending;
	constructor(e, t, i, a, o, s) {
		if (super(), this.media = e, this.source = t, this.gain = i, this.release = a, this.activity = s, this.level = o.volume ?? 1, checkVolume(this.level), this.playbackRate = o.playbackRate ?? 1, i.gain.value = this.level, o.spatial) {
			let e = require_spatial.checkSpatialOptions(o.spatial);
			this.panner = i.context.createPanner(), require_spatial.applyPannerOptions(this.panner, e), t.disconnect(), t.connect(this.panner), this.panner.connect(i);
		}
		e.loop = o.loop ?? !1, e.addEventListener(`ended`, this.onEnded), e.addEventListener(`error`, this.onError);
	}
	get state() {
		return this.status;
	}
	get position() {
		return this.media.currentTime;
	}
	get duration() {
		let e = this.media.duration;
		return Number.isNaN(e) ? void 0 : e;
	}
	get loop() {
		return this.media.loop;
	}
	set loop(e) {
		this.media.loop = e;
	}
	get volume() {
		return this.level;
	}
	set volume(e) {
		checkVolume(e), this.level = e, this.gain.gain.value = e;
	}
	get position3D() {
		return this.panner ? {
			x: this.panner.positionX.value,
			y: this.panner.positionY.value,
			z: this.panner.positionZ.value
		} : void 0;
	}
	set position3D(e) {
		if (!this.panner || !e) throw new require_errors.AudioError(`Stream was not created with spatial options.`);
		require_spatial.validateVec3(e, `Spatial position`), this.panner.positionX.value = e.x, this.panner.positionY.value = e.y, this.panner.positionZ.value = e.z;
	}
	get playbackRate() {
		return this.media.playbackRate;
	}
	set playbackRate(n) {
		if (!Number.isFinite(n) || n <= 0 || n > require_gameplay_assets.gameplayAssetLimits.playbackRate) throw new require_errors.AudioError(`Stream playback rate must be within (0, ${require_gameplay_assets.gameplayAssetLimits.playbackRate}].`);
		this.media.playbackRate = n;
	}
	play(e = `user`) {
		if (this.status === `stopped`) return Promise.reject(new require_errors.AudioError(`Cannot play a stopped audio stream.`));
		if (this.pauseReasons.delete(e), this.pauseReasons.size || this.status === `playing`) return Promise.resolve();
		if (this.pending?.generation === this.generation) return this.pending.promise;
		let n = this.generation, r;
		try {
			r = this.media.play();
		} catch (e) {
			return Promise.reject(new require_errors.AudioError(`Unable to start audio stream playback.`, { cause: e }));
		}
		let i = r.then(() => {
			if (n !== this.generation) throw new require_errors.AudioError(`Audio stream playback was interrupted.`, { cause: new DOMException(`Playback was superseded.`, `AbortError`) });
			this.status = `playing`, this.activity?.(!0);
		}).catch((e) => {
			throw e instanceof require_errors.AudioError ? e : new require_errors.AudioError(`Unable to start audio stream playback.`, { cause: e });
		}).finally(() => {
			this.pending?.generation === n && (this.pending = void 0);
		});
		return this.pending = {
			generation: n,
			promise: i
		}, i;
	}
	pause(e = `user`) {
		this.disposed || (this.pauseReasons.add(e), this.generation++, this.media.pause(), this.status === `playing` && (this.status = `paused`, this.activity?.(!1)));
	}
	seek(e) {
		if (!Number.isFinite(e) || e < 0) throw new require_errors.AudioError(`Stream position must be finite and nonnegative.`);
		if (this.status === `stopped`) throw new require_errors.AudioError(`Cannot seek a stopped audio stream.`);
		this.media.currentTime = e, this.status === `ended` && (this.status = `paused`);
	}
	stop() {
		this.disposed || (this.disposed = !0, this.generation++, this.status = `stopped`, this.pauseReasons.clear(), this.activity?.(!1), this.media.removeEventListener(`ended`, this.onEnded), this.media.removeEventListener(`error`, this.onError), this.media.pause(), this.media.removeAttribute(`src`), this.media.load(), this.source.disconnect(), this.gain.disconnect(), this.panner?.disconnect(), this.release(this));
	}
	onEnded = () => {
		this.status === `playing` && (this.generation++, this.status = `ended`, this.activity?.(!1), this.dispatchEvent(new Event(`ended`)));
	};
	onError = () => {
		if (this.status === `stopped`) return;
		this.generation++, this.activity?.(!1), this.media.pause(), this.status = `paused`;
		let e = this.media.error?.code;
		this.dispatchEvent(new CustomEvent(`error`, { detail: new require_errors.AudioError(`Audio stream failed${e === void 0 ? `` : ` (media error ${e})`}.`) }));
	};
};
function checkVolume(e) {
	if (!Number.isFinite(e) || e < 0 || e > 1) throw new require_errors.AudioError(`Stream volume must be finite and within 0..1.`);
}
function whenPlayable(e, n, r) {
	return new Promise((i, a) => {
		let cleanup = () => {
			e.removeEventListener(`canplay`, ready), e.removeEventListener(`error`, failed), n?.removeEventListener(`abort`, aborted), r.removeEventListener(`abort`, aborted);
		}, ready = () => {
			cleanup(), i();
		}, failed = () => {
			cleanup(), a(new require_errors.AudioError(`Unable to load audio stream${e.error ? ` (media error ${e.error.code})` : ``}.`));
		}, aborted = () => {
			cleanup(), a(n?.reason ?? r.reason);
		};
		if (n?.aborted || r.aborted) return aborted();
		if (e.error) return failed();
		if (e.readyState >= 3) return ready();
		e.addEventListener(`canplay`, ready), e.addEventListener(`error`, failed), n?.addEventListener(`abort`, aborted), r.addEventListener(`abort`, aborted);
	});
}
//#endregion
exports.AudioStream = AudioStream;
exports.whenPlayable = whenPlayable;

//# sourceMappingURL=stream.cjs.map