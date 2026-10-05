const require_errors = require("./errors.cjs");
const require_texture = require("../../assets/src/texture.cjs");
const require_rendering2d = require("../../../src/data/rendering2d.cjs");
const require_distance_field = require("../../assets/src/fonts/distance-field.cjs");
const require_index = require("../../math/src/index.cjs");
const require_render_texture2d = require("./render-texture2d.cjs");
const require_filters2d = require("../../core/src/rendering2d/filters2d.cjs");
const require_isolated_group = require("../../core/src/rendering2d/isolated-group.cjs");
const require_particle_layer2d = require("../../core/src/particles2d/particle-layer2d.cjs");
const require_tiling_sprite2d = require("../../core/src/graphics2d/tiling-sprite2d.cjs");
const require_sprite_instance = require("./sprite-instance.cjs");
const require_lighting2d = require("../../core/src/lighting2d.cjs");
const require_render2d_contract = require("./render2d-contract.cjs");
const require_gpu_timing = require("./gpu-timing.cjs");
const require_lighting2d$1 = require("./lighting2d.cjs");
const require_webgpu_render2d_shaders = require("./webgpu-render2d-shaders.cjs");
const require_effects = require("./webgpu-2d/effects.cjs");
//#region dist/packages/graphics/src/webgpu-render2d.js
var j = {
	add: {
		color: {
			srcFactor: `one`,
			dstFactor: `one`,
			operation: `add`
		},
		alpha: {
			srcFactor: `one`,
			dstFactor: `one-minus-src-alpha`,
			operation: `add`
		}
	},
	screen: {
		color: {
			srcFactor: `one`,
			dstFactor: `one-minus-src`,
			operation: `add`
		},
		alpha: {
			srcFactor: `one`,
			dstFactor: `one-minus-src-alpha`,
			operation: `add`
		}
	},
	erase: {
		color: {
			srcFactor: `zero`,
			dstFactor: `one-minus-src-alpha`,
			operation: `add`
		},
		alpha: {
			srcFactor: `zero`,
			dstFactor: `one-minus-src-alpha`,
			operation: `add`
		}
	}
};
var WebGPURender2D = class WebGPURender2D {
	device;
	effects;
	hooks;
	quad = require_sprite_instance.createTextureQuad2D();
	sourceQuad = require_sprite_instance.createTextureQuad2D();
	appearance = /* @__PURE__ */ new Float32Array(4);
	matrix = new require_index.Matrix3();
	mapping = new require_index.Matrix3();
	tileMatrix = new require_index.Matrix3();
	inverse = new require_index.Matrix3();
	layers = /* @__PURE__ */ new Map();
	targets = /* @__PURE__ */ new Map();
	meshes = /* @__PURE__ */ new Map();
	particles = /* @__PURE__ */ new Map();
	captureCommands = new require_render2d_contract.RenderCommandBuffer2D();
	dependencies = [];
	groups = /* @__PURE__ */ new WeakMap();
	samplers = [];
	retiredTextures = [];
	retiredBuffers = [];
	scratch = /* @__PURE__ */ new Float32Array(128);
	uniformOffsets = [0];
	passLayout;
	passPipelineLayout;
	normal;
	lighting;
	replace;
	blends;
	multiply;
	meshPipeline;
	passPipeline;
	dummy;
	uniformBuffer;
	drawGroup;
	instanceBuffer;
	instanceData = /* @__PURE__ */ new Float32Array();
	uploadedUniforms = (/* @__PURE__ */ new Float32Array(128)).fill(NaN);
	capacity = 0;
	required = 0;
	slot = 0;
	encoder;
	pass;
	passTarget;
	resolution = 1;
	viewportWidth = 1;
	viewportHeight = 1;
	frame = 0;
	disposed = !1;
	constructor(e, t, n, r) {
		this.device = e, this.effects = t, this.hooks = n, this.normal = r.normal, this.lighting = r.lighting, this.replace = r.replace, this.blends = r.blends, this.multiply = r.multiply, this.meshPipeline = r.mesh, this.passPipeline = r.pass, this.passLayout = r.passLayout, this.passPipelineLayout = r.passPipelineLayout, this.dummy = e.createTexture({
			size: [1, 1],
			format: `rgba8unorm`,
			usage: GPUTextureUsage.TEXTURE_BINDING
		}), this.uniformBuffer = e.createBuffer({
			size: 512,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), this.instanceBuffer = e.createBuffer({
			size: require_sprite_instance.QUAD_BYTES,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		}), this.instanceData = /* @__PURE__ */ new Float32Array(36), this.capacity = 1, this.drawGroup = this.createDrawGroup();
	}
	static async create(e, t, n) {
		let r = await t.module(require_webgpu_render2d_shaders.quadWGSL(), `2D quad`), i = await t.module(require_webgpu_render2d_shaders.quadWGSL(require_lighting2d$1.lightingWGSL), `2D normal-map lighting`), a = e.createPipelineLayout({ bindGroupLayouts: [
			t.drawLayout,
			t.spriteTextureLayout,
			t.uniformLayout,
			t.spriteTextureLayout
		] }), o = await t.module(require_webgpu_render2d_shaders.quadWGSL(void 0, !0), `2D multiply layer`), s = await t.module(require_webgpu_render2d_shaders.meshWGSL, `2D mesh`), c = await t.module(require_webgpu_render2d_shaders.localPassWGSL, `2D local filter and mask`), l = e.createBindGroupLayout({ entries: [
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
		] }), u = e.createPipelineLayout({ bindGroupLayouts: [t.drawLayout, l] }), d = e.createPipelineLayout({ bindGroupLayouts: [t.drawLayout, t.spriteTextureLayout] }), f = e.createRenderPipeline({
			layout: d,
			vertex: {
				module: s,
				entryPoint: `vertexMain`,
				buffers: [{
					arrayStride: 20,
					attributes: [{
						shaderLocation: 0,
						offset: 0,
						format: `float32x2`
					}, {
						shaderLocation: 1,
						offset: 8,
						format: `float32x3`
					}]
				}]
			},
			fragment: {
				module: s,
				entryPoint: `fragmentMain`,
				targets: [{
					format: `rgba8unorm`,
					blend: require_effects.premultipliedBlend
				}]
			},
			primitive: { topology: `triangle-list` }
		}), p = e.createRenderPipeline({
			layout: u,
			vertex: {
				module: c,
				entryPoint: `vertexMain`
			},
			fragment: {
				module: c,
				entryPoint: `fragmentMain`,
				targets: [{ format: `rgba8unorm` }]
			},
			primitive: { topology: `triangle-list` }
		}), m = t.quadLayout;
		return new WebGPURender2D(e, t, n, {
			lighting: require_effects.createQuadPipeline(e, i, a),
			normal: require_effects.createQuadPipeline(e, r, m),
			replace: require_effects.createQuadPipeline(e, r, m, void 0),
			blends: {
				add: require_effects.createQuadPipeline(e, r, m, j.add),
				screen: require_effects.createQuadPipeline(e, r, m, j.screen),
				erase: require_effects.createQuadPipeline(e, r, m, j.erase)
			},
			multiply: require_effects.createQuadPipeline(e, o, t.multiplyLayout, void 0),
			mesh: f,
			pass: p,
			passLayout: l,
			passPipelineLayout: u
		});
	}
	createDrawGroup() {
		return this.device.createBindGroup({
			layout: this.effects.drawLayout,
			entries: [{
				binding: 0,
				resource: {
					buffer: this.uniformBuffer,
					size: 512
				}
			}]
		});
	}
	createTarget(e, t) {
		let n = this.device.limits.maxTextureDimension2D;
		if (!Number.isSafeInteger(e) || !Number.isSafeInteger(t) || e < 1 || t < 1 || e > n || t > n) throw new require_errors.GraphicsError(`WebGPU 2D target ${e}×${t} exceeds the ${n} pixel device limit.`);
		return this.effects.target(e, t, `rgba8unorm`);
	}
	retire(e) {
		this.disposed ? this.effects.destroyTexture(e.texture) : this.retiredTextures.push(e.texture);
	}
	flushRetired() {
		for (let e of this.retiredTextures) this.effects.destroyTexture(e);
		for (let e of this.retiredBuffers) e.destroy();
		this.retiredTextures.length = 0, this.retiredBuffers.length = 0, this.effects.flushRetired();
	}
	bindDraw(e, t) {
		this.uniformOffsets[0] = t * 512, e.setBindGroup(0, this.drawGroup, this.uniformOffsets);
	}
	sampler(e, t, n = 1) {
		let r = +!!e + (t ? 2 : 0) + 4 * (n - 1);
		return this.samplers[r] ??= this.device.createSampler({
			minFilter: e ? `nearest` : `linear`,
			magFilter: t ? `nearest` : `linear`,
			mipmapFilter: n > 1 ? `linear` : `nearest`,
			maxAnisotropy: n,
			addressModeU: `clamp-to-edge`,
			addressModeV: `clamp-to-edge`
		});
	}
	textureOf(e) {
		if (e.kind === `render`) {
			require_render_texture2d.assertRenderTextureOwner2D(e, this.hooks.owner);
			let t = this.targets.get(e);
			if (!t) throw new require_errors.GraphicsError(`Render texture has no native storage.`);
			return t.texture;
		}
		return this.hooks.upload(e);
	}
	textureGroup(e, t = !1, n = !1, r = 1) {
		let i = +!!t + (n ? 2 : 0) + 4 * (r - 1), a = this.groups.get(e);
		return a || (a = [], this.groups.set(e, a)), a[i] ??= this.device.createBindGroup({
			layout: this.effects.spriteTextureLayout,
			entries: [{
				binding: 0,
				resource: e.createView()
			}, {
				binding: 1,
				resource: this.sampler(t, n, r)
			}]
		});
	}
	preflight(e, t, n, r, i) {
		this.hooks.assertAlive(), this.viewportWidth = n, this.viewportHeight = r, this.resolution = i, this.dependencies.length = 0;
		for (let e of t.effects2D) this.effects.validate(e);
		this.validateCommands(e, 0), this.ensure(this.count(e));
	}
	validateSource(e, t) {
		if (e.destroyed) throw new require_errors.GraphicsError(`Cannot sample a destroyed 2D texture.`);
		t?.validate(), e.kind === `render` && (require_render_texture2d.assertRenderTextureOwner2D(e, this.hooks.owner), this.dependencies.includes(e) || this.dependencies.push(e));
	}
	validateGroup(e) {
		e.mask?.texture && this.validateSource(e.mask.texture, e.mask.view);
		for (let t of e.filters) {
			if (t.destroyed) throw new require_errors.GraphicsError(`Cannot render a destroyed Filter2D.`);
			t instanceof require_filters2d.DisplacementFilter2D && this.validateSource(t.texture, t.view);
		}
	}
	validateCommands(e, t) {
		if (t > require_rendering2d.rendering2dLimits.layerDepth) throw RangeError(`2D isolation exceeds its depth budget.`);
		for (let n of e.items) {
			if (n.object.destroyed) throw new require_errors.GraphicsError(`Cannot render a destroyed 2D object.`);
			if (n.kind === `layer`) {
				let e = n.object, r = this.layers.get(e);
				this.validateGroup(e);
				let i = r && e.cacheAsTexture && r.version === e.cacheVersion ? r.bounds : e.getLocalBounds();
				i.width > 0 && i.height > 0 && this.validateBounds(i, this.resolution), this.validateCommands(n.commands, t + 1);
			} else if (n.kind === `particles`) for (let e = 0; e < n.object.activeCount; e++) {
				let t = n.object.getSlot(n.object.activeSlotAt(e));
				this.validateSource(t.texture, t.view), require_sprite_instance.getTextureQuad2D(t.texture, t.view, t.source, this.sourceQuad);
			}
			else this.validateSource(n.object.texture, n.object.view), n.kind === `sprite` ? (require_sprite_instance.getSpriteQuad2D(n.object, this.quad), require_lighting2d.validateSpriteLighting2D(n.object), n.object.material && this.effects.validate(n.object.material)) : (n.object.geometry.validate(), require_sprite_instance.getTextureQuad2D(n.object.texture, n.object.view, void 0, this.quad));
		}
	}
	validateBounds(e, t) {
		if (![
			e.x,
			e.y,
			e.width,
			e.height
		].every(Number.isFinite) || e.width <= 0 || e.height <= 0) throw RangeError(`2D target bounds must be finite and positive.`);
		require_render_texture2d.validateRenderTextureSize2D({
			width: e.width,
			height: e.height,
			resolution: t
		}, this.device.limits.maxTextureDimension2D);
	}
	count(e) {
		let t = 0;
		for (let n of e.items) n.kind === `layer` ? t += 3 + n.object.filters.length * 2 + this.count(n.commands) : t += 1;
		return t + 1;
	}
	ensure(e) {
		if (this.required = e, e <= this.capacity) return;
		let t = Math.max(16, this.capacity);
		for (; t < e;) t *= 2;
		this.retiredBuffers.push(this.uniformBuffer, this.instanceBuffer), this.uniformBuffer = this.device.createBuffer({
			size: t * 512,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), this.instanceBuffer = this.device.createBuffer({
			size: t * require_sprite_instance.QUAD_BYTES,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		}), this.instanceData = new Float32Array(t * 36), this.uploadedUniforms = new Float32Array(t * 128).fill(NaN), this.drawGroup = this.createDrawGroup(), this.capacity = t;
	}
	draw(e, t, n, r, i, a) {
		this.begin(n);
		try {
			this.open(r, !0), this.drawCommands(e, {
				scene: t,
				target: r,
				bounds: {
					x: 0,
					y: 0,
					width: i,
					height: a
				}
			});
		} finally {
			this.finish();
		}
	}
	begin(e) {
		this.encoder = e, this.slot = 0, this.frame++;
	}
	finish() {
		this.closePass(), this.encoder = void 0;
		for (let [e, t] of this.layers) if (e.destroyed || t.seen !== this.frame) {
			for (let e of t.targets) this.retire(e);
			this.layers.delete(e);
		}
		if (this.hooks.residency.geometry.budgetBytes === 1 / 0) for (let e of this.meshes.values()) e.seen !== this.frame && !e.allocation.references && e.allocation.destroy();
		for (let [e, t] of this.particles) (e.destroyed || this.hooks.residency.geometry.budgetBytes === 1 / 0 && t.seen !== this.frame && !t.allocation.references) && t.allocation.destroy();
	}
	open(t, n) {
		return this.pass && this.passTarget === t && !n ? this.pass : (this.closePass(), this.pass = require_gpu_timing.beginTimedRenderPass(this.encoder, { colorAttachments: [{
			view: t.view,
			loadOp: n ? `clear` : `load`,
			storeOp: `store`,
			clearValue: {
				r: 0,
				g: 0,
				b: 0,
				a: 0
			}
		}] }), this.passTarget = t, this.hooks.stats.pass2D(), this.pass);
	}
	closePass() {
		this.pass?.end(), this.pass = void 0, this.passTarget = void 0;
	}
	allocate() {
		if (this.slot >= this.capacity) throw new require_errors.GraphicsError(`WebGPU 2D draw budget was exceeded.`);
		return this.slot++;
	}
	drawUniforms(e, n, r, i, a, o, s = !1, c = !1, l, u = !1, d = 1) {
		let f = this.scratch, p = n.target, m = n.bounds;
		f.fill(0), f[0] = m.width, f[1] = m.height, f[2] = p.width / m.width, f[3] = p.height / m.height;
		let h = r?.elements, g = i?.elements;
		f[4] = h?.[0] ?? 1, f[5] = h?.[1] ?? 0, f[6] = h?.[3] ?? 0, f[7] = h?.[4] ?? 1, f[8] = h?.[6] ?? 0, f[9] = h?.[7] ?? 0, f[12] = g?.[0] ?? 1, f[13] = g?.[1] ?? 0, f[14] = g?.[3] ?? 0, f[15] = g?.[4] ?? 1, f[16] = g?.[6] ?? 0, f[17] = g?.[7] ?? 0, f[31] = +!!c;
		for (let e = 0; e < 4; e++) f[20 + e] = a?.[e] ?? 1;
		o && (f[24] = o.u0, f[25] = o.v0, f[26] = o.ux, f[27] = o.vx, f[28] = o.uy, f[29] = o.vy, f[30] = +!!s);
		let _ = l instanceof require_texture.Texture ? require_distance_field.getTextureDistanceField(l) : void 0;
		f[80] = _ ? _.type === `sdf` ? 1 : 2 : 0, f[81] = _?.range ?? 0, f[82] = d, u || this.uploadUniforms(e);
	}
	uploadUniforms(e) {
		let t = e * 128, n = !1;
		for (let e = 0; e < 128; e++) if (this.uploadedUniforms[t + e] !== this.scratch[e]) {
			n = !0;
			break;
		}
		n && (this.uploadedUniforms.set(this.scratch, t), this.device.queue.writeBuffer(this.uniformBuffer, e * 512, this.scratch), this.hooks.stats.upload(512));
	}
	objectMatrix(e, t, n, r = !1) {
		let i = n.identity().elements;
		if (t.root) n.copy(t.root.updateWorldMatrix()).invert();
		else if (e.worldSpace === `world`) {
			let e = t.scene.camera2D;
			i[0] = i[4] = e.zoom, i[6] = -e.position.x * e.zoom + e.renderOffset.x, i[7] = -e.position.y * e.zoom + e.renderOffset.y;
		}
		return i[6] -= t.bounds.x, i[7] -= t.bounds.y, r || n.multiply(e.updateWorldMatrix()), n;
	}
	writeQuad(e, t, n, r, i, a, o, s) {
		let c = this.instanceData, l = e * 36, u = n?.elements;
		c[l] = u?.[0] ?? 1, c[l + 1] = u?.[1] ?? 0, c[l + 2] = u?.[3] ?? 0, c[l + 3] = u?.[4] ?? 1, c[l + 4] = u?.[6] ?? 0, c[l + 5] = u?.[7] ?? 0, c[l + 6] = t.x, c[l + 7] = t.y, c[l + 8] = t.width, c[l + 9] = t.height, c[l + 10] = t.naturalWidth, c[l + 11] = t.naturalHeight, c[l + 12] = t.u0, c[l + 13] = t.v0, c[l + 14] = t.ux, c[l + 15] = t.vx, c[l + 16] = t.uy, c[l + 17] = t.vy, c[l + 18] = t.trimWidth, c[l + 19] = t.trimHeight, c[l + 20] = r?.[0] ?? 1, c[l + 21] = r?.[1] ?? 1, c[l + 22] = r?.[2] ?? 1, c[l + 23] = r?.[3] ?? 1, c[l + 24] = c[l + 25] = c[l + 26] = c[l + 27] = 0, c[l + 28] = 0, c[l + 29] = 0, c[l + 30] = +!!o, c[l + 31] = 0, c[l + 32] = t.trimX, c[l + 33] = t.trimY, c[l + 34] = i, c[l + 35] = a, s && (c[l + 24] = s.tilePosition.x - t.x, c[l + 25] = s.tilePosition.y - t.y, c[l + 26] = s.tileScale.x, c[l + 27] = s.tileScale.y, c[l + 28] = s.tileRotation, c[l + 29] = 1);
	}
	uploadQuads(e, t) {
		this.device.queue.writeBuffer(this.instanceBuffer, e * require_sprite_instance.QUAD_BYTES, this.instanceData, e * 36, t * 36), this.hooks.stats.upload(t * require_sprite_instance.QUAD_BYTES);
	}
	drawCommands(e, t) {
		let n = e.items;
		for (let e = 0; e < n.length; e++) {
			let r = n[e];
			if (r.kind === `layer`) this.drawLayer(r.object, r.commands, t);
			else if (r.kind === `sprite`) {
				let i = r.object;
				if (i.lighting || i.material || i instanceof require_tiling_sprite2d.TilingSprite2D) this.drawSprite(i, t);
				else {
					let r = this.textureGroup(this.textureOf(i.texture), i.sampler?.minFilter === `nearest`, i.sampler?.magFilter === `nearest`, i.sampler?.maxAnisotropy ?? 1), o = this.slot;
					for (this.packSprite(i, t, this.allocate(), !0); e + 1 < n.length;) {
						let o = n[e + 1];
						if (o.kind !== `sprite` || o.object.material || o.object.lighting || o.object instanceof require_tiling_sprite2d.TilingSprite2D || o.object.worldSpace !== i.worldSpace || this.textureGroup(this.textureOf(o.object.texture), o.object.sampler?.minFilter === `nearest`, o.object.sampler?.magFilter === `nearest`, o.object.sampler?.maxAnisotropy ?? 1) !== r) break;
						e++, this.packSprite(o.object, t, this.allocate(), !0);
					}
					let s = this.slot - o;
					this.drawUniforms(o, t, void 0, void 0, void 0, void 0, !1, !1, i.texture, !1, i.sampler?.maxAnisotropy ?? 1), this.uploadQuads(o, s);
					let c = this.open(t.target, !1);
					c.setPipeline(this.normal), this.bindDraw(c, o), c.setBindGroup(1, r), c.setBindGroup(2, this.effects.defaultUniforms), c.setVertexBuffer(0, this.instanceBuffer), c.draw(6, s, 0, o), this.hooks.stats.draw2D(s);
				}
			} else r.kind === `mesh` ? this.drawMesh(r.object, t) : this.drawParticles(r.object, t);
		}
	}
	packSprite(e, t, n, r) {
		let i = require_sprite_instance.getSpriteQuad2D(e, this.quad);
		if (this.objectMatrix(e, t, this.matrix), e.roundPixels) {
			let e = this.matrix.elements, n = t.target, r = t.bounds;
			e[6] = Math.round(e[6] * n.width / r.width) * r.width / n.width, e[7] = Math.round(e[7] * n.height / r.height) * r.height / n.height;
		}
		require_sprite_instance.getRelativeAppearance2D(e, t.root, this.appearance), r || this.drawUniforms(n, t, void 0, void 0, this.appearance, void 0, !1, e.texture.kind === `native`, e.texture, !!e.lighting, e.sampler?.maxAnisotropy ?? 1), this.writeQuad(n, i, this.matrix, r ? this.appearance : void 0, 0, 0, !1, e instanceof require_tiling_sprite2d.TilingSprite2D ? e : void 0), this.instanceData[n * 36 + 31] = e.texture.kind === `native` ? 2 : 0;
	}
	drawSprite(e, t) {
		let n = this.allocate(), r = e.material ? this.effects.material(e.material) : void 0;
		this.packSprite(e, t, n, !1), this.uploadQuads(n, 1), e.lighting && (this.objectMatrix(e, t, this.mapping, !0).invert(), require_lighting2d$1.packLighting2D(e, this.mapping, require_sprite_instance.getSpriteQuad2D(e, this.quad), this.scratch), this.uploadUniforms(n));
		let i = this.open(t.target, !1);
		if (e.lighting && e.material && !r?.lit) throw new require_errors.GraphicsError(`A lit Material2D must be prepared before rendering.`);
		i.setPipeline(e.lighting ? r?.lit ?? this.lighting : r?.layer ?? this.normal), this.bindDraw(i, n), i.setBindGroup(1, this.textureGroup(this.textureOf(e.texture), e.sampler?.minFilter === `nearest`, e.sampler?.magFilter === `nearest`, e.sampler?.maxAnisotropy ?? 1)), i.setBindGroup(2, r?.bindGroup ?? this.effects.defaultUniforms), e.lighting && i.setBindGroup(3, this.textureGroup(this.textureOf(e.normalTexture ?? e.texture), e.sampler?.minFilter === `nearest`, e.sampler?.magFilter === `nearest`, e.sampler?.maxAnisotropy ?? 1)), i.setVertexBuffer(0, this.instanceBuffer), i.draw(6, 1, 0, n), this.hooks.stats.draw2D();
	}
	prepareGeometry(e) {
		e.validate();
		let t = e.uvQ.length, n = this.meshes.get(e);
		if (!n) {
			let r = this.hooks.residency.geometry.allocate(t * 20 + e.indices.byteLength, () => {
				let t = this.meshes.get(e);
				t && (t.vertex.destroy(), t.index.destroy(), this.meshes.delete(e));
			}), i, a;
			try {
				i = this.device.createBuffer({
					size: t * 20,
					usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
				}), a = this.device.createBuffer({
					size: e.indices.byteLength,
					usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
				}), n = {
					vertex: i,
					index: a,
					allocation: r,
					data: new Float32Array(t * 5),
					version: -1,
					seen: this.frame
				}, this.meshes.set(e, n);
			} catch (e) {
				throw i?.destroy(), a?.destroy(), r.destroy(), e;
			}
		}
		if (n.allocation.touch(), n.seen = this.frame, n.version !== e.version) {
			for (let r = 0; r < t; r++) {
				let t = r * 5, i = e.uvQ[r];
				n.data[t] = e.positions[r * 2], n.data[t + 1] = e.positions[r * 2 + 1], n.data[t + 2] = e.uvs[r * 2] * i, n.data[t + 3] = e.uvs[r * 2 + 1] * i, n.data[t + 4] = i;
			}
			this.device.queue.writeBuffer(n.vertex, 0, n.data), this.device.queue.writeBuffer(n.index, 0, e.indices), this.hooks.stats.upload(n.data.byteLength + e.indices.byteLength), n.version = e.version;
		}
		return n.allocation;
	}
	unloadGeometry(e) {
		this.meshes.get(e)?.allocation.destroy();
	}
	drawMesh(e, t) {
		let n = e.geometry;
		this.prepareGeometry(n);
		let r = this.meshes.get(n), i = this.open(t.target, !1), a = this.allocate();
		require_sprite_instance.getTextureQuad2D(e.texture, e.view, void 0, this.quad), require_sprite_instance.getRelativeAppearance2D(e, t.root, this.appearance), this.drawUniforms(a, t, this.objectMatrix(e, t, this.matrix), void 0, this.appearance, this.quad, `textureMode` in e && e.textureMode === `repeat`, e.texture.kind === `native`), i.setPipeline(this.meshPipeline), this.bindDraw(i, a), i.setBindGroup(1, this.textureGroup(this.textureOf(e.texture))), i.setVertexBuffer(0, r.vertex), i.setIndexBuffer(r.index, `uint32`), i.drawIndexed(n.indices.length), this.hooks.stats.draw2D();
	}
	prepareParticles(e) {
		if (e.destroyed) throw new require_errors.GraphicsError(`Cannot prepare a destroyed ParticleLayer2D.`);
		let t = this.particles.get(e);
		if (!t) {
			let n = this.hooks.residency.geometry.allocate(e.capacity * require_sprite_instance.QUAD_BYTES, () => {
				this.particles.get(e)?.buffer.destroy(), this.particles.delete(e);
			}), r;
			try {
				r = this.device.createBuffer({
					size: e.capacity * require_sprite_instance.QUAD_BYTES,
					usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
				});
			} catch (e) {
				throw n.destroy(), e;
			}
			t = {
				buffer: r,
				allocation: n,
				data: new Float32Array(e.capacity * 36),
				versions: new Float64Array(e.capacity * 5).fill(-1),
				slots: new Int32Array(e.capacity).fill(-1),
				sourceSizes: new Float64Array(e.capacity * 3),
				seen: this.frame
			}, this.particles.set(e, t);
		}
		return t.allocation.touch(), t.seen = this.frame, t.allocation;
	}
	drawParticles(e, t) {
		this.prepareParticles(e);
		let n = this.particles.get(e), r = this.open(t.target, !1), a = this.allocate(), o = n.data, s = this.quad;
		this.objectMatrix(e, t, this.matrix), this.objectMatrix(e, t, this.mapping, !0), require_sprite_instance.getRelativeAppearance2D(e, t.root, this.appearance), this.drawUniforms(a, t, this.matrix, this.mapping, this.appearance), r.setPipeline(this.normal), this.bindDraw(r, a), r.setBindGroup(2, this.effects.defaultUniforms), r.setVertexBuffer(0, n.buffer);
		let c, l = 0, u = -1;
		for (let t = 0; t < e.activeCount; t++) {
			let a = e.activeSlotAt(t), d = e.getSlot(a), p = t * 5, m = t * 36, h = n.versions, _ = e.dynamicAttributes, v = t * 3, y = d.texture.kind === `render` ? d.texture.resolution : 1, b = n.slots[t] !== a || h[p + 4] !== d.generation, x = b || (_ & require_particle_layer2d.ParticleAttribute2D.Transform) !== 0 || h[p] !== d.transformVersion, S = b || (_ & require_particle_layer2d.ParticleAttribute2D.Tint) !== 0 || h[p + 1] !== d.tintVersion, C = b || (_ & require_particle_layer2d.ParticleAttribute2D.Source) !== 0 || h[p + 2] !== d.sourceVersion || n.sourceSizes[v] !== d.texture.width || n.sourceSizes[v + 1] !== d.texture.height || n.sourceSizes[v + 2] !== y, w = b || (_ & require_particle_layer2d.ParticleAttribute2D.Anchor) !== 0 || h[p + 3] !== d.anchorVersion;
			x || S || C || w ? (n.slots[t] = a, u < 0 && (u = t), x && (o[m] = d.a, o[m + 1] = d.b, o[m + 2] = d.c, o[m + 3] = d.d, o[m + 4] = d.tx, o[m + 5] = d.ty, o[m + 30] = +(d.space === `world`), h[p] = d.transformVersion), C && (require_sprite_instance.getTextureQuad2D(d.texture, d.view, d.source, s), o[m + 6] = s.x, o[m + 7] = s.y, o[m + 8] = s.width, o[m + 9] = s.height, o[m + 10] = s.naturalWidth, o[m + 11] = s.naturalHeight, o[m + 12] = s.u0, o[m + 13] = s.v0, o[m + 14] = s.ux, o[m + 15] = s.vx, o[m + 16] = s.uy, o[m + 17] = s.vy, o[m + 18] = s.trimWidth, o[m + 19] = s.trimHeight, o[m + 32] = s.trimX, o[m + 31] = d.texture.kind === `native` ? 2 : 0, o[m + 33] = s.trimY, h[p + 2] = d.sourceVersion, n.sourceSizes[v] = d.texture.width, n.sourceSizes[v + 1] = d.texture.height, n.sourceSizes[v + 2] = y), S && (o[m + 20] = d.tintR, o[m + 21] = d.tintG, o[m + 22] = d.tintB, o[m + 23] = d.tintA, h[p + 1] = d.tintVersion), w && (o[m + 34] = d.anchorX, o[m + 35] = d.anchorY, h[p + 3] = d.anchorVersion), h[p + 4] = d.generation) : u >= 0 && (this.uploadParticles(n, u, t - u), u = -1);
			let T = this.textureOf(d.texture);
			T !== c && (c && (r.draw(6, t - l, 0, l), this.hooks.stats.draw2D(t - l)), r.setBindGroup(1, this.textureGroup(T)), c = T, l = t);
		}
		u >= 0 && this.uploadParticles(n, u, e.activeCount - u), c && (r.draw(6, e.activeCount - l, 0, l), this.hooks.stats.draw2D(e.activeCount - l));
	}
	uploadParticles(e, t, n) {
		this.device.queue.writeBuffer(e.buffer, t * require_sprite_instance.QUAD_BYTES, e.data, t * 36, n * 36), this.hooks.stats.upload(n * require_sprite_instance.QUAD_BYTES);
	}
	layer(e, t, n) {
		let r = this.layers.get(e);
		if (r && e.cacheAsTexture && r.version === e.cacheVersion) return r.seen = this.frame, r;
		let i = e.getLocalBounds();
		if (i.width <= 0 || i.height <= 0) return;
		this.validateBounds(i, this.resolution);
		let a = Math.ceil(i.width * this.resolution), o = Math.ceil(i.height * this.resolution);
		if (!r || r.targets[0].width !== a || r.targets[0].height !== o) {
			let t = [];
			try {
				for (let e = 0; e < 3; e++) t.push(this.createTarget(a, o));
			} catch (e) {
				for (let e of t) this.retire(e);
				throw e;
			}
			if (r) for (let e of r.targets) this.retire(e);
			r = {
				targets: t,
				bounds: i,
				version: -1,
				result: t[0],
				seen: this.frame
			}, this.layers.set(e, r);
		}
		r.bounds = i, r.seen = this.frame;
		let s = {
			scene: n,
			target: r.targets[0],
			bounds: i,
			root: e
		};
		this.closePass(), this.open(s.target, !0), this.drawCommands(t, s), this.closePass();
		let c = r.targets[0], l = r.targets[1];
		e.mask && (this.drawMask(e.mask, r.targets[2], i), this.filterPass(c, l, i, 5, void 0, r.targets[2], e.mask), [c, l] = [l, c]);
		for (let t of e.filters) t.kind === `blur` ? (this.filterPass(c, l, i, 2, t, void 0, void 0, !0), [c, l] = [l, c], this.filterPass(c, l, i, 2, t, void 0, void 0, !1)) : this.filterPass(c, l, i, t.kind === `alpha` ? 0 : t.kind === `color-matrix` ? 1 : t.kind === `noise` ? 3 : 4, t), [c, l] = [l, c];
		return r.result = c, r.version = e.cacheVersion, r;
	}
	drawLayer(e, t, n) {
		let r = this.layer(e, t, n.scene);
		r && (require_sprite_instance.getRelativeAppearance2D(e, n.root, this.appearance), this.compositeLayer(r.result, r.bounds, this.objectMatrix(e, n, this.matrix), this.appearance, e.blendMode, n));
	}
	compositeLayer(e, t, n, r, i, a) {
		let o = this.quad;
		o.x = t.x, o.y = t.y, o.width = o.naturalWidth = o.trimWidth = t.width, o.height = o.naturalHeight = o.trimHeight = t.height, o.trimX = o.trimY = o.u0 = o.v0 = o.vx = o.uy = 0, o.ux = o.vy = 1, o.resolution = 1;
		let s;
		i === `multiply` && (this.closePass(), s = this.createTarget(a.target.width, a.target.height), this.encoder.copyTextureToTexture({ texture: a.target.texture }, { texture: s.texture }, [a.target.width, a.target.height]), this.retire(s));
		let c = this.open(a.target, !1), l = this.allocate();
		this.drawUniforms(l, a, void 0, void 0, r), this.writeQuad(l, o, n, void 0, 0, 0, !1), this.uploadQuads(l, 1), c.setPipeline(s ? this.multiply : i === `normal` ? this.normal : this.blends[i]), this.bindDraw(c, l), c.setBindGroup(1, this.textureGroup(e.texture)), c.setBindGroup(2, this.effects.defaultUniforms), s && c.setBindGroup(3, this.textureGroup(s.texture)), c.setVertexBuffer(0, this.instanceBuffer), c.draw(6, 1, 0, l), this.hooks.stats.draw2D();
	}
	drawMask(e, t, n) {
		if (e.texture) {
			require_sprite_instance.getTextureQuad2D(e.texture, e.view, void 0, this.quad);
			let r = this.matrix.identity().elements, i = e.transform;
			r[0] = i[0], r[1] = i[1], r[3] = i[2], r[4] = i[3], r[6] = i[4] - n.x, r[7] = i[5] - n.y;
			let a = {
				scene: void 0,
				target: t,
				bounds: n
			};
			this.appearance.fill(1);
			let o = this.open(t, !0), s = this.allocate();
			this.drawUniforms(s, a, void 0, void 0, this.appearance), this.writeQuad(s, this.quad, this.matrix, void 0, 0, 0, !1), this.uploadQuads(s, 1), o.setPipeline(this.replace), this.bindDraw(o, s), o.setBindGroup(1, this.textureGroup(this.textureOf(e.texture))), o.setBindGroup(2, this.effects.defaultUniforms), o.setVertexBuffer(0, this.instanceBuffer), o.draw(6, 1, 0, s), this.hooks.stats.draw2D(), this.closePass();
			return;
		}
		let r = document.createElement(`canvas`);
		r.width = t.width, r.height = t.height;
		let i = r.getContext(`2d`);
		if (!i) throw new require_errors.GraphicsError(`Native geometric mask rasterization requires Canvas2D.`);
		if (i.setTransform(t.width / n.width, 0, 0, t.height / n.height, -n.x * t.width / n.width, -n.y * t.height / n.height), i.transform(...e.transform), i.fillStyle = `#fff`, e.path) i.fill(e.path.nativePath2D, e.path.fillRule);
		else {
			let t = e.rect;
			i.fillRect(t.x, t.y, t.width, t.height);
		}
		this.device.queue.copyExternalImageToTexture({ source: r }, {
			texture: t.texture,
			premultipliedAlpha: !0
		}, [t.width, t.height]), this.hooks.stats.upload(t.width * t.height * 4), this.device.queue.onSubmittedWorkDone().then(() => {
			r.width = r.height = 0;
		});
	}
	filterPass(e, t, n, r, i, a, o, s = !0) {
		let c = this.scratch, l = i?.uniforms, u = this.allocate();
		if (c.fill(0), c[0] = r, r === 0) c[1] = l[0];
		else if (r === 1) {
			for (let e = 0; e < 4; e++) for (let t = 0; t < 4; t++) c[4 + e * 4 + t] = l[e * 5 + t];
			for (let e = 0; e < 4; e++) c[20 + e] = l[e * 5 + 4];
		} else if (r === 2) c[1] = l[0], c[2] = l[1] * 4, c[4] = s ? 1 / n.width : 0, c[5] = s ? 0 : 1 / n.height;
		else if (r === 3) c[1] = l[0], c[2] = l[1], c[4] = n.width, c[5] = n.height;
		else if (r === 4) {
			let e = i, t = require_sprite_instance.getTextureQuad2D(e.texture, e.view, void 0, this.sourceQuad);
			c[4] = l[0] / n.width, c[5] = l[1] / n.height, c[8] = t.u0, c[9] = t.v0, c[10] = t.ux, c[11] = t.vx, c[12] = t.uy, c[13] = t.vy;
		} else r === 5 && (c[1] = +!!o.inverse, c[2] = +(o.channel === `red`));
		this.uploadUniforms(u);
		let d = r === 4 ? this.textureOf(i.texture) : a ? a.texture : this.dummy, p = this.device.createBindGroup({
			layout: this.passLayout,
			entries: [
				{
					binding: 0,
					resource: e.texture.createView()
				},
				{
					binding: 1,
					resource: this.sampler(!1, !1)
				},
				{
					binding: 2,
					resource: d.createView()
				}
			]
		}), m = this.open(t, !0);
		m.setPipeline(this.passPipeline), this.bindDraw(m, u), m.setBindGroup(1, p), m.draw(3), this.hooks.stats.draw2D(), this.closePass();
	}
	createRenderTexture(e) {
		this.hooks.assertIdle();
		let t = require_render_texture2d.validateRenderTextureSize2D(e, this.device.limits.maxTextureDimension2D), n = this.createTarget(t.width, t.height), r = require_render_texture2d.createOwnedRenderTexture2D(this.hooks.owner, t, (e) => {
			this.hooks.assertIdle();
			let t = this.createTarget(e.width, e.height);
			this.effects.destroyTexture(n.texture), n = t, this.targets.set(r, n);
		}, () => {
			this.targets.delete(r), this.encoder ? this.retire(n) : this.effects.destroyTexture(n.texture);
		});
		return this.targets.set(r, n), this.clearTarget(n), r;
	}
	clearTarget(e) {
		let t = this.device.createCommandEncoder();
		t.beginRenderPass({ colorAttachments: [{
			view: e.view,
			loadOp: `clear`,
			storeOp: `store`,
			clearValue: {
				r: 0,
				g: 0,
				b: 0,
				a: 0
			}
		}] }).end(), this.device.queue.submit([t.finish()]), this.hooks.stats.pass2D();
	}
	async renderToTexture(e, t, r = {}) {
		this.hooks.assertIdle(), require_render_texture2d.assertRenderTextureOwner2D(e, this.hooks.owner);
		let i = t instanceof require_isolated_group.IsolatedGroup2D ? t : void 0, a = i ? i.scene : t;
		if (!a || i?.destroyed) throw new require_errors.GraphicsError(`Render content must belong to a live Scene.`);
		let o = r.bounds ?? (i ? i.getLocalBounds() : {
			x: 0,
			y: 0,
			width: e.logicalWidth,
			height: e.logicalHeight
		});
		this.validateBounds(o, e.resolution), require_render2d_contract.collectRenderCommands2D(a, o.width, o.height, this.captureCommands, {
			...i ? { root: i } : {},
			skipCulling: !0
		});
		let s, u;
		this.hooks.residency.beginFrame();
		try {
			this.preflight(this.captureCommands, a, o.width, o.height, e.resolution), i && this.validateGroup(i), require_render_texture2d.validateRenderTextureDependencies2D(e, this.dependencies, this.hooks.owner);
			let t = this.targets.get(e);
			this.ensure(this.required + 1);
			let n = this.device.createCommandEncoder();
			s = this.createTarget(e.width, e.height), this.begin(n);
			try {
				r.clear === !1 && n.copyTextureToTexture({ texture: t.texture }, { texture: s.texture }, [e.width, e.height]);
				let c = {
					scene: a,
					target: s,
					bounds: o,
					...i ? { root: i } : {}
				};
				if (this.open(s, r.clear !== !1), i) {
					let e = this.layer(i, this.captureCommands, a);
					if (e) {
						let t = i.tint;
						this.appearance[0] = t[0], this.appearance[1] = t[1], this.appearance[2] = t[2], this.appearance[3] = t[3] * i.opacity, this.matrix.identity().elements[6] = -o.x, this.matrix.elements[7] = -o.y, this.compositeLayer(e.result, e.bounds, this.matrix, this.appearance, i.blendMode, c);
					}
				} else this.drawCommands(this.captureCommands, c);
				this.closePass();
			} finally {
				this.finish();
			}
			let c = s;
			!i && a.effects2D.length && (u = this.createTarget(e.width, e.height), this.effects.settings(o.width, o.height), c = this.effects.process(n, [s, u], a.effects2D)), n.copyTextureToTexture({ texture: c.texture }, { texture: t.texture }, [e.width, e.height]), this.device.queue.submit([n.finish()]), e.publish(this.hooks.owner, this.dependencies);
		} finally {
			this.hooks.residency.abortFrame(), s && this.retire(s), u && this.retire(u), this.captureCommands.clear(), this.device.queue.onSubmittedWorkDone().then(() => this.flushRetired());
		}
	}
	async extractPixels(e, t = {}) {
		this.hooks.assertIdle(), require_render_texture2d.assertRenderTextureOwner2D(e, this.hooks.owner);
		let n = require_render_texture2d.validateRenderTextureRegion2D(e, t.region), r = this.targets.get(e), i = Math.ceil(n.width * 4 / 256) * 256, a = this.device.createBuffer({
			size: i * n.height,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
		});
		try {
			let e = this.device.createCommandEncoder();
			e.copyTextureToBuffer({
				texture: r.texture,
				origin: [n.x, n.y]
			}, {
				buffer: a,
				bytesPerRow: i
			}, [n.width, n.height]), this.device.queue.submit([e.finish()]), await a.mapAsync(GPUMapMode.READ), this.hooks.assertAlive();
			let t = new Uint8Array(a.getMappedRange()), o = new Uint8ClampedArray(n.width * n.height * 4);
			for (let e = 0; e < n.height; e++) for (let r = 0; r < n.width; r++) {
				let a = e * i + r * 4, s = (e * n.width + r) * 4, c = t[a + 3];
				o[s + 3] = c;
				for (let e = 0; e < 3; e++) o[s + e] = c ? Math.round(t[a + e] * 255 / c) : 0;
			}
			return a.unmap(), o;
		} finally {
			a.destroy();
		}
	}
	async generateTexture(e, r = {}) {
		this.hooks.assertIdle();
		let i = r.bounds ?? (e instanceof require_isolated_group.IsolatedGroup2D ? e.getLocalBounds() : {
			x: 0,
			y: 0,
			width: this.viewportWidth,
			height: this.viewportHeight
		}), a = this.createRenderTexture({
			width: i.width,
			height: i.height,
			...r.resolution === void 0 ? {} : { resolution: r.resolution }
		});
		try {
			await this.renderToTexture(a, e, { bounds: i });
			let n = await this.extractPixels(a);
			this.hooks.assertAlive();
			let r = document.createElement(`canvas`);
			r.width = a.width, r.height = a.height;
			let o = r.getContext(`2d`);
			if (!o) throw new require_errors.GraphicsError(`Texture generation requires Canvas2D image encoding.`);
			o.putImageData(new ImageData(n, a.width, a.height), 0, 0);
			try {
				let e = await require_texture.Texture.fromImage(r);
				return this.disposed && (e.destroy(), this.hooks.assertAlive()), e;
			} finally {
				r.width = r.height = 0;
			}
		} finally {
			a.destroy();
		}
	}
	source(e) {
		return this.textureOf(e);
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0, this.closePass();
			for (let e of this.layers.values()) for (let t of e.targets) this.effects.destroyTexture(t.texture);
			for (let e of this.targets.keys()) e.destroy();
			for (let e of this.meshes.values()) e.vertex.destroy(), e.index.destroy();
			for (let e of this.particles.values()) e.buffer.destroy();
			this.layers.clear(), this.targets.clear(), this.meshes.clear(), this.particles.clear(), this.flushRetired(), this.captureCommands.destroy(), this.uniformBuffer.destroy(), this.instanceBuffer.destroy(), this.dummy.destroy();
		}
	}
};
//#endregion
exports.WebGPURender2D = WebGPURender2D;

//# sourceMappingURL=webgpu-render2d.cjs.map