const require_math3d = require("../../math/src/math3d.cjs");
const require_geometry = require("./geometry.cjs");
const require_mesh = require("./mesh.cjs");
const require_group = require("./group.cjs");
const require_objects3d = require("./objects3d.cjs");
const require_raycaster = require("./raycaster.cjs");
const require_terrain = require("../../../src/data/terrain.cjs");
const require_terrain_data = require("./terrain-data.cjs");
//#region dist/packages/core/src/terrain3d.js
function positive(e, t) {
	if (!Number.isFinite(e) || e <= 0) throw RangeError(`${t} must be positive and finite.`);
	return e;
}
var Terrain3D = class extends require_group.Group {
	options;
	width;
	depth;
	columns;
	rows;
	heights;
	chunks;
	records = [];
	picker = new require_raycaster.Raycaster();
	hits = [];
	normal = new require_math3d.Vector3();
	skirtDepth;
	constructor(t) {
		super(), this.options = t, this.width = positive(t.width ?? require_terrain.terrainLimits.width, `Terrain width`), this.depth = positive(t.depth ?? require_terrain.terrainLimits.depth, `Terrain depth`), this.skirtDepth = positive(t.skirtDepth ?? require_terrain.terrainLimits.skirtDepth, `Terrain skirt depth`);
		let n = t.heightScale ?? 1, r = t.heightOffset ?? 0, s = t.heightChannel ?? 0;
		if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isInteger(s) || s < 0 || s > 3) throw RangeError(`Invalid terrain height conversion.`);
		let l = t.heightmap, u = `heights` in l ? l : void 0, d = u ? void 0 : require_terrain_data.terrainImageData(l);
		if (this.columns = u?.width ?? d.width, this.rows = u?.height ?? d.height, !Number.isInteger(this.columns) || !Number.isInteger(this.rows) || this.columns < 2 || this.rows < 2 || this.columns * this.rows > require_terrain.terrainLimits.heightSamples || u && u.heights.length !== this.columns * this.rows) throw RangeError(`Terrain requires a bounded height grid with at least two samples per axis.`);
		this.heights = new Float32Array(this.columns * this.rows);
		for (let e = 0; e < this.heights.length; e++) {
			let t = (u ? u.heights[e] : d.data[e * 4 + s] / 255) * n + r;
			if (!Number.isFinite(t) || !Number.isFinite(Math.fround(t))) throw RangeError(`Terrain heights must fit finite Float32.`);
			this.heights[e] = t;
		}
		let f = t.chunkSize ?? require_terrain.terrainLimits.chunkSize, p = t.lodDistances ?? require_terrain.terrainLimits.lodDistances;
		if (!Number.isInteger(f) || f < 1 || f > require_terrain.terrainLimits.maxChunkSize || !p.length || p.length > require_terrain.terrainLimits.maxLODLevels || p[0] !== 0 || p.some((e, t) => !Number.isFinite(e) || e < 0 || t > 0 && e <= p[t - 1]) || Math.ceil((this.columns - 1) / f) * Math.ceil((this.rows - 1) / f) > require_terrain.terrainLimits.chunks) throw RangeError(`Invalid terrain chunk size or LOD distances.`);
		t.hlodScreenSize !== void 0 && positive(t.hlodScreenSize, `Terrain HLOD screen size`);
		for (let e = 0; e < this.rows - 1; e += f) for (let n = 0; n < this.columns - 1; n += f) {
			let r = Math.min(n + f, this.columns - 1), s = Math.min(e + f, this.rows - 1), c = [], l = new require_objects3d.LOD({
				hysteresis: t.hysteresis,
				crossFadeDuration: t.crossFadeDuration
			});
			for (let a = 0; a < p.length; a++) {
				let o = new require_mesh.Mesh({
					geometry: this.buildGeometry(n, e, r, s, 2 ** a),
					material: t.material,
					castShadow: t.castShadow,
					receiveShadow: t.receiveShadow
				});
				c.push(o), l.addLevel(o, p[a]);
			}
			let u = t.hlodScreenSize === void 0 ? l : new require_objects3d.HLOD({
				children: [l],
				proxy: new require_mesh.Mesh({
					geometry: c[c.length - 1].geometry,
					material: t.material,
					castShadow: t.castShadow,
					receiveShadow: t.receiveShadow
				}),
				screenSize: t.hlodScreenSize,
				hysteresis: t.hysteresis,
				crossFadeDuration: t.crossFadeDuration
			});
			u.position.set(((n + r) / 2 / (this.columns - 1) - .5) * this.width, 0, ((e + s) / 2 / (this.rows - 1) - .5) * this.depth), this.add(u), this.records.push({
				x: n,
				z: e,
				endX: r,
				endZ: s,
				node: u,
				meshes: c
			});
		}
		this.chunks = this.records.map((e) => e.node);
	}
	heightAt(e, t) {
		if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError(`Terrain coordinates must be finite.`);
		let n = (e / this.width + .5) * (this.columns - 1), r = (t / this.depth + .5) * (this.rows - 1);
		if (n < 0 || r < 0 || n > this.columns - 1 || r > this.rows - 1) return;
		let i = Math.min(Math.floor(n), this.columns - 2), a = Math.min(Math.floor(r), this.rows - 2), o = n - i, s = r - a, c = this.heights[a * this.columns + i], l = this.heights[a * this.columns + i + 1], u = this.heights[(a + 1) * this.columns + i], d = this.heights[(a + 1) * this.columns + i + 1];
		return o + s <= 1 ? c + (l - c) * o + (u - c) * s : d + (u - d) * (1 - o) + (l - d) * (1 - s);
	}
	normalAt(e, n, r = new require_math3d.Vector3()) {
		if (this.heightAt(e, n) === void 0) return;
		let i = this.width / (this.columns - 1), a = this.depth / (this.rows - 1), o = Math.max(-this.width / 2, e - i), s = Math.min(this.width / 2, e + i), c = Math.max(-this.depth / 2, n - a), l = Math.min(this.depth / 2, n + a);
		return r.set(-(this.heightAt(s, n) - this.heightAt(o, n)) / (s - o), 1, -(this.heightAt(e, l) - this.heightAt(e, c)) / (l - c)).normalize();
	}
	raycast(e, t, n = 1 / 0) {
		return this.picker.origin.set(e.x, e.y, e.z), this.picker.direction.set(t.x, t.y, t.z), this.picker.far = n, this.picker.intersectObjects([this], !0, this.hits)[0];
	}
	markUpdated() {
		if (this.destroyed) throw Error(`Terrain is destroyed.`);
		for (let e of this.heights) if (!Number.isFinite(e)) throw RangeError(`Terrain heights must be finite.`);
		for (let e of this.records) for (let t of e.meshes) {
			let e = t.geometry.vertices;
			for (let n = 0; n < e.length; n += 8) {
				let r = (e[n + 6] - .5) * this.width, i = (e[n + 7] - .5) * this.depth, a = this.skirtVertices.get(t.geometry).has(n / 8);
				e[n + 1] = this.heightAt(r, i) - (a ? this.skirtDepth : 0), this.normalAt(r, i, this.normal), e[n + 3] = this.normal.x, e[n + 4] = this.normal.y, e[n + 5] = this.normal.z;
				let o = n / 2, s = Math.hypot(this.normal.y, this.normal.x);
				t.geometry.tangents[o] = this.normal.y / s, t.geometry.tangents[o + 1] = -this.normal.x / s, t.geometry.tangents[o + 2] = 0, t.geometry.tangents[o + 3] = -1;
			}
			t.geometry.markUpdated();
		}
	}
	skirtVertices = /* @__PURE__ */ new Map();
	buildGeometry(e, t, r, i, a) {
		let o = [], s = [];
		for (let t = e; t < r; t += a) o.push(t);
		o.push(r);
		for (let e = t; e < i; e += a) s.push(e);
		s.push(i);
		let c = [], l = [], u = [], d = [], f = /* @__PURE__ */ new Set(), p = ((e + r) / 2 / (this.columns - 1) - .5) * this.width, m = ((t + i) / 2 / (this.rows - 1) - .5) * this.depth;
		for (let e of s) for (let t of o) {
			let n = (t / (this.columns - 1) - .5) * this.width, r = (e / (this.rows - 1) - .5) * this.depth;
			c.push(n - p, this.heights[e * this.columns + t], r - m), this.normalAt(n, r, this.normal), l.push(this.normal.x, this.normal.y, this.normal.z), u.push(t / (this.columns - 1), e / (this.rows - 1));
		}
		let h = o.length;
		for (let e = 0; e < s.length - 1; e++) for (let t = 0; t < h - 1; t++) {
			let n = e * h + t, r = n + 1, i = n + h, a = i + 1;
			d.push(n, i, r, r, i, a);
		}
		let g = [];
		for (let e = 0; e < h; e++) g.push(e);
		for (let e = 1; e < s.length; e++) g.push(e * h + h - 1);
		for (let e = h - 2; e >= 0; e--) g.push((s.length - 1) * h + e);
		for (let e = s.length - 2; e > 0; e--) g.push(e * h);
		let _ = c.length / 3;
		for (let e of g) f.add(c.length / 3), c.push(c[e * 3], c[e * 3 + 1] - this.skirtDepth, c[e * 3 + 2]), l.push(l[e * 3], l[e * 3 + 1], l[e * 3 + 2]), u.push(u[e * 2], u[e * 2 + 1]);
		for (let e = 0; e < g.length; e++) {
			let t = (e + 1) % g.length;
			d.push(g[e], _ + e, g[t], g[t], _ + e, _ + t);
		}
		let v = new require_geometry.Geometry({
			positions: c,
			normals: l,
			uvs: u,
			indices: d
		});
		return this.skirtVertices.set(v, f), v;
	}
	createStreamingCells(n = `terrain`) {
		if (this.destroyed || this.parent || this.rotation.x !== 0 || this.rotation.y !== 0 || this.rotation.z !== 0 || Math.abs(this.rotation.w) !== 1 || this.scale.x !== 1 || this.scale.y !== 1 || this.scale.z !== 1) throw Error(`Terrain streaming catalogs require a live unparented translation-only source.`);
		let s = new require_math3d.Vector3().copy(this.position);
		return this.records.map((t, c) => {
			let l = 1 / 0, u = -1 / 0;
			for (let e = t.z; e <= t.endZ; e++) for (let n = t.x; n <= t.endX; n++) {
				let t = this.heights[e * this.columns + n];
				l = Math.min(l, t), u = Math.max(u, t);
			}
			return {
				id: `${n}:${c}`,
				bounds: {
					min: {
						x: (t.x / (this.columns - 1) - .5) * this.width + s.x,
						y: l - this.skirtDepth + s.y,
						z: (t.z / (this.rows - 1) - .5) * this.depth + s.z
					},
					max: {
						x: (t.endX / (this.columns - 1) - .5) * this.width + s.x,
						y: u + s.y,
						z: (t.endZ / (this.rows - 1) - .5) * this.depth + s.z
					}
				},
				load: (n) => {
					if (n.signal.aborted || this.destroyed) throw Error(`Terrain streaming source is unavailable.`);
					let c = n.own(new require_group.Group());
					c.position.copy(s);
					let l = new require_objects3d.LOD({
						hysteresis: this.options.hysteresis,
						crossFadeDuration: this.options.crossFadeDuration
					});
					t.meshes.forEach((t, n) => l.addLevel(new require_mesh.Mesh({
						geometry: t.geometry,
						material: t.material,
						castShadow: t.castShadow,
						receiveShadow: t.receiveShadow
					}), (this.options.lodDistances ?? require_terrain.terrainLimits.lodDistances)[n]));
					let u = this.options.hlodScreenSize === void 0 ? l : new require_objects3d.HLOD({
						children: [l],
						proxy: new require_mesh.Mesh({
							geometry: t.meshes[t.meshes.length - 1].geometry,
							material: this.options.material
						}),
						screenSize: this.options.hlodScreenSize
					});
					return u.position.copy(t.node.position), c.add(u), { root: c };
				}
			};
		});
	}
};
//#endregion
exports.Terrain3D = Terrain3D;

//# sourceMappingURL=terrain3d.cjs.map