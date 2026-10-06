const require_texture = require("./texture.cjs");
const require_native_texture = require("./native-texture.cjs");
const require_read_response = require("./read-response.cjs");
const require_asset_recipe = require("../../../src/data/asset-recipe.cjs");
const require_models = require("../../../src/data/models.cjs");
const require_range_bundle = require("./range-bundle.cjs");
//#region dist/packages/assets/src/asset-bundle.js
function record(t) {
	if (!t || typeof t != `object` || Array.isArray(t)) throw new require_texture.AssetError(`Invalid asset bundle object.`);
	return t;
}
function safePath(t) {
	if (typeof t != `string` || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(t) || t === `.` || t === `..`) throw new require_texture.AssetError(`Invalid asset bundle path.`);
	return t;
}
function positive(t, n) {
	if (typeof t != `number` || !Number.isSafeInteger(t) || t < 1 || t > n) throw new require_texture.AssetError(`Invalid asset bundle size.`);
	return t;
}
function parseAssetBundle(n) {
	let a = record(n);
	if (a.version !== require_asset_recipe.assetRecipe.version || a.profile !== require_asset_recipe.assetRecipe.bundleProfile || !Array.isArray(a.files) || !Array.isArray(a.variants) || !Array.isArray(a.textures) || a.files.length > require_asset_recipe.assetRecipe.outputFiles || a.variants.length < 1 || a.variants.length > 16 || a.textures.length > require_models.modelLimits.entries) throw new require_texture.AssetError(`Unsupported or malformed asset bundle descriptor.`);
	let o = /* @__PURE__ */ new Set(), s = 0, c = a.files.map((t) => {
		let n = record(t), i = safePath(n.path);
		if (o.has(i) || typeof n.sha256 != `string` || !/^[a-f0-9]{64}$/.test(n.sha256) || typeof n.bytes != `number` || !Number.isSafeInteger(n.bytes) || n.bytes < 0) throw new require_texture.AssetError(`Invalid asset bundle file/hash.`);
		if (s += n.bytes, s > require_asset_recipe.assetRecipe.outputBytes) throw new require_texture.AssetError(`Asset bundle exceeds byte budget.`);
		return o.add(i), Object.freeze({
			path: i,
			bytes: n.bytes,
			sha256: n.sha256
		});
	}), l = a.variants.map((n) => {
		let r = record(n), i = safePath(r.path);
		if (!o.has(i) || !i.endsWith(`.gltf`) || typeof r.nativeTextures != `boolean` || !Array.isArray(r.formats) || r.formats.length > 8 || new Set(r.formats).size !== r.formats.length || r.formats.some((e) => typeof e != `string` || !Object.hasOwn(require_native_texture.nativeTextureFormats, e)) || r.codec !== `none` && r.codec !== `draco` || !r.nativeTextures && r.formats.length !== 0) throw new require_texture.AssetError(`Invalid asset bundle model variant.`);
		return Object.freeze({
			path: i,
			nativeTextures: r.nativeTextures,
			formats: Object.freeze(r.formats),
			codec: r.codec
		});
	});
	if (new Set(l.map((e) => e.path)).size !== l.length || !l.some((e) => !e.nativeTextures && e.codec === `none`)) throw new require_texture.AssetError(`Asset bundle requires a unique raster fallback.`);
	let u = a.textures.map((e) => {
		let t = record(e);
		return Object.freeze({
			width: positive(t.width, 8192),
			height: positive(t.height, 8192)
		});
	});
	return Object.freeze({
		version: 2,
		profile: a.profile,
		files: Object.freeze(c),
		variants: Object.freeze(l),
		textures: Object.freeze(u)
	});
}
function selectAssetBundleVariant(n, r, i = {}) {
	if (!r.capabilities.threeD) throw new require_texture.AssetError(`Renderer does not support bundle 3D models.`);
	if (n.textures.some((e) => e.width > r.capabilities.maxTextureSize || e.height > r.capabilities.maxTextureSize)) throw new require_texture.AssetError(`Bundle textures exceed device dimensions.`);
	let a = new Set(r.capabilities.supportedTextureFormats), o = n.variants.find((e) => (e.codec !== `draco` || i.draco) && e.formats.every((e) => {
		if (!a.has(e)) return !1;
		let [i, o, , , , s] = require_native_texture.nativeTextureFormats[e];
		return r.backend !== `webgpu` || !s || n.textures.every((e) => e.width % i === 0 && e.height % o === 0);
	}));
	if (!o) throw new require_texture.AssetError(`No compatible bundle variant.`);
	return o;
}
async function sha256(e) {
	let t = new Uint8Array(await crypto.subtle.digest(`SHA-256`, e)), n = ``;
	for (let e of t) n += e.toString(16).padStart(2, `0`);
	return n;
}
async function fetchBytes(t, r, i) {
	i?.throwIfAborted();
	let a = await fetch(t, { signal: i });
	if (!a.ok) throw new require_texture.AssetError(`Asset bundle request failed (HTTP ${a.status}).`);
	return (await require_read_response.readResponse(a, r, i)).arrayBuffer();
}
async function loadAssetBundle(t, n) {
	let c = require_range_bundle.rangeBundleConfigurations.has(n), l = new URL(t, typeof document > `u` ? void 0 : document.baseURI).href;
	if (!/^https?:/.test(l)) throw new require_texture.AssetError(`Asset bundle requires HTTP(S).`);
	let u = n.options?.signal ?? new AbortController().signal, d = await fetchBytes(l, require_asset_recipe.assetRecipe.profileBytes * 64, u);
	if (n.manifestSHA256 !== void 0 && (!/^[a-f0-9]{64}$/.test(n.manifestSHA256) || await sha256(d) !== n.manifestSHA256)) throw new require_texture.AssetError(`Asset bundle manifest hash mismatch.`);
	let f = JSON.parse(new TextDecoder(`utf-8`, { fatal: !0 }).decode(d)), p = parseAssetBundle(f), m = c ? require_range_bundle.parseAssetBundleArchive(record(f).archive, p) : void 0, h = selectAssetBundleVariant(p, n.renderer, { draco: !!n.options?.dracoDecoder }), g = m ? new require_range_bundle.AssetBundleRangeReader(new URL(m.path, l).href, m, u) : void 0, _ = new Map(p.files.map((e) => [e.path, e])), verified = async (t) => {
		let n = _.get(safePath(t));
		if (!n) throw new require_texture.AssetError(`Model references an untracked bundle resource.`);
		let r = g ? await g.read(t) : await fetchBytes(new URL(t, l).href, n.bytes, u);
		if (r.byteLength !== n.bytes || await sha256(r) !== n.sha256) throw new require_texture.AssetError(`Asset bundle hash mismatch: ${t}`);
		return r;
	}, v = [], y = /* @__PURE__ */ new Map();
	try {
		let t = record(JSON.parse(new TextDecoder(`utf-8`, { fatal: !0 }).decode(await verified(h.path))));
		for (let n of [`buffers`, `images`]) {
			let r = t[n];
			if (r !== void 0) {
				if (!Array.isArray(r) || r.length > require_models.modelLimits.entries) throw new require_texture.AssetError(`Invalid bundle model resource table.`);
				for (let e of r) {
					let t = record(e);
					if (n === `images` && t.uri === void 0 && t.bufferView !== void 0) continue;
					let r = safePath(t.uri), i = y.get(r);
					if (!i) {
						let e = await verified(r);
						i = URL.createObjectURL(new Blob([e])), v.push(i), y.set(r, i);
					}
					t.uri = i;
				}
			}
		}
		let r = await n.loader.parse(JSON.stringify(t), new URL(h.path, l).href, {
			...n.options,
			nativeTextures: h.nativeTextures
		});
		return u?.aborted && (r.dispose(), u.throwIfAborted()), Object.defineProperty(r, "bundleVariant", {
			value: h,
			enumerable: !0
		}), r;
	} finally {
		for (let e of v) URL.revokeObjectURL(e);
		g?.destroy();
	}
}
//#endregion
exports.loadAssetBundle = loadAssetBundle;
exports.parseAssetBundle = parseAssetBundle;
exports.selectAssetBundleVariant = selectAssetBundleVariant;

//# sourceMappingURL=asset-bundle.cjs.map