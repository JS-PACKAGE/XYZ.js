const require_math3d = require("../../../math/src/math3d.cjs");
//#region dist/packages/core/src/physics3d/spatial.js
var Bounds3D = class {
	min = new require_math3d.Vector3(1 / 0, 1 / 0, 1 / 0);
	max = new require_math3d.Vector3(-1 / 0, -1 / 0, -1 / 0);
	reset() {
		this.min.set(1 / 0, 1 / 0, 1 / 0), this.max.set(-1 / 0, -1 / 0, -1 / 0);
	}
	add(e) {
		this.min.x = Math.min(this.min.x, e.x), this.min.y = Math.min(this.min.y, e.y), this.min.z = Math.min(this.min.z, e.z), this.max.x = Math.max(this.max.x, e.x), this.max.y = Math.max(this.max.y, e.y), this.max.z = Math.max(this.max.z, e.z);
	}
	union(e, t) {
		this.min.set(Math.min(e.min.x, t.min.x), Math.min(e.min.y, t.min.y), Math.min(e.min.z, t.min.z)), this.max.set(Math.max(e.max.x, t.max.x), Math.max(e.max.y, t.max.y), Math.max(e.max.z, t.max.z));
	}
	swept(e, t, n = 0) {
		this.min.set(e.min.x + Math.min(0, t.x) - n, e.min.y + Math.min(0, t.y) - n, e.min.z + Math.min(0, t.z) - n), this.max.set(e.max.x + Math.max(0, t.x) + n, e.max.y + Math.max(0, t.y) + n, e.max.z + Math.max(0, t.z) + n);
	}
	overlaps(e, t = 0) {
		return this.min.x <= e.max.x + t && this.max.x + t >= e.min.x && this.min.y <= e.max.y + t && this.max.y + t >= e.min.y && this.min.z <= e.max.z + t && this.max.z + t >= e.min.z;
	}
};
var Node3D = class {
	bounds = new Bounds3D();
	left;
	right;
	item;
	parent;
};
var SpatialIndex3D = class {
	root;
	nodes = [];
	leaves = [];
	stack = [];
	leafNodes = /* @__PURE__ */ new Map();
	used = 0;
	rebuild(e) {
		this.leaves.length = 0, this.leafNodes.clear();
		for (let t of e) this.leaves.push(t);
		this.used = 0, this.root = this.build(0, e.length), this.nodes.length = this.used;
	}
	build(e, t, n) {
		if (e === t) return;
		let r = this.used++, i = this.nodes[r] ?? (this.nodes[r] = new Node3D());
		if (i.item = void 0, i.left = void 0, i.right = void 0, i.parent = n, t - e === 1) return i.item = this.leaves[e], this.leafNodes.set(i.item, i), i.bounds.union(i.item.bounds, i.item.bounds), i;
		let a = 1 / 0, o = 1 / 0, s = 1 / 0, c = -1 / 0, l = -1 / 0, u = -1 / 0;
		for (let n = e; n < t; n++) {
			let e = this.leaves[n].bounds;
			if (Number.isFinite(e.min.x + e.max.x)) {
				let t = (e.min.x + e.max.x) / 2, n = (e.min.y + e.max.y) / 2, r = (e.min.z + e.max.z) / 2;
				a = Math.min(a, t), o = Math.min(o, n), s = Math.min(s, r), c = Math.max(c, t), l = Math.max(l, n), u = Math.max(u, r);
			}
		}
		let d = c - a >= l - o && c - a >= u - s ? `x` : l - o >= u - s ? `y` : `z`, f = this.leaves.slice(e, t).sort((e, t) => {
			let n = (e.bounds.min[d] + e.bounds.max[d]) / 2, r = (t.bounds.min[d] + t.bounds.max[d]) / 2;
			return (Number.isFinite(n) ? n : 0) - (Number.isFinite(r) ? r : 0) || e.order - t.order;
		});
		for (let n = e; n < t; n++) this.leaves[n] = f[n - e];
		let p = e + t >>> 1;
		return i.left = this.build(e, p, i), i.right = this.build(p, t, i), i.bounds.union(i.left.bounds, i.right.bounds), i;
	}
	refit() {
		for (let e = this.used - 1; e >= 0; e--) {
			let t = this.nodes[e];
			t.item ? t.bounds.union(t.item.bounds, t.item.bounds) : t.bounds.union(t.left.bounds, t.right.bounds);
		}
	}
	update(e) {
		let t = this.leafNodes.get(e);
		if (!t) return 0;
		let n = 0;
		for (; t;) {
			let r = t.bounds, i = t.item ? e.bounds : t.left.bounds, a = t.item ? e.bounds : t.right.bounds, o = Math.min(i.min.x, a.min.x), s = Math.min(i.min.y, a.min.y), c = Math.min(i.min.z, a.min.z), l = Math.max(i.max.x, a.max.x), u = Math.max(i.max.y, a.max.y), d = Math.max(i.max.z, a.max.z);
			if (r.min.x === o && r.min.y === s && r.min.z === c && r.max.x === l && r.max.y === u && r.max.z === d) break;
			r.min.set(o, s, c), r.max.set(l, u, d), ++n, t = t.parent;
		}
		return n;
	}
	query(e, t, n = 0) {
		for (t.length = 0, this.stack.length = 0, this.root && this.stack.push(this.root); this.stack.length;) {
			let r = this.stack.pop();
			r.bounds.overlaps(e, n) && (r.item ? t.push(r.item) : this.stack.push(r.right, r.left));
		}
		t.sort(compareOrder);
	}
	clear() {
		this.root = void 0, this.nodes.length = 0, this.leaves.length = 0, this.stack.length = 0, this.leafNodes.clear(), this.used = 0;
	}
};
function compareOrder(e, t) {
	return e.order - t.order;
}
//#endregion
exports.Bounds3D = Bounds3D;
exports.SpatialIndex3D = SpatialIndex3D;

//# sourceMappingURL=spatial.cjs.map