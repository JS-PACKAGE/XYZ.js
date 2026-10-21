const require_errors = require("./errors.cjs");
const require_texture = require("../../assets/src/texture.cjs");
const require_rendering2d = require("../../../src/data/rendering2d.cjs");
const require_distance_field = require("../../assets/src/fonts/distance-field.cjs");
const require_hypot = require("../../math/src/hypot.cjs");
//#region dist/packages/graphics/src/canvas-sprite-source.js
var CanvasSpriteSource = class {
	renderImage;
	sources = /* @__PURE__ */ new Map();
	scratch;
	frames = /* @__PURE__ */ new Map();
	framePixels = 0;
	frameClock = 0;
	frameKey = /* @__PURE__ */ new Float64Array(16);
	frameWords = new Int32Array(this.frameKey.buffer);
	sourceIds = /* @__PURE__ */ new WeakMap();
	nextSourceId = 0;
	constructor(e) {
		this.renderImage = e;
	}
	endFrame() {
		for (let e of this.sources.keys()) e.destroyed && this.unload(e);
		for (let e of this.frames.values()) e.source.destroyed && this.dropFrames(e.source);
	}
	prepare(e) {
		if (e.destroyed) throw new require_errors.GraphicsError(`Cannot prepare a destroyed texture.`);
		if (e.kind === `native`) throw new require_errors.GraphicsError(`Canvas2D does not support native texture payloads.`);
		if (e.kind === `render`) return this.renderImage(e);
		let t = this.sources.get(e);
		if (t || (t = {
			canvas: document.createElement(`canvas`),
			version: -1
		}, this.sources.set(e, t)), t.version !== e.version) {
			t.canvas.width = e.width, t.canvas.height = e.height;
			let n = t.canvas.getContext(`2d`);
			if (!n) throw new require_errors.GraphicsError(`Canvas2D source preparation is unavailable.`);
			n.drawImage(e.image, 0, 0), t.version = e.version;
		}
		return t.canvas;
	}
	image(i, s, c, l) {
		let u = i instanceof require_texture.Texture && require_distance_field.getTextureDistanceField(i), d = 1;
		u && (d = require_distance_field.getDistanceFieldRasterScale(i, l ? Math.max(require_hypot.hypot2(l.a, l.b), require_hypot.hypot2(l.c, l.d)) / s.resolution : 1));
		let f = u ? require_distance_field.getDistanceFieldCanvas(i, d) : this.prepare(i), p = Math.ceil(i.width * d), m = Math.ceil(i.height * d);
		if (i.kind !== `render` && c[0] === 1 && c[1] === 1 && c[2] === 1 && s.u0 === 0 && s.v0 === 0 && s.ux === 1 && s.vx === 0 && s.uy === 0 && s.vy === 1 && s.trimWidth * s.resolution === i.width && s.trimHeight * s.resolution === i.height) return f;
		let h = Math.max(1, Math.round(s.trimWidth * s.resolution * d)), g = Math.max(1, Math.round(s.trimHeight * s.resolution * d));
		if (i.kind === `render` || h * g > require_rendering2d.rendering2dLimits.canvasFrameSnapshotPixels) {
			let e = this.scratch ??= document.createElement(`canvas`);
			return this.paint(e, f, s, c, h, g, p, m), e;
		}
		let _ = this.sourceIds.get(i);
		_ === void 0 && this.sourceIds.set(i, _ = this.nextSourceId++);
		let v = this.frameKey;
		v[0] = _, v[1] = i.version, v[2] = d, v[3] = i.width, v[4] = i.height, v[5] = s.u0, v[6] = s.v0, v[7] = s.ux, v[8] = s.vx, v[9] = s.uy, v[10] = s.vy, v[11] = h, v[12] = g, v[13] = c[0], v[14] = c[1], v[15] = c[2];
		let y = this.frameWords, b = 0;
		for (let e = 0; e < y.length; e++) b = Math.imul(b, 16777619) ^ y[e] | 0;
		let x = this.frames.get(b);
		if (x && sameKey(x.key, v)) return x.used = ++this.frameClock, x.canvas;
		let S = h * g, C;
		for (x && (C = this.dropFrame(b, x)); this.frames.size >= require_rendering2d.rendering2dLimits.canvasFrameSnapshots || this.framePixels + S > require_rendering2d.rendering2dLimits.canvasFrameSnapshotPixels;) {
			let e, t;
			for (let [n, r] of this.frames) (!t || r.used < t.used) && (e = n, t = r);
			let n = this.dropFrame(e, t);
			C ? n.width = n.height = 1 : C = n;
		}
		return C ??= document.createElement(`canvas`), this.paint(C, f, s, c, h, g, p, m), this.frames.set(b, {
			canvas: C,
			source: i,
			key: v.slice(),
			pixels: S,
			used: ++this.frameClock
		}), this.framePixels += S, C;
	}
	paint(e, t, n, r, i, a, o, s) {
		e.width !== i && (e.width = i), e.height !== a && (e.height = a);
		let c = e.getContext(`2d`);
		c.setTransform(1, 0, 0, 1, 0, 0), c.clearRect(0, 0, i, a), c.imageSmoothingEnabled = !1;
		let l = n.ux * o / e.width, u = n.vx * s / e.width, d = n.uy * o / e.height, f = n.vy * s / e.height, p = l * f - u * d, m = n.u0 * o, h = n.v0 * s;
		if (c.setTransform(f / p, -u / p, -d / p, l / p, (d * h - f * m) / p, (u * m - l * h) / p), c.drawImage(t, 0, 0), c.setTransform(1, 0, 0, 1, 0, 0), r[0] !== 1 || r[1] !== 1 || r[2] !== 1) {
			let t = c.getImageData(0, 0, e.width, e.height);
			for (let e = 0; e < t.data.length; e += 4) t.data[e] *= r[0], t.data[e + 1] *= r[1], t.data[e + 2] *= r[2];
			c.putImageData(t, 0, 0);
		}
	}
	dropFrame(e, t) {
		return this.frames.delete(e), this.framePixels -= t.pixels, t.canvas;
	}
	dropFrames(e) {
		for (let [t, n] of this.frames) if (!e || n.source === e) {
			let e = this.dropFrame(t, n);
			e.width = e.height = 1;
		}
	}
	unload(e) {
		let t = this.sources.get(e);
		t && (t.canvas.width = t.canvas.height = 1), this.sources.delete(e), this.dropFrames(e);
	}
	destroy() {
		for (let e of this.sources.keys()) this.unload(e);
		this.dropFrames(), this.scratch && (this.scratch.width = this.scratch.height = 1), this.scratch = void 0;
	}
};
function sameKey(e, t) {
	for (let n = 0; n < 16; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
//#endregion
exports.CanvasSpriteSource = CanvasSpriteSource;

//# sourceMappingURL=canvas-sprite-source.cjs.map