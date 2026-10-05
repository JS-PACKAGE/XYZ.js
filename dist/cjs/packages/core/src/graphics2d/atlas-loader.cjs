const require_texture = require("../../../assets/src/texture.cjs");
const require_rendering2d = require("../../../../src/data/rendering2d.cjs");
const require_texture2d = require("../../../assets/src/texture2d.cjs");
const require_index = require("../../../assets/src/index.cjs");
//#region dist/packages/core/src/graphics2d/atlas-loader.js
function record(t, n) {
	if (!t || typeof t != `object` || Array.isArray(t)) throw new require_texture.AssetError(`Invalid atlas ${n}.`);
	return t;
}
function rect(t, n) {
	let { x: r, y: i, w: a, h: o } = record(t, n);
	if (![
		r,
		i,
		a,
		o
	].every((e) => typeof e == `number` && Number.isInteger(e)) || r < 0 || i < 0 || a <= 0 || o <= 0) throw new require_texture.AssetError(`Atlas ${n} requires positive integer dimensions and nonnegative integer coordinates.`);
	return {
		x: r,
		y: i,
		width: a,
		height: o
	};
}
function url(t, n) {
	if (typeof t != `string` || !t.length) throw new require_texture.AssetError(`Atlas requires an image or metadata URL.`);
	let r = new URL(t, n);
	if (![
		`http:`,
		`https:`,
		`blob:`,
		`data:`
	].includes(r.protocol)) throw new require_texture.AssetError(`Unsupported atlas URL protocol.`);
	return r.hash = ``, r.href;
}
var AtlasLoader = class {
	baseURL;
	constructor(e) {
		this.baseURL = e;
	}
	async load(i, a = {}) {
		a.signal?.throwIfAborted();
		let o = url(i, this.baseURL ?? (typeof document < `u` ? document.baseURI : void 0) ?? (typeof location < `u` ? location.href : void 0)), s = new require_index.AssetLoader(), c = [], l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Set(), d = [o], f = /* @__PURE__ */ new Map(), p = 0;
		try {
			for (; d.length;) {
				let t = d.shift();
				if (u.has(t)) continue;
				if (u.add(t), u.size > require_rendering2d.rendering2dLimits.atlasPages) throw new require_texture.AssetError(`Atlas metadata exceeds its page budget.`);
				let n = record(await s.loadJSON(t, a), `document`), i = n.animations === void 0 ? {} : record(n.animations, `animations`);
				for (let [t, n] of Object.entries(i)) {
					if (l.has(t)) throw new require_texture.AssetError(`Duplicate atlas animation: ${t}.`);
					if (l.set(t, n), l.size > require_rendering2d.rendering2dLimits.atlasFrames) throw new require_texture.AssetError(`Atlas animation count exceeds its budget.`);
				}
				let o = n.textures === void 0 ? [n] : n.textures;
				if (!Array.isArray(o) || !o.length || o.length > require_rendering2d.rendering2dLimits.atlasPages) throw new require_texture.AssetError(`Invalid atlas multipage textures.`);
				for (let n of o) {
					let i = record(n, `page`), a = i.meta === void 0 ? {} : record(i.meta, `metadata`), o = a.scale ?? i.scale ?? 1;
					if (typeof o != `number` && typeof o != `string` || typeof o == `string` && !o.trim()) throw new require_texture.AssetError(`Invalid atlas resolution.`);
					let s = Number(o);
					if (!Number.isFinite(s) || s <= 0 || s > require_rendering2d.rendering2dLimits.resolution) throw new require_texture.AssetError(`Invalid atlas resolution.`);
					if (a.format !== void 0 && a.format !== `RGBA8888` && a.format !== `RGBA`) throw new require_texture.AssetError(`Unsupported atlas pixel format.`);
					let l = i.frames, u;
					if (Array.isArray(l)) {
						if (l.length > require_rendering2d.rendering2dLimits.atlasFrames) throw new require_texture.AssetError(`Atlas frame count exceeds its budget.`);
						u = l.map((t) => {
							let n = record(t, `frame`);
							if (typeof n.filename != `string` || !n.filename) throw new require_texture.AssetError(`Atlas array frames require filenames.`);
							return [n.filename, n];
						});
					} else {
						let t = Object.entries(record(l, `frames`));
						if (t.length > require_rendering2d.rendering2dLimits.atlasFrames) throw new require_texture.AssetError(`Atlas frame count exceeds its budget.`);
						u = t.map(([e, t]) => [e, record(t, `frame`)]);
					}
					if (p += u.length, !u.length || p > require_rendering2d.rendering2dLimits.atlasFrames || c.length >= require_rendering2d.rendering2dLimits.atlasPages) throw new require_texture.AssetError(`Atlas exceeds its page or frame budget.`);
					if (c.push({
						url: url(a.image ?? i.image, t),
						frames: u,
						resolution: s
					}), a.related_multi_packs !== void 0) {
						if (!Array.isArray(a.related_multi_packs) || a.related_multi_packs.length > require_rendering2d.rendering2dLimits.atlasPages) throw new require_texture.AssetError(`Invalid related atlas pages.`);
						for (let e of a.related_multi_packs) d.push(url(e, t));
					}
				}
			}
			let t = /* @__PURE__ */ new Map();
			for (let r of c) {
				a.signal?.throwIfAborted();
				let i = f.get(r.url);
				i || (i = await s.loadTextureOwned(r.url, a), f.set(r.url, i));
				for (let [a, o] of r.frames) {
					if (!a || t.has(a)) throw new require_texture.AssetError(`Duplicate or empty atlas frame: ${a}.`);
					if (o.rotated !== void 0 && typeof o.rotated != `boolean`) throw new require_texture.AssetError(`Atlas rotated must be boolean.`);
					if (o.trimmed !== void 0 && typeof o.trimmed != `boolean`) throw new require_texture.AssetError(`Atlas trimmed must be boolean.`);
					let s = {
						frame: rect(o.frame, `frame`),
						rotation: o.rotated ? 90 : 0,
						resolution: r.resolution
					};
					if (o.sourceSize !== void 0) {
						let t = record(o.sourceSize, `sourceSize`);
						if (![t.w, t.h].every((e) => typeof e == `number` && Number.isInteger(e))) throw new require_texture.AssetError(`Atlas original dimensions must be integer pixels.`);
						s.originalSize = [t.w, t.h];
					}
					if (o.spriteSourceSize !== void 0 && (s.trim = rect(o.spriteSourceSize, `spriteSourceSize`)), o.trimmed === !0 && (!s.trim || !s.originalSize)) throw new require_texture.AssetError(`Trimmed atlas frames require sourceSize and spriteSourceSize.`);
					let c = o.pivot ?? o.anchor;
					if (c !== void 0) {
						let e = record(c, `anchor`);
						s.defaultAnchor = [e.x, e.y];
					}
					if (o.borders !== void 0) {
						let e = record(o.borders, `borders`);
						s.defaultBorders = {
							left: e.left,
							top: e.top,
							right: e.right,
							bottom: e.bottom
						};
					}
					t.set(a, new require_texture2d.TextureView2D(i, s));
				}
			}
			let i = /* @__PURE__ */ new Map(), o = 0;
			for (let [n, a] of l) {
				if (!Array.isArray(a) || !a.length) throw new require_texture.AssetError(`Atlas animations require nonempty frame arrays.`);
				if (o += a.length, o > require_rendering2d.rendering2dLimits.atlasFrames) throw new require_texture.AssetError(`Atlas animation frames exceed their budget.`);
				let s = a.map((n) => {
					let r = typeof n == `string` ? {
						frame: n,
						duration: 1 / 60
					} : record(n, `animation frame`), i = t.get(r.frame), a = r.duration;
					if (!i || typeof a != `number` || !Number.isFinite(a) || a <= 0) throw new require_texture.AssetError(`Atlas animation requires a named frame and a positive duration in seconds.`);
					return Object.freeze({
						view: i,
						duration: a
					});
				});
				i.set(n, Object.freeze(s));
			}
			a.signal?.throwIfAborted();
			let m = !1;
			return Object.freeze({
				views: t,
				animations: i,
				destroy() {
					if (!m) {
						m = !0;
						for (let e of f.values()) e.destroy();
						f.clear();
					}
				}
			});
		} catch (e) {
			for (let e of f.values()) e.destroy();
			throw e;
		} finally {
			s.destroy();
		}
	}
};
//#endregion
exports.AtlasLoader = AtlasLoader;

//# sourceMappingURL=atlas-loader.cjs.map