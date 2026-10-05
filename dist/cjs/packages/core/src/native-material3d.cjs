const require_texture = require("../../assets/src/texture.cjs");
const require_texture2d = require("../../assets/src/texture2d.cjs");
const require_mesh = require("./mesh.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
//#region dist/packages/core/src/native-material3d.js
var i = /* @__PURE__ */ new WeakMap();
var a = Object.freeze([]);
function nativeMaterialSources(e) {
	return i.get(e) ?? a;
}
var NativeMaterial3D = class extends require_mesh.TextureMaterial {
	wgslSource;
	glslSource;
	label;
	borrowedMaps;
	deformationBounds;
	uniforms = new Float32Array(require_rendering.nativeMaterial3DLimits.uniformFloats);
	shadowCache;
	listeners = /* @__PURE__ */ new Set();
	disposed = !1;
	constructor(n) {
		if (super(n), typeof n.wgsl != `string` || !n.wgsl.trim() || typeof n.glsl != `string` || !n.glsl.trim() || n.wgsl.length > require_rendering.nativeMaterial3DLimits.sourceCharacters || n.glsl.length > require_rendering.nativeMaterial3DLimits.sourceCharacters) throw TypeError(`NativeMaterial3D requires bounded WGSL and GLSL native hooks.`);
		let a = n.textures ?? [], o = n.textureSources ?? [], s = Math.max(a.length, o.length), c = [];
		for (let n = 0; n < s; n++) {
			let r = o[n] ?? a[n];
			if (r === void 0 || !(r instanceof require_texture.Texture) && !(r instanceof require_texture2d.CanvasTexture2D) || r.destroyed) throw TypeError(`NativeMaterial3D accepts at most four live borrowed textures.`);
			c.push(r);
		}
		if (s > require_rendering.nativeMaterial3DLimits.textures || a.some((t) => !(t instanceof require_texture.Texture) || t.destroyed)) throw TypeError(`NativeMaterial3D accepts at most four live borrowed textures.`);
		if (n.deformationBounds !== void 0 && (!Number.isFinite(n.deformationBounds) || n.deformationBounds < 0)) throw RangeError(`NativeMaterial3D deformationBounds must be finite and nonnegative.`);
		if (this.deformationBounds = n.deformationBounds, n.shadowCache !== void 0 && n.shadowCache !== `dynamic` && n.shadowCache !== `tracked`) throw TypeError(`NativeMaterial3D shadowCache must be dynamic or tracked.`);
		this.shadowCache = n.shadowCache ?? `dynamic`, this.wgslSource = n.wgsl, this.glslSource = n.glsl, this.label = n.label ?? `NativeMaterial3D`, this.borrowedMaps = Object.freeze([...a]), i.set(this, Object.freeze(c)), n.uniforms && this.setUniforms(n.uniforms);
	}
	get wgsl() {
		return this.wgslSource;
	}
	get glsl() {
		return this.glslSource;
	}
	get textures() {
		return this.borrowedMaps;
	}
	get destroyed() {
		return this.disposed;
	}
	setUniforms(e, t = 0) {
		if (this.disposed) throw Error(`NativeMaterial3D is destroyed.`);
		if (!Number.isSafeInteger(e.length) || e.length < 0 || !Number.isSafeInteger(t) || t < 0 || t + e.length > this.uniforms.length) throw RangeError(`NativeMaterial3D uniform update exceeds 64 floats.`);
		for (let t = 0; t < e.length; t++) if (!Number.isFinite(e[t]) || !Number.isFinite(Math.fround(e[t]))) throw RangeError(`NativeMaterial3D uniforms must fit finite Float32.`);
		this.uniforms.set(e, t);
	}
	validate() {
		if (this.disposed) throw Error(`NativeMaterial3D is destroyed.`);
		if (this.texture.destroyed || (i.get(this) ?? []).some((e) => e.destroyed)) throw Error(`NativeMaterial3D references a destroyed borrowed texture.`);
		for (let e of this.uniforms) if (!Number.isFinite(e)) throw RangeError(`NativeMaterial3D uniforms must be finite.`);
	}
	onDestroy(e) {
		return this.disposed ? (e(), () => {}) : (this.listeners.add(e), () => {
			this.listeners.delete(e);
		});
	}
	destroy() {
		if (this.disposed) return;
		this.disposed = !0;
		let e;
		for (let t of this.listeners) try {
			t();
		} catch (t) {
			(e ??= []).push(t);
		}
		if (this.listeners.clear(), e) throw AggregateError(e, `NativeMaterial3D cleanup failed.`);
	}
};
//#endregion
exports.NativeMaterial3D = NativeMaterial3D;
exports.nativeMaterialSources = nativeMaterialSources;

//# sourceMappingURL=native-material3d.cjs.map