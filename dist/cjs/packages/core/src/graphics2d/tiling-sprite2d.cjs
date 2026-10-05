const require_rendering2d = require("../../../../src/data/rendering2d.cjs");
const require_index = require("../../../math/src/index.cjs");
const require_sprite = require("../sprite.cjs");
//#region dist/packages/core/src/graphics2d/tiling-sprite2d.js
var TilingSprite2D = class extends require_sprite.Sprite {
	tilePosition = new require_index.Vector2();
	tileScale = new require_index.Vector2(1, 1);
	coverageWidth = 0;
	coverageHeight = 0;
	patternRotation = 0;
	constructor(e) {
		if (super(e), this.resize(e.width, e.height), e.tilePosition) {
			if (e.tilePosition.length !== 2) throw RangeError(`Tile position requires two coordinates.`);
			this.tilePosition.set(...e.tilePosition);
		}
		if (e.tileScale) {
			if (e.tileScale.length !== 2) throw RangeError(`Tile scale requires two components.`);
			this.tileScale.set(...e.tileScale);
		}
		this.tileRotation = e.tileRotation ?? 0, this.validateTileTransform();
	}
	get width() {
		return this.coverageWidth;
	}
	get height() {
		return this.coverageHeight;
	}
	get tileWidth() {
		return super.width;
	}
	get tileHeight() {
		return super.height;
	}
	get tileRotation() {
		return this.patternRotation;
	}
	set tileRotation(e) {
		if (!Number.isFinite(e)) throw RangeError(`Tile rotation must be finite.`);
		this.patternRotation = e;
	}
	resize(e, n) {
		if (this.destroyed) throw Error(`Cannot resize a destroyed TilingSprite2D.`);
		if (![e, n].every((e) => Number.isFinite(e) && e >= 0 && e <= require_rendering2d.rendering2dLimits.coordinate)) throw RangeError(`Tiling coverage exceeds its dimension budget.`);
		this.coverageWidth = e, this.coverageHeight = n;
	}
	validateTileTransform() {
		if (![
			this.tilePosition.x,
			this.tilePosition.y,
			this.tileScale.x,
			this.tileScale.y
		].every(Number.isFinite) || this.tileScale.x === 0 || this.tileScale.y === 0) throw RangeError(`Tile position and nonsingular scale must be finite.`);
		let e = Math.abs(this.tileWidth * this.tileScale.x), t = Math.abs(this.tileHeight * this.tileScale.y);
		if (!Number.isFinite(e) || !Number.isFinite(t) || e === 0 || t === 0 || !Number.isFinite(1 / e) || !Number.isFinite(1 / t)) throw RangeError(`Scaled tile dimensions must remain finite and nonzero.`);
	}
};
//#endregion
exports.TilingSprite2D = TilingSprite2D;

//# sourceMappingURL=tiling-sprite2d.cjs.map