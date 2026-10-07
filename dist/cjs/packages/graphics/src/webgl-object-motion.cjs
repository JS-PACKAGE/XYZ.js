const require_errors = require("./errors.cjs");
const require_object_motion = require("./object-motion.cjs");
//#region dist/packages/graphics/src/webgl-object-motion.js
var WebGLObjectMotion = class {
	gl;
	stats;
	history = new require_object_motion.ObjectMotionHistory();
	program;
	vao;
	current;
	previous;
	depth;
	texture;
	framebuffer;
	width = 0;
	height = 0;
	constructor(t, i) {
		this.gl = t, this.stats = i;
		let a = t.createShader(t.VERTEX_SHADER), o = t.createShader(t.FRAGMENT_SHADER), s = t.createProgram(), c = t.createVertexArray();
		if (!a || !o || !s || !c) throw t.deleteShader(a), t.deleteShader(o), t.deleteProgram(s), t.deleteVertexArray(c), new require_errors.GraphicsError(`Unable to allocate object motion GL resources.`);
		try {
			if (t.shaderSource(a, require_object_motion.objectMotionGLVertex), t.shaderSource(o, require_object_motion.objectMotionGLFragment), t.compileShader(a), t.compileShader(o), !t.getShaderParameter(a, t.COMPILE_STATUS) || !t.getShaderParameter(o, t.COMPILE_STATUS)) throw new require_errors.GraphicsError(`Object motion shader compilation failed: ${t.getShaderInfoLog(a)} ${t.getShaderInfoLog(o)}`);
			if (t.attachShader(s, a), t.attachShader(s, o), t.linkProgram(s), !t.getProgramParameter(s, t.LINK_STATUS)) throw new require_errors.GraphicsError(`Object motion program link failed: ${t.getProgramInfoLog(s)}`);
			this.program = s, this.vao = c, this.current = t.getUniformLocation(s, `currentClip`), this.previous = t.getUniformLocation(s, `previousClip`), this.depth = t.getUniformLocation(s, `opaqueDepth`);
		} catch (e) {
			throw t.deleteProgram(s), t.deleteVertexArray(c), e;
		} finally {
			t.deleteShader(a), t.deleteShader(o);
		}
	}
	render(t, n, r, i) {
		let a = this.gl;
		if (this.resize(n.width, n.height), !this.texture) {
			let t = a.createTexture(), r = a.createFramebuffer();
			if (!t || !r) throw a.deleteTexture(t), a.deleteFramebuffer(r), new require_errors.GraphicsError(`Unable to allocate object motion GL target.`);
			try {
				if (a.activeTexture(a.TEXTURE0), a.bindTexture(a.TEXTURE_2D, t), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MIN_FILTER, a.NEAREST), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MAG_FILTER, a.NEAREST), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_S, a.CLAMP_TO_EDGE), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_WRAP_T, a.CLAMP_TO_EDGE), a.texImage2D(a.TEXTURE_2D, 0, a.RGBA16F, n.width, n.height, 0, a.RGBA, a.HALF_FLOAT, null), a.bindFramebuffer(a.FRAMEBUFFER, r), a.framebufferTexture2D(a.FRAMEBUFFER, a.COLOR_ATTACHMENT0, a.TEXTURE_2D, t, 0), a.checkFramebufferStatus(a.FRAMEBUFFER) !== a.FRAMEBUFFER_COMPLETE) throw new require_errors.GraphicsError(`Object motion GL framebuffer is incomplete; float color support is required.`);
				this.texture = t, this.framebuffer = r, this.stats.target(n.width * n.height * 8);
			} catch (e) {
				throw a.deleteTexture(t), a.deleteFramebuffer(r), e;
			}
		}
		let o = this.history.build(t, n);
		a.bindFramebuffer(a.FRAMEBUFFER, this.framebuffer), a.viewport(0, 0, n.width, n.height), a.disable(a.BLEND), a.disable(a.DEPTH_TEST), a.disable(a.CULL_FACE), a.disable(a.SCISSOR_TEST), a.colorMask(!0, !0, !0, !0), a.clearColor(0, 0, 0, 0), a.clear(a.COLOR_BUFFER_BIT), a.useProgram(this.program), a.bindVertexArray(this.vao), a.activeTexture(a.TEXTURE0), a.bindSampler(0, null), a.bindTexture(a.TEXTURE_2D, r), a.uniform1i(this.depth, 0), a.enableVertexAttribArray(0), a.vertexAttribDivisor(0, 0);
		for (let e of o) {
			let t = i(e.mesh);
			a.bindBuffer(a.ARRAY_BUFFER, t.vertex), a.vertexAttribPointer(0, 3, a.FLOAT, !1, 32, 0), a.bindBuffer(a.ELEMENT_ARRAY_BUFFER, t.index), a.uniformMatrix4fv(this.current, !1, e.data, 0, 16), a.uniformMatrix4fv(this.previous, !1, e.data, 16, 16), a.drawElements(a.TRIANGLES, e.mesh.renderGeometry.indices.length, a.UNSIGNED_INT, 0), this.stats.draw(e.mesh.renderGeometry.indices.length, 1);
		}
		return a.bindVertexArray(null), this.texture;
	}
	resize(e, t) {
		(e !== this.width || t !== this.height) && (this.releaseTarget(), this.width = e, this.height = t);
	}
	releaseTarget() {
		this.texture && (this.gl.deleteTexture(this.texture), this.stats.target(-this.width * this.height * 8)), this.framebuffer && this.gl.deleteFramebuffer(this.framebuffer), this.texture = void 0, this.framebuffer = void 0, this.history.invalidate();
	}
	destroy() {
		this.releaseTarget(), this.gl.deleteProgram(this.program), this.gl.deleteVertexArray(this.vao);
	}
};
//#endregion
exports.WebGLObjectMotion = WebGLObjectMotion;

//# sourceMappingURL=webgl-object-motion.cjs.map