const require_texture = require("../../assets/src/texture.cjs");
const require_texture2d = require("../../assets/src/texture2d.cjs");
const require_texture_sampler = require("./texture-sampler.cjs");
//#region dist/packages/core/src/optical-material-maps.js
function materialTextureCoordinates(e) {
	return e.textureCoordinates;
}
var r = /* @__PURE__ */ new WeakMap();
var i = Object.freeze({
	iridescenceThicknessMinimum: 100,
	iridescenceThicknessMaximum: 400
});
function opticalMaterialMaps(e) {
	return r.get(e) ?? i;
}
function hasOpticalMaterialMaps(e) {
	return r.has(e);
}
function registerOpticalMaterialMaps(i, a) {
	if (a === void 0) return;
	if (!a || typeof a != `object` || Array.isArray(a)) throw TypeError(`Optical maps must be an object.`);
	let o = {
		anisotropyTexture: !0,
		anisotropySampler: !0,
		iridescenceTexture: !0,
		iridescenceSampler: !0,
		iridescenceThicknessTexture: !0,
		iridescenceThicknessSampler: !0,
		iridescenceThicknessMinimum: !0,
		iridescenceThicknessMaximum: !0
	};
	for (let e of Object.keys(a)) if (!Object.hasOwn(o, e)) throw TypeError(`Unknown optical map option ${e}.`);
	for (let n of [
		`anisotropyTexture`,
		`iridescenceTexture`,
		`iridescenceThicknessTexture`
	]) {
		let r = a[n];
		if (r !== void 0 && !(r instanceof require_texture.Texture) && !(r instanceof require_texture2d.CanvasTexture2D)) throw TypeError(`${n} must be a Texture or CanvasTexture2D.`);
	}
	let s = a.iridescenceThicknessMinimum ?? 100, c = a.iridescenceThicknessMaximum ?? 400;
	if (!Number.isFinite(s) || s < 0 || !Number.isFinite(c) || c < s) throw RangeError(`Iridescence thickness bounds must be finite, non-negative, and ordered.`);
	r.set(i, Object.freeze({
		anisotropyTexture: a.anisotropyTexture,
		anisotropySampler: require_texture_sampler.samplerOptions(a.anisotropySampler),
		iridescenceTexture: a.iridescenceTexture,
		iridescenceSampler: require_texture_sampler.samplerOptions(a.iridescenceSampler),
		iridescenceThicknessTexture: a.iridescenceThicknessTexture,
		iridescenceThicknessSampler: require_texture_sampler.samplerOptions(a.iridescenceThicknessSampler),
		iridescenceThicknessMinimum: s,
		iridescenceThicknessMaximum: c
	}));
}
//#endregion
exports.hasOpticalMaterialMaps = hasOpticalMaterialMaps;
exports.materialTextureCoordinates = materialTextureCoordinates;
exports.opticalMaterialMaps = opticalMaterialMaps;
exports.registerOpticalMaterialMaps = registerOpticalMaterialMaps;

//# sourceMappingURL=optical-material-maps.cjs.map