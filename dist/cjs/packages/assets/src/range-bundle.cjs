const require_texture = require("./texture.cjs");
const require_read_response = require("./read-response.cjs");
const require_asset_recipe = require("../../../src/data/asset-recipe.cjs");
const require_asset_bundle = require("./asset-bundle.cjs");
//#region dist/packages/assets/src/range-bundle.js
function parseAssetBundleArchive(t, r) {
	if (!t || typeof t != `object`) throw new require_texture.AssetError(`Missing bundle archive manifest.`);
	let i = t;
	if (typeof i.path != `string` || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(i.path) || !Number.isSafeInteger(i.bytes) || i.bytes < 1 || i.bytes > require_asset_recipe.assetRecipe.outputBytes || !Array.isArray(i.members) || i.members.length !== r.files.length) throw new require_texture.AssetError(`Invalid bundle archive manifest.`);
	let a = new Map(r.files.map((e) => [e.path, e.bytes])), o = /* @__PURE__ */ new Set(), s = i.members.map((t) => {
		if (!t || typeof t != `object`) throw new require_texture.AssetError(`Invalid archive member.`);
		let n = t;
		if (typeof n.path != `string` || o.has(n.path) || !a.has(n.path) || n.bytes !== a.get(n.path) || !Number.isSafeInteger(n.offset) || n.offset < 0 || n.offset + n.bytes > i.bytes) throw new require_texture.AssetError(`Invalid archive member offset/size.`);
		return o.add(n.path), Object.freeze({
			path: n.path,
			offset: n.offset,
			bytes: n.bytes
		});
	}), c = [...s].sort((e, t) => e.offset - t.offset);
	for (let t = 1; t < c.length; t++) if (c[t].offset < c[t - 1].offset + c[t - 1].bytes) throw new require_texture.AssetError(`Overlapping archive members.`);
	return Object.freeze({
		path: i.path,
		bytes: i.bytes,
		members: Object.freeze(s)
	});
}
var AssetBundleRangeReader = class {
	url;
	archive;
	signal;
	controller = new AbortController();
	full;
	members;
	abort;
	destroyed = !1;
	constructor(e, t, n) {
		this.url = e, this.archive = t, this.signal = n, this.members = new Map(t.members.map((e) => [e.path, e])), this.abort = () => this.controller.abort(n?.reason), n?.addEventListener(`abort`, this.abort, { once: !0 }), n?.aborted && this.abort();
	}
	async read(n) {
		if (this.destroyed) throw new require_texture.AssetError(`Bundle range reader is destroyed.`);
		let r = this.controller.signal;
		r.throwIfAborted();
		let i = this.members.get(n);
		if (!i) throw new require_texture.AssetError(`Untracked archive member.`);
		if (!i.bytes) return /* @__PURE__ */ new ArrayBuffer(0);
		if (this.full) return (await this.full).slice(i.offset, i.offset + i.bytes);
		let a = await fetch(this.url, {
			signal: r,
			headers: { Range: `bytes=${i.offset}-${i.offset + i.bytes - 1}` }
		});
		if (a.status === 206) {
			if (a.headers.get(`Content-Range`) !== `bytes ${i.offset}-${i.offset + i.bytes - 1}/${this.archive.bytes}`) throw await a.body?.cancel(), new require_texture.AssetError(`Invalid archive Content-Range.`);
			let n = await (await require_read_response.readResponse(a, i.bytes, r)).arrayBuffer();
			if (n.byteLength !== i.bytes) throw new require_texture.AssetError(`Truncated archive range.`);
			return n;
		}
		if (a.status === 200) {
			this.full ? await a.body?.cancel() : this.full = this.readFull(a);
			let e = await this.full;
			return r.throwIfAborted(), e.slice(i.offset, i.offset + i.bytes);
		}
		if (await a.body?.cancel(), a.status === 405 || a.status === 416 || a.status === 501) return this.full ??= fetch(this.url, { signal: r }).then((e) => this.readFull(e)), (await this.full).slice(i.offset, i.offset + i.bytes);
		throw new require_texture.AssetError(`Archive range request failed (HTTP ${a.status}).`);
	}
	async readFull(n) {
		if (n.status !== 200) throw await n.body?.cancel(), new require_texture.AssetError(`Archive full request failed (HTTP ${n.status}).`);
		let r = await (await require_read_response.readResponse(n, this.archive.bytes, this.controller.signal)).arrayBuffer();
		if (r.byteLength !== this.archive.bytes) throw new require_texture.AssetError(`Truncated full archive.`);
		return r;
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, this.signal?.removeEventListener(`abort`, this.abort), this.controller.abort(), this.full = void 0);
	}
};
var rangeBundleConfigurations = /* @__PURE__ */ new WeakSet();
function loadAssetBundleRange(e, t) {
	let n = { ...t };
	return rangeBundleConfigurations.add(n), require_asset_bundle.loadAssetBundle(e, n);
}
//#endregion
exports.AssetBundleRangeReader = AssetBundleRangeReader;
exports.loadAssetBundleRange = loadAssetBundleRange;
exports.parseAssetBundleArchive = parseAssetBundleArchive;
exports.rangeBundleConfigurations = rangeBundleConfigurations;

//# sourceMappingURL=range-bundle.cjs.map