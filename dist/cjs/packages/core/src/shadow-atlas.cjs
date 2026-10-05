const require_math3d = require("../../math/src/math3d.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_perspective_camera = require("./perspective-camera.cjs");
const require_orthographic_camera = require("./orthographic-camera.cjs");
const require_light_selection = require("./light-selection.cjs");
const require_render_data = require("./render-data.cjs");
//#region dist/packages/core/src/shadow-atlas.js
var c = [
	[
		1,
		0,
		0
	],
	[
		-1,
		0,
		0
	],
	[
		0,
		1,
		0
	],
	[
		0,
		-1,
		0
	],
	[
		0,
		0,
		1
	],
	[
		0,
		0,
		-1
	]
];
var ShadowAtlas = class {
	matrices = Array.from({ length: require_rendering.shadowLimits.maps }, () => new require_math3d.Matrix4());
	data = new Float32Array(require_rendering.SHADOW_FLOAT_COUNT);
	projections = new Float32Array(require_rendering.shadowLimits.maps * 64);
	count = 0;
	grid = 1;
	size = 0;
	stats = {
		points: {
			requested: 0,
			allocated: 0,
			overflow: 0
		},
		spots: {
			requested: 0,
			allocated: 0,
			overflow: 0
		}
	};
	points = [];
	spots = [];
	identities = /* @__PURE__ */ new Set();
	inverse = new require_math3d.Matrix4();
	perspective = new require_perspective_camera.PerspectiveCamera();
	orthographic = new require_orthographic_camera.OrthographicCamera();
	nearCorners = Array.from({ length: 4 }, () => new require_math3d.Vector3());
	farCorners = Array.from({ length: 4 }, () => new require_math3d.Vector3());
	corners = Array.from({ length: 8 }, () => new require_math3d.Vector3());
	center = new require_math3d.Vector3();
	target = new require_math3d.Vector3();
	forward = new require_math3d.Vector3();
	update(e, t) {
		if (!Number.isFinite(t) || t <= 0) throw RangeError(`Shadow atlas aspect must be positive and finite.`);
		require_light_selection.validateLightPool(e), this.identities.clear();
		for (let t of [e.pointLights, e.spotLights]) for (let e of t) {
			if (this.identities.has(e.id)) throw RangeError(`Scene light pools cannot contain duplicate identities.`);
			this.identities.add(e.id);
		}
		let n = e.shadows;
		if (n.validate(), this.count = 0, this.points.length = this.spots.length = 0, this.stats.points.requested = this.stats.points.allocated = this.stats.points.overflow = 0, this.stats.spots.requested = this.stats.spots.allocated = this.stats.spots.overflow = 0, this.data.fill(0), this.data.fill(-1, 16, 48), !n.enabled) {
			this.size = 0;
			return;
		}
		let a = e.camera3D, o = a.rotation;
		this.forward.set(-2 * (o.x * o.z + o.w * o.y), -2 * (o.y * o.z - o.w * o.x), -(1 - 2 * (o.x * o.x + o.y * o.y))).normalize(), this.data[8] = this.forward.x, this.data[9] = this.forward.y, this.data[10] = this.forward.z, this.data[11] = n.cascades, this.data[12] = a.position.x, this.data[13] = a.position.y, this.data[14] = a.position.z, n.cascades === 1 ? (require_render_data.computeShadowMatrix(e, this.matrices[0]), this.count = 1, this.data[4] = a.far) : this.fitCascades(e, t), this.selectShadows(e.pointLights, this.points, require_rendering.shadowLimits.pointLights), this.selectShadows(e.spotLights, this.spots, require_rendering.shadowLimits.spotLights), this.stats.points.requested = this.countRequested(e.pointLights), this.stats.spots.requested = this.countRequested(e.spotLights), this.stats.points.allocated = this.points.length, this.stats.spots.allocated = this.spots.length, this.stats.points.overflow = this.stats.points.requested - this.points.length, this.stats.spots.overflow = this.stats.spots.requested - this.spots.length;
		for (let e = 0; e < this.points.length; e++) {
			let t = this.points[e];
			this.data[16 + e] = this.count, this.data[32 + e] = t.id;
			for (let e of c) this.target.set(t.position.x + e[0], t.position.y + e[1], t.position.z + e[2]), this.projectLight(t, Math.PI / 2);
		}
		for (let e = 0; e < this.spots.length; e++) {
			let t = this.spots[e];
			this.data[24 + e] = this.count, this.data[40 + e] = t.id, this.target.copy(t.position).add(t.direction), this.projectLight(t, t.outerAngle * 2);
		}
		this.grid = Math.ceil(Math.sqrt(this.count)), this.size = this.grid * n.mapSize, this.data[0] = this.count, this.data[1] = this.grid, this.data[2] = n.mapSize, this.data[3] = n.bias;
		let l = 48 + require_rendering.shadowLimits.maps * 16;
		this.data[l] = n.cascadeBlend, this.data[l + 1] = Math.max(a.near, n.near), this.data[l + 2] = n.slopeBias;
		for (let e = 0; e < this.count; e++) this.data.set(this.matrices[e].elements, 48 + e * 16), this.projections.set(this.matrices[e].elements, e * 64);
	}
	pointBase(e) {
		for (let t = 0; t < this.points.length; t++) if (this.points[t].id === e) return this.data[16 + t];
		return -1;
	}
	spotBase(e) {
		for (let t = 0; t < this.spots.length; t++) if (this.spots[t].id === e) return this.data[24 + t];
		return -1;
	}
	countRequested(e) {
		let t = 0;
		for (let n of e) n.castShadow && n.intensity > 0 && t++;
		return t;
	}
	selectShadows(e, t, n) {
		for (let r of e) {
			if (!r.castShadow || r.intensity === 0) continue;
			let e = 0;
			for (; e < t.length && (t[e].priority > r.priority || t[e].priority === r.priority && (t[e].intensity > r.intensity || t[e].intensity === r.intensity && t[e].id < r.id));) e++;
			if (!(e >= n)) {
				for (let r = Math.min(t.length, n - 1); r > e; r--) t[r] = t[r - 1];
				t[e] = r;
			}
		}
	}
	projectLight(e, t) {
		let n = this.perspective;
		n.position.copy(e.position), n.lookAt(this.target), n.fov = t, n.near = e.shadowNear, n.far = e.range || e.shadowFar, this.matrices[this.count++].copy(n.updateMatrix(1));
	}
	fitCascades(e, t) {
		let n = e.camera3D, r = e.shadows, i = Math.max(n.near, r.near), a = Math.min(n.far, r.cascadeDistance);
		if (a <= i) throw RangeError(`Cascade distance must exceed the camera near plane.`);
		this.inverse.copy(n.updateMatrix(t)).invert();
		for (let e = 0; e < 4; e++) {
			let t = e & 1 ? 1 : -1, n = e & 2 ? 1 : -1;
			this.nearCorners[e].set(t, n, 0), this.farCorners[e].set(t, n, 1), this.inverse.transformPoint(this.nearCorners[e], this.nearCorners[e]), this.inverse.transformPoint(this.farCorners[e], this.farCorners[e]);
		}
		let o = i;
		for (let t = 0; t < r.cascades; t++) {
			let s = (t + 1) / r.cascades, c = i + (a - i) * s, l = c + (i * (a / i) ** s - c) * r.cascadeLambda;
			this.data[4 + t] = l, this.center.set(0, 0, 0);
			for (let e = 0; e < 8; e++) {
				let a = this.nearCorners[e % 4], s = this.farCorners[e % 4], c = ((e < 4 ? o - (o - (t > 1 ? this.data[2 + t] : i)) * r.cascadeBlend : l) - n.near) / (n.far - n.near), u = this.corners[e];
				u.set(a.x + (s.x - a.x) * c, a.y + (s.y - a.y) * c, a.z + (s.z - a.z) * c), this.center.add(u);
			}
			this.center.scale(1 / 8);
			let u = 0;
			for (let e of this.corners) u = Math.max(u, Math.hypot(e.x - this.center.x, e.y - this.center.y, e.z - this.center.z));
			u = Math.ceil(u * 16) / 16;
			let d = this.orthographic, f = e.directionalLight.direction, p = f.length();
			if (p === 0) throw RangeError(`Directional shadow light direction cannot be zero.`);
			let m = Math.max(r.far, u * 4);
			d.position.set(this.center.x + f.x / p * m / 2, this.center.y + f.y / p * m / 2, this.center.z + f.z / p * m / 2), d.lookAt(this.center), d.near = r.near, d.far = m, d.height = u * 2;
			let h = this.matrices[this.count++].copy(d.updateMatrix(1));
			h.elements[12] = Math.round(h.elements[12] * r.mapSize / 2) * 2 / r.mapSize, h.elements[13] = Math.round(h.elements[13] * r.mapSize / 2) * 2 / r.mapSize, o = l;
		}
	}
};
//#endregion
exports.ShadowAtlas = ShadowAtlas;

//# sourceMappingURL=shadow-atlas.cjs.map