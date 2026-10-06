const require_xr_loop = require("./xr-loop.cjs");
const require_math3d = require("../../math/src/math3d.cjs");
const require_perspective_camera = require("./perspective-camera.cjs");
//#region dist/packages/core/src/xr.js
var XRCamera = class extends require_perspective_camera.PerspectiveCamera {
	projection = new require_math3d.Matrix4();
	xrView = new require_math3d.Matrix4();
	setView(e) {
		this.position.set(e.transform.position.x, e.transform.position.y, e.transform.position.z);
		let t = e.transform.orientation;
		this.rotation.set(t.x, t.y, t.z, t.w), this.projection.elements.set(e.projectionMatrix);
		let n = this.projection.elements;
		for (let e = 0; e < 4; e++) {
			let t = e * 4;
			n[t + 2] = (n[t + 2] + n[t + 3]) * .5;
		}
		this.xrView.elements.set(e.transform.inverse.matrix), this.matrix.copy(this.projection).multiply(this.xrView);
	}
	updateMatrix() {
		return this.matrix;
	}
};
var XRSessionManager = class extends EventTarget {
	game;
	system;
	tick;
	current;
	referenceSpace;
	layer;
	gpuBinding;
	gpuLayer;
	frame;
	requestId;
	pending = !1;
	disposed = !1;
	camera = new XRCamera();
	controls = /* @__PURE__ */ new Set();
	controllerValues = [];
	sourceIds = /* @__PURE__ */ new WeakMap();
	nextSource = 0;
	onEnd = () => this.cleanup();
	onLoss = () => {
		this.end().catch((e) => this.dispatchEvent(new CustomEvent(`error`, { detail: e })));
	};
	onVisibility = () => {
		this.game.clock.suspend(), this.current?.visibilityState === `hidden` && this.clearControls(), this.dispatchEvent(new Event(`visibilitychange`));
	};
	constructor(e, t = globalThis.navigator?.xr) {
		super(), this.game = e, this.system = t;
	}
	get session() {
		return this.current;
	}
	get controllers() {
		return this.controllerValues;
	}
	isSessionSupported(e) {
		return this.system?.isSessionSupported(e) ?? Promise.resolve(!1);
	}
	async requestSession(e, t = {}) {
		if (this.disposed || this.pending || this.current || require_xr_loop.xrLoops.has(this.game)) throw Error(`XR manager is destroyed or a session is already active/pending.`);
		let r = this.game.graphics;
		if (r.backend === `canvas2d`) throw Error(`Canvas2D does not support immersive WebXR.`);
		if (!this.system || !r.initializeXR || !r.renderXRView) throw Error(`WebXR is unsupported by this platform or renderer.`);
		this.pending = !0;
		let i;
		try {
			let a = await r.initializeXR(), o = globalThis;
			if (a.backend === `webgpu` && !o.XRGPUBinding) throw Error(`WebGPU immersive WebXR requires XRGPUBinding.`);
			if (a.backend === `webgl2` && !o.XRWebGLLayer) throw Error(`WebGL immersive WebXR requires XRWebGLLayer.`);
			if (i = await this.system.requestSession(e, {
				requiredFeatures: [.../* @__PURE__ */ new Set([
					`local-floor`,
					...t.requiredFeatures ?? [],
					...a.backend === `webgpu` ? [`layers`] : []
				])],
				optionalFeatures: [...t.optionalFeatures ?? []]
			}), this.referenceSpace = await i.requestReferenceSpace(`local-floor`), this.disposed || this.game.state === `destroyed`) throw Error(`XR owner was destroyed during session request.`);
			a.backend === `webgl2` ? (this.layer = new o.XRWebGLLayer(i, a.context), i.updateRenderState({ baseLayer: this.layer })) : (this.gpuBinding = new o.XRGPUBinding(i, a.device), this.gpuLayer = this.gpuBinding.createProjectionLayer({
				colorFormat: a.format,
				textureUsage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST
			}), i.updateRenderState({ layers: [this.gpuLayer] })), this.current = i, i.addEventListener(`end`, this.onEnd), i.addEventListener(`visibilitychange`, this.onVisibility), this.game.addEventListener(`graphicslost`, this.onLoss);
			let s = this.game.state === `running`;
			return this.game.pause(), require_xr_loop.xrLoops.set(this.game, this), s && this.game.start(), this.requestId = i.requestAnimationFrame(this.onFrame), this.dispatchEvent(new Event(`start`)), i;
		} catch (e) {
			throw i && await i.end(), this.cleanup(), e;
		} finally {
			this.pending = !1;
		}
	}
	async end() {
		if (this.current) {
			let e = this.current;
			try {
				await e.end();
			} finally {
				this.cleanup();
			}
		}
	}
	destroy() {
		if (this.disposed) return;
		this.disposed = !0;
		let e = this.current;
		this.cleanup(), e && e.end().catch((e) => this.dispatchEvent(new CustomEvent(`error`, { detail: e })));
	}
	onFrame = (e, t) => {
		let n = this.current;
		if (n) {
			this.requestId = void 0, this.frame = t;
			try {
				n.visibilityState !== `hidden` && this.game.state === `running` ? (this.updateInput(t, n), this.tick?.(e)) : this.clearControls();
			} finally {
				this.frame = void 0, this.current === n && (this.requestId = n.requestAnimationFrame(this.onFrame));
			}
		}
	};
	render(e) {
		if (!e || !this.frame || !this.referenceSpace) return;
		let t = this.frame.getViewerPose(this.referenceSpace);
		if (!t) return;
		let n = e.camera3D;
		n.position.set(t.transform.position.x, t.transform.position.y, t.transform.position.z);
		let r = t.transform.orientation;
		n.rotation.set(r.x, r.y, r.z, r.w), this.current.updateRenderState({
			depthNear: n.near,
			depthFar: n.far
		}), this.camera.near = n.near, this.camera.far = n.far, e.camera3D = this.camera;
		try {
			for (let n of t.views) if (this.camera.setView(n), this.layer) {
				let t = this.layer.getViewport(n);
				t && this.game.graphics.renderXRView(e, {
					backend: `webgl2`,
					framebuffer: this.layer.framebuffer,
					viewport: t
				});
			} else if (this.gpuBinding && this.gpuLayer) {
				let t = this.gpuBinding.getViewSubImage(this.gpuLayer, n);
				this.game.graphics.renderXRView(e, {
					backend: `webgpu`,
					texture: t.colorTexture,
					viewport: t.viewport,
					imageIndex: t.imageIndex ?? 0
				});
			}
		} finally {
			e.camera3D = n;
		}
	}
	updateInput(e, t) {
		let n = /* @__PURE__ */ new Set();
		this.controllerValues = Array.from(t.inputSources, (t) => {
			let r = this.sourceIds.get(t);
			r === void 0 && (r = this.nextSource++, this.sourceIds.set(t, r));
			let i = `xr.${t.handedness}.${r}`, set = (e, t) => {
				n.add(e), this.controls.add(e), this.game.input.virtual.set(e, t);
			};
			return t.gamepad?.buttons.forEach((e, t) => set(`${i}.button.${t}`, e.value)), t.gamepad?.axes.forEach((e, t) => set(`${i}.axis.${t}`, e)), {
				source: t,
				prefix: i,
				targetRay: e.getPose(t.targetRaySpace, this.referenceSpace)?.transform ?? null,
				grip: t.gripSpace ? e.getPose(t.gripSpace, this.referenceSpace)?.transform ?? null : null
			};
		});
		for (let e of this.controls) n.has(e) || (this.game.input.virtual.set(e, 0), this.controls.delete(e));
	}
	clearControls() {
		for (let e of this.controls) this.game.input.virtual.set(e, 0);
		this.controls.clear(), this.controllerValues = [];
	}
	cleanup() {
		let e = this.current;
		e && this.requestId !== void 0 && e.cancelAnimationFrame(this.requestId), e?.removeEventListener(`end`, this.onEnd), e?.removeEventListener(`visibilitychange`, this.onVisibility), this.game.removeEventListener(`graphicslost`, this.onLoss);
		let t = require_xr_loop.xrLoops.get(this.game) === this;
		if (t && require_xr_loop.xrLoops.delete(this.game), this.clearControls(), this.current = void 0, this.requestId = void 0, this.referenceSpace = void 0, this.layer = void 0, this.gpuBinding = void 0, this.gpuLayer = void 0, t) {
			let e = this.game.state === `running`;
			this.game.pause(), e && !this.disposed && this.game.start(), this.dispatchEvent(new Event(`end`));
		}
	}
};
//#endregion
exports.XRSessionManager = XRSessionManager;

//# sourceMappingURL=xr.cjs.map