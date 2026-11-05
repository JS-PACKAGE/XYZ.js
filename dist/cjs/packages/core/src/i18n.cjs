const require_logger = require("./logger.cjs");
const require_errors = require("./errors.cjs");
//#region dist/packages/core/src/i18n.js
var I18nError = class extends require_errors.RuntimeError {
	constructor(e, t) {
		super(e, t), this.name = `I18nError`;
	}
};
var n = [
	`zero`,
	`one`,
	`two`,
	`few`,
	`many`,
	`other`
];
function canonical(e) {
	try {
		let [t] = Intl.getCanonicalLocales(e);
		if (t) return t;
	} catch (t) {
		throw new I18nError(`Invalid locale tag "${e}".`, { cause: t });
	}
	throw new I18nError(`Invalid locale tag "${e}".`);
}
function lineage(e) {
	let t = e.split(`-`), n = [];
	for (let e = t.length; e > 0; e--) n.push(t.slice(0, e).join(`-`));
	return n;
}
function pluralForms(e) {
	let t = Object.entries(e), r = Object.fromEntries(t).other;
	if (typeof r == `string` && t.every(([e, t]) => n.includes(e) && typeof t == `string`)) return Object.freeze({
		...Object.fromEntries(t),
		other: r
	});
}
function flatten(e, t, n) {
	for (let r of Object.keys(e)) {
		if (r === `` || r.includes(`.`)) throw new I18nError(`Invalid message key segment "${r}".`);
		let i = e[r], a = n ? `${n}.${r}` : r;
		if (typeof i == `string`) t.set(a, i);
		else if (typeof i == `object` && i) {
			let e = pluralForms(i);
			e ? t.set(a, e) : flatten(i, t, a);
		} else throw new I18nError(`Message "${a}" must be a string or a table.`);
	}
}
var I18n = class extends EventTarget {
	tables = /* @__PURE__ */ new Map();
	fallbacks;
	lookupOrder;
	missing;
	bindings = /* @__PURE__ */ new Set();
	pluralRules = /* @__PURE__ */ new Map();
	numberFormat;
	current;
	constructor(e = {}) {
		super(), this.current = canonical(e.locale ?? `en`);
		let t = e.fallback ?? [];
		this.fallbacks = (typeof t == `string` ? [t] : t).map(canonical).flatMap(lineage), this.lookupOrder = [...lineage(this.current), ...this.fallbacks], this.missing = e.missing ?? `key`;
		for (let [t, n] of Object.entries(e.messages ?? {})) this.addMessages(t, n);
	}
	get locale() {
		return this.current;
	}
	addMessages(e, t) {
		let n = canonical(e), r = /* @__PURE__ */ new Map();
		flatten(t, r, ``);
		let i = this.tables.get(n) ?? /* @__PURE__ */ new Map();
		for (let [e, t] of r) i.set(e, t);
		this.tables.set(n, i);
	}
	hasLocale(e) {
		return this.tables.has(canonical(e));
	}
	get locales() {
		return [...this.tables.keys()];
	}
	setLocale(e) {
		let t = canonical(e);
		if (t === this.current) return;
		let n = this.current;
		this.current = t, this.lookupOrder = [...lineage(t), ...this.fallbacks], this.numberFormat = void 0, this.dispatchEvent(new CustomEvent(`localechange`, { detail: {
			locale: t,
			previous: n
		} }));
		for (let e of [...this.bindings]) e();
	}
	has(e) {
		return this.lookup(e) !== void 0;
	}
	t(e, t) {
		let n = this.lookup(e);
		if (!n) {
			if (this.missing === `error`) throw new I18nError(`Missing message "${e}" for "${this.current}".`);
			return typeof this.missing == `function` ? this.missing(e, this.current) : e;
		}
		let r;
		if (typeof n.message == `string`) r = n.message;
		else {
			let i = t?.count;
			if (typeof i != `number` || !Number.isFinite(i)) throw new I18nError(`Plural message "${e}" requires a finite numeric "count" parameter.`);
			let a = this.pluralRules.get(n.locale);
			a || (a = new Intl.PluralRules(n.locale), this.pluralRules.set(n.locale, a));
			let o = a.select(i);
			r = n.message[o] ?? n.message.other;
		}
		return this.interpolate(e, r, t);
	}
	formatNumber(e, t) {
		return t === void 0 ? (this.numberFormat ??= new Intl.NumberFormat(this.current), this.numberFormat.format(e)) : new Intl.NumberFormat(this.current, t).format(e);
	}
	formatDate(e, t) {
		return new Intl.DateTimeFormat(this.current, t).format(e);
	}
	bindText(t, n, r) {
		let i = !0, a = Promise.resolve(), o = {
			refresh: () => i ? t.destroyed ? (o.unbind(), a) : (a = t.setText(this.t(n, typeof r == `function` ? r() : r)).catch((n) => {
				t.destroyed || require_logger.logger.error(`I18n text update failed.`, n);
			}), a) : a,
			unbind: () => {
				i = !1, this.bindings.delete(update);
			}
		}, update = () => void o.refresh();
		return this.bindings.add(update), o.refresh(), o;
	}
	destroy() {
		this.bindings.clear();
	}
	lookup(e) {
		for (let t of this.lookupOrder) {
			let n = this.tables.get(t)?.get(e);
			if (n !== void 0) return {
				message: n,
				locale: t
			};
		}
	}
	interpolate(e, t, n) {
		return t.replace(/\{\{|\}\}|\{([^{}]+)\}/g, (t, r) => {
			if (t === `{{`) return `{`;
			if (t === `}}`) return `}`;
			let i = n?.[r];
			if (i === void 0) throw new I18nError(`Message "${e}" needs parameter "${r}".`);
			return typeof i == `number` ? this.formatNumber(i) : String(i);
		});
	}
};
//#endregion
exports.I18n = I18n;
exports.I18nError = I18nError;

//# sourceMappingURL=i18n.cjs.map