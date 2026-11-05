const require_texture = require("../../../assets/src/texture.cjs");
const require_texture2d = require("../../../assets/src/texture2d.cjs");
const require_contracts = require("../gameplay/contracts.cjs");
const require_sprite = require("../sprite.cjs");
const require_group2d = require("../gameplay/group2d.cjs");
const require_graphics2d = require("../../../../src/data/graphics2d.cjs");
const require_sprite_sheet = require("./sprite-sheet.cjs");
//#region dist/packages/core/src/graphics2d/nine-slice.js
var NineSlice = class NineSlice extends require_group2d.Group2D {
	texture;
	source;
	atlasView;
	margins;
	mode;
	drawCenter;
	pool = [];
	destinationWidth = 0;
	destinationHeight = 0;
	constructor(e, t) {
		if (super(), this.texture = e, this.atlasView = t.view, this.atlasView) {
			if (this.atlasView.validate(), this.atlasView.source !== e || t.source) throw RangeError(`NineSlice view must borrow its texture and cannot be combined with source.`);
			this.source = Object.freeze({
				x: 0,
				y: 0,
				width: this.atlasView.originalSize[0],
				height: this.atlasView.originalSize[1]
			});
		} else this.source = require_sprite_sheet.validatedRegion(e, t.source ?? {
			x: 0,
			y: 0,
			width: e.width,
			height: e.height
		});
		if (this.margins = [
			t.left,
			t.right,
			t.top,
			t.bottom
		], !this.margins.every((e) => Number.isFinite(e) && e >= 0 && (this.atlasView !== void 0 || Number.isInteger(e))) || t.left + t.right > this.source.width || t.top + t.bottom > this.source.height) throw RangeError(`NineSlice margins must be nonnegative source pixels within the source.`);
		if (this.mode = t.mode ?? `stretch`, this.drawCenter = t.drawCenter ?? !0, ![
			`stretch`,
			`tile`,
			`tile-fit`
		].includes(this.mode)) throw RangeError(`Invalid NineSlice mode.`);
		this.resize(t.width, t.height);
	}
	static fromView(e, t) {
		if (!e.defaultBorders) throw RangeError(`NineSlice.fromView requires atlas border metadata.`);
		return new NineSlice(e.source, {
			...t,
			...e.defaultBorders,
			view: e
		});
	}
	get width() {
		return this.destinationWidth;
	}
	get height() {
		return this.destinationHeight;
	}
	resize(i, o) {
		if (this.destroyed) throw Error(`Cannot resize destroyed NineSlice.`);
		if (this.texture.destroyed) throw new require_texture.AssetError(`Cannot use a destroyed Texture.`);
		if (this.atlasView?.validate(), this.atlasView || require_contracts.validateSource(this.source, this.texture.width, this.texture.height), ![i, o].every((e) => Number.isFinite(e) && e >= 0 && e <= require_graphics2d.graphics2dLimits.dimension)) throw RangeError(`NineSlice destination exceeds its size budget.`);
		let s = this.atlasView?.resolution ?? 1, [c, l, u, d] = this.margins, [f, p, m, h] = this.margins.map((e) => e / s), g = f + p > i ? i / (f + p) : 1, _ = m + h > o ? o / (m + h) : 1, v = [
			c,
			this.source.width - c - l,
			l
		], y = [
			u,
			this.source.height - u - d,
			d
		], b = [
			f * g,
			Math.max(0, i - (f + p) * g),
			p * g
		], x = [
			m * _,
			Math.max(0, o - (m + h) * _),
			h * _
		], S = [], C = this.source.y, w = 0;
		for (let e = 0; e < 3; e++) {
			let t = this.source.x, r = 0;
			for (let i = 0; i < 3; i++) {
				let a = v[i], o = y[e], c = b[i], l = x[e];
				if ((e !== 1 || i !== 1 || this.drawCenter) && a > 0 && o > 0 && c > 0 && l > 0) {
					let u = this.mode !== `stretch` && i === 1, d = this.mode !== `stretch` && e === 1, f = u ? Math.max(1, Math.ceil(c / (a / s))) : 1, p = d ? Math.max(1, Math.ceil(l / (o / s))) : 1;
					if (S.length + f * p > require_graphics2d.graphics2dLimits.tiles) throw RangeError(`NineSlice exceeds its tile budget.`);
					let m = u && this.mode === `tile` ? a / s : c / f, h = d && this.mode === `tile` ? o / s : l / p;
					for (let e = 0; e < p; e++) for (let n = 0; n < f; n++) {
						let i = Math.min(m, c - n * m), f = Math.min(h, l - e * h);
						S.push({
							source: {
								x: t,
								y: C,
								width: u && this.mode === `tile` ? i * s : a,
								height: d && this.mode === `tile` ? f * s : o
							},
							x: r + n * m,
							y: w + e * h,
							width: i,
							height: f
						});
					}
				}
				t += a, r += c;
			}
			C += y[e], w += x[e];
		}
		if (this.atlasView) {
			let e = this.atlasView, n = S.length;
			for (let r = S.length - 1; r >= 0; r--) {
				let i = S[r], a = i.source, o = Math.max(a.x, e.trim.x), c = Math.max(a.y, e.trim.y), l = Math.min(a.x + a.width, e.trim.x + e.trim.width), u = Math.min(a.y + a.height, e.trim.y + e.trim.height);
				if (l <= o || u <= c) continue;
				let d = l - o, f = u - c, p = o - e.trim.x, m = c - e.trim.y, h = e.rotation === 90 ? {
					x: e.frame.x + e.trim.height - m - f,
					y: e.frame.y + p,
					width: f,
					height: d
				} : {
					x: e.frame.x + p,
					y: e.frame.y + m,
					width: d,
					height: f
				};
				i.view = new require_texture2d.TextureView2D(this.texture, {
					frame: h,
					rotation: e.rotation,
					resolution: s,
					originalSize: [a.width, a.height],
					trim: {
						x: o - a.x,
						y: c - a.y,
						width: d,
						height: f
					}
				}), S[--n] = i;
			}
			S.copyWithin(0, n), S.length -= n;
		}
		let T = [];
		try {
			for (let e = this.pool.length; e < S.length; e++) T.push(new require_sprite.Sprite({
				texture: this.texture,
				...S[e].view ? { view: S[e].view } : { source: S[e].source },
				anchor: [0, 0]
			}));
		} catch (e) {
			for (let e of T) e.destroy();
			throw e;
		}
		for (let e of T) this.add(e), this.pool.push(e);
		for (let e = 0; e < this.pool.length; e++) {
			let t = this.pool[e], n = S[e];
			t.visible = n !== void 0, n && (n.view ? t.view = n.view : t.source = n.source, t.position.set(n.x, n.y), t.scale.set(n.width / (n.source.width / s), n.height / (n.source.height / s)));
		}
		this.destinationWidth = i, this.destinationHeight = o;
	}
};
//#endregion
exports.NineSlice = NineSlice;

//# sourceMappingURL=nine-slice.cjs.map