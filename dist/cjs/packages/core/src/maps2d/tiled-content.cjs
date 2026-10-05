const require_tiled_parser = require("../../../assets/src/tiled-parser.cjs");
const require_tiled_loader = require("../../../assets/src/tiled-loader.cjs");
const require_factories = require("../factories.cjs");
const require_tiled_map = require("./tiled-map.cjs");
//#region dist/packages/core/src/maps2d/tiled-content.js
function descendants(e) {
	let t = Object.create(null), visit = (e, n) => {
		if (!(`children` in e)) return;
		let r = 0;
		for (let i of e.children) {
			let e = `${n}${r++}`;
			t[e] = i, visit(i, `${e}.`);
		}
	};
	return visit(e, ``), t;
}
var tiledContentFactory = require_factories.defineFactory({
	parse(e) {
		let r = require_tiled_parser.tiledRecord(e, `factory.options`);
		if (typeof r.url != `string` || !r.url || r.url.length > 4096) throw new require_tiled_parser.TiledError(`factory.url`, `expected a bounded URL`);
		if (r.allowedOrigins !== void 0 && (!Array.isArray(r.allowedOrigins) || r.allowedOrigins.length > 64 || !r.allowedOrigins.every((e) => typeof e == `string` && e.length <= 4096))) throw new require_tiled_parser.TiledError(`factory.allowedOrigins`, `expected bounded origins`);
		return {
			url: r.url,
			...r.allowedOrigins ? { allowedOrigins: [...r.allowedOrigins] } : {}
		};
	},
	async create(t, n) {
		let r = await require_tiled_loader.loadTiledMap(n.services, t.url, {
			signal: n.signal,
			...t.allowedOrigins ? { allowedOrigins: t.allowedOrigins } : {}
		});
		try {
			return n.own(new require_tiled_map.TiledContent(r));
		} catch (e) {
			throw r.destroy(), e;
		}
	},
	children: descendants
});
async function produceTiledContentNode(t, n, r, a) {
	let o = tiledContentFactory.parse(r), s = await require_tiled_loader.loadTiledMap(t, o.url, {
		...a ? { signal: a } : {},
		...o.allowedOrigins ? { allowedOrigins: o.allowedOrigins } : {}
	}), c = new require_tiled_map.TiledContent(s);
	try {
		let e = Object.create(null);
		for (let t of Object.keys(descendants(c))) e[t] = `${n}:${t}`;
		return {
			id: n,
			kind: `tiled`,
			options: o,
			children: e
		};
	} finally {
		c.destroy();
	}
}
//#endregion
exports.produceTiledContentNode = produceTiledContentNode;
exports.tiledContentFactory = tiledContentFactory;

//# sourceMappingURL=tiled-content.cjs.map