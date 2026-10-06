const require_mesh = require("./mesh.cjs");
const require_native_material_state = require("./native-material-state.cjs");
const require_optical_material_maps = require("./optical-material-maps.cjs");
const require_pbr_material = require("./pbr-material.cjs");
//#region dist/packages/core/src/native-pbr-material.js
var NativePBRMaterial = class extends require_pbr_material.PBRMaterial {
	state;
	label;
	uniforms;
	deformationBounds;
	shadowCache;
	constructor(e) {
		super(e), this.state = new require_native_material_state.NativeMaterialState(e, `NativePBRMaterial`), this.label = this.state.label, this.uniforms = this.state.uniforms, this.deformationBounds = this.state.deformationBounds, this.shadowCache = this.state.shadowCache;
	}
	get wgsl() {
		return this.state.wgsl;
	}
	get glsl() {
		return this.state.glsl;
	}
	get destroyed() {
		return this.state.destroyed;
	}
	setUniforms(e, t = 0) {
		this.state.setUniforms(e, t);
	}
	validate() {
		if (this.state.validate(), require_mesh.materialBaseTexture(this).destroyed) throw Error(`NativePBRMaterial references a destroyed borrowed texture.`);
		let e = require_pbr_material.pbrTextureSources(this);
		for (let n of require_pbr_material.pbrTextureKeys) if (e[n]?.destroyed) throw Error(`NativePBRMaterial references a destroyed borrowed texture.`);
		let i = require_optical_material_maps.opticalMaterialMaps(this);
		if (i.anisotropyTexture?.destroyed || i.iridescenceTexture?.destroyed || i.iridescenceThicknessTexture?.destroyed) throw Error(`NativePBRMaterial references a destroyed borrowed texture.`);
	}
	onDestroy(e) {
		return this.state.onDestroy(e);
	}
	destroy() {
		this.state.destroy();
	}
};
//#endregion
exports.NativePBRMaterial = NativePBRMaterial;

//# sourceMappingURL=native-pbr-material.cjs.map