const require_tile_map = require("./tile-map.cjs");
//#region dist/packages/core/src/maps2d/isometric-map.js
var IsometricMap = class extends require_tile_map.TileMap {
	constructor(e) {
		let t = e.elevationStep ?? e.tileHeight / 2;
		if (!Number.isFinite(t) || t < 0) throw RangeError(`elevationStep must be finite and nonnegative.`);
		super(e), this.isometric = !0, this.elevationStep = t;
	}
};
//#endregion
exports.IsometricMap = IsometricMap;

//# sourceMappingURL=isometric-map.cjs.map