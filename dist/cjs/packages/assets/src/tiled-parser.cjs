const require_tiled = require("../../../src/data/tiled.cjs");
//#region dist/packages/assets/src/tiled-parser.js
var TiledError = class extends Error {
	path;
	constructor(e, t) {
		super(`Tiled ${e}: ${t}`), this.path = e, this.name = `TiledError`;
	}
};
function tiledRecord(e, t) {
	if (!e || typeof e != `object` || Array.isArray(e)) throw new TiledError(t, `expected an object`);
	return e;
}
function number(e, t, n, r) {
	let i = e[t] ?? r;
	if (typeof i != `number` || !Number.isFinite(i)) throw new TiledError(`${n}.${t}`, `expected a finite number`);
	return i;
}
function integer(e, t, n, r = 0, i) {
	let a = number(e, t, n, i);
	if (!Number.isSafeInteger(a) || a < r) throw new TiledError(`${n}.${t}`, `expected an integer >= ${r}`);
	return a;
}
function text(e, t, n, r) {
	let i = e[t] ?? r;
	if (typeof i != `string`) throw new TiledError(`${n}.${t}`, `expected a string`);
	return i;
}
function bool(e, t, n, r) {
	let i = e[t] ?? r;
	if (typeof i != `boolean`) throw new TiledError(`${n}.${t}`, `expected a boolean`);
	return i;
}
function array(e, t, n) {
	if (!Array.isArray(e) || e.length > n) throw new TiledError(t, `expected an array of at most ${n} entries`);
	return e;
}
function unsupported(e, t, n) {
	for (let r of t) if (e[r] !== void 0) throw new TiledError(`${n}.${r}`, `unsupported feature`);
}
function properties(t, n) {
	let r = Object.create(null);
	for (let [i, a] of array(t ?? [], n, require_tiled.tiledLimits.properties).entries()) {
		let e = tiledRecord(a, `${n}[${i}]`), t = text(e, `name`, n), o = text(e, `type`, n, `string`);
		if (![
			`string`,
			`bool`,
			`int`,
			`float`,
			`color`,
			`file`
		].includes(o)) throw new TiledError(n, `unsupported property type ${o}`);
		let s = e.value;
		if (o === `bool` && typeof s != `boolean` || [`int`, `float`].includes(o) && (typeof s != `number` || !Number.isFinite(s) || o === `int` && !Number.isSafeInteger(s)) || [
			`string`,
			`color`,
			`file`
		].includes(o) && typeof s != `string`) throw new TiledError(n, `invalid property value`);
		if (Object.hasOwn(r, t)) throw new TiledError(n, `duplicate property ${t}`);
		r[t] = s;
	}
	return Object.freeze(r);
}
function parseTiledTileset(t, n, r = `tileset`) {
	let i = tiledRecord(t, r);
	unsupported(i, [
		`source`,
		`tileoffset`,
		`grid`,
		`wangsets`,
		`terrains`,
		`transformations`
	], r);
	let a = integer(i, `tilewidth`, r, 1), o = integer(i, `tileheight`, r, 1), s = integer(i, `columns`, r, 1), c = integer(i, `tilecount`, r, 1);
	if (c > require_tiled.tiledLimits.tiles || n + c > 268435456) throw new TiledError(r, `tileset exceeds GID/frame budget`);
	let l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map(), d = 0;
	for (let t of array(i.tiles ?? [], `${r}.tiles`, require_tiled.tiledLimits.tiles)) {
		let n = tiledRecord(t, r);
		unsupported(n, [
			`objectgroup`,
			`image`,
			`imagewidth`,
			`imageheight`
		], r);
		let i = integer(n, `id`, r);
		if (i >= c || l.has(i)) throw new TiledError(r, `invalid/duplicate tile ID`);
		if (l.set(i, properties(n.properties, `${r}.tile.properties`)), n.animation !== void 0) {
			let t = array(n.animation, `${r}.animation`, require_tiled.tiledLimits.tiles);
			if (!t.length || (d += t.length) > require_tiled.tiledLimits.tiles) throw new TiledError(r, `animation frame budget exceeded`);
			u.set(i, Object.freeze(t.map((e) => {
				let t = tiledRecord(e, `${r}.animation`), n = integer(t, `tileid`, r), i = integer(t, `duration`, r, 1);
				if (n >= c) throw new TiledError(r, `unresolved animation tile`);
				return Object.freeze({
					tileid: n,
					duration: i
				});
			})));
		}
	}
	let f = integer(i, `imagewidth`, r, 1), p = integer(i, `imageheight`, r, 1), m = integer(i, `margin`, r, 0, 0), h = integer(i, `spacing`, r, 0, 0);
	if (!Number.isSafeInteger(f * p * 4) || f * p * 4 > require_tiled.tiledLimits.imageBytes) throw new TiledError(r, `decoded atlas image byte budget exceeded`);
	if (2 * m + s * a + (s - 1) * h > f || 2 * m + Math.ceil(c / s) * o + (Math.ceil(c / s) - 1) * h > p) throw new TiledError(r, `atlas regions exceed image dimensions`);
	return Object.freeze({
		firstgid: n,
		name: text(i, `name`, r, ``),
		image: text(i, `image`, r),
		tileWidth: a,
		tileHeight: o,
		columns: s,
		tileCount: c,
		imageWidth: f,
		imageHeight: p,
		margin: m,
		spacing: h,
		properties: properties(i.properties, `${r}.properties`),
		tiles: l,
		animations: u
	});
}
function parseTiledMap(t, n) {
	let r = tiledRecord(t, `map`);
	if (r.orientation !== `orthogonal`) throw new TiledError(`map.orientation`, `only orthogonal maps are supported`);
	let i = bool(r, `infinite`, `map`, !1);
	if (r.renderorder !== void 0 && r.renderorder !== `right-down`) throw new TiledError(`map.renderorder`, `only right-down is supported`);
	let a = integer(r, `width`, `map`, +!i), o = integer(r, `height`, `map`, +!i), s = integer(r, `tilewidth`, `map`, 1), c = integer(r, `tileheight`, `map`, 1);
	if (!i && a * o > require_tiled.tiledLimits.cells) throw new TiledError(`map`, `cell budget exceeded`);
	if (n.length > require_tiled.tiledLimits.tilesets) throw new TiledError(`map.tilesets`, `invalid tileset count`);
	let l = 0, u = 0;
	for (let t of n) {
		if (u += t.tileCount, u > require_tiled.tiledLimits.tiles) throw new TiledError(`map.tilesets`, `aggregate atlas frame budget exceeded`);
		if (t.firstgid < l || t.firstgid < 1) throw new TiledError(`map.tilesets`, `overlapping or unsorted GID ranges`);
		if (l = t.firstgid + t.tileCount, t.tileWidth !== s || t.tileHeight !== c) throw new TiledError(`map.tilesets`, `tile dimensions must match the map`);
	}
	let d = 0, f = 0, p = /* @__PURE__ */ new Set(), m = /* @__PURE__ */ new Set(), h = [], gids = (t, r, i) => {
		if (!Number.isSafeInteger(r) || r <= 0 || (d += r) > require_tiled.tiledLimits.cells) throw new TiledError(i, `cell count/budget mismatch`);
		let a = typeof t == `string` ? decodeTiledBase64(t, r, i) : array(t, i, require_tiled.tiledLimits.cells);
		if (a.length !== r) throw new TiledError(i, `cell count/budget mismatch`);
		return Object.freeze(a.map((e, t) => {
			if (typeof e != `number` || !Number.isInteger(e) || e < 0 || e > 4294967295) throw new TiledError(`${i}[${t}]`, `expected uint32 GID`);
			if (e & 268435456) throw new TiledError(i, `hexagonal rotation GID flag is unsupported`);
			let r = e & 268435455;
			if (!r && e || r && !n.some((e) => r >= e.firstgid && r < e.firstgid + e.tileCount)) throw new TiledError(i, `unresolved GID ${e}`);
			return e;
		}));
	}, visit = (t, n, r, l = 1, u = 1) => {
		for (let [d, g] of array(t, n, require_tiled.tiledLimits.layers).entries()) {
			let t = `${n}[${d}]`, _ = tiledRecord(g, t);
			if (h.length >= require_tiled.tiledLimits.layers) throw new TiledError(t, `layer budget exceeded`);
			if (![
				`tilelayer`,
				`objectgroup`,
				`group`,
				`imagelayer`
			].includes(String(_.type))) throw new TiledError(`${t}.type`, `unsupported layer ${String(_.type)}`);
			let v = integer(_, `id`, t, 1);
			if (p.has(v)) throw new TiledError(t, `duplicate layer ID`);
			p.add(v);
			let y = number(_, `opacity`, t, 1);
			if (y < 0 || y > 1) throw new TiledError(t, `opacity must be in [0,1]`);
			let b = l * number(_, `parallaxx`, t, 1), x = u * number(_, `parallaxy`, t, 1);
			if (!Number.isFinite(b) || !Number.isFinite(x)) throw new TiledError(t, `parallax overflow`);
			let S = [], C, w = [];
			if (_.type === `tilelayer`) {
				if (typeof _.data == `string` && _.encoding !== `base64`) throw new TiledError(`${t}.encoding`, `string data requires base64 encoding`);
				if (_.encoding !== void 0 && _.encoding !== `base64`) throw new TiledError(`${t}.encoding`, `only base64 encoding is supported`);
				if (_.compression !== void 0 && _.compression !== ``) throw new TiledError(`${t}.compression`, `compressed data requires loadTiledMap`);
				if (i) {
					C = [];
					for (let n of array(_.chunks, `${t}.chunks`, require_tiled.tiledLimits.chunks)) {
						let e = tiledRecord(n, `${t}.chunks`);
						if (typeof e.data == `string` && _.encoding !== `base64`) throw new TiledError(t, `string chunk data requires base64 encoding`);
						let r = integer(e, `x`, t, -(2 ** 53 - 1)), i = integer(e, `y`, t, -(2 ** 53 - 1)), a = integer(e, `width`, t, 1), o = integer(e, `height`, t, 1);
						if (![
							r * s,
							i * c,
							r + a,
							i + o
						].every(Number.isSafeInteger)) throw new TiledError(t, `chunk coordinates exceed safe range`);
						if (C.some((e) => r < e.x + e.width && r + a > e.x && i < e.y + e.height && i + o > e.y)) throw new TiledError(t, `overlapping chunks`);
						C.push(Object.freeze({
							x: r,
							y: i,
							width: a,
							height: o,
							data: gids(e.data, a * o, `${t}.chunks.data`)
						}));
					}
				} else {
					if (unsupported(_, [`chunks`], t), integer(_, `width`, t, 1) !== a || integer(_, `height`, t, 1) !== o) throw new TiledError(t, `layer dimensions must match map`);
					S = gids(_.data, a * o, `${t}.data`);
				}
			} else if (_.type === `objectgroup`) for (let [n, r] of array(_.objects, `${t}.objects`, require_tiled.tiledLimits.objects).entries()) {
				if (++f > require_tiled.tiledLimits.objects) throw new TiledError(t, `object budget exceeded`);
				let i = `${t}.objects[${n}]`, a = tiledRecord(r, i);
				unsupported(a, [
					`gid`,
					`template`,
					`text`,
					`polyline`,
					`point`
				], i);
				let o = integer(a, `id`, i, 1);
				if (m.has(o)) throw new TiledError(i, `duplicate object ID`);
				m.add(o);
				let s = number(a, `width`, i, 0), c = number(a, `height`, i, 0), l = bool(a, `ellipse`, i, !1), u = a.polygon === void 0 ? void 0 : array(a.polygon, `${i}.polygon`, 32).map((e) => {
					let t = tiledRecord(e, i);
					return Object.freeze([number(t, `x`, i), number(t, `y`, i)]);
				});
				if (u ? u.length < 3 : s <= 0 || c <= 0 || l && s !== c) throw new TiledError(i, `requires a rectangle, circle, or convex polygon`);
				w.push(Object.freeze({
					id: o,
					name: text(a, `name`, i, ``),
					x: number(a, `x`, i),
					y: number(a, `y`, i),
					width: s,
					height: c,
					rotation: number(a, `rotation`, i, 0),
					visible: bool(a, `visible`, i, !0),
					ellipse: l,
					polygon: u && Object.freeze(u),
					properties: properties(a.properties, `${i}.properties`)
				}));
			}
			_.type === `imagelayer` && unsupported(_, [`transparentcolor`], t), h.push(Object.freeze({
				id: v,
				parentId: r,
				name: text(_, `name`, t, ``),
				type: _.type,
				opacity: y,
				visible: bool(_, `visible`, t, !0),
				x: number(_, `offsetx`, t, 0) + number(_, `x`, t, 0) * (_.type === `tilelayer` ? s : 1),
				y: number(_, `offsety`, t, 0) + number(_, `y`, t, 0) * (_.type === `tilelayer` ? c : 1),
				parallaxX: b,
				parallaxY: x,
				..._.type === `imagelayer` ? {
					image: text(_, `image`, t),
					repeatX: bool(_, `repeatx`, t, !1),
					repeatY: bool(_, `repeaty`, t, !1)
				} : {},
				properties: properties(_.properties, `${t}.properties`),
				data: S,
				chunks: C && Object.freeze(C),
				objects: Object.freeze(w)
			})), _.type === `group` && visit(_.layers, `${t}.layers`, v, b, x);
		}
	};
	return visit(r.layers, `map.layers`), Object.freeze({
		width: a,
		height: o,
		tileWidth: s,
		tileHeight: c,
		infinite: i,
		parallaxOriginX: number(r, `parallaxoriginx`, `map`, 0),
		parallaxOriginY: number(r, `parallaxoriginy`, `map`, 0),
		properties: properties(r.properties, `map.properties`),
		layers: Object.freeze(h),
		tilesets: Object.freeze([...n])
	});
}
function decodeTiledBase64(t, n, r) {
	if (!Number.isSafeInteger(n) || n <= 0 || n > require_tiled.tiledLimits.cells) throw new TiledError(r, `cell budget exceeded`);
	let i = tiledBase64Bytes(t, n * 4, r);
	if (i.byteLength !== n * 4) throw new TiledError(r, `decoded cell count mismatch`);
	let a = new DataView(i.buffer, i.byteOffset, i.byteLength);
	return Array.from({ length: n }, (e, t) => a.getUint32(t * 4, !0));
}
function tiledBase64Bytes(e, t, n) {
	if (e.length > Math.ceil(t / 3) * 4 + 4096) throw new TiledError(n, `encoded byte budget exceeded`);
	let r = e.replace(/\s/g, ``);
	if (r.length > Math.ceil(t / 3) * 4 || r.length % 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(r)) throw new TiledError(n, `invalid/budget-exceeding base64`);
	let i = atob(r);
	if (i.length > t) throw new TiledError(n, `decoded byte budget exceeded`);
	return Uint8Array.from(i, (e) => e.charCodeAt(0));
}
//#endregion
exports.TiledError = TiledError;
exports.decodeTiledBase64 = decodeTiledBase64;
exports.parseTiledMap = parseTiledMap;
exports.parseTiledTileset = parseTiledTileset;
exports.tiledBase64Bytes = tiledBase64Bytes;
exports.tiledRecord = tiledRecord;

//# sourceMappingURL=tiled-parser.cjs.map