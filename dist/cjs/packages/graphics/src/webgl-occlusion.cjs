const require_errors = require("./errors.cjs");
const require_visibility = require("../../../src/data/visibility.cjs");
const require_occlusion_proxy = require("./occlusion-proxy.cjs");
//#region dist/packages/graphics/src/webgl-occlusion.js
var WebGLOcclusionBackend = class {
	gl;
	slots = [];
	results = /* @__PURE__ */ new Map();
	activeMeshes = /* @__PURE__ */ new Set();
	program;
	vao;
	vertex;
	index;
	viewProjection;
	minimum;
	maximum;
	matrixData = /* @__PURE__ */ new Float32Array(16);
	generation = 0;
	destroyed = !1;
	constructor(i) {
		this.gl = i;
		let a = i.createProgram(), o = i.createVertexArray(), s = i.createBuffer(), c = i.createBuffer();
		if (!a || !o || !s || !c) throw a && i.deleteProgram(a), o && i.deleteVertexArray(o), s && i.deleteBuffer(s), c && i.deleteBuffer(c), new require_errors.GraphicsError(`Unable to allocate WebGL occlusion resources.`);
		this.program = a, this.vao = o, this.vertex = s, this.index = c;
		let l = [];
		try {
			for (let [e, n] of [[i.VERTEX_SHADER, `#version 300 es
layout(location=0) in vec3 position;
uniform mat4 viewProjection;
uniform vec3 minimum;
uniform vec3 maximum;
void main() {
  vec4 clip = viewProjection * vec4(mix(minimum, maximum, position), 1.0);
  gl_Position = vec4(clip.xy, clip.z * 2.0 - clip.w, clip.w);
}`], [i.FRAGMENT_SHADER, `#version 300 es
precision highp float;
out vec4 color;
void main() { color = vec4(0.0); }`]]) {
				let r = i.createShader(e);
				if (!r) throw new require_errors.GraphicsError(`Unable to allocate WebGL occlusion shader.`);
				if (l.push(r), i.shaderSource(r, n), i.compileShader(r), !i.getShaderParameter(r, i.COMPILE_STATUS)) throw new require_errors.GraphicsError(`WebGL occlusion shader failed: ${i.getShaderInfoLog(r) ?? `unknown compiler error`}`);
				i.attachShader(a, r);
			}
			if (i.linkProgram(a), !i.getProgramParameter(a, i.LINK_STATUS)) throw new require_errors.GraphicsError(`WebGL occlusion program failed: ${i.getProgramInfoLog(a) ?? `unknown linker error`}`);
			let u = i.getUniformLocation(a, `viewProjection`), d = i.getUniformLocation(a, `minimum`), f = i.getUniformLocation(a, `maximum`);
			if (!u || !d || !f) throw new require_errors.GraphicsError(`WebGL occlusion uniforms are unavailable.`);
			this.viewProjection = u, this.minimum = d, this.maximum = f;
			let p = i.getParameter(i.VERTEX_ARRAY_BINDING), m = i.getParameter(i.ARRAY_BUFFER_BINDING);
			i.bindVertexArray(o), i.bindBuffer(i.ARRAY_BUFFER, s), i.bufferData(i.ARRAY_BUFFER, require_occlusion_proxy.occlusionProxyVertices, i.STATIC_DRAW), i.enableVertexAttribArray(0), i.vertexAttribPointer(0, 3, i.FLOAT, !1, 12, 0), i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, c), i.bufferData(i.ELEMENT_ARRAY_BUFFER, require_occlusion_proxy.occlusionProxyIndices, i.STATIC_DRAW), i.bindVertexArray(p), i.bindBuffer(i.ARRAY_BUFFER, m);
			for (let n = 0; n < require_visibility.visibilityLimits.occlusionQueries * require_visibility.visibilityLimits.occlusionFramesInFlight; n++) {
				let e = i.createQuery();
				if (!e) throw new require_errors.GraphicsError(`Unable to allocate WebGL occlusion query.`);
				this.slots.push({
					query: e,
					mesh: void 0,
					epoch: 0,
					generation: 0
				});
			}
		} catch (e) {
			throw this.destroy(), e;
		} finally {
			for (let e of l) i.deleteShader(e);
		}
	}
	visible(e, t) {
		if (this.destroyed || this.gl.isContextLost()) return !0;
		let n = this.results.get(e);
		return !n || n.epoch !== t || n.visible;
	}
	beginFrame() {
		!this.destroyed && !this.gl.isContextLost() && this.poll();
	}
	draw(t, r) {
		let i = this.gl;
		if (this.destroyed || i.isContextLost()) return;
		this.poll(), this.activeMeshes.clear();
		for (let e of t) this.activeMeshes.add(e.mesh);
		for (let e of this.results.keys()) (!this.activeMeshes.has(e) || e.destroyed) && this.results.delete(e);
		if (!t.length || i.getQuery(i.ANY_SAMPLES_PASSED_CONSERVATIVE, i.CURRENT_QUERY)) return;
		let a = i.getParameter(i.CURRENT_PROGRAM), o = i.getParameter(i.VERTEX_ARRAY_BINDING), s = i.getParameter(i.COLOR_WRITEMASK), c = i.getParameter(i.DEPTH_WRITEMASK), l = i.getParameter(i.DEPTH_FUNC), u = i.isEnabled(i.DEPTH_TEST), d = i.isEnabled(i.CULL_FACE), f = i.isEnabled(i.RASTERIZER_DISCARD), p = i.isEnabled(i.SCISSOR_TEST), m = i.isEnabled(i.STENCIL_TEST), h = i.isEnabled(i.POLYGON_OFFSET_FILL);
		i.useProgram(this.program), i.bindVertexArray(this.vao), i.colorMask(!1, !1, !1, !1), i.depthMask(!1), i.depthFunc(i.LEQUAL), i.enable(i.DEPTH_TEST), i.disable(i.CULL_FACE), i.disable(i.RASTERIZER_DISCARD), i.disable(i.SCISSOR_TEST), i.disable(i.STENCIL_TEST), i.disable(i.POLYGON_OFFSET_FILL), this.matrixData.set(r.elements), i.uniformMatrix4fv(this.viewProjection, !1, this.matrixData);
		let g = 0;
		try {
			let r = Math.min(t.length, require_visibility.visibilityLimits.occlusionQueries);
			for (let e = 0; e < r; e++) {
				for (; g < this.slots.length && this.slots[g].mesh;) g++;
				let r = this.slots[g++];
				if (!r) break;
				let a = t[e];
				r.mesh = a.mesh, r.epoch = a.epoch, r.generation = this.generation, i.uniform3f(this.minimum, a.minX, a.minY, a.minZ), i.uniform3f(this.maximum, a.maxX, a.maxY, a.maxZ), i.beginQuery(i.ANY_SAMPLES_PASSED_CONSERVATIVE, r.query);
				try {
					i.drawElements(i.TRIANGLES, require_occlusion_proxy.occlusionProxyIndices.length, i.UNSIGNED_SHORT, 0);
				} finally {
					i.endQuery(i.ANY_SAMPLES_PASSED_CONSERVATIVE);
				}
			}
		} finally {
			i.useProgram(a), i.bindVertexArray(o), i.colorMask(...s), i.depthMask(c), i.depthFunc(l), u ? i.enable(i.DEPTH_TEST) : i.disable(i.DEPTH_TEST), d ? i.enable(i.CULL_FACE) : i.disable(i.CULL_FACE), f ? i.enable(i.RASTERIZER_DISCARD) : i.disable(i.RASTERIZER_DISCARD), p ? i.enable(i.SCISSOR_TEST) : i.disable(i.SCISSOR_TEST), m ? i.enable(i.STENCIL_TEST) : i.disable(i.STENCIL_TEST), h ? i.enable(i.POLYGON_OFFSET_FILL) : i.disable(i.POLYGON_OFFSET_FILL);
		}
	}
	poll() {
		let e = this.gl;
		for (let t of this.slots) {
			let n = t.mesh;
			if (!n || !e.getQueryParameter(t.query, e.QUERY_RESULT_AVAILABLE)) continue;
			let r = !!e.getQueryParameter(t.query, e.QUERY_RESULT);
			if (!n.destroyed && t.generation === this.generation) {
				let e = this.results.get(n);
				e ? e.epoch <= t.epoch && (e.epoch = t.epoch, e.visible = r) : this.results.set(n, {
					epoch: t.epoch,
					visible: r
				});
			}
			t.mesh = void 0;
		}
	}
	clear() {
		++this.generation, this.results.clear(), this.activeMeshes.clear();
	}
	destroy() {
		if (!this.destroyed) {
			this.destroyed = !0, this.clear();
			for (let e of this.slots) this.gl.deleteQuery(e.query), e.mesh = void 0;
			this.slots.length = 0, this.gl.deleteProgram(this.program), this.gl.deleteVertexArray(this.vao), this.gl.deleteBuffer(this.vertex), this.gl.deleteBuffer(this.index);
		}
	}
};
//#endregion
exports.WebGLOcclusionBackend = WebGLOcclusionBackend;

//# sourceMappingURL=webgl-occlusion.cjs.map