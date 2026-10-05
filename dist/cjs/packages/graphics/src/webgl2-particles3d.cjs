const require_errors = require("./errors.cjs");
const require_gpu_particles3d_data = require("./gpu-particles3d-data.cjs");
const require_gpu_particles3d_shaders = require("./gpu-particles3d-shaders.cjs");
//#region dist/packages/graphics/src/webgl2-particles3d.js
var WebGL2Particles3D = class {
	gl;
	stats;
	buffers = /* @__PURE__ */ new Map();
	uniforms = new require_gpu_particles3d_data.ParticleUniforms3D();
	program;
	frame = 0;
	disposed = !1;
	constructor(e, t) {
		this.gl = e, this.stats = t;
		let r = [], o = null;
		try {
			for (let [t, o] of [[e.VERTEX_SHADER, require_gpu_particles3d_shaders.gpuParticles3DVertexGLSL], [e.FRAGMENT_SHADER, require_gpu_particles3d_shaders.gpuParticles3DFragmentGLSL]]) {
				let i = e.createShader(t);
				if (!i) throw new require_errors.GraphicsError(`GPU particle shader allocation failed.`);
				if (r.push(i), e.shaderSource(i, o), e.compileShader(i), !e.getShaderParameter(i, e.COMPILE_STATUS)) throw new require_errors.GraphicsError(`GPU particle GLSL compilation failed: ${e.getShaderInfoLog(i) ?? `unknown error`}`);
			}
			if (o = e.createProgram(), !o) throw new require_errors.GraphicsError(`GPU particle program allocation failed.`);
			for (let t of r) e.attachShader(o, t);
			if (e.linkProgram(o), !e.getProgramParameter(o, e.LINK_STATUS)) throw new require_errors.GraphicsError(`GPU particle GLSL link failed: ${e.getProgramInfoLog(o) ?? `unknown error`}`);
			let t = e.getUniformBlockIndex(o, `Uniforms`);
			if (t === e.INVALID_INDEX) throw new require_errors.GraphicsError(`GPU particle uniform ABI is unavailable.`);
			e.uniformBlockBinding(o, t, 0), this.program = o;
		} catch (t) {
			throw o &&= (e.deleteProgram(o), null), t;
		} finally {
			for (let t of r) o && e.detachShader(o, t), e.deleteShader(t);
		}
	}
	get nativeBufferCount() {
		return this.buffers.size * 2;
	}
	prepare(e) {
		let t = this.gl;
		if (this.disposed || e.destroyed || t.isContextLost()) throw new require_errors.GraphicsError(`Cannot prepare destroyed/lost GPU particles.`);
		let r = t.getParameter(t.VERTEX_ARRAY_BINDING), i = t.getParameter(t.ARRAY_BUFFER_BINDING), a = t.getParameter(t.UNIFORM_BUFFER_BINDING);
		try {
			let n = this.buffers.get(e) ?? this.allocate(e);
			n.prepared = !0, n.version !== e.commandVersion && (t.bindBuffer(t.ARRAY_BUFFER, n.commands), t.bufferSubData(t.ARRAY_BUFFER, 0, e.commandData), this.stats.upload(e.commandData.byteLength), n.version = e.commandVersion);
		} finally {
			t.bindVertexArray(r), t.bindBuffer(t.ARRAY_BUFFER, i), t.bindBuffer(t.UNIFORM_BUFFER, a);
		}
	}
	draw(e, t, r, i = !1) {
		if (this.disposed) throw new require_errors.GraphicsError(`GPU particle backend is destroyed.`);
		let a = this.gl;
		if (a.isContextLost()) return;
		this.frame++;
		let o = {
			program: a.getParameter(a.CURRENT_PROGRAM),
			vao: a.getParameter(a.VERTEX_ARRAY_BINDING),
			array: a.getParameter(a.ARRAY_BUFFER_BINDING),
			uniform: a.getParameter(a.UNIFORM_BUFFER_BINDING),
			uniform0: a.getIndexedParameter(a.UNIFORM_BUFFER_BINDING, 0),
			uniform0Offset: a.getIndexedParameter(a.UNIFORM_BUFFER_START, 0),
			uniform0Size: a.getIndexedParameter(a.UNIFORM_BUFFER_SIZE, 0),
			blend: a.isEnabled(a.BLEND),
			depth: a.isEnabled(a.DEPTH_TEST),
			cull: a.isEnabled(a.CULL_FACE),
			depthMask: a.getParameter(a.DEPTH_WRITEMASK),
			depthFunc: a.getParameter(a.DEPTH_FUNC),
			srcRGB: a.getParameter(a.BLEND_SRC_RGB),
			dstRGB: a.getParameter(a.BLEND_DST_RGB),
			srcAlpha: a.getParameter(a.BLEND_SRC_ALPHA),
			dstAlpha: a.getParameter(a.BLEND_DST_ALPHA),
			eqRGB: a.getParameter(a.BLEND_EQUATION_RGB),
			eqAlpha: a.getParameter(a.BLEND_EQUATION_ALPHA)
		};
		try {
			a.useProgram(this.program), a.enable(a.BLEND), a.enable(a.DEPTH_TEST), a.disable(a.CULL_FACE), a.depthMask(!1), a.depthFunc(a.LEQUAL), a.blendEquationSeparate(a.FUNC_ADD, a.FUNC_ADD), a.blendFuncSeparate(a.ONE, a.ONE_MINUS_SRC_ALPHA, a.ONE, a.ONE_MINUS_SRC_ALPHA);
			for (let n of e) {
				if (n.destroyed) {
					this.release(n);
					continue;
				}
				let e = this.buffers.get(n);
				if (n.activeCount === 0) {
					e?.prepared ? e.seen = this.frame : this.release(n);
					continue;
				}
				if (!n.worldVisible) {
					e && (e.seen = this.frame);
					continue;
				}
				e ??= this.allocate(n), e.seen = this.frame, a.bindVertexArray(e.vao), a.bindBuffer(a.ARRAY_BUFFER, e.commands), e.version !== n.commandVersion && (a.bufferSubData(a.ARRAY_BUFFER, 0, n.commandData), this.stats.upload(n.commandData.byteLength), e.version = n.commandVersion);
				let o = this.uniforms.fill(n, t, r, i);
				a.bindBuffer(a.UNIFORM_BUFFER, e.uniform), a.bufferSubData(a.UNIFORM_BUFFER, 0, o), a.bindBufferBase(a.UNIFORM_BUFFER, 0, e.uniform), this.stats.upload(o.byteLength);
				let s = Math.min(n.activeCount, n.capacity - n.commandHead);
				this.drawRange(n.commandHead, s);
				let c = n.activeCount - s;
				c && this.drawRange(0, c);
			}
			for (let [e, t] of this.buffers) t.seen !== this.frame && !t.prepared && this.release(e);
		} finally {
			a.useProgram(o.program), a.bindVertexArray(o.vao), a.bindBuffer(a.ARRAY_BUFFER, o.array), o.uniform0 && o.uniform0Size > 0 ? a.bindBufferRange(a.UNIFORM_BUFFER, 0, o.uniform0, o.uniform0Offset, o.uniform0Size) : a.bindBufferBase(a.UNIFORM_BUFFER, 0, o.uniform0), a.bindBuffer(a.UNIFORM_BUFFER, o.uniform), a.depthMask(o.depthMask), a.depthFunc(o.depthFunc), a.blendEquationSeparate(o.eqRGB, o.eqAlpha), a.blendFuncSeparate(o.srcRGB, o.dstRGB, o.srcAlpha, o.dstAlpha), o.blend ? a.enable(a.BLEND) : a.disable(a.BLEND), o.depth ? a.enable(a.DEPTH_TEST) : a.disable(a.DEPTH_TEST), o.cull ? a.enable(a.CULL_FACE) : a.disable(a.CULL_FACE);
		}
	}
	synchronize(e) {
		this.frame++;
		for (let t of e) {
			let e = this.buffers.get(t);
			e && !t.destroyed && (e.seen = this.frame);
		}
		for (let [e, t] of this.buffers) t.seen !== this.frame && this.release(e);
	}
	clear() {
		for (let e of this.buffers.keys()) this.release(e);
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.clear(), this.gl.deleteProgram(this.program));
	}
	drawRange(t, n) {
		let r = this.gl, i = 80, a = t * i;
		r.vertexAttribPointer(0, 1, r.FLOAT, !1, i, a), r.vertexAttribIPointer(1, 1, r.UNSIGNED_INT, i, a + 4);
		for (let e = 0; e < 4; e++) r.vertexAttribPointer(e + 2, 4, r.FLOAT, !1, i, a + 16 + e * 16);
		r.drawArraysInstanced(r.TRIANGLES, 0, 6, n), this.stats.draw(6, n);
	}
	allocate(e) {
		let r = this.gl, i = r.createBuffer(), a = r.createBuffer(), o = r.createVertexArray();
		try {
			if (!i || !a || !o) throw new require_errors.GraphicsError(`GPU particle native buffer allocation failed.`);
			r.bindVertexArray(o), r.bindBuffer(r.ARRAY_BUFFER, i), r.bufferData(r.ARRAY_BUFFER, e.commandData.byteLength, r.DYNAMIC_DRAW);
			for (let e = 0; e < 6; e++) r.enableVertexAttribArray(e), r.vertexAttribDivisor(e, 1);
			r.bindBuffer(r.UNIFORM_BUFFER, a), r.bufferData(r.UNIFORM_BUFFER, 272, r.DYNAMIC_DRAW);
			let s = e.ownNative(() => this.release(e)), c = {
				commands: i,
				uniform: a,
				vao: o,
				version: -1,
				seen: this.frame,
				prepared: !1,
				unown: s
			};
			return this.buffers.set(e, c), c;
		} catch (e) {
			throw r.deleteBuffer(i), r.deleteBuffer(a), r.deleteVertexArray(o), e;
		}
	}
	release(e) {
		let t = this.buffers.get(e);
		t && (this.buffers.delete(e), t.unown(), this.gl.deleteBuffer(t.commands), this.gl.deleteBuffer(t.uniform), this.gl.deleteVertexArray(t.vao));
	}
};
//#endregion
exports.WebGL2Particles3D = WebGL2Particles3D;

//# sourceMappingURL=webgl2-particles3d.cjs.map