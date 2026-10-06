const require_errors = require("./errors.cjs");
const require_planar_reflection = require("../../core/src/planar-reflection.cjs");
//#region dist/packages/graphics/src/planar-reflection-capture.js
var n = /* @__PURE__ */ new WeakSet();
function encodePlanarReflection(r, i, a) {
	if (r.destroyed || i.destroyed) throw new require_errors.GraphicsError(`Cannot capture a destroyed scene or planar reflection.`);
	if (n.has(r)) throw new require_errors.GraphicsError(`Recursive scene reflection capture.`);
	let o = r.camera3D, s = new require_planar_reflection.PlanarReflectionCamera(o, i), c = r.postProcessing, l = c.enabled, u = c.taa, d = c.ssr, f = r.renderGraph, p = r.reflectionProbes.map((e) => [e, e.enabled]), m = i.exclude.map((e) => [e, e.visible]);
	n.add(r);
	try {
		r.camera3D = s, c.enabled = c.taa = c.ssr = !1, r.renderGraph = void 0;
		for (let [e] of p) e.enabled = !1;
		for (let [e] of m) e.visible = !1;
		s.updateMatrix(1), a(s);
	} finally {
		r.camera3D = o, c.enabled = l, c.taa = u, c.ssr = d, r.renderGraph = f;
		for (let [e, t] of p) e.enabled = t;
		for (let [e, t] of m) e.visible = t;
		n.delete(r);
	}
}
//#endregion
exports.encodePlanarReflection = encodePlanarReflection;

//# sourceMappingURL=planar-reflection-capture.cjs.map