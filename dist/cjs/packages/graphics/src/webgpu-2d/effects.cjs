const require_errors = require("../errors.cjs");
const require_material2d = require("../../../core/src/materials2d/material2d.cjs");
const require_sprite_instance = require("../sprite-instance.cjs");
const require_gpu_timing = require("../gpu-timing.cjs");
const require_shaders = require("./shaders.cjs");
const require_webgpu_render2d_shaders = require("../webgpu-render2d-shaders.cjs");
//#region dist/packages/graphics/src/webgpu-2d/effects.js
var premultipliedBlend = {
	color: {
		srcFactor: `one`,
		dstFactor: `one-minus-src-alpha`,
		operation: `add`
	},
	alpha: {
		srcFactor: `one`,
		dstFactor: `one-minus-src-alpha`,
		operation: `add`
	}
};
function createQuadPipeline(e, t, n, r = premultipliedBlend) {
	return e.createRenderPipeline({
		layout: n,
		vertex: {
			module: t,
			entryPoint: `vertexMain`,
			buffers: [{
				arrayStride: require_sprite_instance.QUAD_BYTES,
				stepMode: `instance`,
				attributes: Array.from({ length: 9 }, (e, t) => ({
					shaderLocation: t,
					offset: t * 16,
					format: `float32x4`
				}))
			}]
		},
		fragment: {
			module: t,
			entryPoint: `fragmentMain`,
			targets: [{
				format: `rgba8unorm`,
				...r ? { blend: r } : {}
			}]
		},
		primitive: { topology: `triangle-list` }
	});
}
var GPUSnapshot = class {
	owner;
	target;
	backend = `webgpu`;
	disposed = !1;
	constructor(e, t) {
		this.owner = e, this.target = t;
	}
	get width() {
		return this.target.width;
	}
	get height() {
		return this.target.height;
	}
	get destroyed() {
		return this.disposed;
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.owner.destroyTexture(this.target.texture), this.owner.snapshots.delete(this));
	}
};
var WebGPU2DEffects = class {
	device;
	format;
	cancelled;
	stats;
	recording;
	snapshots = /* @__PURE__ */ new Set();
	drawLayout;
	spriteTextureLayout;
	uniformLayout;
	quadLayout;
	multiplyLayout;
	defaultUniforms;
	textureLayout;
	transitionTextureLayout;
	fullscreenLayout;
	transitionLayout;
	sampler;
	frameBuffer;
	frameBindGroup;
	frameValues = /* @__PURE__ */ new Float32Array(16);
	uploadedFrameValues = (/* @__PURE__ */ new Float32Array(16)).fill(NaN);
	materials = /* @__PURE__ */ new Map();
	processors = /* @__PURE__ */ new Map();
	pending = /* @__PURE__ */ new Map();
	preparation = Promise.resolve();
	compositePipeline;
	transitionPipeline;
	frameTarget;
	sceneTarget;
	layerTargets;
	transitionBindGroup;
	transitionIncoming;
	transitionOutgoing;
	disposed = !1;
	targetBytes = /* @__PURE__ */ new WeakMap();
	retiredBuffers = [];
	retiredTextures = [];
	attachment = {
		loadOp: `clear`,
		storeOp: `store`,
		clearValue: {
			r: 0,
			g: 0,
			b: 0,
			a: 0
		}
	};
	passDescriptor = { colorAttachments: [this.attachment] };
	constructor(e, t, n, r, i) {
		this.device = e, this.format = t, this.cancelled = n, this.stats = r, this.recording = i, this.drawLayout = e.createBindGroupLayout({ entries: [{
			binding: 0,
			visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
			buffer: {
				type: `uniform`,
				hasDynamicOffset: !0,
				minBindingSize: 512
			}
		}] }), this.spriteTextureLayout = e.createBindGroupLayout({ entries: [{
			binding: 0,
			visibility: GPUShaderStage.FRAGMENT,
			texture: { sampleType: `float` }
		}, {
			binding: 1,
			visibility: GPUShaderStage.FRAGMENT,
			sampler: { type: `filtering` }
		}] }), this.uniformLayout = e.createBindGroupLayout({ entries: [{
			binding: 0,
			visibility: GPUShaderStage.FRAGMENT,
			buffer: {
				type: `uniform`,
				minBindingSize: 64
			}
		}] }), this.quadLayout = e.createPipelineLayout({ bindGroupLayouts: [
			this.drawLayout,
			this.spriteTextureLayout,
			this.uniformLayout
		] }), this.multiplyLayout = e.createPipelineLayout({ bindGroupLayouts: [
			this.drawLayout,
			this.spriteTextureLayout,
			this.uniformLayout,
			this.spriteTextureLayout
		] }), this.textureLayout = this.spriteTextureLayout, this.transitionTextureLayout = e.createBindGroupLayout({ entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				texture: { sampleType: `float` }
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: { type: `filtering` }
			},
			{
				binding: 2,
				visibility: GPUShaderStage.FRAGMENT,
				texture: { sampleType: `float` }
			}
		] });
		let a = e.createBindGroupLayout({ entries: [{
			binding: 0,
			visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
			buffer: {
				type: `uniform`,
				minBindingSize: 64
			}
		}] });
		this.fullscreenLayout = e.createPipelineLayout({ bindGroupLayouts: [
			this.textureLayout,
			this.uniformLayout,
			a
		] }), this.transitionLayout = e.createPipelineLayout({ bindGroupLayouts: [
			this.transitionTextureLayout,
			this.uniformLayout,
			a
		] }), this.sampler = e.createSampler({
			minFilter: `linear`,
			magFilter: `linear`
		}), this.frameBuffer = e.createBuffer({
			size: 64,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), this.frameBindGroup = e.createBindGroup({
			layout: a,
			entries: [{
				binding: 0,
				resource: { buffer: this.frameBuffer }
			}]
		}), this.defaultUniforms = e.createBindGroup({
			layout: this.uniformLayout,
			entries: [{
				binding: 0,
				resource: { buffer: this.frameBuffer }
			}]
		});
	}
	async initialize() {
		let e = await this.module(require_shaders.postWGSL(), `2D composition`), t = await this.module(require_shaders.transitionWGSL, `transition`);
		this.compositePipeline = this.fullscreenPipeline(e, this.format, this.fullscreenLayout, !0), this.transitionPipeline = this.fullscreenPipeline(t, this.format, this.transitionLayout, !1);
	}
	async module(e, t) {
		if (this.disposed || this.cancelled()) throw new require_errors.GraphicsError(`WebGPU ${t} preparation requires an active renderer.`);
		let n = this.device.createShaderModule({ code: e }), r = await n.getCompilationInfo();
		if (this.disposed || this.cancelled()) throw new require_errors.GraphicsError(`WebGPU ${t} preparation was cancelled by renderer teardown.`);
		let a = r.messages.filter((e) => e.type === `error`);
		if (a.length) throw new require_errors.GraphicsError(`WebGPU ${t} compilation failed: ${a.map((e) => `${e.lineNum}:${e.linePos} ${e.message}`).join(`; `)}`);
		return n;
	}
	fullscreenPipeline(e, t, n, r) {
		return this.device.createRenderPipeline({
			layout: n,
			vertex: {
				module: e,
				entryPoint: `vertexMain`
			},
			fragment: {
				module: e,
				entryPoint: `fragmentMain`,
				targets: [{
					format: t,
					...r ? { blend: premultipliedBlend } : {}
				}]
			},
			primitive: { topology: `triangle-list` }
		});
	}
	prepare(e) {
		if (require_material2d.validateEffect2D(e), this.disposed || this.cancelled()) return Promise.reject(new require_errors.GraphicsError(`WebGPU 2D preparation requires an active renderer.`));
		let n = e instanceof require_material2d.Material2D ? this.materials : this.processors;
		if (n.has(e)) return Promise.resolve();
		let a = this.pending.get(e);
		if (a) return a;
		let c = this.preparation.then(async () => {
			require_material2d.validateEffect2D(e), this.device.pushErrorScope(`validation`);
			let a, c, l = !0;
			try {
				let u = e instanceof require_material2d.Material2D, d = await this.module(u ? require_webgpu_render2d_shaders.quadWGSL(e.wgsl) : require_shaders.postWGSL(e.wgsl), u ? `Sprite material` : `2D postprocessor`);
				require_material2d.validateEffect2D(e);
				let f = u ? createQuadPipeline(this.device, d, this.quadLayout) : this.fullscreenPipeline(d, `rgba8unorm`, this.fullscreenLayout, !1);
				c = this.device.createBuffer({
					size: 64,
					usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
				});
				let p = this.device.createBindGroup({
					layout: this.uniformLayout,
					entries: [{
						binding: 0,
						resource: { buffer: c }
					}]
				}), m = c, dispose = () => {
					!this.disposed && this.recording() ? this.retiredBuffers.push(m) : m.destroy(), n.delete(e), e.removeEventListener(`destroy`, dispose);
				};
				a = {
					layer: f,
					buffer: c,
					bindGroup: p,
					values: (/* @__PURE__ */ new Float32Array(16)).fill(NaN),
					dispose
				}, l = !1;
				let h = await this.device.popErrorScope();
				if (h) throw new require_errors.GraphicsError(`WebGPU 2D effect pipeline validation failed: ${h.message}`);
				if (this.disposed || this.cancelled()) throw new require_errors.GraphicsError(`WebGPU 2D effect preparation was cancelled.`);
				require_material2d.validateEffect2D(e), n.set(e, a), e.addEventListener(`destroy`, dispose, { once: !0 });
			} catch (e) {
				throw c?.destroy(), e;
			} finally {
				l && await this.device.popErrorScope();
			}
		});
		this.preparation = c.catch(() => {});
		let l = c.finally(() => this.pending.delete(e));
		return this.pending.set(e, l), l;
	}
	prepared(e) {
		require_material2d.validateEffect2D(e);
		let n = e instanceof require_material2d.Material2D ? this.materials.get(e) : this.processors.get(e);
		if (!n) throw new require_errors.GraphicsError(`WebGPU 2D effects must be prepared before rendering.`);
		let a = !1;
		for (let t = 0; t < 16; t++) if (n.values[t] !== e.uniforms[t]) {
			a = !0;
			break;
		}
		return a && (n.values.set(e.uniforms), this.device.queue.writeBuffer(n.buffer, 0, n.values), this.stats().upload(n.values.byteLength)), n;
	}
	material(e) {
		if (!(e instanceof require_material2d.Material2D)) throw new require_errors.GraphicsError(`Sprite.material must be a Material2D.`);
		return this.prepared(e);
	}
	validate(e) {
		this.prepared(e);
	}
	target(e, t, n = this.format) {
		let r = this.device.createTexture({
			size: [e, t],
			format: n,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
		});
		try {
			let n = r.createView(), i = this.device.createBindGroup({
				layout: this.textureLayout,
				entries: [{
					binding: 0,
					resource: n
				}, {
					binding: 1,
					resource: this.sampler
				}]
			}), a = e * t * 4;
			return this.targetBytes.set(r, a), this.stats().target(a), {
				texture: r,
				view: n,
				bindGroup: i,
				width: e,
				height: t
			};
		} catch (e) {
			throw r.destroy(), e;
		}
	}
	destroyTexture(e, t = !1) {
		if (!t && !this.disposed && this.recording()) {
			this.retiredTextures.push(e);
			return;
		}
		let n = this.targetBytes.get(e);
		n !== void 0 && (this.targetBytes.delete(e), this.stats().target(-n)), e.destroy();
	}
	flushRetired() {
		for (let e of this.retiredBuffers) e.destroy();
		this.retiredBuffers.length = 0;
		for (let e of this.retiredTextures) this.destroyTexture(e, !0);
		this.retiredTextures.length = 0;
	}
	frame(e, t) {
		return (!this.frameTarget || this.frameTarget.width !== e || this.frameTarget.height !== t) && (this.frameTarget && this.destroyTexture(this.frameTarget.texture), this.frameTarget = this.target(e, t), this.transitionBindGroup = void 0), this.frameTarget;
	}
	layers(e, t) {
		if (!this.layerTargets || this.layerTargets[0].width !== e || this.layerTargets[0].height !== t) {
			this.releaseLayers();
			let n = this.target(e, t, `rgba8unorm`);
			try {
				this.layerTargets = [n, this.target(e, t, `rgba8unorm`)];
			} catch (e) {
				throw this.destroyTexture(n.texture), e;
			}
		}
		return this.layerTargets;
	}
	releaseLayers() {
		if (this.layerTargets) for (let e of this.layerTargets) this.destroyTexture(e.texture);
		this.layerTargets = void 0;
	}
	settings(e, t, n) {
		if (n) {
			let { kind: e, direction: t, color: r } = n;
			if (!Number.isFinite(n.progress) || e !== `fade` && e !== `crossfade` && e !== `slide` || t !== `left` && t !== `right` && t !== `up` && t !== `down` || r.length !== 4) throw new require_errors.GraphicsError(`WebGPU transition settings are invalid.`);
			for (let e of r) if (!Number.isFinite(e) || e < 0 || e > 1) throw new require_errors.GraphicsError(`WebGPU transition settings are invalid.`);
		}
		let r = this.frameValues;
		if (r.fill(0), r[0] = e, r[1] = t, n) {
			r[2] = Math.max(0, Math.min(1, n.progress)), r[3] = n.kind === `fade` ? 1 : n.kind === `slide` ? 2 : 0, r[4] = n.direction === `left` ? -1 : +(n.direction === `right`), r[5] = n.direction === `up` ? -1 : +(n.direction === `down`), r[6] = +!!n.snapshot;
			for (let e = 0; e < 3; e++) r[8 + e] = n.color[e] * n.color[3];
			r[11] = n.color[3];
		}
		let a = !1;
		for (let e = 0; e < 16; e++) if (r[e] !== this.uploadedFrameValues[e]) {
			a = !0;
			break;
		}
		a && (this.uploadedFrameValues.set(r), this.device.queue.writeBuffer(this.frameBuffer, 0, r), this.stats().upload(r.byteLength));
	}
	process(e, t, r, a = t[0]) {
		let o = a;
		for (let a of r) {
			if (!(a instanceof require_material2d.PostProcessor2D)) throw new require_errors.GraphicsError(`Scene.effects2D must contain PostProcessor2D values.`);
			let r = this.prepared(a), s = o === t[0] ? t[1] : t[0];
			this.draw(e, s.view, o.bindGroup, r.layer, r.bindGroup, !1), o = s;
		}
		return o;
	}
	composite(e, t, n, r = !1) {
		this.draw(e, n, t.bindGroup, this.compositePipeline, void 0, !r);
	}
	transition(e, t, n, r) {
		let i = r.snapshot ? this.snapshot(r.snapshot).target : t;
		(!this.transitionBindGroup || this.transitionIncoming !== t || this.transitionOutgoing !== i) && (this.transitionBindGroup = this.device.createBindGroup({
			layout: this.transitionTextureLayout,
			entries: [
				{
					binding: 0,
					resource: t.view
				},
				{
					binding: 1,
					resource: this.sampler
				},
				{
					binding: 2,
					resource: i.view
				}
			]
		}), this.transitionIncoming = t, this.transitionOutgoing = i), this.draw(e, n, this.transitionBindGroup, this.transitionPipeline, void 0, !1);
	}
	snapshot(e) {
		if (!(e instanceof GPUSnapshot) || e.owner !== this || e.destroyed) throw new require_errors.GraphicsError(`WebGPU transition snapshot is destroyed or belongs to another renderer.`);
		return e;
	}
	draw(t, n, r, i, a, o) {
		this.attachment.view = n, this.attachment.loadOp = o ? `load` : `clear`;
		try {
			let n = require_gpu_timing.beginTimedRenderPass(t, this.passDescriptor);
			this.stats().pass2D(), n.setPipeline(i), n.setBindGroup(0, r), n.setBindGroup(1, a ?? this.defaultUniforms), n.setBindGroup(2, this.frameBindGroup), n.draw(3), this.stats().draw2D(), n.end();
		} finally {
			this.attachment.view = void 0;
		}
	}
	scene3D(e, t) {
		return (!this.sceneTarget || this.sceneTarget.width !== e || this.sceneTarget.height !== t) && (this.sceneTarget && this.destroyTexture(this.sceneTarget.texture), this.sceneTarget = this.target(e, t)), this.sceneTarget;
	}
	releaseScene() {
		this.sceneTarget && this.destroyTexture(this.sceneTarget.texture), this.sceneTarget = void 0;
	}
	releaseFrame() {
		this.frameTarget && this.destroyTexture(this.frameTarget.texture), this.frameTarget = void 0, this.transitionBindGroup = void 0, this.transitionIncoming = void 0, this.transitionOutgoing = void 0;
	}
	resize() {
		this.releaseFrame(), this.releaseScene(), this.releaseLayers();
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0, this.resize();
			for (let e of this.snapshots) e.destroy();
			for (let e of this.materials.values()) e.dispose();
			for (let e of this.processors.values()) e.dispose();
			this.flushRetired(), this.pending.clear(), this.frameBuffer.destroy(), this.compositePipeline = void 0, this.transitionPipeline = void 0;
		}
	}
};
//#endregion
exports.GPUSnapshot = GPUSnapshot;
exports.WebGPU2DEffects = WebGPU2DEffects;
exports.createQuadPipeline = createQuadPipeline;
exports.premultipliedBlend = premultipliedBlend;

//# sourceMappingURL=effects.cjs.map