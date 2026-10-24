const require_procedural_material_maps = require("./procedural-material-maps.cjs");
//#region dist/packages/core/src/procedural-material-worker-job.js
var trustedProceduralMapsJob = {
	decode(e) {
		if (!e || typeof e != `object`) throw TypeError(`A procedural maps request is required.`);
		return e;
	},
	execute(t) {
		let n = require_procedural_material_maps.generateProceduralMaps(t.kind, t.size, t.seed, {
			contrast: t.contrast,
			roughnessBias: t.roughnessBias,
			tint: t.tint,
			heightMap: t.heightMap
		}), r = [
			n.baseColor,
			n.normal,
			n.metallicRoughness,
			n.occlusion
		];
		return n.height && r.push(n.height), {
			value: n,
			transfer: r.map((e) => e.buffer),
			byteLength: r.reduce((e, t) => e + t.byteLength, 0)
		};
	}
};
//#endregion
exports.trustedProceduralMapsJob = trustedProceduralMapsJob;

//# sourceMappingURL=procedural-material-worker-job.cjs.map