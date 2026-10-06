const require_errors = require("./errors.cjs");
const require_native_texture = require("../../assets/src/native-texture.cjs");
const require_math3d = require("../../math/src/math3d.cjs");
const require_mesh = require("../../core/src/mesh.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
const require_native_pbr_material = require("../../core/src/native-pbr-material.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_frustum = require("../../core/src/frustum.cjs");
const require_instanced_mesh = require("../../core/src/instanced-mesh.cjs");
const require_skinned_mesh = require("../../core/src/skinned-mesh.cjs");
const require_render_visibility = require("../../core/src/render-visibility.cjs");
const require_post_effects = require("../../core/src/post-effects.cjs");
const require_baked_lighting = require("../../core/src/baked-lighting.cjs");
const require_contact_shadows = require("../../core/src/contact-shadows.cjs");
const require_gpu_timing = require("./gpu-timing.cjs");
const require_optical_maps = require("./optical-maps.cjs");
const require_sheen = require("../../../src/data/sheen.cjs");
const require_brdf = require("../../../src/data/brdf.cjs");
const require_mesh_shader_variants = require("./mesh-shader-variants.cjs");
const require_draw_order = require("../../core/src/draw-order.cjs");
const require_render_data = require("../../core/src/render-data.cjs");
const require_shadow_atlas = require("../../core/src/shadow-atlas.cjs");
const require_optical_pack_shaders = require("./optical-pack-shaders.cjs");
const require_native_texture_upload = require("./native-texture-upload.cjs");
const require_material_uv = require("./material-uv.cjs");
const require_shadow_cache = require("./shadow-cache.cjs");
const require_native_material_limits = require("./native-material-limits.cjs");
const require_reflection_capture = require("./reflection-capture.cjs");
const require_probe_texture_array = require("./probe-texture-array.cjs");
const require_temporal_post = require("./temporal-post.cjs");
const require_planar_reflection_capture = require("./planar-reflection-capture.cjs");
const require_webgpu_occlusion = require("./webgpu-occlusion.cjs");
const require_webgpu_particles3d = require("./webgpu-particles3d.cjs");
const require_webgpu_mesh_shader = require("./webgpu-mesh-shader.cjs");
const require_webgpu_post_pipeline = require("./webgpu-post-pipeline.cjs");
const require_webgpu_oit = require("./webgpu-oit.cjs");
const require_webgpu_temporal_pipeline = require("./webgpu-temporal-pipeline.cjs");
//#region dist/packages/graphics/src/webgpu-mesh-pipeline.js
var ve = [];
var ye = [];
var Q = /* @__PURE__ */ new WeakMap();
var $ = 336 + require_rendering.nativeMaterial3DLimits.uniformFloats + 4 + require_optical_maps.mappedMaterialUVFloatCount + 20 + 40 + 16;
var WebGPUMeshPipeline = class WebGPUMeshPipeline {
	device;
	opticalPackLayout;
	transmissionPack;
	thicknessPack;
	shadowPipeline;
	skyPipeline;
	skyHdrPipeline;
	sceneLayout;
	meshLayout;
	materialLayout;
	post;
	format;
	sampleCount;
	residency;
	pipelineRecipes;
	particles;
	geometries = /* @__PURE__ */ new Map();
	textureEpoch = 0;
	nativeMaterials = /* @__PURE__ */ new Map();
	pendingMaterials = /* @__PURE__ */ new Map();
	destroyed = !1;
	visibilityCache = new require_render_visibility.RenderVisibilityCache();
	visibility = new require_render_visibility.RenderVisibilitySet();
	visibilityOptions = {};
	depthTextureVersions = /* @__PURE__ */ new WeakMap();
	depthRevision = 0;
	proofWidth = 0;
	proofHeight = 0;
	proofMode = -1;
	gathered = /* @__PURE__ */ new Set();
	occlusion;
	blendedDraw = (e) => e.material instanceof require_pbr_material.PBRMaterial && e.material.alphaToCoverage ? !1 : require_draw_order.isBlended(e) || (this.visibility.entries.get(e)?.fade ?? 1) < 1;
	meshes = /* @__PURE__ */ new Map();
	textures = /* @__PURE__ */ new Map();
	premultipliedTextures = /* @__PURE__ */ new Map();
	samplers = /* @__PURE__ */ new Map();
	meshPipelines = /* @__PURE__ */ new Map();
	pendingMeshPipelines = /* @__PURE__ */ new Set();
	renderScene;
	draws = [];
	visibleDraws = [];
	frustum = new require_frustum.Frustum();
	drawSorter = new require_draw_order.DrawSorter();
	stats;
	sceneData = /* @__PURE__ */ new Float32Array(868);
	fogData = /* @__PURE__ */ new Float32Array(8);
	invViewProjection = new require_math3d.Matrix4();
	environments = /* @__PURE__ */ new Map();
	dummyEnvironment;
	dummyEnvironmentView;
	dummyEnvironmentArrayView;
	selectedProbes = [];
	probeMaps = [];
	probeTexture;
	probeAllocation;
	probeMipCount = 1;
	temporalState = new require_temporal_post.TemporalPostState();
	temporal;
	temporalActive = !1;
	environmentSampler;
	environmentView;
	backgroundView;
	lightingData = /* @__PURE__ */ new Float32Array(812);
	atlas = new require_shadow_atlas.ShadowAtlas();
	shadowCache = new require_shadow_cache.ShadowCache();
	shadowBuffer;
	sheenBuffer;
	brdfBuffer;
	projectionBuffer;
	projectionGroup;
	projectionOffsets = [0];
	sceneBuffer;
	sampler;
	whiteTexture;
	whiteView;
	emptyShadow;
	emptyShadowView;
	identityBuffer;
	whiteBuffer;
	whiteCapacity = 0;
	influenceBuffer;
	influenceCapacity = 0;
	retired = [];
	sceneBindGroup;
	shadowSceneBindGroup;
	skyBindGroup;
	opticalTextures = /* @__PURE__ */ new Map();
	emptyOptical;
	emptyOpticalView;
	refractionTexture;
	refractionView;
	refractionWidth = 0;
	refractionHeight = 0;
	shadowTexture;
	shadowView;
	shadowSize = 0;
	depthTexture;
	depthView;
	depthWidth = 0;
	depthHeight = 0;
	contactTexture;
	contactView;
	contactWidth = 0;
	contactHeight = 0;
	contactProjection;
	contactProjectionGroup;
	contactDepthBuffer;
	contactDepthCopy;
	contactDepthCopyGroup;
	msaaTexture;
	msaaView;
	msaaFormat;
	msaaWidth = 0;
	msaaHeight = 0;
	frame = 0;
	oit;
	linearClear = {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	};
	clearComponents = /* @__PURE__ */ new Float32Array(4);
	colorAttachment = {
		loadOp: `clear`,
		storeOp: `store`
	};
	depthAttachment = {
		depthLoadOp: `clear`,
		depthStoreOp: `store`,
		depthClearValue: 1
	};
	renderPassDescriptor = {
		colorAttachments: [this.colorAttachment],
		depthStencilAttachment: this.depthAttachment
	};
	shadowAttachment = {
		depthLoadOp: `clear`,
		depthStoreOp: `store`,
		depthClearValue: 1
	};
	shadowDescriptor = {
		colorAttachments: [],
		depthStencilAttachment: this.shadowAttachment
	};
	constructor(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g) {
		this.device = e, this.opticalPackLayout = t, this.transmissionPack = n, this.thicknessPack = r, this.shadowPipeline = i, this.skyPipeline = a, this.skyHdrPipeline = o, this.sceneLayout = s, this.meshLayout = c, this.materialLayout = l, this.post = d, this.format = f, this.sampleCount = p, this.residency = m, this.pipelineRecipes = h, this.particles = g, this.stats = d.stats, this.oit = new require_webgpu_oit.WebGPUOIT(e, p, this.stats), this.sceneBuffer = e.createBuffer({
			size: this.sceneData.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), this.shadowBuffer = e.createBuffer({
			size: this.atlas.data.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), this.sheenBuffer = e.createBuffer({
			size: require_sheen.sheenDirectionalAlbedo.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), e.queue.writeBuffer(this.sheenBuffer, 0, require_sheen.sheenDirectionalAlbedo), this.stats.upload(require_sheen.sheenDirectionalAlbedo.byteLength), this.brdfBuffer = e.createBuffer({
			size: require_brdf.ggxDirectionalAlbedo.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), e.queue.writeBuffer(this.brdfBuffer, 0, require_brdf.ggxDirectionalAlbedo), this.stats.upload(require_brdf.ggxDirectionalAlbedo.byteLength), this.projectionBuffer = e.createBuffer({
			size: this.atlas.projections.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), this.projectionGroup = e.createBindGroup({
			layout: u,
			entries: [{
				binding: 0,
				resource: {
					buffer: this.projectionBuffer,
					size: 64
				}
			}]
		}), this.sampler = e.createSampler({
			minFilter: `linear`,
			magFilter: `linear`,
			mipmapFilter: `linear`,
			addressModeU: `clamp-to-edge`,
			addressModeV: `clamp-to-edge`
		}), this.whiteTexture = e.createTexture({
			size: [1, 1],
			format: `rgba8unorm`,
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
		}), e.queue.writeTexture({ texture: this.whiteTexture }, new Uint8Array([
			255,
			255,
			255,
			255
		]), {}, [1, 1]), this.stats.upload(4), this.whiteView = this.whiteTexture.createView(), this.emptyOptical = e.createTexture({
			size: [
				1,
				1,
				5
			],
			format: `rgba8unorm`,
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
		}), this.emptyOpticalView = this.emptyOptical.createView({ dimension: `2d-array` }), this.emptyShadow = e.createTexture({
			size: [1, 1],
			format: `depth32float`,
			usage: GPUTextureUsage.TEXTURE_BINDING
		}), this.emptyShadowView = this.emptyShadow.createView(), this.environmentSampler = e.createSampler({
			minFilter: `linear`,
			magFilter: `linear`,
			mipmapFilter: `linear`,
			addressModeU: `repeat`,
			addressModeV: `clamp-to-edge`
		}), this.dummyEnvironment = e.createTexture({
			size: [1, 1],
			format: `rgba16float`,
			usage: GPUTextureUsage.TEXTURE_BINDING
		}), this.dummyEnvironmentView = this.dummyEnvironment.createView(), this.dummyEnvironmentArrayView = this.dummyEnvironment.createView({ dimension: `2d-array` }), this.environmentView = this.dummyEnvironmentArrayView, this.temporal = new require_webgpu_temporal_pipeline.WebGPUTemporalPipeline(e, p, this.stats), this.backgroundView = this.dummyEnvironmentView, this.identityBuffer = e.createBuffer({
			size: 64,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
		}), e.queue.writeBuffer(this.identityBuffer, 0, new require_math3d.Matrix4().elements), this.stats.upload(64), this.whiteCapacity = 1024, this.whiteBuffer = e.createBuffer({
			size: this.whiteCapacity * 16,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		}), e.queue.writeBuffer(this.whiteBuffer, 0, new Float32Array(this.whiteCapacity * 4).fill(1)), this.stats.upload(this.whiteCapacity * 16), this.sceneBindGroup = this.createSceneGroup(this.emptyShadowView), this.shadowSceneBindGroup = this.sceneBindGroup, this.skyBindGroup = this.createSceneGroup(this.emptyShadowView, this.backgroundView);
	}
	static async initialize(e, t, n, r, a, o) {
		let s = e.createShaderModule({ code: require_webgpu_mesh_shader.webgpuMeshShader }), c = e.createShaderModule({ code: require_optical_pack_shaders.opticalPackWGSL }), [l, u] = await Promise.all([s.getCompilationInfo(), c.getCompilationInfo()]);
		if (n()) throw new require_errors.GraphicsError(`WebGPU renderer was destroyed during initialization.`);
		let d = [...l.messages, ...u.messages].filter((e) => e.type === `error`);
		if (d.length) throw new require_errors.WebGPUInitializationError(`WebGPU 3D shader compilation failed: ${d.map((e) => `${e.lineNum}:${e.linePos} ${e.message}`).join(`; `)}`);
		let f = e.createBindGroupLayout({ entries: [{
			binding: 0,
			visibility: GPUShaderStage.COMPUTE,
			texture: {}
		}, {
			binding: 1,
			visibility: GPUShaderStage.COMPUTE,
			storageTexture: {
				access: `write-only`,
				format: `rgba8unorm`,
				viewDimension: `2d-array`
			}
		}] }), p = e.createPipelineLayout({ bindGroupLayouts: [f] }), m = [
			`transmission`,
			`thickness`,
			`anisotropy`,
			`iridescence`,
			`iridescenceThickness`
		].map((t) => e.createComputePipeline({
			layout: p,
			compute: {
				module: c,
				entryPoint: t
			}
		}));
		Q.set(e, m.slice(2));
		let h = e.createBindGroupLayout({ entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				buffer: { type: `uniform` }
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				texture: { sampleType: `depth` }
			},
			{
				binding: 2,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {
					sampleType: `float`,
					viewDimension: `2d-array`
				}
			},
			{
				binding: 3,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: { type: `filtering` }
			},
			{
				binding: 4,
				visibility: GPUShaderStage.FRAGMENT,
				texture: { sampleType: `float` }
			},
			{
				binding: 5,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: { type: `uniform` }
			},
			{
				binding: 6,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: { type: `uniform` }
			},
			{
				binding: 7,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: { type: `uniform` }
			},
			{
				binding: 8,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: { type: `read-only-storage` }
			}
		] }), g = e.createBindGroupLayout({ entries: [{
			binding: 0,
			visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
			buffer: { type: `uniform` }
		}, {
			binding: 1,
			visibility: GPUShaderStage.VERTEX,
			buffer: { type: `read-only-storage` }
		}] }), _ = e.createBindGroupLayout({ entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 1,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 2,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 3,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 4,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 5,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 6,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 7,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 8,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 9,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 10,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 11,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 12,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 13,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 14,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 15,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 16,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 17,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 18,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 19,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 20,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 21,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {}
			},
			{
				binding: 22,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 23,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {}
			},
			{
				binding: 24,
				visibility: GPUShaderStage.FRAGMENT,
				texture: { viewDimension: `2d-array` }
			}
		] }), v = e.createPipelineLayout({ bindGroupLayouts: [
			h,
			g,
			_
		] }), y = e.createBindGroupLayout({ entries: [{
			binding: 0,
			visibility: GPUShaderStage.VERTEX,
			buffer: {
				type: `uniform`,
				hasDynamicOffset: !0,
				minBindingSize: 64
			}
		}] }), b = [
			{
				arrayStride: 32,
				attributes: [
					{
						shaderLocation: 0,
						offset: 0,
						format: `float32x3`
					},
					{
						shaderLocation: 1,
						offset: 12,
						format: `float32x3`
					},
					{
						shaderLocation: 2,
						offset: 24,
						format: `float32x2`
					}
				]
			},
			{
				arrayStride: 64,
				stepMode: `instance`,
				attributes: [
					{
						shaderLocation: 3,
						offset: 0,
						format: `float32x4`
					},
					{
						shaderLocation: 4,
						offset: 16,
						format: `float32x4`
					},
					{
						shaderLocation: 5,
						offset: 32,
						format: `float32x4`
					},
					{
						shaderLocation: 6,
						offset: 48,
						format: `float32x4`
					}
				]
			},
			{
				arrayStride: 12,
				stepMode: `instance`,
				attributes: [{
					shaderLocation: 7,
					offset: 0,
					format: `float32x3`
				}]
			},
			{
				arrayStride: 16,
				attributes: [{
					shaderLocation: 8,
					offset: 0,
					format: `float32x4`
				}]
			},
			{
				arrayStride: 64,
				attributes: [
					{
						shaderLocation: 9,
						offset: 0,
						format: `uint32x4`
					},
					{
						shaderLocation: 10,
						offset: 16,
						format: `float32x4`
					},
					{
						shaderLocation: 12,
						offset: 32,
						format: `uint32x4`
					},
					{
						shaderLocation: 13,
						offset: 48,
						format: `float32x4`
					}
				]
			},
			{
				arrayStride: 8,
				attributes: [{
					shaderLocation: 11,
					offset: 0,
					format: `float32x2`
				}]
			},
			{
				arrayStride: 16,
				attributes: [{
					shaderLocation: 14,
					offset: 0,
					format: `float32x4`
				}]
			}
		], x = {
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
		}, S = {
			layout: v,
			vertex: {
				module: s,
				entryPoint: `vertexMain`,
				buffers: b
			},
			fragment: {
				module: s,
				entryPoint: `fragmentMain`,
				targets: [{
					format: t,
					blend: x
				}]
			},
			primitive: { topology: `triangle-list` },
			multisample: { count: r },
			depthStencil: {
				format: `depth24plus`,
				depthWriteEnabled: !0,
				depthCompare: `less`
			}
		}, C = {
			layout: v,
			vertex: {
				module: s,
				entryPoint: `vertexMain`,
				buffers: b
			},
			fragment: {
				module: s,
				entryPoint: `fragmentMain`,
				targets: [{
					format: `rgba16float`,
					blend: x
				}]
			},
			primitive: { topology: `triangle-list` },
			multisample: { count: r },
			depthStencil: {
				format: `depth24plus`,
				depthWriteEnabled: !0,
				depthCompare: `less`
			}
		}, w = {
			srcFactor: `one`,
			dstFactor: `one`
		}, T = {
			srcFactor: `zero`,
			dstFactor: `one-minus-src-alpha`
		}, E = {
			layout: v,
			vertex: {
				module: s,
				entryPoint: `vertexMain`,
				buffers: b
			},
			fragment: {
				module: s,
				entryPoint: `oitFragment`,
				targets: [{
					format: `rgba16float`,
					blend: {
						color: w,
						alpha: w
					}
				}, {
					format: `r8unorm`,
					blend: {
						color: T,
						alpha: T
					}
				}]
			},
			primitive: { topology: `triangle-list` },
			multisample: { count: r },
			depthStencil: {
				format: `depth24plus`,
				depthWriteEnabled: !1,
				depthCompare: `less`
			}
		}, D = {
			layout: e.createPipelineLayout({ bindGroupLayouts: [
				h,
				g,
				_,
				y
			] }),
			vertex: {
				module: s,
				entryPoint: `shadowVertex`,
				buffers: b
			},
			fragment: {
				module: s,
				entryPoint: `shadowFragment`,
				targets: []
			},
			primitive: { topology: `triangle-list` },
			depthStencil: {
				format: `depth32float`,
				depthWriteEnabled: !0,
				depthCompare: `less`
			}
		}, O = e.createRenderPipeline(D), k = {
			...S,
			depthStencil: {
				...S.depthStencil,
				depthWriteEnabled: !1
			}
		}, A = {
			...C,
			depthStencil: {
				...C.depthStencil,
				depthWriteEnabled: !1
			}
		}, [j, M] = [t, `rgba16float`].map((t) => e.createRenderPipeline({
			layout: e.createPipelineLayout({ bindGroupLayouts: [h] }),
			vertex: {
				module: s,
				entryPoint: `skyVertex`
			},
			fragment: {
				module: s,
				entryPoint: `skyFragment`,
				targets: [{ format: t }]
			},
			primitive: { topology: `triangle-list` },
			multisample: { count: r },
			depthStencil: {
				format: `depth24plus`,
				depthWriteEnabled: !1,
				depthCompare: `always`
			}
		})), N = await require_webgpu_post_pipeline.WebGPUPostPipeline.initialize(e, t, n, r, a);
		require_webgpu_post_pipeline.registerPostLUTResidency(N, o.textures);
		let P;
		try {
			return P = await require_webgpu_particles3d.WebGPUParticles3D.initialize(e, t, r, a), new WebGPUMeshPipeline(e, f, m[0], m[1], O, j, M, h, g, _, y, N, t, r, o, [
				S,
				C,
				E,
				D,
				k,
				A
			], P);
		} catch (e) {
			throw P?.destroy(), N.destroy(), e;
		}
	}
	resize(e, t) {
		this.oit.resize(e, t), this.temporal.resize(e, t), this.depthTexture && (this.depthWidth !== e || this.depthHeight !== t) && (this.depthTexture.destroy(), this.stats.target(-this.depthWidth * this.depthHeight * 4 * this.sampleCount), this.depthTexture = void 0, this.depthView = void 0), this.msaaTexture && (this.msaaWidth !== e || this.msaaHeight !== t) && (this.msaaTexture.destroy(), this.stats.target(-this.msaaWidth * this.msaaHeight * (this.msaaFormat === `rgba16float` ? 8 : 4) * this.sampleCount), this.msaaTexture = void 0, this.msaaView = void 0), this.refractionTexture && (this.refractionWidth !== e || this.refractionHeight !== t) && this.releaseRefraction(), this.post.resize(e, t);
	}
	ensureRefraction(e, t) {
		this.refractionTexture && this.refractionWidth === e && this.refractionHeight === t || (this.refractionTexture?.destroy(), this.refractionTexture && this.stats.target(-this.refractionWidth * this.refractionHeight * 8), this.refractionTexture = void 0, this.refractionView = void 0, this.refractionTexture = this.device.createTexture({
			size: [e, t],
			format: `rgba16float`,
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
		}), this.stats.target(e * t * 8), this.refractionWidth = e, this.refractionHeight = t, this.refractionView = this.refractionTexture.createView(), this.sceneBindGroup = this.createSceneGroup(this.shadowView ?? this.emptyShadowView));
	}
	releaseRefraction() {
		this.refractionTexture && (this.refractionTexture.destroy(), this.stats.target(-this.refractionWidth * this.refractionHeight * 8), this.refractionTexture = void 0, this.refractionView = void 0, this.sceneBindGroup = this.createSceneGroup(this.shadowView ?? this.emptyShadowView));
	}
	render(t, n, i, a, s, c, l, d = s, f) {
		this.renderScene = t, this.frame++;
		for (let e of this.retired) e.destroy();
		this.retired.length = 0, this.draws.length = 0, this.visibleDraws.length = 0;
		try {
			if (!t?.has3DContent) return this.releaseContactDepth(), this.visibilityCache.clear(), this.visibility.color.length = this.visibility.shadows.length = 0, this.visibility.entries.clear(), this.visibility.occlusionCandidates.length = 0, this.gathered.clear(), this.occlusion?.clear(), this.post.releaseTarget(), this.oit.release(), this.depthTexture && (this.depthTexture.destroy(), this.stats.target(-this.depthWidth * this.depthHeight * 4 * this.sampleCount), this.depthTexture = void 0, this.depthView = void 0), this.msaaTexture && (this.msaaTexture.destroy(), this.stats.target(-this.msaaWidth * this.msaaHeight * (this.msaaFormat === `rgba16float` ? 8 : 4) * this.sampleCount), this.msaaTexture = void 0, this.msaaView = void 0), this.shadowTexture && (this.shadowTexture.destroy(), this.stats.target(-this.shadowSize * this.shadowSize * 4), this.shadowTexture = void 0, this.shadowView = void 0, this.sceneBindGroup = this.shadowSceneBindGroup), this.releaseRefraction(), (this.environmentView !== this.dummyEnvironmentArrayView || this.backgroundView !== this.dummyEnvironmentView) && (this.probeAllocation?.destroy(), this.probeAllocation = void 0, this.probeMaps.length = 0, this.selectedProbes.length = 0, this.environmentView = this.dummyEnvironmentArrayView, this.backgroundView = this.dummyEnvironmentView, this.shadowSceneBindGroup = this.createSceneGroup(this.emptyShadowView, this.dummyEnvironmentView), this.sceneBindGroup = this.skyBindGroup = this.shadowSceneBindGroup), this.temporal.releaseTarget(), this.temporalState.invalidate(), !1;
			require_render_data.validateRenderSettings(t), t.lightSelection.update(t), require_render_data.fillLightingData(t, this.lightingData, t.lightSelection), this.atlas.update(t, c), this.ensureShadow(t), this.ensureEnvironment(t), this.frustum.setFromMatrix(t.camera3D.updateMatrix(c));
			let p = +!!t.postProcessing.enabled | (t.transparency === `weighted` ? 2 : 0);
			(this.proofWidth !== a || this.proofHeight !== s || this.proofMode !== p) && (this.proofWidth = a, this.proofHeight = s, this.proofMode = p, ++this.depthRevision);
			for (let e of t.renderMeshes ?? ye) {
				!this.occlusion && e.occlusionCulled && (this.occlusion = new require_webgpu_occlusion.WebGPUOcclusionBackend(this.device));
				let t = require_mesh.materialBaseTexture(e.material);
				this.depthTextureVersions.get(t) !== t.version && (this.depthTextureVersions.set(t, t.version), ++this.depthRevision), e.worldVisible && require_native_material3d.isNativeMaterial3D(e.material) && !e.material.transparent && ++this.depthRevision;
			}
			let m = this.visibilityOptions;
			m.viewportHeight = d, m.timeSeconds = t.presentationTime, m.occlusion = this.occlusion, m.depthRevision = this.depthRevision, this.visibilityCache.collect(t, t.camera3D, this.frustum, this.visibility, m), this.stats.meshes += this.visibility.meshChecks, this.stats.culled += this.visibility.frustumCulled + this.visibility.occlusionCulled;
			let _ = !1, v = !1, y = !1;
			this.gathered.clear();
			for (let e of this.visibility.color) {
				if (this.visibleDraws.push(e), this.gathered.add(e), e.material instanceof require_pbr_material.PBRMaterial && e.material.alphaToCoverage) {
					if (this.sampleCount < 2) throw new require_errors.GraphicsError(`WebGPU alpha-to-coverage requires renderer antialiasing.`);
					y = !0;
				}
				t.transparency === `weighted` && this.blendedDraw(e) && (v = !0), e.material instanceof require_pbr_material.PBRMaterial && e.material.transmission > 0 && (_ = !0);
			}
			for (let e of this.visibility.shadows) this.draws.push(e), this.gathered.add(e);
			for (let e of this.gathered) {
				if (require_native_material3d.isNativeMaterial3D(e.material) && (e.material.destroyed || !this.nativeMaterials.has(e.material))) throw new require_errors.GraphicsError(`NativeMaterial3D must be explicitly prepared before rendering.`);
				require_native_material3d.isNativeMaterial3D(e.material) && e.material.validate();
				let n = this.cacheGeometry(e.renderGeometry), r = this.cacheMesh(e);
				n.seen = r.seen = this.frame, this.updateMesh(t, e, r);
			}
			t.transparency === `sorted` && this.drawSorter.sort(this.visibleDraws, t.camera3D.position, this.blendedDraw), v || this.oit.release(), t.shadows.enabled && this.renderShadows(n, t, a, s);
			let b = !!f || t.postProcessing.enabled || _ || v || y;
			this.temporalActive = !f && t.postProcessing.enabled && (t.postProcessing.taa || t.postProcessing.ssr || require_post_effects.getPostEffects(t.postProcessing)?.motionBlur?.enabled === !0), this.temporalActive ? this.temporalState.begin(t, t.camera3D, a, s, t.postProcessing, c) : (this.temporal.releaseTarget(), this.temporalState.invalidate()), this.prepareScene(t, c, b), b || this.post.releaseTarget(), _ ? this.ensureRefraction(a, s) : this.releaseRefraction();
			let x = require_render_data.activeBackground(t);
			if (!this.visibleDraws.length && !b && !x && (t.gpuParticleEmitters?.size ?? 0) === 0) return !1;
			this.ensureDepth(a, s), this.captureContactDepth(n, t, a, s);
			let S = b ? this.post.target(a, s, this.depthView) : i;
			this.colorAttachment.resolveTarget = void 0, this.sampleCount > 1 ? (this.colorAttachment.view = this.ensureMultisample(b ? `rgba16float` : this.format, a, s), this.colorAttachment.resolveTarget = S) : this.colorAttachment.view = S, this.colorAttachment.clearValue = b ? this.decodeClear(l) : l, this.depthAttachment.view = this.depthView;
			let w = this.temporalActive && t.postProcessing.ssr, T = _ || w ? 2 : 1, E;
			for (let e = 0; e < T; e++) {
				this.colorAttachment.loadOp = e === 0 ? `clear` : `load`, this.depthAttachment.depthLoadOp = e === 0 ? `clear` : `load`, this.colorAttachment.storeOp = this.sampleCount > 1 && e === T - 1 ? `discard` : `store`;
				let r = require_gpu_timing.beginTimedRenderPass(n, this.renderPassDescriptor);
				try {
					r.setViewport(0, 0, a, s, 0, 1), x && e === 0 && (r.setBindGroup(0, this.skyBindGroup), r.setPipeline(b ? this.skyHdrPipeline : this.skyPipeline), r.draw(3)), r.setBindGroup(0, this.sceneBindGroup);
					for (let t of this.visibleDraws) {
						if (v && this.blendedDraw(t) || (_ || w) && (this.blendedDraw(t) || t.material instanceof require_pbr_material.PBRMaterial && t.material.transmission > 0) !== (e === 1)) continue;
						r.setBindGroup(0, this.reflectionGroup(this.meshes.get(t)));
						let n = this.drawMesh(r, t, +!!b);
						this.stats.draw(t.geometry.indices.length, n);
					}
					e === T - 1 && this.particles.draw(r, t.gpuParticleEmitters ?? ve, t.camera3D, c, b);
				} finally {
					r.end();
				}
				w && e === 0 && (E = this.temporal.applyOpaqueSSR(n, this.post.colorTexture, this.depthView, this.temporalState, t.postProcessing), this.temporal.blit(n, E, this.colorAttachment.view, this.sampleCount)), _ && e === 0 && (w && this.sampleCount > 1 ? n.copyTextureToTexture({ texture: E }, { texture: this.refractionTexture }, [a, s]) : this.post.copyColor(n, this.refractionTexture));
			}
			if (this.occlusion?.encode(n, this.depthView, this.temporalActive ? this.temporalState.currentVP : t.camera3D.updateMatrix(c), this.visibility.occlusionCandidates, a, s, this.sampleCount), v) {
				let e = this.oit.begin(n, a, s, this.depthView);
				try {
					for (let t of this.visibleDraws) {
						if (!this.blendedDraw(t)) continue;
						e.setBindGroup(0, this.reflectionGroup(this.meshes.get(t)));
						let n = this.drawMesh(e, t, 2);
						this.stats.draw(t.geometry.indices.length, n);
					}
				} finally {
					e.end();
				}
				this.oit.resolve(n, S);
			}
			if (f) this.post.copyColor(n, f);
			else if (b) {
				let e = this.temporalActive && t.postProcessing.taa ? this.temporal.applyTAA(n, this.post.colorTexture, this.depthView, this.temporalState, t.postProcessing) : void 0;
				this.post.render(n, i, t.postProcessing, t.camera3D, this.invViewProjection, e, this.depthView, t, this.temporalActive ? this.temporalState : void 0), this.temporalActive && this.temporalState.commit();
			}
			return !0;
		} catch (e) {
			throw this.temporalState.invalidate(), e;
		} finally {
			this.colorAttachment.view = void 0, this.colorAttachment.resolveTarget = void 0, this.depthAttachment.view = void 0, this.shadowAttachment.view = void 0, this.renderScene = void 0, this.draws.length = 0, this.visibleDraws.length = 0, this.releaseUnused();
		}
	}
	createSceneGroup(e, t = this.refractionView ?? this.dummyEnvironmentView, n = this.environmentView, r = this.sceneBuffer, i = this.identityBuffer) {
		return this.device.createBindGroup({
			layout: this.sceneLayout,
			entries: [
				{
					binding: 0,
					resource: { buffer: r }
				},
				{
					binding: 1,
					resource: e
				},
				{
					binding: 2,
					resource: n
				},
				{
					binding: 3,
					resource: this.environmentSampler
				},
				{
					binding: 4,
					resource: t
				},
				{
					binding: 5,
					resource: { buffer: this.shadowBuffer }
				},
				{
					binding: 6,
					resource: { buffer: this.sheenBuffer }
				},
				{
					binding: 7,
					resource: { buffer: this.brdfBuffer }
				},
				{
					binding: 8,
					resource: { buffer: i }
				}
			]
		});
	}
	ensureShadow(e) {
		if (!e.shadows.enabled) {
			this.shadowTexture && (this.shadowTexture.destroy(), this.stats.target(-this.shadowSize * this.shadowSize * 4), this.shadowTexture = void 0, this.shadowView = void 0, this.sceneBindGroup = this.shadowSceneBindGroup);
			return;
		}
		let t = this.atlas.size;
		if (t > this.device.limits.maxTextureDimension2D) throw new require_errors.GraphicsError(`WebGPU shadow map size ${t} exceeds this device's texture limit.`);
		if (this.shadowTexture && this.shadowSize === t) return;
		this.shadowTexture?.destroy(), this.shadowTexture && this.stats.target(-this.shadowSize * this.shadowSize * 4), this.shadowTexture = void 0, this.shadowView = void 0;
		let n = this.device.createTexture({
			size: [t, t],
			format: `depth32float`,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
		});
		this.stats.target(t * t * 4);
		try {
			let e = n.createView();
			this.sceneBindGroup = this.createSceneGroup(e), this.shadowTexture = n, this.shadowView = e, this.shadowSize = t, this.shadowCache.invalidate();
		} catch (e) {
			throw n.destroy(), this.stats.target(-t * t * 4), e;
		}
	}
	prepareScene(e, t, n) {
		let r = this.sceneData, i = this.temporalActive ? this.temporalState.currentVP : e.camera3D.updateMatrix(t);
		r.set(i.elements, 0), r[16] = e.camera3D.position.x, r[17] = e.camera3D.position.y, r[18] = e.camera3D.position.z, r.set(this.lightingData, 20), r[30] = +!!n, this.invViewProjection.copy(i).invert();
		r.set(this.invViewProjection.elements, 832), r[851] = require_render_data.activeBackground(e) ? e.backgroundIntensity : 0, require_render_data.fillFogData(e, this.fogData), r.set(this.fogData, 852);
		let o = require_contact_shadows.ContactShadows.get(e);
		o?.validate(), r[860] = o?.distance ?? 0, r[861] = o?.thickness ?? 0, r[862] = o?.bias ?? 0, r[863] = o?.steps ?? 0, r[864] = o?.strength ?? 0, r[865] = this.proofWidth, r[866] = this.proofHeight, this.device.queue.writeBuffer(this.sceneBuffer, 0, r), this.stats.upload(r.byteLength);
		for (let t of this.visibleDraws) {
			let i = this.meshes.get(t);
			require_render_data.fillLightingData(e, this.lightingData, e.lightSelection.selectMesh(t)), r.set(this.lightingData, 20), r[30] = +!!n, this.device.queue.writeBuffer(i.sceneBuffer, 0, r), this.stats.upload(r.byteLength);
		}
		this.device.queue.writeBuffer(this.shadowBuffer, 0, this.atlas.data), this.stats.upload(this.atlas.data.byteLength), this.atlas.count && this.device.queue.writeBuffer(this.projectionBuffer, 0, this.atlas.projections, 0, this.atlas.count * 64), this.atlas.count && this.stats.upload(this.atlas.count * 64 * 4);
	}
	ensureEnvironment(e) {
		let t = require_render_data.activeEnvironment(e);
		require_render_data.selectReflectionProbes(e, this.selectedProbes);
		let n = !this.probeTexture || this.probeMaps[0] !== t;
		for (let e = 0; e < 4; e++) this.probeMaps[e + 1] !== this.selectedProbes[e]?.environment && (n = !0);
		if (n) {
			this.probeAllocation?.destroy(), this.probeMaps.length = 5, this.probeMaps[0] = t;
			for (let e = 0; e < 4; e++) this.probeMaps[e + 1] = this.selectedProbes[e]?.environment;
			let e = require_probe_texture_array.packProbeTextures(this.probeMaps), n = this.residency.textures.allocate(e.bytes, () => {
				this.probeTexture?.destroy(), this.probeTexture = void 0;
			});
			try {
				let t = this.device.createTexture({
					size: [
						e.width,
						e.height,
						5
					],
					mipLevelCount: e.mipCount,
					format: `rgba16float`,
					usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
				});
				this.probeTexture = t;
				for (let n = 0; n < e.mipCount; n++) {
					let r = e.levels[n];
					this.device.queue.writeTexture({
						texture: t,
						mipLevel: n
					}, r.data, {
						bytesPerRow: r.width * 8,
						rowsPerImage: r.height
					}, [
						r.width,
						r.height,
						5
					]), this.stats.upload(r.data.byteLength);
				}
				n.retain(), this.probeAllocation = n, this.probeMipCount = e.mipCount, this.environmentView = t.createView({ dimension: `2d-array` });
			} catch (e) {
				throw n.destroy(), e;
			}
		}
		this.probeAllocation?.touch();
		let r = require_render_data.activeBackground(e), i = this.environmentView, a = r ? this.uploadEnvironment(r) : this.dummyEnvironmentView;
		(n || a !== this.backgroundView) && (this.environmentView = i, this.backgroundView = a, this.shadowSceneBindGroup = this.createSceneGroup(this.emptyShadowView, this.dummyEnvironmentView), this.sceneBindGroup = this.createSceneGroup(this.shadowView ?? this.emptyShadowView), this.skyBindGroup = this.createSceneGroup(this.emptyShadowView, this.backgroundView));
	}
	prepareEnvironment(e) {
		this.uploadEnvironment(e);
	}
	async captureReflectionProbe(e, t, n = {}) {
		if (this.destroyed) throw new require_errors.GraphicsError(`Cannot capture on a destroyed renderer.`);
		let { size: r } = require_reflection_capture.captureConfiguration(t, n), i = Math.ceil(r * 8 / 256) * 256, a = this.device.createTexture({
			size: [r, r],
			format: `rgba16float`,
			usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
		}), o = [];
		this.stats.target(r * r * 8 + i * r * 6);
		try {
			require_reflection_capture.encodeProbeFaces(e, t, n, () => {
				let t = this.device.createBuffer({
					size: i * r,
					usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
				});
				o.push(t);
				let n = this.device.createCommandEncoder();
				this.render(e, n, this.dummyEnvironmentView, r, r, 1, {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				}, r, a), n.copyTextureToBuffer({ texture: a }, {
					buffer: t,
					bytesPerRow: i
				}, [r, r]), this.device.queue.submit([n.finish()]);
			});
			let s = [];
			for (let t of o) {
				if (n.signal?.throwIfAborted(), n.signal) {
					let e = n.signal, onAbort;
					try {
						let n = new Promise((t, n) => {
							onAbort = () => n(e.reason ?? new DOMException(`Capture aborted.`, `AbortError`)), e.addEventListener(`abort`, onAbort, { once: !0 }), e.aborted && onAbort();
						});
						await Promise.race([t.mapAsync(GPUMapMode.READ), n]);
					} finally {
						onAbort && e.removeEventListener(`abort`, onAbort);
					}
				} else await t.mapAsync(GPUMapMode.READ);
				if (this.destroyed || e.destroyed) throw new require_errors.GraphicsError(`Reflection capture was invalidated by renderer loss or scene disposal.`);
				let a = new Uint16Array(t.getMappedRange()), o = new Float32Array(r * r * 4);
				for (let e = 0; e < r; e++) for (let t = 0; t < r * 4; t++) o[e * r * 4 + t] = Math.max(0, require_reflection_capture.halfFloat(a[e * i / 2 + t]));
				s.push(o), t.unmap();
			}
			return require_reflection_capture.capturedEnvironment(r, s, n.signal);
		} finally {
			for (let e of o) e.destroy();
			a.destroy(), this.stats.target(-r * r * 8 - i * r * 6);
		}
	}
	async capturePlanarReflection(e, t) {
		if (this.destroyed) throw new require_errors.GraphicsError(`Cannot capture on a destroyed renderer.`);
		if (!t.beginCapture(e.presentationTime)) return;
		let n = t.size, r = Math.ceil(n * 4 / 256) * 256, i, a, o = !1;
		try {
			i = this.device.createTexture({
				size: [n, n],
				format: this.format,
				usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
			}), a = this.device.createBuffer({
				size: r * n,
				usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
			}), this.stats.target(n * n * 4 + r * n), o = !0;
			let s = this.device.createCommandEncoder(), c = i;
			if (require_planar_reflection_capture.encodePlanarReflection(e, t, () => {
				this.render(e, s, c.createView(), n, n, 1, {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				}, n);
			}), s.copyTextureToBuffer({ texture: i }, {
				buffer: a,
				bytesPerRow: r
			}, [n, n]), this.device.queue.submit([s.finish()]), await a.mapAsync(GPUMapMode.READ), this.destroyed || e.destroyed || t.destroyed) throw new require_errors.GraphicsError(`Planar capture was invalidated by renderer loss or disposal.`);
			let l = new Uint8Array(a.getMappedRange()), u = new Uint8ClampedArray(n * n * 4), d = this.format.startsWith(`bgra`);
			for (let e = 0; e < n; e++) for (let t = 0; t < n; t++) {
				let i = e * r + t * 4, a = (e * n + t) * 4;
				u[a] = l[i + (d ? 2 : 0)], u[a + 1] = l[i + 1], u[a + 2] = l[i + (d ? 0 : 2)], u[a + 3] = l[i + 3];
			}
			a.unmap(), t.adoptPixels(u);
		} finally {
			a?.destroy(), i?.destroy(), o && this.stats.target(-n * n * 4 - r * n), t.endCapture();
		}
	}
	invalidateTemporalHistory() {
		this.temporalState.invalidate();
	}
	prepareGeometry(e) {
		return this.cacheGeometry(e).allocation;
	}
	unloadGeometry(e) {
		this.geometries.get(e)?.allocation.destroy();
	}
	async prepareMaterial(e) {
		if (e.validate(), this.destroyed) throw new require_errors.GraphicsError(`Cannot prepare on a destroyed native renderer.`);
		if (this.nativeMaterials.has(e)) return;
		require_native_material_limits.validateNativeMaterialGPU(this.device.limits);
		let t = this.pendingMaterials.get(e);
		if (t) return t;
		let n = (async () => {
			this.device.pushErrorScope(`validation`);
			let t, n;
			try {
				t = this.device.createShaderModule({
					label: e.label,
					code: require_webgpu_mesh_shader.nativeMeshWGSL(e.wgsl, e instanceof require_native_pbr_material.NativePBRMaterial)
				});
			} finally {
				n = this.device.popErrorScope();
			}
			let [r, i] = await Promise.all([t.getCompilationInfo(), n]), a = r.messages.filter((e) => e.type === `error`);
			if (a.length) throw new require_errors.GraphicsError(`${e.label} WGSL compilation failed: ${a.map((e) => `${e.lineNum}:${e.linePos} ${e.message}`).join(`; `)}`);
			if (i) throw new require_errors.GraphicsError(`${e.label} WGSL validation failed: ${i.message}`);
			this.device.pushErrorScope(`validation`);
			let o, u;
			try {
				o = Promise.all(this.pipelineRecipes.map((n) => this.device.createRenderPipelineAsync({
					...n,
					label: e.label,
					vertex: {
						...n.vertex,
						module: t
					},
					fragment: n.fragment ? {
						...n.fragment,
						module: t
					} : void 0,
					depthStencil: n.depthStencil ? {
						...n.depthStencil,
						depthWriteEnabled: n.depthStencil.depthWriteEnabled && (n.depthStencil.format === `depth32float` || !e.transparent)
					} : void 0
				})));
			} finally {
				u = this.device.popErrorScope();
			}
			let [d, f] = await Promise.all([o, u]).catch((t) => {
				throw new require_errors.GraphicsError(`${e.label} native 3D pipeline preparation failed.`, { cause: t });
			});
			if (f) throw new require_errors.GraphicsError(`${e.label} native 3D pipeline validation failed: ${f.message}`);
			if (e.destroyed || this.destroyed) throw new require_errors.GraphicsError(`Native material preparation was invalidated.`);
			if (e.validate(), this.cacheTexture(require_mesh.materialBaseTexture(e), !(e instanceof require_pbr_material.PBRMaterial)), e instanceof require_native_pbr_material.NativePBRMaterial) for (let t of Object.values(require_pbr_material.pbrTextureSources(e))) t && this.cacheTexture(t, !1);
			else for (let t of require_native_material3d.nativeMaterialSources(e)) this.cacheTexture(t, !1);
			let p = e.onDestroy(() => {
				this.nativeMaterials.delete(e);
				for (let [t, n] of this.meshes) t.material === e && n.allocation.destroy();
			});
			this.nativeMaterials.set(e, {
				module: t,
				pipelines: d,
				coverage: /* @__PURE__ */ new Map(),
				unsubscribe: p
			});
		})();
		this.pendingMaterials.set(e, n);
		try {
			await n;
		} finally {
			this.pendingMaterials.delete(e);
		}
	}
	prepareGpuParticles(e) {
		this.particles.prepare(e);
	}
	afterSubmit() {
		this.occlusion?.afterSubmit();
	}
	prepareMesh(e) {
		e.updateRenderDeformation(), this.cacheGeometry(e.renderGeometry), this.cacheMesh(e);
	}
	async prepareMeshAsync(e, t, n = 0) {
		if (this.destroyed) throw new require_errors.GraphicsError(`Cannot prepare on a destroyed native renderer.`);
		if (require_native_material3d.isNativeMaterial3D(e.material)) {
			await this.prepareMaterial(e.material), this.prepareMesh(e);
			return;
		}
		if (this.prepareMesh(e), n === 3) return;
		let r = e.material instanceof require_pbr_material.PBRMaterial && e.material.alphaToCoverage;
		for (; this.pendingMeshPipelines.size >= require_rendering.meshShaderVariantLimits.maxEntries;) if (await Promise.race(this.pendingMeshPipelines), this.destroyed) throw new require_errors.GraphicsError(`Mesh pipeline preparation was invalidated.`);
		let i = this.meshPipelineEntry(require_mesh_shader_variants.meshShaderFeatures(e.material, e, t), n, r);
		if (!i.pipeline && (i.pending || (i.pending = this.device.createRenderPipelineAsync(i.recipe).then((e) => {
			!this.destroyed && !i.pipeline && (i.pipeline = e);
		}).finally(() => {
			this.pendingMeshPipelines.delete(i.pending), i.pending = void 0;
		}), this.pendingMeshPipelines.add(i.pending)), await i.pending, this.destroyed)) throw new require_errors.GraphicsError(`Mesh pipeline preparation was invalidated.`);
	}
	meshPipelineEntry(e, t, n) {
		if (n && this.sampleCount < 2) throw new require_errors.GraphicsError(`Alpha-to-coverage requires renderer antialiasing.`);
		let r = `${require_mesh_shader_variants.meshShaderVariantKey(e)}:${t}:${+!!n}`, i = this.meshPipelines.get(r);
		if (i) return this.meshPipelines.delete(r), this.meshPipelines.set(r, i), i;
		let a = this.pipelineRecipes[t];
		if (!a?.fragment) throw new require_errors.GraphicsError(`Unsupported mesh pipeline pass.`);
		let o = this.device.createShaderModule({ code: require_webgpu_mesh_shader.buildWebGPUMeshShader(e) }), s = {
			...a,
			vertex: {
				...a.vertex,
				module: o
			},
			fragment: {
				...a.fragment,
				module: o,
				targets: n ? Array.from(a.fragment.targets, (e) => ({
					...e,
					blend: void 0,
					writeMask: GPUColorWrite.RED | GPUColorWrite.GREEN | GPUColorWrite.BLUE
				})) : a.fragment.targets
			},
			multisample: n ? {
				count: this.sampleCount,
				alphaToCoverageEnabled: !0
			} : a.multisample
		};
		if (this.meshPipelines.size >= require_rendering.meshShaderVariantLimits.maxEntries) {
			let e = this.meshPipelines.keys().next().value;
			e !== void 0 && this.meshPipelines.delete(e);
		}
		return i = { recipe: s }, this.meshPipelines.set(r, i), i;
	}
	unloadTexture(e) {
		if (e.kind === `image` || e.kind === `native`) {
			this.textures.get(e)?.allocation.destroy(), this.premultipliedTextures.get(e)?.allocation.destroy();
			for (let t of this.opticalTextures.values()) t.sources?.includes(e) && t.allocation.destroy();
		}
	}
	uploadEnvironment(e) {
		let t = this.environments.get(e);
		if (!t) {
			let n = e.levelSizes[0];
			if (n.width > this.device.limits.maxTextureDimension2D || n.height > this.device.limits.maxTextureDimension2D) throw new require_errors.GraphicsError(`WebGPU environment ${n.width}x${n.height} exceeds this device's texture limit.`);
			let r = this.residency.textures.allocate(e.levelSizes.reduce((e, t) => e + t.width * t.height * 8, 0), () => {
				this.environments.get(e)?.texture.destroy(), this.environments.delete(e);
			}), i;
			try {
				i = this.device.createTexture({
					size: [n.width, n.height],
					mipLevelCount: e.mipCount,
					format: `rgba16float`,
					usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
				});
				for (let t = 0; t < e.mipCount; t++) {
					let n = e.levelSizes[t];
					this.device.queue.writeTexture({
						texture: i,
						mipLevel: t
					}, e.levels[t], { bytesPerRow: n.width * 8 }, [n.width, n.height]), this.stats.upload(e.levels[t].byteLength);
				}
				t = {
					texture: i,
					allocation: r,
					view: i.createView(),
					seen: 0
				};
			} catch (e) {
				throw i?.destroy(), r.destroy(), e;
			}
			this.environments.set(e, t);
		}
		return t.allocation.touch(), t.seen = this.frame, t.view;
	}
	reflectionGroup(e) {
		let t = this.environmentView, n = this.shadowView ?? this.emptyShadowView, r = this.refractionView ?? this.dummyEnvironmentView, i = this.contactDepthBuffer ?? this.identityBuffer;
		return (!e.sceneGroup || e.sceneEnvironment !== t || e.sceneShadow !== n || e.sceneRefraction !== r || e.sceneContact !== i) && (e.sceneGroup = this.createSceneGroup(n, r, t, e.sceneBuffer, i), e.sceneEnvironment = t, e.sceneShadow = n, e.sceneRefraction = r, e.sceneContact = i), e.sceneGroup;
	}
	releaseContactDepth() {
		this.contactTexture && (this.contactTexture.destroy(), this.stats.target(-this.contactWidth * this.contactHeight * 8), this.contactTexture = void 0, this.contactView = void 0), this.contactProjection?.destroy(), this.contactProjection = void 0, this.contactProjectionGroup = void 0, this.contactDepthBuffer?.destroy(), this.contactDepthBuffer = void 0, this.contactDepthCopyGroup = void 0;
	}
	captureContactDepth(e, t, n, r) {
		let i = require_contact_shadows.ContactShadows.get(t);
		if (!i || i.strength === 0) {
			this.releaseContactDepth();
			return;
		}
		i.validate();
		let a = n * r * 4;
		if (n > this.device.limits.maxTextureDimension2D || r > this.device.limits.maxTextureDimension2D || a > this.device.limits.maxStorageBufferBindingSize || a > this.device.limits.maxBufferSize) throw new require_errors.GraphicsError(`Contact depth snapshot exceeds this WebGPU device texture/storage limits.`);
		(!this.contactTexture || this.contactWidth !== n || this.contactHeight !== r) && (this.releaseContactDepth(), this.contactTexture = this.device.createTexture({
			label: `Contact shadows camera depth (single sample)`,
			size: [n, r],
			format: `depth32float`,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
		}), this.contactView = this.contactTexture.createView(), this.contactWidth = n, this.contactHeight = r, this.stats.target(n * r * 8), this.contactDepthBuffer = this.device.createBuffer({
			label: `Contact camera depth snapshot`,
			size: n * r * 4,
			usage: GPUBufferUsage.STORAGE
		}), this.contactDepthCopy ??= this.device.createComputePipeline({
			layout: `auto`,
			compute: {
				module: this.device.createShaderModule({ code: `
            @group(0) @binding(0) var source: texture_depth_2d;
            @group(0) @binding(1) var<storage,read_write> snapshot: array<f32>;
            @compute @workgroup_size(8,8)
            fn main(@builtin(global_invocation_id) id: vec3u) {
              let size = textureDimensions(source);
              if (id.x >= size.x || id.y >= size.y) { return; }
              snapshot[id.y*size.x+id.x] = textureLoad(source,vec2i(id.xy),0);
            }
          ` }),
				entryPoint: `main`
			}
		}), this.contactDepthCopyGroup = this.device.createBindGroup({
			layout: this.contactDepthCopy.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: this.contactView
			}, {
				binding: 1,
				resource: { buffer: this.contactDepthBuffer }
			}]
		}), this.contactProjection = this.device.createBuffer({
			size: 256,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}), this.contactProjectionGroup = this.device.createBindGroup({
			layout: this.shadowPipeline.getBindGroupLayout(3),
			entries: [{
				binding: 0,
				resource: {
					buffer: this.contactProjection,
					size: 64
				}
			}]
		})), this.device.queue.writeBuffer(this.contactProjection, 0, this.sceneData.subarray(0, 16));
		let o = require_gpu_timing.beginTimedRenderPass(e, {
			label: `Contact shadows camera depth prepass`,
			colorAttachments: [],
			depthStencilAttachment: {
				view: this.contactView,
				depthClearValue: 1,
				depthLoadOp: `clear`,
				depthStoreOp: `store`
			}
		});
		try {
			o.setBindGroup(0, this.createSceneGroup(this.emptyShadowView, this.dummyEnvironmentView, this.environmentView, this.sceneBuffer, this.identityBuffer)), this.projectionOffsets[0] = 0, o.setBindGroup(3, this.contactProjectionGroup, this.projectionOffsets);
			for (let e of this.visibleDraws) {
				if (this.blendedDraw(e) || e.material instanceof require_pbr_material.PBRMaterial && e.material.transmission > 0) continue;
				let t = this.drawMesh(o, e, 3);
				this.stats.draw(e.renderGeometry.indices.length, t);
			}
		} finally {
			o.end();
		}
		let s = require_gpu_timing.beginTimedComputePass(e, { label: `Contact depth snapshot` });
		try {
			s.setPipeline(this.contactDepthCopy), s.setBindGroup(0, this.contactDepthCopyGroup), s.dispatchWorkgroups(Math.ceil(n / 8), Math.ceil(r / 8));
		} finally {
			s.end();
		}
	}
	renderShadows(e, t, n, r) {
		if (!this.shadowCache.needsRender(t, this.atlas, this.draws, this.visibility.entries, n, r)) {
			this.shadowCache.commit(), this.stats.shadowCacheHits++;
			return;
		}
		this.stats.shadowPasses++, this.shadowAttachment.view = this.shadowView;
		let i = require_gpu_timing.beginTimedRenderPass(e, this.shadowDescriptor);
		try {
			i.setPipeline(this.shadowPipeline), i.setBindGroup(0, this.shadowSceneBindGroup);
			let e = this.atlas.size / this.atlas.grid;
			for (let t = 0; t < this.atlas.count; t++) {
				let n = t % this.atlas.grid * e, r = Math.floor(t / this.atlas.grid) * e;
				i.setViewport(n, r, e, e, 0, 1), i.setScissorRect(n, r, e, e), this.projectionOffsets[0] = t * 256, i.setBindGroup(3, this.projectionGroup, this.projectionOffsets);
				for (let e of this.draws) e.castShadow && (this.drawMesh(i, e, 3), this.stats.shadowDrawCalls++);
			}
			this.shadowCache.commit();
		} finally {
			i.end(), this.shadowAttachment.view = void 0;
		}
	}
	drawMesh(e, t, n = 0) {
		let r = this.geometries.get(t.renderGeometry), i = this.meshes.get(t), a = require_native_material3d.isNativeMaterial3D(t.material) ? this.nativeMaterials.get(t.material) : void 0;
		n < 2 && (this.visibility.entries.get(t)?.fade ?? 1) < 1 && (n += 4);
		let s = n !== 3 && t.material instanceof require_pbr_material.PBRMaterial && t.material.alphaToCoverage, c;
		if (a) c = a.pipelines[n];
		else if (n === 3) c = this.shadowPipeline;
		else {
			let e = this.meshPipelineEntry(require_mesh_shader_variants.meshShaderFeatures(t.material, t, this.renderScene), n, s);
			e.pipeline ??= this.device.createRenderPipeline(e.recipe), c = e.pipeline;
		}
		if (a && s) {
			if (this.sampleCount < 2) throw new require_errors.GraphicsError(`Alpha-to-coverage requires renderer antialiasing.`);
			let e = this.pipelineRecipes[n], r = Array.from(e.fragment.targets, (e) => ({
				...e,
				blend: void 0,
				writeMask: GPUColorWrite.RED | GPUColorWrite.GREEN | GPUColorWrite.BLUE
			}));
			if (a && require_native_material3d.isNativeMaterial3D(t.material)) {
				let i = a.coverage.get(n);
				i || (i = this.device.createRenderPipeline({
					...e,
					label: t.material.label,
					vertex: {
						...e.vertex,
						module: a.module
					},
					fragment: {
						...e.fragment,
						module: a.module,
						targets: r
					},
					multisample: {
						count: this.sampleCount,
						alphaToCoverageEnabled: !0
					}
				}), a.coverage.set(n, i)), c = i;
			}
		}
		e.setPipeline(c), e.setBindGroup(1, i.bindGroup), e.setBindGroup(2, i.materialGroup);
		let l = n === 3 ? void 0 : this.visibility.entries.get(t)?.instances, u = l?.count ?? (t instanceof require_instanced_mesh.InstancedMesh ? t.count : 1);
		return e.setVertexBuffer(0, r.vertex), e.setVertexBuffer(1, l ? i.visibleInstance : i.instance), e.setVertexBuffer(2, l ? l.colors ? i.visibleColors : this.white(u) : t instanceof require_instanced_mesh.InstancedMesh && t.colors ? i.instanceColors : this.white(u)), e.setVertexBuffer(3, r.colors ?? this.white(t.geometry.vertices.length / 8)), e.setVertexBuffer(4, i.influences ?? this.defaultInfluences(t.renderGeometry.vertices.length / 8)), e.setVertexBuffer(5, r.uvs1 ?? r.vertex), e.setVertexBuffer(6, r.tangents), e.setIndexBuffer(r.index, `uint32`), e.drawIndexed(t.geometry.indices.length, u), u;
	}
	white(e) {
		if (e <= this.whiteCapacity) return this.whiteBuffer;
		let t = Math.max(e, this.whiteCapacity * 2, 1024);
		return this.retired.push(this.whiteBuffer), this.whiteBuffer = this.device.createBuffer({
			size: t * 16,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		}), this.device.queue.writeBuffer(this.whiteBuffer, 0, new Float32Array(t * 4).fill(1)), this.stats.upload(t * 16), this.whiteCapacity = t, this.whiteBuffer;
	}
	defaultInfluences(e) {
		if (this.influenceBuffer && e <= this.influenceCapacity) return this.influenceBuffer;
		let t = Math.max(e, this.influenceCapacity * 2, 1024);
		this.influenceBuffer && this.retired.push(this.influenceBuffer);
		let n = new Float32Array(t * 16);
		for (let e = 0; e < t; e++) n[e * 16 + 4] = 1;
		return this.influenceBuffer = this.device.createBuffer({
			size: n.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		}), this.device.queue.writeBuffer(this.influenceBuffer, 0, n), this.stats.upload(n.byteLength), this.influenceCapacity = t, this.influenceBuffer;
	}
	colorBuffer(e, t) {
		return e && e.size === t.byteLength ? e : (e?.destroy(), this.device.createBuffer({
			size: t.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		}));
	}
	decodeClear(e) {
		let t = this.clearComponents;
		if (`r` in e) t[0] = e.r, t[1] = e.g, t[2] = e.b, t[3] = e.a;
		else {
			let n = 0;
			for (let r of e) t[n++] = r;
		}
		for (let e = 0; e < 3; e++) {
			let n = t[e];
			t[e] = n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
		}
		return this.linearClear.r = t[0], this.linearClear.g = t[1], this.linearClear.b = t[2], this.linearClear.a = t[3], this.linearClear;
	}
	ensureMultisample(e, t, n) {
		return this.msaaView && this.msaaFormat === e && this.msaaWidth === t && this.msaaHeight === n ? this.msaaView : (this.msaaTexture?.destroy(), this.msaaTexture && this.stats.target(-this.msaaWidth * this.msaaHeight * (this.msaaFormat === `rgba16float` ? 8 : 4) * this.sampleCount), this.msaaTexture = void 0, this.msaaView = void 0, this.msaaTexture = this.device.createTexture({
			size: [t, n],
			format: e,
			sampleCount: this.sampleCount,
			usage: GPUTextureUsage.RENDER_ATTACHMENT
		}), this.stats.target(t * n * (e === `rgba16float` ? 8 : 4) * this.sampleCount), this.msaaFormat = e, this.msaaWidth = t, this.msaaHeight = n, this.msaaView = this.msaaTexture.createView(), this.msaaView);
	}
	ensureDepth(e, t) {
		this.depthTexture && this.depthWidth === e && this.depthHeight === t || (this.depthTexture?.destroy(), this.depthTexture && this.stats.target(-this.depthWidth * this.depthHeight * 4 * this.sampleCount), this.depthTexture = void 0, this.depthView = void 0, this.depthTexture = this.device.createTexture({
			size: [e, t],
			format: `depth24plus`,
			sampleCount: this.sampleCount,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
		}), this.stats.target(e * t * 4 * this.sampleCount), this.depthWidth = e, this.depthHeight = t, this.depthView = this.depthTexture.createView());
	}
	cacheGeometry(e) {
		let t = this.geometries.get(e);
		if (t) return t.allocation.resize(e.vertices.byteLength + e.indices.byteLength + e.tangents.byteLength + (e.colors?.byteLength ?? 0) + (e.uvs1?.byteLength ?? 0)), t.version !== e.version && (this.device.queue.writeBuffer(t.vertex, 0, e.vertices), this.stats.upload(e.vertices.byteLength), this.syncGeometryColors(t, e), this.syncGeometryUV(t, e), this.device.queue.writeBuffer(t.tangents, 0, e.tangents), this.stats.upload(e.tangents.byteLength), t.version = e.version), t;
		let n = this.residency.geometry.allocate(e.vertices.byteLength + e.indices.byteLength + e.tangents.byteLength + (e.colors?.byteLength ?? 0) + (e.uvs1?.byteLength ?? 0), () => {
			let t = this.geometries.get(e);
			t && (t.vertex.destroy(), t.index.destroy(), t.colors?.destroy(), t.uvs1?.destroy(), t.tangents.destroy(), this.geometries.delete(e));
		}), r;
		try {
			r = this.device.createBuffer({
				size: e.vertices.byteLength,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
			});
			let t = this.device.createBuffer({
				size: e.indices.byteLength,
				usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
			});
			try {
				let i = this.device.createBuffer({
					size: e.tangents.byteLength,
					usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
				});
				try {
					this.device.queue.writeBuffer(r, 0, e.vertices), this.stats.upload(e.vertices.byteLength), this.device.queue.writeBuffer(t, 0, e.indices), this.stats.upload(e.indices.byteLength), this.device.queue.writeBuffer(i, 0, e.tangents), this.stats.upload(e.tangents.byteLength);
					let a = {
						allocation: n,
						vertex: r,
						index: t,
						colors: void 0,
						uvs1: void 0,
						tangents: i,
						version: e.version,
						seen: this.frame
					};
					try {
						this.syncGeometryColors(a, e), this.syncGeometryUV(a, e);
					} catch (e) {
						throw a.colors?.destroy(), a.uvs1?.destroy(), e;
					}
					return this.geometries.set(e, a), a;
				} catch (e) {
					throw i.destroy(), e;
				}
			} catch (e) {
				throw t.destroy(), e;
			}
		} catch (e) {
			throw r?.destroy(), n.destroy(), e;
		}
	}
	syncGeometryColors(e, t) {
		let n = t.colors;
		n ? (e.colors = this.colorBuffer(e.colors, n), this.device.queue.writeBuffer(e.colors, 0, n), this.stats.upload(n.byteLength)) : (e.colors?.destroy(), e.colors = void 0);
	}
	syncGeometryUV(e, t) {
		let n = t.uvs1;
		n ? (e.uvs1 = this.colorBuffer(e.uvs1, n), this.device.queue.writeBuffer(e.uvs1, 0, n), this.stats.upload(n.byteLength)) : (e.uvs1?.destroy(), e.uvs1 = void 0);
	}
	cacheMesh(e) {
		let t = e.material, n = t instanceof require_pbr_material.PBRMaterial, r = n ? require_pbr_material.pbrTextureSources(t) : void 0, i = t instanceof require_native_material3d.NativeMaterial3D ? require_native_material3d.nativeMaterialSources(t) : void 0, o = this.cacheTexture(require_mesh.materialBaseTexture(t), !n).view, c = r?.metallicRoughnessTexture ? this.cacheTexture(r.metallicRoughnessTexture, !1).view : i && i[0] ? this.cacheTexture(i[0], !1).view : this.whiteView, l = r?.normalTexture ? this.cacheTexture(r.normalTexture, !1).view : i && i[1] ? this.cacheTexture(i[1], !1).view : this.whiteView, u = r?.occlusionTexture ? this.cacheTexture(r.occlusionTexture, !1).view : i && i[2] ? this.cacheTexture(i[2], !1).view : this.whiteView, d = n ? require_pbr_material.pbrEmissiveSlot(t) : void 0, f = d?.texture ? this.cacheTexture(d.texture, !1).view : i && i[3] ? this.cacheTexture(i[3], !1).view : this.whiteView, p = r?.specularTexture ? this.cacheTexture(r.specularTexture, !1).view : this.whiteView, m = r?.specularColorTexture ? this.cacheTexture(r.specularColorTexture, !1).view : this.whiteView, _ = r?.clearcoatTexture ? this.cacheTexture(r.clearcoatTexture, !1).view : this.whiteView, b = r?.clearcoatRoughnessTexture ? this.cacheTexture(r.clearcoatRoughnessTexture, !1).view : this.whiteView, C = r?.clearcoatNormalTexture ? this.cacheTexture(r.clearcoatNormalTexture, !1).view : this.whiteView, w = r?.sheenColorTexture ? this.cacheTexture(r.sheenColorTexture, !1).view : this.whiteView, T = r?.sheenRoughnessTexture ? this.cacheTexture(r.sheenRoughnessTexture, !1).view : this.whiteView, E = n ? this.cacheOpticalMaps(t) : this.emptyOpticalView, D = this.meshes.get(e), O = e instanceof require_skinned_mesh.SkinnedMesh ? e : void 0, k = O ? O.jointPalette.byteLength + O.renderGeometry.vertices.length / 8 * 64 : 0;
		if (D && (D.allocation.resize(D.uniform.size + D.sceneBuffer.size + (D.visibleInstance?.size ?? 0) + (D.visibleColors?.size ?? 0) + k + (e instanceof require_instanced_mesh.InstancedMesh ? e.matrices.byteLength + Math.max(D.instanceColors?.size ?? 0, e.colors?.byteLength ?? 0) : 0)), O && D.paletteVersion !== O.paletteVersion && (this.device.queue.writeBuffer(D.palette, 0, O.jointPalette), this.stats.upload(O.jointPalette.byteLength), D.paletteVersion = O.paletteVersion), D.textureEpoch === this.textureEpoch && D.material === t)) return D;
		let A = D?.allocation ?? this.residency.geometry.allocate($ * 4 + this.sceneData.byteLength + k + (e instanceof require_instanced_mesh.InstancedMesh ? e.matrices.byteLength + (e.colors?.byteLength ?? 0) : 0), () => {
			let t = this.meshes.get(e);
			t && (t.uniform.destroy(), t.sceneBuffer.destroy(), t.visibleInstance?.destroy(), t.visibleColors?.destroy(), t.instanceColors?.destroy(), t.palette?.destroy(), t.influences?.destroy(), t.instance !== this.identityBuffer && t.instance.destroy(), this.meshes.delete(e));
		}), j = D?.uniform, M = D?.instance ?? this.identityBuffer, N = D?.instanceColors, P = D?.palette, F = D?.influences;
		try {
			if (j ??= this.device.createBuffer({
				size: $ * 4,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
			}), !D && O) {
				if (O.jointPalette.byteLength > this.device.limits.maxStorageBufferBindingSize) throw new require_errors.GraphicsError(`Skin palette exceeds the WebGPU storage buffer limit.`);
				P = this.device.createBuffer({
					size: O.jointPalette.byteLength,
					usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
				});
				let e = O.renderGeometry.vertices.length / 8, t = /* @__PURE__ */ new ArrayBuffer(e * 64), n = new Uint32Array(t), r = new Float32Array(t);
				for (let t = 0; t < e; t++) for (let e = 0; e < O.influencesPerVertex; e++) {
					let i = t * O.influencesPerVertex + e, a = t * 16 + (e < 4 ? e : e + 4);
					n[a] = O.jointIndices[i], r[a + 4] = O.weights[i];
				}
				F = this.device.createBuffer({
					size: t.byteLength,
					usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
				}), this.device.queue.writeBuffer(P, 0, O.jointPalette), this.device.queue.writeBuffer(F, 0, t), this.stats.upload(O.jointPalette.byteLength + t.byteLength);
			}
			!D && e instanceof require_instanced_mesh.InstancedMesh && (M = this.device.createBuffer({
				size: e.matrices.byteLength,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
			}), this.device.queue.writeBuffer(M, 0, e.matrices), this.stats.upload(e.matrices.byteLength), e.colors && (N = this.colorBuffer(void 0, e.colors), this.device.queue.writeBuffer(N, 0, e.colors), this.stats.upload(e.colors.byteLength)));
			let r = D?.bindGroup ?? this.device.createBindGroup({
				layout: this.meshLayout,
				entries: [{
					binding: 0,
					resource: { buffer: j }
				}, {
					binding: 1,
					resource: { buffer: P ?? this.identityBuffer }
				}]
			}), i = this.device.createBindGroup({
				layout: this.materialLayout,
				entries: [
					{
						binding: 0,
						resource: o
					},
					{
						binding: 1,
						resource: this.cacheSampler(t.textureSampler)
					},
					{
						binding: 2,
						resource: c
					},
					{
						binding: 3,
						resource: l
					},
					{
						binding: 4,
						resource: u
					},
					{
						binding: 5,
						resource: f
					},
					{
						binding: 6,
						resource: n ? this.cacheSampler(t.metallicRoughnessSampler) : this.sampler
					},
					{
						binding: 7,
						resource: n ? this.cacheSampler(t.normalSampler) : this.sampler
					},
					{
						binding: 8,
						resource: n ? this.cacheSampler(t.occlusionSampler) : this.sampler
					},
					{
						binding: 9,
						resource: n ? this.cacheSampler(t.emissiveSampler) : this.sampler
					},
					{
						binding: 10,
						resource: p
					},
					{
						binding: 11,
						resource: m
					},
					{
						binding: 12,
						resource: n ? this.cacheSampler(t.specularSampler) : this.sampler
					},
					{
						binding: 13,
						resource: n ? this.cacheSampler(t.specularColorSampler) : this.sampler
					},
					{
						binding: 14,
						resource: _
					},
					{
						binding: 15,
						resource: b
					},
					{
						binding: 16,
						resource: C
					},
					{
						binding: 17,
						resource: n ? this.cacheSampler(t.clearcoatSampler) : this.sampler
					},
					{
						binding: 18,
						resource: n ? this.cacheSampler(t.clearcoatRoughnessSampler) : this.sampler
					},
					{
						binding: 19,
						resource: n ? this.cacheSampler(t.clearcoatNormalSampler) : this.sampler
					},
					{
						binding: 20,
						resource: w
					},
					{
						binding: 21,
						resource: T
					},
					{
						binding: 22,
						resource: n ? this.cacheSampler(t.sheenColorSampler) : this.sampler
					},
					{
						binding: 23,
						resource: n ? this.cacheSampler(t.sheenRoughnessSampler) : this.sampler
					},
					{
						binding: 24,
						resource: E
					}
				]
			}), a = D ?? {
				uniform: j,
				allocation: A,
				textureEpoch: this.textureEpoch,
				bindGroup: r,
				materialGroup: i,
				material: t,
				environment: void 0,
				instance: M,
				instanceVersion: e instanceof require_instanced_mesh.InstancedMesh ? e.version : 0,
				instanceColors: N,
				instanceColorVersion: e instanceof require_instanced_mesh.InstancedMesh ? e.colorVersion : 0,
				palette: P,
				influences: F,
				paletteVersion: O?.paletteVersion ?? 0,
				data: new Float32Array($),
				sceneBuffer: this.device.createBuffer({
					size: this.sceneData.byteLength,
					usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
				}),
				seen: this.frame
			};
			return a.textureEpoch = this.textureEpoch, a.material = t, a.materialGroup = i, this.meshes.set(e, a), a;
		} catch (e) {
			throw D || (j?.destroy(), N?.destroy(), P?.destroy(), F?.destroy(), M !== this.identityBuffer && M.destroy(), A.destroy()), e;
		}
	}
	cacheSampler(e) {
		let t = e?.minFilter ?? `linear`, n = e?.magFilter ?? `linear`, r = e?.addressModeU ?? `clamp-to-edge`, i = e?.addressModeV ?? `clamp-to-edge`, a = e?.mipmapFilter ?? `linear`, o = e?.lodMinClamp ?? 0, s = e?.lodMaxClamp ?? 32, c = e?.maxAnisotropy ?? 1;
		if (!e) return this.sampler;
		let l = `${t}/${n}/${a}/${r}/${i}/${o}/${s}/${c}`, u = this.samplers.get(l);
		if (u) return u;
		let d = this.device.createSampler({
			minFilter: t,
			magFilter: n,
			mipmapFilter: a,
			lodMinClamp: o,
			lodMaxClamp: s,
			maxAnisotropy: c,
			addressModeU: r,
			addressModeV: i
		});
		return this.samplers.set(l, d), d;
	}
	cacheOpticalMaps(e) {
		let t = require_optical_maps.opticalMapSources(e);
		if (!t.some(Boolean)) return this.opticalTextures.get(e)?.allocation.destroy(), this.emptyOpticalView;
		if (t.some((e) => e?.destroyed)) throw new require_errors.GraphicsError(`WebGPU optical map has been destroyed.`);
		let n = this.opticalTextures.get(e), r = t.map((e) => e?.version ?? -1);
		if (n && t.every((e, t) => n.sources?.[t] === e && n.sourceVersions?.[t] === r[t])) return n.allocation.touch(), n.seen = this.frame, n.view;
		let i = Math.ceil(Math.sqrt(Math.max(...t.map((e) => e ? e.width * e.height : 1))));
		n && n.resource.width !== i && (n.allocation.destroy(), n = void 0);
		let a = n?.allocation ?? this.residency.textures.allocate(i * i * 20, () => {
			this.opticalTextures.get(e)?.resource.destroy(), this.opticalTextures.delete(e), this.textureEpoch++;
		}), o = n?.resource;
		try {
			o ??= this.device.createTexture({
				size: [
					i,
					i,
					5
				],
				format: `rgba8unorm`,
				usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
			});
			let s = n?.view ?? o.createView({ dimension: `2d-array` }), c = this.device.createCommandEncoder();
			for (let e = 0; e < 5; e++) {
				let n = t[e];
				if (!n) continue;
				let r = this.device.createBindGroup({
					layout: this.opticalPackLayout,
					entries: [{
						binding: 0,
						resource: this.cacheTexture(n, !1).view
					}, {
						binding: 1,
						resource: s
					}]
				}), a = require_gpu_timing.beginTimedComputePass(c, {});
				a.setPipeline(e === 0 ? this.transmissionPack : e === 1 ? this.thicknessPack : Q.get(this.device)[e - 2]), a.setBindGroup(0, r), a.dispatchWorkgroups(Math.ceil(i / 8), Math.ceil(i / 8)), a.end();
			}
			return this.device.queue.submit([c.finish()]), this.opticalTextures.set(e, {
				resource: o,
				allocation: a,
				view: s,
				seen: this.frame,
				sourceVersions: r,
				sources: t
			}), n || this.textureEpoch++, a.touch(), s;
		} catch (e) {
			throw o?.destroy(), a.destroy(), e;
		}
	}
	cacheTexture(e, t) {
		if (e.destroyed) throw new require_errors.GraphicsError(`WebGPU material map has been destroyed.`);
		let n = t ? this.premultipliedTextures : this.textures, r = n.get(e);
		if (r && r.resource.width === e.width && r.resource.height === e.height) return r.allocation.touch(), r.seen = this.frame, r.version !== e.version && (e instanceof require_native_texture.NativeTexture2D ? require_native_texture_upload.uploadNativeWebGPU(this.device, r.resource, e) : this.device.queue.copyExternalImageToTexture({ source: e.image }, {
			texture: r.resource,
			premultipliedAlpha: t
		}, [e.width, e.height]), r.version = e.version, this.stats.upload(e instanceof require_native_texture.NativeTexture2D ? e.byteLength : e.width * e.height * 4)), r;
		r?.allocation.destroy();
		let { width: i, height: a } = e, o = this.device.limits.maxTextureDimension2D;
		if (!Number.isSafeInteger(i) || !Number.isSafeInteger(a) || i < 1 || a < 1 || i > o || a > o) throw new require_errors.GraphicsError(`WebGPU texture size ${i}×${a} exceeds this device's maximum texture dimension of ${o} pixels per side.`);
		let s = e instanceof require_native_texture.NativeTexture2D;
		s && require_native_texture_upload.validateNativeWebGPU(this.device, e);
		let c = s ? e.byteLength : i * a * 4, l = this.residency.textures.allocate(c, () => {
			n.get(e)?.resource.destroy(), n.delete(e), this.textureEpoch++;
		}), u;
		try {
			u = this.device.createTexture({
				size: [i, a],
				mipLevelCount: s ? e.levels.length : 1,
				format: s ? require_native_texture_upload.nativeUploadFormat(e.format) : `rgba8unorm`,
				usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | (s ? 0 : GPUTextureUsage.RENDER_ATTACHMENT)
			}), s ? require_native_texture_upload.uploadNativeWebGPU(this.device, u, e) : this.device.queue.copyExternalImageToTexture({ source: e.image }, {
				texture: u,
				premultipliedAlpha: t
			}, [i, a]), this.stats.upload(c);
			let r = {
				resource: u,
				allocation: l,
				view: u.createView(),
				seen: this.frame,
				version: e.version
			};
			return n.set(e, r), this.textureEpoch++, r;
		} catch (e) {
			throw u?.destroy(), l.destroy(), e;
		}
	}
	updateMesh(e, t, n) {
		let r = t.material, i = n.data;
		i.set(t.worldMatrix.elements, 0), i[16] = r.color[0], i[17] = r.color[1], i[18] = r.color[2], i[19] = r.opacity, r instanceof require_pbr_material.PBRMaterial ? (i[20] = 1, i[21] = r.metallic, i[22] = r.roughness, i[23] = r.normalScale, i[24] = r.emissive[0], i[25] = r.emissive[1], i[26] = r.emissive[2], i[27] = r.occlusionStrength, i[28] = +!!require_pbr_material.pbrTextureSources(r).metallicRoughnessTexture, i[29] = +!!require_pbr_material.pbrTextureSources(r).normalTexture, i[30] = +!!require_pbr_material.pbrTextureSources(r).occlusionTexture, i[31] = require_pbr_material.pbrEmissiveSlot(r).mode, i[32] = r.alphaCutoff, i[33] = +!!r.doubleSided, i[36] = r.specularColor[0], i[37] = r.specularColor[1], i[38] = r.specularColor[2], i[39] = r.ior === 0 ? 1 : ((r.ior - 1) / (r.ior + 1)) ** 2, i[40] = r.specular, i[41] = +(r.ior === 0), i[42] = +!!require_pbr_material.pbrTextureSources(r).specularTexture, i[43] = +!!require_pbr_material.pbrTextureSources(r).specularColorTexture, i[44] = r.clearcoat, i[45] = r.clearcoatRoughness, i[46] = r.clearcoatNormalScale, i[48] = +!!require_pbr_material.pbrTextureSources(r).clearcoatTexture, i[49] = +!!require_pbr_material.pbrTextureSources(r).clearcoatRoughnessTexture, i[50] = +!!require_pbr_material.pbrTextureSources(r).clearcoatNormalTexture, i[52] = r.sheenColor[0], i[53] = r.sheenColor[1], i[54] = r.sheenColor[2], i[55] = r.sheenRoughness, i[56] = +!!require_pbr_material.pbrTextureSources(r).sheenColorTexture, i[57] = +!!require_pbr_material.pbrTextureSources(r).sheenRoughnessTexture, i[58] = r.specularAntiAliasing, i[59] = +!!r.alphaToCoverage, i[60] = r.transmission, i[61] = r.thickness, i[62] = 1 / r.attenuationDistance, i[63] = r.ior, i[64] = r.attenuationColor[0], i[65] = r.attenuationColor[1], i[66] = r.attenuationColor[2], require_optical_maps.fillOpticalMapSettings(i, 68, require_pbr_material.pbrTextureSources(r).transmissionTexture, r.transmissionSampler), require_optical_maps.fillOpticalMapSettings(i, 72, require_pbr_material.pbrTextureSources(r).thicknessTexture, r.thicknessSampler), i[35] = r.alphaMode === `OPAQUE` ? 0 : r.alphaMode === `MASK` ? 1 : 2) : (i[20] = 0, i[32] = 0, i[33] = 1), i[34] = +!!t.receiveShadow, i[47] = +(t instanceof require_skinned_mesh.SkinnedMesh), i[51] = +(require_mesh.materialBaseTexture(r).kind === `native`);
		let a = 336;
		require_native_material3d.isNativeMaterial3D(r) && i.set(r.uniforms, a);
		let s = this.visibility.entries.get(t);
		i[a + require_rendering.nativeMaterial3DLimits.uniformFloats] = s?.fade ?? 1, i[a + require_rendering.nativeMaterial3DLimits.uniformFloats + 1] = t.renderGeometry.tangentTexCoord, i[a + require_rendering.nativeMaterial3DLimits.uniformFloats + 2] = t.renderGeometry.tangentConvention === `gltf` ? -1 : 1, require_material_uv.fillMaterialUV(r, t.renderGeometry, i, a + require_rendering.nativeMaterial3DLimits.uniformFloats + 4), r instanceof require_pbr_material.PBRMaterial ? require_pbr_material.fillPBRFinish(r, i, $ - 16 - 40 - 20) : i.fill(0, $ - 16 - 40 - 20, $ - 16 - 40), require_baked_lighting.fillMeshIrradiance(t, i, $ - 16 - 40), r instanceof require_pbr_material.PBRMaterial ? require_optical_maps.fillMappedOpticalSettings(r, i, $ - 16) : i.fill(0, $ - 16);
		let c = s?.instances;
		c && (c !== n.visibilityPayload || c.version !== n.visibilityVersion) && (n.allocation.resize(n.uniform.size + n.sceneBuffer.size + n.instance.size + (n.instanceColors?.size ?? 0) + (n.palette?.size ?? 0) + (n.influences?.size ?? 0) + c.matrices.byteLength + (c.colors?.byteLength ?? 0)), (!n.visibleInstance || n.visibleInstance.size < c.matrices.byteLength) && (n.visibleInstance && this.retired.push(n.visibleInstance), n.visibleInstance = this.device.createBuffer({
			size: c.matrices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		})), this.device.queue.writeBuffer(n.visibleInstance, 0, c.matrices.buffer, c.matrices.byteOffset, c.count * 16 * 4), this.stats.upload(c.count * 16 * 4), c.colors && (n.visibleColors = this.colorBuffer(n.visibleColors, c.colors), this.device.queue.writeBuffer(n.visibleColors, 0, c.colors.buffer, c.colors.byteOffset, c.count * 3 * 4), this.stats.upload(c.count * 3 * 4)), n.visibilityVersion = c.version, n.visibilityPayload = c), require_render_data.fillProbeBlendData(e, i, 76, this.selectedProbes);
		for (let e = 0; e < 5; e++) i[76 + e * 52 + 38] = this.probeMipCount - 1;
		t instanceof require_instanced_mesh.InstancedMesh && n.instanceVersion !== t.version && (this.device.queue.writeBuffer(n.instance, 0, t.matrices), this.stats.upload(t.matrices.byteLength), n.instanceVersion = t.version), t instanceof require_instanced_mesh.InstancedMesh && t.colors && (n.instanceColors === void 0 || n.instanceColorVersion !== t.colorVersion) && (n.instanceColors = this.colorBuffer(n.instanceColors, t.colors), this.device.queue.writeBuffer(n.instanceColors, 0, t.colors), this.stats.upload(t.colors.byteLength), n.instanceColorVersion = t.colorVersion), this.device.queue.writeBuffer(n.uniform, 0, i), this.stats.upload(i.byteLength);
	}
	releaseUnused() {
		if (this.residency.geometry.budgetBytes === 1 / 0) {
			for (let e of this.geometries.values()) e.seen !== this.frame && !e.allocation.references && e.allocation.destroy();
			for (let e of this.meshes.values()) e.seen !== this.frame && !e.allocation.references && e.allocation.destroy();
		}
		for (let [e, t] of this.environments) (e.destroyed || this.residency.textures.budgetBytes === 1 / 0 && t.seen !== this.frame && !t.allocation.references) && t.allocation.destroy();
		this.releaseUnusedTextures(this.textures), this.releaseUnusedTextures(this.premultipliedTextures);
		for (let e of this.opticalTextures.values()) (e.sources?.some((e) => e?.destroyed) || this.residency.textures.budgetBytes === 1 / 0 && e.seen !== this.frame && !e.allocation.references) && e.allocation.destroy();
	}
	releaseUnusedTextures(e) {
		for (let [t, n] of e) (t.destroyed || this.residency.textures.budgetBytes === 1 / 0 && n.seen !== this.frame && !n.allocation.references) && n.allocation.destroy();
	}
	destroy() {
		this.destroyed = !0, this.probeAllocation?.destroy(), this.temporal.destroy();
		for (let e of this.nativeMaterials.values()) e.unsubscribe();
		this.nativeMaterials.clear(), this.meshPipelines.clear(), this.pendingMeshPipelines.clear(), this.pendingMaterials.clear(), this.renderScene = void 0, this.visibilityCache.clear(), this.visibility.entries.clear(), this.gathered.clear(), this.occlusion?.destroy(), this.particles.destroy(), this.oit.release(), this.post.destroy(), this.depthTexture && this.stats.target(-this.depthWidth * this.depthHeight * 4 * this.sampleCount), this.msaaTexture && this.stats.target(-this.msaaWidth * this.msaaHeight * (this.msaaFormat === `rgba16float` ? 8 : 4) * this.sampleCount), this.shadowTexture && this.stats.target(-this.shadowSize * this.shadowSize * 4), this.refractionTexture && this.stats.target(-this.refractionWidth * this.refractionHeight * 8), this.releaseContactDepth(), this.depthTexture?.destroy(), this.msaaTexture?.destroy(), this.msaaTexture = void 0, this.msaaView = void 0, this.depthTexture = void 0, this.depthView = void 0, this.shadowTexture?.destroy(), this.shadowTexture = void 0, this.shadowView = void 0, this.sceneBuffer.destroy(), this.shadowBuffer.destroy(), this.sheenBuffer.destroy(), this.brdfBuffer.destroy(), this.projectionBuffer.destroy(), this.whiteTexture.destroy(), this.emptyShadow.destroy(), this.refractionTexture?.destroy(), this.refractionTexture = void 0, this.refractionView = void 0, this.emptyOptical.destroy();
		for (let e of this.opticalTextures.values()) e.resource.destroy();
		this.opticalTextures.clear(), this.identityBuffer.destroy(), this.whiteBuffer.destroy(), this.influenceBuffer?.destroy();
		for (let e of this.retired.splice(0)) e.destroy();
		for (let e of this.geometries.values()) e.vertex.destroy(), e.index.destroy(), e.colors?.destroy();
		this.geometries.clear();
		for (let e of this.meshes.values()) e.uniform.destroy(), e.instanceColors?.destroy(), e.palette?.destroy(), e.influences?.destroy(), e.instance !== this.identityBuffer && e.instance.destroy();
		this.meshes.clear();
		for (let e of this.textures.values()) e.resource.destroy();
		for (let e of this.environments.values()) e.texture.destroy();
		this.environments.clear(), this.dummyEnvironment.destroy();
		for (let e of this.premultipliedTextures.values()) e.resource.destroy();
		this.textures.clear(), this.premultipliedTextures.clear(), this.draws.length = 0, this.samplers.clear();
	}
};
//#endregion
exports.WebGPUMeshPipeline = WebGPUMeshPipeline;

//# sourceMappingURL=webgpu-mesh-pipeline.cjs.map