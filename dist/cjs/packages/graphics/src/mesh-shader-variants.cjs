const require_optical_material_maps = require("../../core/src/optical-material-maps.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_skinned_mesh = require("../../core/src/skinned-mesh.cjs");
const require_baked_lighting = require("../../core/src/baked-lighting.cjs");
const require_contact_shadows = require("../../core/src/contact-shadows.cjs");
//#region dist/packages/graphics/src/mesh-shader-variants.js
function meshShaderFeatures(e, t, n) {
	let r = meshShaderVariantBits(e, t, n);
	return {
		pbr: (r & c.pbr) !== 0,
		clearcoat: (r & c.clearcoat) !== 0,
		sheen: (r & c.sheen) !== 0,
		transmission: (r & c.transmission) !== 0,
		dispersion: (r & c.dispersion) !== 0,
		anisotropy: (r & c.anisotropy) !== 0,
		iridescence: (r & c.iridescence) !== 0,
		anisotropyMap: (r & c.anisotropyMap) !== 0,
		iridescenceMap: (r & c.iridescenceMap) !== 0,
		iridescenceThicknessMap: (r & c.iridescenceThicknessMap) !== 0,
		subsurface: (r & c.subsurface) !== 0,
		height: (r & c.height) !== 0,
		weathering: (r & c.weathering) !== 0,
		detail: (r & c.detail) !== 0,
		triplanar: (r & c.triplanar) !== 0,
		lightmap: (r & c.lightmap) !== 0,
		bakedIrradiance: (r & c.bakedIrradiance) !== 0,
		bakedLightmap: (r & c.bakedLightmap) !== 0,
		skinned: (r & c.skinned) !== 0,
		instanced: (r & c.instanced) !== 0,
		morph: (r & c.morph) !== 0,
		shadows: (r & c.shadows) !== 0,
		contactShadows: (r & c.contactShadows) !== 0,
		environment: (r & c.environment) !== 0,
		native: (r & c.native) !== 0
	};
}
var c = Object.fromEntries([
	`pbr`,
	`clearcoat`,
	`sheen`,
	`transmission`,
	`dispersion`,
	`anisotropy`,
	`iridescence`,
	`subsurface`,
	`height`,
	`weathering`,
	`detail`,
	`triplanar`,
	`lightmap`,
	`bakedIrradiance`,
	`bakedLightmap`,
	`skinned`,
	`instanced`,
	`morph`,
	`shadows`,
	`contactShadows`,
	`environment`,
	`native`,
	`anisotropyMap`,
	`iridescenceMap`,
	`iridescenceThicknessMap`
].map((e, t) => [e, 1 << t]));
function meshShaderVariantBits(s, l, u) {
	let d = 0, f = s instanceof require_pbr_material.PBRMaterial ? s : void 0;
	if (f) {
		d |= c.pbr, f.clearcoat > 0 && (d |= c.clearcoat);
		let e = f.sheenColor;
		for (let t = 0; t < e.length; t++) if (e[t] > 0) {
			d |= c.sheen;
			break;
		}
		f.transmission > 0 && (d |= c.transmission);
		let t = f.finish;
		if (t) {
			let e = require_optical_material_maps.opticalMaterialMaps(f);
			t.dispersion > 0 && (d |= c.dispersion), t.anisotropy > 0 && (d |= c.anisotropy, e.anisotropyTexture && (d |= c.anisotropyMap)), t.iridescence > 0 && (d |= c.iridescence, e.iridescenceTexture && (d |= c.iridescenceMap), e.iridescenceThicknessTexture && (d |= c.iridescenceThicknessMap)), t.subsurface > 0 && (d |= c.subsurface), t.heightScale > 0 && (d |= c.height), t.wetness + t.snow + t.dirt + t.damage > 0 && (d |= c.weathering), t.detailStrength > 0 && (d |= c.detail), t.triplanar > 0 && (d |= c.triplanar);
		}
		f.lightmap && (d |= c.lightmap, require_baked_lighting.isBakedLightmap(f.lightmap) && (d |= c.bakedLightmap)), l && require_baked_lighting.meshIrradianceVolume(l) && (d |= c.bakedIrradiance);
	}
	return l instanceof require_skinned_mesh.SkinnedMesh && (d |= c.skinned), l && `count` in l && (d |= c.instanced), l?.morph && (d |= c.morph), (!u || u.shadows.enabled) && (d |= c.shadows), u && (require_contact_shadows.ContactShadows.get(u)?.strength ?? 0) > 0 && (d |= c.contactShadows), (!u || u.environment || u.reflectionProbes.length > 0) && (d |= c.environment), require_native_material3d.isNativeMaterial3D(s) && (d |= c.native), d;
}
function omitShaderBlock(e, t) {
	let n = e.indexOf(t);
	for (; n !== -1;) {
		let r = e.indexOf(`{`, n + t.length), i = e.indexOf(`;`, n + t.length);
		if (i !== -1 && (r === -1 || i < r)) e = e.slice(0, n) + e.slice(i + 1);
		else {
			if (r === -1) throw Error(`Missing shader block: ${t}`);
			let i = 1, a = r + 1;
			for (; i && a < e.length;) e[a] === `{` && i++, e[a] === `}` && i--, a++;
			if (i) throw Error(`Unbalanced shader block: ${t}`);
			e = e.slice(0, n) + e.slice(a);
		}
		n = e.indexOf(t);
	}
	return e;
}
//#endregion
exports.meshShaderFeatures = meshShaderFeatures;
exports.meshShaderVariantBits = meshShaderVariantBits;
exports.omitShaderBlock = omitShaderBlock;

//# sourceMappingURL=mesh-shader-variants.cjs.map