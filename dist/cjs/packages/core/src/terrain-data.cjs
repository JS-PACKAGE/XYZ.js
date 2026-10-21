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
function terrainChannels(e, t, n, r, i, a) {
	t = i ? t - Math.floor(t) : Math.max(0, Math.min(1, t)), n = i ? n - Math.floor(n) : Math.max(0, Math.min(1, n));
	let o = t * (e.width - 1), s = n * (e.height - 1), c = Math.floor(o), l = Math.floor(s), u = Math.min(c + 1, e.width - 1), d = Math.min(l + 1, e.height - 1), f = e.data, p = (l * e.width + c) * 4, m = (l * e.width + u) * 4, h = (d * e.width + c) * 4, g = (d * e.width + u) * 4;
	for (let e = 0; e < r; e++) {
		let t = f[p + e] / 255, n = f[m + e] / 255, r = f[h + e] / 255, i = f[g + e] / 255;
		a[e] = (t * (1 - (o - c)) + n * (o - c)) * (1 - (s - l)) + (r * (1 - (o - c)) + i * (o - c)) * (s - l);
	}
}
//#endregion
exports.terrainChannels = terrainChannels;
exports.terrainImageData = terrainImageData;

//# sourceMappingURL=terrain-data.cjs.map