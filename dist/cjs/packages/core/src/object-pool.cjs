const require_utilities = require("../../../src/data/utilities.cjs");
//#region dist/packages/core/src/object-pool.js
var ObjectPoolExhaustedError = class extends Error {
	constructor() {
		super(`Object pool capacity exhausted.`), this.name = `ObjectPoolExhaustedError`;
	}
};
var ObjectPool = class {
	options;
	capacity;
	owned = /* @__PURE__ */ new Set();
	borrowed = /* @__PURE__ */ new Set();
	available = [];
	busy = !1;
	disposed = !1;
	constructor(t) {
		if (this.options = t, this.capacity = t.capacity ?? require_utilities.utilityDefaults.poolCapacity, !Number.isSafeInteger(this.capacity) || this.capacity < 0) throw RangeError(`Pool capacity must be a nonnegative safe integer.`);
	}
	get size() {
		return this.owned.size;
	}
	get borrowedCount() {
		return this.borrowed.size;
	}
	get availableCount() {
		return this.available.length;
	}
	get destroyed() {
		return this.disposed;
	}
	borrow() {
		this.assertMutable();
		let e = this.available.pop();
		if (e === void 0) {
			if (this.owned.size >= this.capacity) throw new ObjectPoolExhaustedError();
			this.busy = !0;
			try {
				if (e = this.options.create(), typeof e != `object` && typeof e != `function` || e === null) throw TypeError(`Pool factory must create an object.`);
				if (this.owned.has(e)) throw Error(`Pool factory returned an already owned object.`);
				this.owned.add(e);
			} finally {
				this.busy = !1;
			}
		}
		return this.borrowed.add(e), e;
	}
	release(e) {
		if (this.assertMutable(), !this.borrowed.delete(e)) throw Error(`Object is not borrowed from this pool.`);
		this.busy = !0;
		try {
			try {
				this.options.reset?.(e);
			} catch (t) {
				this.owned.delete(e);
				try {
					this.options.destroy?.(e);
				} catch (e) {
					throw AggregateError([t, e], `Pool reset and eviction failed.`, { cause: e });
				}
				throw t;
			}
			this.available.push(e);
		} finally {
			this.busy = !1;
		}
	}
	destroy() {
		if (this.busy) throw Error(`Pool callbacks cannot mutate the pool.`);
		if (this.disposed) return;
		this.disposed = !0, this.borrowed.clear(), this.available.length = 0;
		let e = [];
		for (let t of this.owned) try {
			this.options.destroy?.(t);
		} catch (t) {
			e.push(t);
		}
		if (this.owned.clear(), e.length) throw AggregateError(e, `Pool destruction failed.`);
	}
	assertMutable() {
		if (this.disposed) throw Error(`Object pool is destroyed.`);
		if (this.busy) throw Error(`Pool callbacks cannot mutate the pool.`);
	}
};
//#endregion
exports.ObjectPool = ObjectPool;
exports.ObjectPoolExhaustedError = ObjectPoolExhaustedError;

//# sourceMappingURL=object-pool.cjs.map