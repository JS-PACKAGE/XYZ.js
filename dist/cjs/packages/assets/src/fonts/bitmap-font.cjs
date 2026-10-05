const require_texture = require("../texture.cjs");
const require_rendering2d = require("../../../../src/data/rendering2d.cjs");
const require_distance_field = require("./distance-field.cjs");
//#region dist/packages/assets/src/fonts/bitmap-font.js
var BitmapFontAsset = class {
	size;
	lineHeight;
	base;
	glyphs;
	kernings;
	pages;
	distanceField;
	disposed = !1;
	constructor(e, r) {
		if (validate(r, e.length), e.some((e) => e.destroyed)) throw new require_texture.AssetError(`Bitmap font page is destroyed.`);
		for (let n of r.glyphs) {
			let r = e[n.page];
			if (n.x + n.width > r.width || n.y + n.height > r.height) throw new require_texture.AssetError(`Bitmap glyph exceeds its page.`);
		}
		if (this.distanceField = r.distanceField ? Object.freeze({ ...r.distanceField }) : void 0, this.distanceField) for (let t of e) require_distance_field.registerTextureDistanceField(t, this.distanceField);
		this.pages = Object.freeze([...e]), this.size = r.size, this.lineHeight = r.lineHeight, this.base = r.base, this.glyphs = Object.freeze(r.glyphs.map((e) => Object.freeze({ ...e }))), this.kernings = Object.freeze(r.kernings.map((e) => Object.freeze({ ...e })));
	}
	get destroyed() {
		return this.disposed;
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			for (let e of this.pages) e.destroy();
		}
	}
};
function validate(n, r) {
	if (!n || !Array.isArray(n.glyphs) || !Array.isArray(n.kernings) || !Number.isInteger(r) || r < 1 || r > require_rendering2d.rendering2dLimits.fontPages || !n.glyphs.length || n.glyphs.length > require_rendering2d.rendering2dLimits.fontGlyphs || n.kernings.length > require_rendering2d.rendering2dLimits.atlasFrames) throw new require_texture.AssetError(`Bitmap font exceeds its page/glyph/kerning budget.`);
	if (![n.size, n.lineHeight].every((t) => Number.isFinite(t) && t > 0 && t <= require_rendering2d.rendering2dLimits.coordinate) || !Number.isFinite(n.base) || n.base < 0 || n.base > require_rendering2d.rendering2dLimits.coordinate) throw new require_texture.AssetError(`Invalid bitmap font metrics.`);
	let i = /* @__PURE__ */ new Set();
	for (let a of n.glyphs) {
		if (!a || typeof a != `object` || Array.isArray(a)) throw new require_texture.AssetError(`Invalid bitmap glyph record.`);
		if (!Number.isInteger(a.id) || a.id < 0 || a.id > 1114111 || a.id >= 55296 && a.id <= 57343 || i.has(a.id)) throw new require_texture.AssetError(`Glyph IDs must be unique Unicode scalar values.`);
		if (i.add(a.id), !Number.isInteger(a.page) || a.page < 0 || a.page >= r || ![
			a.x,
			a.y,
			a.width,
			a.height
		].every((t) => Number.isSafeInteger(t) && t >= 0 && t <= require_rendering2d.rendering2dLimits.targetDimension) || ![
			a.xoffset,
			a.yoffset,
			a.xadvance
		].every((t) => Number.isFinite(t) && Math.abs(t) <= require_rendering2d.rendering2dLimits.coordinate)) throw new require_texture.AssetError(`Invalid bitmap glyph metrics.`);
	}
	let a = /* @__PURE__ */ new Set();
	for (let r of n.kernings) {
		if (!r || typeof r != `object` || Array.isArray(r)) throw new require_texture.AssetError(`Invalid bitmap kerning record.`);
		let n = `${r.first}:${r.second}`;
		if (!i.has(r.first) || !i.has(r.second) || a.has(n) || !Number.isFinite(r.amount) || Math.abs(r.amount) > require_rendering2d.rendering2dLimits.coordinate) throw new require_texture.AssetError(`Invalid bitmap kerning pair.`);
		a.add(n);
	}
}
var BitmapFontLoader = class BitmapFontLoader {
	loader;
	constructor(e) {
		this.loader = e;
	}
	static parse(n, r = `text`) {
		if (typeof n != `string` || n.length > require_rendering2d.rendering2dLimits.fontBytes) throw new require_texture.AssetError(`Bitmap font descriptor exceeds its byte budget.`);
		let i = 0;
		for (let r of n) {
			let n = r.codePointAt(0);
			if (i += n <= 127 ? 1 : n <= 2047 ? 2 : n <= 65535 ? 3 : 4, i > require_rendering2d.rendering2dLimits.fontBytes) throw new require_texture.AssetError(`Bitmap font descriptor exceeds its byte budget.`);
		}
		let a;
		if (r === `json`) try {
			a = JSON.parse(n);
		} catch (e) {
			throw new require_texture.AssetError(`Invalid bitmap font JSON.`, { cause: e });
		}
		else if (r === `text`) {
			a = {
				pages: [],
				chars: [],
				kernings: []
			};
			let r = a.pages, i = a.chars, o = a.kernings;
			for (let s of n.split(/\r?\n/u)) {
				if (!s.trim()) continue;
				let n = s.trim().split(/\s/u, 1)[0];
				if (![
					`info`,
					`common`,
					`page`,
					`chars`,
					`char`,
					`kernings`,
					`kerning`
				].includes(n)) throw new require_texture.AssetError(`Unsupported bitmap font record.`);
				let c = {};
				for (let e of s.matchAll(/(\w+)=(?:"([^"\r\n]*)"|([^\s]+))/gu)) c[e[1]] = e[2] ?? Number(e[3]);
				if ((n === `info` || n === `common`) && (a[n] = c), n === `page`) {
					let n = c.id;
					if (!Number.isInteger(n) || n < 0 || n >= require_rendering2d.rendering2dLimits.fontPages || r[n] !== void 0 || typeof c.file != `string`) throw new require_texture.AssetError(`Invalid bitmap page record.`);
					r[n] = c.file;
				}
				if (n === `char` && i.push(c), n === `kerning` && o.push(c), i.length > require_rendering2d.rendering2dLimits.fontGlyphs || o.length > require_rendering2d.rendering2dLimits.atlasFrames) throw new require_texture.AssetError(`Bitmap font records exceed their budget.`);
			}
		} else throw new require_texture.AssetError(`Unsupported bitmap font format.`);
		if (!a || typeof a != `object` || Array.isArray(a)) throw new require_texture.AssetError(`Invalid bitmap font descriptor.`);
		let o = a.info, s = a.common;
		if (!o || typeof o != `object` || Array.isArray(o) || !s || typeof s != `object` || Array.isArray(s) || s.packed !== void 0 && s.packed !== 0 || !Number.isSafeInteger(o.size) || o.size === 0 || !Array.isArray(a.pages) || !Array.isArray(a.chars) || a.kernings !== void 0 && !Array.isArray(a.kernings)) throw new require_texture.AssetError(`Invalid or packed bitmap font descriptor.`);
		let c = a.pages;
		if (c.some((e) => typeof e != `string` || !e.trim()) || Array.from({ length: c.length }, (e, t) => c[t]).some((e) => e === void 0) || s.pages !== c.length) throw new require_texture.AssetError(`Bitmap pages must be contiguous nonempty filenames.`);
		let l = a.chars.map((e) => {
			if (!e || typeof e != `object` || Array.isArray(e) || e.chnl !== void 0 && e.chnl !== 15) throw new require_texture.AssetError(`Channel-packed bitmap glyphs are unsupported.`);
			let n = Object.fromEntries([
				`id`,
				`page`,
				`x`,
				`y`,
				`width`,
				`height`,
				`xoffset`,
				`yoffset`,
				`xadvance`
			].map((t) => [t, e[t]]));
			if (!Object.values(n).every(Number.isSafeInteger)) throw new require_texture.AssetError(`AngelCode metrics must be integer values.`);
			return n;
		}), u = (a.kernings ?? []).map((e) => {
			if (!e || typeof e != `object` || Array.isArray(e) || ![
				e.first,
				e.second,
				e.amount
			].every(Number.isSafeInteger)) throw new require_texture.AssetError(`Invalid integer bitmap kerning record.`);
			return {
				first: e.first,
				second: e.second,
				amount: e.amount
			};
		}), d;
		if (a.distanceField !== void 0) {
			let e = a.distanceField;
			if (!e || typeof e != `object` || Array.isArray(e) || ![`sdf`, `msdf`].includes(e.fieldType) || typeof e.distanceRange != `number` || !Number.isFinite(e.distanceRange) || e.distanceRange < 1 || e.distanceRange > 256) throw new require_texture.AssetError(`Invalid distance-field descriptor.`);
			d = {
				type: e.fieldType,
				range: e.distanceRange
			};
		}
		let f = {
			size: Math.abs(o.size),
			lineHeight: s.lineHeight,
			base: s.base,
			glyphs: l,
			kernings: u,
			pages: c,
			width: s.scaleW,
			height: s.scaleH,
			distanceField: d
		};
		if (validate(f, c.length), ![f.width, f.height].every((t) => Number.isSafeInteger(t) && t > 0 && t <= require_rendering2d.rendering2dLimits.targetDimension) || f.width * f.height > require_rendering2d.rendering2dLimits.targetPixels) throw new require_texture.AssetError(`Bitmap page dimensions exceed their budget.`);
		for (let e of l) if (e.x + e.width > f.width || e.y + e.height > f.height) throw new require_texture.AssetError(`Bitmap glyph exceeds declared dimensions.`);
		return f;
	}
	async load(n, r = {}) {
		let i = await this.loader.loadText(n, {
			signal: r.signal,
			maxBytes: require_rendering2d.rendering2dLimits.fontBytes
		}), a = r.format ?? (/\.json(?:[?#]|$)/iu.test(n) ? `json` : `text`), o = BitmapFontLoader.parse(i, a), s = new URL(n, typeof document < `u` ? document.baseURI : void 0), c = [];
		try {
			for (let e of o.pages) {
				r.signal?.throwIfAborted();
				let n = await this.loader.loadTextureOwned(new URL(e, s).href, { signal: r.signal });
				if (c.push(n), n.width !== o.width || n.height !== o.height) throw new require_texture.AssetError(`Bitmap page size differs from descriptor.`);
			}
			return r.signal?.throwIfAborted(), new BitmapFontAsset(c, o);
		} catch (e) {
			for (let e of c) e.destroy();
			throw e;
		}
	}
};
//#endregion
exports.BitmapFontAsset = BitmapFontAsset;
exports.BitmapFontLoader = BitmapFontLoader;

//# sourceMappingURL=bitmap-font.cjs.map