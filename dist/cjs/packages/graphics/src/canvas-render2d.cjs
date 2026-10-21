const require_errors = require("./errors.cjs");
const require_rendering2d = require("../../../src/data/rendering2d.cjs");
const require_index = require("../../math/src/index.cjs");
const require_tiling_sprite2d = require("../../core/src/graphics2d/tiling-sprite2d.cjs");
const require_sprite_instance = require("./sprite-instance.cjs");
//#region dist/packages/graphics/src/canvas-render2d.js
var u = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
};
var d = new Float32Array([
	1,
	1,
	1,
	1
]);
var f = {
	normal: `source-over`,
	add: `lighter`,
	multiply: `multiply`,
	screen: `screen`,
	erase: `destination-out`
};
var CanvasRender2D = class {
	sources;
	stats;
	caches = /* @__PURE__ */ new Map();
	canvasBytes = /* @__PURE__ */ new Map();
	quad = require_sprite_instance.createTextureQuad2D();
	appearance = /* @__PURE__ */ new Float32Array(4);
	matrix = new require_index.Matrix3();
	inverses = /* @__PURE__ */ new WeakMap();
	product = new require_index.Matrix3();
	placement = {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: 0,
		f: 0
	};
	tile = document.createElement(`canvas`);
	tinted = document.createElement(`canvas`);
	maskCanvas = document.createElement(`canvas`);
	tileMatrix;
	paths = /* @__PURE__ */ new WeakMap();
	constructor(e, t) {
		this.sources = e, this.stats = t;
	}
	resizeCanvas(e, t, n) {
		let r = this.canvasBytes.get(e) ?? 0;
		e.width !== t && (e.width = t), e.height !== n && (e.height = n);
		let i = t * n * 4;
		this.canvasBytes.set(e, i), this.stats.target(i - r);
	}
	releaseCanvas(e) {
		let t = this.canvasBytes.get(e);
		t !== void 0 && (this.stats.target(-t), this.canvasBytes.delete(e)), e.width = e.height = 1;
	}
	preflight(e, t = 0) {
		if (t > require_rendering2d.rendering2dLimits.layerDepth) throw RangeError(`Canvas2D layer depth exceeds budget.`);
		for (let n of e.items) {
			if (n.kind === `mesh`) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support visible Mesh2D.`);
			if (n.kind === `sprite` && n.object.material) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native Sprite materials.`);
			if (n.kind === `sprite` && (n.object.lighting || n.object.normalTexture)) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native Lighting2D; select WebGPU or WebGL2.`);
			if (n.kind === `sprite` && (require_sprite_instance.validateSpriteQuad2D(n.object), this.sources.prepare(n.object.texture)), n.kind === `particles`) for (let e = 0; e < n.object.activeCount; e++) {
				let t = n.object.getSlot(n.object.activeSlotAt(e));
				require_sprite_instance.validateTextureQuad2D(t.texture, t.view, t.source), this.sources.prepare(t.texture);
			}
			if (n.kind === `layer`) {
				if (n.object.filters.length) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native Filter2D.`);
				n.object.mask?.texture && this.sources.prepare(n.object.mask.texture);
				let e = n.object.getLocalBounds();
				this.validateBounds(e), this.preflight(n.commands, t + 1);
			}
		}
	}
	validateBounds(e) {
		if (![
			e.x,
			e.y,
			e.width,
			e.height
		].every(Number.isFinite) || e.width > require_rendering2d.rendering2dLimits.targetDimension || e.height > require_rendering2d.rendering2dLimits.targetDimension || Math.ceil(e.width) * Math.ceil(e.height) > require_rendering2d.rendering2dLimits.targetPixels) throw RangeError(`Canvas2D local target exceeds budget.`);
	}
	draw(n, r, s, c, l, d, p = u) {
		this.stats.pass2D();
		let m;
		d && (m = this.inverses.get(d), m || (m = new require_index.Matrix3(), this.inverses.set(d, m)), m.copy(d.updateWorldMatrix()).invert());
		let h = !1;
		for (let t of r.items) {
			let r = t.object;
			if (t.kind === `layer`) {
				let e = t.object, i = this.caches.get(e);
				if (!i || !e.cacheAsTexture || i.version !== e.cacheVersion) {
					let n = e.getLocalBounds();
					this.validateBounds(n);
					let r = i?.canvas ?? document.createElement(`canvas`), a = Math.max(1, Math.ceil(n.width)), o = Math.max(1, Math.ceil(n.height));
					this.resizeCanvas(r, a, o);
					let c = r.getContext(`2d`);
					c.setTransform(1, 0, 0, 1, 0, 0), c.globalAlpha = 1, c.globalCompositeOperation = `source-over`, c.clearRect(0, 0, a, o);
					try {
						this.draw(c, t.commands, s, 1, 1, e, n), e.mask && this.mask(c, e, n);
					} catch (e) {
						throw this.releaseCanvas(r), e;
					}
					i?.tinted && (i.tinted.stale = !0), i = {
						canvas: r,
						bounds: n,
						version: e.cacheVersion,
						tinted: i?.tinted
					}, this.caches.set(e, i);
				}
				let a = this.place(r, r.updateWorldMatrix(), s, c, l, m, p, !1);
				n.setTransform(a.a, a.b, a.c, a.d, a.e, a.f), h = !1, require_sprite_instance.getRelativeAppearance2D(r, d, this.appearance);
				let u = i.canvas, g = u, _ = this.appearance[0], v = this.appearance[1], y = this.appearance[2], b = _ !== 1 || v !== 1 || y !== 1;
				if (b && e.cacheAsTexture) {
					let e = i.tinted;
					e ||= i.tinted = {
						canvas: document.createElement(`canvas`),
						stale: !0,
						r: _,
						g: v,
						b: y
					}, (e.stale || e.r !== _ || e.g !== v || e.b !== y) && (this.tint(u, e.canvas), e.stale = !1, e.r = _, e.g = v, e.b = y), g = e.canvas;
				} else i.tinted && (this.releaseCanvas(i.tinted.canvas), i.tinted = void 0), b && (this.tint(u, this.tinted), g = this.tinted);
				n.globalAlpha = this.appearance[3], n.globalCompositeOperation = f[e.blendMode], n.drawImage(g, i.bounds.x, i.bounds.y, i.bounds.width || 1, i.bounds.height || 1), this.stats.draw2D(), n.globalCompositeOperation = `source-over`;
			} else if (t.kind === `sprite`) {
				let r = t.object, a = require_sprite_instance.getSpriteQuad2D(r, this.quad);
				require_sprite_instance.getRelativeAppearance2D(r, d, this.appearance);
				let u = this.place(r, r.updateWorldMatrix(), s, c, l, m, p, r.roundPixels), f = this.sources.image(r.texture, a, this.appearance, u);
				if (n.globalAlpha = this.appearance[3], n.imageSmoothingEnabled = (r.sampler?.magFilter ?? r.sampler?.minFilter ?? `linear`) !== `nearest`, r instanceof require_tiling_sprite2d.TilingSprite2D) {
					n.setTransform(u.a, u.b, u.c, u.d, u.e, u.f), h = !1, n.save(), n.beginPath(), n.rect(-r.anchor.x * r.width, -r.anchor.y * r.height, r.width, r.height), n.clip();
					let e = this.tile, t = f.width / a.trimWidth, i = Math.max(1, Math.round(a.naturalWidth * t)), o = Math.max(1, Math.round(a.naturalHeight * t));
					this.resizeCanvas(e, i, o), this.stats.pass2D();
					let s = e.getContext(`2d`);
					s.clearRect(0, 0, i, o), s.drawImage(f, a.trimX * t, a.trimY * t), this.stats.draw2D();
					let c = n.createPattern(e, `repeat`), l = Math.cos(r.tileRotation), d = Math.sin(r.tileRotation), p = this.tileMatrix ??= new DOMMatrix();
					p.a = l * r.tileScale.x / t, p.b = d * r.tileScale.x / t, p.c = -d * r.tileScale.y / t, p.d = l * r.tileScale.y / t, p.e = r.tilePosition.x, p.f = r.tilePosition.y, c.setTransform(p), n.fillStyle = c, n.fillRect(-r.anchor.x * r.width, -r.anchor.y * r.height, r.width, r.height), n.restore();
				} else h = this.drawPlaced(n, h, f, a.x, a.y, a.width, a.height);
				this.stats.draw2D();
			} else if (t.kind === `particles`) {
				let e = t.object;
				for (let t = 0; t < e.activeCount; t++) {
					let r = e.activeSlotAt(t), i = e.getSlot(r), u = require_sprite_instance.getTextureQuad2D(i.texture, i.view, i.source, this.quad);
					require_sprite_instance.getRelativeAppearance2D(e, d, this.appearance), this.appearance[0] *= i.tintR, this.appearance[1] *= i.tintG, this.appearance[2] *= i.tintB, this.appearance[3] *= i.tintA;
					let f = this.place(e, e.getSlotWorldMatrix(r, this.matrix), s, c, l, m, p, !1), g = this.sources.image(i.texture, u, this.appearance, f);
					n.globalAlpha = this.appearance[3], h = this.drawPlaced(n, h, g, u.x - i.anchorX * u.naturalWidth, u.y - i.anchorY * u.naturalHeight, u.width, u.height), this.stats.draw2D();
				}
			}
		}
		n.globalAlpha = 1, n.globalCompositeOperation = `source-over`;
		for (let e of this.caches.keys()) {
			let t = this.caches.get(e);
			(e.destroyed || !e.isolationEnabled) && (this.releaseCanvas(t.canvas), t.tinted && this.releaseCanvas(t.tinted.canvas), this.caches.delete(e));
		}
	}
	tint(e, t) {
		this.resizeCanvas(t, e.width, e.height), this.stats.pass2D();
		let n = t.getContext(`2d`);
		n.globalCompositeOperation = `copy`, n.drawImage(e, 0, 0), this.stats.draw2D(), n.globalCompositeOperation = `source-over`;
		let r = n.getImageData(0, 0, e.width, e.height);
		for (let e = 0; e < r.data.length; e += 4) for (let t = 0; t < 3; t++) r.data[e + t] *= this.appearance[t];
		n.putImageData(r, 0, 0);
	}
	place(e, t, n, r, i, a, o, s) {
		let c = a ? this.product.copy(a).multiply(t).elements : t.elements, l = !a && e.worldSpace === `world`, u = n.camera2D, d = l ? u.zoom : 1, f = ((c[6] - (l ? u.position.x : 0)) * d + (l ? u.renderOffset.x : 0) - o.x) * r, p = ((c[7] - (l ? u.position.y : 0)) * d + (l ? u.renderOffset.y : 0) - o.y) * i;
		s && (f = Math.round(f), p = Math.round(p));
		let m = this.placement;
		return m.a = c[0] * d * r, m.b = c[1] * d * i, m.c = c[3] * d * r, m.d = c[4] * d * i, m.e = f, m.f = p, m;
	}
	drawPlaced(e, t, n, r, i, a, o) {
		let s = this.placement;
		return s.b === 0 && s.c === 0 && s.a > 0 && s.d > 0 ? (t || e.setTransform(1, 0, 0, 1, 0, 0), e.drawImage(n, s.e + s.a * r, s.f + s.d * i, s.a * a, s.d * o), !0) : (e.setTransform(s.a, s.b, s.c, s.d, s.e, s.f), e.drawImage(n, r, i, a, o), !1);
	}
	mask(e, t, n) {
		let r = t.mask, i = this.maskCanvas;
		this.resizeCanvas(i, e.canvas.width, e.canvas.height), this.stats.pass2D();
		let o = i.getContext(`2d`);
		o.setTransform(1, 0, 0, 1, 0, 0), o.clearRect(0, 0, i.width, i.height);
		let s = r.transform;
		if (o.setTransform(s[0], s[1], s[2], s[3], s[4] - n.x, s[5] - n.y), o.fillStyle = `white`, r.kind === `rect`) {
			let e = r.rect;
			o.fillRect(e.x, e.y, e.width, e.height);
		} else if (r.kind === `path`) {
			let e = this.paths.get(r.path);
			e || (e = r.path.nativePath2D, this.paths.set(r.path, e)), o.fill(e, r.path.fillRule);
		} else {
			let e = require_sprite_instance.getTextureQuad2D(r.texture, r.view, void 0, this.quad), t = this.sources.image(r.texture, e, d);
			if (o.drawImage(t, e.x, e.y, e.width, e.height), r.channel === `red`) {
				let e = o.getImageData(0, 0, i.width, i.height);
				for (let t = 0; t < e.data.length; t += 4) e.data[t + 3] = Math.round(e.data[t] * e.data[t + 3] / 255);
				o.setTransform(1, 0, 0, 1, 0, 0), o.putImageData(e, 0, 0);
			}
		}
		e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = 1, e.globalCompositeOperation = r.inverse ? `destination-out` : `destination-in`, e.drawImage(i, 0, 0), this.stats.draw2D(), this.stats.draw2D(), e.globalCompositeOperation = `source-over`;
	}
	destroy() {
		for (let e of this.canvasBytes.keys()) this.releaseCanvas(e);
		this.caches.clear();
	}
};
//#endregion
exports.CanvasRender2D = CanvasRender2D;

//# sourceMappingURL=canvas-render2d.cjs.map