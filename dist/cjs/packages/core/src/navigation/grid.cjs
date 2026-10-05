const require_navigation = require("../../../../src/data/navigation.cjs");
const require_jobs = require("./jobs.cjs");
//#region dist/packages/core/src/navigation/grid.js
var NavigationGrid2D = class {
	columns;
	rows;
	walkable;
	costs;
	clearance;
	searches;
	paths = /* @__PURE__ */ new WeakSet();
	minimumCost = 1;
	currentRevision = 0;
	disposed = !1;
	constructor(n) {
		let { columns: r, rows: i } = n;
		if (!Number.isSafeInteger(r) || !Number.isSafeInteger(i) || r <= 0 || i <= 0 || r * i > require_navigation.navigationLimits.gridCells) throw RangeError(`Navigation grid exceeds the positive integer cell budget.`);
		this.columns = r, this.rows = i, this.walkable = new Uint8Array(r * i).fill(1), this.costs = new Float64Array(r * i).fill(1), this.clearance = new Float64Array(r * i).fill(1 / 0), this.searches = new require_jobs.NavigationSearchPool(r * i);
	}
	get revision() {
		return this.currentRevision;
	}
	get destroyed() {
		return this.disposed;
	}
	get availableSearchSlots() {
		return this.searches.availableSlots;
	}
	scheduleSearch(t, n, r, i = {}) {
		if (this.index(n.column, n.row), this.index(r.column, r.row), this.disposed) throw Error(`Navigation grid is destroyed.`);
		let a = i.agentRadius ?? 0;
		if (!Number.isFinite(a) || a < 0 || a > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Invalid navigation agent radius.`);
		let o = { ...n }, s = { ...r }, c = { ...i };
		return t.schedule(this, () => this.createSearch(o, s, c));
	}
	getCell(e, t) {
		let n = this.index(e, t);
		return Object.freeze({
			walkable: this.walkable[n] === 1,
			cost: this.costs[n],
			clearance: this.clearance[n]
		});
	}
	setCell(e, t, n) {
		this.setCells([{
			...n,
			column: e,
			row: t
		}]);
	}
	setCells(t) {
		if (this.disposed) throw Error(`Navigation grid is destroyed.`);
		if (t.length > require_navigation.navigationLimits.gridCells) throw RangeError(`Navigation edit exceeds the cell budget.`);
		let n = /* @__PURE__ */ new Map();
		for (let r of t) {
			let t = this.index(r.column, r.row), i = n.get(t), a = r.walkable === void 0 ? i?.walkable ?? this.walkable[t] === 1 : r.walkable, o = r.cost === void 0 ? i?.cost ?? this.costs[t] : r.cost, s = r.clearance === void 0 ? i?.clearance ?? this.clearance[t] : r.clearance;
			if (typeof a != `boolean` || !(s === 1 / 0 || Number.isFinite(s) && s >= 0 && s <= require_navigation.navigationLimits.coordinateExtent) || !Number.isFinite(o) || o <= 0 || o > require_navigation.navigationLimits.cost) throw RangeError(`Navigation cells require boolean walkability, positive finite cost and nonnegative clearance.`);
			n.set(t, {
				walkable: a,
				cost: o,
				clearance: s
			});
		}
		let r = !1;
		for (let [e, t] of n) (this.walkable[e] === 1 !== t.walkable || this.costs[e] !== t.cost || this.clearance[e] !== t.clearance) && (r = !0, this.walkable[e] = +!!t.walkable, this.costs[e] = t.cost, this.clearance[e] = t.clearance);
		if (r) {
			this.currentRevision++, this.searches.invalidate(), this.minimumCost = 1 / 0;
			for (let e = 0; e < this.costs.length; e++) this.walkable[e] && (this.minimumCost = Math.min(this.minimumCost, this.costs[e]));
			this.minimumCost === 1 / 0 && (this.minimumCost = 0);
		}
	}
	isPathCurrent(e) {
		return !this.disposed && this.paths.has(e) && e.revision === this.currentRevision;
	}
	findPath(t, n, r = {}) {
		let i = this.createSearch(t, n, r);
		for (; i.status === `pending`;) i.step(require_navigation.navigationLimits.expansionsPerStep);
		return i.result;
	}
	createSearch(t, n, r = {}) {
		let i = this.index(t.column, t.row), a = this.index(n.column, n.row), o = {
			column: n.column,
			row: n.row
		}, s = r.diagonal ?? !1, c = r.cornerCutting ?? !1, l = r.agentRadius ?? 0;
		if (!Number.isFinite(l) || l < 0 || l > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Navigation agent radius exceeds its nonnegative finite bound.`);
		let traversable = (e) => this.walkable[e] === 1 && this.clearance[e] >= l;
		return this.searches.create({
			from: traversable(i) && traversable(a) ? i : -1,
			to: a,
			estimate: (e) => this.heuristic(e % this.columns, Math.floor(e / this.columns), o, s),
			expand: (e, t) => {
				let n = e % this.columns, r = Math.floor(e / this.columns);
				for (let i = -1; i <= 1; i++) for (let a = -1; a <= 1; a++) {
					if (a === 0 && i === 0 || !s && a !== 0 && i !== 0) continue;
					let l = n + a, u = r + i;
					if (l < 0 || u < 0 || l >= this.columns || u >= this.rows) continue;
					let d = u * this.columns + l;
					if (!traversable(d)) continue;
					let f = a !== 0 && i !== 0;
					if (f && !c && (!traversable(r * this.columns + l) || !traversable(u * this.columns + n))) continue;
					let p = t.distance[e] + this.costs[d] * (f ? Math.SQRT2 : 1);
					p >= t.distance[d] || t.offer(d, p, p + this.heuristic(l, u, o, s), e);
				}
			},
			result: (e, t) => {
				let n = [];
				if (e) {
					for (let e = a; e >= 0; e = t.parent[e]) n.push(Object.freeze({
						column: e % this.columns,
						row: Math.floor(e / this.columns)
					}));
					n.reverse();
				}
				return this.result(n, e ? t.distance[a] : 1 / 0);
			}
		});
	}
	destroy() {
		this.disposed = !0, this.searches.destroy();
	}
	index(e, t) {
		if (!Number.isInteger(e) || !Number.isInteger(t) || e < 0 || t < 0 || e >= this.columns || t >= this.rows) throw RangeError(`Navigation coordinates are outside the grid.`);
		return t * this.columns + e;
	}
	heuristic(e, t, n, r) {
		let i = Math.abs(e - n.column), a = Math.abs(t - n.row);
		return this.minimumCost * (r ? Math.max(i, a) + (Math.SQRT2 - 1) * Math.min(i, a) : i + a);
	}
	result(e, t) {
		let n = Object.freeze({
			status: e.length === 0 ? `unreachable` : `found`,
			cells: Object.freeze(e),
			cost: t,
			revision: this.currentRevision
		});
		return this.paths.add(n), n;
	}
};
//#endregion
exports.NavigationGrid2D = NavigationGrid2D;

//# sourceMappingURL=grid.cjs.map