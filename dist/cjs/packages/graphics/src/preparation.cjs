const require_material2d = require("../../core/src/materials2d/material2d.cjs");
const require_geometry = require("../../core/src/geometry.cjs");
const require_mesh = require("../../core/src/mesh.cjs");
const require_geometry2d = require("../../core/src/rendering2d/geometry2d.cjs");
const require_particle_layer2d = require("../../core/src/particles2d/particle-layer2d.cjs");
const require_pbr_material = require("../../core/src/pbr-material.cjs");
const require_native_pbr_material = require("../../core/src/native-pbr-material.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_gpu_particles3d = require("../../core/src/gpu-particles3d.cjs");
const require_environment = require("../../core/src/environment.cjs");
//#region dist/packages/graphics/src/preparation.js
function preparationResourceDestroyed(n) {
	return !(n instanceof require_geometry.Geometry || n instanceof require_geometry2d.Geometry2D) && n.destroyed;
}
function residencyLease(e) {
	let t = !1;
	return {
		get released() {
			return t;
		},
		release() {
			if (!t) {
				t = !0;
				for (let t of e) t.release();
			}
		}
	};
}
async function prepareNativeResource(m, h, g, _ = {}) {
	if (_.signal?.throwIfAborted(), h instanceof require_gpu_particles3d.GPUParticleEmitter3D) return completePreparation(g.gpuParticles(h), residencyLease([]), _.signal);
	if (h instanceof require_material2d.PostProcessor2D) return completePreparation(g.post(h), residencyLease([]), _.signal);
	if (h instanceof require_material2d.Material2D) return completePreparation(g.material(h), residencyLease([]), _.signal);
	m.beginCapture();
	let v;
	try {
		if (h instanceof require_geometry.Geometry || h instanceof require_geometry2d.Geometry2D) g.geometry(h);
		else if (h instanceof require_mesh.Mesh) g.mesh(h);
		else if (h instanceof require_particle_layer2d.ParticleLayer2D) g.particles(h);
		else if (h instanceof require_environment.EnvironmentMap) g.environment(h);
		else if (h instanceof require_native_material3d.NativeMaterial3D) {
			g.texture(h.texture);
			for (let e of h.textures) g.texture(e);
		} else if (h instanceof require_native_pbr_material.NativePBRMaterial) {
			g.texture(require_mesh.materialBaseTexture(h));
			let e = require_pbr_material.pbrTextureSources(h);
			for (let t of require_pbr_material.pbrTextureKeys) {
				let n = e[t];
				n && g.texture(n);
			}
		} else g.texture(h);
		v = residencyLease(m.endCapture());
	} catch (e) {
		throw residencyLease(m.endCapture()).release(), e;
	}
	try {
		return await completePreparation(require_native_material3d.isNativeMaterial3D(h) ? g.material(h) : g.complete(), v, _.signal);
	} catch (e) {
		throw v.release(), e;
	}
}
async function completePreparation(e, t, n) {
	let abort;
	try {
		if (n) {
			let r = new Promise((e, r) => {
				abort = () => {
					t.release(), r(n.reason);
				}, n.addEventListener(`abort`, abort, { once: !0 }), n.aborted && abort();
			});
			await Promise.race([e, r]);
		} else await e;
		return n?.throwIfAborted(), t;
	} catch (e) {
		throw t.release(), e;
	} finally {
		abort && n?.removeEventListener(`abort`, abort);
	}
}
//#endregion
exports.preparationResourceDestroyed = preparationResourceDestroyed;
exports.prepareNativeResource = prepareNativeResource;
exports.residencyLease = residencyLease;

//# sourceMappingURL=preparation.cjs.map