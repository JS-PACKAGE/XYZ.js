const require_pbr_material = require("./pbr-material.cjs");
//#region dist/packages/core/src/draw-order.js
function isBlended(t) {
	let n = t.material;
	return n instanceof require_pbr_material.PBRMaterial ? n.alphaMode === `BLEND` : n.transparent;
}
var DrawSorter = class {
	pool = [];
	active = [];
	sort(e, t, n = isBlended) {
		let r = this.active, i = 0;
		for (let a = 0; a < e.length; a++) {
			let o = e[a];
			if (!n(o)) {
				e[i++] = o;
				continue;
			}
			let s = this.pool[r.length] ??= {
				mesh: void 0,
				distance: 0
			};
			s.mesh = o, s.distance = o.distanceSquaredTo(t.x, t.y, t.z), r.push(s);
		}
		if (r.length !== 0) {
			r.sort((e, t) => t.distance - e.distance);
			for (let t of r) e[i++] = t.mesh, t.mesh = void 0;
			r.length = 0;
		}
	}
};
//#endregion
exports.DrawSorter = DrawSorter;
exports.isBlended = isBlended;

//# sourceMappingURL=draw-order.cjs.map