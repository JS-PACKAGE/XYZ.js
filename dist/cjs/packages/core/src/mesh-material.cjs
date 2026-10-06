const require_mesh = require("./mesh.cjs");
//#region dist/packages/core/src/mesh-material.js
function setMeshMaterial(n, r) {
	if (!(n instanceof require_mesh.Mesh)) throw TypeError(`setMeshMaterial requires a Mesh.`);
	if (!(r instanceof require_mesh.TextureMaterial)) throw TypeError(`Mesh material must be a TextureMaterial.`);
	let i = n;
	i.material = r;
}
//#endregion
exports.setMeshMaterial = setMeshMaterial;

//# sourceMappingURL=mesh-material.cjs.map