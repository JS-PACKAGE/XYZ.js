const require_texture = require("../../assets/src/texture.cjs");
const require_sprite = require("./sprite.cjs");
//#region dist/packages/core/src/primitive2d.js
var Primitive2D = class Primitive2D extends require_sprite.Sprite {
	ownedTexture;
	constructor(e) {
		super({ texture: e }), this.ownedTexture = e;
	}
	static async rectangle(t, n, r) {
		Primitive2D.validateDimension(t, `width`), Primitive2D.validateDimension(n, `height`);
		let i = document.createElement(`canvas`);
		i.width = t, i.height = n;
		let a = i.getContext(`2d`);
		if (!a) throw Error(`Canvas2D context is unavailable for rasterizing a primitive.`);
		return a.fillStyle = r, a.fillRect(0, 0, t, n), new Primitive2D(await require_texture.Texture.fromImage(i));
	}
	static async circle(t, n) {
		Primitive2D.validateDimension(t, `radius`);
		let r = t * 2;
		if (!Number.isSafeInteger(r) || r > 8192) throw RangeError(`Primitive circle diameter must be at most 8192 pixels.`);
		let i = document.createElement(`canvas`);
		i.width = r, i.height = r;
		let a = i.getContext(`2d`);
		if (!a) throw Error(`Canvas2D context is unavailable for rasterizing a primitive.`);
		return a.fillStyle = n, a.beginPath(), a.arc(t, t, t, 0, Math.PI * 2), a.fill(), new Primitive2D(await require_texture.Texture.fromImage(i));
	}
	onDestroy() {
		this.ownedTexture.destroy();
	}
	static validateDimension(e, t) {
		if (!Number.isSafeInteger(e) || e <= 0 || e > 8192) throw RangeError(`Primitive ${t} must be a positive integer of at most 8192 pixels.`);
	}
};
//#endregion
exports.Primitive2D = Primitive2D;

//# sourceMappingURL=primitive2d.cjs.map