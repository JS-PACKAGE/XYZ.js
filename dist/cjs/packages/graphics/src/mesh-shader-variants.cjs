const require_optical_material_maps = require("../../core/src/optical-material-maps.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_skinned_mesh = require("../../core/src/skinned-mesh.cjs");
const require_baked_lighting = require("../../core/src/baked-lighting.cjs");
const require_contact_shadows = require("../../core/src/contact-shadows.cjs");
//#region dist/packages/graphics/src/mesh-shader-variants.js
function meshShaderFeatures(s, c, l) {
	let u = s instanceof require_pbr_material.PBRMaterial ? s : void 0, d = u?.finish, f = u && require_optical_material_maps.opticalMaterialMaps(u);
	return {
		pbr: !!u,
		clearcoat: (u?.clearcoat ?? 0) > 0,
		sheen: !!u?.sheenColor.some((e) => e > 0),
		transmission: (u?.transmission ?? 0) > 0,
		dispersion: (d?.dispersion ?? 0) > 0,
		anisotropy: (d?.anisotropy ?? 0) > 0,
		iridescence: (d?.iridescence ?? 0) > 0,
		anisotropyMap: (d?.anisotropy ?? 0) > 0 && !!f?.anisotropyTexture,
		iridescenceMap: (d?.iridescence ?? 0) > 0 && !!f?.iridescenceTexture,
		iridescenceThicknessMap: (d?.iridescence ?? 0) > 0 && !!f?.iridescenceThicknessTexture,
		subsurface: (d?.subsurface ?? 0) > 0,
		height: (d?.heightScale ?? 0) > 0,
		weathering: !!d && d.wetness + d.snow + d.dirt + d.damage > 0,
		detail: (d?.detailStrength ?? 0) > 0,
		triplanar: (d?.triplanar ?? 0) > 0,
		lightmap: !!u?.lightmap,
		bakedIrradiance: !!u && !!c && !!require_baked_lighting.meshIrradianceVolume(c),
		bakedLightmap: !!u?.lightmap && require_baked_lighting.isBakedLightmap(u.lightmap),
		skinned: c instanceof require_skinned_mesh.SkinnedMesh,
		instanced: !!c && `count` in c,
		morph: !!c?.morph,
		shadows: !l || l.shadows.enabled,
		contactShadows: !!l && (require_contact_shadows.ContactShadows.get(l)?.strength ?? 0) > 0,
		environment: !l || !!l.environment || l.reflectionProbes.length > 0,
		native: require_native_material3d.isNativeMaterial3D(s)
	};
}
var s = [
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
];
function meshShaderVariantKey(e) {
	let t = 0;
	for (let n = 0; n < s.length; n++) e[s[n]] && (t |= 1 << n);
	return t.toString(36);
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
exports.meshShaderVariantKey = meshShaderVariantKey;
exports.omitShaderBlock = omitShaderBlock;

//# sourceMappingURL=mesh-shader-variants.cjs.map