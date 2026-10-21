const require_models = require("../../../src/data/models.cjs");
const require_hypot = require("../../math/src/hypot.cjs");
const require_geometry = require("./geometry.cjs");
const require_mikktspace_wasm = require("./mikktspace-wasm.cjs");
//#region dist/packages/core/src/geometry-tangents.js
function remapVertexData(e, t, n, r = n, i = 0) {
	let a = new Float32Array(t.length * n);
	for (let o = 0; o < t.length; o++) {
		let s = t[o] * r + i;
		for (let t = 0; t < n; t++) a[o * n + t] = e[s + t];
	}
	return a;
}
function generateMikkTangents(i, a = {}) {
	if (!(i instanceof require_geometry.Geometry)) throw TypeError(`MikkTSpace requires Geometry.`);
	let o = a.convention ?? `uv`;
	if (o !== `uv` && o !== `gltf`) throw RangeError(`Unknown tangent convention.`);
	let s = a.texCoord ?? 0;
	if (s !== 0 && s !== 1) throw RangeError(`MikkTSpace requires UV0 or UV1.`);
	if (s === 1 && !i.uvs1) throw RangeError(`MikkTSpace requires the requested UV stream.`);
	let c = i.vertices, l = i.indices, u = c.length / 8, d = l.length;
	if (u > require_models.modelLimits.vertices || d > require_models.modelLimits.indices) throw RangeError(`MikkTSpace geometry exceeds model limits.`);
	let f = Math.min(u + d, require_models.modelLimits.vertices);
	if (d * 52 + u * 4 + f * (100 + (i.uvs1 ? 16 : 0) + (i.colors ? 32 : 0)) > require_models.modelLimits.decodedBytes) throw RangeError(`MikkTSpace working streams exceed decoded allocation limits.`);
	let p = new Float32Array(d * 3), m = new Float32Array(d * 3), h = new Float32Array(d * 2);
	for (let e = 0; e < d; e++) {
		let t = l[e] * 8;
		p[e * 3] = c[t], p[e * 3 + 1] = c[t + 1], p[e * 3 + 2] = c[t + 2];
		let n = require_hypot.hypot3(c[t + 3], c[t + 4], c[t + 5]);
		m[e * 3] = n > 0 ? c[t + 3] / n : 0, m[e * 3 + 1] = n > 0 ? c[t + 4] / n : 0, m[e * 3 + 2] = n > 0 ? c[t + 5] / n : 1, h[e * 2] = s === 1 ? i.uvs1[l[e] * 2] : c[t + 6], h[e * 2 + 1] = s === 1 ? i.uvs1[l[e] * 2 + 1] : c[t + 7];
	}
	let g = require_mikktspace_wasm.mikkTangents(p, m, h), _ = [];
	for (let e = 0; e < u; e++) _.push(e);
	let v = new Int32Array(u).fill(-1), y = [], b = new Uint32Array(d), x = new Uint32Array(d * 4), S = new Uint32Array(g.buffer, g.byteOffset, g.length);
	for (let e = 0; e < d * 4; e++) {
		let t = g[e];
		x[e] = t === 0 ? 0 : t === t ? S[e] : 2143289344;
	}
	let C = 16;
	for (; C < d * 2;) C *= 2;
	let w = new Int32Array(C).fill(-1), T = new Uint32Array(C), E = C - 1;
	for (let e = 0; e < d; e++) {
		let n = l[e], r = e * 4, i = Math.imul(n, 2654435761);
		for (let e = 0; e < 4; e++) i = Math.imul(i ^ x[r + e], 16777619);
		let a = (i ^ i >>> 15) & E, o = -1;
		for (; w[a] >= 0; a = a + 1 & E) {
			let e = w[a], t = e * 4;
			if (l[e] === n && x[t] === x[r] && x[t + 1] === x[r + 1] && x[t + 2] === x[r + 2] && x[t + 3] === x[r + 3]) {
				o = T[a];
				break;
			}
		}
		if (o < 0) {
			if (v[n] < 0) o = n, v[n] = e;
			else {
				if (_.length >= require_models.modelLimits.vertices) throw RangeError(`MikkTSpace seam splitting exceeds vertex limits.`);
				o = _.length, _.push(n), y.push(e);
			}
			w[a] = e, T[a] = o;
		}
		b[e] = o;
	}
	if (_.length > require_models.modelLimits.vertices) throw RangeError(`MikkTSpace seam splitting exceeds vertex limits.`);
	let D = new Uint32Array(_), O = new Float32Array(D.length * 4);
	for (let e = 0; e < D.length; e++) {
		let t = e < u ? v[e] : y[e - u], n = t < 0 ? i.tangents : g, r = t < 0 ? e * 4 : t * 4;
		O[e * 4] = n[r], O[e * 4 + 1] = n[r + 1], O[e * 4 + 2] = n[r + 2];
		let a = t < 0 ? i.tangentConvention === o ? 1 : -1 : o === `gltf` ? -1 : 1;
		O[e * 4 + 3] = n[r + 3] * a;
	}
	return {
		sourceVertices: D,
		geometry: new require_geometry.Geometry({
			positions: remapVertexData(c, D, 3, 8),
			normals: remapVertexData(c, D, 3, 8, 3),
			uvs: remapVertexData(c, D, 2, 8, 6),
			uvs1: i.uvs1 ? remapVertexData(i.uvs1, D, 2) : void 0,
			colors: i.colors ? remapVertexData(i.colors, D, 4) : void 0,
			tangents: O,
			tangentTexCoord: s,
			tangentConvention: o,
			indices: b
		})
	};
}
//#endregion
exports.generateMikkTangents = generateMikkTangents;
exports.remapVertexData = remapVertexData;

//# sourceMappingURL=geometry-tangents.cjs.map