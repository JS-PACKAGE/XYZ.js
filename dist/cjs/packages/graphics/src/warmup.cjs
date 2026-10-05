const require_errors = require("./errors.cjs");
const require_game_object = require("../../core/src/game-object.cjs");
const require_object3d = require("../../core/src/object3d.cjs");
const require_mesh = require("../../core/src/mesh.cjs");
const require_sprite = require("../../core/src/sprite.cjs");
const require_mesh2d = require("../../core/src/rendering2d/mesh2d.cjs");
const require_filters2d = require("../../core/src/rendering2d/filters2d.cjs");
const require_isolated_group = require("../../core/src/rendering2d/isolated-group.cjs");
const require_particle_layer2d = require("../../core/src/particles2d/particle-layer2d.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_gpu_particles3d = require("../../core/src/gpu-particles3d.cjs");
//#region dist/packages/graphics/src/warmup.js
async function warmupScene(d, f, p = {}, m = !1) {
	let h = p.maxItems ?? 8, g = p.maxMilliseconds ?? 4;
	if (!Number.isSafeInteger(h) || h < 1 || !Number.isFinite(g) || g <= 0) throw RangeError(`Warmup requires positive maxItems and maxMilliseconds.`);
	if (p.signal?.throwIfAborted(), f.destroyed) throw new require_errors.GraphicsError(`Cannot warm up a destroyed Scene.`);
	let _ = /* @__PURE__ */ new Set();
	for (let u of f.objects) if (!(m && (u instanceof require_game_object.GameObject || u instanceof require_object3d.Object3D) && !u.worldVisible)) {
		if (u instanceof require_gpu_particles3d.GPUParticleEmitter3D && _.add(u), u instanceof require_mesh.Mesh) require_native_material3d.isNativeMaterial3D(u.material) && _.add(u.material), _.add(u);
		else if (u instanceof require_sprite.Sprite) _.add(u.texture), u.material && _.add(u.material);
		else if (u instanceof require_mesh2d.Mesh2D) _.add(u.texture), _.add(u.geometry);
		else if (u instanceof require_particle_layer2d.ParticleLayer2D) {
			_.add(u);
			for (let e = 0; e < u.activeCount; e++) _.add(u.getSlot(u.activeSlotAt(e)).texture);
		}
		if (u instanceof require_isolated_group.IsolatedGroup2D) {
			u.mask?.texture && _.add(u.mask.texture);
			for (let e of u.filters) e instanceof require_filters2d.DisplacementFilter2D && _.add(e.texture);
		}
	}
	f.environment && _.add(f.environment), f.background && _.add(f.background);
	for (let e of f.reflectionProbes) e.enabled && _.add(e.environment);
	for (let e of f.effects2D) _.add(e);
	for (let e of f.effects3D) _.add(e);
	let v = [], y = 0, b = 0, x = !1, progress = () => Object.freeze({
		completed: y,
		total: _.size,
		ratio: _.size ? y / _.size : 1,
		chunks: b
	}), release = () => {
		if (!x) {
			x = !0;
			for (let e of v) e.release();
			v.length = 0;
		}
	}, S = _.values();
	p.signal?.addEventListener(`abort`, release, { once: !0 });
	try {
		if (p.onProgress?.(progress()), p.signal?.throwIfAborted(), f.destroyed) throw new require_errors.GraphicsError(`Scene was destroyed during warmup.`);
		for (; y < _.size;) {
			if (await new Promise((e, t) => {
				let n = p.signal, abort = () => {
					cancelAnimationFrame(r), n?.removeEventListener(`abort`, abort), t(n?.reason);
				}, r = requestAnimationFrame(() => {
					n?.removeEventListener(`abort`, abort), e();
				});
				n?.addEventListener(`abort`, abort, { once: !0 }), n?.aborted && abort();
			}), p.signal?.throwIfAborted(), f.destroyed) throw new require_errors.GraphicsError(`Scene was destroyed during warmup.`);
			b++;
			let e = performance.now();
			for (let t = 0; t < h && y < _.size; t++) {
				p.signal?.throwIfAborted();
				let t = S.next().value, n = await d.prepareResource(t, { signal: p.signal });
				if (p.signal?.aborted && (n.release(), p.signal.throwIfAborted()), v.push(n), p.signal?.throwIfAborted(), f.destroyed) throw new require_errors.GraphicsError(`Scene was destroyed during warmup.`);
				if (y++, p.onProgress?.(progress()), performance.now() - e >= g) break;
			}
		}
		if (p.signal?.throwIfAborted(), f.destroyed) throw new require_errors.GraphicsError(`Scene was destroyed during warmup.`);
		return {
			progress: progress(),
			get released() {
				return x;
			},
			release
		};
	} catch (e) {
		throw release(), e;
	} finally {
		p.signal?.removeEventListener(`abort`, release);
	}
}
//#endregion
exports.warmupScene = warmupScene;

//# sourceMappingURL=warmup.cjs.map