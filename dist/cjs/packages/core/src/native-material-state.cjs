const require_rendering = require("../../../src/data/rendering.cjs");
//#region dist/packages/core/src/native-material-state.js
var NativeMaterialState = class {
	kind;
	wgsl;
	glsl;
	label;
	deformationBounds;
	shadowCache;
	uniforms = new Float32Array(require_rendering.nativeMaterial3DLimits.uniformFloats);
	listeners = /* @__PURE__ */ new Set();
	disposed = !1;
	constructor(t, n) {
		if (this.kind = n, typeof t.wgsl != `string` || !t.wgsl.trim() || typeof t.glsl != `string` || !t.glsl.trim() || t.wgsl.length > require_rendering.nativeMaterial3DLimits.sourceCharacters || t.glsl.length > require_rendering.nativeMaterial3DLimits.sourceCharacters) throw TypeError(`${n} requires bounded WGSL and GLSL native hooks.`);
		if (t.deformationBounds !== void 0 && (!Number.isFinite(t.deformationBounds) || t.deformationBounds < 0)) throw RangeError(`${n} deformationBounds must be finite and nonnegative.`);
		if (t.shadowCache !== void 0 && t.shadowCache !== `dynamic` && t.shadowCache !== `tracked`) throw TypeError(`${n} shadowCache must be dynamic or tracked.`);
		this.wgsl = t.wgsl, this.glsl = t.glsl, this.label = t.label ?? n, this.deformationBounds = t.deformationBounds, this.shadowCache = t.shadowCache ?? `dynamic`, t.uniforms && this.setUniforms(t.uniforms);
	}
	get destroyed() {
		return this.disposed;
	}
	setUniforms(e, t = 0) {
		if (this.disposed) throw Error(`${this.kind} is destroyed.`);
		if (!Number.isSafeInteger(e.length) || e.length < 0 || !Number.isSafeInteger(t) || t < 0 || t + e.length > this.uniforms.length) throw RangeError(`${this.kind} uniform update exceeds 64 floats.`);
		for (let t = 0; t < e.length; t++) if (!Number.isFinite(e[t]) || !Number.isFinite(Math.fround(e[t]))) throw RangeError(`${this.kind} uniforms must fit finite Float32.`);
		this.uniforms.set(e, t);
	}
	validate() {
		if (this.disposed) throw Error(`${this.kind} is destroyed.`);
		for (let e of this.uniforms) if (!Number.isFinite(e)) throw RangeError(`${this.kind} uniforms must be finite.`);
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
		if (this.listeners.clear(), e) throw AggregateError(e, `${this.kind} cleanup failed.`);
	}
};
//#endregion
exports.NativeMaterialState = NativeMaterialState;

//# sourceMappingURL=native-material-state.cjs.map