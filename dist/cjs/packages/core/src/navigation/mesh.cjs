const require_math3d = require("../../../math/src/math3d.cjs");
const require_navigation = require("../../../../src/data/navigation.cjs");
const require_partition_search = require("./partition-search.cjs");
//#region dist/packages/core/src/navigation/mesh.js
var i = 1e-7;
var NavigationMesh3D = class {
	polygons;
	tileSize;
	geometry = [];
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
		for (let a of n.polygons) {
			if (typeof a.id != `string` || !a.id || a.id.length > require_navigation.navigationLimits.nodeIdLength || this.ids.has(a.id) || a.vertices.length < 3 || a.vertices.length > require_navigation.navigationLimits.meshVertices || !Number.isFinite(a.clearanceHeight) || a.clearanceHeight < 0 || a.clearanceHeight > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Invalid polygon ID, vertex count or headroom.`);
			let n = a.vertices.map((t) => (validatePoint(t), new require_math3d.Vector3(t.x, t.y, t.z))), o = 0;
			for (let e = 1; e + 1 < n.length; e++) o += cross(n[0], n[e], n[e + 1]);
			if (Math.abs(o) < i) throw RangeError(`Degenerate navigation polygon.`);
			o < 0 && (n = n.reverse());
			let s = n[0], c = n[1], l = n[2], u = cross(s, c, l);
			if (u <= i) throw RangeError(`Navigation polygons require strict convexity.`);
			let d = ((c.y - s.y) * (l.z - s.z) - (l.y - s.y) * (c.z - s.z)) / u, f = ((c.x - s.x) * (l.y - s.y) - (l.x - s.x) * (c.y - s.y)) / u, p = s.y - d * s.x - f * s.z;
			for (let e = 0; e < n.length; e++) {
				let t = n[e];
				if (cross(t, n[(e + 1) % n.length], n[(e + 2) % n.length]) <= i || n.some((r) => cross(t, n[(e + 1) % n.length], r) < -1e-7) || Math.abs(t.y - (p + d * t.x + f * t.z)) > i) throw RangeError(`Navigation polygons must be strictly convex and coplanar.`);
			}
			let m = Object.freeze({
				id: a.id,
				clearanceHeight: a.clearanceHeight,
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
			for (let e = v; e <= y; e++) for (let n = b; n <= x; n++) {
				let r = `${e}:${n}`, i = this.tiles.get(r) ?? [];
				if (i.length >= require_navigation.navigationLimits.meshTilePolygons) throw RangeError(`Navigation tile polygon budget exceeded; reduce tileSize.`);
				i.push(g), this.tiles.set(r, i);
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
		let a = this.linkIds;
		for (let r of n.links ?? []) {
			let n = this.ids.get(r.from), o = this.ids.get(r.to);
			if (validatePoint(r.start), validatePoint(r.end), n === void 0 || o === void 0 || n === o || typeof r.id != `string` || !r.id || r.id.length > require_navigation.navigationLimits.nodeIdLength || a.has(r.id) || !Number.isFinite(r.clearance) || r.clearance < 0 || r.clearance > require_navigation.navigationLimits.coordinateExtent || r.directed !== void 0 && typeof r.directed != `boolean` || !inside(this.geometry[n].surface.vertices, r.start) || !inside(this.geometry[o].surface.vertices, r.end) || Math.abs(r.start.y - height(this.geometry[n], r.start)) > i || Math.abs(r.end.y - height(this.geometry[o], r.end)) > i) throw RangeError(`Invalid explicit navigation mesh link.`);
			a.add(r.id);
			let s = Object.freeze({
				...r,
				start: Object.freeze(new require_math3d.Vector3(r.start.x, r.start.y, r.start.z)),
				end: Object.freeze(new require_math3d.Vector3(r.end.x, r.end.y, r.end.z))
			});
			if (this.geometry[n].edges.push({
				to: o,
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
				this.geometry[o].edges.push({
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
	project(e, t) {
		this.assertLive(), this.validateQuery(e, t);
		let n, r = 0;
		for (let i of this.candidates(e, t.maxDistance)) {
			if (i < 0) continue;
			r++;
			let a = this.geometry[i];
			if (this.disabled.has(a.surface.id) || a.surface.clearanceHeight < t.agentHeight) continue;
			let o = nearest(a, this.region(i, t.agentRadius ?? 0).vertices, e);
			if (!o || Math.abs(o.y - e.y) > t.maxVerticalDistance) continue;
			let s = Math.hypot(o.x - e.x, o.y - e.y, o.z - e.z);
			s <= t.maxDistance && (!n || s < n.distance) && (n = {
				polygon: a.surface,
				position: Object.freeze(o),
				distance: s,
				revision: this.epoch,
				candidates: r
			});
		}
		return n && Object.freeze({
			...n,
			candidates: r
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
	createSearch(t, a, o) {
		if (this.assertLive(), this.validateQuery(t, o), this.validateQuery(a, o), this.availableSearchSlots === 0) throw RangeError(`Navigation concurrent search budget exhausted.`);
		t = new require_math3d.Vector3(t.x, t.y, t.z), a = new require_math3d.Vector3(a.x, a.y, a.z), o = { ...o };
		let s = this.epoch, c = o.agentRadius ?? 0, l = new require_partition_search.PartitionSearch(), u = /* @__PURE__ */ new Map(), region = (e) => {
			let t = u.get(e);
			return t || (t = this.region(e, c), u.set(e, t)), t;
		}, d = [this.candidates(t, o.maxDistance), this.candidates(a, o.maxDistance)], f = [], p = /* @__PURE__ */ new Map(), m = [], h = [], g = [], _ = [], v = [], y = [], b = `projection`, x = 0, S = 0, C = -1, w = 0, T = 0, E = 0, D = !1, publish = () => {
			let e = Object.freeze({
				status: D ? `found` : `unreachable`,
				polygons: Object.freeze(v),
				waypoints: Object.freeze(y),
				cost: D ? l.distance.get(f[1].index) : 1 / 0,
				revision: s,
				visited: l.distance.size
			});
			return this.paths.add(e), e;
		}, O = new require_partition_search.PartitionNavigationJob(() => {
			if (b === `projection`) {
				let e = d[x].next();
				if (!e.done) {
					if (e.value < 0) return;
					let n = e.value, r = this.geometry[n];
					if (!this.disabled.has(r.surface.id) && r.surface.clearanceHeight >= o.agentHeight) {
						let e = x === 0 ? t : a, i = nearest(r, region(n).vertices, e);
						if (i && Math.abs(i.y - e.y) <= o.maxVerticalDistance) {
							let t = Math.hypot(i.x - e.x, i.y - e.y, i.z - e.z);
							t <= o.maxDistance && (!f[x] || t < f[x].distance) && (f[x] = {
								index: n,
								point: i,
								distance: t
							});
						}
					}
					return;
				}
				if (++x === 2) {
					if (!f[0] || !f[1]) {
						b = `publish`;
						return;
					}
					l.offer(f[0].index, 0, 0, -1), b = `search`;
				}
			} else if (b === `search`) {
				let e = l.take();
				if (e === void 0) {
					b = `publish`;
					return;
				}
				if (e === f[1].index) {
					C = e, b = `backtrack`;
					return;
				}
				let t = this.geometry[e];
				for (let n of t.edges) {
					let r = this.geometry[n.to];
					if (this.disabled.has(r.surface.id) || r.surface.clearanceHeight < o.agentHeight || region(n.to).vertices.length === 0 || !this.portal(n, region(e), region(n.to), c)) continue;
					let i = l.distance.get(e) + Math.hypot(r.center.x - t.center.x, r.center.y - t.center.y, r.center.z - t.center.z);
					i >= (l.distance.get(n.to) ?? 1 / 0) || (p.set(n.to, n), l.offer(n.to, i, i, e));
				}
			} else if (b === `backtrack`) C >= 0 ? (m.push(C), C = l.parent.get(C)) : (S = m.length - 1, b = `corridor`);
			else if (b === `corridor`) {
				if (S >= 0) {
					let t = m[S--];
					if (h.push(t), v.push(this.geometry[t].surface), h.length === 1) g.push(Object.freeze({ position: Object.freeze(f[0].point) })), _.push(0);
					else {
						let n = p.get(t), r = h[h.length - 2];
						if (n.link) g.push(Object.freeze({ position: n.a })), _.push(h.length - 2), g.push(Object.freeze({
							position: n.b,
							link: n.link
						})), _.push(h.length - 1);
						else {
							let i = this.portal(n, region(r), region(t), c);
							g.push(Object.freeze({ position: Object.freeze(new require_math3d.Vector3((i[0].x + i[1].x) / 2, (i[0].y + i[1].y) / 2, (i[0].z + i[1].z) / 2)) })), _.push(h.length - 1);
						}
					}
				} else g.push(Object.freeze({ position: Object.freeze(f[1].point) })), _.push(h.length - 1), y.push(g[0]), w = 0, T = g.length - 1, E = _[0], b = `smooth`;
			} else if (b === `smooth`) {
				if (w === g.length - 1) {
					D = !0, b = `publish`;
					return;
				}
				if (g[w + 1].link) {
					y.push(g[++w]), T = g.length - 1, E = _[w];
					return;
				}
				if (T <= w + 1) {
					y.push(g[++w]), T = g.length - 1, E = _[w];
					return;
				}
				let e = g[w].position, t = g[T].position, n = _[w], r = _[T], a = h[E], o = this.geometry[a], s = !g[T].link;
				E > n && p.get(a)?.link && (s = !1);
				let l = clipSegment(region(a).vertices, e, t);
				if (!l) s = !1;
				else {
					for (let n of l) {
						let r = e.x + (t.x - e.x) * n, a = e.z + (t.z - e.z) * n;
						Math.abs(e.y + (t.y - e.y) * n - (o.base + o.dx * r + o.dz * a)) > i && (s = !1);
					}
					E === n && l[0] > i && (s = !1), E === r && l[1] < .9999999 && (s = !1);
					let u = l[0];
					if (E > n) {
						let n = p.get(a);
						if (n.link) s = !1;
						else {
							let r = this.portal(n, region(h[E - 1]), region(a), c), o = segmentCrossing(e, t, r[0], r[1]);
							o === void 0 || o < l[0] - i || o > l[1] + i ? s = !1 : u = o;
						}
					}
					if (E < r) {
						let n = p.get(h[E + 1]);
						if (n.link) s = !1;
						else {
							let r = this.portal(n, region(a), region(n.to), c), o = segmentCrossing(e, t, r[0], r[1]);
							(o === void 0 || o < u - i || o > l[1] + i) && (s = !1);
						}
					}
				}
				s ? ++E > r && (y.push(g[T]), w = T, T = g.length - 1, E = _[w]) : (T--, E = n);
			} else return publish();
		}, () => !this.disposed && s === this.epoch, () => this.jobs.delete(O), (e) => e.status === `found`);
		return this.jobs.add(O), O;
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			for (let e of this.jobs) e.cancel();
			this.tiles.clear();
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
		let n = /* @__PURE__ */ new Set();
		for (let r = Math.floor((e.x - t) / this.tileSize); r <= Math.floor((e.x + t) / this.tileSize); r++) for (let i = Math.floor((e.z - t) / this.tileSize); i <= Math.floor((e.z + t) / this.tileSize); i++) {
			yield -1;
			for (let e of this.tiles.get(`${r}:${i}`) ?? []) n.has(e) ? yield -1 : (n.add(e), yield e);
		}
	}
	region(t, n) {
		let r = this.geometry[t];
		if (n === 0) return { vertices: r.surface.vertices };
		let i = r.surface.vertices;
		for (let e = 0; e < r.surface.vertices.length && i.length > 0; e++) {
			let t = r.surface.vertices[e], a = r.surface.vertices[(e + 1) % r.surface.vertices.length];
			(r.walls[e] || !r.edges.some((e) => !e.link && same(e.a, t) && same(e.b, a) && !this.disabled.has(this.geometry[e.to].surface.id))) && (i = clipPolygon(i, t, a, n));
		}
		for (let t of r.surface.vertices) {
			if (!this.vertexTopology.get(`${t.x},${t.y},${t.z}`).some(({ polygon: e, edge: t }) => {
				if (this.disabled.has(e.surface.id)) return !1;
				let n = e.surface.vertices[t], r = e.surface.vertices[(t + 1) % e.surface.vertices.length];
				return e.walls[t] || !e.edges.some((e) => !e.link && same(e.a, n) && same(e.b, r) && !this.disabled.has(this.geometry[e.to].surface.id));
			})) continue;
			let a = r.center.x - t.x, o = r.center.z - t.z, s = Math.hypot(a, o);
			i = clipPolygon(i, t, new require_math3d.Vector3(t.x + o / s, t.y, t.z - a / s), n);
		}
		return { vertices: i };
	}
	portal(t, n, r, a) {
		if (t.link) return !this.disabledLinks.has(t.link.id) && t.link.clearance >= a && inside(n.vertices, t.a) && inside(r.vertices, t.b) ? [t.a, t.b] : void 0;
		let o = Math.hypot(t.b.x - t.a.x, t.b.z - t.a.z);
		if (o <= 2 * a + i) return;
		let s = clipSegment(n.vertices, t.a, t.b), c = clipSegment(r.vertices, t.a, t.b);
		if (!s || !c) return;
		let l = Math.max(a / o, s[0], c[0]), u = Math.min(1 - a / o, s[1], c[1]);
		if (!(l > u - i)) return [new require_math3d.Vector3(t.a.x + (t.b.x - t.a.x) * l, t.a.y + (t.b.y - t.a.y) * l, t.a.z + (t.b.z - t.a.z) * l), new require_math3d.Vector3(t.a.x + (t.b.x - t.a.x) * u, t.a.y + (t.b.y - t.a.y) * u, t.a.z + (t.b.z - t.a.z) * u)];
	}
};
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
	return e.length >= 3 && e.every((n, r) => cross(n, e[(r + 1) % e.length], t) >= -1e-7);
}
function clipPolygon(t, n, r, i) {
	let a = [], o = i * Math.hypot(r.x - n.x, r.z - n.z);
	for (let i = 0; i < t.length; i++) {
		let s = t[i], c = t[(i + 1) % t.length], l = cross(n, r, s) - o, u = cross(n, r, c) - o;
		if (l >= -1e-7 && a.push(new require_math3d.Vector3(s.x, s.y, s.z)), l >= 0 != u >= 0) {
			let t = l / (l - u);
			a.push(new require_math3d.Vector3(s.x + (c.x - s.x) * t, s.y + (c.y - s.y) * t, s.z + (c.z - s.z) * t));
		}
	}
	return a;
}
function clipSegment(e, t, n) {
	if (e.length < 3) return;
	let r = 0, a = 1;
	for (let i = 0; i < e.length; i++) {
		let o = e[i], s = e[(i + 1) % e.length], c = cross(o, s, t), l = cross(o, s, n);
		if (c < -1e-7 && l < -1e-7) return;
		if (c < 0 != l < 0) {
			let e = c / (c - l);
			c < 0 ? r = Math.max(r, e) : a = Math.min(a, e);
		}
	}
	return r <= a + i ? [r, a] : void 0;
}
function nearest(t, n, r) {
	if (n.length < 3) return;
	let i = (r.y - height(t, r)) / (1 + t.dx * t.dx + t.dz * t.dz), a = new require_math3d.Vector3(r.x + t.dx * i, r.y - i, r.z + t.dz * i);
	if (inside(n, a)) return a;
	let o, s = 1 / 0;
	for (let t = 0; t < n.length; t++) {
		let i = n[t], a = n[(t + 1) % n.length], c = a.x - i.x, l = a.y - i.y, u = a.z - i.z, d = Math.max(0, Math.min(1, ((r.x - i.x) * c + (r.y - i.y) * l + (r.z - i.z) * u) / (c * c + l * l + u * u))), f = new require_math3d.Vector3(i.x + c * d, i.y + l * d, i.z + u * d), p = Math.hypot(f.x - r.x, f.y - r.y, f.z - r.z);
		p < s && (s = p, o = f);
	}
	return o;
}
function segmentCrossing(e, t, n, r) {
	let a = t.x - e.x, o = t.z - e.z, s = r.x - n.x, c = r.z - n.z, l = a * c - o * s;
	if (Math.abs(l) < i) return;
	let u = ((n.x - e.x) * c - (n.z - e.z) * s) / l, d = ((n.x - e.x) * o - (n.z - e.z) * a) / l;
	return u >= -1e-7 && u <= 1.0000001 && d >= -1e-7 && d <= 1.0000001 ? u : void 0;
}
//#endregion
exports.NavigationMesh3D = NavigationMesh3D;

//# sourceMappingURL=mesh.cjs.map