const require_material2d = require("../../core/src/materials2d/material2d.cjs");
const require_geometry = require("../../core/src/geometry.cjs");
const require_mesh = require("../../core/src/mesh.cjs");
const require_geometry2d = require("../../core/src/rendering2d/geometry2d.cjs");
const require_particle_layer2d = require("../../core/src/particles2d/particle-layer2d.cjs");
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
async function prepareNativeResource(l, u, d, f = {}) {
	if (f.signal?.throwIfAborted(), u instanceof require_gpu_particles3d.GPUParticleEmitter3D) return completePreparation(d.gpuParticles(u), residencyLease([]), f.signal);
	if (u instanceof require_material2d.PostProcessor2D) return completePreparation(d.post(u), residencyLease([]), f.signal);
	if (u instanceof require_material2d.Material2D) return completePreparation(d.material(u), residencyLease([]), f.signal);
	l.beginCapture();
	let p;
	try {
		if (u instanceof require_geometry.Geometry || u instanceof require_geometry2d.Geometry2D) d.geometry(u);
		else if (u instanceof require_mesh.Mesh) d.mesh(u);
		else if (u instanceof require_particle_layer2d.ParticleLayer2D) d.particles(u);
		else if (u instanceof require_environment.EnvironmentMap) d.environment(u);
		else if (u instanceof require_native_material3d.NativeMaterial3D) {
			d.texture(u.texture);
			for (let e of u.textures) d.texture(e);
		} else d.texture(u);
		p = residencyLease(l.endCapture());
	} catch (e) {
		throw residencyLease(l.endCapture()).release(), e;
	}
	try {
		return await completePreparation(u instanceof require_native_material3d.NativeMaterial3D ? d.material(u) : d.complete(), p, f.signal);
	} catch (e) {
		throw p.release(), e;
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