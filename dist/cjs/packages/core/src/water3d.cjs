const require_hypot = require("../../math/src/hypot.cjs");
const require_geometry = require("./geometry.cjs");
const require_mesh = require("./mesh.cjs");
const require_native_pbr_material = require("./native-pbr-material.cjs");
const require_water = require("../../../src/data/water.cjs");
const require_water3d_shaders = require("./water3d-shaders.cjs");
//#region dist/packages/core/src/water3d.js
function bounded(e, t, n, r) {
	if (!Number.isFinite(e) || e < t || e > n) throw RangeError(`${r} must be finite in [${t}, ${n}].`);
}
var Water3D = class extends require_mesh.Mesh {
	width;
	depth;
	phases;
	speeds;
	elapsed = 0;
	constructor(i) {
		let l = i.width ?? require_water.water3DDefaults.width, u = i.depth ?? require_water.water3DDefaults.depth, d = i.segments ?? require_water.water3DDefaults.segments;
		if (bounded(l, require_water.water3DDefaults.minimumLength, require_water.water3DDefaults.maximumLength, `Water width`), bounded(u, require_water.water3DDefaults.minimumLength, require_water.water3DDefaults.maximumLength, `Water depth`), !Number.isInteger(d) || d < 1 || d > require_water.water3DDefaults.maxSegments) throw RangeError(`Water segments must be an integer in [1, ${require_water.water3DDefaults.maxSegments}].`);
		let f = i.waves ?? require_water.water3DWaves, p = i.normalWaves ?? require_water.water3DNormalWaves, m = f.length + p.length;
		if (m > require_water.water3DDefaults.maxWaves) throw RangeError(`Water supports at most ${require_water.water3DDefaults.maxWaves} combined waves.`);
		let h = /* @__PURE__ */ new Float32Array(64), g = new Float64Array(m), _ = new Float64Array(m);
		h[0] = f.length, h[1] = m, h[44] = l, h[45] = u;
		let v = 0;
		for (let t = 0; t < m; t++) {
			let n = t < f.length ? f[t] : p[t - f.length], r = n.speed ?? 1, i = n.phase ?? 0;
			if (bounded(n.amplitude, 0, require_water.water3DDefaults.maximumAmplitude, `Water wave amplitude`), bounded(n.wavelength, require_water.water3DDefaults.minimumLength, require_water.water3DDefaults.maximumLength, `Water wavelength`), bounded(r, -require_water.water3DDefaults.maximumSpeed, require_water.water3DDefaults.maximumSpeed, `Water wave speed`), !Number.isFinite(i)) throw RangeError(`Water wave phase must be finite.`);
			let a = n.direction[0], o = n.direction[1], s = require_hypot.hypot2(a, o);
			if (!Number.isFinite(s) || s === 0) throw RangeError(`Water wave direction must be finite and nonzero.`);
			let l = 2 * Math.PI / n.wavelength, u = 4 + t * 4;
			h[u] = a / s * l, h[u + 1] = o / s * l, h[u + 2] = n.amplitude, g[t] = i % (2 * Math.PI), _[t] = r, h[36 + t] = g[t], t < f.length && (v += h[u + 2]);
		}
		let y = i.foam;
		if (y !== void 0 && typeof y != `boolean` && (typeof y != `object` || !y)) throw TypeError(`Water foam must be a boolean or options object.`);
		let b = typeof y == `object` ? y : void 0, x = y ? b?.strength ?? 1 : 0, S = b?.threshold ?? v * require_water.water3DDefaults.foamThresholdFraction, C = b?.fade ?? Math.max(v * require_water.water3DDefaults.foamFadeFraction, require_water.water3DDefaults.minimumLength);
		bounded(x, 0, 1, `Water foam strength`), bounded(S, -require_water.water3DDefaults.maximumAmplitude, require_water.water3DDefaults.maximumAmplitude, `Water foam threshold`), bounded(C, require_water.water3DDefaults.minimumLength, require_water.water3DDefaults.maximumLength, `Water foam fade`), h[2] = x, h[3] = S, h[46] = C;
		let w = (d + 1) ** 2, T = new Float32Array(w * 3), E = new Float32Array(w * 3), D = new Float32Array(w * 2), O = new Uint32Array(d * d * 6);
		for (let e = 0; e <= d; e++) for (let t = 0; t <= d; t++) {
			let n = e * (d + 1) + t;
			if (T[n * 3] = (t / d - .5) * l, T[n * 3 + 2] = (e / d - .5) * u, E[n * 3 + 1] = 1, D[n * 2] = t / d, D[n * 2 + 1] = e / d, t < d && e < d) {
				let r = n, i = r + 1, a = r + d + 1, o = a + 1, s = (e * d + t) * 6;
				O[s] = r, O[s + 1] = a, O[s + 2] = i, O[s + 3] = i, O[s + 4] = a, O[s + 5] = o;
			}
		}
		let k = new require_geometry.Geometry({
			positions: T,
			normals: E,
			uvs: D,
			indices: O
		}), A = new require_native_pbr_material.NativePBRMaterial({
			color: require_water.water3DDefaults.color,
			metallic: 0,
			roughness: require_water.water3DDefaults.roughness,
			ior: require_water.water3DDefaults.ior,
			transmission: require_water.water3DDefaults.transmission,
			thickness: require_water.water3DDefaults.thickness,
			attenuationColor: require_water.water3DDefaults.attenuationColor,
			attenuationDistance: require_water.water3DDefaults.attenuationDistance,
			alphaMode: `OPAQUE`,
			...i.materialOptions,
			texture: i.texture,
			wgsl: require_water3d_shaders.waterWGSL,
			glsl: require_water3d_shaders.waterGLSL,
			uniforms: h,
			deformationBounds: v * (1 + require_water.water3DDefaults.boundsMargin),
			shadowCache: `tracked`,
			label: `Water3D`
		});
		super({
			...i,
			geometry: k,
			material: A
		}), this.width = l, this.depth = u, this.phases = g, this.speeds = _;
	}
	get time() {
		return this.elapsed;
	}
	setTime(e) {
		if (this.destroyed || this.material.destroyed) throw Error(`Water3D is destroyed.`);
		if (!Number.isFinite(e)) throw RangeError(`Water time must be finite.`);
		let t = 2 * Math.PI;
		for (let n = 0; n < this.phases.length; n++) {
			let r = this.speeds[n], i = r === 0 ? 0 : e % (t / Math.abs(r)) * r;
			this.material.uniforms[36 + n] = (this.phases[n] + i) % t;
		}
		this.elapsed = e;
	}
	update(e) {
		if (!Number.isFinite(e) || e < 0) throw RangeError(`Water delta must be finite and nonnegative.`);
		this.setTime(this.elapsed + e);
	}
	sampleSurface(e, t, n) {
		if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError(`Water sample coordinates must be finite.`);
		if (this.destroyed || this.material.destroyed) throw Error(`Water3D is destroyed.`);
		let r = this.material.uniforms, i = 0, a = 0, o = 0;
		for (let n = 0; n < r[1]; n++) {
			let s = 4 + n * 4, c = r[s] * e + r[s + 1] * t + r[36 + n];
			n < r[0] && (i += r[s + 2] * Math.sin(c));
			let l = r[s + 2] * Math.cos(c);
			a += r[s] * l, o += r[s + 1] * l;
		}
		let s = require_hypot.hypot3(a, 1, o);
		n.height = i, n.normalX = -a / s, n.normalY = 1 / s, n.normalZ = -o / s;
		let c = Math.min(1, Math.max(0, (i - r[3]) / r[46]));
		return n.foam = r[2] * c * c * (3 - 2 * c), n;
	}
	destroy() {
		if (!this.destroyed) try {
			super.destroy();
		} finally {
			this.material.destroy();
		}
	}
};
//#endregion
exports.Water3D = Water3D;

//# sourceMappingURL=water3d.cjs.map