const require_errors = require("./errors.cjs");
const require_orthographic_camera = require("../../core/src/orthographic-camera.cjs");
const require_gpu_timing = require("./gpu-timing.cjs");
const require_depth_post_shaders = require("./depth-post-shaders.cjs");
const require_fxaa_shaders = require("./fxaa-shaders.cjs");
//#region dist/packages/graphics/src/webgpu-post-pipeline.js
var postShader = (e) => `
struct Settings { values: vec4f, viewport: vec4f, inverseVP: mat4x4f, clip: vec4f, ssao: vec4f, dof: vec4f };
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var<uniform> settings: Settings;
${require_depth_post_shaders.depthPostWGSL(e)}
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f,3>(vec2f(-1.0,-1.0),vec2f(3.0,-1.0),vec2f(-1.0,3.0));
  return vec4f(positions[index],0.0,1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let size = vec2i(textureDimensions(source));
  let pixel = clamp(vec2i(position.xy),vec2i(0),size-vec2i(1));
  let radius = i32(min(floor(settings.viewport.z+0.5),f32(max(size.x,size.y))));
  let sample = focusedSample(pixel);
  var color = sample.rgb/max(sample.a,0.000001)*ambientOcclusion(pixel);
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
  if (settings.values.y > 0.5) {
    color = clamp((color*(2.51*color+0.03))/(color*(2.43*color+0.59)+0.14),vec3f(0.0),vec3f(1.0));
  }
  color = select(1.055*pow(color,vec3f(1.0/2.4))-0.055,color*12.92,color <= vec3f(0.0031308));
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
	buffer;
	fxaaTexture;
	fxaaView;
	fxaaGroup;
	fxaaSampler;
	width = 0;
	height = 0;
	data = /* @__PURE__ */ new Float32Array(36);
	attachment = {
		loadOp: `clear`,
		storeOp: `store`
	};
	descriptor = { colorAttachments: [this.attachment] };
	constructor(e, t, n, r, i) {
		this.device = e, this.pipeline = t, this.fxaaPipeline = n, this.format = r, this.stats = i, this.fxaaSampler = e.createSampler({
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
			return this.bindGroup = this.device.createBindGroup({
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
	render(t, n, r, i, o, s, c) {
		let l = r.enabled, u = l && r.fxaa, d = s ? this.device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: s.createView()
				},
				{
					binding: 1,
					resource: { buffer: this.buffer }
				},
				{
					binding: 2,
					resource: c
				}
			]
		}) : this.bindGroup;
		this.data[0] = l ? r.exposure : 1, this.data[1] = l && r.toneMapping === `aces` ? 1 : 0, this.data[2] = l ? r.bloomStrength : 0, this.data[3] = r.bloomThreshold, this.data[4] = this.width, this.data[5] = this.height, this.data[6] = r.bloomRadius, this.data.set(o.elements, 8), this.data[24] = i.near, this.data[25] = i.far, this.data[26] = +(i instanceof require_orthographic_camera.OrthographicCamera);
		let f = i.matrix.elements;
		this.data[27] = Math.hypot(f[1], f[5], f[9]), this.data[28] = l && r.ssao ? 1 : 0, this.data[29] = r.ssaoRadius, this.data[30] = r.ssaoStrength, this.data[31] = r.ssaoBias, this.data[32] = l && r.depthOfField ? 1 : 0, this.data[33] = r.dofFocusDistance, this.data[34] = r.dofFocusRange, this.data[35] = r.dofBlurRadius, this.device.queue.writeBuffer(this.buffer, 0, this.data), this.stats.upload(this.data.byteLength), u ? this.ensureFxaa() : this.releaseFxaa(), this.attachment.view = u ? this.fxaaView : n;
		try {
			let r = require_gpu_timing.beginTimedRenderPass(t, this.descriptor);
			if (r.setPipeline(this.pipeline), r.setBindGroup(0, d), r.draw(3), r.end(), u) {
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
		this.texture?.destroy(), this.texture && this.stats.target(-this.width * this.height * 8), this.releaseFxaa(), this.texture = void 0, this.view = void 0, this.bindGroup = void 0;
	}
	destroy() {
		this.releaseTarget(), this.buffer?.destroy(), this.buffer = void 0;
	}
};
//#endregion
exports.WebGPUPostPipeline = WebGPUPostPipeline;

//# sourceMappingURL=webgpu-post-pipeline.cjs.map