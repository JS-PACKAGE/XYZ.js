const require_errors = require("./errors.cjs");
const require_texture = require("../../assets/src/texture.cjs");
const require_render_texture2d = require("./render-texture2d.cjs");
const require_isolated_group = require("../../core/src/rendering2d/isolated-group.cjs");
const require_scene = require("../../core/src/scene.cjs");
const require_render2d_contract = require("./render2d-contract.cjs");
//#region dist/packages/graphics/src/canvas-render2d-targets.js
var CanvasRender2DTargets = class {
	owner;
	idle;
	engine;
	alive;
	canvases = /* @__PURE__ */ new Map();
	detachedScene = new require_scene.Scene();
	constructor(e, t, n, r) {
		this.owner = e, this.idle = t, this.engine = n, this.alive = r;
	}
	create(e) {
		this.idle();
		let t = require_render_texture2d.validateRenderTextureSize2D(e), n = document.createElement(`canvas`);
		if (this.engine.resizeCanvas(n, t.width, t.height), !n.getContext(`2d`)) throw this.engine.releaseCanvas(n), new require_errors.GraphicsError(`Canvas2D target unavailable.`);
		let r = require_render_texture2d.createOwnedRenderTexture2D(this.owner, t, (e) => {
			this.idle(), this.engine.resizeCanvas(n, e.width, e.height);
		}, () => {
			this.engine.releaseCanvas(n), this.canvases.delete(r);
		});
		return this.canvases.set(r, n), r;
	}
	async render(e, t, a = {}) {
		this.idle(), require_render_texture2d.assertRenderTextureOwner2D(e, this.owner);
		let l = t instanceof require_isolated_group.IsolatedGroup2D ? t : void 0, f = l ? l.scene ?? this.detachedScene : t;
		if (t.destroyed) throw new require_errors.GraphicsError(`Render content must be live.`);
		if (f.effects2D.length) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native 2D post processors.`);
		let p = a.bounds ?? (l ? l.getLocalBounds() : {
			x: 0,
			y: 0,
			width: e.logicalWidth,
			height: e.logicalHeight
		});
		if (require_render_texture2d.validateRenderTextureSize2D({
			width: p.width,
			height: p.height,
			resolution: e.resolution
		}), !Number.isFinite(p.x + p.y)) throw RangeError(`Render bounds must be finite.`);
		let m = new require_render2d_contract.RenderCommandBuffer2D(), h = document.createElement(`canvas`);
		try {
			require_render2d_contract.collectRenderCommands2D(f, e.logicalWidth, e.logicalHeight, m, {
				root: l,
				skipCulling: !0
			}), this.engine.preflight(m);
			let t = [], source = (e) => {
				e?.kind === `render` && t.push(e);
			}, inspect = (e) => {
				for (let t of e.items) if (t.kind === `layer`) source(t.object.mask?.texture), inspect(t.commands);
				else if (t.kind === `particles`) for (let e = 0; e < t.object.activeCount; e++) source(t.object.getSlot(t.object.activeSlotAt(e)).texture);
				else source(t.object.texture);
			};
			inspect(m), require_render_texture2d.validateRenderTextureDependencies2D(e, t, this.owner), this.engine.resizeCanvas(h, e.width, e.height);
			let n = h.getContext(`2d`);
			a.clear === !1 && (n.drawImage(this.canvases.get(e), 0, 0), this.engine.stats.draw2D()), this.engine.draw(n, m, f, e.width / p.width, e.height / p.height, l, p);
			let i = this.canvases.get(e).getContext(`2d`);
			this.engine.stats.pass2D(), i.globalCompositeOperation = `copy`, i.drawImage(h, 0, 0), this.engine.stats.draw2D(), i.globalCompositeOperation = `source-over`, e.publish(this.owner, t);
		} finally {
			this.engine.releaseCanvas(h), m.destroy(), this.engine.sources.endFrame();
		}
	}
	async extract(e, t = {}) {
		this.idle(), require_render_texture2d.assertRenderTextureOwner2D(e, this.owner);
		let n = require_render_texture2d.validateRenderTextureRegion2D(e, t.region);
		return this.canvases.get(e).getContext(`2d`).getImageData(n.x, n.y, n.width, n.height).data;
	}
	async generate(t, r = {}) {
		this.idle();
		let i = r.bounds ?? (t instanceof require_isolated_group.IsolatedGroup2D ? t.getLocalBounds() : {
			x: 0,
			y: 0,
			width: t.camera2D.viewportWidth,
			height: t.camera2D.viewportHeight
		}), a = this.create({
			width: i.width,
			height: i.height,
			resolution: r.resolution
		});
		try {
			await this.render(a, t, { bounds: i });
			let n = await createImageBitmap(this.canvases.get(a));
			if (!this.alive()) throw n.close(), new require_errors.GraphicsError(`Renderer destroyed during generation.`);
			return new require_texture.Texture(n);
		} finally {
			a.destroy();
		}
	}
	destroy() {
		for (let e of this.canvases.keys()) e.destroy();
	}
};
//#endregion
exports.CanvasRender2DTargets = CanvasRender2DTargets;

//# sourceMappingURL=canvas-render2d-targets.cjs.map