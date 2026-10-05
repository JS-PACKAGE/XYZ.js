const require_assets = require("../../../src/data/assets.cjs");
const require_texture = require("../../assets/src/texture.cjs");
const require_read_response = require("../../assets/src/read-response.cjs");
const require_models = require("../../../src/data/models.cjs");
const require_math3d = require("../../math/src/math3d.cjs");
const require_geometry = require("./geometry.cjs");
const require_morph = require("./morph.cjs");
const require_mesh = require("./mesh.cjs");
const require_animation = require("./animation.cjs");
const require_group = require("./group.cjs");
const require_lights = require("./lights.cjs");
const require_geometry_tangents = require("./geometry-tangents.cjs");
const require_pbr_material = require("./pbr-material.cjs");
const require_skinned_mesh = require("./skinned-mesh.cjs");
const require_meshopt = require("./meshopt.cjs");
const require_ktx2 = require("./ktx2.cjs");
//#region dist/packages/core/src/gltf-loader.js
function object(t, n) {
	if (!t || typeof t != `object` || Array.isArray(t)) throw new require_texture.AssetError(`${n} must be an object.`);
	return t;
}
function integer(t, n, r = 2 ** 53 - 1) {
	if (typeof t != `number` || !Number.isSafeInteger(t) || t < 0 || t > r) throw new require_texture.AssetError(`${n} is outside its allowed range.`);
	return t;
}
function number(t, n) {
	if (typeof t != `number` || !Number.isFinite(t) || !Number.isFinite(Math.fround(t))) throw new require_texture.AssetError(`${n} must be a finite Float32 number.`);
	return t;
}
function vector(t, n, r) {
	if (!Array.isArray(t) || t.length !== n) throw new require_texture.AssetError(`${r} must contain ${n} numbers.`);
	return t.map((e) => number(e, r));
}
function list(t, n) {
	if (t === void 0) return [];
	if (!Array.isArray(t) || t.length > require_models.modelLimits.entries) throw new require_texture.AssetError(`${n} exceeds the entry budget.`);
	return t.map((e) => object(e, n));
}
function reference(t, n, r) {
	let i = integer(n, r);
	if (i >= t.length) throw new require_texture.AssetError(`${r} reference is out of bounds.`);
	return t[i];
}
function url(t, n) {
	if (typeof t != `string`) throw new require_texture.AssetError(`Asset URI must be a string.`);
	try {
		return new URL(t, n ?? (typeof document < `u` ? document.baseURI : void 0)).href;
	} catch (t) {
		throw new require_texture.AssetError(`Invalid asset URI.`, { cause: t });
	}
}
var DecodeContext = class {
	signal;
	base;
	allowedOrigins;
	fetched = 0;
	decoded = 0;
	textures = [];
	constructor(e, t, n = []) {
		this.signal = e, this.base = t, this.allowedOrigins = n;
	}
	reserve(t) {
		if (this.decoded += t, !Number.isSafeInteger(this.decoded) || this.decoded > require_models.modelLimits.decodedBytes) throw new require_texture.AssetError(`Model exceeds decoded memory budget.`);
	}
	async bytes(t, r = require_models.modelLimits.fetchedBytes) {
		this.signal.throwIfAborted();
		let i = url(t, this.base);
		if (i.startsWith(`data:`)) {
			let t = i.indexOf(`,`);
			if (t < 0) throw new require_texture.AssetError(`Invalid data URI.`);
			let n = i.slice(t + 1);
			if (n.length > r * 4 + 16) throw new require_texture.AssetError(`Data URI exceeds byte budget.`);
			let o = i.slice(0, t).endsWith(`;base64`), s = o ? Math.floor(n.replace(/\s/g, ``).length * 3 / 4) : 0;
			if (o) n.endsWith(`==`) ? s -= 2 : n.endsWith(`=`) && s--;
			else for (let t = 0; t < n.length; t++) {
				if (n[t] === `%`) {
					if (!/^[0-9a-f]{2}$/i.test(n.slice(t + 1, t + 3))) throw new require_texture.AssetError(`Invalid percent-encoded data URI.`);
					t += 2;
				}
				s++;
			}
			if (s > r || this.fetched + s > require_models.modelLimits.fetchedBytes) throw new require_texture.AssetError(`Model exceeds fetched byte budget.`);
			if (this.fetched += s, this.reserve(s), o) {
				let e = atob(n);
				return Uint8Array.from(e, (e) => e.charCodeAt(0)).buffer;
			}
			let c = new Uint8Array(s);
			for (let e = 0, t = 0; e < n.length; e++, t++) n[e] === `%` ? (c[t] = Number.parseInt(n.slice(e + 1, e + 3), 16), e += 2) : c[t] = n.charCodeAt(e);
			return c.buffer;
		}
		let o = await fetch(i, { signal: this.signal });
		if (!o.ok) throw new require_texture.AssetError(`Model request failed (HTTP ${o.status}).`);
		let s = await require_read_response.readResponse(o, Math.min(r, require_models.modelLimits.fetchedBytes - this.fetched), this.signal);
		return this.fetched += s.size, this.reserve(s.size), s.arrayBuffer();
	}
	resource(t, n) {
		let r = url(t, this.base);
		if (!/^(data|blob):/.test(r)) {
			let t = new URL(r).origin;
			if (t !== (this.base ? new URL(this.base).origin : void 0) && !this.allowedOrigins.includes(t)) throw new require_texture.AssetError(`Model resource origin is not allowed: ${t}`);
		}
		return this.bytes(r, n);
	}
	async texture(e) {
		this.signal.throwIfAborted();
		let n = require_texture.Texture.fromImage(e), abort, r = new Promise((e, t) => {
			abort = () => t(this.signal.reason ?? new DOMException(`Aborted`, `AbortError`)), this.signal.addEventListener(`abort`, abort, { once: !0 }), this.signal.aborted && abort();
		});
		n.then((e) => {
			this.signal.aborted && e.destroy();
		}, () => {});
		try {
			let e = await Promise.race([n, r]);
			return this.textures.push(e), this.signal.throwIfAborted(), this.reserve(e.width * e.height * 4), e;
		} finally {
			this.signal.removeEventListener(`abort`, abort);
		}
	}
};
var w = {
	5120: 1,
	5121: 1,
	5122: 2,
	5123: 2,
	5125: 4,
	5126: 4
};
var T = {
	SCALAR: 1,
	VEC2: 2,
	VEC3: 3,
	VEC4: 4,
	MAT2: 4,
	MAT3: 9,
	MAT4: 16
};
function scalar(t, n, r, i) {
	let a;
	switch (r) {
		case 5120: return a = t.getInt8(n), i ? Math.max(-1, a / 127) : a;
		case 5121: return a = t.getUint8(n), i ? a / 255 : a;
		case 5122: return a = t.getInt16(n, !0), i ? Math.max(-1, a / 32767) : a;
		case 5123: return a = t.getUint16(n, !0), i ? a / 65535 : a;
		case 5125: return t.getUint32(n, !0);
		case 5126: return t.getFloat32(n, !0);
		default: throw new require_texture.AssetError(`Unsupported accessor component.`);
	}
}
var E = /* @__PURE__ */ new Set([
	`KHR_materials_emissive_strength`,
	`KHR_materials_unlit`,
	`KHR_materials_ior`,
	`KHR_materials_specular`,
	`KHR_materials_clearcoat`,
	`KHR_materials_sheen`,
	`KHR_materials_transmission`,
	`KHR_materials_volume`,
	`KHR_texture_transform`,
	`KHR_lights_punctual`,
	`KHR_mesh_quantization`,
	`EXT_meshopt_compression`
]);
var GLTFLoader = class {
	task(e, t) {
		return {
			key: e,
			load: async (e) => {
				let n = await this.load(t, { signal: e }), abort = () => n.dispose();
				return e.aborted && (n.dispose(), e.throwIfAborted()), e.addEventListener(`abort`, abort, { once: !0 }), n;
			}
		};
	}
	async load(e, t = {}) {
		let n = url(e), r = await new DecodeContext(t.signal ?? new AbortController().signal, n, t.allowedOrigins).bytes(n, require_models.modelLimits.inputBytes);
		return this.parse(r, n, t);
	}
	async parse(t, n, i = {}) {
		let f = new DecodeContext(i.signal ?? new AbortController().signal, n, i.allowedOrigins);
		f.signal.throwIfAborted();
		let p, D = [];
		try {
			let n, O;
			if (typeof t == `string`) {
				if (t.length > require_models.modelLimits.inputBytes) throw new require_texture.AssetError(`Model input exceeds byte budget.`);
				let r = 0;
				for (let n = 0; n < t.length; n++) {
					let i = t.charCodeAt(n);
					if (i < 128 ? r++ : i < 2048 ? r += 2 : i >= 55296 && i <= 56319 && n + 1 < t.length && t.charCodeAt(n + 1) >= 56320 && t.charCodeAt(n + 1) <= 57343 ? (r += 4, n++) : r += 3, r > require_models.modelLimits.inputBytes) throw new require_texture.AssetError(`Model input exceeds byte budget.`);
				}
				n = t, f.fetched = r;
			} else {
				if (t.byteLength > require_models.modelLimits.inputBytes) throw new require_texture.AssetError(`Model input exceeds byte budget.`);
				f.fetched = t.byteLength;
				let r = new DataView(t);
				if (t.byteLength >= 4 && r.getUint32(0, !0) === 1179937895) {
					if (t.byteLength < 20 || r.getUint32(4, !0) !== 2 || r.getUint32(8, !0) !== t.byteLength) throw new require_texture.AssetError(`Invalid GLB header.`);
					let i = 12, a, o = 0;
					for (; i < t.byteLength;) {
						if (i + 8 > t.byteLength) throw new require_texture.AssetError(`Truncated GLB chunk.`);
						let n = r.getUint32(i, !0), s = r.getUint32(i + 4, !0);
						if (i += 8, n % 4 || i + n > t.byteLength) throw new require_texture.AssetError(`Invalid GLB chunk length.`);
						if (o++ === 0 && s !== 1313821514) throw new require_texture.AssetError(`GLB must begin with JSON.`);
						if (s === 1313821514) {
							if (a) throw new require_texture.AssetError(`Duplicate GLB JSON chunk.`);
							a = new Uint8Array(t, i, n);
						} else if (s === 5130562) {
							if (O || o !== 2) throw new require_texture.AssetError(`Invalid GLB binary chunk.`);
							f.reserve(n), O = t.slice(i, i + n);
						}
						i += n;
					}
					if (!a) throw new require_texture.AssetError(`Missing GLB JSON.`);
					n = new TextDecoder(`utf-8`, { fatal: !0 }).decode(a);
				} else n = new TextDecoder(`utf-8`, { fatal: !0 }).decode(t);
			}
			let k = object(JSON.parse(n), `glTF`), A = object(k.asset, `glTF asset`);
			if (A.version !== `2.0` || A.minVersion !== void 0 && A.minVersion !== `2.0`) throw new require_texture.AssetError(`Only glTF 2.0 is supported.`);
			if (k.extensionsRequired !== void 0) {
				if (!Array.isArray(k.extensionsRequired)) throw new require_texture.AssetError(`extensionsRequired must be an array.`);
				for (let t of k.extensionsRequired) if (typeof t != `string` || !(E.has(t) || t === `KHR_draco_mesh_compression` && i.dracoDecoder || t === `KHR_texture_basisu` && (i.ktx2Transcoder || i.nativeTextures))) throw new require_texture.AssetError(`Required glTF extensions are unsupported.`);
			}
			let j = list(k.buffers, `buffers`), M = list(k.bufferViews, `bufferViews`), N = list(k.accessors, `accessors`), P = list(k.nodes, `nodes`), F = list(k.meshes, `meshes`), ee = list(k.skins, `skins`), te = list(k.images, `images`), ne = list(k.textures, `textures`), I = list(k.materials, `materials`), L = list(k.animations, `animations`), R = list(k.scenes, `scenes`), z = [];
			for (let t = 0; t < j.length; t++) {
				let n = j[t], r = integer(n.byteLength, `buffer byteLength`, require_models.modelLimits.decodedBytes), i = n.extensions === void 0 ? void 0 : object(n.extensions, `buffer extensions`).EXT_meshopt_compression;
				if (i !== void 0) {
					let t = object(i, `meshopt buffer`).fallback;
					if (t !== void 0 && typeof t != `boolean`) throw new require_texture.AssetError(`Meshopt fallback must be boolean.`);
					if (t === !0) {
						z.push(void 0);
						continue;
					}
				}
				let o = n.uri === void 0 ? t === 0 ? O : void 0 : await f.resource(n.uri);
				if (!o || o.byteLength < r || n.uri === void 0 && o.byteLength - r > 3) throw new require_texture.AssetError(`Buffer length does not match glTF.`);
				z.push(o);
			}
			let B = M.map((t) => {
				let n = integer(t.byteOffset ?? 0, `bufferView offset`), r = integer(t.byteLength, `bufferView length`, require_models.modelLimits.decodedBytes), i = t.byteStride === void 0 ? void 0 : integer(t.byteStride, `byteStride`, 252);
				if (i !== void 0 && (i < 4 || i % 4)) throw new require_texture.AssetError(`Invalid bufferView stride.`);
				let o = t.extensions === void 0 ? void 0 : object(t.extensions, `bufferView extensions`).EXT_meshopt_compression;
				if (o !== void 0) {
					let t = object(o, `meshopt bufferView`), n = integer(t.buffer, `meshopt buffer`), s = reference(z, n, `meshopt buffer`), c = integer(j[n].byteLength, `meshopt buffer length`), l = integer(t.byteOffset ?? 0, `meshopt byteOffset`), u = integer(t.byteLength, `meshopt byteLength`), d = integer(t.byteStride, `meshopt byteStride`, 256), p = integer(t.count, `meshopt count`, require_models.modelLimits.accessorElements);
					if (!s || !p || !d || d * p !== r || i !== void 0 && i !== d || l + u > c) throw new require_texture.AssetError(`Invalid meshopt bufferView.`);
					f.reserve(r);
					let m = new Uint8Array(r);
					return require_meshopt.decodeMeshopt(m, p, d, new Uint8Array(s, l, u), t.mode, t.filter), {
						buffer: m.buffer,
						offset: 0,
						length: r,
						stride: i
					};
				}
				let s = reference(z, t.buffer, `bufferView buffer`);
				if (!s) throw new require_texture.AssetError(`bufferView references an unloaded fallback buffer.`);
				let c = integer(reference(j, t.buffer, `buffer`).byteLength, `buffer length`);
				if (n + r > c) throw new require_texture.AssetError(`bufferView is out of bounds.`);
				return {
					buffer: s,
					offset: n,
					length: r,
					stride: i
				};
			}), V = /* @__PURE__ */ new Map(), readAccessor = (t) => {
				let n = integer(t, `accessor index`), r = V.get(n);
				if (r) return r;
				let i = reference(N, n, `accessor`), o = integer(i.componentType, `componentType`), s = Object.hasOwn(w, o) ? w[o] : void 0, c = typeof i.type == `string` ? i.type : ``, l = Object.hasOwn(T, c) ? T[c] : void 0, u = integer(i.count, `accessor count`, require_models.modelLimits.accessorElements);
				if (!s || !l || u === 0 || u * l > require_models.modelLimits.accessorElements) throw new require_texture.AssetError(`Invalid accessor type or size.`);
				if (i.normalized !== void 0 && typeof i.normalized != `boolean`) throw new require_texture.AssetError(`Accessor normalized must be boolean.`);
				let d = i.normalized === !0;
				if (d && (o === 5125 || o === 5126)) throw new require_texture.AssetError(`Invalid normalized accessor component.`);
				let p = c.startsWith(`MAT`) ? Number(c.slice(3)) : 0, m = p ? Math.ceil(p * s / 4) * 4 : 0, h = p ? m * p : s * l, componentOffset = (e) => p ? Math.floor(e / p) * m + e % p * s : e * s;
				f.reserve(u * l * 4);
				let g = new Float32Array(u * l), _ = integer(i.byteOffset ?? 0, `accessor offset`);
				if (i.bufferView !== void 0) {
					let t = reference(B, i.bufferView, `accessor bufferView`), n = t.stride ?? h;
					if (_ % s || (t.offset + _) % s || n % s || n < h || _ + (u - 1) * n + h > t.length) throw new require_texture.AssetError(`Accessor exceeds or misaligns bufferView.`);
					let r = new DataView(t.buffer, t.offset, t.length);
					for (let e = 0; e < u; e++) for (let t = 0; t < l; t++) g[e * l + t] = scalar(r, _ + e * n + componentOffset(t), o, d);
				} else if (_ !== 0) throw new require_texture.AssetError(`Accessor without bufferView cannot have a byte offset.`);
				if (i.sparse !== void 0) {
					let t = object(i.sparse, `sparse accessor`), n = integer(t.count, `sparse count`, u);
					if (!n) throw new require_texture.AssetError(`Sparse count must be positive.`);
					let r = object(t.indices, `sparse indices`), a = object(t.values, `sparse values`), c = integer(r.componentType, `sparse component`);
					if (![
						5121,
						5123,
						5125
					].includes(c)) throw new require_texture.AssetError(`Invalid sparse index component.`);
					let f = reference(B, r.bufferView, `sparse index view`), p = reference(B, a.bufferView, `sparse value view`), m = integer(r.byteOffset ?? 0, `sparse index offset`), _ = integer(a.byteOffset ?? 0, `sparse value offset`);
					if (f.stride || p.stride || (f.offset + m) % w[c] || (p.offset + _) % s || m + n * w[c] > f.length || _ + n * h > p.length) throw new require_texture.AssetError(`Sparse data exceeds or misaligns bufferView.`);
					let v = new DataView(f.buffer, f.offset, f.length), y = new DataView(p.buffer, p.offset, p.length), b = -1;
					for (let t = 0; t < n; t++) {
						let n = scalar(v, m + t * w[c], c, !1);
						if (n <= b || n >= u) throw new require_texture.AssetError(`Sparse indices must be ordered and within accessor bounds.`);
						b = n;
						for (let e = 0; e < l; e++) g[n * l + e] = scalar(y, _ + t * h + componentOffset(e), o, d);
					}
				}
				for (let t of g) if (!Number.isFinite(t)) throw new require_texture.AssetError(`Accessor values must be finite Float32 numbers.`);
				let v = {
					data: g,
					count: u,
					size: l,
					component: o,
					normalized: d,
					type: c
				};
				return V.set(n, v), v;
			};
			for (let t of F) for (let n of list(t.primitives, `primitives`)) {
				let t = n.extensions === void 0 ? void 0 : object(n.extensions, `primitive extensions`).KHR_draco_mesh_compression;
				if (t === void 0) continue;
				let r = object(t, `draco primitive`), o = object(n.attributes, `primitive attributes`), s = object(r.attributes, `draco attributes`);
				if (!i.dracoDecoder) {
					if (reference(N, o.POSITION, `POSITION accessor`).bufferView === void 0) throw new require_texture.AssetError(`Draco-compressed primitive requires GLTFLoadOptions.dracoDecoder.`);
					continue;
				}
				let c = reference(B, r.bufferView, `draco bufferView`), l = {}, u = {};
				for (let [t, n] of Object.entries(s)) {
					if (o[t] === void 0) throw new require_texture.AssetError(`Draco attribute is missing from primitive attributes.`);
					l[t] = integer(n, `draco attribute id`);
					let r = reference(N, o[t], `Draco accessor`), i = integer(r.componentType, `componentType`), a = r.normalized === !0;
					if (!Object.hasOwn(w, i) || r.normalized !== void 0 && typeof r.normalized != `boolean` || a && (i === 5125 || i === 5126)) throw new require_texture.AssetError(`Invalid Draco accessor component or normalization.`);
					u[t] = Object.freeze({
						componentType: i,
						normalized: a
					});
				}
				if (l.POSITION === void 0) throw new require_texture.AssetError(`Draco primitive requires POSITION.`);
				f.signal.throwIfAborted();
				let d = await i.dracoDecoder({
					data: new Uint8Array(c.buffer, c.offset, c.length),
					attributes: Object.freeze({ ...l }),
					accessors: Object.freeze(u)
				});
				f.signal.throwIfAborted();
				let store = (t, n, r) => {
					let i = reference(N, t, `${r} accessor`), o = integer(i.componentType, `componentType`), s = typeof i.type == `string` ? i.type : ``, c = Object.hasOwn(T, s) ? T[s] : 0, l = integer(i.count, `accessor count`, require_models.modelLimits.accessorElements);
					if (!Object.hasOwn(w, o) || !c || s.startsWith(`MAT`) || !l || l * c > require_models.modelLimits.accessorElements) throw new require_texture.AssetError(`Invalid Draco ${r} accessor.`);
					if (!n || n.length !== l * c) throw new require_texture.AssetError(`Draco decoder returned the wrong ${r} length.`);
					f.reserve(l * c * 4);
					let u = new Float32Array(l * c);
					for (let t = 0; t < u.length; t++) {
						let i = n[t];
						if (!Number.isFinite(i)) throw new require_texture.AssetError(`Draco ${r} values must be finite.`);
						u[t] = i;
					}
					V.set(integer(t, `accessor index`), {
						data: u,
						count: l,
						size: c,
						component: o,
						normalized: i.normalized === !0,
						type: s
					});
				};
				for (let e of Object.keys(l)) store(o[e], d.attributes[e], e);
				n.indices !== void 0 && store(n.indices, d.indices, `indices`);
			}
			for (let e = 0; e < N.length; e++) readAccessor(e);
			let H = /* @__PURE__ */ new Map(), readImage = async (t) => {
				let n = integer(t, `image index`), r = H.get(n);
				if (r) return r;
				let a = reference(te, n, `image`), s, c, l = a.mimeType;
				if (a.uri !== void 0) {
					let e = await f.resource(a.uri, require_assets.assetLimits.textureBytes);
					f.reserve(e.byteLength), c = new Uint8Array(e);
				} else {
					let t = reference(B, a.bufferView, `image bufferView`);
					if (l !== `image/png` && l !== `image/jpeg` && l !== `image/ktx2`) throw new require_texture.AssetError(`Embedded images require PNG, JPEG or KTX2 MIME type.`);
					if (t.length > require_assets.assetLimits.textureBytes) throw new require_texture.AssetError(`Embedded image exceeds byte budget.`);
					f.reserve(t.length), c = new Uint8Array(t.buffer, t.offset, t.length);
				}
				if (l === `image/ktx2` || require_ktx2.isKTX2(c)) {
					if (i.nativeTextures) {
						let e = await require_ktx2.decodeKTX2Native(c, i.ktx2NativeTranscoder, f.signal);
						return f.textures.push(e), f.signal.throwIfAborted(), f.reserve(e.byteLength), H.set(n, e), e;
					}
					let e = await require_ktx2.decodeKTX2(c, i.ktx2Transcoder, f.signal);
					s = new ImageData(new Uint8ClampedArray(e.data.buffer, e.data.byteOffset, e.data.length), e.width, e.height);
				} else s = new Blob([c], { type: typeof l == `string` ? l : `` });
				let u = await f.texture(s);
				return H.set(n, u), u;
			}, re = list(k.samplers, `samplers`), U = {
				33071: `clamp-to-edge`,
				10497: `repeat`,
				33648: `mirror-repeat`
			}, readTexture = async (t) => {
				if (t === void 0) return;
				let n = object(t, `texture info`), r = {}, a = n.texCoord;
				if (n.extensions !== void 0) {
					let e = object(n.extensions, `texture extensions`);
					if (e.KHR_texture_transform !== void 0) {
						let t = object(e.KHR_texture_transform, `transform`);
						t.texCoord !== void 0 && (a = t.texCoord), r = {
							offset: t.offset === void 0 ? [0, 0] : vector(t.offset, 2, `offset`),
							scale: t.scale === void 0 ? [1, 1] : vector(t.scale, 2, `scale`),
							rotation: number(t.rotation ?? 0, `rotation`)
						};
					}
				}
				r.texCoord = integer(a ?? 0, `texture texCoord`, 1);
				let o = reference(ne, n.index, `texture`), s = o.extensions === void 0 ? void 0 : object(o.extensions, `texture extensions`).KHR_texture_basisu, c = s === void 0 ? void 0 : object(s, `KHR_texture_basisu`).source, l = o.sampler === void 0 ? {} : reference(re, o.sampler, `sampler`), u = {
					9984: 9728,
					9985: 9729,
					9986: 9728,
					9987: 9729
				}[l.minFilter] ?? l.minFilter ?? 9729, d = l.magFilter ?? 9729;
				if (u !== 9728 && u !== 9729) throw new require_texture.AssetError(`Invalid glTF minification filter.`);
				if (d !== 9728 && d !== 9729) throw new require_texture.AssetError(`Invalid glTF magnification filter.`);
				let f = integer(l.wrapS ?? 10497, `sampler wrapS`), p = integer(l.wrapT ?? 10497, `sampler wrapT`), m = U[f], h = U[p];
				if (!m || !h) throw new require_texture.AssetError(`Invalid glTF sampler wrapping mode.`);
				return {
					texture: await readImage(c !== void 0 && (i.ktx2Transcoder || i.nativeTextures) ? c : o.source ?? c),
					sampler: {
						minFilter: u === 9728 ? `nearest` : `linear`,
						magFilter: d === 9728 ? `nearest` : `linear`,
						...i.nativeTextures ? {
							mipmapFilter: l.minFilter === 9984 || l.minFilter === 9985 ? `nearest` : `linear`,
							lodMaxClamp: l.minFilter === 9728 || l.minFilter === 9729 ? 0 : 32
						} : {},
						addressModeU: m,
						addressModeV: h
					},
					coordinates: r
				};
			}, ie, getWhite = async () => ie ??= await f.texture(new ImageData(new Uint8ClampedArray([
				255,
				255,
				255,
				255
			]), 1, 1)), W = [];
			for (let t of I) {
				let n = t.pbrMetallicRoughness === void 0 ? {} : object(t.pbrMetallicRoughness, `PBR material`), r = n.baseColorFactor === void 0 ? [
					1,
					1,
					1,
					1
				] : vector(n.baseColorFactor, 4, `baseColorFactor`), i = t.normalTexture === void 0 ? void 0 : object(t.normalTexture, `normal texture`), a = t.occlusionTexture === void 0 ? void 0 : object(t.occlusionTexture, `occlusion texture`), o = t.alphaMode ?? `OPAQUE`;
				if (o !== `OPAQUE` && o !== `MASK` && o !== `BLEND`) throw new require_texture.AssetError(`Invalid material alpha mode.`);
				if (t.doubleSided !== void 0 && typeof t.doubleSided != `boolean`) throw new require_texture.AssetError(`doubleSided must be boolean.`);
				let s = t.extensions === void 0 ? {} : object(t.extensions, `material extensions`), c = s.KHR_materials_unlit !== void 0, l = s.KHR_materials_ior === void 0 ? void 0 : object(s.KHR_materials_ior, `IOR`), u = s.KHR_materials_specular === void 0 ? void 0 : object(s.KHR_materials_specular, `specular`), d = s.KHR_materials_clearcoat === void 0 ? void 0 : object(s.KHR_materials_clearcoat, `clearcoat`), f = s.KHR_materials_sheen === void 0 ? void 0 : object(s.KHR_materials_sheen, `sheen`), p = s.KHR_materials_transmission === void 0 ? void 0 : object(s.KHR_materials_transmission, `transmission`), m = s.KHR_materials_volume === void 0 ? void 0 : object(s.KHR_materials_volume, `volume`);
				if (m && !p) throw new require_texture.AssetError(`Volume materials require a transmission extension.`);
				let h = d?.clearcoatNormalTexture === void 0 ? void 0 : object(d.clearcoatNormalTexture, `clearcoat normal texture`);
				if (c && (l || u || d || f || p || m)) throw new require_texture.AssetError(`PBR material extensions cannot be combined with unlit.`);
				let _ = await readTexture(u?.specularTexture), v = await readTexture(u?.specularColorTexture), y = await readTexture(d?.clearcoatTexture), b = await readTexture(d?.clearcoatRoughnessTexture), x = await readTexture(h), S = await readTexture(f?.sheenColorTexture), C = await readTexture(f?.sheenRoughnessTexture), w = await readTexture(p?.transmissionTexture), T = await readTexture(m?.thicknessTexture), E = 1;
				if (s.KHR_materials_emissive_strength !== void 0 && (E = number(object(s.KHR_materials_emissive_strength, `emissive strength`).emissiveStrength ?? 1, `emissive strength`), E < 0)) throw new require_texture.AssetError(`Emissive strength cannot be negative.`);
				let D = await readTexture(n.baseColorTexture), O = await readTexture(n.metallicRoughnessTexture), k = await readTexture(i), A = await readTexture(a), j = await readTexture(t.emissiveTexture), M = {
					...D ? { texture: D.coordinates } : {},
					...O ? { metallicRoughness: O.coordinates } : {},
					...k ? { normal: k.coordinates } : {},
					...A ? { occlusion: A.coordinates } : {},
					...j ? { emissive: j.coordinates } : {},
					..._ ? { specular: _.coordinates } : {},
					...v ? { specularColor: v.coordinates } : {},
					...y ? { clearcoat: y.coordinates } : {},
					...b ? { clearcoatRoughness: b.coordinates } : {},
					...x ? { clearcoatNormal: x.coordinates } : {},
					...S ? { sheenColor: S.coordinates } : {},
					...C ? { sheenRoughness: C.coordinates } : {},
					...w ? { transmission: w.coordinates } : {},
					...T ? { thickness: T.coordinates } : {}
				}, N = (t.emissiveFactor === void 0 ? [
					0,
					0,
					0
				] : vector(t.emissiveFactor, 3, `emissive`)).map((e) => e * E);
				if (c) {
					W.push(new require_pbr_material.PBRMaterial({
						texture: D?.texture ?? await getWhite(),
						textureSampler: D?.sampler,
						textureCoordinates: D ? {
							texture: D.coordinates,
							emissive: D.coordinates
						} : {},
						color: [
							0,
							0,
							0
						],
						opacity: r[3],
						alphaMode: o,
						metallic: 0,
						roughness: 1,
						emissive: r.slice(0, 3),
						emissiveTexture: D?.texture,
						emissiveSampler: D?.sampler,
						alphaCutoff: o === `MASK` ? number(t.alphaCutoff ?? .5, `alpha cutoff`) : 0,
						doubleSided: t.doubleSided === !0
					}));
					continue;
				}
				W.push(new require_pbr_material.PBRMaterial({
					texture: D?.texture ?? await getWhite(),
					textureSampler: D?.sampler,
					textureCoordinates: M,
					color: r.slice(0, 3),
					opacity: r[3],
					alphaMode: o,
					metallic: number(n.metallicFactor ?? 1, `metallic`),
					roughness: number(n.roughnessFactor ?? 1, `roughness`),
					emissive: N,
					ior: number(l?.ior ?? 1.5, `IOR`),
					specular: number(u?.specularFactor ?? 1, `specular factor`),
					specularColor: u?.specularColorFactor === void 0 ? [
						1,
						1,
						1
					] : vector(u.specularColorFactor, 3, `specular color`),
					specularTexture: _?.texture,
					specularSampler: _?.sampler,
					specularColorTexture: v?.texture,
					specularColorSampler: v?.sampler,
					clearcoat: number(d?.clearcoatFactor ?? 0, `clearcoat factor`),
					clearcoatRoughness: number(d?.clearcoatRoughnessFactor ?? 0, `clearcoat roughness`),
					clearcoatNormalScale: number(h?.scale ?? 1, `clearcoat normal scale`),
					clearcoatTexture: y?.texture,
					clearcoatRoughnessTexture: b?.texture,
					clearcoatNormalTexture: x?.texture,
					clearcoatSampler: y?.sampler,
					clearcoatRoughnessSampler: b?.sampler,
					clearcoatNormalSampler: x?.sampler,
					sheenColor: f?.sheenColorFactor === void 0 ? [
						0,
						0,
						0
					] : vector(f.sheenColorFactor, 3, `sheen color`),
					sheenRoughness: number(f?.sheenRoughnessFactor ?? 0, `sheen roughness`),
					sheenColorTexture: S?.texture,
					sheenRoughnessTexture: C?.texture,
					sheenColorSampler: S?.sampler,
					sheenRoughnessSampler: C?.sampler,
					transmission: number(p?.transmissionFactor ?? 0, `transmission factor`),
					transmissionTexture: w?.texture,
					transmissionSampler: w?.sampler,
					thickness: number(m?.thicknessFactor ?? 0, `volume thickness`),
					thicknessTexture: T?.texture,
					thicknessSampler: T?.sampler,
					attenuationDistance: m?.attenuationDistance === void 0 ? 1 / 0 : number(m.attenuationDistance, `attenuation distance`),
					attenuationColor: m?.attenuationColor === void 0 ? [
						1,
						1,
						1
					] : vector(m.attenuationColor, 3, `attenuation color`),
					metallicRoughnessTexture: O?.texture,
					metallicRoughnessSampler: O?.sampler,
					normalTexture: k?.texture,
					normalSampler: k?.sampler,
					normalScale: number(i?.scale ?? 1, `normal scale`),
					occlusionTexture: A?.texture,
					occlusionSampler: A?.sampler,
					occlusionStrength: number(a?.strength ?? 1, `occlusion strength`),
					emissiveTexture: j?.texture,
					emissiveSampler: j?.sampler,
					alphaCutoff: o === `MASK` ? number(t.alphaCutoff ?? .5, `alpha cutoff`) : 0,
					doubleSided: t.doubleSided === !0
				}));
			}
			let ae, defaultMaterial = async () => ae ??= new require_pbr_material.PBRMaterial({
				texture: await getWhite(),
				metallic: 1,
				roughness: 1,
				doubleSided: !1,
				alphaMode: `OPAQUE`
			});
			for (let e = 0; e < P.length; e++) D.push(new require_group.Group());
			let G = new Int32Array(D.length).fill(-1);
			for (let t = 0; t < D.length; t++) {
				let n = P[t], r = D[t];
				if (n.matrix !== void 0) {
					if (n.translation !== void 0 || n.rotation !== void 0 || n.scale !== void 0) throw new require_texture.AssetError(`Node cannot specify both matrix and TRS.`);
					this.applyMatrix(r, vector(n.matrix, 16, `node matrix`));
				} else {
					if (n.translation !== void 0) {
						let e = vector(n.translation, 3, `translation`);
						r.position.set(e[0], e[1], e[2]);
					}
					if (n.scale !== void 0) {
						let e = vector(n.scale, 3, `scale`);
						r.scale.set(e[0], e[1], e[2]);
					}
					if (n.rotation !== void 0) {
						let t = vector(n.rotation, 4, `rotation`);
						if (Math.abs(Math.hypot(...t) - 1) > .001) throw new require_texture.AssetError(`Node quaternion must be unit length.`);
						r.rotation.set(t[0], t[1], t[2], t[3]).normalize();
					}
				}
				if (n.children !== void 0) {
					if (!Array.isArray(n.children) || n.children.length > require_models.modelLimits.entries) throw new require_texture.AssetError(`Invalid node children.`);
					for (let r of n.children) {
						let n = integer(r, `child index`);
						if (reference(D, n, `child`), G[n] !== -1 || n === t) throw new require_texture.AssetError(`Node has multiple parents or a cycle.`);
						G[n] = t;
					}
				}
			}
			for (let t = 0; t < D.length; t++) {
				let n = t, r = 0;
				for (; G[n] !== -1;) if (n = G[n], ++r > require_models.modelLimits.hierarchyDepth || n === t) throw new require_texture.AssetError(`Node hierarchy has a cycle or exceeds depth budget.`);
			}
			for (let e = 0; e < D.length; e++) G[e] !== -1 && D[G[e]].add(D[e]);
			let oe = ee.map((t) => {
				if (!Array.isArray(t.joints) || !t.joints.length || t.joints.length > require_models.modelLimits.joints) throw new require_texture.AssetError(`Skin exceeds joint budget.`);
				let n = /* @__PURE__ */ new Set(), i = t.joints.map((t) => {
					let r = integer(t, `joint`);
					if (n.has(r)) throw new require_texture.AssetError(`Duplicate skin joint.`);
					return n.add(r), reference(D, r, `joint`);
				});
				t.skeleton !== void 0 && reference(D, t.skeleton, `skeleton`);
				let o;
				if (t.inverseBindMatrices !== void 0) {
					let n = readAccessor(t.inverseBindMatrices);
					if (n.type !== `MAT4` || n.component !== 5126 || n.count < i.length) throw new require_texture.AssetError(`Invalid inverse bind matrices.`);
					o = i.map((e, t) => {
						let i = new require_math3d.Matrix4();
						return i.elements.set(n.data.subarray(t * 16, t * 16 + 16)), i;
					});
				}
				return {
					joints: i,
					inverseBindMatrices: o
				};
			}), readMorph = (t, n, r, i) => {
				let a = list(t.targets, `morph targets`), o = i?.length ?? n;
				f.reserve(a.length * o * 9 * 4 * (i ? 2 : 1) + o * 12 * 4);
				let read = (t, r) => {
					let a = readAccessor(t);
					if (a.type !== `VEC3` || a.count !== n || !(a.component === 5126 || a.normalized)) throw new require_texture.AssetError(`Morph ${r} requires matching VEC3 data.`);
					return i ? require_geometry_tangents.remapVertexData(a.data, i, 3) : a.data;
				}, s = [], c = [], l = [];
				for (let t of a) {
					for (let n of Object.keys(t)) if (n !== `POSITION` && n !== `NORMAL` && n !== `TANGENT`) throw new require_texture.AssetError(`Morph target attributes other than POSITION, NORMAL and TANGENT are unsupported.`);
					s.push(t.POSITION === void 0 ? void 0 : read(t.POSITION, `POSITION`)), c.push(t.NORMAL === void 0 ? void 0 : read(t.NORMAL, `NORMAL`)), l.push(t.TANGENT === void 0 ? void 0 : read(t.TANGENT, `TANGENT`));
				}
				return new require_morph.MorphTargets({
					positions: s,
					normals: c,
					tangents: l,
					weights: r
				});
			}, K = /* @__PURE__ */ new Map(), q = 0, J = 0;
			for (let t = 0; t < D.length; t++) {
				let n = P[t];
				if (n.mesh === void 0) {
					if (n.skin !== void 0) throw new require_texture.AssetError(`Skinned node requires mesh.`);
					continue;
				}
				let r = reference(F, n.mesh, `mesh`), i = list(r.primitives, `primitives`);
				if (!i.length) throw new require_texture.AssetError(`Mesh requires primitives.`);
				let o = n.skin === void 0 ? void 0 : reference(oe, n.skin, `skin`), s = new Set(i.map((e) => list(e.targets, `morph targets`).length));
				if (s.size !== 1) throw new require_texture.AssetError(`All primitives of a mesh must have the same number of morph targets.`);
				let c = [...s][0];
				if (c > require_models.modelLimits.morphTargets) throw new require_texture.AssetError(`Mesh exceeds the morph target budget.`);
				let p = n.weights ?? r.weights;
				if (!c && p !== void 0) throw new require_texture.AssetError(`Morph weights require morph targets.`);
				let m;
				if (c) {
					if (p !== void 0 && (!Array.isArray(p) || p.length !== c)) throw new require_texture.AssetError(`Morph weights must match the target count.`);
					m = new require_morph.MorphWeights(p === void 0 ? Array(c).fill(0) : p.map((e) => number(e, `morph weight`))), K.set(t, m);
				}
				for (let n of i) {
					if (n.mode !== void 0 && n.mode !== 4) throw new require_texture.AssetError(`Only triangle primitives are supported.`);
					let r = object(n.attributes, `primitive attributes`), i = readAccessor(r.POSITION);
					if (i.type !== `VEC3` || i.component !== 5126) throw new require_texture.AssetError(`POSITION requires float VEC3.`);
					if (q += i.count, q > require_models.modelLimits.vertices) throw new require_texture.AssetError(`Model exceeds vertex budget.`);
					let s = n.indices === void 0 ? void 0 : readAccessor(n.indices);
					if (s && (s.type !== `SCALAR` || s.normalized || ![
						5121,
						5123,
						5125
					].includes(s.component))) throw new require_texture.AssetError(`Invalid triangle indices.`);
					let c = s?.count ?? i.count;
					if (J += c, J > require_models.modelLimits.indices || !c || c % 3) throw new require_texture.AssetError(`Invalid or excessive triangle indices.`);
					s || f.reserve(c * 4);
					let p = s?.data ?? Float32Array.from({ length: c }, (e, t) => t);
					for (let t of p) if (t >= i.count) throw new require_texture.AssetError(`Triangle index is outside positions.`);
					let g = r.NORMAL === void 0 ? void 0 : readAccessor(r.NORMAL);
					if (g && (g.type !== `VEC3` || g.component !== 5126 || g.count !== i.count)) throw new require_texture.AssetError(`Invalid vertex normals.`);
					for (let t of Object.keys(r)) {
						if (/^TEXCOORD_/.test(t) && t !== `TEXCOORD_0` && t !== `TEXCOORD_1`) throw new require_texture.AssetError(`Only TEXCOORD_0 and TEXCOORD_1 are supported.`);
						if (/^(JOINTS|WEIGHTS)_/.test(t) && !/^(JOINTS|WEIGHTS)_[01]$/.test(t)) throw new require_texture.AssetError(`More than eight skin influences are unsupported.`);
					}
					let readUV = (t) => {
						if (r[t] === void 0) return;
						let n = readAccessor(r[t]);
						if (n.type !== `VEC2` || n.count !== i.count || !(n.component === 5126 || [5121, 5123].includes(n.component) && n.normalized)) throw new require_texture.AssetError(`Invalid ${t} accessor.`);
						return n;
					}, _ = readUV(`TEXCOORD_0`), v = readUV(`TEXCOORD_1`);
					if (r.JOINTS_1 === void 0 != (r.WEIGHTS_1 === void 0)) throw new require_texture.AssetError(`JOINTS_1 and WEIGHTS_1 must be paired.`);
					if (r.JOINTS_0 === void 0 != (r.WEIGHTS_0 === void 0) || r.JOINTS_1 !== void 0 && r.JOINTS_0 === void 0) throw new require_texture.AssetError(`Skin influence sets require paired JOINTS_0 and WEIGHTS_0.`);
					if (r.COLOR_1 !== void 0) throw new require_texture.AssetError(`Only COLOR_0 vertex colors are supported.`);
					let b = r.COLOR_0 === void 0 ? void 0 : readAccessor(r.COLOR_0);
					if (b && (b.type !== `VEC3` && b.type !== `VEC4` || b.count !== i.count || !(b.component === 5126 || [5121, 5123].includes(b.component) && b.normalized))) throw new require_texture.AssetError(`COLOR_0 requires float or normalized VEC3/VEC4 data.`);
					let x = r.TANGENT === void 0 ? void 0 : readAccessor(r.TANGENT);
					if (f.reserve(i.count * 8 * 4 + p.length * 4 + i.count * 4 * 4 + (x ? 0 : i.count * 6 * 8) + (g ? 0 : i.count * 3 * 4) + (_ ? 0 : i.count * 2 * 4) + (b ? i.count * 4 * 4 : 0) + (v ? i.count * 2 * 4 : 0)), x && (x.type !== `VEC4` || x.count !== i.count || !(x.component === 5126 || [5120, 5122].includes(x.component) && x.normalized))) throw new require_texture.AssetError(`TANGENT requires float or normalized VEC4 data.`);
					let S = n.material === void 0 ? void 0 : integer(n.material, `material`), C = S === void 0 ? await defaultMaterial() : reference(W, S, `material`);
					for (let t of Object.values(C.textureCoordinates)) if ((t.texCoord === 0 ? _ : v) === void 0) throw new require_texture.AssetError(`Material requires missing TEXCOORD_${t.texCoord}.`);
					let w = _?.data ?? new Float32Array(i.count * 2), T = C.normalTexture ? `normal` : `clearcoatNormal`, E = C.textureCoordinates[T]?.texCoord ?? 0, O = new require_geometry.Geometry({
						positions: i.data,
						normals: g?.data ?? this.normals(i.data, p),
						uvs: w,
						uvs1: v?.data,
						tangents: x?.data,
						tangentTexCoord: E,
						tangentConvention: `gltf`,
						indices: p,
						colors: b?.data
					}), k;
					if (!x && (C.normalTexture || C.clearcoatNormalTexture)) {
						let t = Math.min(i.count + p.length, require_models.modelLimits.vertices);
						f.reserve(p.length * 52 + i.count * 4 + t * (100 + (v ? 16 : 0) + (b ? 32 : 0)));
						let n = require_geometry_tangents.generateMikkTangents(O, {
							convention: `gltf`,
							texCoord: E
						});
						if (O = n.geometry, k = n.sourceVertices, q += k.length - i.count, q > require_models.modelLimits.vertices) throw new require_texture.AssetError(`Tangent seam splitting exceeds model vertex budget.`);
					}
					let A = m ? readMorph(n, i.count, m, k) : void 0;
					if (o) {
						let n = r.JOINTS_1 === void 0 ? 4 : 8, a = n / 4, s = [], c = [];
						for (let t = 0; t < a; t++) {
							let n = readAccessor(r[`JOINTS_${t}`]), a = readAccessor(r[`WEIGHTS_${t}`]);
							if (n.type !== `VEC4` || n.normalized || ![5121, 5123].includes(n.component) || n.count !== i.count || a.type !== `VEC4` || a.count !== i.count || !(a.component === 5126 || [5121, 5123].includes(a.component) && a.normalized)) throw new require_texture.AssetError(`Invalid skin attributes.`);
							s.push(n), c.push(a);
						}
						let l = O.vertices.length / 8;
						f.reserve(l * 160 + p.length * 4 * 2 + l * n * 8 * (a === 2 ? 2 : 1) + o.joints.length * 16 * 16 + (v ? l * 2 * 4 * 2 : 0) + (b ? l * 4 * 4 * 2 : 0));
						let u = k && a === 1 ? require_geometry_tangents.remapVertexData(s[0].data, k, 4) : s[0].data, m = k && a === 1 ? require_geometry_tangents.remapVertexData(c[0].data, k, 4) : c[0].data;
						if (a === 2) {
							u = new Float32Array(l * 8), m = new Float32Array(l * 8);
							for (let e = 0; e < l; e++) for (let t = 0; t < 2; t++) for (let n = 0; n < 4; n++) {
								let r = (k?.[e] ?? e) * 4 + n, i = e * 8 + t * 4 + n;
								u[i] = s[t].data[r], m[i] = c[t].data[r];
							}
						}
						D[t].add(new require_skinned_mesh.SkinnedMesh({
							geometry: O,
							material: C,
							morph: A,
							...o,
							jointIndices: u,
							weights: m,
							influencesPerVertex: n
						}));
					} else D[t].add(new require_mesh.Mesh({
						geometry: O,
						material: C,
						morph: A
					}));
				}
			}
			let se = L.map((t, n) => {
				let r = list(t.samplers, `animation samplers`), i = list(t.channels, `animation channels`);
				if (!i.length) throw new require_texture.AssetError(`Animation requires channels.`);
				let a = /* @__PURE__ */ new Set(), o = i.map((t) => {
					let n = object(t.target, `animation target`), i = reference(r, t.sampler, `animation sampler`), o = integer(n.node, `animation node`), s = n.path;
					if (s !== `translation` && s !== `rotation` && s !== `scale` && s !== `weights`) throw new require_texture.AssetError(`Only transform and morph weights animations are supported.`);
					if (s !== `weights` && reference(P, o, `animation node`).matrix !== void 0) throw new require_texture.AssetError(`Matrix nodes cannot be animated.`);
					let l = `${o}:${s}`;
					if (a.has(l)) throw new require_texture.AssetError(`Duplicate animation target property.`);
					a.add(l);
					let u = readAccessor(i.input), d = readAccessor(i.output), p = i.interpolation ?? `LINEAR`;
					if (p !== `LINEAR` && p !== `STEP` && p !== `CUBICSPLINE`) throw new require_texture.AssetError(`Unsupported animation interpolation.`);
					if (u.type !== `SCALAR` || u.component !== 5126 || d.component !== 5126 || d.type !== (s === `weights` ? `SCALAR` : s === `rotation` ? `VEC4` : `VEC3`) || d.count !== u.count * (p === `CUBICSPLINE` ? 3 : 1) * (s === `weights` ? K.get(o)?.count ?? 0 : 1)) throw new require_texture.AssetError(`Animation sampler counts or types do not match.`);
					f.reserve(u.data.byteLength + d.data.byteLength);
					let m = K.get(o);
					if (s === `weights` && !m) throw new require_texture.AssetError(`Weights animation requires morph targets.`);
					return new require_animation.KeyframeTrack(s === `weights` ? m : reference(D, o, `animation node`), s, u.data, d.data, p);
				});
				return new require_animation.AnimationClip(typeof t.name == `string` ? t.name : `animation-${n}`, o);
			});
			p = new require_group.Group();
			let Y = R.length ? reference(R, k.scene ?? 0, `scene`) : void 0, X = Y?.nodes ?? (Y ? [] : D.map((e, t) => t).filter((e) => G[e] === -1));
			if (!Array.isArray(X) || X.length > require_models.modelLimits.entries) throw new require_texture.AssetError(`Invalid scene roots.`);
			let Z = /* @__PURE__ */ new Set();
			for (let t of X) {
				let n = integer(t, `scene root`);
				if (G[n] !== -1 || Z.has(n)) throw new require_texture.AssetError(`Scene roots must be unique parentless nodes.`);
				Z.add(n), p.add(reference(D, n, `scene root`));
			}
			f.signal.throwIfAborted();
			let Q = p, ce = this.readLights(k, P, D), $ = !1;
			return {
				scene: Q,
				animations: se,
				lights: ce,
				dispose: () => {
					if ($) return;
					$ = !0;
					let e = [];
					for (let t of [Q, ...D]) try {
						t.destroy();
					} catch (t) {
						e.push(t);
					}
					for (let t of f.textures) try {
						t.destroy();
					} catch (t) {
						e.push(t);
					}
					if (e.length) throw AggregateError(e, `glTF asset cleanup failed.`);
				}
			};
		} catch (t) {
			for (let e of [p, ...D]) try {
				e?.destroy();
			} catch {}
			for (let e of f.textures) e.destroy();
			throw f.signal.aborted ? f.signal.reason ?? new DOMException(`Aborted`, `AbortError`) : t instanceof require_texture.AssetError ? t : new require_texture.AssetError(`Unable to parse glTF model.`, { cause: t });
		}
	}
	readLights(t, n, r) {
		let o = {
			point: [],
			spot: [],
			directional: []
		}, s = t.extensions === void 0 ? void 0 : object(t.extensions, `extensions`).KHR_lights_punctual;
		if (s === void 0) return o;
		let c = list(object(s, `KHR_lights_punctual`).lights, `lights`);
		for (let t = 0; t < r.length; t++) {
			let s = n[t].extensions;
			if (s === void 0) continue;
			let l = object(s, `node extensions`).KHR_lights_punctual;
			if (l === void 0) continue;
			let u = reference(c, object(l, `node light`).light, `light`);
			if (o.point.length + o.spot.length + o.directional.length >= require_models.modelLimits.entries) throw new require_texture.AssetError(`Model exceeds the light budget.`);
			let d = u.color === void 0 ? [
				1,
				1,
				1
			] : vector(u.color, 3, `light color`), m = number(u.intensity ?? 1, `light intensity`), h = r[t].updateWorldMatrix().elements, g = new require_math3d.Vector3(-h[8], -h[9], -h[10]).normalize();
			if (u.type === `directional`) {
				o.directional.push({
					direction: g,
					color: d,
					intensity: m
				});
				continue;
			}
			let _ = new require_math3d.Vector3(h[12], h[13], h[14]), v = number(u.range ?? 0, `light range`);
			if (u.type === `point`) o.point.push(new require_lights.PointLight({
				position: _,
				color: d,
				intensity: m,
				range: v
			}));
			else if (u.type === `spot`) {
				let e = u.spot === void 0 ? {} : object(u.spot, `spot`);
				o.spot.push(new require_lights.SpotLight({
					position: _,
					direction: g,
					color: d,
					intensity: m,
					range: v,
					innerAngle: number(e.innerConeAngle ?? 0, `inner cone angle`),
					outerAngle: number(e.outerConeAngle ?? Math.PI / 4, `outer cone angle`)
				}));
			} else throw new require_texture.AssetError(`Unsupported punctual light type.`);
		}
		return o;
	}
	normals(e, t) {
		let n = new Float32Array(e.length);
		for (let r = 0; r < t.length; r += 3) {
			let i = t[r] * 3, a = t[r + 1] * 3, o = t[r + 2] * 3, s = e[a] - e[i], c = e[a + 1] - e[i + 1], l = e[a + 2] - e[i + 2], u = e[o] - e[i], d = e[o + 1] - e[i + 1], f = e[o + 2] - e[i + 2], p = c * f - l * d, m = l * u - s * f, h = s * d - c * u;
			for (let e of [
				i,
				a,
				o
			]) n[e] += p, n[e + 1] += m, n[e + 2] += h;
		}
		for (let e = 0; e < n.length; e += 3) {
			let t = Math.hypot(n[e], n[e + 1], n[e + 2]) || 1;
			n[e] /= t, n[e + 1] /= t, n[e + 2] /= t;
		}
		return n;
	}
	applyMatrix(t, n) {
		if (n[3] !== 0 || n[7] !== 0 || n[11] !== 0 || n[15] !== 1) throw new require_texture.AssetError(`Node matrix must be affine TRS.`);
		let r = Math.hypot(n[0], n[1], n[2]), a = Math.hypot(n[4], n[5], n[6]), o = Math.hypot(n[8], n[9], n[10]);
		n[0] * (n[5] * n[10] - n[6] * n[9]) - n[4] * (n[1] * n[10] - n[2] * n[9]) + n[8] * (n[1] * n[6] - n[2] * n[5]) < 0 && (r = -r);
		let s = [
			new require_math3d.Vector3(n[0], n[1], n[2]),
			new require_math3d.Vector3(n[4], n[5], n[6]),
			new require_math3d.Vector3(n[8], n[9], n[10])
		], c = [
			r,
			a,
			o
		], l = [];
		for (let e = 0; e < 3; e++) c[e] ? s[e].scale(1 / c[e]) : l.push(e);
		for (let t = 0; t < 3; t++) for (let n = t + 1; n < 3; n++) if (c[t] && c[n] && Math.abs(s[t].dot(s[n])) > 1e-4) throw new require_texture.AssetError(`Node matrix contains shear.`);
		if (l.length === 1) {
			let e = l[0];
			s[e].copy(s[(e + 1) % 3]).cross(s[(e + 2) % 3]).normalize();
		} else if (l.length === 2) {
			let e = c.findIndex((e) => e !== 0), t = s[e], n = Math.abs(t.x) < .9 ? new require_math3d.Vector3(1, 0, 0) : new require_math3d.Vector3(0, 1, 0), r = s[(e + 1) % 3];
			r.copy(n).subtract(t.clone().scale(n.dot(t))).normalize(), s[(e + 2) % 3].copy(t).cross(r).normalize();
		} else l.length === 3 && (s[0].set(1, 0, 0), s[1].set(0, 1, 0), s[2].set(0, 0, 1));
		let u = s[0].x, d = s[0].y, f = s[0].z, p = s[1].x, m = s[1].y, h = s[1].z, g = s[2].x, _ = s[2].y, v = s[2].z, y = u + m + v, b, x, S, C;
		if (y > 0) {
			let e = Math.sqrt(y + 1) * 2;
			C = e / 4, b = (h - _) / e, x = (g - f) / e, S = (d - p) / e;
		} else if (u > m && u > v) {
			let e = Math.sqrt(1 + u - m - v) * 2;
			C = (h - _) / e, b = e / 4, x = (p + d) / e, S = (g + f) / e;
		} else if (m > v) {
			let e = Math.sqrt(1 + m - u - v) * 2;
			C = (g - f) / e, b = (p + d) / e, x = e / 4, S = (_ + h) / e;
		} else {
			let e = Math.sqrt(1 + v - u - m) * 2;
			C = (d - p) / e, b = (g + f) / e, x = (_ + h) / e, S = e / 4;
		}
		t.position.set(n[12], n[13], n[14]), t.scale.set(r, a, o), t.rotation.set(b, x, S, C).normalize();
	}
};
//#endregion
exports.GLTFLoader = GLTFLoader;

//# sourceMappingURL=gltf-loader.cjs.map