//#region dist/packages/core/src/navigation/search.js
var NavigationSearch = class {
	distance;
	parent;
	score;
	heap;
	slot;
	touched;
	touchedCount = 0;
	size = 0;
	constructor(e) {
		this.distance = new Float64Array(e).fill(1 / 0), this.parent = new Int32Array(e).fill(-1), this.score = new Float64Array(e), this.heap = new Int32Array(e), this.slot = new Int32Array(e).fill(-1), this.touched = new Int32Array(e);
	}
	reset() {
		let { distance: e, parent: t, slot: n, touched: r } = this;
		for (let i = 0; i < this.touchedCount; i++) {
			let a = r[i];
			e[a] = 1 / 0, t[a] = -1, n[a] = -1;
		}
		this.touchedCount = 0, this.size = 0;
	}
	offer(e, t, n, r) {
		this.distance[e] === 1 / 0 && (this.touched[this.touchedCount++] = e), this.distance[e] = t, this.parent[e] = r, this.score[e] = n;
		let i = this.slot[e];
		for (i < 0 && (i = this.size++, this.heap[i] = e, this.slot[e] = i); i > 0;) {
			let t = i - 1 >>> 1, n = this.heap[t];
			if (!this.before(e, n)) break;
			this.heap[i] = n, this.slot[n] = i, i = t;
		}
		this.heap[i] = e, this.slot[e] = i;
	}
	take() {
		if (this.size === 0) return -1;
		let e = this.heap[0];
		this.slot[e] = -1;
		let t = this.heap[--this.size];
		if (this.size === 0) return e;
		let n = 0;
		for (; n * 2 + 1 < this.size;) {
			let e = n * 2 + 1;
			e + 1 < this.size && this.before(this.heap[e + 1], this.heap[e]) && e++;
			let r = this.heap[e];
			if (!this.before(r, t)) break;
			this.heap[n] = r, this.slot[r] = n, n = e;
		}
		return this.heap[n] = t, this.slot[t] = n, e;
	}
	before(e, t) {
		return this.score[e] < this.score[t] || this.score[e] === this.score[t] && e < t;
	}
};
//#endregion
exports.NavigationSearch = NavigationSearch;

//# sourceMappingURL=search.cjs.map