const require_tiling_sprite2d = require("../../core/src/graphics2d/tiling-sprite2d.cjs");
//#region dist/packages/graphics/src/sprite-instance.js
function createTextureQuad2D() {
	return {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		naturalWidth: 0,
		naturalHeight: 0,
		u0: 0,
		v0: 0,
		ux: 0,
		vx: 0,
		uy: 0,
		vy: 0,
		trimX: 0,
		trimY: 0,
		trimWidth: 0,
		trimHeight: 0,
		resolution: 1
	};
}
function validateTextureQuad2D(e, t, n) {
	if (e.destroyed) throw Error(`Cannot draw a destroyed texture source.`);
	if (t && t.source !== e) throw RangeError(`Texture quad view must match its source.`);
	if (t?.validate(), !n) return;
	let r = t?.frame ?? n, i = r?.x ?? 0, a = r?.y ?? 0, o = r?.width ?? e.width, s = r?.height ?? e.height;
	if (!Number.isFinite(i + a + o + s) || i < 0 || a < 0 || o <= 0 || s <= 0 || i + o > e.width || a + s > e.height) throw RangeError(`Texture quad source must fit the current source dimensions.`);
}
function getTextureQuad2D(e, t, n, r) {
	validateTextureQuad2D(e, t, n);
	let i = t?.frame ?? n, a = i?.x ?? 0, o = i?.y ?? 0, s = i?.width ?? e.width, c = i?.height ?? e.height, l = t?.resolution ?? (!n && e.kind === `render` ? e.resolution : 1);
	return r.resolution = l, r.naturalWidth = t?.width ?? (!n && e.kind === `render` ? e.logicalWidth : s), r.naturalHeight = t?.height ?? (!n && e.kind === `render` ? e.logicalHeight : c), r.trimX = (t?.trim.x ?? 0) / l, r.trimY = (t?.trim.y ?? 0) / l, r.trimWidth = t ? t.trim.width / l : r.naturalWidth, r.trimHeight = t ? t.trim.height / l : r.naturalHeight, r.x = r.trimX, r.y = r.trimY, r.width = r.trimWidth, r.height = r.trimHeight, t?.rotation === 90 ? (r.u0 = (a + s) / e.width, r.v0 = o / e.height, r.ux = 0, r.vx = c / e.height, r.uy = -s / e.width, r.vy = 0) : (r.u0 = a / e.width, r.v0 = o / e.height, r.ux = s / e.width, r.vx = 0, r.uy = 0, r.vy = c / e.height), r;
}
var t = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
};
function validateSpriteQuad2D(n) {
	validateTextureQuad2D(n.texture, n.view, n.source), n.getLocalBounds(t), n instanceof require_tiling_sprite2d.TilingSprite2D && n.validateTileTransform();
}
function getSpriteQuad2D(n, r) {
	getTextureQuad2D(n.texture, n.view, n.source, r);
	let i = n.getLocalBounds(t);
	if (n instanceof require_tiling_sprite2d.TilingSprite2D) n.validateTileTransform(), r.x = i.x, r.y = i.y, r.width = n.width, r.height = n.height;
	else {
		let e = n.width / r.naturalWidth, t = n.height / r.naturalHeight;
		r.x = i.x + r.trimX * e, r.y = i.y + r.trimY * t, r.width *= e, r.height *= t;
	}
	return r;
}
function getRelativeAppearance2D(e, t, n) {
	n[0] = n[1] = n[2] = n[3] = 1;
	for (let r = e; r && r !== t; r = r.parent) {
		let e = r.tint;
		n[0] *= e[0], n[1] *= e[1], n[2] *= e[2], n[3] *= e[3] * r.opacity;
	}
}
var QUAD_BYTES = 36 * Float32Array.BYTES_PER_ELEMENT;
//#endregion
exports.QUAD_BYTES = QUAD_BYTES;
exports.createTextureQuad2D = createTextureQuad2D;
exports.getRelativeAppearance2D = getRelativeAppearance2D;
exports.getSpriteQuad2D = getSpriteQuad2D;
exports.getTextureQuad2D = getTextureQuad2D;
exports.validateSpriteQuad2D = validateSpriteQuad2D;
exports.validateTextureQuad2D = validateTextureQuad2D;

//# sourceMappingURL=sprite-instance.cjs.map