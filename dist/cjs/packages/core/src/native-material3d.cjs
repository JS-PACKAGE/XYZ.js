const require_texture = require("../../assets/src/texture.cjs");
const require_texture2d = require("../../assets/src/texture2d.cjs");
const require_mesh = require("./mesh.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_native_material_state = require("./native-material-state.cjs");
const require_native_pbr_material = require("./native-pbr-material.cjs");
//#region dist/packages/core/src/native-material3d.js
var o = /* @__PURE__ */ new WeakMap();
var s = Object.freeze([]);
function nativeMaterialSources(e) {
	return o.get(e) ?? s;
}
var NativeMaterial3D = class extends require_mesh.TextureMaterial {
	state;
	label;
	borrowedMaps;
	deformationBounds;
	uniforms;
	shadowCache;
	constructor(n) {
		super(n), this.state = new require_native_material_state.NativeMaterialState(n, `NativeMaterial3D`), this.label = this.state.label, this.deformationBounds = this.state.deformationBounds, this.uniforms = this.state.uniforms, this.shadowCache = this.state.shadowCache;
		let a = n.textures ?? [], s = n.textureSources ?? [], c = Math.max(a.length, s.length), l = [];
		for (let n = 0; n < c; n++) {
			let r = s[n] ?? a[n];
			if (r === void 0 || !(r instanceof require_texture.Texture) && !(r instanceof require_texture2d.CanvasTexture2D) || r.destroyed) throw TypeError(`NativeMaterial3D accepts at most four live borrowed textures.`);
			l.push(r);
		}
		if (c > require_rendering.nativeMaterial3DLimits.textures || a.some((t) => !(t instanceof require_texture.Texture) || t.destroyed)) throw TypeError(`NativeMaterial3D accepts at most four live borrowed textures.`);
		this.borrowedMaps = Object.freeze([...a]), o.set(this, Object.freeze(l));
	}
	get wgsl() {
		return this.state.wgsl;
	}
	get glsl() {
		return this.state.glsl;
	}
	get textures() {
		return this.borrowedMaps;
	}
	get destroyed() {
		return this.state.destroyed;
	}
	setUniforms(e, t = 0) {
		this.state.setUniforms(e, t);
	}
	validate() {
		if (this.state.validate(), this.texture.destroyed || (o.get(this) ?? []).some((e) => e.destroyed)) throw Error(`NativeMaterial3D references a destroyed borrowed texture.`);
	}
	onDestroy(e) {
		return this.state.onDestroy(e);
	}
	destroy() {
		this.state.destroy();
	}
};
function isNativeMaterial3D(e) {
	return e instanceof NativeMaterial3D || e instanceof require_native_pbr_material.NativePBRMaterial;
}
//#endregion
exports.NativeMaterial3D = NativeMaterial3D;
exports.isNativeMaterial3D = isNativeMaterial3D;
exports.nativeMaterialSources = nativeMaterialSources;

//# sourceMappingURL=native-material3d.cjs.map