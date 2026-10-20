//#region dist/packages/core/src/event-observers.js
var e = /* @__PURE__ */ new WeakMap();
var t = /* @__PURE__ */ new Set();
function observeObjectEventTypes(t, n) {
	e.set(t, n);
}
function observeEventType(e) {
	t.add(e);
}
function hasObjectEventObservers(n, r) {
	return t.has(r) && (e.get(n)?.has(r) ?? !1);
}
//#endregion
exports.hasObjectEventObservers = hasObjectEventObservers;
exports.observeEventType = observeEventType;
exports.observeObjectEventTypes = observeObjectEventTypes;

//# sourceMappingURL=event-observers.cjs.map