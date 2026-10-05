const require_math3d = require("../../../math/src/math3d.cjs");
const require_index = require("../../../math/src/index.cjs");
const require_collider = require("../physics3d/collider.cjs");
const require_crowd = require("../../../../src/data/crowd.cjs");
//#region dist/packages/core/src/navigation/crowd.js
function positive(e, t, n = 1 / 0) {
	if (!Number.isFinite(e) || e <= 0 || e > n) throw RangeError(`Invalid crowd ${t}.`);
	return e;
}
function integer(e, t, n) {
	if (!Number.isSafeInteger(e) || e < 1 || e > n) throw RangeError(`Invalid crowd ${t}.`);
	return e;
}
var CrowdSolver = class {
	maxAgents;
	maxObstacles;
	maxNeighbors;
	neighborDistance;
	timeHorizon;
	agents = /* @__PURE__ */ new Map();
	obstacles = /* @__PURE__ */ new Map();
	ordered = [];
	grid = /* @__PURE__ */ new Map();
	buckets = [];
	neighbors = [];
	lines;
	displacement = new require_math3d.Vector3();
	displacement2D = new require_index.Vector2();
	movementOptions = { epoch: 0 };
	epoch;
	disposed = !1;
	updating = !1;
	candidateScratch = {
		best: 1 / 0,
		x: 0,
		z: 0,
		count: 0,
		px: 0,
		pz: 0,
		speed: 0
	};
	constructor(e = {}) {
		this.maxAgents = integer(e.maxAgents ?? 256, `agent budget`, require_crowd.crowdLimits.agents), this.maxObstacles = integer(e.maxObstacles ?? 256, `obstacle budget`, require_crowd.crowdLimits.obstacles), this.maxNeighbors = integer(e.maxNeighbors ?? 16, `neighbor budget`, require_crowd.crowdLimits.neighbors), this.neighborDistance = positive(e.neighborDistance ?? 10, `neighbor distance`), this.timeHorizon = positive(e.timeHorizon ?? 2, `time horizon`, require_crowd.crowdLimits.timeHorizon), this.lines = Array.from({ length: this.maxNeighbors }, () => ({
			nx: 0,
			nz: 0,
			b: 0
		}));
	}
	register3D(e, t) {
		if (t.follower && t.follower.controller !== e) throw Error(`Crowd follower must borrow the registered controller.`);
		if (!(e.object.collider instanceof require_collider.CapsuleCollider3D) || t.radius < e.object.collider.radius + e.skin) throw RangeError(`Crowd radius must enclose the character capsule and skin.`);
		return this.register(e, void 0, t);
	}
	register2D(e, t) {
		if (t.follower) throw Error(`3D route followers cannot drive a 2D controller.`);
		return this.register(void 0, e, t);
	}
	register(t, r, i) {
		if (this.disposed || this.updating) throw Error(`Crowd registration requires a live idle solver.`);
		if (integer(i.id, `stable ID`, 2 ** 53 - 1), positive(i.radius, `radius`, this.neighborDistance / 2), positive(i.maxSpeed, `speed`, require_crowd.crowdLimits.speed), 2 * i.radius + 2 * i.maxSpeed * this.timeHorizon > this.neighborDistance) throw RangeError(`Neighbor distance must cover diameter plus twice speed times horizon.`);
		if (this.agents.has(i.id) || this.obstacles.has(i.id)) throw Error(`Duplicate crowd ID.`);
		if (this.agents.size >= this.maxAgents) throw RangeError(`Crowd agent budget exceeded.`);
		for (let e of this.agents.values()) {
			if (e.controller3D === t && t || e.controller2D === r && r) throw Error(`A controller may be registered only once.`);
			if (!!e.controller3D != !!t) throw Error(`Use separate solvers for XY and XZ worlds.`);
		}
		let a = {
			id: i.id,
			radius: i.radius,
			maxSpeed: i.maxSpeed,
			options: { ...i },
			controller3D: t,
			controller2D: r,
			x: 0,
			z: 0,
			state: `idle`,
			velocity: new require_math3d.Vector3(),
			preferred: new require_math3d.Vector3(),
			next: new require_math3d.Vector3(),
			remove: () => {
				if (this.updating) throw Error(`Remove crowd registrations outside update callbacks.`);
				a.state = `removed`, a.velocity.set(0, 0, 0), this.agents.delete(a.id);
			}
		};
		return this.agents.set(a.id, a), a;
	}
	addObstacle(e, t, n) {
		if (this.disposed || this.updating) throw Error(`Crowd obstacle registration requires a live idle solver.`);
		if (integer(e, `stable ID`, 2 ** 53 - 1), positive(n, `obstacle radius`, this.neighborDistance / 2), !Number.isFinite(t.x) || !Number.isFinite(t.z)) throw RangeError(`Invalid obstacle center.`);
		let r = Math.floor(t.x / this.neighborDistance), i = Math.floor(t.z / this.neighborDistance);
		if (!Number.isSafeInteger(r) || !Number.isSafeInteger(i) || Math.abs(r) >= 2 ** 53 - 1 || Math.abs(i) >= 2 ** 53 - 1) throw RangeError(`Crowd position exceeds representable neighbor-grid coordinates.`);
		if (this.agents.has(e) || this.obstacles.has(e)) throw Error(`Duplicate crowd ID.`);
		if (this.obstacles.size >= this.maxObstacles) throw RangeError(`Crowd obstacle budget exceeded.`);
		return this.obstacles.set(e, {
			id: e,
			x: t.x,
			z: t.z,
			radius: n
		}), () => {
			if (this.updating) throw Error(`Remove crowd obstacles outside update callbacks.`);
			this.obstacles.delete(e);
		};
	}
	update(e, t) {
		if (this.disposed || this.updating) throw Error(`Crowd update requires a live idle solver.`);
		if (!Number.isFinite(e) || e <= 0 || e > require_crowd.crowdLimits.deltaSeconds) throw RangeError(`Crowd requires fixed delta within (0, 0.1] seconds.`);
		if (!Number.isSafeInteger(t) || t < 0 || this.epoch !== void 0 && t < this.epoch) throw RangeError(`Crowd epoch must be monotonic and nonnegative.`);
		if (t !== this.epoch) {
			this.updating = !0;
			try {
				this.ordered.length = 0;
				for (let t of this.agents.values()) {
					let n = t.controller3D ?? t.controller2D;
					if (n.destroyed || n.object.destroyed) {
						t.state = `removed`, this.agents.delete(t.id);
						continue;
					}
					let r = n.object.position;
					if (t.x = r.x, t.z = t.controller3D ? r.z : r.y, t.preferred.set(0, 0, 0), t.options.follower ? t.options.follower.samplePreferredVelocity(e, t.preferred) : t.options.preferredVelocity?.(e, t.preferred), !Number.isFinite(t.x) || !Number.isFinite(t.z) || !Number.isFinite(t.preferred.x) || !Number.isFinite(t.preferred.y) || !Number.isFinite(t.preferred.z)) throw RangeError(`Crowd positions and preferred velocities must be finite.`);
					let i = Math.floor(t.x / this.neighborDistance), a = Math.floor(t.z / this.neighborDistance);
					if (!Number.isSafeInteger(i) || !Number.isSafeInteger(a) || Math.abs(i) >= 2 ** 53 - 1 || Math.abs(a) >= 2 ** 53 - 1) throw RangeError(`Crowd position exceeds representable neighbor-grid coordinates.`);
					let o = t.preferred.length();
					o > t.maxSpeed && (t.preferred.x *= t.maxSpeed / o, t.preferred.y *= t.maxSpeed / o, t.preferred.z *= t.maxSpeed / o), this.ordered.push(t);
				}
				this.ordered.sort((e, t) => e.id - t.id);
				for (let e of this.grid.values()) e.length = 0, this.buckets.push(e);
				this.grid.clear();
				for (let e of this.ordered) this.insertDisc(e);
				for (let e of this.obstacles.values()) this.insertDisc(e);
				for (let t of this.ordered) this.solve(t, e);
				let n = !1;
				for (let e of this.ordered) e.state === `budget-exceeded` && (n = !0);
				if (n) for (let e of this.ordered) e.next.set(0, 0, 0), e.state = `budget-exceeded`;
				this.movementOptions.epoch = t;
				for (let t of this.ordered) {
					this.displacement.set(t.next.x * e, t.state === `budget-exceeded` || t.state === `blocked` ? 0 : t.preferred.y * e, t.next.z * e);
					let n = t.controller3D ? t.controller3D.move(this.displacement, this.movementOptions) : t.controller2D.move(this.displacement2D.set(this.displacement.x, this.displacement.z), this.movementOptions);
					t.velocity.set(n.locomotionDisplacement.x / e, 0, t.controller3D ? n.locomotionDisplacement.z / e : n.locomotionDisplacement.y / e), (n.blocked || n.unresolvedPenetration) && (t.state = `blocked`);
				}
				this.epoch = t;
			} finally {
				this.updating = !1;
			}
		}
	}
	insertDisc(e) {
		let t = `${Math.floor(e.x / this.neighborDistance)},${Math.floor(e.z / this.neighborDistance)}`, n = this.grid.get(t);
		n || (n = this.buckets.pop() ?? [], this.grid.set(t, n)), n.push(e);
	}
	solve(e, t) {
		this.neighbors.length = 0;
		let r = Math.floor(e.x / this.neighborDistance), i = Math.floor(e.z / this.neighborDistance);
		for (let t = r - 1; t <= r + 1; t++) for (let n = i - 1; n <= i + 1; n++) {
			let r = this.grid.get(`${t},${n}`);
			if (r) {
				for (let t of r) if (!(t === e || Math.hypot(t.x - e.x, t.z - e.z) > this.neighborDistance) && (this.neighbors.push(t), this.neighbors.length > this.maxNeighbors)) {
					e.next.set(0, 0, 0), e.state = `budget-exceeded`;
					return;
				}
			}
		}
		this.neighbors.sort((e, t) => e.id - t.id);
		let a = 0;
		for (let r of this.neighbors) {
			let i = `velocity` in r, o = r.x - e.x, s = r.z - e.z, c = e.velocity.x - (i ? r.velocity.x : 0), l = e.velocity.z - (i ? r.velocity.z : 0), u = e.radius + r.radius + .002, d = o * o + s * s, f = u * u, p, m, h, g, _ = 1 / (d > f ? this.timeHorizon : t), v = c - o * _, y = l - s * _, b = v * v + y * y, x = v * o + y * s;
			if (d <= f || x < 0 && x * x > f * b) {
				let t = Math.sqrt(b), i = t > require_crowd.crowdLimits.epsilon ? v / t : e.id < r.id ? -1 : 1, a = t > require_crowd.crowdLimits.epsilon ? y / t : 0;
				p = a, m = -i, h = (u * _ - t) * i, g = (u * _ - t) * a;
			} else {
				let e = Math.sqrt(Math.max(0, d - f));
				o * y - s * v > 0 ? (p = (o * e - s * u) / d, m = (o * u + s * e) / d) : (p = -(o * e + s * u) / d, m = -(-o * u + s * e) / d);
				let t = c * p + l * m;
				h = t * p - c, g = t * m - l;
			}
			let S = this.lines[a++];
			S.nx = -m, S.nz = p;
			let C = i ? .5 : 1;
			S.b = S.nx * (e.velocity.x + C * h) + S.nz * (e.velocity.z + C * g);
		}
		let o = a > 0 ? .05 : 0, s = e.preferred.x - e.preferred.z * o, c = e.preferred.z + e.preferred.x * o, l = Math.sqrt(Math.max(0, e.maxSpeed ** 2 - e.preferred.y ** 2)), u = Math.hypot(s, c);
		u > l && (s *= l / u, c *= l / u);
		let d = this.candidateScratch;
		d.best = 1 / 0, d.x = d.z = 0, d.count = a, d.px = s, d.pz = c, d.speed = l, this.candidate(s, c), this.candidate(0, 0);
		for (let e = 0; e < a; e++) {
			let t = this.lines[e], r = t.b - t.nx * s - t.nz * c;
			this.candidate(s + r * t.nx, c + r * t.nz);
			let i = l * l - t.b * t.b;
			if (i >= 0) {
				let e = Math.sqrt(i);
				this.candidate(t.nx * t.b - t.nz * e, t.nz * t.b + t.nx * e), this.candidate(t.nx * t.b + t.nz * e, t.nz * t.b - t.nx * e);
			}
			for (let r = 0; r < e; r++) {
				let e = this.lines[r], i = t.nx * e.nz - t.nz * e.nx;
				Math.abs(i) > require_crowd.crowdLimits.epsilon && this.candidate((t.b * e.nz - t.nz * e.b) / i, (t.nx * e.b - t.b * e.nx) / i);
			}
		}
		e.next.set(d.x, 0, d.z), e.state = d.best === 1 / 0 ? `blocked` : Math.hypot(d.x, e.preferred.y, d.z) < 1e-6 ? Math.hypot(s, c) > 1e-6 ? `blocked` : `idle` : `moving`;
	}
	candidate(e, t) {
		let r = this.candidateScratch;
		if (e * e + t * t > r.speed * r.speed + require_crowd.crowdLimits.epsilon) return;
		for (let i = 0; i < r.count; i++) {
			let r = this.lines[i];
			if (r.nx * e + r.nz * t < r.b - require_crowd.crowdLimits.epsilon) return;
		}
		let i = (e - r.px) ** 2 + (t - r.pz) ** 2;
		i < r.best && (r.best = i, r.x = e, r.z = t);
	}
	destroy() {
		if (this.updating) throw Error(`Destroy crowd outside update callbacks.`);
		for (let e of this.agents.values()) e.state = `removed`, e.velocity.set(0, 0, 0);
		this.agents.clear(), this.obstacles.clear(), this.grid.clear(), this.buckets.length = 0, this.ordered.length = 0, this.neighbors.length = 0, this.disposed = !0;
	}
};
//#endregion
exports.CrowdSolver = CrowdSolver;

//# sourceMappingURL=crowd.cjs.map