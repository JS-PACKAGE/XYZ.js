//#region dist/packages/core/src/gltf-variants.js
var e = /* @__PURE__ */ new WeakMap();
function registerGLTFVariants(t, n) {
	e.set(t, n);
}
function gltfVariants(t) {
	let n = e.get(t);
	if (!n) throw TypeError(`Object is not an asset returned by GLTFLoader.`);
	return n;
}
//#endregion
exports.gltfVariants = gltfVariants;
exports.registerGLTFVariants = registerGLTFVariants;

//# sourceMappingURL=gltf-variants.cjs.map