const require_texture = require("../texture.cjs");
const require_subscribe_load = require("../preload/subscribe-load.cjs");
const require_rendering2d = require("../../../../src/data/rendering2d.cjs");
//#region dist/packages/assets/src/fonts/font-asset.js
var FontAsset = class FontAsset {
	family;
	ready;
	controller = new AbortController();
	face;
	disposed = !1;
	constructor(n, r, i) {
		if (typeof i.family != `string` || !i.family.trim() || /[\r\n"\\]/u.test(i.family)) throw RangeError(`A plain nonempty font family is required.`);
		let a = i.maxBytes ?? require_rendering2d.rendering2dLimits.fontBytes;
		if (!Number.isSafeInteger(a) || a <= 0 || a > require_rendering2d.rendering2dLimits.fontBytes) throw RangeError(`Font exceeds its byte budget.`);
		this.family = i.family;
		let o = Object.freeze({ ...i.descriptors }), abort = () => this.controller.abort(i.signal?.reason);
		i.signal?.addEventListener(`abort`, abort, { once: !0 }), i.signal?.aborted && abort(), this.ready = this.acquire(n, r, a, o).catch((e) => {
			throw this.face && typeof document < `u` && document.fonts.delete(this.face), this.face = void 0, this.controller.signal.aborted ? this.controller.signal.reason : e instanceof require_texture.AssetError ? e : new require_texture.AssetError(`Unable to load browser font.`, { cause: e });
		}).finally(() => i.signal?.removeEventListener(`abort`, abort));
	}
	static async load(e, t, n) {
		let r = new FontAsset(e, t, n);
		try {
			return await r.ready, r;
		} catch (e) {
			throw r.destroy(), e;
		}
	}
	get destroyed() {
		return this.disposed;
	}
	async acquire(e, r, i, a) {
		let o = this.controller.signal;
		if (o.throwIfAborted(), typeof FontFace > `u` || typeof document > `u` || !document.fonts) throw new require_texture.AssetError(`Browser FontFace registration is required.`);
		let s = await e.loadBinary(r, {
			signal: o,
			maxBytes: i
		});
		o.throwIfAborted();
		let c = new FontFace(this.family, s, a);
		this.face = c, await require_subscribe_load.subscribeLoad(c.load(), o), o.throwIfAborted(), document.fonts.add(c);
		try {
			let e = a.weight ?? `normal`, r = a.style ?? `normal`;
			if (await require_subscribe_load.subscribeLoad(document.fonts.load(`${r} ${e} 16px "${this.family}"`), o), o.throwIfAborted(), c.status !== `loaded` || !document.fonts.has(c)) throw new require_texture.AssetError(`Font registration did not become ready.`);
		} catch (e) {
			throw document.fonts.delete(c), e;
		}
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.controller.abort(new require_texture.AssetError(`FontAsset was destroyed.`)), this.face && typeof document < `u` && document.fonts.delete(this.face), this.face = void 0);
	}
};
//#endregion
exports.FontAsset = FontAsset;

//# sourceMappingURL=font-asset.cjs.map