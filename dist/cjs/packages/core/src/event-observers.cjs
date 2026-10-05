//#region dist/packages/core/src/event-observers.js
var e = /* @__PURE__ */ new WeakMap();
function observeObjectEventTypes(t, n) {
	e.set(t, n);
}
function hasObjectEventObservers(t, n) {
	return e.get(t)?.has(n) ?? !1;
}
//#endregion
exports.hasObjectEventObservers = hasObjectEventObservers;
exports.observeObjectEventTypes = observeObjectEventTypes;

//# sourceMappingURL=event-observers.cjs.map