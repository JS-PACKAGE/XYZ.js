const require_errors = require("./errors.cjs");
const require_render_graph_shaders = require("./render-graph-shaders.cjs");
//#region dist/packages/graphics/src/webgl2-render-graph.js
var WebGL2RenderGraph = class {
	gl;
	owners = /* @__PURE__ */ new Map();
	scene;
	blit;
	disposed = !1;
	vao;
	sampler;
	constructor(e) {
		this.gl = e;
		let t = e.createVertexArray(), r = e.createSampler();
		if (!t || !r) throw t && e.deleteVertexArray(t), r && e.deleteSampler(r), new require_errors.GraphicsError(`Cannot allocate graph fullscreen state.`);
		this.vao = t, this.sampler = r, e.samplerParameteri(r, e.TEXTURE_MIN_FILTER, e.LINEAR), e.samplerParameteri(r, e.TEXTURE_MAG_FILTER, e.LINEAR), e.samplerParameteri(r, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.samplerParameteri(r, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE);
	}
	live() {
		if (this.disposed) throw new require_errors.GraphicsError(`Render graph owner destroyed.`);
		if (this.gl.isContextLost()) throw new require_errors.WebGL2ContextLostError(`Render graph context lost.`);
	}
	async prepare(e, r = {}) {
		if (this.live(), e.validate(), r.signal?.throwIfAborted(), this.owners.has(e)) return;
		let i = this.gl;
		if (e.targets.some((e) => e.format === `rgba16float`) && !i.getExtension(`EXT_color_buffer_float`)) throw new require_errors.GraphicsError(`rgba16float graph targets require EXT_color_buffer_float.`);
		if (e.passes.some((e) => e.inputs.length > i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS))) throw RangeError(`Graph inputs exceed fragment texture units.`);
		let a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), release = () => {
			e.removeEventListener(`destroy`, release);
			for (let t of e.passes) t.effect.removeEventListener(`destroy`, release);
			for (let e of a.values()) i.deleteProgram(e.program);
			a.clear();
			for (let e of o.values()) this.releaseTarget(e);
			o.clear(), this.owners.delete(e);
		};
		try {
			for (let t of e.schedule) a.set(t, this.compile(t.effect.glsl, t.inputs.length));
			this.blit ||= this.compile(require_render_graph_shaders.graphIdentityGLSL, 1), r.signal?.throwIfAborted(), this.live(), e.validate(), this.owners.set(e, {
				passes: a,
				targets: o,
				release,
				width: 0,
				height: 0,
				maxInputs: Math.max(...e.passes.map((e) => e.inputs.length))
			}), e.addEventListener(`destroy`, release, { once: !0 });
			for (let t of e.passes) t.effect.addEventListener(`destroy`, release, { once: !0 });
		} catch (e) {
			throw release(), e;
		}
	}
	compile(t, r) {
		let i = this.gl, a = require_render_graph_shaders.graphGLSL(t, r), o = [], s = null;
		try {
			for (let [e, t] of [[i.VERTEX_SHADER, a.vertex], [i.FRAGMENT_SHADER, a.fragment]]) {
				let r = i.createShader(e);
				if (!r) throw new require_errors.GraphicsError(`Cannot allocate graph shader.`);
				if (o.push(r), i.shaderSource(r, t), i.compileShader(r), !i.getShaderParameter(r, i.COMPILE_STATUS)) throw new require_errors.GraphicsError(`Render graph compilation failed: ${i.getShaderInfoLog(r)}`);
			}
			if (s = i.createProgram(), !s) throw new require_errors.GraphicsError(`Cannot allocate graph program.`);
			for (let e of o) i.attachShader(s, e);
			if (i.linkProgram(s), !i.getProgramParameter(s, i.LINK_STATUS)) throw new require_errors.GraphicsError(`Render graph link failed: ${i.getProgramInfoLog(s)}`);
			return {
				program: s,
				images: Array.from({ length: r }, (e, t) => i.getUniformLocation(s, t === 0 ? `image` : `image${t}`)),
				uniforms: i.getUniformLocation(s, `uniforms[0]`),
				viewport: i.getUniformLocation(s, `viewportSize`),
				inputs: []
			};
		} catch (e) {
			throw s && i.deleteProgram(s), e;
		} finally {
			for (let e of o) i.deleteShader(e);
		}
	}
	target(e, t, r, i = !1) {
		let a = this.gl, o = a.createTexture(), s = a.createFramebuffer();
		if (!o || !s) throw o && a.deleteTexture(o), s && a.deleteFramebuffer(s), new require_errors.GraphicsError(`Cannot allocate graph target.`);
		let c = a.getParameter(a.TEXTURE_BINDING_2D), l = a.getParameter(a.DRAW_FRAMEBUFFER_BINDING), u = a.getParameter(a.RENDERBUFFER_BINDING), d;
		try {
			if (a.bindTexture(a.TEXTURE_2D, o), a.texStorage2D(a.TEXTURE_2D, 1, r ? a.RGBA16F : a.RGBA8, e, t), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MIN_FILTER, a.LINEAR), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MAG_FILTER, a.LINEAR), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_S, a.CLAMP_TO_EDGE), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_T, a.CLAMP_TO_EDGE), a.bindFramebuffer(a.DRAW_FRAMEBUFFER, s), a.framebufferTexture2D(a.DRAW_FRAMEBUFFER, a.COLOR_ATTACHMENT0, a.TEXTURE_2D, o, 0), i) {
				let r = a.createRenderbuffer();
				if (!r) throw new require_errors.GraphicsError(`Cannot allocate graph scene depth.`);
				d = r, a.bindRenderbuffer(a.RENDERBUFFER, d), a.renderbufferStorage(a.RENDERBUFFER, a.DEPTH_COMPONENT24, e, t), a.framebufferRenderbuffer(a.DRAW_FRAMEBUFFER, a.DEPTH_ATTACHMENT, a.RENDERBUFFER, d);
			}
			if (a.checkFramebufferStatus(a.DRAW_FRAMEBUFFER) !== a.FRAMEBUFFER_COMPLETE) throw new require_errors.GraphicsError(`Render graph framebuffer is incomplete.`);
			return {
				texture: o,
				framebuffer: s,
				depth: d,
				width: e,
				height: t
			};
		} catch (e) {
			throw a.deleteTexture(o), a.deleteFramebuffer(s), d && a.deleteRenderbuffer(d), e;
		} finally {
			a.bindTexture(a.TEXTURE_2D, c), a.bindFramebuffer(a.DRAW_FRAMEBUFFER, l), a.bindRenderbuffer(a.RENDERBUFFER, u);
		}
	}
	releaseTarget(e) {
		this.gl.deleteTexture(e.texture), this.gl.deleteFramebuffer(e.framebuffer), e.depth && this.gl.deleteRenderbuffer(e.depth);
	}
	sceneTarget(e, t, r) {
		this.live(), e.validate();
		let i = this.owners.get(e);
		if (!i || !this.blit) throw new require_errors.GraphicsError(`Render graph must be prepared before rendering.`);
		if (i.width === t && i.height === r && this.scene?.width === t && this.scene.height === r) return this.scene;
		let a = e.resolutions(t, r, this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE)), o = /* @__PURE__ */ new Map(), s;
		try {
			(!this.scene || this.scene.width !== t || this.scene.height !== r) && (s = this.target(t, r, !1, !0));
			for (let e of a) {
				let t = i.targets.get(e.target.name);
				(!t || t.width !== e.width || t.height !== e.height) && o.set(e.target.name, this.target(e.width, e.height, e.target.format === `rgba16float`));
			}
		} catch (e) {
			s && this.releaseTarget(s);
			for (let e of o.values()) this.releaseTarget(e);
			throw e;
		}
		s && (this.scene && this.releaseTarget(this.scene), this.scene = s);
		for (let [e, t] of o) {
			let n = i.targets.get(e);
			n && this.releaseTarget(n), i.targets.set(e, t);
		}
		return i.width = t, i.height = r, this.scene;
	}
	encode(e, t) {
		this.live(), e.validate();
		let r = this.owners.get(e);
		if (!r || !this.scene || !this.blit || r.targets.size !== e.targets.length) throw new require_errors.GraphicsError(`Graph resources are not prepared/resolved.`);
		let i = this.gl, a = {
			framebuffer: i.getParameter(i.DRAW_FRAMEBUFFER_BINDING),
			program: i.getParameter(i.CURRENT_PROGRAM),
			vao: i.getParameter(i.VERTEX_ARRAY_BINDING),
			viewport: i.getParameter(i.VIEWPORT),
			active: i.getParameter(i.ACTIVE_TEXTURE),
			blend: i.isEnabled(i.BLEND),
			depth: i.isEnabled(i.DEPTH_TEST),
			cull: i.isEnabled(i.CULL_FACE),
			scissor: i.isEnabled(i.SCISSOR_TEST),
			colorMask: i.getParameter(i.COLOR_WRITEMASK)
		}, o = r.maxInputs, s = [], c = [];
		for (let e = 0; e < o; e++) i.activeTexture(i.TEXTURE0 + e), s.push(i.getParameter(i.TEXTURE_BINDING_2D)), c.push(i.getParameter(i.SAMPLER_BINDING));
		try {
			i.disable(i.BLEND), i.disable(i.DEPTH_TEST), i.disable(i.CULL_FACE), i.disable(i.SCISSOR_TEST), i.colorMask(!0, !0, !0, !0), i.bindVertexArray(this.vao);
			for (let t of e.schedule) {
				let e = r.targets.get(t.output), n = r.passes.get(t);
				for (let e = 0; e < t.inputs.length; e++) n.inputs[e] = t.inputs[e] === `$scene` ? this.scene : r.targets.get(t.inputs[e]);
				this.draw(n, e.framebuffer, e.width, e.height, t.effect.uniforms);
			}
			this.blit.inputs[0] = r.targets.get(e.output), this.draw(this.blit, t, this.scene.width, this.scene.height);
		} finally {
			for (let e = 0; e < o; e++) i.activeTexture(i.TEXTURE0 + e), i.bindTexture(i.TEXTURE_2D, s[e]), i.bindSampler(e, c[e]);
			i.activeTexture(a.active), i.bindFramebuffer(i.DRAW_FRAMEBUFFER, a.framebuffer), i.useProgram(a.program), i.bindVertexArray(a.vao), i.viewport(...a.viewport);
			for (let [e, t] of [
				[i.BLEND, a.blend],
				[i.DEPTH_TEST, a.depth],
				[i.CULL_FACE, a.cull],
				[i.SCISSOR_TEST, a.scissor]
			]) t ? i.enable(e) : i.disable(e);
			i.colorMask(...a.colorMask);
		}
	}
	draw(e, t, n, r, i) {
		let a = this.gl;
		a.bindFramebuffer(a.DRAW_FRAMEBUFFER, t), a.viewport(0, 0, n, r), a.useProgram(e.program);
		for (let t = 0; t < e.inputs.length; t++) a.activeTexture(a.TEXTURE0 + t), a.bindTexture(a.TEXTURE_2D, e.inputs[t].texture), a.bindSampler(t, this.sampler), a.uniform1i(e.images[t], t);
		i && a.uniform4fv(e.uniforms, i), a.uniform2f(e.viewport, n, r), a.drawArrays(a.TRIANGLES, 0, 3);
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			for (let e of this.owners.values()) e.release();
			this.scene &&= (this.releaseTarget(this.scene), void 0), this.blit &&= (this.gl.deleteProgram(this.blit.program), void 0), this.gl.deleteVertexArray(this.vao), this.gl.deleteSampler(this.sampler);
		}
	}
};
//#endregion
exports.WebGL2RenderGraph = WebGL2RenderGraph;

//# sourceMappingURL=webgl2-render-graph.cjs.map