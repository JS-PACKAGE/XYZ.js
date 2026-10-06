const require_rendering = require("../../../src/data/rendering.cjs");
const require_optical_material_maps = require("../../core/src/optical-material-maps.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
//#region dist/packages/graphics/src/optical-maps.js
var mappedMaterialTextureSlots = Object.freeze([
	...require_rendering.materialTextureSlots,
	`anisotropy`,
	`iridescence`,
	`iridescenceThickness`
]);
var mappedMaterialUVFloatCount = mappedMaterialTextureSlots.length * 8;
function fillOpticalMapSettings(e, t, n, r, i = 16) {
	e[t] = n?.width ?? 0, e[t + 1] = n?.height ?? 0;
	let a = r?.addressModeU === `repeat` ? 1 : r?.addressModeU === `mirror-repeat` ? 2 : 0, o = r?.addressModeV === `repeat` ? 1 : r?.addressModeV === `mirror-repeat` ? 2 : 0;
	e[t + 2] = a + o * 3, e[t + 3] = (r?.minFilter === `nearest` ? 0 : 1) + (r?.magFilter === `nearest` ? 0 : 2) + 4 * (Math.min(r?.maxAnisotropy ?? 1, i) - 1);
}
function opticalMapSources(n) {
	let r = require_pbr_material.pbrTextureSources(n), i = require_optical_material_maps.opticalMaterialMaps(n);
	return [
		r.transmissionTexture,
		r.thicknessTexture,
		i.anisotropyTexture,
		i.iridescenceTexture,
		i.iridescenceThicknessTexture
	];
}
function fillMappedOpticalSettings(e, n, r, i = 16) {
	let a = require_optical_material_maps.opticalMaterialMaps(e);
	fillOpticalMapSettings(n, r, a.anisotropyTexture, a.anisotropySampler, i), fillOpticalMapSettings(n, r + 4, a.iridescenceTexture, a.iridescenceSampler, i), fillOpticalMapSettings(n, r + 8, a.iridescenceThicknessTexture, a.iridescenceThicknessSampler, i), n[r + 12] = a.iridescenceThicknessMinimum, n[r + 13] = a.iridescenceThicknessMaximum, n[r + 14] = 0, n[r + 15] = 0;
}
//#endregion
exports.fillMappedOpticalSettings = fillMappedOpticalSettings;
exports.fillOpticalMapSettings = fillOpticalMapSettings;
exports.mappedMaterialTextureSlots = mappedMaterialTextureSlots;
exports.mappedMaterialUVFloatCount = mappedMaterialUVFloatCount;
exports.opticalMapSources = opticalMapSources;

//# sourceMappingURL=optical-maps.cjs.map