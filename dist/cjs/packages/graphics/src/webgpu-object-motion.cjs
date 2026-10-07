const require_gpu_timing = require("./gpu-timing.cjs");
const require_object_motion = require("./object-motion.cjs");
//#region dist/packages/graphics/src/webgpu-object-motion.js
var WebGPUObjectMotion = class {
	device;
	stats;
	history = new require_object_motion.ObjectMotionHistory();
	pipeline;
	layout;
	stride;
	groupForPass;
	texture;
	view;
	buffer;
	data = /* @__PURE__ */ new Float32Array();
	width = 0;
	height = 0;
	constructor(e, n, r) {
		this.device = e, this.stats = r, this.stride = Math.ceil(128 / e.limits.minUniformBufferOffsetAlignment) * e.limits.minUniformBufferOffsetAlignment, this.layout = e.createBindGroupLayout({ entries: [{
			binding: 0,
			visibility: GPUShaderStage.VERTEX,
			buffer: {
				type: `uniform`,
				hasDynamicOffset: !0,
				minBindingSize: 128
			}
		}, {
			binding: 1,
			visibility: GPUShaderStage.FRAGMENT,
			texture: {
				sampleType: `depth`,
				multisampled: n > 1
			}
		}] });
		let i = e.createShaderModule({ code: require_object_motion.objectMotionWGSL(n) });
		this.pipeline = e.createRenderPipeline({
			layout: e.createPipelineLayout({ bindGroupLayouts: [this.layout] }),
			vertex: {
				module: i,
				entryPoint: `vertexMain`,
				buffers: [{
					arrayStride: 32,
					attributes: [{
						shaderLocation: 0,
						offset: 0,
						format: `float32x3`
					}]
				}]
			},
			fragment: {
				module: i,
				entryPoint: `fragmentMain`,
				targets: [{ format: `rgba16float` }]
			},
			primitive: {
				topology: `triangle-list`,
				cullMode: `none`
			}
		});
	}
	render(e, t, r, i, a) {
		if (this.resize(r.width, r.height), !this.texture) try {
			this.texture = this.device.createTexture({
				size: [r.width, r.height],
				format: `rgba16float`,
				usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
			}), this.stats.target(r.width * r.height * 8), this.view = this.texture.createView();
		} catch (e) {
			throw this.releaseTarget(), e;
		}
		let o = this.history.build(t, r), s = this.stride / 4;
		o.length * s > this.data.length && (this.buffer?.destroy(), this.data = new Float32Array(Math.max(o.length * s, this.data.length * 2, s)), this.buffer = this.device.createBuffer({
			size: this.data.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		}));
		for (let e = 0; e < o.length; e++) this.data.set(o[e].data, e * s);
		if (o.length) {
			this.device.queue.writeBuffer(this.buffer, 0, this.data, 0, o.length * s), this.stats.upload(o.length * this.stride);
			let e = this.device.createBindGroup({
				layout: this.layout,
				entries: [{
					binding: 0,
					resource: {
						buffer: this.buffer,
						size: 128
					}
				}, {
					binding: 1,
					resource: i
				}]
			});
			this.groupForPass = e;
		}
		let c = require_gpu_timing.beginTimedRenderPass(e, { colorAttachments: [{
			view: this.view,
			clearValue: [
				0,
				0,
				0,
				0
			],
			loadOp: `clear`,
			storeOp: `store`
		}] });
		try {
			c.setPipeline(this.pipeline);
			for (let e = 0; e < o.length; e++) {
				let t = o[e].mesh, n = a(t);
				c.setBindGroup(0, this.groupForPass, [e * this.stride]), c.setVertexBuffer(0, n.vertex), c.setIndexBuffer(n.index, `uint32`), c.drawIndexed(t.renderGeometry.indices.length), this.stats.draw(t.renderGeometry.indices.length, 1);
			}
		} finally {
			c.end(), this.groupForPass = void 0;
		}
		return this.view;
	}
	resize(e, t) {
		(e !== this.width || t !== this.height) && (this.releaseTarget(), this.width = e, this.height = t);
	}
	releaseTarget() {
		this.texture && (this.texture.destroy(), this.stats.target(-this.width * this.height * 8)), this.texture = void 0, this.view = void 0, this.buffer?.destroy(), this.buffer = void 0, this.groupForPass = void 0, this.data = /* @__PURE__ */ new Float32Array(), this.history.invalidate();
	}
	destroy() {
		this.releaseTarget();
	}
};
//#endregion
exports.WebGPUObjectMotion = WebGPUObjectMotion;

//# sourceMappingURL=webgpu-object-motion.cjs.map