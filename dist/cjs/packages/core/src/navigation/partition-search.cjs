const require_navigation = require("../../../../src/data/navigation.cjs");
//#region dist/packages/core/src/navigation/partition-search.js
var PartitionSearch = class {
	distance = /* @__PURE__ */ new Map();
	parent = /* @__PURE__ */ new Map();
	slots = /* @__PURE__ */ new Map();
	heap = [];
	scores = [];
	offer(e, t, n, r) {
		this.distance.set(e, t), this.parent.set(e, r);
		let i = this.heap, a = this.scores, o = this.slots.get(e), s = o ?? i.length;
		for (o === void 0 && (i.push(e), a.push(n)); s > 0;) {
			let t = s - 1 >>> 1, r = i[t], o = a[t];
			if (!(n < o || n === o && e < r)) break;
			i[s] = r, a[s] = o, this.slots.set(r, s), s = t;
		}
		i[s] = e, a[s] = n, this.slots.set(e, s);
	}
	take() {
		let e = this.heap, t = this.scores, n = e[0];
		if (n === void 0) return;
		this.slots.delete(n);
		let r = e.pop(), i = t.pop(), a = e.length;
		if (a === 0) return n;
		let o = 0;
		for (; o * 2 + 1 < a;) {
			let n = o * 2 + 1, s = e[n], c = t[n];
			if (n + 1 < a) {
				let r = e[n + 1], i = t[n + 1];
				(i < c || i === c && r < s) && (n++, s = r, c = i);
			}
			if (!(c < i || c === i && s < r)) break;
			e[o] = s, t[o] = c, this.slots.set(s, o), o = n;
		}
		return e[o] = r, t[o] = i, this.slots.set(r, o), n;
	}
};
var PartitionNavigationJob = class {
	operation;
	current;
	release;
	found;
	state = `pending`;
	count = 0;
	value;
	constructor(e, t, n, r) {
		this.operation = e, this.current = t, this.release = n, this.found = r;
	}
	get status() {
		return this.state === `pending` && !this.current() && this.invalidate(), this.state;
	}
	get expansions() {
		return this.count;
	}
	get result() {
		return this.value;
	}
	step(t) {
		if (!Number.isSafeInteger(t) || t < 0 || t > require_navigation.navigationLimits.expansionsPerStep) throw RangeError(`Invalid navigation work budget.`);
		for (let e = 0; e < t && this.status === `pending`; e++) {
			this.count++;
			let e = this.operation();
			e !== void 0 && (this.value = e, this.finish(this.found(e) ? `found` : `unreachable`));
		}
		return this.status;
	}
	cancel() {
		this.finish(`cancelled`);
	}
	invalidate() {
		this.finish(`invalidated`);
	}
	finish(e) {
		this.state === `pending` && (this.state = e, this.operation = void 0, this.release?.(), this.release = void 0);
	}
};
//#endregion
exports.PartitionNavigationJob = PartitionNavigationJob;
exports.PartitionSearch = PartitionSearch;

//# sourceMappingURL=partition-search.cjs.map