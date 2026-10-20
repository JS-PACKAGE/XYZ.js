const require_hypot = require("../../math/src/hypot.cjs");
const require_navigation = require("../../../src/data/navigation.cjs");
const require_world_streaming = require("../../../src/data/world-streaming.cjs");
const require_graph = require("./navigation/graph.cjs");
//#region dist/packages/core/src/world-streaming-navigation.js
var WorldStreamingNavigation3D = class {
	current;
	generation = 0;
	disposed = !1;
	get graph() {
		return this.current;
	}
	get revision() {
		return this.generation;
	}
	nodeId(e, n) {
		let r = `${e.length}:${e}${n}`;
		if (r.length > require_navigation.navigationLimits.nodeIdLength) throw RangeError(`Streamed navigation node ID exceeds its budget.`);
		return r;
	}
	isPathCurrent(e) {
		return this.current?.isPathCurrent(e) ?? !1;
	}
	prepare(i) {
		if (this.disposed) throw Error(`Streaming navigation is destroyed.`);
		let a = [], o = [], s = /* @__PURE__ */ new Map();
		for (let [e, r] of i) {
			let i = new require_graph.NavigationGraph3D(r);
			try {
				let n = /* @__PURE__ */ new Map();
				for (let t of i.nodes) {
					let r = {
						...t,
						id: this.nodeId(e, t.id)
					};
					a.push(r), n.set(t.id, r);
				}
				for (let t of i.connections) o.push({
					...t,
					from: this.nodeId(e, t.from),
					to: this.nodeId(e, t.to)
				});
				if ((r.portals?.length ?? 0) > i.nodes.length) throw RangeError(`Streaming portals exceed the fragment node budget.`);
				let c = /* @__PURE__ */ new Set();
				for (let i of r.portals ?? []) {
					let r = n.get(i.node);
					if (!r || typeof i.seam != `string` || !i.seam || i.seam.length > require_navigation.navigationLimits.nodeIdLength || c.has(i.seam) || !Number.isFinite(i.clearance) || i.clearance < 0 || i.clearance > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Invalid or duplicate streaming seam portal.`);
					c.add(i.seam);
					let a = s.get(i.seam) ?? [];
					if (a.push({
						...i,
						cell: e,
						endpoint: r
					}), a.length > 2) throw RangeError(`Streaming seam ${i.seam} has more than two owners.`);
					s.set(i.seam, a);
				}
			} finally {
				i.destroy();
			}
		}
		if (a.length > require_navigation.navigationLimits.graphNodes || o.length > require_navigation.navigationLimits.graphConnections) throw RangeError(`Streamed navigation exceeds the aggregate graph budget.`);
		for (let [t, n] of s) {
			if (n.length !== 2) continue;
			let [i, a] = n, s = require_hypot.hypot3(i.endpoint.position.x - a.endpoint.position.x, i.endpoint.position.y - a.endpoint.position.y, i.endpoint.position.z - a.endpoint.position.z);
			if (s > require_world_streaming.worldStreamingLimits.seamTolerance) throw RangeError(`Streaming seam ${t} endpoints do not coincide.`);
			o.push({
				from: i.endpoint.id,
				to: a.endpoint.id,
				cost: s,
				clearance: Math.min(i.clearance, a.clearance)
			});
		}
		return a.length ? new require_graph.NavigationGraph3D({
			nodes: a,
			connections: o
		}) : void 0;
	}
	commit(e) {
		let t = this.current;
		this.current = e, this.generation++, t?.destroy();
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.current?.destroy(), this.current = void 0, this.generation++);
	}
};
//#endregion
exports.WorldStreamingNavigation3D = WorldStreamingNavigation3D;

//# sourceMappingURL=world-streaming-navigation.cjs.map