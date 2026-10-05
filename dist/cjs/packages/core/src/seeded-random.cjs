const require_utilities = require("../../../src/data/utilities.cjs");
//#region dist/packages/core/src/seeded-random.js
var t = 4294967296;
var SeededRandom = class SeededRandom {
	current;
	constructor(t = require_utilities.utilityDefaults.randomSeed) {
		this.current = SeededRandom.validateState(t);
	}
	get state() {
		return this.current;
	}
	restore(e) {
		return this.current = SeededRandom.validateState(e), this;
	}
	clone() {
		return new SeededRandom(this.current);
	}
	nextUint32() {
		this.current = this.current + 1831565813 >>> 0;
		let e = this.current;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), (e ^ e >>> 14) >>> 0;
	}
	next() {
		return this.nextUint32() / t;
	}
	int(e, n) {
		let r = n - e;
		if (!Number.isSafeInteger(e) || !Number.isSafeInteger(n) || r < 1 || r > t) throw RangeError(`Integer bounds must be safe integers with width in [1, 2^32].`);
		if (r === 1) return e;
		let i = t - t % r, a;
		do
			a = this.nextUint32();
		while (a >= i);
		return e + a % r;
	}
	choose(e) {
		if (e.length === 0) throw RangeError(`Cannot choose from an empty collection.`);
		return e[this.int(0, e.length)];
	}
	shuffle(e) {
		for (let t = e.length - 1; t > 0; t--) {
			let n = this.int(0, t + 1), r = e[t];
			e[t] = e[n], e[n] = r;
		}
		return e;
	}
	static validateState(e) {
		if (!Number.isInteger(e) || e < 0 || e >= t) throw RangeError(`Random seed/state must be an unsigned 32-bit integer.`);
		return e;
	}
};
//#endregion
exports.SeededRandom = SeededRandom;

//# sourceMappingURL=seeded-random.cjs.map