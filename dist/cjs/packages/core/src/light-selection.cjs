const require_hypot = require("../../math/src/hypot.cjs");
const require_math3d = require("../../math/src/math3d.cjs");
const require_render_bounds = require("./render-bounds.cjs");
const require_lights = require("../../../src/data/lights.cjs");
const require_lights$1 = require("./lights.cjs");
//#region dist/packages/core/src/light-selection.js
function validateLightPool(e) {
	if (!Array.isArray(e.pointLights) || !Array.isArray(e.spotLights)) throw TypeError(`Scene pointLights and spotLights must be arrays.`);
	if (e.pointLights.length > require_lights.lightSelectionLimits.poolPerType || e.spotLights.length > require_lights.lightSelectionLimits.poolPerType) throw RangeError(`Scene light pools cannot exceed ${require_lights.lightSelectionLimits.poolPerType} lights per type.`);
	for (let t of e.pointLights) {
		if (!(t instanceof require_lights$1.PointLight) || t instanceof require_lights$1.SpotLight) throw TypeError(`Scene pointLights must contain PointLight objects, not SpotLight objects.`);
		t.validate();
	}
	for (let t of e.spotLights) {
		if (!(t instanceof require_lights$1.SpotLight)) throw TypeError(`Scene spotLights must contain SpotLight objects.`);
		t.validate();
	}
}
function capacity(e, t) {
	if (!Number.isInteger(e) || e < 0 || e > t) throw RangeError(`Light selection capacity must be an integer in [0, ${t}].`);
	return e;
}
var LightGrid = class LightGrid {
	cell = 0;
	always = [];
	cells = /* @__PURE__ */ new Map();
	spare = [];
	ranges = [];
	stamps = /* @__PURE__ */ new Uint32Array();
	query = 0;
	candidates = [];
	static key(e, t, n) {
		return e * 73856093 ^ t * 19349663 ^ n * 83492791;
	}
	build(e) {
		for (let e of this.cells.values()) e.length = 0, this.spare.push(e);
		this.cells.clear(), this.always.length = this.ranges.length = 0, this.stamps.length < e.length && (this.stamps = new Uint32Array(e.length), this.query = 0);
		for (let t of e) t.range > 0 && this.ranges.push(t.range);
		this.ranges.sort((e, t) => e - t), this.cell = (this.ranges[this.ranges.length >> 1] ?? 0) * 2;
		let t = this.cell;
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i = r.position, a = r.range;
			if (!(t > 0 && a > 0 && a <= t * 2)) {
				this.always.push(n);
				continue;
			}
			let o = (a + Math.abs(i.x) + Math.abs(i.y) + Math.abs(i.z) + t) * 1e-9, s = Math.floor((i.x - a - o) / t), c = Math.floor((i.x + a + o) / t), l = Math.floor((i.y - a - o) / t), u = Math.floor((i.y + a + o) / t), d = Math.floor((i.z - a - o) / t), f = Math.floor((i.z + a + o) / t);
			if (!Number.isFinite(s + c + l + u + d + f) || (c - s + 1) * (u - l + 1) * (f - d + 1) > 64) {
				this.always.push(n);
				continue;
			}
			for (let e = s; e <= c; e++) for (let t = l; t <= u; t++) for (let r = d; r <= f; r++) {
				let i = LightGrid.key(e, t, r), a = this.cells.get(i);
				a || this.cells.set(i, a = this.spare.pop() ?? []), a.push(n);
			}
		}
	}
	gather(e, t, n, r) {
		let i = this.cell;
		if (!(i > 0)) return !1;
		let a = (r + Math.abs(e) + Math.abs(t) + Math.abs(n) + i) * 1e-9, o = Math.floor((e - r - a) / i), s = Math.floor((e + r + a) / i), c = Math.floor((t - r - a) / i), l = Math.floor((t + r + a) / i), u = Math.floor((n - r - a) / i), d = Math.floor((n + r + a) / i);
		if (!Number.isFinite(o + s + c + l + u + d) || (s - o + 1) * (l - c + 1) * (d - u + 1) > 64) return !1;
		++this.query === 4294967295 && (this.stamps.fill(0), this.query = 1);
		let f = this.query, p = this.stamps, m = this.candidates;
		m.length = 0;
		for (let e of this.always) p[e] = f, m.push(e);
		for (let e = o; e <= s; e++) for (let t = c; t <= l; t++) for (let n = u; n <= d; n++) {
			let r = this.cells.get(LightGrid.key(e, t, n));
			if (r) for (let e of r) p[e] !== f && (p[e] = f, m.push(e));
		}
		for (let e = 1; e < m.length; e++) {
			let t = m[e], n = e - 1;
			for (; n >= 0 && m[n] > t;) m[n + 1] = m[n], n--;
			m[n + 1] = t;
		}
		return !0;
	}
};
var SpatialLightSelector = class {
	pointLights = [];
	spotLights = [];
	stats = {
		draws: 0,
		points: {
			pool: 0,
			selected: 0,
			culled: 0,
			overflow: 0
		},
		spots: {
			pool: 0,
			selected: 0,
			culled: 0,
			overflow: 0
		}
	};
	frameStats = {
		draws: 0,
		points: {
			pool: 0,
			selected: 0,
			culled: 0,
			overflow: 0
		},
		spots: {
			pool: 0,
			selected: 0,
			culled: 0,
			overflow: 0
		}
	};
	pointCapacity;
	spotCapacity;
	exceedPolicy;
	scene;
	identities = /* @__PURE__ */ new Set();
	pointScores = new Float64Array(require_lights.lightSelectionLimits.pointLights);
	spotScores = new Float64Array(require_lights.lightSelectionLimits.spotLights);
	sphere = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	center = new require_math3d.Vector3();
	pointGrid = new LightGrid();
	spotGrid = new LightGrid();
	gridPass = 0;
	pointGridded = !1;
	spotGridded = !1;
	poolSnapshot = /* @__PURE__ */ new Float64Array();
	poolScene;
	poolVersion = 0;
	meshSelections = /* @__PURE__ */ new WeakMap();
	constructor(e = {}) {
		if (this.pointCapacity = capacity(e.pointLights ?? require_lights.lightSelectionLimits.pointLights, require_lights.lightSelectionLimits.pointLights), this.spotCapacity = capacity(e.spotLights ?? require_lights.lightSelectionLimits.spotLights, require_lights.lightSelectionLimits.spotLights), this.exceedPolicy = e.exceedPolicy ?? `select`, this.exceedPolicy !== `select` && this.exceedPolicy !== `error`) throw RangeError(`Light exceedPolicy must be select or error.`);
	}
	update(e) {
		this.scene = void 0, validateLightPool(e), this.identities.clear();
		for (let t of [e.pointLights, e.spotLights]) for (let e of t) {
			if (this.identities.has(e.id)) throw RangeError(`Scene light pools cannot contain duplicate light identities.`);
			this.identities.add(e.id);
		}
		this.scene = e, this.snapshotPools(e) || this.poolVersion++, this.gridPass = e.presentationPass, this.pointGridded = this.gridPass !== 0 && e.pointLights.length >= 32, this.spotGridded = this.gridPass !== 0 && e.spotLights.length >= 32, this.pointGridded && this.pointGrid.build(e.pointLights), this.spotGridded && this.spotGrid.build(e.spotLights), this.pointLights.length = this.spotLights.length = 0, this.stats.draws = this.frameStats.draws = 0;
		for (let t of [this.stats, this.frameStats]) t.points.pool = e.pointLights.length, t.spots.pool = e.spotLights.length, t.points.selected = t.points.culled = t.points.overflow = 0, t.spots.selected = t.spots.culled = t.spots.overflow = 0;
	}
	clear() {
		this.scene = void 0, this.poolScene = void 0, this.meshSelections = /* @__PURE__ */ new WeakMap(), this.pointLights.length = this.spotLights.length = 0, this.identities.clear(), this.stats.draws = this.frameStats.draws = 0, this.stats.points.pool = this.stats.points.selected = this.stats.points.culled = this.stats.points.overflow = 0, this.stats.spots.pool = this.stats.spots.selected = this.stats.spots.culled = this.stats.spots.overflow = 0, this.frameStats.points.pool = this.frameStats.points.selected = this.frameStats.points.culled = this.frameStats.points.overflow = 0, this.frameStats.spots.pool = this.frameStats.spots.selected = this.frameStats.spots.culled = this.frameStats.spots.overflow = 0;
	}
	validatedIn(e) {
		return this.scene === e && this.gridPass !== 0 && this.gridPass === e.presentationPass;
	}
	selectMesh(e) {
		if (e.getWorldBoundingSphere(this.sphere), !require_render_bounds.sphereIsFinite(this.sphere)) return this.center.set(0, 0, 0), this.select(this.center, Number.MAX_VALUE);
		let t = this.sphere, n = this.gridPass !== 0 && this.scene?.presentationPass === this.gridPass, r = n ? this.meshSelections.get(e) : void 0;
		if (r && r.version === this.poolVersion && sameNumber(r.x, t.x) && sameNumber(r.y, t.y) && sameNumber(r.z, t.z) && sameNumber(r.radius, t.radius)) {
			copyInto(this.pointLights, r.points), copyInto(this.spotLights, r.spots);
			let e = this.stats.points, t = this.stats.spots;
			return e.selected = r.points.length, e.culled = r.pointCulled, e.overflow = r.pointOverflow, t.selected = r.spots.length, t.culled = r.spotCulled, t.overflow = r.spotOverflow, this.recordDraw();
		}
		return this.center.set(t.x, t.y, t.z), this.select(this.center, t.radius), n && (r || (r = {
			version: 0,
			x: 0,
			y: 0,
			z: 0,
			radius: 0,
			points: [],
			spots: [],
			pointCulled: 0,
			pointOverflow: 0,
			spotCulled: 0,
			spotOverflow: 0
		}, this.meshSelections.set(e, r)), r.version = this.poolVersion, r.x = t.x, r.y = t.y, r.z = t.z, r.radius = t.radius, copyInto(r.points, this.pointLights), copyInto(r.spots, this.spotLights), r.pointCulled = this.stats.points.culled, r.pointOverflow = this.stats.points.overflow, r.spotCulled = this.stats.spots.culled, r.spotOverflow = this.stats.spots.overflow), this;
	}
	select(t, n) {
		if (!this.scene) throw Error(`Update the light selector before selecting a draw.`);
		if (!(t instanceof require_math3d.Vector3)) throw TypeError(`Light selection center must be a Vector3.`);
		if (!Number.isFinite(t.x) || !Number.isFinite(t.y) || !Number.isFinite(t.z) || !Number.isFinite(n) || n < 0) throw RangeError(`Light selection requires a finite world sphere with nonnegative radius.`);
		return this.selectType(this.scene.pointLights, this.pointLights, this.pointScores, this.pointCapacity, t, n, this.stats.points, this.pointGridded ? this.pointGrid : void 0), this.selectType(this.scene.spotLights, this.spotLights, this.spotScores, this.spotCapacity, t, n, this.stats.spots, this.spotGridded ? this.spotGrid : void 0), this.recordDraw();
	}
	recordDraw() {
		if (this.stats.draws = 1, this.frameStats.draws++, this.frameStats.points.selected += this.stats.points.selected, this.frameStats.points.culled += this.stats.points.culled, this.frameStats.points.overflow += this.stats.points.overflow, this.frameStats.spots.selected += this.stats.spots.selected, this.frameStats.spots.culled += this.stats.spots.culled, this.frameStats.spots.overflow += this.stats.spots.overflow, this.exceedPolicy === `error` && (this.stats.points.overflow || this.stats.spots.overflow)) throw RangeError(`Relevant lights exceed the configured per-draw light capacity.`);
		return this;
	}
	snapshotPools(e) {
		let t = e.pointLights, n = e.spotLights, r = 2 + t.length * o + n.length * s, i = this.poolSnapshot, a = this.poolScene === e && i.length === r;
		i.length !== r && (i = this.poolSnapshot = new Float64Array(r)), this.poolScene = e, a = record(i, 0, t.length) && a, a = record(i, 1, n.length) && a;
		let c = 2;
		for (let e of t) a = recordLight(i, c, e) && a, c += o;
		for (let e of n) {
			a = recordLight(i, c, e) && a;
			let t = e.direction;
			a = record(i, c + 10, t.x) && a, a = record(i, c + 11, t.y) && a, a = record(i, c + 12, t.z) && a, a = record(i, c + 13, e.innerAngle) && a, a = record(i, c + 14, e.outerAngle) && a, c += s;
		}
		return a;
	}
	selectType(e, t, n, i, o, s, c, l) {
		let u = 0;
		c.selected = c.culled = c.overflow = 0;
		let d = 0, f = l !== void 0 && this.scene.presentationPass === this.gridPass && l.gather(o.x, o.y, o.z, s) ? l.candidates : void 0, p = f ? f.length : e.length;
		f && (c.culled = e.length - p);
		for (let l = 0; l < p; l++) {
			let p = e[f ? f[l] : l], m = o.x - p.position.x, h = o.y - p.position.y, g = o.z - p.position.z, _ = p.range;
			if (_ > 0) {
				let e = _ + s;
				if (m * m + h * h + g * g > e * e * (1 + 1e-9)) {
					c.culled++;
					continue;
				}
			}
			let v = require_hypot.hypot3(m, h, g), y = Math.max(0, v - s), b = Math.max(p.color[0], p.color[1], p.color[2]);
			if (!p.intensity || !b || p.range > 0 && y >= p.range) {
				c.culled++;
				continue;
			}
			let x = 1;
			if (p instanceof require_lights$1.SpotLight && v > s) {
				let e = p.direction.length(), t = (m * p.direction.x + h * p.direction.y + g * p.direction.z) / (v * e), n = Math.max(0, Math.acos(Math.max(-1, Math.min(1, t))) - Math.asin(Math.min(1, s / v)));
				if (n >= p.outerAngle) {
					c.culled++;
					continue;
				}
				let r = Math.max(0, Math.min(1, (Math.cos(n) - Math.cos(p.outerAngle)) / (Math.cos(p.innerAngle) - Math.cos(p.outerAngle))));
				x = r * r * (3 - 2 * r);
			}
			let S = p.range > 0 ? Math.max(0, 1 - (y / p.range) ** 4) ** 2 : 1, C = b * p.intensity * x * S / Math.max(y * y, .01);
			d++;
			let w = 0;
			for (; w < u && (t[w].priority > p.priority || t[w].priority === p.priority && (n[w] > C || n[w] === C && t[w].id < p.id));) w++;
			if (w >= i) continue;
			let T = Math.min(u, i - 1);
			for (let e = T; e > w; e--) t[e] = t[e - 1], n[e] = n[e - 1];
			t[w] = p, n[w] = C, u < i && u++;
		}
		t.length !== u && (t.length = u), c.selected = u, c.overflow = d - u;
	}
};
var o = 10;
var s = 15;
function sameNumber(e, t) {
	return e === t && (e !== 0 || 1 / e == 1 / t);
}
function record(e, t, n) {
	let r = e[t];
	return e[t] = n, sameNumber(r, n);
}
function recordLight(e, t, n) {
	let r = record(e, t, n.id);
	return r = record(e, t + 1, n.position.x) && r, r = record(e, t + 2, n.position.y) && r, r = record(e, t + 3, n.position.z) && r, r = record(e, t + 4, n.range) && r, r = record(e, t + 5, n.intensity) && r, r = record(e, t + 6, n.color[0]) && r, r = record(e, t + 7, n.color[1]) && r, r = record(e, t + 8, n.color[2]) && r, record(e, t + 9, n.priority) && r;
}
function copyInto(e, t) {
	for (let n = 0; n < t.length; n++) e[n] = t[n];
	e.length !== t.length && (e.length = t.length);
}
//#endregion
exports.SpatialLightSelector = SpatialLightSelector;
exports.validateLightPool = validateLightPool;

//# sourceMappingURL=light-selection.cjs.map