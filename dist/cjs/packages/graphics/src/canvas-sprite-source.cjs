const require_errors = require("./errors.cjs");
const require_texture = require("../../assets/src/texture.cjs");
const require_distance_field = require("../../assets/src/fonts/distance-field.cjs");
//#region dist/packages/graphics/src/canvas-sprite-source.js
var CanvasSpriteSource = class {
	renderImage;
	sources = /* @__PURE__ */ new Map();
	scratch;
	constructor(e) {
		this.renderImage = e;
	}
	endFrame() {
		for (let e of this.sources.keys()) e.destroyed && this.unload(e);
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
	image(i, a, o, s = 1) {
		let c = i instanceof require_texture.Texture && require_distance_field.getTextureDistanceField(i), l = c ? require_distance_field.getDistanceFieldRasterScale(i, s) : 1, u = c ? require_distance_field.getDistanceFieldCanvas(i, l) : this.prepare(i), d = Math.ceil(i.width * l), f = Math.ceil(i.height * l);
		if (i.kind !== `render` && o[0] === 1 && o[1] === 1 && o[2] === 1 && a.u0 === 0 && a.v0 === 0 && a.ux === 1 && a.vx === 0 && a.uy === 0 && a.vy === 1 && a.trimWidth * a.resolution === i.width && a.trimHeight * a.resolution === i.height) return u;
		let p = this.scratch ??= document.createElement(`canvas`), m = Math.max(1, Math.round(a.trimWidth * a.resolution * l)), h = Math.max(1, Math.round(a.trimHeight * a.resolution * l));
		p.width !== m && (p.width = m), p.height !== h && (p.height = h);
		let g = p.getContext(`2d`);
		g.setTransform(1, 0, 0, 1, 0, 0), g.clearRect(0, 0, m, h), g.imageSmoothingEnabled = !1;
		let _ = a.ux * d / p.width, v = a.vx * f / p.width, y = a.uy * d / p.height, b = a.vy * f / p.height, x = _ * b - v * y, S = a.u0 * d, C = a.v0 * f;
		if (g.setTransform(b / x, -v / x, -y / x, _ / x, (y * C - b * S) / x, (v * S - _ * C) / x), g.drawImage(u, 0, 0), g.setTransform(1, 0, 0, 1, 0, 0), o[0] !== 1 || o[1] !== 1 || o[2] !== 1) {
			let e = g.getImageData(0, 0, p.width, p.height);
			for (let t = 0; t < e.data.length; t += 4) e.data[t] *= o[0], e.data[t + 1] *= o[1], e.data[t + 2] *= o[2];
			g.putImageData(e, 0, 0);
		}
		return p;
	}
	unload(e) {
		let t = this.sources.get(e);
		t && (t.canvas.width = t.canvas.height = 1), this.sources.delete(e);
	}
	destroy() {
		for (let e of this.sources.keys()) this.unload(e);
		this.scratch && (this.scratch.width = this.scratch.height = 1), this.scratch = void 0;
	}
};
//#endregion
exports.CanvasSpriteSource = CanvasSpriteSource;

//# sourceMappingURL=canvas-sprite-source.cjs.map