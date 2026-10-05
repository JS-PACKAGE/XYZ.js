const require_texture = require("../../assets/src/texture.cjs");
const require_texture2d = require("../../assets/src/texture2d.cjs");
const require_texture_sampler = require("./texture-sampler.cjs");
const require_mesh = require("./mesh.cjs");
//#region dist/packages/core/src/pbr-material.js
var pbrTextureKeys = [
	`specularTexture`,
	`specularColorTexture`,
	`clearcoatTexture`,
	`clearcoatRoughnessTexture`,
	`clearcoatNormalTexture`,
	`sheenColorTexture`,
	`sheenRoughnessTexture`,
	`transmissionTexture`,
	`thicknessTexture`,
	`metallicRoughnessTexture`,
	`normalTexture`,
	`occlusionTexture`,
	`emissiveTexture`
];
var i = /* @__PURE__ */ new WeakMap();
var a = Object.freeze({});
function pbrTextureSources(e) {
	return i.get(e) ?? a;
}
function finite(e, t) {
	if (!Number.isFinite(e) || !Number.isFinite(Math.fround(e))) throw RangeError(`${t} must be finite and fit in Float32.`);
}
function unit(e, t) {
	if (finite(e, t), e < 0 || e > 1) throw RangeError(`${t} must be between 0 and 1.`);
}
function textureSlot(t, n) {
	if (t !== void 0 && !(t instanceof require_texture.Texture)) throw TypeError(`${n} must be a Texture.`);
}
function textureCoordinates(e) {
	let t = {}, n = [
		`texture`,
		`metallicRoughness`,
		`normal`,
		`occlusion`,
		`emissive`,
		`specular`,
		`specularColor`,
		`clearcoat`,
		`clearcoatRoughness`,
		`clearcoatNormal`,
		`sheenColor`,
		`sheenRoughness`,
		`transmission`,
		`thickness`
	];
	if (e !== void 0) {
		if (!e || typeof e != `object` || Array.isArray(e)) throw TypeError(`Texture coordinates must be a per-map object.`);
		for (let r of Object.keys(e)) {
			if (!n.includes(r)) throw RangeError(`Unknown material texture coordinate slot.`);
			let i = e[r];
			if (!i || typeof i != `object` || Array.isArray(i)) throw TypeError(`Texture coordinate options must be an object.`);
			let a = i.texCoord ?? 0;
			if (a !== 0 && a !== 1) throw RangeError(`Texture coordinates require UV0 or UV1.`);
			let o = i.offset ?? [0, 0], s = i.scale ?? [1, 1];
			if (o.length !== 2 || s.length !== 2) throw RangeError(`UV offset and scale require two components.`);
			let c = i.rotation ?? 0;
			for (let e of [
				...o,
				...s,
				c
			]) finite(e, `Texture transform`);
			let l = Math.cos(c), u = Math.sin(c), d = [
				l * s[0],
				u * s[0],
				-u * s[1],
				l * s[1],
				o[0],
				o[1]
			];
			for (let e of d) finite(e, `Texture transform`);
			t[r] = Object.freeze({
				texCoord: a,
				transform: Object.freeze(d)
			});
		}
	}
	return Object.freeze(t);
}
var PBRMaterial = class extends require_mesh.TextureMaterial {
	textureCoordinates;
	metallic;
	roughness;
	emissive;
	ior;
	specular;
	specularColor;
	specularTexture;
	specularColorTexture;
	specularSampler;
	specularColorSampler;
	clearcoat;
	clearcoatRoughness;
	clearcoatNormalScale;
	clearcoatTexture;
	clearcoatRoughnessTexture;
	clearcoatNormalTexture;
	clearcoatSampler;
	clearcoatRoughnessSampler;
	clearcoatNormalSampler;
	sheenColor;
	sheenRoughness;
	sheenColorTexture;
	sheenRoughnessTexture;
	sheenColorSampler;
	sheenRoughnessSampler;
	transmission;
	transmissionTexture;
	transmissionSampler;
	thickness;
	thicknessTexture;
	thicknessSampler;
	attenuationDistance;
	attenuationColor;
	metallicRoughnessTexture;
	normalTexture;
	normalScale;
	occlusionTexture;
	occlusionStrength;
	emissiveTexture;
	alphaCutoff;
	alphaMode;
	doubleSided;
	specularAntiAliasing;
	alphaToCoverage;
	metallicRoughnessSampler;
	normalSampler;
	occlusionSampler;
	emissiveSampler;
	constructor(n) {
		super(n), this.textureCoordinates = textureCoordinates(n.textureCoordinates);
		let a = n.metallic ?? 0, o = n.roughness ?? .5, s = n.specularAntiAliasing ?? 0;
		unit(s, `Specular anti-aliasing strength`);
		let c = n.emissive ?? [
			0,
			0,
			0
		], l = n.ior ?? 1.5, u = n.specular ?? 1, d = n.specularColor ?? [
			1,
			1,
			1
		];
		if (finite(l, `Index of refraction`), l !== 0 && l < 1) throw RangeError(`Index of refraction must be zero or at least one.`);
		if (unit(u, `Specular strength`), !Array.isArray(d) || d.length !== 3) throw RangeError(`Specular color must contain three components.`);
		for (let e of d) if (finite(e, `Specular color component`), e < 0) throw RangeError(`Specular color components cannot be negative.`);
		textureSlot(n.specularTexture, `Specular texture`), textureSlot(n.specularColorTexture, `Specular color texture`);
		let f = n.clearcoat ?? 0, p = n.clearcoatRoughness ?? 0, m = n.clearcoatNormalScale ?? 1;
		unit(f, `Clearcoat factor`), unit(p, `Clearcoat roughness`), finite(m, `Clearcoat normal scale`), textureSlot(n.clearcoatTexture, `Clearcoat texture`), textureSlot(n.clearcoatRoughnessTexture, `Clearcoat roughness texture`), textureSlot(n.clearcoatNormalTexture, `Clearcoat normal texture`);
		let h = n.sheenColor ?? [
			0,
			0,
			0
		], g = n.sheenRoughness ?? 0;
		if (!Array.isArray(h) || h.length !== 3) throw RangeError(`Sheen color must contain three components.`);
		for (let e of h) unit(e, `Sheen color component`);
		unit(g, `Sheen roughness`), textureSlot(n.sheenColorTexture, `Sheen color texture`), textureSlot(n.sheenRoughnessTexture, `Sheen roughness texture`);
		let _ = n.transmission ?? 0, v = n.thickness ?? 0, y = n.attenuationDistance ?? 1 / 0, b = n.attenuationColor ?? [
			1,
			1,
			1
		];
		if (unit(_, `Transmission factor`), finite(v, `Volume thickness`), v < 0) throw RangeError(`Volume thickness cannot be negative.`);
		if (!(y > 0) || y !== 1 / 0 && !Number.isFinite(y)) throw RangeError(`Attenuation distance must be positive or Infinity.`);
		if (!Array.isArray(b) || b.length !== 3) throw RangeError(`Attenuation color must contain three components.`);
		for (let e of b) unit(e, `Attenuation color component`);
		textureSlot(n.transmissionTexture, `Transmission texture`), textureSlot(n.thicknessTexture, `Thickness texture`);
		let x = n.normalScale ?? 1, S = n.occlusionStrength ?? 1, C = n.alphaCutoff ?? 0, w = n.alphaMode ?? (C > 0 ? `MASK` : `BLEND`), T = n.doubleSided ?? !0;
		if (unit(a, `Metallic factor`), unit(o, `Roughness factor`), unit(S, `Occlusion strength`), !Array.isArray(c) || c.length !== 3) throw RangeError(`Emissive color must contain three components.`);
		for (let e = 0; e < 3; e++) if (finite(c[e], `Emissive color component`), c[e] < 0) throw RangeError(`Emissive color components cannot be negative.`);
		if (finite(x, `Normal scale`), finite(C, `Alpha cutoff`), C < 0) throw RangeError(`Alpha cutoff cannot be negative.`);
		if (w !== `OPAQUE` && w !== `MASK` && w !== `BLEND`) throw RangeError(`Material alpha mode must be OPAQUE, MASK, or BLEND.`);
		if (typeof T != `boolean`) throw TypeError(`Double-sided material setting must be boolean.`);
		let E = n.alphaToCoverage ?? !1;
		if (typeof E != `boolean`) throw TypeError(`Alpha-to-coverage must be boolean.`);
		if (E && (w !== `MASK` || C <= 0 || C >= 1 || _ > 0)) throw RangeError(`Alpha-to-coverage requires MASK, 0 < cutoff < 1, and no transmission.`);
		textureSlot(n.metallicRoughnessTexture, `Metallic-roughness texture`), textureSlot(n.normalTexture, `Normal texture`), textureSlot(n.occlusionTexture, `Occlusion texture`), textureSlot(n.emissiveTexture, `Emissive texture`), this.metallic = a, this.roughness = o, this.emissive = [
			c[0],
			c[1],
			c[2]
		], this.ior = l, this.specular = u, this.specularColor = [...d], this.specularTexture = n.specularTexture, this.specularColorTexture = n.specularColorTexture, this.specularSampler = require_texture_sampler.samplerOptions(n.specularSampler), this.specularColorSampler = require_texture_sampler.samplerOptions(n.specularColorSampler), this.clearcoat = f, this.clearcoatRoughness = p, this.clearcoatNormalScale = m, this.clearcoatTexture = n.clearcoatTexture, this.clearcoatRoughnessTexture = n.clearcoatRoughnessTexture, this.clearcoatNormalTexture = n.clearcoatNormalTexture, this.clearcoatSampler = require_texture_sampler.samplerOptions(n.clearcoatSampler), this.clearcoatRoughnessSampler = require_texture_sampler.samplerOptions(n.clearcoatRoughnessSampler), this.clearcoatNormalSampler = require_texture_sampler.samplerOptions(n.clearcoatNormalSampler), this.sheenColor = [...h], this.sheenRoughness = g, this.sheenColorTexture = n.sheenColorTexture, this.sheenRoughnessTexture = n.sheenRoughnessTexture, this.sheenColorSampler = require_texture_sampler.samplerOptions(n.sheenColorSampler), this.sheenRoughnessSampler = require_texture_sampler.samplerOptions(n.sheenRoughnessSampler), this.transmission = _, this.transmissionTexture = n.transmissionTexture, this.transmissionSampler = require_texture_sampler.samplerOptions(n.transmissionSampler), this.thickness = v, this.thicknessTexture = n.thicknessTexture, this.thicknessSampler = require_texture_sampler.samplerOptions(n.thicknessSampler), this.attenuationDistance = y, this.attenuationColor = [...b], this.metallicRoughnessTexture = n.metallicRoughnessTexture, this.normalTexture = n.normalTexture, this.normalScale = x, this.occlusionTexture = n.occlusionTexture, this.occlusionStrength = S, this.emissiveTexture = n.emissiveTexture;
		let D = {};
		if (n.sources !== void 0) {
			for (let e of Object.keys(n.sources)) if (!pbrTextureKeys.includes(e)) throw TypeError(`Unknown PBR texture source ${e}.`);
		}
		for (let r of pbrTextureKeys) {
			let i = n.sources?.[r];
			if (i !== void 0 && !(i instanceof require_texture.Texture) && !(i instanceof require_texture2d.CanvasTexture2D)) throw TypeError(`${r} source must be a Texture or CanvasTexture2D.`);
			let a = i ?? n[r];
			a !== void 0 && (D[r] = a);
		}
		i.set(this, Object.freeze(D)), this.alphaCutoff = C, this.alphaMode = w, this.doubleSided = T, this.specularAntiAliasing = s, this.alphaToCoverage = E, this.metallicRoughnessSampler = require_texture_sampler.samplerOptions(n.metallicRoughnessSampler), this.normalSampler = require_texture_sampler.samplerOptions(n.normalSampler), this.occlusionSampler = require_texture_sampler.samplerOptions(n.occlusionSampler), this.emissiveSampler = require_texture_sampler.samplerOptions(n.emissiveSampler);
	}
};
//#endregion
exports.PBRMaterial = PBRMaterial;
exports.pbrTextureKeys = pbrTextureKeys;
exports.pbrTextureSources = pbrTextureSources;

//# sourceMappingURL=pbr-material.cjs.map