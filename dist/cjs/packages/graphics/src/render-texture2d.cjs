const require_errors = require("./errors.cjs");
const require_rendering2d = require("../../../src/data/rendering2d.cjs");
//#region dist/packages/graphics/src/render-texture2d.js
var n = /* @__PURE__ */ new WeakMap();
var r = Symbol(`renderer-owned render texture`);
function validateRenderTextureSize2D(t, n = require_rendering2d.rendering2dLimits.targetDimension) {
	let { width: r, height: i } = t, a = t.resolution ?? 1;
	if (![
		r,
		i,
		a
	].every(Number.isFinite) || r <= 0 || i <= 0 || a <= 0 || a > require_rendering2d.rendering2dLimits.resolution) throw RangeError(`Render texture dimensions and resolution must be positive and bounded.`);
	let o = Math.ceil(r * a), s = Math.ceil(i * a);
	if (o > Math.min(n, require_rendering2d.rendering2dLimits.targetDimension) || s > Math.min(n, require_rendering2d.rendering2dLimits.targetDimension) || o * s > require_rendering2d.rendering2dLimits.targetPixels) throw RangeError(`Render texture exceeds the dimension or pixel budget.`);
	return {
		width: o,
		height: s,
		logicalWidth: r,
		logicalHeight: i,
		resolution: a
	};
}
var RenderTexture2D = class {
	kind = `render`;
	size;
	disposed = !1;
	revision = 0;
	constructor(e, n) {
		if (e !== r) throw new require_errors.GraphicsError(`Render textures must be created by a Renderer.`);
		this.size = n;
	}
	get width() {
		return this.size.width;
	}
	get height() {
		return this.size.height;
	}
	get logicalWidth() {
		return this.size.logicalWidth;
	}
	get logicalHeight() {
		return this.size.logicalHeight;
	}
	get resolution() {
		return this.size.resolution;
	}
	get version() {
		return this.revision;
	}
	get destroyed() {
		return this.disposed;
	}
	resize(e) {
		let t = this.requireOwnership(), n = validateRenderTextureSize2D({
			...e,
			resolution: e.resolution ?? this.resolution
		});
		t.resize(n), this.size = n, t.dependencies.clear(), this.revision++;
	}
	destroy() {
		if (this.disposed) return;
		this.disposed = !0;
		let e = n.get(this);
		n.delete(this), e?.dependencies.clear(), e?.release();
	}
	publish(e, n) {
		let r = this.requireOwnership();
		if (r.owner !== e) throw new require_errors.GraphicsError(`Render texture belongs to another renderer.`);
		r.dependencies = new Set(n), this.revision++;
	}
	requireOwnership() {
		let e = n.get(this);
		if (this.disposed || !e) throw new require_errors.GraphicsError(`Render texture is destroyed.`);
		return e;
	}
};
function createOwnedRenderTexture2D(e, t, i, a) {
	let o = new RenderTexture2D(r, t);
	return n.set(o, {
		owner: e,
		resize: i,
		release: a,
		dependencies: /* @__PURE__ */ new Set()
	}), o;
}
function assertRenderTextureOwner2D(e, r) {
	if (!(e instanceof RenderTexture2D) || e.destroyed || n.get(e)?.owner !== r) throw new require_errors.GraphicsError(`Render texture is destroyed or belongs to another renderer.`);
}
function validateRenderTextureDependencies2D(r, i, a) {
	assertRenderTextureOwner2D(r, a);
	let o = /* @__PURE__ */ new Set(), visit = (i, s) => {
		if (assertRenderTextureOwner2D(i, a), i === r) throw new require_errors.GraphicsError(`Render texture sampling creates recursive feedback.`);
		if (s > require_rendering2d.rendering2dLimits.layerDepth) throw RangeError(`Render texture dependency depth exceeds the budget.`);
		if (!o.has(i)) {
			o.add(i);
			for (let e of n.get(i).dependencies) visit(e, s + 1);
		}
	};
	for (let e of i) visit(e, 0);
}
function validateRenderTextureRegion2D(e, n) {
	if (e.destroyed) throw new require_errors.GraphicsError(`Render texture is destroyed.`);
	if (!n) return {
		x: 0,
		y: 0,
		width: e.width,
		height: e.height
	};
	if (![
		n.x,
		n.y,
		n.width,
		n.height
	].every(Number.isFinite) || n.x < 0 || n.y < 0 || n.width <= 0 || n.height <= 0 || n.x + n.width > e.logicalWidth || n.y + n.height > e.logicalHeight) throw RangeError(`Extraction region must be positive and inside the logical render texture.`);
	let r = Math.floor(n.x * e.resolution), i = Math.floor(n.y * e.resolution);
	return {
		x: r,
		y: i,
		width: Math.ceil((n.x + n.width) * e.resolution) - r,
		height: Math.ceil((n.y + n.height) * e.resolution) - i
	};
}
//#endregion
exports.RenderTexture2D = RenderTexture2D;
exports.assertRenderTextureOwner2D = assertRenderTextureOwner2D;
exports.createOwnedRenderTexture2D = createOwnedRenderTexture2D;
exports.validateRenderTextureDependencies2D = validateRenderTextureDependencies2D;
exports.validateRenderTextureRegion2D = validateRenderTextureRegion2D;
exports.validateRenderTextureSize2D = validateRenderTextureSize2D;

//# sourceMappingURL=render-texture2d.cjs.map