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
	needsRender(o, c, l, u, d, f) {
		let p = !this.valid || !o.shadows.cache;
		this.scene !== o && (this.casters.clear(), this.scene = o, p = !0), (this.revision !== o.shadows.revision || this.width !== d || this.height !== f) && (p = !0), this.revision = o.shadows.revision, this.width = d, this.height = f;
		for (let e = 0; e < c.data.length; e++) Object.is(this.atlasValues[e], c.data[e]) || (p = !0), this.atlasValues[e] = c.data[e];
		++this.frame;
		for (let o of l) {
			let c = o.material, l = o.renderGeometry, d = this.casters.get(o);
			d || (d = {
				geometry: l,
				material: c,
				values: new Float64Array(37 + require_rendering.nativeMaterial3DLimits.uniformFloats + require_rendering.nativeMaterial3DLimits.textures).fill(NaN),
				seen: this.frame
			}, this.casters.set(o, d), p = !0), (d.geometry !== l || d.material !== c) && (p = !0), d.geometry = l, d.material = c, d.seen = this.frame;
			let f = d.values;
			for (let e = 0; e < 16; e++) Object.is(f[e], o.worldMatrix.elements[e]) || (p = !0), f[e] = o.worldMatrix.elements[e];
			let m = c instanceof require_pbr_material.PBRMaterial, h = require_mesh.materialBaseTexture(c), g = m ? c.textureCoordinates.texture : void 0, _ = this.scalarValues;
			_[0] = l.version, _[1] = h.version, _[2] = +!!h.destroyed, _[3] = c.opacity, _[4] = o instanceof require_instanced_mesh.InstancedMesh ? o.version : 0, _[5] = o instanceof require_skinned_mesh.SkinnedMesh ? o.paletteVersion : 0, _[6] = u.get(o)?.fade ?? 1, _[7] = m ? c.alphaCutoff : 0, _[8] = m ? c.alphaMode === `OPAQUE` ? 0 : c.alphaMode === `MASK` ? 1 : 2 : 2, _[9] = m && !c.doubleSided ? 0 : 1, _[10] = g?.texCoord ?? 0, _[11] = g?.transform[0] ?? 1, _[12] = g?.transform[1] ?? 0, _[13] = g?.transform[2] ?? 0, _[14] = g?.transform[3] ?? 1, _[15] = g?.transform[4] ?? 0, _[16] = c.color[0], _[17] = c.color[1], _[18] = c.color[2], _[19] = o instanceof require_instanced_mesh.InstancedMesh ? o.colorVersion : 0;
			for (let e = 0; e < _.length; e++) Object.is(f[16 + e], _[e]) || (p = !0), f[16 + e] = _[e];
			if (Object.is(f[36], g?.transform[5] ?? 0) || (p = !0), f[36] = g?.transform[5] ?? 0, require_native_material3d.isNativeMaterial3D(c)) {
				c.validate(), c.shadowCache !== `tracked` && (p = !0);
				for (let e = 0; e < c.uniforms.length; e++) Object.is(f[37 + e], c.uniforms[e]) || (p = !0), f[37 + e] = c.uniforms[e];
				for (let e = 0; e < require_rendering.nativeMaterial3DLimits.textures; e++) {
					let t = require_native_material3d.nativeMaterialSources(c)[e]?.version ?? -1, n = 37 + require_rendering.nativeMaterial3DLimits.uniformFloats + e;
					Object.is(f[n], t) || (p = !0), f[n] = t;
				}
			}
		}
		for (let [e, t] of this.casters) t.seen !== this.frame && (this.casters.delete(e), p = !0);
		return this.valid = !1, p;
	}
	commit() {
		this.valid = !0;
	}
};
//#endregion
exports.ShadowCache = ShadowCache;

//# sourceMappingURL=shadow-cache.cjs.map