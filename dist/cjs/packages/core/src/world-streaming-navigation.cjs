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
	prepare(r) {
		if (this.disposed) throw Error(`Streaming navigation is destroyed.`);
		let i = [], a = [], o = /* @__PURE__ */ new Map();
		for (let [e, s] of r) {
			let r = new require_graph.NavigationGraph3D(s);
			try {
				let n = /* @__PURE__ */ new Map();
				for (let t of r.nodes) {
					let r = {
						...t,
						id: this.nodeId(e, t.id)
					};
					i.push(r), n.set(t.id, r);
				}
				for (let t of r.connections) a.push({
					...t,
					from: this.nodeId(e, t.from),
					to: this.nodeId(e, t.to)
				});
				if ((s.portals?.length ?? 0) > r.nodes.length) throw RangeError(`Streaming portals exceed the fragment node budget.`);
				let c = /* @__PURE__ */ new Set();
				for (let r of s.portals ?? []) {
					let i = n.get(r.node);
					if (!i || typeof r.seam != `string` || !r.seam || r.seam.length > require_navigation.navigationLimits.nodeIdLength || c.has(r.seam) || !Number.isFinite(r.clearance) || r.clearance < 0 || r.clearance > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Invalid or duplicate streaming seam portal.`);
					c.add(r.seam);
					let a = o.get(r.seam) ?? [];
					if (a.push({
						...r,
						cell: e,
						endpoint: i
					}), a.length > 2) throw RangeError(`Streaming seam ${r.seam} has more than two owners.`);
					o.set(r.seam, a);
				}
			} finally {
				r.destroy();
			}
		}
		if (i.length > require_navigation.navigationLimits.graphNodes || a.length > require_navigation.navigationLimits.graphConnections) throw RangeError(`Streamed navigation exceeds the aggregate graph budget.`);
		for (let [t, n] of o) {
			if (n.length !== 2) continue;
			let [r, i] = n, o = Math.hypot(r.endpoint.position.x - i.endpoint.position.x, r.endpoint.position.y - i.endpoint.position.y, r.endpoint.position.z - i.endpoint.position.z);
			if (o > require_world_streaming.worldStreamingLimits.seamTolerance) throw RangeError(`Streaming seam ${t} endpoints do not coincide.`);
			a.push({
				from: r.endpoint.id,
				to: i.endpoint.id,
				cost: o,
				clearance: Math.min(r.clearance, i.clearance)
			});
		}
		return i.length ? new require_graph.NavigationGraph3D({
			nodes: i,
			connections: a
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