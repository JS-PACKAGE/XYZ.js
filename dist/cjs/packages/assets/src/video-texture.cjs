const require_assets = require("../../../src/data/assets.cjs");
const require_texture = require("./texture.cjs");
const require_texture2d = require("./texture2d.cjs");
const require_video = require("../../../src/data/video.cjs");
//#region dist/packages/assets/src/video-texture.js
function failure(t) {
	return t instanceof Error ? t : new require_texture.AssetError(String(t));
}
function emptySurface() {
	if (typeof OffscreenCanvas < `u`) return new OffscreenCanvas(1, 1);
	let e = document.createElement(`canvas`);
	return e.width = e.height = 1, e;
}
var VideoTexture = class VideoTexture extends require_texture2d.CanvasTexture2D {
	video;
	ownVideo = !1;
	callback;
	fallback;
	listeners = [];
	abortSignal;
	abortListener;
	observers = /* @__PURE__ */ new Set();
	decoders = /* @__PURE__ */ new Set();
	lastTime = -1;
	errorValue;
	constructor(e = {}) {
		super(emptySurface()), e.onError && this.observers.add(e.onError);
	}
	get lastError() {
		return this.errorValue;
	}
	get media() {
		return this.video;
	}
	onError(t) {
		if (this.destroyed) throw new require_texture.AssetError(`VideoTexture is destroyed.`);
		return this.observers.add(t), () => this.observers.delete(t);
	}
	ingest(e) {
		try {
			this.copyFrame(e);
		} catch (e) {
			throw this.observe(e), e;
		} finally {
			e.close();
		}
	}
	static async fromVideo(t, r = {}) {
		let i = new VideoTexture(r);
		i.video = t, i.ownVideo = r.ownVideo ?? !1;
		let a = r.timeoutMs ?? require_video.videoTextureLimits.loadTimeoutMs;
		if (!Number.isFinite(a) || a <= 0 || a > require_video.videoTextureLimits.maxLoadTimeoutMs) throw i.destroy(), RangeError(`Video load timeout exceeds its positive finite budget.`);
		try {
			if (await new Promise((n, i) => {
				let cleanup = () => {
					clearTimeout(o), t.removeEventListener(`loadeddata`, ready), t.removeEventListener(`error`, error), r.signal?.removeEventListener(`abort`, abort);
				}, ready = () => {
					cleanup(), n();
				}, error = () => {
					cleanup(), i(new require_texture.AssetError(`Unable to load video: ${t.error?.message ?? `media error`}.`));
				}, abort = () => {
					cleanup(), i(r.signal?.reason ?? new DOMException(`Video load aborted.`, `AbortError`));
				}, o = setTimeout(() => {
					cleanup(), i(new require_texture.AssetError(`Video load timed out.`));
				}, a);
				if (r.signal?.aborted) {
					abort();
					return;
				}
				if (t.error) {
					error();
					return;
				}
				if (t.readyState >= 2) {
					ready();
					return;
				}
				t.addEventListener(`loadeddata`, ready), t.addEventListener(`error`, error), r.signal?.addEventListener(`abort`, abort, { once: !0 });
			}), r.signal?.aborted) throw r.signal.reason;
			return i.copyFrame(t), i.lastTime = t.currentTime, i.listen(`play`, () => i.schedule()), i.listen(`pause`, () => i.cancelDelivery()), i.listen(`ended`, () => i.cancelDelivery()), i.listen(`seeked`, () => i.capture()), i.listen(`error`, () => {
				i.cancelDelivery(), i.observe(new require_texture.AssetError(`Video playback failed: ${t.error?.message ?? `media error`}.`));
			}), r.signal && (i.abortSignal = r.signal, i.abortListener = () => i.destroy(), r.signal.addEventListener(`abort`, i.abortListener, { once: !0 })), i.schedule(), i;
		} catch (e) {
			try {
				i.observe(e);
			} finally {
				i.destroy();
			}
			throw e;
		}
	}
	static async load(e, t = {}) {
		let n = document.createElement(`video`);
		return n.crossOrigin = t.crossOrigin ?? `anonymous`, n.preload = `auto`, n.playsInline = !0, n.muted = t.muted ?? !0, n.loop = t.loop ?? !1, n.src = String(e), n.load(), VideoTexture.fromVideo(n, {
			...t,
			ownVideo: !0
		});
	}
	async play() {
		if (this.destroyed || !this.video) throw new require_texture.AssetError(`VideoTexture has no live media element.`);
		let t = this.video;
		try {
			await t.play(), this.destroyed ? this.ownVideo && t.pause() : this.schedule();
		} catch (e) {
			throw this.destroyed || this.observe(e), e;
		}
	}
	pause() {
		this.video?.pause(), this.cancelDelivery();
	}
	async createDecoder(t) {
		if (this.destroyed) throw new require_texture.AssetError(`VideoTexture is destroyed.`);
		for (let e of this.decoders) e.destroyed && this.decoders.delete(e);
		if (this.decoders.size >= 4) throw RangeError(`VideoTexture supports at most four live decoders.`);
		let n = await VideoTextureDecoder.create(this, t);
		if (this.destroyed || this.decoders.size >= 4) throw n.destroy(), new require_texture.AssetError(`VideoTexture was destroyed or reached its decoder budget while configuring.`);
		return this.decoders.add(n), n;
	}
	listen(e, t) {
		let n = t;
		this.listeners.push([e, n]), this.video.addEventListener(e, n);
	}
	capture() {
		if (!(this.destroyed || !this.video || this.video.readyState < 2)) try {
			this.copyFrame(this.video), this.lastTime = this.video.currentTime;
		} catch (e) {
			this.cancelDelivery(), this.observe(e);
		}
	}
	schedule() {
		let e = this.video;
		this.destroyed || !e || e.paused || e.ended || this.callback !== void 0 || this.fallback !== void 0 || (typeof e.requestVideoFrameCallback == `function` ? this.callback = e.requestVideoFrameCallback(() => {
			this.callback = void 0, !(this.destroyed || e.paused) && (this.capture(), this.errorValue || this.schedule());
		}) : this.fallback = requestAnimationFrame(() => {
			this.fallback = void 0, !this.destroyed && (e.currentTime !== this.lastTime && this.capture(), this.errorValue || this.schedule());
		}));
	}
	cancelDelivery() {
		this.callback !== void 0 && this.video?.cancelVideoFrameCallback(this.callback), this.fallback !== void 0 && cancelAnimationFrame(this.fallback), this.callback = this.fallback = void 0;
	}
	observe(e) {
		this.errorValue = failure(e);
		for (let e of this.observers) e(this.errorValue);
	}
	destroy() {
		if (!this.destroyed) {
			this.cancelDelivery();
			for (let [e, t] of this.listeners) this.video?.removeEventListener(e, t);
			this.listeners.length = 0, this.abortListener && this.abortSignal?.removeEventListener(`abort`, this.abortListener);
			for (let e of this.decoders) e.destroy();
			this.decoders.clear(), this.ownVideo && this.video && (this.video.pause(), this.video.removeAttribute(`src`), this.video.srcObject = null, this.video.load()), this.video = void 0, this.observers.clear(), super.destroy();
		}
	}
};
var VideoTextureDecoder = class VideoTextureDecoder {
	texture;
	decoder;
	pending;
	queuedBytes = 0;
	disposed = !1;
	scheduled = !1;
	errorValue;
	constructor(e, t) {
		this.texture = e, this.decoder = new VideoDecoder({
			output: (t) => {
				if (this.disposed || e.destroyed) {
					t.close();
					return;
				}
				this.pending?.close(), this.pending = t, this.scheduled || (this.scheduled = !0, queueMicrotask(() => {
					this.scheduled = !1;
					let t = this.pending;
					if (this.pending = void 0, t) {
						if (this.disposed || e.destroyed) {
							t.close();
							return;
						}
						try {
							e.ingest(t);
						} catch (e) {
							this.fail(e);
						}
					}
				}));
			},
			error: (e) => this.fail(e)
		});
		try {
			this.decoder.configure(t);
		} catch (e) {
			throw this.decoder.close(), e;
		}
		this.decoder.addEventListener(`dequeue`, () => {
			this.decoder.decodeQueueSize === 0 && (this.queuedBytes = 0);
		});
	}
	static async create(t, i) {
		if (typeof VideoDecoder > `u`) throw new require_texture.AssetError(`WebCodecs VideoDecoder is unavailable (secure context required).`);
		let a = i.codedWidth, o = i.codedHeight;
		if (!a || !o || a < 1 || o < 1 || !Number.isSafeInteger(a) || !Number.isSafeInteger(o) || a > require_assets.assetLimits.textureDimension || o > require_assets.assetLimits.textureDimension || a * o > require_assets.assetLimits.texturePixels || i.description && i.description.byteLength > require_video.videoTextureLimits.decoderChunkBytes) throw RangeError(`Video decoder requires explicit bounded codedWidth/codedHeight and description.`);
		let s = {
			...i,
			hardwareAcceleration: i.hardwareAcceleration ?? `prefer-hardware`
		}, c = await VideoDecoder.isConfigSupported(s);
		if (!c.supported) throw new require_texture.AssetError(`WebCodecs decoder configuration is unsupported.`);
		if (t.destroyed) throw new require_texture.AssetError(`VideoTexture was destroyed while configuring decoder.`);
		return new VideoTextureDecoder(t, c.config ?? s);
	}
	get lastError() {
		return this.errorValue;
	}
	get destroyed() {
		return this.disposed;
	}
	get decodeQueueSize() {
		return this.disposed ? 0 : this.decoder.decodeQueueSize;
	}
	decode(t) {
		if (this.disposed || this.texture.destroyed) throw new require_texture.AssetError(`Video decoder is destroyed.`);
		if (this.errorValue) throw this.errorValue;
		if (t.byteLength > require_video.videoTextureLimits.decoderChunkBytes || this.queuedBytes + t.byteLength > require_video.videoTextureLimits.decoderQueuedBytes || this.decoder.decodeQueueSize >= require_video.videoTextureLimits.decoderQueue) throw RangeError(`Video decoder input exceeds its bounded queue; await flush before supplying more chunks.`);
		this.decoder.decode(t), this.queuedBytes += t.byteLength;
	}
	async flush() {
		if (this.disposed) throw new require_texture.AssetError(`Video decoder is destroyed.`);
		if (await this.decoder.flush(), await Promise.resolve(), this.queuedBytes = 0, this.disposed) throw new require_texture.AssetError(`Video decoder was destroyed while flushing.`);
		if (this.errorValue) throw this.errorValue;
	}
	fail(e) {
		this.disposed || (this.errorValue = failure(e), this.destroy(), this.texture.observe(this.errorValue));
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.pending?.close(), this.pending = void 0, this.decoder.state !== `closed` && this.decoder.close(), this.queuedBytes = 0);
	}
};
//#endregion
exports.VideoTexture = VideoTexture;
exports.VideoTextureDecoder = VideoTextureDecoder;

//# sourceMappingURL=video-texture.cjs.map