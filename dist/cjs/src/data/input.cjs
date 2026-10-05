//#region dist/src/data/input.js
var inputLimits = {
	maxPointerSamples: 256,
	maxActivePointers: 32
};
var gestureDefaults = {
	tapSlop: 10,
	tapMaxMs: 300,
	doubleTapMs: 300,
	doubleTapSlop: 30,
	longPressMs: 500,
	swipeMaxMs: 500,
	swipeMinDistance: 40,
	swipeMinVelocity: 300,
	panThreshold: 8,
	pinchThreshold: .05,
	rotateThreshold: .1
};
//#endregion
exports.gestureDefaults = gestureDefaults;
exports.inputLimits = inputLimits;

//# sourceMappingURL=input.cjs.map