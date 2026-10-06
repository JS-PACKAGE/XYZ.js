const require_texture = require("../../assets/src/texture.cjs");
const require_morph = require("./morph.cjs");
const require_object3d = require("./object3d.cjs");
const require_mesh = require("./mesh.cjs");
const require_optical_material_maps = require("./optical-material-maps.cjs");
const require_pbr_material = require("./pbr-material.cjs");
const require_perspective_camera = require("./perspective-camera.cjs");
const require_animation = require("./animation.cjs");
const require_group = require("./group.cjs");
const require_orthographic_camera = require("./orthographic-camera.cjs");
const require_scene = require("./scene.cjs");
const require_skinned_mesh = require("./skinned-mesh.cjs");
//#region dist/packages/core/src/gltf-exporter.js
function morphExportSnapshot(e) {
	let t = e;
	if (!t.base || !t.baseTangents) throw Error(`Cannot export unbound MorphTargets.`);
	return {
		vertices: t.base,
		tangents: t.baseTangents,
		targets: t.positions.map((e, n) => ({
			positions: e,
			normals: t.normals[n],
			tangents: t.tangents[n]
		}))
	};
}
function reject(t) {
	throw new require_texture.AssetError(`glTF export: ${t}`);
}
function finite(e, t) {
	for (let n = 0; n < e.length; n++) (!Number.isFinite(e[n]) || !Number.isFinite(Math.fround(e[n]))) && reject(`${t} contains a non-finite Float32 value.`);
}
function pose(e, t = [
	1,
	1,
	1
]) {
	let n = [
		e.position.x,
		e.position.y,
		e.position.z
	], r = [
		e.rotation.x,
		e.rotation.y,
		e.rotation.z,
		e.rotation.w
	];
	return finite(n, `translation`), finite(r, `rotation`), finite(t, `scale`), Math.abs(Math.hypot(...r) - 1) > 1e-5 && reject(`rotation must be a unit quaternion.`), {
		translation: n,
		rotation: r,
		scale: t
	};
}
async function png(t) {
	if (t.kind !== `image` && reject(`native/compressed textures require an external image URL.`), typeof OffscreenCanvas < `u`) {
		let e = new OffscreenCanvas(t.width, t.height), n = e.getContext(`2d`);
		return n || reject(`PNG encoding requires a 2D canvas context.`), n.drawImage(t.image, 0, 0), (await e.convertToBlob({ type: `image/png` })).arrayBuffer();
	}
	typeof document > `u` && reject(`embedded PNG encoding requires a browser canvas.`);
	let n = document.createElement(`canvas`);
	n.width = t.width, n.height = t.height;
	let r = n.getContext(`2d`);
	return r || reject(`PNG encoding requires a 2D canvas context.`), r.drawImage(t.image, 0, 0), (await new Promise((t, r) => n.toBlob((n) => n ? t(n) : r(new require_texture.AssetError(`PNG encoding failed.`)), `image/png`))).arrayBuffer();
}
async function exportGLTF(e, _ = {}) {
	_.textures !== void 0 && _.textures !== `embedded` && _.textures !== `external` && reject(`unknown texture mode.`);
	let v = _.bufferURI ?? `scene.bin`;
	(typeof v != `string` || !v.length) && reject(`bufferURI must be nonempty.`);
	let y = {
		asset: {
			version: `2.0`,
			generator: `XYZ.js`
		},
		scene: 0,
		scenes: [{ nodes: [] }],
		nodes: [],
		meshes: [],
		materials: [],
		textures: [],
		images: [],
		samplers: [],
		skins: [],
		cameras: [],
		animations: [],
		accessors: [],
		bufferViews: [],
		buffers: []
	}, b = [], x = 0, S = /* @__PURE__ */ new Set();
	function extension(e) {
		S.add(e);
	}
	function view(e) {
		x = Math.ceil(x / 4) * 4;
		let t = y.bufferViews.length;
		return y.bufferViews.push({
			buffer: 0,
			byteOffset: x,
			byteLength: e.byteLength
		}), b.push({
			offset: x,
			bytes: e
		}), x += e.byteLength, t;
	}
	function accessor(e, t, n, r = 5126, i = !1) {
		finite(e, `accessor`), (!e.length || e.length % t) && reject(`invalid accessor length.`);
		let a;
		if (r === 5125 || r === 5123) {
			let t = r === 5123 ? 65535 : 4294967295;
			for (let n = 0; n < e.length; n++) (!Number.isInteger(e[n]) || e[n] < 0 || e[n] > t) && reject(`integer accessor outside its range.`);
			a = r === 5123 ? Uint16Array.from(e) : Uint32Array.from(e);
		} else a = Float32Array.from(e);
		let o = {
			bufferView: view(new Uint8Array(a.buffer)),
			componentType: r,
			count: e.length / t,
			type: n
		};
		if (i) {
			let e = Array(t).fill(1 / 0), n = Array(t).fill(-1 / 0);
			for (let r = 0; r < a.length; r++) {
				let i = r % t;
				e[i] = Math.min(e[i], a[r]), n[i] = Math.max(n[i], a[r]);
			}
			o.min = e, o.max = n;
		}
		return y.accessors.push(o), y.accessors.length - 1;
	}
	let C = /* @__PURE__ */ new Map();
	async function textureInfo(e, t, n, r, i) {
		e.destroyed && reject(`destroyed texture.`);
		let a = C.get(e);
		if (a === void 0) {
			if (a = y.images.length, _.textures === `external`) {
				let t = _.textureURI?.(e);
				(typeof t != `string` || !t.length) && reject(`external textures require a nonempty textureURI.`), y.images.push({ uri: t });
			} else y.images.push({
				bufferView: view(new Uint8Array(await png(e))),
				mimeType: `image/png`
			});
			C.set(e, a);
		}
		((t?.maxAnisotropy ?? 1) !== 1 || (t?.lodMinClamp ?? 0) !== 0 || ![0, 32].includes(t?.lodMaxClamp ?? 32)) && reject(`anisotropy or custom LOD clamps have no glTF sampler representation.`);
		let wrap = (e) => e === `repeat` ? 10497 : e === `mirror-repeat` ? 33648 : 33071, o = t?.minFilter === `nearest`, s = t?.lodMaxClamp === 0 ? o ? 9728 : 9729 : t?.mipmapFilter === `nearest` ? o ? 9984 : 9985 : o ? 9986 : 9987, c = y.samplers.length;
		y.samplers.push({
			minFilter: s,
			magFilter: t?.magFilter === `nearest` ? 9728 : 9729,
			wrapS: wrap(t?.addressModeU),
			wrapT: wrap(t?.addressModeV)
		});
		let u = y.textures.length;
		y.textures.push({
			source: a,
			sampler: c
		});
		let d = n && require_optical_material_maps.materialTextureCoordinates(n)[r], f = {
			index: u,
			texCoord: d?.texCoord ?? 0
		};
		if (d?.texCoord === 1 && !i && reject(`material selects missing UV1.`), d) {
			let [e, t, n, r, i, a] = d.transform;
			if (e !== 1 || t !== 0 || n !== 0 || r !== 1 || i !== 0 || a !== 0) {
				let o = Math.hypot(e, t), s = o ? Math.atan2(t, e) : Math.atan2(-n, r), c = -Math.sin(s) * n + Math.cos(s) * r;
				(Math.abs(n + Math.sin(s) * c) > 1e-5 || Math.abs(r - Math.cos(s) * c) > 1e-5) && reject(`texture transform contains shear.`), extension(`KHR_texture_transform`), f.extensions = { KHR_texture_transform: {
					offset: [i, a],
					rotation: s,
					scale: [o, c]
				} };
			}
		}
		return f;
	}
	async function materialIndex(e, n) {
		e.constructor !== require_mesh.TextureMaterial && e.constructor !== require_pbr_material.PBRMaterial && reject(`native/custom materials are unsupported.`), e.textureSource && reject(`live texture overrides are unsupported.`);
		let r = e instanceof require_pbr_material.PBRMaterial ? e : void 0, i = await textureInfo(e.texture, e.textureSampler, r, `texture`, n), o = {
			baseColorFactor: [...e.color, e.opacity],
			baseColorTexture: i,
			metallicFactor: r?.metallic ?? 0,
			roughnessFactor: r?.roughness ?? 1
		}, l = {
			pbrMetallicRoughness: o,
			alphaMode: r?.alphaMode ?? (e.transparent ? `BLEND` : `OPAQUE`),
			doubleSided: r?.doubleSided ?? !0
		};
		if (r) {
			(r.lightmap || r.specularAntiAliasing || r.alphaToCoverage || Object.values(require_pbr_material.pbrTextureSources(r)).some((e) => !(e instanceof require_texture.Texture))) && reject(`lightmaps, renderer coverage/filtering and live maps are unsupported.`);
			let e = r.finish, i = require_optical_material_maps.opticalMaterialMaps(r);
			for (let e of [
				i.anisotropyTexture,
				i.iridescenceTexture,
				i.iridescenceThicknessTexture
			]) e && !(e instanceof require_texture.Texture) && reject(`live optical maps are unsupported.`);
			for (let t of [
				`subsurface`,
				`heightScale`,
				`wetness`,
				`snow`,
				`dirt`,
				`damage`,
				`detailStrength`,
				`triplanar`,
				`layerBlend`,
				`lightmapStrength`
			]) e[t] !== 0 && reject(`finish ${t} is unsupported.`);
			e.dispersion && !r.transmission && reject(`dispersion requires transmission.`), l.alphaCutoff = r.alphaCutoff;
			let a = Math.max(1, ...r.emissive);
			l.emissiveFactor = r.emissive.map((e) => e / a);
			let u = {};
			function add(e, t) {
				return extension(e), u[e] = t, t;
			}
			a !== 1 && add(`KHR_materials_emissive_strength`, { emissiveStrength: a }), add(`KHR_materials_ior`, { ior: r.ior });
			let d = add(`KHR_materials_specular`, {
				specularFactor: r.specular,
				specularColorFactor: r.specularColor
			}), f = add(`KHR_materials_clearcoat`, {
				clearcoatFactor: r.clearcoat,
				clearcoatRoughnessFactor: r.clearcoatRoughness
			}), p = add(`KHR_materials_sheen`, {
				sheenColorFactor: r.sheenColor,
				sheenRoughnessFactor: r.sheenRoughness
			}), h = add(`KHR_materials_transmission`, { transmissionFactor: r.transmission }), g = add(`KHR_materials_volume`, {
				thicknessFactor: r.thickness,
				attenuationColor: r.attenuationColor
			});
			Number.isFinite(r.attenuationDistance) && (g.attenuationDistance = r.attenuationDistance);
			let _ = e.anisotropy || e.anisotropyRotation || i.anisotropyTexture ? add(`KHR_materials_anisotropy`, {
				anisotropyStrength: e.anisotropy,
				anisotropyRotation: e.anisotropyRotation
			}) : void 0, v = e.iridescence || e.iridescenceIor !== 1.3 || e.iridescenceThickness || i.iridescenceTexture || i.iridescenceThicknessTexture || i.iridescenceThicknessMinimum !== 100 || i.iridescenceThicknessMaximum !== 400 ? add(`KHR_materials_iridescence`, {
				iridescenceFactor: e.iridescence,
				iridescenceIor: e.iridescenceIor,
				iridescenceThicknessMinimum: i.iridescenceThicknessMinimum,
				iridescenceThicknessMaximum: require_optical_material_maps.hasOpticalMaterialMaps(r) ? i.iridescenceThicknessMaximum : 100 + 700 * e.iridescenceThickness
			}) : void 0;
			for (let [e, a, o, s, c] of [
				[
					i.anisotropyTexture,
					i.anisotropySampler,
					`anisotropy`,
					_,
					`anisotropyTexture`
				],
				[
					i.iridescenceTexture,
					i.iridescenceSampler,
					`iridescence`,
					v,
					`iridescenceTexture`
				],
				[
					i.iridescenceThicknessTexture,
					i.iridescenceThicknessSampler,
					`iridescenceThickness`,
					v,
					`iridescenceThicknessTexture`
				]
			]) e instanceof require_texture.Texture && s && (s[c] = await textureInfo(e, a, r, o, n));
			e.dispersion && add(`KHR_materials_dispersion`, { dispersion: e.dispersion });
			let y = [
				[
					`metallicRoughnessTexture`,
					`metallicRoughness`,
					o,
					`metallicRoughnessTexture`,
					r.metallicRoughnessSampler
				],
				[
					`normalTexture`,
					`normal`,
					l,
					`normalTexture`,
					r.normalSampler
				],
				[
					`occlusionTexture`,
					`occlusion`,
					l,
					`occlusionTexture`,
					r.occlusionSampler
				],
				[
					`emissiveTexture`,
					`emissive`,
					l,
					`emissiveTexture`,
					r.emissiveSampler
				],
				[
					`specularTexture`,
					`specular`,
					d,
					`specularTexture`,
					r.specularSampler
				],
				[
					`specularColorTexture`,
					`specularColor`,
					d,
					`specularColorTexture`,
					r.specularColorSampler
				],
				[
					`clearcoatTexture`,
					`clearcoat`,
					f,
					`clearcoatTexture`,
					r.clearcoatSampler
				],
				[
					`clearcoatRoughnessTexture`,
					`clearcoatRoughness`,
					f,
					`clearcoatRoughnessTexture`,
					r.clearcoatRoughnessSampler
				],
				[
					`clearcoatNormalTexture`,
					`clearcoatNormal`,
					f,
					`clearcoatNormalTexture`,
					r.clearcoatNormalSampler
				],
				[
					`sheenColorTexture`,
					`sheenColor`,
					p,
					`sheenColorTexture`,
					r.sheenColorSampler
				],
				[
					`sheenRoughnessTexture`,
					`sheenRoughness`,
					p,
					`sheenRoughnessTexture`,
					r.sheenRoughnessSampler
				],
				[
					`transmissionTexture`,
					`transmission`,
					h,
					`transmissionTexture`,
					r.transmissionSampler
				],
				[
					`thicknessTexture`,
					`thickness`,
					g,
					`thicknessTexture`,
					r.thicknessSampler
				]
			];
			for (let [e, t, i, a, o] of y) {
				let s = r[e];
				if (s) {
					let e = await textureInfo(s, o, r, t, n);
					t === `normal` && (e.scale = r.normalScale), t === `clearcoatNormal` && (e.scale = r.clearcoatNormalScale), t === `occlusion` && (e.strength = r.occlusionStrength), i[a] = e;
				}
			}
			l.extensions = u;
		}
		return y.materials.push(l), y.materials.length - 1;
	}
	let w;
	if (e instanceof require_scene.Scene) {
		e.destroyed && reject(`destroyed Scene.`);
		let t = [...e.objects];
		t.some((e) => !(e instanceof require_object3d.Object3D)) && reject(`Scene contains non-3D objects.`), w = t.filter((e) => !e.parent), (e.pointLights.length || e.spotLights.length || e.environment) && reject(`scene lights/environment are unsupported.`);
	} else w = e instanceof require_object3d.Object3D ? [e] : e;
	Array.isArray(w) || reject(`input must be Scene, Object3D or an array.`);
	let T = /* @__PURE__ */ new Map(), E = [];
	function visit(e, t) {
		(!(e instanceof require_object3d.Object3D) || e.destroyed) && reject(`invalid/destroyed node.`), (t > 256 || T.has(e)) && reject(`duplicate nodes, overlapping roots or excessive hierarchy depth.`), e.constructor !== require_object3d.Object3D && e.constructor !== require_group.Group && e.constructor !== require_mesh.Mesh && e.constructor !== require_skinned_mesh.SkinnedMesh && reject(`custom/instanced/procedural node types are unsupported.`), (!e.visible || e.body || e.collider) && reject(`hidden nodes and physics attachments are unsupported.`), T.set(e, E.length), E.push(e), y.nodes.push(pose(e, [
			e.scale.x,
			e.scale.y,
			e.scale.z
		]));
		for (let n of e.children) visit(n, t + 1);
	}
	for (let e of w) e.parent && reject(`export roots must be parentless; export their ancestor to preserve local transforms.`), visit(e, 0), y.scenes[0].nodes.push(T.get(e));
	let D = /* @__PURE__ */ new Map(), O = /* @__PURE__ */ new Map();
	for (let e of E) {
		let t = y.nodes[T.get(e)];
		if (e.children.size && (t.children = [...e.children].map((e) => T.get(e))), !(e instanceof require_mesh.Mesh)) continue;
		let n = e.renderGeometry, r = e.morph && morphExportSnapshot(e.morph), a = r?.vertices ?? n.vertices, o = a.length / 8, stream = (e, t) => {
			let n = new Float32Array(o * t);
			for (let r = 0; r < o; r++) for (let i = 0; i < t; i++) n[r * t + i] = a[r * 8 + e + i];
			return n;
		}, s = {
			POSITION: accessor(stream(0, 3), 3, `VEC3`, 5126, !0),
			NORMAL: accessor(stream(3, 3), 3, `VEC3`),
			TEXCOORD_0: accessor(stream(6, 2), 2, `VEC2`),
			TANGENT: accessor(r?.tangents ?? n.tangents, 4, `VEC4`)
		};
		n.uvs1 && (s.TEXCOORD_1 = accessor(n.uvs1, 2, `VEC2`)), n.colors && (s.COLOR_0 = accessor(n.colors, 4, `VEC4`));
		for (let e of n.indices) e >= o && reject(`geometry index exceeds vertex count.`);
		let c = {
			attributes: s,
			indices: accessor(n.indices, 1, `SCALAR`, 5125),
			material: await materialIndex(e.material, !!n.uvs1),
			mode: 4
		};
		if (D.set(e, c), e instanceof require_skinned_mesh.SkinnedMesh) {
			(e.joints.length > 65536 || e.joints.some((e) => !T.has(e))) && reject(`skin joints must be included in the exported hierarchy and fit unsigned short.`);
			let n = e.influencesPerVertex;
			for (let t = 0; t < n / 4; t++) {
				let r = new Uint16Array(o * 4), i = new Float32Array(o * 4);
				for (let a = 0; a < o; a++) for (let o = 0; o < 4; o++) {
					let s = a * n + t * 4 + o;
					e.jointIndices[s] >= e.joints.length && reject(`skin joint index exceeds joint count.`), r[a * 4 + o] = e.jointIndices[s], i[a * 4 + o] = e.weights[s];
				}
				s[`JOINTS_${t}`] = accessor(r, 4, `VEC4`, 5123), s[`WEIGHTS_${t}`] = accessor(i, 4, `VEC4`);
			}
			let r = new Float32Array(e.joints.length * 16);
			e.inverseBindMatrices.forEach((e, t) => r.set(e.elements, t * 16)), t.skin = y.skins.length, y.skins.push({
				joints: e.joints.map((e) => T.get(e)),
				inverseBindMatrices: accessor(r, 16, `MAT4`)
			});
		}
		let l = { primitives: [c] };
		if (r && e.morph) {
			c.targets = r.targets.map((e) => {
				let t = {};
				return e.positions && (t.POSITION = accessor(e.positions, 3, `VEC3`, 5126, !0)), e.normals && (t.NORMAL = accessor(e.normals, 3, `VEC3`)), e.tangents && (t.TANGENT = accessor(e.tangents, 3, `VEC3`)), Object.keys(t).length || (t.POSITION = accessor(new Float32Array(o * 3), 3, `VEC3`, 5126, !0)), t;
			}), l.weights = Array.from(e.morph.weights.values);
			let t = O.get(e.morph.weights) ?? [];
			t.push(T.get(e)), O.set(e.morph.weights, t);
		}
		t.mesh = y.meshes.length, y.meshes.push(l);
	}
	let k = _.variants ?? [];
	if (k.length) {
		extension(`KHR_materials_variants`);
		let e = /* @__PURE__ */ new Set();
		y.extensions = { KHR_materials_variants: { variants: k.map((t) => ((!t.name || e.has(t.name)) && reject(`variant names must be unique and nonempty.`), e.add(t.name), { name: t.name })) } };
		let t = /* @__PURE__ */ new Map();
		for (let e = 0; e < k.length; e++) {
			let n = /* @__PURE__ */ new Set();
			for (let r of k[e].mappings) {
				(!D.has(r.mesh) || n.has(r.mesh)) && reject(`variant mapping references a missing or duplicate mesh.`), n.add(r.mesh);
				let i = t.get(r.mesh) ?? [];
				i.push({
					material: await materialIndex(r.material, !!r.mesh.renderGeometry.uvs1),
					variants: [e]
				}), t.set(r.mesh, i);
			}
		}
		for (let [e, n] of t) D.get(e).extensions = { KHR_materials_variants: { mappings: n } };
	}
	for (let e of _.animations ?? []) {
		e instanceof require_animation.AnimationClip || reject(`animations require AnimationClip.`);
		let t = [], r = [], i = /* @__PURE__ */ new Set();
		for (let n of e.tracks) {
			let e = n.target instanceof require_morph.MorphWeights ? O.get(n.target) : T.has(n.target) ? [T.get(n.target)] : void 0;
			e?.length || reject(`animation target is outside the exported hierarchy.`);
			let a = accessor(n.times, 1, `SCALAR`, 5126, !0), s = accessor(n.values, n.path === `weights` ? 1 : n.size, n.path === `rotation` ? `VEC4` : n.path === `weights` ? `SCALAR` : `VEC3`);
			for (let o of e) {
				let e = `${o}:${n.path}`;
				i.has(e) && reject(`duplicate animation channels cannot be represented cleanly.`), i.add(e), t.push({
					sampler: r.length,
					target: {
						node: o,
						path: n.path
					}
				}), r.push({
					input: a,
					output: s,
					interpolation: n.interpolation
				});
			}
		}
		t.length || reject(`empty animation clips are unsupported.`), y.animations.push({
			name: e.name,
			channels: t,
			samplers: r
		});
	}
	let A = _.camera ?? (e instanceof require_scene.Scene ? e.camera3D : void 0);
	if (A) {
		let e = _.cameraAspect ?? 1;
		(!Number.isFinite(e) || e <= 0 || !Number.isFinite(A.near) || !Number.isFinite(A.far) || A.far <= A.near) && reject(`invalid camera range/aspect.`);
		let t;
		A instanceof require_perspective_camera.PerspectiveCamera ? ((A.near <= 0 || !Number.isFinite(A.fov) || A.fov <= 0 || A.fov >= Math.PI) && reject(`invalid perspective camera.`), t = {
			type: `perspective`,
			perspective: {
				yfov: A.fov,
				aspectRatio: e,
				znear: A.near,
				zfar: A.far
			}
		}) : A instanceof require_orthographic_camera.OrthographicCamera ? ((A.near < 0 || !Number.isFinite(A.height) || A.height <= 0 || !Number.isFinite(A.zoom) || A.zoom <= 0) && reject(`invalid orthographic camera.`), t = {
			type: `orthographic`,
			orthographic: {
				xmag: A.height * e / (2 * A.zoom),
				ymag: A.height / (2 * A.zoom),
				znear: A.near,
				zfar: A.far
			}
		}) : reject(`unsupported camera.`), y.scenes[0].nodes.push(y.nodes.length), y.nodes.push({
			...pose(A),
			camera: y.cameras.length
		}), y.cameras.push(t);
	}
	x = Math.ceil(x / 4) * 4;
	let j = new ArrayBuffer(x), M = new Uint8Array(j);
	for (let e of b) M.set(e.bytes, e.offset);
	return x && y.buffers.push({
		byteLength: x,
		uri: v
	}), S.size && (y.extensionsUsed = [...S], y.extensionsRequired = [...S]), {
		json: y,
		buffers: x ? [j] : []
	};
}
async function exportGLB(e, t = {}) {
	let n = await exportGLTF(e, t);
	for (let e of n.json.buffers) delete e.uri;
	let r = new TextEncoder().encode(JSON.stringify(n.json)), i = Math.ceil(r.byteLength / 4) * 4, a = n.buffers[0], o = 20 + i + (a ? 8 + a.byteLength : 0);
	o > 4294967295 && reject(`GLB exceeds its 32-bit length limit.`);
	let s = new ArrayBuffer(o), c = new Uint8Array(s), l = new DataView(s);
	if (l.setUint32(0, 1179937895, !0), l.setUint32(4, 2, !0), l.setUint32(8, o, !0), l.setUint32(12, i, !0), l.setUint32(16, 1313821514, !0), c.fill(32, 20, 20 + i), c.set(r, 20), a) {
		let e = 20 + i;
		l.setUint32(e, a.byteLength, !0), l.setUint32(e + 4, 5130562, !0), c.set(new Uint8Array(a), e + 8);
	}
	return s;
}
//#endregion
exports.exportGLB = exportGLB;
exports.exportGLTF = exportGLTF;

//# sourceMappingURL=gltf-exporter.cjs.map