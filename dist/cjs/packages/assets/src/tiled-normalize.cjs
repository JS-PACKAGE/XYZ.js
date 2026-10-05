const require_read_response = require("./read-response.cjs");
const require_tiled = require("../../../src/data/tiled.cjs");
const require_tiled_parser = require("./tiled-parser.cjs");
//#region dist/packages/assets/src/tiled-normalize.js
async function normalizeTiledMap(a, o, s, c, l) {
	let u = 0, d = 0, f = 0, p = /* @__PURE__ */ new Map(), template = async (t, r) => {
		if (r.includes(t) || r.length >= require_tiled.tiledLimits.layers) throw new require_tiled_parser.TiledError(t, `cyclic/deep object template`);
		let a = p.get(t);
		if (!a) {
			if (p.size >= require_tiled.tiledLimits.objects) throw new require_tiled_parser.TiledError(t, `template budget exceeded`);
			a = (async () => {
				let e = require_tiled_parser.tiledRecord(await c(t), t), i = require_tiled_parser.tiledRecord(e.object, `${t}.object`);
				return mergeTemplate(i, t, [...r, t]);
			})(), p.set(t, a);
		}
		return a;
	}, mergeTemplate = async (t, r, a) => {
		if (t.template === void 0) return t;
		if (typeof t.template != `string`) throw new require_tiled_parser.TiledError(r, `template must be a URL`);
		let o = await template(s(t.template, r), a), c = {
			...o,
			...t
		};
		if (delete c.template, o.properties !== void 0 || t.properties !== void 0) {
			let a = /* @__PURE__ */ new Map();
			for (let s of [o.properties ?? [], t.properties ?? []]) {
				if (!Array.isArray(s) || s.length > require_tiled.tiledLimits.properties) throw new require_tiled_parser.TiledError(r, `template property budget exceeded`);
				let t = /* @__PURE__ */ new Set();
				for (let e of s) {
					let o = require_tiled_parser.tiledRecord(e, r);
					if (typeof o.name != `string` || t.has(o.name)) throw new require_tiled_parser.TiledError(r, `invalid/duplicate template property`);
					t.add(o.name), a.set(o.name, o);
				}
			}
			if (a.size > require_tiled.tiledLimits.properties) throw new require_tiled_parser.TiledError(r, `template property budget exceeded`);
			c.properties = [...a.values()];
		}
		if ([
			`polygon`,
			`ellipse`,
			`polyline`,
			`point`,
			`gid`,
			`text`
		].some((e) => Object.hasOwn(t, e))) for (let e of [
			`polygon`,
			`ellipse`,
			`polyline`,
			`point`,
			`gid`,
			`text`
		]) Object.hasOwn(t, e) || delete c[e];
		return c;
	}, decode = async (n, a, o) => {
		let s = Number(n.width) * Number(n.height);
		if (!Number.isSafeInteger(s) || s <= 0 || (u += s) > require_tiled.tiledLimits.cells) throw new require_tiled_parser.TiledError(o, `cell count/budget mismatch`);
		if (typeof n.data != `string`) {
			if (a.compression && a.compression !== ``) throw new require_tiled_parser.TiledError(o, `compressed data requires base64`);
			return;
		}
		if (a.encoding !== `base64`) throw new require_tiled_parser.TiledError(o, `string data requires base64 encoding`);
		let c = a.compression ?? ``;
		if (![
			``,
			`gzip`,
			`zlib`
		].includes(String(c))) throw new require_tiled_parser.TiledError(o, `unsupported compression`);
		if (!c) return;
		if (typeof DecompressionStream > `u`) throw new require_tiled_parser.TiledError(o, `native decompression unavailable`);
		l.throwIfAborted();
		let d = require_tiled_parser.tiledBase64Bytes(n.data, require_tiled.tiledLimits.jsonBytes, o);
		try {
			let e = new Blob([d]).stream().pipeThrough(new DecompressionStream(c === `gzip` ? `gzip` : `deflate`)), r = await require_read_response.readResponse(new Response(e), s * 4, l);
			if (r.size !== s * 4) throw new require_tiled_parser.TiledError(o, `decoded cell count mismatch`);
			let a = new DataView(await r.arrayBuffer());
			l.throwIfAborted(), n.data = Array.from({ length: s }, (e, t) => a.getUint32(t * 4, !0));
		} catch (e) {
			throw l.throwIfAborted(), e instanceof require_tiled_parser.TiledError ? e : new require_tiled_parser.TiledError(o, `native decode rejected: ${e instanceof Error ? e.message : String(e)}`);
		}
	}, visit = async (t, r) => {
		if (!Array.isArray(t) || t.length > require_tiled.tiledLimits.layers) throw new require_tiled_parser.TiledError(r, `invalid layer list`);
		for (let [s, c] of t.entries()) {
			if (l.throwIfAborted(), ++d > require_tiled.tiledLimits.layers) throw new require_tiled_parser.TiledError(r, `layer budget exceeded`);
			let t = require_tiled_parser.tiledRecord(c, `${r}[${s}]`);
			if (t.type === `group`) await visit(t.layers, `${r}[${s}].layers`);
			else if (t.type === `tilelayer`) {
				if (a.infinite === !0) {
					if (!Array.isArray(t.chunks) || t.chunks.length > require_tiled.tiledLimits.chunks) throw new require_tiled_parser.TiledError(r, `infinite maps require bounded chunks`);
					for (let e of t.chunks) await decode(require_tiled_parser.tiledRecord(e, r), t, r);
				} else await decode(t, t, r);
				(t.compression === `gzip` || t.compression === `zlib`) && delete t.compression;
			} else if (t.type === `objectgroup`) {
				if (!Array.isArray(t.objects) || (f += t.objects.length) > require_tiled.tiledLimits.objects) throw new require_tiled_parser.TiledError(r, `object budget exceeded`);
				for (let e = 0; e < t.objects.length; e++) t.objects[e] = await mergeTemplate(require_tiled_parser.tiledRecord(t.objects[e], r), o, []);
			}
		}
	};
	await visit(a.layers, `map.layers`);
}
//#endregion
exports.normalizeTiledMap = normalizeTiledMap;

//# sourceMappingURL=tiled-normalize.cjs.map