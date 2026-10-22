const require_texture = require("../texture.cjs");
const require_fonts = require("../../../../src/data/fonts.cjs");
//#region dist/packages/assets/src/fonts/distance-field.js
var n = /* @__PURE__ */ new WeakMap();
function getTextureDistanceField(e) {
	return n.get(e);
}
function registerTextureDistanceField(r, i) {
	if (!i || ![`sdf`, `msdf`].includes(i.type) || !Number.isFinite(i.range) || i.range < require_fonts.distanceFieldLimits.minimumRange || i.range > require_fonts.distanceFieldLimits.maximumRange) throw new require_texture.AssetError(`Invalid distance-field profile.`);
	let a = n.get(r);
	if (a && (a.type !== i.type || a.range !== i.range)) throw new require_texture.AssetError(`Conflicting distance-field texture profile.`);
	n.set(r, Object.freeze({ ...i }));
}
var r = /* @__PURE__ */ new WeakMap();
function getDistanceFieldRasterScale(e, n) {
	if (e.destroyed || !Number.isFinite(n) || n <= 0) throw RangeError(`Invalid distance-field raster request.`);
	let r = Math.min(require_fonts.distanceFieldLimits.rasterScale, require_fonts.distanceFieldLimits.rasterDimension / e.width, require_fonts.distanceFieldLimits.rasterDimension / e.height, Math.sqrt(require_fonts.distanceFieldLimits.rasterPixels / (e.width * e.height)));
	return Math.max(require_fonts.distanceFieldLimits.minimumRasterScale, 2 ** Math.floor(Math.log2(Math.min(r, 2 ** Math.ceil(Math.log2(n))))));
}
function getDistanceFieldCanvas(i, a = 1) {
	let o = n.get(i);
	if (!o || i.destroyed) throw new require_texture.AssetError(`Unavailable distance-field texture.`);
	if (!Number.isFinite(a) || a < require_fonts.distanceFieldLimits.minimumRasterScale || a > require_fonts.distanceFieldLimits.rasterScale) throw RangeError(`Invalid distance-field raster scale.`);
	let s = Math.ceil(i.width * a), c = Math.ceil(i.height * a);
	if (s > require_fonts.distanceFieldLimits.rasterDimension || c > require_fonts.distanceFieldLimits.rasterDimension || s * c > require_fonts.distanceFieldLimits.rasterPixels) throw RangeError(`Distance-field fallback raster exceeds budget.`);
	let l = r.get(i);
	if (!l) {
		let t = document.createElement(`canvas`);
		t.width = i.width, t.height = i.height;
		let n = t.getContext(`2d`, { willReadFrequently: !0 });
		if (!n) throw new require_texture.AssetError(`Canvas2D distance-field fallback unavailable.`);
		n.drawImage(i.image, 0, 0), l = {
			pixels: n.getImageData(0, 0, i.width, i.height).data,
			scales: /* @__PURE__ */ new Map()
		}, r.set(i, l);
	}
	let u = l.scales.get(a);
	if (u) return u;
	let d = document.createElement(`canvas`);
	d.width = s, d.height = c;
	let f = d.getContext(`2d`);
	if (!f) throw new require_texture.AssetError(`Canvas2D distance-field fallback unavailable.`);
	let p = f.createImageData(s, c), m = p.data, h = l.pixels, g = o.type === `msdf`, _ = new Int32Array(s), v = new Int32Array(s), y = new Float64Array(s);
	for (let e = 0; e < s; e++) {
		let t = (e + .5) / a - .5, n = Math.floor(t);
		y[e] = t - n, _[e] = Math.max(0, Math.min(i.width - 1, n)) * 4, v[e] = Math.max(0, Math.min(i.width - 1, n + 1)) * 4;
	}
	let b = i.width * 4;
	for (let e = 0; e < c; e++) {
		let t = (e + .5) / a - .5, n = Math.floor(t), r = t - n, c = 1 - r, l = Math.max(0, Math.min(i.height - 1, n)) * b, u = Math.max(0, Math.min(i.height - 1, n + 1)) * b;
		for (let t = 0, n = e * s * 4; t < s; t++, n += 4) {
			let e = y[t], i = 1 - e, s = l + _[t], d = l + v[t], f = u + _[t], p = u + v[t], b = (h[s] / 255 * i + h[d] / 255 * e) * c + (h[f] / 255 * i + h[p] / 255 * e) * r, x = b;
			if (g) {
				let t = (h[s + 1] / 255 * i + h[d + 1] / 255 * e) * c + (h[f + 1] / 255 * i + h[p + 1] / 255 * e) * r, n = (h[s + 2] / 255 * i + h[d + 2] / 255 * e) * c + (h[f + 2] / 255 * i + h[p + 2] / 255 * e) * r;
				x = Math.max(Math.min(b, t), Math.min(Math.max(b, t), n));
			}
			m[n] = m[n + 1] = m[n + 2] = 255, m[n + 3] = Math.round(Math.max(0, Math.min(1, (x - .5) * o.range * a + .5)) * 255);
		}
	}
	return f.putImageData(p, 0, 0), l.scales.size >= require_fonts.distanceFieldLimits.cachedScales && l.scales.delete(l.scales.keys().next().value), l.scales.set(a, d), d;
}
//#endregion
exports.getDistanceFieldCanvas = getDistanceFieldCanvas;
exports.getDistanceFieldRasterScale = getDistanceFieldRasterScale;
exports.getTextureDistanceField = getTextureDistanceField;
exports.registerTextureDistanceField = registerTextureDistanceField;

//# sourceMappingURL=distance-field.cjs.map