const require_texture = require("../../assets/src/texture.cjs");
const require_native_pbr_material = require("./native-pbr-material.cjs");
const require_terrain = require("../../../src/data/terrain.cjs");
const require_terrain_data = require("./terrain-data.cjs");
//#region dist/packages/core/src/terrain-splat.js
function linear(e) {
	return e <= .04045 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4;
}
function srgb(e) {
	return e <= .0031308 ? e * 12.92 : 1.055 * e ** (1 / 2.4) - .055;
}
function unit(e, t) {
	if (!Number.isFinite(e) || e < 0 || e > 1) throw RangeError(`${t} must be in [0,1].`);
	return e;
}
function byte(e) {
	return Math.round(Math.max(0, Math.min(1, e)) * 255);
}
function bakeTerrainSplat(t) {
	let n = t.size ?? require_terrain.terrainLimits.splatSize;
	if (!Number.isInteger(n) || n < 2 || n > require_terrain.terrainLimits.maxSplatSize || !t.layers.length || t.layers.length > require_terrain.terrainLimits.maxSplatLayers) throw RangeError(`Terrain splat requires 1..4 layers and a bounded integer size.`);
	let a = require_terrain_data.terrainImageData(t.weights), o = t.layers.map((e) => {
		let t = e.color ?? [
			1,
			1,
			1
		], n = e.emissiveFactor ?? [
			1,
			1,
			1
		], r = e.scale ?? [1, 1];
		if (t.length !== 3 || n.length !== 3 || r.length !== 2 || r.some((e) => !Number.isFinite(e) || e <= 0)) throw RangeError(`Invalid terrain layer color or UV scale.`);
		t.forEach((e) => unit(e, `Terrain layer color`)), n.forEach((e) => unit(e, `Terrain layer emission`));
		let a = e.normalScale ?? 1;
		if (!Number.isFinite(a) || a < 0) throw RangeError(`Terrain normal scale must be nonnegative and finite.`);
		let o = require_terrain_data.terrainImageData(e.baseColor);
		for (let e = 3; e < o.data.length; e += 4) if (o.data[e] !== 255) throw RangeError(`Terrain splat layers must be opaque.`);
		return {
			base: o,
			normal: e.normal ? require_terrain_data.terrainImageData(e.normal) : void 0,
			mr: e.metallicRoughness ? require_terrain_data.terrainImageData(e.metallicRoughness) : void 0,
			ao: e.occlusion ? require_terrain_data.terrainImageData(e.occlusion) : void 0,
			emission: e.emissive ? require_terrain_data.terrainImageData(e.emissive) : void 0,
			color: t,
			emissionFactor: n,
			scale: r,
			normalScale: a,
			metallic: unit(e.metallic ?? 0, `Terrain metallic`),
			roughness: unit(e.roughness ?? 1, `Terrain roughness`)
		};
	}), s = new Uint8ClampedArray(n * n * 4), c = new Uint8ClampedArray(s.length), l = new Uint8ClampedArray(s.length), u = new Uint8ClampedArray(s.length), d = new Float64Array(o.length);
	for (let e = 0; e < n; e++) for (let t = 0; t < n; t++) {
		let i = t / (n - 1), f = e / (n - 1), p = (e * n + t) * 4, m = 0;
		for (let e = 0; e < o.length; e++) d[e] = require_terrain_data.terrainChannel(a, i, f, e), m += d[e];
		m === 0 && (d[0] = 1, m = 1);
		let h = 0, g = 0, _ = 0, v = 0, y = 0, b = 0, x = 0, S = 0, C = 0, w = 0, T = 0, E = 0;
		for (let e = 0; e < o.length; e++) {
			let t = o[e], n = d[e] / m, a = i * t.scale[0], s = f * t.scale[1];
			h += linear(require_terrain_data.terrainChannel(t.base, a, s, 0, !0)) * t.color[0] * n, g += linear(require_terrain_data.terrainChannel(t.base, a, s, 1, !0)) * t.color[1] * n, _ += linear(require_terrain_data.terrainChannel(t.base, a, s, 2, !0)) * t.color[2] * n;
			let c = 0, l = 0, u = 1;
			t.normal && (c = (require_terrain_data.terrainChannel(t.normal, a, s, 0, !0) * 2 - 1) * t.normalScale, l = (require_terrain_data.terrainChannel(t.normal, a, s, 1, !0) * 2 - 1) * t.normalScale, u = require_terrain_data.terrainChannel(t.normal, a, s, 2, !0) * 2 - 1);
			let p = Math.hypot(c, l, u) || 1;
			v += c / p * n, y += l / p * n, b += u / p * n, x += t.roughness * (t.mr ? require_terrain_data.terrainChannel(t.mr, a, s, 1, !0) : 1) * n, S += t.metallic * (t.mr ? require_terrain_data.terrainChannel(t.mr, a, s, 2, !0) : 1) * n, C += (t.ao ? require_terrain_data.terrainChannel(t.ao, a, s, 0, !0) : 1) * n, t.emission && (w += linear(require_terrain_data.terrainChannel(t.emission, a, s, 0, !0)) * t.emissionFactor[0] * n, T += linear(require_terrain_data.terrainChannel(t.emission, a, s, 1, !0)) * t.emissionFactor[1] * n, E += linear(require_terrain_data.terrainChannel(t.emission, a, s, 2, !0)) * t.emissionFactor[2] * n);
		}
		let D = Math.hypot(v, y, b);
		D === 0 && (v = 0, y = 0, b = 1), s[p] = byte(srgb(h)), s[p + 1] = byte(srgb(g)), s[p + 2] = byte(srgb(_)), s[p + 3] = 255, c[p] = byte(v / (D || 1) * .5 + .5), c[p + 1] = byte(y / (D || 1) * .5 + .5), c[p + 2] = byte(b / (D || 1) * .5 + .5), c[p + 3] = 255, l[p] = byte(C), l[p + 1] = byte(x), l[p + 2] = byte(S), l[p + 3] = 255, u[p] = byte(srgb(w)), u[p + 1] = byte(srgb(T)), u[p + 2] = byte(srgb(E)), u[p + 3] = 255;
	}
	return {
		baseColor: {
			width: n,
			height: n,
			data: s
		},
		normal: {
			width: n,
			height: n,
			data: c
		},
		metallicRoughness: {
			width: n,
			height: n,
			data: l
		},
		emissive: {
			width: n,
			height: n,
			data: u
		}
	};
}
var TerrainSplatMaterial = class TerrainSplatMaterial {
	material;
	textures;
	disposed = !1;
	constructor(e) {
		this.textures = e, this.material = new require_native_pbr_material.NativePBRMaterial({
			texture: e[0],
			normalTexture: e[1],
			metallicRoughnessTexture: e[2],
			emissiveTexture: e[3],
			metallic: 1,
			roughness: 1,
			emissive: [
				1,
				1,
				1
			],
			deformationBounds: 0,
			shadowCache: `tracked`,
			label: `Terrain splat (four-map budget)`,
			wgsl: `fn xyzPhysical(world:vec3f,normal:vec3f,uv:vec2f,surface:XYZPhysical)->XYZPhysical { var s=surface; s.occlusion=textureSample(metallicRoughnessMap,metallicRoughnessSampler,uv).r; return s; }`,
			glsl: `XYZPhysical xyzPhysical(vec3 world,vec3 normal,vec2 uv,XYZPhysical surface) {
#if defined(XYZ_FRAGMENT) && !defined(XYZ_SHADOW)
surface.occlusion=texture(metallicRoughnessMap,uv).r;
#endif
return surface; }`
		});
	}
	static async create(e) {
		let n = bakeTerrainSplat(e), r = [];
		try {
			for (let e of [
				n.baseColor,
				n.normal,
				n.metallicRoughness,
				n.emissive
			]) r.push(await require_texture.Texture.fromImage(new ImageData(e.data, e.width, e.height)));
			return new TerrainSplatMaterial(r);
		} catch (e) {
			for (let e of r) e.destroy();
			throw e;
		}
	}
	get destroyed() {
		return this.disposed;
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			try {
				this.material.destroy();
			} finally {
				for (let e of this.textures) e.destroy();
			}
		}
	}
};
//#endregion
exports.TerrainSplatMaterial = TerrainSplatMaterial;
exports.bakeTerrainSplat = bakeTerrainSplat;

//# sourceMappingURL=terrain-splat.cjs.map