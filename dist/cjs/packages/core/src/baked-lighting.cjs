const require_texture = require("../../assets/src/texture.cjs");
const require_geometry = require("./geometry.cjs");
const require_mesh = require("./mesh.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_pbr_material = require("./pbr-material.cjs");
const require_lights = require("./lights.cjs");
const require_scene = require("./scene.cjs");
const require_environment = require("./environment.cjs");
const require_bake_bvh = require("./bake-bvh.cjs");
//#region dist/packages/core/src/baked-lighting.js
var l = /* @__PURE__ */ new WeakSet();
function isBakedLightmap(e) {
	return e !== void 0 && l.has(e);
}
function integer(e, t, n, r) {
	if (!Number.isInteger(e) || e < t || e > n) throw RangeError(`${r} outside bounded bake profile.`);
	return e;
}
function positive(e, t) {
	if (!Number.isFinite(e) || e <= 0) throw RangeError(`${t} must be finite and positive.`);
	return e;
}
function basis(e, t, n, r) {
	r[0] = .282095, r[1] = .488603 * t, r[2] = .488603 * n, r[3] = .488603 * e, r[4] = 1.092548 * e * t, r[5] = 1.092548 * t * n, r[6] = .315392 * (3 * n * n - 1), r[7] = 1.092548 * e * n, r[8] = .546274 * (e * e - t * t);
}
function normalize(e) {
	let t = Math.hypot(e[0], e[1], e[2]);
	if (t < 1e-12) throw RangeError(`Bake normal cannot be zero.`);
	for (let n = 0; n < 3; n++) e[n] /= t;
}
var Context = class {
	scene;
	bvh;
	samples;
	bias;
	distance;
	meshes;
	origin = [
		0,
		0,
		0
	];
	direction = [
		0,
		0,
		0
	];
	constructor(e, n) {
		if (this.scene = e, this.meshes = n.meshes ?? (e ? [...e.objects].filter((e) => e instanceof require_mesh.Mesh) : []), new Set(this.meshes).size !== this.meshes.length || this.meshes.some((e) => !(e instanceof require_mesh.Mesh) || e.destroyed)) throw TypeError(`Bake meshes must be distinct live Mesh objects.`);
		if (this.samples = integer(n.samples ?? require_rendering.bakedLightingLimits.samples, 1, require_rendering.bakedLightingLimits.maxSamples, `Samples`), this.bias = positive(n.bias ?? require_rendering.bakedLightingLimits.bias, `Bias`), this.distance = positive(n.aoDistance ?? require_rendering.bakedLightingLimits.aoDistance, `AO distance`), this.bvh = new require_bake_bvh.BakeBVH(this.meshes, integer(n.maxTriangles ?? require_rendering.bakedLightingLimits.maxTriangles, 1, require_rendering.bakedLightingLimits.maxTriangles, `Triangles`), integer(n.maxRays ?? require_rendering.bakedLightingLimits.maxRays, 1, require_rendering.bakedLightingLimits.maxRays, `Rays`)), e) {
			if (e.pointLights.length + e.spotLights.length > require_rendering.bakedLightingLimits.maxLights) throw RangeError(`Bake light budget exceeded.`);
			for (let t of [...e.pointLights, ...e.spotLights]) t.validate();
			let n = e.directionalLight;
			if (!Number.isFinite(n.intensity) || n.intensity < 0 || n.color.some((e) => !Number.isFinite(e) || e < 0) || !Number.isFinite(n.direction.length()) || n.direction.length() === 0 || !Number.isFinite(e.ambientLight) || e.ambientLight < 0) throw RangeError(`Invalid scene bake lighting.`);
			if (!Number.isFinite(e.environmentIntensity) || e.environmentIntensity < 0) throw RangeError(`Invalid environment bake intensity.`);
		}
	}
	direct(e, t, n, r) {
		n.fill(0);
		let i = this.scene;
		if (!i) return;
		for (let n = 0; n < 3; n++) this.origin[n] = e[n] + t[n] * this.bias;
		let a = i.directionalLight, s = this.direction, c = a.direction.length();
		s[0] = a.direction.x / c, s[1] = a.direction.y / c, s[2] = a.direction.z / c;
		let l = Math.max(0, t[0] * s[0] + t[1] * s[1] + t[2] * s[2]);
		if (l && a.intensity && !this.bvh.hit(this.origin, s, 1 / 0, r)) for (let e = 0; e < 3; e++) n[e] += l * a.intensity * a.color[e];
		for (let a of [i.pointLights, i.spotLights]) for (let i of a) {
			s[0] = i.position.x - e[0], s[1] = i.position.y - e[1], s[2] = i.position.z - e[2];
			let a = Math.hypot(...s);
			if (a <= this.bias || i.range && a >= i.range) continue;
			for (let e = 0; e < 3; e++) s[e] /= a;
			let c = Math.max(0, t[0] * s[0] + t[1] * s[1] + t[2] * s[2]) * i.intensity / Math.max(a * a, .01);
			if (i.range && (c *= (1 - (a / i.range) ** 4) ** 2), i instanceof require_lights.SpotLight) {
				let e = -(s[0] * i.direction.x + s[1] * i.direction.y + s[2] * i.direction.z) / i.direction.length(), t = Math.max(0, Math.min(1, (e - Math.cos(i.outerAngle)) / (Math.cos(i.innerAngle) - Math.cos(i.outerAngle))));
				c *= t * t * (3 - 2 * t);
			}
			if (c && !this.bvh.hit(this.origin, s, a - this.bias, r)) for (let e = 0; e < 3; e++) n[e] += c * i.color[e];
		}
	}
	surface(e, t, n, r) {
		this.direct(e, t, n, r);
		let i = Math.abs(t[1]) < .9 ? [
			t[2],
			0,
			-t[0]
		] : [
			0,
			-t[2],
			t[1]
		];
		normalize(i);
		let a = [
			t[1] * i[2] - t[2] * i[1],
			t[2] * i[0] - t[0] * i[2],
			t[0] * i[1] - t[1] * i[0]
		], o = [
			0,
			0,
			0
		], s = e.map((e, n) => e + t[n] * this.bias), c = 0;
		for (let e = 0; e < this.samples; e++) {
			let n = Math.sqrt((e + .5) / this.samples), l = e * 2.399963229728653;
			for (let e = 0; e < 3; e++) o[e] = i[e] * n * Math.cos(l) + a[e] * n * Math.sin(l) + t[e] * Math.sqrt(1 - n * n);
			this.bvh.hit(s, o, this.distance, r) || c++;
		}
		let l = this.scene?.ambientLight ?? 0;
		for (let e = 0; e < 3; e++) n[e] += l * c / this.samples;
	}
};
async function bakeLightmap(r, i = {}) {
	let a = integer(i.size ?? require_rendering.bakedLightingLimits.size, 4, require_rendering.bakedLightingLimits.maxSize, `Size`), o = integer(i.padding ?? require_rendering.bakedLightingLimits.padding, 1, require_rendering.bakedLightingLimits.maxPadding, `Padding`), s = i.atlas ?? `generate`;
	if (s !== `generate` && s !== `uv1`) throw RangeError(`Unknown bake atlas mode.`);
	let c = new Context(r, i), u = c.bvh.triangles, d = Math.ceil(Math.sqrt(u.length)), f = Math.floor(a / Math.max(1, d));
	if (s === `generate` && u.length && f < o * 2 + 3) throw RangeError(`Atlas too small for triangle charts and padding.`);
	let p = new Float32Array(a * a * 3), m = new Int32Array(a * a).fill(-1), h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map(), _ = [
		0,
		0,
		0
	], v = [
		0,
		0,
		0
	], y = [
		0,
		0,
		0
	], b = 0;
	for (let e = 0; e < u.length; e++) {
		let n = u[e], r = n.mesh.geometry, i;
		if (s === `uv1`) {
			if (!r.uvs1) throw RangeError(`Authored bake requires UV1.`);
			if (i = n.indices.flatMap((e) => [r.uvs1[e * 2] * a, r.uvs1[e * 2 + 1] * a]), i.some((e) => !Number.isFinite(e) || e < o || e > a - o)) throw RangeError(`UV1 charts require atlas-edge padding.`);
			h.set(n.mesh, r);
		} else {
			let t = e % d * f + o + .5, s = Math.floor(e / d) * f + o + .5, c = f - 2 * o - 1;
			i = [
				t,
				s,
				t + c,
				s,
				t,
				s + c
			];
			let l = g.get(n.mesh);
			l || (l = {
				positions: [],
				normals: [],
				uvs: [],
				uvs1: [],
				indices: [],
				colors: [],
				tangents: []
			}, g.set(n.mesh, l));
			for (let e = 0; e < 3; e++) {
				let t = n.indices[e], o = t * 8;
				l.indices.push(l.indices.length);
				for (let e = 0; e < 3; e++) l.positions.push(r.vertices[o + e]), l.normals.push(r.vertices[o + 3 + e]);
				if (l.uvs.push(r.vertices[o + 6], r.vertices[o + 7]), l.uvs1.push(i[e * 2] / a, i[e * 2 + 1] / a), r.colors) for (let e = 0; e < 4; e++) l.colors.push(r.colors[t * 4 + e]);
				for (let e = 0; e < 4; e++) l.tangents.push(r.tangents[t * 4 + e]);
			}
		}
		let l = (i[3] - i[5]) * (i[0] - i[4]) + (i[4] - i[2]) * (i[1] - i[5]);
		if (Math.abs(l) < 1e-8) throw RangeError(`Degenerate UV1 triangle.`);
		for (let r = Math.max(0, Math.floor(Math.min(i[1], i[3], i[5]))); r < Math.min(a, Math.ceil(Math.max(i[1], i[3], i[5]))); r++) for (let o = Math.max(0, Math.floor(Math.min(i[0], i[2], i[4]))); o < Math.min(a, Math.ceil(Math.max(i[0], i[2], i[4]))); o++) {
			if (++b > require_rendering.bakedLightingLimits.maxRays) throw RangeError(`Bake raster sample budget exceeded.`);
			let s = ((i[3] - i[5]) * (o + .5 - i[4]) + (i[4] - i[2]) * (r + .5 - i[5])) / l, u = ((i[5] - i[1]) * (o + .5 - i[4]) + (i[0] - i[4]) * (r + .5 - i[5])) / l, d = 1 - s - u;
			if (s < -1e-7 || u < -1e-7 || d < -1e-7) continue;
			let f = r * a + o;
			if (m[f] >= 0) {
				if (Math.min(s, u, d) > 1e-7) throw RangeError(`Overlapping UV1 charts.`);
				continue;
			}
			for (let e = 0; e < 3; e++) _[e] = n.p[e] * s + n.p[e + 3] * u + n.p[e + 6] * d, v[e] = n.n[e] * s + n.n[e + 3] * u + n.n[e + 6] * d;
			normalize(v), c.surface(_, v, y, n), p.set(y, f * 3), m[f] = e;
		}
	}
	let x = new Int32Array(m.length);
	for (let e = 0; e < o; e++) {
		x.set(m);
		for (let e = 0; e < a; e++) for (let t = 0; t < a; t++) {
			let n = e * a + t;
			if (!(m[n] >= 0)) for (let r = -1; r <= 1; r++) for (let i = -1; i <= 1; i++) {
				if (t + i < 0 || t + i >= a || e + r < 0 || e + r >= a) continue;
				let o = (e + r) * a + t + i;
				if (m[o] >= 0 && x[n] < 0) {
					x[n] = m[o];
					for (let e = 0; e < 3; e++) p[n * 3 + e] = p[o * 3 + e];
				}
			}
		}
		m.set(x);
	}
	for (let [e, t] of g) h.set(e, new require_geometry.Geometry({
		...t,
		colors: t.colors.length ? t.colors : void 0,
		tangentTexCoord: e.geometry.tangentTexCoord,
		tangentConvention: e.geometry.tangentConvention
	}));
	let S = new Uint8ClampedArray(a * a * 4);
	for (let e = 0; e < a * a; e++) {
		for (let t = 0; t < 3; t++) {
			let n = Math.min(1, Math.max(0, p[e * 3 + t]));
			S[e * 4 + t] = Math.round(255 * (n <= .0031308 ? 12.92 * n : 1.055 * n ** (1 / 2.4) - .055));
		}
		S[e * 4 + 3] = 255;
	}
	let C = await require_texture.Texture.fromImage(new ImageData(S, a, a));
	return l.add(C), {
		texture: C,
		pixels: p,
		geometries: h,
		materialOptions: {
			lightmap: C,
			lightmapSampler: {
				addressModeU: `clamp-to-edge`,
				addressModeV: `clamp-to-edge`,
				lodMaxClamp: 0
			},
			textureCoordinates: { emissive: { texCoord: 1 } },
			finish: { lightmapStrength: 1 }
		},
		rays: c.bvh.rays,
		destroy: () => C.destroy()
	};
}
var u = [
	1,
	2 / 3,
	2 / 3,
	2 / 3,
	.25,
	.25,
	.25,
	.25,
	.25
];
var BakedIrradianceVolume = class {
	min;
	max;
	resolution;
	order;
	coefficients;
	gone = !1;
	constructor(e, n) {
		if (this.min = Object.freeze([...e.min]), this.max = Object.freeze([...e.max]), this.min.length !== 3 || this.max.length !== 3) throw RangeError(`Volume bounds need three coordinates.`);
		for (let e = 0; e < 3; e++) if (!Number.isFinite(this.min[e]) || !Number.isFinite(this.max[e]) || this.min[e] >= this.max[e]) throw RangeError(`Invalid volume bounds.`);
		if (this.resolution = Object.freeze([...e.resolution ?? require_rendering.bakedLightingLimits.resolution]), this.resolution.length !== 3) throw RangeError(`Resolution needs three dimensions.`);
		let r = 1;
		for (let e of this.resolution) r *= integer(e, 2, require_rendering.bakedLightingLimits.maxProbes, `Resolution`);
		if (r > require_rendering.bakedLightingLimits.maxProbes) throw RangeError(`Probe memory budget exceeded.`);
		if (this.order = e.order ?? 2, this.order !== 1 && this.order !== 2) throw RangeError(`SH order must be 1 or 2.`);
		let i = r * (this.order === 1 ? 4 : 9) * 3;
		if (n && (n.length !== i || Array.from(n).some((e) => !Number.isFinite(e) || !Number.isFinite(Math.fround(e))))) throw RangeError(`Invalid probe coefficients.`);
		this.coefficients = n ? Float32Array.from(n) : new Float32Array(i);
	}
	get destroyed() {
		return this.gone;
	}
	destroy() {
		this.gone = !0, this.coefficients.fill(0);
	}
	sampleSH(e, t, n, r, i = 0) {
		if (!Number.isInteger(i) || i < 0 || r.length < i + 36) throw RangeError(`SH output requires 36 floats.`);
		if (r.fill(0, i, i + 36), this.gone || !Number.isFinite(e) || !Number.isFinite(t) || !Number.isFinite(n) || e < this.min[0] || e > this.max[0] || t < this.min[1] || t > this.max[1] || n < this.min[2] || n > this.max[2]) return !1;
		let [a, o, s] = this.resolution, c = (e - this.min[0]) / (this.max[0] - this.min[0]) * (a - 1), l = (t - this.min[1]) / (this.max[1] - this.min[1]) * (o - 1), u = (n - this.min[2]) / (this.max[2] - this.min[2]) * (s - 1), d = Math.min(a - 2, Math.floor(c)), f = Math.min(o - 2, Math.floor(l)), p = Math.min(s - 2, Math.floor(u)), m = c - d, h = l - f, g = u - p, _ = this.order === 1 ? 4 : 9;
		for (let e = 0; e < 2; e++) for (let t = 0; t < 2; t++) for (let n = 0; n < 2; n++) {
			let s = (n ? m : 1 - m) * (t ? h : 1 - h) * (e ? g : 1 - g), c = (((p + e) * o + f + t) * a + d + n) * _ * 3;
			for (let e = 0; e < _; e++) for (let t = 0; t < 3; t++) r[i + e * 4 + t] += s * this.coefficients[c + e * 3 + t];
		}
		return !0;
	}
};
function half(e) {
	let t = e >>> 10 & 31, n = e & 1023;
	return (e & 32768 ? -1 : 1) * (t ? (1 + n / 1024) * 2 ** (t - 15) : n * 2 ** -24);
}
function radiance(e, t, n) {
	let r = Math.atan2(t[0], -t[2]) / (2 * Math.PI) + .5, i = Math.acos(Math.max(-1, Math.min(1, t[1]))) / Math.PI, a = r * e.width - .5, o = i * e.height - .5, s = Math.floor(a), c = Math.floor(o), l = a - s, u = o - c;
	n.fill(0);
	for (let t = 0; t < 2; t++) for (let r = 0; r < 2; r++) {
		let i = (Math.min(e.height - 1, Math.max(0, c + t)) * e.width + ((s + r) % e.width + e.width) % e.width) * 4;
		for (let a = 0; a < 3; a++) n[a] += half(e.levels[0][i + a]) * (r ? l : 1 - l) * (t ? u : 1 - u);
	}
}
function bakeIrradianceVolume(e, t) {
	let n = new BakedIrradianceVolume(t), r = e instanceof require_scene.Scene ? e : void 0;
	if (!(e instanceof require_scene.Scene) && !(e instanceof require_environment.EnvironmentMap)) throw TypeError(`Probe bake requires Scene or EnvironmentMap.`);
	let s = e instanceof require_environment.EnvironmentMap ? e : e.environment;
	if (s?.destroyed) throw RangeError(`Destroyed bake environment.`);
	let c = new Context(r, t), [l, d, f] = n.resolution, p = n.order === 1 ? 4 : 9, m = [
		0,
		0,
		0
	], h = [
		0,
		0,
		0
	], g = [
		0,
		0,
		0
	], _ = [
		0,
		0,
		0
	], v = [
		0,
		0,
		0
	], y = [
		0,
		0,
		0
	], b = /* @__PURE__ */ new Float64Array(9);
	for (let e = 0; e < f; e++) for (let t = 0; t < d; t++) for (let i = 0; i < l; i++) {
		m[0] = n.min[0] + i / (l - 1) * (n.max[0] - n.min[0]), m[1] = n.min[1] + t / (d - 1) * (n.max[1] - n.min[1]), m[2] = n.min[2] + e / (f - 1) * (n.max[2] - n.min[2]);
		let a = ((e * d + t) * l + i) * p * 3;
		for (let e = 0; e < c.samples; e++) {
			h[1] = 1 - 2 * (e + .5) / c.samples;
			let t = Math.sqrt(1 - h[1] * h[1]);
			h[0] = t * Math.cos(e * 2.399963229728653), h[2] = t * Math.sin(e * 2.399963229728653);
			let i = c.bvh.hit(m, h, 1 / 0);
			if (i) {
				for (let e = 0; e < 3; e++) _[e] = m[e] + h[e] * i.distance, v[e] = i.triangle.n[e] + i.triangle.n[e + 3] + i.triangle.n[e + 6];
				if (normalize(v), v[0] * h[0] + v[1] * h[1] + v[2] * h[2] > 0) for (let e = 0; e < 3; e++) v[e] *= -1;
				c.direct(_, v, y, i.triangle);
				for (let e = 0; e < 3; e++) g[e] = y[e] * i.triangle.mesh.material.color[e];
			} else if (s) {
				radiance(s, h, g);
				for (let e = 0; e < 3; e++) g[e] *= r?.environmentIntensity ?? 1;
			} else g.fill(r?.ambientLight ?? 0);
			basis(h[0], h[1], h[2], b);
			for (let e = 0; e < p; e++) for (let t = 0; t < 3; t++) n.coefficients[a + e * 3 + t] += g[t] * b[e] * 4 * Math.PI / c.samples * u[e];
		}
		if (r) {
			let e = r.directionalLight, project = (e, t, r, i) => {
				if (r && !c.bvh.hit(m, e, i)) {
					basis(e[0], e[1], e[2], b);
					for (let e = 0; e < p; e++) for (let i = 0; i < 3; i++) n.coefficients[a + e * 3 + i] += t[i] * r * Math.PI * u[e] * b[e];
				}
			};
			h[0] = e.direction.x, h[1] = e.direction.y, h[2] = e.direction.z, normalize(h), project(h, e.color, e.intensity, 1 / 0);
			for (let e of [r.pointLights, r.spotLights]) for (let t of e) {
				h[0] = t.position.x - m[0], h[1] = t.position.y - m[1], h[2] = t.position.z - m[2];
				let e = Math.hypot(...h);
				if (e <= c.bias || t.range && e >= t.range) continue;
				normalize(h);
				let n = t.intensity / Math.max(.01, e * e);
				if (t.range && (n *= (1 - (e / t.range) ** 4) ** 2), t instanceof require_lights.SpotLight) {
					let e = -(h[0] * t.direction.x + h[1] * t.direction.y + h[2] * t.direction.z) / t.direction.length(), r = Math.max(0, Math.min(1, (e - Math.cos(t.outerAngle)) / (Math.cos(t.innerAngle) - Math.cos(t.outerAngle))));
					n *= r * r * (3 - 2 * r);
				}
				project(h, t.color, n, e - c.bias);
			}
		}
	}
	if (n.coefficients.some((e) => !Number.isFinite(e))) throw RangeError(`Baked irradiance exceeds Float32 storage.`);
	return n;
}
var d = /* @__PURE__ */ new WeakMap();
function bindIrradianceVolume(e, t) {
	if (!(e instanceof require_mesh.Mesh) || t !== void 0 && !(t instanceof BakedIrradianceVolume)) throw TypeError(`Invalid irradiance binding.`);
	t ? d.set(e, t) : d.delete(e);
}
function meshIrradianceVolume(e) {
	return d.get(e);
}
function fillMeshIrradiance(e, t, n = 0) {
	if (!Number.isInteger(n) || n < 0 || t.length < n + 40) throw RangeError(`Irradiance output needs 40 floats.`);
	t.fill(0, n, n + 40), t[n + 37] = e.material instanceof require_pbr_material.PBRMaterial && isBakedLightmap(e.material.lightmap) ? 1 : 0;
	let r = d.get(e);
	if (!r) return;
	let i = e.updateWorldMatrix().elements;
	t[n + 36] = +!!r.sampleSH(i[12], i[13], i[14], t, n);
}
//#endregion
exports.BakedIrradianceVolume = BakedIrradianceVolume;
exports.bakeIrradianceVolume = bakeIrradianceVolume;
exports.bakeLightmap = bakeLightmap;
exports.bindIrradianceVolume = bindIrradianceVolume;
exports.fillMeshIrradiance = fillMeshIrradiance;
exports.isBakedLightmap = isBakedLightmap;
exports.meshIrradianceVolume = meshIrradianceVolume;

//# sourceMappingURL=baked-lighting.cjs.map