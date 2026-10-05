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
const require_lighting2d$1 = require("./lighting2d.cjs");
const require_webgl2_render2d_shaders = require("./webgl2-render2d-shaders.cjs");
//#region dist/packages/graphics/src/webgl2-render2d.js
var WebGLRender2D = class {
	gl;
	hooks;
	quad = require_sprite_instance.createTextureQuad2D();
	sourceQuad = require_sprite_instance.createTextureQuad2D();
	appearance = /* @__PURE__ */ new Float32Array(4);
	matrix = new require_index.Matrix3();
	mapping = new require_index.Matrix3();
	tileMatrix = new require_index.Matrix3();
	inverse = new require_index.Matrix3();
	programs = /* @__PURE__ */ new Map();
	layers = /* @__PURE__ */ new Map();
	targets = /* @__PURE__ */ new Map();
	meshes = /* @__PURE__ */ new Map();
	particles = /* @__PURE__ */ new Map();
	captureCommands = new require_render2d_contract.RenderCommandBuffer2D();
	emptyVAO;
	quadProgram;
	lightingProgram;
	lightingData = /* @__PURE__ */ new Float32Array(108);
	uploadedLighting = (/* @__PURE__ */ new Float32Array(108)).fill(NaN);
	litMaterials = /* @__PURE__ */ new Map();
	meshProgram;
	particleProgram;
	passProgram;
	spriteProgram;
	spriteVAO;
	spriteBuffer;
	spriteData = /* @__PURE__ */ new Float32Array(1792);
	spriteCapacity = 0;
	blendProgram;
	matrixRows = /* @__PURE__ */ new Float32Array(20);
	dependencies = [];
	samplers = /* @__PURE__ */ new Map();
	resolution = 1;
	viewportWidth = 1;
	viewportHeight = 1;
	disposed = !1;
	constructor(e, t) {
		this.gl = e, this.hooks = t;
		let n = e.createVertexArray();
		if (!n) throw new require_errors.GraphicsError(`WebGL2 could not allocate the 2D vertex array.`);
		this.emptyVAO = n, this.quadProgram = this.register(t.createProgram(require_webgl2_render2d_shaders.quadVertex2D, require_webgl2_render2d_shaders.quadFragment2D(), `2D quad`)), this.lightingProgram = this.register(t.createProgram(require_webgl2_render2d_shaders.quadVertex2D, require_webgl2_render2d_shaders.quadFragment2D(require_lighting2d$1.lightingGLSL), `2D normal-map lighting`)), this.meshProgram = this.register(t.createProgram(require_webgl2_render2d_shaders.meshVertex2D, require_webgl2_render2d_shaders.meshFragment2D, `indexed 2D mesh`)), this.particleProgram = this.register(t.createProgram(require_webgl2_render2d_shaders.particleVertex2D, require_webgl2_render2d_shaders.quadFragment2D(), `versioned particle layer`)), this.spriteProgram = this.register(t.createProgram(require_webgl2_render2d_shaders.spriteInstanceVertex2D, require_webgl2_render2d_shaders.quadFragment2D(), `2D sprite batch`));
		let r = e.createVertexArray(), i = e.createBuffer();
		if (!r || !i) throw r && e.deleteVertexArray(r), i && e.deleteBuffer(i), new require_errors.GraphicsError(`WebGL2 sprite batch allocation failed.`);
		this.spriteVAO = r, this.spriteBuffer = i, this.bindInstances(r, i, 0), this.passProgram = this.register(t.createProgram(require_webgl2_render2d_shaders.passVertex2D, require_webgl2_render2d_shaders.passFragment2D, `local filter and mask`)), this.blendProgram = this.register(t.createProgram(require_webgl2_render2d_shaders.quadVertex2D, require_webgl2_render2d_shaders.blendFragment2D, `premultiplied multiply`));
	}
	register(e) {
		let t = this.programs.get(e);
		if (t) return t;
		let n = {
			program: e,
			uniforms: /* @__PURE__ */ new Map()
		};
		return this.programs.set(e, n), n;
	}
	litProgram(e) {
		let t = this.litMaterials.get(e);
		if (t) return t;
		let n = this.register(this.hooks.createProgram(require_webgl2_render2d_shaders.quadVertex2D, require_webgl2_render2d_shaders.quadFragment2D(require_lighting2d$1.composeLitMaterial2D(e.glsl, `glsl`)), `2D lit material`)), dispose = () => {
			this.disposed || this.litMaterials.get(e) !== n || (this.litMaterials.delete(e), this.programs.delete(n.program), this.gl.deleteProgram(n.program), e.removeEventListener(`destroy`, dispose));
		};
		return e.addEventListener(`destroy`, dispose), this.litMaterials.set(e, n), n;
	}
	uniform(e, t) {
		return e.uniforms.has(t) || e.uniforms.set(t, this.gl.getUniformLocation(e.program, t)), e.uniforms.get(t);
	}
	preflight(e, t, n, r, i) {
		this.hooks.assertAlive(), this.viewportWidth = n, this.viewportHeight = r, this.resolution = i, this.dependencies.length = 0;
		for (let e of t.effects2D) this.hooks.processor(e);
		this.validateCommands(e, 0);
	}
	validateSource(e, t) {
		if (e.destroyed) throw new require_errors.GraphicsError(`Cannot sample a destroyed 2D texture.`);
		t?.validate(), e.kind === `render` && (require_render_texture2d.assertRenderTextureOwner2D(e, this.hooks.owner), this.dependencies.includes(e) || this.dependencies.push(e));
	}
	validateCommands(e, t) {
		if (t > require_rendering2d.rendering2dLimits.layerDepth) throw RangeError(`2D isolation exceeds its depth budget.`);
		for (let r of e.items) {
			let e = r.object;
			if (r.kind === `layer`) {
				let e = r.object;
				this.inverse.copy(e.updateWorldMatrix()).invert();
				let i = this.layers.get(e), a = i && e.cacheAsTexture && i.version === e.cacheVersion ? i.bounds : e.getLocalBounds();
				a.width > 0 && a.height > 0 && this.validateBounds(a, this.resolution), e.mask?.texture && this.validateSource(e.mask.texture, e.mask.view);
				for (let t of e.filters) {
					if (t.destroyed) throw new require_errors.GraphicsError(`Cannot render a destroyed Filter2D.`);
					t instanceof require_filters2d.DisplacementFilter2D && this.validateSource(t.texture, t.view);
				}
				this.validateCommands(r.commands, t + 1);
			} else if (r.kind === `particles`) for (let e = 0; e < r.object.activeCount; e++) {
				let t = r.object.getSlot(r.object.activeSlotAt(e));
				this.validateSource(t.texture, t.view), require_sprite_instance.getTextureQuad2D(t.texture, t.view, t.source, this.sourceQuad);
			}
			else this.validateSource(r.object.texture, r.object.view), r.kind === `sprite` ? (require_sprite_instance.getSpriteQuad2D(r.object, this.quad), require_lighting2d.validateSpriteLighting2D(r.object), r.object.material && this.hooks.material(r.object.material)) : (r.object.geometry.validate(), require_sprite_instance.getTextureQuad2D(r.object.texture, r.object.view, void 0, this.quad));
			if (e.destroyed) throw new require_errors.GraphicsError(`Cannot render a destroyed 2D object.`);
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
		}, this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE));
	}
	draw(e, t, n, r, i) {
		this.drawCommands(e, {
			scene: t,
			target: n,
			bounds: {
				x: 0,
				y: 0,
				width: r,
				height: i
			}
		});
		for (let [e, t] of this.layers) if (e.destroyed || !e.cacheAsTexture) {
			for (let e of t.targets) this.hooks.deleteTarget(e);
			this.layers.delete(e);
		}
		for (let [e, t] of this.particles) e.destroyed && t.allocation.destroy();
	}
	bindTarget(e) {
		let t = this.gl;
		t.bindFramebuffer(t.FRAMEBUFFER, e.target.framebuffer), t.viewport(0, 0, e.target.width, e.target.height), t.disable(t.DEPTH_TEST), t.disable(t.CULL_FACE), t.disable(t.SCISSOR_TEST), t.enable(t.BLEND), t.blendEquation(t.FUNC_ADD), t.blendFuncSeparate(t.ONE, t.ONE_MINUS_SRC_ALPHA, t.ONE, t.ONE_MINUS_SRC_ALPHA);
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
	useQuad(e, t, n, r, i, a) {
		let o = this.gl;
		o.useProgram(e.program), this.distanceField(e, `kind` in n ? n : void 0), o.bindVertexArray(this.emptyVAO), o.uniformMatrix3fv(this.uniform(e, `transform`), !1, i.elements), o.uniform2f(this.uniform(e, `viewportSize`), t.bounds.width, t.bounds.height), o.uniform4fv(this.uniform(e, `appearance`), a), o.uniform4f(this.uniform(e, `localRect`), r.x, r.y, r.width, r.height), o.uniform2f(this.uniform(e, `uvOrigin`), r.u0, r.v0), o.uniform4f(this.uniform(e, `uvBasis`), r.ux, r.vx, r.uy, r.vy);
		let s = Math.min(r.u0, r.u0 + r.ux, r.u0 + r.uy, r.u0 + r.ux + r.uy), c = Math.min(r.v0, r.v0 + r.vx, r.v0 + r.vy, r.v0 + r.vx + r.vy);
		o.uniform4f(this.uniform(e, `sourceBounds`), s, c, Math.abs(r.ux) + Math.abs(r.uy), Math.abs(r.vx) + Math.abs(r.vy)), o.uniform1i(this.uniform(e, `image`), 0), o.uniform1i(this.uniform(e, `renderSource`), `kind` in n ? +(n.kind === `render`) : 1), o.uniform1i(this.uniform(e, `tiling`), 0), o.uniform1i(this.uniform(e, `repeatUV`), 0), o.activeTexture(o.TEXTURE0), o.bindTexture(o.TEXTURE_2D, `kind` in n ? this.hooks.source(n) : n.texture), o.bindSampler(0, this.sampler(!1, !1));
	}
	distanceField(t, n) {
		let r = n instanceof require_texture.Texture ? require_distance_field.getTextureDistanceField(n) : void 0;
		this.gl.uniform2f(this.uniform(t, `distanceField`), r ? r.type === `sdf` ? 1 : 2 : 0, r?.range ?? 0);
	}
	sampler(e, t, n = 1) {
		let r = Math.min(n, this.hooks.maxTextureAnisotropy), i = +!!e + (t ? 2 : 0) + 4 * (r - 1), a = this.samplers.get(i);
		if (a) return a;
		let o = this.gl, c = o.createSampler();
		if (!c) throw new require_errors.GraphicsError(`WebGL2 sampler allocation failed.`);
		return o.samplerParameteri(c, o.TEXTURE_MIN_FILTER, r > 1 ? o.LINEAR_MIPMAP_LINEAR : e ? o.NEAREST : o.LINEAR), o.samplerParameteri(c, o.TEXTURE_MAG_FILTER, t ? o.NEAREST : o.LINEAR), o.samplerParameteri(c, o.TEXTURE_WRAP_S, o.CLAMP_TO_EDGE), o.samplerParameteri(c, o.TEXTURE_WRAP_T, o.CLAMP_TO_EDGE), this.hooks.anisotropyExtension && o.samplerParameterf(c, this.hooks.anisotropyExtension.TEXTURE_MAX_ANISOTROPY_EXT, r), this.samplers.set(i, c), c;
	}
	drawCommands(e, t) {
		this.hooks.stats.pass2D();
		let n = e.items;
		for (let r = 0; r < n.length;) {
			let a = n[r];
			if (this.bindTarget(t), a.kind === `sprite` && !a.object.material && !a.object.lighting && !(a.object instanceof require_tiling_sprite2d.TilingSprite2D)) {
				let o = a.object, s = Math.min(o.sampler?.maxAnisotropy ?? 1, this.hooks.maxTextureAnisotropy), c = r + 1;
				for (; c < n.length;) {
					let e = n[c];
					if (e.kind !== `sprite` || e.object.material || e.object.lighting || e.object instanceof require_tiling_sprite2d.TilingSprite2D || e.object.texture !== o.texture || e.object.sampler?.minFilter === `nearest` != (o.sampler?.minFilter === `nearest`) || e.object.sampler?.magFilter === `nearest` != (o.sampler?.magFilter === `nearest`) || Math.min(e.object.sampler?.maxAnisotropy ?? 1, this.hooks.maxTextureAnisotropy) !== s) break;
					c++;
				}
				this.drawSprites(e, r, c, t), r = c;
				continue;
			}
			a.kind === `layer` ? this.drawLayer(a.object, a.commands, t) : a.kind === `sprite` ? this.drawSprite(a.object, t) : a.kind === `mesh` ? this.drawMesh(a.object, t) : this.drawParticles(a.object, t), r++;
		}
	}
	bindInstances(e, t, n) {
		let r = this.gl;
		r.bindVertexArray(e), r.bindBuffer(r.ARRAY_BUFFER, t);
		for (let e = 0; e < 7; e++) r.enableVertexAttribArray(e), r.vertexAttribPointer(e, 4, r.FLOAT, !1, 112, n * 112 + e * 16), r.vertexAttribDivisor(e, 1);
	}
	packQuad(e, t, n) {
		e[t + 12] = n.x, e[t + 13] = n.y, e[t + 14] = n.width, e[t + 15] = n.height, e[t + 16] = n.u0, e[t + 17] = n.v0, e[t + 20] = n.ux, e[t + 21] = n.vx, e[t + 22] = n.uy, e[t + 23] = n.vy, e[t + 24] = Math.min(n.u0, n.u0 + n.ux, n.u0 + n.uy, n.u0 + n.ux + n.uy), e[t + 25] = Math.min(n.v0, n.v0 + n.vx, n.v0 + n.vy, n.v0 + n.vx + n.vy), e[t + 26] = Math.abs(n.ux) + Math.abs(n.uy), e[t + 27] = Math.abs(n.vx) + Math.abs(n.vy);
	}
	spriteMatrix(e, t) {
		return this.objectMatrix(e, t, this.matrix), e.roundPixels && (this.matrix.elements[6] = Math.round(this.matrix.elements[6] * t.target.width / t.bounds.width) * t.bounds.width / t.target.width, this.matrix.elements[7] = Math.round(this.matrix.elements[7] * t.target.height / t.bounds.height) * t.bounds.height / t.target.height), this.matrix;
	}
	drawSprites(e, t, n, r) {
		let i = this.gl, a = n - t;
		a * 28 > this.spriteData.length && (this.spriteData = new Float32Array(Math.max(a * 28, this.spriteData.length * 2)));
		for (let i = t; i < n; i++) {
			let n = e.items[i];
			if (n.kind !== `sprite`) continue;
			let a = n.object, o = (i - t) * 28, s = this.spriteMatrix(a, r).elements, c = this.spriteData;
			c[o] = s[0], c[o + 1] = s[1], c[o + 2] = s[3], c[o + 3] = s[4], c[o + 4] = s[6], c[o + 5] = s[7], require_sprite_instance.getRelativeAppearance2D(a, r.root, this.appearance), c.set(this.appearance, o + 8), this.packQuad(c, o, require_sprite_instance.getSpriteQuad2D(a, this.quad));
		}
		let o = e.items[t];
		if (o.kind !== `sprite`) return;
		let s = o.object, c = this.spriteProgram;
		i.useProgram(c.program), this.distanceField(c, s.texture), i.uniform2f(this.uniform(c, `viewportSize`), r.bounds.width, r.bounds.height), i.uniform1i(this.uniform(c, `image`), 0), i.uniform1i(this.uniform(c, `renderSource`), +(s.texture.kind === `render`)), i.uniform1i(this.uniform(c, `tiling`), 0), i.activeTexture(i.TEXTURE0), i.bindTexture(i.TEXTURE_2D, this.hooks.source(s.texture)), i.bindSampler(0, this.sampler(s.sampler?.minFilter === `nearest`, s.sampler?.magFilter === `nearest`, s.sampler?.maxAnisotropy ?? 1)), this.bindInstances(this.spriteVAO, this.spriteBuffer, 0), this.spriteCapacity < this.spriteData.byteLength && (i.bufferData(i.ARRAY_BUFFER, this.spriteData.byteLength, i.DYNAMIC_DRAW), this.spriteCapacity = this.spriteData.byteLength), i.bufferSubData(i.ARRAY_BUFFER, 0, this.spriteData, 0, a * 28), this.hooks.stats.upload(a * 112), i.drawArraysInstanced(i.TRIANGLES, 0, 6, a), this.hooks.stats.draw2D(a);
	}
	drawSprite(e, t) {
		let n = this.gl, r = require_sprite_instance.getSpriteQuad2D(e, this.quad), a = e.lighting ? e.material ? this.litProgram(e.material) : this.lightingProgram : e.material ? this.register(this.hooks.material(e.material)) : this.quadProgram;
		if (this.spriteMatrix(e, t), require_sprite_instance.getRelativeAppearance2D(e, t.root, this.appearance), this.useQuad(a, t, e.texture, r, this.matrix, this.appearance), n.bindSampler(0, this.sampler(e.sampler?.minFilter === `nearest`, e.sampler?.magFilter === `nearest`, e.sampler?.maxAnisotropy ?? 1)), e.lighting) {
			this.objectMatrix(e, t, this.mapping, !0).invert(), require_lighting2d$1.packLighting2D(e, this.mapping, r, this.lightingData);
			let i = !1;
			for (let e = 0; e < this.lightingData.length; e++) if (this.lightingData[e] !== this.uploadedLighting[e]) {
				i = !0;
				break;
			}
			i && (n.uniform4fv(this.uniform(a, `lighting[0]`), this.lightingData), this.uploadedLighting.set(this.lightingData)), n.uniform1i(this.uniform(a, `normalMap`), 1), n.activeTexture(n.TEXTURE1), n.bindTexture(n.TEXTURE_2D, this.hooks.source(e.normalTexture ?? e.texture)), n.bindSampler(1, this.sampler(e.sampler?.minFilter === `nearest`, e.sampler?.magFilter === `nearest`, e.sampler?.maxAnisotropy ?? 1)), n.activeTexture(n.TEXTURE0);
		}
		if (e.material && n.uniform4fv(this.uniform(a, `uniforms[0]`), e.material.uniforms), e instanceof require_tiling_sprite2d.TilingSprite2D) {
			let t = require_sprite_instance.getTextureQuad2D(e.texture, e.view, e.source, this.sourceQuad);
			n.uniform1i(this.uniform(a, `tiling`), 1), n.uniform4f(this.uniform(a, `tileShape`), t.naturalWidth, t.naturalHeight, 0, 0), n.uniform4f(this.uniform(a, `tileTrim`), t.trimX, t.trimY, t.trimWidth, t.trimHeight), n.uniform2f(this.uniform(a, `uvOrigin`), t.u0, t.v0), n.uniform4f(this.uniform(a, `uvBasis`), t.ux, t.vx, t.uy, t.vy);
			let r = this.tileMatrix.identity().elements, i = Math.cos(e.tileRotation), o = Math.sin(e.tileRotation);
			r[0] = i / e.tileScale.x, r[1] = -o / e.tileScale.y, r[3] = o / e.tileScale.x, r[4] = i / e.tileScale.y, r[6] = (-i * e.tilePosition.x - o * e.tilePosition.y) / e.tileScale.x, r[7] = (o * e.tilePosition.x - i * e.tilePosition.y) / e.tileScale.y, n.uniformMatrix3fv(this.uniform(a, `tileTransform`), !1, r);
		}
		n.drawArrays(n.TRIANGLES, 0, 6), this.hooks.stats.draw2D();
	}
	prepareGeometry(e) {
		e.validate();
		let t = this.gl, n = this.meshes.get(e);
		if (!n) {
			let r = this.hooks.residency.geometry.allocate(e.uvQ.length * 20 + e.indices.byteLength, () => {
				let n = this.meshes.get(e);
				n && (t.deleteVertexArray(n.vao), t.deleteBuffer(n.vertex), t.deleteBuffer(n.index), this.meshes.delete(e));
			}), i = t.createVertexArray(), a = t.createBuffer(), o = t.createBuffer();
			if (!i || !a || !o) throw i && t.deleteVertexArray(i), a && t.deleteBuffer(a), o && t.deleteBuffer(o), r.destroy(), new require_errors.GraphicsError(`WebGL2 Mesh2D allocation failed.`);
			n = {
				vao: i,
				vertex: a,
				index: o,
				allocation: r,
				data: new Float32Array(e.uvQ.length * 5),
				version: -1
			}, this.meshes.set(e, n);
		}
		if (n.allocation.touch(), n.version !== e.version) {
			for (let t = 0; t < e.uvQ.length; t++) {
				let r = t * 5;
				n.data[r] = e.positions[t * 2], n.data[r + 1] = e.positions[t * 2 + 1], n.data[r + 2] = e.uvs[t * 2], n.data[r + 3] = e.uvs[t * 2 + 1], n.data[r + 4] = e.uvQ[t];
			}
			t.bindVertexArray(n.vao), t.bindBuffer(t.ARRAY_BUFFER, n.vertex), t.bufferData(t.ARRAY_BUFFER, n.data, t.DYNAMIC_DRAW), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, n.index), t.bufferData(t.ELEMENT_ARRAY_BUFFER, e.indices, t.DYNAMIC_DRAW), this.hooks.stats.upload(n.data.byteLength + e.indices.byteLength), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 20, 0), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 3, t.FLOAT, !1, 20, 8), n.version = e.version;
		}
		return n.allocation;
	}
	unloadGeometry(e) {
		this.meshes.get(e)?.allocation.destroy();
	}
	drawMesh(e, t) {
		let n = this.gl, r = e.geometry;
		this.prepareGeometry(r);
		let i = this.meshes.get(r);
		require_sprite_instance.getTextureQuad2D(e.texture, e.view, void 0, this.quad), require_sprite_instance.getRelativeAppearance2D(e, t.root, this.appearance), this.useQuad(this.meshProgram, t, e.texture, this.quad, this.objectMatrix(e, t, this.matrix), this.appearance), n.uniform1i(this.uniform(this.meshProgram, `repeatUV`), +(`textureMode` in e && e.textureMode === `repeat`)), n.bindVertexArray(i.vao), n.drawElements(n.TRIANGLES, r.indices.length, n.UNSIGNED_INT, 0), this.hooks.stats.draw2D();
	}
	prepareParticles(e) {
		if (e.destroyed) throw new require_errors.GraphicsError(`Cannot prepare a destroyed ParticleLayer2D.`);
		let t = this.gl, n = this.particles.get(e);
		if (!n) {
			let r = this.hooks.residency.geometry.allocate(e.capacity * 28 * 4, () => {
				let n = this.particles.get(e);
				n && (t.deleteVertexArray(n.vao), t.deleteBuffer(n.buffer), this.particles.delete(e));
			}), i = t.createVertexArray(), a = t.createBuffer();
			if (!i || !a) throw i && t.deleteVertexArray(i), a && t.deleteBuffer(a), r.destroy(), new require_errors.GraphicsError(`WebGL2 particle allocation failed.`);
			n = {
				allocation: r,
				vao: i,
				buffer: a,
				data: new Float32Array(e.capacity * 28),
				versions: new Float64Array(e.capacity * 4).fill(-1),
				slots: new Uint32Array(e.capacity).fill(4294967295),
				generations: new Float64Array(e.capacity).fill(-1)
			}, this.particles.set(e, n), t.bindBuffer(t.ARRAY_BUFFER, a), t.bufferData(t.ARRAY_BUFFER, n.data.byteLength, t.DYNAMIC_DRAW), this.bindInstances(i, a, 0);
		}
		return n.allocation.touch(), n.allocation;
	}
	drawParticles(e, t) {
		this.prepareParticles(e);
		let n = this.gl, i = this.particles.get(e);
		n.bindBuffer(n.ARRAY_BUFFER, i.buffer);
		let a = -1, o = 0;
		for (let t = 0; t < e.activeCount; t++) {
			let s = e.activeSlotAt(t), c = e.getSlot(s), l = t * 28, u = t * 4, f = i.data, p = i.slots[t] !== s || i.generations[t] !== c.generation, m = require_sprite_instance.getTextureQuad2D(c.texture, c.view, c.source, this.quad), h = p || !!(e.dynamicAttributes & require_particle_layer2d.ParticleAttribute2D.Transform) || i.versions[u] !== c.transformVersion, g = p || !!(e.dynamicAttributes & require_particle_layer2d.ParticleAttribute2D.Tint) || i.versions[u + 1] !== c.tintVersion, _ = p || !!(e.dynamicAttributes & (require_particle_layer2d.ParticleAttribute2D.Source | require_particle_layer2d.ParticleAttribute2D.Anchor)) || i.versions[u + 2] !== c.sourceVersion || i.versions[u + 3] !== c.anchorVersion || f[l + 12] !== Math.fround(m.x - c.anchorX * m.naturalWidth) || f[l + 13] !== Math.fround(m.y - c.anchorY * m.naturalHeight) || f[l + 14] !== Math.fround(m.width) || f[l + 15] !== Math.fround(m.height) || f[l + 16] !== Math.fround(m.u0) || f[l + 17] !== Math.fround(m.v0) || f[l + 20] !== Math.fround(m.ux) || f[l + 21] !== Math.fround(m.vx) || f[l + 22] !== Math.fround(m.uy) || f[l + 23] !== Math.fround(m.vy);
			h && (f[l] = c.a, f[l + 1] = c.b, f[l + 2] = c.c, f[l + 3] = c.d, f[l + 4] = c.tx, f[l + 5] = c.ty, f[l + 6] = +(c.space === `world`), i.versions[u] = c.transformVersion), g && (f[l + 8] = c.tintR, f[l + 9] = c.tintG, f[l + 10] = c.tintB, f[l + 11] = c.tintA, i.versions[u + 1] = c.tintVersion), _ && (this.packQuad(f, l, m), f[l + 12] = m.x - c.anchorX * m.naturalWidth, f[l + 13] = m.y - c.anchorY * m.naturalHeight, i.versions[u + 2] = c.sourceVersion, i.versions[u + 3] = c.anchorVersion), i.slots[t] = s, i.generations[t] = c.generation, h || g || _ ? (a < 0 && (a = l), o = l + 28) : a >= 0 && (n.bufferSubData(n.ARRAY_BUFFER, a * 4, f, a, o - a), this.hooks.stats.upload((o - a) * 4), a = -1);
		}
		a >= 0 && (n.bufferSubData(n.ARRAY_BUFFER, a * 4, i.data, a, o - a), this.hooks.stats.upload((o - a) * 4)), this.objectMatrix(e, t, this.matrix), this.objectMatrix(e, t, this.mapping, !0), require_sprite_instance.getRelativeAppearance2D(e, t.root, this.appearance);
		for (let r = 0; r < e.activeCount;) {
			let a = e.getSlot(e.activeSlotAt(r)), o = r + 1;
			for (; o < e.activeCount && e.getSlot(e.activeSlotAt(o)).texture === a.texture;) o++;
			require_sprite_instance.getTextureQuad2D(a.texture, a.view, a.source, this.quad), this.useQuad(this.particleProgram, t, a.texture, this.quad, this.matrix, this.appearance), n.uniformMatrix3fv(this.uniform(this.particleProgram, `worldTransform`), !1, this.mapping.elements), this.bindInstances(i.vao, i.buffer, r), n.drawArraysInstanced(n.TRIANGLES, 0, 6, o - r), this.hooks.stats.draw2D(o - r), r = o;
		}
	}
	layer(e, t, n) {
		let r = this.layers.get(e);
		if (r && e.cacheAsTexture && r.version === e.cacheVersion) return r;
		let i = e.getLocalBounds();
		if (i.width <= 0 || i.height <= 0) return;
		this.validateBounds(i, this.resolution);
		let a = Math.ceil(i.width * this.resolution), o = Math.ceil(i.height * this.resolution);
		if (!r || r.targets[0].width !== a || r.targets[0].height !== o) {
			let t = [];
			try {
				for (let e = 0; e < 3; e++) t.push(this.hooks.createTarget(a, o));
			} catch (e) {
				for (let e of t) this.hooks.deleteTarget(e);
				throw e;
			}
			if (r) for (let e of r.targets) this.hooks.deleteTarget(e);
			r = {
				targets: t,
				bounds: i,
				version: -1,
				result: t[0]
			}, this.layers.set(e, r);
		}
		r.bounds = i;
		let s = {
			scene: n,
			target: r.targets[0],
			bounds: i,
			root: e
		};
		this.clear(s.target), this.drawCommands(t, s);
		let c = r.targets[0], l = r.targets[1];
		if (e.mask) {
			this.drawMask(e.mask, r.targets[2], i), this.pass(c, l, i, 6, void 0, r.targets[2], e.mask);
			let t = c;
			c = l, l = t;
		}
		for (let t of e.filters) {
			if (t.kind === `blur`) {
				this.pass(c, l, i, 3, t, void 0, void 0, !0);
				let e = c;
				c = l, l = e, this.pass(c, l, i, 3, t, void 0, void 0, !1);
			} else this.pass(c, l, i, t.kind === `alpha` ? 1 : t.kind === `color-matrix` ? 2 : t.kind === `noise` ? 4 : 5, t);
			let e = c;
			c = l, l = e;
		}
		return r.result = c, r.version = e.cacheVersion, r;
	}
	clear(e) {
		let t = this.gl;
		t.bindFramebuffer(t.FRAMEBUFFER, e.framebuffer), t.viewport(0, 0, e.width, e.height), t.disable(t.SCISSOR_TEST), t.clearColor(0, 0, 0, 0), t.clear(t.COLOR_BUFFER_BIT);
	}
	drawLayer(e, t, n) {
		let r = this.layer(e, t, n.scene);
		r && (require_sprite_instance.getRelativeAppearance2D(e, n.root, this.appearance), this.compositeLayer(r.result, r.bounds, this.objectMatrix(e, n, this.matrix), this.appearance, e.blendMode, n));
	}
	compositeLayer(e, t, n, r, i, a) {
		let o = this.gl, s = this.quad;
		s.x = t.x, s.y = t.y, s.width = t.width, s.height = t.height, s.u0 = s.v0 = s.vx = s.uy = 0, s.ux = s.vy = 1;
		let c;
		i === `multiply` && (c = this.hooks.createTarget(a.target.width, a.target.height), o.bindFramebuffer(o.READ_FRAMEBUFFER, a.target.framebuffer), o.bindFramebuffer(o.DRAW_FRAMEBUFFER, c.framebuffer), this.hooks.stats.pass2D(), o.blitFramebuffer(0, 0, a.target.width, a.target.height, 0, 0, a.target.width, a.target.height, o.COLOR_BUFFER_BIT, o.NEAREST));
		try {
			this.bindTarget(a);
			let t = c ? this.blendProgram : this.quadProgram;
			this.hooks.stats.pass2D(), this.useQuad(t, a, e, s, n, r), c ? (o.disable(o.BLEND), o.activeTexture(o.TEXTURE1), o.bindTexture(o.TEXTURE_2D, c.texture), o.bindSampler(1, this.sampler(!1, !1)), o.uniform1i(this.uniform(t, `backdrop`), 1)) : i === `erase` ? o.blendFuncSeparate(o.ZERO, o.ONE_MINUS_SRC_ALPHA, o.ZERO, o.ONE_MINUS_SRC_ALPHA) : i === `add` ? o.blendFuncSeparate(o.ONE, o.ONE, o.ONE, o.ONE_MINUS_SRC_ALPHA) : i === `screen` && o.blendFuncSeparate(o.ONE, o.ONE_MINUS_SRC_COLOR, o.ONE, o.ONE_MINUS_SRC_ALPHA), o.drawArrays(o.TRIANGLES, 0, 6), this.hooks.stats.draw2D();
		} finally {
			c && this.hooks.deleteTarget(c);
		}
	}
	drawMask(e, t, n) {
		let r = this.gl;
		if (this.clear(t), this.hooks.stats.pass2D(), e.texture) {
			require_sprite_instance.getTextureQuad2D(e.texture, e.view, void 0, this.quad);
			let i = this.matrix.identity().elements, a = e.transform;
			i[0] = a[0], i[1] = a[1], i[3] = a[2], i[4] = a[3], i[6] = a[4] - n.x, i[7] = a[5] - n.y, this.appearance.fill(1), r.disable(r.BLEND), this.useQuad(this.quadProgram, {
				scene: void 0,
				target: t,
				bounds: n
			}, e.texture, this.quad, this.matrix, this.appearance), r.drawArrays(r.TRIANGLES, 0, 6), this.hooks.stats.draw2D();
			return;
		}
		let i = document.createElement(`canvas`);
		i.width = t.width, i.height = t.height;
		let a = i.getContext(`2d`);
		if (!a) throw new require_errors.GraphicsError(`Native geometric mask rasterization requires Canvas2D.`);
		if (a.setTransform(t.width / n.width, 0, 0, t.height / n.height, -n.x * t.width / n.width, -n.y * t.height / n.height), a.transform(...e.transform), a.fillStyle = `#fff`, e.path) a.fill(e.path.nativePath2D, e.path.fillRule);
		else {
			let t = e.rect;
			a.fillRect(t.x, t.y, t.width, t.height);
		}
		r.activeTexture(r.TEXTURE0), r.bindTexture(r.TEXTURE_2D, t.texture), r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL, !0), r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !0), r.texSubImage2D(r.TEXTURE_2D, 0, 0, 0, r.RGBA, r.UNSIGNED_BYTE, i), this.hooks.stats.upload(t.width * t.height * 4), r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL, !1), r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), i.width = i.height = 0;
	}
	pass(e, t, r, i, a, o, s, c = !0) {
		let l = this.gl, u = this.passProgram;
		this.clear(t), this.hooks.stats.pass2D(), l.disable(l.BLEND), l.useProgram(u.program), l.bindVertexArray(this.emptyVAO), l.activeTexture(l.TEXTURE0), l.bindTexture(l.TEXTURE_2D, e.texture), l.bindSampler(0, this.sampler(!1, !1)), l.uniform1i(this.uniform(u, `image`), 0), l.uniform1i(this.uniform(u, `mode`), i), l.uniform2f(this.uniform(u, `logicalSize`), r.width, r.height);
		let f = a?.uniforms;
		if (l.uniform4f(this.uniform(u, `parameters`), i === 3 ? c ? f[0] : 0 : f?.[0] ?? 0, i === 3 ? c ? 0 : f[0] : f?.[1] ?? 0, i === 3 ? f[1] * 4 : 0, 0), i === 2) {
			for (let e = 0; e < 4; e++) for (let t = 0; t < 4; t++) this.matrixRows[e * 4 + t] = f[e * 5 + t];
			for (let e = 0; e < 4; e++) this.matrixRows[16 + e] = f[e * 5 + 4];
			l.uniform4fv(this.uniform(u, `rows[0]`), this.matrixRows);
		}
		if (a instanceof require_filters2d.DisplacementFilter2D || o) {
			let e = a instanceof require_filters2d.DisplacementFilter2D ? a.texture : void 0;
			if (l.activeTexture(l.TEXTURE1), l.bindTexture(l.TEXTURE_2D, e ? this.hooks.source(e) : o.texture), l.bindSampler(1, this.sampler(!1, !1)), l.uniform1i(this.uniform(u, `mapImage`), 1), e && a instanceof require_filters2d.DisplacementFilter2D) {
				let t = require_sprite_instance.getTextureQuad2D(e, a.view, void 0, this.sourceQuad);
				l.uniform2f(this.uniform(u, `mapOrigin`), t.u0, t.v0), l.uniform4f(this.uniform(u, `mapBasis`), t.ux, t.vx, t.uy, t.vy), l.uniform4f(this.uniform(u, `mapBounds`), Math.min(t.u0, t.u0 + t.ux, t.u0 + t.uy), Math.min(t.v0, t.v0 + t.vx, t.v0 + t.vy), Math.abs(t.ux) + Math.abs(t.uy), Math.abs(t.vx) + Math.abs(t.vy));
			} else l.uniform2f(this.uniform(u, `mapOrigin`), 0, 0), l.uniform4f(this.uniform(u, `mapBasis`), 1, 0, 0, 1), l.uniform4f(this.uniform(u, `mapBounds`), 0, 0, 1, 1);
			l.uniform1i(this.uniform(u, `mapRender`), e ? +(e.kind === `render`) : 1), l.uniform1i(this.uniform(u, `mapRed`), +(s?.channel === `red`)), l.uniform1i(this.uniform(u, `inverseMask`), +!!s?.inverse);
		}
		l.drawArrays(l.TRIANGLES, 0, 3), this.hooks.stats.draw2D();
	}
	createRenderTexture(e) {
		this.hooks.assertIdle();
		let t = require_render_texture2d.validateRenderTextureSize2D(e, this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE)), n = this.hooks.createTarget(t.width, t.height);
		this.clear(n);
		let r = require_render_texture2d.createOwnedRenderTexture2D(this.hooks.owner, t, (e) => {
			this.hooks.assertIdle();
			let t = this.hooks.createTarget(e.width, e.height);
			this.clear(t), this.hooks.deleteTarget(n), n = t, this.targets.set(r, n);
		}, () => {
			this.targets.delete(r), this.hooks.deleteTarget(n);
		});
		return this.targets.set(r, n), r;
	}
	source(e) {
		require_render_texture2d.assertRenderTextureOwner2D(e, this.hooks.owner);
		let t = this.targets.get(e);
		if (!t) throw new require_errors.GraphicsError(`Render texture has no native storage.`);
		return t.texture;
	}
	async renderToTexture(e, r, i = {}) {
		this.hooks.assertIdle(), require_render_texture2d.assertRenderTextureOwner2D(e, this.hooks.owner);
		let a = r instanceof require_isolated_group.IsolatedGroup2D ? r : void 0, o = a ? a.scene : r;
		if (!o || a?.destroyed) throw new require_errors.GraphicsError(`Render content must belong to a live Scene.`);
		let l = i.bounds ?? (a ? a.getLocalBounds() : {
			x: 0,
			y: 0,
			width: e.logicalWidth,
			height: e.logicalHeight
		});
		if (this.validateBounds(l, e.resolution), require_render2d_contract.collectRenderCommands2D(o, l.width, l.height, this.captureCommands, {
			...a ? { root: a } : {},
			skipCulling: !0
		}), this.preflight(this.captureCommands, o, l.width, l.height, e.resolution), a) {
			a.mask?.texture && this.validateSource(a.mask.texture, a.mask.view);
			for (let e of a.filters) {
				if (e.destroyed) throw new require_errors.GraphicsError(`Cannot render a destroyed filter.`);
				e instanceof require_filters2d.DisplacementFilter2D && this.validateSource(e.texture, e.view);
			}
		}
		require_render_texture2d.validateRenderTextureDependencies2D(e, this.dependencies, this.hooks.owner);
		let u = this.targets.get(e), d = this.hooks.createTarget(e.width, e.height);
		this.hooks.residency.beginFrame();
		try {
			this.clear(d), i.clear === !1 && (this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, u.framebuffer), this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, d.framebuffer), this.hooks.stats.pass2D(), this.gl.blitFramebuffer(0, 0, e.width, e.height, 0, 0, e.width, e.height, this.gl.COLOR_BUFFER_BIT, this.gl.NEAREST));
			let t = {
				scene: o,
				target: d,
				bounds: l,
				...a ? { root: a } : {}
			};
			if (a) {
				let e = this.layer(a, this.captureCommands, o);
				if (e) {
					let n = a.tint;
					this.appearance[0] = n[0], this.appearance[1] = n[1], this.appearance[2] = n[2], this.appearance[3] = n[3] * a.opacity, this.matrix.identity().elements[6] = -l.x, this.matrix.elements[7] = -l.y, this.compositeLayer(e.result, e.bounds, this.matrix, this.appearance, a.blendMode, t);
				}
			} else this.drawCommands(this.captureCommands, t);
			!a && o.effects2D.length && this.drawSceneEffects(o, d, l), this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, d.framebuffer), this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, u.framebuffer), this.hooks.stats.pass2D(), this.gl.blitFramebuffer(0, 0, e.width, e.height, 0, 0, e.width, e.height, this.gl.COLOR_BUFFER_BIT, this.gl.NEAREST), e.publish(this.hooks.owner, this.dependencies), this.gl.flush();
		} finally {
			this.hooks.residency.abortFrame(), this.hooks.deleteTarget(d), this.captureCommands.clear(), this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null), this.gl.bindVertexArray(null);
		}
	}
	drawSceneEffects(e, t, n) {
		let r = this.hooks.createTarget(t.width, t.height), i = this.gl, a = t, o = r;
		try {
			for (let t of e.effects2D) {
				let e = this.register(this.hooks.processor(t));
				this.clear(o), this.hooks.stats.pass2D(), i.disable(i.BLEND), i.bindVertexArray(this.emptyVAO), i.useProgram(e.program), i.uniform2f(this.uniform(e, `viewportSize`), n.width, n.height), i.uniform4fv(this.uniform(e, `uniforms[0]`), t.uniforms), i.uniform1i(this.uniform(e, `image`), 0), i.activeTexture(i.TEXTURE0), i.bindTexture(i.TEXTURE_2D, a.texture), i.bindSampler(0, this.sampler(!1, !1)), i.drawArrays(i.TRIANGLES, 0, 3), this.hooks.stats.draw2D();
				let r = a;
				a = o, o = r;
			}
			a !== t && (i.bindFramebuffer(i.READ_FRAMEBUFFER, a.framebuffer), i.bindFramebuffer(i.DRAW_FRAMEBUFFER, t.framebuffer), this.hooks.stats.pass2D(), i.blitFramebuffer(0, 0, t.width, t.height, 0, 0, t.width, t.height, i.COLOR_BUFFER_BIT, i.NEAREST));
		} finally {
			this.hooks.deleteTarget(r);
		}
	}
	async extractPixels(e, t = {}) {
		this.hooks.assertIdle(), require_render_texture2d.assertRenderTextureOwner2D(e, this.hooks.owner);
		let n = require_render_texture2d.validateRenderTextureRegion2D(e, t.region), r = this.targets.get(e), i = this.gl, a = new Uint8Array(n.width * n.height * 4), o = new Uint8ClampedArray(a.length);
		i.bindFramebuffer(i.FRAMEBUFFER, r.framebuffer), i.readPixels(n.x, e.height - n.y - n.height, n.width, n.height, i.RGBA, i.UNSIGNED_BYTE, a), i.bindFramebuffer(i.FRAMEBUFFER, null);
		let c = i.getError();
		if (c !== i.NO_ERROR) throw new require_errors.GraphicsError(`WebGL2 extraction failed (0x${c.toString(16)}).`);
		for (let e = 0; e < n.height; e++) for (let t = 0; t < n.width; t++) {
			let r = ((n.height - 1 - e) * n.width + t) * 4, i = (e * n.width + t) * 4, s = a[r + 3];
			o[i + 3] = s;
			for (let e = 0; e < 3; e++) o[i + e] = s ? Math.round(a[r + e] * 255 / s) : 0;
		}
		return o;
	}
	async generateTexture(n, r = {}) {
		this.hooks.assertIdle();
		let i = r.bounds ?? (n instanceof require_isolated_group.IsolatedGroup2D ? n.getLocalBounds() : {
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
			await this.renderToTexture(a, n, { bounds: i });
			let t = await this.extractPixels(a);
			this.hooks.assertAlive();
			let r = document.createElement(`canvas`);
			r.width = a.width, r.height = a.height;
			let o = r.getContext(`2d`);
			if (!o) throw new require_errors.GraphicsError(`Texture generation requires Canvas2D image encoding.`);
			o.putImageData(new ImageData(t, a.width, a.height), 0, 0);
			try {
				let t = await require_texture.Texture.fromImage(r);
				return this.disposed && (t.destroy(), this.hooks.assertAlive()), t;
			} finally {
				r.width = r.height = 0;
			}
		} finally {
			a.destroy();
		}
	}
	destroy() {
		if (this.disposed) return;
		this.disposed = !0;
		let e = this.gl;
		for (let e of this.targets.keys()) e.destroy();
		for (let e of this.layers.values()) for (let t of e.targets) this.hooks.deleteTarget(t);
		for (let t of this.meshes.values()) e.deleteVertexArray(t.vao), e.deleteBuffer(t.vertex), e.deleteBuffer(t.index);
		for (let t of this.particles.values()) e.deleteVertexArray(t.vao), e.deleteBuffer(t.buffer);
		for (let t of this.samplers.values()) e.deleteSampler(t);
		for (let t of [
			this.quadProgram,
			this.lightingProgram,
			this.spriteProgram,
			this.meshProgram,
			this.particleProgram,
			this.passProgram,
			this.blendProgram
		]) e.deleteProgram(t.program);
		e.deleteVertexArray(this.emptyVAO), e.deleteVertexArray(this.spriteVAO), e.deleteBuffer(this.spriteBuffer), this.targets.clear(), this.layers.clear(), this.meshes.clear(), this.particles.clear(), this.samplers.clear(), this.programs.clear(), this.captureCommands.destroy();
	}
};
//#endregion
exports.WebGLRender2D = WebGLRender2D;

//# sourceMappingURL=webgl2-render2d.cjs.map