//#region dist/packages/core/src/gameplay/contracts.js
function compareObjects2D(e, t) {
	let n = e.worldSpace === `screen`;
	return n === (t.worldSpace === `screen`) ? e.worldZIndex - t.worldZIndex : n ? 1 : -1;
}
function assertFinite(e, t) {
	if (!Number.isFinite(e)) throw RangeError(`${t} must be finite.`);
}
function validateSource(e, t, n) {
	if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.width) || !Number.isFinite(e.height) || e.x < 0 || e.y < 0 || e.width <= 0 || e.height <= 0 || e.x + e.width > t || e.y + e.height > n) throw RangeError(`Sprite source must be a positive finite rectangle within its Texture.`);
}
//#endregion
exports.assertFinite = assertFinite;
exports.compareObjects2D = compareObjects2D;
exports.validateSource = validateSource;

//# sourceMappingURL=contracts.cjs.map