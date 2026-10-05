const require_texture = require("../../../assets/src/texture.cjs");
const require_sprite = require("../sprite.cjs");
const require_graphics2d = require("../../../../src/data/graphics2d.cjs");
//#region dist/packages/core/src/graphics2d/sprite-sheet.js
function validatedRegion(t, n) {
	if (t.destroyed) throw new require_texture.AssetError(`Cannot use a destroyed Texture.`);
	if (![
		n.x,
		n.y,
		n.width,
		n.height
	].every(Number.isInteger) || n.x < 0 || n.y < 0 || n.width <= 0 || n.height <= 0 || n.x + n.width > t.width || n.y + n.height > t.height) throw RangeError(`Source region must be positive integer pixels within the Texture.`);
	return Object.freeze({
		x: n.x,
		y: n.y,
		width: n.width,
		height: n.height
	});
}
var SpriteSheet = class SpriteSheet {
	texture;
	frames;
	constructor(n, r) {
		if (this.texture = n, n.destroyed) throw new require_texture.AssetError(`Cannot use a destroyed Texture.`);
		if (!r.length || r.length > require_graphics2d.graphics2dLimits.frames) throw RangeError(`SpriteSheet frame count exceeds its budget.`);
		this.frames = Object.freeze(r.map((e) => validatedRegion(n, e)));
	}
	static grid(e, n) {
		let { frameWidth: r, frameHeight: i } = n, [a, o] = n.origin ?? [0, 0], [s, c] = n.spacing ?? [0, 0];
		if (![
			r,
			i,
			a,
			o,
			s,
			c
		].every(Number.isInteger) || r <= 0 || i <= 0 || a < 0 || o < 0 || s < 0 || c < 0) throw RangeError(`Grid dimensions, origin and spacing must be integer pixels.`);
		let l = n.columns ?? Math.floor((e.width - a + s) / (r + s)), u = n.rows ?? Math.floor((e.height - o + c) / (i + c));
		if (!Number.isInteger(l) || !Number.isInteger(u) || l <= 0 || u <= 0 || l * u > require_graphics2d.graphics2dLimits.frames || a + l * (r + s) - s > e.width || o + u * (i + c) - c > e.height) throw RangeError(`Grid exceeds the Texture or frame budget.`);
		let d = [];
		for (let e = 0; e < u; e++) for (let t = 0; t < l; t++) d.push({
			x: a + t * (r + s),
			y: o + e * (i + c),
			width: r,
			height: i
		});
		return new SpriteSheet(e, d);
	}
	getFrame(e) {
		if (!Number.isInteger(e) || e < 0 || e >= this.frames.length) throw RangeError(`SpriteSheet frame index is out of range.`);
		return this.frames[e];
	}
	createSprite(e, t = {}) {
		return new require_sprite.Sprite({
			...t,
			texture: this.texture,
			source: this.getFrame(e)
		});
	}
};
//#endregion
exports.SpriteSheet = SpriteSheet;
exports.validatedRegion = validatedRegion;

//# sourceMappingURL=sprite-sheet.cjs.map