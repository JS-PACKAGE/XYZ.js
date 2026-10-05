const require_texture = require("../../../assets/src/texture.cjs");
const require_rendering2d = require("../../../../src/data/rendering2d.cjs");
//#region dist/packages/core/src/rendering2d/filters2d.js
var Filter2D = class extends EventTarget {
	kind;
	padding;
	disposed = !1;
	uniforms;
	constructor(t, n, r) {
		if (super(), this.kind = t, this.padding = r, !n.every(Number.isFinite) || !Number.isFinite(r) || r < 0 || r > require_rendering2d.rendering2dLimits.coordinate) throw RangeError(`Invalid Filter2D uniforms or padding.`);
		this.uniforms = Object.freeze([...n]);
	}
	get destroyed() {
		return this.disposed;
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.dispatchEvent(new Event(`destroy`)));
	}
};
var AlphaFilter2D = class extends Filter2D {
	alpha;
	constructor(e) {
		if (!Number.isFinite(e) || e < 0 || e > 1) throw RangeError(`AlphaFilter2D alpha must be in [0,1].`);
		super(`alpha`, [e], 0), this.alpha = e;
	}
};
var ColorMatrixFilter2D = class extends Filter2D {
	matrix;
	constructor(e) {
		if (e.length !== 20) throw RangeError(`ColorMatrixFilter2D requires twenty finite row-major 4x5 values.`);
		let t = Array.from({ length: 20 }, (t, n) => e[n]);
		if (t.length !== 20 || !t.every(Number.isFinite)) throw RangeError(`ColorMatrixFilter2D requires twenty finite row-major 4x5 values.`);
		super(`color-matrix`, t, 0), this.matrix = this.uniforms;
	}
};
var BlurFilter2D = class extends Filter2D {
	radius;
	quality;
	constructor(t) {
		let n = t.radius, r = t.quality ?? 4;
		if (!Number.isFinite(n) || n < 0 || n > require_rendering2d.rendering2dLimits.filterRadius || !Number.isInteger(r) || r < 1 || r > require_rendering2d.rendering2dLimits.filterQuality) throw RangeError(`BlurFilter2D radius/quality exceeds its bounded profile.`);
		super(`blur`, [n, r], Math.ceil(n * 2)), this.radius = n, this.quality = r;
	}
};
var NoiseFilter2D = class extends Filter2D {
	amount;
	seed;
	constructor(e) {
		let t = e.amount, n = e.seed ?? 0;
		if (!Number.isFinite(t) || t < 0 || t > 1 || !Number.isSafeInteger(n) || n < 0 || n > 4294967295) throw RangeError(`NoiseFilter2D requires amount in [0,1] and a uint32 seed.`);
		super(`noise`, [t, n], 0), this.amount = t, this.seed = n;
	}
};
var DisplacementFilter2D = class extends Filter2D {
	texture;
	view;
	scale;
	constructor(n) {
		let r = n.texture ?? n.view?.source, i = n.scale;
		if (!r || r.destroyed || n.view && n.view.source !== r) throw new require_texture.AssetError(`DisplacementFilter2D requires a live matching map.`);
		if (n.view?.validate(), i.length !== 2 || !i.every((t) => Number.isFinite(t) && Math.abs(t) <= require_rendering2d.rendering2dLimits.coordinate)) throw RangeError(`DisplacementFilter2D requires bounded finite scale.`);
		super(`displacement`, [i[0], i[1]], Math.ceil(Math.max(Math.abs(i[0]), Math.abs(i[1])))), this.texture = r, this.view = n.view, this.scale = Object.freeze([i[0], i[1]]);
	}
};
//#endregion
exports.AlphaFilter2D = AlphaFilter2D;
exports.BlurFilter2D = BlurFilter2D;
exports.ColorMatrixFilter2D = ColorMatrixFilter2D;
exports.DisplacementFilter2D = DisplacementFilter2D;
exports.Filter2D = Filter2D;
exports.NoiseFilter2D = NoiseFilter2D;

//# sourceMappingURL=filters2d.cjs.map