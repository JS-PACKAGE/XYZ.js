const require_defaults = require("../../../src/data/defaults.cjs");
const require_errors = require("./errors.cjs");
const require_native_texture = require("../../assets/src/native-texture.cjs");
const require_material2d = require("../../core/src/materials2d/material2d.cjs");
const require_geometry2d = require("../../core/src/rendering2d/geometry2d.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_render2d_contract = require("./render2d-contract.cjs");
const require_render_stats = require("./render-stats.cjs");
const require_gpu_timing = require("./gpu-timing.cjs");
const require_residency = require("./residency.cjs");
const require_preparation = require("./preparation.cjs");
const require_native_texture_upload = require("./native-texture-upload.cjs");
const require_reflection_capture = require("./reflection-capture.cjs");
const require_effects = require("./webgpu-2d/effects.cjs");
const require_webgpu_render2d = require("./webgpu-render2d.cjs");
const require_webgpu_mesh_pipeline = require("./webgpu-mesh-pipeline.cjs");
const require_webgpu_compute = require("./webgpu-compute.cjs");
const require_webgpu_render_graph = require("./webgpu-render-graph.cjs");
//#region dist/packages/graphics/src/webgpu-renderer.js
var WebGPURenderer = class {
	onError;
	antialias;
	backend = `webgpu`;
	frameStats = new require_render_stats.FrameStats();
	gpuTimingEnabled;
	gpuTimer;
	residency = new require_residency.NativeResidency();
	preparedGeometry = /* @__PURE__ */ new Set();
	probeCaptures = new require_reflection_capture.ProbeCaptureScheduler();
	probeCaptureActive = !1;
	compute;
	graphs;
	async prepareCompute(e, t) {
		return this.requireDevice(), this.compute.prepare(e, t);
	}
	uploadCompute(e, t, n) {
		this.requireDevice(), this.compute.upload(e, t, n);
	}
	async dispatchCompute(e, t) {
		return this.requireDevice(), this.compute.dispatch(e, t);
	}
	async readCompute(e, t) {
		return this.requireDevice(), this.compute.read(e, t);
	}
	async prepareRenderGraph(e, t) {
		return this.requireDevice(), this.graphs.prepare(e, t);
	}
	async captureReflectionProbe(e, t, n = {}) {
		if (this.requireDevice(), this.probeCaptureActive || this.encoder && this.frameRendered) throw new require_errors.GraphicsError(`Capture requires an idle capture slot and must precede rendering or follow endFrame.`);
		this.probeCaptureActive = !0;
		try {
			let r = await this.meshPipeline.captureReflectionProbe(e, t, n);
			try {
				return this.requireDevice(), r;
			} catch (e) {
				throw r.destroy(), e;
			}
		} finally {
			this.probeCaptureActive = !1;
		}
	}
	configureResidency(e) {
		if (this.encoder) throw new require_errors.GraphicsError(`Cannot change residency budgets during an active frame.`);
		this.residency.configure(e);
	}
	retainFrameResources() {
		return this.requireDevice(), require_preparation.residencyLease(this.residency.retainFrameResources());
	}
	async prepareGeometry(e) {
		let t = this.requireDevice();
		if (this.encoder) throw new require_errors.GraphicsError(`Cannot prepare geometry during an active frame.`);
		let n = e instanceof require_geometry2d.Geometry2D ? this.render2D.prepareGeometry(e) : this.meshPipeline.prepareGeometry(e);
		this.preparedGeometry.has(n) || (n.retain(), this.preparedGeometry.add(n)), await t.queue.onSubmittedWorkDone(), this.requireDevice();
	}
	unloadGeometry(e) {
		if (this.requireDevice(), this.encoder) throw new require_errors.GraphicsError(`Cannot unload geometry during an active frame.`);
		e instanceof require_geometry2d.Geometry2D ? this.render2D.unloadGeometry(e) : this.meshPipeline.unloadGeometry(e);
		for (let e of this.preparedGeometry) e.destroyed && this.preparedGeometry.delete(e);
	}
	async prepareResource(e, t) {
		let n = this.requireDevice();
		if (this.encoder) throw new require_errors.GraphicsError(`Cannot prepare resources during an active frame.`);
		return require_preparation.prepareNativeResource(this.residency, e, {
			texture: (e) => {
				e.kind === `render` ? this.render2D.source(e) : this.cacheTexture(n, e);
			},
			geometry: (e) => {
				e instanceof require_geometry2d.Geometry2D ? this.render2D.prepareGeometry(e) : this.meshPipeline.prepareGeometry(e);
			},
			mesh: (e) => this.meshPipeline.prepareMesh(e),
			particles: (e) => {
				this.render2D.prepareParticles(e);
				for (let t = 0; t < e.activeCount; t++) {
					let r = e.getSlot(e.activeSlotAt(t)).texture;
					r.kind === `render` ? this.render2D.source(r) : this.cacheTexture(n, r);
				}
			},
			environment: (e) => this.meshPipeline.prepareEnvironment(e),
			material: (e) => this.prepareMaterial(e),
			gpuParticles: (e) => this.prepareGpuParticles(e),
			post: (e) => this.preparePostProcessor(e),
			complete: async () => {
				await n.queue.onSubmittedWorkDone(), this.requireDevice();
			}
		}, t);
	}
	get stats() {
		return this.frameStats;
	}
	capabilities = {
		threeD: !0,
		compute: !0,
		customShaders: !0,
		lighting2D: !0,
		storageBuffers: !0,
		instancing: !0,
		maxTextureSize: 0,
		supportedTextureFormats: []
	};
	canvas;
	context;
	device;
	pipeline;
	render2D;
	effectsPipeline;
	captureOutput;
	meshPipeline;
	commands = new require_render2d_contract.RenderCommandBuffer2D();
	textures = /* @__PURE__ */ new Map();
	textureFrame = 0;
	encoder;
	colorAttachment = {
		loadOp: `clear`,
		storeOp: `store`,
		clearValue: require_defaults.defaults.clearColor
	};
	renderPassDescriptor = { colorAttachments: [this.colorAttachment] };
	submissions = [];
	viewportX = 0;
	viewportY = 0;
	viewportSide = 1;
	frameRendered = !1;
	configured = !1;
	initializing = !1;
	destroyed = !1;
	lostError;
	render2DHooks = {
		owner: this,
		residency: this.residency,
		get stats() {
			return this.owner.frameStats;
		},
		upload: (e) => {
			let t = this.cacheTexture(this.requireDevice(), e);
			return t.seen = this.textureFrame, t.resource;
		},
		assertIdle: () => {
			if (this.requireDevice(), this.encoder) throw new require_errors.GraphicsError(`WebGPU offscreen APIs cannot run during an active frame.`);
		},
		assertAlive: () => {
			this.requireDevice();
		}
	};
	constructor(e, t = !0, n = {}) {
		this.onError = e, this.antialias = t, this.gpuTimingEnabled = require_gpu_timing.configureGpuTiming(this.frameStats.gpuTiming, n);
	}
	async initialize(e) {
		if (this.destroyed || this.device || this.initializing) throw new require_errors.GraphicsError(`WebGPU renderer cannot be initialized more than once.`);
		this.initializing = !0;
		try {
			if (typeof navigator > `u` || !navigator.gpu) throw new require_errors.WebGPUNotSupportedError(`WebGPU is unavailable: this browser or security context does not expose navigator.gpu.`);
			let t = await navigator.gpu.requestAdapter();
			if (this.destroyed) throw new require_errors.GraphicsError(`WebGPU renderer was destroyed during initialization.`);
			if (!t) throw new require_errors.WebGPUNotSupportedError(`WebGPU is unavailable: the browser could not provide a GPU adapter.`);
			let n = require_native_texture_upload.compressionFeatures.filter((e) => t.features.has(e));
			this.gpuTimingEnabled && (t.features.has(`timestamp-query`) ? n.push(`timestamp-query`) : this.frameStats.gpuTiming.unavailable(`unsupported`, `WebGPU adapter does not expose timestamp-query.`));
			let i = await t.requestDevice({ requiredFeatures: n });
			if (this.destroyed) throw i.destroy(), new require_errors.GraphicsError(`WebGPU renderer was destroyed during initialization.`);
			this.device = i, this.gpuTimingEnabled && i.features.has(`timestamp-query`) && (this.gpuTimer = new require_gpu_timing.WebGpuTimer(this.frameStats.gpuTiming, i)), this.capabilities.maxTextureSize = i.limits.maxTextureDimension2D, this.capabilities.supportedTextureFormats = require_native_texture_upload.webgpuTextureFormats(i), i.lost.then((e) => {
				if (this.destroyed) return;
				let t = new require_errors.WebGPUDeviceLostError(`WebGPU device lost (${e.reason}): ${e.message || `the GPU or driver became unavailable`}.`), n = this.pipeline !== void 0;
				this.lostError = t, this.releaseResources(), n && this.onError(t);
			}), i.addEventListener(`uncapturederror`, (e) => {
				this.destroyed || this.onError(new require_errors.GraphicsError(`WebGPU uncaptured error: ${e.error.message}`, { cause: e.error }));
			});
			let a = e.getContext(`webgpu`);
			if (!a) throw new require_errors.WebGPUInitializationError(`WebGPU canvas context is unavailable: canvas.getContext("webgpu") returned null.`);
			this.context = a, this.canvas = e, this.resize(Math.max(e.width, 1), Math.max(e.height, 1));
			let o = navigator.gpu.getPreferredCanvasFormat();
			this.compute = new require_webgpu_compute.WebGPUCompute(i), this.graphs = new require_webgpu_render_graph.WebGPURenderGraph(i, o), i.pushErrorScope(`validation`);
			let l = [], h, g, v = null;
			try {
				a.configure({
					device: i,
					format: o,
					alphaMode: `opaque`
				}), this.configured = !0;
				let e = i.createShaderModule({ code: `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
};

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(0.0, 0.7),
    vec2f(-0.7, -0.6),
    vec2f(0.7, -0.6),
  );
  var colors = array<vec3f, 3>(
    vec3f(1.0, 0.3, 0.25),
    vec3f(0.25, 0.9, 0.5),
    vec3f(0.3, 0.5, 1.0),
  );
  var output: VertexOutput;
  output.position = vec4f(positions[index], 0.0, 1.0);
  output.color = colors[index];
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
` }), t = await e.getCompilationInfo();
				if (this.destroyed) throw new require_errors.GraphicsError(`WebGPU renderer was destroyed during initialization.`);
				if (l = t.messages.filter((e) => e.type === `error`).map((e) => `${e.lineNum}:${e.linePos} ${e.message}`), l.length === 0) {
					h = i.createRenderPipeline({
						layout: `auto`,
						vertex: {
							module: e,
							entryPoint: `vertexMain`
						},
						fragment: {
							module: e,
							entryPoint: `fragmentMain`,
							targets: [{ format: o }]
						},
						primitive: { topology: `triangle-list` }
					});
					let t = new require_effects.WebGPU2DEffects(i, o, () => this.destroyed || !!this.lostError, () => this.frameStats, () => !!this.encoder);
					this.effectsPipeline = t, await t.initialize(), this.render2D = await require_webgpu_render2d.WebGPURender2D.create(i, t, this.render2DHooks), g = await require_webgpu_mesh_pipeline.WebGPUMeshPipeline.initialize(i, o, () => this.destroyed, this.antialias ? 4 : 1, this.frameStats, this.residency);
				}
			} finally {
				v = await i.popErrorScope();
			}
			if (this.destroyed) throw new require_errors.GraphicsError(`WebGPU renderer was destroyed during initialization.`);
			if (l.length) throw new require_errors.WebGPUInitializationError(`WebGPU shader compilation failed: ${l.join(`; `)}`);
			if (v) throw new require_errors.WebGPUInitializationError(`WebGPU canvas/shader/pipeline validation failed: ${v.message}`, { cause: v });
			if (this.lostError) throw this.lostError;
			this.pipeline = h, this.meshPipeline = g;
		} catch (e) {
			let t = this.destroyed;
			throw this.destroy(), t && !(e instanceof require_errors.GraphicsError) ? new require_errors.GraphicsError(`WebGPU renderer was destroyed during initialization.`, { cause: e }) : e instanceof require_errors.GraphicsError ? e : new require_errors.WebGPUInitializationError(`WebGPU initialization failed while requesting a device or configuring the canvas and triangle pipeline${e instanceof Error ? `: ${e.message}` : `.`}`, { cause: e });
		} finally {
			this.initializing = !1;
		}
	}
	async prepareMaterial(t) {
		if (this.requireDevice(), t instanceof require_native_material3d.NativeMaterial3D) {
			await this.meshPipeline.prepareMaterial(t);
			return;
		}
		if (!(t instanceof require_material2d.Material2D)) throw new require_errors.GraphicsError(`WebGPU prepareMaterial requires a Material2D or NativeMaterial3D.`);
		await this.effectsPipeline.prepare(t);
	}
	async prepareGpuParticles(e) {
		this.requireDevice(), this.meshPipeline.prepareGpuParticles(e);
	}
	async preparePostProcessor(e) {
		if (this.requireDevice(), !(e instanceof require_material2d.PostProcessor2D)) throw new require_errors.GraphicsError(`WebGPU preparePostProcessor requires a PostProcessor2D.`);
		await this.effectsPipeline.prepare(e);
	}
	createRenderTexture(e) {
		return this.requireDevice(), this.render2D.createRenderTexture(e);
	}
	async renderToTexture(e, t, n) {
		return this.render2DHooks.assertIdle(), this.render2D.renderToTexture(e, t, n);
	}
	async extractPixels(e, t) {
		return this.requireDevice(), this.render2D.extractPixels(e, t);
	}
	async generateTexture(e, t) {
		return this.render2DHooks.assertIdle(), this.render2D.generateTexture(e, t);
	}
	async prepareTextures(e) {
		let t = this.requireDevice();
		if (this.encoder) throw new require_errors.GraphicsError(`Cannot prepare textures during an active frame.`);
		for (let n of e) if (n.kind === `render`) this.render2D.source(n);
		else {
			let e = this.cacheTexture(t, n);
			e.prepared || e.allocation.retain(), e.prepared = !0, e.seen = this.textureFrame;
		}
		await t.queue.onSubmittedWorkDone(), this.requireDevice();
	}
	unloadTexture(e) {
		if (this.requireDevice(), this.encoder) throw new require_errors.GraphicsError(`Cannot unload textures during an active frame.`);
		if (e.kind === `render`) throw this.render2D.source(e), new require_errors.GraphicsError(`Renderer-owned render targets must be destroyed rather than unloaded.`);
		let t = this.textures.get(e);
		t && t.allocation.destroy(), this.meshPipeline.unloadTexture(e);
	}
	async captureScene(e, t, n) {
		if (this.requireDevice(), this.encoder) throw new require_errors.GraphicsError(`WebGPU captureScene cannot nest an active frame.`);
		let r = this.effectsPipeline.target(this.canvas.width, this.canvas.height);
		this.captureOutput = r;
		try {
			this.beginFrame(), this.render(e, t, n), this.endFrame(!1);
			let i = new require_effects.GPUSnapshot(this.effectsPipeline, r);
			return this.effectsPipeline.snapshots.add(i), i;
		} catch (e) {
			throw this.gpuTimer?.abort(), this.encoder = void 0, this.residency.abortFrame(), this.effectsPipeline.destroyTexture(r.texture), e;
		} finally {
			this.captureOutput = void 0;
		}
	}
	beginFrame() {
		let e = this.requireDevice();
		if (this.encoder) throw new require_errors.GraphicsError(`WebGPU beginFrame called before the preceding frame ended.`);
		this.encoder = e.createCommandEncoder(), this.residency.beginFrame(), this.frameStats.begin(), this.gpuTimer?.begin(this.encoder, this.frameStats.frame), this.frameRendered = !1;
	}
	render(e, n, r, i) {
		this.requireDevice();
		let a = this.encoder, o = this.context, s = this.pipeline;
		if (!a || !o || !s || this.frameRendered) throw new require_errors.GraphicsError(`WebGPU render requires an active frame and may be called only once per frame.`);
		let c = this.canvas, d = n ?? (c.clientWidth || c.width), f = r ?? (c.clientHeight || c.height);
		if (!Number.isFinite(d) || !Number.isFinite(f) || d <= 0 || f <= 0) throw RangeError(`WebGPU rendering requires positive finite logical width and height.`);
		e?.has3DContent && this.probeCaptures.schedule(e, (t) => this.captureReflectionProbe(e, t), (e) => this.onError(e instanceof require_errors.GraphicsError ? e : new require_errors.GraphicsError(`Automatic reflection capture failed.`, { cause: e })));
		let p = this.effectsPipeline, m = i?.transition;
		m?.snapshot && p.snapshot(m.snapshot);
		let h = e?.effects2D, g = !!h?.length, _ = e?.effects3D, y = !!_?.length;
		(g || y || m) && p.settings(d, f, m), e ? (require_render2d_contract.collectRenderCommands2D(e, d, f, this.commands), this.textureFrame++, this.render2D.preflight(this.commands, e, d, f, Math.max(c.width / d, c.height / f))) : (this.commands.clear(), this.textureFrame++);
		let b = !!e && (this.commands.items.length > 0 || g);
		!b && !y && p.releaseLayers(), y || p.releaseScene(), m || p.releaseFrame();
		let x = m ? p.frame(c.width, c.height) : void 0, S = this.captureOutput ? void 0 : o.getCurrentTexture().createView(), C = this.captureOutput?.view ?? x?.view ?? S, w = e?.renderGraph, T = w ? this.graphs.sceneTarget(w, c.width, c.height) : C;
		this.colorAttachment.view = T;
		try {
			let n;
			if (y) {
				let r = p.layers(c.width, c.height), i = p.scene3D(c.width, c.height);
				n = this.meshPipeline.render(e, a, i.view, c.width, c.height, d / f, require_defaults.defaults.clearColor, f), n || (this.colorAttachment.view = i.view, this.colorAttachment.loadOp = `clear`, require_gpu_timing.beginTimedRenderPass(a, this.renderPassDescriptor).end(), this.frameStats.pass2D(), this.colorAttachment.view = T), p.composite(a, p.process(a, r, _, i), T, !0), n = !0;
			} else n = this.meshPipeline.render(e, a, T, c.width, c.height, d / f, require_defaults.defaults.clearColor, f);
			if (b) {
				n || (this.colorAttachment.loadOp = `clear`, require_gpu_timing.beginTimedRenderPass(a, this.renderPassDescriptor).end(), this.frameStats.pass2D());
				let r = p.layers(c.width, c.height);
				this.render2D.draw(this.commands, e, a, r[0], d, f), p.composite(a, g ? p.process(a, r, h) : r[0], T);
			} else if (!n || !e) {
				this.colorAttachment.loadOp = n ? `load` : `clear`;
				let r = require_gpu_timing.beginTimedRenderPass(a, this.renderPassDescriptor);
				this.frameStats.pass2D(), e ? r.setViewport(0, 0, c.width, c.height, 0, 1) : (r.setViewport(this.viewportX, this.viewportY, this.viewportSide, this.viewportSide, 0, 1), r.setPipeline(s), r.draw(3), this.frameStats.draw2D()), r.end();
			}
			w && this.graphs.encode(w, a, C), m && p.transition(a, x, S, m), this.frameRendered = !0;
		} finally {
			this.frameRendered || this.meshPipeline.invalidateTemporalHistory(), this.colorAttachment.view = void 0, this.colorAttachment.loadOp = `clear`, this.colorAttachment.clearValue = require_defaults.defaults.clearColor;
		}
	}
	endFrame(e = !0) {
		let t = this.requireDevice();
		if (!this.encoder || !this.frameRendered) throw new require_errors.GraphicsError(`WebGPU endFrame requires a rendered frame.`);
		this.gpuTimer?.end(this.encoder);
		let n = this.encoder.finish();
		this.encoder = void 0, this.submissions.push(n);
		let r = !1;
		try {
			t.queue.submit(this.submissions), this.meshPipeline?.afterSubmit(), r = !0, this.gpuTimer?.submitted();
		} finally {
			this.submissions.length = 0, r || this.gpuTimer?.abort(), this.render2D?.flushRetired(), this.releaseUnusedTextures(), r && e ? this.residency.endFrame() : this.residency.abortFrame(), this.frameStats.submit();
		}
	}
	resize(e, t) {
		if (this.lostError) throw this.lostError;
		let n = this.canvas, r = this.device;
		if (!n || !r || this.destroyed) throw new require_errors.GraphicsError(`WebGPU resize requires an initialized renderer.`);
		if (!Number.isFinite(e) || !Number.isFinite(t) || e < 0 || t < 0) throw RangeError(`WebGPU canvas pixel width and height must be finite, nonnegative numbers.`);
		let i = Math.max(1, Math.round(e)), a = Math.max(1, Math.round(t)), o = r.limits.maxTextureDimension2D;
		if (!Number.isSafeInteger(i) || !Number.isSafeInteger(a) || i > o || a > o) throw new require_errors.GraphicsError(`WebGPU canvas backing size ${i}×${a} exceeds this device's maximum texture dimension of ${o} pixels per side. Reduce the canvas size or pixel ratio.`);
		let s = n.width !== i || n.height !== a;
		n.width !== i && (n.width = i), n.height !== a && (n.height = a);
		let c = Math.min(i, a);
		this.viewportX = (i - c) / 2, this.viewportY = (a - c) / 2, this.viewportSide = c, this.meshPipeline?.resize(i, a), s && this.effectsPipeline?.resize();
	}
	cacheTexture(e, t) {
		if (t.destroyed) throw new require_errors.GraphicsError(`Cannot upload a destroyed texture.`);
		let r = this.textures.get(t);
		if (r?.version === t.version) return r.allocation.touch(), r;
		let { width: s, height: c } = t, l = e.limits.maxTextureDimension2D;
		if (!Number.isSafeInteger(s) || !Number.isSafeInteger(c) || s < 1 || c < 1 || s > l || c > l) throw new require_errors.GraphicsError(`WebGPU texture size ${s}×${c} exceeds this device's maximum texture dimension of ${l} pixels per side.`);
		let d = t instanceof require_native_texture.NativeTexture2D;
		d && require_native_texture_upload.validateNativeWebGPU(e, t);
		let f = d ? t.byteLength : s * c * 4, p = r?.allocation ?? this.residency.textures.allocate(f, () => {
			this.textures.get(t)?.resource.destroy(), this.textures.delete(t);
		});
		r && p.resize(f);
		let m = !!r && r.width === s && r.height === c, h;
		try {
			r && !m && r.resource.destroy(), h = m ? r.resource : e.createTexture({
				size: [s, c],
				mipLevelCount: d ? t.levels.length : 1,
				format: d ? require_native_texture_upload.nativeUploadFormat(t.format) : `rgba8unorm`,
				usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | (d ? 0 : GPUTextureUsage.RENDER_ATTACHMENT)
			}), d ? require_native_texture_upload.uploadNativeWebGPU(e, h, t) : e.queue.copyExternalImageToTexture({ source: t.image }, {
				texture: h,
				premultipliedAlpha: !0
			}, [s, c]), this.frameStats.upload(f);
		} catch (e) {
			throw m || (h?.destroy(), p.destroy()), e;
		}
		let g = r ?? {
			resource: h,
			allocation: p,
			width: s,
			height: c,
			seen: this.textureFrame,
			version: t.version,
			prepared: !1
		};
		return g.resource = h, g.width = s, g.height = c, g.version = t.version, this.textures.set(t, g), g;
	}
	releaseUnusedTextures() {
		for (let [e, t] of this.textures) (e.destroyed || this.residency.textures.budgetBytes === 1 / 0 && !t.allocation.references && t.seen !== this.textureFrame) && t.allocation.destroy();
	}
	releaseResources() {
		this.compute?.destroy(), this.compute = void 0, this.graphs?.destroy(), this.graphs = void 0, this.gpuTimer?.destroy(!!this.lostError), this.gpuTimer = void 0, this.encoder = void 0, this.colorAttachment.view = void 0, this.submissions.length = 0, this.residency.clear(), this.preparedGeometry.clear(), this.effectsPipeline?.destroy(), this.effectsPipeline = void 0, this.render2D?.destroy(), this.render2D = void 0, this.captureOutput = void 0, this.meshPipeline?.destroy(), this.meshPipeline = void 0, this.commands.destroy();
		for (let e of this.textures.values()) e.resource.destroy();
		this.textures.clear(), this.pipeline = void 0;
	}
	destroy() {
		if (this.destroyed) return;
		this.destroyed = !0;
		let e = this.context, t = this.device;
		this.releaseResources(), this.context = void 0, this.canvas = void 0, this.device = void 0;
		try {
			this.configured && e?.unconfigure();
		} finally {
			t?.destroy();
		}
	}
	requireDevice() {
		if (this.lostError) throw this.lostError;
		if (this.destroyed || !this.device || !this.pipeline) throw new require_errors.GraphicsError(`WebGPU renderer is not initialized or has already been destroyed.`);
		return this.device;
	}
};
//#endregion
exports.WebGPURenderer = WebGPURenderer;

//# sourceMappingURL=webgpu-renderer.cjs.map