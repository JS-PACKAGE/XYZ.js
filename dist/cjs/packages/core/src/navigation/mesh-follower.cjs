const require_math3d = require("../../../math/src/math3d.cjs");
const require_navigation = require("../../../../src/data/navigation.cjs");
const require_follower = require("./follower.cjs");
//#region dist/packages/core/src/navigation/mesh-follower.js
var NavigationMeshFollower3D = class extends require_follower.PathFollower3D {
	mesh;
	route;
	traverseLink;
	constructor(e, t = {}) {
		super(e, t), this.traverseLink = t.traverseLink;
	}
	follow(n, r, i) {
		if (this.assertLive(), !n.isPathCurrent(r) || r.status !== `found` || !Number.isFinite(i) || i < 0 || i > require_navigation.navigationLimits.coordinateExtent) throw RangeError(`A mesh follower requires a current path and finite center offset.`);
		super.setPath({
			status: r.status,
			cost: r.cost,
			nodes: r.waypoints.map((t, n) => ({
				id: `${n}`,
				position: new require_math3d.Vector3(t.position.x, t.position.y + i, t.position.z),
				surfaceY: t.position.y
			}))
		}), this.mesh = n, this.route = r;
	}
	setPath(e) {
		super.setPath(e), this.mesh = void 0, this.route = void 0;
	}
	stop() {
		super.stop(), this.mesh = void 0, this.route = void 0;
	}
	update(e) {
		if (this.assertLive(), this.route && !this.mesh.isPathCurrent(this.route)) {
			this.currentState = `blocked`;
			return;
		}
		super.update(e);
	}
	beforeWaypoint(e, t) {
		let n = this.route, r = this.mesh, i = n?.waypoints[e]?.link;
		if (!i || e === 0) return !0;
		if (this.samplingVelocity) return !1;
		let a = this.traverseLink?.({
			link: i,
			from: this.waypoints[e - 1],
			to: this.waypoints[e],
			controller: this.character,
			deltaSeconds: t
		}) ?? `blocked`;
		if (this.route !== n || !this.character || this.character.destroyed || this.character.object.destroyed || this.currentState !== `following` || !r.isPathCurrent(n) || a === `pending`) return !1;
		let o = this.character.object.position, s = this.waypoints[e];
		return a === `complete` && Math.hypot(o.x - s.x, o.y - s.y, o.z - s.z) <= this.arrivalTolerance ? (this.nextWaypoint++, this.nextWaypoint === this.waypoints.length && (this.currentState = `finished`)) : this.currentState = `blocked`, !1;
	}
	destroy() {
		this.mesh = void 0, this.route = void 0, super.destroy();
	}
};
//#endregion
exports.NavigationMeshFollower3D = NavigationMeshFollower3D;

//# sourceMappingURL=mesh-follower.cjs.map