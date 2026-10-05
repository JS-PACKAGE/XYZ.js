const require_render_bounds = require("./render-bounds.cjs");
const require_mesh = require("./mesh.cjs");
const require_visibility = require("../../../src/data/visibility.cjs");
const require_objects3d = require("./objects3d.cjs");
const require_instanced_mesh = require("./instanced-mesh.cjs");
const require_pbr_material = require("./pbr-material.cjs");
const require_skinned_mesh = require("./skinned-mesh.cjs");
//#region dist/packages/core/src/render-visibility.js
var RenderVisibilitySet = class {
	color = [];
	shadows = [];
	entries = /* @__PURE__ */ new Map();
	occlusionCandidates = [];
	meshChecks = 0;
	poseChecks = 0;
	boxTests = 0;
	sphereTests = 0;
	instanceTests = 0;
	boundsRefits = 0;
	frustumCulled = 0;
	occlusionCulled = 0;
	epoch = 0;
};
var RenderVisibilityCache = class {
	scene;
	revision = -1;
	epoch = 0;
	records = /* @__PURE__ */ new Map();
	leaves = [];
	lods = /* @__PURE__ */ new Map();
	gatherFrame = 0;
	root;
	cameraStamp = (/* @__PURE__ */ new Float64Array(18)).fill(NaN);
	localSphere = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	worldSphere = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	stampValues = /* @__PURE__ */ new Float64Array(15);
	baseSphere = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	frame = 0;
	collect(e, a, c, l, u = {}) {
		let d = u.viewportHeight ?? 1, f = u.timeSeconds ?? 0;
		if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(f)) throw RangeError(`Visibility requires positive viewport height and finite presentation time.`);
		l.color.length = l.shadows.length = l.occlusionCandidates.length = 0, l.meshChecks = l.poseChecks = l.boxTests = l.sphereTests = l.instanceTests = 0, l.frustumCulled = l.occlusionCulled = 0, l.boundsRefits = 0;
		let p = !1, m = !1;
		this.scene !== e && (this.clear(), this.scene = e, p = !0), this.revision !== e.renderMeshRevision && (this.sync(e.renderMeshes), this.revision = e.renderMeshRevision, p = !0, m = !0);
		for (let e of l.entries.keys()) this.records.has(e) || l.entries.delete(e);
		++this.gatherFrame;
		for (let e of this.records.keys()) for (let t = e.parent; t; t = t.parent) t instanceof require_objects3d.LOD && this.lods.set(t, this.gatherFrame);
		for (let e of this.lods.keys()) this.lods.get(e) === this.gatherFrame ? e.updateForRender(a, d, f) : this.lods.delete(e);
		for (let e of this.records.values()) {
			let a = e.entry, s = a.mesh;
			l.meshChecks++, l.poseChecks++, s.updateRenderDeformation(), s.updateWorldMatrix(), s.getWorldBoundingSphere(a.sphere, !1);
			let c = 1;
			for (let e = s.parent; e; e = e.parent) e instanceof require_objects3d.LOD && (c *= e.renderWeight(s));
			a.fade = c, e.colorVisible = !1, e.drawable = s.worldVisible && !require_mesh.materialBaseTexture(s.material).destroyed && s.geometry.indices.length > 0 && (s.material.opacity > 0 || s.material instanceof require_pbr_material.PBRMaterial && s.material.alphaMode !== `BLEND`);
			let u = e.stamp, d = s.worldMatrix.elements, f = a.sphere;
			for (let e = 0; e < 16; e++) Object.is(u[e], d[e]) || (p = !0), u[e] = d[e];
			let h = this.stampValues;
			h[0] = f.x, h[1] = f.y, h[2] = f.z, h[3] = f.radius, h[4] = +!!e.drawable, h[5] = c, h[6] = s.renderGeometry.version, h[7] = +!!s.frustumCulled, h[8] = +!!s.occlusionCulled, h[9] = s instanceof require_instanced_mesh.InstancedMesh ? s.version : 0, h[10] = s instanceof require_instanced_mesh.InstancedMesh ? s.colorVersion : 0, h[11] = s instanceof require_skinned_mesh.SkinnedMesh ? s.paletteVersion : 0, h[12] = require_mesh.materialBaseTexture(s.material).version, h[13] = s.material.opacity, h[14] = s.material instanceof require_pbr_material.PBRMaterial ? s.material.alphaMode === `MASK` ? 1 : s.material.alphaMode === `BLEND` ? 2 : 0 : 0;
			for (let e = 0; e < h.length; e++) Object.is(u[16 + e], h[e]) || (p = !0, (e < 4 || e === 7) && (m = !0)), u[16 + e] = h[e];
			l.entries.set(s, a), e.drawable && s.castShadow && l.shadows.push(s);
		}
		let h = a.matrix.elements;
		for (let e = 0; e < this.cameraStamp.length; e++) {
			let t = e < 16 ? h[e] : e === 16 ? d : u.depthRevision ?? 0;
			Object.is(this.cameraStamp[e], t) || (p = !0), this.cameraStamp[e] = t;
		}
		if (p && ++this.epoch, l.epoch = this.epoch, !this.root && this.leaves.length) {
			let e = 1 / 0, t = 1 / 0, n = 1 / 0, r = -1 / 0, i = -1 / 0, a = -1 / 0;
			for (let o of this.leaves) {
				let c = o.entry.sphere;
				require_render_bounds.sphereIsFinite(c) && (e = Math.min(e, c.x), r = Math.max(r, c.x), t = Math.min(t, c.y), i = Math.max(i, c.y), n = Math.min(n, c.z), a = Math.max(a, c.z));
			}
			let o = r - e >= i - t && r - e >= a - n ? `x` : i - t >= a - n ? `y` : `z`;
			this.leaves.sort((e, t) => e.entry.sphere[o] - t.entry.sphere[o] || 0), this.root = this.build(0, this.leaves.length);
		}
		this.root && (m && this.refit(this.root, l), this.gather(this.root, a, c, l, u, d));
		for (let e of this.records.values()) e.colorVisible && l.color.push(e.entry.mesh), e.drawable && ++l.frustumCulled;
		return l.frustumCulled -= l.color.length + l.occlusionCulled, l;
	}
	clear() {
		this.records.clear(), this.leaves.length = 0, this.lods.clear(), this.root = void 0, this.scene = void 0, this.revision = -1, this.cameraStamp.fill(NaN), ++this.epoch;
	}
	sync(e) {
		if (++this.frame, e) for (let t of e) {
			let e = this.records.get(t);
			e ||= {
				entry: {
					mesh: t,
					sphere: {
						x: 0,
						y: 0,
						z: 0,
						radius: 0
					},
					fade: 1,
					instances: void 0
				},
				stamp: (/* @__PURE__ */ new Float64Array(31)).fill(NaN),
				candidate: {
					mesh: t,
					epoch: 0,
					minX: 0,
					minY: 0,
					minZ: 0,
					maxX: 0,
					maxY: 0,
					maxZ: 0
				},
				instanceVersion: -1,
				colorVersion: -1,
				instanceEpoch: -1,
				drawable: !1,
				colorVisible: !1,
				seen: this.frame
			}, this.records.delete(t), this.records.set(t, e), e.seen = this.frame;
		}
		for (let [e, t] of this.records) t.seen !== this.frame && this.records.delete(e);
		this.leaves.length = 0;
		for (let e of this.records.values()) this.leaves.push(e);
		this.root = void 0;
	}
	build(e, t) {
		let n = {
			minX: 0,
			minY: 0,
			minZ: 0,
			maxX: 0,
			maxY: 0,
			maxZ: 0,
			left: void 0,
			right: void 0,
			record: void 0
		};
		if (t - e === 1) n.record = this.leaves[e];
		else {
			let r = e + Math.floor((t - e) / 2);
			n.left = this.build(e, r), n.right = this.build(r, t);
		}
		return n;
	}
	refit(e, t) {
		if (t.boundsRefits++, e.record) {
			let t = e.record.entry.mesh, n = e.record.entry.sphere;
			!t.frustumCulled || !require_render_bounds.sphereIsFinite(n) ? (e.minX = e.minY = e.minZ = -1 / 0, e.maxX = e.maxY = e.maxZ = 1 / 0) : (e.minX = n.x - n.radius, e.maxX = n.x + n.radius, e.minY = n.y - n.radius, e.maxY = n.y + n.radius, e.minZ = n.z - n.radius, e.maxZ = n.z + n.radius);
		} else {
			let n = e.left, r = e.right;
			this.refit(n, t), this.refit(r, t), e.minX = Math.min(n.minX, r.minX), e.maxX = Math.max(n.maxX, r.maxX), e.minY = Math.min(n.minY, r.minY), e.maxY = Math.max(n.maxY, r.maxY), e.minZ = Math.min(n.minZ, r.minZ), e.maxZ = Math.max(n.maxZ, r.maxZ);
		}
	}
	gather(t, r, i, o, c, l) {
		if (o.boxTests++, !i.intersectsBox(t.minX, t.minY, t.minZ, t.maxX, t.maxY, t.maxZ)) return;
		if (!t.record) {
			this.gather(t.left, r, i, o, c, l), this.gather(t.right, r, i, o, c, l);
			return;
		}
		let u = t.record, d = u.entry, f = d.mesh, p = d.sphere;
		if (u.drawable && (o.sphereTests++, !(f.frustumCulled && require_render_bounds.sphereIsFinite(p) && !i.intersectsSphere(p.x, p.y, p.z, p.radius)) && !(f instanceof require_instanced_mesh.InstancedMesh && !this.packInstances(u, f, i, o)))) {
			if (f.occlusionCulled && c.occlusion && require_render_bounds.sphereIsFinite(p) && d.fade === 1 && require_objects3d.projectedSphereDiameter(p, r, l) >= require_visibility.visibilityLimits.minimumQueryPixels && o.occlusionCandidates.length < require_visibility.visibilityLimits.occlusionQueries) {
				let t = u.candidate, n = p.radius + Math.max(require_visibility.visibilityLimits.proxyInflation, p.radius * require_visibility.visibilityLimits.proxyInflation, Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)) * require_visibility.visibilityLimits.proxyCoordinateInflation);
				t.minX = p.x - n, t.maxX = p.x + n, t.minY = p.y - n, t.maxY = p.y + n, t.minZ = p.z - n, t.maxZ = p.z + n, t.epoch = this.epoch;
				let i = r.matrix.elements, a = !0;
				for (let e = 0; e < 8; e++) {
					let n = e & 1 ? t.maxX : t.minX, r = e & 2 ? t.maxY : t.minY, o = e & 4 ? t.maxZ : t.minZ, s = i[3] * n + i[7] * r + i[11] * o + i[15], c = i[2] * n + i[6] * r + i[10] * o + i[14];
					if (!(s > 0 && c > 0)) {
						a = !1;
						break;
					}
				}
				if (a && (o.occlusionCandidates.push(t), !c.occlusion.visible(f, this.epoch))) {
					o.occlusionCulled++;
					return;
				}
			}
			u.colorVisible = !0;
		}
	}
	packInstances(e, t, n, r) {
		let i = e.entry.instances;
		if (i || (e.entry.instances = i = {
			indices: new Uint32Array(t.count),
			matrices: new Float32Array(t.count * 16),
			colors: void 0,
			count: 0,
			version: 0
		}), e.instanceEpoch === this.epoch) return i.count > 0;
		e.instanceEpoch = this.epoch;
		let a = t.geometry.boundingSphere, o = t.material.deformationBounds, u = this.baseSphere;
		u.x = a.x, u.y = a.y, u.z = a.z, u.radius = o === void 0 ? 1 / 0 : a.radius + o;
		let d = 0, f = e.instanceVersion !== t.version || e.colorVersion !== t.colorVersion;
		for (let e = 0; e < t.count; e++) {
			r.instanceTests++, require_render_bounds.transformSphereElements(u, t.matrices, e * 16, this.localSphere);
			let a = require_render_bounds.transformSphere(this.localSphere, t.worldMatrix, this.worldSphere);
			t.frustumCulled && require_render_bounds.sphereIsFinite(a) && !n.intersectsSphere(a.x, a.y, a.z, a.radius) || (i.indices[d] !== e && (f = !0), i.indices[d++] = e);
		}
		if (i.count !== d && (f = !0), i.count = d, t.colors && !i.colors && (i.colors = new Float32Array(t.count * 3), f = !0), f) {
			for (let e = 0; e < d; e++) {
				let n = i.indices[e];
				for (let r = 0; r < 16; r++) i.matrices[e * 16 + r] = t.matrices[n * 16 + r];
				if (t.colors && i.colors) for (let r = 0; r < 3; r++) i.colors[e * 3 + r] = t.colors[n * 3 + r];
			}
			i.version++, e.instanceVersion = t.version, e.colorVersion = t.colorVersion;
		}
		return d > 0;
	}
};
//#endregion
exports.RenderVisibilityCache = RenderVisibilityCache;
exports.RenderVisibilitySet = RenderVisibilitySet;

//# sourceMappingURL=render-visibility.cjs.map