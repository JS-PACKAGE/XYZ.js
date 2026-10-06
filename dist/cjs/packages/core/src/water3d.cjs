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
		let c = i.width ?? require_water.water3DDefaults.width, l = i.depth ?? require_water.water3DDefaults.depth, u = i.segments ?? require_water.water3DDefaults.segments;
		if (bounded(c, require_water.water3DDefaults.minimumLength, require_water.water3DDefaults.maximumLength, `Water width`), bounded(l, require_water.water3DDefaults.minimumLength, require_water.water3DDefaults.maximumLength, `Water depth`), !Number.isInteger(u) || u < 1 || u > require_water.water3DDefaults.maxSegments) throw RangeError(`Water segments must be an integer in [1, ${require_water.water3DDefaults.maxSegments}].`);
		let d = i.waves ?? require_water.water3DWaves, f = i.normalWaves ?? require_water.water3DNormalWaves, p = d.length + f.length;
		if (p > require_water.water3DDefaults.maxWaves) throw RangeError(`Water supports at most ${require_water.water3DDefaults.maxWaves} combined waves.`);
		let m = /* @__PURE__ */ new Float32Array(64), h = new Float64Array(p), g = new Float64Array(p);
		m[0] = d.length, m[1] = p, m[44] = c, m[45] = l;
		let _ = 0;
		for (let t = 0; t < p; t++) {
			let n = t < d.length ? d[t] : f[t - d.length], r = n.speed ?? 1, i = n.phase ?? 0;
			if (bounded(n.amplitude, 0, require_water.water3DDefaults.maximumAmplitude, `Water wave amplitude`), bounded(n.wavelength, require_water.water3DDefaults.minimumLength, require_water.water3DDefaults.maximumLength, `Water wavelength`), bounded(r, -require_water.water3DDefaults.maximumSpeed, require_water.water3DDefaults.maximumSpeed, `Water wave speed`), !Number.isFinite(i)) throw RangeError(`Water wave phase must be finite.`);
			let a = n.direction[0], o = n.direction[1], s = Math.hypot(a, o);
			if (!Number.isFinite(s) || s === 0) throw RangeError(`Water wave direction must be finite and nonzero.`);
			let c = 2 * Math.PI / n.wavelength, l = 4 + t * 4;
			m[l] = a / s * c, m[l + 1] = o / s * c, m[l + 2] = n.amplitude, h[t] = i % (2 * Math.PI), g[t] = r, m[36 + t] = h[t], t < d.length && (_ += m[l + 2]);
		}
		let v = i.foam;
		if (v !== void 0 && typeof v != `boolean` && (typeof v != `object` || !v)) throw TypeError(`Water foam must be a boolean or options object.`);
		let y = typeof v == `object` ? v : void 0, b = v ? y?.strength ?? 1 : 0, x = y?.threshold ?? _ * require_water.water3DDefaults.foamThresholdFraction, S = y?.fade ?? Math.max(_ * require_water.water3DDefaults.foamFadeFraction, require_water.water3DDefaults.minimumLength);
		bounded(b, 0, 1, `Water foam strength`), bounded(x, -require_water.water3DDefaults.maximumAmplitude, require_water.water3DDefaults.maximumAmplitude, `Water foam threshold`), bounded(S, require_water.water3DDefaults.minimumLength, require_water.water3DDefaults.maximumLength, `Water foam fade`), m[2] = b, m[3] = x, m[46] = S;
		let C = (u + 1) ** 2, w = new Float32Array(C * 3), T = new Float32Array(C * 3), E = new Float32Array(C * 2), D = new Uint32Array(u * u * 6);
		for (let e = 0; e <= u; e++) for (let t = 0; t <= u; t++) {
			let n = e * (u + 1) + t;
			if (w[n * 3] = (t / u - .5) * c, w[n * 3 + 2] = (e / u - .5) * l, T[n * 3 + 1] = 1, E[n * 2] = t / u, E[n * 2 + 1] = e / u, t < u && e < u) {
				let r = n, i = r + 1, a = r + u + 1, o = a + 1, s = (e * u + t) * 6;
				D[s] = r, D[s + 1] = a, D[s + 2] = i, D[s + 3] = i, D[s + 4] = a, D[s + 5] = o;
			}
		}
		let O = new require_geometry.Geometry({
			positions: w,
			normals: T,
			uvs: E,
			indices: D
		}), k = new require_native_pbr_material.NativePBRMaterial({
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
			uniforms: m,
			deformationBounds: _ * (1 + require_water.water3DDefaults.boundsMargin),
			shadowCache: `tracked`,
			label: `Water3D`
		});
		super({
			...i,
			geometry: O,
			material: k
		}), this.width = c, this.depth = l, this.phases = h, this.speeds = g;
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
		let s = Math.hypot(a, 1, o);
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