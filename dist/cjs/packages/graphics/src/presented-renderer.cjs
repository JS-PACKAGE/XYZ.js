const require_errors = require("./errors.cjs");
//#region dist/packages/graphics/src/presented-renderer.js
var PresentedRenderer = class {
	renderer;
	target;
	canvas;
	context;
	destroyed = !1;
	constructor(e, t) {
		this.renderer = e, this.target = t;
	}
	get backend() {
		return this.renderer.backend;
	}
	get stats() {
		return this.renderer.stats;
	}
	get capabilities() {
		return this.renderer.capabilities;
	}
	get residency() {
		return this.renderer.residency;
	}
	configureResidency(e) {
		this.renderer.configureResidency(e);
	}
	prepareGeometry(e) {
		return this.requireContext(), this.renderer.prepareGeometry(e);
	}
	unloadGeometry(e) {
		this.requireContext(), this.renderer.unloadGeometry(e);
	}
	prepareResource(e, t) {
		return this.requireContext(), this.renderer.prepareResource(e, t);
	}
	retainFrameResources() {
		return this.requireContext(), this.renderer.retainFrameResources();
	}
	async initialize(n) {
		if (this.destroyed || this.canvas) throw new require_errors.GraphicsError(`Presentation renderer cannot be reinitialized.`);
		let r = n.getContext(`2d`, { alpha: !1 });
		if (!r) throw new require_errors.UnsupportedGraphicsError(`Auto rendering requires an unbound canvas with a 2D presentation context.`);
		this.canvas = n, this.context = r;
	}
	beginFrame() {
		this.requireContext(), this.renderer.beginFrame();
	}
	async prepareMaterial(e) {
		return this.requireContext(), this.renderer.prepareMaterial(e);
	}
	async prepareNativePBRMaterial(e) {
		if (this.requireContext(), !this.renderer.prepareNativePBRMaterial) throw new require_errors.UnsupportedGraphicsError(`The selected renderer does not support native physical materials.`);
		return this.renderer.prepareNativePBRMaterial(e);
	}
	async prepareGpuParticles(e) {
		if (this.requireContext(), !this.renderer.prepareGpuParticles) throw new require_errors.UnsupportedGraphicsError(`This renderer does not support GPU particle preparation.`);
		return this.renderer.prepareGpuParticles(e);
	}
	async prepareCompute(e, n) {
		if (this.requireContext(), !this.renderer.prepareCompute) throw new require_errors.UnsupportedGraphicsError(`This renderer does not support compute.`);
		return this.renderer.prepareCompute(e, n);
	}
	uploadCompute(e, n, r) {
		if (this.requireContext(), !this.renderer.uploadCompute) throw new require_errors.UnsupportedGraphicsError(`This renderer does not support compute.`);
		this.renderer.uploadCompute(e, n, r);
	}
	async dispatchCompute(e, n) {
		if (this.requireContext(), !this.renderer.dispatchCompute) throw new require_errors.UnsupportedGraphicsError(`This renderer does not support compute.`);
		return this.renderer.dispatchCompute(e, n);
	}
	async readCompute(e, n) {
		if (this.requireContext(), !this.renderer.readCompute) throw new require_errors.UnsupportedGraphicsError(`This renderer does not support compute.`);
		return this.renderer.readCompute(e, n);
	}
	async prepareRenderGraph(e, n) {
		if (this.requireContext(), !this.renderer.prepareRenderGraph) throw new require_errors.UnsupportedGraphicsError(`This renderer does not support render graphs.`);
		return this.renderer.prepareRenderGraph(e, n);
	}
	async capturePlanarReflection(e, n) {
		if (this.requireContext(), !this.renderer.capturePlanarReflection) throw new require_errors.UnsupportedGraphicsError(`This renderer does not support planar reflection capture.`);
		return this.renderer.capturePlanarReflection(e, n);
	}
	async captureReflectionProbe(e, n, r) {
		if (this.requireContext(), !this.renderer.captureReflectionProbe) throw new require_errors.UnsupportedGraphicsError(`This renderer does not support reflection capture.`);
		return this.renderer.captureReflectionProbe(e, n, r);
	}
	async preparePostProcessor(e) {
		return this.requireContext(), this.renderer.preparePostProcessor(e);
	}
	async captureScene(e, t, n) {
		return this.requireContext(), this.renderer.captureScene(e, t, n);
	}
	createRenderTexture(e) {
		return this.requireContext(), this.renderer.createRenderTexture(e);
	}
	async renderToTexture(e, t, n) {
		return this.requireContext(), this.renderer.renderToTexture(e, t, n);
	}
	async extractPixels(e, t) {
		return this.requireContext(), this.renderer.extractPixels(e, t);
	}
	async generateTexture(e, t) {
		return this.requireContext(), this.renderer.generateTexture(e, t);
	}
	async prepareTextures(e) {
		return this.requireContext(), this.renderer.prepareTextures(e);
	}
	unloadTexture(e) {
		this.requireContext(), this.renderer.unloadTexture(e);
	}
	render(e, t, n, r) {
		this.requireContext(), this.renderer.render(e, t, n, r);
	}
	endFrame() {
		let e = this.requireContext();
		this.renderer.endFrame(), e.globalCompositeOperation = `copy`, e.drawImage(this.target, 0, 0);
	}
	resize(e, t) {
		this.requireContext(), this.renderer.resize(e, t);
		let n = this.canvas;
		n.width !== this.target.width && (n.width = this.target.width), n.height !== this.target.height && (n.height = this.target.height);
	}
	destroy() {
		if (!this.destroyed) {
			this.destroyed = !0, this.context = void 0, this.canvas = void 0;
			try {
				this.renderer.destroy();
			} finally {
				this.target.width = this.target.height = 1;
			}
		}
	}
	requireContext() {
		if (!this.context || this.destroyed) throw new require_errors.GraphicsError(`Presentation renderer is not initialized.`);
		return this.context;
	}
};
//#endregion
exports.PresentedRenderer = PresentedRenderer;

//# sourceMappingURL=presented-renderer.cjs.map