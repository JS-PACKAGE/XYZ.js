const require_errors = require("../../../graphics/src/errors.cjs");
const require_materials2d = require("../../../../src/data/materials2d.cjs");
//#region dist/packages/core/src/materials2d/material2d.js
var NativeEffect2D = class extends EventTarget {
	wgslSource;
	glslSource;
	disposed = !1;
	uniforms = new Float32Array(require_materials2d.materials2dLimits.uniformFloats);
	constructor(n) {
		super();
		for (let r of [`wgsl`, `glsl`]) {
			let i = n[r];
			if (typeof i != `string` || !i.trim() || i.length > require_materials2d.materials2dLimits.sourceCharacters) throw new require_errors.GraphicsError(`${r} effect source must be nonempty and at most ${require_materials2d.materials2dLimits.sourceCharacters} characters.`);
		}
		this.wgslSource = n.wgsl, this.glslSource = n.glsl, n.uniforms && this.setUniforms(n.uniforms);
	}
	get wgsl() {
		return this.wgslSource;
	}
	get glsl() {
		return this.glslSource;
	}
	get destroyed() {
		return this.disposed;
	}
	setUniforms(t) {
		if (this.disposed) throw new require_errors.GraphicsError(`Cannot update a destroyed 2D effect.`);
		if (t.length > this.uniforms.length || t.some((e) => !Number.isFinite(e) || !Number.isFinite(Math.fround(e)))) throw new require_errors.GraphicsError(`2D effects accept at most ${this.uniforms.length} finite float uniforms.`);
		this.uniforms.fill(0), this.uniforms.set(t);
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.dispatchEvent(new Event(`destroy`)));
	}
};
var Material2D = class extends NativeEffect2D {};
var PostProcessor2D = class extends NativeEffect2D {};
function validateEffect2D(t) {
	if (t.destroyed) throw new require_errors.GraphicsError(`Cannot use a destroyed 2D effect.`);
	for (let n of t.uniforms) if (!Number.isFinite(n)) throw new require_errors.GraphicsError(`2D effect uniforms must remain finite.`);
}
//#endregion
exports.Material2D = Material2D;
exports.PostProcessor2D = PostProcessor2D;
exports.validateEffect2D = validateEffect2D;

//# sourceMappingURL=material2d.cjs.map