const require_texture = require("../../assets/src/texture.cjs");
const require_texture2d = require("../../assets/src/texture2d.cjs");
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
var r = /* @__PURE__ */ new WeakMap();
var i = Object.freeze({});
function pbrTextureSources(e) {
	return r.get(e) ?? i;
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
function samplerOptions(e) {
	if (e === void 0) return;
	if (e.minFilter !== void 0 && e.minFilter !== `nearest` && e.minFilter !== `linear` || e.magFilter !== void 0 && e.magFilter !== `nearest` && e.magFilter !== `linear` || e.mipmapFilter !== void 0 && e.mipmapFilter !== `nearest` && e.mipmapFilter !== `linear`) throw RangeError(`Texture sampler filters must be nearest or linear.`);
	let t = e.lodMinClamp ?? 0, n = e.lodMaxClamp ?? 32;
	if (!Number.isFinite(t) || !Number.isFinite(n) || t < 0 || n < t || n > 32) throw RangeError(`Texture sampler LOD clamps must satisfy 0 <= min <= max <= 32.`);
	for (let t of [e.addressModeU, e.addressModeV]) if (t !== void 0 && t !== `clamp-to-edge` && t !== `repeat` && t !== `mirror-repeat`) throw RangeError(`Texture sampler address modes must be clamp-to-edge, repeat or mirror-repeat.`);
	return Object.freeze({ ...e });
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
	textureSampler;
	metallicRoughnessSampler;
	normalSampler;
	occlusionSampler;
	emissiveSampler;
	constructor(n) {
		super(n), this.textureCoordinates = textureCoordinates(n.textureCoordinates);
		let i = n.metallic ?? 0, a = n.roughness ?? .5, o = n.emissive ?? [
			0,
			0,
			0
		], s = n.ior ?? 1.5, c = n.specular ?? 1, l = n.specularColor ?? [
			1,
			1,
			1
		];
		if (finite(s, `Index of refraction`), s !== 0 && s < 1) throw RangeError(`Index of refraction must be zero or at least one.`);
		if (unit(c, `Specular strength`), !Array.isArray(l) || l.length !== 3) throw RangeError(`Specular color must contain three components.`);
		for (let e of l) if (finite(e, `Specular color component`), e < 0) throw RangeError(`Specular color components cannot be negative.`);
		textureSlot(n.specularTexture, `Specular texture`), textureSlot(n.specularColorTexture, `Specular color texture`);
		let u = n.clearcoat ?? 0, d = n.clearcoatRoughness ?? 0, f = n.clearcoatNormalScale ?? 1;
		unit(u, `Clearcoat factor`), unit(d, `Clearcoat roughness`), finite(f, `Clearcoat normal scale`), textureSlot(n.clearcoatTexture, `Clearcoat texture`), textureSlot(n.clearcoatRoughnessTexture, `Clearcoat roughness texture`), textureSlot(n.clearcoatNormalTexture, `Clearcoat normal texture`);
		let p = n.sheenColor ?? [
			0,
			0,
			0
		], m = n.sheenRoughness ?? 0;
		if (!Array.isArray(p) || p.length !== 3) throw RangeError(`Sheen color must contain three components.`);
		for (let e of p) unit(e, `Sheen color component`);
		unit(m, `Sheen roughness`), textureSlot(n.sheenColorTexture, `Sheen color texture`), textureSlot(n.sheenRoughnessTexture, `Sheen roughness texture`);
		let h = n.transmission ?? 0, g = n.thickness ?? 0, _ = n.attenuationDistance ?? 1 / 0, v = n.attenuationColor ?? [
			1,
			1,
			1
		];
		if (unit(h, `Transmission factor`), finite(g, `Volume thickness`), g < 0) throw RangeError(`Volume thickness cannot be negative.`);
		if (!(_ > 0) || _ !== 1 / 0 && !Number.isFinite(_)) throw RangeError(`Attenuation distance must be positive or Infinity.`);
		if (!Array.isArray(v) || v.length !== 3) throw RangeError(`Attenuation color must contain three components.`);
		for (let e of v) unit(e, `Attenuation color component`);
		textureSlot(n.transmissionTexture, `Transmission texture`), textureSlot(n.thicknessTexture, `Thickness texture`);
		let y = n.normalScale ?? 1, b = n.occlusionStrength ?? 1, x = n.alphaCutoff ?? 0, S = n.alphaMode ?? (x > 0 ? `MASK` : `BLEND`), C = n.doubleSided ?? !0;
		if (unit(i, `Metallic factor`), unit(a, `Roughness factor`), unit(b, `Occlusion strength`), !Array.isArray(o) || o.length !== 3) throw RangeError(`Emissive color must contain three components.`);
		for (let e = 0; e < 3; e++) if (finite(o[e], `Emissive color component`), o[e] < 0) throw RangeError(`Emissive color components cannot be negative.`);
		if (finite(y, `Normal scale`), finite(x, `Alpha cutoff`), x < 0) throw RangeError(`Alpha cutoff cannot be negative.`);
		if (S !== `OPAQUE` && S !== `MASK` && S !== `BLEND`) throw RangeError(`Material alpha mode must be OPAQUE, MASK, or BLEND.`);
		if (typeof C != `boolean`) throw TypeError(`Double-sided material setting must be boolean.`);
		textureSlot(n.metallicRoughnessTexture, `Metallic-roughness texture`), textureSlot(n.normalTexture, `Normal texture`), textureSlot(n.occlusionTexture, `Occlusion texture`), textureSlot(n.emissiveTexture, `Emissive texture`), this.metallic = i, this.roughness = a, this.emissive = [
			o[0],
			o[1],
			o[2]
		], this.ior = s, this.specular = c, this.specularColor = [...l], this.specularTexture = n.specularTexture, this.specularColorTexture = n.specularColorTexture, this.specularSampler = samplerOptions(n.specularSampler), this.specularColorSampler = samplerOptions(n.specularColorSampler), this.clearcoat = u, this.clearcoatRoughness = d, this.clearcoatNormalScale = f, this.clearcoatTexture = n.clearcoatTexture, this.clearcoatRoughnessTexture = n.clearcoatRoughnessTexture, this.clearcoatNormalTexture = n.clearcoatNormalTexture, this.clearcoatSampler = samplerOptions(n.clearcoatSampler), this.clearcoatRoughnessSampler = samplerOptions(n.clearcoatRoughnessSampler), this.clearcoatNormalSampler = samplerOptions(n.clearcoatNormalSampler), this.sheenColor = [...p], this.sheenRoughness = m, this.sheenColorTexture = n.sheenColorTexture, this.sheenRoughnessTexture = n.sheenRoughnessTexture, this.sheenColorSampler = samplerOptions(n.sheenColorSampler), this.sheenRoughnessSampler = samplerOptions(n.sheenRoughnessSampler), this.transmission = h, this.transmissionTexture = n.transmissionTexture, this.transmissionSampler = samplerOptions(n.transmissionSampler), this.thickness = g, this.thicknessTexture = n.thicknessTexture, this.thicknessSampler = samplerOptions(n.thicknessSampler), this.attenuationDistance = _, this.attenuationColor = [...v], this.metallicRoughnessTexture = n.metallicRoughnessTexture, this.normalTexture = n.normalTexture, this.normalScale = y, this.occlusionTexture = n.occlusionTexture, this.occlusionStrength = b, this.emissiveTexture = n.emissiveTexture;
		let w = {};
		if (n.sources !== void 0) {
			for (let e of Object.keys(n.sources)) if (!pbrTextureKeys.includes(e)) throw TypeError(`Unknown PBR texture source ${e}.`);
		}
		for (let r of pbrTextureKeys) {
			let i = n.sources?.[r];
			if (i !== void 0 && !(i instanceof require_texture.Texture) && !(i instanceof require_texture2d.CanvasTexture2D)) throw TypeError(`${r} source must be a Texture or CanvasTexture2D.`);
			let a = i ?? n[r];
			a !== void 0 && (w[r] = a);
		}
		r.set(this, Object.freeze(w)), this.alphaCutoff = x, this.alphaMode = S, this.doubleSided = C, this.textureSampler = samplerOptions(n.textureSampler), this.metallicRoughnessSampler = samplerOptions(n.metallicRoughnessSampler), this.normalSampler = samplerOptions(n.normalSampler), this.occlusionSampler = samplerOptions(n.occlusionSampler), this.emissiveSampler = samplerOptions(n.emissiveSampler);
	}
};
//#endregion
exports.PBRMaterial = PBRMaterial;
exports.pbrTextureKeys = pbrTextureKeys;
exports.pbrTextureSources = pbrTextureSources;

//# sourceMappingURL=pbr-material.cjs.map