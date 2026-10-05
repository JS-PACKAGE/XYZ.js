const require_errors = require("./errors.cjs");
//#region dist/packages/graphics/src/residency.js
function validateResidencyBudget(e) {
	if (e === void 0 || e === 1 / 0) return 1 / 0;
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`Resource byte budgets must be nonnegative safe integers or Infinity.`);
	return e;
}
var ResidencyPool = class {
	budgetBytes = 1 / 0;
	liveBytes = 0;
	peakBytes = 0;
	evictions = 0;
	allocations = /* @__PURE__ */ new Set();
	clock = 0;
	frame = !1;
	framePins = /* @__PURE__ */ new Set();
	lastFrame = /* @__PURE__ */ new Set();
	capture;
	get entries() {
		return this.allocations.size;
	}
	configure(e) {
		let t = validateResidencyBudget(e);
		this.makeRoom(0, t), this.budgetBytes = t;
	}
	assertBudget(t) {
		let n = validateResidencyBudget(t), r = 0;
		for (let e of this.allocations) (e.references || this.framePins.has(e) || this.capture?.has(e)) && (r += e.bytes);
		if (r > n) throw new require_errors.GraphicsError(`Native resource budget is exhausted by active or retained resources.`);
	}
	beginFrame() {
		this.frame = !0;
	}
	endFrame() {
		this.frame = !1, this.lastFrame.clear();
		for (let e of this.framePins) this.lastFrame.add(e);
		this.framePins.clear();
	}
	abortFrame() {
		this.frame = !1, this.framePins.clear();
	}
	retainFrameResources() {
		let e = [...this.lastFrame];
		for (let t of e) t.retain();
		return e;
	}
	beginCapture() {
		if (this.capture) throw new require_errors.GraphicsError(`Resource preparation cannot be nested.`);
		this.capture = /* @__PURE__ */ new Set();
	}
	endCapture() {
		let e = [...this.capture ?? []];
		this.capture = void 0;
		for (let t of e) t.retain();
		return e;
	}
	allocate(t, n) {
		if (!Number.isSafeInteger(t) || t < 0) throw new require_errors.GraphicsError(`Invalid native resource byte estimate.`);
		this.makeRoom(t, this.budgetBytes);
		let r = new ResidencyAllocation(this, t, n);
		return this.allocations.add(r), this.liveBytes += t, this.peakBytes = Math.max(this.peakBytes, this.liveBytes), this.touch(r), r;
	}
	touch(t) {
		if (t.destroyed) throw new require_errors.GraphicsError(`Native resource was retired.`);
		t.lastUsed = ++this.clock, this.frame && this.framePins.add(t), this.capture?.add(t);
	}
	resize(t, n) {
		if (!Number.isSafeInteger(n) || n < 0) throw new require_errors.GraphicsError(`Invalid native resource byte estimate.`);
		this.touch(t), n !== t.bytes && (this.makeRoom(Math.max(0, n - t.bytes), this.budgetBytes, t), this.liveBytes += n - t.bytes, t.bytes = n, this.peakBytes = Math.max(this.peakBytes, this.liveBytes));
	}
	forget(e) {
		this.allocations.delete(e) && (this.liveBytes -= e.bytes, this.framePins.delete(e), this.lastFrame.delete(e), this.capture?.delete(e));
	}
	clear() {
		for (let e of this.allocations) e.destroy();
		this.endFrame(), this.lastFrame.clear(), this.capture = void 0;
	}
	makeRoom(t, n, r) {
		let i = this.liveBytes + t - n;
		if (i <= 0) return;
		let a = 0;
		for (let e of this.allocations) e !== r && !e.references && !this.framePins.has(e) && !this.capture?.has(e) && (a += e.bytes);
		if (a < i) throw new require_errors.GraphicsError(`Native resource budget is exhausted by active or retained resources.`);
		for (; this.liveBytes + t > n;) {
			let e;
			for (let t of this.allocations) t !== r && !t.references && !this.framePins.has(t) && !this.capture?.has(t) && (!e || t.lastUsed < e.lastUsed) && (e = t);
			e.destroy(), this.evictions++;
		}
	}
};
var ResidencyAllocation = class {
	pool;
	bytes;
	retire;
	references = 0;
	lastUsed = 0;
	destroyed = !1;
	constructor(e, t, n) {
		this.pool = e, this.bytes = t, this.retire = n;
	}
	touch() {
		this.pool.touch(this);
	}
	retain() {
		this.touch(), this.references++;
	}
	release() {
		this.references && this.references--;
	}
	resize(e) {
		this.pool.resize(this, e);
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, this.pool.forget(this), this.retire());
	}
};
var NativeResidency = class {
	textures = new ResidencyPool();
	geometry = new ResidencyPool();
	configure(e) {
		this.textures.assertBudget(e.textureBytes), this.geometry.assertBudget(e.geometryBytes), this.textures.configure(e.textureBytes), this.geometry.configure(e.geometryBytes);
	}
	beginFrame() {
		this.textures.beginFrame(), this.geometry.beginFrame();
	}
	endFrame() {
		this.textures.endFrame(), this.geometry.endFrame();
	}
	abortFrame() {
		this.textures.abortFrame(), this.geometry.abortFrame();
	}
	beginCapture() {
		this.textures.beginCapture(), this.geometry.beginCapture();
	}
	endCapture() {
		return [...this.textures.endCapture(), ...this.geometry.endCapture()];
	}
	retainFrameResources() {
		return [...this.textures.retainFrameResources(), ...this.geometry.retainFrameResources()];
	}
	clear() {
		this.textures.clear(), this.geometry.clear();
	}
};
//#endregion
exports.NativeResidency = NativeResidency;
exports.ResidencyAllocation = ResidencyAllocation;
exports.ResidencyPool = ResidencyPool;
exports.validateResidencyBudget = validateResidencyBudget;

//# sourceMappingURL=residency.cjs.map