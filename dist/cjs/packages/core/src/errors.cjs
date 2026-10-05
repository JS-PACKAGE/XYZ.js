const require_errors = require("../../graphics/src/errors.cjs");
//#region dist/packages/core/src/errors.js
var RuntimeError = class extends require_errors.XYZError {
	constructor(e, t) {
		super(`[XYZ Runtime] ${e}`, t), this.name = `RuntimeError`;
	}
};
//#endregion
exports.RuntimeError = RuntimeError;

//# sourceMappingURL=errors.cjs.map