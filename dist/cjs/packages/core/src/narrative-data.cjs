const require_storage = require("./storage.cjs");
//#region dist/packages/core/src/narrative-data.js
function conditionMatches(e, t) {
	return e ? `variable` in e ? Object.hasOwn(t, e.variable) && t[e.variable] === e.equals : `all` in e ? e.all.every((e) => conditionMatches(e, t)) : `any` in e ? e.any.some((e) => conditionMatches(e, t)) : !conditionMatches(e.not, t) : !0;
}
function narrativeText(e, t, n) {
	if (typeof e == `string`) return e;
	if (!n) throw Error(`Localized narrative text requires I18n.`);
	let r = Object.create(null);
	for (let [e, n] of Object.entries(t)) n !== null && (r[e] = n);
	return n.t(e.key, r);
}
function validateVariables(e) {
	if (!e || typeof e != `object` || Array.isArray(e)) throw TypeError(`Invalid narrative variables.`);
	for (let t of Object.values(e)) if (t !== null && typeof t != `string` && typeof t != `boolean` && !(typeof t == `number` && Number.isFinite(t))) throw TypeError(`Invalid narrative variable.`);
}
function immutableData(t) {
	require_storage.assertJsonValue(t);
	let n = structuredClone(t), freeze = (e) => {
		if (e && typeof e == `object`) {
			for (let t of Object.values(e)) freeze(t);
			Object.freeze(e);
		}
	};
	return freeze(n), n;
}
function validateCondition(e) {
	if (e) {
		if (`variable` in e) {
			if (!e.variable) throw TypeError(`Condition needs a variable.`);
			validateVariables({ value: e.equals });
		} else if (`all` in e || `any` in e) {
			let t = `all` in e ? e.all : e.any;
			if (!Array.isArray(t)) throw TypeError(`Invalid condition list.`);
			for (let e of t) validateCondition(e);
		} else if (`not` in e) validateCondition(e.not);
		else throw TypeError(`Invalid condition.`);
	}
}
function validateGraph(e, t, n = !1) {
	let r = new Set(e);
	if (r.size !== e.length || e.some((e) => !e)) throw Error(`Graph IDs must be unique and nonempty.`);
	let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), visit = (e) => {
		if (!r.has(e)) throw Error(`Unknown graph reference: ${e}`);
		if (i.has(e)) {
			if (!n) throw Error(`Graph cycle at ${e}`);
			return;
		}
		if (!a.has(e)) {
			i.add(e);
			for (let n of t(e)) visit(n);
			i.delete(e), a.add(e);
		}
	};
	for (let t of e) visit(t);
}
//#endregion
exports.conditionMatches = conditionMatches;
exports.immutableData = immutableData;
exports.narrativeText = narrativeText;
exports.validateCondition = validateCondition;
exports.validateGraph = validateGraph;
exports.validateVariables = validateVariables;

//# sourceMappingURL=narrative-data.cjs.map