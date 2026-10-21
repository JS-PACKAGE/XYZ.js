const require_errors = require("./errors.cjs");
const require_texture = require("../../assets/src/texture.cjs");
const require_rendering2d = require("../../../src/data/rendering2d.cjs");
const require_distance_field = require("../../assets/src/fonts/distance-field.cjs");
const require_hypot = require("../../math/src/hypot.cjs");
//#region dist/packages/graphics/src/canvas-sprite-source.js
var CanvasSpriteSource = class {
	renderImage;
	sources = /* @__PURE__ */ new Map();
	sourcePixelCache = /* @__PURE__ */ new Map();
	sourcePixelTotal = 0;
	scratch;
	frames = /* @__PURE__ */ new Map();
	framePixels = 0;
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
		if (x && sameKey(x.key, v)) return this.frames.delete(b), this.frames.set(b, x), x.canvas;
		let S = h * g, C;
		for (x && (C = this.dropFrame(b, x)); this.frames.size >= require_rendering2d.rendering2dLimits.canvasFrameSnapshots || this.framePixels + S > require_rendering2d.rendering2dLimits.canvasFrameSnapshotPixels;) {
			let [e, t] = this.frames.entries().next().value, n = this.dropFrame(e, t);
			C ? n.width = n.height = 1 : C = n;
		}
		return C ??= document.createElement(`canvas`), this.paint(C, f, s, c, h, g, p, m, u ? void 0 : i), this.frames.set(b, {
			canvas: C,
			source: i,
			key: v.slice(),
			pixels: S
		}), this.framePixels += S, C;
	}
	paint(e, t, n, r, i, a, o, s, c) {
		e.width !== i && (e.width = i), e.height !== a && (e.height = a);
		let l = e.getContext(`2d`);
		l.setTransform(1, 0, 0, 1, 0, 0), l.clearRect(0, 0, i, a), l.imageSmoothingEnabled = !1;
		let u = n.ux * o / e.width, d = n.vx * s / e.width, f = n.uy * o / e.height, p = n.vy * s / e.height, m = u * p - d * f, h = n.u0 * o, g = n.v0 * s, _ = r[0] !== 1 || r[1] !== 1 || r[2] !== 1, v = _ && c && u === 1 && p === 1 && d === 0 && f === 0 && Number.isInteger(h) && Number.isInteger(g) ? this.sourcePixels(c) : void 0;
		if (v) {
			let e = l.createImageData(i, a), t = e.data, n = c.width, o = Math.max(0, h), s = Math.min(n, h + i), u = !0;
			copy: for (let e = 0; e < a; e++) {
				let a = g + e;
				if (!(a < 0 || a >= c.height || o >= s)) for (let c = (e * i + o - h) * 4, l = (a * n + o) * 4, d = l + (s - o) * 4; l < d; c += 4, l += 4) {
					let e = v[l + 3];
					if (e !== 0 && e !== 255) {
						u = !1;
						break copy;
					}
					t[c] = v[l] * r[0], t[c + 1] = v[l + 1] * r[1], t[c + 2] = v[l + 2] * r[2], t[c + 3] = e;
				}
			}
			if (u) {
				l.putImageData(e, 0, 0);
				return;
			}
		}
		if (l.setTransform(p / m, -d / m, -f / m, u / m, (f * g - p * h) / m, (d * h - u * g) / m), l.drawImage(t, 0, 0), l.setTransform(1, 0, 0, 1, 0, 0), _) {
			let t = l.getImageData(0, 0, e.width, e.height);
			for (let e = 0; e < t.data.length; e += 4) t.data[e] *= r[0], t.data[e + 1] *= r[1], t.data[e + 2] *= r[2];
			l.putImageData(t, 0, 0);
		}
	}
	sourcePixels(e) {
		let t = e.width * e.height, n = this.sources.get(e);
		if (!n || t > require_rendering2d.rendering2dLimits.canvasFrameSnapshotPixels) return;
		let r = this.sourcePixelCache, i = r.get(e);
		if (i && (r.delete(e), i.version !== e.version && (this.sourcePixelTotal -= i.pixels.length / 4, i = void 0)), !i) {
			for (let [e, n] of r) {
				if (this.sourcePixelTotal + t <= require_rendering2d.rendering2dLimits.canvasFrameSnapshotPixels) break;
				r.delete(e), this.sourcePixelTotal -= n.pixels.length / 4;
			}
			i = {
				version: e.version,
				pixels: n.canvas.getContext(`2d`).getImageData(0, 0, e.width, e.height).data
			}, this.sourcePixelTotal += t;
		}
		return r.set(e, i), i.pixels;
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
		let n = this.sourcePixelCache.get(e);
		n && (this.sourcePixelCache.delete(e), this.sourcePixelTotal -= n.pixels.length / 4);
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