//#region dist/packages/core/src/render-bounds.js
function transformSphere(e, t, n) {
	return transformSphereElements(e, t.elements, 0, n);
}
function transformSphereElements(e, t, n, r) {
	let i = n, a = e.x, o = e.y, s = e.z, c = e.radius;
	return r.x = t[i] * a + t[i + 4] * o + t[i + 8] * s + t[i + 12], r.y = t[i + 1] * a + t[i + 5] * o + t[i + 9] * s + t[i + 13], r.z = t[i + 2] * a + t[i + 6] * o + t[i + 10] * s + t[i + 14], r.radius = c * sphereLinearScale(t, i), r;
}
function sphereLinearScale(e, t) {
	let n = Math.max(Math.abs(e[t]) + Math.abs(e[t + 1]) + Math.abs(e[t + 2]), Math.abs(e[t + 4]) + Math.abs(e[t + 5]) + Math.abs(e[t + 6]), Math.abs(e[t + 8]) + Math.abs(e[t + 9]) + Math.abs(e[t + 10])), r = Math.max(Math.abs(e[t]) + Math.abs(e[t + 4]) + Math.abs(e[t + 8]), Math.abs(e[t + 1]) + Math.abs(e[t + 5]) + Math.abs(e[t + 9]), Math.abs(e[t + 2]) + Math.abs(e[t + 6]) + Math.abs(e[t + 10]));
	return Math.sqrt(n * r);
}
function sphereIsFinite(e) {
	return Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.z) && Number.isFinite(e.radius) && e.radius >= 0;
}
//#endregion
exports.sphereIsFinite = sphereIsFinite;
exports.sphereLinearScale = sphereLinearScale;
exports.transformSphere = transformSphere;
exports.transformSphereElements = transformSphereElements;

//# sourceMappingURL=render-bounds.cjs.map