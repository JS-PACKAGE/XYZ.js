const require_math3d = require("../../../math/src/math3d.cjs");
const require_index = require("../../../math/src/index.cjs");
const require_collider = require("../physics2d/collider.cjs");
const require_game_object = require("../game-object.cjs");
const require_collider$1 = require("../physics3d/collider.cjs");
const require_object3d = require("../object3d.cjs");
const require_navigation = require("../../../../src/data/navigation.cjs");
const require_graph = require("./graph.cjs");
const require_grid = require("./grid.cjs");
//#region dist/packages/core/src/navigation/bake.js
var NavigationLatticeMapping = class {
	originX;
	originZ;
	columns;
	rows;
	cellSize;
	cosine;
	sine;
	constructor(e, t = 0, r = 0) {
		if (this.originX = t, this.originZ = r, !Number.isSafeInteger(e.columns) || !Number.isSafeInteger(e.rows) || e.columns < 1 || e.rows < 1 || !Number.isFinite(e.cellSize) || e.cellSize <= 0 || !Number.isFinite(e.rotation ?? 0) || !Number.isFinite(t) || !Number.isFinite(r)) throw RangeError(`Navigation bake requires finite positive lattice dimensions and transform.`);
		if (this.columns = e.columns, this.rows = e.rows, this.cellSize = e.cellSize, this.cosine = Math.cos(e.rotation ?? 0), this.sine = Math.sin(e.rotation ?? 0), Math.hypot(e.columns * e.cellSize, e.rows * e.cellSize) + Math.hypot(t, r) > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Navigation lattice exceeds coordinate bounds.`);
	}
	cellToWorld(t, n, r = new require_index.Vector2()) {
		if (!Number.isInteger(t) || !Number.isInteger(n) || t < 0 || n < 0 || t >= this.columns || n >= this.rows) throw RangeError(`Navigation cell is outside the lattice.`);
		let i = (t + .5) * this.cellSize, a = (n + .5) * this.cellSize;
		return r.set(this.originX + i * this.cosine - a * this.sine, this.originZ + i * this.sine + a * this.cosine);
	}
	worldToCell(e, t) {
		if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError(`Navigation mapping requires finite coordinates.`);
		let n = e - this.originX, r = t - this.originZ, i = Math.floor((n * this.cosine + r * this.sine) / this.cellSize), a = Math.floor((-n * this.sine + r * this.cosine) / this.cellSize);
		return i >= 0 && a >= 0 && i < this.columns && a < this.rows ? {
			column: i,
			row: a
		} : void 0;
	}
	nodeId(e, t, r = 0) {
		if (!Number.isInteger(r) || r < 0 || r >= require_navigation.navigationLimits.maxSurfaceLayers) throw RangeError(`Navigation surface layer exceeds its bounded slot profile.`);
		return r === 0 ? `${e}:${t}` : `${e}:${t}:${r}`;
	}
};
var NavigationGridBakeJob2D = class {
	world;
	options;
	mapping;
	state = `pending`;
	count = 0;
	cursor = 0;
	edits = [];
	probe = new require_game_object.GameObject();
	shape;
	radius;
	revision;
	worldRevision;
	sourceRevision;
	value;
	constructor(t, r) {
		if (this.world = t, this.options = r, this.options = {
			...r,
			origin: r.origin && new require_index.Vector2(r.origin.x, r.origin.y)
		}, this.mapping = new NavigationLatticeMapping(r, r.origin?.x, r.origin?.y), r.columns * r.rows > require_navigation.navigationLimits.gridCells) throw RangeError(`Navigation grid bake cell limit exceeded.`);
		if (this.radius = r.agentRadius ?? 0, !Number.isFinite(this.radius) || this.radius < 0 || this.radius > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Invalid bake agent radius.`);
		if (r.target && (r.target.columns !== r.columns || r.target.rows !== r.rows)) throw RangeError(`Grid rebake dimensions must match.`);
		this.revision = r.target?.revision, this.worldRevision = t.geometryRevision, this.sourceRevision = r.geometryRevision?.();
		let i = r.cellSize / 2 + this.radius;
		this.shape = new require_collider.Collider2D(`polygon`, 0, [
			[-i, -i],
			[i, -i],
			[i, i],
			[-i, i]
		]), this.shape.mask = r.mask ?? 4294967295, this.probe.rotation = r.rotation ?? 0;
	}
	get status() {
		return this.state;
	}
	get expansions() {
		return this.count;
	}
	get result() {
		return this.value;
	}
	step(e) {
		if (validateBudget(e), this.state !== `pending`) return this.state;
		if (this.world.geometryRevision !== this.worldRevision || this.options.geometryRevision?.() !== this.sourceRevision || this.options.target && (this.options.target.destroyed || this.options.target.revision !== this.revision)) return this.state = `invalidated`, this.edits.length = 0, this.probe.destroy(), this.state;
		for (let t = 0; t < e && this.cursor < this.mapping.columns * this.mapping.rows; t++) {
			let e = this.cursor % this.mapping.columns, t = Math.floor(this.cursor / this.mapping.columns);
			this.mapping.cellToWorld(e, t, this.probe.position);
			let n = !this.options.blockedCell?.(e, t) && !this.world.overlap(this.shape, this.probe).some((e) => !e.sensor);
			this.edits.push({
				column: e,
				row: t,
				walkable: n,
				clearance: this.radius / this.mapping.cellSize
			}), this.cursor++, this.count++;
		}
		if (this.cursor === this.mapping.columns * this.mapping.rows) {
			if (this.world.geometryRevision !== this.worldRevision || this.options.geometryRevision?.() !== this.sourceRevision || this.options.target && (this.options.target.destroyed || this.options.target.revision !== this.revision)) return this.state = `invalidated`, this.edits.length = 0, this.probe.destroy(), this.state;
			let e = this.options.target ?? new require_grid.NavigationGrid2D(this.mapping);
			e.setCells(this.edits), this.value = e, this.edits.length = 0, this.state = `found`, this.probe.destroy();
		}
		return this.state === `pending` && (this.world.geometryRevision !== this.worldRevision || this.options.geometryRevision?.() !== this.sourceRevision || this.options.target && this.options.target.revision !== this.revision) && (this.state = `invalidated`, this.edits.length = 0, this.probe.destroy()), this.state;
	}
	cancel() {
		this.state === `pending` && (this.state = `cancelled`, this.edits.length = 0, this.probe.destroy());
	}
};
var NavigationSurfaceBakeJob3D = class {
	world;
	options;
	mapping;
	maxLayers;
	state = `pending`;
	count = 0;
	cursor = 0;
	layer = -1;
	edgeCursor = 0;
	edgePhase = 0;
	linkCursor = 0;
	nodes = [];
	connections = [];
	feet = [];
	probe = new require_object3d.Object3D();
	shape;
	point = new require_index.Vector2();
	ray = new require_math3d.Vector3();
	down = new require_math3d.Vector3(0, -1, 0);
	motion = new require_math3d.Vector3();
	slope;
	stepHeight;
	offset;
	supportSamples;
	query;
	revision;
	worldRevision;
	sourceRevision;
	value;
	constructor(e, r) {
		this.world = e, this.options = r, this.options = {
			...r,
			origin: r.origin && new require_math3d.Vector3(r.origin.x, r.origin.y, r.origin.z),
			query: { ...r.query },
			links: r.links?.map((e) => ({ ...e }))
		}, this.mapping = new NavigationLatticeMapping(r, r.origin?.x, r.origin?.z), this.maxLayers = r.maxLayers ?? require_navigation.navigationLimits.surfaceLayers, this.supportSamples = r.supportSamples ?? require_navigation.navigationLimits.supportSamples, this.slope = r.maxSlopeAngle ?? Math.PI / 4, this.stepHeight = r.stepHeight ?? 0;
		let i = r.columns * r.rows * this.maxLayers;
		if (!Number.isSafeInteger(this.maxLayers) || this.maxLayers < 1 || this.maxLayers > require_navigation.navigationLimits.maxSurfaceLayers || !Number.isSafeInteger(this.supportSamples) || this.supportSamples < 1 || this.supportSamples > require_navigation.navigationLimits.maxSupportSamples || i > require_navigation.navigationLimits.graphNodes || !Number.isFinite(r.minY) || !Number.isFinite(r.maxY) || r.maxY <= r.minY || !Number.isFinite(r.agentHeight) || r.agentHeight < 2 * r.agentRadius || !Number.isFinite(this.slope) || this.slope < 0 || this.slope >= Math.PI / 2 || !Number.isFinite(this.stepHeight) || this.stepHeight < 0 || (r.links?.length ?? 0) > require_navigation.navigationLimits.graphConnections) throw RangeError(`Invalid bounded multi-surface lattice or agent profile.`);
		if (this.shape = new require_collider$1.CapsuleCollider3D(r.agentRadius, r.agentHeight - 2 * r.agentRadius), this.probe.collider = this.shape, this.offset = r.agentHeight / 2 + require_navigation.navigationLimits.bakeSkin, Math.max(Math.abs(r.minY), Math.abs(r.maxY)) + this.offset + r.agentRadius * (1 / Math.cos(this.slope) - 1) + this.stepHeight > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`Surface agent clearance exceeds coordinate bounds.`);
		if (this.query = { ...r.query }, this.revision = r.target?.revision, this.worldRevision = e.geometryRevision, this.sourceRevision = r.geometryRevision?.(), r.target && (r.target.nodes.length !== i || r.target.nodes.some((e, t) => {
			let n = Math.floor(t / this.maxLayers);
			return e.id !== this.mapping.nodeId(n % r.columns, Math.floor(n / r.columns), t % this.maxLayers);
		}))) throw RangeError(`Surface rebake must preserve lattice dimensions and layer slots.`);
		if (this.options.links?.some((e) => e.kind !== `special` || !e.linkId)) throw RangeError(`Surface connectors must be explicit named special links.`);
	}
	get status() {
		return this.state;
	}
	get expansions() {
		return this.count;
	}
	get result() {
		return this.value;
	}
	step(e) {
		if (validateBudget(e), this.state !== `pending`) return this.state;
		if (this.stale()) return this.state = `invalidated`, this.release(), this.state;
		let t = this.mapping.columns * this.mapping.rows;
		try {
			for (let r = 0; r < e && this.state === `pending`; r++) {
				if (this.cursor < t) this.sampleCell();
				else if (this.edgeCursor < this.nodes.length * 2 * this.maxLayers) this.sampleEdge();
				else if (this.linkCursor < (this.options.links?.length ?? 0)) {
					if (this.connections.length === require_navigation.navigationLimits.graphConnections) throw RangeError(`Surface connection limit exceeded.`);
					this.connections.push(this.options.links[this.linkCursor++]);
				} else {
					if (this.stale()) return this.state = `invalidated`, this.release(), this.state;
					let e = {
						nodes: this.nodes,
						connections: this.connections
					};
					this.options.target ? (this.options.target.replaceGeometry(e), this.value = this.options.target) : this.value = new require_graph.NavigationGraph3D(e), this.state = `found`, this.release();
				}
				this.count++;
			}
		} catch (e) {
			throw this.state = `cancelled`, this.release(), e;
		}
		return this.state === `pending` && this.stale() && (this.state = `invalidated`, this.release()), this.state;
	}
	cancel() {
		this.state === `pending` && (this.state = `cancelled`, this.release());
	}
	stale() {
		return this.world.geometryRevision !== this.worldRevision || this.options.geometryRevision?.() !== this.sourceRevision || !(!this.options.target || !this.options.target.destroyed && this.options.target.revision === this.revision);
	}
	sampleCell() {
		let e = this.cursor % this.mapping.columns, r = Math.floor(this.cursor / this.mapping.columns), i = this.cursor * this.maxLayers;
		if (this.layer < 0) {
			this.mapping.cellToWorld(e, r, this.point), this.ray.set(this.point.x, this.options.maxY, this.point.y);
			let i = this.world.raycastAll(this.ray, this.down, this.options.maxY - this.options.minY, this.query), a = 0, o = 1 / 0;
			for (let s of i) {
				if (s.normal.y < Math.cos(this.slope) || o - s.point.y <= require_navigation.navigationLimits.bakeSkin) continue;
				if (a === this.maxLayers) throw RangeError(`Surface layer slot limit exceeded; increase maxLayers or narrow bounds.`);
				let i = this.offset + this.options.agentRadius * (1 / s.normal.y - 1);
				this.nodes.push({
					id: this.mapping.nodeId(e, r, a++),
					position: new require_math3d.Vector3(this.point.x, s.point.y + i, this.point.y),
					walkable: !0,
					clearance: this.options.agentRadius,
					surfaceY: s.point.y
				}), this.feet.push(s.point.y), o = s.point.y;
			}
			for (; a < this.maxLayers; a++) this.nodes.push({
				id: this.mapping.nodeId(e, r, a),
				position: new require_math3d.Vector3(this.point.x, this.options.minY + this.offset, this.point.y),
				walkable: !1,
				clearance: 0
			}), this.feet.push(this.options.minY);
			this.layer = 0;
		} else {
			let e = i + this.layer, t = this.nodes[e];
			t.walkable && (this.probe.position.copy(t.position), this.world.overlap(this.shape, this.probe, this.query).length > 0 && (this.nodes[e] = {
				...t,
				walkable: !1
			})), ++this.layer === this.maxLayers && (this.layer = -1, this.cursor++);
		}
	}
	sampleEdge() {
		let e = Math.floor(this.edgeCursor / (2 * this.maxLayers)), t = Math.floor(this.edgeCursor / this.maxLayers) % 2, r = this.edgeCursor % this.maxLayers, i = Math.floor(e / this.maxLayers), a = t === 0 ? i % this.mapping.columns + 1 < this.mapping.columns : i + this.mapping.columns < this.mapping.columns * this.mapping.rows, o = (i + (t === 0 ? 1 : this.mapping.columns)) * this.maxLayers + r, s = this.nodes[e], c = this.nodes[o], l = c ? Math.abs(this.feet[e] - this.feet[o]) : 1 / 0;
		if (!a || !c || !s.walkable || !c.walkable || l > Math.max(this.stepHeight, Math.tan(this.slope) * this.mapping.cellSize) + require_navigation.navigationLimits.bakeSkin) {
			this.nextEdge();
			return;
		}
		let u = Math.max(s.position.y, c.position.y) + require_navigation.navigationLimits.bakeSkin, d;
		if (this.edgePhase < this.supportSamples) {
			let t = (this.edgePhase + 1) / (this.supportSamples + 1), r = this.feet[e] + (this.feet[o] - this.feet[e]) * t, i = this.stepHeight + require_navigation.navigationLimits.bakeSkin;
			this.ray.set(s.position.x + (c.position.x - s.position.x) * t, r + i, s.position.z + (c.position.z - s.position.z) * t);
			let a = this.world.raycast(this.ray, this.down, i * 2, this.query);
			d = !!a && a.normal.y >= Math.cos(this.slope) && Math.abs(a.point.y - r) <= i;
		} else {
			let e = this.edgePhase - this.supportSamples;
			if (e < 2) {
				let t = e === 0 ? s : c;
				this.probe.position.copy(t.position), this.motion.set(0, u - t.position.y, 0);
			} else this.probe.position.set(s.position.x, u, s.position.z), this.motion.set(c.position.x - s.position.x, 0, c.position.z - s.position.z);
			let t = this.world.sweepCapsule(this.probe, this.motion, this.query);
			d = !t || t.distance >= this.motion.length() - require_navigation.navigationLimits.bakeSkin;
		}
		if (!d) this.nextEdge();
		else if (++this.edgePhase === this.supportSamples + 3) {
			if (this.connections.length === require_navigation.navigationLimits.graphConnections) throw RangeError(`Surface connection limit exceeded.`);
			this.connections.push({
				from: s.id,
				to: c.id,
				cost: Math.hypot(c.position.x - s.position.x, c.position.y - s.position.y, c.position.z - s.position.z),
				clearance: this.options.agentRadius
			}), this.nextEdge();
		}
	}
	nextEdge() {
		this.edgeCursor++, this.edgePhase = 0;
	}
	release() {
		this.nodes.length = this.connections.length = this.feet.length = 0, this.probe.destroy();
	}
};
function validateBudget(e) {
	if (!Number.isSafeInteger(e) || e < 0 || e > require_navigation.navigationLimits.expansionsPerStep) throw RangeError(`Navigation bake work budget exceeds its finite bound.`);
}
//#endregion
exports.NavigationGridBakeJob2D = NavigationGridBakeJob2D;
exports.NavigationLatticeMapping = NavigationLatticeMapping;
exports.NavigationSurfaceBakeJob3D = NavigationSurfaceBakeJob3D;

//# sourceMappingURL=bake.cjs.map