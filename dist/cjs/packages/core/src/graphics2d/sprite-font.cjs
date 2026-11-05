const require_texture = require("../../../assets/src/texture.cjs");
const require_sprite = require("../sprite.cjs");
const require_group2d = require("../gameplay/group2d.cjs");
const require_graphics2d = require("../../../../src/data/graphics2d.cjs");
const require_sprite_sheet = require("./sprite-sheet.cjs");
//#region dist/packages/core/src/graphics2d/sprite-font.js
var a = 1114112;
var SpriteFont = class {
	sheet;
	glyphWidth;
	advance;
	lineHeight;
	caseInsensitive;
	indices = /* @__PURE__ */ new Map();
	metrics;
	kernings = /* @__PURE__ */ new Map();
	pages;
	fallbackIndex;
	asset;
	constructor(n, r = {}) {
		if (this.caseInsensitive = r.caseInsensitive ?? !1, n instanceof require_sprite_sheet.SpriteSheet) {
			if (r.alphabet === void 0 || r.lineHeight === void 0) throw RangeError(`A sheet font requires an alphabet and lineHeight.`);
			let e = Array.from(r.alphabet);
			if (!e.length || e.length !== n.frames.length) throw RangeError(`Alphabet must map each sheet frame exactly once.`);
			this.sheet = n, this.glyphWidth = r.glyphWidth, this.advance = r.advance ?? r.glyphWidth ?? n.frames[0].width, this.lineHeight = r.lineHeight;
			for (let e of [
				this.advance,
				this.lineHeight,
				...this.glyphWidth === void 0 ? [] : [this.glyphWidth]
			]) if (!Number.isFinite(e) || e <= 0 || e > require_graphics2d.graphics2dLimits.dimension) throw RangeError(`Font metrics must be positive finite bounded values.`);
			this.metrics = Object.freeze(e.map((e, t) => {
				this.map(e, t);
				let r = n.getFrame(t);
				return Object.freeze({
					id: e.codePointAt(0),
					texture: n.texture,
					source: r,
					width: this.glyphWidth ?? r.width,
					xoffset: 0,
					yoffset: 0,
					advance: this.advance
				});
			}));
		} else {
			if (n.destroyed) throw new require_texture.AssetError(`Cannot use a destroyed bitmap font.`);
			this.asset = n, this.lineHeight = n.lineHeight, this.advance = n.glyphs[0].xadvance, this.metrics = Object.freeze(n.glyphs.map((e, t) => (this.map(String.fromCodePoint(e.id), t), Object.freeze({
				id: e.id,
				texture: n.pages[e.page],
				source: Object.freeze({
					x: e.x,
					y: e.y,
					width: e.width,
					height: e.height
				}),
				width: e.width,
				xoffset: e.xoffset,
				yoffset: e.yoffset,
				advance: e.xadvance
			}))));
			for (let e of n.kernings) this.kernings.set(e.first * a + e.second, e.amount);
		}
		if (r.fallback !== void 0) {
			if (Array.from(r.fallback).length !== 1) throw RangeError(`Fallback must be one mapped Unicode code point.`);
			if (this.fallbackIndex = this.indices.get(this.key(r.fallback)), this.fallbackIndex === void 0) throw RangeError(`Fallback glyph is not mapped.`);
		}
		this.pages = [...new Set(this.metrics.map((e) => e.texture))], this.assertAvailable();
	}
	key(e) {
		return this.caseInsensitive ? e.toLowerCase() : e;
	}
	map(e, t) {
		let n = this.key(e), r = e.codePointAt(0);
		if (e === `
` || e === `\r` || r >= 55296 && r <= 57343 || this.indices.has(n)) throw RangeError(`Alphabet contains a duplicate, newline or non-scalar glyph.`);
		this.indices.set(n, t);
	}
	getGlyphIndex(e) {
		let t = this.indices.get(this.key(e)) ?? this.fallbackIndex;
		if (t === void 0) throw RangeError(`Unmapped font glyph: ${e}`);
		return t;
	}
	getGlyph(e) {
		let t = this.metrics[e];
		if (!t) throw RangeError(`Font glyph index is out of range.`);
		return t;
	}
	getKerning(e, t) {
		if (e === void 0) return 0;
		let n = this.metrics[e].id, r = this.metrics[t].id;
		return this.kernings.size === 0 ? 0 : this.kernings.get(n * a + r) ?? 0;
	}
	assertAvailable() {
		if (this.asset?.destroyed || this.pages.some((e) => e.destroyed)) throw new require_texture.AssetError(`Cannot use destroyed bitmap font pages.`);
	}
};
var SpriteText = class extends require_group2d.Group2D {
	font;
	content = ``;
	glyphs = [];
	letterSpacing;
	lineSpacing;
	align;
	wrapWidth;
	breakWords;
	constructor(e, n, r = {}) {
		if (super(), this.font = e, this.letterSpacing = r.letterSpacing ?? 0, this.lineSpacing = r.lineSpacing ?? 0, this.align = r.align ?? `left`, this.wrapWidth = r.wrapWidth, this.breakWords = r.breakWords ?? !1, ![this.letterSpacing, this.lineSpacing].every(Number.isFinite) || e.lineHeight + this.lineSpacing <= 0 || ![
			`left`,
			`center`,
			`right`
		].includes(this.align) || this.wrapWidth !== void 0 && (!Number.isFinite(this.wrapWidth) || this.wrapWidth <= 0 || this.wrapWidth > require_graphics2d.graphics2dLimits.dimension)) throw RangeError(`Invalid SpriteText spacing, alignment or wrapping.`);
		this.setText(n);
	}
	get text() {
		return this.content;
	}
	measure(e, t) {
		let n = 0, r = 0, i, a;
		for (let o of e) {
			let e = this.font.getGlyphIndex(o);
			t?.push(e);
			let s = this.font.getGlyph(e);
			a !== void 0 && (n += this.letterSpacing + this.font.getKerning(a, e)), i ??= e, r = n + (this.font.sheet ? s.width : s.advance), n += s.advance, a = e;
		}
		return {
			width: r,
			advance: n,
			first: i,
			last: a
		};
	}
	lines(e) {
		let t = [];
		for (let n of e.replace(/\r\n?/gu, `
`).split(`
`)) {
			if (this.wrapWidth === void 0) {
				t.push(n);
				continue;
			}
			let e = /* @__PURE__ */ new Map(), r = ``, i = 0, a, push = () => {
				t.push(r.trimEnd()), r = ``, i = 0, a = void 0;
			}, append = (e, t) => {
				a !== void 0 && t.first !== void 0 && (i += this.letterSpacing + this.font.getKerning(a, t.first)), i += t.advance, a = t.last, r += e;
			};
			for (let t of n.match(/\S+|\s+/gu) ?? []) {
				let n = e.get(t);
				n === void 0 && (n = this.measure(t), e.set(t, n));
				let o = a !== void 0 && n.first !== void 0 ? this.letterSpacing + this.font.getKerning(a, n.first) : 0;
				if (r && i + o + n.width > this.wrapWidth && push(), r || !/^\s+$/u.test(t)) {
					if (this.breakWords && n.width > this.wrapWidth) for (let e of t) {
						let t = this.measure(e), n = a === void 0 ? 0 : this.letterSpacing + this.font.getKerning(a, t.first);
						r && i + n + t.width > this.wrapWidth && push(), append(e, t);
					}
					else append(t, n);
				}
			}
			t.push(r.trimEnd());
		}
		return t;
	}
	setText(n) {
		if (this.destroyed) throw new require_texture.AssetError(`Cannot update destroyed SpriteText.`);
		if (typeof n != `string` || n.length > require_graphics2d.graphics2dLimits.textCodeUnits) throw RangeError(`SpriteText exceeds its input budget.`);
		this.font.assertAvailable();
		let i = 0;
		for (let e of n) if (e !== `\r` && e !== `
` && ++i > require_graphics2d.graphics2dLimits.glyphs) throw RangeError(`SpriteText exceeds its glyph budget.`);
		let a = this.lines(n), o = [];
		for (let e = 0; e < a.length; e++) {
			let n = a[e], r = [], i = this.measure(n, r).width, s = this.align === `center` ? -i / 2 : this.align === `right` ? -i : 0, c = 0, l, u = e * (this.font.lineHeight + this.lineSpacing);
			if (!Number.isFinite(u) || Math.abs(u) > require_graphics2d.graphics2dLimits.dimension) throw RangeError(`SpriteText layout exceeds its dimension budget.`);
			for (let e of r) {
				let n = this.font.getGlyph(e);
				l !== void 0 && (c += this.letterSpacing + this.font.getKerning(l, e));
				let r = s + c + n.xoffset, i = u + n.yoffset;
				if (![
					r,
					i,
					r + n.width,
					i + n.source.height
				].every((e) => Number.isFinite(e) && Math.abs(e) <= require_graphics2d.graphics2dLimits.dimension)) throw RangeError(`SpriteText layout exceeds its dimension budget.`);
				n.source.width && n.source.height && o.push({
					index: e,
					x: r,
					y: i
				}), c += n.advance, l = e;
			}
		}
		let s = [];
		try {
			for (let e = this.glyphs.length; e < o.length; e++) {
				let t = this.font.getGlyph(o[e].index);
				s.push(new require_sprite.Sprite({
					texture: t.texture,
					source: t.source,
					anchor: [0, 0]
				}));
			}
		} catch (e) {
			for (let e of s) e.destroy();
			throw e;
		}
		for (let e of s) this.add(e), this.glyphs.push(e);
		for (let e = 0; e < o.length; e++) {
			let t = this.glyphs[e], n = o[e], r = this.font.getGlyph(n.index);
			t.texture !== r.texture && (t.source = void 0, t.texture = r.texture), t.source = r.source, t.position.set(n.x, n.y), t.scale.set(r.width / r.source.width, 1);
		}
		for (; this.glyphs.length > o.length;) {
			let e = this.glyphs.pop();
			this.remove(e), e.destroy();
		}
		this.content = n;
	}
};
//#endregion
exports.SpriteFont = SpriteFont;
exports.SpriteText = SpriteText;

//# sourceMappingURL=sprite-font.cjs.map