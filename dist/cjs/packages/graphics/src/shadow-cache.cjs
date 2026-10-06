const require_mesh = require("../../core/src/mesh.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_instanced_mesh = require("../../core/src/instanced-mesh.cjs");
const require_skinned_mesh = require("../../core/src/skinned-mesh.cjs");
//#region dist/packages/graphics/src/shadow-cache.js
var ShadowCache = class {
	scene;
	atlasValues = new Float32Array(require_rendering.SHADOW_FLOAT_COUNT).fill(NaN);
	casters = /* @__PURE__ */ new Map();
	revision = -1;
	width = 0;
	height = 0;
	frame = 0;
	valid = !1;
	scalarValues = /* @__PURE__ */ new Float64Array(20);
	invalidate() {
		this.valid = !1;
	}
	needsRender(s, l, u, d, f, p) {
		let m = !this.valid || !s.shadows.cache;
		this.scene !== s && (this.casters.clear(), this.scene = s, m = !0), (this.revision !== s.shadows.revision || this.width !== f || this.height !== p) && (m = !0), this.revision = s.shadows.revision, this.width = f, this.height = p;
		for (let e = 0; e < l.data.length; e++) Object.is(this.atlasValues[e], l.data[e]) || (m = !0), this.atlasValues[e] = l.data[e];
		++this.frame;
		for (let s of u) {
			let l = s.material, u = s.renderGeometry, f = this.casters.get(s);
			f || (f = {
				geometry: u,
				material: l,
				values: new Float64Array(37 + require_rendering.nativeMaterial3DLimits.uniformFloats + require_rendering.nativeMaterial3DLimits.textures).fill(NaN),
				seen: this.frame
			}, this.casters.set(s, f), m = !0), (f.geometry !== u || f.material !== l) && (m = !0), f.geometry = u, f.material = l, f.seen = this.frame;
			let p = f.values;
			for (let e = 0; e < 16; e++) Object.is(p[e], s.worldMatrix.elements[e]) || (m = !0), p[e] = s.worldMatrix.elements[e];
			let h = l instanceof require_pbr_material.PBRMaterial, g = require_mesh.materialBaseTexture(l), _ = h ? l.textureCoordinates.texture : void 0, v = this.scalarValues;
			v[0] = u.version, v[1] = g.version, v[2] = +!!g.destroyed, v[3] = l.opacity, v[4] = s instanceof require_instanced_mesh.InstancedMesh ? s.version : 0, v[5] = s instanceof require_skinned_mesh.SkinnedMesh ? s.paletteVersion : 0, v[6] = d.get(s)?.fade ?? 1, v[7] = h ? l.alphaCutoff : 0, v[8] = h ? l.alphaMode === `OPAQUE` ? 0 : l.alphaMode === `MASK` ? 1 : 2 : 2, v[9] = h && !l.doubleSided ? 0 : 1, v[10] = _?.texCoord ?? 0, v[11] = _?.transform[0] ?? 1, v[12] = _?.transform[1] ?? 0, v[13] = _?.transform[2] ?? 0, v[14] = _?.transform[3] ?? 1, v[15] = _?.transform[4] ?? 0, v[16] = l.color[0], v[17] = l.color[1], v[18] = l.color[2], v[19] = s instanceof require_instanced_mesh.InstancedMesh ? s.colorVersion : 0;
			for (let e = 0; e < v.length; e++) Object.is(p[16 + e], v[e]) || (m = !0), p[16 + e] = v[e];
			if (Object.is(p[36], _?.transform[5] ?? 0) || (m = !0), p[36] = _?.transform[5] ?? 0, require_native_material3d.isNativeMaterial3D(l)) {
				l.validate(), l.shadowCache !== `tracked` && (m = !0);
				for (let e = 0; e < l.uniforms.length; e++) Object.is(p[37 + e], l.uniforms[e]) || (m = !0), p[37 + e] = l.uniforms[e];
				for (let e = 0; e < require_rendering.nativeMaterial3DLimits.textures; e++) {
					let t = (l instanceof require_native_material3d.NativeMaterial3D ? require_native_material3d.nativeMaterialSources(l)[e]?.version : void 0) ?? -1, r = 37 + require_rendering.nativeMaterial3DLimits.uniformFloats + e;
					Object.is(p[r], t) || (m = !0), p[r] = t;
				}
			}
		}
		for (let [e, t] of this.casters) t.seen !== this.frame && (this.casters.delete(e), m = !0);
		return this.valid = !1, m;
	}
	commit() {
		this.valid = !0;
	}
};
//#endregion
exports.ShadowCache = ShadowCache;

//# sourceMappingURL=shadow-cache.cjs.map