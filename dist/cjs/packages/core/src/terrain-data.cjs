const require_texture = require("../../assets/src/texture.cjs");
const require_terrain = require("../../../src/data/terrain.cjs");
//#region dist/packages/core/src/terrain-data.js
function terrainImageData(n) {
	if (!(n instanceof require_texture.Texture)) {
		if (!Number.isInteger(n.width) || !Number.isInteger(n.height) || n.width < 1 || n.height < 1 || n.width * n.height > require_terrain.terrainLimits.imagePixels || n.data.length !== n.width * n.height * 4) throw RangeError(`Terrain image requires bounded RGBA pixels.`);
		for (let e = 0; e < n.data.length; e++) if (!Number.isFinite(n.data[e]) || n.data[e] < 0 || n.data[e] > 255) throw RangeError(`Terrain image channels must be in [0,255].`);
		return n;
	}
	if (n.destroyed || n.kind !== `image`) throw Error(`Terrain requires a live decoded image texture.`);
	if (n.width * n.height > require_terrain.terrainLimits.imagePixels) throw RangeError(`Terrain image exceeds pixel budget.`);
	let r = typeof OffscreenCanvas < `u` ? new OffscreenCanvas(n.width, n.height) : typeof document < `u` ? document.createElement(`canvas`) : void 0;
	if (!r) throw Error(`Texture terrain sampling requires a canvas; supply RGBA image data in CPU environments.`);
	r.width = n.width, r.height = n.height;
	let i = r.getContext(`2d`);
	if (!i) throw Error(`Terrain image readback requires a 2D canvas context.`);
	return i.drawImage(n.image, 0, 0), i.getImageData(0, 0, n.width, n.height);
}
function terrainChannel(e, t, n, r, i = !1) {
	t = i ? t - Math.floor(t) : Math.max(0, Math.min(1, t)), n = i ? n - Math.floor(n) : Math.max(0, Math.min(1, n));
	let a = t * (e.width - 1), o = n * (e.height - 1), s = Math.floor(a), c = Math.floor(o), l = Math.min(s + 1, e.width - 1), u = Math.min(c + 1, e.height - 1), d = e.data[(c * e.width + s) * 4 + r] / 255, f = e.data[(c * e.width + l) * 4 + r] / 255, p = e.data[(u * e.width + s) * 4 + r] / 255, m = e.data[(u * e.width + l) * 4 + r] / 255;
	return (d * (1 - (a - s)) + f * (a - s)) * (1 - (o - c)) + (p * (1 - (a - s)) + m * (a - s)) * (o - c);
}
//#endregion
exports.terrainChannel = terrainChannel;
exports.terrainImageData = terrainImageData;

//# sourceMappingURL=terrain-data.cjs.map