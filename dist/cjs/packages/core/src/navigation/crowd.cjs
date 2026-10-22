const require_hypot = require("../../../math/src/hypot.cjs");
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
	rows = [];
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
				for (let e of this.grid.values()) {
					for (let t of e.values()) t.length = 0, this.buckets.push(t);
					e.clear(), this.rows.push(e);
				}
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
				this.updating = !1, this.neighbors.length = 0;
			}
		}
	}
	insertDisc(e) {
		let t = Math.floor(e.x / this.neighborDistance), n = Math.floor(e.z / this.neighborDistance), r = this.grid.get(t);
		r || (r = this.rows.pop() ?? /* @__PURE__ */ new Map(), this.grid.set(t, r));
		let i = r.get(n);
		i || (i = this.buckets.pop() ?? [], r.set(n, i)), i.push(e);
	}
	solve(e, t) {
		let r = this.neighbors, o = 0, s = this.neighborDistance, c = s * s, l = c > 1e-290 && c < 1 / 0, u = l ? c * (1 - 1e-9) : -1 / 0, d = l ? c * (1 + 1e-9) : 1 / 0, f = Math.floor(e.x / this.neighborDistance), p = Math.floor(e.z / this.neighborDistance);
		for (let t = f - 1; t <= f + 1; t++) {
			let n = this.grid.get(t);
			if (n) for (let t = p - 1; t <= p + 1; t++) {
				let a = n.get(t);
				if (a) for (let t of a) {
					if (t === e) continue;
					let n = t.x - e.x, a = t.z - e.z, c = n * n + a * a;
					if (!(c > d || c >= u && require_hypot.hypot2(n, a) > s) && (r[o++] = t, o > this.maxNeighbors)) {
						e.next.set(0, 0, 0), e.state = `budget-exceeded`;
						return;
					}
				}
			}
		}
		for (let e = 1; e < o; e++) {
			let t = r[e], n = e - 1;
			for (; n >= 0 && r[n].id > t.id;) r[n + 1] = r[n], n--;
			r[n + 1] = t;
		}
		let m = 0;
		for (let i = 0; i < o; i++) {
			let a = r[i], o = `velocity` in a, s = a.x - e.x, c = a.z - e.z, l = e.velocity.x - (o ? a.velocity.x : 0), u = e.velocity.z - (o ? a.velocity.z : 0), d = e.radius + a.radius + .002, f = s * s + c * c, p = d * d, h, g, _, v, y = 1 / (f > p ? this.timeHorizon : t), b = l - s * y, x = u - c * y, S = b * b + x * x, C = b * s + x * c;
			if (f <= p || C < 0 && C * C > p * S) {
				let t = Math.sqrt(S), r = t > require_crowd.crowdLimits.epsilon ? b / t : e.id < a.id ? -1 : 1, i = t > require_crowd.crowdLimits.epsilon ? x / t : 0;
				h = i, g = -r, _ = (d * y - t) * r, v = (d * y - t) * i;
			} else {
				let e = Math.sqrt(Math.max(0, f - p));
				s * x - c * b > 0 ? (h = (s * e - c * d) / f, g = (s * d + c * e) / f) : (h = -(s * e + c * d) / f, g = -(-s * d + c * e) / f);
				let t = l * h + u * g;
				_ = t * h - l, v = t * g - u;
			}
			let w = this.lines[m++];
			w.nx = -g, w.nz = h;
			let T = o ? .5 : 1;
			w.b = w.nx * (e.velocity.x + T * _) + w.nz * (e.velocity.z + T * v);
		}
		let h = m > 0 ? .05 : 0, g = e.preferred.x - e.preferred.z * h, _ = e.preferred.z + e.preferred.x * h, v = Math.sqrt(Math.max(0, e.maxSpeed ** 2 - e.preferred.y ** 2)), y = require_hypot.hypot2(g, _);
		y > v && (g *= v / y, _ *= v / y);
		let b = this.candidateScratch;
		b.best = 1 / 0, b.x = b.z = 0, b.count = m, b.px = g, b.pz = _, b.speed = v, this.candidate(g, _), this.candidate(0, 0);
		for (let e = 0; e < m; e++) {
			let t = this.lines[e], r = t.b - t.nx * g - t.nz * _;
			this.candidate(g + r * t.nx, _ + r * t.nz);
			let i = v * v - t.b * t.b;
			if (i >= 0) {
				let e = Math.sqrt(i);
				this.candidate(t.nx * t.b - t.nz * e, t.nz * t.b + t.nx * e), this.candidate(t.nx * t.b + t.nz * e, t.nz * t.b - t.nx * e);
			}
			for (let r = 0; r < e; r++) {
				let e = this.lines[r], i = t.nx * e.nz - t.nz * e.nx;
				Math.abs(i) > require_crowd.crowdLimits.epsilon && this.candidate((t.b * e.nz - t.nz * e.b) / i, (t.nx * e.b - t.b * e.nx) / i);
			}
		}
		e.next.set(b.x, 0, b.z), e.state = b.best === 1 / 0 ? `blocked` : require_hypot.hypot3(b.x, e.preferred.y, b.z) < 1e-6 ? require_hypot.hypot2(g, _) > 1e-6 ? `blocked` : `idle` : `moving`;
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