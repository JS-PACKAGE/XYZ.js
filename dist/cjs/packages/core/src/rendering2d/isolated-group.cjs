const require_group2d = require("../gameplay/group2d.cjs");
const require_filters2d = require("./filters2d.cjs");
const require_mask2d = require("./mask2d.cjs");
//#region dist/packages/core/src/rendering2d/isolated-group.js
var IsolatedGroup2D = class extends require_group2d.Group2D {
	cached = !1;
	isolated = !1;
	dirtyVersion = 0;
	clip;
	stack = Object.freeze([]);
	blend = `normal`;
	get isolate() {
		return this.isolated;
	}
	set isolate(e) {
		if (typeof e != `boolean`) throw TypeError(`isolate must be boolean.`);
		e !== this.isolated && (this.isolated = e, this.updateCache());
	}
	get cacheAsTexture() {
		return this.cached;
	}
	set cacheAsTexture(e) {
		if (typeof e != `boolean`) throw TypeError(`cacheAsTexture must be boolean.`);
		e !== this.cached && (this.cached = e, this.updateCache());
	}
	get cacheVersion() {
		return this.dirtyVersion;
	}
	updateCache() {
		if (this.destroyed) throw Error(`Cannot invalidate a destroyed IsolatedGroup2D.`);
		this.dirtyVersion++;
	}
	get mask() {
		return this.clip;
	}
	set mask(e) {
		if (e && !(e instanceof require_mask2d.Mask2D)) throw TypeError(`Invalid Mask2D.`);
		this.clip !== e && (this.clip = e, this.updateCache());
	}
	get filters() {
		return this.stack;
	}
	set filters(e) {
		if (!Array.isArray(e) || e.length > 32 || e.some((e) => !(e instanceof require_filters2d.Filter2D) || e.destroyed)) throw TypeError(`IsolatedGroup2D requires a bounded live Filter2D stack.`);
		this.stack = Object.freeze([...e]), this.updateCache();
	}
	get blendMode() {
		return this.blend;
	}
	set blendMode(e) {
		if (![
			`normal`,
			`add`,
			`multiply`,
			`screen`,
			`erase`
		].includes(e)) throw RangeError(`Unsupported BlendMode2D.`);
		this.blend !== e && (this.blend = e, this.updateCache());
	}
	get isolationEnabled() {
		return this.isolated || this.cached || !!this.clip || this.stack.length > 0 || this.blend !== `normal`;
	}
	get filterPadding() {
		return this.stack.reduce((e, t) => e + t.padding, 0);
	}
	getLocalBounds(e) {
		let t = super.getLocalBounds(e), n = this.filterPadding;
		return t.width > 0 && t.height > 0 && (t.x -= n, t.y -= n, t.width += n * 2, t.height += n * 2), t;
	}
};
//#endregion
exports.IsolatedGroup2D = IsolatedGroup2D;

//# sourceMappingURL=isolated-group.cjs.map