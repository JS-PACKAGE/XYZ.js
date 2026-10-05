const require_group2d = require("./group2d.cjs");
//#region dist/packages/core/src/gameplay/screen-element.js
var ScreenElement = class extends require_group2d.Group2D {
	constructor() {
		super(), this.space = `screen`;
	}
};
//#endregion
exports.ScreenElement = ScreenElement;

//# sourceMappingURL=screen-element.cjs.map