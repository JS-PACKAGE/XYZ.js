const require_errors = require("./errors.cjs");
const require_hypot = require("../../math/src/hypot.cjs");
const require_orthographic_camera = require("../../core/src/orthographic-camera.cjs");
const require_post_effects = require("../../core/src/post-effects.cjs");
const require_gpu_timing = require("./gpu-timing.cjs");
const require_depth_post_shaders = require("./depth-post-shaders.cjs");
const require_color_grading_shaders = require("./color-grading-shaders.cjs");
const require_volumetric_post = require("./volumetric-post.cjs");
const require_lens_flare_post = require("./lens-flare-post.cjs");
const require_motion_blur_post = require("./motion-blur-post.cjs");
const require_fxaa_shaders = require("./fxaa-shaders.cjs");
//#region dist/packages/graphics/src/webgpu-post-pipeline.js
var m = /* @__PURE__ */ new WeakMap();
var h = /* @__PURE__ */ new WeakMap();
function registerPostLUTResidency(e, t) {
	m.set(e, t);
}
var postShader = (e) => `
struct Settings { values: vec4f, viewport: vec4f, inverseVP: mat4x4f, clip: vec4f, ssao: vec4f, dof: vec4f, grading: vec4f, fog: vec4f, fogColor: vec4f, shaft: vec4f, shaftColor: vec4f, flare: vec4f, halo: vec4f, previousVP: mat4x4f, blur: vec4f };
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var<uniform> settings: Settings;
${require_depth_post_shaders.depthPostWGSL(e)}
${require_color_grading_shaders.gradingWGSL}
${require_volumetric_post.volumetricWGSL}
${require_lens_flare_post.lensFlareWGSL}
${require_motion_blur_post.motionBlurWGSL}
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f,3>(vec2f(-1.0,-1.0),vec2f(3.0,-1.0),vec2f(-1.0,3.0));
  return vec4f(positions[index],0.0,1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let size = vec2i(textureDimensions(source));
  let pixel = clamp(vec2i(position.xy),vec2i(0),size-vec2i(1));
  let radius = i32(min(floor(settings.viewport.z+0.5),f32(max(size.x,size.y))));
  let sample = motionSample(pixel);
  var color = sample.rgb/max(sample.a,0.000001)*ambientOcclusion(pixel);
  color = volumetric(color,pixel);
  color = lensFlare(color,pixel);
  var bloom = vec3f(0.0);
  if (settings.values.z > 0.0) {
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let offset = vec2i(x,y)*radius;
        let neighbor = textureLoad(source,clamp(pixel+offset,vec2i(0),size-vec2i(1)),0);
        bloom += max(neighbor.rgb/max(neighbor.a,0.000001)-vec3f(settings.values.w),vec3f(0.0));
      }
    }
  }
  color = max((color+bloom*(settings.values.z/9.0))*settings.values.x,vec3f(0.0));
  color = tone(color);
  color = select(1.055*pow(color,vec3f(1.0/2.4))-0.055,color*12.92,color <= vec3f(0.0031308));
  color = grade(color);
  return vec4f(color*sample.a,sample.a);
}
`;
var WebGPUPostPipeline = class WebGPUPostPipeline {
	device;
	pipeline;
	fxaaPipeline;
	format;
	stats;
	texture;
	view;
	bindGroup;
	depthView;
	buffer;
	fxaaTexture;
	fxaaView;
	fxaaGroup;
	fxaaSampler;
	emptyVelocity;
	width = 0;
	height = 0;
	lutTexture;
	lut;
	data = /* @__PURE__ */ new Float32Array(84);
	attachment = {
		loadOp: `clear`,
		storeOp: `store`
	};
	descriptor = { colorAttachments: [this.attachment] };
	constructor(e, t, n, r, i) {
		this.device = e, this.pipeline = t, this.fxaaPipeline = n, this.format = r, this.stats = i, this.emptyVelocity = e.createTexture({
			size: [1, 1],
			format: `rgba16float`,
			usage: GPUTextureUsage.TEXTURE_BINDING
		}), this.fxaaSampler = e.createSampler({
			minFilter: `linear`,
			magFilter: `linear`
		});
	}
	static async initialize(e, i, a, o, s) {
		let c = e.createShaderModule({ code: postShader(o) }), l = e.createShaderModule({ code: require_fxaa_shaders.fxaaWGSL }), [u, d] = await Promise.all([c.getCompilationInfo(), l.getCompilationInfo()]);
		if (a()) throw new require_errors.GraphicsError(`WebGPU renderer was destroyed during initialization.`);
		let f = [...u.messages, ...d.messages].filter((e) => e.type === `error`);
		if (f.length) throw new require_errors.WebGPUInitializationError(`WebGPU post shader compilation failed: ${f.map((e) => `${e.lineNum}:${e.linePos} ${e.message}`).join(`; `)}`);
		let p = e.createRenderPipeline({
			layout: `auto`,
			vertex: {
				module: c,
				entryPoint: `vertexMain`
			},
			fragment: {
				module: c,
				entryPoint: `fragmentMain`,
				targets: [{ format: i }]
			},
			primitive: { topology: `triangle-list` }
		}), m = e.createRenderPipeline({
			layout: `auto`,
			vertex: {
				module: l,
				entryPoint: `vertexMain`
			},
			fragment: {
				module: l,
				entryPoint: `fragmentMain`,
				targets: [{ format: i }]
			},
			primitive: { topology: `triangle-list` }
		});
		return new WebGPUPostPipeline(e, p, m, i, s);
	}
	target(e, t, n) {
		if (this.texture && this.width === e && this.height === t) return this.view;
		this.releaseTarget(), this.buffer ||= this.device.createBuffer({
			size: this.data.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		});
		let r = this.device.createTexture({
			size: [e, t],
			format: `rgba16float`,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC
		});
		this.stats.target(e * t * 8);
		try {
			let i = r.createView();
			return this.depthView = n, this.bindGroup = this.device.createBindGroup({
				layout: this.pipeline.getBindGroupLayout(0),
				entries: [
					{
						binding: 0,
						resource: i
					},
					{
						binding: 1,
						resource: { buffer: this.buffer }
					},
					{
						binding: 2,
						resource: n
					},
					{
						binding: 3,
						resource: this.ensureLUT().createView()
					},
					{
						binding: 4,
						resource: this.emptyVelocity.createView()
					}
				]
			}), this.texture = r, this.view = i, this.width = e, this.height = t, i;
		} catch (n) {
			throw r.destroy(), this.stats.target(-e * t * 8), n;
		}
	}
	copyColor(e, t) {
		e.copyTextureToTexture({ texture: this.texture }, { texture: t }, [this.width, this.height]);
	}
	get colorTexture() {
		return this.texture;
	}
	ensureFxaa() {
		if (this.fxaaTexture) return;
		let e = this.device.createTexture({
			size: [this.width, this.height],
			format: this.format,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
		});
		this.stats.target(this.width * this.height * 4);
		try {
			let t = e.createView(), n = this.device.createBindGroup({
				layout: this.fxaaPipeline.getBindGroupLayout(0),
				entries: [{
					binding: 0,
					resource: t
				}, {
					binding: 1,
					resource: this.fxaaSampler
				}]
			});
			this.fxaaTexture = e, this.fxaaView = t, this.fxaaGroup = n;
		} catch (t) {
			throw e.destroy(), this.stats.target(-this.width * this.height * 4), t;
		}
	}
	releaseFxaa() {
		this.fxaaTexture?.destroy(), this.fxaaTexture && this.stats.target(-this.width * this.height * 4), this.fxaaTexture = void 0, this.fxaaView = void 0, this.fxaaGroup = void 0;
	}
	render(t, n, r, i, a, s, l, u, m, h) {
		let g = r.enabled, _ = g && r.fxaa, v = require_post_effects.getPostEffects(r);
		v?.validate();
		let y = v?.toneMapper ?? r.toneMapping, b = v?.colorGrading?.lut;
		this.lut !== b && (this.bindGroup = void 0);
		let x = this.bindGroup;
		(s || h || !x) && (x = this.device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: (s ?? this.texture).createView()
				},
				{
					binding: 1,
					resource: { buffer: this.buffer }
				},
				{
					binding: 2,
					resource: l ?? this.depthView
				},
				{
					binding: 3,
					resource: this.ensureLUT(b).createView()
				},
				{
					binding: 4,
					resource: h ?? this.emptyVelocity.createView()
				}
			]
		}), !s && !h && (this.bindGroup = x)), this.data[0] = g ? r.exposure : 1, this.data[1] = g ? y === `aces` ? 1 : y === `agx` ? 2 : y === `reinhard` ? 3 : y === `neutral` ? 4 : 0 : 0, this.data[2] = g ? r.bloomStrength : 0, this.data[3] = r.bloomThreshold, this.data[4] = this.width, this.data[5] = this.height, this.data[6] = r.bloomRadius, this.data.set(a.elements, 8), this.data[24] = i.near, this.data[25] = i.far, this.data[26] = +(i instanceof require_orthographic_camera.OrthographicCamera);
		let S = i.matrix.elements;
		this.data[27] = require_hypot.hypot3(S[1], S[5], S[9]), this.data[28] = g && r.ssao ? 1 : 0, this.data[29] = r.ssaoRadius, this.data[30] = r.ssaoStrength, this.data[31] = r.ssaoBias, this.data[32] = g && r.depthOfField ? 1 : 0, this.data[33] = r.dofFocusDistance, this.data[34] = r.dofFocusRange, this.data[35] = r.dofBlurRadius, this.data[36] = v?.colorGrading?.lut.size ?? 1, this.data[37] = g ? v?.colorGrading?.strength ?? 0 : 0, require_volumetric_post.writeVolumetricUniforms(this.data, 40, u);
		let C = v?.lensFlare;
		this.data[56] = g && C?.enabled ? C.strength : 0, this.data[57] = C?.threshold ?? 1, this.data[58] = C?.ghosts ?? 1, this.data[59] = C?.spacing ?? 1, this.data[60] = C?.haloRadius ?? .3, this.data[61] = C?.haloWidth ?? .15, require_motion_blur_post.writeMotionBlurUniforms(this.data, 64, r, m), this.device.queue.writeBuffer(this.buffer, 0, this.data), this.stats.upload(this.data.byteLength), _ ? this.ensureFxaa() : this.releaseFxaa(), this.attachment.view = _ ? this.fxaaView : n;
		try {
			let r = require_gpu_timing.beginTimedRenderPass(t, this.descriptor);
			if (r.setPipeline(this.pipeline), r.setBindGroup(0, x), r.draw(3), r.end(), _) {
				this.attachment.view = n;
				let r = require_gpu_timing.beginTimedRenderPass(t, this.descriptor);
				r.setPipeline(this.fxaaPipeline), r.setBindGroup(0, this.fxaaGroup), r.draw(3), r.end();
			}
		} finally {
			this.attachment.view = void 0;
		}
	}
	resize(e, t) {
		(this.width !== e || this.height !== t) && this.releaseTarget();
	}
	releaseTarget() {
		this.texture?.destroy(), this.texture && this.stats.target(-this.width * this.height * 8), this.releaseFxaa(), this.texture = void 0, this.view = void 0, this.bindGroup = void 0, this.depthView = void 0, h.get(this)?.destroy(), this.lutTexture?.destroy(), this.lutTexture = void 0, this.lut = void 0;
	}
	ensureLUT(e) {
		let t = h.get(this);
		if (this.lutTexture && this.lut === e && !t?.destroyed) return t?.touch(), this.lutTexture;
		t?.destroy(), this.lutTexture?.destroy(), this.lut = e;
		let n = e?.size ?? 1;
		this.lutTexture = this.device.createTexture({
			size: [n * n, n],
			format: `rgba8unorm`,
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
		});
		let r = this.lutTexture, i = m.get(this);
		if (i) try {
			h.set(this, i.allocate(n * n * n * 4, () => {
				r.destroy(), this.lutTexture = void 0, this.lut = void 0, this.bindGroup = void 0, h.delete(this);
			}));
		} catch (e) {
			throw r.destroy(), this.lutTexture = void 0, this.lut = void 0, e;
		}
		return this.device.queue.writeTexture({ texture: this.lutTexture }, e?.strip ?? new Uint8Array([
			255,
			255,
			255,
			255
		]), { bytesPerRow: n * n * 4 }, [n * n, n]), this.lutTexture;
	}
	destroy() {
		this.releaseTarget(), this.emptyVelocity.destroy(), this.buffer?.destroy(), this.buffer = void 0;
	}
};
//#endregion
exports.WebGPUPostPipeline = WebGPUPostPipeline;
exports.registerPostLUTResidency = registerPostLUTResidency;

//# sourceMappingURL=webgpu-post-pipeline.cjs.map