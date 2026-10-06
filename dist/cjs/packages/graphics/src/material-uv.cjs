const require_errors = require("./errors.cjs");
const require_optical_material_maps = require("../../core/src/optical-material-maps.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
const require_optical_maps = require("./optical-maps.cjs");
//#region dist/packages/graphics/src/material-uv.js
function fillMaterialUV(i, a, o, s = 0) {
	let c = i instanceof require_pbr_material.PBRMaterial ? require_optical_material_maps.materialTextureCoordinates(i) : void 0;
	for (let t = 0; t < require_optical_maps.mappedMaterialTextureSlots.length; t++) {
		let n = c?.[require_optical_maps.mappedMaterialTextureSlots[t]];
		if (n?.texCoord === 1 && !a.uvs1) throw new require_errors.GraphicsError(`Material ${require_optical_maps.mappedMaterialTextureSlots[t]} requires absent TEXCOORD_1.`);
		let i = s + t * 8;
		if (n) {
			for (let e = 0; e < 6; e++) o[i + e] = n.transform[e];
			o[i + 6] = n.texCoord;
		} else o[i] = o[i + 3] = 1, o[i + 1] = o[i + 2] = o[i + 4] = o[i + 5] = o[i + 6] = 0;
		o[i + 7] = 0;
	}
}
//#endregion
exports.fillMaterialUV = fillMaterialUV;

//# sourceMappingURL=material-uv.cjs.map