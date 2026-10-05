const require_defaults = require("../../../src/data/defaults.cjs");
const require_errors = require("./errors.cjs");
const require_material2d = require("../../core/src/materials2d/material2d.cjs");
const require_render_texture2d = require("./render-texture2d.cjs");
const require_geometry = require("../../core/src/geometry.cjs");
const require_mesh = require("../../core/src/mesh.cjs");
const require_geometry2d = require("../../core/src/rendering2d/geometry2d.cjs");
const require_particle_layer2d = require("../../core/src/particles2d/particle-layer2d.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_gpu_particles3d = require("../../core/src/gpu-particles3d.cjs");
const require_canvas_sprite_source = require("./canvas-sprite-source.cjs");
const require_environment = require("../../core/src/environment.cjs");
const require_render2d_contract = require("./render2d-contract.cjs");
const require_canvas_render2d = require("./canvas-render2d.cjs");
const require_render_stats = require("./render-stats.cjs");
const require_gpu_timing = require("./gpu-timing.cjs");
const require_canvas_render2d_targets = require("./canvas-render2d-targets.cjs");
const require_residency = require("./residency.cjs");
const require_preparation = require("./preparation.cjs");
//#region dist/packages/graphics/src/canvas2d-renderer.js
var w = 8192;
var T = require_defaults.defaults.clearColor;
var E = `rgba(${Math.round(T.r * 255)}, ${Math.round(T.g * 255)}, ${Math.round(T.b * 255)}, ${T.a})`;
var Canvas2DRenderer = class {
	onError;
	backend = `canvas2d`;
	frameStats = new require_render_stats.FrameStats();
	stats = this.frameStats;
	residency = new require_residency.NativeResidency();
	configureResidency(e) {
		this.residency.configure(e);
	}
	retainFrameResources() {
		return this.requireIdle(), require_preparation.residencyLease([]);
	}
	async prepareGeometry(e) {
		throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native geometry preparation.`);
	}
	unloadGeometry(e) {
		throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native geometry residency.`);
	}
	async prepareResource(r, i = {}) {
		if (i.signal?.throwIfAborted(), r instanceof require_particle_layer2d.ParticleLayer2D) {
			if (this.requireIdle(), r.destroyed) throw new require_errors.GraphicsError(`Cannot prepare a destroyed ParticleLayer2D.`);
			for (let e = 0; e < r.activeCount; e++) this.spriteSource.prepare(r.getSlot(r.activeSlotAt(e)).texture);
			return i.signal?.throwIfAborted(), require_preparation.residencyLease([]);
		}
		if (r instanceof require_geometry.Geometry || r instanceof require_geometry2d.Geometry2D || r instanceof require_mesh.Mesh || r instanceof require_gpu_particles3d.GPUParticleEmitter3D || r instanceof require_environment.EnvironmentMap) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native 3D or mesh preparation.`);
		return r instanceof require_material2d.PostProcessor2D ? await this.preparePostProcessor(r) : r instanceof require_material2d.Material2D || require_native_material3d.isNativeMaterial3D(r) ? await this.prepareMaterial(r) : await this.prepareTextures([r]), i.signal?.throwIfAborted(), require_preparation.residencyLease([]);
	}
	async prepareGpuParticles() {
		throw this.requireIdle(), new require_errors.UnsupportedGraphicsError(`Canvas2D does not support GPU 3D particles.`);
	}
	async prepareCompute() {
		throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support compute.`);
	}
	uploadCompute() {
		throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support compute.`);
	}
	async dispatchCompute() {
		throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support compute.`);
	}
	async readCompute() {
		throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support compute.`);
	}
	async prepareRenderGraph() {
		throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support render graphs.`);
	}
	async captureReflectionProbe() {
		throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support reflection capture.`);
	}
	capabilities = Object.freeze({
		threeD: !1,
		compute: !1,
		customShaders: !1,
		storageBuffers: !1,
		instancing: !1,
		lighting2D: !1,
		textureAnisotropy: Object.freeze({
			maxRequest: 16,
			maxEffective: 1
		}),
		alphaToCoverage: Object.freeze({
			rgba8Samples: 1,
			hdrSamples: 1
		}),
		maxTextureSize: w,
		supportedTextureFormats: Object.freeze([])
	});
	canvas;
	context;
	commands = new require_render2d_contract.RenderCommandBuffer2D();
	spriteSource = new require_canvas_sprite_source.CanvasSpriteSource((e) => (require_render_texture2d.assertRenderTextureOwner2D(e, this), this.targetOperations.canvases.get(e)));
	render2D = new require_canvas_render2d.CanvasRender2D(this.spriteSource, this.frameStats);
	targetOperations = new require_canvas_render2d_targets.CanvasRender2DTargets(this, () => this.requireIdle(), this.render2D, () => !this.destroyed);
	layerCanvas;
	snapshots = /* @__PURE__ */ new Set();
	transitionCanvas;
	transitionContext;
	frameActive = !1;
	frameRendered = !1;
	destroyed = !1;
	onContextLost = () => {
		this.destroyed || (this.destroy(), this.onError(new require_errors.GraphicsError(`Canvas2D rendering context was lost.`)));
	};
	constructor(e, t = {}) {
		this.onError = e, require_gpu_timing.configureGpuTiming(this.frameStats.gpuTiming, t) && this.frameStats.gpuTiming.unavailable(`unsupported`, `Canvas2D exposes no GPU timer queries.`);
	}
	async initialize(e) {
		if (this.destroyed || this.context) throw new require_errors.GraphicsError(`Canvas2D renderer cannot be initialized more than once.`);
		let t = e.getContext(`2d`);
		if (!t) throw new require_errors.Canvas2DInitializationError(`Canvas2D canvas context is unavailable.`);
		this.canvas = e, this.context = t;
		try {
			this.resize(Math.max(e.width, 1), Math.max(e.height, 1)), e.addEventListener(`contextlost`, this.onContextLost);
		} catch (e) {
			throw this.canvas = void 0, this.context = void 0, e;
		}
	}
	beginFrame() {
		if (this.requireContext(), this.frameActive) throw new require_errors.GraphicsError(`Canvas2D beginFrame called before the preceding frame ended.`);
		this.frameActive = !0, this.frameRendered = !1, this.frameStats.begin();
	}
	async prepareMaterial(e) {
		throw this.requireContext(), new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native 2D or 3D materials.`);
	}
	async preparePostProcessor(e) {
		throw this.requireContext(), new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native 2D post processors.`);
	}
	createRenderTexture(e) {
		return this.targetOperations.create(e);
	}
	renderToTexture(e, t, n) {
		return this.targetOperations.render(e, t, n);
	}
	extractPixels(e, t) {
		return this.targetOperations.extract(e, t);
	}
	generateTexture(e, t) {
		return this.targetOperations.generate(e, t);
	}
	async prepareTextures(e) {
		this.requireIdle();
		for (let t of e) this.spriteSource.prepare(t);
	}
	unloadTexture(e) {
		this.requireIdle(), e.kind === `render` ? require_render_texture2d.assertRenderTextureOwner2D(e, this) : this.spriteSource.unload(e);
	}
	requireIdle() {
		if (this.requireContext(), this.frameActive) throw new require_errors.GraphicsError(`Canvas2D target operation cannot run during an active frame.`);
	}
	async captureScene(e, t, n) {
		if (this.requireContext(), this.frameActive) throw new require_errors.GraphicsError(`Canvas2D captureScene cannot run during an active frame.`);
		this.frameActive = !0;
		let r;
		try {
			this.prepareScene(e, t, n), r = document.createElement(`canvas`), this.render2D.resizeCanvas(r, this.canvas.width, this.canvas.height);
			let a = r.getContext(`2d`);
			if (!a) throw new require_errors.Canvas2DInitializationError(`Canvas2D capture context is unavailable.`);
			this.drawFrame(a, r.width, r.height, e, t, n);
			let o = new CanvasRenderSnapshot(this, r, this.snapshots, this.render2D);
			return this.snapshots.add(o), o;
		} catch (e) {
			throw r && this.render2D.releaseCanvas(r), e;
		} finally {
			this.commands.clear(), this.frameActive = !1;
		}
	}
	render(e, t, n, r) {
		let i = this.requireContext();
		if (!this.frameActive || this.frameRendered) throw new require_errors.GraphicsError(`Canvas2D render requires an active frame and may be called only once per frame.`);
		let a = this.canvas, s = t ?? (a.clientWidth || a.width), c = n ?? (a.clientHeight || a.height), l = r?.transition;
		if (l && this.validateTransition(l), this.prepareScene(e, s, c), l) {
			let t = this.requireTransitionContext();
			this.drawFrame(t, a.width, a.height, e, s, c), this.composeTransition(i, l);
		} else this.releaseTransitionTarget(), this.drawFrame(i, a.width, a.height, e, s, c);
		this.frameRendered = !0;
	}
	prepareScene(t, n, r) {
		let i = this.commands;
		if (i.clear(), !t) return;
		if (!Number.isFinite(n) || !Number.isFinite(r) || n <= 0 || r <= 0) throw RangeError(`Canvas2D sprite rendering requires positive finite logical width and height.`);
		if (t.renderGraph) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support render graphs.`);
		if (t.effects2D.length || t.effects3D.length) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support native 2D post processors.`);
		for (let n of t.objects) if (n instanceof require_mesh.Mesh && n.worldVisible) throw new require_errors.GraphicsBackendUnavailableError(`Canvas2D does not support visible 3D meshes.`);
		let o = t.gpuParticleEmitters;
		if (o) {
			for (let e of o) if (e.worldVisible && e.activeCount > 0) throw new require_errors.UnsupportedGraphicsError(`Canvas2D does not support visible GPU 3D particles.`);
		}
		require_render2d_contract.collectRenderCommands2D(t, n, r, i), this.render2D.preflight(i);
	}
	drawFrame(e, t, n, r, i, a) {
		let o = this.commands;
		this.frameStats.pass2D();
		let s = t / i, c = n / a;
		try {
			if (e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = 1, e.globalCompositeOperation = `source-over`, e.fillStyle = E, e.fillRect(0, 0, t, n), this.frameStats.draw2D(), r) {
				let i = this.layerCanvas ??= document.createElement(`canvas`);
				this.render2D.resizeCanvas(i, t, n);
				let a = i.getContext(`2d`);
				a.setTransform(1, 0, 0, 1, 0, 0), a.globalAlpha = 1, a.globalCompositeOperation = `source-over`, a.clearRect(0, 0, t, n), this.render2D.draw(a, o, r, s, c), e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = 1, e.drawImage(i, 0, 0), this.frameStats.draw2D();
			} else {
				let r = Math.min(t, n), i = t / 2, a = n / 2, o = e.createLinearGradient(i, a - r * .35, i, a + r * .3);
				o.addColorStop(0, `rgb(255 77 64)`), o.addColorStop(1, `rgb(70 180 190)`), e.fillStyle = o, e.beginPath(), e.moveTo(i, a - r * .35), e.lineTo(i - r * .35, a + r * .3), e.lineTo(i + r * .35, a + r * .3), e.closePath(), e.fill(), this.frameStats.draw2D();
			}
		} finally {
			o.clear(), this.spriteSource.endFrame();
		}
	}
	validateTransition(e) {
		if (!Number.isFinite(e.progress)) throw RangeError(`Canvas2D transition progress must be finite.`);
		let t = e.snapshot;
		if (t) {
			if (!(t instanceof CanvasRenderSnapshot)) throw new require_errors.GraphicsError(`Canvas2D transition snapshot belongs to another renderer.`);
			t.assertOwner(this);
		}
	}
	requireTransitionContext() {
		if (!this.transitionCanvas) {
			let e = document.createElement(`canvas`);
			this.render2D.resizeCanvas(e, this.canvas.width, this.canvas.height);
			let t = e.getContext(`2d`);
			if (!t) throw this.render2D.releaseCanvas(e), new require_errors.Canvas2DInitializationError(`Canvas2D transition context is unavailable.`);
			this.transitionCanvas = e, this.transitionContext = t;
		}
		return this.transitionContext;
	}
	composeTransition(e, t) {
		let n = this.canvas.width;
		this.frameStats.pass2D();
		let r = this.canvas.height, i = Math.max(0, Math.min(1, t.progress)), a = t.color;
		if (e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = 1, e.globalCompositeOperation = `source-over`, e.clearRect(0, 0, n, r), e.fillStyle = `rgba(${a[0] * 255}, ${a[1] * 255}, ${a[2] * 255}, ${a[3]})`, t.kind === `slide`) {
			let a = t.direction === `left` || t.direction === `right`, o = a ? n : r, s = t.direction === `left` || t.direction === `up` ? -1 : 1, c = s * i * o, l = -s * (1 - i) * o, u = Math.round(s < 0 ? o + c : c), d = a ? s < 0 ? `right` : `left` : s < 0 ? `down` : `up`;
			e.save(), e.beginPath(), a ? e.rect(s < 0 ? 0 : u, 0, s < 0 ? u : n - u, r) : e.rect(0, s < 0 ? 0 : u, n, s < 0 ? u : r - u), e.clip(), this.drawOutgoing(e, t, a ? c : 0, a ? 0 : c, d), e.restore(), e.save(), e.beginPath(), a ? e.rect(s < 0 ? u : 0, 0, s < 0 ? n - u : u, r) : e.rect(0, s < 0 ? u : 0, n, s < 0 ? r - u : u), e.clip(), drawSlidingImage(e, this.transitionCanvas, a ? l : 0, a ? 0 : l, n, r, t.direction, this.frameStats), e.restore();
		} else if (t.kind === `crossfade`) e.globalAlpha = 1 - i, this.drawOutgoing(e, t, 0, 0), e.globalCompositeOperation = `lighter`, e.globalAlpha = i, e.drawImage(this.transitionCanvas, 0, 0), this.frameStats.draw2D();
		else if (i < .5) {
			let a = i * 2;
			e.globalAlpha = 1 - a, this.drawOutgoing(e, t, 0, 0), e.globalCompositeOperation = `lighter`, e.globalAlpha = a, e.fillRect(0, 0, n, r), this.frameStats.draw2D();
		} else {
			let t = i * 2 - 1;
			e.globalAlpha = 1 - t, e.fillRect(0, 0, n, r), this.frameStats.draw2D(), e.globalCompositeOperation = `lighter`, e.globalAlpha = t, e.drawImage(this.transitionCanvas, 0, 0), this.frameStats.draw2D();
		}
		e.globalAlpha = 1, e.globalCompositeOperation = `source-over`;
	}
	drawOutgoing(e, t, n, r, i) {
		let a = this.canvas.width, o = this.canvas.height;
		t.snapshot ? t.snapshot.draw(this, e, n, r, a, o, i) : (e.fillRect(i ? 0 : n, i ? 0 : r, a, o), this.frameStats.draw2D());
	}
	releaseTransitionTarget() {
		this.transitionCanvas && this.render2D.releaseCanvas(this.transitionCanvas), this.transitionCanvas = void 0, this.transitionContext = void 0;
	}
	endFrame() {
		if (this.requireContext(), !this.frameActive || !this.frameRendered) throw new require_errors.GraphicsError(`Canvas2D endFrame requires a rendered frame.`);
		this.frameActive = !1, this.frameStats.submit();
	}
	resize(e, t) {
		if (this.requireContext(), !Number.isFinite(e) || !Number.isFinite(t) || e <= 0 || t <= 0) throw RangeError(`Canvas2D canvas pixel width and height must be positive finite numbers.`);
		let n = Math.max(1, Math.round(e)), r = Math.max(1, Math.round(t));
		if (!Number.isSafeInteger(n) || !Number.isSafeInteger(r) || n > w || r > w) throw new require_errors.GraphicsError(`Canvas2D canvas backing size ${n}×${r} exceeds the maximum of ${w} pixels per side.`);
		let i = this.canvas;
		(i.width !== n || i.height !== r) && this.releaseTransitionTarget(), i.width !== n && (i.width = n), i.height !== r && (i.height = r);
	}
	destroy() {
		if (!this.destroyed) {
			this.destroyed = !0;
			for (let e of this.snapshots) e.destroy();
			this.snapshots.clear(), this.releaseTransitionTarget(), this.canvas?.removeEventListener(`contextlost`, this.onContextLost), this.commands.destroy(), this.spriteSource.destroy(), this.render2D.destroy(), this.targetOperations.destroy(), this.layerCanvas && this.render2D.releaseCanvas(this.layerCanvas), this.layerCanvas = void 0, this.frameActive = !1, this.context = void 0, this.canvas = void 0;
		}
	}
	requireContext() {
		if (this.destroyed || !this.context) throw new require_errors.GraphicsError(`Canvas2D renderer is not initialized or has already been destroyed.`);
		return this.context;
	}
};
var CanvasRenderSnapshot = class {
	engine;
	#e;
	#t;
	#n;
	#r;
	#i;
	constructor(e, t, n, r) {
		this.engine = r, this.#r = e, this.#n = t, this.#e = t.width, this.#t = t.height, this.#i = n, Object.freeze(this);
	}
	get backend() {
		return `canvas2d`;
	}
	get width() {
		return this.#e;
	}
	get height() {
		return this.#t;
	}
	get destroyed() {
		return !this.#n;
	}
	assertOwner(e) {
		if (this.#r !== e) throw new require_errors.GraphicsError(`Canvas2D transition snapshot belongs to another renderer.`);
		if (!this.#n) throw new require_errors.GraphicsError(`Canvas2D transition snapshot has been destroyed.`);
	}
	draw(e, t, n, r, i, a, o) {
		this.assertOwner(e), o ? drawSlidingImage(t, this.#n, n, r, i, a, o, this.engine.stats) : (t.drawImage(this.#n, n, r, i, a), this.engine.stats.draw2D());
	}
	destroy() {
		this.#n && (this.engine.releaseCanvas(this.#n), this.#n = void 0, this.#i.delete(this));
	}
};
function drawSlidingImage(e, t, n, r, i, a, o, s) {
	e.drawImage(t, n, r, i, a), s.draw2D();
	let c = o === `left` || o === `right`, l = o === `right` || o === `down`, u = c ? n : r, d = c ? i : a, f = u + (l ? d : 0), p = Math.round(f);
	if (l ? p <= f : p >= f) return;
	let m = l ? p - 1 : p, h = c ? t.width : t.height, g = Math.max(0, Math.min(h - 1, (m + .5 - u) * h / d - .5));
	c ? (e.clearRect(m, r, 1, a), e.drawImage(t, g, 0, 1, t.height, m, r, 1, a)) : (e.clearRect(n, m, i, 1), e.drawImage(t, 0, g, t.width, 1, n, m, i, 1)), s.draw2D();
}
//#endregion
exports.Canvas2DRenderer = Canvas2DRenderer;

//# sourceMappingURL=canvas2d-renderer.cjs.map