const require_defaults = require("../../../src/data/defaults.cjs");
const require_errors = require("./errors.cjs");
const require_native_texture = require("../../assets/src/native-texture.cjs");
const require_math3d = require("../../math/src/math3d.cjs");
const require_material2d = require("../../core/src/materials2d/material2d.cjs");
const require_mesh = require("../../core/src/mesh.cjs");
const require_geometry2d = require("../../core/src/rendering2d/geometry2d.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
const require_native_pbr_material = require("../../core/src/native-pbr-material.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_orthographic_camera = require("../../core/src/orthographic-camera.cjs");
const require_frustum = require("../../core/src/frustum.cjs");
const require_instanced_mesh = require("../../core/src/instanced-mesh.cjs");
const require_skinned_mesh = require("../../core/src/skinned-mesh.cjs");
const require_render_visibility = require("../../core/src/render-visibility.cjs");
const require_render2d_contract = require("./render2d-contract.cjs");
const require_render_stats = require("./render-stats.cjs");
const require_gpu_timing = require("./gpu-timing.cjs");
const require_residency = require("./residency.cjs");
const require_preparation = require("./preparation.cjs");
const require_shaders = require("./webgl-2d/shaders.cjs");
const require_webgl2_render_graph = require("./webgl2-render-graph.cjs");
const require_sheen = require("../../../src/data/sheen.cjs");
const require_brdf = require("../../../src/data/brdf.cjs");
const require_oit_shaders = require("./oit-shaders.cjs");
const require_webgl_feature_shaders = require("./webgl-feature-shaders.cjs");
const require_webgl2_particles3d = require("./webgl2-particles3d.cjs");
const require_webgl_occlusion = require("./webgl-occlusion.cjs");
const require_draw_order = require("../../core/src/draw-order.cjs");
const require_render_data = require("../../core/src/render-data.cjs");
const require_shadow_atlas = require("../../core/src/shadow-atlas.cjs");
const require_fxaa_shaders = require("./fxaa-shaders.cjs");
const require_optical_pack_shaders = require("./optical-pack-shaders.cjs");
const require_optical_maps = require("./optical-maps.cjs");
const require_native_texture_upload = require("./native-texture-upload.cjs");
const require_webgl2_render2d_shaders = require("./webgl2-render2d-shaders.cjs");
const require_webgl2_render2d = require("./webgl2-render2d.cjs");
const require_material_uv = require("./material-uv.cjs");
const require_shadow_cache = require("./shadow-cache.cjs");
const require_native_material_limits = require("./native-material-limits.cjs");
const require_reflection_capture = require("./reflection-capture.cjs");
const require_probe_texture_array = require("./probe-texture-array.cjs");
const require_temporal_post = require("./temporal-post.cjs");
const require_webgl_temporal_pipeline = require("./webgl-temporal-pipeline.cjs");
//#region dist/packages/graphics/src/webgl2-renderer.js
var WebGLSnapshot = class {
	width;
	height;
	backend = `webgl2`;
	release;
	constructor(e, t, n) {
		this.width = e, this.height = t, this.release = n;
	}
	get destroyed() {
		return !this.release;
	}
	destroy() {
		let e = this.release;
		this.release = void 0, e?.();
	}
};
var WebGL2Renderer = class {
	onError;
	antialias;
	backend = `webgl2`;
	canvas;
	gl;
	graphs;
	async prepareRenderGraph(e, t) {
		return this.requireGL(), this.graphs.prepare(e, t);
	}
	async prepareCompute() {
		throw new require_errors.UnsupportedGraphicsError(`WebGL2 does not support compute.`);
	}
	uploadCompute() {
		throw new require_errors.UnsupportedGraphicsError(`WebGL2 does not support compute.`);
	}
	async dispatchCompute() {
		throw new require_errors.UnsupportedGraphicsError(`WebGL2 does not support compute.`);
	}
	async readCompute() {
		throw new require_errors.UnsupportedGraphicsError(`WebGL2 does not support compute.`);
	}
	triangleProgram;
	meshProgram;
	triangleVAO;
	commands = new require_render2d_contract.RenderCommandBuffer2D();
	textures = /* @__PURE__ */ new Map();
	render2D;
	geometries = /* @__PURE__ */ new Map();
	frame = 0;
	activeFrame = !1;
	frameRendered = !1;
	destroyed = !1;
	lostError;
	frustum = new require_frustum.Frustum();
	visibilityCache = new require_render_visibility.RenderVisibilityCache();
	visibility = new require_render_visibility.RenderVisibilitySet();
	visibilityOptions = {};
	occlusion;
	particles3D;
	depthTextureVersions = /* @__PURE__ */ new WeakMap();
	depthRevision = 0;
	depthWidth = 0;
	depthHeight = 0;
	depthMode = -1;
	isColorBlended = (e) => e.material instanceof require_pbr_material.PBRMaterial && e.material.alphaToCoverage ? !1 : (this.visibility.entries.get(e)?.fade ?? 1) < 1 || require_draw_order.isBlended(e);
	drawSorter = new require_draw_order.DrawSorter();
	stats = new require_render_stats.FrameStats();
	gpuTimingEnabled;
	gpuTimer;
	residency = new require_residency.NativeResidency();
	preparedGeometry = /* @__PURE__ */ new Set();
	probeCaptures = new require_reflection_capture.ProbeCaptureScheduler();
	capturingProbe = !1;
	async captureReflectionProbe(e, t, n = {}) {
		let r = this.requireGL();
		if (this.capturingProbe) throw new require_errors.GraphicsError(`A reflection capture is already active.`);
		if (this.activeFrame && this.frameRendered) throw new require_errors.GraphicsError(`Capture must precede rendering or follow endFrame.`);
		if (!this.floatColorBuffer) throw new require_errors.GraphicsError(`Reflection capture requires EXT_color_buffer_float.`);
		let { size: i } = require_reflection_capture.captureConfiguration(t, n), a = this.postTarget, o = this.refractionTarget, s = r.getParameter(r.FRAMEBUFFER_BINDING), c = r.getParameter(r.VIEWPORT), l = this.linear3D, u = this.hasTransmission, d = this.weighted, f = this.coverageActive, p = this.createTarget(i, i, !1, `hdr`, `texture`), m = [];
		this.capturingProbe = !0;
		try {
			return this.postTarget = p, this.refractionTarget = void 0, require_reflection_capture.encodeProbeFaces(e, t, n, () => {
				this.collectMeshes(e, 1, i), this.linear3D = !0, e.lightSelection.update(e), this.atlas.update(e, 1), r.bindBuffer(r.UNIFORM_BUFFER, this.shadowBuffer), r.bufferSubData(r.UNIFORM_BUFFER, 0, this.atlas.data), e.shadows.enabled && this.drawShadows(e), this.hasTransmission && this.prepareRefractionTarget(i, i), this.weighted && this.prepareOIT(i, i), r.bindFramebuffer(r.FRAMEBUFFER, p.framebuffer), r.disable(r.SCISSOR_TEST), r.viewport(0, 0, i, i), r.clearColor(0, 0, 0, 1), r.depthMask(!0), r.clearDepth(1), this.coverageActive || r.clear(r.COLOR_BUFFER_BIT | r.DEPTH_BUFFER_BIT), r.enable(r.BLEND), r.blendFunc(r.ONE, r.ONE_MINUS_SRC_ALPHA), this.drawMeshes(e, 1), r.bindFramebuffer(r.FRAMEBUFFER, p.framebuffer);
				let t = r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE);
				if (r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT) !== r.RGBA || t !== r.FLOAT && t !== r.HALF_FLOAT) throw new require_errors.GraphicsError(`Native HDR reflection readback is unsupported by this context.`);
				let n = t === r.FLOAT ? new Float32Array(i * i * 4) : new Uint16Array(i * i * 4);
				r.readPixels(0, 0, i, i, r.RGBA, t, n);
				let a = new Float32Array(n.length);
				for (let e = 0; e < i; e++) for (let o = 0; o < i * 4; o++) {
					let s = n[(i - e - 1) * i * 4 + o];
					a[e * i * 4 + o] = Math.max(0, t === r.FLOAT ? s : require_reflection_capture.halfFloat(s));
				}
				m.push(a);
			}), this.requireGL(), require_reflection_capture.capturedEnvironment(i, m, n.signal);
		} finally {
			this.deleteTarget(p), this.refractionTarget && this.deleteTarget(this.refractionTarget), this.postTarget = a, this.refractionTarget = o, this.linear3D = l, this.hasTransmission = u, this.weighted = d, this.coverageActive = f, this.capturingProbe = !1, this.occlusion?.clear(), r.bindFramebuffer(r.FRAMEBUFFER, s), r.viewport(c[0], c[1], c[2], c[3]);
		}
	}
	configureResidency(e) {
		if (this.activeFrame) throw new require_errors.GraphicsError(`Cannot change residency budgets during an active frame.`);
		this.residency.configure(e);
	}
	retainFrameResources() {
		return this.requireGL(), require_preparation.residencyLease(this.residency.retainFrameResources());
	}
	async prepareGeometry(e) {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`Cannot prepare geometry during an active frame.`);
		let t = e instanceof require_geometry2d.Geometry2D ? this.render2D.prepareGeometry(e) : this.cacheGeometry(e).allocation;
		this.preparedGeometry.has(t) || (t.retain(), this.preparedGeometry.add(t)), this.gl.flush();
	}
	async prepareGpuParticles(e) {
		let t = this.requireGL();
		if (this.activeFrame) throw new require_errors.GraphicsError(`Cannot prepare GPU particles during an active frame.`);
		(this.particles3D ??= new require_webgl2_particles3d.WebGL2Particles3D(t, this.stats)).prepare(e), t.flush();
	}
	unloadGeometry(e) {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`Cannot unload geometry during an active frame.`);
		e instanceof require_geometry2d.Geometry2D ? this.render2D.unloadGeometry(e) : this.geometries.get(e)?.allocation.destroy();
		for (let e of this.preparedGeometry) e.destroyed && this.preparedGeometry.delete(e);
	}
	async prepareResource(e, t) {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`Cannot prepare resources during an active frame.`);
		return require_preparation.prepareNativeResource(this.residency, e, {
			texture: (e) => {
				e.kind === `render` ? this.render2D.source(e) : this.cacheTexture(e);
			},
			geometry: (e) => {
				e instanceof require_geometry2d.Geometry2D ? this.render2D.prepareGeometry(e) : this.cacheGeometry(e);
			},
			particles: (e) => {
				this.render2D.prepareParticles(e);
				for (let t = 0; t < e.activeCount; t++) {
					let n = e.getSlot(e.activeSlotAt(t)).texture;
					n.kind === `render` ? this.render2D.source(n) : this.cacheTexture(n);
				}
			},
			mesh: (e) => {
				e.updateRenderDeformation(), this.cacheGeometry(e.renderGeometry), e instanceof require_skinned_mesh.SkinnedMesh && this.cacheSkin(e);
				let t = e.material;
				if (this.cacheTexture(require_mesh.materialBaseTexture(t)), t instanceof require_pbr_material.PBRMaterial) {
					let e = require_pbr_material.pbrTextureSources(t);
					e.metallicRoughnessTexture && this.cacheTexture(e.metallicRoughnessTexture), e.normalTexture && this.cacheTexture(e.normalTexture), e.occlusionTexture && this.cacheTexture(e.occlusionTexture), e.emissiveTexture && this.cacheTexture(e.emissiveTexture), t.lightmap && this.cacheTexture(t.lightmap), e.specularTexture && this.cacheTexture(e.specularTexture), e.specularColorTexture && this.cacheTexture(e.specularColorTexture), e.clearcoatTexture && this.cacheTexture(e.clearcoatTexture), e.clearcoatRoughnessTexture && this.cacheTexture(e.clearcoatRoughnessTexture), e.clearcoatNormalTexture && this.cacheTexture(e.clearcoatNormalTexture), e.sheenColorTexture && this.cacheTexture(e.sheenColorTexture), e.sheenRoughnessTexture && this.cacheTexture(e.sheenRoughnessTexture), e.transmissionTexture && this.cacheTexture(e.transmissionTexture), e.thicknessTexture && this.cacheTexture(e.thicknessTexture), this.cacheOpticalMaps(t);
				}
				e instanceof require_instanced_mesh.InstancedMesh && this.cacheInstances(e);
			},
			environment: (e) => {
				this.uploadEnvironment(e);
			},
			material: (e) => this.prepareMaterial(e),
			gpuParticles: (e) => this.prepareGpuParticles(e),
			post: (e) => this.preparePostProcessor(e),
			complete: async () => {
				this.requireGL().flush();
			}
		}, t);
	}
	targetBytes = /* @__PURE__ */ new WeakMap();
	maxTextureSize = 0;
	anisotropyExtension = null;
	maxTextureAnisotropy = 1;
	textureAnisotropy = Object.freeze({
		maxRequest: 16,
		maxEffective: 1
	});
	maxWidth = 0;
	maxHeight = 0;
	viewportX = 0;
	viewportY = 0;
	viewportSide = 1;
	shadowProgram;
	postProgram;
	skyProgram;
	skyVAO;
	skyUniforms = {};
	environments = /* @__PURE__ */ new Map();
	environmentData = /* @__PURE__ */ new Float32Array(260);
	environmentLightingData = this.environmentData.subarray(0, 40);
	selectedProbes = [];
	probeMaps = [];
	probeTexture;
	probeAllocation;
	probeMipCount = 1;
	probeData = this.environmentData.subarray(52);
	temporalState = new require_temporal_post.TemporalPostState();
	temporal;
	temporalActive = !1;
	fogData = /* @__PURE__ */ new Float32Array(8);
	invViewProjection = new require_math3d.Matrix4();
	meshUniforms = {};
	shadowUniforms = {};
	postUniforms = {};
	lightingData = /* @__PURE__ */ new Float32Array(812);
	tintData = /* @__PURE__ */ new Float32Array(4);
	materialUVData = new Float32Array(require_rendering.MATERIAL_UV_FLOAT_COUNT);
	meshInstances = /* @__PURE__ */ new Map();
	visibleMeshInstances = /* @__PURE__ */ new Map();
	meshSkins = /* @__PURE__ */ new Map();
	samplers = /* @__PURE__ */ new Map();
	supportedTextureFormats = [];
	atlas = new require_shadow_atlas.ShadowAtlas();
	shadowCache = new require_shadow_cache.ShadowCache();
	shadowBuffer;
	sheenBuffer;
	brdfBuffer;
	opticalTextures = /* @__PURE__ */ new Map();
	opticalSettings = /* @__PURE__ */ new Float32Array(8);
	emptyOptical;
	opticalPackProgram;
	opticalPackFramebuffer;
	opticalPackSide = null;
	refractionTarget;
	hasTransmission = !1;
	linear3D = !1;
	weighted = !1;
	oitAccumulation;
	oitRevealage;
	oitProgram;
	shadowTarget;
	postTarget;
	coverageTarget;
	coverageActive = !1;
	coverageCapabilities = Object.freeze({
		rgba8Samples: 1,
		hdrSamples: 1
	});
	fxaaProgram;
	fxaaTarget;
	floatColorBuffer = !1;
	compositeProgram;
	compositeUniforms = {};
	materials = /* @__PURE__ */ new Map();
	nativeMaterials = /* @__PURE__ */ new Map();
	processors = /* @__PURE__ */ new Map();
	snapshots = /* @__PURE__ */ new Map();
	frameTarget;
	layerTarget;
	effectTarget;
	sceneTarget;
	get capabilities() {
		return {
			threeD: !0,
			compute: !1,
			customShaders: !0,
			lighting2D: !0,
			storageBuffers: !1,
			instancing: !0,
			maxTextureSize: this.maxTextureSize,
			supportedTextureFormats: this.supportedTextureFormats,
			textureAnisotropy: this.textureAnisotropy,
			alphaToCoverage: this.coverageCapabilities
		};
	}
	onContextLost = (e) => {
		e.preventDefault(), !(this.destroyed || this.lostError) && (this.lostError = new require_errors.WebGL2ContextLostError(`WebGL2 context lost; the renderer cannot continue.`), this.destroy(), this.onError(this.lostError));
	};
	constructor(e, t = !0, n = {}) {
		this.onError = e, this.antialias = t, this.gpuTimingEnabled = require_gpu_timing.configureGpuTiming(this.stats.gpuTiming, n);
	}
	async initialize(t) {
		if (this.destroyed || this.gl) throw new require_errors.GraphicsError(`WebGL2 renderer cannot be initialized more than once.`);
		try {
			let n = t.getContext(`webgl2`, {
				alpha: !1,
				antialias: this.antialias,
				preserveDrawingBuffer: !1
			});
			if (!n) throw new require_errors.WebGL2InitializationError(`WebGL2 canvas context is unavailable: canvas.getContext("webgl2") returned null.`);
			if (this.gl = n, this.gpuTimingEnabled) {
				let e = n.getExtension(`EXT_disjoint_timer_query_webgl2`);
				e ? this.gpuTimer = new require_gpu_timing.WebGlTimer(this.stats.gpuTiming, n, e) : this.stats.gpuTiming.unavailable(`unsupported`, `EXT_disjoint_timer_query_webgl2 is unavailable.`);
			}
			this.canvas = t, t.addEventListener(`webglcontextlost`, this.onContextLost), this.maxTextureSize = n.getParameter(n.MAX_TEXTURE_SIZE), this.anisotropyExtension = n.getExtension(`EXT_texture_filter_anisotropic`), this.anisotropyExtension && (this.maxTextureAnisotropy = Math.max(1, Math.min(16, Math.floor(n.getParameter(this.anisotropyExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT))))), this.textureAnisotropy = Object.freeze({
				maxRequest: 16,
				maxEffective: this.maxTextureAnisotropy
			});
			let r = n.getParameter(n.MAX_RENDERBUFFER_SIZE), i = n.getParameter(n.MAX_VIEWPORT_DIMS);
			this.maxWidth = Math.min(this.maxTextureSize, r, i[0]), this.maxHeight = Math.min(this.maxTextureSize, r, i[1]), this.floatColorBuffer = n.getExtension(`EXT_color_buffer_float`) !== null;
			let a = 1, o = 1;
			if (this.antialias) {
				let e = n.getInternalformatParameter(n.RENDERBUFFER, n.DEPTH_COMPONENT24, n.SAMPLES), t = n.getInternalformatParameter(n.RENDERBUFFER, n.RGBA8, n.SAMPLES);
				for (let n of t) n <= require_rendering.materialQuality.samples && n > a && e.includes(n) && (a = n);
				if (this.floatColorBuffer) {
					let t = n.getInternalformatParameter(n.RENDERBUFFER, n.RGBA16F, n.SAMPLES);
					for (let n of t) n <= require_rendering.materialQuality.samples && n > o && e.includes(n) && (o = n);
				}
			}
			if (this.coverageCapabilities = Object.freeze({
				rgba8Samples: a,
				hdrSamples: o
			}), this.supportedTextureFormats = require_native_texture_upload.webglTextureFormats(n), this.resize(Math.max(t.width, 1), Math.max(t.height, 1)), this.triangleProgram = this.createProgram(n, `#version 300 es
precision highp float;
out vec3 vColor;
void main() {
  vec2 positions[3] = vec2[3](vec2(0.0, 0.7), vec2(-0.7, -0.6), vec2(0.7, -0.6));
  vec3 colors[3] = vec3[3](vec3(1.0, 0.3, 0.25), vec3(0.25, 0.9, 0.5), vec3(0.3, 0.5, 1.0));
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
  vColor = colors[gl_VertexID];
}`, `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 color;
void main() { color = vec4(vColor, 1.0); }`, `triangle`), this.meshProgram = this.createProgram(n, require_webgl_feature_shaders.meshVertex, require_webgl_feature_shaders.meshFragment, `mesh`), this.shadowProgram = this.createProgram(n, require_webgl_feature_shaders.meshVertex, require_webgl_feature_shaders.shadowFragment, `shadow`), this.postProgram = this.createProgram(n, require_webgl_feature_shaders.postVertex, require_webgl_feature_shaders.postFragment, `postprocessing`), this.fxaaProgram = this.createProgram(n, require_webgl_feature_shaders.postVertex, require_fxaa_shaders.fxaaGLSL, `FXAA`), n.useProgram(this.fxaaProgram), n.uniform1i(n.getUniformLocation(this.fxaaProgram, `image`), 0), this.compositeProgram = this.createProgram(n, require_shaders.layerVertex, require_shaders.compositeFragment, `2D layer and transition composition`), this.triangleVAO = this.createVAO(n), this.skyProgram = this.createProgram(n, require_webgl_feature_shaders.skyVertex, require_webgl_feature_shaders.skyFragment, `skybox`), this.skyVAO = this.createVAO(n), this.graphs = new require_webgl2_render_graph.WebGL2RenderGraph(n), this.render2D = new require_webgl2_render2d.WebGLRender2D(n, {
				owner: this,
				stats: this.stats,
				residency: this.residency,
				anisotropyExtension: this.anisotropyExtension,
				maxTextureAnisotropy: this.maxTextureAnisotropy,
				createTarget: (e, t) => this.createTarget(e, t, !1, `rgba8`, !1),
				deleteTarget: (e) => this.deleteTarget(e),
				createProgram: (e, t, r) => this.createProgram(n, e, t, r),
				source: (e) => {
					if (e.kind === `render`) return this.render2D.source(e);
					let t = this.cacheTexture(e);
					return t.seen = this.frame, t.resource;
				},
				material: (e) => this.requireNative(e, !1).program,
				processor: (e) => this.requireNative(e, !0).program,
				assertIdle: () => {
					if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`WebGL2 offscreen APIs cannot run during an active frame.`);
				},
				assertAlive: () => {
					this.requireGL();
				}
			}), this.shadowBuffer = this.createBuffer(n), n.bindBuffer(n.UNIFORM_BUFFER, this.shadowBuffer), n.bufferData(n.UNIFORM_BUFFER, this.atlas.data.byteLength, n.DYNAMIC_DRAW), n.uniformBlockBinding(this.meshProgram, n.getUniformBlockIndex(this.meshProgram, `ShadowData`), 0), this.sheenBuffer = this.createBuffer(n), n.bindBuffer(n.UNIFORM_BUFFER, this.sheenBuffer), n.bufferData(n.UNIFORM_BUFFER, require_sheen.sheenDirectionalAlbedo, n.STATIC_DRAW), n.uniformBlockBinding(this.meshProgram, n.getUniformBlockIndex(this.meshProgram, `SheenLookup`), 1), this.brdfBuffer = this.createBuffer(n), n.bindBuffer(n.UNIFORM_BUFFER, this.brdfBuffer), n.bufferData(n.UNIFORM_BUFFER, require_brdf.ggxDirectionalAlbedo, n.STATIC_DRAW), n.uniformBlockBinding(this.meshProgram, n.getUniformBlockIndex(this.meshProgram, `GGXLookup`), 2), this.opticalPackProgram = this.createProgram(n, require_webgl_feature_shaders.postVertex, require_optical_pack_shaders.opticalPackGLSL, `optical packing`), this.opticalPackFramebuffer = n.createFramebuffer() ?? void 0, this.emptyOptical = n.createTexture() ?? void 0, !this.opticalPackFramebuffer || !this.emptyOptical) throw new require_errors.WebGL2InitializationError(`WebGL2 optical resource allocation failed.`);
			n.activeTexture(n.TEXTURE0 + 14), n.bindTexture(n.TEXTURE_2D_ARRAY, this.emptyOptical), n.texStorage3D(n.TEXTURE_2D_ARRAY, 1, n.RGBA8, 1, 1, 2), n.texParameteri(n.TEXTURE_2D_ARRAY, n.TEXTURE_MIN_FILTER, n.NEAREST), n.texParameteri(n.TEXTURE_2D_ARRAY, n.TEXTURE_MAG_FILTER, n.NEAREST), n.useProgram(this.opticalPackProgram), n.uniform1i(n.getUniformLocation(this.opticalPackProgram, `image`), 0), this.opticalPackSide = n.getUniformLocation(this.opticalPackProgram, `side`);
			for (let e of `viewProjection.model.instanced.skinned.jointPalette.lighting[0].tint.surface.emission.maps.pbr.alphaMode.doubleSided.linearOutput.cameraPosition.receiveShadow.image.metallicRoughnessMap.normalMap.occlusionMap.emissiveMap.specularMap.specularColorMap.specularColor.specularParams.clearcoat.clearcoatMaps.clearcoatMap.clearcoatRoughnessMap.clearcoatNormalMap.sheen.sheenMaps.sheenColorMap.sheenRoughnessMap.transmission.attenuationColor.transmissionMapSettings.thicknessMapSettings.finish0.finish1.finish2.finish3.finish4.opticalMaps.opaqueScene.shadowMap.oitPass.environment[0].environmentMap.probeData[0].fog[0].meshFade.tangentTexCoord.derivativeTangentSign`.split(`.`)) this.meshUniforms[e] = n.getUniformLocation(this.meshProgram, e);
			this.meshUniforms[`materialCoordinates[0]`] = n.getUniformLocation(this.meshProgram, `materialCoordinates[0]`);
			for (let e of [
				`viewProjection`,
				`model`,
				`instanced`,
				`skinned`,
				`jointPalette`,
				`image`,
				`alphaCutoff`,
				`opacity`,
				`doubleSided`,
				`alphaMode`,
				`meshFade`,
				`materialCoordinates[0]`
			]) this.shadowUniforms[e] = n.getUniformLocation(this.shadowProgram, e);
			for (let e of [
				`invViewProjection`,
				`backgroundMap`,
				`sky`
			]) this.skyUniforms[e] = n.getUniformLocation(this.skyProgram, e);
			for (let e of [
				`image`,
				`settings`,
				`aces`,
				`depthImage`,
				`inverseVP`,
				`clip`,
				`ssao`,
				`dof`
			]) this.postUniforms[e] = n.getUniformLocation(this.postProgram, e);
			for (let e of [
				`image`,
				`previousImage`,
				`hasPrevious`,
				`transitionKind`,
				`progress`,
				`transitionColor`,
				`slideDirection`
			]) this.compositeUniforms[e] = n.getUniformLocation(this.compositeProgram, e);
			n.useProgram(this.meshProgram), n.uniform1i(this.meshUniforms.image, 0), n.uniform1i(this.meshUniforms.metallicRoughnessMap, 1), n.uniform1i(this.meshUniforms.normalMap, 2), n.uniform1i(this.meshUniforms.occlusionMap, 3), n.uniform1i(this.meshUniforms.emissiveMap, 4), n.uniform1i(this.meshUniforms.shadowMap, 5), n.uniform1i(this.meshUniforms.environmentMap, 6), n.useProgram(this.skyProgram), n.uniform1i(this.skyUniforms.backgroundMap, 0), n.useProgram(this.shadowProgram), n.uniform1i(this.shadowUniforms.image, 0), n.useProgram(this.postProgram), n.uniform1i(this.postUniforms.image, 0), n.useProgram(this.compositeProgram), n.uniform1i(this.compositeUniforms.image, 0), n.uniform1i(this.compositeUniforms.previousImage, 1), n.useProgram(null);
		} catch (e) {
			throw this.destroy(), e instanceof require_errors.GraphicsError ? e : new require_errors.WebGL2InitializationError(`WebGL2 initialization failed${e instanceof Error ? `: ${e.message}` : `.`}`, { cause: e });
		}
	}
	createRenderTexture(e) {
		return this.requireGL(), this.render2D.createRenderTexture(e);
	}
	async renderToTexture(e, t, n) {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`Cannot render offscreen during an active frame.`);
		return this.render2D.renderToTexture(e, t, n);
	}
	async extractPixels(e, t) {
		return this.requireGL(), this.render2D.extractPixels(e, t);
	}
	async generateTexture(e, t) {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`Cannot generate a texture during an active frame.`);
		return this.render2D.generateTexture(e, t);
	}
	async prepareTextures(e) {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`Cannot prepare textures during an active frame.`);
		for (let t of e) if (t.kind === `render`) this.render2D.source(t);
		else {
			let e = this.cacheTexture(t);
			e.prepared || e.allocation.retain(), e.prepared = !0;
		}
		this.gl.flush();
	}
	unloadTexture(e) {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`Cannot unload textures during an active frame.`);
		if (e.kind === `render`) throw this.render2D.source(e), new require_errors.GraphicsError(`Renderer-owned render targets must be destroyed rather than unloaded.`);
		let t = this.textures.get(e);
		t && t.allocation.destroy();
		for (let [t, n] of this.opticalTextures) (require_pbr_material.pbrTextureSources(t).transmissionTexture === e || require_pbr_material.pbrTextureSources(t).thicknessTexture === e) && n.allocation.destroy();
	}
	prepareNativePBRMaterial(e) {
		return this.prepareMaterial(e);
	}
	async prepareMaterial(e) {
		if (!require_native_material3d.isNativeMaterial3D(e)) return this.prepareNative(e, !1);
		let o = this.requireGL();
		if (e.validate(), this.nativeMaterials.has(e)) return;
		require_native_material_limits.validateNativeMaterialGL(o);
		let s = e instanceof require_native_pbr_material.NativePBRMaterial, c = require_webgl_feature_shaders.nativeMeshGLSL(e.glsl, `vertex`, s), l = this.createProgram(o, c, require_webgl_feature_shaders.nativeMeshGLSL(e.glsl, `surface`, s), e.label), u;
		try {
			u = this.createProgram(o, c, require_webgl_feature_shaders.nativeMeshGLSL(e.glsl, `shadow`, s), `${e.label} shadow`);
			let n = {}, d = {}, f = [
				...Object.keys(this.meshUniforms),
				...Object.keys(this.shadowUniforms),
				`xyzUniforms[0]`,
				`xyzMap0`,
				`xyzMap1`,
				`xyzMap2`,
				`xyzMap3`
			];
			require_native_material_limits.validateNativeMaterialGLResources(o, l, f), require_native_material_limits.validateNativeMaterialGLResources(o, u, f);
			for (let e of f) n[e] = o.getUniformLocation(l, e), d[e] = o.getUniformLocation(u, e);
			for (let [e, t] of [
				[`ShadowData`, 0],
				[`SheenLookup`, 1],
				[`GGXLookup`, 2]
			]) {
				let n = o.getUniformBlockIndex(l, e);
				n !== o.INVALID_INDEX && o.uniformBlockBinding(l, n, t);
			}
			if (this.cacheTexture(require_mesh.materialBaseTexture(e)), e instanceof require_native_material3d.NativeMaterial3D) for (let t of require_native_material3d.nativeMaterialSources(e)) this.cacheTexture(t);
			if (e instanceof require_native_pbr_material.NativePBRMaterial) {
				let t = require_pbr_material.pbrTextureSources(e);
				for (let e of Object.values(t)) e && this.cacheTexture(e);
			}
			let m = u, h = e.onDestroy(() => {
				o.deleteProgram(l), o.deleteProgram(m), this.nativeMaterials.delete(e);
			});
			this.nativeMaterials.set(e, {
				program: l,
				shadow: u,
				uniforms: n,
				shadowUniforms: d,
				unsubscribe: h
			});
		} catch (e) {
			throw o.deleteProgram(l), u && o.deleteProgram(u), e;
		}
	}
	async preparePostProcessor(e) {
		return this.prepareNative(e, !0);
	}
	async prepareNative(e, t) {
		let n = this.requireGL();
		require_material2d.validateEffect2D(e);
		let r = t ? this.processors : this.materials, i = r.get(e);
		if (i) return i.preparation;
		let a = this.createProgram(n, t ? require_shaders.layerVertex : require_webgl2_render2d_shaders.quadVertex2D, t ? require_shaders.processorFragment(e.glsl) : require_webgl2_render2d_shaders.quadFragment2D(e.glsl), t ? `native 2D postprocessor` : `native Sprite material`), o = n.getParameter(n.CURRENT_PROGRAM);
		n.useProgram(a), n.uniform1i(n.getUniformLocation(a, `image`), 0), n.useProgram(o);
		let onDestroy = () => {
			r.get(e) === c && (r.delete(e), n.deleteProgram(a), e.removeEventListener(`destroy`, onDestroy));
		}, s = Promise.resolve().then(() => {
			if (this.requireGL(), require_material2d.validateEffect2D(e), r.get(e) !== c) throw new require_errors.GraphicsError(`WebGL2 native effect preparation was cancelled.`);
			c.ready = !0;
		}).catch((e) => {
			throw onDestroy(), e;
		}), c = {
			program: a,
			viewport: n.getUniformLocation(a, `viewportSize`),
			uniforms: n.getUniformLocation(a, `uniforms[0]`),
			ready: !1,
			preparation: s,
			onDestroy
		};
		return r.set(e, c), e.addEventListener(`destroy`, onDestroy), s;
	}
	requireNative(e, t) {
		require_material2d.validateEffect2D(e);
		let n = (t ? this.processors : this.materials).get(e);
		if (!n?.ready) throw new require_errors.GraphicsError(`WebGL2 ${t ? `postprocessor` : `Sprite material`} must be prepared before rendering.`);
		return n;
	}
	validateTransition(e) {
		if (!Number.isFinite(e.progress) || e.progress < 0 || e.progress > 1 || ![
			`fade`,
			`crossfade`,
			`slide`
		].includes(e.kind) || ![
			`left`,
			`right`,
			`up`,
			`down`
		].includes(e.direction) || e.color.length !== 4 || e.color.some((e) => !Number.isFinite(e) || e < 0 || e > 1)) throw new require_errors.GraphicsError(`WebGL2 transition requires normalized progress/color and a valid kind/direction.`);
		let t = e.snapshot;
		if (t && (!(t instanceof WebGLSnapshot) || t.destroyed || !this.snapshots.has(t))) throw new require_errors.GraphicsError(`WebGL2 transition snapshot is destroyed or belongs to another renderer/backend.`);
	}
	beginFrame() {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`WebGL2 beginFrame called before the preceding frame ended.`);
		this.activeFrame = !0, this.residency.beginFrame(), this.frameRendered = !1, this.stats.begin(), this.gpuTimer?.begin(this.stats.frame);
	}
	render(e, t, n, r) {
		if (this.requireGL(), !this.activeFrame || this.frameRendered) throw new require_errors.GraphicsError(`WebGL2 render requires an active frame and may be called only once per frame.`);
		let i = r?.transition;
		if (i) {
			this.validateTransition(i);
			let e = this.canvas;
			this.frameTarget ||= this.createTarget(e.width, e.height, !1, `rgba8`);
		} else this.frameTarget &&= (this.deleteTarget(this.frameTarget), void 0);
		this.renderFrame(e, t, n, i ? this.frameTarget : void 0, i);
	}
	async captureScene(e, t, n) {
		if (this.requireGL(), this.activeFrame) throw new require_errors.GraphicsError(`WebGL2 cannot capture a scene during an active frame.`);
		let r = this.canvas, i = this.createTarget(r.width, r.height, !1, `rgba8`);
		try {
			this.beginFrame(), this.renderFrame(e, t, n, i), this.endFrame(!1);
			let r = new WebGLSnapshot(i.width, i.height, () => {
				this.snapshots.delete(r), this.deleteTarget(i);
			});
			return this.snapshots.set(r, i), r;
		} catch (e) {
			throw this.gpuTimer?.abort(), this.residency.abortFrame(), this.deleteTarget(i), e;
		} finally {
			this.activeFrame = !1, this.frameRendered = !1;
		}
	}
	renderFrame(e, t, n, r, i) {
		let a = this.gl, o = this.canvas, s = t ?? (o.clientWidth || o.width), c = n ?? (o.clientHeight || o.height);
		if (!Number.isFinite(s) || !Number.isFinite(c) || s <= 0 || c <= 0) throw RangeError(`WebGL2 rendering requires positive finite logical width and height.`);
		this.frame++;
		let l = e?.renderGraph, u = r;
		l && (r = this.graphs.sceneTarget(l, o.width, o.height));
		try {
			let t = e?.effects2D;
			this.layerTarget ||= this.createTarget(o.width, o.height, !1, `rgba8`, !1);
			let n = e?.effects3D, d = !!n?.length;
			if (t?.length || d) {
				for (let e of t ?? []) this.requireNative(e, !0);
				for (let e of n ?? []) this.requireNative(e, !0);
				this.effectTarget ||= this.createTarget(o.width, o.height, !1, `rgba8`, !1);
			} else this.effectTarget && this.deleteTarget(this.effectTarget), this.effectTarget = void 0;
			d ? this.sceneTarget ??= this.createTarget(o.width, o.height, !1, `rgba8`, !0) : this.sceneTarget &&= (this.deleteTarget(this.sceneTarget), void 0);
			let f = d ? this.sceneTarget.framebuffer : r?.framebuffer ?? null;
			if (this.hasTransmission = this.linear3D = this.weighted = this.coverageActive = !1, e ? (require_render2d_contract.collectRenderCommands2D(e, s, c, this.commands), this.render2D.preflight(this.commands, e, s, c, Math.max(o.width / s, o.height / c))) : this.commands.clear(), e?.has3DContent) {
				require_render_data.validateRenderSettings(e), this.capturingProbe || this.probeCaptures.schedule(e, (t) => this.captureReflectionProbe(e, t), (e) => this.onError(e instanceof require_errors.GraphicsError ? e : new require_errors.GraphicsError(`Automatic reflection capture failed.`, { cause: e }))), this.collectMeshes(e, s / c, c);
				let t = e.postProcessing.enabled || this.hasTransmission || this.weighted;
				this.linear3D = t || this.coverageActive, e.lightSelection.update(e), this.atlas.update(e, s / c), a.bindBuffer(a.UNIFORM_BUFFER, this.shadowBuffer), a.bufferSubData(a.UNIFORM_BUFFER, 0, this.atlas.data), this.stats.upload(this.atlas.data.byteLength), e.shadows.enabled ? this.drawShadows(e) : this.shadowTarget &&= (this.deleteTarget(this.shadowTarget), void 0), this.linear3D ? this.preparePostTarget(o.width, o.height, t || this.coverageCapabilities.hdrSamples > 1 ? `hdr` : `rgba8`) : this.postTarget &&= (this.releaseOIT(), this.deleteTarget(this.postTarget), void 0), !e.postProcessing.enabled && this.fxaaTarget && (this.deleteTarget(this.fxaaTarget), this.fxaaTarget = void 0), this.hasTransmission ? this.prepareRefractionTarget(o.width, o.height) : this.refractionTarget &&= (this.deleteTarget(this.refractionTarget), void 0);
			} else this.releaseCoverageTarget(), this.temporal?.releaseTarget(), this.temporalState.invalidate(), this.visibilityCache.clear(), this.visibility.color.length = 0, this.visibility.shadows.length = 0, this.visibility.entries.clear(), this.visibility.occlusionCandidates.length = 0, this.occlusion?.clear(), this.shadowTarget &&= (this.deleteTarget(this.shadowTarget), void 0), this.releaseOIT(), this.postTarget &&= (this.deleteTarget(this.postTarget), void 0), this.fxaaTarget &&= (this.deleteTarget(this.fxaaTarget), void 0), this.refractionTarget &&= (this.deleteTarget(this.refractionTarget), void 0);
			this.weighted ? this.prepareOIT(o.width, o.height) : this.releaseOIT(), a.bindFramebuffer(a.FRAMEBUFFER, this.linear3D ? this.postTarget.framebuffer : f), a.disable(a.SCISSOR_TEST), a.viewport(0, 0, o.width, o.height), a.clearColor(this.linear3D ? this.decodeColor(require_defaults.defaults.clearColor.r) : require_defaults.defaults.clearColor.r, this.linear3D ? this.decodeColor(require_defaults.defaults.clearColor.g) : require_defaults.defaults.clearColor.g, this.linear3D ? this.decodeColor(require_defaults.defaults.clearColor.b) : require_defaults.defaults.clearColor.b, require_defaults.defaults.clearColor.a), a.depthMask(!0), a.clearDepth(1), this.coverageActive || a.clear(a.COLOR_BUFFER_BIT | a.DEPTH_BUFFER_BIT), a.enable(a.BLEND), a.blendFunc(a.ONE, a.ONE_MINUS_SRC_ALPHA), e ? (e.has3DContent && this.drawMeshes(e, s / c), a.disable(a.DEPTH_TEST), this.linear3D && this.drawPost(e, f), d && this.drawEffects2D(n, s, c, r?.framebuffer ?? null, this.sceneTarget, this.effectTarget, !0), a.activeTexture(a.TEXTURE0), a.enable(a.BLEND), a.blendFunc(a.ONE, a.ONE_MINUS_SRC_ALPHA), a.disable(a.CULL_FACE), a.bindFramebuffer(a.FRAMEBUFFER, this.layerTarget.framebuffer), a.viewport(0, 0, o.width, o.height), a.clearColor(0, 0, 0, 0), a.clear(a.COLOR_BUFFER_BIT), this.render2D.draw(this.commands, e, this.layerTarget, s, c), t?.length ? this.drawEffects2D(t, s, c, r?.framebuffer ?? null) : this.drawComposite(this.layerTarget.texture, r?.framebuffer ?? null)) : (a.disable(a.DEPTH_TEST), a.disable(a.BLEND), a.viewport(this.viewportX, this.viewportY, this.viewportSide, this.viewportSide), a.useProgram(this.triangleProgram), a.bindVertexArray(this.triangleVAO), a.drawArrays(a.TRIANGLES, 0, 3)), l && this.graphs.encode(l, u?.framebuffer ?? null), i && this.drawComposite(u.texture, null, i), this.frameRendered = !0;
		} finally {
			this.frameRendered || this.temporalState.invalidate(), this.releaseUnused(), a.bindFramebuffer(a.FRAMEBUFFER, null), a.activeTexture(a.TEXTURE0), a.bindSampler(0, null), a.bindVertexArray(null), a.bindTexture(a.TEXTURE_2D, null), a.useProgram(null), a.depthMask(!0), a.disable(a.DEPTH_TEST), a.disable(a.CULL_FACE), a.viewport(0, 0, o.width, o.height);
		}
	}
	endFrame(e = !0) {
		let t = this.requireGL();
		if (!this.activeFrame || !this.frameRendered) throw new require_errors.GraphicsError(`WebGL2 endFrame requires a rendered frame.`);
		this.gpuTimer?.end(), t.flush(), this.activeFrame = !1, e ? this.residency.endFrame() : this.residency.abortFrame(), this.stats.submit();
	}
	resize(e, t) {
		if (this.lostError) throw this.lostError;
		let n = this.canvas;
		if (!n || !this.gl || this.destroyed) throw new require_errors.GraphicsError(`WebGL2 resize requires an initialized renderer.`);
		if (!Number.isFinite(e) || !Number.isFinite(t) || e < 0 || t < 0) throw RangeError(`WebGL2 canvas pixel width and height must be finite, nonnegative numbers.`);
		let r = Math.max(1, Math.round(e)), i = Math.max(1, Math.round(t));
		if (!Number.isSafeInteger(r) || !Number.isSafeInteger(i) || r > this.maxWidth || i > this.maxHeight) throw new require_errors.GraphicsError(`WebGL2 canvas backing size ${r}×${i} exceeds this device's maximum dimensions of ${this.maxWidth}×${this.maxHeight} pixels. Reduce the canvas size or pixel ratio.`);
		this.postTarget && (this.postTarget.width !== r || this.postTarget.height !== i) && (this.releaseOIT(), this.releaseCoverageTarget(), this.deleteTarget(this.postTarget), this.postTarget = void 0), this.refractionTarget && (this.refractionTarget.width !== r || this.refractionTarget.height !== i) && (this.deleteTarget(this.refractionTarget), this.refractionTarget = void 0), this.fxaaTarget && (this.fxaaTarget.width !== r || this.fxaaTarget.height !== i) && (this.deleteTarget(this.fxaaTarget), this.fxaaTarget = void 0), (n.width !== r || n.height !== i) && (this.frameTarget && this.deleteTarget(this.frameTarget), this.layerTarget && this.deleteTarget(this.layerTarget), this.effectTarget && this.deleteTarget(this.effectTarget), this.sceneTarget && this.deleteTarget(this.sceneTarget), this.frameTarget = void 0, this.layerTarget = void 0, this.effectTarget = void 0, this.sceneTarget = void 0), n.width !== r && (n.width = r), n.height !== i && (n.height = i), this.temporal?.resize(r, i);
		let a = Math.min(r, i);
		this.viewportX = (r - a) / 2, this.viewportY = (i - a) / 2, this.viewportSide = a;
	}
	drawEffects2D(e, t, n, r, i = this.layerTarget, a = this.effectTarget, o = !1) {
		let s = this.gl, c = i, l = a;
		s.disable(s.BLEND), s.disable(s.DEPTH_TEST), s.disable(s.CULL_FACE), s.bindVertexArray(this.triangleVAO), s.activeTexture(s.TEXTURE0), s.bindSampler(0, null);
		for (let r of e) {
			let e = this.processors.get(r);
			s.bindFramebuffer(s.FRAMEBUFFER, l.framebuffer), s.clearColor(0, 0, 0, 0), s.clear(s.COLOR_BUFFER_BIT), s.useProgram(e.program), s.uniform2f(e.viewport, t, n), s.uniform4fv(e.uniforms, r.uniforms), s.bindTexture(s.TEXTURE_2D, c.texture), s.drawArrays(s.TRIANGLES, 0, 3), this.stats.pass2D(), this.stats.draw2D();
			let i = c;
			c = l, l = i;
		}
		o && (s.bindFramebuffer(s.FRAMEBUFFER, r), s.clearColor(0, 0, 0, 0), s.clear(s.COLOR_BUFFER_BIT)), this.drawComposite(c.texture, r);
	}
	drawComposite(e, t, n) {
		let r = this.gl, i = this.canvas, a = this.compositeUniforms, o = n?.snapshot ? this.snapshots.get(n.snapshot).texture : void 0;
		if (r.bindFramebuffer(r.FRAMEBUFFER, t), r.viewport(0, 0, i.width, i.height), r.disable(r.DEPTH_TEST), r.disable(r.CULL_FACE), n ? r.disable(r.BLEND) : (r.enable(r.BLEND), r.blendFunc(r.ONE, r.ONE_MINUS_SRC_ALPHA)), r.useProgram(this.compositeProgram), r.bindVertexArray(this.triangleVAO), r.activeTexture(r.TEXTURE0), r.bindSampler(0, null), r.bindTexture(r.TEXTURE_2D, e), r.activeTexture(r.TEXTURE1), r.bindSampler(1, null), r.bindTexture(r.TEXTURE_2D, o ?? e), r.uniform1i(a.hasPrevious, +!!o), r.uniform1i(a.transitionKind, n ? n.kind === `fade` ? 1 : n.kind === `crossfade` ? 2 : 3 : 0), r.uniform1f(a.progress, n?.progress ?? 0), n) {
			let e = n.color;
			r.uniform4f(a.transitionColor, e[0] * e[3], e[1] * e[3], e[2] * e[3], e[3]);
			let t = n.direction;
			r.uniform2f(a.slideDirection, t === `left` ? -1 : +(t === `right`), t === `up` ? -1 : +(t === `down`));
		}
		r.drawArrays(r.TRIANGLES, 0, 3), this.stats.pass2D(), this.stats.draw2D(), r.bindTexture(r.TEXTURE_2D, null), r.activeTexture(r.TEXTURE0);
	}
	collectMeshes(e, t, r) {
		this.coverageActive = !1;
		let i = this.gl, a = this.canvas, o = +!!e.postProcessing.enabled | (e.transparency === `weighted` ? 2 : 0);
		if ((this.depthWidth !== a.width || this.depthHeight !== a.height || this.depthMode !== o) && (this.depthWidth = a.width, this.depthHeight = a.height, this.depthMode = o, ++this.depthRevision), e.renderMeshes) for (let t of e.renderMeshes) {
			!this.occlusion && t.occlusionCulled && (this.occlusion = new require_webgl_occlusion.WebGLOcclusionBackend(i));
			let e = require_mesh.materialBaseTexture(t.material);
			this.depthTextureVersions.get(e) !== e.version && (this.depthTextureVersions.set(e, e.version), ++this.depthRevision), t.worldVisible && require_native_material3d.isNativeMaterial3D(t.material) && !t.material.transparent && ++this.depthRevision;
		}
		this.frustum.setFromMatrix(e.camera3D.updateMatrix(t)), this.occlusion?.beginFrame();
		let s = this.visibilityOptions;
		s.viewportHeight = r, s.timeSeconds = e.presentationTime, s.depthRevision = this.depthRevision, s.occlusion = this.occlusion, this.visibilityCache.collect(e, e.camera3D, this.frustum, this.visibility, s);
		let c = this.visibility.color;
		this.stats.meshes = this.visibility.color.length + this.visibility.frustumCulled + this.visibility.occlusionCulled, this.stats.culled = this.visibility.frustumCulled + this.visibility.occlusionCulled;
		for (let t of c) e.transparency === `weighted` && this.isColorBlended(t) && (this.weighted = !0), t.material instanceof require_pbr_material.PBRMaterial && (t.material.alphaToCoverage && (this.coverageActive = !0), this.cacheOpticalMaps(t.material), t.material.transmission > 0 && (this.hasTransmission = !0));
		this.coverageActive || this.releaseCoverageTarget(), e.transparency === `sorted` && this.drawSorter.sort(c, e.camera3D.position, this.isColorBlended);
	}
	cacheOpticalMaps(e) {
		let t = require_pbr_material.pbrTextureSources(e).transmissionTexture, n = require_pbr_material.pbrTextureSources(e).thicknessTexture;
		if (!t && !n) return;
		if (t?.destroyed || n?.destroyed) throw new require_errors.GraphicsError(`WebGL2 optical map has been destroyed.`);
		let r = this.opticalTextures.get(e), i = [t?.version ?? -1, n?.version ?? -1];
		if (r?.sourceVersions[0] === i[0] && r.sourceVersions[1] === i[1]) {
			r.allocation.touch(), r.seen = this.frame;
			return;
		}
		let a = this.gl, o = Math.ceil(Math.sqrt(Math.max(t ? t.width * t.height : 1, n ? n.width * n.height : 1)));
		r && r.side !== o && (r.allocation.destroy(), r = void 0);
		let s = r?.allocation ?? this.residency.textures.allocate(o * o * 8, () => {
			let t = this.opticalTextures.get(e);
			t && a.deleteTexture(t.resource), this.opticalTextures.delete(e);
		}), c = r?.resource ?? a.createTexture();
		if (!c) throw s.destroy(), new require_errors.GraphicsError(`WebGL2 optical array allocation failed.`);
		try {
			a.activeTexture(a.TEXTURE0 + 14), a.bindSampler(14, null), a.bindTexture(a.TEXTURE_2D_ARRAY, c), r || a.texStorage3D(a.TEXTURE_2D_ARRAY, 1, a.RGBA8, o, o, 2), a.texParameteri(a.TEXTURE_2D_ARRAY, a.TEXTURE_MIN_FILTER, a.NEAREST), a.texParameteri(a.TEXTURE_2D_ARRAY, a.TEXTURE_MAG_FILTER, a.NEAREST), a.useProgram(this.opticalPackProgram), a.uniform1i(this.opticalPackSide, o), a.bindFramebuffer(a.FRAMEBUFFER, this.opticalPackFramebuffer), a.viewport(0, 0, o, o), a.disable(a.BLEND), a.disable(a.DEPTH_TEST), a.disable(a.CULL_FACE), a.disable(a.SCISSOR_TEST), a.bindVertexArray(this.triangleVAO), a.activeTexture(a.TEXTURE0), a.bindSampler(0, null);
			for (let e = 0; e < 2; e++) {
				let r = e === 0 ? t : n;
				if (!r) continue;
				let i = this.cacheTexture(r);
				if (i.seen = this.frame, a.bindTexture(a.TEXTURE_2D, i.resource), a.framebufferTextureLayer(a.FRAMEBUFFER, a.COLOR_ATTACHMENT0, c, 0, e), a.checkFramebufferStatus(a.FRAMEBUFFER) !== a.FRAMEBUFFER_COMPLETE) throw new require_errors.GraphicsError(`WebGL2 optical packing framebuffer is incomplete.`);
				a.drawArrays(a.TRIANGLES, 0, 3);
			}
			this.opticalTextures.set(e, {
				resource: c,
				allocation: s,
				seen: this.frame,
				side: o,
				sourceVersions: i
			}), s.touch();
		} catch (e) {
			throw a.deleteTexture(c), s.destroy(), e;
		} finally {
			a.framebufferTextureLayer(a.FRAMEBUFFER, a.COLOR_ATTACHMENT0, null, 0, 0);
		}
	}
	drawMeshes(e, t) {
		let a = this.gl;
		if (this.ensureProbeEnvironment(e), this.coverageActive) {
			let e = this.postTarget;
			this.prepareCoverageTarget(e.width, e.height, e.format), a.bindFramebuffer(a.FRAMEBUFFER, this.coverageTarget.framebuffer), a.colorMask(!0, !0, !0, !0), a.clear(a.COLOR_BUFFER_BIT | a.DEPTH_BUFFER_BIT);
		}
		if (this.temporalActive = !this.capturingProbe && e.postProcessing.enabled && (e.postProcessing.taa || e.postProcessing.ssr), this.temporalActive) {
			if (!this.floatColorBuffer || !this.postTarget?.depthTexture) throw new require_errors.GraphicsError(`TAA/SSR require native HDR color and sampleable opaque depth.`);
			this.temporal ??= new require_webgl_temporal_pipeline.WebGLTemporalPipeline(a, this.stats), this.temporalState.begin(e, e.camera3D, this.postTarget.width, this.postTarget.height, e.postProcessing, t);
		} else this.temporal?.releaseTarget(), this.temporalState.invalidate();
		let o, s = require_render_data.activeBackground(e);
		s && this.drawSky(e, t, s);
		let c = this.temporalActive ? this.temporalState.currentVP.elements : e.camera3D.matrix.elements;
		require_render_data.fillFogData(e, this.fogData);
		let u = e.camera3D.position;
		a.bindBufferBase(a.UNIFORM_BUFFER, 0, this.shadowBuffer), a.bindBufferBase(a.UNIFORM_BUFFER, 1, this.sheenBuffer), a.bindBufferBase(a.UNIFORM_BUFFER, 2, this.brdfBuffer), a.activeTexture(a.TEXTURE5), a.bindSampler(5, null), a.bindTexture(a.TEXTURE_2D, this.shadowTarget?.texture ?? null), a.enable(a.DEPTH_TEST), a.depthFunc(a.LESS), a.depthMask(!0), a.disable(a.CULL_FACE), a.activeTexture(a.TEXTURE0 + 15), a.bindSampler(15, null), a.bindTexture(a.TEXTURE_2D, this.refractionTarget?.texture ?? null), a.activeTexture(a.TEXTURE0 + 14), a.bindSampler(14, null), a.bindTexture(a.TEXTURE_2D_ARRAY, this.emptyOptical);
		let d = this.visibility.color, f = 2 + (this.weighted ? 2 : 0);
		for (let t = 0; t < f; t++) {
			let s = t >= 2 ? t - 2 + 1 : 0;
			s && (a.bindFramebuffer(a.FRAMEBUFFER, (s === 1 ? this.oitAccumulation : this.oitRevealage).framebuffer), a.clearColor(s === 1 ? 0 : 1, s === 1 ? 0 : 1, s === 1 ? 0 : 1, s === 1 ? 0 : 1), a.clear(a.COLOR_BUFFER_BIT), a.depthMask(!1), a.blendFunc(s === 1 ? a.ONE : a.ZERO, s === 1 ? a.ONE : a.ONE_MINUS_SRC_ALPHA));
			for (let l of d) {
				let d = this.isColorBlended(l);
				if (this.weighted && d !== s > 0 || !s && (d || l.material instanceof require_pbr_material.PBRMaterial && l.material.transmission > 0) !== (t === 1)) continue;
				let f = l.material, m = f instanceof require_pbr_material.PBRMaterial;
				if (m && f.alphaToCoverage ? (a.enable(a.SAMPLE_ALPHA_TO_COVERAGE), a.disable(a.BLEND), a.colorMask(!0, !0, !0, !1)) : (a.disable(a.SAMPLE_ALPHA_TO_COVERAGE), a.enable(a.BLEND), a.colorMask(!0, !0, !0, !0)), require_native_material3d.isNativeMaterial3D(f)) {
					let e = this.nativeMaterials.get(f);
					if (!e || f.destroyed) throw new require_errors.GraphicsError(`Visible native 3D material must be explicitly prepared before rendering.`);
					if (f.validate(), o = e.uniforms, a.useProgram(e.program), a.uniform4fv(o[`xyzUniforms[0]`], f.uniforms), !(f instanceof require_native_pbr_material.NativePBRMaterial)) for (let e = 0; e < 4; e++) a.uniform1i(o[`xyzMap${e}`], e + 1), this.bindMaterialTexture(require_native_material3d.nativeMaterialSources(f)[e] ?? require_mesh.materialBaseTexture(f), e + 1);
				} else o = this.meshUniforms, a.useProgram(this.meshProgram);
				if (require_material_uv.fillMaterialUV(f, l.renderGeometry, this.materialUVData), a.uniform4fv(o[`materialCoordinates[0]`], this.materialUVData), a.uniformMatrix4fv(o.viewProjection, !1, c), require_render_data.fillLightingData(e, this.lightingData, e.lightSelection.selectMesh(l)), a.uniform4fv(o[`lighting[0]`], this.lightingData), a.uniform4fv(o[`fog[0]`], this.fogData), a.uniform3f(o.cameraPosition, u.x, u.y, u.z), a.uniform1i(o.linearOutput, +!!this.linear3D), a.uniform1i(o.image, 0), a.uniform1i(o.shadowMap, 5), a.uniform1i(o.environmentMap, 6), a.uniform1i(o.opaqueScene, 15), a.uniform1i(o.opticalMaps, 14), a.uniform1i(o.oitPass, s), a.uniform1f(o.meshFade, this.visibility.entries.get(l)?.fade ?? 1), a.uniform1i(o.tangentTexCoord, l.renderGeometry.tangentTexCoord), a.uniform1f(o.derivativeTangentSign, l.renderGeometry.tangentConvention === `gltf` ? -1 : 1), s || a.depthMask(!d), m) {
					require_render_data.fillProbeBlendData(e, this.environmentData, 0, this.selectedProbes);
					for (let e = 0; e < 5; e++) this.environmentData[e * 52 + 38] = this.probeMipCount - 1;
					a.uniform4fv(o[`environment[0]`], this.environmentLightingData), a.uniform4fv(o[`probeData[0]`], this.probeData), a.activeTexture(a.TEXTURE6), a.bindSampler(6, null), a.bindTexture(a.TEXTURE_2D_ARRAY, this.probeTexture);
				}
				a.uniform1i(o.pbr, +!!m), a.uniform1i(o.doubleSided, m && !f.doubleSided ? 0 : 1), a.uniform1i(o.alphaMode, m ? f.alphaMode === `OPAQUE` ? 0 : f.alphaMode === `MASK` ? 1 : 2 : 2);
				let g = this.tintData;
				if (g[0] = f.color[0], g[1] = f.color[1], g[2] = f.color[2], g[3] = f.opacity, a.uniform4fv(o.tint, g), a.uniform1i(o.receiveShadow, +!!l.receiveShadow), this.bindMaterialTexture(require_mesh.materialBaseTexture(f), 0, f.textureSampler), m) {
					a.uniform4f(o.transmission, f.transmission, f.thickness, 1 / f.attenuationDistance, f.ior), a.uniform3f(o.attenuationColor, f.attenuationColor[0], f.attenuationColor[1], f.attenuationColor[2]), require_optical_maps.fillOpticalMapSettings(this.opticalSettings, 0, require_pbr_material.pbrTextureSources(f).transmissionTexture, f.transmissionSampler, this.maxTextureAnisotropy), require_optical_maps.fillOpticalMapSettings(this.opticalSettings, 4, require_pbr_material.pbrTextureSources(f).thicknessTexture, f.thicknessSampler, this.maxTextureAnisotropy), a.uniform4f(o.transmissionMapSettings, this.opticalSettings[0], this.opticalSettings[1], this.opticalSettings[2], this.opticalSettings[3]), a.uniform4f(o.thicknessMapSettings, this.opticalSettings[4], this.opticalSettings[5], this.opticalSettings[6], this.opticalSettings[7]), a.activeTexture(a.TEXTURE0 + 14), a.bindSampler(14, null), a.bindTexture(a.TEXTURE_2D_ARRAY, this.opticalTextures.get(f)?.resource ?? this.emptyOptical), a.uniform4f(o.specularColor, f.specularColor[0], f.specularColor[1], f.specularColor[2], f.ior === 0 ? 1 : ((f.ior - 1) / (f.ior + 1)) ** 2), a.uniform4f(o.specularParams, f.specular, +(f.ior === 0), +!!require_pbr_material.pbrTextureSources(f).specularTexture, +!!require_pbr_material.pbrTextureSources(f).specularColorTexture), a.uniform1i(o.specularMap, 7), a.uniform1i(o.specularColorMap, 8), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).specularTexture ?? require_mesh.materialBaseTexture(f), 7, f.specularSampler), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).specularColorTexture ?? require_mesh.materialBaseTexture(f), 8, f.specularColorSampler), a.uniform4f(o.clearcoat, f.clearcoat, f.clearcoatRoughness, f.clearcoatNormalScale, 0), a.uniform4f(o.clearcoatMaps, +!!require_pbr_material.pbrTextureSources(f).clearcoatTexture, +!!require_pbr_material.pbrTextureSources(f).clearcoatRoughnessTexture, +!!require_pbr_material.pbrTextureSources(f).clearcoatNormalTexture, 0), a.uniform1i(o.clearcoatMap, 9), a.uniform1i(o.clearcoatRoughnessMap, 10), a.uniform1i(o.clearcoatNormalMap, 11), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).clearcoatTexture ?? require_mesh.materialBaseTexture(f), 9, f.clearcoatSampler), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).clearcoatRoughnessTexture ?? require_mesh.materialBaseTexture(f), 10, f.clearcoatRoughnessSampler), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).clearcoatNormalTexture ?? require_mesh.materialBaseTexture(f), 11, f.clearcoatNormalSampler), a.uniform4f(o.sheen, f.sheenColor[0], f.sheenColor[1], f.sheenColor[2], f.sheenRoughness), a.uniform4f(o.sheenMaps, +!!require_pbr_material.pbrTextureSources(f).sheenColorTexture, +!!require_pbr_material.pbrTextureSources(f).sheenRoughnessTexture, f.specularAntiAliasing, +!!f.alphaToCoverage), a.uniform1i(o.sheenColorMap, 12), a.uniform1i(o.sheenRoughnessMap, 13), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).sheenColorTexture ?? require_mesh.materialBaseTexture(f), 12, f.sheenColorSampler), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).sheenRoughnessTexture ?? require_mesh.materialBaseTexture(f), 13, f.sheenRoughnessSampler), a.uniform4f(o.surface, f.metallic, f.roughness, f.normalScale, f.occlusionStrength), a.uniform4f(o.emission, f.emissive[0], f.emissive[1], f.emissive[2], f.alphaCutoff);
					let e = require_pbr_material.pbrEmissiveSlot(f);
					a.uniform4i(o.maps, +!!require_pbr_material.pbrTextureSources(f).metallicRoughnessTexture, +!!require_pbr_material.pbrTextureSources(f).normalTexture, +!!require_pbr_material.pbrTextureSources(f).occlusionTexture, e.mode), a.uniform4f(o.finish0, f.finish.anisotropy, f.finish.anisotropyRotation, f.finish.iridescence, f.finish.iridescenceIor), a.uniform4f(o.finish1, f.finish.iridescenceThickness, f.finish.subsurface, f.finish.dispersion, f.finish.heightScale), a.uniform4f(o.finish2, f.finish.wetness, f.finish.snow, f.finish.dirt, f.finish.damage), a.uniform4f(o.finish3, f.finish.detailStrength, f.finish.triplanar, f.finish.layerBlend, f.finish.lightmapStrength), a.uniform4f(o.finish4, f.finish.subsurfaceColor[0], f.finish.subsurfaceColor[1], f.finish.subsurfaceColor[2], f.finish.subsurfaceRadius), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).metallicRoughnessTexture ?? require_mesh.materialBaseTexture(f), 1, f.metallicRoughnessSampler), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).normalTexture ?? require_mesh.materialBaseTexture(f), 2, f.normalSampler), this.bindMaterialTexture(require_pbr_material.pbrTextureSources(f).occlusionTexture ?? require_mesh.materialBaseTexture(f), 3, f.occlusionSampler), this.bindMaterialTexture(e.texture ?? require_mesh.materialBaseTexture(f), 4, e.sampler);
				}
				let y = this.visibility.entries.get(l)?.instances;
				this.drawMesh(l, o, y), this.stats.draw(l.geometry.indices.length, y?.count ?? (l instanceof require_instanced_mesh.InstancedMesh ? l.count : 1));
			}
			if (a.disable(a.SAMPLE_ALPHA_TO_COVERAGE), a.enable(a.BLEND), a.colorMask(!0, !0, !0, !0), t === 0 && this.occlusion?.draw(this.visibility.occlusionCandidates, this.temporalActive ? this.temporalState.currentVP : e.camera3D.matrix), t === 0 && this.coverageActive && (this.resolveCoverageTarget(), a.bindFramebuffer(a.FRAMEBUFFER, this.postTarget.framebuffer)), t === 0 && this.temporalActive && e.postProcessing.ssr) {
				let t = this.temporal.applyOpaqueSSR(this.postTarget.texture, this.postTarget.depthTexture, this.temporalState, e.postProcessing);
				this.temporal.blit(t, this.postTarget.framebuffer);
			}
			if (this.hasTransmission && t === 0) {
				let e = this.postTarget.width, t = this.postTarget.height;
				a.bindFramebuffer(a.READ_FRAMEBUFFER, this.postTarget.framebuffer), a.bindFramebuffer(a.DRAW_FRAMEBUFFER, this.refractionTarget.framebuffer), a.blitFramebuffer(0, 0, e, t, 0, 0, e, t, a.COLOR_BUFFER_BIT, a.NEAREST), a.bindFramebuffer(a.FRAMEBUFFER, this.postTarget.framebuffer);
			}
		}
		e.gpuParticleEmitters?.size && (this.weighted && a.bindFramebuffer(a.FRAMEBUFFER, this.postTarget.framebuffer), (this.particles3D ??= new require_webgl2_particles3d.WebGL2Particles3D(a, this.stats)).draw(e.gpuParticleEmitters, e.camera3D, t, this.linear3D)), this.weighted && this.resolveOIT(), a.depthMask(!0), a.blendFunc(a.ONE, a.ONE_MINUS_SRC_ALPHA), d.length = 0;
	}
	bindMaterialTexture(e, t, n) {
		if (e.destroyed) throw new require_errors.GraphicsError(`WebGL2 cannot render a destroyed material texture.`);
		let r = this.gl;
		r.bindSampler(t, n ? this.cacheSampler(n) : null), r.activeTexture(r.TEXTURE0 + t);
		let i = this.cacheTexture(e);
		i.seen = this.frame, r.bindTexture(r.TEXTURE_2D, i.resource);
	}
	cacheSampler(e) {
		let t = e.minFilter === `nearest` ? 0 : 1, n = e.magFilter === `nearest` ? 0 : 1, r = e.addressModeU === `repeat` ? 1 : e.addressModeU === `mirror-repeat` ? 2 : 0, i = e.addressModeV === `repeat` ? 1 : e.addressModeV === `mirror-repeat` ? 2 : 0, a = e.mipmapFilter ?? `linear`, o = e.lodMinClamp ?? 0, s = e.lodMaxClamp ?? 32, c = Math.min(e.maxAnisotropy ?? 1, this.maxTextureAnisotropy), l = `${t}/${n}/${a}/${r}/${i}/${o}/${s}/${c}`, u = this.samplers.get(l);
		if (u) return u;
		let d = this.gl, f = d.createSampler();
		if (!f) throw new require_errors.GraphicsError(`WebGL2 could not allocate a material sampler.`);
		return d.samplerParameteri(f, d.TEXTURE_MIN_FILTER, a === `nearest` ? t ? d.LINEAR_MIPMAP_NEAREST : d.NEAREST_MIPMAP_NEAREST : t ? d.LINEAR_MIPMAP_LINEAR : d.NEAREST_MIPMAP_LINEAR), d.samplerParameteri(f, d.TEXTURE_MAG_FILTER, n ? d.LINEAR : d.NEAREST), d.samplerParameteri(f, d.TEXTURE_WRAP_S, r === 1 ? d.REPEAT : r === 2 ? d.MIRRORED_REPEAT : d.CLAMP_TO_EDGE), d.samplerParameteri(f, d.TEXTURE_WRAP_T, i === 1 ? d.REPEAT : i === 2 ? d.MIRRORED_REPEAT : d.CLAMP_TO_EDGE), d.samplerParameterf(f, d.TEXTURE_MIN_LOD, o), d.samplerParameterf(f, d.TEXTURE_MAX_LOD, s), this.anisotropyExtension && d.samplerParameterf(f, this.anisotropyExtension.TEXTURE_MAX_ANISOTROPY_EXT, c), this.samplers.set(l, f), f;
	}
	drawMesh(e, t, n) {
		let r = this.gl, i = this.cacheGeometry(e.renderGeometry);
		i.seen = this.frame, r.uniformMatrix4fv(t.model, !1, e.worldMatrix.elements), r.bindVertexArray(i.vao), r.vertexAttrib3f(7, 1, 1, 1), r.vertexAttrib4f(8, 1, 1, 1, 1), r.vertexAttrib2f(11, 0, 0);
		let a = e instanceof require_skinned_mesh.SkinnedMesh ? this.cacheSkin(e) : void 0;
		if (r.uniform1i(t.skinned, +!!a), a ? (r.activeTexture(r.TEXTURE0 + 16), r.bindTexture(r.TEXTURE_2D, a.palette), r.bindSampler(16, null), r.uniform1i(t.jointPalette, 16), r.bindBuffer(r.ARRAY_BUFFER, a.indices), r.enableVertexAttribArray(9), r.vertexAttribIPointer(9, 4, r.UNSIGNED_INT, e instanceof require_skinned_mesh.SkinnedMesh ? e.influencesPerVertex * 4 : 16, 0), r.vertexAttribDivisor(9, 0), r.bindBuffer(r.ARRAY_BUFFER, a.weights), r.enableVertexAttribArray(10), r.vertexAttribPointer(10, 4, r.FLOAT, !1, e instanceof require_skinned_mesh.SkinnedMesh ? e.influencesPerVertex * 4 : 16, 0), r.vertexAttribDivisor(10, 0), e instanceof require_skinned_mesh.SkinnedMesh && e.influencesPerVertex === 8 ? (r.bindBuffer(r.ARRAY_BUFFER, a.indices), r.enableVertexAttribArray(12), r.vertexAttribIPointer(12, 4, r.UNSIGNED_INT, 32, 16), r.vertexAttribDivisor(12, 0), r.bindBuffer(r.ARRAY_BUFFER, a.weights), r.enableVertexAttribArray(13), r.vertexAttribPointer(13, 4, r.FLOAT, !1, 32, 16), r.vertexAttribDivisor(13, 0)) : (r.disableVertexAttribArray(12), r.disableVertexAttribArray(13), r.vertexAttribI4ui(12, 0, 0, 0, 0), r.vertexAttrib4f(13, 0, 0, 0, 0))) : (r.disableVertexAttribArray(9), r.disableVertexAttribArray(10), r.disableVertexAttribArray(12), r.disableVertexAttribArray(13), r.vertexAttribI4ui(12, 0, 0, 0, 0), r.vertexAttrib4f(13, 0, 0, 0, 0), r.vertexAttribI4ui(9, 0, 0, 0, 0), r.vertexAttrib4f(10, 1, 0, 0, 0), r.uniform1i(t.jointPalette, 0)), e instanceof require_instanced_mesh.InstancedMesh) {
			let i = this.cacheInstances(e, n);
			r.bindBuffer(r.ARRAY_BUFFER, i.buffer);
			for (let e = 0; e < 4; e++) r.enableVertexAttribArray(3 + e), r.vertexAttribPointer(3 + e, 4, r.FLOAT, !1, 64, e * 16), r.vertexAttribDivisor(3 + e, 1);
			e.colors ? (r.bindBuffer(r.ARRAY_BUFFER, i.colors), r.enableVertexAttribArray(7), r.vertexAttribPointer(7, 3, r.FLOAT, !1, 12, 0), r.vertexAttribDivisor(7, 1)) : (r.disableVertexAttribArray(7), r.vertexAttribDivisor(7, 0)), r.uniform1i(t.instanced, 1), r.drawElementsInstanced(r.TRIANGLES, e.geometry.indices.length, r.UNSIGNED_INT, 0, n?.count ?? e.count);
		} else {
			for (let e = 0; e < 4; e++) r.disableVertexAttribArray(3 + e), r.vertexAttribDivisor(3 + e, 0);
			r.disableVertexAttribArray(7), r.vertexAttribDivisor(7, 0), r.uniform1i(t.instanced, 0), r.drawElements(r.TRIANGLES, e.geometry.indices.length, r.UNSIGNED_INT, 0);
		}
	}
	cacheSkin(e) {
		let t = this.gl, n = this.meshSkins.get(e);
		if (n) n.version !== e.paletteVersion && (t.activeTexture(t.TEXTURE0 + 16), t.bindTexture(t.TEXTURE_2D, n.palette), t.texSubImage2D(t.TEXTURE_2D, 0, 0, 0, 4, e.joints.length, t.RGBA, t.FLOAT, e.jointPalette), this.stats.upload(e.jointPalette.byteLength), n.version = e.paletteVersion);
		else {
			if (e.joints.length > this.maxTextureSize) throw new require_errors.GraphicsError(`Skin palette exceeds the WebGL2 texture height limit.`);
			let r = e.jointIndices.byteLength + e.weights.byteLength + e.jointPalette.byteLength, i = this.residency.geometry.allocate(r, () => {
				let n = this.meshSkins.get(e);
				n && (t.deleteBuffer(n.indices), t.deleteBuffer(n.weights), t.deleteTexture(n.palette), this.meshSkins.delete(e));
			}), a, o, s;
			try {
				if (a = this.createBuffer(t), o = this.createBuffer(t), s = t.createTexture() ?? void 0, !s) throw new require_errors.GraphicsError(`WebGL2 could not allocate a joint palette.`);
				t.bindBuffer(t.ARRAY_BUFFER, a), t.bufferData(t.ARRAY_BUFFER, e.jointIndices, t.STATIC_DRAW), t.bindBuffer(t.ARRAY_BUFFER, o), t.bufferData(t.ARRAY_BUFFER, e.weights, t.STATIC_DRAW), t.activeTexture(t.TEXTURE0 + 16), t.bindTexture(t.TEXTURE_2D, s), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.NEAREST), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.NEAREST), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA32F, 4, e.joints.length, 0, t.RGBA, t.FLOAT, e.jointPalette), this.stats.upload(r), n = {
					allocation: i,
					indices: a,
					weights: o,
					palette: s,
					version: e.paletteVersion,
					seen: this.frame
				}, this.meshSkins.set(e, n);
			} catch (e) {
				throw a && t.deleteBuffer(a), o && t.deleteBuffer(o), s && t.deleteTexture(s), i.destroy(), e;
			}
		}
		return n.allocation.touch(), n.seen = this.frame, n;
	}
	cacheInstances(e, t) {
		let n = this.gl, r = t ? this.visibleMeshInstances : this.meshInstances, i = t?.matrices ?? e.matrices, a = t ? t.colors : e.colors, o = t?.version ?? e.version, s = t?.version ?? e.colorVersion, c = t?.count ?? e.count, l = r.get(e);
		if (!l) {
			let t = this.residency.geometry.allocate(i.byteLength + (a?.byteLength ?? 0), () => {
				let t = r.get(e);
				t && (n.deleteBuffer(t.buffer), t.colors && n.deleteBuffer(t.colors), r.delete(e));
			}), o;
			try {
				o = this.createBuffer(n);
			} catch (e) {
				throw t.destroy(), e;
			}
			l = {
				buffer: o,
				allocation: t,
				version: -1,
				matrixBytes: 0,
				colors: void 0,
				colorVersion: -1,
				colorBytes: 0,
				seen: this.frame
			}, r.set(e, l);
		}
		return l.payload !== t && (l.version = l.colorVersion = -1, l.payload = t), l.allocation.resize(i.byteLength + (a?.byteLength ?? 0)), n.bindBuffer(n.ARRAY_BUFFER, l.buffer), l.matrixBytes !== i.byteLength && (n.bufferData(n.ARRAY_BUFFER, i.byteLength, n.DYNAMIC_DRAW), l.matrixBytes = i.byteLength, l.version = -1), l.version !== o && c > 0 && (n.bufferSubData(n.ARRAY_BUFFER, 0, i, 0, c * 16), this.stats.upload(c * 64)), l.version = o, a ? (l.colors || (l.colors = this.createBuffer(n)), n.bindBuffer(n.ARRAY_BUFFER, l.colors), l.colorBytes !== a.byteLength && (n.bufferData(n.ARRAY_BUFFER, a.byteLength, n.DYNAMIC_DRAW), l.colorBytes = a.byteLength, l.colorVersion = -1), l.colorVersion !== s && c > 0 && (n.bufferSubData(n.ARRAY_BUFFER, 0, a, 0, c * 3), this.stats.upload(c * 12)), l.colorVersion = s) : l.colors && (n.deleteBuffer(l.colors), l.colors = void 0, l.colorVersion = -1, l.colorBytes = 0), l.seen = this.frame, l;
	}
	drawShadows(e) {
		let t = this.gl, a = this.atlas.size;
		if (a > this.maxWidth || a > this.maxHeight) throw new require_errors.GraphicsError(`WebGL2 shadow map size ${a} exceeds this device's framebuffer limit.`);
		if ((!this.shadowTarget || this.shadowTarget.width !== a) && (this.shadowTarget && this.deleteTarget(this.shadowTarget), this.shadowTarget = void 0, this.shadowTarget = this.createTarget(a, a, !0), this.shadowCache.invalidate()), !this.shadowCache.needsRender(e, this.atlas, this.visibility.shadows, this.visibility.entries, this.canvas.width, this.canvas.height)) {
			this.shadowCache.commit(), this.stats.shadowCacheHits++;
			return;
		}
		this.stats.shadowPasses++;
		let o = this.shadowUniforms;
		t.bindFramebuffer(t.FRAMEBUFFER, this.shadowTarget.framebuffer), t.disable(t.SCISSOR_TEST), t.viewport(0, 0, a, a), t.disable(t.BLEND), t.enable(t.DEPTH_TEST), t.depthFunc(t.LESS), t.depthMask(!0), t.clearDepth(1), t.clear(t.DEPTH_BUFFER_BIT), t.useProgram(this.shadowProgram), t.enable(t.SCISSOR_TEST);
		let s = e.shadows.mapSize;
		for (let e = 0; e < this.atlas.count; e++) {
			let a = e % this.atlas.grid * s, c = Math.floor(e / this.atlas.grid) * s;
			t.viewport(a, c, s, s), t.scissor(a, c, s, s), t.uniformMatrix4fv(o.viewProjection, !1, this.atlas.matrices[e].elements), t.disable(t.CULL_FACE);
			for (let a of this.visibility.shadows) {
				let s = a.material, c = s instanceof require_pbr_material.PBRMaterial;
				if (require_native_material3d.isNativeMaterial3D(s)) {
					let e = this.nativeMaterials.get(s);
					if (!e || s.destroyed) throw new require_errors.GraphicsError(`Shadow native 3D material must be explicitly prepared before rendering.`);
					if (s.validate(), o = e.shadowUniforms, t.useProgram(e.shadow), t.uniform4fv(o[`xyzUniforms[0]`], s.uniforms), !(s instanceof require_native_pbr_material.NativePBRMaterial)) for (let e = 0; e < 4; e++) t.uniform1i(o[`xyzMap${e}`], e + 1), this.bindMaterialTexture(require_native_material3d.nativeMaterialSources(s)[e] ?? require_mesh.materialBaseTexture(s), e + 1);
				} else o = this.shadowUniforms, t.useProgram(this.shadowProgram);
				require_material_uv.fillMaterialUV(s, a.renderGeometry, this.materialUVData), t.uniform4fv(o[`materialCoordinates[0]`], this.materialUVData), t.uniformMatrix4fv(o.viewProjection, !1, this.atlas.matrices[e].elements), t.uniform1i(o.image, 0), t.uniform1f(o.alphaCutoff, c ? s.alphaCutoff : 0), t.uniform1f(o.opacity, s.opacity), t.uniform1f(o.meshFade, this.visibility.entries.get(a)?.fade ?? 1), t.uniform1i(o.doubleSided, c && !s.doubleSided ? 0 : 1), t.uniform1i(o.alphaMode, c ? s.alphaMode === `OPAQUE` ? 0 : s.alphaMode === `MASK` ? 1 : 2 : 2), this.bindMaterialTexture(require_mesh.materialBaseTexture(s), 0, s.textureSampler), this.drawMesh(a, o), this.stats.shadowDrawCalls++;
			}
		}
		t.disable(t.SCISSOR_TEST), this.shadowCache.commit();
	}
	prepareCoverageTarget(e, t, n) {
		let r = this.gl, i = n === `hdr` ? this.coverageCapabilities.hdrSamples : this.coverageCapabilities.rgba8Samples;
		if (i < 2) throw new require_errors.GraphicsError(`WebGL2 ${n} alpha-to-coverage requires supported renderer antialiasing.`);
		let a = this.coverageTarget;
		if (a && a.width === e && a.height === t && a.format === n && a.samples === i) return;
		this.releaseCoverageTarget();
		let o = r.createFramebuffer(), s = r.createRenderbuffer(), c = r.createRenderbuffer();
		try {
			if (!o || !s || !c) throw new require_errors.GraphicsError(`WebGL2 coverage target allocation failed.`);
			if (r.bindFramebuffer(r.FRAMEBUFFER, o), r.bindRenderbuffer(r.RENDERBUFFER, s), r.renderbufferStorageMultisample(r.RENDERBUFFER, i, n === `hdr` ? r.RGBA16F : r.RGBA8, e, t), r.framebufferRenderbuffer(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0, r.RENDERBUFFER, s), r.bindRenderbuffer(r.RENDERBUFFER, c), r.renderbufferStorageMultisample(r.RENDERBUFFER, i, r.DEPTH_COMPONENT24, e, t), r.framebufferRenderbuffer(r.FRAMEBUFFER, r.DEPTH_ATTACHMENT, r.RENDERBUFFER, c), r.checkFramebufferStatus(r.FRAMEBUFFER) !== r.FRAMEBUFFER_COMPLETE) throw new require_errors.GraphicsError(`WebGL2 coverage framebuffer is incomplete.`);
			this.coverageTarget = {
				framebuffer: o,
				color: s,
				depth: c,
				width: e,
				height: t,
				samples: i,
				format: n
			}, this.stats.target(e * t * i * (n === `hdr` ? 12 : 8));
		} catch (e) {
			throw o && r.deleteFramebuffer(o), s && r.deleteRenderbuffer(s), c && r.deleteRenderbuffer(c), e;
		} finally {
			r.bindFramebuffer(r.FRAMEBUFFER, null), r.bindRenderbuffer(r.RENDERBUFFER, null);
		}
	}
	releaseCoverageTarget() {
		let e = this.coverageTarget;
		if (!e) return;
		let t = this.gl;
		t.deleteFramebuffer(e.framebuffer), t.deleteRenderbuffer(e.color), t.deleteRenderbuffer(e.depth), this.stats.target(-e.width * e.height * e.samples * (e.format === `hdr` ? 12 : 8)), this.coverageTarget = void 0;
	}
	resolveCoverageTarget() {
		let e = this.coverageTarget, t = this.postTarget, n = this.gl;
		n.bindFramebuffer(n.READ_FRAMEBUFFER, e.framebuffer), n.bindFramebuffer(n.DRAW_FRAMEBUFFER, t.framebuffer), n.blitFramebuffer(0, 0, e.width, e.height, 0, 0, e.width, e.height, n.COLOR_BUFFER_BIT | n.DEPTH_BUFFER_BIT, n.NEAREST), n.bindFramebuffer(n.FRAMEBUFFER, t.framebuffer);
	}
	preparePostTarget(e, t, n = `hdr`) {
		if (n === `hdr` && !this.floatColorBuffer) throw new require_errors.GraphicsError(`WebGL2 ${this.weighted ? `weighted transparency` : `HDR rendering`} requires EXT_color_buffer_float.`);
		(this.postTarget?.width !== e || this.postTarget.height !== t || this.postTarget.format !== n) && (this.releaseOIT(), this.postTarget && this.deleteTarget(this.postTarget), this.postTarget = void 0, this.postTarget = this.createTarget(e, t, !1, n, `texture`));
	}
	prepareRefractionTarget(e, t) {
		(this.refractionTarget?.width !== e || this.refractionTarget.height !== t) && (this.refractionTarget && this.deleteTarget(this.refractionTarget), this.refractionTarget = void 0, this.refractionTarget = this.createTarget(e, t, !1, `hdr`, !1));
	}
	prepareOIT(e, t) {
		let n = this.gl;
		if (this.oitAccumulation?.width !== e || this.oitAccumulation.height !== t) {
			this.releaseOIT();
			try {
				this.oitAccumulation = this.createTarget(e, t, !1, `hdr`, !1), this.oitRevealage = this.createTarget(e, t, !1, `rgba8`, !1);
				for (let e of [this.oitAccumulation, this.oitRevealage]) if (n.bindFramebuffer(n.FRAMEBUFFER, e.framebuffer), n.framebufferTexture2D(n.FRAMEBUFFER, n.DEPTH_ATTACHMENT, n.TEXTURE_2D, this.postTarget.depthTexture, 0), n.checkFramebufferStatus(n.FRAMEBUFFER) !== n.FRAMEBUFFER_COMPLETE) throw new require_errors.GraphicsError(`WebGL2 weighted transparency framebuffer is incomplete.`);
				this.oitProgram || (this.oitProgram = this.createProgram(n, require_webgl_feature_shaders.postVertex, require_oit_shaders.oitCompositeGLSL, `weighted transparency`), n.useProgram(this.oitProgram), n.uniform1i(n.getUniformLocation(this.oitProgram, `accumulation`), 0), n.uniform1i(n.getUniformLocation(this.oitProgram, `revealage`), 1));
			} catch (e) {
				throw this.releaseOIT(), e;
			}
		}
	}
	resolveOIT() {
		let e = this.gl, t = this.oitProgram;
		e.bindFramebuffer(e.FRAMEBUFFER, this.postTarget.framebuffer), e.disable(e.DEPTH_TEST), e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA), e.useProgram(t), e.bindVertexArray(this.triangleVAO), e.activeTexture(e.TEXTURE0), e.bindSampler(0, null), e.bindTexture(e.TEXTURE_2D, this.oitAccumulation.texture), e.activeTexture(e.TEXTURE1), e.bindSampler(1, null), e.bindTexture(e.TEXTURE_2D, this.oitRevealage.texture), e.drawArrays(e.TRIANGLES, 0, 3), e.bindTexture(e.TEXTURE_2D, null), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, null);
	}
	releaseOIT() {
		this.oitAccumulation && this.deleteTarget(this.oitAccumulation), this.oitRevealage && this.deleteTarget(this.oitRevealage), this.oitAccumulation = this.oitRevealage = void 0;
	}
	createTarget(e, t, n, r = `hdr`, i = !0) {
		let a = this.gl, o = a.createFramebuffer(), s = a.createTexture(), c = n || !i || i === `texture` ? null : a.createRenderbuffer(), l = !n && i === `texture` ? a.createTexture() : null;
		try {
			if (!o || !s || !n && i && !c && !l) throw new require_errors.GraphicsError(`WebGL2 could not allocate an offscreen render target.`);
			a.bindFramebuffer(a.FRAMEBUFFER, o), a.bindTexture(a.TEXTURE_2D, s);
			let u = !n && r === `rgba8` ? a.LINEAR : a.NEAREST;
			if (a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MIN_FILTER, u), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MAG_FILTER, u), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_S, a.CLAMP_TO_EDGE), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_T, a.CLAMP_TO_EDGE), n ? (a.texImage2D(a.TEXTURE_2D, 0, a.DEPTH_COMPONENT24, e, t, 0, a.DEPTH_COMPONENT, a.UNSIGNED_INT, null), a.framebufferTexture2D(a.FRAMEBUFFER, a.DEPTH_ATTACHMENT, a.TEXTURE_2D, s, 0), a.drawBuffers([a.NONE]), a.readBuffer(a.NONE)) : (a.texImage2D(a.TEXTURE_2D, 0, r === `hdr` ? a.RGBA16F : a.RGBA8, e, t, 0, a.RGBA, r === `hdr` ? a.HALF_FLOAT : a.UNSIGNED_BYTE, null), a.framebufferTexture2D(a.FRAMEBUFFER, a.COLOR_ATTACHMENT0, a.TEXTURE_2D, s, 0), c && (a.bindRenderbuffer(a.RENDERBUFFER, c), a.renderbufferStorage(a.RENDERBUFFER, a.DEPTH_COMPONENT24, e, t), a.framebufferRenderbuffer(a.FRAMEBUFFER, a.DEPTH_ATTACHMENT, a.RENDERBUFFER, c)), l && (a.bindTexture(a.TEXTURE_2D, l), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MIN_FILTER, a.NEAREST), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MAG_FILTER, a.NEAREST), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_S, a.CLAMP_TO_EDGE), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_T, a.CLAMP_TO_EDGE), a.texImage2D(a.TEXTURE_2D, 0, a.DEPTH_COMPONENT24, e, t, 0, a.DEPTH_COMPONENT, a.UNSIGNED_INT, null), a.framebufferTexture2D(a.FRAMEBUFFER, a.DEPTH_ATTACHMENT, a.TEXTURE_2D, l, 0))), a.checkFramebufferStatus(a.FRAMEBUFFER) !== a.FRAMEBUFFER_COMPLETE) throw new require_errors.GraphicsError(`WebGL2 ${n ? `shadow` : r === `hdr` ? `HDR` : `RGBA8`} framebuffer is incomplete.`);
			let d = {
				framebuffer: o,
				texture: s,
				...c ? { depth: c } : {},
				...l ? { depthTexture: l } : {},
				width: e,
				height: t,
				format: r
			}, f = e * t * ((n ? 4 : r === `hdr` ? 8 : 4) + (c || l ? 4 : 0));
			return this.targetBytes.set(d, f), this.stats.target(f), d;
		} catch (e) {
			throw o && a.deleteFramebuffer(o), s && a.deleteTexture(s), c && a.deleteRenderbuffer(c), l && a.deleteTexture(l), e;
		} finally {
			a.bindFramebuffer(a.FRAMEBUFFER, null), a.bindRenderbuffer(a.RENDERBUFFER, null);
		}
	}
	deleteTarget(e) {
		let t = this.gl, n = this.targetBytes.get(e);
		n !== void 0 && (this.stats.target(-n), this.targetBytes.delete(e)), t.deleteFramebuffer(e.framebuffer), t.deleteTexture(e.texture), e.depth && t.deleteRenderbuffer(e.depth), e.depthTexture && t.deleteTexture(e.depthTexture);
	}
	drawPost(e, t) {
		let n = this.gl, r = e.postProcessing, i = r.enabled, a = i && r.fxaa, o = this.temporalActive && r.taa ? this.temporal.applyTAA(this.postTarget.texture, this.postTarget.depthTexture, this.temporalState, r).texture : this.postTarget.texture;
		a ? (!this.fxaaTarget || this.fxaaTarget.width !== this.postTarget.width || this.fxaaTarget.height !== this.postTarget.height) && (this.fxaaTarget && this.deleteTarget(this.fxaaTarget), this.fxaaTarget = void 0, this.fxaaTarget = this.createTarget(this.postTarget.width, this.postTarget.height, !1, `rgba8`, !1)) : this.fxaaTarget &&= (this.deleteTarget(this.fxaaTarget), void 0), n.bindFramebuffer(n.FRAMEBUFFER, a ? this.fxaaTarget.framebuffer : t), n.disable(n.BLEND), n.disable(n.DEPTH_TEST), n.disable(n.CULL_FACE), n.useProgram(this.postProgram), n.bindVertexArray(this.triangleVAO), n.activeTexture(n.TEXTURE0), n.bindSampler(0, null), n.bindTexture(n.TEXTURE_2D, o), n.uniform4f(this.postUniforms.settings, i ? r.exposure : 1, i ? r.bloomStrength : 0, r.bloomThreshold, r.bloomRadius), n.uniform1i(this.postUniforms.aces, i && r.toneMapping === `aces` ? 1 : 0), n.activeTexture(n.TEXTURE1), n.bindSampler(1, null), n.bindTexture(n.TEXTURE_2D, this.postTarget.depthTexture), n.uniform1i(this.postUniforms.depthImage, 1), this.invViewProjection.copy(this.temporalActive ? this.temporalState.currentVP : e.camera3D.matrix).invert(), n.uniformMatrix4fv(this.postUniforms.inverseVP, !1, this.invViewProjection.elements);
		let s = e.camera3D, c = s.matrix.elements;
		n.uniform4f(this.postUniforms.clip, s.near, s.far, +(s instanceof require_orthographic_camera.OrthographicCamera), Math.hypot(c[1], c[5], c[9])), n.uniform4f(this.postUniforms.ssao, i && r.ssao ? 1 : 0, r.ssaoRadius, r.ssaoStrength, r.ssaoBias), n.uniform4f(this.postUniforms.dof, i && r.depthOfField ? 1 : 0, r.dofFocusDistance, r.dofFocusRange, r.dofBlurRadius), n.activeTexture(n.TEXTURE0), n.drawArrays(n.TRIANGLES, 0, 3), a && (n.bindFramebuffer(n.FRAMEBUFFER, t), n.useProgram(this.fxaaProgram), n.bindTexture(n.TEXTURE_2D, this.fxaaTarget.texture), n.drawArrays(n.TRIANGLES, 0, 3)), this.temporalActive && this.temporalState.commit();
	}
	decodeColor(e) {
		return e <= .04045 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4;
	}
	cacheTexture(e) {
		if (e.kind === `render`) throw new require_errors.GraphicsError(`Render textures are managed by the native 2D target owner.`);
		if (e.destroyed) throw new require_errors.GraphicsError(`Cannot upload a destroyed texture.`);
		let t = this.textures.get(e);
		if (t?.version === e.version) return t.allocation.touch(), t;
		let n = this.gl, { width: r, height: i } = e;
		if (!Number.isSafeInteger(r) || !Number.isSafeInteger(i) || r < 1 || i < 1 || r > this.maxTextureSize || i > this.maxTextureSize) throw new require_errors.GraphicsError(`WebGL2 texture size ${r}×${i} exceeds its device budget.`);
		let a = e instanceof require_native_texture.NativeTexture2D;
		if (a && !this.supportedTextureFormats.includes(e.format)) throw new require_errors.GraphicsError(`WebGL2 does not support native texture format ${e.format}.`);
		let o = a ? e.byteLength : r * i * 4, s = t?.allocation ?? this.residency.textures.allocate(o, () => {
			let t = this.textures.get(e);
			t && n.deleteTexture(t.resource), this.textures.delete(e);
		});
		t && s.resize(o);
		let c = t?.resource ?? n.createTexture();
		if (!c) throw s.destroy(), new require_errors.GraphicsError(`WebGL2 could not allocate a texture.`);
		try {
			n.bindTexture(n.TEXTURE_2D, c), n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL, !1), n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, a ? n.LINEAR_MIPMAP_LINEAR : n.LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAX_LEVEL, a ? e.levels.length - 1 : 0), a ? require_native_texture_upload.uploadNativeWebGL(n, e) : n.texImage2D(n.TEXTURE_2D, 0, n.RGBA, n.RGBA, n.UNSIGNED_BYTE, e.image), this.stats.upload(o);
			let r = n.getError();
			if (r !== n.NO_ERROR) throw new require_errors.GraphicsError(`WebGL2 texture upload failed (GL error 0x${r.toString(16)}).`);
			let i = t ?? {
				resource: c,
				allocation: s,
				seen: this.frame,
				version: e.version,
				prepared: !1
			};
			return i.version = e.version, this.textures.set(e, i), i;
		} catch (e) {
			throw t || n.deleteTexture(c), t || s.destroy(), e;
		}
	}
	uploadEnvironment(e) {
		let t = this.environments.get(e);
		if (t) return t.allocation.touch(), t.seen = this.frame, t;
		let n = this.gl, r = e.levelSizes[0];
		if (r.width > this.maxTextureSize || r.height > this.maxTextureSize) throw new require_errors.GraphicsError(`WebGL2 environment ${r.width}x${r.height} exceeds its device budget.`);
		let i = this.residency.textures.allocate(e.levelSizes.reduce((e, t) => e + t.width * t.height * 8, 0), () => {
			let t = this.environments.get(e);
			t && n.deleteTexture(t.resource), this.environments.delete(e);
		}), a = n.createTexture();
		if (!a) throw i.destroy(), new require_errors.GraphicsError(`WebGL2 could not allocate a texture.`);
		try {
			n.bindTexture(n.TEXTURE_2D, a), n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL, !1), n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, n.LINEAR_MIPMAP_LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.REPEAT), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_BASE_LEVEL, 0), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAX_LEVEL, e.mipCount - 1);
			for (let t = 0; t < e.mipCount; t++) {
				let r = e.levelSizes[t];
				n.texImage2D(n.TEXTURE_2D, t, n.RGBA16F, r.width, r.height, 0, n.RGBA, n.HALF_FLOAT, e.levels[t]), this.stats.upload(e.levels[t].byteLength);
			}
			let t = n.getError();
			if (t !== n.NO_ERROR) throw new require_errors.GraphicsError(`WebGL2 environment upload failed (GL error 0x${t.toString(16)}).`);
			let r = {
				resource: a,
				allocation: i,
				seen: this.frame
			};
			return this.environments.set(e, r), r;
		} catch (e) {
			throw n.deleteTexture(a), i.destroy(), e;
		}
	}
	ensureProbeEnvironment(e) {
		require_render_data.selectReflectionProbes(e, this.selectedProbes);
		let t = require_render_data.activeEnvironment(e), n = !this.probeTexture || this.probeMaps[0] !== t;
		for (let e = 0; e < 4; e++) this.probeMaps[e + 1] !== this.selectedProbes[e]?.environment && (n = !0);
		if (!n) {
			this.probeAllocation?.touch();
			return;
		}
		this.probeAllocation?.destroy(), this.probeMaps.length = 5, this.probeMaps[0] = t;
		for (let e = 0; e < 4; e++) this.probeMaps[e + 1] = this.selectedProbes[e]?.environment;
		let r = require_probe_texture_array.packProbeTextures(this.probeMaps), i = this.gl, a = this.residency.textures.allocate(r.bytes, () => {
			i.deleteTexture(this.probeTexture ?? null), this.probeTexture = void 0;
		}), o = i.createTexture();
		if (!o) throw a.destroy(), new require_errors.GraphicsError(`Cannot allocate native probe array.`);
		this.probeTexture = o;
		try {
			i.activeTexture(i.TEXTURE6), i.bindSampler(6, null), i.bindTexture(i.TEXTURE_2D_ARRAY, o), i.texStorage3D(i.TEXTURE_2D_ARRAY, r.mipCount, i.RGBA16F, r.width, r.height, 5);
			for (let e = 0; e < r.mipCount; e++) {
				let t = r.levels[e];
				i.texSubImage3D(i.TEXTURE_2D_ARRAY, e, 0, 0, 0, t.width, t.height, 5, i.RGBA, i.HALF_FLOAT, t.data), this.stats.upload(t.data.byteLength);
			}
			i.texParameteri(i.TEXTURE_2D_ARRAY, i.TEXTURE_MIN_FILTER, i.LINEAR_MIPMAP_LINEAR), i.texParameteri(i.TEXTURE_2D_ARRAY, i.TEXTURE_MAG_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D_ARRAY, i.TEXTURE_WRAP_S, i.REPEAT), i.texParameteri(i.TEXTURE_2D_ARRAY, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D_ARRAY, i.TEXTURE_MAX_LEVEL, r.mipCount - 1), a.retain(), this.probeAllocation = a, this.probeMipCount = r.mipCount;
		} catch (e) {
			throw a.destroy(), e;
		}
	}
	drawSky(e, t, n) {
		let r = this.gl;
		this.invViewProjection.copy(this.temporalActive ? this.temporalState.currentVP : e.camera3D.updateMatrix(t)).invert(), r.useProgram(this.skyProgram), r.uniformMatrix4fv(this.skyUniforms.invViewProjection, !1, this.invViewProjection.elements), r.uniform2f(this.skyUniforms.sky, e.backgroundIntensity, +!!this.linear3D), r.activeTexture(r.TEXTURE0), r.bindSampler(0, null), r.bindTexture(r.TEXTURE_2D, this.uploadEnvironment(n).resource), r.disable(r.DEPTH_TEST), r.bindVertexArray(this.skyVAO), r.drawArrays(r.TRIANGLES, 0, 3), r.bindVertexArray(null);
	}
	syncVertexColors(e, t) {
		let n = this.gl, r = t.colors;
		if (!r) {
			e.colors && (n.deleteBuffer(e.colors), e.colors = void 0, e.colorBytes = 0), n.disableVertexAttribArray(8);
			return;
		}
		e.colors ||= this.createBuffer(n), n.bindBuffer(n.ARRAY_BUFFER, e.colors), e.colorBytes === r.byteLength ? n.bufferSubData(n.ARRAY_BUFFER, 0, r) : (n.bufferData(n.ARRAY_BUFFER, r, n.DYNAMIC_DRAW), e.colorBytes = r.byteLength), this.stats.upload(r.byteLength), n.enableVertexAttribArray(8), n.vertexAttribPointer(8, 4, n.FLOAT, !1, 16, 0);
	}
	syncVertexUV(e, t) {
		let n = this.gl, r = t.uvs1;
		r ? (e.uvs1 ??= this.createBuffer(n), n.bindBuffer(n.ARRAY_BUFFER, e.uvs1), n.bufferData(n.ARRAY_BUFFER, r, n.DYNAMIC_DRAW), this.stats.upload(r.byteLength), n.enableVertexAttribArray(11), n.vertexAttribPointer(11, 2, n.FLOAT, !1, 8, 0), n.vertexAttribDivisor(11, 0)) : (e.uvs1 && n.deleteBuffer(e.uvs1), e.uvs1 = void 0, n.disableVertexAttribArray(11));
	}
	syncTangents(e, t) {
		let n = this.gl, r = e.tangents !== void 0;
		e.tangents ??= this.createBuffer(n), n.bindBuffer(n.ARRAY_BUFFER, e.tangents), r ? n.bufferSubData(n.ARRAY_BUFFER, 0, t.tangents) : n.bufferData(n.ARRAY_BUFFER, t.tangents, n.DYNAMIC_DRAW), this.stats.upload(t.tangents.byteLength), n.enableVertexAttribArray(14), n.vertexAttribPointer(14, 4, n.FLOAT, !1, 16, 0), n.vertexAttribDivisor(14, 0);
	}
	cacheGeometry(e) {
		let t = this.gl, n = this.geometries.get(e);
		if (n) return n.allocation.resize(e.vertices.byteLength + e.indices.byteLength + e.tangents.byteLength + (e.colors?.byteLength ?? 0) + (e.uvs1?.byteLength ?? 0)), n.version !== e.version && (t.bindVertexArray(n.vao), t.bindBuffer(t.ARRAY_BUFFER, n.vertex), t.bufferSubData(t.ARRAY_BUFFER, 0, e.vertices), this.stats.upload(e.vertices.byteLength), this.syncVertexColors(n, e), this.syncVertexUV(n, e), this.syncTangents(n, e), n.version = e.version), n;
		let r = this.residency.geometry.allocate(e.vertices.byteLength + e.indices.byteLength + e.tangents.byteLength + (e.colors?.byteLength ?? 0) + (e.uvs1?.byteLength ?? 0), () => {
			let n = this.geometries.get(e);
			n && (t.deleteVertexArray(n.vao), t.deleteBuffer(n.vertex), t.deleteBuffer(n.index), n.colors && t.deleteBuffer(n.colors), n.uvs1 && t.deleteBuffer(n.uvs1), n.tangents && t.deleteBuffer(n.tangents), this.geometries.delete(e));
		}), i, a, o;
		try {
			i = this.createVAO(t), a = this.createBuffer(t), o = this.createBuffer(t), t.bindVertexArray(i), t.bindBuffer(t.ARRAY_BUFFER, a), t.bufferData(t.ARRAY_BUFFER, e.vertices, t.DYNAMIC_DRAW), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, o), t.bufferData(t.ELEMENT_ARRAY_BUFFER, e.indices, t.STATIC_DRAW), this.stats.upload(e.vertices.byteLength + e.indices.byteLength), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 3, t.FLOAT, !1, 32, 0), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 3, t.FLOAT, !1, 32, 12), t.enableVertexAttribArray(2), t.vertexAttribPointer(2, 2, t.FLOAT, !1, 32, 24);
			let n = {
				allocation: r,
				vao: i,
				vertex: a,
				index: o,
				colors: void 0,
				colorBytes: 0,
				uvs1: void 0,
				tangents: void 0,
				seen: this.frame,
				version: e.version
			};
			try {
				this.syncVertexColors(n, e), this.syncVertexUV(n, e), this.syncTangents(n, e);
			} catch (e) {
				throw n.colors && t.deleteBuffer(n.colors), n.uvs1 && t.deleteBuffer(n.uvs1), n.tangents && t.deleteBuffer(n.tangents), e;
			}
			return t.bindVertexArray(null), this.geometries.set(e, n), n;
		} catch (e) {
			throw t.bindVertexArray(null), o && t.deleteBuffer(o), a && t.deleteBuffer(a), i && t.deleteVertexArray(i), r.destroy(), e;
		}
	}
	releaseUnused() {
		for (let [e, t] of this.textures) (e.destroyed || this.residency.textures.budgetBytes === 1 / 0 && t.seen !== this.frame && !t.allocation.references) && t.allocation.destroy();
		if (this.residency.geometry.budgetBytes === 1 / 0) {
			for (let e of this.geometries.values()) e.seen !== this.frame && !e.allocation.references && e.allocation.destroy();
			for (let e of this.meshInstances.values()) e.seen !== this.frame && !e.allocation.references && e.allocation.destroy();
			for (let e of this.visibleMeshInstances.values()) e.seen !== this.frame && !e.allocation.references && e.allocation.destroy();
			for (let e of this.meshSkins.values()) e.seen !== this.frame && !e.allocation.references && e.allocation.destroy();
		}
		for (let [e, t] of this.environments) (e.destroyed || this.residency.textures.budgetBytes === 1 / 0 && t.seen !== this.frame && !t.allocation.references) && t.allocation.destroy();
		for (let [e, t] of this.opticalTextures) (require_pbr_material.pbrTextureSources(e).transmissionTexture?.destroyed || require_pbr_material.pbrTextureSources(e).thicknessTexture?.destroyed || this.residency.textures.budgetBytes === 1 / 0 && t.seen !== this.frame && !t.allocation.references) && t.allocation.destroy();
	}
	createBuffer(e) {
		let t = e.createBuffer();
		if (!t) throw new require_errors.WebGL2InitializationError(`WebGL2 could not allocate a buffer.`);
		return t;
	}
	createVAO(e) {
		let t = e.createVertexArray();
		if (!t) throw new require_errors.WebGL2InitializationError(`WebGL2 could not allocate a vertex array.`);
		return t;
	}
	createProgram(e, t, n, r) {
		let i = [], a = null;
		try {
			for (let [a, o] of [[e.VERTEX_SHADER, t], [e.FRAGMENT_SHADER, n]]) {
				let t = e.createShader(a);
				if (!t) throw new require_errors.WebGL2InitializationError(`WebGL2 ${r} shader allocation failed.`);
				if (i.push(t), e.shaderSource(t, o), e.compileShader(t), !e.getShaderParameter(t, e.COMPILE_STATUS)) throw new require_errors.WebGL2InitializationError(`WebGL2 ${r} ${a === e.VERTEX_SHADER ? `vertex` : `fragment`} shader compilation failed: ${e.getShaderInfoLog(t) || `unknown error`}`);
			}
			if (a = e.createProgram(), !a) throw new require_errors.WebGL2InitializationError(`WebGL2 ${r} program allocation failed.`);
			for (let t of i) e.attachShader(a, t);
			if (e.linkProgram(a), !e.getProgramParameter(a, e.LINK_STATUS)) throw new require_errors.WebGL2InitializationError(`WebGL2 ${r} program linking failed: ${e.getProgramInfoLog(a) || `unknown error`}`);
			return a;
		} catch (t) {
			throw a && e.deleteProgram(a), t;
		} finally {
			for (let t of i) e.deleteShader(t);
		}
	}
	destroy() {
		if (this.destroyed) return;
		this.destroyed = !0, this.graphs?.destroy(), this.graphs = void 0, this.canvas?.removeEventListener(`webglcontextlost`, this.onContextLost);
		let e = this.gl;
		if (this.gpuTimer?.destroy(!!this.lostError), this.gpuTimer = void 0, this.occlusion?.destroy(), this.occlusion = void 0, this.particles3D?.destroy(), this.particles3D = void 0, this.visibilityCache.clear(), this.visibility.color.length = 0, this.visibility.shadows.length = 0, this.visibility.entries.clear(), this.visibility.occlusionCandidates.length = 0, e) {
			this.temporal?.destroy(), this.probeAllocation?.destroy();
			for (let t of this.nativeMaterials.values()) t.unsubscribe(), e.deleteProgram(t.program), e.deleteProgram(t.shadow);
			this.nativeMaterials.clear(), this.residency.clear(), this.preparedGeometry.clear(), this.releaseOIT(), this.releaseCoverageTarget(), this.oitProgram && e.deleteProgram(this.oitProgram), this.oitProgram = void 0, this.render2D?.destroy();
			for (let e of this.snapshots.keys()) e.destroy();
			for (let [t, n] of this.materials) t.removeEventListener(`destroy`, n.onDestroy), e.deleteProgram(n.program);
			for (let [t, n] of this.processors) t.removeEventListener(`destroy`, n.onDestroy), e.deleteProgram(n.program);
			this.frameTarget && this.deleteTarget(this.frameTarget), this.layerTarget && this.deleteTarget(this.layerTarget), this.effectTarget && this.deleteTarget(this.effectTarget), this.sceneTarget && this.deleteTarget(this.sceneTarget), this.compositeProgram && e.deleteProgram(this.compositeProgram);
			for (let t of this.textures.values()) e.deleteTexture(t.resource);
			for (let t of this.geometries.values()) e.deleteVertexArray(t.vao), e.deleteBuffer(t.vertex), e.deleteBuffer(t.index), t.colors && e.deleteBuffer(t.colors);
			for (let t of this.meshInstances.values()) e.deleteBuffer(t.buffer), t.colors && e.deleteBuffer(t.colors);
			for (let t of this.visibleMeshInstances.values()) e.deleteBuffer(t.buffer), t.colors && e.deleteBuffer(t.colors);
			for (let t of this.meshSkins.values()) e.deleteBuffer(t.indices), e.deleteBuffer(t.weights), e.deleteTexture(t.palette);
			for (let t of this.samplers.values()) e.deleteSampler(t);
			this.shadowTarget && this.deleteTarget(this.shadowTarget), this.shadowBuffer && e.deleteBuffer(this.shadowBuffer), this.sheenBuffer && e.deleteBuffer(this.sheenBuffer), this.brdfBuffer && e.deleteBuffer(this.brdfBuffer), this.refractionTarget && this.deleteTarget(this.refractionTarget), this.emptyOptical && e.deleteTexture(this.emptyOptical), this.opticalPackProgram && e.deleteProgram(this.opticalPackProgram), this.opticalPackFramebuffer && e.deleteFramebuffer(this.opticalPackFramebuffer);
			for (let t of this.opticalTextures.values()) e.deleteTexture(t.resource);
			this.postTarget && this.deleteTarget(this.postTarget), this.fxaaTarget && this.deleteTarget(this.fxaaTarget), this.fxaaProgram && e.deleteProgram(this.fxaaProgram), this.shadowProgram && e.deleteProgram(this.shadowProgram), this.postProgram && e.deleteProgram(this.postProgram), this.triangleVAO && e.deleteVertexArray(this.triangleVAO), this.triangleProgram && e.deleteProgram(this.triangleProgram), this.meshProgram && e.deleteProgram(this.meshProgram), this.skyProgram && e.deleteProgram(this.skyProgram), this.skyVAO && e.deleteVertexArray(this.skyVAO);
			for (let t of this.environments.values()) e.deleteTexture(t.resource);
		}
		this.textures.clear(), this.geometries.clear(), this.meshInstances.clear(), this.visibleMeshInstances.clear(), this.meshSkins.clear(), this.environments.clear(), this.samplers.clear(), this.opticalTextures.clear(), this.snapshots.clear(), this.materials.clear(), this.processors.clear(), this.frameTarget = void 0, this.layerTarget = void 0, this.effectTarget = void 0, this.sceneTarget = void 0, this.shadowTarget = void 0, this.postTarget = void 0, this.refractionTarget = void 0, this.fxaaTarget = void 0, this.render2D = void 0, this.commands.destroy(), this.gl = void 0, this.canvas = void 0, this.activeFrame = !1;
	}
	requireGL() {
		if (this.lostError) throw this.lostError;
		if (this.destroyed || !this.gl || !this.meshProgram) throw new require_errors.GraphicsError(`WebGL2 renderer is not initialized or has already been destroyed.`);
		return this.gl;
	}
};
//#endregion
exports.WebGL2Renderer = WebGL2Renderer;

//# sourceMappingURL=webgl2-renderer.cjs.map