const require_errors = require("../../graphics/src/errors.cjs");
const require_assets = require("../../../src/data/assets.cjs");
//#region dist/packages/assets/src/texture.js
var AssetError = class extends require_errors.XYZError {};
var Texture = class Texture {
	kind;
	version = 0;
	width;
	height;
	disposed = !1;
	bitmap;
	constructor(e) {
		let n = `kind` in e && e.kind === `native`;
		if (!Number.isFinite(e.width) || !Number.isFinite(e.height) || e.width <= 0 || e.height <= 0) throw new AssetError(`A texture must have positive, finite dimensions.`);
		if (e.width > require_assets.assetLimits.textureDimension || e.height > require_assets.assetLimits.textureDimension || !n && e.width * e.height > require_assets.assetLimits.texturePixels) throw new AssetError(`Texture exceeds the decoded image resource budget.`);
		this.width = e.width, this.height = e.height, this.kind = n ? `native` : `image`, this.bitmap = n ? void 0 : e;
	}
	get image() {
		if (!this.bitmap) throw new AssetError(`Native textures have no decoded image.`);
		return this.bitmap;
	}
	static async fromImage(e) {
		let t;
		try {
			t = await createImageBitmap(e, { premultiplyAlpha: `none` });
		} catch (e) {
			throw new AssetError(`Unable to decode texture image.`, { cause: e });
		}
		try {
			return new Texture(t);
		} catch (e) {
			throw t.close(), e;
		}
	}
	get destroyed() {
		return this.disposed;
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.bitmap?.close());
	}
};
//#endregion
exports.AssetError = AssetError;
exports.Texture = Texture;

//# sourceMappingURL=texture.cjs.map