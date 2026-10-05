const require_texture = require("../../assets/src/texture.cjs");
const require_texture2d = require("../../assets/src/texture2d.cjs");
const require_index = require("../../math/src/index.cjs");
const require_contracts = require("./gameplay/contracts.cjs");
const require_game_object = require("./game-object.cjs");
const require_texture_sampler = require("./texture-sampler.cjs");
//#region dist/packages/core/src/sprite.js
var Sprite = class extends require_game_object.GameObject {
	currentTexture;
	region;
	currentView;
	sampling;
	rounded = !1;
	currentAnimation;
	anchor = new require_index.Vector2(.5, .5);
	renderEnabled = !0;
	material;
	lighting;
	normalTexture;
	constructor(t) {
		super();
		let r = t.texture ?? t.view?.source;
		if (!r || r.destroyed) throw new require_texture.AssetError(`Cannot use a destroyed or missing texture source for a Sprite.`);
		if (t.view && t.texture && t.view.source !== t.texture) throw new require_texture.AssetError(`Sprite view must borrow the supplied texture source.`);
		if (t.view && t.source) throw RangeError(`Sprite cannot use both a view and a source rectangle.`);
		t.view?.validate(), this.currentTexture = r, this.material = t.material, this.lighting = t.lighting, this.normalTexture = t.normalTexture, t.position && (this.position = new require_index.Vector2(...t.position)), t.scale && (this.scale = new require_index.Vector2(...t.scale)), t.pivot && (this.pivot = new require_index.Vector2(...t.pivot)), t.skew && (this.skew = new require_index.Vector2(...t.skew));
		let i = t.anchor ?? t.view?.defaultAnchor;
		if (i) {
			if (i.length !== 2 || !i.every(Number.isFinite)) throw RangeError(`anchor must contain two finite numbers.`);
			this.anchor.set(i[0], i[1]);
		}
		t.view ? this.view = t.view : this.source = t.source, this.sampler = t.sampler, this.roundPixels = t.roundPixels ?? !1, this.rotation = t.rotation ?? 0, this.opacity = t.opacity ?? 1, this.zIndex = t.zIndex ?? 0, this.visible = t.visible ?? !0, t.tint && (this.tint = t.tint), t.space && (this.space = t.space);
	}
	get texture() {
		return this.currentTexture;
	}
	set texture(t) {
		if (!t || t.destroyed) throw new require_texture.AssetError(`Cannot use a destroyed or missing texture source for a Sprite.`);
		if (this.currentView && this.currentView.source !== t) throw new require_texture.AssetError(`Sprite texture replacement must match its active view.`);
		this.currentView?.validate(), this.region && require_contracts.validateSource(this.region, t.width, t.height), this.currentTexture = t;
	}
	get view() {
		return this.currentView;
	}
	set view(e) {
		if (e && !(e instanceof require_texture2d.TextureView2D)) throw TypeError(`Sprite view must be a TextureView2D.`);
		e?.validate(), e && (this.currentTexture = e.source), this.currentView = e, this.region = void 0;
	}
	get sampler() {
		return this.sampling;
	}
	set sampler(e) {
		if (e && (e.minFilter !== void 0 && e.minFilter !== `nearest` && e.minFilter !== `linear` || e.magFilter !== void 0 && e.magFilter !== `nearest` && e.magFilter !== `linear`)) throw RangeError(`Sprite filters must be nearest or linear.`);
		e && require_texture_sampler.validateAnisotropy(e), this.sampling = e ? Object.freeze({
			minFilter: e.minFilter,
			magFilter: e.magFilter,
			maxAnisotropy: e.maxAnisotropy
		}) : void 0;
	}
	get roundPixels() {
		return this.rounded;
	}
	set roundPixels(e) {
		if (typeof e != `boolean`) throw TypeError(`roundPixels must be boolean.`);
		this.rounded = e;
	}
	get source() {
		return this.region;
	}
	set source(e) {
		if (e) {
			require_contracts.validateSource(e, this.texture.width, this.texture.height), this.currentView = void 0;
			let t = this.region;
			if (t && t.x === e.x && t.y === e.y && t.width === e.width && t.height === e.height) return;
			this.region = Object.freeze({
				x: e.x,
				y: e.y,
				width: e.width,
				height: e.height
			});
		} else this.region = void 0, this.currentView = void 0;
	}
	setAnimationSource(e) {
		require_contracts.validateSource(e, this.texture.width, this.texture.height), this.currentView = void 0, this.region = e;
	}
	setAnimationView(e) {
		this.view = e;
	}
	get width() {
		return this.currentView?.width ?? this.region?.width ?? (this.texture.kind === `render` ? this.texture.logicalWidth : this.texture.width);
	}
	get height() {
		return this.currentView?.height ?? this.region?.height ?? (this.texture.kind === `render` ? this.texture.logicalHeight : this.texture.height);
	}
	get animation() {
		return this.currentAnimation;
	}
	set animation(e) {
		if (e?.sprite !== this && e) throw Error(`FrameAnimation belongs to another Sprite.`);
		e !== this.currentAnimation && (this.currentAnimation?.pause(), this.currentAnimation = e);
	}
	getLocalBounds(e = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	}) {
		return e.x = -this.anchor.x * this.width, e.y = -this.anchor.y * this.height, e.width = this.width, e.height = this.height, e;
	}
	destroy() {
		this.destroyed || (this.currentAnimation?.pause(), this.currentAnimation = void 0, super.destroy());
	}
};
//#endregion
exports.Sprite = Sprite;

//# sourceMappingURL=sprite.cjs.map