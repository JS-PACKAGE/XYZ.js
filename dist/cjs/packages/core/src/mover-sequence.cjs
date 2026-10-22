//#region dist/packages/core/src/mover-sequence.js
var e = 0;
var t = 0;
function runMoverSequence(n) {
	if (e) return n();
	e = ++t;
	try {
		return n();
	} finally {
		e = 0;
	}
}
function activeMoverSequence() {
	return e;
}
//#endregion
exports.activeMoverSequence = activeMoverSequence;
exports.runMoverSequence = runMoverSequence;

//# sourceMappingURL=mover-sequence.cjs.map