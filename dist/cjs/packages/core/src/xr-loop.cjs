//#region dist/packages/core/src/xr-loop.js
var xrLoops = /* @__PURE__ */ new WeakMap();
function requestGameFrame(e, t) {
	let n = xrLoops.get(e);
	if (n) {
		n.tick = t;
		return;
	}
	return requestAnimationFrame(t);
}
//#endregion
exports.requestGameFrame = requestGameFrame;
exports.xrLoops = xrLoops;

//# sourceMappingURL=xr-loop.cjs.map