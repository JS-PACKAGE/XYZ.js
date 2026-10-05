const require_errors = require("./errors.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
//#region dist/packages/graphics/src/material-uv.js
function fillMaterialUV(r, i, a, o = 0) {
	for (let s = 0; s < require_rendering.materialTextureSlots.length; s++) {
		let c = r instanceof require_pbr_material.PBRMaterial ? r.textureCoordinates[require_rendering.materialTextureSlots[s]] : void 0;
		if (c?.texCoord === 1 && !i.uvs1) throw new require_errors.GraphicsError(`Material ${require_rendering.materialTextureSlots[s]} requires absent TEXCOORD_1.`);
		let l = o + s * 8;
		if (c) {
			for (let e = 0; e < 6; e++) a[l + e] = c.transform[e];
			a[l + 6] = c.texCoord;
		} else a[l] = a[l + 3] = 1, a[l + 1] = a[l + 2] = a[l + 4] = a[l + 5] = a[l + 6] = 0;
		a[l + 7] = 0;
	}
}
//#endregion
exports.fillMaterialUV = fillMaterialUV;

//# sourceMappingURL=material-uv.cjs.map