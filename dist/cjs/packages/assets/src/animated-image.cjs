const require_assets = require("../../../src/data/assets.cjs");
const require_texture = require("./texture.cjs");
const require_texture2d = require("./texture2d.cjs");
const require_graphics2d = require("../../../src/data/graphics2d.cjs");
//#region dist/packages/assets/src/animated-image.js
function decoderAPI() {
	let t = globalThis.ImageDecoder;
	if (!t) throw new require_texture.AssetError(`Animated images require WebCodecs ImageDecoder; no fallback is provided.`);
	return t;
}
function aborted(e) {
	if (e?.aborted) throw e.reason ?? new DOMException(`Animated image decoding aborted.`, `AbortError`);
}
function validatePlays(e) {
	if (e !== 1 / 0 && (!Number.isSafeInteger(e) || e < 1)) throw RangeError(`Animated image plays must be a positive safe integer or Infinity.`);
}
var AnimatedImageTimeline = class {
	durations;
	duration;
	plays;
	elapsed = 0;
	index = 0;
	active = !0;
	finished = !1;
	constructor(e, t = 1 / 0) {
		if (validatePlays(t), !e.length || e.length > require_graphics2d.graphics2dLimits.frames || e.some((e) => !Number.isFinite(e) || e <= 0)) throw RangeError(`Animated image frame durations must be positive finite seconds within the frame budget.`);
		if (this.durations = Object.freeze([...e]), this.duration = e.reduce((e, t) => e + t, 0), !Number.isFinite(this.duration) || !Number.isFinite(this.duration * (t === 1 / 0 ? 1 : t))) throw RangeError(`Animated image duration overflow.`);
		this.plays = t;
	}
	get frame() {
		return this.index;
	}
	get playing() {
		return this.active;
	}
	get ended() {
		return this.finished;
	}
	pause() {
		this.active = !1;
	}
	play() {
		this.finished || (this.active = !0);
	}
	reset() {
		this.elapsed = 0, this.index = 0, this.finished = !1;
	}
	update(e) {
		if (!Number.isFinite(e) || e < 0) throw RangeError(`Animated image delta must be finite nonnegative seconds.`);
		if (!this.active || e === 0) return this.index;
		let t = this.duration * this.plays;
		if (this.plays !== 1 / 0 && e >= t - this.elapsed) return this.elapsed = t, this.index = this.durations.length - 1, this.finished = !0, this.active = !1, this.index;
		if (this.plays === 1 / 0) {
			let t = e % this.duration, n = this.duration - this.elapsed;
			this.elapsed = t >= n ? t - n : this.elapsed + t;
		} else this.elapsed += e;
		let n = this.elapsed % this.duration;
		for (this.index = 0; this.index < this.durations.length - 1 && n >= this.durations[this.index];) n -= this.durations[this.index], this.index++;
		return this.index;
	}
};
var AnimatedImageTexture = class AnimatedImageTexture extends require_texture2d.CanvasTexture2D {
	snapshots;
	timeline;
	constructor(e, t, n) {
		super(e[0].image), this.snapshots = e, this.timeline = new AnimatedImageTimeline(t, n);
	}
	get frame() {
		return this.timeline.frame;
	}
	get durations() {
		return this.timeline.durations;
	}
	get plays() {
		return this.timeline.plays;
	}
	get duration() {
		return this.timeline.duration;
	}
	get playing() {
		return !this.destroyed && this.timeline.playing;
	}
	get ended() {
		return this.timeline.ended;
	}
	static async decode(i, a, o = {}) {
		let s = decoderAPI();
		if (a !== `image/gif` && a !== `image/png`) throw new require_texture.AssetError(`Animated images accept GIF or APNG MIME types only.`);
		if (!i.byteLength || i.byteLength > require_assets.assetLimits.textureBytes) throw RangeError(`Animated image encoded bytes exceed the texture budget.`);
		if (o.plays !== void 0 && validatePlays(o.plays), aborted(o.signal), !await s.isTypeSupported(a)) throw new require_texture.AssetError(`ImageDecoder does not support ${a}; no fallback is provided.`);
		aborted(o.signal);
		let c = new s({
			data: new Uint8Array(i),
			type: a,
			preferAnimation: !0
		}), l = [], u = [], d = !1, close = () => {
			d || (d = !0, c.close());
		};
		o.signal?.addEventListener(`abort`, close, { once: !0 }), c.completed.catch(() => {});
		try {
			aborted(o.signal), await c.tracks.ready, await c.completed, aborted(o.signal);
			let i = c.tracks.selectedTrack;
			if (!i || !Number.isInteger(i.frameCount) || i.frameCount < 1 || i.frameCount > require_graphics2d.graphics2dLimits.frames) throw new require_texture.AssetError(`Animated image frame count exceeds its budget.`);
			let a = o.plays ?? (i.repetitionCount === 1 / 0 ? 1 / 0 : i.repetitionCount + 1);
			validatePlays(a);
			let s = 0;
			for (let r = 0; r < i.frameCount; r++) {
				aborted(o.signal);
				let a = await c.decode({
					frameIndex: r,
					completeFramesOnly: !0
				});
				try {
					aborted(o.signal);
					let r = a.image;
					if (s += r.displayWidth * r.displayHeight, !a.complete || s > require_assets.assetLimits.texturePixels || l.length > 0 && (r.displayWidth !== l[0].width || r.displayHeight !== l[0].height)) throw new require_texture.AssetError(`Animated image requires complete, equal-sized composited frames within the total pixel budget.`);
					let c = r.duration === null && i.frameCount === 1 ? 1 : (r.duration ?? 0) / 1e6;
					if (!Number.isFinite(c) || c <= 0) throw new require_texture.AssetError(`Animated image frame duration must be positive.`);
					l.push(new require_texture2d.CanvasTexture2D(r)), u.push(c);
				} finally {
					a.image.close();
				}
			}
			return new AnimatedImageTexture(l, u, a);
		} catch (e) {
			for (let e of l) e.destroy();
			throw aborted(o.signal), e;
		} finally {
			o.signal?.removeEventListener(`abort`, close), close();
		}
	}
	live() {
		if (this.destroyed) throw new require_texture.AssetError(`AnimatedImageTexture is destroyed.`);
	}
	updateAnimation(e) {
		this.live();
		let t = this.frame;
		this.timeline.update(e), t !== this.frame && this.copyFrame(this.snapshots[this.frame].image);
	}
	play() {
		this.live(), this.timeline.play();
	}
	pause() {
		this.live(), this.timeline.pause();
	}
	reset() {
		this.live();
		let e = this.frame;
		this.timeline.reset(), e !== 0 && this.copyFrame(this.snapshots[0].image);
	}
	createAtlas() {
		this.live();
		let r = Math.min(this.snapshots.length, Math.floor(require_assets.assetLimits.textureDimension / this.width)), i = Math.ceil(this.snapshots.length / r), a = r * this.width, o = i * this.height;
		if (o > require_assets.assetLimits.textureDimension || a * o > require_assets.assetLimits.texturePixels) throw new require_texture.AssetError(`Animated image atlas exceeds the texture budget.`);
		let s = typeof OffscreenCanvas < `u` ? new OffscreenCanvas(a, o) : document.createElement(`canvas`);
		s.width = a, s.height = o;
		try {
			let n = s.getContext(`2d`);
			if (!n) throw new require_texture.AssetError(`Animated image atlas requires a 2D canvas context.`);
			let i = this.snapshots.map((e, t) => {
				let i = Object.freeze({
					x: t % r * this.width,
					y: Math.floor(t / r) * this.height,
					width: this.width,
					height: this.height
				});
				return n.drawImage(e.image, i.x, i.y), i;
			}), a = new require_texture2d.CanvasTexture2D(s);
			return {
				texture: a,
				frames: Object.freeze(i),
				durations: this.durations,
				destroy: () => a.destroy()
			};
		} finally {
			s.width = s.height = 0;
		}
	}
	destroy() {
		if (!this.destroyed) {
			this.timeline.pause();
			for (let e of this.snapshots) e.destroy();
			super.destroy();
		}
	}
};
//#endregion
exports.AnimatedImageTexture = AnimatedImageTexture;
exports.AnimatedImageTimeline = AnimatedImageTimeline;

//# sourceMappingURL=animated-image.cjs.map