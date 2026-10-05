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
		let n = snapshotTextStyle(t), r = await Text2D.rasterize(e, n);
		return new Text2D(e, n, r.texture, r.layout);
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
			i = await Text2D.rasterize(n, r);
		} catch (e) {
			throw t === this.revision && (this.requestedText = this.content, this.requestedStyle = this.displayedStyle), e;
		}
		let { texture: a, layout: s } = i;
		if (this.destroyed || t !== this.revision) {
			a.destroy();
			return;
		}
		let c = this.ownedTexture;
		this.view = new require_texture2d.TextureView2D(a, {
			frame: {
				x: 0,
				y: 0,
				width: a.width,
				height: a.height
			},
			resolution: r.resolution
		}), this.ownedTexture = a, this.content = n, this.displayedStyle = r, this.displayedLayout = s, c.destroy();
	}
	onDestroy() {
		this.revision++, this.ownedTexture.destroy();
	}
	static validateText(e) {
		if (typeof e != `string` || e.length > require_graphics2d.graphics2dLimits.textCodeUnits) throw RangeError(`Text exceeds its input budget.`);
	}
	static async rasterize(t, n) {
		Text2D.validateText(t), n.fontReadiness === `wait` && document.fonts && await require_text_layout.waitForTextFonts(t, n);
		let r = document.createElement(`canvas`);
		r.lang = n.locale, r.width = r.height = 1;
		let o = r.getContext(`2d`);
		if (!o) throw new require_texture.AssetError(`Canvas2D is required to rasterize text.`);
		let s = require_text_layout.textFont(n), configure = () => {
			if (o.font = s, o.textAlign = `left`, o.textBaseline = `alphabetic`, o.fontKerning = `auto`, `letterSpacing` in o) o.letterSpacing = `${n.letterSpacing}px`;
			else if (n.letterSpacing !== 0) throw new require_texture.AssetError(`Native Canvas letterSpacing is required for shaped spaced text.`);
		};
		configure();
		let f = [], p = [];
		for (let e of t.split(/\r\n|\r|\n/)) {
			let t = require_text_layout.paragraphDirection(e, n);
			o.direction = t;
			let pushLine = (e) => {
				f.push(e), p.push(t);
			};
			if (n.wrapWidth === void 0) {
				pushLine(e);
				continue;
			}
			let r = ``;
			for (let t of e.match(/\S+|\s+/gu) ?? []) if (r && o.measureText(r + t).width > n.wrapWidth && (pushLine(r.trimEnd()), r = ``), r || !/^\s+$/u.test(t)) {
				if (n.breakWords && o.measureText(t).width > n.wrapWidth) {
					let e = require_text_graphemes.graphemeBoundaries(t, n.locale);
					for (let i = 1; i < e.length; i++) {
						let a = t.slice(e[i - 1], e[i]);
						r && o.measureText(r + a).width > n.wrapWidth && (pushLine(r), r = ``), r += a;
					}
				} else r += t;
			}
			pushLine(r.trimEnd());
		}
		let m = f.map((e, t) => (o.direction = p[t], o.measureText(e).width)), h = n.wrapWidth ?? Math.max(0, ...m), g = m.map((e, t) => {
			let r = n.align === `right` || n.align === `start` && p[t] === `rtl` || n.align === `end` && p[t] === `ltr`;
			return n.align === `center` ? (h - e) / 2 : r ? h - e : 0;
		}), _ = 0, v = h, y = -n.fontSize, b = (f.length - 1) * n.lineHeight + n.fontSize * .25;
		for (let e = 0; e < f.length; e++) {
			o.direction = p[e];
			let t = o.measureText(f[e]);
			_ = Math.min(_, g[e] - t.actualBoundingBoxLeft), v = Math.max(v, g[e] + Math.max(t.width, t.actualBoundingBoxRight)), y = Math.min(y, e * n.lineHeight - t.actualBoundingBoxAscent), b = Math.max(b, e * n.lineHeight + t.actualBoundingBoxDescent);
		}
		let x = (n.stroke?.width ?? 0) / 2, S = n.shadow, C = (S?.blur ?? 0) * 3, w = x + Math.max(0, C - (S?.offsetX ?? 0)), T = x + Math.max(0, C + (S?.offsetX ?? 0)), E = x + Math.max(0, C - (S?.offsetY ?? 0)), D = x + Math.max(0, C + (S?.offsetY ?? 0)), O = Math.max(1, Math.ceil((v - _ + n.padding * 2 + w + T) * n.resolution)), k = Math.max(1, Math.ceil((b - y + n.padding * 2 + E + D) * n.resolution));
		if (!Number.isSafeInteger(O) || !Number.isSafeInteger(k) || O > require_assets.assetLimits.textureDimension || k > require_assets.assetLimits.textureDimension || O * k > require_assets.assetLimits.texturePixels) throw new require_texture.AssetError(`Text exceeds the texture resource budget.`);
		r.width = O, r.height = k, o.scale(n.resolution, n.resolution), configure(), o.fillStyle = n.color, n.stroke && (o.strokeStyle = n.stroke.color, o.lineWidth = n.stroke.width, o.lineJoin = `round`), S && (o.shadowColor = S.color, o.shadowBlur = S.blur * n.resolution, o.shadowOffsetX = S.offsetX * n.resolution, o.shadowOffsetY = S.offsetY * n.resolution);
		let A = [];
		for (let e = 0; e < f.length; e++) {
			let t = n.padding + w - _ + g[e], r = n.padding + E - y + e * n.lineHeight;
			o.direction = p[e], A.push(Object.freeze({
				text: f[e],
				direction: p[e],
				x: t,
				baseline: r,
				width: m[e]
			})), n.stroke && n.stroke.width && o.strokeText(f[e], t, r), o.fillText(f[e], t, r);
		}
		try {
			return {
				texture: await require_texture.Texture.fromImage(r),
				layout: Object.freeze({
					lines: Object.freeze(A),
					width: O / n.resolution,
					height: k / n.resolution,
					fontReadiness: document.fonts ? n.fontReadiness === `wait` ? `ready` : `current` : `unavailable`
				})
			};
		} finally {
			r.width = r.height = 0;
		}
	}
};
//#endregion
exports.Text2D = Text2D;
exports.snapshotTextStyle = snapshotTextStyle;

//# sourceMappingURL=text2d.cjs.map