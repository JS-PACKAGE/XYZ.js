const require_models = require("../../../src/data/models.cjs");
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
function generateMikkTangents(r, i = {}) {
	if (!(r instanceof require_geometry.Geometry)) throw TypeError(`MikkTSpace requires Geometry.`);
	let a = i.convention ?? `uv`;
	if (a !== `uv` && a !== `gltf`) throw RangeError(`Unknown tangent convention.`);
	let o = i.texCoord ?? 0;
	if (o !== 0 && o !== 1) throw RangeError(`MikkTSpace requires UV0 or UV1.`);
	if (o === 1 && !r.uvs1) throw RangeError(`MikkTSpace requires the requested UV stream.`);
	let s = r.vertices, c = r.indices, l = s.length / 8, u = c.length;
	if (l > require_models.modelLimits.vertices || u > require_models.modelLimits.indices) throw RangeError(`MikkTSpace geometry exceeds model limits.`);
	let d = Math.min(l + u, require_models.modelLimits.vertices);
	if (u * 52 + l * 4 + d * (100 + (r.uvs1 ? 16 : 0) + (r.colors ? 32 : 0)) > require_models.modelLimits.decodedBytes) throw RangeError(`MikkTSpace working streams exceed decoded allocation limits.`);
	let f = new Float32Array(u * 3), p = new Float32Array(u * 3), m = new Float32Array(u * 2);
	for (let e = 0; e < u; e++) {
		let t = c[e] * 8;
		f[e * 3] = s[t], f[e * 3 + 1] = s[t + 1], f[e * 3 + 2] = s[t + 2];
		let n = Math.hypot(s[t + 3], s[t + 4], s[t + 5]);
		p[e * 3] = n > 0 ? s[t + 3] / n : 0, p[e * 3 + 1] = n > 0 ? s[t + 4] / n : 0, p[e * 3 + 2] = n > 0 ? s[t + 5] / n : 1, m[e * 2] = o === 1 ? r.uvs1[c[e] * 2] : s[t + 6], m[e * 2 + 1] = o === 1 ? r.uvs1[c[e] * 2 + 1] : s[t + 7];
	}
	let h = require_mikktspace_wasm.mikkTangents(f, p, m), g = Array.from({ length: l }, (e, t) => t), _ = new Int32Array(l).fill(-1), v = [], y = new Uint32Array(u), b = /* @__PURE__ */ new Map();
	for (let e = 0; e < u; e++) {
		let n = c[e], r = e * 4, i = `${n}/${h[r]}/${h[r + 1]}/${h[r + 2]}/${h[r + 3]}`, a = b.get(i);
		if (a === void 0) {
			if (_[n] < 0) a = n, _[n] = e;
			else {
				if (g.length >= require_models.modelLimits.vertices) throw RangeError(`MikkTSpace seam splitting exceeds vertex limits.`);
				a = g.length, g.push(n), v.push(e);
			}
			b.set(i, a);
		}
		y[e] = a;
	}
	if (g.length > require_models.modelLimits.vertices) throw RangeError(`MikkTSpace seam splitting exceeds vertex limits.`);
	let x = new Uint32Array(g), S = new Float32Array(x.length * 4);
	for (let e = 0; e < x.length; e++) {
		let t = e < l ? _[e] : v[e - l], n = t < 0 ? r.tangents : h, i = t < 0 ? e * 4 : t * 4;
		S[e * 4] = n[i], S[e * 4 + 1] = n[i + 1], S[e * 4 + 2] = n[i + 2];
		let o = t < 0 ? r.tangentConvention === a ? 1 : -1 : a === `gltf` ? -1 : 1;
		S[e * 4 + 3] = n[i + 3] * o;
	}
	return {
		sourceVertices: x,
		geometry: new require_geometry.Geometry({
			positions: remapVertexData(s, x, 3, 8),
			normals: remapVertexData(s, x, 3, 8, 3),
			uvs: remapVertexData(s, x, 2, 8, 6),
			uvs1: r.uvs1 ? remapVertexData(r.uvs1, x, 2) : void 0,
			colors: r.colors ? remapVertexData(r.colors, x, 4) : void 0,
			tangents: S,
			tangentTexCoord: o,
			tangentConvention: a,
			indices: y
		})
	};
}
//#endregion
exports.generateMikkTangents = generateMikkTangents;
exports.remapVertexData = remapVertexData;

//# sourceMappingURL=geometry-tangents.cjs.map