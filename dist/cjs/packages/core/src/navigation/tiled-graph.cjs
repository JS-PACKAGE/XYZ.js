const require_navigation = require("../../../../src/data/navigation.cjs");
const require_graph = require("./graph.cjs");
const require_partition_search = require("./partition-search.cjs");
//#region dist/packages/core/src/navigation/tiled-graph.js
var NavigationTiledGraph3D = class NavigationTiledGraph3D {
	nodes;
	currentConnections;
	ids = /* @__PURE__ */ new Map();
	spatial = /* @__PURE__ */ new Map();
	edges = [];
	jobs = /* @__PURE__ */ new Set();
	paths = /* @__PURE__ */ new WeakSet();
	epoch = 0;
	disposed = !1;
	tileSize;
	static nodeId(e, t) {
		return `${e.length}:${e}${t}`;
	}
	constructor(n) {
		if (this.tileSize = n.tileSize ?? require_navigation.navigationLimits.meshTileSize, !n.tiles.length || n.tiles.length > require_navigation.navigationLimits.partitionTiles || n.seams.length > require_navigation.navigationLimits.partitionSeams || !Number.isFinite(this.tileSize) || this.tileSize <= 0 || this.tileSize > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Invalid tiled navigation world.`);
		let r = 0, i = n.seams.length;
		for (let t of n.tiles) if (r += t.geometry.nodes.length, i += t.geometry.connections.length, r > require_navigation.navigationLimits.partitionNodes || i > require_navigation.navigationLimits.partitionConnections) throw RangeError(`Tiled world exceeds its aggregate geometry budget.`);
		let a = /* @__PURE__ */ new Set(), o = [], s = [];
		for (let r of n.tiles) {
			if (typeof r.id != `string` || !r.id || a.has(r.id) || r.id.length > require_navigation.navigationLimits.nodeIdLength) throw RangeError(`Invalid or duplicate navigation tile ID.`);
			a.add(r.id);
			let n = new require_graph.NavigationGraph3D(r.geometry);
			try {
				for (let e of n.nodes) {
					let t = NavigationTiledGraph3D.nodeId(r.id, e.id);
					this.ids.set(t, o.length), o.push(Object.freeze({
						...e,
						id: t
					}));
				}
				for (let e of n.connections) s.push(Object.freeze({
					...e,
					from: NavigationTiledGraph3D.nodeId(r.id, e.from),
					to: NavigationTiledGraph3D.nodeId(r.id, e.to)
				}));
			} finally {
				n.destroy();
			}
		}
		this.nodes = Object.freeze(o);
		for (let t = 0; t < o.length; t++) {
			this.edges.push([]);
			let n = o[t].position, r = Math.floor(n.x / this.tileSize), i = Math.floor(n.z / this.tileSize);
			if (!Number.isSafeInteger(r) || !Number.isSafeInteger(i)) throw RangeError(`Tiled spatial coordinates must be safe integers.`);
			let a = `${r}:${i}`, s = this.spatial.get(a) ?? [];
			if (s.length >= require_navigation.navigationLimits.partitionTileNodes) throw RangeError(`Spatial tile node budget exceeded; reduce tileSize.`);
			s.push(t), this.spatial.set(a, s);
		}
		for (let e of n.seams) {
			let n = this.ids.get(e.from), r = this.ids.get(e.to);
			if (n === void 0 || r === void 0 || n === r) throw RangeError(`Unknown or identical seam endpoint.`);
			let i = new require_graph.NavigationGraph3D({
				nodes: [{
					...o[n],
					id: `from`
				}, {
					...o[r],
					id: `to`
				}],
				connections: [{
					...e,
					from: `from`,
					to: `to`
				}]
			});
			try {
				s.push(Object.freeze({
					...i.connections[0],
					from: e.from,
					to: e.to
				}));
			} finally {
				i.destroy();
			}
		}
		let c = /* @__PURE__ */ new Set();
		for (let e = 0; e < s.length; e++) {
			let t = s[e], n = this.ids.get(t.from), r = this.ids.get(t.to), i = `${n}:${r}`, a = `${r}:${n}`;
			if (c.has(i) || !t.directed && c.has(a)) throw RangeError(`Duplicate tiled connection.`);
			c.add(i), this.edges[n].push({
				to: r,
				connection: e
			}), t.directed || (c.add(a), this.edges[r].push({
				to: n,
				connection: e
			}));
		}
		for (let t of this.edges) {
			if (t.length > require_navigation.navigationLimits.partitionNodeEdges) throw RangeError(`Tiled node degree budget exceeded.`);
			t.sort((e, t) => e.to - t.to);
		}
		this.currentConnections = Object.freeze(s);
	}
	get connections() {
		return this.currentConnections;
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
		return !this.disposed && this.paths.has(e) && e.revision === this.epoch;
	}
	getNode(e) {
		let t = this.ids.get(e);
		if (t === void 0) throw RangeError(`Unknown tiled node.`);
		return this.nodes[t];
	}
	getConnectionIndex(e, t) {
		let n = this.ids.get(e), r = this.ids.get(t);
		if (n === void 0 || r === void 0) throw RangeError(`Unknown tiled endpoint.`);
		return this.edges[n].find((e) => e.to === r)?.connection;
	}
	setConnection(e, t) {
		this.setConnections([{
			index: e,
			...t
		}]);
	}
	setConnections(t) {
		if (this.disposed) throw Error(`Tiled graph is destroyed.`);
		if (t.length > require_navigation.navigationLimits.partitionSeams) throw RangeError(`Tiled edit budget exceeded.`);
		let n = /* @__PURE__ */ new Map();
		for (let r of t) {
			if (!Number.isInteger(r.index) || r.index < 0 || r.index >= this.connections.length) throw RangeError(`Unknown tiled connection.`);
			let t = n.get(r.index) ?? this.connections[r.index], i = r.enabled ?? t.enabled, a = r.clearance ?? t.clearance;
			if (typeof i != `boolean` || !(a === 1 / 0 || Number.isFinite(a) && a >= 0 && a <= require_navigation.navigationLimits.coordinateExtent)) throw RangeError(`Invalid tiled connection state.`);
			n.set(r.index, Object.freeze({
				...t,
				enabled: i,
				clearance: a
			}));
		}
		if (![...n].some(([e, t]) => t.enabled !== this.connections[e].enabled || t.clearance !== this.connections[e].clearance)) return;
		let r = this.connections.slice();
		for (let [e, t] of n) r[e] = t;
		this.currentConnections = Object.freeze(r), this.epoch++;
		for (let e of this.jobs) e.invalidate();
	}
	project(t, n) {
		if (this.disposed) throw Error(`Tiled graph is destroyed.`);
		let r = n.agentRadius ?? 0;
		if (![
			t.x,
			t.y,
			t.z,
			n.maxDistance,
			n.maxVerticalDistance,
			r
		].every((t) => Number.isFinite(t) && Math.abs(t) <= require_navigation.navigationLimits.coordinateExtent) || r < 0 || n.maxDistance < 0 || n.maxVerticalDistance < 0) throw RangeError(`Invalid tiled projection bounds.`);
		let i = Math.ceil(2 * n.maxDistance / this.tileSize) + 2;
		if (i * i > require_navigation.navigationLimits.projectionTiles) throw RangeError(`Projection spans too many tiles.`);
		let a = Math.floor((t.x - n.maxDistance) / this.tileSize), o = Math.floor((t.x + n.maxDistance) / this.tileSize), s = Math.floor((t.z - n.maxDistance) / this.tileSize), c = Math.floor((t.z + n.maxDistance) / this.tileSize);
		if (![
			a,
			o,
			s,
			c
		].every(Number.isSafeInteger)) throw RangeError(`Tiled projection coordinates must be safe integers.`);
		let l, u = n.maxDistance;
		for (let e = a; e <= o; e++) for (let i = s; i <= c; i++) for (let a of this.spatial.get(`${e}:${i}`) ?? []) {
			let e = this.nodes[a];
			if (!e.walkable || e.clearance < r || Math.abs(e.position.y - t.y) > n.maxVerticalDistance) continue;
			let i = Math.hypot(e.position.x - t.x, e.position.y - t.y, e.position.z - t.z);
			(i < u || i === u && (!l || this.ids.get(l.id) > a)) && (l = e, u = i);
		}
		return l && Object.freeze({
			node: l,
			distance: u,
			revision: this.epoch
		});
	}
	scheduleSearch(e, t, n, r = {}) {
		this.validate(t, n, r);
		let i = {
			...r,
			excludedConnections: r.excludedConnections?.slice()
		};
		return e.schedule(this, () => this.createSearch(t, n, i));
	}
	findPath(t, n, r = {}) {
		let i = this.createSearch(t, n, r);
		for (; i.status === `pending`;) i.step(require_navigation.navigationLimits.expansionsPerStep);
		return i.result;
	}
	createSearch(e, t, i = {}) {
		if (this.validate(e, t, i), this.availableSearchSlots === 0) throw RangeError(`Navigation concurrent search budget exhausted.`);
		let a = this.ids.get(e), o = this.ids.get(t), s = this.epoch, c = i.agentRadius ?? 0, l = new Set(i.excludedConnections), u = new require_partition_search.PartitionSearch(), d = `search`, f = o, p = -1, m = !1, h = [], g = [];
		this.nodes[a].walkable && this.nodes[o].walkable && this.nodes[a].clearance >= c && this.nodes[o].clearance >= c && u.offer(a, 0, 0, -1);
		let _ = new require_partition_search.PartitionNavigationJob(() => {
			if (d === `search`) {
				let e = u.take();
				if (e === void 0) d = `publish`;
				else if (e === o) m = !0, d = `backtrack`;
				else for (let t of this.edges[e]) {
					let n = this.connections[t.connection], r = this.nodes[t.to];
					if (!n.enabled || n.clearance < c || !r.walkable || r.clearance < c || l.has(t.connection)) continue;
					let i = u.distance.get(e) + n.cost;
					i < (u.distance.get(t.to) ?? 1 / 0) && u.offer(t.to, i, i, e);
				}
			} else if (d === `backtrack`) f >= 0 ? (h.push(f), f = u.parent.get(f)) : (p = h.length - 1, d = `forward`);
			else if (d === `forward`) p >= 0 ? g.push(this.nodes[h[p--]]) : d = `publish`;
			else {
				let e = Object.freeze({
					status: m ? `found` : `unreachable`,
					nodes: Object.freeze(g),
					cost: m ? u.distance.get(o) : 1 / 0,
					revision: s
				});
				return this.paths.add(e), e;
			}
		}, () => !this.disposed && s === this.epoch, () => this.jobs.delete(_), (e) => e.status === `found`);
		return this.jobs.add(_), _;
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0;
			for (let e of this.jobs) e.cancel();
			this.spatial.clear();
		}
	}
	validate(t, n, r) {
		if (this.disposed) throw Error(`Tiled graph is destroyed.`);
		this.getNode(t), this.getNode(n);
		let i = r.agentRadius ?? 0;
		if (!Number.isFinite(i) || i < 0 || i > require_navigation.navigationLimits.coordinateExtent || (r.excludedConnections?.length ?? 0) > require_navigation.navigationLimits.partitionSeams || r.excludedConnections?.some((e) => !Number.isInteger(e) || e < 0 || e >= this.connections.length)) throw RangeError(`Invalid tiled search radius or exclusions.`);
	}
};
//#endregion
exports.NavigationTiledGraph3D = NavigationTiledGraph3D;

//# sourceMappingURL=tiled-graph.cjs.map