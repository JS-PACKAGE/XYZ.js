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
		this.distance[e] === 1 / 0 && (this.touched[this.touchedCount++] = e), this.distance[e] = t, this.parent[e] = r;
		let i = this.heap, a = this.score, o = this.slot, s = o[e];
		for (s < 0 && (s = this.size++); s > 0;) {
			let t = s - 1 >>> 1, r = i[t], c = a[t];
			if (!(n < c || n === c && e < r)) break;
			i[s] = r, a[s] = c, o[r] = s, s = t;
		}
		i[s] = e, a[s] = n, o[e] = s;
	}
	take() {
		if (this.size === 0) return -1;
		let e = this.heap, t = this.score, n = this.slot, r = e[0];
		n[r] = -1;
		let i = --this.size;
		if (i === 0) return r;
		let a = e[i], o = t[i], s = 0;
		for (; s * 2 + 1 < i;) {
			let r = s * 2 + 1, c = e[r], l = t[r];
			if (r + 1 < i) {
				let n = e[r + 1], i = t[r + 1];
				(i < l || i === l && n < c) && (r++, c = n, l = i);
			}
			if (!(l < o || l === o && c < a)) break;
			e[s] = c, t[s] = l, n[c] = s, s = r;
		}
		return e[s] = a, t[s] = o, n[a] = s, r;
	}
};
//#endregion
exports.NavigationSearch = NavigationSearch;

//# sourceMappingURL=search.cjs.map