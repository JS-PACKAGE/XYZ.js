const require_gamepad = require("../../../input/src/gamepad.cjs");
const require_preferences = require("./preferences.cjs");
const require_storage = require("../storage.cjs");
const require_portable_save = require("../portable-save.cjs");
//#region dist/packages/core/src/accessibility/settings.js
var SettingsManager = class {
	preferences;
	contexts;
	saves;
	defaults;
	lifetime = new AbortController();
	signal;
	slot;
	constructor(e, t, n, a = {}) {
		this.preferences = t, this.contexts = n, this.slot = a.slot ?? `settings`, this.signal = a.signal ? AbortSignal.any([a.signal, this.lifetime.signal]) : this.lifetime.signal, this.defaults = this.capture(), this.saves = new require_storage.SaveManager(e, {
			version: 2,
			migrate: (e, t) => {
				if (!t || typeof t != `object` || Array.isArray(t) || !(`accessibility` in t)) throw new require_storage.StorageError(`invalid`, `Invalid legacy settings.`);
				return {
					accessibility: t.accessibility,
					bindings: this.defaults.bindings
				};
			},
			validate: (e) => {
				try {
					return this.validate(e), !0;
				} catch {
					return !1;
				}
			}
		});
	}
	capture() {
		let e = Object.create(null);
		for (let [t, n] of Object.entries(this.contexts)) e[t] = n.exportBindings();
		return {
			accessibility: this.preferences.export(),
			bindings: e
		};
	}
	validate(r) {
		if (!r || typeof r != `object` || Array.isArray(r) || !(`accessibility` in r) || !(`bindings` in r) || Object.keys(r).some((e) => ![`accessibility`, `bindings`].includes(e))) throw new require_storage.StorageError(`invalid`, `Invalid settings object.`);
		require_preferences.validateAccessibilityOverrides(r.accessibility);
		let a = r.bindings;
		if (!a || typeof a != `object` || Array.isArray(a) || Object.keys(a).length !== Object.keys(this.contexts).length) throw new require_storage.StorageError(`invalid`, `Settings contexts do not match this game.`);
		let o = new require_gamepad.ActionMap(new require_gamepad.GamepadState());
		for (let e of Object.keys(this.contexts)) {
			if (!Object.hasOwn(a, e)) throw new require_storage.StorageError(`invalid`, `Missing settings context: ${e}.`);
			o.import(a[e]);
			let t = Object.keys(o.export()), n = Object.keys(this.defaults.bindings[e]);
			if (t.length !== n.length || n.some((e) => !t.includes(e))) throw new require_storage.StorageError(`invalid`, `Settings actions do not match context: ${e}.`);
		}
	}
	apply(e) {
		this.signal.throwIfAborted();
		for (let [t, n] of Object.entries(this.contexts)) n.importBindings(e.bindings[t]);
		this.preferences.replace(e.accessibility);
	}
	async load() {
		let e = await this.saves.load(this.slot, { signal: this.signal });
		return this.signal.throwIfAborted(), e.status === `loaded` && this.apply(e.record.data), e;
	}
	save() {
		let e = this.capture();
		return this.saves.save(this.slot, e, 0, { signal: this.signal });
	}
	async reset() {
		await this.saves.save(this.slot, this.defaults, 0, { signal: this.signal }), this.apply(this.defaults);
	}
	async importFile(e) {
		let t = await require_portable_save.readSaveFile(e, this.signal), n = await this.saves.decodeImport(t, { signal: this.signal });
		await this.saves.save(this.slot, n.data, 0, { signal: this.signal }), this.apply(n.data);
	}
	async exportFile() {
		return await this.save(), new Blob([await this.saves.export(this.slot, { signal: this.signal })], { type: `application/json` });
	}
	destroy() {
		this.lifetime.abort(new DOMException(`Settings owner is destroyed.`, `AbortError`)), this.saves.destroy();
	}
};
//#endregion
exports.SettingsManager = SettingsManager;

//# sourceMappingURL=settings.cjs.map