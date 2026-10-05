const require_geometry_processing = require("./geometry-processing.cjs");
//#region dist/packages/core/src/geometry-worker-job.js
var trustedHeightfieldGeometryJob = {
	decode(e) {
		if (!e || typeof e != `object`) throw TypeError(`A heightfield request is required.`);
		return e;
	},
	execute(t) {
		let n = require_geometry_processing.processHeightfieldGeometry(t), r = [
			n.positions,
			n.normals,
			n.uvs,
			n.indices
		];
		return {
			value: n,
			transfer: t.transferResult === !1 ? [] : r.map((e) => e.buffer),
			byteLength: r.reduce((e, t) => e + t.byteLength, 0)
		};
	}
};
//#endregion
exports.trustedHeightfieldGeometryJob = trustedHeightfieldGeometryJob;

//# sourceMappingURL=geometry-worker-job.cjs.map