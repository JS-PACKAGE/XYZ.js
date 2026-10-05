const require_assets = require("../../../src/data/assets.cjs");
const require_texture = require("./texture.cjs");
const require_native_texture = require("./native-texture.cjs");
const require_read_response = require("./read-response.cjs");
const require_gameplay_assets = require("../../../src/data/gameplay-assets.cjs");
const require_subscribe_load = require("./preload/subscribe-load.cjs");
const require_preload_batch = require("./preload/preload-batch.cjs");
const require_texture2d = require("./texture2d.cjs");
const require_font_asset = require("./fonts/font-asset.cjs");
const require_bitmap_font = require("./fonts/bitmap-font.cjs");
const require_generate_bitmap_font = require("./fonts/generate-bitmap-font.cjs");
const require_video_texture = require("./video-texture.cjs");
const require_asset_manifest = require("./manifest/asset-manifest.cjs");
const require_resource_scope = require("./resource-scope.cjs");
const require_asset_bundle = require("./asset-bundle.cjs");
const require_tiled_parser = require("./tiled-parser.cjs");
const require_tiled_loader = require("./tiled-loader.cjs");
const require_worker_jobs = require("./worker-jobs.cjs");
const require_worker_job_runtime = require("./worker-job-runtime.cjs");
//#region dist/packages/assets/src/index.js
var TextureLease = class {
	texture;
	relinquish;
	disposed = !1;
	constructor(e, t) {
		this.texture = e, this.relinquish = t;
	}
	get released() {
		return this.disposed;
	}
	release() {
		this.disposed || (this.disposed = !0, this.relinquish());
	}
};
var AssetLoader = class {
	baseURL;
	cache = /* @__PURE__ */ new Map();
	disposed = !1;
	requests = /* @__PURE__ */ new Set();
	decodedBudget;
	decodedBytes = 0;
	decodedPeak = 0;
	evictions = 0;
	clock = 0;
	constructor(e, t = {}) {
		this.baseURL = e;
		let n = t.decodedTextureBytes ?? 1 / 0;
		if (n !== 1 / 0 && (!Number.isSafeInteger(n) || n < 0)) throw RangeError(`Decoded texture budget must be a nonnegative safe integer or Infinity.`);
		this.decodedBudget = n;
	}
	get residency() {
		let e = 0, t = 0;
		for (let [n, r] of this.cache) r.texture?.destroyed ? this.removeTexture(n, r) : (e += r.references + +!!r.pinned, r.texture && t++);
		return {
			budgetBytes: this.decodedBudget,
			liveBytes: this.decodedBytes,
			peakBytes: this.decodedPeak,
			entries: t,
			borrowers: e,
			evictions: this.evictions
		};
	}
	loadTexture(e, t = {}) {
		try {
			t.signal?.throwIfAborted();
			let n = this.textureEntry(e);
			return n.pinned = !0, n.seen = ++this.clock, require_subscribe_load.subscribeLoad(n.promise, t.signal);
		} catch (e) {
			return Promise.reject(e);
		}
	}
	async acquireTexture(t, n = {}) {
		n.signal?.throwIfAborted();
		let r = this.textureEntry(t);
		r.references++, r.seen = ++this.clock;
		let i = !1, release = () => {
			i || (i = !0, r.references--, r.seen = ++this.clock, !r.pinned && !r.references && !r.texture && r.controller.abort());
		};
		try {
			let t = await require_subscribe_load.subscribeLoad(r.promise, n.signal);
			if (n.signal?.aborted || this.disposed || t.destroyed) throw n.signal?.throwIfAborted(), new require_texture.AssetError(`Texture acquisition was cancelled.`);
			return new TextureLease(t, release);
		} catch (e) {
			throw release(), e;
		}
	}
	unloadTexture(t) {
		let n = this.textureURL(t), r = this.cache.get(n);
		if (r) {
			if (r.references) throw new require_texture.AssetError(`Cannot unload a texture with outstanding leases.`);
			this.removeTexture(n, r), r.controller.abort(), r.texture?.destroy();
		}
	}
	textureURL(t) {
		try {
			let e = this.baseURL ?? (typeof document < `u` ? document.baseURI : void 0) ?? (typeof location < `u` ? location.href : void 0), n = new URL(t, e);
			return n.hash = ``, n.href;
		} catch (t) {
			throw new require_texture.AssetError(`Invalid texture URL.`, { cause: t });
		}
	}
	removeTexture(e, t) {
		this.cache.get(e) === t && (this.cache.delete(e), this.decodedBytes -= t.bytes, t.bytes = 0);
	}
	textureEntry(t) {
		if (this.disposed) throw new require_texture.AssetError(`Cannot load from a destroyed AssetLoader.`);
		let n = this.textureURL(t), r = this.cache.get(n);
		if (r && !r.controller.signal.aborted && !r.texture?.destroyed) return r;
		r && this.removeTexture(n, r);
		let i = new AbortController(), a = this.fetchTexture(n, i.signal), cancel, o = new Promise((t, n) => {
			cancel = () => n(new require_texture.AssetError(`Texture acquisition was cancelled.`));
		});
		i.signal.addEventListener(`abort`, cancel, { once: !0 });
		let s = {
			controller: i,
			references: 0,
			pinned: !1,
			seen: ++this.clock,
			bytes: 0,
			promise: Promise.race([a, o]).then((t) => {
				try {
					if (this.disposed || i.signal.aborted || this.cache.get(n) !== s) throw new require_texture.AssetError(`Texture acquisition was cancelled.`);
					let r = t.width * t.height * 4, a = 0;
					for (let [e, t] of this.cache) t.texture?.destroyed ? this.removeTexture(e, t) : t.texture && !t.pinned && !t.references && (a += t.bytes);
					if (this.decodedBytes + r - a > this.decodedBudget) throw new require_texture.AssetError(`Decoded texture budget is exhausted by borrowed resources.`);
					for (; this.decodedBytes + r > this.decodedBudget;) {
						let e;
						for (let t of this.cache) t[1].texture && !t[1].pinned && !t[1].references && (!e || t[1].seen < e[1].seen) && (e = t);
						this.removeTexture(e[0], e[1]), e[1].texture.destroy(), this.evictions++;
					}
					return s.texture = t, s.bytes = r, this.decodedBytes += r, this.decodedPeak = Math.max(this.decodedPeak, this.decodedBytes), t;
				} catch (e) {
					throw t.destroy(), e;
				}
			}).catch((e) => {
				throw this.removeTexture(n, s), e;
			}).finally(() => i.signal.removeEventListener(`abort`, cancel))
		};
		return this.cache.set(n, s), s;
	}
	textureTask(e, t) {
		return {
			key: e,
			load: (e) => this.loadTexture(t, { signal: e })
		};
	}
	async loadTextureOwned(t, n = {}) {
		if (this.disposed) throw new require_texture.AssetError(`Cannot load from a destroyed AssetLoader.`);
		n.signal?.throwIfAborted();
		let r = this.baseURL ?? (typeof document < `u` ? document.baseURI : void 0) ?? (typeof location < `u` ? location.href : void 0), i;
		try {
			let n = new URL(t, r);
			if (![
				`http:`,
				`https:`,
				`data:`,
				`blob:`
			].includes(n.protocol)) throw new require_texture.AssetError(`Unsupported texture URL protocol.`);
			n.hash = ``, i = n.href;
		} catch (t) {
			throw t instanceof require_texture.AssetError ? t : new require_texture.AssetError(`Invalid texture URL.`, { cause: t });
		}
		let a = new AbortController();
		this.requests.add(a);
		let abort = () => a.abort(n.signal?.reason);
		n.signal?.addEventListener(`abort`, abort, { once: !0 });
		try {
			let e = a.signal, t = this.fetchTexture(i, e);
			return await new Promise((n, r) => {
				let cancel = () => r(e.reason);
				e.addEventListener(`abort`, cancel, { once: !0 }), t.then((t) => {
					e.removeEventListener(`abort`, cancel), e.aborted ? (t.destroy(), r(e.reason)) : n(t);
				}, (t) => {
					e.removeEventListener(`abort`, cancel), r(t);
				});
			});
		} finally {
			this.requests.delete(a), n.signal?.removeEventListener(`abort`, abort);
		}
	}
	async loadBinary(t, n = {}) {
		if (this.disposed) throw new require_texture.AssetError(`Cannot load from a destroyed AssetLoader.`);
		n.signal?.throwIfAborted();
		let o = n.maxBytes ?? require_gameplay_assets.gameplayAssetLimits.resourceBytes;
		if (!Number.isInteger(o) || o <= 0 || o > require_gameplay_assets.gameplayAssetLimits.resourceBytes) throw new require_texture.AssetError(`Resource byte limit must be a positive integer within the resource budget.`);
		let s;
		try {
			let n = this.baseURL ?? (typeof document < `u` ? document.baseURI : void 0) ?? (typeof location < `u` ? location.href : void 0), r = new URL(t, n);
			if (![
				`http:`,
				`https:`,
				`data:`,
				`blob:`
			].includes(r.protocol)) throw new require_texture.AssetError(`Unsupported resource URL protocol.`);
			r.hash = ``, s = r.href;
		} catch (t) {
			throw t instanceof require_texture.AssetError ? t : new require_texture.AssetError(`Invalid resource URL.`, { cause: t });
		}
		let c = new AbortController();
		this.requests.add(c);
		let abort = () => c.abort(n.signal?.reason);
		n.signal?.addEventListener(`abort`, abort, { once: !0 });
		let l = c.signal;
		try {
			let operation = async () => {
				let t = await fetch(s, { signal: l });
				if (l.throwIfAborted(), !t.ok) throw new require_texture.AssetError(`Resource request failed (HTTP ${t.status}).`);
				let n = await (await require_read_response.readResponse(t, o, l)).arrayBuffer();
				return l.throwIfAborted(), n;
			};
			return await require_subscribe_load.subscribeLoad(operation(), l);
		} catch (t) {
			throw l.aborted ? l.reason : t instanceof require_texture.AssetError ? t : new require_texture.AssetError(`Unable to load resource.`, { cause: t });
		} finally {
			this.requests.delete(c), n.signal?.removeEventListener(`abort`, abort);
		}
	}
	async loadText(e, t = {}) {
		let n = await this.loadBinary(e, {
			...t,
			maxBytes: t.maxBytes ?? require_gameplay_assets.gameplayAssetLimits.textBytes
		});
		return new TextDecoder().decode(n);
	}
	async loadJSON(t, n = {}) {
		let r = await this.loadText(t, n);
		try {
			return JSON.parse(r);
		} catch (t) {
			throw new require_texture.AssetError(`Unable to parse resource JSON.`, { cause: t });
		}
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			for (let e of this.cache.values()) e.controller.abort(), e.texture?.destroy();
			this.cache.clear(), this.decodedBytes = 0;
			for (let t of this.requests) t.abort(new require_texture.AssetError(`AssetLoader was destroyed while loading a resource.`));
			this.requests.clear();
		}
	}
	async fetchTexture(i, a) {
		try {
			let o = await fetch(i, { signal: a });
			if (!o.ok) throw new require_texture.AssetError(`Texture request failed (HTTP ${o.status}).`);
			if (this.disposed) throw new require_texture.AssetError(`AssetLoader was destroyed while loading a texture.`);
			let s = await require_read_response.readResponse(o, require_assets.assetLimits.textureBytes, a);
			if (a.throwIfAborted(), this.disposed) throw new require_texture.AssetError(`AssetLoader was destroyed while loading a texture.`);
			let c = await createImageBitmap(s, { premultiplyAlpha: `none` });
			if (this.disposed || a.aborted) throw c.close(), a.aborted ? a.reason : new require_texture.AssetError(`AssetLoader was destroyed while loading a texture.`);
			try {
				return new require_texture.Texture(c);
			} catch (e) {
				throw c.close(), e;
			}
		} catch (t) {
			throw a.aborted ? a.reason : t instanceof require_texture.AssetError ? t : new require_texture.AssetError(`Unable to load texture.`, { cause: t });
		}
	}
};
//#endregion
exports.AssetError = require_texture.AssetError;
exports.AssetLoader = AssetLoader;
exports.AssetManifest = require_asset_manifest.AssetManifest;
exports.BitmapFontAsset = require_bitmap_font.BitmapFontAsset;
exports.BitmapFontLoader = require_bitmap_font.BitmapFontLoader;
exports.CanvasTexture2D = require_texture2d.CanvasTexture2D;
exports.FontAsset = require_font_asset.FontAsset;
exports.ManifestLease = require_asset_manifest.ManifestLease;
exports.NativeTexture2D = require_native_texture.NativeTexture2D;
exports.NativeWorkerPool = require_worker_jobs.NativeWorkerPool;
exports.PreloadBatch = require_preload_batch.PreloadBatch;
exports.ResourceLease = require_resource_scope.ResourceLease;
exports.ResourcePool = require_resource_scope.ResourcePool;
exports.ResourceScope = require_resource_scope.ResourceScope;
exports.Texture = require_texture.Texture;
exports.TextureLease = TextureLease;
exports.TextureView2D = require_texture2d.TextureView2D;
exports.TiledAsset = require_tiled_loader.TiledAsset;
exports.TiledError = require_tiled_parser.TiledError;
exports.VideoTexture = require_video_texture.VideoTexture;
exports.VideoTextureDecoder = require_video_texture.VideoTextureDecoder;
exports.WorkerJobError = require_worker_jobs.WorkerJobError;
exports.generateBitmapFont = require_generate_bitmap_font.generateBitmapFont;
exports.installWorkerJobs = require_worker_job_runtime.installWorkerJobs;
exports.loadAssetBundle = require_asset_bundle.loadAssetBundle;
exports.loadTiledMap = require_tiled_loader.loadTiledMap;
exports.parseAssetBundle = require_asset_bundle.parseAssetBundle;
exports.parseTiledMap = require_tiled_parser.parseTiledMap;
exports.parseTiledTileset = require_tiled_parser.parseTiledTileset;
exports.selectAssetBundleVariant = require_asset_bundle.selectAssetBundleVariant;

//# sourceMappingURL=index.cjs.map