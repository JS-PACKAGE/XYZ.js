const require_texture = require("../../assets/src/texture.cjs");
const require_pbr_material = require("./pbr-material.cjs");
const require_materials = require("../../../src/data/materials.cjs");
const require_procedural_material_maps = require("./procedural-material-maps.cjs");
//#region dist/packages/core/src/procedural-material.js
var i = [
	`wood`,
	`brick`,
	`stone`,
	`metal`,
	`fabric`,
	`marble`
];
var a = Object.freeze({
	addressModeU: `repeat`,
	addressModeV: `repeat`
});
var ProceduralMaterial = class ProceduralMaterial {
	kind;
	textures;
	material;
	disposed = !1;
	constructor(e, t) {
		this.kind = e, this.textures = Object.freeze(t), this.material = this.createMaterial();
	}
	static async create(n, a = {}) {
		if (!i.includes(n)) throw RangeError(`Unknown procedural material kind.`);
		if (!a || typeof a != `object` || Array.isArray(a)) throw TypeError(`Procedural material options must be an object.`);
		let o = a.size === void 0 ? require_materials.proceduralMaterialLimits.defaultSize : a.size, s = a.seed === void 0 ? require_materials.proceduralMaterialLimits.defaultSeed : a.seed;
		if (!Number.isInteger(o) || o < require_materials.proceduralMaterialLimits.minSize || o > require_materials.proceduralMaterialLimits.maxSize) throw RangeError(`Procedural material size must be an integer between 32 and 1024.`);
		if (!Number.isInteger(s) || s < 0 || s > 4294967295) throw RangeError(`Procedural material seed must be an unsigned 32-bit integer.`);
		let c = require_procedural_material_maps.generateProceduralMaps(n, o, s), l = [];
		try {
			for (let t of [
				c.baseColor,
				c.normal,
				c.metallicRoughness,
				c.occlusion
			]) {
				let n = new ImageData(o, o);
				n.data.set(t), l.push(await require_texture.Texture.fromImage(n));
			}
			return new ProceduralMaterial(n, {
				baseColor: l[0],
				normal: l[1],
				metallicRoughness: l[2],
				occlusion: l[3]
			});
		} catch (e) {
			for (let e of l) e.destroy();
			throw e;
		}
	}
	createMaterial(e = {}) {
		if (this.disposed) throw Error(`Cannot create a material from a destroyed procedural preset.`);
		return new require_pbr_material.PBRMaterial({
			texture: this.textures.baseColor,
			normalTexture: this.textures.normal,
			metallicRoughnessTexture: this.textures.metallicRoughness,
			occlusionTexture: this.textures.occlusion,
			metallic: +(this.kind === `metal`),
			roughness: 1,
			alphaMode: `OPAQUE`,
			textureSampler: a,
			normalSampler: a,
			metallicRoughnessSampler: a,
			occlusionSampler: a,
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

//# sourceMappingURL=procedural-material.cjs.map