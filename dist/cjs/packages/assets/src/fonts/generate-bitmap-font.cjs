const require_texture = require("../texture.cjs");
const require_subscribe_load = require("../preload/subscribe-load.cjs");
const require_rendering2d = require("../../../../src/data/rendering2d.cjs");
const require_bitmap_font = require("./bitmap-font.cjs");
//#region dist/packages/assets/src/fonts/generate-bitmap-font.js
async function generateBitmapFont(a, o) {
	let s = o.signal;
	if (s?.throwIfAborted(), a.destroyed) throw new require_texture.AssetError(`Cannot generate from a destroyed FontAsset.`);
	if (typeof o.alphabet != `string` || o.alphabet.length > require_rendering2d.rendering2dLimits.fontGlyphs * 2) throw RangeError(`Alphabet exceeds its code-point budget.`);
	let c = Array.from(o.alphabet), l = o.pageSize ?? 512, u = o.padding ?? 1;
	if (!c.length || c.length > require_rendering2d.rendering2dLimits.fontGlyphs || new Set(c).size !== c.length || c.some((e) => e === `
` || e === `\r` || e.codePointAt(0) >= 55296 && e.codePointAt(0) <= 57343)) throw RangeError(`Alphabet must contain unique bounded Unicode scalar glyphs.`);
	if (!Number.isFinite(o.fontSize) || o.fontSize <= 0 || o.fontSize > require_rendering2d.rendering2dLimits.coordinate || !Number.isSafeInteger(l) || l < 1 || l > require_rendering2d.rendering2dLimits.targetDimension || l * l > require_rendering2d.rendering2dLimits.targetPixels || !Number.isSafeInteger(u) || u < 0 || u * 2 >= l) throw RangeError(`Invalid dynamic font dimensions.`);
	if (![
		`normal`,
		`italic`,
		`oblique`
	].includes(o.fontStyle ?? `normal`) || (typeof o.fontWeight == `number` ? !Number.isFinite(o.fontWeight) || o.fontWeight < 1 || o.fontWeight > 1e3 : !/^(normal|bold|bolder|lighter|[1-9]\d{0,2}|1000)$/u.test(o.fontWeight ?? `normal`))) throw RangeError(`Invalid dynamic font style or weight.`);
	if (o.kerning && c.length * c.length > require_rendering2d.rendering2dLimits.atlasFrames) throw RangeError(`Dynamic kerning pairs exceed their measurement budget.`);
	if (await require_subscribe_load.subscribeLoad(a.ready, s), s?.throwIfAborted(), a.destroyed) throw new require_texture.AssetError(`FontAsset was destroyed during generation.`);
	let d = document.createElement(`canvas`), f = d.getContext(`2d`);
	if (!f) throw new require_texture.AssetError(`Canvas2D is required for RGBA font generation.`);
	if (o.color !== void 0 && (typeof o.color != `string` || !CSS.supports(`color`, o.color))) throw RangeError(`Invalid dynamic font color.`);
	let p = [], m = [];
	try {
		let r = `${o.fontStyle ?? `normal`} ${o.fontWeight ?? `normal`} ${o.fontSize}px "${a.family}"`;
		f.font = r, f.textBaseline = `alphabetic`;
		let d = c.map((e) => f.measureText(e)), h = Math.ceil(o.fontSize), g = Math.ceil(o.fontSize * .25);
		for (let e of d) h = Math.max(h, Math.ceil(e.actualBoundingBoxAscent)), g = Math.max(g, Math.ceil(e.actualBoundingBoxDescent));
		let _ = [], v = u, y = u, b = 0, x, addPage = () => {
			if (p.length >= require_rendering2d.rendering2dLimits.fontPages) throw new require_texture.AssetError(`Generated font exceeds its page budget.`);
			let n = document.createElement(`canvas`);
			n.width = n.height = l, p.push(n);
			let i = n.getContext(`2d`);
			if (!i) throw new require_texture.AssetError(`Canvas2D is required for RGBA font generation.`);
			i.font = r, i.textBaseline = `alphabetic`, i.fillStyle = o.color ?? `#ffffff`, x = i, v = u, y = u, b = 0;
		};
		addPage();
		for (let e = 0; e < c.length; e++) {
			s?.throwIfAborted();
			let n = d[e], r = Math.ceil(n.actualBoundingBoxLeft), i = Math.ceil(n.actualBoundingBoxRight), a = Math.ceil(n.actualBoundingBoxAscent), o = Math.ceil(n.actualBoundingBoxDescent), f = Math.max(0, r + i), m = Math.max(0, a + o);
			if (f + u * 2 > l || m + u * 2 > l) throw new require_texture.AssetError(`A generated glyph exceeds its atlas page.`);
			f && m && (v + f + u > l && (v = u, y += b + u * 2, b = 0), y + m + u > l && addPage(), x.fillText(c[e], v + r, y + a)), _.push({
				id: c[e].codePointAt(0),
				page: p.length - 1,
				x: v,
				y,
				width: f,
				height: m,
				xoffset: -r,
				yoffset: h - a,
				xadvance: n.width
			}), f && m && (v += f + u * 2, b = Math.max(b, m));
		}
		let S = [];
		if (o.kerning) for (let e = 0; e < c.length; e++) for (let t = 0; t < c.length; t++) {
			let n = f.measureText(c[e] + c[t]).width - d[e].width - d[t].width;
			Math.abs(n) > 1e-6 && S.push({
				first: c[e].codePointAt(0),
				second: c[t].codePointAt(0),
				amount: n
			});
		}
		for (let e of p) if (s?.throwIfAborted(), m.push(await require_texture.Texture.fromImage(e)), a.destroyed) throw new require_texture.AssetError(`FontAsset was destroyed during generation.`);
		return s?.throwIfAborted(), new require_bitmap_font.BitmapFontAsset(m, {
			size: o.fontSize,
			lineHeight: h + g,
			base: h,
			glyphs: _,
			kernings: S
		});
	} catch (e) {
		for (let e of m) e.destroy();
		throw e;
	} finally {
		d.width = d.height = 0;
		for (let e of p) e.width = e.height = 0;
	}
}
//#endregion
exports.generateBitmapFont = generateBitmapFont;

//# sourceMappingURL=generate-bitmap-font.cjs.map