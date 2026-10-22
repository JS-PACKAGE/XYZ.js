const require_assets = require("../../../src/data/assets.cjs");
const require_texture = require("../../assets/src/texture.cjs");
const require_rendering2d = require("../../../src/data/rendering2d.cjs");
const require_texture2d = require("../../assets/src/texture2d.cjs");
const require_sprite = require("./sprite.cjs");
const require_graphics2d = require("../../../src/data/graphics2d.cjs");
const require_text = require("../../../src/data/text.cjs");
const require_text_graphemes = require("./text-graphemes.cjs");
const require_text_layout = require("./text-layout.cjs");
//#region dist/packages/core/src/text2d.js
function snapshotTextStyle(e) {
	let t = {
		fontSize: e.fontSize ?? require_text.textDefaults.fontSize,
		fontFamily: e.fontFamily ?? require_text.textDefaults.fontFamily,
		fontFallback: e.fontFallback ?? require_text.textDefaults.fontFallback,
		direction: e.direction ?? require_text.textDefaults.direction,
		locale: e.locale ?? require_text.textDefaults.locale,
		fontReadiness: e.fontReadiness ?? require_text.textDefaults.fontReadiness,
		fontWeight: e.fontWeight ?? `normal`,
		fontStyle: e.fontStyle ?? `normal`,
		color: e.color ?? require_text.textDefaults.color,
		padding: e.padding ?? require_text.textDefaults.padding,
		wrapWidth: e.wrapWidth,
		breakWords: e.breakWords ?? !1,
		align: e.align ?? `left`,
		lineHeight: e.lineHeight ?? (e.fontSize ?? require_text.textDefaults.fontSize) * require_text.textDefaults.lineSpacing,
		letterSpacing: e.letterSpacing ?? 0,
		stroke: e.stroke && Object.freeze({ ...e.stroke }),
		shadow: e.shadow && Object.freeze({
			color: e.shadow.color,
			blur: e.shadow.blur ?? 0,
			offsetX: e.shadow.offsetX ?? 0,
			offsetY: e.shadow.offsetY ?? 0
		}),
		resolution: e.resolution ?? 1
	};
	if (![t.fontSize, t.lineHeight].every((e) => Number.isFinite(e) && e > 0 && e <= require_rendering2d.rendering2dLimits.coordinate) || !Number.isFinite(t.resolution) || t.resolution <= 0 || t.resolution > require_rendering2d.rendering2dLimits.resolution || !Number.isFinite(t.letterSpacing) || Math.abs(t.letterSpacing) > require_rendering2d.rendering2dLimits.coordinate || !Number.isSafeInteger(t.padding) || t.padding < 0 || t.padding > require_rendering2d.rendering2dLimits.coordinate) throw RangeError(`Invalid text size, spacing, padding or resolution.`);
	if (!t.fontFamily.trim() || !t.color || ![
		`normal`,
		`italic`,
		`oblique`
	].includes(t.fontStyle) || ![
		`left`,
		`center`,
		`right`,
		`start`,
		`end`
	].includes(t.align) || ![
		`ltr`,
		`rtl`,
		`auto`
	].includes(t.direction) || ![`wait`, `current`].includes(t.fontReadiness) || !t.fontFallback.trim() || t.locale !== `` && Intl.getCanonicalLocales(t.locale).length !== 1 || (typeof t.fontWeight == `number` ? !Number.isFinite(t.fontWeight) || t.fontWeight < 1 || t.fontWeight > 1e3 : !/^(normal|bold|bolder|lighter|[1-9]\d{0,2}|1000)$/.test(t.fontWeight))) throw RangeError(`Invalid text font or alignment.`);
	if (t.wrapWidth !== void 0 && (!Number.isFinite(t.wrapWidth) || t.wrapWidth <= 0 || t.wrapWidth > require_rendering2d.rendering2dLimits.coordinate)) throw RangeError(`wrapWidth must be positive, finite and bounded.`);
	if (t.stroke && (!t.stroke.color || !Number.isFinite(t.stroke.width) || t.stroke.width < 0 || t.stroke.width > require_rendering2d.rendering2dLimits.coordinate)) throw RangeError(`Invalid text stroke.`);
	if (t.shadow && (!t.shadow.color || ![
		t.shadow.blur,
		t.shadow.offsetX,
		t.shadow.offsetY
	].every((e) => Number.isFinite(e) && Math.abs(e) <= require_rendering2d.rendering2dLimits.coordinate) || t.shadow.blur < 0)) throw RangeError(`Invalid text shadow.`);
	return Object.freeze(t);
}
var Text2D = class Text2D extends require_sprite.Sprite {
	content;
	ownedTexture;
	displayedLayout;
	revision = 0;
	requestedText;
	requestedStyle;
	displayedStyle;
	constructor(e, t, n, r) {
		super({ view: new require_texture2d.TextureView2D(n, {
			frame: {
				x: 0,
				y: 0,
				width: n.width,
				height: n.height
			},
			resolution: t.resolution
		}) }), this.content = e, this.ownedTexture = n, this.displayedLayout = r, this.requestedText = e, this.requestedStyle = this.displayedStyle = t;
	}
	static async create(e, t = {}) {
		let n = snapshotTextStyle(t), { canvas: r, layout: i } = await Text2D.rasterizeCanvas(e, n), o;
		try {
			o = new require_texture2d.CanvasTexture2D(r);
		} finally {
			r.width = r.height = 0;
		}
		try {
			return new Text2D(e, n, o, i);
		} catch (e) {
			throw o.destroy(), e;
		}
	}
	get text() {
		return this.content;
	}
	get style() {
		return this.displayedStyle;
	}
	get layout() {
		return this.displayedLayout;
	}
	async refreshFonts() {
		if (this.destroyed) throw new require_texture.AssetError(`Cannot update destroyed Text2D.`);
		await this.refresh(!0);
	}
	async setText(e) {
		if (Text2D.validateText(e), this.destroyed) throw new require_texture.AssetError(`Cannot update destroyed Text2D.`);
		this.requestedText = e, await this.refresh();
	}
	async setStyle(e) {
		let t = snapshotTextStyle({
			...this.requestedStyle,
			...e
		});
		if (this.destroyed) throw new require_texture.AssetError(`Cannot update destroyed Text2D.`);
		this.requestedStyle = t, await this.refresh();
	}
	async refresh(e = !1) {
		let t = ++this.revision, n = this.requestedText, r = this.requestedStyle;
		if (!e && n === this.content && r === this.displayedStyle) return;
		let i;
		try {
			i = await Text2D.rasterizeCanvas(n, r);
		} catch (e) {
			throw t === this.revision && (this.requestedText = this.content, this.requestedStyle = this.displayedStyle), e;
		}
		let { canvas: a, layout: o } = i;
		if (this.destroyed || t !== this.revision) {
			a.width = a.height = 0;
			return;
		}
		let c = this.ownedTexture;
		try {
			c.adopt(a);
		} catch (e) {
			throw a.width = a.height = 0, e;
		}
		this.view = new require_texture2d.TextureView2D(c, {
			frame: {
				x: 0,
				y: 0,
				width: c.width,
				height: c.height
			},
			resolution: r.resolution
		}), this.content = n, this.displayedStyle = r, this.displayedLayout = o;
	}
	onDestroy() {
		this.revision++, this.ownedTexture.destroy();
	}
	static validateText(e) {
		if (typeof e != `string` || e.length > require_graphics2d.graphics2dLimits.textCodeUnits) throw RangeError(`Text exceeds its input budget.`);
	}
	static async rasterize(e, t) {
		Text2D.validateText(e), t.fontReadiness === `wait` && document.fonts && await require_text_layout.waitForTextFonts(e, t);
		let { canvas: n, layout: r } = Text2D.drawText(e, t);
		try {
			return {
				texture: await require_texture.Texture.fromImage(n),
				layout: r
			};
		} finally {
			n.width = n.height = 0;
		}
	}
	static async rasterizeCanvas(e, t) {
		return Text2D.validateText(e), t.fontReadiness === `wait` && document.fonts && await require_text_layout.waitForTextFonts(e, t), Text2D.drawText(e, t);
	}
	static drawText(t, n) {
		let r = document.createElement(`canvas`);
		r.lang = n.locale, r.width = r.height = 1;
		let a = r.getContext(`2d`);
		if (!a) throw new require_texture.AssetError(`Canvas2D is required to rasterize text.`);
		let o = require_text_layout.textFont(n), configure = () => {
			if (a.font = o, a.textAlign = `left`, a.textBaseline = `alphabetic`, a.fontKerning = `auto`, `letterSpacing` in a) a.letterSpacing = `${n.letterSpacing}px`;
			else if (n.letterSpacing !== 0) throw new require_texture.AssetError(`Native Canvas letterSpacing is required for shaped spaced text.`);
		};
		configure();
		let s = [], c = [];
		for (let e of t.split(/\r\n|\r|\n/)) {
			let t = require_text_layout.paragraphDirection(e, n);
			a.direction = t;
			let pushLine = (e) => {
				s.push(e), c.push(t);
			};
			if (n.wrapWidth === void 0) {
				pushLine(e);
				continue;
			}
			let r = ``;
			for (let t of e.match(/\S+|\s+/gu) ?? []) if (r && a.measureText(r + t).width > n.wrapWidth && (pushLine(r.trimEnd()), r = ``), r || !/^\s+$/u.test(t)) {
				if (n.breakWords && a.measureText(t).width > n.wrapWidth) {
					let e = require_text_graphemes.graphemeBoundaries(t, n.locale);
					for (let i = 1; i < e.length; i++) {
						let o = t.slice(e[i - 1], e[i]);
						r && a.measureText(r + o).width > n.wrapWidth && (pushLine(r), r = ``), r += o;
					}
				} else r += t;
			}
			pushLine(r.trimEnd());
		}
		let d = s.map((e, t) => (a.direction = c[t], a.measureText(e).width)), p = n.wrapWidth ?? Math.max(0, ...d), m = d.map((e, t) => {
			let r = n.align === `right` || n.align === `start` && c[t] === `rtl` || n.align === `end` && c[t] === `ltr`;
			return n.align === `center` ? (p - e) / 2 : r ? p - e : 0;
		}), h = 0, g = p, _ = -n.fontSize, v = (s.length - 1) * n.lineHeight + n.fontSize * .25;
		for (let e = 0; e < s.length; e++) {
			a.direction = c[e];
			let t = a.measureText(s[e]);
			h = Math.min(h, m[e] - t.actualBoundingBoxLeft), g = Math.max(g, m[e] + Math.max(t.width, t.actualBoundingBoxRight)), _ = Math.min(_, e * n.lineHeight - t.actualBoundingBoxAscent), v = Math.max(v, e * n.lineHeight + t.actualBoundingBoxDescent);
		}
		let y = (n.stroke?.width ?? 0) / 2, b = n.shadow, x = (b?.blur ?? 0) * 3, S = y + Math.max(0, x - (b?.offsetX ?? 0)), C = y + Math.max(0, x + (b?.offsetX ?? 0)), w = y + Math.max(0, x - (b?.offsetY ?? 0)), T = y + Math.max(0, x + (b?.offsetY ?? 0)), E = Math.max(1, Math.ceil((g - h + n.padding * 2 + S + C) * n.resolution)), D = Math.max(1, Math.ceil((v - _ + n.padding * 2 + w + T) * n.resolution));
		if (!Number.isSafeInteger(E) || !Number.isSafeInteger(D) || E > require_assets.assetLimits.textureDimension || D > require_assets.assetLimits.textureDimension || E * D > require_assets.assetLimits.texturePixels) throw new require_texture.AssetError(`Text exceeds the texture resource budget.`);
		r.width = E, r.height = D, a.scale(n.resolution, n.resolution), configure(), a.fillStyle = n.color, n.stroke && (a.strokeStyle = n.stroke.color, a.lineWidth = n.stroke.width, a.lineJoin = `round`), b && (a.shadowColor = b.color, a.shadowBlur = b.blur * n.resolution, a.shadowOffsetX = b.offsetX * n.resolution, a.shadowOffsetY = b.offsetY * n.resolution);
		let O = [];
		for (let e = 0; e < s.length; e++) {
			let t = n.padding + S - h + m[e], r = n.padding + w - _ + e * n.lineHeight;
			a.direction = c[e], O.push(Object.freeze({
				text: s[e],
				direction: c[e],
				x: t,
				baseline: r,
				width: d[e]
			})), n.stroke && n.stroke.width && a.strokeText(s[e], t, r), a.fillText(s[e], t, r);
		}
		return {
			canvas: r,
			layout: Object.freeze({
				lines: Object.freeze(O),
				width: E / n.resolution,
				height: D / n.resolution,
				fontReadiness: document.fonts ? n.fontReadiness === `wait` ? `ready` : `current` : `unavailable`
			})
		};
	}
};
//#endregion
exports.Text2D = Text2D;
exports.snapshotTextStyle = snapshotTextStyle;

//# sourceMappingURL=text2d.cjs.map