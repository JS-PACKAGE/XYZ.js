const require_texture = require("./texture.cjs");
const require_read_response = require("./read-response.cjs");
const require_tiled = require("../../../src/data/tiled.cjs");
const require_tiled_parser = require("./tiled-parser.cjs");
const require_tiled_normalize = require("./tiled-normalize.cjs");
//#region dist/packages/assets/src/tiled-loader.js
var TiledAsset = class {
	data;
	textures;
	scope;
	imageTextures;
	constructor(e, t, n, r = /* @__PURE__ */ new Map()) {
		this.data = e, this.textures = t, this.scope = n, this.imageTextures = r;
	}
	destroy() {
		this.scope.release();
	}
};
var c = /* @__PURE__ */ new WeakMap();
function imageRequest(n, i) {
	let a = c.get(n);
	a || (a = /* @__PURE__ */ new Map(), c.set(n, a));
	let o = a.get(i);
	return o || (o = {
		kind: `texture`,
		ownership: `owned`,
		dispose: (e) => e.destroy(),
		async load(n, a) {
			let o = await fetch(i, {
				signal: n,
				redirect: `error`,
				credentials: `omit`
			});
			if (!o.ok) throw new require_tiled_parser.TiledError(i, `HTTP ${o.status}`);
			let c = await require_read_response.readResponse(o, require_tiled.tiledLimits.imageBytes, n), l = a.own(await require_texture.Texture.fromImage(c));
			return n.throwIfAborted(), l;
		}
	}, a.set(i, o)), o;
}
async function loadTiledMap(r, c, l = {}) {
	let u = r.createScope({ signal: l.signal });
	try {
		let d = new URL(c, typeof document > `u` ? void 0 : document.baseURI), f = l.allowedOrigins ?? [d.origin], resolve = (e, t) => {
			let n = new URL(e, t);
			if (![`http:`, `https:`].includes(n.protocol) || n.username || n.password || !f.includes(n.origin)) throw new require_tiled_parser.TiledError(`url`, `origin/protocol denied: ${n.origin}`);
			return n.href;
		}, p = 0, json = async (n) => {
			let r = await fetch(n, {
				signal: u.signal,
				redirect: `error`,
				credentials: `omit`
			});
			if (!r.ok) throw new require_tiled_parser.TiledError(n, `HTTP ${r.status}`);
			let i = await require_read_response.readResponse(r, require_tiled.tiledLimits.jsonBytes, u.signal);
			if (p += i.size, p > require_tiled.tiledLimits.jsonBytes) throw new require_tiled_parser.TiledError(n, `aggregate JSON byte budget exceeded`);
			let a = JSON.parse(await i.text());
			return u.signal.throwIfAborted(), a;
		}, m = resolve(d.href, d.href), h = require_tiled_parser.tiledRecord(await json(m), `map`);
		if (!Array.isArray(h.tilesets) || h.tilesets.length > require_tiled.tiledLimits.tilesets) throw new require_tiled_parser.TiledError(`map.tilesets`, `invalid tileset list`);
		let g = [], _ = /* @__PURE__ */ new Map();
		for (let [e, t] of h.tilesets.entries()) {
			let n = require_tiled_parser.tiledRecord(t, `map.tilesets[${e}]`);
			if (typeof n.firstgid != `number` || !Number.isSafeInteger(n.firstgid) || n.firstgid < 1) throw new require_tiled_parser.TiledError(`tileset.firstgid`, `expected a positive integer`);
			let r = m, i = n;
			if (n.source !== void 0) {
				if (typeof n.source != `string`) throw new require_tiled_parser.TiledError(`tileset.source`, `expected a URL string`);
				r = resolve(n.source, m), i = await json(r);
			}
			let c = require_tiled_parser.parseTiledTileset(i, n.firstgid, `tilesets[${e}]`);
			g.push(c), _.set(c, resolve(c.image, r));
		}
		await require_tiled_normalize.normalizeTiledMap(h, m, resolve, json, u.signal);
		let v = require_tiled_parser.parseTiledMap(h, g), y = /* @__PURE__ */ new Map();
		for (let e of g) {
			let t = _.get(e), n = l.textures?.get(t), i = n ? u.borrow(n).value : (await u.acquire(imageRequest(r, t))).value;
			if (i.destroyed || i.width !== e.imageWidth || i.height !== e.imageHeight) throw new require_tiled_parser.TiledError(e.name, `decoded image dimensions differ from tileset`);
			y.set(e, i);
		}
		let b = /* @__PURE__ */ new Map();
		for (let t of v.layers) {
			if (t.type !== `imagelayer`) continue;
			let n = resolve(t.image, m), i = l.textures?.get(n), a = i ? u.borrow(i).value : (await u.acquire(imageRequest(r, n))).value;
			if (a.destroyed || a.width * a.height * 4 > require_tiled.tiledLimits.imageBytes) throw new require_tiled_parser.TiledError(t.name, `decoded image exceeds byte budget`);
			b.set(t.id, a);
		}
		return u.signal.throwIfAborted(), new TiledAsset(v, y, u, b);
	} catch (e) {
		throw u.release(e), e;
	}
}
//#endregion
exports.TiledAsset = TiledAsset;
exports.loadTiledMap = loadTiledMap;

//# sourceMappingURL=tiled-loader.cjs.map