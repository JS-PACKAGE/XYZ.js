const require_hypot = require("../../../math/src/hypot.cjs");
const require_math3d = require("../../../math/src/math3d.cjs");
const require_navigation = require("../../../../src/data/navigation.cjs");
const require_partition_search = require("./partition-search.cjs");
//#region dist/packages/core/src/navigation/mesh.js
var o = 1e-7;
var NavigationMesh3D = class {
	polygons;
	tileSize;
	geometry = [];
	regions = [];
	ids = /* @__PURE__ */ new Map();
	tiles = /* @__PURE__ */ new Map();
	vertexTopology = /* @__PURE__ */ new Map();
	jobs = /* @__PURE__ */ new Set();
	paths = /* @__PURE__ */ new WeakSet();
	epoch = 0;
	disposed = !1;
	disabled = /* @__PURE__ */ new Set();
	linkIds = /* @__PURE__ */ new Set();
	disabledLinks = /* @__PURE__ */ new Set();
	constructor(n) {
		if (this.tileSize = n.tileSize ?? require_navigation.navigationLimits.meshTileSize, !Number.isFinite(this.tileSize) || this.tileSize <= 0 || this.tileSize > require_navigation.navigationLimits.coordinateExtent || n.polygons.length === 0 || n.polygons.length > require_navigation.navigationLimits.meshPolygons || (n.links?.length ?? 0) > require_navigation.navigationLimits.partitionSeams) throw RangeError(`Invalid bounded navigation mesh.`);
		let r = /* @__PURE__ */ new Map();
		for (let i of n.polygons) {
			if (typeof i.id != `string` || !i.id || i.id.length > require_navigation.navigationLimits.nodeIdLength || this.ids.has(i.id) || i.vertices.length < 3 || i.vertices.length > require_navigation.navigationLimits.meshVertices || !Number.isFinite(i.clearanceHeight) || i.clearanceHeight < 0 || i.clearanceHeight > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Invalid polygon ID, vertex count or headroom.`);
			let n = i.vertices.map((t) => (validatePoint(t), new require_math3d.Vector3(t.x, t.y, t.z))), a = 0;
			for (let e = 1; e + 1 < n.length; e++) a += cross(n[0], n[e], n[e + 1]);
			if (Math.abs(a) < o) throw RangeError(`Degenerate navigation polygon.`);
			a < 0 && (n = n.reverse());
			let s = n[0], c = n[1], l = n[2], u = cross(s, c, l);
			if (u <= o) throw RangeError(`Navigation polygons require strict convexity.`);
			let d = ((c.y - s.y) * (l.z - s.z) - (l.y - s.y) * (c.z - s.z)) / u, f = ((c.x - s.x) * (l.y - s.y) - (l.x - s.x) * (c.y - s.y)) / u, p = s.y - d * s.x - f * s.z;
			for (let e = 0; e < n.length; e++) {
				let t = n[e];
				if (cross(t, n[(e + 1) % n.length], n[(e + 2) % n.length]) <= o || n.some((r) => cross(t, n[(e + 1) % n.length], r) < -1e-7) || Math.abs(t.y - (p + d * t.x + f * t.z)) > o) throw RangeError(`Navigation polygons must be strictly convex and coplanar.`);
			}
			let m = Object.freeze({
				id: i.id,
				clearanceHeight: i.clearanceHeight,
				vertices: Object.freeze(n.map((e) => Object.freeze(e)))
			}), h = new require_math3d.Vector3();
			for (let e of n) h.x += e.x, h.y += e.y, h.z += e.z;
			h.x /= n.length, h.y /= n.length, h.z /= n.length;
			let g = this.geometry.length;
			this.ids.set(m.id, g);
			let _ = {
				surface: m,
				center: h,
				dx: d,
				dz: f,
				base: p,
				edges: [],
				walls: n.map(() => !0)
			};
			this.geometry.push(_);
			for (let e = 0; e < n.length; e++) for (let r of [n[e], n[(e + 1) % n.length]]) {
				let n = `${r.x},${r.y},${r.z}`, i = this.vertexTopology.get(n) ?? [];
				if (i.length >= require_navigation.navigationLimits.meshVertexEdges) throw RangeError(`Nonmanifold navigation vertex exceeds the edge budget.`);
				i.push({
					polygon: _,
					edge: e
				}), this.vertexTopology.set(n, i);
			}
			let v = Math.floor(Math.min(...n.map((e) => e.x)) / this.tileSize), y = Math.floor(Math.max(...n.map((e) => e.x)) / this.tileSize), b = Math.floor(Math.min(...n.map((e) => e.z)) / this.tileSize), x = Math.floor(Math.max(...n.map((e) => e.z)) / this.tileSize);
			if (![
				v,
				y,
				b,
				x
			].every(Number.isSafeInteger)) throw RangeError(`Navigation tile coordinates must be safe integers.`);
			if ((y - v + 1) * (x - b + 1) > require_navigation.navigationLimits.meshTilesPerPolygon) throw RangeError(`Polygon spans too many spatial tiles; subdivide it.`);
			for (let e = v; e <= y; e++) {
				let n = this.tiles.get(e);
				n || (n = /* @__PURE__ */ new Map(), this.tiles.set(e, n));
				for (let e = b; e <= x; e++) {
					let r = n.get(e) ?? [];
					if (r.length >= require_navigation.navigationLimits.meshTilePolygons) throw RangeError(`Navigation tile polygon budget exceeded; reduce tileSize.`);
					r.push(g), n.set(e, r);
				}
			}
			for (let e = 0; e < n.length; e++) {
				let t = n[e], i = n[(e + 1) % n.length], a = `${t.x},${t.y},${t.z}`, o = `${i.x},${i.y},${i.z}`, s = a < o ? `${a}/${o}` : `${o}/${a}`, c = r.get(s);
				if (!c) r.set(s, {
					polygon: g,
					edge: e,
					joined: !1
				});
				else {
					let n = this.geometry[c.polygon];
					if (c.joined || !same(n.surface.vertices[c.edge], i)) throw RangeError(`Nonmanifold or overlapping shared navigation edge.`);
					c.joined = !0, _.walls[e] = !1, n.walls[c.edge] = !1, _.edges.push({
						to: c.polygon,
						a: t,
						b: i
					}), n.edges.push({
						to: g,
						a: i,
						b: t
					});
				}
			}
		}
		this.polygons = Object.freeze(this.geometry.map((e) => e.surface));
		let i = this.linkIds;
		for (let r of n.links ?? []) {
			let n = this.ids.get(r.from), a = this.ids.get(r.to);
			if (validatePoint(r.start), validatePoint(r.end), n === void 0 || a === void 0 || n === a || typeof r.id != `string` || !r.id || r.id.length > require_navigation.navigationLimits.nodeIdLength || i.has(r.id) || !Number.isFinite(r.clearance) || r.clearance < 0 || r.clearance > require_navigation.navigationLimits.coordinateExtent || r.directed !== void 0 && typeof r.directed != `boolean` || !inside(this.geometry[n].surface.vertices, r.start) || !inside(this.geometry[a].surface.vertices, r.end) || Math.abs(r.start.y - height(this.geometry[n], r.start)) > o || Math.abs(r.end.y - height(this.geometry[a], r.end)) > o) throw RangeError(`Invalid explicit navigation mesh link.`);
			i.add(r.id);
			let s = Object.freeze({
				...r,
				start: Object.freeze(new require_math3d.Vector3(r.start.x, r.start.y, r.start.z)),
				end: Object.freeze(new require_math3d.Vector3(r.end.x, r.end.y, r.end.z))
			});
			if (this.geometry[n].edges.push({
				to: a,
				a: s.start,
				b: s.end,
				link: s
			}), !r.directed) {
				let e = Object.freeze({
					...s,
					from: s.to,
					to: s.from,
					start: s.end,
					end: s.start
				});
				this.geometry[a].edges.push({
					to: n,
					a: e.start,
					b: e.end,
					link: e
				});
			}
		}
		for (let e of this.geometry) {
			if (e.edges.length > require_navigation.navigationLimits.meshVertices + require_navigation.navigationLimits.meshLinksPerPolygon) throw RangeError(`Too many links on one navigation polygon.`);
			e.edges.sort((e, t) => e.to - t.to);
		}
	}
	get revision() {
		return this.epoch;
	}
	get destroyed() {
		return this.disposed;
	}
	get availableSearchSlots() {
		return this.disposed ? 0 : require_navigation.navigationLimits.concurrentSearches - this.jobs.size;
	}
	isPathCurrent(e) {
		return !this.disposed && e.revision === this.epoch && this.paths.has(e);
	}
	setPolygonEnabled(e, t) {
		if (this.assertLive(), !this.ids.has(e) || typeof t != `boolean`) throw RangeError(`Unknown polygon or invalid enabled state.`);
		if (this.disabled.has(e) !== !t) {
			t ? this.disabled.delete(e) : this.disabled.add(e), this.epoch++;
			for (let e of this.jobs) e.invalidate();
		}
	}
	setLinkEnabled(e, t) {
		if (this.assertLive(), !this.linkIds.has(e) || typeof t != `boolean`) throw RangeError(`Unknown link or invalid enabled state.`);
		if (this.disabledLinks.has(e) !== !t) {
			t ? this.disabledLinks.delete(e) : this.disabledLinks.add(e), this.epoch++;
			for (let e of this.jobs) e.invalidate();
		}
	}
	project(t, n) {
		this.assertLive(), this.validateQuery(t, n);
		let r, i = 0, o;
		for (let s of this.candidates(t, n.maxDistance)) {
			if (s < 0) continue;
			i++;
			let c = this.geometry[s];
			if (this.disabled.has(c.surface.id) || c.surface.clearanceHeight < n.agentHeight) continue;
			let l = nearest(c, this.region(s, n.agentRadius ?? 0).vertices, t, o ??= new require_math3d.Vector3());
			if (!l || Math.abs(l.y - t.y) > n.maxVerticalDistance) continue;
			let u = require_hypot.hypot3(l.x - t.x, l.y - t.y, l.z - t.z);
			u <= n.maxDistance && (!r || u < r.distance) && (r = {
				polygon: c.surface,
				position: Object.freeze(l.clone()),
				distance: u,
				revision: this.epoch,
				candidates: i
			});
		}
		return r && Object.freeze({
			...r,
			candidates: i
		});
	}
	scheduleSearch(t, n, r, i) {
		this.assertLive(), this.validateQuery(n, i), this.validateQuery(r, i);
		let a = new require_math3d.Vector3(n.x, n.y, n.z), o = new require_math3d.Vector3(r.x, r.y, r.z), s = { ...i };
		return t.schedule(this, () => this.createSearch(a, o, s));
	}
	findPath(e, n, r) {
		let i = this.createSearch(e, n, r);
		for (; i.status === `pending`;) i.step(require_navigation.navigationLimits.expansionsPerStep);
		return i.result;
	}
	createSearch(t, i, s) {
		if (this.assertLive(), this.validateQuery(t, s), this.validateQuery(i, s), this.availableSearchSlots === 0) throw RangeError(`Navigation concurrent search budget exhausted.`);
		t = new require_math3d.Vector3(t.x, t.y, t.z), i = new require_math3d.Vector3(i.x, i.y, i.z), s = { ...s };
		let c = this.epoch, l = s.agentRadius ?? 0, u = new require_partition_search.PartitionSearch(), d = l === 0 ? void 0 : /* @__PURE__ */ new Map(), region = (e) => {
			if (!d) return this.geometry[e].surface;
			let t = d.get(e);
			return t || (t = this.region(e, l), d.set(e, t)), t;
		}, f = [this.candidates(t, s.maxDistance), this.candidates(i, s.maxDistance)], p, m = [], h = /* @__PURE__ */ new Map(), g = [], _ = [], v = [], y = [], b = [], x = [], S = `projection`, C = 0, w = 0, T = -1, E = 0, D = 0, O = 0, k = !1, A = 0, resetCandidate = () => {
			if (A <= E) for (A = E + 1; A < v.length && !v[A].link;) A++;
			D = A - 1;
		}, publish = () => {
			let e = Object.freeze({
				status: k ? `found` : `unreachable`,
				polygons: Object.freeze(b),
				waypoints: Object.freeze(x),
				cost: k ? u.distance.get(m[1].index) : 1 / 0,
				revision: c,
				visited: u.distance.size
			});
			return this.paths.add(e), e;
		}, j = new require_partition_search.PartitionNavigationJob(() => {
			if (S === `projection`) {
				let n = f[C].next();
				if (!n.done) {
					if (n.value < 0) return;
					let r = n.value, o = this.geometry[r];
					if (!this.disabled.has(o.surface.id) && o.surface.clearanceHeight >= s.agentHeight) {
						let n = C === 0 ? t : i, c = nearest(o, region(r).vertices, n, p ??= new require_math3d.Vector3());
						if (c && Math.abs(c.y - n.y) <= s.maxVerticalDistance) {
							let e = require_hypot.hypot3(c.x - n.x, c.y - n.y, c.z - n.z);
							e <= s.maxDistance && (!m[C] || e < m[C].distance) && (m[C] = {
								index: r,
								point: c.clone(),
								distance: e
							});
						}
					}
					return;
				}
				if (++C === 2) {
					if (!m[0] || !m[1]) {
						S = `publish`;
						return;
					}
					u.offer(m[0].index, 0, 0, -1), S = `search`;
				}
			} else if (S === `search`) {
				let e = u.take();
				if (e === void 0) {
					S = `publish`;
					return;
				}
				if (e === m[1].index) {
					T = e, S = `backtrack`;
					return;
				}
				let t = this.geometry[e];
				for (let n of t.edges) {
					let r = this.geometry[n.to];
					if (this.disabled.has(r.surface.id) || r.surface.clearanceHeight < s.agentHeight || region(n.to).vertices.length === 0 || !this.portal(n, region(e), region(n.to), l)) continue;
					let i = u.distance.get(e) + require_hypot.hypot3(r.center.x - t.center.x, r.center.y - t.center.y, r.center.z - t.center.z);
					i >= (u.distance.get(n.to) ?? 1 / 0) || (h.set(n.to, n), u.offer(n.to, i, i, e));
				}
			} else if (S === `backtrack`) T >= 0 ? (g.push(T), T = u.parent.get(T)) : (w = g.length - 1, S = `corridor`);
			else if (S === `corridor`) {
				if (w >= 0) {
					let t = g[w--];
					if (_.push(t), b.push(this.geometry[t].surface), _.length === 1) v.push(Object.freeze({ position: Object.freeze(m[0].point) })), y.push(0);
					else {
						let n = h.get(t), r = _[_.length - 2];
						if (n.link) v.push(Object.freeze({ position: n.a })), y.push(_.length - 2), v.push(Object.freeze({
							position: n.b,
							link: n.link
						})), y.push(_.length - 1);
						else {
							let i = this.portal(n, region(r), region(t), l);
							v.push(Object.freeze({ position: Object.freeze(new require_math3d.Vector3((i[0].x + i[1].x) / 2, (i[0].y + i[1].y) / 2, (i[0].z + i[1].z) / 2)) })), y.push(_.length - 1);
						}
					}
				} else v.push(Object.freeze({ position: Object.freeze(m[1].point) })), y.push(_.length - 1), x.push(v[0]), E = 0, resetCandidate(), O = y[0], S = `smooth`;
			} else if (S === `smooth`) {
				if (E === v.length - 1) {
					k = !0, S = `publish`;
					return;
				}
				if (v[E + 1].link) {
					x.push(v[++E]), resetCandidate(), O = y[E];
					return;
				}
				if (D <= E + 1) {
					x.push(v[++E]), resetCandidate(), O = y[E];
					return;
				}
				let e = v[E].position, t = v[D].position, n = y[E], r = y[D], i = _[O], a = this.geometry[i], s = !v[D].link;
				O > n && h.get(i)?.link && (s = !1);
				let c = clipSegment(region(i).vertices, e, t);
				if (!c) s = !1;
				else {
					for (let n of c) {
						let r = e.x + (t.x - e.x) * n, i = e.z + (t.z - e.z) * n;
						Math.abs(e.y + (t.y - e.y) * n - (a.base + a.dx * r + a.dz * i)) > o && (s = !1);
					}
					O === n && c[0] > o && (s = !1), O === r && c[1] < .9999999 && (s = !1);
					let u = c[0];
					if (O > n) {
						let n = h.get(i);
						if (n.link) s = !1;
						else {
							let r = this.portal(n, region(_[O - 1]), region(i), l), a = segmentCrossing(e, t, r[0], r[1]);
							a === void 0 || a < c[0] - o || a > c[1] + o ? s = !1 : u = a;
						}
					}
					if (O < r) {
						let n = h.get(_[O + 1]);
						if (n.link) s = !1;
						else {
							let r = this.portal(n, region(i), region(n.to), l), a = segmentCrossing(e, t, r[0], r[1]);
							(a === void 0 || a < u - o || a > c[1] + o) && (s = !1);
						}
					}
				}
				s ? ++O > r && (x.push(v[D]), E = D, resetCandidate(), O = y[E]) : (D--, O = n);
			} else return publish();
		}, () => !this.disposed && c === this.epoch, () => this.jobs.delete(j), (e) => e.status === `found`);
		return this.jobs.add(j), j;
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			for (let e of this.jobs) e.cancel();
			this.tiles.clear(), this.regions.length = 0;
		}
	}
	assertLive() {
		if (this.disposed) throw Error(`Navigation mesh is destroyed.`);
	}
	validateQuery(e, n) {
		if (validatePoint(e), ![
			n.maxDistance,
			n.maxVerticalDistance,
			n.agentRadius ?? 0,
			n.agentHeight
		].every((e) => Number.isFinite(e) && e >= 0 && e <= require_navigation.navigationLimits.coordinateExtent)) throw RangeError(`Mesh projection requires finite distance, radius and height bounds.`);
		let r = Math.ceil(2 * n.maxDistance / this.tileSize) + 2;
		if (r * r > require_navigation.navigationLimits.projectionTiles) throw RangeError(`Projection spans too many tiles; use a local query.`);
		if (![
			Math.floor((e.x - n.maxDistance) / this.tileSize),
			Math.floor((e.x + n.maxDistance) / this.tileSize),
			Math.floor((e.z - n.maxDistance) / this.tileSize),
			Math.floor((e.z + n.maxDistance) / this.tileSize)
		].every(Number.isSafeInteger)) throw RangeError(`Mesh projection tile coordinates must be safe integers.`);
	}
	*candidates(e, t) {
		let n = /* @__PURE__ */ new Map();
		for (let r = Math.floor((e.x - t) / this.tileSize); r <= Math.floor((e.x + t) / this.tileSize); r++) for (let i = Math.floor((e.z - t) / this.tileSize); i <= Math.floor((e.z + t) / this.tileSize); i++) {
			yield -1;
			for (let e of this.tiles.get(r)?.get(i) ?? []) {
				let t = e >>> 5, r = 1 << (e & 31), i = n.get(t) ?? 0;
				(i & r) === 0 ? (n.set(t, i | r), yield e) : yield -1;
			}
		}
	}
	region(e, t) {
		let n = this.geometry[e];
		if (t === 0) return n.surface;
		let r = this.regions[e];
		if (r && r.radius === t && r.epoch === this.epoch) return r.region;
		let i = this.clipRegion(n, t);
		return this.regions[e] = {
			radius: t,
			epoch: this.epoch,
			region: i
		}, i;
	}
	clipRegion(t, n) {
		let r = t.surface.vertices;
		for (let e = 0; e < t.surface.vertices.length && r.length > 0; e++) {
			let i = t.surface.vertices[e], a = t.surface.vertices[(e + 1) % t.surface.vertices.length];
			(t.walls[e] || !t.edges.some((e) => !e.link && same(e.a, i) && same(e.b, a) && !this.disabled.has(this.geometry[e.to].surface.id))) && (r = clipPolygon(r, i, a, n));
		}
		for (let a of t.surface.vertices) {
			if (!this.vertexTopology.get(`${a.x},${a.y},${a.z}`).some(({ polygon: e, edge: t }) => {
				if (this.disabled.has(e.surface.id)) return !1;
				let n = e.surface.vertices[t], r = e.surface.vertices[(t + 1) % e.surface.vertices.length];
				return e.walls[t] || !e.edges.some((e) => !e.link && same(e.a, n) && same(e.b, r) && !this.disabled.has(this.geometry[e.to].surface.id));
			})) continue;
			let o = t.center.x - a.x, s = t.center.z - a.z, c = require_hypot.hypot2(o, s);
			r = clipPolygon(r, a, new require_math3d.Vector3(a.x + s / c, a.y, a.z - o / c), n);
		}
		return { vertices: r };
	}
	portal(e, t, n, r) {
		if (e.link) return !this.disabledLinks.has(e.link.id) && e.link.clearance >= r && inside(t.vertices, e.a) && inside(n.vertices, e.b) ? [e.a, e.b] : void 0;
		let i = e.portal;
		if (i && i.from === t && i.to === n && i.radius === r) return i.value;
		let a = clipPortal(e, t, n, r);
		return e.portal = {
			from: t,
			to: n,
			radius: r,
			value: a
		}, a;
	}
};
function clipPortal(t, n, r, a) {
	let s = require_hypot.hypot2(t.b.x - t.a.x, t.b.z - t.a.z);
	if (s <= 2 * a + o) return;
	let c = clipSegment(n.vertices, t.a, t.b), l = clipSegment(r.vertices, t.a, t.b);
	if (!c || !l) return;
	let u = Math.max(a / s, c[0], l[0]), d = Math.min(1 - a / s, c[1], l[1]);
	if (!(u > d - o)) return [new require_math3d.Vector3(t.a.x + (t.b.x - t.a.x) * u, t.a.y + (t.b.y - t.a.y) * u, t.a.z + (t.b.z - t.a.z) * u), new require_math3d.Vector3(t.a.x + (t.b.x - t.a.x) * d, t.a.y + (t.b.y - t.a.y) * d, t.a.z + (t.b.z - t.a.z) * d)];
}
function validatePoint(e) {
	if (![
		e.x,
		e.y,
		e.z
	].every((e) => Number.isFinite(e) && Math.abs(e) <= require_navigation.navigationLimits.coordinateExtent)) throw RangeError(`Navigation mesh coordinates exceed finite bounds.`);
}
function cross(e, t, n) {
	return (t.x - e.x) * (n.z - e.z) - (t.z - e.z) * (n.x - e.x);
}
function same(e, t) {
	return e.x === t.x && e.y === t.y && e.z === t.z;
}
function height(e, t) {
	return e.base + e.dx * t.x + e.dz * t.z;
}
function inside(e, t) {
	if (e.length < 3) return !1;
	for (let n = 0; n < e.length; n++) if (!(cross(e[n], e[(n + 1) % e.length], t) >= -1e-7)) return !1;
	return !0;
}
function clipPolygon(t, n, r, a) {
	let o = [], s = a * require_hypot.hypot2(r.x - n.x, r.z - n.z);
	for (let i = 0; i < t.length; i++) {
		let a = t[i], c = t[(i + 1) % t.length], l = cross(n, r, a) - s, u = cross(n, r, c) - s;
		if (l >= -1e-7 && o.push(new require_math3d.Vector3(a.x, a.y, a.z)), l >= 0 != u >= 0) {
			let t = l / (l - u);
			o.push(new require_math3d.Vector3(a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t, a.z + (c.z - a.z) * t));
		}
	}
	return o;
}
function clipSegment(e, t, n) {
	if (e.length < 3) return;
	let r = 0, i = 1;
	for (let a = 0; a < e.length; a++) {
		let o = e[a], s = e[(a + 1) % e.length], c = cross(o, s, t), l = cross(o, s, n);
		if (c < -1e-7 && l < -1e-7) return;
		if (c < 0 != l < 0) {
			let e = c / (c - l);
			c < 0 ? r = Math.max(r, e) : i = Math.min(i, e);
		}
	}
	return r <= i + o ? [r, i] : void 0;
}
function nearest(e, t, n, r) {
	if (t.length < 3) return;
	let i = (n.y - height(e, n)) / (1 + e.dx * e.dx + e.dz * e.dz), o = r.set(n.x + e.dx * i, n.y - i, n.z + e.dz * i);
	if (inside(t, o)) return o;
	let s = !1, c = 0, l = 0, u = 0, d = 1 / 0;
	for (let e = 0; e < t.length; e++) {
		let r = t[e], i = t[(e + 1) % t.length], o = i.x - r.x, f = i.y - r.y, p = i.z - r.z, m = Math.max(0, Math.min(1, ((n.x - r.x) * o + (n.y - r.y) * f + (n.z - r.z) * p) / (o * o + f * f + p * p))), h = r.x + o * m, g = r.y + f * m, _ = r.z + p * m, v = h - n.x, y = g - n.y, b = _ - n.z;
		if (Math.abs(v) > d || Math.abs(y) > d || Math.abs(b) > d) continue;
		let x = require_hypot.hypot3(v, y, b);
		x < d && (d = x, s = !0, c = h, l = g, u = _);
	}
	return s ? r.set(c, l, u) : void 0;
}
function segmentCrossing(e, t, n, r) {
	let i = t.x - e.x, a = t.z - e.z, s = r.x - n.x, c = r.z - n.z, l = i * c - a * s;
	if (Math.abs(l) < o) return;
	let u = ((n.x - e.x) * c - (n.z - e.z) * s) / l, d = ((n.x - e.x) * a - (n.z - e.z) * i) / l;
	return u >= -1e-7 && u <= 1.0000001 && d >= -1e-7 && d <= 1.0000001 ? u : void 0;
}
//#endregion
exports.NavigationMesh3D = NavigationMesh3D;

//# sourceMappingURL=mesh.cjs.map