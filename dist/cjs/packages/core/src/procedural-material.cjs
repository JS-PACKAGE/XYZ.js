const require_texture = require("../../assets/src/texture.cjs");
const require_materials = require("../../../src/data/materials.cjs");
const require_pbr_material = require("./pbr-material.cjs");
const require_procedural_material_maps = require("./procedural-material-maps.cjs");
//#region dist/packages/core/src/procedural-material.js
function proceduralRepeats(e, t) {
	if (!Number.isFinite(t) || t <= 0) throw RangeError(`Procedural surface size must be finite and positive.`);
	return t / require_materials.proceduralTileMeters[e];
}
var a = [
	`wood`,
	`brick`,
	`stone`,
	`metal`,
	`fabric`,
	`marble`,
	`concrete`,
	`tiles`,
	`leather`,
	`sand`,
	`rust`,
	`snow`
];
var o = Object.freeze({
	addressModeU: `repeat`,
	addressModeV: `repeat`
});
var ProceduralMaterial = class ProceduralMaterial {
	repeats;
	kind;
	textures;
	material;
	disposed = !1;
	constructor(e, t, n) {
		this.repeats = n, this.kind = e, this.textures = Object.freeze(t), this.material = this.createMaterial();
	}
	static async create(n, r = {}) {
		if (!a.includes(n)) throw RangeError(`Unknown procedural material kind.`);
		if (!r || typeof r != `object` || Array.isArray(r)) throw TypeError(`Procedural material options must be an object.`);
		let o = r.size === void 0 ? require_materials.proceduralMaterialLimits.defaultSize : r.size, s = r.seed === void 0 ? require_materials.proceduralMaterialLimits.defaultSeed : r.seed;
		if (!Number.isInteger(o) || o < require_materials.proceduralMaterialLimits.minSize || o > require_materials.proceduralMaterialLimits.maxSize) throw RangeError(`Procedural material size must be an integer between 32 and 1024.`);
		if (!Number.isInteger(s) || s < 0 || s > 4294967295) throw RangeError(`Procedural material seed must be an unsigned 32-bit integer.`);
		let c = r.contrast ?? 1, l = r.roughnessBias ?? 0, u = r.repeats ?? 1;
		if (!Number.isFinite(c) || c < 0 || !Number.isFinite(l) || l < -1 || l > 1 || !Number.isFinite(u) || u <= 0) throw RangeError(`Procedural contrast must be finite and nonnegative, roughnessBias within -1..1, and repeats finite and positive.`);
		let d = require_procedural_material_maps.generateProceduralMaps(n, o, s, {
			contrast: c,
			roughnessBias: l
		}), f = [];
		try {
			for (let t of [
				d.baseColor,
				d.normal,
				d.metallicRoughness,
				d.occlusion
			]) {
				let n = new ImageData(o, o);
				n.data.set(t), f.push(await require_texture.Texture.fromImage(n));
			}
			return new ProceduralMaterial(n, {
				baseColor: f[0],
				normal: f[1],
				metallicRoughness: f[2],
				occlusion: f[3]
			}, u);
		} catch (e) {
			for (let e of f) e.destroy();
			throw e;
		}
	}
	createMaterial(e = {}) {
		if (this.disposed) throw Error(`Cannot create a material from a destroyed procedural preset.`);
		let t = [this.repeats, this.repeats];
		return new require_pbr_material.PBRMaterial({
			texture: this.textures.baseColor,
			normalTexture: this.textures.normal,
			metallicRoughnessTexture: this.textures.metallicRoughness,
			occlusionTexture: this.textures.occlusion,
			textureCoordinates: this.repeats === 1 ? void 0 : {
				texture: { scale: t },
				metallicRoughness: { scale: t },
				normal: { scale: t },
				occlusion: { scale: t }
			},
			metallic: +(this.kind === `metal` || this.kind === `rust`),
			roughness: 1,
			alphaMode: `OPAQUE`,
			textureSampler: o,
			normalSampler: o,
			metallicRoughnessSampler: o,
			occlusionSampler: o,
			...e
		});
	}
	get destroyed() {
		return this.disposed;
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.textures.baseColor.destroy(), this.textures.normal.destroy(), this.textures.metallicRoughness.destroy(), this.textures.occlusion.destroy());
	}
};
//#endregion
exports.ProceduralMaterial = ProceduralMaterial;
exports.proceduralRepeats = proceduralRepeats;

//# sourceMappingURL=procedural-material.cjs.map