//#region dist/packages/graphics/src/optical-maps.js
function fillOpticalMapSettings(e, t, n, r, i = 16) {
	e[t] = n?.width ?? 0, e[t + 1] = n?.height ?? 0;
	let a = r?.addressModeU === `repeat` ? 1 : r?.addressModeU === `mirror-repeat` ? 2 : 0, o = r?.addressModeV === `repeat` ? 1 : r?.addressModeV === `mirror-repeat` ? 2 : 0;
	e[t + 2] = a + o * 3, e[t + 3] = (r?.minFilter === `nearest` ? 0 : 1) + (r?.magFilter === `nearest` ? 0 : 2) + 4 * (Math.min(r?.maxAnisotropy ?? 1, i) - 1);
}
//#endregion
exports.fillOpticalMapSettings = fillOpticalMapSettings;

//# sourceMappingURL=optical-maps.cjs.map