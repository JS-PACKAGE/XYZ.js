const require_errors = require("./errors.cjs");
const require_game_object = require("../../core/src/game-object.cjs");
const require_object3d = require("../../core/src/object3d.cjs");
const require_mesh = require("../../core/src/mesh.cjs");
const require_sprite = require("../../core/src/sprite.cjs");
const require_mesh2d = require("../../core/src/rendering2d/mesh2d.cjs");
const require_filters2d = require("../../core/src/rendering2d/filters2d.cjs");
const require_isolated_group = require("../../core/src/rendering2d/isolated-group.cjs");
const require_particle_layer2d = require("../../core/src/particles2d/particle-layer2d.cjs");
const require_native_pbr_material = require("../../core/src/native-pbr-material.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_gpu_particles3d = require("../../core/src/gpu-particles3d.cjs");
//#region dist/packages/graphics/src/warmup.js
async function warmupScene(p, m, h = {}, g = !1) {
	let _ = h.maxItems ?? 8, v = h.maxMilliseconds ?? 4;
	if (!Number.isSafeInteger(_) || _ < 1 || !Number.isFinite(v) || v <= 0) throw RangeError(`Warmup requires positive maxItems and maxMilliseconds.`);
	if (h.signal?.throwIfAborted(), m.destroyed) throw new require_errors.GraphicsError(`Cannot warm up a destroyed Scene.`);
	let y = /* @__PURE__ */ new Set();
	for (let d of m.objects) if (!(g && (d instanceof require_game_object.GameObject || d instanceof require_object3d.Object3D) && !d.worldVisible)) {
		if (d instanceof require_gpu_particles3d.GPUParticleEmitter3D && y.add(d), d instanceof require_mesh.Mesh) (d.material instanceof require_native_material3d.NativeMaterial3D || d.material instanceof require_native_pbr_material.NativePBRMaterial) && y.add(d.material), y.add(d);
		else if (d instanceof require_sprite.Sprite) y.add(d.texture), d.material && y.add(d.material);
		else if (d instanceof require_mesh2d.Mesh2D) y.add(d.texture), y.add(d.geometry);
		else if (d instanceof require_particle_layer2d.ParticleLayer2D) {
			y.add(d);
			for (let e = 0; e < d.activeCount; e++) y.add(d.getSlot(d.activeSlotAt(e)).texture);
		}
		if (d instanceof require_isolated_group.IsolatedGroup2D) {
			d.mask?.texture && y.add(d.mask.texture);
			for (let e of d.filters) e instanceof require_filters2d.DisplacementFilter2D && y.add(e.texture);
		}
	}
	m.environment && y.add(m.environment), m.background && y.add(m.background);
	for (let e of m.reflectionProbes) e.enabled && y.add(e.environment);
	for (let e of m.effects2D) y.add(e);
	for (let e of m.effects3D) y.add(e);
	let b = [], x = 0, S = 0, C = !1, progress = () => Object.freeze({
		completed: x,
		total: y.size,
		ratio: y.size ? x / y.size : 1,
		chunks: S
	}), release = () => {
		if (!C) {
			C = !0;
			for (let e of b) e.release();
			b.length = 0;
		}
	}, w = y.values();
	h.signal?.addEventListener(`abort`, release, { once: !0 });
	try {
		if (h.onProgress?.(progress()), h.signal?.throwIfAborted(), m.destroyed) throw new require_errors.GraphicsError(`Scene was destroyed during warmup.`);
		for (; x < y.size;) {
			if (await new Promise((e, t) => {
				let n = h.signal, abort = () => {
					cancelAnimationFrame(r), n?.removeEventListener(`abort`, abort), t(n?.reason);
				}, r = requestAnimationFrame(() => {
					n?.removeEventListener(`abort`, abort), e();
				});
				n?.addEventListener(`abort`, abort, { once: !0 }), n?.aborted && abort();
			}), h.signal?.throwIfAborted(), m.destroyed) throw new require_errors.GraphicsError(`Scene was destroyed during warmup.`);
			S++;
			let e = performance.now();
			for (let t = 0; t < _ && x < y.size; t++) {
				h.signal?.throwIfAborted();
				let t = w.next().value, n;
				if (t instanceof require_native_pbr_material.NativePBRMaterial) {
					if (!p.prepareNativePBRMaterial) throw new require_errors.UnsupportedGraphicsError(`The selected renderer does not support native physical materials.`);
					await p.prepareNativePBRMaterial(t), n = {
						released: !1,
						release() {}
					};
				} else n = await p.prepareResource(t, { signal: h.signal });
				if (h.signal?.aborted && (n.release(), h.signal.throwIfAborted()), b.push(n), h.signal?.throwIfAborted(), m.destroyed) throw new require_errors.GraphicsError(`Scene was destroyed during warmup.`);
				if (x++, h.onProgress?.(progress()), performance.now() - e >= v) break;
			}
		}
		if (h.signal?.throwIfAborted(), m.destroyed) throw new require_errors.GraphicsError(`Scene was destroyed during warmup.`);
		return {
			progress: progress(),
			get released() {
				return C;
			},
			release
		};
	} catch (e) {
		throw release(), e;
	} finally {
		h.signal?.removeEventListener(`abort`, release);
	}
}
//#endregion
exports.warmupScene = warmupScene;

//# sourceMappingURL=warmup.cjs.map